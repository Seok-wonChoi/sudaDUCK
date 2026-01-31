import axios from "axios";

// 1. 환경 변수가 있으면 쓰고, 없으면 현재 호스트 주소를 기본값으로 사용
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

export const API_BASE_URL = rawBaseUrl
  .trim()
  .replace(/\/$/, "");
  
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

function setAuthHeader(config, token) {
  if (!token) return config;

  // axios v1에서 headers가 AxiosHeaders인 경우 set이 가장 안전
  if (config.headers && typeof config.headers.set === "function") {
    config.headers.set("Authorization", `Bearer ${token}`);
  } else {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
}

/* [REQUEST INTERCEPTOR] 헤더에 토큰 부착 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    return setAuthHeader(config, token);
  },
  (error) => Promise.reject(error)
);

/* [RESPONSE INTERCEPTOR] 401 에러 시 토큰 재발급 */
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // refresh 요청 자체가 401이면 바로 로그아웃
      if (originalRequest.url?.includes(REFRESH_URL)) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          const storedRefreshToken = localStorage.getItem("refreshToken");
          if (!storedRefreshToken) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "/login";
            return Promise.reject(error);
          }

          refreshPromise = axios
            .post(
              `${API_BASE_URL}${REFRESH_URL}`,
              { refreshToken: storedRefreshToken },
              {
                withCredentials: true,
                headers: { "Content-Type": "application/json" },
              }
            )
            .then((res) => {
              const newAccessToken = res?.data?.accessToken;
              const newRefreshToken = res?.data?.refreshToken;

              if (!newAccessToken) throw new Error("No AccessToken in response");

              localStorage.setItem("accessToken", newAccessToken);
              if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);

              // WS가 쿠키 access_token을 요구 - cross-site 요청을 위해 SameSite=None; Secure 설정
              document.cookie = `access_token=${newAccessToken}; Path=/; SameSite=None; Secure`;

              return newAccessToken;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newAccessToken = await refreshPromise;

        // 새 토큰으로 원래 요청 재시도 (헤더 확실히 세팅)
        setAuthHeader(originalRequest, newAccessToken);
        return api(originalRequest);
      } catch (refreshErr) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
