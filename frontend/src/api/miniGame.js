import api from "./api";

// 미니게임 복습 문제 조회: GET /api/v1/mini_game/{roomId}/review/questions
export async function getReviewQuestions(roomId) {
  const { data } = await api.get(`/api/v1/mini_game/${roomId}/review/questions`);
  return data;
}
