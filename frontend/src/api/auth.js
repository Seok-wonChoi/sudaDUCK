import api, { API_BASE_URL } from "./api";



export async function login(data) {
  const res = await api.post("/api/v1/auth/login", data);

  const accessToken = res?.data?.accessToken;
  const refreshToken = res?.data?.refreshToken;

  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
    // WS가 쿠키 access_token 필요 - cross-site 요청을 위해 SameSite=None; Secure 설정
    document.cookie = `access_token=${accessToken}; Path=/; SameSite=None; Secure`;
  }
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

  return res.data;
}




/**
 * 카카오 OAuth2 로그인
 * 백엔드 OAuth2 인증 엔드포인트로 리다이렉트
 *
 * 플로우:
 * 1. 이 함수 호출 → 백엔드 /oauth2/authorization/kakao로 리다이렉트
 * 2. 백엔드가 카카오 로그인 페이지로 리다이렉트
 * 3. 카카오 로그인 성공
 * 4. 백엔드가 프론트엔드 /oauth2/redirect?token={accessToken}로 리다이렉트
 * 5. OAuth2RedirectHandler가 토큰을 localStorage에 저장하고 메인 페이지로 이동
 */
export const loginWithKakao = () => {
  const base = (API_BASE_URL || "").trim().replace(/\/$/, "");
  const isLocal = window.location.hostname === "localhost";

  // ★ [핵심] 로컬이 아닐 때(배포 환경일 때)만 쿠키를 심습니다!
  // 로컬에서는 쿠키 심어봤자 서버로 안 날아가니 안 심는 겁니다.
  if (!isLocal) {
    document.cookie = "client_env=production; path=/; max-age=300";
  }

  console.log(`[카카오 로그인] ${isLocal ? '로컬' : '배포'} 환경 감지`);
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
