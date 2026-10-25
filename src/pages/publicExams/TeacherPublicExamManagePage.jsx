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
  fetchPublicExamQuestions,
  patchPublicExamQuestionCorrectAnswers,
  publicExamsApiError,
  publishPublicExam,
  unpublishPublicExam,
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
      const patchRes = await patchPublicExamQuestionCorrectAnswers(qid, next, token);
      const saved = normalizeCorrectAnswerLetters(patchRes?.correctAnswers || next);
      setQuestions((prev) =>
        prev.map((q) => (q.id === qid ? applyCorrectLetters(q, saved) : q)),
      );
      toast({
        title: patchRes?.message || "تم تحديث الإجابة الصحيحة",
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
                    <IconButton
                      aria-label="حذف السؤال"
                      icon={<FaTrash />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      borderRadius="lg"
                      onClick={() => setDeleteTarget(q.id)}
                    />
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
                    <Text fontSize="sm" color={theme.muted}>
                      ارفع حتى 10 صور — كل صورة سؤال مستقل.
                    </Text>
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
