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
      <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'sm', md: 'md', lg: 'lg' }}>
        <ModalOverlay />
        <ModalContent mx={{ base: 2, md: 0 }}>
          <ModalHeader p={0} borderBottomWidth="1px" borderColor={sectionBorder}>
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
                >
                  <Icon as={FaCog} boxSize="24px" color="white" />
                </Box>
                <VStack align="flex-start" spacing={1}>
                  <Heading size="md">تعديل الامتحان الشامل</Heading>
                  <Text fontSize="sm" color="whiteAlpha.800">
                    قم بمزامنة إعدادات Exam Flow مع طلابك
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <form onSubmit={handleSubmit}>
            <ModalBody>
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
            <ModalFooter>
              <Button
                variant="ghost"
                mr={3}
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
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} isCentered size={{ base: 'sm', md: 'md', lg: 'lg' }}>
        <ModalOverlay />
        <ModalContent mx={{ base: 2, md: 0 }}>
          <ModalHeader p={0} borderBottomWidth="1px" borderColor={modalSectionBorder}>
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
                >
                  <Icon as={FaRegFileAlt} boxSize="24px" color="white" />
                </Box>
                <VStack align="flex-start" spacing={1}>
                  <Heading size="md">إنشاء امتحان شامل جديد</Heading>
                  <Text fontSize="sm" color="whiteAlpha.800">
                    اضبط جميع إعدادات Exam Flow من مكان واحد
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <form onSubmit={handleCreateExam}>
            <ModalBody>
              <VStack spacing={{ base: 4, md: 5 }} align="stretch">
                <Box
                  borderWidth="1px"
                  borderColor={modalSectionBorder}
                  borderRadius="lg"
                  bg="blue.50"
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
                    >
                      <Icon as={FaClock} color="blue.500" />
                    </Box>
                    <VStack spacing={1} align="flex-start">
                      <Text fontWeight="bold" color="blue.700">
                        تلميح سريع
                      </Text>
                      <Text fontSize="sm" color="blue.600">
                        يمكنك تحديد نافذة عرض الامتحان ووقت إصدار الإجابات من نفس المكان للحصول على تدفق موحد للطلاب.
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
                <Box
                  borderWidth="1px"
                  borderColor={modalSectionBorder}
                  borderRadius="xl"
                  p={{ base: 3, md: 4 }}
                  bg={modalSectionBg}
                >
                  <Heading size="sm" mb={3} color="gray.600">
                    المعلومات الأساسية
                  </Heading>
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel>عنوان الامتحان</FormLabel>
                      <Input
                        value={form.title}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, title: e.target.value }))
                        }
                        placeholder="مثال: امتحان نهاية الكورس"
                      />
                    </FormControl>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>عدد الأسئلة</FormLabel>
                        <Input
                          type="number"
                          min={1}
                          value={form.questions_count}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
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
                          value={form.duration_minutes}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, duration_minutes: e.target.value }))
                          }
                        />
                      </FormControl>
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">إظهار الامتحان للطلاب</FormLabel>
                        <Switch
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
                      </FormControl>
                      {!form.is_visible_to_students && (
                        <FormControl isRequired>
                          <FormLabel>موعد انتهاء الظهور</FormLabel>
                          <Input
                            type="datetime-local"
                            value={toDateTimeLocalValue(form.visibility_end_date)}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
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
                  borderWidth="1px"
                  borderColor={modalSectionBorder}
                  borderRadius="xl"
                  p={{ base: 3, md: 4 }}
                  bg={modalSectionBg}
                >
                  <Heading size="sm" mb={3} color="gray.600">
                    إعدادات عرض الإجابات
                  </Heading>
                  <VStack spacing={4} align="stretch">
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">إظهار الإجابات فور التسليم</FormLabel>
                      <Switch
                        colorScheme="blue"
                        isChecked={form.show_answers_immediately}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            show_answers_immediately: e.target.checked,
                          }))
                        }
                      />
                    </FormControl>
                    {!form.show_answers_immediately && (
                      <FormControl isRequired>
                        <FormLabel>موعد إظهار الإجابات</FormLabel>
                        <Input
                          type="datetime-local"
                          value={toDateTimeLocalValue(form.answers_visible_at)}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
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
                  borderWidth="1px"
                  borderColor={modalSectionBorder}
                  borderRadius="xl"
                  p={{ base: 3, md: 4 }}
                  bg={modalSectionBg}
                >
                  <Heading size="sm" mb={3} color="gray.600">
                    حالة الامتحان والمحاولات
                  </Heading>
                  <VStack spacing={4} align="stretch">
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">الامتحان نشط</FormLabel>
                      <Switch
                        colorScheme="green"
                        isChecked={form.is_active}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            is_active: e.target.checked,
                          }))
                        }
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>حد المحاولات</FormLabel>
                      <NumberInput
                        min={1}
                        value={form.attempt_limit}
                        onChange={(valueString) =>
                          setForm((f) => ({
                            ...f,
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
            <ModalFooter>
              <Button
                variant="ghost"
                mr={3}
                onClick={() => setCreateModalOpen(false)}
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
                isLoading={createLoading}
                size={{ base: 'sm', sm: 'md' }}
                fontSize={{ base: 'sm', sm: 'md' }}
                px={{ base: 3, sm: 4 }}
                py={{ base: 2, sm: 3 }}
                minW={{ base: '100px', sm: '120px' }}
              >
                إنشاء
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
        <Center py={10}>
          <VStack spacing={4}>
            <Icon as={FaGraduationCap} boxSize={12} color="gray.400" />
            <Text color="gray.500">لا يوجد امتحانات شاملة متاحة لهذا الكورس</Text>
          </VStack>
        </Center>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 4, md: 6 }} gap={{ base: 3, md: 6 }}>
          {courseExams.map((exam) => {
            const availabilityStatus = getExamAvailabilityStatus(exam);
            const durationStatus = getExamDurationStatus(exam);
            return (
              <Box
                key={exam.id}
                bg={useColorModeValue("white", "gray.800")}
                borderRadius={{ base: 'xl', md: '2xl' }}
                boxShadow="lg"
                p={{ base: 4, md: 5 }}
                borderWidth="2px"
                borderColor={useColorModeValue("gray.200", "gray.700")}
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  borderColor: 'blue.400',
                  transform: 'translateY(-4px)'
                }}
                position="relative"
                _before={{
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: { base: 'xl', md: '2xl' },
                  background: "linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(147, 197, 253, 0.03) 100%)",
                  zIndex: -1
                }}
              >
                <VStack align="start" spacing={{ base: 2, md: 3 }}>
                  <Box
                    w="full"
                    h={{ base: '120px', sm: '140px', md: '160px' }}
                    borderRadius={{ base: 'xl', md: '2xl' }}
                    overflow="hidden"
                    bg="gray.100"
                    mb={3}
                    boxShadow="0 8px 16px rgba(0, 0, 0, 0.1)"
                    border="2px solid"
                    borderColor={useColorModeValue("gray.200", "gray.600")}
                    position="relative"
                    _before={{
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: { base: 'xl', md: '2xl' },
                      background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.1) 100%)",
                      zIndex: 1
                    }}
                  >
                    {exam.image ? (
                      <img
                        src={exam.image}
                        alt={exam.title}
                        w="full"
                        h="full"
                        style={{
                          objectFit: 'cover',
                          width: '100%',
                          height: '100%',
                          position: 'relative',
                          zIndex: 2
                        }}
                      />
                    ) : (
                      <Center w="full" h="full" position="relative" zIndex={2}>
                        <Icon as={FaGraduationCap} boxSize={12} color="gray.400" />
                      </Center>
                    )}
                  </Box>
                  <HStack spacing={2}>
                    <Icon as={FaGraduationCap} color="green.500" />
                    <Text fontWeight="bold" fontSize={{ base: 'sm', md: 'lg' }} color={headingColor} noOfLines={2}>{exam.title}</Text>
                  </HStack>
                  <VStack spacing={{ base: 1, md: 2 }} fontSize={{ base: 'xs', md: 'sm' }} color="gray.500" align="start" w="full">
                    <HStack spacing={1}><Icon as={FaBookOpen} /> <Text>{exam.questions_count} سؤال</Text></HStack>
                    <HStack spacing={1}><Icon as={FaClock} /> <Text>{exam.duration_minutes} دقيقة</Text></HStack>
                    {!isTeacher && exam.attempt_limit && (
                      <HStack spacing={1}>
                        <Icon as={FaStar} />
                        <Text>
                          المحاولات: {exam.attempts_count || 0} / {exam.attempt_limit}
                          {exam.attempts_remaining !== null && ` (متبقي: ${exam.attempts_remaining})`}
                        </Text>
                      </HStack>
                    )}
                    {!isTeacher && exam.attempt_limit && exam.last_attempt_number && (
                      <HStack spacing={1}>
                        <Icon as={FaCalendarAlt} />
                        <Text>آخر محاولة: #{exam.last_attempt_number}</Text>
                      </HStack>
                    )}
                    <HStack spacing={1}>
                      <Icon as={exam.is_visible_to_students ? FaEye : FaEyeSlash} />
                      <Text>الحالة: {exam.is_visible_to_students ? "ظاهر" : "مخفي"}</Text>
                      <Badge
                        colorScheme={exam.is_visible_to_students ? "green" : "yellow"}
                        fontSize="xs"
                        borderRadius="full"
                        px={2}
                        py={1}
                      >
                        {exam.is_visible_to_students ? "ظاهر" : "مخفي"}
                      </Badge>
                    </HStack>
                    <HStack spacing={2} flexWrap="wrap">
                      <Badge colorScheme={availabilityStatus.colorScheme} borderRadius="full" px={3} py={1}>
                        {availabilityStatus.label}
                      </Badge>
                      {durationStatus && (
                        <Badge colorScheme={durationStatus.colorScheme} borderRadius="full" px={3} py={1}>
                          {durationStatus.label}
                        </Badge>
                      )}
                      {!exam.is_active && (
                        <Badge colorScheme="gray" borderRadius="full" px={3} py={1}>
                          غير نشط
                        </Badge>
                      )}
                      {!isTeacher && exam.can_attempt === false && (
                        <Badge colorScheme="red" borderRadius="full" px={3} py={1}>
                          لا يمكن المحاولة
                        </Badge>
                      )}
                      {!isTeacher && exam.can_attempt === true && exam.attempt_limit && exam.attempts_remaining !== null && exam.attempts_remaining > 0 && (
                        <Badge colorScheme="green" borderRadius="full" px={3} py={1}>
                          يمكن المحاولة ({exam.attempts_remaining} متبقي)
                        </Badge>
                      )}
                    </HStack>
                  </VStack>
                  <Text fontSize={{ base: 'xs', md: 'xs' }} color="gray.400">تاريخ الإنشاء: {formatDate(exam.created_at)}</Text>
                  <VStack spacing={{ base: 1, md: 2 }} w="full">
                    <Link
                      to={`/exam/${exam.id}`}
                      style={{ width: '100%', textDecoration: 'none' }}
                    >
                      <Button
                        colorScheme={!isTeacher && exam.can_attempt === false ? "gray" : "blue"}
                        size={{ base: 'xs', sm: 'sm', md: 'md' }}
                        leftIcon={<Icon as={FaGraduationCap} boxSize={{ base: 3, sm: 4, md: 4 }} />}
                        w="full"
                        variant="solid"
                        borderRadius="full"
                        _hover={{
                          transform: !isTeacher && exam.can_attempt === false ? 'none' : 'translateY(-2px)',
                          boxShadow: !isTeacher && exam.can_attempt === false ? 'none' : 'lg',
                          bg: !isTeacher && exam.can_attempt === false ? 'gray.400' : 'blue.600'
                        }}
                        transition="all 0.2s"
                        fontWeight="bold"
                        fontSize={{ base: 'xs', sm: 'sm', md: 'md' }}
                        py={{ base: 2, sm: 2, md: 3 }}
                        px={{ base: 2, sm: 3, md: 4 }}
                        h={{ base: '36px', sm: '40px', md: '48px' }}
                        minW={{ base: '140px', sm: '160px', md: '180px' }}
                      >
                        {isTeacher
                          ? "عرض الامتحان"
                          : exam.can_attempt === false
                            ? "عرض الامتحان"
                            : exam.attempts_count > 0
                              ? `محاولة جديدة (${exam.attempts_count + 1})`
                              : "ابدأ الامتحان"}
                      </Button>
                    </Link>
                    {isTeacher && (
                      <HStack spacing={{ base: 1, md: 2 }} w="full" flexWrap="wrap" gap={1}>
                        <Tooltip label={exam.is_visible_to_students ? "إخفاء الامتحان" : "إظهار الامتحان"} placement="top">
                          <IconButton
                            colorScheme={exam.is_visible_to_students ? "blue" : "gray"}
                            size={{ base: 'xs', md: 'sm' }}
                            icon={<Icon as={exam.is_visible_to_students ? FaEye : FaEyeSlash} />}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleVisibility(exam.id, exam.is_visible_to_students);
                            }}
                            aria-label={exam.is_visible_to_students ? "إخفاء الامتحان" : "إظهار الامتحان"}
                            isLoading={actionLoading}
                            type="button"
                            as="button"
                          />
                        </Tooltip>
                        <Tooltip label="إضافة أسئلة للامتحان" placement="top">
                          <IconButton
                            colorScheme="green"
                            size={{ base: 'xs', md: 'sm' }}
                            icon={<Icon as={FaPlus} />}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleOpenQuestionManagerModal(exam, 0);
                            }}
                            aria-label="إضافة أسئلة للامتحان"
                            type="button"
                            as="button"
                          />
                        </Tooltip>
                        <Tooltip label="إضافة أسئلة كصور" placement="top">
                          <IconButton
                            colorScheme="purple"
                            size={{ base: 'xs', md: 'sm' }}
                            icon={<Icon as={FaCamera} />}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleOpenQuestionManagerModal(exam, 1);
                            }}
                            aria-label="إضافة أسئلة كصور"
                            type="button"
                            as="button"
                          />
                        </Tooltip>
                        <Button
                          colorScheme="yellow"
                          size={{ base: 'xs', sm: 'sm', md: 'md' }}
                          leftIcon={<Icon as={FaEdit} boxSize={{ base: 3, sm: 4, md: 4 }} />}
                          onClick={() => setEditModal({ isOpen: true, exam })}
                          flex={1}
                          fontSize={{ base: 'xs', sm: 'sm', md: 'md' }}
                          px={{ base: 2, sm: 3, md: 4 }}
                          py={{ base: 1, sm: 2, md: 2 }}
                          minW={{ base: '80px', sm: '100px', md: '120px' }}
                          h={{ base: '32px', sm: '36px', md: '40px' }}
                        >
                          تعديل
                        </Button>
                        <Button
                          colorScheme="red"
                          size={{ base: 'xs', sm: 'sm', md: 'md' }}
                          leftIcon={<Icon as={FaTrash} boxSize={{ base: 3, sm: 4, md: 4 }} />}
                          onClick={() => setDeleteDialog({ isOpen: true, exam })}
                          flex={1}
                          fontSize={{ base: 'xs', sm: 'sm', md: 'md' }}
                          px={{ base: 2, sm: 3, md: 4 }}
                          py={{ base: 1, sm: 2, md: 2 }}
                          minW={{ base: '80px', sm: '100px', md: '120px' }}
                          h={{ base: '32px', sm: '36px', md: '40px' }}
                        >
                          حذف
                        </Button>
                      </HStack>
                    )}
                  </VStack>
                </VStack>
              </Box>
            );
          })}
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
        size={{ base: "xl", md: "2xl" }}
        isCentered
      >
        <ModalOverlay />
        <ModalContent mx={{ base: 2, md: 0 }}>
          <ModalHeader p={0} borderBottomWidth="1px" borderColor={modalSectionBorder}>
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
                >
                  <Icon as={FaPlus} boxSize="24px" color="white" />
                </Box>
                <VStack align="flex-start" spacing={1}>
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
          <ModalCloseButton color="white" />
          <ModalBody>
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
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={resetQuestionManagerState}>
              إغلاق
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default CourseExamsTab;