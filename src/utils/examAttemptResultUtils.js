const ARABIC_LETTERS = { A: "أ", B: "ب", C: "ج", D: "د" };

export function getExamBlockedMessage(message) {
  const raw = String(message || "").trim();
  const lower = raw.toLowerCase();

  if (!raw) {
    return "لقد أنهيت هذا الامتحان مسبقاً ولا يُسمح بمحاولة جديدة.";
  }
  if (lower.includes("only one attempt") || lower.includes("already completed")) {
    return "لقد أنهيت هذا الامتحان مسبقاً. يُسمح بمحاولة واحدة فقط.";
  }
  if (lower.includes("all allowed attempts")) {
    return "لقد استنفدت كل المحاولات المتاحة لهذا الامتحان.";
  }
  return raw;
}

export function formatExamDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function getAnswerTextFromQuestion(question, letter) {
  if (!letter) return "لم تجب";
  const key = `option${String(letter).toUpperCase()}`;
  const value = question?.[key] ?? question?.[`option${letter}`];
  if (value != null && String(value).trim()) return String(value).trim();
  return `الخيار ${ARABIC_LETTERS[String(letter).toUpperCase()] || letter}`;
}

export function getAnswerLetterLabel(letter) {
  if (!letter) return "";
  return ARABIC_LETTERS[String(letter).toUpperCase()] || letter;
}

export function getAnswersVisibilityInfo(result = {}) {
  if (result.showAnswers === false) {
    const mode = String(result.answersReleaseMode || result.releaseReason || "").toLowerCase();
    if (result.answersVisibleAt) {
      return {
        colorScheme: "orange",
        text: `الإجابات ستظهر في ${formatExamDate(result.answersVisibleAt)}`,
      };
    }
    if (mode === "after_end") {
      return {
        colorScheme: "orange",
        text: result.examEndAt
          ? `الإجابات ستظهر بعد انتهاء الامتحان (${formatExamDate(result.examEndAt)})`
          : "الإجابات ستظهر بعد انتهاء الامتحان",
      };
    }
    if (mode === "delayed_hours" || mode === "after_hours") {
      const hours = Number(result.showAnswersAfterHours) || 0;
      return {
        colorScheme: "purple",
        text: hours > 0
          ? `الإجابات ستظهر بعد ${hours} ساعة من التسليم`
          : "الإجابات ستظهر بعد ساعات من التسليم",
      };
    }
    return {
      colorScheme: "gray",
      text: "الإجابات غير متاحة حالياً",
    };
  }

  if (result.releaseReason === "scheduled" || result.releaseReason === "scheduled_release") {
    if (result.answersVisibleAt) {
      return {
        colorScheme: "blue",
        text: `تم إظهار الإجابات حسب الموعد المحدد (${formatExamDate(result.answersVisibleAt)})`,
      };
    }
  }

  if (result.releaseReason === "after_end") {
    return {
      colorScheme: "green",
      text: "انتهى الامتحان ويمكنك مراجعة إجاباتك",
    };
  }

  if (result.releaseReason === "immediate") {
    return {
      colorScheme: "green",
      text: "يمكنك مراجعة إجاباتك فوراً",
    };
  }

  if ((result.wrongQuestions || []).length > 0) {
    return {
      colorScheme: "green",
      text: "يمكنك مراجعة إجاباتك أدناه",
    };
  }

  return null;
}

function normalizeWrongQuestions(list = []) {
  return (Array.isArray(list) ? list : [])
    .filter((item) => item && (item.questionText || item.text))
    .map((item, index) => ({
      id: item.questionId ?? item.id ?? index,
      questionText: item.questionText ?? item.text ?? "",
      questionImage: item.questionImage ?? item.image ?? null,
      correctAnswer: item.correctAnswer ?? item.correctChoice?.letter ?? null,
      yourAnswer: item.yourAnswer ?? item.yourChoice?.letter ?? null,
      optionA: item.optionA ?? null,
      optionB: item.optionB ?? null,
      optionC: item.optionC ?? null,
      optionD: item.optionD ?? null,
    }));
}

function normalizePreviousAttempt(raw = {}) {
  const totalGrade = Number(raw.totalGrade ?? 0);
  const maxGrade = Number(raw.maxGrade ?? 0);
  const wrongQuestions = normalizeWrongQuestions(raw.wrongQuestions);

  return {
    mode: "blocked",
    title: "تم إنهاء الامتحان مسبقاً",
    message: getExamBlockedMessage(raw.message),
    attemptId: raw.attemptId ?? null,
    totalGrade,
    maxGrade,
    correctCount: raw.correctCount ?? totalGrade,
    wrongCount: raw.wrongCount ?? wrongQuestions.length,
    submittedAt: raw.submittedAt ?? null,
    showAnswers: raw.showAnswers ?? wrongQuestions.length > 0,
    releaseReason: raw.releaseReason ?? null,
    answersVisibleAt: raw.answersVisibleAt ?? null,
    wrongQuestions,
  };
}

