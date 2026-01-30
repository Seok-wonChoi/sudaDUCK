import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import ExitButton from "@/components/common/ExitButton/ExitButton";

import duckImg from "@/assets/images/duck.png";
import micOnIcon from "@/assets/icons/mic_on.png";
import micOffIcon from "@/assets/icons/mic_off.png";
import usersIcon from "@/assets/icons/users_icon.png";
import copyIcon from "@/assets/icons/copy_icon.png";
import shareIcon from "@/assets/icons/kakaotalk_icon.png";

import styles from "./WaitingRoomPage.module.css";

import { leaveRoom, getRoomLobby, toggleReady, startRoom, updateRoomSettings, getTopics } from "@/api/rooms";
import useRoomWebSocket from "@/hooks/useRoomWebSocket";

const ROOM_INFO_KEY = "together_room_info";

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
      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2" fill="none"/>
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
      <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M8.59 13.51L15.42 17.49" stroke="currentColor" strokeWidth="2"/>
      <path d="M15.41 6.51L8.59 10.49" stroke="currentColor" strokeWidth="2"/>
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

  const roomInfo = state ?? {};
  const isHost = roomInfo.isHost ?? false;
  const maxCount = roomInfo.maxCount ?? 4;

  // 방 코드는 joinCode / inviteCode 둘 중 하나로 넘어오므로 여기서 통일
  const inviteCode = roomInfo.joinCode ?? roomInfo.inviteCode ?? "000000";

  // 방 정보 상태 관리 (수정 가능하도록 useState 사용)
  const [roomTitle, setRoomTitle] = useState(roomInfo.roomTitle ?? "수다방");
  const [topic, setTopic] = useState(roomInfo.topic ?? roomInfo.roomTopic ?? "좋아하는 음식");
  const [turnCount, setTurnCount] = useState(roomInfo.turnCount ?? 3);

  // 참여자 목록: email 기반으로 관리
  // { email, nickname, isHost, isReady, micOn }
  const [participants, setParticipants] = useState([]);
  const [myEmail, setMyEmail] = useState(""); // 내 이메일 (lobby 응답에서 받음)
  const [readyCount, setReadyCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [myMicOn, setMyMicOn] = useState(true);
  const [toastMessage, setToastMessage] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);

  // 방 설정 변경 팝업 상태
  const [editPopupOpen, setEditPopupOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(roomTitle);
  const [editTopic, setEditTopic] = useState(topic);
  const [editTurn, setEditTurn] = useState(turnCount);

  const hotTopics = useMemo(
    () => [
      "첫 아르바이트 추억",
      "최악의 데이트",
      "나만의 취미생활",
      "학창시절 이야기",
      "여행 경험담",
      "좋아하는 음식",
    ],
    []
  );

  // 재연결 시 lobby 다시 호출하기 위한 ref
  const fetchLobbyRef = useRef(null);

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

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 2000);
  }, []);

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
      } catch (e) {
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
      } catch (e) {
        // ignore
      }

      tick();
    } catch (e) {
      setIsSpeaking(false);
      setVoiceLevel(0);
    }
  }, []);

  // 페이지 로드 시 마이크 자동 켜기
  useEffect(() => {
    startAudioAnalysis();

    return () => {
      stopAudioAnalysis();
    };
  }, [startAudioAnalysis, stopAudioAnalysis]);

  // lobby API 호출: 참여자 목록 + 상태 가져오기
  const fetchLobby = useCallback(async () => {
    if (!inviteCode || inviteCode === "000000") {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getRoomLobby(inviteCode);

      console.log("lobby API 응답:", data);

      // 실제 API 응답 구조: { roomId, roomCode, isOpen, participants: [...] }
      const members = data.participants ?? [];

      // localStorage에서 현재 사용자 정보 가져오기
      const userInfoStr = localStorage.getItem("userInfo");
      let myUserId = null;
      if (userInfoStr) {
        try {
          const userInfo = JSON.parse(userInfoStr);
          myUserId = userInfo.userId ?? userInfo.id ?? userInfo.memberId;
          console.log("[fetchLobby] localStorage userInfo:", userInfo);
          console.log("[fetchLobby] myUserId:", myUserId);
        } catch (e) {
          console.error("userInfo 파싱 실패:", e);
        }
      }

      // myUserId가 없으면 방장을 찾아서 설정 (방장이면 자기 자신)
      if (!myUserId && isHost) {
        const hostMember = members.find((m) => m.isHost === true);
        if (hostMember) {
          myUserId = hostMember.userId;
          console.log("[fetchLobby] 방장으로부터 myUserId 설정:", myUserId);
        }
      }

      // 여전히 myUserId가 없으면, API 응답에서 현재 사용자 찾기 시도
      if (!myUserId) {
        const meInResponse = members.find((m) => m.isMe === true);
        if (meInResponse) {
          myUserId = meInResponse.userId;
          console.log("[fetchLobby] API 응답에서 현재 사용자 찾음:", myUserId);
        }
      }

      // email 대신 userId를 문자열로 변환해서 사용
      const myEmailStr = myUserId ? String(myUserId) : "";
      setMyEmail(myEmailStr);

      // 준비 완료한 참여자 수 계산 (방장 제외)
      const readyMembers = members.filter((m) => !m.isHost && m.readyStatus === "READY");
      setReadyCount(readyMembers.length);
      setTotalCount(members.length);

      // 참여자 목록 변환 (userId를 email 필드로 사용)
      const mappedParticipants = members.map((m) => ({
        email: String(m.userId ?? ""), // userId를 문자열로 변환
        nickname: m.nickname ?? "참여자",
        isHost: m.isHost ?? false,
        isReady: m.readyStatus === "READY",
        micOn: m.micOn ?? true, // 기본값 true
        voiceLevel: 0, // 초기 음성 레벨
      }));

      console.log("매핑된 참여자 목록:", mappedParticipants);
      console.log("현재 사용자 ID:", myEmailStr);

      setParticipants(mappedParticipants);
    } catch (e) {
      console.error("lobby API 호출 실패:", e);
      showToast("참여자 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [inviteCode, showToast, isHost]);

  // ref에 저장 (재연결 시 호출용)
  fetchLobbyRef.current = fetchLobby;

  // 초기 진입 시 lobby API 호출
  useEffect(() => {
    fetchLobby();
  }, [fetchLobby]);

  // 디버깅: participants와 myEmail 변경 시 로그 출력
  useEffect(() => {
    console.log("[디버깅] 참여자 상태 변경:", {
      myEmail,
      participantsCount: participants.length,
      participants: participants.map(p => ({
        email: p.email,
        nickname: p.nickname,
        isMe: p.email === myEmail,
        micOn: p.micOn,
        isReady: p.isReady
      })),
      myMicOn
    });
  }, [participants, myEmail, myMicOn]);

  const currentCount = totalCount || participants.length;

  // WebSocket 이벤트 핸들러: 멤버 참여
  const handleMemberJoined = useCallback((payload, senderKey) => {
    console.log("[handleMemberJoined] 새로운 멤버가 참여했습니다!", {
      payload,
      senderKey
    });
    // 참여자 목록 다시 가져오기
    console.log("[handleMemberJoined] fetchLobby 호출");
    fetchLobbyRef.current?.();
  }, []);

  // WebSocket 이벤트 핸들러: READY_CHANGED
  // payload.memberId 우선, 없으면 senderKey 사용
  const handleReadyChanged = useCallback(
    (payload, senderKey) => {
      // 백엔드 권장 방식: payload.memberId 우선, 없으면 senderKey 사용
      const targetUserId = payload.memberId ? String(payload.memberId) : senderKey;

      console.log("READY_CHANGED 수신:", { payload, senderKey, targetUserId });

      // 서버에서 받은 readyCount, totalCount 업데이트 (프론트에서 계산 금지!)
      if (payload.readyCount !== undefined) {
        setReadyCount(payload.readyCount);
      }
      if (payload.totalCount !== undefined) {
        setTotalCount(payload.totalCount);
      }

      // targetUserId로 해당 참여자의 준비 상태 업데이트
      if (targetUserId) {
        // myReadyStatus가 있으면 해당 유저의 새 상태
        const newReadyStatus =
          payload.myReadyStatus === "READY" || payload.ready === true;

        console.log(`[handleReadyChanged] ${targetUserId}의 준비 상태를 ${newReadyStatus}로 업데이트`);

        setParticipants((prev) =>
          prev.map((p) =>
            p.email === targetUserId ? { ...p, isReady: newReadyStatus } : p
          )
        );
      }
    },
    []
  );

  // WebSocket 이벤트 핸들러: MIC_CHANGED
  // payload.memberId 우선, 없으면 senderKey 사용
  const handleMicChanged = useCallback(
    (payload, senderKey) => {
      // 백엔드 권장 방식: payload.memberId 우선, 없으면 senderKey 사용
      const targetUserId = payload.memberId ? String(payload.memberId) : senderKey;

      console.log("[handleMicChanged] MIC_CHANGED 수신:", {
        payload,
        senderKey,
        targetUserId,
        myEmail,
        isMyChange: targetUserId === myEmail
      });

      if (!targetUserId) {
        console.warn("[handleMicChanged] targetUserId를 확인할 수 없습니다.");
        return;
      }

      // 내 마이크는 로컬 상태(myMicOn)로만 관리, 다른 사람의 마이크만 업데이트
      if (targetUserId === myEmail) {
        console.log("[handleMicChanged] 내 마이크 상태 변경은 로컬에서 이미 관리 중입니다. 무시합니다.");
        return;
      }

      console.log(`[handleMicChanged] ${targetUserId}의 마이크 상태를 ${payload.micOn}으로 업데이트합니다.`);

      // 다른 사람의 마이크 상태만 업데이트
      setParticipants((prev) =>
        prev.map((p) =>
          p.email === targetUserId ? { ...p, micOn: payload.micOn } : p
        )
      );
    },
    [myEmail]
  );

  // WebSocket 이벤트 핸들러: VOICE_LEVEL_CHANGED
  // payload.memberId 우선, 없으면 senderKey 사용
  const handleVoiceLevelChanged = useCallback(
    (payload, senderKey) => {
      // 백엔드 권장 방식: payload.memberId 우선, 없으면 senderKey 사용
      const targetUserId = payload.memberId ? String(payload.memberId) : senderKey;

      if (!targetUserId) return;

      // 내 음성 레벨은 로컬에서 관리하므로 무시
      if (targetUserId === myEmail) return;

      // 다른 참여자의 음성 레벨 업데이트
      setParticipants((prev) =>
        prev.map((p) =>
          p.email === targetUserId ? { ...p, voiceLevel: payload.level ?? 0 } : p
        )
      );
    },
    [myEmail]
  );

  const handleWebSocketError = useCallback(
    (errorMessage) => {
      console.error("WebSocket ERROR:", errorMessage);
      showToast(errorMessage || "오류가 발생했습니다.");
    },
    [showToast]
  );

  // WebSocket 재연결 시 lobby 다시 호출해서 상태 동기화
  const handleConnected = useCallback(() => {
    console.log("WebSocket 연결됨");
    // 재연결 시 상태 동기화
    fetchLobbyRef.current?.();
  }, []);

  // WebSocket 연결
  const { sendReady, sendMic, sendVoiceLevel } = useRoomWebSocket(inviteCode, {
    onReadyChanged: handleReadyChanged,
    onMicChanged: handleMicChanged,
    onMemberJoined: handleMemberJoined,
    onVoiceLevelChanged: handleVoiceLevelChanged,
    onError: handleWebSocketError,
    onConnected: handleConnected,
    onDisconnected: () => console.log("WebSocket 연결 해제됨"),
  });

  // 음성 레벨 브로드캐스트 (마이크가 켜져있고 연결되어 있을 때만)
  useEffect(() => {
    if (!myMicOn || !sendVoiceLevel) return;

    // 100ms마다 음성 레벨 전송 (서버 부하 고려)
    const interval = setInterval(() => {
      if (myMicOn) {
        sendVoiceLevel(voiceLevel);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [myMicOn, voiceLevel, sendVoiceLevel]);

  // 내 정보 찾기: email 기반
  const me = useMemo(
    () => participants.find((p) => p.email === myEmail),
    [participants, myEmail]
  );
  const myReady = me?.isReady ?? false;

  const nonHostAllReady = useMemo(
    () => participants.filter((p) => !p.isHost).every((p) => p.isReady),
    [participants]
  );

  const canStart = isHost && nonHostAllReady;

  // 마이크 토글: 로컬 상태 즉시 변경 + WebSocket 전송
  const toggleMyMic = useCallback(async () => {
    const newMicState = !myMicOn;
    console.log(`[toggleMyMic] 내 마이크 상태 변경: ${myMicOn} -> ${newMicState}, myEmail: ${myEmail}`);

    if (myMicOn) {
      setMyMicOn(false);
      await stopAudioAnalysis();
      // WebSocket으로 마이크 상태 전송
      console.log("[toggleMyMic] sendMic(false) 호출 시작");
      sendMic(false);
      console.log("[toggleMyMic] sendMic(false) 호출 완료");
      return;
    }

    setMyMicOn(true);
    await startAudioAnalysis();
    console.log("[toggleMyMic] sendMic(true) 호출 시작");
    // WebSocket으로 마이크 상태 전송
    sendMic(true);
    console.log("[toggleMyMic] sendMic(true) 호출 완료");
  }, [myMicOn, startAudioAnalysis, stopAudioAnalysis, sendMic, myEmail]);

  // 준비 상태 토글: 즉시 로컬 상태 업데이트 + API 호출 + WebSocket으로 전송
  const toggleMyReady = useCallback(async () => {
    const newReadyState = !myReady;

    console.log(`[toggleMyReady] 준비 상태 변경: ${myReady} -> ${newReadyState}`);

    // 즉시 로컬 상태 업데이트 (낙관적 업데이트)
    setParticipants((prev) =>
      prev.map((p) =>
        p.email === myEmail ? { ...p, isReady: newReadyState } : p
      )
    );

    // API 호출: 준비 상태 토글
    try {
      await toggleReady(inviteCode);
    } catch (e) {
      console.error("준비 상태 변경 API 호출 실패:", e);
      // API 실패 시 롤백
      setParticipants((prev) =>
        prev.map((p) =>
          p.email === myEmail ? { ...p, isReady: !newReadyState } : p
        )
      );
      showToast("준비 상태 변경에 실패했습니다.");
      return;
    }

    // WebSocket으로 준비 상태 전송
    sendReady(newReadyState);
  }, [myReady, sendReady, myEmail, inviteCode, showToast]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      showToast("참여 코드가 복사되었습니다!");
    } catch (e) {
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
        showToast("공유가 완료되었습니다!");
      } catch (e) {
        if (e.name !== "AbortError") {
          showToast("공유에 실패했습니다.");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(
          `참여 코드: ${inviteCode}\n방 제목: ${roomTitle}\n주제: ${topic}`
        );
        showToast("초대 정보가 복사되었습니다!");
      } catch (e) {
        showToast("공유에 실패했습니다.");
      }
    }
  }, [inviteCode, roomTitle, topic, showToast]);

  const handleEditRoomInfo = useCallback(() => {
    if (!isHost) return;
    setEditTitle(roomTitle);
    setEditTopic(topic);
    setEditTurn(turnCount);
    setEditPopupOpen(true);
  }, [isHost, roomTitle, topic, turnCount]);

  const handleCloseEditPopup = useCallback(() => {
    setEditPopupOpen(false);
  }, []);

  const handleEditTitleChange = useCallback((e) => {
    const next = e.target.value.slice(0, 30);
    setEditTitle(next);
  }, []);

  const handleEditTopicChange = useCallback((e) => {
    setEditTopic(e.target.value);
  }, []);

  const handlePickEditTopic = useCallback((t) => {
    setEditTopic(t);
  }, []);

  const handleAiRecommend = useCallback(async () => {
    // API 호출: AI 주제 추천받기
    try {
      const data = await getTopics();
      const topics = data.topics || [];
      if (topics.length > 0) {
        // 서버에서 받은 주제 중 랜덤 선택
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        setEditTopic(randomTopic);
        return;
      }
    } catch (e) {
      console.error("AI 주제 추천 API 호출 실패:", e);
      // API 실패 시 로컬 hotTopics로 폴백
    }

    // 폴백: 로컬 주제 목록 사용
    if (hotTopics.length > 0) {
      const next = hotTopics[Math.floor(Math.random() * hotTopics.length)];
      setEditTopic(next);
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

    // API 호출: 방 설정 업데이트
    try {
      await updateRoomSettings(inviteCode, {
        title: editTitle.trim(),
        topic: editTopic.trim(),
        turnCnt: editTurn,
      });
      console.log("방 설정 업데이트 API 호출 성공");
    } catch (e) {
      console.error("방 설정 업데이트 API 호출 실패:", e);
      showToast("방 설정 변경에 실패했습니다.");
      return;
    }

    // 방 정보 상태 업데이트
    setRoomTitle(editTitle.trim());
    setTopic(editTopic.trim());
    setTurnCount(editTurn);

    // sessionStorage에 저장된 roomInfo도 업데이트
    try {
      const storedRoomInfo = sessionStorage.getItem("together_room_info");
      if (storedRoomInfo) {
        const parsedInfo = JSON.parse(storedRoomInfo);
        const updatedInfo = {
          ...parsedInfo,
          roomTitle: editTitle.trim(),
          topic: editTopic.trim(),
          turnCount: editTurn,
        };
        sessionStorage.setItem("together_room_info", JSON.stringify(updatedInfo));
      }
    } catch (e) {
      console.error("sessionStorage 업데이트 실패:", e);
    }

    showToast("방 설정이 변경되었습니다!");
    setEditPopupOpen(false);
  }, [editTitle, editTopic, editTurn, showToast, inviteCode]);

  const handleStart = useCallback(async () => {
    if (!canStart) return;

    // API 호출: 방 시작하기
    try {
      await startRoom(inviteCode);
      console.log("방 시작 API 호출 성공");
    } catch (e) {
      console.error("방 시작 API 호출 실패:", e);
      showToast("방을 시작하는데 실패했습니다.");
      return;
    }

    navigate("/together/talk", {
      state: {
        ...roomInfo,
        isHost,
        maxCount,
        participants: participants.map((p) => ({
          id: p.email,
          name: p.nickname,
          isMe: p.email === myEmail,
          micOn: p.email === myEmail ? myMicOn : (p.micOn ?? false),
          voiceLevel: 0,
        })),
        myEmail,
      },
    });
  }, [canStart, navigate, roomInfo, isHost, maxCount, participants, myMicOn, myEmail, inviteCode, showToast]);

  const handlePrimary = useCallback(() => {
    if (isHost) handleStart();
    else toggleMyReady();
  }, [isHost, handleStart, toggleMyReady]);

  const primaryLabel = isHost ? "대화 시작하기" : myReady ? "준비 취소" : "준비하기";
  const primaryDisabled = isHost ? !canStart : false;

  /**
   * 방 퇴장: POST /api/v1/rooms/leave
   * Request: { roomCode }
   */
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleExit = useCallback(async () => {
    const roomCode = inviteCode;

    if (!roomCode || roomCode === "000000") {
      // 코드가 없으면 서버 퇴장 처리 불가 → 일단 로컬 정리만
      sessionStorage.removeItem(ROOM_INFO_KEY);
      return;
    }

    await leaveRoom({ roomCode });

    // 로컬 상태 정리(선택)
    sessionStorage.removeItem(ROOM_INFO_KEY);

    // WS 연결 붙이면 여기서 disconnect도 같이 호출(나중에 추가)
    // roomSocket.disconnect?.();
  }, [inviteCode, navigate]);

  return (
    <div className={styles.Page}>
      <div className={styles.Shell}>
        <AppHeader
          userName="user"
          notifications={[]}
          logoExitMessage="메인 화면으로 나가시겠습니까?"
          logoExitConfirmText="나가기"
          logoExitCancelText="취소"
          onLogoExit={handleExit}
        />

        <div className={styles.Top}>
          <button
            className={styles.BackButton}
            onClick={handleBack}
            aria-label="뒤로 가기"
          >
            &lt;
          </button>

          <div className={styles.TopHeaderRow}>
            <ExitButton
              to="/"
              label="나가기"
              message="메인 화면으로 나가시겠습니까?"
              confirmText="나가기"
              cancelText="취소"
              onExit={handleExit}
              replace
            />

            <div className={styles.SpeechRight}>
              <div className={styles.SpeechBubbleRight}>첫 번째 대화 주제는 {topic}입니다!</div>
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
                  <div className={styles.EmptySlotText}>참여자 목록 로딩 중...</div>
                </div>
              ) : (
                Array.from({ length: maxCount }).map((_, index) => {
                  const p = participants[index];

                  if (!p) {
                    return (
                      <div key={`empty-${index}`} className={styles.ParticipantRowEmpty}>
                        <div className={styles.EmptySlotText}>빈 자리</div>
                      </div>
                    );
                  }

                  // email로 나인지 판별
                  const isMe = p.email === myEmail;
                  // 내 마이크는 로컬 상태(myMicOn), 다른 사람은 서버에서 받은 micOn
                  const micOn = isMe ? myMicOn : (p.micOn ?? false);

                  // 디버깅: 각 참여자 렌더링 시 상태 출력
                  if (process.env.NODE_ENV === 'development') {
                    console.log(`[렌더링] ${p.nickname}:`, {
                      email: p.email,
                      isMe,
                      micOn,
                      myMicOn,
                      'p.micOn': p.micOn
                    });
                  }

                  return (
                    <div key={p.email || index} className={styles.ParticipantRow}>
                      <div className={styles.ParticipantLeft}>
                        <div className={styles.UserIconWrap} aria-hidden="true">
                          <img className={styles.UserIconImg} src={usersIcon} alt="" />
                        </div>

                        <div className={styles.InfoColumn}>
                          <div className={styles.NameRow}>
                            <div className={styles.ParticipantName}>
                              {p.nickname}
                              {isMe && " (나)"}
                            </div>

                            {!p.isHost ? (
                              <span
                                className={`${styles.ReadyTag} ${
                                  p.isReady ? styles.ReadyTagOn : styles.ReadyTagOff
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
                            {/* 모든 참여자에게 웨이브바 표시 */}
                            <VoiceWave
                              level={isMe ? voiceLevel : (p.voiceLevel ?? 0)}
                              enabled={micOn}
                            />
                          </div>
                        </div>
                      </div>

                      <div className={styles.ParticipantRight}>
                        {p.isHost ? <span className={styles.HostTag}>방장</span> : null}
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
              <li className={styles.GuideItem}>각 턴마다 1분간 자유롭게 대화하세요</li>
              <li className={styles.GuideItem}>AI가 대화를 분석하고 피드백을 제공합니다</li>
              <li className={styles.GuideItem}>조용한 환경에서 진행하면 더 좋습니다</li>
            </ul>
          </section>
        </div>
      </div>

      {toastMessage && <div className={styles.Toast}>{toastMessage}</div>}

      {editPopupOpen && (
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
                  >
                    AI 추천
                  </button>
                </div>

                <div className={styles.PopupHotRow}>
                  <span className={styles.PopupHotDot} aria-hidden="true" />
                  <span className={styles.PopupHotText}>인기 주제</span>
                </div>

                <div className={styles.PopupTopicRow}>
                  {hotTopics.map((t) => {
                    const active = editTopic === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        className={`${styles.PopupTopicChip} ${
                          active ? styles.PopupTopicChipActive : ""
                        }`}
                        onClick={() => handlePickEditTopic(t)}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.PopupField}>
                <div className={styles.PopupLabelRow}>
                  <span className={styles.PopupLabel}>턴 수</span>
                </div>
                <div className={styles.PopupTurnRow}>
                  {[3, 4, 5].map((n) => {
                    const active = editTurn === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        className={`${styles.PopupTurnCard} ${
                          active ? styles.PopupTurnCardActive : ""
                        }`}
                        onClick={() => setEditTurn(n)}
                      >
                        <span className={styles.PopupTurnIcon} aria-hidden="true">
                          ↻
                        </span>
                        <span className={styles.PopupTurnText}>{n}턴</span>
                      </button>
                    );
                  })}
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
      )}
    </div>
  );
}
