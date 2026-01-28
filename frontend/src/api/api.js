import axios from "axios";

<<<<<<< HEAD
// API 기본 URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const REFRESH_URL = "/api/v1/auth/refresh";

// 🔑 accessToken 메모리 저장소
let accessToken = null;

// axios 인스턴스
=======
// ✅ API 기본 URL
// - 운영/배포: VITE_API_BASE_URL=https://i14e104.p.ssafy.io/dev-api 같은 형태 추천
// - 로컬+프록시: VITE_API_BASE_URL=/dev-api 로 두면 편함
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/dev-api";

// refresh API
const REFRESH_URL = "/api/v1/auth/refresh";

// axios 인스턴스 (단 하나)
>>>>>>> 96b5fbac90e3127ece5db3f9905d86ea53b1d2f9
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
<<<<<<< HEAD
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
=======
  withCredentials: true, // refreshToken(HttpOnly 쿠키) 포함
});

/* =========================
   REQUEST INTERCEPTOR
   accessToken → Authorization 헤더
========================= */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken"); // 팀 합의대로 localStorage 사용
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
>>>>>>> 96b5fbac90e3127ece5db3f9905d86ea53b1d2f9
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================
<<<<<<< HEAD
   RESPONSE
=======
   RESPONSE INTERCEPTOR
>>>>>>> 96b5fbac90e3127ece5db3f9905d86ea53b1d2f9
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

<<<<<<< HEAD
=======
    // refresh 요청 자체가 실패한 경우(무한 루프 방지)
>>>>>>> 96b5fbac90e3127ece5db3f9905d86ea53b1d2f9
    if (original.url?.includes(REFRESH_URL)) {
      return Promise.reject(error);
    }

<<<<<<< HEAD
=======
    // 401 = accessToken 만료로 가정 → refresh 시도
>>>>>>> 96b5fbac90e3127ece5db3f9905d86ea53b1d2f9
    if (error.response?.status === 401) {
      original._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE_URL}${REFRESH_URL}`, {}, { withCredentials: true })
            .then((res) => {
<<<<<<< HEAD
              // ✅ accessToken을 메모리에만 저장
              accessToken = res.data.accessToken;
=======
              // ✅ refresh 응답이 { accessToken: "..." } 형태라고 가정
              const newAccessToken = res?.data?.accessToken;
              if (newAccessToken) {
                localStorage.setItem("accessToken", newAccessToken);
              }
>>>>>>> 96b5fbac90e3127ece5db3f9905d86ea53b1d2f9
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        await refreshPromise;

<<<<<<< HEAD
        // 새 accessToken으로 재요청
        return api(original);
      } catch (e) {
        accessToken = null;
        window.location.href = "/login";
        return Promise.reject(e);
=======
        // ✅ 혹시 기존 헤더에 옛 토큰이 남아있을 수 있어서 제거 후 재시도
        if (original.headers?.Authorization) {
          delete original.headers.Authorization;
        }

        return api(original);
      } catch (refreshErr) {
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        return Promise.reject(refreshErr);
>>>>>>> 96b5fbac90e3127ece5db3f9905d86ea53b1d2f9
      }
    }

    return Promise.reject(error);
  }
);

export default api;
