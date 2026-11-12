import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tenantSeoPlugin from "./vite-plugin-tenant-seo.mjs";
import { drivePdfProxyPlugin } from "./vite-plugin-drive-pdf.mjs";

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

/** يكتب/يخدم version.json لكشف التحديثات بدون إعادة تحميل */
function emitAppVersionJson(appBuildId) {
  const payload = () =>
    JSON.stringify(
      {
        buildId: appBuildId,
        builtAt: new Date().toISOString(),
      },
      null,
      2,
    );
  return {
    name: "emit-app-version-json",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: `${payload()}\n`,
      });
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = String(req.url || "");
        if (url === "/version.json" || url.startsWith("/version.json?")) {
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          res.end(payload());
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
  const appBuildId =
    env.VITE_APP_BUILD_ID ||
    process.env.GITHUB_SHA?.slice(0, 12) ||
    `${Date.now().toString(36)}`;
  const rawProxyTarget = (
    env.VITE_API_PROXY_TARGET ||
    env.VITE_API_BASE_URL ||
    (isProd ? "https://api.em-online.online/" : "http://127.0.0.1:8000")
  ).replace(/\/$/, "");
  // في التطوير: لا تسمح لـ proxy أن يشير بالخطأ إلى API البروداكشن
  // وفضّل 127.0.0.1 على localhost لتفادي IPv6 (::1) مع سيرفر آخر على نفس المنفذ
  let proxyTarget =
    !isProd && /api\.em-online\.online/i.test(rawProxyTarget)
      ? "http://127.0.0.1:8000"
      : rawProxyTarget;
  if (!isProd) {
    proxyTarget = proxyTarget.replace(/^(https?:\/\/)localhost(?=[:/]|$)/i, "$1127.0.0.1");
  }
  const isCapacitorBuild = env.CAPACITOR_BUILD === "true";
  if (!isProd) {
    console.info(`[vite][dev] API proxy → ${proxyTarget}`);
  }

  return {
    base: isCapacitorBuild ? "./" : "/",
    define: {
      __APP_BUILD_ID__: JSON.stringify(appBuildId),
    },
    server: {
      port: 3000,
      host: true,
      strictPort: true,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          timeout: 0,
          proxyTimeout: 0,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              proxyReq.setHeader("ngrok-skip-browser-warning", "1");
              const host = String(req.headers.host || "").toLowerCase();
              const tenantMatch = host.match(/^([a-z0-9-]+)\.localhost(?::\d+)?$/);
              if (tenantMatch?.[1] && !proxyReq.getHeader("X-Tenant-Subdomain")) {
                proxyReq.setHeader("X-Tenant-Subdomain", tenantMatch[1]);
              }
              console.info(
                `[vite][proxy] ${String(req.method || "GET").toUpperCase()} ${req.url} → ${proxyTarget}${req.url}`,
              );
            });
            proxy.on("proxyRes", (proxyRes, req) => {
              console.info(
                `[vite][proxy] ← ${proxyRes.statusCode} ${String(req.method || "GET").toUpperCase()} ${req.url}`,
              );
            });
            proxy.on("error", (err, req) => {
              console.error(
                `[vite][proxy] ERROR ${String(req?.method || "GET").toUpperCase()} ${req?.url} → ${proxyTarget}:`,
                err?.message || err,
              );
            });
          },
        },
        "/uploads": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        "/socket.io": {
          target: proxyTarget,
          changeOrigin: true,
          ws: true,
          secure: false,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq, req) => {
              const host = String(req.headers.host || "").toLowerCase();
              const tenantMatch = host.match(/^([a-z0-9-]+)\.localhost(?::\d+)?$/);
              if (tenantMatch?.[1]) {
                proxyReq.setHeader("X-Tenant-Subdomain", tenantMatch[1]);
              }
            });
          },
        },
        "/storage": {
          target: proxyTarget,
          changeOrigin: true,
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
      emitAppVersionJson(appBuildId),
      drivePdfProxyPlugin(),
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
            // لا ن precache الـ webmanifest — الـ SW يقدّم مانيفست ديناميكي لكل منصة مدرس
            "**/*.{js,css,html,woff2}",
            "icons/*.png",
            "images/brand-loading-hero.jpg",
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
