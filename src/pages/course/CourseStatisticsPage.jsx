import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  useColorModeValue,
  Icon,
  Badge,
  VStack,
  HStack,
  Progress,
  Select,
  Collapse,
  Button,
  Input,
  Avatar,
  Center,
  InputGroup,
  InputLeftElement,
  useToast,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import {
  FaUsers,
  FaCheckCircle,
  FaBookOpen,
  FaFileAlt,
  FaChevronDown,
  FaChevronUp,
  FaWhatsapp,
} from "react-icons/fa";
import { FiArrowLeft, FiBarChart2, FiSearch, FiVideo, FiPhone } from "react-icons/fi";
import { useParams, useNavigate } from "react-router-dom";
import baseUrl from "../../api/baseUrl";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";

const ACCENT = "#0056b3";

const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = `20${digits.slice(1)}`;
  else if (!digits.startsWith("20")) digits = `20${digits}`;
  return digits;
};

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const examGradeLabel = (exam) => {
  if (exam.grade != null && exam.total_grade != null) {
    return `${exam.grade}/${exam.total_grade}`;
  }
  if (exam.submitted_at) return "مُسلّم — بانتظار التصحيح";
  return "لم يُسلّم";
};

const examStatusLabel = (exam) => {
  if (exam.passed === true) return "ناجح";
  if (exam.passed === false) return "راسب";
  if (exam.submitted_at) return "قيد المراجعة";
  return "لم يُسلّم";
};

const buildParentReportMessage = (student) => {
  const lines = [
    "السلام عليكم ورحمة الله،",
    "",
    `تقرير متابعة الطالب/ة: ${student.name?.trim() || "—"}`,
    "─────────────────────",
    "",
    `المحاضرات: ${student.watched_lectures_count || 0}/${student.total_lectures || 0} (${Math.round(student.lectures_completion_percentage || 0)}%)`,
    `الفيديوهات: ${student.watched_videos_count || 0}/${student.total_videos || 0} (${Math.round(student.videos_completion_percentage || 0)}%)`,
    `واجبات المحاضرات: ${student.solved_lecture_exams_count || 0}/${student.total_lecture_exams || 0} (${Math.round(student.lecture_exams_completion_percentage || 0)}%)`,
    "",
  ];

  if ((student.watched_lectures || []).length > 0) {
    lines.push("المحاضرات المكتملة:");
    student.watched_lectures.forEach((lecture) => {
      lines.push(`• ${lecture.title} (${lecture.watched_videos || 0}/${lecture.total_videos || 0} فيديو)`);
    });
    lines.push("");
  }

  if ((student.not_watched_lectures || []).length > 0) {
    lines.push("محاضرات تحتاج متابعة:");
    student.not_watched_lectures.forEach((lecture) => {
      lines.push(`• ${lecture.title} — متبقي ${lecture.remaining_videos || 0} فيديو`);
    });
    lines.push("");
  }

  if ((student.not_watched_videos || []).length > 0) {
    lines.push("فيديوهات لم تُشاهد:");
    student.not_watched_videos.forEach((video) => {
      lines.push(`• ${video.title} (${video.lecture_title || "محاضرة"})`);
    });
    lines.push("");
  }

  if ((student.solved_lecture_exams || []).length > 0) {
    lines.push("الواجبات المحلولة:");
    student.solved_lecture_exams.forEach((exam) => {
      lines.push(`• ${exam.title} — ${examGradeLabel(exam)} (${examStatusLabel(exam)})`);
    });
    lines.push("");
  }

  if ((student.not_solved_lecture_exams || []).length > 0) {
    lines.push("واجبات لم تُحل:");
    student.not_solved_lecture_exams.forEach((exam) => {
      lines.push(`• ${exam.title} (${exam.lecture_title || "محاضرة"})`);
    });
    lines.push("");
  }

  if (student.enrolled_at) {
    lines.push(`تاريخ الاشتراك: ${formatDate(student.enrolled_at)}`);
    lines.push("");
  }

  lines.push("مع تحيات فريق المتابعة.");
  return lines.join("\n");
};

const openWhatsAppReport = (student, toast) => {
  const phone = formatPhoneForWhatsApp(student.parent_phone);
  if (!phone) {
    toast({
      title: "رقم ولي الأمر غير متوفر",
      description: "لا يمكن إرسال التقرير بدون رقم ولي الأمر.",
      status: "warning",
      duration: 4000,
      isClosable: true,
    });
    return;
  }
  const message = buildParentReportMessage(student);
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
};

