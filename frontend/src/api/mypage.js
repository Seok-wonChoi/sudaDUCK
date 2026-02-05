import api from "./api";

// 오리 커스터마이징 장착: PATCH /api/v1/me/profile/custom/duck
export async function updateDuckCustom(customData) {
  const { data } = await api.patch("/api/v1/me/profile/custom/duck", customData);
  return data;
}

// 닉네임 커스터마이징: PATCH /api/v1/me/profile/custom/avatar
export async function updateAvatarCustom(avatarData) {
  const { data } = await api.patch("/api/v1/me/profile/custom/avatar", avatarData);
  return data;
}

// 사용자 프로필 커스터마이징 정보 조회: GET /api/v1/me/profile/custom
export async function getMyProfileCustom() {
  const { data } = await api.get("/api/v1/me/profile/custom");
  return data;
}

// 아이템 목록 조회: GET /api/v1/shop/custom-items?category={category}
export async function getCustomItems(category) {
  const { data } = await api.get("/api/v1/shop/custom-items", {
    params: { category }
  });
  return data;
}

// 아이템 구매: POST /api/v1/shop/custom-items/{itemId}/purchase
export async function purchaseItem(itemId) {
  const { data } = await api.post(`/api/v1/shop/custom-items/${itemId}/purchase`);
  return data;
}

// 프로필 닉네임 수정: PATCH /api/v1/me/profile/nickname
export async function updateNickname(nicknameData) {
  const { data } = await api.patch("/api/v1/me/profile/nickname", nicknameData);
  return data;
}

// AI 오리봇 커스터마이징: PATCH /api/v1/me/profile/custom/ai-duckbot
export async function updateAiDuckBot(duckBotData) {
  const { data } = await api.patch("/api/v1/me/profile/custom/ai-duckbot", duckBotData);
  return data;
}

// 내가 저장한 스크립트 모두 조회하기: GET /api/v1/script/my
export async function getMyScripts() {
  const { data } = await api.get("/api/v1/script/my");
  return data;
}

// 마이페이지 요약 정보 조회: GET /api/v1/mypage/summary
export async function getMypageSummary() {
  const { data } = await api.get("/api/v1/mypage/summary");
  return data;
}