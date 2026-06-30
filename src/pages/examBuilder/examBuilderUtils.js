/** استخراج قائمة الأسئلة من رد الـ API */
export function resolveProposalQuestions(data) {
  if (!data) return [];
  const list =
    data.questions ??
    data.session?.selected_questions ??
    data.item?.selected_questions ??
    data.selected_questions ??
    [];
  return Array.isArray(list) ? list : [];
}

export const SESSION_STATUS_LABELS = {
  proposed: "بانتظار الاعتماد",
  approved: "معتمد",
  cancelled: "ملغى",
};

/** تحويل عنصر GET /history إلى حالة العرض في اللوحة */
export function historyItemToProposalState(item) {
  if (!item) {
    return {
      session: null,
      questions: [],
      reply: "",
      actions: { can_approve: false, can_regenerate: false },
    };
  }

  const session = {
    id: item.session_id ?? item.id,
    status: item.status,
    user_message: item.user_message,
    parsed_filters: item.parsed_filters,
    selected_questions: item.selected_questions ?? [],
    available_count: item.available_count,
    requested_count: item.requested_count,
    exam_id: item.exam_id,
    exam_type: item.exam_type,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };

  const isProposed = session.status === "proposed";

  return {
    session,
    questions: item.selected_questions ?? [],
    reply: item.assistant_reply || "",
    actions: isProposed
      ? { can_approve: true, can_regenerate: true }
      : { can_approve: false, can_regenerate: false },
  };
}

export function getQuestionBody(item) {
  if (!item) return null;
  if (item.question && typeof item.question === "object") return item.question;
  return {
    id: item.id,
    question_text: item.question_text || item.preview_excerpt || "",
    question_type: item.question_type,
    difficulty_level: item.difficulty_level,
    correct_answer_index: item.correct_answer_index,
    options: item.options || [],
    media: item.media || (item.media_url ? { media_url: item.media_url } : null),
  };
}

export function getQuestionMediaUrl(item) {
  const body = getQuestionBody(item);
  return body?.media?.media_url || body?.media_url || null;
}

export function getQuestionOptions(item) {
  const body = getQuestionBody(item);
  return Array.isArray(body?.options) ? body.options : [];
}

export function getQuestionText(item) {
  const body = getQuestionBody(item);
  return body?.question_text || item?.preview_excerpt || "";
}

export function renderMarkdownInline(text) {
  if (!text) return [];
  return String(text).split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
}

export function formatMessageTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

export function countCatalogQuestions(catalog) {
  if (!Array.isArray(catalog)) return 0;
  return catalog.reduce((sum, ch) => sum + (ch.question_count || 0), 0);
}

/** اتجاه النص للعناوين (عربي / إنجليزي / مختلط) */
export function resolveTextDirection(text = "") {
  const value = String(text).trim();
  if (!value) return "rtl";

  const rtlChars = (value.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
  const latinChars = (value.match(/[A-Za-z]/g) || []).length;

  if (rtlChars > 0 && latinChars > 0) return "auto";
  if (latinChars > 0 && rtlChars === 0) return "ltr";
  return "rtl";
}

export const PDF_FONT_FAMILY =
  "'Noto Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif";

export function stripPlainText(value = "") {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** تخطيط الاختيارات: صف واحد | صفين | أربعة صفوف */
export function getPdfOptionLayout(options = []) {
  const texts = options.map((opt) => stripPlainText(opt.text_content || opt.text || ""));
  if (!texts.length) return { mode: "none", columns: 0 };

  const maxLen = Math.max(...texts.map((t) => t.length));
  const hasLong = texts.some((t) => t.length > 48);
  const hasMedium = texts.some((t) => t.length > 24);

  if (!hasMedium && maxLen <= 24) {
    return { mode: "row", columns: Math.min(4, texts.length) };
  }
  if (!hasLong && maxLen <= 48) {
    return { mode: "grid2", columns: 2 };
  }
  return { mode: "stack", columns: 1 };
}

export function estimatePdfQuestionWeight(item) {
  const text = stripPlainText(getQuestionText(item));
  const options = getQuestionOptions(item);
  const mediaUrl = getQuestionMediaUrl(item);
  const layout = getPdfOptionLayout(options);

  let weight = 0.9;
  weight += Math.min(2.8, Math.ceil(text.length / 120));
  if (mediaUrl) weight += 1.6;

  if (layout.mode === "row") weight += 0.55;
  else if (layout.mode === "grid2") weight += 0.95;
  else weight += Math.min(4, options.length) * 0.42;

  return weight;
}

/** تقسيم الأسئلة: 5 أسئلة في كل صفحة */
export function partitionQuestionsForPdfPages(questions, { maxPerPage = 5 } = {}) {
  const pages = [];
  for (let index = 0; index < questions.length; index += maxPerPage) {
    pages.push(questions.slice(index, index + maxPerPage));
  }
  return pages;
}
