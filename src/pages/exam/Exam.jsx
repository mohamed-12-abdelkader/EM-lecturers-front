import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box, VStack, Heading, Text, Spinner, Center, RadioGroup, Radio, Stack,
  Alert, AlertIcon, IconButton, HStack, useToast, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, Input, Divider, Badge, Tooltip, InputGroup, InputRightElement, Image, useColorModeValue, Flex, SimpleGrid, Grid, Textarea
} from "@chakra-ui/react";
import { AiFillEdit, AiFillDelete, AiFillCheckCircle, AiOutlineCheckCircle, AiOutlineCloseCircle, AiFillStar, AiOutlineRobot } from "react-icons/ai";
import baseUrl from "../../api/baseUrl";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import UserType from "../../Hooks/auth/userType";
import {
  FaBookOpen, FaCheckCircle, FaChevronLeft, FaChevronRight,
  FaUser, FaTimesCircle, FaImage, FaChartBar, FaCompass, FaFilePdf
} from 'react-icons/fa';
import { BiSearch } from "react-icons/bi";
import { FiDownload } from "react-icons/fi";
import {
  PlatformExamTeacherCard,
  formatAnswerLabel,
} from "./components/PlatformExamQuestionCard";
import AiQuestionExtractionModal from "./components/AiQuestionExtractionModal";
import { SubmissionCard } from "./components/ExamSubmissionsView";
import { downloadExamGradesExcel, downloadExamGradesPdf } from "./utils/examSubmissionUtils";
import { PaginationBar } from "../centerMgmt/components/UiBits";
import FormattedQuestionText from "../../components/question/FormattedQuestionText";
import { MdArrowBack } from "react-icons/md";
import ExamReadyScreen from "./components/ExamReadyScreen";
import ExamStudentProgress from "./components/ExamStudentProgress";
import LectureExamStudentQuestionCard from "./components/LectureExamStudentQuestionCard";
import ExamAttemptResultScreen from "./components/ExamAttemptResultScreen";
import {
  buildExamSubmitAnswers,
  normalizeExamQuestionsFromApi,
  extractExamAttemptId,
  toPositiveAttemptId,
} from "../../utils/examFlowUtils";
import { fetchExamAttemptReport } from "../../api/courseExamsApi";
import { normalizeExamAttemptResult, normalizeAttemptReport } from "../../utils/examAttemptResultUtils";
import TeacherExamTour from "../../components/onboarding/TeacherExamTour";
import {
  TOUR_CLOSE_AI,
  TOUR_CLOSE_ALL,
  TOUR_CLOSE_DELETE,
  TOUR_CLOSE_EDIT,
  TOUR_OPEN_AI,
  TOUR_OPEN_DELETE,
  TOUR_OPEN_EDIT,
} from "../../utils/teacherExamTour";

const GRADES_PAGE_SIZE = 20;

function currentUserStorageId() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.id || user.user_id || user.student_id || "u";
  } catch {
    return "u";
  }
}

function examAttemptStorageKey(examId) {
  return `em-lecture-exam-attempt:${currentUserStorageId()}:${examId}`;
}

function examProgressStorageKey(examId, attemptId) {
  return `em-lecture-exam-progress:${currentUserStorageId()}:${examId}:${attemptId}`;
}

