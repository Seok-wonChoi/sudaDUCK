import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "@/api/api";
import { useOpenVidu } from "@/context/OpenViduContext"; // ?‘ˆ OpenVidu Hook ì¶”ê?
import Recordinglayout from "@/components/features/recording/layout/RecordingLayout";
import styles from "./RecordingPage.module.css";
import {
  saveAssessment,
  toggleScriptLike,
  getTurnScripts,
  getTurnResults,
} from "@/api/shadowing";
import { leaveRoom, getRoomLobby, toggleReady, startRoom } from "@/api/rooms";
import useRoomWebSocket from "@/hooks/useRoomWebSocket";
import useMicAnalyzer from "@/hooks/useMicAnalyzer"; // ?‘ˆ ì¶”ê?
import LoadingOverlay from "@/components/common/LoadingOverlay/LoadingOverlay";
import duckTogether from "@/assets/images/duck_together.png";

// Profile Images
import duckProfile1 from "@/assets/images/duck_profile1.png";
import duckProfile2 from "@/assets/images/duck_profile2.png";
import duckProfile3 from "@/assets/images/duck_profile3.png";
import duckProfile4 from "@/assets/images/duck_profile4.png";

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

function safeParseJson(str) {
  try {
    return typeof str === 'string' ? JSON.parse(str) : str;
  } catch {
    return null;
  }
}

