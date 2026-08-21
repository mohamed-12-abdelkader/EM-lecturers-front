import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Badge,
  Button,
  ButtonGroup,
  Collapse,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  SimpleGrid,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FiAlertCircle,
  FiArrowRight,
  FiCheckCircle,
  FiChevronDown,
  FiXCircle,
} from "react-icons/fi";
import { MdSort } from "react-icons/md";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import UserType from "../../Hooks/auth/userType";
import {
  fetchCourseLevelExamReport,
  fetchLectureExamReport,
} from "../../api/courseAssignmentReportsApi";
import {
  normalizeReportPayload,
  resolveExamReportRoute,
  buildExamManagePath,
} from "./utils/examReportUtils";
import { renderFormattedExamText } from "../../utils/renderFormattedExamText";

const NAVY = "#0E4C92";
const ORANGE = "#DD6B20";
const GREEN = "#16A34A";
const RED = "#DC2626";
const AMBER = "#D97706";
const SLATE = "#94A3B8";

function formatAnswerLabel(letter, text) {
  if (!letter && !text) return "لم يُجِب";
  if (letter && text) return `${letter} — ${text}`;
  return letter || text || "—";
}

function stripQuestionPreview(text, max = 42) {
  const clean = String(text || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "بدون نص";
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

function questionDifficulty(wrongCount, totalStudents) {
  if (!totalStudents) return { label: "بدون بيانات", color: "gray" };
  const rate = (wrongCount / totalStudents) * 100;
  if (rate >= 60) return { label: "صعب", color: "red" };
  if (rate >= 35) return { label: "متوسط", color: "orange" };
  return { label: "سهل", color: "green" };
}

function StatCard({ label, value, accent, hint }) {
  const cardBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={border}
      borderRadius="xl"
      p={4}
      textAlign="center"
    >
      <Text fontSize="xs" color={muted} mb={1}>
        {label}
      </Text>
      <Text fontSize="2xl" fontWeight="bold" color={accent || "inherit"}>
        {value}
      </Text>
      {hint ? (
        <Text fontSize="xs" color={muted} mt={1}>
          {hint}
        </Text>
      ) : null}
    </Box>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const preview = payload[0]?.payload?.preview;
  return (
    <Box
      bg="white"
      color="gray.800"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="lg"
      px={3}
      py={2}
      boxShadow="lg"
      fontSize="xs"
      dir="rtl"
      maxW="240px"
    >
      <Text fontWeight="bold" mb={0.5}>
        {label}
      </Text>
      {preview ? (
        <Text color="gray.500" mb={1} noOfLines={2}>
          {preview}
        </Text>
      ) : null}
      {payload.map((item) => (
        <Flex key={item.dataKey} justify="space-between" gap={4}>
          <Text color="gray.500">{item.name}</Text>
          <Text fontWeight="semibold">{item.value}</Text>
        </Flex>
      ))}
    </Box>
  );
}

function ReportCharts({ overall, questions }) {
  const cardBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.900", "white");
  const grid = useColorModeValue("#E2E8F0", "#334155");
  const tick = useColorModeValue("#64748B", "#94A3B8");

  const pieData = useMemo(() => {
    const correct = Number(overall.totalCorrect ?? 0);
    const wrong = Number(overall.totalWrong ?? 0);
    const unanswered = Number(
      overall.totalUnanswered ??
        questions.reduce((sum, q) => sum + (q.unansweredCount ?? 0), 0),
    );
    return [
      { name: "صحيح", value: correct, color: GREEN },
      { name: "خطأ", value: wrong, color: RED },
      { name: "بدون إجابة", value: unanswered, color: AMBER },
    ].filter((item) => item.value > 0);
  }, [overall, questions]);

  const barData = useMemo(
    () =>
      questions.map((question, index) => {
        const total =
          question.statistics?.totalStudents ??
          (question.correctCount ?? 0) + (question.wrongCount ?? 0);
        return {
          name: `س ${question.displayNumber ?? index + 1}`,
          preview: stripQuestionPreview(question.questionText, 36),
          صحيح: question.correctCount ?? 0,
          خطأ: question.wrongCount ?? 0,
          "بدون إجابة": question.unansweredCount ?? 0,
          total,
        };
      }),
    [questions],
  );

  const pieTotal = pieData.reduce((sum, item) => sum + item.value, 0);
  const chartHeight = Math.max(260, barData.length * 38);

  return (
    <SimpleGrid columns={{ base: 1, lg: 5 }} spacing={4} alignItems="stretch">
      <Box
        gridColumn={{ lg: "span 2" }}
        bg={cardBg}
        borderWidth="1px"
        borderColor={border}
        borderRadius="2xl"
        p={{ base: 4, md: 5 }}
      >
        <Heading size="sm" color={titleColor} mb={1}>
          توزيع الإجابات
        </Heading>
        <Text fontSize="xs" color={muted} mb={3}>
          نظرة سريعة على الصحيح والخطأ وبدون إجابة
        </Text>
        {pieTotal === 0 ? (
          <Flex h="220px" align="center" justify="center">
            <Text fontSize="sm" color={muted}>
              لا توجد إجابات بعد
            </Text>
          </Flex>
        ) : (
          <Box position="relative" h="220px" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={3}
                  stroke="none"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value}`, name]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #E2E8F0",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <VStack
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              spacing={0}
              pointerEvents="none"
            >
              <Text fontSize="2xl" fontWeight="black" color={titleColor} lineHeight="1">
                {pieTotal}
              </Text>
              <Text fontSize="xs" color={muted}>
                إجابة
              </Text>
            </VStack>
          </Box>
        )}
        <HStack spacing={4} justify="center" flexWrap="wrap" mt={1}>
          {pieData.map((item) => (
            <HStack key={item.name} spacing={1.5}>
              <Box w="8px" h="8px" borderRadius="full" bg={item.color} />
              <Text fontSize="xs" color={muted}>
                {item.name} ({item.value})
              </Text>
            </HStack>
          ))}
        </HStack>
      </Box>

      <Box
        gridColumn={{ lg: "span 3" }}
        bg={cardBg}
        borderWidth="1px"
        borderColor={border}
        borderRadius="2xl"
        p={{ base: 4, md: 5 }}
      >
        <Heading size="sm" color={titleColor} mb={1}>
          صعوبة الأسئلة
        </Heading>
        <Text fontSize="xs" color={muted} mb={3}>
          مقارنة الصحيح والخطأ لكل سؤال حسب الترتيب الحالي
        </Text>
        {barData.length === 0 ? (
          <Flex h="220px" align="center" justify="center">
            <Text fontSize="sm" color={muted}>
              لا توجد أسئلة لعرضها
            </Text>
          </Flex>
        ) : (
          <Box h={`${chartHeight}px`} maxH="420px" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 4, right: 8, left: 8, bottom: 4 }}
                barCategoryGap={10}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                <XAxis type="number" tick={{ fill: tick, fontSize: 11 }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={42}
                  tick={{ fill: tick, fontSize: 11 }}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "rgba(14, 76, 146, 0.06)" }}
                />
                <Bar dataKey="صحيح" stackId="answers" fill={GREEN} radius={[0, 0, 0, 0]} />
                <Bar dataKey="خطأ" stackId="answers" fill={RED} />
                <Bar
                  dataKey="بدون إجابة"
                  stackId="answers"
                  fill={SLATE}
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Box>
    </SimpleGrid>
  );
}

function StudentList({ title, students, variant, showAnswer = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const cardBg = useColorModeValue("white", "gray.900");
  const muted = useColorModeValue("gray.500", "gray.400");
  const hoverBg = useColorModeValue("blackAlpha.50", "whiteAlpha.100");
  const isCorrect = variant === "correct";
  const panelBg = useColorModeValue(
    isCorrect ? "green.50" : "red.50",
    isCorrect ? "whiteAlpha.100" : "whiteAlpha.100",
  );
  const panelBorder = useColorModeValue(
    isCorrect ? "green.200" : "red.200",
    isCorrect ? "green.700" : "red.700",
  );
  const titleColor = useColorModeValue(
    isCorrect ? "green.700" : "red.700",
    isCorrect ? "green.200" : "red.200",
  );
  const rowBorder = useColorModeValue("gray.100", "gray.700");
  const hasStudents = students.length > 0;

  return (
    <Box
      bg={panelBg}
      borderWidth="1px"
      borderColor={panelBorder}
      borderRadius="lg"
      overflow="hidden"
      h="full"
    >
      <Flex
        as={hasStudents ? "button" : "div"}
        type={hasStudents ? "button" : undefined}
        w="full"
        px={3}
        py={3}
        align="center"
        justify="space-between"
        gap={2}
        cursor={hasStudents ? "pointer" : "default"}
        onClick={hasStudents ? () => setIsOpen((prev) => !prev) : undefined}
        _hover={hasStudents ? { bg: hoverBg } : undefined}
        transition="background 0.15s ease"
      >
        <HStack spacing={2} minW={0}>
          <Icon
            as={isCorrect ? FiCheckCircle : FiXCircle}
            color={isCorrect ? "green.500" : "red.500"}
            flexShrink={0}
          />
          <Text fontWeight="bold" fontSize="sm" color={titleColor} noOfLines={1}>
            {title}
          </Text>
          <Badge
            colorScheme={isCorrect ? "green" : "red"}
            variant="subtle"
            borderRadius="full"
            px={2}
          >
            {students.length}
          </Badge>
        </HStack>

        {hasStudents ? (
          <Icon
            as={FiChevronDown}
            color={muted}
            boxSize={4}
            flexShrink={0}
            transition="transform 0.2s ease"
            transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
          />
        ) : (
          <Text fontSize="xs" color={muted}>
            لا يوجد
          </Text>
        )}
      </Flex>

      {hasStudents && (
        <Collapse in={isOpen} animateOpacity>
          <Box px={3} pb={3} pt={0}>
            <VStack spacing={2} align="stretch">
              {students.map((student) => {
                const unanswered =
                  !student.selectedAnswer && !student.selectedAnswerText;
                return (
                  <Flex
                    key={`${student.studentId}-${student.selectedAnswer || "none"}`}
                    justify="space-between"
                    align={{ base: "flex-start", sm: "center" }}
                    direction={{ base: "column", sm: "row" }}
                    gap={2}
                    bg={cardBg}
                    borderRadius="md"
                    px={3}
                    py={2.5}
                    fontSize="sm"
                    borderWidth="1px"
                    borderColor={rowBorder}
                  >
                    <Text fontWeight="medium" noOfLines={1}>
                      {student.studentName || `طالب #${student.studentId}`}
                    </Text>
                    {showAnswer && (
                      <Badge
                        colorScheme={unanswered ? "gray" : "red"}
                        variant="subtle"
                        whiteSpace="normal"
                        textAlign="center"
                      >
                        {unanswered
                          ? "لم يُجِب"
                          : formatAnswerLabel(
                              student.selectedAnswer,
                              student.selectedAnswerText,
                            )}
                      </Badge>
                    )}
                  </Flex>
                );
              })}
            </VStack>
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

function QuestionReportCard({ question, index, displayNumber, onZoomImage }) {
  const cardBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const textColor = useColorModeValue("gray.800", "white");
  const trackBg = useColorModeValue("gray.100", "whiteAlpha.200");
  const correctBg = useColorModeValue("green.50", "whiteAlpha.100");
  const correctBorder = useColorModeValue("green.200", "green.700");

  const correctStudents = question.correctStudents || [];
  const wrongStudents = question.wrongStudents || [];
  const unansweredStudents = question.unansweredStudents || [];
  const totalStudents =
    question.statistics?.totalStudents ??
    (question.correctCount ?? 0) + (question.wrongCount ?? 0);
  const correctCount = question.correctCount ?? 0;
  const wrongCount = question.wrongCount ?? 0;
  const unansweredCount = question.unansweredCount ?? unansweredStudents.length;
  const correctRate =
    totalStudents > 0 ? Math.round((correctCount / totalStudents) * 100) : 0;
  const wrongRate =
    totalStudents > 0 ? Math.round((wrongCount / totalStudents) * 100) : 0;
  const unansweredRate = Math.max(0, 100 - correctRate - wrongRate);
  const difficulty = questionDifficulty(wrongCount, totalStudents);

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={border}
      borderRadius="xl"
      overflow="hidden"
    >
      <Flex
        px={4}
        py={3}
        borderBottomWidth="1px"
        borderColor={border}
        justify="space-between"
        align="center"
        gap={3}
        flexWrap="wrap"
      >
        <HStack spacing={2}>
          <Badge colorScheme="blue" borderRadius="md">
            سؤال {displayNumber ?? index + 1}
          </Badge>
          <Badge colorScheme={difficulty.color} variant="subtle">
            {difficulty.label}
          </Badge>
          {wrongCount > 0 && (
            <Badge colorScheme="orange" variant="subtle">
              {wrongCount} خطأ
            </Badge>
          )}
        </HStack>
        <HStack spacing={3} fontSize="sm" flexWrap="wrap">
          <Text color={muted}>طلاب: {totalStudents}</Text>
          <Text color="green.500">صحيح: {correctCount}</Text>
          <Text color="red.500">خطأ: {wrongCount}</Text>
          {unansweredCount > 0 && (
            <Text color="orange.500">بدون إجابة: {unansweredCount}</Text>
          )}
          {totalStudents > 0 && (
            <Badge
              colorScheme={
                correctRate >= 70 ? "green" : correctRate >= 40 ? "yellow" : "red"
              }
            >
              {correctRate}% صح
            </Badge>
          )}
        </HStack>
      </Flex>

      <Box px={4} py={4}>
        {totalStudents > 0 && (
          <Box mb={4}>
            <Flex h="8px" bg={trackBg} borderRadius="full" overflow="hidden">
              <Box w={`${correctRate}%`} bg={GREEN} />
              <Box w={`${wrongRate}%`} bg={RED} />
              <Box w={`${unansweredRate}%`} bg={SLATE} />
            </Flex>
          </Box>
        )}

        <Box fontSize="sm" lineHeight="1.9" color={textColor} mb={question.questionImage ? 3 : 0}>
          {renderFormattedExamText(question.questionText || "")}
        </Box>

        {question.questionImage && (
          <Box mb={4} cursor="pointer" onClick={() => onZoomImage(question.questionImage)}>
            <Image
              src={question.questionImage}
              alt={`صورة السؤال ${displayNumber ?? index + 1}`}
              maxH="240px"
              borderRadius="lg"
              objectFit="contain"
            />
          </Box>
        )}

        {(question.correctAnswer || question.correctAnswerText) && (
          <Box
            mb={4}
            px={3}
            py={2.5}
            borderRadius="lg"
            bg={correctBg}
            borderWidth="1px"
            borderColor={correctBorder}
          >
            <Text fontSize="xs" color={muted} mb={1}>
              الإجابة الصحيحة
            </Text>
            <Text fontSize="sm" fontWeight="semibold" color={textColor}>
              {formatAnswerLabel(question.correctAnswer, question.correctAnswerText)}
            </Text>
          </Box>
        )}

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          <StudentList
            title="إجابات صحيحة"
            students={correctStudents}
            variant="correct"
          />
          <StudentList
            title="إجابات خاطئة / بدون إجابة"
            students={wrongStudents}
            variant="incorrect"
            showAnswer
          />
        </SimpleGrid>

        {wrongStudents.length > 0 && (
          <Text fontSize="xs" color={muted} mt={2} textAlign="center">
            اضغط على القسم لعرض من أخطأ وماذا اختار (آخر محاولة لكل طالب)
          </Text>
        )}
      </Box>
    </Box>
  );
}

