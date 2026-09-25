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

/** نص القطعة من حقول الـ API المختلفة. */
export function resolvePassageContent(passageLike) {
  if (!passageLike || typeof passageLike !== "object") return "";
  return (
    passageLike.content ||
    passageLike.text ||
    passageLike.passageText ||
    passageLike.passage_text ||
    ""
  );
}

/** عنوان القطعة أو أول سطر من النص. */
export function derivePassageTitle(passageLike, fallback = "") {
  const explicit =
    (passageLike && (passageLike.title || passageLike.passageTitle || passageLike.passage_title)) ||
    fallback;
  if (explicit && String(explicit).trim()) return String(explicit).trim();
  const content = resolvePassageContent(passageLike);
  const firstLine = String(content)
    .split(/\n/)
    .map((l) => l.trim())
    .find(Boolean);
  return firstLine ? firstLine.slice(0, 60) : "";
}

export function normalizeTeacherQuestion(q) {
  if (!q) return null;
  const choices = parseTeacherChoices(q.choices ?? q.options);
  const rawType = String(q.question_type || q.type || "").toLowerCase();
  const questionType =
    rawType === "choice" || rawType === "mcq" || rawType === "multiple_choice"
      ? "choice"
      : rawType === "text" || rawType === "essay" || rawType === "written"
        ? "text"
        : choices.length > 0
          ? "choice"
          : "text";
  const imageUrl = q.image_url || q.imageUrl || null;
  const passageRaw = q.passage && typeof q.passage === "object" ? q.passage : null;
  const passageContent = resolvePassageContent(passageRaw) || String(q.passageText || q.passage_text || "").trim();
  const passage =
    passageRaw || passageContent
      ? {
          id: passageRaw?.id ?? q.passage_id ?? q.passageId ?? null,
          title: derivePassageTitle(passageRaw || { content: passageContent }),
          text: passageContent,
          content: passageContent,
        }
      : null;
  const passageId = q.passage_id ?? q.passageId ?? passage?.id ?? null;

  let correctIndex =
    q.correct_answer_index != null
      ? Number(q.correct_answer_index)
      : q.correctAnswerIndex != null
        ? Number(q.correctAnswerIndex)
        : null;
  if ((correctIndex == null || Number.isNaN(correctIndex)) && Array.isArray(q.options)) {
    const idx = q.options.findIndex((o) => o?.isCorrect === true || o?.is_correct === true);
    if (idx >= 0) correctIndex = idx;
  }

  const {
    passage: _ignoredPassage,
    options: _ignoredOptions,
    ...rest
  } = q;

  return {
    ...rest,
    choices,
    question_type: questionType,
    image_url: imageUrl,
    passage: passage?.id != null || passageContent ? passage : null,
    passage_id: passageId,
    passageId,
    passageText: passageContent || null,
    correct_answer_index: Number.isNaN(correctIndex) ? null : correctIndex,
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
  return (Array.isArray(passagesRaw) ? passagesRaw : []).map((p) => {
    const content = resolvePassageContent(p);
    return {
      ...p,
      id: p.id,
      title: derivePassageTitle(p),
      content,
      text: content,
      questions: (p.questions || []).map(normalizeTeacherQuestion).filter(Boolean),
    };
  });
}

export function normalizeLessonQuestionsResponse(questionsRaw = []) {
  return (Array.isArray(questionsRaw) ? questionsRaw : [])
    .map(normalizeTeacherQuestion)
    .filter(Boolean);
}

function mergeQuestionIntoPassageGroup(group, q) {
  if (!q?.id) {
    group.questions.push(q);
    return;
  }
  if (!group.questions.some((existing) => existing.id === q.id)) {
    group.questions.push(q);
  }
}

/**
 * يبني قائمة قطع من استجابة القطع و/أو الأسئلة المسطحة
 * (سؤال قطعة → passage: { id, text, title } أو passageText / passage_id).
 */
export function buildPassagesFromLessonContent({ questions = [], passages = [] } = {}) {
  const byId = new Map();

  for (const p of normalizePassagesResponse(passages)) {
    if (p?.id == null) continue;
    const key = String(p.id);
    if (!byId.has(key)) {
      byId.set(key, {
        id: p.id,
        title: p.title || derivePassageTitle(p),
        content: p.content || "",
        questions: [...(p.questions || [])],
      });
      continue;
    }
    const group = byId.get(key);
    if (p.title && !group.title) group.title = p.title;
    if (p.content && !group.content) group.content = p.content;
    for (const q of p.questions || []) mergeQuestionIntoPassageGroup(group, q);
  }

  for (const q of questions) {
    const passageMeta = q?.passage;
    const passageId = q?.passage_id ?? q?.passageId ?? passageMeta?.id;
    if (passageId == null) continue;
    const key = String(passageId);
    const metaContent = resolvePassageContent(passageMeta) || String(q.passageText || "").trim();
    if (!byId.has(key)) {
      byId.set(key, {
        id: passageId,
        title: derivePassageTitle(passageMeta || { content: metaContent }),
        content: metaContent,
        questions: [],
      });
    }
    const group = byId.get(key);
    if (passageMeta?.title && !group.title) group.title = passageMeta.title;
    if (metaContent && !group.content) group.content = metaContent;
    if (!group.title) group.title = derivePassageTitle({ content: group.content });
    mergeQuestionIntoPassageGroup(group, q);
  }

  return Array.from(byId.values());
}

/** أسئلة مستقلة (بدون قطعة). */
export function getStandaloneQuestions(questions = []) {
  return questions.filter(
    (q) => q?.passage_id == null && q?.passageId == null && !q?.passage?.id,
  );
}

const ARABIC_OPTION_MAP = {
  أ: "A",
  ا: "A",
  ب: "B",
  ج: "C",
  د: "D",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
};

/**
 * يحوّل نص Bulk (مثل أسئلة اختيار من متعدد العربية) إلى مصفوفة questions
 * بصيغة POST /api/questions/reading-passage
 */
export function parseReadingPassageBulkText(bulkText, correctAnswers = []) {
  const raw = String(bulkText || "").replace(/\r\n/g, "\n").trim();
  if (!raw) return [];

  const normalizedCorrect = (Array.isArray(correctAnswers) ? correctAnswers : [])
    .map((a) => {
      const key = String(a || "").trim();
      return ARABIC_OPTION_MAP[key] || ARABIC_OPTION_MAP[key.toUpperCase()] || key.toUpperCase();
    })
    .filter(Boolean);

  // تقسيم الكتل بأسطر فارغة، مع دعم أسئلة متتالية بدون سطر فارغ إن وُجدت خيارات
  let blocks = raw
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length === 1) {
    // محاولة تقسيم عند كل سطر سؤال جديد يبدأ بدون (أ/A)
    const lines = raw.split("\n");
    const rebuilt = [];
    let current = [];
    const isOptionLine = (line) =>
      /^\s*(?:\(?[أاببججدABCDabcd]\)?[)\.\-:-]|\([أاببججدABCD]\))\s*/u.test(line);
    const isQuestionStart = (line, idx) => {
      const t = line.trim();
      if (!t || isOptionLine(t)) return false;
      if (/^\d+[\-\)\.]\s*/.test(t)) return true;
      // سطر نص بعد خيارات = بداية سؤال جديد
      if (idx > 0 && current.some(isOptionLine)) return true;
      return current.length === 0;
    };
    lines.forEach((line, idx) => {
      if (isQuestionStart(line, idx) && current.length) {
        rebuilt.push(current.join("\n").trim());
        current = [line];
      } else {
        current.push(line);
      }
    });
    if (current.length) rebuilt.push(current.join("\n").trim());
    if (rebuilt.length > 1) blocks = rebuilt.filter(Boolean);
  }

  const questions = [];

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) continue;

    const optionLineRe =
      /^(?:\(?([أاببججدABCDabcd])\)?[)\.\-:-]|\(([أاببججدABCD])\))\s*(.*)$/u;
    const optionIndexes = [];
    lines.forEach((line, idx) => {
      if (optionLineRe.test(line)) optionIndexes.push(idx);
    });

    if (optionIndexes.length < 2) continue;

    const firstOptIdx = optionIndexes[0];
    let questionText = lines.slice(0, firstOptIdx).join(" ").trim();
    questionText = questionText.replace(/^\d+[\-\)\.]\s*/, "").trim();
    if (!questionText) continue;

    const options = [];
    for (const idx of optionIndexes) {
      const line = lines[idx];
      const match = line.match(optionLineRe);
      if (!match) continue;
      const letter = (match[1] || match[2] || "").trim();
      const text = String(match[3] || "").trim().replace(/^\.+/, "").trim();
      if (!text) continue;
      const code = ARABIC_OPTION_MAP[letter] || ARABIC_OPTION_MAP[letter.toUpperCase()] || null;
      options.push({ text, letter: code, isCorrect: false });
    }

    if (options.length < 2) continue;

    const qIndex = questions.length;
    const wanted = normalizedCorrect[qIndex];
    if (wanted) {
      const found = options.findIndex((o) => o.letter === wanted);
      if (found >= 0) options[found].isCorrect = true;
      else options[0].isCorrect = true;
    } else {
      options[0].isCorrect = true;
    }

    questions.push({
      questionText,
      options: options.map(({ text, isCorrect }) => ({ text, isCorrect })),
    });

    if (questions.length >= 50) break;
  }

  return questions;
}
