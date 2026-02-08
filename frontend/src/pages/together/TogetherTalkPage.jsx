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
import { createToken } from "@/api/openVidu"; // ?‘ˆ [ì¶”ê?] ?¬ì ‘?ìš© API
import { scheduleQuiz, submitQuizAnswer } from "@/api/quiz";
import { translateToEnglish } from "@/api/translate";
import { convertWebMToWav } from "@/utils/audioConverter";
import useRoomWebSocket from "@/hooks/useRoomWebSocket";
import { useOpenVidu } from "@/context/OpenViduContext"; // ?‘ˆ OpenVidu Hook ì¶”ê?
import { useSoundContext } from "@/context/SoundContext";

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
import duckTogether from "@/assets/images/duck_together.png";
import micOnIcon from "@/assets/icons/mic_on.png";
import micOffIcon from "@/assets/icons/mic_off.png";
import alertSound from "@/assets/sounds/alert.wav";
import gameoverSound from "@/assets/sounds/game_fail.wav";
import gameSuccessSound from "@/assets/sounds/game_success.wav";

import UnexpectedQuestOverlay from "@/components/features/unexpected-quest/UnexpectedQuestOverlay";
import UnexpectedQuestFillBlankModal from "@/components/features/unexpected-quest/UnexpectedQuestFillBlankModal";
import LoadingOverlay from "@/components/common/LoadingOverlay/LoadingOverlay";

const ROOM_INFO_KEY = "together_room_info";

