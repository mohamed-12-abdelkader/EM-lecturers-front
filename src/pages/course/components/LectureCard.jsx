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
  lcStatLabel,
  lcStatValue,
  lcTab,
  lcTitle,
  lcTitleSm,
} from "../courseTheme";

const EASE = [0.22, 1, 0.36, 1];

const CONTENT_TABS = [
  { id: "videos", label: "الفيديوهات", icon: FaVideo, tone: "blue" },
  { id: "files", label: "الملفات", icon: FaFilePdf, tone: "orange" },
  { id: "homework", label: "الواجب", icon: FaTasks, tone: "purple" },
  { id: "comments", label: "التعليقات", icon: FaComments, tone: "teal" },
];

const TONE = {
  blue: {
    chip: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
    icon: "bg-blue-500 text-white",
    tab: "bg-blue-500 text-white shadow-[0_4px_12px_rgba(49,130,206,0.3)]",
    tabIdle: "text-slate-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:bg-blue-950/30",
    accent: "border-blue-500",
  },
  orange: {
    chip: "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900",
    icon: "bg-orange-500 text-white",
    tab: "bg-orange-500 text-white shadow-[0_4px_12px_rgba(221,107,32,0.3)]",
    tabIdle: "text-slate-600 hover:bg-orange-50 dark:text-slate-400 dark:hover:bg-orange-950/30",
    accent: "border-orange-500",
  },
  purple: {
    chip: "bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-900",
    icon: "bg-violet-500 text-white",
    tab: "bg-violet-500 text-white shadow-[0_4px_12px_rgba(139,92,246,0.3)]",
    tabIdle: "text-slate-600 hover:bg-violet-50 dark:text-slate-400 dark:hover:bg-violet-950/30",
    accent: "border-violet-500",
  },
  teal: {
    chip: "bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900",
    icon: "bg-teal-500 text-white",
    tab: "bg-teal-500 text-white shadow-[0_4px_12px_rgba(20,184,166,0.3)]",
    tabIdle: "text-slate-600 hover:bg-teal-50 dark:text-slate-400 dark:hover:bg-teal-950/30",
    accent: "border-teal-500",
  },
};

function getVideoStatus(video) {
  if (video.is_completed) return { label: "مكتمل", tone: "green", icon: FaCheckCircle };
  if (video.is_watched) return { label: "تمت المشاهدة", tone: "blue", icon: FaEye };
  return { label: "لم يُشاهد", tone: "slate", icon: FaPlay };
}

