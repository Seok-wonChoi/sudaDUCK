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
  // 웹소켓 전용 (경로가 /dev-api/ws 로 올 경우)
  "/dev-api/ws": {
    target: "https://i14e104.p.ssafy.io",
    changeOrigin: true,
    ws: true,
    rewrite: (path) => path.replace(/^\/dev-api/, ""),
  },
  // 일반 API 전용
  "/dev-api": {
    target: "https://i14e104.p.ssafy.io",
    changeOrigin: true,
  },
  // 오디오 파일 프록시 (TTS 음성 파일)
  "/audio": {
    target: "https://i14e104.p.ssafy.io",
    changeOrigin: true,
  },
  },
}
});
