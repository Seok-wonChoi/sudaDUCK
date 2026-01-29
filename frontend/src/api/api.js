import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/dev-api";
const REFRESH_URL = "/api/v1/auth/refresh";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

/* [REQUEST INTERCEPTOR] 헤더에 토큰 부착 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // 띄어쓰기 한 칸 확인!
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* [RESPONSE INTERCEPTOR] 401 에러 시 토큰 재발급 */
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 1. 401 에러이고, 재시도한 적이 없을 때만 실행
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // 무한 루프 방지: refresh 요청 자체가 401이면 바로 로그아웃
      if (originalRequest.url?.includes(REFRESH_URL)) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // 2. 리프레시 토큰으로 새 엑세스 토큰 요청
        if (!refreshPromise) {
          const storedRefreshToken = localStorage.getItem("refreshToken");

          refreshPromise = axios
            .post(`${API_BASE_URL}${REFRESH_URL}`, 
              { refreshToken: storedRefreshToken }, // ✅ 바디에 토큰 실어 보내기
              { withCredentials: true }
            )
            .then((res) => {
              const newAccessToken = res?.data?.accessToken;
              if (newAccessToken) {
                localStorage.setItem("accessToken", newAccessToken);
                return newAccessToken;
              }
              throw new Error("No AccessToken in response");
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newAccessToken = await refreshPromise;

        // 3. 새 토큰으로 헤더 교체 후 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshErr) {
        // 4. 리프레시마저 실패하면 모든 정보 삭제 후 로그인 페이지로
        console.error("[API] 토큰 재발급 실패:", refreshErr);
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