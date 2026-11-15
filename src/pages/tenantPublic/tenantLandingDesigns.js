/**
 * 3 تصاميم لاندينج لمنصة المدرس (نفس الأقسام، ألوان مختلفة).
 * bento يبقى للتوافق مع المنصات القديمة فقط ولا يظهر في قائمة الاختيار.
 */

const SHARED_FONTS =
  "'Tajawal', 'Cairo', 'Segoe UI', Tahoma, sans-serif";

export const TENANT_LANDING_DESIGNS = [
  {
    id: "navy",
    name: "ليلي أزرق",
    tagline: "خلفية داكنة وتدرجات زرقاء — مناسبة للمنصات الاحترافية",
    swatches: ["#070D1A", "#3B82F6", "#38BDF8"],
    pageBg: "#070D1A",
    surface: "#0E1628",
    card: "#121C30",
    fg: "#F8FAFC",
    muted: "#94A3B8",
    accent: "#3B82F6",
    accentSoft: "#38BDF8",
    accentFg: "#FFFFFF",
    accent2: "#60A5FA",
    nav: "rgba(7,13,26,0.78)",
    navSolid: "rgba(7,13,26,0.96)",
    headingFont: SHARED_FONTS,
    bodyFont: SHARED_FONTS,
    fontHref:
      "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Cairo:wght@400;600;700;800&display=swap",
    radius: "1.25rem",
    heroTone: "dark",
    ctaBand: "#050914",
    signupFg: "#FFFFFF",
  },
  {
    id: "ember",
    name: "فاتح برتقالي",
    tagline: "أبيض ورمادي مع لمسة برتقالية دافئة",
    swatches: ["#F7F4EF", "#111827", "#EA580C"],
    pageBg: "#F7F4EF",
    surface: "#FFFFFF",
    card: "#FFFFFF",
    fg: "#111827",
    muted: "#6B7280",
    accent: "#EA580C",
    accentSoft: "#FDBA74",
    accentFg: "#FFFFFF",
    accent2: "#111827",
    nav: "rgba(247,244,239,0.88)",
    navSolid: "rgba(255,255,255,0.97)",
    headingFont: SHARED_FONTS,
    bodyFont: SHARED_FONTS,
    fontHref:
      "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Cairo:wght@400;600;700;800&display=swap",
    radius: "1rem",
    heroTone: "light",
    ctaBand: "#111827",
    signupFg: "#FFFFFF",
  },
  {
    id: "sky",
    name: "سماوي ناعم",
    tagline: "أبيض وكحلي مع لمسات زرقاء ناعمة",
    swatches: ["#F5F8FC", "#0B1B3A", "#2563EB"],
    pageBg: "#F5F8FC",
    surface: "#FFFFFF",
    card: "#FFFFFF",
    fg: "#0B1B3A",
    muted: "#64748B",
    accent: "#2563EB",
    accentSoft: "#93C5FD",
    accentFg: "#FFFFFF",
    accent2: "#0B1B3A",
    nav: "rgba(245,248,252,0.9)",
    navSolid: "rgba(255,255,255,0.98)",
    headingFont: SHARED_FONTS,
    bodyFont: SHARED_FONTS,
    fontHref:
      "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Cairo:wght@400;600;700;800&display=swap",
    radius: "1.25rem",
    heroTone: "light",
    ctaBand: "#0B1B3A",
    signupFg: "#FFFFFF",
  },
];

/** توافق خلفي مع التصاميم القديمة */
const LEGACY_LAYOUT_ALIASES = {
  editorial: "ember",
  nocturne: "navy",
  horizon: "sky",
};

const BENTO_FALLBACK = {
  id: "bento",
  name: "بينتو أكاديمي",
  tagline: "الشكل السابق للمنصة",
  swatches: ["#0A1628", "#00A0E3", "#D4E157"],
  pageBg: "#F4F7FB",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  fg: "#0F172A",
  muted: "#64748B",
  accent: "#00A0E3",
  accentSoft: "#38BDF8",
  accentFg: "#FFFFFF",
  accent2: "#D4E157",
  nav: "rgba(10,22,40,0.4)",
  navSolid: "rgba(10,22,40,0.92)",
  headingFont: SHARED_FONTS,
  bodyFont: SHARED_FONTS,
  fontHref: null,
  radius: "1rem",
  heroTone: "light",
  ctaBand: "#0A1628",
  signupFg: "#FFFFFF",
};

export function resolveLandingLayout(value) {
  const id = String(value || "").trim().toLowerCase();
  if (id === "bento") return "bento";
  if (LEGACY_LAYOUT_ALIASES[id]) return LEGACY_LAYOUT_ALIASES[id];
  if (TENANT_LANDING_DESIGNS.some((design) => design.id === id)) return id;
  return "sky";
}

export function getLandingDesign(value) {
  const id = resolveLandingLayout(value);
  if (id === "bento") return BENTO_FALLBACK;
  return TENANT_LANDING_DESIGNS.find((design) => design.id === id) || TENANT_LANDING_DESIGNS[2];
}

export function landingNavChrome(design) {
  if (!design || design.id === "bento") return null;
  const isLight = design.heroTone !== "dark";
  return {
    nav: design.nav,
    navSolid: design.navSolid,
    accent: design.accent,
    accent2: design.accent2,
    signupFg: design.signupFg || "#FFFFFF",
    tone: isLight ? "light" : "dark",
    // نص واضح على خلفية النافبار (فاتح → أسود، داكن → أبيض)
    fg: isLight ? design.fg || "#0F172A" : "#FFFFFF",
    muted: isLight ? design.muted || "#64748B" : "rgba(255,255,255,0.78)",
    border: isLight ? "rgba(15,23,42,0.10)" : "rgba(255,255,255,0.15)",
    hoverBg: isLight ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.10)",
  };
}

export const DEFAULT_LANDING_LAYOUT = "sky";
