import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Badge,
  Button,
  useColorModeValue,
  Icon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Input,
  InputGroup,
  InputLeftElement,
  FormControl,
  FormLabel,
  Textarea,
  Image,
  IconButton,
  Spinner,
  HStack,
  VStack,
  useToast,
  Select,
} from "@chakra-ui/react";
import {
  FaBook,
  FaGraduationCap,
  FaQuestionCircle,
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaUpload,
  FaTimes,
  FaBookOpen,
} from "react-icons/fa";
import { useParams } from "react-router-dom";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import {
  createBookChapter,
  createSubjectBook,
  deleteBook,
  deleteChapterById,
  fetchSubjectWithBooks,
  toastQuestionBankResult,
  updateBook,
  updateChapter,
} from "../../api/questionBankApi";
import baseUrl from "../../api/baseUrl";
import SubjectBooksShelf from "./SubjectBooksShelf";
import {
  getBookStats,
  getChapterStats,
  getSubjectTreeStats,
  normalizeSubjectBooks,
} from "../../utils/questionBankTree";

const SubjectPage = () => {
  const { id } = useParams();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [subjectData, setSubjectData] = useState(null);
  const [books, setBooks] = useState([]);
  const [expandedBookId, setExpandedBookId] = useState(null);
  const [activeBookId, setActiveBookId] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    order_num: 1,
  });
  const [chapterFormData, setChapterFormData] = useState({
    name: "",
    description: "",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Edit states
  const [editingBook, setEditingBook] = useState(null);
  const [editingChapter, setEditingChapter] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    order_num: 1,
  });
  const [editChapterFormData, setEditChapterFormData] = useState({
    name: "",
    description: "",
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  // Loading states
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isChapterOpen, onOpen: onChapterOpen, onClose: onChapterClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isBookEditOpen, onOpen: onBookEditOpen, onClose: onBookEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isPermissionOpen, onOpen: onPermissionOpen, onClose: onPermissionClose } = useDisclosure();

  // Permission states
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [teachersLoading, setTeachersLoading] = useState(false);

  // تحديد الألوان بناءً على وضع الثيم (فاتح/داكن)
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.700");
  const accentColor = useColorModeValue("blue.600", "blue.300");
  const headingColor = useColorModeValue("gray.800", "gray.100");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const hoverBg = useColorModeValue("blue.50", "gray.600");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  
  // Colors for light/dark mode with blue.500 as primary
  const pageBg = useColorModeValue("blue.50", "gray.900");
  const cardBackground = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("blue.100", "blue.900");
  const cardHoverBorder = useColorModeValue("blue.300", "blue.700");
  const textPrimary = useColorModeValue("blue.600", "blue.300");
  const textSecondary = useColorModeValue("gray.600", "gray.400");
  const inputBg = useColorModeValue("blue.50", "gray.700");
  const inputBorder = useColorModeValue("blue.200", "blue.800");
  const inputHoverBorder = useColorModeValue("blue.300", "blue.700");
  const inputFocusBorder = useColorModeValue("blue.500", "blue.400");
  const modalBg = useColorModeValue("white", "gray.800");
  const modalBorder = useColorModeValue("blue.200", "blue.900");
  const modalHeaderBg = useColorModeValue("blue.500", "blue.600");
  const modalFooterBg = useColorModeValue("blue.50", "gray.700");
  const buttonPrimary = useColorModeValue("blue.500", "blue.400");
  const buttonPrimaryHover = useColorModeValue("blue.600", "blue.500");
  const buttonSecondary = useColorModeValue("blue.400", "blue.500");
  const buttonSecondaryHover = useColorModeValue("blue.500", "blue.600");
  const iconBg = useColorModeValue("blue.50", "blue.900");
  const iconBorder = useColorModeValue("blue.200", "blue.800");
  const spinnerColor = useColorModeValue("blue.500", "blue.400");
  const badgeActiveBg = useColorModeValue("blue.100", "blue.900");
  const badgeActiveColor = useColorModeValue("blue.700", "blue.300");
  const headerBg = useColorModeValue("white", "gray.800");

  const fetchSubjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "خطأ",
          description: "يجب تسجيل الدخول أولاً",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const data = await fetchSubjectWithBooks(id);
      if (data) {
        setSubjectData(data.subject);
        const booksList = normalizeSubjectBooks(data);
        setBooks(booksList);
        setExpandedBookId((prev) => {
          if (prev && booksList.some((book) => book.id === prev)) return prev;
          return booksList[0]?.id ?? null;
        });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "حدث خطأ في جلب بيانات المادة";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const createBook = async () => {
    try {
      setSubmitLoading(true);

      const submitFormData = new FormData();
      submitFormData.append("name", formData.name);
      submitFormData.append("description", formData.description || "");
      submitFormData.append("order_num", formData.order_num || 1);
      if (selectedImage) submitFormData.append("image", selectedImage);

      await createSubjectBook(id, submitFormData);

      toast({
        title: "نجح",
        description: "تم إنشاء الكتاب بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "حدث خطأ في إنشاء الكتاب";
      toast({
        title: "خطأ",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return { success: false };
    } finally {
      setSubmitLoading(false);
    }
  };

  const createChapter = async () => {
    try {
      setSubmitLoading(true);

      if (!activeBookId) {
        toast({
          title: "خطأ",
          description: "يجب اختيار كتاب أولاً",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return { success: false };
      }

      const submitFormData = new FormData();
      submitFormData.append("name", chapterFormData.name);
      submitFormData.append("description", chapterFormData.description || "");
      if (selectedImage) submitFormData.append("image", selectedImage);

      const result = await createBookChapter(activeBookId, submitFormData);
      toastQuestionBankResult(result, toast, "تم إنشاء الفصل بنجاح");
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "حدث خطأ في إنشاء الفصل";
      toast({
        title: "خطأ",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return { success: false };
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateBook = async () => {
    try {
      setEditLoading(true);

      const submitFormData = new FormData();
      submitFormData.append("name", editFormData.name);
      submitFormData.append("description", editFormData.description || "");
      submitFormData.append("order_num", editFormData.order_num || 1);
      if (selectedImage) submitFormData.append("image", selectedImage);

      const result = await updateBook(editingBook.id, submitFormData);
      toastQuestionBankResult(result, toast, "تم تحديث الكتاب بنجاح");
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "حدث خطأ في تحديث الكتاب";
      toast({
        title: "خطأ",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return { success: false };
    } finally {
      setEditLoading(false);
    }
  };

  const handleUpdateChapter = async () => {
    try {
      setEditLoading(true);

      const submitFormData = new FormData();
      submitFormData.append("name", editChapterFormData.name);
      submitFormData.append("description", editChapterFormData.description || "");
      if (selectedImage) submitFormData.append("image", selectedImage);

      const result = await updateChapter(editingChapter.id, submitFormData);
      toastQuestionBankResult(result, toast, "تم تحديث الفصل بنجاح");
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "حدث خطأ في تحديث الفصل";
      toast({
        title: "خطأ",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return { success: false };
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);

      if (deleteTarget?.type === "book") {
        const result = await deleteBook(deleteTarget.item.id);
        toastQuestionBankResult(result, toast, "تم حذف الكتاب بنجاح");
      } else if (deleteTarget?.type === "chapter") {
        const result = await deleteChapterById(deleteTarget.item.id);
        toastQuestionBankResult(result, toast, "تم حذف الفصل بنجاح");
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "حدث خطأ في الحذف";
      toast({
        title: "خطأ",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return { success: false };
    } finally {
      setDeleteLoading(false);
    }
  };

  // Fetch teachers
  const fetchTeachers = async () => {
    try {
      setTeachersLoading(true);
      
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "خطأ",
          description: "يجب تسجيل الدخول أولاً",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const response = await baseUrl.get(`/api/users/teachers`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      console.log("Teachers API Response:", response.data);
      
      if (response.data.teachers) {
        setTeachers(response.data.teachers);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "حدث خطأ في جلب المدرسين";
      toast({
        title: "خطأ",
        description: errorMsg,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.error("Error fetching teachers:", err);
    } finally {
      setTeachersLoading(false);
    }
  };

  // Assign subject to teacher
  const assignSubjectToTeacher = async () => {
    try {
      setPermissionLoading(true);
      
      if (!selectedTeacher) {
        toast({
          title: "خطأ",
          description: "يجب اختيار مدرس",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return { success: false };
      }

      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "خطأ",
          description: "يجب تسجيل الدخول أولاً",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return { success: false };
      }

      const requestData = {
        teacherId: parseInt(selectedTeacher),
        subjectId: parseInt(id)
      };

      console.log("Assigning subject to teacher:", requestData);
      
      const response = await baseUrl.post(`/api/admin/assign-subject`, requestData, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      console.log("Assign Subject API Response:", response.data);
      
      toast({
        title: "نجح",
        description: "تم منح الصلاحية للمدرس بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error assigning subject:", error);
      
      const errorMessage = error.response?.data?.message || "حدث خطأ في منح الصلاحية";
      toast({
        title: "خطأ",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return { success: false, error: errorMessage };
    } finally {
      setPermissionLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchSubjectData();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChapterInputChange = (e) => {
    const { name, value } = e.target;
    setChapterFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChapterInputChange = (e) => {
    const { name, value } = e.target;
    setEditChapterFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب ملء اسم الكتاب",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const result = await createBook();
    if (result.success) {
      onClose();
      resetForm();
      fetchSubjectData();
    }
  };

  const handleChapterSubmit = async (e) => {
    e.preventDefault();
    if (!chapterFormData.name) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب ملء اسم الفصل",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const result = await createChapter();
    if (result.success) {
      onChapterClose();
      resetChapterForm();
      fetchSubjectData();
    }
  };

  const handleBookEditSubmit = async (e) => {
    e.preventDefault();
    if (!editFormData.name) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب ملء اسم الكتاب",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const result = await handleUpdateBook();
    if (result.success) {
      onBookEditClose();
      resetEditForm();
      fetchSubjectData();
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editChapterFormData.name) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب ملء اسم الفصل",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const result = await handleUpdateChapter();
    if (result.success) {
      onEditClose();
      resetEditChapterForm();
      fetchSubjectData();
    }
  };

  const onDeleteConfirm = async () => {
    const result = await handleDeleteConfirm();
    if (result.success) {
      onDeleteClose();
      setDeleteTarget(null);
      fetchSubjectData();
    }
  };

  // Handle permission submit
  const handlePermissionSubmit = async () => {
    const result = await assignSubjectToTeacher();
    
    if (result.success) {
      onPermissionClose();
      setSelectedTeacher("");
    }
  };

  // Handle permission modal open
  const handlePermissionOpen = () => {
    fetchTeachers();
    onPermissionOpen();
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", order_num: 1 });
    setSelectedImage(null);
    setImagePreview(null);
  };

  const resetChapterForm = () => {
    setChapterFormData({ name: "", description: "" });
    setSelectedImage(null);
    setImagePreview(null);
  };

  const resetEditForm = () => {
    setEditFormData({ name: "", description: "", order_num: 1 });
    setEditingBook(null);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const resetEditChapterForm = () => {
    setEditChapterFormData({ name: "", description: "" });
    setEditingChapter(null);
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleBookEditClick = (book) => {
    setEditingBook(book);
    setEditFormData({
      name: book.name,
      description: book.description || "",
      order_num: book.order_num || 1,
    });
    setImagePreview(book.image_url || null);
    onBookEditOpen();
  };

  const handleBookDeleteClick = (book) => {
    setDeleteTarget({ type: "book", item: book });
    onDeleteOpen();
  };

  const handleChapterCreateClick = (bookId) => {
    setChapterFormData({ name: "", description: "" });
    setSelectedImage(null);
    setImagePreview(null);
    setActiveBookId(bookId);
    onChapterOpen();
  };

  const handleEditClick = (chapter) => {
    setEditingChapter(chapter);
    setEditChapterFormData({
      name: chapter.name,
      description: chapter.description || "",
    });
    setImagePreview(chapter.image_url || null);
    onEditOpen();
  };

  const handleDeleteClick = (chapter) => {
    setDeleteTarget({ type: "chapter", item: chapter });
    onDeleteOpen();
  };

  const toggleBook = (bookId) => {
    setExpandedBookId((prev) => (prev === bookId ? null : bookId));
  };

  const filteredBooks = books.filter((book) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    if (book.name?.toLowerCase().includes(term)) return true;
    if (book.description?.toLowerCase().includes(term)) return true;
    return (book.chapters || []).some(
      (chapter) =>
        chapter.name?.toLowerCase().includes(term) ||
        chapter.description?.toLowerCase().includes(term) ||
        (chapter.lessons || []).some((lesson) =>
          lesson.name?.toLowerCase().includes(term),
        ),
    );
  });

  const subjectStats = getSubjectTreeStats(books);

  if (loading) {
    return (
      <Box minH="100vh" bg="#f5f7fb" className="mt-[80px]" dir="rtl">
        <Flex justify="center" align="center" minH="70vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text color="gray.500">جاري تحميل بيانات المادة...</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  if (error || !subjectData) {
    return (
      <Box minH="100vh" bg="#f5f7fb" className="mt-[80px]" dir="rtl" px={4}>
        <Flex justify="center" align="center" minH="70vh">
          <Box maxW="420px" w="full" textAlign="center" p={8} bg="white" borderRadius="2xl" border="1px solid" borderColor="gray.100" boxShadow="0 16px 40px rgba(15,23,42,0.06)">
            <Text color="red.500" fontWeight="bold" mb={2}>{error ? "تعذّر تحميل المادة" : "المادة غير موجودة"}</Text>
            <Text color="gray.500" fontSize="sm">{error || "تحقق من الرابط أو صلاحياتك."}</Text>
          </Box>
        </Flex>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="#f5f7fb" position="relative" dir="rtl" pb={{ base: 24, md: 10 }} className="mt-[80px]">
      <Box maxW="1180px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 8 }}>
        <Flex justify="flex-end" align="center" mb={4} color="gray.500" fontSize="xs" gap={2}>
          <Text>بنوك الأسئلة</Text>
          <Text>/</Text>
          <Text color="blue.500" fontWeight="bold">{subjectData.name}</Text>
        </Flex>

        <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "stretch", md: "center" }} gap={4} mb={5}>
          <Box>
            <Heading size={{ base: "md", md: "lg" }} color="gray.900" fontWeight="black">
              مادة: {subjectData.name}
            </Heading>
            <Text color="gray.500" fontSize="sm" mt={1}>
              {subjectData.question_bank_name} · {subjectData.grade_name}
            </Text>
          </Box>
          <HStack spacing={3} flexWrap="wrap">
            <Button leftIcon={<FaGraduationCap />} bg="orange.500" color="white" onClick={handlePermissionOpen} h="42px" px={5} borderRadius="lg" fontWeight="bold" _hover={{ bg: "orange.600" }}>
              إعطاء صلاحية
            </Button>
            <Button leftIcon={<FaPlus />} bg="blue.500" color="white" onClick={onOpen} h="42px" px={5} borderRadius="lg" fontWeight="bold" _hover={{ bg: "blue.600" }}>
              إضافة كتاب
            </Button>
          </HStack>
        </Flex>

        <Box bg="#dcecff" borderRadius="2xl" p={{ base: 5, md: 6 }} mb={5}>
          <Flex direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "center" }} justify="space-between" gap={4}>
            <Box>
              <Heading size="md" color="gray.900" mb={2}>{subjectData.name}</Heading>
              <Text color="gray.600" fontSize="sm" lineHeight="1.8">
                {subjectData.description?.trim() || "ابدأ بإنشاء كتاب، ثم أضف فصوله ودروسه. الأسئلة تُربط بكل درس داخل كتاب محدد."}
              </Text>
            </Box>
            <Badge bg="white" color="blue.600" px={4} py={2} borderRadius="xl" fontWeight="black">
              {subjectStats.books} كتاب · {subjectStats.chapters} فصل · {subjectStats.lessons} درس
            </Badge>
          </Flex>
        </Box>

        {books.length === 0 ? (
          <Box
          mb={5}
          p={4}
          bg="orange.50"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="orange.200"
        >
          <Text fontSize="sm" color="orange.800" fontWeight="semibold" mb={1}>
            لا يوجد كتاب بعد
          </Text>
          <Text fontSize="sm" color="orange.700" lineHeight="1.7">
            يجب إنشاء كتاب أولاً قبل إضافة الفصول. كل كتاب له فصول ودروس مستقلة، والأسئلة تُربط بدرس داخل كتاب محدد.
          </Text>
        </Box>
        ) : null}

        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={5}>
          {[
            { label: "الكتب", value: subjectStats.books, color: "orange" },
            { label: "الفصول", value: subjectStats.chapters, color: "blue" },
            { label: "الدروس", value: subjectStats.lessons, color: "orange" },
            { label: "الأسئلة", value: subjectStats.questions, color: "blue" },
          ].map((item) => (
            <Box key={item.label} bg="white" borderRadius="xl" p={4} border="1px solid" borderColor="gray.100" boxShadow="0 10px 28px rgba(15,23,42,0.04)">
              <Text color="gray.500" fontSize="xs" mb={1}>{item.label}</Text>
              <Text fontSize="2xl" fontWeight="black" color={`${item.color}.500`}>{item.value}</Text>
            </Box>
          ))}
        </SimpleGrid>

        <Flex direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "center" }} justify="space-between" gap={3} mb={5}>
          <InputGroup maxW={{ base: "full", md: "400px" }}>
            <InputLeftElement pointerEvents="none" h="full">
              <Icon as={FaSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="ابحث في الكتب، الفصول، أو الدروس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              h="46px"
              bg="white"
              borderColor="gray.200"
              borderRadius="xl"
              boxShadow="0 10px 30px rgba(15,23,42,0.04)"
              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 3px rgba(49,130,206,0.12)" }}
            />
          </InputGroup>
          <Text color="gray.500" fontSize="sm" fontWeight="bold">
            {filteredBooks.length} كتاب
          </Text>
        </Flex>

        <Box>
        <SubjectBooksShelf
          filteredBooks={filteredBooks}
          searchTerm={searchTerm}
          expandedBookId={expandedBookId}
          toggleBook={toggleBook}
          getBookStats={getBookStats}
          getChapterStats={getChapterStats}
          onAddBook={onOpen}
          onBookEdit={handleBookEditClick}
          onBookDelete={handleBookDeleteClick}
          onChapterCreate={handleChapterCreateClick}
          onChapterEdit={handleEditClick}
          onChapterDelete={handleDeleteClick}
        />
      </Box>

      {/* Add Book Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent bg={modalBg} borderRadius="20px" border="2px solid" borderColor={modalBorder}>
          <ModalHeader bg={modalHeaderBg} color="white" borderRadius="18px 18px 0 0" py={4}>
            <HStack>
              <Box w="40px" h="40px" bg="white" borderRadius="10px" display="flex" alignItems="center" justifyContent="center">
                <FaBookOpen color="#4299e1" size={18} />
              </Box>
              <Text fontSize="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">إضافة كتاب جديد</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: buttonPrimaryHover }} />
          
          <ModalBody>
            <form onSubmit={handleBookSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel color={textPrimary} fontWeight="bold">اسم الكتاب</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="مثال: كتاب الامتحان"
                    size="lg"
                    border="2px solid"
                    borderColor={inputBorder}
                    borderRadius="10px"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="bold">وصف الكتاب (اختياري)</FormLabel>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="أدخل وصف الكتاب"
                    rows={4}
                    size="lg"
                    border="2px solid"
                    borderColor={inputBorder}
                    borderRadius="10px"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="bold">ترتيب العرض</FormLabel>
                  <Input
                    name="order_num"
                    type="number"
                    min={1}
                    value={formData.order_num}
                    onChange={handleInputChange}
                    size="lg"
                    border="2px solid"
                    borderColor={inputBorder}
                    borderRadius="10px"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="bold">صورة الغلاف (اختياري)</FormLabel>
                  <VStack spacing={4} align="stretch">
                    {!imagePreview ? (
                      <Button as="label" htmlFor="book-image-upload" leftIcon={<FaUpload />} variant="outline" size="lg" cursor="pointer">
                        اختر صورة
                      </Button>
                    ) : (
                      <Box position="relative" display="inline-block">
                        <Image src={imagePreview} alt="معاينة الصورة" maxH="200px" borderRadius="md" />
                        <IconButton icon={<FaTimes />} position="absolute" top={2} right={2} colorScheme="red" size="sm" onClick={removeImage} aria-label="إزالة الصورة" />
                      </Box>
                    )}
                    <Input id="book-image-upload" type="file" accept="image/*" onChange={handleImageChange} display="none" />
                  </VStack>
                </FormControl>
              </VStack>
            </form>
          </ModalBody>

          <ModalFooter bg={modalFooterBg} borderRadius="0 0 18px 18px" py={4}>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={resetForm}>إعادة تعيين</Button>
              <Button variant="ghost" onClick={onClose}>إلغاء</Button>
              <Button bg={buttonPrimary} color="white" onClick={handleBookSubmit} isLoading={submitLoading} leftIcon={<FaPlus />}>
                إضافة الكتاب
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Chapter Modal */}
      <Modal isOpen={isChapterOpen} onClose={onChapterClose} size="xl">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent bg={modalBg} borderRadius="20px" border="2px solid" borderColor={modalBorder}>
          <ModalHeader bg={modalHeaderBg} color="white" borderRadius="18px 18px 0 0" py={4}>
            <HStack>
              <Box
                w="40px"
                h="40px"
                bg="white"
                borderRadius="10px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <FaPlus color="#4299e1" size={18} />
              </Box>
              <Text fontSize="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">إضافة فصل جديد</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: buttonPrimaryHover }} />
          
          <ModalBody>
            <form onSubmit={handleChapterSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">اسم الفصل</FormLabel>
                  <Input
                    name="name"
                    value={chapterFormData.name}
                    onChange={handleChapterInputChange}
                    placeholder="أدخل اسم الفصل"
                    size="lg"
                    border="2px solid"
                    borderColor={inputBorder}
                    _hover={{ borderColor: inputHoverBorder }}
                    _focus={{ borderColor: inputFocusBorder, boxShadow: `0 0 0 1px ${useColorModeValue("#4299e1", "#63b3ed")}` }}
                    borderRadius="10px"
                    bg={useColorModeValue("white", "gray.700")}
                    fontFamily="'Cairo', 'Tajawal', sans-serif"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">وصف الفصل (اختياري)</FormLabel>
                  <Textarea
                    name="description"
                    value={chapterFormData.description}
                    onChange={handleChapterInputChange}
                    placeholder="أدخل وصف الفصل"
                    rows={4}
                    size="lg"
                    border="2px solid"
                    borderColor={inputBorder}
                    _hover={{ borderColor: inputHoverBorder }}
                    _focus={{ borderColor: inputFocusBorder, boxShadow: `0 0 0 1px ${useColorModeValue("#4299e1", "#63b3ed")}` }}
                    borderRadius="10px"
                    bg={useColorModeValue("white", "gray.700")}
                    fontFamily="'Cairo', 'Tajawal', sans-serif"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">صورة الفصل (اختياري)</FormLabel>
                  <VStack spacing={4} align="stretch">
                    {!imagePreview ? (
                      <Button
                        as="label"
                        htmlFor="chapter-image-upload"
                        leftIcon={<FaUpload />}
                        variant="outline"
                        size="lg"
                        cursor="pointer"
                        border="2px solid"
                        borderColor={inputHoverBorder}
                        color={useColorModeValue("blue.500", "blue.400")}
                        _hover={{ bg: iconBg, borderColor: inputFocusBorder }}
                        borderRadius="10px"
                        fontWeight="bold"
                        fontFamily="'Cairo', 'Tajawal', sans-serif"
                      >
                        اختر صورة
                      </Button>
                    ) : (
                      <Box position="relative" display="inline-block">
                        <Image
                          src={imagePreview}
                          alt="معاينة الصورة"
                          maxH="200px"
                          borderRadius="md"
                        />
                        <IconButton
                          icon={<FaTimes />}
                          position="absolute"
                          top={2}
                          right={2}
                          colorScheme="red"
                          size="sm"
                          onClick={removeImage}
                          aria-label="إزالة الصورة"
                        />
                      </Box>
                    )}
                    <Input
                      id="chapter-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      display="none"
                    />
                  </VStack>
                </FormControl>
              </VStack>
            </form>
          </ModalBody>

          <ModalFooter bg={modalFooterBg} borderRadius="0 0 18px 18px" py={4}>
            <HStack spacing={3}>
              <Button 
                variant="ghost" 
                onClick={resetChapterForm}
                color={textPrimary}
                _hover={{ bg: iconBg }}
                fontWeight="bold"
                fontFamily="'Cairo', 'Tajawal', sans-serif"
              >
                إعادة تعيين
              </Button>
              <Button 
                variant="ghost" 
                onClick={onChapterClose}
                color={textPrimary}
                _hover={{ bg: iconBg }}
                fontWeight="bold"
                fontFamily="'Cairo', 'Tajawal', sans-serif"
              >
                إلغاء
              </Button>
              <Button
                bg={buttonPrimary}
                color="white"
                onClick={handleChapterSubmit}
                isLoading={submitLoading}
                loadingText="جاري الإنشاء..."
                leftIcon={<FaPlus />}
                _hover={{ bg: buttonPrimaryHover, transform: "translateY(-2px)" }}
                boxShadow={useColorModeValue("0 4px 15px rgba(66, 153, 225, 0.35)", "0 4px 15px rgba(0, 0, 0, 0.4)")}
                borderRadius="10px"
                fontWeight="bold"
                fontFamily="'Cairo', 'Tajawal', sans-serif"
                transition="all 0.2s"
              >
                إضافة الفصل
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Chapter Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent bg={modalBg} borderRadius="20px" border="2px solid" borderColor={modalBorder}>
          <ModalHeader bg={buttonSecondary} color="white" borderRadius="18px 18px 0 0" py={4}>
            <HStack>
              <Box
                w="40px"
                h="40px"
                bg="white"
                borderRadius="10px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <FaEdit color="#4299e1" size={18} />
              </Box>
              <Text fontSize="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">تعديل الفصل</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: buttonSecondaryHover }} />
          
          <ModalBody>
            <form onSubmit={handleEditSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">اسم الفصل</FormLabel>
                  <Input
                    name="name"
                    value={editChapterFormData.name}
                    onChange={handleEditChapterInputChange}
                    placeholder="أدخل اسم الفصل"
                    size="lg"
                    border="2px solid"
                    borderColor={inputBorder}
                    _hover={{ borderColor: inputHoverBorder }}
                    _focus={{ borderColor: inputFocusBorder, boxShadow: `0 0 0 1px ${useColorModeValue("#4299e1", "#63b3ed")}` }}
                    borderRadius="10px"
                    bg={useColorModeValue("white", "gray.700")}
                    fontFamily="'Cairo', 'Tajawal', sans-serif"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">وصف الفصل (اختياري)</FormLabel>
                  <Textarea
                    name="description"
                    value={editChapterFormData.description}
                    onChange={handleEditChapterInputChange}
                    placeholder="أدخل وصف الفصل"
                    rows={4}
                    size="lg"
                    border="2px solid"
                    borderColor={inputBorder}
                    _hover={{ borderColor: inputHoverBorder }}
                    _focus={{ borderColor: inputFocusBorder, boxShadow: `0 0 0 1px ${useColorModeValue("#4299e1", "#63b3ed")}` }}
                    borderRadius="10px"
                    bg={useColorModeValue("white", "gray.700")}
                    fontFamily="'Cairo', 'Tajawal', sans-serif"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">صورة الفصل (اختياري)</FormLabel>
                  <VStack spacing={4} align="stretch">
                    {!imagePreview ? (
                      <Button
                        as="label"
                        htmlFor="edit-image-upload"
                        leftIcon={<FaUpload />}
                        variant="outline"
                        size="lg"
                        cursor="pointer"
                        border="2px solid"
                        borderColor={inputHoverBorder}
                        color={useColorModeValue("blue.500", "blue.400")}
                        _hover={{ bg: iconBg, borderColor: inputFocusBorder }}
                        borderRadius="10px"
                        fontWeight="bold"
                        fontFamily="'Cairo', 'Tajawal', sans-serif"
                      >
                        اختر صورة
                      </Button>
                    ) : (
                      <Box position="relative" display="inline-block">
                        <Image
                          src={imagePreview}
                          alt="معاينة الصورة"
                          maxH="200px"
                          borderRadius="md"
                        />
                        <IconButton
                          icon={<FaTimes />}
                          position="absolute"
                          top={2}
                          right={2}
                          colorScheme="red"
                          size="sm"
                          onClick={removeImage}
                          aria-label="إزالة الصورة"
                        />
                      </Box>
                    )}
                    <Input
                      id="edit-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      display="none"
                    />
                  </VStack>
                </FormControl>
              </VStack>
            </form>
          </ModalBody>

          <ModalFooter bg={modalFooterBg} borderRadius="0 0 18px 18px" py={4}>
            <HStack spacing={3}>
              <Button 
                variant="ghost" 
                onClick={resetEditChapterForm}
                color={textPrimary}
                _hover={{ bg: iconBg }}
                fontWeight="bold"
                fontFamily="'Cairo', 'Tajawal', sans-serif"
              >
                إعادة تعيين
              </Button>
              <Button 
                variant="ghost" 
                onClick={onEditClose}
                color={textPrimary}
                _hover={{ bg: iconBg }}
                fontWeight="bold"
                fontFamily="'Cairo', 'Tajawal', sans-serif"
              >
                إلغاء
              </Button>
              <Button
                bg={buttonSecondary}
                color="white"
                onClick={handleEditSubmit}
                isLoading={editLoading}
                loadingText="جاري التحديث..."
                leftIcon={<FaEdit />}
                _hover={{ bg: buttonSecondaryHover, transform: "translateY(-2px)" }}
                boxShadow={useColorModeValue("0 4px 15px rgba(66, 153, 225, 0.35)", "0 4px 15px rgba(0, 0, 0, 0.4)")}
                borderRadius="10px"
                fontWeight="bold"
                fontFamily="'Cairo', 'Tajawal', sans-serif"
                transition="all 0.2s"
              >
                تحديث الفصل
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Book Modal */}
      <Modal isOpen={isBookEditOpen} onClose={onBookEditClose} size="xl">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent bg={modalBg} borderRadius="20px" border="2px solid" borderColor={modalBorder}>
          <ModalHeader bg="orange.500" color="white" borderRadius="18px 18px 0 0" py={4}>
            <HStack>
              <Box w="40px" h="40px" bg="white" borderRadius="10px" display="flex" alignItems="center" justifyContent="center">
                <FaBookOpen color="#ed8936" size={18} />
              </Box>
              <Text fontSize="xl" fontWeight="bold">تعديل الكتاب</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>اسم الكتاب</FormLabel>
                <Input name="name" value={editFormData.name} onChange={handleEditInputChange} />
              </FormControl>
              <FormControl>
                <FormLabel>الوصف</FormLabel>
                <Textarea name="description" value={editFormData.description} onChange={handleEditInputChange} rows={3} />
              </FormControl>
              <FormControl>
                <FormLabel>ترتيب العرض</FormLabel>
                <Input name="order_num" type="number" min={1} value={editFormData.order_num} onChange={handleEditInputChange} />
              </FormControl>
              <FormControl>
                <FormLabel>صورة الغلاف</FormLabel>
                {!imagePreview ? (
                  <Button as="label" htmlFor="edit-book-image-upload" leftIcon={<FaUpload />} variant="outline" w="full" cursor="pointer">
                    اختر صورة
                  </Button>
                ) : (
                  <Box position="relative">
                    <Image src={imagePreview} alt="معاينة" maxH="200px" w="full" objectFit="cover" borderRadius="md" />
                    <IconButton icon={<FaTimes />} position="absolute" top={2} right={2} colorScheme="red" size="sm" onClick={removeImage} aria-label="إزالة الصورة" />
                  </Box>
                )}
                <Input id="edit-book-image-upload" type="file" accept="image/*" onChange={handleImageChange} display="none" />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onBookEditClose}>إلغاء</Button>
            <Button bg="orange.500" color="white" onClick={handleBookEditSubmit} isLoading={editLoading} leftIcon={<FaEdit />}>
              تحديث الكتاب
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="md">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent bg={modalBg} borderRadius="20px" border="2px solid" borderColor={modalBorder}>
          <ModalHeader bg={useColorModeValue("blue.300", "blue.600")} color="white" borderRadius="18px 18px 0 0" py={4}>
            <HStack>
              <Box
                w="40px"
                h="40px"
                bg="white"
                borderRadius="10px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <FaTrash color="#4299e1" size={18} />
              </Box>
              <Text fontSize="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">تأكيد الحذف</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: useColorModeValue("blue.400", "blue.700") }} />
          
          <ModalBody py={8}>
            <VStack spacing={4} align="stretch">
              <Box textAlign="center">
                <Box
                  w="80px"
                  h="80px"
                  bg={iconBg}
                  borderRadius="50%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mx="auto"
                  mb={4}
                  border="3px solid"
                  borderColor={iconBorder}
                >
                  <FaBookOpen size={40} color={useColorModeValue("#4299e1", "#63b3ed")} />
                </Box>
                <Text 
                  fontSize="lg" 
                  fontWeight="800" 
                  color={textPrimary}
                  fontFamily="'Cairo', 'Tajawal', sans-serif"
                  mb={2}
                >
                  {deleteTarget?.type === "book"
                    ? "هل أنت متأكد من حذف الكتاب؟"
                    : "هل أنت متأكد من حذف الفصل؟"}
                </Text>
                <Text 
                  mt={2} 
                  color={useColorModeValue("blue.500", "blue.400")} 
                  fontWeight="600"
                  fontSize="md"
                  fontFamily="'Cairo', 'Tajawal', sans-serif"
                >
                  "{deleteTarget?.item?.name}"
                </Text>
                <Text 
                  mt={3} 
                  color={useColorModeValue("blue.400", "blue.500")} 
                  fontSize="sm" 
                  fontWeight="medium"
                  fontFamily="'Cairo', 'Tajawal', sans-serif"
                >
                  {deleteTarget?.type === "book"
                    ? "سيتم حذف الكتاب وجميع فصوله. هذا الإجراء لا يمكن التراجع عنه."
                    : "هذا الإجراء لا يمكن التراجع عنه"}
                </Text>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter bg={modalFooterBg} borderRadius="0 0 18px 18px" py={4}>
            <HStack spacing={3}>
              <Button 
                variant="ghost" 
                onClick={onDeleteClose}
                color={textPrimary}
                _hover={{ bg: iconBg }}
                fontWeight="bold"
                fontFamily="'Cairo', 'Tajawal', sans-serif"
              >
                إلغاء
              </Button>
              <Button
                bg={useColorModeValue("blue.300", "blue.600")}
                color="white"
                onClick={onDeleteConfirm}
                isLoading={deleteLoading}
                loadingText="جاري الحذف..."
                leftIcon={<FaTrash />}
                _hover={{ bg: useColorModeValue("blue.400", "blue.700"), transform: "translateY(-2px)" }}
                boxShadow={useColorModeValue("0 4px 15px rgba(66, 153, 225, 0.35)", "0 4px 15px rgba(0, 0, 0, 0.4)")}
                borderRadius="10px"
                fontWeight="bold"
                fontFamily="'Cairo', 'Tajawal', sans-serif"
                transition="all 0.2s"
              >
                {deleteTarget?.type === "book" ? "حذف الكتاب" : "حذف الفصل"}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Grant Permission Modal */}
      <Modal isOpen={isPermissionOpen} onClose={onPermissionClose} size="xl">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent bg={modalBg} borderRadius="20px" border="2px solid" borderColor={modalBorder}>
          <ModalHeader bg={buttonSecondary} color="white" borderRadius="18px 18px 0 0" py={4}>
            <HStack>
              <Box
                w="40px"
                h="40px"
                bg="white"
                borderRadius="10px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <FaGraduationCap color="#4299e1" size={18} />
              </Box>
              <Text fontSize="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">منح صلاحية للمدرس</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: buttonSecondaryHover }} />
          
          <ModalBody>
            <VStack spacing={6}>
              <Box 
                textAlign="center" 
                p={6} 
                bg={iconBg} 
                borderRadius="15px"
                border="2px solid"
                borderColor={iconBorder}
              >
                <Text 
                  fontSize="md" 
                  color={textPrimary} 
                  fontWeight="700"
                  fontFamily="'Cairo', 'Tajawal', sans-serif"
                  mb={2}
                >
                  منح صلاحية الوصول للمادة: {subjectData?.name}
                </Text>
                <Text 
                  fontSize="sm" 
                  color={useColorModeValue("blue.500", "blue.400")} 
                  fontWeight="600"
                  fontFamily="'Cairo', 'Tajawal', sans-serif"
                >
                  اختر المدرس الذي تريد منحه صلاحية الوصول لهذه المادة
                </Text>
              </Box>

              <FormControl isRequired>
                <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">اختر المدرس</FormLabel>
                {teachersLoading ? (
                  <Box textAlign="center" py={8}>
                    <Spinner size="lg" color={spinnerColor} />
                    <Text 
                      mt={2} 
                      color={useColorModeValue("blue.500", "blue.400")}
                      fontWeight="600"
                      fontFamily="'Cairo', 'Tajawal', sans-serif"
                    >
                      جاري تحميل المدرسين...
                    </Text>
                  </Box>
                ) : (
                  <Select
                    placeholder="اختر المدرس"
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    size="lg"
                    border="2px solid"
                    borderColor={inputBorder}
                    _hover={{ borderColor: inputHoverBorder }}
                    _focus={{ borderColor: inputFocusBorder, boxShadow: `0 0 0 1px ${useColorModeValue("#4299e1", "#63b3ed")}` }}
                    borderRadius="10px"
                    bg={useColorModeValue("white", "gray.700")}
                    fontFamily="'Cairo', 'Tajawal', sans-serif"
                  >
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name} - {teacher.subject} ({teacher.email})
                      </option>
                    ))}
                  </Select>
                )}
              </FormControl>

              {selectedTeacher && (
                <Box 
                  p={6} 
                  bg={iconBg} 
                  borderRadius="15px" 
                  w="full"
                  border="2px solid"
                  borderColor={iconBorder}
                >
                  <Text 
                    fontSize="md" 
                    color={textPrimary} 
                    fontWeight="700" 
                    mb={4}
                    fontFamily="'Cairo', 'Tajawal', sans-serif"
                  >
                    معلومات المدرس المختار:
                  </Text>
                  {(() => {
                    const teacher = teachers.find(t => t.id === parseInt(selectedTeacher));
                    if (!teacher) return null;
                    
                    return (
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between" p={3} bg={useColorModeValue("white", "gray.700")} borderRadius="10px">
                          <Text fontSize="sm" color={textSecondary} fontWeight="600" fontFamily="'Cairo', 'Tajawal', sans-serif">الاسم:</Text>
                          <Text fontSize="sm" color={textPrimary} fontWeight="700" fontFamily="'Cairo', 'Tajawal', sans-serif">{teacher.name}</Text>
                        </HStack>
                        <HStack justify="space-between" p={3} bg={useColorModeValue("white", "gray.700")} borderRadius="10px">
                          <Text fontSize="sm" color={textSecondary} fontWeight="600" fontFamily="'Cairo', 'Tajawal', sans-serif">التخصص:</Text>
                          <Text fontSize="sm" color={textPrimary} fontWeight="700" fontFamily="'Cairo', 'Tajawal', sans-serif">{teacher.subject}</Text>
                        </HStack>
                        <HStack justify="space-between" p={3} bg={useColorModeValue("white", "gray.700")} borderRadius="10px">
                          <Text fontSize="sm" color={textSecondary} fontWeight="600" fontFamily="'Cairo', 'Tajawal', sans-serif">البريد الإلكتروني:</Text>
                          <Text fontSize="sm" color={textPrimary} fontWeight="700" fontFamily="'Cairo', 'Tajawal', sans-serif">{teacher.email}</Text>
                        </HStack>
                        <HStack justify="space-between" p={3} bg={useColorModeValue("white", "gray.700")} borderRadius="10px">
                          <Text fontSize="sm" color={textSecondary} fontWeight="600" fontFamily="'Cairo', 'Tajawal', sans-serif">عدد الطلاب:</Text>
                          <Text fontSize="sm" color={textPrimary} fontWeight="700" fontFamily="'Cairo', 'Tajawal', sans-serif">{teacher.students_count}</Text>
                        </HStack>
                        <HStack justify="space-between" p={3} bg={useColorModeValue("white", "gray.700")} borderRadius="10px">
                          <Text fontSize="sm" color={textSecondary} fontWeight="600" fontFamily="'Cairo', 'Tajawal', sans-serif">عدد الدورات:</Text>
                          <Text fontSize="sm" color={textPrimary} fontWeight="700" fontFamily="'Cairo', 'Tajawal', sans-serif">{teacher.courses_count}</Text>
                        </HStack>
                      </VStack>
                    );
                  })()}
                </Box>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter bg={modalFooterBg} borderRadius="0 0 18px 18px" py={4}>
            <HStack spacing={3}>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedTeacher("")}
                color={textPrimary}
                _hover={{ bg: iconBg }}
                fontWeight="bold"
                fontFamily="'Cairo', 'Tajawal', sans-serif"
              >
                إعادة تعيين
              </Button>
              <Button 
                variant="ghost" 
                onClick={onPermissionClose}
                color={textPrimary}
                _hover={{ bg: iconBg }}
                fontWeight="bold"
                fontFamily="'Cairo', 'Tajawal', sans-serif"
              >
                إلغاء
              </Button>
              <Button
                bg={buttonSecondary}
                color="white"
                onClick={handlePermissionSubmit}
                isLoading={permissionLoading}
                loadingText="جاري منح الصلاحية..."
                leftIcon={<FaGraduationCap />}
                isDisabled={!selectedTeacher}
                _hover={{ bg: buttonSecondaryHover, transform: "translateY(-2px)" }}
                _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                boxShadow={useColorModeValue("0 4px 15px rgba(66, 153, 225, 0.35)", "0 4px 15px rgba(0, 0, 0, 0.4)")}
                borderRadius="10px"
                fontWeight="bold"
                fontFamily="'Cairo', 'Tajawal', sans-serif"
                transition="all 0.2s"
              >
                منح الصلاحية
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      <ScrollToTop/>
      </Box>
    </Box>
  );
};

export default SubjectPage;