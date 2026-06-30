import { buildTenantPublicUrl } from "./tenantHost";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function robotsContent(robots) {
  if (!robots) return "index, follow";
  const index = robots.index !== false ? "index" : "noindex";
  const follow = robots.follow !== false ? "follow" : "nofollow";
  return `${index}, ${follow}`;
}

function upsertMeta(selector, attributes) {
  let node = document.querySelector(selector);
  if (!node) {
    node = document.createElement("meta");
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === "content") node.setAttribute("content", value);
      else node.setAttribute(key, value);
    });
    document.head.appendChild(node);
    return;
  }
  if (attributes.content != null) node.setAttribute("content", attributes.content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let link = document.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
}

function removeJsonLdScripts() {
  document.querySelectorAll('script[data-tenant-seo-jsonld="true"]').forEach((el) => el.remove());
}

function upsertJsonLdArray(items) {
  removeJsonLdScripts();
  if (!Array.isArray(items)) return;
  items.forEach((data, index) => {
    if (!data) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-tenant-seo-jsonld", "true");
    script.id = `tenant-seo-jsonld-${index}`;
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  });
}

/**
 * Apply dynamic page metadata from Backend API (equivalent to Next.js generateMetadata).
 * @param {import('../api/tenantPublicApi').fetchTenantPageMetadata extends Function ? object : never} metadata
 */
export function applyPageMetadata(metadata) {
  if (!metadata) return;

  const title = metadata.title || metadata.seoTitle;
  const description = metadata.description || metadata.seoDescription || "";
  const keywords = Array.isArray(metadata.keywords)
    ? metadata.keywords.join(", ")
    : metadata.seoKeywords?.join?.(", ") || metadata.keywords || "";
  const canonical = metadata.canonicalUrl || metadata.canonical_url;
  const og = metadata.openGraph || {};
  const twitter = metadata.twitter || {};
  const image = og.image || twitter.image || metadata.ogImage;
  const favicon = metadata.favicon;

  if (title) document.title = title;
  document.documentElement.lang = "ar";

  upsertMeta('meta[name="description"]', { name: "description", content: description.slice(0, 320) });
  if (keywords) upsertMeta('meta[name="keywords"]', { name: "keywords", content: keywords });
  upsertMeta('meta[name="robots"]', {
    name: "robots",
    content: robotsContent(metadata.robots),
  });
  if (canonical) upsertLink("canonical", canonical);
  if (favicon) upsertLink("icon", favicon);

  const ogTags = {
    "og:type": og.type || "website",
    "og:title": og.title || title,
    "og:description": (og.description || description).slice(0, 320),
    "og:url": og.url || canonical,
    "og:site_name": og.siteName || title,
    "og:locale": og.locale || "ar_EG",
  };
  if (image) ogTags["og:image"] = image;
  Object.entries(ogTags).forEach(([property, content]) => {
    if (content) upsertMeta(`meta[property="${property}"]`, { property, content });
  });

  upsertMeta('meta[name="twitter:card"]', {
    name: "twitter:card",
    content: twitter.card || (image ? "summary_large_image" : "summary"),
  });
  upsertMeta('meta[name="twitter:title"]', {
    name: "twitter:title",
    content: twitter.title || og.title || title,
  });
  upsertMeta('meta[name="twitter:description"]', {
    name: "twitter:description",
    content: (twitter.description || og.description || description).slice(0, 200),
  });
  if (twitter.image || image) {
    upsertMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: twitter.image || image,
    });
  }

  const jsonLd = metadata.jsonLd || metadata.json_ld;
  if (jsonLd) upsertJsonLdArray(jsonLd);
}

