/** عدّاد مرجعي لشاشة التحميل الموحّدة — يمنع وميض التحميل المزدوج بين Suspense والصفحة. */
let count = 0;
let decTimer = null;
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeBrandLoading(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getBrandLoadingSnapshot() {
  return count > 0;
}

export function incBrandLoading() {
  if (decTimer != null) {
    // handoff: loader جديد يحل محل القديم — لا نزيد العداد
    clearTimeout(decTimer);
    decTimer = null;
    notify();
    return;
  }
  count += 1;
  notify();
}

export function decBrandLoading() {
  if (decTimer != null) clearTimeout(decTimer);
  decTimer = setTimeout(() => {
    decTimer = null;
    count = Math.max(0, count - 1);
    notify();
  }, 0);
}

/** للتصحيح فقط — إعادة ضبط عند الحاجة */
export function resetBrandLoading() {
  if (decTimer != null) {
    clearTimeout(decTimer);
    decTimer = null;
  }
  count = 0;
  notify();
}
