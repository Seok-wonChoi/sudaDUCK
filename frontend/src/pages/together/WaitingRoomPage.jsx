import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import ExitButton from "@/components/common/ExitButton/ExitButton";
import NicknameBadge from "@/components/features/mypage/ProfileSection/NicknameBadge";

import duckImg from "@/assets/images/duck.png";
import duckProfile1 from "@/assets/images/duck_profile1.png";
import duckProfile2 from "@/assets/images/duck_profile2.png";
import duckProfile3 from "@/assets/images/duck_profile3.png";
import duckProfile4 from "@/assets/images/duck_profile4.png";
import micOnIcon from "@/assets/icons/mic_on.png";
import micOffIcon from "@/assets/icons/mic_off.png";
import usersIcon from "@/assets/icons/users_icon.png";

import styles from "./WaitingRoomPage.module.css";
// 👇오픈비두 관련 임포트!!
import { useOpenVidu } from "@/context/OpenViduContext";
import { createToken, createSession } from "@/api/openVidu";
import {
  leaveRoom,
  getRoomLobby,
  toggleReady,
  startRoom,
  updateRoomSettings,
  getTopics,
} from "@/api/rooms";

import useRoomWebSocket from "@/hooks/useRoomWebSocket";
import useSmoothCountdown from "@/hooks/useSmoothCountdown";
import LoadingOverlay from "@/components/common/LoadingOverlay/LoadingOverlay";
import duckHappy from "@/assets/images/duck_happy.png";

const ROOM_INFO_KEY = "together_room_info";

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

