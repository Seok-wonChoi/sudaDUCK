import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // useNavigate 추가됨
import Recordinglayout from "@/components/features/recording/layout/RecordingLayout";
import {
  saveAssessment,
  toggleScriptLike,
  getTurnScripts,
} from "@/api/shadowing";

import BottomIdle from "@/components/features/recording/bottom/BottomIdle";
import BottomAITimer from "@/components/features/recording/bottom/BottomAITimer";
import BottomAIPlaying from "@/components/features/recording/bottom/BottomAIPlaying";
import BottomRecordTimer from "@/components/features/recording/bottom/BottomRecordTimer";
import BottomRecording from "@/components/features/recording/bottom/BottomRecording";
import BottomRecordDone from "@/components/features/recording/bottom/BottomRecordDone";
import BottomAllDone from "@/components/features/recording/bottom/BottomAllDone";

// 설정 상수
const AI_PLAYING_MS = 2500;

const STEP = {
  IDLE: "idle",
  AI_TIMER: "ai_timer",
  AI_PLAYING: "ai_playing",
  RECORD_TIMER: "record_timer",
  RECORDING: "recording",
  RECORD_DONE: "record_done",
  TURN_REPORT: "turn_report",
  ALL_DONE: "all_done",
};

// 더미 데이터
const DUMMY_CONVERSATIONS = {
  1: [
    {
      id: 1,
      scriptId: "dummy_1",
      speaker: "장가은",
      korean: "나는 카페에서 아르바이트를 했는데, 정말 힘들었어요.",
      english: "I worked at a coffee shop, and it was really tough.",
      blankWords: ["worked", "really"],
      score: null,
      tts_url: null,
    },
    {
      id: 2,
      scriptId: "dummy_2",
      speaker: "이승엽",
      korean: "무엇이 가장 힘들었어요?",
      english: "What was the most difficult part?",
      blankWords: ["most", "difficult"],
      score: null,
      tts_url: null,
    },
    {
      id: 3,
      scriptId: "dummy_3",
      speaker: "장가은",
      korean: "손님들이 많아서 바빴어요.",
      english: "It was busy because there were many customers.",
      blankWords: ["busy", "many"],
      score: null,
      tts_url: null,
    },
  ],
  2: [],
  3: [],
};

