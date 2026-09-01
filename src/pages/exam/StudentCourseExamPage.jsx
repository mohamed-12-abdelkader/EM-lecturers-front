import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Center,
  HStack,
  IconButton,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Spinner,
  Text,
  Tooltip,
  VStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { FaCheckCircle, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { MdArrowBack } from "react-icons/md";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import {
  startCourseExamAttempt,
  submitCourseExamAttempt,
  translateCourseExamStudentError,
} from "../../api/courseExamsApi";
import ExamAttemptResultScreen from "./components/ExamAttemptResultScreen";
import ExamStudentProgress from "./components/ExamStudentProgress";
import LectureExamStudentQuestionCard from "./components/LectureExamStudentQuestionCard";
import {
  buildExamSubmitAnswers,
  extractExamAttemptId,
  normalizeExamQuestionsFromApi,
  toPositiveAttemptId,
} from "../../utils/examFlowUtils";
import {
  clearExamProgress,
  clearPersistedAttemptId,
  countAnsweredQuestions,
  persistAttemptId,
  readExamProgress,
  readPersistedAttemptId,
  writeExamProgress,
} from "../../utils/examAttemptProgress";
import { normalizeExamAttemptResult } from "../../utils/examAttemptResultUtils";

function remainingFromEndsAt(endsAt) {
  const ms = Number(endsAt);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return Math.max(0, Math.ceil((ms - Date.now()) / 1000));
}

function resolveEndsAt({ startedAt, durationMinutes, localEndsAt, forceFreshCountdown }) {
  const durationMs =
    Number(durationMinutes) > 0 ? Number(durationMinutes) * 60 * 1000 : null;
  if (!durationMs) return null;

  const now = Date.now();
  const localMs = Number(localEndsAt);
  const hasLocal = Number.isFinite(localMs) && localMs > 1e12;
  const localInFuture = hasLocal && localMs > now + 1000;

  if (localInFuture) return localMs;
  // بدء / استكمال من الكارت: عدّاد جديد. startedAt القديم من السيرفر لا يسلّم فوراً.
  if (forceFreshCountdown) return now + durationMs;
  // تحديث الصفحة بعد انتهاء جلسة محلية: سلّم. غير كده ابدأ المدة من الآن.
  if (hasLocal) return localMs;

  const startMs = startedAt ? new Date(startedAt).getTime() : NaN;
  if (Number.isFinite(startMs)) {
    const fromStart = startMs + durationMs;
    const remainingMs = fromStart - now;
    if (remainingMs > 1000 && remainingMs <= durationMs + 5000) {
      return fromStart;
    }
  }

  return now + durationMs;
}

function formatRemainingTime(value) {
  if (value == null) return "--:--";
  const s = Math.max(0, value);
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function StudentCourseExamPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [attemptId, setAttemptId] = useState(null);
  const [examMeta, setExamMeta] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [examEndsAt, setExamEndsAt] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalSrc, setImageModalSrc] = useState(null);

  const questionBlockRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const timerExpiredRef = useRef(false);
  const submitInFlightRef = useRef(false);
  const studentAnswersRef = useRef({});
  const currentRef = useRef(0);
  const attemptIdRef = useRef(null);
  const examEndsAtRef = useRef(null);
  const questionsRef = useRef([]);
  const sessionAppliedAtRef = useRef(0);
  const allowTimerSubmitRef = useRef(false);

  const pageBg = useColorModeValue("gray.100", "gray.900");
  const headerBg = useColorModeValue("white", "gray.800");
  const headerBorder = useColorModeValue("gray.200", "gray.600");

  const persistProgress = useCallback((overrides = {}) => {
    const id = toPositiveAttemptId(attemptIdRef.current);
    if (!examId || !id || submitResult) return;
    writeExamProgress(examId, id, {
      answers: overrides.answers ?? studentAnswersRef.current,
      current: overrides.current ?? currentRef.current,
      endsAt: overrides.endsAt ?? examEndsAtRef.current,
      startedAt: overrides.startedAt ?? examMeta?.startedAt ?? null,
    });
  }, [examId, examMeta?.startedAt, submitResult]);

  const applySession = useCallback((session = {}, { fromStartButton = false } = {}) => {
    const resolvedAttemptId =
      extractExamAttemptId(session, examId) || toPositiveAttemptId(session.attemptId);
    const normalizedQuestions = normalizeExamQuestionsFromApi(session.questions || []);
    if (!resolvedAttemptId || !normalizedQuestions.length) {
      throw new Error("لم يتم تحميل أسئلة الامتحان");
    }

    persistAttemptId(examId, resolvedAttemptId);
    const localProgress = readExamProgress(examId, resolvedAttemptId);
    const startedAt = session.startedAt || session.started_at || localProgress?.startedAt || null;
    const durationMinutes = session.durationMinutes ?? session.duration_minutes ?? null;
    const durationMs =
      Number(durationMinutes) > 0 ? Number(durationMinutes) * 60 * 1000 : null;
    const restoredAnswers = localProgress?.answers && typeof localProgress.answers === "object"
      ? localProgress.answers
      : {};
    const localEndsAtMs = Number(localProgress?.endsAt);
    const expiredLocalSitting =
      !fromStartButton &&
      Number.isFinite(localEndsAtMs) &&
      localEndsAtMs > 1e12 &&
      localEndsAtMs <= Date.now() + 1000;
    let endsAt = resolveEndsAt({
      startedAt,
      durationMinutes,
      localEndsAt: localProgress?.endsAt,
      forceFreshCountdown: fromStartButton,
    });
    let remaining = remainingFromEndsAt(endsAt);
    if (!expiredLocalSitting && durationMs && (remaining == null || remaining <= 1)) {
      endsAt = Date.now() + durationMs;
      remaining = Math.ceil(durationMs / 1000);
    }
    let resumeIndex = Number(localProgress?.current);
    if (!Number.isInteger(resumeIndex) || resumeIndex < 0 || resumeIndex >= normalizedQuestions.length) {
      const firstOpen = normalizedQuestions.findIndex((q) => {
        const ans = restoredAnswers[q.id] ?? restoredAnswers[String(q.id)];
        return ans == null || ans === "";
      });
      resumeIndex = firstOpen >= 0 ? firstOpen : 0;
    }

    attemptIdRef.current = resolvedAttemptId;
    studentAnswersRef.current = restoredAnswers;
    currentRef.current = resumeIndex;
    examEndsAtRef.current = endsAt;
    questionsRef.current = normalizedQuestions;
    timerExpiredRef.current = false;
    allowTimerSubmitRef.current = remaining > 1 || expiredLocalSitting;
    sessionAppliedAtRef.current = Date.now();

    setAttemptId(resolvedAttemptId);
    setQuestions(normalizedQuestions);
    setStudentAnswers(restoredAnswers);
    setCurrent(resumeIndex);
    setExamEndsAt(endsAt);
    setRemainingSeconds(remaining);
    setExamMeta({
      examTitle: session.examTitle || session.exam_title || "",
      durationMinutes,
      questionsCount: session.questionsCount || normalizedQuestions.length,
      startedAt,
      courseId: session.courseId || session.course_id || null,
    });
    writeExamProgress(examId, resolvedAttemptId, {
      answers: restoredAnswers,
      current: resumeIndex,
      endsAt,
      startedAt,
    });
  }, [examId]);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("يجب تسجيل الدخول كطالب لبدء الامتحان.");
        setLoading(false);
        return;
      }

      try {
        const fromNav = location.state?.session;
        const fromCoursePage = Boolean(fromNav?.questions?.length);
        if (fromCoursePage) {
          if (cancelled) return;
          applySession(
            {
              ...fromNav,
              courseId: location.state?.courseId || fromNav.courseId || fromNav.course_id,
            },
            { fromStartButton: true },
          );
        } else if (readPersistedAttemptId(examId)) {
          const session = await startCourseExamAttempt(examId, token);
          if (cancelled) return;
          applySession(session, { fromStartButton: false });
        } else {
          setError(
            "ابدأ الامتحان من صفحة الكورس. لا يمكن بدء محاولة جديدة من هنا.",
          );
        }
      } catch (err) {
        if (cancelled) return;
        const previous = err?.response?.data?.previousAttempt;
        if (previous) {
          setSubmitResult(previous);
          setError(null);
        } else {
          setError(translateCourseExamStudentError(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    boot();
    return () => {
      cancelled = true;
    };
  }, [examId, applySession, location.state]);

  useEffect(() => {
    studentAnswersRef.current = studentAnswers;
  }, [studentAnswers]);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  useEffect(() => {
    examEndsAtRef.current = examEndsAt;
  }, [examEndsAt]);

  useEffect(() => {
    if (submitResult || !questions.length) return;
    persistProgress();
  }, [studentAnswers, current, examEndsAt, persistProgress, questions.length, submitResult]);

  useEffect(() => {
    if (submitResult || !questions.length) return undefined;
    questionBlockRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    return undefined;
  }, [current, questions.length, submitResult]);

  const handleSubmitExam = useCallback(async (autoSubmit = false) => {
    if (submitInFlightRef.current || submitResult) return;

    const activeQuestions = questionsRef.current || [];
    const answers = studentAnswersRef.current || {};
    if (!autoSubmit) {
      const answered = countAnsweredQuestions(activeQuestions, answers);
      if (!activeQuestions.length || answered < activeQuestions.length) {
        toast({
          title: "لا يمكن التسليم بعد",
          description: `يجب الإجابة على كل الأسئلة أولاً (${answered}/${activeQuestions.length}).`,
          status: "warning",
        });
        return;
      }
    }

    const token = localStorage.getItem("token");
    const id = toPositiveAttemptId(attemptIdRef.current);
    if (!token || !id) {
      toast({
        title: "تعذر تسليم الامتحان",
        description: "لا توجد محاولة نشطة.",
        status: "error",
      });
      return;
    }

    submitInFlightRef.current = true;
    setSubmitLoading(true);
    try {
      const result = await submitCourseExamAttempt(examId, token, {
        attemptId: id,
        answers: buildExamSubmitAnswers(answers),
      });
      setSubmitResult(result);
      setExamEndsAt(null);
      examEndsAtRef.current = null;
      clearExamProgress(examId, id);
      clearPersistedAttemptId(examId);
      if (!autoSubmit) {
        toast({
          title: "تم تسليم الامتحان",
          description: `الدرجة: ${result.totalGrade}/${result.maxGrade}`,
          status: "success",
        });
      }
    } catch (err) {
      toast({
        title: "فشل تسليم الامتحان",
        description: translateCourseExamStudentError(err, "حدث خطأ غير متوقع"),
        status: "error",
      });
    } finally {
      setSubmitLoading(false);
      submitInFlightRef.current = false;
    }
  }, [examId, submitResult, toast]);

  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (submitResult || examEndsAt == null) return undefined;

    const tick = () => {
      const left = remainingFromEndsAt(examEndsAtRef.current) ?? 0;
      setRemainingSeconds(left);
      if (left > 0 || timerExpiredRef.current || submitInFlightRef.current) return;
      if (!allowTimerSubmitRef.current) return;
      const appliedAgo = Date.now() - (sessionAppliedAtRef.current || 0);
      if (appliedAgo < 2000) return;
      timerExpiredRef.current = true;
      toast({ title: "انتهى الوقت!", description: "يتم تسليم الامتحان تلقائياً.", status: "warning" });
      handleSubmitExam(true);
    };

    tick();
    timerIntervalRef.current = setInterval(tick, 1000);
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [examEndsAt, submitResult, handleSubmitExam, toast]);

  const goToQuestion = (index) => {
    if (submitResult || index < 0 || index >= questions.length) return;
    setCurrent(index);
    persistProgress({ current: index });
  };

  const handleStudentChoice = (questionId, selectedAnswer) => {
    if (submitResult) return;
    setStudentAnswers((prev) => {
      const next = { ...prev, [questionId]: selectedAnswer };
      persistProgress({ answers: next });
      return next;
    });
  };

  const goToCourseExams = () => {
    const courseId = examMeta?.courseId || location.state?.courseId;
    if (courseId) {
      navigate(`/CourseDetailsPage/${courseId}?section=exams`);
      return;
    }
    navigate(-1);
  };

  if (loading) return <BrandLoadingScreen />;

  if (submitResult) {
    return (
      <ExamAttemptResultScreen
        result={normalizeExamAttemptResult(submitResult)}
        examTitle={examMeta?.examTitle}
        pageBg={pageBg}
        onBack={goToCourseExams}
        onZoomImage={(src) => {
          setImageModalSrc(src);
          setImageModalOpen(true);
        }}
      />
    );
  }

  if (error) {
    return (
      <Box maxW="2xl" mx="auto" py={10} px={4} className="mt-[80px]">
        <VStack spacing={6}>
          <Alert status="info" borderRadius="md" w="full">
            <AlertIcon />
            {error}
          </Alert>
          <Button leftIcon={<MdArrowBack />} onClick={goToCourseExams}>
            العودة لصفحة الكورس
          </Button>
        </VStack>
      </Box>
    );
  }

  const answeredCount = countAnsweredQuestions(questions, studentAnswers);
  const allAnswered = questions.length > 0 && answeredCount === questions.length;
  const currentQuestion = questions[current];

  return (
    <Box maxW="3xl" mx="auto" py={{ base: 6, md: 10 }} px={{ base: 3, sm: 4 }} className="mt-[80px]" bg={pageBg} minH="100vh">
      <Box
        position="sticky"
        top="80px"
        zIndex={20}
        mb={5}
        p={{ base: 3, md: 4 }}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor={headerBorder}
        bg={headerBg}
        boxShadow="md"
      >
        <HStack spacing={3} align="center">
          <IconButton
            aria-label="العودة"
            icon={<MdArrowBack />}
            variant="ghost"
            size="sm"
            onClick={goToCourseExams}
            isDisabled={submitLoading}
          />
          <VStack align="stretch" flex={1} spacing={0}>
            <Text fontWeight="bold" fontSize={{ base: "md", md: "lg" }} noOfLines={1}>
              {examMeta?.examTitle || "امتحان شامل"}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {questions.length} سؤال
            </Text>
          </VStack>
          {remainingSeconds != null && (
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

      {currentQuestion ? (
        <>
          <ExamStudentProgress
            remainingSeconds={remainingSeconds}
            answeredCount={answeredCount}
            totalQuestions={questions.length}
            questions={questions}
            currentQuestionIndex={current}
            studentAnswers={studentAnswers}
            showPagination
            hasActiveAttempt
            onGoToQuestion={goToQuestion}
          />

          <Box ref={questionBlockRef} mb={5} sx={{ scrollMarginTop: "168px" }}>
            <LectureExamStudentQuestionCard
              key={currentQuestion.id}
              question={currentQuestion}
              questionIndex={current}
              totalQuestions={questions.length}
              selectedLetter={studentAnswers[currentQuestion.id]}
              onSelectLetter={handleStudentChoice}
              onZoomImage={(src) => {
                setImageModalSrc(src);
                setImageModalOpen(true);
              }}
            />
          </Box>

          <HStack spacing={3} w="full" flexWrap="wrap">
            <Button
              flex={1}
              minW="100px"
              size="lg"
              variant="outline"
              leftIcon={<FaChevronRight />}
              onClick={() => goToQuestion(current - 1)}
              isDisabled={current === 0 || submitLoading}
              borderRadius="xl"
            >
              السابق
            </Button>
            {allAnswered ? (
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
              <Tooltip
                label={`يجب الإجابة على كل الأسئلة قبل التسليم (${answeredCount}/${questions.length})`}
                hasArrow
              >
                <Box flex={1} minW="140px">
                  <Button w="full" size="lg" colorScheme="green" variant="outline" leftIcon={<FaCheckCircle />} isDisabled borderRadius="xl">
                    تسليم الامتحان
                  </Button>
                </Box>
              </Tooltip>
            )}
            <Button
              flex={1}
              minW="100px"
              size="lg"
              variant="outline"
              rightIcon={<FaChevronLeft />}
              onClick={() => goToQuestion(current + 1)}
              isDisabled={current === questions.length - 1 || submitLoading}
              borderRadius="xl"
            >
              {current === questions.length - 1 ? "آخر سؤال" : "التالي"}
            </Button>
          </HStack>
        </>
      ) : (
        <Center py={16}>
          <Spinner />
        </Center>
      )}

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
                onClick={() => setImageModalOpen(false)}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
