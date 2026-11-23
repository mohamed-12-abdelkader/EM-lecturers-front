import { notifyChunkMismatchUpdate } from "../pwa/chunkMismatchBridge";

export function isChunkLoadError(error) {
  const message = String(error?.message || error || "");
  return (
    error?.name === "ChunkLoadError" ||
    /Loading chunk [\d]+ failed/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Unable to preload CSS/i.test(message) ||
    /Unexpected token '<'/i.test(message) ||
    /Unexpected token '<', "<!DOCTYPE"/i.test(message) ||
    /Failed to load url .*\.jsx/i.test(message)
  );
}

/**
 * عند فشل تحميل chunk بعد نشر جديد:
 * نعلّم بوجود تحديث فقط — بدون location.reload تلقائي.
 * المستخدم يحدّث الصفحة بنفسه عندما يريد.
 */
export function recoverFromChunkError(error) {
  if (typeof window === "undefined" || !isChunkLoadError(error)) return false;
  notifyChunkMismatchUpdate();
  return false;
}

export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  window.addEventListener("unhandledrejection", (event) => {
    if (!isChunkLoadError(event.reason)) return;
    notifyChunkMismatchUpdate();
  });

  window.addEventListener(
    "error",
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLScriptElement)) return;
      if (!target.src) return;
      if (!isChunkLoadError(new Error(`Script load failed: ${target.src}`))) return;
      notifyChunkMismatchUpdate();
    },
    true,
  );
}
