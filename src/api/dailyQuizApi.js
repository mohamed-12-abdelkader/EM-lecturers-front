import baseUrl from "./baseUrl";

const API = "/api/daily-quizzes";

export function apiErrorMessage(err, fallback = "حدث خطأ غير متوقع") {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.errors?.[0]?.message ||
    err?.message ||
    fallback
  );
}

export const QUIZ_STATUS_LABELS = {
  draft: "مسودة",
  published: "منشورة",
  archived: "مؤرشفة",
};

export const QUIZ_STATUS_COLORS = {
  draft: "gray",
  published: "green",
  archived: "orange",
};

export const SHOW_ANSWERS_LABELS = {
  never: "لا تظهر أبدًا",
  after_submit: "بعد الإرسال مباشرة",
  after_end: "بعد انتهاء المسابقة",
};

export const SCORING_MODE_LABELS = {
  rank_bonus: "مكافأة حسب الترتيب",
  time_ratio: "مكافأة حسب الوقت المتبقي",
};

export function formatDuration(seconds) {
  const s = Number(seconds) || 0;
  if (s < 60) return `${s} ث`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (rem === 0) return `${m} د`;
  return `${m} د ${rem} ث`;
}

export function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

/** datetime-local ← ISO */
export function toLocalInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** ISO ← datetime-local */
export function fromLocalInputValue(local) {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function defaultQuizForm(gradeId = "") {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(16);
  const end = new Date(start);
  end.setHours(22);
  return {
    title: "",
    description: "",
    grade_id: gradeId || "",
    starts_at: toLocalInputValue(start.toISOString()),
    ends_at: toLocalInputValue(end.toISOString()),
    duration_seconds: 600,
    max_points: 100,
    allow_one_attempt: true,
    shuffle_questions: true,
    shuffle_options: true,
    allow_navigation: true,
    show_answers_mode: "after_end",
    scoring_mode: "rank_bonus",
    rank_bonus_start: 50,
    rank_bonus_step: 5,
    rank_bonus_min: 0,
    time_ratio_max_bonus: 50,
    status: "draft",
    is_visible: true,
  };
}

export function quizToForm(quiz) {
  if (!quiz) return defaultQuizForm();
  return {
    title: quiz.title || "",
    description: quiz.description || "",
    grade_id: quiz.grade_id ?? "",
    starts_at: toLocalInputValue(quiz.starts_at),
    ends_at: toLocalInputValue(quiz.ends_at),
    duration_seconds: Number(quiz.duration_seconds) || 600,
    max_points: Number(quiz.max_points) || 100,
    allow_one_attempt: quiz.allow_one_attempt !== false,
    shuffle_questions: quiz.shuffle_questions !== false,
    shuffle_options: quiz.shuffle_options !== false,
    allow_navigation: quiz.allow_navigation !== false,
    show_answers_mode: quiz.show_answers_mode || "after_end",
    scoring_mode: quiz.scoring_mode || "rank_bonus",
    rank_bonus_start: Number(quiz.rank_bonus_start) ?? 50,
    rank_bonus_step: Number(quiz.rank_bonus_step) ?? 5,
    rank_bonus_min: Number(quiz.rank_bonus_min) ?? 0,
    time_ratio_max_bonus: Number(quiz.time_ratio_max_bonus) ?? 50,
    status: quiz.status || "draft",
    is_visible: quiz.is_visible !== false,
  };
}

export function buildQuizPayload(form) {
  const starts_at = fromLocalInputValue(form.starts_at);
  const ends_at = fromLocalInputValue(form.ends_at);
  return {
    title: String(form.title || "").trim(),
    description: String(form.description || "").trim() || null,
    grade_id: Number(form.grade_id),
    starts_at,
    ends_at,
    duration_seconds: Number(form.duration_seconds) || 600,
    max_points: Number(form.max_points) || 100,
    allow_one_attempt: Boolean(form.allow_one_attempt),
    shuffle_questions: Boolean(form.shuffle_questions),
    shuffle_options: Boolean(form.shuffle_options),
    allow_navigation: Boolean(form.allow_navigation),
    show_answers_mode: form.show_answers_mode || "after_end",
    scoring_mode: form.scoring_mode || "rank_bonus",
    rank_bonus_start: Number(form.rank_bonus_start) || 0,
    rank_bonus_step: Number(form.rank_bonus_step) || 0,
    rank_bonus_min: Number(form.rank_bonus_min) || 0,
    time_ratio_max_bonus: Number(form.time_ratio_max_bonus) || 0,
    status: form.status || "draft",
    is_visible: form.is_visible !== false,
  };
}

export function validateQuizForm(form) {
  if (!String(form.title || "").trim()) return "عنوان المسابقة مطلوب";
  if (!form.grade_id) return "اختر الصف الدراسي";
  if (!form.starts_at || !form.ends_at) return "حدد وقت البداية والنهاية";
  const start = new Date(form.starts_at).getTime();
  const end = new Date(form.ends_at).getTime();
  if (!(end > start)) return "وقت النهاية يجب أن يكون بعد البداية";
  const duration = Number(form.duration_seconds);
  if (!duration || duration < 30) return "مدة الحل يجب ألا تقل عن 30 ثانية";
  if (duration > 7200) return "مدة الحل بحد أقصى ساعتين";
  return null;
}

export function emptyQuestionForm() {
  return {
    question_text: "",
    question_image_url: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    option_a_image_url: "",
    option_b_image_url: "",
    option_c_image_url: "",
    option_d_image_url: "",
    correct_answer: "A",
    points: 100,
  };
}

export function questionToForm(q) {
  if (!q) return emptyQuestionForm();
  return {
    question_text: q.question_text || "",
    question_image_url: q.question_image_url || "",
    option_a: q.option_a || "",
    option_b: q.option_b || "",
    option_c: q.option_c || "",
    option_d: q.option_d || "",
    option_a_image_url: q.option_a_image_url || "",
    option_b_image_url: q.option_b_image_url || "",
    option_c_image_url: q.option_c_image_url || "",
    option_d_image_url: q.option_d_image_url || "",
    correct_answer: q.correct_answer || "A",
    points: Number(q.points) || 100,
  };
}

export function buildQuestionPayload(form) {
  const cleanUrl = (v) => {
    const s = String(v || "").trim();
    return s || null;
  };
  return {
    question_text: String(form.question_text || "").trim(),
    question_image_url: cleanUrl(form.question_image_url),
    option_a: String(form.option_a || "").trim(),
    option_b: String(form.option_b || "").trim(),
    option_c: String(form.option_c || "").trim(),
    option_d: String(form.option_d || "").trim(),
    option_a_image_url: cleanUrl(form.option_a_image_url),
    option_b_image_url: cleanUrl(form.option_b_image_url),
    option_c_image_url: cleanUrl(form.option_c_image_url),
    option_d_image_url: cleanUrl(form.option_d_image_url),
    correct_answer: form.correct_answer || "A",
    points: Number(form.points) || 100,
  };
}

export function validateQuestionForm(form) {
  if (!String(form.question_text || "").trim()) return "نص السؤال مطلوب";
  if (!String(form.option_a || "").trim()) return "الخيار أ مطلوب";
  if (!String(form.option_b || "").trim()) return "الخيار ب مطلوب";
  if (!String(form.option_c || "").trim()) return "الخيار ج مطلوب";
  if (!String(form.option_d || "").trim()) return "الخيار د مطلوب";
  if (!["A", "B", "C", "D"].includes(form.correct_answer)) {
    return "حدد الإجابة الصحيحة";
  }
  return null;
}

export async function fetchTeacherGrades() {
  const { data } = await baseUrl.get("api/teacher/grades");
  return data?.grades || data?.data || [];
}

export async function fetchTeacherDailyQuizzes(params = {}) {
  const query = { ...params };
  Object.keys(query).forEach((k) => {
    if (query[k] === "" || query[k] == null) delete query[k];
  });
  const { data } = await baseUrl.get(`${API}/teacher`, { params: query });
  const payload = data?.data || {};
  return {
    items: Array.isArray(payload.items) ? payload.items : [],
    total: payload.total || 0,
    page: payload.page || 1,
    limit: payload.limit || 20,
  };
}

export async function fetchTeacherDailyQuiz(id) {
  const { data } = await baseUrl.get(`${API}/teacher/${id}`);
  return data?.data || null;
}

export async function createDailyQuiz(form) {
  const payload = buildQuizPayload(form);
  const { data } = await baseUrl.post(`${API}/`, payload);
  return data?.data;
}

export async function updateDailyQuiz(id, form) {
  const payload = buildQuizPayload(form);
  // لا نرسل status عبر update عادة — النشر من endpoint منفصل
  delete payload.status;
  const { data } = await baseUrl.patch(`${API}/teacher/${id}`, payload);
  return data?.data;
}

export async function publishDailyQuiz(id) {
  const { data } = await baseUrl.post(`${API}/teacher/${id}/publish`);
  return data?.data;
}

export async function deleteDailyQuiz(id) {
  const { data } = await baseUrl.delete(`${API}/teacher/${id}`);
  return data;
}

export async function addDailyQuizQuestion(quizId, form) {
  const payload = buildQuestionPayload(form);
  const { data } = await baseUrl.post(`${API}/teacher/${quizId}/questions`, payload);
  return data?.data;
}

export async function updateDailyQuizQuestion(quizId, questionId, form) {
  const payload = buildQuestionPayload(form);
  const { data } = await baseUrl.patch(
    `${API}/teacher/${quizId}/questions/${questionId}`,
    payload,
  );
  return data?.data;
}

export async function deleteDailyQuizQuestion(quizId, questionId) {
  const { data } = await baseUrl.delete(
    `${API}/teacher/${quizId}/questions/${questionId}`,
  );
  return data;
}

export async function addDailyQuizQuestionsBulk(quizId, questions) {
  const payload = {
    questions: questions.map((q) => buildQuestionPayload(q)),
  };
  const { data } = await baseUrl.post(
    `${API}/teacher/${quizId}/questions/bulk`,
    payload,
  );
  return data?.data || [];
}

export async function fetchDailyQuizStats(quizId) {
  const { data } = await baseUrl.get(`${API}/teacher/${quizId}/stats`);
  return data?.data || null;
}

export async function downloadDailyQuizCsv(quizId) {
  const response = await baseUrl.get(`${API}/teacher/${quizId}/export.csv`, {
    responseType: "blob",
  });
  const blob = new Blob([response.data], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `daily-quiz-${quizId}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function fetchDailyQuizPdfData(quizId) {
  const { data } = await baseUrl.get(`${API}/teacher/${quizId}/export.pdf-data`);
  return data?.data || null;
}

/* ───────── Student APIs ───────── */

export const AVAILABILITY_LABELS = {
  upcoming: "قريبًا",
  live: "مباشر الآن",
  ended: "انتهت",
};

export const AVAILABILITY_COLORS = {
  upcoming: "blue",
  live: "orange",
  ended: "gray",
};

export function formatMs(ms) {
  const total = Math.max(0, Math.floor(Number(ms) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatDurationMs(ms) {
  const total = Math.max(0, Math.floor(Number(ms) / 1000));
  if (total < 60) return `${total} ث`;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return s ? `${m} د ${s} ث` : `${m} د`;
}

export function currentYearMonth() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export async function fetchStudentDailyQuizHome() {
  const { data } = await baseUrl.get(`${API}/student/home`);
  const payload = data?.data || {};
  return {
    section_title: payload.section_title || "المسابقة اليومية",
    quizzes: Array.isArray(payload.quizzes) ? payload.quizzes : [],
  };
}

export async function startStudentDailyQuiz(quizId, deviceInfo) {
  const body = deviceInfo ? { device_info: deviceInfo } : {};
  const { data } = await baseUrl.post(`${API}/${quizId}/start`, body);
  return data?.data || null;
}

export async function fetchStudentAttempt(attemptId) {
  const { data } = await baseUrl.get(`${API}/attempts/${attemptId}`);
  return data?.data || null;
}

export async function autosaveStudentAnswers(attemptId, answers) {
  const { data } = await baseUrl.patch(`${API}/attempts/${attemptId}/answers`, {
    answers,
  });
  return data?.data || null;
}

export async function submitStudentAttempt(attemptId, { answers, submit_token } = {}) {
  const body = {};
  if (answers) body.answers = answers;
  if (submit_token) body.submit_token = submit_token;
  const { data } = await baseUrl.post(`${API}/attempts/${attemptId}/submit`, body);
  return data?.data || null;
}

export async function fetchStudentDailyQuizResult(quizId) {
  const { data } = await baseUrl.get(`${API}/${quizId}/result`);
  return data?.data || null;
}

export async function fetchStudentDailyLeaderboard(quizId, limit = 50) {
  const { data } = await baseUrl.get(`${API}/${quizId}/leaderboard`, {
    params: { limit },
  });
  return data?.data || { items: [], me: null, total_participants: 0 };
}

export async function fetchMonthlyLeaderboard({ grade_id, year_month, limit = 100 }) {
  const { data } = await baseUrl.get(`${API}/leaderboard/monthly`, {
    params: { grade_id, year_month, limit },
  });
  return data?.data || { items: [], me: null, year_month };
}

export async function fetchMonthlyLeaderboardArchive({ grade_id, year_month }) {
  const { data } = await baseUrl.get(`${API}/leaderboard/monthly/archive`, {
    params: { grade_id, year_month },
  });
  return data?.data || { items: [], me: null, year_month };
}

export async function fetchStudentAchievements() {
  const { data } = await baseUrl.get(`${API}/student/achievements`);
  return data?.data || null;
}

export function answersMapToPayload(answersMap) {
  return Object.entries(answersMap || {}).map(([question_id, selected_answer]) => ({
    question_id: Number(question_id),
    selected_answer: selected_answer || null,
  }));
}

export function savedAnswersToMap(saved = []) {
  const map = {};
  (Array.isArray(saved) ? saved : []).forEach((a) => {
    if (a?.question_id != null) {
      map[a.question_id] = a.selected_answer ?? null;
    }
  });
  return map;
}
