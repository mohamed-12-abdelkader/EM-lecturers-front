import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  VStack,
  Heading,
  Text,
  Spinner,
  Center,
  RadioGroup,
  Radio,
  Stack,
  Alert,
  AlertIcon,
  Badge,
  IconButton,
  HStack,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  Divider,
  Checkbox,
  CheckboxGroup,
  Image,
  FormControl,
  FormLabel,
  Icon,
  useColorModeValue,
  Container,
  Flex,
  Textarea,
  SimpleGrid,
} from "@chakra-ui/react";
// استبدال أيقونات chakra-ui بأيقونات react-icons
import {
  AiFillEdit,
  AiFillDelete,
  AiFillCheckCircle,
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
  AiFillStar,
  AiFillPicture,
} from "react-icons/ai";
import { FaBookOpen } from "react-icons/fa";
import AiQuestionExtractionModal from "./components/AiQuestionExtractionModal";
import ExamReadyScreen from "./components/ExamReadyScreen";
import ExamStudentProgress from "./components/ExamStudentProgress";
import ExamResultPanel from "./components/ExamResultPanel";
import TeacherExamShell, {
  TeacherExamEmptyState,
} from "./components/TeacherExamShell";
import {
  TeacherQuestionCard,
  StudentQuestionPanel,
} from "./components/ExamQuestionDisplay";
import ExamSubmissionsView from "./components/ExamSubmissionsView";
import baseUrl from "../../api/baseUrl";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import { useParams, useNavigate } from "react-router-dom";
import UserType from "../../Hooks/auth/userType";

const ComprehensiveExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userData, isAdmin, isTeacher, student] = UserType();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModal, setEditModal] = useState({ open: false, question: null });
  const [editForm, setEditForm] = useState({
    text: "",
    choices: [],
    image: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, qid: null });
  const toast = useToast();
  const [studentAnswers, setStudentAnswers] = useState({}); // { [questionId]: choiceId }
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  // State لعرض درجات الطلاب
  const [showGrades, setShowGrades] = useState(false);
  const [gradesData, setGradesData] = useState(null);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [gradesError, setGradesError] = useState(null);
  // State للتنقل بين الأسئلة
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // State لعرض/إخفاء الباجنيشن
  const [showPagination, setShowPagination] = useState(false);
  // States للامتحان الجديد
  const [examData, setExamData] = useState(null);
  const [examStatus, setExamStatus] = useState(null); // hidden, not_open_yet, closed, already_submitted, ready
  const [currentAttempt, setCurrentAttempt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [startingAttempt, setStartingAttempt] = useState(false);
  // State لإضافة الأسئلة كصور
  const [addImageModal, setAddImageModal] = useState({ open: false });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  // State لإضافة صورة لسؤال محدد
  const [addQuestionImageModal, setAddQuestionImageModal] = useState({
    open: false,
    questionId: null,
  });
  const [selectedQuestionImage, setSelectedQuestionImage] = useState(null);
  const [questionImagePreview, setQuestionImagePreview] = useState("");
  const [uploadingQuestionImage, setUploadingQuestionImage] = useState(false);
  // State لإضافة مجموعة أسئلة كنص (Bulk) — امتحان المحاضرة
  const [bulkTextModalOpen, setBulkTextModalOpen] = useState(false);
  const [bulkTextInput, setBulkTextInput] = useState("");
  const [bulkCorrectAnswers, setBulkCorrectAnswers] = useState("");
  const [bulkTextLoading, setBulkTextLoading] = useState(false);
  // State لإضافة أسئلة من قطعة
  const [passageModalOpen, setPassageModalOpen] = useState(false);
  const [passageForm, setPassageForm] = useState({
    title: "",
    content: "",
    questionsBulkText: "",
  });
  const [passageLoading, setPassageLoading] = useState(false);
  // استخراج الأسئلة بالذكاء الاصطناعي
  const [aiExtractionModalOpen, setAiExtractionModalOpen] = useState(false);
  const [attemptSummary, setAttemptSummary] = useState(null);
  const [imageZoomOpen, setImageZoomOpen] = useState(false);
  const [imageZoomSrc, setImageZoomSrc] = useState(null);

  // ألوان الصفحة
  const pageBg = useColorModeValue("#E8EEF5", "gray.950");
  const cardBg = useColorModeValue("white", "gray.900");
  const cardBorder = useColorModeValue("rgba(15,23,42,0.08)", "whiteAlpha.120");
  const headingColor = useColorModeValue("gray.900", "white");
  const subtextColor = useColorModeValue("gray.500", "gray.400");
  const isStaff = Boolean(isTeacher || isAdmin);

  // جلب درجات الطلاب
  const fetchGrades = async () => {
    setGradesLoading(true);
    setGradesError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await baseUrl.get(
        `/api/course/lecture-exam/${id}/submissions`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      setGradesData(res.data.submissions || []);
      setShowGrades(true);
    } catch (err) {
      setGradesError("حدث خطأ أثناء تحميل الدرجات");
    } finally {
      setGradesLoading(false);
    }
  };

  // استخدام useRef لتتبع الـ ID السابق
  const prevExamIdRef = useRef(null);

  useEffect(() => {
    if (id) {
      // التحقق من أن الـ ID تغير فعلياً
      if (prevExamIdRef.current !== null && prevExamIdRef.current !== id) {
        // إعادة تعيين جميع الـ states عند تغيير الامتحان
        setQuestions([]);
        setExamData(null);
        setExamStatus(null);
        setCurrentAttempt(null);
        setRemainingSeconds(null);
        setAttemptHistory([]);
        setFeedback(null);
        setError(null);
        setStudentAnswers({});
        setSubmitResult(null);
        setCurrentQuestionIndex(0);
      }

      // تحديث الـ ref
      prevExamIdRef.current = id;

      // الانتظار حتى يكون isTeacher و isAdmin جاهزين
      if (isTeacher !== undefined && isAdmin !== undefined) {
        fetchExamData();
      }
    }
    // eslint-disable-next-line
  }, [id, isTeacher, isAdmin]);

  // عداد الوقت للمحاولة النشطة
  useEffect(() => {
    if (
      currentAttempt &&
      currentAttempt.remainingSeconds > 0 &&
      student &&
      !isTeacher &&
      !isAdmin
    ) {
      const interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // عند انتهاء الوقت، تحديث البيانات
            fetchExamData();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentAttempt, student, isTeacher, isAdmin]);

  // دالة لترتيب الأسئلة عشوائياً
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  /**
   * تسوية مصفوفة الأسئلة من الـ API:
   * - تدعم صيغة sub_questions القديمة (type: "passage")
   * - وتدعم الصيغة الجديدة حيث كل سؤال يحتوي passage مباشرة.
   */
  const normalizeQuestions = (questionsArray) => {
    if (!questionsArray || !Array.isArray(questionsArray)) return [];
    const result = [];
    for (const q of questionsArray) {
      if (q.type === "passage" && q.passage && Array.isArray(q.sub_questions)) {
        for (const sq of q.sub_questions) {
          result.push({
            type: "passage_sub",
            passage: q.passage,
            sub_question: {
              id: sq.id,
              text: sq.text || null,
              image: sq.image || null,
              grade: sq.grade ?? 1,
              choices: Array.isArray(sq.choices)
                ? sq.choices.map((c) => ({
                    id: c.id,
                    text: c.text || "",
                    image: c.image || c.image_url || null,
                    is_correct: c.is_correct || false,
                  }))
                : [],
            },
            grade: q.grade,
          });
        }
      } else if (q.id != null) {
        // سؤال عادي
        result.push({
          id: q.id,
          text: q.text || null,
          image: q.image || null,
          grade: q.grade ?? 1,
          passage: q.passage || null,
          choices: Array.isArray(q.choices)
            ? q.choices.map((c) => ({
                id: c.id,
                text: c.text || "",
                image: c.image || c.image_url || null,
                is_correct: c.is_correct || false,
              }))
            : [],
        });
      }
    }
    return result;
  };

  // جلب بيانات الامتحان
  const fetchExamData = async () => {
    if (!id) {
      return;
    }

    const currentExamId = id; // حفظ الـ ID الحالي للتحقق من race conditions

    try {
      setLoading(true);
      setError(null);
      // إعادة تعيين الأسئلة فقط إذا تغير الـ ID
      if (
        prevExamIdRef.current !== null &&
        prevExamIdRef.current !== currentExamId
      ) {
        setQuestions([]);
      }

      const token = localStorage.getItem("token");
      const res = await baseUrl.get(
        `/api/exams/${currentExamId}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );

      // التحقق من أن الـ ID لم يتغير أثناء الطلب
      if (currentExamId !== id) {
        return;
      }

      const data = res.data;
      const exam = data.exam;
      const attempt = data.attempt;
      setExamData(exam);
      setExamStatus(data.status);
      const derivedSeconds = exam?.duration != null ? exam.duration * 60 : null;
      const remaining =
        attempt?.remainingSeconds ??
        (attempt && derivedSeconds ? derivedSeconds : null);
      setCurrentAttempt(
        attempt ? { ...attempt, remainingSeconds: remaining ?? attempt.remainingSeconds } : null
      );
      setRemainingSeconds(remaining ?? null);
      setAttemptHistory(data.attemptHistory || []);
      setFeedback(data.feedback || null);
      setAttemptSummary(data.attemptSummary || null);

      // للمدرسين والإداريين: جلب الأسئلة من نفس API response
      if (isTeacher || isAdmin) {
        let questionsFound = false;

        // أولاً: التحقق من data.questions (المستوى العلوي) - يدعم الأسئلة العادية وقطعة القراءة
        if (data.questions && Array.isArray(data.questions)) {
          const formattedQuestions = normalizeQuestions(data.questions);
          if (formattedQuestions.length > 0) {
            setQuestions(formattedQuestions);
            questionsFound = true;
          }
        }
        // ثانياً: التحقق من exam.questions
        else if (
          data.exam &&
          data.exam.questions &&
          Array.isArray(data.exam.questions)
        ) {
          const formattedQuestions = normalizeQuestions(data.exam.questions);
          if (formattedQuestions.length > 0) {
            setQuestions(formattedQuestions);
            questionsFound = true;
          }
        }
        // ثالثاً: التحقق من feedback.wrongQuestions
        else if (
          data.feedback &&
          data.feedback.wrongQuestions &&
          Array.isArray(data.feedback.wrongQuestions)
        ) {
          const questionsFromFeedback = data.feedback.wrongQuestions.map(
            (wq) => ({
              id: wq.questionId,
              text: wq.questionText || null,
              image: wq.questionImage || null,
              choices: Array.isArray(wq.choices) ? wq.choices : [],
              correctChoice: wq.correctChoice,
              yourChoice: wq.yourChoice,
            })
          );

          if (questionsFromFeedback.length > 0) {
            setQuestions(questionsFromFeedback);
            questionsFound = true;
          }
        }

        if (!questionsFound) {
          await fetchQuestionsForTeacher();
        }
      } else {
        // للطلاب: نعرض الأسئلة فقط عند وجود محاولة نشطة (حتى يظهر زر "بدء الامتحان" والمؤقت)
        let questionsFound = false;

        if (
          data.attempt &&
          data.questions &&
          Array.isArray(data.questions) &&
          data.questions.length > 0
        ) {
          const formattedQuestions = normalizeQuestions(data.questions);
          setQuestions(formattedQuestions);
          questionsFound = true;
        }

        if (!questionsFound) {
          if (data.status === "ready" && data.attempt) {
            await fetchQuestionsForStudent();
          } else if (data.feedback && data.feedback.wrongQuestions) {
            // إذا كان هناك feedback، نستخدم الأسئلة من هناك
            const questionsFromFeedback = data.feedback.wrongQuestions.map(
              (wq) => ({
                id: wq.questionId,
                text: wq.questionText,
                image: wq.questionImage || null,
                choices: [], // سيتم ملؤها لاحقاً
              })
            );
            setQuestions(questionsFromFeedback);
          }
        }
      }

      // عرض رسالة حسب الحالة
      if (data.message) {
        toast({
          title: data.message,
          status: data.status === "ready" ? "info" : "warning",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      // التحقق من أن الـ ID لم يتغير أثناء الطلب
      if (currentExamId !== id) {
        return;
      }

      const errorMessage =
        err.response?.data?.message || "حدث خطأ أثناء تحميل بيانات الامتحان";
      setError(errorMessage);
      setQuestions([]); // إعادة تعيين الأسئلة في حالة الخطأ

      toast({
        title: "خطأ في تحميل الامتحان",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      // التحقق من أن الـ ID لم يتغير قبل إيقاف الـ loading
      if (currentExamId === id) {
        setLoading(false);
      }
    }
  };

  // جلب الأسئلة للمدرس
  const fetchQuestionsForTeacher = async () => {
    if (!id) {
      return;
    }

    const currentExamId = id; // حفظ الـ ID الحالي للتحقق من race conditions

    try {
      const token = localStorage.getItem("token");
      const res = await baseUrl.get(
        `/api/questions/lecture-exam/${currentExamId}/details`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );

      // التحقق من أن الـ ID لم يتغير أثناء الطلب
      if (currentExamId !== id) {
        return;
      }

      const questionsData = res.data.questions || [];
      const formattedQuestions = normalizeQuestions(questionsData);
      setQuestions(formattedQuestions);
    } catch (err) {
      // التحقق من أن الـ ID لم يتغير أثناء الطلب
      if (currentExamId !== id) {
        return;
      }

      toast({
        title: "خطأ في جلب الأسئلة",
        description:
          err.response?.data?.message || "حدث خطأ أثناء تحميل الأسئلة",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setQuestions([]); // إعادة تعيين الأسئلة في حالة الخطأ
    }
  };

  // جلب الأسئلة للطالب
  const fetchQuestionsForStudent = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await baseUrl.get(
        `/api/questions/lecture-exam/${id}/details`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      const questionsData = res.data.questions || [];
      const normalized = normalizeQuestions(questionsData);
      setQuestions(shuffleArray(normalized));
    } catch (err) {
      console.error("Error fetching questions for student:", err);
    }
  };

  // بدء محاولة جديدة — تهيئة المؤقت من remainingSeconds أو من exam.duration / timeLimitMinutes
  const startAttempt = async () => {
    setStartingAttempt(true);
    try {
      const token = localStorage.getItem("token");
      const res = await baseUrl.post(
        `/api/exams/${id}/start`,
        {},
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );

      const attemptData = res.data;
      const durationMinutes =
        attemptData.timeLimitMinutes ??
        attemptData.duration ??
        examData?.timeLimitMinutes ??
        examData?.duration;
      const initialSeconds =
        attemptData.remainingSeconds ??
        (durationMinutes ? durationMinutes * 60 : null);

      setCurrentAttempt({
        ...attemptData,
        remainingSeconds: initialSeconds ?? attemptData.remainingSeconds,
      });
      setRemainingSeconds(initialSeconds ?? attemptData.remainingSeconds ?? null);
      setExamStatus("ready");

      await fetchQuestionsForStudent();

      toast({
        title: "تم بدء المحاولة بنجاح",
        description:
          durationMinutes != null
            ? `المدة: ${durationMinutes} دقيقة`
            : "بدون مدة محددة",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("Error starting attempt:", err);
      toast({
        title: "فشل بدء المحاولة",
        description: err.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setStartingAttempt(false);
    }
  };

  // Delete question
  const handleDelete = async () => {
    if (!deleteModal.qid) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      await baseUrl.delete(
        `/api/course/course-exam/question/${deleteModal.qid}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      // حذف السؤال محلياً
      setQuestions((prev) => prev.filter((q) => q.id !== deleteModal.qid));
      toast({ title: "تم حذف السؤال", status: "success" });
      setDeleteModal({ open: false, qid: null });
      // إعادة جلب الأسئلة للتأكد من التحديث
      if (isTeacher || isAdmin) {
        await fetchQuestionsForTeacher();
      }
    } catch (error) {
      toast({
        title: "فشل الحذف",
        description:
          error.response?.data?.message || "حدث خطأ أثناء حذف السؤال",
        status: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Open edit modal
  const openEditModal = (q) => {
    setEditForm({
      text: q.text,
      choices: q.choices.map((c) => ({ ...c })),
      image: q.image || "",
    });
    setImagePreview(q.image || "");
    setSelectedFile(null);
    setEditModal({ open: true, question: q });
  };

  // Handle edit form change
  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  // Handle file change for question image
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // إنشاء معاينة للصورة
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleChoiceChange = (idx, value) => {
    setEditForm((prev) => {
      const choices = [...prev.choices];
      choices[idx].text = value;
      return { ...prev, choices };
    });
  };

  // Save edit
  const handleEditSave = async () => {
    const { question } = editModal;
    try {
      const token = localStorage.getItem("token");

      // التحقق من وجود نص السؤال
      if (!editForm.text || !editForm.text.trim()) {
        toast({
          title: "خطأ في البيانات",
          description: "يرجى إدخال نص السؤال",
          status: "error",
        });
        return;
      }

      // التحقق من وجود 4 اختيارات
      if (!editForm.choices || editForm.choices.length !== 4) {
        toast({
          title: "خطأ في البيانات",
          description: "يجب أن يحتوي السؤال على 4 اختيارات",
          status: "error",
        });
        return;
      }

      // التحقق من وجود إجابة صحيحة واحدة على الأقل
      const hasCorrectAnswer = editForm.choices.some((c) => c.is_correct);
      if (!hasCorrectAnswer) {
        toast({
          title: "خطأ في البيانات",
          description: "يجب تحديد إجابة صحيحة واحدة على الأقل",
          status: "error",
        });
        return;
      }

      let requestData;
      let config = token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        : { headers: { "Content-Type": "application/json" } };

      // إعداد البيانات حسب الصيغة المطلوبة
      requestData = {
        text: editForm.text.trim(),
        choices: editForm.choices.map((c) => ({
          text: c.text.trim(),
          is_correct: c.is_correct || false,
        })),
      };

      // إضافة الصورة إذا كانت موجودة (اختياري)
      if (selectedFile) {
        // محاولة رفع الصورة أولاً
        try {
          const imageFormData = new FormData();
          imageFormData.append("image", selectedFile);

          const imageResponse = await baseUrl.post(
            "/api/upload/image",
            imageFormData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (imageResponse.data?.image_url || imageResponse.data?.url) {
            requestData.image =
              imageResponse.data.image_url || imageResponse.data.url;
          } else {
            // إذا لم يتم إرجاع رابط، استخدم base64
            const base64Image = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.readAsDataURL(selectedFile);
            });
            requestData.image = base64Image;
          }
        } catch (imageError) {
          console.log(
            "Image upload failed, using existing image or base64:",
            imageError
          );
          // إذا فشل رفع الصورة، استخدم الصورة الحالية أو base64
          if (editForm.image) {
            requestData.image = editForm.image;
          } else if (selectedFile) {
            const base64Image = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.readAsDataURL(selectedFile);
            });
            requestData.image = base64Image;
          }
        }
      } else if (editForm.image) {
        // استخدام الصورة الحالية إذا لم يتم اختيار ملف جديد
        requestData.image = editForm.image;
      }

      console.log(
        "API Endpoint:",
        `/api/course/course-exam/question/${question.id}`
      );
      console.log("Request Data:", requestData);

      const response = await baseUrl.put(
        `/api/course/course-exam/question/${question.id}`,
        requestData,
        config
      );

      console.log("Response:", response.data);

      const matchId = (q) =>
        (q.type === "passage_sub" ? q.sub_question?.id : q.id) === question.id;
      const updatedChoices = editForm.choices.map((c) => ({
        ...c,
        text: c.text.trim(),
        is_correct: c.is_correct || false,
      }));
      const updatedImage = requestData.image || imagePreview || editForm.image;
      setQuestions((prev) =>
        prev.map((q) => {
          if (!matchId(q)) return q;
          if (q.type === "passage_sub") {
            return {
              ...q,
              sub_question: {
                ...q.sub_question,
                text: editForm.text.trim(),
                choices: updatedChoices,
                image: updatedImage,
              },
            };
          }
          return {
            ...q,
            text: editForm.text.trim(),
            choices: updatedChoices,
            image: updatedImage,
          };
        })
      );

      toast({ title: "تم التعديل بنجاح", status: "success" });
      setEditModal({ open: false, question: null });
      setSelectedFile(null);
      setImagePreview("");

      // إعادة جلب الأسئلة للتأكد من التحديث
      if (isTeacher || isAdmin) {
        await fetchQuestionsForTeacher();
      }
    } catch (error) {
      console.error("Error updating question:", error);
      console.error("Error response:", error.response?.data);
      toast({
        title: "فشل التعديل",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
      });
    }
  };

  // Set correct answer
  const [pendingCorrect, setPendingCorrect] = useState({}); // { [qid]: cid }
  const handleSetCorrect = async (qid, cid) => {
    // أظهر مباشرةً أن هذا هو الاختيار الحالي
    setPendingCorrect((prev) => ({ ...prev, [qid]: cid }));
    const matchQuestion = (q) =>
      (q.type === "passage_sub" ? q.sub_question?.id : q.id) === qid;
    const applyCorrect = (q, cidVal) => {
      if (q.type === "passage_sub") {
        return {
          ...q,
          sub_question: {
            ...q.sub_question,
            choices: q.sub_question.choices.map((c) => ({
              ...c,
              is_correct: c.id === cidVal,
            })),
          },
        };
      }
      return {
        ...q,
        choices: q.choices.map((c) => ({ ...c, is_correct: c.id === cidVal })),
      };
    };
    setQuestions((prev) =>
      prev.map((q) => (matchQuestion(q) ? applyCorrect(q, cid) : q))
    );
    try {
      const token = localStorage.getItem("token");
      await baseUrl.patch(
        `/api/questions/lecture-exam-question/${qid}/answer`,
        { correct_answer: cid },
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      toast({ title: "تم تحديد الإجابة الصحيحة", status: "success" });
      setPendingCorrect((prev) => {
        const copy = { ...prev };
        delete copy[qid];
        return copy;
      });
    } catch (error) {
      console.error("Error setting correct answer:", error);
      toast({
        title: "فشل تحديد الإجابة",
        description:
          error.response?.data?.message ||
          "حدث خطأ أثناء تحديد الإجابة الصحيحة",
        status: "error",
      });
      setQuestions((prev) =>
        prev.map((q) => (matchQuestion(q) ? applyCorrect(q, null) : q))
      );
      setPendingCorrect((prev) => {
        const copy = { ...prev };
        delete copy[qid];
        return copy;
      });
    }
  };

  // للطالب: عند اختيار إجابة
  const handleStudentChoice = (qid, cid) => {
    setStudentAnswers((prev) => ({ ...prev, [qid]: cid }));
  };

  // دوال التنقل بين الأسئلة
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  // للطالب: تسليم الامتحان
  const handleSubmitExam = async () => {
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem("token");
      const answersArr = Object.entries(studentAnswers).map(
        ([questionId, choiceId]) => ({
          questionId: Number(questionId),
          choiceId: Number(choiceId),
        })
      );
      const res = await baseUrl.post(
        `/api/exams/${id}/submit`,
        { answers: answersArr },
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );

      const result = res.data;
      setSubmitResult({
        attemptId: result.attemptId,
        status: result.status,
        totalGrade: result.totalGrade,
        maxGrade: result.maxGrade,
        passed: result.passed,
        wrongQuestions: result.wrongQuestions || [],
        releaseReason: result.releaseReason,
        showAnswers: result.showAnswers,
      });

      // تحديث حالة الامتحان
      setExamStatus(
        result.status === "submitted" || result.status === "late"
          ? "already_submitted"
          : examStatus
      );
      setCurrentAttempt(null);
      setRemainingSeconds(null);

      // إذا كان هناك feedback، تحديثه
      if (result.wrongQuestions && result.wrongQuestions.length > 0) {
        setFeedback({
          wrongQuestions: result.wrongQuestions,
          releaseReason: result.releaseReason || "immediate",
        });
      }

      toast({
        title: "تم تسليم الامتحان!",
        description: `الدرجة: ${result.totalGrade}/${result.maxGrade}`,
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      // إعادة جلب بيانات الامتحان لتحديث الحالة
      await fetchExamData();
    } catch (err) {
      console.error("Error submitting exam:", err);
      toast({
        title: "فشل تسليم الامتحان",
        description: err.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // فتح مودال إضافة الصور
  const openAddImageModal = () => {
    setSelectedImages([]);
    setImagePreviews([]);
    setAddImageModal({ open: true });
  };

  // إغلاق مودال إضافة الصور
  const closeAddImageModal = () => {
    setAddImageModal({ open: false });
    setSelectedImages([]);
    setImagePreviews([]);
  };

  // التعامل مع اختيار الصور
  const handleImageSelection = (e) => {
    const files = Array.from(e.target.files);

    // التحقق من عدد الصور (حد أقصى 10)
    if (files.length > 10) {
      toast({
        title: "خطأ",
        description: "يمكن رفع حتى 10 صور فقط",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // التحقق من نوع الملفات
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    const invalidFiles = files.filter(
      (file) => !validTypes.includes(file.type)
    );

    if (invalidFiles.length > 0) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملفات صورة صالحة (JPG, PNG, GIF)",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // التحقق من حجم الملفات (حد أقصى 5MB لكل صورة)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter((file) => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      toast({
        title: "خطأ",
        description: "حجم كل صورة يجب أن يكون أقل من 5MB",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSelectedImages(files);

    // إنشاء معاينة للصور
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  // إزالة صورة من القائمة
  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    // تحرير الذاكرة
    URL.revokeObjectURL(imagePreviews[index]);

    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  // رفع الصور كأسئلة
  const uploadImagesAsQuestions = async () => {
    if (selectedImages.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صور أولاً",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setUploadingImages(true);
    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("exam_id", id);

      // إضافة كل صورة
      selectedImages.forEach((image, index) => {
        formData.append("images", image);
      });

      const response = await baseUrl.post(
        "/api/questions/lecture-exam-question",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Images uploaded successfully:", response.data);

      toast({
        title: "تم رفع الصور بنجاح",
        description: `تم رفع ${selectedImages.length} صورة كأسئلة`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // إعادة تحميل الأسئلة
      if (isTeacher || isAdmin) {
        await fetchQuestionsForTeacher();
      } else {
        await fetchExamData();
      }

      // إغلاق المودال
      closeAddImageModal();
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: "خطأ في رفع الصور",
        description: error.response?.data?.message || "حدث خطأ أثناء رفع الصور",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploadingImages(false);
    }
  };

  // إضافة مجموعة أسئلة كنص — POST /api/exams/lecture/:examId/questions/bulk
  const submitBulkTextQuestions = async () => {
    const text = bulkTextInput.trim();
    if (!text) {
      toast({ title: "يرجى إدخال نص الأسئلة", status: "warning", isClosable: true });
      return;
    }
    const payload = { text };
    if (bulkCorrectAnswers.trim()) {
      const answers = bulkCorrectAnswers
        .split(/[\s,،]+/)
        .map((a) => a.trim().toUpperCase())
        .filter((a) => ["A", "B", "C", "D"].includes(a));
      if (answers.length > 0) payload.correctAnswers = answers;
    }
    setBulkTextLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await baseUrl.post(
        `/api/exams/lecture/${id}/questions/bulk`,
        payload,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      const count = res.data?.count ?? 0;
      toast({
        title: res.data?.message || `تمت إضافة ${count} سؤال`,
        status: "success",
        isClosable: true,
      });
      setBulkTextInput("");
      setBulkCorrectAnswers("");
      setBulkTextModalOpen(false);
      if (isTeacher || isAdmin) await fetchQuestionsForTeacher();
      else await fetchExamData();
    } catch (err) {
      toast({
        title: "تعذر إضافة الأسئلة",
        description: err.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        isClosable: true,
      });
    } finally {
      setBulkTextLoading(false);
    }
  };

  const resetPassageForm = () => {
    setPassageForm({
      title: "",
      content: "",
      questionsBulkText: "",
    });
  };

  // إنشاء قطعة + أسئلة bulk وربطها بالامتحان — POST /api/exams/lecture/:examId/questions/passage/bulk
  const submitPassageQuestions = async () => {
    if (
      !passageForm.content.trim() ||
      !passageForm.questionsBulkText.trim()
    ) {
      toast({
        title: "يرجى إدخال المحتوى ونص الأسئلة",
        status: "warning",
        isClosable: true,
      });
      return;
    }

    setPassageLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await baseUrl.post(
        `/api/exams/lecture/${id}/questions/passage/bulk`,
        {
          title: passageForm.title.trim(),
          content: passageForm.content.trim(),
          passage: passageForm.content.trim(),
          text: passageForm.questionsBulkText.trim(),
          questionText: passageForm.questionsBulkText.trim(),
          questionsBulkText: passageForm.questionsBulkText.trim(),
          bulkQuestionsText: passageForm.questionsBulkText.trim(),
          mcqText: passageForm.questionsBulkText.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast({
        title: res.data?.message || "تمت إضافة أسئلة القطعة بنجاح",
        status: "success",
        isClosable: true,
      });

      resetPassageForm();
      setPassageModalOpen(false);

      if (isTeacher || isAdmin) await fetchQuestionsForTeacher();
      else await fetchExamData();
    } catch (err) {
      toast({
        title: "تعذر إضافة أسئلة القطعة",
        description: err.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        isClosable: true,
      });
    } finally {
      setPassageLoading(false);
    }
  };

  // فتح مودال إضافة صورة لسؤال محدد
  const openAddQuestionImageModal = (questionId) => {
    setAddQuestionImageModal({ open: true, questionId });
    setSelectedQuestionImage(null);
    setQuestionImagePreview("");
  };

  // إغلاق مودال إضافة صورة لسؤال محدد
  const closeAddQuestionImageModal = () => {
    setAddQuestionImageModal({ open: false, questionId: null });
    setSelectedQuestionImage(null);
    setQuestionImagePreview("");
  };

  // التعامل مع اختيار صورة لسؤال محدد
  const handleQuestionImageSelection = (e) => {
    const file = e.target.files[0];
    if (file) {
      // التحقق من نوع الملف
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "خطأ",
          description: "يرجى اختيار ملف صورة صالح (JPG, PNG, GIF)",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // التحقق من حجم الملف (حد أقصى 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          title: "خطأ",
          description: "حجم الصورة يجب أن يكون أقل من 5MB",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setSelectedQuestionImage(file);

      // إنشاء معاينة للصورة
      const reader = new FileReader();
      reader.onload = (e) => {
        setQuestionImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // رفع صورة لسؤال محدد
  const uploadQuestionImage = async () => {
    if (!selectedQuestionImage || !addQuestionImageModal.questionId) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورة أولاً",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setUploadingQuestionImage(true);
    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("image", selectedQuestionImage);

      const response = await baseUrl.patch(
        `/api/questions/lecture-exam-question/${addQuestionImageModal.questionId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Question image uploaded successfully:", response.data);

      toast({
        title: "تم رفع الصورة بنجاح",
        description: "تم إضافة الصورة للسؤال بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // إعادة تحميل الأسئلة
      if (isTeacher || isAdmin) {
        await fetchQuestionsForTeacher();
      } else {
        await fetchExamData();
      }

      // إغلاق المودال
      closeAddQuestionImageModal();
    } catch (error) {
      console.error("Error uploading question image:", error);
      toast({
        title: "خطأ في رفع الصورة",
        description:
          error.response?.data?.message || "حدث خطأ أثناء رفع الصورة",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploadingQuestionImage(false);
    }
  };

  if (loading) {
    return <BrandLoadingScreen />;
  }

  if (error) {
    return (
      <Box minH="100vh" bg={pageBg} pt="100px" pb={10} dir="rtl">
        <Container maxW="container.md">
          <Box
            p={8}
            borderRadius="2xl"
            bg={cardBg}
            borderWidth="1px"
            borderColor={cardBorder}
            boxShadow="lg"
          >
            <Alert status="error" borderRadius="xl">
              <AlertIcon />
              <Text fontWeight="medium">{error}</Text>
            </Alert>
          </Box>
        </Container>
      </Box>
    );
  }

  // عرض الحالات المختلفة للطلاب
  if (student && !isTeacher && !isAdmin) {
    if (examStatus === "hidden") {
      return (
        <Box minH="100vh" bg={pageBg} pt="100px" pb={10} dir="rtl">
          <Container maxW="container.sm">
            <Box
              p={8}
              borderRadius="2xl"
              bg={cardBg}
              borderWidth="1px"
              borderColor={cardBorder}
              boxShadow="lg"
            >
              <Alert status="warning" borderRadius="xl">
                <AlertIcon />
                <VStack spacing={2} align="start">
                  <Text fontWeight="bold" color={headingColor}>
                    الامتحان غير متاح
                  </Text>
                  <Text color={subtextColor}>
                    هذا الامتحان غير مرئي حالياً.
                  </Text>
                </VStack>
              </Alert>
            </Box>
          </Container>
        </Box>
      );
    }

    if (examStatus === "not_open_yet") {
      return (
        <Box minH="100vh" bg={pageBg} pt="100px" pb={10} dir="rtl">
          <Container maxW="container.sm">
            <Box
              p={8}
              borderRadius="2xl"
              bg={cardBg}
              borderWidth="1px"
              borderColor={cardBorder}
              boxShadow="lg"
            >
              <Alert status="info" borderRadius="xl">
                <AlertIcon />
                <VStack spacing={2} align="start">
                  <Text fontWeight="bold" color={headingColor}>
                    الامتحان لم يفتح بعد
                  </Text>
                  <Text color={subtextColor}>
                    سيتم فتح الامتحان في الوقت المحدد.
                  </Text>
                  {examData?.startWindow && (
                    <Text fontSize="sm" color={subtextColor}>
                      موعد الفتح:{" "}
                      {new Date(examData.startWindow).toLocaleString("ar-EG")}
                    </Text>
                  )}
                </VStack>
              </Alert>
            </Box>
          </Container>
        </Box>
      );
    }

    if (examStatus === "closed") {
      return (
        <Box minH="100vh" bg={pageBg} pt="100px" pb={10} dir="rtl">
          <Container maxW="container.sm">
            <Box
              p={8}
              borderRadius="2xl"
              bg={cardBg}
              borderWidth="1px"
              borderColor={cardBorder}
              boxShadow="lg"
            >
              <Alert status="error" borderRadius="xl">
                <AlertIcon />
                <VStack spacing={2} align="start">
                  <Text fontWeight="bold" color={headingColor}>
                    الامتحان مغلق
                  </Text>
                  <Text color={subtextColor}>
                    انتهت فترة الامتحان ولا يمكن بدء محاولات جديدة.
                  </Text>
                  {examData?.endWindow && (
                    <Text fontSize="sm" color={subtextColor}>
                      موعد الإغلاق:{" "}
                      {new Date(examData.endWindow).toLocaleString("ar-EG")}
                    </Text>
                  )}
                </VStack>
              </Alert>
            </Box>
          </Container>
        </Box>
      );
    }

    if (examStatus === "already_submitted" && !feedback) {
      return (
        <Box minH="100vh" bg={pageBg} pt="100px" pb={10} dir="rtl">
          <Container maxW="container.sm">
            <Box
              p={8}
              borderRadius="2xl"
              bg={cardBg}
              borderWidth="1px"
              borderColor={cardBorder}
              boxShadow="lg"
            >
              <Alert status="info" borderRadius="xl">
                <AlertIcon />
                <VStack spacing={4} align="start">
                  <Text fontWeight="bold" color={headingColor}>
                    تم إكمال الامتحان
                  </Text>
                  <Text color={subtextColor}>
                    لقد أكملت هذا الامتحان بالفعل.
                  </Text>
                  {attemptHistory.length > 0 && (
                    <Box w="full">
                      <Text fontWeight="bold" mb={2} color={headingColor}>
                        تاريخ المحاولات:
                      </Text>
                      <VStack spacing={2} align="stretch">
                        {attemptHistory.map((attempt, idx) => (
                          <Box
                            key={attempt.attemptId}
                            p={3}
                            bg={pageBg}
                            borderRadius="xl"
                            borderWidth="1px"
                            borderColor={cardBorder}
                          >
                            <HStack justify="space-between">
                              <Text color={headingColor}>
                                المحاولة {idx + 1}
                              </Text>
                              <Badge
                                bg={
                                  attempt.status === "submitted"
                                    ? "green.500"
                                    : attempt.status === "late"
                                    ? "orange.500"
                                    : "red.500"
                                }
                                color="white"
                                borderRadius="full"
                                px={3}
                              >
                                {attempt.status === "submitted"
                                  ? "تم التسليم"
                                  : attempt.status === "late"
                                  ? "متأخر"
                                  : "منتهي"}
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color={subtextColor}>
                              الدرجة: {attempt.totalGrade} | التاريخ:{" "}
                              {attempt.submittedAt
                                ? new Date(attempt.submittedAt).toLocaleString(
                                    "ar-EG"
                                  )
                                : "غير متاح"}
                            </Text>
                          </Box>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </Alert>
            </Box>
          </Container>
        </Box>
      );
    }

    // إذا كان ready ولكن لا توجد محاولة نشطة، عرض زر البدء
    if (examStatus === "ready" && !currentAttempt && questions.length === 0) {
      return (
        <ExamReadyScreen
          examData={examData}
          startingAttempt={startingAttempt}
          onStart={startAttempt}
          pageBg={pageBg}
          cardBg={cardBg}
          cardBorder={cardBorder}
          headingColor={headingColor}
          subtextColor={subtextColor}
        />
      );
    }
  }

  // عرض درجات الطلاب
  if (showGrades) {
    return (
      <>
        <ExamSubmissionsView
          submissions={gradesData || []}
          loading={gradesLoading}
          error={gradesError}
          onBack={() => setShowGrades(false)}
          onRetry={fetchGrades}
          onZoomImage={(src) => {
            setImageZoomSrc(src);
            setImageZoomOpen(true);
          }}
        />
        <Modal
          isOpen={imageZoomOpen}
          onClose={() => {
            setImageZoomOpen(false);
            setImageZoomSrc(null);
          }}
          size="4xl"
          isCentered
        >
          <ModalOverlay bg="blackAlpha.800" />
          <ModalContent bg="transparent" boxShadow="none">
            <ModalBody p={4} display="flex" justifyContent="center">
              {imageZoomSrc && (
                <Image
                  src={imageZoomSrc}
                  alt="تكبير صورة"
                  maxH="85vh"
                  objectFit="contain"
                  borderRadius="lg"
                  cursor="pointer"
                  onClick={() => {
                    setImageZoomOpen(false);
                    setImageZoomSrc(null);
                  }}
                />
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    );
  }

  return (
    <>
      {isStaff ? (
        <TeacherExamShell
          examTitle={examData?.title}
          questionsCount={questions.length}
          onGrades={fetchGrades}
          onReport={() => navigate(`/ComprehensiveExam/${id}/report`)}
          onAddImages={openAddImageModal}
          onBulkText={() => setBulkTextModalOpen(true)}
          onPassage={() => setPassageModalOpen(true)}
          onAiExtract={() => setAiExtractionModalOpen(true)}
          onReload={fetchExamData}
          loading={loading}
        >
          {questions.length > 0 ? (
            <VStack spacing={4} align="stretch" w="full">
              {questions.map((q, idx) => {
                const isPassageSub = q.type === "passage_sub";
                const displayId = isPassageSub ? q.sub_question.id : q.id;
                const displayText = isPassageSub ? q.sub_question.text : q.text;
                const displayImage = isPassageSub ? q.sub_question.image : q.image;
                const displayChoices = isPassageSub
                  ? q.sub_question.choices
                  : q.choices;
                const passageContent = isPassageSub
                  ? q.passage?.content
                  : q.passage?.content;
                return (
                  <TeacherQuestionCard
                    key={displayId}
                    index={idx}
                    displayId={displayId}
                    displayText={displayText}
                    displayImage={displayImage}
                    displayChoices={displayChoices}
                    passageContent={passageContent}
                    questionRef={isPassageSub ? { ...q.sub_question } : q}
                    pendingCorrect={pendingCorrect}
                    onZoomImage={(src) => {
                      setImageZoomSrc(src);
                      setImageZoomOpen(true);
                    }}
                    onAddImage={openAddQuestionImageModal}
                    onEdit={openEditModal}
                    onDelete={(qid) => setDeleteModal({ open: true, qid })}
                    onSetCorrect={handleSetCorrect}
                  />
                );
              })}
            </VStack>
          ) : (
            <TeacherExamEmptyState
              onAiExtract={() => setAiExtractionModalOpen(true)}
              onBulkText={() => setBulkTextModalOpen(true)}
              onReload={fetchExamData}
              loading={loading}
            />
          )}
        </TeacherExamShell>
      ) : (
    <Box
      minH="100vh"
      bg={pageBg}
      pt="100px"
      pb={10}
      dir="rtl"
      style={{ fontFamily: "'Noto Sans Arabic', 'Segoe UI', sans-serif" }}
    >
      <Container maxW="container.md" px={{ base: 4, md: 6 }}>
          <Box
              borderRadius="2xl"
              bg={cardBg}
              borderWidth="1px"
              borderColor={cardBorder}
              boxShadow="lg"
              overflow="hidden"
              mb={8}
            >
              <Box h="1" w="100%" bgGradient="linear(to-r, blue.500, orange.500)" />
              <Box px={{ base: 4, md: 6 }} py={6}>
            <VStack
              spacing={{ base: 4, sm: 5, md: 6 }}
              mb={{ base: 4, sm: 5, md: 6 }}
            >
              {student && !submitResult && (
                <Text
                  color={subtextColor}
                  textAlign="center"
                  fontSize="sm"
                  px={{ base: 2, sm: 4 }}
                >
                  أجب على جميع الأسئلة ثم اضغط تسليم الامتحان
                </Text>
              )}
            </VStack>
            <VStack spacing={{ base: 5, sm: 6, md: 6 }} align="stretch">
              {(submitResult ||
                (feedback &&
                  feedback.wrongQuestions &&
                  feedback.wrongQuestions.length > 0)) &&
              student ? (
                <ExamResultPanel
                  submitResult={submitResult}
                  feedback={feedback}
                  attemptHistory={attemptHistory}
                  examData={examData}
                  onZoomImage={(src) => {
                    setImageZoomSrc(src);
                    setImageZoomOpen(true);
                  }}
                />
              ) : (
                <>
                  {questions.length > 0 &&
                    (() => {
                      const currentItem = questions[currentQuestionIndex];
                      const isPassageSub = currentItem?.type === "passage_sub";
                      const questionId = isPassageSub
                        ? currentItem?.sub_question?.id
                        : currentItem?.id;
                      const questionText = isPassageSub
                        ? currentItem?.sub_question?.text
                        : currentItem?.text;
                      const questionImage = isPassageSub
                        ? currentItem?.sub_question?.image
                        : currentItem?.image;
                      const questionChoices = isPassageSub
                        ? currentItem?.sub_question?.choices
                        : currentItem?.choices;
                      const passageContent = isPassageSub
                        ? currentItem?.passage?.content
                        : currentItem?.passage?.content;
                      return (
                        <>
                          <ExamStudentProgress
                            remainingSeconds={remainingSeconds}
                            answeredCount={Object.keys(studentAnswers).length}
                            totalQuestions={questions.length}
                            questions={questions}
                            currentQuestionIndex={currentQuestionIndex}
                            studentAnswers={studentAnswers}
                            showPagination={showPagination}
                            onGoToQuestion={goToQuestion}
                            hasActiveAttempt={!!currentAttempt}
                          />

                          <StudentQuestionPanel
                            questionIndex={currentQuestionIndex}
                            totalQuestions={questions.length}
                            questionId={questionId}
                            questionText={questionText}
                            questionImage={questionImage}
                            questionChoices={questionChoices}
                            passageContent={passageContent}
                            studentAnswers={studentAnswers}
                            submitResult={submitResult}
                            onChoice={handleStudentChoice}
                            onZoomImage={(src) => {
                              setImageZoomSrc(src);
                              setImageZoomOpen(true);
                            }}
                            headingColor={headingColor}
                            subtextColor={subtextColor}
                            cardBg={cardBg}
                          />

                          <HStack
                            mt={5}
                            spacing={3}
                            justify="space-between"
                            flexWrap="wrap"
                          >
                            <Button
                              variant="outline"
                              onClick={goToPreviousQuestion}
                              isDisabled={currentQuestionIndex === 0}
                              size="md"
                              borderRadius="lg"
                              flex={{ base: "1", sm: "none" }}
                            >
                              السابق
                            </Button>

                            {Object.keys(studentAnswers).length === questions.length && (
                              <Button
                                colorScheme="green"
                                onClick={handleSubmitExam}
                                isLoading={submitLoading}
                                size="md"
                                borderRadius="lg"
                                flex={{ base: "1 1 100%", sm: "none" }}
                                order={{ base: 3, sm: 0 }}
                              >
                                {submitLoading ? "جاري التسليم..." : "تسليم الامتحان"}
                              </Button>
                            )}

                            <Button
                              colorScheme="blue"
                              onClick={goToNextQuestion}
                              isDisabled={currentQuestionIndex === questions.length - 1}
                              size="md"
                              borderRadius="lg"
                              flex={{ base: "1", sm: "none" }}
                            >
                              {currentQuestionIndex === questions.length - 1 ? "آخر سؤال" : "التالي"}
                            </Button>
                          </HStack>
                        </>
                      );
                    })()}
                </>
              )}
            </VStack>
              </Box>
            </Box>
      </Container>
    </Box>
      )}

            {/* Edit Modal */}
            <Modal
              isOpen={editModal.open}
              onClose={() => setEditModal({ open: false, question: null })}
              size={{ base: "sm", sm: "md", md: "lg" }}
            >
              <ModalOverlay />
              <ModalContent mx={{ base: 2, sm: 4 }}>
                <ModalHeader fontSize={{ base: "md", sm: "lg" }}>
                  تعديل السؤال
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <VStack spacing={{ base: 3, sm: 4 }} align="stretch">
                    <FormControl>
                      <FormLabel>نص السؤال:</FormLabel>
                      <Input
                        value={editForm.text}
                        onChange={(e) =>
                          handleEditChange("text", e.target.value)
                        }
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize={{ base: "sm", sm: "md" }}>
                        صورة السؤال:
                      </FormLabel>
                      <VStack spacing={{ base: 2, sm: 3 }} align="stretch">
                        {/* معاينة الصورة الحالية */}
                        {imagePreview && (
                          <Box>
                            <Text
                              fontSize={{ base: "xs", sm: "sm" }}
                              color="gray.600"
                              mb={2}
                            >
                              الصورة الحالية:
                            </Text>
                            <Box
                              maxW="100%"
                              borderRadius="xl"
                              overflow="hidden"
                              boxShadow="lg"
                              border="2px solid"
                              borderColor="blue.200"
                              bg="white"
                              p={2}
                              position="relative"
                            >
                              <Image
                                src={imagePreview}
                                alt="معاينة الصورة"
                                borderRadius="lg"
                                maxW="100%"
                                maxH={{
                                  base: "200px",
                                  sm: "250px",
                                  md: "300px",
                                }}
                                objectFit="contain"
                                bg="gray.50"
                                fallback={
                                  <Box
                                    w="full"
                                    h="150px"
                                    bg="gray.100"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    borderRadius="lg"
                                  >
                                    <Text color="gray.500">
                                      خطأ في تحميل الصورة
                                    </Text>
                                  </Box>
                                }
                              />
                              {/* مؤشر معاينة */}
                              <Box
                                position="absolute"
                                top="4px"
                                right="4px"
                                bg="green.500"
                                color="white"
                                px={2}
                                py={1}
                                borderRadius="full"
                                fontSize="xs"
                                fontWeight="bold"
                                boxShadow="md"
                              >
                                معاينة
                              </Box>
                            </Box>
                          </Box>
                        )}

                        {/* رفع ملف جديد */}
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          p={{ base: 1, sm: 2 }}
                          border="2px dashed"
                          borderColor="blue.200"
                          borderRadius="md"
                          _hover={{ borderColor: "blue.300" }}
                          fontSize={{ base: "xs", sm: "sm" }}
                        />

                        {/* رابط الصورة (اختياري) */}
                        <FormControl>
                          <FormLabel
                            fontSize={{ base: "xs", sm: "sm" }}
                            color="gray.600"
                          >
                            أو رابط الصورة (اختياري)
                          </FormLabel>
                          <Input
                            value={editForm.image}
                            onChange={(e) =>
                              handleEditChange("image", e.target.value)
                            }
                            placeholder="https://example.com/image.jpg"
                            fontSize={{ base: "xs", sm: "sm" }}
                          />
                        </FormControl>
                      </VStack>
                    </FormControl>

                    <FormControl>
                      <FormLabel>الاختيارات:</FormLabel>
                      <VStack spacing={2}>
                        {editForm.choices.map((choice, idx) => (
                          <Input
                            key={choice.id}
                            value={choice.text}
                            onChange={(e) =>
                              handleChoiceChange(idx, e.target.value)
                            }
                            placeholder={`اختيار ${String.fromCharCode(
                              65 + idx
                            )}`}
                          />
                        ))}
                      </VStack>
                    </FormControl>
                  </VStack>
                </ModalBody>
                <ModalFooter>
                  <Button
                    colorScheme="blue"
                    mr={3}
                    onClick={handleEditSave}
                    size={{ base: "sm", sm: "md" }}
                    fontSize={{ base: "sm", sm: "md" }}
                    px={{ base: 3, sm: 4 }}
                    py={{ base: 2, sm: 3 }}
                    minW={{ base: "80px", sm: "100px" }}
                  >
                    حفظ
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setEditModal({ open: false, question: null })
                    }
                    size={{ base: "sm", sm: "md" }}
                    fontSize={{ base: "sm", sm: "md" }}
                    px={{ base: 3, sm: 4 }}
                    py={{ base: 2, sm: 3 }}
                    minW={{ base: "80px", sm: "100px" }}
                  >
                    إلغاء
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
            {/* Delete Modal */}
            <Modal
              isOpen={deleteModal.open}
              onClose={() => setDeleteModal({ open: false, qid: null })}
              isCentered
            >
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>تأكيد الحذف</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Text>
                    هل أنت متأكد أنك تريد حذف هذا السؤال؟ لا يمكن التراجع عن هذه
                    العملية.
                  </Text>
                </ModalBody>
                <ModalFooter>
                  <Button
                    colorScheme="red"
                    mr={3}
                    onClick={handleDelete}
                    isLoading={deleting}
                    size={{ base: "sm", sm: "md" }}
                    fontSize={{ base: "sm", sm: "md" }}
                    px={{ base: 3, sm: 4 }}
                    py={{ base: 2, sm: 3 }}
                    minW={{ base: "100px", sm: "120px" }}
                  >
                    تأكيد الحذف
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setDeleteModal({ open: false, qid: null })}
                    size={{ base: "sm", sm: "md" }}
                    fontSize={{ base: "sm", sm: "md" }}
                    px={{ base: 3, sm: 4 }}
                    py={{ base: 2, sm: 3 }}
                    minW={{ base: "80px", sm: "100px" }}
                  >
                    إلغاء
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

            {/* Add Images Modal */}
            <Modal
              isOpen={addImageModal.open}
              onClose={closeAddImageModal}
              size="xl"
            >
              <ModalOverlay />
              <ModalContent mx={{ base: 2, sm: 4 }}>
                <ModalHeader fontSize={{ base: "md", sm: "lg" }}>
                  إضافة أسئلة كصور
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <VStack spacing={6} align="stretch">
                    {/* تعليمات */}
                    <Box
                      p={4}
                      bg="blue.50"
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="blue.200"
                    >
                      <VStack spacing={2} align="start">
                        <Text fontWeight="bold" color="blue.700" fontSize="sm">
                          تعليمات إضافة الصور:
                        </Text>
                        <Text fontSize="sm" color="blue.600">
                          • يمكن رفع حتى 10 صور كحد أقصى
                        </Text>
                        <Text fontSize="sm" color="blue.600">
                          • أنواع الصور المدعومة: JPG, PNG, GIF
                        </Text>
                        <Text fontSize="sm" color="blue.600">
                          • حجم كل صورة يجب أن يكون أقل من 5MB
                        </Text>
                      </VStack>
                    </Box>

                    {/* رفع الملفات */}
                    <FormControl>
                      <FormLabel fontSize={{ base: "sm", sm: "md" }}>
                        اختيار الصور:
                      </FormLabel>
                      <Box
                        p={6}
                        border="2px dashed"
                        borderColor="purple.300"
                        borderRadius="lg"
                        textAlign="center"
                        _hover={{ borderColor: "purple.400", bg: "purple.50" }}
                        transition="all 0.2s"
                      >
                        <Input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageSelection}
                          display="none"
                          id="image-upload"
                        />
                        <label htmlFor="image-upload">
                          <VStack spacing={2} cursor="pointer">
                            <Icon
                              as={AiFillStar}
                              boxSize={8}
                              color="purple.400"
                            />
                            <Text color="purple.600" fontWeight="medium">
                              اضغط هنا لاختيار الصور
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              أو اسحب الصور هنا
                            </Text>
                          </VStack>
                        </label>
                      </Box>
                    </FormControl>

                    {/* معاينة الصور المختارة */}
                    {imagePreviews.length > 0 && (
                      <Box>
                        <Text fontWeight="bold" color="gray.700" mb={3}>
                          الصور المختارة ({imagePreviews.length}):
                        </Text>
                        <Box
                          maxH="300px"
                          overflowY="auto"
                          p={2}
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="lg"
                          bg="gray.50"
                        >
                          <VStack spacing={3} align="stretch">
                            {imagePreviews.map((preview, index) => (
                              <Box
                                key={index}
                                p={3}
                                bg="white"
                                borderRadius="lg"
                                border="1px solid"
                                borderColor="gray.200"
                                position="relative"
                              >
                                <HStack spacing={3} align="start">
                                  <Image
                                    src={preview}
                                    alt={`معاينة ${index + 1}`}
                                    w="100px"
                                    h="80px"
                                    objectFit="contain"
                                    borderRadius="lg"
                                    border="2px solid"
                                    borderColor="purple.200"
                                    bg="white"
                                    boxShadow="md"
                                    _hover={{
                                      transform: "scale(1.05)",
                                      borderColor: "purple.300",
                                    }}
                                    transition="all 0.2s ease"
                                  />
                                  <VStack align="start" flex={1} spacing={1}>
                                    <Text
                                      fontSize="sm"
                                      fontWeight="medium"
                                      color="gray.700"
                                    >
                                      الصورة {index + 1}
                                    </Text>
                                    <Text fontSize="xs" color="gray.500">
                                      الحجم:{" "}
                                      {(
                                        selectedImages[index].size /
                                        1024 /
                                        1024
                                      ).toFixed(2)}{" "}
                                      MB
                                    </Text>
                                    <Text fontSize="xs" color="gray.500">
                                      النوع: {selectedImages[index].type}
                                    </Text>
                                  </VStack>
                                  <IconButton
                                    aria-label="إزالة الصورة"
                                    size="sm"
                                    colorScheme="red"
                                    variant="ghost"
                                    onClick={() => removeImage(index)}
                                    icon={<AiFillDelete boxSize={4} />}
                                  />
                                </HStack>
                              </Box>
                            ))}
                          </VStack>
                        </Box>
                      </Box>
                    )}
                  </VStack>
                </ModalBody>
                <ModalFooter>
                  <Button
                    colorScheme="purple"
                    mr={3}
                    onClick={uploadImagesAsQuestions}
                    isLoading={uploadingImages}
                    isDisabled={selectedImages.length === 0}
                    size={{ base: "sm", sm: "md" }}
                    fontSize={{ base: "sm", sm: "md" }}
                    px={{ base: 4, sm: 6 }}
                    py={{ base: 2, sm: 3 }}
                    minW={{ base: "120px", sm: "140px" }}
                    leftIcon={<Icon as={AiFillStar} boxSize={4} />}
                  >
                    {uploadingImages ? "جاري الرفع..." : "رفع الصور"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={closeAddImageModal}
                    size={{ base: "sm", sm: "md" }}
                    fontSize={{ base: "sm", sm: "md" }}
                    px={{ base: 3, sm: 4 }}
                    py={{ base: 2, sm: 3 }}
                    minW={{ base: "80px", sm: "100px" }}
                  >
                    إلغاء
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

            <AiQuestionExtractionModal
              isOpen={aiExtractionModalOpen}
              onClose={() => setAiExtractionModalOpen(false)}
              examId={id}
              examTitle={examData?.title}
              onImported={async () => {
                if (isTeacher || isAdmin) await fetchQuestionsForTeacher();
                else await fetchExamData();
              }}
            />

            {/* إضافة مجموعة أسئلة كنص (Bulk) — امتحان المحاضرة */}
            <Modal
              isOpen={bulkTextModalOpen}
              onClose={() => {
                setBulkTextModalOpen(false);
                setBulkTextInput("");
                setBulkCorrectAnswers("");
              }}
              size="xl"
              isCentered
            >
              <ModalOverlay />
              <ModalContent mx={{ base: 2, sm: 4 }} maxH="90vh">
                <ModalHeader fontSize={{ base: "md", sm: "lg" }}>
                  إضافة مجموعة أسئلة (نص)
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody overflowY="auto">
                  <VStack spacing={5} align="stretch">
                    <Box
                      p={4}
                      bg="green.50"
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="green.200"
                    >
                      <VStack spacing={2} align="start">
                        <Text fontWeight="bold" color="green.700" fontSize="sm">
                          شكل النص:
                        </Text>
                        <Text fontSize="sm" color="green.700">
                          كل سؤال: سطر أو أكثر لنص السؤال، ثم أربعة أسطر بالترتيب <strong>a.</strong> ثم <strong>b.</strong> ثم <strong>c.</strong> ثم <strong>d.</strong>
                          يمكن وضع سطر فاضي بين الأسئلة.
                        </Text>
                      </VStack>
                    </Box>
                    <FormControl>
                      <FormLabel fontWeight="600">نص الأسئلة (مطلوب)</FormLabel>
                      <Textarea
                        rows={12}
                        placeholder={`أي مما يلي لا يعتبر من الجزيئات العضوية الصغيرة؟\na. الأحماض النووية\nb. الأحماض الأمينية\nc. الأحماض الدهنية\nd. لا توجد إجابة صحيحة\n\nأي المركبات الآتية يحتوي على أقل عدد من جزيئات الجلوكوز؟\na. السليلوز\nb. السكروز\nc. النشا\nd. الكيتين`}
                        value={bulkTextInput}
                        onChange={(e) => setBulkTextInput(e.target.value)}
                        borderRadius="lg"
                        fontSize="sm"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontWeight="600" fontSize="sm">
                        الإجابات الصحيحة بالترتيب (اختياري) — مثل: C,D,D,D,C,A,D
                      </FormLabel>
                      <Input
                        placeholder="C, D, D, D, C, A, D"
                        value={bulkCorrectAnswers}
                        onChange={(e) => setBulkCorrectAnswers(e.target.value)}
                        borderRadius="lg"
                      />
                      <Text fontSize="xs" color="gray.500" mt={2}>
                        إن لم تُدخل، تُعامل كل الأسئلة إجابتها الصحيحة A.
                      </Text>
                    </FormControl>
                  </VStack>
                </ModalBody>
                <ModalFooter>
                  <Button
                    colorScheme="green"
                    onClick={submitBulkTextQuestions}
                    isLoading={bulkTextLoading}
                    leftIcon={<Icon as={FaBookOpen} boxSize={4} />}
                    size={{ base: "sm", sm: "md" }}
                  >
                    إضافة مجموعة الأسئلة
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setBulkTextModalOpen(false);
                      setBulkTextInput("");
                      setBulkCorrectAnswers("");
                    }}
                  >
                    إلغاء
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

            {/* إضافة أسئلة من قطعة */}
            <Modal
              isOpen={passageModalOpen}
              onClose={() => {
                setPassageModalOpen(false);
                resetPassageForm();
              }}
              size="xl"
              isCentered
            >
              <ModalOverlay />
              <ModalContent mx={{ base: 2, sm: 4 }}>
                <ModalHeader fontSize={{ base: "md", sm: "lg" }}>
                  إنشاء قطعة وإضافة أسئلتها
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody maxH="70vh" overflowY="auto">
                  <VStack spacing={4} align="stretch">
                    <Box
                      p={4}
                      bg="teal.50"
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="teal.200"
                    >
                      <Text fontSize="sm" color="teal.700">
                        سيتم إنشاء قطعة جديدة وربط أسئلة الاختيار من متعدد بالامتحان من نص واحد.
                      </Text>
                    </Box>
                    <FormControl>
                      <FormLabel fontWeight="600">عنوان القطعة (اختياري)</FormLabel>
                      <Input
                        placeholder="Reading Passage 1"
                        value={passageForm.title}
                        onChange={(e) =>
                          setPassageForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        borderRadius="lg"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel fontWeight="600">محتوى القطعة</FormLabel>
                      <Textarea
                        rows={4}
                        placeholder="Ali woke up early and went to school..."
                        value={passageForm.content}
                        onChange={(e) =>
                          setPassageForm((prev) => ({
                            ...prev,
                            content: e.target.value,
                          }))
                        }
                        borderRadius="lg"
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel fontWeight="600">questionsBulkText</FormLabel>
                      <Textarea
                        rows={10}
                        placeholder={`1- السؤال الأول
(أ) الاختيار الأول
(ب) الاختيار الثاني
(ج) الاختيار الثالث
(د) الاختيار الرابع

2- السؤال الثاني
(أ) ...
(ب) ...
(ج) ...
(د) ...`}
                        value={passageForm.questionsBulkText}
                        onChange={(e) =>
                          setPassageForm((prev) => ({
                            ...prev,
                            questionsBulkText: e.target.value,
                          }))
                        }
                        borderRadius="lg"
                      />
                    </FormControl>
                  </VStack>
                </ModalBody>
                <ModalFooter>
                  <Button
                    colorScheme="teal"
                    onClick={submitPassageQuestions}
                    isLoading={passageLoading}
                    size={{ base: "sm", sm: "md" }}
                  >
                    إضافة أسئلة القطعة
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setPassageModalOpen(false);
                      resetPassageForm();
                    }}
                  >
                    إلغاء
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

            {/* Add Question Image Modal */}
            <Modal
              isOpen={addQuestionImageModal.open}
              onClose={closeAddQuestionImageModal}
              size="md"
            >
              <ModalOverlay />
              <ModalContent mx={{ base: 2, sm: 4 }}>
                <ModalHeader fontSize={{ base: "md", sm: "lg" }}>
                  إضافة صورة للسؤال
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <VStack spacing={6} align="stretch">
                    {/* تعليمات */}
                    <Box
                      p={4}
                      bg="purple.50"
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="purple.200"
                    >
                      <VStack spacing={2} align="start">
                        <Text
                          fontWeight="bold"
                          color="purple.700"
                          fontSize="sm"
                        >
                          تعليمات إضافة الصورة:
                        </Text>
                        <Text fontSize="sm" color="purple.600">
                          • أنواع الصور المدعومة: JPG, PNG, GIF
                        </Text>
                        <Text fontSize="sm" color="purple.600">
                          • حجم الصورة يجب أن يكون أقل من 5MB
                        </Text>
                      </VStack>
                    </Box>

                    {/* معاينة الصورة المختارة */}
                    {questionImagePreview && (
                      <Box>
                        <Text fontWeight="bold" color="gray.700" mb={3}>
                          معاينة الصورة:
                        </Text>
                        <Box
                          maxW="100%"
                          borderRadius="xl"
                          overflow="hidden"
                          boxShadow="lg"
                          border="2px solid"
                          borderColor="purple.200"
                          bg="white"
                          p={2}
                        >
                          <Image
                            src={questionImagePreview}
                            alt="معاينة الصورة"
                            borderRadius="lg"
                            maxW="100%"
                            maxH="300px"
                            objectFit="contain"
                            bg="gray.50"
                          />
                        </Box>
                      </Box>
                    )}

                    {/* رفع الملف */}
                    <FormControl>
                      <FormLabel fontSize={{ base: "sm", sm: "md" }}>
                        اختيار الصورة:
                      </FormLabel>
                      <Box
                        p={6}
                        border="2px dashed"
                        borderColor="purple.300"
                        borderRadius="lg"
                        textAlign="center"
                        _hover={{ borderColor: "purple.400", bg: "purple.50" }}
                        transition="all 0.2s"
                      >
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleQuestionImageSelection}
                          display="none"
                          id="question-image-upload"
                        />
                        <label htmlFor="question-image-upload">
                          <VStack spacing={2} cursor="pointer">
                            <Icon
                              as={AiFillPicture}
                              boxSize={8}
                              color="purple.400"
                            />
                            <Text color="purple.600" fontWeight="medium">
                              اضغط هنا لاختيار الصورة
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              أو اسحب الصورة هنا
                            </Text>
                          </VStack>
                        </label>
                      </Box>
                    </FormControl>
                  </VStack>
                </ModalBody>
                <ModalFooter>
                  <Button
                    colorScheme="purple"
                    mr={3}
                    onClick={uploadQuestionImage}
                    isLoading={uploadingQuestionImage}
                    isDisabled={!selectedQuestionImage}
                    size={{ base: "sm", sm: "md" }}
                    fontSize={{ base: "sm", sm: "md" }}
                    px={{ base: 4, sm: 6 }}
                    py={{ base: 2, sm: 3 }}
                    minW={{ base: "120px", sm: "140px" }}
                    leftIcon={<Icon as={AiFillPicture} boxSize={4} />}
                  >
                    {uploadingQuestionImage ? "جاري الرفع..." : "رفع الصورة"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={closeAddQuestionImageModal}
                    size={{ base: "sm", sm: "md" }}
                    fontSize={{ base: "sm", sm: "md" }}
                    px={{ base: 3, sm: 4 }}
                    py={{ base: 2, sm: 3 }}
                    minW={{ base: "80px", sm: "100px" }}
                  >
                    إلغاء
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

            {/* مودال تكبير صورة السؤال */}
            <Modal
              isOpen={imageZoomOpen}
              onClose={() => { setImageZoomOpen(false); setImageZoomSrc(null); }}
              size="full"
              isCentered
            >
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
                    size="lg"
                    onClick={() => { setImageZoomOpen(false); setImageZoomSrc(null); }}
                  />
                  {imageZoomSrc && (
                    <Image
                      src={imageZoomSrc}
                      alt="تكبير صورة السؤال"
                      maxH="90vh"
                      maxW="100%"
                      objectFit="contain"
                      borderRadius="md"
                      onClick={() => { setImageZoomOpen(false); setImageZoomSrc(null); }}
                      cursor="pointer"
                    />
                  )}
                </ModalBody>
              </ModalContent>
            </Modal>
    </>
  );
};

export default ComprehensiveExam;
