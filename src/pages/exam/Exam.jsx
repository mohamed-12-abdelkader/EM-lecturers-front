import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box, VStack, Heading, Text, Spinner, Center, RadioGroup, Radio, Stack,
  Alert, AlertIcon, IconButton, HStack, useToast, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button, Input, Divider, Badge, Tooltip, InputGroup, InputRightElement, Image, useColorModeValue, Flex, SimpleGrid, Grid, Textarea
} from "@chakra-ui/react";
import { AiFillEdit, AiFillDelete, AiFillCheckCircle, AiOutlineCheckCircle, AiOutlineCloseCircle, AiFillStar, AiOutlineRobot } from "react-icons/ai";
import baseUrl from "../../api/baseUrl";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import { useParams, useNavigate } from "react-router-dom";
import UserType from "../../Hooks/auth/userType";
import {
  FaBookOpen, FaCheckCircle, FaChevronLeft, FaChevronRight,
  FaUser, FaTimesCircle, FaImage, FaChartBar, FaCompass
} from 'react-icons/fa';
import { BiSearch } from "react-icons/bi";
import {
  PlatformExamStudentCard,
  PlatformExamTeacherCard,
  formatAnswerLabel,
  isImageUrl,
} from "./components/PlatformExamQuestionCard";
import AiQuestionExtractionModal from "./components/AiQuestionExtractionModal";
import { SubmissionCard } from "./components/ExamSubmissionsView";
import FormattedQuestionText from "../../components/question/FormattedQuestionText";
import { MdArrowBack } from "react-icons/md";
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
const Exam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
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

  // للطالب: بدء الامتحان عبر POST /api/exams/:examId/start
  const [examStarted, setExamStarted] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [examMeta, setExamMeta] = useState(null); // { examTitle, durationMinutes, questionsCount, startedAt }
  const [remainingSeconds, setRemainingSeconds] = useState(null); // عد تنازلي من duration*60 (مثل التطبيق المرجعي)
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalSrc, setImageModalSrc] = useState(null);
  const [imageUploadQuestionId, setImageUploadQuestionId] = useState(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [aiExtractionModalOpen, setAiExtractionModalOpen] = useState(false);
  const [examTourOpen, setExamTourOpen] = useState(false);
  const questionImageInputRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const timerExpiredRef = useRef(false);

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

  // للطالب: بدء الامتحان تلقائياً عند الدخول (مثل التطبيق المرجعي)
  const isStudentView = !isTeacher && !isAdmin && student;
  useEffect(() => {
    if (!isStudentView || !examId || examStarted || startLoading) return;
    handleStartExam();
    // eslint-disable-next-line
  }, [examId, isStudentView]);

  // مؤقت عد تنازلي (بالضبط كالتطبيق المرجعي): يُنقص كل ثانية، وعند الصفر تسليم تلقائي
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (remainingSeconds === null || remainingSeconds <= 0 || submitResult) {
      timerExpiredRef.current = false;
      if (remainingSeconds !== null && remainingSeconds <= 0 && !submitResult && !submitLoading) {
        timerExpiredRef.current = true;
        toast({ title: "انتهى الوقت!", description: "يتم تسليم الامتحان تلقائياً.", status: "warning" });
        handleSubmitExam(true);
      }
      return;
    }
    timerIntervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 0) {
          if (prev !== null && prev <= 0 && !timerExpiredRef.current && !submitLoading && !submitResult) {
            timerExpiredRef.current = true;
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            toast({ title: "انتهى الوقت!", description: "يتم تسليم الامتحان تلقائياً.", status: "warning" });
            handleSubmitExam(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [remainingSeconds, submitResult, submitLoading]);

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

      fetchedQuestions = normalizeQuestionsFromApi(fetchedQuestions);
      setQuestions(fetchedQuestions);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تحميل الأسئلة");
    } finally {
      setLoading(false);
    }
  };

  /** تطبيع أسئلة API: optionA..D، questionImage، correctAnswer، اختيارات صور */
  function normalizeQuestionsFromApi(fetchedQuestions) {
    const list = Array.isArray(fetchedQuestions) ? fetchedQuestions : [];
    const letterKeys = ["A", "B", "C", "D"];

    return list.map((q) => {
      const hasFlatOptions =
        q.type != null || q.questionText != null || q.optionA != null || q.optionB != null;

      if (hasFlatOptions) {
        const correctLetter = String(q.correctAnswer || "").toUpperCase();
        const choices = letterKeys.map((letter, idx) => {
          const raw = q[`option${letter}`];
          const val = raw != null ? String(raw).trim() : "";
          const img = isImageUrl(val);
          return {
            id: idx + 1,
            letter,
            text: img ? "" : val,
            image: img ? val : null,
            isImageOnly: img,
            is_correct: letter === correctLetter,
          };
        });

        return {
          id: q.id,
          text: q.questionText != null ? String(q.questionText) : "",
          image: q.questionImage ?? q.image ?? null,
          type: q.type || null,
          grade: q.grade ?? 1,
          correctAnswer: correctLetter,
          choices,
        };
      }

      const choices = (q.choices || []).map((c, idx) => {
        const letter = c.letter || letterKeys[idx] || String.fromCharCode(65 + idx);
        const rawText = c.text != null ? String(c.text).trim() : "";
        const img = c.image || (isImageUrl(rawText) ? rawText : null);
        return {
          id: c.id ?? idx + 1,
          letter,
          text: img && isImageUrl(rawText) ? "" : rawText,
          image: img,
          isImageOnly: Boolean(img && !rawText),
          is_correct: Boolean(c.is_correct),
        };
      });

      return {
        id: q.id,
        text: q.text ?? q.questionText ?? "",
        image: q.image ?? q.questionImage ?? null,
        type: q.type ?? null,
        grade: q.grade ?? 1,
        correctAnswer: q.correctAnswer ?? null,
        choices,
      };
    });
  }

  // للطالب: بدء الامتحان POST /api/exams/:examId/start (كالتطبيق المرجعي: تعيين المؤقت وتهيئة الإجابات)
  const handleStartExam = async () => {
    setStartLoading(true);
    setError(null);
    try {
      const res = await baseUrl.post(
        `/api/exams/${examId}/start`,
        {},
        authHeaders
      );
      const data = res.data || {};
      const exam = data.exam || {};
      setAttemptId(data.attemptId ?? null);
      setExamMeta({
        examTitle: data.examTitle ?? exam.title ?? "",
        durationMinutes: data.durationMinutes ?? exam.durationMinutes ?? 0,
        questionsCount: data.questionsCount ?? exam.questionsCount ?? (data.questions?.length ?? 0),
        startedAt: data.startedAt ?? new Date().toISOString(),
      });
      const rawQuestions = data.questions ?? [];
      setQuestions(normalizeQuestionsFromApi(rawQuestions));
      setExamStarted(true);
      setCurrent(0);
      setStudentAnswers({});
      const durationMin = data.durationMinutes ?? exam.durationMinutes;
      if (durationMin != null && durationMin > 0) {
        setRemainingSeconds(durationMin * 60);
      } else {
        setRemainingSeconds(null);
      }
      toast({ title: "تم بدء الامتحان", status: "success" });
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "حدث خطأ أثناء بدء الامتحان";
      setError(msg);
      toast({ title: msg, status: "error" });
    } finally {
      setStartLoading(false);
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

  // للطالب: عند اختيار إجابة بحرف (A/B/C/D) - مثل التطبيق المرجعي
  const handleStudentChoice = (questionId, selectedAnswer) => {
    if (submitResult) return;
    setStudentAnswers((prev) => ({ ...prev, [questionId]: selectedAnswer }));
  };

  // للطالب: الانتقال لسؤال (كالتطبيق المرجعي - لا تنقل بعد التسليم)
  const goToQuestion = (index) => {
    if (submitResult) return;
    if (index < 0 || index >= questions.length) return;
    setCurrent(index);
  };

  // للطالب: تسليم الامتحان — نفس الطريقة في التطبيق المرجعي (نفس الـ endpoint ونفس صيغة الإجابات)
  const handleSubmitExam = useCallback(async (autoSubmit = false) => {
    if (!examId || !attemptId) {
      toast({ title: "خطأ", description: "لا توجد محاولة نشطة لتسليمها", status: "error" });
      return;
    }
    if (submitLoading || submitResult) return;
    const token = localStorage.getItem("token");
    if (!token) {
      toast({ title: "يجب تسجيل الدخول لتسليم الامتحان", status: "error" });
      return;
    }

    setSubmitLoading(true);
    timerExpiredRef.current = autoSubmit;

    try {
      const answersArr = Object.entries(studentAnswers).map(([questionId, selectedAnswer]) => ({
        questionId: Number(questionId),
        selectedAnswer,
      }));

      const res = await baseUrl.post(
        `/api/exams/${examId}/submit`,
        { attemptId, answers: answersArr },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const result = res.data;
      setSubmitResult(result);
      setRemainingSeconds(null);

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
    }
  }, [examId, attemptId, studentAnswers, submitLoading, submitResult]);

  // للطالب: أثناء التحميل أو قبل بدء الامتحان نعرض التحميل أو الخطأ (بدء تلقائي)
  if (isStudentView && !examStarted) {
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
    return <BrandLoadingScreen />;
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
        <HStack
          mb={4}
          p={3}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={teacherCardBorder}
          bg={studentHeaderBg}
          shadow="sm"
          spacing={3}
          align="center"
        >
          <IconButton
            aria-label="العودة"
            icon={<MdArrowBack />}
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          />
          <VStack align="stretch" flex={1} spacing={0}>
            <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
              {examMeta?.examTitle || "الامتحان الشامل"}
            </Text>
            {remainingSeconds !== null && (
              <Text fontSize="sm" fontWeight="600" color="blue.600">
                {formatRemainingTime(remainingSeconds)}
              </Text>
            )}
          </VStack>
        </HStack>
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
            <Button
              colorScheme="blue"
              size={{ base: "sm", md: "md" }}
              leftIcon={<FaChartBar />}
              onClick={() => navigate(`/exam/${examId}/report`)}
              borderRadius="xl"
              fontWeight="600"
              alignSelf={{ base: "center", sm: "auto" }}
            >
              تقرير الأسئلة
            </Button>
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
            (() => {
              const filtered = gradesData.filter(s => {
                const term = searchTerm.trim().toLowerCase();
                if (!term) return true;
                return (
                  (s.name && s.name.toLowerCase().includes(term)) ||
                  (s.student_id != null && String(s.student_id).includes(term)) ||
                  (s.submission_id != null && String(s.submission_id).includes(term)) ||
                  (s.attempt_number != null && String(s.attempt_number).includes(term)) ||
                  (s.email && s.email.toLowerCase().includes(term)) ||
                  (s.phone && s.phone.includes(term))
                );
              });
              return (
                <VStack spacing={{ base: 4, md: 5 }} align="stretch">
                  {filtered.length === 0 ? (
                    <Center py={8}>
                      <Text color="gray.500" fontSize="md">لا توجد نتائج مطابقة للبحث</Text>
                    </Center>
                  ) : (
                    filtered.map((s, idx) => (
                      <SubmissionCard
                        key={s.submission_id ?? idx}
                        submission={s}
                        index={idx}
                      />
                    ))
                  )}
                </VStack>
              );
            })()
          )}
        </Box>
      ) : (
        <>
          {/* للطالب: عرض سؤال واحد مع pagination */}
          {!isTeacher && !isAdmin && student ? (
            <>
              {/* عرض النتيجة إذا تم التسليم (بنفس تصميم التطبيق المرجعي) */}
              {submitResult ? (
                <Box
                  p={6}
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor="gray.200"
                  bg="white"
                  boxShadow="lg"
                >
                  <VStack spacing={6} align="stretch">
                    <VStack spacing={3}>
                      <FaCheckCircle size={48} color="#10B981" />
                      <Heading size="lg" color="gray.800">تم تسليم الامتحان</Heading>
                    </VStack>
                    <VStack spacing={1}>
                      <Text fontSize="4xl" fontWeight="bold" color="blue.600">
                        {submitResult.totalGrade}
                      </Text>
                      <Text fontSize="lg" color="gray.600">من {submitResult.maxGrade}</Text>
                    </VStack>
                    <HStack spacing={4} justify="center" w="full">
                      <Box flex={1} p={4} borderRadius="xl" bg="green.50" borderWidth="1px" borderColor="green.200" textAlign="center">
                        <FaCheckCircle size={24} color="#10B981" style={{ margin: "0 auto 8px" }} />
                        <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                          {submitResult.correctCount ?? (questions.length - (submitResult.wrongQuestions?.length ?? 0))}
                        </Text>
                        <Text fontSize="sm" color="gray.600">صحيح</Text>
                      </Box>
                      <Box flex={1} p={4} borderRadius="xl" bg="red.50" borderWidth="1px" borderColor="red.200" textAlign="center">
                        <FaTimesCircle size={24} color="#DC2626" style={{ margin: "0 auto 8px" }} />
                        <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                          {submitResult.wrongCount ?? (submitResult.wrongQuestions?.length ?? 0)}
                        </Text>
                        <Text fontSize="sm" color="gray.600">خاطئ</Text>
                      </Box>
                    </HStack>
                    {submitResult.wrongQuestions && submitResult.wrongQuestions.length > 0 && (
                      <VStack align="stretch" spacing={4}>
                        <Text fontWeight="600" fontSize="lg" color="gray.800">
                          الأسئلة الخاطئة ({submitResult.wrongQuestions.length})
                        </Text>
                        {submitResult.wrongQuestions.map((wq, idx) => {
                          const getAnswerText = (answer) => {
                            if (!answer) return "—";
                            const key = `option${String(answer).toUpperCase()}`;
                            const val = wq[key] ?? wq[`option${answer}`];
                            if (val != null) return formatAnswerLabel(val);
                            if (answer === "A") return formatAnswerLabel(wq.optionA);
                            if (answer === "B") return formatAnswerLabel(wq.optionB);
                            if (answer === "C") return formatAnswerLabel(wq.optionC);
                            if (answer === "D") return formatAnswerLabel(wq.optionD);
                            return "—";
                          };
                          const getAnswerImage = (answer) => {
                            if (!answer) return null;
                            const key = `option${String(answer).toUpperCase()}`;
                            const val = wq[key] ?? wq[`option${answer}`];
                            return val && isImageUrl(val) ? val : null;
                          };
                          const yourLetter = wq.yourAnswer;
                          const correctLetter = wq.correctAnswer;
                          const yourText = yourLetter != null ? getAnswerText(yourLetter) : (wq.yourChoice?.text || "لم تجب");
                          const correctText = correctLetter != null ? getAnswerText(correctLetter) : (wq.correctChoice?.text || "—");
                          const yourImg = yourLetter != null ? getAnswerImage(yourLetter) : null;
                          const correctImg = correctLetter != null ? getAnswerImage(correctLetter) : null;
                          return (
                            <Box
                              key={wq.questionId}
                              p={4}
                              borderRadius="xl"
                              borderWidth="1px"
                              borderColor="gray.200"
                              bg="gray.50"
                            >
                              <Text fontWeight="600" color="gray.800" mb={2}>سؤال {idx + 1}</Text>
                              {wq.questionText && (
                                <FormattedQuestionText
                                  value={wq.questionText}
                                  fontSize="md"
                                  color="gray.700"
                                  mb={3}
                                  lineHeight="1.85"
                                />
                              )}
                              {wq.questionImage && (
                                <Box mb={3} cursor="pointer" onClick={() => { setImageModalSrc(wq.questionImage); setImageModalOpen(true); }}>
                                  <Image src={wq.questionImage} alt="السؤال" maxH="200px" borderRadius="md" objectFit="contain" />
                                </Box>
                              )}
                              <VStack align="stretch" spacing={2}>
                                <HStack spacing={0} align="start" flexWrap="wrap">
                                  <AiOutlineCloseCircle color="#DC2626" size={16} style={{ marginTop: 4, flexShrink: 0 }} />
                                  <Box flex={1}>
                                    <Text fontSize="sm" color="red.600" mb={1}>
                                      إجابتك{yourLetter ? ` (${yourLetter})` : ""}:
                                    </Text>
                                    <FormattedQuestionText
                                      value={yourText}
                                      fontSize="sm"
                                      color="red.600"
                                      lineHeight="1.75"
                                    />
                                    {yourImg && (
                                      <Image src={yourImg} mt={2} maxH="120px" objectFit="contain" borderRadius="md" cursor="pointer" onClick={() => { setImageModalSrc(yourImg); setImageModalOpen(true); }} />
                                    )}
                                  </Box>
                                </HStack>
                                <HStack spacing={0} align="start" flexWrap="wrap">
                                  <AiOutlineCheckCircle color="#16A34A" size={16} style={{ marginTop: 4, flexShrink: 0 }} />
                                  <Box flex={1}>
                                    <Text fontSize="sm" color="green.600" mb={1}>
                                      الصحيحة{correctLetter ? ` (${correctLetter})` : ""}:
                                    </Text>
                                    <FormattedQuestionText
                                      value={correctText}
                                      fontSize="sm"
                                      color="green.600"
                                      lineHeight="1.75"
                                    />
                                    {correctImg && (
                                      <Image src={correctImg} mt={2} maxH="120px" objectFit="contain" borderRadius="md" cursor="pointer" onClick={() => { setImageModalSrc(correctImg); setImageModalOpen(true); }} />
                                    )}
                                  </Box>
                                </HStack>
                              </VStack>
                            </Box>
                          );
                        })}
                      </VStack>
                    )}
                    <Button colorScheme="blue" w="full" size="lg" leftIcon={<MdArrowBack />} onClick={() => navigate(-1)}>
                      العودة للكورس
                    </Button>
                  </VStack>
                </Box>
              ) : (
                <>
                  {/* بطاقة التقدم (مثل التطبيق المرجعي) */}
                  {questions.length > 0 && (
                    <Box mb={5}>
                      <Flex align="center" justify="space-between" mb={3} gap={3} flexWrap="wrap">
                        <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                          السؤال {current + 1} من {questions.length}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {Object.keys(studentAnswers).length} / {questions.length} تمت الإجابة
                        </Text>
                      </Flex>
                      <Box w="full" h="1.5" bg="gray.100" borderRadius="full" overflow="hidden" mb={3}>
                        <Box
                          h="full"
                          bg="blue.500"
                          borderRadius="full"
                          w={`${questions.length ? (Object.keys(studentAnswers).length / questions.length) * 100 : 0}%`}
                          transition="width 0.35s ease"
                        />
                      </Box>
                      <Flex gap={1.5} flexWrap="wrap" justify="center" mb={4}>
                        {questions.map((q, i) => {
                          const answered = Boolean(studentAnswers[q.id]);
                          const isCurrent = i === current;
                          return (
                            <Box
                              key={q.id}
                              as="button"
                              type="button"
                              w={9}
                              h={9}
                              borderRadius="lg"
                              fontSize="xs"
                              fontWeight="bold"
                              borderWidth="2px"
                              borderColor={isCurrent ? "blue.500" : answered ? "green.300" : "gray.200"}
                              bg={isCurrent ? "blue.500" : answered ? "green.50" : "white"}
                              color={isCurrent ? "white" : answered ? "green.700" : "gray.500"}
                              cursor="pointer"
                              transition="all 0.15s"
                              _hover={{ borderColor: "blue.300", transform: "scale(1.05)" }}
                              onClick={() => goToQuestion(i)}
                            >
                              {i + 1}
                            </Box>
                          );
                        })}
                      </Flex>
                    </Box>
                  )}

                  {questions.length > 0 && (
                    <Box mb={5}>
                      <PlatformExamStudentCard
                        key={questions[current].id}
                        question={questions[current]}
                        questionIndex={current}
                        totalQuestions={questions.length}
                        selectedLetter={studentAnswers[questions[current].id]}
                        onSelectLetter={handleStudentChoice}
                        onZoomImage={(src) => { setImageModalSrc(src); setImageModalOpen(true); }}
                      />
                    </Box>
                  )}

                  {/* أزرار التنقل والتسليم (السابق | تسليم | التالي) */}
                  {questions.length > 0 && (
                    <HStack spacing={3} w="full" flexWrap="wrap">
                      <Button
                        flex={1}
                        minW="100px"
                        variant="outline"
                        borderColor="gray.300"
                        leftIcon={<FaChevronRight />}
                        onClick={() => goToQuestion(current - 1)}
                        isDisabled={current === 0}
                      >
                        السابق
                      </Button>
                      {Object.keys(studentAnswers).length === questions.length ? (
                        <Button
                          flex={1}
                          minW="140px"
                          colorScheme="green"
                          leftIcon={<FaCheckCircle />}
                          isLoading={submitLoading}
                          onClick={handleSubmitExam}
                        >
                          تسليم الامتحان
                        </Button>
                      ) : (
                        <Box flex={1} minW="140px" />
                      )}
                      <Button
                        flex={1}
                        minW="100px"
                        variant="outline"
                        borderColor="gray.300"
                        rightIcon={<FaChevronLeft />}
                        onClick={() => goToQuestion(current + 1)}
                        isDisabled={current === questions.length - 1}
                      >
                        {current === questions.length - 1 ? "آخر سؤال" : "التالي"}
                      </Button>
                    </HStack>
                  )}
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