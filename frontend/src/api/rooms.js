import http from "./http";

// 방 만들기: POST /api/v1/rooms
export async function createRoom({ title, topic, turnCnt }) {
  const { data } = await http.post("/api/v1/rooms", {
    title,
    topic,
    turnCnt: turnCnt ?? 3,
  });
  return data;
}

// 방 참가: POST /api/v1/rooms/join
export async function joinRoom({ roomCode }) {
  const { data } = await http.post("/api/v1/rooms/join", {
    roomCode,
  });
  return data;
}
