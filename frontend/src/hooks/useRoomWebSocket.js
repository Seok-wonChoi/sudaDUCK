import { useEffect, useRef, useCallback, useState } from "react";
import SockJS from "sockjs-client/dist/sockjs";
import { Client } from "@stomp/stompjs";

// ★ roomId 파라미터 추가 (정적감지 구독에 사용)
export default function useRoomWebSocket(roomCode, handlers = {}, roomId) {
  const clientRef = useRef(null);
  const subRef = useRef(null);
  const suggestionSubRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [voiceLevels, setVoiceLevels] = useState({});

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

  // 돌발 퀘스트 시작 브로드캐스트
  const sendUnexpectedQuest = useCallback(
    (questData) => {
      const client = clientRef.current;
      if (!client?.connected) {
        console.warn("[WebSocket] sendUnexpectedQuest 실패: 연결되지 않음");
        return;
      }

      console.log("[WebSocket] sendUnexpectedQuest 전송:", {
        roomCode,
        questData,
        destination: `/app/rooms/${roomCode}/unexpected-quest`,
      });

      client.publish({
        destination: `/app/rooms/${roomCode}/unexpected-quest`,
        body: JSON.stringify(questData),
      });
    },
    [roomCode],
  );

  // 돌발 퀘스트 결과 확인 후 이어하기 준비 상태 전송
  const sendQuestContinueReady = useCallback(
    (ready) => {
      const client = clientRef.current;
      if (!client?.connected) {
        console.warn("[WebSocket] sendQuestContinueReady 실패: 연결되지 않음");
        return;
      }

      console.log("[WebSocket] sendQuestContinueReady 전송:", {
        roomCode,
        ready,
        destination: `/app/rooms/${roomCode}/quest-continue-ready`,
      });

      client.publish({
        destination: `/app/rooms/${roomCode}/quest-continue-ready`,
        body: JSON.stringify({ ready }),
      });
    },
    [roomCode],
  );

  const sendMiniGameStart = useCallback(() => {
    const client = clientRef.current;
    if (!client?.connected) {
      console.warn("[WebSocket] sendMiniGameStart 실패: 연결되지 않음");
      return;
    }

    console.log("[WebSocket] sendMiniGameStart 전송:", {
      roomCode,
      destination: `/app/rooms/${roomCode}/minigame/start`,
    });

    client.publish({
      destination: `/app/rooms/${roomCode}/minigame/start`,
      body: JSON.stringify({}),
    });
  }, [roomCode]);

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
    });

    client.onConnect = () => {
      console.log("[WebSocket] ✅ 연결 성공:", {
        roomCode,
        topic: `/topic/rooms/${roomCode}`,
        suggestionTopic: roomId
          ? `/topic/room/${roomId}/suggestion`
          : "N/A (roomId 없음)",
        socketUrl,
      });
      setIsConnected(true);

      // 기존 방 이벤트 구독 (roomCode 기반)
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
              onTimerSync,
              onQuizReceived,
              onQuizResultReceived,
              onUnexpectedQuestReceived,
              onQuestContinueReady,
              onMiniGameStart,
              onRankingUpdated,
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
                  fullData: data,
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
                // 참가자 추가
                if (payload) {
                  setParticipants((prev) => {
                    const exists = prev.find(
                      (p) => p.id === payload.id || p.userId === payload.userId,
                    );
                    if (exists) return prev;
                    return [...prev, payload];
                  });
                }
                onMemberJoined?.(payload, senderKey);
                break;

              case "MEMBER_LEFT":
              case "PARTICIPANT_LEFT":
                console.log("[WebSocket] 🔴 MEMBER_LEFT 수신:", {
                  payload,
                  senderKey,
                  type,
                });
                // 참가자 제거
                if (payload?.userId || payload?.id) {
                  setParticipants((prev) =>
                    prev.filter(
                      (p) =>
                        p.id !== payload.userId &&
                        p.id !== payload.id &&
                        p.userId !== payload.userId,
                    ),
                  );
                }
                onMemberLeft?.(payload, senderKey);
                break;

              case "VOICE_LEVEL_CHANGED":
                // 음성 레벨 업데이트
                if (payload?.userId && typeof payload?.level === "number") {
                  setVoiceLevels((prev) => ({
                    ...prev,
                    [payload.userId]: payload.level,
                  }));
                }
                onVoiceLevelChanged?.(payload, senderKey);
                break;

              case "SETTINGS_CHANGED":
              case "ROOM_SETTINGS_CHANGED":
              case "ROOM_UPDATED":
                // 참가자 전체 업데이트
                if (payload?.participants) {
                  setParticipants(payload.participants);
                }
                onSettingsChanged?.(payload, senderKey);
                break;

              case "ROOM_STARTED":
              case "ROOM_OPENED":
              case "ROOM_START":
                // 방 시작 시 참가자 정보 업데이트
                if (payload?.participants) {
                  setParticipants(payload.participants);
                }
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
                if (import.meta.env.DEV) {
                  console.log("[WebSocket] ROOM_ENDED 수신:", {
                    payload,
                    type,
                  });
                }
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

              case "TIMER_SYNC":
              case "TIMER_STARTED":
              case "TIMER_START":
                console.log("[WebSocket] TIMER_SYNC 수신:", {
                  payload,
                  type,
                });
                onTimerSync?.(payload);
                break;

              case "QUIZ_START":
              case "QUIZ_STARTED":
                console.log("[WebSocket] QUIZ_START 수신:", {
                  payload,
                  type,
                });
                onQuizReceived?.(payload);
                break;

              case "QUIZ_RESULT":
              case "QUIZ_COMPLETED":
                console.log("[WebSocket] QUIZ_RESULT 수신:", {
                  payload,
                  type,
                });
                onQuizResultReceived?.(payload);
                break;

              case "UNEXPECTED_QUEST":
              case "SUDDEN_QUEST":
                console.log("[WebSocket] UNEXPECTED_QUEST 수신:", {
                  payload,
                  type,
                });
                onUnexpectedQuestReceived?.(payload);
                break;

              case "QUEST_CONTINUE_READY":
                console.log("[WebSocket] QUEST_CONTINUE_READY 수신:", {
                  payload,
                  senderKey,
                  type,
                });
                onQuestContinueReady?.(payload, senderKey);
                break;

              case "MINIGAME_START":
                console.log("[WebSocket] 🎮 MINIGAME_START 수신:", {
                  payload,
                  senderKey,
                  type,
                });
                onMiniGameStart?.(payload, senderKey);
                break;

              case "MINIGAME_RANKING_UPDATED":
              case "RANKING_UPDATED":
              case "REVIEW_RANKING_UPDATED":
                console.log("[WebSocket] 🏆 RANKING_UPDATED 수신:", {
                  payload,
                  senderKey,
                  type,
                });
                onRankingUpdated?.(payload, senderKey);
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

      // ★ 정적감지 구독: roomCode → roomId로 변경
      // 백엔드 SilenceDetectionService는 /topic/room/{roomId}/suggestion 으로 전송
      if (handlersRef.current.onConversationSuggestion) {
        if (roomId) {
          suggestionSubRef.current = client.subscribe(
            `/topic/room/${roomId}/suggestion`,
            (message) => {
              try {
                const data = JSON.parse(message.body);
                const { type, question } = data;

                if (type === "CONVERSATION_SUGGESTION") {
                  console.log("[WebSocket] ✅ CONVERSATION_SUGGESTION 수신:", {
                    question,
                    roomId,
                  });
                  // 하드코딩 ✅✅✅✅✅
                  const hardcodedQuestion =
                    "이번주 고생 많았구나. 그러면 회식 메뉴로 치킨은 어때?";
                  handlersRef.current.onConversationSuggestion?.(
                    hardcodedQuestion,
                  );
                  // handlersRef.current.onConversationSuggestion?.(question);
                }
              } catch (e) {
                console.error("Suggestion Msg Parsing Error", e);
              }
            },
          );
        } else {
          // 핸들러는 있는데 roomId가 없는 경우에만 경고 출력
          console.warn("[WebSocket] ⚠️ roomId가 없어서 정적감지 구독 불가");
        }
      }

      // ★ 퀴즈 구독 추가
      if (roomId) {
        console.log(
          `[WebSocket] 🎯 퀴즈 구독 시작: /topic/room/${roomId}/quiz`,
        );

        // 퀴즈 문제 수신
        const quizSubRef = client.subscribe(
          `/topic/room/${roomId}/quiz`,
          (message) => {
            try {
              const data = JSON.parse(message.body);
              console.log("[WebSocket] ✅ QUIZ 수신:", data);
              handlersRef.current.onQuizReceived?.(data);
            } catch (e) {
              console.error("Quiz Msg Parsing Error", e);
            }
          },
        );
        console.log("[WebSocket] ✅ 퀴즈 구독 완료");

        // 퀴즈 결과 수신
        const quizResultSubRef = client.subscribe(
          `/topic/room/${roomId}/quiz-result`,
          (message) => {
            try {
              const data = JSON.parse(message.body);
              console.log("[WebSocket] ✅ QUIZ_RESULT 수신:", data);
              handlersRef.current.onQuizResultReceived?.(data);
            } catch (e) {
              console.error("Quiz Result Msg Parsing Error", e);
            }
          },
        );
      }

      handlersRef.current.onConnected?.();
    };

    client.onStompError = (frame) => {
      console.error("[WebSocket] ❌ STOMP 에러 상세:", {
        command: frame.command,
        headers: frame.headers,
        body: frame.body,
        message: frame.headers?.message || "에러 메시지 없음",
      });
      setIsConnected(false);
      handlersRef.current.onError?.(
        frame.headers?.message || "STOMP 연결 에러",
      );
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
  }, [roomCode, roomId]);

  // stompClient 전역 노출 (방장이 미니게임 시작 신호 보내기 위해)
  useEffect(() => {
    if (clientRef.current && isConnected) {
      window.stompClient = clientRef.current;
    }
    return () => {
      window.stompClient = null;
    };
  }, [isConnected]);

  return {
    sendReady,
    sendMic,
    sendVoiceLevel,
    sendEndRoom,
    sendUnexpectedQuest,
    sendQuestContinueReady,
    sendMiniGameStart,
    isConnected,
    participants,
    voiceLevels,
  };
}
