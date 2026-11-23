import { useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { EM, emFont, easeOutExpo } from "./theme";

const MOMENTS = [
  {
    time: "٠٨:٠٠",
    title: "تعرف جدول يومك",
    detail: "الحصص، المواعيد، والتنبيهات المهمة — من غير ما تلف على النوتات.",
    visual: "calendar",
  },
  {
    time: "١٠:٠٠",
    title: "الطلاب بياخدوا المحاضرة",
    detail: "الإشعارات وصلت، المحتوى اتفتح، وإنت مش بتلاحق كل واحد لوحده.",
    visual: "lecture",
  },
  {
    time: "١٢:٠٠",
    title: "الامتحان شغال",
    detail: "الأسئلة جاهزة، الطلاب بيؤدوا، والتصحيح بيحصل في الخلفية.",
    visual: "exam",
  },
  {
    time: "١٤:٠٠",
    title: "النتائج والتحليلات",
    detail: "تشوف المستوى، نقاط الضعف، ومين محتاج تدخل — في نظرة.",
    visual: "analytics",
  },
  {
    time: "١٦:٠٠",
    title: "متابعة اللي محتاج مساعدة",
    detail: "قائمة واضحة بالمتابعات… مش رسالة واتساب تائهة.",
    visual: "follow",
  },
  {
    time: "١٨:٠٠",
    title: "مراجعة الإيراد والاشتراكات",
    detail: "تعرف وضع الفلوس من غير دفتر ولا لخبطة.",
    visual: "money",
  },
];

function MomentVisual({ type }) {
  const box = "rounded-2xl border p-3 sm:p-4";
  const boxStyle = { borderColor: EM.line, background: "rgba(255,255,255,0.04)" };

  if (type === "calendar") {
    return (
      <div className={box} style={boxStyle}>
        <div className="grid grid-cols-3 gap-2">
          {["سبت", "أحد", "إثنين"].map((d) => (
            <div
              key={d}
              className="rounded-xl py-2.5 text-center text-[11px] font-extrabold sm:py-3"
              style={{ color: EM.textMuted, background: "rgba(255,255,255,0.05)" }}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl px-3 py-2 text-xs font-bold text-white" style={{ background: EM.blue }}>
          ١٠ص — مجموعة أ · جبر
        </div>
      </div>
    );
  }
  if (type === "lecture") {
    return (
      <div className={box} style={boxStyle}>
        <div className="aspect-video rounded-xl" style={{ background: "rgba(0,0,0,0.45)" }} />
        <p className="mt-3 text-xs font-extrabold text-white">
          تم إرسال إشعار المحاضرة · ٢٤ طالب فتحوا
        </p>
      </div>
    );
  }
  if (type === "exam") {
    return (
      <div className={box} style={boxStyle}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-extrabold text-white">امتحان جاري</span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold text-white" style={{ background: EM.orange }}>
            مباشر
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-full w-2/3 rounded-full" style={{ background: EM.blue }} />
        </div>
      </div>
    );
  }
  if (type === "analytics") {
    return (
      <div className={box} style={boxStyle}>
        <div className="flex h-16 items-end gap-1.5">
          {[40, 65, 45, 80, 55, 90].map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-t"
              style={{ height: `${h}%`, background: i === 5 ? EM.orange : EM.blue }}
            />
          ))}
        </div>
        <p className="mt-3 text-[11px] font-bold" style={{ color: EM.textMuted }}>
          تقدّم المجموعة خلال الأسبوع
        </p>
      </div>
    );
  }
  if (type === "follow") {
    return (
      <div className={box} style={boxStyle}>
        {["أحمد — يحتاج مراجعة", "سارة — غياب متكرر", "محمود — لم يسلّم"].map((n) => (
          <div
            key={n}
            className="border-b py-2 text-xs font-bold last:border-0"
            style={{ borderColor: EM.line, color: EM.textMuted }}
          >
            {n}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={box} style={boxStyle}>
      <p className="text-[11px] font-bold" style={{ color: EM.textMuted }}>ملخص اليوم</p>
      <p className="mt-2 text-2xl font-black" style={{ color: EM.blue }}>—</p>
      <p className="mt-1 text-[11px] font-semibold" style={{ color: EM.textSoft }}>
        إيراد · أقساط · تجديدات
      </p>
    </div>
  );
}

export default function DayAfterEm() {
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.2 });
  const reduce = useReducedMotion();
  const current = MOMENTS[active];

  return (
    <section
      id="day-after"
      ref={ref}
      className="relative overflow-x-clip py-12 sm:py-20 md:py-28 lg:py-32"
      style={{
        ...emFont,
        background: `radial-gradient(ellipse 70% 50% at 50% 0%, rgba(59,130,246,0.16), transparent 55%), ${EM.bg}`,
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: easeOutExpo }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-[11px] font-extrabold tracking-widest sm:text-xs" style={{ color: EM.orange }}>
            بعد التحول
          </p>
          <h2 className="mt-3 text-[clamp(1.5rem,4.8vw,3rem)] font-black leading-tight text-white">
            تخيّل لو كل ده…
            <br />
            <span style={{ color: EM.blue }}>كان بيتم من غير ما يشغلك.</span>
          </h2>
          <p className="mt-3 text-sm font-medium sm:mt-4 sm:text-base md:text-lg" style={{ color: EM.textMuted }}>
            هدوء. تنظيم. ثقة. إنك بتشرح — والنظام بيشتغل وراك.
          </p>
        </motion.div>

        {/* Mobile horizontal time chips */}
        <div className="mt-8 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:hidden">
          {MOMENTS.map((m, i) => (
            <button
              key={m.time}
              type="button"
              onClick={() => setActive(i)}
              className="shrink-0 rounded-full border px-3 py-2 text-[11px] font-extrabold"
              style={{
                borderColor: i === active ? EM.blue : EM.line,
                background: i === active ? EM.blueSoft : EM.bgCard,
                color: i === active ? "#93C5FD" : EM.textMuted,
              }}
            >
              {m.time}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:mt-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
          <div className="relative hidden lg:block">
            <div
              className="absolute bottom-3 top-3 w-px"
              style={{ right: 19, background: EM.line }}
              aria-hidden
            />
            <div className="space-y-1.5">
              {MOMENTS.map((m, i) => {
                const on = i === active;
                return (
                  <button
                    key={m.time}
                    type="button"
                    onClick={() => setActive(i)}
                    className="relative flex w-full items-start gap-4 rounded-2xl px-3 py-3 text-start transition"
                    style={{ background: on ? EM.blueSoft : "transparent" }}
                  >
                    <span
                      className="relative z-10 mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-black"
                      style={{
                        borderColor: on ? EM.blue : EM.line,
                        background: on ? EM.blue : EM.bgElevated,
                        color: on ? EM.white : EM.textMuted,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span>
                      <span className="block text-[11px] font-extrabold" style={{ color: EM.orange }}>
                        {m.time}
                      </span>
                      <span
                        className="mt-0.5 block text-sm font-extrabold sm:text-base"
                        style={{ color: on ? EM.text : EM.textMuted }}
                      >
                        {m.title}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <motion.div
            key={current.time}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOutExpo }}
            className="rounded-2xl border p-5 sm:rounded-[28px] sm:p-7 md:p-8"
            style={{
              borderColor: EM.line,
              background: `linear-gradient(165deg, ${EM.bgElevated}, rgba(59,130,246,0.08))`,
            }}
          >
            <p className="text-sm font-extrabold" style={{ color: EM.orange }}>
              {current.time}
            </p>
            <h3 className="mt-2 text-xl font-black text-white sm:text-2xl md:text-3xl">
              {current.title}
            </h3>
            <p className="mt-3 text-sm font-medium leading-relaxed sm:text-base" style={{ color: EM.textMuted }}>
              {current.detail}
            </p>
            <div className="mt-6 sm:mt-8">
              <MomentVisual type={current.visual} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
