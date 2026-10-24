import baseUrl from "./baseUrl";

export const OCR_API = "/api/ocr";
/** No client-side file-size cap — accept any size. */
export const MAX_OCR_IMAGE_FILES = 100;
export const MAX_PDF_PAGES_PER_REQUEST = null;

export const SUPPORTED_OCR_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/bmp",
  "image/tiff",
];

const SUPPORTED_OCR_EXTENSIONS = /\.(pdf|png|jpe?g|webp|gif|avif|bmp|tiff?)$/i;

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** @param {File} file */
export function isPdfFile(file) {
  return file?.type === "application/pdf" || /\.pdf$/i.test(file?.name || "");
}

/** @param {File} file */
export function isImageOcrFile(file) {
  if (!file || isPdfFile(file)) return false;
  return (
    file.type.startsWith("image/") ||
    SUPPORTED_OCR_EXTENSIONS.test(file.name) ||
    SUPPORTED_OCR_MIME_TYPES.includes(file.type)
  );
}

/**
 * يستخرج ملفات الصور من حدث اللصق (Ctrl+V / Cmd+V).
 * @param {ClipboardEvent} event
 * @returns {File[]}
 */
export function filesFromClipboardEvent(event) {
  const items = event?.clipboardData?.items;
  if (!items?.length) return [];

  const files = [];
  const stamp = Date.now();
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (!item || item.kind !== "file") continue;
    if (!String(item.type || "").startsWith("image/")) continue;
    const blob = item.getAsFile();
    if (!blob) continue;
    const ext =
      (item.type.split("/")[1] || "png").replace("jpeg", "jpg") || "png";
    files.push(
      new File([blob], `pasted-image-${stamp}-${i}.${ext}`, {
        type: blob.type || item.type || "image/png",
        lastModified: stamp,
      }),
    );
  }
  return files;
}

/** @param {File} file */
export function validateOcrFile(file) {
  if (!file) return "لم يتم اختيار ملف";
  if (!isPdfFile(file) && !isImageOcrFile(file)) {
    return "يسمح برفع PDF أو صورة فقط (PNG, JPEG, WebP, GIF, AVIF, BMP, TIFF)";
  }
  return null;
}

/** @param {File[]} files */
export function validateOcrFiles(files) {
  if (!files?.length) return "لم يتم اختيار ملف";
  if (files.length > MAX_OCR_IMAGE_FILES) {
    return `الحد الأقصى ${MAX_OCR_IMAGE_FILES} صورة في طلب واحد`;
  }

  const pdfFiles = files.filter(isPdfFile);
  if (pdfFiles.length > 1) return "ارفع ملف PDF واحد فقط";
  if (pdfFiles.length > 0 && files.length > 1) {
    return "لا يمكن رفع PDF مع صور أخرى — ارفع PDF واحد أو صور متعددة فقط";
  }

  for (const file of files) {
    const err = validateOcrFile(file);
    if (err) return err;
  }
  return null;
}

/**
 * @param {number|string|undefined|null} startPage
 * @param {number|string|undefined|null} endPage
 */
export function validatePdfPageRange(startPage, endPage) {
  const hasStart = startPage != null && startPage !== "";
  const hasEnd = endPage != null && endPage !== "";
  if (!hasStart && !hasEnd) return null;

  const start = Number(startPage);
  const end = Number(endPage);
  if (!Number.isInteger(start) || start < 1) {
    return "رقم الصفحة الأولى يجب أن يكون عدداً صحيحاً يبدأ من 1";
  }
  if (!Number.isInteger(end) || end < 1) {
    return "رقم الصفحة الأخيرة يجب أن يكون عدداً صحيحاً يبدأ من 1";
  }
  if (end < start) {
    return "رقم الصفحة الأخيرة يجب أن يكون أكبر من أو يساوي الأولى";
  }
  if (
    MAX_PDF_PAGES_PER_REQUEST != null &&
    end - start + 1 > MAX_PDF_PAGES_PER_REQUEST
  ) {
    return `الحد الأقصى ${MAX_PDF_PAGES_PER_REQUEST} صفحة في طلب واحد`;
  }
  return null;
}

/** @param {unknown} error */
export function formatOcrApiError(error) {
  const data = error?.response?.data;
  if (!data) {
    return error?.message || "حدث خطأ غير متوقع";
  }
  const base = data.message || data.error || "فشل في معالجة الطلب";
  const details = Array.isArray(data.errors)
    ? data.errors
        .map((item) => {
          const path = Array.isArray(item.path) ? item.path.join(".") : "";
          return path ? `${path}: ${item.message}` : item.message;
        })
        .filter(Boolean)
        .join(" — ")
    : "";
  return details ? `${base} (${details})` : base;
}

export const newDraftId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/** عدد الاختيارات حسب API الاستخراج (2–5) */
export const MCQ_CHOICE_MIN = 2;
export const MCQ_CHOICE_MAX = 5;
/** امتحانات المحاضرة/الكورس تدعم أ–د فقط */
export const EXAM_MCQ_CHOICE_MAX = 4;

export const CHOICE_LETTERS_LATIN = ["A", "B", "C", "D", "E"];
export const CHOICE_LETTERS_AR = ["أ", "ب", "ج", "د", "هـ"];

export const getChoiceLetter = (index, script = "latin") => {
  const list = script === "ar" ? CHOICE_LETTERS_AR : CHOICE_LETTERS_LATIN;
  return list[index] || String(index + 1);
};

export const normalizeMcqChoices = (choices = []) =>
  (Array.isArray(choices) ? choices : [])
    .map((c) => String(c ?? "").trim())
    .filter(Boolean)
    .slice(0, MCQ_CHOICE_MAX);

/** اختيار صالح: نص أو صورة (اختيارات مصوّرة) */
export const choiceHasContent = (text, image) => {
  if (String(text ?? "").trim()) return true;
  if (!image) return false;
  if (typeof image === "string") return Boolean(image.trim());
  return Boolean(image.image_url || image.url);
};

export const isValidMcqChoiceCount = (choices = [], choiceImages = []) => {
  if (!Array.isArray(choices) || choices.length === 0) return false;
  if (choices.length < MCQ_CHOICE_MIN || choices.length > MCQ_CHOICE_MAX) return false;
  const images = Array.isArray(choiceImages) ? choiceImages : [];
  return choices.every((c, i) => choiceHasContent(c, images[i]));
};

const CHOICE_IMAGE_TYPES = new Set([
  "choice_option",
  "option",
  "answer_choice",
  "choice",
]);

