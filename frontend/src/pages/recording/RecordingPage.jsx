import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Recordinglayout from '@/components/features/recording/layout/RecordingLayout';
import { saveAssessment, toggleScriptLike } from '@/api/shadowing';

import BottomIdle from '@/components/features/recording/bottom/BottomIdle';
import BottomAITimer from '@/components/features/recording/bottom/BottomAITimer';
import BottomAIPlaying from '@/components/features/recording/bottom/BottomAIPlaying';
import BottomRecordTimer from '@/components/features/recording/bottom/BottomRecordTimer';
import BottomRecording from '@/components/features/recording/bottom/BottomRecording';
import BottomRecordDone from '@/components/features/recording/bottom/BottomRecordDone';
import BottomAllDone from '@/components/features/recording/bottom/BottomAllDone';

// 서비스 설정
const TURNS = 3;

// 임시 재생/녹음 시간
const AI_PLAYING_MS = 2500;
const MAX_RECORDING_MS = 6000;

const STEP = {
  IDLE: 'idle',
  AI_TIMER: 'ai_timer',
  AI_PLAYING: 'ai_playing',
  RECORD_TIMER: 'record_timer',
  RECORDING: 'recording',
  RECORD_DONE: 'record_done',
  ALL_DONE: 'all_done',
};

// 임시 더미 데이터 - 실제로는 API나 state로부터 받아올 데이터
const DUMMY_CONVERSATIONS = {
  1: [
    {
      id: 1,
      speaker: '장가은',
      korean: '나는 카페에서 아르바이트를 했는데, 정말 힘들었어요.',
      english: 'I worked at a coffee shop, and it was really tough.',
      blankWords: ['worked', 'really'],
      score: null,
    },
    {
      id: 2,
      speaker: '이승엽',
      korean: '무엇이 가장 힘들었어요?',
      english: 'What was the most difficult part?',
      blankWords: ['most', 'difficult'],
      score: null,
    },
    {
      id: 3,
      speaker: '장가은',
      korean: '손님들이 많아서 바빴어요.',
      english: 'It was busy because there were many customers.',
      blankWords: ['busy', 'many'],
      score: null,
    },
  ],
  2: [
    {
      id: 4,
      speaker: '김민수',
      korean: '저는 주말에 영화를 봤어요.',
      english: 'I watched a movie on the weekend.',
      blankWords: ['watched', 'weekend'],
      score: null,
    },
    {
      id: 5,
      speaker: '박지영',
      korean: '무슨 영화를 봤어요?',
      english: 'What movie did you watch?',
      blankWords: ['movie', 'watch'],
      score: null,
    },
  ],
  3: [
    {
      id: 6,
      speaker: '최수진',
      korean: '오늘 날씨가 정말 좋네요.',
      english: 'The weather is really nice today.',
      blankWords: ['weather', 'nice'],
      score: null,
    },
  ],
};

