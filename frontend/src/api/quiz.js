import api from "./api";

// 퀴즈 스케줄 (3번째 턴 시작 시 호출, 15-40초 후 랜덤 발생)
// POST /api/v1/quiz/schedule
export async function scheduleQuiz(roomId, turn, participantCount) {
  const { data } = await api.post("/api/v1/quiz/schedule", null, {
    params: { roomId, turn, participantCount }
  });
  return data;
}

// 영어 답변 텍스트 제출
// POST /api/v1/quiz/submit
export async function submitQuizAnswer(quizId, userId, answerText) {
  const { data } = await api.post("/api/v1/quiz/submit", answerText, {
    params: { quizId, userId },
    headers: { 'Content-Type': 'text/plain' }
  });
  return data;
}
