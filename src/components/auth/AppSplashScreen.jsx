/**
 * شاشة البداية أثناء استعادة الجلسة — تمنع وميض صفحة الدخول أو شاشة بيضاء.
 * خفيفة (CSS فقط) وتحترم prefers-reduced-motion.
 */
export default function AppSplashScreen({ message = "جارٍ استعادة الجلسة..." }) {
  return (
    <div
      dir="rtl"
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "22px",
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(49,130,206,0.16) 0%, transparent 60%), linear-gradient(180deg, #0B1220 0%, #0F1A2E 100%)",
        color: "#E2E8F0",
        fontFamily: "inherit",
      }}
    >
      <style>{`
        @keyframes em-splash-ring { to { transform: rotate(360deg); } }
        @keyframes em-splash-pulse { 0%,100% { opacity: .45; transform: scale(.96); } 50% { opacity: 1; transform: scale(1); } }
        @keyframes em-splash-dots { 0%, 20% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .em-splash-ring, .em-splash-logo, .em-splash-dot { animation: none !important; }
        }
      `}</style>

      <div style={{ position: "relative", width: 96, height: 96 }}>
        <div
          className="em-splash-ring"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "3px solid rgba(99,179,237,0.18)",
            borderTopColor: "#63B3ED",
            animation: "em-splash-ring 1s linear infinite",
          }}
        />
        <div
          className="em-splash-logo"
          style={{
            position: "absolute",
            inset: 14,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #2B6CB0 0%, #1A365D 100%)",
            boxShadow: "0 10px 30px rgba(43,108,176,0.35)",
            fontWeight: 800,
            fontSize: 22,
            color: "#fff",
            animation: "em-splash-pulse 2.2s ease-in-out infinite",
          }}
        >
          EM
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "0.01em" }}>
          {message}
        </span>
        <span style={{ display: "inline-flex", gap: 4 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="em-splash-dot"
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#63B3ED",
                animation: `em-splash-dots 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
