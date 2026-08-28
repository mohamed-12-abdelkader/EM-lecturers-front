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
    if (result.answersVisibleAt) {
      return {
        colorScheme: "orange",
        text: `الإجابات ستظهر في ${formatExamDate(result.answersVisibleAt)}`,
      };
    }
    return {
      colorScheme: "gray",
      text: "الإجابات غير متاحة حالياً",
    };
  }

  if (result.releaseReason === "scheduled" && result.answersVisibleAt) {
    return {
      colorScheme: "blue",
      text: `تم جدولة عرض الإجابات في ${formatExamDate(result.answersVisibleAt)}`,
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
