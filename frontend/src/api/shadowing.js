import api from "./api";

// 대화 스크립트 조회: GET /api/v1/session/{roomId}/turns/{turnNo}/scripts
export async function getTurnScripts(roomId, turnNo) {
  const { data } = await api.get(
    `/api/v1/session/${roomId}/turns/${turnNo}/scripts`,
  );
  return data;
}

// 발음/정확도 점수 저장하기: POST /api/v1/assessment
// 백엔드는 MultipartFile + RequestParam 형식으로 받음
// Redis에 score만 저장하고 응답은 { message: "평가 완료" }
export async function saveAssessment(audioBlob, roomId, turnNo, scriptId) {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("roomId", roomId);
  formData.append("turnNo", turnNo);
  formData.append("scriptId", scriptId);

  const { data } = await api.post("/api/v1/assessment", formData);
  return data;
}

// 스크립트 저장하기/취소하기: POST /api/v1/script/{scriptId}/like
export async function toggleScriptLike(scriptId) {
  const { data } = await api.post(`/api/v1/script/${scriptId}/like`);
  return data;
}
