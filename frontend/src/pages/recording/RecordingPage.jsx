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
import { convertWebMToWav } from "@/utils/audioConverter";

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
  // 👇 OpenVidu Publisher, Subscribers, leaveSession 가져오기
  const { publisher, subscribers, leaveSession } = useOpenVidu(); 

  const roomInfo = state?.roomInfo || {};
  const myUserId = state?.myUserId; // 본인 userId
  const participants = state?.participants || []; // 참여자 목록

  console.log("[RecordingPage] 페이지 로드 - 전체 state:", state);
  console.log("[RecordingPage] roomInfo:", roomInfo);
  console.log("[RecordingPage] myUserId:", myUserId);
  console.log("[RecordingPage] participants:", participants);

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
  const [turnResults, setTurnResults] = useState({});

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
            const webmBlob = new Blob(recordedChunksRef.current, {
              type: mimeType || "audio/webm",
            });

            console.log("🎤 녹음 파일 변환 시작...", webmBlob.size, "bytes");
            const wavBlob = await convertWebMToWav(webmBlob);
            console.log("✅ WAV 변환 완료:", wavBlob.size, "bytes");

            if (roomId) {
              await saveAssessment(
                wavBlob,
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

    navigate("/together/talk", {
      replace: true,
      state: navigationState,
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

  const handleBookmarkToggle = useCallback(
    async (sentenceId, isBookmarked) => {
      try {
        // sentenceId는 order_no가 아니라 실제 scriptId여야 함
        // currentTurnSentences에서 해당 문장 찾기
        const sentence = currentTurnSentences.find((s) => s.id === sentenceId);
        const scriptIdToUse = sentence?.scriptId || sentenceId;

        //현재 보고 있는 턴 번호 계산 (리포트 화면이면 선택된 턴, 아니면 현재 턴)
        const targetTurn = selectedTurnForReport || currentTurn;

        console.log("[RecordingPage] 북마크 토글:", {
          sentenceId,
          scriptIdToUse,
          roomId, // roomId 확인용 로그 추가
          isBookmarked,
          turnNo: targetTurn,
        });

        await toggleScriptLike(scriptIdToUse, roomId, targetTurn);

        // 턴별로 구분되는 복합 키 사용 (turn-sentenceId)
        const bookmarkKey = `${targetTurn}-${sentenceId}`;
        setBookmarkedSentences((prev) => {
          const next = isBookmarked
            ? [...new Set([...prev, bookmarkKey])]
            : prev.filter((id) => id !== bookmarkKey);
          localStorage.setItem("bookmarkedSentences", JSON.stringify(next));
          console.log("[RecordingPage] 북마크 업데이트:", next);
          return next;
        });
      } catch (error) {
        console.error("북마크 실패:", error);
        alert("북마크 저장에 실패했습니다.");
      }
    },
    [currentTurnSentences, roomId, selectedTurnForReport],
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
    },
    roomId,
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
        console.log(
          `[RecordingPage] API 호출 파라미터: roomId=${roomId}, turnNo=${currentTurn}`,
        );
        console.log(
          `[RecordingPage] API URL: /api/v1/session/${roomId}/turns/${currentTurn}/scripts`,
        );

        const response = await getTurnScripts(roomId, currentTurn);

        console.log(
          `[RecordingPage] turn ${currentTurn} 스크립트 API 응답:`,
          response,
        );
        console.log(
          `[RecordingPage] 응답 타입:`,
          typeof response,
          Array.isArray(response) ? "배열" : "객체",
        );

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
          .filter((s) => s && s.scriptId) // null/undefined 필터링
          .sort((a, b) => (a.order_no || 0) - (b.order_no || 0))
          .map((s, i) => {
            console.log(
              `[RecordingPage] ===== 스크립트 ${i + 1} 원본 데이터 =====`,
            );
            console.log(
              "[RecordingPage] 전체 객체:",
              JSON.stringify(s, null, 2),
            );
            console.log("[RecordingPage] 모든 키:", Object.keys(s));

            // 발화자 이름 추출 (speakerName만 사용, speakerId는 없음)
            let speakerName =
              s.speakerName ||
              s.speaker ||
              s.userName ||
              s.nickname ||
              s.name ||
              s.speaker_name ||
              s.user_name ||
              s.memberName ||
              s.member_name ||
              null;

            console.log(
              "[RecordingPage] 백엔드에서 받은 speakerName:",
              speakerName,
            );

            // speakerName이 없으면 participants에서 가져오기
            if (!speakerName && participants && participants.length > 0) {
              console.log(
                "[RecordingPage] speakerName이 없어서 participants 사용",
              );
              const firstParticipant = participants[0];
              speakerName =
                firstParticipant?.name ||
                firstParticipant?.nickname ||
                "참여자";
            }

            // 여전히 이름이 없으면 기본값
            if (!speakerName || speakerName === "Unknown") {
              speakerName = "참여자";
            }

            // 본인인지 판단: participants의 isMe로 확인
            // (speakerId가 없으므로 participants 배열에서 isMe === true인지 확인)
            let isMe = false;
            if (participants && participants.length > 0) {
              const myParticipant = participants.find((p) => p.isMe === true);
              if (myParticipant) {
                // 내가 유일한 참여자이면 모든 발화가 내 것
                isMe = participants.length === 1 && myParticipant.isMe;
              }
            }

            const displayName = isMe ? `${speakerName}(나)` : speakerName;

            console.log(`[RecordingPage] 스크립트 ${i + 1} 발화자 최종 결과:`, {
              speakerName,
              myUserId,
              isMe,
              displayName,
              participantsCount: participants?.length || 0,
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

        console.log(
          `[RecordingPage] turn ${currentTurn} 스크립트 포맷팅 완료 (${formatted.length}개):`,
          formatted,
        );
        setConversations((prev) => ({ ...prev, [currentTurn]: formatted }));
        setIsLoadingScript(false);
      } catch (e) {
        console.error(
          `[RecordingPage] turn ${currentTurn} 스크립트 로드 실패:`,
          e,
        );
        const errorMsg = `턴 ${currentTurn}의 스크립트를 불러오는 중 오류가 발생했습니다.\n${e.message || "네트워크 오류"}`;
        setScriptError(errorMsg);
        setConversations((prev) => ({ ...prev, [currentTurn]: [] }));
        setIsLoadingScript(false);
      }
    };
    fetchTurnScripts();
  }, [currentTurn, roomId, conversations]);

  // 메인 타이머 및 자동 흐름 제어
  useEffect(() => {
    console.log("🎬 ========== useEffect 실행 ==========");
    console.log("[RecordingPage] 현재 step:", step);
    console.log("[RecordingPage] currentTurn:", currentTurn);
    console.log(
      "[RecordingPage] conversations[currentTurn]:",
      conversations[currentTurn],
    );
    console.log("[RecordingPage] currentSentence:", currentSentence);
    console.log("[RecordingPage] currentSentenceIndex:", currentSentenceIndex);
    console.log("======================================");

    clearAllTimers();

    if (step === STEP.AI_TIMER) {
      console.log("📍 [STEP] AI_TIMER 단계 진입");

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
            console.log(
              "⏰ [STEP] AI_TIMER 카운트다운 종료 → AI_PLAYING으로 전환",
            );
            clearAllTimers();
            setStep(STEP.AI_PLAYING);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else if (step === STEP.RECORD_TIMER) {
      console.log("📍 [STEP] RECORD_TIMER 단계 진입");
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
        // [수정 1] 주소 보정 (이것만 추가됨)
        let ttsUrl = currentSentence.tts_url;
        if (ttsUrl && ttsUrl.startsWith("/audio")) {
          ttsUrl = ttsUrl.replace("/audio", "/api/v1/audio");
        }

        // [로그: 원본 그대로 유지]
        console.log("🔊 ========== TTS 재생 시작 ==========");
        console.log("[RecordingPage] 원본 tts_url:", currentSentence.tts_url);
        console.log("[RecordingPage] 사용할 URL (프록시 통과):", ttsUrl);
        console.log("======================================");

        // [변수: 원본 유지]
        const accessToken = localStorage.getItem("accessToken");

        // [로그: 원본 그대로 유지]
        console.log("📥 [TTS] fetch로 오디오 파일 다운로드 시작...");

        // [수정 2] fetch -> api.get 교체 (헤더 설정 불필요)
        api
          .get(ttsUrl, {
            headers: accessToken
              ? {
                  Authorization: `Bearer ${accessToken}`,
                }
              : {},
            responseType: "blob", // [필수 설정]
          })
          .then((response) => {
            // [로그: 원본 그대로 유지] (Axios response 객체도 status, statusText 가짐)
            console.log(
              "📥 [TTS] fetch 응답:",
              response.status,
              response.statusText,
            );

            // [수정 3] if (!response.ok) 체크 삭제 & .blob() 삭제
            // Axios는 에러나면 catch로 가고, data가 바로 Blob임
            const blob = response.data;

            // [로그: 원본 그대로 유지]
            console.log(
              "✅ [TTS] Blob 생성 완료:",
              blob.size,
              "bytes, type:",
              blob.type,
            );

            // [이하 로직 원본 100% 동일]
            const blobUrl = URL.createObjectURL(blob);
            console.log("✅ [TTS] Blob URL 생성:", blobUrl);

            const audio = new Audio(blobUrl);
            audioRef.current = audio;

            audio.onended = () => {
              console.log("✅ [TTS] 재생 완료");
              URL.revokeObjectURL(blobUrl);
              setStep(STEP.RECORD_TIMER);
            };

            audio.onerror = (event) => {
              console.error("❌ [TTS] 오디오 재생 에러:", {
                event,
                error: audio.error,
                errorCode: audio.error?.code,
              });
              URL.revokeObjectURL(blobUrl);
              setStep(STEP.RECORD_TIMER);
            };

            audio
              .play()
              .then(() => {
                console.log("✅ [TTS] 재생 시작 성공!");
              })
              .catch((err) => {
                console.error("❌ [TTS] play() 실패:", err.message);
                URL.revokeObjectURL(blobUrl);
                setStep(STEP.RECORD_TIMER);
              });
          })
          .catch((err) => {
            // [로그: 원본 그대로 유지]
            console.error("❌ [TTS] fetch 실패:", {
              에러: err.message,
              URL: ttsUrl,
            });
            setStep(STEP.RECORD_TIMER);
          });
      } else {
        // [원본 유지]
        console.warn("⚠️ [RecordingPage] TTS URL이 없어서 기본 타이머 사용");
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
        `🔍 [Card ${i}] scriptId:${s.scriptId}, score:${finalScore}, averageScore:${resultData?.averageScore}`,
      );

      // 턴별로 구분되는 복합 키 사용 (turn-sentenceId)
      const bookmarkKey = `${currentTurn}-${s.id}`;
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
          <BottomAllDone onRestart={restart} onComplete={handleComplete} />
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
