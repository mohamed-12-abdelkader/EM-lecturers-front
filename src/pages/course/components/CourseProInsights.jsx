import { motion } from "framer-motion";
import { FaBookOpen, FaClock, FaGraduationCap, FaStar } from "react-icons/fa";
import { crContainer, crStatTile } from "../courseTheme";

const EASE = [0.22, 1, 0.36, 1];

const TONE_STYLES = {
  blue: {
    icon: "bg-blue-50 text-blue-500 dark:bg-blue-950/50",
    value: "text-blue-600 dark:text-blue-400",
  },
  orange: {
    icon: "bg-orange-50 text-orange-500 dark:bg-orange-950/40",
    value: "text-orange-600 dark:text-orange-400",
  },
  purple: {
    icon: "bg-violet-50 text-violet-500 dark:bg-violet-950/40",
    value: "text-violet-600 dark:text-violet-400",
  },
};

function StatBlock({ stat, index }) {
  const Icon = stat.icon || FaBookOpen;
  const tone = TONE_STYLES[stat.tone] || TONE_STYLES.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: EASE }}
      className={crStatTile}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone.icon}`}>
        <Icon className="text-lg" />
      </div>
      <div className="text-right" dir="rtl">
        <p className={`font-heading text-xl font-bold ${tone.value}`}>{stat.value}</p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
      </div>
    </motion.div>
  );
}

export default function CourseProInsights({
  stats = [],
  completionPercent,
  showProgress = true,
  lecturesCount = 0,
}) {
  if (!stats?.length && !showProgress) return null;

  return (
    <section className="relative border-b border-slate-200/80 bg-white py-6 dark:border-slate-800 dark:bg-slate-900 md:py-8" dir="rtl">
      <div className={crContainer}>
        <div className="grid gap-4 lg:grid-cols-[1fr_280px] lg:items-stretch">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {stats.map((stat, i) => (
              <StatBlock key={stat.label} stat={stat} index={i} />
            ))}
          </div>

          {showProgress && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: EASE }}
              className="flex flex-col justify-between rounded-2xl border border-blue-100 bg-gradient-to-bl from-blue-50 to-white p-5 dark:border-blue-900/50 dark:from-blue-950/30 dark:to-slate-900"
            >
              <div className="text-right">
                <p className="text-xs font-bold text-blue-500">تقدمك في الكورس</p>
                <p className="mt-1 font-heading text-3xl font-bold text-slate-900 dark:text-white">
                  {completionPercent}%
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {lecturesCount} محاضرة في المسار التعليمي
                </p>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950/50">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-l from-blue-500 to-orange-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercent}%` }}
                  transition={{ delay: 0.35, duration: 0.8, ease: EASE }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
