import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  useColorModeValue,
  Icon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Input,
  FormControl,
  FormLabel,
  Textarea,
  Image,
  IconButton,
  Spinner,
  HStack,
  VStack,
  useToast,
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  Tooltip,
  Container,
  Checkbox,
  Radio,
  RadioGroup,
  Select,
  Divider
} from "@chakra-ui/react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaImage,
  FaCheck,
  FaUpload,
  FaClipboardList,
  FaFileAlt,
  FaTimes,
  FaSearchPlus,
  FaLightbulb,
} from "react-icons/fa";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import baseUrl from "../../api/baseUrl";
import TeacherLibraryExtractionModal from "./components/TeacherLibraryExtractionModal";
import FormattedQuestionText from "../../components/question/FormattedQuestionText";
import {
  LessonEmptyState,
  LessonErrorScreen,
  LessonLoadingScreen,
  LessonModalHeader,
  LessonPageHeader,
} from "./components/LessonPageChrome";
import LessonQuestionCard, { shouldStackChoiceOptions } from "./components/LessonQuestionCard";
import LessonQuestionsToolbar from "./components/LessonQuestionsToolbar";
import {
  fetchTeacherComprehensiveExams,
  fetchTeacherLectureExams,
  teacherQbKeys,
  useInvalidateTeacherQuestionBank,
  useTeacherQbLessonPassages,
  useTeacherQbLessonQuestions,
} from "../../Hooks/teacher/useTeacherQuestionBankQueries";

