/**
 * ألوان كروت أكواد التفعيل في تصدير PDF — 3 ثيمات حسب تصميم لاندينج المنصة.
 * navy | ember | sky (و bento/القديم يُعامل كـ sky)
 *
 * مبدأ التصميم: هيدر/فوتر بلون ثابت أنيق + لمسة تمييز للكود والـ QR (أنظف للطباعة من التدرجات العكرة).
 */
const CARD_THEMES = {
  navy: {
    id: "navy",
    headerGradient: "linear-gradient(90deg,#020617 0%,#0F172A 40%,#1E3A8A 100%)",
    footerGradient: "#020617",
    accentBar: "linear-gradient(90deg,#2563EB,#60A5FA)",
    border: "#CBD5E1",
    cardBg: "#FFFFFF",
    qrBorder: "#3B82F6",
    qrDashed: "#60A5FA",
    logoBorder: "#E2E8F0",
    codeColor: "#2563EB",
    codeLabelColor: "#1E40AF",
    chipBg: "rgba(59,130,246,0.28)",
  },
  ember: {
    id: "ember",
    // فحمي دافئ + برتقالي حي للكود — بدون تدرج أسود↔برتقالي
    headerGradient: "linear-gradient(90deg,#1C1917 0%,#292524 55%,#44403C 100%)",
    footerGradient: "#1C1917",
    accentBar: "linear-gradient(90deg,#EA580C,#FB923C,#FDBA74)",
    border: "#E7E5E4",
    cardBg: "#FFFFFF",
    qrBorder: "#F97316",
    qrDashed: "#FB923C",
    logoBorder: "#F5F5F4",
    codeColor: "#EA580C",
    codeLabelColor: "#C2410C",
    chipBg: "rgba(249,115,22,0.92)",
  },
  sky: {
    id: "sky",
    headerGradient: "linear-gradient(90deg,#0B1B3A 0%,#122B52 50%,#1E40AF 100%)",
    footerGradient: "#0B1B3A",
    accentBar: "linear-gradient(90deg,#2563EB,#38BDF8)",
    border: "#DBEAFE",
    cardBg: "#FFFFFF",
    qrBorder: "#3B82F6",
    qrDashed: "#60A5FA",
    logoBorder: "#EFF6FF",
    codeColor: "#EA580C",
    codeLabelColor: "#C2410C",
    chipBg: "rgba(37,99,235,0.35)",
  },
};

const LAYOUT_ALIASES = {
  editorial: "ember",
  nocturne: "navy",
  horizon: "sky",
  bento: "sky",
};

function normalizeLayoutId(value) {
  const id = String(value || "")
    .trim()
    .toLowerCase();
  if (!id) return "sky";
  if (LAYOUT_ALIASES[id]) return LAYOUT_ALIASES[id];
  if (id === "navy" || id === "ember" || id === "sky") return id;
  return "sky";
}

/** يستخرج layout من رد tenant public أو قيمة مباشرة */
export function resolveActivationCardTheme(layoutOrPayload) {
  let raw = layoutOrPayload;
  if (raw && typeof raw === "object") {
    raw =
      raw?.data?.landing?.layout ||
      raw?.landing?.layout ||
      raw?.data?.tenant?.landing?.layout ||
      raw?.tenant?.landing?.layout ||
      raw?.layout ||
      null;
  }
  const layout = normalizeLayoutId(raw);
  return CARD_THEMES[layout] || CARD_THEMES.sky;
}

export function listActivationCardThemes() {
  return CARD_THEMES;
}
