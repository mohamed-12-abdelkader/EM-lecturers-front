/** تصاميم لاندينج منصة المدرس. الافتراضي bento يحافظ على شكل المنصات الحالية. */
export const TENANT_LANDING_DESIGNS = [
  {
    id: "bento",
    name: "بينتو أكاديمي",
    tagline: "بطاقات حديثة وتدرج أزرق، الشكل الحالي للمنصة",
    swatches: ["#0A1628", "#00A0E3", "#D4E157"],
    pageBg: "#F4F7FB",
    fg: "#0F172A",
    muted: "#64748B",
    accent: "#00A0E3",
    accentFg: "#FFFFFF",
    nav: "rgba(10,22,40,0.4)",
    navSolid: "rgba(10,22,40,0.92)",
    accent2: "#D4E157",
    headingFont: "'Cairo', 'Segoe UI', Tahoma, sans-serif",
    bodyFont: "'Cairo', 'Segoe UI', Tahoma, sans-serif",
    fontHref: null,
    radius: "1rem",
  },
  {
    id: "editorial",
    name: "تحرير كلاسيكي",
    tagline: "مجلة ورقية، عناوين عريضة وصورة مؤطرة",
    swatches: ["#F3EDE3", "#1C1917", "#9A3412"],
    pageBg: "#F3EDE3",
    fg: "#1C1917",
    muted: "#57534E",
    accent: "#9A3412",
    accentFg: "#FFF7ED",
    nav: "rgba(28,25,23,0.72)",
    navSolid: "rgba(28,25,23,0.94)",
    accent2: "#E7D3C1",
    headingFont: "'Amiri', 'Cairo', serif",
    bodyFont: "'Cairo', 'Segoe UI', Tahoma, sans-serif",
    fontHref:
      "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700;800&display=swap",
    radius: "2px",
  },
  {
    id: "nocturne",
    name: "ليلي فاخر",
    tagline: "أسود وذهبي، صورة دائرية ومساحات هادئة",
    swatches: ["#07070B", "#C6A15B", "#F5F0E6"],
    pageBg: "#07070B",
    fg: "#F5F0E6",
    muted: "#B7AB96",
    accent: "#C6A15B",
    accentFg: "#1A1408",
    nav: "rgba(7,7,11,0.55)",
    navSolid: "rgba(7,7,11,0.92)",
    accent2: "#F5F0E6",
    headingFont: "'Cairo', 'Segoe UI', Tahoma, sans-serif",
    bodyFont: "'Cairo', 'Segoe UI', Tahoma, sans-serif",
    fontHref: null,
    radius: "999px",
    signupFg: "#1A1408",
  },
  {
    id: "horizon",
    name: "أفق الحرم",
    tagline: "لوحة خضراء عريضة وشبكة واضحة وحديثة",
    swatches: ["#0F3D32", "#F4F7F2", "#D6F25C"],
    pageBg: "#F4F7F2",
    fg: "#10241C",
    muted: "#3F5C50",
    accent: "#0F3D32",
    accentFg: "#F4F7F2",
    nav: "rgba(15,61,50,0.55)",
    navSolid: "rgba(15,61,50,0.94)",
    accent2: "#D6F25C",
    headingFont: "'Cairo', 'Segoe UI', Tahoma, sans-serif",
    bodyFont: "'Cairo', 'Segoe UI', Tahoma, sans-serif",
    fontHref: null,
    radius: "1.25rem",
    signupFg: "#10241C",
  },
];

export function resolveLandingLayout(value) {
  const id = String(value || "").trim().toLowerCase();
  return TENANT_LANDING_DESIGNS.some((design) => design.id === id) ? id : "bento";
}

export function getLandingDesign(value) {
  const id = resolveLandingLayout(value);
  return TENANT_LANDING_DESIGNS.find((design) => design.id === id) || TENANT_LANDING_DESIGNS[0];
}

export function landingNavChrome(design) {
  if (!design || design.id === "bento") return null;
  return {
    nav: design.nav,
    navSolid: design.navSolid,
    accent: design.accent,
    accent2: design.accent2,
    signupFg: design.signupFg || "#FFFFFF",
  };
}
