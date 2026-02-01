import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// import styles from './MiniGame1Page.module.css';

import MiniGameLayout from '@/components/features/minigame/layout/MiniGameLayout';
import CountdownOverlay from '@/components/features/minigame/countdown/CountdownOverlay';
import QuestionPanel from '@/components/features/minigame1/question/QuestionPanel';
import WaitingPanel from '@/components/features/minigame1/waiting/WaitingPanel';
import ResultPanel from '@/components/features/minigame1/result/ResultPanel';
import ReviewPanel from '@/components/features/minigame1/review/ReviewPanel';
import DuckGuide from '@/components/features/minigame2/game/DuckGuide';
import CoinRewardNotification from '@/components/features/minigame/CoinReward/CoinRewardNotification';
import { getReviewQuestions, submitReviewAnswers, getReviewRanking, clearReviewData } from '@/api/miniGame';
import { leaveRoom } from '@/api/rooms';

const MOCK_PARTICIPANTS = [
  { id: 1, name: '장가은', isActive: true },
  { id: 2, name: '이승엽', isActive: true },
  { id: 3, name: '최현웅', isActive: false },
  { id: 4, name: '김가민', isActive: true },
];

const MOCK_QUESTIONS = [
  {
    korean: '나는 매일 아침 운동을 해요.',
    englishParts: ['', ' ', ' every morning.'],
    blanks: [
      { answer: 'I', userAnswer: 'I' },
      { answer: 'exercise', userAnswer: 'exercise' },
    ],
  },
  {
    korean: '주말에 영화 보러 갈까요?',
    englishParts: ['Shall we ', ' watch a movie this weekend?'],
    blanks: [{ answer: 'go', userAnswer: '' }],
  },
  {
    korean: '케이크도 정말 맛있었어.',
    englishParts: ['The ', ' was ', ' too.'],
    blanks: [
      { answer: 'cake', userAnswer: '' },
      { answer: 'delicious', userAnswer: '' },
    ],
  },
];

const MOCK_RANKINGS = [
  { id: 1, name: '장가은', score: 4, total: 4 },
  { id: 4, name: '김가민', score: 3, total: 4 },
  { id: 3, name: '최현웅', score: 2, total: 4 },
  { id: 2, name: '이승엽', score: 1, total: 4 },
];

const GAME_PHASE = {
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  WAITING: 'waiting',
  RESULT: 'result',
  REVIEW: 'review',
};

