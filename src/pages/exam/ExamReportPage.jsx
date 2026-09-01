import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Progress,
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
  FiHelpCircle,
  FiTrendingUp,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import { MdSort, MdOutlineAssignment } from "react-icons/md";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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
import { fetchExamAttemptReport } from "../../api/courseExamsApi";
import { readAuthToken } from "../../utils/authStorage";
import {
  normalizeAttemptReport,
} from "../../utils/examAttemptResultUtils";
import ExamAttemptResultScreen from "./components/ExamAttemptResultScreen";
import {
  normalizeReportPayload,
  resolveExamReportRoute,
  buildExamManagePath,
} from "./utils/examReportUtils";
import { renderFormattedExamText } from "../../utils/renderFormattedExamText";
import ExamEnrollmentSummary from "./components/ExamEnrollmentSummary";

const NAVY = "#0E4C92";
const NAVY_DEEP = "#082B57";
const ORANGE = "#DD6B20";
const GREEN = "#059669";
const GREEN_SOFT = "#10B981";
const RED = "#DC2626";
const RED_SOFT = "#F87171";
const AMBER = "#D97706";
const SLATE = "#94A3B8";

function courseExamsPath(courseId) {
  if (courseId == null || courseId === "") return null;
  return `/CourseDetailsPage/${courseId}?section=exams`;
}

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

function StatCard({ label, value, accent = NAVY, hint, icon: StatIcon }) {
  const cardBg = useColorModeValue("white", "gray.900");
  const muted = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const soft = useColorModeValue(`${accent}14`, "whiteAlpha.100");

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="2xl"
      p={4}
      position="relative"
      overflow="hidden"
      boxShadow="sm"
      transition="transform 0.15s ease, box-shadow 0.15s ease"
      _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
    >
      <Box
        position="absolute"
        insetInlineStart={0}
        top={0}
        bottom={0}
        w="4px"
        bg={accent}
      />
      <Flex align="flex-start" justify="space-between" gap={3}>
        <Box minW={0}>
          <Text fontSize="xs" fontWeight="semibold" color={muted} mb={1.5}>
            {label}
          </Text>
          <Text
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight="black"
            color={accent}
            lineHeight="1"
            letterSpacing="-0.03em"
          >
            {value}
          </Text>
          {hint ? (
            <Text fontSize="xs" color={muted} mt={2} noOfLines={1}>
              {hint}
            </Text>
          ) : null}
        </Box>
        {StatIcon ? (
          <Flex
            w="42px"
            h="42px"
            borderRadius="xl"
            align="center"
            justify="center"
            bg={soft}
            color={accent}
            flexShrink={0}
          >
            <Icon as={StatIcon} boxSize={5} />
          </Flex>
        ) : null}
      </Flex>
    </Box>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const preview = payload[0]?.payload?.preview;
  const total = payload.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  return (
    <Box
      bg="white"
      color="gray.800"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      px={3.5}
      py={3}
      boxShadow="xl"
      fontSize="xs"
      dir="rtl"
      maxW="260px"
    >
      <Text fontWeight="black" fontSize="sm" mb={0.5} color={NAVY}>
        {label}
      </Text>
      {preview ? (
        <Text color="gray.500" mb={2} noOfLines={2} lineHeight="1.5">
          {preview}
        </Text>
      ) : null}
      <VStack align="stretch" spacing={1.5}>
        {payload.map((item) => (
          <Flex key={item.dataKey} justify="space-between" gap={5} align="center">
            <HStack spacing={1.5}>
              <Box w="8px" h="8px" borderRadius="full" bg={item.color || item.fill} />
              <Text color="gray.600">{item.name}</Text>
            </HStack>
            <Text fontWeight="bold">{item.value}</Text>
          </Flex>
        ))}
      </VStack>
      {total > 0 ? (
        <Text mt={2} pt={2} borderTopWidth="1px" borderColor="gray.100" color="gray.500">
          الإجمالي: <Text as="span" fontWeight="bold" color="gray.800">{total}</Text>
        </Text>
      ) : null}
    </Box>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <Box
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      px={3}
      py={2.5}
      boxShadow="xl"
      fontSize="xs"
      dir="rtl"
    >
      <HStack spacing={2}>
        <Box w="10px" h="10px" borderRadius="full" bg={item.color} />
        <Text fontWeight="bold">{item.name}</Text>
      </HStack>
      <Text mt={1} color="gray.600">
        {item.value} إجابة · {item.percent}%
      </Text>
    </Box>
  );
}

