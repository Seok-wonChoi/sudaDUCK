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