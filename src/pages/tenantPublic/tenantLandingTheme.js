/**
 * Tenant landing — blue.500 + orange.500 palette
 */
export const TL_BLUE = "#3182CE";
export const TL_ORANGE = "#DD6B20";
export const TL_PRIMARY = TL_BLUE;
export const TL_SECONDARY = TL_BLUE;
export const TL_ACCENT = TL_ORANGE;
export const TL_BG = "#F8FAFC";
export const TL_FG = "#0F172A";
export const TL_MUTED = "#EBF4FF";
export const TL_BORDER = "#E2E8F0";

export const tlContainer = "mx-auto w-full max-w-[1280px] px-4 md:px-6 lg:px-8";

export const tlCard =
  "rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 dark:border-slate-700 dark:bg-slate-900";

export const tlCardHover =
  "cursor-pointer hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:hover:border-blue-800";

export const tlBentoTile =
  "rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 dark:border-slate-700 dark:bg-slate-900 md:p-6";

export const tlBentoTileHover = tlCardHover;

export const tlSectionDark = "bg-[#1A365D] text-white";

export const tlSectionWhite = "bg-white dark:bg-slate-950";

export const tlSectionMuted = "bg-slate-50 dark:bg-slate-950/90";

export const tlBtnPrimary =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500";

export const tlBtnSecondary =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

export const tlBtnOutline =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-white/40 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20";

export const tlBtnOutlineDark =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-blue-500 bg-transparent px-6 py-3 text-sm font-bold text-blue-500 transition-all duration-200 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/40";

export const tlHeading =
  "font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl";

export const tlHeadingLight = "font-heading text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl";

export const tlEyebrow =
  "inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-500 dark:bg-blue-950/50 dark:text-blue-400";


export const tlEyebrowOrange =
  "inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-500 dark:bg-orange-950/40 dark:text-orange-400";

/** @deprecated use tlEyebrowOrange */
export const tlEyebrowGold = tlEyebrowOrange;

export const tlGridPattern =
  "pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(#3182CE33_1px,transparent_1px)] [background-size:20px_20px]";

export const TL_BENTO_SPANS = [
  "lg:col-span-2 lg:row-span-2",
  "lg:col-span-1 lg:row-span-1",
  "lg:col-span-1 lg:row-span-1",
  "lg:col-span-2 lg:row-span-1",
];

export const TL_SERVICE_ACCENTS = [
  { iconBg: "bg-blue-50 text-blue-500", ring: "ring-blue-500/15" },
  { iconBg: "bg-orange-50 text-orange-500", ring: "ring-orange-500/15" },
  { iconBg: "bg-blue-50 text-blue-500", ring: "ring-blue-500/15" },
  { iconBg: "bg-orange-50 text-orange-500", ring: "ring-orange-500/15" },
];
