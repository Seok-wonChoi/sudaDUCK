import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import MiniGameLayout from '@/components/features/minigame/layout/MiniGameLayout';
import CountdownOverlay from '@/components/features/minigame/countdown/CountdownOverlay';
import QuestionPanel from '@/components/features/minigame1/question/QuestionPanel';
import WaitingPanel from '@/components/features/minigame1/waiting/WaitingPanel';
import ResultPanel from '@/components/features/minigame1/result/ResultPanel';
import ReviewPanel from '@/components/features/minigame1/review/ReviewPanel';
import DuckGuide from '@/components/features/minigame2/game/DuckGuide';
import CoinRewardNotification from '@/components/features/minigame/CoinReward/CoinRewardNotification';
import { getReviewQuestions, submitReviewAnswers, getReviewRanking, clearReviewData } from '@/api/miniGame';
import { leaveRoom, getRoomLobby } from '@/api/rooms';
import useRoomWebSocket from '@/hooks/useRoomWebSocket';

const GAME_PHASE = {
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  WAITING: 'waiting',
  RESULT: 'result',
  REVIEW: 'review',
};

/**
 * blank_script 파싱 함수
 * 입력: "No [wonder] your [farts] smell so strong."
 * 출력: {
 *   parts: ["No ", " your ", " smell so strong."],
 *   answers: ["wonder", "farts"]
 * }
 */
function parseBlankScript(blankScript) {
  // null이나 undefined 체크
  if (!blankScript) {
    return { parts: [], answers: [] };
  }

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
  if (currentPart) {
    parts.push(currentPart);
  }

  return { parts, answers };
}

