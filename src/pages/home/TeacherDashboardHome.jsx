import React, { useState, useRef } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Image,
  Button,
  IconButton,
  Badge,
  useColorModeValue,
  Spinner,
  Center,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Divider,
  SimpleGrid,
  useToast,
  Icon,
  Flex,
  Switch,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Collapse,
} from "@chakra-ui/react";
import {
  FaBookOpen,
  FaUsers,
  FaFileAlt,
  FaClipboardList,
  FaEdit,
  FaTrash,
  FaPlus,
  FaChartLine,
  FaCalendarAlt,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaImage,
  FaTimes,
  FaBell,
  FaFilter,
  FaChevronDown,
  FaChevronLeft,
  FaFolderOpen,
  FaSync,
  FaBuilding,
} from "react-icons/fa";
import { MdAssignment, MdQuiz } from "react-icons/md";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import baseUrl from "../../api/baseUrl";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import TeacherSubscriptionExpiryAlert from "../../components/teacher/TeacherSubscriptionExpiryAlert";
import { useTeacherSubscriptionExpiryAlert } from "../../Hooks/useTeacherSubscriptionExpiryAlert";

function KpiCard({ icon, label, value, accent = "blue" }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const title = useColorModeValue("gray.900", "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const accentMap = {
    blue: { bar: "#3182CE", soft: "blue.50", icon: "blue.500" },
    orange: { bar: "#DD6B20", soft: "orange.50", icon: "orange.500" },
    green: { bar: "#38A169", soft: "green.50", icon: "green.500" },
  };
  const a = accentMap[accent] || accentMap.blue;

  return (
    <Flex
      bg={bg}
      border="1px solid"
      borderColor={border}
      borderRadius="xl"
      p={4}
      align="center"
      gap={3}
      position="relative"
      overflow="hidden"
      transition="all 0.2s"
      _hover={{
        borderColor: a.bar,
        transform: "translateY(-2px)",
        boxShadow: `0 10px 24px -14px ${a.bar}88`,
      }}
    >
      <Box position="absolute" top={0} insetInlineStart={0} w="3px" h="full" bg={a.bar} />
      <Flex
        w={11}
        h={11}
        borderRadius="lg"
        bg={a.soft}
        align="center"
        justify="center"
        flexShrink={0}
      >
        <Icon as={icon} color={a.icon} boxSize={5} />
      </Flex>
      <Box minW={0}>
        <Text fontSize="xs" color={muted} mb={1} fontWeight="600">
          {label}
        </Text>
        <Text fontSize="2xl" fontWeight="800" color={title} lineHeight="1" letterSpacing="-0.02em">
          {value}
        </Text>
      </Box>
    </Flex>
  );
}

function QuickLinkCard({ link }) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bg = useColorModeValue("white", "gray.800");
  const titleColor = useColorModeValue("gray.800", "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const isOrange = link.color === "orange";
  const accent = isOrange ? "#DD6B20" : "#3182CE";
  const iconBg = isOrange ? "orange.50" : "blue.50";
  const iconColor = isOrange ? "orange.500" : "blue.500";

  return (
    <Box
      p={4}
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      h="full"
      cursor="pointer"
      transition="all 0.2s"
      _hover={{
        borderColor: accent,
        transform: "translateY(-2px)",
        boxShadow: `0 12px 24px -14px ${accent}99`,
      }}
    >
      <Flex
        w={10}
        h={10}
        borderRadius="lg"
        bg={iconBg}
        color={iconColor}
        align="center"
        justify="center"
        mb={3}
      >
        <Icon as={link.icon} boxSize={4} />
      </Flex>
      <Text fontWeight="800" fontSize="sm" color={titleColor} noOfLines={1} mb={1}>
        {link.title}
      </Text>
      <Text fontSize="xs" color={muted} noOfLines={2} lineHeight="1.6">
        {link.description}
      </Text>
    </Box>
  );
}

function SectionTitle({ children, ...props }) {
  return (
    <Heading
      size={{ base: "sm", md: "md" }}
      fontWeight="800"
      color={useColorModeValue("gray.900", "white")}
      fontFamily="'Noto Naskh Arabic', 'Noto Sans Arabic', serif"
      letterSpacing="-0.02em"
      {...props}
    >
      {children}
    </Heading>
  );
}

function isCourseFree(course) {
  if (course?.is_free != null) return Boolean(course.is_free);
  if (course?.isFree != null) return Boolean(course.isFree);
  const price = Number(course?.price);
  return !Number.isNaN(price) && price === 0;
}

function validateCourseForm({ title, description, grade_id, is_free, price }) {
  if (!String(title || "").trim()) return "عنوان الكورس مطلوب";
  if (!String(description || "").trim()) return "وصف الكورس مطلوب";
  if (!grade_id) return "المرحلة الدراسية مطلوبة";
  if (!is_free) {
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return "السعر يجب أن يكون أكبر من صفر للكورس المدفوع";
    }
  }
  return null;
}

function appendCoursePricingFields(formData, { is_free, price }) {
  formData.append("is_free", is_free ? "true" : "false");
  if (is_free) {
    formData.append("price", "0");
  } else {
    formData.append("price", String(Math.round(Number(price))));
  }
}

