import baseUrl from "./baseUrl";

const API = "/api/teacher/questions";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function apiError(err, fallback) {
  return err?.response?.data?.message || fallback;
}

export async function fetchTeacherLibraryGrades() {
  const { data } = await baseUrl.get(`${API}/grades`, { headers: authHeaders() });
  return data?.grades || [];
}

export async function fetchTeacherLibraryLessons(gradeId) {
  const params = gradeId != null && gradeId !== "" ? { grade_id: gradeId } : undefined;
  const { data } = await baseUrl.get(`${API}/lessons`, {
    headers: authHeaders(),
    params,
  });
  return data?.lessons || [];
}

export async function fetchTeacherLibraryTree() {
  const { data } = await baseUrl.get(`${API}/tree`, { headers: authHeaders() });
  return data?.grades || [];
}

export async function createTeacherLibraryGrade(payload) {
  const { data } = await baseUrl.post(`${API}/grade`, payload, { headers: authHeaders() });
  return data?.grade || data;
}

export async function updateTeacherLibraryGrade(gradeId, payload) {
  const { data } = await baseUrl.put(`${API}/grade/${gradeId}`, payload, {
    headers: authHeaders(),
  });
  return data?.grade || data;
}

export async function deleteTeacherLibraryGrade(gradeId) {
  await baseUrl.delete(`${API}/grade/${gradeId}`, { headers: authHeaders() });
}

export async function createTeacherLibraryLesson(payload) {
  const { data } = await baseUrl.post(`${API}/lesson`, payload, { headers: authHeaders() });
  return data?.lesson || data;
}

export async function updateTeacherLibraryLesson(lessonId, payload) {
  const { data } = await baseUrl.put(`${API}/lesson/${lessonId}`, payload, {
    headers: authHeaders(),
  });
  return data?.lesson || data;
}

export async function deleteTeacherLibraryLesson(lessonId) {
  await baseUrl.delete(`${API}/lesson/${lessonId}`, { headers: authHeaders() });
}

export async function bulkCreateTeacherLibraryQuestions({ lessonId, bulkText }) {
  const { data } = await baseUrl.post(
    `${API}/bulk`,
    { lesson_id: Number(lessonId), bulk_text: String(bulkText || "").trim() },
    { headers: { ...authHeaders(), "Content-Type": "application/json" } },
  );
  return data;
}

/**
 * إنشاء / تحديث قطعة قراءة مع أسئلتها
 * POST /api/questions/reading-passage
 *
 * وضعان (أحدهما فقط):
 * 1) questions[] — كل الأسئلة دفعة واحدة في نفس الطلب (حد أقصى 50)
 * 2) questionsBulkText + correctAnswers — نص bulk
 *
 * تحديث: سؤال موجود → id، جديد → بدون id، محذوف → لا يُرسل
 */
export async function saveReadingPassageQuestions({
  lessonId,
  passageText,
  passageTitle,
  passageId,
  questions,
  questionsBulkText,
  correctAnswers,
}) {
  const payload = {
    lessonId: Number(lessonId),
    passageText: String(passageText || "").trim(),
  };

  if (passageTitle != null && String(passageTitle).trim()) {
    payload.passageTitle = String(passageTitle).trim();
    payload.title = String(passageTitle).trim();
  }
  if (passageId != null && passageId !== "") {
    payload.passageId = Number(passageId);
  }

  const bulk = String(questionsBulkText || "").trim();
  if (bulk) {
    payload.questionsBulkText = bulk;
    if (Array.isArray(correctAnswers) && correctAnswers.length) {
      payload.correctAnswers = correctAnswers.map((a) =>
        String(a || "").trim().toUpperCase(),
      );
    }
  } else if (Array.isArray(questions)) {
    if (questions.length > 50) {
      throw new Error("الحد الأقصى 50 سؤالاً في الطلب الواحد");
    }
    payload.questions = questions.map((q) => {
      const item = {
        questionText: String(q.questionText || q.question_text || "").trim(),
        options: (q.options || []).map((opt) => {
          if (opt && typeof opt === "object" && "text" in opt) {
            return {
              text: String(opt.text || "").trim(),
              isCorrect: Boolean(opt.isCorrect ?? opt.is_correct),
            };
          }
          return { text: String(opt || "").trim(), isCorrect: false };
        }),
      };
      if (q.id != null && q.id !== "") item.id = Number(q.id);
      return item;
    });
  } else {
    throw new Error("أضف أسئلة كمصفوفة أو كنص bulk");
  }

  const { data } = await baseUrl.post("/api/questions/reading-passage", payload, {
    headers: { ...authHeaders(), "Content-Type": "application/json" },
  });
  return data;
}

/** المسار القديم للتوافق */
export async function createTeacherLibraryPassageLegacy(payload) {
  const { data } = await baseUrl.post(`${API}/passage`, payload, {
    headers: authHeaders(),
  });
  return data;
}

export { API as TEACHER_LIBRARY_API, apiError as teacherLibraryApiError };
