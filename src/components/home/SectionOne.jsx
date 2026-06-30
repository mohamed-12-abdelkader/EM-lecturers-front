import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiZap } from "react-icons/fi";
import { FaArrowLeft } from "react-icons/fa";
import { BRAND, landingFont } from "./landingTheme.js";
import { DotGrid, MeshGlow } from "./landingDecor.jsx";

const HERO_IMAGE = encodeURI("/ChatGPT Image Jun 24, 2026, 12_15_57 AM.png");

let typingAudioCtx = null;

function playTypingSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!typingAudioCtx) typingAudioCtx = new AudioContextClass();
    const ctx = typingAudioCtx;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(720 + Math.random() * 180, now);
    gain.gain.setValueAtTime(0.028, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    /* muted */
  }
}

function useTypewriter(lines, { speed = 52, pauseBetweenLines = 380 } = {}) {
  const [displayed, setDisplayed] = useState(() => lines.map(() => ""));
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [done, setDone] = useState(false);
  const linesKey = lines.join("\n");

  useEffect(() => {
    setDisplayed(lines.map(() => ""));
    setLineIndex(0);
    setCharIndex(0);
    setDone(false);
  }, [linesKey]);

  useEffect(() => {
    if (done) return undefined;
    const currentLine = lines[lineIndex];
    if (!currentLine) {
      setDone(true);
      return undefined;
    }
    if (charIndex < currentLine.length) {
      const timer = window.setTimeout(() => {
        playTypingSound();
        setDisplayed((prev) => {
          const next = [...prev];
          next[lineIndex] = currentLine.slice(0, charIndex + 1);
          return next;
        });
        setCharIndex((c) => c + 1);
      }, speed);
      return () => window.clearTimeout(timer);
    }
    if (lineIndex < lines.length - 1) {
      const timer = window.setTimeout(() => {
        setLineIndex((l) => l + 1);
        setCharIndex(0);
      }, pauseBetweenLines);
      return () => window.clearTimeout(timer);
    }
    setDone(true);
    return undefined;
  }, [lineIndex, charIndex, lines, done, speed, pauseBetweenLines]);

  return { displayed, done, activeLineIndex: done ? -1 : lineIndex };
}

function TypewriterCursor({ visible }) {
  if (!visible) return null;
  return (
    <motion.span
      aria-hidden
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
      className="ms-1 inline-block w-[3px] translate-y-[3px] rounded-sm bg-cyan-400"
      style={{ height: "0.85em" }}
    />
  );
}

const SectionOne = () => {
  const titleLines = [
    { text: "أنشئ منصتك التعليمية", accent: false },
    { text: "الاحترافية في دقائق", accent: true },
  ];

  const { displayed, done: titleDone, activeLineIndex } = useTypewriter(
    titleLines.map((l) => l.text),
    { speed: 52, pauseBetweenLines: 380 },
  );

  const resumeAudio = useCallback(() => {
    typingAudioCtx?.resume?.().catch(() => {});
  }, []);

  useEffect(() => {
    window.addEventListener("pointerdown", resumeAudio, { once: true });
    window.addEventListener("keydown", resumeAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", resumeAudio);
      window.removeEventListener("keydown", resumeAudio);
    };
  }, [resumeAudio]);

  const stats = [
    { value: "100K+", label: "اختبار ناجح" },
    { value: "1K+", label: "مدرس نشط" },
    { value: "50K+", label: "طالب مستفيد" },
  ];

  return (
    <section
      dir="rtl"
      className="relative min-h-[90vh] overflow-hidden"
      style={{ ...landingFont, background: BRAND.navy }}
    >
      <MeshGlow />
      <DotGrid dark />

      {/* شريط تدرج علوي */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-cyan-400/50 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* النص */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300 backdrop-blur-sm"
            >
              <FiZap className="text-cyan-400" />
              الخيار الأول للمعلمين والمدربين العرب
            </motion.div>

            <h1 className="mb-6 flex min-h-[5.5rem] flex-col gap-2 sm:min-h-[6.5rem] sm:gap-2.5 lg:min-h-[7.5rem]">
              {titleLines.map((line, i) => (
                <span
                  key={line.text}
                  className={`block text-3xl font-extrabold leading-[1.5] sm:text-4xl lg:text-[2.85rem] lg:leading-[1.45] ${
                    line.accent
                      ? "bg-gradient-to-l from-cyan-300 via-blue-400 to-blue-500 bg-clip-text text-transparent"
                      : "text-white"
                  }`}
                >
                  {displayed[i]}
                  <TypewriterCursor visible={activeLineIndex === i} />
                </span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={titleDone ? { opacity: 1 } : {}}
              transition={{ duration: 0.5 }}
              className="mb-8 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg"
            >
              منصة متكاملة باسمك وبراندك — دورات، امتحانات، طلاب، ومدفوعات
              في نظام واحد يعكس هويتك المهنية.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={titleDone ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-10 flex flex-wrap gap-3"
            >
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: "0 0 40px rgba(34,211,238,0.35)" }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-cyan-500 to-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 sm:text-base"
                >
                  ابدأ الآن مجاناً
                  <FaArrowLeft className="text-xs" />
                </motion.button>
              </Link>
              <a href="#teacher-features">
                <motion.button
                  whileHover={{ scale: 1.03, borderColor: "rgba(34,211,238,0.5)" }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10 sm:text-base"
                >
                  استكشف المزايا
                </motion.button>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={titleDone ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap gap-3"
            >
              {stats.map(({ value, label }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-md"
                >
                  <div className="text-xl font-extrabold text-white sm:text-2xl">
                    {value}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">{label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* الصورة */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-cyan-500/40 via-blue-500/30 to-violet-500/40 blur-sm"
            />
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm"
            >
              <img
                src={HERO_IMAGE}
                alt="مدرس يستخدم لوحة تحكم المنصة"
                className="w-full rounded-xl object-contain"
                loading="eager"
              />
            </motion.div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -bottom-4 -right-2 z-10 hidden rounded-2xl border border-white/10 bg-[#0f2d5c]/90 px-5 py-3 shadow-2xl backdrop-blur-md sm:block"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                Live Dashboard
              </p>
              <p className="text-2xl font-extrabold text-white">+2,482</p>
              <p className="text-xs text-slate-400">طلاب نشطون الآن</p>
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-2 -top-3 z-10 hidden rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 backdrop-blur-md sm:block"
            >
              <p className="text-lg font-extrabold text-emerald-400">98%</p>
              <p className="text-[10px] text-emerald-300/80">نجاح الاختبارات</p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* موجة انتقالية للسيكشن التالي */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a1628] to-transparent" />
    </section>
  );
};

export default SectionOne;
