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
  FaFilePdf,
} from "react-icons/fa";
import baseUrl from "../../../api/baseUrl";
import { Link } from "react-router-dom";
import {
  buildCourseFileViewPath,
  courseFilesApiError,
  formatCourseFileSize,
  getCourseFileDisplayName,
} from "../../../api/courseFilesApi";
import { useLectureFileMutations, useLectureFiles } from "../../../Hooks/course/useCourseFiles";
import DeleteCourseFileModal from "./DeleteCourseFileModal";
import EditCourseFileModal from "./EditCourseFileModal";
import UploadCourseFileModal from "./UploadCourseFileModal";
import { buildExamReportPath } from "../../exam/utils/examReportUtils";
import {
  crCard,
  crEyebrow,
  lcBody,
  lcBodySm,
  lcCaption,
  lcIndex,
  lcLabel,
  lcRoot,
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
import { formatLectureExamDurationLabel } from "../../../utils/examFlowUtils";

const EASE = [0.22, 1, 0.36, 1];

function normalizeLectureFile(file) {
  if (!file || typeof file !== "object") return null;
  return {
    id: file.id,
    courseId: file.courseId ?? file.course_id ?? null,
    title: file.title || file.filename || file.name || "",
    description: file.description || "",
    originalName: file.originalName ?? file.original_name ?? file.filename ?? "",
    fileSize: file.fileSize ?? file.file_size ?? 0,
    createdAt: file.createdAt ?? file.created_at ?? file.uploaded_at ?? null,
  };
}

function StudentFileCard({ file, courseId }) {
  const name = getCourseFileDisplayName(file);
  const sizeLabel = formatCourseFileSize(file.fileSize);
  const viewPath = buildCourseFileViewPath(courseId, file);

  const inner = (
    <div
      className="flex items-center gap-2.5 rounded-xl border border-violet-100 bg-white px-2.5 py-2 transition-colors hover:border-violet-300 dark:border-violet-900/50 dark:bg-slate-900 dark:hover:border-violet-700"
      dir="rtl"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
        <FaFilePdf className="text-xs" />
      </div>
      <div className="min-w-0 flex-1 text-right">
        <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{name}</p>
        {sizeLabel ? <p className={`mt-0.5 ${lcLabel}`}>{sizeLabel}</p> : null}
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-[11px] font-bold text-white">
        <FaEye className="text-[9px]" />
        فتح
      </span>
    </div>
  );

  if (!viewPath) {
    return <div className="opacity-70">{inner}</div>;
  }

  return (
    <Link to={viewPath} className="block">
      {inner}
    </Link>
  );
}

function LecturePdfRow({ file, courseId, canManage, onEdit, onDelete }) {
  if (!canManage) {
    return <StudentFileCard file={file} courseId={courseId} />;
  }

  const name = getCourseFileDisplayName(file);
  const sizeLabel = formatCourseFileSize(file.fileSize);
  const viewPath = buildCourseFileViewPath(courseId, file);

  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-violet-100 bg-white px-2.5 py-2 transition-colors hover:border-violet-300 dark:border-violet-900/50 dark:bg-slate-900 dark:hover:border-violet-700"
      dir="rtl"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
        <FaFilePdf className="text-xs" />
      </div>
      <div className="min-w-0 flex-1 text-right">
        <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{name}</p>
        {sizeLabel ? <p className={`mt-0.5 ${lcLabel}`}>{sizeLabel}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {viewPath ? (
          <Link
            to={viewPath}
            aria-label={`عرض ${name}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40"
          >
            <FaEye className="text-xs" />
          </Link>
        ) : null}
        <button
          type="button"
          aria-label={`تعديل ${name}`}
          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
          onClick={() => onEdit(file)}
        >
          <FaEdit className="text-xs" />
        </button>
        <button
          type="button"
          aria-label={`حذف ${name}`}
          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
          onClick={() => onDelete(file)}
        >
          <FaTrash className="text-xs" />
        </button>
      </div>
    </div>
  );
}

function getExamStatus(exam) {
  if (!exam) return null;
  if (exam.is_solved) return { label: "تم الحل", tone: "done", cta: "عرض النتيجة", icon: FaCheckCircle };
  if (exam.can_resume || exam.in_progress || exam.is_started) {
    return { label: "قيد التنفيذ", tone: "active", cta: "متابعة الواجب", icon: FaPen };
  }
  if (exam.availability_status === "expired" || exam.can_start === false) {
    return { label: "انتهى — لا يمكن الدخول", tone: "closed", cta: "انتهى — لا يمكن الدخول", icon: FaPen };
  }
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

/** عنوان قسم داخل جسم المحاضرة (الفيديوهات / الملفات / الواجبات) */
function SectionHeading({ icon: IconComp, label, count, accent = "blue", action }) {
  const tones = {
    blue: {
      icon: "bg-blue-500",
      badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    },
    purple: {
      icon: "bg-violet-600",
      badge: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
    },
    orange: {
      icon: "bg-orange-500",
      badge: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
    },
  };
  const tone = tones[accent] || tones.blue;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white ${tone.icon}`}
        >
          <IconComp className="text-[11px]" />
        </div>
        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 sm:text-sm">{label}</h4>
        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${tone.badge}`}>
          {count}
        </span>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** لوحة قسم بمحتوى واضح داخل المحاضرة */
function ContentSection({ accent = "blue", children, className = "", ...rest }) {
  const tones = {
    blue: "border-blue-100 dark:border-blue-900/50",
    purple: "border-violet-100 dark:border-violet-900/50",
    orange: "border-orange-100 dark:border-orange-900/50",
  };
  const bar = {
    blue: "bg-blue-500",
    purple: "bg-violet-600",
    orange: "bg-orange-500",
  };

  return (
    <section
      className={`relative overflow-hidden rounded-xl border bg-white p-2.5 dark:bg-slate-900 ${tones[accent] || tones.blue} ${className}`}
      {...rest}
    >
      <span
        className={`absolute inset-y-2 start-0 w-0.5 rounded-full ${bar[accent] || bar.blue}`}
        aria-hidden
      />
      <div className="space-y-2 ps-2">{children}</div>
    </section>
  );
}

/** شريحة ملخص عنصر داخل الهيدر */
function ContentChip({ icon: IconComp, label, count, tone = "blue", active = true }) {
  const tones = {
    blue: active
      ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
      : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
    purple: active
      ? "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300"
      : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
    orange: active
      ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300"
      : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold sm:gap-1.5 sm:rounded-full sm:px-2.5 sm:text-xs ${tones[tone]}`}
    >
      <IconComp className="text-[10px]" />
      <span className="tabular-nums">{count}</span>
      <span className="hidden opacity-80 sm:inline">{label}</span>
    </span>
  );
}

function videoWatchState(video) {
  if (video?.is_completed) {
    return {
      key: "done",
      label: "اكتملت المشاهدة",
      cta: "إعادة المشاهدة",
      icon: FaRedo,
      chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      accent: "border-emerald-200 dark:border-emerald-800",
      button: "border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40",
    };
  }
  if (video?.is_watched) {
    return {
      key: "started",
      label: "بدأت المشاهدة",
      cta: "متابعة المشاهدة",
      icon: FaPlay,
      chip: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
      accent: "border-blue-300 dark:border-blue-700",
      button: "bg-blue-500 text-white hover:bg-blue-600",
    };
  }
  return {
    key: "idle",
    label: "لم يُشاهد بعد",
    cta: "شاهد الآن",
    icon: FaPlay,
    chip: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    accent: "border-slate-200 dark:border-slate-700",
    button: "bg-blue-500 text-white hover:bg-blue-600",
  };
}

function StudentVideoCard({ video, index, recommended }) {
  const state = videoWatchState(video);
  const CtaIcon = state.icon;
  const isDone = state.key === "done";
  const isStarted = state.key === "started";

  return (
    <Link
      to={`/video/${video.id}`}
      className={`flex items-center gap-2.5 rounded-xl border bg-white px-2.5 py-2 transition-colors dark:bg-slate-900 ${
        recommended
          ? "border-blue-300 dark:border-blue-600"
          : "border-slate-200 hover:border-blue-300 dark:border-slate-700 dark:hover:border-blue-700"
      }`}
      dir="rtl"
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white ${
          isDone ? "bg-emerald-500" : isStarted ? "bg-blue-500" : "bg-blue-500"
        }`}
      >
        {isDone ? <FaCheckCircle className="text-xs" /> : <FaPlay className="ms-px text-[10px]" />}
      </span>
      <div className="min-w-0 flex-1 text-right">
        <div className="flex items-center gap-1.5">
          <h5 className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
            {video.title || `الفيديو ${index + 1}`}
          </h5>
          {recommended ? (
            <span className="shrink-0 rounded bg-orange-50 px-1 py-px text-[9px] font-bold text-orange-600 dark:bg-orange-950/40 dark:text-orange-300">
              التالي
            </span>
          ) : null}
        </div>
        <p className={`mt-0.5 ${lcLabel}`}>
          {video.duration ? video.duration : state.label}
        </p>
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${
          isDone
            ? "border border-emerald-500 text-emerald-700 dark:text-emerald-300"
            : "bg-blue-500 text-white"
        }`}
      >
        <CtaIcon className="text-[9px]" />
        {isDone ? "إعادة" : isStarted ? "متابعة" : "شاهد"}
      </span>
    </Link>
  );
}

/** صف فيديو — مضغوط للطالب والمدرس */
function VideoRow({ video, index, canManage, handleDeleteVideo, recommended = false }) {
  if (!canManage) {
    return <StudentVideoCard video={video} index={index} recommended={recommended} />;
  }

  const isDone = video.is_completed;
  const isStarted = video.is_watched && !video.is_completed;

  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 transition-colors hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-700"
      dir="rtl"
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${
          isDone
            ? "bg-emerald-500 text-white"
            : isStarted
              ? "bg-blue-500 text-white"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        }`}
      >
        {isDone ? <FaCheckCircle className="text-xs" /> : index + 1}
      </span>

      <div className="min-w-0 flex-1 text-right">
        <h5 className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
          {video.title || `الفيديو ${index + 1}`}
        </h5>
        {video.duration ? (
          <span className={`mt-0.5 inline-flex items-center gap-1 ${lcLabel}`}>
            <FaClock className="text-[8px]" />
            {video.duration}
          </span>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Link
          to={`/video/${video.id}`}
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
            isDone || isStarted
              ? "border border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {isDone ? <FaRedo className="text-[9px]" /> : <FaPlay className="text-[9px]" />}
          مشاهدة
        </Link>
        <button
          type="button"
          aria-label="حذف الفيديو"
          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
          onClick={() => handleDeleteVideo(video.id, video.title || "فيديو")}
        >
          <FaTrash className="text-xs" />
        </button>
      </div>
    </div>
  );
}

/** صف واجب — عمودي على الموبايل، أفقي من sm */
function formatAssignmentRemaining(seconds) {
  if (seconds == null) return null;
  const value = Number(seconds);
  if (!Number.isFinite(value) || value < 0) return null;
  const minutes = Math.floor(value / 60);
  const secs = value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function assignmentStatusVisual(exam) {
  const status = getExamStatus(exam);
  if (status?.tone === "done") {
    return {
      chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      accent: "border-emerald-200 dark:border-emerald-800",
      iconWrap: "bg-emerald-500",
      button: "border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40",
    };
  }
  if (status?.tone === "active") {
    return {
      chip: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
      accent: "border-blue-300 dark:border-blue-700",
      iconWrap: "bg-orange-500",
      button: "bg-orange-500 text-white hover:bg-orange-600",
    };
  }
  if (status?.tone === "closed") {
    return {
      chip: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
      accent: "border-slate-200 dark:border-slate-700",
      iconWrap: "bg-slate-400",
      button: "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    };
  }
  return {
    chip: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    accent: "border-orange-200 dark:border-orange-800",
    iconWrap: "bg-orange-500",
    button: "bg-orange-500 text-white hover:bg-orange-600",
  };
}

function StudentAssignmentCard({ exam }) {
  if (!exam) return null;
  const examStatus = getExamStatus(exam);
  const visual = assignmentStatusVisual(exam);
  const remaining = formatAssignmentRemaining(exam.remaining_seconds);
  const score = exam.student_submission?.score;
  const closed = examStatus?.tone === "closed";
  const StatusIcon = examStatus.icon;

  const meta = [
    exam.total_grade != null ? `${exam.total_grade} درجة` : null,
    score != null ? `درجتك ${score}` : null,
    remaining ? `متبقٍ ${remaining}` : formatLectureExamDurationLabel(exam) || null,
  ].filter(Boolean);

  const inner = (
    <div
      className={`flex items-center gap-2.5 rounded-xl border-2 bg-white px-2.5 py-2 dark:bg-slate-900 ${visual.accent} ${
        closed ? "opacity-80" : "transition-colors hover:shadow-sm"
      }`}
      dir="rtl"
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${visual.iconWrap}`}>
        <StatusIcon className="text-xs" />
      </span>
      <div className="min-w-0 flex-1 text-right">
        <div className="flex items-center gap-1.5">
          <h5 className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
            {exam.title || "واجب المحاضرة"}
          </h5>
          <span className={`shrink-0 rounded px-1 py-px text-[9px] font-bold ${visual.chip}`}>
            {examStatus.label}
          </span>
        </div>
        {meta.length ? <p className={`mt-0.5 ${lcLabel}`}>{meta.join(" · ")}</p> : null}
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${visual.button}`}
      >
        <StatusIcon className="text-[9px]" />
        {examStatus.tone === "done" ? "النتيجة" : examStatus.tone === "active" ? "متابعة" : "ابدأ"}
      </span>
    </div>
  );

  if (closed) return inner;

  return (
    <Link to={`/ComprehensiveExam/${exam.id}`} className="block">
      {inner}
    </Link>
  );
}

function AssignmentRow({
  exam,
  canManage,
  examActionLoading,
  openExamModal,
  openDeleteExamDialog,
}) {
  if (!exam) return null;
  if (!canManage) {
    return <StudentAssignmentCard exam={exam} />;
  }

  const examStatus = getExamStatus(exam);
  const solved = exam.is_solved;

  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 transition-colors hover:border-orange-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-orange-700"
      dir="rtl"
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${
          solved ? "bg-emerald-500" : "bg-orange-500"
        }`}
      >
        <examStatus.icon className="text-xs" />
      </span>

      <div className="min-w-0 flex-1 text-right">
        <h5 className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
          {exam.title || "واجب المحاضرة"}
        </h5>
        <p className={`mt-0.5 truncate ${lcLabel}`}>
          {exam.total_grade ?? "—"} · {formatLectureExamDurationLabel(exam)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <Link
          to={`/ComprehensiveExam/${exam.id}`}
          aria-label="إدارة الواجب"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40"
        >
          <FaCog className="text-xs" />
        </Link>
        <Link
          to={buildExamReportPath(exam.id, { from: "lecture" })}
          aria-label="تقرير الواجب"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
        >
          <FaChartBar className="text-xs" />
        </Link>
        <button
          type="button"
          aria-label="تعديل الواجب"
          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
          onClick={() => openExamModal("edit", exam)}
        >
          <FaEdit className="text-xs" />
        </button>
        <button
          type="button"
          aria-label="حذف الواجب"
          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/40"
          disabled={examActionLoading}
          onClick={() => openDeleteExamDialog(exam)}
        >
          {examActionLoading ? <Spinner size="sm" /> : <FaTrash className="text-xs" />}
        </button>
      </div>
    </div>
  );
}

