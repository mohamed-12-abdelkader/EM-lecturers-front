export const QUESTION_DISPLAY_MODES = {
  ORDERED: "ordered",
  RANDOM: "random",
};

export function normalizeQuestionDisplayMode(value, fallback = QUESTION_DISPLAY_MODES.ORDERED) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === QUESTION_DISPLAY_MODES.RANDOM) return QUESTION_DISPLAY_MODES.RANDOM;
  if (raw === QUESTION_DISPLAY_MODES.ORDERED) return QUESTION_DISPLAY_MODES.ORDERED;
  return fallback;
}

export function getQuestionDisplayModeLabel(mode) {
  return normalizeQuestionDisplayMode(mode) === QUESTION_DISPLAY_MODES.RANDOM
    ? "عشوائي لكل طالب"
    : "حسب الترتيب";
}

export function buildLectureExamCreatePayload(lectureId, data) {
  const payload = {
    lectureId: Number(lectureId),
    type: data.type || "assignment",
    title: data.title,
    questionsCount: Number(data.questions_count),
    questionDisplayMode: normalizeQuestionDisplayMode(data.question_display_mode),
    totalGrade: data.total_grade,
    duration: normalizeLectureDurationPayload(data),
    isVisible: data.is_visible ?? true,
    lockNextLectures: data.lock_next_lectures ?? true,
    answersReleaseMode: data.answers_release_mode || "immediate",
    showAnswersImmediately: data.show_answers_immediately ?? false,
  };

  if (data.show_answers_after_hours != null && data.show_answers_after_hours !== "") {
    payload.showAnswersAfterHours = Number(data.show_answers_after_hours);
  }
  if (data.show_at) payload.showAt = new Date(data.show_at).toISOString();
  if (data.hide_at) payload.hideAt = new Date(data.hide_at).toISOString();
  if (data.answers_release_date) {
    payload.answersReleaseDate = new Date(data.answers_release_date).toISOString();
    payload.showAnswersLater = true;
  }

  return payload;
}

export function buildLectureExamUpdatePayload(data) {
  const payload = {
    title: data.title,
    total_grade: data.total_grade,
    duration: normalizeLectureDurationPayload(data),
    is_visible: data.is_visible,
    lock_next_lectures: data.lock_next_lectures,
    show_answers_immediately: data.show_answers_immediately,
    show_answers_after_hours: data.show_answers_after_hours,
    questions_count: Number(data.questions_count),
    question_display_mode: normalizeQuestionDisplayMode(data.question_display_mode),
    answers_release_mode: data.answers_release_mode || "immediate",
  };

  if (data.type) payload.type = data.type;
  if (data.show_at) payload.show_at = new Date(data.show_at).toISOString();
  if (data.hide_at) payload.hide_at = new Date(data.hide_at).toISOString();
  if (data.answers_release_date) {
    payload.answers_release_date = new Date(data.answers_release_date).toISOString();
  }

  return payload;
}

export function buildExamSubmitAnswers(studentAnswers = {}) {
  return Object.entries(studentAnswers)
    .map(([questionId, selectedAnswer]) => ({
      questionId: Number(questionId),
      selectedAnswer: String(selectedAnswer || "").trim().toUpperCase(),
    }))
    .filter(
      (row) =>
        Number.isInteger(row.questionId) &&
        row.questionId > 0 &&
        ["A", "B", "C", "D"].includes(row.selectedAnswer),
    );
}

/** إجابات محفوظة من السيرفر → خريطة { questionId: "A" } */
export function savedCourseExamAnswersToMap(savedAnswers = []) {
  const map = {};
  const rows = Array.isArray(savedAnswers) ? savedAnswers : [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const questionId = Number(row.questionId ?? row.question_id);
    const letter = String(row.selectedAnswer ?? row.selected_answer ?? "")
      .trim()
      .toUpperCase();
    if (Number.isInteger(questionId) && questionId > 0 && ["A", "B", "C", "D"].includes(letter)) {
      map[questionId] = letter;
    }
  }
  return map;
}

