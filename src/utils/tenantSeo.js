import { buildTenantPublicUrl } from "./tenantHost";

const SEO_ATTR = "data-tenant-dynamic-seo";

/** Detect company-wide branding so tenant pages don't keep EM Lectures title/icon */
export function isCompanyBrandingTitle(title) {
  const t = String(title || "").toLowerCase();
  if (!t.trim()) return true;
  return (
    t.includes("em lectures") ||
    t.includes("إي إم للمحاضرين") ||
    t.includes("اي ام للمحاضرين") ||
    t.includes("next edu") ||
    t.includes("em-lectures") ||
    t.includes("emlectures")
  );
}

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

function absoluteUrl(url, canonicalBase) {
  if (!url) return "";
  const raw = String(url).trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  try {
    const base = canonicalBase || (typeof window !== "undefined" ? window.location.origin : "");
    if (!base) return raw;
    return new URL(raw.startsWith("/") ? raw : `/${raw}`, base).href;
  } catch {
    return raw;
  }
}

function upsertMeta(selector, attributes) {
  let node = document.querySelector(selector);
  if (!node) {
    node = document.createElement("meta");
    Object.entries(attributes).forEach(([key, value]) => {
      if (value == null) return;
      node.setAttribute(key, value);
    });
    node.setAttribute(SEO_ATTR, "true");
    document.head.appendChild(node);
    return;
  }
  Object.entries(attributes).forEach(([key, value]) => {
    if (value == null) return;
    node.setAttribute(key, value);
  });
  node.setAttribute(SEO_ATTR, "true");
}

function upsertLink(rel, href, extra = {}) {
  if (!href) return;
  const typeSel = extra.type ? `[type="${extra.type}"]` : "";
  let link = document.querySelector(`link[rel="${rel}"]${typeSel}`);
  if (!link && rel === "icon") {
    link = document.querySelector('link[rel="icon"]');
  }
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    Object.entries(extra).forEach(([k, v]) => {
      if (v != null) link.setAttribute(k, v);
    });
    link.setAttribute(SEO_ATTR, "true");
    document.head.appendChild(link);
  }
  link.href = href;
  Object.entries(extra).forEach(([k, v]) => {
    if (v != null) link.setAttribute(k, v);
  });
  link.setAttribute(SEO_ATTR, "true");
}

