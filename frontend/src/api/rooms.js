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

// 대기방 정보 조회: GET /api/v1/rooms/lobby
// 참여자 목록, 준비 상태, 방 정보 등을 한 번에 가져옴
export async function getLobby({ roomCode }) {
  const { data } = await api.get("/api/v1/rooms/lobby", {
    params: { roomCode },
  });
  return data;
}