function resolveOptionImage(option, questionImages = []) {
  const direct = option?.image_url || option?.url || null;
  if (direct) {
    return {
      image_id: option?.image_id ?? null,
      image_url: String(direct),
      image_type: "choice_option",
      short_description: option?.short_description || "",
    };
  }
  const imageId = option?.image_id;
  if (!imageId) return null;
  const found = (Array.isArray(questionImages) ? questionImages : []).find(
    (img) => img?.image_id === imageId && img?.image_url,
  );
  if (!found) return null;
  return {
    image_id: found.image_id,
    image_url: String(found.image_url),
    image_type: found.image_type || "choice_option",
    short_description: found.short_description || "",
  };
}

export const emptyDraftQuestion = () => ({
  id: newDraftId(),
  question_text: "",
  intro_text: null,
  stimulus_text: null,
  prompt_text: null,
  display_blocks: [],
  underlined_phrases: [],
  poetry: false,
  verses: [],
  score: null,
  confidence: null,
  question_type: "choice",
  choices: ["", "", "", ""],
  choiceImages: [null, null, null, null],
  optionLabels: ["أ", "ب", "ج", "د"],
  answer: "",
  correctAnswerIndex: null,
  answerInferred: false,
  image_url: null,
  imageDescription: "",
  questionImages: [],
  questionTable: null,
  passage_id: null,
  source_number: null,
});

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** يلف العبارات المستخرجة بـ <u> إن لم تكن مُسطَّرة مسبقاً */
export function applyUnderlinedPhrases(text, phrases) {
  let result = String(text ?? "");
  const list = Array.isArray(phrases) ? phrases : [];
  for (const phrase of list) {
    const p = String(phrase || "").trim();
    if (!p) continue;
    if (new RegExp(`<u[^>]*>\\s*${escapeRegExp(p)}\\s*</u>`, "i").test(result)) continue;
    result = result.replace(new RegExp(escapeRegExp(p), "g"), `<u>${p}</u>`);
  }
  return result;
}

/**
 * يبني نص السؤال من حقول الاستخراج (display_blocks / أجزاء النص / الأبيات)
 * @param {object} q — سؤال من extract-questions
 */
export function composeOcrQuestionText(q) {
  const phrases = q?.underlined_phrases;
  const blocks = Array.isArray(q?.display_blocks)
    ? q.display_blocks.filter((b) => String(b?.text ?? "").trim())
    : [];
  if (blocks.length > 0) {
    return applyUnderlinedPhrases(
      blocks.map((b) => String(b.text).trim()).join("\n\n"),
      phrases,
    );
  }

  const structured = [q?.intro_text, q?.stimulus_text, q?.prompt_text]
    .map((t) => String(t ?? "").trim())
    .filter(Boolean);
  if (structured.length > 0) {
    return applyUnderlinedPhrases(structured.join("\n\n"), phrases);
  }

  let text = String(q?.question_text ?? "").trim();
  const verses = Array.isArray(q?.verses) ? q.verses : [];
  if (!text && verses.length > 0) {
    text = verses
      .map((v) => {
        const a = String(v?.firstHemistich ?? "").trim();
        const b = String(v?.secondHemistich ?? "").trim();
        if (!a && !b) return "";
        if (a && b) return `${a} . : ${b}`;
        return a || b;
      })
      .filter(Boolean)
      .join("\n");
  }

  return applyUnderlinedPhrases(text, phrases);
}

export const resolveOcrAnswer = (q) => {
  const options = Array.isArray(q.options) ? q.options : [];
  if (q.correct_answer_index != null && options[q.correct_answer_index]) {
    return options[q.correct_answer_index].text ?? "";
  }
  if (q.correct_answer != null && q.correct_answer !== "") {
    const label = String(q.correct_answer).trim();
    const byLabel = options.find(
      (o) => String(o.label ?? "").trim().toLowerCase() === label.toLowerCase(),
    );
    if (byLabel?.text) return byLabel.text;
    const byText = options.find((o) => String(o.text ?? "").trim() === label);
    if (byText?.text) return byText.text;
  }
  return "";
};

function resolveOcrCorrectIndex(q, optionTexts) {
  if (
    Number.isInteger(q.correct_answer_index) &&
    q.correct_answer_index >= 0 &&
    q.correct_answer_index < optionTexts.length
  ) {
    return q.correct_answer_index;
  }
  if (q.correct_answer == null || q.correct_answer === "") return null;
  const label = String(q.correct_answer).trim().toLowerCase();
  const options = Array.isArray(q.options) ? q.options : [];
  const byLabel = options.findIndex(
    (o) => String(o.label ?? "").trim().toLowerCase() === label,
  );
  if (byLabel >= 0) return byLabel;
  const byText = optionTexts.findIndex((t) => t === String(q.correct_answer).trim());
  return byText >= 0 ? byText : null;
}

/**
 * يحوّل سؤال OCR إلى مسودة — يدعم 2–5 اختيارات (نص/صورة) + جداول + قطع + display_blocks
 * @param {object} q
 */