export default function ExamReportPage() {
  const { id, examId: examIdParam } = useParams();
  const location = useLocation();
  const examId = id || examIdParam;
  const { kind } = resolveExamReportRoute(location.pathname);
  const examBasePath = buildExamManagePath(examId, {
    from: kind === "course-level" ? "course-level" : "lecture",
  });
  const [, isAdmin, isTeacher] = UserType();
  const isStaff = Boolean(isAdmin || isTeacher);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageZoomSrc, setImageZoomSrc] = useState(null);
  const [sortDir, setSortDir] = useState("most-errors");

  const pageBg = useColorModeValue("#F4F7FB", "gray.950");
  const cardBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.900", "white");
  const warnBg = useColorModeValue("orange.50", "whiteAlpha.100");
  const warnBorder = useColorModeValue("orange.200", "orange.700");

  const fetchReport = useCallback(async () => {
    if (!examId) return;
    setLoading(true);
    setError(null);
    try {
      const raw =
        kind === "course-level"
          ? await fetchCourseLevelExamReport(examId)
          : await fetchLectureExamReport(examId);
      setReport(normalizeReportPayload(raw));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "حدث خطأ أثناء تحميل التقرير",
      );
    } finally {
      setLoading(false);
    }
  }, [examId, kind]);

  useEffect(() => {
    if (isStaff) fetchReport();
  }, [fetchReport, isStaff]);

  const reportExam = report?.exam || {};
  const overall = report?.overallStatistics || {};
  const sourceQuestions = useMemo(
    () =>
      Array.isArray(report?.questions) && report.questions.length
        ? report.questions
        : Array.isArray(report?.sortedQuestions)
          ? report.sortedQuestions
          : [],
    [report],
  );

  const numberedQuestions = useMemo(
    () =>
      sourceQuestions.map((question, index) => ({
        ...question,
        displayNumber: index + 1,
      })),
    [sourceQuestions],
  );

  const displayedQuestions = useMemo(() => {
    const list = [...numberedQuestions];
    list.sort((a, b) => {
      const wrongDiff = (a.wrongCount ?? 0) - (b.wrongCount ?? 0);
      if (wrongDiff !== 0) {
        return sortDir === "most-errors" ? -wrongDiff : wrongDiff;
      }
      return (a.displayNumber ?? 0) - (b.displayNumber ?? 0);
    });
    return list;
  }, [numberedQuestions, sortDir]);

  const problematic = useMemo(
    () =>
      Array.isArray(report?.mostProblematicQuestions)
        ? report.mostProblematicQuestions
        : [],
    [report],
  );

  const accuracy =
    (overall.totalCorrect ?? 0) + (overall.totalWrong ?? 0) > 0
      ? Math.round(
          ((overall.totalCorrect ?? 0) /
            ((overall.totalCorrect ?? 0) + (overall.totalWrong ?? 0))) *
            100,
        )
      : 0;

  if (!isStaff) {
    return <Navigate to={examBasePath} replace />;
  }

  if (loading) {
    return <BrandLoadingScreen />;
  }

  if (error) {
    return (
      <Box minH="100vh" bg={pageBg} pt={{ base: "4.75rem", md: "5.25rem" }} pb={12} dir="rtl">
        <Container maxW="3xl">
          <VStack spacing={4} py={16} textAlign="center">
            <Text color="red.500" fontWeight="semibold">
              {error}
            </Text>
            <HStack spacing={3}>
              <Button colorScheme="blue" onClick={fetchReport}>
                إعادة المحاولة
              </Button>
              <Button as={Link} to={examBasePath} variant="outline">
                العودة للامتحان
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={pageBg} pt={{ base: "4.75rem", md: "5.25rem" }} pb={14} dir="rtl">
      <Container maxW="6xl" px={{ base: 4, md: 6 }}>
        <VStack spacing={6} align="stretch">
          <Button
            as={Link}
            to={examBasePath}
            variant="ghost"
            size="sm"
            alignSelf="flex-start"
            leftIcon={<Icon as={FiArrowRight} />}
            color={muted}
            _hover={{ color: titleColor }}
          >
            العودة للامتحان
          </Button>

          <Box
            bg={cardBg}
            borderWidth="1px"
            borderColor={border}
            borderRadius="2xl"
            overflow="hidden"
          >
            <Box h="3px" bgGradient={`linear(to-l, ${NAVY}, ${ORANGE})`} />
            <Box p={{ base: 5, md: 6 }}>
              <Text fontSize="xs" fontWeight="semibold" color={muted} mb={1}>
                {kind === "course-level" ? "تقرير الامتحان الشامل" : "تقرير الواجب / امتحان المحاضرة"}
              </Text>
              <Heading size="lg" color={titleColor} mb={2}>
                {reportExam.title || "امتحان"}
              </Heading>
              <HStack spacing={4} flexWrap="wrap" fontSize="sm" color={muted}>
                {reportExam.courseTitle && <Text>الكورس: {reportExam.courseTitle}</Text>}
                {reportExam.lectureTitle && <Text>المحاضرة: {reportExam.lectureTitle}</Text>}
                {reportExam.scope && (
                  <Badge colorScheme={reportExam.scope === "lecture" ? "purple" : "orange"} variant="subtle">
                    {reportExam.scope === "lecture" ? "محاضرة" : "واجب كورس"}
                  </Badge>
                )}
                {reportExam.type && (
                  <Badge colorScheme="blue" variant="subtle">
                    {reportExam.type === "exam" ? "امتحان" : "واجب"}
                  </Badge>
                )}
                <Text>عدد الأسئلة: {reportExam.questionsCount ?? overall.totalQuestions ?? 0}</Text>
                <Text color="blue.500">آخر محاولة لكل طالب</Text>
              </HStack>
            </Box>
          </Box>

          {displayedQuestions.length > 0 && (
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
              <StatCard label="عدد الطلاب" value={overall.totalStudents ?? 0} />
              <StatCard
                label="عدد الأسئلة"
                value={overall.totalQuestions ?? displayedQuestions.length}
              />
              <StatCard
                label="نسبة الصحة"
                value={`${accuracy}%`}
                accent="green.500"
                hint={`${overall.totalCorrect ?? 0} إجابة صحيحة`}
              />
              <StatCard
                label="إجابات خاطئة"
                value={overall.totalWrong ?? 0}
                accent="red.500"
              />
            </SimpleGrid>
          )}

          {displayedQuestions.length > 0 && (
            <ReportCharts overall={overall} questions={displayedQuestions} />
          )}

          {problematic.length > 0 && (
            <Box
              bg={warnBg}
              borderWidth="1px"
              borderColor={warnBorder}
              borderRadius="xl"
              p={4}
            >
              <HStack spacing={2} mb={3}>
                <Icon as={FiAlertCircle} color="orange.500" />
                <Heading size="sm" color={titleColor}>
                  أكثر الأسئلة إثارة للمشاكل
                </Heading>
              </HStack>
              <VStack align="stretch" spacing={2}>
                {problematic.map((item) => (
                  <Flex
                    key={item.questionId}
                    justify="space-between"
                    align="center"
                    gap={3}
                    fontSize="sm"
                    flexWrap="wrap"
                  >
                    <Text noOfLines={1} flex={1} minW={0}>
                      {renderFormattedExamText(item.questionText || "")}
                    </Text>
                    <Badge colorScheme="red" variant="subtle">
                      {item.wrongAnswers ?? item.wrongCount ?? 0} خطأ ({item.wrongPercentage ?? 0}%)
                    </Badge>
                  </Flex>
                ))}
              </VStack>
            </Box>
          )}

          {displayedQuestions.length === 0 ? (
            <Box
              bg={cardBg}
              borderWidth="1px"
              borderColor={border}
              borderRadius="xl"
              p={8}
              textAlign="center"
            >
              <Text color={muted}>لا توجد بيانات في التقرير بعد — لم يُسلِّم أي طالب المحاولة.</Text>
            </Box>
          ) : (
            <VStack spacing={4} align="stretch">
              <Flex
                justify="space-between"
                align={{ base: "stretch", md: "center" }}
                gap={3}
                direction={{ base: "column", md: "row" }}
              >
                <Box>
                  <Heading size="sm" color={titleColor}>
                    تفاصيل الأسئلة
                  </Heading>
                  <Text fontSize="xs" color={muted} mt={1}>
                    {sortDir === "most-errors"
                      ? "مرتبة من الأكثر خطأً إلى الأقل"
                      : "مرتبة من الأقل خطأً إلى الأكثر"}
                  </Text>
                </Box>
                <ButtonGroup size="sm" isAttached variant="outline">
                  <Button
                    leftIcon={<Icon as={MdSort} />}
                    colorScheme={sortDir === "most-errors" ? "orange" : "gray"}
                    variant={sortDir === "most-errors" ? "solid" : "outline"}
                    onClick={() => setSortDir("most-errors")}
                  >
                    الأكثر خطأً
                  </Button>
                  <Button
                    colorScheme={sortDir === "least-errors" ? "blue" : "gray"}
                    variant={sortDir === "least-errors" ? "solid" : "outline"}
                    onClick={() => setSortDir("least-errors")}
                  >
                    الأقل خطأً
                  </Button>
                </ButtonGroup>
              </Flex>
              {displayedQuestions.map((question, index) => (
                <QuestionReportCard
                  key={question.questionId || index}
                  question={question}
                  index={index}
                  displayNumber={question.displayNumber}
                  onZoomImage={setImageZoomSrc}
                />
              ))}
            </VStack>
          )}
        </VStack>
      </Container>

      <Modal
        isOpen={Boolean(imageZoomSrc)}
        onClose={() => setImageZoomSrc(null)}
        size="4xl"
        isCentered
      >
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="transparent" boxShadow="none">
          <ModalBody p={4} display="flex" justifyContent="center">
            {imageZoomSrc && (
              <Image
                src={imageZoomSrc}
                alt="صورة السؤال"
                maxH="85vh"
                objectFit="contain"
                borderRadius="lg"
                cursor="pointer"
                onClick={() => setImageZoomSrc(null)}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
