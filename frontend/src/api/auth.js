import api, { API_BASE_URL } from "./api";

/**
 * 카카오 OAuth2 로그인
 * * 변경점:
 * 1. 쿠키 설정 로직 삭제 (이제 필요 없음)
 * 2. 바로 카카오로 안 가고, 백엔드 AuthController(/api/v1/auth/login)를 거쳐감
 * 3. URL 뒤에 ?env=local 파라미터를 붙여서 환경을 알림
 */
export const loginWithKakao = () => {
  const base = (API_BASE_URL || "").trim().replace(/\/$/, "");
  window.location.href = `${base}/oauth2/authorization/kakao`;
};


/**
 * 로그아웃
 * POST /api/v1/auth/logout
 */
export async function logout() {
  const { data } = await api.post("/api/v1/auth/logout");
  return data;
}