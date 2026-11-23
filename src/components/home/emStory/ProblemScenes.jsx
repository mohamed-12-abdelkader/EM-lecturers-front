import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useInView,
} from "framer-motion";
import { EM, emFont, easeOutExpo } from "./theme";

function useStateProgress(motionValue) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const unsub = motionValue.on("change", (v) => setP(v));
    setP(motionValue.get());
    return unsub;
  }, [motionValue]);
  return [p, setP];
}

function SceneShell({ id, children, alt = false }) {
  return (
    <section
      id={id}
      className="relative overflow-x-clip py-12 sm:py-20 md:py-28"
      style={{
        ...emFont,
        background: alt ? EM.bgElevated : EM.bg,
        color: EM.text,
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

function SceneHeader({ kicker, title, sub }) {
  return (
    <div className="mb-8 max-w-3xl sm:mb-12 md:mb-16">
      <p
        className="mb-2 text-[11px] font-extrabold tracking-widest sm:mb-3 sm:text-sm"
        style={{ color: EM.orange }}
      >
        {kicker}
      </p>
      <h2 className="text-[clamp(1.45rem,4.5vw,2.85rem)] font-black leading-tight text-white">
        {title}
      </h2>
      {sub && (
        <p
          className="mt-3 text-sm font-medium leading-relaxed sm:mt-4 sm:text-base md:text-lg"
          style={{ color: EM.textMuted }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function MorphLabel({ progress, before, after }) {
  const showAfter = progress > 0.45;
  return (
    <div className="mb-5 flex items-center gap-2 sm:mb-6 sm:gap-3">
      <span
        className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold transition-all duration-500 sm:px-3 sm:text-[11px]"
        style={{
          background: showAfter ? EM.blueSoft : "rgba(239,68,68,0.15)",
          color: showAfter ? "#93C5FD" : "#FCA5A5",
          border: `1px solid ${showAfter ? "rgba(59,130,246,0.35)" : "rgba(239,68,68,0.3)"}`,
        }}
      >
        {showAfter ? after : before}
      </span>
      <div className="h-1 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full rounded-full transition-[width] duration-150"
          style={{
            width: `${Math.min(100, Math.max(0, progress * 100))}%`,
            background: `linear-gradient(90deg, ${EM.orange}, ${EM.blue})`,
          }}
        />
      </div>
    </div>
  );
}

/* ——— Problem 1: Everything on the teacher ——— */
function ProblemOverload() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 70%", "end 40%"],
  });
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const tasks = [
    "شرح",
    "ردود واتساب",
    "مدفوعات",
    "غياب",
    "امتحانات",
    "فيديوهات",
    "أولياء أمور",
    "محتوى",
  ];

  return (
    <SceneShell id="problem-overload">
      <div ref={ref}>
        <SceneHeader
          kicker="المشكلة ١"
          title="المدرّس بقى مسؤول عن كل حاجة"
          sub="تشرح، ترد، تراجع فلوس، تتابع غياب، تنظّم امتحانات، ترفع فيديوهات… يومك بيتفتت بين عشرات المهام."
        />
        <MorphProgress progressMotion={progress}>
          {(p) => {
            const organized = p > 0.55;
            return (
              <>
                <MorphLabel progress={p} before="يوم مشتت" after="لوحة واحدة" />

                {/* Mobile: simple wrap — no clipped absolute orbit */}
                <div
                  className="rounded-2xl border p-4 sm:hidden"
                  style={{ borderColor: EM.line, background: EM.bgCard }}
                >
                  <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2"
                    style={{ borderColor: EM.blue, background: EM.bgElevated }}
                  >
                    <span className="text-[10px] font-black" style={{ color: EM.blue }}>
                      المدرّس
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {tasks.map((t, i) => (
                      <span
                        key={t}
                        className="rounded-full border px-2.5 py-1.5 text-[11px] font-extrabold"
                        style={{
                          background: organized ? EM.bgElevated : i % 2 ? EM.orangeSoft : EM.blueSoft,
                          borderColor: organized ? EM.line : i % 2 ? "rgba(249,115,22,0.4)" : "rgba(59,130,246,0.4)",
                          color: EM.text,
                          opacity: organized && i > 3 ? 0.55 : 1,
                        }}
                      >
                        {organized && i === 0 ? "داشبورد موحّد" : t}
                      </span>
                    ))}
                  </div>
                  {organized && (
                    <p className="mt-4 text-center text-xs font-bold" style={{ color: "#93C5FD" }}>
                      ركّز في التدريس… والإدارة كلها في مكان واحد.
                    </p>
                  )}
                </div>

                {/* sm+: orbital scene */}
                <div
                  className="relative hidden min-h-[340px] overflow-hidden rounded-[28px] border p-8 md:min-h-[380px] md:p-10 sm:block"
                  style={{ borderColor: EM.line, background: EM.bgCard }}
                >
                  <div
                    className="absolute left-1/2 top-1/2 z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 shadow-xl md:h-24 md:w-24"
                    style={{ borderColor: EM.blue, background: EM.bgElevated }}
                  >
                    <span className="text-xs font-black md:text-sm" style={{ color: EM.blue }}>
                      المدرّس
                    </span>
                  </div>
                  {tasks.map((t, i) => {
                    const angle = (i / tasks.length) * Math.PI * 2 - Math.PI / 2;
                    const chaosR = reduce ? 0 : 118 + (i % 3) * 16;
                    const blend = Math.min(1, Math.max(0, (p - 0.35) / 0.4));
                    const r = chaosR * (1 - blend);
                    const tx = organized ? ((i % 4) - 1.5) * 92 : Math.cos(angle) * r;
                    const ty = organized ? Math.floor(i / 4) * 58 - 36 : Math.sin(angle) * r;
                    return (
                      <motion.div
                        key={t}
                        className="absolute left-1/2 top-1/2 z-[5]"
                        animate={{ x: tx, y: ty }}
                        transition={{ type: "spring", stiffness: 70, damping: 16 }}
                      >
                        <span
                          className="-translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-extrabold md:text-xs"
                          style={{
                            display: "inline-block",
                            background: organized ? EM.bgElevated : i % 2 ? EM.orangeSoft : EM.blueSoft,
                            borderColor: organized ? EM.line : i % 2 ? "rgba(249,115,22,0.4)" : "rgba(59,130,246,0.4)",
                            color: organized ? EM.textMuted : EM.text,
                          }}
                        >
                          {organized && i === 0 ? "داشبورد موحّد" : t}
                        </span>
                      </motion.div>
                    );
                  })}
                  {p > 0.6 && (
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-6 left-0 right-0 text-center text-sm font-bold md:text-base"
                      style={{ color: "#93C5FD" }}
                    >
                      ركّز في التدريس… والإدارة كلها في مكان واحد.
                    </motion.p>
                  )}
                </div>
              </>
            );
          }}
        </MorphProgress>
      </div>
    </SceneShell>
  );
}

function MorphProgress({ progressMotion, children }) {
  const [p] = useStateProgress(progressMotion);
  return children(p);
}

/* ——— Problem 2: WhatsApp chaos ——— */
function ProblemWhatsApp() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.35 });
  const messages = [
    { from: "طالب", text: "الامتحان امتى يا مستر؟", unread: true },
    { from: "ولي أمر", text: "مستوى ابني إيه الأسبوع ده؟", unread: true },
    { from: "طالب", text: "ابعت لينك المحاضرة تاني", unread: true },
    { from: "مجموعة أ", text: "١٢ رسالة بدون رد", unread: true },
    { from: "طالب", text: "دفعت الاشتراك… وصلت؟", unread: true },
  ];
  const solved = [
    { from: "نظام ذكي", text: "تم إرسال موعد الامتحان لكل المجموعة", ok: true },
    { from: "تقرير ولي أمر", text: "مستوى أحمد: جيد — يحتاج مراجعة الجبر", ok: true },
    { from: "مكتبة الملفات", text: "المحاضرة متاحة للطالب تلقائيًا", ok: true },
    { from: "إشعار دفع", text: "تم تأكيد الاشتراك وإرسال الإيصال", ok: true },
  ];

  return (
    <SceneShell id="problem-whatsapp" alt>
      <div ref={ref}>
        <SceneHeader
          kicker="المشكلة ٢"
          title="واتساب بقى مكتب استقبال مفتوح ٢٤ ساعة"
          sub="طالب بيسأل عن الامتحان، تاني عايز المحاضرة، ولي أمر عن المستوى، وفلوس الاشتراك… الرسائل ما بتخلصش."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-extrabold text-white/90">قبل EM</span>
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white"
                style={{ background: EM.orange }}
              >
                {inView ? "٤٧ غير مقروءة" : "…"}
              </span>
            </div>
            <div className="space-y-3">
              {messages.map((m, i) => (
                <motion.div
                  key={m.text}
                  initial={{ opacity: 0, x: 24 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.1 * i, duration: 0.45, ease: easeOutExpo }}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3"
                >
                  <p className="text-[11px] font-bold" style={{ color: EM.orange }}>
                    {m.from}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white/85">{m.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-[24px] border p-4 sm:p-6" style={{ borderColor: `${EM.blue}55`, background: `${EM.blue}14` }}>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-extrabold text-white/90">بعد EM</span>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-extrabold text-emerald-300">
                تواصل منظم
              </span>
            </div>
            <div className="space-y-3">
              {solved.map((m, i) => (
                <motion.div
                  key={m.text}
                  initial={{ opacity: 0, x: -24 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.15 + 0.12 * i, duration: 0.45, ease: easeOutExpo }}
                  className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3"
                >
                  <p className="text-[11px] font-bold" style={{ color: EM.blue }}>
                    {m.from}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white/90">{m.text}</p>
                </motion.div>
              ))}
            </div>
            <p className="mt-5 text-sm font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>
              واتساب ذكي · متابعة طلاب · تقارير · إشعارات — من غير ما تغرق في الشات.
            </p>
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

/* ——— Problem 3: Exams ——— */
function ProblemExams() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 35%"],
  });
  const [p] = useStateProgress(scrollYProgress);
  const stage =
    p < 0.25 ? 0 : p < 0.45 ? 1 : p < 0.65 ? 2 : p < 0.82 ? 3 : 4;
  const stages = [
    { title: "أوراق متراكمة", desc: "إعداد · تجميع · تنسيق · تصحيح يدوي" },
    { title: "بنك أسئلة", desc: "أسئلتك منظمة وقابلة لإعادة الاستخدام" },
    { title: "امتحان جاهز", desc: "إنشاء سريع… وحتى بمساعدة الذكاء الاصطناعي" },
    { title: "تصحيح ذكي", desc: "نتائج فورية بدل ساعات التصحيح" },
    { title: "تحليل المستوى", desc: "نقاط ضعف واضحة… وقرارات أسرع" },
  ];

  return (
    <SceneShell id="problem-exams">
      <div ref={ref}>
        <SceneHeader
          kicker="المشكلة ٣"
          title="الامتحانات بتأكل من وقتك أكتر من الشرح"
          sub="من كتابة الأسئلة لحد تحليل النتائج — رحلة طويلة. خلّيها مشهد واحد يتحوّل قدامك."
        />
        <MorphLabel
          progress={p}
          before="ورقة وقلم وضغط"
          after="رحلة امتحان احترافية"
        />
        <div
          className="relative overflow-hidden rounded-[28px] border p-6 sm:p-10"
          style={{
            borderColor: EM.line,
            background: stage >= 4
              ? `linear-gradient(145deg, ${EM.blueSoft}, ${EM.bgElevated})`
              : EM.bgCard,
          }}
        >
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
            {stages.map((s, i) => (
              <span
                key={s.title}
                className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-extrabold transition-all duration-300"
                style={{
                  background: i === stage ? EM.blue : EM.bgElevated,
                  color: i === stage ? EM.white : EM.textMuted,
                  border: `1px solid ${i === stage ? EM.blue : EM.line}`,
                }}
              >
                {s.title}
              </span>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative min-h-[220px]">
              {stage === 0 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, rotate: -4 }}
                      animate={{ opacity: 1, rotate: (i % 3) - 1 }}
                      className="h-20 rounded-xl border sm:h-24"
                      style={{ borderColor: EM.line, background: EM.bgElevated }}
                    >
                      <div className="m-3 h-2 w-2/3 rounded" style={{ background: "rgba(255,255,255,0.12)" }} />
                      <div className="mx-3 h-2 w-1/2 rounded" style={{ background: "rgba(255,255,255,0.08)" }} />
                      <div className="mx-3 mt-2 h-2 w-3/4 rounded" style={{ background: "rgba(255,255,255,0.08)" }} />
                    </motion.div>
                  ))}
                </div>
              )}
              {stage === 1 && (
                <div className="space-y-3">
                  {["جبر — اختيار من متعدد", "هندسة — مقالي", "تفاضل — صح/خطأ", "إحصاء — مسائل"].map(
                    (q) => (
                      <div
                        key={q}
                        className="flex items-center justify-between rounded-2xl border px-3 py-2.5 sm:px-4 sm:py-3"
                        style={{ borderColor: EM.line, background: EM.bgElevated }}
                      >
                        <span className="text-xs font-bold sm:text-sm" style={{ color: EM.text }}>
                          {q}
                        </span>
                        <span className="text-[11px] font-extrabold" style={{ color: EM.blue }}>
                          في البنك
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
              {stage >= 2 && stage < 4 && (
                <div
                  className="rounded-2xl border p-4 sm:p-5"
                  style={{ borderColor: EM.line, background: EM.bgElevated }}
                >
                  <p className="text-xs font-extrabold" style={{ color: EM.orange }}>
                    امتحان الوحدة ٣
                  </p>
                  <h3 className="mt-2 text-lg font-black text-white sm:text-xl">
                    جاهز للنشر للطلاب
                  </h3>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    {["٢٥ سؤال", "٤٥ دقيقة", "تصحيح تلقائي"].map((x) => (
                      <div key={x} className="rounded-xl py-3 text-xs font-extrabold" style={{ color: EM.textMuted, background: "rgba(255,255,255,0.05)" }}>
                        {x}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {stage >= 4 && (
                <div className="space-y-4">
                  {[
                    { label: "متوسط المجموعة", value: "٧٨٪", tone: EM.blue },
                    { label: "أضعف جزئية", value: "التكامل", tone: EM.orange },
                    { label: "طلاب محتاجين متابعة", value: "٦", tone: "#DC2626" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between rounded-2xl border px-4 py-3 sm:px-5 sm:py-4"
                      style={{ borderColor: EM.line, background: EM.bgElevated }}
                    >
                      <span className="text-sm font-bold" style={{ color: EM.slate }}>
                        {row.label}
                      </span>
                      <span className="text-lg font-black" style={{ color: row.tone }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-xl font-black text-white sm:text-2xl md:text-3xl">
                {stages[stage].title}
              </h3>
              <p className="mt-3 text-base font-medium leading-relaxed" style={{ color: EM.slate }}>
                {stages[stage].desc}
              </p>
              <p className="mt-6 text-sm font-bold" style={{ color: EM.blue }}>
                مش قائمة مزايا — دي رحلة الامتحان من ورقة لقرار.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

/* ——— Problem 4: Student insights ——— */
function ProblemInsights() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.4 });
  const dots = Array.from({ length: 48 }).map((_, i) => ({
    id: i,
    x: (i % 8) * 12 + 4,
    y: Math.floor(i / 8) * 14 + 8,
    alert: [3, 11, 17, 22, 30, 41].includes(i),
  }));

  return (
    <SceneShell id="problem-insights">
      <div ref={ref}>
        <SceneHeader
          kicker="المشكلة ٤"
          title="مئات الطلاب… ومستوى كل واحد ضايع في الزحمة"
          sub="مين بيتراجع؟ مين مش بيحل؟ مين محتاج تدخل؟ البيانات موجودة — بس مش بتتحول لقرارات."
        />
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div
            className="relative aspect-[4/3] overflow-hidden rounded-[28px] border p-6"
            style={{ borderColor: EM.line, background: EM.bgCard }}
          >
            <p className="mb-4 text-xs font-extrabold" style={{ color: EM.slate }}>
              {inView ? "من ضباب بيانات → لرؤى واضحة" : "بيانات الطلاب"}
            </p>
            <svg viewBox="0 0 100 90" className="h-full w-full">
              {dots.map((d) => (
                <motion.circle
                  key={d.id}
                  cx={d.x}
                  cy={d.y}
                  r={inView && d.alert ? 2.8 : 1.6}
                  fill={inView && d.alert ? EM.orange : inView ? EM.blue : "#CBD5E1"}
                  initial={{ opacity: 0.35 }}
                  animate={{ opacity: inView ? 1 : 0.4 }}
                  transition={{ delay: d.id * 0.01 }}
                />
              ))}
            </svg>
          </div>
          <div className="space-y-4">
            {[
              { t: "طالب محتاج مراجعة", d: "انخفاض مستمر في آخر ٣ امتحانات", c: EM.orange },
              { t: "مجموعة ضعيفة في جزئية", d: "التكامل — متوسط ٤٢٪", c: EM.blue },
              { t: "توقف عن التفاعل", d: "ما فتحش محاضرة من أسبوعين", c: "#DC2626" },
              { t: "نقاط ضعف متكررة", d: "نفس الأخطاء عبر ٥ مجموعات", c: EM.navyMid },
            ].map((item, i) => (
              <motion.div
                key={item.t}
                initial={{ opacity: 0, x: 20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.15 * i, ease: easeOutExpo }}
                className="rounded-2xl border p-3 sm:p-4"
                style={{ borderColor: EM.line, borderRightWidth: 4, borderRightColor: item.c, background: EM.bgCard }}
              >
                <p className="text-sm font-extrabold text-white">
                  {item.t}
                </p>
                <p className="mt-1 text-xs font-semibold" style={{ color: EM.slate }}>
                  {item.d}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

/* ——— Problem 5: Brand ——— */
function ProblemBrand() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.35 });

  return (
    <SceneShell id="problem-brand" alt>
      <div ref={ref}>
        <SceneHeader
          kicker="المشكلة ٥"
          title="شغلك كبير… وبراندك لسه على فيسبوك وواتساب"
          sub="مفيش تجربة باسمك، ولا منصة تحمل هويتك. الطلاب بيدوروا عليك وسط أدوات عامة."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            animate={inView ? { opacity: 0.55, scale: 0.96 } : {}}
            className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6"
          >
            <p className="text-xs font-extrabold text-white/50">قبل</p>
            <div className="mt-4 space-y-3">
              {["صفحة فيسبوك عامة", "جروب واتساب", "لينكات متفرقة", "مفيش هوية موحّدة"].map((x) => (
                <div key={x} className="rounded-xl border border-dashed border-white/15 px-4 py-3 text-sm font-bold text-white/60">
                  {x}
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: easeOutExpo }}
            className="rounded-[24px] border p-6"
            style={{ borderColor: `${EM.orange}66`, background: `linear-gradient(160deg, ${EM.blue}22, ${EM.orange}18)` }}
          >
            <p className="text-xs font-extrabold" style={{ color: EM.orange }}>
              بعد EM
            </p>
            <h3 className="mt-3 text-2xl font-black text-white sm:text-3xl">
              منصتك أنت.
            </h3>
            <p className="mt-2 text-sm font-medium text-white/70">
              اسمك · ألوانك · محتواك · طلابك · كورساتك — تحت سقف واحد يحمل براندك.
            </p>
            <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-black text-white" style={{ background: EM.blue }}>
                  م
                </div>
                <div>
                  <p className="text-sm font-extrabold text-white">منصة المستر — مثال</p>
                  <p className="text-[11px] font-semibold text-white/55">yourname.emlectures.com</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {["كورسات", "امتحانات", "طلاب"].map((t) => (
                  <div key={t} className="rounded-lg bg-white/10 py-3 text-center text-[11px] font-extrabold text-white/85">
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-5 text-sm font-extrabold text-white">
              مش مجرد منصة بتستخدمها.. دي منصتك أنت.
            </p>
          </motion.div>
        </div>
      </div>
    </SceneShell>
  );
}

/* ——— Problem 6: Money ——— */
function ProblemMoney() {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.4 });

  return (
    <SceneShell id="problem-money">
      <div ref={ref}>
        <SceneHeader
          kicker="المشكلة ٦"
          title="الفلوس في الدفاتر… والمعلومات ناقصة"
          sub="مين دفع؟ مين عليه باقي؟ مين خلص اشتراكه؟ الإيراد والمصروف — من غير ما تلف على إكسل وواتساب."
        />
        <div
          className="overflow-hidden rounded-[28px] border p-6 sm:p-8"
          style={{ borderColor: EM.line, background: EM.bgCard }}
        >
          <div className="mb-6 flex flex-wrap gap-2">
            {["فواتير متفرقة", "أقساط", "اشتراكات", "متابعات يدوية"].map((x, i) => (
              <motion.span
                key={x}
                animate={inView ? { opacity: 0.35, y: -6 } : {}}
                transition={{ delay: i * 0.08 }}
                className="rounded-full border px-3 py-1.5 text-[11px] font-bold"
                style={{ borderColor: EM.line, color: EM.textMuted, background: EM.bgElevated }}
              >
                {x}
              </motion.span>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.25, duration: 0.55, ease: easeOutExpo }}
            className="grid gap-4 sm:grid-cols-3"
          >
            {[
              { l: "محصّل اليوم", v: "—", hint: "نظرة لحظية", c: EM.blue },
              { l: "أقساط معلّقة", v: "—", hint: "متابعة أوضح", c: EM.orange },
              { l: "اشتراكات تنتهي", v: "—", hint: "تنبيه قبل الانتهاء", c: EM.navyMid },
            ].map((card) => (
              <div
                key={card.l}
                className="rounded-2xl border p-4 sm:p-5"
                style={{ borderColor: EM.line, background: EM.bgElevated }}
              >
                <p className="text-xs font-bold" style={{ color: EM.slate }}>
                  {card.l}
                </p>
                <p className="mt-2 text-3xl font-black" style={{ color: card.c }}>
                  {card.v}
                </p>
                <p className="mt-2 text-[11px] font-semibold" style={{ color: EM.slateSoft }}>
                  {card.hint}
                </p>
              </div>
            ))}
          </motion.div>
          <p className="mt-6 text-center text-sm font-bold" style={{ color: EM.blue }}>
            من فوضى الأرقام → لوحة مالية تفهمها في نظرة.
          </p>
        </div>
      </div>
    </SceneShell>
  );
}

/* ——— Problem 7: Growth ——— */
function ProblemGrowth() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 70%", "end 40%"],
  });
  const [p] = useStateProgress(scrollYProgress);
  const students = Math.round(12 + p * 180);
  const chaos = Math.max(0, Math.min(1, (p - 0.15) / 0.35));
  const calm = Math.max(0, Math.min(1, (p - 0.55) / 0.35));

  return (
    <SceneShell id="problem-growth">
      <div ref={ref}>
        <SceneHeader
          kicker="المشكلة ٧"
          title="كل ما الطلاب يزيدوا… الفوضى تزيد معاهم"
          sub="نمو الشغل المفروض يفرّحك — مش يحمّلك موظفين وضغط ورسائل أكتر."
        />
        <div
          className="relative overflow-hidden rounded-2xl border p-4 sm:rounded-[28px] sm:p-6 md:p-10"
          style={{ borderColor: EM.line, background: EM.bgElevated }}
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold" style={{ color: EM.orange }}>
                نمو المدرّس
              </p>
              <p className="mt-2 text-4xl font-black text-white sm:text-5xl md:text-6xl">
                {students}
                <span className="ms-2 text-base font-bold text-white/50 sm:text-lg">طالب</span>
              </p>
            </div>
            <div className="text-end">
              <p className="text-xs font-bold text-white/50">مستوى الفوضى</p>
              <p
                className="mt-1 text-2xl font-black"
                style={{
                  color: calm > 0.4 ? "#34D399" : `rgba(249,115,22,${0.4 + chaos * 0.6})`,
                }}
              >
                {calm > 0.4 ? "تحت السيطرة" : chaos > 0.5 ? "مرتفعة" : "تتصاعد"}
              </p>
            </div>
          </div>

          <div className="relative mt-10 h-28">
            {Array.from({ length: 28 }).map((_, i) => {
              const left = (i / 27) * 100;
              const h = 20 + ((i * 17) % 60) * (0.3 + chaos * 0.7) * (1 - calm * 0.85);
              return (
                <span
                  key={i}
                  className="absolute bottom-0 w-[2.5%] rounded-t-sm"
                  style={{
                    left: `${left}%`,
                    height: `${h}%`,
                    background:
                      calm > 0.5
                        ? EM.blue
                        : i % 3 === 0
                          ? EM.orange
                          : "rgba(255,255,255,0.25)",
                    opacity: 0.35 + (i / 28) * 0.65,
                  }}
                />
              );
            })}
          </div>

          <p className="mt-8 max-w-xl text-base font-bold text-white/85 sm:text-lg">
            {calm > 0.45
              ? "زيادة الطلاب مبقتش تعني زيادة الفوضى — النظام بيتحمّل التوسع."
              : "من غير نظام، كل طالب جديد = رسالة وورقة ومتابعة زيادة."}
          </p>
        </div>
      </div>
    </SceneShell>
  );
}

export default function ProblemScenes() {
  return (
    <div id="problems">
      <div className="border-y px-4 py-10 text-center sm:py-16" style={{ ...emFont, borderColor: EM.line, background: EM.bgElevated }}>
        <p className="text-[11px] font-extrabold tracking-widest sm:text-xs" style={{ color: EM.orange }}>
          الرحلة
        </p>
        <h2
          className="mx-auto mt-3 max-w-3xl text-[clamp(1.3rem,5vw,2.6rem)] font-black leading-tight text-white"
        >
          مش هنعرضلك أدوات.
          <br />
          <span style={{ color: EM.blue }}>هنعدّي معاك على مشاكلك… ونحوّلها.</span>
        </h2>
      </div>
      <ProblemOverload />
      <ProblemWhatsApp />
      <ProblemExams />
      <ProblemInsights />
      <ProblemBrand />
      <ProblemMoney />
      <ProblemGrowth />
    </div>
  );
}
