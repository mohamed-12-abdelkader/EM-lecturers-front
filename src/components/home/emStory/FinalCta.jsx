import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { EM, emFont, easeOutExpo } from "./theme";

export default function FinalCta() {
  const reduce = useReducedMotion();

  return (
    <section
      id="start"
      className="relative overflow-x-clip py-12 sm:py-20 md:py-28 lg:py-32"
      style={{ ...emFont, background: EM.bg }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 100%, rgba(59,130,246,0.22), transparent 60%), radial-gradient(ellipse 40% 40% at 80% 20%, rgba(249,115,22,0.12), transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: easeOutExpo }}
          className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center sm:mb-10 sm:h-28 sm:w-28"
        >
          <motion.span
            className="absolute h-24 w-24 rounded-full sm:h-28 sm:w-28"
            style={{ background: `radial-gradient(circle, ${EM.blue}55, transparent 70%)` }}
            animate={reduce ? undefined : { scale: [1, 1.2, 1], opacity: [0.45, 0.9, 0.45] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <div
            className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 shadow-xl sm:h-20 sm:w-20"
            style={{ borderColor: EM.blue, background: EM.bgElevated }}
          >
            <span className="text-sm font-black" style={{ color: EM.blue }} aria-hidden>
              EM
            </span>
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: easeOutExpo }}
          className="text-[clamp(1.55rem,5.2vw,3.25rem)] font-black leading-tight text-white"
        >
          كبّر شغلك…
          <br />
          <span style={{ color: EM.blue }}>من غير ما تكبّر الفوضى.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5, ease: easeOutExpo }}
          className="mx-auto mt-4 max-w-xl text-sm font-medium sm:mt-5 sm:text-base md:text-lg"
          style={{ color: EM.textMuted }}
        >
          ركّز في اللي بتعرف تعمله — الشرح.
          <br />
          وسيب الإدارة، المتابعة، والامتحانات تشتغل معاك… مش ضدك.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5, ease: easeOutExpo }}
          className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-4"
        >
          <Link
            to="/create-platform"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full px-6 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-blue-500/25 transition hover:brightness-110 sm:px-8 sm:text-base"
            style={{ background: EM.blue }}
          >
            ابدأ رحلتك مع EM Lectures
          </Link>
          <Link
            to="/signup"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full border px-6 py-3.5 text-sm font-extrabold transition hover:bg-white/5 sm:px-8 sm:text-base"
            style={{ borderColor: EM.lineStrong, color: EM.text, background: EM.bgCard }}
          >
            احجز تجربة وشوف بنفسك
          </Link>
        </motion.div>

        <p className="mt-7 text-[11px] font-semibold sm:mt-8 sm:text-xs" style={{ color: EM.textSoft }}>
          التحول بيبدأ من هنا — مش من قائمة مزايا تانية.
        </p>
      </div>
    </section>
  );
}
