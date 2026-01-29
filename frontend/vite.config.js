// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "src"),
//     },
//   },
//   server: {
//     proxy: {
//       "/dev-api": {
//         target: "https://i14e104.p.ssafy.io",
//         changeOrigin: true,
//       },
//       "/ws": {
//         target: "https://i14e104.p.ssafy.io",
//         changeOrigin: true,
//         ws: true,
//       },
//     },
//   },
// });
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    proxy: {
      "/dev-api": {
        target: "https://i14e104.p.ssafy.io",
        changeOrigin: true,
        ws: true,              // 중요: /dev-api/ws 업그레이드 처리
        secure: true,          // 인증서 문제 있으면 false로
        // 아래는 “백엔드가 Domain=i14e104... 로 쿠키를 굽는 경우” 로컬에서 쿠키 저장을 살리는 옵션
        // cookieDomainRewrite: "localhost",
      },
    },
  },
});
