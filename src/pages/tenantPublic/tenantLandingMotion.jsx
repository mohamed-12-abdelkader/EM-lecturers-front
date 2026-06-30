import { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  AnimatePresence,
} from "framer-motion";

const EASE_OUT = [0.22, 1, 0.36, 1];

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

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.06,
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

export const cardHover = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -6,
    scale: 1.01,
    transition: { duration: 0.28, ease: EASE_OUT },
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

export function StaggerGrid({ children, className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
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

export function StaggerItem({ children, className = "" }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={reduceMotion ? fadeIn : staggerItem}
    >
      {children}
    </motion.div>
  );
}

export function HeroKenBurns({ src, alt = "", className }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.img
      src={src}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      className={className}
      initial={{ scale: 1 }}
      animate={{ scale: reduceMotion ? 1 : [1.02, 1.06, 1.02] }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 22, repeat: Infinity, ease: "easeInOut" }
      }
    />
  );
}

export function HeroGlowOrb({ className, delay = 0 }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className={className}
      animate={
        reduceMotion
          ? { opacity: 0.35 }
          : {
              opacity: [0.25, 0.45, 0.25],
              scale: [1, 1.08, 1],
            }
      }
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 8, repeat: Infinity, delay, ease: "easeInOut" }
      }
    />
  );
}

export function MotionCard({ children, className = "" }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial="rest"
      whileHover={reduceMotion ? "rest" : "hover"}
      variants={cardHover}
    >
      {children}
    </motion.div>
  );
}
