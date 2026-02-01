import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./TogetherTalkPage.module.css";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import ExitGuard from "@/components/common/ExitGuard/ExitGuard";
import ExitButton from "@/components/common/ExitButton/ExitButton";
import TimerGauge from "@/components/common/TimerGauge/TimerGauge";

import {
  leaveRoom,
  startSilenceMonitoring,
  stopSilenceMonitoring,
  recordVoiceActivity,
  getRoomLobby,
  endRoom,
} from "@/api/rooms";
import { scheduleQuiz, submitQuizAnswer } from "@/api/quiz";
import { translateToEnglish } from "@/api/translate";
import useRoomWebSocket from "@/hooks/useRoomWebSocket";

import duckImg from "@/assets/images/duck.png";
import duckBotCyanImg from "@/assets/images/duck_bot_cyan.png";
import duckHappyImg from "@/assets/images/duck_happy.png";
import duckBombImg from "@/assets/images/duck_bomb.png";
import duckSadImg from "@/assets/images/duck_sad.png";
import micOnIcon from "@/assets/icons/mic_on.png";
import micOffIcon from "@/assets/icons/mic_off.png";

import UnexpectedQuestOverlay from "@/components/features/unexpected-quest/UnexpectedQuestOverlay";
import UnexpectedQuestFillBlankModal from "@/components/features/unexpected-quest/UnexpectedQuestFillBlankModal";

const ROOM_INFO_KEY = "together_room_info";

function VoiceWave({ level, enabled }) {
  const multipliers = useMemo(() => [0.5, 0.7, 0.85, 1, 0.85, 0.7, 0.5], []);
  const v = Math.max(0, Math.min(1, level));

  return (
    <span
      className={`${styles.Wave} ${enabled ? styles.WaveOn : styles.WaveOff}`}
      aria-hidden="true"
    >
      {multipliers.map((m, idx) => {
        const h = enabled ? 10 + v * 16 * m : 10;
        return (
          <span
            key={idx}
            className={`${styles.WaveBar} ${styles[`WaveBar${idx + 1}`]}`}
            style={{ height: `${h}px` }}
          />
        );
      })}
    </span>
  );
}

function safeParseJson(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function getUserIdFromToken() {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const payload = JSON.parse(jsonPayload);
    return (
      payload.memberId ??
      payload.userId ??
      payload.id ??
      payload.user_id ??
      payload.sub ??
      null
    );
  } catch {
    return null;
  }
}

