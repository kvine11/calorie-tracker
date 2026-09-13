// defineConfig from vitest/config is a superset of vite's, so one file
// configures both the dev server and the test runner.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The browser only ever talks to Vite, which forwards /api to Spring Boot.
    // Same origin, so CORS never comes up in development.
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        configure(proxy) {
          // Backend not running: answer the way the API itself answers errors
          // (problem+json), so the UI shows a real message instead of a blank 500.
          proxy.on("error", (_error, _req, res) => {
            if (typeof res.writeHead !== "function" || res.headersSent) return;
            res.writeHead(503, { "Content-Type": "application/problem+json" });
            res.end(
              JSON.stringify({
                title: "API unreachable",
                status: 503,
                detail: "Can't reach the server. Is the backend running on :8080?",
              }),
            );
          });
        },
      },
    },
  },

  test: {
    // Component and hook tests need a DOM; the pure helpers don't care.
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
    css: false,
  },
});
