import baseUrl from "./baseUrl";
import { parseCourseExamsResponse } from "../utils/courseLevelExamUtils";
import { isNetworkError } from "../utils/network";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function teacherCourseExamPaths(courseId) {
  return [
    `/api/exams/course/${courseId}`,
    `/api/course/${courseId}/course-exams`,
  ];
}

function studentCourseExamPaths(courseId) {
  return [`/api/exams/course/${courseId}/student`];
}

async function fetchFromEndpoints(paths, token) {
  let lastError;

  for (const path of paths) {
    try {
      const { data } = await baseUrl.get(path, {
        headers: authHeaders(token),
        params: { _t: Date.now() },
      });
      return parseCourseExamsResponse(data);
    } catch (err) {
      lastError = err;
      const status = err?.response?.status;
      if (status !== 404 && !isNetworkError(err)) break;
    }
  }

  throw lastError ?? new Error("تعذر تحميل الامتحانات الشاملة");
}

/** GET /api/exams/:examId/attempt-report */
export async function fetchExamAttemptReport(examId, token, attemptId) {
  const params = { _t: Date.now() };
  if (attemptId) params.attemptId = attemptId;
  const { data } = await baseUrl.get(`/api/exams/${examId}/attempt-report`, {
    headers: authHeaders(token),
    params,
  });
  return data?.data && data.exam == null ? data.data : data;
}

async function attachAttemptReports(exams, token) {
  const list = Array.isArray(exams) ? exams : [];
  const withAttempts = list.filter(
    (exam) => Number(exam?.attempts_count) > 0 || exam?.last_attempt_number
  );
  if (!withAttempts.length) return list;

  const entries = await Promise.all(
    withAttempts.map(async (exam) => {
      try {
        const report = await fetchExamAttemptReport(exam.id, token);
        return [exam.id, report];
      } catch {
        return [exam.id, null];
      }
    })
  );
  const reports = Object.fromEntries(entries);

  return list.map((exam) => {
    const report = reports[exam.id];
    if (!report) return exam;
    return {
      ...exam,
      attempt_report: report,
      showAnswers: report.showAnswers,
      show_answers: report.showAnswers,
      releaseReason: report.releaseReason,
      release_reason: report.releaseReason,
      examEndAt: report.examEndAt ?? exam.examEndAt,
      answersVisibleAt: report.answersVisibleAt ?? exam.answersVisibleAt,
    };
  });
}

/** GET /api/exams/course/:courseId — للمدرس والأدمن */
export async function fetchCourseExams(courseId, token) {
  return fetchFromEndpoints(teacherCourseExamPaths(courseId), token);
}

/** GET /api/exams/course/:courseId/student — للطالب */
export async function fetchStudentCourseExams(courseId, token) {
  const exams = await fetchFromEndpoints(studentCourseExamPaths(courseId), token);
  return attachAttemptReports(exams, token);
}

/** POST /api/exams/:examId/start — بدء أو استئناف محاولة الطالب */
export async function startCourseExamAttempt(examId, token) {
  const { data } = await baseUrl.post(
    `/api/exams/${examId}/start`,
    {},
    { headers: authHeaders(token) }
  );
  return data;
}

/** POST /api/exams/:examId/autosave — حفظ إجابات المحاولة الجارية على السيرفر */
export async function autosaveCourseExamAnswers(examId, token, { attemptId, answers }) {
  const { data } = await baseUrl.post(
    `/api/exams/${examId}/autosave`,
    { attemptId, attempt_id: attemptId, answers },
    {
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
  return data;
}

/** POST /api/exams/:examId/submit */
export async function submitCourseExamAttempt(examId, token, { attemptId, answers }) {
  const { data } = await baseUrl.post(
    `/api/exams/${examId}/submit`,
    { attemptId, attempt_id: attemptId, answers },
    {
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
  return data;
}

export function translateCourseExamStudentError(err, fallback = "حدث خطأ أثناء بدء الامتحان") {
  if (isNetworkError(err)) {
    return "تعذر الاتصال بالخادم. تحقق من الإنترنت ثم حاول مرة أخرى.";
  }

  const status = err?.response?.status;
  const raw = String(err?.response?.data?.message || err?.message || "").trim();
  const lower = raw.toLowerCase();

  if (status === 401) return "يجب تسجيل الدخول كطالب لبدء الامتحان.";
  if (lower.includes("invalid exam id")) return "معرف الامتحان غير صالح.";
  if (lower.includes("not enrolled")) return "أنت غير مسجّل في هذا الكورس.";
  if (lower.includes("not active")) return "الامتحان غير نشط حالياً.";
  if (lower.includes("not visible")) return "الامتحان غير ظاهر للطلاب حالياً.";
  if (lower.includes("has ended") || lower.includes("cannot start a new attempt")) {
    return "انتهى موعد الامتحان. يمكنك الاطلاع عليه لكن لا يمكن بدء محاولة جديدة.";
  }
  if (lower.includes("not open yet")) return "الامتحان لم يُفتح بعد.";
  if (lower.includes("not ready yet")) return "الامتحان غير جاهز بعد.";
  if (lower.includes("no longer available")) return "الامتحان لم يعد متاحاً.";
  if (lower.includes("all allowed attempts")) return "استنفدت كل المحاولات المتاحة لهذا الامتحان.";
  if (lower.includes("already completed") || lower.includes("only one attempt")) {
    return "أنهيت هذا الامتحان مسبقاً. يُسمح بمحاولة واحدة فقط.";
  }
  if (lower.includes("exam not found") || status === 404) return "الامتحان غير موجود.";
  if (lower.includes("attempt has already been submitted")) return "تم تسليم هذه المحاولة مسبقاً.";
  if (lower.includes("attemptid is required") || lower.includes("attempt id is required")) {
    return "لا توجد محاولة نشطة. ابدأ الامتحان أولاً.";
  }
  if (lower.includes("autosave is only supported")) {
    return "الحفظ التلقائي متاح لامتحانات الكورس الشاملة فقط.";
  }

  return raw || fallback;
}

export function courseExamsErrorMessage(
  err,
  fallback = "حدث خطأ في تحميل الامتحانات الشاملة",
) {
  if (isNetworkError(err)) {
    return "تعذر الاتصال بالخادم. تحقق من الإنترنت ثم حدّث الصفحة.";
  }
  return err?.response?.data?.message || err?.message || fallback;
}
