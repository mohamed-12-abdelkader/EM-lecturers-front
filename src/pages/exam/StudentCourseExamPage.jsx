import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  IconButton,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { MdArrowBack } from "react-icons/md";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import {
  startCourseExamAttempt,
  submitCourseExamAttempt,
  autosaveCourseExamAnswers,
  translateCourseExamStudentError,
} from "../../api/courseExamsApi";
import ExamAttemptResultScreen from "./components/ExamAttemptResultScreen";
import ExamStudentProgress from "./components/ExamStudentProgress";
import ExamTakingActionBar from "./components/ExamTakingActionBar";
import LectureExamStudentQuestionCard from "./components/LectureExamStudentQuestionCard";
import {
  buildExamSubmitAnswers,
  extractExamAttemptId,
  isCourseExamFinishedPayload,
  isCourseExamTakingSession,
  normalizeExamQuestionsFromApi,
  remainingFromEndsAt,
  resolveCourseExamServerTimer,
  savedCourseExamAnswersToMap,
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

  const applySession = useCallback((session = {}) => {
    if (isCourseExamFinishedPayload(session)) {
      setSubmitResult(session);
      return { remaining: 0, finished: true };
    }
    if (!isCourseExamTakingSession(session)) {
      throw new Error("لم يتم تحميل أسئلة الامتحان");
    }

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
    const durationUnlimited = Boolean(
      session.durationUnlimited ??
        session.duration_unlimited ??
        (durationMinutes == null || Number(durationMinutes) <= 0),
    );
    const isNewAttempt = session.resumed === false;
    const serverAnswers = savedCourseExamAnswersToMap(
      session.savedAnswers || session.saved_answers,
    );
    const localAnswers =
      !isNewAttempt && localProgress?.answers && typeof localProgress.answers === "object"
        ? localProgress.answers
        : {};
    const restoredAnswers = { ...serverAnswers, ...localAnswers };
    const { endsAt, remaining } = resolveCourseExamServerTimer(session, {
      isNewAttempt,
      durationMinutes,
      durationUnlimited,
    });

    let resumeIndex = Number(localProgress?.current);
    if (
      isNewAttempt ||
      !Number.isInteger(resumeIndex) ||
      resumeIndex < 0 ||
      resumeIndex >= normalizedQuestions.length
    ) {
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
    submitInFlightRef.current = false;
    timerExpiredRef.current = false;
    allowTimerSubmitRef.current = remaining != null;
    sessionAppliedAtRef.current = Date.now();

    setSubmitResult(null);
    setAttemptId(resolvedAttemptId);
    setQuestions(normalizedQuestions);
    setStudentAnswers(restoredAnswers);
    setCurrent(resumeIndex);
    setExamEndsAt(endsAt);
    setRemainingSeconds(remaining);
    setExamMeta({
      examTitle: session.examTitle || session.exam_title || "",
      durationMinutes,
      durationUnlimited,
      questionsCount: session.questionsCount || normalizedQuestions.length,
      startedAt,
      courseId: session.courseId || session.course_id || location.state?.courseId || null,
    });
    writeExamProgress(examId, resolvedAttemptId, {
      answers: restoredAnswers,
      current: resumeIndex,
      endsAt,
      startedAt,
    });
    return { remaining, finished: false };
  }, [examId, location.state?.courseId]);

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
        if (isCourseExamTakingSession(fromNav) || isCourseExamFinishedPayload(fromNav)) {
          if (cancelled) return;
          applySession({
            ...fromNav,
            courseId: location.state?.courseId || fromNav.courseId || fromNav.course_id,
          });
        } else if (readPersistedAttemptId(examId)) {
          const session = await startCourseExamAttempt(examId, token);
          if (cancelled) return;
          applySession({
            ...session,
            courseId: location.state?.courseId || session.courseId || session.course_id,
          });
        } else {
          setError("ابدأ الامتحان من صفحة الكورس. لا يمكن بدء محاولة جديدة من هنا.");
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
    questionBlockRef.current?.scrollIntoView({ behavior: "auto", block: "nearest" });
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
      if (autoSubmit || result?.timedOut) {
        toast({
          title: result?.timedOut ? "انتهى الوقت" : "تم التسليم تلقائياً",
          description: `الدرجة: ${result.totalGrade}/${result.maxGrade}`,
          status: "warning",
        });
      } else {
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

  const doAutosave = useCallback(async () => {
    if (submitInFlightRef.current || submitResult) return;
    const token = localStorage.getItem("token");
    const id = toPositiveAttemptId(attemptIdRef.current);
    if (!token || !id || !examId) return;
    try {
      const result = await autosaveCourseExamAnswers(examId, token, {
        attemptId: id,
        answers: buildExamSubmitAnswers(studentAnswersRef.current),
      });
      if (isCourseExamFinishedPayload(result)) {
        setSubmitResult(result);
        setExamEndsAt(null);
        examEndsAtRef.current = null;
        clearExamProgress(examId, id);
        clearPersistedAttemptId(examId);
        return;
      }
      if (result?.remainingSeconds != null || result?.attemptExpiresAt || result?.attempt_expires_at) {
        const { endsAt, remaining } = resolveCourseExamServerTimer(result);
        examEndsAtRef.current = endsAt;
        setExamEndsAt(endsAt);
        setRemainingSeconds(remaining);
      }
    } catch {
      /* silent — next interval retries */
    }
  }, [examId, submitResult]);

  useEffect(() => {
    if (submitResult || !questions.length) return undefined;
    const intervalId = setInterval(doAutosave, 18000);
    return () => clearInterval(intervalId);
  }, [doAutosave, questions.length, submitResult]);

  useEffect(() => {
    return () => {
      if (!submitInFlightRef.current && attemptIdRef.current) {
        doAutosave();
      }
    };
  }, [doAutosave]);

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
      if (appliedAgo < 800) return;
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
      studentAnswersRef.current = next;
      persistProgress({ answers: next });
      return next;
    });
    doAutosave();
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
        compactTop
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
      <Box maxW="2xl" mx="auto" py={10} px={4} minH="100dvh">
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
    <Box
      bg={pageBg}
      minH="100dvh"
      dir="rtl"
      display="flex"
      flexDirection="column"
    >
      <Box
        position="sticky"
        top={0}
        zIndex={30}
        bg={headerBg}
        borderBottomWidth="1px"
        borderColor={headerBorder}
        boxShadow="sm"
        pt="max(10px, env(safe-area-inset-top))"
        px={{ base: 3, md: 4 }}
        pb={3}
      >
        <Flex align="center" gap={2.5} mb={3}>
          <IconButton
            aria-label="العودة"
            icon={<MdArrowBack />}
            variant="ghost"
            minW="44px"
            h="44px"
            borderRadius="xl"
            onClick={goToCourseExams}
            isDisabled={submitLoading}
          />
          <Box flex={1} minW={0}>
            <Text fontWeight="800" fontSize={{ base: "sm", md: "lg" }} noOfLines={1}>
              {examMeta?.examTitle || "امتحان شامل"}
            </Text>
            <Text fontSize="xs" color="gray.500" fontWeight="600">
              سؤال {current + 1} من {questions.length}
              {answeredCount > 0 ? ` · ${answeredCount} مجاب` : ""}
            </Text>
          </Box>
          {remainingSeconds != null ? (
            <Badge
              px={3}
              py={2}
              minW="76px"
              textAlign="center"
              borderRadius="xl"
              fontSize={{ base: "md", md: "sm" }}
              fontFamily="mono"
              fontWeight="800"
              colorScheme={remainingSeconds < 300 ? "red" : "blue"}
            >
              {formatRemainingTime(remainingSeconds)}
            </Badge>
          ) : (
            <Badge px={3} py={2} borderRadius="xl" fontSize="xs" colorScheme="gray">
              بدون حد زمني
            </Badge>
          )}
        </Flex>

        <ExamStudentProgress
          remainingSeconds={remainingSeconds}
          answeredCount={answeredCount}
          totalQuestions={questions.length}
          questions={questions}
          currentQuestionIndex={current}
          studentAnswers={studentAnswers}
          showPagination
          hasActiveAttempt
          compact
          onGoToQuestion={goToQuestion}
        />
      </Box>

      {currentQuestion ? (
        <>
          <Box
            flex="1"
            px={{ base: 3, md: 4 }}
            pt={{ base: 3, md: 5 }}
            pb={{ base: allAnswered ? "168px" : "132px", md: allAnswered ? "160px" : "124px" }}
            maxW="3xl"
            w="full"
            mx="auto"
          >
            <Box ref={questionBlockRef}>
              <LectureExamStudentQuestionCard
                key={currentQuestion.id}
                question={currentQuestion}
                questionIndex={current}
                totalQuestions={questions.length}
                selectedLetter={studentAnswers[currentQuestion.id]}
                onSelectLetter={handleStudentChoice}
                compactHeader
                onZoomImage={(src) => {
                  setImageModalSrc(src);
                  setImageModalOpen(true);
                }}
              />
            </Box>
          </Box>

          <ExamTakingActionBar
            currentIndex={current}
            totalQuestions={questions.length}
            answeredCount={answeredCount}
            allAnswered={allAnswered}
            submitLoading={submitLoading}
            onPrev={() => goToQuestion(current - 1)}
            onNext={() => goToQuestion(current + 1)}
            onSubmit={() => handleSubmitExam(false)}
          />
        </>
      ) : (
        <Center py={16} flex="1">
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