const getStudentsWithParentPhone = (students) =>
  (students || []).filter((student) => Boolean(formatPhoneForWhatsApp(student.parent_phone)));

function KpiCard({ label, value, sub, icon, accent = "blue" }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.800", "white");
  const accentMap = {
    blue: { bg: "blue.50", color: "blue.600" },
    green: { bg: "green.50", color: "green.600" },
    orange: { bg: "orange.50", color: "orange.600" },
    purple: { bg: "purple.50", color: "purple.600" },
    red: { bg: "red.50", color: "red.600" },
  };
  const a = accentMap[accent] || accentMap.blue;

  return (
    <Box p={5} bg={bg} borderRadius="xl" borderWidth="1px" borderColor={border}>
      <Flex justify="space-between" align="flex-start" gap={3}>
        <Box minW={0}>
          <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1.5}>
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color={titleColor} lineHeight="1.1">
            {value}
          </Text>
          {sub && (
            <Text fontSize="xs" color="gray.400" mt={2}>
              {sub}
            </Text>
          )}
        </Box>
        <Flex w={10} h={10} borderRadius="lg" bg={a.bg} align="center" justify="center" flexShrink={0}>
          <Icon as={icon} color={a.color} boxSize={4} />
        </Flex>
      </Flex>
    </Box>
  );
}

function StatusBadge({ type, children }) {
  const schemes = { success: "green", danger: "red", warning: "orange", neutral: "gray", info: "blue" };
  return (
    <Badge
      colorScheme={schemes[type] || "gray"}
      variant="subtle"
      px={2.5}
      py={0.5}
      borderRadius="md"
      fontSize="xs"
      fontWeight="semibold"
    >
      {children}
    </Badge>
  );
}

function DetailSection({ title, count, type = "neutral", children }) {
  const border = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.700", "gray.200");

  return (
    <Box>
      <HStack justify="space-between" mb={2}>
        <Text fontSize="xs" fontWeight="bold" color={titleColor}>
          {title}
        </Text>
        <StatusBadge type={type}>{count}</StatusBadge>
      </HStack>
      <VStack align="stretch" spacing={2}>
        {children}
      </VStack>
    </Box>
  );
}

