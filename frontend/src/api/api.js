import axios from "axios";
import { jwtDecode } from "jwt-decode"; // ✅ 추가!

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
const REFRESH_URL = "/api/v1/auth/refresh";
export const API_BASE_URL = rawBaseUrl.trim().replace(/\/$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  // ✅ 기본 Content-Type 제거 (FormData 처리를 위해)
  withCredentials: true,
});

function setAuthHeader(config, token) {
  if (!token) return config;

  // 기존 Authorization 헤더 명시적으로 삭제
  if (config.headers) {
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

/* [REQUEST INTERCEPTOR] 헤더에 토큰 부착 + 사전 갱신 */
api.interceptors.request.use(
  async (config) => {
    // ✅ 재시도 요청인 경우, 이미 response interceptor에서 헤더를 설정했으므로 건너뜀
    if (config._retry) {
      console.log("[API] 재시도 요청 - request interceptor 건너뜀");
      return config;
    }

    let token = localStorage.getItem("accessToken");

    // ✅ FormData가 아닌 경우에만 Content-Type 설정
    if (!(config.data instanceof FormData)) {
      config.headers = config.headers || {};
      config.headers["Content-Type"] = "application/json";
    }

    if (!token) {
      console.warn("[API] accessToken이 없습니다. 로그인이 필요합니다.");
      return setAuthHeader(config, token);
    }

    // ✅ 토큰 만료 시간 확인 및 사전 갱신
    try {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      const timeLeft = decoded.exp - now;

      // 토큰이 5분(300초) 내로 만료되면 미리 갱신
      if (timeLeft < 300) {
        console.log("[API] ⚠️ 토큰 만료 임박! 사전 갱신 시작...");

        const storedRefreshToken = localStorage.getItem("refreshToken");
        if (!storedRefreshToken) {
          console.error("[API] refreshToken이 없습니다.");
          return setAuthHeader(config, token);
        }

        try {
          const response = await axios.post(
            `${API_BASE_URL}${REFRESH_URL}`,
            { refreshToken: storedRefreshToken },
            {
              withCredentials: true,
              headers: { "Content-Type": "application/json" },
            },
          );

          const newAccessToken = response?.data?.accessToken;
          const newRefreshToken = response?.data?.refreshToken;

          if (newAccessToken) {
            localStorage.setItem("accessToken", newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem("refreshToken", newRefreshToken);
            }
            document.cookie = `access_token=${newAccessToken}; Path=/; SameSite=None; Secure`;

            token = newAccessToken;
            console.log("[API] ✅ 토큰 사전 갱신 완료!");
          }
        } catch (refreshError) {
          console.error("[API] 토큰 사전 갱신 실패:", refreshError);
          // 실패해도 기존 토큰으로 시도
        }
      }
    } catch (decodeError) {
      console.warn("[API] 토큰 디코딩 실패:", decodeError);
      // 디코딩 실패해도 기존 토큰으로 시도
    }

    console.log(
      "[API] 요청:",
      config.method?.toUpperCase(),
      config.url,
      "토큰 길이:",
      token.length,
    );

    return setAuthHeader(config, token);
  },
  (error) => Promise.reject(error),
);

/* [RESPONSE INTERCEPTOR] 401 에러 시 토큰 재발급 */
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
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
            console.error(
              "[API] refreshToken이 없습니다. 로그인 페이지로 이동합니다.",
            );
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "/";
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
              },
            )
            .then((res) => {
              const newAccessToken = res?.data?.accessToken;
              const newRefreshToken = res?.data?.refreshToken;

              if (!newAccessToken)
                throw new Error("No AccessToken in response");

              console.log("[API] 토큰 재발급 성공");
              localStorage.setItem("accessToken", newAccessToken);
              if (newRefreshToken)
                localStorage.setItem("refreshToken", newRefreshToken);

              document.cookie = `access_token=${newAccessToken}; Path=/; SameSite=None; Secure`;

              return newAccessToken;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newAccessToken = await refreshPromise;

        console.log("[API] 새 토큰으로 재시도:", originalRequest.url);

        // 새 토큰으로 헤더 설정 (setAuthHeader 내부에서 기존 헤더 삭제 후 설정)
        setAuthHeader(originalRequest, newAccessToken);

        console.log("[API] 재시도 헤더 설정 완료");
        console.log("[API] 재시도 요청 헤더:", {
          Authorization: originalRequest.headers?.Authorization || originalRequest.headers?.authorization,
          hasAuthHeader: !!(originalRequest.headers?.Authorization || originalRequest.headers?.authorization)
        });

        return api(originalRequest);
      } catch (refreshErr) {
        console.error(
          "[API] 토큰 재발급 실패. 로그인 페이지로 이동합니다.",
          refreshErr,
        );
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
