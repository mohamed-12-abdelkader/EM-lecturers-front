import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCopy,
  FaKey,
  FaTrophy,
  FaStar,
  FaMedal,
} from "react-icons/fa";
import { motion, useReducedMotion } from "framer-motion";
import { useToast } from "@chakra-ui/react";
import { hpContainer } from "../homeTheme";
import HomeProActivateCourse from "./HomeProActivateCourse";
import { fetchStudentPointsSummary } from "../../../api/teacherPointsApi";
import useTeacherPlatformBrand from "../../../Hooks/teacher/useTeacherPlatformBrand";

const EASE = [0.22, 1, 0.36, 1];
const FALLBACK_BLUE = "#3182CE";
const FALLBACK_ORANGE = "#DD6B20";

function greetingForHour() {
  const hour = new Date().getHours();
  if (hour < 12) return "صباح الخير";
  if (hour < 17) return "أهلاً بك";
  return "مساء الخير";
}

function HeroPointsCard({ accent = FALLBACK_ORANGE }) {
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
        className="pointer-events-none absolute -top-1 left-8 hidden rotate-12 text-3xl sm:block"
        style={{ color: `${accent}99` }}
      />
      <FaMedal
        aria-hidden
        className="pointer-events-none absolute bottom-10 left-14 hidden rotate-[20deg] text-2xl text-white/25 sm:block"
      />

      <div className="relative z-[1]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold text-white/85 sm:text-[11px]">نقاطك في الصف</p>
            <p className="mt-0.5 hidden text-xs font-medium text-white/70 sm:block">رصيدك الحالي</p>
          </div>
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-md sm:h-10 sm:w-10 sm:rounded-xl"
            style={{ background: accent }}
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

        <p className="mt-1 text-[10px] font-semibold leading-snug text-white/80 sm:mt-1.5 sm:text-xs">
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
  const platformBrand = useTeacherPlatformBrand();

  const accent = platformBrand.accent || FALLBACK_BLUE;
  const accentSoft = platformBrand.accentSoft || FALLBACK_ORANGE;
  const accent2 = platformBrand.accent2 || "#1A365D";
  const heroGradient =
    platformBrand.heroGradient ||
    `linear-gradient(135deg, ${FALLBACK_BLUE} 0%, #2B6CB0 55%, #1A365D 100%)`;

  const displayId = studentId != null && studentId !== "" ? String(studentId) : null;
  const firstName = (studentName || "عزيزي الطالب").split(" ")[0];
  const greeting = greetingForHour();
  const todayLabel = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

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
          className="relative overflow-hidden rounded-xl px-3.5 py-4 shadow-md sm:rounded-2xl sm:px-8 sm:py-8 sm:shadow-lg"
          style={{
            background: heroGradient,
            boxShadow: `0 22px 48px -22px ${accent}88`,
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              backgroundImage: `radial-gradient(ellipse 70% 80% at 100% 0%, ${accent}55, transparent 52%), radial-gradient(ellipse 55% 65% at 0% 100%, rgba(255,255,255,0.14), transparent 55%)`,
            }}
          />
          <FaTrophy
            aria-hidden
            className="pointer-events-none absolute -left-8 top-1/2 hidden -translate-y-1/2 text-[15rem] text-white/10 lg:block"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl sm:-right-10 sm:-top-10 sm:h-40 sm:w-40"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-10 left-6 h-28 w-28 rounded-full blur-2xl sm:-bottom-16 sm:left-10 sm:h-44 sm:w-44"
            style={{ background: `${accentSoft}33` }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]"
            style={{
              background: `linear-gradient(90deg, ${accentSoft}, ${accent}, transparent)`,
            }}
          />

          <div className="relative z-[1] flex flex-col gap-3.5 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <span className="mb-2 inline-flex rounded-full bg-black/25 px-3 py-1 text-[11px] font-extrabold text-white">
                {todayLabel}
              </span>
              <h1 className="font-cairo text-lg font-extrabold leading-snug tracking-tight text-white sm:text-3xl">
                {greeting}، {firstName}
              </h1>
              <p className="mt-1.5 max-w-xl text-xs font-semibold leading-6 text-white/85 sm:mt-2 sm:text-sm">
                {platformBrand.specialty
                  ? `منصة ${platformBrand.specialty} — تابع كورساتك ونقاطك من مكان واحد`
                  : `تابع كورساتك ونقاطك في منصة ${platformBrand.brandName || "المدرس"}`}
              </p>

              <div className="mt-3.5 flex flex-wrap items-center gap-2 sm:mt-5 sm:gap-2.5">
                <HomeProActivateCourse
                  onActivated={onCourseActivated}
                  enrolledCourseIds={enrolledCourseIds}
                  renderTrigger={(open) => (
                    <button
                      type="button"
                      onClick={open}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white shadow-md transition hover:brightness-95 sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
                      style={{
                        background:
                          platformBrand.layout === "ember" ? accent : FALLBACK_ORANGE,
                      }}
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

                {(enrolledCount > 0 || availableToJoin > 0) && (
                  <span className="inline-flex items-center rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-bold text-white/90">
                    {enrolledCount.toLocaleString("ar-EG")} كورس مشترك
                    {availableToJoin > 0
                      ? ` · ${availableToJoin.toLocaleString("ar-EG")} متاح`
                      : ""}
                  </span>
                )}
              </div>
            </div>

            <HeroPointsCard accent={accentSoft || FALLBACK_ORANGE} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
