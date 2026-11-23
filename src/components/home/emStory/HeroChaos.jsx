import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { EM, emFont, easeOutExpo } from "./theme";

const CHAOS = [
  { id: "wa1", type: "wa", text: "موعد الامتحان امتى؟", x: "4%", y: "16%", rot: -6 },
  { id: "wa2", type: "wa", text: "ابعت المحاضرة تاني", x: "74%", y: "12%", rot: 4 },
  { id: "pay", type: "pay", text: "دفعة ناقصة — ٣٠٠ ج", x: "3%", y: "46%", rot: 3 },
  { id: "sch", type: "sch", text: "سبت ١٠ص · مجموعة أ", x: "72%", y: "40%", rot: -4 },
  { id: "not1", type: "not", text: "١٢ رسالة جديدة", x: "10%", y: "70%", rot: -2 },
  { id: "exam", type: "exam", text: "تصحيح ٥٨ ورقة", x: "70%", y: "68%", rot: 5 },
  { id: "par", type: "par", text: "ولي أمر: مستوى ابني؟", x: "38%", y: "10%", rot: -3 },
  { id: "task", type: "task", text: "رفع فيديو + حضور", x: "40%", y: "78%", rot: 2 },
];

const ORDERED = [
  { label: "طلاب", tone: EM.blue },
  { label: "امتحانات", tone: EM.orange },
  { label: "مدفوعات", tone: EM.blue },
  { label: "تواصل", tone: EM.orange },
  { label: "تحليلات", tone: EM.blue },
];

const MOBILE_CHIPS = [
  "واتساب لا يهدأ",
  "امتحانات متراكمة",
  "مدفوعات ناقصة",
  "متابعة طلاب",
];

function ChaosCard({ item, calm }) {
  const styles = {
    wa: { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.35)", dot: "#34D399" },
    pay: { bg: EM.orangeSoft, border: "rgba(249,115,22,0.4)", dot: EM.orange },
    sch: { bg: EM.blueSoft, border: "rgba(59,130,246,0.4)", dot: EM.blue },
    not: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.35)", dot: "#F87171" },
    exam: { bg: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.35)", dot: "#A78BFA" },
    par: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)", dot: "#FBBF24" },
    task: { bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.3)", dot: "#94A3B8" },
  };
  const s = styles[item.type] || styles.task;

  return (
    <motion.div
      style={{
        position: "absolute",
        left: item.x,
        top: item.y,
        rotate: calm ? 0 : item.rot,
        background: calm ? EM.bgElevated : s.bg,
        borderColor: calm ? EM.line : s.border,
      }}
      className="pointer-events-none max-w-[160px] rounded-2xl border px-2.5 py-2 shadow-xl backdrop-blur-md lg:max-w-[200px] lg:px-3 lg:py-2.5"
    >
      <div className="flex items-start gap-2">
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: s.dot }} />
        <p className="text-[10px] font-bold leading-snug text-white/85 lg:text-xs">
          {calm ? "تم التنظيم" : item.text}
        </p>
      </div>
      {!calm && item.type === "not" && (
        <span
          className="mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white"
          style={{ background: EM.orange }}
        >
          +١٢
        </span>
      )}
    </motion.div>
  );
}

