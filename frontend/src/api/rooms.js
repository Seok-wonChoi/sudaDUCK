import api from "./api";


// 방 만들기: POST /api/v1/rooms
export async function createRoom({ title, topic, turnCnt }) {
  const { data } = await api.post("/api/v1/rooms", {
    title,
    topic,
    turnCnt: turnCnt ?? 3,
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

// 대기 방 상태 조회: GET /api/v1/rooms/lobby
export async function getRoomLobby() {
  const { data } = await api.get("/api/v1/rooms/lobby");
  return data;
}

// 준비 상태 토글-참여자: PATCH /api/v1/rooms/{roomCode}/ready
export async function toggleReady(roomCode) {
  const { data } = await api.patch(`/api/v1/rooms/${roomCode}/ready`);
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
