import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Badge,
  Icon,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Checkbox,
  Avatar,
  Tooltip,
  useToast,
  Center,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Container,
  Select,
  useColorModeValue,
  SimpleGrid,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import {
  FaBan,
  FaUnlock,
  FaPhone,
  FaEnvelope,
  FaCalendar,
  FaKey,
  FaLock,
  FaTrash,
} from "react-icons/fa";
import {
  FiArrowLeft,
  FiSearch,
  FiX,
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiMoreVertical,
  FiFilter,
} from "react-icons/fi";
import { useParams, useNavigate } from "react-router-dom";
import baseUrl from "../../api/baseUrl";
import UserType from "../../Hooks/auth/userType";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import dayjs from "dayjs";

const ACCENT = "#0056b3";

function KpiCard({ label, value, hint, tone = "blue" }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const valueColor = useColorModeValue("gray.900", "white");

  const tones = {
    blue: { bar: "blue.500", iconBg: "blue.50", icon: ACCENT },
    green: { bar: "green.500", iconBg: "green.50", icon: "green.600" },
    red: { bar: "red.500", iconBg: "red.50", icon: "red.600" },
  };
  const t = tones[tone] || tones.blue;

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={border}
      borderRadius="xl"
      overflow="hidden"
      position="relative"
    >
      <Box position="absolute" top={0} right={0} left={0} h="2px" bg={t.bar} />
      <Box p={4}>
        <HStack justify="space-between" align="start" mb={2}>
          <Text fontSize="xs" fontWeight="semibold" color={labelColor}>
            {label}
          </Text>
          <Flex w={8} h={8} borderRadius="lg" bg={t.iconBg} align="center" justify="center">
            <Icon
              as={tone === "green" ? FiUserCheck : tone === "red" ? FiUserX : FiUsers}
              color={t.icon}
              boxSize={4}
            />
          </Flex>
        </HStack>
        <Text fontSize="2xl" fontWeight="bold" color={valueColor} lineHeight="1.2">
          {value}
        </Text>
        {hint && (
          <Text fontSize="xs" color={labelColor} mt={1}>
            {hint}
          </Text>
        )}
      </Box>
    </Box>
  );
}

function StatusBadge({ student }) {
  const isBlocked = student.is_blocked_by_teacher;
  const sub = student.subscription_status;

  if (isBlocked) {
    return (
      <Badge colorScheme="red" variant="subtle" fontSize="xs" px={2} py={0.5} borderRadius="md">
        محظور
      </Badge>
    );
  }

  const map = {
    active: { label: "نشط", scheme: "green" },
    expired: { label: "منتهي", scheme: "orange" },
    suspended: { label: "معلق", scheme: "yellow" },
  };
  const item = map[sub] || { label: "غير محدد", scheme: "gray" };

  return (
    <Badge colorScheme={item.scheme} variant="subtle" fontSize="xs" px={2} py={0.5} borderRadius="md">
      {item.label}
    </Badge>
  );
}

const CourseStudentsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isAdmin, isTeacher] = UserType();
  const token = localStorage.getItem("token");

  const [courseData, setCourseData] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchStudent, setSearchStudent] = useState("");

  const [blockingLoading, setBlockingLoading] = useState(false);
  const [sortBy, setSortBy] = useState("alphabetical");
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedStudentsForBlock, setSelectedStudentsForBlock] = useState([]);

  // Dialogs
  const {
    isOpen: isBlockAllOpen,
    onOpen: onBlockAllOpen,
    onClose: onBlockAllClose,
  } = useDisclosure();
  const {
    isOpen: isUnblockAllOpen,
    onOpen: onUnblockAllOpen,
    onClose: onUnblockAllClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [deleteStudentId, setDeleteStudentId] = useState(null);
  const [deleteStudentName, setDeleteStudentName] = useState("");

  const toast = useToast();
  const cancelRef = React.useRef();

  // Fetch Course Details and Enrollments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch course details
        const courseRes = await baseUrl.get(`api/course/${id}/details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourseData(courseRes.data);

        // Fetch enrollments
        await fetchEnrollments();
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "خطأ",
          description: "فشل في تحميل البيانات",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token]);

  const fetchEnrollments = async () => {
    try {
      const response = await baseUrl.get(`api/course/${id}/enrollments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnrollments(response.data.students || []);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    }
  };

  // --- Search helpers (Arabic-friendly + phone normalization) ---
  const normalizeLatin = (value) => {
    if (value === null || value === undefined) return "";
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove latin diacritics
      .toLowerCase()
      .trim();
  };

  const normalizeArabic = (value) => {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "") // tashkeel
      .replace(/\u0640/g, "") // tatweel
      .replace(/[إأآا]/g, "ا")
      .replace(/[يى]/g, "ي")
      .replace(/ة/g, "ه")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  };

  const normalizeDigits = (value) => {
    if (value === null || value === undefined) return "";
    return String(value).replace(/\D/g, "");
  };

  const normalizeQuery = (q) => {
    const raw = String(q || "").trim();
    return {
      raw,
      ar: normalizeArabic(raw),
      latin: normalizeLatin(raw),
      digits: normalizeDigits(raw),
    };
  };

  // Filter & Sort Logic using useMemo
  const filteredEnrollments = useMemo(() => {
    let result = [...enrollments];
    const q = normalizeQuery(searchStudent);

    // 1. Search Filter
    if (q.raw) {
      const tokens = q.ar.split(" ").filter(Boolean);
      const digitToken = q.digits;

      result = result.filter((student) => {
        const name = normalizeArabic(student?.name);
        const email = normalizeLatin(student?.email);
        const code = normalizeLatin(student?.activation_code);
        const phoneDigits = normalizeDigits(student?.phone);

        // If query is only digits, prioritize phone match
        if (digitToken && tokens.length === 0) {
          return phoneDigits.includes(digitToken);
        }

        // Otherwise require every token to match something
        return tokens.every((t) => {
          const tDigits = normalizeDigits(t);
          if (tDigits) return phoneDigits.includes(tDigits);
          return (
            (name && name.includes(t)) ||
            (email && email.includes(t)) ||
            (code && code.includes(t))
          );
        });
      });
    }

    // 2. Sorting
    result.sort((a, b) => {
      if (sortBy === "alphabetical") {
        const aName = normalizeArabic(a?.name);
        const bName = normalizeArabic(b?.name);
        return aName.localeCompare(bName, "ar", {
          sensitivity: "base",
          numeric: true,
        });
      } else if (sortBy === "newest") {
        // Sort by enrolled_at desc, fallback to ID desc
        const dateA = new Date(a.enrolled_at || 0).getTime();
        const dateB = new Date(b.enrolled_at || 0).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return (b.id || 0) - (a.id || 0);
      } else if (sortBy === "oldest") {
        // Sort by enrolled_at asc, fallback to ID asc
        const dateA = new Date(a.enrolled_at || 0).getTime();
        const dateB = new Date(b.enrolled_at || 0).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return (a.id || 0) - (b.id || 0);
      }
      return 0;
    });

    return result;
  }, [enrollments, searchStudent, sortBy]);

  // Actions
  const handleBlockAllStudents = async () => {
    try {
      setBlockingLoading(true);
      const response = await baseUrl.post(
        `/api/courses/${id}/block-all`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        title: "نجح",
        description:
          response.data.message || `تم حظر ${response.data.blocked_count} طالب`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      await fetchEnrollments();
      onBlockAllClose();
    } catch (error) {
      toast({
        title: "خطأ",
        description: error.response?.data?.message || "فشل في حظر الطلاب",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setBlockingLoading(false);
    }
  };

  const handleUnblockAllStudents = async () => {
    try {
      setBlockingLoading(true);
      const response = await baseUrl.post(
        `/api/courses/${id}/unblock-all`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        title: "نجح",
        description:
          response.data.message ||
          `تم إلغاء حظر ${response.data.unblocked_count} طالب`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      await fetchEnrollments();
      onUnblockAllClose();
    } catch (error) {
      toast({
        title: "خطأ",
        description: error.response?.data?.message || "فشل في إلغاء حظر الطلاب",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setBlockingLoading(false);
    }
  };

  const handleBlockStudent = async (studentId) => {
    try {
      setBlockingLoading(true);
      const response = await baseUrl.post(
        `/api/courses/${id}/block-student`,
        { student_id: studentId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        title: "نجح",
        description: response.data.message || "تم حظر الطالب بنجاح",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      await fetchEnrollments();
    } catch (error) {
      toast({
        title: "خطأ",
        description: error.response?.data?.message || "فشل في حظر الطالب",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setBlockingLoading(false);
    }
  };

  const handleUnblockStudent = async (studentId) => {
    try {
      setBlockingLoading(true);
      const response = await baseUrl.post(
        `/api/courses/${id}/unblock-student`,
        { student_id: studentId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        title: "نجح",
        description: response.data.message || "تم إلغاء حظر الطالب بنجاح",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      await fetchEnrollments();
    } catch (error) {
      toast({
        title: "خطأ",
        description: error.response?.data?.message || "فشل في إلغاء حظر الطالب",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setBlockingLoading(false);
    }
  };

  const handleBlockSelectedStudents = async () => {
    if (selectedStudentsForBlock.length === 0) return;

    try {
      setBlockingLoading(true);
      const response = await baseUrl.post(
        `/api/courses/${id}/block-students`,
        {
          student_ids: selectedStudentsForBlock,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        title: "نجح",
        description:
          response.data.message || `تم حظر ${response.data.blocked_count} طالب`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setSelectedStudentsForBlock([]);
      await fetchEnrollments();
    } catch (error) {
      toast({
        title: "خطأ",
        description: error.response?.data?.message || "فشل في حظر الطلاب",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setBlockingLoading(false);
    }
  };

  const handleUnblockSelectedStudents = async () => {
    if (selectedStudentsForBlock.length === 0) return;

    try {
      setBlockingLoading(true);
      const response = await baseUrl.post(
        `/api/courses/${id}/unblock-students`,
        {
          student_ids: selectedStudentsForBlock,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast({
        title: "نجح",
        description:
          response.data.message ||
          `تم إلغاء حظر ${response.data.unblocked_count} طالب`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setSelectedStudentsForBlock([]);
      await fetchEnrollments();
    } catch (error) {
      toast({
        title: "خطأ",
        description: error.response?.data?.message || "فشل في إلغاء حظر الطلاب",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setBlockingLoading(false);
    }
  };

  const handleDeleteStudentConfirm = (studentId, studentName) => {
    setDeleteStudentId(studentId);
    setDeleteStudentName(studentName);
    onDeleteOpen();
  };

  const handleDeleteStudent = async () => {
    try {
      setActionLoading(true);
      await baseUrl.delete(`api/courses/${id}/enrollments/${deleteStudentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: "تم الحذف",
        description: "تم حذف الطالب بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      await fetchEnrollments();
      onDeleteClose();
    } catch (error) {
      toast({
        title: "خطأ",
        description:
          error.response?.data?.message || "حدث خطأ أثناء حذف الطالب",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return dayjs(dateString).format("DD/MM/YYYY");
  };

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const subTextColor = useColorModeValue("gray.600", "gray.400");
  const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const rowSelectedBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const rowBlockedBg = useColorModeValue("red.50", "whiteAlpha.50");
  const toolbarBg = useColorModeValue("gray.50", "gray.900");
  const backHoverBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const headerIconBg = useColorModeValue("blue.50", "whiteAlpha.100");

  const activeCount = enrollments.filter((s) => !s.is_blocked_by_teacher).length;
  const blockedCount = enrollments.filter((s) => s.is_blocked_by_teacher).length;
  const canManage = isTeacher || isAdmin;

  if (loading) {
    return <BrandLoadingScreen />;
  }

  const courseTitle = courseData?.course?.title || courseData?.title || "الكورس";

  const renderStudentActions = (student, isBlocked) => (
    <HStack spacing={1}>
      {canManage && (
        isBlocked ? (
          <Tooltip label="إلغاء الحظر" hasArrow>
            <IconButton
              size="sm"
              variant="ghost"
              colorScheme="green"
              aria-label="إلغاء الحظر"
              icon={<Icon as={FaUnlock} />}
              onClick={() => handleUnblockStudent(student.id)}
              isLoading={blockingLoading}
            />
          </Tooltip>
        ) : (
          <Tooltip label="حظر المحتوى" hasArrow>
            <IconButton
              size="sm"
              variant="ghost"
              colorScheme="red"
              aria-label="حظر"
              icon={<Icon as={FaLock} />}
              onClick={() => handleBlockStudent(student.id)}
              isLoading={blockingLoading}
            />
          </Tooltip>
        )
      )}
      <Tooltip label="حذف من الكورس" hasArrow>
        <IconButton
          size="sm"
          variant="ghost"
          colorScheme="red"
          aria-label="حذف"
          icon={<Icon as={FaTrash} />}
          onClick={() => handleDeleteStudentConfirm(student.id, student.name)}
          isLoading={actionLoading}
        />
      </Tooltip>
    </HStack>
  );

  return (
    <Box minH="100vh" bg={pageBg} pt={{ base: "80px", md: "96px" }} pb={12} dir="rtl">
      <Container maxW="7xl" px={{ base: 4, md: 6 }}>
        <VStack spacing={5} align="stretch">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon as={FiArrowLeft} />}
            color={subTextColor}
            alignSelf="flex-start"
            fontWeight="medium"
            onClick={() => navigate(`/CourseDetailsPage/${id}`)}
            _hover={{ color: textColor, bg: backHoverBg }}
          >
            العودة لتفاصيل الكورس
          </Button>

          {/* Header */}
          <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
            <Box h="3px" bgGradient="linear(to-l, blue.600, blue.400)" />
            <Flex
              direction={{ base: "column", md: "row" }}
              align={{ base: "stretch", md: "center" }}
              justify="space-between"
              gap={4}
              p={{ base: 5, md: 6 }}
            >
              <Box>
                <Text fontSize="xs" fontWeight="semibold" color={subTextColor} mb={1}>
                  إدارة المشتركين
                </Text>
                <Heading size="lg" color={textColor} fontWeight="bold">
                  طلاب الكورس
                </Heading>
                <Text fontSize="sm" color={subTextColor} mt={1} noOfLines={2}>
                  {courseTitle}
                </Text>
              </Box>
              <Text fontSize="sm" color={subTextColor} whiteSpace="nowrap">
                آخر تحديث: {dayjs().format("DD/MM/YYYY")}
              </Text>
            </Flex>
          </Box>

          {/* KPIs */}
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
            <KpiCard label="إجمالي المشتركين" value={enrollments.length} hint="مسجّل في الكورس" tone="blue" />
            <KpiCard label="نشطون" value={activeCount} hint="غير محظورين" tone="green" />
            <KpiCard label="محظورون" value={blockedCount} hint="حظر من المعلم" tone="red" />
          </SimpleGrid>

          {/* Toolbar + Table */}
          <Box
            bg={cardBg}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={borderColor}
            overflow="hidden"
          >
            <Box px={{ base: 4, md: 5 }} py={4} bg={toolbarBg} borderBottomWidth="1px" borderColor={borderColor}>
              <Flex gap={3} flexWrap="wrap" align="center" justify="space-between">
                <InputGroup maxW={{ base: "full", md: "360px" }} size="md">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiSearch} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="بحث بالاسم، الهاتف، أو كود التفعيل..."
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    bg={cardBg}
                    borderColor={borderColor}
                    borderRadius="lg"
                    _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)" }}
                  />
                  {searchStudent && (
                    <InputRightElement>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        aria-label="مسح البحث"
                        icon={<Icon as={FiX} />}
                        onClick={() => setSearchStudent("")}
                      />
                    </InputRightElement>
                  )}
                </InputGroup>

                <HStack spacing={2} flexWrap="wrap">
                  <HStack spacing={2} color={subTextColor} fontSize="sm" display={{ base: "none", sm: "flex" }}>
                    <Icon as={FiFilter} />
                    <Text>ترتيب:</Text>
                  </HStack>
                  <Select
                    w={{ base: "full", sm: "180px" }}
                    size="md"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    bg={cardBg}
                    borderColor={borderColor}
                    borderRadius="lg"
                  >
                    <option value="alphabetical">أبجدي</option>
                    <option value="newest">الأحدث</option>
                    <option value="oldest">الأقدم</option>
                  </Select>

                  {canManage && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="red"
                        leftIcon={<Icon as={FaBan} />}
                        onClick={onBlockAllOpen}
                        isLoading={blockingLoading}
                        borderRadius="lg"
                        display={{ base: "none", lg: "inline-flex" }}
                      >
                        حظر الكل
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="green"
                        leftIcon={<Icon as={FaUnlock} />}
                        onClick={onUnblockAllOpen}
                        isLoading={blockingLoading}
                        borderRadius="lg"
                        display={{ base: "none", lg: "inline-flex" }}
                      >
                        فك الحظر
                      </Button>
                    </>
                  )}
                </HStack>
              </Flex>

              {canManage && selectedStudentsForBlock.length > 0 && (
                <HStack mt={3} pt={3} borderTopWidth="1px" borderColor={borderColor} spacing={2} flexWrap="wrap">
                  <Badge colorScheme="blue" variant="subtle" px={2} py={1} borderRadius="md">
                    {selectedStudentsForBlock.length} محدد
                  </Badge>
                  <Button size="xs" colorScheme="red" variant="solid" onClick={handleBlockSelectedStudents} isLoading={blockingLoading}>
                    حظر المحددين
                  </Button>
                  <Button size="xs" colorScheme="green" variant="outline" onClick={handleUnblockSelectedStudents} isLoading={blockingLoading}>
                    فك حظر المحددين
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => setSelectedStudentsForBlock([])}>
                    إلغاء التحديد
                  </Button>
                </HStack>
              )}
            </Box>

            {filteredEnrollments.length > 0 ? (
              <>
                {/* Desktop table */}
                <Box display={{ base: "none", lg: "block" }} px={{ base: 2, md: 3 }} py={2}>
                  <TableContainer>
                    <Table variant="simple" size="md">
                      <Thead>
                        <Tr>
                          {canManage && (
                            <Th w="44px" borderColor={borderColor}>
                              <Checkbox
                                isChecked={
                                  selectedStudentsForBlock.length === filteredEnrollments.length &&
                                  filteredEnrollments.length > 0
                                }
                                isIndeterminate={
                                  selectedStudentsForBlock.length > 0 &&
                                  selectedStudentsForBlock.length < filteredEnrollments.length
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStudentsForBlock(filteredEnrollments.map((s) => s.id));
                                  } else {
                                    setSelectedStudentsForBlock([]);
                                  }
                                }}
                                colorScheme="blue"
                              />
                            </Th>
                          )}
                          <Th borderColor={borderColor} color={subTextColor} fontSize="xs" textTransform="none">
                            الطالب
                          </Th>
                          <Th borderColor={borderColor} color={subTextColor} fontSize="xs" textTransform="none">
                            التواصل
                          </Th>
                          <Th borderColor={borderColor} color={subTextColor} fontSize="xs" textTransform="none">
                            الاشتراك
                          </Th>
                          <Th borderColor={borderColor} color={subTextColor} fontSize="xs" textTransform="none">
                            الحالة
                          </Th>
                          <Th borderColor={borderColor} color={subTextColor} fontSize="xs" textTransform="none">
                            المحتوى
                          </Th>
                          <Th borderColor={borderColor} w="100px" />
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredEnrollments.map((student) => {
                          const isBlocked = student.is_blocked_by_teacher || false;
                          const isSelected = selectedStudentsForBlock.includes(student.id);
                          return (
                            <Tr
                              key={student.id}
                              bg={isBlocked ? rowBlockedBg : isSelected ? rowSelectedBg : "transparent"}
                              _hover={{ bg: isBlocked ? rowBlockedBg : rowHoverBg }}
                            >
                              {canManage && (
                                <Td borderColor={borderColor}>
                                  <Checkbox
                                    isChecked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedStudentsForBlock([...selectedStudentsForBlock, student.id]);
                                      } else {
                                        setSelectedStudentsForBlock(
                                          selectedStudentsForBlock.filter((sid) => sid !== student.id)
                                        );
                                      }
                                    }}
                                    colorScheme="blue"
                                  />
                                </Td>
                              )}
                              <Td borderColor={borderColor}>
                                <HStack spacing={3}>
                                  <Avatar size="sm" name={student.name} src={student.avatar} bg={isBlocked ? "red.500" : "blue.500"} />
                                  <Box>
                                    <Text fontWeight="semibold" fontSize="sm" color={textColor}>
                                      {student.name}
                                    </Text>
                                    {student.activation_code && (
                                      <Text fontSize="xs" color={subTextColor} fontFamily="mono">
                                        {student.activation_code}
                                      </Text>
                                    )}
                                  </Box>
                                </HStack>
                              </Td>
                              <Td borderColor={borderColor}>
                                <VStack align="start" spacing={0.5}>
                                  <HStack spacing={1.5} fontSize="sm" color={subTextColor}>
                                    <Icon as={FaPhone} boxSize={3} />
                                    <Text>{student.phone || "—"}</Text>
                                  </HStack>
                                  <HStack spacing={1.5} fontSize="sm" color={subTextColor}>
                                    <Icon as={FaEnvelope} boxSize={3} />
                                    <Text noOfLines={1} maxW="200px">
                                      {student.email || "—"}
                                    </Text>
                                  </HStack>
                                </VStack>
                              </Td>
                              <Td borderColor={borderColor}>
                                <HStack spacing={1.5} fontSize="sm" color={subTextColor}>
                                  <Icon as={FaCalendar} boxSize={3} />
                                  <Text>{formatDate(student.enrolled_at)}</Text>
                                </HStack>
                              </Td>
                              <Td borderColor={borderColor}>
                                <StatusBadge student={student} />
                              </Td>
                              <Td borderColor={borderColor}>
                                <Badge
                                  colorScheme={student.is_content_blocked ? "red" : "green"}
                                  variant="subtle"
                                  fontSize="xs"
                                >
                                  {student.is_content_blocked ? "مقيّد" : "متاح"}
                                </Badge>
                              </Td>
                              <Td borderColor={borderColor}>{renderStudentActions(student, isBlocked)}</Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* Mobile cards */}
                <VStack spacing={3} p={4} display={{ base: "flex", lg: "none" }} align="stretch">
                  {filteredEnrollments.map((student) => {
                    const isBlocked = student.is_blocked_by_teacher || false;
                    const isSelected = selectedStudentsForBlock.includes(student.id);
                    return (
                      <Box
                        key={student.id}
                        p={4}
                        borderWidth="1px"
                        borderColor={isBlocked ? "red.200" : borderColor}
                        borderRadius="xl"
                        bg={isSelected ? rowSelectedBg : cardBg}
                      >
                        <Flex justify="space-between" align="start" gap={3} mb={3}>
                          <HStack spacing={3} align="start" flex={1} minW={0}>
                            {canManage && (
                              <Checkbox
                                isChecked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStudentsForBlock([...selectedStudentsForBlock, student.id]);
                                  } else {
                                    setSelectedStudentsForBlock(
                                      selectedStudentsForBlock.filter((sid) => sid !== student.id)
                                    );
                                  }
                                }}
                                colorScheme="blue"
                                mt={1}
                              />
                            )}
                            <Avatar size="md" name={student.name} src={student.avatar} />
                            <Box minW={0}>
                              <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                                {student.name}
                              </Text>
                              <HStack spacing={2} mt={1} flexWrap="wrap">
                                <StatusBadge student={student} />
                                <Badge
                                  colorScheme={student.is_content_blocked ? "red" : "green"}
                                  variant="subtle"
                                  fontSize="10px"
                                >
                                  {student.is_content_blocked ? "محتوى مقيّد" : "محتوى متاح"}
                                </Badge>
                              </HStack>
                            </Box>
                          </HStack>
                          {canManage && (
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<Icon as={FiMoreVertical} />}
                                variant="ghost"
                                size="sm"
                                aria-label="إجراءات"
                              />
                              <MenuList minW="160px">
                                {!isBlocked ? (
                                  <MenuItem icon={<Icon as={FaLock} />} onClick={() => handleBlockStudent(student.id)}>
                                    حظر المحتوى
                                  </MenuItem>
                                ) : (
                                  <MenuItem icon={<Icon as={FaUnlock} />} onClick={() => handleUnblockStudent(student.id)}>
                                    إلغاء الحظر
                                  </MenuItem>
                                )}
                                <MenuItem
                                  icon={<Icon as={FaTrash} />}
                                  color="red.500"
                                  onClick={() => handleDeleteStudentConfirm(student.id, student.name)}
                                >
                                  حذف من الكورس
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          )}
                        </Flex>
                        <SimpleGrid columns={1} spacing={2} fontSize="sm" color={subTextColor}>
                          <HStack><Icon as={FaPhone} boxSize={3.5} /><Text>{student.phone || "—"}</Text></HStack>
                          <HStack><Icon as={FaEnvelope} boxSize={3.5} /><Text noOfLines={1}>{student.email || "—"}</Text></HStack>
                          <HStack><Icon as={FaCalendar} boxSize={3.5} /><Text>انضم {formatDate(student.enrolled_at)}</Text></HStack>
                          {student.activation_code && (
                            <HStack><Icon as={FaKey} boxSize={3.5} color="blue.500" /><Text fontFamily="mono">{student.activation_code}</Text></HStack>
                          )}
                        </SimpleGrid>
                      </Box>
                    );
                  })}
                </VStack>

                <Box px={5} py={3} borderTopWidth="1px" borderColor={borderColor}>
                  <Text fontSize="xs" color={subTextColor}>
                    عرض {filteredEnrollments.length} من {enrollments.length} طالب
                    {searchStudent.trim() ? ` — نتائج البحث عن «${searchStudent.trim()}»` : ""}
                  </Text>
                </Box>
              </>
            ) : (
              <Center py={16} px={4}>
                <VStack spacing={4} maxW="sm" textAlign="center">
                  <Flex w={14} h={14} borderRadius="full" bg={headerIconBg} align="center" justify="center">
                    <Icon as={FiUsers} boxSize={6} color={ACCENT} />
                  </Flex>
                  <Box>
                    <Text fontWeight="semibold" color={textColor}>
                      {searchStudent.trim() ? "لا توجد نتائج" : "لا يوجد طلاب مسجّلون"}
                    </Text>
                    <Text fontSize="sm" color={subTextColor} mt={1}>
                      {searchStudent.trim()
                        ? "جرّب كلمات بحث مختلفة أو امسح الفلتر"
                        : "سيظهر الطلاب هنا فور تسجيلهم في الكورس"}
                    </Text>
                  </Box>
                  {searchStudent.trim() && (
                    <Button size="sm" variant="outline" colorScheme="blue" onClick={() => setSearchStudent("")}>
                      مسح البحث
                    </Button>
                  )}
                </VStack>
              </Center>
            )}
          </Box>
        </VStack>

        {/* Dialogs */}
        <AlertDialog isOpen={isBlockAllOpen} leastDestructiveRef={cancelRef} onClose={onBlockAllClose} isCentered>
          <AlertDialogOverlay>
            <AlertDialogContent borderRadius="xl" mx={4}>
              <AlertDialogHeader fontSize="md">حظر جميع الطلاب؟</AlertDialogHeader>
              <AlertDialogBody color={subTextColor}>
                سيتم حظر محتوى الكورس عن كل المشتركين. يمكنك التراجع لاحقاً.
              </AlertDialogBody>
              <AlertDialogFooter gap={2}>
                <Button ref={cancelRef} onClick={onBlockAllClose} variant="ghost">
                  إلغاء
                </Button>
                <Button colorScheme="red" onClick={handleBlockAllStudents} isLoading={blockingLoading}>
                  تأكيد الحظر
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

        <AlertDialog isOpen={isUnblockAllOpen} leastDestructiveRef={cancelRef} onClose={onUnblockAllClose} isCentered>
          <AlertDialogOverlay>
            <AlertDialogContent borderRadius="xl" mx={4}>
              <AlertDialogHeader fontSize="md">فك حظر الجميع؟</AlertDialogHeader>
              <AlertDialogBody color={subTextColor}>
                سيعود المحتوى متاحاً لجميع الطلاب المشتركين.
              </AlertDialogBody>
              <AlertDialogFooter gap={2}>
                <Button ref={cancelRef} onClick={onUnblockAllClose} variant="ghost">
                  إلغاء
                </Button>
                <Button colorScheme="green" onClick={handleUnblockAllStudents} isLoading={blockingLoading}>
                  تأكيد
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

        <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={onDeleteClose} isCentered>
          <AlertDialogOverlay>
            <AlertDialogContent borderRadius="xl" mx={4}>
              <AlertDialogHeader fontSize="md">حذف الطالب من الكورس</AlertDialogHeader>
              <AlertDialogBody color={subTextColor}>
                هل تريد حذف <Text as="span" fontWeight="bold" color={textColor}>{deleteStudentName}</Text>؟
                لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogBody>
              <AlertDialogFooter gap={2}>
                <Button ref={cancelRef} onClick={onDeleteClose} variant="ghost">
                  إلغاء
                </Button>
                <Button colorScheme="red" onClick={handleDeleteStudent} isLoading={actionLoading}>
                  حذف
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Container>
    </Box>
  );
};

export default CourseStudentsPage;
