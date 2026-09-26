/**
 * Tenant landing — light + dark via CSS vars on `.tenant-public-page`
 * (independent of Chakra / html `.dark` so both modes work reliably)
 */
export const TL_NAVY = "#0A1628";
export const TL_NAVY_SOFT = "#0F1F38";
export const TL_NAVY_CARD = "#12263F";
export const TL_CYAN = "#00A0E3";
export const TL_LIME = "#D4E157";
export const TL_TAGLINE = "#7EB8D9";

export const TL_LIGHT_BG = "#F4F7FB";
export const TL_LIGHT_BG_SOFT = "#E8EEF6";
export const TL_LIGHT_CARD = "#FFFFFF";
export const TL_LIGHT_FG = "#0F172A";
export const TL_LIGHT_MUTED = "#64748B";

/** @deprecated aliases */
export const TL_BLUE = TL_CYAN;
export const TL_ORANGE = TL_LIME;
export const TL_PRIMARY = TL_CYAN;
export const TL_SECONDARY = TL_CYAN;
export const TL_ACCENT = TL_LIME;
export const TL_BG = TL_NAVY;
export const TL_FG = "#F8FAFC";
export const TL_MUTED = TL_NAVY_SOFT;
export const TL_BORDER = "rgba(255,255,255,0.12)";

