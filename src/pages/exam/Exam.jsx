import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box, VStack, Heading, Text, Spinner, Center, Alert, AlertIcon, IconButton, HStack, useToast,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Button, Input, Tooltip, InputGroup, InputRightElement, Image, useColorModeValue, Flex,
  SimpleGrid, Textarea, Select, Badge,
} from "@chakra-ui/react";
import { AiFillEdit, AiFillDelete, AiOutlineCloseCircle, AiOutlineRobot } from "react-icons/ai";
import baseUrl from "../../api/baseUrl";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import { useParams, useNavigate } from "react-router-dom";
import UserType from "../../Hooks/auth/userType";
import { useTeacherCourseGroups } from "../../Hooks/course/useCourseGroups";
import { fetchExamGrades } from "../../api/courseAssignmentReportsApi";
import { normalizeStudyGroups } from "./utils/examReportUtils";
import { FaBookOpen, FaUser, FaImage, FaChartBar, FaCompass, FaFilePdf } from "react-icons/fa";
import { BiSearch } from "react-icons/bi";
import { FiDownload } from "react-icons/fi";
import { PlatformExamTeacherCard } from "./components/PlatformExamQuestionCard";
import AiQuestionExtractionModal from "./components/AiQuestionExtractionModal";
import { SubmissionCard } from "./components/ExamSubmissionsView";
import { downloadExamGradesExcel, downloadExamGradesPdf, matchesStudentSearch } from "./utils/examSubmissionUtils";
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
  const { data: teacherGroupsRaw = [] } = useTeacherCourseGroups(undefined, {
    enabled: isStaff,
  });
  const studyGroups = useMemo(
    () => normalizeStudyGroups(teacherGroupsRaw),
    [teacherGroupsRaw],
  );
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
  const [gradesStats, setGradesStats] = useState(null);
  const [gradesError, setGradesError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradesCurrentPage, setGradesCurrentPage] = useState(1);
  const [gradesGroupId, setGradesGroupId] = useState("");
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

  const fetchGrades = async (groupFilter = gradesGroupId) => {
    setGradesLoading(true);
    setGradesError(null);
    try {
      const result = await fetchExamGrades(examId, {
        groupId: groupFilter,
        groupType: groupFilter ? "study" : undefined,
      });
      setGradesData(result.students || []);
      setGradesStats(result.statistics || null);
      if (result.exam?.title) {
        setExamMeta((prev) => ({
          ...(prev || {}),
          examTitle: result.exam.title,
          courseTitle: result.exam.courseTitle || prev?.courseTitle,
        }));
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.msg ||
        "فشل جلب درجات الطلاب";
      setGradesError(message);
      setGradesData([]);
      setGradesStats(null);
      toast({ title: message, status: "error" });
    } finally {
      setGradesLoading(false);
    }
  };

  const filteredGrades = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return gradesData.filter((submission) => matchesStudentSearch(submission, term));
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

  const pageBg = useColorModeValue("#F4F7FB", "gray.950");
  const teacherCardBg = useColorModeValue("white", "gray.800");
  const teacherCardBorder = useColorModeValue("gray.200", "gray.700");
  const teacherHeadingColor = useColorModeValue("gray.900", "white");
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const previewBg = useColorModeValue("gray.50", "gray.900");
  const previewBorder = useColorModeValue("gray.200", "gray.700");
  const softBlue = useColorModeValue("blue.50", "whiteAlpha.100");
  const BLUE = "#3182CE";

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

  const examTitle = examMeta?.examTitle || "امتحان شامل";
  const durationLabel =
    examMeta?.durationMinutes != null && Number(examMeta.durationMinutes) > 0
      ? `${examMeta.durationMinutes} دقيقة`
      : "بدون حد زمني";

  return (
    <Box
      minH="100vh"
      bg={pageBg}
      dir="rtl"
      fontFamily="'Cairo', 'Segoe UI', Tahoma, sans-serif"
      pb={{ base: 10, md: 14 }}
    >
      {/* Hero */}
      <Box
        data-tour-id="platform-exam-hero"
        position="relative"
        overflow="hidden"
        bg={`linear-gradient(125deg, #0B1F3A 0%, ${BLUE} 55%, #2B6CB0 100%)`}
        pt={{ base: "4.75rem", md: "5.25rem" }}
        pb={{ base: 6, md: 7 }}
      >
        <Box
          position="absolute"
          inset={0}
          opacity={0.25}
          pointerEvents="none"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "radial-gradient(ellipse 70% 60% at 70% 40%, black, transparent)",
          }}
        />
        <Box maxW="6xl" mx="auto" px={{ base: 4, md: 6 }} position="relative" zIndex={1}>
          <Flex
            direction={{ base: "column", md: "row" }}
            align={{ base: "stretch", md: "flex-start" }}
            justify="space-between"
            gap={4}
          >
            <Box minW={0} flex={1}>
              <HStack spacing={2} mb={2} flexWrap="wrap">
                <Badge
                  bg="whiteAlpha.200"
                  color="white"
                  borderRadius="full"
                  px={2.5}
                  py={0.5}
                  fontSize="11px"
                  fontWeight="800"
                >
                  امتحان شامل
                </Badge>
                <Badge
                  bg="whiteAlpha.150"
                  color="whiteAlpha.900"
                  borderRadius="full"
                  px={2.5}
                  fontSize="11px"
                >
                  {questions.length} سؤال
                </Badge>
              </HStack>
              <Heading
                as="h1"
                fontSize={{ base: "xl", md: "2xl" }}
                fontWeight="800"
                color="white"
                letterSpacing="-0.02em"
                lineHeight="1.3"
                noOfLines={2}
              >
                {examTitle}
              </Heading>
              <Text mt={2} fontSize="sm" color="whiteAlpha.800">
                {durationLabel}
                {examMeta?.courseTitle ? `  ·  ${examMeta.courseTitle}` : ""}
                {"  ·  "}يدعم LaTeX والرموز الكيميائية
              </Text>
            </Box>

            <HStack spacing={2} flexWrap="wrap" justify={{ base: "flex-start", md: "flex-end" }}>
              <Button
                data-tour-id="platform-exam-tour-btn"
                size="sm"
                variant="ghost"
                color="white"
                borderRadius="lg"
                leftIcon={<FaCompass />}
                onClick={() => {
                  setShowGrades(false);
                  setExamTourOpen(true);
                }}
                _hover={{ bg: "whiteAlpha.200" }}
              >
                جولة
              </Button>
              <Button
                data-tour-id="platform-exam-ai"
                size="sm"
                bg="whiteAlpha.200"
                color="white"
                borderRadius="lg"
                leftIcon={<AiOutlineRobot />}
                onClick={() => setAiExtractionModalOpen(true)}
                _hover={{ bg: "whiteAlpha.300" }}
              >
                ذكاء اصطناعي
              </Button>
              <Button
                data-tour-id="platform-exam-grades"
                size="sm"
                bg={showGrades ? "white" : "orange.400"}
                color={showGrades ? "blue.700" : "white"}
                borderRadius="lg"
                leftIcon={<FaUser />}
                onClick={() => {
                  if (!showGrades && gradesData.length === 0) fetchGrades();
                  setShowGrades((prev) => !prev);
                }}
                _hover={{ opacity: 0.92 }}
              >
                {showGrades ? "الأسئلة" : "الدرجات"}
              </Button>
              <Button
                data-tour-id="platform-exam-report"
                size="sm"
                bg="whiteAlpha.200"
                color="white"
                borderRadius="lg"
                leftIcon={<FaChartBar />}
                onClick={() => navigate(`/exam/${examId}/report`)}
                _hover={{ bg: "whiteAlpha.300" }}
              >
                التقرير
              </Button>
            </HStack>
          </Flex>

          {/* mini stats strip */}
          <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={2} mt={5} maxW="lg">
            {[
              { label: "الأسئلة", value: questions.length },
              { label: "المدة", value: examMeta?.durationMinutes || "—" },
              { label: "العرض", value: showGrades ? "درجات" : "أسئلة" },
            ].map((item) => (
              <Box
                key={item.label}
                bg="whiteAlpha.150"
                borderWidth="1px"
                borderColor="whiteAlpha.250"
                borderRadius="xl"
                px={3}
                py={2.5}
              >
                <Text fontSize="10px" color="whiteAlpha.700" fontWeight="600">
                  {item.label}
                </Text>
                <Text fontSize="md" fontWeight="800" color="white" mt={0.5}>
                  {item.value}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      </Box>

      <Box maxW="6xl" mx="auto" px={{ base: 3, sm: 4, md: 6 }} mt={{ base: -3, md: -4 }} position="relative" zIndex={2}>
      {showGrades ? (
        <Box
          w="full"
          bg={teacherCardBg}
          borderWidth="1px"
          borderColor={teacherCardBorder}
          borderRadius="2xl"
          shadow="sm"
          p={{ base: 4, md: 5 }}
        >
          <Flex
            direction={{ base: "column", sm: "row" }}
            align={{ base: "stretch", sm: "center" }}
            justify="space-between"
            gap={3}
            mb={{ base: 4, md: 5 }}
          >
            <Box>
              <Text fontSize="xs" fontWeight="700" color={BLUE} mb={1}>
                نتائج الطلاب
              </Text>
              <Heading size="md" color={teacherHeadingColor}>
                {examMeta?.examTitle || "درجات الطلاب في الامتحان"}
              </Heading>
            </Box>
            <HStack spacing={2} flexWrap="wrap" justify={{ base: "flex-start", sm: "flex-end" }}>
              <Select
                size="sm"
                maxW="200px"
                value={String(gradesGroupId ?? "")}
                onChange={(e) => {
                  const value = e.target.value;
                  setGradesGroupId(value);
                  setGradesCurrentPage(1);
                  fetchGrades(value);
                }}
                isDisabled={gradesLoading}
                borderRadius="lg"
              >
                <option value="">كل المجموعات</option>
                {studyGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </Select>
              {gradesData.length > 0 && (
                <>
                  <Button
                    colorScheme="green"
                    variant="outline"
                    size="sm"
                    leftIcon={<FiDownload />}
                    onClick={handleExportGrades}
                    borderRadius="lg"
                  >
                    Excel
                  </Button>
                  <Button
                    colorScheme="red"
                    variant="outline"
                    size="sm"
                    leftIcon={<FaFilePdf />}
                    onClick={handleExportGradesPdf}
                    isLoading={isExportingGradesPdf}
                    loadingText="..."
                    borderRadius="lg"
                  >
                    PDF
                  </Button>
                </>
              )}
              <Button
                colorScheme="blue"
                size="sm"
                leftIcon={<FaChartBar />}
                onClick={() => navigate(`/exam/${examId}/report`)}
                borderRadius="lg"
              >
                تقرير الأسئلة
              </Button>
            </HStack>
          </Flex>
          <Box w="full" maxW={{ base: "100%", sm: "420px" }} mb={{ base: 4, md: 5 }}>
            <InputGroup size="md">
              <Input
                placeholder="ابحث بالاسم أو الإيميل أو الهاتف أو رقم الطالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                borderRadius="xl"
                bg={softBlue}
                borderColor={teacherCardBorder}
                _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
                fontSize="sm"
              />
              <InputRightElement pointerEvents="none" height="100%">
                <BiSearch color="gray.400" boxSize={5} />
              </InputRightElement>
            </InputGroup>
          </Box>
          {gradesStats ? (
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={{ base: 4, md: 5 }}>
              {[
                { label: "عدد الطلاب", value: gradesStats.totalStudents ?? gradesData.length, color: "blue.600" },
                {
                  label: "متوسط النسبة",
                  value: gradesStats.averageGrade != null ? `${Math.round(Number(gradesStats.averageGrade))}%` : "—",
                  color: "blue.500",
                },
                {
                  label: "أعلى درجة",
                  value: gradesStats.maxGrade ?? "—",
                  suffix: gradesStats.totalGrade != null ? ` / ${gradesStats.totalGrade}` : null,
                  color: "green.600",
                },
                { label: "أقل درجة", value: gradesStats.minGrade ?? "—", color: "orange.500" },
              ].map((stat) => (
                <Box
                  key={stat.label}
                  bg={softBlue}
                  borderWidth="1px"
                  borderColor={teacherCardBorder}
                  borderRadius="xl"
                  p={3.5}
                  textAlign="center"
                >
                  <Text fontSize="xs" color={mutedText} fontWeight="600" mb={1}>
                    {stat.label}
                  </Text>
                  <Text fontSize="xl" fontWeight="800" color={stat.color}>
                    {stat.value}
                    {stat.suffix ? (
                      <Text as="span" fontSize="sm" color={mutedText} fontWeight="600">
                        {stat.suffix}
                      </Text>
                    ) : null}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          ) : null}
          {examMeta?.courseTitle ? (
            <Text fontSize="sm" color={mutedText} textAlign="center" mb={4}>
              الكورس: {examMeta.courseTitle}
            </Text>
          ) : null}
          {gradesLoading ? (
            <Center py={12}>
              <Spinner size="xl" color="blue.500" thickness="4px" />
            </Center>
          ) : gradesError && gradesData.length === 0 ? (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              {gradesError}
            </Alert>
          ) : gradesData.length === 0 ? (
            <Center py={12}>
              <Text fontSize="md" color={mutedText} fontWeight="medium">
                لا توجد درجات بعد
              </Text>
            </Center>
          ) : (
            <VStack spacing={{ base: 3, md: 4 }} align="stretch">
              {filteredGrades.length === 0 ? (
                <Center py={8}>
                  <Text color={mutedText} fontSize="md">لا توجد نتائج مطابقة للبحث</Text>
                </Center>
              ) : (
                <>
                  {filteredGrades.length > GRADES_PAGE_SIZE && (
                    <Text fontSize="sm" color={mutedText} textAlign="center">
                      عرض {gradesPageRangeStart}–{gradesPageRangeEnd} من {filteredGrades.length} طالب
                    </Text>
                  )}
                  {paginatedGrades.map((submission, idx) => (
                    <SubmissionCard
                      key={submission.submission_id ?? submission.attemptId ?? `${gradesCurrentPage}-${idx}`}
                      submission={submission}
                      index={(gradesCurrentPage - 1) * GRADES_PAGE_SIZE + idx}
                      onZoomImage={(src) => {
                        setImageModalSrc(src);
                        setImageModalOpen(true);
                      }}
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
            <Center
              py={16}
              px={4}
              data-tour-id="platform-exam-empty"
              bg={teacherCardBg}
              borderWidth="1px"
              borderColor={teacherCardBorder}
              borderRadius="2xl"
              shadow="sm"
            >
              <VStack spacing={4}>
                <Flex
                  w={16}
                  h={16}
                  borderRadius="2xl"
                  align="center"
                  justify="center"
                  color="white"
                  style={{ background: `linear-gradient(135deg, ${BLUE}, #2B6CB0)` }}
                >
                  <FaBookOpen size={28} />
                </Flex>
                <Text fontSize="lg" fontWeight="700" color={teacherHeadingColor}>
                  لا توجد أسئلة بعد
                </Text>
                <Text fontSize="sm" color={mutedText} textAlign="center" maxW="sm">
                  أضف أسئلة من صفحة تفاصيل الكورس (تبويب الامتحانات) أو استخرجها بالذكاء الاصطناعي
                </Text>
                <Button
                  colorScheme="blue"
                  borderRadius="xl"
                  leftIcon={<AiOutlineRobot />}
                  onClick={() => setAiExtractionModalOpen(true)}
                >
                  استخراج بالذكاء الاصطناعي
                </Button>
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
      </Box>

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
