import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Icon,
  IconButton,
  Tooltip,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import {
  FaLock,
  FaEdit,
  FaTrash,
  FaPlus,
  FaVideo,
  FaFilePdf,
  FaEye,
  FaEyeSlash,
  FaComments,
  FaTasks,
  FaCog,
  FaPlay,
  FaDownload,
  FaPen,
  FaCheckCircle,
  FaRedo,
  FaChevronDown,
  FaClock,
} from "react-icons/fa";
import baseUrl from "../../../api/baseUrl";
import { Link } from "react-router-dom";
import {
  crBtnOutline,
  crBtnPrimary,
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

const EASE = [0.22, 1, 0.36, 1];

const CONTENT_TABS = [
  { id: "videos", label: "الفيديوهات", icon: FaVideo },
  { id: "files", label: "الملفات", icon: FaFilePdf },
  { id: "homework", label: "الواجبات", icon: FaTasks },
  { id: "comments", label: "التعليقات", icon: FaComments },
];

function getVideoStatus(video) {
  if (video.is_completed) return { label: "مكتمل", tone: "done", icon: FaCheckCircle };
  if (video.is_watched) return { label: "تمت المشاهدة", tone: "active", icon: FaEye };
  return { label: "لم يُشاهد", tone: "idle", icon: FaPlay };
}

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

function formatViewedAt(dateStr, formatDate) {
  if (!dateStr) return null;
  return formatDate ? formatDate(dateStr) : new Date(dateStr).toLocaleDateString("ar-EG");
}

function ProgressRing({ percent, complete }) {
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
          className={complete ? "text-blue-500" : "text-blue-500"}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${lcIndex} text-xs text-slate-700 sm:text-sm md:text-lg dark:text-slate-200`}>{percent}%</span>
      </div>
    </div>
  );
}

function StatTab({ icon: IconComp, value, label, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 w-full cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2.5 text-right transition-all duration-200 sm:px-3 ${
        isActive
          ? "border-blue-500 bg-blue-500 text-white shadow-[0_4px_14px_rgba(49,130,206,0.3)]"
          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
      }`}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8 ${
          isActive
            ? "bg-white/20 text-white"
            : "bg-blue-50 text-blue-500 dark:bg-blue-950/40 dark:text-blue-400"
        }`}
      >
        <IconComp className="text-xs sm:text-sm" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate font-heading text-sm font-bold tabular-nums ${isActive ? "text-white" : "text-slate-900 dark:text-white"}`}>
          {value}
        </p>
        <p className={`mt-0.5 truncate font-sans text-[11px] font-medium ${isActive ? "text-white/90" : "text-slate-500"}`}>
          {label}
        </p>
      </div>
    </button>
  );
}

