import api from "./api";

// 발음/정확도 점수 저장하기: POST /api/v1/assessment
export async function saveAssessment(assessmentData) {
  const { data } = await api.post("/api/v1/assessment", assessmentData);
  return data;
}

// 스크립트 저장하기/취소하기: POST /api/v1/script/{scriptId}/like
export async function toggleScriptLike(scriptId) {
  const { data } = await api.post(`/api/v1/script/${scriptId}/like`);
  return data;
}
