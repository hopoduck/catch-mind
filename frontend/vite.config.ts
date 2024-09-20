import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/socket.io/": {
        target: "ws://localhost:4000",
        ws: true,
        rewriteWsOrigin: true,
      },
    },
  },
});