function getDuckProfileDetail(duckCustomJson) {
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

// ?¤ì • ?ìˆ˜
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

// ?”ë? ?°ì´??
const DUMMY_CONVERSATIONS = {
  1: [
    {
      id: 1,
      scriptId: "dummy_1",
      speaker: "?¥ê??€",
      korean: "?˜ëŠ” ì¹´í˜?ì„œ ?„ë¥´ë°”ì´?¸ë? ?ˆëŠ”?? ?•ë§ ?˜ë“¤?ˆì–´??",
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
  // ?‘‡ OpenVidu Publisher, Subscribers, leaveSession ê°€?¸ì˜¤ê¸?
  const { publisher, subscribers, leaveSession } = useOpenVidu(); 

  const roomInfo = state?.roomInfo || {};
  const myUserId = state?.myUserId; // ë³¸ì¸ userId
  const [participants, setParticipants] = useState(state?.participants || []); // ì°¸ì—¬??ëª©ë¡

  useEffect(() => {
    // console.log("[RecordingPage] ?˜ì´ì§€ ë¡œë“œ - ?„ì²´ state:", state);
  }, []); // ë§ˆìš´????1?Œë§Œ ?¤í–‰

  const TURNS = roomInfo.turnCount || 3;

  const [step, setStep] = useState(STEP.AI_TIMER);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // ?‘ˆ ?œì¶œ ì¤??íƒœ ì¶”ê?
  const [isReady, setIsReady] = useState(false); // ?‘ˆ ??ì¤€ë¹??íƒœ ì¶”ê?
  // stateë¡??„ë‹¬ë°›ì? currentTurn ?¬ìš©
  const [currentTurn, setCurrentTurn] = useState(() => {
    return roomInfo.currentTurn ?? roomInfo.roomInfo?.currentTurn ?? 1;
  });

  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingCountdown, setRecordingCountdown] = useState(10); // ?¹ìŒ ì¹´ìš´?¸ë‹¤??(10ì´?
  const [sentenceScores, setSentenceScores] = useState({});
  const [bookmarkedSentences, setBookmarkedSentences] = useState([]);
  const [conversations, setConversations] = useState({});
  const [selectedTurnForReport, setSelectedTurnForReport] = useState(null);
  const [scriptError, setScriptError] = useState(null);
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [turnResults, setTurnResults] = useState({});
  const [showBlanks, setShowBlanks] = useState(true); // ?‘ˆ ë¹ˆì¹¸ ëª¨ë“œ ?íƒœ ì¶”ê?
  const [toastMessage, setToastMessage] = useState(""); // ?‘ˆ ? ìŠ¤??ë©”ì‹œì§€ ?íƒœ ì¶”ê?
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(true); // ?‘ˆ ?ë?ë°??Œë¦¬ ?Œì†Œê±??íƒœ ì¶”ê?

  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  // MediaRecorder ?€??RecordRTC ?¬ìš©???„í•œ ref
  const recorderRef = useRef(null);
  const audioRef = useRef(null);
  const prevIsConversationStepRef = useRef(null); // ?‘ˆ ?´ì „ ë§ˆì´???íƒœ ?€?¥ìš© Ref
  const hasNavigatedRef = useRef(false); // ?‘ˆ ì¤‘ë³µ ?´ë™ ë°©ì???Ref

  // --- ?ª„ [ì¶”ê?] ?¨ë„ ?œë˜ê·?ë°?ìµœì†Œ???íƒœ ---
  const [panelPos, setPanelPos] = useState({ top: 130, right: 40 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    // ë²„íŠ¼ ?´ë¦­ ?œì—???œë˜ê·?ë°©ì?
    if (e.target.closest('button')) return;
    
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const newLeft = e.clientX - dragOffset.current.x;
      const newTop = e.clientY - dragOffset.current.y;
      
      // ?¤ë¥¸ìª?ê¸°ì? ì¢Œí‘œë¡?ë³€??(?”ë©´ ?¬ê¸° ë³€???€??
      const panelWidth = 280; 
      const newRight = window.innerWidth - (newLeft + panelWidth);
      
      setPanelPos({ 
        top: Math.max(10, Math.min(window.innerHeight - 50, newTop)), 
        right: Math.max(10, Math.min(window.innerWidth - 50, newRight)) 
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500);
  }, []);

  // roomId ì¶”ì¶œ
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

  // roomCode ì¶”ì¶œ
  const roomCode = useMemo(() => {
    return (
      roomInfo.roomCode ||
      roomInfo.inviteCode ||
      roomInfo.joinCode ||
      roomInfo.code ||
      ""
    );
  }, [roomInfo]);

  // [ì¶”ê?] ?´ê? ë°©ì¥?¸ì? ?¬ë?ë¥?participants ë¦¬ìŠ¤?¸ë? ?µí•´ ???•ì‹¤?˜ê²Œ ?ë³„
  const amIHost = useMemo(() => {
    const me = participants.find((p) => String(p.id || p.userId) === String(myUserId));
    if (me) return me.isHost === true;
    return roomInfo.isHost === true; // ë¦¬ìŠ¤?¸ì—??ëª?ì°¾ì„ ê²½ìš° fallback
  }, [participants, myUserId, roomInfo.isHost]);

  // ëª¨ë“  ì°¸ì—¬??ë°©ì¥ ?œì™¸)ê°€ ì¤€ë¹„ë˜?ˆëŠ”ì§€ ?•ì¸
  const allReady = useMemo(() => {
    const nonHostParticipants = participants.filter((p) => !p.isHost);
    if (nonHostParticipants.length === 0) return true;
    return nonHostParticipants.every((p) => p.isReady);
  }, [participants]);

  // ì´ˆê¸° ë¡œë¹„ ?•ë³´ ê°€?¸ì˜¤ê¸?(ì¤€ë¹??íƒœ ?™ê¸°??
  const fetchLobby = useCallback(async () => {
    if (!roomCode) return;
    try {
      const data = await getRoomLobby(roomCode);
      const members = data.participants || [];
      
      setParticipants((prev) => {
        // ê¸°ì¡´ ì°¸ì—¬?ë“¤??ë§ˆì´??ë°œí™” ?íƒœë¥?ê¸°ì–µ?˜ê¸° ?„í•œ ë§?
        const prevMap = new Map(prev.map(p => [String(p.id || p.userId), p]));
        
        return members.map((m) => {
          const id = String(m.userId);
          const prevInfo = prevMap.get(id);
          
          return {
            id: id,
            userId: m.userId,
            name: m.nickname,
            isMe: id === String(myUserId),
            isReady: m.readyStatus === "READY",
            isHost: m.isHost,
            duckCustomJson: m.duckCustomJson,
            // ?‘ˆ ì¤‘ìš”: ê¸°ì¡´???´ë? ?„ë£Œ(micOn: true)?ˆë‹¤ë©?ê·??íƒœë¥?? ì???
            micOn: prevInfo ? (prevInfo.micOn || (m.micOn ?? false)) : false,
            voiceLevel: prevInfo?.voiceLevel || 0,
            isSpeaking: prevInfo?.isSpeaking || false,
          };
        });
      });
      
      const me = members.find(m => String(m.userId) === String(myUserId));
      if (me) setIsReady(me.readyStatus === "READY");
    } catch (e) {
      console.error("[RecordingPage] ë¡œë¹„ ?•ë³´ ì¡°íšŒ ?¤íŒ¨:", e);
    }
  }, [roomCode, myUserId]);

  const handleRoomClosed = useCallback(() => {
    // console.log("[RecordingPage] ROOM_CLOSED ?˜ì‹  - ë°©ì¥ ?´ì¥");
    // ?‘‡ ê°•ì œ ?´ì¥ ?œì—???¸ì…˜ ì¢…ë£Œ
    if (leaveSession) leaveSession();
    
    navigate("/main", {
      replace: true,
      state: { toastMessage: "ë°©ì¥???´ì¥?˜ì—¬ ?€?”ê? ì¢…ë£Œ?˜ì—ˆ?µë‹ˆ??" },
    });
  }, [navigate, leaveSession]);

  const handleMiniGameStart = useCallback(() => {
    // console.log('?® ëª¨ë“  ì°¸ì—¬??ë¯¸ë‹ˆê²Œì„?¼ë¡œ ?´ë™ ?œì‘');
    navigate("/minigame1", { 
      state: { 
        ...state, // ê¸°ì¡´ state(openviduSessionId ?¬í•¨) ? ì?
        roomId: roomId,
        roomCode: roomCode,
        isHost: amIHost, 
        participantsCount: participants.length,
        timeLimit: roomInfo.timeLimit || 40
      } 
    });
  }, [navigate, state, roomId, roomCode, amIHost, participants.length, roomInfo.timeLimit]);

  const { sendReady, sendMiniGameStart, sendVoiceLevel, sendMic, isConnected } = useRoomWebSocket(
    roomCode,
    {
      onRoomClosed: handleRoomClosed,
      onMiniGameStart: handleMiniGameStart,
      onVoiceLevelChanged: (payload, senderKey) => {
        if (!senderKey) return;
        const k = String(senderKey);
        setParticipants((prev) =>
          prev.map((p) => {
            if (p.id === k) {
              const level = payload?.level ?? 0;
              const isSpeaking = p.micOn && level > 0.03;
              return { ...p, voiceLevel: level, isSpeaking };
            }
            return p;
          })
        );
      },
      onMicChanged: (payload, senderKey) => {
        if (!senderKey) return;
        const k = String(senderKey);
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === k ? { ...p, micOn: payload?.micOn ?? true, isSpeaking: (payload?.micOn ?? true) ? p.isSpeaking : false } : p
          )
        );
      },
      onReadyChanged: (payload, senderKey) => {
        if (senderKey) {
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

          setParticipants((prev) =>
            prev.map((p) =>
              String(p.id || p.userId) === String(senderKey)
                ? { ...p, isReady: newReady } // ê¸°ì¡´ ?•ë³´(duckCustomJson ?? ? ì??˜ë©° ?íƒœë§?ë³€ê²?
                : p
            )
          );
        }
      },
      onRoomStarted: (payload) => {
        // console.log("[RecordingPage] ?® ROOM_STARTED ?˜ì‹  - ?¨ê³„ ?´ë™ ?œì‘");
        if (hasNavigatedRef.current) return;

        // ë§ˆì?ë§??´ì¸ ê²½ìš°: ???´ìƒ TogetherTalkPageë¡??´ë™?˜ì? ?Šê³  
        // handleStartNextTurn(sendMiniGameStart)???˜í•´ ë¯¸ë‹ˆê²Œì„?¼ë¡œ ?´ë™?˜ê²Œ ??
        if (currentTurn >= TURNS) {
          // console.log("[RecordingPage] ë§ˆì?ë§???ë¦¬í¬???„ë£Œ ?€ê¸?ì¤?..");
          return;
        }

        // ì¤‘ê°„ ?´ì¸ ê²½ìš°: ëª¨ë“  ì°¸ì—¬?ê? ?™ì‹œ???¤ìŒ ?€?”ë°©?¼ë¡œ ?´ë™
        hasNavigatedRef.current = true;
        const nextTurn = currentTurn + 1;
        const navigationState = {
          ...state,
          currentTurn: nextTurn,
          roomInfo: {
            ...roomInfo,
            currentTurn: nextTurn,
          },
          myUserId,
        };

        setIsTransitioning(true);
        setTimeout(() => {
          navigate("/together/talk", {
            replace: true,
            state: navigationState,
          });
        }, 2000);
      },
      onMemberJoined: (payload) => fetchLobby(),
      onMemberLeft: (payload, senderKey) => {
        if (senderKey) {
          setParticipants((prev) => prev.filter((p) => String(p.id || p.userId) !== String(senderKey)));
        }
      },
    },
    roomId
  );

  // ?¤ ?¤ì‹œê°??Œì„± ë¶„ì„ê¸?
  const { voiceLevel: localVoiceLevel, isSpeaking: localIsSpeaking, start: startMicAnalytic, stop: stopMicAnalytic } = useMicAnalyzer({
    threshold: 0.03,
    holdMs: 220,
  });

  // ?¤ ??ëª©ì†Œë¦??¬ê¸°ë¥??¤ë¥¸ ?¬ëŒ?¤ì—ê²??„ì†¡
  useEffect(() => {
    if (!isSpeakerMuted && sendVoiceLevel && localVoiceLevel > 0) {
      sendVoiceLevel(localVoiceLevel);
    }
    
    // ???”ë©´?????„ë°”?€?ë„ ?œì‹œ?˜ê¸° ?„í•´ participants ?…ë°?´íŠ¸
    if (localIsSpeaking !== undefined) {
      setParticipants(prev => prev.map(p => 
        p.isMe ? { ...p, isSpeaking: localIsSpeaking, voiceLevel: localVoiceLevel } : p
      ));
    }
  }, [localVoiceLevel, localIsSpeaking, isSpeakerMuted, sendVoiceLevel]);

  // ?¤ ì´ˆê¸° ë§ˆì´???íƒœ ?„ì†¡ (?‘ì† ì¦‰ì‹œ ëª¨ë‘ '?‰ê? ì¤??¼ë¡œ ?¤ì •)
  useEffect(() => {
    if (isConnected && sendMic) {
      // console.log("?¤ [RecordingPage] ì´ˆê¸° ë§ˆì´???íƒœ ?„ì†¡ (false)");
      sendMic(false);
    }
  }, [isConnected, sendMic]);

  // ?‘‡ [New] OpenVidu ?œì–´ ë¡œì§ (?ë„??ì¤‘ì—???…ê³¼ ê·€ë¥?ëª¨ë‘ ?«ìŒ)
  useEffect(() => {
    if (!publisher) return;

    // ?€?”ê? ?ˆìš©?˜ëŠ” ?¨ê³„: ê²°ê³¼ ë¦¬í¬???”ë©´ ?ëŠ” ?„ì „??ì¢…ë£Œ???”ë©´
    const isConversationStep = (step === STEP.TURN_REPORT || step === STEP.ALL_DONE || step === STEP.IDLE);

    if (isConversationStep) {
      // ê²°ê³¼ ?”ë©´?ì„œ???€?ë“¤ê³??€?”í•  ???ˆë„ë¡?ë§ˆì´??Unmute & ?¤í”¼ì»?Unmute
      // console.log(`?¤ [OpenVidu] ê²°ê³¼ ?•ì¸ ?¨ê³„(${step}) -> ë§ˆì´??& ?¤í”¼ì»?Unmute`);
      publisher.publishAudio(true);
      setIsSpeakerMuted(false);
      
      // ?¤ ???Œì„± ë¶„ì„ ?œì‘ ë°??œë²„??ë§ˆì´??ì¼œì§ ?Œë¦¼
      startMicAnalytic();
      if (sendMic) sendMic(true);
      
      // ?Œì†Œê±°ê? ?€ë¦??Œë§Œ ?Œë¦¼ ?œì‹œ (?ë„??-> ê²°ê³¼ ?”ë©´ ?„í™˜ ??
      if (prevIsConversationStepRef.current === false) {
        showToast("?€?ë“¤ê³??€?”ê? ê°€?¥í•©?ˆë‹¤. ?™ï¸?);
      }
    } else {
      // ?ë„??ì§„í–‰ ì¤‘ì—??ì§‘ì¤‘???„í•´ ë§ˆì´??Mute & ?¤í”¼ì»?Mute
      // console.log(`?¤ [OpenVidu] ?ë„??ì§„í–‰ ?¨ê³„(${step}) -> ë§ˆì´??& ?¤í”¼ì»?Mute`);
      publisher.publishAudio(false);
      setIsSpeakerMuted(true);

      // ?¤ ???Œì„± ë¶„ì„ ì¤‘ì? ë°??œë²„??ë§ˆì´??êº¼ì§ ?Œë¦¼
      stopMicAnalytic();
      if (sendMic) sendMic(false);
    }
    
    prevIsConversationStepRef.current = isConversationStep;
  }, [step, publisher, showToast, startMicAnalytic, stopMicAnalytic, sendMic]);

  useEffect(() => {
    if (step === STEP.TURN_REPORT && currentTurn < TURNS) {
      fetchLobby();
    }
  }, [step, fetchLobby, currentTurn, TURNS]);

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

  // --- ?¨ìˆ˜??---

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

  // [?˜ì •] RecordRTCë¡??¹ìŒ ?œì‘ (WAV ?¬ë§·)
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // RecordRTC ?¤ì •: Azureê°€ ì¢‹ì•„?˜ëŠ” ?„ë²½??WAV ?¬ë§·?¼ë¡œ ?¤ì •
      const recorder = new RecordRTC(stream, {
        type: "audio",
        mimeType: "audio/wav", // WAV ?¬ë§· ê°•ì œ
        recorderType: StereoAudioRecorder,
        numberOfAudioChannels: 1, // ëª¨ë…¸ (Azure ê¶Œì¥)
        desiredSampRate: 16000, // 16kHz (Azure ê¶Œì¥)
      });

      recorder.startRecording();
      recorderRef.current = recorder; // ref???€??

      // console.log("?¹ìŒ ?œì‘ (WAV ?¬ë§·)");
    } catch (error) {
      console.error("?¹ìŒ ?œì‘ ?¤íŒ¨:", error);
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

  // [?˜ì •] RecordRTCë¡??¹ìŒ ì¤‘ì? ë°??„ì†¡
  const stopRecording = useCallback(() => {
    if (!currentSentence || !currentSentence.scriptId) {
  console.error("??ë°œìŒ ?‰ê? ?¤íŒ¨: scriptIdê°€ ? íš¨?˜ì? ?ŠìŠµ?ˆë‹¤.");
  return;
}
// console.log(`?“¤ ë°œìŒ ?‰ê? ?„ì†¡ ?œì‘`, {
  roomId,
  turnNo: currentTurn,
  scriptId: currentSentence.scriptId,
});

    const recorder = recorderRef.current;

    // ?ˆì½”?”ê? ?†ìœ¼ë©??¨ìˆ˜ ì¢…ë£Œ
    if (!recorder) return;

    // RecordRTC??stopRecording?€ ì½œë°± ë°©ì‹?¼ë¡œ ?™ì‘?©ë‹ˆ??
    recorder.stopRecording(async () => {
      // 1. WAV Blob ?ì„±
      const blob = recorder.getBlob();

      // 2. ë§ˆì´???¤íŠ¸ë¦??•ì?
      try {
        const internalRecorder = recorder.getInternalRecorder();
        if (internalRecorder && internalRecorder.stream) {
          internalRecorder.stream.getTracks().forEach((track) => track.stop());
        }
      } catch (e) {
        console.warn("ë§ˆì´???¤íŠ¸ë¦??•ì? ì¤?ê²½ë????¤ë¥˜:", e);
      }

      // 3. ë°©ì–´ ë¡œì§: ?„ì¬ ë¬¸ì¥ ?•ë³´??scriptIdê°€ ?†ìœ¼ë©?ì¤‘ë‹¨
      if (!currentSentence || !currentSentence.scriptId) {
        console.error(
          "??ë°œìŒ ?‰ê? ?¤íŒ¨: scriptIdê°€ ? íš¨?˜ì? ?ŠìŠµ?ˆë‹¤.",
          currentSentence
        );
        setStep(STEP.RECORD_DONE);
        return;
      }

      // 4. API ?„ì†¡ ë°??ìˆ˜ ?…ë°?´íŠ¸
      if (blob && blob.size > 0) {
        try {
          // console.log(`?“¤ ë°œìŒ ?‰ê? ?„ì†¡ ?œì‘ (WAV, ${blob.size} bytes)`, {
            roomId,
            turnNo: currentTurn,
            scriptId: currentSentence.scriptId,
          });

          // UI ?…ë°?´íŠ¸: ?‰ê? ì¤??íƒœ(-1)
          setSentenceScores((prev) => ({
            ...prev,
            [currentSentence.id]: -1,
          }));

          setIsSubmitting(true);

          // API ?¸ì¶œ (shadowing.js??saveAssessment)
          const response = await saveAssessment(
            blob,
            roomId,
            currentTurn,
            currentSentence.scriptId
          );

          // [?µì‹¬] ë°±ì—”?œì—??ë°›ì? ?ìˆ˜(score)ê°€ ?ˆìœ¼ë©?UI??ì¦‰ì‹œ ë°˜ì˜
          if (response && response.score) {
            const score = parseInt(response.score, 10);
            // console.log("?’¯ ë°œìŒ ?ìˆ˜ ?˜ì‹ :", score);

            setSentenceScores((prev) => ({
              ...prev,
              [currentSentence.id]: score, // ?¤ì œ ?ìˆ˜ë¡??…ë°?´íŠ¸
            }));
          } else {
            console.warn("? ï¸ ?‘ë‹µ???ìˆ˜ê°€ ?†ìŠµ?ˆë‹¤.", response);
          }

          setStep(STEP.RECORD_DONE);
        } catch (error) {
          console.error("???‰ê? ?€???¤íŒ¨:", error);
          setSentenceScores((prev) => ({
            ...prev,
            [currentSentence.id]: -2,
          }));
          setStep(STEP.RECORD_DONE);
        } finally {
          setIsSubmitting(false);
        }
      } else {
        console.warn("? ï¸ ?¹ìŒ???°ì´?°ê? ?†ìŠµ?ˆë‹¤ (Blob size 0)");
        setStep(STEP.RECORD_DONE);
      }
    });
  }, [currentSentence, roomId, currentTurn]);

  const goNextTurn = () => {
    if (currentTurn >= TURNS) {
      // console.log("[RecordingPage] ë§ˆì?ë§????„ë£Œ - ALL_DONE?¼ë¡œ ?„í™˜");
      setStep(STEP.ALL_DONE);
      return;
    }
    // ì¤‘ê°„ ???´ë™?€ handleStartNextTurn -> onRoomStartedë¥??µí•´ ?¤í•¨ê»?ì§„í–‰?©ë‹ˆ??
    // console.log("[RecordingPage] ?¤ìŒ ???€ê¸?ì¤?(ë°©ì¥ ?œì‘ ?€ê¸?");
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

  // [?˜ì •] ë¶ë§ˆ??? ê?: scriptId ê¸°ì??¼ë¡œ ?™ì‘?˜ë„ë¡??˜ì •
  const handleBookmarkToggle = useCallback(
    async (id, isBookmarked) => {
      try {
        // id??UI?ì„œ ?˜ì–´??ê°?(ë³´í†µ sentence.id = order_no??ê°€?¥ì„± ?’ìŒ)
        // currentTurnSentences?ì„œ ?´ë‹¹ ë¬¸ì¥??ì§„ì§œ scriptId ì°¾ê¸°
        const sentence = currentTurnSentences.find((s) => s.id === id);
        const realScriptId = sentence?.scriptId;

        if (!realScriptId) {
          console.error("?¤í¬ë¦½íŠ¸ IDë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤.");
          return;
        }

        const targetTurn = selectedTurnForReport || currentTurn;

        // console.log("[RecordingPage] ë¶ë§ˆ??? ê?:", {
          id,
          realScriptId,
          roomId,
          isBookmarked,
          turnNo: targetTurn,
        });

        // API ?¸ì¶œ - ?‘ë‹µ?ì„œ isLiked ?íƒœë¥?ë°›ì•„??
        const response = await toggleScriptLike(
          realScriptId,
          roomId,
          targetTurn
        );

        // console.log("[RecordingPage] ë¶ë§ˆ??API ?‘ë‹µ:", response);

        // scriptId??ê³ ìœ ?˜ë?ë¡?scriptIdë¥?ë¶ë§ˆ???¤ë¡œ ?¬ìš©
        const bookmarkKey = realScriptId;

        // API ?‘ë‹µ??isLiked ê°’ì„ ê¸°ì??¼ë¡œ ë¡œì»¬ ?íƒœ ?…ë°?´íŠ¸
        setBookmarkedSentences((prev) => {
          const next = response.isLiked
            ? [...new Set([...prev, bookmarkKey])]  // APIê°€ ?€?¥ë¨(true)??ë°˜í™˜?˜ë©´ ì¶”ê?
            : prev.filter((key) => key !== bookmarkKey);  // APIê°€ ?? œ??false)??ë°˜í™˜?˜ë©´ ?œê±°
          localStorage.setItem("bookmarkedSentences", JSON.stringify(next));
          return next;
        });
      } catch (error) {
        console.error("ë¶ë§ˆ???¤íŒ¨:", error);
        alert("ë¶ë§ˆ???€?¥ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.");
      }
    },
    [currentTurnSentences, roomId, selectedTurnForReport, currentTurn]
  );

  const handleReady = useCallback(async () => {
    // console.log("[RecordingPage] ?”˜ handleReady ?¸ì¶œ:", {
      isConnected,
      isReady,
      roomCode,
      myUserId,
      hasToken: !!localStorage.getItem("accessToken")
    });

    if (!isConnected) {
      showToast("?œë²„?€ ?°ê²°?˜ì? ?Šì•˜?µë‹ˆ??");
      return;
    }
    const nextReady = !isReady;
    try {
      // console.log("[RecordingPage] ?“¡ toggleReady API ?¸ì¶œ ?œì‘:", { roomCode, nextReady });
      await toggleReady(roomCode, nextReady);
      // console.log("[RecordingPage] ??toggleReady API ?¸ì¶œ ?±ê³µ");

      setIsReady(nextReady);
      if (sendReady) sendReady(nextReady);
      setParticipants((prev) =>
        prev.map((p) => (String(p.id || p.userId) === String(myUserId) ? { ...p, isReady: nextReady } : p))
      );
    } catch (e) {
      console.error("[RecordingPage] ??toggleReady API ?¸ì¶œ ?¤íŒ¨:", e);
      console.error("[RecordingPage] ?ëŸ¬ ?ì„¸:", {
        status: e.response?.status,
        statusText: e.response?.statusText,
        data: e.response?.data,
        headers: e.response?.headers
      });
      showToast("ì¤€ë¹??íƒœ ë³€ê²½ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    }
  }, [isConnected, isReady, roomCode, sendReady, myUserId, showToast]);

  const handleStartNextTurn = useCallback(async () => {
    if (!amIHost) return;
    if (!allReady && participants.length > 1) {
      showToast("ëª¨ë“  ì°¸ì—¬?ê? ì¤€ë¹„ë˜?´ì•¼ ?©ë‹ˆ??");
      return;
    }

    const isLastTurn = currentTurn >= TURNS;

    try {
      if (isLastTurn) {
        // console.log("?® [ë°©ì¥] ë§ˆì?ë§????„ë£Œ - ë¯¸ë‹ˆê²Œì„ ?œì‘ ? í˜¸ ?„ì†¡");
        if (sendMiniGameStart) {
          sendMiniGameStart();
        } else {
          console.error("??sendMiniGameStart ?¨ìˆ˜ê°€ ?†ìŠµ?ˆë‹¤.");
        }
      } else {
        // console.log("??[ë°©ì¥] ?¤ìŒ ???œì‘ API ?¸ì¶œ");
        await startRoom(roomCode);
      }
    } catch (e) {
      showToast(isLastTurn ? "ë¯¸ë‹ˆê²Œì„ ?œì‘???¤íŒ¨?ˆìŠµ?ˆë‹¤." : "?¤ìŒ ???œì‘???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    }
  }, [allReady, roomCode, showToast, participants.length, amIHost, currentTurn, TURNS, sendMiniGameStart]);

  const handleLogoExit = useCallback(async () => {
    // ?‘‡ ì§„ì§œ ë°©ì„ ?˜ê°ˆ ?ŒëŠ” ?¸ì…˜ ì¢…ë£Œ
    if (leaveSession) leaveSession();

    if (roomCode) {
      try {
        await leaveRoom({ roomCode });
        // console.log("[RecordingPage] ë°??´ì¥ ?±ê³µ");
      } catch (e) {
        console.error("[RecordingPage] ë°??´ì¥ ?¤íŒ¨:", e);
      }
    }
  }, [roomCode, leaveSession]);

  const fetchTurnResults = useCallback(
    async (turnNo = currentTurn) => {
      if (!roomId || !turnNo) {
        console.warn(
          "[RecordingPage] roomId ?ëŠ” turnNoê°€ ?†ì–´ ?ìˆ˜ ì¡°íšŒ ë¶ˆê?",
        );
        return;
      }

      try {
        // console.log(`?” [RecordingPage] ??${turnNo} ?ìˆ˜ ì¡°íšŒ ?œì‘`);
        const results = await getTurnResults(roomId, turnNo);

        // console.log("?“Š [RecordingPage] ?ìˆ˜ ì¡°íšŒ ê²°ê³¼:", results);

        if (!Array.isArray(results) || results.length === 0) {
          console.warn("? ï¸ [RecordingPage] ?ìˆ˜ ?°ì´?°ê? ë¹„ì–´?ˆìŒ");
          return;
        }

        setTurnResults((prev) => ({
          ...prev,
          [turnNo]: results,
        }));

        const targetConversations =
          conversations[turnNo] || currentTurnSentences;
        const scores = {};

        results.forEach((result) => {
          const sentence = targetConversations.find(
            (s) => s.scriptId === result.scriptId,
          );
          if (sentence) {
            scores[sentence.id] = result.score;
          }
        });

        // console.log("??[RecordingPage] ?ìˆ˜ ?…ë°?´íŠ¸:", scores);
        setSentenceScores((prev) => ({ ...prev, ...scores }));
      } catch (error) {
        console.error("??[RecordingPage] ?ìˆ˜ ì¡°íšŒ ?¤íŒ¨:", error);
      }
    },
    [roomId, currentTurn, conversations, currentTurnSentences],
  );

  // --- Effect ë¡œì§ ---

  useEffect(() => {
    const saved = localStorage.getItem("bookmarkedSentences");
    if (saved) setBookmarkedSentences(JSON.parse(saved));
  }, []);

  // ???¤í¬ë¦½íŠ¸ ë¡œë“œ
  useEffect(() => {
    const fetchTurnScripts = async () => {
      if (conversations[currentTurn]) {
        // console.log(
          `[RecordingPage] turn ${currentTurn} ?¤í¬ë¦½íŠ¸ ?´ë? ë¡œë“œ??
        );
        return;
      }

      setIsLoadingScript(true);
      setScriptError(null);

      if (!roomId) {
        console.warn(`[RecordingPage] roomId ?†ìŒ - ?”ë? ?°ì´???¬ìš©`);
        setConversations((prev) => ({
          ...prev,
          [currentTurn]: DUMMY_CONVERSATIONS[currentTurn] || [],
        }));
        setIsLoadingScript(false);
        return;
      }

      try {
        // console.log(`[RecordingPage] turn ${currentTurn} ?¤í¬ë¦½íŠ¸ ë¡œë“œ ?œì‘`);
        const response = await getTurnScripts(roomId, currentTurn);
        // console.log(`[RecordingPage] ?‘ë‹µ:`, response);

        const scripts = Array.isArray(response) ? response : [response];

        if (
          scripts.length === 0 ||
          (scripts.length === 1 && !scripts[0]?.scriptId)
        ) {
          const errorMsg = `??${currentTurn}???€???´ìš©???†ìŠµ?ˆë‹¤.`;
          // console.log(`[RecordingPage] ${errorMsg}`);
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
                "ì°¸ì—¬??;
            }

            if (!speakerName || speakerName === "Unknown") {
              speakerName = "ì°¸ì—¬??;
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
              ? `${speakerName}(??`
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

        // console.log(
          `[RecordingPage] ?¬ë§·???„ë£Œ (${formatted.length}ê°?:`,
          formatted
        );
        setConversations((prev) => ({
          ...prev,
          [currentTurn]: formatted,
        }));
        setIsLoadingScript(false);
      } catch (e) {
        console.error(`[RecordingPage] ë¡œë“œ ?¤íŒ¨:`, e);
        const errorMsg = `?¤ë¥˜ ë°œìƒ: ${e.message || "?¤íŠ¸?Œí¬ ?¤ë¥˜"}`;
        setScriptError(errorMsg);
        setConversations((prev) => ({ ...prev, [currentTurn]: [] }));
        setIsLoadingScript(false);
      }
    };
    fetchTurnScripts();
  }, [currentTurn, roomId, conversations, participants]);

  // ë©”ì¸ ?€?´ë¨¸ ë°??ë™ ?ë¦„ ?œì–´
  useEffect(() => {
    clearAllTimers();

    if (step === STEP.AI_TIMER) {
      if (conversations[currentTurn] === undefined) return;
      if (conversations[currentTurn].length === 0) return;

      // ???¤í¬ë¦½íŠ¸ê°€ ?„ì§ ë¡œë“œ?˜ì? ?Šì? ê²½ìš° ?€ê¸?
      if (conversations[currentTurn] === undefined) {
        // console.log(
          `??[RecordingPage] turn ${currentTurn} ?¤í¬ë¦½íŠ¸ ë¡œë“œ ?€ê¸?ì¤?..`,
        );
        return;
      }

      // ???´ë‹¹ ?´ì˜ ?¤í¬ë¦½íŠ¸ê°€ ë¹?ë°°ì—´??ê²½ìš° (?¤í¬ë¦½íŠ¸ ?†ìŒ)
      if (conversations[currentTurn].length === 0) {
        // console.log(
          `? ï¸ [RecordingPage] turn ${currentTurn} ?¤í¬ë¦½íŠ¸ê°€ ?†ìŒ - ?™ê¸°???¨ê³„ë¡??´ë™`,
        );
        setTimeout(() => {
          setStep(STEP.TURN_REPORT);
        }, 1000); 
        return;
      }

      // ?•ìƒ: 3ì´?ì¹´ìš´?¸ë‹¤???œì‘
      // console.log("??[STEP] AI_TIMER ì¹´ìš´?¸ë‹¤???œì‘ (3ì´?");
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
        // TTS URL ë³´ì • (?„ë¡?œìš©)
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
      
      // ë¬¸ì¥ ê¸¸ì´???°ë¥¸ ?™ì  ?œê°„ ê³„ì‚° (?¨ì–´ ??ê¸°ì?)
      const words = currentSentence?.english?.split(' ')?.length || 0;
      const dynamicDuration = Math.max(8, Math.min(30, Math.ceil(words * 1.5) + 5));
      
      // console.log(`?™ï¸?[RecordingPage] ë¬¸ì¥ ê¸¸ì´(${words}?¨ì–´)???°ë¥¸ ?œí•œ?œê°„ ?¤ì •: ${dynamicDuration}ì´?);
      setRecordingCountdown(dynamicDuration);
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

  useEffect(() => {
    if (step === STEP.TURN_REPORT && roomId && currentTurn) {
      // console.log("[RecordingPage] TURN_REPORT ì§„ì… ???ìˆ˜ ì¡°íšŒ");
      fetchTurnResults(currentTurn);
    }
  }, [step, currentTurn, roomId, fetchTurnResults]);

  // ?¤í¬ë¦½íŠ¸ ?ëŸ¬ ë°œìƒ ???™ê¸°???¨ê³„ë¡?ì§„ì…
  useEffect(() => {
    if (scriptError) {
      // console.log("[RecordingPage] ?¤í¬ë¦½íŠ¸ ?¤ë¥˜ ë°œìƒ - ?™ê¸°???¨ê³„ë¡??´ë™");
      const timer = setTimeout(() => {
        setStep(STEP.TURN_REPORT);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [scriptError]);

  // UI ?°ì´??ê°€ê³?
  const sentenceCardsData = useMemo(() => {
    const isReportMode = step === STEP.TURN_REPORT || step === STEP.ALL_DONE;
    const targetTurn = selectedTurnForReport || currentTurn;

    let resultsMap = {};
    if (isReportMode && turnResults[targetTurn]) {
      turnResults[targetTurn].forEach((result) => {
        resultsMap[result.scriptId] = {
          score: result.score,
          averageScore: result.averageScore,
        };
      });
      // console.log("?” [RecordingPage] resultsMap:", resultsMap);
    }

    return currentTurnSentences.map((s, i) => {
      const resultData = resultsMap[s.scriptId];
      const finalScore = resultData?.score ?? sentenceScores[s.id];

      // scriptId??ê³ ìœ ?˜ë?ë¡?scriptIdë§??¬ìš© (??ë²ˆí˜¸ ë¶ˆí•„??
      const bookmarkKey = s.scriptId;
      return {
        ...s,
        scriptId: s.scriptId,
        score: finalScore,
        averageScore: resultData?.averageScore,
        isActive: isReportMode ? true : i === currentSentenceIndex,
        currentSentence: i + 1,
        totalSentences: currentTurnSentences.length,
        isBookmarked: bookmarkedSentences.includes(bookmarkKey),
      };
    });
  }, [
    currentTurnSentences,
    currentSentenceIndex,
    sentenceScores,
    bookmarkedSentences,
    step,
    turnResults,
    currentTurn,
    selectedTurnForReport,
  ]);

  const handleManualStop = useCallback(() => {
    // console.log("?¹ï¸ [RecordingPage] ?¬ìš©?ê? ?¹ìŒ???˜ë™?¼ë¡œ ì¢…ë£Œ?ˆìŠµ?ˆë‹¤.");
    clearAllTimers();
    stopRecording();
  }, [clearAllTimers, stopRecording]);

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
            ?¤í¬ë¦½íŠ¸ë¥?ë¶ˆëŸ¬?¤ëŠ” ì¤‘ì…?ˆë‹¤...
          </p>
        </div>
      );
    }

    const isReportMode = step === STEP.TURN_REPORT || step === STEP.ALL_DONE;

    if (scriptError && !isReportMode) {
      return (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            background: "#fff",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "200px",
          }}
        >
          <p
            style={{
              fontSize: "16px",
              color: "#6b7280",
              whiteSpace: "pre-line",
              marginBottom: "24px",
              lineHeight: "1.6",
            }}
          >
            {scriptError}
          </p>
          <div className={styles.spinner} />
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
        return <BottomRecording onStop={handleManualStop} />;
      case STEP.RECORD_DONE:
        return <BottomRecordDone isLast={isLastSentence} />;
      case STEP.TURN_REPORT:
        // ëª¨ë“  ??ì¤‘ê°„ ë°?ë§ˆì?ë§????€???™ê¸°??ë¡œì§(ì¤€ë¹??œì‘) ?ìš©
        const readyCount = participants.filter(p => !p.isHost && p.isReady).length;
        const totalToReady = participants.length - 1;

        return (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              background: "#fff",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {/* ?¤í¬ë¦½íŠ¸ ?ëŸ¬/?´ìš©?†ìŒ ë©”ì‹œì§€ê°€ ?ˆìœ¼ë©?ë²„íŠ¼ ?„ì— ?œì‹œ */}
            {scriptError && (
              <p style={{ fontSize: "15px", color: "#6b7280", marginBottom: "4px", whiteSpace: "pre-line" }}>
                {scriptError}
              </p>
            )}

            {/* ì¤€ë¹??„í™©??ëª¨ë“  ? ì??ê²Œ ?œì‹œ */}
            <div style={{ fontSize: "14px", color: "#666", fontWeight: "500" }}>
              {participants.length > 1 
                ? `?€??ì¤€ë¹??„í™©: ${readyCount} / ${totalToReady}`
                : "ì°¸ì—¬?ë? ê¸°ë‹¤ë¦¬ê³  ?ˆìŠµ?ˆë‹¤."}
            </div>

            {amIHost ? (
              <button
                onClick={handleStartNextTurn}
                disabled={!allReady && participants.length > 1}
                style={{
                  padding: "12px 32px",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#fff",
                  background: (!allReady && participants.length > 1) ? "#ccc" : "#2b7fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: (!allReady && participants.length > 1) ? "not-allowed" : "pointer",
                }}
              >
                {currentTurn >= TURNS ? "ë³µìŠµ ê²Œì„ ?œì‘" : "?¤ìŒ ?¨ê³„ë¡?}
              </button>
            ) : (
              <button
                onClick={handleReady}
                style={{
                  padding: "12px 32px",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#fff",
                  background: isReady ? "#10b981" : "#2b7fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                {isReady ? "ì¤€ë¹??„ë£Œ!" : "ì¤€ë¹„í•˜ê¸?}
              </button>
            )}
          </div>
        );
      case STEP.ALL_DONE:
        return (
          <BottomAllDone onRestart={restart} onComplete={handleMiniGameStart} isHost={amIHost} />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* ?“Š ?¤ì‹œê°??™ìŠµ ?„í™© ?¨ë„ ì¶”ê? (?œë˜ê·?ìµœì†Œ??ê¸°ëŠ¥) */}
      <div 
        className={`${styles.StatusPanel} ${isDragging ? styles.Dragging : ''} ${isMinimized ? styles.Minimized : ''}`}
        style={{ 
          top: `${panelPos.top}px`, 
          right: `${panelPos.right}px`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
      >
        <div className={styles.StatusTitle}>
          <div className={styles.TitleLeft}>
            <span>?™ìŠµ ?„í™©</span>
            {!isMinimized && <span className={styles.LiveBadge}>LIVE</span>}
          </div>
          <button 
            className={styles.MinimizeButton} 
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            title={isMinimized ? "?¼ì¹˜ê¸? : "ìµœì†Œ??}
          >
            {isMinimized ? "?? : "??}
          </button>
        </div>
        
        {!isMinimized && participants.map((p) => {
          const profile = getDuckProfileDetail(p.duckCustomJson);
          // ?”´/?Ÿ¢ ?ì? ?¤ì§ '?‰ê?(?ë„?? ?„ë£Œ' ?¬ë?ë§??˜í???(ì¤€ë¹??íƒœ?€ ë¶„ë¦¬)
          // ?´ê? ë¦¬í¬???¨ê³„ê±°ë‚˜, ?ë?ë°©ì˜ ë§ˆì´?¬ê? ì¼œì¡Œ?¤ë©´(?ë„???„ë£Œ) '?‰ê? ?„ë£Œ'
          const isEvalFinished = p.isMe 
            ? (step === STEP.TURN_REPORT || step === STEP.ALL_DONE) 
            : p.micOn;
          
          return (
            <div key={p.id} className={styles.ParticipantStatus}>
              <div 
                className={`${styles.AvatarWrapper} ${p.isSpeaking ? styles.Speaking : ''}`}
                style={{ backgroundColor: profile.color }}
              >
                <img 
                  src={profile.image} 
                  alt={p.name} 
                  className={styles.StatusAvatar}
                />
                {profile.accessory && profile.accessory !== 'none' && (
                  <span className={styles.StatusAccessory}>{profile.accessory}</span>
                )}
              </div>
              <div className={styles.StatusInfo}>
                <div className={styles.NameRow}>
                  <span className={styles.StatusName}>
                    {p.isMe 
                      ? `${p.name.length > 5 ? p.name.slice(0, 5) + '..' : p.name}(??` 
                      : (p.name.length > 5 ? p.name.slice(0, 5) + '..' : p.name)}
                  </span>
                </div>
                <div className={styles.StatusLabel}>
                  <span className={`${styles.StatusDot} ${isEvalFinished ? styles.DotGreen : styles.DotRed}`} />
                  <span className={isEvalFinished ? styles.TextGreen : styles.TextRed}>
                    {isEvalFinished ? '?‰ê? ?„ë£Œ' : '?‰ê? ì¤?}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ?‘‡ ?Œë¦¬ ?¬ìƒ??ì»´í¬?ŒíŠ¸ ì¶”ê? (?Œì†Œê±??íƒœ ?„ë‹¬) */}
      {subscribers.map((sub, i) => (
        <div key={i} style={{ display: 'none' }}>
          <UserAudioComponent streamManager={sub} muted={isSpeakerMuted} />
        </div>
      ))}
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
      onStop={handleManualStop}
      showBlanks={showBlanks}
      isSubmitting={isSubmitting}
      onToggleBlanks={() => {
        // console.log("?”„ [RecordingPage] ë¹ˆì¹¸ ëª¨ë“œ ? ê?:", !showBlanks);
        setShowBlanks(!showBlanks);
      }}
      totalTurns={TURNS}
      isAllDone={step === STEP.ALL_DONE}
      onTurnClick={(t) => {
        if (step === STEP.ALL_DONE) {
          setSelectedTurnForReport(t);
          if (!turnResults[t]) {
            fetchTurnResults(t);
          }
        }
      }}
      selectedTurnForReport={selectedTurnForReport}
      logoExitMessage="ë©”ì¸ ?”ë©´?¼ë¡œ ?˜ê??œê² ?µë‹ˆê¹?"
      onLogoExit={handleLogoExit}
      disableProfileClick={true}
      />
      {isTransitioning && (
        <LoadingOverlay
          title="?€???¨ê³„ë¡??´ë™?©ë‹ˆ??"
          subtitle="?€?ë“¤ê³?ì¦ê±°???€?”ë? ?˜ëˆ ë³´ì„¸??"
          image={duckTogether}
        />
      )}
      {toastMessage && <div className={styles.Toast}>{toastMessage}</div>}
    </>
  );
}

// ?‘‡ ?Œë¦¬ ?¬ìƒ??ì»´í¬?ŒíŠ¸
const UserAudioComponent = ({ streamManager, muted }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (streamManager && audioRef.current) {
      streamManager.addVideoElement(audioRef.current);
    }
  }, [streamManager]);

  // muted ?„ë¡œ?¼í‹°ê°€ ë³€ê²½ë  ???¤ì œ ?˜ë¦¬ë¨¼íŠ¸???ìš©
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, [muted]);

  return <audio autoPlay ref={audioRef} muted={muted} />;
};
