const RELOAD_GUARD_KEY = "em_chunk_reload_ts";
const RELOAD_COOLDOWN_MS = 12_000;

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

/** إعادة تحميل واحدة عند تعارض نسخة PWA/كاش — يمنع حلقة لا نهائية */
export function recoverFromChunkError(error) {
  if (typeof window === "undefined" || !isChunkLoadError(error)) return false;

  try {
    const lastReload = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);
    const now = Date.now();
    if (now - lastReload < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(now));
  } catch {
    /* ignore storage errors */
  }

  window.location.reload();
  return true;
}

export function registerChunkLoadRecovery() {
  if (typeof window === "undefined") return;

  window.addEventListener("unhandledrejection", (event) => {
    if (recoverFromChunkError(event.reason)) {
      event.preventDefault();
    }
  });

  window.addEventListener(
    "error",
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLScriptElement)) return;
      if (!target.src) return;
      if (recoverFromChunkError(new Error(`Script load failed: ${target.src}`))) {
        event.preventDefault();
      }
    },
    true,
  );
}
