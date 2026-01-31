import api from "./api";

// 퀴즈 스케줄 (3번째 턴 시작 시 호출, 15-40초 후 랜덤 발생)
// POST /api/v1/quiz/schedule
export async function scheduleQuiz(roomId, turn, participantCount) {
  const { data } = await api.post("/api/v1/quiz/schedule", null, {
    params: { roomId, turn, participantCount }
  });
  return data;
}

// 음성 파일로 영어 답변 제출
// POST /api/v1/quiz/submit
export async function submitQuizAnswer(quizId, userId, audioFile) {
  const formData = new FormData();
  formData.append('audiofile', audioFile);

  const { data } = await api.post("/api/v1/quiz/submit", formData, {
    params: { quizId, userId },
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}
