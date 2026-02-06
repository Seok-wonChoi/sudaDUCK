import api from "./api";
import { logWarning } from "../utils/errorLogger";

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
    // 구조화된 경고 로그 (프로덕션에서 Sentry 등으로 전송 가능)
    logWarning('clearReviewData', 'API 미구현 또는 호출 실패', {
      roomId,
      status: error?.response?.status,
      message: error?.message
    });
    return null;
  }
}

// 게임 데이터 정리 API 호출
export async function cleanupGameData(roomId) {
  const { data } = await api.post(`/api/v1/mini_game/${roomId}/cleanup`);
  return data;
}