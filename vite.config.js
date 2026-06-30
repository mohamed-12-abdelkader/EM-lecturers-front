import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tenantSeoPlugin from "./vite-plugin-tenant-seo.mjs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = (
    env.VITE_API_PROXY_TARGET ||
    env.VITE_API_BASE_URL ||
    "http://api.em-online.online/"
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
      },
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
