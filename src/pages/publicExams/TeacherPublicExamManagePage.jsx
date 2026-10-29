import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Select,
  SimpleGrid,
  Skeleton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  Tooltip,
  useDisclosure,
  useToast,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import {
  FaArrowRight,
  FaBook,
  FaChartBar,
  FaEye,
  FaEyeSlash,
  FaEdit,
  FaImage,
  FaPlus,
  FaSync,
  FaTrash,
  FaUserPlus,
} from "react-icons/fa";
import { AiOutlineRobot } from "react-icons/ai";
import { MdLibraryBooks, MdPublic, MdSchool } from "react-icons/md";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  addPublicExamBulkQuestions,
  addPublicExamImageQuestions,
  addPublicExamPassageQuestions,
  addPublicExamQuestionsFromBank,
  addPublicExamQuestionsFromTeacherLibrary,
  addPublicExamTextQuestion,
  deletePublicExamQuestion,
  fetchPublicExam,
  uploadPublicExamQuestionImage,
  fetchPublicExamQuestions,
  publicExamsApiError,
  publishPublicExam,
  unpublishPublicExam,
  updatePublicExamQuestion,
} from "../../api/publicExamsApi";
import {
  fetchTeacherLibraryGrades,
  fetchTeacherLibraryLessons,
} from "../../api/teacherQuestionLibraryApi";
import {
  normalizeCorrectAnswerLetters,
  toggleCorrectAnswerLetter,
} from "../../api/courseExamsApi";
import { PlatformExamTeacherCard } from "../exam/components/PlatformExamQuestionCard";
import AiQuestionExtractionModal from "../exam/components/AiQuestionExtractionModal";
import LateAccessGrantModal from "../exam/components/LateAccessGrantModal";
import FormattedQuestionText from "../../components/question/FormattedQuestionText";
import { filesFromClipboardEvent } from "../../api/ocrQuestionExtractionApi";
import {
  DailyQuizHero,
  DailyQuizPageShell,
  DailyQuizSurface,
  useDailyQuizTheme,
} from "../dailyQuiz/DailyQuizChrome";
import {
  formatAttemptLimitLabel,
  formatCourseExamDurationLabel,
  getCourseExamAvailabilityStatus,
} from "../../utils/courseLevelExamUtils";

const LETTERS = ["A", "B", "C", "D"];

function getChoiceLetter(choice, index = 0) {
  return String(choice?.letter || LETTERS[index] || "A").trim().toUpperCase();
}

function getQuestionCorrectLetters(question) {
  if (!question?.choices?.length) return [];
  const fromFlags = question.choices
    .map((c, i) => (c.is_correct ? getChoiceLetter(c, i) : null))
    .filter(Boolean);
  if (fromFlags.length) return normalizeCorrectAnswerLetters(fromFlags);
  if (Array.isArray(question.correctAnswers)) {
    return normalizeCorrectAnswerLetters(question.correctAnswers);
  }
  if (question.correctAnswer) {
    return normalizeCorrectAnswerLetters([question.correctAnswer]);
  }
  return [];
}

function applyCorrectLetters(question, letters) {
  const set = new Set(normalizeCorrectAnswerLetters(letters));
  return {
    ...question,
    correctAnswers: [...set],
    choices: (question.choices || []).map((c, i) => ({
      ...c,
      is_correct: set.has(getChoiceLetter(c, i)),
    })),
  };
}

