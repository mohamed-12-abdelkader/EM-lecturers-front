import React, { useState, useEffect } from "react";
import { VStack, Heading, Center, Spinner, Text, Icon, SimpleGrid, Box, HStack, Image, Button, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, NumberInput, NumberInputField, AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, IconButton, Tooltip, Flex, useColorModeValue, Badge, InputGroup, InputRightElement, Switch, Divider, Tabs, TabList, TabPanels, Tab, TabPanel, RadioGroup, Radio, Textarea } from "@chakra-ui/react";
import { FaGraduationCap, FaLightbulb, FaBookOpen, FaClock, FaStar, FaEdit, FaTrash, FaPlus, FaEye, FaEyeSlash, FaRegFileAlt, FaCalendarAlt, FaCog, FaTimes, FaCheck, FaCamera } from "react-icons/fa";
import baseUrl from "../../../api/baseUrl";
import { Link } from "react-router-dom";

const initialExamFormState = {
  title: "",
  questions_count: "",
  duration_minutes: "",
  is_visible_to_students: true,
  visibility_end_date: "",
  show_answers_immediately: true,
  answers_visible_at: "",
  is_active: true,
  attempt_limit: "",
};

const toDateTimeLocalValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const fromDateTimeLocalValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
};

const validateExamFlowSettings = (payload) => {
  if (payload.is_visible_to_students === false && !payload.visibility_end_date) {
    return "يرجى تحديد موعد انتهاء الظهور عند إخفاء الامتحان.";
  }
  if (payload.show_answers_immediately === false && !payload.answers_visible_at) {
    return "يرجى تحديد موعد إظهار الإجابات عند تعطيل الإظهار الفوري.";
  }
  return null;
};

const normalizeExamPayload = (payload) => {
  const normalized = {
    ...payload,
    questions_count:
      payload.questions_count === "" ? undefined : Number(payload.questions_count),
    duration_minutes:
      payload.duration_minutes === "" ? undefined : Number(payload.duration_minutes),
    attempt_limit:
      payload.attempt_limit === "" ? undefined : Number(payload.attempt_limit),
  };

  // إزالة الحقول الفارغة
  Object.keys(normalized).forEach((key) => {
    if (normalized[key] === "" || normalized[key] === null) {
      delete normalized[key];
    }
  });

  return normalized;
};

// API الجديد يستخدم JSON فقط، لا FormData
const buildExamPayload = (payload) => {
  const jsonPayload = {};

  // إضافة courseId أولاً (مطلوب)
  if (payload.courseId !== undefined) jsonPayload.courseId = payload.courseId;
  if (payload.course_id !== undefined) jsonPayload.courseId = payload.course_id;

  // تحويل الحقول إلى camelCase أو snake_case حسب ما يدعمه API
  if (payload.title !== undefined) jsonPayload.title = payload.title;
  if (payload.questions_count !== undefined) jsonPayload.questionsCount = payload.questions_count;
  if (payload.duration_minutes !== undefined) jsonPayload.durationMinutes = payload.duration_minutes;
  if (payload.is_visible_to_students !== undefined) jsonPayload.isVisibleToStudents = payload.is_visible_to_students;
  if (payload.visibility_end_date !== undefined && payload.visibility_end_date !== "") {
    jsonPayload.visibilityEndDate = payload.visibility_end_date;
  }
  if (payload.show_answers_immediately !== undefined) jsonPayload.showAnswersImmediately = payload.show_answers_immediately;
  if (payload.answers_visible_at !== undefined && payload.answers_visible_at !== "") {
    jsonPayload.answersVisibleAt = payload.answers_visible_at;
  }
  if (payload.is_active !== undefined) jsonPayload.isActive = payload.is_active;
  if (payload.attempt_limit !== undefined) jsonPayload.attemptLimit = payload.attempt_limit;

  return jsonPayload;
};

const parseDateSafe = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getExamAvailabilityStatus = (exam) => {
  const now = new Date();

  // إذا كان الامتحان غير ظاهر للطلاب
  if (!exam.is_visible_to_students) {
    return { label: "مخفي", colorScheme: "gray" };
  }

  // إذا كان هناك موعد انتهاء للظهور
  const visibilityEndDate = parseDateSafe(exam.visibility_end_date);
  if (visibilityEndDate && now > visibilityEndDate) {
    return { label: "انتهى", colorScheme: "red" };
  }

  // إذا كان هناك موعد انتهاء ولم يصل بعد
  if (visibilityEndDate && now < visibilityEndDate) {
    return { label: "متاح الآن", colorScheme: "green" };
  }

  // إذا كان ظاهر بدون موعد انتهاء
  return { label: "متاح الآن", colorScheme: "green" };
};

const getExamDurationStatus = (exam) => {
  // API الجديد لا يحتوي على time_limit، فقط duration_minutes
  const durationMinutes = exam.duration_minutes ? Number(exam.duration_minutes) : null;
  if (!durationMinutes) return null;

  // لا يمكننا معرفة متى بدأ الامتحان بدون معلومات إضافية
  // لذلك نرجع فقط معلومات المدة
  return { label: `${durationMinutes} دقيقة`, colorScheme: "blue" };
};

/** قسم داخل مودالات الامتحان — عنوان بأيقونة ملوّنة وجسم نظيف */
const ExamModalSection = ({ icon, title, accent = "blue", children }) => {
  const border = useColorModeValue("gray.200", "gray.600");
  const bg = useColorModeValue("white", "gray.750");
  const titleColor = useColorModeValue("gray.800", "white");

  return (
    <Box borderWidth="1px" borderColor={border} borderRadius="xl" bg={bg} overflow="hidden">
      <HStack
        spacing={2.5}
        px={4}
        py={2.5}
        borderBottomWidth="1px"
        borderColor={border}
        bg={useColorModeValue(`${accent}.50`, "whiteAlpha.50")}
      >
        <Center w={7} h={7} borderRadius="lg" bg={`${accent}.500`} color="white">
          <Icon as={icon} boxSize={3.5} />
        </Center>
        <Text fontWeight="700" fontSize="sm" color={titleColor}>
          {title}
        </Text>
      </HStack>
      <Box px={4} py={4}>
        {children}
      </Box>
    </Box>
  );
};

/** صف Switch بعنوان ووصف — أوضح من FormControl الأفقي */
const ExamSwitchRow = ({ label, hint, isChecked, onChange, colorScheme = "blue" }) => {
  const border = useColorModeValue("gray.200", "gray.600");
  const titleColor = useColorModeValue("gray.800", "white");
  const hintColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Flex
      align="center"
      justify="space-between"
      gap={3}
      borderWidth="1px"
      borderColor={border}
      borderRadius="lg"
      px={3.5}
      py={3}
    >
      <Box minW={0}>
        <Text fontWeight="600" fontSize="sm" color={titleColor}>
          {label}
        </Text>
        {hint ? (
          <Text fontSize="xs" color={hintColor} mt={0.5}>
            {hint}
          </Text>
        ) : null}
      </Box>
      <Switch colorScheme={colorScheme} isChecked={isChecked} onChange={onChange} />
    </Flex>
  );
};

