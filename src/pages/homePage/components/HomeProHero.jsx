import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCopy,
  FaBookOpen,
  FaGraduationCap,
  FaCalendarAlt,
  FaKey,
  FaChevronDown,
  FaChevronLeft,
  FaTrophy,
  FaStar,
  FaMedal,
} from "react-icons/fa";
import { motion, useReducedMotion } from "framer-motion";
import { Collapse, useDisclosure, useBreakpointValue, useToast } from "@chakra-ui/react";
import { hpContainer } from "../homeTheme";
import HomeProActivateCourse from "./HomeProActivateCourse";
import { fetchStudentPointsSummary } from "../../../api/teacherPointsApi";

const EASE = [0.22, 1, 0.36, 1];
const BLUE = "#3182CE";
const ORANGE = "#DD6B20";

const STAT_CONFIG = [
  
];

function StatCard({ item, value }) {
  const Icon = item.icon;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${item.iconBg}`}>
        <Icon className="text-lg" />
      </span>
      <div className="min-w-0 text-right">
        <p className="font-cairo text-2xl font-bold tabular-nums leading-none text-slate-900 dark:text-white">
          {Number(value || 0).toLocaleString("ar-EG")}
        </p>
        <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
      </div>
    </div>
  );
}

function HeroPointsCard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchStudentPointsSummary()
      .then((data) => {
        if (mounted) setSummary(data);
      })
      .catch(() => {
        if (mounted) setSummary({ totalPoints: 0, rank: 0 });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const points = Number(summary?.totalPoints || 0);
  const rank = Number(summary?.rank || 0);
  const showRank = rank >= 1 && rank <= 10;

  return (
    <Link
      to="/my-points"
      data-tour-id="home-points"
      className="group relative isolate w-full shrink-0 overflow-hidden rounded-xl border border-white/25 bg-white/15 p-3 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-md transition hover:bg-white/25 hover:no-underline sm:rounded-2xl sm:p-5 lg:w-[280px]"
    >
      <FaTrophy
        aria-hidden
        className="pointer-events-none absolute -bottom-4 -left-3 rotate-[-16deg] text-[4.5rem] text-white/20 transition duration-300 group-hover:rotate-[-8deg] group-hover:scale-110 sm:text-[7rem]"
      />
      <FaStar
        aria-hidden
        className="pointer-events-none absolute -top-1 left-8 hidden rotate-12 text-3xl text-[#F6AD55]/55 sm:block"
      />
      <FaMedal
        aria-hidden
        className="pointer-events-none absolute bottom-10 left-14 hidden rotate-[20deg] text-2xl text-white/25 sm:block"
      />

      <div className="relative z-[1]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold text-blue-100 sm:text-[11px]">نقاطك في الصف</p>
            <p className="mt-0.5 hidden text-xs font-medium text-blue-50/80 sm:block">رصيدك الحالي</p>
          </div>
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-md sm:h-10 sm:w-10 sm:rounded-xl"
            style={{ background: ORANGE }}
          >
            <FaTrophy className="text-xs sm:text-sm" />
          </span>
        </div>

        {loading ? (
          <div className="mt-2 h-8 w-20 animate-pulse rounded-lg bg-white/20 sm:mt-3 sm:h-11 sm:w-28" />
        ) : (
          <p className="mt-1.5 font-cairo text-2xl font-extrabold tabular-nums tracking-tight text-white sm:mt-2 sm:text-5xl">
            {points.toLocaleString("ar-EG")}
          </p>
        )}

        <p className="mt-1 text-[10px] font-semibold leading-snug text-blue-100 sm:mt-1.5 sm:text-xs">
          {showRank ? `ترتيبك في المتفوقين: ${rank}` : "أعلى 10 يظهر ترتيبهم فقط"}
        </p>

       
      </div>
    </Link>
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
  enrolledCourseIds = [],
}) {
  const reduceMotion = useReducedMotion();
  const toast = useToast();
  const isMobileStats = useBreakpointValue({ base: true, md: false });
  const { isOpen: statsOpen, onToggle: toggleStats } = useDisclosure({ defaultIsOpen: false });

  const displayId = studentId != null && studentId !== "" ? String(studentId) : null;
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
      toast({ title: "تم نسخ كود الطالب", status: "success", duration: 2000, isClosable: true });
    } catch {
      toast({ title: "تعذّر النسخ", status: "error", duration: 2000, isClosable: true });
    }
  };

  return (
    <section className="w-full pt-2 sm:pt-5" dir="rtl">
      <div className={hpContainer}>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="relative overflow-hidden rounded-xl px-3.5 py-3.5 shadow-md sm:rounded-2xl sm:px-8 sm:py-8 sm:shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${BLUE} 0%, #2B6CB0 55%, #1A365D 100%)`,
            boxShadow: "0 18px 40px -20px rgba(49,130,206,0.55)",
          }}
        >
          <FaTrophy
            aria-hidden
            className="pointer-events-none absolute -left-8 top-1/2 hidden -translate-y-1/2 text-[15rem] text-white/10 lg:block"
          />
          <FaStar
            aria-hidden
            className="pointer-events-none absolute right-10 top-4 hidden text-5xl text-white/10 sm:block"
          />
          <FaMedal
            aria-hidden
            className="pointer-events-none absolute bottom-4 left-1/3 hidden text-4xl text-white/10 md:block"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl sm:-right-10 sm:-top-10 sm:h-40 sm:w-40"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-10 left-6 h-28 w-28 rounded-full blur-2xl sm:-bottom-16 sm:left-10 sm:h-44 sm:w-44"
            style={{ background: `${ORANGE}33` }}
          />

          <div className="relative z-[1] flex flex-col gap-3 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h1 className="font-cairo text-lg font-extrabold leading-snug text-white sm:text-3xl">
                مرحباً، {firstName}
              </h1>
             

              <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-5 sm:gap-2.5">
                <HomeProActivateCourse
                  onActivated={onCourseActivated}
                  enrolledCourseIds={enrolledCourseIds}
                  renderTrigger={(open) => (
                    <button
                      type="button"
                      onClick={open}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white shadow-md transition hover:brightness-95 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
                      style={{ background: ORANGE }}
                    >
                      <FaKey className="text-xs sm:text-sm" />
                      تفعيل كورس
                    </button>
                  )}
                />

                {displayId ? (
                  <button
                    type="button"
                    onClick={copyStudentId}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/25 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
                  >
                    <span className="opacity-85">كود الطالب</span>
                    <span className="tabular-nums tracking-wide">{displayId}</span>
                    <FaCopy className="text-[10px] opacity-80 sm:text-xs" />
                  </button>
                ) : null}
              </div>
            </div>

            <HeroPointsCard />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
