import { API_BASE_URL } from "./api";

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
  console.log("[카카오 로그인] 백엔드 OAuth 엔드포인트로 이동:", `${base}/oauth2/authorization/kakao`);
  window.location.href = `${base}/oauth2/authorization/kakao`;
};
