import api from "./api";

// 미니게임1 복습 4문제 조회: GET /api/v1/mini_game/{roomId}/review/questions
export async function getReviewQuestions(roomId) {
  const { data } = await api.get(`/api/v1/mini_game/${roomId}/review/questions`);
  return data;
}

// 미니게임1 정답 제출: POST /api/v1/mini_game/{roomId}/review/submit
export async function submitReviewAnswers(roomId, answers) {
  const { data } = await api.post(`/api/v1/mini_game/${roomId}/review/submit`, {
    answers,
  });
  return data;
}

// 미니게임1 결과 랭킹 조회: GET /api/v1/mini_game/{roomId}/review/ranking
// 백엔드가 실제로 GET으로 구현되어 있음
export async function getReviewRanking(roomId) {
  const { data } = await api.get(`/api/v1/mini_game/${roomId}/review/ranking`);
  return data;
}

// 미니게임1 데이터 삭제 (방장): DELETE /api/v1/mini_game/{roomId}/review/clear
// 백엔드에 구현 안 되어있을 수 있음 - 에러 발생 시 무시
export async function clearReviewData(roomId) {
  try {
    const { data } = await api.delete(`/api/v1/mini_game/${roomId}/review/clear`);
    return data;
  } catch (error) {
    console.warn('clearReviewData API 미구현 또는 에러:', error);
    return null;
  }
}