export default function HeroChaos() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const chaos = useTransform(scrollYProgress, [0, 0.35, 0.55, 0.85], [0.3, 1, 0.9, 0.12]);
  const calm = useTransform(scrollYProgress, [0.45, 0.75, 1], [0, 1, 1]);
  const titleY = useTransform(scrollYProgress, [0, 0.5], [0, -28]);

  return (
    <section
      id="top"
      ref={ref}
      className="relative md:min-h-[155vh]"
      style={{ ...emFont, background: EM.bg }}
      aria-label="مقدمة: فوضى يوم المدرس"
    >
      {/* Mobile: compact flow hero — no sticky trap */}
      <div className="relative overflow-hidden px-4 pb-12 pt-20 md:hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 100% 60% at 50% 0%, rgba(59,130,246,0.25), transparent 55%), radial-gradient(ellipse 70% 40% at 100% 80%, rgba(249,115,22,0.10), transparent 50%)",
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-lg text-center">
          <p
            className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold"
            style={{ borderColor: EM.line, background: EM.bgCard, color: EM.textMuted }}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: EM.orange }} />
            منصة بتفهم ضغط المدرّس
          </p>

          <h1 className="px-1 text-[1.55rem] font-black leading-[1.35] tracking-tight text-white">
            أنت مدرّس..
            <br />
            <span style={{ color: EM.blue }}>
              مش موظف
              <br />
              في عشر وظايف.
            </span>
          </h1>

          <p
            className="mx-auto mt-3.5 px-1 text-[13.5px] font-medium leading-7"
            style={{ color: EM.textMuted }}
          >
            الرسائل، الامتحانات، الدفع، الغياب… كلها بتسحب من وقتك. بنحوّلها لنظام يسيبك تشرح.
          </p>

          <div className="mx-auto mt-5 grid grid-cols-2 gap-2">
            {MOBILE_CHIPS.map((c) => (
              <span
                key={c}
                className="rounded-xl border px-2 py-2.5 text-[11px] font-bold leading-snug"
                style={{ borderColor: EM.line, background: EM.bgCard, color: EM.textMuted }}
              >
                {c}
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <a
              href="#day-after"
              className="inline-flex min-h-[50px] items-center justify-center rounded-2xl text-[15px] font-extrabold text-white shadow-lg shadow-blue-500/30"
              style={{ background: EM.blue }}
            >
              خلّيني أشوف الحل
            </a>
            <a
              href="#problems"
              className="inline-flex min-h-[50px] items-center justify-center rounded-2xl border text-[15px] font-extrabold"
              style={{ borderColor: EM.lineStrong, color: EM.text, background: EM.bgCard }}
            >
              اكتشف المشاكل اللي بنحلها
            </a>
          </div>
        </div>
      </div>

      {/* Desktop / tablet+: cinematic sticky hero */}
      <div className="sticky top-0 hidden min-h-[100svh] items-center overflow-hidden md:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 35%, rgba(59,130,246,0.22), transparent 58%), radial-gradient(ellipse 45% 40% at 85% 80%, rgba(249,115,22,0.12), transparent 50%), radial-gradient(ellipse 40% 35% at 10% 75%, rgba(59,130,246,0.08), transparent 50%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse at center, black 15%, transparent 72%)",
          }}
        />

        <motion.div className="absolute inset-0" style={{ opacity: reduce ? 0.35 : chaos }}>
          {CHAOS.map((item, i) => (
            <motion.div
              key={item.id}
              animate={
                reduce
                  ? undefined
                  : {
                      y: [0, i % 2 === 0 ? -10 : 12, 0],
                      x: [0, i % 3 === 0 ? 6 : -5, 0],
                    }
              }
              transition={{ duration: 4.2 + i * 0.35, repeat: Infinity, ease: "easeInOut" }}
              style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
            >
              <ChaosCard item={item} calm={false} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-[14%] z-10 flex justify-center gap-2"
          style={{ opacity: calm }}
        >
          {ORDERED.map((o) => (
            <span
              key={o.label}
              className="rounded-full border px-3 py-1.5 text-[11px] font-extrabold lg:px-4 lg:py-2 lg:text-xs"
              style={{
                borderColor: EM.line,
                background: "rgba(13,20,36,0.85)",
                color: o.tone,
              }}
            >
              {o.label}
            </span>
          ))}
        </motion.div>

        <motion.div
          className="relative z-20 mx-auto w-full max-w-5xl px-6 pb-16 pt-24 text-center"
          style={{ y: reduce ? 0 : titleY }}
        >
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.55, ease: easeOutExpo }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-bold"
            style={{
              borderColor: EM.line,
              background: "rgba(255,255,255,0.04)",
              color: EM.textMuted,
            }}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: EM.orange }} />
            منصة المدرّس اللي بتفهم ضغط اليوم
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.65, ease: easeOutExpo }}
            className="mx-auto max-w-4xl text-[clamp(2rem,5vw,4.1rem)] font-black leading-[1.15] tracking-tight text-white"
          >
            أنت مدرّس..
            <br />
            <span style={{ color: EM.blue }}>مش موظف في عشر وظايف.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.55, ease: easeOutExpo }}
            className="mx-auto mt-6 max-w-2xl text-base font-medium leading-relaxed md:text-lg"
            style={{ color: EM.textMuted }}
          >
            الرسائل، الامتحانات، الدفع، الغياب، أولياء الأمور… كلها بتسحب من وقتك.
            <br />
            إحنا بنحوّل الفوضى دي لنظام يسيبك تشرح — وإحنا ندير الباقي.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45, duration: 0.7, ease: easeOutExpo }}
            className="relative mx-auto mt-10 flex h-32 w-32 items-center justify-center"
          >
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ background: `radial-gradient(circle, ${EM.blue}55, transparent 70%)` }}
              animate={reduce ? undefined : { scale: [1, 1.18, 1], opacity: [0.45, 0.85, 0.45] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <div
              className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 shadow-2xl md:h-24 md:w-24"
              style={{ borderColor: EM.blue, background: EM.bgElevated }}
            >
              <span className="text-sm font-black tracking-tight" style={{ color: EM.blue }}>
                أنت
              </span>
            </div>
            <motion.span
              className="absolute -bottom-1 rounded-full px-2.5 py-1 text-xs font-extrabold text-white"
              style={{ background: EM.orange }}
              animate={reduce ? undefined : { y: [0, -3, 0] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            >
              أنت هنا
            </motion.span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52, duration: 0.55, ease: easeOutExpo }}
            className="mt-10 flex flex-row items-center justify-center gap-4"
          >
            <a
              href="#day-after"
              className="inline-flex min-h-[48px] min-w-[200px] items-center justify-center rounded-full px-7 py-3.5 text-base font-extrabold text-white shadow-lg shadow-blue-500/25 transition hover:brightness-110"
              style={{ background: EM.blue }}
            >
              خلّيني أشوف الحل
            </a>
            <a
              href="#problems"
              className="inline-flex min-h-[48px] min-w-[220px] items-center justify-center rounded-full border px-7 py-3.5 text-base font-extrabold transition hover:bg-white/5"
              style={{ borderColor: EM.lineStrong, color: EM.text, background: EM.bgCard }}
            >
              اكتشف المشاكل اللي بنحلها
            </a>
          </motion.div>

          <p className="mt-12 text-xs font-semibold tracking-wide" style={{ color: EM.textSoft }}>
            انزل بالسكرول… وشوف الفوضى بتتحول لنظام
          </p>
        </motion.div>
      </div>
    </section>
  );
}
