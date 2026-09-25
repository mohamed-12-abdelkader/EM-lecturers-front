/** Parse choices from API/DB (array, JSON string, or null). */
export function parseTeacherChoices(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((c) => {
        if (c && typeof c === "object") return String(c.text ?? c.label ?? "").trim();
        return String(c ?? "").trim();
      })
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((c) => {
            if (c && typeof c === "object") return String(c.text ?? c.label ?? "").trim();
            return String(c ?? "").trim();
          })
          .filter(Boolean);
      }
    } catch {
      return [trimmed];
    }
  }
  return [];
}

export function normalizeTeacherQuestion(q) {
  if (!q) return null;
  const choices = parseTeacherChoices(q.choices ?? q.options);
  const questionType = q.question_type || (choices.length > 0 ? "choice" : "text");
  const imageUrl = q.image_url || q.imageUrl || null;
  const passage =
    q.passage && typeof q.passage === "object"
      ? {
          id: q.passage.id,
          title: q.passage.title || "",
          text: q.passage.text || q.passage.content || "",
          content: q.passage.content || q.passage.text || "",
        }
      : null;
  const passageId = q.passage_id ?? q.passageId ?? passage?.id ?? null;

  let correctIndex =
    q.correct_answer_index != null ? Number(q.correct_answer_index) : null;
  if (correctIndex == null && Array.isArray(q.options)) {
    const idx = q.options.findIndex((o) => o?.isCorrect === true || o?.is_correct === true);
    if (idx >= 0) correctIndex = idx;
  }

  return {
    ...q,
    choices,
    question_type: questionType,
    image_url: imageUrl,
    passage,
    passage_id: passageId,
    correct_answer_index: correctIndex,
    question_text: q.question_text || q.questionText || q.text || "",
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
    id: p.id,
    title: p.title || "",
    content: p.content || p.text || "",
    text: p.text || p.content || "",
    questions: (p.questions || []).map(normalizeTeacherQuestion).filter(Boolean),
  }));
}

export function normalizeLessonQuestionsResponse(questionsRaw = []) {
  return questionsRaw.map(normalizeTeacherQuestion).filter(Boolean);
}

/**
 * يبني قائمة قطع من استجابة القطع و/أو الأسئلة المسطحة
 * (سؤال قطعة → passage: { id, text, title }).
 */
export function buildPassagesFromLessonContent({ questions = [], passages = [] } = {}) {
  const byId = new Map();

  for (const p of normalizePassagesResponse(passages)) {
    if (p?.id == null) continue;
    byId.set(String(p.id), {
      id: p.id,
      title: p.title || "",
      content: p.content || p.text || "",
      questions: [...(p.questions || [])],
    });
  }

  for (const q of questions) {
    const passageMeta = q?.passage;
    const passageId = q?.passage_id ?? passageMeta?.id;
    if (passageId == null) continue;
    const key = String(passageId);
    if (!byId.has(key)) {
      byId.set(key, {
        id: passageId,
        title: passageMeta?.title || "",
        content: passageMeta?.text || passageMeta?.content || "",
        questions: [],
      });
    }
    const group = byId.get(key);
    if (passageMeta?.title && !group.title) group.title = passageMeta.title;
    if ((passageMeta?.text || passageMeta?.content) && !group.content) {
      group.content = passageMeta.text || passageMeta.content;
    }
    if (!group.questions.some((existing) => existing.id === q.id)) {
      group.questions.push(q);
    }
  }

  return Array.from(byId.values());
}

/** أسئلة مستقلة (بدون قطعة). */
export function getStandaloneQuestions(questions = []) {
  return questions.filter((q) => q?.passage_id == null && !q?.passage?.id);
}