function DetailRow({ title, meta, badge, sub }) {
  const bg = useColorModeValue("gray.50", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.800", "white");

  return (
    <Box p={3} bg={bg} borderRadius="lg" borderWidth="1px" borderColor={border}>
      <Text fontSize="sm" fontWeight="medium" color={titleColor} noOfLines={2}>
        {title}
      </Text>
      {sub && (
        <Text fontSize="xs" color="gray.500" mt={0.5} noOfLines={1}>
          {sub}
        </Text>
      )}
      {(meta || badge) && (
        <HStack spacing={2} mt={1} flexWrap="wrap">
          {meta && (
            <Text fontSize="xs" color="gray.500">
              {meta}
            </Text>
          )}
          {badge}
        </HStack>
      )}
    </Box>
  );
}

const CourseStatisticsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("alphabetical");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [bulkQueue, setBulkQueue] = useState([]);
  const [bulkIndex, setBulkIndex] = useState(0);
  const bulkDisclosure = useDisclosure();
  const toast = useToast();

  const pageBg = useColorModeValue("gray.100", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subTextColor = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const inputBg = useColorModeValue("white", "gray.800");
  const progressTrack = useColorModeValue("gray.100", "gray.700");
  const backHoverBg = useColorModeValue("white", "gray.800");
  const bulkInfoBg = useColorModeValue("blue.50", "blue.900");
  const bulkStudentBg = useColorModeValue("gray.50", "gray.900");
  const miniStatBg = useColorModeValue("gray.50", "gray.900");
  const headerIconBg = useColorModeValue("blue.50", "blue.900");

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const response = await baseUrl.get(`/api/course/${id}/students-progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProgressData(response.data);
    } catch (err) {
      console.error("Error fetching progress:", err);
      setError(err.response?.data?.message || "حدث خطأ أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchProgress();
  }, [id, fetchProgress]);

  const filteredStudents = useMemo(() => {
    let result = progressData?.students_details || [];

    if (filter !== "all") {
      result = result.filter((student) => {
        const watchedCount = student.watched_lectures_count || 0;
        const totalLectures =
          student.total_lectures || progressData.course_stats?.total_lectures || 0;
        if (filter === "completed") return watchedCount >= totalLectures && totalLectures > 0;
        if (filter === "incomplete") return watchedCount < totalLectures;
        return true;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((student) => student.name?.toLowerCase().includes(query));
    }

    return [...result].sort((a, b) => {
      if (sortBy === "alphabetical") return (a.name || "").localeCompare(b.name || "", "ar");
      if (sortBy === "newest") {
        const dateA = a.enrolled_at ? new Date(a.enrolled_at).getTime() : 0;
        const dateB = b.enrolled_at ? new Date(b.enrolled_at).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === "oldest") {
        const dateA = a.enrolled_at ? new Date(a.enrolled_at).getTime() : 0;
        const dateB = b.enrolled_at ? new Date(b.enrolled_at).getTime() : 0;
        return dateA - dateB;
      }
      return 0;
    });
  }, [progressData, filter, searchQuery, sortBy]);

  const studentsWithParentPhone = useMemo(
    () => getStudentsWithParentPhone(filteredStudents),
    [filteredStudents]
  );

  const bulkCurrentStudent = bulkQueue[bulkIndex] || null;
  const bulkDone = bulkQueue.length > 0 && bulkIndex >= bulkQueue.length;
  const bulkProgress = bulkQueue.length ? Math.min((bulkIndex / bulkQueue.length) * 100, 100) : 0;

  const startBulkSend = () => {
    if (studentsWithParentPhone.length === 0) {
      toast({
        title: "لا توجد أرقام متاحة",
        description: "لا يوجد طلاب في القائمة الحالية لديهم رقم ولي أمر.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    setBulkQueue(studentsWithParentPhone);
    setBulkIndex(0);
    bulkDisclosure.onOpen();
  };

  const closeBulkSend = () => {
    bulkDisclosure.onClose();
    setBulkQueue([]);
    setBulkIndex(0);
  };

  const sendBulkCurrent = () => {
    if (!bulkCurrentStudent) return;
    openWhatsAppReport(bulkCurrentStudent, toast);
  };

  const advanceBulkQueue = () => {
    if (bulkIndex + 1 >= bulkQueue.length) {
      setBulkIndex(bulkQueue.length);
      return;
    }
    setBulkIndex((prev) => prev + 1);
  };

  const skipBulkCurrent = () => {
    advanceBulkQueue();
  };

  if (loading) return <BrandLoadingScreen />;

  if (error) {
    return (
      <Box minH="100vh" bg={pageBg} pt="100px" pb={12}>
        <Container maxW="6xl">
          <Center minH="50vh">
            <Box
              bg={cardBg}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              p={8}
              maxW="md"
              w="full"
              textAlign="center"
            >
              <Text fontSize="md" color="red.500" fontWeight="semibold" mb={6}>
                {error}
              </Text>
              <Button colorScheme="blue" onClick={fetchProgress}>
                إعادة المحاولة
              </Button>
            </Box>
          </Center>
        </Container>
      </Box>
    );
  }

  if (!progressData) return null;

  const stats = progressData.course_stats || {};
  const totalStudents = progressData.total_students || stats.total_students || 0;
  const totalExams = stats.total_lecture_exams || 0;
  const completionRate =
    totalStudents > 0
      ? Math.round((progressData.completed_students / totalStudents) * 100)
      : 0;

  return (
    <Box minH="100vh" bg={pageBg} pt="100px" pb={14} dir="rtl">
      <Container maxW="6xl" px={{ base: 4, md: 6 }}>
        <VStack spacing={6} align="stretch">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon as={FiArrowLeft} />}
            color={subTextColor}
            alignSelf="flex-start"
            fontWeight="medium"
            onClick={() => navigate(-1)}
            _hover={{ color: textColor, bg: backHoverBg }}
          >
            العودة للكورس
          </Button>

          {/* Header */}
          <Box
            bg={cardBg}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={borderColor}
            overflow="hidden"
          >
            <Box h="3px" bgGradient="linear(to-l, blue.600, blue.400)" />
            <Flex
              direction={{ base: "column", md: "row" }}
              align={{ base: "stretch", md: "center" }}
              justify="space-between"
              gap={4}
              p={{ base: 5, md: 6 }}
            >
              <HStack spacing={4} align="start">
                <Flex
                  w={12}
                  h={12}
                  borderRadius="xl"
                  bg={headerIconBg}
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Icon as={FiBarChart2} color={ACCENT} boxSize={5} />
                </Flex>
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={1}>
                    تقرير الأداء
                  </Text>
                  <Heading size="lg" color={textColor} fontWeight="bold">
                    إحصائيات الكورس
                  </Heading>
                  <Text fontSize="sm" color={subTextColor} mt={1}>
                    متابعة تقدّم الطلاب والمحاضرات والامتحانات
                  </Text>
                </Box>
              </HStack>
              <HStack spacing={2} flexWrap="wrap">
                <Badge colorScheme="blue" variant="subtle" px={3} py={1} borderRadius="md">
                  {totalStudents} طالب
                </Badge>
                <Badge colorScheme="green" variant="subtle" px={3} py={1} borderRadius="md">
                  {completionRate}% مكتملون
                </Badge>
              </HStack>
            </Flex>
          </Box>

          {/* KPIs */}
          <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={4}>
            <KpiCard
              label="الطلاب"
              value={totalStudents}
              sub="مسجّلون في الكورس"
              icon={FaUsers}
              accent="blue"
            />
            <KpiCard
              label="المحاضرات"
              value={stats.total_lectures || 0}
              sub="إجمالي المحتوى"
              icon={FaBookOpen}
              accent="orange"
            />
            <KpiCard
              label="الفيديوهات"
              value={stats.total_videos || 0}
              sub="على المنصة"
              icon={FiVideo}
              accent="purple"
            />
            <KpiCard
              label="مكتملون"
              value={progressData.completed_students || 0}
              sub={`من ${totalStudents} طالب`}
              icon={FaCheckCircle}
              accent="green"
            />
            <KpiCard
              label="واجبات المحاضرات"
              value={totalExams}
              sub="على مستوى الكورس"
              icon={FaFileAlt}
              accent="red"
            />
          </SimpleGrid>

          {/* Toolbar */}
          <Box
            bg={cardBg}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={borderColor}
            p={4}
          >
            <Flex
              direction={{ base: "column", md: "row" }}
              gap={3}
              align={{ base: "stretch", md: "center" }}
            >
              <InputGroup flex="1" minW={0}>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="ابحث باسم الطالب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg={inputBg}
                  borderColor={borderColor}
                  borderRadius="lg"
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)" }}
                />
              </InputGroup>
              <Select
                w={{ base: "full", md: "180px" }}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                bg={inputBg}
                borderColor={borderColor}
                borderRadius="lg"
              >
                <option value="all">كل الحالات</option>
                <option value="completed">مكتمل</option>
                <option value="incomplete">غير مكتمل</option>
              </Select>
              <Select
                w={{ base: "full", md: "180px" }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                bg={inputBg}
                borderColor={borderColor}
                borderRadius="lg"
              >
                <option value="alphabetical">أبجدي (أ-ي)</option>
                <option value="newest">الأحدث</option>
                <option value="oldest">الأقدم</option>
              </Select>
            </Flex>
            <Flex
              direction={{ base: "column", sm: "row" }}
              align={{ base: "stretch", sm: "center" }}
              justify="space-between"
              gap={3}
              mt={3}
            >
              <Text fontSize="xs" color={subTextColor}>
                عرض {filteredStudents.length} من {progressData.students_details?.length || 0} طالب
                {studentsWithParentPhone.length > 0 &&
                  ` — ${studentsWithParentPhone.length} لديهم رقم ولي أمر`}
              </Text>
              <Tooltip
                label={
                  studentsWithParentPhone.length === 0
                    ? "لا يوجد أرقام أولياء أمور في القائمة الحالية"
                    : "يفتح واتساب لكل ولي أمر بالترتيب — رسالة مخصصة لكل طالب"
                }
              >
                <Button
                  size="sm"
                  colorScheme="green"
                  leftIcon={<Icon as={FaWhatsapp} />}
                  isDisabled={studentsWithParentPhone.length === 0}
                  onClick={startBulkSend}
                  flexShrink={0}
                >
                  إرسال التقارير للكل ({studentsWithParentPhone.length})
                </Button>
              </Tooltip>
            </Flex>
          </Box>

          {/* Students */}
          {filteredStudents.length === 0 ? (
            <Box
              bg={cardBg}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              py={14}
              textAlign="center"
            >
              <Text color={subTextColor} fontSize="sm">
                لا يوجد طلاب مطابقون لبحثك أو الفلتر المحدد
              </Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
              {filteredStudents.map((student) => {
                const watchedCount = student.watched_lectures_count || 0;
                const totalLectures = student.total_lectures || stats.total_lectures || 0;
                const lecturesPct = student.lectures_completion_percentage || 0;
                const videosPct = student.videos_completion_percentage || 0;
                const examsPct = student.lecture_exams_completion_percentage || 0;
                const watchedVideos = student.watched_videos_count || 0;
                const totalVideos = student.total_videos || stats.total_videos || 0;
                const solvedExams = student.solved_lecture_exams_count || 0;
                const totalStudentExams = student.total_lecture_exams || stats.total_lecture_exams || 0;
                const isExpanded = expandedStudent === student.id;
                const hasParentPhone = Boolean(formatPhoneForWhatsApp(student.parent_phone));

                const progressColor = (pct) =>
                  pct === 100 ? "green" : pct >= 50 ? "blue" : "orange";

                return (
                  <Box
                    key={student.id}
                    bg={cardBg}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={borderColor}
                    overflow="hidden"
                  >
                    <Box p={5}>
                      <Flex justify="space-between" align="flex-start" gap={3} mb={4}>
                        <HStack spacing={3} minW={0} flex="1">
                          <Avatar name={student.name} bg="blue.600" color="white" size="sm" />
                          <Box minW={0}>
                            <Text fontWeight="bold" fontSize="md" color={textColor} noOfLines={1}>
                              {student.name}
                            </Text>
                            <HStack spacing={3} flexWrap="wrap" mt={0.5}>
                              {student.phone && (
                                <HStack spacing={1}>
                                  <Icon as={FiPhone} boxSize={3} color={subTextColor} />
                                  <Text fontSize="xs" color={subTextColor} dir="ltr">
                                    {student.phone}
                                  </Text>
                                </HStack>
                              )}
                              {student.parent_phone && (
                                <Text fontSize="xs" color={subTextColor}>
                                  ولي الأمر:{" "}
                                  <Text as="span" dir="ltr">
                                    {student.parent_phone}
                                  </Text>
                                </Text>
                              )}
                            </HStack>
                          </Box>
                        </HStack>
                        <StatusBadge type={progressColor(lecturesPct)}>
                          {Math.round(lecturesPct)}%
                        </StatusBadge>
                      </Flex>

                      <SimpleGrid columns={3} spacing={2} mb={4}>
                        {[
                          {
                            label: "محاضرات",
                            value: `${watchedCount}/${totalLectures}`,
                            pct: lecturesPct,
                          },
                          {
                            label: "فيديوهات",
                            value: `${watchedVideos}/${totalVideos}`,
                            pct: videosPct,
                          },
                          {
                            label: "واجبات",
                            value: `${solvedExams}/${totalStudentExams}`,
                            pct: examsPct,
                          },
                        ].map((item) => (
                          <Box
                            key={item.label}
                            p={2.5}
                            borderRadius="lg"
                            bg={miniStatBg}
                            borderWidth="1px"
                            borderColor={borderColor}
                            textAlign="center"
                          >
                            <Text fontSize="10px" color="gray.500" mb={0.5}>
                              {item.label}
                            </Text>
                            <Text fontSize="md" fontWeight="bold" color={textColor}>
                              {item.value}
                            </Text>
                            <Text fontSize="10px" color="gray.400">
                              {Math.round(item.pct)}%
                            </Text>
                          </Box>
                        ))}
                      </SimpleGrid>

                      <VStack spacing={2.5} mb={4} align="stretch">
                        {[
                          { label: "المحاضرات", pct: lecturesPct },
                          { label: "الفيديوهات", pct: videosPct },
                          { label: "الواجبات", pct: examsPct },
                        ].map((bar) => (
                          <Box key={bar.label}>
                            <Flex justify="space-between" mb={1}>
                              <Text fontSize="xs" color={subTextColor}>
                                {bar.label}
                              </Text>
                              <Text fontSize="xs" color={subTextColor}>
                                {Math.round(bar.pct)}%
                              </Text>
                            </Flex>
                            <Progress
                              value={bar.pct}
                              size="xs"
                              colorScheme={progressColor(bar.pct)}
                              borderRadius="full"
                              bg={progressTrack}
                            />
                          </Box>
                        ))}
                      </VStack>

                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          variant="ghost"
                          flex="1"
                          color={subTextColor}
                          fontWeight="medium"
                          rightIcon={
                            <Icon as={isExpanded ? FaChevronUp : FaChevronDown} boxSize={3} />
                          }
                          onClick={() =>
                            setExpandedStudent(isExpanded ? null : student.id)
                          }
                        >
                          {isExpanded ? "إخفاء" : "التفاصيل"}
                        </Button>
                        <Tooltip
                          label={
                            hasParentPhone
                              ? "فتح واتساب ولي الأمر مع التقرير"
                              : "رقم ولي الأمر غير مسجّل"
                          }
                        >
                          <Button
                            size="sm"
                            colorScheme="green"
                            leftIcon={<Icon as={FaWhatsapp} />}
                            flex="1"
                            isDisabled={!hasParentPhone}
                            onClick={() => openWhatsAppReport(student, toast)}
                          >
                            إرسال التقرير لولي الأمر
                          </Button>
                        </Tooltip>
                      </HStack>
                    </Box>

                    <Collapse in={isExpanded} animateOpacity>
                      <Box
                        px={5}
                        pb={5}
                        pt={0}
                        borderTopWidth="1px"
                        borderColor={borderColor}
                      >
                        <VStack align="stretch" spacing={4} pt={4}>
                          {student.enrolled_at && (
                            <Text fontSize="xs" color={subTextColor}>
                              تاريخ الاشتراك: {formatDate(student.enrolled_at)}
                            </Text>
                          )}

                          {(student.watched_lectures || []).length > 0 && (
                            <DetailSection
                              title="المحاضرات المكتملة"
                              count={`${student.watched_lectures.length}`}
                              type="success"
                            >
                              {student.watched_lectures.map((lecture) => (
                                <DetailRow
                                  key={lecture.id}
                                  title={lecture.title}
                                  meta={`${lecture.watched_videos || 0}/${lecture.total_videos || 0} فيديو — ${Math.round(lecture.watch_percentage || 0)}%`}
                                  badge={<StatusBadge type="success">مكتملة</StatusBadge>}
                                />
                              ))}
                            </DetailSection>
                          )}

                          {(student.not_watched_lectures || []).length > 0 && (
                            <DetailSection
                              title="محاضرات تحتاج متابعة"
                              count={`${student.not_watched_lectures.length}`}
                              type="warning"
                            >
                              {student.not_watched_lectures.map((lecture) => (
                                <DetailRow
                                  key={lecture.id}
                                  title={lecture.title}
                                  meta={`متبقي ${lecture.remaining_videos || 0} فيديو — ${Math.round(lecture.watch_percentage || 0)}%`}
                                />
                              ))}
                            </DetailSection>
                          )}

                          {(student.watched_videos || []).length > 0 && (
                            <DetailSection
                              title="فيديوهات تمت مشاهدتها"
                              count={`${student.watched_videos.length}`}
                              type="success"
                            >
                              {student.watched_videos.map((video) => (
                                <DetailRow
                                  key={video.id}
                                  title={video.title}
                                  sub={video.lecture_title}
                                  meta={
                                    video.viewed_at
                                      ? `آخر مشاهدة: ${formatDate(video.viewed_at)}`
                                      : `اكتمال: ${video.completion_percentage || 0}%`
                                  }
                                  badge={
                                    video.is_completed ? (
                                      <StatusBadge type="success">مكتمل</StatusBadge>
                                    ) : (
                                      <StatusBadge type="info">مشاهد</StatusBadge>
                                    )
                                  }
                                />
                              ))}
                            </DetailSection>
                          )}

                          {(student.not_watched_videos || []).length > 0 && (
                            <DetailSection
                              title="فيديوهات لم تُشاهد"
                              count={`${student.not_watched_videos.length}`}
                              type="warning"
                            >
                              {student.not_watched_videos.map((video) => (
                                <DetailRow
                                  key={video.id}
                                  title={video.title}
                                  sub={video.lecture_title}
                                />
                              ))}
                            </DetailSection>
                          )}

                          {(student.solved_lecture_exams || []).length > 0 && (
                            <DetailSection
                              title="واجبات محلولة"
                              count={`${student.solved_lecture_exams.length}`}
                              type="success"
                            >
                              {student.solved_lecture_exams.map((exam) => (
                                <DetailRow
                                  key={exam.id}
                                  title={exam.title}
                                  sub={exam.lecture_title}
                                  meta={examGradeLabel(exam)}
                                  badge={
                                    <StatusBadge
                                      type={
                                        exam.passed === true
                                          ? "success"
                                          : exam.passed === false
                                            ? "danger"
                                            : "warning"
                                      }
                                    >
                                      {examStatusLabel(exam)}
                                    </StatusBadge>
                                  }
                                />
                              ))}
                            </DetailSection>
                          )}

                          {(student.not_solved_lecture_exams || []).length > 0 && (
                            <DetailSection
                              title="واجبات لم تُحل"
                              count={`${student.not_solved_lecture_exams.length}`}
                              type="danger"
                            >
                              {student.not_solved_lecture_exams.map((exam) => (
                                <DetailRow
                                  key={exam.id}
                                  title={exam.title}
                                  sub={exam.lecture_title}
                                />
                              ))}
                            </DetailSection>
                          )}

                          <Button
                            size="sm"
                            w="full"
                            colorScheme="green"
                            leftIcon={<Icon as={FaWhatsapp} />}
                            isDisabled={!hasParentPhone}
                            onClick={() => openWhatsAppReport(student, toast)}
                          >
                            إرسال التقرير لولي الأمر
                          </Button>
                        </VStack>
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}
            </SimpleGrid>
          )}
        </VStack>
      </Container>

      <Modal isOpen={bulkDisclosure.isOpen} onClose={closeBulkSend} size="md" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="xl" dir="rtl">
          <ModalHeader fontSize="md" fontWeight="bold">
            إرسال التقارير لأولياء الأمور
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              {!bulkDone ? (
                <>
                  <Box p={3} bg={bulkInfoBg} borderRadius="lg">
                    <Text fontSize="sm" lineHeight="tall">
                      واتساب لا يدعم إرسال رسائل مختلفة لعدة أرقام دفعة واحدة. سنفتح محادثة
                      كل ولي أمر على حدة — أرسل الرسالة ثم انتقل للتالي.
                    </Text>
                  </Box>

                  <Box>
                    <Flex justify="space-between" mb={2}>
                      <Text fontSize="xs" color="gray.500">
                        التقدّم
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {Math.min(bulkIndex + 1, bulkQueue.length)} من {bulkQueue.length}
                      </Text>
                    </Flex>
                    <Progress value={bulkProgress} size="sm" colorScheme="green" borderRadius="full" />
                  </Box>

                  {bulkCurrentStudent && (
                    <Box
                      p={4}
                      borderWidth="1px"
                      borderColor={borderColor}
                      borderRadius="lg"
                      bg={bulkStudentBg}
                    >
                      <HStack spacing={3} mb={2}>
                        <Avatar name={bulkCurrentStudent.name} size="sm" bg="blue.600" />
                        <Box minW={0}>
                          <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                            {bulkCurrentStudent.name}
                          </Text>
                          <Text fontSize="xs" color="gray.500" dir="ltr" textAlign="right">
                            {bulkCurrentStudent.parent_phone}
                          </Text>
                        </Box>
                      </HStack>
                      <Text fontSize="xs" color="gray.500" lineHeight="tall">
                        المحاضرات: {bulkCurrentStudent.watched_lectures_count || 0}/
                        {bulkCurrentStudent.total_lectures || 0} — الفيديوهات:{" "}
                        {bulkCurrentStudent.watched_videos_count || 0}/
                        {bulkCurrentStudent.total_videos || 0}
                      </Text>
                    </Box>
                  )}
                </>
              ) : (
                <Box py={4} textAlign="center">
                  <Icon as={FaCheckCircle} color="green.500" boxSize={10} mb={3} />
                  <Text fontWeight="semibold" mb={1}>
                    تمت مراجعة كل التقارير
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    تم فتح {bulkQueue.length} محادثة واتساب. تأكد من إرسال كل رسالة قبل الإغلاق.
                  </Text>
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter gap={2} flexWrap="wrap">
            <Button variant="ghost" onClick={closeBulkSend}>
              {bulkDone ? "إغلاق" : "إلغاء"}
            </Button>
            {!bulkDone && bulkCurrentStudent && (
              <>
                <Button variant="outline" onClick={skipBulkCurrent}>
                  تخطي
                </Button>
                <Button colorScheme="green" leftIcon={<Icon as={FaWhatsapp} />} onClick={sendBulkCurrent}>
                  فتح واتساب
                </Button>
                <Button colorScheme="blue" onClick={advanceBulkQueue}>
                  تم الإرسال — التالي
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CourseStatisticsPage;
