import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import ExitButton from "@/components/common/ExitButton/ExitButton";
import NicknameBadge from "@/components/features/mypage/ProfileSection/NicknameBadge";
import ConfirmModal from "@/components/common/ConfirmModal/ConfirmModal";

import duckImg from "@/assets/images/duck.png";
import duckProfile1 from "@/assets/images/duck_profile1.png";
import duckProfile2 from "@/assets/images/duck_profile2.png";
import duckProfile3 from "@/assets/images/duck_profile3.png";
import duckProfile4 from "@/assets/images/duck_profile4.png";
import micOnIcon from "@/assets/icons/mic_on.png";
import micOffIcon from "@/assets/icons/mic_off.png";
import usersIcon from "@/assets/icons/users_icon.png";

import styles from "./WaitingRoomPage.module.css";
// ?몙?ㅽ뵂鍮꾨몢 愿???꾪룷??!
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
  hat: "?렔",
  sunglasses: "?빒截?,
  ribbon: "??",
  crown: "?몣",
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

  // ?몙 ?ㅽ뵂鍮꾨몢?곗슦??Context?먯꽌 ?⑥닔 爰쇰궡?ㅺ린
  const { joinSession, leaveSession, isConnected: isOvConnected, subscribers, publisher } = useOpenVidu();
  
  // ?몙 寃뚯엫 ?쒖옉 ?깆쑝濡??섏씠吏 ?대룞 ?쒖뿉???몄뀡???딆? ?딅룄濡??뚮옒洹??ㅼ젙
  const isTransitioningRef = useRef(false);

  // ?몙 [踰꾧렇 ?섏젙] useEffect ?대??먯꽌 理쒖떊 ?곹깭瑜?李몄“?섍린 ?꾪븳 Ref
  const isOvConnectedRef = useRef(isOvConnected);
  const leaveSessionRef = useRef(leaveSession);

  useEffect(() => {
    isOvConnectedRef.current = isOvConnected;
  }, [isOvConnected]);

  useEffect(() => {
    leaveSessionRef.current = leaveSession;
  }, [leaveSession]);

  // ?몙  ?ㅽ뵂鍮꾨??곗슦??釉뚮씪?곗? ?ㅻ줈媛湲??덈줈怨좎묠 ???곌껐 ?딄린
  useEffect(() => {
      const handleBeforeUnload = () => {
          if (leaveSessionRef.current) leaveSessionRef.current();
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
          // [?섏젙] ?湲곗떎 ?몃쭏?댄듃 ???먮룞?쇰줈 ?몄뀡???딆? ?딅룄濡?蹂寃쏀빀?덈떎.
          // ?몄뀡 醫낅즺??handleExit(?섍?湲?踰꾪듉)?먯꽌留?紐낆떆?곸쑝濡??섑뻾?⑸땲??
          // console.log("?뱧 [WaitingRoom] ?섏씠吏 踰쀬뼱??(?몄뀡 ?좎?)");
      };
  }, []); // ?몚 [以묒슂] 鍮?諛곗뿴濡??ㅼ젙?섏뿬 ?몃쭏?댄듃 ?쒖뿉留??ㅽ뻾!





  const initialRoomInfo = useMemo(() => {
    if (state) {
      // 寃뚯엫?먯꽌 ?뚯븘??寃쎌슦, 李몄뿬?먮뱾???덈뵒 ?곹깭瑜?濡쒖뺄?먯꽌 利됱떆 媛뺤젣 珥덇린??
      if (state.fromGame && state.participants) {
        return {
          ...state,
          participants: state.participants.map(p => ({ ...p, isReady: false, readyStatus: 'NOT_READY' })),
          readyCount: 0
        };
      }
      return state;
    }
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
    roomInfo.roomTitle ?? roomInfo.title ?? "?섎떎諛?,
  );
  const [topic, setTopic] = useState(
    roomInfo.topic ?? roomInfo.roomTopic ?? "醫뗭븘?섎뒗 ?뚯떇",
  );
  const [turnCount, setTurnCount] = useState(
    roomInfo.turnCount ?? roomInfo.turnCnt ?? 3,
  );
  const [timeLimit, setTimeLimit] = useState(() => {
    const raw = roomInfo.timeLimit ?? 40;
    const num = parseInt(raw, 10);
    return isNaN(num) ? 40 : num;
  });

  const [participants, setParticipants] = useState(() => {
    return initialRoomInfo?.participants || [];
  });
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

  // 紐⑤떖 ?곹깭
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const hotTopics = useMemo(
    () => [
      "泥??꾨Ⅴ諛붿씠??異붿뼲",
      "理쒖븙???곗씠??,
      "?섎쭔??痍⑤??앺솢",
      "?숈갹?쒖젅 ?댁빞湲?,
      "?ы뻾 寃쏀뿕??,
      "醫뗭븘?섎뒗 ?뚯떇",
    ],
    [],
  );

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 2000);
  }, []);

  // location.state??toastMessage媛 ?덉쑝硫??쒖떆
  useEffect(() => {
    if (state?.toastMessage) {
      showToast(state.toastMessage);
      // ?쒖떆 ??state?먯꽌 ?쒓굅 (?ㅻ줈媛湲????ㅼ떆 ?⑥? ?딅룄濡?
      window.history.replaceState({ ...state, toastMessage: null }, '');
    }
  }, [state, showToast]);

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
      // const nextTimeLimit = data.timeLimit; // ?쒕쾭 誘몄????꾨뱶 ?쒖쇅

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

        // ?쒕쾭 ?곹깭? ?댁쟾 ?곹깭媛 ?ㅻⅤ硫?濡쒓렇 異쒕젰
        if (prev && prev.isReady !== serverReady) {
          // console.log("[WaitingRoom] fetchLobby - 以鍮??곹깭 蹂寃?媛먯?:", {
            key,
            nickname: m.nickname,
            prevReady: prev.isReady,
            serverReady,
          });
        }

        return {
          key,
          nickname: m.nickname ?? "李몄뿬??,
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

      // console.log("[WaitingRoom] fetchLobby ?꾨즺:", {
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
          timeLimit: timeLimit, // 濡쒖뺄 ?ㅼ젙媛??좎?
          maxCount,
        };
        sessionStorage.setItem(ROOM_INFO_KEY, JSON.stringify(nextRoomInfo));
      } catch {
        // ignore
      }
    } catch {
      showToast("李몄뿬??紐⑸줉??遺덈윭?ㅻ뒗???ㅽ뙣?덉뒿?덈떎.");
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
    if (state?.fromGame) {
      // 寃뚯엫?먯꽌 ?뚯븘??寃쎌슦 ?쒕쾭 DB媛 媛깆떊???쒓컙??異⑸텇??踰뚯뼱以?(1珥?吏??
      const timer = setTimeout(() => {
        fetchLobby();
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      fetchLobby();
    }
  }, [fetchLobby, state?.fromGame]);

  // ?몙 ?ㅽ뵂鍮꾨몢 ?곌껐 以묐났 諛⑹???Ref
  const isConnectingRef = useRef(false);
  const hasAttemptedConnectionRef = useRef(false); // ?몚 [?듭떖] ?곌껐 ?쒕룄 ?щ?瑜?湲곗뼲?섎뒗 ?좉툑 ?μ튂

  useEffect(() => {
    const connectToOpenVidu = async () => {
      const ovSessionId = roomInfo.openviduSessionId;
      
      // 1. ?대? ?곌껐?먭굅?? ?몄뀡 ID媛 ?녾굅?? ?대? ?곌껐???쒕룄 以묒씠嫄곕굹, ?대? ?쒕룄?덉뿀?ㅻ㈃ 利됱떆 以묐떒!
      if (isOvConnected || !ovSessionId || isConnectingRef.current || hasAttemptedConnectionRef.current) {
          return;
      }

      try {
        isConnectingRef.current = true; // ?뵏 ?좉툑 ?쒖옉
        hasAttemptedConnectionRef.current = true; // ???쒕룄 湲곕줉 (?깃났/?ㅽ뙣 ?곴??놁씠 ?ㅼ떆 ????
        
        // console.log("?? [OpenVidu] 理쒖큹 1???곌껐 ?쒕룄...");
        
        const token = await createToken(ovSessionId);
        const myNickname = participants.find(p => p.key === myKey)?.nickname || "Guest";

        await joinSession(token, myNickname);
        // console.log("??[OpenVidu] 理쒖큹 ?곌껐 ?깃났");
        
      } catch (e) {
        console.error("??[OpenVidu] ?곌껐 ?ㅽ뙣:", e);
        // ?ㅽ뙣 ?쒖뿉???ㅼ쓬 湲고쉶???ㅼ떆 ?쒕룄?????덈룄濡??좉툑???댁젣?⑸땲??
        hasAttemptedConnectionRef.current = false;
      } finally {
        isConnectingRef.current = false; // ?뵑 ?좉툑 ?댁젣
      }
    };

    // 議곌굔: 李멸???紐⑸줉???덇퀬 ???ㅺ? ?뺤씤?섏뿀???뚮쭔 ?ㅽ뻾
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
    // console.log("[WaitingRoom] ?윟 MEMBER_JOINED ?섏떊:", {
      payload,
      senderKey,
      currentParticipants: participantsRef.current.length
    });

    if (!senderKey) return;

    const newMember = {
      key: String(senderKey),
      nickname: payload?.nickname ?? "李몄뿬??,
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
      // ?대? 議댁옱?섎뒗 李몄뿬?먮㈃ ?낅뜲?댄듃, ?놁쑝硫?異붽?
      const exists = prev.some((p) => p.key === String(senderKey));
      if (exists) {
        return prev.map((p) => p.key === String(senderKey) ? { ...p, ...newMember } : p);
      }
      return [...prev, newMember];
    });

    if (payload?.totalCount !== undefined) setTotalCount(payload.totalCount);

    // ?덈줈??硫ㅻ쾭媛 ?낆옣?덉쓣 ??理쒖떊 ?뺣낫瑜??ㅼ떆 媛?몄샂 (?꾨줈??而ㅼ뒪?곕쭏?댁쭠 ?숆린??
    fetchLobbyRef.current?.(true);

    // ?덈줈??硫ㅻ쾭媛 ?낆옣?덉쓣 ????留덉씠???곹깭瑜??꾩넚?섏뿬 ?숆린??
    if (sendMicRef.current) {
      // console.log("[WaitingRoom] ??硫ㅻ쾭 ?낆옣 - ??留덉씠???곹깭 ?꾩넚:", myMicOnRef.current);
      sendMicRef.current(myMicOnRef.current);
    }
  }, []);

  const handleMemberLeft = useCallback((payload, senderKey) => {
    // console.log("[WaitingRoom] ?뵶 MEMBER_LEFT ?섏떊:", {
      payload,
      senderKey,
      currentParticipants: participantsRef.current.length
    });

    if (!senderKey) return;

    setParticipants((prev) => prev.filter((p) => p.key !== String(senderKey)));

    if (payload?.totalCount !== undefined) setTotalCount(payload.totalCount);
  }, []);

  const handleRoomClosed = useCallback(() => {
    // console.log("[WaitingRoom] ROOM_CLOSED - 諛⑹옣???댁옣?섏뿬 諛?醫낅즺");

    // ?몄뀡 ?뺣━
    sessionStorage.removeItem(ROOM_INFO_KEY);

    // 硫붿씤 ?붾㈃?쇰줈 ?대룞?섎㈃???좎뒪??硫붿떆吏 ?꾨떖
    navigate("/together", {
      state: { toastMessage: "諛⑹옣???댁옣?섏뿬 ??붽? 醫낅즺?섏뿀?듬땲??" },
    });
  }, [navigate]);

  const handleReadyChanged = useCallback((payload, senderKey) => {
    // console.log("[WaitingRoom] ?봽 READY_CHANGED ?섏떊:", {
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
      // payload?먯꽌 以鍮??곹깭 ?뺤씤 (?щ윭 ?뺤떇 吏??
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

      // console.log("[WaitingRoom] ??以鍮??곹깭 ?낅뜲?댄듃 ?곸슜:", {
        senderKey: String(senderKey),
        newReady,
        payload,
      });

      setParticipants((prev) => {
        const updated = prev.map((p) =>
          p.key === String(senderKey) ? { ...p, isReady: newReady } : p,
        );
        // console.log("[WaitingRoom] ?낅뜲?댄듃 ??participants:", updated.map(p => ({
          key: p.key,
          nickname: p.nickname,
          isReady: p.isReady
        })));
        return updated;
      });
    } else {
      console.warn("[WaitingRoom] ?좑툘 senderKey媛 ?놁뼱??以鍮??곹깭 ?낅뜲?댄듃 遺덇?", payload);
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
            // 留덉씠?ш? 爰쇱?硫?isSpeaking??false濡??ㅼ젙
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
            // 留덉씠?ш? 耳쒖졇?덇퀬 voiceLevel???꾧퀎媛??댁긽???뚮쭔 諛쒗솕 以묒쑝濡??쒖떆
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
      showToast("諛??뺣낫媛 蹂寃쎈릺?덉뒿?덈떎.");
    },
    [showToast],
  );

  const handleWebSocketError = useCallback(
    (msg) => {
      showToast(msg || "?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.");
    },
    [showToast],
  );

  const onRoomStarted = useCallback(
    (payloadOrData) => {
      if (isStarting) return;
      // console.log("?렜 [WaitingRoom] ROOM_STARTED ?섏떊 - 移댁슫?몃떎???쒖옉");
      
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith(`timer_start_${inviteCode}`)) {
          sessionStorage.removeItem(key);
        }
      });
      // console.log("?㏏ [WaitingRoom] ??寃뚯엫 ?쒖옉???꾪빐 ??대㉧ 湲곕줉 珥덇린???꾨즺");
      
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
      // console.log("[WaitingRoom] ??WebSocket ?곌껐 ?깃났! roomCode:", inviteCode);
      fetchLobbyRef.current?.();
    },
    onDisconnected: () => {
      // console.log("[WaitingRoom] ??WebSocket ?곌껐 ?댁젣??);
    },
  });

  // sendMic??ref?????
  useEffect(() => {
    sendMicRef.current = sendMic;
  }, [sendMic]);

  // WebSocket ?곌껐 ?곹깭 濡쒓렇 諛?珥덇린 留덉씠???곹깭 ?꾩넚 (泥섏쓬 1踰덈쭔)
  const initialMicSentRef = useRef(false);
  useEffect(() => {
    // console.log("[WaitingRoom] WebSocket ?곌껐 ?곹깭:", isConnected ? "???곌껐?? : "???딄?");

    // WebSocket ?곌껐 ??珥덇린 留덉씠???곹깭 ?꾩넚
    if (isConnected && sendMic && !initialMicSentRef.current) {
      // console.log("[WaitingRoom] 珥덇린 留덉씠???곹깭 ?꾩넚:", myMicOn);
      sendMic(myMicOn);
      initialMicSentRef.current = true;
    }

    // ?몙 [異붽?] ?대? ?ㅽ뵂鍮꾨몢 ?곌껐???곹깭濡??뚯븘?붿쓣 ??留덉씠???곹깭 ?숆린??
    if (isOvConnected && publisher) {
        // console.log("?렎 [WaitingRoom] 湲곗〈 ?ㅽ뵂鍮꾨몢 ?곌껐 媛먯? - 留덉씠???숆린??", myMicOn);
        publisher.publishAudio(myMicOn);
    }
  }, [isConnected, sendMic, myMicOn, isOvConnected, publisher]);

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
    
    // 1. OpenVidu ?ㅼ젣 留덉씠???쒖뼱
    if (publisher) {
      publisher.publishAudio(nextState);
      // console.log(`?렎 [OpenVidu] 留덉씠??${nextState ? "ON" : "OFF"}`);
    }

    // 2. UI ?곹깭 諛??ㅻ뵒??遺꾩꽍湲??쒖뼱
    setMyMicOn(nextState);

    if (nextState) {
      await startAudioAnalysis();
    } else {
      await stopAudioAnalysis();
    }

    // 3. ?뱀냼耳볦쑝濡??쒕쾭/?ㅻⅨ ?щ엺?먭쾶 ?뚮┝
    if (sendMic) sendMic(nextState);
  }, [myMicOn, publisher, startAudioAnalysis, stopAudioAnalysis, sendMic]);

  const toggleMyReady = useCallback(async () => {
    if (!isConnected) {
      console.warn("[WaitingRoom] ?좑툘 WebSocket 誘몄뿰寃??곹깭 - 以鍮?遺덇?");
      showToast("?쒕쾭? ?곌껐?섏? ?딆븯?듬땲?? ?좎떆 ???ㅼ떆 ?쒕룄?댁＜?몄슂.");
      return;
    }

    try {
      // 1. [?덉퐫??諛⑹떇] 癒쇱? ?쒕쾭 DB瑜?怨좎묩?덈떎. (?붾㈃? ?꾩쭅 ??諛붽퓞)
      const nextReady = !myReady;
      // console.log("[WaitingRoom] ?뱻 API ?몄텧 (DB ???:", { inviteCode, nextReady });
      await toggleReady(inviteCode, nextReady);
      
      // 2. [?덉퐫??諛⑹떇] DB ??μ씠 ?뺤떎???깃났?덉쓣 ?뚮쭔 諛⑹넚???⑸땲??
      if (sendReady) {
        // console.log("[WaitingRoom] ?뱾 諛⑹넚 ?좏샇 諛쒖넚 (?깃났 ?뺤젙):", nextReady);
        sendReady(nextReady);
      }

      // 3. ???붾㈃ ?낅뜲?댄듃???ш린??吏곸젒 ?섏? ?딆뒿?덈떎. 
      // ?닿? 蹂대궦 諛⑹넚 ?좏샇瑜??닿? ?ㅼ떆 ?섏떊(handleReadyChanged)?????붾㈃??諛붾앸땲??
      
    } catch (error) {
      console.error("[WaitingRoom] ??以鍮??곹깭 ????ㅽ뙣:", error);
      showToast("以鍮??곹깭 ??μ뿉 ?ㅽ뙣?덉뒿?덈떎.");
    }
  }, [myKey, myReady, inviteCode, sendReady, showToast, isConnected]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      showToast("李몄뿬 肄붾뱶媛 蹂듭궗?섏뿀?듬땲??");
    } catch {
      showToast("蹂듭궗???ㅽ뙣?덉뒿?덈떎.");
    }
  }, [inviteCode, showToast]);

  const handleKakaoShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "?섎떎DUCK 諛?珥덈?",
          text: `李몄뿬 肄붾뱶: ${inviteCode}\n諛??쒕ぉ: ${roomTitle}\n二쇱젣: ${topic}`,
          url: window.location.href,
        });
        showToast("怨듭쑀媛 ?꾨즺?섏뿀?듬땲??");
      } catch (e) {
        if (e?.name !== "AbortError") showToast("怨듭쑀???ㅽ뙣?덉뒿?덈떎.");
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(
        `李몄뿬 肄붾뱶: ${inviteCode}\n諛??쒕ぉ: ${roomTitle}\n二쇱젣: ${topic}`,
      );
      showToast("珥덈? ?뺣낫媛 蹂듭궗?섏뿀?듬땲??");
    } catch {
      showToast("怨듭쑀???ㅽ뙣?덉뒿?덈떎.");
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
        // API ?묐떟? 諛쏆븯吏留?topics媛 鍮꾩뼱?덉쓣 ??fallback
        if (hotTopics.length > 0) {
          const next = hotTopics[Math.floor(Math.random() * hotTopics.length)];
          setEditTopic(next);
        }
      }
    } catch {
      // API ?ㅽ뙣 ??fallback
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
      showToast("諛??쒕ぉ???낅젰?댁＜?몄슂.");
      return;
    }
    if (!editTopic.trim()) {
      showToast("?섎떎 二쇱젣瑜??낅젰?섍굅???좏깮?댁＜?몄슂.");
      return;
    }

    try {
      await updateRoomSettings(inviteCode, {
        title: editTitle.trim(),
        topic: editTopic.trim(),
        turnCnt: editTurn,
        // timeLimit???쒕쾭 誘몄??먯쑝濡??쒖쇅 (api/rooms.js?먯꽌 ?꾪꽣留곷맖)
      });
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.message || "諛??ㅼ젙 蹂寃쎌뿉 ?ㅽ뙣?덉뒿?덈떎.";
      
      if (errorMessage.includes("諛??쒕ぉ") && errorMessage.includes("遺?곸젅")) {
        setModalTitle("?좑툘 二쇱쓽");
        setModalMessage("遺?곸젅??諛??쒕ぉ ?ㅼ떆 ?앹꽦?댁＜?몄슂");
        setModalOpen(true);
      } else if (errorMessage.includes("諛?二쇱젣") || (errorMessage.includes("二쇱젣") && errorMessage.includes("遺?곸젅"))) {
        setModalTitle("?좑툘 二쇱쓽");
        setModalMessage("遺?곸젅??諛?二쇱젣?낅땲??");
        setModalOpen(true);
      } else {
        showToast(errorMessage);
      }
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
    showToast("諛??ㅼ젙??蹂寃쎈릺?덉뒿?덈떎.");
  }, [editTitle, editTopic, editTurn, editTimeLimit, showToast, inviteCode]);
  
  const handleStart = useCallback(async () => {
    if (!canStart) return;

    try {

      await startRoom(inviteCode);

    } catch {
      showToast("諛⑹쓣 ?쒖옉?섎뒗???ㅽ뙣?덉뒿?덈떎.");
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
    ? "????쒖옉?섍린"
    : myReady
      ? "以鍮?痍⑥냼"
      : "以鍮꾪븯湲?;
  const primaryDisabled = isHost ? !canStart : false;

  const handleExit = useCallback(async () => {
    try {
      await stopAudioAnalysis();
    } catch {
      // ignore
    }

    // ?몙 ?몙 ?ш린???ㅽ뵂鍮꾨몢 ?곌껐 ?뺤떎???딄린!
    leaveSession();

    if (inviteCode && inviteCode !== "000000") {
      try {
        await leaveRoom({ roomCode: inviteCode });
      } catch {
        // ignore
      }
    }

    sessionStorage.removeItem(ROOM_INFO_KEY);
  }, [inviteCode, stopAudioAnalysis, leaveSession]); // ?몚 ?섏〈??諛곗뿴??leaveSession 異붽?

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
          logoExitMessage="硫붿씤 ?붾㈃?쇰줈 ?섍??쒓쿋?듬땲源?"
          logoExitConfirmText="?섍?湲?
          logoExitCancelText="痍⑥냼"
          onLogoExit={handleExit}
          disableProfileClick={isConnected}
        />

        <div className={styles.Top}>
          <ExitButton
            to="/main"
            label="?ㅻ줈 媛湲?
            message="硫붿씤 ?붾㈃?쇰줈 ?섍??쒓쿋?듬땲源?"
            confirmText="?섍?湲?
            cancelText="痍⑥냼"
            onExit={handleExit}
            replace
            className={styles.BackButton}
          />

          <div className={styles.TopHeaderRow}>
            <div className={styles.SpeechRight}>
              <div className={styles.SpeechBubbleRight}>
                ???二쇱젣??<span className={styles.TopicHighlight}>{topic}</span>?낅땲??
              </div>
              <img className={styles.Duck} src={duckImg} alt="?ㅻ━" />
            </div>
          </div>

          <section className={styles.ParticipantsCard} aria-label="李몄뿬??紐⑸줉">
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
                    <span>李몄뿬??/span>
                    <span className={styles.ParticipantsCount}>
                      ({currentCount}/{maxCount})
                    </span>
                  </div>

                  <div className={styles.RoomInfoText}>
                    <span className={styles.RoomInfoLabel}>諛??쒕ぉ:</span>
                    <span className={styles.RoomInfoValue}>{roomTitle}</span>
                    <span className={styles.RoomInfoSeparator}>|</span>
                    <span className={styles.RoomInfoLabel}>二쇱젣:</span>
                    <span className={styles.RoomInfoValue}>{topic}</span>
                    <span className={styles.RoomInfoSeparator}>|</span>
                    <span className={styles.RoomInfoLabel}>????</span>
                    <span className={styles.RoomInfoValue}>{turnCount}??/span>
                    <span className={styles.RoomInfoSeparator}>|</span>
                    <span className={styles.RoomInfoLabel}>?대떦 ?쒗븳?쒓컙:</span>
                    <span className={styles.RoomInfoValue}>{timeLimit}珥?/span>
                  </div>

                  <div className={styles.InviteCodeBox}>
                    <div className={styles.InviteCodeHeader}>
                      <span className={styles.InviteCodeLabel}>李몄뿬 肄붾뱶</span>
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
                          怨듭쑀
                        </button>
                        <button
                          type="button"
                          className={styles.InviteCodeButton}
                          onClick={handleCopy}
                        >
                          <CopyIcon />
                          蹂듭궗
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
                  諛??ㅼ젙 蹂寃?
                </button>
              )}
            </div>

            <div className={styles.ParticipantsBody}>
              {isLoading ? (
                <div className={styles.ParticipantRowEmpty}>
                  <div className={styles.EmptySlotText}>
                    李몄뿬??紐⑸줉 濡쒕뵫 以?..
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
                        <div className={styles.EmptySlotText}>鍮??먮━</div>
                      </div>
                    );
                  }

                  const isMe = p.key === myKey;
                  const micOn = isMe ? myMicOn : (p.micOn ?? false);

                  // ?꾨줈??而ㅼ뒪?곕쭏?댁쭠 ?뺣낫 ?뚯떛
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
                              <span className={styles.MeTag}>(??</span>
                            )}

                            {!p.isHost ? (
                              <span
                                className={`${styles.ReadyTag} ${ 
                                  p.isReady
                                    ? styles.ReadyTagOn
                                    : styles.ReadyTagOff
                                }`}
                              >
                                {p.isReady ? "以鍮??꾨즺" : "?湲?}
                              </span>
                            ) : null}
                          </div>

                          <div className={styles.ActionRow}>
                            <button
                              type="button"
                              className={styles.MicButton}
                              onClick={isMe ? toggleMyMic : undefined}
                              disabled={!isMe}
                              aria-label={micOn ? "留덉씠???꾧린" : "留덉씠??耳쒓린"}
                            >
                              <img
                                className={styles.MicIconImg}
                                src={micOn ? micOffIcon : micOnIcon}
                                alt={micOn ? "留덉씠??耳쒖쭚" : "留덉씠??爰쇱쭚"}
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
                          <span className={styles.HostTag}>諛⑹옣</span>
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
                  ? "紐⑤뱺 李몄뿬?먭? 以鍮??꾨즺?댁빞 ?쒖옉?????덉뒿?덈떎."
                  : undefined
              }
            >
              {isHost ? <PlayIcon /> : null}
              {primaryLabel}
            </button>
          </section>

          <section className={styles.GuideBox} aria-label="?쒖옉 ???덈궡?ы빆">
            <div className={styles.GuideHeader}>
              <span className={styles.GuideDot} aria-hidden="true" />
              <span className={styles.GuideTitle}>?쒖옉 ???덈궡?ы빆</span>
            </div>

            <ul className={styles.GuideList}>
              <li className={styles.GuideItem}>
                {isHost
                  ? "紐⑤뱺 李몄뿬?먭? 以鍮??꾨즺?섎㈃ ??붾? ?쒖옉?????덉뒿?덈떎"
                  : "以鍮꾪븯湲곕? ?꾨Ⅴ硫?諛⑹옣????붾? ?쒖옉?????덉뒿?덈떎"}
              </li>
              <li className={styles.GuideItem}>
                媛??대쭏??1遺꾧컙 ?먯쑀濡?쾶 ??뷀븯?몄슂
              </li>
              <li className={styles.GuideItem}>
                AI媛 ??붾? 遺꾩꽍?섍퀬 ?쇰뱶諛깆쓣 ?쒓났?⑸땲??
              </li>
              <li className={styles.GuideItem}>
                議곗슜???섍꼍?먯꽌 吏꾪뻾?섎㈃ ??醫뗭뒿?덈떎
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
              <h2 className={styles.PopupTitle}>諛??ㅼ젙 蹂寃?/h2>
              <button
                type="button"
                className={styles.PopupCloseButton}
                onClick={handleCloseEditPopup}
                aria-label="?リ린"
              >
                횞
              </button>
            </div>

            <div className={styles.PopupBody}>
              <div className={styles.PopupField}>
                <div className={styles.PopupLabelRow}>
                  <span className={styles.PopupLabel}>諛??쒕ぉ</span>
                  <span className={styles.PopupRequired}>*</span>
                </div>
                <input
                  className={`${styles.PopupInput} ${styles.PopupTitleInput}`}
                  value={editTitle}
                  onChange={handleEditTitleChange}
                  placeholder="?? 移쒓뎄?ㅺ낵 ?섎떎???
                />
                <div className={styles.PopupCounter}>{editTitle.length}/30</div>
              </div>

              <div className={styles.PopupField}>
                <div className={styles.PopupLabelRow}>
                  <span className={styles.PopupLabel}>?섎떎 二쇱젣</span>
                  <span className={styles.PopupRequired}>*</span>
                </div>
                <div className={styles.PopupTopicInputRow}>
                  <input
                    className={styles.PopupInput}
                    value={editTopic}
                    onChange={handleEditTopicChange}
                    placeholder="吏곸젒 ?낅젰?섍굅???꾨옒?먯꽌 ?좏깮?섏꽭??
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
                        AI 異붿쿇
                      </span>
                    ) : (
                      "AI 異붿쿇"
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
                痍⑥냼
              </button>
              <button
                type="button"
                className={styles.PopupSaveButton}
                onClick={handleSaveEditRoomInfo}
              >
                ???
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isStarting && (
        <LoadingOverlay
          title="???以鍮?"
          subtitle="?ㅽ겕由쏀듃瑜?紐⑥쑝???먯쑀留먰븯湲곌? ?쒖옉?⑸땲??
          image={duckHappy}
        />
      )}

      {/* 遺?곸젅???쒗쁽 紐⑤떖 */}
      <ConfirmModal
        open={modalOpen}
        title={modalTitle}
        message={modalMessage}
        confirmText="?뺤씤"
        onConfirm={() => setModalOpen(false)}
        onClose={() => setModalOpen(false)}
        cancelText=""
        small={true}
      />
    </div>
  );
}

// ?몙 ?뚮━ ?ъ깮??而댄룷?뚰듃 !!!!!!
const UserAudioComponent = ({ streamManager }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (streamManager && audioRef.current) {
      streamManager.addVideoElement(audioRef.current);
    }
  }, [streamManager]);

  return <audio autoPlay ref={audioRef} />;
};