/** عدّاد السيرفر: remainingSeconds / attemptExpiresAt. لا يُعاد ضبطه من ساعة الجهاز. */
export function resolveCourseExamServerTimer(session = {}) {
  const expiresAt = session.attemptExpiresAt ?? session.attempt_expires_at ?? null;
  if (expiresAt) {
    const ms = new Date(expiresAt).getTime();
    if (Number.isFinite(ms)) {
      return {
        endsAt: ms,
        remaining: Math.max(0, Math.floor((ms - Date.now()) / 1000)),
      };
    }
  }
  const remainingRaw = session.remainingSeconds ?? session.remaining_seconds;
  if (remainingRaw != null && remainingRaw !== "") {
    const n = Number(remainingRaw);
    if (Number.isFinite(n)) {
      const remaining = Math.max(0, Math.floor(n));
      return { endsAt: Date.now() + remaining * 1000, remaining };
    }
  }
  return { endsAt: null, remaining: null };
}

export function isCourseExamTakingSession(session) {
  return Array.isArray(session?.questions) && session.questions.length > 0;
}

export function isCourseExamFinishedPayload(session) {
  if (!session || typeof session !== "object" || isCourseExamTakingSession(session)) {
    return false;
  }
  return (
    session.timedOut === true ||
    session.timed_out === true ||
    (session.totalGrade != null && session.maxGrade != null)
  );
}

export function isLectureExamFinishedPayload(session) {
  return isCourseExamFinishedPayload(session);
}

export function normalizeLectureDurationPayload(data = {}) {
  if (
    data.duration_unlimited === true ||
    data.durationUnlimited === true ||
    data.duration === "unlimited" ||
    data.duration === "" ||
    data.duration == null ||
    Number(data.duration) <= 0
  ) {
    return null;
  }
  const minutes = Number(data.duration);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
}

export function formatLectureExamDurationLabel(exam) {
  if (
    exam?.duration_unlimited ||
    exam?.durationUnlimited ||
    exam?.duration == null ||
    exam?.duration === "" ||
    Number(exam?.duration) <= 0
  ) {
    return "بدون حد زمني";
  }
  return `${exam.duration} دقيقة`;
}

/** إجابات محفوظة لواجب/امتحان محاضرة → { questionId: choiceId } */
export function savedLectureExamAnswersToMap(savedAnswers = []) {
  const map = {};
  const rows = Array.isArray(savedAnswers) ? savedAnswers : [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const questionId = Number(row.questionId ?? row.question_id);
    const choiceId = Number(
      row.choiceId ?? row.choice_id ?? row.selectedChoiceId ?? row.selected_choice_id,
    );
    if (Number.isInteger(questionId) && questionId > 0 && Number.isFinite(choiceId) && choiceId !== 0) {
      map[questionId] = choiceId;
    }
  }
  return map;
}

export function remainingFromEndsAt(endsAt) {
  if (endsAt == null) return null;
  const ms = typeof endsAt === "number" ? endsAt : new Date(endsAt).getTime();
  if (!Number.isFinite(ms)) return null;
  return Math.max(0, Math.floor((ms - Date.now()) / 1000));
}

export const resolveLectureExamServerTimer = resolveCourseExamServerTimer;

const LETTER_KEYS = ["A", "B", "C", "D"];

function isImageUrlValue(value) {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  return (
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith("data:image") ||
    /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(trimmed)
  );
}