function removeJsonLdScripts() {
  document
    .querySelectorAll(`script[data-tenant-seo-jsonld="true"]`)
    .forEach((el) => el.remove());
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
 * Apply dynamic page metadata to <head> (title, description, icons, OG, Twitter, JSON-LD).
 * Replaces company defaults when visiting a teacher tenant subdomain.
 */
export function applyPageMetadata(metadata) {
  if (!metadata || typeof document === "undefined") return;

  const title = metadata.title || metadata.seoTitle;
  const description = String(
    metadata.description || metadata.seoDescription || "",
  ).slice(0, 320);
  const keywords = Array.isArray(metadata.keywords)
    ? metadata.keywords.filter(Boolean).join(", ")
    : metadata.seoKeywords?.join?.(", ") || metadata.keywords || "";
  const canonical = metadata.canonicalUrl || metadata.canonical_url;
  const og = metadata.openGraph || {};
  const twitter = metadata.twitter || {};
  const image = absoluteUrl(
    og.image || twitter.image || metadata.ogImage,
    canonical,
  );
  const favicon = absoluteUrl(
    metadata.favicon || metadata.favicon_url || metadata.icon,
    canonical,
  );
  const appleIcon = absoluteUrl(
    metadata.appleTouchIcon || metadata.apple_touch_icon || favicon,
    canonical,
  );
  const themeColor = metadata.themeColor || metadata.theme_color || "#3182CE";
  const siteName = og.siteName || metadata.siteName || title;
  const author = metadata.author || siteName;

  if (title) document.title = title;
  document.documentElement.lang = "ar";

  upsertMeta('meta[name="description"]', {
    name: "description",
    content: description,
  });
  if (keywords) {
    upsertMeta('meta[name="keywords"]', { name: "keywords", content: keywords });
  }
  upsertMeta('meta[name="author"]', { name: "author", content: author });
  upsertMeta('meta[name="application-name"]', {
    name: "application-name",
    content: siteName,
  });
  upsertMeta('meta[name="apple-mobile-web-app-title"]', {
    name: "apple-mobile-web-app-title",
    content: String(siteName).slice(0, 40),
  });
  upsertMeta('meta[name="theme-color"]', {
    name: "theme-color",
    content: themeColor,
  });
  upsertMeta('meta[name="robots"]', {
    name: "robots",
    content: robotsContent(metadata.robots),
  });

  if (canonical) upsertLink("canonical", canonical);
  if (favicon) {
    upsertLink("icon", favicon, { type: "image/png" });
    upsertLink("shortcut icon", favicon);
  }
  if (appleIcon) upsertLink("apple-touch-icon", appleIcon);

  const ogTags = {
    "og:type": og.type || "website",
    "og:title": og.title || title,
    "og:description": String(og.description || description).slice(0, 320),
    "og:url": og.url || canonical,
    "og:site_name": siteName,
    "og:locale": og.locale || "ar_EG",
  };
  if (image) {
    ogTags["og:image"] = image;
    ogTags["og:image:alt"] = og.imageAlt || title;
  }
  Object.entries(ogTags).forEach(([property, content]) => {
    if (content) {
      upsertMeta(`meta[property="${property}"]`, { property, content });
    }
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
    content: String(twitter.description || og.description || description).slice(
      0,
      200,
    ),
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

/**
 * Build search-friendly SEO when API metadata is unavailable.
 * Helps discovery: "مستر أحمد | رياضيات"
 */
export function buildTenantSeoMeta({ tenant, teacher, subdomain, theme }, options = {}) {
  if (!tenant || !subdomain) return null;

  const teacherNameRaw =
    teacher?.name ||
    teacher?.full_name ||
    tenant.teacher_name ||
    tenant.display_name ||
    subdomain;
  const brandRaw = tenant.display_name || tenant.subdomain || subdomain;
  const brandName = isCompanyBrandingTitle(brandRaw)
    ? teacherNameRaw
    : brandRaw;
  const teacherName = isCompanyBrandingTitle(teacherNameRaw)
    ? brandName
    : teacherNameRaw;
  const specialty =
    tenant.specialty ||
    teacher?.subject ||
    teacher?.specialty ||
    landingSpecialty(tenant) ||
    "";
  const gradeHint = tenant.grade_name || teacher?.grade || "";

  const defaultTitle = [
    teacherName.startsWith("مستر") ||
    teacherName.startsWith("أ.") ||
    teacherName.startsWith("ا.")
      ? teacherName
      : `مستر ${teacherName}`,
    specialty,
  ]
    .filter(Boolean)
    .join(" | ");

  // تجاهل seo_title العام للشركة لو متسجل بالغلط على المنصة
  const rawSeoTitle = String(tenant.seo_title || "").trim();
  const title = (
    rawSeoTitle && !isCompanyBrandingTitle(rawSeoTitle)
      ? rawSeoTitle
      : defaultTitle
  ).slice(0, 70);

  const rawSeoDesc = String(tenant.seo_meta_description || "").trim();
  const description = (
    (rawSeoDesc && !isCompanyBrandingTitle(rawSeoDesc) ? rawSeoDesc : null) ||
    tenant.bio ||
    teacher?.description ||
    teacher?.bio ||
    [
      `منصة ${teacherName} التعليمية`,
      specialty ? `لمادة ${specialty}` : null,
      gradeHint ? `(${gradeHint})` : null,
      "— كورسات ومحاضرات وامتحانات أونلاين. سجّل الآن وتابع دروسك بسهولة.",
    ]
      .filter(Boolean)
      .join(" ")
  ).slice(0, 320);


  const canonical = buildTenantPublicUrl(subdomain, options);
  const image =
    tenant.og_image_url ||
    tenant.avatar_url ||
    teacher?.avatar ||
    teacher?.image ||
    "";
  const favicon =
    tenant.favicon_url || tenant.avatar_url || teacher?.avatar || null;
  const themeColor =
    theme?.primary_color ||
    tenant.primary_color ||
    tenant.theme_color ||
    "#3182CE";

  const keywords = [
    teacherName,
    brandName,
    specialty,
    gradeHint,
    tenant.subdomain,
    subdomain,
    `مدرس ${specialty}`,
    `مستر ${specialty}`,
    "دروس أونلاين",
    "منصة تعليمية",
    "كورسات",
    "محاضرات",
    "ثانوية عامة",
  ].filter(Boolean);

  return {
    title,
    description,
    canonicalUrl: canonical,
    keywords,
    author: teacherName,
    siteName: brandName,
    themeColor,
    favicon,
    appleTouchIcon: favicon,
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      image: image || null,
      imageAlt: title,
      siteName: brandName,
      locale: "ar_EG",
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      image: image || null,
    },
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        name: brandName,
        url: canonical,
        description,
        ...(image ? { logo: absoluteUrl(image, canonical), image: absoluteUrl(image, canonical) } : {}),
        ...(teacherName
          ? {
              employee: {
                "@type": "Person",
                name: teacherName,
                jobTitle: specialty ? `مدرس ${specialty}` : "مدرس",
                ...(image ? { image: absoluteUrl(image, canonical) } : {}),
              },
            }
          : {}),
      },
      {
        "@context": "https://schema.org",
        "@type": "Person",
        name: teacherName,
        description,
        url: canonical,
        ...(image ? { image: absoluteUrl(image, canonical) } : {}),
        ...(specialty ? { jobTitle: `مدرس ${specialty}` } : {}),
        worksFor: {
          "@type": "EducationalOrganization",
          name: brandName,
          url: canonical,
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: brandName,
        url: canonical,
        description,
        inLanguage: "ar",
        publisher: {
          "@type": "EducationalOrganization",
          name: brandName,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${canonical.replace(/\/$/, "")}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

function landingSpecialty(tenant) {
  return tenant?.landing?.hero?.subtitle || tenant?.landing?.specialty || "";
}

/** @deprecated Use applyPageMetadata */
export function applyTenantSeo({ tenant, teacher, subdomain, theme }) {
  applyPageMetadata(buildTenantSeoMeta({ tenant, teacher, subdomain, theme }));
}

/** Inject metadata into raw index.html for crawlers (preview / edge middleware). */
export function injectPageMetadataHtml(html, metadata) {
  if (!metadata) return html;
  const title = metadata.title || "";
  const description = String(metadata.description || "").slice(0, 320);
  const keywords = Array.isArray(metadata.keywords)
    ? metadata.keywords.filter(Boolean).join(", ")
    : metadata.keywords || "";
  const canonical = metadata.canonicalUrl || "";
  const og = metadata.openGraph || {};
  const twitter = metadata.twitter || {};
  const image = og.image || twitter.image || "";
  const favicon = metadata.favicon || "";
  const appleIcon = metadata.appleTouchIcon || favicon;
  const themeColor = metadata.themeColor || "#3182CE";
  const siteName = og.siteName || metadata.siteName || title;
  const author = metadata.author || siteName;

  const headTags = `
    <!-- Tenant dynamic SEO -->
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}" />` : ""}
    <meta name="author" content="${escapeHtml(author)}" />
    <meta name="application-name" content="${escapeHtml(siteName)}" />
    <meta name="apple-mobile-web-app-title" content="${escapeHtml(String(siteName).slice(0, 40))}" />
    <meta name="theme-color" content="${escapeHtml(themeColor)}" />
    <meta name="robots" content="${escapeHtml(robotsContent(metadata.robots))}" />
    ${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}" />` : ""}
    ${favicon ? `<link rel="icon" type="image/png" href="${escapeHtml(favicon)}" />` : ""}
    ${appleIcon ? `<link rel="apple-touch-icon" href="${escapeHtml(appleIcon)}" />` : ""}
    <meta property="og:type" content="${escapeHtml(og.type || "website")}" />
    <meta property="og:title" content="${escapeHtml(og.title || title)}" />
    <meta property="og:description" content="${escapeHtml(og.description || description)}" />
    ${og.url || canonical ? `<meta property="og:url" content="${escapeHtml(og.url || canonical)}" />` : ""}
    <meta property="og:site_name" content="${escapeHtml(siteName)}" />
    <meta property="og:locale" content="${escapeHtml(og.locale || "ar_EG")}" />
    ${image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : ""}
    ${image ? `<meta property="og:image:alt" content="${escapeHtml(og.imageAlt || title)}" />` : ""}
    <meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />
    <meta name="twitter:title" content="${escapeHtml(twitter.title || title)}" />
    <meta name="twitter:description" content="${escapeHtml(twitter.description || description)}" />
    ${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ""}
    ${(metadata.jsonLd || [])
      .map(
        (ld) =>
          `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`,
      )
      .join("\n")}
  `;

  let out = html;
  // Strip company defaults so tenant tags win for crawlers
  out = out.replace(/<title>[\s\S]*?<\/title>/i, "");
  out = out.replace(/<meta\s+name="description"[^>]*>/gi, "");
  out = out.replace(/<meta\s+name="keywords"[^>]*>/gi, "");
  out = out.replace(/<meta\s+name="author"[^>]*>/gi, "");
  out = out.replace(/<meta\s+name="robots"[^>]*>/gi, "");
  out = out.replace(/<meta\s+name="theme-color"[^>]*>/gi, "");
  out = out.replace(/<meta\s+name="application-name"[^>]*>/gi, "");
  out = out.replace(/<meta\s+name="apple-mobile-web-app-title"[^>]*>/gi, "");
  out = out.replace(/<link\s+rel="canonical"[^>]*>/gi, "");
  out = out.replace(/<link\s+rel="icon"[^>]*>/gi, "");
  out = out.replace(/<link\s+rel="apple-touch-icon"[^>]*>/gi, "");
  out = out.replace(/<meta\s+property="og:[^"]+"[^>]*>/gi, "");
  out = out.replace(/<meta\s+name="twitter:[^"]+"[^>]*>/gi, "");
  return out.replace(/<\/head>/i, `${headTags}\n  </head>`);
}

/** @deprecated */
export function injectTenantSeoHtml(html, ctx, options = {}) {
  return injectPageMetadataHtml(html, buildTenantSeoMeta(ctx, options));
}
