import { useEffect, useRef, useCallback, useState } from "react";
import SockJS from "sockjs-client/dist/sockjs";
import { Client } from "@stomp/stompjs";

export default function useRoomWebSocket(roomCode, handlers = {}) {
  const clientRef = useRef(null);
  const subRef = useRef(null);
  const suggestionSubRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  // 핸들러를 ref로 보관해서 리렌더링 시에도 최신 핸들러를 사용
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

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

      // 방 이벤트 구독
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

            // 어떤 메시지든 isOpen:true가 포함되면 시작 이벤트로 간주 가능
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
                // 타입이 없거나 모르는 타입이어도 isOpen:true면 시작 처리
                if (openFlag) {
                  onRoomStarted?.(payload ?? data, senderKey);
                }
                break;
            }
          } catch (e) {
            console.error("Msg Parsing Error", e);
          }
        },
      );

      // AI 대화 추천 구독
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
