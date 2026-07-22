/**
 * يفرض العربية واتجاه RTL على مستوى المستند، بغض النظر عن لغة الجهاز.
 * يُستدعى مبكراً عند إقلاع التطبيق.
 */
export const APP_LOCALE = "ar-EG";
export const APP_LANG = "ar";
export const APP_DIR = "rtl";

export function forceArabicDocumentLocale() {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  root.lang = APP_LANG;
  root.dir = APP_DIR;
  root.setAttribute("translate", "no");
  root.setAttribute("xml:lang", APP_LANG);

  if (document.body) {
    document.body.lang = APP_LANG;
    document.body.dir = APP_DIR;
    document.body.setAttribute("translate", "no");
  }

  // بعض المتصفحات تعتمد على meta content-language
  let meta = document.querySelector('meta[http-equiv="content-language"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("http-equiv", "content-language");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", APP_LANG);

  let langMeta = document.querySelector('meta[name="language"]');
  if (!langMeta) {
    langMeta = document.createElement("meta");
    langMeta.setAttribute("name", "language");
    document.head.appendChild(langMeta);
  }
  langMeta.setAttribute("content", "Arabic");
}

/** تنسيق تاريخ/وقت بالعربية دائماً */
export function formatAppDate(value, options) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(APP_LOCALE, options);
}

export function formatAppDateTime(value, options) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(APP_LOCALE, options);
}

export function formatAppNumber(value, options) {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value ?? "");
  return n.toLocaleString(APP_LOCALE, options);
}
