import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// The browser talks to the Vite dev server only. Requests to /api and /actuator are proxied to the
// backend, so the backend needs no CORS configuration and the browser never sees a second origin.
// QMSYNC_DEV_PROXY_TARGET intentionally has no VITE_ prefix: it is a dev-server setting, not browser config.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.QMSYNC_DEV_PROXY_TARGET || "http://localhost:8080";
  const proxy = {
    "/actuator": { target: proxyTarget, changeOrigin: true },
    "/api": { target: proxyTarget, changeOrigin: true },
  };

  return {
    plugins: [react()],
    server: { port: 5173, strictPort: true, proxy },
    preview: { port: 5173, strictPort: true, proxy },
  };
});