/** كارت امتحان شامل — تصميم جديد نظيف بدون صورة */
const ExamCard = ({
  exam,
  isTeacher,
  formatDate,
  actionLoading,
  onToggleVisibility,
  onAddQuestions,
  onAddImageQuestions,
  onEdit,
  onDelete,
}) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.900", "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const statBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const availability = getExamAvailabilityStatus(exam);
  const visible = !!exam.is_visible_to_students;
  const canAttempt = exam.can_attempt !== false;

  const stats = [
    { label: "سؤال", value: exam.questions_count ?? "—", icon: FaBookOpen, color: "blue.500" },
    { label: "دقيقة", value: exam.duration_minutes ?? "—", icon: FaClock, color: "orange.500" },
    {
      label: "محاولات",
      value: exam.attempt_limit
        ? isTeacher
          ? exam.attempt_limit
          : `${exam.attempts_count || 0}/${exam.attempt_limit}`
        : "∞",
      icon: FaStar,
      color: "purple.500",
    },
  ];

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={border}
      borderRadius="2xl"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      transition="all 0.2s ease"
      _hover={{
        borderColor: "blue.300",
        boxShadow: "0 12px 28px rgba(49,130,206,0.12)",
        transform: "translateY(-2px)",
      }}
    >
      <Box h="4px" bgGradient="linear(to-l, blue.500, orange.400)" />

      {/* الهيدر: أيقونة + عنوان + حالة */}
      <Flex align="flex-start" gap={3} px={4} pt={4}>
        <Center
          w="44px"
          h="44px"
          borderRadius="xl"
          bgGradient="linear(135deg, blue.500, blue.400)"
          color="white"
          flexShrink={0}
          boxShadow="0 6px 14px rgba(49,130,206,0.35)"
        >
          <Icon as={FaGraduationCap} boxSize={5} />
        </Center>
        <Box minW={0} flex={1}>
          <Text fontWeight="800" color={titleColor} fontSize="md" noOfLines={2} lineHeight="1.4">
            {exam.title}
          </Text>
          <HStack spacing={1.5} mt={1.5} flexWrap="wrap">
            <Badge colorScheme={availability.colorScheme} variant="subtle" borderRadius="full" px={2} fontSize="11px">
              {availability.label}
            </Badge>
            {isTeacher && (
              <Badge colorScheme={visible ? "green" : "gray"} variant="subtle" borderRadius="full" px={2} fontSize="11px">
                {visible ? "ظاهر للطلاب" : "مخفي"}
              </Badge>
            )}
            {!exam.is_active && (
              <Badge colorScheme="red" variant="subtle" borderRadius="full" px={2} fontSize="11px">
                غير نشط
              </Badge>
            )}
            {!isTeacher && !canAttempt && (
              <Badge colorScheme="red" variant="subtle" borderRadius="full" px={2} fontSize="11px">
                استنفدت المحاولات
              </Badge>
            )}
          </HStack>
        </Box>
      </Flex>

      {/* الإحصائيات */}
      <SimpleGrid columns={3} spacing={2} px={4} mt={4}>
        {stats.map((stat) => (
          <VStack
            key={stat.label}
            spacing={0.5}
            bg={statBg}
            borderRadius="xl"
            py={2.5}
            borderWidth="1px"
            borderColor={border}
          >
            <Icon as={stat.icon} boxSize={3.5} color={stat.color} />
            <Text fontWeight="800" fontSize="sm" color={titleColor} dir="ltr">
              {stat.value}
            </Text>
            <Text fontSize="10px" color={muted}>
              {stat.label}
            </Text>
          </VStack>
        ))}
      </SimpleGrid>

      {/* الأزرار */}
      <Box px={4} pt={4} pb={3} mt="auto">
        <Link to={`/exam/${exam.id}`} style={{ display: "block", textDecoration: "none" }}>
          <Button
            w="full"
            colorScheme={!isTeacher && !canAttempt ? "gray" : "blue"}
            borderRadius="xl"
            fontWeight="700"
            size="md"
            leftIcon={<Icon as={FaGraduationCap} />}
            cursor="pointer"
          >
            {isTeacher
              ? "عرض الامتحان"
              : !canAttempt
                ? "عرض الامتحان"
                : exam.attempts_count > 0
                  ? `محاولة جديدة (${exam.attempts_count + 1})`
                  : "ابدأ الامتحان"}
          </Button>
        </Link>

        {isTeacher && (
          <HStack spacing={1.5} mt={2}>
            <Tooltip label="إضافة أسئلة" hasArrow>
              <IconButton
                aria-label="إضافة أسئلة"
                icon={<Icon as={FaPlus} />}
                size="sm"
                variant="outline"
                colorScheme="green"
                borderRadius="lg"
                flex={1}
                cursor="pointer"
                onClick={onAddQuestions}
              />
            </Tooltip>
            <Tooltip label="أسئلة كصور" hasArrow>
              <IconButton
                aria-label="أسئلة كصور"
                icon={<Icon as={FaCamera} />}
                size="sm"
                variant="outline"
                colorScheme="purple"
                borderRadius="lg"
                flex={1}
                cursor="pointer"
                onClick={onAddImageQuestions}
              />
            </Tooltip>
            <Tooltip label={visible ? "إخفاء عن الطلاب" : "إظهار للطلاب"} hasArrow>
              <IconButton
                aria-label="تبديل الظهور"
                icon={<Icon as={visible ? FaEye : FaEyeSlash} />}
                size="sm"
                variant="outline"
                colorScheme={visible ? "blue" : "gray"}
                borderRadius="lg"
                flex={1}
                isLoading={actionLoading}
                cursor="pointer"
                onClick={onToggleVisibility}
              />
            </Tooltip>
            <Tooltip label="تعديل" hasArrow>
              <IconButton
                aria-label="تعديل الامتحان"
                icon={<Icon as={FaEdit} />}
                size="sm"
                variant="outline"
                colorScheme="orange"
                borderRadius="lg"
                flex={1}
                cursor="pointer"
                onClick={onEdit}
              />
            </Tooltip>
            <Tooltip label="حذف" hasArrow>
              <IconButton
                aria-label="حذف الامتحان"
                icon={<Icon as={FaTrash} />}
                size="sm"
                variant="outline"
                colorScheme="red"
                borderRadius="lg"
                flex={1}
                cursor="pointer"
                onClick={onDelete}
              />
            </Tooltip>
          </HStack>
        )}

        <Text fontSize="11px" color={muted} mt={2.5} textAlign="center">
          أُنشئ في {formatDate(exam.created_at)}
        </Text>
      </Box>
    </Box>
  );
};


