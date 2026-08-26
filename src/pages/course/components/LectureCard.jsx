import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Icon,
  IconButton,
  Tooltip,
  useToast,
  Spinner,
  useDisclosure,
} from "@chakra-ui/react";
import {
  FaLock,
  FaEdit,
  FaTrash,
  FaPlus,
  FaVideo,
  FaEye,
  FaEyeSlash,
  FaTasks,
  FaCog,
  FaPlay,
  FaPen,
  FaCheckCircle,
  FaRedo,
  FaChevronDown,
  FaClock,
  FaKey,
  FaChartBar,
} from "react-icons/fa";
import baseUrl from "../../../api/baseUrl";
import { Link } from "react-router-dom";
import { buildExamReportPath } from "../../exam/utils/examReportUtils";
import {
  crBtnSecondary,
  crCard,
  crEyebrow,
  lcBadge,
  lcBody,
  lcBodySm,
  lcBtn,
  lcCaption,
  lcIndex,
  lcLabel,
  lcRoot,
  lcTitle,
  lcTitleSm,
} from "../courseTheme";
import {
  TOUR_COLLAPSE_LECTURE,
  TOUR_EXPAND_LECTURE,
} from "../../../utils/coursePageTour";
import {
  getAccessStatusMeta,
  getLectureLockMessage,
  getLectureAccessModeLabel,
  resolveLectureAccessMode,
  lectureSupportsActivationCodes,
} from "../../../utils/lectureAccessUtils";
import LectureActivateCodeForm, { LectureActivationTimer } from "./LectureActivateCodeForm";
import LectureActivationCodesModal from "./LectureActivationCodesModal";

const EASE = [0.22, 1, 0.36, 1];

function getExamStatus(exam) {
  if (!exam) return null;
  if (exam.is_solved) return { label: "تم الحل", tone: "done", cta: "عرض النتيجة", icon: FaCheckCircle };
  if (exam.in_progress || exam.is_started) return { label: "قيد التنفيذ", tone: "active", cta: "متابعة الواجب", icon: FaPen };
  return { label: "لم يُبدأ", tone: "idle", cta: "ابدأ الواجب", icon: FaPen };
}

/** يجمع كل واجبات المحاضرة من الـ API الجديد مع التوافق مع exam القديم */
function getLectureAssignments(lecture, fallbackExam = null) {
  if (Array.isArray(lecture?.assignments) && lecture.assignments.length > 0) {
    return lecture.assignments;
  }
  if (Array.isArray(lecture?.exams) && lecture.exams.length > 0) {
    const fromExams = lecture.exams.filter(
      (e) => !e.type || e.type === "assignment",
    );
    if (fromExams.length > 0) return fromExams;
  }
  const single = fallbackExam || lecture?.exam || null;
  return single ? [single] : [];
}

function ProgressRing({ percent }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <div className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14 md:h-16 md:w-16">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64" aria-hidden>
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-slate-100 dark:text-slate-800" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="text-blue-500"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${lcIndex} text-xs text-slate-700 sm:text-sm md:text-lg dark:text-slate-200`}>{percent}%</span>
      </div>
    </div>
  );
}

