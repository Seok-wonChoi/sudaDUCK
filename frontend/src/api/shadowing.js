import api from "./api";

// 대화 스크립트 조회
export async function getTurnScripts(roomId, turnNo) {
  const { data } = await api.get(
    `/api/v1/session/${roomId}/turns/${turnNo}/scripts`,
  );
  return data;
}

// 추가: 턴별 점수 조회 (score + averageScore 포함)
export async function getTurnResults(roomId, turnNo) {
  const { data } = await api.get(
    `/api/v1/session/room/${roomId}/turn/${turnNo}/results`,
  );
  return data;
}

// 발음/정확도 점수 저장하기
export async function saveAssessment(audioBlob, roomId, turnNo, scriptId) {
  const formData = new FormData();

  // 1. 파일 확장자 동적 처리: Blob 객체의 type(예: audio/webm)에서 확장자 추출
  const extension = audioBlob.type.split("/")[1].split(";")[0] || "webm";
  formData.append("audio", audioBlob, `recording.${extension}`);
  // 2. 파라미터 추가
  formData.append("roomId", roomId);
  formData.append("turnNo", turnNo);
  formData.append("scriptId", scriptId);

  // ⚠️ FormData 전송 시 Content-Type 헤더를 명시하지 않아야 함
  // axios가 자동으로 boundary를 포함한 multipart/form-data를 설정함
  // api.js의 request interceptor가 자동으로 Authorization 헤더 추가
  const { data } = await api.post("/api/v1/assessment", formData, {
    timeout: 30000, // ← 30초 타임아웃 추가!
  });
  return data;
}

// 스크립트 저장하기, 취소하기
export async function toggleScriptLike(scriptId, roomId, turnNo) {
  const { data } = await api.post(`/api/v1/script/${scriptId}/like`, null, {
    params: { roomId, turnNo }, // roomId와 turnNo 둘 다 전송
  });
  return data;
}
