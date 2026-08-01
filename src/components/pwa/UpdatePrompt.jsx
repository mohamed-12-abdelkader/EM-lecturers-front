/**
 * UpdatePrompt — بانر أنيق أسفل الشاشة عند توفر إصدار جديد من التطبيق.
 * "تحديث" → تفعيل النسخة الجديدة فوراً. "لاحقاً" → إخفاء حتى التحميل القادم.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowRotateRight } from "react-icons/fa6";
import {
  PWA_UPDATE_EVENT,
  applyPWAUpdate,
  isUpdateAvailable,
} from "../../pwa/registerPWA";

export default function UpdatePrompt() {
  const [visible, setVisible] = useState(() => isUpdateAvailable());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onUpdate = () => setVisible(true);
    window.addEventListener(PWA_UPDATE_EVENT, onUpdate);
    return () => window.removeEventListener(PWA_UPDATE_EVENT, onUpdate);
  }, []);

  const handleUpdate = async () => {
    if (busy) return;
    setBusy(true);
    await applyPWAUpdate();
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="pwa-update-banner"
          dir="rtl"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          role="alertdialog"
          aria-label="يتوفر إصدار جديد"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          className="fixed inset-x-3 bottom-3 z-[10000] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-blue-100 bg-white p-3.5 shadow-2xl shadow-blue-900/20 dark:border-slate-700 dark:bg-slate-800"
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-slate-700 dark:text-blue-300">
            <FaArrowRotateRight className={busy ? "animate-spin" : ""} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
              يتوفر إصدار جديد
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              حدّث الآن للحصول على آخر التحسينات.
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setVisible(false)}
              disabled={busy}
              className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              لاحقاً
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={busy}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-blue-500/30 transition hover:bg-blue-700 disabled:opacity-70"
            >
              {busy ? "جاري التحديث..." : "تحديث"}
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
