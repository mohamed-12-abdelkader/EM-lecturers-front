/** توحيد حقول امتحان الكورس (camelCase + snake_case) حسب course-level-exams.md */

import { hasInProgressExamAttempt } from "./examAttemptProgress";

export function parseDateSafe(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeCourseLevelExam(raw = {}) {
  if (!raw || typeof raw !== "object") return null;

  return {
    id: raw.id,
    course_id: raw.course_id ?? raw.courseId ?? null,
    course_title: raw.course_title ?? raw.courseTitle ?? "",
    title: raw.title ?? "",
    duration_minutes: raw.duration_minutes ?? raw.durationMinutes ?? null,
    questions_count: raw.questions_count ?? raw.questionsCount ?? raw.configuredQuestionsCount ?? null,
    actual_questions_count: raw.actual_questions_count ?? raw.actualQuestionsCount ?? null,
    question_display_mode:
      raw.question_display_mode ??
      raw.questionDisplayMode ??
      "ordered",
    answers_release_mode: raw.answers_release_mode ?? raw.answersReleaseMode ?? null,
    is_visible_to_students:
      raw.is_visible_to_students ?? raw.isVisibleToStudents ?? true,
    available_from: raw.available_from ?? raw.availableFrom ?? raw.show_at ?? raw.showAt ?? null,
    visibility_end_date:
      raw.visibility_end_date ?? raw.visibilityEndDate ?? raw.examEndAt ?? raw.exam_end_at ?? null,
    exam_end_at: raw.examEndAt ?? raw.exam_end_at ?? raw.visibility_end_date ?? raw.visibilityEndDate ?? null,
    availability_status: raw.availability_status ?? raw.availabilityStatus ?? null,
    can_start: raw.can_start ?? raw.canStart ?? raw.can_attempt ?? raw.canAttempt,
    show_answers_immediately:
      raw.show_answers_immediately ?? raw.showAnswersImmediately ?? true,
    answers_visible_at: raw.answers_visible_at ?? raw.answersVisibleAt ?? null,
    is_active: raw.is_active ?? raw.isActive ?? true,
    attempt_limit: raw.attempt_limit ?? raw.attemptLimit ?? null,
    created_at: raw.created_at ?? raw.createdAt ?? null,
    updated_at: raw.updated_at ?? raw.updatedAt ?? null,
    attempts_count: raw.attempts_count ?? raw.attemptsCount ?? 0,
    last_attempt_number:
      raw.last_attempt_number ?? raw.lastAttemptNumber ?? null,
    can_attempt: raw.can_attempt ?? raw.canAttempt ?? true,
    attempts_remaining:
      raw.attempts_remaining ?? raw.attemptsRemaining ?? null,
    has_in_progress_attempt:
      raw.has_in_progress_attempt ?? raw.hasInProgressAttempt ?? false,
    in_progress_attempt_id:
      raw.in_progress_attempt_id ?? raw.inProgressAttemptId ?? null,
    show_answers: raw.show_answers ?? raw.showAnswers ?? null,
    release_reason: raw.release_reason ?? raw.releaseReason ?? null,
    attempt_report: raw.attempt_report ?? raw.attemptReport ?? null,
  };
}

export function parseCourseExamsResponse(responseData) {
  if (!responseData) return [];

  let exams = null;
  if (Array.isArray(responseData.exams)) {
    exams = responseData.exams;
  } else if (Array.isArray(responseData)) {
    exams = responseData;
  }

  return (exams || []).map(normalizeCourseLevelExam).filter(Boolean);
}

export function getCourseExamAvailabilityStatus(exam) {
  const data = normalizeCourseLevelExam(exam);
  if (!data) return { label: "غير معروف", colorScheme: "gray" };

  const now = new Date();

  if (!data.is_active) {
    return { label: "غير نشط", colorScheme: "red" };
  }

  if (!data.is_visible_to_students) {
    return { label: "مخفي عن الطلاب", colorScheme: "gray" };
  }

  const required = Number(data.questions_count);
  const actual = Number(data.actual_questions_count);
  if (Number.isFinite(required) && required > 0 && Number.isFinite(actual) && actual < required) {
    return { label: "غير مكتمل الأسئلة", colorScheme: "orange" };
  }

  const showAt = parseDateSafe(data.available_from);
  if (showAt && now < showAt) {
    return { label: "لم يظهر بعد", colorScheme: "blue" };
  }

  const visibilityEnd = parseDateSafe(data.visibility_end_date);
  if (visibilityEnd && now >= visibilityEnd) {
    return { label: "انتهى — ظاهر ولا يمكن الدخول", colorScheme: "orange" };
  }

  if (data.availability_status === "expired") {
    return { label: "انتهى — ظاهر ولا يمكن الدخول", colorScheme: "orange" };
  }

  return { label: "متاح الآن", colorScheme: "green" };
}

export function getAnswersVisibilityInfo(exam) {
  const data = normalizeCourseLevelExam(exam);
  if (!data) return { label: "—", colorScheme: "gray" };

  const mode = String(data.answers_release_mode || "").toLowerCase();
  if (mode === "after_end") {
    return { label: "بعد انتهاء الامتحان", colorScheme: "orange" };
  }
  if (mode === "after_hours" || mode === "delayed_hours") {
    return { label: "بعد ساعات من التسليم", colorScheme: "purple" };
  }
  if (mode === "scheduled_release" || mode === "scheduled") {
    const answersAt = parseDateSafe(data.answers_visible_at);
    if (answersAt && new Date() >= answersAt) {
      return { label: "الإجابات متاحة", colorScheme: "teal", date: answersAt };
    }
    return { label: "بموعد محدد", colorScheme: "purple", date: answersAt };
  }

  if (data.show_answers_immediately || mode === "immediate") {
    return { label: "فوراً بعد التسليم", colorScheme: "teal" };
  }

  const answersAt = parseDateSafe(data.answers_visible_at);
  if (!answersAt) {
    return { label: "بموعد لاحق", colorScheme: "purple" };
  }

  if (new Date() >= answersAt) {
    return { label: "الإجابات متاحة", colorScheme: "teal", date: answersAt };
  }

  return { label: "إجابات لاحقاً", colorScheme: "purple", date: answersAt };
}

export function formatAttemptLimitLabel(exam, { isTeacher = false } = {}) {
  const data = normalizeCourseLevelExam(exam);
  if (!data) return "—";

  if (!data.attempt_limit) {
    return isTeacher ? "غير محدود" : `${data.attempts_count || 0} محاولة`;
  }

  if (isTeacher) {
    return `${data.attempt_limit} محاولة`;
  }

  const remaining = getStudentAttemptsRemaining(data);
  const used = data.attempts_count || 0;

  if (isCourseExamEnded(data) && remaining > 0) {
    return `${used}/${data.attempt_limit} (انتهى الموعد)`;
  }

  return `${used}/${data.attempt_limit} (${remaining} متبقية)`;
}

export function getStudentAttemptsRemaining(exam) {
  const data = normalizeCourseLevelExam(exam);
  if (!data) return 0;
  if (data.attempt_limit == null || data.attempt_limit === "") return Infinity;
  if (data.attempts_remaining != null && data.attempts_remaining !== "") {
    const n = Number(data.attempts_remaining);
    if (Number.isFinite(n)) return Math.max(0, n);
  }
  return Math.max(0, Number(data.attempt_limit) - (Number(data.attempts_count) || 0));
}

export function hasExhaustedCourseExamAttempts(exam) {
  const data = normalizeCourseLevelExam(exam);
  if (!data || data.attempt_limit == null || data.attempt_limit === "") return false;
  return getStudentAttemptsRemaining(data) <= 0;
}

export function isCourseExamEnded(exam) {
  const data = normalizeCourseLevelExam(exam);
  if (!data) return false;
  if (data.availability_status === "expired") return true;
  const now = new Date();
  const end =
    parseDateSafe(data.exam_end_at) ||
    parseDateSafe(data.visibility_end_date) ||
    parseDateSafe(exam?.attempt_report?.examEndAt);
  return Boolean(end && now >= end);
}

export function hasCompletedCourseExamAttempt(exam) {
  const data = normalizeCourseLevelExam(exam);
  if (!data) return false;
  if (data.has_in_progress_attempt && Number(data.attempts_count) === 0 && !data.last_attempt_number) {
    return false;
  }
  if (Number(data.attempts_count) > 0) return true;
  if (data.last_attempt_number) return true;
  const report = exam?.attempt_report;
  return Boolean(report?.attempt?.attemptId || report?.attemptId);
}

export function areCourseExamAnswersReleased(exam) {
  const data = normalizeCourseLevelExam(exam);
  if (!data) return false;

  if (data.show_answers === true || exam?.attempt_report?.showAnswers === true) {
    return true;
  }
  if (data.show_answers === false || exam?.attempt_report?.showAnswers === false) {
    return false;
  }

  const mode = String(data.answers_release_mode || "").toLowerCase();
  if (mode === "after_end") return isCourseExamEnded(data);
  if (
    mode === "after_hours" ||
    mode === "delayed_hours" ||
    mode === "scheduled_release" ||
    mode === "scheduled"
  ) {
    const scheduledAt = parseDateSafe(data.answers_visible_at);
    return Boolean(scheduledAt && new Date() >= scheduledAt);
  }
  if (mode === "immediate") return true;
  if (!mode && data.show_answers_immediately) return true;

  const answersAt = parseDateSafe(data.answers_visible_at);
  if (answersAt) return new Date() >= answersAt;
  return false;
}

export function getStudentExamCta(exam) {
  const data = normalizeCourseLevelExam(exam);
  if (!data) return { label: "عرض الامتحان", disabled: true };

  const ended = isCourseExamEnded(exam);
  const hasAttempt = hasCompletedCourseExamAttempt(exam);
  const answersOpen = areCourseExamAnswersReleased(exam);
  const inProgress =
    Boolean(data.has_in_progress_attempt) || hasInProgressExamAttempt(data.id);
  const remaining = getStudentAttemptsRemaining(data);
  const canStartNew = remaining === Infinity || remaining > 0;
  const examOpen = Boolean(data.is_active) && !ended && data.availability_status !== "expired";

  if (inProgress) {
    return { label: "استكمل المحاولة", disabled: false, kind: "start" };
  }

  if (examOpen && canStartNew) {
    return { label: "بدء الامتحان", disabled: false, kind: "start" };
  }

  if (hasAttempt && answersOpen) {
    return { label: "عرض التقرير", disabled: false, kind: "report" };
  }

  if (!data.is_active) {
    return { label: "الامتحان غير نشط", disabled: true };
  }

  if (ended) {
    return {
      label: hasAttempt ? "عرض التقرير" : "انتهى — لا يمكن الدخول",
      disabled: !hasAttempt,
      kind: hasAttempt ? "report" : undefined,
    };
  }

  if (!canStartNew) {
    return {
      label: hasAttempt ? "عرض التقرير" : "استنفدت المحاولات",
      disabled: !hasAttempt,
      kind: hasAttempt ? "report" : undefined,
    };
  }

  return { label: "بدء الامتحان", disabled: false, kind: "start" };
}

export function toDateTimeLocalValue(value) {
  if (!value) return "";
  const date = parseDateSafe(value);
  if (!date) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function fromDateTimeLocalValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}
