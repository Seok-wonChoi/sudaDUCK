import api from "./api";

/**
 * 한국어 텍스트를 영어로 번역
 * @param {string} roomId - 방 ID
 * @param {string} text - 한국어 텍스트
 * @param {number} turnNo - 턴 번호
 * @param {number} speakerId - 발화자 ID
 * @returns {Promise<Object>} 번역 결과
 */
export async function translateToEnglish(roomId, text, turnNo, speakerId) {
  const { data } = await api.post("/api/v1/gpt/translate", {
    roomId,
    text,
    turnNo,
    speakerId,
  });
  return data;
}