function getExamStatus(exam) {
  if (!exam) return null;
  if (exam.is_solved) return { label: "تم الحل", tone: "green", cta: "عرض النتيجة", icon: FaCheckCircle };
  if (exam.in_progress || exam.is_started) return { label: "قيد التنفيذ", tone: "orange", cta: "متابعة الواجب", icon: FaPen };
  return { label: "لم يُبدأ", tone: "slate", cta: "ابدأ الواجب", icon: FaPen };
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
    <div className="relative h-16 w-16 shrink-0">
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
          className={complete ? "text-emerald-500" : "text-blue-500"}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${lcIndex} text-slate-700 dark:text-slate-200`}>{percent}%</span>
      </div>
    </div>
  );
}

function StatBlock({ icon: IconComp, value, label, tone = "blue" }) {
  const t = TONE[tone] || TONE.blue;
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${t.chip}`}>
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.icon}`}>
        <IconComp className="text-sm" />
      </div>
      <div className="text-right">
        <p className={lcStatValue}>{value}</p>
        <p className={`mt-0.5 ${lcStatLabel}`}>{label}</p>
      </div>
    </div>
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
      className={`group overflow-hidden rounded-2xl border bg-white transition-all duration-200 dark:bg-slate-900 ${
        isDone
          ? "border-emerald-200 dark:border-emerald-800"
          : isStarted
            ? "border-blue-200 dark:border-blue-800"
            : "border-slate-200 dark:border-slate-700"
      } hover:shadow-md`}
    >
      <div className="flex flex-col gap-0 sm:flex-row sm:items-stretch">
        {/* Thumbnail / play zone */}
        <div
          className={`relative flex min-h-[88px] w-full shrink-0 items-center justify-center sm:w-36 ${
            isDone ? "bg-emerald-50 dark:bg-emerald-950/30" : isStarted ? "bg-blue-50 dark:bg-blue-950/30" : "bg-slate-100 dark:bg-slate-800"
          }`}
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-md ${
              isDone ? "bg-emerald-500" : isStarted ? "bg-blue-500" : "bg-slate-400"
            } text-white`}
          >
            {isDone ? <FaCheckCircle className="text-lg" /> : <FaPlay className="text-lg" />}
          </div>
          <span className={`absolute left-3 top-3 rounded-lg bg-black/50 px-2 py-0.5 ${lcBadge} text-white`}>
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col justify-between gap-3 p-4 text-right" dir="rtl">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h4 className={lcTitleSm}>{video.title || `الفيديو ${index + 1}`}</h4>
              {!canManage && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${lcBadge} ${
                    status.tone === "green"
                      ? "bg-emerald-100 text-emerald-700"
                      : status.tone === "blue"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <status.icon className="text-[9px]" />
                  {status.label}
                </span>
              )}
            </div>
            <div className={`mt-1.5 flex flex-wrap gap-3 ${lcCaption}`}>
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
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 ${lcBtn} transition-all duration-200 ${
                isDone
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : isStarted
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
      className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-gradient-to-bl from-orange-50/80 to-white p-4 transition-all duration-200 hover:border-orange-200 hover:shadow-md dark:border-orange-900/50 dark:from-orange-950/20 dark:to-slate-900"
      dir="rtl"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
        <FaFilePdf className="text-lg" />
      </div>
      <div className="min-w-0 flex-1 text-right">
        <p className={`truncate ${lcTitleSm}`}>{file.title || "ملف PDF"}</p>
        <p className={lcCaption}>ملف مرفق للتحميل</p>
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        {file.file_url && (
          <a
            href={file.file_url}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-1.5 ${lcBtn} text-white transition-colors hover:bg-orange-600`}
          >
            <FaDownload className="text-[10px]" />
            تحميل
          </a>
        )}
        {canManage && (
          <button
            type="button"
            aria-label="حذف الملف"
            className="cursor-pointer rounded-lg p-1 text-red-500 hover:bg-red-50"
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
    <div
      className={`overflow-hidden rounded-2xl border-2 ${
        solved
          ? "border-emerald-200 bg-gradient-to-bl from-emerald-50 to-white dark:border-emerald-800 dark:from-emerald-950/30 dark:to-slate-900"
          : inProgress
            ? "border-orange-200 bg-gradient-to-bl from-orange-50 to-white dark:border-orange-800 dark:from-orange-950/30 dark:to-slate-900"
            : "border-violet-200 bg-gradient-to-bl from-violet-50 to-white dark:border-violet-800 dark:from-violet-950/30 dark:to-slate-900"
      }`}
      dir="rtl"
    >
      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ${
            solved ? "bg-emerald-500" : inProgress ? "bg-orange-500" : "bg-violet-500"
          }`}
        >
          <examStatus.icon className="text-xl" />
        </div>

        <div className="flex-1 text-right">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className={lcTitleSm}>{examToShow.title || "واجب المحاضرة"}</h4>
            {!canManage && examStatus && (
              <span
                className={`rounded-full px-2.5 py-0.5 ${lcBadge} ${
                  solved ? "bg-emerald-100 text-emerald-700" : inProgress ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"
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
                <p className="font-sans text-sm font-semibold text-emerald-600">درجتك: {examToShow.student_submission.score}</p>
              )}
              {progress && (
                <p className={lcCaption}>
                  {progress.exam_solved ? "أنهيت هذا الواجب بنجاح" : "أكمل الواجب لإتمام المحاضرة"}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-start gap-2">
          {!canManage && (
            <Link
              to={`/ComprehensiveExam/${examToShow.id}`}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 ${lcBtn} text-white transition-colors ${
                solved ? "bg-emerald-500 hover:bg-emerald-600" : inProgress ? "bg-orange-500 hover:bg-orange-600" : "bg-violet-500 hover:bg-violet-600"
              }`}
            >
              <examStatus.icon className="text-xs" />
              {examStatus.cta}
            </Link>
          )}
          {canManage && (
            <>
              <Link to={`/ComprehensiveExam/${examToShow.id}`} className={crBtnOutline}>
                <FaCog />
                إدارة
              </Link>
              <button type="button" className={crBtnSecondary} onClick={() => openExamModal("edit", examToShow)}>
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
  const [essayExam, setEssayExam] = React.useState(null);
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

  const fetchEssayExam = async () => {
    if (!lecture.id) return;
    try {
      const token = localStorage.getItem("token");
      const response = await baseUrl.get(`/api/essay-exams/lectures/${lecture.id}/exams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEssayExam(response.data.exams?.length > 0 ? response.data.exams[0] : null);
    } catch {
      setEssayExam(null);
    }
  };

  React.useEffect(() => {
    fetchCommentsStats();
    if (canManage) {
      fetchEssayExam();
      if (lecture.exam) setLectureExam(lecture.exam);
      else fetchLectureExam();
    }
  }, [lecture.id, lecture.exam, canManage]);

  const examToShow = canManage ? lectureExam || lecture.exam : lecture.exam;
  const progress = lecture.progress;
  const videosCount = progress?.total_videos ?? lecture.videos?.length ?? 0;
  const watchedVideos = progress?.watched_videos ?? lecture.videos?.filter((v) => v.is_watched).length ?? 0;
  const filesCount = lecture.files?.length || 0;
  const hasMainExam = !!examToShow;
  const hasEssayExam = !!essayExam;
  const totalExamsCount = Number(hasMainExam) + Number(hasEssayExam);
  const examStatus = getExamStatus(examToShow);
  const progressPercent =
    progress && progress.total_videos > 0
      ? Math.round((progress.watched_videos / progress.total_videos) * 100)
      : videosCount > 0
        ? Math.round((watchedVideos / videosCount) * 100)
        : 0;
  const isLectureComplete = progress?.all_videos_watched && (!hasMainExam || progress?.exam_solved);
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

  const visibleTabs = CONTENT_TABS.filter((tab) => {
    if (tab.id === "videos") return videosCount > 0 || lecture.videos?.length > 0 || canManage;
    if (tab.id === "files") return filesCount > 0 || canManage;
    if (tab.id === "homework") return canManage || hasMainExam;
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
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-blue-500 via-blue-400 to-orange-500" aria-hidden />

        <div className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:p-5">
          {/* Index + progress */}
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500 ${lcIndex} text-white shadow-[0_8px_20px_rgba(49,130,206,0.35)]`}>
              {lectureIndex + 1}
            </div>
            {!canManage && videosCount > 0 && <ProgressRing percent={progressPercent} complete={isLectureComplete} />}
          </div>

          {/* Title block */}
          <div className="min-w-0 flex-1 text-right">
            <div className="mb-2 flex flex-wrap items-center justify-start gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 ${lcBadge} ${
                  lecture.locked ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {lecture.locked ? "مغلق" : "مفتوح"}
              </span>
              {canManage && (
                <span className={`rounded-full px-2.5 py-0.5 ${lcBadge} ${isVisible ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                  {isVisible ? "ظاهر" : "مخفي"}
                </span>
              )}
              {!canManage && isLectureComplete && (
                <span className={`rounded-full bg-emerald-100 px-2.5 py-0.5 ${lcBadge} text-emerald-700`}>مكتملة</span>
              )}
              <span className={`${crEyebrow} !text-[11px]`}>محاضرة {lectureIndex + 1}</span>
            </div>

            <button
              type="button"
              className="group flex w-full cursor-pointer items-start justify-between gap-3 text-right"
              onClick={() => setExpanded((v) => !v)}
            >
              <div className="min-w-0 flex-1">
                <h3 className={`${lcTitle} transition-colors group-hover:text-blue-500`}>
                  {lecture.title}
                </h3>
                {lectureDescription && (
                  <p className={`mt-1.5 line-clamp-2 ${lcBody}`}>{lectureDescription}</p>
                )}
              </div>
              <FaChevronDown
                className={`mt-1 shrink-0 text-slate-400 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              />
            </button>

            {/* Quick stats */}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {(videosCount > 0 || canManage) && <StatBlock icon={FaVideo} value={videosCount} label="فيديو" tone="blue" />}
              {(filesCount > 0 || canManage) && <StatBlock icon={FaFilePdf} value={filesCount} label="ملف" tone="orange" />}
              {(totalExamsCount > 0 || canManage) && <StatBlock icon={FaTasks} value={totalExamsCount} label="واجب" tone="purple" />}
              <StatBlock icon={FaComments} value={commentsStats.loading ? "…" : commentsStats.total} label="تعليق" tone="teal" />
            </div>
          </div>

          {/* Teacher actions */}
          {canManage && (
            <div className="flex shrink-0 items-center justify-end gap-1 self-start">
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
            <div className="bg-slate-50 p-4 dark:bg-slate-950/50 md:p-5">
              {isLockedForViewer ? (
                <div className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950/30">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-500 text-white">
                    <FaLock className="text-xl" />
                  </div>
                  <div className="text-right">
                    <p className={`${lcTitleSm} text-red-700 dark:text-red-300`}>هذه المحاضرة مغلقة</p>
                    <p className={`mt-1 ${lcBodySm} text-red-600 dark:text-red-400`}>
                      أكمل واجب المحاضرة السابقة بنجاح لفتح هذا المحتوى.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Content tabs */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {visibleTabs.map((tab) => {
                      const TabIcon = tab.icon;
                      const t = TONE[tab.tone] || TONE.blue;
                      const isActive = activeTab === tab.id;
                      const count =
                        tab.id === "videos"
                          ? videosCount
                          : tab.id === "files"
                            ? filesCount
                            : tab.id === "homework"
                              ? totalExamsCount
                              : commentsStats.total;

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 ${lcTab} transition-all duration-200 ${
                            isActive ? `${t.tab} border-transparent` : `border-slate-200 bg-white ${t.tabIdle} dark:border-slate-700 dark:bg-slate-900`
                          }`}
                        >
                          <TabIcon className="text-sm" />
                          {tab.label}
                          {count > 0 && (
                            <span className={`rounded-full px-1.5 py-0.5 ${lcBadge} ${isActive ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

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
                            <div className="flex justify-end">
                              <button type="button" className={crBtnSecondary} onClick={() => handleAddVideo(lecture.id)}>
                                <FaPlus />
                                إضافة فيديو
                              </button>
                            </div>
                          )}
                          {videosCount === 0 ? (
                            canManage && (
                              <p className={`py-8 text-center ${lcLabel}`}>لم تُضف فيديوهات بعد — ابدأ بإضافة أول فيديو</p>
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
                            <div className="flex justify-end">
                              <button type="button" className={crBtnPrimary} onClick={() => handleAddFile(lecture.id)}>
                                <FaPlus />
                                إضافة ملف
                              </button>
                            </div>
                          )}
                          {filesCount === 0 ? (
                            canManage && <p className={`py-8 text-center ${lcLabel}`}>لم تُرفق ملفات بعد</p>
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
                          {examLoading && canManage ? (
                            <p className={`py-8 text-center ${lcLabel}`}>جاري تحميل الواجب...</p>
                          ) : hasMainExam ? (
                            <HomeworkCard
                              examToShow={examToShow}
                              examStatus={examStatus}
                              canManage={canManage}
                              progress={progress}
                              examActionLoading={examActionLoading}
                              openExamModal={openExamModal}
                              openDeleteExamDialog={openDeleteExamDialog}
                            />
                          ) : (
                            canManage && (
                              <div className="flex justify-center py-10">
                                <button type="button" className={crBtnSecondary} onClick={() => openExamModal("add", null)}>
                                  <FaPlus />
                                  إضافة واجب للمحاضرة
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {activeTab === "comments" && (
                        <div className="rounded-2xl border border-teal-100 bg-white p-6 text-center dark:border-teal-900 dark:bg-slate-900">
                          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500 text-white">
                            <FaComments className="text-xl" />
                          </div>
                          <p className={`${lcTitle} text-base`}>
                            {commentsStats.loading ? "…" : commentsStats.total} تعليق
                          </p>
                          <p className={`mt-1 ${lcLabel}`}>شارك أسئلتك وناقش مع زملائك</p>
                          <Link to={`/lecture/${lecture.id}/comments`} className={`${crBtnOutline} mt-5 border-teal-500 text-teal-600 hover:bg-teal-50`}>
                            <FaComments />
                            فتح التعليقات
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Footer meta */}
                  <div className={`mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4 ${lcCaption} dark:border-slate-800`}>
                    <span>{formatDate ? formatDate(lecture.created_at) : lecture.created_at}</span>
                    {!canManage && progress && videosCount > 0 && (
                      <span>
                        {progress.watched_videos}/{progress.total_videos} فيديو
                        {hasMainExam && (progress.exam_solved ? " • الواجب محلول" : " • الواجب لم يُحل")}
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
