import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  InputGroup,
  InputRightElement,
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
  Checkbox,
  CheckboxGroup,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
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
  FaSearch,
  FaSortAmountDown,
  FaChevronLeft,
  FaChevronRight,
  FaFolderOpen,
  FaSync,
  FaBuilding,
  FaFire,
  FaCompass,
} from "react-icons/fa";
import { MdAssignment, MdQuiz, MdLibraryBooks } from "react-icons/md";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import baseUrl from "../../api/baseUrl";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import TeacherSubscriptionExpiryAlert from "../../components/teacher/TeacherSubscriptionExpiryAlert";
import { useTeacherSubscriptionExpiryAlert } from "../../Hooks/useTeacherSubscriptionExpiryAlert";
import InstallPWAButton from "../../components/pwa/InstallPWAButton";
import TeacherDashboardTour from "../../components/onboarding/TeacherDashboardTour";
import {
  shouldShowTeacherDashboardTour,
  resetTeacherDashboardTour,
  TOUR_OPEN_CREATE_COURSE,
  TOUR_CLOSE_CREATE_COURSE,
} from "../../utils/teacherDashboardTour";

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

function QuickLinkCard({ link, isSlide = false }) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bg = useColorModeValue("white", "gray.800");
  const titleColor = useColorModeValue("gray.800", "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const isOrange = link.color === "orange";
  const accent = isOrange ? "#DD6B20" : "#3182CE";
  const iconBg = isOrange ? "orange.50" : "blue.50";
  const iconColor = isOrange ? "orange.500" : "blue.500";
  const iconDark = isOrange
    ? "linear(to-br, #F6AD55, #DD6B20)"
    : "linear(to-br, #63B3ED, #2B6CB0)";
  const chevronBg = useColorModeValue("gray.50", "whiteAlpha.100");

  return (
    <Box
      p={isSlide ? 5 : 4}
      bg={bg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius={isSlide ? "2xl" : "xl"}
      h="full"
      minH={isSlide ? "168px" : undefined}
      cursor="pointer"
      position="relative"
      overflow="hidden"
      transition="all 0.25s ease"
      _hover={{
        borderColor: accent,
        transform: "translateY(-3px)",
        boxShadow: `0 16px 32px -16px ${accent}aa`,
      }}
    >
      <Box
        position="absolute"
        top={0}
        insetInlineEnd={0}
        w="88px"
        h="88px"
        bg={accent}
        opacity={0.06}
        borderBottomStartRadius="full"
        pointerEvents="none"
      />
      <Flex align="center" justify="space-between" mb={isSlide ? 4 : 3}>
        <Flex
          w={isSlide ? 12 : 10}
          h={isSlide ? 12 : 10}
          borderRadius="xl"
          bg={isSlide ? undefined : iconBg}
          bgGradient={isSlide ? iconDark : undefined}
          color={isSlide ? "white" : iconColor}
          align="center"
          justify="center"
          boxShadow={isSlide ? `0 10px 18px -10px ${accent}` : "none"}
        >
          <Icon as={link.icon} boxSize={isSlide ? 5 : 4} />
        </Flex>
        <Flex
          w={8}
          h={8}
          borderRadius="full"
          bg={chevronBg}
          color={muted}
          align="center"
          justify="center"
        >
          <Icon as={FaChevronLeft} boxSize={3} />
        </Flex>
      </Flex>
      <Text fontWeight="800" fontSize={isSlide ? "md" : "sm"} color={titleColor} noOfLines={1} mb={1}>
        {link.title}
      </Text>
      <Text fontSize="xs" color={muted} noOfLines={2} lineHeight="1.7">
        {link.description}
      </Text>
    </Box>
  );
}

function QuickLinksSlider({ links }) {
  const scrollerRef = useRef(null);
  const [active, setActive] = useState(0);
  const trackBg = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const arrowBg = useColorModeValue("white", "gray.700");
  const arrowBorder = useColorModeValue("gray.200", "gray.600");

  const updateActive = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const cards = el.querySelectorAll("[data-quick-card]");
    if (!cards.length) return;
    const parentCenter = el.getBoundingClientRect().left + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    cards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      const dist = Math.abs(rect.left + rect.width / 2 - parentCenter);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    setActive(best);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    updateActive();
    el.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);
    return () => {
      el.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [updateActive, links.length]);

  const scrollToIndex = (index) => {
    const next = Math.max(0, Math.min(links.length - 1, index));
    const el = scrollerRef.current;
    const card = el?.querySelectorAll("[data-quick-card]")[next];
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  return (
    <Box position="relative" role="region" aria-roledescription="carousel" aria-label="الوصول السريع">
      <IconButton
        aria-label="السابق"
        icon={<FaChevronRight />}
        size="md"
        display={{ base: "none", md: "inline-flex" }}
        position="absolute"
        top="40%"
        insetInlineStart={1}
        transform="translateY(-50%)"
        zIndex={2}
        bg={arrowBg}
        border="1px solid"
        borderColor={arrowBorder}
        borderRadius="full"
        boxShadow="lg"
        isDisabled={active <= 0}
        onClick={() => scrollToIndex(active - 1)}
      />
      <IconButton
        aria-label="التالي"
        icon={<FaChevronLeft />}
        size="md"
        display={{ base: "none", md: "inline-flex" }}
        position="absolute"
        top="40%"
        insetInlineEnd={1}
        transform="translateY(-50%)"
        zIndex={2}
        bg={arrowBg}
        border="1px solid"
        borderColor={arrowBorder}
        borderRadius="full"
        boxShadow="lg"
        isDisabled={active >= links.length - 1}
        onClick={() => scrollToIndex(active + 1)}
      />

      <Box
        ref={scrollerRef}
        display="flex"
        overflowX="auto"
        gap={{ base: 3, md: 4 }}
        px={{ base: 1, md: 10 }}
        py={1}
        mx={-1}
        scrollSnapType="x mandatory"
        scrollPaddingInline="12px"
        sx={{
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {links.map((link) => (
          <Box
            key={link.id}
            data-quick-card
            flex={{ base: "0 0 78%", sm: "0 0 52%", md: "0 0 36%", lg: "0 0 23.5%" }}
            maxW={{ base: "320px", lg: "none" }}
            scrollSnapAlign="start"
          >
            <Link to={link.link} style={{ textDecoration: "none", display: "block", height: "100%" }}>
              <QuickLinkCard link={link} isSlide />
            </Link>
          </Box>
        ))}
      </Box>

      <Flex align="center" justify="center" gap={3} mt={4}>
        <IconButton
          aria-label="السابق"
          icon={<FaChevronRight />}
          size="sm"
          variant="ghost"
          borderRadius="full"
          display={{ base: "inline-flex", md: "none" }}
          isDisabled={active <= 0}
          onClick={() => scrollToIndex(active - 1)}
        />
        <HStack spacing={1.5}>
          {links.map((link, i) => (
            <Box
              key={link.id}
              as="button"
              aria-label={`البطاقة ${i + 1}`}
              onClick={() => scrollToIndex(i)}
              w={i === active ? 6 : 2}
              h={2}
              borderRadius="full"
              bg={i === active ? "#3182CE" : trackBg}
              transition="all 0.2s"
            />
          ))}
        </HStack>
        <IconButton
          aria-label="التالي"
          icon={<FaChevronLeft />}
          size="sm"
          variant="ghost"
          borderRadius="full"
          display={{ base: "inline-flex", md: "none" }}
          isDisabled={active >= links.length - 1}
          onClick={() => scrollToIndex(active + 1)}
        />
      </Flex>
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

function normalizeGradeIds(value) {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .map((v) => Number(v))
        .filter((n) => Number.isFinite(n) && n > 0),
    ),
  ];
}

function getCourseGradeIds(course) {
  if (!course) return [];
  if (Array.isArray(course.grade_ids) && course.grade_ids.length) {
    return normalizeGradeIds(course.grade_ids);
  }
  if (Array.isArray(course.grades) && course.grades.length) {
    return normalizeGradeIds(course.grades.map((g) => g?.id));
  }
  const single = course.grade_id ?? course.grade?.id;
  return single != null && single !== "" ? normalizeGradeIds([single]) : [];
}

function getCourseGradeLabel(course) {
  if (Array.isArray(course?.grades) && course.grades.length) {
    return course.grades.map((g) => g?.name).filter(Boolean).join(" · ") || "بدون صف";
  }
  return course?.grade?.name || "بدون صف";
}

function validateCourseForm({ title, description, grade_ids, is_free, price }) {
  if (!String(title || "").trim()) return "عنوان الكورس مطلوب";
  if (!String(description || "").trim()) return "وصف الكورس مطلوب";
  if (!normalizeGradeIds(grade_ids).length) return "اختر صفًا دراسيًا واحدًا على الأقل";
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

function appendCourseGradeIds(formData, grade_ids) {
  const ids = normalizeGradeIds(grade_ids);
  formData.append("grade_ids", ids.join(","));
  if (ids.length === 1) {
    formData.append("grade_id", String(ids[0]));
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
  const [courseSearch, setCourseSearch] = useState("");
  const [courseSort, setCourseSort] = useState("newest");
  const [alertRefreshing, setAlertRefreshing] = useState(false);
  const [dashboardTourOpen, setDashboardTourOpen] = useState(false);
  const {
    alert: subscriptionAlert,
    refresh: refreshSubscriptionAlert,
  } = useTeacherSubscriptionExpiryAlert({ days: 3, grace_days: 3 });

  useEffect(() => {
    if (!shouldShowTeacherDashboardTour()) return undefined;
    const timer = window.setTimeout(() => setDashboardTourOpen(true), 800);
    return () => window.clearTimeout(timer);
  }, []);

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
  const toast = useToast();

  useEffect(() => {
    const openCreate = () => onOpen();
    const closeCreate = () => onClose();
    window.addEventListener(TOUR_OPEN_CREATE_COURSE, openCreate);
    window.addEventListener(TOUR_CLOSE_CREATE_COURSE, closeCreate);
    return () => {
      window.removeEventListener(TOUR_OPEN_CREATE_COURSE, openCreate);
      window.removeEventListener(TOUR_CLOSE_CREATE_COURSE, closeCreate);
    };
  }, [onOpen, onClose]);
  const cancelRef = useRef();
  const [formData, setFormData] = useState({
    title: "",
    price: 0,
    description: "",
    grade_ids: [],
    is_free: false,
  });
  const [courseAvatar, setCourseAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [editData, setEditData] = useState({
    id: null,
    title: "",
    price: 0,
    description: "",
    grade_ids: [],
    avatar: null,
    is_free: false,
  });
  const [editAvatarPreview, setEditAvatarPreview] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      id: 12,
      title: "مكتبة الأسئلة",
      description: "أسئلتك الخاصة وقطع القراءة",
      icon: MdLibraryBooks,
      color: "orange",
      link: "/QuestionLibraryPage",
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
      id: 11,
      title: "المسابقات اليومية",
      description: "إنشاء ونشر مسابقات يومية مع ترتيب",
      icon: FaFire,
      color: "orange",
      link: "/teacher-daily-quizzes",
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

  // كورسات المدرس مع كاش — لا يُعاد الجلب تلقائياً عند الرجوع للصفحة
  const {
    data: courses = [],
    isLoading: loading,
    error: coursesError,
    refetch: refetchCourses,
  } = useQuery({
    queryKey: ["teacherCourses", user?.id],
    queryFn: async () => {
      if (!token) throw new Error("No token found");
      const response = await baseUrl.get("api/course/my-courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.courses || [];
    },
    enabled: !!token,
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  // الصفوف مع كاش طويل (نادراً ما تتغير)
  const { data: grades = [] } = useQuery({
    queryKey: ["teacherGrades", user?.id],
    queryFn: async () => {
      const response = await baseUrl.get("api/teacher/grades", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.grades || [];
    },
    enabled: !!token,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // المواد والمجموعات مع كاش
  const {
    data: subjects = [],
    refetch: refetchSubjects,
  } = useQuery({
    queryKey: ["teacherSubjects", user?.id],
    queryFn: async () => {
      const response = await baseUrl.get("/api/teacher/package-subjects/groups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.subjects || [];
    },
    enabled: !!token,
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
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
  const heroShadow = useColorModeValue(
    "0 28px 60px -28px rgba(10, 50, 102, 0.55)",
    "0 28px 60px -28px rgba(0,0,0,0.7)",
  );
  const sectionCardBg = useColorModeValue("white", "gray.800");
  const sectionBorder = useColorModeValue("gray.200", "gray.700");
  const courseImageBg = useColorModeValue("gray.100", "gray.700");
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
  const teacherGreeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "صباح الخير";
    if (hour < 17) return "أهلاً بك";
    return "مساء الخير";
  })();
  const todayLabel = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

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
      appendCourseGradeIds(formDataToSend, formData.grade_ids);
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

      setFormData({ title: "", price: 0, description: "", grade_ids: [], is_free: false });
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
      grade_ids: getCourseGradeIds(course),
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
      appendCourseGradeIds(payload, editData.grade_ids);
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
        grade_ids: [],
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

  const filteredCourses = useMemo(() => {
    const query = courseSearch.trim().toLowerCase();
    const gradeId = selectedGrade ? parseInt(selectedGrade, 10) : null;

    const next = courses.filter((course) => {
      if (Number.isFinite(gradeId) && !getCourseGradeIds(course).includes(gradeId)) {
        return false;
      }
      if (!query) return true;
      const haystack = [course.title, course.description, getCourseGradeLabel(course)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

    const stamp = (course) => {
      const raw = course.created_at || course.createdAt || course.updated_at;
      const t = raw ? new Date(raw).getTime() : Number(course.id) || 0;
      return Number.isFinite(t) ? t : 0;
    };

    next.sort((a, b) => {
      const diff = stamp(b) - stamp(a);
      return courseSort === "oldest" ? -diff : diff;
    });

    return next;
  }, [courses, selectedGrade, courseSearch, courseSort]);

  const hasCourseFilters = Boolean(selectedGrade || courseSearch.trim());

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
            data-tour-id="teacher-hero"
            color="white"
            borderRadius={{ base: "2xl", md: "3xl" }}
            overflow="hidden"
            position="relative"
            boxShadow={heroShadow}
            bg="linear-gradient(125deg, #082B57 0%, #0E4C92 46%, #1A6BB8 100%)"
          >
            <Box
              position="absolute"
              inset={0}
              pointerEvents="none"
              bgImage="radial-gradient(ellipse 80% 70% at 0% 0%, rgba(237,137,54,0.28), transparent 42%), radial-gradient(ellipse 70% 80% at 100% 100%, rgba(255,255,255,0.16), transparent 50%), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)"
              bgSize="auto, auto, 28px 28px, 28px 28px"
            />
            <Box
              position="absolute"
              top="-80px"
              insetInlineEnd="-60px"
              w="240px"
              h="240px"
              borderRadius="full"
              bg="whiteAlpha.200"
              filter="blur(8px)"
              pointerEvents="none"
            />
            <Box
              position="absolute"
              bottom={0}
              insetInline={0}
              h="3px"
              bg="linear-gradient(90deg, #F6AD55, #DD6B20, transparent)"
            />

            <Flex
              position="relative"
              direction={{ base: "column", lg: "row" }}
              align={{ base: "stretch", lg: "center" }}
              justify="space-between"
              gap={{ base: 5, lg: 8 }}
              px={{ base: 5, md: 7 }}
              py={{ base: 6, md: 8 }}
            >
              <HStack spacing={{ base: 4, md: 5 }} align="center" minW={0}>
                <Box position="relative" flexShrink={0}>
                  <Box
                    position="absolute"
                    inset="-5px"
                    borderRadius="full"
                    bg="linear-gradient(135deg, #F6AD55, transparent 62%)"
                    opacity={0.9}
                  />
                  <Image
                    src={user.avatar || "https://placehold.co/100x100?text=User"}
                    alt={teacherDisplayName}
                    w={{ base: "72px", md: "88px" }}
                    h={{ base: "72px", md: "88px" }}
                    borderRadius="full"
                    border="3px solid"
                    borderColor="white"
                    boxShadow="0 12px 30px -12px rgba(0,0,0,0.45)"
                    objectFit="cover"
                    position="relative"
                    zIndex={1}
                  />
                  <Box
                    position="absolute"
                    bottom="3px"
                    insetInlineEnd="3px"
                    w={3.5}
                    h={3.5}
                    bg="green.400"
                    borderRadius="full"
                    border="2px solid white"
                    zIndex={2}
                  />
                </Box>
                <Box minW={0}>
                  <HStack spacing={2} mb={2} flexWrap="wrap">
                    <Badge
                      borderRadius="full"
                      px={3}
                      py={0.5}
                      bg="whiteAlpha.200"
                      color="white"
                      fontWeight="800"
                      fontSize="xs"
                      letterSpacing="0.02em"
                    >
                      مساحة المدرس
                    </Badge>
                    <Text fontSize="xs" color="whiteAlpha.800" fontWeight="600">
                      {todayLabel}
                    </Text>
                  </HStack>
                  <Heading
                    as="h1"
                    fontSize={{ base: "xl", md: "3xl" }}
                    fontWeight="900"
                    color="white"
                    noOfLines={1}
                    fontFamily="'Noto Naskh Arabic', 'Noto Sans Arabic', serif"
                    letterSpacing="-0.03em"
                    lineHeight="1.25"
                  >
                    {teacherGreeting}، {teacherDisplayName}
                  </Heading>
                  <Text mt={2} fontSize={{ base: "sm", md: "md" }} color="whiteAlpha.850" noOfLines={2} maxW="lg">
                    أدِر كورساتك وموادك وتواصل مع طلابك من لوحة واحدة واضحة واحترافية.
                  </Text>
                </Box>
              </HStack>

              <Flex
                gap={2}
                flexWrap="wrap"
                align="center"
                bg={{ base: "whiteAlpha.100", lg: "whiteAlpha.150" }}
                border="1px solid"
                borderColor="whiteAlpha.250"
                borderRadius="2xl"
                p={{ base: 3, md: 3.5 }}
                backdropFilter="blur(10px)"
              >
                <Button
                  data-tour-id="teacher-create-course-trigger"
                  leftIcon={<FaPlus />}
                  size="sm"
                  bg="#DD6B20"
                  color="white"
                  borderRadius="xl"
                  fontWeight="800"
                  cursor="pointer"
                  onClick={onOpen}
                  _hover={{ bg: "#C05621" }}
                  flex={{ base: 1, sm: "initial" }}
                  shadow="0 10px 20px -12px rgba(221,107,32,0.9)"
                >
                  كورس جديد
                </Button>
                <Button
                  leftIcon={<FaSync />}
                  size="sm"
                  variant="ghost"
                  color="white"
                  borderRadius="xl"
                  fontWeight="700"
                  cursor="pointer"
                  onClick={handleRefreshDashboard}
                  isLoading={alertRefreshing}
                  _hover={{ bg: "whiteAlpha.200" }}
                  flex={{ base: 1, sm: "initial" }}
                >
                  تحديث
                </Button>
                <InstallPWAButton
                  label="تثبيت التطبيق"
                  variant="hero"
                  className="!w-auto !py-2 !px-4 !text-xs !rounded-xl flex-[1] sm:flex-initial"
                />
                <Button
                  data-tour-id="teacher-tour-restart"
                  leftIcon={<FaCompass />}
                  size="sm"
                  variant="ghost"
                  color="white"
                  borderRadius="xl"
                  fontWeight="700"
                  cursor="pointer"
                  onClick={() => {
                    resetTeacherDashboardTour();
                    setDashboardTourOpen(true);
                  }}
                  _hover={{ bg: "whiteAlpha.200" }}
                  flex={{ base: 1, sm: "initial" }}
                >
                  جولة المنصة
                </Button>
              </Flex>
            </Flex>
          </Box>

          <Box data-tour-id="teacher-subscription-alert">
            <TeacherSubscriptionExpiryAlert
              alert={subscriptionAlert}
              onRefresh={refreshSubscriptionAlert}
              refreshing={alertRefreshing}
            />
          </Box>

          {/* KPIs */}
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3} data-tour-id="teacher-kpis">
            <KpiCard icon={FaBookOpen} label="كورساتي" value={courses.length} accent="blue" />
            <KpiCard icon={FaUsers} label="المواد الدراسية" value={subjects.length} accent="orange" />
            <KpiCard icon={MdAssignment} label="المجموعات" value={totalGroups} accent="green" />
          </SimpleGrid>

          {/* Quick Links */}
          <Box
            data-tour-id="teacher-quick-links"
            bg={sectionCardBg}
            borderWidth="1px"
            borderColor={sectionBorder}
            borderRadius="2xl"
            p={{ base: 4, md: 5 }}
            overflow="hidden"
          >
            <Flex align="end" justify="space-between" mb={{ base: 3, md: 4 }} gap={3}>
              <Box>
                <SectionTitle>الوصول السريع</SectionTitle>
                <Text fontSize="xs" color={mutedTextColor} mt={1}>
                  اسحب أو استخدم الأسهم للتنقل بين أدوات التدريس
                </Text>
              </Box>
            </Flex>

            <QuickLinksSlider links={quickLinks} />
          </Box>

          {/* Courses */}
          <Box data-tour-id="teacher-courses">
            <Flex
              mb={3}
              direction={{ base: "column", sm: "row" }}
              align={{ base: "stretch", sm: "center" }}
              justify="space-between"
              gap={3}
            >
              <Box>
                <SectionTitle>كورساتي</SectionTitle>
                <Text fontSize="xs" color={mutedTextColor} mt={1}>
                  {filteredCourses.length} من {courses.length} كورس
                </Text>
              </Box>
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

            <Flex
              data-tour-id="teacher-courses-toolbar"
              mb={4}
              direction={{ base: "column", md: "row" }}
              gap={2}
              align={{ base: "stretch", md: "center" }}
            >
              <InputGroup size="sm" flex="1">
                <Input
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="ابحث عن كورس بالاسم أو الوصف..."
                  bg={sectionCardBg}
                  borderRadius="lg"
                  borderColor={sectionBorder}
                  pr={9}
                />
                <InputRightElement pointerEvents="none" h="full">
                  <Icon as={FaSearch} color="blue.400" boxSize={3.5} />
                </InputRightElement>
              </InputGroup>
              <Select
                placeholder="كل الصفوف"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                w={{ base: "full", md: "180px" }}
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
              <Select
                value={courseSort}
                onChange={(e) => setCourseSort(e.target.value)}
                w={{ base: "full", md: "170px" }}
                bg={sectionCardBg}
                borderRadius="lg"
                borderColor={sectionBorder}
                size="sm"
                icon={<Icon as={FaSortAmountDown} color="orange.500" />}
              >
                <option value="newest">الأحدث أولاً</option>
                <option value="oldest">الأقدم أولاً</option>
              </Select>
            </Flex>

            <Box data-tour-id="teacher-courses-list">
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
                    <Icon as={hasCourseFilters ? FaSearch : FaBookOpen} boxSize={6} color="#3182CE" />
                  </Flex>
                  <Text color={headingColor} fontWeight="800">
                    {hasCourseFilters ? "لا توجد نتائج" : "لا توجد كورسات بعد"}
                  </Text>
                  <Text color={mutedTextColor} fontSize="sm">
                    {hasCourseFilters
                      ? "جرّب تغيير البحث أو الصف"
                      : "ابدأ بإنشاء أول كورس لطلابك"}
                  </Text>
                  {hasCourseFilters ? (
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="blue"
                      borderRadius="lg"
                      fontWeight="800"
                      cursor="pointer"
                      onClick={() => {
                        setCourseSearch("");
                        setSelectedGrade("");
                      }}
                    >
                      مسح التصفية
                    </Button>
                  ) : (
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
                  )}
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
                    <Box position="relative" bg={courseImageBg} overflow="hidden">
                      <Image
                        src={course.avatar || "https://placehold.co/600x400/e2e8f0/475569?text=Course"}
                        alt={course.title}
                        w="full"
                        h="auto"
                        display="block"
                      />
                      <Flex position="absolute" top={2} right={2} left={2} justify="space-between" align="center" zIndex={1}>
                        <Badge
                          bg={isCourseFree(course) ? "green.500" : "white"}
                          color={isCourseFree(course) ? "white" : "blue.700"}
                          borderRadius="md"
                          fontSize="xs"
                          fontWeight="800"
                          px={2}
                          boxShadow="sm"
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
                      <Badge colorScheme="blue" borderRadius="md" fontSize="xs" mb={2} fontWeight="700" whiteSpace="normal" textAlign="right">
                        {getCourseGradeLabel(course)}
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
          </Box>
        </VStack>
      </Container>

      <TeacherDashboardTour
        isOpen={dashboardTourOpen}
        onClose={() => setDashboardTourOpen(false)}
      />

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
          data-tour-id="teacher-create-course-modal"
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
                <Box data-tour-id="teacher-create-course-basic">
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
                </Box>

                <Box data-tour-id="teacher-create-course-pricing">
                <CreateCourseModalSection
                  title="التسعير والصفوف"
                  subtitle="اختر نوع الكورس والصفوف الدراسية المرتبطة به"
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
                  </Flex>

                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="semibold" color={headingColor} mb={1.5}>
                      الصفوف الدراسية
                    </FormLabel>
                    <Text fontSize="xs" color={mutedTextColor} mb={3}>
                      يمكن اختيار صف واحد أو أكثر لنفس الكورس
                    </Text>
                    {grades.length ? (
                      <CheckboxGroup
                        value={(formData.grade_ids || []).map((id) => String(id))}
                        onChange={(values) =>
                          handleInputChange("grade_ids", normalizeGradeIds(values))
                        }
                      >
                        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
                          {grades.map((grade) => (
                            <Checkbox
                              key={grade.id}
                              value={String(grade.id)}
                              colorScheme="blue"
                              borderColor={inputBorderColor}
                            >
                              {grade.name}
                            </Checkbox>
                          ))}
                        </SimpleGrid>
                      </CheckboxGroup>
                    ) : (
                      <Text fontSize="sm" color={mutedTextColor}>
                        لا توجد صفوف متاحة حالياً.
                      </Text>
                    )}
                  </FormControl>
                </CreateCourseModalSection>
                </Box>
              </VStack>

              {/* العمود الأيسر — صورة الغلاف */}
              <Box data-tour-id="teacher-create-course-cover">
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
                        PNG أو JPG
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
            data-tour-id="teacher-create-course-submit"
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
                    الصور المقبولة: JPG, PNG, GIF
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
              </Flex>

              <FormControl isRequired>
                  <FormLabel
                    fontWeight="bold"
                    color={headingColor}
                    fontSize={{ base: "sm", md: "md" }}
                  >
                    الصفوف الدراسية
                  </FormLabel>
                  <Text fontSize="xs" color={mutedTextColor} mb={3}>
                    يمكن اختيار صف واحد أو أكثر لنفس الكورس
                  </Text>
                  {grades.length ? (
                    <CheckboxGroup
                      value={(editData.grade_ids || []).map((id) => String(id))}
                      onChange={(values) =>
                        handleEditChange("grade_ids", normalizeGradeIds(values))
                      }
                    >
                      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
                        {grades.map((grade) => (
                          <Checkbox
                            key={grade.id}
                            value={String(grade.id)}
                            colorScheme="blue"
                            borderColor={inputBorderColor}
                          >
                            {grade.name}
                          </Checkbox>
                        ))}
                      </SimpleGrid>
                    </CheckboxGroup>
                  ) : (
                    <Text fontSize="sm" color={mutedTextColor}>
                      لا توجد صفوف متاحة حالياً.
                    </Text>
                  )}
                </FormControl>
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