// دالة لضغط الصور قبل الرفع لتجنب خطأ 413 (Payload Too Large)
const compressImage = (file, maxWidth = 1024, quality = 0.7) => {
  return new Promise((resolve) => {
    if (!file.type.match(/image.*/)) {
      resolve(file);
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // تصغير الأبعاد إذا كانت كبيرة جداً
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // في حال فشل الضغط نرجع الملف الأصلي
              return;
            }
            const newFile = new window.File([blob], file.name, {
              type: mimeType,
              lastModified: Date.now(),
            });
            resolve(newFile);
          },
          mimeType,
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

const Lesson = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const invalidateQb = useInvalidateTeacherQuestionBank();

  const {
    data: cachedQuestions,
    isLoading: questionsLoading,
    error: questionsQueryError,
    refetch: refetchQuestions,
  } = useTeacherQbLessonQuestions(id);

  const {
    data: cachedPassages,
    isLoading: passagesQueryLoading,
    error: passagesQueryError,
    refetch: refetchPassages,
  } = useTeacherQbLessonPassages(id);

  const loading = questionsLoading && cachedQuestions === undefined;
  const error =
    questionsQueryError?.response?.data?.message ||
    questionsQueryError?.message ||
    null;

  // المستخدم مدرس أو أدمن؟
  const [isTeacher, setIsTeacher] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setIsTeacher(user?.role === "teacher");
      setIsAdmin(user?.role === "admin");
    } catch {}
  }, []);

  // وضع التحديد (لإضافة أسئلة للامتحان) — مثل التطبيق
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  // تكبير الصورة
  const [zoomImageUri, setZoomImageUri] = useState(null);
  // عرض نتيجة الإضافة للامتحان
  const { isOpen: isAddSuccessOpen, onOpen: onAddSuccessOpen, onClose: onAddSuccessClose } = useDisclosure();
  const [addSuccessMessage, setAddSuccessMessage] = useState("");
  // إجابات مختارة (عرض تدريبي - يظهر صحيح/خطأ)
  const [selectedAnswers, setSelectedAnswers] = useState({});

  // Data states
  const [questions, setQuestions] = useState([]);
  const [exams, setExams] = useState([]);
  const [comprehensiveExams, setComprehensiveExams] = useState([]);
  const [passagesList, setPassagesList] = useState([]); // [{ passage: {...}, questions: [...] }]
  const passagesLoading = passagesQueryLoading && cachedPassages === undefined;
  const passagesError =
    passagesQueryError?.response?.data?.message ||
    passagesQueryError?.message ||
    null;

  useEffect(() => {
    if (cachedQuestions !== undefined) setQuestions(cachedQuestions || []);
  }, [cachedQuestions]);

  useEffect(() => {
    if (cachedPassages !== undefined) setPassagesList(cachedPassages || []);
  }, [cachedPassages]);

  // Selection states
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [selectedPassageIds, setSelectedPassageIds] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [examModalTab, setExamModalTab] = useState("lecture"); // "lecture" | "comprehensive"
  const [examModalMode, setExamModalMode] = useState("questions"); // "questions" | "passages"

  // Form states
  const [bulkQuestions, setBulkQuestions] = useState("");
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editFormData, setEditFormData] = useState({
    text: '',
    options: ['', '', '', '']
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");

  // New states for image questions
  const [questionType, setQuestionType] = useState("text"); // "text" | "image" | "passage"
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageQuestionText, setImageQuestionText] = useState("");
  const [imageCorrectAnswerIndex, setImageCorrectAnswerIndex] = useState(0);

  // Passage (قطعة) state
  const [passageTitle, setPassageTitle] = useState("");
  const [passageContent, setPassageContent] = useState("");
  const [passageQuestions, setPassageQuestions] = useState([
    { question_text: "", options: ["", "", "", ""], correct_answer_index: 0, explanation: "", difficulty_level: "medium", points: 1 }
  ]);
  const [passageLoading, setPassageLoading] = useState(false);

  // أسئلة صورة فقط (Bulk) — حتى 20 صورة
  const [imageOnlyBulkFiles, setImageOnlyBulkFiles] = useState([]);
  const [imageOnlyBulkPreviewUrls, setImageOnlyBulkPreviewUrls] = useState([]);
  const imageOnlyBulkPreviewUrlsRef = useRef([]);
  const [imageOnlyBulkLoading, setImageOnlyBulkLoading] = useState(false);
  const [imageOnlyBulkResult, setImageOnlyBulkResult] = useState(null);
  const [imageOnlyBulkMetaDefault, setImageOnlyBulkMetaDefault] = useState({ correct_answer_index: 0, difficulty_level: "medium", points: 1 });

  // تحديث الإجابة الصحيحة لسؤال (PATCH correct-answer)
  const [correctAnswerUpdatingId, setCorrectAnswerUpdatingId] = useState(null);


  // Loading states
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [examLoading, setExamLoading] = useState(false);
  const [addToExamLoading, setAddToExamLoading] = useState(false);

  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  const { isOpen: isExamOpen, onOpen: onExamOpen, onClose: onExamClose } = useDisclosure();
  const {
    isOpen: isExtractOpen,
    onOpen: onExtractOpen,
    onClose: onExtractClose,
  } = useDisclosure();

  const [deletingQuestion, setDeletingQuestion] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  // Theme
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const bulkPreviewBg = useColorModeValue("gray.50", "gray.800");
  const textPrimary = useColorModeValue("gray.800", "white");
  const textSecondary = useColorModeValue("gray.500", "gray.400");
  const optionBg = useColorModeValue("gray.50", "gray.700");
  const passageOptionIdleBg = useColorModeValue("gray.50", "gray.700");
  const optionCorrectBg = useColorModeValue("green.50", "green.900");
  const optionCorrectBorder = useColorModeValue("green.200", "green.700");
  const selectedCardBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const optionWrongBg = useColorModeValue("red.50", "red.900");
  const optionLetterBgNeutral = useColorModeValue("gray.300", "gray.600");
  const optionCorrectText = useColorModeValue("green.800", "green.200");
  const optionHoverBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const explanationBg = useColorModeValue("blue.50", "blue.900");
  const panelShadow = useColorModeValue("sm", "dark-lg");
  const mainBg = pageBg;
  const emptyIconBg = optionBg;
  const errorBorderColor = useColorModeValue("red.200", "red.700");
  const errorIconBg = useColorModeValue("red.50", "red.900");
  const optionLetterBg = textSecondary;
  const questionIndexBg = useColorModeValue("blue.500", "blue.600");

  const fetchQuestionsData = async () => {
    await invalidateQb.invalidateLesson(id);
    return refetchQuestions();
  };

  const fetchPassages = async () => refetchPassages();

  // جلب امتحانات المحاضرة (مع كاش)
  const fetchLectureExams = async () => {
    try {
      const examsData = await queryClient.fetchQuery({
        queryKey: teacherQbKeys.lectureExams(),
        queryFn: fetchTeacherLectureExams,
        staleTime: 2 * 60 * 1000,
      });
      setExams(examsData || []);
    } catch (err) {
      console.error("Error fetching lecture exams:", err);
      setExams([]);
      toast({ title: "خطأ", description: "فشل تحميل امتحانات المحاضرة", status: "error", isClosable: true });
    }
  };

  // جلب الامتحانات الشاملة (كورس) — مع كاش
  const fetchComprehensiveExams = async () => {
    try {
      const examsData = await queryClient.fetchQuery({
        queryKey: teacherQbKeys.comprehensiveExams(),
        queryFn: fetchTeacherComprehensiveExams,
        staleTime: 2 * 60 * 1000,
      });
      setComprehensiveExams(examsData || []);
    } catch (err) {
      console.error("Error fetching comprehensive exams:", err);
      setComprehensiveExams([]);
      toast({ title: "خطأ", description: "فشل تحميل الامتحانات الشاملة", status: "error", isClosable: true });
    }
  };

  const fetchExams = async () => {
    setExamLoading(true);
    await Promise.all([fetchLectureExams(), fetchComprehensiveExams()]);
    setExamLoading(false);
  };

  // Parse bulk text questions
  const parseBulkQuestions = (text) => {
    const questions = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    let currentQuestion = null;
    let currentOptions = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.match(/^[A-D]\)/)) {
        if (currentQuestion && currentOptions.length === 4) {
          questions.push({
            question_text: currentQuestion,
            options: currentOptions.map((opt, idx) => ({ option_index: idx, option_type: "text", text_content: opt })),
            correct_answer_index: 0,
            difficulty_level: "medium",
            points: 1
          });
        }
        currentQuestion = line;
        currentOptions = [];
      } else {
        const optionText = line.replace(/^[A-D]\)\s*/, '');
        if (optionText) currentOptions.push(optionText);
      }
    }

    if (currentQuestion && currentOptions.length === 4) {
      questions.push({
        question_text: currentQuestion,
        options: currentOptions.map((opt, idx) => ({ option_index: idx, option_type: "text", text_content: opt })),
        correct_answer_index: 0,
        difficulty_level: "medium",
        points: 1
      });
    }
    return questions;
  };

  // Create bulk questions (اختيار من متعدد دفعة واحدة - مع الإجابة الصحيحة)
  // API: POST /api/lesson-questions/lessons/:lessonId/questions/bulk
  const createBulkQuestions = async () => {
    const trimmed = (bulkQuestions || "").trim();
    if (!trimmed) {
      toast({ title: "خطأ", description: "اكتب نص الأسئلة أولاً.", status: "error", duration: 3000, isClosable: true });
      return { success: false };
    }
    try {
      setSubmitLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast({ title: "خطأ", description: "يجب تسجيل الدخول أولاً", status: "error", duration: 3000, isClosable: true });
        return { success: false };
      }

      const response = await baseUrl.post(
        `/api/lesson-questions/lessons/${id}/questions/bulk`,
        { bulk_text: trimmed },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      if (response.data?.success && response.data?.data?.questions) {
        const raw = response.data.data.questions;
        const letterToIndex = (letter) => {
          const L = (letter || "").toString().trim().toUpperCase();
          if (L === "A" || L === "أ") return 0;
          if (L === "B" || L === "ب") return 1;
          if (L === "C" || L === "ج") return 2;
          if (L === "D" || L === "د") return 3;
          return 0;
        };
        const newQuestions = raw.map((q) => ({
          id: q.id,
          question_text: q.text ?? q.question_text,
          text: q.text ?? q.question_text,
          options: Array.isArray(q.options) ? q.options.map((o) => (typeof o === "string" ? o : (o?.text_content ?? o))) : [],
          correct_answer_index: typeof q.correct_answer !== "undefined" ? letterToIndex(q.correct_answer) : (q.correct_answer_index ?? 0)
        }));
        setQuestions((prev) => [...prev, ...newQuestions]);
        const msg = response.data.message || `تمت إضافة ${response.data.data.inserted ?? newQuestions.length} سؤال/أسئلة`;
        toast({ title: "نجح", description: msg, status: "success", duration: 3000, isClosable: true });
        return { success: true };
      }
      toast({ title: "نجح", description: response.data?.message || "تمت إضافة الأسئلة", status: "success", duration: 3000, isClosable: true });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "حدث خطأ في إنشاء الأسئلة";
      toast({ title: "خطأ", description: errorMessage, status: "error", duration: 3000, isClosable: true });
      return { success: false };
    } finally {
      setSubmitLoading(false);
    }
  };

  // Create image question
  const createImageChoicesQuestion = async (questionText, correctAnswerIndex) => {
    try {
      setSubmitLoading(true);
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append('question_text', questionText || 'اختر الإجابة الصحيحة');
      formData.append('lesson_id', id);
      formData.append('correct_answer_index', correctAnswerIndex || 0);
      formData.append('difficulty_level', 'medium');
      formData.append('points', '2');

      selectedImages.forEach((image, index) => {
        formData.append(`option_${index}`, image);
      });

      const response = await baseUrl.post(`/api/question-bank-v2/image-choices`, formData, {
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });

      if (response.data.success && response.data.data) {
        setQuestions(prev => [...prev, response.data.data]);
      }

      toast({ title: "نجح", description: "تم إنشاء السؤال الصوري بنجاح", status: "success", duration: 3000, isClosable: true });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "حدث خطأ";
      toast({ title: "خطأ", description: errorMessage, status: "error", duration: 3000, isClosable: true });
      return { success: false };
    } finally {
      setSubmitLoading(false);
    }
  };

  // Create passage (إضافة قطعة) — POST /api/question-bank-v2/passages
  const createPassage = async () => {
    const contentTrimmed = (passageContent || "").trim();
    if (!contentTrimmed) {
      toast({ title: "خطأ", description: "أدخل نص القطعة أولاً.", status: "error", duration: 3000, isClosable: true });
      return { success: false };
    }
    const validQuestions = passageQuestions.filter(
      (q) => (q.question_text || "").trim() && q.options.every((o) => (o || "").trim())
    );
    if (validQuestions.length === 0) {
      toast({ title: "خطأ", description: "أضف سؤالاً واحداً على الأقل مع نص السؤال والأربعة خيارات.", status: "error", duration: 3000, isClosable: true });
      return { success: false };
    }
    try {
      setPassageLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast({ title: "خطأ", description: "يجب تسجيل الدخول أولاً", status: "error", duration: 3000, isClosable: true });
        return { success: false };
      }
      const body = {
        lesson_id: Number(id),
        title: (passageTitle || "").trim() || undefined,
        content: contentTrimmed,
        questions: validQuestions.map((q) => ({
          question_text: (q.question_text || "").trim(),
          options: (q.options || ["", "", "", ""]).map((text, idx) => ({
            option_index: idx,
            option_type: "text",
            text_content: (text || "").trim()
          })),
          correct_answer_index: Number(q.correct_answer_index) || 0,
          explanation: (q.explanation || "").trim() || undefined,
          difficulty_level: q.difficulty_level || "medium",
          points: Number(q.points) || 1
        }))
      };
      const response = await baseUrl.post("/api/question-bank-v2/passages", body, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      });
      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        const newQuestions = Array.isArray(data.questions) ? data.questions : (data.passage?.questions || []);
        const normalized = newQuestions.map((q) => ({
          id: q.id,
          question_text: q.question_text ?? q.text,
          text: q.question_text ?? q.text,
          options: Array.isArray(q.options)
            ? q.options.map((o) => (typeof o === "string" ? o : (o?.text_content ?? o)))
            : [],
          correct_answer_index: q.correct_answer_index ?? 0
        }));
        setQuestions((prev) => [...prev, ...normalized]);
        fetchPassages();
        toast({ title: "نجح", description: `تمت إضافة القطعة و${normalized.length} سؤال.`, status: "success", duration: 3000, isClosable: true });
        return { success: true };
      }
      fetchPassages();
      toast({ title: "نجح", description: response.data?.message || "تمت إضافة القطعة", status: "success", duration: 3000, isClosable: true });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "حدث خطأ في إضافة القطعة";
      toast({ title: "خطأ", description: errorMessage, status: "error", duration: 3000, isClosable: true });
      return { success: false };
    } finally {
      setPassageLoading(false);
    }
  };

  // Update question
  const updateQuestion = async (formData) => {
    try {
      setEditLoading(true);
      const token = localStorage.getItem("token");

      const requestData = {
        question_text: formData.text,
        options: formData.options.map((opt, idx) => ({
          option_index: idx,
          option_type: "text",
          text_content: opt
        })).filter(opt => opt.text_content.trim() !== '')
      };

      let response;
      try {
        response = await baseUrl.put(`/api/question-bank-v2/${editingQuestion.id}`, requestData, {
          headers: { "Authorization": `Bearer ${token}` }
        });
      } catch (err) {
        throw err;
      }

      if (response.data.success) {
        setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? { ...q, question_text: formData.text, options: formData.options } : q));
      }

      toast({ title: "نجح", description: "تم تحديث السؤال بنجاح", status: "success", duration: 3000, isClosable: true });
      return { success: true };
    } catch (error) {
      toast({ title: "خطأ", description: "فشل التحديث", status: "error", duration: 3000, isClosable: true });
      return { success: false };
    } finally {
      setEditLoading(false);
    }
  };

  const deleteQuestion = async () => {
    try {
      setDeleteLoading(true);
      const token = localStorage.getItem("token");
      await baseUrl.delete(`/api/question-bank-v2/${deletingQuestion.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      setQuestions(prev => prev.filter(q => q.id !== deletingQuestion.id));
      setSelectedQuestions(prev => prev.filter(id => id !== deletingQuestion.id));
      toast({ title: "نجح", description: "تم الحذف", status: "success", duration: 3000, isClosable: true });
      return { success: true };
    } catch (error) {
      toast({ title: "خطأ", description: "فشل الحذف", status: "error", duration: 3000, isClosable: true });
      return { success: false };
    } finally {
      setDeleteLoading(false);
    }
  };

  const uploadImage = async () => {
    try {
      setImageLoading(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("media", selectedImage);
      formData.append("media_type", "image");

      const response = await baseUrl.post(`/api/question-bank-v2/${currentQuestion.id}/media`, formData, {
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });

      if (response.data.success) {
        setQuestions(prev => prev.map(q => q.id === currentQuestion.id ? { ...q, media: response.data.data } : q));
      }
      toast({ title: "نجح", description: "تم رفع الصورة", status: "success", duration: 3000, isClosable: true });
      return { success: true };
    } catch (error) {
      return { success: false };
    } finally {
      setImageLoading(false);
    }
  };

  // إضافة الأسئلة من بنك الأسئلة إلى الامتحان
  // امتحان محاضرة: POST /api/exams/:examId/questions/from-bank → يُنشئ نسخة داخل الامتحان، الاستجابة تحتوي examQuestionIds
  // امتحان كورس: نفس الـ endpoint (تمييز تلقائي) أو POST /api/exams/course-level/:examId/questions/from-bank
  const handleAddQuestionsToExam = async () => {
    if (!selectedExamId) {
      toast({ title: "تنبيه", description: "الرجاء اختيار امتحان", status: "warning" });
      return;
    }
    if (!selectedQuestions.length) {
      toast({ title: "تنبيه", description: "الرجاء اختيار أسئلة من البنك", status: "warning" });
      return;
    }

    try {
      setAddToExamLoading(true);
      const token = localStorage.getItem("token");

      const body = examModalTab === "comprehensive"
        ? { questionIds: selectedQuestions, type: "course-exam" }
        : { questionIds: selectedQuestions };

      const response = await baseUrl.post(
        `/api/exams/${selectedExamId}/questions/from-bank`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      const data = response.data;
      const count = data?.count ?? selectedQuestions.length;
      const message = data?.message || `تم إضافة ${count} سؤال للامتحان بنجاح`;

      setAddSuccessMessage(message);
      onExamClose();
      setSelectedQuestions([]);
      setSelectedExamId("");
      setIsSelectionMode(false);
      onAddSuccessOpen();
    } catch (err) {
      console.error("Error adding questions to exam:", err);
      const msg = err.response?.data?.message || "حدث خطأ أثناء إضافة الأسئلة للامتحان";
      toast({ title: "خطأ", description: msg, status: "error", isClosable: true });
    } finally {
      setAddToExamLoading(false);
    }
  };

  const handleToggleSelectId = (id) => {
    setSelectedQuestions(prev => {
      if (prev.includes(id)) return prev.filter(qId => qId !== id);
      return [...prev, id];
    });
  };

  // تبديل وضع التحديد (مثل التطبيق)
  const toggleSelectionMode = () => {
    setIsSelectionMode((prev) => !prev);
    setSelectedQuestions([]);
  };

  // اختيار إجابة للعرض التدريبي (يظهر صحيح/خطأ)
  const handleSelectAnswer = (questionId, optionIndex) => {
    if (isSelectionMode) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  // ألوان ونصوص الحالة والصعوبة (مطابقة للتطبيق)
  const getStatusColor = (status) => {
    switch (status) {
      case "approved": return "green.500";
      case "rejected": return "red.500";
      case "pending": return "orange.500";
      default: return "gray.500";
    }
  };
  const getStatusText = (status) => {
    switch (status) {
      case "approved": return "موافق عليه";
      case "rejected": return "مرفوض";
      case "pending": return "قيد المراجعة";
      default: return status || "—";
    }
  };
  const getDifficultyColor = (level) => {
    switch (level) {
      case "easy": return "green.500";
      case "hard": return "red.500";
      default: return "blue.500";
    }
  };
  const getDifficultyText = (level) => {
    switch (level) {
      case "easy": return "سهل";
      case "hard": return "صعب";
      default: return "متوسط";
    }
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map(q => q.id));
    }
  };

  // (lesson questions/passages cached via React Query)

  // Handlers
  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (questionType === "text") {
      if (!bulkQuestions.trim()) return;
      const result = await createBulkQuestions();
      if (result.success) { onClose(); resetBulkForm(); }
      return;
    }
    if (questionType === "image") {
      if (selectedImages.length !== 4) return;
      const result = await createImageChoicesQuestion(imageQuestionText, imageCorrectAnswerIndex);
      if (result.success) { onClose(); resetBulkForm(); }
      return;
    }
    if (questionType === "passage") {
      const result = await createPassage();
      if (result.success) { onClose(); resetBulkForm(); }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const result = await updateQuestion(editFormData);
    if (result.success) { onEditClose(); resetEditForm(); }
  };

  const handleImageSubmit = async () => {
    const result = await uploadImage();
    if (result.success) { onImageClose(); removeImage(); setCurrentQuestion(null); }
  };

  const handleOpenExamModal = () => {
    if (examModalMode === "questions" && selectedQuestions.length === 0) {
      toast({ title: "تنبيه", description: "اختر أسئلة أولاً", status: "info" });
      return;
    }
    if (examModalMode === "passages" && selectedPassageIds.length === 0) {
      toast({ title: "تنبيه", description: "اختر قطعاً أولاً", status: "info" });
      return;
    }
    setSelectedExamId("");
    setExamModalTab("lecture");
    fetchExams();
    onExamOpen();
  };

  const handleOpenPassagesToExamModal = () => {
    if (selectedPassageIds.length === 0) {
      toast({ title: "تنبيه", description: "اختر قطعاً من تبويب أسئلة القطع", status: "info" });
      return;
    }
    setExamModalMode("passages");
    setSelectedExamId("");
    setExamModalTab("lecture");
    fetchExams();
    onExamOpen();
  };

  const handleAddPassagesToExam = async () => {
    if (!selectedExamId) {
      toast({ title: "تنبيه", description: "الرجاء اختيار امتحان", status: "warning" });
      return;
    }
    try {
      setAddToExamLoading(true);
      const token = localStorage.getItem("token");
      let lastMessage = "تم إضافة القطع للامتحان بنجاح";
      for (const passageId of selectedPassageIds) {
        const res = await baseUrl.post(
          `/api/exams/${selectedExamId}/questions/from-bank/passage`,
          { passageId: Number(passageId) },
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );
        if (res.data?.message) lastMessage = res.data.message;
      }
      toast({ title: "نجح", description: lastMessage, status: "success", isClosable: true });
      onExamClose();
      setSelectedPassageIds([]);
      setExamModalMode("questions");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "فشل في إضافة القطع للامتحان";
      toast({ title: "خطأ", description: msg, status: "error", isClosable: true });
    } finally {
      setAddToExamLoading(false);
    }
  };

  const handleTogglePassageId = (passageId) => {
    setSelectedPassageIds((prev) =>
      prev.includes(passageId) ? prev.filter((id) => id !== passageId) : [...prev, passageId]
    );
  };

  const resetBulkForm = () => {
    setBulkQuestions("");
    setQuestionType("text");
    setSelectedImages([]);
    setImagePreviews([]);
    setImageQuestionText("");
    setImageCorrectAnswerIndex(0);
    setPassageTitle("");
    setPassageContent("");
    setPassageQuestions([{ question_text: "", options: ["", "", "", ""], correct_answer_index: 0, explanation: "", difficulty_level: "medium", points: 1 }]);
    imageOnlyBulkPreviewUrlsRef.current.forEach(URL.revokeObjectURL);
    imageOnlyBulkPreviewUrlsRef.current = [];
    setImageOnlyBulkPreviewUrls([]);
    setImageOnlyBulkFiles([]);
    setImageOnlyBulkResult(null);
    setImageOnlyBulkMetaDefault({ correct_answer_index: 0, difficulty_level: "medium", points: 1 });
  };

  const removeBulkImageAtIndex = (index) => {
    URL.revokeObjectURL(imageOnlyBulkPreviewUrls[index]);
    imageOnlyBulkPreviewUrlsRef.current = imageOnlyBulkPreviewUrlsRef.current.filter((_, i) => i !== index);
    setImageOnlyBulkPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setImageOnlyBulkFiles((prev) => prev.filter((_, i) => i !== index));
    setImageOnlyBulkResult(null);
  };

  const handleUpdateCorrectAnswer = async (questionId, correct_answer_index) => {
    if (correct_answer_index < 0 || correct_answer_index > 3) return;
    setCorrectAnswerUpdatingId(questionId);
    try {
      const token = localStorage.getItem("token");
      const res = await baseUrl.patch(
        `api/question-bank-v2/${questionId}/correct-answer`,
        { correct_answer_index: Number(correct_answer_index) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.success) {
        setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, correct_answer_index: Number(correct_answer_index) } : q)));
        toast({ title: res.data?.message || "تم تحديث الإجابة الصحيحة بنجاح", status: "success", duration: 3000, isClosable: true });
      } else {
        toast({ title: res.data?.message || "فشل التحديث", status: "error", duration: 3000, isClosable: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "حدث خطأ أثناء تحديث الإجابة الصحيحة";
      toast({ title: "خطأ", description: msg, status: "error", duration: 4000, isClosable: true });
    } finally {
      setCorrectAnswerUpdatingId(null);
    }
  };

  // إضافة أسئلة صورة فقط (Bulk) — POST image-only-bulk
  const handleImageOnlyBulkSubmit = async () => {
    if (!imageOnlyBulkFiles.length || !id) {
      toast({ title: "اختر صوراً أولاً (حتى 20)", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    if (imageOnlyBulkFiles.length > 20) {
      toast({ title: "الحد الأقصى 20 صورة", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    setImageOnlyBulkLoading(true);
    setImageOnlyBulkResult(null);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      imageOnlyBulkFiles.forEach((file) => formData.append("images", file));
      const meta = imageOnlyBulkFiles.map(() => ({
        correct_answer_index: imageOnlyBulkMetaDefault.correct_answer_index,
        difficulty_level: imageOnlyBulkMetaDefault.difficulty_level,
        points: Number(imageOnlyBulkMetaDefault.points) || 1,
      }));
      formData.append("meta", JSON.stringify(meta));
      const res = await baseUrl.post(
        `api/question-bank-v2/lesson/${id}/questions/image-only-bulk`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = res.data;
      if (data?.success && data?.data) {
        const { added = 0, failed = 0, questions = [], errors = [] } = data.data;
        setImageOnlyBulkResult({ added, failed, questions, errors });
        if (failed === 0) {
          toast({ title: data?.message || `تمت إضافة ${added} سؤال بنجاح`, status: "success", duration: 5000, isClosable: true });
          fetchQuestionsData();
          setImageOnlyBulkFiles([]);
        } else {
          toast({ title: data?.message || `تمت إضافة ${added}، وفشل ${failed}`, status: "warning", duration: 5000, isClosable: true });
          fetchQuestionsData();
        }
      } else {
        toast({ title: data?.message || "فشل الرفع", status: "error", duration: 3000, isClosable: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "حدث خطأ أثناء رفع الصور";
      toast({ title: "خطأ في الرفع", description: msg, status: "error", duration: 4000, isClosable: true });
    } finally {
      setImageOnlyBulkLoading(false);
    }
  };

  const addPassageQuestion = () => {
    setPassageQuestions((prev) => [...prev, { question_text: "", options: ["", "", "", ""], correct_answer_index: 0, explanation: "", difficulty_level: "medium", points: 1 }]);
  };

  const updatePassageQuestion = (index, field, value) => {
    setPassageQuestions((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      if (field === "options") next[index] = { ...next[index], options: value };
      else next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removePassageQuestion = (index) => {
    setPassageQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const resetEditForm = () => { setEditFormData({ text: '', options: ['', '', '', ''] }); };
  const removeImage = () => { setSelectedImage(null); setImagePreview(null); };

  if (loading && questions.length === 0) {
    return <LessonLoadingScreen />;
  }

  if (error && questions.length === 0) {
    return <LessonErrorScreen error={error} onRetry={fetchQuestionsData} />;
  }

  return (
    <Box minH="100vh" bg={pageBg} dir="rtl" pb={24}>
      <ScrollToTop />
      <Container maxW="1200px" px={{ base: 3, md: 5 }} py={{ base: 4, md: 6 }}>
        <LessonPageHeader
          lessonId={id}
          questionsCount={questions.length}
          passagesCount={passagesList.length}
          isSelectionMode={isSelectionMode}
          selectedCount={selectedQuestions.length}
          isAdmin={isAdmin}
          isTeacher={isTeacher}
          onAddQuestions={onOpen}
          onAddImageQuestion={() => {
            setQuestionType("image");
            onOpen();
          }}
          onExtract={onExtractOpen}
          onToggleSelection={toggleSelectionMode}
        />

        {/* Tabs: الأسئلة العادية | أسئلة القطع */}
        <Tabs variant="enclosed" colorScheme="blue" mb={6}>
          <TabList bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={cardBorder} p={1} boxShadow={panelShadow}>
            <Tab borderRadius="lg" fontWeight="semibold" fontSize="sm">
              الأسئلة ({questions.length})
            </Tab>
            <Tab borderRadius="lg" fontWeight="semibold" fontSize="sm">
              القطع ({passagesList.length})
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={{ base: 0, md: 0 }} pt={4}>
              {questions.length > 0 ? (
                <Box>
                  <LessonQuestionsToolbar
                    total={questions.length}
                    isSelectionMode={isSelectionMode}
                    selectedCount={selectedQuestions.length}
                    canManage={isAdmin}
                    onSelectAll={handleSelectAll}
                    allSelected={selectedQuestions.length === questions.length && questions.length > 0}
                  />
                  <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={3}>
                    {questions.map((question, index) => (
                      <LessonQuestionCard
                        key={question.id}
                        question={question}
                        index={index}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedQuestions.includes(question.id)}
                        onToggleSelect={handleToggleSelectId}
                        canManage={isAdmin}
                        selectedAnswerIndex={selectedAnswers[question.id]}
                        correctAnswerUpdatingId={correctAnswerUpdatingId}
                        onSelectAnswer={handleSelectAnswer}
                        onUpdateCorrectAnswer={handleUpdateCorrectAnswer}
                        onEdit={() => {
                          setEditingQuestion(question);
                          const opts = question.options
                            ? question.options.map((o) =>
                                typeof o === "string" ? o : o.text_content || o.image_url,
                              )
                            : [];
                          setEditFormData({
                            text: question.question_text || question.text || "",
                            options: opts.length === 4 ? opts : ["", "", "", ""],
                          });
                          onEditOpen();
                        }}
                        onImage={() => {
                          setCurrentQuestion(question);
                          setImagePreview(question.media?.media_url || question.image);
                          onImageOpen();
                        }}
                        onDelete={() => {
                          setDeletingQuestion(question);
                          onDeleteOpen();
                        }}
                        onZoomImage={setZoomImageUri}
                        getStatusText={getStatusText}
                        getDifficultyText={getDifficultyText}
                      />
                    ))}
                  </SimpleGrid>
                </Box>
              ) : (
                <LessonEmptyState
                  title="لا توجد أسئلة"
                  subtitle="لم يُضف أي سؤال لهذا الدرس بعد. يمكنك الإضافة يدوياً أو عبر استخراج OCR."
                  actionLabel={isAdmin ? "إضافة سؤال" : undefined}
                  onAction={isAdmin ? onOpen : undefined}
                />
              )}
            </TabPanel>
            <TabPanel px={0} pt={4}>
              {passagesLoading ? (
                <Flex justify="center" align="center" minH="320px" bg={cardBg} borderRadius="2xl" borderWidth="1px" borderColor={cardBorder} p={8}>
                  <VStack spacing={4}>
                    <Spinner size="xl" color="blue.500" thickness="3px" />
                    <Text color={textSecondary}>جاري تحميل أسئلة القطع...</Text>
                  </VStack>
                </Flex>
              ) : passagesError ? (
                <Flex direction="column" align="center" justify="center" minH="320px" bg={cardBg} borderRadius="2xl" borderWidth="2px" borderColor={errorBorderColor} p={8} textAlign="center">
                  <Box w="14" h="14" borderRadius="full" bg={errorIconBg} display="flex" alignItems="center" justifyContent="center" mb={4}>
                    <Icon as={FaFileAlt} color="red.500" boxSize={6} />
                  </Box>
                  <Text color={textPrimary} fontWeight="600" mb={2}>فشل تحميل أسئلة القطع</Text>
                  <Text color={textSecondary} fontSize="sm" mb={4}>{passagesError}</Text>
                  <Button colorScheme="blue" size="sm" onClick={fetchPassages}>إعادة المحاولة</Button>
                </Flex>
              ) : passagesList.length === 0 ? (
                <LessonEmptyState
                  title="لا توجد قطع"
                  subtitle={isAdmin ? "من «إضافة أسئلة» اختر تبويب «إضافة قطعة» لإدخال نص القطعة وأسئلتها." : "لم تُضف قطع لهذا الدرس بعد."}
                  actionLabel={isAdmin ? "إضافة قطعة" : undefined}
                  onAction={isAdmin ? onOpen : undefined}
                  icon={FaFileAlt}
                />
              ) : (
                <VStack align="stretch" spacing={6}>
                  {isTeacher && passagesList.length > 0 && (
                    <Flex justify="flex-end" w="full">
                      <Button
                        size="sm"
                        colorScheme="orange"
                        leftIcon={<Icon as={FaClipboardList} />}
                        onClick={handleOpenPassagesToExamModal}
                        isDisabled={selectedPassageIds.length === 0}
                      >
                        إضافة القطع المحددة للامتحان ({selectedPassageIds.length})
                      </Button>
                    </Flex>
                  )}
                  {passagesList.map((item, pIdx) => {
                    const passage = item.passage || {};
                    const qList = item.questions || [];
                    const passageId = passage.id;
                    const isPassageSelected = passageId != null && selectedPassageIds.includes(passageId);
                    return (
                      <Card
                        key={passage.id || pIdx}
                        bg={isPassageSelected ? selectedCardBg : cardBg}
                        borderRadius="xl"
                        overflow="hidden"
                        boxShadow={panelShadow}
                        borderWidth="1px"
                        borderColor={isPassageSelected ? "blue.400" : cardBorder}
                        cursor={isTeacher ? "pointer" : "default"}
                        onClick={() => isTeacher && passageId != null && handleTogglePassageId(passageId)}
                        _hover={isTeacher ? { borderColor: "blue.300" } : undefined}
                      >
                        <CardHeader bg={optionBg} borderBottomWidth="1px" borderColor={borderColor} py={4}>
                          <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                            <HStack spacing={3}>
                              {isTeacher && passageId != null && (
                                <Checkbox
                                  isChecked={isPassageSelected}
                                  onChange={() => handleTogglePassageId(passageId)}
                                  onClick={(e) => e.stopPropagation()}
                                  size="md"
                                  colorScheme="blue"
                                />
                              )}
                              <Badge colorScheme="blue" borderRadius="lg" px={3} py={1} fontSize="sm" fontWeight="bold">قطعة {pIdx + 1}</Badge>
                              {passage.title && (
                                <Text fontWeight="700" color={textPrimary} fontSize="lg">{passage.title}</Text>
                              )}
                            </HStack>
                            <Badge colorScheme="teal" variant="subtle" fontSize="xs">{qList.length} سؤال</Badge>
                          </Flex>
                        </CardHeader>
                        <CardBody py={4}>
                          {passage.content && (
                            <Box mb={5} p={4} bg={mainBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
                              <FormattedQuestionText
                                value={passage.content}
                                fontSize="sm"
                                color={textSecondary}
                                whiteSpace="pre-wrap"
                                lineHeight="1.8"
                              />
                            </Box>
                          )}
                          <VStack align="stretch" spacing={4}>
                            {qList.map((q, qIdx) => {
                              const opts = q.options || [];
                              const optContent = (o) => (typeof o === "string" ? o : (o?.text_content ?? o));
                              const passageLetters = ["أ", "ب", "ج", "د"];
                              const stackPassageOptions = shouldStackChoiceOptions(opts);
                              return (
                                <Box
                                  key={q.id || qIdx}
                                  p={{ base: 4, md: 5 }}
                                  bg={cardBg}
                                  borderRadius="xl"
                                  borderWidth="1px"
                                  borderColor={borderColor}
                                  boxShadow="sm"
                                >
                                  <Flex align="start" gap={3} mb={4}>
                                    <Flex
                                      w={8}
                                      h={8}
                                      borderRadius="lg"
                                      bg="blue.500"
                                      color="white"
                                      align="center"
                                      justify="center"
                                      fontSize="sm"
                                      fontWeight="bold"
                                      flexShrink={0}
                                    >
                                      {qIdx + 1}
                                    </Flex>
                                    <FormattedQuestionText
                                      value={q.question_text || q.text}
                                      fontWeight="semibold"
                                      color={textPrimary}
                                      fontSize="md"
                                      lineHeight="1.8"
                                      flex={1}
                                    />
                                  </Flex>
                                  <SimpleGrid
                                    columns={stackPassageOptions ? 1 : { base: 1, md: 2 }}
                                    spacing={stackPassageOptions ? 2.5 : 2}
                                  >
                                    {opts.map((opt, oIdx) => {
                                      const isCorrect = q.correct_answer_index === oIdx;
                                      const content = optContent(opt);
                                      const letter = passageLetters[oIdx] || String.fromCharCode(65 + oIdx);
                                      return (
                                        <Flex
                                          key={oIdx}
                                          align="center"
                                          gap={2}
                                          p={2.5}
                                          bg={isCorrect ? optionCorrectBg : passageOptionIdleBg}
                                          borderRadius="lg"
                                          borderWidth="1px"
                                          borderColor={isCorrect ? optionCorrectBorder : borderColor}
                                        >
                                          <Flex
                                            w={8}
                                            h={8}
                                            flexShrink={0}
                                            borderRadius="md"
                                            bg={isCorrect ? "green.500" : "white"}
                                            color={isCorrect ? "white" : "blue.600"}
                                            borderWidth="1px"
                                            borderColor={isCorrect ? "green.500" : "blue.200"}
                                            align="center"
                                            justify="center"
                                            fontSize="sm"
                                            fontWeight="bold"
                                          >
                                            {letter}
                                          </Flex>
                                          <FormattedQuestionText
                                            value={content}
                                            fontSize="sm"
                                            color={isCorrect ? optionCorrectText : textSecondary}
                                            flex={1}
                                          />
                                          {isCorrect && <Icon as={FaCheck} color="green.500" boxSize={4} flexShrink={0} />}
                                        </Flex>
                                      );
                                    })}
                                  </SimpleGrid>
                                </Box>
                              );
                            })}
                          </VStack>
                        </CardBody>
                      </Card>
                    );
                  })}
                </VStack>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>

      {/* FAB — إضافة للامتحان (مثل التطبيق) */}
      {isSelectionMode && selectedQuestions.length > 0 && (
        <Box position="fixed" bottom={6} left={{ base: 4, md: 20 }} right={{ base: 4, md: 20 }} zIndex={100} maxW="400px" mx="auto">
          <Button
            w="full"
            size="lg"
            colorScheme="blue"
            leftIcon={<Icon as={FaClipboardList} />}
            fontWeight="bold"
            borderRadius="2xl"
            boxShadow="lg"
            _hover={{ transform: "translateY(-2px)", boxShadow: "xl" }}
            onClick={() => { setExamModalMode("questions"); fetchExams(); onExamOpen(); }}
          >
            إضافة {selectedQuestions.length} سؤال للامتحان
          </Button>
        </Box>
      )}

      {/* --- ADD TO EXAM MODAL (مدرس) — امتحان محاضرة | امتحان شامل، أسئلة أو قطع --- */}
      {isTeacher && (
        <Modal isOpen={isExamOpen} onClose={() => { onExamClose(); setExamModalMode("questions"); }} size="lg" isCentered>
          <ModalOverlay backdropFilter="blur(6px)" bg="blackAlpha.600" />
          <ModalContent borderRadius="2xl" boxShadow={panelShadow} borderWidth="1px" borderColor={cardBorder} overflow="hidden">
            <LessonModalHeader title={examModalMode === "passages" ? "إضافة القطع للامتحان" : "إضافة الأسئلة للامتحان"} />
            <ModalCloseButton top={3} />
            <ModalBody py={4}>
              <Tabs index={examModalTab === "lecture" ? 0 : 1} onChange={(i) => setExamModalTab(i === 0 ? "lecture" : "comprehensive")} variant="soft-rounded" colorScheme="blue" mb={4}>
                <TabList bg="gray.100" p={1} borderRadius="xl">
                  <Tab fontSize="sm" fontWeight="600">امتحان محاضرة</Tab>
                  {examModalMode !== "passages" && <Tab fontSize="sm" fontWeight="600">امتحان شامل</Tab>}
                </TabList>
              </Tabs>
              {examLoading ? (
                <Flex justify="center" p={8}><Spinner color="blue.500" /></Flex>
              ) : examModalTab === "lecture" ? (
                exams.length === 0 ? (
                  <Text textAlign="center" color="gray.500" py={8}>لا توجد امتحانات محاضرة متاحة.</Text>
                ) : (
                  <RadioGroup value={selectedExamId} onChange={setSelectedExamId}>
                    <VStack align="stretch" spacing={3} maxH="360px" overflowY="auto" pr={1}>
                      {exams.map((exam) => (
                        <Box
                          key={exam.id}
                          p={4}
                          bg={selectedExamId === String(exam.id) ? "blue.50" : "gray.50"}
                          borderRadius="xl"
                          borderWidth="2px"
                          borderColor={selectedExamId === String(exam.id) ? "blue.500" : "transparent"}
                          cursor="pointer"
                          onClick={() => setSelectedExamId(String(exam.id))}
                          _hover={{ bg: "blue.50" }}
                        >
                          <Radio value={String(exam.id)} mb={2}>
                            <Text fontWeight="bold" fontSize="md">{exam.title}</Text>
                          </Radio>
                          <HStack fontSize="sm" color="gray.500" spacing={4} pl={6}>
                            {exam.courseTitle && <Text>{exam.courseTitle}</Text>}
                            {exam.lectureTitle && (<><Text>•</Text><Text>{exam.lectureTitle}</Text></>)}
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  </RadioGroup>
                )
              ) : (
                comprehensiveExams.length === 0 ? (
                  <Text textAlign="center" color="gray.500" py={8}>لا توجد امتحانات شاملة متاحة.</Text>
                ) : (
                  <RadioGroup value={selectedExamId} onChange={setSelectedExamId}>
                    <VStack align="stretch" spacing={3} maxH="360px" overflowY="auto" pr={1}>
                      {comprehensiveExams.map((exam) => (
                        <Box
                          key={exam.id}
                          p={4}
                          bg={selectedExamId === String(exam.id) ? "blue.50" : "gray.50"}
                          borderRadius="xl"
                          borderWidth="2px"
                          borderColor={selectedExamId === String(exam.id) ? "blue.500" : "transparent"}
                          cursor="pointer"
                          onClick={() => setSelectedExamId(String(exam.id))}
                          _hover={{ bg: "blue.50" }}
                        >
                          <Radio value={String(exam.id)} mb={2}>
                            <Text fontWeight="bold" fontSize="md">{exam.title}</Text>
                          </Radio>
                          <HStack fontSize="sm" color="gray.500" spacing={4} pl={6}>
                            <Text>{exam.course_title || exam.courseTitle || ""}</Text>
                            {exam.duration_minutes != null && <Text>• {exam.duration_minutes} د</Text>}
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  </RadioGroup>
                )
              )}
            </ModalBody>
            <ModalFooter borderTopWidth="1px" borderColor={borderColor} py={4}>
              <Button variant="ghost" mr={3} onClick={() => { onExamClose(); setExamModalMode("questions"); }}>إلغاء</Button>
              {examModalMode === "passages" ? (
                <Button colorScheme="blue" onClick={handleAddPassagesToExam} isLoading={addToExamLoading} isDisabled={!selectedExamId} fontWeight="bold">
                  إضافة {selectedPassageIds.length} قطعة
                </Button>
              ) : (
                <Button colorScheme="blue" onClick={handleAddQuestionsToExam} isLoading={addToExamLoading} isDisabled={!selectedExamId} fontWeight="bold">
                  إضافة {selectedQuestions.length} سؤال
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* --- OTHER MODALS --- */}

      {/* 1. Add Bulk Question Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
        <ModalOverlay backdropFilter="blur(6px)" bg="blackAlpha.600" />
        <ModalContent borderRadius="2xl" boxShadow={panelShadow} borderWidth="1px" borderColor={cardBorder} overflow="hidden">
          <LessonModalHeader title="إضافة أسئلة جديدة" />
          <ModalCloseButton top={3} />
          <ModalBody py={6}>
            <Tabs variant="soft-rounded" colorScheme="blue" index={questionType === "text" ? 0 : questionType === "image" ? 1 : questionType === "passage" ? 2 : 3} onChange={(idx) => setQuestionType(idx === 0 ? "text" : idx === 1 ? "image" : idx === 2 ? "passage" : "imageOnlyBulk")}>
              <TabList mb={4} bg="gray.50" p={1} borderRadius="xl" flexWrap="wrap">
                <Tab flex="1" minW="100px">أسئلة نصية (Bulk)</Tab>
                <Tab flex="1" minW="100px">سؤال بالصور</Tab>
                <Tab flex="1" minW="100px">إضافة قطعة</Tab>
                <Tab flex="1" minW="100px">أسئلة صورة فقط (Bulk)</Tab>
              </TabList>
              <TabPanels>
                <TabPanel px={0}>
                  <Alert status="info" borderRadius="xl" mb={4}>
                    <AlertIcon />
                    <Box fontSize="sm">
                      <AlertTitle>تنسيق إضافة أسئلة اختيار من متعدد دفعة واحدة:</AlertTitle>
                      <Text mt={1}>• سطر السؤال (يمكن أن يبدأ برقم أو إيموجي مثل 2️⃣ أو ٣.)</Text>
                      <Text>• أربعة أسطر للاختيارات: أ) ... ب) ... ج) ... د) ... (أو بالإنجليزية A) B) C) D))</Text>
                      <Text>• سطر اختياري: ✅ الإجابة الصحيحة: ب (أو أ / ج / د أو A / B / C / D)</Text>
                    </Box>
                  </Alert>
                  <Textarea
                    value={bulkQuestions}
                    onChange={(e) => setBulkQuestions(e.target.value)}
                    placeholder={`2️⃣ متى وقعت معركة حطين؟\nأ) 1099م\nب) 1187م\nج) 1250م\nد) 1260م\n✅ الإجابة الصحيحة: ب\n\n3️⃣ من هو قائد المسلمين في معركة عين جالوت؟\nأ) الظاهر بيبرس\nب) قطز\nج) صلاح الدين\nد) قلاوون\n✅ الإجابة الصحيحة: ب`}
                    rows={12}
                    borderRadius="xl"
                    bg="gray.50"
                    border="none"
                    _focus={{ bg: "white", boxShadow: "outline" }}
                    fontFamily="inherit"
                  />
                </TabPanel>
                <TabPanel px={0}>
                  {/* Image Question Form UI */}
                  <VStack spacing={4}>
                    <FormControl>
                      <FormLabel>نص السؤال</FormLabel>
                      <Input value={imageQuestionText} onChange={(e) => setImageQuestionText(e.target.value)} placeholder="مثال: اختر الصورة الصحيحة..." />
                    </FormControl>
                    <FormControl>
                      <FormLabel>الخيارات (اختر 4 صور)</FormLabel>
                      <SimpleGrid columns={4} spacing={2}>
                        {[0, 1, 2, 3].map(i => (
                          <Box key={i} h="100px" bg="gray.100" borderRadius="xl" position="relative" overflow="hidden" border="2px dashed" borderColor="gray.300">
                            {imagePreviews[i] ? (
                              <Image src={imagePreviews[i]} w="100%" h="100%" objectFit="cover" />
                            ) : (
                              <Flex h="100%" align="center" justify="center" color="gray.400" direction="column">
                                <Icon as={FaUpload} />
                                <Text fontSize="xs">{String.fromCharCode(65 + i)}</Text>
                              </Flex>
                            )}
                            <Input
                              type="file"
                              position="absolute"
                              top={0} left={0} w="100%" h="100%"
                              opacity={0}
                              cursor="pointer"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const newImgs = [...selectedImages]; newImgs[i] = file; setSelectedImages(newImgs);
                                  const reader = new FileReader(); reader.onload = () => { const newPrevs = [...imagePreviews]; newPrevs[i] = reader.result; setImagePreviews(newPrevs); }; reader.readAsDataURL(file);
                                }
                              }}
                            />
                            {/* Radio for Correct Answer */}
                            <Box position="absolute" bottom={1} right={1} onClick={(e) => { e.stopPropagation(); setImageCorrectAnswerIndex(i); }}>
                              <Box w="20px" h="20px" borderRadius="full" border="2px solid white" bg={imageCorrectAnswerIndex === i ? "green.500" : "gray.300"} />
                            </Box>
                          </Box>
                        ))}
                      </SimpleGrid>
                      <Text fontSize="xs" color="gray.500" mt={1}>* انقر على الدائرة الصغيرة لتحديد الإجابة الصحيحة.</Text>
                    </FormControl>
                  </VStack>
                </TabPanel>
                <TabPanel px={0} maxH="60vh" overflowY="auto">
                  <Alert status="info" borderRadius="xl" mb={4}>
                    <AlertIcon />
                    <Box fontSize="sm">
                      <AlertTitle>إضافة قطعة مع أسئلة</AlertTitle>
                      <Text mt={1}>أدخل نص القطعة ثم أضف أسئلة اختيار من متعدد مرتبطة بها.</Text>
                    </Box>
                  </Alert>
                  <VStack align="stretch" spacing={4}>
                    <FormControl>
                      <FormLabel>عنوان القطعة (اختياري)</FormLabel>
                      <Input value={passageTitle} onChange={(e) => setPassageTitle(e.target.value)} placeholder="عنوان القطعة" borderRadius="xl" borderColor={borderColor} />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>نص القطعة</FormLabel>
                      <Textarea value={passageContent} onChange={(e) => setPassageContent(e.target.value)} placeholder="نص القطعة الكامل..." rows={6} borderRadius="xl" borderColor={borderColor} />
                    </FormControl>
                    <Divider />
                    <Flex justify="space-between" align="center">
                      <Text fontWeight="600">أسئلة القطعة</Text>
                      <Button size="sm" leftIcon={<Icon as={FaPlus} />} colorScheme="blue" variant="outline" onClick={addPassageQuestion}>إضافة سؤال</Button>
                    </Flex>
                    {passageQuestions.map((q, qIdx) => (
                      <Box key={qIdx} p={4} bg={optionBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
                        <Flex justify="space-between" align="center" mb={3}>
                          <Badge colorScheme="blue">سؤال {qIdx + 1}</Badge>
                          {passageQuestions.length > 1 && (
                            <IconButton aria-label="حذف السؤال" icon={<FaTrash />} size="xs" colorScheme="red" variant="ghost" onClick={() => removePassageQuestion(qIdx)} />
                          )}
                        </Flex>
                        <FormControl mb={3}>
                          <FormLabel fontSize="sm">نص السؤال</FormLabel>
                          <Input value={q.question_text} onChange={(e) => updatePassageQuestion(qIdx, "question_text", e.target.value)} placeholder="السؤال؟" borderRadius="lg" />
                        </FormControl>
                        <FormControl mb={3}>
                          <FormLabel fontSize="sm">الخيارات (أ، ب، ج، د)</FormLabel>
                          <VStack spacing={2}>
                            {(q.options || ["", "", "", ""]).map((opt, oIdx) => (
                              <HStack key={oIdx} w="full">
                                <Text w="24px" fontSize="sm" fontWeight="bold">{String.fromCharCode(65 + oIdx)})</Text>
                                <Input value={opt} onChange={(e) => { const opts = [...(q.options || ["", "", "", ""])]; opts[oIdx] = e.target.value; updatePassageQuestion(qIdx, "options", opts); }} placeholder={`الخيار ${String.fromCharCode(65 + oIdx)}`} size="sm" borderRadius="lg" />
                                <Radio isChecked={q.correct_answer_index === oIdx} onChange={() => updatePassageQuestion(qIdx, "correct_answer_index", oIdx)} />
                              </HStack>
                            ))}
                          </VStack>
                        </FormControl>
                        <HStack spacing={4} flexWrap="wrap">
                          <FormControl flex="1" minW="120px">
                            <FormLabel fontSize="xs">الصعوبة</FormLabel>
                            <Select size="sm" value={q.difficulty_level} onChange={(e) => updatePassageQuestion(qIdx, "difficulty_level", e.target.value)} borderRadius="lg">
                              <option value="easy">سهل</option>
                              <option value="medium">متوسط</option>
                              <option value="hard">صعب</option>
                            </Select>
                          </FormControl>
                          <FormControl w="80px">
                            <FormLabel fontSize="xs">النقاط</FormLabel>
                            <Input type="number" min={1} value={q.points} onChange={(e) => updatePassageQuestion(qIdx, "points", e.target.value)} size="sm" borderRadius="lg" />
                          </FormControl>
                        </HStack>
                        <FormControl mt={2}>
                          <FormLabel fontSize="xs">شرح (اختياري)</FormLabel>
                          <Input value={q.explanation} onChange={(e) => updatePassageQuestion(qIdx, "explanation", e.target.value)} placeholder="شرح الإجابة" size="sm" borderRadius="lg" />
                        </FormControl>
                      </Box>
                    ))}
                  </VStack>
                </TabPanel>
                <TabPanel px={0}>
                  <Alert status="info" borderRadius="xl" mb={4}>
                    <AlertIcon />
                    <Box fontSize="sm">
                      <AlertTitle>إضافة أسئلة صورة فقط (Bulk)</AlertTitle>
                      <Text mt={1}>ارفع حتى 20 صورة؛ كل صورة = سؤال مستقل مع أربعة اختيارات ثابتة (أ، ب، ج، د). يمكنك تحديد الإجابة الصحيحة الافتراضية ومستوى الصعوبة والنقاط أدناه (تُطبَّق على كل الصور).</Text>
                    </Box>
                  </Alert>
                  <VStack align="stretch" spacing={4}>
                    <FormControl>
                      <FormLabel>الصور (حتى 20)</FormLabel>
                      <Flex align="center" gap={3} flexWrap="wrap">
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={async (e) => {
                            try {
                              const inputTarget = e.target;
                              let files = Array.from(inputTarget.files || []);

                              // المتصفحات ومرافق النظام لا تحفظ الترتيب الفعلي لـ "نقرات الماوس" عند اختيار الملفات
                              // لذلك أفضل طريقة لضمان الترتيب الصحيح (مثلاً: صورة 1، صورة 2 ... صورة 10)
                              // هو إعادة ترتيبهم حسب الأسماء بشكل رقمي وأبجدي.
                              files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

                              const limited = files.slice(0, 20);

                              setImageOnlyBulkLoading(true); // نظهر التحميل أثناء معالجة الصور

                              // ضغط الصور لحل مشكلة 413 Payload Too Large
                              const compressedFiles = await Promise.all(
                                limited.map(file => compressImage(file, 1024, 0.7))
                              );

                              imageOnlyBulkPreviewUrlsRef.current.forEach(URL.revokeObjectURL);
                              const urls = compressedFiles.map((f) => URL.createObjectURL(f));
                              imageOnlyBulkPreviewUrlsRef.current = urls;
                              setImageOnlyBulkPreviewUrls(urls);
                              setImageOnlyBulkFiles(compressedFiles);
                              setImageOnlyBulkResult(null);

                              inputTarget.value = "";
                            } catch (error) {
                              console.error("Error processing images:", error);
                            } finally {
                              setImageOnlyBulkLoading(false);
                            }
                          }}
                          border="none"
                          p={0}
                          sx={{ "&::file-selector-button": { padding: 2, mr: 2, borderRadius: "md", border: "1px solid", borderColor: "gray.300", bg: "gray.50", cursor: "pointer" } }}
                        />
                        {imageOnlyBulkFiles.length > 0 && (
                          <HStack fontSize="sm" color={textSecondary}>
                            <Icon as={FaImage} boxSize={4} color="blue.500" />
                            <Text>{imageOnlyBulkFiles.length} صورة محددة</Text>
                          </HStack>
                        )}
                      </Flex>
                    </FormControl>
                    {imageOnlyBulkFiles.length > 0 && (
                      <Box>
                        <FormLabel fontSize="sm" mb={3}>معاينة الصور — يمكنك مراجعة الصور وترتيبها قبل الرفع</FormLabel>
                        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                          {imageOnlyBulkFiles.map((file, index) => (
                            <Box key={index} position="relative" borderRadius="xl" overflow="hidden" borderWidth="2px" borderColor={borderColor} bg={bulkPreviewBg} boxShadow="sm" transition="all 0.2s" _hover={{ boxShadow: "md", transform: "translateY(-2px)" }}>
                              <Badge position="absolute" top={2} right={2} colorScheme="blue" fontSize="md" px={3} py={1} borderRadius="lg" zIndex={2} boxShadow="sm">سؤال {index + 1}</Badge>
                              <IconButton
                                aria-label="إلغاء الصورة"
                                icon={<Icon as={FaTimes} />}
                                size="sm"
                                colorScheme="red"
                                position="absolute"
                                top={2}
                                left={2}
                                borderRadius="full"
                                onClick={() => removeBulkImageAtIndex(index)}
                                zIndex={2}
                                boxShadow="sm"
                              />
                              <Box position="relative" h="180px" w="full" bg="white">
                                <Image src={imageOnlyBulkPreviewUrls[index]} alt={file.name} objectFit="contain" w="full" h="full" p={2} />
                              </Box>
                              <Box p={2} bg={useColorModeValue("gray.50", "whiteAlpha.100")} borderTopWidth="1px" borderColor={borderColor}>
                                <Text fontSize="xs" noOfLines={1} color={textSecondary} textAlign="center" fontWeight="500">{file.name}</Text>
                              </Box>
                            </Box>
                          ))}
                        </SimpleGrid>
                      </Box>
                    )}
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                      <FormControl>
                        <FormLabel fontSize="sm">الإجابة الصحيحة الافتراضية</FormLabel>
                        <Select
                          value={imageOnlyBulkMetaDefault.correct_answer_index}
                          onChange={(e) => setImageOnlyBulkMetaDefault((prev) => ({ ...prev, correct_answer_index: Number(e.target.value) }))}
                          size="sm"
                          borderRadius="lg"
                        >
                          <option value={0}>أ</option>
                          <option value={1}>ب</option>
                          <option value={2}>ج</option>
                          <option value={3}>د</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm">مستوى الصعوبة</FormLabel>
                        <Select
                          value={imageOnlyBulkMetaDefault.difficulty_level}
                          onChange={(e) => setImageOnlyBulkMetaDefault((prev) => ({ ...prev, difficulty_level: e.target.value }))}
                          size="sm"
                          borderRadius="lg"
                        >
                          <option value="easy">سهل</option>
                          <option value="medium">متوسط</option>
                          <option value="hard">صعب</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel fontSize="sm">النقاط</FormLabel>
                        <Input
                          type="number"
                          min={1}
                          value={imageOnlyBulkMetaDefault.points}
                          onChange={(e) => setImageOnlyBulkMetaDefault((prev) => ({ ...prev, points: Number(e.target.value) || 1 }))}
                          size="sm"
                          borderRadius="lg"
                        />
                      </FormControl>
                    </SimpleGrid>
                    <Button
                      leftIcon={<Icon as={FaUpload} />}
                      colorScheme="blue"
                      onClick={handleImageOnlyBulkSubmit}
                      isLoading={imageOnlyBulkLoading}
                      isDisabled={!imageOnlyBulkFiles.length}
                      fontWeight="bold"
                      borderRadius="xl"
                      w="full"
                      size="lg"
                    >
                      {imageOnlyBulkLoading ? "جاري الرفع..." : "رفع الصور (إضافة أسئلة)"}
                    </Button>
                    {imageOnlyBulkResult && (
                      <Alert status={imageOnlyBulkResult.failed > 0 ? "warning" : "success"} borderRadius="xl">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>{imageOnlyBulkResult.failed > 0 ? "تم جزئياً" : "تمت الإضافة"}</AlertTitle>
                          <Text fontSize="sm" mt={1}>
                            تمت إضافة {imageOnlyBulkResult.added} سؤال.
                            {imageOnlyBulkResult.failed > 0 && ` فشل ${imageOnlyBulkResult.failed}. ${imageOnlyBulkResult.errors?.length ? imageOnlyBulkResult.errors.map((e) => `(صورة ${(e.index ?? 0) + 1}: ${e.message})`).join(" ") : ""}`}
                          </Text>
                        </Box>
                      </Alert>
                    )}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor={borderColor} py={5} bg={useColorModeValue("gray.50", "gray.800")} borderRadius="0 0 2xl 2xl">
            <Button variant="ghost" onClick={onClose} mr={3}>إلغاء</Button>
            {questionType !== "imageOnlyBulk" && (
              <Button colorScheme="blue" onClick={handleBulkSubmit} isLoading={submitLoading || passageLoading} fontWeight="bold">حفظ الأسئلة</Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 2. Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg" isCentered>
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.600" />
        <ModalContent borderRadius="2xl" boxShadow={panelShadow} borderWidth="1px" borderColor={cardBorder} overflow="hidden">
          <LessonModalHeader title="تعديل السؤال" icon={FaEdit} />
          <ModalCloseButton top={3} />
          <ModalBody py={6}>
            <VStack spacing={5}>
              <FormControl>
                <FormLabel color={textPrimary} fontWeight="600">نص السؤال</FormLabel>
                <Textarea value={editFormData.text} onChange={(e) => setEditFormData({ ...editFormData, text: e.target.value })} borderRadius="xl" borderColor={borderColor} _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 2px rgba(66, 153, 225, 0.2)" }} />
              </FormControl>
              <FormControl>
                <FormLabel color={textPrimary} fontWeight="600">الخيارات</FormLabel>
                <VStack spacing={3}>
                  {editFormData.options.map((opt, i) => (
                    <Input key={i} value={opt} onChange={(e) => { const newOpts = [...editFormData.options]; newOpts[i] = e.target.value; setEditFormData({ ...editFormData, options: newOpts }); }} placeholder={`الخيار ${String.fromCharCode(65 + i)}`} borderRadius="lg" borderColor={borderColor} />
                  ))}
                </VStack>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor={borderColor} py={4}>
            <Button variant="ghost" onClick={onEditClose}>إلغاء</Button>
            <Button colorScheme="blue" onClick={handleEditSubmit} isLoading={editLoading} fontWeight="bold">حفظ التعديلات</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 3. Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered size="sm">
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.600" />
        <ModalContent borderRadius="2xl" boxShadow={panelShadow} borderWidth="1px" borderColor={cardBorder} overflow="hidden">
          <ModalBody py={8} textAlign="center">
            <Box w="16" h="16" mx="auto" mb={4} borderRadius="full" bg={useColorModeValue("red.50", "red.900")} display="flex" alignItems="center" justifyContent="center">
              <Icon as={FaTrash} boxSize={8} color="red.500" />
            </Box>
            <Heading size="md" mb={2} color={textPrimary}>حذف السؤال؟</Heading>
            <Text color={textSecondary} mb={6} fontSize="sm">هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.</Text>
            <HStack justify="center" spacing={4}>
              <Button variant="ghost" onClick={onDeleteClose}>إلغاء</Button>
              <Button colorScheme="red" onClick={deleteQuestion} isLoading={deleteLoading} fontWeight="bold">نعم، حذف</Button>
            </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* 4. Image Upload Modal */}
      <Modal isOpen={isImageOpen} onClose={onImageClose} size="md" isCentered>
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.600" />
        <ModalContent borderRadius="2xl" boxShadow={panelShadow} borderWidth="1px" borderColor={cardBorder} overflow="hidden">
          <LessonModalHeader title="صورة السؤال" icon={FaImage} />
          <ModalCloseButton top={3} />
          <ModalBody py={6}>
            <Box borderWidth="1px" borderStyle="dashed" borderColor={borderColor} bg={emptyIconBg} borderRadius="xl" h="220px" display="flex" alignItems="center" justifyContent="center" cursor="pointer" position="relative" overflow="hidden" _hover={{ borderColor: "blue.300" }}>
              {imagePreview ? (
                <Image src={imagePreview} w="full" h="full" objectFit="contain" />
              ) : (
                <VStack color={textSecondary}>
                  <Icon as={FaUpload} w={10} h={10} />
                  <Text fontWeight="600">اضغط لرفع صورة</Text>
                </VStack>
              )}
              <Input type="file" position="absolute" top={0} left={0} w="full" h="full" opacity={0} accept="image/*" onChange={(e) => { const file = e.target.files[0]; if (file) { setSelectedImage(file); const r = new FileReader(); r.onload = () => setImagePreview(r.result); r.readAsDataURL(file); } }} />
            </Box>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor={borderColor} py={4}>
            {imagePreview && <Button colorScheme="red" variant="ghost" mr="auto" onClick={removeImage}>مسح</Button>}
            <Button colorScheme="blue" onClick={handleImageSubmit} isLoading={imageLoading} fontWeight="bold">حفظ الصورة</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 5. Image Zoom Modal — عرض بالجودة الكاملة */}
      <Modal isOpen={!!zoomImageUri} onClose={() => setZoomImageUri(null)} size="full" isCentered>
        <ModalOverlay bg="blackAlpha.900" />
        <ModalContent bg="transparent" boxShadow="none" maxW="100vw" m={0}>
          <ModalBody
            p={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            minH="100vh"
            overflow="auto"
            onClick={() => setZoomImageUri(null)}
          >
            <IconButton
              aria-label="إغلاق"
              icon={<FaTimes />}
              position="fixed"
              top={4}
              right={4}
              zIndex={10}
              colorScheme="blackAlpha"
              color="white"
              size="lg"
              borderRadius="full"
              onClick={(e) => { e.stopPropagation(); setZoomImageUri(null); }}
            />
            {zoomImageUri && (
              <Box
                p={{ base: 4, md: 8 }}
                onClick={(e) => e.stopPropagation()}
                maxW="100%"
              >
                <Image
                  src={zoomImageUri}
                  maxW="100%"
                  w="auto"
                  h="auto"
                  maxH="92vh"
                  objectFit="contain"
                  alt="تكبير الصورة"
                  loading="eager"
                  decoding="sync"
                  sx={{ imageRendering: "auto" }}
                />
                <Text textAlign="center" color="whiteAlpha.700" fontSize="xs" mt={3}>
                  اضغط خارج الصورة للإغلاق
                </Text>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      <TeacherLibraryExtractionModal
        isOpen={isExtractOpen}
        onClose={onExtractClose}
        lessonId={id}
        importTarget="question-bank-v2"
        onImported={() => {
          fetchQuestionsData();
          fetchPassages();
        }}
      />

      {/* 6. Add to Exam Success Modal */}
      <Modal isOpen={isAddSuccessOpen} onClose={() => { onAddSuccessClose(); setAddSuccessMessage(""); }} size="sm" isCentered>
        <ModalOverlay bg="blackAlpha.600" />
        <ModalContent borderRadius="2xl" overflow="hidden" borderWidth="1px" borderColor={cardBorder} boxShadow={panelShadow}>
          <ModalBody py={8} textAlign="center">
            <Flex w={16} h={16} mx="auto" mb={5} borderRadius="full" bg={useColorModeValue("green.50", "green.900")} align="center" justify="center">
              <Icon as={FaCheck} color="green.500" boxSize={8} />
            </Flex>
            <Heading size="md" mb={2} color={textPrimary}>تمت الإضافة بنجاح</Heading>
            <Text color={textSecondary} mb={6} fontSize="sm" lineHeight="1.7">{addSuccessMessage}</Text>
            <Button colorScheme="blue" w="full" borderRadius="xl" onClick={() => { onAddSuccessClose(); setAddSuccessMessage(""); }}>
              حسناً
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>

    </Box>
  );
};

export default Lesson;