function ReportCharts({ overall, questions }) {
  const cardBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.900", "white");
  const grid = useColorModeValue("#E2E8F0", "#334155");
  const tick = useColorModeValue("#475569", "#94A3B8");
  const panelSoft = useColorModeValue("#F8FAFC", "whiteAlpha.50");

  const pieData = useMemo(() => {
    const correct = Number(overall.totalCorrect ?? 0);
    const wrong = Number(overall.totalWrong ?? 0);
    const unanswered = Number(
      overall.totalUnanswered ??
        questions.reduce((sum, q) => sum + (q.unansweredCount ?? 0), 0),
    );
    const total = correct + wrong + unanswered;
    return [
      { name: "صحيح", value: correct, color: GREEN },
      { name: "خطأ", value: wrong, color: RED },
      { name: "بدون إجابة", value: unanswered, color: AMBER },
    ]
      .filter((item) => item.value > 0)
      .map((item) => ({
        ...item,
        percent: total > 0 ? Math.round((item.value / total) * 100) : 0,
      }));
  }, [overall, questions]);

  const barData = useMemo(
    () =>
      questions.map((question, index) => {
        const correct = question.correctCount ?? 0;
        const wrong = question.wrongCount ?? 0;
        const unanswered = question.unansweredCount ?? 0;
        const total =
          question.statistics?.totalStudents ?? correct + wrong + unanswered;
        return {
          name: `س ${question.displayNumber ?? index + 1}`,
          preview: stripQuestionPreview(question.questionText, 48),
          صحيح: correct,
          خطأ: wrong,
          "بدون إجابة": unanswered,
          total,
          successRate: total > 0 ? Math.round((correct / total) * 100) : 0,
        };
      }),
    [questions],
  );

  const pieTotal = pieData.reduce((sum, item) => sum + item.value, 0);
  const chartHeight = Math.min(520, Math.max(300, barData.length * 44));

  return (
    <SimpleGrid columns={{ base: 1, lg: 5 }} spacing={5} alignItems="stretch">
      <Box
        gridColumn={{ lg: "span 2" }}
        bg={cardBg}
        borderWidth="1px"
        borderColor={border}
        borderRadius="2xl"
        p={{ base: 4, md: 5 }}
        boxShadow="sm"
      >
        <Flex justify="space-between" align="flex-start" mb={1} gap={3}>
          <Box>
            <Heading size="sm" color={titleColor}>
              توزيع الإجابات
            </Heading>
            <Text fontSize="xs" color={muted} mt={1}>
              نسبة الصحيح والخطأ وبدون إجابة على مستوى الامتحان
            </Text>
          </Box>
          <Badge colorScheme="blue" variant="subtle" borderRadius="full" px={2.5}>
            إجمالي {pieTotal}
          </Badge>
        </Flex>

        {pieTotal === 0 ? (
          <Flex h="260px" align="center" justify="center" bg={panelSoft} borderRadius="xl" mt={4}>
            <Text fontSize="sm" color={muted}>
              لا توجد إجابات بعد
            </Text>
          </Flex>
        ) : (
          <>
            <Box position="relative" h={{ base: "240px", md: "260px" }} dir="ltr" mt={2}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={4}
                    stroke="#fff"
                    strokeWidth={3}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                    <LabelList
                      dataKey="percent"
                      position="outside"
                      formatter={(v) => `${v}%`}
                      style={{ fontSize: 11, fontWeight: 700, fill: tick }}
                    />
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
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
                <Text fontSize="3xl" fontWeight="black" color={titleColor} lineHeight="1">
                  {pieTotal}
                </Text>
                <Text fontSize="xs" fontWeight="semibold" color={muted}>
                  إجابة
                </Text>
              </VStack>
            </Box>

            <SimpleGrid columns={pieData.length} spacing={2} mt={1}>
              {pieData.map((item) => (
                <Box
                  key={item.name}
                  bg={panelSoft}
                  borderRadius="xl"
                  px={3}
                  py={2.5}
                  textAlign="center"
                  borderTopWidth="3px"
                  borderTopColor={item.color}
                >
                  <Text fontSize="lg" fontWeight="black" color={item.color} lineHeight="1">
                    {item.percent}%
                  </Text>
                  <Text fontSize="xs" color={muted} mt={1} fontWeight="semibold">
                    {item.name}
                  </Text>
                  <Text fontSize="xs" color={muted}>
                    {item.value}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </>
        )}
      </Box>

      <Box
        gridColumn={{ lg: "span 3" }}
        bg={cardBg}
        borderWidth="1px"
        borderColor={border}
        borderRadius="2xl"
        p={{ base: 4, md: 5 }}
        boxShadow="sm"
      >
        <Flex justify="space-between" align="flex-start" mb={1} gap={3} flexWrap="wrap">
          <Box>
            <Heading size="sm" color={titleColor}>
              أداء الأسئلة بالتفصيل
            </Heading>
            <Text fontSize="xs" color={muted} mt={1}>
              شريط مكدّس يوضح الصحيح والخطأ وبدون إجابة لكل سؤال
            </Text>
          </Box>
          <HStack spacing={3} fontSize="xs" color={muted} flexWrap="wrap">
            <HStack spacing={1}>
              <Box w="10px" h="10px" borderRadius="sm" bg={GREEN} />
              <Text>صحيح</Text>
            </HStack>
            <HStack spacing={1}>
              <Box w="10px" h="10px" borderRadius="sm" bg={RED} />
              <Text>خطأ</Text>
            </HStack>
            <HStack spacing={1}>
              <Box w="10px" h="10px" borderRadius="sm" bg={SLATE} />
              <Text>بدون إجابة</Text>
            </HStack>
          </HStack>
        </Flex>

        {barData.length === 0 ? (
          <Flex h="260px" align="center" justify="center" bg={panelSoft} borderRadius="xl" mt={4}>
            <Text fontSize="sm" color={muted}>
              لا توجد أسئلة لعرضها
            </Text>
          </Flex>
        ) : (
          <Box
            h={`${chartHeight}px`}
            maxH="520px"
            mt={3}
            dir="ltr"
            bg={panelSoft}
            borderRadius="xl"
            px={2}
            py={3}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 8, right: 28, left: 4, bottom: 8 }}
                barCategoryGap="18%"
                barSize={18}
              >
                <CartesianGrid strokeDasharray="4 6" stroke={grid} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: tick, fontSize: 11, fontWeight: 600 }}
                  allowDecimals={false}
                  axisLine={{ stroke: grid }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={48}
                  tick={{ fill: tick, fontSize: 12, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "rgba(14, 76, 146, 0.08)" }}
                />
                <Bar dataKey="صحيح" stackId="answers" fill={GREEN} radius={[4, 0, 0, 4]}>
                  {barData.map((entry) => (
                    <Cell
                      key={`ok-${entry.name}`}
                      fill={entry.successRate >= 70 ? GREEN_SOFT : GREEN}
                    />
                  ))}
                </Bar>
                <Bar dataKey="خطأ" stackId="answers" fill={RED}>
                  {barData.map((entry) => (
                    <Cell
                      key={`bad-${entry.name}`}
                      fill={entry.خطأ > entry.صحيح ? RED_SOFT : RED}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="بدون إجابة"
                  stackId="answers"
                  fill={SLATE}
                  radius={[0, 4, 4, 0]}
                >
                  <LabelList
                    dataKey="total"
                    position="right"
                    style={{ fontSize: 11, fontWeight: 700, fill: tick }}
                  />
                </Bar>
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
      borderRadius="xl"
      overflow="hidden"
      h="full"
    >
      <Flex
        as={hasStudents ? "button" : "div"}
        type={hasStudents ? "button" : undefined}
        w="full"
        px={3.5}
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
            variant="solid"
            borderRadius="full"
            px={2}
            fontSize="xs"
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
                    borderRadius="lg"
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
                        borderRadius="md"
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
  const border = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const muted = useColorModeValue("gray.500", "gray.400");
  const textColor = useColorModeValue("gray.800", "white");
  const headerBg = useColorModeValue("gray.50", "whiteAlpha.50");
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
      borderRadius="2xl"
      overflow="hidden"
      boxShadow="sm"
      transition="box-shadow 0.15s ease"
      _hover={{ boxShadow: "md" }}
    >
      <Flex
        px={4}
        py={3.5}
        bg={headerBg}
        borderBottomWidth="1px"
        borderColor={border}
        justify="space-between"
        align="center"
        gap={3}
        flexWrap="wrap"
      >
        <HStack spacing={2} flexWrap="wrap">
          <Badge
            bg={NAVY}
            color="white"
            borderRadius="lg"
            px={2.5}
            py={1}
            fontSize="xs"
          >
            سؤال {displayNumber ?? index + 1}
          </Badge>
          <Badge colorScheme={difficulty.color} variant="subtle" borderRadius="full">
            {difficulty.label}
          </Badge>
          {wrongCount > 0 && (
            <Badge colorScheme="orange" variant="subtle" borderRadius="full">
              {wrongCount} خطأ
            </Badge>
          )}
        </HStack>
        <HStack spacing={3} fontSize="sm" flexWrap="wrap">
          <Text color={muted}>طلاب: {totalStudents}</Text>
          <Text color="green.500" fontWeight="semibold">
            صحيح: {correctCount}
          </Text>
          <Text color="red.500" fontWeight="semibold">
            خطأ: {wrongCount}
          </Text>
          {unansweredCount > 0 && (
            <Text color="orange.500" fontWeight="semibold">
              بدون إجابة: {unansweredCount}
            </Text>
          )}
          {totalStudents > 0 && (
            <Badge
              colorScheme={
                correctRate >= 70 ? "green" : correctRate >= 40 ? "yellow" : "red"
              }
              borderRadius="full"
              px={2.5}
            >
              {correctRate}% صح
            </Badge>
          )}
        </HStack>
      </Flex>

      <Box px={4} py={4}>
        {totalStudents > 0 && (
          <Box mb={4}>
            <Flex justify="space-between" mb={1.5} fontSize="xs" color={muted}>
              <Text>توزيع الإجابات</Text>
              <Text fontWeight="bold">{correctRate}% نجاح</Text>
            </Flex>
            <Flex h="10px" bg="blackAlpha.100" borderRadius="full" overflow="hidden">
              <Box w={`${correctRate}%`} bg={GREEN} transition="width 0.3s ease" />
              <Box w={`${wrongRate}%`} bg={RED} />
              <Box w={`${unansweredRate}%`} bg={SLATE} />
            </Flex>
          </Box>
        )}

        <Box
          fontSize="sm"
          lineHeight="1.9"
          color={textColor}
          mb={question.questionImage ? 3 : 0}
        >
          {renderFormattedExamText(question.questionText || "")}
        </Box>

        {question.questionImage && (
          <Box
            mb={4}
            cursor="zoom-in"
            onClick={() => onZoomImage(question.questionImage)}
            borderRadius="xl"
            overflow="hidden"
            borderWidth="1px"
            borderColor={border}
            bg="blackAlpha.50"
            p={2}
          >
            <Image
              src={question.questionImage}
              alt={`صورة السؤال ${displayNumber ?? index + 1}`}
              maxH="240px"
              mx="auto"
              borderRadius="lg"
              objectFit="contain"
            />
          </Box>
        )}

        {(question.correctAnswer || question.correctAnswerText) && (
          <Box
            mb={4}
            px={3.5}
            py={3}
            borderRadius="xl"
            bg={correctBg}
            borderWidth="1px"
            borderColor={correctBorder}
          >
            <Text fontSize="xs" color={muted} mb={1} fontWeight="semibold">
              الإجابة الصحيحة
            </Text>
            <Text fontSize="sm" fontWeight="bold" color={textColor}>
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
          <Text fontSize="xs" color={muted} mt={2.5} textAlign="center">
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
  const navigate = useNavigate();
  const examId = id || examIdParam;
  const { kind } = resolveExamReportRoute(location.pathname);
  const examBasePath = buildExamManagePath(examId, {
    from: kind === "course-level" ? "course-level" : "lecture",
  });
  const [, isAdmin, isTeacher, student] = UserType();
  const isStaff = Boolean(isAdmin || isTeacher);

  const [report, setReport] = useState(null);
  const [studentResult, setStudentResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [imageZoomSrc, setImageZoomSrc] = useState(null);
  const [sortDir, setSortDir] = useState("most-errors");
  const [passPercentage, setPassPercentage] = useState(50);
  const reportRef = useRef(null);

  const pageBg = useColorModeValue("#EEF3F9", "gray.950");
  const cardBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.900", "white");
  const warnBg = useColorModeValue("orange.50", "whiteAlpha.100");
  const warnBorder = useColorModeValue("orange.200", "orange.700");

  const fetchReport = useCallback(async () => {
    if (!examId) return;
    const isRefresh = Boolean(reportRef.current);
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const raw =
        kind === "course-level"
          ? await fetchCourseLevelExamReport(examId, { passPercentage })
          : await fetchLectureExamReport(examId, { passPercentage });
      const normalized = normalizeReportPayload(raw);
      reportRef.current = normalized;
      setReport(normalized);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "حدث خطأ أثناء تحميل التقرير",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [examId, kind, passPercentage]);

  const fetchStudentAttemptReport = useCallback(async () => {
    if (!examId) return;
    setLoading(true);
    setError(null);
    try {
      const token = readAuthToken() || localStorage.getItem("token");
      const raw = await fetchExamAttemptReport(examId, token);
      const normalized = normalizeAttemptReport(raw);
      if (!normalized) {
        throw new Error("لا توجد محاولة مكتملة لهذا الامتحان");
      }
      setStudentResult(normalized);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          err.message ||
          "حدث خطأ أثناء تحميل التقرير",
      );
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    if (isStaff) {
      fetchReport();
      return;
    }
    if (student) {
      fetchStudentAttemptReport();
      return;
    }
    setLoading(false);
  }, [fetchReport, fetchStudentAttemptReport, isStaff, student]);

  const reportExam = report?.exam || {};
  const overall = report?.overallStatistics || {};
  const enrollmentSummary = report?.enrollmentSummary;
  const notExaminedStudents = report?.notExaminedStudents || [];
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

  const goToCourseExams = () => {
    const courseId =
      location.state?.courseId ||
      studentResult?.courseId ||
      report?.exam?.courseId ||
      report?.exam?.course_id ||
      null;
    const path = courseExamsPath(courseId);
    if (path) navigate(path);
    else navigate(-1);
  };

  if (!isStaff) {
    if (!student) {
      return <Navigate to="/login" replace />;
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
              <Button colorScheme="blue" onClick={goToCourseExams}>
                العودة لصفحة الكورس
              </Button>
            </VStack>
          </Container>
        </Box>
      );
    }
    return (
      <>
        <ExamAttemptResultScreen
          result={studentResult}
          examTitle={studentResult?.examTitle}
          pageBg={pageBg}
          onBack={goToCourseExams}
          onZoomImage={setImageZoomSrc}
        />
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
      </>
    );
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
            _hover={{ color: titleColor, bg: "blackAlpha.50" }}
          >
            العودة للامتحان
          </Button>

          <Box
            borderRadius="2xl"
            overflow="hidden"
            boxShadow="lg"
            bg={`linear-gradient(125deg, ${NAVY_DEEP} 0%, ${NAVY} 55%, #1A6BB8 100%)`}
            color="white"
            position="relative"
          >
            <Box
              position="absolute"
              inset={0}
              opacity={0.18}
              pointerEvents="none"
              backgroundImage="radial-gradient(circle at 20% 20%, white 0, transparent 45%), radial-gradient(circle at 90% 10%, #F6AD55 0, transparent 35%)"
            />
            <Box position="relative" p={{ base: 5, md: 7 }}>
              <HStack spacing={2} mb={3} flexWrap="wrap">
                <Badge bg="whiteAlpha.200" color="white" borderRadius="full" px={3}>
                  {kind === "course-level"
                    ? "تقرير الامتحان الشامل"
                    : "تقرير الواجب / امتحان المحاضرة"}
                </Badge>
                <Badge bg={ORANGE} color="white" borderRadius="full" px={3}>
                  آخر محاولة لكل طالب
                </Badge>
              </HStack>

              <Heading
                size={{ base: "md", md: "lg" }}
                mb={3}
                letterSpacing="-0.02em"
                lineHeight="1.35"
              >
                {reportExam.title || "امتحان"}
              </Heading>

              <HStack spacing={3} flexWrap="wrap" fontSize="sm" opacity={0.92}>
                {reportExam.courseTitle && <Text>الكورس: {reportExam.courseTitle}</Text>}
                {reportExam.lectureTitle && <Text>المحاضرة: {reportExam.lectureTitle}</Text>}
                {reportExam.scope && (
                  <Badge bg="whiteAlpha.250" color="white" borderRadius="full">
                    {reportExam.scope === "lecture" ? "محاضرة" : "واجب كورس"}
                  </Badge>
                )}
                {reportExam.type && (
                  <Badge bg="whiteAlpha.250" color="white" borderRadius="full">
                    {reportExam.type === "exam" ? "امتحان" : "واجب"}
                  </Badge>
                )}
                <Text>
                  عدد الأسئلة: {reportExam.questionsCount ?? overall.totalQuestions ?? 0}
                </Text>
                {enrollmentSummary?.enrolledTotal != null ? (
                  <Text>المشتركون: {enrollmentSummary.enrolledTotal}</Text>
                ) : null}
              </HStack>

              {displayedQuestions.length > 0 && (
                <Box mt={5} maxW="420px">
                  <Flex justify="space-between" mb={1.5} fontSize="xs" opacity={0.9}>
                    <Text>نسبة الصحة العامة</Text>
                    <Text fontWeight="bold">{accuracy}%</Text>
                  </Flex>
                  <Progress
                    value={accuracy}
                    size="sm"
                    borderRadius="full"
                    bg="whiteAlpha.300"
                    sx={{
                      "& > div": {
                        background: `linear-gradient(90deg, ${ORANGE}, #F6E05E)`,
                      },
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>

          {enrollmentSummary ? (
            <ExamEnrollmentSummary
              summary={enrollmentSummary}
              students={notExaminedStudents}
              passPercentage={passPercentage}
              onPassPercentageChange={setPassPercentage}
              isRefreshing={refreshing}
              examTitle={reportExam.title || ""}
              courseTitle={reportExam.courseTitle || ""}
            />
          ) : null}

          {displayedQuestions.length > 0 && (
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <StatCard
                label="عدد الطلاب"
                value={overall.totalStudents ?? 0}
                accent={NAVY}
                icon={FiUsers}
              />
              <StatCard
                label="عدد الأسئلة"
                value={overall.totalQuestions ?? displayedQuestions.length}
                accent="#1D4ED8"
                icon={MdOutlineAssignment}
              />
              <StatCard
                label="نسبة الصحة"
                value={`${accuracy}%`}
                accent={GREEN}
                hint={`${overall.totalCorrect ?? 0} إجابة صحيحة`}
                icon={FiTrendingUp}
              />
              <StatCard
                label="إجابات خاطئة"
                value={overall.totalWrong ?? 0}
                accent={RED}
                icon={FiHelpCircle}
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
              borderRadius="2xl"
              p={{ base: 4, md: 5 }}
              boxShadow="sm"
            >
              <HStack spacing={2} mb={4}>
                <Flex
                  w="36px"
                  h="36px"
                  borderRadius="lg"
                  align="center"
                  justify="center"
                  bg="orange.100"
                  color="orange.600"
                >
                  <Icon as={FiAlertCircle} boxSize={5} />
                </Flex>
                <Box>
                  <Heading size="sm" color={titleColor}>
                    أكثر الأسئلة إثارة للمشاكل
                  </Heading>
                  <Text fontSize="xs" color={muted}>
                    ركّز عليها في المراجعة القادمة
                  </Text>
                </Box>
              </HStack>
              <VStack align="stretch" spacing={2.5}>
                {problematic.map((item, idx) => (
                  <Flex
                    key={item.questionId}
                    justify="space-between"
                    align="center"
                    gap={3}
                    fontSize="sm"
                    flexWrap="wrap"
                    bg={cardBg}
                    borderRadius="xl"
                    px={3.5}
                    py={3}
                    borderWidth="1px"
                    borderColor={border}
                  >
                    <HStack spacing={3} minW={0} flex={1}>
                      <Badge colorScheme="orange" borderRadius="full">
                        #{idx + 1}
                      </Badge>
                      <Text noOfLines={1} flex={1} minW={0} fontWeight="medium">
                        {renderFormattedExamText(item.questionText || "")}
                      </Text>
                    </HStack>
                    <Badge colorScheme="red" variant="solid" borderRadius="full" px={3}>
                      {item.wrongAnswers ?? item.wrongCount ?? 0} خطأ (
                      {item.wrongPercentage ?? 0}%)
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
              borderRadius="2xl"
              p={10}
              textAlign="center"
              boxShadow="sm"
            >
              <Text color={muted}>
                {enrollmentSummary
                  ? "لا توجد تفاصيل أسئلة بعد — لم يُسلِّم أي طالب المحاولة."
                  : "لا توجد بيانات في التقرير بعد — لم يُسلِّم أي طالب المحاولة."}
              </Text>
            </Box>
          ) : (
            <VStack spacing={4} align="stretch">
              <Flex
                justify="space-between"
                align={{ base: "stretch", md: "center" }}
                gap={3}
                direction={{ base: "column", md: "row" }}
                bg={cardBg}
                borderWidth="1px"
                borderColor={border}
                borderRadius="2xl"
                px={{ base: 4, md: 5 }}
                py={4}
                boxShadow="sm"
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
