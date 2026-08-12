import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";

const EASE_OUT = [0.22, 1, 0.36, 1];
const EASE_SPRING = { type: "spring", stiffness: 90, damping: 18 };

export { motion, AnimatePresence };

export const fadeUp = {
  hidden: { opacity: 0, y: 40, rotateX: 18, transformPerspective: 900 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transformPerspective: 900,
    transition: { duration: 0.75, ease: EASE_OUT },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.86, rotateX: 22, z: -80, transformPerspective: 1000 },
  visible: {
    opacity: 1,
    scale: 1,
    rotateX: 0,
    z: 0,
    transformPerspective: 1000,
    transition: { duration: 0.7, ease: EASE_OUT },
  },
};

export const slideDown = {
  hidden: { opacity: 0, y: -28, rotateX: -12, transformPerspective: 900 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transformPerspective: 900,
    transition: { duration: 0.55, ease: EASE_OUT },
  },
};

export const blurUp = {
  hidden: { opacity: 0, y: 36, filter: "blur(12px)", rotateX: 20, transformPerspective: 1000 },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    rotateX: 0,
    transformPerspective: 1000,
    transition: { duration: 0.8, ease: EASE_OUT },
  },
};

export const slideFromEnd = {
  hidden: { opacity: 0, x: 56, rotateY: -18, transformPerspective: 1000 },
  visible: {
    opacity: 1,
    x: 0,
    rotateY: 0,
    transformPerspective: 1000,
    transition: { duration: 0.75, ease: EASE_OUT },
  },
};

export const slideFromStart = {
  hidden: { opacity: 0, x: -56, rotateY: 18, transformPerspective: 1000 },
  visible: {
    opacity: 1,
    x: 0,
    rotateY: 0,
    transformPerspective: 1000,
    transition: { duration: 0.75, ease: EASE_OUT },
  },
};

export const springPop = {
  hidden: { opacity: 0, scale: 0.78, y: 28, rotateX: 24, transformPerspective: 1100 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    transformPerspective: 1100,
    transition: { type: "spring", stiffness: 120, damping: 16 },
  },
};

/** دخول ثلاثي الأبعاد أقوى للأقسام */
export const depthIn = {
  hidden: {
    opacity: 0,
    y: 48,
    scale: 0.92,
    rotateX: 28,
    z: -120,
    transformPerspective: 1200,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    z: 0,
    transformPerspective: 1200,
    filter: "blur(0px)",
    transition: { duration: 0.85, ease: EASE_OUT },
  },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

export const heroStaggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.11,
      delayChildren: 0.14,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 36, rotateX: 16, transformPerspective: 900 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transformPerspective: 900,
    transition: { duration: 0.65, ease: EASE_OUT },
  },
};

export const staggerItemBlur = {
  hidden: {
    opacity: 0,
    y: 32,
    filter: "blur(10px)",
    rotateX: 18,
    transformPerspective: 1000,
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    rotateX: 0,
    transformPerspective: 1000,
    transition: { duration: 0.7, ease: EASE_OUT },
  },
};

export const cardHover = {
  rest: { y: 0, scale: 1, rotateX: 0, rotateY: 0, z: 0 },
  hover: {
    y: -12,
    scale: 1.03,
    rotateX: 6,
    rotateY: -4,
    z: 40,
    transition: { duration: 0.35, ease: EASE_OUT },
  },
};

export const cardHoverLift = {
  rest: { y: 0, rotateX: 0, rotateY: 0, scale: 1, z: 0 },
  hover: {
    y: -14,
    rotateX: 8,
    rotateY: -5,
    scale: 1.025,
    z: 50,
    transition: { duration: 0.38, ease: EASE_OUT },
  },
};

export function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "fadeUp",
  once = true,
  margin = "-60px",
  as = "div",
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin });
  const reduceMotion = useReducedMotion();
  const Component = motion[as] || motion.div;

  const variants = {
    fadeUp,
    fadeIn,
    scaleIn,
    slideDown,
    blurUp,
    slideFromEnd,
    slideFromStart,
    springPop,
    depthIn,
  }[variant] || fadeUp;

  return (
    <Component
      ref={ref}
      className={className}
      style={{ transformStyle: "preserve-3d", perspective: 1200 }}
      initial={reduceMotion ? "visible" : "hidden"}
      animate={isInView || reduceMotion ? "visible" : "hidden"}
      variants={variants}
      transition={{ delay }}
    >
      {children}
    </Component>
  );
}

