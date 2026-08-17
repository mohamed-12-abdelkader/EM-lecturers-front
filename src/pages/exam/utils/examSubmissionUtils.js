/** تطبيع حقول wrong_questions من GET /api/course/course-exam/:id/submissions */

function resolveOptionText(question, letter) {
  if (!letter || !question) return null;
  const key = `option${String(letter).trim().toUpperCase()}`;
  return question[key] ?? null;
}

export function formatSubmissionAnswer(letter, text, question) {
  const normalizedLetter = letter ? String(letter).trim().toUpperCase() : "";
  const resolvedText =
    (text && String(text).trim()) ||
    resolveOptionText(question, normalizedLetter) ||
    null;

  if (!normalizedLetter && !resolvedText) return "لم يجب";
  if (normalizedLetter && resolvedText) return `${normalizedLetter} — ${resolvedText}`;
  return resolvedText || normalizedLetter;
}

export function normalizeWrongQuestion(raw) {
  if (!raw || typeof raw !== "object") return null;

  const yourLetter = raw.yourAnswer ?? raw.yourChoice?.id ?? null;
  const correctLetter = raw.correctAnswer ?? raw.correctChoice?.id ?? null;
  const yourText = raw.yourAnswerText ?? raw.yourChoice?.text ?? null;
  const correctText = raw.correctAnswerText ?? raw.correctChoice?.text ?? null;

  return {
    questionId: raw.questionId ?? raw.id,
    questionText: raw.questionText ?? raw.text ?? "",
    questionImage: raw.questionImage ?? raw.image ?? null,
    type: raw.type ?? "mcq",
    yourAnswerDisplay: formatSubmissionAnswer(yourLetter, yourText, raw),
    correctAnswerDisplay: formatSubmissionAnswer(correctLetter, correctText, raw),
  };
}

export function getWrongQuestions(submission) {
  const list = submission?.wrong_questions ?? submission?.wrongQuestions ?? [];
  if (!Array.isArray(list)) return [];
  return list.map(normalizeWrongQuestion).filter(Boolean);
}

export function getWrongQuestionsCount(submission) {
  if (submission?.wrong_questions_count != null) {
    return Number(submission.wrong_questions_count) || 0;
  }
  return getWrongQuestions(submission).length;
}
