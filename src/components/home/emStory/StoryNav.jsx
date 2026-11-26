import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { EM, emFont } from "./theme";
import logoImg from "../../../img/next logo.png";
import PlatformSearchBar from "./PlatformSearchBar";

const LINKS = [
  { href: "#problems", label: "المشاكل" },
  { href: "#day-after", label: "يومك بعد EM" },
  { href: "#ecosystem", label: "المنصة" },
  { href: "#proof", label: "قصص حقيقية" },
];

export default function StoryNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 safe-top"
      style={{
        ...emFont,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <div
        className="mx-auto flex h-[52px] max-w-7xl items-center justify-between gap-2 px-3 transition-all duration-300 sm:h-14 sm:gap-3 sm:px-5"
        style={{
          marginTop: scrolled ? 8 : 0,
          marginInline: scrolled ? 10 : 0,
          width: scrolled ? "calc(100% - 20px)" : "100%",
          maxWidth: scrolled ? "80rem" : undefined,
          borderRadius: scrolled ? 16 : 0,
          background: "rgba(7,11,20,0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: scrolled ? "0 10px 32px rgba(0,0,0,0.35)" : "none",
          borderBottom: scrolled ? "none" : `1px solid ${EM.line}`,
          border: scrolled ? `1px solid ${EM.line}` : undefined,
        }}
      >
        <a href="#top" className="flex min-w-0 items-center gap-2">
          <img
            src={logoImg}
            alt="EM Lectures"
            className="h-8 w-8 shrink-0 object-contain"
          />
          <span className="truncate text-[13px] font-extrabold tracking-tight sm:text-[15px]" style={{ color: EM.text }}>
            EM <span style={{ color: EM.blue }}>Lectures</span>
          </span>
        </a>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-2 text-sm font-semibold transition hover:bg-white/5"
              style={{ color: EM.textMuted }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="mx-2 hidden min-w-0 flex-1 justify-center md:flex lg:mx-4 lg:max-w-sm">
          <PlatformSearchBar variant="nav" className="w-full max-w-sm" />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/login"
            className="hidden rounded-full px-3 py-2 text-sm font-bold transition hover:bg-white/5 sm:inline-flex"
            style={{ color: EM.textMuted }}
          >
            دخول
          </Link>
          <Link
            to="/create-platform"
            className="inline-flex h-9 min-w-[4.25rem] items-center justify-center rounded-full px-3.5 text-[12px] font-extrabold text-white shadow-md shadow-blue-500/25 transition hover:brightness-110 sm:h-10 sm:min-w-0 sm:px-4 sm:text-sm"
            style={{ background: EM.blue }}
          >
            <span className="sm:hidden">ابدأ</span>
            <span className="hidden sm:inline">ابدأ رحلتك</span>
          </Link>
          <button
            type="button"
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={open}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border lg:hidden"
            style={{ borderColor: EM.line, color: EM.text, background: EM.bgCard }}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="text-sm leading-none" aria-hidden>
              {open ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="إغلاق"
              className="fixed inset-0 z-40 bg-black/65 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="relative z-50 mx-2 mt-2 overflow-hidden rounded-2xl border p-2 shadow-2xl sm:mx-3 lg:hidden"
              style={{
                borderColor: EM.line,
                background: "rgba(13,20,36,0.98)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="px-2 pb-2 pt-1">
                <PlatformSearchBar variant="nav" />
              </div>
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3.5 text-[15px] font-bold transition active:bg-white/5"
                  style={{ color: EM.text }}
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-1 grid grid-cols-2 gap-2 p-2">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border text-sm font-bold"
                  style={{ borderColor: EM.line, color: EM.text }}
                >
                  دخول
                </Link>
                <Link
                  to="/create-platform"
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl text-sm font-extrabold text-white"
                  style={{ background: EM.blue }}
                >
                  ابدأ رحلتك
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
