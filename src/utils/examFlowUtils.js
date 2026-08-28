import { getApiBaseURL } from "../api/apiConfig";
import { getAuthScopeSubdomain } from "./tenantAuthStorage";
import { getTenantSubdomain } from "./tenantHost";

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
    duration: data.duration,
    isVisible: data.is_visible ?? true,
    lockNextLectures: data.lock_next_lectures ?? true,
    showAnswersImmediately: data.show_answers_immediately ?? false,
  };

  if (data.show_answers_after_hours != null && data.show_answers_after_hours !== "") {
    payload.showAnswersAfterHours = Number(data.show_answers_after_hours);
  }
  if (data.show_at) payload.showAt = new Date(data.show_at).toISOString();
  if (data.hide_at) payload.hideAt = new Date(data.hide_at).toISOString();

  return payload;
}

export function buildLectureExamUpdatePayload(data) {
  const payload = {
    title: data.title,
    total_grade: data.total_grade,
    duration: data.duration,
    is_visible: data.is_visible,
    lock_next_lectures: data.lock_next_lectures,
    show_answers_immediately: data.show_answers_immediately,
    show_answers_after_hours: data.show_answers_after_hours,
    questions_count: Number(data.questions_count),
    question_display_mode: normalizeQuestionDisplayMode(data.question_display_mode),
  };

  if (data.type) payload.type = data.type;
  if (data.show_at) payload.show_at = new Date(data.show_at).toISOString();
  if (data.hide_at) payload.hide_at = new Date(data.hide_at).toISOString();

  return payload;
}

export function buildExamSubmitAnswers(studentAnswers = {}) {
  return Object.entries(studentAnswers).map(([questionId, selectedAnswer]) => ({
    questionId: Number(questionId),
    selectedAnswer,
  }));
}

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
export function extractExamAttemptId(source = {}) {
  if (!source || typeof source !== "object") return null;

  const attempt = source.attempt;
  const hasStartPayload =
    Array.isArray(source.questions) ||
    source.examTitle != null ||
    source.durationMinutes != null ||
    source.timeLimitMinutes != null;

  const candidates = [
    source.attemptId,
    source.attempt_id,
    attempt?.attemptId,
    attempt?.attempt_id,
    attempt?.id,
  ];

  if (!attempt && hasStartPayload) {
    candidates.push(source.id);
  }

  for (const value of candidates) {
    if (value == null || value === "") continue;
    const num = Number(value);
    if (Number.isFinite(num) && num > 0) return num;
  }

  return null;
}

export function submitExamKeepalive({ examId, attemptId, answers = [] }) {
  if (typeof window === "undefined" || !examId || !attemptId) return;

  const token = localStorage.getItem("token");

  const base = String(getApiBaseURL() || "/").replace(/\/$/, "");
  const url = `${base}/api/exams/${examId}/submit`;

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const tenant = getTenantSubdomain() || getAuthScopeSubdomain();
  if (tenant) headers["X-Tenant-Subdomain"] = tenant;

  try {
    fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ attemptId, answers }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore unload errors
  }
}
