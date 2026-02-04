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
import useMicAnalyzer from '@/hooks/useMicAnalyzer';

const GAME_PHASE = {
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  WAITING: 'waiting',
  RESULT: 'result',
  REVIEW: 'review',
};

/**
 * blank_script 파싱 함수
 */
function parseBlankScript(blankScript) {
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
  const [myProfile, setMyProfile] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);

  const roomId = location.state?.roomId;
  const roomCode = location.state?.roomCode;
  const isHost = location.state?.isHost || false;

  // 마이크 분석기 - 음성 레벨 감지
  const { isSpeaking, voiceLevel, start: startMic, stop: stopMic } = useMicAnalyzer({
    threshold: 0.03,
    holdMs: 220,
  });

  // 마이크 시작 (게임 시작 시)
  useEffect(() => {
    if (phase === GAME_PHASE.PLAYING) {
      startMic();
    }
    return () => {
      stopMic();
    };
  }, [phase, startMic, stopMic]);

  // 참가자 목록 불러오기 (API 사용) - PLAYING과 WAITING 단계에서만
  useEffect(() => {
    // 게임 중이 아니면 호출하지 않음
    if (phase !== GAME_PHASE.PLAYING && phase !== GAME_PHASE.WAITING) {
      return;
    }

    const fetchParticipants = async () => {
      if (!roomCode) return;
      
      try {
        const lobbyData = await getRoomLobby(roomCode);
        console.log('👥 참가자 목록 조회:', lobbyData);
        
        if (lobbyData?.participants) {
          const formattedParticipants = lobbyData.participants.map(p => ({
            id: p.userId || p.id,
            userId: p.userId || p.id,
            name: p.nickname || p.name,
            nickname: p.nickname || p.name,
            profileImageUrl: p.profileImageUrl,
            avatar: p.profileImageUrl, // avatar도 설정
            isActive: true,
            isMe: false,
            voiceLevel: 0,
          }));
          
          setParticipants(formattedParticipants);
          setTotalParticipants(formattedParticipants.length);
          console.log('✅ 참가자 목록 설정 완료:', formattedParticipants);
        }
      } catch (error) {
        console.error('❌ 참가자 목록 조회 실패:', error);
      }
    };

    fetchParticipants();
    
    // 5초마다 참가자 목록 갱신 (PLAYING, WAITING 단계에서만)
    const interval = setInterval(fetchParticipants, 5000);
    return () => clearInterval(interval);
  }, [roomCode, phase]);

  // 내 음성 레벨을 participants에 반영
  useEffect(() => {
    if (voiceLevel > 0) {
      setParticipants(prev => prev.map(p => 
        p.isMe ? { ...p, voiceLevel, isSpeaking } : p
      ));
    }
  }, [voiceLevel, isSpeaking]);

  // 대기 중 제출 상태 확인
  useEffect(() => {
    if (phase !== GAME_PHASE.WAITING) return;

    const checkSubmissionStatus = async () => {
      try {
        const rankingData = await getReviewRanking(roomId);
        console.log('📊 제출 상태 확인:', rankingData);
        
        if (rankingData && Array.isArray(rankingData)) {
          setSubmittedCount(rankingData.length);
          
          // 모든 참가자가 제출했으면 결과 화면으로 이동
          if (rankingData.length >= totalParticipants && totalParticipants > 0) {
            console.log('✅ 모든 참가자 제출 완료! 결과 화면으로 이동');
            setRankings(rankingData);
            setPhase(GAME_PHASE.RESULT);
          }
        }
      } catch (error) {
        console.error('❌ 제출 상태 확인 실패:', error);
      }
    };

    // 즉시 한 번 확인
    checkSubmissionStatus();
    
    // 2초마다 확인
    const interval = setInterval(checkSubmissionStatus, 2000);
    
    return () => clearInterval(interval);
  }, [phase, roomId, totalParticipants]);

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
        console.log('📚 미니게임 문제 조회 (원본):', questionsData);

        const validQuestions = questionsData.filter(
          item => {
            const isValid = item.scriptId !== 'scores' && 
                    item.blank_script && 
                    item.korean && 
                    item.english;
            if (!isValid) {
              console.warn('❌ 필터링된 문제:', item);
            }
            return isValid;
          }
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

        setIsLoading(false);
      } catch (error) {
        console.error('❌ 미니게임 데이터 조회 실패:', error);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [roomId, navigate]);

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
        status: 'empty',
      };
      return next;
    });
  }, []);

  const handleBlankSubmit = useCallback((blankIdx) => {
    const q = questions[currentQuestion];
    if (!q) return;

    const userAnswer = blanksState[blankIdx]?.value || '';

    setBlanksState((prev) => {
      const next = [...prev];
      next[blankIdx] = {
        value: userAnswer,
        status: 'filled',
      };
      return next;
    });

    if (currentBlank < q.blanks.length - 1) {
      setCurrentBlank(prev => prev + 1);
    } else {
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

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        initQuestion(currentQuestion + 1);
      } else {
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
      setSubmittedCount(1); // 내가 제출했으므로 최소 1

      if (result.correctCount >= 3) {
        setShowCoinReward(true);
      }
    } catch (error) {
      console.error('❌ 답안 제출 실패:', error);
      alert('답안 제출에 실패했습니다.');
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

      await leaveRoom({ roomCode });
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
        voiceLevels={{}}
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

  // voiceLevels 객체 생성 - 모든 참가자에게 음성 레벨 전달 (실제로는 내 레벨만 업데이트됨)
  const voiceLevelsMap = {};
  participants.forEach(p => {
    // 내 음성 레벨을 전달 (첫 번째 참가자를 나로 간주)
    if (participants.indexOf(p) === 0) {
      voiceLevelsMap[p.id || p.userId] = voiceLevel;
    } else {
      voiceLevelsMap[p.id || p.userId] = 0;
    }
  });

  console.log('🎤 voiceLevels:', voiceLevelsMap, 'current voiceLevel:', voiceLevel);

  return (
    <MiniGameLayout
      showGameHeader={phase !== GAME_PHASE.REVIEW}
      participants={participants}
      voiceLevels={voiceLevelsMap}
      onExit={handleExit}
      timer={phase === GAME_PHASE.PLAYING ? formatTime(timer) : null}
      progress={phase === GAME_PHASE.PLAYING ? timer : 0}
      totalProgress={60}
      isReviewMode={phase === GAME_PHASE.REVIEW}
      onComplete={phase === GAME_PHASE.REVIEW ? handleBackToResult : null}
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
          submittedCount={submittedCount}
          totalParticipants={totalParticipants}
        />
      )}

      {phase === GAME_PHASE.RESULT && (
        <ResultPanel
          rankings={rankings}
          myProfile={myProfile}
          totalQuestions={questions.length}
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
