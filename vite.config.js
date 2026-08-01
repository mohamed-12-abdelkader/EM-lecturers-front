import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tenantSeoPlugin from "./vite-plugin-tenant-seo.mjs";

/**
 * وضع التطوير فقط: SW "تنظيف ذاتي" على /sw.js.
 * أي Service Worker قديم مسجّل في متصفح المطوّر (من جلسات/إصدارات سابقة)
 * سيُستبدل به تلقائياً → يمسح كل الكاش، يلغي تسجيل نفسه، ويعيد تحميل الصفحة.
 * يمنع أخطاء مثل: 504 Outdated Optimize Dep الناتجة عن صفحات مخزّنة قديمة.
 */
const DEV_SW_KILLSWITCH = `
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    } catch (e) {}
    try { await self.registration.unregister(); } catch (e) {}
    try {
      const clientsList = await self.clients.matchAll({ type: "window" });
      clientsList.forEach((client) => client.navigate(client.url));
    } catch (e) {}
  })());
});
`;

function devServiceWorkerKillSwitch() {
  return {
    name: "dev-sw-killswitch",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = String(req.url || "");
        if (url === "/sw.js" || url.startsWith("/sw.js?")) {
          res.setHeader("Content-Type", "text/javascript");
          res.setHeader("Cache-Control", "no-store");
          res.end(DEV_SW_KILLSWITCH);
          return;
        }
        next();
      });
    },
  };
}

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
      // ملاحظة: لا نستخدم manualChunks يدوياً — التقسيم اليدوي السابق أنتج
      // chunks دائرية (vendor <-> vendor-react) فكان framer-motion يتنفّذ قبل
      // جاهزية React ويرمي "Cannot read properties of undefined (reading 'createContext')".
      // التقسيم الفعلي يتم تلقائياً عبر lazy loading لصفحات الراوتر.
    },
    plugins: [
      react(),
      devServiceWorkerKillSwitch(),
      tenantSeoPlugin({
        apiBase: proxyTarget,
        rootDomain: env.VITE_TENANT_ROOT_DOMAIN || "",
      }),
      VitePWA({
        // نحتفظ بـ SW مخصص (Web Push) مع precache من Workbox
        strategies: "injectManifest",
        srcDir: "src/pwa",
        filename: "sw.js",
        // المانيفست ملف ثابت في public/ — يعمل في التطوير والإنتاج معاً
        manifest: false,
        // التسجيل يتم يدوياً في src/pwa/registerPWA.js (كشف التحديثات)
        injectRegister: false,
        injectManifest: {
          globPatterns: [
            "**/*.{js,css,html,woff2,webmanifest}",
            "icons/*.png",
            "offline.html",
          ],
          // الباندل الرئيسي أكبر من الحد الافتراضي (2MB)
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        },
        devOptions: {
          // في التطوير لا يوجد SW — اختبر عبر: npm run build && npm run preview
          enabled: false,
        },
      }),
    ],
  };
});