/** CSS custom properties applied on the page root */
export function getTenantThemeCssVars(isDark) {
  if (isDark) {
    return {
      "--tl-page-bg": TL_NAVY,
      "--tl-section": TL_NAVY,
      "--tl-section-alt": TL_NAVY_SOFT,
      "--tl-card": "rgba(255,255,255,0.06)",
      "--tl-card-solid": TL_NAVY_CARD,
      "--tl-border": "rgba(255,255,255,0.12)",
      "--tl-fg": "#F8FAFC",
      "--tl-muted": TL_TAGLINE,
      "--tl-soft": "rgba(255,255,255,0.05)",
      "--tl-hero-fade": TL_NAVY,
      "--tl-chip-border": "rgba(255,255,255,0.2)",
      "--tl-chip-bg": "rgba(255,255,255,0.05)",
      "--tl-btn-outline-bg": "rgba(255,255,255,0.05)",
      "--tl-btn-outline-border": "rgba(255,255,255,0.3)",
      "--tl-btn-outline-fg": "#FFFFFF",
      "--tl-shadow": "0 12px 40px -16px rgba(0,0,0,0.45)",
      "--tl-overlay": "rgba(10,22,40,0.45)",
      /* hero — blue.500 family only */
      "--tl-hero-bg":
        "linear-gradient(145deg, #0B1524 0%, #0E1C30 40%, #122840 72%, #0B1524 100%)",
      "--tl-hero-fg": "#F7FAFC",
      "--tl-hero-muted": "#A0C4DE",
      "--tl-hero-chip-bg": "rgba(49,130,206,0.2)",
      "--tl-hero-chip-border": "rgba(99,179,237,0.4)",
      "--tl-hero-chip-fg": "#EBF8FF",
      "--tl-hero-stat-bg": "rgba(49,130,206,0.12)",
      "--tl-hero-stat-border": "rgba(99,179,237,0.28)",
      "--tl-hero-btn-outline-bg": "rgba(49,130,206,0.12)",
      "--tl-hero-btn-outline-border": "rgba(144,205,244,0.4)",
      "--tl-hero-btn-outline-fg": "#EBF8FF",
      "--tl-hero-frame-border": "rgba(99,179,237,0.35)",
      "--tl-hero-frame-shadow": "0 28px 56px -18px rgba(49,130,206,0.45)",
      "--tl-hero-icon-opacity": "0.15",
      "--tl-hero-watermark-opacity": "0.08",
      "--tl-hero-support-from": "#EBF8FF",
      "--tl-hero-accent": "#63B3ED",
      "--tl-hero-wa-bg": "rgba(37,211,102,0.14)",
      "--tl-hero-wa-border": "rgba(37,211,102,0.4)",
      "--tl-hero-wa-fg": "#9AE6B4",
      "--tl-hero-photo-fade": "linear-gradient(to top, rgba(11,21,36,0.4) 0%, transparent 42%)",
      "--tl-hero-orb-a": "rgba(49,130,206,0.08)",
      "--tl-hero-orb-b": "rgba(43,108,176,0.05)",
      "--tl-hero-orb-c": "rgba(99,179,237,0.04)",
      "--tl-hero-mesh":
        "radial-gradient(ellipse 55% 50% at 82% 30%, rgba(49,130,206,0.07) 0%, transparent 60%), radial-gradient(ellipse 45% 40% at 12% 75%, rgba(43,108,176,0.04) 0%, transparent 55%), radial-gradient(ellipse 35% 30% at 50% 10%, rgba(99,179,237,0.03) 0%, transparent 50%)",
    };
  }
  return {
    "--tl-page-bg": TL_LIGHT_BG,
    "--tl-section": TL_LIGHT_CARD,
    "--tl-section-alt": TL_LIGHT_BG_SOFT,
    "--tl-card": "#FFFFFF",
    "--tl-card-solid": "#FFFFFF",
    "--tl-border": "rgba(15,23,42,0.09)",
    "--tl-fg": TL_LIGHT_FG,
    "--tl-muted": TL_LIGHT_MUTED,
    "--tl-soft": "rgba(15,23,42,0.04)",
    "--tl-hero-fade": TL_LIGHT_BG,
    "--tl-chip-border": "rgba(15,23,42,0.12)",
    "--tl-chip-bg": "rgba(15,23,42,0.04)",
    "--tl-btn-outline-bg": "#FFFFFF",
    "--tl-btn-outline-border": "rgba(15,23,42,0.16)",
    "--tl-btn-outline-fg": TL_LIGHT_FG,
    "--tl-shadow": "0 12px 36px -18px rgba(15,23,42,0.18)",
    "--tl-overlay": "rgba(15,23,42,0.35)",
    /* hero — soft blue daylight */
    "--tl-hero-bg":
      "linear-gradient(145deg, #FAFCFE 0%, #F6F9FC 45%, #F4F8FB 100%)",
    "--tl-hero-fg": "#1A365D",
    "--tl-hero-muted": "#4A5568",
    "--tl-hero-chip-bg": "rgba(49,130,206,0.1)",
    "--tl-hero-chip-border": "rgba(49,130,206,0.28)",
    "--tl-hero-chip-fg": "#2B6CB0",
    "--tl-hero-stat-bg": "#FFFFFF",
    "--tl-hero-stat-border": "rgba(49,130,206,0.18)",
    "--tl-hero-btn-outline-bg": "#FFFFFF",
    "--tl-hero-btn-outline-border": "rgba(49,130,206,0.3)",
    "--tl-hero-btn-outline-fg": "#1A365D",
    "--tl-hero-frame-border": "rgba(49,130,206,0.25)",
    "--tl-hero-frame-shadow": "0 24px 48px -16px rgba(49,130,206,0.32)",
    "--tl-hero-icon-opacity": "0.12",
    "--tl-hero-watermark-opacity": "0.07",
    "--tl-hero-support-from": "#2B6CB0",
    "--tl-hero-accent": "#3182CE",
    "--tl-hero-wa-bg": "rgba(37,211,102,0.1)",
    "--tl-hero-wa-border": "rgba(56,161,105,0.35)",
    "--tl-hero-wa-fg": "#276749",
    "--tl-hero-photo-fade": "linear-gradient(to top, rgba(235,244,252,0.35) 0%, transparent 40%)",
    "--tl-hero-orb-a": "rgba(49,130,206,0.04)",
    "--tl-hero-orb-b": "rgba(66,153,225,0.03)",
    "--tl-hero-orb-c": "rgba(144,205,244,0.03)",
    "--tl-hero-mesh":
      "radial-gradient(ellipse 60% 55% at 85% 28%, rgba(49,130,206,0.035) 0%, transparent 60%), radial-gradient(ellipse 50% 45% at 10% 78%, rgba(43,108,176,0.025) 0%, transparent 55%), radial-gradient(ellipse 40% 35% at 48% 8%, rgba(99,179,237,0.025) 0%, transparent 50%)",
  };
}

