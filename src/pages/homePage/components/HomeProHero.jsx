import { FaCopy, FaBookOpen, FaGraduationCap, FaCalendarAlt, FaKey, FaChevronDown } from "react-icons/fa";
import { motion, useReducedMotion } from "framer-motion";
import { Collapse, useDisclosure, useBreakpointValue, useToast } from "@chakra-ui/react";
import { hpContainer } from "../homeTheme";
import HomeProActivateCourse from "./HomeProActivateCourse";

const EASE = [0.22, 1, 0.36, 1];

const STAT_CONFIG = [
  {
    key: "available",
    label: "كورسات متاحة",
    icon: FaBookOpen,
    iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
  },
  {
    key: "enrolled",
    label: "كورسات مشترك بها",
    icon: FaGraduationCap,
    iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  },
  {
    key: "upcoming",
    label: "محاضرات قادمة",
    icon: FaCalendarAlt,
    iconBg: "bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400",
  },
];

function StatCard({ item, value }) {
  const Icon = item.icon;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${item.iconBg}`}
      >
        <Icon className="text-lg" />
      </span>
      <div className="min-w-0 text-right">
        <p className="font-heading text-2xl font-bold tabular-nums leading-none text-slate-900 dark:text-white">
          {Number(value || 0).toLocaleString("ar-EG")}
        </p>
        <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
      </div>
    </div>
  );
}

export default function HomeProHero({
  studentName,
  studentId,
  enrolledCount = 0,
  coursesCount = 0,
  availableToJoin = 0,
  upcomingLecturesCount = 0,
  onCourseActivated,
}) {
  const reduceMotion = useReducedMotion();
  const toast = useToast();
  const isMobileStats = useBreakpointValue({ base: true, md: false });
  const { isOpen: statsOpen, onToggle: toggleStats } = useDisclosure({ defaultIsOpen: false });

  const displayId =
    studentId != null && studentId !== "" ? String(studentId) : null;
  const firstName = (studentName || "عزيزي الطالب").split(" ")[0];

  const statValues = {
    available: availableToJoin ?? coursesCount,
    enrolled: enrolledCount,
    upcoming: upcomingLecturesCount,
  };

  const copyStudentId = async () => {
    if (!displayId) return;
    try {
      await navigator.clipboard.writeText(displayId);
      toast({
        title: "تم نسخ كود الطالب",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch {
      toast({
        title: "تعذّر النسخ",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  return (
    <section className="w-full pt-4 sm:pt-5" dir="rtl">
      <div className={hpContainer}>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="overflow-hidden rounded-2xl bg-gradient-to-bl from-blue-600 to-blue-700 px-5 py-6 shadow-lg shadow-blue-600/20 sm:px-8 sm:py-8"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
                مرحباً، {firstName}{" "}
                <span role="img" aria-label="تحية">
                  👋
                </span>
              </h1>
              <p className="mt-2 text-sm text-blue-100 sm:text-base">
                جاهز تكمل رحلتك التعليمية؟
              </p>

              <div className="mt-4">
                <HomeProActivateCourse
                  onActivated={onCourseActivated}
                  renderTrigger={(open) => (
                    <button
                      type="button"
                      onClick={open}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-blue-700 shadow-sm transition-colors hover:bg-blue-50"
                    >
                      <FaKey className="text-sm" />
                      تفعيل كورس
                    </button>
                  )}
                />
              </div>
            </div>

            {displayId ? (
              <button
                type="button"
                onClick={copyStudentId}
                className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-blue-800/40 px-4 py-2 text-sm text-blue-50 backdrop-blur-sm transition-colors hover:bg-blue-800/55"
              >
                <span className="font-medium">كود الطالب:</span>
                <span className="font-bold tabular-nums tracking-wide">{displayId}</span>
                <FaCopy className="text-xs opacity-80" />
              </button>
            ) : null}
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06, ease: EASE }}
          data-tour-id="home-stats"
          className="mt-4"
        >
          {isMobileStats ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onClick={toggleStats}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-right transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                aria-expanded={statsOpen}
              >
                <span className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                    <FaGraduationCap className="text-sm" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-slate-900 dark:text-white">
                      الإحصائيات
                    </span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {Number(statValues.enrolled || 0).toLocaleString("ar-EG")} كورس مشترك ·{" "}
                      {Number(statValues.available || 0).toLocaleString("ar-EG")} متاح
                    </span>
                  </span>
                </span>
                <FaChevronDown
                  className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                    statsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <Collapse in={statsOpen} animateOpacity>
                <div className="grid grid-cols-1 gap-3 border-t border-slate-100 p-3 dark:border-slate-800">
                  {STAT_CONFIG.map((item) => (
                    <StatCard key={item.key} item={item} value={statValues[item.key]} />
                  ))}
                </div>
              </Collapse>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              {STAT_CONFIG.map((item) => (
                <StatCard key={item.key} item={item} value={statValues[item.key]} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
