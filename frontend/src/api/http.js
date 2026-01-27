import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// 모든 요청에 JWT 자동 첨부
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken"); // 필요 시 키 이름 변경
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 에러 메시지 정리(디버깅 필요하면 console.log 추가 가능)
http.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "요청에 실패했습니다.";
    return Promise.reject(new Error(message));
  }
);

export default http;
