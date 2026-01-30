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
      if (!client?.connected) return;

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

  useEffect(() => {
    if (!roomCode) return;

    const token = localStorage.getItem("accessToken");
    const apiBase = import.meta.env.VITE_API_BASE_URL || "";
    const socketUrl = apiBase.startsWith("http")
      ? `${apiBase}/ws`
      : `${window.location.origin}${apiBase}/ws`;

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
              onError,
            } = handlersRef.current;

            const openFlag =
              payload?.isOpen === true ||
              data?.isOpen === true ||
              payload?.open === true;

            switch (type) {
              case "READY_CHANGED":
                onReadyChanged?.(payload, senderKey);
                break;

              case "MIC_CHANGED":
                onMicChanged?.(payload, senderKey);
                break;

              case "MEMBER_JOINED":
              case "PARTICIPANT_JOINED":
                onMemberJoined?.(payload, senderKey);
                break;

              case "MEMBER_LEFT":
              case "PARTICIPANT_LEFT":
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

    client.onStompError = () => {
      setIsConnected(false);
      handlersRef.current.onError?.("STOMP 인증 에러");
    };

    client.onWebSocketError = () => {
      setIsConnected(false);
      handlersRef.current.onError?.("서버와 연결할 수 없습니다.");
    };

    client.onDisconnect = () => {
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

  return { sendReady, sendMic, sendVoiceLevel, isConnected };
}
