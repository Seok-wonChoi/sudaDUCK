import api from "./api";

// 퀴즈 스케줄 (3번째 턴 시작 시 호출, 15-40초 후 랜덤 발생)
// POST /api/v1/quiz/schedule
export async function scheduleQuiz(roomId, turn, participantCount) {
  if (!roomId) {
    console.error("[Quiz API] roomId가 없습니다:", { roomId, turn, participantCount });
    throw new Error("roomId is required for scheduling quiz");
  }

  const { data } = await api.post("/api/v1/quiz/schedule", null, {
    params: { roomId, turn, participantCount }
  });
  return data;
}

// 영어 답변 음성 파일 제출 (백엔드가 STT 처리)
// POST /api/v1/quiz/submit
export async function submitQuizAnswer(quizId, userId, audioBlob) {
  console.log("[Quiz API] 답변 제출 요청:", {
    quizId,
    userId,
    audioBlobSize: audioBlob?.size,
    audioBlobType: audioBlob?.type
  });

  if (!quizId || !userId || !audioBlob) {
    console.error("[Quiz API] 필수 파라미터 누락:", { quizId, userId, hasAudioBlob: !!audioBlob });
    throw new Error("quizId, userId, audioBlob are required");
  }

  // FormData로 오디오 파일 전송
  const formData = new FormData();
  const fileName = audioBlob.type === 'audio/wav' ? 'answer.wav' : 'answer.webm';
  formData.append('audioFile', audioBlob, fileName);

  const { data } = await api.post("/api/v1/quiz/submit", formData, {
    params: { quizId, userId },
    // FormData는 Content-Type을 자동 설정하므로 명시하지 않음
  });

  console.log("[Quiz API] 답변 제출 응답:", data);
  return data;
}
