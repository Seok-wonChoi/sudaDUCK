import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import MiniGameLayout from '@/components/features/minigame/layout/MiniGameLayout';
import CountdownOverlay from '@/components/features/minigame/countdown/CountdownOverlay';
import QuestionPanel from '@/components/features/minigame1/question/QuestionPanel';
import WaitingPanel from '@/components/features/minigame1/waiting/WaitingPanel';
import ResultPanel from '@/components/features/minigame1/result/ResultPanel';
import ReviewPanel from '@/components/features/minigame1/review/ReviewPanel';
import DuckGuide from '@/components/features/minigame2/game/DuckGuide';
import ConfirmModal from '@/components/common/ConfirmModal/ConfirmModal';
import CoinRewardNotification from '@/components/features/minigame/CoinReward/CoinRewardNotification';
import { getReviewQuestions, submitReviewAnswers, getReviewRanking, cleanupGameData } from '@/api/miniGame';
import { getMyProfileCustom } from '@/api/mypage';
import { leaveRoom, getRoomLobby, toggleReady, endRoom } from '@/api/rooms';
import useMicAnalyzer from '@/hooks/useMicAnalyzer';
import useRoomWebSocket from '@/hooks/useRoomWebSocket';
import { useOpenVidu } from '@/context/OpenViduContext';

const GAME_PHASE = {
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  WAITING: 'waiting',
  RESULT: 'result',
  REVIEW: 'review',
};

function parseBlankScript(blankScript) {
  if (!blankScript) return { parts: [], answers: [] };
  const parts = [];
  const answers = [];
  let currentPart = '';
  let i = 0;
  while (i < blankScript.length) {
    if (blankScript[i] === '[') {
      parts.push(currentPart);
      currentPart = '';
      const closeIdx = blankScript.indexOf(']', i);
      if (closeIdx === -1) break;
      const answer = blankScript.substring(i + 1, closeIdx);
      answers.push(answer);
      i = closeIdx + 1;
    } else {
      currentPart += blankScript[i];
      i++;
    }
  }
  if (currentPart) parts.push(currentPart);
  return { parts, answers };
}

