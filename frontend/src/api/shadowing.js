import api from "./api";

// 대화 스크립트 조회
export async function getTurnScripts(roomId, turnNo) {
  const { data } = await api.get(
    `/api/v1/session/${roomId}/turns/${turnNo}/scripts`,
  );
  return data;
}

// 발음/정확도 점수 저장하기
export async function saveAssessment(audioBlob, roomId, turnNo, scriptId) {
  const formData = new FormData();

  // 1. 파일 확장자 동적 처리: Blob 객체의 type(예: audio/webm)에서 확장자 추출
  const extension = audioBlob.type.split("/")[1] || "webm";
  formData.append("audio", audioBlob, `recording.${extension}`);

  // 2. 파라미터 추가
  formData.append("roomId", roomId);
  formData.append("turnNo", turnNo);
  formData.append("scriptId", scriptId);

  // ⚠️ FormData 전송 시 Content-Type 헤더를 명시하지 않아야 함
  // axios가 자동으로 boundary를 포함한 multipart/form-data를 설정함
  // 명시적으로 설정하면 Authorization 헤더가 누락될 수 있음
  const { data } = await api.post("/api/v1/assessment", formData);
  return data;
}

// 스크립트 저장하기, 취소하기
export async function toggleScriptLike(scriptId) {
  const { data } = await api.post(`/api/v1/script/${scriptId}/like`);
  return data;
}
