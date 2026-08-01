/**
 * أدوات حالة الاتصال بالشبكة.
 */

export function isBrowserOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

/**
 * ينتظر عودة الاتصال (حدث online) حتى مهلة قصوى.
 * يرجع true لو عاد الاتصال، false لو انتهت المهلة.
 */
export function waitForOnline(timeoutMs = 20_000) {
  if (isBrowserOnline()) return Promise.resolve(true);
  if (typeof window === "undefined") return Promise.resolve(false);
  return new Promise((resolve) => {
    let timer = null;
    const onOnline = () => {
      window.removeEventListener("online", onOnline);
      if (timer) clearTimeout(timer);
      resolve(true);
    };
    window.addEventListener("online", onOnline);
    timer = setTimeout(() => {
      window.removeEventListener("online", onOnline);
      resolve(false);
    }, timeoutMs);
  });
}

/** هل الخطأ خطأ شبكة (بدون استجابة من الخادم)؟ */
export function isNetworkError(error) {
  return Boolean(error) && !error.response && error.code !== "ERR_CANCELED";
}
