import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { leaveRoom, toggleReady, endRoom } from '@/api/rooms';
import useRoomWebSocket from '@/hooks/useRoomWebSocket';
import { useOpenVidu } from '@/context/OpenViduContext';

import MiniGameLayout from '@/components/features/minigame/layout/MiniGameLayout';
import CountdownOverlay from '@/components/features/minigame/countdown/CountdownOverlay';
import CardBoard from '@/components/features/minigame2/game/CardBoard';
import GameStats from '@/components/features/minigame2/game/GameStats';
import DuckGuide from '@/components/features/minigame2/game/DuckGuide';
import ResultPanel from '@/components/features/minigame2/result/ResultPanel';
import CoinRewardNotification from '@/components/features/minigame/CoinReward/CoinRewardNotification';

const MOCK_PARTICIPANTS = [
  { id: 1, name: '?•Í??Ä', isActive: true },
  { id: 2, name: '?¥Ïäπ??, isActive: true },
  { id: 3, name: 'ÏµúÌòÑ??, isActive: false },
  { id: 4, name: 'ÍπÄÍ∞ÄÎØ?, isActive: true },
];

// Ï∞∏Ïó¨?êÎ≥Ñ ?úÍ±∞??Ïπ¥Îìú ???úÏúÑ (?òÏ§ë??Î∞±Ïóî?úÏóê??Î∞õÏïÑ???∞Ïù¥??
const MOCK_RANKINGS = [
  { id: 1, name: '?•Í??Ä', cardsRemoved: 10 },
  { id: 4, name: 'ÍπÄÍ∞ÄÎØ?, cardsRemoved: 8 },
  { id: 2, name: '?¥Ïäπ??, cardsRemoved: 6 },
  { id: 3, name: 'ÏµúÌòÑ??, cardsRemoved: 3 },
];

const MOCK_CARDS = [
  { id: 1, text: '?∞Ïóê??Íµ?Î¥§Ïñ¥??' },
  { id: 2, text: '?Ä?ÑÏöî. ?ìÍ? Î≥¥ÎãàÍπ??†Ïöî???§ÌõÑ??ÎπÑÍ? ?®Îã§?òÎç∞??' },
  { id: 3, text: '?•ÏÜåÎ•?Î∞îÍæ∏??Í±??¥Îïå??' },
  { id: 4, text: 'Í∏Ä ?¨Î¶∞ ?¨Îûå??Í∏∞ÏÉÅÏ≤?Ï∫°Ï≤ò??Í∞ôÏù¥ ?¨Î†∏?îÎùºÍ≥†Ïöî.' },
  { id: 5, text: 'Í∑∏Îü¨Î©??úÍ∞Ñ?ÄÎ•?Î∞îÍ? ???àÏñ¥?? ?§Ï†Ñ?ºÎ°ú ?πÍ∏∏ ???àÏñ¥??' },
  { id: 6, text: 'Ï∂ïÌïòÎ•??¥Ï§ò?ºÍ≤†?? ?†Î¨ºÎ°?Î≠?Ï¢ãÏïÑ?†Íπå.' },
  { id: 7, text: 'Í∑∏Îüº ?•ÏÜåÎ•?Î∞îÍæ∏??Í±? },
  { id: 8, text: '?§ÎÇ¥ ?Ä?àÏúºÎ°??ÑÏãú?åÎèÑ Í¥úÏ∞Æ?§Í≥† ?ìÍ???Ï∂îÏ≤ú ?àÎçò?∞Ïöî.' },
  { id: 9, text: 'Ï¢ãÏïÑ?? Îπ??§Î©¥ ?ÑÏãú?åÎ°ú Í∞ÄÍ≥? ???§Î©¥ ?êÎûò?ÄÎ°??òÏ£†.' },
  { id: 10, text: 'Ï¢ãÍ≤†?§Ïöî.' },
];

const GAME_PHASE = {
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  RESULT: 'result',
};

const GAME_TIME = 30;

export default function MiniGame2Page() {
  const navigate = useNavigate();
  const location = useLocation();
  const { leaveSession } = useOpenVidu();

  const currentUserId = 1; // ?ÑÏû¨ ?¨Ïö©??ID
  const roomId = location.state?.roomId;

  // ??phaseÎ•?stateÎ°??êÏ? ?äÍ≥†, ?ÑÎûò ?ÅÌÉú?§Î°ú "Í≥ÑÏÇ∞"?¥ÏÑú ?¨Ïö©
  const [countdown, setCountdown] = useState(3);
  const [timer, setTimer] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [removedCards, setRemovedCards] = useState([]);
  const [showGuide, setShowGuide] = useState(true);
  const [showCoinReward, setShowCoinReward] = useState(false);

  const isCleared = removedCards.length >= MOCK_CARDS.length;
  const isTimeOver = timeLeft <= 0;

  const roomCode = location.state?.roomCode;

  // ??Í≤åÏûÑ ?úÏûë ??Î™®Îì† Ï∞∏Ïó¨?êÏùò ?àÎîî ?ÅÌÉúÎ•??¥Ï†ú (?ÄÍ∏∞Î∞© Î≥µÍ? ??Ï¥àÍ∏∞??Î™©Ï†Å)
  useEffect(() => {
    if (roomCode) {
      toggleReady(roomCode, false).catch(() => {});
    }
  }, [roomCode]);

  const phase =
    countdown > 0
      ? GAME_PHASE.COUNTDOWN
      : isCleared || isTimeOver
        ? GAME_PHASE.RESULT
        : GAME_PHASE.PLAYING;

  // 1) Ïπ¥Ïö¥?∏Îã§??ÏßÑÌñâ (setPhase ?ÑÏöî ?ÜÏùå)
  useEffect(() => {
    if (countdown <= 0) return;

    const id = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(id);
  }, [countdown]);

  // 2) Í≤åÏûÑ ?Ä?¥Î®∏ ÏßÑÌñâ (timeLeftÎß?Ï§ÑÏù¥Î©?RESULT??phase Í≥ÑÏÇ∞?ºÎ°ú ?êÎèô ?ÑÌôò)
  useEffect(() => {
    if (phase !== GAME_PHASE.PLAYING) return;

    const id = setInterval(() => {
      setTimer((t) => t + 1);
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [phase]);

  // 3) Í∞Ä?¥Îìú 3Ï¥????®Í?
  useEffect(() => {
    if (phase === GAME_PHASE.PLAYING && showGuide) {
      const id = setTimeout(() => setShowGuide(false), 3000);
      return () => clearTimeout(id);
    }
  }, [phase, showGuide]);

  // 4) Í≤∞Í≥º ?îÎ©¥?êÏÑú 1?±Ïù¥Î©?ÏΩîÏù∏ ÏßÄÍ∏?
  useEffect(() => {
    if (phase === GAME_PHASE.RESULT) {
      // 1???ïÏù∏ (Í∞Ä??ÎßéÏ? Ïπ¥ÎìúÎ•??úÍ±∞???¨Îûå)
      const firstPlace = MOCK_RANKINGS[0];
      if (firstPlace && firstPlace.id === currentUserId) {
        const timer = setTimeout(() => {
          setShowCoinReward(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, currentUserId]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleRetry = () => {
    setCountdown(3);
    setTimer(0);
    setTimeLeft(GAME_TIME);
    setRemovedCards([]);
    setShowGuide(true);
  };

  // Î∞©Ïû• ?¥Ïû• ??Î©îÏù∏ ?îÎ©¥?ºÎ°ú Í∞ïÏ†ú ?¥Îèô
  const handleRoomClosed = useCallback(() => {
    // console.log("[MiniGame2Page] ROOM_CLOSED ?òÏã† - Î∞©Ïû• ?¥Ïû•");
    leaveSession();
    navigate("/main", {
      replace: true,
      state: { toastMessage: "Î∞©Ïû•???¥Ïû•?òÏó¨ ?Ä?îÍ? Ï¢ÖÎ£å?òÏóà?µÎãà??" },
    });
  }, [navigate, leaveSession]);

  useRoomWebSocket(roomId, {
    onRoomClosed: handleRoomClosed,
  }, roomId);

  // Î°úÍ≥† ?¥Î¶≠ ???òÍ?Í∏??∏Îì§??
  const handleLogoExit = useCallback(async () => {
    if (roomId) {
      try {
        leaveSession();
        await leaveRoom({ roomCode: roomId });
        // console.log("[MiniGame2Page] Î∞??¥Ïû• ?±Í≥µ");
      } catch (e) {
        console.error("[MiniGame2Page] Î∞??¥Ïû• ?§Ìå®:", e);
      }
    }
  }, [roomId, leaveSession]);

  const handleComplete = async () => {
    const isHost = location.state?.isHost;
    const roomCode = location.state?.roomCode;

    try {
      if (isHost && roomCode) {
        await endRoom(roomCode);
      }
      if (roomCode) {
        await toggleReady(roomCode, false);
      }
    } catch (e) {
      console.error('[MiniGame2] ?ÄÍ∏∞Î∞© Î≥µÍ? Ï≤òÎ¶¨ Ï§??§Î•ò(Î¨¥Ïãú?òÍ≥† ?¥Îèô):', e);
    }

    navigate('/together/waiting', { 
      state: { 
        ...location.state,
        fromGame: true,
        participants: [], // ?ëà Îπ?Î∞∞Ïó¥Î°??òÍ≤®???úÎ≤Ñ ?∞Ïù¥???àÎ°úÍ≥†Ïπ® ?†ÎèÑ
        readyCount: 0 
      },
      replace: true 
    });
  };

  if (phase === GAME_PHASE.COUNTDOWN) {
    return (
      <CountdownOverlay
        count={countdown}
        title="Ï§ÄÎπÑÎêò?®ÎÇò??"
        subtitle="?úÏãú??Ïπ¥ÎìúÎ•??ÅÏñ¥Î°?ÎßêÌï¥Î≥¥ÏÑ∏??"
      />
    );
  }

  const progress = (removedCards.length / MOCK_CARDS.length) * 100;
  const title = phase === GAME_PHASE.RESULT ? 'Ïπ¥Îìú ?úÍ±∞?òÍ∏∞ Í≤∞Í≥º' : 'Ïπ¥Îìú ?úÍ±∞?òÍ∏∞';



  return (
    <MiniGameLayout
      title={title}
      badge="MINI 2"
      timer={formatTime(timer)}
      progress={progress}
      totalProgress={100}
      logoExitMessage="Î©îÏù∏ ?îÎ©¥?ºÎ°ú ?òÍ??úÍ≤†?µÎãàÍπ?"
      onLogoExit={handleLogoExit}
      disableProfileClick={true}
    >
      {phase === GAME_PHASE.PLAYING && (
        <div className="flex flex-col h-full">
          <GameStats
            current={removedCards.length}
            total={MOCK_CARDS.length}
            timeLeft={timeLeft}
          />
          <div className="relative flex-1 min-h-[400px]">
            <CardBoard
              cards={MOCK_CARDS}
              removedCards={removedCards}
              onCardClick={(cardId) => {
                // TODO: ?òÏ§ë??STT APIÎ°?ÍµêÏ≤¥ ?àÏ†ï (?ÑÏãú ?åÏä§?∏Ïö©)
                if (!removedCards.includes(cardId)) {
                  setRemovedCards([...removedCards, cardId]);
                }
              }}
            />
            <DuckGuide
              message="Î¨∏Ïû•???ΩÏñ¥??Ïπ¥ÎìúÎ•??ÜÏï†Î¥êÏöî!!"
              visible={showGuide}
            />
          </div>
        </div>
      )}

      {phase === GAME_PHASE.RESULT && (
        <ResultPanel
          score={removedCards.length}
          total={MOCK_CARDS.length}
          onRetry={handleRetry}
          onComplete={handleComplete}
        />
      )}

      <CoinRewardNotification
        show={showCoinReward}
        onComplete={() => setShowCoinReward(false)}
        coins={100}
      />
    </MiniGameLayout>
  );
}
