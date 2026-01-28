import { useEffect, useRef, useCallback, useState } from "react";
import SockJS from "sockjs-client/dist/sockjs";
import { Client } from "@stomp/stompjs";

const getWsUrl = () => {
  const wsBase = (import.meta.env.VITE_WS_BASE_URL || "").trim();
  if (wsBase) return `${wsBase}/ws`;
  return "/ws";
};

export default function useRoomWebSocket(roomCode, handlers = {}) {
  const clientRef = useRef(null);
  const subRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  const { onReadyChanged, onMicChanged, onError, onConnected, onDisconnected } =
    handlers;

  // READY 메시지 전송: /app/rooms/{roomCode}/ready
  const sendReady = useCallback(
    (ready) => {
      const client = clientRef.current;
      if (!client?.connected) return;

      client.publish({
        destination: `/app/rooms/${roomCode}/ready`,
        body: JSON.stringify({ ready }),
      });
    },
    [roomCode]
  );

  // MIC 메시지 전송: /app/rooms/{roomCode}/mic
  const sendMic = useCallback(
    (micOn) => {
      const client = clientRef.current;
      if (!client?.connected) return;

      client.publish({
        destination: `/app/rooms/${roomCode}/mic`,
        body: JSON.stringify({ micOn }),
      });
    },
    [roomCode]
  );

  useEffect(() => {
    if (!roomCode) return;

    const wsUrl = getWsUrl();

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl, null, { withCredentials: true }),

      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      debug: () => {},
    });

    client.onConnect = () => {
      setIsConnected(true);

      subRef.current = client.subscribe(`/topic/rooms/${roomCode}`, (message) => {
        try {
          const data = JSON.parse(message.body);
          const { type, payload } = data;

          switch (type) {
            case "READY_CHANGED":
              onReadyChanged?.(payload);
              break;
            case "MIC_CHANGED":
              onMicChanged?.(payload);
              break;
            case "ERROR":
              onError?.(payload);
              break;
            default:
              break;
          }
        } catch (e) {
          onError?.("WebSocket 메시지 파싱에 실패했습니다.");
        }
      });

      onConnected?.();
    };

    client.onWebSocketError = () => {
      setIsConnected(false);
      onError?.("WebSocket 소켓 에러가 발생했습니다.");
    };

    client.onStompError = () => {
      setIsConnected(false);
      onError?.("WebSocket STOMP 에러가 발생했습니다.");
    };

    client.onDisconnect = () => {
      setIsConnected(false);
      onDisconnected?.();
    };

    clientRef.current = client;
    client.activate();

    return () => {
      try {
        subRef.current?.unsubscribe?.();
      } finally {
        subRef.current = null;
      }

      try {
        client.deactivate();
      } finally {
        clientRef.current = null;
        setIsConnected(false);
      }
    };
  }, [roomCode, onReadyChanged, onMicChanged, onError, onConnected, onDisconnected]);

  return { sendReady, sendMic, isConnected };
}
