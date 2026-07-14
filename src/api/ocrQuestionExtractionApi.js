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

export const emptyDraftQuestion = () => ({
  id: newDraftId(),
  question_text: "",
  question_type: "choice",
  choices: ["", "", "", ""],
  answer: "",
  correctAnswerIndex: null,
  answerInferred: false,
  image_url: null,
  imageDescription: "",
  questionImages: [],
  passage_id: null,
});

export const resolveOcrAnswer = (q) => {
  const options = Array.isArray(q.options) ? q.options : [];
  if (q.correct_answer_index != null && options[q.correct_answer_index]) {
    return options[q.correct_answer_index].text ?? "";
  }
  if (q.correct_answer != null && q.correct_answer !== "") {
    const label = String(q.correct_answer).trim();
    const byLabel = options.find((o) => String(o.label ?? "").trim() === label);
    if (byLabel?.text) return byLabel.text;
    const byText = options.find((o) => String(o.text ?? "").trim() === label);
    if (byText?.text) return byText.text;
  }
  return "";
};

/**
 * يطابق schema الـ API: options إما فارغة أو بالضبط 4
 * @param {object} q
 */
export const mapOcrQuestionToDraft = (q) => {
  const rawOptions = Array.isArray(q.options) ? q.options : [];
  const optionTexts = rawOptions.map((o) => (o.text ?? "").trim());
  const hasFourOptions = optionTexts.length === 4;
  const hasAnyOptionText = optionTexts.some(Boolean);

  const questionImages = Array.isArray(q.question_images)
    ? q.question_images.filter((image) => image?.image_url)
    : [];
  const questionImage = questionImages[0] || null;
  const hasImages = questionImages.length > 0 || !!questionImage?.image_url;

  let questionType = "choice";
  if (hasFourOptions && hasAnyOptionText) {
    questionType = "choice";
  } else if (hasImages) {
    questionType = "text_with_image";
  } else {
    questionType = "text";
  }

  const choices =
    hasFourOptions && hasAnyOptionText
      ? optionTexts
      : ["", "", "", ""];

  return {
    id: newDraftId(),
    question_text: (q.question_text ?? "").trim(),
    passage_id: q.passage_id ?? null,
    question_type: questionType,
    choices,
    answer: hasFourOptions && hasAnyOptionText ? resolveOcrAnswer(q) : "",
    correctAnswerIndex: Number.isInteger(q.correct_answer_index)
      ? q.correct_answer_index
      : null,
    answerInferred: !!q.correct_answer_inferred,
    image_url: questionImage?.image_url ?? null,
    imageDescription: questionImage?.short_description ?? "",
    questionImages,
    source_number: q.source_number ?? null,
  };
};

export const mapOcrPassageToDraft = (passage) => ({
  id: newDraftId(),
  passage_id: passage.passage_id,
  title: passage.title ?? "",
  content: passage.content ?? "",
});

export const getDraftCorrectAnswerIndex = (draft) => {
  const choices = draft.choices.map((c) => c.trim()).filter(Boolean);
  if (
    Number.isInteger(draft.correctAnswerIndex) &&
    draft.correctAnswerIndex >= 0 &&
    draft.correctAnswerIndex < choices.length
  ) {
    return draft.correctAnswerIndex;
  }
  if (draft.answer?.trim()) {
    const idx = choices.indexOf(draft.answer.trim());
    return idx >= 0 ? idx : null;
  }
  return null;
};

export const getDraftCorrectAnswerLetter = (draft) => {
  const idx = getDraftCorrectAnswerIndex(draft);
  if (idx == null) return "A";
  return ["A", "B", "C", "D"][idx] || "A";
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
    return `السؤال ${n}: امتحان المحاضرة يدعم أسئلة اختيار من متعدد (4 خيارات) أو أسئلة بالصورة`;
  }

  const choices = draft.choices.map((c) => c.trim());
  if (choices.length !== 4 || choices.some((c) => !c)) {
    return `السؤال ${n}: يجب إدخال 4 اختيارات كاملة`;
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
  if (!response.ok) throw new Error("تعذر تحميل صورة السؤال من Cloudinary");
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
      const p = draftToLecturePayload(draft);
      if (!p.questionText) return null;
      return `${p.questionText}\na. ${p.optionA}\nb. ${p.optionB}\nc. ${p.optionC}\nd. ${p.optionD}`;
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
 * }} options
 * @param {string} token
 */
