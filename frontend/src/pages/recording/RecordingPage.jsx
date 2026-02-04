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
import { leaveRoom } from "@/api/rooms";
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
  const participants = state?.participants || []; // 참여자 목록

  console.log("[RecordingPage] 페이지 로드 - 전체 state:", state);

  const TURNS = roomInfo.turnCount || 3;

  const [step, setStep] = useState(STEP.AI_TIMER);
  const [isTransitioning, setIsTransitioning] = useState(false);
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
      console.log("[RecordingPage] 마지막 턴 완료 - ALL_DONE으로 전환");
      setStep(STEP.ALL_DONE);
      return;
    }

    // 다음 턴이 있으면 TogetherTalkPage로 돌아가기
    const nextTurn = currentTurn + 1;
    const navigationState = {
      ...state,
      currentTurn: nextTurn, // 최상위 레벨에도 턴 번호 전달
      roomInfo: {
        ...roomInfo,
        roomId: roomId,
        roomCode: roomCode,
        currentTurn: nextTurn, // roomInfo 내부에도 턴 번호 전달
      },
      myUserId,
    };

    console.log("[RecordingPage] 다음 턴으로 이동:", {
      currentTurn,
      nextTurn,
      TURNS,
      roomId,
      roomCode,
      전달할State: navigationState,
    });

    setIsTransitioning(true);
    setTimeout(() => {
      navigate("/together/talk", {
        replace: true,
        state: navigationState,
      });
    }, 5000);
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

  useRoomWebSocket(
    roomCode,
    {
      onRoomClosed: handleRoomClosed,
      onMiniGameStart: handleMiniGameStart,
    },
    roomId
  );

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
    } else {
      // 쉐도잉 진행 중(AI 재생, 녹음 대기, 실제 녹음 등)에는 집중과 에코 방지를 위해 항상 Mute
      console.log(`🎤 [OpenVidu] 쉐도잉 진행 단계(${step}) -> 마이크 Mute`);
      publisher.publishAudio(false);
    }
  }, [step, publisher]);

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
          const errorMsg = currentTurn >= TURNS
            ? `턴 ${currentTurn}에 대화 내용이 없습니다.\n잠시 후 결과 화면으로 이동합니다.`
            : `턴 ${currentTurn}에 대화 내용이 없습니다.\n잠시 후 다음 턴으로 이동합니다.`;
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
          `⚠️ [RecordingPage] turn ${currentTurn} 스크립트가 없음 - 다음 턴으로 자동 진행`,
        );
        // 스크립트가 없어도 다음 턴으로 진행
        setTimeout(() => {
          goNextTurn();
        }, 2000); // 2초 대기 후 다음 턴으로
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

  useEffect(() => {
    if (step === STEP.TURN_REPORT && roomId && currentTurn) {
      console.log("[RecordingPage] TURN_REPORT 진입 → 점수 조회");
      fetchTurnResults(currentTurn);
    }
  }, [step, currentTurn, roomId, fetchTurnResults]);

  // 스크립트 에러 발생 시 자동으로 다음 턴으로 진행
  useEffect(() => {
    if (scriptError) {
      console.log("[RecordingPage] 스크립트 오류 발생 - 3초 후 자동 진행");
      const timer = setTimeout(() => {
        goNextTurn();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [scriptError, goNextTurn]);

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
          <BottomAllDone onRestart={restart} onComplete={handleComplete} isHost={roomInfo.isHost} />
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
          title="새로운 턴이 시작됩니다!"
          subtitle="다시 즐거운 대화를 시작해볼까요?"
          image={duckTogether}
        />
      )}
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