export default function RecordingPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const roomInfo = state?.roomInfo || {};

  const TURNS = roomInfo.turnCount || 3;

  const [step, setStep] = useState(STEP.AI_TIMER);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sentenceScores, setSentenceScores] = useState({});
  const [bookmarkedSentences, setBookmarkedSentences] = useState([]);
  const [conversations, setConversations] = useState({});
  const [selectedTurnForReport, setSelectedTurnForReport] = useState(null);

  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const audioRef = useRef(null);

  // roomId 추출 (중복 제거 및 최적화)
  const roomId = useMemo(() => {
    const fromState =
      roomInfo.id ||
      roomInfo.roomId ||
      roomInfo.inviteCode ||
      roomInfo.joinCode ||
      roomInfo.roomCode;
    if (fromState) return fromState;
    try {
      const testRoomInfo = sessionStorage.getItem("testRoomInfo");
      if (testRoomInfo) return JSON.parse(testRoomInfo).id;
    } catch (e) {
      /* ignore */
    }
    return null;
  }, [roomInfo]);

  const currentTurnSentences = useMemo(() => {
    const turnToShow = selectedTurnForReport || currentTurn;
    return conversations[turnToShow] || DUMMY_CONVERSATIONS[turnToShow] || [];
  }, [currentTurn, selectedTurnForReport, conversations]);

  const currentSentence = useMemo(() => {
    return currentTurnSentences[currentSentenceIndex];
  }, [currentTurnSentences, currentSentenceIndex]);

  const isLastSentence = useMemo(() => {
    if (currentTurn === TURNS) {
      return currentSentenceIndex === currentTurnSentences.length - 1;
    }
    return false;
  }, [currentTurn, currentSentenceIndex, currentTurnSentences.length, TURNS]);

  // --- 함수들 (useCallback으로 감싸서 린트 에러 방지) ---

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timerRef.current = null;
    intervalRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      mediaRecorder.start();
    } catch (error) {
      console.error("녹음 시작 실패:", error);
    }
  }, []);

  const goNextSentence = useCallback(() => {
    if (currentSentenceIndex < currentTurnSentences.length - 1) {
      setCurrentSentenceIndex((idx) => idx + 1);
      setStep(STEP.AI_TIMER);
    } else {
      setStep(STEP.TURN_REPORT);
    }
  }, [currentSentenceIndex, currentTurnSentences.length]);

  const stopRecording = useCallback(async () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      const mimeType = mediaRecorderRef.current.mimeType;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());

      // 브라우저가 Blob을 생성할 시간을 주기 위해 살짝 지연
      setTimeout(async () => {
        if (currentSentence && recordedChunksRef.current.length > 0) {
          try {
            const audioBlob = new Blob(recordedChunksRef.current, {
              type: mimeType || "audio/webm",
            });
            if (roomId) {
              await saveAssessment(
                audioBlob,
                roomId,
                currentTurn,
                currentSentence.scriptId,
              );
              setSentenceScores((prev) => ({
                ...prev,
                [currentSentence.id]: -1,
              }));
            }
          } catch (error) {
            console.error("평가 저장 실패:", error);
            setSentenceScores((prev) => ({
              ...prev,
              [currentSentence.id]: -2,
            }));
          }
        }
        setStep(STEP.RECORD_DONE);
      }, 100);
    }
  }, [currentSentence, roomId, currentTurn]);

  const goNextTurn = () => {
    if (currentTurn >= TURNS) {
      setStep(STEP.ALL_DONE);
      return;
    }
    setCurrentTurn((t) => t + 1);
    setCurrentSentenceIndex(0);
    setStep(STEP.AI_TIMER);
  };

  const startFlow = () => setStep(STEP.AI_TIMER);

  const restart = () => {
    clearAllTimers();
    setCurrentTurn(1);
    setCurrentSentenceIndex(0);
    setStep(STEP.IDLE);
    setSentenceScores({});
    setSelectedTurnForReport(null);
  };

  const handleComplete = () => {
    navigate("/minigame1", { state: { roomId } });
  };

  const handleBookmarkToggle = useCallback(async (sentenceId, isBookmarked) => {
    try {
      await toggleScriptLike(sentenceId);
      setBookmarkedSentences((prev) => {
        const next = isBookmarked
          ? [...new Set([...prev, sentenceId])]
          : prev.filter((id) => id !== sentenceId);
        localStorage.setItem("bookmarkedSentences", JSON.stringify(next));
        return next;
      });
    } catch (error) {
      console.error("북마크 실패:", error);
    }
  }, []);

  // --- Effect 로직 ---

  useEffect(() => {
    const saved = localStorage.getItem("bookmarkedSentences");
    if (saved) setBookmarkedSentences(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const fetchTurnScripts = async () => {
      if (!roomId || conversations[currentTurn]) return;
      try {
        const response = await getTurnScripts(roomId, currentTurn);
        const scripts = Array.isArray(response) ? response : [response];
        const formatted = scripts
          .sort((a, b) => (a.order_no || 0) - (b.order_no || 0))
          .map((s, i) => ({
            id: s.order_no ?? i + 1,
            scriptId: s.scriptId,
            speaker: s.speakerName || "참여자",
            korean: s.korean || "",
            english: s.english || "",
            blankWords: s.blank_script
              ? s.blank_script
                  .match(/\[([^\]]+)\]/g)
                  ?.map((w) => w.slice(1, -1)) || []
              : [],
            score: null,
            tts_url: s.tts_url || null,
          }));
        setConversations((prev) => ({ ...prev, [currentTurn]: formatted }));
      } catch (e) {
        console.error("스크립트 로드 실패:", e);
      }
    };
    fetchTurnScripts();
  }, [currentTurn, roomId, conversations]);

  // 메인 타이머 및 자동 흐름 제어
  useEffect(() => {
    clearAllTimers();

    if (step === STEP.AI_TIMER || step === STEP.RECORD_TIMER) {
      setCountdown(3);
      intervalRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearAllTimers();
            setStep(step === STEP.AI_TIMER ? STEP.AI_PLAYING : STEP.RECORDING);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else if (step === STEP.AI_PLAYING) {
      if (currentSentence?.tts_url) {
        const audio = new Audio(currentSentence.tts_url);
        audioRef.current = audio;
        audio.play().catch(() => setStep(STEP.RECORD_TIMER));
        audio.onended = () => setStep(STEP.RECORD_TIMER);
      } else {
        timerRef.current = setTimeout(
          () => setStep(STEP.RECORD_TIMER),
          AI_PLAYING_MS,
        );
      }
    } else if (step === STEP.RECORDING) {
      setRecordingTime(0);
      startRecording();
      intervalRef.current = setInterval(
        () => setRecordingTime((p) => p + 1),
        1000,
      );
    } else if (step === STEP.RECORD_DONE) {
      timerRef.current = setTimeout(() => goNextSentence(), 1500);
    }

    return () => clearAllTimers();
  }, [
    step,
    currentSentence,
    clearAllTimers,
    startRecording,
    stopRecording,
    goNextSentence,
  ]);

  // UI 데이터 가공
  const sentenceCardsData = useMemo(() => {
    const isReportMode = step === STEP.TURN_REPORT || step === STEP.ALL_DONE;
    return currentTurnSentences.map((s, i) => ({
      ...s,
      score: sentenceScores[s.id],
      isActive: isReportMode ? true : i === currentSentenceIndex,
      currentSentence: i + 1,
      totalSentences: currentTurnSentences.length,
      isBookmarked: bookmarkedSentences.includes(s.id),
    }));
  }, [
    currentTurnSentences,
    currentSentenceIndex,
    sentenceScores,
    bookmarkedSentences,
    step,
  ]);

  const bottomContent = () => {
    switch (step) {
      case STEP.IDLE:
        return <BottomIdle onNext={startFlow} onStart={startFlow} />;
      case STEP.AI_TIMER:
        return <BottomAITimer seconds={countdown} />;
      case STEP.AI_PLAYING:
        return <BottomAIPlaying />;
      case STEP.RECORD_TIMER:
        return <BottomRecordTimer seconds={countdown} />;
      case STEP.RECORDING:
        return <BottomRecording onStop={stopRecording} />;
      case STEP.RECORD_DONE:
        return (
          <BottomRecordDone isLast={isLastSentence} />
        );
      case STEP.TURN_REPORT:
        return (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              background: "#fff",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <button
              onClick={goNextTurn}
              style={{
                padding: "12px 32px",
                fontSize: "16px",
                fontWeight: "600",
                color: "#fff",
                background: "#2b7fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              {currentTurn >= TURNS ? "완료" : "다음 턴으로"}
            </button>
          </div>
        );
      case STEP.ALL_DONE:
        return (
          <BottomAllDone onRestart={restart} onComplete={handleComplete} />
        );
      default:
        return null;
    }
  };

  return (
    <Recordinglayout
      currentTurn={selectedTurnForReport || currentTurn}
      sentenceCards={sentenceCardsData}
      activeCardState={
        step === STEP.AI_PLAYING
          ? "ai_playing"
          : step === STEP.RECORD_TIMER
            ? "record_timer"
            : step === STEP.RECORDING
              ? "recording"
              : step === STEP.RECORD_DONE
                ? "record_done"
                : "idle"
      }
      countdown={countdown}
      recordingTime={recordingTime}
      bottomContent={bottomContent()}
      onBookmarkToggle={handleBookmarkToggle}
      totalTurns={TURNS}
      isAllDone={step === STEP.ALL_DONE}
      onTurnClick={(t) => step === STEP.ALL_DONE && setSelectedTurnForReport(t)}
      selectedTurnForReport={selectedTurnForReport}
    />
  );
}
