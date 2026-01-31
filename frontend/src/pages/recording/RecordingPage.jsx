import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Recordinglayout from '@/components/features/recording/layout/RecordingLayout';
import { saveAssessment, toggleScriptLike, getTurnScripts } from '@/api/shadowing';
import { endRoom } from '@/api/rooms';

import BottomIdle from '@/components/features/recording/bottom/BottomIdle';
import BottomAITimer from '@/components/features/recording/bottom/BottomAITimer';
import BottomAIPlaying from '@/components/features/recording/bottom/BottomAIPlaying';
import BottomRecordTimer from '@/components/features/recording/bottom/BottomRecordTimer';
import BottomRecording from '@/components/features/recording/bottom/BottomRecording';
import BottomRecordDone from '@/components/features/recording/bottom/BottomRecordDone';
import BottomAllDone from '@/components/features/recording/bottom/BottomAllDone';

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
  TURN_REPORT: 'turn_report', // 턴 종료 후 리포트
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
  const { state } = useLocation();
  const navigate = useNavigate();
  const roomInfo = state?.roomInfo || {};

  // 방 생성 시 선택한 턴수 사용 (기본값 3)
  const TURNS = roomInfo.turnCount || 3;
  const roomId = roomInfo.roomId;

  const [step, setStep] = useState(STEP.IDLE);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0); // 녹음 시간 (초)
  const [sentenceScores, setSentenceScores] = useState({});
  const [bookmarkedSentences, setBookmarkedSentences] = useState([]);
  const [conversations, setConversations] = useState({}); // 턴별 스크립트 저장
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTurnForReport, setSelectedTurnForReport] = useState(null); // 리포트 확인용

  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  const endRoomCalledRef = useRef(false); // endRoom 중복 호출 방지
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const audioRef = useRef(null); // TTS 오디오 재생용

  const currentTurnSentences = useMemo(() => {
    // ALL_DONE 상태에서 리포트를 보는 경우 선택된 턴의 스크립트를 표시
    const turnToShow = selectedTurnForReport || currentTurn;
    return conversations[turnToShow] || DUMMY_CONVERSATIONS[turnToShow] || [];
  }, [currentTurn, selectedTurnForReport, conversations]);

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

    // TTS 오디오도 정리
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  // 녹음 시작
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
    } catch (error) {
      console.error('녹음 시작 실패:', error);
    }
  }, []);

  // Blob을 base64로 변환
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const goNextSentence = () => {
    // 현재 턴의 다음 문장으로 이동
    if (currentSentenceIndex < currentTurnSentences.length - 1) {
      setCurrentSentenceIndex((idx) => idx + 1);
      setStep(STEP.AI_TIMER);
    } else {
      // 턴의 마지막 문장이면 턴 리포트로
      setStep(STEP.TURN_REPORT);
    }
  };

  const goNextTurn = () => {
    // 마지막 턴이면 전체 완료
    if (currentTurn >= TURNS) {
      setStep(STEP.ALL_DONE);
      return;
    }

    // 다음 턴으로 이동
    setCurrentTurn((t) => t + 1);
    setCurrentSentenceIndex(0);
    setStep(STEP.AI_TIMER);
  };

  const startFlow = () => {
    setStep(STEP.AI_TIMER);
  };

  const stopRecording = async () => {
    // 녹음 중지
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();

      // 녹음 스트림 정리
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    if (currentSentence) {
      try {
        // 녹음된 오디오 데이터 처리
        let audioBase64 = null;
        if (recordedChunksRef.current.length > 0) {
          const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
          audioBase64 = await blobToBase64(audioBlob);
        }

        // 발음 평가 API 호출 - 401 에러 시 자동 재시도
        let result = null;
        let retryCount = 0;
        while (retryCount < 2) {
          try {
            result = await saveAssessment({
              audio: audioBase64 || '',
            });
            break; // 성공하면 루프 탈출
          } catch (err) {
            if (err.response?.status === 401 && retryCount === 0) {
              // 첫 번째 401 에러는 토큰 갱신 후 재시도
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 500)); // 토큰 갱신 대기
            } else {
              throw err; // 다른 에러나 두 번째 401은 그대로 throw
            }
          }
        }

        // API 응답에서 점수 받아오기
        const score = result?.score || Math.floor(Math.random() * 40) + 60; // fallback: 랜덤 점수
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
    setSelectedTurnForReport(null);
  };

  const handleComplete = () => {
    // 미니게임1로 이동
    navigate('/minigame1', {
      state: {
        roomId: roomId,
      }
    });
  };

  const handleTurnClick = (turn) => {
    // ALL_DONE 상태에서만 작동
    if (step === STEP.ALL_DONE) {
      setSelectedTurnForReport(turn);
    }
  };

  const handleBookmarkToggle = useCallback(async (sentenceId, isBookmarked) => {
    try {
      // API 호출 - 401 에러 시 자동 재시도
      let retryCount = 0;
      while (retryCount < 2) {
        try {
          await toggleScriptLike(sentenceId);
          break; // 성공하면 루프 탈출
        } catch (err) {
          if (err.response?.status === 401 && retryCount === 0) {
            // 첫 번째 401 에러는 토큰 갱신 후 재시도
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 500)); // 토큰 갱신 대기
          } else {
            throw err; // 다른 에러나 두 번째 401은 그대로 throw
          }
        }
      }

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
      alert('북마크 저장에 실패했습니다. 다시 시도해주세요.');
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

  // 턴별 스크립트 조회
  useEffect(() => {
    const fetchTurnScripts = async () => {
      // roomInfo에서 roomId 추출 (inviteCode, joinCode, roomCode, id 등 다양한 형태 가능)
      console.log('RecordingPage roomInfo:', roomInfo);
      const roomId = roomInfo.id || roomInfo.roomId || roomInfo.inviteCode || roomInfo.joinCode || roomInfo.roomCode;
      console.log('추출된 roomId:', roomId);

      if (!roomId) {
        console.warn('roomId를 찾을 수 없습니다. DUMMY_CONVERSATIONS를 사용합니다.');
        return;
      }

      // 이미 해당 턴의 데이터가 있으면 스킵
      if (conversations[currentTurn]) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await getTurnScripts(roomId, currentTurn);

        // API 응답을 컴포넌트에서 사용하는 형식으로 변환
        const scripts = Array.isArray(response) ? response : [response];
        const formattedScripts = scripts.map((script, index) => ({
          id: script.order_no ?? index + 1,
          speaker: script.speakerName || '참여자',
          korean: script.korean || '',
          english: script.english || '',
          // blank_script에서 빈칸 단어 추출 (추후 백엔드 형식에 맞게 수정 필요)
          blankWords: script.blank_script ? script.blank_script.split(',').map(w => w.trim()) : [],
          score: null,
          tts_url: script.tts_url || null,
        }));

        setConversations(prev => ({
          ...prev,
          [currentTurn]: formattedScripts,
        }));
      } catch (error) {
        console.error('스크립트 조회 실패:', error);
        // 실패 시 DUMMY_CONVERSATIONS 사용
      } finally {
        setIsLoading(false);
      }
    };

    fetchTurnScripts();
  }, [currentTurn, roomInfo, conversations]);

  // 복습 게임 완료 시 endRoom API 자동 호출
  useEffect(() => {
    if (step === STEP.ALL_DONE && !endRoomCalledRef.current) {
      endRoomCalledRef.current = true;

      const roomCode = roomInfo.inviteCode || roomInfo.joinCode || roomInfo.roomCode;
      if (roomCode && state?.mode === 'together') {
        endRoom(roomCode)
          .then(() => {
            console.log('복습 완료 - 방 상태를 대기방으로 자동 전환 완료');
          })
          .catch((e) => {
            console.error('방 종료 API 호출 실패:', e);
            // 실패해도 사용자 경험에는 영향 없음 (복습은 이미 완료됨)
          });
      }
    }
  }, [step, roomInfo, state?.mode]);

  // countdown 초기화 (타이머 단계 진입 시)
  useEffect(() => {
    if (step === STEP.AI_TIMER || step === STEP.RECORD_TIMER) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCountdown(3);
    }
    // 녹음 시간 리셋 (녹음 시작 시)
    if (step === STEP.RECORDING) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecordingTime(0);
    }
  }, [step]);

  // 녹음 시간 증가 (1초마다)
  useEffect(() => {
    if (step !== STEP.RECORDING) return;

    const interval = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
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
      const ttsUrl = currentSentence?.tts_url;

      if (ttsUrl) {
        // 실제 TTS 오디오 재생
        try {
          const audio = new Audio(ttsUrl);
          audioRef.current = audio;

          // 재생 시작
          audio.play().catch((error) => {
            console.error('TTS 재생 실패:', error);
            // 재생 실패 시 타이머로 fallback
            timerRef.current = setTimeout(() => {
              setStep(STEP.RECORD_TIMER);
            }, AI_PLAYING_MS);
          });

          // 재생 완료 시 다음 단계로
          audio.onended = () => {
            setStep(STEP.RECORD_TIMER);
          };

          // 에러 처리
          audio.onerror = () => {
            console.error('TTS 로딩 실패');
            // 에러 시 타이머로 fallback
            timerRef.current = setTimeout(() => {
              setStep(STEP.RECORD_TIMER);
            }, AI_PLAYING_MS);
          };
        } catch (error) {
          console.error('TTS 오디오 생성 실패:', error);
          // 예외 발생 시 타이머로 fallback
          timerRef.current = setTimeout(() => {
            setStep(STEP.RECORD_TIMER);
          }, AI_PLAYING_MS);
        }
      } else {
        // tts_url이 없으면 기존 타이머 사용
        timerRef.current = setTimeout(() => {
          setStep(STEP.RECORD_TIMER);
        }, AI_PLAYING_MS);
      }
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
      // 녹음 시작
      startRecording();

      timerRef.current = setTimeout(() => {
        stopRecording();
      }, MAX_RECORDING_MS);
      return;
    }

    if (step === STEP.RECORD_DONE) {
      // 1.5초 후 자동으로 다음 문장으로
      timerRef.current = setTimeout(() => {
        goNextSentence();
      }, 1500);
      return;
    }
  }, [step, clearAllTimers, startRecording, stopRecording, goNextSentence, currentSentence]);

  // 카드 리스트에 전달할 데이터
  const sentenceCardsData = useMemo(() => {
    // TURN_REPORT 또는 ALL_DONE 상태일 때는 모든 카드를 활성화하여 표시
    const isReportMode = step === STEP.TURN_REPORT || step === STEP.ALL_DONE;

    return currentTurnSentences.map((sentence, index) => ({
      ...sentence,
      score: sentenceScores[sentence.id],
      isActive: isReportMode ? true : index === currentSentenceIndex,
      currentSentence: index + 1,
      totalSentences: currentTurnSentences.length,
      isBookmarked: bookmarkedSentences.includes(sentence.id),
    }));
  }, [currentTurnSentences, currentSentenceIndex, sentenceScores, bookmarkedSentences, step]);

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
      case STEP.TURN_REPORT:
        return 'idle'; // 턴 리포트에서는 모든 카드가 idle 상태
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

      case STEP.TURN_REPORT:
        return (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            background: '#fff',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              onClick={goNextTurn}
              style={{
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#fff',
                background: '#2b7fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              {currentTurn >= TURNS ? '완료' : '다음 턴으로'}
            </button>
          </div>
        );

      case STEP.ALL_DONE:
        return <BottomAllDone onRestart={restart} onComplete={handleComplete} />;

      default:
        return null;
    }
  };

  return (
    <Recordinglayout
      currentTurn={selectedTurnForReport || currentTurn}
      sentenceCards={sentenceCardsData}
      activeCardState={getActiveCardState()}
      countdown={countdown}
      recordingTime={recordingTime}
      bottomContent={bottomContent()}
      onBookmarkToggle={handleBookmarkToggle}
      totalTurns={TURNS}
      isAllDone={step === STEP.ALL_DONE}
      onTurnClick={handleTurnClick}
      selectedTurnForReport={selectedTurnForReport}
    />
  );
}