export default function MiniGame1Page() {
  const navigate = useNavigate();
  const location = useLocation();
  const { publisher, subscribers, leaveSession } = useOpenVidu();

  const roomId = location.state?.roomId;
  const roomCode = location.state?.roomCode;
  const isHost = location.state?.isHost || false;
  const initialParticipantsCount = location.state?.participantsCount || 1;
  const timeLimit = location.state?.timeLimit || 40;
  
  const [phase, setPhase] = useState(GAME_PHASE.COUNTDOWN);
  const [countdown, setCountdown] = useState(3);
  const [timer, setTimer] = useState(timeLimit);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentBlank, setCurrentBlank] = useState(0);
  const [blanksState, setBlanksState] = useState([]);
  const [allAnswersSnapshot, setAllAnswersSnapshot] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rankings, setRankings] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [participants, setParticipants] = useState(location.state?.participants || []);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(initialParticipantsCount);
  const [showGuide, setShowGuide] = useState(false);
  const [showCoinReward, setShowCoinReward] = useState(false);
  const hasShownRewardRef = useRef(false);

  // ??ìµœì‹  ?íƒœë¥?ì°¸ì¡°?˜ê¸° ?„í•œ Ref??(?€?´ë¨¸ ?´ë¡œ?€ ë¬¸ì œ ?´ê²°)
  const currentQuestionRef = useRef(0);
  const blanksStateRef = useRef([]);
  const allAnswersSnapshotRef = useRef([]);

  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);
  useEffect(() => { blanksStateRef.current = blanksState; }, [blanksState]);
  useEffect(() => { allAnswersSnapshotRef.current = allAnswersSnapshot; }, [allAnswersSnapshot]);

  useEffect(() => {
    if (phase === GAME_PHASE.RESULT && rankings.length >= 2 && !hasShownRewardRef.current && myProfile) {
      // 1. ?ìˆ˜???•ë ¬ (?ìˆ˜ê°€ ê°™ìœ¼ë©?ë°°ì—´ ?œì„œ ? ì?)
      const sorted = [...rankings].sort((a, b) => (b.score || 0) - (a.score || 0));
      const winner = sorted[0];
      if (!winner) return;

      // 2. ??ID?€ 1??ID ë¹„êµ
      const myId = String(myProfile.userId || myProfile.memberId || myProfile.id);
      const winnerId = String(winner.userId || winner.memberId || winner.id);
      
      const isWinnerMe = winner.isMe || winner.me || (winnerId !== 'undefined' && winnerId === myId);

      // 3. ?´ê? 1?±ì´ê³??ìˆ˜ê°€ 1???´ìƒ?´ë©´ ?¤í–‰
      if (isWinnerMe && (winner.score || 0) > 0) {
        hasShownRewardRef.current = true;
        setTimeout(() => {
          setShowCoinReward(true);
        }, 800);
      }
    }
  }, [phase, rankings, myProfile]);

  // ?Ž¤ ?¤ë¡œê°€ê¸?ì°¨ë‹¨ ë°??¸ì…˜ ì¢…ë£Œ ë¡œì§
  useEffect(() => {
    const handlePopState = async (e) => {
      e.preventDefault();
      if (confirm("ê²Œìž„???˜ê??œê² ?µë‹ˆê¹? ì§„í–‰ ì¤‘ì¸ ?°ì´?°ê? ?? œ?©ë‹ˆ??")) {
        await handleExit();
      } else {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [roomCode, roomId]);

  useEffect(() => {
    if (publisher) publisher.publishAudio(true);
  }, [publisher]);

  // ??ê²Œìž„ ?œìž‘ ??ëª¨ë“  ì°¸ì—¬?ì˜ ?ˆë”” ?íƒœë¥??´ì œ (?€ê¸°ë°© ë³µê? ??ì´ˆê¸°??ëª©ì )
  useEffect(() => {
    if (roomCode) {
      toggleReady(roomCode, false).catch(() => {});
    }
  }, [roomCode]);

  const { voiceLevel, start: startMic, stop: stopMic } = useMicAnalyzer({ threshold: 0.03, holdMs: 220 });

  useEffect(() => {
    if (phase === GAME_PHASE.PLAYING || phase === GAME_PHASE.REVIEW || phase === GAME_PHASE.RESULT) {
      startMic();
    } else {
      stopMic();
    }
  }, [phase, startMic, stopMic]);

  // ??‚¹ ?°ì´?°ì— ?„ë¡œ???•ë³´(duckCustomJson ?? ë³‘í•©?˜ëŠ” ?¬í¼ ?¨ìˆ˜
  const mergeRankingData = useCallback((ranks) => {
    if (!ranks || !Array.isArray(ranks)) return [];
    
    const myId = myProfile ? String(myProfile.userId || myProfile.memberId || myProfile.id) : null;

    return ranks.map(item => {
      const itemId = String(item.userId || item.memberId || item.id || '');
      const itemNickname = item.nickname;
      
      // ì°¸ì—¬??ëª©ë¡?ì„œ ?´ë‹¹ ? ì? ì°¾ê¸° (ID ?°ì„ , ?‰ë„¤??ì°¨ì„ )
      const originalInfo = participants.find(p => 
        (itemId && itemId !== 'undefined' && String(p.key) === itemId) || 
        (itemNickname && p.nickname === itemNickname)
      );

      // ?œë²„?ì„œ ì§ì ‘ ì¤€ ì»¤ìŠ¤?€ ?•ë³´ê°€ ?ˆëŠ”ì§€ ?•ì¸
      const hasValidServerJson = item.duckCustomJson && 
        (typeof item.duckCustomJson === 'object' || (typeof item.duckCustomJson === 'string' && item.duckCustomJson.trim().length > 0));
      
      // ìµœì¢…?ìœ¼ë¡??¬ìš©??duckCustomJson ê²°ì • (?œë²„ ?°ì´??> ë¡œì»¬ ì°¸ì—¬???•ë³´ > ?œë²„ ?°ì´??
      const finalDuckJson = hasValidServerJson ? item.duckCustomJson : (originalInfo?.duckCustomJson || item.duckCustomJson);

      return {
        ...item,
        duckCustomJson: finalDuckJson,
        profileImageUrl: item.profileImageUrl || originalInfo?.profileImageUrl,
        isMe: item.isMe || item.me || (myId !== null && itemId === myId) || (itemNickname && myProfile?.nickname === itemNickname)
      };
    });
  }, [participants, myProfile]);

  const handleRankingUpdated = useCallback((payload) => {
    if (payload?.rankings && Array.isArray(payload.rankings)) {
      const enrichedRanks = mergeRankingData(payload.rankings);
      setRankings(enrichedRanks);
      const submitted = enrichedRanks.filter(r => r.hasSubmitted).length;
      setSubmittedCount(submitted);
      if (phase === GAME_PHASE.WAITING && submitted >= totalParticipants && totalParticipants > 0) {
        setPhase(GAME_PHASE.RESULT);
      }
    }
  }, [totalParticipants, phase, mergeRankingData]);

  // ë°©ìž¥ ?´ìž¥ ??ë©”ì¸ ?”ë©´?¼ë¡œ ê°•ì œ ?´ë™
  const handleRoomClosed = useCallback(() => {
    // console.log("[MiniGame1Page] ROOM_CLOSED ?˜ì‹  - ë°©ìž¥ ?´ìž¥");
    leaveSession();
    navigate("/main", {
      replace: true,
      state: { toastMessage: "ë°©ìž¥???´ìž¥?˜ì—¬ ?€?”ê? ì¢…ë£Œ?˜ì—ˆ?µë‹ˆ??" },
    });
  }, [navigate, leaveSession]);

  const { sendVoiceLevel, isConnected } = useRoomWebSocket(roomCode, {
    onRankingUpdated: handleRankingUpdated,
    onRoomClosed: handleRoomClosed,
  });

  useEffect(() => {
    if (!isConnected || voiceLevel < 0.05) return;
    sendVoiceLevel(voiceLevel);
  }, [voiceLevel, isConnected, sendVoiceLevel]);

  useEffect(() => {
    const loadRoomParticipants = async () => {
      if (!roomCode) return;
      try {
        const lobbyData = await getRoomLobby(roomCode);
        // WaitingRoomPage?€ ?™ì¼?˜ê²Œ participants ?ëŠ” members ?„ë“œë¥?ëª¨ë‘ ?•ì¸
        const members = lobbyData?.participants || lobbyData?.members || [];
        
        if (members.length > 0) {
          const list = members.map(m => ({
            key: String(m.userId || m.memberId || m.id),
            nickname: m.nickname,
            isMe: m.isMe,
            profileImageUrl: m.profileImageUrl,
            duckCustomJson: m.duckCustomJson,
            avatarCustomJson: m.avatarCustomJson // ?‰ë„¤???¤í??????¹ì‹œ ëª¨ë? ?•ìž¥ ?€ë¹?
          }));
          // console.log("[MiniGame1] ì°¸ì—¬???„ë¡œ??ë¡œë“œ ?±ê³µ:", list.length, "ëª?);
          setParticipants(list);
          setTotalParticipants(list.length);
        }
      } catch (error) { console.error("[MiniGame1] ì°¸ì—¬??ë¡œë“œ ?¤íŒ¨:", error); }
    };
    loadRoomParticipants();
  }, [roomCode]);

  useEffect(() => {
    const fetchMyProfile = async () => {
      try {
        const data = await getMyProfileCustom();
        if (data) setMyProfile(data);
      } catch (error) { console.error(error); }
    };
    fetchMyProfile();
  }, []);

  useEffect(() => {
    if (phase !== GAME_PHASE.WAITING) return;
    const interval = setInterval(async () => {
      try {
        const data = await getReviewRanking(roomId);
        const ranks = Array.isArray(data) ? data : data?.rankings;
        if (ranks) {
          const enrichedRanks = mergeRankingData(ranks);
          setRankings(enrichedRanks);
          const submitted = enrichedRanks.filter(r => r.hasSubmitted).length;
          setSubmittedCount(submitted);
          if (submitted >= totalParticipants && totalParticipants > 0) {
            setPhase(GAME_PHASE.RESULT);
          }
        }
      } catch (e) { console.warn(e); }
    }, 3000);
    return () => clearInterval(interval);
  }, [phase, roomId, totalParticipants, mergeRankingData]);

  useEffect(() => {
    const fetchData = async () => {
      if (!roomId) { navigate('/together', { replace: true }); return; }
      try {
        setIsLoading(true);
        const data = await getReviewQuestions(roomId);
        const uniqueMap = new Map();
        data.forEach(q => { if (q.scriptId !== 'scores' && q.blank_script?.includes('[')) uniqueMap.set(q.scriptId, q); });
        const formatted = Array.from(uniqueMap.values()).slice(0, 4).map(item => {
          const { parts, answers } = parseBlankScript(item.blank_script);
          return { scriptId: item.scriptId, korean: item.korean, english: item.english, englishParts: parts, blanks: answers.map(ans => ({ answer: ans.trim() })), };
        });
        if (formatted.length === 0) throw new Error('No Questions');
        setQuestions(formatted);
        setAllAnswersSnapshot(formatted.map(q => ({ scriptId: q.scriptId, userAnswer: Array(q.blanks.length).fill('').join(', ') })));
        initBlanks(0, formatted);
        setIsLoading(false);
      } catch (error) {
        console.error('[MiniGame1] ?°ì´??ë¡œë“œ ?¤íŒ¨:', error);
        // ì¦‰ì‹œ ?€ê¸°ë°©?¼ë¡œ ?´ë™?˜ë©° ? ìŠ¤??ë©”ì‹œì§€ ?„ë‹¬
        navigate('/together/waiting', { 
          state: { 
            roomId, 
            roomCode, 
            isHost,
            participantsCount: initialParticipantsCount,
            timeLimit,
            toastMessage: '?€??ê¸°ë¡??ë¶€ì¡±í•˜??ë³µìŠµ ê²Œìž„??ì§„í–‰?????†ìŠµ?ˆë‹¤.'
          }, 
          replace: true 
        });
      }
    };
    fetchData();
  }, [roomId, roomCode, isHost, initialParticipantsCount, timeLimit, navigate]);

  const initBlanks = (qIdx, qs) => {
    const q = qs[qIdx];
    if (q) {
      setBlanksState(q.blanks.map(() => ({ value: '', status: 'empty' })));
      setCurrentBlank(0);
    }
  };

  useEffect(() => {
    if (phase === GAME_PHASE.COUNTDOWN) {
      const id = setInterval(() => { setCountdown(c => { if (c <= 1) { setPhase(GAME_PHASE.PLAYING); setShowGuide(true); return 0; } return c - 1; }); }, 1000);
      return () => clearInterval(id);
    }
    if (phase === GAME_PHASE.PLAYING) {
      const id = setInterval(() => { setTimer(t => { if (t <= 1) { handleFinalSubmit(); return 0; } return t - 1; }); }, 1000);
      return () => clearInterval(id);
    }
  }, [phase]);

  const handleBlankChange = (idx, val) => {
    setBlanksState(prev => { const next = [...prev]; next[idx] = { ...next[idx], value: val }; return next; });
  };

  const handleBlankSubmit = (idx) => {
    const q = questions[currentQuestion];
    if (currentBlank < q.blanks.length - 1) {
      setCurrentBlank(prev => prev + 1);
    } else {
      const currentText = blanksState.map(b => b.value.trim() || '').join(', ');
      setAllAnswersSnapshot(prev => { const next = [...prev]; next[currentQuestion] = { ...next[currentQuestion], userAnswer: currentText }; return next; });
      if (currentQuestion < questions.length - 1) {
        const nextIdx = currentQuestion + 1;
        setCurrentQuestion(nextIdx);
        initBlanks(nextIdx, questions);
      } else { handleFinalSubmit(); }
    }
  };

  // ìµœì¢… ?œì¶œ (ê°€??ì¤‘ìš”???¤ë‚˜?´í¼ ë¡œì§)
  const handleFinalSubmit = async () => {
    // ? ?™ê????…ë°?´íŠ¸: ?œë²„ ?‘ë‹µ ?„ì—???´ê? ?œì¶œ?ˆìŒ??UI??ì¦‰ì‹œ ë°˜ì˜
    setRankings(prev => prev.map(r => r.isMe ? { ...r, hasSubmitted: true } : r));
    setSubmittedCount(prev => prev + 1);
    setPhase(GAME_PHASE.WAITING);

    try {
      // ??Refë¥??¬ìš©?˜ì—¬ ?´ë¡œ?€??ê°‡ížˆì§€ ?Šì? ìµœì‹  ê°?ì°¸ì¡°
      const currentText = blanksStateRef.current.map(b => b.value.trim() || '').join(', ');
      const finalPayload = allAnswersSnapshotRef.current.map((ans, idx) => 
        idx === currentQuestionRef.current ? { ...ans, userAnswer: currentText } : ans
      );
      
      // console.log("[MiniGame1] ìµœì¢… ?œì¶œ ?°ì´??", finalPayload);
      await submitReviewAnswers(roomId, finalPayload);
    } catch (error) { 
      console.error("[MiniGame1] ìµœì¢… ?œì¶œ ?¤íŒ¨:", error); 
    }
  };

  const handleReturnToRoom = async () => {
    try {
      if (isHost && roomCode) {
        await endRoom(roomCode);
        await cleanupGameData(roomId);
      }
      if (roomCode) {
        await toggleReady(roomCode, false);
      }
    } catch (e) {
      console.error('[MiniGame1] ?€ê¸°ë°© ë³µê? ì²˜ë¦¬ ì¤??¤ë¥˜(ë¬´ì‹œ?˜ê³  ?´ë™):', e);
    }

    // API ?±ê³µ ?¬ë??€ ê´€ê³„ì—†??ë°˜ë“œ???€ê¸°ë°©?¼ë¡œ ?´ë™
    navigate('/together/waiting', { 
      state: { 
        ...location.state,
        fromGame: true,
        // ì°¸ì—¬??ëª…ë‹¨?€ ? ì??˜ë˜, ?íƒœë§??„ë? ?€ê¸°ë¡œ ê°•ì œ ì´ˆê¸°?”í•´???˜ê?
        participants: participants.map(p => ({ ...p, isReady: false, readyStatus: 'NOT_READY' })),
        readyCount: 0 
      }, 
      replace: true 
    });
  };

  const handleCoinRewardComplete = useCallback(() => {
    setShowCoinReward(false);
  }, []);

  const handleExit = async () => {
    try {
      leaveSession();
      if (roomCode) await leaveRoom({ roomCode });
      await cleanupGameData(roomId);
    } catch(e) {}
    navigate('/together', { replace: true });
  };

  if (isLoading) return <MiniGameLayout disableProfileClick={true}>ë¡œë”© ì¤?..</MiniGameLayout>;

  return (
    <MiniGameLayout
      showGameHeader={phase !== GAME_PHASE.REVIEW && phase !== GAME_PHASE.RESULT}
      onExit={handleExit}
      timer={phase === GAME_PHASE.PLAYING ? `${Math.floor(timer/60)}:${(timer%60).toString().padStart(2,'0')}` : null}
      progress={timer}
      totalProgress={timeLimit}
      isReviewMode={phase === GAME_PHASE.REVIEW}
      disableProfileClick={true}
    >
      {subscribers.map((sub) => (
        <UserAudioComponent key={sub.stream.connection.connectionId} streamManager={sub} />
      ))}

      {phase === GAME_PHASE.COUNTDOWN && <CountdownOverlay count={countdown} />}

      {phase === GAME_PHASE.PLAYING && (
        <>
          {showGuide && <DuckGuide message="ë¹ˆì¹¸??ì±„ìš°ê³?Enterë¥??„ë¥´?¸ìš”!" />}
          <QuestionPanel
            current={currentQuestion + 1}
            total={questions.length}
            koreanSentence={questions[currentQuestion]?.korean}
            englishParts={questions[currentQuestion]?.englishParts}
            blanks={blanksState}
            currentBlankIndex={currentBlank}
            onBlankChange={handleBlankChange}
            onBlankSubmit={handleBlankSubmit}
            onBlankClick={setCurrentBlank}
          />
        </>
      )}

      {phase === GAME_PHASE.WAITING && (
        <WaitingPanel submittedCount={submittedCount} totalParticipants={totalParticipants} rankings={rankings} />
      )}

      {phase === GAME_PHASE.RESULT && (
        <ResultPanel rankings={rankings} totalQuestions={questions.length} onShowReview={() => setPhase(GAME_PHASE.REVIEW)} onReturnToRoom={handleReturnToRoom} onExit={handleExit} />
      )}

      {phase === GAME_PHASE.REVIEW && (
        <ReviewPanel
          questions={questions.map((q, idx) => ({
            koreanSentence: q.korean,
            englishSentence: q.english,
            englishParts: q.englishParts,
            blanks: q.blanks.map((b, bIdx) => {
              const userAnsArr = allAnswersSnapshot[idx]?.userAnswer.split(', ') || [];
              const userVal = userAnsArr[bIdx] || '';
              return { answer: b.answer, userAnswer: userVal, isCorrect: userVal.toLowerCase().trim() === b.answer.toLowerCase().trim() };
            })
          }))}
          onBack={() => setPhase(GAME_PHASE.RESULT)}
        />
      )}

      <CoinRewardNotification 
        show={showCoinReward} 
        onComplete={handleCoinRewardComplete}
      />
    </MiniGameLayout>
  );
}

const UserAudioComponent = ({ streamManager }) => {
  const audioRef = useRef(null);
  useEffect(() => { if (streamManager && audioRef.current) streamManager.addVideoElement(audioRef.current); }, [streamManager]);
  return <audio autoPlay ref={audioRef} />;
};