/** للهيرو — يتحرك عند التحميل مباشرة بدون انتظار scroll */
export function HeroStagger({ children, className = "" }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? "visible" : "hidden"}
      animate="visible"
      variants={heroStaggerContainer}
    >
      {children}
    </motion.div>
  );
}

export function HeroStaggerItem({ children, className = "", as = "div" }) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as] || motion.div;

  return (
    <Component className={className} variants={reduceMotion ? fadeIn : staggerItemBlur}>
      {children}
    </Component>
  );
}

export function StaggerGrid({ children, className = "", margin = "-40px" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduceMotion ? "visible" : "hidden"}
      animate={isInView || reduceMotion ? "visible" : "hidden"}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "", variant = "default" }) {
  const reduceMotion = useReducedMotion();
  const itemVariant =
    variant === "blur" ? staggerItemBlur : reduceMotion ? fadeIn : staggerItem;

  return (
    <motion.div className={className} variants={itemVariant}>
      {children}
    </motion.div>
  );
}

export function AnimatedSection({ children, className = "", as = "section", ...rest }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-8%" });
  const reduceMotion = useReducedMotion();
  const Component = motion[as] || motion.section;

  return (
    <Component
      ref={ref}
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 32 }}
      animate={isInView || reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
      {...rest}
    >
      {children}
    </Component>
  );
}

export function ScrollProgress() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  if (reduceMotion) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px] origin-left"
      style={{
        scaleX,
        background: "linear-gradient(to right, #D4E157, #00A0E3, #7EB8D9, #D4E157)",
        backgroundSize: "200% 100%",
      }}
      animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    />
  );
}

export function HeroKenBurns({ src, srcSet, sizes = "100vw", alt = "", className }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      className={`hero-ken-burns-img ${className || ""}`}
      loading="eager"
      decoding="async"
      fetchpriority="high"
      draggable={false}
      initial={{ scale: 1 }}
      animate={{ scale: reduceMotion ? 1 : [1, 1.012, 1] }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 28, repeat: Infinity, ease: "easeInOut" }
      }
      style={{
        imageRendering: "auto",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
      }}
    />
  );
}

export function HeroGlowOrb({ className, delay = 0, style }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className={className}
      style={style}
      animate={
        reduceMotion
          ? { opacity: 0.35 }
          : {
              opacity: [0.2, 0.45, 0.2],
              scale: [1, 1.12, 1],
              x: [0, 12, 0],
              y: [0, -8, 0],
            }
      }
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 9, repeat: Infinity, delay, ease: "easeInOut" }
      }
    />
  );
}

export function FloatingShape({ className, delay = 0, duration = 6, style }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className={className}
      style={style}
      animate={
        reduceMotion
          ? {}
          : {
              y: [0, -14, 0],
              rotate: [0, 6, 0],
            }
      }
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration, repeat: Infinity, delay, ease: "easeInOut" }
      }
    />
  );
}

export function MotionCard({ children, className = "", lift = false }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={{ transformStyle: "preserve-3d", perspective: 1100 }}
      initial="rest"
      whileHover={reduceMotion ? "rest" : "hover"}
      variants={lift ? cardHoverLift : cardHover}
    >
      {children}
    </motion.div>
  );
}

export function ShimmerCTA({ children, className = "" }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      style={{ transformStyle: "preserve-3d" }}
      whileHover={reduceMotion ? {} : { scale: 1.03, y: -4, rotateX: 4 }}
      whileTap={reduceMotion ? {} : { scale: 0.98 }}
      transition={{ duration: 0.3 }}
    >
      {!reduceMotion && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 opacity-40"
          style={{
            background:
              "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)",
            backgroundSize: "200% 100%",
          }}
          animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

/** تفاعل ثلاثي الأبعاد بالماوس + طفو + لمعان */
export function Tilt3D({
  children,
  className = "",
  maxTilt = 16,
  floatPx = 10,
  floatDuration = 5,
  glare = true,
}) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [maxTilt, -maxTilt]), {
    stiffness: 260,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-maxTilt, maxTilt]), {
    stiffness: 260,
    damping: 22,
  });
  const glareX = useTransform(pointerX, [-0.5, 0.5], ["10%", "90%"]);
  const glareY = useTransform(pointerY, [-0.5, 0.5], ["10%", "90%"]);
  const glareBg = useTransform(
    [glareX, glareY],
    ([x, y]) =>
      `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,0.32) 0%, transparent 55%)`
  );

  const handlePointerMove = (event) => {
    if (reduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handlePointerMove}
      onMouseLeave={resetPointer}
      style={{ perspective: 1400 }}
    >
      <motion.div
        className="relative will-change-transform"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          boxShadow: "0 28px 60px -20px rgba(0,0,0,0.45)",
        }}
        animate={floatPx ? { y: [0, -floatPx, 0] } : undefined}
        transition={
          floatPx
            ? { duration: floatDuration, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      >
        {children}
        {glare ? (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit]"
            style={{
              background: glareBg,
              mixBlendMode: "soft-light",
            }}
          />
        ) : null}
      </motion.div>
    </div>
  );
}