export default function TeacherPublicExamManagePage() {
  const { examId } = useParams();
  const token = localStorage.getItem("token");
  const toast = useToast();
  const navigate = useNavigate();
  const theme = useDailyQuizTheme();
  const addModal = useDisclosure();
  const aiModal = useDisclosure();
  const lateAccess = useDisclosure();
  const deleteCancelRef = useRef();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingCorrect, setPendingCorrect] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [imageZoom, setImageZoom] = useState(null);
  const [imageUploadQuestionId, setImageUploadQuestionId] = useState(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [imagePasteQuestion, setImagePasteQuestion] = useState(null);
  const questionImageInputRef = useRef(null);
  const imagePasteZoneRef = useRef(null);
  const [editModal, setEditModal] = useState({ open: false, question: null });
  const [editForm, setEditForm] = useState({ text: "", choices: [], correctLetters: [] });
  const [editSaving, setEditSaving] = useState(false);

  const [bulkText, setBulkText] = useState("");
  const [bulkAnswers, setBulkAnswers] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [singleForm, setSingleForm] = useState({
    text: "",
    choices: ["", "", "", ""],
    correctIndex: 0,
    imageFile: null,
  });
  const [singleLoading, setSingleLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [passageId, setPassageId] = useState("");
  const [passageLoading, setPassageLoading] = useState(false);

  const [bankQuestionIdsText, setBankQuestionIdsText] = useState("");
  const [bankLoading, setBankLoading] = useState(false);
  const [libraryMode, setLibraryMode] = useState("lesson"); // lesson | grade | passage | ids
  const [libraryGrades, setLibraryGrades] = useState([]);
  const [libraryLessons, setLibraryLessons] = useState([]);
  const [libraryGradeId, setLibraryGradeId] = useState("");
  const [libraryLessonId, setLibraryLessonId] = useState("");
  const [libraryPassageId, setLibraryPassageId] = useState("");
  const [libraryQuestionIdsText, setLibraryQuestionIdsText] = useState("");
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryMetaLoading, setLibraryMetaLoading] = useState(false);

  const configured = Number(exam?.questions_count || 0);
  const actual = questions.length;
  const progress = configured > 0 ? Math.min(100, Math.round((actual / configured) * 100)) : 0;

  const loadAll = useCallback(async () => {
    if (!token || !examId) return;
    setLoading(true);
    try {
      const [examData, qs] = await Promise.all([
        fetchPublicExam(examId, token),
        fetchPublicExamQuestions(examId, token),
      ]);
      setExam(examData);
      setQuestions(qs);
    } catch (err) {
      toast({
        title: publicExamsApiError(err, "فشل تحميل الامتحان"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [token, examId, toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!addModal.isOpen || !token) return;
    let cancelled = false;
    (async () => {
      setLibraryMetaLoading(true);
      try {
        const grades = await fetchTeacherLibraryGrades();
        if (!cancelled) setLibraryGrades(Array.isArray(grades) ? grades : []);
      } catch {
        if (!cancelled) setLibraryGrades([]);
      } finally {
        if (!cancelled) setLibraryMetaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [addModal.isOpen, token]);

  useEffect(() => {
    if (!libraryGradeId) {
      setLibraryLessons([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const lessons = await fetchTeacherLibraryLessons(libraryGradeId);
        if (!cancelled) setLibraryLessons(Array.isArray(lessons) ? lessons : []);
      } catch {
        if (!cancelled) setLibraryLessons([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [libraryGradeId]);

  const parseIdList = (text) =>
    String(text || "")
      .split(/[\s,،]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);

  const submitFromBank = async () => {
    const ids = parseIdList(bankQuestionIdsText);
    if (!ids.length) {
      toast({ title: "أدخل معرّفات أسئلة من البنك", status: "warning" });
      return;
    }
    setBankLoading(true);
    try {
      const res = await addPublicExamQuestionsFromBank(examId, ids, token);
      toast({
        title: res?.message || `تمت إضافة ${res?.addedCount ?? ids.length} سؤال من البنك`,
        status: "success",
        isClosable: true,
      });
      setBankQuestionIdsText("");
      addModal.onClose();
      await loadAll();
    } catch (err) {
      toast({
        title: publicExamsApiError(err, "فشل الإضافة من البنك"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setBankLoading(false);
    }
  };

  const submitFromLibrary = async () => {
    let payload = null;
    if (libraryMode === "ids") {
      const ids = parseIdList(libraryQuestionIdsText);
      if (!ids.length) {
        toast({ title: "أدخل معرّفات أسئلة من المكتبة", status: "warning" });
        return;
      }
      payload = { questionIds: ids };
    } else if (libraryMode === "grade") {
      if (!libraryGradeId) {
        toast({ title: "اختر صفًا من المكتبة", status: "warning" });
        return;
      }
      payload = { gradeId: Number(libraryGradeId) };
    } else if (libraryMode === "passage") {
      const pid = Number(libraryPassageId);
      if (!Number.isInteger(pid) || pid <= 0) {
        toast({ title: "أدخل رقم قطعة قراءة صالح", status: "warning" });
        return;
      }
      payload = { passageId: pid };
    } else {
      if (!libraryLessonId) {
        toast({ title: "اختر درسًا من المكتبة", status: "warning" });
        return;
      }
      payload = { lessonId: Number(libraryLessonId) };
    }

    setLibraryLoading(true);
    try {
      const res = await addPublicExamQuestionsFromTeacherLibrary(examId, payload, token);
      toast({
        title: res?.message || `تمت إضافة ${res?.addedCount ?? ""} سؤال من المكتبة`,
        status: "success",
        isClosable: true,
      });
      addModal.onClose();
      await loadAll();
    } catch (err) {
      toast({
        title: publicExamsApiError(err, "فشل الإضافة من المكتبة"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setLibraryLoading(false);
    }
  };

  const availability = useMemo(
    () => (exam ? getCourseExamAvailabilityStatus(exam) : null),
    [exam],
  );

  const togglePublish = async () => {
    if (!exam) return;
    setActionLoading(true);
    try {
      const next = exam.is_visible_to_students
        ? await unpublishPublicExam(exam.id, token)
        : await publishPublicExam(exam.id, token);
      setExam((prev) => ({ ...prev, ...next }));
      toast({
        title: next.is_visible_to_students ? "تم نشر الامتحان" : "تم إلغاء النشر",
        status: "success",
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: publicExamsApiError(err, "فشل تغيير النشر"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleCorrect = async (qid, cid) => {
    const question = questions.find((q) => q.id === qid);
    if (!question) return;
    const choiceIndex = (question.choices || []).findIndex((c) => c.id === cid);
    if (choiceIndex < 0) return;
    const letter = getChoiceLetter(question.choices[choiceIndex], choiceIndex);
    const current = getQuestionCorrectLetters(question);
    const next = toggleCorrectAnswerLetter(current, letter, 2);
    if (next.length === 0) {
      toast({ title: "يجب اختيار إجابة صحيحة واحدة على الأقل", status: "warning" });
      return;
    }
    setQuestions((prev) =>
      prev.map((q) => (q.id === qid ? applyCorrectLetters(q, next) : q)),
    );
    setPendingCorrect((prev) => ({ ...prev, [qid]: true }));
    try {
      const result = await updatePublicExamQuestion(examId, qid, { correctAnswers: next }, token);
      const saved = normalizeCorrectAnswerLetters(result.correctAnswers || next);
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === qid
            ? applyCorrectLetters(result.question ? { ...q, ...result.question } : q, saved)
            : q,
        ),
      );
      const regrade = result.regrade;
      toast({
        title: result.message || "تم تحديث الإجابة الصحيحة",
        description: regrade
          ? `تمت مراجعة ${regrade.answersReviewed ?? 0} إجابة · تحديث ${regrade.attemptsUpdated ?? 0} محاولة`
          : undefined,
        status: "success",
        isClosable: true,
      });
    } catch (err) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === qid ? applyCorrectLetters(q, getQuestionCorrectLetters(question)) : q,
        ),
      );
      toast({
        title: publicExamsApiError(err, "فشل تحديث الإجابة"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setPendingCorrect((prev) => {
        const copy = { ...prev };
        delete copy[qid];
        return copy;
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePublicExamQuestion(deleteTarget, token);
      setQuestions((prev) => prev.filter((q) => q.id !== deleteTarget));
      setDeleteTarget(null);
      toast({ title: "تم حذف السؤال", status: "success", isClosable: true });
    } catch (err) {
      toast({
        title: publicExamsApiError(err, "فشل حذف السؤال"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setDeleting(false);
    }
  };

  const triggerQuestionImageInput = (question) => {
    setImagePasteQuestion(question);
  };

  const imageUploadLock = useRef(false);

  const uploadQuestionImageFile = async (questionId, file) => {
    if (!file || !questionId || imageUploadLock.current) return;
    imageUploadLock.current = true;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(file.type)) {
      imageUploadLock.current = false;
      toast({
        title: "صيغة غير مدعومة",
        description: "المدعوم: jpeg, jpg, png, gif, webp",
        status: "warning",
        isClosable: true,
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      imageUploadLock.current = false;
      toast({
        title: "الملف كبير",
        description: "الحد الأقصى 10 ميجابايت",
        status: "warning",
        isClosable: true,
      });
      return;
    }

    setImageUploadQuestionId(questionId);
    setImageUploadLoading(true);
    try {
      const result = await uploadPublicExamQuestionImage(examId, questionId, file, token);
      if (result.image) {
        setQuestions((prev) =>
          prev.map((question) =>
            question.id === questionId
              ? {
                  ...question,
                  image: result.image,
                  questionImage: result.image,
                  question_image: result.image,
                }
              : question,
          ),
        );
      } else {
        const qs = await fetchPublicExamQuestions(examId, token);
        setQuestions(qs);
      }
      setImagePasteQuestion(null);
      toast({
        title: result.message || "تمت إضافة صورة السؤال بنجاح",
        status: "success",
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: publicExamsApiError(err, "فشل رفع الصورة"),
        status: "error",
        isClosable: true,
      });
    } finally {
      imageUploadLock.current = false;
      setImageUploadLoading(false);
      setImageUploadQuestionId(null);
    }
  };

  const handleQuestionImageUpload = async (event) => {
    const file = event.target?.files?.[0];
    const questionId = imagePasteQuestion?.id;
    event.target.value = "";
    if (!file || !questionId) return;
    await uploadQuestionImageFile(questionId, file);
  };

  const pastedImageFile = (event) => {
    const [fromItems] = filesFromClipboardEvent(event);
    if (fromItems) return fromItems;
    const file = event.clipboardData?.files?.[0];
    if (file && String(file.type || "").startsWith("image/")) return file;
    return null;
  };

  const handlePasteQuestionImage = async (event) => {
    const file = pastedImageFile(event);
    const questionId = imagePasteQuestion?.id;
    if (!file || !questionId || imageUploadLoading) return;
    event.preventDefault();
    await uploadQuestionImageFile(questionId, file);
  };

  useEffect(() => {
    if (!imagePasteQuestion) return undefined;
    const timer = window.setTimeout(() => imagePasteZoneRef.current?.focus(), 50);
    const onPaste = (event) => {
      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const file = pastedImageFile(event);
      if (!file) return;
      event.preventDefault();
      uploadQuestionImageFile(imagePasteQuestion.id, file);
    };
    window.addEventListener("paste", onPaste);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("paste", onPaste);
    };
  }, [imagePasteQuestion]);

  useEffect(() => {
    if (!editModal.open) return undefined;
    const onPaste = (event) => {
      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const file = pastedImageFile(event);
      if (!file) return;
      event.preventDefault();
      setEditForm((prev) => ({ ...prev, imageFile: file, removeImage: false }));
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [editModal.open]);

  const openEditModal = (question) => {
    const correctLetters = getQuestionCorrectLetters(question);
    setEditForm({
      text: question.text || "",
      choices: (question.choices || []).map((choice, index) => ({
        ...choice,
        text: choice.text || choice.image || "",
        letter: getChoiceLetter(choice, index),
        is_correct: correctLetters.includes(getChoiceLetter(choice, index)),
      })),
      correctLetters,
      imageFile: null,
      removeImage: false,
    });
    setEditModal({ open: true, question });
  };

  const handleEditSave = async () => {
    const { question } = editModal;
    if (!question) return;
    const correctLetters = normalizeCorrectAnswerLetters(editForm.correctLetters || []);
    if (editForm.choices.length > 0 && (correctLetters.length < 1 || correctLetters.length > 2)) {
      toast({
        title: "حدد الإجابة الصحيحة",
        description: "اختر إجابة واحدة أو إجابتين من A–D قبل الحفظ",
        status: "warning",
        isClosable: true,
      });
      return;
    }

    const payload = {};
    if ((editForm.text || "") !== (question.text || "")) {
      payload.questionText = editForm.text;
    }
    editForm.choices.forEach((choice, index) => {
      const letter = getChoiceLetter(choice, index);
      const original = (question.choices || []).find(
        (item, itemIndex) => getChoiceLetter(item, itemIndex) === letter,
      );
      const originalText = original?.text || original?.image || "";
      if ((choice.text ?? "") !== originalText) {
        payload[`option${letter}`] = choice.text ?? "";
      }
    });
    const originalLetters = getQuestionCorrectLetters(question).join(",");
    if (editForm.choices.length > 0 && correctLetters.join(",") !== originalLetters) {
      payload.correctAnswers = correctLetters;
    }
    if (editForm.removeImage && question.image) {
      payload.questionImage = null;
    }
    if (editForm.imageFile) {
      const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!allowed.includes(editForm.imageFile.type)) {
        toast({
          title: "صيغة غير مدعومة",
          description: "المدعوم: jpeg, jpg, png, gif, webp",
          status: "warning",
          isClosable: true,
        });
        return;
      }
      if (editForm.imageFile.size > 10 * 1024 * 1024) {
        toast({
          title: "الملف كبير",
          description: "الحد الأقصى 10 ميجابايت",
          status: "warning",
          isClosable: true,
        });
        return;
      }
    }
    if (!Object.keys(payload).length && !editForm.imageFile) {
      toast({ title: "لا يوجد تغيير للحفظ", status: "info", isClosable: true });
      return;
    }

    setEditSaving(true);
    try {
      let result = null;
      if (Object.keys(payload).length) {
        result = await updatePublicExamQuestion(examId, question.id, payload, token);
      }
      if (editForm.imageFile) {
        result = await uploadPublicExamQuestionImage(
          examId,
          question.id,
          editForm.imageFile,
          token,
        );
      }
      const savedLetters = normalizeCorrectAnswerLetters(
        result?.correctAnswers || correctLetters,
      );
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === question.id
            ? applyCorrectLetters(
                {
                  ...(result?.question ? { ...item, ...result.question } : item),
                  text: editForm.text,
                  image: editForm.removeImage && !editForm.imageFile
                    ? null
                    : result?.image || item.image,
                  choices: editForm.choices.map((choice) => ({ ...choice })),
                },
                savedLetters,
              )
            : item,
        ),
      );
      setEditModal({ open: false, question: null });
      const regrade = result?.regrade;
      toast({
        title: result?.message || "تم تعديل السؤال",
        description: regrade
          ? `تمت مراجعة ${regrade.answersReviewed ?? 0} إجابة · تحديث ${regrade.attemptsUpdated ?? 0} محاولة`
          : undefined,
        status: "success",
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: publicExamsApiError(err, "فشل تعديل السؤال"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setEditSaving(false);
    }
  };

  const submitBulk = async () => {
    const text = bulkText.trim();
    if (!text) {
      toast({ title: "أدخل نص الأسئلة", status: "warning" });
      return;
    }
    const correctAnswers = bulkAnswers
      .split(/[\s,،]+/)
      .map((a) => a.trim().toUpperCase())
      .filter((a) => LETTERS.includes(a));
    setBulkLoading(true);
    try {
      const res = await addPublicExamBulkQuestions(
        examId,
        { text, correctAnswers: correctAnswers.length ? correctAnswers : undefined },
        token,
      );
      toast({
        title: res?.message || `تمت إضافة ${res?.count ?? ""} سؤال`,
        status: "success",
      });
      setBulkText("");
      setBulkAnswers("");
      addModal.onClose();
      loadAll();
    } catch (err) {
      toast({
        title: publicExamsApiError(err, "فشل إضافة الأسئلة"),
        status: "error",
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const submitSingle = async () => {
    if (!singleForm.text.trim()) {
      toast({ title: "أدخل نص السؤال", status: "warning" });
      return;
    }
    const choices = singleForm.choices.map((c) => c.trim());
    if (choices.some((c) => !c)) {
      toast({ title: "أكمل الاختيارات الأربعة", status: "warning" });
      return;
    }
    setSingleLoading(true);
    try {
      const fd = new FormData();
      fd.append("type", "TEXT");
      fd.append("questionText", singleForm.text.trim());
      fd.append("optionA", choices[0]);
      fd.append("optionB", choices[1]);
      fd.append("optionC", choices[2]);
      fd.append("optionD", choices[3]);
      fd.append("correctAnswer", LETTERS[singleForm.correctIndex]);
      if (singleForm.imageFile) fd.append("questionImage", singleForm.imageFile);
      await addPublicExamTextQuestion(examId, fd, token);
      toast({ title: "تم إضافة السؤال", status: "success" });
      setSingleForm({ text: "", choices: ["", "", "", ""], correctIndex: 0, imageFile: null });
      addModal.onClose();
      loadAll();
    } catch (err) {
      toast({
        title: publicExamsApiError(err, "فشل إضافة السؤال"),
        status: "error",
      });
    } finally {
      setSingleLoading(false);
    }
  };

  const submitImages = async () => {
    if (!imageFiles.length) {
      toast({ title: "اختر صور الأسئلة", status: "warning" });
      return;
    }
    setImagesLoading(true);
    try {
      const fd = new FormData();
      imageFiles.forEach((file) => fd.append("images[]", file));
      const res = await addPublicExamImageQuestions(examId, fd, token);
      toast({
        title: `تم إضافة ${res?.count || imageFiles.length} سؤال مصور`,
        status: "success",
      });
      setImageFiles([]);
      addModal.onClose();
      loadAll();
    } catch (err) {
      toast({
        title: publicExamsApiError(err, "فشل رفع الصور"),
        status: "error",
      });
    } finally {
      setImagesLoading(false);
    }
  };

  const submitPassage = async () => {
    const id = Number(passageId);
    if (!id) {
      toast({ title: "أدخل رقم القطعة", status: "warning" });
      return;
    }
    setPassageLoading(true);
    try {
      const res = await addPublicExamPassageQuestions(examId, id, token);
      toast({
        title: res?.message || `تمت إضافة ${res?.added ?? ""} سؤال`,
        status: "success",
      });
      setPassageId("");
      addModal.onClose();
      loadAll();
    } catch (err) {
      toast({
        title: publicExamsApiError(err, "فشل إضافة أسئلة القطعة"),
        status: "error",
      });
    } finally {
      setPassageLoading(false);
    }
  };

  if (!token) {
    return (
      <DailyQuizPageShell>
        <Text textAlign="center" py={16}>
          يجب تسجيل الدخول أولاً
        </Text>
      </DailyQuizPageShell>
    );
  }

  return (
    <DailyQuizPageShell maxW="5xl">
      <Button
        variant="ghost"
        leftIcon={<FaArrowRight />}
        mb={3}
        borderRadius="xl"
        onClick={() => navigate("/teacher-public-exams")}
      >
        العودة للامتحانات العامة
      </Button>

      {loading ? (
        <VStack align="stretch" spacing={4}>
          <Skeleton h="140px" borderRadius="3xl" />
          <Skeleton h="80px" borderRadius="2xl" />
          <Skeleton h="200px" borderRadius="2xl" />
        </VStack>
      ) : !exam ? (
        <Alert status="error" borderRadius="2xl">
          <AlertIcon />
          الامتحان غير موجود أو ليس امتحانًا عامًا
        </Alert>
      ) : (
        <>
          <DailyQuizHero
            icon={MdPublic}
            eyebrow="Public Exam"
            title={exam.title}
            subtitle={
              exam.description ||
              "إدارة أسئلة الامتحان العام — إضافة، تصحيح، ونشر لطلاب الصف."
            }
            badges={
              <>
                <Badge bg="whiteAlpha.300" color="white" borderRadius="full" px={3}>
                  <HStack spacing={1}>
                    <Icon as={MdSchool} boxSize={3} />
                    <Text>{exam.gradeName || exam.grade_name || `صف ${exam.gradeId}`}</Text>
                  </HStack>
                </Badge>
                <Badge
                  bg={exam.is_visible_to_students ? "green.400" : "whiteAlpha.300"}
                  color="white"
                  borderRadius="full"
                  px={3}
                >
                  {exam.is_visible_to_students ? "منشور" : "مسودة"}
                </Badge>
                {availability ? (
                  <Badge bg="whiteAlpha.300" color="white" borderRadius="full" px={3}>
                    {availability.label}
                  </Badge>
                ) : null}
              </>
            }
            actions={
              <HStack spacing={2} flexWrap="wrap">
                <Button
                  leftIcon={<FaSync />}
                  variant="outline"
                  borderColor="whiteAlpha.400"
                  color="white"
                  borderRadius="xl"
                  _hover={{ bg: "whiteAlpha.200" }}
                  onClick={loadAll}
                  isLoading={loading}
                >
                  تحديث
                </Button>
                <Button
                  leftIcon={exam.is_visible_to_students ? <FaEyeSlash /> : <FaEye />}
                  colorScheme={exam.is_visible_to_students ? "orange" : "green"}
                  borderRadius="xl"
                  isLoading={actionLoading}
                  onClick={togglePublish}
                >
                  {exam.is_visible_to_students ? "إلغاء النشر" : "نشر للطلاب"}
                </Button>
                <Button
                  leftIcon={<FaUserPlus />}
                  colorScheme="orange"
                  borderRadius="xl"
                  onClick={lateAccess.onOpen}
                >
                  محاولة إضافية
                </Button>
                <Button
                  as={RouterLink}
                  to={`/public-exams/${exam.id}/report`}
                  leftIcon={<FaChartBar />}
                  variant="solid"
                  bg="whiteAlpha.250"
                  color="white"
                  borderRadius="xl"
                  _hover={{ bg: "whiteAlpha.350" }}
                >
                  التقرير
                </Button>
              </HStack>
            }
          />

          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={5}>
            <MetaCard
              label="المدة"
              value={formatCourseExamDurationLabel(exam)}
            />
            <MetaCard
              label="المحاولات"
              value={formatAttemptLimitLabel(exam, { isTeacher: true })}
            />
            <MetaCard label="الأسئلة المطلوبة" value={configured || "—"} />
            <MetaCard label="التسليمات" value={exam.submissionsCount || 0} />
          </SimpleGrid>

          <DailyQuizSurface p={4} mb={5}>
            <Flex justify="space-between" align="center" mb={2} gap={3} wrap="wrap">
              <Text fontWeight="800" color={theme.heading}>
                جاهزية الأسئلة
              </Text>
              <Text fontSize="sm" color={theme.muted}>
                {actual} / {configured || "?"} سؤال
              </Text>
            </Flex>
            <Progress
              value={progress}
              colorScheme={progress >= 100 ? "green" : "orange"}
              borderRadius="full"
              h="10px"
              mb={3}
            />
            <Flex gap={2} wrap="wrap">
              <Button
                leftIcon={<FaPlus />}
                colorScheme="blue"
                borderRadius="xl"
                onClick={addModal.onOpen}
              >
                إضافة أسئلة
              </Button>
              <Button
                leftIcon={<FaBook />}
                as={RouterLink}
                to="/Teacher_subjects"
                variant="outline"
                borderRadius="xl"
              >
                من البنك
              </Button>
              <Button
                leftIcon={<MdLibraryBooks />}
                as={RouterLink}
                to="/QuestionLibraryPage"
                variant="outline"
                borderRadius="xl"
              >
                من المكتبة
              </Button>
              <Button
                leftIcon={<AiOutlineRobot />}
                colorScheme="purple"
                variant="outline"
                borderRadius="xl"
                onClick={aiModal.onOpen}
              >
                استخراج بالذكاء الاصطناعي
              </Button>
              {progress < 100 && configured > 0 ? (
                <Text fontSize="sm" color="orange.500" alignSelf="center">
                  أضف {Math.max(0, configured - actual)} سؤالًا على الأقل قبل النشر الكامل
                </Text>
              ) : null}
            </Flex>
          </DailyQuizSurface>

          {questions.length === 0 ? (
            <DailyQuizSurface p={10} textAlign="center">
              <Icon as={FaImage} boxSize={10} color="gray.300" mb={3} />
              <Text fontWeight="800" mb={1} color={theme.heading}>
                لا توجد أسئلة بعد
              </Text>
              <Text fontSize="sm" color={theme.muted} mb={4}>
                أضف من البنك أو مكتبة المدرس، أو يدويًا، أو استخرج بالذكاء الاصطناعي.
              </Text>
              <HStack justify="center" spacing={2} flexWrap="wrap">
                <Button leftIcon={<FaPlus />} colorScheme="blue" borderRadius="xl" onClick={addModal.onOpen}>
                  إضافة أسئلة
                </Button>
                <Button
                  leftIcon={<FaBook />}
                  as={RouterLink}
                  to="/Teacher_subjects"
                  variant="outline"
                  borderRadius="xl"
                >
                  بنك الأسئلة
                </Button>
                <Button
                  leftIcon={<MdLibraryBooks />}
                  as={RouterLink}
                  to="/QuestionLibraryPage"
                  variant="outline"
                  borderRadius="xl"
                >
                  مكتبة المدرس
                </Button>
                <Button
                  leftIcon={<AiOutlineRobot />}
                  colorScheme="purple"
                  borderRadius="xl"
                  onClick={aiModal.onOpen}
                >
                  استخراج بالـ AI
                </Button>
              </HStack>
            </DailyQuizSurface>
          ) : (
            <VStack align="stretch" spacing={4}>
              {questions.map((q, index) => (
                <PlatformExamTeacherCard
                  key={q.id}
                  question={q}
                  index={index}
                  pendingCorrect={pendingCorrect}
                  onSetCorrect={handleToggleCorrect}
                  onZoomImage={setImageZoom}
                  actions={
                    <HStack spacing={0}>
                      <Tooltip label="إضافة أو لصق صورة السؤال" placement="top" hasArrow>
                        <IconButton
                          aria-label="صورة السؤال"
                          icon={<FaImage />}
                          size="sm"
                          colorScheme="blue"
                          variant="ghost"
                          borderRadius="lg"
                          onClick={() => triggerQuestionImageInput(q)}
                          isLoading={imageUploadLoading && imageUploadQuestionId === q.id}
                        />
                      </Tooltip>
                      <Tooltip label="تعديل السؤال" placement="top" hasArrow>
                        <IconButton
                          aria-label="تعديل السؤال"
                          icon={<FaEdit />}
                          size="sm"
                          colorScheme="yellow"
                          variant="ghost"
                          borderRadius="lg"
                          onClick={() => openEditModal(q)}
                        />
                      </Tooltip>
                      <IconButton
                        aria-label="حذف السؤال"
                        icon={<FaTrash />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        borderRadius="lg"
                        onClick={() => setDeleteTarget(q.id)}
                      />
                    </HStack>
                  }
                />
              ))}
            </VStack>
          )}
        </>
      )}

      <Modal isOpen={addModal.isOpen} onClose={addModal.onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent borderRadius="2xl" mx={3} dir="rtl">
          <ModalHeader>إضافة أسئلة للامتحان العام</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Tabs colorScheme="blue" isFitted>
              <TabList overflowX="auto">
                <Tab fontSize="sm" whiteSpace="nowrap">من البنك</Tab>
                <Tab fontSize="sm" whiteSpace="nowrap">من المكتبة</Tab>
                <Tab fontSize="sm" whiteSpace="nowrap">نص مجمع</Tab>
                <Tab fontSize="sm" whiteSpace="nowrap">سؤال واحد</Tab>
                <Tab fontSize="sm" whiteSpace="nowrap">صور</Tab>
                <Tab fontSize="sm" whiteSpace="nowrap">قطعة</Tab>
                <Tab fontSize="sm" whiteSpace="nowrap">AI</Tab>
              </TabList>
              <TabPanels>
                <TabPanel px={0}>
                  <VStack align="stretch" spacing={3}>
                    <Text fontSize="sm" color={theme.muted} lineHeight="1.8">
                      اختر أسئلة من بنك الأسئلة ثم أضفها لهذا الامتحان العام، أو الصق معرّفات الأسئلة مباشرة.
                    </Text>
                    <Button
                      leftIcon={<FaBook />}
                      as={RouterLink}
                      to="/Teacher_subjects"
                      variant="outline"
                      borderRadius="xl"
                    >
                      فتح بنك الأسئلة واختيار الأسئلة
                    </Button>
                    <FormControl>
                      <FormLabel fontSize="sm">معرّفات أسئلة البنك (questionIds)</FormLabel>
                      <Textarea
                        value={bankQuestionIdsText}
                        onChange={(e) => setBankQuestionIdsText(e.target.value)}
                        rows={3}
                        borderRadius="xl"
                        placeholder="101 102 103"
                        dir="ltr"
                      />
                    </FormControl>
                    <Button
                      colorScheme="blue"
                      borderRadius="xl"
                      onClick={submitFromBank}
                      isLoading={bankLoading}
                    >
                      إضافة من البنك
                    </Button>
                  </VStack>
                </TabPanel>
                <TabPanel px={0}>
                  <VStack align="stretch" spacing={3}>
                    <Text fontSize="sm" color={theme.muted} lineHeight="1.8">
                      أضف من مكتبة أسئلة المدرس بدرس كامل، صف، قطعة، أو معرّفات محددة.
                    </Text>
                    <Button
                      leftIcon={<MdLibraryBooks />}
                      as={RouterLink}
                      to="/QuestionLibraryPage"
                      variant="outline"
                      borderRadius="xl"
                      size="sm"
                    >
                      فتح مكتبة الأسئلة
                    </Button>
                    <FormControl>
                      <FormLabel fontSize="sm">طريقة الإضافة</FormLabel>
                      <Select
                        value={libraryMode}
                        onChange={(e) => setLibraryMode(e.target.value)}
                        borderRadius="xl"
                      >
                        <option value="lesson">كل أسئلة درس</option>
                        <option value="grade">كل أسئلة صف</option>
                        <option value="passage">قطعة قراءة</option>
                        <option value="ids">معرّفات أسئلة</option>
                      </Select>
                    </FormControl>
                    {(libraryMode === "lesson" || libraryMode === "grade") && (
                      <FormControl>
                        <FormLabel fontSize="sm">الصف في المكتبة</FormLabel>
                        <Select
                          value={libraryGradeId}
                          onChange={(e) => {
                            setLibraryGradeId(e.target.value);
                            setLibraryLessonId("");
                          }}
                          borderRadius="xl"
                          placeholder={libraryMetaLoading ? "جاري التحميل..." : "اختر الصف"}
                        >
                          {libraryGrades.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.title || g.name || `صف ${g.id}`}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    {libraryMode === "lesson" && (
                      <FormControl>
                        <FormLabel fontSize="sm">الدرس</FormLabel>
                        <Select
                          value={libraryLessonId}
                          onChange={(e) => setLibraryLessonId(e.target.value)}
                          borderRadius="xl"
                          placeholder={!libraryGradeId ? "اختر الصف أولًا" : "اختر الدرس"}
                          isDisabled={!libraryGradeId}
                        >
                          {libraryLessons.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.title || l.name || `درس ${l.id}`}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    {libraryMode === "passage" && (
                      <FormControl>
                        <FormLabel fontSize="sm">رقم قطعة القراءة (passageId)</FormLabel>
                        <Input
                          value={libraryPassageId}
                          onChange={(e) => setLibraryPassageId(e.target.value)}
                          borderRadius="xl"
                          dir="ltr"
                        />
                      </FormControl>
                    )}
                    {libraryMode === "ids" && (
                      <FormControl>
                        <FormLabel fontSize="sm">معرّفات أسئلة المكتبة</FormLabel>
                        <Textarea
                          value={libraryQuestionIdsText}
                          onChange={(e) => setLibraryQuestionIdsText(e.target.value)}
                          rows={3}
                          borderRadius="xl"
                          placeholder="11 12 13"
                          dir="ltr"
                        />
                      </FormControl>
                    )}
                    <Button
                      colorScheme="blue"
                      borderRadius="xl"
                      onClick={submitFromLibrary}
                      isLoading={libraryLoading}
                    >
                      إضافة من المكتبة
                    </Button>
                  </VStack>
                </TabPanel>
                <TabPanel px={0}>
                  <VStack align="stretch" spacing={3}>
                    <Text fontSize="sm" color={theme.muted} lineHeight="1.8">
                      الصيغة: نص السؤال ثم a. b. c. d. — وافصل الأسئلة بسطر فارغ.
                    </Text>
                    <Textarea
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      rows={10}
                      borderRadius="xl"
                      placeholder={"ما هو ...؟\na. خيار\nb. خيار\nc. خيار\nd. خيار"}
                      dir="rtl"
                    />
                    <FormControl>
                      <FormLabel fontSize="sm">إجابات صحيحة بالترتيب (اختياري)</FormLabel>
                      <Input
                        value={bulkAnswers}
                        onChange={(e) => setBulkAnswers(e.target.value)}
                        borderRadius="xl"
                        placeholder="A B C D"
                        dir="ltr"
                      />
                    </FormControl>
                    <Button colorScheme="blue" borderRadius="xl" onClick={submitBulk} isLoading={bulkLoading}>
                      إضافة المجموعة
                    </Button>
                  </VStack>
                </TabPanel>
                <TabPanel px={0}>
                  <VStack align="stretch" spacing={3}>
                    <FormControl isRequired>
                      <FormLabel>نص السؤال</FormLabel>
                      <Textarea
                        value={singleForm.text}
                        onChange={(e) => setSingleForm((f) => ({ ...f, text: e.target.value }))}
                        borderRadius="xl"
                        rows={3}
                      />
                    </FormControl>
                    {LETTERS.map((letter, i) => (
                      <FormControl key={letter}>
                        <FormLabel fontSize="sm">
                          اختيار {letter}
                          <Button
                            size="xs"
                            ml={2}
                            variant={singleForm.correctIndex === i ? "solid" : "outline"}
                            colorScheme="green"
                            onClick={() => setSingleForm((f) => ({ ...f, correctIndex: i }))}
                          >
                            صحيح
                          </Button>
                        </FormLabel>
                        <Input
                          value={singleForm.choices[i]}
                          onChange={(e) =>
                            setSingleForm((f) => {
                              const choices = [...f.choices];
                              choices[i] = e.target.value;
                              return { ...f, choices };
                            })
                          }
                          borderRadius="xl"
                        />
                      </FormControl>
                    ))}
                    <FormControl>
                      <FormLabel fontSize="sm">صورة السؤال (اختياري)</FormLabel>
                      <Box
                        tabIndex={0}
                        borderWidth="1px"
                        borderStyle="dashed"
                        borderColor="blue.200"
                        borderRadius="xl"
                        p={3}
                        mb={2}
                        outline="none"
                        textAlign="center"
                        _focus={{ borderColor: "blue.400" }}
                        onPaste={(event) => {
                          const file = pastedImageFile(event);
                          if (!file) return;
                          event.preventDefault();
                          setSingleForm((current) => ({ ...current, imageFile: file }));
                        }}
                      >
                        <Text fontSize="xs" color={theme.muted}>
                          الصق صورة منسوخة هنا بـ Ctrl+V
                          {singleForm.imageFile ? ` — ${singleForm.imageFile.name}` : ""}
                        </Text>
                      </Box>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setSingleForm((f) => ({
                            ...f,
                            imageFile: e.target.files?.[0] || null,
                          }))
                        }
                      />
                    </FormControl>
                    <Button colorScheme="blue" borderRadius="xl" onClick={submitSingle} isLoading={singleLoading}>
                      إضافة السؤال
                    </Button>
                  </VStack>
                </TabPanel>
                <TabPanel px={0}>
                  <VStack align="stretch" spacing={3}>
                    <Box
                      tabIndex={0}
                      borderWidth="2px"
                      borderStyle="dashed"
                      borderColor="blue.200"
                      borderRadius="xl"
                      p={4}
                      textAlign="center"
                      outline="none"
                      _focus={{ borderColor: "blue.400", bg: "blue.50" }}
                      onPaste={(event) => {
                        const pasted = filesFromClipboardEvent(event);
                        if (!pasted.length) return;
                        event.preventDefault();
                        setImageFiles((prev) => [...prev, ...pasted].slice(0, 10));
                      }}
                    >
                      <Text fontSize="sm" fontWeight="700">الصق الصور هنا</Text>
                      <Text fontSize="xs" color={theme.muted} mt={1}>
                        انسخ الصورة ثم اضغط هنا والصق بـ Ctrl+V — حتى 10 صور
                      </Text>
                    </Box>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setImageFiles(Array.from(e.target.files || []).slice(0, 10))}
                    />
                    {imageFiles.length ? (
                      <Wrap>
                        {imageFiles.map((f) => (
                          <WrapItem key={f.name + f.size}>
                            <Badge borderRadius="md">{f.name}</Badge>
                          </WrapItem>
                        ))}
                      </Wrap>
                    ) : null}
                    <Button colorScheme="blue" borderRadius="xl" onClick={submitImages} isLoading={imagesLoading}>
                      رفع الصور
                    </Button>
                  </VStack>
                </TabPanel>
                <TabPanel px={0}>
                  <VStack align="stretch" spacing={3}>
                    <FormControl>
                      <FormLabel>رقم قطعة القراءة (passageId)</FormLabel>
                      <Input
                        value={passageId}
                        onChange={(e) => setPassageId(e.target.value)}
                        borderRadius="xl"
                        dir="ltr"
                      />
                    </FormControl>
                    <Button colorScheme="blue" borderRadius="xl" onClick={submitPassage} isLoading={passageLoading}>
                      إضافة من القطعة
                    </Button>
                  </VStack>
                </TabPanel>
                <TabPanel px={0}>
                  <VStack align="stretch" spacing={4} py={4}>
                    <Text fontSize="sm" color={theme.muted} lineHeight="1.8" textAlign="center">
                      ارفع صورة أو PDF للأسئلة، راجع المسودة، ثم أضفها للامتحان العام مباشرة.
                    </Text>
                    <Button
                      leftIcon={<AiOutlineRobot />}
                      colorScheme="purple"
                      borderRadius="xl"
                      size="lg"
                      onClick={() => {
                        addModal.onClose();
                        aiModal.onOpen();
                      }}
                    >
                      فتح استخراج الأسئلة بالـ AI
                    </Button>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={Boolean(deleteTarget)}
        leastDestructiveRef={deleteCancelRef}
        onClose={() => !deleting && setDeleteTarget(null)}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="2xl" mx={3} dir="rtl">
            <AlertDialogHeader>حذف السؤال</AlertDialogHeader>
            <AlertDialogBody>هل تريد حذف هذا السؤال من الامتحان؟</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={deleteCancelRef} onClick={() => setDeleteTarget(null)} isDisabled={deleting}>
                إلغاء
              </Button>
              <Button colorScheme="red" mr={3} onClick={confirmDelete} isLoading={deleting}>
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <Modal isOpen={Boolean(imageZoom)} onClose={() => setImageZoom(null)} size="4xl" isCentered>
        <ModalOverlay />
        <ModalContent bg="transparent" boxShadow="none">
          <ModalCloseButton color="white" />
          <ModalBody p={0} display="flex" justifyContent="center">
            {imageZoom ? (
              <Box as="img" src={imageZoom} maxH="85vh" maxW="100%" borderRadius="lg" />
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={Boolean(imagePasteQuestion)}
        onClose={() => !imageUploadLoading && setImagePasteQuestion(null)}
        isCentered
        size="md"
      >
        <ModalOverlay />
        <ModalContent borderRadius="2xl" mx={3} dir="rtl">
          <ModalHeader>إضافة صورة للسؤال</ModalHeader>
          <ModalCloseButton isDisabled={imageUploadLoading} />
          <ModalBody pb={6}>
            <VStack align="stretch" spacing={4}>
              <Box
                ref={imagePasteZoneRef}
                tabIndex={0}
                borderWidth="2px"
                borderStyle="dashed"
                borderColor="blue.300"
                borderRadius="xl"
                p={8}
                textAlign="center"
                outline="none"
                _focus={{ borderColor: "blue.500", bg: "blue.50" }}
                onPaste={handlePasteQuestionImage}
              >
                <Icon as={FaImage} boxSize={8} color="blue.400" mb={3} />
                <Text fontWeight="800">الصق الصورة المنسوخة</Text>
                <Text fontSize="sm" color={theme.muted} mt={2}>
                  انسخ الصورة ثم اضغط Ctrl+V
                </Text>
              </Box>
              <Input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                ref={questionImageInputRef}
                borderRadius="lg"
                p={1}
                isDisabled={imageUploadLoading}
                onChange={handleQuestionImageUpload}
              />
              {imageUploadLoading ? (
                <Text fontSize="sm" color={theme.muted} textAlign="center">
                  جاري رفع الصورة...
                </Text>
              ) : null}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={editModal.open}
        onClose={() => !editSaving && setEditModal({ open: false, question: null })}
        size="xl"
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent borderRadius="2xl" mx={4} dir="rtl">
          <ModalHeader borderBottomWidth="1px" pb={4}>تعديل السؤال</ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <VStack spacing={5} align="stretch">
              <Box>
                <Text mb={2} fontWeight="700" fontSize="sm" color={theme.muted}>نص السؤال</Text>
                <Textarea
                  value={editForm.text}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, text: e.target.value }))}
                  placeholder="نص السؤال — يدعم الرموز الرياضية والكيميائية"
                  borderRadius="lg"
                  minH="100px"
                />
                {editForm.text?.trim() ? (
                  <Box mt={3} p={3} borderRadius="lg" borderWidth="1px">
                    <Text fontSize="xs" color={theme.muted} mb={2}>معاينة</Text>
                    <FormattedQuestionText value={editForm.text} fontSize="md" lineHeight="1.85" />
                  </Box>
                ) : null}
              </Box>
              <Box
                tabIndex={0}
                borderWidth="2px"
                borderStyle="dashed"
                borderColor="blue.200"
                borderRadius="xl"
                p={4}
                outline="none"
                _focus={{ borderColor: "blue.400" }}
                onPaste={(event) => {
                  const file = pastedImageFile(event);
                  if (!file) return;
                  event.preventDefault();
                  setEditForm((prev) => ({ ...prev, imageFile: file, removeImage: false }));
                }}
              >
                <Text mb={2} fontWeight="700" fontSize="sm" color={theme.muted}>صورة السؤال</Text>
                <Text fontSize="xs" color={theme.muted} mb={3}>
                  الصق صورة منسوخة هنا بـ Ctrl+V، أو اختر ملفًا
                </Text>
                {editModal.question?.image && !editForm.removeImage && !editForm.imageFile ? (
                  <Box
                    as="img"
                    src={editModal.question.image}
                    alt="صورة السؤال"
                    maxH="180px"
                    borderRadius="lg"
                    mb={3}
                  />
                ) : null}
                {editForm.imageFile ? (
                  <Text fontSize="sm" mb={2}>{editForm.imageFile.name}</Text>
                ) : null}
                {editForm.removeImage ? (
                  <Text fontSize="sm" color="red.500" mb={2}>سيتم حذف الصورة عند الحفظ</Text>
                ) : null}
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  borderRadius="lg"
                  p={1}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setEditForm((prev) => ({
                      ...prev,
                      imageFile: file,
                      removeImage: false,
                    }));
                  }}
                />
                {editModal.question?.image && !editForm.removeImage ? (
                  <Button
                    mt={3}
                    size="sm"
                    variant="outline"
                    colorScheme="red"
                    borderRadius="lg"
                    onClick={() =>
                      setEditForm((prev) => ({ ...prev, removeImage: true, imageFile: null }))
                    }
                  >
                    حذف الصورة
                  </Button>
                ) : null}
              </Box>
              {editForm.choices.length > 0 ? (
                <Box>
                  <Flex justify="space-between" align="center" mb={2} gap={3}>
                    <Text fontWeight="700" fontSize="sm" color={theme.muted}>الاختيارات</Text>
                    <Badge
                      colorScheme={(editForm.correctLetters || []).length >= 1 ? "green" : "orange"}
                      borderRadius="full"
                    >
                      إجابات صحيحة: {(editForm.correctLetters || []).length}/2
                    </Badge>
                  </Flex>
                  <Text fontSize="xs" color={theme.muted} mb={3}>
                    اختر إجابة واحدة أو إجابتين من A–D
                  </Text>
                  <VStack spacing={3}>
                    {editForm.choices.map((choice, idx) => {
                      const letter = getChoiceLetter(choice, idx);
                      const selected = (editForm.correctLetters || []).includes(letter);
                      return (
                        <Box key={choice.id ?? letter} w="full">
                          <Flex justify="space-between" align="center" mb={1} gap={2}>
                            <Text fontSize="xs" color={theme.muted}>{letter}</Text>
                            <Button
                              size="xs"
                              variant={selected ? "solid" : "outline"}
                              colorScheme={selected ? "green" : "gray"}
                              borderRadius="full"
                              onClick={() =>
                                setEditForm((prev) => {
                                  const next = toggleCorrectAnswerLetter(
                                    prev.correctLetters || [],
                                    letter,
                                    2,
                                  );
                                  return {
                                    ...prev,
                                    correctLetters: next,
                                    choices: prev.choices.map((item, i) => ({
                                      ...item,
                                      is_correct: next.includes(getChoiceLetter(item, i)),
                                    })),
                                  };
                                })
                              }
                            >
                              {selected ? "صحيحة ✓" : "تعيين كصحيحة"}
                            </Button>
                          </Flex>
                          <Textarea
                            value={choice.text}
                            onChange={(e) =>
                              setEditForm((prev) => {
                                const choices = [...prev.choices];
                                choices[idx] = { ...choices[idx], text: e.target.value };
                                return { ...prev, choices };
                              })
                            }
                            placeholder={`اختيار ${letter}`}
                            borderRadius="lg"
                            minH="60px"
                            borderColor={selected ? "green.300" : undefined}
                          />
                          {choice.text?.trim() ? (
                            <Box mt={2} p={2} borderRadius="md" borderWidth="1px">
                              <FormattedQuestionText value={choice.text} fontSize="sm" lineHeight="1.75" />
                            </Box>
                          ) : null}
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>
              ) : null}
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" pt={4} gap={2}>
            <Button colorScheme="blue" onClick={handleEditSave} isLoading={editSaving} borderRadius="lg">
              حفظ التعديل
            </Button>
            <Button
              variant="ghost"
              onClick={() => setEditModal({ open: false, question: null })}
              isDisabled={editSaving}
            >
              إلغاء
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AiQuestionExtractionModal
        isOpen={aiModal.isOpen}
        onClose={aiModal.onClose}
        examId={examId}
        examTitle={exam?.title}
        examKind="course"
        onImported={loadAll}
      />

      <LateAccessGrantModal
        isOpen={lateAccess.isOpen}
        onClose={lateAccess.onClose}
        examId={examId}
        examTitle={exam?.title}
        scope="public"
      />
    </DailyQuizPageShell>
  );
}

function MetaCard({ label, value }) {
  const theme = useDailyQuizTheme();
  return (
    <DailyQuizSurface p={4}>
      <Text fontSize="xs" color={theme.muted} fontWeight="700" mb={1}>
        {label}
      </Text>
      <Text fontWeight="900" color={theme.heading} fontSize="md" noOfLines={2}>
        {value}
      </Text>
    </DailyQuizSurface>
  );
}
