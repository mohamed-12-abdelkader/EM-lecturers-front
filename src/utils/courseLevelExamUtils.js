/** توحيد حقول امتحان الكورس (camelCase + snake_case) حسب course-level-exams.md */

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
      raw.visibility_end_date ?? raw.visibilityEndDate ?? null,
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
  if (mode === "after_hours") {
    return { label: "بعد ساعات من التسليم", colorScheme: "purple" };
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

  const remaining =
    data.attempts_remaining ??
    Math.max(0, data.attempt_limit - (data.attempts_count || 0));

  return `${data.attempts_count || 0}/${data.attempt_limit} (${remaining} متبقية)`;
}

export function getStudentExamCta(exam) {
  const data = normalizeCourseLevelExam(exam);
  if (!data) return { label: "عرض الامتحان", disabled: true };

  if (!data.is_active) {
    return { label: "الامتحان غير نشط", disabled: true };
  }

  if (data.availability_status === "expired") {
    return { label: "انتهى — لا يمكن الدخول", disabled: true };
  }

  if (data.can_start === false) {
    const expireAt = parseDateSafe(data.visibility_end_date);
    if (expireAt && new Date() >= expireAt) {
      return { label: "انتهى — لا يمكن الدخول", disabled: true };
    }
  }

  if (!data.can_attempt) {
    return {
      label: data.attempts_count > 0 ? "عرض آخر محاولة" : "غير متاح",
      disabled: data.attempts_count === 0,
    };
  }

  if (data.attempts_count > 0) {
    return {
      label: `محاولة جديدة (${(data.attempts_count || 0) + 1})`,
      disabled: false,
    };
  }

  return { label: "ابدأ الامتحان", disabled: false };
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
