import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Recordinglayout from "@/components/features/recording/layout/RecordingLayout";
import {
  saveAssessment,
  toggleScriptLike,
  getTurnScripts,
} from "@/api/shadowing";
import { leaveRoom } from "@/api/rooms";
import useRoomWebSocket from "@/hooks/useRoomWebSocket";

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
  const myUserId = state?.myUserId; // 본인 userId

  console.log("[RecordingPage] 페이지 로드 - 전체 state:", state);
  console.log("[RecordingPage] roomInfo:", roomInfo);
  console.log("[RecordingPage] myUserId:", myUserId);

  const TURNS = roomInfo.turnCount || 3;

  const [step, setStep] = useState(STEP.AI_TIMER);
  // state로 전달받은 currentTurn 사용 (TogetherTalkPage에서 전달)
  const [currentTurn, setCurrentTurn] = useState(roomInfo.currentTurn || 1);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingCountdown, setRecordingCountdown] = useState(10); // 녹음 카운트다운 (10초)
  const [sentenceScores, setSentenceScores] = useState({});
  const [bookmarkedSentences, setBookmarkedSentences] = useState([]);
  const [conversations, setConversations] = useState({});
  const [selectedTurnForReport, setSelectedTurnForReport] = useState(null);
  const [scriptError, setScriptError] = useState(null);
  const [isLoadingScript, setIsLoadingScript] = useState(false);

  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const audioRef = useRef(null);

  // roomId 추출 (우선순위: roomId > id > roomCode > inviteCode > joinCode)
  const roomId = useMemo(() => {
    console.log("[RecordingPage] roomId 추출 시작 - roomInfo 상세:", {
      roomId: roomInfo.roomId,
      id: roomInfo.id,
      roomCode: roomInfo.roomCode,
      inviteCode: roomInfo.inviteCode,
      joinCode: roomInfo.joinCode,
      전체: roomInfo,
    });

    const fromState =
      roomInfo.roomId ||
      roomInfo.id ||
      roomInfo.roomCode ||
      roomInfo.inviteCode ||
      roomInfo.joinCode;

    console.log("[RecordingPage] roomId 추출 결과:", fromState);

    if (fromState) return fromState;
    try {
      const testRoomInfo = sessionStorage.getItem("testRoomInfo");
      if (testRoomInfo) return JSON.parse(testRoomInfo).id;
    } catch (e) {
      /* ignore */
    }
    return null;
  }, [roomInfo]);

  // roomCode 추출
  const roomCode = useMemo(() => {
    return (
      roomInfo.roomCode ||
      roomInfo.inviteCode ||
      roomInfo.joinCode ||
      roomInfo.code ||
      ""
    );
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

  // --- 함수들 ---

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
      // 마지막 턴이면 ALL_DONE으로 이동
      setStep(STEP.ALL_DONE);
      return;
    }

    // 다음 턴이 있으면 TogetherTalkPage로 돌아가기
    const nextTurn = currentTurn + 1;
    console.log("[RecordingPage] 다음 턴으로 이동:", {
      currentTurn,
      nextTurn,
      roomId,
      roomCode,
    });

    navigate("/together/talk", {
      replace: true,
      state: {
        ...state,
        roomInfo: {
          ...roomInfo,
          roomId: roomId, // roomId 명시적으로 전달
          roomCode: roomCode, // roomCode도 전달
          currentTurn: nextTurn, // 다음 턴 번호 전달
        },
        myUserId, // myUserId도 전달
      },
    });
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
      // sentenceId는 order_no가 아니라 실제 scriptId여야 함
      // currentTurnSentences에서 해당 문장 찾기
      const sentence = currentTurnSentences.find(s => s.id === sentenceId);
      const scriptIdToUse = sentence?.scriptId || sentenceId;

      console.log("[RecordingPage] 북마크 토글:", {
        sentenceId,
        scriptIdToUse,
        isBookmarked,
        sentence,
      });

      await toggleScriptLike(scriptIdToUse);

      setBookmarkedSentences((prev) => {
        const next = isBookmarked
          ? [...new Set([...prev, sentenceId])]
          : prev.filter((id) => id !== sentenceId);
        localStorage.setItem("bookmarkedSentences", JSON.stringify(next));
        console.log("[RecordingPage] 북마크 업데이트:", next);
        return next;
      });
    } catch (error) {
      console.error("북마크 실패:", error);
      alert("북마크 저장에 실패했습니다.");
    }
  }, [currentTurnSentences]);

  const handleRoomClosed = useCallback(() => {
    console.log("[RecordingPage] ROOM_CLOSED 수신 - 방장 퇴장");
    navigate("/", {
      replace: true,
      state: { toastMessage: "방장이 퇴장하여 대화가 종료되었습니다." },
    });
  }, [navigate]);

  useRoomWebSocket(roomCode, {
    onRoomClosed: handleRoomClosed,
  }, roomId);

  const handleLogoExit = useCallback(async () => {
    if (roomCode) {
      try {
        await leaveRoom({ roomCode });
        console.log("[RecordingPage] 방 퇴장 성공");
      } catch (e) {
        console.error("[RecordingPage] 방 퇴장 실패:", e);
      }
    }
  }, [roomCode]);

  // --- Effect 로직 ---

  useEffect(() => {
    const saved = localStorage.getItem("bookmarkedSentences");
    if (saved) setBookmarkedSentences(JSON.parse(saved));
  }, []);

  // 턴 스크립트 로드
  useEffect(() => {
    const fetchTurnScripts = async () => {
      // 이미 로드된 경우 스킵
      if (conversations[currentTurn]) {
        console.log(`[RecordingPage] turn ${currentTurn} 스크립트 이미 로드됨`);
        return;
      }

      setIsLoadingScript(true);
      setScriptError(null);

      // roomId가 없으면 더미 데이터 사용
      if (!roomId) {
        console.warn(`[RecordingPage] roomId 없음 - 더미 데이터 사용`);
        setConversations((prev) => ({
          ...prev,
          [currentTurn]: DUMMY_CONVERSATIONS[currentTurn] || [],
        }));
        setIsLoadingScript(false);
        return;
      }

      // roomId가 있으면 API로 스크립트 로드
      try {
        console.log(`[RecordingPage] turn ${currentTurn} 스크립트 로드 시작`);
        console.log(`[RecordingPage] API 호출 파라미터: roomId=${roomId}, turnNo=${currentTurn}`);
        console.log(`[RecordingPage] API URL: /api/v1/session/${roomId}/turns/${currentTurn}/scripts`);

        const response = await getTurnScripts(roomId, currentTurn);

        console.log(`[RecordingPage] turn ${currentTurn} 스크립트 API 응답:`, response);
        console.log(`[RecordingPage] 응답 타입:`, typeof response, Array.isArray(response) ? '배열' : '객체');

        const scripts = Array.isArray(response) ? response : [response];

        if (scripts.length === 0 || (scripts.length === 1 && !scripts[0]?.scriptId)) {
          const errorMsg = `턴 ${currentTurn}의 스크립트를 불러올 수 없습니다.\n대화 내용이 저장되지 않았을 수 있습니다.`;
          console.error(`[RecordingPage] ${errorMsg}`);
          setScriptError(errorMsg);
          setConversations((prev) => ({ ...prev, [currentTurn]: [] }));
          setIsLoadingScript(false);
          return;
        }

        const formatted = scripts
          .filter(s => s && s.scriptId) // null/undefined 필터링
          .sort((a, b) => (a.order_no || 0) - (b.order_no || 0))
          .map((s, i) => {
            // 발화자 이름 추출 (여러 필드명 시도)
            const speakerName = s.speakerName || s.speaker || s.userName || s.nickname || "참여자";
            const speakerId = s.speakerId || s.userId || s.memberId;

            // 본인이 말한 경우 "(나)" 추가
            const isMe = myUserId && speakerId && String(speakerId) === String(myUserId);
            const displayName = isMe ? `${speakerName}(나)` : speakerName;

            console.log(`[RecordingPage] 스크립트 ${i + 1} 발화자:`, {
              speakerName,
              speakerId,
              myUserId,
              isMe,
              displayName,
              원본: s,
            });

            return {
              id: s.order_no ?? i + 1,
              scriptId: s.scriptId,
              speaker: displayName,
              korean: s.korean || "",
              english: s.english || "",
              blankWords: s.blank_script
                ? s.blank_script
                    .match(/\[([^\]]+)\]/g)
                    ?.map((w) => w.slice(1, -1)) || []
                : [],
              score: null,
              tts_url: s.tts_url || null,
            };
          });

        console.log(`[RecordingPage] turn ${currentTurn} 스크립트 포맷팅 완료 (${formatted.length}개):`, formatted);
        setConversations((prev) => ({ ...prev, [currentTurn]: formatted }));
        setIsLoadingScript(false);
      } catch (e) {
        console.error(`[RecordingPage] turn ${currentTurn} 스크립트 로드 실패:`, e);
        const errorMsg = `턴 ${currentTurn}의 스크립트를 불러오는 중 오류가 발생했습니다.\n${e.message || '네트워크 오류'}`;
        setScriptError(errorMsg);
        setConversations((prev) => ({ ...prev, [currentTurn]: [] }));
        setIsLoadingScript(false);
      }
    };
    fetchTurnScripts();
  }, [currentTurn, roomId, conversations]);

  // 메인 타이머 및 자동 흐름 제어
  useEffect(() => {
    clearAllTimers();

    if (step === STEP.AI_TIMER) {
      // ★ 스크립트가 아직 로드되지 않은 경우 대기
      if (conversations[currentTurn] === undefined) {
        console.log(`[RecordingPage] turn ${currentTurn} 스크립트 로드 대기 중...`);
        return;
      }

      // ★ 해당 턴의 스크립트가 빈 배열인 경우 (스크립트 없음)
      if (conversations[currentTurn].length === 0) {
        console.error(`[RecordingPage] turn ${currentTurn} 스크립트가 없어서 진행 불가`);
        // 에러가 있으면 그대로 대기 (자동으로 넘어가지 않음)
        return;
      }

      // 정상: 3초 카운트다운 시작
      setCountdown(3);
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
    } else if (step === STEP.RECORD_TIMER) {
      setCountdown(3);
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
      setRecordingCountdown(10); // 10초 카운트다운 시작
      startRecording();

      // 1초마다 recordingTime 증가 및 카운트다운 감소
      intervalRef.current = setInterval(() => {
        setRecordingTime((p) => p + 1);
        setRecordingCountdown((c) => {
          if (c <= 1) {
            // 10초가 지나면 자동으로 녹음 중지
            clearAllTimers();
            stopRecording();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else if (step === STEP.RECORD_DONE) {
      timerRef.current = setTimeout(() => goNextSentence(), 1500);
    }

    return () => clearAllTimers();
  }, [
    step,
    currentTurn,
    currentSentence,
    conversations,
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
      scriptId: s.scriptId, // scriptId 명시적으로 포함
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
    // 스크립트 로딩 중
    if (isLoadingScript) {
      return (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            background: "#fff",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <p style={{ fontSize: "16px", color: "#666" }}>
            스크립트를 불러오는 중입니다...
          </p>
        </div>
      );
    }

    // 스크립트 로드 실패
    if (scriptError) {
      return (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            background: "#fff",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <p style={{ fontSize: "14px", color: "#ef4444", whiteSpace: "pre-line", marginBottom: "16px" }}>
            {scriptError}
          </p>
          <button
            onClick={() => navigate("/together/talk", { replace: true, state })}
            style={{
              padding: "12px 32px",
              fontSize: "16px",
              fontWeight: "600",
              color: "#fff",
              background: "#6b7280",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            대화 페이지로 돌아가기
          </button>
        </div>
      );
    }

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
        return <BottomRecording />;
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
      recordingCountdown={recordingCountdown}
      bottomContent={bottomContent()}
      onBookmarkToggle={handleBookmarkToggle}
      totalTurns={TURNS}
      isAllDone={step === STEP.ALL_DONE}
      onTurnClick={(t) => step === STEP.ALL_DONE && setSelectedTurnForReport(t)}
      selectedTurnForReport={selectedTurnForReport}
      logoExitMessage="메인 화면으로 나가시겠습니까?"
      onLogoExit={handleLogoExit}
    />
  );
}