/** تطبيع سؤال واحد من صيغة API المسطحة (questionText, optionA..D) أو choices[] */
export function normalizeSingleExamQuestion(q) {
  if (!q || typeof q !== "object") return null;

  const questionId = q.id ?? q.questionId;
  const hasFlatOptions =
    q.type != null ||
    q.questionText != null ||
    q.optionA != null ||
    q.optionB != null;

  if (hasFlatOptions) {
    const correctLetter = String(q.correctAnswer || "").toUpperCase();
    const choices = LETTER_KEYS.map((letter, idx) => {
      const raw = q[`option${letter}`];
      const val = raw != null ? String(raw).trim() : "";
      const img = isImageUrlValue(val);
      return {
        id: idx + 1,
        letter,
        text: img ? "" : val,
        image: img ? val : null,
        is_correct: letter === correctLetter,
      };
    }).filter((choice) => choice.text || choice.image);

    return {
      id: questionId,
      text: q.questionText != null ? String(q.questionText) : q.text ?? "",
      image: q.questionImage ?? q.image ?? null,
      type: q.type || null,
      grade: q.grade ?? 1,
      passage: q.passage || null,
      choices,
    };
  }

  if (questionId == null && !q.text && !q.questionText) return null;

  const choices = (q.choices || []).map((c, idx) => {
    const letter = c.letter || LETTER_KEYS[idx] || String.fromCharCode(65 + idx);
    const rawText = c.text != null ? String(c.text).trim() : "";
    const img = c.image || c.image_url || (isImageUrlValue(rawText) ? rawText : null);
    return {
      id: c.id ?? idx + 1,
      letter,
      text: img && isImageUrlValue(rawText) ? "" : rawText,
      image: img,
      is_correct: Boolean(c.is_correct),
    };
  });

  return {
    id: questionId,
    text: q.text ?? q.questionText ?? "",
    image: q.image ?? q.questionImage ?? null,
    type: q.type ?? null,
    grade: q.grade ?? 1,
    passage: q.passage || null,
    choices: choices.filter((choice) => choice.text || choice.image),
  };
}

/** تطبيع مصفوفة أسئلة من API الامتحان */
export function normalizeExamQuestionsFromApi(questionsArray) {
  if (!Array.isArray(questionsArray)) return [];
  return questionsArray
    .map(normalizeSingleExamQuestion)
    .filter((item) => item && (item.id != null || item.text || item.image));
}

/** استخراج معرّف المحاولة من صيغ API مختلفة (camelCase / snake_case / nested) */
export function toPositiveAttemptId(value) {
  if (value == null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function collectAttemptIds(source, depth = 0, bucket = []) {
  if (!source || typeof source !== "object" || depth > 3) return bucket;

  const push = (value) => {
    const id = toPositiveAttemptId(value);
    if (id != null) bucket.push(id);
  };

  push(source.attemptId);
  push(source.attempt_id);
  push(source.attemptID);
  push(source.activeAttemptId);
  push(source.active_attempt_id);

  const looksLikeAttemptStart =
    Array.isArray(source.questions) ||
    source.examTitle != null ||
    source.durationMinutes != null ||
    source.timeLimitMinutes != null ||
    source.startedAt != null ||
    source.remainingSeconds != null;

  if (looksLikeAttemptStart && source.attempt == null) {
    push(source.id);
  }

  const attemptLike = [
    source.attempt,
    source.currentAttempt,
    source.examAttempt,
    source.latestAttempt,
    source.activeAttempt,
  ];
  for (const attempt of attemptLike) {
    if (!attempt || typeof attempt !== "object") continue;
    push(attempt.attemptId);
    push(attempt.attempt_id);
    push(attempt.attemptID);
    push(attempt.id);
  }

  const nested = [source.data, source.result, source.payload, source.session];
  for (const node of nested) {
    if (node && typeof node === "object") {
      collectAttemptIds(node, depth + 1, bucket);
    }
  }

  return bucket;
}

export function extractExamAttemptId(source = {}, examId = null) {
  if (!source || typeof source !== "object") return null;

  const ids = [...new Set(collectAttemptIds(source))];
  if (!ids.length) return null;

  const examNum = toPositiveAttemptId(examId);
  const notExamId = examNum != null ? ids.filter((id) => id !== examNum) : ids;
  return notExamId[0] ?? null;
}