const AI_DUCKBOT_IMAGES = {
  // ?´ë¦„ ê¸°ë°˜
  CYAN: duckBotCyanImg,
  DIGITAL: duckBotDigitalImg,
  MECHA: duckBotMechaImg,
  ORANGE: duckBotOrangeImg,

  // ?«ì ê¸°ë°˜ (ë¬¸ì„œ/ë°±ì—??MODEL_1~4 ?°ëŠ” ê²½ìš° ?€ë¹?
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
  hat: "?©",
  sunglasses: "?•¶ï¸?,
  ribbon: "??",
  crown: "?‘‘",
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
  const { publisher, subscribers, leaveSession, session, joinSession } =
    useOpenVidu(); // ?‘ˆ session, joinSession ì¶”ê?
  const { getEffectiveVolume, isMuted } = useSoundContext();

  const [isRoomTimerRunning, setIsRoomTimerRunning] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [hydratedInfo, setHydratedInfo] = useState(() => {
    if (location.state) return location.state;

    const saved = sessionStorage.getItem(ROOM_INFO_KEY);
    const parsed = saved ? safeParseJson(saved) : null;
    return parsed ?? null;
  });

  // ?‘‡ [ì¶”ê?] ?ˆë¡œê³ ì¹¨ ???¸ì…˜ ë³µêµ¬ ë¡œì§ (êµ¬ì¡°?€)
  const isRecoveringRef = useRef(false);

  useEffect(() => {
    const restoreSession = async () => {
      // 1. ?´ë? ?¸ì…˜???ˆê±°?? ë³µêµ¬ ?œë„ ì¤‘ì´ë©??¨ìŠ¤
      if (session || isRecoveringRef.current) return;

      // 2. ë°??•ë³´ê°€ ?†ìœ¼ë©?ë³µêµ¬ ë¶ˆê?
      const info =
        hydratedInfo || safeParseJson(sessionStorage.getItem(ROOM_INFO_KEY));
      const ovSessionId =
        info?.openviduSessionId || info?.roomInfo?.openviduSessionId;

      if (!ovSessionId) {
        console.warn(
          "[TogetherTalkPage] ? ï¸ ë³µêµ¬???¤í”ˆë¹„ë‘ ?¸ì…˜ IDê°€ ?†ìŠµ?ˆë‹¤.",
        );
        return;
      }

      // console.log(
        "?š‘ [TogetherTalkPage] ?ˆë¡œê³ ì¹¨ ê°ì?! ?¸ì…˜ ë³µêµ¬ë¥??œë„?©ë‹ˆ??..",
        ovSessionId,
      );
      isRecoveringRef.current = true;

      try {
        // 3. ???‰ë„¤??ì°¾ê¸°
        const myId = info.myUserId ?? getUserIdFromToken();
        const myName = Array.isArray(info.participants)
          ? info.participants.find(
              (p) => String(p.id || p.userId) === String(myId),
            )?.nickname
          : "ë³µêµ¬?œìœ ?€";

        // 4. ? í° ?¬ë°œê¸?ë°??‘ì†
        const token = await createToken(ovSessionId);
        await joinSession(token, myName || "User");

        // console.log("??[TogetherTalkPage] ?¸ì…˜ ë³µêµ¬ ?±ê³µ!");
      } catch (e) {
        console.error("??[TogetherTalkPage] ?¸ì…˜ ë³µêµ¬ ?¤íŒ¨:", e);
        // ?¤íŒ¨ ??ë©”ì¸?¼ë¡œ ?•ê¸°ê²????˜ë„ ?ˆì?ë§? ?¼ë‹¨ ë¡œê·¸ë§?ì¶œë ¥
      } finally {
        isRecoveringRef.current = false;
      }
    };

    restoreSession();
  }, [session, hydratedInfo, joinSession]);

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
  const timeLimit = useMemo(() => {
    const raw = roomInfo.timeLimit || roomInfo.roomInfo?.timeLimit;
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 15 && num <= 60) return num;
    return 40; // ê¸°ë³¸ê°?
  }, [roomInfo.timeLimit, roomInfo.roomInfo?.timeLimit]);
  const durationMs = timeLimit * 1000;

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

  // ?€?´ë¨¸ ?œì‘ ?œê°„ (?ˆë? timestamp) - ?ˆë? ?œê°„ ê³ ì • ë¡œì§
  const [timerStartedAt, setTimerStartedAt] = useState(() => {
    try {
      // 1. ë°?ì½”ë“œ ?•ë³´ (?†ìœ¼ë©??¸ì…˜?ì„œ ë¹„ìƒ ë³µêµ¬)
      let code =
        roomInfo.roomCode ||
        roomInfo.inviteCode ||
        roomInfo.joinCode ||
        roomInfo.code ||
        roomInfo.roomInfo?.roomCode;

      if (!code) {
        code = sessionStorage.getItem("last_active_room_code");
      } else {
        // ì½”ë“œ ?ˆìœ¼ë©?ë¬´ì¡°ê±?ë°±ì—…
        sessionStorage.setItem("last_active_room_code", code);
      }

      if (!code) return Date.now();

      // 2. ?„ì¬ ?´ì— ?€??ê³ ìœ  ???ì„±
      // ì£¼ì˜: currentTurn ?íƒœ ë³€???€??roomInfo ê°’ì„ ì§ì ‘ ?¬ìš© (ì´ˆê¸°???œì„œ ë¬¸ì œ ë°©ì?)
      const turnVal =
        roomInfo.currentTurn ?? roomInfo.roomInfo?.currentTurn ?? 1;
      const storageKey = `timer_start_${code}_turn_${turnVal}`;

      // 3. ë°•ì œ???œê°„ ?ˆë‚˜ ?•ì¸
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        // console.log(`[Timer] ?’¾ ë³µêµ¬???œê°„: ${saved} (?? ${turnVal})`);
        return parseInt(saved, 10);
      }

      // 4. ?†ìœ¼ë©?ì§€ê¸??œê°„??ë°•ì œ?˜ê³  ?œì‘
      const now = Date.now();
      sessionStorage.setItem(storageKey, String(now));
      // console.log(`[Timer] ?“Œ ?œê°„ ë°•ì œ: ${now} (?? ${turnVal})`);
      return now;
    } catch {
      return Date.now();
    }
  });

  // ?´ì´ ë°”ë€??Œë§ˆ???ˆë¡œ???œê°„ ë°•ì œ
  useEffect(() => {
    if (!resolvedRoomCode) return;

    // ?¬ê¸°?œëŠ” currentTurn ?íƒœë¥??ˆì „?˜ê²Œ ?¬ìš© ê°€??(useEffect ?´ë??´ë?ë¡?
    // ?˜ì?ë§??˜ì¡´??ë°°ì—´??currentTurn???†ìœ¼ë¯€ë¡?roomInfo???´ë? ë³€?˜ë¡œ ?‘ê·¼?´ì•¼ ??
    // ?¸ì˜??ë³„ë„???íƒœ ê´€ë¦¬ê? ?„ë‹Œ roomInfo??timerStartedAt ?…ë°?´íŠ¸ ë¡œì§?ì„œ ì²˜ë¦¬ ê¶Œì¥
    // ?¬ê¸°?œëŠ” ì´ˆê¸°??ë¡œì§??ê°•ë ¥?˜ë?ë¡?ì¶”ê??ì¸ useEffect??ìµœì†Œ??
  }, [resolvedRoomCode]);

  // ?€?´ë¨¸ ?œì‘ ?œê°„ sessionStorage ?€??(ê¸°ì¡´ ì½”ë“œ ?œê±°??

  const [topic, setTopic] = useState(roomInfo.topic ?? "ì¢‹ì•„?˜ëŠ” ?Œì‹");
  const [maxCount, setMaxCount] = useState(roomInfo.maxCount ?? 4);

  const [roomId, setRoomId] = useState(() => {
    const id = roomInfo.roomId ?? roomInfo.roomInfo?.roomId ?? null;
    // console.log("[TogetherTalkPage] roomId ì´ˆê¸°??", {
      "roomInfo.roomId": roomInfo.roomId,
      "roomInfo.roomInfo?.roomId": roomInfo.roomInfo?.roomId,
      "ìµœì¢… roomId": id,
      roomInfo,
    });
    return id;
  });

  // ??hydratedInfo ë³€ê²???roomId ?…ë°?´íŠ¸ (RecordingPage?ì„œ ?Œì•„????
  useEffect(() => {
    const newRoomId = hydratedInfo?.roomInfo?.roomId ?? hydratedInfo?.roomId;
    if (newRoomId && newRoomId !== roomId) {
      // console.log(
        "[TogetherTalkPage] roomId ?…ë°?´íŠ¸:",
        roomId,
        "->",
        newRoomId,
      );
      setRoomId(newRoomId);
    }
  }, [hydratedInfo, roomId]);

  // RecordingPage?ì„œ ?Œì•„????ì¦ê?????ë²ˆí˜¸ë¥?? ì?
  const [currentTurn, setCurrentTurn] = useState(() => {
    const turn = roomInfo.currentTurn ?? roomInfo.roomInfo?.currentTurn ?? 1;
    // console.log("[TogetherTalkPage] currentTurn ì´ˆê¸°??", {
      roomInfo,
      turn,
    });
    return turn;
  });

  // [?˜ì • 2] ?°ì´???™ê¸°??ì¶”ê?: ?˜ì´ì§€ ?´ë™?¼ë¡œ hydratedInfoê°€ ë°”ë€Œë©´ ??ë²ˆí˜¸???…ë°?´íŠ¸
  useEffect(() => {
    const nextTurn =
      hydratedInfo?.currentTurn ?? hydratedInfo?.roomInfo?.currentTurn;
    // console.log("[TogetherTalkPage] hydratedInfo ë³€ê²?ê°ì?:", {
      hydratedInfo,
      currentTurnFromState: hydratedInfo?.currentTurn,
      currentTurnFromRoomInfo: hydratedInfo?.roomInfo?.currentTurn,
      nextTurn,
      currentCurrentTurn: currentTurn,
    });

    if (
      nextTurn !== undefined &&
      nextTurn !== null &&
      nextTurn !== currentTurn
    ) {
      // console.log(
        `[TogetherTalkPage] ??ë²ˆí˜¸ ?…ë°?´íŠ¸: ${currentTurn} ??${nextTurn}`,
      );
      setCurrentTurn(nextTurn);
    }
  }, [hydratedInfo, currentTurn]);

  // [ì¶”ê?] ?´ì´ ë³€ê²½ë  ?Œë§ˆ???ëŠ” ë°?ì½”ë“œê°€ ?•ë³´???Œë§ˆ?? ?´ë‹¹ ?´ì˜ ?œì‘ ?œê°„??ë°•ì œ
  useEffect(() => {
    if (!resolvedRoomCode) return;

    const storageKey = `timer_start_${resolvedRoomCode}_turn_${currentTurn}`;
    const saved = sessionStorage.getItem(storageKey);

    // ?´ë? ?€?¥ëœ ?œê°„???†ìœ¼ë©??????œì‘) ?„ì¬ ?œê°„??ë°•ì œ
    if (!saved) {
      const now = Date.now();
      sessionStorage.setItem(storageKey, String(now));
      setTimerStartedAt(now);
      // console.log(`[Timer] ?”„ ????${currentTurn}) ?œì‘, ?œê°„ ë°•ì œ: ${now}`);
    } else {
      // ?´ë? ?ˆìœ¼ë©??ˆë¡œê³ ì¹¨ ?? ê·¸ê±° ?€
      const parsed = parseInt(saved, 10);
      // ?„ì¬ state?€ ?¤ë¥´ë©??…ë°?´íŠ¸ (ë¶ˆí•„?”í•œ ?Œë”ë§?ë°©ì?)
      setTimerStartedAt((prev) => (prev !== parsed ? parsed : prev));
      // console.log(`[Timer] ?’¾ ??${currentTurn} ?œê°„ ? ì?: ${parsed}`);
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
      name: p.name ?? p.nickname ?? "ì°¸ì—¬??,
      isMe: p.isMe === true,
      micOn: p.micOn ?? true,
      isHost: p.isHost ?? false,
      voiceLevel: p.voiceLevel ?? 0,
      isSpeaking: false,
    }));
  });

  //participantsë¥?ì¶”ì ?˜ëŠ” ref ?ì„±
  const participantsRef = useRef(participants);
  const timerSyncedRef = useRef(false); // ?€?´ë¨¸ ?™ê¸°???¬ë? ì¶”ì 

  //participantsê°€ ë³€???Œë§ˆ??ref ?…ë°?´íŠ¸
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  // ë°©ì¥ ?¬ë? ?•ì¸
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

      // ?€?´ë¨¸ ?œì‘ ?œê°„ ?¤ì • (?œë²„ ê°’ìœ¼ë¡??™ê¸°?? - ë¡œì»¬ ?¤í† ë¦¬ì? ?°ì„  ?•ì±…?¼ë¡œ ?œê±°
      /* 
      if (data?.timerStartedAt != null) {
        const serverTime = Number(data.timerStartedAt);
        if (!timerSyncedRef.current || timerStartedAt !== serverTime) {
           // ?œë²„ ?œê°„ ??–´?°ê¸° ë°©ì?
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
          name: m.nickname ?? "ì°¸ì—¬??,
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
      console.error("[TogetherTalkPage] getRoomLobby ?¤íŒ¨:", e);
    }
  }, [resolvedRoomCode, myUserId]);

  // ?˜ì´ì§€ ë¡œë“œ/?ˆë¡œê³ ì¹¨ ???€?´ë¨¸ ?™ê¸°?”ë? ?„í•´ ref ì´ˆê¸°??
  useEffect(() => {
    // ?€?´ë¨¸ê°€ sessionStorage???†ìœ¼ë©??™ê¸°???„ìš”
    if (resolvedRoomCode) {
      const saved = sessionStorage.getItem(`timer_started_${resolvedRoomCode}`);
      if (!saved) {
        timerSyncedRef.current = false;
        // console.log("[TogetherTalkPage] ?€?´ë¨¸ ?™ê¸°???„ìš” - ref ì´ˆê¸°??);
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

  // ?˜ìŠ¤??ê´€???íƒœ (WebSocket ?¸ë“¤?¬ì—???¬ìš©?˜ë?ë¡??¸ë“¤?¬ë³´??ë¨¼ì? ? ì–¸)
  const [activeQuest, setActiveQuest] = useState(null); // 1 | 2 | null
  const [questStep, setQuestStep] = useState("idle");
  const [quizId, setQuizId] = useState(null);
  const [quizQuestion, setQuizQuestion] = useState(
    "AIê°€ ì§ˆë¬¸???ì„±?˜ê³  ?ˆìŠµ?ˆë‹¤...", // WebSocket?¼ë¡œ AI ?ì„± ì§ˆë¬¸ ?˜ì‹  ?€ê¸?ì¤?
  );
  const [micStateBeforeQuest, setMicStateBeforeQuest] = useState(true);
  const [myQuizResult, setMyQuizResult] = useState(null);

  /* =========================
     ?œêµ­?´â†’?ì–´ ë²ˆì—­ (Chrome STT) - ?ë‹¨ ?´ë™
  ========================= */
  const recognitionRef = useRef(null);

  // [?„ìˆ˜] ??ë²ˆí˜¸ ìµœì‹ ??Ref
  const currentTurnRef = useRef(currentTurn);
  useEffect(() => {
    currentTurnRef.current = currentTurn;
  }, [currentTurn]);

  // [ì¶”ê?] ?˜ë„?ìœ¼ë¡?STTë¥?ê»ëŠ”ì§€ ?•ì¸?˜ëŠ” ?Œë˜ê·?
  const isSTTIntentionallyStopped = useRef(false);

  // STT ?œì‘
  // STT ?œì‘ ?¨ìˆ˜ (?„ì„±ë³?
  const startSTT = useCallback(() => {
    // 1. ?´ë? ?¤í–‰ ì¤‘ì´ê±°ë‚˜ ?˜ì´ì§€ ?„í™˜ ì¤‘ì´ë©?ì¤‘ë³µ ?¤í–‰ ë°©ì?
    if (recognitionRef.current || isTransitioning) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("[STT] ë¯¸ì???ë¸Œë¼?°ì?");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "ko-KR";
      recognition.continuous = true;
      recognition.interimResults = false;

      // ?œì‘ ??"?˜ë„??ì¤‘ì?" ?Œë˜ê·??´ì œ
      isSTTIntentionallyStopped.current = false;

      recognition.onresult = async (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript;

            // ê³µë°±?´ê±°???ˆë¬´ ì§§ìœ¼ë©?1ê¸€??ë¯¸ë§Œ) ë¬´ì‹œ (ë¡œê·¸ ê³¼ë‹¤ ë°©ì?)
            if (!transcript || transcript.trim().length < 2) continue;

            // [ë¡œê·¸] ?¸ì‹???´ìš©ë§??¬í”Œ?˜ê²Œ ì¶œë ¥
            // console.log("?¤", transcript);

            // Refë¥??µí•´ ìµœì‹  ??ë²ˆí˜¸ ì¡°íšŒ
            const currentTurnVal = currentTurnRef.current;

            // ë§í–ˆ?¼ë‹ˆ ?•ì  ê°ì? ë¦¬ì…‹ ? í˜¸ ?„ì†¡
            if (roomId && myUserId && currentTurnVal) {
              recordVoiceActivity(roomId, myUserId, currentTurnVal).catch(
                () => {},
              );
            }

            try {
              // ë²ˆì—­ API ?¸ì¶œ
              await translateToEnglish(
                roomId,
                transcript,
                currentTurnVal,
                myUserId,
              );
            } catch (error) {
              console.error("[STT] ë²ˆì—­ ?„ì†¡ ?¤íŒ¨");
            }
          }
        }
      };

      recognition.onerror = (event) => {
        // no-speech: ?Œì„± ê°ì? ?ˆë¨ (?•ìƒ, ë¬´ì‹œ)
        if (event.error === "no-speech") {
          // console.log("[STT] ?’¤ ?Œì„±??ê°ì??˜ì? ?ŠìŒ (?•ìƒ, ê³„ì† ?€ê¸?ì¤?");
          return;
        }

        // aborted: ?˜ë„??ì¤‘ì? (?•ìƒ)
        if (event.error === "aborted") {
          // console.log("[STT] ?›‘ ?Œì„± ?¸ì‹ ì¤‘ì???);
          return;
        }

        // not-allowed: ë§ˆì´??ê¶Œí•œ ê±°ë?
        if (
          event.error === "not-allowed" ||
          event.error === "service-not-allowed"
        ) {
          console.error("[STT] ??ë§ˆì´??ê¶Œí•œ ê±°ë?!");
          alert(
            "?¤ ë§ˆì´??ê¶Œí•œ???ˆìš©?´ì£¼?¸ìš”.\n\në¸Œë¼?°ì? ?¤ì • > ê°œì¸?•ë³´ ë³´í˜¸ > ë§ˆì´?¬ì—??ê¶Œí•œ???ˆìš©?˜ì„¸??",
          );
          // ê¶Œí•œ ê±°ë? ??recognition ?•ë¦¬
          if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
          }
          return;
        }

        // ê¸°í? ?ëŸ¬: ë¡œê·¸ë§?ì¶œë ¥
        console.error("[STT] ? ï¸ ?ëŸ¬:", event.error);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (error) {
      console.error("[STT] ?œì‘ ?¤ë¥˜");
    }
  }, [roomId, myUserId, isTransitioning]); // [ì¤‘ìš”] currentTurn ?œê±°, isTransitioning ì¶”ê?

  // STT ì¤‘ì?
  const stopSTT = useCallback(() => {
    isSTTIntentionallyStopped.current = true; // ?¬ì‹œ??ë°©ì? ?Œë˜ê·??¤ì •

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  // ?œêµ­???€???œì‘ ??STT ?ë™ ?œì‘ (ë§ˆì´?¬ê? ì¼œì ¸ ?ˆì„ ?Œë§Œ)
  useEffect(() => {
    const isQuestRunning = questStep !== "idle"; // questRunning ë³€???€??ì§ì ‘ ë¹„êµ
    if (!isQuestRunning && roomId && micOn && !isTransitioning) {
      startSTT();
    } else {
      stopSTT();
    }

    // ì»´í¬?ŒíŠ¸ ?¸ë§ˆ?´íŠ¸ ??ì¤‘ì?
    return () => {
      stopSTT();
    };
  }, [questStep, roomId, micOn, startSTT, stopSTT, isTransitioning]);

  const handleConversationSuggestion = useCallback(
    (question) => {
      // ?Œë°œ ?˜ìŠ¤??ì§„í–‰ ì¤‘ì—??AI ì¶”ì²œ ë¬´ì‹œ
      if (questStep !== "idle") {
        // console.log("[Quest] ?˜ìŠ¤??ì§„í–‰ ì¤?- AI ì¶”ì²œ ë¬´ì‹œ:", question);
        return;
      }

      // AI ì¶”ì²œ ì£¼ì œë¥?ê³„ì† ?œì‹œ (?€?´ë¨¸ë¡??ë™ ?? œ?˜ì? ?ŠìŒ)
      // ?ˆë¡œ??ì£¼ì œê°€ ?¤ë©´ ê¸°ì¡´ ì£¼ì œë¥??€ì²?
      setAiSuggestion(question || "");
    },
    [questStep],
  );

  const handleSilenceDetected = useCallback(
    (payload, senderKey) => {
      // console.log(`?”‡ [?•ì  ê°ì?] ${timeLimit}ì´??™ì•ˆ ?€?”ê? ?†ì—ˆ?µë‹ˆ??`, {
        payload,
        senderKey,
        roomId,
        currentTurn,
      });
    },
    [roomId, currentTurn, timeLimit],
  );

  const handleVoiceLevelChanged = useCallback((payload, senderKey) => {
    if (!senderKey) return;
    const k = String(senderKey);

    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === k) {
          const level = payload?.level ?? 0;
          // ë§ˆì´?¬ê? ì¼œì ¸?ˆê³  voiceLevel???„ê³„ê°??´ìƒ???Œë§Œ ë°œí™” ì¤‘ìœ¼ë¡??œì‹œ
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

    // console.log("[TogetherTalkPage] MIC_CHANGED ?˜ì‹ :", {
      senderKey: k,
      micOn: payload?.micOn,
    });

    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === k) {
          const newMicOn = payload?.micOn ?? true;
          // ë§ˆì´?¬ê? êº¼ì?ë©?isSpeaking??falseë¡??¤ì •
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

        // ?ˆë¡œê³ ì¹¨ ?œì—??WebSocket ?€?´ë¨¸?€ ?™ê¸°??
        if (!timerSyncedRef.current || timerStartedAt !== startTime) {
          // console.log(
            "[TogetherTalkPage] ?¹ì†Œì¼“ìœ¼ë¡??€?´ë¨¸ ?œì‘ ?œê°„ ?™ê¸°??",
            startTime,
            "(?ˆë¡œê³ ì¹¨ ?œì—???™ê¸°??",
          );
          setTimerStartedAt(startTime);
          timerSyncedRef.current = true;

          // sessionStorage?ë„ ?€??(?ˆë¡œê³ ì¹¨ ??ì°¸ê³ ??
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

  // ??ì¢…ë£Œ ??ëª¨ë“  ì°¸ì—¬?ê? /recording?¼ë¡œ ?´ë™
  const handleRoomEnded = useCallback(
    (payload) => {
      // console.log(
        "[TogetherTalkPage] ROOM_ENDED ?˜ì‹  - /recording?¼ë¡œ ?´ë™",
        payload,
      );

      const totalTurns =
        payload?.roomInfo?.turnCount ??
        roomInfo.turnCount ??
        roomInfo.turnCnt ??
        3;

      const isLastTurn = currentTurn >= totalTurns;

      const navigateToRecording = () => {
        navigate("/recording", {
          replace: true,
          state: {
            mode: "together",
            roomInfo: {
              ...roomInfo,
              roomId: payload?.roomInfo?.roomId ?? roomId,
              roomCode: resolvedRoomCode,
              turnCount: totalTurns,
              currentTurn: currentTurn, // ?„ì¬ ??ë²ˆí˜¸ ?„ë‹¬
              isHost: isHost, // ë°©ì¥ ê¶Œí•œ ëª…ì‹œ???„ë‹¬
              timeLimit: timeLimit, // ?€?´ë¨¸ ?¤ì •ê°?ëª…ì‹œ???„ë‹¬
            },
            participants,
            myUserId, // ë³¸ì¸ userId ?„ë‹¬
          },
        });
      };

      // ??ë§ˆì?ë§????¬ë??€ ?ê??†ì´ ??ƒ ë¡œë”© ?”ë©´ ?œì‹œ
      setIsTransitioning(true);
      stopSTT(); // ë¡œë”© ?œì‘ ??STT ì¦‰ì‹œ ì¤‘ë‹¨
      setTimeout(() => {
        navigateToRecording();
      }, 5000);
    },
    [
      navigate,
      roomInfo,
      roomId,
      participants,
      currentTurn,
      resolvedRoomCode,
      myUserId,
      stopSTT,
    ],
  );

  // ë°©ì¥ ?´ì¥ ??ë©”ì¸ ?”ë©´?¼ë¡œ ê°•ì œ ?´ë™
  const handleRoomClosed = useCallback(() => {
    // console.log("[TogetherTalkPage] ROOM_CLOSED ?˜ì‹  - ë°©ì¥ ?´ì¥");
    navigate("/main", {
      replace: true,
      state: { toastMessage: "ë°©ì¥???´ì¥?˜ì—¬ ?€?”ê? ì¢…ë£Œ?˜ì—ˆ?µë‹ˆ??" },
    });
  }, [navigate]);

  const sendMicRef = useRef(null);
  const micOnRef = useRef(micOn);
  useEffect(() => {
    micOnRef.current = micOn;
  }, [micOn]);

  const handleMemberJoined = useCallback((payload, senderKey) => {
    // console.log("[TogetherTalkPage] ??ë©¤ë²„ ?…ì¥:", { payload, senderKey });
    // ?ˆë¡œ??ë©¤ë²„ê°€ ?…ì¥?ˆì„ ????ë§ˆì´???íƒœë¥??„ì†¡?˜ì—¬ ?™ê¸°??
    if (sendMicRef.current) {
      // console.log(
        "[TogetherTalkPage] ??ë©¤ë²„ ?…ì¥ - ??ë§ˆì´???íƒœ ?„ì†¡:",
        micOnRef.current,
      );
      sendMicRef.current(micOnRef.current);
    }
  }, []);

  // WebSocket ?´ì¦ˆ ?˜ì‹  ?¸ë“¤??(AI ?ì„± ì§ˆë¬¸ ?¬í•¨)
  const handleQuizReceived = useCallback(
    (payload) => {
      // console.log("[Quiz] ??AI ?ì„± ?´ì¦ˆ ?˜ì‹ :", payload);

      // API ?¤í™??ë§ê²Œ quiz ê°ì²´?ì„œ ?°ì´??ì¶”ì¶œ
      const quiz = payload?.quiz || payload;

      if (quiz?.quizId) {
        setQuizId(quiz.quizId);
        // console.log("[Quiz] quizId ?¤ì •??", quiz.quizId);
      } else {
        console.warn("[Quiz] ? ï¸ quizId ?„ë“œê°€ ?†ìŠµ?ˆë‹¤. payload:", payload);
      }

      if (quiz?.question) {
        setQuizQuestion(quiz.question);
        // console.log("[Quiz] AI ?ì„± ì§ˆë¬¸ ?¤ì •??", quiz.question);
        // console.log("[Quiz] ?ŒíŠ¸:", quiz.hint);
        // console.log("[Quiz] ?ˆì‹œ ?µë?:", quiz.expectedAnswer);
      } else {
        console.warn("[Quiz] ? ï¸ question ?„ë“œê°€ ?†ìŠµ?ˆë‹¤. payload:", payload);
      }

      // ?´ì¦ˆ ?œì‘ (startQuest(1)ê³??™ì¼??ë¡œì§)
      setMicStateBeforeQuest(micOn);
      setAiSuggestion("");

      // ?•ì  ê°ì? ì¤‘ì?
      if (roomId) {
        stopSilenceMonitoring(roomId)
          .then(() => // console.log("[Quest] ?•ì  ê°ì? ì¤‘ì?"))
          .catch((e) => console.error("[Quest] ?•ì  ê°ì? ì¤‘ì? ?¤íŒ¨:", e));
      }

      // ?˜ìŠ¤???œì‘ ???„ì¬ ?¨ì? ?œê°„ ?€??
      const elapsed = Date.now() - timerStartedAt;
      const remaining = Math.max(0, durationMs - elapsed);
      pausedTimeRemainingRef.current = remaining;
      // console.log("[Quest] ?€?´ë¨¸ ?¼ì‹œ?•ì? - ?¨ì? ?œê°„:", remaining, "ms");

      setActiveQuest(1);
      setIsRoomTimerRunning(false);
      setQuestStep("q1intro");
    },
    [micOn, roomId, timerStartedAt],
  );

  // WebSocket ?´ì¦ˆ ê²°ê³¼ ?˜ì‹  ?¸ë“¤??(ê°ì???‰ê?ë§??ì‹ ?ê²Œ ?œì‹œ)
  const handleQuizResultReceived = useCallback((payload) => {
    // console.log("[Quiz] ?´ì¦ˆ ê²°ê³¼ ?˜ì‹ :", payload);
    // console.log("[Quiz] payload ?ì„¸ êµ¬ì¡°:", JSON.stringify(payload, null, 2));

    // ???€?„ì•„???´ë¦¬??(ê²°ê³¼ ë°›ì•˜?¼ë?ë¡?
    if (quizResultTimeoutRef.current) {
      clearTimeout(quizResultTimeoutRef.current);
      quizResultTimeoutRef.current = null;
      // console.log("[Quiz] ?‰ê? ê²°ê³¼ ?€?„ì•„???´ë¦¬??);
    }

    setMyQuizResult(payload);

    // ??ê²°ê³¼ êµ¬ì¡° ?Œì‹±: payload.result.evaluations ?ëŠ” payload ì§ì ‘
    const result = payload?.result || payload;
    const evaluations = result?.evaluations;

    // console.log("[Quiz] ?Œì‹±??ê²°ê³¼:", { result, evaluations });

    // evaluations ë°°ì—´?ì„œ ?„ì¬ ?¬ìš©???‰ê? ì°¾ê¸°
    let isCorrect = false;
    if (Array.isArray(evaluations) && evaluations.length > 0) {
      // ?„ì¬??ì²?ë²ˆì§¸ ?‰ê? ?¬ìš© (?˜ì¤‘??userIdë¡??„í„°ë§?ê°€??
      const evaluation = evaluations[0];
      isCorrect = evaluation?.isCorrect || evaluation?.correct || false;
      // console.log("[Quiz] ?‰ê? ê²°ê³¼:", { evaluation, isCorrect });
    } else {
      // êµ¬ë²„???‘ë‹µ ?•ì‹ ?€??
      isCorrect =
        payload?.isCorrect ||
        payload?.correct ||
        result?.isCorrect ||
        result?.correct ||
        false;
    }

    if (isCorrect) {
      setQuestStep("resultSuccess");
    } else {
      setQuestStep("resultFail");
    }
  }, []);

  // WebSocket ?Œë°œ ?˜ìŠ¤???˜ì‹  ?¸ë“¤??(ëª¨ë“  ì°¸ì—¬?ê? ?™ì‹œ???œì‘)
  const handleUnexpectedQuestReceived = useCallback(
    (payload) => {
      // console.log("[UnexpectedQuest] ???Œë°œ ?˜ìŠ¤???˜ì‹ :", payload);

      const questId = payload?.questId || payload?.id || 1;
      const questType = payload?.type;

      // console.log("[UnexpectedQuest] ?˜ìŠ¤???œì‘:", { questId, questType });

      // ?˜ìŠ¤?¸ê? ?´ë? ì§„í–‰ ì¤‘ì´ë©?ë¬´ì‹œ
      if (questStep !== "idle") {
        // console.log("[UnexpectedQuest] ? ï¸ ?´ë? ?˜ìŠ¤??ì§„í–‰ ì¤? ë¬´ì‹œ");
        return;
      }

      // startQuest???„ë˜?ì„œ ?•ì˜?˜ë?ë¡? ì§ì ‘ ë¡œì§???¬ê¸°??êµ¬í˜„?˜ê±°??
      // refë¥??¬ìš©?´ì•¼ ?©ë‹ˆ?? ?¬ê¸°?œëŠ” payloadë¡?ë°›ì? ?•ë³´ë¡?ì§ì ‘ ?œì‘
      setMicStateBeforeQuest(micOn);
      setAiSuggestion("");

      // ?•ì  ê°ì? ì¤‘ì?
      if (roomId) {
        stopSilenceMonitoring(roomId)
          .then(() => // console.log("[UnexpectedQuest] ?•ì  ê°ì? ì¤‘ì?"))
          .catch((e) =>
            console.error("[UnexpectedQuest] ?•ì  ê°ì? ì¤‘ì? ?¤íŒ¨:", e),
          );
      }

      // ?˜ìŠ¤???œì‘ ???„ì¬ ?¨ì? ?œê°„ ?€??
      const elapsed = Date.now() - timerStartedAt;
      const remaining = Math.max(0, durationMs - elapsed);
      pausedTimeRemainingRef.current = remaining;
      // console.log(
        "[UnexpectedQuest] ?€?´ë¨¸ ?¼ì‹œ?•ì? - ?¨ì? ?œê°„:",
        remaining,
        "ms",
      );

      setActiveQuest(questId);
      setIsRoomTimerRunning(false);

      if (questId === 1) {
        setQuestStep("q1intro");
      } else if (questId === 2) {
        setQuestStep("intro");
      }
    },
    [questStep, micOn, roomId, timerStartedAt],
  );

  // ??useRoomWebSocket??roomId ?„ë‹¬ (?•ì ê°ì? êµ¬ë…??
  const {
    sendEndRoom,
    sendVoiceLevel,
    sendMic,
    sendUnexpectedQuest,
    isConnected,
  } = useRoomWebSocket(
    resolvedRoomCode,
    {
      onConversationSuggestion: handleConversationSuggestion,
      onSilenceDetected: handleSilenceDetected,
      onRoomEnded: handleRoomEnded,
      onRoomClosed: handleRoomClosed,
      onVoiceLevelChanged: handleVoiceLevelChanged,
      onMicChanged: handleMicChanged,
      onMemberJoined: handleMemberJoined,
      onTimerSync: handleTimerSync, // ?¹ì†Œì¼“ìœ¼ë¡??€?´ë¨¸ ?™ê¸°??(ì²˜ìŒ 1ë²ˆë§Œ)
      onQuizReceived: handleQuizReceived, // ?´ì¦ˆ ?˜ì‹ 
      onQuizResultReceived: handleQuizResultReceived, // ?´ì¦ˆ ê²°ê³¼ ?˜ì‹ 
      onUnexpectedQuestReceived: handleUnexpectedQuestReceived, // ?Œë°œ ?˜ìŠ¤???˜ì‹ 
      onConnected: () => // console.log("WebSocket ?°ê²°??(TogetherTalkPage)"),
      onDisconnected: () =>
        // console.log("WebSocket ?°ê²° ?´ì œ??(TogetherTalkPage)"),
    },
    roomId,
  );

  // sendMic??ref???€??
  useEffect(() => {
    sendMicRef.current = sendMic;
  }, [sendMic]);

  // WebSocket ?°ê²° ??ì´ˆê¸° ë§ˆì´???íƒœ ?„ì†¡ (ì²˜ìŒ 1ë²ˆë§Œ)
  const initialMicSentRef = useRef(false);
  useEffect(() => {
    if (isConnected && sendMic && !initialMicSentRef.current) {
      // console.log("[TogetherTalkPage] ì´ˆê¸° ë§ˆì´???íƒœ ?„ì†¡:", micOn);
      sendMic(micOn);
      // ?‘‡ ?˜ì´ì§€ ì§„ì… ??OpenVidu ë§ˆì´???íƒœ ?™ê¸°??
      if (publisher) {
        // console.log("[TogetherTalkPage] OpenVidu ë§ˆì´??ì´ˆê¸°??", micOn);
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

  // ë§ˆì´?¬ì? ?•ì  ê°ì? ì´ˆê¸°??(ì»´í¬?ŒíŠ¸ ë§ˆìš´???œì—ë§?
  useEffect(() => {
    startAudioAnalysis();

    if (roomId && currentTurn) {
      startSilenceMonitoring(roomId, currentTurn).catch((e) => {
        console.error("?•ì  ê°ì? ?œì‘ ?¤íŒ¨:", e);
      });
    }

    return () => {
      stopAudioAnalysis();

      if (roomId) {
        stopSilenceMonitoring(roomId).catch((e) => {
          console.error("?•ì  ê°ì? ì¤‘ì? ?¤íŒ¨:", e);
        });
      }
    };
  }, [startAudioAnalysis, stopAudioAnalysis, roomId, currentTurn]);

  // ?Œì„± ?ˆë²¨ë¡??•ì  ê°ì? ì´ˆê¸°?”í•˜ì§€ ?ŠìŒ (STT?ì„œë§?ì´ˆê¸°??
  // useEffect(() => {
  //   if (isSpeaking && roomId && myUserId && currentTurn) {
  //     recordVoiceActivity(roomId, myUserId, currentTurn).catch((e) => {
  //       console.error("?Œì„± ?œë™ ê¸°ë¡ ?¤íŒ¨:", e);
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
      if (publisher) publisher.publishAudio(false); // ?‘ˆ OpenVidu Mute
      await stopAudioAnalysis();
      return;
    }
    setMicOn(true);
    sendMic(true);
    if (publisher) publisher.publishAudio(true); // ?‘ˆ OpenVidu Unmute
    await startAudioAnalysis();
  }, [micOn, startAudioAnalysis, stopAudioAnalysis, sendMic, publisher]);

  // [ì¶”ê?] API ?¸ì¶œ ?†ì´ ?¤ë””???•ì ê°ì?ë§?ë©ˆì¶”???¬í¼ ?¨ìˆ˜
  const stopMediaProcessing = useCallback(async () => {
    await stopAudioAnalysis();
    if (roomId) {
      try {
        await stopSilenceMonitoring(roomId);
      } catch (e) {
        console.error("?•ì  ê°ì? ì¤‘ì? ?¤íŒ¨:", e);
      }
    }
  }, [stopAudioAnalysis, roomId]);

  const doLeaveRoom = useCallback(async () => {
    await stopAudioAnalysis();

    // ?‘‡ ì§„ì§œ ë°©ì„ ?˜ê°ˆ ?ŒëŠ” ?¸ì…˜ ì¢…ë£Œ
    if (leaveSession) leaveSession();

    if (resolvedRoomCode) {
      try {
        await leaveRoom({ roomCode: resolvedRoomCode });
      } catch (e) {
        console.error("ë°??´ì¥ API ?¸ì¶œ ?¤íŒ¨:", e);
      }
    }
  }, [stopMediaProcessing, resolvedRoomCode, leaveSession]);

  // ??handleEnd: sendEndRoom(WS) ?€??endRoom REST API ?¸ì¶œ
  // ë°±ì—”?œì— /app/rooms/{roomCode}/end WS ?¸ë“¤?¬ê? ?†ìŒ ??REST APIë§?ì¡´ì¬
  const handleEnd = useCallback(async () => {
    // ë°©ì¥ë§???ì¢…ë£Œ ê°€??
    if (!isHost) return;

    // console.log("[TogetherTalkPage] ??ì¢…ë£Œ - ?„ë‹¬???°ì´??", {
      roomId,
      roomCode: resolvedRoomCode,
      currentTurn,
      turnCount: roomInfo.turnCount || roomInfo.turnCnt || 3,
    });

    // REST APIë¡?ë°?ì¢…ë£Œ (?´ë²¤?¸ëŠ” ë°±ì—”?œì—??ROOM_ENDED WSë¡?ë¸Œë¡œ?œìº?¤íŠ¸??
    try {
      await endRoom(resolvedRoomCode);
      // console.log(
        "[TogetherTalkPage] endRoom REST API ?±ê³µ - ?¹ì†Œì¼?ë©”ì‹œì§€ ?€ê¸?ì¤?,
      );
    } catch (e) {
      console.error("[TogetherTalkPage] endRoom REST API ?¤íŒ¨:", e);
    }

    // ?¹ì†Œì¼?ROOM_ENDED ë©”ì‹œì§€ë¥?ê¸°ë‹¤ë¦?(handleRoomEnded?ì„œ ëª¨ë“  ì°¸ì—¬?ê? ?™ì‹œ??/recording?¼ë¡œ ?´ë™)
  }, [isHost, resolvedRoomCode]);

  // ??handleDone: ?€?´ë¨¸ ì¢…ë£Œ ?œì—??REST API ?¸ì¶œ
  const handleDone = useCallback(async () => {
    // ?´ë? ë¡œì§?ì„œ participants ?€??ref ?¬ìš©
    const currentParticipants = participantsRef.current;
    const totalTurns = roomInfo.turnCount || roomInfo.turnCnt || 3;
    const isLastTurn = currentTurn >= totalTurns;

    if (isHost) {
      try {
        await endRoom(resolvedRoomCode);
        // console.log(
          "[TogetherTalkPage] endRoom REST API ?±ê³µ (?€?´ë¨¸ ì¢…ë£Œ) - ?¹ì†Œì¼?ë©”ì‹œì§€ ?€ê¸?ì¤?,
        );
      } catch (e) {
        console.error(
          "[TogetherTalkPage] endRoom REST API ?¤íŒ¨ (?€?´ë¨¸ ì¢…ë£Œ):",
          e,
        );
      }
    }

    await stopMediaProcessing();

    const navigateToRecording = () => {
      navigate("/recording", {
        replace: true,
        state: {
          mode: "together",
          roomInfo: {
            ...roomInfo,
            roomId: roomId,
            roomCode: resolvedRoomCode,
            turnCount: totalTurns,
            currentTurn: currentTurn, // ?„ì¬ ??ë²ˆí˜¸ ?„ë‹¬
            isHost: isHost,
            timeLimit: timeLimit,
          },
          participants: currentParticipants,
          myUserId,
        },
      });
    };

    // ??ë§ˆì?ë§????¬ë??€ ?ê??†ì´ ??ƒ ë¡œë”© ?”ë©´ ?œì‹œ
    setIsTransitioning(true);
    stopSTT(); // ë¡œë”© ?œì‘ ??STT ì¦‰ì‹œ ì¤‘ë‹¨
    setTimeout(() => {
      navigateToRecording();
    }, 5000);
  }, [
    doLeaveRoom,
    navigate,
    isHost,
    roomId,
    roomInfo,
    resolvedRoomCode,
    currentTurn,
    myUserId,
    stopMediaProcessing,
    stopSTT,
  ]);

  //?€?´ë¨¸ ì»´í¬?ŒíŠ¸ë¥?ê¸°ì–µ?˜ì—¬ ë¦¬ë Œ?”ë§ ë°©ì?
  const memoizedTimer = useMemo(() => {
    return (
      <TimerGauge
        durationMs={durationMs}
        isRunning={isRoomTimerRunning}
        onDone={handleDone}
      />
    );
  }, [isRoomTimerRunning, handleDone, durationMs]);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/together");
  }, [navigate]);

  // ?˜ìŠ¤??ì£¼ìš” ?íƒœ???„ì—???´ë? ? ì–¸??(WebSocket ?¸ë“¤?¬ë³´??ë¨¼ì? ?„ìš”)
  const [isCorrect, setIsCorrect] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const answerSubmittedRef = useRef(false); // ?µë? ?œì¶œ ?¬ë? ì¶”ì 
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(-1); // ?„ì¬ ?µë? ì¤‘ì¸ ì°¸ì—¬???¸ë±??
  const [speakerTimeLeft, setSpeakerTimeLeft] = useState(timeLimit); // ?„ì¬ ì°¸ì—¬?ì˜ ?¨ì? ?œê°„
  const pausedTimeRemainingRef = useRef(null); // ?˜ìŠ¤???œì‘ ???¨ì? ?œê°„ ?€??
  const recordingReadyRef = useRef(false); // ?¹ìŒ ì¤€ë¹??„ë£Œ ?¬ë?
  const timerInitializedRef = useRef(false); // ?€?´ë¨¸ ì´ˆê¸°???¬ë? (ì¤‘ë³µ ë°©ì?)
  const quizScheduledRef = useRef(false); // ?´ì¦ˆ ?¤ì?ì¤??¸ì¶œ ?¬ë? (ì¤‘ë³µ ë°©ì?)
  const quizResultTimeoutRef = useRef(null); // WebSocket ê²°ê³¼ ?€ê¸??€?„ì•„??

  const questRunning = questStep !== "idle";

  const endQuestAndResume = useCallback(async () => {
    // ?˜ìŠ¤??ì¢…ë£Œ ???¨ì? ?œê°„ë§Œí¼ ?€?´ë¨¸ ?¬ê°œ
    if (pausedTimeRemainingRef.current !== null) {
      const remainingTime = pausedTimeRemainingRef.current;
      const newStartTime = Date.now() - (durationMs - remainingTime);
      setTimerStartedAt(newStartTime);
      // console.log("[Quest] ?€?´ë¨¸ ?¬ê°œ - ?¨ì? ?œê°„:", remainingTime, "ms");
      pausedTimeRemainingRef.current = null;
    }

    setActiveQuest(null);
    setQuestStep("idle");
    setIsRoomTimerRunning(true);
    setCountdown(3);
    setQuizId(null);
    setQuizQuestion("AIê°€ ì§ˆë¬¸???ì„±?˜ê³  ?ˆìŠµ?ˆë‹¤...");
    setMyQuizResult(null); // ?´ì¦ˆ ê²°ê³¼ ì´ˆê¸°??
    setIsRecording(false);
    setRecordedAudio(null);
    setCurrentSpeakerIndex(-1);
    setSpeakerTimeLeft(timeLimit);
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    // ?˜ìŠ¤??ì¢…ë£Œ ???ë˜ ë§ˆì´???íƒœë¡?ë³µì›
    if (micStateBeforeQuest && !micOn) {
      setMicOn(true);
      sendMic(true);
      await startAudioAnalysis();
    } else if (!micStateBeforeQuest && micOn) {
      setMicOn(false);
      sendMic(false);
      await stopAudioAnalysis();
    }

    // ?•ì  ê°ì? ?¬ì‹œ??
    if (roomId && currentTurn) {
      try {
        await startSilenceMonitoring(roomId, currentTurn);
        // console.log("[Quest] ?•ì  ê°ì? ?¬ì‹œ??);
      } catch (e) {
        console.error("[Quest] ?•ì  ê°ì? ?¬ì‹œ???¤íŒ¨:", e);
      }
    }

    // STT??questStep??"idle"???˜ë©´ ê¸°ì¡´ useEffect?ì„œ ?ë™?¼ë¡œ ?¬ì‹œ?‘ë¨
    // console.log("[Quest] ?˜ìŠ¤??ì¢…ë£Œ - STT???ë™?¼ë¡œ ?¬ì‹œ?‘ë©?ˆë‹¤");
  }, [
    micStateBeforeQuest,
    micOn,
    sendMic,
    startAudioAnalysis,
    stopAudioAnalysis,
    roomId,
    currentTurn,
  ]);

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

  // ?˜ìŠ¤??1: ?¸íŠ¸ë¡??”ë©´ ?ë™ ì§„í–‰ (5ì´????¤ìŒ ?¨ê³„)
  useEffect(() => {
    if (questStep !== "q1intro" || activeQuest !== 1) return;

    // ?Œë¦¼ ?¬ìš´???¬ìƒ
    if (!isMuted) {
      try {
        const audio = new Audio(alertSound);
        audio.volume = getEffectiveVolume(0.15);
        audio.play().catch(() => {});
      } catch (e) {
        console.error("?Œë¦¼ ?¬ìš´???¬ìƒ ?¤íŒ¨:", e);
      }
    }

    const timer = setTimeout(() => {
      setQuestStep("q1ready");
      setCountdown(3);
    }, 5000);

    return () => clearTimeout(timer);
  }, [questStep, activeQuest, isMuted, getEffectiveVolume]);

  // ?˜ìŠ¤??1: ì¹´ìš´?¸ë‹¤???ë™ ì§„í–‰
  useEffect(() => {
    if (questStep !== "q1ready" || activeQuest !== 1) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // ì¤€ë¹??„ë£Œ ??ë°”ë¡œ ì²?ë²ˆì§¸ ì°¸ì—¬??ì°¨ë? ?œì‘
          setCurrentSpeakerIndex(0);
          setQuestStep("q1speaking");
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [questStep, activeQuest]);

  // ?˜ìŠ¤??1: ?ì–´ ë¬¸ì¥ ?œì‹œ ??3ì´????ë™?¼ë¡œ answering ?„í™˜
  useEffect(() => {
    if (questStep !== "q1showQuestion" || activeQuest !== 1) return;

    const timer = setTimeout(() => {
      setQuestStep("q1answering");
    }, 3000);

    return () => clearTimeout(timer);
  }, [questStep, activeQuest]);

  // ?˜ìŠ¤??2: ?¸íŠ¸ë¡??”ë©´ ?ë™ ì§„í–‰ (5ì´???ê²Œì„ ?œì‘)
  useEffect(() => {
    if (questStep !== "intro" || activeQuest !== 2) return;

    // ?Œë¦¼ ?¬ìš´???¬ìƒ
    if (!isMuted) {
      try {
        const audio = new Audio(alertSound);
        audio.volume = getEffectiveVolume(0.15);
        audio.play().catch(() => {});
      } catch (e) {
        console.error("?Œë¦¼ ?¬ìš´???¬ìƒ ?¤íŒ¨:", e);
      }
    }

    const timer = setTimeout(() => {
      setQuestStep("q2game");
    }, 5000);

    return () => clearTimeout(timer);
  }, [questStep, activeQuest, isMuted, getEffectiveVolume]);

  // ?Œë°œ ?˜ìŠ¤??ê²°ê³¼: 5ì´????ë™?¼ë¡œ ?˜ìŠ¤??ì¢…ë£Œ
  useEffect(() => {
    if (questStep !== "resultFail" && questStep !== "resultSuccess") return;

    // ?¤íŒ¨ ??game_fail ?¬ìš´???¬ìƒ
    if (questStep === "resultFail" && !isMuted) {
      try {
        const audio = new Audio(gameoverSound);
        audio.volume = getEffectiveVolume(0.15);
        audio.play().catch(() => {});
      } catch (e) {
        console.error("Game fail ?¬ìš´???¬ìƒ ?¤íŒ¨:", e);
      }
    }

    // ?±ê³µ ??game_success ?¬ìš´???¬ìƒ
    if (questStep === "resultSuccess" && !isMuted) {
      try {
        const audio = new Audio(gameSuccessSound);
        audio.volume = getEffectiveVolume(0.15);
        audio.play().catch(() => {});
      } catch (e) {
        console.error("Game success ?¬ìš´???¬ìƒ ?¤íŒ¨:", e);
      }
    }

    // console.log("[Quest] ê²°ê³¼ ?”ë©´ ?œì‹œ - 5ì´????ë™?¼ë¡œ ?€???¬ê°œ");
    const timer = setTimeout(() => {
      // console.log("[Quest] 5ì´?ê²½ê³¼ - ?˜ìŠ¤??ì¢…ë£Œ?˜ê³  ?€???¬ê°œ");
      endQuestAndResume();
    }, 5000);

    return () => clearTimeout(timer);
  }, [questStep, endQuestAndResume, isMuted, getEffectiveVolume]);

  // ?˜ìŠ¤??1: answering ?”ë©´ ?œì‹œ ??ì¦‰ì‹œ ì²?ë²ˆì§¸ ì°¸ì—¬??ì°¨ë? ?œì‘
  useEffect(() => {
    if (questStep !== "q1answering" || activeQuest !== 1) return;

    // ?µë? ?œì¶œ ?¬ë? ì´ˆê¸°??
    answerSubmittedRef.current = false;

    // ì¦‰ì‹œ ì²?ë²ˆì§¸ ì°¸ì—¬??ì°¨ë? ?œì‘
    setCurrentSpeakerIndex(0);
    setQuestStep("q1speaking");
  }, [questStep, activeQuest]);

  // ?˜ìŠ¤??1: ê°?ì°¸ì—¬??ì°¨ë??ì„œ ë§ˆì´???ë™ ?œì–´ ë°??¹ìŒ ?œì‘
  useEffect(() => {
    // console.log("[Quest] useEffect ?¤í–‰:", { questStep, currentSpeakerIndex });

    if (questStep !== "q1speaking" || currentSpeakerIndex < 0) {
      // ?˜ìŠ¤?¸ê? ?ë‚¬ê±°ë‚˜ speaking ?¨ê³„ê°€ ?„ë‹ˆë©??¹ìŒ ì¤‘ì?
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        // console.log("[Quest] ?›‘ ?˜ìŠ¤??ì¢…ë£Œ - MediaRecorder ì¤‘ì?");
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
      return;
    }

    const myIndex = participants.findIndex((p) => p.isMe === true);
    const isMyTurn = myIndex === currentSpeakerIndex;

    // console.log("[Quest] ì°¨ë? ?•ì¸:", {
      myIndex,
      currentSpeakerIndex,
      isMyTurn,
    });

    const controlMic = async () => {
      // ?´ë? ?¹ìŒ ì¤‘ì´ë©??„ë¬´ê²ƒë„ ?˜ì? ?ŠìŒ (ì¤‘ë³µ ë°©ì? - ìµœìš°??ì²´í¬)
      if (mediaRecorderRef.current?.state === "recording") {
        // console.log("[Quest] ? ï¸ ?´ë? ?¹ìŒ ì¤?- ?¬ì‹œ?‘í•˜ì§€ ?ŠìŒ");
        return;
      }

      if (isMyTurn) {
        // console.log("[Quest] ??ì°¨ë? - ?¹ìŒ ì¤€ë¹?);

        // ??ì°¨ë?: ë§ˆì´??ì¼œê¸°
        if (!micOn) {
          setMicOn(true);
          sendMic(true);
          await startAudioAnalysis();
        }

        // ?¹ìŒ ?œì‘
        // console.log("[Quest] ?¹ìŒ ?œì‘ ?œë„...");
        try {
          let stream;

          // OpenVidu publisher??ê¸°ì¡´ ?¤íŠ¸ë¦??¬ì‚¬???œë„
          if (publisher && publisher.stream) {
            const openviduStream = publisher.stream.getMediaStream();
            // ?¤íŠ¸ë¦¼ì´ ?œì„±?”ë˜???ˆëŠ”ì§€ ?•ì¸
            if (openviduStream && openviduStream.active) {
              stream = openviduStream;
              // console.log("[Quest] ??OpenVidu ?¤íŠ¸ë¦??¬ì‚¬??", stream);
            } else {
              console.warn(
                "[Quest] ? ï¸ OpenVidu ?¤íŠ¸ë¦¼ì´ ë¹„í™œ?±í™”??(active: false). getUserMediaë¡??´ë°±",
              );
              stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                },
              });
              // console.log("[Quest] ????ë§ˆì´???¤íŠ¸ë¦??ë“:", stream);
            }
          } else {
            // OpenVidu ?¤íŠ¸ë¦¼ì´ ?†ìœ¼ë©??ˆë¡œ getUserMedia ?¸ì¶œ
            console.warn(
              "[Quest] ? ï¸ OpenVidu publisher ?¤íŠ¸ë¦¼ì´ ?†ìŠµ?ˆë‹¤. getUserMediaë¡??´ë°±",
            );
            stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
            });
            // console.log("[Quest] ????ë§ˆì´???¤íŠ¸ë¦??ë“:", stream);
          }

          // ???¤ë””???¸ë™ ?íƒœ ?•ì¸
          const audioTracks = stream.getAudioTracks();
          // console.log("[Quest] ?¤ ?¤ë””???¸ë™ ?íƒœ:", {
            tracksCount: audioTracks.length,
            trackInfo: audioTracks.map((t) => ({
              enabled: t.enabled,
              muted: t.muted,
              readyState: t.readyState,
              label: t.label,
              settings: t.getSettings?.(),
            })),
          });

          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: "audio/webm",
            audioBitsPerSecond: 64000, // 64kbps - ?Œì„± ?¸ì‹??ì¶©ë¶„?˜ë©´???Œì¼ ?¬ê¸° ê°ì†Œ
          });
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
              // console.log(
                `[Quest] ?“¦ ì²?¬ ?˜ì‹ : ${event.data.size} bytes (?„ì  ì²?¬: ${audioChunksRef.current.length})`,
              );
            } else {
              console.warn("[Quest] ? ï¸ ë¹?ì²?¬ ?˜ì‹  (0 bytes)");
            }
          };

          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, {
              type: "audio/webm",
            });
            // console.log(
              "[Quest] ?¹ï¸ ?¹ìŒ ì¤‘ì? - ì´?ì²?¬:",
              audioChunksRef.current.length,
              "ì´??¬ê¸°:",
              audioBlob.size,
              "bytes",
            );
            setRecordedAudio(audioBlob);
            stream.getTracks().forEach((track) => track.stop());
          };

          mediaRecorder.onerror = (error) => {
            console.error("[Quest] ??MediaRecorder ?¤ë¥˜:", error);
          };

          // 1ì´ˆë§ˆ???°ì´???˜ì§‘ (timeslice) - ?´ê²Œ ?†ìœ¼ë©?stop???Œê¹Œì§€ ?°ì´?°ê? ???˜ì˜¬ ???ˆìŒ
          mediaRecorder.start(1000);
          setIsRecording(true);
          // console.log(
            "[Quest] ?™ï¸??¹ìŒ ?œì‘ ?„ë£Œ (state:",
            mediaRecorder.state,
            ") - 1ì´ˆë§ˆ???°ì´???˜ì§‘",
          );

          // ?¹ìŒ ì¤€ë¹??„ë£Œ ?Œë˜ê·??¤ì • - ?´ì œ ?€?´ë¨¸ ?œì‘ ê°€??
          recordingReadyRef.current = true;

          // ?€?´ë¨¸ë¥???ë²ˆë§Œ ë¦¬ì…‹ (ì¤‘ë³µ ë¦¬ì…‹ ë°©ì?)
          if (!timerInitializedRef.current) {
            setSpeakerTimeLeft(15); // ?´ì¦ˆ ?µë??€ 15ì´ˆë¡œ ê³ ì • (?Œì¼ ?¬ê¸° ?œí•œ)
            timerInitializedRef.current = true;
            // console.log("[Quest] ???¹ìŒ ì¤€ë¹??„ë£Œ - 15ì´??€?´ë¨¸ ?œì‘");
          }
        } catch (error) {
          console.error("[Quest] ?¹ìŒ ?œì‘ ?¤íŒ¨:", error);
        }
      } else {
        // ?¤ë¥¸ ?¬ëŒ ì°¨ë?: ë§ˆì´???„ê¸°
        if (micOn) {
          setMicOn(false);
          sendMic(false);
          await stopAudioAnalysis();
        }
      }
    };

    controlMic();

    // Cleanup: ì»´í¬?ŒíŠ¸ ?¸ë§ˆ?´íŠ¸ ?ëŠ” questStep ë³€ê²???MediaRecorder ì¤‘ì?
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        // console.log("[Quest] ?§¹ Cleanup - MediaRecorder ì¤‘ì?");
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questStep, currentSpeakerIndex]);

  // 3ë²ˆì§¸ ???œì‘ ???´ì¦ˆ ?¤ì?ì¤?(ë°±ì—”?œì—???„ì¬ ì£¼ì œ ê¸°ë°˜ AI ì§ˆë¬¸ ?ì„± ??15-40ì´???WebSocket?¼ë¡œ ?„ì†¡)
  useEffect(() => {
    if (currentTurn !== 3) return;
    if (questRunning || activeQuest !== null) return;
    if (!roomId) {
      console.warn("[Quiz] ? ï¸ roomIdê°€ ?†ì–´???´ì¦ˆ ?¤ì?ì¤„ì„ ê±´ë„ˆ?ë‹ˆ??");
      return;
    }

    // ?´ë? ?´ì¦ˆê°€ ?¤ì?ì¤„ë˜?ˆìœ¼ë©?ì¤‘ë³µ ?¸ì¶œ ë°©ì?
    if (quizScheduledRef.current) {
      // console.log("[Quiz] ? ï¸ ?´ì¦ˆê°€ ?´ë? ?¤ì?ì¤„ë˜?ˆìŠµ?ˆë‹¤. ì¤‘ë³µ ?¸ì¶œ ë°©ì?");
      return;
    }

    const scheduleRandomQuiz = async () => {
      try {
        // console.log("[Quiz] ?¯ 3ë²ˆì§¸ ???œì‘ - AI ?´ì¦ˆ ?¤ì?ì¤??”ì²­:", {
          roomId,
          currentTurn,
          participantCount: participants.length,
          currentTopic: topic, // ?„ì¬ ?€??ì£¼ì œ
        });

        // ?Œë˜ê·??¤ì • (ì¤‘ë³µ ë°©ì?)
        quizScheduledRef.current = true;

        const response = await scheduleQuiz(
          roomId,
          currentTurn,
          participants.length,
        );
        // console.log(
          "[Quiz] ???´ì¦ˆ ?¤ì?ì¤??„ë£Œ - ë°±ì—”?œì—??AI ì§ˆë¬¸ ?ì„± ì¤? 15-40ì´???WebSocket?¼ë¡œ ?˜ì‹  ?ˆì •:",
          response,
        );
      } catch (error) {
        console.error("[Quiz] ???´ì¦ˆ ?¤ì?ì¤??¤íŒ¨:", error);
        // ?¤íŒ¨ ???Œë˜ê·?ë¦¬ì…‹ (?¬ì‹œ??ê°€?¥í•˜?„ë¡)
        quizScheduledRef.current = false;
      }
    };

    // scheduleRandomQuiz();
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

  // ?˜ìŠ¤??1: ?¹ìŒ ?œì‘
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
        audioBitsPerSecond: 64000, // 64kbps - ?Œì„± ?¸ì‹??ì¶©ë¶„?˜ë©´???Œì¼ ?¬ê¸° ê°ì†Œ
      });
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
      // console.log("[Quiz] ?¹ìŒ ?œì‘");
    } catch (error) {
      console.error("[Quiz] ?¹ìŒ ?œì‘ ?¤íŒ¨:", error);
      alert("ë§ˆì´???‘ê·¼ ê¶Œí•œ???„ìš”?©ë‹ˆ??");
    }
  }, []);

  // ?˜ìŠ¤??1: ?¹ìŒ ì¤‘ì?
  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // console.log("[Quiz] ?¹ìŒ ì¤‘ì?");
    }
  }, []);

  // ê°?ì°¸ì—¬??ì°¨ë???15ì´??€?´ë¨¸ (?¹ìŒ ì¤€ë¹??„ë£Œ ???œì‘)
  useEffect(() => {
    if (questStep !== "q1speaking" || currentSpeakerIndex < 0) {
      recordingReadyRef.current = false; // ?˜ìŠ¤??ì¢…ë£Œ ???Œë˜ê·?ë¦¬ì…‹
      timerInitializedRef.current = false; // ?€?´ë¨¸ ì´ˆê¸°???Œë˜ê·?ë¦¬ì…‹
      return;
    }

    const currentParticipants = participantsRef.current;
    if (currentSpeakerIndex >= currentParticipants.length) return;

    // ?ˆë¡œ??ì°¸ì—¬??ì°¨ë? ?œì‘ ???€?´ë¨¸ ì´ˆê¸°???Œë˜ê·?ë¦¬ì…‹
    timerInitializedRef.current = false;

    const myIndex = currentParticipants.findIndex((p) => p.isMe === true);
    const isMyTurn = myIndex === currentSpeakerIndex;

    // ??ì°¨ë?ê°€ ?„ë‹ˆë©?ë°”ë¡œ ?€?´ë¨¸ ?œì‘
    if (!isMyTurn) {
      // console.log(`[?€?´ë¨¸] ?¤ë¥¸ ì°¸ì—¬??ì°¨ë? - ì¦‰ì‹œ ?€?´ë¨¸ ?œì‘`);
      setSpeakerTimeLeft(timeLimit);
      recordingReadyRef.current = true; // ?¤ë¥¸ ?¬ëŒ ì°¨ë????¹ìŒ ë¶ˆí•„??
    } else {
      // console.log(`[?€?´ë¨¸] ??ì°¨ë? - ?¹ìŒ ì¤€ë¹??€ê¸?ì¤?..`);
    }

    // ?¹ìŒ ì¤€ë¹??„ë£Œ ?€ê¸????€?´ë¨¸ ?œì‘
    const checkRecordingReady = setInterval(() => {
      if (recordingReadyRef.current) {
        clearInterval(checkRecordingReady);
        // console.log(
          `[?€?´ë¨¸] ${currentParticipants[currentSpeakerIndex]?.name}??ì°¨ë? - ?¹ìŒ ì¤€ë¹??„ë£Œ, 15ì´?ì¹´ìš´?¸ë‹¤???œì‘`,
        );
      }
    }, 100);

    const timer = setInterval(() => {
      setSpeakerTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);

          // 15ì´?ì¢…ë£Œ - ?„ì¬ ì°¸ì—¬?ì˜ ?¹ìŒ ì¤‘ì? ë°??œì¶œ
          const latestParticipants = participantsRef.current;
          const myIndex = latestParticipants.findIndex((p) => p.isMe === true);
          const isMyTurn = myIndex === currentSpeakerIndex;

          if (isMyTurn) {
            // ??ì°¨ë??€?¼ë©´ ?¹ìŒ ì¤‘ì? ë°??œì¶œ
            if (
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state !== "inactive"
            ) {
              // console.log(
                "[Quest] ?¹ìŒ ì¤‘ì? ?œì‘ - ?„ì¬ ?íƒœ:",
                mediaRecorderRef.current.state,
              );
              mediaRecorderRef.current.stop();
              setIsRecording(false);
              // console.log("[Quest] ?¹ìŒ ì¤‘ì? ?„ë£Œ");

              // ?¹ìŒ ?°ì´?°ë¡œ Blob ?ì„± ë°??œì¶œ
              setTimeout(async () => {
                const audioBlob = new Blob(audioChunksRef.current, {
                  type: "audio/webm",
                });

                // console.log("[Quest] Blob ?ì„±:", {
                  size: audioBlob.size,
                  type: audioBlob.type,
                  chunksCount: audioChunksRef.current.length,
                  hasQuizId: !!quizId,
                });

                // quizIdê°€ ?ˆìœ¼ë©??¹ìŒ???¤ë””???œì¶œ (?¬ê¸° ?œí•œ ?†ìŒ)
                if (quizId) {
                  const currentUser = latestParticipants[currentSpeakerIndex];
                  const userId = currentUser?.userId || currentUser?.id;

                  // console.log("[Quest] ?µë? ?œì¶œ ì¤€ë¹?", {
                    quizId,
                    userId,
                    currentUser,
                    currentSpeakerIndex,
                    blobSize: audioBlob.size,
                    participantsLength: latestParticipants.length,
                  });

                  if (!userId) {
                    console.error("[Quest] ??userIdê°€ ?†ìŠµ?ˆë‹¤. ?œì¶œ ë¶ˆê?");
                    answerSubmittedRef.current = false;
                    return;
                  }

                  try {
                    // WebM ??WAV ë³€??(STT ?•í™•???¥ìƒ)
                    // console.log("[Quest] ?”„ WebM ??WAV ë³€???œì‘...");
                    const wavBlob = await convertWebMToWav(audioBlob);
                    // console.log("[Quest] ??WAV ë³€???„ë£Œ:", {
                      originalSize: audioBlob.size,
                      wavSize: wavBlob.size,
                      format: "16kHz, mono, 16-bit PCM",
                    });

                    // ???´ë¼?´ì–¸??ì¸?ê²€ì¦? ?¹ìŒ???ˆë¬´ ì§§ê±°??ì¹¨ë¬µë§??ˆìœ¼ë©?ë°”ë¡œ ?¤íŒ¨ ì²˜ë¦¬
                    const MIN_AUDIO_SIZE = 100000; // 100KB (WAV ê¸°ì?)
                    const MIN_CHUNKS = 5; // ìµœì†Œ ì²?¬ ê°œìˆ˜

                    if (
                      wavBlob.size < MIN_AUDIO_SIZE ||
                      audioChunksRef.current.length < MIN_CHUNKS
                    ) {
                      console.warn(
                        "[Quest] ???¹ìŒ ?¬ê¸°/ì²?¬ ë¶€ì¡?- ?µë? ?†ìŒ?¼ë¡œ ?ë‹¨:",
                        {
                          wavSize: wavBlob.size,
                          minSize: MIN_AUDIO_SIZE,
                          chunks: audioChunksRef.current.length,
                          minChunks: MIN_CHUNKS,
                        },
                      );
                      answerSubmittedRef.current = false;
                      setQuestStep("resultFail");
                      setCurrentSpeakerIndex(-1);
                      return;
                    }

                    // ?¤ì œ ?¹ìŒ???Œì„±??ë°±ì—”?œë¡œ ?„ì†¡ (ë°±ì—”?œê? STT ì²˜ë¦¬)
                    // console.log("[Quest] API ?¸ì¶œ ì§ì „:", {
                      quizId,
                      userId,
                      audioBlobSize: wavBlob.size,
                      audioBlobType: wavBlob.type,
                    });

                    // ?œì¶œ ?œì‘ ?œì ???Œë˜ê·??¤ì • (timeout ì²´í¬ë³´ë‹¤ ë¨¼ì?)
                    answerSubmittedRef.current = true;

                    // ???€ê¸??”ë©´?¼ë¡œ ì¦‰ì‹œ ?„í™˜ + ?€?„ì•„???¤ì • (API ?¸ì¶œ ?„ì—!)
                    setQuestStep("waitingResult");
                    setCurrentSpeakerIndex(-1);

                    // ??WebSocket ê²°ê³¼ ?€ê¸??€?„ì•„???¤ì • (10ì´? - API ?¸ì¶œ ?„ì— ?¤ì •!
                    quizResultTimeoutRef.current = setTimeout(() => {
                      console.warn(
                        "[Quest] ?±ï¸ ?‰ê? ê²°ê³¼ ?€?„ì•„??(10ì´?ì´ˆê³¼) - ?¤íŒ¨ ì²˜ë¦¬",
                      );
                      setQuestStep("resultFail");
                    }, 10000);

                    await submitQuizAnswer(quizId, userId, wavBlob);
                    // console.log(
                      "[Quest] ???µë? ?œì¶œ ?„ë£Œ - ë°±ì—”?œê? ?Œì„± ?‰ê? ì¤? WebSocket?¼ë¡œ ê²°ê³¼ ?˜ì‹  ?€ê¸?,
                    );
                  } catch (error) {
                    // ?œì¶œ ?¤íŒ¨ ??ì¦‰ì‹œ ?¤íŒ¨ ?”ë©´ ?œì‹œ
                    console.warn("[Quest] ?µë? ?œì¶œ ?¤íŒ¨:", error.message);
                    answerSubmittedRef.current = false;
                    setQuestStep("resultFail");
                    setCurrentSpeakerIndex(-1);
                    return; // ???´ìƒ ì§„í–‰?˜ì? ?ŠìŒ
                  }
                } else {
                  // console.log("[Quest] quizId ?†ìŒ - ?œì¶œ ë¶ˆê?");
                  answerSubmittedRef.current = false;
                }
              }, 100);
            } else {
              // ?¹ìŒ???œì‘?˜ì? ?Šì•˜ê±°ë‚˜ ?´ë? ì¤‘ì???ê²½ìš°
              // console.log("[Quest] ?¹ìŒ ?†ìŒ - ?µë? ë¯¸ì œì¶œë¡œ ì²˜ë¦¬");
              answerSubmittedRef.current = false;
            }
          }

          // ?¤ìŒ ì°¸ì—¬?ë¡œ ?ë™ ?„í™˜
          const nextIndex = currentSpeakerIndex + 1;
          if (nextIndex < latestParticipants.length) {
            // console.log(
              `[?€?´ë¨¸] ?œê°„ ì¢…ë£Œ - ?¤ìŒ ì°¸ì—¬?? ${latestParticipants[nextIndex]?.name}`,
            );
            setCurrentSpeakerIndex(nextIndex);
          } else {
            // ëª¨ë“  ì°¸ì—¬???„ë£Œ - 2ì´???ê²°ê³¼ ?•ì¸ (?œì¶œ ?¤íŒ¨ ì²´í¬??
            // console.log("[?€?´ë¨¸] ëª¨ë“  ì°¸ì—¬???„ë£Œ - ?µë? ?íƒœ ?•ì¸ ì¤?..");
            setTimeout(() => {
              // ?´ë? ê²°ê³¼ ?€ê¸?ì¤‘ì´ê±°ë‚˜ ê²°ê³¼ ?”ë©´?´ë©´ ì²´í¬ ê±´ë„ˆ?°ê¸°
              setQuestStep((currentStep) => {
                if (
                  currentStep === "waitingResult" ||
                  currentStep === "resultSuccess" ||
                  currentStep === "resultFail"
                ) {
                  // console.log("[?€?´ë¨¸] ?´ë? ê²°ê³¼ ì²˜ë¦¬ ì¤?- ì²´í¬ ê±´ë„ˆ?°ê¸°");
                  return currentStep;
                }

                const hasAnswer = answerSubmittedRef.current;
                // console.log("[?€?´ë¨¸] ?µë? ?œì¶œ ?¬ë?:", hasAnswer);

                if (!hasAnswer) {
                  // console.log("[?€?´ë¨¸] ???µë? ë¯¸ì œì¶?- ?¤íŒ¨ ?”ë©´ ?œì‹œ");
                  return "resultFail";
                } else {
                  // console.log(
                    "[?€?´ë¨¸] ???µë? ?œì¶œ??- WebSocket ê²°ê³¼ ?€ê¸?ì¤?,
                  );
                  return "waitingResult";
                }
              });
            }, 2000); // WAV ë³€??+ API ?œì¶œ ?œê°„ ê³ ë ¤
            setCurrentSpeakerIndex(-1);
          }
          return timeLimit;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(checkRecordingReady);
    };
  }, [questStep, currentSpeakerIndex, quizId]);

  // ?´ì¦ˆ ?µë? ?œì¶œ (ê°?ì°¸ì—¬?ê? 15ì´?ì°¨ë? ???ë™ ?œì¶œ)
  const submitParticipantAnswer = useCallback(
    async (audioBlob, participantUserId) => {
      if (!audioBlob || !quizId) {
        console.warn("[Quiz] ?µë? ?œì¶œ ë¶ˆê? - ?¹ìŒ ?°ì´???ëŠ” quizId ?†ìŒ");
        return;
      }

      // ?µë???ì¶©ë¶„???¹ìŒ?˜ì—ˆ???Œë§Œ ?œì¶œ (ìµœì†Œ 1KB ?´ìƒ)
      if (audioBlob.size < 1000) {
        // console.log("[Quiz] ?µë? ?†ìŒ - ?œì¶œ ê±´ë„ˆ?°ê¸°");
        return;
      }

      try {
        // console.log("[Quiz] ?µë? ?œì¶œ ?œë„:", {
          quizId,
          userId: participantUserId,
        });

        // TODO: ?Œì„±???ìŠ¤?¸ë¡œ ë³€?˜í•˜???ì–´ STT êµ¬í˜„ ?„ìš”
        // ?„ì‹œë¡??ŒìŠ¤???µë? ?„ì†¡
        const answerText =
          "My favorite hobby is playing guitar because it helps me express my feelings.";

        const response = await submitQuizAnswer(
          quizId,
          participantUserId,
          answerText,
        );
        // console.log(
          "[Quiz] ?µë? ?œì¶œ ?„ë£Œ - WebSocket?¼ë¡œ ê²°ê³¼ ?˜ì‹  ?€ê¸?ì¤?",
          response,
        );
      } catch (error) {
        // ?œì¶œ ?¤íŒ¨ ??ì¦‰ì‹œ ?¤íŒ¨ ?”ë©´ ?œì‹œ
        console.warn(
          "[Quiz] ?µë? ?œì¶œ ?¤íŒ¨ (401) - ì¦‰ì‹œ ?¤íŒ¨ ?”ë©´ ?œì‹œ:",
          error.message,
        );
        answerSubmittedRef.current = false;
        setQuestStep("resultFail");
        setCurrentSpeakerIndex(-1);
      }
    },
    [quizId],
  );

  // ?˜ìŠ¤??1: ê°?ì°¸ì—¬??ì°¨ë??ì„œ 15ì´??¹ìŒ ë°??ë™ ?œì¶œ
  // (q1speaking ?¨ê³„?ì„œ speakerTimeLeft ?€?´ë¨¸ê°€ 0???˜ë©´ ?¤ìŒ ì°¸ì—¬?ë¡œ ?ë™ ?„í™˜)
  // ?¤ì œ ?¹ìŒ/?œì¶œ ë¡œì§?€ speakerTimeLeft useEffect?ì„œ ì²˜ë¦¬??

  const handleSubmitQuest2 = useCallback(() => {
    const correct = Math.random() > 0.5;
    setIsCorrect(correct);
    setQuestStep(correct ? "resultSuccess" : "resultFail");
  }, []);

  /* STT ì½”ë“œ ?ë‹¨ ?´ë™??*/

  // ?˜ìŠ¤???ìŠ¤??
  const quest1IntroTitle = "?Œë°œ ?˜ìŠ¤??!";
  const quest1IntroBody = "?ì–´ë¡œë§Œ ?µí•´????!\nëª¨ë‘ ?‘ë™?´ì„œ ?ìˆ˜ë¥??»ì–´ë´?;
  const quest1ReadyText = "?¤ë“¤ ì¤€ë¹„ëŠ” ?ë‚˜?";
  const quest1English = quizQuestion;

  const quest2IntroTitle = "?Œë°œ ?˜ìŠ¤??!";
  const quest2IntroBody = "ë¹ˆì¹¸??ì±„ì›Œë´?";
  const quest2IntroSub = "ê°€??ë¹ ë¥¸ ?¬ëŒ?ê²Œ ?ìˆ˜ë¥?ì¤?ê±°ì•¼!";

  const isSuccess = questStep === "resultSuccess";
  const failText = "?„ì‰½ê²Œë„ ?•ë‹µ??ë§íˆì§€ ëª»í–ˆêµ?n?¤ìŒ ë²?ê¸°íšŒë¥??¸ë ¤ë´?";
  const successText = "?€?¨í•´!! ?´ê? ?ìˆ˜ë¥?ì¤„ê²Œ!!";

  const resultBubbleText = isSuccess ? successText : failText;
  const resultDuckSrc = isSuccess ? duckHappyImg : duckSadImg;

  // ?¤ë²„?ˆì´ ?œì‹œ ì¡°ê±´
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
        {/* ?‘‡ ?Œë¦¬ ?¬ìƒ??ì»´í¬?ŒíŠ¸ ì¶”ê? */}
        {subscribers.map((sub) => (
          <div
            key={sub.stream.connection.connectionId}
            style={{ display: "none" }}
          >
            <UserAudioComponent streamManager={sub} />
          </div>
        ))}
        <ExitGuard />

        <AppHeader
          userName="user"
          notifications={[]}
          logoExitMessage="ë©”ì¸ ?”ë©´?¼ë¡œ ?˜ê??œê² ?µë‹ˆê¹?"
          onLogoExit={doLeaveRoom}
          disableProfileClick={isConnected}
        />

        <div className={styles.Content}>
          <div className={styles.HeaderRow}>
            <div className={styles.TopicRow}>
              <img className={styles.SmallDuck} src={duckImg} alt="?¤ë¦¬" />
              <div className={styles.TopicBubble}>
                ?€??ì£¼ì œ??<span className={styles.TopicHighlight}>{topic}</span>?…ë‹ˆ??
              </div>
            </div>

            <div className={styles.TimerCol}>
              <TimerGauge
                durationMs={durationMs}
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
              {/* ê°?ì°¸ì—¬???µë? ì°¨ë? */}
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
                          ? `${participants[currentSpeakerIndex]?.name}?˜ì˜ ì°¨ë??…ë‹ˆ??
                          : "ëª¨ë“  ì°¸ì—¬???µë? ?„ë£Œ"}
                      </div>
                      {/* 15ì´?ë¯¸ë‹ˆ ?€?´ë¨¸ */}
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: "700",
                          color: speakerTimeLeft <= 3 ? "#ef4444" : "#10b981",
                        }}
                      >
                        {speakerTimeLeft}ì´?
                      </div>
                    </div>
                  </div>
                )}

              <section
                className={styles.CardsGrid}
                aria-label="ì°¸ì—¬???ìƒ ?ì—­"
              >
                {slots.map((slot) => {
                  if (slot.kind === "empty") {
                    return (
                      <div
                        key={slot.id}
                        className={`${styles.VideoCard} ${styles.VideoCardEmpty}`}
                      >
                        <div className={styles.EmptyText}>ë¹??ë¦¬</div>
                      </div>
                    );
                  }

                  const p = slot.p;
                  const isMe = p.isMe === true;
                  const participantMicOn = isMe ? micOn : (p.micOn ?? true);
                  const participantVoiceLevel = isMe
                    ? voiceLevel
                    : (p.voiceLevel ?? 0);
                  // ë§ˆì´?¬ê? êº¼ì ¸?ˆìœ¼ë©?ë¬´ì¡°ê±?speaking ?¨ê³¼ ?œê±°
                  const participantSpeaking =
                    participantMicOn &&
                    (isMe ? isSpeaking : (p.isSpeaking ?? false));

                  // ?„ë¡œ??ì»¤ìŠ¤?°ë§ˆ?´ì§• ?•ë³´ ?Œì‹±
                  const profileInfo = getDuckProfileInfo(p.duckCustomJson);
                  const nicknameStyleInfo = getNicknameStyle(
                    p.avatarCustomJson,
                  );

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
                            alt={`${p.name} ?„ë°”?€`}
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
                          {isMe && <span className={styles.MeTag}>(??</span>}
                          <img
                            className={styles.MicMini}
                            src={participantMicOn ? micOffIcon : micOnIcon}
                            alt={
                              participantMicOn ? "ë§ˆì´??ì¼œì§" : "ë§ˆì´??êº¼ì§"
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
                  {micOn ? "ë§ˆì´???„ê¸°" : "ë§ˆì´??ì¼œê¸°"}
                </button>

                {/* ??ì¢…ë£Œ ë²„íŠ¼?€ ë°©ì¥?ê²Œë§??œì‹œ */}
                {isHost && (
                  <button
                    type="button"
                    className={styles.SecondaryButton}
                    onClick={handleEnd}
                  >
                    ??ì¢…ë£Œ
                  </button>
                )}
              </div>
            </div>

            <aside className={styles.RightStage} aria-label="AI ?„ìš°ë¯?>
              <div className={styles.AiBubble}>
                <div className={styles.AiHeader}>
                  <span className={styles.AiDot} aria-hidden="true" />
                  <span className={styles.AiTitle}>AI ?”ê¸°</span>
                  <span className={styles.AiDot} aria-hidden="true" />
                </div>

                {/* ?‰ê? ?€ê¸?ì¤‘ì¼ ??ë¡œë”© ?œì‹œ */}
                {showWaitingResult ? (
                  <>
                    <div className={styles.AiLoadingContainer}>
                      <div className={styles.AiLoadingSpinner} />
                      <span>?µë????‰ê??˜ê³  ?ˆì–´??/span>
                    </div>
                  </>
                ) : (
                  <>
                    {!aiSuggestion && (
                      <div className={styles.AiFace} aria-hidden="true">
                        ?™‚
                      </div>
                    )}

                    <div
                      className={`${styles.AiMainText} ${aiSuggestion ? styles.AiMainTextLarge : ""}`}
                    >
                      {aiSuggestion || "?œêµ­?´ë¡œ ?¸í•˜ê²??€?”í•´ë³´ì„¸??"}
                    </div>
                    {!aiSuggestion && (
                      <div className={styles.AiSubText}>
                        ì¹¨ë¬µ??ì§€?ë˜ë©??œê? ?„ì??œë¦´ê²Œìš”.
                      </div>
                    )}
                  </>
                )}

                <div className={styles.AiPointer} aria-hidden="true" />
              </div>

              <img
                className={styles.BigDuck}
                src={aiDuckbotImgSrc}
                alt="AI ?¤ë¦¬"
              />
            </aside>
          </div>
        </div>

        {/* ?˜ìŠ¤??1: ?¸íŠ¸ë¡?*/}
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

        {/* ?˜ìŠ¤??1: ì¤€ë¹?+ ì¹´ìš´?¸ë‹¤??*/}
        <UnexpectedQuestOverlay
          open={showQuest1Ready}
          onClose={handleOverlayClickNext}
          duckSrc={duckBombImg}
          bubbleText={quest1ReadyText}
          subText={null}
          subTone="normal"
          countdownNumber={countdown}
          speechBubbleType={3}
          textSize="large"
          clickAnywhere={false}
          showCloseButton={false}
          escToClose={false}
        />

        {/* ?˜ìŠ¤??1: ?ì–´ ë¬¸ì¥ ?œì‹œ */}
        <UnexpectedQuestOverlay
          open={showQuest1ShowQuestion}
          onClose={handleOverlayClickNext}
          duckSrc={duckBombImg}
          bubbleText={quest1English}
          subText="?ì–´ë¡œë§Œ ?µí•´????!!"
          subTone="danger"
          countdownNumber={undefined}
          speechBubbleType={2}
          clickAnywhere={false}
          showCloseButton={false}
          escToClose={false}
        />

        {/* ?˜ìŠ¤??2: ?¸íŠ¸ë¡?*/}
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

        {/* ?˜ìŠ¤??2: ê²Œì„ ?”ë©´ */}
        <UnexpectedQuestFillBlankModal
          open={showQuest2Game}
          duckSrc={duckBombImg}
          onSubmit={handleSubmitQuest2}
          participants={participants}
        />

        {/* ?‰ê? ?€ê¸?ì¤?*/}
        {showWaitingResult && (
          <div className={styles.WaitingResultOverlay}>
            <div className={styles.WaitingResultContent}>
              <div className={styles.WaitingResultSpinner} />
              <div className={styles.WaitingResultText}>
                ?µë????‰ê??˜ê³  ?ˆì–´??
              </div>
              <div className={styles.WaitingResultSubText}>
                ? ì‹œë§?ê¸°ë‹¤??ì£¼ì„¸??
              </div>
            </div>
          </div>
        )}

        {/* ê²°ê³¼ - 5ì´????ë™ ë³µê? */}
        <UnexpectedQuestOverlay
          open={showResultOverlay}
          onClose={() => {}}
          duckSrc={resultDuckSrc}
          bubbleText={resultBubbleText}
          bubbleTitle={null}
          subText={null}
          subTone="normal"
          countdownNumber={undefined}
          speechBubbleType={3}
          textSize="small"
          clickAnywhere={false}
          showCloseButton={false}
          escToClose={false}
        />

        {isTransitioning && (
          <LoadingOverlay
            title="?™ìŠµ ?¨ê³„ë¡??´ë™?©ë‹ˆ??"
            subtitle="?ë„???™ìŠµ???œì‘?´ë³¼ê¹Œìš”?"
            note="?™ìŠµ ì§‘ì¤‘???„í•´ ë§ˆì´?¬ê? ?¼ì‹œ?ìœ¼ë¡??Œì†Œê±°ë©?ˆë‹¤."
            image={duckTogether}
          />
        )}
      </div>
    </div>
  );
}

// ?‘‡ ?Œë¦¬ ?¬ìƒ??ì»´í¬?ŒíŠ¸
const UserAudioComponent = ({ streamManager }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (streamManager && audioRef.current) {
      streamManager.addVideoElement(audioRef.current);
    }
  }, [streamManager]);

  return <audio autoPlay ref={audioRef} />;
};