/** Fallback SEO when API metadata is unavailable. */
export function buildTenantSeoMeta({ tenant, teacher, subdomain }, options = {}) {
  if (!tenant || !subdomain) return null;

  const brandName = tenant.display_name || tenant.subdomain || subdomain;
  const teacherName = teacher?.name || brandName;
  const specialty = tenant.specialty || teacher?.subject || "";
  const title = tenant.seo_title || brandName;
  const description = (
    tenant.seo_meta_description ||
    tenant.bio ||
    teacher?.description ||
    (specialty ? `منصة ${teacherName} — ${specialty}` : `منصة تعليمية مع ${teacherName}`)
  ).slice(0, 320);
  const canonical = buildTenantPublicUrl(subdomain, options);
  const image = tenant.og_image_url || tenant.avatar_url || teacher?.avatar || "";
  const keywords = [brandName, teacherName, specialty, tenant.subdomain, "مدرس", "منصة تعليمية", "دروس أونلاين"]
    .filter(Boolean);

  return {
    title,
    description,
    canonicalUrl: canonical,
    keywords,
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      image: image || null,
      siteName: brandName,
      locale: "ar_EG",
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      image: image || null,
    },
    favicon: tenant.favicon_url || null,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Person",
        name: teacherName,
        description,
        url: canonical,
        ...(image ? { image } : {}),
        ...(specialty ? { jobTitle: `مدرس ${specialty}` } : {}),
        worksFor: {
          "@type": "EducationalOrganization",
          name: brandName,
          url: canonical,
        },
      },
    ],
  };
}

/** @deprecated Use applyPageMetadata — kept for backward compatibility */
export function applyTenantSeo({ tenant, teacher, subdomain }) {
  applyPageMetadata(buildTenantSeoMeta({ tenant, teacher, subdomain }));
}

/** Inject metadata into raw index.html for crawlers (Vite dev/preview middleware). */
export function injectPageMetadataHtml(html, metadata) {
  if (!metadata) return html;
  const title = metadata.title || "";
  const description = (metadata.description || "").slice(0, 320);
  const keywords = Array.isArray(metadata.keywords)
    ? metadata.keywords.join(", ")
    : metadata.keywords || "";
  const canonical = metadata.canonicalUrl || "";
  const og = metadata.openGraph || {};
  const twitter = metadata.twitter || {};
  const image = og.image || twitter.image;
  const favicon = metadata.favicon;

  const headTags = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}" />` : ""}
    <meta name="robots" content="${escapeHtml(robotsContent(metadata.robots))}" />
    ${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}" />` : ""}
    ${favicon ? `<link rel="icon" href="${escapeHtml(favicon)}" />` : ""}
    <meta property="og:type" content="${escapeHtml(og.type || "website")}" />
    <meta property="og:title" content="${escapeHtml(og.title || title)}" />
    <meta property="og:description" content="${escapeHtml(og.description || description)}" />
    ${og.url || canonical ? `<meta property="og:url" content="${escapeHtml(og.url || canonical)}" />` : ""}
    ${og.siteName ? `<meta property="og:site_name" content="${escapeHtml(og.siteName)}" />` : ""}
    <meta property="og:locale" content="${escapeHtml(og.locale || "ar_EG")}" />
    ${image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : ""}
    <meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />
    <meta name="twitter:title" content="${escapeHtml(twitter.title || title)}" />
    <meta name="twitter:description" content="${escapeHtml(twitter.description || description)}" />
    ${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ""}
    ${(metadata.jsonLd || [])
      .map((ld) => `<script type="application/ld+json">${JSON.stringify(ld)}</script>`)
      .join("\n")}
  `;

  let out = html.replace(/<title>[\s\S]*?<\/title>/i, "");
  out = out.replace(/<meta\s+name="description"[^>]*>/i, "");
  out = out.replace(/<meta\s+name="keywords"[^>]*>/i, "");
  out = out.replace(/<meta\s+name="robots"[^>]*>/i, "");
  out = out.replace(/<link\s+rel="canonical"[^>]*>/i, "");
  out = out.replace(/<meta\s+property="og:[^"]+"[^>]*>/gi, "");
  out = out.replace(/<meta\s+name="twitter:[^"]+"[^>]*>/gi, "");
  return out.replace("</head>", `${headTags}\n  </head>`);
}

/** @deprecated */
export function injectTenantSeoHtml(html, { tenant, teacher, subdomain }, options = {}) {
  return injectPageMetadataHtml(html, buildTenantSeoMeta({ tenant, teacher, subdomain }, options));
}
