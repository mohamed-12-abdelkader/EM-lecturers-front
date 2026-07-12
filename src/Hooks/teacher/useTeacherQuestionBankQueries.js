import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import baseUrl from "../../api/baseUrl";
import {
  fetchChapterWithLessons,
  fetchSubjectWithBooks,
} from "../../api/questionBankApi";
import {
  normalizeLessonQuestionsResponse,
  normalizePassagesResponse,
} from "../../pages/Question Bank/utils/teacherLibraryQuestionUtils";

const LIBRARY_API = "/api/teacher/questions";

export const teacherQbKeys = {
  all: ["teacherQuestionBank"],
  subjects: () => [...teacherQbKeys.all, "subjects"],
  subject: (id) => [...teacherQbKeys.all, "subject", String(id)],
  chapter: (id) => [...teacherQbKeys.all, "chapter", String(id)],
  lessonQuestions: (id) => [...teacherQbKeys.all, "lessonQuestions", String(id)],
  lessonPassages: (id) => [...teacherQbKeys.all, "lessonPassages", String(id)],
  libraryLessons: () => [...teacherQbKeys.all, "libraryLessons"],
  libraryLesson: (id) => [...teacherQbKeys.all, "libraryLesson", String(id)],
  lectureExams: () => [...teacherQbKeys.all, "lectureExams"],
  comprehensiveExams: () => [...teacherQbKeys.all, "comprehensiveExams"],
};

const STALE_MS = 5 * 60 * 1000;
const GC_MS = 30 * 60 * 1000;

const queryDefaults = {
  staleTime: STALE_MS,
  gcTime: GC_MS,
  refetchOnWindowFocus: false,
  retry: 1,
};

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function requireToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    const err = new Error("يجب تسجيل الدخول أولاً");
    err.code = "NO_TOKEN";
    throw err;
  }
  return token;
}

export async function fetchTeacherQuestionBankSubjects() {
  requireToken();
  const { data } = await baseUrl.get("/api/teacher/subjects", {
    headers: authHeaders(),
  });
  if (!data?.success) {
    throw new Error(data?.message || "فشل تحميل المواد");
  }
  return Array.isArray(data.data) ? data.data : [];
}

export async function fetchLessonQuestions(lessonId) {
  requireToken();
  const { data } = await baseUrl.get(`/api/question-bank-v2/lesson/${lessonId}`, {
    headers: authHeaders(),
  });
  if (!data?.success) {
    throw new Error(data?.message || "حدث خطأ في جلب الأسئلة");
  }
  return data.data?.questions || data.data || [];
}

export async function fetchLessonPassages(lessonId) {
  requireToken();
  const { data } = await baseUrl.get(
    `/api/question-bank-v2/lesson/${lessonId}/passages`,
    { headers: authHeaders() },
  );
  if (data?.success && Array.isArray(data.data)) return data.data;
  return [];
}

export async function fetchTeacherLibraryLessons() {
  requireToken();
  const { data } = await baseUrl.get(`${LIBRARY_API}/lessons`, {
    headers: authHeaders(),
  });
  return data.lessons || [];
}

export async function fetchTeacherLibraryLessonContent(lessonId) {
  requireToken();
  const [questionsRes, passagesRes] = await Promise.allSettled([
    baseUrl.get(`${LIBRARY_API}/questions/${lessonId}`, { headers: authHeaders() }),
    baseUrl.get(`${LIBRARY_API}/passages/${lessonId}`, { headers: authHeaders() }),
  ]);

  const questionsPayload =
    questionsRes.status === "fulfilled" ? questionsRes.value?.data : null;
  const passagesPayload =
    passagesRes.status === "fulfilled" ? passagesRes.value?.data : null;

  if (!passagesPayload && !questionsPayload) {
    throw new Error("فشل تحميل محتوى الدرس");
  }

  const passages = normalizePassagesResponse(passagesPayload?.passages || []);
  let questions = normalizeLessonQuestionsResponse(questionsPayload?.questions || []);

  if (!questions.length && passages.length) {
    questions = passages.flatMap((p) => p.questions || []);
  }

  return { questions, passages };
}

export async function fetchTeacherLectureExams() {
  requireToken();
  const { data } = await baseUrl.get("/api/exams/teacher/lecture-exams", {
    headers: authHeaders(),
  });
  return data?.exams || [];
}

export async function fetchTeacherComprehensiveExams() {
  requireToken();
  const { data } = await baseUrl.get("/api/exams/teacher", {
    headers: authHeaders(),
  });
  return data?.exams || [];
}

