import api, { API_BASE_URL } from "./api";

/**
 * 카카오 OAuth2 로그인
 * * 변경점:
 * 1. 쿠키 설정 로직 삭제 (이제 필요 없음)
 * 2. 바로 카카오로 안 가고, 백엔드 AuthController(/api/v1/auth/login)를 거쳐감
 * 3. URL 뒤에 ?env=local 파라미터를 붙여서 환경을 알림
 */
export const loginWithKakao = () => {
  // 1. API 주소 다듬기 (끝에 / 제거)
  const base = (API_BASE_URL || "").trim().replace(/\/$/, "");
  
  // 2. 현재 브라우저가 로컬인지 확인
  const isLocal = window.location.hostname === "localhost";

  // 3. 보낼 파라미터 결정 (로컬이면 'local', 아니면 'prod')
  const envParam = isLocal ? "local" : "prod";

  console.log(`[카카오 로그인] 환경: ${envParam}, AuthController로 이동합니다.`);

  // ★ [핵심] 우리가 만든 백엔드 컨트롤러로 이동! (?env=... 붙임)
  // 예: https://i14e104.../dev-api/api/v1/auth/login?env=local
  window.location.href = `${base}/api/v1/auth/login?env=${envParam}`;
};

/**
 * 로그아웃
 * POST /api/v1/auth/logout
 */
export async function logout() {
  const { data } = await api.post("/api/v1/auth/logout");
  return data;
}