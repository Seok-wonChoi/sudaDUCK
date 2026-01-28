import { useEffect, useRef, useCallback, useState } from "react";
import SockJS from "sockjs-client/dist/sockjs";
import { Client } from "@stomp/stompjs";

/**
 * 대기방 WebSocket 연결을 관리하는 훅
 *
 * @param {string} roomCode - 방 코드
 * @param {Object} handlers - 이벤트 핸들러
 * @param {Function} handlers.onReadyChanged - READY_CHANGED 이벤트 핸들러
 * @param {Function} handlers.onMicChanged - MIC_CHANGED 이벤트 핸들러
 * @param {Function} handlers.onError - ERROR 이벤트 핸들러
 * @param {Function} handlers.onConnected - 연결 성공 핸들러 (optional)
 * @param {Function} handlers.onDisconnected - 연결 해제 핸들러 (optional)
 * @returns {Object} { sendReady, sendMic, isConnected }
 */
export default function useRoomWebSocket(roomCode, handlers = {}) {
  const clientRef = useRef(null);
  const subRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  const {
    onReadyChanged,
    onMicChanged,
    onError,
    onConnected,
    onDisconnected,
  } = handlers;

  // READY 메시지 전송: /app/rooms/{roomCode}/ready
  const sendReady = useCallback(
    (ready) => {
      const client = clientRef.current;
      if (!client?.connected) {
        console.warn("WebSocket이 연결되지 않았습니다.");
        return;
      }

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
      if (!client?.connected) {
        console.warn("WebSocket이 연결되지 않았습니다.");
        return;
      }

      client.publish({
        destination: `/app/rooms/${roomCode}/mic`,
        body: JSON.stringify({ micOn }),
      });
    },
    [roomCode]
  );

  useEffect(() => {
    if (!roomCode) return;

    const client = new Client({
      // SockJS (쿠키 인증 필수)
      webSocketFactory: () => new SockJS("/ws", null, { withCredentials: true }),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
    });

    client.onConnect = () => {
      console.log("WebSocket 연결 성공");
      setIsConnected(true);

      // 방 단위 구독: /topic/rooms/{roomCode}
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
          console.error("메시지 파싱 에러:", e);
        }
      });

      onConnected?.();
    };

    client.onWebSocketError = (e) => {
      console.error("WebSocket 소켓 에러:", e);
      setIsConnected(false);
      onError?.("WebSocket 소켓 에러가 발생했습니다.");
    };

    client.onStompError = (frame) => {
      console.error("WebSocket STOMP 에러:", frame);
      setIsConnected(false);
      onError?.("WebSocket STOMP 에러가 발생했습니다.");
    };

    client.onDisconnect = () => {
      console.log("WebSocket 연결 해제");
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
