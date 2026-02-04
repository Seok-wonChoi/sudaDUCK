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
import api from "@/api/api"; // axios 인스턴스 import

// Components
import BottomIdle from "@/components/features/recording/bottom/BottomIdle";
import BottomAITimer from "@/components/features/recording/bottom/BottomAITimer";
import BottomAIPlaying from "@/components/features/recording/bottom/BottomAIPlaying";
import BottomRecordTimer from "@/components/features/recording/bottom/BottomRecordTimer";
import BottomRecording from "@/components/features/recording/bottom/BottomRecording";
import BottomRecordDone from "@/components/features/recording/bottom/BottomRecordDone";
import BottomAllDone from "@/components/features/recording/bottom/BottomAllDone";

// Libraries
import RecordRTC, { StereoAudioRecorder } from "recordrtc";

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
  ],
  2: [],
  3: [],
};

export default function RecordingPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const roomInfo = state?.roomInfo || {};
  const myUserId = state?.myUserId; // 본인 userId
  const participants = state?.participants || []; // 참여자 목록

  console.log("[RecordingPage] 페이지 로드 - 전체 state:", state);

  const TURNS = roomInfo.turnCount || 3;

  const [step, setStep] = useState(STEP.AI_TIMER);
  // state로 전달받은 currentTurn 사용
  const [currentTurn, setCurrentTurn] = useState(() => {
    return roomInfo.currentTurn ?? roomInfo.roomInfo?.currentTurn ?? 1;
  });

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
  // MediaRecorder 대신 RecordRTC 사용을 위한 ref
  const recorderRef = useRef(null);
  const audioRef = useRef(null);

  // roomId 추출
  const roomId = useMemo(() => {
    const fromState =
      roomInfo.roomId ||
      roomInfo.id ||
      roomInfo.roomCode ||
      roomInfo.inviteCode ||
      roomInfo.joinCode;

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

  // [수정] RecordRTC로 녹음 시작 (WAV 포맷)
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // RecordRTC 설정: Azure가 좋아하는 완벽한 WAV 포맷으로 설정
      const recorder = new RecordRTC(stream, {
        type: "audio",
        mimeType: "audio/wav", // WAV 포맷 강제
        recorderType: StereoAudioRecorder,
        numberOfAudioChannels: 1, // 모노 (Azure 권장)
        desiredSampRate: 16000, // 16kHz (Azure 권장)
      });

      recorder.startRecording();
      recorderRef.current = recorder; // ref에 저장

      console.log("녹음 시작 (WAV 포맷)");
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

  // [수정] RecordRTC로 녹음 중지 및 전송
  const stopRecording = useCallback(() => {
    if (!currentSentence || !currentSentence.scriptId) {
  console.error("❌ 발음 평가 실패: scriptId가 유효하지 않습니다.");
  return;
}
console.log(`📤 발음 평가 전송 시작`, {
  roomId,
  turnNo: currentTurn,
  scriptId: currentSentence.scriptId,
});

    const recorder = recorderRef.current;

    // 레코더가 없으면 함수 종료
    if (!recorder) return;

    // RecordRTC의 stopRecording은 콜백 방식으로 동작합니다.
    recorder.stopRecording(async () => {
      // 1. WAV Blob 생성
      const blob = recorder.getBlob();

      // 2. 마이크 스트림 정지
      try {
        const internalRecorder = recorder.getInternalRecorder();
        if (internalRecorder && internalRecorder.stream) {
          internalRecorder.stream.getTracks().forEach((track) => track.stop());
        }
      } catch (e) {
        console.warn("마이크 스트림 정지 중 경미한 오류:", e);
      }

      // 3. 방어 로직: 현재 문장 정보나 scriptId가 없으면 중단
      if (!currentSentence || !currentSentence.scriptId) {
        console.error(
          "❌ 발음 평가 실패: scriptId가 유효하지 않습니다.",
          currentSentence
        );
        setStep(STEP.RECORD_DONE);
        return;
      }

      // 4. API 전송 및 점수 업데이트
      if (blob && blob.size > 0) {
        try {
          console.log(`📤 발음 평가 전송 시작 (WAV, ${blob.size} bytes)`, {
            roomId,
            turnNo: currentTurn,
            scriptId: currentSentence.scriptId,
          });

          // UI 업데이트: 평가 중 상태(-1)
          setSentenceScores((prev) => ({
            ...prev,
            [currentSentence.id]: -1,
          }));

          // API 호출 (shadowing.js의 saveAssessment)
          const response = await saveAssessment(
            blob,
            roomId,
            currentTurn,
            currentSentence.scriptId
          );

          // [핵심] 백엔드에서 받은 점수(score)가 있으면 UI에 즉시 반영
          if (response && response.score) {
            const score = parseInt(response.score, 10);
            console.log("💯 발음 점수 수신:", score);

            setSentenceScores((prev) => ({
              ...prev,
              [currentSentence.id]: score, // 실제 점수로 업데이트
            }));
          } else {
            console.warn("⚠️ 응답에 점수가 없습니다.", response);
          }

          setStep(STEP.RECORD_DONE);
        } catch (error) {
          console.error("❌ 평가 저장 실패:", error);
          setSentenceScores((prev) => ({
            ...prev,
            [currentSentence.id]: -2,
          }));
          setStep(STEP.RECORD_DONE);
        }
      } else {
        console.warn("⚠️ 녹음된 데이터가 없습니다 (Blob size 0)");
        setStep(STEP.RECORD_DONE);
      }
    });
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
          roomId: roomId,
          roomCode: roomCode,
          currentTurn: nextTurn,
        },
        myUserId,
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

  // [수정] 북마크 토글: scriptId 기준으로 동작하도록 수정
  const handleBookmarkToggle = useCallback(
    async (id, isBookmarked) => {
      try {
        // id는 UI에서 넘어온 값 (보통 sentence.id = order_no일 가능성 높음)
        // currentTurnSentences에서 해당 문장의 진짜 scriptId 찾기
        const sentence = currentTurnSentences.find((s) => s.id === id);
        const realScriptId = sentence?.scriptId;

        if (!realScriptId) {
          console.error("스크립트 ID를 찾을 수 없습니다.");
          return;
        }

        console.log("[RecordingPage] 북마크 토글:", {
          id,
          realScriptId,
          roomId,
          isBookmarked,
          turnNo: selectedTurnForReport || currentTurn,
        });

        // API 호출
        await toggleScriptLike(
          realScriptId,
          roomId,
          selectedTurnForReport || currentTurn
        );

        // 상태 업데이트: scriptId 기준으로 저장
        setBookmarkedSentences((prev) => {
          const next = isBookmarked
            ? [...new Set([...prev, realScriptId])] // scriptId 저장
            : prev.filter((bkId) => bkId !== realScriptId);

          localStorage.setItem("bookmarkedSentences", JSON.stringify(next));
          return next;
        });
      } catch (error) {
        console.error("북마크 실패:", error);
        alert("북마크 저장에 실패했습니다.");
      }
    },
    [currentTurnSentences, roomId, selectedTurnForReport, currentTurn]
  );

  const handleRoomClosed = useCallback(() => {
    console.log("[RecordingPage] ROOM_CLOSED 수신 - 방장 퇴장");
    navigate("/main", {
      replace: true,
      state: { toastMessage: "방장이 퇴장하여 대화가 종료되었습니다." },
    });
  }, [navigate]);

  useRoomWebSocket(
    roomCode,
    {
      onRoomClosed: handleRoomClosed,
    },
    roomId
  );

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
      if (conversations[currentTurn]) {
        console.log(
          `[RecordingPage] turn ${currentTurn} 스크립트 이미 로드됨`
        );
        return;
      }

      setIsLoadingScript(true);
      setScriptError(null);

      if (!roomId) {
        console.warn(`[RecordingPage] roomId 없음 - 더미 데이터 사용`);
        setConversations((prev) => ({
          ...prev,
          [currentTurn]: DUMMY_CONVERSATIONS[currentTurn] || [],
        }));
        setIsLoadingScript(false);
        return;
      }

      try {
        console.log(`[RecordingPage] turn ${currentTurn} 스크립트 로드 시작`);
        const response = await getTurnScripts(roomId, currentTurn);
        console.log(`[RecordingPage] 응답:`, response);

        const scripts = Array.isArray(response) ? response : [response];

        if (
          scripts.length === 0 ||
          (scripts.length === 1 && !scripts[0]?.scriptId)
        ) {
          const errorMsg = `턴 ${currentTurn}의 스크립트를 불러올 수 없습니다.`;
          console.error(`[RecordingPage] ${errorMsg}`);
          setScriptError(errorMsg);
          setConversations((prev) => ({ ...prev, [currentTurn]: [] }));
          setIsLoadingScript(false);
          return;
        }

        const formatted = scripts
          .filter((s) => s && s.scriptId)
          .sort((a, b) => (a.order_no || 0) - (b.order_no || 0))
          .map((s, i) => {
            let speakerName =
              s.speakerName ||
              s.speaker ||
              s.userName ||
              s.nickname ||
              s.name ||
              null;

            if (
              !speakerName &&
              participants &&
              participants.length > 0
            ) {
              const firstParticipant = participants[0];
              speakerName =
                firstParticipant?.name ||
                firstParticipant?.nickname ||
                "참여자";
            }

            if (!speakerName || speakerName === "Unknown") {
              speakerName = "참여자";
            }

            let isMe = false;
            if (participants && participants.length > 0) {
              const myParticipant = participants.find(
                (p) => p.isMe === true
              );
              if (myParticipant) {
                isMe =
                  participants.length === 1 && myParticipant.isMe;
              }
            }

            const displayName = isMe
              ? `${speakerName}(나)`
              : speakerName;

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

        console.log(
          `[RecordingPage] 포맷팅 완료 (${formatted.length}개):`,
          formatted
        );
        setConversations((prev) => ({
          ...prev,
          [currentTurn]: formatted,
        }));
        setIsLoadingScript(false);
      } catch (e) {
        console.error(`[RecordingPage] 로드 실패:`, e);
        const errorMsg = `오류 발생: ${e.message || "네트워크 오류"}`;
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
      if (conversations[currentTurn] === undefined) return;
      if (conversations[currentTurn].length === 0) return;

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
        // TTS URL 보정 (프록시용)
        let ttsUrl = currentSentence.tts_url;
        if (ttsUrl && ttsUrl.startsWith("/audio")) {
          ttsUrl = ttsUrl.replace("/audio", "/api/v1/audio");
        }

        const accessToken = localStorage.getItem("accessToken");

        api
          .get(ttsUrl, {
            headers: accessToken
              ? { Authorization: `Bearer ${accessToken}` }
              : {},
            responseType: "blob",
          })
          .then((response) => {
            const blob = response.data;
            const blobUrl = URL.createObjectURL(blob);
            const audio = new Audio(blobUrl);
            audioRef.current = audio;

            audio.onended = () => {
              URL.revokeObjectURL(blobUrl);
              setStep(STEP.RECORD_TIMER);
            };

            audio.onerror = () => {
              URL.revokeObjectURL(blobUrl);
              setStep(STEP.RECORD_TIMER);
            };

            audio.play().catch(() => {
              URL.revokeObjectURL(blobUrl);
              setStep(STEP.RECORD_TIMER);
            });
          })
          .catch(() => {
            setStep(STEP.RECORD_TIMER);
          });
      } else {
        timerRef.current = setTimeout(
          () => setStep(STEP.RECORD_TIMER),
          AI_PLAYING_MS
        );
      }
    } else if (step === STEP.RECORDING) {
      setRecordingTime(0);
      setRecordingCountdown(10);
      startRecording();

      intervalRef.current = setInterval(() => {
        setRecordingTime((p) => p + 1);
        setRecordingCountdown((c) => {
          if (c <= 1) {
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
    const isReportMode =
      step === STEP.TURN_REPORT || step === STEP.ALL_DONE;
    return currentTurnSentences.map((s, i) => ({
      ...s,
      scriptId: s.scriptId,
      score: sentenceScores[s.id],
      isActive: isReportMode ? true : i === currentSentenceIndex,
      currentSentence: i + 1,
      totalSentences: currentTurnSentences.length,
      // [수정] id가 아니라 scriptId로 북마크 여부 확인
      isBookmarked: bookmarkedSentences.includes(s.scriptId),
    }));
  }, [
    currentTurnSentences,
    currentSentenceIndex,
    sentenceScores,
    bookmarkedSentences,
    step,
  ]);

  const bottomContent = () => {
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
          <p
            style={{
              fontSize: "14px",
              color: "#ef4444",
              whiteSpace: "pre-line",
              marginBottom: "16px",
            }}
          >
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
        return <BottomRecordDone isLast={isLastSentence} />;
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