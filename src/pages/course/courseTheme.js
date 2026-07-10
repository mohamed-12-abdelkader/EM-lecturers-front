/**
 * Course pages — UI UX Pro Max tokens (blue.500 + orange.500, vibrant blocks)
 */
export const CR_BLUE = "#3182CE";
export const CR_ORANGE = "#DD6B20";
export const CR_BG = "#F8FAFC";
export const CR_FG = "#0F172A";

export const crContainer = "mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8";

export const crPageBg = "min-h-screen bg-slate-50 dark:bg-slate-950";

export const crCard =
  "rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 dark:border-slate-700 dark:bg-slate-900";

export const crCardHover =
  "cursor-pointer hover:border-blue-200 hover:shadow-md dark:hover:border-blue-800";

export const crSection =
  "rounded-2xl border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-900";

export const crHeading =
  "font-heading text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl";

export const crSubheading =
  "font-heading text-lg font-bold text-slate-900 dark:text-white";

export const crEyebrow =
  "inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-500 dark:bg-blue-950/50 dark:text-blue-400";

export const crEyebrowOrange =
  "inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-500 dark:bg-orange-950/40 dark:text-orange-400";

export const crBtnPrimary =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:opacity-60";

export const crBtnSecondary =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-60";

export const crBtnOutline =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-blue-500 bg-transparent px-5 py-2.5 text-sm font-bold text-blue-500 transition-all duration-200 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/40";

export const crStatTile =
  "flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-200 dark:border-slate-700 dark:bg-slate-900";

export const crGridPattern =
  "pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(#3182CE22_1px,transparent_1px)] [background-size:18px_18px]";

export const CR_TAB_COLORS = {
  red: {
    active: "bg-red-500 text-white shadow-[0_4px_14px_rgba(239,68,68,0.35)]",
    idle: "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
  },
  blue: {
    active: "bg-blue-500 text-white shadow-[0_4px_14px_rgba(49,130,206,0.35)]",
    idle: "text-slate-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
  },
  green: {
    active: "bg-emerald-500 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)]",
    idle: "text-slate-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  purple: {
    active: "bg-violet-500 text-white shadow-[0_4px_14px_rgba(139,92,246,0.35)]",
    idle: "text-slate-600 hover:bg-violet-50 dark:text-slate-400 dark:hover:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-800",
  },
  orange: {
    active: "bg-orange-500 text-white shadow-[0_4px_14px_rgba(221,107,32,0.35)]",
    idle: "text-slate-600 hover:bg-orange-50 dark:text-slate-400 dark:hover:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
  },
};

export function crTabClass(isSelected, colorKey = "blue") {
  const c = CR_TAB_COLORS[colorKey] || CR_TAB_COLORS.blue;
  return [
    "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-all duration-200 sm:flex-initial",
    c.border,
    isSelected ? c.active : c.idle,
  ].join(" ");
}

/** LectureCard typography — Noto Naskh (headings) + Noto Sans (body) */
export const lcRoot = "font-sans antialiased";
export const lcTitle = "font-heading text-[1.125rem] font-bold leading-[1.5] tracking-tight text-slate-900 dark:text-white md:text-xl";
export const lcTitleSm = "font-heading text-[0.9375rem] font-semibold leading-snug text-slate-900 dark:text-white";
export const lcBody = "font-sans text-[0.9375rem] leading-[1.75] text-slate-600 dark:text-slate-400";
export const lcBodySm = "font-sans text-sm leading-7 text-slate-600 dark:text-slate-400";
export const lcLabel = "font-sans text-xs font-medium text-slate-500 dark:text-slate-400";
export const lcCaption = "font-sans text-[11px] leading-relaxed text-slate-500 dark:text-slate-500";
export const lcStatValue = "font-heading text-sm font-bold tabular-nums text-slate-900 dark:text-white";
export const lcStatLabel = "font-sans text-[11px] font-medium text-slate-500";
export const lcTab = "font-sans text-[13px] font-semibold";
export const lcBadge = "font-sans text-[11px] font-semibold";
export const lcBtn = "font-sans text-xs font-semibold";
export const lcIndex = "font-heading text-lg font-bold tabular-nums";
