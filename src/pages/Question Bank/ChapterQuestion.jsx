import React, { useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
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
  Divider,
} from "@chakra-ui/react";
import {
  FaBook,
  FaGraduationCap,
  FaQuestionCircle,
  FaClock,
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaUpload,
  FaTimes,
  FaPlay,
} from "react-icons/fa";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import {
  createChapterLesson,
  deleteLesson as deleteLessonApi,
  toastQuestionBankResult,
  updateLesson as updateLessonApi,
} from "../../api/questionBankApi";
import {
  useInvalidateTeacherQuestionBank,
  useTeacherQbChapter,
} from "../../Hooks/teacher/useTeacherQuestionBankQueries";

const MotionBox = motion(Box);
const MotionCard = motion(Card);
const MotionButton = motion(Button);

const ChapterQuestion = () => {
  const { id } = useParams();
  const toast = useToast();
  const invalidateQb = useInvalidateTeacherQuestionBank();
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: chapterPayload,
    isLoading: loading,
    error: chapterQueryError,
    refetch: fetchChapterData,
  } = useTeacherQbChapter(id);

  const chapterData = chapterPayload?.chapter || chapterPayload || null;
  const lessons = chapterPayload?.lessons || [];
  const error =
    chapterQueryError?.response?.data?.message ||
    chapterQueryError?.message ||
    null;

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Edit states
  const [editingLesson, setEditingLesson] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: ''
  });
  
  // Loading states
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [deletingLesson, setDeletingLesson] = useState(null);

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

  const refreshChapterData = async () => {
    await Promise.all([
      invalidateQb.invalidateChapter(id),
      invalidateQb.invalidateSubjects(),
    ]);
    return fetchChapterData();
  };

  // Create new lesson
  const createLesson = async (formData) => {
    try {
      setSubmitLoading(true);
      
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

      const submitFormData = new FormData();
      submitFormData.append("name", formData.name);
      submitFormData.append("description", formData.description);
      
      if (selectedImage) {
        submitFormData.append("image", selectedImage);
      }

      const result = await createChapterLesson(id, submitFormData);
      toastQuestionBankResult(result, toast, "تم إنشاء الدرس بنجاح");
      return { success: true, data: result.data };
    } catch (error) {
      console.error("Error creating lesson:", error);
      
      const errorMessage = error.response?.data?.message || "حدث خطأ في إنشاء الدرس";
      toast({
        title: "خطأ",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return { success: false, error: errorMessage };
    } finally {
      setSubmitLoading(false);
    }
  };

  // Update lesson
  const updateLesson = async (formData) => {
    try {
      setEditLoading(true);
      
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

      const submitFormData = new FormData();
      submitFormData.append("name", formData.name);
      submitFormData.append("description", formData.description);
      
      if (selectedImage) {
        submitFormData.append("image", selectedImage);
      }

      const result = await updateLessonApi(editingLesson.id, submitFormData);
      toastQuestionBankResult(result, toast, "تم تحديث الدرس بنجاح");
      return { success: true, data: result.data };
    } catch (error) {
      console.error("Error updating lesson:", error);
      
      const errorMessage = error.response?.data?.message || "حدث خطأ في تحديث الدرس";
      toast({
        title: "خطأ",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return { success: false, error: errorMessage };
    } finally {
      setEditLoading(false);
    }
  };

  // Delete lesson
  const deleteLesson = async () => {
    try {
      setDeleteLoading(true);
      
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

      const result = await deleteLessonApi(deletingLesson.id);
      toastQuestionBankResult(result, toast, "تم حذف الدرس بنجاح");
      return { success: true, data: result.data };
    } catch (error) {
      console.error("Error deleting lesson:", error);
      
      const errorMessage = error.response?.data?.message || "حدث خطأ في حذف الدرس";
      toast({
        title: "خطأ",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return { success: false, error: errorMessage };
    } finally {
      setDeleteLoading(false);
    }
  };

  // (chapter data cached via React Query)

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle edit form input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب ملء اسم الدرس",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const result = await createLesson(formData);
    
    if (result.success) {
      onClose();
      resetForm();
      refreshChapterData(); // Refresh data
    }
  };

  // Handle edit submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editFormData.name) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب ملء اسم الدرس",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const result = await updateLesson(editFormData);
    
    if (result.success) {
      onEditClose();
      resetEditForm();
      refreshChapterData(); // Refresh data
    }
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    const result = await deleteLesson();
    
    if (result.success) {
      onDeleteClose();
      setDeletingLesson(null);
      refreshChapterData(); // Refresh data
    }
  };

  // Reset forms
  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setSelectedImage(null);
    setImagePreview(null);
  };

  const resetEditForm = () => {
    setEditFormData({ name: '', description: '' });
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Handle edit button click
  const handleEditClick = (lesson) => {
    setEditingLesson(lesson);
    setEditFormData({
      name: lesson.name,
      description: lesson.description || ''
    });
    setImagePreview(lesson.image_url);
    onEditOpen();
  };

  // Handle delete button click
  const handleDeleteClick = (lesson) => {
    setDeletingLesson(lesson);
    onDeleteOpen();
  };

  // Filter lessons based on search
  const filteredLessons = lessons.filter(lesson =>
    lesson.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lesson.description && lesson.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <Box p={{ base: 4, md: 8 }} className="mt-[80px]" maxW="1200px" mx="auto" bg={pageBg} minH="100vh">
        <Flex justify="center" align="center" minH="80vh">
          <VStack spacing={4}>
            <Spinner size="xl" color={spinnerColor} />
            <Text 
              color={useColorModeValue("blue.500", "blue.400")}
              fontWeight="600"
              fontFamily="'Cairo', 'Tajawal', sans-serif"
            >
              جاري تحميل بيانات الفصل...
            </Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={{ base: 4, md: 8 }} className="mt-[80px]" maxW="1200px" mx="auto" bg={bgColor} minH="100vh">
        <Flex justify="center" align="center" minH="80vh">
          <Box textAlign="center" p={6} bg="red.50" borderRadius="lg">
            <Text color="red.600">خطأ في تحميل البيانات: {error}</Text>
          </Box>
        </Flex>
      </Box>
    );
  }

  if (!chapterData) {
    return (
      <Box p={{ base: 4, md: 8 }} className="mt-[80px]" maxW="1200px" mx="auto" bg={bgColor} minH="100vh">
        <Flex justify="center" align="center" minH="80vh">
          <Box textAlign="center" p={6} bg="red.50" borderRadius="lg">
            <Text color="red.600">لم يتم العثور على الفصل</Text>
          </Box>
        </Flex>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={pageBg} position="relative">
      {/* Background Pattern */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={useColorModeValue(0.05, 0.1)}
        backgroundImage={useColorModeValue(
          "radial-gradient(circle at 25px 25px, blue.500 2px, transparent 0), radial-gradient(circle at 75px 75px, blue.500 2px, transparent 0)",
          "radial-gradient(circle at 25px 25px, blue.400 2px, transparent 0), radial-gradient(circle at 75px 75px, blue.400 2px, transparent 0)"
        )}
        backgroundSize="100px 100px"
      />
      
      {/* Header */}
      <Box
        bg={headerBg}
        borderBottom="3px solid"
        borderColor={useColorModeValue("blue.500", "blue.400")}
        boxShadow={useColorModeValue("0 4px 20px rgba(66, 153, 225, 0.15)", "0 4px 20px rgba(0, 0, 0, 0.3)")}
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Box maxW="1200px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 4, md: 6 }}>
          <Flex
            direction={{ base: "column", md: "row" }}
            align="center"
            justify="space-between"
            gap={6}
          >
            <Flex align="center" gap={4}>
              <Box
                w="70px"
                h="70px"
                bg={buttonPrimary}
                borderRadius="20px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow={useColorModeValue("0 8px 25px rgba(66, 153, 225, 0.4)", "0 8px 25px rgba(0, 0, 0, 0.4)")}
                transition="all 0.3s"
                _hover={{
                  transform: "rotate(5deg) scale(1.05)",
                  boxShadow: useColorModeValue("0 12px 35px rgba(66, 153, 225, 0.5)", "0 12px 35px rgba(0, 0, 0, 0.5)")
                }}
              >
                <Icon as={FaGraduationCap} color="white" boxSize={7} />
              </Box>
              <Box>
                <Heading 
                  size={{ base: "lg", md: "xl" }} 
                  color={textPrimary}
                  fontWeight="800"
                  fontFamily="'Cairo', 'Tajawal', sans-serif"
                  letterSpacing="-0.02em"
                >
                  {chapterData.name}
                </Heading>
                <Text 
                  color={textSecondary} 
                  fontSize="md" 
                  mt={1} 
                  fontWeight="600"
                  fontFamily="'Cairo', 'Tajawal', sans-serif"
                >
                  {lessons.length} درس - {chapterData.description}
                </Text>
              </Box>
            </Flex>

            <MotionButton
              leftIcon={<FaPlus />}
              bg={buttonPrimary}
              color="white"
              onClick={onOpen}
              size={{ base: "md", md: "lg" }}
              borderRadius="15px"
              boxShadow={useColorModeValue("0 8px 25px rgba(66, 153, 225, 0.4)", "0 8px 25px rgba(0, 0, 0, 0.4)")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              px={10}
              py={7}
              fontWeight="800"
              fontSize={{ base: "md", md: "lg" }}
              fontFamily="'Cairo', 'Tajawal', sans-serif"
              letterSpacing="0.02em"
              transition="all 0.3s"
              _hover={{
                transform: "translateY(-4px) scale(1.02)",
                boxShadow: useColorModeValue("0 12px 35px rgba(66, 153, 225, 0.5)", "0 12px 35px rgba(0, 0, 0, 0.5)"),
                bg: buttonPrimaryHover
              }}
            >
              إنشاء درس جديد
            </MotionButton>
          </Flex>
        </Box>
      </Box>

      {/* Main Content */}
      <Box maxW="1200px" mx="auto" px={{ base: 4, md: 8 }} py={8} position="relative" zIndex={1}>

      {/* شريط البحث */}
      <Box mb={8}>
        <Box
          bg={inputBg}
          borderRadius="12px"
          p={2}
          boxShadow={useColorModeValue("0 5px 15px rgba(66, 153, 225, 0.1)", "0 5px 15px rgba(0, 0, 0, 0.2)")}
          border="2px solid"
          borderColor={inputBorder}
          _hover={{ borderColor: inputHoverBorder }}
          transition="all 0.2s"
        >
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none" pl={6}>
              <Icon as={FaSearch} color={useColorModeValue("#4299e1", "#63b3ed")} boxSize={5} />
            </InputLeftElement>
            <Input
              placeholder="ابحث عن درس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg="transparent"
              border="none"
              _hover={{ bg: useColorModeValue("blue.100", "gray.600") }}
              _focus={{
                bg: useColorModeValue("blue.100", "gray.600"),
                boxShadow: "none",
                outline: "none"
              }}
              borderRadius="10px"
              py={6}
              pl={16}
              fontSize="lg"
              fontWeight="medium"
              color={textPrimary}
              _placeholder={{ color: useColorModeValue("blue.400", "blue.500") }}
              fontFamily="'Cairo', 'Tajawal', sans-serif"
            />
          </InputGroup>
        </Box>
      </Box>

      {/* عرض الدروس */}
      <Box>
        <Flex align="center" justify="center" gap={4} mb={8}>
          <Box
            w="50px"
            h="50px"
            bg={buttonPrimary}
            borderRadius="15px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow={useColorModeValue("0 4px 15px rgba(66, 153, 225, 0.35)", "0 4px 15px rgba(0, 0, 0, 0.4)")}
          >
            <Icon as={FaBook} color="white" boxSize={5} />
          </Box>
          <Heading 
            size="xl" 
            color={textPrimary}
            fontWeight="800"
            fontFamily="'Cairo', 'Tajawal', sans-serif"
            letterSpacing="-0.02em"
          >
            دروس الفصل ({filteredLessons.length})
          </Heading>
        </Flex>

        {filteredLessons.length === 0 ? (
          <Box 
            textAlign="center" 
            py={20} 
            bg={cardBackground} 
            borderRadius="20px" 
            boxShadow={useColorModeValue("0 8px 30px rgba(66, 153, 225, 0.12)", "0 8px 30px rgba(0, 0, 0, 0.3)")}
            border="2px solid"
            borderColor={cardBorder}
          >
            <Box
              w="120px"
              h="120px"
              bg={iconBg}
              borderRadius="50%"
              display="flex"
              alignItems="center"
              justifyContent="center"
              mx="auto"
              mb={6}
              border="3px solid"
              borderColor={iconBorder}
            >
              <FaBook size={50} color={useColorModeValue("#4299e1", "#63b3ed")} />
            </Box>
            <Heading 
              size="lg" 
              color={textPrimary} 
              mb={3} 
              fontWeight="800"
              fontFamily="'Cairo', 'Tajawal', sans-serif"
              letterSpacing="-0.01em"
            >
              {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد دروس بعد"}
            </Heading>
            <Text 
              color={useColorModeValue("blue.500", "blue.400")} 
              fontSize="lg" 
              mb={8} 
              fontWeight="600"
              fontFamily="'Cairo', 'Tajawal', sans-serif"
            >
              {searchTerm ? "جرب البحث بكلمات مختلفة" : "ابدأ بإضافة أول درس"}
            </Text>
            {!searchTerm && (
              <Button 
                mt={4} 
                bg={buttonPrimary}
                color="white"
                onClick={onOpen}
                size="lg"
                borderRadius="12px"
                boxShadow={useColorModeValue("0 6px 20px rgba(66, 153, 225, 0.35)", "0 6px 20px rgba(0, 0, 0, 0.4)")}
                _hover={{
                  bg: buttonPrimaryHover,
                  transform: "translateY(-3px)",
                  boxShadow: useColorModeValue("0 10px 30px rgba(66, 153, 225, 0.45)", "0 10px 30px rgba(0, 0, 0, 0.5)")
                }}
                fontWeight="bold"
                fontFamily="'Cairo', 'Tajawal', sans-serif"
                leftIcon={<FaPlus />}
              >
                إضافة أول درس
              </Button>
            )}
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {filteredLessons.map((lesson) => (
              <MotionCard
                key={lesson.id}
                whileHover={{ y: -5 }}
                bg={cardBackground}
                borderRadius="16px"
                border="2px solid"
                borderColor={cardBorder}
                boxShadow={useColorModeValue("0 4px 15px rgba(66, 153, 225, 0.1)", "0 4px 15px rgba(0, 0, 0, 0.2)")}
                transition="all 0.3s"
                overflow="hidden"
                _hover={{
                  boxShadow: useColorModeValue("0 8px 25px rgba(66, 153, 225, 0.15)", "0 8px 25px rgba(0, 0, 0, 0.3)"),
                  borderColor: cardHoverBorder
                }}
              >
                <CardHeader pb={4}>
                  {lesson.image_url && (
                    <Box mb={4} borderRadius="12px" overflow="hidden">
                      <Image
                        src={lesson.image_url}
                        alt={lesson.name}
                        borderRadius="12px"
                        maxH="180px"
                        objectFit="cover"
                        w="full"
                      />
                    </Box>
                  )}

                  <Flex align="center" gap={3}>
                    <Box
                      w="50px"
                      h="50px"
                      bg={buttonPrimary}
                      borderRadius="12px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Icon as={FaPlay} color="white" boxSize={5} />
                    </Box>
                    <Box flex={1} minW={0}>
                      <Heading 
                        size="md" 
                        color={textPrimary}
                        fontWeight="700"
                        mb={1}
                        fontFamily="'Cairo', 'Tajawal', sans-serif"
                      >
                        {lesson.name}
                      </Heading>
                      {lesson.description && (
                        <Text 
                          fontSize="sm" 
                          color={textSecondary} 
                          noOfLines={2} 
                          fontWeight="500"
                          fontFamily="'Cairo', 'Tajawal', sans-serif"
                        >
                          {lesson.description}
                        </Text>
                      )}
                    </Box>
                  </Flex>
                </CardHeader>

                <CardBody py={3}>
                  <HStack spacing={2} justify="center">
                    <Icon as={FaClock} color={useColorModeValue("blue.400", "blue.500")} boxSize={4} />
                    <Text 
                      fontSize="xs" 
                      color={textSecondary} 
                      fontWeight="500"
                      fontFamily="'Cairo', 'Tajawal', sans-serif"
                    >
                      {new Date(lesson.created_at).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                  </HStack>
                </CardBody>

                <CardFooter pt={0} pb={4}>
                  <VStack spacing={2} w="full">
                    <Link to={`/lesson/${lesson.id}`} style={{ width: "100%" }}>
                      <Button
                        rightIcon={<FaPlay />}
                        bg={buttonPrimary}
                        color="white"
                        w="full"
                        size="md"
                        borderRadius="10px"
                        _hover={{ bg: buttonPrimaryHover }}
                        fontWeight="600"
                        fontFamily="'Cairo', 'Tajawal', sans-serif"
                      >
                        بدء الدرس
                      </Button>
                    </Link>
                    <HStack spacing={2} w="full">
                      <IconButton
                        icon={<FaEdit />}
                        size="md"
                        bg={buttonSecondary}
                        color="white"
                        borderRadius="10px"
                        onClick={() => handleEditClick(lesson)}
                        aria-label="تعديل الدرس"
                        _hover={{ bg: buttonSecondaryHover }}
                        flex={1}
                      />
                      <IconButton
                        icon={<FaTrash />}
                        size="md"
                        bg={useColorModeValue("blue.300", "blue.600")}
                        color="white"
                        borderRadius="10px"
                        onClick={() => handleDeleteClick(lesson)}
                        aria-label="حذف الدرس"
                        _hover={{ bg: useColorModeValue("blue.400", "blue.700") }}
                        flex={1}
                      />
                    </HStack>
                  </VStack>
                </CardFooter>
              </MotionCard>
            ))}
          </SimpleGrid>
        )}
      </Box>

      {/* Add Lesson Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
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
              <Text fontSize="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">إنشاء درس جديد</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: buttonPrimaryHover }} />
          
          <ModalBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">اسم الدرس</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="أدخل اسم الدرس"
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
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">وصف الدرس (اختياري)</FormLabel>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="أدخل وصف الدرس"
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
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">صورة الدرس (اختياري)</FormLabel>
                  <VStack spacing={4} align="stretch">
                    {!imagePreview ? (
                      <Button
                        as="label"
                        htmlFor="image-upload"
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
                      id="image-upload"
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
                onClick={resetForm}
                color={textPrimary}
                _hover={{ bg: iconBg }}
                fontWeight="bold"
                fontFamily="'Cairo', 'Tajawal', sans-serif"
              >
                إعادة تعيين
              </Button>
              <Button 
                variant="ghost" 
                onClick={onClose}
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
                onClick={handleSubmit}
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
                إنشاء الدرس
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Lesson Modal */}
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
              <Text fontSize="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">تعديل الدرس</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: buttonSecondaryHover }} />
          
          <ModalBody>
            <form onSubmit={handleEditSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">اسم الدرس</FormLabel>
                  <Input
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    placeholder="أدخل اسم الدرس"
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
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">وصف الدرس (اختياري)</FormLabel>
                  <Textarea
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditInputChange}
                    placeholder="أدخل وصف الدرس"
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
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">صورة الدرس (اختياري)</FormLabel>
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
                onClick={resetEditForm}
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
                تحديث الدرس
              </Button>
            </HStack>
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
                  <FaBook size={40} color={useColorModeValue("#4299e1", "#63b3ed")} />
                </Box>
                <Text 
                  fontSize="lg" 
                  fontWeight="800" 
                  color={textPrimary}
                  fontFamily="'Cairo', 'Tajawal', sans-serif"
                  mb={2}
                >
                  هل أنت متأكد من حذف الدرس؟
                </Text>
                <Text 
                  mt={2} 
                  color={useColorModeValue("blue.500", "blue.400")} 
                  fontWeight="600"
                  fontSize="md"
                  fontFamily="'Cairo', 'Tajawal', sans-serif"
                >
                  "{deletingLesson?.name}"
                </Text>
                <Text 
                  mt={3} 
                  color={useColorModeValue("blue.400", "blue.500")} 
                  fontSize="sm" 
                  fontWeight="medium"
                  fontFamily="'Cairo', 'Tajawal', sans-serif"
                >
                  هذا الإجراء لا يمكن التراجع عنه
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
                onClick={handleDeleteConfirm}
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
                حذف الدرس
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

export default ChapterQuestion;
