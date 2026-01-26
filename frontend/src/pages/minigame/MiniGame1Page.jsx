import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './MiniGame1Page.module.css';

import MiniGameLayout from '@/components/features/minigame/layout/MiniGamelayout';
import CountdownOverlay from '@/components/features/minigame/countdown/CountdownOverlay';
import QuestionPanel from '@/components/features/minigame1/question/QuestionPanel';
import WaitingPanel from '@/components/features/minigame1/waiting/WaitingPanel';
import ResultPanel from '@/components/features/minigame1/result/ResultPanel';
import ReviewPanel from '@/components/features/minigame1/review/ReviewPanel';

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
  { id: 4, name: '김가민', score: 4, total: 4 },
  { id: 1, name: '장가은', score: 3, total: 4 },
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
  const [phase, setPhase] = useState(GAME_PHASE.COUNTDOWN);
  const [countdown, setCountdown] = useState(3);
  const [timer, setTimer] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentBlank, setCurrentBlank] = useState(0);
  const [score, setScore] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [blanksState, setBlanksState] = useState([]);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);

  const currentUserId = 1;

  useEffect(() => {
    if (phase === GAME_PHASE.COUNTDOWN && countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (phase === GAME_PHASE.COUNTDOWN && countdown === 0) {
      setPhase(GAME_PHASE.PLAYING);
      initQuestion(0);
    }
  }, [phase, countdown]);

  useEffect(() => {
    if (phase === GAME_PHASE.PLAYING) {
      const interval = setInterval(() => setTimer((t) => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  const initQuestion = (qIdx) => {
    const q = MOCK_QUESTIONS[qIdx];
    if (q) {
      setBlanksState(q.blanks.map(() => ({ value: '', status: 'empty' })));
      setCurrentBlank(0);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim()) return;

    const q = MOCK_QUESTIONS[currentQuestion];
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

      if (currentQuestion < MOCK_QUESTIONS.length - 1) {
        setCurrentQuestion((c) => c + 1);
        initQuestion(currentQuestion + 1);
      } else {
        setPhase(GAME_PHASE.WAITING);
        setTimeout(() => setPhase(GAME_PHASE.RESULT), 2000);
      }
    }
  }, [inputValue, currentQuestion, currentBlank, blanksState]);

  const handleReview = () => setPhase(GAME_PHASE.REVIEW);
  const handleComplete = () => navigate('/minigame2');

  if (phase === GAME_PHASE.COUNTDOWN) {
    return <CountdownOverlay count={countdown} />;
  }

  const q = MOCK_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / MOCK_QUESTIONS.length) * 100;

  return (
    <MiniGameLayout
      showGameHeader={phase !== GAME_PHASE.REVIEW}
      timer={formatTime(timer)}
      progress={progress}
      totalProgress={100}
      participants={MOCK_PARTICIPANTS}
    >
      {phase === GAME_PHASE.PLAYING && (
        <QuestionPanel
          current={currentQuestion + 1}
          total={MOCK_QUESTIONS.length}
          score={score}
          koreanSentence={q.korean}
          englishParts={q.englishParts}
          blanks={blanksState}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSubmit={handleSubmit}
        />
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
    </MiniGameLayout>
  );
}
