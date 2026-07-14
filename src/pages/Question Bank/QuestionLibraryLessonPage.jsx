import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  useColorModeValue,
  Icon,
  Button,
  VStack,
  HStack,
  IconButton,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  FormControl,
  FormLabel,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
  Textarea,
  Checkbox,
  Spinner,
  Center,
  Select,
  Image,
  InputGroup,
  InputLeftElement,
  InputRightElement,
} from "@chakra-ui/react";
import {
  FaBookOpen,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaSync,
  FaUpload,
  FaClipboardList,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import { IoChevronBack } from "react-icons/io5";
import baseUrl from "../../api/baseUrl";
import TeacherLibraryExtractionModal from "./components/TeacherLibraryExtractionModal";
import LibraryQuestionCard from "./components/LibraryQuestionCard";
import LibraryPassagePanel from "./components/LibraryPassagePanel";
import AddLibraryToExamModal from "./components/AddLibraryToExamModal";
import {
  addTeacherLibraryToExam,
  fetchLectureExamsForLibrary,
  fetchCourseLevelExamsForLibrary,
  teacherLibraryExamErrorMessage,
} from "../../api/teacherLibraryExamApi";
import {
  useInvalidateTeacherQuestionBank,
  useTeacherLibraryLessonContent,
  useTeacherLibraryLessons,
} from "../../Hooks/teacher/useTeacherQuestionBankQueries";
import { normalizeTeacherQuestion } from "./utils/teacherLibraryQuestionUtils";

const API = "/api/teacher/questions";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const QuestionLibraryLessonPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { lessonId } = useParams();
  const cancelRef = useRef(null);
  const invalidateQb = useInvalidateTeacherQuestionBank();
  const pageBg = useColorModeValue("gray.100", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const muted = useColorModeValue("gray.600", "gray.400");
  const heroBg = useColorModeValue(
    "linear(to-l, blue.600, blue.500)",
    "linear(to-l, blue.700, blue.600)",
  );
  const [allQuestions, setAllQuestions] = useState([]);
  const [passages, setPassages] = useState([]);

  const {
    data: lessons = [],
    isLoading: loading,
    refetch: refetchLessons,
  } = useTeacherLibraryLessons();

  const selectedLesson = useMemo(
    () =>
      lessons.find((l) => String(l.id) === String(lessonId)) ||
      (lessonId ? { id: Number(lessonId) || lessonId, title: "الدرس" } : null),
    [lessons, lessonId],
  );

  const activeLessonId = lessonId || null;

  const {
    data: lessonContent,
    isLoading: lessonLoading,
    isFetching: _lessonFetching,
    refetch: refetchLessonContent,
  } = useTeacherLibraryLessonContent(activeLessonId, {
    enabled: !!activeLessonId,
  });

  useEffect(() => {
    if (!activeLessonId) {
      setAllQuestions([]);
      setPassages([]);
      return;
    }
    if (!lessonContent) return;
    setAllQuestions(lessonContent.questions || []);
    setPassages(lessonContent.passages || []);
    const expanded = {};
    (lessonContent.passages || []).forEach((p) => {
      expanded[p.id] = true;
    });
    setExpandedPassages(expanded);
  }, [lessonContent, activeLessonId]);

  const fetchLessons = useCallback(async () => {
    await invalidateQb.invalidateLibraryLessons();
    return refetchLessons();
  }, [invalidateQb, refetchLessons]);

  const fetchLessonContent = useCallback(
    async (lessonId) => {
      if (!lessonId) return;
      if (String(lessonId) === String(activeLessonId)) {
        await invalidateQb.invalidateLibraryLesson(lessonId);
        return refetchLessonContent();
      }
      await invalidateQb.invalidateLibraryLesson(lessonId);
    },
    [activeLessonId, invalidateQb, refetchLessonContent],
  );

  const [lessonTitle, setLessonTitle] = useState("");
  const [editingLesson, setEditingLesson] = useState(null);
  const [deletingLesson, setDeletingLesson] = useState(null);

  const [questionEdit, setQuestionEdit] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    question_text: "",
    question_type: "choice",
    choices: ["", "", "", ""],
    answer: "",
    correct_answer_index: null,
    explanation: "",
    difficulty_level: "medium",
    points: 1,
    passage_id: "",
  });
  const [deletingQuestion, setDeletingQuestion] = useState(null);
  const [bulkText, setBulkText] = useState("");
  const [passageForm, setPassageForm] = useState({ title: "", content: "" });
  const [pendingAnswerId, setPendingAnswerId] = useState(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [selectedPassageIds, setSelectedPassageIds] = useState([]);
  const [expandedPassages, setExpandedPassages] = useState({});
  const [questionSearch, setQuestionSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [zoomImageUrl, setZoomImageUrl] = useState(null);
  const { isOpen: isZoomOpen, onOpen: onZoomOpen, onClose: onZoomClose } = useDisclosure();
  const [addToExamLoading, setAddToExamLoading] = useState(false);
  const [examLoading, setExamLoading] = useState(false);
  const [lectureExams, setLectureExams] = useState([]);
  const [courseExams, setCourseExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [examModalTab, setExamModalTab] = useState("lecture");
  const [examModalMode, setExamModalMode] = useState("questions");
  const { isOpen: isExamOpen, onOpen: onExamOpen, onClose: onExamClose } = useDisclosure();

  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [isDeletingLesson, setIsDeletingLesson] = useState(false);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false);
  const [isAddingBulk, setIsAddingBulk] = useState(false);
  const [isSavingPassage, setIsSavingPassage] = useState(false);

  const { isOpen: isLessonModalOpen, onOpen: onLessonModalOpen, onClose: onLessonModalClose } = useDisclosure();
  const { isOpen: isDeleteLessonOpen, onOpen: onDeleteLessonOpen, onClose: onDeleteLessonClose } = useDisclosure();
  const { isOpen: isQuestionModalOpen, onOpen: onQuestionModalOpen, onClose: onQuestionModalClose } = useDisclosure();
  const { isOpen: isDeleteQuestionOpen, onOpen: onDeleteQuestionOpen, onClose: onDeleteQuestionClose } = useDisclosure();
  const { isOpen: isBulkOpen, onOpen: onBulkOpen, onClose: onBulkClose } = useDisclosure();
  const { isOpen: isPassageOpen, onOpen: onPassageOpen, onClose: onPassageClose } = useDisclosure();
  const { isOpen: isExtractOpen, onOpen: onExtractOpen, onClose: onExtractClose } = useDisclosure();

  const standaloneQuestions = useMemo(
    () => allQuestions.filter((q) => !q.passage_id),
    [allQuestions],
  );

  const matchesQuestionFilter = useCallback(
    (q) => {
      if (typeFilter === "choice" && q.question_type !== "choice") return false;
      if (typeFilter === "text" && q.question_type !== "text") return false;
      const term = questionSearch.trim().toLowerCase();
      if (!term) return true;
      const hay = `${q.question_text || ""} ${(q.choices || []).join(" ")} ${q.answer || ""}`.toLowerCase();
      return hay.includes(term);
    },
    [questionSearch, typeFilter],
  );

  const filteredStandaloneQuestions = useMemo(
    () => standaloneQuestions.filter(matchesQuestionFilter),
    [standaloneQuestions, matchesQuestionFilter],
  );

  const filteredPassages = useMemo(
    () =>
      passages
        .map((p) => ({
          ...p,
          questions: (p.questions || []).filter(matchesQuestionFilter),
        }))
        .filter((p) => {
          if (!questionSearch.trim() && typeFilter === "all") return true;
          return (p.questions || []).length > 0;
        }),
    [passages, matchesQuestionFilter, questionSearch, typeFilter],
  );

  const allLessonQuestionIds = useMemo(() => {
    const ids = standaloneQuestions.map((q) => q.id);
    passages.forEach((p) => {
      (p.questions || []).forEach((q) => ids.push(q.id));
    });
    return ids;
  }, [standaloneQuestions, passages]);

  const visibleQuestionIds = useMemo(() => {
    const ids = filteredStandaloneQuestions.map((q) => q.id);
    filteredPassages.forEach((p) => {
      (p.questions || []).forEach((q) => ids.push(q.id));
    });
    return ids;
  }, [filteredStandaloneQuestions, filteredPassages]);

  const selectVisibleQuestions = () => {
    setSelectedQuestionIds(visibleQuestionIds);
    setSelectedPassageIds([]);
  };

  const backToLessons = () => {
    navigate("/QuestionLibraryPage");
  };

  const openCreateLesson = () => {
    setEditingLesson(null);
    setLessonTitle("");
    onLessonModalOpen();
  };

  const openEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setLessonTitle(lesson.title);
    onLessonModalOpen();
  };

  const saveLesson = async () => {
    if (!lessonTitle.trim()) return;
    setIsSavingLesson(true);
    try {
      if (editingLesson) {
        await baseUrl.put(
          `${API}/lesson/${editingLesson.id}`,
          { title: lessonTitle.trim() },
          { headers: authHeaders() },
        );
        toast({ title: "تم التحديث", description: "تم تعديل الدرس", status: "success", duration: 2000, isClosable: true });
        await invalidateQb.invalidateLibraryLessons();
      } else {
        await baseUrl.post(`${API}/lesson`, { title: lessonTitle.trim() }, { headers: authHeaders() });
        toast({ title: "تم الإنشاء", description: "تم إنشاء الدرس", status: "success", duration: 2000, isClosable: true });
      }
      onLessonModalClose();
      fetchLessons();
    } catch (err) {
      toast({
        title: "خطأ",
        description: err.response?.data?.message || "فشل في حفظ الدرس",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSavingLesson(false);
    }
  };

  const confirmDeleteLesson = (lesson) => {
    setDeletingLesson(lesson);
    onDeleteLessonOpen();
  };

  const deleteLesson = async () => {
    if (!deletingLesson) return;
    setIsDeletingLesson(true);
    try {
      await baseUrl.delete(`${API}/lesson/${deletingLesson.id}`, { headers: authHeaders() });
      toast({ title: "تم الحذف", description: "تم حذف الدرس وجميع محتوياته", status: "success", duration: 2000, isClosable: true });
      onDeleteLessonClose();
      backToLessons();
    } catch {
      toast({ title: "خطأ", description: "فشل في حذف الدرس", status: "error", duration: 3000, isClosable: true });
    } finally {
      setIsDeletingLesson(false);
    }
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      question_text: "",
      question_type: "choice",
      choices: ["", "", "", ""],
      answer: "",
      correct_answer_index: null,
      explanation: "",
      difficulty_level: "medium",
      points: 1,
      passage_id: "",
    });
  };

  const openAddQuestion = () => {
    setQuestionEdit(null);
    resetQuestionForm();
    onQuestionModalOpen();
  };

  const openEditQuestion = (question) => {
    const q = normalizeTeacherQuestion(question);
    setQuestionEdit(q);
    setQuestionForm({
      question_text: q.question_text || "",
      question_type: q.question_type || "choice",
      choices: q.choices?.length ? q.choices : ["", "", "", ""],
      answer: q.answer || "",
      correct_answer_index: q.correct_answer_index ?? null,
      explanation: q.explanation || "",
      difficulty_level: q.difficulty_level || "medium",
      points: q.points ?? 1,
      passage_id: q.passage_id ? String(q.passage_id) : "",
    });
    onQuestionModalOpen();
  };

  const saveQuestion = async () => {
    if (!selectedLesson || !questionForm.question_text.trim()) return;
    setIsSavingQuestion(true);
    const choices = questionForm.choices.map((c) => c.trim()).filter(Boolean);
    const payload = {
      lesson_id: selectedLesson.id,
      question_text: questionForm.question_text.trim(),
      question_type: questionForm.question_type,
      choices: questionForm.question_type === "choice" ? choices : null,
      answer: questionForm.answer || (choices[questionForm.correct_answer_index] ?? null),
      correct_answer_index: questionForm.correct_answer_index,
      explanation: questionForm.explanation || null,
      difficulty_level: questionForm.difficulty_level,
      points: Number(questionForm.points) || 1,
      passage_id: questionForm.passage_id ? Number(questionForm.passage_id) : null,
    };

    try {
      if (questionEdit) {
        await baseUrl.put(`${API}/question/${questionEdit.id}`, payload, { headers: authHeaders() });
        toast({ title: "تم التحديث", description: "تم تعديل السؤال", status: "success", duration: 2000, isClosable: true });
      } else {
        await baseUrl.post(`${API}/question`, payload, { headers: authHeaders() });
        toast({ title: "تم الإضافة", description: "تم إضافة السؤال", status: "success", duration: 2000, isClosable: true });
      }
      onQuestionModalClose();
      fetchLessonContent(selectedLesson.id);
      fetchLessons();
    } catch (err) {
      toast({
        title: "خطأ",
        description: err.response?.data?.message || "فشل في حفظ السؤال",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const confirmDeleteQuestion = (question) => {
    setDeletingQuestion(question);
    onDeleteQuestionOpen();
  };

  const deleteQuestion = async () => {
    if (!deletingQuestion || !selectedLesson) return;
    setIsDeletingQuestion(true);
    try {
      await baseUrl.delete(`${API}/question/${deletingQuestion.id}`, { headers: authHeaders() });
      toast({ title: "تم الحذف", description: "تم حذف السؤال", status: "success", duration: 2000, isClosable: true });
      onDeleteQuestionClose();
      fetchLessonContent(selectedLesson.id);
      fetchLessons();
    } catch {
      toast({ title: "خطأ", description: "فشل في حذف السؤال", status: "error", duration: 3000, isClosable: true });
    } finally {
      setIsDeletingQuestion(false);
    }
  };

  const setCorrectAnswer = async (question, answerIndex) => {
    const choices = question.choices || [];
    const answer = choices[answerIndex];
    if (answer == null) return;

    setPendingAnswerId(question.id);
    setAllQuestions((prev) =>
      prev.map((q) =>
        q.id === question.id
          ? { ...q, correct_answer_index: answerIndex, answer }
          : q,
      ),
    );
    setPassages((prev) =>
      prev.map((p) => ({
        ...p,
        questions: p.questions.map((q) =>
          q.id === question.id ? { ...q, correct_answer_index: answerIndex, answer } : q,
        ),
      })),
    );

    try {
      await baseUrl.put(
        `${API}/question/${question.id}`,
        {
          question_text: question.question_text,
          question_type: question.question_type,
          choices: question.choices,
          answer,
          correct_answer_index: answerIndex,
        },
        { headers: authHeaders() },
      );
    } catch {
      toast({ title: "خطأ", description: "فشل في تحديث الإجابة الصحيحة", status: "error", duration: 3000, isClosable: true });
      fetchLessonContent(selectedLesson.id);
    } finally {
      setPendingAnswerId(null);
    }
  };

  const addBulkQuestions = async () => {
    if (!selectedLesson || !bulkText.trim()) return;
    setIsAddingBulk(true);
    try {
      await baseUrl.post(
        `${API}/bulk`,
        { lesson_id: selectedLesson.id, bulk_text: bulkText },
        { headers: authHeaders() },
      );
      toast({ title: "تم الإضافة", description: "تمت إضافة الأسئلة بنجاح", status: "success", duration: 2000, isClosable: true });
      setBulkText("");
      onBulkClose();
      fetchLessonContent(selectedLesson.id);
      fetchLessons();
    } catch (err) {
      toast({
        title: "خطأ",
        description: err.response?.data?.message || "فشل في إضافة الأسئلة — تحقق من التنسيق",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsAddingBulk(false);
    }
  };

  const savePassage = async () => {
    if (!selectedLesson || !passageForm.content.trim()) return;
    setIsSavingPassage(true);
    try {
      await baseUrl.post(
        `${API}/passage`,
        {
          lesson_id: selectedLesson.id,
          title: passageForm.title.trim() || null,
          content: passageForm.content.trim(),
          questions: [],
        },
        { headers: authHeaders() },
      );
      toast({ title: "تم الإنشاء", description: "تمت إضافة قطعة القراءة", status: "success", duration: 2000, isClosable: true });
      setPassageForm({ title: "", content: "" });
      onPassageClose();
      fetchLessonContent(selectedLesson.id);
    } catch (err) {
      toast({
        title: "خطأ",
        description: err.response?.data?.message || "فشل في إنشاء القطعة",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSavingPassage(false);
    }
  };

  const toggleQuestionSelect = (id, checked) => {
    setSelectedQuestionIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const togglePassageSelect = (passageId, checked) => {
    setSelectedPassageIds((prev) =>
      checked ? [...prev, passageId] : prev.filter((id) => id !== passageId),
    );
  };


  const selectAllQuestions = () => {
    setSelectedQuestionIds(allLessonQuestionIds);
    setSelectedPassageIds([]);
  };

  const clearQuestionSelection = () => {
    setSelectedQuestionIds([]);
    setSelectedPassageIds([]);
  };

  const fetchExams = async () => {
    setExamLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [lecture, course] = await Promise.all([
        fetchLectureExamsForLibrary(token),
        fetchCourseLevelExamsForLibrary(token),
      ]);
      setLectureExams(lecture);
      setCourseExams(course);
    } catch (err) {
      toast({
        title: "خطأ",
        description: teacherLibraryExamErrorMessage(err, "فشل تحميل الامتحانات"),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setLectureExams([]);
      setCourseExams([]);
    } finally {
      setExamLoading(false);
    }
  };

  const openExamModal = (mode) => {
    if (mode === "questions" && selectedQuestionIds.length === 0) {
      toast({ title: "تنبيه", description: "اختر أسئلة أولاً", status: "info", duration: 2500 });
      return;
    }
    if (mode === "passages" && selectedPassageIds.length === 0) {
      toast({ title: "تنبيه", description: "اختر قطعة قراءة أولاً", status: "info", duration: 2500 });
      return;
    }
    setExamModalMode(mode);
    setSelectedExamId("");
    setExamModalTab("lecture");
    fetchExams();
    onExamOpen();
  };

  const buildExamPayload = () => {
    if (examModalMode === "lesson" && selectedLesson?.id) {
      return { lessonId: Number(selectedLesson.id) };
    }
    if (examModalMode === "passages") {
      return null;
    }
    return { questionIds: selectedQuestionIds.map(Number) };
  };

  const handleConfirmAddToExam = async () => {
    if (!selectedExamId) {
      toast({ title: "تنبيه", description: "اختر امتحاناً", status: "warning", duration: 2500 });
      return;
    }

    setAddToExamLoading(true);
    try {
      const token = localStorage.getItem("token");
      const basePayload =
        examModalTab === "course" ? { type: "course-exam" } : {};

      if (examModalMode === "passages") {
        let totalAdded = 0;
        const skipped = [];
        for (const passageId of selectedPassageIds) {
          const data = await addTeacherLibraryToExam(
            selectedExamId,
            { ...basePayload, passageId: Number(passageId) },
            token,
          );
          totalAdded += data?.addedCount ?? 0;
          if (data?.skippedTeacherQuestionIds?.length) {
            skipped.push(...data.skippedTeacherQuestionIds);
          }
        }
        toast({
          title: "تمت الإضافة",
          description:
            totalAdded > 0
              ? `تمت إضافة ${totalAdded} سؤال من ${selectedPassageIds.length} قطعة`
              : "الأسئلة مضافة مسبقاً أو لا توجد أسئلة اختيارية في القطع",
          status: totalAdded > 0 ? "success" : "warning",
          duration: 4000,
          isClosable: true,
        });
        setSelectedPassageIds([]);
      } else {
        const payload = { ...buildExamPayload(), ...basePayload };
        const data = await addTeacherLibraryToExam(selectedExamId, payload, token);
        const count = data?.addedCount ?? 0;
        const skipped = data?.skippedTeacherQuestionIds?.length ?? 0;
        let description = data?.message || `تمت إضافة ${count} سؤال للامتحان`;
        if (skipped > 0) description += ` (${skipped} مُتخطى — مضاف مسبقاً)`;

        toast({
          title: count > 0 ? "تمت الإضافة" : "تنبيه",
          description,
          status: count > 0 ? "success" : "warning",
          duration: 4000,
          isClosable: true,
        });
        if (examModalMode === "questions") {
          setSelectedQuestionIds([]);
        }
      }

      onExamClose();
      setExamModalMode("questions");
    } catch (err) {
      toast({
        title: "خطأ",
        description: teacherLibraryExamErrorMessage(err),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setAddToExamLoading(false);
    }
  };

  const examModalTitle =
    examModalMode === "lesson"
      ? "إضافة كل أسئلة الدرس للامتحان"
      : examModalMode === "passages"
        ? "إضافة قطع القراءة للامتحان"
        : "إضافة الأسئلة المحددة للامتحان";

  const examModalConfirmLabel =
    examModalMode === "lesson"
      ? "إضافة كل أسئلة الدرس"
      : examModalMode === "passages"
        ? `إضافة ${selectedPassageIds.length} قطعة`
        : `إضافة ${selectedQuestionIds.length} سؤال`;

  const togglePassage = (id) => {
    setExpandedPassages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleZoomImage = (url) => {
    setZoomImageUrl(url);
    onZoomOpen();
  };

  return (
    <Box minH="100vh" bg={pageBg} pt={{ base: "72px", md: "88px" }} pb={10} dir="rtl">
      <Container maxW="container.xl">
        <VStack spacing={5} align="stretch">
          {/* Hero */}
          <Box borderRadius="xl" overflow="hidden" bgGradient={heroBg} color="white" boxShadow="sm">
            <Flex
              p={{ base: 4, md: 6 }}
              align={{ base: "start", md: "center" }}
              justify="space-between"
              gap={4}
              flexWrap="wrap"
            >
              <HStack spacing={3} align="start" flex={1} minW={0}>
                <IconButton
                    aria-label="رجوع"
                    icon={<IoChevronBack />}
                    size="sm"
                    variant="outline"
                    color="white"
                    borderColor="whiteAlpha.400"
                    onClick={backToLessons}
                    _hover={{ bg: "whiteAlpha.200" }}
                  />
                <Flex
                  boxSize={11}
                  borderRadius="lg"
                  bg="whiteAlpha.200"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Icon as={FaBookOpen} boxSize={5} />
                </Flex>
                <Box minW={0}>
                  <Heading size={{ base: "md", md: "lg" }} fontWeight="semibold" lineHeight="1.3">
                    {selectedLesson?.title || "الدرس"}
                  </Heading>
                  <Text color="whiteAlpha.900" fontSize="sm" mt={1} lineHeight="1.6">
                    أسئلة مستقلة وقطع قراءة داخل الدرس
                  </Text>
                </Box>
              </HStack>
              <Button
                leftIcon={<FaSync />}
                size="sm"
                bg="whiteAlpha.200"
                color="white"
                borderRadius="lg"
                _hover={{ bg: "whiteAlpha.300" }}
                onClick={() => selectedLesson && fetchLessonContent(selectedLesson.id)}
              >
                تحديث
              </Button>
            </Flex>
          </Box>

          {!lessonId ? (
            <Center py={16}>
              <Text>معرّف الدرس غير موجود</Text>
            </Center>
          ) : (
            <>
              <Flex gap={2} flexWrap="wrap" p={4} bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
                <Button size="sm" colorScheme="blue" leftIcon={<FaPlus />} borderRadius="lg" onClick={openAddQuestion}>
                  سؤال جديد
                </Button>
                <Button size="sm" colorScheme="orange" variant="outline" leftIcon={<FaUpload />} borderRadius="lg" onClick={onExtractOpen}>
                  استخراج من ملف
                </Button>
               
               
            
              
                {selectedQuestionIds.length > 0 ? (
                  <Button
                    size="sm"
                    colorScheme="blue"
                    leftIcon={<FaClipboardList />}
                    borderRadius="lg"
                    onClick={() => openExamModal("questions")}
                    isLoading={addToExamLoading}
                  >
                    إضافة {selectedQuestionIds.length} سؤال للامتحان
                  </Button>
                ) : null}
                {selectedPassageIds.length > 0 ? (
                  <Button
                    size="sm"
                    colorScheme="orange"
                    leftIcon={<FaClipboardList />}
                    borderRadius="lg"
                    onClick={() => openExamModal("passages")}
                  >
                    إضافة {selectedPassageIds.length} قطعة للامتحان
                  </Button>
                ) : null}
              </Flex>

              {lessonLoading ? (
                <Center py={16}>
                  <Spinner size="lg" color="blue.500" thickness="3px" />
                </Center>
              ) : (
                <>
                  <Box
                    p={{ base: 3, md: 4 }}
                    bg={cardBg}
                    borderRadius="2xl"
                    borderWidth="1px"
                    borderColor={borderColor}
                    shadow="sm"
                  >
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                      <InputGroup>
                        <InputLeftElement pointerEvents="none">
                          <Icon as={FaSearch} color="gray.400" />
                        </InputLeftElement>
                        <Input
                          value={questionSearch}
                          onChange={(e) => setQuestionSearch(e.target.value)}
                          placeholder="ابحث في نص السؤال أو الاختيارات..."
                          borderRadius="xl"
                          dir="rtl"
                        />
                        {questionSearch ? (
                          <InputRightElement>
                            <IconButton
                              aria-label="مسح البحث"
                              icon={<FaTimes />}
                              size="xs"
                              variant="ghost"
                              onClick={() => setQuestionSearch("")}
                            />
                          </InputRightElement>
                        ) : null}
                      </InputGroup>
                      <Select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        borderRadius="xl"
                      >
                        <option value="all">كل الأنواع</option>
                        <option value="choice">اختياري فقط</option>
                        <option value="text">مقالي فقط</option>
                      </Select>
                      <HStack spacing={2}>
                          <Button
                            size="md"
                            variant="outline"
                            colorScheme="blue"
                            borderRadius="xl"
                            flex={1}
                            onClick={selectVisibleQuestions}
                            isDisabled={visibleQuestionIds.length === 0}
                          >
                            تحديد الظاهر ({visibleQuestionIds.length})
                          </Button>
                          <Button
                            size="md"
                            variant="ghost"
                            colorScheme="blue"
                            borderRadius="xl"
                            onClick={clearQuestionSelection}
                            isDisabled={selectedQuestionIds.length === 0}
                          >
                            مسح
                          </Button>
                        </HStack>
                    </SimpleGrid>
                    <Text fontSize="xs" color={muted} mt={2}>
                      {`اضغط على البطاقة للتحديد · ${standaloneQuestions.length} سؤال مستقل · ${passages.length} قطعة`}
                    </Text>
                  </Box>

                  {selectedQuestionIds.length > 0 ? (
                    <Flex
                      gap={3}
                      flexWrap="wrap"
                      align="center"
                      p={4}
                      bgGradient="linear(to-l, blue.500, blue.600)"
                      color="white"
                      borderRadius="2xl"
                      shadow="md"
                      position="sticky"
                      top={{ base: "72px", md: "88px" }}
                      zIndex={15}
                    >
                      <Badge
                        colorScheme="blackAlpha"
                        bg="whiteAlpha.300"
                        color="white"
                        fontSize="sm"
                        px={3}
                        py={1}
                        borderRadius="full"
                      >
                        {selectedQuestionIds.length} محدد
                      </Badge>
                      <Button
                        size="sm"
                        bg="white"
                        color="blue.600"
                        borderRadius="lg"
                        _hover={{ bg: "whiteAlpha.900" }}
                        onClick={selectAllQuestions}
                      >
                        تحديد الكل ({allLessonQuestionIds.length})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        borderColor="whiteAlpha.600"
                        color="white"
                        borderRadius="lg"
                        _hover={{ bg: "whiteAlpha.200" }}
                        onClick={selectVisibleQuestions}
                      >
                        الظاهر فقط
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        color="white"
                        borderRadius="lg"
                        _hover={{ bg: "whiteAlpha.200" }}
                        onClick={clearQuestionSelection}
                      >
                        إلغاء التحديد
                      </Button>
                      <Box flex={1} />
                      <Button
                        size="sm"
                        bg="teal.400"
                        color="white"
                        leftIcon={<FaClipboardList />}
                        borderRadius="lg"
                        _hover={{ bg: "teal.300" }}
                        isDisabled={selectedQuestionIds.length === 0}
                        isLoading={addToExamLoading}
                        onClick={() => openExamModal("questions")}
                      >
                        إضافة للامتحان
                      </Button>
                    </Flex>
                  ) : null}

                  <Box>
                    <Flex justify="space-between" align="center" mb={4} gap={3} flexWrap="wrap">
                      <HStack spacing={3}>
                        <Heading size="sm" color={textColor} fontWeight="bold">
                          أسئلة مستقلة
                        </Heading>
                        <Badge colorScheme="blue" borderRadius="full" px={2.5} py={0.5}>
                          {filteredStandaloneQuestions.length}
                          {filteredStandaloneQuestions.length !== standaloneQuestions.length
                            ? ` / ${standaloneQuestions.length}`
                            : ""}
                        </Badge>
                      </HStack>
                      {filteredStandaloneQuestions.length > 0 ? (
                        <Button
                          size="xs"
                          variant="outline"
                          colorScheme="blue"
                          borderRadius="lg"
                          onClick={() => {
                            const ids = filteredStandaloneQuestions.map((q) => q.id);
                            setSelectedQuestionIds((prev) => {
                              const set = new Set(prev);
                              const allSelected = ids.every((id) => set.has(id));
                              if (allSelected) {
                                ids.forEach((id) => set.delete(id));
                              } else {
                                ids.forEach((id) => set.add(id));
                              }
                              return [...set];
                            });
                          }}
                        >
                          تحديد / إلغاء هذا القسم
                        </Button>
                      ) : null}
                    </Flex>
                    {filteredStandaloneQuestions.length === 0 ? (
                      <Box
                        p={8}
                        bg={cardBg}
                        borderRadius="2xl"
                        borderWidth="1px"
                        borderColor={borderColor}
                        textAlign="center"
                        borderStyle="dashed"
                      >
                        <Text fontSize="sm" color={muted}>
                          {standaloneQuestions.length === 0
                            ? "لا توجد أسئلة مستقلة — أضف سؤالًا أو استخدم الإضافة الجماعية"
                            : "لا نتائج مطابقة للبحث أو الفلتر"}
                        </Text>
                      </Box>
                    ) : (
                      <VStack spacing={4} align="stretch">
                        {filteredStandaloneQuestions.map((q, i) => (
                          <LibraryQuestionCard
                            key={q.id}
                            question={q}
                            index={i}
                            selectedIds={selectedQuestionIds}
                            onToggleSelect={toggleQuestionSelect}
                            onEdit={openEditQuestion}
                            onDelete={confirmDeleteQuestion}
                            onSetCorrect={setCorrectAnswer}
                            pendingId={pendingAnswerId}
                            showSelect
                            onZoomImage={handleZoomImage}
                          />
                        ))}
                      </VStack>
                    )}
                  </Box>

                  <Box>
                    <Flex justify="space-between" align="center" mb={4}>
                      <HStack spacing={3}>
                        <Heading size="sm" color={textColor} fontWeight="bold">
                          قطع القراءة
                        </Heading>
                        <Badge colorScheme="orange" borderRadius="full" px={2.5} py={0.5}>
                          {filteredPassages.length}
                          {filteredPassages.length !== passages.length ? ` / ${passages.length}` : ""}
                        </Badge>
                      </HStack>
                    </Flex>
                    {filteredPassages.length === 0 ? (
                      <Box
                        p={8}
                        bg={cardBg}
                        borderRadius="2xl"
                        borderWidth="1px"
                        borderColor={borderColor}
                        textAlign="center"
                        borderStyle="dashed"
                      >
                        <Text fontSize="sm" color={muted}>
                          {passages.length === 0
                            ? "لا توجد قطع — أضف قطعة نصية ثم اربط الأسئلة بها"
                            : "لا قطع مطابقة للبحث أو الفلتر"}
                        </Text>
                      </Box>
                    ) : (
                      <VStack spacing={4} align="stretch">
                        {filteredPassages.map((passage, passageIndex) => (
                          <LibraryPassagePanel
                            key={passage.id}
                            passage={passage}
                            passageIndex={passageIndex}
                            isExpanded={
                              expandedPassages[passage.id] !== undefined
                                ? !!expandedPassages[passage.id]
                                : true
                            }
                            onToggle={() => togglePassage(passage.id)}
                            selectedQuestionIds={selectedQuestionIds}
                            onToggleSelect={toggleQuestionSelect}
                            onEdit={openEditQuestion}
                            onDelete={confirmDeleteQuestion}
                            onSetCorrect={setCorrectAnswer}
                            pendingId={pendingAnswerId}
                            showSelect
                            onZoomImage={handleZoomImage}
                            selectedPassageIds={selectedPassageIds}
                            onTogglePassageSelect={togglePassageSelect}
                          />
                        ))}
                      </VStack>
                    )}
                  </Box>

                  {selectedQuestionIds.length > 0 && (
                    <Box
                      position="sticky"
                      bottom={4}
                      zIndex={20}
                      pt={2}
                      display={{ base: "block", md: "none" }}
                    >
                      <Button
                        w="full"
                        colorScheme="blue"
                        size="lg"
                        borderRadius="2xl"
                        boxShadow="xl"
                        leftIcon={<FaClipboardList />}
                        isLoading={addToExamLoading}
                        isDisabled={selectedQuestionIds.length === 0}
                        onClick={() => openExamModal("questions")}
                      >
                        {selectedQuestionIds.length > 0
                          ? `إضافة ${selectedQuestionIds.length} سؤال للامتحان`
                          : "اختر أسئلة أولاً"}
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </>
          )}
        </VStack>
      </Container>

      {/* Lesson modal */}
      <Modal isOpen={isLessonModalOpen} onClose={onLessonModalClose} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader fontSize="md">{editingLesson ? "تعديل الدرس" : "درس جديد"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isRequired>
              <FormLabel fontSize="sm">عنوان الدرس</FormLabel>
              <Input
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="مثال: الدرس الأول — الكهرباء"
                dir="rtl"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={2} onClick={onLessonModalClose}>
              إلغاء
            </Button>
            <Button colorScheme="blue" onClick={saveLesson} isLoading={isSavingLesson} isDisabled={!lessonTitle.trim()}>
              حفظ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog isOpen={isDeleteLessonOpen} onClose={onDeleteLessonClose} leastDestructiveRef={cancelRef}>
        <AlertDialogOverlay />
        <AlertDialogContent borderRadius="xl">
          <AlertDialogHeader fontSize="md">حذف الدرس</AlertDialogHeader>
          <AlertDialogBody fontSize="sm">
            حذف «{deletingLesson?.title}» سيحذف كل الأسئلة وقطع القراءة التابعة له. لا يمكن التراجع.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onDeleteLessonClose}>إلغاء</Button>
            <Button colorScheme="red" ml={3} onClick={deleteLesson} isLoading={isDeletingLesson}>
              حذف
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Question modal */}
      <Modal isOpen={isQuestionModalOpen} onClose={onQuestionModalClose} size="lg" scrollBehavior="inside" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader fontSize="md">{questionEdit ? "تعديل السؤال" : "سؤال جديد"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="sm">نص السؤال</FormLabel>
                <Textarea
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm((f) => ({ ...f, question_text: e.target.value }))}
                  rows={3}
                  dir="rtl"
                />
              </FormControl>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="sm">نوع السؤال</FormLabel>
                  <Select
                    value={questionForm.question_type}
                    onChange={(e) => setQuestionForm((f) => ({ ...f, question_type: e.target.value }))}
                  >
                    <option value="choice">اختياري</option>
                    <option value="text">مقالي</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">الصعوبة</FormLabel>
                  <Select
                    value={questionForm.difficulty_level}
                    onChange={(e) => setQuestionForm((f) => ({ ...f, difficulty_level: e.target.value }))}
                  >
                    <option value="easy">سهل</option>
                    <option value="medium">متوسط</option>
                    <option value="hard">صعب</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
              {passages.length > 0 && (
                <FormControl>
                  <FormLabel fontSize="sm">ربط بقطعة (اختياري)</FormLabel>
                  <Select
                    value={questionForm.passage_id}
                    onChange={(e) => setQuestionForm((f) => ({ ...f, passage_id: e.target.value }))}
                  >
                    <option value="">سؤال مستقل</option>
                    {passages.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.title || `قطعة #${p.id}`}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}
              {questionForm.question_type === "choice" && (
                <FormControl>
                  <FormLabel fontSize="sm">الاختيارات</FormLabel>
                  {questionForm.choices.map((choice, idx) => (
                    <HStack key={idx} mb={2}>
                      <Badge colorScheme={questionForm.correct_answer_index === idx ? "green" : "gray"}>
                        {String.fromCharCode(65 + idx)}
                      </Badge>
                      <Input
                        value={choice}
                        onChange={(e) => {
                          const arr = [...questionForm.choices];
                          arr[idx] = e.target.value;
                          setQuestionForm((f) => ({ ...f, choices: arr }));
                        }}
                        dir="rtl"
                        size="sm"
                      />
                      <IconButton
                        aria-label="تعيين كإجابة صحيحة"
                        icon={<FaCheck />}
                        size="xs"
                        colorScheme={questionForm.correct_answer_index === idx ? "green" : "gray"}
                        variant={questionForm.correct_answer_index === idx ? "solid" : "outline"}
                        onClick={() =>
                          setQuestionForm((f) => ({
                            ...f,
                            correct_answer_index: idx,
                            answer: f.choices[idx],
                          }))
                        }
                      />
                    </HStack>
                  ))}
                </FormControl>
              )}
              {questionForm.question_type === "text" && (
                <FormControl>
                  <FormLabel fontSize="sm">الإجابة النموذجية</FormLabel>
                  <Textarea
                    value={questionForm.answer}
                    onChange={(e) => setQuestionForm((f) => ({ ...f, answer: e.target.value }))}
                    rows={2}
                    dir="rtl"
                  />
                </FormControl>
              )}
              <FormControl>
                <FormLabel fontSize="sm">شرح (اختياري)</FormLabel>
                <Textarea
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm((f) => ({ ...f, explanation: e.target.value }))}
                  rows={2}
                  dir="rtl"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">الدرجة</FormLabel>
                <Input
                  type="number"
                  min={1}
                  value={questionForm.points}
                  onChange={(e) => setQuestionForm((f) => ({ ...f, points: e.target.value }))}
                  w="100px"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={2} onClick={onQuestionModalClose}>
              إلغاء
            </Button>
            <Button
              colorScheme="blue"
              onClick={saveQuestion}
              isLoading={isSavingQuestion}
              isDisabled={!questionForm.question_text.trim()}
            >
              حفظ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog isOpen={isDeleteQuestionOpen} onClose={onDeleteQuestionClose}>
        <AlertDialogOverlay />
        <AlertDialogContent borderRadius="xl">
          <AlertDialogHeader fontSize="md">حذف السؤال</AlertDialogHeader>
          <AlertDialogBody fontSize="sm">هل أنت متأكد من حذف هذا السؤال؟</AlertDialogBody>
          <AlertDialogFooter>
            <Button onClick={onDeleteQuestionClose}>إلغاء</Button>
            <Button colorScheme="red" ml={3} onClick={deleteQuestion} isLoading={isDeletingQuestion}>
              حذف
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk modal */}
      <Modal isOpen={isBulkOpen} onClose={onBulkClose} size="lg" scrollBehavior="inside" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader fontSize="md">إضافة جماعية</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" color={muted} mb={3} lineHeight="1.7">
              كل سؤال في كتلة منفصلة: السطر الأول نص السؤال، ثم 4 اختيارات (A) B) C) D)). افصل بين الأسئلة بسطر فارغ.
            </Text>
            <FormControl>
              <FormLabel fontSize="sm">نص الأسئلة</FormLabel>
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={12}
                dir="rtl"
                fontFamily="monospace"
                fontSize="sm"
                placeholder={
                  "ما وحدة قياس التيار؟\nA) فولت\nB) أمبير\nC) أوم\nD) واط\n\nما قانون أوم؟\nA) V=IR\nB) P=VI\nC) F=ma\nD) E=mc²"
                }
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={2} onClick={onBulkClose}>
              إلغاء
            </Button>
            <Button colorScheme="blue" onClick={addBulkQuestions} isLoading={isAddingBulk} isDisabled={!bulkText.trim()}>
              إضافة
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Passage modal */}
      <Modal isOpen={isPassageOpen} onClose={onPassageClose} size="lg" scrollBehavior="inside" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader fontSize="md">قطعة قراءة جديدة</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel fontSize="sm">عنوان القطعة (اختياري)</FormLabel>
                <Input
                  value={passageForm.title}
                  onChange={(e) => setPassageForm((f) => ({ ...f, title: e.target.value }))}
                  dir="rtl"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel fontSize="sm">نص القطعة</FormLabel>
                <Textarea
                  value={passageForm.content}
                  onChange={(e) => setPassageForm((f) => ({ ...f, content: e.target.value }))}
                  rows={8}
                  dir="rtl"
                />
              </FormControl>
              <Text fontSize="xs" color={muted}>
                بعد إنشاء القطعة، أضف أسئلة مرتبطة بها من «سؤال جديد» واختر القطعة من القائمة.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={2} onClick={onPassageClose}>
              إلغاء
            </Button>
            <Button
              colorScheme="orange"
              onClick={savePassage}
              isLoading={isSavingPassage}
              isDisabled={!passageForm.content.trim()}
            >
              حفظ القطعة
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {selectedLesson && (
        <TeacherLibraryExtractionModal
          isOpen={isExtractOpen}
          onClose={onExtractClose}
          lessonId={selectedLesson.id}
          lessonTitle={selectedLesson.title}
          onImported={() => {
            fetchLessonContent(selectedLesson.id);
            fetchLessons();
          }}
        />
      )}

      <AddLibraryToExamModal
        isOpen={isExamOpen}
        onClose={() => {
          onExamClose();
          setExamModalMode("questions");
        }}
        title={examModalTitle}
        confirmLabel={examModalConfirmLabel}
        lectureExams={lectureExams}
        courseExams={courseExams}
        examTab={examModalTab}
        onExamTabChange={setExamModalTab}
        selectedExamId={selectedExamId}
        onSelectExamId={setSelectedExamId}
        onConfirm={handleConfirmAddToExam}
        isLoading={addToExamLoading}
        examsLoading={examLoading}
      />

      <Modal isOpen={isZoomOpen} onClose={onZoomClose} size="4xl" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="xl" mx={3}>
          <ModalHeader fontSize="sm">صورة السؤال</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {zoomImageUrl && (
              <Image
                src={zoomImageUrl}
                alt="صورة السؤال"
                maxW="100%"
                maxH="75vh"
                objectFit="contain"
                mx="auto"
                display="block"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default QuestionLibraryLessonPage;
