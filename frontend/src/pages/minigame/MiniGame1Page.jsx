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
import { getReviewQuestions } from '@/api/miniGame';

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
  const [timer, setTimer] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentBlank, setCurrentBlank] = useState(0);
  const [score, setScore] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [blanksState, setBlanksState] = useState([]);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [showGuide, setShowGuide] = useState(false);
  const [showCoinReward, setShowCoinReward] = useState(false);
  const [questions, setQuestions] = useState(MOCK_QUESTIONS);
  const [isLoading, setIsLoading] = useState(true);

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
      const interval = setInterval(() => setTimer((t) => t + 1), 1000);
      return () => clearInterval(interval);
    }
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

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim()) return;

    const q = questions[currentQuestion];
    const correctAnswer = q.blanks[currentBlank].answer.toLowerCase();
    const isCorrect = inputValue.trim().toLowerCase() === correctAnswer;

    setBlanksState((prev) => {
      const next = [...prev];
      next[currentBlank] = {
        value: inputValue.trim(),
        status: isCorrect ? 'correct' : 'wrong',
      };
      return next;
    });

    if (isCorrect) {
      setScore((s) => s + 1);
    }

    setInputValue('');

    if (currentBlank < q.blanks.length - 1) {
      setCurrentBlank((b) => b + 1);
    } else {
      const answered = {
        koreanSentence: q.korean,
        englishParts: q.englishParts,
        blanks: q.blanks.map((b, idx) => ({
          answer: b.answer,
          userAnswer: idx === currentBlank ? inputValue.trim() : (blanksState[idx]?.value || ''),
          isCorrect: idx === currentBlank
            ? inputValue.trim().toLowerCase() === b.answer.toLowerCase()
            : blanksState[idx]?.status === 'correct',
        })),
        correctCount: 0,
        totalBlanks: q.blanks.length,
      };
      answered.correctCount = answered.blanks.filter((b) => b.isCorrect).length;

      setAnsweredQuestions((prev) => [...prev, answered]);

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((c) => c + 1);
        initQuestion(currentQuestion + 1);
      } else {
        setPhase(GAME_PHASE.WAITING);
        setTimeout(() => {
          setPhase(GAME_PHASE.RESULT);
          // 1등이면 코인 지급 알림 표시
          const firstPlace = MOCK_RANKINGS[0];
          if (firstPlace && firstPlace.id === currentUserId) {
            setTimeout(() => setShowCoinReward(true), 500);
          }
        }, 2000);
      }
    }
  }, [inputValue, currentQuestion, currentBlank, blanksState, initQuestion, questions]);

  const handleReview = () => setPhase(GAME_PHASE.REVIEW);
  const handleComplete = () => navigate('/minigame2');

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
      participants={MOCK_PARTICIPANTS}
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
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSubmit={handleSubmit}
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
          rankings={MOCK_RANKINGS}
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
