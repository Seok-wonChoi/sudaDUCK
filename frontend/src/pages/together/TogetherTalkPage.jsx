import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./TogetherTalkPage.module.css";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import ExitGuard from "@/components/common/ExitGuard/ExitGuard";
import TimerGauge from "@/components/common/TimerGauge/TimerGauge";
import NicknameBadge from "@/components/features/mypage/ProfileSection/NicknameBadge";

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
import { useOpenVidu } from "@/context/OpenViduContext"; // 👈 OpenVidu Hook 추가

import duckImg from "@/assets/images/duck.png";
import duckBotCyanImg from "@/assets/images/duck_bot_cyan.png";
import duckBotDigitalImg from "@/assets/images/duck_bot_digital.png";
import duckBotMechaImg from "@/assets/images/duck_bot_mecha.png";
import duckBotOrangeImg from "@/assets/images/duck_bot_orange.png";

import duckHappyImg from "@/assets/images/duck_happy.png";
import duckBombImg from "@/assets/images/duck_bomb.png";
import duckSadImg from "@/assets/images/duck_sad.png";
import duckProfile1 from "@/assets/images/duck_profile1.png";
import duckProfile2 from "@/assets/images/duck_profile2.png";
import duckProfile3 from "@/assets/images/duck_profile3.png";
import duckProfile4 from "@/assets/images/duck_profile4.png";
import micOnIcon from "@/assets/icons/mic_on.png";
import micOffIcon from "@/assets/icons/mic_off.png";

import UnexpectedQuestOverlay from "@/components/features/unexpected-quest/UnexpectedQuestOverlay";
import UnexpectedQuestFillBlankModal from "@/components/features/unexpected-quest/UnexpectedQuestFillBlankModal";

const ROOM_INFO_KEY = "together_room_info";

const AI_DUCKBOT_IMAGES = {
  // 이름 기반
  CYAN: duckBotCyanImg,
  DIGITAL: duckBotDigitalImg,
  MECHA: duckBotMechaImg,
  ORANGE: duckBotOrangeImg,

  // 숫자 기반 (문서/백에서 MODEL_1~4 쓰는 경우 대비)
  MODEL_1: duckBotCyanImg,
  MODEL_2: duckBotDigitalImg,
  MODEL_3: duckBotMechaImg,
  MODEL_4: duckBotOrangeImg,
};

const DUCK_PROFILE_IMAGES = {
  profile1: duckProfile1,
  profile2: duckProfile2,
  profile3: duckProfile3,
  profile4: duckProfile4,
};

const COLOR_MAP = {
  white: "#ffffff",
  yellow: "#fef08a",
  blue: "#93c5fd",
  pink: "#f9a8d4",
  green: "#86efac",
  purple: "#c4b5fd",
  orange: "#fdba74",
};

const ACCESSORY_MAP = {
  hat: "🎩",
  sunglasses: "🕶️",
  ribbon: "🎀",
  crown: "👑",
  none: null,
};

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

function getDuckProfileInfo(duckCustomJson) {
  const parsed = safeParseJson(duckCustomJson);
  if (!parsed) {
    return {
      image: duckProfile1,
      color: "#ffffff",
      accessory: null,
    };
  }

  const style = parsed.style || "profile1";
  const color = parsed.color || "white";
  const accessory = parsed.accessory || "none";

  return {
    image: DUCK_PROFILE_IMAGES[style] || duckProfile1,
    color: COLOR_MAP[color] || "#ffffff",
    accessory: ACCESSORY_MAP[accessory] || null,
  };
}

