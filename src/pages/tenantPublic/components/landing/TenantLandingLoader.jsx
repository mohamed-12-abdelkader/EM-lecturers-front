import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  TL_NAVY,
  TL_CYAN,
  TL_LIME,
  TL_TAGLINE,
} from "../../tenantLandingTheme";
import {
  readCachedTenantBrandLogo,
  readDocumentTenantIcon,
} from "../../../../utils/tenantBrandLogo";

const EASE = [0.22, 1, 0.36, 1];

/**
 * شاشة تحميل سينمائية لصفحة اللاندنج العامة — بهوية Navy / Cyan / Lime
 */
export default function TenantLandingLoader({ subdomain = "" }) {
  const reduceMotion = useReducedMotion();
  const brandLetter = (subdomain || "م").trim().charAt(0).toUpperCase() || "م";

  const [logoSrc, setLogoSrc] = useState(() => {
    if (!subdomain) return null;
    return (
      readCachedTenantBrandLogo(subdomain) || readDocumentTenantIcon() || null
    );
  });

  useEffect(() => {
    if (!subdomain) return;
    const next =
      readCachedTenantBrandLogo(subdomain) || readDocumentTenantIcon() || null;
    if (next) setLogoSrc(next);
  }, [subdomain]);

  const displayName = useMemo(() => {
    if (!subdomain) return "المنصة";
    return String(subdomain).replace(/[-_]/g, " ");
  }, [subdomain]);

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
      style={{ background: TL_NAVY }}
      dir="rtl"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="جاري تحميل الصفحة"
    >
      {/* Atmosphere */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 50% 35%, ${TL_CYAN}28 0%, transparent 55%),
            radial-gradient(ellipse 45% 40% at 85% 80%, ${TL_LIME}18 0%, transparent 50%),
            radial-gradient(ellipse 40% 35% at 10% 75%, ${TL_CYAN}14 0%, transparent 45%)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.14) 1px, transparent 0)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 45%, black, transparent)",
        }}
      />

      {/* Soft floating orbs */}
      {!reduceMotion ? (
        <>
          <motion.div
            className="pointer-events-none absolute h-64 w-64 rounded-full blur-3xl"
            style={{ background: `${TL_CYAN}22`, top: "12%", right: "8%" }}
            animate={{ y: [0, 18, 0], x: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
          <motion.div
            className="pointer-events-none absolute h-48 w-48 rounded-full blur-3xl"
            style={{ background: `${TL_LIME}18`, bottom: "14%", left: "10%" }}
            animate={{ y: [0, -14, 0], x: [0, 12, 0] }}
            transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden
          />
        </>
      ) : null}

      <motion.div
        className="relative z-10 flex w-full max-w-sm flex-col items-center text-center"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        {/* Logo / mark with orbit rings */}
        <div className="relative mb-8 flex h-36 w-36 items-center justify-center sm:h-40 sm:w-40">
          {!reduceMotion ? (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border border-white/10"
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                aria-hidden
              />
              <motion.div
                className="absolute inset-2 rounded-full border-2 border-transparent"
                style={{
                  borderTopColor: TL_CYAN,
                  borderRightColor: `${TL_CYAN}55`,
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1.35, repeat: Infinity, ease: "linear" }}
                aria-hidden
              />
              <motion.div
                className="absolute inset-5 rounded-full border border-transparent"
                style={{
                  borderBottomColor: TL_LIME,
                  borderLeftColor: `${TL_LIME}66`,
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                aria-hidden
              />
            </>
          ) : (
            <div
              className="absolute inset-2 rounded-full border-2"
              style={{ borderColor: `${TL_CYAN}55` }}
              aria-hidden
            />
          )}

          <motion.div
            className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.35rem] border border-white/15 bg-white/[0.08] shadow-[0_20px_50px_-18px_rgba(0,160,227,0.55)] backdrop-blur-md sm:h-28 sm:w-28"
            animate={
              reduceMotion
                ? undefined
                : { scale: [1, 1.04, 1], boxShadow: [
                    "0 20px 50px -18px rgba(0,160,227,0.45)",
                    "0 24px 56px -14px rgba(212,225,87,0.35)",
                    "0 20px 50px -18px rgba(0,160,227,0.45)",
                  ] }
            }
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            {logoSrc ? (
              <img
                src={logoSrc}
                alt=""
                className="h-full w-full object-contain p-3"
              />
            ) : (
              <span
                className="font-heading text-4xl font-bold text-white sm:text-5xl"
                style={{ textShadow: `0 0 28px ${TL_CYAN}88` }}
              >
                {brandLetter}
              </span>
            )}
          </motion.div>
        </div>

        <motion.p
          className="mb-2 text-[11px] font-bold tracking-[0.22em] uppercase"
          style={{ color: TL_TAGLINE }}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          جاري التجهيز
        </motion.p>

        <motion.h1
          className="font-heading text-xl font-bold text-white sm:text-2xl"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45, ease: EASE }}
        >
          {displayName}
        </motion.h1>

        <motion.p
          className="mt-2 text-sm leading-7"
          style={{ color: TL_TAGLINE }}
          animate={
            reduceMotion
              ? undefined
              : { opacity: [0.55, 1, 0.55] }
          }
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          نجهّز منصتك التعليمية…
        </motion.p>

        {/* Progress shimmer */}
        <div className="mt-8 w-full max-w-[220px]">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            {reduceMotion ? (
              <div
                className="h-full w-2/3 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${TL_CYAN}, ${TL_LIME})`,
                }}
              />
            ) : (
              <motion.div
                className="h-full w-2/5 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${TL_CYAN}, ${TL_LIME}, ${TL_CYAN})`,
                  backgroundSize: "200% 100%",
                }}
                animate={{
                  x: ["-20%", "180%"],
                  backgroundPosition: ["0% 50%", "100% 50%"],
                }}
                transition={{
                  duration: 1.35,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: i === 1 ? TL_LIME : TL_CYAN }}
                animate={
                  reduceMotion
                    ? undefined
                    : { opacity: [0.35, 1, 0.35], scale: [0.85, 1.15, 0.85] }
                }
                transition={{
                  duration: 1.1,
                  repeat: Infinity,
                  delay: i * 0.18,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Bottom brand line */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${TL_CYAN}88, ${TL_LIME}88, transparent)`,
        }}
        aria-hidden
      />
    </div>
  );
}
