/**
 * Tenant landing — cinematic navy + cyan + lime (matches hero)
 */
export const TL_NAVY = "#0A1628";
export const TL_NAVY_SOFT = "#0F1F38";
export const TL_NAVY_CARD = "#12263F";
export const TL_CYAN = "#00A0E3";
export const TL_LIME = "#D4E157";
export const TL_TAGLINE = "#7EB8D9";

/** @deprecated aliases kept for older imports */
export const TL_BLUE = TL_CYAN;
export const TL_ORANGE = TL_LIME;
export const TL_PRIMARY = TL_CYAN;
export const TL_SECONDARY = TL_CYAN;
export const TL_ACCENT = TL_LIME;
export const TL_BG = TL_NAVY;
export const TL_FG = "#F8FAFC";
export const TL_MUTED = TL_NAVY_SOFT;
export const TL_BORDER = "rgba(255,255,255,0.12)";

export const tlContainer =
  "mx-auto w-full max-w-[1280px] px-4 sm:px-5 md:px-6 lg:px-8";

export const tlCard =
  "rounded-2xl border border-white/10 bg-white/[0.06] shadow-[0_12px_40px_-16px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-all duration-200";

export const tlCardHover =
  "cursor-pointer hover:-translate-y-0.5 hover:border-[#00A0E3]/35 hover:bg-white/[0.09]";

export const tlBentoTile =
  "rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.45)] transition-all duration-200 md:p-6";

export const tlBentoTileHover = tlCardHover;

export const tlSectionDark = "bg-[#0A1628] text-white";

export const tlSectionWhite = "bg-[#0A1628] text-white";

export const tlSectionMuted = "bg-[#0F1F38] text-white";

export const tlBtnPrimary =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#00A0E3] px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_28px_-8px_#00A0E399] transition-all duration-200 hover:brightness-110 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00A0E3]";

export const tlBtnSecondary =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/30 bg-transparent px-6 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:bg-white/10 active:scale-[0.98]";

export const tlBtnOutline =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/5 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/12";

export const tlBtnOutlineDark = tlBtnSecondary;

export const tlHeading =
  "font-heading text-2xl font-bold tracking-tight text-white md:text-3xl";

export const tlHeadingLight = tlHeading;

export const tlEyebrow =
  "inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-bold text-[#7EB8D9]";

export const tlEyebrowOrange =
  "inline-flex items-center gap-2 rounded-full border border-[#D4E157]/35 bg-[#D4E157]/10 px-3 py-1 text-xs font-bold text-[#D4E157]";

/** @deprecated use tlEyebrowOrange */
export const tlEyebrowGold = tlEyebrowOrange;

export const tlMutedText = "text-sm leading-7 text-[#7EB8D9]/90 sm:text-base";

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