const LectureCard = ({
  lecture,
  lectureIndex = 0,
  courseId,
  canManageCourseFiles = false,
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
  const uploadPdfModal = useDisclosure();
  const [expanded, setExpanded] = React.useState(false);
  const [editFileTarget, setEditFileTarget] = React.useState(null);
  const [deleteFileTarget, setDeleteFileTarget] = React.useState(null);
  const [visibilityLoading, setVisibilityLoading] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(lecture.is_visible ?? true);
  const [lectureExam, setLectureExam] = React.useState(null);
  const canManage = isTeacher || isAdmin;
  const lectureAccessMode = resolveLectureAccessMode(lecture);
  const canManageFiles = canManageCourseFiles || canManage;
  const resolvedCourseId = courseId ?? lecture.course_id ?? lecture.courseId;

  const initialLectureFiles = React.useMemo(
    () => (lecture.files || []).map(normalizeLectureFile).filter(Boolean),
    [lecture.files],
  );

  const { data: lectureFiles = initialLectureFiles, refetch: refetchLectureFiles } = useLectureFiles(
    lecture.id,
    {
      enabled: expanded && Boolean(lecture.id),
      placeholderData: initialLectureFiles,
    },
  );

  const { uploadMutation, updateMutation, deleteMutation } = useLectureFileMutations(
    lecture.id,
    resolvedCourseId,
  );

  const refreshLectureFiles = async () => {
    await refetchLectureFiles();
    onRefreshCourse?.();
  };

  const handleUploadPdf = async (payload) => {
    try {
      await uploadMutation.mutateAsync(payload);
      toast({
        title: "تم رفع الملف بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      uploadPdfModal.onClose();
      await refreshLectureFiles();
    } catch (err) {
      toast({
        title: "تعذّر رفع الملف",
        description: courseFilesApiError(err),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEditPdf = async (payload) => {
    if (!editFileTarget) return;
    try {
      await updateMutation.mutateAsync({ fileId: editFileTarget.id, ...payload });
      toast({
        title: "تم تحديث الملف بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setEditFileTarget(null);
      await refreshLectureFiles();
    } catch (err) {
      toast({
        title: "تعذّر تحديث الملف",
        description: courseFilesApiError(err),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeletePdf = async () => {
    if (!deleteFileTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteFileTarget.id);
      toast({
        title: "تم حذف الملف بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setDeleteFileTarget(null);
      await refreshLectureFiles();
    } catch (err) {
      toast({
        title: "تعذّر حذف الملف",
        description: courseFilesApiError(err),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

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

  React.useEffect(() => {
    if (!canManage) return;
    const existing = getLectureAssignments(lecture);
    if (existing.length > 0) {
      setLectureExam(existing[0]);
    } else if (lecture.exam) {
      setLectureExam(lecture.exam);
    } else {
      setLectureExam(null);
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
  const filesCount = lectureFiles.length;
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
  const nextVideoId = !canManage
    ? (lecture.videos || []).find((video) => !video.is_completed)?.id
    : null;

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
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-l from-blue-500 to-orange-500 sm:h-1" aria-hidden />

        <div className="space-y-2.5 p-3 sm:space-y-3 sm:p-5">
          {/* الصف الرئيسي: رقم + عنوان + فتح */}
          <div className="flex items-start gap-2.5 sm:gap-4">
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-sm font-bold tabular-nums text-white shadow-sm sm:h-14 sm:w-14 sm:rounded-2xl sm:text-lg ${lcIndex}`}>
                {lectureIndex + 1}
              </div>
              {!canManage && videosCount > 0 && (
                <div className="hidden sm:block">
                  <ProgressRing percent={progressPercent} />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 text-right">
              <div className="mb-1 flex flex-wrap items-center gap-1 sm:mb-2 sm:gap-2">
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold sm:rounded-full sm:px-2.5 sm:text-[11px] ${accessMeta.badgeClass}`}>
                  {canManage
                    ? lecture.locked
                      ? "مغلق"
                      : "مفتوح"
                    : accessMeta.label}
                </span>
                {canManage ? (
                  <span className="hidden rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-600 sm:inline-flex dark:bg-violet-950/40 dark:text-violet-400">
                    {getLectureAccessModeLabel(lectureAccessMode)}
                  </span>
                ) : null}
                {canManage &&
                lectureAccessMode === "groups" &&
                Array.isArray(lecture.group_ids) &&
                lecture.group_ids.length > 0 ? (
                  <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 sm:rounded-full sm:px-2.5 sm:text-[11px]">
                    {lecture.group_ids.length} مجموعة
                  </span>
                ) : null}
                {!canManage && lecture.open_via_group === true ? (
                  <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-700 sm:rounded-full sm:px-2.5 sm:text-[11px] dark:bg-teal-950/40 dark:text-teal-300">
                    عبر مجموعتك
                  </span>
                ) : null}
                {expiresLabel ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 sm:rounded-full sm:px-2.5 sm:text-[11px] dark:bg-amber-950/40 dark:text-amber-300">
                    <FaClock className="text-[9px]" />
                    <span className="max-w-[9rem] truncate sm:max-w-none">{expiresLabel}</span>
                  </span>
                ) : null}
                {canManage && (
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold sm:rounded-full sm:px-2.5 sm:text-[11px] ${isVisible ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                    {isVisible ? "ظاهر" : "مخفي"}
                  </span>
                )}
                {!canManage && isLectureComplete && (
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 sm:rounded-full sm:px-2.5 sm:text-[11px] dark:bg-emerald-950/40 dark:text-emerald-400">
                    مكتملة
                  </span>
                )}
                <span className="hidden sm:inline-flex">
                  <span className={`${crEyebrow} !px-3 !py-1 !text-[11px]`}>محاضرة {lectureIndex + 1}</span>
                </span>
              </div>

              <h3 className="font-heading text-[0.95rem] font-extrabold leading-snug tracking-tight text-slate-900 dark:text-white sm:text-[1.125rem] md:text-xl">
                {lecture.title}
              </h3>
              {lectureDescription && lectureDescription !== lecture.title ? (
                <p className={`mt-0.5 line-clamp-1 sm:mt-1.5 sm:line-clamp-2 ${lcBody}`}>{lectureDescription}</p>
              ) : null}

              <div className="mt-2 flex flex-wrap items-center gap-1 sm:mt-2.5 sm:gap-2">
                <ContentChip
                  icon={FaVideo}
                  label="فيديو"
                  count={videosCount}
                  tone="blue"
                  active={videosCount > 0}
                />
                <ContentChip
                  icon={FaFilePdf}
                  label="ملف"
                  count={filesCount}
                  tone="purple"
                  active={filesCount > 0}
                />
                <ContentChip
                  icon={FaTasks}
                  label={hideLectureAssignments ? "واجبات الكورس" : "واجب"}
                  count={hideLectureAssignments ? "—" : assignmentsCount}
                  tone="orange"
                  active={!hideLectureAssignments && assignmentsCount > 0}
                />
                {!canManage && videosCount > 0 ? (
                  <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold tabular-nums text-slate-600 sm:hidden dark:bg-slate-800 dark:text-slate-300">
                    {progressPercent}%
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* أزرار المدرس — صف أفقي على الموبايل */}
          {canManage && (
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:justify-end [&::-webkit-scrollbar]:hidden">
              <Tooltip label="تعديل المحاضرة">
                <IconButton
                  aria-label="تعديل المحاضرة"
                  icon={<Icon as={FaEdit} />}
                  size="sm"
                  colorScheme="blue"
                  variant="ghost"
                  borderRadius="lg"
                  minW="36px"
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
                  borderRadius="lg"
                  minW="36px"
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
                  borderRadius="lg"
                  minW="36px"
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
                    borderRadius="lg"
                    minW="36px"
                    onClick={codesModal.onOpen}
                  />
                </Tooltip>
              ) : null}
            </div>
          )}

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 sm:w-auto ${
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
            <div className="bg-slate-50/80 p-2.5 dark:bg-slate-950/50 sm:p-4">
              {isLockedForViewer ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center sm:flex-row sm:gap-4 sm:text-right dark:border-slate-600 dark:bg-slate-900">
                  {needsActivationCode ? (
                    <div className="w-full max-w-md space-y-3 text-right">
                      <LectureActivateCodeForm
                        onActivated={() => onRefreshCourse?.()}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-500 text-white">
                        <FaLock className="text-sm" />
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
                <div className="space-y-2.5">
                  {/* الفيديوهات */}
                  <ContentSection
                    accent="blue"
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
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2 py-1 text-[10px] font-bold text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300"
                            onClick={() => handleAddVideo(lecture.id)}
                            data-tour-id={isTourTarget ? "course-lecture-add-video" : undefined}
                          >
                            <FaPlus className="text-[8px]" />
                            إضافة
                          </button>
                        ) : null
                      }
                    />
                    {videosCount === 0 ? (
                      <p className={`rounded-lg border border-dashed border-blue-200 px-2.5 py-3 text-center ${lcLabel} dark:border-blue-900`}>
                        {canManage ? "لا توجد فيديوهات بعد" : "لا توجد فيديوهات"}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-1.5">
                        {(lecture.videos || []).map((video, index) => (
                          <VideoRow
                            key={video.id}
                            video={video}
                            index={index}
                            canManage={canManage}
                            recommended={video.id === nextVideoId}
                            handleDeleteVideo={handleDeleteVideo}
                          />
                        ))}
                      </div>
                    )}
                  </ContentSection>

                  {/* الملفات */}
                  <ContentSection
                    accent="purple"
                    data-tour-id={isTourTarget ? "course-lecture-files" : undefined}
                  >
                    <SectionHeading
                      icon={FaFilePdf}
                      label="الملفات"
                      count={filesCount}
                      accent="purple"
                      action={
                        canManageFiles ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-2 py-1 text-[10px] font-bold text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:bg-slate-900 dark:text-violet-300"
                            onClick={uploadPdfModal.onOpen}
                            data-tour-id={isTourTarget ? "course-lecture-add-file" : undefined}
                          >
                            <FaPlus className="text-[8px]" />
                            إضافة
                          </button>
                        ) : null
                      }
                    />
                    {filesCount === 0 ? (
                      <p className={`rounded-lg border border-dashed border-violet-200 px-2.5 py-3 text-center ${lcLabel} dark:border-violet-900`}>
                        {canManageFiles ? "لا توجد ملفات بعد" : "لا توجد ملفات"}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-1.5">
                        {lectureFiles.map((file) => (
                          <LecturePdfRow
                            key={file.id}
                            file={file}
                            courseId={resolvedCourseId}
                            canManage={canManageFiles}
                            onEdit={setEditFileTarget}
                            onDelete={setDeleteFileTarget}
                          />
                        ))}
                      </div>
                    )}
                  </ContentSection>

                  {/* الواجبات */}
                  {!hideLectureAssignments && (canManage || hasAssignments) && (
                    <ContentSection
                      accent="orange"
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
                              className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-2 py-1 text-[10px] font-bold text-white hover:bg-orange-600"
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
                              <FaPlus className="text-[8px]" />
                              إضافة
                            </button>
                          ) : null
                        }
                      />
                      {hasAssignments ? (
                        <div className="grid grid-cols-1 gap-1.5">
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
                          <p className={`rounded-lg border border-dashed border-orange-200 px-2.5 py-3 text-center ${lcLabel} dark:border-orange-900`}>
                            لا توجد واجبات بعد
                          </p>
                        )
                      )}
                    </ContentSection>
                  )}

                  {/* Footer meta */}
                  <div className={`flex flex-col gap-1 border-t border-slate-200 pt-2 sm:flex-row sm:items-center sm:justify-between ${lcCaption} dark:border-slate-800`}>
                    <span>{formatDate ? formatDate(lecture.created_at) : lecture.created_at}</span>
                    {!canManage && progress && videosCount > 0 && (
                      <span>
                        {progress.watched_videos}/{progress.total_videos} فيديو
                        {hasAssignments &&
                          (allAssignmentsPassed
                            ? " · الواجبات مكتملة"
                            : " · واجبات غير مكتملة")}
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

      <UploadCourseFileModal
        isOpen={uploadPdfModal.isOpen}
        onClose={() => !uploadMutation.isPending && uploadPdfModal.onClose()}
        onSubmit={handleUploadPdf}
        loading={uploadMutation.isPending}
      />

      <EditCourseFileModal
        isOpen={Boolean(editFileTarget)}
        onClose={() => !updateMutation.isPending && setEditFileTarget(null)}
        file={editFileTarget}
        onSubmit={handleEditPdf}
        loading={updateMutation.isPending}
      />

      <DeleteCourseFileModal
        isOpen={Boolean(deleteFileTarget)}
        onClose={() => setDeleteFileTarget(null)}
        file={deleteFileTarget}
        onConfirm={handleDeletePdf}
        loading={deleteMutation.isPending}
      />
    </motion.article>
  );
};

export default LectureCard;