function getNicknameStyle(avatarCustomJson) {
  const parsed = safeParseJson(avatarCustomJson);
  if (!parsed) {
    return {
      background: "default",
      effect: null,
    };
  }

  return {
    background: parsed.bgStyle || "default",
    effect: parsed.effect || null,
  };
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
  const { publisher, subscribers, leaveSession } = useOpenVidu(); // 👈 leaveSession 추가

  const [isRoomTimerRunning, setIsRoomTimerRunning] = useState(true);

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

  function getAiDuckbotImage(aiDuckbotCustomJson) {
    const parsed = safeParseJson(aiDuckbotCustomJson);
    if (!parsed) return duckBotCyanImg;

    const raw = parsed.model ?? parsed.type ?? parsed.style ?? "CYAN";
    const key = String(raw).trim().toUpperCase();

    return AI_DUCKBOT_IMAGES[key] || duckBotCyanImg;
  }

  // 타이머 시작 시간 (절대 timestamp) - 절대 시간 고정 로직
  const [timerStartedAt, setTimerStartedAt] = useState(() => {
    try {
      // 1. 방 코드 확보 (없으면 세션에서 비상 복구)
      let code =
        roomInfo.roomCode ||
        roomInfo.inviteCode ||
        roomInfo.joinCode ||
        roomInfo.code ||
        roomInfo.roomInfo?.roomCode;
      
      if (!code) {
        code = sessionStorage.getItem("last_active_room_code");
      } else {
        // 코드 있으면 무조건 백업
        sessionStorage.setItem("last_active_room_code", code);
      }

      if (!code) return Date.now(); 

      // 2. 현재 턴에 대한 고유 키 생성
      // 주의: currentTurn 상태 변수 대신 roomInfo 값을 직접 사용 (초기화 순서 문제 방지)
      const turnVal = roomInfo.currentTurn ?? roomInfo.roomInfo?.currentTurn ?? 1;
      const storageKey = `timer_start_${code}_turn_${turnVal}`;

      // 3. 박제된 시간 있나 확인
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        console.log(`[Timer] 💾 복구된 시간: ${saved} (턴: ${turnVal})`);
        return parseInt(saved, 10);
      }

      // 4. 없으면 지금 시간을 박제하고 시작
      const now = Date.now();
      sessionStorage.setItem(storageKey, String(now));
      console.log(`[Timer] 📌 시간 박제: ${now} (턴: ${turnVal})`);
      return now;
    } catch {
      return Date.now();
    }
  });

  // 턴이 바뀔 때마다 새로운 시간 박제
  useEffect(() => {
    if (!resolvedRoomCode) return;
    
    // 여기서는 currentTurn 상태를 안전하게 사용 가능 (useEffect 내부이므로)
    // 하지만 의존성 배열에 currentTurn이 없으므로 roomInfo나 내부 변수로 접근해야 함
    // 편의상 별도의 상태 관리가 아닌 roomInfo나 timerStartedAt 업데이트 로직에서 처리 권장
    // 여기서는 초기화 로직이 강력하므로 추가적인 useEffect는 최소화
  }, [resolvedRoomCode]);

  // 타이머 시작 시간 sessionStorage 저장 (기존 코드 제거됨)

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
    const turn = roomInfo.currentTurn ?? roomInfo.roomInfo?.currentTurn ?? 1;
    console.log("[TogetherTalkPage] currentTurn 초기화:", {
      roomInfo,
      turn,
    });
    return turn;
  });

  // [수정 2] 데이터 동기화 추가: 페이지 이동으로 hydratedInfo가 바뀌면 턴 번호도 업데이트
  useEffect(() => {
    const nextTurn = hydratedInfo?.currentTurn ?? hydratedInfo?.roomInfo?.currentTurn;
    console.log("[TogetherTalkPage] hydratedInfo 변경 감지:", {
      hydratedInfo,
      currentTurnFromState: hydratedInfo?.currentTurn,
      currentTurnFromRoomInfo: hydratedInfo?.roomInfo?.currentTurn,
      nextTurn,
      currentCurrentTurn: currentTurn,
    });

    if (nextTurn !== undefined && nextTurn !== null && nextTurn !== currentTurn) {
      console.log(`[TogetherTalkPage] 턴 번호 업데이트: ${currentTurn} → ${nextTurn}`);
      setCurrentTurn(nextTurn);
    }
  }, [hydratedInfo, currentTurn]);

  // [추가] 턴이 변경될 때마다(또는 방 코드가 확보될 때마다) 해당 턴의 시작 시간을 박제
  useEffect(() => {
    if (!resolvedRoomCode) return;
    
    const storageKey = `timer_start_${resolvedRoomCode}_turn_${currentTurn}`;
    const saved = sessionStorage.getItem(storageKey);

    // 이미 저장된 시간이 없으면(새 턴 시작) 현재 시간을 박제
    if (!saved) {
       const now = Date.now();
       sessionStorage.setItem(storageKey, String(now));
       setTimerStartedAt(now);
       console.log(`[Timer] 🔄 새 턴(${currentTurn}) 시작, 시간 박제: ${now}`);
    } else {
       // 이미 있으면(새로고침 시) 그거 씀
       const parsed = parseInt(saved, 10);
       // 현재 state와 다르면 업데이트 (불필요한 렌더링 방지)
       setTimerStartedAt((prev) => (prev !== parsed ? parsed : prev));
       console.log(`[Timer] 💾 턴 ${currentTurn} 시간 유지: ${parsed}`);
    }
  }, [currentTurn, resolvedRoomCode]);


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
      micOn: p.micOn ?? true,
      isHost: p.isHost ?? false,
      voiceLevel: p.voiceLevel ?? 0,
      isSpeaking: false,
    }));
  });

  //participants를 추적하는 ref 생성
  const participantsRef = useRef(participants);
  const timerSyncedRef = useRef(false); // 타이머 동기화 여부 추적

  //participants가 변할 때마다 ref 업데이트
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

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

      // 타이머 시작 시간 설정 (서버 값으로 동기화) - 로컬 스토리지 우선 정책으로 제거
      /* 
      if (data?.timerStartedAt != null) {
        const serverTime = Number(data.timerStartedAt);
        if (!timerSyncedRef.current || timerStartedAt !== serverTime) {
           // 서버 시간 덮어쓰기 방지
        }
      } 
      */

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
          micOn: m.micOn ?? true,
          isHost: m.isHost ?? false,
          voiceLevel: 0,
          isSpeaking: false,
          avatarCustomJson: m.avatarCustomJson ?? null,
          duckCustomJson: m.duckCustomJson ?? null,
          aiDuckbotCustomJson: m.aiDuckbotCustomJson ?? null,
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

  // 페이지 로드/새로고침 시 타이머 동기화를 위해 ref 초기화
  useEffect(() => {
    // 타이머가 sessionStorage에 없으면 동기화 필요
    if (resolvedRoomCode) {
      const saved = sessionStorage.getItem(`timer_started_${resolvedRoomCode}`);
      if (!saved) {
        timerSyncedRef.current = false;
        console.log("[TogetherTalkPage] 타이머 동기화 필요 - ref 초기화");
      }
    }
  }, [resolvedRoomCode]);

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

  // 퀘스트 관련 상태 (WebSocket 핸들러에서 사용하므로 핸들러보다 먼저 선언)
  const [activeQuest, setActiveQuest] = useState(null); // 1 | 2 | null
  const [questStep, setQuestStep] = useState("idle");
  const [questContinueReady, setQuestContinueReady] = useState({}); // userId -> boolean (돌발 퀘스트 결과 확인 후 이어하기 준비 상태)
  const [quizId, setQuizId] = useState(null);
  const [quizQuestion, setQuizQuestion] = useState(
    "AI가 질문을 생성하고 있습니다...", // WebSocket으로 AI 생성 질문 수신 대기 중
  );
  const [micStateBeforeQuest, setMicStateBeforeQuest] = useState(true);
  const [myQuizResult, setMyQuizResult] = useState(null);

  const handleConversationSuggestion = useCallback((question) => {
    // 돌발 퀘스트 진행 중에는 AI 추천 무시
    if (questStep !== "idle") {
      console.log("[Quest] 퀘스트 진행 중 - AI 추천 무시:", question);
      return;
    }

    // AI 추천 주제를 계속 표시 (타이머로 자동 삭제하지 않음)
    // 새로운 주제가 오면 기존 주제를 대체
    setAiSuggestion(question || "");
  }, [questStep]);

  const handleSilenceDetected = useCallback(
    (payload, senderKey) => {
      console.log("🔇 [정적 감지] 15초 동안 대화가 없었습니다!", {
        payload,
        senderKey,
        roomId,
        currentTurn,
      });
    },
    [roomId, currentTurn],
  );

  const handleVoiceLevelChanged = useCallback((payload, senderKey) => {
    if (!senderKey) return;
    const k = String(senderKey);

    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === k) {
          const level = payload?.level ?? 0;
          // 마이크가 켜져있고 voiceLevel이 임계값 이상일 때만 발화 중으로 표시
          const isSpeaking = p.micOn && level > 0.03;
          return { ...p, voiceLevel: level, isSpeaking };
        }
        return p;
      }),
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
      prev.map((p) => {
        if (p.id === k) {
          const newMicOn = payload?.micOn ?? true;
          // 마이크가 꺼지면 isSpeaking도 false로 설정
          return {
            ...p,
            micOn: newMicOn,
            isSpeaking: newMicOn ? p.isSpeaking : false,
          };
        }
        return p;
      }),
    );
  }, []);

  const handleTimerSync = useCallback(
    (payload) => {
      if (payload?.startTimeMs != null) {
        const startTime = Number(payload.startTimeMs);

        // 새로고침 시에도 WebSocket 타이머와 동기화
        if (!timerSyncedRef.current || timerStartedAt !== startTime) {
          console.log(
            "[TogetherTalkPage] 웹소켓으로 타이머 시작 시간 동기화:",
            startTime,
            "(새로고침 시에도 동기화)"
          );
          setTimerStartedAt(startTime);
          timerSyncedRef.current = true;

          // sessionStorage에도 저장 (새로고침 시 참고용)
          if (resolvedRoomCode) {
            sessionStorage.setItem(
              `timer_started_${resolvedRoomCode}`,
              String(startTime),
            );
          }
        }
      }
    },
    [resolvedRoomCode],
  );

  // 대화 종료 시 모든 참여자가 /recording으로 이동
  const handleRoomEnded = useCallback(
    (payload) => {
      console.log(
        "[TogetherTalkPage] ROOM_ENDED 수신 - /recording으로 이동",
        payload,
      );
      console.log("[TogetherTalkPage] 전달할 데이터:", {
        roomId: payload?.roomInfo?.roomId ?? roomId,
        roomCode: resolvedRoomCode,
        currentTurn,
        turnCount:
          payload?.roomInfo?.turnCount ??
          roomInfo.turnCount ??
          roomInfo.turnCnt ??
          3,
      });

      navigate("/recording", {
        replace: true,
        state: {
          mode: "together",
          roomInfo: {
            ...roomInfo,
            roomId: payload?.roomInfo?.roomId ?? roomId,
            roomCode: resolvedRoomCode,
            turnCount:
              payload?.roomInfo?.turnCount ??
              roomInfo.turnCount ??
              roomInfo.turnCnt ??
              3,
            currentTurn: currentTurn, // 현재 턴 번호 전달
          },
          participants,
          myUserId, // 본인 userId 전달
        },
      });
    },
    [navigate, roomInfo, roomId, participants, currentTurn, resolvedRoomCode],
  );

  // 방장 퇴장 시 메인 화면으로 강제 이동
  const handleRoomClosed = useCallback(() => {
    console.log("[TogetherTalkPage] ROOM_CLOSED 수신 - 방장 퇴장");
    navigate("/main", {
      replace: true,
      state: { toastMessage: "방장이 퇴장하여 대화가 종료되었습니다." },
    });
  }, [navigate]);

  const sendMicRef = useRef(null);
  const micOnRef = useRef(micOn);
  useEffect(() => {
    micOnRef.current = micOn;
  }, [micOn]);

  const handleMemberJoined = useCallback((payload, senderKey) => {
    console.log("[TogetherTalkPage] 새 멤버 입장:", { payload, senderKey });
    // 새로운 멤버가 입장했을 때 내 마이크 상태를 전송하여 동기화
    if (sendMicRef.current) {
      console.log(
        "[TogetherTalkPage] 새 멤버 입장 - 내 마이크 상태 전송:",
        micOnRef.current,
      );
      sendMicRef.current(micOnRef.current);
    }
  }, []);

  // WebSocket 퀴즈 수신 핸들러 (AI 생성 질문 포함)
  const handleQuizReceived = useCallback((payload) => {
    console.log("[Quiz] ✅ AI 생성 퀴즈 수신:", payload);

    // API 스펙에 맞게 quiz 객체에서 데이터 추출
    const quiz = payload?.quiz || payload;

    if (quiz?.quizId) {
      setQuizId(quiz.quizId);
      console.log("[Quiz] quizId 설정됨:", quiz.quizId);
    } else {
      console.warn("[Quiz] ⚠️ quizId 필드가 없습니다. payload:", payload);
    }

    if (quiz?.question) {
      setQuizQuestion(quiz.question);
      console.log("[Quiz] AI 생성 질문 설정됨:", quiz.question);
      console.log("[Quiz] 힌트:", quiz.hint);
      console.log("[Quiz] 예시 답변:", quiz.expectedAnswer);
    } else {
      console.warn("[Quiz] ⚠️ question 필드가 없습니다. payload:", payload);
    }

    // 퀴즈 시작 (startQuest(1)과 동일한 로직)
    setMicStateBeforeQuest(micOn);
    setAiSuggestion("");

    // 정적 감지 중지
    if (roomId) {
      stopSilenceMonitoring(roomId)
        .then(() => console.log("[Quest] 정적 감지 중지"))
        .catch((e) => console.error("[Quest] 정적 감지 중지 실패:", e));
    }

    setActiveQuest(1);
    setIsRoomTimerRunning(false);
    setQuestStep("q1intro");
  }, [micOn, roomId]);

  // WebSocket 퀴즈 결과 수신 핸들러 (각자의 평가만 자신에게 표시)
  const handleQuizResultReceived = useCallback((payload) => {
    console.log("[Quiz] 퀴즈 결과 수신:", payload);
    setMyQuizResult(payload);
    if (payload?.isCorrect || payload?.correct) {
      setQuestStep("resultSuccess");
    } else {
      setQuestStep("resultFail");
    }
  }, []);

  // WebSocket 돌발 퀘스트 수신 핸들러 (모든 참여자가 동시에 시작)
  const handleUnexpectedQuestReceived = useCallback((payload) => {
    console.log("[UnexpectedQuest] ✅ 돌발 퀘스트 수신:", payload);

    const questId = payload?.questId || payload?.id || 1;
    const questType = payload?.type;

    console.log("[UnexpectedQuest] 퀘스트 시작:", { questId, questType });

    // 퀘스트가 이미 진행 중이면 무시
    if (questStep !== "idle") {
      console.log("[UnexpectedQuest] ⚠️ 이미 퀘스트 진행 중, 무시");
      return;
    }

    // startQuest는 아래에서 정의되므로, 직접 로직을 여기에 구현하거나
    // ref를 사용해야 합니다. 여기서는 payload로 받은 정보로 직접 시작
    setMicStateBeforeQuest(micOn);
    setAiSuggestion("");

    // 정적 감지 중지
    if (roomId) {
      stopSilenceMonitoring(roomId)
        .then(() => console.log("[UnexpectedQuest] 정적 감지 중지"))
        .catch((e) => console.error("[UnexpectedQuest] 정적 감지 중지 실패:", e));
    }

    setActiveQuest(questId);
    setIsRoomTimerRunning(false);

    if (questId === 1) {
      setQuestStep("q1intro");
    } else if (questId === 2) {
      setQuestStep("intro");
    }
  }, [questStep, micOn, roomId]);

  // WebSocket 돌발 퀘스트 이어하기 준비 상태 변경 핸들러
  const handleQuestContinueReady = useCallback((payload, senderKey) => {
    console.log("[Quest] 이어하기 준비 상태 변경:", { payload, senderKey });

    const ready = payload?.ready ?? false;

    setQuestContinueReady((prev) => ({
      ...prev,
      [senderKey]: ready,
    }));
  }, []);

  // ★ useRoomWebSocket에 roomId 전달 (정적감지 구독용)
  const { sendEndRoom, sendVoiceLevel, sendMic, sendUnexpectedQuest, sendQuestContinueReady, isConnected } =
    useRoomWebSocket(
      resolvedRoomCode,
      {
        onConversationSuggestion: handleConversationSuggestion,
        onSilenceDetected: handleSilenceDetected,
        onRoomEnded: handleRoomEnded,
        onRoomClosed: handleRoomClosed,
        onVoiceLevelChanged: handleVoiceLevelChanged,
        onMicChanged: handleMicChanged,
        onMemberJoined: handleMemberJoined,
        onTimerSync: handleTimerSync, // 웹소켓으로 타이머 동기화 (처음 1번만)
        onQuizReceived: handleQuizReceived, // 퀴즈 수신
        onQuizResultReceived: handleQuizResultReceived, // 퀴즈 결과 수신
        onUnexpectedQuestReceived: handleUnexpectedQuestReceived, // 돌발 퀘스트 수신
        onQuestContinueReady: handleQuestContinueReady, // 돌발 퀘스트 이어하기 준비 상태
        onConnected: () => console.log("WebSocket 연결됨 (TogetherTalkPage)"),
        onDisconnected: () =>
          console.log("WebSocket 연결 해제됨 (TogetherTalkPage)"),
      },
      roomId,
    );

  // sendMic을 ref에 저장
  useEffect(() => {
    sendMicRef.current = sendMic;
  }, [sendMic]);

  // WebSocket 연결 시 초기 마이크 상태 전송 (처음 1번만)
  const initialMicSentRef = useRef(false);
  useEffect(() => {
    if (isConnected && sendMic && !initialMicSentRef.current) {
      console.log("[TogetherTalkPage] 초기 마이크 상태 전송:", micOn);
      sendMic(micOn);
      // 👇 페이지 진입 시 OpenVidu 마이크 상태 동기화
      if (publisher) {
        console.log("[TogetherTalkPage] OpenVidu 마이크 초기화:", micOn);
        publisher.publishAudio(micOn);
      }
      initialMicSentRef.current = true;
    }
  }, [isConnected, sendMic, micOn, publisher]);

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

  // 마이크와 정적 감지 초기화 (컴포넌트 마운트 시에만)
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

  // 음성 레벨로 정적 감지 초기화하지 않음 (STT에서만 초기화)
  // useEffect(() => {
  //   if (isSpeaking && roomId && myUserId && currentTurn) {
  //     recordVoiceActivity(roomId, myUserId, currentTurn).catch((e) => {
  //       console.error("음성 활동 기록 실패:", e);
  //     });
  //   }
  // }, [isSpeaking, roomId, myUserId, currentTurn]);

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
      if (publisher) publisher.publishAudio(false); // 👈 OpenVidu Mute
      await stopAudioAnalysis();
      return;
    }
    setMicOn(true);
    sendMic(true);
    if (publisher) publisher.publishAudio(true); // 👈 OpenVidu Unmute
    await startAudioAnalysis();
  }, [micOn, startAudioAnalysis, stopAudioAnalysis, sendMic, publisher]);

  // [추가] API 호출 없이 오디오/정적감지만 멈추는 헬퍼 함수
  const stopMediaProcessing = useCallback(async () => {
    await stopAudioAnalysis();
    if (roomId) {
      try {
        await stopSilenceMonitoring(roomId);
      } catch (e) {
        console.error("정적 감지 중지 실패:", e);
      }
    }
  }, [stopAudioAnalysis, roomId]);

  const doLeaveRoom = useCallback(async () => {
    await stopAudioAnalysis();
    
    // 👇 진짜 방을 나갈 때는 세션 종료
    if (leaveSession) leaveSession();

    if (resolvedRoomCode) {
      try {
        await leaveRoom({ roomCode: resolvedRoomCode });
      } catch (e) {
        console.error("방 퇴장 API 호출 실패:", e);
      }
    }
  }, [stopMediaProcessing, resolvedRoomCode, leaveSession]);


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
      console.log(
        "[TogetherTalkPage] endRoom REST API 성공 - 웹소켓 메시지 대기 중",
      );
    } catch (e) {
      console.error("[TogetherTalkPage] endRoom REST API 실패:", e);
    }

    // 웹소켓 ROOM_ENDED 메시지를 기다림 (handleRoomEnded에서 모든 참여자가 동시에 /recording으로 이동)
  }, [isHost, resolvedRoomCode]);

  // ★ handleDone: 타이머 종료 시에도 REST API 호출
  const handleDone = useCallback(async () => {
    // 내부 로직에서 participants 대신 ref 사용
    const currentParticipants = participantsRef.current;

    if (isHost) {
      try {
        await endRoom(resolvedRoomCode);
        console.log(
          "[TogetherTalkPage] endRoom REST API 성공 (타이머 종료) - 웹소켓 메시지 대기 중",
        );
      } catch (e) {
        console.error(
          "[TogetherTalkPage] endRoom REST API 실패 (타이머 종료):",
          e,
        );
      }
    }

    await stopMediaProcessing();

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
        participants: currentParticipants,
      },
    });
  }, [doLeaveRoom, navigate, isHost, roomId, roomInfo, resolvedRoomCode]);

  //타이머 컴포넌트를 기억하여 리렌더링 방지
  const memoizedTimer = useMemo(() => {
    return (
      <TimerGauge
        durationMs={60_000}
        isRunning={isRoomTimerRunning}
        onDone={handleDone}
      />
    );
  }, [isRoomTimerRunning, handleDone]);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/together");
  }, [navigate]);

  /* =========================
     돌발 퀘스트 (수동 시작 1/2)
  ========================= */

  // 퀘스트 주요 상태는 위에서 이미 선언됨 (WebSocket 핸들러보다 먼저 필요)
  const [isCorrect, setIsCorrect] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(-1); // 현재 답변 중인 참여자 인덱스
  const [speakerTimeLeft, setSpeakerTimeLeft] = useState(15); // 현재 참여자의 남은 시간 (15초)

  const questRunning = questStep !== "idle";

  const endQuestAndResume = useCallback(async () => {
    setActiveQuest(null);
    setQuestStep("idle");
    setIsRoomTimerRunning(true);
    setCountdown(3);
    setQuizId(null);
    setQuizQuestion("AI가 질문을 생성하고 있습니다...");
    setMyQuizResult(null); // 퀴즈 결과 초기화
    setIsRecording(false);
    setRecordedAudio(null);
    setCurrentSpeakerIndex(-1);
    setSpeakerTimeLeft(15);
    setQuestContinueReady({}); // 이어하기 준비 상태 초기화
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    // 퀘스트 종료 후 원래 마이크 상태로 복원
    if (micStateBeforeQuest && !micOn) {
      setMicOn(true);
      sendMic(true);
      await startAudioAnalysis();
    } else if (!micStateBeforeQuest && micOn) {
      setMicOn(false);
      sendMic(false);
      await stopAudioAnalysis();
    }

    // 정적 감지 재시작
    if (roomId && currentTurn) {
      try {
        await startSilenceMonitoring(roomId, currentTurn);
        console.log("[Quest] 정적 감지 재시작");
      } catch (e) {
        console.error("[Quest] 정적 감지 재시작 실패:", e);
      }
    }

    // STT는 questStep이 "idle"이 되면 기존 useEffect에서 자동으로 재시작됨
    console.log("[Quest] 퀘스트 종료 - STT는 자동으로 재시작됩니다");
  }, [micStateBeforeQuest, micOn, sendMic, startAudioAnalysis, stopAudioAnalysis, roomId, currentTurn]);

  const startQuest = useCallback(
    async (id) => {
      if (questRunning) return;
      if (id !== 1 && id !== 2) return;

      // 퀘스트 시작 전 마이크 상태 저장
      setMicStateBeforeQuest(micOn);

      // AI 추천 주제 초기화
      setAiSuggestion("");

      // 정적 감지 중지
      if (roomId) {
        try {
          await stopSilenceMonitoring(roomId);
          console.log("[Quest] 정적 감지 중지");
        } catch (e) {
          console.error("[Quest] 정적 감지 중지 실패:", e);
        }
      }

      setActiveQuest(id);
      setIsRoomTimerRunning(false);

      if (id === 1) {
        setQuestStep("q1intro");
        return;
      }

      // id === 2
      setQuestStep("intro");
    },
    [questRunning, micOn, roomId],
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

  // 돌발 퀘스트 결과 확인 후 이어하기 버튼 클릭
  const handleQuestContinue = useCallback(() => {
    console.log("[Quest] 이어하기 버튼 클릭");
    sendQuestContinueReady(true);

    // 로컬 상태도 즉시 업데이트 (자신의 ready 상태)
    const myParticipant = participants.find((p) => p.isMe === true);
    if (myParticipant?.userId) {
      setQuestContinueReady((prev) => ({
        ...prev,
        [myParticipant.userId]: true,
      }));
    }
  }, [sendQuestContinueReady, participants]);

  // 퀘스트 1: 인트로 화면 자동 진행 (3초 후 다음 단계)
  useEffect(() => {
    if (questStep !== "q1intro" || activeQuest !== 1) return;

    const timer = setTimeout(() => {
      setQuestStep("q1ready");
      setCountdown(3);
    }, 3000);

    return () => clearTimeout(timer);
  }, [questStep, activeQuest]);

  // 퀘스트 1: 카운트다운 자동 진행
  useEffect(() => {
    if (questStep !== "q1ready" || activeQuest !== 1) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // 준비 완료 후 바로 첫 번째 참여자 차례 시작
          setCurrentSpeakerIndex(0);
          setQuestStep("q1speaking");
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

  // 퀘스트 2: 인트로 화면 자동 진행 (3초 후 게임 시작)
  useEffect(() => {
    if (questStep !== "intro" || activeQuest !== 2) return;

    const timer = setTimeout(() => {
      setQuestStep("q2game");
    }, 3000);

    return () => clearTimeout(timer);
  }, [questStep, activeQuest]);

  // 돌발 퀘스트 결과: 모두가 이어하기 준비되면 퀘스트 종료
  useEffect(() => {
    if (questStep !== "resultFail" && questStep !== "resultSuccess") return;

    // 모든 참여자가 준비됐는지 확인
    const allReady = participants.every((p) => {
      return questContinueReady[p.userId] === true;
    });

    if (allReady && participants.length > 0) {
      console.log("[Quest] 모든 참여자가 이어하기 준비 완료, 퀘스트 종료");
      endQuestAndResume();
    }
  }, [questStep, questContinueReady, participants, endQuestAndResume]);

  // 퀘스트 1: answering 화면 표시 후 즉시 첫 번째 참여자 차례 시작
  useEffect(() => {
    if (questStep !== "q1answering" || activeQuest !== 1) return;

    // 즉시 첫 번째 참여자 차례 시작
    setCurrentSpeakerIndex(0);
    setQuestStep("q1speaking");
  }, [questStep, activeQuest]);

  // 퀘스트 1: 각 참여자 차례에서 마이크 자동 제어 및 녹음 시작
  useEffect(() => {
    if (questStep !== "q1speaking" || currentSpeakerIndex < 0) return;

    const myIndex = participants.findIndex((p) => p.isMe === true);
    const isMyTurn = myIndex === currentSpeakerIndex;

    const controlMic = async () => {
      if (isMyTurn) {
        // 내 차례: 마이크 켜기
        if (!micOn) {
          setMicOn(true);
          sendMic(true);
          await startAudioAnalysis();
        }

        // 녹음 시작
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
            const audioBlob = new Blob(audioChunksRef.current, {
              type: "audio/webm",
            });
            setRecordedAudio(audioBlob);
            stream.getTracks().forEach((track) => track.stop());
          };

          mediaRecorder.start();
          setIsRecording(true);
          console.log("[Quest] 내 차례 - 녹음 시작");
        } catch (error) {
          console.error("[Quest] 녹음 시작 실패:", error);
        }
      } else {
        // 다른 사람 차례: 마이크 끄기
        if (micOn) {
          setMicOn(false);
          sendMic(false);
          await stopAudioAnalysis();
        }
      }
    };

    controlMic();
  }, [questStep, currentSpeakerIndex, participants, micOn, sendMic, startAudioAnalysis, stopAudioAnalysis]);

  // 3번째 턴 시작 시 퀴즈 스케줄 (백엔드에서 현재 주제 기반 AI 질문 생성 후 15-40초 후 WebSocket으로 전송)
  useEffect(() => {
    if (currentTurn !== 3) return;
    if (questRunning || activeQuest !== null) return;

    const scheduleRandomQuiz = async () => {
      try {
        console.log("[Quiz] 🎯 3번째 턴 시작 - AI 퀴즈 스케줄 요청:", {
          roomId,
          currentTurn,
          participantCount: participants.length,
          currentTopic: topic, // 현재 대화 주제
        });
        const response = await scheduleQuiz(
          roomId,
          currentTurn,
          participants.length,
        );
        console.log(
          "[Quiz] ✅ 퀴즈 스케줄 완료 - 백엔드에서 AI 질문 생성 중, 15-40초 후 WebSocket으로 수신 예정:",
          response,
        );
      } catch (error) {
        console.error("[Quiz] ❌ 퀴즈 스케줄 실패:", error);
      }
    };

    scheduleRandomQuiz();
  }, [
    currentTurn,
    questRunning,
    activeQuest,
    roomId,
    participants.length,
    topic,
  ]);

  const myAiDuckbotCustomJson = useMemo(() => {
    const me = participants.find((p) => p.isMe === true);
    return me?.aiDuckbotCustomJson ?? null;
  }, [participants]);

  const aiDuckbotImgSrc = useMemo(() => {
    return getAiDuckbotImage(myAiDuckbotCustomJson);
  }, [myAiDuckbotCustomJson]);

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
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
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
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log("[Quiz] 녹음 중지");
    }
  }, []);

  // 각 참여자 차례의 15초 타이머
  useEffect(() => {
    if (questStep !== "q1speaking" || currentSpeakerIndex < 0) return;

    const currentParticipants = participantsRef.current;
    if (currentSpeakerIndex >= currentParticipants.length) return;

    console.log(
      `[타이머] ${currentParticipants[currentSpeakerIndex]?.name}님 차례 시작 - 15초`,
    );
    setSpeakerTimeLeft(15);

    const timer = setInterval(() => {
      setSpeakerTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);

          // 15초 종료 - 현재 참여자의 녹음 중지 및 제출
          const latestParticipants = participantsRef.current;
          const myIndex = latestParticipants.findIndex((p) => p.isMe === true);
          const isMyTurn = myIndex === currentSpeakerIndex;

          if (isMyTurn) {
            // 내 차례였으면 녹음 중지 및 제출
            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state !== "inactive"
            ) {
              mediaRecorderRef.current.stop();
              setIsRecording(false);
              console.log("[Quest] 녹음 중지");

              // 녹음 데이터로 Blob 생성 및 제출
              setTimeout(async () => {
                const audioBlob = new Blob(audioChunksRef.current, {
                  type: "audio/webm",
                });

                if (audioBlob.size > 0 && quizId) {
                  const currentUser = latestParticipants[currentSpeakerIndex];
                  const userId = currentUser?.userId || currentUser?.id;

                  console.log("[Quest] 답변 제출:", { quizId, userId, blobSize: audioBlob.size });

                  try {
                    const audioFile = new File([audioBlob], "answer.webm", {
                      type: "audio/webm",
                    });
                    await submitQuizAnswer(quizId, userId, audioFile);
                    console.log("[Quest] 답변 제출 완료 - WebSocket으로 결과 수신 대기");
                  } catch (error) {
                    console.error("[Quest] 답변 제출 실패:", error);
                  }
                }
              }, 100);
            }
          }

          // 다음 참여자로 자동 전환
          const nextIndex = currentSpeakerIndex + 1;
          if (nextIndex < latestParticipants.length) {
            console.log(
              `[타이머] 시간 종료 - 다음 참여자: ${latestParticipants[nextIndex]?.name}`,
            );
            setCurrentSpeakerIndex(nextIndex);
          } else {
            console.log("[타이머] 모든 참여자 완료 - WebSocket 결과 대기 중");
            setQuestStep("waitingResult");
            setCurrentSpeakerIndex(-1);
          }
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [questStep, currentSpeakerIndex, quizId]);

  // 퀴즈 답변 제출 (각 참여자가 15초 차례 후 자동 제출)
  const submitParticipantAnswer = useCallback(async (audioBlob, participantUserId) => {
    if (!audioBlob || !quizId) {
      console.warn("[Quiz] 답변 제출 불가 - 녹음 데이터 또는 quizId 없음");
      return;
    }

    try {
      console.log("[Quiz] 답변 제출 시도:", { quizId, userId: participantUserId });

      const audioFile = new File([audioBlob], "answer.webm", {
        type: "audio/webm",
      });

      const response = await submitQuizAnswer(quizId, participantUserId, audioFile);
      console.log("[Quiz] 답변 제출 완료 - WebSocket으로 결과 수신 대기 중:", response);
    } catch (error) {
      console.error("[Quiz] 답변 제출 실패:", error);
    }
  }, [quizId]);

  // 퀘스트 1: 각 참여자 차례에서 15초 녹음 및 자동 제출
  // (q1speaking 단계에서 speakerTimeLeft 타이머가 0이 되면 다음 참여자로 자동 전환)
  // 실제 녹음/제출 로직은 speakerTimeLeft useEffect에서 처리됨

  const handleSubmitQuest2 = useCallback(() => {
    const correct = Math.random() > 0.5;
    setIsCorrect(correct);
    setQuestStep(correct ? "resultSuccess" : "resultFail");
  }, []);

  /* =========================
     한국어→영어 번역 (Chrome STT)
  ========================= */
  const recognitionRef = useRef(null);

  const currentTurnRef = useRef(currentTurn);

  useEffect(() => {
    currentTurnRef.current = currentTurn;
  }, [currentTurn]);

  // STT 시작
// STT 시작
  const startSTT = useCallback(() => {
    try {
      // [수정] 이미 실행 중이면 중단 (중복 생성 방지)
      if (recognitionRef.current) {
        console.log("[STT] 이미 실행 중입니다.");
        return;
      }

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
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
            console.log("🎤 [STT 인식됨]:", transcript);

            // [수정] Ref에서 최신 턴 번호 가져오기
            const currentTurnVal = currentTurnRef.current; 

            // 조건 체크
            if (
              roomId &&
              myUserId &&
              currentTurnVal && 
              transcript &&
              transcript.trim().length > 0
            ) {
              // 정적 감지 해제 신호 전송
              recordVoiceActivity(roomId, myUserId, currentTurnVal).catch((e) => {
                console.error("[STT] 음성 활동 기록 실패:", e);
              });
            }

            // [수정] 테스트를 위해 글자 수 제한을 4 -> 2로 완화
            if (!roomId || !transcript || transcript.trim().length < 2) {
              console.log("[STT] 텍스트가 너무 짧아 번역 건너뜀:", transcript);
              continue;
            }

            try {
              console.log(`🚀 [STT] 번역 요청 (Turn: ${currentTurnVal}):`, transcript);
              
              const response = await translateToEnglish(
                roomId,
                transcript,
                currentTurnVal, // Ref 값 사용
                myUserId,
              );
              console.log("[STT] 번역 결과:", response);
            } catch (error) {
              console.error("[STT] 번역 실패:", error);
            }
          }
        }
      };

      recognition.onerror = (event) => {
        // no-speech: 음성 감지 안됨 (정상, 무시)
        if (event.error === 'no-speech') {
          console.log("[STT] 💤 음성이 감지되지 않음 (정상, 계속 대기 중)");
          return;
        }

        // aborted: 의도적 중지 (정상)
        if (event.error === 'aborted') {
          console.log("[STT] 🛑 음성 인식 중지됨");
          return;
        }

        // not-allowed: 마이크 권한 거부
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          console.error("[STT] ❌ 마이크 권한 거부!");
          alert("🎤 마이크 권한을 허용해주세요.\n\n브라우저 설정 > 개인정보 보호 > 마이크에서 권한을 허용하세요.");
          // 권한 거부 시 recognition 정리
          if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
          }
          return;
        }

        // 기타 에러: 로그만 출력
        console.error("[STT] ⚠️ 에러:", event.error);
      };

      recognition.start();
      recognitionRef.current = recognition;
      console.log("🟢 [STT] 음성 인식 시작됨");
    } catch (error) {
      console.error("[STT] 시작 실패:", error);
    }
  }, [roomId, myUserId]); // [중요] currentTurn 제거!
  
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

  const quest2IntroTitle = "돌발 퀘스트!!";
  const quest2IntroBody = "빈칸을 채워봐.";
  const quest2IntroSub = "가장 빠른 사람이 점수를 얻어!";

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

  const showQuest2Intro = questStep === "intro" && activeQuest === 2;
  const showQuest2Game = questStep === "q2game" && activeQuest === 2;

  const showWaitingResult = questStep === "waitingResult" && activeQuest === 1;

  const showResultOverlay =
    (questStep === "resultFail" || questStep === "resultSuccess") &&
    (activeQuest === 1 || activeQuest === 2);

  return (
    <div className={styles.Page}>
      <div className={styles.Shell}>
        {/* 👇 소리 재생용 컴포넌트 추가 */}
        {subscribers.map((sub, i) => (
          <div key={i} style={{ display: 'none' }}>
            <UserAudioComponent streamManager={sub} />
          </div>
        ))}
        <ExitGuard />

        <AppHeader
          userName="user"
          notifications={[]}
          logoExitMessage="메인 화면으로 나가시겠습니까?"
          onLogoExit={doLeaveRoom}
        />

        <div className={styles.Content}>
          <div className={styles.HeaderRow}>
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
                startTimeMs={timerStartedAt}
              />
              <div className={styles.TurnIndicator}>
                {currentTurn} / {roomInfo.turnCount || roomInfo.turnCnt || 3}
              </div>
            </div>
          </div>

          <div className={styles.Stage}>
            <div className={styles.LeftStage}>

              {/* 각 참여자 답변 차례 */}
              {questStep === "q1speaking" &&
                activeQuest === 1 &&
                currentSpeakerIndex >= 0 && (
                  <div className={styles.Quest1Banner}>
                    <div className={styles.Quest1BannerQuestion}>
                      {quest1English}
                    </div>
                    <div
                      style={{
                        marginTop: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "600",
                          color: "#4f46e5",
                        }}
                      >
                        {currentSpeakerIndex < participants.length
                          ? `${participants[currentSpeakerIndex]?.name}님의 차례입니다`
                          : "모든 참여자 답변 완료"}
                      </div>
                      {/* 15초 미니 타이머 */}
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: "700",
                          color: speakerTimeLeft <= 3 ? "#ef4444" : "#10b981",
                        }}
                      >
                        {speakerTimeLeft}초
                      </div>
                    </div>
                  </div>
                )}

              {/* AI 추천 주제 */}
              {aiSuggestion && !questRunning && (
                <div className={styles.AiSuggestionBanner}>{aiSuggestion}</div>
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
                  const participantMicOn = isMe ? micOn : (p.micOn ?? true);
                  const participantVoiceLevel = isMe
                    ? voiceLevel
                    : (p.voiceLevel ?? 0);
                  // 마이크가 꺼져있으면 무조건 speaking 효과 제거
                  const participantSpeaking =
                    participantMicOn &&
                    (isMe ? isSpeaking : (p.isSpeaking ?? false));

                  // 프로필 커스터마이징 정보 파싱
                  const profileInfo = getDuckProfileInfo(p.duckCustomJson);
                  const nicknameStyleInfo = getNicknameStyle(p.avatarCustomJson);

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
                        <div
                          className={styles.AvatarCircle}
                          style={{ background: profileInfo.color }}
                        >
                          <img
                            className={styles.AvatarDuck}
                            src={profileInfo.image}
                            alt={`${p.name} 아바타`}
                          />
                          {profileInfo.accessory && (
                            <span className={styles.ProfileAccessory}>
                              {profileInfo.accessory}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={styles.VideoFooter}>
                        <div className={styles.VideoFooterLeft}>
                          <NicknameBadge
                            nickname={p.name}
                            style={nicknameStyleInfo}
                            size="small"
                          />
                          {isMe && (
                            <span className={styles.MeTag}>(나)</span>
                          )}
                          <img
                            className={styles.MicMini}
                            src={participantMicOn ? micOffIcon : micOnIcon}
                            alt={
                              participantMicOn ? "마이크 켜짐" : "마이크 꺼짐"
                            }
                          />
                        </div>

                        <div className={styles.VideoFooterRight}>
                          <VoiceWave
                            level={participantVoiceLevel}
                            enabled={participantMicOn}
                          />
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
                  <span className={styles.AiTitle}>AI 더기</span>
                  <span className={styles.AiDot} aria-hidden="true" />
                </div>

                <div className={styles.AiFace} aria-hidden="true">
                  🙂
                </div>

                <div className={styles.AiMainText}>
                  한국어로 편하게 대화해보세요!
                </div>
                <div className={styles.AiSubText}>
                  15초 동안 침묵이 지속되면 제가 도와드릴게요.
                </div>

                <div className={styles.AiPointer} aria-hidden="true" />
              </div>

              <img
                className={styles.BigDuck}
                src={aiDuckbotImgSrc}
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
          clickAnywhere={false}
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
          clickAnywhere={false}
          showCloseButton={false}
          escToClose={false}
        />

        {/* 퀘스트 2: 인트로 */}
        <UnexpectedQuestOverlay
          open={showQuest2Intro}
          onClose={handleOverlayClickNext}
          duckSrc={duckBombImg}
          bubbleTitle={quest2IntroTitle}
          bubbleText={quest2IntroBody}
          subText={quest2IntroSub}
          subTone="normal"
          countdownNumber={undefined}
          speechBubbleType={2}
          clickAnywhere={false}
          showCloseButton={false}
          escToClose={false}
        />

        {/* 퀘스트 2: 게임 화면 */}
        <UnexpectedQuestFillBlankModal
          open={showQuest2Game}
          duckSrc={duckBombImg}
          onSubmit={handleSubmitQuest2}
          participants={participants}
        />

        {/* 평가 대기 중 */}
        {showWaitingResult && (
          <div className={styles.WaitingResultOverlay}>
            <div className={styles.WaitingResultContent}>
              <div className={styles.WaitingResultSpinner} />
              <div className={styles.WaitingResultText}>
                답변을 평가하고 있어요
              </div>
              <div className={styles.WaitingResultSubText}>
                잠시만 기다려 주세요!
              </div>
            </div>
          </div>
        )}

        {/* 결과 - 이어하기 버튼 포함 */}
        {showResultOverlay && (
          <div className={styles.QuestResultOverlay}>
            <div className={styles.QuestResultContent}>
              <div className={styles.QuestResultBubbleWrap}>
                <img
                  src={resultDuckSrc}
                  alt="결과 오리"
                  className={styles.QuestResultDuck}
                />
                <div className={styles.QuestResultBubble}>
                  <div className={styles.QuestResultText}>{resultBubbleText}</div>
                </div>
              </div>

              <div className={styles.QuestResultButtonArea}>
                {participants.map((p) => {
                  const isMe = p.isMe === true;
                  const isReady = questContinueReady[p.userId] === true;
                  return (
                    <div key={p.userId} className={styles.QuestResultParticipant}>
                      <span className={styles.QuestResultParticipantName}>
                        {p.name || "참여자"}
                      </span>
                      <span className={`${styles.QuestResultParticipantStatus} ${isReady ? styles.Ready : ""}`}>
                        {isReady ? "✓ 준비 완료" : "대기 중..."}
                      </span>
                    </div>
                  );
                })}

                <button
                  className={styles.QuestContinueButton}
                  onClick={handleQuestContinue}
                  disabled={
                    questContinueReady[
                      participants.find((p) => p.isMe === true)?.userId
                    ] === true
                  }
                >
                  {questContinueReady[
                    participants.find((p) => p.isMe === true)?.userId
                  ] === true
                    ? "준비 완료!"
                    : "이어하기"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 👇 소리 재생용 컴포넌트
const UserAudioComponent = ({ streamManager }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (streamManager && audioRef.current) {
      streamManager.addVideoElement(audioRef.current);
    }
  }, [streamManager]);

  return <audio autoPlay ref={audioRef} />;
};