function parseDateMs(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function remainingFromEndsAt(endsAt) {
  const ms = Number(endsAt);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return Math.max(0, Math.ceil((ms - Date.now()) / 1000));
}

function resolveExamEndsAt({ startedAt, durationMinutes, localEndsAt, apiRemainingSeconds }) {
  const candidates = [];
  const startMs = parseDateMs(startedAt);
  const durationMs =
    durationMinutes != null && Number(durationMinutes) > 0
      ? Number(durationMinutes) * 60 * 1000
      : null;

  if (startMs && durationMs) candidates.push(startMs + durationMs);

  const local = Number(localEndsAt);
  if (Number.isFinite(local) && local > 0) candidates.push(local);

  if (!candidates.length && apiRemainingSeconds != null && Number.isFinite(Number(apiRemainingSeconds))) {
    candidates.push(Date.now() + Math.max(0, Number(apiRemainingSeconds)) * 1000);
  }
  if (!candidates.length && durationMs) {
    candidates.push(Date.now() + durationMs);
  }

  return candidates.length ? Math.min(...candidates) : null;
}

function normalizeAnswerMap(source) {
  if (!source) return {};
  if (Array.isArray(source)) {
    const map = {};
    for (const item of source) {
      if (!item || typeof item !== "object") continue;
      const qid = item.questionId ?? item.question_id ?? item.id;
      const ans = item.selectedAnswer ?? item.selected_answer ?? item.answer ?? item.choice;
      if (qid == null || ans == null || ans === "") continue;
      map[String(qid)] = String(ans).toUpperCase();
    }
    return map;
  }
  if (typeof source === "object") {
    const map = {};
    for (const [qid, ans] of Object.entries(source)) {
      if (ans == null || ans === "") continue;
      if (typeof ans === "object") {
        const letter = ans.selectedAnswer ?? ans.selected_answer ?? ans.answer ?? ans.choice;
        if (letter != null && letter !== "") map[String(qid)] = String(letter).toUpperCase();
        continue;
      }
      map[String(qid)] = String(ans).toUpperCase();
    }
    return map;
  }
  return {};
}

function extractInProgressAnswers(data = {}) {
  const attempt = data.attempt && typeof data.attempt === "object" ? data.attempt : {};
  return {
    ...normalizeAnswerMap(data.answers),
    ...normalizeAnswerMap(data.studentAnswers),
    ...normalizeAnswerMap(attempt.answers),
    ...normalizeAnswerMap(attempt.studentAnswers),
  };
}

function readExamProgress(examId, attemptId) {
  const id = toPositiveAttemptId(attemptId);
  if (!examId || !id || typeof window === "undefined") return null;
  const key = examProgressStorageKey(examId, id);
  try {
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeExamProgress(examId, attemptId, payload = {}) {
  const id = toPositiveAttemptId(attemptId);
  if (!examId || !id || typeof window === "undefined") return;
  const key = examProgressStorageKey(examId, id);
  const value = JSON.stringify({
    attemptId: id,
    answers: payload.answers && typeof payload.answers === "object" ? payload.answers : {},
    current: Number.isInteger(payload.current) ? payload.current : 0,
    endsAt: payload.endsAt ?? null,
    startedAt: payload.startedAt ?? null,
    savedAt: Date.now(),
  });
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore quota
  }
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore quota
  }
}

function clearExamProgress(examId, attemptId) {
  const id = toPositiveAttemptId(attemptId);
  if (!examId || !id || typeof window === "undefined") return;
  const key = examProgressStorageKey(examId, id);
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function readPersistedAttemptId(examId) {
  if (!examId || typeof window === "undefined") return null;
  const key = examAttemptStorageKey(examId);
  try {
    return (
      toPositiveAttemptId(sessionStorage.getItem(key)) ||
      toPositiveAttemptId(localStorage.getItem(key))
    );
  } catch {
    return null;
  }
}

function persistAttemptId(examId, attemptId) {
  const id = toPositiveAttemptId(attemptId);
  if (!examId || !id || typeof window === "undefined") return;
  const key = examAttemptStorageKey(examId);
  const value = String(id);
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore quota
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore quota
  }
}

function clearPersistedAttemptId(examId) {
  if (!examId || typeof window === "undefined") return;
  const key = examAttemptStorageKey(examId);
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

const Exam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const wantAttemptReport = searchParams.get("view") === "report";
  const [userData, isAdmin, isTeacher, student] = UserType();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModal, setEditModal] = useState({ open: null });
  const [editForm, setEditForm] = useState({ text: "", choices: [] });
  const [deleteModal, setDeleteModal] = useState({ open: false, qid: null });
  const [deleting, setDeleting] = useState(false);
  const [pendingCorrect, setPendingCorrect] = useState({});
  const [studentAnswers, setStudentAnswers] = useState({}); // { [questionId]: 'A'|'B'|'C'|'D' } مثل التطبيق المرجعي
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const toast = useToast();
  // pagination state for student
  const [current, setCurrent] = useState(0);
  // State لدرجات الطلاب
  const [showGrades, setShowGrades] = useState(false);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [gradesData, setGradesData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradesCurrentPage, setGradesCurrentPage] = useState(1);
  const [isExportingGradesPdf, setIsExportingGradesPdf] = useState(false);

  // للطالب: بدء الامتحان عبر POST /api/exams/:examId/start
  const [examStarted, setExamStarted] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [requiresStart, setRequiresStart] = useState(false);
  const [examSessionData, setExamSessionData] = useState(null);
  const [attemptId, setAttemptId] = useState(() => readPersistedAttemptId(examId));
  const [examMeta, setExamMeta] = useState(null); // { examTitle, durationMinutes, questionsCount, startedAt }
  const [remainingSeconds, setRemainingSeconds] = useState(null); // عد تنازلي من duration*60 (مثل التطبيق المرجعي)
  const [examEndsAt, setExamEndsAt] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalSrc, setImageModalSrc] = useState(null);
  const [imageUploadQuestionId, setImageUploadQuestionId] = useState(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [aiExtractionModalOpen, setAiExtractionModalOpen] = useState(false);
  const [examTourOpen, setExamTourOpen] = useState(false);
  const [blockedAttemptResult, setBlockedAttemptResult] = useState(null);
  const [questionsLoadError, setQuestionsLoadError] = useState(null);
  const questionImageInputRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const timerExpiredRef = useRef(false);
  const submitInFlightRef = useRef(false);
  const studentAnswersRef = useRef(studentAnswers);
  const attemptIdRef = useRef(attemptId);
  const submitResultRef = useRef(submitResult);
  const submitLoadingRef = useRef(submitLoading);
  const currentRef = useRef(current);
  const examEndsAtRef = useRef(examEndsAt);

  const token = localStorage.getItem("token");
  const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  useEffect(() => {
    if (isTeacher || isAdmin) {
      fetchQuestions();
      return;
    }
    // طالب أو لم يُحدد النوع بعد: لا نستدعي GET أسئلة (يُرجع 403 للطالب)
    setLoading(false);
    setError(null);
    // eslint-disable-next-line
  }, [examId, isTeacher, isAdmin]);

  // للطالب: تحميل جلسة الامتحان عبر GET /api/exams/:examId
  const isStudentView = !isTeacher && !isAdmin && student;

  useEffect(() => {
    studentAnswersRef.current = studentAnswers;
  }, [studentAnswers]);

  useEffect(() => {
    attemptIdRef.current = attemptId;
  }, [attemptId]);

  useEffect(() => {
    submitResultRef.current = submitResult;
  }, [submitResult]);

  useEffect(() => {
    submitLoadingRef.current = submitLoading;
  }, [submitLoading]);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  useEffect(() => {
    examEndsAtRef.current = examEndsAt;
  }, [examEndsAt]);

  const commitAttemptId = useCallback((value, { allowClear = false } = {}) => {
    const validId = toPositiveAttemptId(value);
    if (!validId) {
      if (!allowClear) {
        const fallback =
          toPositiveAttemptId(attemptIdRef.current) || readPersistedAttemptId(examId);
        if (fallback) {
          setAttemptId(fallback);
          attemptIdRef.current = fallback;
          persistAttemptId(examId, fallback);
          return fallback;
        }
        return null;
      }
      setAttemptId(null);
      attemptIdRef.current = null;
      return null;
    }
    setAttemptId(validId);
    attemptIdRef.current = validId;
    persistAttemptId(examId, validId);
    return validId;
  }, [examId]);

  useEffect(() => {
    if (toPositiveAttemptId(attemptId) || !examId) return;
    const persisted = readPersistedAttemptId(examId);
    if (persisted) commitAttemptId(persisted);
  }, [examId, attemptId, commitAttemptId]);

  const applyStudentSession = (data = {}) => {
    const exam = data.exam || {};
    const attempt = data.attempt || null;
    const rawQuestions = data.questions ?? [];
    const resolvedAttemptId =
      extractExamAttemptId(data, examId) || readPersistedAttemptId(examId);
    const localProgress = readExamProgress(examId, resolvedAttemptId);
    const hasLocalProgress = Boolean(
      localProgress?.endsAt ||
      (localProgress?.answers && Object.keys(localProgress.answers).length > 0),
    );
    const shouldRequireStart = !resolvedAttemptId;

    const examTitle = exam.title ?? data.examTitle ?? "";
    const durationMinutes =
      exam.durationMinutes ??
      exam.duration ??
      data.durationMinutes ??
      null;
    const questionsCount =
      exam.questionsCount ??
      exam.questions_count ??
      data.questionsCount ??
      rawQuestions.length;

    setRequiresStart(shouldRequireStart);
    setExamSessionData({
      title: examTitle,
      duration: durationMinutes ?? 0,
      durationMinutes: durationMinutes ?? 0,
      questionsCount,
    });
    commitAttemptId(resolvedAttemptId);

    if (rawQuestions.length > 0 && resolvedAttemptId && !shouldRequireStart) {
      const normalizedQuestions = normalizeExamQuestionsFromApi(rawQuestions);
      const startedAt =
        attempt?.startedAt ??
        attempt?.attemptStartTime ??
        data.startedAt ??
        localProgress?.startedAt ??
        null;
      const restoredAnswers = {
        ...extractInProgressAnswers(data),
        ...normalizeAnswerMap(localProgress?.answers),
      };
      const endsAt = resolveExamEndsAt({
        startedAt,
        durationMinutes,
        localEndsAt: localProgress?.endsAt,
        apiRemainingSeconds: attempt?.remainingSeconds ?? data.remainingSeconds,
      });
      const remaining = remainingFromEndsAt(endsAt);
      let resumeIndex = Number(localProgress?.current);
      if (!Number.isInteger(resumeIndex) || resumeIndex < 0 || resumeIndex >= normalizedQuestions.length) {
        const firstOpen = normalizedQuestions.findIndex((q) => {
          const ans = restoredAnswers[q.id] ?? restoredAnswers[String(q.id)];
          return ans == null || ans === "";
        });
        resumeIndex = firstOpen >= 0 ? firstOpen : 0;
      }
      timerExpiredRef.current = false;

      setQuestions(normalizedQuestions);
      setExamStarted(true);
      setRequiresStart(false);
      setQuestionsLoadError(null);
      setExamMeta({
        examTitle,
        durationMinutes: durationMinutes ?? 0,
        questionsCount: questionsCount || normalizedQuestions.length,
        startedAt,
      });
      setStudentAnswers(restoredAnswers);
      studentAnswersRef.current = restoredAnswers;
      setCurrent(resumeIndex);
      currentRef.current = resumeIndex;
      examEndsAtRef.current = endsAt;
      setExamEndsAt(endsAt);
      setRemainingSeconds(remaining);
      writeExamProgress(examId, resolvedAttemptId, {
        answers: restoredAnswers,
        current: resumeIndex,
        endsAt,
        startedAt,
      });
    } else if (resolvedAttemptId && !shouldRequireStart) {
      setExamStarted(true);
      setRequiresStart(false);
      if (!rawQuestions.length) {
        setQuestionsLoadError(
          "لم يتم تحميل أسئلة الامتحان. جاري إعادة المحاولة..."
        );
      }
    } else if (!hasLocalProgress) {
      setExamStarted(false);
      setStudentAnswers({});
      setCurrent(0);
      setExamEndsAt(null);
      setRemainingSeconds(null);
    }
  };

  const ensureAttemptIdBeforeSubmit = useCallback(async () => {
    const existing =
      toPositiveAttemptId(attemptIdRef.current) || readPersistedAttemptId(examId);
    if (existing) {
      return commitAttemptId(existing);
    }

    const token = localStorage.getItem("token");
    const headers = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    const fromPayload = (payload) => extractExamAttemptId(payload, examId);

    const tryGet = async () => {
      const getRes = await baseUrl.get(`/api/exams/${examId}`, headers);
      return fromPayload(getRes.data || {});
    };

    try {
      const fromGet = await tryGet();
      if (fromGet) return commitAttemptId(fromGet);
    } catch (err) {
      const fromErr = fromPayload(err?.response?.data || {});
      if (fromErr) return commitAttemptId(fromErr);
    }

    try {
      const startRes = await baseUrl.post(`/api/exams/${examId}/start`, {}, headers);
      const fromStart = fromPayload(startRes.data || {});
      if (fromStart) return commitAttemptId(fromStart);
      const fromGet = await tryGet();
      if (fromGet) return commitAttemptId(fromGet);
    } catch (err) {
      const fromErr = fromPayload(err?.response?.data || {});
      if (fromErr) return commitAttemptId(fromErr);
      try {
        const fromGet = await tryGet();
        if (fromGet) return commitAttemptId(fromGet);
      } catch {
        // ignore
      }
    }

    return null;
  }, [examId, commitAttemptId]);

  const hydrateExamSessionForResume = async (data = {}) => {
    const resumeAttemptId =
      extractExamAttemptId(data, examId) || readPersistedAttemptId(examId);
    const localProgress = readExamProgress(examId, resumeAttemptId);
    const shouldResume =
      Boolean(resumeAttemptId) &&
      data.status !== "already_submitted" &&
      (
        Boolean(localProgress?.endsAt) ||
        Boolean(localProgress?.answers && Object.keys(localProgress.answers).length > 0) ||
        Boolean(data.attempt) ||
        Boolean(extractExamAttemptId(data, examId))
      );

    if (!shouldResume) return data;

    let next = { ...data, requiresStart: false };
    let rawQuestions = next.questions ?? [];
    if (rawQuestions.length) return next;

    try {
      const startRes = await baseUrl.post(`/api/exams/${examId}/start`, {}, authHeaders);
      const startData = startRes.data || {};
      rawQuestions = startData.questions ?? [];
      next = { ...next, ...startData, questions: rawQuestions, requiresStart: false };
    } catch (resumeErr) {
      const errData = resumeErr?.response?.data || {};
      rawQuestions = errData.questions ?? [];
      next = { ...next, ...errData, questions: rawQuestions, requiresStart: false };
    }

    if (rawQuestions.length) return next;

    try {
      const getRes = await baseUrl.get(`/api/exams/${examId}`, authHeaders);
      const getData = getRes.data || {};
      return {
        ...next,
        ...getData,
        questions: getData.questions ?? rawQuestions,
        requiresStart: false,
      };
    } catch {
      return next;
    }
  };

  const loadExamSession = async () => {
    setSessionLoading(true);
    setError(null);
    const loadAttemptReport = async () => {
      try {
        const report = await fetchExamAttemptReport(examId, token);
        const normalized = normalizeAttemptReport(report);
        if (normalized && (normalized.attemptId != null || normalized.maxGrade > 0 || normalized.totalGrade != null)) {
          setBlockedAttemptResult(normalized);
          if (normalized.examTitle) {
            setExamSessionData((prev) => ({
              ...(prev || {}),
              title: normalized.examTitle,
            }));
          }
          setError(null);
          return true;
        }
        return false;
      } catch (err) {
        const status = err?.response?.status;
        const apiMsg = err?.response?.data?.message;
        if (status === 404) {
          setError("لا توجد محاولة مكتملة لعرض التقرير");
        } else if (status === 403) {
          setError("غير مسموح بعرض التقرير حالياً");
        } else if (apiMsg) {
          setError(apiMsg);
        }
        return false;
      }
    };

    try {
      if (wantAttemptReport) {
        const shown = await loadAttemptReport();
        if (!shown) {
          setError((prev) => prev || "لا يوجد تقرير متاح لهذه المحاولة");
        }
        return;
      }

      const res = await baseUrl.get(`/api/exams/${examId}`, authHeaders);
      const data = res.data || {};

      if (["hidden", "not_open_yet", "closed"].includes(data.status)) {
        const shown = await loadAttemptReport();
        if (shown) return;
        setError(data.message || "الامتحان غير متاح حالياً");
        return;
      }

      if (data.status === "already_submitted") {
        const shown = await loadAttemptReport();
        if (shown) return;
        const normalized = normalizeExamAttemptResult(data);
        if (normalized) {
          setBlockedAttemptResult(normalized);
          setError(null);
          return;
        }
        setError(data.message || "لقد أنهيت هذا الامتحان مسبقاً");
        return;
      }

      applyStudentSession(await hydrateExamSessionForResume(data));
    } catch (err) {
      console.error(err);
      const shown = await loadAttemptReport();
      if (shown) return;
      const msg = err.response?.data?.message || "حدث خطأ أثناء تحميل الامتحان";
      setError(msg);
    } finally {
      setSessionLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isTeacher || isAdmin || !examId) return;
    if (!student && !wantAttemptReport) return;
    setBlockedAttemptResult(null);
    loadExamSession();
    // eslint-disable-next-line
  }, [examId, student, wantAttemptReport, isTeacher, isAdmin]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await baseUrl.get(
        `/api/course/course-exam/${examId}/questions`,
        authHeaders
      );

      const data = res.data || {};
      let fetchedQuestions = data.questions || [];
      if (data.exam) {
        setExamMeta({
          examTitle: data.exam.title ?? "",
          durationMinutes: data.exam.durationMinutes ?? 0,
          questionsCount: data.exam.questionsCount ?? fetchedQuestions.length,
          startedAt: null,
        });
      }

      fetchedQuestions = normalizeExamQuestionsFromApi(fetchedQuestions);
      setQuestions(fetchedQuestions);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تحميل الأسئلة");
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async () => {
    setStartLoading(true);
    setQuestionsLoading(true);
    setError(null);
    try {
      const startRes = await baseUrl.post(`/api/exams/${examId}/start`, {}, authHeaders);
      const startData = startRes.data || {};
      let rawQuestions = startData.questions ?? [];
      let sessionPayload = { ...startData, requiresStart: false };

      if (!rawQuestions.length) {
        const getRes = await baseUrl.get(`/api/exams/${examId}`, authHeaders);
        const getData = getRes.data || {};
        rawQuestions = getData.questions ?? [];
        sessionPayload = { ...getData, requiresStart: false, questions: rawQuestions };
      }

      applyStudentSession({
        ...sessionPayload,
        questions: rawQuestions,
      });

      if (!extractExamAttemptId(sessionPayload, examId)) {
        throw new Error("لم يتم إنشاء محاولة للامتحان. حاول مرة أخرى.");
      }

      if (!rawQuestions.length) {
        throw new Error("لم يتم تحميل أسئلة الامتحان");
      }

      setQuestionsLoadError(null);
      setRequiresStart(false);
      toast({ title: "تم بدء الامتحان", status: "success" });
    } catch (err) {
      console.error(err);
      const responseData = err.response?.data || {};
      const normalized = normalizeExamAttemptResult(responseData);
      if (normalized) {
        setBlockedAttemptResult(normalized);
        setError(null);
        return;
      }
      const msg = responseData.message || err.message || "حدث خطأ أثناء بدء الامتحان";
      setError(msg);
      toast({ title: msg, status: "error" });
    } finally {
      setStartLoading(false);
      setQuestionsLoading(false);
    }
  };

  // جلب الدرجات
  const fetchGrades = async () => {
    setGradesLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await baseUrl.get(`/api/course/course-exam/${examId}/submissions`, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
      setGradesData(res.data.submissions || []);
    } catch {
      toast({ title: "فشل جلب الدرجات", status: "error" });
    } finally {
      setGradesLoading(false);
    }
  };

  const filteredGrades = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return gradesData.filter((submission) => {
      if (!term) return true;
      return (
        (submission.name && submission.name.toLowerCase().includes(term)) ||
        (submission.student_id != null && String(submission.student_id).includes(term)) ||
        (submission.submission_id != null && String(submission.submission_id).includes(term)) ||
        (submission.attempt_number != null && String(submission.attempt_number).includes(term)) ||
        (submission.email && submission.email.toLowerCase().includes(term)) ||
        (submission.phone && submission.phone.includes(term))
      );
    });
  }, [gradesData, searchTerm]);

  const gradesTotalPages = Math.max(1, Math.ceil(filteredGrades.length / GRADES_PAGE_SIZE));

  const paginatedGrades = useMemo(() => {
    const start = (gradesCurrentPage - 1) * GRADES_PAGE_SIZE;
    return filteredGrades.slice(start, start + GRADES_PAGE_SIZE);
  }, [filteredGrades, gradesCurrentPage]);

  const gradesPageRangeStart =
    filteredGrades.length === 0 ? 0 : (gradesCurrentPage - 1) * GRADES_PAGE_SIZE + 1;
  const gradesPageRangeEnd = Math.min(gradesCurrentPage * GRADES_PAGE_SIZE, filteredGrades.length);

  useEffect(() => {
    setGradesCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (gradesCurrentPage > gradesTotalPages) {
      setGradesCurrentPage(gradesTotalPages);
    }
  }, [gradesCurrentPage, gradesTotalPages]);

  const handleExportGrades = () => {
    if (!filteredGrades.length) {
      toast({
        title: "لا توجد درجات للتصدير",
        description: "غيّر البحث ثم حاول مرة أخرى.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const exported = downloadExamGradesExcel(filteredGrades, {
      filename: `exam-grades-${new Date().toISOString().slice(0, 10)}.csv`,
    });

    if (exported) {
      toast({
        title: "تم تصدير الدرجات",
        description: `تم تنزيل ${filteredGrades.length} طالب بدون تفاصيل الأسئلة الخاطئة.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const gradesExportTitle =
    examMeta?.examTitle || examSessionData?.title || "درجات الطلاب في الامتحان";

  const handleExportGradesPdf = async () => {
    if (!filteredGrades.length) {
      toast({
        title: "لا توجد درجات للتصدير",
        description: "غيّر البحث ثم حاول مرة أخرى.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsExportingGradesPdf(true);
    try {
      const exported = await downloadExamGradesPdf(filteredGrades, {
        title: gradesExportTitle,
        filename: `exam-grades-${new Date().toISOString().slice(0, 10)}.pdf`,
      });

      if (exported) {
        toast({
          title: "تم تصدير PDF",
          description: `تم تنزيل ${filteredGrades.length} طالب في جدول PDF.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (exportError) {
      toast({
        title: "تعذر تصدير PDF",
        description: exportError?.message || "حاول مرة أخرى.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsExportingGradesPdf(false);
    }
  };

  // حذف سؤال
  const handleDelete = async () => {
    if (!deleteModal.qid) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      await baseUrl.delete(`/api/course/course-exam/question/${deleteModal.qid}`, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
      setQuestions((prev) => prev.filter((q) => q.id !== deleteModal.qid));
      toast({ title: "تم حذف السؤال", status: "success" });
      setDeleteModal({ open: false, qid: null });
    } catch {
      toast({ title: "فشل الحذف", status: "error" });
    } finally {
      setDeleting(false);
    }
  };

  // فتح مودال التعديل
  const openEditModal = (q) => {
    setEditForm({
      text: q.text,
      choices: q.choices.map((c) => ({
        ...c,
        text: c.text || c.image || "",
      })),
    });
    setEditModal({ open: true, question: q });
  };

  const isStaff = Boolean(isTeacher || isAdmin);

  useEffect(() => {
    if (!isStaff) return undefined;

    const closeAll = () => {
      setAiExtractionModalOpen(false);
      setEditModal({ open: false, question: null });
      setDeleteModal({ open: false, qid: null });
      setShowGrades(false);
    };
    const openAi = () => {
      setShowGrades(false);
      setAiExtractionModalOpen(true);
    };
    const closeAi = () => setAiExtractionModalOpen(false);
    const openEdit = () => {
      const q = questions[0];
      if (q) openEditModal(q);
    };
    const closeEdit = () => setEditModal({ open: false, question: null });
    const openDelete = () => {
      const q = questions[0];
      if (q?.id != null) setDeleteModal({ open: true, qid: q.id });
    };
    const closeDelete = () => setDeleteModal({ open: false, qid: null });

    window.addEventListener(TOUR_CLOSE_ALL, closeAll);
    window.addEventListener(TOUR_OPEN_AI, openAi);
    window.addEventListener(TOUR_CLOSE_AI, closeAi);
    window.addEventListener(TOUR_OPEN_EDIT, openEdit);
    window.addEventListener(TOUR_CLOSE_EDIT, closeEdit);
    window.addEventListener(TOUR_OPEN_DELETE, openDelete);
    window.addEventListener(TOUR_CLOSE_DELETE, closeDelete);

    return () => {
      window.removeEventListener(TOUR_CLOSE_ALL, closeAll);
      window.removeEventListener(TOUR_OPEN_AI, openAi);
      window.removeEventListener(TOUR_CLOSE_AI, closeAi);
      window.removeEventListener(TOUR_OPEN_EDIT, openEdit);
      window.removeEventListener(TOUR_CLOSE_EDIT, closeEdit);
      window.removeEventListener(TOUR_OPEN_DELETE, openDelete);
      window.removeEventListener(TOUR_CLOSE_DELETE, closeDelete);
    };
  }, [isStaff, questions]);

  // حفظ التعديل
  const handleEditSave = async () => {
    const { question } = editModal;
    try {
      const token = localStorage.getItem("token");
      await baseUrl.put(
        `/api/course/course-exam/question/${question.id}`,
        { text: editForm.text, choices: editForm.choices.map((c) => ({ id: c.id, text: c.text })) },
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      setQuestions((prev) => prev.map((q) =>
        q.id === question.id
          ? { ...q, text: editForm.text, choices: editForm.choices.map((c) => ({ ...c })) }
          : q
      ));
      toast({ title: "تم التعديل بنجاح", status: "success" });
      setEditModal({ open: false, question: null });
    } catch {
      toast({ title: "فشل التعديل", status: "error" });
    }
  };

  // تعيين الإجابة الصحيحة
  const handleSetCorrect = async (qid, cid) => {
    setPendingCorrect((prev) => ({ ...prev, [qid]: cid }));
    setQuestions((prev) => prev.map((q) =>
      q.id === qid
        ? { ...q, choices: q.choices.map((c) => ({ ...c, is_correct: c.id === cid })) }
        : q
    ));
    try {
      const token = localStorage.getItem("token");
      await baseUrl.patch(
        `/api/course/course-exam/question/${qid}/correct-answer`,
        { correct_choice_id: cid },
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      toast({ title: "تم تحديد الإجابة الصحيحة", status: "success" });
      setPendingCorrect((prev) => {
        const copy = { ...prev };
        delete copy[qid];
        return copy;
      });
    } catch {
      toast({ title: "فشل تحديد الإجابة", status: "error" });
      setQuestions((prev) => prev.map((q) =>
        q.id === qid
          ? { ...q, choices: q.choices.map((c) => ({ ...c, is_correct: false })) }
          : q
      ));
      setPendingCorrect((prev) => {
        const copy = { ...prev };
        delete copy[qid];
        return copy;
      });
    }
  };

  // إضافة/تحديث صورة لسؤال — PATCH /api/course/course-exam/question/:questionId/image
  const triggerQuestionImageInput = (q) => {
    setImageUploadQuestionId(q.id);
    questionImageInputRef.current?.click();
  };

  const handleQuestionImageUpload = async (e) => {
    const file = e.target?.files?.[0];
    const qid = imageUploadQuestionId;
    e.target.value = "";
    if (!file || !qid) {
      setImageUploadQuestionId(null);
      return;
    }

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast({ title: "صيغة غير مدعومة", description: "المدعوم: jpeg, jpg, png, gif, webp", status: "warning" });
      return;
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({ title: "الملف كبير", description: "الحد الأقصى 10 ميجابايت", status: "warning" });
      return;
    }

    setImageUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("questionImage", file);
      const res = await baseUrl.patch(
        `/api/course/course-exam/question/${qid}/image`,
        formData,
        authHeaders
      );
      const newImage = res.data?.questionImage ?? res.data?.question?.question_image ?? res.data?.question?.questionImage;
      if (newImage) {
        setQuestions((prev) => prev.map((q) => (q.id === qid ? { ...q, image: newImage } : q)));
      }
      toast({ title: res.data?.message || "تمت إضافة صورة السؤال بنجاح", status: "success" });
    } catch (err) {
      toast({
        title: "فشل رفع الصورة",
        description: err.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
      });
    } finally {
      setImageUploadLoading(false);
      setImageUploadQuestionId(null);
    }
  };

  const persistInProgress = useCallback((overrides = {}) => {
    const id = toPositiveAttemptId(attemptIdRef.current);
    if (!examId || !id || submitResultRef.current) return;
    const existing = readExamProgress(examId, id);
    writeExamProgress(examId, id, {
      answers: overrides.answers ?? studentAnswersRef.current,
      current: overrides.current ?? currentRef.current,
      endsAt: overrides.endsAt ?? examEndsAtRef.current,
      startedAt: overrides.startedAt ?? existing?.startedAt ?? null,
    });
  }, [examId]);

  useEffect(() => {
    if (!examStarted || submitResult || !questions.length) return;
    persistInProgress();
  }, [examStarted, submitResult, studentAnswers, current, examEndsAt, persistInProgress, questions.length]);

  useEffect(() => {
    return () => {
      const id = toPositiveAttemptId(attemptIdRef.current);
      if (!examId || !id || submitResultRef.current) return;
      const existing = readExamProgress(examId, id);
      writeExamProgress(examId, id, {
        answers: studentAnswersRef.current,
        current: currentRef.current,
        endsAt: examEndsAtRef.current,
        startedAt: existing?.startedAt ?? null,
      });
    };
  }, [examId]);

  const handleStudentChoice = (questionId, selectedAnswer) => {
    if (submitResult) return;
    setStudentAnswers((prev) => {
      const next = { ...prev, [questionId]: selectedAnswer };
      persistInProgress({ answers: next });
      return next;
    });
  };

  const goToQuestion = (index) => {
    if (submitResult) return;
    if (index < 0 || index >= questions.length) return;
    setCurrent(index);
    persistInProgress({ current: index });
  };

  // للطالب: تسليم الامتحان — نفس الطريقة في التطبيق المرجعي (نفس الـ endpoint ونفس صيغة الإجابات)
  const handleSubmitExam = useCallback(async (autoSubmit = false, source = "manual") => {
    if (autoSubmit && source !== "timer") return;

    if (!examId) {
      if (!autoSubmit) {
        toast({ title: "خطأ", description: "معرّف الامتحان غير متاح", status: "error" });
      }
      return;
    }
    if (submitLoadingRef.current || submitResultRef.current || submitInFlightRef.current) return;

    const token = localStorage.getItem("token");
    if (!token) {
      if (!autoSubmit) {
        toast({ title: "يجب تسجيل الدخول لتسليم الامتحان", status: "error" });
      }
      return;
    }

    submitInFlightRef.current = true;
    setSubmitLoading(true);
    timerExpiredRef.current = autoSubmit;

    const answersArr = buildExamSubmitAnswers(studentAnswersRef.current);

    try {
      const activeAttemptId = toPositiveAttemptId(await ensureAttemptIdBeforeSubmit());
      if (!activeAttemptId) {
        if (!autoSubmit) {
          toast({
            title: "فشل تسليم الامتحان",
            description: "لا توجد محاولة نشطة. أعد بدء الامتحان ثم حاول مرة أخرى.",
            status: "error",
          });
        }
        return;
      }

      const postSubmit = (id) =>
        baseUrl.post(
          `/api/exams/${examId}/submit`,
          { attemptId: id, attempt_id: id, answers: answersArr },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            params: { attemptId: id, attempt_id: id },
          }
        );

      let res;
      try {
        res = await postSubmit(activeAttemptId);
      } catch (firstErr) {
        const firstMsg = String(firstErr?.response?.data?.message || "");
        const missingAttempt =
          /attemptid is required/i.test(firstMsg) ||
          /attempt_id is required/i.test(firstMsg);

        if (!missingAttempt) throw firstErr;

        const recovered =
          toPositiveAttemptId(extractExamAttemptId(firstErr?.response?.data || {}, examId)) ||
          toPositiveAttemptId(await ensureAttemptIdBeforeSubmit());

        if (!recovered) throw firstErr;
        commitAttemptId(recovered);
        res = await postSubmit(recovered);
      }

      const result = res.data;
      setSubmitResult(result);
      setRemainingSeconds(null);
      setExamEndsAt(null);
      examEndsAtRef.current = null;
      clearExamProgress(examId, activeAttemptId);
      clearPersistedAttemptId(examId);
      commitAttemptId(null, { allowClear: true });

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      if (!autoSubmit) {
        toast({
          title: "تم تسليم الامتحان!",
          description: `الدرجة: ${result.totalGrade}/${result.maxGrade}`,
          status: "success",
        });
      }
    } catch (err) {
      console.error("Error submitting exam:", err);
      const errorMessage = err?.response?.data?.message || "حدث خطأ غير متوقع";
      if (!autoSubmit) {
        toast({ title: "فشل تسليم الامتحان", description: errorMessage, status: "error" });
      }
    } finally {
      setSubmitLoading(false);
      submitInFlightRef.current = false;
    }
  }, [examId, toast, ensureAttemptIdBeforeSubmit, commitAttemptId]);

  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (!examStarted || submitResult || examEndsAt == null) {
      return undefined;
    }

    const tick = () => {
      const ends = examEndsAtRef.current;
      if (ends == null) return;
      const left = remainingFromEndsAt(ends) ?? 0;
      setRemainingSeconds(left);
      if (
        left <= 0 &&
        !timerExpiredRef.current &&
        !submitLoadingRef.current &&
        !submitResultRef.current
      ) {
        timerExpiredRef.current = true;
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        toast({ title: "انتهى الوقت!", description: "يتم تسليم الامتحان تلقائياً.", status: "warning" });
        handleSubmitExam(true, "timer");
      }
    };

    tick();
    timerIntervalRef.current = setInterval(tick, 1000);
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [examStarted, examEndsAt, submitResult, handleSubmitExam, toast]);

  useEffect(() => {
    if (!examStarted || submitResult) return undefined;
    const syncClock = () => {
      const ends = examEndsAtRef.current;
      if (ends == null) return;
      const left = remainingFromEndsAt(ends) ?? 0;
      setRemainingSeconds(left);
      if (
        left <= 0 &&
        !timerExpiredRef.current &&
        !submitLoadingRef.current &&
        !submitResultRef.current
      ) {
        timerExpiredRef.current = true;
        handleSubmitExam(true, "timer");
      }
    };
    document.addEventListener("visibilitychange", syncClock);
    window.addEventListener("focus", syncClock);
    return () => {
      document.removeEventListener("visibilitychange", syncClock);
      window.removeEventListener("focus", syncClock);
    };
  }, [examStarted, submitResult, handleSubmitExam]);

  // للطالب: شاشة البدء أو التحميل قبل بدء المحاولة
  const studentPageBg = useColorModeValue("gray.100", "gray.900");
  const studentCardBg = useColorModeValue("white", "gray.800");
  const studentCardBorder = useColorModeValue("gray.200", "gray.600");
  const studentHeadingColor = useColorModeValue("gray.800", "white");
  const studentSubtextColor = useColorModeValue("gray.600", "gray.300");

  if (!isTeacher && !isAdmin && blockedAttemptResult) {
    return (
      <>
        <ExamAttemptResultScreen
          result={blockedAttemptResult}
          examTitle={examSessionData?.title || examMeta?.examTitle}
          pageBg={studentPageBg}
          onBack={() => navigate(-1)}
          onZoomImage={(src) => {
            setImageModalSrc(src);
            setImageModalOpen(true);
          }}
        />
        <Modal isOpen={imageModalOpen} onClose={() => setImageModalOpen(false)} size="full" isCentered>
          <ModalOverlay bg="blackAlpha.800" />
          <ModalContent bg="transparent" boxShadow="none" maxW="100vw">
            <ModalBody display="flex" alignItems="center" justifyContent="center" p={4}>
              {imageModalSrc && (
                <Image
                  src={imageModalSrc}
                  alt="تكبير"
                  maxH="90vh"
                  maxW="100%"
                  objectFit="contain"
                  borderRadius="md"
                  onClick={() => setImageModalOpen(false)}
                />
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    );
  }

  if (!isTeacher && !isAdmin && (isStudentView || wantAttemptReport) && (!examStarted || requiresStart) && !blockedAttemptResult) {
    if (error) {
      return (
        <Box maxW="2xl" mx="auto" py={10} px={4} className="mt-[80px]">
          <VStack spacing={6}>
            <Alert status="error" borderRadius="md" w="full">
              <AlertIcon />
              {error}
            </Alert>
            <Button leftIcon={<MdArrowBack />} onClick={() => navigate(-1)}>العودة</Button>
          </VStack>
        </Box>
      );
    }

    if (sessionLoading || questionsLoading) {
      return <BrandLoadingScreen />;
    }

    return (
      <ExamReadyScreen
        examData={examSessionData}
        startingAttempt={startLoading}
        onStart={handleStartExam}
        pageBg={studentPageBg}
        cardBg={studentCardBg}
        cardBorder={studentCardBorder}
        headingColor={studentHeadingColor}
        subtextColor={studentSubtextColor}
      />
    );
  }

  if (loading) {
    return <BrandLoadingScreen />;
  }

  if (error && !isStudentView) {
    return (
      <Center minH="60vh">
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      </Center>
    );
  }

  const formatRemainingTime = (value) => {
    if (value == null) return "--:--";
    const s = Math.max(0, value);
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const teacherCardBg = useColorModeValue("white", "gray.800");
  const teacherCardBorder = useColorModeValue("gray.200", "gray.600");
  const teacherHeadingColor = useColorModeValue("blue.700", "blue.200");
  const teacherAccent = useColorModeValue("blue.500", "blue.400");
  const previewBg = useColorModeValue("gray.50", "gray.900");
  const previewBorder = useColorModeValue("gray.200", "gray.700");
  const studentHeaderBg = useColorModeValue("white", "gray.800");
  const pageBg = useColorModeValue("gray.100", "gray.900");

  return (
    <Box
      maxW={isTeacher || isAdmin ? "6xl" : "3xl"}
      mx="auto"
      py={{ base: 6, md: 10 }}
      px={{ base: 3, sm: 4, md: 6 }}
      className="mt-[80px]"
      bg={isStudentView ? pageBg : undefined}
      minH={isStudentView ? "100vh" : undefined}
    >
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.05); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>
      {/* هيدر الطالب: زر رجوع + عنوان + مؤقت (مثل التطبيق المرجعي) */}
      {isStudentView && (
        <Box
          position="sticky"
          top="80px"
          zIndex={20}
          mb={5}
          p={{ base: 3, md: 4 }}
          borderRadius="2xl"
          borderWidth="1px"
          borderColor={teacherCardBorder}
          bg={studentHeaderBg}
          boxShadow="md"
        >
          <HStack spacing={3} align="center">
            <IconButton
              aria-label="العودة"
              icon={<MdArrowBack />}
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              isDisabled={submitLoading}
            />
            <VStack align="stretch" flex={1} spacing={0}>
              <Text fontWeight="bold" fontSize={{ base: "md", md: "lg" }} noOfLines={1}>
                {examMeta?.examTitle || examSessionData?.title || "امتحان المحاضرة"}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {questions.length} سؤال
              </Text>
            </VStack>
            {remainingSeconds !== null && (
              <Badge
                px={3}
                py={2}
                borderRadius="xl"
                fontSize="sm"
                fontFamily="mono"
                colorScheme={remainingSeconds < 300 ? "red" : "blue"}
              >
                {formatRemainingTime(remainingSeconds)}
              </Badge>
            )}
          </HStack>
        </Box>
      )}
      {/* هيدر المدرس: عنوان + إحصائيات + زر التبديل */}
      {!isStudentView && (isTeacher || isAdmin) && (
        <Box
          data-tour-id="platform-exam-hero"
          mb={{ base: 6, md: 8 }}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={teacherCardBorder}
          bg={teacherCardBg}
          shadow="sm"
          overflow="hidden"
        >
          <Box h="3px" bg={teacherAccent} />
          <Flex
            direction={{ base: "column", sm: "row" }}
            align={{ base: "stretch", sm: "center" }}
            justify="space-between"
            gap={4}
            p={{ base: 4, md: 5 }}
          >
            <VStack align={{ base: "center", sm: "flex-start" }} spacing={1}>
              <Heading size={{ base: "md", md: "lg" }} color={teacherHeadingColor} display="flex" alignItems="center" gap={2}>
                <FaBookOpen />
                أسئلة الامتحان الشامل
              </Heading>
              <Text fontSize="sm" color="gray.500">
                {questions.length} سؤال — يدعم LaTeX والكسور والرموز الكيميائية
              </Text>
            </VStack>
            {(isTeacher || isAdmin) && (
              <HStack spacing={2} flexWrap="wrap" justify={{ base: "center", sm: "flex-end" }}>
                <Button
                  data-tour-id="platform-exam-tour-btn"
                  variant="outline"
                  colorScheme="orange"
                  size={{ base: "sm", md: "md" }}
                  leftIcon={<FaCompass />}
                  onClick={() => {
                    setShowGrades(false);
                    setExamTourOpen(true);
                  }}
                  borderRadius="xl"
                  fontWeight="600"
                >
                  جولة الإدارة
                </Button>
                <Button
                  data-tour-id="platform-exam-ai"
                  variant="outline"
                  borderColor="purple.400"
                  color="purple.600"
                  size={{ base: "sm", md: "md" }}
                  leftIcon={<AiOutlineRobot />}
                  onClick={() => setAiExtractionModalOpen(true)}
                  borderRadius="xl"
                  fontWeight="600"
                  _hover={{ bg: "purple.50" }}
                >
                  استخراج بالذكاء الاصطناعي
                </Button>
                <Button
                  data-tour-id="platform-exam-grades"
                  colorScheme={showGrades ? "gray" : "blue"}
                  size={{ base: "sm", md: "md" }}
                  leftIcon={<FaUser />}
                  onClick={() => {
                    if (!showGrades && gradesData.length === 0) fetchGrades();
                    setShowGrades((prev) => !prev);
                  }}
                  borderRadius="xl"
                  fontWeight="600"
                >
                  {showGrades ? "عرض الأسئلة" : "عرض درجات الطلاب"}
                </Button>
                <Button
                  data-tour-id="platform-exam-report"
                  variant="outline"
                  colorScheme="blue"
                  size={{ base: "sm", md: "md" }}
                  leftIcon={<FaChartBar />}
                  onClick={() => navigate(`/exam/${examId}/report`)}
                  borderRadius="xl"
                  fontWeight="600"
                >
                  تقرير الأسئلة
                </Button>
              </HStack>
            )}
          </Flex>
        </Box>
      )}
      {/* عرض درجات الطلاب للمدرس — يتوافق مع الـ API: submission_id, obtained_grade, total_grade, attempt_number */}
      {showGrades && isTeacher ? (
        <Box w="full" maxW="4xl" mx="auto" px={{ base: 2, sm: 4 }}>
          <Flex
            direction={{ base: "column", sm: "row" }}
            align={{ base: "stretch", sm: "center" }}
            justify="space-between"
            gap={3}
            mb={{ base: 4, md: 6 }}
          >
            <Heading textAlign={{ base: "center", sm: "start" }} color="blue.600" fontSize={{ base: "xl", sm: "2xl", md: "3xl" }}>
              درجات الطلاب في الامتحان
            </Heading>
            <HStack spacing={2} flexWrap="wrap" justify={{ base: "center", sm: "flex-end" }}>
              {gradesData.length > 0 && (
                <>
                  <Button
                    colorScheme="green"
                    variant="outline"
                    size={{ base: "sm", md: "md" }}
                    leftIcon={<FiDownload />}
                    onClick={handleExportGrades}
                    borderRadius="xl"
                    fontWeight="600"
                  >
                    تصدير Excel
                  </Button>
                  <Button
                    colorScheme="red"
                    variant="outline"
                    size={{ base: "sm", md: "md" }}
                    leftIcon={<FaFilePdf />}
                    onClick={handleExportGradesPdf}
                    isLoading={isExportingGradesPdf}
                    loadingText="جاري التصدير..."
                    borderRadius="xl"
                    fontWeight="600"
                  >
                    تصدير PDF
                  </Button>
                </>
              )}
              <Button
                colorScheme="blue"
                size={{ base: "sm", md: "md" }}
                leftIcon={<FaChartBar />}
                onClick={() => navigate(`/exam/${examId}/report`)}
                borderRadius="xl"
                fontWeight="600"
              >
                تقرير الأسئلة
              </Button>
            </HStack>
          </Flex>
          <Box w="full" maxW={{ base: "100%", sm: "400px" }} mx="auto" mb={{ base: 4, md: 6 }}>
            <InputGroup size="lg">
              <Input
                placeholder="ابحث بالاسم، رقم الطالب، رقم التسليم أو المحاولة..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                borderRadius="full"
                bg="gray.50"
                borderColor="gray.200"
                _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
                fontSize={{ base: "sm", md: "md" }}
              />
              <InputRightElement pointerEvents="none" height="100%">
                <BiSearch color="gray.400" boxSize={5} />
              </InputRightElement>
            </InputGroup>
          </Box>
          {gradesLoading ? (
            <Center py={12}>
              <Spinner size="xl" color="blue.500" thickness="4px" />
            </Center>
          ) : gradesData.length === 0 ? (
            <Center py={12}>
              <Text fontSize="lg" color="gray.600" fontWeight="medium">
                لا توجد درجات بعد
              </Text>
            </Center>
          ) : (
            <VStack spacing={{ base: 4, md: 5 }} align="stretch">
              {filteredGrades.length === 0 ? (
                <Center py={8}>
                  <Text color="gray.500" fontSize="md">لا توجد نتائج مطابقة للبحث</Text>
                </Center>
              ) : (
                <>
                  {filteredGrades.length > GRADES_PAGE_SIZE && (
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      عرض {gradesPageRangeStart}–{gradesPageRangeEnd} من {filteredGrades.length} طالب
                    </Text>
                  )}
                  {paginatedGrades.map((submission, idx) => (
                    <SubmissionCard
                      key={submission.submission_id ?? `${gradesCurrentPage}-${idx}`}
                      submission={submission}
                      index={(gradesCurrentPage - 1) * GRADES_PAGE_SIZE + idx}
                    />
                  ))}
                  <PaginationBar
                    page={gradesCurrentPage}
                    totalPages={gradesTotalPages}
                    onPrev={() => setGradesCurrentPage((page) => Math.max(1, page - 1))}
                    onNext={() => setGradesCurrentPage((page) => Math.min(gradesTotalPages, page + 1))}
                  />
                </>
              )}
            </VStack>
          )}
        </Box>
      ) : (
        <>
          {/* للطالب: عرض سؤال واحد مع pagination */}
          {!isTeacher && !isAdmin && student ? (
            <>
              {/* عرض النتيجة إذا تم التسليم (بنفس تصميم التطبيق المرجعي) */}
              {submitResult ? (
                <ExamAttemptResultScreen
                  result={normalizeExamAttemptResult(submitResult)}
                  examTitle={examMeta?.examTitle || examSessionData?.title}
                  pageBg={pageBg}
                  onBack={() => navigate(-1)}
                  onZoomImage={(src) => {
                    setImageModalSrc(src);
                    setImageModalOpen(true);
                  }}
                />
              ) : questions.length === 0 ? (
                <Center py={16}>
                  <VStack spacing={4} px={4}>
                    {questionsLoading ? (
                      <>
                        <Spinner size="lg" color="blue.500" />
                        <Text color="gray.500">جاري تحميل الأسئلة...</Text>
                      </>
                    ) : (
                      <>
                        <Alert status="error" borderRadius="xl" w="full">
                          <AlertIcon />
                          <Text fontSize="sm">
                            {questionsLoadError || error || "لم يتم تحميل أسئلة الامتحان."}
                          </Text>
                        </Alert>
                        <Button
                          colorScheme="blue"
                          onClick={handleStartExam}
                          isLoading={startLoading || questionsLoading}
                          borderRadius="lg"
                        >
                          إعادة تحميل الأسئلة
                        </Button>
                      </>
                    )}
                  </VStack>
                </Center>
              ) : (
                <>
                  <ExamStudentProgress
                    remainingSeconds={remainingSeconds}
                    answeredCount={Object.keys(studentAnswers).length}
                    totalQuestions={questions.length}
                    questions={questions}
                    currentQuestionIndex={current}
                    studentAnswers={studentAnswers}
                    showPagination
                    hasActiveAttempt={examStarted}
                    onGoToQuestion={goToQuestion}
                  />

                  <Box mb={5}>
                    <LectureExamStudentQuestionCard
                      key={questions[current].id}
                      question={questions[current]}
                      questionIndex={current}
                      totalQuestions={questions.length}
                      selectedLetter={studentAnswers[questions[current].id]}
                      onSelectLetter={handleStudentChoice}
                      onZoomImage={(src) => { setImageModalSrc(src); setImageModalOpen(true); }}
                    />
                  </Box>

                  <HStack spacing={3} w="full" flexWrap="wrap">
                    <Button
                      flex={1}
                      minW="100px"
                      size="lg"
                      variant="outline"
                      borderColor="gray.300"
                      leftIcon={<FaChevronRight />}
                      onClick={() => goToQuestion(current - 1)}
                      isDisabled={current === 0 || submitLoading}
                      borderRadius="xl"
                    >
                      السابق
                    </Button>
                    {Object.keys(studentAnswers).length === questions.length ? (
                      <Button
                        flex={1}
                        minW="140px"
                        size="lg"
                        colorScheme="green"
                        leftIcon={<FaCheckCircle />}
                        isLoading={submitLoading}
                        onClick={() => handleSubmitExam(false)}
                        borderRadius="xl"
                      >
                        تسليم الامتحان
                      </Button>
                    ) : (
                      <Box flex={1} minW="140px" />
                    )}
                    <Button
                      flex={1}
                      minW="100px"
                      size="lg"
                      variant="outline"
                      borderColor="gray.300"
                      rightIcon={<FaChevronLeft />}
                      onClick={() => goToQuestion(current + 1)}
                      isDisabled={current === questions.length - 1 || submitLoading}
                      borderRadius="xl"
                    >
                      {current === questions.length - 1 ? "آخر سؤال" : "التالي"}
                    </Button>
                  </HStack>
                </>
              )}
            </>
          ) : (
            // للمدرس: عرض جميع الأسئلة
            <>
              <Input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                ref={questionImageInputRef}
                onChange={handleQuestionImageUpload}
                hidden
                id="question-image-upload"
              />
              {questions.length === 0 ? (
                <Center py={16} px={4} data-tour-id="platform-exam-empty">
                  <VStack spacing={4}>
                    <Box p={4} borderRadius="full" bg="blue.50" color="blue.500">
                      <FaBookOpen size={48} />
                    </Box>
                    <Text fontSize="lg" fontWeight="600" color="gray.600">
                      لا توجد أسئلة بعد
                    </Text>
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      أضف أسئلة من صفحة تفاصيل الكورس (تبويب الامتحانات)
                    </Text>
                  </VStack>
                </Center>
              ) : (
                <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4} w="full">
                  {questions.map((q, idx) => (
                    <PlatformExamTeacherCard
                      key={q.id}
                      question={q}
                      index={idx}
                      pendingCorrect={pendingCorrect}
                      onSetCorrect={handleSetCorrect}
                      isTourTarget={idx === 0}
                      onZoomImage={(src) => { setImageModalSrc(src); setImageModalOpen(true); }}
                      actions={
                        <HStack spacing={0}>
                          <Tooltip label="إضافة أو تحديث صورة السؤال" placement="top" hasArrow>
                            <IconButton
                              data-tour-id={idx === 0 ? "exam-question-add-image" : undefined}
                              icon={<FaImage />}
                              colorScheme="blue"
                              variant="ghost"
                              size="xs"
                              aria-label="صورة السؤال"
                              onClick={() => triggerQuestionImageInput(q)}
                              isLoading={imageUploadLoading && imageUploadQuestionId === q.id}
                            />
                          </Tooltip>
                          <IconButton
                            data-tour-id={idx === 0 ? "exam-question-edit" : undefined}
                            icon={<AiFillEdit />}
                            colorScheme="yellow"
                            variant="ghost"
                            size="xs"
                            aria-label="تعديل"
                            onClick={() => openEditModal(q)}
                          />
                          <IconButton
                            data-tour-id={idx === 0 ? "exam-question-delete" : undefined}
                            icon={<AiFillDelete />}
                            colorScheme="red"
                            variant="ghost"
                            size="xs"
                            aria-label="حذف"
                            onClick={() => setDeleteModal({ open: true, qid: q.id })}
                          />
                        </HStack>
                      }
                    />
                  ))}
                </SimpleGrid>
              )}
            </>
          )}
        </>
      )}

      {/* Edit Modal */}
      <Modal isOpen={editModal.open} onClose={() => setEditModal({ open: false, question: null })} size="xl" isCentered scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent borderRadius="2xl" mx={4} dir="rtl" data-tour-id="exam-edit-modal">
          <ModalHeader color={teacherHeadingColor} borderBottomWidth="1px" pb={4}>تعديل السؤال</ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <VStack spacing={5} align="stretch">
              <Box>
                <Text mb={2} fontWeight="600" fontSize="sm" color="gray.600">نص السؤال</Text>
                <Textarea
                  value={editForm.text}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, text: e.target.value }))}
                  placeholder="نص السؤال — يدعم $x^2$ و \\frac{1}{2} و H₂O و 3.14"
                  borderRadius="lg"
                  minH="100px"
                  fontSize="md"
                  lineHeight="1.75"
                />
                {editForm.text?.trim() && (
                  <Box mt={3} p={3} borderRadius="lg" bg={previewBg} borderWidth="1px" borderColor={previewBorder}>
                    <Text fontSize="xs" color="gray.500" mb={2}>معاينة</Text>
                    <FormattedQuestionText value={editForm.text} fontSize="md" lineHeight="1.85" />
                  </Box>
                )}
              </Box>
              <Box>
                <Text mb={2} fontWeight="600" fontSize="sm" color="gray.600">الاختيارات</Text>
                <VStack spacing={3}>
                  {editForm.choices.map((choice, idx) => (
                    <Box key={choice.id} w="full">
                      <Text fontSize="xs" color="gray.500" mb={1}>
                        {String.fromCharCode(65 + idx)}
                      </Text>
                      <Textarea
                        value={choice.text}
                        onChange={(e) => setEditForm((prev) => {
                          const choices = [...prev.choices];
                          choices[idx].text = e.target.value;
                          return { ...prev, choices };
                        })}
                        placeholder={`اختيار ${String.fromCharCode(65 + idx)} — يدعم الرموز الرياضية والكيميائية`}
                        borderRadius="lg"
                        minH="60px"
                        fontSize="sm"
                      />
                      {choice.text?.trim() && (
                        <Box mt={2} p={2} borderRadius="md" bg={previewBg} borderWidth="1px" borderColor={previewBorder}>
                          <FormattedQuestionText value={choice.text} fontSize="sm" lineHeight="1.75" />
                        </Box>
                      )}
                    </Box>
                  ))}
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" pt={4} gap={2}>
            <Button colorScheme="blue" onClick={handleEditSave} borderRadius="lg">
              حفظ التعديل
            </Button>
            <Button variant="ghost" onClick={() => setEditModal({ open: false, question: null })}>
              إلغاء
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, qid: null })} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="2xl" mx={4} data-tour-id="exam-delete-modal">
          <ModalHeader color="red.600" borderBottomWidth="1px" pb={4}>تأكيد الحذف</ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <Text color="gray.600">
              هل أنت متأكد أنك تريد حذف هذا السؤال؟ لا يمكن التراجع عن هذه العملية.
            </Text>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" pt={4} gap={2}>
            <Button colorScheme="red" onClick={handleDelete} isLoading={deleting} borderRadius="lg">
              تأكيد الحذف
            </Button>
            <Button variant="ghost" onClick={() => setDeleteModal({ open: false, qid: null })}>
              إلغاء
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* مودال تكبير صورة السؤال */}
      <Modal isOpen={imageModalOpen} onClose={() => setImageModalOpen(false)} size="full" isCentered>
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="transparent" boxShadow="none" maxW="100vw">
          <ModalBody display="flex" alignItems="center" justifyContent="center" p={4}>
            <IconButton
              aria-label="إغلاق"
              icon={<AiOutlineCloseCircle size={28} />}
              position="absolute"
              top={4}
              right={4}
              zIndex={10}
              colorScheme="whiteAlpha"
              color="white"
              onClick={() => setImageModalOpen(false)}
            />
            {imageModalSrc && (
              <Image
                src={imageModalSrc}
                alt="تكبير"
                maxH="90vh"
                maxW="100%"
                objectFit="contain"
                borderRadius="md"
                onClick={() => setImageModalOpen(false)}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {(isTeacher || isAdmin) && (
        <AiQuestionExtractionModal
          isOpen={aiExtractionModalOpen}
          onClose={() => setAiExtractionModalOpen(false)}
          examId={examId}
          examTitle={examMeta?.examTitle}
          examKind="course"
          onImported={fetchQuestions}
        />
      )}

      {(isTeacher || isAdmin) && (
        <TeacherExamTour
          isOpen={examTourOpen}
          hasQuestions={questions.length > 0}
          variant="platform"
          onClose={() => setExamTourOpen(false)}
        />
      )}

    </Box>
  );
};

export default Exam;