export default function MiniGame1Page() {
  const navigate = useNavigate();
  const location = useLocation();
  const [phase, setPhase] = useState(GAME_PHASE.COUNTDOWN);
  const [countdown, setCountdown] = useState(3);
  const [timer, setTimer] = useState(60);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentBlank, setCurrentBlank] = useState(0);
  const [blanksState, setBlanksState] = useState([]);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [showGuide, setShowGuide] = useState(false);
  const [showCoinReward, setShowCoinReward] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rankings, setRankings] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  // ✅ roomId와 roomCode를 모두 받을 수 있도록 수정
  const roomId = location.state?.roomId;
  const roomCode = location.state?.roomCode;
  const isHost = location.state?.isHost || false;

  const {
    participants: wsParticipants,
    voiceLevels,
  } = useRoomWebSocket(roomCode || roomId);

  useEffect(() => {
    const fetchData = async () => {
      if (!roomId) {
        console.error('roomId가 없습니다');
        navigate('/together');
        return;
      }

      try {
        setIsLoading(true);

        const questionsData = await getReviewQuestions(roomId);
        console.log('📚 미니게임 문제 조회:', questionsData);

        // scriptId가 "scores"인 데이터와 null 데이터 필터링
        const validQuestions = questionsData.filter(
          item => item.scriptId !== 'scores' && 
                  item.blank_script && 
                  item.korean && 
                  item.english
        );

        console.log('✅ 유효한 문제:', validQuestions);

        const formattedQuestions = validQuestions.map((item) => {
          const { parts, answers } = parseBlankScript(item.blank_script);

          return {
            scriptId: item.scriptId,
            korean: item.korean,
            english: item.english,
            englishParts: parts,
            blanks: answers.map(answer => ({
              answer: answer.toLowerCase().trim(),
              userAnswer: '',
              status: 'empty'
            })),
          };
        });

        setQuestions(formattedQuestions);
        console.log('✅ 변환된 문제:', formattedQuestions);

        // ✅ roomCode를 사용하여 로비 정보 조회
        if (roomCode) {
          const roomData = await getRoomLobby(roomCode);
          setParticipants(roomData.participants || []);
          
          const me = roomData.participants?.find(p => p.isMe);
          setMyProfile(me);
        } else {
          console.warn('roomCode가 없어 참가자 정보를 불러올 수 없습니다.');
        }

        setIsLoading(false);
      } catch (error) {
        console.error('❌ 미니게임 데이터 조회 실패:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [roomId, roomCode, navigate]);

  const initQuestion = useCallback((qIdx) => {
    const q = questions[qIdx];
    if (q) {
      setBlanksState(q.blanks.map(() => ({ value: '', status: 'empty' })));
      setCurrentBlank(0);
    }
  }, [questions]);

  useEffect(() => {
    if (phase !== GAME_PHASE.COUNTDOWN || countdown <= 0) return;
    const id = setTimeout(() => {
      setCountdown((prev) => {
        const next = prev - 1;
        if (next === 0) {
          setPhase(GAME_PHASE.PLAYING);
          setShowGuide(true);
          initQuestion(0);
        }
        return next;
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [phase, countdown, initQuestion]);

  useEffect(() => {
    if (phase !== GAME_PHASE.PLAYING) return;
    
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          handleTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase === GAME_PHASE.PLAYING && showGuide) {
      const id = setTimeout(() => setShowGuide(false), 3000);
      return () => clearTimeout(id);
    }
  }, [phase, showGuide]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleBlankChange = useCallback((blankIdx, value) => {
    setBlanksState((prev) => {
      const next = [...prev];
      next[blankIdx] = {
        value: value,
        status: 'empty', // 항상 empty 상태 유지 (즉각 피드백 없음)
      };
      return next;
    });
  }, []);

  const handleBlankSubmit = useCallback((blankIdx) => {
    const q = questions[currentQuestion];
    if (!q) return;

    const userAnswer = blanksState[blankIdx]?.value || '';

    // 입력만 저장, 정오답 체크 안 함
    setBlanksState((prev) => {
      const next = [...prev];
      next[blankIdx] = {
        value: userAnswer,
        status: 'filled', // 입력 완료 상태 (색상 변화 없음)
      };
      return next;
    });

    // 다음 빈칸으로 이동 또는 다음 문제로
    if (currentBlank < q.blanks.length - 1) {
      setCurrentBlank(prev => prev + 1);
    } else {
      // 현재 문제 완료
      const answered = {
        scriptId: q.scriptId,
        koreanSentence: q.korean,
        englishSentence: q.english,
        englishParts: q.englishParts,
        blanks: q.blanks.map((b, idx) => ({
          answer: b.answer,
          userAnswer: blanksState[idx]?.value || '',
        })),
      };
      setAnsweredQuestions((prev) => [...prev, answered]);

      // 다음 문제로 또는 완료
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        initQuestion(currentQuestion + 1);
      } else {
        // 모든 문제 완료 - 답안 제출
        submitAnswers([...answeredQuestions, answered]);
      }
    }
  }, [currentQuestion, currentBlank, questions, blanksState, answeredQuestions, initQuestion]);

  const handleTimeUp = useCallback(() => {
    const finalAnswers = [...answeredQuestions];
    
    if (currentQuestion < questions.length) {
      const q = questions[currentQuestion];
      const answered = {
        scriptId: q.scriptId,
        koreanSentence: q.korean,
        englishSentence: q.english,
        englishParts: q.englishParts,
        blanks: q.blanks.map((b, idx) => ({
          answer: b.answer,
          userAnswer: blanksState[idx]?.value || '',
        })),
      };
      finalAnswers.push(answered);
    }

    submitAnswers(finalAnswers);
  }, [answeredQuestions, currentQuestion, questions, blanksState]);

  const submitAnswers = async (answers) => {
    try {
      const apiAnswers = answers.map(ans => ({
        scriptId: ans.scriptId,
        userAnswer: ans.blanks.map(b => b.userAnswer || '').join(', ')
      }));

      console.log('📤 답안 제출:', apiAnswers);

      const result = await submitReviewAnswers(roomId, apiAnswers);
      console.log('✅ 제출 결과:', result);

      setSubmitResult(result);
      
      // 제출 후 서버에서 받은 정보로 정오답 업데이트
      // (리뷰 화면을 위해 answeredQuestions에 isCorrect 추가)
      const updatedAnswers = answers.map((ans, ansIdx) => {
        const blanksWithCorrect = ans.blanks.map(blank => {
          const isCorrect = blank.userAnswer.toLowerCase().trim() === blank.answer.toLowerCase().trim();
          return {
            ...blank,
            isCorrect
          };
        });
        return {
          ...ans,
          blanks: blanksWithCorrect
        };
      });
      setAnsweredQuestions(updatedAnswers);
      
      setPhase(GAME_PHASE.WAITING);

      if (result.correctCount >= 3) {
        setShowCoinReward(true);
      }
    } catch (error) {
      console.error('❌ 답안 제출 실패:', error);
      alert('답안 제출에 실패했습니다.');
    }
  };

  const fetchRanking = async () => {
    try {
      const rankingData = await getReviewRanking(roomId);
      console.log('🏆 랭킹 조회:', rankingData);
      setRankings(rankingData);
      setPhase(GAME_PHASE.RESULT);
    } catch (error) {
      console.error('❌ 랭킹 조회 실패:', error);
    }
  };

  const handleShowReview = () => {
    setPhase(GAME_PHASE.REVIEW);
  };

  const handleBackToResult = () => {
    setPhase(GAME_PHASE.RESULT);
  };

  const handleExit = async () => {
    try {
      if (isHost) {
        await clearReviewData(roomId);
        console.log('✅ 미니게임 데이터 정리 완료');
      }

      // ✅ roomCode를 사용하여 방 나가기
      if (roomCode) {
        await leaveRoom({ roomCode });
      }
      navigate('/together');
    } catch (error) {
      console.error('❌ 나가기 실패:', error);
      navigate('/together');
    }
  };

  if (isLoading) {
    return (
      <MiniGameLayout
        participants={participants}
        voiceLevels={voiceLevels}
        onExit={handleExit}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          fontSize: '1.5rem',
          color: '#666'
        }}>
          문제를 불러오는 중...
        </div>
      </MiniGameLayout>
    );
  }

  const currentQuestionData = questions[currentQuestion];

  return (
    <MiniGameLayout
      participants={participants}
      voiceLevels={voiceLevels}
      onExit={handleExit}
      timer={phase === GAME_PHASE.PLAYING ? formatTime(timer) : null}
    >
      {phase === GAME_PHASE.COUNTDOWN && (
        <CountdownOverlay count={countdown} />
      )}

      {phase === GAME_PHASE.PLAYING && (
        <>
          {showGuide && (
            <DuckGuide 
              message="빈칸을 채우고 Enter를 누르세요!"
            />
          )}
          <QuestionPanel
            current={currentQuestion + 1}
            total={questions.length}
            koreanSentence={currentQuestionData?.korean || ''}
            englishParts={currentQuestionData?.englishParts || []}
            blanks={blanksState}
            currentBlankIndex={currentBlank}
            onBlankChange={handleBlankChange}
            onBlankSubmit={handleBlankSubmit}
          />
        </>
      )}

      {phase === GAME_PHASE.WAITING && (
        <WaitingPanel
          message={submitResult?.message || '다른 참가자를 기다리는 중...'}
          correctCount={submitResult?.correctCount || 0}
          totalQuestions={submitResult?.totalQuestions || questions.length}
          onComplete={fetchRanking}
        />
      )}

      {phase === GAME_PHASE.RESULT && (
        <ResultPanel
          rankings={rankings}
          myProfile={myProfile}
          onShowReview={handleShowReview}
          onExit={handleExit}
        />
      )}

      {phase === GAME_PHASE.REVIEW && (
        <ReviewPanel
          questions={answeredQuestions}
          onBack={handleBackToResult}
        />
      )}

      {showCoinReward && (
        <CoinRewardNotification
          coins={50}
          onClose={() => setShowCoinReward(false)}
        />
      )}
    </MiniGameLayout>
  );
}
