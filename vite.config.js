import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tenantSeoPlugin from "./vite-plugin-tenant-seo.mjs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isProd = mode === "production";
  const proxyTarget = (
    env.VITE_API_PROXY_TARGET ||
    env.VITE_API_BASE_URL ||
    (isProd ? "https://api.em-online.online/" : "http://localhost:8000")
  ).replace(/\/$/, "");

  return {
    server: {
      port: 3000,
      host: true,
      strictPort: true,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("ngrok-skip-browser-warning", "1");
            });
          },
        },
        "/socket.io": {
          target: proxyTarget,
          changeOrigin: true,
          ws: true,
          secure: false,
        },
      },
    },
    build: {
      // دعم أوسع لأجهزة/متصفحات أقدم — يقلل أعطال الشاشة البيضاء من syntax حديث
      target: ["es2019", "safari13"],
      cssTarget: ["chrome80", "safari13"],
    },
    plugins: [
      react(),
      tenantSeoPlugin({
        apiBase: proxyTarget,
        rootDomain: env.VITE_TENANT_ROOT_DOMAIN || "",
      }),
    ],
  };
});
