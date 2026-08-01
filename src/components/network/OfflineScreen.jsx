/**
 * شاشة انقطاع الإنترنت — تغطي التطبيق عند فقدان الاتصال وتختفي تلقائياً عند عودته.
 * الطلبات المعلّقة يعاد إرسالها تلقائياً (interceptor في api/baseUrl.js).
 */
import { useEffect, useState } from "react";
import useOnlineStatus from "../../Hooks/network/useOnlineStatus";

export default function OfflineScreen() {
  const isOnline = useOnlineStatus();
  // مهلة قصيرة قبل الإظهار — تجنب الوميض عند تقلب الشبكة لحظياً
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOnline) {
      setVisible(false);
      return undefined;
    }
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [isOnline]);

  if (!visible) return null;

  return (
    <div
      dir="rtl"
      role="alert"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        padding: 24,
        textAlign: "center",
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(49,130,206,0.12) 0%, transparent 60%), linear-gradient(180deg, #0B1220 0%, #0F1A2E 100%)",
        color: "#E2E8F0",
      }}
    >
      <style>{`
        @keyframes em-offline-pulse { 0%,100% { opacity:.55; } 50% { opacity:1; } }
        @media (prefers-reduced-motion: reduce) { .em-offline-icon { animation: none !important; } }
      `}</style>
      <div
        className="em-offline-icon"
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(99,179,237,0.12)",
          border: "1px solid rgba(99,179,237,0.25)",
          animation: "em-offline-pulse 2s ease-in-out infinite",
        }}
      >
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M1 1l22 22M8.5 16.5a5 5 0 017 0M5 12.55a10 10 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.9 15.9 0 014.7-2.88M16.5 12.55a10 10 0 012.5 1.85M12 20h.01"
            stroke="#63B3ED"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <p style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
          لا يوجد اتصال بالإنترنت
        </p>
        <p style={{ fontSize: 14, opacity: 0.75, marginTop: 10, lineHeight: 1.9 }}>
          تحقق من الشبكة — سنستكمل تلقائياً فور عودة الاتصال دون فقدان ما كنت تفعله.
        </p>
      </div>
    </div>
  );
}