function CreateCourseModalSection({ title, subtitle, children }) {
  const headingColor = useColorModeValue("gray.800", "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const line = useColorModeValue("gray.200", "gray.600");

  return (
    <Box>
      <Box mb={4}>
        <Text fontSize="sm" fontWeight="bold" color={headingColor}>
          {title}
        </Text>
        {subtitle ? (
          <Text fontSize="xs" color={muted} mt={0.5}>
            {subtitle}
          </Text>
        ) : null}
      </Box>
      <VStack spacing={4} align="stretch">
        {children}
      </VStack>
      <Divider mt={6} borderColor={line} />
    </Box>
  );
}

const TeacherDashboardHome = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const token = localStorage.getItem("token");
  const queryClient = useQueryClient();

  // States
  const [selectedGrade, setSelectedGrade] = useState("");
  const [alertRefreshing, setAlertRefreshing] = useState(false);
  const {
    alert: subscriptionAlert,
    refresh: refreshSubscriptionAlert,
  } = useTeacherSubscriptionExpiryAlert({ days: 3, grace_days: 3 });

  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const { isOpen: isQuickLinksOpen, onToggle: onQuickLinksToggle } =
    useDisclosure({ defaultIsOpen: false });

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    price: 0,
    description: "",
    grade_id: "",
    is_free: false,
  });
  const [courseAvatar, setCourseAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [editData, setEditData] = useState({
    id: null,
    title: "",
    price: 0,
    description: "",
    grade_id: "",
    avatar: null,
    is_free: false,
  });
  const [editAvatarPreview, setEditAvatarPreview] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const toast = useToast();
  const cancelRef = useRef();

  // Quick Links data
  const quickLinks = [
    {
      id: 10,
      title: "إدارة السنتر",
      description: "طلاب · حضور · اشتراكات · ماليات",
      icon: FaBuilding,
      color: "blue",
      link: "/center-mgmt",
    },
    {
      id: 1,
      title: "بنك الأسئلة",
      description: "اضافة اسئلة جديدة",
      icon: FaClipboardList,
      color: "blue",
      link: "/Teacher_subjects",
    },
    {
      id: 2,
      title: "الرسائل",
      description: "تواصل مع طلابك",
      icon: FaEnvelope,
      color: "blue",
      link: "/TeacherChat",
    },
    {
      id: 3,
      title: "مولّد الامتحانات",
      description: "اختيار أسئلة من بنكك بالذكاء الاصطناعي",
      icon: MdQuiz,
      color: "blue",
      link: "/exam-builder-chat",
    },
    {
      id: 6,
      title: "محلل البيانات",
      description: "تقارير وتحليل الأداء",
      icon: FaChartLine,
      color: "orange",
      link: "/teacher-analytics",
    },
    {
      id: 7,
      title: "السوشيال",
      description: "إدارة المحتوى والتفاعل",
      icon: FaBell,
      color: "blue",
      link: "/social",
    },
    {
      id: 9,
      title: "ملفاتي",
      description: "مكتبة المواد التعليمية",
      icon: FaFolderOpen,
      color: "orange",
      link: "/teacher-my-files",
    },
    {
      id: 8,
      title: "المساعد العلمي",
      description: "رفع مواد ومراجعة شات الطلاب",
      icon: FaFileAlt,
      color: "blue",
      link: "/teacher-scientific-files",
    },
  ];

  // كورسات المدرس مع كاش
  const {
    data: courses = [],
    isLoading: loading,
    error: coursesError,
    refetch: refetchCourses,
  } = useQuery({
    queryKey: ["teacherCourses"],
    queryFn: async () => {
      if (!token) throw new Error("No token found");
      const response = await baseUrl.get("api/course/my-courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.courses || [];
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // الصفوف مع كاش
  const { data: grades = [] } = useQuery({
    queryKey: ["teacherGrades"],
    queryFn: async () => {
      const response = await baseUrl.get("api/teacher/grades", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.grades || [];
    },
    enabled: !!token,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // المواد والمجموعات مع كاش
  const {
    data: subjects = [],
    isLoading: subjectsLoading,
    refetch: refetchSubjects,
  } = useQuery({
    queryKey: ["teacherSubjects"],
    queryFn: async () => {
      const response = await baseUrl.get("/api/teacher/package-subjects/groups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.subjects || [];
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const error = coursesError ? "حدث خطأ في تحميل الكورسات" : null;

  const totalGroups = subjects.reduce(
    (sum, s) => sum + (s.groups_count || 0),
    0,
  );

  // Color mode values
  const pageBg = useColorModeValue(
    "linear-gradient(180deg, #EEF4FB 0%, #F8FAFC 32%, #F8FAFC 100%)",
    "gray.900",
  );
  const cardBg = useColorModeValue("white", "gray.800");
  const headingColor = useColorModeValue("gray.900", "white");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const heroBg = useColorModeValue(
    "linear(to-l, blue.600, blue.500)",
    "linear(to-l, blue.700, blue.600)",
  );
  const heroCardBg = useColorModeValue("white", "gray.800");
  const heroCardBorder = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const heroShadow = useColorModeValue(
    "0 18px 40px -24px rgba(49, 130, 206, 0.35)",
    "0 18px 40px -24px rgba(0,0,0,0.5)",
  );
  const sectionCardBg = useColorModeValue("white", "gray.800");
  const sectionBorder = useColorModeValue("gray.200", "gray.700");
  const inputBorderColor = useColorModeValue("gray.200", "gray.600");
  const mutedTextColor = useColorModeValue("gray.500", "gray.400");
  const dividerBorderColor = useColorModeValue("gray.100", "gray.600");
  const greenBoxBg = useColorModeValue("green.50", "green.900");
  const greenBoxBorder = useColorModeValue("green.200", "green.700");
  const greenBoxText = useColorModeValue("green.700", "green.200");
  const modalFieldBg = useColorModeValue("gray.50", "gray.900");
  const modalAccentBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const modalFooterBg = useColorModeValue("gray.50", "gray.900");
  const modalTipBorder = useColorModeValue("blue.100", "blue.900");
  const createAvatarInputRef = useRef(null);
  const teacherDisplayName =
    user.name || `${user.fname || ""} ${user.lname || ""}`.trim() || "المدرس";

  const setCoursePricingType = (isFree) => {
    setFormData((prev) => ({
      ...prev,
      is_free: isFree,
      price: isFree ? 0 : prev.price || "",
    }));
  };

  const modalInputProps = {
    borderRadius: "lg",
    border: "1px solid",
    borderColor: inputBorderColor,
    bg: modalFieldBg,
    _hover: { borderColor: "blue.300" },
    _focus: { borderColor: "blue.500", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" },
    size: { base: "sm", md: "md" },
  };

  const fetchCourses = async () => {
    await queryClient.invalidateQueries({ queryKey: ["teacherCourses"] });
    return refetchCourses();
  };

  const fetchSubjects = async () => {
    await queryClient.invalidateQueries({ queryKey: ["teacherSubjects"] });
    return refetchSubjects();
  };

  const WEEKDAY_LABELS = {
    sat: "السبت",
    sun: "الأحد",
    mon: "الاثنين",
    tue: "الثلاثاء",
    wed: "الأربعاء",
    thu: "الخميس",
    fri: "الجمعة",
  };

  const formatDays = (days) => {
    if (!Array.isArray(days) || days.length === 0) return "";
    return days.map((d) => WEEKDAY_LABELS[d] || d).join(" - ");
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle avatar file selection
  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "خطأ في نوع الملف",
          description: "يرجى اختيار ملف صورة صحيح",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "خطأ في حجم الملف",
          description: "حجم الملف يجب أن يكون أقل من 5 ميجابايت",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setCourseAvatar(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear avatar
  const clearAvatar = () => {
    setCourseAvatar(null);
    setAvatarPreview(null);
  };

  // Handle edit form changes
  const handleEditChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle edit avatar change
  const handleEditAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditData((prev) => ({ ...prev, avatar: file }));
      const reader = new FileReader();
      reader.onload = (e) => setEditAvatarPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Create course
  const handleCreateCourse = async () => {
    const validationError = validateCourseForm(formData);
    if (validationError) {
      toast({
        title: "خطأ في البيانات",
        description: validationError,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setFormLoading(true);

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title.trim());
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("grade_id", String(parseInt(formData.grade_id, 10)));
      appendCoursePricingFields(formDataToSend, formData);

      if (courseAvatar) {
        formDataToSend.append("avatar", courseAvatar);
      }

      await baseUrl.post("api/course", formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast({
        title: "تم إنشاء الكورس بنجاح",
        description: formData.is_free
          ? "تم إضافة كورس مجاني — المحتوى متاح للطلاب المسجّلين مباشرة"
          : "تم إضافة الكورس الجديد إلى قائمة كورساتك",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setFormData({ title: "", price: 0, description: "", grade_id: "", is_free: false });
      clearAvatar();
      onClose();
      fetchCourses();
    } catch (error) {
      console.error("Error creating course:", error);
      toast({
        title: "خطأ في إنشاء الكورس",
        description:
          error.response?.data?.message || "حدث خطأ أثناء إنشاء الكورس",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Edit course
  const handleEditCourse = (course) => {
    const free = isCourseFree(course);
    setEditData({
      id: course.id,
      title: course.title,
      price: free ? 0 : parseFloat(course.price) || 0,
      description: course.description,
      grade_id: course.grade_id?.toString?.() ?? String(course.grade?.id ?? course.grade_id ?? ""),
      avatar: null,
      is_free: free,
    });
    // عرض الصورة الحالية للكورس إذا كانت موجودة
    setEditAvatarPreview(course.avatar || course.image || null);
    onEditOpen();
  };

  // Update course
  const handleUpdateCourse = async () => {
    const validationError = validateCourseForm(editData);
    if (validationError) {
      toast({
        title: "خطأ في البيانات",
        description: validationError,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setEditLoading(true);

      const payload = new FormData();
      payload.append("title", editData.title.trim());
      payload.append("description", editData.description.trim());
      payload.append("grade_id", String(editData.grade_id));
      appendCoursePricingFields(payload, editData);

      if (editData.avatar) {
        payload.append("avatar", editData.avatar);
      } else if (!editAvatarPreview) {
        payload.append("remove_avatar", "true");
      }

      await baseUrl.put(`api/course/${editData.id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast({
        title: "تم تحديث الكورس بنجاح",
        description: editData.is_free
          ? "تم تحديث الكورس كمحتوى مجاني متاح مباشرة"
          : "تم تحديث بيانات الكورس بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setEditData({
        id: null,
        title: "",
        price: 0,
        description: "",
        grade_id: "",
        avatar: null,
        is_free: false,
      });
      setEditAvatarPreview(null);
      onEditClose();
      fetchCourses();
    } catch (error) {
      console.error("Error updating course:", error);
      toast({
        title: "خطأ في تحديث الكورس",
        description:
          error.response?.data?.message || "حدث خطأ أثناء تحديث الكورس",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setEditLoading(false);
    }
  };

  // Delete course
  const handleDeleteCourse = (course) => {
    setCourseToDelete(course);
    onDeleteOpen();
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;

    try {
      setDeleteLoading(true);
      await baseUrl.delete(`api/course/${courseToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: "تم حذف الكورس بنجاح",
        description: "تم حذف الكورس من قائمة كورساتك",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onDeleteClose();
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      toast({
        title: "خطأ في حذف الكورس",
        description:
          error.response?.data?.message || "حدث خطأ أثناء حذف الكورس",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter courses by grade
  const filteredCourses = selectedGrade
    ? courses.filter((course) => course.grade_id === parseInt(selectedGrade))
    : courses;

  const handleRefreshDashboard = async () => {
    setAlertRefreshing(true);
    try {
      await Promise.all([
        fetchCourses(),
        fetchSubjects(),
        queryClient.invalidateQueries({ queryKey: ["teacherGrades"] }),
        refreshSubscriptionAlert(),
      ]);
    } finally {
      setAlertRefreshing(false);
    }
  };

  return (
    <Box
      className="home-page"
      minH="100vh"
      bg={pageBg}
      dir="rtl"
      overflowX="hidden"
      fontFamily="'Noto Sans Arabic', system-ui, sans-serif"
    >
      <Container maxW="8xl" py={{ base: 4, md: 6 }} px={{ base: 3, md: 4 }}>
        <VStack spacing={{ base: 5, md: 6 }} align="stretch">
          {/* Hero */}
          <Box
            bg={heroCardBg}
            border="1px solid"
            borderColor={heroCardBorder}
            borderRadius={{ base: "2xl", md: "3xl" }}
            overflow="hidden"
            position="relative"
            boxShadow={heroShadow}
          >
            <Box
              position="absolute"
              inset={0}
              pointerEvents="none"
              bgImage="radial-gradient(ellipse 70% 80% at 100% 0%, rgba(49,130,206,0.14), transparent 55%), radial-gradient(ellipse 50% 60% at 0% 100%, rgba(221,107,32,0.1), transparent 50%)"
            />
            <Box
              position="absolute"
              top={0}
              insetInline={0}
              h="3px"
              bg="linear-gradient(90deg, #3182CE, #DD6B20)"
            />

            <Flex
              position="relative"
              direction={{ base: "column", md: "row" }}
              align={{ base: "stretch", md: "center" }}
              justify="space-between"
              gap={{ base: 4, md: 6 }}
              px={{ base: 4, md: 6 }}
              py={{ base: 5, md: 6 }}
            >
              <HStack spacing={4} align="center" minW={0}>
                <Box position="relative" flexShrink={0}>
                  <Image
                    src={user.avatar || "https://placehold.co/100x100?text=User"}
                    alt={teacherDisplayName}
                    w={{ base: "64px", md: "72px" }}
                    h={{ base: "64px", md: "72px" }}
                    borderRadius="full"
                    border="3px solid"
                    borderColor="white"
                    boxShadow="md"
                    objectFit="cover"
                  />
                  <Box
                    position="absolute"
                    bottom="2px"
                    insetInlineEnd="2px"
                    w={3.5}
                    h={3.5}
                    bg="green.400"
                    borderRadius="full"
                    border="2px solid white"
                  />
                </Box>
                <Box minW={0}>
                  <Badge
                    mb={2}
                    borderRadius="full"
                    px={3}
                    py={0.5}
                    bg="blue.50"
                    color="blue.600"
                    fontWeight="800"
                    fontSize="xs"
                  >
                    مساحة المدرس
                  </Badge>
                  <Heading
                    as="h1"
                    fontSize={{ base: "xl", md: "2xl" }}
                    fontWeight="900"
                    color={headingColor}
                    noOfLines={1}
                    fontFamily="'Noto Naskh Arabic', 'Noto Sans Arabic', serif"
                    letterSpacing="-0.02em"
                  >
                    مرحباً، {teacherDisplayName}
                  </Heading>
                  <Text mt={1.5} fontSize="sm" color={mutedTextColor} noOfLines={2}>
                    أدِر كورساتك وموادك وتواصل مع طلابك من لوحة واحدة واضحة.
                  </Text>
                </Box>
              </HStack>

              <HStack spacing={2} flexWrap="wrap" alignSelf={{ base: "stretch", md: "center" }}>
                <Button
                  leftIcon={<FaPlus />}
                  size="sm"
                  bg="#DD6B20"
                  color="white"
                  borderRadius="lg"
                  fontWeight="800"
                  cursor="pointer"
                  onClick={onOpen}
                  _hover={{ bg: "#C05621" }}
                  flex={{ base: 1, sm: "initial" }}
                >
                  كورس جديد
                </Button>
                <Button
                  leftIcon={<FaSync />}
                  size="sm"
                  variant="outline"
                  borderColor="#3182CE"
                  color="#3182CE"
                  borderRadius="lg"
                  fontWeight="700"
                  cursor="pointer"
                  onClick={handleRefreshDashboard}
                  _hover={{ bg: "blue.50" }}
                  flex={{ base: 1, sm: "initial" }}
                >
                  تحديث
                </Button>
              </HStack>
            </Flex>
          </Box>

          <TeacherSubscriptionExpiryAlert
            alert={subscriptionAlert}
            onRefresh={refreshSubscriptionAlert}
            refreshing={alertRefreshing}
          />

          {/* KPIs */}
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
            <KpiCard icon={FaBookOpen} label="كورساتي" value={courses.length} accent="blue" />
            <KpiCard icon={FaUsers} label="المواد الدراسية" value={subjects.length} accent="orange" />
            <KpiCard icon={MdAssignment} label="المجموعات" value={totalGroups} accent="green" />
          </SimpleGrid>

          {/* Quick Links */}
          <Box
            bg={sectionCardBg}
            borderWidth="1px"
            borderColor={sectionBorder}
            borderRadius="2xl"
            p={{ base: 4, md: 5 }}
          >
            <Flex
              align="center"
              justify="space-between"
              mb={{ base: 3, md: 4 }}
              onClick={onQuickLinksToggle}
              cursor={{ base: "pointer", lg: "default" }}
              display={{ base: "flex", lg: "none" }}
            >
              <SectionTitle>الوصول السريع</SectionTitle>
              <Icon
                as={isQuickLinksOpen ? FaChevronDown : FaChevronLeft}
                boxSize={4}
                color={textColor}
              />
            </Flex>

            <Box display={{ base: "none", lg: "block" }} mb={4}>
              <SectionTitle>الوصول السريع</SectionTitle>
              <Text fontSize="xs" color={mutedTextColor} mt={1}>
                اختصارات لأهم أدوات التدريس
              </Text>
            </Box>

            <Box display={{ base: "block", lg: "none" }}>
              <Collapse in={isQuickLinksOpen} animateOpacity>
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                  {quickLinks.map((link) => (
                    <Link key={link.id} to={link.link} style={{ textDecoration: "none" }} onClick={onQuickLinksToggle}>
                      <QuickLinkCard link={link} />
                    </Link>
                  ))}
                </SimpleGrid>
              </Collapse>
            </Box>

            <SimpleGrid columns={{ sm: 2, lg: 4 }} spacing={3} display={{ base: "none", lg: "grid" }}>
              {quickLinks.map((link) => (
                <Link key={link.id} to={link.link} style={{ textDecoration: "none", height: "100%" }}>
                  <QuickLinkCard link={link} />
                </Link>
              ))}
            </SimpleGrid>
          </Box>

          {/* Subjects */}
          {(subjectsLoading || subjects.length > 0) && (
            <Box>
              <SectionTitle mb={1}>المواد الدراسية</SectionTitle>
              <Text fontSize="xs" color={mutedTextColor} mb={4}>
                المواد والمجموعات المرتبطة بمنصتك
              </Text>

              {subjectsLoading && subjects.length === 0 ? (
                <Center py={10} bg={sectionCardBg} borderRadius="2xl" borderWidth="1px" borderColor={sectionBorder}>
                  <VStack spacing={3}>
                    <Spinner size="lg" color="blue.500" thickness="3px" />
                    <Text color={mutedTextColor} fontSize="sm">جاري تحميل المواد...</Text>
                  </VStack>
                </Center>
              ) : (
                <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
                  {subjects.map((subject) => (
                    <Box
                      key={subject.id}
                      as={Link}
                      to={`/subject/${subject.id}`}
                      bg={cardBg}
                      borderWidth="1px"
                      borderColor={sectionBorder}
                      borderRadius="2xl"
                      overflow="hidden"
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{
                        borderColor: "#3182CE",
                        transform: "translateY(-3px)",
                        boxShadow: "0 14px 28px -16px rgba(49,130,206,0.45)",
                      }}
                    >
                      <Box h={{ base: "140px", md: "150px" }} overflow="hidden" position="relative">
                        <Image
                          src={subject.image || "https://placehold.co/600x400/e2e8f0/475569?text=Subject"}
                          alt={subject.name}
                          w="full"
                          h="full"
                          objectFit="cover"
                        />
                        <Box
                          position="absolute"
                          inset={0}
                          bg="linear-gradient(180deg, transparent 40%, rgba(15,23,42,0.55) 100%)"
                        />
                        <Badge
                          position="absolute"
                          bottom={3}
                          right={3}
                          bg="#DD6B20"
                          color="white"
                          borderRadius="md"
                          fontSize="xs"
                          fontWeight="800"
                        >
                          {subject.grade_name || "مادة دراسية"}
                        </Badge>
                      </Box>
                      <Box p={4}>
                        <Heading size="sm" color={headingColor} noOfLines={1} mb={2} fontWeight="800">
                          {subject.name}
                        </Heading>
                        <HStack fontSize="xs" color={mutedTextColor} spacing={2} mb={3}>
                          <Icon as={FaUsers} color="orange.400" boxSize={3} />
                          <Text>{subject.groups_count || 0} مجموعات</Text>
                        </HStack>
                        <Button
                          w="full"
                          size="sm"
                          variant="outline"
                          borderColor="#3182CE"
                          color="#3182CE"
                          borderRadius="lg"
                          fontWeight="700"
                          _hover={{ bg: "blue.50" }}
                        >
                          إدارة المادة
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </Box>
          )}

          {/* Courses */}
          <Box>
            <Flex
              mb={4}
              direction={{ base: "column", sm: "row" }}
              align={{ base: "stretch", sm: "center" }}
              justify="space-between"
              gap={3}
            >
              <Box>
                <SectionTitle>كورساتي</SectionTitle>
                <Text fontSize="xs" color={mutedTextColor} mt={1}>
                  {filteredCourses.length} كورس معروض
                </Text>
              </Box>
              <Flex direction={{ base: "column", sm: "row" }} gap={2} w={{ base: "full", sm: "auto" }}>
                <Select
                  placeholder="تصفية حسب الصف"
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  w={{ base: "full", sm: "180px" }}
                  bg={sectionCardBg}
                  borderRadius="lg"
                  borderColor={sectionBorder}
                  size="sm"
                  icon={<Icon as={FaFilter} color="blue.500" />}
                >
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </Select>
                <Button
                  leftIcon={<FaPlus />}
                  onClick={onOpen}
                  size="sm"
                  bg="#3182CE"
                  color="white"
                  borderRadius="lg"
                  fontWeight="800"
                  cursor="pointer"
                  _hover={{ bg: "#2B6CB0" }}
                  w={{ base: "full", sm: "auto" }}
                >
                  إضافة كورس
                </Button>
              </Flex>
            </Flex>

            {loading && courses.length === 0 ? (
              <Center py={10} bg={sectionCardBg} borderRadius="2xl" borderWidth="1px" borderColor={sectionBorder}>
                <VStack spacing={3}>
                  <Spinner size="lg" color="blue.500" thickness="3px" />
                  <Text color={mutedTextColor} fontSize="sm">جاري تحميل الكورسات...</Text>
                </VStack>
              </Center>
            ) : error ? (
              <Center py={10} bg={sectionCardBg} borderRadius="2xl" borderWidth="1px" borderColor={sectionBorder}>
                <VStack spacing={3}>
                  <Icon as={FaBookOpen} boxSize={10} color="red.400" />
                  <Text color="red.500" fontSize="sm" textAlign="center">{error}</Text>
                  <Button colorScheme="blue" size="sm" onClick={fetchCourses} borderRadius="lg">
                    إعادة المحاولة
                  </Button>
                </VStack>
              </Center>
            ) : filteredCourses.length === 0 ? (
              <Center py={12} bg={sectionCardBg} borderRadius="2xl" borderWidth="1px" borderColor={sectionBorder} borderStyle="dashed">
                <VStack spacing={3}>
                  <Flex w={14} h={14} borderRadius="full" bg="blue.50" align="center" justify="center">
                    <Icon as={FaBookOpen} boxSize={6} color="#3182CE" />
                  </Flex>
                  <Text color={headingColor} fontWeight="800">لا توجد كورسات بعد</Text>
                  <Text color={mutedTextColor} fontSize="sm">ابدأ بإنشاء أول كورس لطلابك</Text>
                  <Button
                    bg="#DD6B20"
                    color="white"
                    size="sm"
                    onClick={onOpen}
                    leftIcon={<FaPlus />}
                    borderRadius="lg"
                    fontWeight="800"
                    _hover={{ bg: "#C05621" }}
                  >
                    إضافة أول كورس
                  </Button>
                </VStack>
              </Center>
            ) : (
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
                {filteredCourses.map((course) => (
                  <Box
                    key={course.id}
                    bg={cardBg}
                    borderWidth="1px"
                    borderColor={sectionBorder}
                    borderRadius="2xl"
                    overflow="hidden"
                    transition="all 0.2s"
                    _hover={{
                      borderColor: "#3182CE",
                      transform: "translateY(-3px)",
                      boxShadow: "0 14px 28px -16px rgba(49,130,206,0.45)",
                    }}
                  >
                    <Box position="relative" h={{ base: "140px", md: "150px" }} overflow="hidden">
                      <Image
                        src={course.avatar || "https://placehold.co/600x400/e2e8f0/475569?text=Course"}
                        alt={course.title}
                        w="full"
                        h="full"
                        objectFit="cover"
                      />
                      <Box
                        position="absolute"
                        inset={0}
                        bg="linear-gradient(180deg, transparent 35%, rgba(15,23,42,0.45) 100%)"
                      />
                      <Flex position="absolute" top={2} right={2} left={2} justify="space-between" align="center">
                        <Badge
                          bg={isCourseFree(course) ? "green.500" : "white"}
                          color={isCourseFree(course) ? "white" : "blue.700"}
                          borderRadius="md"
                          fontSize="xs"
                          fontWeight="800"
                          px={2}
                        >
                          {isCourseFree(course) ? "مجاني" : `${course.price} ج.م`}
                        </Badge>
                        <HStack spacing={1}>
                          <IconButton
                            aria-label="تعديل"
                            icon={<FaEdit />}
                            size="xs"
                            bg="white"
                            color="blue.600"
                            borderRadius="md"
                            cursor="pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCourse(course);
                            }}
                          />
                          <IconButton
                            aria-label="حذف"
                            icon={<FaTrash />}
                            size="xs"
                            bg="white"
                            color="red.500"
                            borderRadius="md"
                            cursor="pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCourse(course);
                            }}
                          />
                        </HStack>
                      </Flex>
                    </Box>
                    <Box p={4}>
                      <Badge colorScheme="blue" borderRadius="md" fontSize="xs" mb={2} fontWeight="700">
                        {course?.grade?.name || "بدون صف"}
                      </Badge>
                      <Heading size="sm" color={headingColor} noOfLines={2} mb={1} lineHeight="1.4" fontWeight="800">
                        {course.title}
                      </Heading>
                      <Text fontSize="xs" color={textColor} noOfLines={2} minH="32px" mb={3}>
                        {course.description}
                      </Text>
                      <HStack
                        fontSize="xs"
                        color={mutedTextColor}
                        justify="space-between"
                        pt={2}
                        borderTopWidth="1px"
                        borderColor={dividerBorderColor}
                        mb={3}
                      >
                        <HStack spacing={1}>
                          <Icon as={FaCalendarAlt} color="blue.400" boxSize={3} />
                          <Text>{new Date(course.created_at).toLocaleDateString("ar-EG")}</Text>
                        </HStack>
                      </HStack>
                      <Link to={`/CourseDetailsPage/${course.id}`} style={{ width: "100%" }}>
                        <Button
                          w="full"
                          size="sm"
                          bg="#3182CE"
                          color="white"
                          borderRadius="lg"
                          fontWeight="800"
                          cursor="pointer"
                          _hover={{ bg: "#2B6CB0" }}
                        >
                          إدارة الكورس
                        </Button>
                      </Link>
                    </Box>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </Box>
        </VStack>
      </Container>

      {/* Create Course Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={{ base: "full", md: "3xl", lg: "4xl" }}
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(8px)" />
        <ModalContent
          bg={cardBg}
          borderRadius={{ base: "none", md: "2xl" }}
          overflow="hidden"
          shadow="2xl"
          m={{ base: 0, md: 4 }}
          maxH={{ base: "100vh", md: "92vh" }}
        >
          <Box
            bgGradient={heroBg}
            px={{ base: 4, md: 6 }}
            py={{ base: 4, md: 5 }}
            position="relative"
          >
            <ModalCloseButton
              color="white"
              _hover={{ bg: "whiteAlpha.200" }}
              top={3}
              left={3}
            />
            <HStack spacing={3} align="start" pe={10}>
              <Flex
                w={11}
                h={11}
                rounded="xl"
                bg="whiteAlpha.200"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Icon as={FaPlus} color="white" boxSize={5} />
              </Flex>
              <Box>
                <Text color="white" fontWeight="bold" fontSize={{ base: "lg", md: "xl" }}>
                  إضافة كورس جديد
                </Text>
                <Text color="whiteAlpha.900" fontSize="sm" mt={1}>
                  أدخل بيانات الكورس، حدّد نوعه، وارفع صورة الغلاف
                </Text>
              </Box>
            </HStack>
          </Box>

          <ModalBody px={{ base: 4, md: 6 }} py={{ base: 5, md: 6 }}>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 6, lg: 8 }}>
              {/* العمود الأيمن — النموذج */}
              <VStack spacing={6} align="stretch">
                <CreateCourseModalSection
                  title="المعلومات الأساسية"
                  subtitle="العنوان والوصف يظهران للطلاب في صفحة الكورس"
                >
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="semibold" color={headingColor} mb={1.5}>
                      عنوان الكورس
                    </FormLabel>
                    <Input
                      placeholder="مثال: كورس فيزياء — الصف الثالث الثانوي"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      {...modalInputProps}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="semibold" color={headingColor} mb={1.5}>
                      وصف الكورس
                    </FormLabel>
                    <Textarea
                      placeholder="اكتب وصفاً واضحاً يوضح محتوى الكورس وما سيتعلمه الطالب..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={4}
                      resize="none"
                      {...modalInputProps}
                    />
                  </FormControl>
                </CreateCourseModalSection>

                <CreateCourseModalSection
                  title="التسعير والصف"
                  subtitle="اختر نوع الكورس والمرحلة الدراسية المناسبة"
                >
                  <Box>
                    <Text fontSize="xs" fontWeight="semibold" color={mutedTextColor} mb={2}>
                      نوع الكورس
                    </Text>
                    <SimpleGrid columns={2} spacing={3}>
                      <Box
                        as="button"
                        type="button"
                        onClick={() => setCoursePricingType(false)}
                        p={4}
                        rounded="xl"
                        borderWidth="2px"
                        borderColor={!formData.is_free ? "blue.500" : borderColor}
                        bg={!formData.is_free ? modalAccentBg : cardBg}
                        textAlign="right"
                        transition="all 0.2s"
                        _hover={{ borderColor: "blue.400" }}
                      >
                        <Badge colorScheme="orange" mb={2} fontSize="xs">
                          مدفوع
                        </Badge>
                        <Text fontSize="sm" fontWeight="bold" color={headingColor}>
                          كورس مدفوع
                        </Text>
                        <Text fontSize="xs" color={mutedTextColor} mt={1}>
                          يحتاج كود تفعيل أو تفعيل من المدرّس
                        </Text>
                      </Box>
                      <Box
                        as="button"
                        type="button"
                        onClick={() => setCoursePricingType(true)}
                        p={4}
                        rounded="xl"
                        borderWidth="2px"
                        borderColor={formData.is_free ? "green.500" : borderColor}
                        bg={formData.is_free ? greenBoxBg : cardBg}
                        textAlign="right"
                        transition="all 0.2s"
                        _hover={{ borderColor: "green.400" }}
                      >
                        <Badge colorScheme="green" mb={2} fontSize="xs">
                          مجاني
                        </Badge>
                        <Text fontSize="sm" fontWeight="bold" color={headingColor}>
                          كورس مجاني
                        </Text>
                        <Text fontSize="xs" color={mutedTextColor} mt={1}>
                          متاح مباشرة لكل الطلاب المسجّلين
                        </Text>
                      </Box>
                    </SimpleGrid>
                  </Box>

                  <Flex direction={{ base: "column", sm: "row" }} gap={4}>
                    {!formData.is_free ? (
                      <FormControl isRequired flex={1}>
                        <FormLabel fontSize="sm" fontWeight="semibold" color={headingColor} mb={1.5}>
                          السعر (ج.م)
                        </FormLabel>
                        <NumberInput
                          value={formData.price}
                          onChange={(value) => handleInputChange("price", value)}
                          min={1}
                          max={100000}
                          size={{ base: "sm", md: "md" }}
                        >
                          <NumberInputField {...modalInputProps} placeholder="200" />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    ) : (
                      <Flex
                        flex={1}
                        align="center"
                        px={4}
                        py={3}
                        rounded="lg"
                        bg={greenBoxBg}
                        borderWidth="1px"
                        borderColor={greenBoxBorder}
                      >
                        <Text fontSize="sm" fontWeight="semibold" color={greenBoxText}>
                          السعر: 0 ج.م — كورس مجاني
                        </Text>
                      </Flex>
                    )}

                    <FormControl isRequired flex={1}>
                      <FormLabel fontSize="sm" fontWeight="semibold" color={headingColor} mb={1.5}>
                        المرحلة الدراسية
                      </FormLabel>
                      <Select
                        placeholder="اختر الصف"
                        value={formData.grade_id}
                        onChange={(e) => handleInputChange("grade_id", e.target.value)}
                        {...modalInputProps}
                      >
                        {grades.map((grade) => (
                          <option key={grade.id} value={grade.id}>
                            {grade.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </Flex>
                </CreateCourseModalSection>
              </VStack>

              {/* العمود الأيسر — صورة الغلاف */}
              <Box>
                <CreateCourseModalSection
                  title="صورة الغلاف"
                  subtitle="صورة جذابة تزيد من ثقة الطلاب — اختيارية"
                >
                  <Input
                    ref={createAvatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    display="none"
                  />

                  {avatarPreview ? (
                    <Box position="relative" rounded="xl" overflow="hidden" borderWidth="1px" borderColor={borderColor}>
                      <Image
                        src={avatarPreview}
                        alt="معاينة صورة الكورس"
                        w="full"
                        h={{ base: "200px", lg: "280px" }}
                        objectFit="cover"
                      />
                      <Flex
                        position="absolute"
                        inset={0}
                        bg="blackAlpha.400"
                        opacity={0}
                        _hover={{ opacity: 1 }}
                        transition="opacity 0.2s"
                        align="center"
                        justify="center"
                        gap={2}
                      >
                        <Button
                          size="sm"
                          colorScheme="blue"
                          leftIcon={<FaImage />}
                          onClick={() => createAvatarInputRef.current?.click()}
                        >
                          تغيير الصورة
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          leftIcon={<FaTrash />}
                          onClick={clearAvatar}
                        >
                          حذف
                        </Button>
                      </Flex>
                    </Box>
                  ) : (
                    <Flex
                      direction="column"
                      align="center"
                      justify="center"
                      minH={{ base: "200px", lg: "280px" }}
                      rounded="xl"
                      borderWidth="2px"
                      borderStyle="dashed"
                      borderColor={inputBorderColor}
                      bg={modalFieldBg}
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ borderColor: "blue.400", bg: modalAccentBg }}
                      onClick={() => createAvatarInputRef.current?.click()}
                      px={6}
                      py={8}
                      textAlign="center"
                    >
                      <Flex
                        w={14}
                        h={14}
                        rounded="2xl"
                        bg={modalAccentBg}
                        align="center"
                        justify="center"
                        mb={4}
                      >
                        <Icon as={FaImage} boxSize={6} color="blue.500" />
                      </Flex>
                      <Text fontWeight="semibold" color={headingColor} fontSize="sm">
                        اسحب الصورة أو انقر للرفع
                      </Text>
                      <Text fontSize="xs" color={mutedTextColor} mt={2}>
                        PNG أو JPG — حد أقصى 5 ميجابايت
                      </Text>
                    </Flex>
                  )}

                  <Box
                    p={4}
                    rounded="xl"
                    bg={modalAccentBg}
                    borderWidth="1px"
                    borderColor={modalTipBorder}
                  >
                    <HStack align="start" spacing={3}>
                      <Icon as={FaBookOpen} color="blue.500" mt={0.5} flexShrink={0} />
                      <Text fontSize="xs" color={textColor} lineHeight="1.7">
                        يُفضّل استخدام صورة بنسبة 16:9 بجودة واضحة. تظهر الصورة في صفحة
                        الكورس وفي قائمة الكورسات للطلاب.
                      </Text>
                    </HStack>
                  </Box>
                </CreateCourseModalSection>
              </Box>
            </SimpleGrid>
          </ModalBody>

          <ModalFooter
            bg={modalFooterBg}
            borderTop="1px solid"
            borderColor={borderColor}
            px={{ base: 4, md: 6 }}
            py={4}
            gap={3}
            flexDirection={{ base: "column-reverse", sm: "row" }}
          >
            <Button
              variant="outline"
              onClick={onClose}
              w={{ base: "full", sm: "auto" }}
              borderRadius="lg"
              isDisabled={formLoading}
            >
              إلغاء
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateCourse}
              isLoading={formLoading}
              loadingText="جاري الإنشاء..."
              w={{ base: "full", sm: "auto" }}
              borderRadius="lg"
              px={8}
              leftIcon={<FaPlus />}
            >
              إنشاء الكورس
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Course Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={onEditClose}
        size={{ base: "full", sm: "full", md: "lg", lg: "xl", xl: "2xl" }}
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
        <ModalContent
          bg={cardBg}
          borderRadius={{ base: "none", sm: "none", md: "xl", lg: "2xl" }}
          shadow={{ base: "none", md: "2xl" }}
          m={{ base: 0, sm: 0, md: 4, lg: 6 }}
          maxH={{ base: "100vh", sm: "100vh", md: "90vh", lg: "85vh" }}
          maxW={{ base: "100%", sm: "100%", md: "90%", lg: "80%", xl: "70%" }}
        >
          <ModalHeader
            borderBottom="1px solid"
            borderColor={borderColor}
            p={{ base: 4, md: 6 }}
          >
            <HStack spacing={3}>
              <Icon as={FaEdit} color="blue.500" boxSize={{ base: 5, md: 6 }} />
              <Text fontWeight="bold" fontSize={{ base: "md", md: "lg" }}>
                تعديل الكورس
              </Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={{ base: 4, md: 6 }} px={{ base: 4, md: 6 }}>
            <VStack spacing={{ base: 4, md: 6 }} align="stretch">
              {/* Avatar Upload */}
              <FormControl>
                <FormLabel
                  fontWeight="bold"
                  color={headingColor}
                  fontSize={{ base: "sm", md: "md" }}
                >
                  صورة الكورس
                </FormLabel>
                <VStack spacing={4}>
                  {/* Current Avatar Preview */}
                  {editAvatarPreview && (
                    <Box position="relative">
                      <Image
                        src={editAvatarPreview}
                        alt="صورة الكورس الحالية"
                        boxSize={{ base: "120px", md: "150px" }}
                        objectFit="cover"
                        borderRadius="xl"
                        border="3px solid"
                        borderColor="blue.200"
                        shadow="lg"
                      />
                      <IconButton
                        icon={<FaTimes />}
                        size="sm"
                        colorScheme="red"
                        variant="solid"
                        borderRadius="full"
                        position="absolute"
                        top={-2}
                        right={-2}
                        onClick={() => {
                          setEditData((prev) => ({ ...prev, avatar: null }));
                          setEditAvatarPreview(null);
                        }}
                        aria-label="إزالة الصورة"
                      />
                    </Box>
                  )}

                  {/* Remove Current Image Button */}
                  {editAvatarPreview && (
                    <Button
                      leftIcon={<FaTrash />}
                      colorScheme="red"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditData((prev) => ({ ...prev, avatar: null }));
                        setEditAvatarPreview(null);
                      }}
                    >
                      إزالة الصورة الحالية
                    </Button>
                  )}

                  {/* Upload Button */}
                  <Box>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleEditAvatarChange}
                      display="none"
                      id="edit-avatar-upload"
                    />
                    <Button
                      as="label"
                      htmlFor="edit-avatar-upload"
                      leftIcon={<FaImage />}
                      colorScheme="blue"
                      variant="outline"
                      size={{ base: "sm", md: "md" }}
                      cursor="pointer"
                      borderRadius="xl"
                      border="2px dashed"
                      borderColor="blue.300"
                      _hover={{
                        borderColor: "blue.500",
                        bg: "blue.50",
                      }}
                    >
                      {editAvatarPreview ? "تغيير الصورة" : "اختر صورة للكورس"}
                    </Button>
                  </Box>

                  <Text fontSize="xs" color={mutedTextColor} textAlign="center">
                    الصور المقبولة: JPG, PNG, GIF (حد أقصى 5MB)
                  </Text>

                  {!editAvatarPreview && (
                    <Text
                      fontSize="sm"
                      color={useColorModeValue("blue.600", "blue.300")}
                      textAlign="center"
                      fontWeight="medium"
                    >
                      💡 يمكنك إضافة صورة للكورس أو تغيير الصورة الحالية
                    </Text>
                  )}
                </VStack>
              </FormControl>

              <FormControl isRequired>
                <FormLabel
                  fontWeight="bold"
                  color={headingColor}
                  fontSize={{ base: "sm", md: "md" }}
                >
                  عنوان الكورس
                </FormLabel>
                <Input
                  placeholder="مثال: كورس فيزياء أولى ثانوي"
                  value={editData.title}
                  onChange={(e) => handleEditChange("title", e.target.value)}
                  borderRadius="xl"
                  border="2px solid"
                  borderColor={inputBorderColor}
                  bg={cardBg}
                  _focus={{ borderColor: "blue.500" }}
                  size={{ base: "sm", md: "md" }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel
                  fontWeight="bold"
                  color={headingColor}
                  fontSize={{ base: "sm", md: "md" }}
                >
                  وصف الكورس
                </FormLabel>
                <Textarea
                  placeholder="اكتب وصفاً مفصلاً للكورس..."
                  value={editData.description}
                  onChange={(e) =>
                    handleEditChange("description", e.target.value)
                  }
                  borderRadius="xl"
                  rows={{ base: 3, md: 4 }}
                  border="2px solid"
                  borderColor={inputBorderColor}
                  bg={cardBg}
                  _focus={{ borderColor: "blue.500" }}
                  size={{ base: "sm", md: "md" }}
                />
              </FormControl>

              <FormControl
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                p={4}
                borderWidth="1px"
                borderColor={inputBorderColor}
                borderRadius="xl"
              >
                <Box flex={1} pe={4}>
                  <FormLabel mb={0} fontWeight="bold" color={headingColor} fontSize={{ base: "sm", md: "md" }}>
                    كورس مجاني
                  </FormLabel>
                  <Text fontSize="xs" color={mutedTextColor} mt={1}>
                    المحتوى متاح مباشرة للطلاب المسجّلين بدون كود تفعيل
                  </Text>
                </Box>
                <Switch
                  colorScheme="green"
                  isChecked={editData.is_free}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setEditData((prev) => ({
                      ...prev,
                      is_free: checked,
                      price: checked ? 0 : prev.price || "",
                    }));
                  }}
                />
              </FormControl>

              <Flex
                direction={{ base: "column", sm: "row" }}
                gap={4}
                wrap="wrap"
              >
                {!editData.is_free ? (
                  <FormControl
                    isRequired
                    flex={1}
                    minW={{ base: "100%", sm: "140px" }}
                  >
                    <FormLabel
                      fontWeight="bold"
                      color={headingColor}
                      fontSize={{ base: "sm", md: "md" }}
                    >
                      السعر (ج.م)
                    </FormLabel>
                    <NumberInput
                      value={editData.price}
                      onChange={(value) => handleEditChange("price", value)}
                      min={1}
                      max={100000}
                      size={{ base: "sm", md: "md" }}
                    >
                      <NumberInputField
                        borderRadius="xl"
                        border="2px solid"
                        borderColor={inputBorderColor}
                        bg={cardBg}
                        _focus={{ borderColor: "blue.500" }}
                      />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                ) : (
                  <Box
                    flex={1}
                    minW={{ base: "100%", sm: "140px" }}
                    p={4}
                    borderRadius="xl"
                    bg={greenBoxBg}
                    borderWidth="1px"
                    borderColor={greenBoxBorder}
                  >
                    <Text fontSize="sm" fontWeight="semibold" color={greenBoxText}>
                      السعر: مجاني (0 ج.م)
                    </Text>
                  </Box>
                )}

                <FormControl isRequired flex={1}>
                  <FormLabel
                    fontWeight="bold"
                    color={headingColor}
                    fontSize={{ base: "sm", md: "md" }}
                  >
                    المرحلة الدراسية
                  </FormLabel>
                  <Select
                    placeholder="اختر المرحلة"
                    value={editData.grade_id}
                    onChange={(e) =>
                      handleEditChange("grade_id", e.target.value)
                    }
                    borderRadius="xl"
                    border="2px solid"
                    borderColor={inputBorderColor}
                    bg={cardBg}
                    _focus={{ borderColor: "blue.500" }}
                    size={{ base: "sm", md: "md" }}
                  >
                    {grades.map((grade) => (
                      <option key={grade.id} value={grade.id}>
                        {grade.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </Flex>
            </VStack>
          </ModalBody>
          <ModalFooter
            borderTop="1px solid"
            borderColor={borderColor}
            p={{ base: 4, md: 6 }}
            flexDirection={{ base: "column", sm: "row" }}
            gap={{ base: 3, sm: 0 }}
          >
            <Button
              variant="ghost"
              mr={{ base: 0, sm: 3 }}
              onClick={onEditClose}
              w={{ base: "full", sm: "auto" }}
              size={{ base: "sm", md: "md" }}
            >
              إلغاء
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleUpdateCourse}
              isLoading={editLoading}
              loadingText="جاري التحديث..."
              w={{ base: "full", sm: "auto" }}
              size={{ base: "sm", md: "md" }}
            >
              تحديث الكورس
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
        isCentered
        size={{ base: "xs", sm: "sm", md: "md", lg: "lg" }}
      >
        <AlertDialogOverlay>
          <AlertDialogContent
            bg={cardBg}
            borderRadius={{ base: "lg", sm: "xl", md: "2xl" }}
            m={{ base: 3, sm: 4, md: 0 }}
            maxW={{ base: "95%", sm: "90%", md: "md", lg: "lg" }}
          >
            <AlertDialogHeader
              fontSize={{ base: "md", md: "lg" }}
              fontWeight="bold"
              color={headingColor}
              p={{ base: 4, md: 6 }}
            >
              تأكيد حذف الكورس
            </AlertDialogHeader>
            <AlertDialogBody p={{ base: 4, md: 6 }} pt={0}>
              <Text
                color={textColor}
                fontSize={{ base: "sm", md: "md" }}
                lineHeight={{ base: 1.5, md: 1.6 }}
              >
                هل أنت متأكد من حذف الكورس "{courseToDelete?.title}"؟ هذا
                الإجراء لا يمكن التراجع عنه.
              </Text>
            </AlertDialogBody>
            <AlertDialogFooter
              p={{ base: 4, md: 6 }}
              pt={0}
              flexDirection={{ base: "column", sm: "row" }}
              gap={{ base: 3, sm: 0 }}
            >
              <Button
                ref={cancelRef}
                onClick={onDeleteClose}
                w={{ base: "full", sm: "auto" }}
                size={{ base: "sm", md: "md" }}
              >
                إلغاء
              </Button>
              <Button
                colorScheme="red"
                onClick={handleConfirmDelete}
                ml={{ base: 0, sm: 3 }}
                isLoading={deleteLoading}
                loadingText="جاري الحذف..."
                w={{ base: "full", sm: "auto" }}
                size={{ base: "sm", md: "md" }}
              >
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <ScrollToTop />
    </Box>
  );
};

export default TeacherDashboardHome;
