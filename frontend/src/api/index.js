import axios from "axios";

// API 기본 설정
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// refresh API (명세서)
const REFRESH_URL = "/api/v1/auth/refresh";

// 공통 axios 인스턴스
const api = axios.create({
  baseURL: API_BASE_URL,     // 예: http://localhost:8080
  withCredentials: true,     // ✅ HttpOnly 쿠키(토큰) 자동 포함
});

// 동시에 여러 요청이 401을 맞아도 refresh는 1번만 하게끔
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // config가 없거나 이미 재시도한 요청이면 그대로 실패 처리
    if (!original || original._retry) {
      return Promise.reject(error);
    }

    // refresh 요청 자체가 실패한 경우(무한 루프 방지)
    if (original.url?.includes(REFRESH_URL)) {
      return Promise.reject(error);
    }

    // 401 = access 만료로 가정 → refresh 시도
    if (error.response?.status === 401) {
      original._retry = true;

      try {
        // refresh가 진행 중이면 그걸 기다리고, 아니면 새로 시작
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE_URL}${REFRESH_URL}`, {}, { withCredentials: true })
            .finally(() => {
              refreshPromise = null;
            });
        }

        await refreshPromise;

        // refresh 성공 → 원래 요청 재시도
        return api(original);
      } catch (refreshErr) {
        // refresh 실패 → 로그인 만료 처리
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
