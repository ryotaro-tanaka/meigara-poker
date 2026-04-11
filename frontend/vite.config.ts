import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
  server: {
    port: 4173,
    proxy: {
      "/rooms": {
        target: "http://localhost:8788",
        bypass(req) {
          const accept = req.headers.accept ?? "";

          if (req.method === "GET" && accept.includes("text/html")) {
            return "/index.html";
          }

          return undefined;
        },
      },
      "/ws": {
        target: "ws://localhost:8788",
        ws: true,
      },
      "/health": "http://localhost:8788",
    },
  },
});