/** طبقة parallax بسيطة مع السكرول */
export function ParallaxLayer({ children, className = "", speed = 0.2, as = "div" }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 80, speed * -80]);
  const Component = motion[as] || motion.div;

  if (reduceMotion) {
    return (
      <div ref={ref} className={`relative ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <Component ref={ref} className={`relative ${className}`} style={{ y, willChange: "transform" }}>
      {children}
    </Component>
  );
}

/** كارت بعمق 3D عند الدخول + tilt بالماوس */
export function DepthCard({ children, className = "", maxTilt = 10, floatPx = 0 }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Tilt3D className={className} maxTilt={maxTilt} floatPx={floatPx} floatDuration={6} glare>
      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 22, transformPerspective: 1000 }}
        whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.7, ease: EASE_OUT }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
      </motion.div>
    </Tilt3D>
  );
}

export function AnimatedUnderline({ className = "", color = "#A16207" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={`h-1 rounded-full ${className}`}
      style={{ backgroundColor: color, originX: 1 }}
      initial={{ scaleX: reduceMotion ? 1 : 0 }}
      animate={isInView || reduceMotion ? { scaleX: 1 } : { scaleX: 0 }}
      transition={{ duration: 0.55, ease: EASE_OUT, delay: 0.15 }}
    />
  );
}

/** حلقة نبض حول أيقونة — للاستخدام في الخطوات والـ CTA */
export function PulseRing({ className = "", colorClass = "bg-blue-400/40", delay = 0 }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;
  return (
    <motion.span
      aria-hidden
      className={`pointer-events-none absolute inset-0 rounded-full ${colorClass} ${className}`}
      initial={{ scale: 1, opacity: 0.45 }}
      animate={{ scale: [1, 1.45, 1.45], opacity: [0.4, 0.12, 0] }}
      transition={{ duration: 2.2, repeat: Infinity, delay, ease: "easeOut" }}
    />
  );
}

/** خط يُرسم عند الظهور (مثل مسار الرحلة) */
export function DrawLine({ className = "", delay = 0.2 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      aria-hidden
      className={className}
      style={{ originX: 0 }}
      initial={{ scaleX: reduceMotion ? 1 : 0, opacity: reduceMotion ? 1 : 0.4 }}
      animate={
        isInView || reduceMotion
          ? { scaleX: 1, opacity: 1 }
          : { scaleX: 0, opacity: 0.4 }
      }
      transition={{ duration: 1.1, ease: EASE_OUT, delay }}
    />
  );
}

/** عدّاد يظهر عند الدخول للشاشة */
export function CountUp({ value, className = "", duration = 1.2 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const raw = String(value ?? "");
  const match = raw.match(/^([^\d]*)([\d.,]+)(.*)$/);
  const prefix = match?.[1] ?? "";
  const numericPart = match?.[2] ?? "";
  const suffix = match?.[3] ?? "";
  const target = Number(String(numericPart).replace(/,/g, "")) || 0;
  const hasNumber = Boolean(match && numericPart);

  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 70, damping: 22 });
  const [display, setDisplay] = useState(reduceMotion || !hasNumber ? raw : `${prefix}0${suffix}`);

  useEffect(() => {
    if (!hasNumber) {
      setDisplay(raw);
      return undefined;
    }
    if (reduceMotion) {
      setDisplay(raw);
      return undefined;
    }
    if (!isInView) return undefined;
    mv.set(0);
    const unsub = spring.on("change", (v) => {
      const n = Math.round(v);
      setDisplay(`${prefix}${n.toLocaleString("ar-EG")}${suffix}`);
    });
    mv.set(target);
    const t = setTimeout(() => setDisplay(raw), duration * 1000 + 120);
    return () => {
      unsub();
      clearTimeout(t);
    };
  }, [isInView, reduceMotion, hasNumber, raw, prefix, suffix, target, mv, spring, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
