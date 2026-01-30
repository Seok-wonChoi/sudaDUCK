import api, { API_BASE_URL } from "./api";

/**
 * 일반 로그인 (기존 유지)
 */
export async function login(data) {
  const res = await api.post("/api/v1/auth/login", data);
  const accessToken = res?.data?.accessToken;
  const refreshToken = res?.data?.refreshToken;

  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
    document.cookie = `access_token=${accessToken}; Path=/; SameSite=None; Secure`;
  }
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

  return res.data;
}

/**
 * 카카오 OAuth2 로그인 (운영 환경 하드코딩 버전)
 */
export const loginWithKakao = () => {
  // 1. API 주소 다듬기 (젠킨스가 넣어준 prod-api 사용)
  const base = (API_BASE_URL || "").trim().replace(/\/$/, "");
  
  console.log("[PROD] 카카오 로그인 시작 (Target: " + base + ")");

  // 2. 파라미터 없이 운영 API 서버의 로그인 엔드포인트로 바로 이동
  // 주소 예: https://i14e104.p.ssafy.io/prod-api/api/v1/auth/login
  window.location.href = `${base}/api/v1/auth/login`;
};

/**
 * 로그아웃
 */
export async function logout() {
  const { data } = await api.post("/api/v1/auth/logout");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  return data;
}