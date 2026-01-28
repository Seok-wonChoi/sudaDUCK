import { API_BASE_URL } from "./index";

/**
 * 카카오 OAuth2 로그인
 * 백엔드의 OAuth2 인증 엔드포인트로 리다이렉트
 */
export const loginWithKakao = () => {
  const base = API_BASE_URL?.trim();
  const url = base
    ? `${base}/oauth2/authorization/kakao`
    : `/oauth2/authorization/kakao`;

  window.location.href = url;
};