function normalizeFromGetExam(data = {}) {
  const latestAttempt = Array.isArray(data.attemptHistory) ? data.attemptHistory[0] : null;
  const feedback = data.feedback || null;
  const exam = data.exam || {};

  if (!latestAttempt && !feedback) return null;

  const wrongQuestions = normalizeWrongQuestions(
    feedback?.wrongQuestions?.filter?.((q) => q.isCorrect === false) ??
      feedback?.wrongQuestions ??
      [],
  );

  const totalGrade = Number(latestAttempt?.totalGrade ?? feedback?.totalGrade ?? 0);
  const maxGrade = Number(exam.total_grade ?? exam.totalGrade ?? feedback?.maxGrade ?? 0);

  return normalizePreviousAttempt({
    message: data.message,
    attemptId: latestAttempt?.attemptId ?? feedback?.attemptId ?? null,
    totalGrade,
    maxGrade,
    submittedAt: latestAttempt?.submittedAt ?? null,
    showAnswers: Boolean(feedback) || wrongQuestions.length > 0,
    releaseReason: feedback?.releaseReason ?? null,
    answersVisibleAt: exam.answers_visible_at ?? exam.answersVisibleAt ?? null,
    wrongQuestions,
  });
}

function normalizeFromSubmitResult(raw = {}) {
  const wrongQuestions = normalizeWrongQuestions(raw.wrongQuestions);
  const totalGrade = Number(raw.totalGrade ?? 0);
  const maxGrade = Number(raw.maxGrade ?? 0);

  return {
    mode: "submitted",
    title: "تم تسليم الامتحان",
    message: null,
    attemptId: raw.attemptId ?? null,
    totalGrade,
    maxGrade,
    correctCount: raw.correctCount ?? Math.max(0, (maxGrade || wrongQuestions.length) - wrongQuestions.length),
    wrongCount: raw.wrongCount ?? wrongQuestions.length,
    submittedAt: raw.submittedAt ?? new Date().toISOString(),
    showAnswers: true,
    releaseReason: raw.releaseReason ?? null,
    answersVisibleAt: raw.answersVisibleAt ?? null,
    wrongQuestions,
  };
}

export function normalizeExamAttemptResult(source = {}) {
  if (!source || typeof source !== "object") return null;

  if (source.previousAttempt) {
    return normalizePreviousAttempt({
      ...source.previousAttempt,
      message: source.message,
    });
  }

  if (source.status === "already_submitted") {
    return normalizeFromGetExam(source);
  }

  if (source.totalGrade != null && source.maxGrade != null) {
    return normalizeFromSubmitResult(source);
  }

  if (source.attemptId != null && source.totalGrade != null) {
    return normalizePreviousAttempt(source);
  }

  return null;
}

function localizeAttemptReportMessage(raw, payload = {}) {
  const text = String(raw || "").trim();
  const lower = text.toLowerCase();
  if (!text) return null;
  if (lower.includes("after the exam ends")) {
    return payload.examEndAt
      ? `الإجابات ستظهر بعد انتهاء الامتحان (${formatExamDate(payload.examEndAt)})`
      : "الإجابات ستظهر بعد انتهاء الامتحان";
  }
  if (lower.includes("not enrolled")) return "غير مسجّل في هذا الكورس";
  if (lower.includes("no completed attempt")) return "لا توجد محاولة مكتملة لهذا الامتحان";
  return text;
}

/** GET /api/exams/:id/attempt-report */
export function normalizeAttemptReport(raw = {}) {
  const payload =
    raw?.data && raw.exam == null && raw.attempt == null ? raw.data : raw;
  if (!payload || typeof payload !== "object") return null;

  const exam = payload.exam || {};
  const attempt = payload.attempt || {};
  const showAnswers = payload.showAnswers === true;
  const wrongQuestions = showAnswers
    ? normalizeWrongQuestions(payload.wrongQuestions)
    : [];

  const totalGrade = Number(attempt.totalGrade ?? payload.totalGrade ?? 0);
  const maxGrade = Number(attempt.maxGrade ?? payload.maxGrade ?? 0);

  return {
    mode: showAnswers ? "report" : "blocked",
    title: showAnswers ? "تقرير المحاولة" : "نتيجة الامتحان",
    message: localizeAttemptReportMessage(payload.message, payload),
    attemptId: attempt.attemptId ?? payload.attemptId ?? null,
    attemptNumber: attempt.attemptNumber ?? null,
    totalGrade,
    maxGrade,
    correctCount: attempt.correctCount ?? payload.correctCount ?? totalGrade,
    wrongCount: attempt.wrongCount ?? payload.wrongCount ?? wrongQuestions.length,
    startedAt: attempt.startedAt ?? null,
    submittedAt: attempt.submittedAt ?? null,
    showAnswers,
    releaseReason: payload.releaseReason ?? null,
    answersReleaseMode: payload.answersReleaseMode ?? null,
    answersVisibleAt: payload.answersVisibleAt ?? null,
    examEndAt: payload.examEndAt ?? null,
    showAnswersAfterHours: payload.showAnswersAfterHours ?? 0,
    examTitle: exam.title ?? null,
    courseId: exam.courseId ?? exam.course_id ?? payload.courseId ?? payload.course_id ?? null,
    wrongQuestions,
  };
}
