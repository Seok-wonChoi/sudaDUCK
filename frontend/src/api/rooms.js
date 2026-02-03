import api from "./api";


// 방 만들기: POST /api/v1/rooms
export async function createRoom({ title, topic, turnCnt, openviduSessionId }) {
  const { data } = await api.post("/api/v1/rooms", {
    title,
    topic,
    turnCnt: turnCnt ?? 3,
    openviduSessionId, // 👈 [NEW] 오픈비두 세션 ID 추가
  });
  return data;
}

// 방 참가: POST /api/v1/rooms/join
export async function joinRoom({ roomCode }) {
  const { data } = await api.post("/api/v1/rooms/join", { roomCode });
  return data;
}

// 방 퇴장: POST /api/v1/rooms/leave
export async function leaveRoom({ roomCode }) {
  const { data } = await api.post("/api/v1/rooms/leave", { roomCode });
  return data;
}

// ai 주제 추천받기(3가지): GET /api/v1/topics
export async function getTopics() {
  const { data } = await api.get("/api/v1/topics");
  return data;
}

// 방장 방 상태 편집하기: PATCH /api/v1/rooms/{roomCode}/settings
export async function updateRoomSettings(roomCode, settings) {
  const { data } = await api.patch(`/api/v1/rooms/${roomCode}/settings`, settings);
  return data;
}

// 대기 방 상태 조회: GET /api/v1/rooms/lobby?roomCode={roomCode}
export async function getRoomLobby(roomCode) {
  const { data } = await api.get("/api/v1/rooms/lobby", {
    params: { roomCode }
  });
  return data;
}

// 준비 상태 토글-참여자: PATCH /api/v1/rooms/{roomCode}/ready
export async function toggleReady(roomCode, isReady) {
  const { data } = await api.patch(`/api/v1/rooms/${roomCode}/ready`, {
    ready: isReady  
  });
  return data;
}

// 멀티 대화 모드 시작하기-방장: POST /api/v1/rooms/{roomCode}/start
export async function startRoom(roomCode) {
  const { data } = await api.post(`/api/v1/rooms/${roomCode}/start`);
  return data;
}

// 방 상태를 대기방으로 전환: POST /api/v1/rooms/{roomCode}/end
export async function endRoom(roomCode) {
  const { data } = await api.post(`/api/v1/rooms/${roomCode}/end`);
  return data;
}

// 정적 감지 시작: POST /api/v1/silence/central/start-monitoring?roomId={roomId}&turn={turn}
export async function startSilenceMonitoring(roomId, turn) {
  const { data } = await api.post("/api/v1/silence/central/start-monitoring", null, {
    params: { roomId, turn }
  });
  return data;
}

// 정적 감지 중지: POST /api/v1/silence/central/stop-monitoring?roomId={roomId}
export async function stopSilenceMonitoring(roomId) {
  const { data } = await api.post("/api/v1/silence/central/stop-monitoring", null, {
    params: { roomId }
  });
  return data;
}

// 음성 활동 기록: POST /api/v1/silence/central/voice-activity?roomId={roomId}&userId={userId}&turn={turn}
export async function recordVoiceActivity(roomId, userId, turn) {
  const { data } = await api.post("/api/v1/silence/central/voice-activity", null, {
    params: { roomId, userId, turn }
  });
  return data;
}