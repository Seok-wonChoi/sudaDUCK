import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import MiniGameLayout from '@/components/features/minigame/layout/MiniGameLayout';
import CountdownOverlay from '@/components/features/minigame/countdown/CountdownOverlay';
import QuestionPanel from '@/components/features/minigame1/question/QuestionPanel';
import WaitingPanel from '@/components/features/minigame1/waiting/WaitingPanel';
import ResultPanel from '@/components/features/minigame1/result/ResultPanel';
import ReviewPanel from '@/components/features/minigame1/review/ReviewPanel';
import DuckGuide from '@/components/features/minigame2/game/DuckGuide';
import { getReviewQuestions, submitReviewAnswers, getReviewRanking, cleanupGameData } from '@/api/miniGame';
import { getMyProfileCustom } from '@/api/mypage';
import { leaveRoom, getRoomLobby } from '@/api/rooms';
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
  const { publisher, subscribers } = useOpenVidu();

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
  const [participants, setParticipants] = useState([]);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(initialParticipantsCount);
  const [showGuide, setShowGuide] = useState(false);

  // 🎤 뒤로가기 차단 및 세션 종료 로직
  useEffect(() => {
    const handlePopState = async (e) => {
      e.preventDefault();
      if (confirm("게임을 나가시겠습니까? 진행 중인 데이터가 삭제됩니다.")) {
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

  const { voiceLevel, start: startMic, stop: stopMic } = useMicAnalyzer({ threshold: 0.03, holdMs: 220 });

  useEffect(() => {
    if (phase === GAME_PHASE.PLAYING || phase === GAME_PHASE.REVIEW || phase === GAME_PHASE.RESULT) {
      startMic();
    } else {
      stopMic();
    }
  }, [phase, startMic, stopMic]);

  const [voiceLevelsMap, setVoiceLevelsMap] = useState({});

  const handleRankingUpdated = useCallback((payload) => {
    if (payload?.rankings && Array.isArray(payload.rankings)) {
      setRankings(payload.rankings);
      const submitted = payload.rankings.filter(r => r.hasSubmitted).length;
      setSubmittedCount(submitted);
      if (phase === GAME_PHASE.WAITING && submitted >= totalParticipants && totalParticipants > 0) {
        setPhase(GAME_PHASE.RESULT);
      }
    }
  }, [totalParticipants, phase]);

  const handleVoiceLevelChanged = useCallback((payload, senderKey) => {
    const key = payload?.userId || senderKey;
    const level = payload?.level;
    if (!key) return;
    setVoiceLevelsMap((prev) => ({ ...prev, [String(key)]: level || 0 }));
    setTimeout(() => {
      setVoiceLevelsMap((prev) => ({ ...prev, [String(key)]: 0 }));
    }, 500);
  }, []);

  const { sendVoiceLevel, isConnected } = useRoomWebSocket(roomCode, {
    onVoiceLevelChanged: handleVoiceLevelChanged,
    onRankingUpdated: handleRankingUpdated,
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
        if (lobbyData?.members) {
          const list = lobbyData.members.map(m => ({
            key: String(m.userId || m.memberId),
            nickname: m.nickname,
            isMe: m.isMe,
            profileImageUrl: m.profileImageUrl,
            duckCustomJson: m.duckCustomJson
          }));
          setParticipants(list);
          setTotalParticipants(list.length);
        }
      } catch (error) { console.error(error); }
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
          setRankings(ranks);
          const submitted = ranks.filter(r => r.hasSubmitted).length;
          setSubmittedCount(submitted);
          if (submitted >= totalParticipants && totalParticipants > 0) {
            setPhase(GAME_PHASE.RESULT);
          }
        }
      } catch (e) { console.warn(e); }
    }, 3000);
    return () => clearInterval(interval);
  }, [phase, roomId, totalParticipants]);

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
      } catch (error) { navigate('/together', { replace: true }); }
    };
    fetchData();
  }, [roomId, navigate]);

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

  // 최종 제출 (가장 중요한 스나이퍼 로직)
  const handleFinalSubmit = async () => {
    // 🏁 낙관적 업데이트: 서버 응답 전에도 내가 제출했음을 UI에 즉시 반영
    setRankings(prev => prev.map(r => r.isMe ? { ...r, hasSubmitted: true } : r));
    setSubmittedCount(prev => prev + 1);
    setPhase(GAME_PHASE.WAITING);

    try {
      const currentText = blanksState.map(b => b.value.trim() || '').join(', ');
      const finalPayload = allAnswersSnapshot.map((ans, idx) => idx === currentQuestion ? { ...ans, userAnswer: currentText } : ans);
      await submitReviewAnswers(roomId, finalPayload);
    } catch (error) { 
      console.error(error); 
      // 에러 시 롤백 로직 (선택 사항)
    }
  };

  const handleReturnToRoom = async () => {
    if (isHost) await cleanupGameData(roomId);
    navigate('/together/waiting', { state: { ...location.state }, replace: true });
  };

  const handleExit = async () => {
    try {
      if (roomCode) await leaveRoom({ roomCode });
      await cleanupGameData(roomId);
    } catch(e) {}
    navigate('/together', { replace: true });
  };

  if (isLoading) return <MiniGameLayout disableProfileClick={true}>로딩 중...</MiniGameLayout>;

  return (
    <MiniGameLayout
      showGameHeader={phase !== GAME_PHASE.REVIEW}
      participants={participants}
      voiceLevels={voiceLevelsMap}
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
          {showGuide && <DuckGuide message="빈칸을 채우고 Enter를 누르세요!" />}
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
        <ResultPanel rankings={rankings} myProfile={myProfile} onShowReview={() => setPhase(GAME_PHASE.REVIEW)} onReturnToRoom={handleReturnToRoom} onExit={handleExit} />
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
    </MiniGameLayout>
  );
}

const UserAudioComponent = ({ streamManager }) => {
  const audioRef = useRef(null);
  useEffect(() => { if (streamManager && audioRef.current) streamManager.addVideoElement(audioRef.current); }, [streamManager]);
  return <audio autoPlay ref={audioRef} />;
};