function PlayIcon() {
  return (
    <svg
      className={styles.PlayIcon}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="9"
        y="9"
        width="13"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path d="M8.59 13.51L15.42 17.49" stroke="currentColor" strokeWidth="2" />
      <path d="M15.41 6.51L8.59 10.49" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function VoiceWave({ level, enabled }) {
  const multipliers = useMemo(() => [0.5, 0.7, 0.85, 1, 0.85, 0.7, 0.5], []);
  const v = Math.max(0, Math.min(1, level));

  return (
    <span
      className={`${styles.Wave} ${enabled ? styles.WaveOn : styles.WaveOff}`}
      aria-hidden="true"
    >
      {multipliers.map((m, idx) => {
        const h = enabled ? 6 + v * 10 * m : 6;
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

export default function WaitingRoomPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // 👇 오픈비두우우우 Context에서 함수 꺼내오기
  const { joinSession, leaveSession, isConnected: isOvConnected, subscribers, publisher } = useOpenVidu();
  
  // 👇 게임 시작 등으로 페이지 이동 시에는 세션을 끊지 않도록 플래그 설정
  const isTransitioningRef = useRef(false);

  // 👇 [버그 수정] useEffect 내부에서 최신 상태를 참조하기 위한 Ref
  const isOvConnectedRef = useRef(isOvConnected);
  const leaveSessionRef = useRef(leaveSession);

  useEffect(() => {
    isOvConnectedRef.current = isOvConnected;
  }, [isOvConnected]);

  useEffect(() => {
    leaveSessionRef.current = leaveSession;
  }, [leaveSession]);

  // 👇  오픈비듀우우우 브라우저 뒤로가기/새로고침 시 연결 끊기
  useEffect(() => {
      const handleBeforeUnload = () => {
          if (leaveSessionRef.current) leaveSessionRef.current();
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
          // 게임 시작으로 이동하는 경우(isTransitioningRef.current === true)에는 끊지 않음!
          // [수정] 의존성 배열을 비우고([]) Ref를 사용하여, 불필요한 재실행(연결 끊김) 방지
          if (isOvConnectedRef.current && !isTransitioningRef.current) {
             console.log("👋 [WaitingRoom] 대기실 퇴장 -> 세션 종료");
             if (leaveSessionRef.current) leaveSessionRef.current(); 
          } else {
             console.log("🚀 [WaitingRoom] 게임 시작 -> 세션 유지하며 이동");
          }
      };
  }, []); // 👈 [중요] 빈 배열로 설정하여 언마운트 시에만 실행!





  const initialRoomInfo = useMemo(() => {
    if (state) return state;
    try {
      const stored = sessionStorage.getItem(ROOM_INFO_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return {};
  }, [state]);

  const roomInfo = initialRoomInfo ?? {};
  const maxCount = roomInfo.maxCount ?? 4;

  const inviteCode =
    roomInfo.joinCode ?? roomInfo.inviteCode ?? roomInfo.roomCode ?? "000000";

  const [roomId, setRoomId] = useState(roomInfo.roomId ?? null);
  const [roomTitle, setRoomTitle] = useState(
    roomInfo.roomTitle ?? roomInfo.title ?? "수다방",
  );
  const [topic, setTopic] = useState(
    roomInfo.topic ?? roomInfo.roomTopic ?? "좋아하는 음식",
  );
  const [turnCount, setTurnCount] = useState(
    roomInfo.turnCount ?? roomInfo.turnCnt ?? 3,
  );
  const [timeLimit, setTimeLimit] = useState(() => {
    const raw = roomInfo.timeLimit ?? 40;
    const num = parseInt(raw, 10);
    return isNaN(num) ? 40 : num;
  });

  const [participants, setParticipants] = useState([]);
  const participantsRef = useRef([]);
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  const [myKey, setMyKey] = useState("");
  const [readyCount, setReadyCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const startDataRef = useRef(null);

  const { remainingSec, start: startTimer } = useSmoothCountdown(5, {
    onDone: () => {
      if (hasNavigatedRef.current) return;
      hasNavigatedRef.current = true;
      isTransitioningRef.current = true;

      const payloadOrData = startDataRef.current;

      navigate("/together/talk", {
        replace: true,
        state: {
          ...roomInfo,
          roomId: payloadOrData?.roomId ?? roomId ?? roomInfo.roomId,
          roomCode: payloadOrData?.roomCode ?? inviteCode,
          inviteCode,
          joinCode: inviteCode,
          roomTitle,
          title: roomTitle,
          topic,
          turnCount,
          turnCnt: turnCount,
          timeLimit,
          maxCount,
          currentTurn: 1,
          myUserId: myKey ? Number(myKey) : roomInfo.myUserId,
          participants: participants.map((p) => ({
            id: p.key,
            name: p.nickname,
            isMe: p.key === myKey,
            micOn: p.key === myKey ? myMicOn : (p.micOn ?? false),
            voiceLevel: 0,
            isHost: p.isHost,
          })),
        },
      });
    },
  });

  const [myMicOn, setMyMicOn] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  const [voiceLevel, setVoiceLevel] = useState(0);

  const [editPopupOpen, setEditPopupOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(roomTitle);
  const [editTopic, setEditTopic] = useState(topic);
  const [editTurn, setEditTurn] = useState(turnCount);
  const [editTimeLimit, setEditTimeLimit] = useState(timeLimit);
  const [isLoadingAiRecommend, setIsLoadingAiRecommend] = useState(false);

  const hotTopics = useMemo(
    () => [
      "첫 아르바이트 추억",
      "최악의 데이트",
      "나만의 취미생활",
      "학창시절 이야기",
      "여행 경험담",
      "좋아하는 음식",
    ],
    [],
  );

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 2000);
  }, []);

  const getUserIdFromToken = useCallback(() => {
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
      const userId =
        payload.memberId ??
        payload.userId ??
        payload.id ??
        payload.user_id ??
        payload.sub;

      return userId ? String(userId) : null;
    } catch {
      return null;
    }
  }, []);

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
      setVoiceLevel(0);
    }
  }, []);

  useEffect(() => {
    startAudioAnalysis();
    return () => {
      stopAudioAnalysis();
    };
  }, [startAudioAnalysis, stopAudioAnalysis]);

  const fetchLobbyRef = useRef(null);

  const fetchLobby = useCallback(async (isSilent = false) => {
    if (!inviteCode || inviteCode === "000000") {
      if (!isSilent) setIsLoading(false);
      return;
    }

    try {
      if (!isSilent) setIsLoading(true);
      const data = await getRoomLobby(inviteCode);

      const members = data.participants ?? [];

      if (data.roomId != null) setRoomId(data.roomId);

      const nextTitle = data.title ?? data.roomTitle;
      const nextTopic = data.topic ?? data.roomTopic;
      const nextTurn = data.turnCnt ?? data.turnCount;
      // const nextTimeLimit = data.timeLimit; // 서버 미지원 필드 제외

      if (typeof nextTitle === "string" && nextTitle.trim())
        setRoomTitle(nextTitle);
      if (typeof nextTopic === "string" && nextTopic.trim())
        setTopic(nextTopic);
      if (nextTurn !== undefined && nextTurn !== null)
        setTurnCount(Number(nextTurn));
      // if (nextTimeLimit !== undefined && nextTimeLimit !== null)
      //   setTimeLimit(Number(nextTimeLimit));

      const tokenKey = getUserIdFromToken();
      const resolvedMyKey =
        tokenKey ?? (roomInfo.myUserId ? String(roomInfo.myUserId) : "");
      if (resolvedMyKey) setMyKey(resolvedMyKey);

      const readyMembers = members.filter(
        (m) => !m.isHost && m.readyStatus === "READY",
      );

      setReadyCount(readyMembers.length);
      setTotalCount(members.length);

      const prevMap = new Map(participantsRef.current.map((p) => [p.key, p]));

      const mapped = members.map((m) => {
        const key = String(m.userId ?? "");
        const prev = prevMap.get(key);
        const serverReady = m.readyStatus === "READY";

        // 서버 상태와 이전 상태가 다르면 로그 출력
        if (prev && prev.isReady !== serverReady) {
          console.log("[WaitingRoom] fetchLobby - 준비 상태 변경 감지:", {
            key,
            nickname: m.nickname,
            prevReady: prev.isReady,
            serverReady,
          });
        }

        return {
          key,
          nickname: m.nickname ?? "참여자",
          isHost: m.isHost ?? false,
          isReady: serverReady,
          micOn: m.micOn ?? prev?.micOn ?? true,
          voiceLevel: prev?.voiceLevel ?? 0,
          isSpeaking: prev?.isSpeaking ?? false,
          avatarCustomJson: m.avatarCustomJson ?? null,
          duckCustomJson: m.duckCustomJson ?? null,
          aiDuckbotCustomJson: m.aiDuckbotCustomJson ?? null,
        };
      });

      console.log("[WaitingRoom] fetchLobby 완료:", {
        participantCount: mapped.length,
        readyCount: mapped.filter((p) => p.isReady && !p.isHost).length,
      });

      setParticipants(mapped);

      try {
        const nextRoomInfo = {
          ...roomInfo,
          roomId: data.roomId ?? roomInfo.roomId,
          roomCode: data.roomCode ?? inviteCode,
          inviteCode,
          joinCode: inviteCode,
          title: nextTitle ?? roomTitle,
          roomTitle: nextTitle ?? roomTitle,
          topic: nextTopic ?? topic,
          turnCnt: nextTurn ?? turnCount,
          turnCount: nextTurn ?? turnCount,
          timeLimit: timeLimit, // 로컬 설정값 유지
          maxCount,
        };
        sessionStorage.setItem(ROOM_INFO_KEY, JSON.stringify(nextRoomInfo));
      } catch {
        // ignore
      }
    } catch {
      showToast("참여자 목록을 불러오는데 실패했습니다.");
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [
    inviteCode,
    getUserIdFromToken,
    roomInfo,
    roomTitle,
    topic,
    turnCount,
    maxCount,
    showToast,
  ]);

  fetchLobbyRef.current = fetchLobby;

  useEffect(() => {
    fetchLobby();
  }, [fetchLobby]);

  // 👇 오픈비두 연결 중복 방지용 Ref
  const isConnectingRef = useRef(false);
  const hasAttemptedConnectionRef = useRef(false); // 👈 [핵심] 연결 시도 여부를 기억하는 잠금 장치

  useEffect(() => {
    const connectToOpenVidu = async () => {
      const ovSessionId = roomInfo.openviduSessionId;
      
      // 1. 이미 연결됐거나, 세션 ID가 없거나, 이미 연결을 시도 중이거나, 이미 시도했었다면 즉시 중단!
      if (isOvConnected || !ovSessionId || isConnectingRef.current || hasAttemptedConnectionRef.current) {
          return;
      }

      try {
        isConnectingRef.current = true; // 🔒 잠금 시작
        hasAttemptedConnectionRef.current = true; // ✅ 시도 기록 (성공/실패 상관없이 다시 안 함)
        
        console.log("🚀 [OpenVidu] 최초 1회 연결 시도...");
        
        const token = await createToken(ovSessionId);
        const myNickname = participants.find(p => p.key === myKey)?.nickname || "Guest";

        await joinSession(token, myNickname);
        console.log("✅ [OpenVidu] 최초 연결 성공");
        
      } catch (e) {
        console.error("❌ [OpenVidu] 연결 실패:", e);
        // 실패 시에는 다음 기회에 다시 시도할 수 있도록 잠금을 해제합니다.
        hasAttemptedConnectionRef.current = false;
      } finally {
        isConnectingRef.current = false; // 🔓 잠금 해제
      }
    };

    // 조건: 참가자 목록이 있고 내 키가 확인되었을 때만 실행
    if (participants.length > 0 && myKey) {
        connectToOpenVidu();
    }
    
  }, [roomInfo.openviduSessionId, isOvConnected, participants, myKey, joinSession]);

  const currentCount = totalCount || participants.length;

  const me = useMemo(
    () => participants.find((p) => p.key === myKey),
    [participants, myKey],
  );
  const isHost = useMemo(() => me?.isHost ?? false, [me]);
  const myReady = me?.isReady ?? false;

  const nonHostAllReady = useMemo(
    () => participants.filter((p) => !p.isHost).every((p) => p.isReady),
    [participants],
  );

  const canStart = isHost && nonHostAllReady;

  const hasNavigatedRef = useRef(false);

  const sendMicRef = useRef(null);
  const myMicOnRef = useRef(myMicOn);
  useEffect(() => {
    myMicOnRef.current = myMicOn;
  }, [myMicOn]);

  const handleMemberJoined = useCallback((payload, senderKey) => {
    console.log("[WaitingRoom] 🟢 MEMBER_JOINED 수신:", {
      payload,
      senderKey,
      currentParticipants: participantsRef.current.length
    });

    if (!senderKey) return;

    const newMember = {
      key: String(senderKey),
      nickname: payload?.nickname ?? "참여자",
      isHost: payload?.isHost ?? false,
      isReady: payload?.isReady ?? false,
      micOn: payload?.micOn ?? true,
      voiceLevel: 0,
      isSpeaking: false,
      avatarCustomJson: payload?.avatarCustomJson ?? null,
      duckCustomJson: payload?.duckCustomJson ?? null,
      aiDuckbotCustomJson: payload?.aiDuckbotCustomJson ?? null,
    };

    setParticipants((prev) => {
      // 이미 존재하는 참여자면 업데이트, 없으면 추가
      const exists = prev.some((p) => p.key === String(senderKey));
      if (exists) {
        return prev.map((p) => p.key === String(senderKey) ? { ...p, ...newMember } : p);
      }
      return [...prev, newMember];
    });

    if (payload?.totalCount !== undefined) setTotalCount(payload.totalCount);

    // 새로운 멤버가 입장했을 때 최신 정보를 다시 가져옴 (프로필 커스터마이징 동기화)
    fetchLobbyRef.current?.(true);

    // 새로운 멤버가 입장했을 때 내 마이크 상태를 전송하여 동기화
    if (sendMicRef.current) {
      console.log("[WaitingRoom] 새 멤버 입장 - 내 마이크 상태 전송:", myMicOnRef.current);
      sendMicRef.current(myMicOnRef.current);
    }
  }, []);

  const handleMemberLeft = useCallback((payload, senderKey) => {
    console.log("[WaitingRoom] 🔴 MEMBER_LEFT 수신:", {
      payload,
      senderKey,
      currentParticipants: participantsRef.current.length
    });

    if (!senderKey) return;

    setParticipants((prev) => prev.filter((p) => p.key !== String(senderKey)));

    if (payload?.totalCount !== undefined) setTotalCount(payload.totalCount);
  }, []);

  const handleRoomClosed = useCallback(() => {
    console.log("[WaitingRoom] ROOM_CLOSED - 방장이 퇴장하여 방 종료");

    // 세션 정리
    sessionStorage.removeItem(ROOM_INFO_KEY);

    // 메인 화면으로 이동하면서 토스트 메시지 전달
    navigate("/together", {
      state: { toastMessage: "방장이 퇴장하여 대화가 종료되었습니다." },
    });
  }, [navigate]);

  const handleReadyChanged = useCallback((payload, senderKey) => {
    console.log("[WaitingRoom] 🔄 READY_CHANGED 수신:", {
      payload,
      senderKey,
      currentParticipants: participantsRef.current.map(p => ({
        key: p.key,
        nickname: p.nickname,
        isReady: p.isReady
      }))
    });

    if (payload?.readyCount !== undefined) setReadyCount(payload.readyCount);
    if (payload?.totalCount !== undefined) setTotalCount(payload.totalCount);

    if (senderKey) {
      // payload에서 준비 상태 확인 (여러 형식 지원)
      let newReady = false;
      if (payload?.myReadyStatus === "READY" || payload?.readyStatus === "READY") {
        newReady = true;
      } else if (payload?.myReadyStatus === "NOT_READY" || payload?.readyStatus === "NOT_READY") {
        newReady = false;
      } else if (payload?.ready !== undefined) {
        newReady = payload.ready === true;
      } else if (payload?.isReady !== undefined) {
        newReady = payload.isReady === true;
      }

      console.log("[WaitingRoom] ✅ 준비 상태 업데이트 적용:", {
        senderKey: String(senderKey),
        newReady,
        payload,
      });

      setParticipants((prev) => {
        const updated = prev.map((p) =>
          p.key === String(senderKey) ? { ...p, isReady: newReady } : p,
        );
        console.log("[WaitingRoom] 업데이트 후 participants:", updated.map(p => ({
          key: p.key,
          nickname: p.nickname,
          isReady: p.isReady
        })));
        return updated;
      });
    } else {
      console.warn("[WaitingRoom] ⚠️ senderKey가 없어서 준비 상태 업데이트 불가", payload);
    }
  }, []);

  const handleMicChanged = useCallback(
    (payload, senderKey) => {
      if (!senderKey) return;
      const k = String(senderKey);

      if (k === myKey) return;

      setParticipants((prev) =>
        prev.map((p) => {
          if (p.key === k) {
            const newMicOn = payload?.micOn ?? p.micOn;
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
    },
    [myKey],
  );

  const handleVoiceLevelChanged = useCallback(
    (payload, senderKey) => {
      if (!senderKey) return;
      const k = String(senderKey);
      if (k === myKey) return;

      setParticipants((prev) =>
        prev.map((p) => {
          if (p.key === k) {
            const level = payload?.level ?? 0;
            // 마이크가 켜져있고 voiceLevel이 임계값 이상일 때만 발화 중으로 표시
            const isSpeaking = p.micOn && level > 0.03;
            return { ...p, voiceLevel: level, isSpeaking };
          }
          return p;
        }),
      );
    },
    [myKey],
  );

  


  const handleSettingsChanged = useCallback(
    (payload) => {
      const nextTitle =
        payload?.title ?? payload?.roomTitle ?? payload?.name ?? null;
      const nextTopic =
        payload?.topic ?? payload?.roomTopic ?? payload?.theme ?? null;
      const nextTurn =
        payload?.turnCnt ?? payload?.turnCount ?? payload?.turn ?? null;

      if (typeof nextTitle === "string" && nextTitle.trim())
        setRoomTitle(nextTitle);
      if (typeof nextTopic === "string" && nextTopic.trim())
        setTopic(nextTopic);
      if (nextTurn !== null && nextTurn !== undefined)
        setTurnCount(Number(nextTurn));

      setParticipants((prev) =>
        prev.map((p) => (p.isHost ? p : { ...p, isReady: false })),
      );
      setReadyCount(0);

      try {
        const stored = sessionStorage.getItem(ROOM_INFO_KEY);
        const base = stored ? JSON.parse(stored) : {};
        const updated = {
          ...base,
          roomTitle: typeof nextTitle === "string" ? nextTitle : base.roomTitle,
          title: typeof nextTitle === "string" ? nextTitle : base.title,
          topic: typeof nextTopic === "string" ? nextTopic : base.topic,
          turnCount: nextTurn != null ? Number(nextTurn) : base.turnCount,
          turnCnt: nextTurn != null ? Number(nextTurn) : base.turnCnt,
        };
        sessionStorage.setItem(ROOM_INFO_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }

      fetchLobbyRef.current?.();
      showToast("방 정보가 변경되었습니다.");
    },
    [showToast],
  );

  const handleWebSocketError = useCallback(
    (msg) => {
      showToast(msg || "오류가 발생했습니다.");
    },
    [showToast],
  );

  const onRoomStarted = useCallback(
    (payloadOrData) => {
      if (isStarting) return;
      console.log("🎮 [WaitingRoom] ROOM_STARTED 수신 - 카운트다운 시작");
      startDataRef.current = payloadOrData;
      setIsStarting(true);
      startTimer();
    },
    [isStarting, startTimer],
  );

  const { sendReady, sendMic, sendVoiceLevel, isConnected } = useRoomWebSocket(inviteCode, {
    onReadyChanged: handleReadyChanged,
    onMicChanged: handleMicChanged,
    onMemberJoined: handleMemberJoined,
    onMemberLeft: handleMemberLeft,
    onVoiceLevelChanged: handleVoiceLevelChanged,
    onSettingsChanged: handleSettingsChanged,
    onRoomStarted,
    onRoomClosed: handleRoomClosed,
    onError: handleWebSocketError,
    onConnected: () => {
      console.log("[WaitingRoom] ✅ WebSocket 연결 성공! roomCode:", inviteCode);
      fetchLobbyRef.current?.();
    },
    onDisconnected: () => {
      console.log("[WaitingRoom] ❌ WebSocket 연결 해제됨");
    },
  });

  // sendMic을 ref에 저장
  useEffect(() => {
    sendMicRef.current = sendMic;
  }, [sendMic]);

  // WebSocket 연결 상태 로그 및 초기 마이크 상태 전송 (처음 1번만)
  const initialMicSentRef = useRef(false);
  useEffect(() => {
    console.log("[WaitingRoom] WebSocket 연결 상태:", isConnected ? "✅ 연결됨" : "❌ 끊김");

    // WebSocket 연결 시 초기 마이크 상태 전송
    if (isConnected && sendMic && !initialMicSentRef.current) {
      console.log("[WaitingRoom] 초기 마이크 상태 전송:", myMicOn);
      sendMic(myMicOn);
      initialMicSentRef.current = true;
    }
  }, [isConnected, sendMic, myMicOn]);

  const lastLocalSentRef = useRef({ at: 0, level: 0 });
  useEffect(() => {
    if (!myMicOn) return;
    if (!sendVoiceLevel) return;

    const now = performance.now();
    const last = lastLocalSentRef.current;

    if (now - last.at < 120) return;
    if (Math.abs(voiceLevel - last.level) < 0.02) return;

    lastLocalSentRef.current = { at: now, level: voiceLevel };
    if (voiceLevel > 0) sendVoiceLevel(voiceLevel);
  }, [voiceLevel, myMicOn, sendVoiceLevel]);

  const toggleMyMic = useCallback(async () => {
    const nextState = !myMicOn;
    
    // 1. OpenVidu 실제 마이크 제어
    if (publisher) {
      publisher.publishAudio(nextState);
      console.log(`🎤 [OpenVidu] 마이크 ${nextState ? "ON" : "OFF"}`);
    }

    // 2. UI 상태 및 오디오 분석기 제어
    setMyMicOn(nextState);

    if (nextState) {
      await startAudioAnalysis();
    } else {
      await stopAudioAnalysis();
    }

    // 3. 웹소켓으로 서버/다른 사람에게 알림
    if (sendMic) sendMic(nextState);
  }, [myMicOn, publisher, startAudioAnalysis, stopAudioAnalysis, sendMic]);

  const toggleMyReady = useCallback(async () => {
    console.log("[WaitingRoom] 🔘 toggleMyReady 호출:", {
      myKey,
      myReady,
      isConnected,
      inviteCode
    });

    if (!isConnected) {
      console.warn("[WaitingRoom] ⚠️ WebSocket 미연결 상태 - 준비 불가");
      showToast("서버와 연결되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    // 함수형 업데이트로 최신 상태 기반 토글
    let nextReady = null;
    setParticipants((prev) => {
      const me = prev.find((p) => p.key === myKey);
      nextReady = !(me?.isReady ?? false);
      console.log("[WaitingRoom] ✨ Optimistic update:", {
        myKey,
        before: me?.isReady,
        after: nextReady,
        me: me ? { key: me.key, nickname: me.nickname } : null
      });
      return prev.map((p) => (p.key === myKey ? { ...p, isReady: nextReady } : p));
    });

    try {
      console.log("[WaitingRoom] 📡 API 호출 시작:", { inviteCode, nextReady });
      const response = await toggleReady(inviteCode, nextReady);
      console.log("[WaitingRoom] ✅ API 호출 성공:", response);
    } catch (error) {

      // Rollback
      setParticipants((prev) =>
        prev.map((p) => (p.key === myKey ? { ...p, isReady: !nextReady } : p)),
      );
      showToast("준비 상태 변경에 실패했습니다.");
      return;
    }

    // WebSocket으로 다른 참여자들에게 전송
    if (sendReady) {
      console.log("[WaitingRoom] 📤 WebSocket 전송:", { nextReady, destination: `/app/rooms/${inviteCode}/ready` });
      sendReady(nextReady);
    } else {
      console.warn("[WaitingRoom] ⚠️ sendReady가 없어서 WebSocket 전송 불가");
    }

    // 웹소켓 READY_CHANGED 메시지로 상태 동기화 (fetchLobby 제거로 깜빡임 방지)
  }, [myKey, myReady, inviteCode, sendReady, showToast, isConnected]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      showToast("참여 코드가 복사되었습니다.");
    } catch {
      showToast("복사에 실패했습니다.");
    }
  }, [inviteCode, showToast]);

  const handleKakaoShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "수다DUCK 방 초대",
          text: `참여 코드: ${inviteCode}\n방 제목: ${roomTitle}\n주제: ${topic}`,
          url: window.location.href,
        });
        showToast("공유가 완료되었습니다.");
      } catch (e) {
        if (e?.name !== "AbortError") showToast("공유에 실패했습니다.");
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(
        `참여 코드: ${inviteCode}\n방 제목: ${roomTitle}\n주제: ${topic}`,
      );
      showToast("초대 정보가 복사되었습니다.");
    } catch {
      showToast("공유에 실패했습니다.");
    }
  }, [inviteCode, roomTitle, topic, showToast]);

  const handleEditRoomInfo = useCallback(() => {
    if (!isHost) return;
    setEditTitle(roomTitle);
    setEditTopic(topic);
    setEditTurn(turnCount);
    setEditTimeLimit(timeLimit);
    setEditPopupOpen(true);
  }, [isHost, roomTitle, topic, turnCount, timeLimit]);

  const handleCloseEditPopup = useCallback(() => {
    setEditPopupOpen(false);
  }, []);

  const handleEditTitleChange = useCallback((e) => {
    setEditTitle(e.target.value.slice(0, 30));
  }, []);

  const handleEditTopicChange = useCallback((e) => {
    setEditTopic(e.target.value);
  }, []);

  const handlePickEditTopic = useCallback((t) => {
    setEditTopic(t);
  }, []);

  const handleAiRecommend = useCallback(async () => {
    setIsLoadingAiRecommend(true);
    try {
      const data = await getTopics();
      const topics = data?.topics || [];
      if (topics.length > 0) {
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        setEditTopic(randomTopic);
      } else {
        // API 응답은 받았지만 topics가 비어있을 때 fallback
        if (hotTopics.length > 0) {
          const next = hotTopics[Math.floor(Math.random() * hotTopics.length)];
          setEditTopic(next);
        }
      }
    } catch {
      // API 실패 시 fallback
      if (hotTopics.length > 0) {
        const next = hotTopics[Math.floor(Math.random() * hotTopics.length)];
        setEditTopic(next);
      }
    } finally {
      setIsLoadingAiRecommend(false);
    }
  }, [hotTopics]);

  const handleSaveEditRoomInfo = useCallback(async () => {
    if (!editTitle.trim()) {
      showToast("방 제목을 입력해주세요.");
      return;
    }
    if (!editTopic.trim()) {
      showToast("수다 주제를 입력하거나 선택해주세요.");
      return;
    }

    try {
      await updateRoomSettings(inviteCode, {
        title: editTitle.trim(),
        topic: editTopic.trim(),
        turnCnt: editTurn,
        // timeLimit는 서버 미지원으로 제외 (api/rooms.js에서 필터링됨)
      });
    } catch {
      showToast("방 설정 변경에 실패했습니다.");
      return;
    }

    setRoomTitle(editTitle.trim());
    setTopic(editTopic.trim());
    setTurnCount(editTurn);
    setTimeLimit(editTimeLimit);

    try {
      const stored = sessionStorage.getItem(ROOM_INFO_KEY);
      const base = stored ? JSON.parse(stored) : {};
      sessionStorage.setItem(
        ROOM_INFO_KEY,
        JSON.stringify({
          ...base,
          roomTitle: editTitle.trim(),
          title: editTitle.trim(),
          topic: editTopic.trim(),
          turnCount: editTurn,
          turnCnt: editTurn,
          timeLimit: editTimeLimit,
        }),
      );
    } catch {
      // ignore
    }

    setEditPopupOpen(false);
    fetchLobbyRef.current?.();
    showToast("방 설정이 변경되었습니다.");
  }, [editTitle, editTopic, editTurn, showToast, inviteCode]);
  
  const handleStart = useCallback(async () => {
    if (!canStart) return;

    try {
      await startRoom(inviteCode);
    } catch {
      showToast("방을 시작하는데 실패했습니다.");
      return;
    }

    setTimeout(() => {
      if (hasNavigatedRef.current) return;
      fetchLobbyRef.current?.();
    }, 800);
  }, [canStart, inviteCode, showToast]);

  const handlePrimary = useCallback(() => {
    if (isHost) handleStart();
    else toggleMyReady();
  }, [isHost, handleStart, toggleMyReady]);

  const primaryLabel = isHost
    ? "대화 시작하기"
    : myReady
      ? "준비 취소"
      : "준비하기";
  const primaryDisabled = isHost ? !canStart : false;

  const handleExit = useCallback(async () => {
    try {
      await stopAudioAnalysis();
    } catch {
      // ignore
    }

    // 👇 👇 여기서 오픈비두 연결 확실히 끊기!
    leaveSession();

    if (inviteCode && inviteCode !== "000000") {
      try {
        await leaveRoom({ roomCode: inviteCode });
      } catch {
        // ignore
      }
    }

    sessionStorage.removeItem(ROOM_INFO_KEY);
  }, [inviteCode, stopAudioAnalysis, leaveSession]); // 👈 의존성 배열에 leaveSession 추가

  return (
    <div className={styles.Page}>
      <div className={styles.Shell}>
        {subscribers.map((sub) => (
            <div key={sub.stream.connection.connectionId} style={{ display: 'none' }}>
                <UserAudioComponent streamManager={sub} />
            </div>
        ))}
        <AppHeader
          userName="user"
          notifications={[]}
          logoExitMessage="메인 화면으로 나가시겠습니까?"
          logoExitConfirmText="나가기"
          logoExitCancelText="취소"
          onLogoExit={handleExit}
        />

        <div className={styles.Top}>
          <ExitButton
            to="/"
            label="뒤로 가기"
            message="메인 화면으로 나가시겠습니까?"
            confirmText="나가기"
            cancelText="취소"
            onExit={handleExit}
            replace
            className={styles.BackButton}
          />

          <div className={styles.TopHeaderRow}>
            <div className={styles.SpeechRight}>
              <div className={styles.SpeechBubbleRight}>
                대화 주제는 <span className={styles.TopicHighlight}>{topic}</span>입니다!
              </div>
              <img className={styles.Duck} src={duckImg} alt="오리" />
            </div>
          </div>

          <section className={styles.ParticipantsCard} aria-label="참여자 목록">
            <div className={styles.ParticipantsHeader}>
              <div className={styles.HeaderLeft}>
                <div className={styles.TopRow}>
                  <div className={styles.ParticipantsTitle}>
                    <img
                      className={styles.ParticipantsTitleIcon}
                      src={usersIcon}
                      alt=""
                      aria-hidden="true"
                    />
                    <span>참여자</span>
                    <span className={styles.ParticipantsCount}>
                      ({currentCount}/{maxCount})
                    </span>
                  </div>

                  <div className={styles.RoomInfoText}>
                    <span className={styles.RoomInfoLabel}>방 제목:</span>
                    <span className={styles.RoomInfoValue}>{roomTitle}</span>
                    <span className={styles.RoomInfoSeparator}>|</span>
                    <span className={styles.RoomInfoLabel}>주제:</span>
                    <span className={styles.RoomInfoValue}>{topic}</span>
                    <span className={styles.RoomInfoSeparator}>|</span>
                    <span className={styles.RoomInfoLabel}>턴 수:</span>
                    <span className={styles.RoomInfoValue}>{turnCount}턴</span>
                    <span className={styles.RoomInfoSeparator}>|</span>
                    <span className={styles.RoomInfoLabel}>타이머:</span>
                    <span className={styles.RoomInfoValue}>{timeLimit}초</span>
                  </div>

                  <div className={styles.InviteCodeBox}>
                    <div className={styles.InviteCodeHeader}>
                      <span className={styles.InviteCodeLabel}>참여 코드</span>
                    </div>
                    <div className={styles.InviteCodeRow}>
                      <div className={styles.InviteCodeValue}>{inviteCode}</div>
                      <div className={styles.InviteCodeActions}>
                        <button
                          type="button"
                          className={styles.InviteCodeButton}
                          onClick={handleKakaoShare}
                        >
                          <ShareIcon />
                          공유
                        </button>
                        <button
                          type="button"
                          className={styles.InviteCodeButton}
                          onClick={handleCopy}
                        >
                          <CopyIcon />
                          복사
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {isHost && (
                <button
                  type="button"
                  className={styles.EditButton}
                  onClick={handleEditRoomInfo}
                >
                  방 설정 변경
                </button>
              )}
            </div>

            <div className={styles.ParticipantsBody}>
              {isLoading ? (
                <div className={styles.ParticipantRowEmpty}>
                  <div className={styles.EmptySlotText}>
                    참여자 목록 로딩 중...
                  </div>
                </div>
              ) : (
                Array.from({ length: maxCount }).map((_, index) => {
                  const p = participants[index];

                  if (!p) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className={styles.ParticipantRowEmpty}
                      >
                        <div className={styles.EmptySlotText}>빈 자리</div>
                      </div>
                    );
                  }

                  const isMe = p.key === myKey;
                  const micOn = isMe ? myMicOn : (p.micOn ?? false);

                  // 프로필 커스터마이징 정보 파싱
                  const profileInfo = getDuckProfileInfo(p.duckCustomJson);
                  const nicknameStyleInfo = getNicknameStyle(p.avatarCustomJson);

                  return (
                    <div key={p.key || index} className={styles.ParticipantRow}>
                      <div className={styles.ParticipantLeft}>
                        <div
                          className={styles.UserIconWrap}
                          style={{ background: profileInfo.color }}
                          aria-hidden="true"
                        >
                          <img
                            className={styles.UserIconImg}
                            src={profileInfo.image}
                            alt=""
                          />
                          {profileInfo.accessory && (
                            <span className={styles.ProfileAccessory}>
                              {profileInfo.accessory}
                            </span>
                          )}
                        </div>

                        <div className={styles.InfoColumn}>
                          <div className={styles.NameRow}>
                            <NicknameBadge
                              nickname={p.nickname}
                              style={nicknameStyleInfo}
                              size="small"
                            />
                            {isMe && (
                              <span className={styles.MeTag}>(나)</span>
                            )}

                            {!p.isHost ? (
                              <span
                                className={`${styles.ReadyTag} ${ 
                                  p.isReady
                                    ? styles.ReadyTagOn
                                    : styles.ReadyTagOff
                                }`}
                              >
                                {p.isReady ? "준비 완료" : "대기"}
                              </span>
                            ) : null}
                          </div>

                          <div className={styles.ActionRow}>
                            <button
                              type="button"
                              className={styles.MicButton}
                              onClick={isMe ? toggleMyMic : undefined}
                              disabled={!isMe}
                              aria-label={micOn ? "마이크 끄기" : "마이크 켜기"}
                            >
                              <img
                                className={styles.MicIconImg}
                                src={micOn ? micOffIcon : micOnIcon}
                                alt={micOn ? "마이크 켜짐" : "마이크 꺼짐"}
                              />
                            </button>

                            <VoiceWave
                              level={isMe ? voiceLevel : (p.voiceLevel ?? 0)}
                              enabled={micOn}
                            />
                          </div>
                        </div>
                      </div>

                      <div className={styles.ParticipantRight}>
                        {p.isHost ? (
                          <span className={styles.HostTag}>방장</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              type="button"
              className={`${styles.StartButton} ${ 
                primaryDisabled ? styles.StartButtonDisabled : ""
              } ${!isHost && myReady ? styles.StartButtonReady : ""}`}
              onClick={handlePrimary}
              disabled={primaryDisabled}
              aria-disabled={primaryDisabled}
              title={
                isHost && primaryDisabled
                  ? "모든 참여자가 준비 완료해야 시작할 수 있습니다."
                  : undefined
              }
            >
              {isHost ? <PlayIcon /> : null}
              {primaryLabel}
            </button>
          </section>

          <section className={styles.GuideBox} aria-label="시작 전 안내사항">
            <div className={styles.GuideHeader}>
              <span className={styles.GuideDot} aria-hidden="true" />
              <span className={styles.GuideTitle}>시작 전 안내사항</span>
            </div>

            <ul className={styles.GuideList}>
              <li className={styles.GuideItem}>
                {isHost
                  ? "모든 참여자가 준비 완료하면 대화를 시작할 수 있습니다"
                  : "준비하기를 누르면 방장이 대화를 시작할 수 있습니다"}
              </li>
              <li className={styles.GuideItem}>
                각 턴마다 1분간 자유롭게 대화하세요
              </li>
              <li className={styles.GuideItem}>
                AI가 대화를 분석하고 피드백을 제공합니다
              </li>
              <li className={styles.GuideItem}>
                조용한 환경에서 진행하면 더 좋습니다
              </li>
            </ul>
          </section>
        </div>
      </div>

      {toastMessage ? <div className={styles.Toast}>{toastMessage}</div> : null}

      {editPopupOpen ? (
        <div className={styles.PopupOverlay}>
          <div className={styles.PopupContainer}>
            <div className={styles.PopupHeader}>
              <h2 className={styles.PopupTitle}>방 설정 변경</h2>
              <button
                type="button"
                className={styles.PopupCloseButton}
                onClick={handleCloseEditPopup}
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            <div className={styles.PopupBody}>
              <div className={styles.PopupField}>
                <div className={styles.PopupLabelRow}>
                  <span className={styles.PopupLabel}>방 제목</span>
                  <span className={styles.PopupRequired}>*</span>
                </div>
                <input
                  className={`${styles.PopupInput} ${styles.PopupTitleInput}`}
                  value={editTitle}
                  onChange={handleEditTitleChange}
                  placeholder="예: 친구들과 수다타임"
                />
                <div className={styles.PopupCounter}>{editTitle.length}/30</div>
              </div>

              <div className={styles.PopupField}>
                <div className={styles.PopupLabelRow}>
                  <span className={styles.PopupLabel}>수다 주제</span>
                  <span className={styles.PopupRequired}>*</span>
                </div>
                <div className={styles.PopupTopicInputRow}>
                  <input
                    className={styles.PopupInput}
                    value={editTopic}
                    onChange={handleEditTopicChange}
                    placeholder="직접 입력하거나 아래에서 선택하세요"
                  />
                  <button
                    type="button"
                    className={styles.PopupAiButton}
                    onClick={handleAiRecommend}
                    disabled={isLoadingAiRecommend}
                  >
                    {isLoadingAiRecommend ? (
                      <span className={styles.PopupAiButtonContent}>
                        <span className={styles.PopupAiSpinner} />
                        AI 추천
                      </span>
                    ) : (
                      "AI 추천"
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.PopupFooter}>
              <button
                type="button"
                className={styles.PopupCancelButton}
                onClick={handleCloseEditPopup}
              >
                취소
              </button>
              <button
                type="button"
                className={styles.PopupSaveButton}
                onClick={handleSaveEditRoomInfo}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isStarting && (
        <LoadingOverlay
          title="대화 준비!"
          subtitle="스크립트를 모으는 자유말하기가 시작됩니다"
          image={duckHappy}
        />
      )}
    </div>
  );
}

// 👇 소리 재생용 컴포넌트 !!!!!!
const UserAudioComponent = ({ streamManager }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (streamManager && audioRef.current) {
      streamManager.addVideoElement(audioRef.current);
    }
  }, [streamManager]);

  return <audio autoPlay ref={audioRef} />;
};