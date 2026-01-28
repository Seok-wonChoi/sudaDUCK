import axios from "axios";

// API 기본 URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const REFRESH_URL = "/api/v1/auth/refresh";

// 🔑 accessToken 메모리 저장소
let accessToken = null;

// axios 인스턴스
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // refreshToken(HttpOnly 쿠키)
});

/* =========================
   REQUEST
   accessToken → Authorization
========================= */
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
   RESPONSE
   401 → refresh → 재시도
========================= */
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (!original || original._retry) {
      return Promise.reject(error);
    }

    if (original.url?.includes(REFRESH_URL)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      original._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE_URL}${REFRESH_URL}`, {}, { withCredentials: true })
            .then((res) => {
              // ✅ accessToken을 메모리에만 저장
              accessToken = res.data.accessToken;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        await refreshPromise;

        // 새 accessToken으로 재요청
        return api(original);
      } catch (e) {
        accessToken = null;
        window.location.href = "/login";
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