export const mapOcrQuestionToDraft = (q) => {
  const rawQuestionImages = Array.isArray(q.question_images)
    ? q.question_images.filter((image) => image?.image_url)
    : [];

  const rawOptions = Array.isArray(q.options) ? q.options : [];
  const mappedOptions = rawOptions
    .map((o, i) => {
      const text = o?.text == null ? "" : String(o.text).trim();
      const image = resolveOptionImage(o, rawQuestionImages);
      if (!choiceHasContent(text, image)) return null;
      return {
        label: String(o?.label ?? "").trim() || CHOICE_LETTERS_AR[i] || String(i + 1),
        text,
        image,
      };
    })
    .filter(Boolean)
    .slice(0, MCQ_CHOICE_MAX);

  const optionTexts = mappedOptions.map((o) => o.text);
  const choiceImages = mappedOptions.map((o) => o.image);
  const optionLabels = mappedOptions.map((o) => o.label);
  const hasMcqOptions = mappedOptions.length >= MCQ_CHOICE_MIN;

  // أشكال السؤال / جداول مرئية — بدون صور الاختيارات المصوّرة
  const questionImages = rawQuestionImages
    .filter((image) => {
      const t = String(image.image_type || "").toLowerCase();
      return !CHOICE_IMAGE_TYPES.has(t);
    })
    .map((image) => ({
      image_id: image.image_id ?? null,
      page_index: image.page_index ?? null,
      image_type: image.image_type || "question_figure",
      short_description: image.short_description || "",
      image_url: String(image.image_url),
    }));
  const questionImage = questionImages[0] || null;
  const hasImages = questionImages.length > 0 || !!questionImage?.image_url;
  const questionTable =
    q.question_table &&
    (q.question_table.role === "options" || q.question_table.role === "data")
      ? {
          role: q.question_table.role,
          format: q.question_table.format || "markdown",
          content: String(q.question_table.content || ""),
        }
      : null;

  let questionType = "choice";
  if (hasMcqOptions) {
    questionType = "choice";
  } else if (hasImages) {
    questionType = "text_with_image";
  } else {
    questionType = "text";
  }

  const choices = hasMcqOptions ? optionTexts : ["", "", "", ""];
  const draftChoiceImages = hasMcqOptions
    ? choiceImages
    : [null, null, null, null];
  const correctAnswerIndex = hasMcqOptions
    ? resolveOcrCorrectIndex(q, optionTexts)
    : null;

  const display_blocks = Array.isArray(q.display_blocks)
    ? q.display_blocks
        .filter((b) => b?.text && ["intro", "stimulus", "prompt"].includes(b.role))
        .map((b) => ({ role: b.role, text: String(b.text) }))
    : [];

  const verses = Array.isArray(q.verses)
    ? q.verses
        .map((v) => ({
          firstHemistich: String(v?.firstHemistich ?? "").trim(),
          secondHemistich: String(v?.secondHemistich ?? "").trim(),
        }))
        .filter((v) => v.firstHemistich || v.secondHemistich)
    : [];

  return {
    id: newDraftId(),
    question_text: composeOcrQuestionText(q),
    intro_text: q.intro_text != null ? String(q.intro_text) : null,
    stimulus_text: q.stimulus_text != null ? String(q.stimulus_text) : null,
    prompt_text: q.prompt_text != null ? String(q.prompt_text) : null,
    display_blocks,
    underlined_phrases: Array.isArray(q.underlined_phrases)
      ? q.underlined_phrases.map((p) => String(p)).filter(Boolean)
      : [],
    poetry: !!q.poetry || verses.length > 0,
    verses,
    score: q.score != null && !Number.isNaN(Number(q.score)) ? Number(q.score) : null,
    confidence:
      q.confidence != null && !Number.isNaN(Number(q.confidence))
        ? Number(q.confidence)
        : null,
    passage_id: q.passage_id ?? null,
    question_type: questionType,
    choices,
    choiceImages: draftChoiceImages,
    optionLabels: hasMcqOptions
      ? optionLabels
      : ["أ", "ب", "ج", "د"],
    answer:
      hasMcqOptions && correctAnswerIndex != null
        ? optionTexts[correctAnswerIndex] || resolveOcrAnswer(q)
        : hasMcqOptions
          ? resolveOcrAnswer(q)
          : "",
    correctAnswerIndex,
    answerInferred: !!q.correct_answer_inferred,
    image_url: questionImage?.image_url ?? null,
    imageDescription: questionImage?.short_description ?? "",
    questionImages,
    questionTable,
    source_number: q.source_number ?? q.number ?? null,
  };
};

export const mapOcrPassageToDraft = (passage) => ({
  id: newDraftId(),
  passage_id: passage.passage_id,
  title: passage.title ?? "",
  content: passage.content ?? "",
});

export const getDraftCorrectAnswerIndex = (draft) => {
  const choices = (draft.choices || []).map((c) => String(c ?? "").trim());
  const images = Array.isArray(draft.choiceImages) ? draft.choiceImages : [];
  if (
    Number.isInteger(draft.correctAnswerIndex) &&
    draft.correctAnswerIndex >= 0 &&
    draft.correctAnswerIndex < choices.length &&
    choiceHasContent(choices[draft.correctAnswerIndex], images[draft.correctAnswerIndex])
  ) {
    return draft.correctAnswerIndex;
  }
  if (draft.answer?.trim()) {
    const idx = choices.findIndex((c) => c === draft.answer.trim());
    return idx >= 0 ? idx : null;
  }
  return null;
};

export const getDraftCorrectAnswerLetter = (draft) => {
  const idx = getDraftCorrectAnswerIndex(draft);
  if (idx == null) return "A";
  return getChoiceLetter(idx, "latin");
};

export const isDraftMcq = (draft) => draft.question_type === "choice";

export const isDraftImageQuestion = (draft) =>
  draft.question_type === "text_with_image";

export const getDraftImageUrl = (draft) =>
  draft.image_url || draft.questionImages?.[0]?.image_url || null;

export const validateLectureExamDraftQuestion = (draft, index) => {
  const n = index + 1;
  const hasText = !!draft.question_text?.trim();
  const hasImage = !!getDraftImageUrl(draft);

  if (!hasText && !hasImage) {
    return `السؤال ${n}: يجب وجود نص السؤال أو صورة`;
  }

  if (isDraftImageQuestion(draft) && !isDraftMcq(draft)) {
    if (!hasImage) {
      return `السؤال ${n}: سؤال الصورة يحتاج صورة مستخرجة`;
    }
    return null;
  }

  if (draft.question_type === "text") {
    return `السؤال ${n}: امتحان المحاضرة يدعم أسئلة اختيار من متعدد (2–4 خيارات) أو أسئلة بالصورة`;
  }

  const choices = draft.choices.map((c) => c.trim());
  const choiceImages = Array.isArray(draft.choiceImages) ? draft.choiceImages : [];
  const filledCount = choices.filter((c, i) => choiceHasContent(c, choiceImages[i])).length;
  if (filledCount > EXAM_MCQ_CHOICE_MAX) {
    return `السؤال ${n}: امتحان المحاضرة يدعم حتى ${EXAM_MCQ_CHOICE_MAX} اختيارات (أ–د)`;
  }
  if (!isValidMcqChoiceCount(choices, choiceImages) || filledCount > EXAM_MCQ_CHOICE_MAX) {
    return `السؤال ${n}: أدخل من ${MCQ_CHOICE_MIN} إلى ${EXAM_MCQ_CHOICE_MAX} اختيارات كاملة (حالياً ${filledCount})`;
  }

  const correctAnswerIndex = getDraftCorrectAnswerIndex(draft);
  if (
    correctAnswerIndex != null &&
    (correctAnswerIndex < 0 || correctAnswerIndex >= choices.length)
  ) {
    return `السؤال ${n}: رقم الإجابة الصحيحة غير صحيح`;
  }

  return null;
};

const draftToLecturePayload = (draft) => ({
  questionText: draft.question_text.trim(),
  optionA: draft.choices[0]?.trim() || "",
  optionB: draft.choices[1]?.trim() || "",
  optionC: draft.choices[2]?.trim() || "",
  optionD: draft.choices[3]?.trim() || "",
  correctAnswer: getDraftCorrectAnswerLetter(draft),
  imageUrl: getDraftImageUrl(draft),
});

async function urlToImageFile(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("تعذر تحميل صورة السؤال من CDN");
  const blob = await response.blob();
  const ext = imageUrl.split(".").pop()?.split("?")[0] || "png";
  return new File([blob], `question-image.${ext}`, {
    type: blob.type || "image/png",
  });
}

