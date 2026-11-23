import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EM, emFont, easeOutExpo } from "./theme";

const NODES = [
  {
    id: "students",
    label: "الطلاب",
    angle: -20,
    mock: {
      title: "إدارة الطلاب",
      lines: ["مجموعات منظمة", "حضور وغياب", "متابعة فردية"],
    },
  },
  {
    id: "lectures",
    label: "المحاضرات",
    angle: 25,
    mock: {
      title: "المحتوى",
      lines: ["رفع وتنظيم", "إشعارات تلقائية", "مشاهدة وتتبع"],
    },
  },
  {
    id: "exams",
    label: "الامتحانات",
    angle: 70,
    mock: {
      title: "نظام الامتحانات",
      lines: ["بنك أسئلة", "تصحيح", "تحليل نتائج"],
    },
  },
  {
    id: "finance",
    label: "المالية",
    angle: 115,
    mock: {
      title: "الاشتراكات والمدفوعات",
      lines: ["أقساط", "إيصالات", "تنبيهات التجديد"],
    },
  },
  {
    id: "comms",
    label: "التواصل",
    angle: 160,
    mock: {
      title: "تواصل ذكي",
      lines: ["واتساب منظم", "إشعارات", "تقارير أولياء"],
    },
  },
  {
    id: "ai",
    label: "الذكاء الاصطناعي",
    angle: 205,
    mock: {
      title: "مساعد المدرّس",
      lines: ["إنشاء أسئلة", "تلخيص", "اقتراحات متابعة"],
    },
  },
  {
    id: "analytics",
    label: "التحليلات",
    angle: 250,
    mock: {
      title: "رؤى القرار",
      lines: ["مستويات", "ضعف مشترك", "تقدّم المجموعة"],
    },
  },
  {
    id: "brand",
    label: "منصتك",
    angle: 295,
    mock: {
      title: "براند المدرّس",
      lines: ["دومين خاص", "هويتك البصرية", "تجربة باسمك"],
    },
  },
];

export default function EcosystemDemo() {
  const [active, setActive] = useState(NODES[0].id);
  const current = NODES.find((n) => n.id === active) || NODES[0];

  return (
    <section
      id="ecosystem"
      className="relative overflow-x-clip py-12 sm:py-20 md:py-28 lg:py-32"
      style={{ ...emFont, background: EM.bg }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(circle at 30% 40%, rgba(59,130,246,0.28), transparent 45%), radial-gradient(circle at 70% 60%, rgba(249,115,22,0.14), transparent 40%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-extrabold tracking-widest sm:text-xs" style={{ color: EM.orange }}>
            المنصة
          </p>
          <h2 className="mt-3 text-[clamp(1.4rem,4.5vw,2.8rem)] font-black leading-tight text-white">
            منصة واحدة.
            <br />
            <span style={{ color: "#93C5FD" }}>كل تفاصيلك تحت سيطرتك.</span>
          </h2>
          <p className="mt-3 text-sm font-medium sm:mt-4 sm:text-base" style={{ color: EM.textMuted }}>
            اختَر أي جزء من النظام وشوف قيمته — من غير قوائم مزايا مملة.
          </p>
        </div>

        {/* Mobile / tablet chips */}
        <div className="mt-8 flex flex-wrap justify-center gap-2 lg:hidden">
          {NODES.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => setActive(n.id)}
              className="min-h-[40px] rounded-full border px-3 py-2 text-[11px] font-extrabold"
              style={{
                background: active === n.id ? EM.blue : EM.bgCard,
                borderColor: active === n.id ? EM.blue : EM.line,
                color: EM.white,
              }}
            >
              {n.label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid items-center gap-8 lg:mt-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          {/* Orbit — desktop / large */}
          <div className="relative mx-auto hidden aspect-square w-full max-w-[420px] md:block lg:max-w-[480px]">
            <div
              className="absolute inset-[18%] rounded-full border border-dashed border-white/15"
              aria-hidden
            />
            <div
              className="absolute inset-[32%] rounded-full border border-white/10"
              aria-hidden
            />
            <button
              type="button"
              className="absolute left-1/2 top-1/2 z-10 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 text-center shadow-2xl sm:h-28 sm:w-28 lg:h-32 lg:w-32"
              style={{ borderColor: EM.blue, background: "rgba(7,11,20,0.92)" }}
              onClick={() => setActive(NODES[0].id)}
            >
              <span className="text-[10px] font-bold text-white/50">مركز</span>
              <span className="mt-1 text-sm font-black text-white sm:text-base">EM</span>
              <span className="text-[10px] font-extrabold" style={{ color: EM.orange }}>
                Lectures
              </span>
            </button>

            {NODES.map((node) => {
              const rad = (node.angle * Math.PI) / 180;
              const r = 42;
              const x = 50 + r * Math.cos(rad);
              const y = 50 + r * Math.sin(rad);
              const on = active === node.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setActive(node.id)}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border px-2.5 py-1.5 text-[10px] font-extrabold shadow-lg transition sm:px-3 sm:py-2 sm:text-xs"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    background: on ? EM.blue : "rgba(255,255,255,0.08)",
                    borderColor: on ? EM.blue : "rgba(255,255,255,0.18)",
                    color: EM.white,
                    boxShadow: on ? `0 0 0 6px ${EM.blue}33` : undefined,
                  }}
                >
                  {node.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: easeOutExpo }}
              className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur sm:rounded-[28px] sm:p-6 md:p-8"
            >
              <p className="text-xs font-extrabold" style={{ color: EM.orange }}>
                لقطة من النظام
              </p>
              <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">{current.mock.title}</h3>
              <div className="mt-5 space-y-2.5 sm:mt-6 sm:space-y-3">
                {current.mock.lines.map((line) => (
                  <div
                    key={line}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2.5 sm:px-4 sm:py-3"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: EM.blue }} />
                    <span className="text-sm font-bold text-white/85">{line}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-3 sm:mt-6 sm:p-4">
                <div className="mb-3 flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-2/3 rounded bg-white/10" />
                  <div className="h-3 w-1/2 rounded bg-white/10" />
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="h-12 rounded-lg sm:h-14" style={{ background: `${EM.blue}33` }} />
                    <div className="h-12 rounded-lg sm:h-14" style={{ background: `${EM.orange}28` }} />
                    <div className="h-12 rounded-lg bg-white/5 sm:h-14" />
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