export default function TogetherTalkPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [hydratedInfo, setHydratedInfo] = useState(() => {
    if (location.state) return location.state;

    const saved = sessionStorage.getItem(ROOM_INFO_KEY);
    const parsed = saved ? safeParseJson(saved) : null;
    return parsed ?? null;
  });

  useEffect(() => {
    if (location.state) {
      setHydratedInfo(location.state);
      try {
        sessionStorage.setItem(ROOM_INFO_KEY, JSON.stringify(location.state));
      } catch {
        // ignore
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (!hydratedInfo) {
      navigate("/together", { replace: true });
    }
  }, [hydratedInfo, navigate]);

  const roomInfo = hydratedInfo ?? {};

  const resolvedRoomCode = useMemo(() => {
    return (
      roomInfo.roomCode ||
      roomInfo.inviteCode ||
      roomInfo.joinCode ||
      roomInfo.code ||
      roomInfo.roomInfo?.roomCode ||
      ""
    );
  }, [roomInfo]);

  const [topic, setTopic] = useState(roomInfo.topic ?? "좋아하는 음식");
  const [maxCount, setMaxCount] = useState(roomInfo.maxCount ?? 4);

  const [roomId, setRoomId] = useState(roomInfo.roomId ?? null);

  // ★ hydratedInfo 변경 시 roomId 업데이트 (RecordingPage에서 돌아올 때)
  useEffect(() => {
    if (hydratedInfo?.roomInfo?.roomId) {
      setRoomId(hydratedInfo.roomInfo.roomId);
    }
  }, [hydratedInfo]);

  // RecordingPage에서 돌아올 때 증가된 턴 번호를 유지
  const [currentTurn, setCurrentTurn] = useState(() => {
    return roomInfo.currentTurn ?? 1;
  });

  const myUserId = useMemo(() => {
    return roomInfo.myUserId ?? getUserIdFromToken();
  }, [roomInfo.myUserId]);

  const [participants, setParticipants] = useState(() => {
    const raw = Array.isArray(roomInfo.participants)
      ? roomInfo.participants
      : [];
    return raw.map((p) => ({
      id: p.id ?? p.email ?? "unknown",
      name: p.name ?? p.nickname ?? "참여자",
      isMe: p.isMe === true,
      micOn: p.micOn ?? false,
      isHost: p.isHost ?? false,
      voiceLevel: p.voiceLevel ?? 0,
      isSpeaking: false,
    }));
  });

  // 방장 여부 확인
  const isHost = useMemo(() => {
    const me = participants.find((p) => p.isMe === true);
    return me?.isHost ?? false;
  }, [participants]);

  const syncLobby = useCallback(async () => {
    if (!resolvedRoomCode) return;

    try {
      const data = await getRoomLobby(resolvedRoomCode);

      if (data?.topic) setTopic(data.topic);
      if (data?.roomId) setRoomId(data.roomId);

      const members = Array.isArray(data?.participants)
        ? data.participants
        : [];

      const myIdStr = myUserId != null ? String(myUserId) : null;

      const mapped = members.map((m) => {
        const idStr = String(m.userId ?? "");
        return {
          id: idStr || "unknown",
          name: m.nickname ?? "참여자",
          isMe: myIdStr ? idStr === myIdStr : false,
          micOn: m.micOn ?? false,
          isHost: m.isHost ?? false,
          voiceLevel: 0,
          isSpeaking: false,
        };
      });

      if (mapped.length > 0) {
        setParticipants(mapped);
      }

      if (data?.maxCount) {
        setMaxCount(data.maxCount);
      }
    } catch (e) {
      console.error("[TogetherTalkPage] getRoomLobby 실패:", e);
    }
  }, [resolvedRoomCode, myUserId]);

  useEffect(() => {
    syncLobby();
  }, [syncLobby]);

  const slots = useMemo(() => {
    const arr = [];
    for (let i = 0; i < maxCount; i += 1) {
      const p = participants[i];
      if (p) arr.push({ kind: "filled", p });
      else arr.push({ kind: "empty", id: `empty-${i + 1}` });
    }
    return arr;
  }, [maxCount, participants]);

  const [micOn, setMicOn] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [aiSuggestion, setAiSuggestion] = useState("");

  const aiTimeoutRef = useRef(null);

  const handleConversationSuggestion = useCallback((question) => {
    setAiSuggestion(question || "");

    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }

    aiTimeoutRef.current = setTimeout(() => {
      setAiSuggestion("");
      aiTimeoutRef.current = null;
    }, 10000);
  }, []);

  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
    };
  }, []);

  const handleSilenceDetected = useCallback((payload, senderKey) => {
    console.log("🔇 [정적 감지] 15초 동안 대화가 없었습니다!", {
      payload,
      senderKey,
      roomId,
      currentTurn,
    });
  }, [roomId, currentTurn]);

  const handleVoiceLevelChanged = useCallback((payload, senderKey) => {
    if (!senderKey) return;
    const k = String(senderKey);

    setParticipants((prev) =>
      prev.map((p) =>
        p.id === k ? {
          ...p,
          voiceLevel: payload?.level ?? 0,
          isSpeaking: (payload?.level ?? 0) > 0.03
        } : p
      )
    );
  }, []);

  const handleMicChanged = useCallback((payload, senderKey) => {
    if (!senderKey) return;
    const k = String(senderKey);

    console.log("[TogetherTalkPage] MIC_CHANGED 수신:", {
      senderKey: k,
      micOn: payload?.micOn,
    });

    setParticipants((prev) =>
      prev.map((p) =>
        p.id === k ? { ...p, micOn: payload?.micOn ?? false } : p
      )
    );
  }, []);

  // 대화 종료 시 모든 참여자가 /recording으로 이동
  const handleRoomEnded = useCallback((payload) => {
    console.log("[TogetherTalkPage] ROOM_ENDED 수신 - /recording으로 이동", payload);
    console.log("[TogetherTalkPage] 전달할 데이터:", {
      roomId: payload?.roomInfo?.roomId ?? roomId,
      roomCode: resolvedRoomCode,
      currentTurn,
      turnCount: payload?.roomInfo?.turnCount ?? roomInfo.turnCount ?? roomInfo.turnCnt ?? 3,
    });

    navigate("/recording", {
      replace: true,
      state: {
        mode: "together",
        roomInfo: {
          ...roomInfo,
          roomId: payload?.roomInfo?.roomId ?? roomId,
          roomCode: resolvedRoomCode,
          turnCount: payload?.roomInfo?.turnCount ?? roomInfo.turnCount ?? roomInfo.turnCnt ?? 3,
          currentTurn: currentTurn, // 현재 턴 번호 전달
        },
        participants,
        myUserId, // 본인 userId 전달
      },
    });
  }, [navigate, roomInfo, roomId, participants, currentTurn, resolvedRoomCode]);

  // 방장 퇴장 시 메인 화면으로 강제 이동
  const handleRoomClosed = useCallback(() => {
    console.log("[TogetherTalkPage] ROOM_CLOSED 수신 - 방장 퇴장");
    navigate("/", {
      replace: true,
      state: { toastMessage: "방장이 퇴장하여 대화가 종료되었습니다." },
    });
  }, [navigate]);

  // ★ useRoomWebSocket에 roomId 전달 (정적감지 구독용)
  const { sendEndRoom, sendVoiceLevel, sendMic } = useRoomWebSocket(resolvedRoomCode, {
    onConversationSuggestion: handleConversationSuggestion,
    onSilenceDetected: handleSilenceDetected,
    onRoomEnded: handleRoomEnded,
    onRoomClosed: handleRoomClosed,
    onVoiceLevelChanged: handleVoiceLevelChanged,
    onMicChanged: handleMicChanged,
    onConnected: () => console.log("WebSocket 연결됨 (TogetherTalkPage)"),
    onDisconnected: () =>
      console.log("WebSocket 연결 해제됨 (TogetherTalkPage)"),
  }, roomId);

  const audioRef = useRef({
    stream: null,
    ctx: null,
    analyser: null,
    source: null,
    rafId: null,
    lastVoiceAt: 0,
    speakingNow: false,
    level: 0,
    lastUiAt: 0,
  });

  const stopAudioAnalysis = useCallback(async () => {
    const a = audioRef.current;

    if (a.rafId) {
      cancelAnimationFrame(a.rafId);
      a.rafId = null;
    }

    if (a.stream) {
      a.stream.getTracks().forEach((t) => t.stop());
      a.stream = null;
    }

    if (a.ctx) {
      try {
        await a.ctx.close();
      } catch {
        // ignore
      }
      a.ctx = null;
    }

    a.analyser = null;
    a.source = null;
    a.lastVoiceAt = 0;
    a.speakingNow = false;
    a.level = 0;
    a.lastUiAt = 0;

    setIsSpeaking(false);
    setVoiceLevel(0);
  }, []);

  const startAudioAnalysis = useCallback(async () => {
    const a = audioRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      a.stream = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      a.ctx = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.85;
      a.analyser = analyser;

      const source = ctx.createMediaStreamSource(stream);
      a.source = source;
      source.connect(analyser);

      const data = new Float32Array(analyser.fftSize);

      const THRESHOLD = 0.03;
      const HOLD_MS = 220;
      const UI_INTERVAL_MS = 60;

      const tick = () => {
        if (!a.analyser) return;

        if (typeof a.analyser.getFloatTimeDomainData === "function") {
          a.analyser.getFloatTimeDomainData(data);

          let sum = 0;
          for (let i = 0; i < data.length; i += 1) {
            const v = data[i];
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);

          const now = performance.now();

          if (rms > THRESHOLD) a.lastVoiceAt = now;
          const speaking = now - a.lastVoiceAt < HOLD_MS;

          if (speaking !== a.speakingNow) {
            a.speakingNow = speaking;
            setIsSpeaking(speaking);
          }

          const raw = Math.max(0, Math.min(1, (rms - 0.005) / 0.08));
          a.level = a.level * 0.82 + raw * 0.18;

          if (now - a.lastUiAt > UI_INTERVAL_MS) {
            a.lastUiAt = now;
            setVoiceLevel(a.level);
          }
        }

        a.rafId = requestAnimationFrame(tick);
      };

      try {
        await ctx.resume();
      } catch {
        // ignore
      }

      tick();
    } catch {
      setIsSpeaking(false);
      setVoiceLevel(0);
    }
  }, []);

  useEffect(() => {
    startAudioAnalysis();

    if (roomId && currentTurn) {
      startSilenceMonitoring(roomId, currentTurn).catch((e) => {
        console.error("정적 감지 시작 실패:", e);
      });
    }

    return () => {
      stopAudioAnalysis();

      if (roomId) {
        stopSilenceMonitoring(roomId).catch((e) => {
          console.error("정적 감지 중지 실패:", e);
        });
      }
    };
  }, [startAudioAnalysis, stopAudioAnalysis, roomId, currentTurn]);

  useEffect(() => {
    if (isSpeaking && roomId && myUserId && currentTurn) {
      recordVoiceActivity(roomId, myUserId, currentTurn).catch((e) => {
        console.error("음성 활동 기록 실패:", e);
      });
    }
  }, [isSpeaking, roomId, myUserId, currentTurn]);

  const lastLocalSentRef = useRef({ at: 0, level: 0 });

  useEffect(() => {
    if (!micOn) return;

    const now = performance.now();
    const last = lastLocalSentRef.current;

    if (now - last.at < 120) return;
    if (Math.abs(voiceLevel - last.level) < 0.02) return;

    lastLocalSentRef.current = { at: now, level: voiceLevel };
    if (voiceLevel > 0) sendVoiceLevel(voiceLevel);
  }, [voiceLevel, micOn, sendVoiceLevel]);

  const toggleMic = useCallback(async () => {
    if (micOn) {
      setMicOn(false);
      sendMic(false);
      await stopAudioAnalysis();
      return;
    }
    setMicOn(true);
    sendMic(true);
    await startAudioAnalysis();
  }, [micOn, startAudioAnalysis, stopAudioAnalysis, sendMic]);

  const doLeaveRoom = useCallback(async () => {
    await stopAudioAnalysis();

    if (roomId) {
      try {
        await stopSilenceMonitoring(roomId);
      } catch (e) {
        console.error("정적 감지 중지 실패:", e);
      }
    }

    if (resolvedRoomCode) {
      try {
        await leaveRoom({ roomCode: resolvedRoomCode });
      } catch (e) {
        console.error("방 퇴장 API 호출 실패:", e);
      }
    }
  }, [stopAudioAnalysis, roomId, resolvedRoomCode]);

  // ★ handleEnd: sendEndRoom(WS) 대신 endRoom REST API 호출
  // 백엔드에 /app/rooms/{roomCode}/end WS 핸들러가 없음 → REST API만 존재
  const handleEnd = useCallback(async () => {
    // 방장만 대화 종료 가능
    if (!isHost) return;

    console.log("[TogetherTalkPage] 대화 종료 - 전달할 데이터:", {
      roomId,
      roomCode: resolvedRoomCode,
      currentTurn,
      turnCount: roomInfo.turnCount || roomInfo.turnCnt || 3,
    });

    // REST API로 방 종료 (이벤트는 백엔드에서 ROOM_ENDED WS로 브로드캐스트됨)
    try {
      await endRoom(resolvedRoomCode);
      console.log("[TogetherTalkPage] endRoom REST API 성공");
    } catch (e) {
      console.error("[TogetherTalkPage] endRoom REST API 실패:", e);
    }

    await doLeaveRoom();

    navigate("/recording", {
      replace: true,
      state: {
        mode: "together",
        roomInfo: {
          ...roomInfo,
          roomId: roomId,
          roomCode: resolvedRoomCode,
          turnCount: roomInfo.turnCount || roomInfo.turnCnt || 3,
          currentTurn: currentTurn, // 현재 턴 번호 전달
        },
        participants,
        myUserId, // 본인 userId 전달
      },
    });
  }, [doLeaveRoom, navigate, roomInfo, participants, roomId, isHost, resolvedRoomCode, currentTurn, myUserId]);

  // ★ handleDone: 타이머 종료 시에도 REST API 호출
  const handleDone = useCallback(async () => {
    console.log("[TogetherTalkPage] 타이머 종료 - 전달할 데이터:", {
      roomId,
      roomCode: resolvedRoomCode,
      currentTurn,
      turnCount: roomInfo.turnCount || roomInfo.turnCnt || 3,
    });

    if (isHost) {
      try {
        await endRoom(resolvedRoomCode);
        console.log("[TogetherTalkPage] endRoom REST API 성공 (타이머 종료)");
      } catch (e) {
        console.error("[TogetherTalkPage] endRoom REST API 실패 (타이머 종료):", e);
      }
    }

    await doLeaveRoom();

    navigate("/recording", {
      replace: true,
      state: {
        mode: "together",
        roomInfo: {
          ...roomInfo,
          roomId: roomId,
          roomCode: resolvedRoomCode,
          turnCount: roomInfo.turnCount || roomInfo.turnCnt || 3,
          currentTurn: currentTurn, // 현재 턴 번호 전달
        },
        participants,
        myUserId, // 본인 userId 전달
      },
    });
  }, [doLeaveRoom, navigate, isHost, roomId, roomInfo, participants, resolvedRoomCode, currentTurn, myUserId]);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/together");
  }, [navigate]);

  /* =========================
     돌발 퀘스트 (수동 시작 1/2)
  ========================= */
  const [isRoomTimerRunning, setIsRoomTimerRunning] = useState(true);

  const [activeQuest, setActiveQuest] = useState(null); // 1 | 2 | null
  const [questStep, setQuestStep] = useState("idle"); // idle | q1intro | q1ready | q1showQuestion | q1answering | intro | q2game | resultFail | resultSuccess
  const [isCorrect, setIsCorrect] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [quizId, setQuizId] = useState(null);
  const [quizQuestion, setQuizQuestion] = useState("What is your favorite food?");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const questRunning = questStep !== "idle";

  const endQuestAndResume = useCallback(() => {
    setActiveQuest(null);
    setQuestStep("idle");
    setIsRoomTimerRunning(true);
    setCountdown(3);
    setQuizId(null);
    setQuizQuestion("What is your favorite food?");
    setIsRecording(false);
    setRecordedAudio(null);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startQuest = useCallback(
    (id) => {
      if (questRunning) return;
      if (id !== 1 && id !== 2) return;

      setActiveQuest(id);
      setIsRoomTimerRunning(false);

      if (id === 1) {
        setQuestStep("q1intro");
        return;
      }

      // id === 2
      setQuestStep("intro");
    },
    [questRunning],
  );

  const handleOverlayClickNext = useCallback(() => {
    if (questStep === "q1intro" && activeQuest === 1) {
      setQuestStep("q1ready");
      setCountdown(3);
      return;
    }

    if (questStep === "q1showQuestion" && activeQuest === 1) {
      setQuestStep("q1answering");
      return;
    }

    if (questStep === "intro" && activeQuest === 2) {
      setQuestStep("q2game");
      return;
    }

    if (questStep === "resultFail" || questStep === "resultSuccess") {
      endQuestAndResume();
    }
  }, [questStep, activeQuest, endQuestAndResume]);

  // 퀘스트 1: 카운트다운 자동 진행
  useEffect(() => {
    if (questStep !== "q1ready" || activeQuest !== 1) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setQuestStep("q1showQuestion");
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [questStep, activeQuest]);

  // 퀘스트 1: 영어 문장 표시 후 3초 뒤 자동으로 answering 전환
  useEffect(() => {
    if (questStep !== "q1showQuestion" || activeQuest !== 1) return;

    const timer = setTimeout(() => {
      setQuestStep("q1answering");
    }, 3000);

    return () => clearTimeout(timer);
  }, [questStep, activeQuest]);

  // 3번째 턴 시작 시 퀴즈 스케줄 (15-40초 후 랜덤 발생)
  useEffect(() => {
    if (currentTurn !== 3) return;
    if (questRunning || activeQuest !== null) return;

    const scheduleRandomQuiz = async () => {
      try {
        console.log("[Quiz] 3번째 턴 시작 - 퀴즈 스케줄 요청:", { roomId, currentTurn, participantCount: participants.length });
        const response = await scheduleQuiz(roomId, currentTurn, participants.length);
        console.log("[Quiz] 퀴즈 스케줄 응답:", response);

        if (response?.quizId) {
          setQuizId(response.quizId);
        }
        if (response?.question) {
          setQuizQuestion(response.question);
        }

        const randomDelay = Math.floor(Math.random() * (40000 - 15000 + 1)) + 15000;
        console.log(`[Quiz] ${randomDelay / 1000}초 후 퀴즈 시작 예정`);

        setTimeout(() => {
          console.log("[Quiz] 돌발 퀴즈 시작!");
          startQuest(1);
        }, randomDelay);
      } catch (error) {
        console.error("[Quiz] 퀴즈 스케줄 실패:", error);
      }
    };

    scheduleRandomQuiz();
  }, [currentTurn, questRunning, activeQuest, roomId, participants.length, startQuest]);

  // 퀘스트 1: 녹음 시작
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setRecordedAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log("[Quiz] 녹음 시작");
    } catch (error) {
      console.error("[Quiz] 녹음 시작 실패:", error);
      alert("마이크 접근 권한이 필요합니다.");
    }
  }, []);

  // 퀘스트 1: 녹음 중지
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log("[Quiz] 녹음 중지");
    }
  }, []);

  // 퀘스트 1: 답변 제출
  const handleSubmitQuest1 = useCallback(async () => {
    if (!recordedAudio || !quizId) {
      alert("녹음된 답변이 없습니다.");
      return;
    }

    try {
      console.log("[Quiz] 답변 제출 시도:", { quizId, userId: myUserId });

      const audioFile = new File([recordedAudio], "answer.webm", { type: "audio/webm" });

      const response = await submitQuizAnswer(quizId, myUserId, audioFile);
      console.log("[Quiz] 답변 제출 응답:", response);

      const correct = response?.isCorrect ?? false;
      setIsCorrect(correct);
      setQuestStep(correct ? "resultSuccess" : "resultFail");
    } catch (error) {
      console.error("[Quiz] 답변 제출 실패:", error);
      alert("답변 제출에 실패했습니다.");
    }
  }, [recordedAudio, quizId, myUserId]);

  // 퀘스트 1: answering 단계에서 자동 녹음 시작 및 10초 후 자동 제출
  useEffect(() => {
    if (questStep !== "q1answering" || activeQuest !== 1) return;

    startRecording();

    const timer = setTimeout(() => {
      stopRecording();
    }, 10000);

    return () => {
      clearTimeout(timer);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [questStep, activeQuest, startRecording, stopRecording]);

  // 퀘스트 1: 녹음 완료 후 자동 제출
  useEffect(() => {
    if (questStep !== "q1answering" || activeQuest !== 1) return;
    if (!recordedAudio) return;

    console.log("[Quiz] 녹음 완료, 자동 제출 시작");
    handleSubmitQuest1();
  }, [recordedAudio, questStep, activeQuest, handleSubmitQuest1]);

  const handleSubmitQuest2 = useCallback(() => {
    const correct = Math.random() > 0.5;
    setIsCorrect(correct);
    setQuestStep(correct ? "resultSuccess" : "resultFail");
  }, []);

  /* =========================
     한국어→영어 번역 (Chrome STT)
  ========================= */
  const recognitionRef = useRef(null);

  // STT 시작
  const startSTT = useCallback(() => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn("[STT] Web Speech API를 지원하지 않는 브라우저입니다.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = "ko-KR";
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = async (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript;
            console.log("[STT] 인식된 텍스트:", transcript);

            // ★ 짧은 텍스트는 백엔드 전처리에서 필터링될 어차피이므로 아예 호출하지 않음
            // 백엔드 minLength=4, isMeaningful은 단어 2개 이상 필요
            if (!roomId || !transcript || transcript.trim().length < 4) {
              console.log("[STT] 텍스트가 짧아서 번역 건너뜀:", transcript);
              continue;
            }

            try {
              const response = await translateToEnglish(roomId, transcript, currentTurn, myUserId);
              console.log("[STT] 번역 결과:", response);
            } catch (error) {
              console.error("[STT] 번역 실패:", error);
            }
          }
        }
      };

      recognition.onerror = (event) => {
        console.error("[STT] 오류:", event.error);
      };

      recognition.start();
      recognitionRef.current = recognition;
      console.log("[STT] 음성 인식 시작");
    } catch (error) {
      console.error("[STT] 시작 실패:", error);
    }
  }, [roomId, currentTurn, myUserId]);

  // STT 중지
  const stopSTT = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      console.log("[STT] 음성 인식 중지");
    }
  }, []);

  // 한국어 대화 시작 시 STT 자동 시작
  useEffect(() => {
    if (!questRunning && roomId) {
      startSTT();
    } else {
      stopSTT();
    }

    return () => {
      stopSTT();
    };
  }, [questRunning, roomId, startSTT, stopSTT]);

  // 퀘스트 텍스트
  const quest1IntroTitle = "돌발 퀘스트!!";
  const quest1IntroBody = "영어로만 답해야 해!!\n모두 협동해서 점수를 얻어봐";
  const quest1ReadyText = "다들 준비는 됐나?";
  const quest1English = quizQuestion;

  const quest2IntroTitle = "돌발 퀘스트!!\n빈칸을 채워봐.";
  const quest2IntroSub = "가장 먼저 맞힌 사람이 점수를 얻어.";

  const isSuccess = questStep === "resultSuccess";
  const failText = "아쉽게도 성공하지 못했어\n다음 번 기회를 노려봐!";
  const successText = "대단해!! 점수를 획득했어!!";

  const resultBubbleText = isSuccess ? successText : failText;
  const resultDuckSrc = isSuccess ? duckHappyImg : duckSadImg;

  // 오버레이 표시 조건
  const showQuest1Intro = questStep === "q1intro" && activeQuest === 1;
  const showQuest1Ready = questStep === "q1ready" && activeQuest === 1;
  const showQuest1ShowQuestion =
    questStep === "q1showQuestion" && activeQuest === 1;
  const showQuest1Answering = questStep === "q1answering" && activeQuest === 1;

  const showQuest2Intro = questStep === "intro" && activeQuest === 2;
  const showQuest2Game = questStep === "q2game" && activeQuest === 2;

  const showResultOverlay =
    (questStep === "resultFail" || questStep === "resultSuccess") &&
    (activeQuest === 1 || activeQuest === 2);

  return (
    <div className={styles.Page}>
      <div className={styles.Shell}>
        <ExitGuard />

        <AppHeader userName="user" notifications={[]} />

        <div className={styles.Content}>
          <button
            className={styles.BackButton}
            type="button"
            onClick={handleBack}
            aria-label="뒤로 가기"
          >
            &lt;
          </button>

          <div className={styles.HeaderRow}>
            <div className={styles.ExitCol}>
              <ExitButton
                to="/"
                replace
                label="나가기"
                confirmMessage="메인 화면으로 나가시겠습니까?"
                onExit={doLeaveRoom}
              />
            </div>

            <div className={styles.TopicRow}>
              <img className={styles.SmallDuck} src={duckImg} alt="오리" />
              <div className={styles.TopicBubble}>
                첫 번째 대화 주제는 {topic}입니다!
              </div>
            </div>

            <div className={styles.TimerCol}>
              <TimerGauge
                durationMs={60_000}
                isRunning={isRoomTimerRunning}
                onDone={handleDone}
              />
            </div>
          </div>

          <div className={styles.Stage}>
            <div className={styles.LeftStage}>
              {showQuest1Answering && (
                <div className={styles.Quest1Banner}>
                  <div
                    className={styles.Quest1BannerQuestion}
                    onClick={() => {
                      console.log("[테스트] 영어 문장 클릭 - 결과 화면 표시");
                      setQuestStep("resultSuccess");
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {quest1English}
                  </div>
                </div>
              )}

              <section
                className={styles.CardsGrid}
                aria-label="참여자 영상 영역"
              >
                {slots.map((slot) => {
                  if (slot.kind === "empty") {
                    return (
                      <div
                        key={slot.id}
                        className={`${styles.VideoCard} ${styles.VideoCardEmpty}`}
                      >
                        <div className={styles.EmptyText}>빈 자리</div>
                      </div>
                    );
                  }

                  const p = slot.p;
                  const isMe = p.isMe === true;
                  const participantMicOn = isMe ? micOn : (p.micOn ?? false);
                  const participantVoiceLevel = isMe ? voiceLevel : (p.voiceLevel ?? 0);
                  const participantSpeaking = isMe ? isSpeaking : (p.isSpeaking ?? false);

                  return (
                    <div
                      key={p.id}
                      className={`${styles.VideoCard} ${
                        participantSpeaking
                          ? styles.VideoCardSpeaking
                          : styles.VideoCardIdle
                      }`}
                    >
                      <div className={styles.VideoInner}>
                        <div className={styles.AvatarCircle}>
                          <img
                            className={styles.AvatarDuck}
                            src={duckImg}
                            alt={`${p.name} 아바타`}
                          />
                        </div>
                      </div>

                      <div className={styles.VideoFooter}>
                        <div className={styles.VideoFooterLeft}>
                          <span className={styles.MeLabel}>{p.name}</span>
                          <img
                            className={styles.MicMini}
                            src={participantMicOn ? micOffIcon : micOnIcon}
                            alt={
                              participantMicOn ? "마이크 켜짐" : "마이크 꺼짐"
                            }
                          />
                        </div>

                        <div className={styles.VideoFooterRight}>
                          <VoiceWave level={participantVoiceLevel} enabled={participantMicOn} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>

              <div className={styles.BottomActions}>
                <button
                  type="button"
                  className={styles.PrimaryButton}
                  onClick={toggleMic}
                >
                  <img
                    className={styles.ButtonIcon}
                    src={micOn ? micOffIcon : micOnIcon}
                    alt=""
                    aria-hidden="true"
                  />
                  {micOn ? "마이크 끄기" : "마이크 켜기"}
                </button>

                {/* 대화 종료 버튼은 방장에게만 표시 */}
                {isHost && (
                  <button
                    type="button"
                    className={styles.SecondaryButton}
                    onClick={handleEnd}
                  >
                    대화 종료
                  </button>
                )}
              </div>
            </div>

            <aside className={styles.RightStage} aria-label="AI 도우미">
              <div className={styles.AiBubble}>
                <div className={styles.AiHeader}>
                  <span className={styles.AiDot} aria-hidden="true" />
                  <span className={styles.AiTitle}>AI 영어덕</span>
                  <span className={styles.AiDot} aria-hidden="true" />
                </div>

                <div className={styles.AiFace} aria-hidden="true">
                  🙂
                </div>

                {aiSuggestion ? (
                  <>
                    <div className={styles.AiMainText}>대화 추천</div>
                    <div className={styles.AiSubText}>{aiSuggestion}</div>
                  </>
                ) : (
                  <>
                    <div className={styles.AiMainText}>
                      영어로 편하게 대화해보세요!
                    </div>
                    <div className={styles.AiSubText}>
                      15초 동안 침묵이 지속되면 제가 도와드릴게요.
                    </div>
                  </>
                )}

                <div className={styles.AiPointer} aria-hidden="true" />
              </div>

              <img
                className={styles.BigDuck}
                src={duckBotCyanImg}
                alt="AI 오리"
              />
            </aside>
          </div>
        </div>

        {/* 퀘스트 1: 인트로 */}
        <UnexpectedQuestOverlay
          open={showQuest1Intro}
          onClose={handleOverlayClickNext}
          duckSrc={duckBombImg}
          bubbleTitle={quest1IntroTitle}
          bubbleText={quest1IntroBody}
          subText={null}
          subTone="danger"
          countdownNumber={undefined}
          speechBubbleType={2}
          clickAnywhere
          showCloseButton={false}
          escToClose={false}
        />

        {/* 퀘스트 1: 준비 + 카운트다운 */}
        <UnexpectedQuestOverlay
          open={showQuest1Ready}
          onClose={handleOverlayClickNext}
          duckSrc={duckBombImg}
          bubbleText={quest1ReadyText}
          subText={null}
          subTone="normal"
          countdownNumber={countdown}
          speechBubbleType={2}
          clickAnywhere={false}
          showCloseButton={false}
          escToClose={false}
        />

        {/* 퀘스트 1: 영어 문장 표시 */}
        <UnexpectedQuestOverlay
          open={showQuest1ShowQuestion}
          onClose={handleOverlayClickNext}
          duckSrc={duckBombImg}
          bubbleText={quest1English}
          subText="영어로만 답해야 해!!!"
          subTone="danger"
          countdownNumber={undefined}
          speechBubbleType={2}
          clickAnywhere
          showCloseButton={false}
          escToClose={false}
        />

        {/* 퀘스트 2: 인트로 */}
        <UnexpectedQuestOverlay
          open={showQuest2Intro}
          onClose={handleOverlayClickNext}
          duckSrc={duckBombImg}
          bubbleTitle={quest2IntroTitle}
          bubbleText={quest2IntroSub}
          subText={null}
          subTone="danger"
          countdownNumber={undefined}
          speechBubbleType={2}
          clickAnywhere
          showCloseButton={false}
          escToClose={false}
        />

        {/* 퀘스트 2: 게임 화면 */}
        <UnexpectedQuestFillBlankModal
          open={showQuest2Game}
          duckSrc={duckBombImg}
          onSubmit={handleSubmitQuest2}
        />

        {/* 결과 */}
        <UnexpectedQuestOverlay
          open={showResultOverlay}
          onClose={handleOverlayClickNext}
          duckSrc={resultDuckSrc}
          bubbleText={resultBubbleText}
          subText={null}
          subTone="normal"
          countdownNumber={undefined}
          clickAnywhere
          showCloseButton={false}
          escToClose={false}
        />
      </div>
    </div>
  );
}
