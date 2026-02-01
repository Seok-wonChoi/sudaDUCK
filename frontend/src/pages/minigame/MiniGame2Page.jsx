import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { leaveRoom } from '@/api/rooms';

import MiniGameLayout from '@/components/features/minigame/layout/MiniGameLayout';
import CountdownOverlay from '@/components/features/minigame/countdown/CountdownOverlay';
import CardBoard from '@/components/features/minigame2/game/CardBoard';
import GameStats from '@/components/features/minigame2/game/GameStats';
import DuckGuide from '@/components/features/minigame2/game/DuckGuide';
import ResultPanel from '@/components/features/minigame2/result/ResultPanel';
import CoinRewardNotification from '@/components/features/minigame/CoinReward/CoinRewardNotification';

const MOCK_PARTICIPANTS = [
  { id: 1, name: '장가은', isActive: true },
  { id: 2, name: '이승엽', isActive: true },
  { id: 3, name: '최현웅', isActive: false },
  { id: 4, name: '김가민', isActive: true },
];

// 참여자별 제거한 카드 수 순위 (나중에 백엔드에서 받아올 데이터)
const MOCK_RANKINGS = [
  { id: 1, name: '장가은', cardsRemoved: 10 },
  { id: 4, name: '김가민', cardsRemoved: 8 },
  { id: 2, name: '이승엽', cardsRemoved: 6 },
  { id: 3, name: '최현웅', cardsRemoved: 3 },
];

const MOCK_CARDS = [
  { id: 1, text: '티에서 구 봤어요.' },
  { id: 2, text: '저도요. 댓글 보니까 토요일 오후에 비가 온다던데요.' },
  { id: 3, text: '장소를 바꾸는 건 어때요?' },
  { id: 4, text: '글 올린 사람이 기상청 캡처도 같이 올렸더라고요.' },
  { id: 5, text: '그러면 시간대를 바꿀 수 있어요? 오전으로 당길 수 있어요?' },
  { id: 6, text: '축하를 해줘야겠다. 선물로 뭘 좋아할까.' },
  { id: 7, text: '그럼 장소를 바꾸는 건' },
  { id: 8, text: '실내 대안으로 전시회도 괜찮다고 댓글에 추천 있던데요.' },
  { id: 9, text: '좋아요. 비 오면 전시회로 가고, 안 오면 원래대로 하죠.' },
  { id: 10, text: '좋겠네요.' },
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

  const currentUserId = 1; // 현재 사용자 ID
  const roomId = location.state?.roomId;

  // ✅ phase를 state로 두지 않고, 아래 상태들로 "계산"해서 사용
  const [countdown, setCountdown] = useState(3);
  const [timer, setTimer] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [removedCards, setRemovedCards] = useState([]);
  const [showGuide, setShowGuide] = useState(true);
  const [showCoinReward, setShowCoinReward] = useState(false);

  const isCleared = removedCards.length >= MOCK_CARDS.length;
  const isTimeOver = timeLeft <= 0;

  const phase =
    countdown > 0
      ? GAME_PHASE.COUNTDOWN
      : isCleared || isTimeOver
        ? GAME_PHASE.RESULT
        : GAME_PHASE.PLAYING;

  // 1) 카운트다운 진행 (setPhase 필요 없음)
  useEffect(() => {
    if (countdown <= 0) return;

    const id = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(id);
  }, [countdown]);

  // 2) 게임 타이머 진행 (timeLeft만 줄이면 RESULT는 phase 계산으로 자동 전환)
  useEffect(() => {
    if (phase !== GAME_PHASE.PLAYING) return;

    const id = setInterval(() => {
      setTimer((t) => t + 1);
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [phase]);

  // 3) 가이드 3초 후 숨김
  useEffect(() => {
    if (phase === GAME_PHASE.PLAYING && showGuide) {
      const id = setTimeout(() => setShowGuide(false), 3000);
      return () => clearTimeout(id);
    }
  }, [phase, showGuide]);

  // 4) 결과 화면에서 1등이면 코인 지급
  useEffect(() => {
    if (phase === GAME_PHASE.RESULT) {
      // 1등 확인 (가장 많은 카드를 제거한 사람)
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

  // 로고 클릭 시 나가기 핸들러
  const handleLogoExit = useCallback(async () => {
    if (roomId) {
      try {
        await leaveRoom({ roomCode: roomId });
        console.log("[MiniGame2Page] 방 퇴장 성공");
      } catch (e) {
        console.error("[MiniGame2Page] 방 퇴장 실패:", e);
      }
    }
  }, [roomId]);

  const handleComplete = () => {
    navigate('/main');
  };

  if (phase === GAME_PHASE.COUNTDOWN) {
    return (
      <CountdownOverlay
        count={countdown}
        title="준비되셨나요?"
        subtitle="제시된 카드를 영어로 말해보세요!"
      />
    );
  }

  const progress = (removedCards.length / MOCK_CARDS.length) * 100;
  const title = phase === GAME_PHASE.RESULT ? '카드 제거하기 결과' : '카드 제거하기';



  return (
    <MiniGameLayout
      title={title}
      badge="MINI 2"
      timer={formatTime(timer)}
      progress={progress}
      totalProgress={100}
      participants={MOCK_PARTICIPANTS}
      logoExitMessage="메인 화면으로 나가시겠습니까?"
      onLogoExit={handleLogoExit}
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
                // TODO: 나중에 STT API로 교체 예정 (임시 테스트용)
                if (!removedCards.includes(cardId)) {
                  setRemovedCards([...removedCards, cardId]);
                }
              }}
            />
            <DuckGuide
              message="문장을 읽어서 카드를 없애봐요!!"
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
