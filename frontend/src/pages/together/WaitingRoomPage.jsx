import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import ExitButton from "@/components/common/ExitButton/ExitButton";

import duckImg from "@/assets/images/duck.png";
import micOnIcon from "@/assets/icons/mic_on.png";
import micOffIcon from "@/assets/icons/mic_off.png";
import usersIcon from "@/assets/icons/users_icon.png";

import styles from "./WaitingRoomPage.module.css";

import {
  leaveRoom,
  getRoomLobby,
  toggleReady,
  startRoom,
  updateRoomSettings,
  getTopics,
} from "@/api/rooms";

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

  // state가 없을 수 있으므로 sessionStorage에서 복구
  const initialRoomInfo = useMemo(() => {
    if (state) return state;
    try {
      const stored = sessionStorage.getItem(ROOM_INFO_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
    return {};
  }, [state]);

  const roomInfo = initialRoomInfo ?? {};
  const maxCount = roomInfo.maxCount ?? 4;

  // 방 코드는 joinCode / inviteCode / roomCode 로 넘어올 수 있음
  const inviteCode =
    roomInfo.joinCode ?? roomInfo.inviteCode ?? roomInfo.roomCode ?? "000000";

  // 방 정보
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

  // 참여자 목록
  // { key(email), nickname, isHost, isReady, micOn, voiceLevel }
  const [participants, setParticipants] = useState([]);
  const participantsRef = useRef([]);
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  const [myKey, setMyKey] = useState(""); // userId 문자열을 key로 사용
  const [readyCount, setReadyCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [myMicOn, setMyMicOn] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  // 음성 분석
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);

  // 방 설정 변경 팝업
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
    [],
  );

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 2000);
  }, []);

  // JWT에서 userId 추출
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
    } catch (e) {
      return null;
    }
  }, []);

  // 오디오 분석
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

  useEffect(() => {
    startAudioAnalysis();
    return () => {
      stopAudioAnalysis();
    };
  }, [startAudioAnalysis, stopAudioAnalysis]);

  // lobby 재조회용 ref
  const fetchLobbyRef = useRef(null);

  // lobby API
  const fetchLobby = useCallback(async () => {
    if (!inviteCode || inviteCode === "000000") {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getRoomLobby(inviteCode);

      const members = data.participants ?? [];

      // roomId / 방 설정 갱신
      if (data.roomId != null) setRoomId(data.roomId);

      const nextTitle = data.title ?? data.roomTitle;
      const nextTopic = data.topic ?? data.roomTopic;
      const nextTurn = data.turnCnt ?? data.turnCount;

      if (typeof nextTitle === "string" && nextTitle.trim())
        setRoomTitle(nextTitle);
      if (typeof nextTopic === "string" && nextTopic.trim())
        setTopic(nextTopic);
      if (nextTurn !== undefined && nextTurn !== null)
        setTurnCount(Number(nextTurn));

      // 내 key 결정
      const tokenKey = getUserIdFromToken();
      const resolvedMyKey =
        tokenKey ?? (roomInfo.myUserId ? String(roomInfo.myUserId) : "");
      if (resolvedMyKey) setMyKey(resolvedMyKey);

      // 카운트
      const readyMembers = members.filter(
        (m) => !m.isHost && m.readyStatus === "READY",
      );

      setReadyCount(readyMembers.length);
      setTotalCount(members.length);

      // 이전 voiceLevel 보존
      const prevMap = new Map(participantsRef.current.map((p) => [p.key, p]));

      const mapped = members.map((m) => {
        const key = String(m.userId ?? "");
        const prev = prevMap.get(key);

        return {
          key,
          nickname: m.nickname ?? "참여자",
          isHost: m.isHost ?? false,
          isReady: m.readyStatus === "READY",
          micOn: m.micOn ?? prev?.micOn ?? true,
          voiceLevel: prev?.voiceLevel ?? 0,
        };
      });

      setParticipants(mapped);

      // sessionStorage 갱신(다음 화면/새로고침 대비)
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
          maxCount,
        };
        sessionStorage.setItem(ROOM_INFO_KEY, JSON.stringify(nextRoomInfo));
      } catch (e) {
        // ignore
      }
    } catch (e) {
      showToast("참여자 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
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

  const currentCount = totalCount || participants.length;

  const me = useMemo(
    () => participants.find((p) => p.key === myKey),
    [participants, myKey],
  );
  const isHost = useMemo(() => me?.isHost ?? false, [me]);
  const myReady = me?.isReady ?? false;

  const nonHostParticipants = useMemo(
    () => participants.filter((p) => !p.isHost),
    [participants],
  );

  const nonHostAllReady = useMemo(
    () => nonHostParticipants.every((p) => p.isReady),
    [nonHostParticipants],
  );

  const canStart = isHost && nonHostAllReady;

  // WebSocket 연결
  const hasNavigatedRef = useRef(false);

  const handleMemberJoined = useCallback(() => {
    fetchLobbyRef.current?.();
  }, []);

  const handleMemberLeft = useCallback(() => {
    fetchLobbyRef.current?.();
  }, []);

  const handleReadyChanged = useCallback((payload, senderKey) => {
    if (payload?.readyCount !== undefined) setReadyCount(payload.readyCount);
    if (payload?.totalCount !== undefined) setTotalCount(payload.totalCount);

    if (senderKey) {
      const newReady =
        payload?.myReadyStatus === "READY" || payload?.ready === true;

      setParticipants((prev) =>
        prev.map((p) =>
          p.key === String(senderKey) ? { ...p, isReady: newReady } : p,
        ),
      );
    }
  }, []);

  const handleMicChanged = useCallback(
    (payload, senderKey) => {
      if (!senderKey) return;
      const k = String(senderKey);

      // 내 마이크는 로컬(myMicOn)로 유지
      if (k === myKey) return;

      setParticipants((prev) =>
        prev.map((p) =>
          p.key === k ? { ...p, micOn: payload?.micOn ?? p.micOn } : p,
        ),
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
        prev.map((p) =>
          p.key === k ? { ...p, voiceLevel: payload?.level ?? 0 } : p,
        ),
      );
    },
    [myKey],
  );

  // SETTINGS_CHANGED 반영(가장 중요)
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

      // 일반적으로 설정 변경 시 준비상태가 리셋되는 경우가 많으므로 로컬에서도 반영
      setParticipants((prev) =>
        prev.map((p) => (p.isHost ? p : { ...p, isReady: false })),
      );
      setReadyCount(0);

      // sessionStorage 갱신(참여자도 즉시 반영되게)
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
      } catch (e) {
        // ignore
      }

      // 설정 변경은 자주 일어나지 않으므로, 1회 lobby 재조회로 확정 동기화
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
      if (hasNavigatedRef.current) return;
      hasNavigatedRef.current = true;

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
    [
      navigate,
      roomInfo,
      roomId,
      inviteCode,
      roomTitle,
      topic,
      turnCount,
      maxCount,
      myKey,
      participants,
      myMicOn,
    ],
  );

  const { sendReady, sendMic, sendVoiceLevel } = useRoomWebSocket(inviteCode, {
    onReadyChanged: handleReadyChanged,
    onMicChanged: handleMicChanged,
    onMemberJoined: handleMemberJoined,
    onMemberLeft: handleMemberLeft,
    onVoiceLevelChanged: handleVoiceLevelChanged,
    onSettingsChanged: handleSettingsChanged,
    onRoomStarted,
    onError: handleWebSocketError,
    onConnected: () => fetchLobbyRef.current?.(),
  });

  // 내 voiceLevel 전송(연결 훅에서 쓰로틀이 걸려있더라도, 여기서도 최소 조건은 둡니다)
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

  // 마이크 토글
  const toggleMyMic = useCallback(async () => {
    const next = !myMicOn;

    if (myMicOn) {
      setMyMicOn(false);
      await stopAudioAnalysis();
      sendMic(false);
      return;
    }

    setMyMicOn(true);
    await startAudioAnalysis();
    sendMic(true);
  }, [myMicOn, startAudioAnalysis, stopAudioAnalysis, sendMic]);

  // 준비 토글
  const toggleMyReady = useCallback(async () => {
    const next = !myReady;

    // 낙관적 업데이트
    setParticipants((prev) =>
      prev.map((p) => (p.key === myKey ? { ...p, isReady: next } : p)),
    );

    try {
      await toggleReady(inviteCode);
    } catch (e) {
      // 실패 시 롤백
      setParticipants((prev) =>
        prev.map((p) => (p.key === myKey ? { ...p, isReady: !next } : p)),
      );
      showToast("준비 상태 변경에 실패했습니다.");
      return;
    }

    sendReady(next);
  }, [myReady, myKey, inviteCode, sendReady, showToast]);

  // 초대코드 복사/공유
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      showToast("참여 코드가 복사되었습니다.");
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
    } catch (e) {
      showToast("공유에 실패했습니다.");
    }
  }, [inviteCode, roomTitle, topic, showToast]);

  // 방 설정 변경(방장)
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
    setEditTitle(e.target.value.slice(0, 30));
  }, []);

  const handleEditTopicChange = useCallback((e) => {
    setEditTopic(e.target.value);
  }, []);

  const handlePickEditTopic = useCallback((t) => {
    setEditTopic(t);
  }, []);

  const handleAiRecommend = useCallback(async () => {
    try {
      const data = await getTopics();
      const topics = data?.topics || [];
      if (topics.length > 0) {
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        setEditTopic(randomTopic);
        return;
      }
    } catch (e) {
      // ignore
    }

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

    try {
      await updateRoomSettings(inviteCode, {
        title: editTitle.trim(),
        topic: editTopic.trim(),
        turnCnt: editTurn,
      });
    } catch (e) {
      showToast("방 설정 변경에 실패했습니다.");
      return;
    }

    // 방장 본인은 즉시 반영(참여자는 SETTINGS_CHANGED로 반영됨)
    setRoomTitle(editTitle.trim());
    setTopic(editTopic.trim());
    setTurnCount(editTurn);

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
        }),
      );
    } catch (e) {
      // ignore
    }

    setEditPopupOpen(false);

    // 서버 상태(readyCount 등) 확정 동기화
    fetchLobbyRef.current?.();
    showToast("방 설정이 변경되었습니다.");
  }, [editTitle, editTopic, editTurn, showToast, inviteCode]);

  // 시작하기(방장): API만 호출하고, 실제 화면 전환은 WS onRoomStarted에서 처리
  const handleStart = useCallback(async () => {
    if (!canStart) return;

    try {
      await startRoom(inviteCode);
    } catch (e) {
      showToast("방을 시작하는데 실패했습니다.");
      return;
    }

    // 서버가 시작 이벤트를 브로드캐스트하면 onRoomStarted에서 이동합니다.
    // 만약 브로드캐스트가 누락되는 서버라면, lobby 재조회로 보정합니다.
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

  // 나가기
  const handleExit = useCallback(async () => {
    try {
      await stopAudioAnalysis();
    } catch (e) {
      // ignore
    }

    if (inviteCode && inviteCode !== "000000") {
      try {
        await leaveRoom({ roomCode: inviteCode });
      } catch (e) {
        // ignore
      }
    }

    sessionStorage.removeItem(ROOM_INFO_KEY);
  }, [inviteCode, stopAudioAnalysis]);

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
                첫 번째 대화 주제는 {topic}입니다!
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

                  return (
                    <div key={p.key || index} className={styles.ParticipantRow}>
                      <div className={styles.ParticipantLeft}>
                        <div className={styles.UserIconWrap} aria-hidden="true">
                          <img
                            className={styles.UserIconImg}
                            src={usersIcon}
                            alt=""
                          />
                        </div>

                        <div className={styles.InfoColumn}>
                          <div className={styles.NameRow}>
                            <div className={styles.ParticipantName}>
                              {p.nickname}
                              {isMe ? " (나)" : ""}
                            </div>

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
                        <span
                          className={styles.PopupTurnIcon}
                          aria-hidden="true"
                        >
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
      ) : null}
    </div>
  );
}
