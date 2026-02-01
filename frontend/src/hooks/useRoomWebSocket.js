import { useEffect, useRef, useCallback, useState } from "react";
import SockJS from "sockjs-client/dist/sockjs";
import { Client } from "@stomp/stompjs";

export default function useRoomWebSocket(roomCode, handlers = {}) {
  const clientRef = useRef(null);
  const subRef = useRef(null);
  const suggestionSubRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  // voice-level 전송 쓰로틀/변화량 제한
  const lastVoiceSentAtRef = useRef(0);
  const lastVoiceSentLevelRef = useRef(0);

  const sendReady = useCallback(
    (ready) => {
      const client = clientRef.current;
      if (!client?.connected) {
        console.warn("[WebSocket] sendReady 실패: 연결되지 않음");
        return;
      }

      console.log("[WebSocket] sendReady 전송:", {
        roomCode,
        ready,
        destination: `/app/rooms/${roomCode}/ready`,
      });

      client.publish({
        destination: `/app/rooms/${roomCode}/ready`,
        body: JSON.stringify({ ready }),
      });
    },
    [roomCode],
  );

  const sendMic = useCallback(
    (micOn) => {
      const client = clientRef.current;
      if (!client?.connected) return;

      client.publish({
        destination: `/app/rooms/${roomCode}/mic`,
        body: JSON.stringify({ micOn }),
      });
    },
    [roomCode],
  );

  const sendVoiceLevel = useCallback(
    (level) => {
      const client = clientRef.current;
      if (!client?.connected) return;

      const now = performance.now();
      const lastAt = lastVoiceSentAtRef.current;
      const lastLevel = lastVoiceSentLevelRef.current;

      // 250ms 이내 재전송 금지
      if (now - lastAt < 250) return;

      // 변화량이 너무 작으면 전송 금지
      if (Math.abs(level - lastLevel) < 0.03) return;

      lastVoiceSentAtRef.current = now;
      lastVoiceSentLevelRef.current = level;

      client.publish({
        destination: `/app/rooms/${roomCode}/voice-level`,
        body: JSON.stringify({ level }),
      });
    },
    [roomCode],
  );

  // 방장이 대화 종료 시 모든 참여자에게 알림
  const sendEndRoom = useCallback(
    (roomInfo) => {
      const client = clientRef.current;
      if (!client?.connected) {
        console.warn("[WebSocket] sendEndRoom 실패: 연결되지 않음");
        return;
      }

      console.log("[WebSocket] sendEndRoom 전송:", {
        roomCode,
        roomInfo,
        destination: `/app/rooms/${roomCode}/end`,
      });

      client.publish({
        destination: `/app/rooms/${roomCode}/end`,
        body: JSON.stringify({ roomInfo }),
      });
    },
    [roomCode],
  );

  useEffect(() => {
    if (!roomCode) return;

    const token = localStorage.getItem("accessToken");
    const apiBase = import.meta.env.VITE_API_BASE_URL || "";

    // WebSocket 연결 URL 생성
    // 로컬 개발 환경에서는 Vite 프록시가 SockJS를 제대로 처리하지 못하므로 직접 서버로 연결
    let socketUrl;
    if (import.meta.env.DEV && apiBase === "/dev-api") {
      // 로컬 개발: 직접 HTTPS 서버로 연결
      socketUrl = "https://i14e104.p.ssafy.io/dev-api/ws";
      console.log("[WebSocket] 로컬 개발 모드: 직접 서버 연결");
    } else if (apiBase.startsWith("http")) {
      // 프로덕션: 전체 URL 사용
      socketUrl = `${apiBase}/ws`;
    } else {
      // 기타: 상대 경로 사용
      socketUrl = `${window.location.origin}${apiBase}/ws`;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),

      // 빈 Authorization을 보내지 않도록 처리(권장)
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},

      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      // debug는 반드시 함수여야 합니다.
      debug: (str) => {
        if (import.meta.env.DEV && window.__STOMP_DEBUG__) {
          console.log("[STOMP]", str);
        }
      },
      // 완전 OFF를 원하면 위 debug 대신 아래 한 줄로 바꾸세요:
      // debug: () => {},
    });

    client.onConnect = () => {
      console.log("[WebSocket] ✅ 연결 성공:", {
        roomCode,
        topic: `/topic/rooms/${roomCode}`,
        socketUrl
      });
      setIsConnected(true);

      subRef.current = client.subscribe(
        `/topic/rooms/${roomCode}`,
        (message) => {
          try {
            const data = JSON.parse(message.body);
            const { type, payload, senderKey } = data;

            const {
              onReadyChanged,
              onMicChanged,
              onMemberJoined,
              onMemberLeft,
              onVoiceLevelChanged,
              onSettingsChanged,
              onRoomStarted,
              onRoomClosed,
              onRoomEnded,
              onSilenceDetected,
              onError,
            } = handlersRef.current;

            const openFlag =
              payload?.isOpen === true ||
              data?.isOpen === true ||
              payload?.open === true;

            switch (type) {
              case "READY_CHANGED":
                console.log("[WebSocket] 🔄 READY_CHANGED 수신:", {
                  payload,
                  senderKey,
                  type,
                  fullData: data
                });
                onReadyChanged?.(payload, senderKey);
                break;

              case "MIC_CHANGED":
                onMicChanged?.(payload, senderKey);
                break;

              case "MEMBER_JOINED":
              case "PARTICIPANT_JOINED":
                console.log("[WebSocket] 🟢 MEMBER_JOINED 수신:", {
                  payload,
                  senderKey,
                  type,
                });
                onMemberJoined?.(payload, senderKey);
                break;

              case "MEMBER_LEFT":
              case "PARTICIPANT_LEFT":
                console.log("[WebSocket] 🔴 MEMBER_LEFT 수신:", {
                  payload,
                  senderKey,
                  type,
                });
                onMemberLeft?.(payload, senderKey);
                break;

              case "VOICE_LEVEL_CHANGED":
                onVoiceLevelChanged?.(payload, senderKey);
                break;

              case "SETTINGS_CHANGED":
              case "ROOM_SETTINGS_CHANGED":
              case "ROOM_UPDATED":
                onSettingsChanged?.(payload, senderKey);
                break;

              case "ROOM_STARTED":
              case "ROOM_OPENED":
              case "ROOM_START":
                onRoomStarted?.(payload ?? data, senderKey);
                break;

              case "ROOM_CLOSED":
              case "HOST_LEFT":
              case "ROOM_DISBANDED":
                console.log("[WebSocket] ROOM_CLOSED 수신:", {
                  payload,
                  type,
                });
                onRoomClosed?.(payload, senderKey);
                break;

              case "ROOM_ENDED":
              case "CONVERSATION_ENDED":
              case "TALK_ENDED":
                console.log("[WebSocket] ROOM_ENDED 수신:", {
                  payload,
                  type,
                });
                onRoomEnded?.(payload, senderKey);
                break;

              case "SILENCE_DETECTED":
              case "AWKWARD_SILENCE":
                console.log("[WebSocket] SILENCE_DETECTED 수신:", {
                  payload,
                  senderKey,
                  type,
                });
                onSilenceDetected?.(payload, senderKey);
                break;

              case "ERROR":
                onError?.(payload);
                break;

              default:
                if (openFlag) onRoomStarted?.(payload ?? data, senderKey);
                break;
            }
          } catch (e) {
            console.error("Msg Parsing Error", e);
          }
        },
      );

      suggestionSubRef.current = client.subscribe(
        `/topic/room/${roomCode}/suggestion`,
        (message) => {
          try {
            const data = JSON.parse(message.body);
            const { type, question } = data;

            if (type === "CONVERSATION_SUGGESTION") {
              handlersRef.current.onConversationSuggestion?.(question);
            }
          } catch (e) {
            console.error("Suggestion Msg Parsing Error", e);
          }
        },
      );

      handlersRef.current.onConnected?.();
    };

    client.onStompError = (frame) => {
      console.error("[WebSocket] ❌ STOMP 에러:", frame);
      setIsConnected(false);
      handlersRef.current.onError?.("STOMP 인증 에러");
    };

    client.onWebSocketError = (event) => {
      console.error("[WebSocket] ❌ WebSocket 에러:", event);
      setIsConnected(false);
      handlersRef.current.onError?.("서버와 연결할 수 없습니다.");
    };

    client.onDisconnect = () => {
      console.log("[WebSocket] 🔌 연결 해제됨:", { roomCode });
      setIsConnected(false);
      handlersRef.current.onDisconnected?.();
    };

    clientRef.current = client;
    client.activate();

    return () => {
      if (subRef.current) subRef.current.unsubscribe();
      if (suggestionSubRef.current) suggestionSubRef.current.unsubscribe();
      if (client) client.deactivate();
      clientRef.current = null;
    };
  }, [roomCode]);

  return { sendReady, sendMic, sendVoiceLevel, sendEndRoom, isConnected };
}
