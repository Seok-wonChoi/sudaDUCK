import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import MiniGameLayout from '@/components/features/minigame/layout/MiniGameLayout';
import CountdownOverlay from '@/components/features/minigame/countdown/CountdownOverlay';
import CardBoard from '@/components/features/minigame2/game/CardBoard';
import GameStats from '@/components/features/minigame2/game/GameStats';
import DuckGuide from '@/components/features/minigame2/game/DuckGuide';
import ResultPanel from '@/components/features/minigame2/result/ResultPanel';

const MOCK_PARTICIPANTS = [
  { id: 1, name: '장가은', isActive: true },
  { id: 2, name: '이승엽', isActive: true },
  { id: 3, name: '최현웅', isActive: false },
  { id: 4, name: '김가민', isActive: true },
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

  // ✅ phase를 state로 두지 않고, 아래 상태들로 "계산"해서 사용
  const [countdown, setCountdown] = useState(3);
  const [timer, setTimer] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [removedCards, setRemovedCards] = useState([]);
  const [showGuide, setShowGuide] = useState(true);

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

  const handleComplete = () => {
    navigate('/');
  };

  if (phase === GAME_PHASE.COUNTDOWN) {
    return (
      <CountdownOverlay
        count={countdown}
        title="준비되셨나요?"
        subtitle="알맞은 단어로 빈칸을 채우세요!"
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
    >
      {phase === GAME_PHASE.PLAYING && (
        <div className="flex flex-col h-full">
          <GameStats
            current={removedCards.length}
            total={MOCK_CARDS.length}
            timeLeft={timeLeft}
          />
          <div className="relative flex-1 min-h-[400px]">
            <CardBoard cards={MOCK_CARDS} removedCards={removedCards} />
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
    </MiniGameLayout>
  );
}
