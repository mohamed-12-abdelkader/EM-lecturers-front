import React, { useState, useEffect, useMemo, useCallback, useRef, startTransition } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Flex,
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
  FaUpload,
  FaClipboardList,
  FaSearch,
  FaTimes,
  FaListAlt,
  FaParagraph,
  FaQuestionCircle,
} from "react-icons/fa";
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
import { bulkCreateTeacherLibraryQuestions } from "../../api/teacherQuestionLibraryApi";
import {
  useInvalidateTeacherQuestionBank,
  useTeacherLibraryLessonContent,
  useTeacherLibraryLessons,
} from "../../Hooks/teacher/useTeacherQuestionBankQueries";
import { normalizeTeacherQuestion } from "./utils/teacherLibraryQuestionUtils";
import {
  LibraryPageShell,
  LibraryHero,
  LibraryStatGrid,
  LibraryStatCard,
  LibraryToolbar,
  LibraryFilterPanel,
  LibraryContentSection,
  LibraryLoadingState,
  libraryModalProps,
  libraryModalContentProps,
} from "./components/QuestionLibraryShell";

const API = "/api/teacher/questions";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const QuestionLibraryLessonPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { gradeId, lessonId } = useParams();
  const cancelRef = useRef(null);
  const invalidateQb = useInvalidateTeacherQuestionBank();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.800");
  const textColor = useColorModeValue("gray.900", "gray.100");
  const muted = useColorModeValue("gray.500", "gray.400");
  const filterInputBg = useColorModeValue("gray.50", "gray.800");
  const [allQuestions, setAllQuestions] = useState([]);
  const [passages, setPassages] = useState([]);

  const {
    data: lessons = [],
    isLoading: loading,
    refetch: refetchLessons,
  } = useTeacherLibraryLessons(undefined);

  const selectedLesson = useMemo(
    () =>
      lessons.find((l) => String(l.id) === String(lessonId)) ||
      (lessonId
        ? {
            id: Number(lessonId) || lessonId,
            title: "الدرس",
            grade_id: gradeId ? Number(gradeId) : null,
          }
        : null),
    [lessons, lessonId, gradeId],
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
    await invalidateQb.invalidateAllLibraryLessons();
    await invalidateQb.invalidateLibraryGrades();
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
  const [selectedQuestions, setSelectedQuestions] = useState(() => new Set());
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
  const [selectedExamIds, setSelectedExamIds] = useState([]);
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

  const selectedQuestionCount = selectedQuestions.size;

  const selectedQuestionIds = useMemo(
    () => Array.from(selectedQuestions),
    [selectedQuestions],
  );

  const selectVisibleQuestions = useCallback(() => {
    startTransition(() => {
      setSelectedQuestions(new Set(visibleQuestionIds));
      setSelectedPassageIds([]);
    });
  }, [visibleQuestionIds]);

  const backToLessons = () => {
    const resolvedGradeId = gradeId || selectedLesson?.grade_id;
    if (resolvedGradeId) {
      navigate(`/QuestionLibraryPage/grade/${resolvedGradeId}`);
      return;
    }
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
        await invalidateQb.invalidateAllLibraryLessons();
      } else {
        const resolvedGradeId = gradeId || selectedLesson?.grade_id;
        if (!resolvedGradeId) {
          throw new Error("grade_id مطلوب — افتح الدرس من صفه الدراسي");
        }
        await baseUrl.post(
          `${API}/lesson`,
          { grade_id: Number(resolvedGradeId), title: lessonTitle.trim() },
          { headers: authHeaders() },
        );
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

  const openEditQuestion = useCallback((question) => {
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
  }, [onQuestionModalOpen]);

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

  const confirmDeleteQuestion = useCallback((question) => {
    setDeletingQuestion(question);
    onDeleteQuestionOpen();
  }, [onDeleteQuestionOpen]);

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

  const setCorrectAnswer = useCallback(async (question, answerIndex) => {
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
      if (selectedLesson?.id) fetchLessonContent(selectedLesson.id);
    } finally {
      setPendingAnswerId(null);
    }
  }, [fetchLessonContent, selectedLesson?.id, toast]);

  const addBulkQuestions = async () => {
    if (!selectedLesson || !bulkText.trim()) return;
    setIsAddingBulk(true);
    try {
      const data = await bulkCreateTeacherLibraryQuestions({
        lessonId: selectedLesson.id,
        bulkText,
      });
      const inserted = Number(data?.inserted ?? data?.data?.inserted ?? 0);
      toast({
        title: "تم الإضافة",
        description:
          inserted > 0
            ? `تمت إضافة ${inserted} سؤال. حدّد الإجابة الصحيحة لاحقاً من البطاقة.`
            : "تمت إضافة الأسئلة بنجاح",
        status: "success",
        duration: 3500,
        isClosable: true,
      });
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

  const getPassageSiblingQuestionIds = useCallback(
    (questionId) => {
      for (const passage of passages) {
        const qs = passage.questions || [];
        if (qs.some((q) => q.id === questionId)) {
          return qs.map((q) => q.id);
        }
      }
      const target = allQuestions.find((q) => q.id === questionId);
      if (target?.passage_id != null && target.passage_id !== "") {
        return allQuestions
          .filter((q) => String(q.passage_id) === String(target.passage_id))
          .map((q) => q.id);
      }
      return [questionId];
    },
    [passages, allQuestions],
  );

  const toggleQuestionSelect = useCallback(
    (id, checked) => {
      const siblingIds = getPassageSiblingQuestionIds(id);
      setSelectedQuestions((prev) => {
        const next = new Set(prev);
        if (checked) siblingIds.forEach((qid) => next.add(qid));
        else siblingIds.forEach((qid) => next.delete(qid));
        return next;
      });
    },
    [getPassageSiblingQuestionIds],
  );

  const togglePassageSelect = useCallback((passageId, checked) => {
    setSelectedPassageIds((prev) =>
      checked ? [...prev, passageId] : prev.filter((id) => id !== passageId),
    );
  }, []);

  const selectAllQuestions = useCallback(() => {
    startTransition(() => {
      setSelectedQuestions(new Set(allLessonQuestionIds));
      setSelectedPassageIds([]);
    });
  }, [allLessonQuestionIds]);

  const clearQuestionSelection = useCallback(() => {
    setSelectedQuestions(new Set());
    setSelectedPassageIds([]);
  }, []);

  const toggleStandaloneSectionSelection = useCallback(() => {
    const ids = filteredStandaloneQuestions.map((q) => q.id);
    setSelectedQuestions((prev) => {
      const next = new Set(prev);
      const allSelected = ids.length > 0 && ids.every((id) => next.has(id));
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }, [filteredStandaloneQuestions]);

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
    if (mode === "questions" && selectedQuestionCount === 0) {
      toast({ title: "تنبيه", description: "اختر أسئلة أولاً", status: "info", duration: 2500 });
      return;
    }
    if (mode === "passages" && selectedPassageIds.length === 0) {
      toast({ title: "تنبيه", description: "اختر قطعة قراءة أولاً", status: "info", duration: 2500 });
      return;
    }
    setExamModalMode(mode);
    setSelectedExamIds([]);
    setExamModalTab("lecture");
    fetchExams();
    onExamOpen();
  };

  const toggleSelectedExamId = (examId) => {
    const id = String(examId);
    setSelectedExamIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
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
    if (selectedExamIds.length === 0) {
      toast({ title: "تنبيه", description: "اختر واجباً أو امتحاناً واحداً على الأقل", status: "warning", duration: 2500 });
      return;
    }

    setAddToExamLoading(true);
    try {
      const token = localStorage.getItem("token");
      const basePayload =
        examModalTab === "course" ? { type: "course-exam" } : {};

      let totalAdded = 0;
      let successExams = 0;
      const errors = [];

      for (const examId of selectedExamIds) {
        try {
          if (examModalMode === "passages") {
            for (const passageId of selectedPassageIds) {
              const data = await addTeacherLibraryToExam(
                examId,
                { ...basePayload, passageId: Number(passageId) },
                token,
              );
              totalAdded += data?.addedCount ?? 0;
            }
          } else {
            const payload = { ...buildExamPayload(), ...basePayload };
            const data = await addTeacherLibraryToExam(examId, payload, token);
            totalAdded += data?.addedCount ?? 0;
          }
          successExams += 1;
        } catch (err) {
          errors.push(teacherLibraryExamErrorMessage(err));
        }
      }

      if (examModalMode === "passages") {
        toast({
          title: successExams > 0 ? "تمت الإضافة" : "تنبيه",
          description:
            successExams > 0
              ? `تمت إضافة ${totalAdded} سؤال إلى ${successExams} من ${selectedExamIds.length} امتحان`
              : errors[0] || "فشلت الإضافة",
          status: successExams > 0 ? (errors.length ? "warning" : "success") : "error",
          duration: 4500,
          isClosable: true,
        });
        if (successExams > 0) setSelectedPassageIds([]);
      } else {
        toast({
          title: successExams > 0 ? "تمت الإضافة" : "تنبيه",
          description:
            successExams > 0
              ? `تمت إضافة ${totalAdded} سؤال إلى ${successExams} من ${selectedExamIds.length} امتحان`
              : errors[0] || "فشلت الإضافة",
          status: successExams > 0 ? (errors.length ? "warning" : "success") : "error",
          duration: 4500,
          isClosable: true,
        });
        if (successExams > 0 && examModalMode === "questions") {
          setSelectedQuestions(new Set());
        }
      }

      if (successExams > 0) {
        onExamClose();
        setExamModalMode("questions");
        setSelectedExamIds([]);
      }
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
      ? selectedExamIds.length > 1
        ? `إضافة الدرس إلى ${selectedExamIds.length} امتحانات`
        : "إضافة كل أسئلة الدرس"
      : examModalMode === "passages"
        ? selectedExamIds.length > 1
          ? `إضافة ${selectedPassageIds.length} قطعة إلى ${selectedExamIds.length} امتحانات`
          : `إضافة ${selectedPassageIds.length} قطعة`
        : selectedExamIds.length > 1
          ? `إضافة ${selectedQuestionCount} سؤال إلى ${selectedExamIds.length} امتحانات`
          : `إضافة ${selectedQuestionCount} سؤال`;

  const togglePassage = (id) => {
    setExpandedPassages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleZoomImage = useCallback((url) => {
    setZoomImageUrl(url);
    onZoomOpen();
  }, [onZoomOpen]);

  return (
    <>
    <LibraryPageShell>
      <LibraryHero
        title={selectedLesson?.title || "الدرس"}
        subtitle={
          selectedLesson?.grade_title
            ? `${selectedLesson.grade_title} — أسئلة مستقلة وقطع قراءة`
            : "أسئلة مستقلة وقطع قراءة داخل الدرس"
        }
        icon={FaBookOpen}
        accent="blend"
        onBack={backToLessons}
        onRefresh={() => selectedLesson && fetchLessonContent(selectedLesson.id)}
        isRefreshing={_lessonFetching}
        breadcrumbs={[
          { label: "مكتبة الأسئلة", onClick: () => navigate("/QuestionLibraryPage") },
          ...(selectedLesson?.grade_title || gradeId
            ? [{ label: selectedLesson?.grade_title || "الصف", onClick: backToLessons }]
            : []),
          { label: selectedLesson?.title || "الدرس" },
        ]}
      />

      {!lessonId ? (
        <Center py={16}>
          <Text color={muted}>معرّف الدرس غير موجود</Text>
        </Center>
      ) : (
        <>
          <LibraryStatGrid columns={{ base: 2, md: 4 }}>
            <LibraryStatCard label="إجمالي الأسئلة" value={allLessonQuestionIds.length} icon={FaListAlt} accent="blue" />
            <LibraryStatCard label="أسئلة مستقلة" value={standaloneQuestions.length} icon={FaQuestionCircle} accent="orange" />
            <LibraryStatCard label="قطع القراءة" value={passages.length} icon={FaParagraph} accent="blue" />
            <LibraryStatCard label="المحدد" value={selectedQuestionCount} icon={FaClipboardList} accent="orange" />
          </LibraryStatGrid>

          <LibraryToolbar>
            <Button size="sm" colorScheme="blue" leftIcon={<FaPlus />} borderRadius="xl" onClick={openAddQuestion}>
              سؤال جديد
            </Button>
            <Button size="sm" colorScheme="teal" variant="outline" leftIcon={<FaListAlt />} borderRadius="xl" onClick={onBulkOpen}>
              إضافة جماعية
            </Button>
            <Button size="sm" colorScheme="orange" variant="outline" leftIcon={<FaParagraph />} borderRadius="xl" onClick={onPassageOpen}>
              قطعة قراءة
            </Button>
            <Button size="sm" colorScheme="orange" variant="outline" leftIcon={<FaUpload />} borderRadius="xl" onClick={onExtractOpen}>
              استخراج من ملف
            </Button>
            {selectedQuestionCount > 0 ? (
              <Button
                size="sm"
                colorScheme="blue"
                variant="outline"
                leftIcon={<FaClipboardList />}
                borderRadius="xl"
                onClick={() => openExamModal("questions")}
                isLoading={addToExamLoading}
              >
                إضافة {selectedQuestionCount} سؤال
              </Button>
            ) : null}
            {selectedPassageIds.length > 0 ? (
              <Button
                size="sm"
                colorScheme="orange"
                variant="outline"
                leftIcon={<FaClipboardList />}
                borderRadius="xl"
                onClick={() => openExamModal("passages")}
              >
                إضافة {selectedPassageIds.length} قطعة
              </Button>
            ) : null}
          </LibraryToolbar>

          {lessonLoading ? (
            <LibraryLoadingState />
          ) : (
            <>
              <LibraryFilterPanel
                hint={`${standaloneQuestions.length} سؤال مستقل · ${passages.length} قطعة · تحديد سؤال من قطعة يحدد كل أسئلة القطعة`}
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
                      bg={filterInputBg}
                      border="none"
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
                    bg={filterInputBg}
                    border="none"
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
                      isDisabled={selectedQuestionCount === 0}
                    >
                      مسح
                    </Button>
                  </HStack>
                </SimpleGrid>
              </LibraryFilterPanel>

                  {selectedQuestionCount > 0 ? (
                    <Flex
                      gap={3}
                      flexWrap="wrap"
                      align="center"
                      p={4}
                      bgGradient="linear(to-l, blue.500, orange.500)"
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
                        {selectedQuestionCount} محدد
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
                        bg="orange.500"
                        color="white"
                        leftIcon={<FaClipboardList />}
                        borderRadius="lg"
                        _hover={{ bg: "orange.400" }}
                        isDisabled={selectedQuestionCount === 0}
                        isLoading={addToExamLoading}
                        onClick={() => openExamModal("questions")}
                      >
                        إضافة للامتحان
                      </Button>
                    </Flex>
                  ) : null}

                  <LibraryContentSection
                    title="أسئلة مستقلة"
                    count={
                      filteredStandaloneQuestions.length !== standaloneQuestions.length
                        ? `${filteredStandaloneQuestions.length} / ${standaloneQuestions.length}`
                        : filteredStandaloneQuestions.length
                    }
                  >
                    {filteredStandaloneQuestions.length > 0 ? (
                      <Flex justify="flex-end" mb={3}>
                        <Button
                          size="xs"
                          variant="outline"
                          colorScheme="blue"
                          borderRadius="lg"
                          onClick={toggleStandaloneSectionSelection}
                        >
                          تحديد / إلغاء هذا القسم
                        </Button>
                      </Flex>
                    ) : null}
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
                            isSelected={selectedQuestions.has(q.id)}
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
                  </LibraryContentSection>

                  <LibraryContentSection
                    title="قطع القراءة"
                    badgeColorScheme="orange"
                    count={
                      filteredPassages.length !== passages.length
                        ? `${filteredPassages.length} / ${passages.length}`
                        : filteredPassages.length
                    }
                  >
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
                            selectedQuestions={selectedQuestions}
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
                  </LibraryContentSection>

                  {selectedQuestionCount > 0 && (
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
                        isDisabled={selectedQuestionCount === 0}
                        onClick={() => openExamModal("questions")}
                      >
                        {selectedQuestionCount > 0
                          ? `إضافة ${selectedQuestionCount} سؤال للامتحان`
                          : "اختر أسئلة أولاً"}
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </>
          )}
    </LibraryPageShell>

      {/* Lesson modal */}
      <Modal isOpen={isLessonModalOpen} onClose={onLessonModalClose} {...libraryModalProps}>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent {...libraryModalContentProps()}>
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
      <Modal isOpen={isBulkOpen} onClose={onBulkClose} size="xl" scrollBehavior="inside" isCentered>
        <ModalOverlay />
        <ModalContent {...libraryModalContentProps()}>
          <ModalHeader fontSize="md">إضافة جماعية لأسئلة المكتبة</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={3}>
              <Box
                p={3}
                borderRadius="lg"
                bg={filterInputBg}
                borderWidth="1px"
                borderColor={borderColor}
                fontSize="sm"
                color={muted}
                lineHeight="1.8"
              >
                <Text fontWeight="700" color={textColor} mb={1}>
                  التنسيق: كل سؤال كتلة مفصولة بسطر فارغ
                </Text>
                <Text>
                  السطر الأول نص السؤال، ثم أربعة اختيارات. الصيغ المدعومة للاختيار:{" "}
                  <b dir="ltr">A) / A. / A: / A-</b>
                </Text>
                <Text mt={1}>
                  نوع السؤال يُنشأ تلقائياً (اختياري). الإجابة الصحيحة تُحدَّد لاحقاً من بطاقة السؤال.
                </Text>
              </Box>
              <FormControl>
                <FormLabel fontSize="sm">نص الأسئلة (bulk_text)</FormLabel>
                <Textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={14}
                  dir="rtl"
                  fontFamily="monospace"
                  fontSize="sm"
                  placeholder={
                    "ما المقصود بالتيار الكهربائي؟\nA) تدفق الشحنات\nB) قوة المغناطيس\nC) مقاومة الموصل\nD) فرق الجهد\n\nما وحدة قياس المقاومة؟\nA) فولت\nB) أمبير\nC) أوم\nD) واط"
                  }
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={2} onClick={() => { setBulkText(""); onBulkClose(); }}>
              إلغاء
            </Button>
            <Button colorScheme="teal" onClick={addBulkQuestions} isLoading={isAddingBulk} isDisabled={!bulkText.trim()}>
              إضافة الأسئلة
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
        selectedExamIds={selectedExamIds}
        onToggleExamId={toggleSelectedExamId}
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
    </>
  );
};

export default QuestionLibraryLessonPage;
