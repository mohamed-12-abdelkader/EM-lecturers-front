import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { EM, emFont, easeOutExpo } from "./theme";

const STORY_SLOTS = [
  {
    role: "مدرّس ثانوي",
    quote: "مكانك هنا لقصة حقيقية من مدرّس استخدم EM وغيّر طريقة إدارة يومه.",
    placeholder: true,
  },
  {
    role: "مدرّسة مركز",
    quote: "هنضيف هنا تجربة حقيقية عن تنظيم الامتحانات والمتابعة بدون ضغط واتساب.",
    placeholder: true,
  },
  {
    role: "مؤسسة تعليمية",
    quote: "مساحة لشهادة عن نمو عدد الطلاب مع الحفاظ على جودة المتابعة.",
    placeholder: true,
  },
];

const METRIC_SLOTS = [
  { label: "مدرّسين على المنصة", hint: "يُحدَّث من البيانات الفعلية" },
  { label: "طلاب يتابعون", hint: "يُحدَّث من البيانات الفعلية" },
  { label: "امتحانات أُنشئت", hint: "يُحدَّث من البيانات الفعلية" },
  { label: "محاضرات منشورة", hint: "يُحدَّث من البيانات الفعلية" },
];

export default function SocialProof() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.2 });

  return (
    <section
      id="proof"
      ref={ref}
      className="relative overflow-x-clip py-12 sm:py-20 md:py-28 lg:py-32"
      style={{ ...emFont, background: EM.bgElevated }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-[11px] font-extrabold tracking-widest sm:text-xs" style={{ color: EM.orange }}>
            إثبات على الأرض
          </p>
          <h2 className="mt-3 text-[clamp(1.4rem,4.5vw,2.7rem)] font-black leading-tight text-white">
            مش فكرة على ورق.
            <br />
            <span style={{ color: EM.blue }}>دي منصة بتحل مشاكل يومية.</span>
          </h2>
          <p className="mt-3 text-sm font-medium sm:mt-4 sm:text-base" style={{ color: EM.textMuted }}>
            الأرقام والشهادات هتظهر من بيانات حقيقية — من غير اختراع ولا مبالغة.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 lg:grid-cols-4">
          {METRIC_SLOTS.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.45, ease: easeOutExpo }}
              className="rounded-2xl border p-3 sm:rounded-[22px] sm:p-5"
              style={{ borderColor: EM.line, background: EM.bgCard }}
            >
              <div
                className="h-8 w-12 rounded-lg sm:h-10 sm:w-16"
                style={{ background: `linear-gradient(135deg, ${EM.blueSoft}, ${EM.orangeSoft})` }}
              />
              <p className="mt-3 text-xl font-black tracking-tight text-white sm:mt-4 sm:text-2xl">—</p>
              <p className="mt-1 text-[11px] font-extrabold sm:text-sm" style={{ color: EM.textMuted }}>
                {m.label}
              </p>
              <p className="mt-1 hidden text-[11px] font-semibold sm:block" style={{ color: EM.textSoft }}>
                {m.hint}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {STORY_SLOTS.map((s, i) => (
            <motion.blockquote
              key={s.role}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.12 + i * 0.1, duration: 0.5, ease: easeOutExpo }}
              className="relative overflow-hidden rounded-2xl border p-5 sm:rounded-[24px] sm:p-6"
              style={{ borderColor: EM.line, background: EM.bgCard }}
            >
              <span
                className="absolute -top-2 right-4 text-6xl font-black leading-none opacity-[0.12]"
                style={{ color: EM.blue }}
                aria-hidden
              >
                "
              </span>
              <p className="relative text-sm font-bold leading-relaxed" style={{ color: EM.textMuted }}>
                {s.quote}
              </p>
              <footer className="mt-5 flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-black text-white"
                  style={{ background: i % 2 ? EM.orange : EM.blue }}
                >
                  —
                </span>
                <div>
                  <p className="text-sm font-extrabold text-white">
                    {s.placeholder ? "شهادة قادمة" : s.role}
                  </p>
                  <p className="text-[11px] font-semibold" style={{ color: EM.textSoft }}>
                    {s.role}
                  </p>
                </div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