/** عنوان قسم داخل جسم المحاضرة (الفيديوهات / الواجبات) */
function SectionHeading({ icon: IconComp, label, count, accent, action }) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white sm:h-9 sm:w-9 ${
            accent === "orange" ? "bg-orange-500" : "bg-blue-500"
          }`}
        >
          <IconComp className="text-xs sm:text-sm" />
        </div>
        <h4 className={`${lcTitleSm} !text-sm sm:!text-base`}>{label}</h4>
        <span
          className={`rounded-full px-2 py-0.5 sm:px-2.5 ${lcBadge} ${
            accent === "orange"
              ? "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400"
              : "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
          }`}
        >
          {count}
        </span>
      </div>
      {action ? <div className="w-full sm:w-auto">{action}</div> : null}
    </div>
  );
}

/** صف فيديو — عمودي على الموبايل، أفقي من sm */
function VideoRow({ video, index, canManage, handleDeleteVideo }) {
  const isDone = video.is_completed;
  const isStarted = video.is_watched && !video.is_completed;

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-blue-300 sm:flex-row sm:items-center sm:gap-3 sm:px-3.5 sm:py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-700"
      dir="rtl"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold sm:h-8 sm:w-8 ${
            isDone
              ? "bg-emerald-500 text-white"
              : isStarted
                ? "bg-blue-500 text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {isDone ? <FaCheckCircle className="text-sm" /> : index + 1}
        </span>

        <div className="min-w-0 flex-1 text-right">
          <h5 className={`break-words ${lcTitleSm} !text-sm sm:truncate`}>
            {video.title || `الفيديو ${index + 1}`}
          </h5>
          {video.duration ? (
            <span className={`mt-0.5 inline-flex items-center gap-1 ${lcCaption}`}>
              <FaClock className="text-[9px]" />
              {video.duration}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:justify-end">
        <Link
          to={`/video/${video.id}`}
          className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 sm:flex-initial sm:py-1.5 ${lcBtn} transition-colors ${
            isDone || isStarted
              ? "border border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {isDone ? <FaRedo className="text-[10px]" /> : <FaPlay className="text-[10px]" />}
          مشاهدة
        </Link>
        {canManage ? (
          <button
            type="button"
            aria-label="حذف الفيديو"
            className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 sm:h-auto sm:w-auto sm:p-2 dark:hover:bg-red-950/40"
            onClick={() => handleDeleteVideo(video.id, video.title || "فيديو")}
          >
            <FaTrash className="text-xs" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** صف واجب — عمودي على الموبايل، أفقي من sm */
function AssignmentRow({
  exam,
  canManage,
  examActionLoading,
  openExamModal,
  openDeleteExamDialog,
}) {
  if (!exam) return null;
  const examStatus = getExamStatus(exam);
  const solved = exam.is_solved;
  const inProgress = exam.in_progress || exam.is_started;

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-orange-300 sm:flex-row sm:items-center sm:gap-3 sm:px-3.5 sm:py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-orange-700"
      dir="rtl"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white sm:h-8 sm:w-8 ${
            solved ? "bg-emerald-500" : "bg-orange-500"
          }`}
        >
          <examStatus.icon className="text-xs" />
        </span>

        <div className="min-w-0 flex-1 text-right">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
            <h5 className={`break-words ${lcTitleSm} !text-sm sm:truncate`}>
              {exam.title || "واجب المحاضرة"}
            </h5>
            {!canManage && examStatus ? (
              <span
                className={`w-fit shrink-0 rounded-full px-2 py-0.5 ${lcBadge} ${
                  solved
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : inProgress
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {examStatus.label}
              </span>
            ) : null}
          </div>
          <p className={`mt-0.5 break-words ${lcCaption}`}>
            {canManage
              ? `الدرجة: ${exam.total_grade ?? "—"} • المدة: ${exam.duration ?? "—"} دقيقة`
              : exam.student_submission?.score != null
                ? `درجتك: ${exam.student_submission.score}`
                : null}
          </p>
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end sm:gap-1.5">
        {!canManage ? (
          <Link
            to={`/ComprehensiveExam/${exam.id}`}
            className={`inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 sm:w-auto sm:py-1.5 ${lcBtn} text-white transition-colors ${
              inProgress && !solved
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            <examStatus.icon className="text-[10px]" />
            {examStatus.cta}
          </Link>
        ) : (
          <>
            <Link
              to={`/ComprehensiveExam/${exam.id}`}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-blue-500 px-3 py-2.5 text-xs font-bold text-blue-500 transition-colors hover:bg-blue-50 sm:w-auto sm:py-1.5 dark:hover:bg-blue-950/40"
            >
              <FaCog className="text-[10px]" />
              إدارة
            </Link>
            <Link
              to={buildExamReportPath(exam.id, { from: "lecture" })}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-indigo-500 px-3 py-2.5 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-50 sm:w-auto sm:py-1.5 dark:hover:bg-indigo-950/40"
            >
              <FaChartBar className="text-[10px]" />
              التقرير
            </Link>
            <button
              type="button"
              className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-blue-500 px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-600 sm:w-auto sm:py-1.5"
              onClick={() => openExamModal("edit", exam)}
            >
              <FaEdit className="text-[10px]" />
              تعديل
            </button>
            <button
              type="button"
              aria-label="حذف الواجب"
              className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50 sm:h-auto sm:w-auto dark:hover:bg-red-950/40"
              disabled={examActionLoading}
              onClick={() => openDeleteExamDialog(exam)}
            >
              {examActionLoading ? <Spinner size="sm" /> : <FaTrash className="text-xs" />}
              <span className="ms-1.5 text-xs font-bold sm:hidden">حذف</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const LectureCard = ({
  lecture,
  lectureIndex = 0,
  hideLectureAssignments = false,
  onRefreshCourse,
  isTourTarget = false,
  isTeacher,
  isAdmin,
  handleEditLecture,
  handleDeleteLecture,
  handleAddVideo,
  handleDeleteVideo,
  setExamModal,
  setDeleteExamDialog,
  examActionLoading,
  formatDate,
  autoOpenCodes = false,
  onCodesModalClosed,
}) => {
  const toast = useToast();
  const codesModal = useDisclosure();
  const [expanded, setExpanded] = React.useState(false);
  const [visibilityLoading, setVisibilityLoading] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(lecture.is_visible ?? true);
  const [lectureExam, setLectureExam] = React.useState(null);
  const [examLoading, setExamLoading] = React.useState(false);
  const canManage = isTeacher || isAdmin;
  const lectureAccessMode = resolveLectureAccessMode(lecture);

  const handleToggleVisibility = async (e) => {
    e.stopPropagation();
    setVisibilityLoading(true);
    try {
      const token = localStorage.getItem("token");
      await baseUrl.patch(
        `/api/course/lecture/${lecture.id}/visibility`,
        { is_visible: !isVisible },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setIsVisible(!isVisible);
    } catch (error) {
      toast({
        title: "تعذر تحديث حالة الإظهار",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setVisibilityLoading(false);
    }
  };

  const fetchLectureExam = async () => {
    if (!lecture.id) return;
    setExamLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await baseUrl.get(`/api/course/lecture/${lecture.id}/exam`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLectureExam(response.data.exam || response.data);
    } catch {
      setLectureExam(null);
    } finally {
      setExamLoading(false);
    }
  };

  React.useEffect(() => {
    if (canManage) {
      const existing = getLectureAssignments(lecture);
      if (existing.length > 0) {
        setLectureExam(existing[0]);
      } else if (lecture.exam) {
        setLectureExam(lecture.exam);
      } else {
        fetchLectureExam();
      }
    }
  }, [lecture.id, lecture.exam, lecture.assignments, lecture.exams, canManage]);

  React.useEffect(() => {
    if (!isTourTarget) return undefined;

    const onExpand = (event) => {
      const targetId = event?.detail?.lectureId;
      if (targetId != null && String(lecture.id) === String(targetId)) {
        setExpanded(true);
      }
    };

    const onCollapse = () => {
      setExpanded(false);
    };

    window.addEventListener(TOUR_EXPAND_LECTURE, onExpand);
    window.addEventListener(TOUR_COLLAPSE_LECTURE, onCollapse);
    return () => {
      window.removeEventListener(TOUR_EXPAND_LECTURE, onExpand);
      window.removeEventListener(TOUR_COLLAPSE_LECTURE, onCollapse);
    };
  }, [isTourTarget, lecture.id]);

  const progress = lecture.progress;
  const videosCount = progress?.total_videos ?? lecture.videos?.length ?? 0;
  const watchedVideos = progress?.watched_videos ?? lecture.videos?.filter((v) => v.is_watched).length ?? 0;

  const assignments = getLectureAssignments(
    lecture,
    canManage ? lectureExam : null,
  );
  const assignmentsCount = assignments.length;
  const hasAssignments = assignmentsCount > 0;

  const allAssignmentsPassed =
    progress?.all_assignments_passed ??
    (assignmentsCount === 0 ||
      assignments.every((a) => a.is_solved) ||
      Boolean(progress?.exam_solved));

  const progressPercent =
    progress && progress.total_videos > 0
      ? Math.round((progress.watched_videos / progress.total_videos) * 100)
      : videosCount > 0
        ? Math.round((watchedVideos / videosCount) * 100)
        : 0;
  const isLectureComplete =
    Boolean(progress?.all_videos_watched) && allAssignmentsPassed;
  const isLockedForViewer = Boolean(lecture.locked) && !canManage;
  const accessStatus = lecture.access_status || (lecture.locked ? "locked" : "open");
  const accessMeta = getAccessStatusMeta(accessStatus);
  const needsActivationCode =
    !canManage && accessStatus === "requires_activation_code";
  const showActivationTimer =
    !canManage && (accessStatus === "activated" || accessStatus === "open") && lecture.activation;
  const lectureDescription = lecture.description || lecture.objective || "";
  const expiresLabel = lecture.expires_at
    ? formatDate
      ? formatDate(lecture.expires_at)
      : new Date(lecture.expires_at).toLocaleString("ar-EG")
    : null;

  React.useEffect(() => {
    if (!autoOpenCodes || !canManage) return undefined;
    codesModal.onOpen();
    return undefined;
  }, [autoOpenCodes, canManage, lecture.id]);

  const openExamModal = (type, data = null) => {
    setExamModal({ isOpen: true, type, lectureId: lecture.id, data });
  };

  const openDeleteExamDialog = (exam) => {
    setDeleteExamDialog({
      isOpen: true,
      examId: exam.id,
      title: exam.title || "واجب المحاضرة",
    });
  };

  const suggestedAssignmentTitle = `واجب ${assignmentsCount + 1}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className={`${crCard} ${lcRoot} overflow-hidden`}
      dir="rtl"
      data-tour-id={isTourTarget ? "course-lecture-card" : undefined}
    >
      {/* ── Header ── */}
      <div className="relative border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-blue-500 to-orange-500" aria-hidden />

        <div className="space-y-3 p-3.5 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500 ${lcIndex} text-base text-white shadow-[0_8px_20px_rgba(49,130,206,0.25)] sm:h-14 sm:w-14 sm:rounded-2xl sm:text-lg`}>
                {lectureIndex + 1}
              </div>
              {!canManage && videosCount > 0 && <ProgressRing percent={progressPercent} />}
            </div>

            <div className="min-w-0 flex-1 text-right">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5 sm:mb-2 sm:gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 ${lcBadge} sm:px-2.5 ${accessMeta.badgeClass}`}
                >
                  {canManage
                    ? lecture.locked
                      ? "مغلق للطلاب"
                      : "مفتوح"
                    : accessMeta.label}
                </span>
                {canManage ? (
                  <span className={`rounded-full bg-violet-50 px-2 py-0.5 ${lcBadge} text-violet-600 sm:px-2.5 dark:bg-violet-950/40 dark:text-violet-400`}>
                    {getLectureAccessModeLabel(lectureAccessMode)}
                  </span>
                ) : null}
                {canManage &&
                lectureAccessMode === "groups" &&
                Array.isArray(lecture.group_ids) &&
                lecture.group_ids.length > 0 ? (
                  <span className={`rounded-full bg-amber-50 px-2 py-0.5 ${lcBadge} text-amber-700 sm:px-2.5`}>
                    {lecture.group_ids.length} مجموعة
                  </span>
                ) : null}
                {!canManage && lecture.open_via_group === true ? (
                  <span className={`rounded-full bg-teal-50 px-2 py-0.5 ${lcBadge} text-teal-700 sm:px-2.5 dark:bg-teal-950/40 dark:text-teal-300`}>
                    مفتوحة عبر مجموعتك
                  </span>
                ) : null}
                {expiresLabel ? (
                  <span className={`inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 ${lcBadge} text-amber-700 sm:px-2.5 dark:bg-amber-950/40 dark:text-amber-300`}>
                    <FaClock className="text-[10px]" />
                    ينتهي {expiresLabel}
                  </span>
                ) : null}
                {canManage && (
                  <span className={`rounded-full px-2 py-0.5 ${lcBadge} sm:px-2.5 ${isVisible ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                    {isVisible ? "ظاهر" : "مخفي"}
                  </span>
                )}
                {!canManage && isLectureComplete && (
                  <span className={`rounded-full bg-emerald-50 px-2 py-0.5 ${lcBadge} text-emerald-600 sm:px-2.5 dark:bg-emerald-950/40 dark:text-emerald-400`}>مكتملة</span>
                )}
                <span className={`${crEyebrow} !px-2 !py-0.5 !text-[10px] sm:!px-3 sm:!py-1 sm:!text-[11px]`}>محاضرة {lectureIndex + 1}</span>
              </div>

              <h3 className={`${lcTitle} break-words`}>{lecture.title}</h3>
              {lectureDescription && (
                <p className={`mt-1 line-clamp-2 sm:mt-1.5 ${lcBody}`}>{lectureDescription}</p>
              )}
              {/* ملخص المحتوى */}
              <div className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 ${lcCaption}`}>
                <span className="inline-flex items-center gap-1.5">
                  <FaVideo className="text-[10px] text-blue-500" />
                  {videosCount} فيديو
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FaTasks className="text-[10px] text-orange-500" />
                  {hideLectureAssignments ? "واجبات الكورس" : `${assignmentsCount} واجب`}
                </span>
              </div>

              {/* زر فتح / إغلاق المحاضرة */}
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className={`mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200 ${
                  expanded
                    ? "border-2 border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                    : "bg-blue-500 text-white shadow-sm hover:bg-blue-600"
                }`}
              >
                <FaChevronDown
                  className={`text-xs transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                />
                {expanded ? "إغلاق المحاضرة" : "فتح المحاضرة"}
              </button>
            </div>

            {canManage && (
              <div className="flex shrink-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-1">
                <Tooltip label="تعديل المحاضرة">
                  <IconButton
                    aria-label="تعديل المحاضرة"
                    icon={<Icon as={FaEdit} />}
                    size="sm"
                    colorScheme="blue"
                    variant="ghost"
                    borderRadius="xl"
                    onClick={() => handleEditLecture?.(lecture)}
                    data-tour-id={isTourTarget ? "course-lecture-edit" : undefined}
                  />
                </Tooltip>
                <Tooltip label="حذف المحاضرة">
                  <IconButton
                    aria-label="حذف المحاضرة"
                    icon={<Icon as={FaTrash} />}
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    borderRadius="xl"
                    onClick={() => handleDeleteLecture?.(lecture.id, lecture.title || "المحاضرة")}
                    data-tour-id={isTourTarget ? "course-lecture-delete" : undefined}
                  />
                </Tooltip>
                <Tooltip label={isVisible ? "إخفاء عن الطلاب" : "إظهار للطلاب"}>
                  <IconButton
                    aria-label="تبديل الظهور"
                    icon={<Icon as={isVisible ? FaEye : FaEyeSlash} />}
                    isLoading={visibilityLoading}
                    size="sm"
                    colorScheme="blue"
                    variant="ghost"
                    borderRadius="xl"
                    onClick={handleToggleVisibility}
                    data-tour-id={isTourTarget ? "course-lecture-visibility" : undefined}
                  />
                </Tooltip>
                {lectureSupportsActivationCodes(lecture) ? (
                  <Tooltip label="أكواد التفعيل">
                    <IconButton
                      aria-label="أكواد التفعيل"
                      icon={<FaKey />}
                      size="sm"
                      colorScheme="purple"
                      variant="ghost"
                      borderRadius="xl"
                      onClick={codesModal.onOpen}
                    />
                  </Tooltip>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body: الفيديوهات ثم الواجبات ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="bg-slate-50 p-3.5 dark:bg-slate-950/50 sm:p-5">
              {isLockedForViewer ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center sm:flex-row sm:items-center sm:gap-4 sm:p-6 sm:text-right dark:border-slate-600 dark:bg-slate-900">
                  {needsActivationCode ? (
                    <div className="w-full max-w-md space-y-3 text-right">
                      <LectureActivateCodeForm
                        onActivated={() => onRefreshCourse?.()}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-500 text-white sm:h-14 sm:w-14">
                        <FaLock className="text-lg sm:text-xl" />
                      </div>
                      <div className="min-w-0">
                        <p className={`${lcTitleSm} text-slate-800 dark:text-slate-200`}>
                          {accessMeta.label}
                        </p>
                        <p className={`mt-1 ${lcBodySm}`}>
                          {getLectureLockMessage(lecture)}
                        </p>
                        {showActivationTimer ? (
                          <LectureActivationTimer activation={lecture.activation} />
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* الفيديوهات */}
                  <section
                    className="space-y-3"
                    data-tour-id={isTourTarget ? "course-lecture-videos" : undefined}
                  >
                    <SectionHeading
                      icon={FaVideo}
                      label="الفيديوهات"
                      count={videosCount}
                      accent="blue"
                      action={
                        canManage ? (
                          <button
                            type="button"
                            className={`${crBtnSecondary} w-full !px-3.5 !py-2.5 !text-xs sm:w-auto sm:!py-2`}
                            onClick={() => handleAddVideo(lecture.id)}
                            data-tour-id={isTourTarget ? "course-lecture-add-video" : undefined}
                          >
                            <FaPlus />
                            إضافة فيديو
                          </button>
                        ) : null
                      }
                    />
                    {videosCount === 0 ? (
                      <p className={`rounded-2xl border border-dashed border-slate-300 px-3 py-6 text-center ${lcLabel} dark:border-slate-700`}>
                        {canManage ? "لم تُضف فيديوهات بعد — ابدأ بإضافة أول فيديو" : "لا توجد فيديوهات في هذه المحاضرة بعد"}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2.5">
                        {lecture.videos.map((video, index) => (
                          <VideoRow
                            key={video.id}
                            video={video}
                            index={index}
                            canManage={canManage}
                            handleDeleteVideo={handleDeleteVideo}
                          />
                        ))}
                      </div>
                    )}
                  </section>

                  {/* الواجبات */}
                  {!hideLectureAssignments && (canManage || hasAssignments) && (
                    <section
                      className="space-y-3"
                      data-tour-id={isTourTarget ? "course-lecture-assignments" : undefined}
                    >
                      <SectionHeading
                        icon={FaTasks}
                        label="الواجبات"
                        count={assignmentsCount}
                        accent="orange"
                        action={
                          canManage ? (
                            <button
                              type="button"
                              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-orange-600 sm:w-auto sm:py-2"
                              onClick={() =>
                                openExamModal("add", {
                                  title: suggestedAssignmentTitle,
                                  type: "assignment",
                                  total_grade: 20,
                                  is_visible: true,
                                  lock_next_lectures: true,
                                })
                              }
                              data-tour-id={isTourTarget ? "course-lecture-add-assignment" : undefined}
                            >
                              <FaPlus />
                              إضافة واجب
                            </button>
                          ) : null
                        }
                      />
                      {examLoading && canManage && !hasAssignments ? (
                        <p className={`rounded-2xl border border-dashed border-slate-300 px-3 py-6 text-center ${lcLabel} dark:border-slate-700`}>
                          جاري تحميل الواجبات...
                        </p>
                      ) : hasAssignments ? (
                        <div className="grid grid-cols-1 gap-2.5">
                          {assignments.map((assignment) => (
                            <AssignmentRow
                              key={assignment.id}
                              exam={assignment}
                              canManage={canManage}
                              progress={progress}
                              examActionLoading={examActionLoading}
                              openExamModal={openExamModal}
                              openDeleteExamDialog={openDeleteExamDialog}
                            />
                          ))}
                        </div>
                      ) : (
                        canManage && (
                          <p className={`rounded-2xl border border-dashed border-slate-300 px-3 py-6 text-center ${lcLabel} dark:border-slate-700`}>
                            لم يُنشأ أي واجب بعد — يمكنك إضافة أكثر من واجب لنفس المحاضرة
                          </p>
                        )
                      )}
                    </section>
                  )}

                  {/* Footer meta */}
                  <div className={`flex flex-col gap-1.5 border-t border-slate-200 pt-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2 ${lcCaption} dark:border-slate-800`}>
                    <span>{formatDate ? formatDate(lecture.created_at) : lecture.created_at}</span>
                    {!canManage && progress && videosCount > 0 && (
                      <span>
                        {progress.watched_videos}/{progress.total_videos} فيديو
                        {hasAssignments &&
                          (allAssignmentsPassed
                            ? " • الواجبات مكتملة"
                            : " • توجد واجبات غير مكتملة")}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LectureActivationCodesModal
        isOpen={codesModal.isOpen}
        onClose={() => {
          codesModal.onClose();
          onCodesModalClosed?.();
        }}
        lecture={lecture}
      />
    </motion.article>
  );
};

export default LectureCard;
