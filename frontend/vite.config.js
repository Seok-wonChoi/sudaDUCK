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
      },
      "/ws": {
        target: "https://i14e104.p.ssafy.io",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