export function useTeacherQbSubjects(options = {}) {
  const token = localStorage.getItem("token");
  return useQuery({
    queryKey: teacherQbKeys.subjects(),
    queryFn: fetchTeacherQuestionBankSubjects,
    enabled: !!token && options.enabled !== false,
    ...queryDefaults,
    ...options,
  });
}

export function useTeacherQbSubject(subjectId, options = {}) {
  const token = localStorage.getItem("token");
  return useQuery({
    queryKey: teacherQbKeys.subject(subjectId),
    queryFn: () => fetchSubjectWithBooks(subjectId),
    enabled: !!token && !!subjectId && options.enabled !== false,
    ...queryDefaults,
    ...options,
  });
}

export function useTeacherQbChapter(chapterId, options = {}) {
  const token = localStorage.getItem("token");
  return useQuery({
    queryKey: teacherQbKeys.chapter(chapterId),
    queryFn: () => fetchChapterWithLessons(chapterId),
    enabled: !!token && !!chapterId && options.enabled !== false,
    ...queryDefaults,
    ...options,
  });
}

export function useTeacherQbLessonQuestions(lessonId, options = {}) {
  const token = localStorage.getItem("token");
  return useQuery({
    queryKey: teacherQbKeys.lessonQuestions(lessonId),
    queryFn: () => fetchLessonQuestions(lessonId),
    enabled: !!token && !!lessonId && options.enabled !== false,
    ...queryDefaults,
    ...options,
  });
}

export function useTeacherQbLessonPassages(lessonId, options = {}) {
  const token = localStorage.getItem("token");
  return useQuery({
    queryKey: teacherQbKeys.lessonPassages(lessonId),
    queryFn: () => fetchLessonPassages(lessonId),
    enabled: !!token && !!lessonId && options.enabled !== false,
    ...queryDefaults,
    ...options,
  });
}

export function useTeacherLibraryLessons(options = {}) {
  const token = localStorage.getItem("token");
  return useQuery({
    queryKey: teacherQbKeys.libraryLessons(),
    queryFn: fetchTeacherLibraryLessons,
    enabled: !!token && options.enabled !== false,
    ...queryDefaults,
    ...options,
  });
}

export function useTeacherLibraryLessonContent(lessonId, options = {}) {
  const token = localStorage.getItem("token");
  return useQuery({
    queryKey: teacherQbKeys.libraryLesson(lessonId),
    queryFn: () => fetchTeacherLibraryLessonContent(lessonId),
    enabled: !!token && !!lessonId && options.enabled !== false,
    ...queryDefaults,
    ...options,
  });
}

export function useTeacherLectureExams(options = {}) {
  const token = localStorage.getItem("token");
  return useQuery({
    queryKey: teacherQbKeys.lectureExams(),
    queryFn: fetchTeacherLectureExams,
    enabled: !!token && options.enabled !== false,
    staleTime: 2 * 60 * 1000,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
}

export function useTeacherComprehensiveExams(options = {}) {
  const token = localStorage.getItem("token");
  return useQuery({
    queryKey: teacherQbKeys.comprehensiveExams(),
    queryFn: fetchTeacherComprehensiveExams,
    enabled: !!token && options.enabled !== false,
    staleTime: 2 * 60 * 1000,
    gcTime: GC_MS,
    refetchOnWindowFocus: false,
    retry: 1,
    ...options,
  });
}

/** إبطال كاش شجرة المواد بعد تعديل كتب/فصول/دروس */
export function useInvalidateTeacherQuestionBank() {
  const queryClient = useQueryClient();

  return useMemo(
    () => ({
      invalidateSubjects: () =>
        queryClient.invalidateQueries({ queryKey: teacherQbKeys.subjects() }),
      invalidateSubject: (subjectId) =>
        queryClient.invalidateQueries({ queryKey: teacherQbKeys.subject(subjectId) }),
      invalidateChapter: (chapterId) =>
        queryClient.invalidateQueries({ queryKey: teacherQbKeys.chapter(chapterId) }),
      invalidateLesson: (lessonId) =>
        Promise.all([
          queryClient.invalidateQueries({
            queryKey: teacherQbKeys.lessonQuestions(lessonId),
          }),
          queryClient.invalidateQueries({
            queryKey: teacherQbKeys.lessonPassages(lessonId),
          }),
        ]),
      invalidateLibraryLessons: () =>
        queryClient.invalidateQueries({ queryKey: teacherQbKeys.libraryLessons() }),
      invalidateLibraryLesson: (lessonId) =>
        queryClient.invalidateQueries({
          queryKey: teacherQbKeys.libraryLesson(lessonId),
        }),
      invalidateAll: () =>
        queryClient.invalidateQueries({ queryKey: teacherQbKeys.all }),
    }),
    [queryClient],
  );
}
