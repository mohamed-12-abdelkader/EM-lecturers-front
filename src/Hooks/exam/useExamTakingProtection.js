import { useEffect, useRef } from "react";

const EXAM_TAKING_FLAG = "em-lecture-exam-taking";

/** هل يوجد امتحان/واجب نشط (يحمي من reload الـ PWA) */
export function isExamTakingActive() {
  if (typeof window === "undefined") return false;
  try {
    return (
      sessionStorage.getItem(EXAM_TAKING_FLAG) === "1" ||
      localStorage.getItem(EXAM_TAKING_FLAG) === "1"
    );
  } catch {
    return false;
  }
}

function setExamTakingFlag(active) {
  if (typeof window === "undefined") return;
  try {
    if (active) {
      sessionStorage.setItem(EXAM_TAKING_FLAG, "1");
      localStorage.setItem(EXAM_TAKING_FLAG, "1");
    } else {
      sessionStorage.removeItem(EXAM_TAKING_FLAG);
      localStorage.removeItem(EXAM_TAKING_FLAG);
    }
  } catch {
    // ignore
  }
}

/**
 * حماية جلسة حل الامتحان/الواجب:
 * - تحذير قبل إغلاق/تحديث الصفحة
 * - حفظ فوري عند إخفاء الصفحة
 * - علامة تمنع reload الـ service worker أثناء الحل
 *
 * @param {{ enabled: boolean, onPersist?: () => void, message?: string }} options
 */
/** يُستدعى بعد تسليم الامتحان لإزالة العلم وتطبيق تحديث PWA مؤجّل إن وُجد */
export function clearExamTakingFlag() {
  setExamTakingFlag(false);
  try {
    // استيراد كسول لتجنب دورة اعتماد عند تحميل الـ PWA
    import("../../pwa/registerPWA").then((mod) => {
      mod.flushDeferredPWAUpdate?.();
    });
  } catch {
    // ignore
  }
}

export default function useExamTakingProtection({
  enabled,
  onPersist,
  message = "أنت في منتصف الامتحان. إذا غادرت أو حدّثت الصفحة قد تحتاج لإعادة الدخول — سيتم حفظ إجاباتك والوقت المتبقي.",
} = {}) {
  const persistRef = useRef(onPersist);
  persistRef.current = onPersist;
  const messageRef = useRef(message);
  messageRef.current = message;

  useEffect(() => {
    setExamTakingFlag(Boolean(enabled));
    return () => setExamTakingFlag(false);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return undefined;

    const persistNow = () => {
      try {
        persistRef.current?.();
      } catch {
        // ignore
      }
    };

    const onBeforeUnload = (event) => {
      persistNow();
      event.preventDefault();
      event.returnValue = messageRef.current;
      return messageRef.current;
    };

    const onPageHide = () => persistNow();

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") persistNow();
    };

    const onPopState = () => {
      persistNow();
      const leave = window.confirm(messageRef.current);
      if (!leave) {
        window.history.pushState(null, "", window.location.href);
      }
    };

    // ثبّت نقطة في التاريخ حتى يعمل زر الرجوع مع تأكيد
    window.history.pushState(null, "", window.location.href);

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("popstate", onPopState);
      persistNow();
    };
  }, [enabled]);
}
