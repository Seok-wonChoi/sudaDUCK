import { useEffect, useRef, useCallback, useState } from "react";
import SockJS from "sockjs-client/dist/sockjs";
import { Client } from "@stomp/stompjs";

export default function useRoomWebSocket(roomCode, handlers = {}) {
  const clientRef = useRef(null);
  const subRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  // 1. 핸들러들을 ref에 담아 useEffect의 의존성 배열에서 제거합니다.
  // 이렇게 하면 WaitingRoomPage가 리렌더링되어도 소켓이 끊기지 않습니다.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const sendReady = useCallback((ready) => {
    const client = clientRef.current;
    if (!client?.connected) return;
    client.publish({
      destination: `/app/rooms/${roomCode}/ready`,
      body: JSON.stringify({ ready }),
    });
  }, [roomCode]);

  const sendMic = useCallback((micOn) => {
    const client = clientRef.current;
    console.log("[sendMic] 호출됨:", { micOn, connected: client?.connected, roomCode });
    if (!client?.connected) {
      console.warn("[sendMic] WebSocket이 연결되지 않음!");
      return;
    }
    client.publish({
      destination: `/app/rooms/${roomCode}/mic`,
      body: JSON.stringify({ micOn }),
    });
    console.log("[sendMic] WebSocket 메시지 전송 완료:", { micOn, destination: `/app/rooms/${roomCode}/mic` });
  }, [roomCode]);

  const sendVoiceLevel = useCallback((level) => {
    const client = clientRef.current;
    if (!client?.connected) return;
    // 너무 많은 로그를 방지하기 위해 10% 확률로만 로그 출력
    if (Math.random() < 0.1) {
      console.log("[sendVoiceLevel] 음성 레벨 전송:", { level, roomCode });
    }
    client.publish({
      destination: `/app/rooms/${roomCode}/voice-level`,
      body: JSON.stringify({ level }),
    });
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode) return;

    const token = localStorage.getItem("accessToken");
    const apiBase = import.meta.env.VITE_API_BASE_URL || "";
    const socketUrl = apiBase.startsWith("http") 
      ? `${apiBase}/ws` 
      : `${window.location.origin}${apiBase}/ws`;

    const client = new Client({
      webSocketFactory: () => new SockJS(socketUrl),
      connectHeaders: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => console.log("[STOMP Debug]: ", str),
    });

    client.onConnect = () => {
      setIsConnected(true);
      console.log("✅ STOMP Connected to Server");

      // 방 상태 구독
      subRef.current = client.subscribe(`/topic/rooms/${roomCode}`, (message) => {
        try {
          const data = JSON.parse(message.body);
          const { type, payload, senderKey } = data;

          // 🔍 모든 WebSocket 메시지 로깅
          console.log("📨 [WebSocket 메시지 수신]", {
            type,
            payload,
            senderKey,
            rawMessage: message.body
          });

          // ref를 통해 최신 핸들러 호출
          const { onReadyChanged, onMicChanged, onMemberJoined, onVoiceLevelChanged, onError } = handlersRef.current;
          switch (type) {
            case "READY_CHANGED":
              console.log("→ READY_CHANGED 핸들러 호출");
              onReadyChanged?.(payload, senderKey);
              break;
            case "MIC_CHANGED":
              console.log("→ MIC_CHANGED 핸들러 호출");
              onMicChanged?.(payload, senderKey);
              break;
            case "MEMBER_JOINED":
              console.log("→ MEMBER_JOINED 핸들러 호출");
              onMemberJoined?.(payload, senderKey);
              break;
            case "VOICE_LEVEL_CHANGED":
              onVoiceLevelChanged?.(payload, senderKey);
              break;
            case "ERROR":
              console.log("→ ERROR 핸들러 호출");
              onError?.(payload);
              break;
            default:
              console.warn("⚠️ 알 수 없는 메시지 타입:", type);
          }
        } catch (e) {
          console.error("Msg Parsing Error", e);
        }
      });

      // AI 대화 추천 구독 (정적 감지)
      const suggestionSub = client.subscribe(`/topic/room/${roomCode}/suggestion`, (message) => {
        try {
          const dagitta = JSON.parse(message.body);
          const { type, question } = data;

          if (type === "CONVERSATION_SUGGESTION") {
            handlersRef.current.onConversationSuggestion?.(question);
          }
        } catch (e) {
          console.error("Suggestion Msg Parsing Error", e);
        }
      });

      handlersRef.current.onConnected?.();
    };

    client.onStompError = (frame) => {
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
      console.log("Cleanup: Deactivating Client");
      if (subRef.current) subRef.current.unsubscribe();
      if (client) client.deactivate();
      clientRef.current = null;
    };
    // 의존성 배열에서 handlers를 제거하여 무한 루프를 방지합니다.
  }, [roomCode]); 

  return { sendReady, sendMic, sendVoiceLevel, isConnected };
}