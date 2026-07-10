import { useRef } from "react";
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
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EASE_OUT },
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
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.55, ease: EASE_OUT },
  },
};

export const slideDown = {
  hidden: { opacity: 0, y: -24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

export const blurUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: EASE_OUT },
  },
};

export const slideFromEnd = {
  hidden: { opacity: 0, x: 48 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, ease: EASE_OUT },
  },
};

export const slideFromStart = {
  hidden: { opacity: 0, x: -48 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, ease: EASE_OUT },
  },
};

export const springPop = {
  hidden: { opacity: 0, scale: 0.85, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: EASE_SPRING,
  },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.06,
    },
  },
};

export const heroStaggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.12,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_OUT },
  },
};

export const staggerItemBlur = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE_OUT },
  },
};

export const cardHover = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -6,
    scale: 1.01,
    transition: { duration: 0.28, ease: EASE_OUT },
  },
};

export const cardHoverLift = {
  rest: { y: 0, rotateX: 0 },
  hover: {
    y: -8,
    transition: { duration: 0.32, ease: EASE_OUT },
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
  }[variant] || fadeUp;

  return (
    <Component
      ref={ref}
      className={className}
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
        background: "linear-gradient(to right, #A16207, #1E3A5F, #2563EB, #A16207)",
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
      whileHover={reduceMotion ? {} : { scale: 1.01 }}
      transition={{ duration: 0.3 }}
    >
      {!reduceMotion && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 opacity-30"
          style={{
            background:
              "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)",
            backgroundSize: "200% 100%",
          }}
          animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

/** تفاعل ثلاثي الأبعاد بالماوس + طفو خفيف */
export function Tilt3D({
  children,
  className = "",
  maxTilt = 12,
  floatPx = 8,
  floatDuration = 5.5,
}) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [maxTilt, -maxTilt]), {
    stiffness: 280,
    damping: 24,
  });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-maxTilt, maxTilt]), {
    stiffness: 280,
    damping: 24,
  });

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
      style={{ perspective: 1200 }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        animate={{ y: [0, -floatPx, 0] }}
        transition={{ duration: floatDuration, repeat: Infinity, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </div>
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