function VideoTile({ video, index, canManage, formatDate, handleDeleteVideo }) {
  const status = getVideoStatus(video);
  const viewedLabel = formatViewedAt(video.viewed_at, formatDate);
  const btnLabel = video.is_completed ? "إعادة المشاهدة" : video.is_watched ? "متابعة" : "مشاهدة";
  const isDone = video.is_completed;
  const isStarted = video.is_watched && !video.is_completed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: EASE }}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:border-blue-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-800"
    >
      <div className="flex flex-col gap-0 sm:flex-row sm:items-stretch">
        <div className="relative flex min-h-[72px] w-full shrink-0 items-center justify-center bg-slate-100 sm:min-h-0 sm:w-28 md:w-36 dark:bg-slate-800">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md sm:h-12 sm:w-12 sm:rounded-2xl ${
              isDone || isStarted ? "bg-blue-500" : "bg-slate-400"
            }`}
          >
            {isDone ? <FaCheckCircle className="text-base sm:text-lg" /> : <FaPlay className="text-base sm:text-lg" />}
          </div>
          <span className={`absolute left-2.5 top-2.5 rounded-lg bg-black/50 px-2 py-0.5 ${lcBadge} text-white sm:left-3 sm:top-3`}>
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-3 text-right sm:p-4" dir="rtl">
          <div className="min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h4 className={`min-w-0 break-words ${lcTitleSm}`}>{video.title || `الفيديو ${index + 1}`}</h4>
              {!canManage && (
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 ${lcBadge} ${
                    status.tone === "done" || status.tone === "active"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <status.icon className="text-[9px]" />
                  {status.label}
                </span>
              )}
            </div>
            <div className={`mt-1.5 flex flex-wrap gap-x-3 gap-y-1 ${lcCaption}`}>
              {video.duration && (
                <span className="inline-flex items-center gap-1">
                  <FaClock className="text-[9px]" />
                  {video.duration}
                </span>
              )}
              {viewedLabel && !canManage && <span>آخر مشاهدة: {viewedLabel}</span>}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-2">
            <Link
              to={`/video/${video.id}`}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 sm:px-4 ${lcBtn} transition-all duration-200 ${
                isDone || isStarted
                  ? "border-2 border-blue-500 text-blue-500 hover:bg-blue-50"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {isDone ? <FaRedo className="text-[10px]" /> : <FaPlay className="text-[10px]" />}
              {btnLabel}
            </Link>
            {canManage && (
              <button
                type="button"
                aria-label="حذف الفيديو"
                className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-red-200 p-2 text-red-500 transition-colors hover:bg-red-50"
                onClick={() => handleDeleteVideo(video.id, video.title || "فيديو")}
              >
                <FaTrash className="text-xs" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FileTile({ file, canManage, handleDeleteFile }) {
  return (
    <motion.div
      layout
      className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 transition-all duration-200 hover:border-blue-200 hover:shadow-md sm:gap-3 sm:p-4 dark:border-slate-700 dark:bg-slate-900"
      dir="rtl"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm sm:h-12 sm:w-12">
        <FaFilePdf className="text-base sm:text-lg" />
      </div>
      <div className="min-w-0 flex-1 text-right">
        <p className={`truncate ${lcTitleSm}`}>{file.title || "ملف PDF"}</p>
        <p className={lcCaption}>ملف مرفق للتحميل</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {file.file_url && (
          <a
            href={file.file_url}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-500 px-2.5 py-1.5 sm:px-3 ${lcBtn} text-white transition-colors hover:bg-blue-600`}
          >
            <FaDownload className="text-[10px]" />
            تحميل
          </a>
        )}
        {canManage && (
          <button
            type="button"
            aria-label="حذف الملف"
            className="inline-flex cursor-pointer items-center justify-center rounded-lg p-1.5 text-red-500 hover:bg-red-50"
            onClick={() => handleDeleteFile(file.id, file.title || "ملف")}
          >
            <FaTrash className="text-xs" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function HomeworkCard({
  examToShow,
  examStatus,
  canManage,
  progress,
  examActionLoading,
  openExamModal,
  openDeleteExamDialog,
}) {
  if (!examToShow) return null;
  const solved = examToShow.is_solved;
  const inProgress = examToShow.in_progress || examToShow.is_started;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" dir="rtl">
      <div className="flex flex-col gap-3 p-3.5 sm:gap-4 sm:p-5 md:flex-row md:items-center">
        <div className="flex items-start gap-3 md:contents">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-md sm:h-14 sm:w-14 sm:rounded-2xl">
            <examStatus.icon className="text-lg sm:text-xl" />
          </div>

          <div className="min-w-0 flex-1 text-right">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className={`min-w-0 break-words ${lcTitleSm}`}>{examToShow.title || "واجب المحاضرة"}</h4>
              {!canManage && examStatus && (
                <span
                  className={`rounded-full px-2.5 py-0.5 ${lcBadge} ${
                    solved || inProgress ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {examStatus.label}
                </span>
              )}
            </div>
            {canManage ? (
              <p className={`mt-1 ${lcCaption}`}>
                الدرجة: {examToShow.total_grade ?? "—"} • المدة: {examToShow.duration ?? "—"} دقيقة
              </p>
            ) : (
              <div className="mt-1 space-y-0.5">
                {examToShow.student_submission?.score != null && (
                  <p className="font-sans text-sm font-semibold text-blue-600">درجتك: {examToShow.student_submission.score}</p>
                )}
                {progress && (
                  <p className={lcCaption}>
                    {examToShow.is_solved
                      ? "أنهيت هذا الواجب بنجاح"
                      : "أكمل الواجب بنجاح لفتح المحاضرات التالية إن كان مقفلاً لها"}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 md:shrink-0 md:justify-end">
          {!canManage && (
            <Link
              to={`/ComprehensiveExam/${examToShow.id}`}
              className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 sm:w-auto sm:px-5 ${lcBtn} text-white transition-colors ${
                solved ? "bg-blue-500 hover:bg-blue-600" : inProgress ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              <examStatus.icon className="text-xs" />
              {examStatus.cta}
            </Link>
          )}
          {canManage && (
            <>
              <Link to={`/ComprehensiveExam/${examToShow.id}`} className={`${crBtnOutline} !px-3 !py-2 sm:!px-5 sm:!py-2.5`}>
                <FaCog />
                إدارة
              </Link>
              <button type="button" className={`${crBtnSecondary} !px-3 !py-2 sm:!px-5 sm:!py-2.5`} onClick={() => openExamModal("edit", examToShow)}>
                <FaEdit />
                تعديل
              </button>
              <button
                type="button"
                aria-label="حذف الواجب"
                className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-red-200 p-2.5 text-red-500 hover:bg-red-50 disabled:opacity-50"
                disabled={examActionLoading}
                onClick={() => openDeleteExamDialog(examToShow)}
              >
                {examActionLoading ? <Spinner size="sm" /> : <FaTrash />}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const LectureCard = ({
  lecture,
  lectureIndex = 0,
  isTeacher,
  isAdmin,
  handleEditLecture,
  handleDeleteLecture,
  handleAddVideo,
  handleDeleteVideo,
  handleAddFile,
  handleDeleteFile,
  setExamModal,
  setDeleteExamDialog,
  examActionLoading,
  formatDate,
}) => {
  const toast = useToast();
  const [expanded, setExpanded] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("videos");
  const [visibilityLoading, setVisibilityLoading] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(lecture.is_visible ?? true);
  const [lectureExam, setLectureExam] = React.useState(null);
  const [examLoading, setExamLoading] = React.useState(false);
  const [commentsStats, setCommentsStats] = React.useState({ total: 0, loading: false });
  const canManage = isTeacher || isAdmin;

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

  const fetchCommentsStats = async () => {
    if (!lecture.id) return;
    setCommentsStats((prev) => ({ ...prev, loading: true }));
    try {
      const token = localStorage.getItem("token");
      const response = await baseUrl.get(`/api/lecture/${lecture.id}/comments/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCommentsStats({ total: response.data.total || 0, loading: false });
    } catch {
      setCommentsStats((prev) => ({ ...prev, loading: false }));
    }
  };

  React.useEffect(() => {
    fetchCommentsStats();
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

  const progress = lecture.progress;
  const videosCount = progress?.total_videos ?? lecture.videos?.length ?? 0;
  const watchedVideos = progress?.watched_videos ?? lecture.videos?.filter((v) => v.is_watched).length ?? 0;
  const filesCount = lecture.files?.length || 0;

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
  const lectureDescription = lecture.description || lecture.objective || "";

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

  const visibleTabs = CONTENT_TABS.filter((tab) => {
    if (tab.id === "videos") return videosCount > 0 || lecture.videos?.length > 0 || canManage;
    if (tab.id === "files") return filesCount > 0 || canManage;
    if (tab.id === "homework") return canManage || hasAssignments;
    return true;
  });

  React.useEffect(() => {
    if (!visibleTabs.find((t) => t.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id || "videos");
    }
  }, [visibleTabs, activeTab]);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className={`${crCard} ${lcRoot} overflow-hidden`}
      dir="rtl"
    >
      {/* ── Header ── */}
      <div className="relative border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-blue-500 to-orange-500" aria-hidden />

        <div className="space-y-3 p-3.5 sm:space-y-4 sm:p-5">
          {/* Top row: index + content + actions */}
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500 ${lcIndex} text-base text-white shadow-[0_8px_20px_rgba(49,130,206,0.25)] sm:h-14 sm:w-14 sm:rounded-2xl sm:text-lg`}>
                {lectureIndex + 1}
              </div>
              {!canManage && videosCount > 0 && <ProgressRing percent={progressPercent} complete={isLectureComplete} />}
            </div>

            <div className="min-w-0 flex-1 text-right">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5 sm:mb-2 sm:gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 ${lcBadge} sm:px-2.5 ${
                    lecture.locked ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {lecture.locked ? "مغلق" : "مفتوح"}
                </span>
                {canManage && (
                  <span className={`rounded-full px-2 py-0.5 ${lcBadge} sm:px-2.5 ${isVisible ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                    {isVisible ? "ظاهر" : "مخفي"}
                  </span>
                )}
                {!canManage && isLectureComplete && (
                  <span className={`rounded-full bg-blue-50 px-2 py-0.5 ${lcBadge} text-blue-600 sm:px-2.5`}>مكتملة</span>
                )}
                <span className={`${crEyebrow} !px-2 !py-0.5 !text-[10px] sm:!px-3 sm:!py-1 sm:!text-[11px]`}>محاضرة {lectureIndex + 1}</span>
              </div>

              <button
                type="button"
                className="group flex w-full cursor-pointer items-start justify-between gap-2 text-right sm:gap-3"
                onClick={() => setExpanded((v) => !v)}
              >
                <div className="min-w-0 flex-1">
                  <h3 className={`${lcTitle} break-words transition-colors group-hover:text-blue-500`}>
                    {lecture.title}
                  </h3>
                  {lectureDescription && (
                    <p className={`mt-1 line-clamp-2 sm:mt-1.5 ${lcBody}`}>{lectureDescription}</p>
                  )}
                </div>
                <FaChevronDown
                  className={`mt-1 shrink-0 text-slate-400 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                />
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
                  />
                </Tooltip>
              </div>
            )}
          </div>

          {/* Stats tabs — المجموعات في الأعلى هي التبويبات */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {visibleTabs.map((tab) => {
              const count =
                tab.id === "videos"
                  ? videosCount
                  : tab.id === "files"
                    ? filesCount
                    : tab.id === "homework"
                      ? assignmentsCount
                      : commentsStats.loading
                        ? "…"
                        : commentsStats.total;
              const shortLabel =
                tab.id === "videos"
                  ? "فيديو"
                  : tab.id === "files"
                    ? "ملف"
                    : tab.id === "homework"
                      ? "واجب"
                      : "تعليق";

              return (
                <StatTab
                  key={tab.id}
                  icon={tab.icon}
                  value={count}
                  label={shortLabel}
                  isActive={expanded && activeTab === tab.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab(tab.id);
                    setExpanded(true);
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
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
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-500 text-white sm:h-14 sm:w-14">
                    <FaLock className="text-lg sm:text-xl" />
                  </div>
                  <div className="min-w-0">
                    <p className={`${lcTitleSm} text-slate-800 dark:text-slate-200`}>هذه المحاضرة مغلقة</p>
                    <p className={`mt-1 ${lcBodySm}`}>
                      أكمل كل واجبات المحاضرات السابقة بنجاح لفتح هذا المحتوى.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Tab panels */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                    >
                      {activeTab === "videos" && (
                        <div className="space-y-3">
                          {canManage && (
                            <div className="flex justify-stretch sm:justify-end">
                              <button type="button" className={`${crBtnSecondary} w-full !px-4 !py-2.5 sm:w-auto sm:!px-5`} onClick={() => handleAddVideo(lecture.id)}>
                                <FaPlus />
                                إضافة فيديو
                              </button>
                            </div>
                          )}
                          {videosCount === 0 ? (
                            canManage && (
                              <p className={`px-2 py-8 text-center ${lcLabel}`}>لم تُضف فيديوهات بعد — ابدأ بإضافة أول فيديو</p>
                            )
                          ) : (
                            <div className="grid gap-3">
                              {lecture.videos.map((video, index) => (
                                <VideoTile
                                  key={video.id}
                                  video={video}
                                  index={index}
                                  canManage={canManage}
                                  formatDate={formatDate}
                                  handleDeleteVideo={handleDeleteVideo}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === "files" && (
                        <div className="space-y-3">
                          {canManage && (
                            <div className="flex justify-stretch sm:justify-end">
                              <button type="button" className={`${crBtnPrimary} w-full !px-4 !py-2.5 sm:w-auto sm:!px-5`} onClick={() => handleAddFile(lecture.id)}>
                                <FaPlus />
                                إضافة ملف
                              </button>
                            </div>
                          )}
                          {filesCount === 0 ? (
                            canManage && <p className={`px-2 py-8 text-center ${lcLabel}`}>لم تُرفق ملفات بعد</p>
                          ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                              {lecture.files.map((file) => (
                                <FileTile key={file.id} file={file} canManage={canManage} handleDeleteFile={handleDeleteFile} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === "homework" && (
                        <div className="space-y-3">
                          {canManage && (
                            <div className="flex justify-stretch sm:justify-end">
                              <button
                                type="button"
                                className={`${crBtnSecondary} w-full !px-4 !py-2.5 sm:w-auto sm:!px-5`}
                                onClick={() =>
                                  openExamModal("add", {
                                    title: suggestedAssignmentTitle,
                                    type: "assignment",
                                    total_grade: 20,
                                    is_visible: true,
                                    lock_next_lectures: true,
                                  })
                                }
                              >
                                <FaPlus />
                                إضافة واجب
                              </button>
                            </div>
                          )}

                          {examLoading && canManage && !hasAssignments ? (
                            <p className={`px-2 py-8 text-center ${lcLabel}`}>جاري تحميل الواجبات...</p>
                          ) : hasAssignments ? (
                            <div className="grid gap-3">
                              {assignments.map((assignment) => (
                                <HomeworkCard
                                  key={assignment.id}
                                  examToShow={assignment}
                                  examStatus={getExamStatus(assignment)}
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
                              <p className={`px-2 py-8 text-center ${lcLabel}`}>
                                لم يُنشأ أي واجب بعد — يمكنك إضافة أكثر من واجب لنفس المحاضرة
                              </p>
                            )
                          )}
                        </div>
                      )}

                      {activeTab === "comments" && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center sm:p-6 dark:border-slate-700 dark:bg-slate-900">
                          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500 text-white sm:h-14 sm:w-14">
                            <FaComments className="text-lg sm:text-xl" />
                          </div>
                          <p className={`${lcTitle} text-base`}>
                            {commentsStats.loading ? "…" : commentsStats.total} تعليق
                          </p>
                          <p className={`mt-1 ${lcLabel}`}>شارك أسئلتك وناقش مع زملائك</p>
                          <Link to={`/lecture/${lecture.id}/comments`} className={`${crBtnOutline} mt-5 w-full sm:w-auto`}>
                            <FaComments />
                            فتح التعليقات
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Footer meta */}
                  <div className={`mt-4 flex flex-col gap-1.5 border-t border-slate-200 pt-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2 sm:pt-4 ${lcCaption} dark:border-slate-800`}>
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
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};

export default LectureCard;