export default function RecordingPage() {
  const [step, setStep] = useState(STEP.IDLE);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [sentenceScores, setSentenceScores] = useState({});
  const [bookmarkedSentences, setBookmarkedSentences] = useState([]);

  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  const currentTurnSentences = useMemo(() => {
    return DUMMY_CONVERSATIONS[currentTurn] || [];
  }, [currentTurn]);

  const currentSentence = useMemo(() => {
    return currentTurnSentences[currentSentenceIndex];
  }, [currentTurnSentences, currentSentenceIndex]);

  const isLastSentence = useMemo(() => {
    if (currentTurn === TURNS) {
      const lastTurnSentences = DUMMY_CONVERSATIONS[TURNS] || [];
      return currentSentenceIndex === lastTurnSentences.length - 1;
    }
    return false;
  }, [currentTurn, currentSentenceIndex]);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timerRef.current = null;
    intervalRef.current = null;
  }, []);

  const goNextSentence = () => {
    if (isLastSentence) {
      setStep(STEP.ALL_DONE);
      return;
    }

    // 현재 턴의 다음 문장으로 이동
    if (currentSentenceIndex < currentTurnSentences.length - 1) {
      setCurrentSentenceIndex((idx) => idx + 1);
      setStep(STEP.AI_TIMER);
    } else {
      // 다음 턴으로 이동
      setCurrentTurn((t) => t + 1);
      setCurrentSentenceIndex(0);
      setStep(STEP.AI_TIMER);
    }
  };

  const startFlow = () => {
    setStep(STEP.AI_TIMER);
  };

  const stopRecording = async () => {
    if (currentSentence) {
      try {
        // 발음 평가 API 호출
        const result = await saveAssessment({
          sentenceId: currentSentence.id,
          // TODO: 실제 녹음 데이터 추가 필요
          // audioData: recordedAudio,
          // text: currentSentence.english,
        });

        // API 응답에서 점수 받아오기
        const score = result.score || Math.floor(Math.random() * 40) + 60; // fallback: 랜덤 점수
        setSentenceScores((prev) => ({
          ...prev,
          [currentSentence.id]: score,
        }));
      } catch (error) {
        console.error('발음 평가 저장 실패:', error);
        // 실패 시 임시 점수 부여
        const randomScore = Math.floor(Math.random() * 40) + 60;
        setSentenceScores((prev) => ({
          ...prev,
          [currentSentence.id]: randomScore,
        }));
      }
    }
    setStep(STEP.RECORD_DONE);
  };

  const restart = () => {
    clearAllTimers();
    setCurrentTurn(1);
    setCurrentSentenceIndex(0);
    setCountdown(3);
    setStep(STEP.IDLE);
    setSentenceScores({});
  };

  const handleBookmarkToggle = useCallback(async (sentenceId, isBookmarked) => {
    try {
      // API 호출 - 스크립트 저장/취소
      await toggleScriptLike(sentenceId);

      // API 호출 성공 시 로컬 state 업데이트
      setBookmarkedSentences((prev) => {
        let newBookmarks;
        if (isBookmarked) {
          // 북마크 추가
          if (!prev.includes(sentenceId)) {
            newBookmarks = [...prev, sentenceId];
          } else {
            newBookmarks = prev;
          }
        } else {
          // 북마크 제거
          newBookmarks = prev.filter((id) => id !== sentenceId);
        }

        // localStorage에도 저장
        try {
          localStorage.setItem('bookmarkedSentences', JSON.stringify(newBookmarks));
        } catch (error) {
          console.error('북마크 localStorage 저장 실패:', error);
        }

        return newBookmarks;
      });
    } catch (error) {
      console.error('북마크 API 호출 실패:', error);
      alert('북마크 저장에 실패했습니다.');
    }
  }, []);

  // 컴포넌트 마운트 시 localStorage에서 북마크 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bookmarkedSentences');
      if (saved) {
        setBookmarkedSentences(JSON.parse(saved));
      }
    } catch (error) {
      console.error('북마크 불러오기 실패:', error);
    }
  }, []);

  // countdown 초기화 (타이머 단계 진입 시)
  useEffect(() => {
    if (step === STEP.AI_TIMER || step === STEP.RECORD_TIMER) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCountdown(3);
    }
  }, [step]);

  // 메인 타이머 로직
  useEffect(() => {
    clearAllTimers();

    if (step === STEP.AI_TIMER) {
      intervalRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearAllTimers();
            setStep(STEP.AI_PLAYING);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return;
    }

    if (step === STEP.AI_PLAYING) {
      timerRef.current = setTimeout(() => {
        setStep(STEP.RECORD_TIMER);
      }, AI_PLAYING_MS);
      return;
    }

    if (step === STEP.RECORD_TIMER) {
      intervalRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearAllTimers();
            setStep(STEP.RECORDING);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return;
    }

    if (step === STEP.RECORDING) {
      timerRef.current = setTimeout(() => {
        setStep(STEP.RECORD_DONE);
      }, MAX_RECORDING_MS);
      return;
    }
  }, [step, clearAllTimers]);

  // 카드 리스트에 전달할 데이터
  const sentenceCardsData = useMemo(() => {
    return currentTurnSentences.map((sentence, index) => ({
      ...sentence,
      score: sentenceScores[sentence.id],
      isActive: index === currentSentenceIndex,
      currentSentence: index + 1,
      totalSentences: currentTurnSentences.length,
      isBookmarked: bookmarkedSentences.includes(sentence.id),
    }));
  }, [currentTurnSentences, currentSentenceIndex, sentenceScores, bookmarkedSentences]);

  // 현재 활성 카드의 상태
  const getActiveCardState = () => {
    switch (step) {
      case STEP.AI_PLAYING:
        return 'ai_playing';
      case STEP.RECORD_TIMER:
        return 'record_timer';
      case STEP.RECORDING:
        return 'recording';
      case STEP.RECORD_DONE:
        return 'record_done';
      default:
        return 'idle';
    }
  };

  const bottomContent = () => {
    switch (step) {
      case STEP.IDLE:
        return <BottomIdle onNext={startFlow} onStart={startFlow} />;

      case STEP.AI_TIMER:
        return <BottomAITimer seconds={countdown} />;

      case STEP.AI_PLAYING:
        return <BottomAIPlaying onSkip={() => setStep(STEP.RECORD_TIMER)} />;

      case STEP.RECORD_TIMER:
        return <BottomRecordTimer seconds={countdown} />;

      case STEP.RECORDING:
        return <BottomRecording onStop={stopRecording} />;

      case STEP.RECORD_DONE:
        return (
          <BottomRecordDone
            onNext={goNextSentence}
            isLast={isLastSentence}
          />
        );

      case STEP.ALL_DONE:
        return <BottomAllDone onRestart={restart} />;

      default:
        return null;
    }
  };

  return (
    <Recordinglayout
      currentTurn={currentTurn}
      sentenceCards={sentenceCardsData}
      activeCardState={getActiveCardState()}
      countdown={countdown}
      bottomContent={bottomContent()}
      onBookmarkToggle={handleBookmarkToggle}
    />
  );
}
