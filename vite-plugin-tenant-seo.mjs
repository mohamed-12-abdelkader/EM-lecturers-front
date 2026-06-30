import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseSubdomainFromHost(host, rootDomain) {
  const hostname = String(host || "")
    .split(":")[0]
    .toLowerCase();

  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  if (hostname.endsWith(".localhost")) {
    const sub = hostname.slice(0, -".localhost".length);
    return sub && sub !== "www" ? sub : null;
  }

  const root = String(rootDomain || "").toLowerCase();
  if (root && hostname.endsWith(`.${root}`)) {
    const sub = hostname.slice(0, -(`.${root}`).length);
    return sub && sub !== "www" ? sub : null;
  }

  return null;
}

/** Known tenant public pages that should receive injected SEO metadata. */
const TENANT_HTML_ROUTES = new Set([
  "/",
  "/index.html",
  "/teacher",
  "/courses",
  "/courses/latest",
  "/courses/popular",
  "/subjects",
  "/search",
]);

function isHtmlDocumentRequest(url) {
  const pathname = (url || "/").split("?")[0];

  // Never intercept Vite internals, source modules, API, or static assets.
  if (
    pathname.startsWith("/@") ||
    pathname.startsWith("/src/") ||
    pathname.startsWith("/node_modules/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/assets/") ||
    pathname.includes(".")
  ) {
    return false;
  }

  if (TENANT_HTML_ROUTES.has(pathname)) return true;
  if (pathname.startsWith("/course/")) return true;
  if (pathname.startsWith("/free-lectures/")) return true;

  return false;
}

function resolveSeoPage(pathname) {
  const path = (pathname || "/").split("?")[0];
  if (path === "/" || path === "/index.html") return { page: "home" };
  if (path === "/teacher") return { page: "teacher" };
  if (path === "/courses" || path.startsWith("/courses/")) return { page: "courses" };
  if (path.startsWith("/course/")) return { page: "course", slug: path.split("/")[2] };
  return { page: "home" };
}

async function fetchTenantMetadata(subdomain, apiBase, pathname) {
  const base = String(apiBase || "http://127.0.0.1:8000").replace(/\/$/, "");
  const { page, slug } = resolveSeoPage(pathname);
  const qs = new URLSearchParams({ page });
  if (slug) qs.set("slug", slug);
  const response = await fetch(
    `${base}/api/tenants/public/${encodeURIComponent(subdomain)}/seo/metadata?${qs}`,
    { headers: { Accept: "application/json" } },
  );
  if (!response.ok) return null;
  const payload = await response.json();
  return payload?.data ?? null;
}

function createTenantSeoMiddleware({ root, apiBase, rootDomain }) {
  const indexPath = path.join(root, "index.html");
  let cachedIndexHtml = null;

  const readIndexHtml = () => {
    if (!cachedIndexHtml) {
      cachedIndexHtml = fs.readFileSync(indexPath, "utf8");
    }
    return cachedIndexHtml;
  };

  return async (req, res, next) => {
    try {
      if (req.method !== "GET" || !isHtmlDocumentRequest(req.url)) {
        return next();
      }

      const subdomain = parseSubdomainFromHost(req.headers.host, rootDomain);
      if (!subdomain) return next();

      const pathname = (req.url || "/").split("?")[0];
      const metadata = await fetchTenantMetadata(subdomain, apiBase, pathname);
      if (!metadata) return next();

      const { injectPageMetadataHtml } = await import("./src/utils/tenantSeo.js");
      const html = injectPageMetadataHtml(readIndexHtml(), metadata);

      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(html);
    } catch {
      next();
    }
  };
}

export default function tenantSeoPlugin(options = {}) {
  const root = options.root || process.cwd();
  const apiBase =
    options.apiBase ||
    process.env.VITE_API_PROXY_TARGET ||
    process.env.VITE_API_BASE_URL ||
    "http://127.0.0.1:8000";
  const rootDomain = options.rootDomain || process.env.VITE_TENANT_ROOT_DOMAIN || "";

  const attach = (server) => {
    server.middlewares.use(
      createTenantSeoMiddleware({ root, apiBase, rootDomain }),
    );
  };

  return {
    name: "tenant-seo",
    // Dev: skip HTML injection — raw index.html breaks @vitejs/plugin-react preamble/HMR.
    // Client-side SEO via useTenantPageMetadata handles metadata in development.
    configureServer() {},
    configurePreviewServer(server) {
      attach(server);
    },
  };
}
