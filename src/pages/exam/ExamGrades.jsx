import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Text,
  Flex,
  useColorModeValue,
  Container,
  Center,
  VStack,
  HStack,
  Icon,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Button,
  Spinner,
  Badge,
  Divider,
  Progress,
  useDisclosure,
  Circle,
} from "@chakra-ui/react";
import { MdAssignment, MdCheckCircle, MdCancel, MdSchedule, MdReceiptLong, MdVisibility, MdQuiz, MdTrendingUp } from "react-icons/md";
import { Link } from "react-router-dom";
import baseUrl from "../../api/baseUrl";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";

const FILTERS = [
  { id: "all", label: "الكل" },
  { id: "passed", label: "مجتاز" },
  { id: "failed", label: "غير مجتاز" },
  { id: "pending", label: "قيد الانتظار" },
];

const ExamGrades = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const { isOpen: isReportOpen, onOpen: onReportOpen, onClose: onReportClose } = useDisclosure();

  const pageBg = useColorModeValue("#F4F7FB", "gray.950");
  const cardBg = useColorModeValue("white", "gray.900");
  const textColor = useColorModeValue("slate.800", "white");
  const muted = useColorModeValue("slate.500", "gray.400");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const softBlue = useColorModeValue("blue.50", "blue.950");
  const chipIdleBg = useColorModeValue("white", "gray.800");
  const chipIdleBorder = useColorModeValue("gray.200", "gray.700");

  const submittedExams = useMemo(
    () => exams.filter((exam) => exam.status === "submitted"),
    [exams],
  );
  const pendingExams = useMemo(
    () => exams.filter((exam) => exam.status !== "submitted"),
    [exams],
  );
  const passedCount = useMemo(
    () => submittedExams.filter((exam) => exam.passed).length,
    [submittedExams],
  );
  const failedCount = useMemo(
    () => submittedExams.filter((exam) => !exam.passed).length,
    [submittedExams],
  );
  const averageGrade = useMemo(() => {
    if (!submittedExams.length) return 0;
    const total = submittedExams.reduce((sum, exam) => {
      const student = exam.student_grade ?? 0;
      const max = exam.total_grade ?? 100;
      return sum + (max > 0 ? (student / max) * 100 : 0);
    }, 0);
    return Math.round(total / submittedExams.length);
  }, [submittedExams]);

  const filteredExams = useMemo(() => {
    if (filter === "passed") return exams.filter((e) => e.status === "submitted" && e.passed);
    if (filter === "failed") return exams.filter((e) => e.status === "submitted" && !e.passed);
    if (filter === "pending") return exams.filter((e) => e.status !== "submitted");
    return exams;
  }, [exams, filter]);

  const heroMessage = useMemo(() => {
    if (!submittedExams.length && pendingExams.length) {
      return "لديك امتحانات لم تُسلَّم بعد — ابدأها من صفحة الكورس.";
    }
    if (!exams.length) return "سجّل نتائجك هنا بمجرد أداء أول امتحان.";
    if (averageGrade >= 85) return "أداؤك ممتاز — استمر بنفس القوة.";
    if (averageGrade >= 65) return "مستواك جيد، ومع المراجعة ستصل للأفضل.";
    return "كل محاولة فرصة للتقدّم — راجع التقارير وحسّن نتيجتك.";
  }, [averageGrade, exams.length, pendingExams.length, submittedExams.length]);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        const res = await baseUrl.get(
          "/api/course/my-exam-grades",
          token ? { headers: { Authorization: `Bearer ${token}` } } : {},
        );
        setExams(res.data.exams || []);
      } catch {
        setError("حدث خطأ أثناء تحميل الدرجات");
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, []);

  const openReport = useCallback(
    async (examId) => {
      setReportData(null);
      setReportError(null);
      onReportOpen();
      setReportLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await baseUrl.get(`/api/exams/${examId}/my-report`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReportData(res.data);
      } catch (err) {
        const status = err?.response?.status;
        const msg = err?.response?.data?.message || err?.message;
        if (status === 403) setReportError("غير مسموح بعرض التقرير في هذا التوقيت.");
        else if (status === 404) setReportError("التقرير غير متوفر.");
        else setReportError(msg || "حدث خطأ أثناء تحميل التقرير.");
      } finally {
        setReportLoading(false);
      }
    },
    [onReportOpen],
  );

  const closeReport = useCallback(() => {
    onReportClose();
    setReportData(null);
    setReportError(null);
  }, [onReportClose]);

  const formatDate = (value) => {
    if (!value) return "---";
    try {
      return new Date(value).toLocaleDateString("ar-EG", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return value;
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value;
    }
  };

  const getExamTypeLabel = (type) => {
    switch (type) {
      case "comprehensive":
        return "امتحان شامل";
      case "lecture":
        return "امتحان محاضرة";
      case "course_exam":
        return "امتحان كورس";
      case "course":
        return "امتحان شامل";
      default:
        return "امتحان";
    }
  };

  if (loading) return <BrandLoadingScreen />;

  if (error) {
    return (
      <Box minH="100vh" bg={pageBg} pt="100px" pb={12} dir="rtl">
        <Container maxW="container.md">
          <Center minH="50vh">
            <VStack
              spacing={5}
              p={10}
              bg={cardBg}
              borderRadius="3xl"
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="xl"
              maxW="420px"
              w="full"
            >
              <Circle size="64px" bg="red.50" color="red.500">
                <Icon as={MdCancel} boxSize={8} />
              </Circle>
              <Text color={textColor} fontWeight="bold" fontSize="lg" textAlign="center">
                {error}
              </Text>
              <Button colorScheme="blue" borderRadius="xl" onClick={() => window.location.reload()}>
                إعادة المحاولة
              </Button>
            </VStack>
          </Center>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={pageBg} pb={{ base: 28, lg: 12 }} dir="rtl">
      {/* Hero */}
      <Box position="relative" overflow="hidden" mb={6}>
        <Box
          position="absolute"
          inset={0}
          bgGradient="linear(135deg, #1D4ED8 0%, #2563EB 42%, #0EA5E9 100%)"
        />
        <Box
          position="absolute"
          top="-40px"
          left="-30px"
          w="220px"
          h="220px"
          borderRadius="full"
          bg="whiteAlpha.200"
          filter="blur(2px)"
          pointerEvents="none"
        />
        <Box
          position="absolute"
          bottom="-60px"
          right="-20px"
          w="260px"
          h="260px"
          borderRadius="full"
          bg="orange.400"
          opacity={0.18}
          pointerEvents="none"
        />

        <Container maxW="container.xl" position="relative" py={{ base: 8, md: 10 }} px={{ base: 4, md: 6 }}>
          <Flex
            direction={{ base: "column", md: "row" }}
            align={{ base: "stretch", md: "center" }}
            justify="space-between"
            gap={6}
          >
            <VStack align="flex-start" spacing={3} flex={1}>
              <HStack
                spacing={2}
                bg="whiteAlpha.200"
                px={3}
                py={1}
                borderRadius="full"
                backdropFilter="blur(8px)"
              >
                <Icon as={MdQuiz} color="white" boxSize={4} />
                <Text fontSize="xs" fontWeight="bold" color="white">
                  امتحاناتي
                </Text>
              </HStack>
              <Text
                fontSize={{ base: "2xl", md: "3xl" }}
                fontWeight="black"
                color="white"
                letterSpacing="-0.02em"
                lineHeight="1.25"
              >
                لوحة درجاتك الأكاديمية
              </Text>
              <Text fontSize={{ base: "sm", md: "md" }} color="whiteAlpha.850" maxW="520px" lineHeight="1.8">
                {heroMessage}
              </Text>
            </VStack>

            <Flex
              align="center"
              gap={4}
              bg="whiteAlpha.15"
              borderWidth="1px"
              borderColor="whiteAlpha.300"
              borderRadius="2xl"
              px={{ base: 4, md: 5 }}
              py={4}
              backdropFilter="blur(12px)"
              minW={{ md: "240px" }}
            >
              <Box position="relative" boxSize="84px">
                <svg viewBox="0 0 36 36" width="84" height="84" style={{ transform: "rotate(-90deg)" }}>
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#FDBA74"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${averageGrade}, 100`}
                  />
                </svg>
                <VStack
                  position="absolute"
                  inset={0}
                  spacing={0}
                  align="center"
                  justify="center"
                  style={{ transform: "none" }}
                >
                  <Text color="white" fontSize="xl" fontWeight="black" lineHeight="1">
                    {averageGrade}%
                  </Text>
                  <Text color="whiteAlpha.800" fontSize="10px" fontWeight="semibold">
                    المعدل
                  </Text>
                </VStack>
              </Box>
              <VStack align="flex-start" spacing={1}>
                <HStack spacing={1.5}>
                  <Icon as={MdTrendingUp} color="orange.200" />
                  <Text color="white" fontSize="sm" fontWeight="bold">
                    متوسط أدائك
                  </Text>
                </HStack>
                <Text color="whiteAlpha.800" fontSize="xs" lineHeight="1.6">
                  من {submittedExams.length} امتحان مُسلَّم
                </Text>
              </VStack>
            </Flex>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.xl" px={{ base: 4, md: 6 }}>
        {/* Stats */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 3, md: 4 }} mb={6}>
          <StatCard
            label="إجمالي الامتحانات"
            value={exams.length}
            icon={MdAssignment}
            accent="blue"
            cardBg={cardBg}
            borderColor={borderColor}
            textColor={textColor}
            muted={muted}
          />
          <StatCard
            label="المجتازة"
            value={passedCount}
            icon={MdCheckCircle}
            accent="green"
            cardBg={cardBg}
            borderColor={borderColor}
            textColor={textColor}
            muted={muted}
          />
          <StatCard
            label="غير مجتازة"
            value={failedCount}
            icon={MdCancel}
            accent="red"
            cardBg={cardBg}
            borderColor={borderColor}
            textColor={textColor}
            muted={muted}
          />
          <StatCard
            label="قيد الانتظار"
            value={pendingExams.length}
            icon={MdSchedule}
            accent="orange"
            cardBg={cardBg}
            borderColor={borderColor}
            textColor={textColor}
            muted={muted}
          />
        </SimpleGrid>

        {/* Filters + list header */}
        <Flex
          align={{ base: "stretch", sm: "center" }}
          justify="space-between"
          direction={{ base: "column", sm: "row" }}
          gap={3}
          mb={4}
        >
          <VStack align="flex-start" spacing={0}>
            <Text fontSize="lg" fontWeight="black" color={textColor}>
              سجل النتائج
            </Text>
            <Text fontSize="sm" color={muted}>
              {filteredExams.length} نتيجة معروضة
            </Text>
          </VStack>

          <HStack
            spacing={2}
            overflowX="auto"
            pb={1}
            sx={{
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {FILTERS.map((item) => {
              const active = filter === item.id;
              return (
                <Button
                  key={item.id}
                  size="sm"
                  borderRadius="full"
                  fontWeight="bold"
                  px={4}
                  flexShrink={0}
                  variant={active ? "solid" : "outline"}
                  colorScheme={active ? "blue" : "gray"}
                  bg={active ? undefined : chipIdleBg}
                  borderColor={active ? undefined : chipIdleBorder}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                </Button>
              );
            })}
          </HStack>
        </Flex>

        {/* Exam list */}
        <VStack spacing={3.5} align="stretch">
          {filteredExams.length === 0 ? (
            <Center
              py={16}
              bg={cardBg}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor={borderColor}
              borderStyle="dashed"
            >
              <VStack spacing={3}>
                <Circle size="72px" bg={softBlue} color="blue.500">
                  <Icon as={MdReceiptLong} boxSize={8} />
                </Circle>
                <Text color={textColor} fontWeight="bold">
                  لا توجد نتائج في هذا التصنيف
                </Text>
                <Text color={muted} fontSize="sm">
                  جرّب تصنيفاً آخر أو انتظر ظهور امتحانات جديدة.
                </Text>
              </VStack>
            </Center>
          ) : (
            filteredExams.map((exam) => (
              <ExamCard
                key={exam.exam_id}
                exam={exam}
                cardBg={cardBg}
                textColor={textColor}
                muted={muted}
                borderColor={borderColor}
                softBlue={softBlue}
                formatDate={formatDate}
                getExamTypeLabel={getExamTypeLabel}
                onViewReport={openReport}
              />
            ))
          )}
        </VStack>

        {/* Report modal */}
        <Modal
          isOpen={isReportOpen}
          onClose={closeReport}
          size={{ base: "full", md: "2xl" }}
          scrollBehavior="inside"
        >
          <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(6px)" />
          <ModalContent
            bg={cardBg}
            maxH={{ base: "100dvh", md: "90vh" }}
            borderRadius={{ base: 0, md: "2xl" }}
            dir="rtl"
            overflow="hidden"
          >
            <Box
              bgGradient="linear(to-l, blue.600, blue.500)"
              color="white"
              px={6}
              py={4}
            >
              <Flex align="center" justify="space-between" gap={3}>
                <VStack align="flex-start" spacing={0}>
                  <Text fontSize="xs" fontWeight="bold" opacity={0.85}>
                    تقرير مفصّل
                  </Text>
                  <Text fontSize="lg" fontWeight="black" noOfLines={1}>
                    {reportData?.exam?.title || "تقرير الامتحان"}
                  </Text>
                </VStack>
                <ModalCloseButton position="static" color="white" />
              </Flex>
            </Box>
            <ModalBody pb={6} pt={5}>
              {reportLoading && (
                <Center py={14}>
                  <VStack spacing={3}>
                    <Spinner size="lg" color="blue.500" thickness="3px" />
                    <Text color={muted} fontSize="sm">
                      جاري تحميل التقرير…
                    </Text>
                  </VStack>
                </Center>
              )}
              {reportError && !reportLoading && (
                <VStack py={10} spacing={3}>
                  <Circle size="64px" bg="red.50" color="red.500">
                    <Icon as={MdCancel} boxSize={8} />
                  </Circle>
                  <Text color={textColor} fontWeight="semibold" textAlign="center">
                    {reportError}
                  </Text>
                </VStack>
              )}
              {reportData && !reportLoading && (
                <ExamReportBody
                  report={reportData}
                  formatDateTime={formatDateTime}
                  textColor={textColor}
                  muted={muted}
                  borderColor={borderColor}
                  cardBg={cardBg}
                />
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
};

function StatCard({ label, value, icon: IconComp, accent, cardBg, borderColor, textColor, muted }) {
  const tones = {
    blue: { bg: "blue.50", color: "blue.500", darkBg: "blue.900" },
    green: { bg: "green.50", color: "green.500", darkBg: "green.900" },
    red: { bg: "red.50", color: "red.500", darkBg: "red.900" },
    orange: { bg: "orange.50", color: "orange.500", darkBg: "orange.900" },
  };
  const tone = tones[accent] || tones.blue;
  const iconBg = useColorModeValue(tone.bg, tone.darkBg);
  const shadow = useColorModeValue("sm", "none");

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="2xl"
      p={{ base: 3.5, md: 4 }}
      boxShadow={shadow}
      transition="all 0.2s"
      _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
    >
      <HStack spacing={3} align="center">
        <Flex
          w="42px"
          h="42px"
          borderRadius="xl"
          bg={iconBg}
          color={tone.color}
          align="center"
          justify="center"
          flexShrink={0}
        >
          <Icon as={IconComp} boxSize={5} />
        </Flex>
        <VStack align="flex-start" spacing={0} minW={0}>
          <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="black" color={textColor} lineHeight="1.1">
            {value}
          </Text>
          <Text fontSize="xs" color={muted} fontWeight="medium" noOfLines={1}>
            {label}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
}

function ExamCard({
  exam,
  cardBg,
  textColor,
  muted,
  borderColor,
  softBlue,
  formatDate,
  getExamTypeLabel,
  onViewReport,
}) {
  const isSubmitted = exam.status === "submitted";
  const isPassed = !!exam.passed;
  const studentGrade = exam.student_grade ?? 0;
  const totalGrade = exam.total_grade ?? 100;
  const percentage =
    isSubmitted && totalGrade ? Math.round((studentGrade / totalGrade) * 100) : 0;

  const statusColor = !isSubmitted ? "gray" : isPassed ? "green" : "red";
  const statusLabel = !isSubmitted ? "لم يُسلَّم" : isPassed ? "ناجح" : "غير مجتاز";
  const progressColorScheme = !isSubmitted ? "gray" : isPassed ? "green" : "red";
  const cardShadow = useColorModeValue("0 8px 24px rgba(15,23,42,0.04)", "none");
  const hoverBorder = useColorModeValue("blue.200", "blue.700");
  const hoverShadow = useColorModeValue("0 14px 32px rgba(37,99,235,0.1)", "lg");
  const progressTrack = useColorModeValue("gray.100", "gray.800");
  const courseId = exam.course_id ?? exam.courseId ?? null;
  const courseUrl = courseId ? `/CourseDetailsPage/${courseId}?section=exams` : null;

  const body = (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="2xl"
      overflow="hidden"
      boxShadow={cardShadow}
      transition="all 0.2s ease"
      _hover={{
        borderColor: hoverBorder,
        transform: "translateY(-2px)",
        boxShadow: hoverShadow,
      }}
    >
      <Box h="3px" bg={`${statusColor}.400`} />
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "center" }}
        gap={{ base: 4, md: 5 }}
        p={{ base: 4, md: 5 }}
      >
        <Flex
          w={{ base: "full", md: "88px" }}
          h={{ base: "auto", md: "88px" }}
          minH={{ base: "72px", md: "88px" }}
          borderRadius="2xl"
          bg={softBlue}
          color={`${statusColor}.500`}
          align="center"
          justify="center"
          flexShrink={0}
          direction="column"
          gap={0.5}
        >
          {isSubmitted ? (
            <>
              <Text fontSize="2xl" fontWeight="black" lineHeight="1" color={textColor}>
                {percentage}%
              </Text>
              <Text fontSize="11px" fontWeight="bold" color={`${statusColor}.500`}>
                {statusLabel}
              </Text>
            </>
          ) : (
            <>
              <Circle size="40px" bg="gray.100" color="gray.500">
                <Icon as={MdSchedule} boxSize={6} />
              </Circle>
              <Text fontSize="11px" fontWeight="bold" color="gray.500" mt={1}>
                لم يُسلَّم
              </Text>
            </>
          )}
        </Flex>

        <VStack align="stretch" spacing={3} flex={1} minW={0}>
          <Flex justify="space-between" align="flex-start" gap={3}>
            <VStack align="flex-start" spacing={1.5} minW={0} flex={1}>
              <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color={textColor} noOfLines={2}>
                {exam.exam_title}
              </Text>
              <HStack spacing={2} flexWrap="wrap">
                <Badge
                  borderRadius="full"
                  px={2.5}
                  py={0.5}
                  colorScheme="blue"
                  variant="subtle"
                  fontSize="10px"
                >
                  {getExamTypeLabel(exam.exam_type)}
                </Badge>
                <Text fontSize="xs" color={muted} noOfLines={1}>
                  {exam.course_title || "عام"}
                </Text>
              </HStack>
            </VStack>
            <Badge
              colorScheme={statusColor}
              borderRadius="full"
              px={2.5}
              py={1}
              fontSize="10px"
              flexShrink={0}
            >
              {statusLabel}
            </Badge>
          </Flex>

          {isSubmitted ? (
            <Box>
              <Flex justify="space-between" mb={1.5}>
                <Text fontSize="xs" color={muted}>
                  الدرجة
                </Text>
                <Text fontSize="sm" fontWeight="bold" color={textColor}>
                  {studentGrade} / {totalGrade}
                </Text>
              </Flex>
              <Progress
                value={percentage}
                size="sm"
                borderRadius="full"
                colorScheme={progressColorScheme}
                bg={progressTrack}
              />
            </Box>
          ) : (
            <Text fontSize="sm" color={muted}>
              لم تُؤدَّ هذا الامتحان بعد. ابدأه من صفحة الكورس.
            </Text>
          )}

          <Flex justify="space-between" align="center" gap={3} flexWrap="wrap">
            <Text fontSize="xs" color={muted}>
              {isSubmitted ? `تاريخ التسليم: ${formatDate(exam.submitted_at)}` : "لم يُسلَّم بعد"}
            </Text>
            {isSubmitted && onViewReport ? (
              <Button
                size="sm"
                leftIcon={<Icon as={MdVisibility} />}
                colorScheme="blue"
                variant="ghost"
                borderRadius="lg"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onViewReport(exam.exam_id);
                }}
              >
                عرض التقرير
              </Button>
            ) : !isSubmitted && courseUrl ? (
              <Button
                as={Link}
                to={courseUrl}
                size="sm"
                colorScheme="blue"
                variant="ghost"
                borderRadius="lg"
              >
                فتح صفحة الكورس
              </Button>
            ) : null}
          </Flex>
        </VStack>
      </Flex>
    </Box>
  );

  return body;
}

function ExamReportBody({ report, formatDateTime, textColor, muted, borderColor, cardBg }) {
  const { examType, exam, attempt, questions = [] } = report;
  const isLecture = examType === "lecture";
  const obtained = attempt?.obtainedGrade ?? 0;
  const total = attempt?.totalGrade ?? 100;
  const pct = total > 0 ? Math.round((obtained / total) * 100) : 0;
  const softBg = useColorModeValue("gray.50", "gray.800");
  const answerBg = useColorModeValue("gray.50", "gray.800");
  const correctBg = useColorModeValue("green.50", "green.950");

  return (
    <VStack align="stretch" spacing={5}>
      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
        <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={borderColor} bg={softBg}>
          <Text fontSize="xs" color={muted} mb={1}>
            النتيجة
          </Text>
          <Badge colorScheme={attempt?.passed ? "green" : "red"} borderRadius="full" px={3} py={1}>
            {attempt?.passed ? "ناجح" : "راسب"}
          </Badge>
        </Box>
        <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
          <Text fontSize="xs" color={muted} mb={1}>
            الدرجة
          </Text>
          <Text fontWeight="black" color={textColor} fontSize="lg">
            {obtained} / {total}
            <Text as="span" fontSize="sm" color={muted} fontWeight="medium" mr={2}>
              ({pct}%)
            </Text>
          </Text>
        </Box>
        <Box p={4} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
          <Text fontSize="xs" color={muted} mb={1}>
            تاريخ التسليم
          </Text>
          <Text fontWeight="semibold" color={textColor} fontSize="sm">
            {formatDateTime(attempt?.submittedAt)}
          </Text>
        </Box>
      </SimpleGrid>

      {exam?.title ? (
        <Text fontSize="sm" color={muted}>
          الامتحان: <Text as="span" color={textColor} fontWeight="bold">{exam.title}</Text>
        </Text>
      ) : null}

      <Divider borderColor={borderColor} />

      <Text fontWeight="black" color={textColor}>
        الأسئلة والإجابات ({questions.length})
      </Text>

      <VStack align="stretch" spacing={3}>
        {questions.map((q, i) => (
          <Box
            key={q.questionId || i}
            p={4}
            borderRadius="xl"
            bg={cardBg}
            borderWidth="1px"
            borderColor={q.isCorrect ? "green.200" : "red.200"}
            borderRightWidth="4px"
            borderRightColor={q.isCorrect ? "green.400" : "red.400"}
          >
            <HStack justify="space-between" mb={2} align="flex-start">
              <Text fontWeight="bold" color={textColor} flex={1}>
                {i + 1}. {q.questionText}
              </Text>
              <Badge colorScheme={q.isCorrect ? "green" : "red"} borderRadius="full">
                {q.isCorrect ? "صحيح" : "خطأ"}
              </Badge>
            </HStack>
            {q.questionImage ? (
              <Box as="img" src={q.questionImage} alt="" maxW="220px" borderRadius="lg" mb={3} />
            ) : null}
            <VStack align="stretch" spacing={2} fontSize="sm">
              <Flex justify="space-between" gap={3} p={2.5} borderRadius="lg" bg={answerBg}>
                <Text color={muted}>إجابتك</Text>
                <Text fontWeight="bold" color={textColor} textAlign="left">
                  {isLecture
                    ? q.yourAnswer?.text ?? q.yourAnswer?.letter ?? "—"
                    : q.yourAnswer ?? "—"}
                </Text>
              </Flex>
              <Flex justify="space-between" gap={3} p={2.5} borderRadius="lg" bg={correctBg}>
                <Text color={muted}>الإجابة الصحيحة</Text>
                <Text fontWeight="bold" color="green.600" textAlign="left">
                  {isLecture
                    ? q.correctAnswer?.text ?? q.correctAnswer?.letter ?? "—"
                    : q.correctAnswer ?? "—"}
                </Text>
              </Flex>
              {!isLecture && (q.optionA ?? q.optionB ?? q.optionC ?? q.optionD) ? (
                <Text fontSize="xs" color={muted} pt={1}>
                  الخيارات: أ: {q.optionA ?? "—"} | ب: {q.optionB ?? "—"} | ج: {q.optionC ?? "—"} | د:{" "}
                  {q.optionD ?? "—"}
                </Text>
              ) : null}
            </VStack>
          </Box>
        ))}
      </VStack>
    </VStack>
  );
}

export default ExamGrades;
