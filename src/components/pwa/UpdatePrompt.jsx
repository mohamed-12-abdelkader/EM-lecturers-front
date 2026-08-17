/**
 * UpdatePrompt — إشعار خفيف أثناء تطبيق التحديث تلقائياً (بدون ضغط المستخدم).
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowRotateRight } from "react-icons/fa6";
import { PWA_UPDATE_EVENT, isUpdateAvailable } from "../../pwa/registerPWA";

export default function UpdatePrompt() {
  const [visible, setVisible] = useState(() => isUpdateAvailable());

  useEffect(() => {
    const onUpdate = () => setVisible(true);
    window.addEventListener(PWA_UPDATE_EVENT, onUpdate);
    return () => window.removeEventListener(PWA_UPDATE_EVENT, onUpdate);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="pwa-update-banner"
          dir="rtl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          role="status"
          aria-live="polite"
          aria-label="جاري تحديث التطبيق"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          className="fixed inset-x-3 bottom-3 z-[10000] mx-auto flex max-w-sm items-center gap-3 rounded-2xl border border-blue-100 bg-white p-3.5 shadow-2xl shadow-blue-900/20 dark:border-slate-700 dark:bg-slate-800"
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-slate-700 dark:text-blue-300">
            <FaArrowRotateRight className="animate-spin" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
              جاري تحديث التطبيق…
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              سيتم تحميل آخر نسخة تلقائياً.
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
