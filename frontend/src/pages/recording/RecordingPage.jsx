import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RecordingLayout from '@/components/features/recording/Layout/RecordingLayout';

import BottomIdle from '@/components/features/recording/bottom/BottomIdle';
import BottomAITimer from '@/components/features/recording/bottom/BottomAITimer';
import BottomAIPlaying from '@/components/features/recording/bottom/BottomAIPlaying';
import BottomRecordTimer from '@/components/features/recording/bottom/BottomRecordTimer';
import BottomRecording from '@/components/features/recording/bottom/BottomRecording';
import BottomRecordDone from '@/components/features/recording/bottom/BottomRecordDone';
import BottomAllDone from '@/components/features/recording/bottom/BottomAllDone';

// 개발용 패널 켜기/끄기
const DEBUG_PANEL = true;

// 서비스 설정
const TURNS = 3;
const SENTENCES_PER_TURN = 3;

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

export default function RecordingPage() {
  const [step, setStep] = useState(STEP.IDLE);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [currentSentence, setCurrentSentence] = useState(1);
  const [countdown, setCountdown] = useState(3);

  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  const isLastSentence = useMemo(() => {
    return currentTurn === TURNS && currentSentence === SENTENCES_PER_TURN;
  }, [currentTurn, currentSentence]);

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

    if (currentSentence < SENTENCES_PER_TURN) {
      setCurrentSentence((s) => s + 1);
    } else {
      setCurrentTurn((t) => t + 1);
      setCurrentSentence(1);
    }

    setStep(STEP.AI_TIMER);
  };

  const startFlow = () => {
    setStep(STEP.AI_TIMER);
  };

  const stopRecording = () => {
    setStep(STEP.RECORD_DONE);
  };

  const restart = () => {
    clearAllTimers();
    setCurrentTurn(1);
    setCurrentSentence(1);
    setCountdown(3);
    setStep(STEP.IDLE);
  };

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

  // 카드에 전달할 props 결정
  const getCardProps = () => {
    const baseProps = {
      currentSentence,
      totalSentences: SENTENCES_PER_TURN,
    };

    switch (step) {
      case STEP.AI_PLAYING:
        return { ...baseProps, isAIPlaying: true };
      
      case STEP.RECORD_TIMER:
      case STEP.RECORDING:
      case STEP.RECORD_DONE:
        return {
          ...baseProps,
          showRecordingBox: true,
          recordingContent: getRecordingContent(),
        };
      
      default:
        return baseProps;
    }
  };

  const getRecordingContent = () => {
    switch (step) {
      case STEP.RECORD_TIMER:
        return <span style={{ color: '#6b7280', fontSize: '14px' }}>녹음 대기 중...</span>;
      
      case STEP.RECORDING:
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '50%', 
              backgroundColor: '#ef4444', 
              margin: '0 auto 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              {countdown}
            </div>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
              자동으로 다음 음성으로 넘어갑니다
            </p>
          </div>
        );
      
      case STEP.RECORD_DONE:
        return <span style={{ color: '#10b981', fontSize: '14px' }}>녹음이 완료되었습니다</span>;
      
      default:
        return null;
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
    <>
      <RecordingLayout
        currentTurn={currentTurn}
        currentSentence={currentSentence}
        bottomContent={bottomContent()}
        cardProps={getCardProps()}
      />

      {DEBUG_PANEL && (
        <div
          style={{
            position: 'fixed',
            top: 110,
            right: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            zIndex: 9999,
            background: '#fff',
            border: '1px solid #e5e7eb',
            padding: 12,
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            width: 170,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700 }}>
            step: {step}
          </div>
          <div style={{ fontSize: 12 }}>
            turn {currentTurn} / sentence {currentSentence}
          </div>

          <button onClick={() => setStep(STEP.IDLE)}>1 Idle</button>
          <button onClick={() => setStep(STEP.AI_TIMER)}>2 AI Timer</button>
          <button onClick={() => setStep(STEP.AI_PLAYING)}>3 AI Playing</button>
          <button onClick={() => setStep(STEP.RECORD_TIMER)}>4 Record Timer</button>
          <button onClick={() => setStep(STEP.RECORDING)}>5 Recording</button>
          <button onClick={() => setStep(STEP.RECORD_DONE)}>6 Record Done</button>
          <button onClick={() => setStep(STEP.ALL_DONE)}>7 All Done</button>

          <button onClick={restart} style={{ marginTop: 8 }}>
            Restart
          </button>
        </div>
      )}
    </>
  );
}