export const tlContainer =
  "mx-auto w-full max-w-[1280px] px-4 sm:px-5 md:px-6 lg:px-8";

export const tlCard =
  "rounded-2xl border border-[color:var(--tl-border)] bg-[var(--tl-card)] shadow-[var(--tl-shadow)] transition-all duration-200";

export const tlCardHover =
  "cursor-pointer hover:-translate-y-0.5 hover:border-[#00A0E3]/40";

export const tlBentoTile =
  "rounded-2xl border border-[color:var(--tl-border)] bg-[var(--tl-card)] p-5 shadow-[var(--tl-shadow)] transition-all duration-200 md:p-6";

export const tlBentoTileHover = tlCardHover;

export const tlSection = "bg-[var(--tl-section)] text-[var(--tl-fg)]";
export const tlSectionAlt = "bg-[var(--tl-section-alt)] text-[var(--tl-fg)]";

/** @deprecated */
export const tlSectionDark = tlSection;
export const tlSectionWhite = tlSection;
export const tlSectionMuted = tlSectionAlt;

export const tlBtnPrimary =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#00A0E3] px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_28px_-8px_#00A0E399] transition-all duration-200 hover:brightness-110 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00A0E3]";

export const tlBtnSecondary =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[color:var(--tl-btn-outline-border)] bg-transparent px-6 py-3.5 text-sm font-bold text-[var(--tl-btn-outline-fg)] transition-all duration-200 hover:bg-[var(--tl-soft)] active:scale-[0.98]";

export const tlBtnOutline =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[color:var(--tl-btn-outline-border)] bg-[var(--tl-btn-outline-bg)] px-6 py-3.5 text-sm font-bold text-[var(--tl-btn-outline-fg)] transition-all duration-200 hover:brightness-95 active:scale-[0.98]";

export const tlBtnOutlineDark = tlBtnSecondary;

export const tlHeading =
  "font-heading text-2xl font-bold tracking-tight text-[var(--tl-fg)] md:text-3xl";

export const tlHeadingLight = tlHeading;

export const tlEyebrow =
  "inline-flex items-center gap-2 rounded-full border border-[color:var(--tl-chip-border)] bg-[var(--tl-chip-bg)] px-3 py-1 text-xs font-bold text-[var(--tl-muted)]";

export const tlEyebrowOrange =
  "inline-flex items-center gap-2 rounded-full border border-[#D4E157]/40 bg-[#D4E157]/15 px-3 py-1 text-xs font-bold text-[#9A8B1A] [.tenant-dark_&]:text-[#D4E157]";

/** @deprecated */
export const tlEyebrowGold = tlEyebrowOrange;

export const tlMutedText = "text-sm leading-7 text-[var(--tl-muted)] sm:text-base";
export const tlFg = "text-[var(--tl-fg)]";
export const tlMuted = "text-[var(--tl-muted)]";
export const tlSoftSurface =
  "border border-[color:var(--tl-border)] bg-[var(--tl-soft)]";

export const tlGridPattern =
  "pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(#00A0E322_1px,transparent_1px)] [background-size:22px_22px]";

export const TL_BENTO_SPANS = [
  "lg:col-span-2 lg:row-span-2",
  "lg:col-span-1 lg:row-span-1",
  "lg:col-span-1 lg:row-span-1",
  "lg:col-span-2 lg:row-span-1",
];

export const TL_SERVICE_ACCENTS = [
  { iconBg: "bg-[#00A0E3]/15 text-[#00A0E3]", ring: "ring-[#00A0E3]/20" },
  { iconBg: "bg-[#D4E157]/15 text-[#D4E157]", ring: "ring-[#D4E157]/20" },
  { iconBg: "bg-[#00A0E3]/15 text-[#00A0E3]", ring: "ring-[#00A0E3]/20" },
  { iconBg: "bg-[#D4E157]/15 text-[#D4E157]", ring: "ring-[#D4E157]/20" },
];