export async function extractQuestions(
  source,
  { inferCorrectAnswer = false, includeQuestionImages = true, startPage, endPage } = {},
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

/** @param {object} data — data من POST /extract-questions */
export function mapExtractionResponseMeta(data) {
  const questionCount =
    data?.question_count ??
    (Array.isArray(data?.questions) ? data.questions.length : 0);

  return {
    filename: data?.filename ?? null,
    source_files: Array.isArray(data?.source_files) ? data.source_files : null,
    page_range: data?.page_range ?? null,
    question_count: questionCount,
    ocr_model: data?.ocr_model ?? null,
    chat_model: data?.chat_model ?? null,
    infer_correct_answer: data?.infer_correct_answer ?? null,
    extracted_images_count: Array.isArray(data?.extracted_images)
      ? data.extracted_images.length
      : 0,
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
  try {
    const file = await urlToImageFile(imageUrl);
    const formData = new FormData();
    formData.append("questionImage", file);
    await baseUrl.patch(`/api/course/course-exam/question/${questionId}/image`, formData, {
      headers: authHeaders(token),
    });
    return true;
  } catch {
    return false;
  }
}

async function importImageDraftToCourseExam(examId, draft, token) {
  const imageUrl = getDraftImageUrl(draft);
  if (!imageUrl) return 0;

  const file = await urlToImageFile(imageUrl);
  const formData = new FormData();
  formData.append("images", file);
  const res = await baseUrl.post(`/api/exams/${examId}/questions/images`, formData, {
    headers: authHeaders(token),
  });
  return res.data?.count ?? 1;
}

/**
 * استيراد أسئلة مستخرجة بالـ AI إلى امتحان الكورس الشامل
 * @param {number|string} examId
 * @param {object[]} draftPassages
 * @param {object[]} draftQuestions
 * @param {string} token
 */
export async function importDraftsToCourseExam(examId, draftPassages, draftQuestions, token) {
  const headers = { ...authHeaders(token), "Content-Type": "application/json" };
  const mcqDrafts = draftQuestions.filter((q) => isDraftMcq(q));
  const imageDrafts = draftQuestions.filter((q) => isDraftImageQuestion(q) && !isDraftMcq(q));

  let totalAdded = 0;
  let imagesAttached = 0;
  const errors = [];
  const warnings = [];

  if (draftPassages.length > 0) {
    warnings.push(
      "قطع القراءة غير مدعومة في امتحان الكورس — تُستورد أسئلة القطعة كأسئلة مستقلة"
    );
  }

  if (mcqDrafts.length > 0) {
    const text = buildBulkTextFromDrafts(mcqDrafts);
    const correctAnswers = mcqDrafts.map((d) => getDraftCorrectAnswerLetter(d));
    try {
      const res = await baseUrl.post(
        `/api/exams/${examId}/questions/bulk`,
        { text, correctAnswers },
        { headers }
      );
      const created = Array.isArray(res.data?.questions) ? res.data.questions : [];
      totalAdded += res.data?.count ?? created.length ?? 0;
      for (let i = 0; i < mcqDrafts.length && i < created.length; i += 1) {
        const imageUrl = getDraftImageUrl(mcqDrafts[i]);
        if (imageUrl) {
          const questionId = created[i]?.id;
          const ok = await attachCourseExamQuestionImageFromUrl(questionId, imageUrl, token);
          if (ok) imagesAttached += 1;
        }
      }
    } catch (err) {
      errors.push(err.response?.data?.message || err.message || "فشل استيراد الأسئلة النصية");
    }
  }

  for (const draft of imageDrafts) {
    try {
      totalAdded += await importImageDraftToCourseExam(examId, draft, token);
    } catch (err) {
      errors.push(err.response?.data?.message || err.message || "فشل استيراد سؤال بالصورة");
    }
  }

  return { totalAdded, imagesAttached, errors, warnings };
}

export const validateCourseExamDraftQuestion = validateLectureExamDraftQuestion;

const TEACHER_LIBRARY_API = "/api/teacher/questions";

function draftToTeacherQuestionPayload(draft) {
  const choices = (draft.choices || []).map((c) => c.trim());
  const filledChoices = choices.filter(Boolean);
  const isMcq =
    draft.question_type === "choice" &&
    choices.length === 4 &&
    choices.every(Boolean);
  const imageUrl = getDraftImageUrl(draft);
  const correctAnswerIndex = getDraftCorrectAnswerIndex(draft);

  if (isMcq) {
    return {
      question_text: draft.question_text.trim(),
      question_type: "choice",
      choices,
      answer: correctAnswerIndex != null ? choices[correctAnswerIndex] : draft.answer || null,
      correct_answer_index: correctAnswerIndex,
      image_url: imageUrl,
      explanation: null,
      difficulty_level: "medium",
      points: 1,
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
    points: 1,
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

  const choices = (draft.choices || []).map((c) => c.trim());
  if (choices.length !== 4 || choices.some((c) => !c)) {
    return `السؤال ${n}: يجب إدخال 4 اختيارات كاملة`;
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

const QUESTION_BANK_OPTION_LABELS = ["أ", "ب", "ج", "د"];

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
      short_description: img.short_description || "",
      image_url: img.image_url,
    }));

  const imageUrl = getDraftImageUrl(draft);
  if (imageUrl && !questionImages.some((img) => img.image_url === imageUrl)) {
    questionImages.unshift({
      image_id: `draft-${draft.id}-primary`,
      page_index: null,
      short_description: draft.imageDescription || "",
      image_url: imageUrl,
    });
  }

  return questionImages;
}

function draftToExtractionQuestion(draft, index) {
  const choices = (draft.choices || []).map((c) => c.trim());
  const isMcq =
    draft.question_type === "choice" &&
    choices.length === 4 &&
    choices.every(Boolean);

  const correctAnswerIndex = getDraftCorrectAnswerIndex(draft);
  const questionImages = draftQuestionImagesToExtraction(draft);

  return {
    number: normalizeQuestionNumber(draft.source_number, index + 1),
    source_number:
      draft.source_number != null ? String(draft.source_number) : String(index + 1),
    passage_id: draft.passage_id ?? null,
    question_text:
      draft.question_text?.trim() ||
      (questionImages.length > 0 ? "سؤال بالصورة" : ""),
    options: isMcq
      ? choices.map((text, i) => ({
          label: QUESTION_BANK_OPTION_LABELS[i],
          text,
        }))
      : [],
    question_images: questionImages,
    correct_answer:
      correctAnswerIndex != null
        ? QUESTION_BANK_OPTION_LABELS[correctAnswerIndex] ?? null
        : null,
    correct_answer_index: correctAnswerIndex,
    correct_answer_inferred: !!draft.answerInferred,
  };
}

/**
 * يبني body POST /api/ocr/import-question-bank-v2
 * @param {number|string} lessonId
 * @param {object[]} draftPassages
 * @param {object[]} draftQuestions
 */
export function buildExtractionImportPayload(lessonId, draftPassages, draftQuestions) {
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

  return {
    lesson_id: Number(lessonId),
    extraction: {
      passages,
      questions,
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
 * @param {number|string} lessonId
 * @param {object} payload — { lesson_id, extraction } أو يُبنى من المسودات
 * @param {string} token
 */
export async function importExtractionToQuestionBankLesson(lessonId, payload, token) {
  const body =
    payload?.lesson_id != null && payload?.extraction
      ? payload
      : buildExtractionImportPayload(
          lessonId,
          payload?.passages ?? [],
          payload?.questions ?? [],
        );

  const { data } = await baseUrl.post(`${OCR_API}/import-question-bank-v2`, body, {
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
  });

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
 */
export async function importDraftsToQuestionBankV2(
  lessonId,
  draftPassages,
  draftQuestions,
  token,
) {
  const payload = buildExtractionImportPayload(lessonId, draftPassages, draftQuestions);
  return importExtractionToQuestionBankLesson(lessonId, payload, token);
}
