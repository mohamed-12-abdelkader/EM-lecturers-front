/** Parse choices from API/DB (array, JSON string, or null). */
export function parseTeacherChoices(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map((c) => String(c ?? "").trim()).filter(Boolean);
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((c) => String(c ?? "").trim()).filter(Boolean);
      }
    } catch {
      return [trimmed];
    }
  }
  return [];
}

export function normalizeTeacherQuestion(q) {
  if (!q) return null;
  const choices = parseTeacherChoices(q.choices);
  const questionType = q.question_type || (choices.length > 0 ? "choice" : "text");
  const imageUrl = q.image_url || q.imageUrl || null;

  return {
    ...q,
    choices,
    question_type: questionType,
    image_url: imageUrl,
    correct_answer_index:
      q.correct_answer_index != null ? Number(q.correct_answer_index) : null,
  };
}

/** عبارة فرعية داخل قطعة (مقالي بدون إجابة نموذجية). */
export function isPassageStatementQuestion(question, inPassage = false) {
  if (!inPassage || !question) return false;
  if (question.question_type !== "text") return false;
  if (question.image_url) return false;
  const hasAnswer = Boolean(question.answer?.trim?.() || question.answer);
  return !hasAnswer && (!question.choices || question.choices.length === 0);
}

export function normalizePassagesResponse(passagesRaw = []) {
  return passagesRaw.map((p) => ({
    ...p,
    questions: (p.questions || []).map(normalizeTeacherQuestion).filter(Boolean),
  }));
}

export function normalizeLessonQuestionsResponse(questionsRaw = []) {
  return questionsRaw.map(normalizeTeacherQuestion).filter(Boolean);
}
