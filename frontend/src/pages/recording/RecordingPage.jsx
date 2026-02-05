import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "@/api/api";
import { useOpenVidu } from "@/context/OpenViduContext"; // 👈 OpenVidu Hook 추가
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
import LoadingOverlay from "@/components/common/LoadingOverlay/LoadingOverlay";
import duckTogether from "@/assets/images/duck_together.png";

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
  // 👇 OpenVidu Publisher, Subscribers, leaveSession 가져오기
  const { publisher, subscribers, leaveSession } = useOpenVidu(); 

  const roomInfo = state?.roomInfo || {};
  const myUserId = state?.myUserId; // 본인 userId
  const [participants, setParticipants] = useState(state?.participants || []); // 참여자 목록

  console.log("[RecordingPage] 페이지 로드 - 전체 state:", state);

  const TURNS = roomInfo.turnCount || 3;

  const [step, setStep] = useState(STEP.AI_TIMER);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isReady, setIsReady] = useState(false); // 👈 내 준비 상태 추가
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
  const [turnResults, setTurnResults] = useState({});
  const [showBlanks, setShowBlanks] = useState(true); // 👈 빈칸 모드 상태 추가
  const [toastMessage, setToastMessage] = useState(""); // 👈 토스트 메시지 상태 추가

  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  // MediaRecorder 대신 RecordRTC 사용을 위한 ref
  const recorderRef = useRef(null);
  const audioRef = useRef(null);
  const prevIsConversationStepRef = useRef(null); // 👈 이전 마이크 상태 저장용 Ref
  const hasNavigatedRef = useRef(false); // 👈 중복 이동 방지용 Ref

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500);
  }, []);

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

  // 모든 참여자(방장 제외)가 준비되었는지 확인
  const allReady = useMemo(() => {
    const nonHostParticipants = participants.filter((p) => !p.isHost);
    if (nonHostParticipants.length === 0) return true;
    return nonHostParticipants.every((p) => p.isReady);
  }, [participants]);

  // 초기 로비 정보 가져오기 (준비 상태 동기화)
  const fetchLobby = useCallback(async () => {
    if (!roomCode) return;
    try {
      const data = await getRoomLobby(roomCode);
      const members = data.participants || [];
      const mapped = members.map((m) => ({
        id: String(m.userId),
        userId: m.userId,
        name: m.nickname,
        isMe: String(m.userId) === String(myUserId),
        isReady: m.readyStatus === "READY",
        isHost: m.isHost,
      }));
      setParticipants(mapped);
      
      const me = mapped.find(p => p.isMe);
      if (me) setIsReady(me.isReady);
    } catch (e) {
      console.error("[RecordingPage] 로비 정보 조회 실패:", e);
    }
  }, [roomCode, myUserId]);

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
      console.log("[RecordingPage] 마지막 턴 완료 - ALL_DONE으로 전환");
      setStep(STEP.ALL_DONE);
      return;
    }
    // 중간 턴 이동은 handleStartNextTurn -> onRoomStarted를 통해 다함께 진행됩니다.
    console.log("[RecordingPage] 다음 턴 대기 중 (방장 시작 대기)");
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

  // 미니게임 시작 신호 수신 핸들러
  const handleMiniGameStart = useCallback(() => {
    console.log('🎮 미니게임 시작!');
    navigate("/minigame1", { 
      state: { 
        roomId: roomId,
        roomCode: roomCode,
        isHost: roomInfo.isHost || false,
        participantsCount: participants.length
      } 
    });
  }, [navigate, roomId, roomCode, roomInfo.isHost, participants.length]);

  const handleComplete = () => {
    // 방장만 시작 신호 전송
    if (roomInfo.isHost) {
      console.log('🎮 [방장] 미니게임 시작 신호 전송');
      
      const stompClient = window.stompClient;
      if (stompClient && stompClient.connected) {
        stompClient.publish({
          destination: `/app/rooms/${roomCode}/minigame/start`,
          body: JSON.stringify({})
        });
      } else {
        console.error('❌ WebSocket 연결 안 됨');
        alert('연결 오류가 발생했습니다.');
      }
    }
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

        const targetTurn = selectedTurnForReport || currentTurn;

        console.log("[RecordingPage] 북마크 토글:", {
          id,
          realScriptId,
          roomId,
          isBookmarked,
          turnNo: targetTurn,
        });

        // API 호출 - 응답에서 isLiked 상태를 받아옴
        const response = await toggleScriptLike(
          realScriptId,
          roomId,
          targetTurn
        );

        console.log("[RecordingPage] 북마크 API 응답:", response);

        // scriptId는 고유하므로 scriptId를 북마크 키로 사용
        const bookmarkKey = realScriptId;

        // API 응답의 isLiked 값을 기준으로 로컬 상태 업데이트
        setBookmarkedSentences((prev) => {
          const next = response.isLiked
            ? [...new Set([...prev, bookmarkKey])]  // API가 저장됨(true)을 반환하면 추가
            : prev.filter((key) => key !== bookmarkKey);  // API가 삭제됨(false)을 반환하면 제거
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
    // 👇 강제 퇴장 시에도 세션 종료
    if (leaveSession) leaveSession();
    
    navigate("/main", {
      replace: true,
      state: { toastMessage: "방장이 퇴장하여 대화가 종료되었습니다." },
    });
  }, [navigate, leaveSession]);

  const { sendReady, isConnected } = useRoomWebSocket(
    roomCode,
    {
      onRoomClosed: handleRoomClosed,
      onMiniGameStart: handleMiniGameStart,
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
                ? { ...p, isReady: newReady }
                : p
            )
          );
        }
      },
      onRoomStarted: (payload) => {
        console.log("[RecordingPage] 🎮 ROOM_STARTED 수신 - 단계 이동 시작");
        if (hasNavigatedRef.current) return;

        // 마지막 턴인 경우: 모든 참여자가 동시에 ALL_DONE 단계로 진입
        if (currentTurn >= TURNS) {
          console.log("[RecordingPage] 마지막 턴 종료 -> 전원 ALL_DONE 단계로 전환");
          setStep(STEP.ALL_DONE);
          return;
        }

        // 중간 턴인 경우: 모든 참여자가 동시에 다음 대화방으로 이동
        hasNavigatedRef.current = true;
        const nextTurn = currentTurn + 1;
        const navigationState = {
          ...state,
          currentTurn: nextTurn,
          roomInfo: {
            ...roomInfo,
            roomId: roomId,
            roomCode: roomCode,
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

  const handleReady = useCallback(async () => {
    console.log("[RecordingPage] 🔘 handleReady 호출:", {
      isConnected,
      isReady,
      roomCode,
      myUserId,
      hasToken: !!localStorage.getItem("accessToken")
    });

    if (!isConnected) {
      showToast("서버와 연결되지 않았습니다.");
      return;
    }
    const nextReady = !isReady;
    try {
      console.log("[RecordingPage] 📡 toggleReady API 호출 시작:", { roomCode, nextReady });
      await toggleReady(roomCode, nextReady);
      console.log("[RecordingPage] ✅ toggleReady API 호출 성공");

      setIsReady(nextReady);
      if (sendReady) sendReady(nextReady);
      setParticipants((prev) =>
        prev.map((p) => (String(p.id || p.userId) === String(myUserId) ? { ...p, isReady: nextReady } : p))
      );
    } catch (e) {
      console.error("[RecordingPage] ❌ toggleReady API 호출 실패:", e);
      console.error("[RecordingPage] 에러 상세:", {
        status: e.response?.status,
        statusText: e.response?.statusText,
        data: e.response?.data,
        headers: e.response?.headers
      });
      showToast("준비 상태 변경에 실패했습니다.");
    }
  }, [isConnected, isReady, roomCode, sendReady, myUserId, showToast]);

  const handleStartNextTurn = useCallback(async () => {
    if (!allReady && participants.length > 1) {
      showToast("모든 참여자가 준비되어야 합니다.");
      return;
    }
    try {
      await startRoom(roomCode);
    } catch (e) {
      showToast("다음 턴 시작에 실패했습니다.");
    }
  }, [allReady, roomCode, showToast, participants.length]);

  const handleLogoExit = useCallback(async () => {
    // 👇 진짜 방을 나갈 때는 세션 종료
    if (leaveSession) leaveSession();

    if (roomCode) {
      try {
        await leaveRoom({ roomCode });
        console.log("[RecordingPage] 방 퇴장 성공");
      } catch (e) {
        console.error("[RecordingPage] 방 퇴장 실패:", e);
      }
    }
  }, [roomCode, leaveSession]);

  // [추가] 내가 방장인지 여부를 participants 리스트를 통해 더 확실하게 판별
  const amIHost = useMemo(() => {
    const me = participants.find((p) => String(p.id || p.userId) === String(myUserId));
    if (me) return me.isHost === true;
    return roomInfo.isHost === true; // 리스트에서 못 찾을 경우 fallback
  }, [participants, myUserId, roomInfo.isHost]);

  const fetchTurnResults = useCallback(
    async (turnNo = currentTurn) => {
      if (!roomId || !turnNo) {
        console.warn(
          "[RecordingPage] roomId 또는 turnNo가 없어 점수 조회 불가",
        );
        return;
      }

      try {
        console.log(`🔍 [RecordingPage] 턴 ${turnNo} 점수 조회 시작`);
        const results = await getTurnResults(roomId, turnNo);

        console.log("📊 [RecordingPage] 점수 조회 결과:", results);

        if (!Array.isArray(results) || results.length === 0) {
          console.warn("⚠️ [RecordingPage] 점수 데이터가 비어있음");
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

        console.log("✅ [RecordingPage] 점수 업데이트:", scores);
        setSentenceScores((prev) => ({ ...prev, ...scores }));
      } catch (error) {
        console.error("❌ [RecordingPage] 점수 조회 실패:", error);
      }
    },
    [roomId, currentTurn, conversations, currentTurnSentences],
  );

  // --- Effect 로직 ---

  // 👇 [New] OpenVidu 마이크 제어 로직 (쉐도잉 진행 중에는 음소거, 결과 리포트 시에만 해제)
  useEffect(() => {
    if (!publisher) return;

    // 대화가 허용되는 단계: 결과 리포트 화면 또는 완전히 종료된 화면
    const isConversationStep = (step === STEP.TURN_REPORT || step === STEP.ALL_DONE || step === STEP.IDLE);

    if (isConversationStep) {
      // 결과 화면에서는 팀원들과 대화할 수 있도록 마이크 Unmute
      console.log(`🎤 [OpenVidu] 결과 확인 단계(${step}) -> 마이크 Unmute`);
      publisher.publishAudio(true);
      
      // 음소거가 풀릴 때만 알림 표시 (쉐도잉 -> 결과 화면 전환 시)
      if (prevIsConversationStepRef.current === false) {
        showToast("팀원들과 대화가 가능합니다. 🎙️");
      }
    } else {
      // 쉐도잉 진행 중(AI 재생, 녹음 대기, 실제 녹음 등)에는 집중과 에코 방지를 위해 항상 Mute
      console.log(`🎤 [OpenVidu] 쉐도잉 진행 단계(${step}) -> 마이크 Mute`);
      publisher.publishAudio(false);
    }
    
    prevIsConversationStepRef.current = isConversationStep;
  }, [step, publisher, showToast]);

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
          const errorMsg = `턴 ${currentTurn}에 대화 내용이 없습니다.`;
          console.log(`[RecordingPage] ${errorMsg}`);
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

      // ★ 스크립트가 아직 로드되지 않은 경우 대기
      if (conversations[currentTurn] === undefined) {
        console.log(
          `⏳ [RecordingPage] turn ${currentTurn} 스크립트 로드 대기 중...`,
        );
        return;
      }

      // ★ 해당 턴의 스크립트가 빈 배열인 경우 (스크립트 없음)
      if (conversations[currentTurn].length === 0) {
        console.log(
          `⚠️ [RecordingPage] turn ${currentTurn} 스크립트가 없음 - 동기화 단계로 이동`,
        );
        setTimeout(() => {
          setStep(STEP.TURN_REPORT);
        }, 1000); 
        return;
      }

      // 정상: 3초 카운트다운 시작
      console.log("✅ [STEP] AI_TIMER 카운트다운 시작 (3초)");
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
      
      // 문장 길이에 따른 동적 시간 계산 (단어 수 기준)
      const words = currentSentence?.english?.split(' ')?.length || 0;
      const dynamicDuration = Math.max(8, Math.min(30, Math.ceil(words * 1.5) + 5));
      
      console.log(`🎙️ [RecordingPage] 문장 길이(${words}단어)에 따른 제한시간 설정: ${dynamicDuration}초`);
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
      console.log("[RecordingPage] TURN_REPORT 진입 → 점수 조회");
      fetchTurnResults(currentTurn);
    }
  }, [step, currentTurn, roomId, fetchTurnResults]);

  // 스크립트 에러 발생 시 동기화 단계로 진입
  useEffect(() => {
    if (scriptError) {
      console.log("[RecordingPage] 스크립트 오류 발생 - 동기화 단계로 이동");
      const timer = setTimeout(() => {
        setStep(STEP.TURN_REPORT);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [scriptError]);

  // UI 데이터 가공
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
      console.log("🔍 [RecordingPage] resultsMap:", resultsMap); // ← 이 줄 추가!
    }

    return currentTurnSentences.map((s, i) => {
      const resultData = resultsMap[s.scriptId];
      const finalScore = resultData?.score ?? sentenceScores[s.id];

      console.log(
        `🔍 [Card ${i}] scriptId:${s.scriptId}, id:${s.id}, score:${finalScore}, averageScore:${resultData?.averageScore}`,
      );

      // scriptId는 고유하므로 scriptId만 사용 (턴 번호 불필요)
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
    console.log("⏹️ [RecordingPage] 사용자가 녹음을 수동으로 종료했습니다.");
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
            스크립트를 불러오는 중입니다...
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
        // 모든 턴(중간 및 마지막)에 대해 동기화 로직(준비/시작) 적용
        const readyCount = participants.filter(p => !p.isHost && p.isReady).length;
        const totalToReady = participants.length - 1;
        const isLastTurn = currentTurn >= TURNS;

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
            {/* 스크립트 에러/내용없음 메시지가 있으면 버튼 위에 표시 */}
            {scriptError && (
              <p style={{ fontSize: "15px", color: "#6b7280", marginBottom: "4px", whiteSpace: "pre-line" }}>
                {scriptError}
              </p>
            )}

            {/* 준비 현황을 모든 유저에게 표시 */}
            <div style={{ fontSize: "14px", color: "#666", fontWeight: "500" }}>
              {participants.length > 1 
                ? `팀원 준비 현황: ${readyCount} / ${totalToReady}`
                : "참여자를 기다리고 있습니다."}
            </div>

            {roomInfo.isHost ? (
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
                다음 단계로
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
                {isReady ? "준비 완료!" : "준비하기"}
              </button>
            )}
          </div>
        );
      case STEP.ALL_DONE:
        return (
          <BottomAllDone onRestart={restart} onComplete={handleComplete} isHost={amIHost} />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* 👇 소리 재생용 컴포넌트 추가 */}
      {subscribers.map((sub, i) => (
        <div key={i} style={{ display: 'none' }}>
          <UserAudioComponent streamManager={sub} />
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
      onToggleBlanks={() => {
        console.log("🔄 [RecordingPage] 빈칸 모드 토글:", !showBlanks);
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
      logoExitMessage="메인 화면으로 나가시겠습니까?"
      onLogoExit={handleLogoExit}
      />
      {isTransitioning && (
        <LoadingOverlay
          title="대화 단계로 이동합니다!"
          subtitle="팀원들과 즐거운 대화를 나눠보세요."
          image={duckTogether}
        />
      )}
      {toastMessage && <div className={styles.Toast}>{toastMessage}</div>}
    </>
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
