import baseUrl from "./baseUrl";

const API = "/api/essay-questions";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function essayQuestionsApiError(err, fallback = "حدث خطأ غير متوقع") {
  return err?.response?.data?.message || err?.response?.data?.msg || err?.message || fallback;
}

/** POST /api/essay-questions/ocr */
export async function ocrEssayImages(files, token) {
  const list = Array.isArray(files) ? files.filter(Boolean) : files ? [files] : [];
  if (!list.length) throw new Error("أرفق صورة واحدة على الأقل");
  const form = new FormData();
  if (list.length === 1) form.append("image", list[0]);
  else list.slice(0, 5).forEach((file) => form.append("images", file));
  const { data } = await baseUrl.post(`${API}/ocr`, form, {
    headers: authHeaders(token),
  });
  return {
    images: Array.isArray(data?.images) ? data.images : [],
  };
}

/** POST /api/essay-questions */
export async function createEssayQuestion(
  {
    examId,
    scope = "course",
    questionText,
    questionImage,
    modelAnswer,
    modelAnswerImage,
    points,
    grade,
    rubric,
  } = {},
  token,
) {
  const body = {
    examId: Number(examId),
    scope: scope === "lecture" ? "lecture" : "course",
    questionText: questionText != null ? String(questionText) : "",
    questionImage: questionImage || null,
    modelAnswer: modelAnswer != null ? String(modelAnswer) : "",
    modelAnswerImage: modelAnswerImage || null,
    points: Number(points ?? grade),
  };
  if (rubric != null && String(rubric).trim()) body.rubric = String(rubric).trim();
  const { data } = await baseUrl.post(API, body, {
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
  });
  return {
    success: Boolean(data?.success ?? true),
    message: data?.message || "تم حفظ السؤال المقالي",
    scope: data?.scope || body.scope,
    question: data?.question || null,
  };
}

/** GET /api/essay-questions/reviews */
export async function fetchEssayReviews({ status = "needs_review", examId, scope } = {}, token) {
  const params = {};
  if (status) params.status = status;
  if (examId) params.examId = examId;
  if (scope && scope !== "all") params.scope = scope;
  const { data } = await baseUrl.get(`${API}/reviews`, {
    headers: authHeaders(token),
    params,
  });
  return Array.isArray(data?.items) ? data.items : [];
}

/** POST /api/essay-questions/reviews/decision */
export async function decideEssayReview(
  { source, answerId, score, note, teacherNote } = {},
  token,
) {
  const body = {
    source,
    answerId: Number(answerId),
    score: Number(score),
  };
  const teacherMsg = note ?? teacherNote;
  if (teacherMsg != null && String(teacherMsg).trim()) body.note = String(teacherMsg).trim();
  const { data } = await baseUrl.post(`${API}/reviews/decision`, body, {
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
  });
  return data;
}
