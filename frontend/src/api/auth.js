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
 * GET {API_BASE_URL}/oauth2/authorization/kakao
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
  try {
    // 1️⃣ 서버 로그아웃 (refreshToken 무효화용)
    await api.post("/api/v1/auth/logout");
  } catch (e) {
    // 서버 에러 나도 프론트 로그아웃은 진행
    console.warn("서버 로그아웃 실패 (무시 가능):", e);
  }

  // 2️⃣ 프론트 토큰 제거
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userProfile");
  localStorage.removeItem("userNickname");

  // 3️⃣ 쿠키 제거 (WS 인증용)
  document.cookie = "access_token=; Path=/; Max-Age=0; SameSite=None; Secure";
  document.cookie = "access_token=; Path=/; Max-Age=0; SameSite=Lax";

  // 4️⃣ 세션 스토리지 정리
  sessionStorage.clear();
}