async function attachQuestionImageFromUrl(examQuestionId, imageUrl, token) {
  if (!imageUrl || !examQuestionId) return false;
  try {
    const file = await urlToImageFile(imageUrl);
    const formData = new FormData();
    formData.append("image", file);
    await baseUrl.patch(`/api/questions/lecture-exam-question/${examQuestionId}`, formData, {
      headers: authHeaders(token),
    });
    return true;
  } catch {
    return false;
  }
}

async function importImageDraftToLectureExam(examId, draft, token) {
  const imageUrl = getDraftImageUrl(draft);
  if (!imageUrl) return 0;

  const file = await urlToImageFile(imageUrl);
  const questionText = draft.question_text?.trim() || "";

  if (questionText) {
    const formData = new FormData();
    formData.append("question_text", questionText);
    formData.append("image", file);
    await baseUrl.post(`/api/questions/lecture-exam/${examId}/question`, formData, {
      headers: authHeaders(token),
    });
    return 1;
  }

  const formData = new FormData();
  formData.append("images", file);
  formData.append("exam_id", String(examId));
  await baseUrl.post("/api/questions/lecture-exam-question/", formData, {
    headers: authHeaders(token),
  });
  return 1;
}

function buildBulkTextFromDrafts(drafts) {
  return drafts
    .map((draft) => {
      const questionText = draft.question_text?.trim();
      if (!questionText) return null;
      const choices = normalizeMcqChoices(draft.choices);
      const optionsBlock = choices
        .map((text, i) => `${String.fromCharCode(97 + i)}. ${text}`)
        .join("\n");
      return `${questionText}\n${optionsBlock}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

/**
 * @param {File|File[]} source — ملف واحد (PDF أو صورة) أو عدة صور
 * @param {{
 *   inferCorrectAnswer?: boolean,
 *   includeQuestionImages?: boolean,
 *   startPage?: number|string,
 *   endPage?: number|string,
 *   subject?: string,
 * }} options
 * @param {string} token
 */
export async function extractQuestions(
  source,
  {
    inferCorrectAnswer = false,
    includeQuestionImages = true,
    startPage,
    endPage,
    subject,
  } = {},
  token,
) {
  const files = Array.isArray(source) ? source : [source];
  const fileError = validateOcrFiles(files);
  if (fileError) throw new Error(fileError);

  const singlePdf = files.length === 1 && isPdfFile(files[0]);
  if (singlePdf) {
    const rangeError = validatePdfPageRange(startPage, endPage);
    if (rangeError) throw new Error(rangeError);
  } else if (
    (startPage != null && startPage !== "") ||
    (endPage != null && endPage !== "")
  ) {
    throw new Error("نطاق الصفحات متاح لملف PDF واحد فقط");
  }

  const formData = new FormData();
  if (files.length === 1) {
    formData.append("file", files[0]);
  } else {
    for (const file of files) {
      formData.append("files", file);
    }
  }

  if (inferCorrectAnswer) {
    formData.append("infer_correct_answer", "true");
  }
  formData.append(
    "include_question_images",
    includeQuestionImages ? "true" : "false",
  );

  if (typeof subject === "string" && subject.trim()) {
    formData.append("subject", subject.trim());
  }

  if (singlePdf) {
    if (startPage != null && startPage !== "") {
      formData.append("start_page", String(startPage));
    }
    if (endPage != null && endPage !== "") {
      formData.append("end_page", String(endPage));
    }
  }

  const { data } = await baseUrl.post(`${OCR_API}/extract-questions`, formData, {
    headers: authHeaders(token),
    // Large PDFs / image batches can take a long time — no client size cap.
    timeout: 0,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  if (!data?.success) {
    const err = new Error(data?.message || "فشل استخراج الأسئلة");
    err.response = { data };
    throw err;
  }

  return data.data;
}

/**
 * @param {File} file
 * @param {{ inferCorrectAnswer?: boolean, includeQuestionImages?: boolean, startPage?: number|string, endPage?: number|string }} options
 * @param {string} token
 */
export async function extractQuestionsFromFile(file, options = {}, token) {
  return extractQuestions(file, options, token);
}

/**
 * يبني FormData لرفع ملف واحد أو عدة ملفات بنفس عقدة extract/crop
 * @param {File[]} files
 * @param {{ startPage?: number|string, endPage?: number|string }} [pageRange]
 */
function buildOcrUploadFormData(files, pageRange = {}) {
  const formData = new FormData();
  if (files.length === 1) {
    formData.append("file", files[0]);
  } else {
    for (const file of files) {
      formData.append("files", file);
    }
  }

  const singlePdf = files.length === 1 && isPdfFile(files[0]);
  if (singlePdf) {
    const { startPage, endPage } = pageRange;
    if (startPage != null && startPage !== "") {
      formData.append("start_page", String(startPage));
    }
    if (endPage != null && endPage !== "") {
      formData.append("end_page", String(endPage));
    }
  }

  return formData;
}

/**
 * يقص كل سؤال كصورة واحدة (نص + اختيارات + رسوم + جداول)
 * POST /api/ocr/crop-questions — منفصل عن extract-questions
 * @param {File|File[]} source
 * @param {{ startPage?: number|string, endPage?: number|string }} options
 * @param {string} token
 */
export async function cropQuestions(source, { startPage, endPage } = {}, token) {
  const files = Array.isArray(source) ? source : [source];
  const fileError = validateOcrFiles(files);
  if (fileError) throw new Error(fileError);

  const singlePdf = files.length === 1 && isPdfFile(files[0]);
  if (singlePdf) {
    const rangeError = validatePdfPageRange(startPage, endPage);
    if (rangeError) throw new Error(rangeError);
  } else if (
    (startPage != null && startPage !== "") ||
    (endPage != null && endPage !== "")
  ) {
    throw new Error("نطاق الصفحات متاح لملف PDF واحد فقط");
  }

  const formData = buildOcrUploadFormData(files, { startPage, endPage });

  const { data } = await baseUrl.post(`${OCR_API}/crop-questions`, formData, {
    headers: authHeaders(token),
    timeout: 0,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  if (!data?.success) {
    const err = new Error(data?.message || "فشل قص الأسئلة");
    err.response = { data };
    throw err;
  }

  return data.data;
}

/** يطبيع عناصر رد crop-questions */
export function normalizeCroppedQuestions(data) {
  const list = Array.isArray(data?.questions) ? data.questions : [];
  return list
    .map((q, index) => {
      const imageUrl = q?.image_url || q?.imageUrl || null;
      if (!imageUrl) return null;
      const bbox = Array.isArray(q.bbox) ? q.bbox.map(Number) : null;
      return {
        number: Number.isFinite(Number(q.number)) ? Number(q.number) : index + 1,
        source_number:
          q.source_number != null
            ? String(q.source_number)
            : q.number != null
              ? String(q.number)
              : String(index + 1),
        page_index:
          q.page_index != null && Number.isFinite(Number(q.page_index))
            ? Number(q.page_index)
            : null,
        bbox,
        image_url: String(imageUrl),
      };
    })
    .filter(Boolean);
}

/** @param {object} data — data من POST /extract-questions */
export function mapExtractionResponseMeta(data) {
  const questionCount =
    data?.question_count ??
    (Array.isArray(data?.questions) ? data.questions.length : 0);
  const passageCount = Array.isArray(data?.passages) ? data.passages.length : 0;

  return {
    filename: data?.filename ?? null,
    mime_type: data?.mime_type ?? null,
    document_type: data?.document_type ?? null,
    page_count: data?.page_count ?? null,
    source_files: Array.isArray(data?.source_files) ? data.source_files : null,
    page_range: data?.page_range ?? null,
    question_count: questionCount,
    passage_count: passageCount,
    ocr_model: data?.ocr_model ?? null,
    chat_model: data?.chat_model ?? null,
    infer_correct_answer: data?.infer_correct_answer ?? null,
    subject: data?.subject ?? null,
    extraction_mode: data?.extraction_mode ?? null,
    content_type: data?.content_type ?? (passageCount > 0 ? "reading_passage" : "general"),
    extracted_images_count: Array.isArray(data?.extracted_images)
      ? data.extracted_images.length
      : 0,
    notes: data?.notes ?? null,
  };
}

/**
 * @param {number|string} examId
 * @param {object[]} draftPassages
 * @param {object[]} draftQuestions
 * @param {string} token
 */
export async function importDraftsToLectureExam(examId, draftPassages, draftQuestions, token) {
  const headers = { ...authHeaders(token), "Content-Type": "application/json" };
  const passageIds = new Set(draftPassages.map((p) => p.passage_id));

  const mcqDrafts = draftQuestions.filter((q) => isDraftMcq(q));
  const imageDrafts = draftQuestions.filter((q) => isDraftImageQuestion(q));

  const passageGroups = draftPassages
    .map((passage) => ({
      passage,
      questions: mcqDrafts.filter((q) => q.passage_id === passage.passage_id),
    }))
    .filter((group) => group.questions.length > 0);

  const standaloneMcq = mcqDrafts.filter(
    (q) => !q.passage_id || !passageIds.has(q.passage_id)
  );

  const standaloneImages = imageDrafts.filter(
    (q) => !q.passage_id || !passageIds.has(q.passage_id)
  );
  const passageImageDrafts = imageDrafts.filter(
    (q) => q.passage_id && passageIds.has(q.passage_id)
  );

  let totalAdded = 0;
  let imagesAttached = 0;
  const errors = [];
  const warnings = [];

  if (passageImageDrafts.length > 0) {
    warnings.push(
      `${passageImageDrafts.length} سؤال صورة داخل قطعة سيُستورد كسؤال مستقل (الامتحان لا يدعم صوراً داخل القطعة بعد)`
    );
  }

  if (standaloneMcq.length > 0) {
    const text = buildBulkTextFromDrafts(standaloneMcq);
    const correctAnswers = standaloneMcq.map((d) => getDraftCorrectAnswerLetter(d));
    const res = await baseUrl.post(
      `/api/exams/lecture/${examId}/questions/bulk`,
      { text, correctAnswers },
      { headers }
    );
    totalAdded += res.data?.count ?? 0;
    const created = Array.isArray(res.data?.questions) ? res.data.questions : [];
    for (let i = 0; i < standaloneMcq.length && i < created.length; i += 1) {
      const imageUrl = draftToLecturePayload(standaloneMcq[i]).imageUrl;
      if (imageUrl) {
        const ok = await attachQuestionImageFromUrl(created[i].id, imageUrl, token);
        if (ok) imagesAttached += 1;
      }
    }
  }

  for (const group of passageGroups) {
    try {
      const res = await baseUrl.post(
        `/api/exams/${examId}/questions/passage`,
        {
          title: group.passage.title?.trim() || "",
          content: group.passage.content.trim(),
          questions: group.questions.map((draft) => {
            const p = draftToLecturePayload(draft);
            return {
              questionText: p.questionText,
              optionA: p.optionA,
              optionB: p.optionB,
              optionC: p.optionC,
              optionD: p.optionD,
              correctAnswer: p.correctAnswer,
            };
          }),
        },
        { headers }
      );
      totalAdded += res.data?.added ?? 0;
      const examQuestionIds = Array.isArray(res.data?.examQuestionIds)
        ? res.data.examQuestionIds
        : [];
      for (let i = 0; i < group.questions.length && i < examQuestionIds.length; i += 1) {
        const imageUrl = draftToLecturePayload(group.questions[i]).imageUrl;
        if (imageUrl) {
          const ok = await attachQuestionImageFromUrl(examQuestionIds[i], imageUrl, token);
          if (ok) imagesAttached += 1;
        }
      }
    } catch (err) {
      errors.push(err.response?.data?.message || err.message || "فشل استيراد قطعة");
    }
  }

  for (const draft of [...standaloneImages, ...passageImageDrafts]) {
    try {
      totalAdded += await importImageDraftToLectureExam(examId, draft, token);
    } catch (err) {
      errors.push(err.response?.data?.message || err.message || "فشل استيراد سؤال بالصورة");
    }
  }

  return { totalAdded, imagesAttached, errors, warnings };
}

async function attachCourseExamQuestionImageFromUrl(questionId, imageUrl, token) {
  if (!imageUrl || !questionId) return false;

  // 1) رابط مباشر — يعمل مع الامتحانات العامة بدون إعادة رفع / CORS
  try {
    await baseUrl.put(
      `/api/questions/${questionId}`,
      { questionImage: imageUrl },
      {
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
      },
    );
    return true;
  } catch {
    // fall through
  }

  // 2) رفع ملف بعد تحميل الصورة من الـ CDN
  try {
    const file = await urlToImageFile(imageUrl);
    const formData = new FormData();
    formData.append("questionImage", file);
    try {
      await baseUrl.patch(`/api/course/course-exam/question/${questionId}/image`, formData, {
        headers: authHeaders(token),
      });
      return true;
    } catch (err) {
      if (err?.response?.status === 404 || err?.response?.status === 403) {
        await baseUrl.put(`/api/questions/${questionId}`, formData, {
          headers: authHeaders(token),
        });
        return true;
      }
      throw err;
    }
  } catch {
    return false;
  }
}

async function importMcqDraftWithImageToCourseExam(examId, draft, token) {
  const choices = normalizeMcqChoices(draft.choices);
  const imageUrl = getDraftImageUrl(draft);
  const correctAnswer = getDraftCorrectAnswerLetter(draft);

  // أفضّل إرسال رابط الصورة مباشرة مع إنشاء السؤال (بدون CORS download)
  if (imageUrl) {
    try {
      await baseUrl.post(
        `/api/exams/${examId}/questions`,
        {
          type: "TEXT",
          questionText: String(draft.question_text || "").trim(),
          optionA: choices[0] || "",
          optionB: choices[1] || "",
          optionC: choices[2] || "",
          optionD: choices[3] || "",
          correctAnswer,
          questionImage: imageUrl,
        },
        {
          headers: {
            ...authHeaders(token),
            "Content-Type": "application/json",
          },
        },
      );
      return { added: 1, imageAttached: true };
    } catch {
      // fall through to FormData upload
    }
  }

  const formData = new FormData();
  formData.append("type", "TEXT");
  formData.append("questionText", String(draft.question_text || "").trim());
  formData.append("optionA", choices[0] || "");
  formData.append("optionB", choices[1] || "");
  formData.append("optionC", choices[2] || "");
  formData.append("optionD", choices[3] || "");
  formData.append("correctAnswer", correctAnswer);

  let imageAttached = false;
  if (imageUrl) {
    try {
      const file = await urlToImageFile(imageUrl);
      formData.append("questionImage", file);
      imageAttached = true;
    } catch {
      imageAttached = false;
    }
  }

  await baseUrl.post(`/api/exams/${examId}/questions`, formData, {
    headers: authHeaders(token),
  });
  return { added: 1, imageAttached: imageAttached && Boolean(imageUrl) };
}

async function importImageDraftToCourseExam(examId, draft, token) {
  const imageUrl = getDraftImageUrl(draft);
  if (!imageUrl) return 0;

  // سؤال بصورة فقط (أو نص+صورة بدون اختيارات MCQ كاملة)
  const questionText = String(draft.question_text || "").trim();
  if (questionText) {
    try {
      await baseUrl.post(
        `/api/exams/${examId}/questions`,
        {
          type: "TEXT",
          questionText,
          optionA: "أ",
          optionB: "ب",
          optionC: "ج",
          optionD: "د",
          correctAnswer: "A",
          questionImage: imageUrl,
        },
        {
          headers: {
            ...authHeaders(token),
            "Content-Type": "application/json",
          },
        },
      );
      return 1;
    } catch {
      // fall through
    }
  }

  const file = await urlToImageFile(imageUrl);
  const formData = new FormData();
  formData.append("images", file);
  formData.append("images[]", file);
  const res = await baseUrl.post(`/api/exams/${examId}/questions/images`, formData, {
    headers: authHeaders(token),
  });
  return res.data?.count ?? 1;
}

/**
 * استيراد أسئلة مستخرجة بالـ AI إلى امتحان الكورس / العام
 * الأسئلة التي معها صور تُنشأ مع questionImage حتى تظهر في GET الأسئلة
 */
export async function importDraftsToCourseExam(examId, draftPassages, draftQuestions, token) {
  const headers = { ...authHeaders(token), "Content-Type": "application/json" };
  const mcqDrafts = draftQuestions.filter((q) => isDraftMcq(q));
  const imageDrafts = draftQuestions.filter((q) => isDraftImageQuestion(q) && !isDraftMcq(q));

  const mcqWithImages = mcqDrafts.filter((d) => getDraftImageUrl(d));
  const mcqWithoutImages = mcqDrafts.filter((d) => !getDraftImageUrl(d));

  let totalAdded = 0;
  let imagesAttached = 0;
  const errors = [];
  const warnings = [];

  if (draftPassages.length > 0) {
    warnings.push(
      "قطع القراءة غير مدعومة في امتحان الكورس — تُستورد أسئلة القطعة كأسئلة مستقلة"
    );
  }

  // أسئلة بدون صور: bulk سريع
  if (mcqWithoutImages.length > 0) {
    const text = buildBulkTextFromDrafts(mcqWithoutImages);
    const correctAnswers = mcqWithoutImages.map((d) => getDraftCorrectAnswerLetter(d));
    try {
      const res = await baseUrl.post(
        `/api/exams/${examId}/questions/bulk`,
        { text, correctAnswers },
        { headers },
      );
      totalAdded += res.data?.count ?? (Array.isArray(res.data?.questions) ? res.data.questions.length : 0);
    } catch (err) {
      errors.push(err.response?.data?.message || err.message || "فشل استيراد الأسئلة النصية");
    }
  }

  // أسئلة مع صور: إنشاء فردي مع questionImage
  for (const draft of mcqWithImages) {
    try {
      const result = await importMcqDraftWithImageToCourseExam(examId, draft, token);
      totalAdded += result.added;
      if (result.imageAttached) imagesAttached += 1;
      else {
        warnings.push(
          `تمت إضافة سؤال بدون صورة: ${(draft.question_text || "").slice(0, 40)}…`,
        );
      }
    } catch (err) {
      // محاولة أخيرة: bulk بدون صورة ثم إرفاق
      try {
        const text = buildBulkTextFromDrafts([draft]);
        const res = await baseUrl.post(
          `/api/exams/${examId}/questions/bulk`,
          { text, correctAnswers: [getDraftCorrectAnswerLetter(draft)] },
          { headers },
        );
        const created = Array.isArray(res.data?.questions) ? res.data.questions : [];
        totalAdded += res.data?.count ?? created.length ?? 0;
        const questionId = created[0]?.id;
        const imageUrl = getDraftImageUrl(draft);
        if (questionId && imageUrl) {
          const ok = await attachCourseExamQuestionImageFromUrl(questionId, imageUrl, token);
          if (ok) imagesAttached += 1;
          else warnings.push("تعذر إرفاق صورة أحد الأسئلة بعد الإنشاء");
        }
      } catch (innerErr) {
        errors.push(
          err.response?.data?.message ||
            innerErr.response?.data?.message ||
            err.message ||
            "فشل استيراد سؤال مع صورة",
        );
      }
    }
  }

  for (const draft of imageDrafts) {
    try {
      totalAdded += await importImageDraftToCourseExam(examId, draft, token);
      if (getDraftImageUrl(draft)) imagesAttached += 1;
    } catch (err) {
      errors.push(err.response?.data?.message || err.message || "فشل استيراد سؤال بالصورة");
    }
  }

  return { totalAdded, imagesAttached, errors, warnings };
}

export const validateCourseExamDraftQuestion = validateLectureExamDraftQuestion;

const TEACHER_LIBRARY_API = "/api/teacher/questions";

function draftToTeacherQuestionPayload(draft) {
  const rawChoices = Array.isArray(draft.choices) ? draft.choices : [];
  const choiceImages = Array.isArray(draft.choiceImages) ? draft.choiceImages : [];
  const choices = rawChoices
    .map((c) => String(c ?? "").trim())
    .slice(0, MCQ_CHOICE_MAX);
  const isMcq =
    draft.question_type === "choice" && isValidMcqChoiceCount(choices, choiceImages);
  const imageUrl = getDraftImageUrl(draft);
  const correctAnswerIndex = getDraftCorrectAnswerIndex({
    ...draft,
    choices,
    choiceImages,
  });

  if (isMcq) {
    return {
      question_text: draft.question_text.trim(),
      question_type: "choice",
      choices,
      answer:
        correctAnswerIndex != null
          ? choices[correctAnswerIndex] || draft.answer?.trim() || null
          : draft.answer?.trim() || null,
      correct_answer_index: correctAnswerIndex,
      image_url: imageUrl,
      explanation: null,
      difficulty_level: "medium",
      points: draft.score != null ? Number(draft.score) || 1 : 1,
    };
  }

  return {
    question_text: draft.question_text?.trim() || (imageUrl ? "سؤال بالصورة" : ""),
    question_type: "text",
    choices: null,
    answer: draft.answer?.trim() || null,
    correct_answer_index: null,
    image_url: imageUrl,
    explanation: null,
    difficulty_level: "medium",
    points: draft.score != null ? Number(draft.score) || 1 : 1,
  };
}

export const validateTeacherLibraryDraftQuestion = (draft, index) => {
  const n = index + 1;
  const hasText = !!draft.question_text?.trim();
  const hasImage = !!getDraftImageUrl(draft);

  if (!hasText && !hasImage) {
    return `السؤال ${n}: يجب وجود نص السؤال أو صورة`;
  }

  if (isDraftImageQuestion(draft) && !isDraftMcq(draft)) {
    return null;
  }

  if (draft.question_type === "text") {
    return null;
  }

  const choices = Array.isArray(draft.choices) ? draft.choices : [];
  const choiceImages = Array.isArray(draft.choiceImages) ? draft.choiceImages : [];
  if (draft.question_type === "choice" && !isValidMcqChoiceCount(choices, choiceImages)) {
    const filled = choices.filter((c, i) => choiceHasContent(c, choiceImages[i])).length;
    return `السؤال ${n}: أدخل من ${MCQ_CHOICE_MIN} إلى ${MCQ_CHOICE_MAX} اختيارات كاملة (حالياً ${filled})`;
  }

  return null;
};

/**
 * @param {number|string} lessonId
 * @param {object[]} draftPassages
 * @param {object[]} draftQuestions
 * @param {string} token
 */
export async function importDraftsToTeacherLibrary(
  lessonId,
  draftPassages,
  draftQuestions,
  token,
) {
  const headers = { ...authHeaders(token), "Content-Type": "application/json" };
  const passageIds = new Set(draftPassages.map((p) => p.passage_id));

  const passageGroups = draftPassages
    .map((passage) => ({
      passage,
      questions: draftQuestions.filter((q) => q.passage_id === passage.passage_id),
    }))
    .filter((group) => group.questions.length > 0);

  const standaloneQuestions = draftQuestions.filter(
    (q) => !q.passage_id || !passageIds.has(q.passage_id),
  );

  let totalAdded = 0;
  const errors = [];

  for (const group of passageGroups) {
    if (!group.passage.content?.trim()) {
      errors.push("نص القطعة مطلوب قبل الحفظ");
      continue;
    }
    try {
      const res = await baseUrl.post(
        `${TEACHER_LIBRARY_API}/passage`,
        {
          lesson_id: Number(lessonId),
          title: group.passage.title?.trim() || null,
          content: group.passage.content.trim(),
          questions: group.questions.map((draft) => draftToTeacherQuestionPayload(draft)),
        },
        { headers },
      );
      totalAdded += res.data?.questions?.length ?? group.questions.length;
    } catch (err) {
      errors.push(err.response?.data?.message || err.message || "فشل حفظ قطعة");
    }
  }

  for (const draft of standaloneQuestions) {
    try {
      await baseUrl.post(
        `${TEACHER_LIBRARY_API}/question`,
        {
          lesson_id: Number(lessonId),
          passage_id: null,
          ...draftToTeacherQuestionPayload(draft),
        },
        { headers },
      );
      totalAdded += 1;
    } catch (err) {
      errors.push(err.response?.data?.message || err.message || "فشل حفظ سؤال");
    }
  }

  return { totalAdded, errors };
}

const QUESTION_BANK_OPTION_LABELS = CHOICE_LETTERS_AR;

function normalizeQuestionNumber(value, fallback) {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed > 0) return parsed;
  return fallback;
}

function draftQuestionImagesToExtraction(draft) {
  const questionImages = (draft.questionImages || [])
    .filter((img) => img?.image_url)
    .map((img, index) => ({
      image_id: img.image_id || `draft-${draft.id}-img-${index}`,
      page_index: img.page_index ?? null,
      image_type: img.image_type || "question_figure",
      short_description: img.short_description || "",
      image_url: img.image_url,
    }));

  const imageUrl = getDraftImageUrl(draft);
  if (imageUrl && !questionImages.some((img) => img.image_url === imageUrl)) {
    questionImages.unshift({
      image_id: `draft-${draft.id}-primary`,
      page_index: null,
      image_type: "question_figure",
      short_description: draft.imageDescription || "",
      image_url: imageUrl,
    });
  }

  return questionImages;
}

function draftToExtractionQuestion(draft, index) {
  const rawChoices = Array.isArray(draft.choices) ? draft.choices : [];
  const choiceImages = Array.isArray(draft.choiceImages) ? draft.choiceImages : [];
  const choices = rawChoices.map((c) => String(c ?? "").trim()).slice(0, MCQ_CHOICE_MAX);
  const isMcq =
    draft.question_type === "choice" && isValidMcqChoiceCount(choices, choiceImages);

  const correctAnswerIndex = getDraftCorrectAnswerIndex({
    ...draft,
    choices,
    choiceImages,
  });
  const questionImages = draftQuestionImagesToExtraction(draft);
  const labels = Array.isArray(draft.optionLabels) ? draft.optionLabels : QUESTION_BANK_OPTION_LABELS;

  const display_blocks = Array.isArray(draft.display_blocks)
    ? draft.display_blocks
        .filter((b) => b?.text && ["intro", "stimulus", "prompt"].includes(b.role))
        .map((b) => ({ role: b.role, text: String(b.text) }))
    : [];

  const verses = Array.isArray(draft.verses)
    ? draft.verses
        .map((v) => ({
          firstHemistich: String(v?.firstHemistich ?? "").trim(),
          secondHemistich: String(v?.secondHemistich ?? "").trim(),
        }))
        .filter((v) => v.firstHemistich || v.secondHemistich)
    : [];

  const options = isMcq
    ? choices.map((text, i) => {
        const img = choiceImages[i];
        const imageUrl =
          (typeof img === "string" ? img : img?.image_url || img?.url) || null;
        const imageId =
          (typeof img === "object" && img?.image_id) ||
          (imageUrl ? `draft-${draft.id}-opt-${i}` : null);
        const option = {
          label: labels[i] || QUESTION_BANK_OPTION_LABELS[i] || String(i + 1),
          text,
        };
        if (imageUrl) {
          option.image_id = imageId;
          option.image_url = imageUrl;
        }
        return option;
      })
    : [];

  // أعد صور الاختيارات إلى question_images مع أشكال السؤال
  const choiceImageEntries = isMcq
    ? choices
        .map((_, i) => {
          const img = choiceImages[i];
          const imageUrl =
            (typeof img === "string" ? img : img?.image_url || img?.url) || null;
          if (!imageUrl) return null;
          return {
            image_id:
              (typeof img === "object" && img?.image_id) ||
              `draft-${draft.id}-opt-${i}`,
            page_index: null,
            image_type: "choice_option",
            short_description: "",
            image_url: imageUrl,
          };
        })
        .filter(Boolean)
    : [];

  const allImages = [...questionImages];
  for (const entry of choiceImageEntries) {
    if (!allImages.some((img) => img.image_url === entry.image_url)) {
      allImages.push(entry);
    }
  }

  return {
    number: normalizeQuestionNumber(
      String(draft.source_number ?? "").split("-")[0],
      index + 1,
    ),
    source_number:
      draft.source_number != null ? String(draft.source_number) : String(index + 1),
    passage_id: draft.passage_id ?? null,
    question_text:
      draft.question_text?.trim() ||
      (allImages.length > 0 ? "سؤال بالصورة" : ""),
    intro_text: draft.intro_text ?? null,
    stimulus_text: draft.stimulus_text ?? null,
    prompt_text: draft.prompt_text ?? null,
    display_blocks,
    underlined_phrases: Array.isArray(draft.underlined_phrases)
      ? draft.underlined_phrases
      : [],
    poetry: !!draft.poetry || verses.length > 0,
    verses,
    score: draft.score ?? null,
    options,
    question_images: allImages,
    question_table: draft.questionTable?.content
      ? {
          role: draft.questionTable.role || "data",
          format: draft.questionTable.format || "markdown",
          content: String(draft.questionTable.content),
        }
      : null,
    correct_answer:
      correctAnswerIndex != null
        ? labels[correctAnswerIndex] ||
          QUESTION_BANK_OPTION_LABELS[correctAnswerIndex] ||
          null
        : null,
    correct_answer_index: correctAnswerIndex,
    correct_answer_inferred: !!draft.answerInferred,
    confidence: draft.confidence ?? undefined,
  };
}

/**
 * يبني body POST import وفق الشكل الموصى به في الـ doc:
 * { lesson_id, success: true, data: { passages, questions, ... } }
 * @param {number|string} lessonId
 * @param {object[]} draftPassages
 * @param {object[]} draftQuestions
 * @param {object} [meta]
 */
export function buildExtractionImportPayload(
  lessonId,
  draftPassages,
  draftQuestions,
  meta = {},
) {
  const passages = draftPassages
    .filter((passage) => passage.content?.trim())
    .map((passage) => ({
      passage_id: passage.passage_id,
      title: passage.title?.trim() || null,
      content: passage.content.trim(),
    }));

  const questions = draftQuestions.map((draft, index) =>
    draftToExtractionQuestion(draft, index),
  );

  const content_type =
    meta.content_type ||
    (passages.length > 0 ? "reading_passage" : "general");

  return {
    lesson_id: Number(lessonId),
    success: true,
    data: {
      filename: meta.filename ?? undefined,
      mime_type: meta.mime_type ?? undefined,
      document_type: meta.document_type ?? undefined,
      page_count: meta.page_count ?? undefined,
      subject: meta.subject ?? undefined,
      extraction_mode: meta.extraction_mode ?? undefined,
      content_type,
      passages,
      questions,
      question_count: questions.length,
      notes: meta.notes ?? undefined,
    },
  };
}

function parseQuestionBankImportResponse(data) {
  const result = data?.data ?? {};
  const questions = Array.isArray(result.questions) ? result.questions : [];
  const skipped = Array.isArray(result.skipped) ? result.skipped : [];

  return {
    totalAdded: questions.length,
    passagesAdded: Array.isArray(result.passages) ? result.passages.length : 0,
    message: data?.message,
    skipped,
    errors: skipped
      .map((item) => item?.reason || item?.message)
      .filter(Boolean),
  };
}

/**
 * استيراد ناتج extract-questions إلى درس بنك الأسئلة V2.
 * يستخدم الشكل الموصى به + مسار الدرس من الـ doc.
 * @param {number|string} lessonId
 * @param {object} payload — { lesson_id, success, data } أو { lesson_id, extraction } أو مسودات
 * @param {string} token
 */
export async function importExtractionToQuestionBankLesson(lessonId, payload, token) {
  let body;
  if (payload?.lesson_id != null && (payload?.data || payload?.extraction)) {
    body = payload;
  } else {
    body = buildExtractionImportPayload(
      lessonId,
      payload?.passages ?? [],
      payload?.questions ?? [],
      payload?.meta ?? {},
    );
  }

  const headers = {
    ...authHeaders(token),
    "Content-Type": "application/json",
  };

  let data;
  try {
    const res = await baseUrl.post(
      `/api/question-bank-v2/lesson/${lessonId}/import-extraction`,
      body,
      { headers },
    );
    data = res.data;
  } catch (err) {
    // توافق خلفي مع المسار العام إن لم يتوفر مسار الدرس
    if (err?.response?.status === 404) {
      const res = await baseUrl.post(`${OCR_API}/import-question-bank-v2`, body, {
        headers,
      });
      data = res.data;
    } else {
      throw err;
    }
  }

  if (!data?.success) {
    const err = new Error(data?.message || "فشل استيراد الأسئلة");
    err.response = { data };
    throw err;
  }

  return parseQuestionBankImportResponse(data);
}

/**
 * @param {number|string} lessonId
 * @param {object[]} draftPassages
 * @param {object[]} draftQuestions
 * @param {string} token
 * @param {object} [meta] — من mapExtractionResponseMeta
 */
export async function importDraftsToQuestionBankV2(
  lessonId,
  draftPassages,
  draftQuestions,
  token,
  meta = {},
) {
  const payload = buildExtractionImportPayload(
    lessonId,
    draftPassages,
    draftQuestions,
    meta,
  );
  return importExtractionToQuestionBankLesson(lessonId, payload, token);
}