const CourseExamsTab = ({
  courseExams,
  courseExamsLoading,
  courseExamsError,
  headingColor,
  sectionBg,
  dividerColor,
  formatDate,
  isTeacher,
  token,
  refreshExams, // دالة لإعادة تحميل الامتحانات بعد التعديل/الحذف
  courseId
}) => {
  const toast = useToast();
  const [editModal, setEditModal] = useState({ isOpen: false, exam: null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, exam: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form, setForm] = useState(initialExamFormState);
  const modalSectionBg = useColorModeValue("gray.50", "gray.700");
  const modalSectionBorder = useColorModeValue("gray.200", "gray.600");
  const [questionManagerModal, setQuestionManagerModal] = useState({ isOpen: false, exam: null, tabIndex: 0 });
  const [singleImageQuestion, setSingleImageQuestion] = useState({
    text: "",
    choices: ["", "", "", ""],
    correctIndex: 0, // 0 = A, 1 = B, 2 = C, 3 = D
    imageFile: null,
    imagePreview: "",
  });
  const [singleImageLoading, setSingleImageLoading] = useState(false);
  const [imageQuestionItems, setImageQuestionItems] = useState([]);
  const [imageQuestionsLoading, setImageQuestionsLoading] = useState(false);
  const [bulkTextInput, setBulkTextInput] = useState("");
  const [bulkCorrectAnswers, setBulkCorrectAnswers] = useState("");
  const [bulkTextLoading, setBulkTextLoading] = useState(false);
  const [passageIdInput, setPassageIdInput] = useState("");
  const [passageLoading, setPassageLoading] = useState(false);
  const clearImageQuestionPreviews = (items) => {
    if (typeof URL === "undefined") return;
    items.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
  };

  useEffect(() => {
    return () => {
      clearImageQuestionPreviews(imageQuestionItems);
      if (
        typeof URL !== "undefined" &&
        singleImageQuestion.imagePreview
      ) {
        URL.revokeObjectURL(singleImageQuestion.imagePreview);
      }
    };
  }, [imageQuestionItems, singleImageQuestion.imagePreview]);



  // تعديل الامتحان
  const handleEditExam = async (examId, payload) => {
    try {
      setActionLoading(true);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      };

      await baseUrl.patch(`/api/exams/${examId}`, payload, config);
      toast({ title: 'تم تعديل الامتحان بنجاح', status: 'success', duration: 3000, isClosable: true });
      setEditModal({ isOpen: false, exam: null });
      refreshExams && refreshExams();
    } catch (error) {
      toast({ title: 'خطأ في تعديل الامتحان', description: error.response?.data?.message || 'حدث خطأ غير متوقع', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setActionLoading(false);
    }
  };
  // حذف الامتحان
  const handleDeleteExam = async (examId) => {
    try {
      setActionLoading(true);
      await baseUrl.delete(`/api/exams/${examId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: 'تم حذف الامتحان بنجاح', status: 'success', duration: 3000, isClosable: true });
      setDeleteDialog({ isOpen: false, exam: null });
      refreshExams && refreshExams();
    } catch (error) {
      toast({ title: 'خطأ في حذف الامتحان', description: error.response?.data?.message || 'حدث خطأ غير متوقع', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setActionLoading(false);
    }
  };


  const handleCreateExam = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      if (!form.title.trim()) {
        toast({ title: "يرجى إدخال عنوان الامتحان", status: "error" });
        setCreateLoading(false);
        return;
      }
      if (!form.questions_count || Number(form.questions_count) <= 0) {
        toast({ title: "عدد الأسئلة يجب أن يكون أكبر من صفر", status: "error" });
        setCreateLoading(false);
        return;
      }
      if (!form.duration_minutes || Number(form.duration_minutes) <= 0) {
        toast({ title: "مدة الامتحان مطلوبة ويجب أن تكون موجبة", status: "error" });
        setCreateLoading(false);
        return;
      }

      const validationMessage = validateExamFlowSettings(form);
      if (validationMessage) {
        toast({ title: validationMessage, status: "error" });
        setCreateLoading(false);
        return;
      }

      const normalizedPayload = normalizeExamPayload({
        title: form.title.trim(),
        questions_count: form.questions_count,
        duration_minutes: form.duration_minutes,
        is_visible_to_students: form.is_visible_to_students,
        visibility_end_date: form.visibility_end_date,
        show_answers_immediately: form.show_answers_immediately,
        answers_visible_at: form.answers_visible_at,
        is_active: form.is_active,
        attempt_limit: form.attempt_limit,
      });

      const requestData = buildExamPayload({
        ...normalizedPayload,
        courseId: courseId,
      });

      const config = token ? {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      } : {};

      await baseUrl.post(`/api/exams`, requestData, config);
      toast({ title: "تم إنشاء الامتحان بنجاح", status: "success" });
      setCreateModalOpen(false);
      setForm({ ...initialExamFormState });
      if (refreshExams) refreshExams();
    } catch (err) {
      toast({ title: err.response?.data?.message || err.message || "حدث خطأ", status: "error" });
    } finally {
      setCreateLoading(false);
    }
  };

  // مودال التعديل
  const EditExamModal = ({ isOpen, onClose, exam, onSubmit, loading }) => {
    const sectionBg = useColorModeValue("white", "gray.700");
    const sectionBorder = useColorModeValue("gray.200", "gray.600");
    const [formData, setFormData] = useState({
      title: exam?.title || "",
      questions_count: exam?.questions_count?.toString() || "",
      duration_minutes: exam?.duration_minutes?.toString() || "",
      is_visible_to_students: exam?.is_visible_to_students ?? true,
      visibility_end_date: exam?.visibility_end_date || "",
      show_answers_immediately: exam?.show_answers_immediately ?? true,
      answers_visible_at: exam?.answers_visible_at || "",
      is_active: exam?.is_active ?? true,
      attempt_limit: exam?.attempt_limit?.toString() || "",
    });

    React.useEffect(() => {
      if (exam) {
        setFormData({
          title: exam.title || "",
          questions_count: exam.questions_count?.toString() || "",
          duration_minutes: exam.duration_minutes?.toString() || "",
          is_visible_to_students: exam.is_visible_to_students ?? true,
          visibility_end_date: exam.visibility_end_date || "",
          show_answers_immediately: exam.show_answers_immediately ?? true,
          answers_visible_at: exam.answers_visible_at || "",
          is_active: exam.is_active ?? true,
          attempt_limit: exam.attempt_limit?.toString() || "",
        });
      }
    }, [exam]);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.title.trim()) {
        toast({ title: "يرجى إدخال عنوان الامتحان", status: "error" });
        return;
      }
      if (!formData.questions_count || Number(formData.questions_count) <= 0) {
        toast({ title: "عدد الأسئلة يجب أن يكون أكبر من صفر", status: "error" });
        return;
      }
      if (!formData.duration_minutes || Number(formData.duration_minutes) <= 0) {
        toast({ title: "مدة الامتحان مطلوبة", status: "error" });
        return;
      }

      const validationMessage = validateExamFlowSettings(formData);
      if (validationMessage) {
        toast({ title: validationMessage, status: "error" });
        return;
      }

      const normalizedPayload = normalizeExamPayload({
        ...formData,
        title: formData.title.trim(),
      });
      const payloadToSend = buildExamPayload(normalizedPayload);
      onSubmit(exam.id, payloadToSend);
    };

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={{ base: "full", sm: "md", lg: "lg" }}
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent
          mx={{ base: 0, sm: 3 }}
          my={{ base: 0, sm: 4 }}
          borderRadius={{ base: 0, sm: "2xl" }}
          overflow="hidden"
          dir="rtl"
          maxH={{ base: "100dvh", sm: "90vh" }}
          h={{ base: "100dvh", sm: "auto" }}
          display="flex"
          flexDirection="column"
        >
          <ModalHeader p={0} borderBottomWidth="1px" borderColor={sectionBorder} flexShrink={0}>
            <Box
              bgGradient="linear(135deg, rgba(147,51,234,0.95), rgba(59,130,246,0.9))"
              color="white"
              px={{ base: 4, md: 6 }}
              py={{ base: 4, md: 5 }}
            >
              <HStack spacing={4} align="flex-start">
                <Box
                  bg="whiteAlpha.200"
                  borderRadius="full"
                  w="48px"
                  h="48px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="0 8px 20px rgba(99,102,241,0.35)"
                  flexShrink={0}
                >
                  <Icon as={FaCog} boxSize="24px" color="white" />
                </Box>
                <VStack align="flex-start" spacing={1} minW={0}>
                  <Heading size="md">تعديل الامتحان الشامل</Heading>
                  <Text fontSize="sm" color="whiteAlpha.800">
                    حدّث إعدادات الظهور والإجابات والمحاولات
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </ModalHeader>
          <ModalCloseButton color="white" top={4} left={3} right="auto" zIndex={2} />
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <ModalBody flex="1" minH={0} overflowY="auto" overscrollBehavior="contain" py={5}>
              <VStack spacing={{ base: 4, md: 5 }} align="stretch">
                <Box
                  borderWidth="1px"
                  borderColor={sectionBorder}
                  borderRadius="lg"
                  bg="purple.50"
                  p={{ base: 3, md: 4 }}
                >
                  <HStack align="flex-start" spacing={3}>
                    <Box
                      bg="white"
                      borderRadius="full"
                      w="36px"
                      h="36px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="md"
                      flexShrink={0}
                    >
                      <Icon as={FaCheck} color="purple.500" />
                    </Box>
                    <VStack spacing={1} align="flex-start">
                      <Text fontWeight="bold" color="purple.700">
                        ملخص سريع
                      </Text>
                      <Text fontSize="sm" color="purple.600">
                        أي تغيير هنا ينعكس فوراً على الطلاب، لذا راجع تفاصيل الوقت والإجابات قبل الحفظ.
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
                <Box
                  className="modern-card"
                  p={{ base: 3, md: 4 }}
                  bg={sectionBg}
                >
                  <Heading size="sm" mb={3} color="gray.600">
                    المعلومات الأساسية
                  </Heading>
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel>عنوان الامتحان</FormLabel>
                      <Input
                        value={formData.title}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, title: e.target.value }))
                        }
                      />
                    </FormControl>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>عدد الأسئلة</FormLabel>
                        <Input
                          type="number"
                          min={1}
                          value={formData.questions_count}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              questions_count: e.target.value,
                            }))
                          }
                        />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>مدة الامتحان (دقائق)</FormLabel>
                        <Input
                          type="number"
                          min={1}
                          value={formData.duration_minutes}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              duration_minutes: e.target.value,
                            }))
                          }
                        />
                      </FormControl>
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">إظهار الامتحان للطلاب</FormLabel>
                        <Switch
                          colorScheme="green"
                          isChecked={formData.is_visible_to_students}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              is_visible_to_students: e.target.checked,
                              visibility_end_date: e.target.checked ? "" : prev.visibility_end_date,
                            }))
                          }
                        />
                      </FormControl>
                      {!formData.is_visible_to_students && (
                        <FormControl isRequired>
                          <FormLabel>موعد انتهاء الظهور</FormLabel>
                          <Input
                            type="datetime-local"
                            value={toDateTimeLocalValue(formData.visibility_end_date)}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                visibility_end_date: fromDateTimeLocalValue(e.target.value),
                              }))
                            }
                          />
                        </FormControl>
                      )}
                    </SimpleGrid>
                  </VStack>
                </Box>


                <Box
                  className="modern-card"
                  p={{ base: 3, md: 4 }}
                  bg={sectionBg}
                >
                  <Heading size="sm" mb={3} color="gray.600">
                    إعدادات عرض الإجابات
                  </Heading>
                  <VStack spacing={4} align="stretch">
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">إظهار الإجابات فور التسليم</FormLabel>
                      <Switch
                        colorScheme="blue"
                        isChecked={formData.show_answers_immediately}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            show_answers_immediately: e.target.checked,
                          }))
                        }
                      />
                    </FormControl>
                    {!formData.show_answers_immediately && (
                      <FormControl isRequired>
                        <FormLabel>موعد إظهار الإجابات</FormLabel>
                        <Input
                          type="datetime-local"
                          value={toDateTimeLocalValue(formData.answers_visible_at)}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              answers_visible_at: fromDateTimeLocalValue(
                                e.target.value
                              ),
                            }))
                          }
                        />
                      </FormControl>
                    )}
                  </VStack>
                </Box>

                <Box
                  className="modern-card"
                  p={{ base: 3, md: 4 }}
                  bg={sectionBg}
                >
                  <Heading size="sm" mb={3} color="gray.600">
                    حالة الامتحان والمحاولات
                  </Heading>
                  <VStack spacing={4} align="stretch">
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">الامتحان نشط</FormLabel>
                      <Switch
                        colorScheme="green"
                        isChecked={formData.is_active}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            is_active: e.target.checked,
                          }))
                        }
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>حد المحاولات</FormLabel>
                      <NumberInput
                        min={1}
                        value={formData.attempt_limit}
                        onChange={(valueString) =>
                          setFormData((prev) => ({
                            ...prev,
                            attempt_limit: valueString,
                          }))
                        }
                      >
                        <NumberInputField placeholder="اتركه فارغاً لعدد غير محدود" />
                      </NumberInput>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        اتركه فارغاً للسماح بعدد غير محدود من المحاولات
                      </Text>
                    </FormControl>
                  </VStack>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter flexShrink={0} flexWrap="wrap" gap={2}>
              <Button
                variant="ghost"
                onClick={onClose}
                size={{ base: 'sm', sm: 'md' }}
                fontSize={{ base: 'sm', sm: 'md' }}
                px={{ base: 3, sm: 4 }}
                py={{ base: 2, sm: 3 }}
                minW={{ base: '80px', sm: '100px' }}
              >
                إلغاء
              </Button>
              <Button
                colorScheme="blue"
                type="submit"
                isLoading={loading}
                size={{ base: 'sm', sm: 'md' }}
                fontSize={{ base: 'sm', sm: 'md' }}
                px={{ base: 3, sm: 4 }}
                py={{ base: 2, sm: 3 }}
                minW={{ base: '100px', sm: '120px' }}
              >
                حفظ التعديلات
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    );
  };

  // Dialog الحذف
  const DeleteExamDialog = ({ isOpen, onClose, onConfirm, exam, loading }) => (
    <AlertDialog isOpen={isOpen} onClose={onClose}>
      <AlertDialogOverlay />
      <AlertDialogContent>
        <AlertDialogHeader fontSize="lg" fontWeight="bold">تأكيد حذف الامتحان</AlertDialogHeader>
        <AlertDialogBody>هل أنت متأكد من حذف "{exam?.title}"؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogBody>
        <AlertDialogFooter>
          <Button
            onClick={onClose}
            size={{ base: 'sm', sm: 'md' }}
            fontSize={{ base: 'sm', sm: 'md' }}
            px={{ base: 3, sm: 4 }}
            py={{ base: 2, sm: 3 }}
            minW={{ base: '80px', sm: '100px' }}
          >
            إلغاء
          </Button>
          <Button
            colorScheme="red"
            onClick={() => onConfirm(exam.id)}
            ml={3}
            isLoading={loading}
            size={{ base: 'sm', sm: 'md' }}
            fontSize={{ base: 'sm', sm: 'md' }}
            px={{ base: 3, sm: 4 }}
            py={{ base: 2, sm: 3 }}
            minW={{ base: '100px', sm: '120px' }}
          >
            حذف
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const handleToggleVisibility = async (examId, currentVisibility) => {
    try {
      setActionLoading(true);
      await baseUrl.patch(`/api/exams/${examId}`, {
        isVisibleToStudents: !currentVisibility
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      toast({ title: !currentVisibility ? 'تم إظهار الامتحان' : 'تم إخفاء الامتحان', status: 'success', duration: 3000, isClosable: true });
      refreshExams && refreshExams();
    } catch (error) {
      toast({ title: 'خطأ في تغيير حالة الظهور', description: error.response?.data?.message || 'حدث خطأ غير متوقع', status: 'error', duration: 3000, isClosable: true });
    } finally {
      setActionLoading(false);
    }
  };

  const resetSingleImageQuestion = () => {
    if (typeof URL !== "undefined" && singleImageQuestion.imagePreview) {
      URL.revokeObjectURL(singleImageQuestion.imagePreview);
    }
    setSingleImageQuestion({
      text: "",
      choices: ["", "", "", ""],
      correctIndex: 0,
      imageFile: null,
      imagePreview: "",
    });
  };

  const resetQuestionManagerState = () => {
    resetSingleImageQuestion();
    clearImageQuestionPreviews(imageQuestionItems);
    setImageQuestionItems([]);
    setBulkTextInput("");
    setBulkCorrectAnswers("");
    setPassageIdInput("");
    setQuestionManagerModal({ isOpen: false, exam: null, tabIndex: 0 });
    setSingleImageLoading(false);
    setImageQuestionsLoading(false);
    setBulkTextLoading(false);
    setPassageLoading(false);
  };

  const handleOpenQuestionManagerModal = (exam, tabIndex = 0) => {
    setQuestionManagerModal({ isOpen: true, exam, tabIndex });
  };

  const handleSingleImageFileChange = (file) => {
    if (!file || typeof URL === "undefined") return;
    if (singleImageQuestion.imagePreview) {
      URL.revokeObjectURL(singleImageQuestion.imagePreview);
    }
    setSingleImageQuestion((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    }));
  };

  const handleSingleImageChoiceChange = (index, value) => {
    setSingleImageQuestion((prev) => {
      const updated = [...prev.choices];
      updated[index] = value;
      return { ...prev, choices: updated };
    });
  };

  const handleSingleImageCorrectChange = (index) => {
    setSingleImageQuestion((prev) => ({ ...prev, correctIndex: index }));
  };

  const handleSelectImageQuestions = (files) => {
    if (!files || files.length === 0 || typeof URL === "undefined") return;
    const limitedFiles = Array.from(files).slice(0, 10);
    clearImageQuestionPreviews(imageQuestionItems);
    const mapped = limitedFiles.map((file, index) => ({
      id: `${file.name}-${file.size}-${index}-${Date.now()}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setImageQuestionItems(mapped);
  };


  const handleRemoveImageQuestion = (id) => {
    setImageQuestionItems((prev) => {
      const item = prev.find((q) => q.id === id);
      if (item?.preview) clearImageQuestionPreviews([item]);
      return prev.filter((q) => q.id !== id);
    });
  };

  const handleSubmitImageQuestions = async () => {
    if (!questionManagerModal.exam) return;
    if (imageQuestionItems.length === 0) {
      toast({ title: "يرجى اختيار صور الأسئلة أولاً", status: "warning" });
      return;
    }

    if (imageQuestionItems.length > 10) {
      toast({ title: "الحد الأقصى 10 صور في كل مرة", status: "warning" });
      return;
    }

    setImageQuestionsLoading(true);
    try {
      const formData = new FormData();

      // إضافة الصور كمصفوفة images[]
      imageQuestionItems.forEach((item) => {
        formData.append("images[]", item.file);
      });

      const response = await baseUrl.post(
        `/api/exams/${questionManagerModal.exam.id}/questions/images`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // لا نضيف Content-Type للسماح للمتصفح بتعيينه تلقائياً مع boundary
          }
        }
      );

      toast({
        title: "تم إضافة الأسئلة المصورة بنجاح",
        description: `تم إضافة ${response.data?.count || imageQuestionItems.length} سؤال`,
        status: "success"
      });
      clearImageQuestionPreviews(imageQuestionItems);
      setImageQuestionItems([]);
      if (refreshExams) refreshExams();
    } catch (error) {
      toast({
        title: "تعذر رفع الأسئلة المصورة",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
      });
    } finally {
      setImageQuestionsLoading(false);
    }
  };

  const handleSubmitSingleImageQuestion = async () => {
    if (!questionManagerModal.exam) return;

    // التحقق من نص السؤال (مطلوب)
    if (!singleImageQuestion.text.trim()) {
      toast({ title: "يرجى إدخال نص السؤال", status: "warning" });
      return;
    }

    // التحقق من جميع الاختيارات
    const trimmedChoices = singleImageQuestion.choices.map((choice) => choice.trim());
    if (trimmedChoices.some((choice) => choice === "")) {
      toast({ title: "يرجى إدخال نص لجميع الاختيارات", status: "warning" });
      return;
    }

    setSingleImageLoading(true);
    try {
      const formData = new FormData();
      formData.append("type", "TEXT");
      formData.append("questionText", singleImageQuestion.text.trim());
      formData.append("optionA", trimmedChoices[0]);
      formData.append("optionB", trimmedChoices[1]);
      formData.append("optionC", trimmedChoices[2]);
      formData.append("optionD", trimmedChoices[3]);

      // تحويل الفهرس إلى حرف (0 -> A, 1 -> B, 2 -> C, 3 -> D)
      const correctAnswer = ["A", "B", "C", "D"][singleImageQuestion.correctIndex];
      formData.append("correctAnswer", correctAnswer);

      // إضافة الصورة إذا كانت موجودة (اختياري)
      if (singleImageQuestion.imageFile) {
        formData.append("questionImage", singleImageQuestion.imageFile);
      }

      await baseUrl.post(
        `/api/exams/${questionManagerModal.exam.id}/questions`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // لا نضيف Content-Type للسماح للمتصفح بتعيينه تلقائياً مع boundary
          }
        }
      );
      toast({ title: "تم إضافة السؤال بنجاح", status: "success" });
      resetSingleImageQuestion();
      if (refreshExams) refreshExams();
    } catch (error) {
      toast({
        title: "تعذر إضافة السؤال",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
      });
    } finally {
      setSingleImageLoading(false);
    }
  };

  const handleSubmitBulkTextQuestions = async () => {
    if (!questionManagerModal.exam) return;
    const text = bulkTextInput.trim();
    if (!text) {
      toast({ title: "يرجى إدخال نص الأسئلة", status: "warning" });
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
      const res = await baseUrl.post(
        `/api/exams/${questionManagerModal.exam.id}/questions/bulk`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const count = res.data?.count ?? 0;
      toast({
        title: res.data?.message || `تمت إضافة ${count} سؤال`,
        status: "success",
      });
      setBulkTextInput("");
      setBulkCorrectAnswers("");
      if (refreshExams) refreshExams();
    } catch (error) {
      toast({
        title: "تعذر إضافة الأسئلة",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
      });
    } finally {
      setBulkTextLoading(false);
    }
  };

  const handleSubmitPassageQuestions = async () => {
    if (!questionManagerModal.exam) return;

    const normalizedPassageId = Number(passageIdInput);
    if (!normalizedPassageId || normalizedPassageId <= 0) {
      toast({ title: "يرجى إدخال passageId صحيح", status: "warning" });
      return;
    }

    setPassageLoading(true);
    try {
      const res = await baseUrl.post(
        `/api/exams/${questionManagerModal.exam.id}/questions/from-passage`,
        { passageId: normalizedPassageId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const addedCount = res.data?.added ?? 0;
      toast({
        title: res.data?.message || `تمت إضافة ${addedCount} سؤال من القطعة`,
        status: "success",
      });
      if (refreshExams) refreshExams();
    } catch (error) {
      toast({
        title: "تعذر إضافة أسئلة القطعة",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
      });
    } finally {
      setPassageLoading(false);
    }
  };

  return (
    <VStack spacing={{ base: 3, md: 4 }} align="stretch">
      <Flex
        justify="space-between"
        align="center"
        mb={{ base: 2, md: 4 }}
        direction={{ base: 'column', sm: 'row' }}
        gap={{ base: 2, sm: 0 }}
      >
        <Heading size={{ base: 'sm', md: 'md' }} color={headingColor}>
          الامتحانات الشاملة
        </Heading>
        {isTeacher && (
          <Button
            colorScheme="blue"
            mb={{ base: 0, sm: 0 }}
            onClick={() => setCreateModalOpen(true)}
            size={{ base: 'sm', sm: 'md', md: 'lg' }}
            w={{ base: '100%', sm: 'auto' }}
            fontSize={{ base: 'sm', sm: 'md', md: 'lg' }}
            px={{ base: 4, sm: 6, md: 8 }}
            py={{ base: 2, sm: 3, md: 4 }}
            minW={{ base: '160px', sm: '180px', md: '200px' }}
            h={{ base: '40px', sm: '44px', md: '48px' }}
            borderRadius="full"
          >
            إنشاء امتحان شامل
          </Button>
        )}
      </Flex>
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        isCentered
        size={{ base: "full", sm: "lg", md: "xl" }}
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent
          mx={{ base: 0, sm: 3 }}
          my={{ base: 0, sm: 4 }}
          borderRadius={{ base: 0, sm: "2xl" }}
          overflow="hidden"
          dir="rtl"
          maxH={{ base: "100dvh", sm: "90vh" }}
          h={{ base: "100dvh", sm: "auto" }}
          display="flex"
          flexDirection="column"
        >
          <ModalHeader p={0} flexShrink={0}>
            <Box
              bgGradient="linear(135deg, #2B6CB0, #3182CE)"
              color="white"
              px={{ base: 4, md: 6 }}
              py={{ base: 4, md: 5 }}
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                inset={0}
                opacity={0.15}
                bgImage="radial-gradient(circle at 85% 20%, white 1px, transparent 1px)"
                bgSize="18px 18px"
                pointerEvents="none"
              />
              <HStack spacing={3.5} position="relative">
                <Center
                  bg="whiteAlpha.250"
                  borderRadius="xl"
                  w="46px"
                  h="46px"
                  flexShrink={0}
                >
                  <Icon as={FaRegFileAlt} boxSize={5} />
                </Center>
                <Box>
                  <Heading size="md" fontWeight="800">
                    إنشاء امتحان شامل جديد
                  </Heading>
                  <Text fontSize="sm" color="whiteAlpha.800" mt={0.5}>
                    املأ البيانات الأساسية واضبط الظهور والمحاولات
                  </Text>
                </Box>
              </HStack>
            </Box>
          </ModalHeader>
          <ModalCloseButton color="white" top={4} left={3} right="auto" zIndex={2} />
          <form
            onSubmit={handleCreateExam}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <ModalBody
              px={{ base: 4, md: 5 }}
              py={5}
                  bg={modalSectionBg}
              flex="1"
              minH={0}
              overflowY="auto"
              overscrollBehavior="contain"
                >
              <VStack spacing={4} align="stretch">
                <ExamModalSection icon={FaRegFileAlt} title="المعلومات الأساسية" accent="blue">
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" fontWeight="600">
                        عنوان الامتحان
                      </FormLabel>
                      <Input
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="مثال: امتحان نهاية الكورس"
                        borderRadius="lg"
                        _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #63B3ED" }}
                      />
                    </FormControl>

                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm" fontWeight="600">
                          عدد الأسئلة
                        </FormLabel>
                        <Input
                          type="number"
                          min={1}
                          value={form.questions_count}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, questions_count: e.target.value }))
                          }
                          placeholder="20"
                          borderRadius="lg"
                        />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm" fontWeight="600">
                          المدة (دقائق)
                        </FormLabel>
                        <Input
                          type="number"
                          min={1}
                          value={form.duration_minutes}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, duration_minutes: e.target.value }))
                          }
                          placeholder="60"
                          borderRadius="lg"
                        />
                      </FormControl>
                    </SimpleGrid>
                  </VStack>
                </ExamModalSection>

                <ExamModalSection icon={FaEye} title="الظهور للطلاب" accent="green">
                  <VStack spacing={3} align="stretch">
                    <ExamSwitchRow
                      label="إظهار الامتحان للطلاب"
                      hint="الطلاب يشوفوا الامتحان فور إنشائه"
                          colorScheme="green"
                          isChecked={form.is_visible_to_students}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              is_visible_to_students: e.target.checked,
                              visibility_end_date: e.target.checked ? "" : f.visibility_end_date,
                            }))
                          }
                        />
                      {!form.is_visible_to_students && (
                        <FormControl isRequired>
                        <FormLabel fontSize="sm" fontWeight="600">
                          موعد انتهاء الظهور
                        </FormLabel>
                          <Input
                            type="datetime-local"
                            value={toDateTimeLocalValue(form.visibility_end_date)}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                visibility_end_date: fromDateTimeLocalValue(e.target.value),
                              }))
                            }
                          borderRadius="lg"
                          />
                        </FormControl>
                      )}
                    <ExamSwitchRow
                      label="إظهار الإجابات فور التسليم"
                      hint="لو اتقفل، حدد موعد إظهار الإجابات"
                        colorScheme="blue"
                        isChecked={form.show_answers_immediately}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            show_answers_immediately: e.target.checked,
                          }))
                        }
                      />
                    {!form.show_answers_immediately && (
                      <FormControl isRequired>
                        <FormLabel fontSize="sm" fontWeight="600">
                          موعد إظهار الإجابات
                        </FormLabel>
                        <Input
                          type="datetime-local"
                          value={toDateTimeLocalValue(form.answers_visible_at)}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              answers_visible_at: fromDateTimeLocalValue(e.target.value),
                            }))
                          }
                          borderRadius="lg"
                        />
                      </FormControl>
                    )}
                  </VStack>
                </ExamModalSection>

                <ExamModalSection icon={FaStar} title="الحالة والمحاولات" accent="orange">
                  <VStack spacing={3} align="stretch">
                    <ExamSwitchRow
                      label="الامتحان نشط"
                      hint="الامتحان غير النشط لا يمكن للطلاب دخوله"
                        colorScheme="green"
                        isChecked={form.is_active}
                        onChange={(e) =>
                        setForm((f) => ({ ...f, is_active: e.target.checked }))
                        }
                      />
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="600">
                        حد المحاولات
                      </FormLabel>
                      <NumberInput
                        min={1}
                        value={form.attempt_limit}
                        onChange={(valueString) =>
                          setForm((f) => ({ ...f, attempt_limit: valueString }))
                        }
                      >
                        <NumberInputField
                          placeholder="اتركه فارغاً لعدد غير محدود"
                          borderRadius="lg"
                        />
                      </NumberInput>
                    </FormControl>
                  </VStack>
                </ExamModalSection>
              </VStack>
            </ModalBody>
            <ModalFooter
              borderTopWidth="1px"
              borderColor={modalSectionBorder}
              gap={2}
              px={{ base: 4, md: 5 }}
              flexShrink={0}
              flexWrap="wrap"
              bg={modalSectionBg}
            >
              <Button
                variant="ghost"
                borderRadius="lg"
                onClick={() => setCreateModalOpen(false)}
              >
                إلغاء
              </Button>
              <Button
                colorScheme="blue"
                type="submit"
                isLoading={createLoading}
                loadingText="جاري الإنشاء..."
                borderRadius="lg"
                px={8}
                fontWeight="700"
                leftIcon={<Icon as={FaPlus} boxSize={3} />}
              >
                إنشاء الامتحان
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
      {courseExamsLoading ? (
        <Center py={10}>
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>جاري تحميل الامتحانات الشاملة...</Text>
          </VStack>
        </Center>
      ) : courseExamsError ? (
        <Center py={10}>
          <VStack spacing={4}>
            <Icon as={FaLightbulb} boxSize={12} color="red.400" />
            <Text color="red.500">{courseExamsError}</Text>
          </VStack>
        </Center>
      ) : !Array.isArray(courseExams) || courseExams.length === 0 ? (
        <Center py={8} flexDir="column" textAlign="center">
          <Box
            mx="auto"
            display="flex"
            aspectRatio={1}
            w={{ base: "16rem", sm: "20rem" }}
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
            borderRadius="full"
            bg="black"
          >
            <Box
              as="img"
              src="/images/course-exams-empty.jpg"
              alt="لا توجد امتحانات شاملة — سيتم إضافتها قريباً"
              w="full"
              h="full"
              objectFit="contain"
              loading="lazy"
              decoding="async"
            />
          </Box>
        </Center>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 3, md: 5 }}>
          {courseExams.map((exam) => (
            <ExamCard
                key={exam.id}
              exam={exam}
              isTeacher={isTeacher}
              formatDate={formatDate}
              actionLoading={actionLoading}
              onToggleVisibility={() =>
                handleToggleVisibility(exam.id, exam.is_visible_to_students)
              }
              onAddQuestions={() => handleOpenQuestionManagerModal(exam, 0)}
              onAddImageQuestions={() => handleOpenQuestionManagerModal(exam, 1)}
              onEdit={() => setEditModal({ isOpen: true, exam })}
              onDelete={() => setDeleteDialog({ isOpen: true, exam })}
            />
          ))}
        </SimpleGrid>
      )}
      {/* Modals */}
      <EditExamModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, exam: null })}
        exam={editModal.exam}
        onSubmit={handleEditExam}
        loading={actionLoading}
      />
      <DeleteExamDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, exam: null })}
        exam={deleteDialog.exam}
        onConfirm={handleDeleteExam}
        loading={actionLoading}
      />
      <Modal
        isOpen={questionManagerModal.isOpen}
        onClose={resetQuestionManagerState}
        size={{ base: "full", sm: "xl", md: "2xl" }}
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent
          mx={{ base: 0, sm: 3 }}
          my={{ base: 0, sm: 4 }}
          borderRadius={{ base: 0, sm: "2xl" }}
          overflow="hidden"
          dir="rtl"
          maxH={{ base: "100dvh", sm: "90vh" }}
          h={{ base: "100dvh", sm: "auto" }}
          display="flex"
          flexDirection="column"
        >
          <ModalHeader p={0} borderBottomWidth="1px" borderColor={modalSectionBorder} flexShrink={0}>
            <Box
              bgGradient="linear(135deg, rgba(59,130,246,0.95), rgba(14,165,233,0.9))"
              color="white"
              px={{ base: 4, md: 6 }}
              py={{ base: 4, md: 5 }}
            >
              <HStack spacing={4} align="flex-start">
                <Box
                  bg="whiteAlpha.200"
                  borderRadius="full"
                  w="48px"
                  h="48px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="0 8px 20px rgba(15,118,255,0.35)"
                  flexShrink={0}
                >
                  <Icon as={FaPlus} boxSize="24px" color="white" />
                </Box>
                <VStack align="flex-start" spacing={1} minW={0} pe={8}>
                  <Heading size="md">
                    إدارة أسئلة الامتحان {questionManagerModal.exam ? `- ${questionManagerModal.exam.title}` : ""}
                  </Heading>
                  <Text fontSize="sm" color="whiteAlpha.800">
                    اختر الطريقة المناسبة لإضافة الأسئلة (صورة، صور متعددة، أو مجموعة نصية)
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </ModalHeader>
          <ModalCloseButton color="white" top={4} left={3} right="auto" zIndex={2} />
          <ModalBody flex="1" minH={0} overflowY="auto" overscrollBehavior="contain" py={5}>
            <Tabs
              index={questionManagerModal.tabIndex}
              onChange={(idx) =>
                setQuestionManagerModal((prev) => ({ ...prev, tabIndex: idx }))
              }
              isFitted
              variant="enclosed"
            >
              <TabList overflowX="auto">
                <Tab>سؤال بصورة واحدة</Tab>
                <Tab>صور متعددة</Tab>
                <Tab>مجموعة أسئلة (نص)</Tab>
                <Tab>إضافة من قطعة</Tab>
              </TabList>
              <TabPanels mt={4}>
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    <Box
                      borderWidth="1px"
                      borderColor={modalSectionBorder}
                      borderRadius="lg"
                      p={{ base: 3, md: 4 }}
                      bg={modalSectionBg}
                    >
                      <VStack spacing={4} align="stretch">
                        <FormControl isRequired>
                          <FormLabel>نص السؤال</FormLabel>
                          <Textarea
                            placeholder="أدخل نص السؤال"
                            value={singleImageQuestion.text}
                            onChange={(e) =>
                              setSingleImageQuestion((prev) => ({
                                ...prev,
                                text: e.target.value,
                              }))
                            }
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel>صورة السؤال (اختياري)</FormLabel>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleSingleImageFileChange(e.target.files?.[0])
                            }
                            p={1}
                            border="2px dashed"
                            borderColor="blue.300"
                            borderRadius="md"
                            _hover={{ borderColor: "blue.400" }}
                          />
                          {singleImageQuestion.imagePreview && (
                            <Box
                              mt={3}
                              borderRadius="lg"
                              overflow="hidden"
                              borderWidth="1px"
                              borderColor={modalSectionBorder}
                            >
                              <Image
                                src={singleImageQuestion.imagePreview}
                                alt="معاينة السؤال"
                                w="100%"
                                h="220px"
                                objectFit="cover"
                              />
                            </Box>
                          )}
                        </FormControl>
                        <Box>
                          <FormLabel mb={2}>الاختيارات (مطلوبة)</FormLabel>
                          <RadioGroup
                            value={singleImageQuestion.correctIndex.toString()}
                            onChange={(val) =>
                              handleSingleImageCorrectChange(Number(val))
                            }
                          >
                            <VStack align="stretch" spacing={3}>
                              {singleImageQuestion.choices.map((choice, idx) => {
                                const labels = ["A", "B", "C", "D"];
                                return (
                                  <HStack
                                    key={`choice-${idx}`}
                                    borderWidth="1px"
                                    borderColor={modalSectionBorder}
                                    borderRadius="lg"
                                    p={2}
                                    bg={useColorModeValue("white", "gray.800")}
                                  >
                                    <Radio value={idx.toString()} colorScheme="blue" />
                                    <Text fontWeight="bold" minW="20px">
                                      {labels[idx]}:
                                    </Text>
                                    <Input
                                      placeholder={`نص الاختيار ${labels[idx]}`}
                                      value={choice}
                                      onChange={(e) =>
                                        handleSingleImageChoiceChange(idx, e.target.value)
                                      }
                                    />
                                  </HStack>
                                );
                              })}
                            </VStack>
                          </RadioGroup>
                          <Text fontSize="xs" color="gray.500" mt={2}>
                            اختر الإجابة الصحيحة من الخيارات أعلاه
                          </Text>
                        </Box>
                      </VStack>
                    </Box>
                    <Button
                      colorScheme="blue"
                      alignSelf="flex-end"
                      onClick={handleSubmitSingleImageQuestion}
                      isLoading={singleImageLoading}
                    >
                      إضافة السؤال
                    </Button>
                  </VStack>
                </TabPanel>
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    <Box
                      borderWidth="1px"
                      borderColor={modalSectionBorder}
                      borderRadius="lg"
                      p={{ base: 3, md: 4 }}
                      bg={modalSectionBg}
                    >
                      <VStack align="stretch" spacing={2}>
                        <FormControl>
                          <FormLabel>اختر الصور (حتى 10 ملفات)</FormLabel>
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleSelectImageQuestions(e.target.files)}
                            p={1}
                            border="2px dashed"
                            borderColor="purple.300"
                            borderRadius="md"
                            _hover={{ borderColor: "purple.400" }}
                          />
                        </FormControl>
                        <Text fontSize="sm" color="gray.500">
                          يتم إنشاء اختيارات A/B/C/D تلقائياً. يمكنك تحديد الإجابة الصحيحة لاحقاً من صفحة الامتحان.
                        </Text>
                      </VStack>
                    </Box>
                    {imageQuestionItems.length > 0 && (
                      <VStack align="stretch" spacing={4}>
                        {imageQuestionItems.map((item, index) => (
                          <Box
                            key={item.id}
                            borderWidth="1px"
                            borderColor={modalSectionBorder}
                            borderRadius="xl"
                            p={{ base: 3, md: 4 }}
                            bg={useColorModeValue("white", "gray.800")}
                            boxShadow="sm"
                          >
                            <HStack justify="space-between" mb={3}>
                              <Text fontWeight="bold" color="gray.600">
                                صورة #{index + 1}
                              </Text>
                              <IconButton
                                icon={<FaTimes />}
                                size="sm"
                                variant="ghost"
                                aria-label="إزالة الصورة"
                                onClick={() => handleRemoveImageQuestion(item.id)}
                              />
                            </HStack>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                              <Box
                                borderRadius="lg"
                                overflow="hidden"
                                borderWidth="1px"
                                borderColor={modalSectionBorder}
                              >
                                <Image
                                  src={item.preview}
                                  alt={`question-${index + 1}`}
                                  w="100%"
                                  h="200px"
                                  objectFit="cover"
                                />
                              </Box>
                            </SimpleGrid>
                          </Box>
                        ))}
                      </VStack>
                    )}
                    <Button
                      colorScheme="purple"
                      alignSelf="flex-end"
                      onClick={handleSubmitImageQuestions}
                      isLoading={imageQuestionsLoading}
                      isDisabled={imageQuestionItems.length === 0}
                    >
                      رفع الأسئلة المصورة
                    </Button>
                  </VStack>
                </TabPanel>
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    <Box
                      borderWidth="1px"
                      borderColor={modalSectionBorder}
                      borderRadius="lg"
                      p={{ base: 3, md: 4 }}
                      bg={modalSectionBg}
                    >
                      <Text fontSize="sm" color="gray.600" mb={3}>
                        الصيغة: كل سؤال يتكوّن من سطر أو أكثر لنص السؤال، ثم أربعة أسطر بالترتيب:
                        <strong> a. </strong> ثم <strong> b. </strong> ثم <strong> c. </strong> ثم <strong> d. </strong>
                        يمكن وضع سطر فاضي بين الأسئلة.
                      </Text>
                      <FormControl>
                        <FormLabel>نص الأسئلة (مطلوب)</FormLabel>
                        <Textarea
                          rows={12}
                          placeholder={`أي مما يلي لا يعتبر من الجزيئات العضوية الصغيرة؟\na. الأحماض النووية\nb. الأحماض الأمينية\nc. الأحماض الدهنية\nd. لا توجد إجابة صحيحة\n\nأي المركبات الآتية يحتوي على أقل عدد من جزيئات الجلوكوز؟\na. السليلوز\nb. السكروز\nc. النشا\nd. الكيتين`}
                          value={bulkTextInput}
                          onChange={(e) => setBulkTextInput(e.target.value)}
                        />
                      </FormControl>
                      <FormControl mt={3}>
                        <FormLabel fontSize="sm">
                          الإجابات الصحيحة بالترتيب (اختياري) — مثل: C,D,D,D,C,A,D
                        </FormLabel>
                        <Input
                          placeholder="C, D, D, D, C, A, D"
                          value={bulkCorrectAnswers}
                          onChange={(e) => setBulkCorrectAnswers(e.target.value)}
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          إن لم تُدخل، تُعامل كل الأسئلة إجابتها الصحيحة A.
                        </Text>
                      </FormControl>
                    </Box>
                    <Button
                      colorScheme="green"
                      alignSelf="flex-end"
                      onClick={handleSubmitBulkTextQuestions}
                      isLoading={bulkTextLoading}
                    >
                      إضافة مجموعة الأسئلة
                    </Button>
                  </VStack>
                </TabPanel>
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    <Box
                      borderWidth="1px"
                      borderColor={modalSectionBorder}
                      borderRadius="lg"
                      p={{ base: 3, md: 4 }}
                      bg={modalSectionBg}
                    >
                      <Text fontSize="sm" color="gray.600" mb={3}>
                        أضف كل أسئلة قطعة واحدة مباشرة إلى الامتحان باستخدام معرف القطعة.
                      </Text>
                      <FormControl isRequired>
                        <FormLabel>معرف القطعة (passageId)</FormLabel>
                        <Input
                          type="number"
                          min={1}
                          placeholder="مثال: 44"
                          value={passageIdInput}
                          onChange={(e) => setPassageIdInput(e.target.value)}
                        />
                      </FormControl>
                      <Text fontSize="xs" color="gray.500" mt={2}>
                        سيتم استدعاء API: /api/exams/:examId/questions/from-passage
                      </Text>
                    </Box>
                    <Button
                      colorScheme="teal"
                      alignSelf="flex-end"
                      onClick={handleSubmitPassageQuestions}
                      isLoading={passageLoading}
                    >
                      إضافة أسئلة القطعة
                    </Button>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
          <ModalFooter flexShrink={0}>
            <Button variant="ghost" onClick={resetQuestionManagerState}>
              إغلاق
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default CourseExamsTab;