export default function MiniGame1Page() {
  const navigate = useNavigate();
  const location = useLocation();
  const [phase, setPhase] = useState(GAME_PHASE.COUNTDOWN);
  const [countdown, setCountdown] = useState(3);
  const [timer, setTimer] = useState(15);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentBlank, setCurrentBlank] = useState(0);
  const [score, setScore] = useState(0);
  const [blanksState, setBlanksState] = useState([]);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [showGuide, setShowGuide] = useState(false);
  const [showCoinReward, setShowCoinReward] = useState(false);
  const [questions, setQuestions] = useState(MOCK_QUESTIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [rankings, setRankings] = useState(MOCK_RANKINGS);
  const [participants, setParticipants] = useState([]);

  const currentUserId = 1;
  const roomId = location.state?.roomId;

  // API에서 문제 데이터 가져오기
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!roomId) {
        console.log('roomId가 없어서 MOCK 데이터 사용');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await getReviewQuestions(roomId);
        console.log('미니게임 문제 조회 성공:', data);

        // API 응답 데이터를 questions 형식으로 변환
        const formattedQuestions = data.map((item) => {
          // blank_script에서 빈칸과 텍스트 분리 (예: "I _____ every morning." -> ["I ", "_____", " every morning."])
          const parts = item.blank_script.split(/(_+)/);
          const englishParts = [];
          const blanks = [];

          parts.forEach((part) => {
            if (part.match(/^_+$/)) {
              // 빈칸인 경우 - 정답은 실제 데이터에서 파싱 필요 (임시로 빈 문자열)
              blanks.push({ answer: '', userAnswer: '' });
              englishParts.push(' ');
            } else if (part) {
              englishParts.push(part);
            }
          });

          return {
            scriptId: item.scriptId,
            korean: item.korean,
            english: item.english,
            englishParts,
            blanks,
          };
        });

        setQuestions(formattedQuestions);

        // 참여자 정보 추출 (speakerName 기준으로 중복 제거)
        const uniqueParticipants = [];
        const seenNames = new Set();
        data.forEach((item, index) => {
          if (item.speakerName && !seenNames.has(item.speakerName)) {
            seenNames.add(item.speakerName);
            uniqueParticipants.push({
              id: index + 1,
              name: item.speakerName,
              isActive: true,
            });
          }
        });
        setParticipants(uniqueParticipants);

        setIsLoading(false);
      } catch (error) {
        console.error('미니게임 문제 조회 실패:', error);
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [roomId]);

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
    if (phase === GAME_PHASE.PLAYING) {
      const interval = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            // 시간 종료 - 자동으로 다음 문제로 (빈 답변으로 제출)
            const q = questions[currentQuestion];
            if (q) {
              // 현재 빈칸을 틀린 것으로 처리
              setBlanksState((prev) => {
                const next = [...prev];
                next[currentBlank] = {
                  value: '',
                  status: 'wrong',
                };
                return next;
              });

              // 다음 빈칸 또는 다음 문제로
              if (currentBlank < q.blanks.length - 1) {
                setCurrentBlank((b) => b + 1);
              } else {
                // 문제 완료
                const answered = {
                  koreanSentence: q.korean,
                  englishParts: q.englishParts,
                  blanks: q.blanks.map((b, idx) => ({
                    answer: b.answer,
                    userAnswer: idx <= currentBlank ? (blanksState[idx]?.value || '') : '',
                    isCorrect: false,
                  })),
                  correctCount: 0,
                  totalBlanks: q.blanks.length,
                };
                setAnsweredQuestions((prev) => [...prev, answered]);

                if (currentQuestion < questions.length - 1) {
                  setCurrentQuestion((c) => c + 1);
                  initQuestion(currentQuestion + 1);
                  setTimer(15); // 타이머 리셋
                } else {
                  setPhase(GAME_PHASE.WAITING);
                }
              }
            }
            return 15;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase, currentQuestion, currentBlank, questions, blanksState, initQuestion]);

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
    const userAnswer = blanksState[blankIdx]?.value?.trim() || '';

    if (!userAnswer) return;

    const correctAnswer = q.blanks[blankIdx].answer.toLowerCase();
    const isCorrect = userAnswer.toLowerCase() === correctAnswer;

    setBlanksState((prev) => {
      const next = [...prev];
      next[blankIdx] = {
        value: userAnswer,
        status: isCorrect ? 'correct' : 'wrong',
      };
      return next;
    });

    if (isCorrect) {
      setScore((s) => s + 1);
    }

    if (currentBlank < q.blanks.length - 1) {
      setCurrentBlank((b) => b + 1);
    } else {
      // 문제 완료
      const answered = {
        scriptId: q.scriptId, // scriptId 추가
        koreanSentence: q.korean,
        englishParts: q.englishParts,
        blanks: q.blanks.map((b, idx) => ({
          answer: b.answer,
          userAnswer: blanksState[idx]?.value || '',
          isCorrect: blanksState[idx]?.status === 'correct',
        })),
        correctCount: 0,
        totalBlanks: q.blanks.length,
      };
      answered.correctCount = answered.blanks.filter((b) => b.isCorrect).length;

      setAnsweredQuestions((prev) => [...prev, answered]);

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((c) => c + 1);
        initQuestion(currentQuestion + 1);
        setTimer(15); // 타이머 리셋
      } else {
        // 마지막 문제 완료 - 답변 제출 후 랭킹 조회
        setPhase(GAME_PHASE.WAITING);

        if (roomId) {
          // 모든 문제의 답변을 수집 (현재 문제 포함)
          const allAnsweredQuestions = [...answeredQuestions, answered];

          // 백엔드 API 스키마에 맞게 answers 배열 생성
          // 한 문제(scriptId)당 하나의 answer 객체, userAnswer는 모든 빈칸 답변을 쉼표로 구분
          const answers = allAnsweredQuestions.map((question) => {
            const userAnswer = question.blanks
              .map((blank) => blank.userAnswer)
              .join(', ');
            return {
              scriptId: question.scriptId,
              userAnswer: userAnswer,
            };
          });

          // 먼저 답변 제출
          submitReviewAnswers(roomId, answers)
            .then(() => {
              console.log('모든 답변 제출 성공');
              // 답변 제출 후 랭킹 조회
              return getReviewRanking(roomId);
            })
            .then((rankingData) => {
              console.log('랭킹 조회 성공:', rankingData);
              setRankings(rankingData);

              setTimeout(() => {
                setPhase(GAME_PHASE.RESULT);
                // 1등이면 코인 지급 알림 표시
                const firstPlace = rankingData[0];
                if (firstPlace && firstPlace.me) {
                  setTimeout(() => setShowCoinReward(true), 500);
                }
              }, 2000);
            })
            .catch((error) => {
              console.error('답변 제출 또는 랭킹 조회 실패:', error);
              // 실패해도 결과 화면으로 이동 (MOCK 데이터 사용)
              setTimeout(() => {
                setPhase(GAME_PHASE.RESULT);
              }, 2000);
            });
        } else {
          // roomId 없으면 MOCK 데이터 사용
          setTimeout(() => {
            setPhase(GAME_PHASE.RESULT);
            const firstPlace = MOCK_RANKINGS[0];
            if (firstPlace && firstPlace.id === currentUserId) {
              setTimeout(() => setShowCoinReward(true), 500);
            }
          }, 2000);
        }
      }
    }
  }, [currentQuestion, currentBlank, blanksState, initQuestion, questions, roomId, currentUserId, answeredQuestions]);

  const handleReview = () => setPhase(GAME_PHASE.REVIEW);

  // 로고 클릭 시 나가기 핸들러
  const handleLogoExit = useCallback(async () => {
    // roomId를 roomCode로 사용
    if (roomId) {
      try {
        await leaveRoom({ roomCode: roomId });
        console.log("[MiniGame1Page] 방 퇴장 성공");
      } catch (e) {
        console.error("[MiniGame1Page] 방 퇴장 실패:", e);
      }
    }
  }, [roomId]);

  const handleComplete = async () => {
    // 게임 종료 시 데이터 삭제
    if (roomId) {
      try {
        await clearReviewData(roomId);
        console.log('미니게임1 데이터 삭제 성공');
      } catch (error) {
        console.error('미니게임1 데이터 삭제 실패:', error);
      }
    }
    navigate('/minigame2');
  };

  if (isLoading || phase === GAME_PHASE.COUNTDOWN) {
    return <CountdownOverlay count={countdown} />;
  }

  const q = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <MiniGameLayout
      showGameHeader={phase !== GAME_PHASE.REVIEW}
      timer={formatTime(timer)}
      progress={progress}
      totalProgress={100}
      participants={participants.length > 0 ? participants : MOCK_PARTICIPANTS}
      logoExitMessage="메인 화면으로 나가시겠습니까?"
      onLogoExit={handleLogoExit}
    >
      {phase === GAME_PHASE.PLAYING && (
        <div style={{ position: 'relative' }}>
          <QuestionPanel
            current={currentQuestion + 1}
            total={questions.length}
            score={score}
            koreanSentence={q.korean}
            englishParts={q.englishParts}
            blanks={blanksState}
            currentBlankIndex={currentBlank}
            onBlankChange={handleBlankChange}
            onBlankSubmit={handleBlankSubmit}
          />
          <DuckGuide
            message="빈칸에 알맞는 단어를 빠르게 입력해보아요!!"
            visible={showGuide}
          />
        </div>
      )}

      {phase === GAME_PHASE.WAITING && <WaitingPanel />}

      {phase === GAME_PHASE.RESULT && (
        <ResultPanel
          rankings={rankings}
          currentUserId={currentUserId}
          onReview={handleReview}
          onComplete={handleComplete}
        />
      )}

      {phase === GAME_PHASE.REVIEW && (
        <ReviewPanel questions={answeredQuestions} onComplete={handleComplete} />
      )}

      <CoinRewardNotification
        show={showCoinReward}
        onComplete={() => setShowCoinReward(false)}
        coins={100}
      />
    </MiniGameLayout>
  );
}
