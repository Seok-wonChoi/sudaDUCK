import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
const REFRESH_URL = "/api/v1/auth/refresh";
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

  // ✅ 수정: 기존 Authorization 헤더 명시적으로 삭제
  if (config.headers) {
    // axios v1의 AxiosHeaders 타입 체크
    if (typeof config.headers.delete === "function") {
      config.headers.delete("Authorization");
      config.headers.delete("authorization");
    } else {
      delete config.headers.Authorization;
      delete config.headers.authorization;
    }
  }

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
    const existingAuth = config.headers?.Authorization || config.headers?.authorization;

    if (!token) {
      console.warn("[API] accessToken이 없습니다. 로그인이 필요합니다.");
    } else {
      console.log("[API] 요청:", config.method?.toUpperCase(), config.url, "토큰 길이:", token.length);
      if (existingAuth) {
        console.log("[API] 기존 Authorization 헤더 존재:", existingAuth.substring(0, 20) + "...");
      }
    }
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
      console.warn("[API] 401 에러 발생:", originalRequest.url);

      // refresh 요청 자체가 401이면 바로 로그아웃
      if (originalRequest.url?.includes(REFRESH_URL)) {
        console.error("[API] 토큰 재발급 실패. 로그인 페이지로 이동합니다.");
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
            console.error("[API] refreshToken이 없습니다. 로그인 페이지로 이동합니다.");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "/login";
            return Promise.reject(error);
          }

          console.log("[API] 토큰 재발급 시도 중...");

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

              console.log("[API] 토큰 재발급 성공");
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

        // ✅ 수정: 새 토큰으로 원래 요청 재시도 (기존 헤더 완전히 제거 후 세팅)
        console.log("[API] 새 토큰으로 재시도:", originalRequest.url);
        console.log("[API] 새 토큰 길이:", newAccessToken.length);
        
        // 기존 헤더 완전 삭제
        if (originalRequest.headers) {
          if (typeof originalRequest.headers.delete === "function") {
            originalRequest.headers.delete("Authorization");
            originalRequest.headers.delete("authorization");
          } else {
            delete originalRequest.headers.Authorization;
            delete originalRequest.headers.authorization;
          }
        }
        
        // 새 토큰으로 헤더 설정
        setAuthHeader(originalRequest, newAccessToken);
        
        console.log("[API] 재시도 헤더 설정 완료");
        return api(originalRequest);
      } catch (refreshErr) {
        console.error("[API] 토큰 재발급 실패. 로그인 페이지로 이동합니다.", refreshErr);
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
