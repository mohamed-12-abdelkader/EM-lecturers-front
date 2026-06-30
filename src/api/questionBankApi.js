import baseUrl from "./baseUrl";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** يتعامل مع 200 فوري و 202 طلب موافقة للموظف */
export function parseQuestionBankResponse(res) {
  const body = res.data;
  if (res.status === 202) {
    return {
      ok: true,
      pending: true,
      message: body?.message || "تم إرسال الطلب للموافقة",
      data: body?.data ?? body,
    };
  }
  if (body?.success === false) {
    const err = new Error(body?.message || "فشلت العملية");
    err.response = { data: body, status: res.status };
    throw err;
  }
  return {
    ok: true,
    pending: false,
    message: body?.message,
    data: body?.data ?? body,
  };
}

export function toastQuestionBankResult(result, toast, successFallback) {
  if (!toast || !result) return;
  if (result.pending) {
    toast({
      title: "بانتظار موافقة الأدمن",
      description: result.message,
      status: "info",
      duration: 5000,
      isClosable: true,
    });
    return;
  }
  if (result.message || successFallback) {
    toast({
      title: "نجح",
      description: result.message || successFallback,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  }
}

export async function fetchQuestionBanks({
  page = 1,
  limit = 12,
  grade_id,
  is_active,
  search,
} = {}) {
  const params = { page, limit };
  if (grade_id) params.grade_id = grade_id;
  if (is_active !== undefined && is_active !== "" && is_active !== null) {
    params.is_active = is_active;
  }
  if (search?.trim()) params.search = search.trim();

  const res = await baseUrl.get("/api/question-banks", {
    params,
    headers: authHeaders(),
  });

  const payload = res.data?.data;

  if (Array.isArray(payload)) {
    return {
      question_banks: payload,
      total: payload.length,
      page: 1,
      limit: payload.length || limit,
      totalPages: 1,
    };
  }

  const nested = payload && typeof payload === "object" ? payload : {};
  const question_banks = nested.question_banks || [];
  return {
    question_banks,
    total: nested.total ?? question_banks.length,
    page: nested.page ?? page,
    limit: nested.limit ?? limit,
    totalPages: nested.totalPages ?? 1,
  };
}

/** يوحّد أسماء حقول العدّ من استجابات الـ API المختلفة */
export function getBankCounts(bank = {}) {
  return {
    subjects: Number(bank.subjects_count ?? bank.subjects ?? 0),
    books: Number(bank.books_count ?? bank.books ?? 0),
    chapters: Number(bank.chapters_count ?? bank.chapters ?? 0),
    lessons: Number(bank.lessons_count ?? bank.lessons ?? 0),
    questions: Number(bank.questions_count ?? bank.questions ?? 0),
    approved: bank.approved_questions_count ?? bank.approved_questions ?? null,
    pending: bank.pending_questions_count ?? bank.pending_questions ?? null,
  };
}

export async function fetchQuestionBankStats(bankId) {
  const res = await baseUrl.get(`/api/question-banks/${bankId}/stats`, {
    headers: authHeaders(),
  });
  return res.data?.data ?? null;
}

export async function createQuestionBank(formData) {
  const res = await baseUrl.post("/api/question-banks", formData, {
    headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function updateQuestionBank(bankId, formData) {
  const res = await baseUrl.put(`/api/question-banks/${bankId}`, formData, {
    headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteQuestionBank(bankId) {
  const res = await baseUrl.delete(`/api/question-banks/${bankId}`, {
    headers: authHeaders(),
  });
  return res.data;
}

export async function fetchSubjectWithBooks(subjectId) {
  const res = await baseUrl.get(`/api/subjects/${subjectId}/with-books`, {
    headers: authHeaders(),
  });
  return res.data?.data ?? null;
}

export async function updateBook(bookId, formData) {
  const res = await baseUrl.put(`/api/books/${bookId}`, formData, {
    headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
  });
  return parseQuestionBankResponse(res);
}

export async function deleteBook(bookId) {
  const res = await baseUrl.delete(`/api/books/${bookId}`, {
    headers: authHeaders(),
  });
  return parseQuestionBankResponse(res);
}

export async function updateChapter(chapterId, formData) {
  const res = await baseUrl.put(`/api/chapters/${chapterId}`, formData, {
    headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
  });
  return parseQuestionBankResponse(res);
}

export async function deleteChapterById(chapterId) {
  const res = await baseUrl.delete(`/api/chapters/${chapterId}`, {
    headers: authHeaders(),
  });
  return parseQuestionBankResponse(res);
}

export async function fetchBookWithChapters(bookId) {
  const res = await baseUrl.get(`/api/books/${bookId}/with-chapters`, {
    headers: authHeaders(),
  });
  const parsed = parseQuestionBankResponse(res);
  return parsed.data;
}

export async function fetchChapterWithLessons(chapterId) {
  const res = await baseUrl.get(`/api/chapters/${chapterId}/with-lessons`, {
    headers: authHeaders(),
  });
  const parsed = parseQuestionBankResponse(res);
  return parsed.data;
}

export async function fetchChapterLessons(chapterId) {
  const res = await baseUrl.get(`/api/chapters/${chapterId}/lessons`, {
    headers: authHeaders(),
  });
  const parsed = parseQuestionBankResponse(res);
  const payload = parsed.data;
  return Array.isArray(payload) ? payload : payload?.lessons ?? [];
}

export async function createChapterLesson(chapterId, formData) {
  const res = await baseUrl.post(`/api/chapters/${chapterId}/lessons`, formData, {
    headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
  });
  return parseQuestionBankResponse(res);
}

export async function updateLesson(lessonId, formData) {
  const res = await baseUrl.put(`/api/lessons/${lessonId}`, formData, {
    headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
  });
  return parseQuestionBankResponse(res);
}

export async function deleteLesson(lessonId) {
  const res = await baseUrl.delete(`/api/lessons/${lessonId}`, {
    headers: authHeaders(),
  });
  return parseQuestionBankResponse(res);
}

export async function fetchSubjectBooks(subjectId) {
  const res = await baseUrl.get(`/api/subjects/${subjectId}/books`, {
    headers: authHeaders(),
  });
  return res.data?.data?.books || res.data?.data || [];
}

export async function createSubjectBook(subjectId, formData) {
  const res = await baseUrl.post(`/api/subjects/${subjectId}/books`, formData, {
    headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
  });
  return parseQuestionBankResponse(res);
}

export async function createBookChapter(bookId, formData) {
  const res = await baseUrl.post(`/api/books/${bookId}/chapters`, formData, {
    headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
  });
  return parseQuestionBankResponse(res);
}
