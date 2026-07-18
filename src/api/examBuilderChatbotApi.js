import baseUrl from "./baseUrl";

const API = "/api/teacher/exam-builder";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

function authHeaders(contentType) {
  const headers = { Authorization: `Bearer ${getToken()}` };
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}

function formatValidationErrors(errors) {
  if (!Array.isArray(errors) || errors.length === 0) return "";
  return errors
    .map((item) => {
      const path = Array.isArray(item.path) ? item.path.join(".") : "";
      const msg = item.message || item.msg || "";
      return path ? `${path}: ${msg}` : msg;
    })
    .filter(Boolean)
    .join(" — ");
}

function rejectApiResponse(data, fallback) {
  const err = new Error(data?.message || fallback);
  err.response = { data };
  throw err;
}

export function apiErrorMessage(err, fallback = "حدث خطأ غير متوقع") {
  const data = err?.response?.data;
  const status = err?.response?.status;

  const base =
    data?.message ||
    data?.error ||
    err?.message ||
    fallback;

  const validation = formatValidationErrors(data?.errors);
  const extra =
    typeof data?.details === "string"
      ? data.details
      : data?.details?.message || data?.details?.reason || data?.reason;

  const parts = [];
  if (base) parts.push(base);
  if (validation && validation !== base) parts.push(validation);
  if (extra && extra !== base && extra !== validation) parts.push(extra);
  if (status && status >= 400 && parts.length === 1 && parts[0] === fallback) {
    parts.push(`رمز الخطأ: ${status}`);
  }

  return parts.filter(Boolean).join("\n") || fallback;
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchExamBuilderInfo() {
  const { data } = await baseUrl.get(`${API}/info`, { headers: authHeaders() });
  if (data?.success === false) throw rejectApiResponse(data, "فشل تحميل معلومات البوت");
  return data?.bot ?? data;
}

export async function fetchExamBuilderCatalog() {
  const { data } = await baseUrl.get(`${API}/catalog`, { headers: authHeaders() });
  if (data?.success === false) throw rejectApiResponse(data, "فشل تحميل الفهرس");
  return data?.catalog ?? [];
}

export async function fetchExamBuilderMessages(params = {}) {
  const { data } = await baseUrl.get(`${API}/messages${buildQuery(params)}`, {
    headers: authHeaders(),
  });
  if (data?.success === false) throw rejectApiResponse(data, "فشل تحميل المحادثة");
  return {
    messages: data?.messages ?? [],
    pagination: data?.pagination ?? { limit: 30, offset: 0, total: 0, has_more: false },
  };
}

export async function fetchExamBuilderHistory(params = {}) {
  const { data } = await baseUrl.get(`${API}/history${buildQuery(params)}`, {
    headers: authHeaders(),
  });
  if (data?.success === false) throw rejectApiResponse(data, "فشل تحميل السجل");
  return {
    history: data?.history ?? [],
    pagination: data?.pagination ?? { limit: 20, offset: 0, total: 0, has_more: false },
  };
}

export async function fetchExamBuilderSessionsList(params = {}) {
  const { data } = await baseUrl.get(`${API}/sessions${buildQuery(params)}`, {
    headers: authHeaders(),
  });
  if (data?.success === false) throw rejectApiResponse(data, "فشل تحميل الجلسات");
  return {
    sessions: data?.sessions ?? [],
    pagination: data?.pagination ?? { limit: 20, offset: 0, total: 0, has_more: false },
  };
}

export async function sendExamBuilderChat(message, sessionId) {
  const body = { message: String(message).trim() };
  if (sessionId) body.session_id = sessionId;

  const { data } = await baseUrl.post(`${API}/chat`, body, {
    headers: authHeaders("application/json"),
  });
  if (data?.success === false) throw rejectApiResponse(data, "فشل إرسال الرسالة");
  return data;
}

export async function fetchExamBuilderSession(sessionId) {
  const { data } = await baseUrl.get(`${API}/sessions/${sessionId}`, {
    headers: authHeaders(),
  });
  if (data?.success === false) throw rejectApiResponse(data, "الجلسة غير موجودة");
  return {
    item: data?.session ?? null,
    questions: data?.questions ?? data?.session?.selected_questions ?? [],
  };
}

export async function regenerateExamBuilderSession(sessionId) {
  const { data } = await baseUrl.post(
    `${API}/sessions/${sessionId}/regenerate`,
    {},
    { headers: authHeaders("application/json") }
  );
  if (data?.success === false) throw rejectApiResponse(data, "فشل إعادة الاختيار");
  return data;
}

export async function adjustExamBuilderSession(sessionId, payload = {}) {
  const { data } = await baseUrl.post(`${API}/sessions/${sessionId}/adjust`, payload, {
    headers: authHeaders("application/json"),
  });
  if (data?.success === false) throw rejectApiResponse(data, "فشل تعديل الأسئلة");
  return data;
}

export async function approveExamBuilderSession(sessionId, payload = {}) {
  const { data } = await baseUrl.post(`${API}/sessions/${sessionId}/approve`, payload, {
    headers: authHeaders("application/json"),
  });
  if (data?.success === false) throw rejectApiResponse(data, "فشل اعتماد الأسئلة");
  return data;
}

export async function fetchExamBuilderQuestionPreview(source, questionId) {
  const { data } = await baseUrl.get(`${API}/questions/${source}/${questionId}/preview`, {
    headers: authHeaders(),
  });
  if (data?.success === false) throw rejectApiResponse(data, "تعذر معاينة السؤال");
  return data?.data ?? data;
}

export function normalizeChatResponse(data) {
  const list =
    data?.questions ??
    data?.session?.selected_questions ??
    data?.item?.selected_questions ??
    [];
  const session = data?.session?.id
    ? data.session
    : data?.session?.session_id
      ? mapHistoryItemToSession(data.session)
      : null;

  return {
    session,
    questions: Array.isArray(list) ? list : [],
    reply: data?.reply ?? data?.session?.assistant_reply ?? "",
    status: data?.status ?? null,
    actions: data?.actions ?? deriveActionsFromSession(session),
    assistantMessage: data?.assistant_message ?? null,
    thinkingMs: data?.thinking_ms ?? null,
  };
}

/** تحويل عنصر السجل (GET /history | GET /sessions/:id) إلى شكل session للواجهة */
export function mapHistoryItemToSession(item) {
  if (!item) return null;
  if (item.id && !item.session_id) return item;

  return {
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
}

export function deriveActionsFromSession(session) {
  if (!session || session.status !== "proposed") {
    return { can_approve: false, can_regenerate: false, can_adjust: false };
  }
  return { can_approve: true, can_regenerate: true, can_adjust: true };
}

export const QUESTION_TYPE_LABELS = {
  text_only: "نص",
  text_with_image: "نص + صورة",
  image_choices: "اختيارات صور",
};

export const DIFFICULTY_LABELS = {
  easy: "سهل",
  medium: "متوسط",
  hard: "صعب",
};
