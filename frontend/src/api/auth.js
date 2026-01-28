import { API_BASE_URL } from "./api";

/**
 * 카카오 OAuth2 로그인
 * 백엔드 OAuth2 인증 엔드포인트로 리다이렉트
 */
export const loginWithKakao = () => {
  const base = (API_BASE_URL || "").trim().replace(/\/$/, "");
  // base가 "/dev-api" 여도 정상 → "/dev-api/oauth2/authorization/kakao"
  window.location.href = `${base}/oauth2/authorization/kakao`;
};
