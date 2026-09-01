import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box, VStack, Heading, Text, Spinner, Center, Alert, AlertIcon, IconButton, HStack, useToast,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, Input, Tooltip, InputGroup, InputRightElement, Image, useColorModeValue, Flex,
  SimpleGrid, Textarea,
} from "@chakra-ui/react";
import { AiFillEdit, AiFillDelete, AiOutlineCloseCircle, AiOutlineRobot } from "react-icons/ai";
import baseUrl from "../../api/baseUrl";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import { useParams, useNavigate } from "react-router-dom";
import UserType from "../../Hooks/auth/userType";
import { FaBookOpen, FaUser, FaImage, FaChartBar, FaCompass, FaFilePdf } from "react-icons/fa";
import { BiSearch } from "react-icons/bi";
import { FiDownload } from "react-icons/fi";
import { PlatformExamTeacherCard } from "./components/PlatformExamQuestionCard";
import AiQuestionExtractionModal from "./components/AiQuestionExtractionModal";
import { SubmissionCard } from "./components/ExamSubmissionsView";
import { downloadExamGradesExcel, downloadExamGradesPdf } from "./utils/examSubmissionUtils";
import { PaginationBar } from "../centerMgmt/components/UiBits";
import FormattedQuestionText from "../../components/question/FormattedQuestionText";
import { MdArrowBack } from "react-icons/md";
import { normalizeExamQuestionsFromApi } from "../../utils/examFlowUtils";
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

const Exam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [, isAdmin, isTeacher, student] = UserType();
  const isStaff = Boolean(isTeacher || isAdmin);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModal, setEditModal] = useState({ open: null });
  const [editForm, setEditForm] = useState({ text: "", choices: [] });
  const [deleteModal, setDeleteModal] = useState({ open: false, qid: null });
  const [deleting, setDeleting] = useState(false);
  const [pendingCorrect, setPendingCorrect] = useState({});
  const toast = useToast();
  const [showGrades, setShowGrades] = useState(false);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [gradesData, setGradesData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradesCurrentPage, setGradesCurrentPage] = useState(1);
  const [isExportingGradesPdf, setIsExportingGradesPdf] = useState(false);
  const [examMeta, setExamMeta] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalSrc, setImageModalSrc] = useState(null);
  const [imageUploadQuestionId, setImageUploadQuestionId] = useState(null);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [aiExtractionModalOpen, setAiExtractionModalOpen] = useState(false);
  const [examTourOpen, setExamTourOpen] = useState(false);
  const questionImageInputRef = useRef(null);

  const token = localStorage.getItem("token");
  const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

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

  useEffect(() => {
    if (!isStaff || !examId) return;
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, isStaff]);

  const fetchGrades = async () => {
    setGradesLoading(true);
    try {
      const res = await baseUrl.get(
        `/api/course/course-exam/${examId}/submissions`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
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

  const gradesExportTitle = examMeta?.examTitle || "درجات الطلاب في الامتحان";

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

  const handleDelete = async () => {
    if (!deleteModal.qid) return;
    setDeleting(true);
    try {
      await baseUrl.delete(
        `/api/course/course-exam/question/${deleteModal.qid}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      setQuestions((prev) => prev.filter((q) => q.id !== deleteModal.qid));
      toast({ title: "تم حذف السؤال", status: "success" });
      setDeleteModal({ open: false, qid: null });
    } catch {
      toast({ title: "فشل الحذف", status: "error" });
    } finally {
      setDeleting(false);
    }
  };

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

  const handleEditSave = async () => {
    const { question } = editModal;
    try {
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

  const handleSetCorrect = async (qid, cid) => {
    setPendingCorrect((prev) => ({ ...prev, [qid]: cid }));
    setQuestions((prev) => prev.map((q) =>
      q.id === qid
        ? { ...q, choices: q.choices.map((c) => ({ ...c, is_correct: c.id === cid })) }
        : q
    ));
    try {
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
    const maxSize = 10 * 1024 * 1024;
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

  const teacherCardBg = useColorModeValue("white", "gray.800");
  const teacherCardBorder = useColorModeValue("gray.200", "gray.600");
  const teacherHeadingColor = useColorModeValue("blue.700", "blue.200");
  const teacherAccent = useColorModeValue("blue.500", "blue.400");
  const previewBg = useColorModeValue("gray.50", "gray.900");
  const previewBorder = useColorModeValue("gray.200", "gray.700");

  if (!isStaff) {
    if (!student) {
      return <BrandLoadingScreen />;
    }
    return (
      <Box maxW="lg" mx="auto" py={10} px={4} className="mt-[80px]">
        <VStack spacing={5}>
          <Alert status="info" borderRadius="md" w="full">
            <AlertIcon />
            صفحة الامتحان الشامل متاحة للمدرس فقط.
          </Alert>
          <Button leftIcon={<MdArrowBack />} onClick={() => navigate(-1)}>
            العودة
          </Button>
        </VStack>
      </Box>
    );
  }

  if (loading) {
    return <BrandLoadingScreen />;
  }

  if (error) {
    return (
      <Center minH="60vh">
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      </Center>
    );
  }

  return (
    <Box
      maxW="6xl"
      mx="auto"
      py={{ base: 6, md: 10 }}
      px={{ base: 3, sm: 4, md: 6 }}
      className="mt-[80px]"
    >
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
        </Flex>
      </Box>

      {showGrades ? (
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
                onChange={(e) => setSearchTerm(e.target.value)}
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

      <AiQuestionExtractionModal
        isOpen={aiExtractionModalOpen}
        onClose={() => setAiExtractionModalOpen(false)}
        examId={examId}
        examTitle={examMeta?.examTitle}
        examKind="course"
        onImported={fetchQuestions}
      />

      <TeacherExamTour
        isOpen={examTourOpen}
        hasQuestions={questions.length > 0}
        variant="platform"
        onClose={() => setExamTourOpen(false)}
      />
    </Box>
  );
};

export default Exam;
