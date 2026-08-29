import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Badge,
  Button,
  ButtonGroup,
  Collapse,
  Center,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Progress,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  Alert,
  AlertIcon,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import {
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
} from "react-icons/ai";
import { FiChevronDown, FiArrowRight, FiSearch, FiAward, FiDownload } from "react-icons/fi";
import { FaChartBar, FaFilePdf } from "react-icons/fa";
import { PaginationBar } from "../../centerMgmt/components/UiBits";
import { ExamQuestionImage } from "./ExamQuestionDisplay";
import { renderFormattedExamText } from "../../../utils/renderFormattedExamText";
import {
  getWrongQuestions,
  getWrongQuestionsCount,
  resolveSubmissionOutcome,
  downloadExamGradesExcel,
  downloadExamGradesPdf,
} from "../utils/examSubmissionUtils";

const PAGE_SIZE = 20;

const FONT = "'Noto Sans Arabic', 'Noto Naskh Arabic', Tahoma, sans-serif";
const NAVY = "#0E4C92";
const GREEN = "#16A34A";
const RED = "#DC2626";

function studentInitials(name) {
  const parts = String(name || "طالب")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "ط";
  if (parts.length === 1) return parts[0].slice(0, 1);
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`;
}

function ScoreRing({ percentage, passed, size = 92 }) {
  const trackColor = useColorModeValue("#E8EEF5", "#334155");
  const ringColor = passed ? GREEN : RED;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <Box position="relative" w={`${size}px`} h={`${size}px`} flexShrink={0}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.7s ease" }}
        />
      </svg>
      <Flex
        position="absolute"
        inset={0}
        direction="column"
        align="center"
        justify="center"
        fontFamily={FONT}
      >
        <Text
          fontSize={percentage >= 100 ? "lg" : "xl"}
          fontWeight="800"
          lineHeight="1"
          color={passed ? "green.600" : "red.500"}
          sx={{ fontVariantNumeric: "tabular-nums" }}
        >
          {percentage}%
        </Text>
      </Flex>
    </Box>
  );
}

function StatusBadge({ passed }) {
  return (
    <HStack
      spacing={2}
      px={3.5}
      py={1.5}
      borderRadius="full"
      bg={passed ? "green.50" : "red.50"}
      borderWidth="1px"
      borderColor={passed ? "green.200" : "red.200"}
      _dark={{
        bg: passed ? "whiteAlpha.100" : "whiteAlpha.100",
        borderColor: passed ? "green.700" : "red.700",
      }}
    >
      <Icon
        as={passed ? AiOutlineCheckCircle : AiOutlineCloseCircle}
        color={passed ? "green.500" : "red.500"}
        boxSize={4}
      />
      <Text
        fontFamily={FONT}
        fontSize="sm"
        fontWeight="800"
        color={passed ? "green.700" : "red.600"}
        letterSpacing="0.02em"
      >
        {passed ? "ناجح" : "راسب"}
      </Text>
    </HStack>
  );
}

function SummaryStat({ label, value, hint, accent }) {
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
      fontFamily={FONT}
    >
      <Text fontSize="xs" color={muted} mb={1} fontWeight="600">
        {label}
      </Text>
      <Text
        fontSize={{ base: "xl", md: "2xl" }}
        fontWeight="800"
        color={accent || "inherit"}
        sx={{ fontVariantNumeric: "tabular-nums" }}
        lineHeight="1.1"
      >
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

function WrongQuestionCard({ question, index, onZoomImage }) {
  const cardBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const softBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const heading = useColorModeValue("gray.800", "gray.100");
  const muted = useColorModeValue("gray.500", "gray.400");

  return (
    <Box
      borderRadius="lg"
      borderWidth="1px"
      borderColor={border}
      bg={cardBg}
      overflow="hidden"
      fontFamily={FONT}
    >
      <Box px={3} py={2} bg={softBg} borderBottomWidth="1px" borderColor={border}>
        <HStack spacing={2} flexWrap="wrap">
          <Text fontSize="xs" fontWeight="semibold" color={muted}>
            سؤال خاطئ {index + 1}
          </Text>
          {question.type ? (
            <Badge colorScheme="purple" variant="subtle" fontSize="2xs">
              {question.type === "mcq" ? "اختيار من متعدد" : question.type}
            </Badge>
          ) : null}
        </HStack>
      </Box>
      <Box p={3}>
        {question.questionText && (
          <Box fontSize="sm" lineHeight="1.9" color={heading} mb={3}>
            {renderFormattedExamText(question.questionText)}
          </Box>
        )}
        {question.questionImage && (
          <Box mb={3}>
            <ExamQuestionImage
              src={question.questionImage}
              onZoom={onZoomImage}
              compact
            />
          </Box>
        )}
        <VStack spacing={2} align="stretch">
          <AnswerRow
            type="wrong"
            label="إجابة الطالب"
            text={question.yourAnswerDisplay || "لم يجب"}
          />
          <AnswerRow
            type="correct"
            label="الإجابة الصحيحة"
            text={question.correctAnswerDisplay || "—"}
          />
        </VStack>
      </Box>
    </Box>
  );
}

function AnswerRow({ type, label, text }) {
  const isWrong = type === "wrong";
  const bg = useColorModeValue("gray.50", "whiteAlpha.50");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const IconComp = isWrong ? AiOutlineCloseCircle : AiOutlineCheckCircle;
  const display =
    typeof text === "string" ? text : renderFormattedExamText(String(text ?? ""));

  return (
    <Flex
      gap={3}
      p={3}
      borderRadius="md"
      bg={bg}
      borderRightWidth="3px"
      borderRightColor={isWrong ? "red.400" : "green.400"}
      align="start"
      fontFamily={FONT}
    >
      <HStack spacing={1.5} minW="88px" flexShrink={0}>
        <IconComp size={14} color={isWrong ? "#ef4444" : "#16a34a"} />
        <Text fontSize="xs" fontWeight="bold" color={isWrong ? "red.500" : "green.600"}>
          {label}
        </Text>
      </HStack>
      <Box fontSize="sm" lineHeight="1.8" color={textColor}>
        {display}
      </Box>
    </Flex>
  );
}

export function SubmissionCard({ submission, index, onZoomImage }) {
  const [wrongOpen, setWrongOpen] = useState(false);
  const cardBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const heading = useColorModeValue("gray.900", "white");
  const hoverBg = useColorModeValue("blackAlpha.50", "whiteAlpha.100");
  const avatarBg = useColorModeValue("#E8F0FA", "whiteAlpha.100");
  const progressTrack = useColorModeValue("gray.100", "gray.700");
  const perfectBg = useColorModeValue("green.50", "whiteAlpha.100");
  const perfectBorder = useColorModeValue("green.200", "green.700");
  const perfectText = useColorModeValue("green.700", "green.200");
  const scorePanelBg = useColorModeValue("#F7FAFC", "whiteAlpha.50");

  const { obtained, total, percentage, passed } = resolveSubmissionOutcome(submission);
  const wrongCount = getWrongQuestionsCount(submission);
  const statusLabel =
    submission.status === "submitted"
      ? "مُسلَّم"
      : submission.status || "—";

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={passed ? "green.100" : "red.100"}
      borderRadius="2xl"
      overflow="hidden"
      fontFamily={FONT}
      _dark={{ borderColor: passed ? "green.800" : "red.800" }}
    >
      <Box h="4px" bg={passed ? GREEN : RED} />
      <Box p={{ base: 4, md: 5 }}>
        <Flex
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          gap={5}
          direction={{ base: "column", md: "row" }}
          mb={4}
        >
          <HStack align="start" spacing={3} minW={0} flex={1}>
            <Flex
              w="48px"
              h="48px"
              borderRadius="xl"
              bg={avatarBg}
              color={NAVY}
              align="center"
              justify="center"
              fontWeight="800"
              fontSize="md"
              flexShrink={0}
            >
              {studentInitials(submission.name)}
            </Flex>
            <Box minW={0} flex={1}>
              <HStack spacing={2} mb={1.5} flexWrap="wrap">
                <Badge colorScheme="blue" variant="subtle" borderRadius="md" fontFamily={FONT}>
                  #{index + 1}
                </Badge>
                <Badge colorScheme="gray" variant="subtle" fontFamily={FONT}>
                  محاولة {submission.attempt_number ?? 1}
                </Badge>
                <StatusBadge passed={passed} />
              </HStack>
              <Heading
                as="h3"
                fontSize={{ base: "lg", md: "xl" }}
                fontWeight="800"
                color={heading}
                mb={1}
                fontFamily={FONT}
                lineHeight="1.4"
                noOfLines={1}
              >
                {submission.name || "طالب"}
              </Heading>
              <HStack spacing={3} flexWrap="wrap" fontSize="sm" color={muted}>
                {submission.phone && <Text>{submission.phone}</Text>}
                {submission.email && <Text noOfLines={1}>{submission.email}</Text>}
                {submission.student_id != null && <Text>رقم الطالب: {submission.student_id}</Text>}
              </HStack>
            </Box>
          </HStack>

          <Flex
            align="center"
            gap={4}
            bg={scorePanelBg}
            borderRadius="2xl"
            px={{ base: 3, md: 4 }}
            py={3}
            justify={{ base: "space-between", md: "flex-end" }}
            minW={{ md: "280px" }}
          >
            <ScoreRing percentage={percentage} passed={passed} />
            <Box textAlign="end">
              <Text fontSize="xs" color={muted} fontWeight="600" mb={0.5}>
                الدرجة
              </Text>
              <Text
                fontSize="2xl"
                fontWeight="800"
                color={heading}
                lineHeight="1.1"
                sx={{ fontVariantNumeric: "tabular-nums" }}
              >
                {Number.isFinite(obtained) ? obtained : "—"}
                <Text as="span" fontSize="md" color={muted} fontWeight="600">
                  {" "}
                  / {Number.isFinite(total) && total > 0 ? total : "—"}
                </Text>
              </Text>
              <Text
                mt={1}
                fontSize="sm"
                fontWeight="800"
                color={passed ? "green.600" : "red.500"}
              >
                {passed ? "اجتاز الامتحان" : "لم يجتز الامتحان"}
              </Text>
            </Box>
          </Flex>
        </Flex>

        <Box mb={4}>
          <Flex justify="space-between" mb={1.5} fontFamily={FONT}>
            <Text fontSize="xs" fontWeight="700" color={muted}>
              النسبة المئوية
            </Text>
            <Text
              fontSize="sm"
              fontWeight="800"
              color={passed ? "green.600" : "red.500"}
              sx={{ fontVariantNumeric: "tabular-nums" }}
            >
              {percentage}%
            </Text>
          </Flex>
          <Progress
            value={percentage}
            size="md"
            borderRadius="full"
            colorScheme={passed ? "green" : "red"}
            bg={progressTrack}
            sx={{ "& > div": { transition: "width 0.5s ease" } }}
          />
        </Box>

        <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3} mb={4}>
          <Box textAlign="center">
            <Text fontSize="xs" color={muted} fontWeight="600" mb={1}>
              الحالة
            </Text>
            <Text fontSize="sm" fontWeight="700">
              {statusLabel}
            </Text>
          </Box>
          <Box textAlign="center">
            <Text fontSize="xs" color={muted} fontWeight="600" mb={1}>
              الأسئلة الخاطئة
            </Text>
            <Text fontSize="sm" fontWeight="800" color={wrongCount > 0 ? "red.500" : "green.500"}>
              {wrongCount}
            </Text>
          </Box>
          <Box textAlign="center" gridColumn={{ base: "span 2", md: "auto" }}>
            <Text fontSize="xs" color={muted} fontWeight="600" mb={1}>
              تاريخ التسليم
            </Text>
            <Text fontSize="sm" fontWeight="700">
              {submission.submitted_at
                ? new Date(submission.submitted_at).toLocaleString("ar-EG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "—"}
            </Text>
          </Box>
        </SimpleGrid>

        {wrongCount > 0 ? (
          <Box
            borderWidth="1px"
            borderColor={border}
            borderRadius="lg"
            overflow="hidden"
          >
            <Flex
              as="button"
              type="button"
              w="full"
              px={4}
              py={3}
              align="center"
              justify="space-between"
              cursor="pointer"
              onClick={() => setWrongOpen((prev) => !prev)}
              _hover={{ bg: hoverBg }}
              transition="background 0.15s ease"
            >
              <HStack spacing={2}>
                <Icon as={AiOutlineCloseCircle} color="red.500" />
                <Text fontWeight="bold" fontSize="sm">
                  الأسئلة الخاطئة
                </Text>
                <Badge colorScheme="red" variant="subtle" borderRadius="full">
                  {wrongCount}
                </Badge>
              </HStack>
              <Icon
                as={FiChevronDown}
                color={muted}
                boxSize={4}
                transition="transform 0.2s ease"
                transform={wrongOpen ? "rotate(180deg)" : "rotate(0deg)"}
              />
            </Flex>
            <Collapse in={wrongOpen} animateOpacity unmountOnExit>
              <Box px={4} pb={4} pt={1}>
                <VStack spacing={3} align="stretch">
                  {getWrongQuestions(submission).map((q, qIdx) => (
                    <WrongQuestionCard
                      key={q.questionId || qIdx}
                      question={q}
                      index={qIdx}
                      onZoomImage={onZoomImage}
                    />
                  ))}
                </VStack>
              </Box>
            </Collapse>
          </Box>
        ) : (
          <HStack
            spacing={2}
            p={3}
            borderRadius="lg"
            bg={perfectBg}
            borderWidth="1px"
            borderColor={perfectBorder}
          >
            <Icon as={FiAward} color="green.500" />
            <Text fontSize="sm" fontWeight="700" color={perfectText}>
              لا توجد أسئلة خاطئة — إجابة كاملة
            </Text>
          </HStack>
        )}
      </Box>
    </Box>
  );
}

export default function ExamSubmissionsView({
  submissions = [],
  loading = false,
  error = null,
  onBack,
  onRetry,
  onReport,
  onZoomImage,
  examTitle = "درجات الطلاب في الامتحان",
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const toast = useToast();

  const pageBg = useColorModeValue("#F4F7FB", "gray.950");
  const cardBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const heading = useColorModeValue("gray.900", "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const inputBg = useColorModeValue("gray.50", "whiteAlpha.100");

  const outcomes = useMemo(
    () => submissions.map(resolveSubmissionOutcome),
    [submissions],
  );
  const passedCount = outcomes.filter((item) => item.passed).length;
  const failedCount = submissions.length - passedCount;
  const averagePercentage =
    outcomes.length > 0
      ? Math.round(
          outcomes.reduce((sum, item) => sum + item.percentage, 0) / outcomes.length,
        )
      : 0;
  const passRate =
    submissions.length > 0 ? Math.round((passedCount / submissions.length) * 100) : 0;

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return submissions.filter((submission, index) => {
      const { passed } = outcomes[index] || resolveSubmissionOutcome(submission);
      if (statusFilter === "passed" && !passed) return false;
      if (statusFilter === "failed" && passed) return false;
      if (!term) return true;
      return (
        (submission.name && submission.name.toLowerCase().includes(term)) ||
        (submission.student_id != null && String(submission.student_id).includes(term)) ||
        (submission.phone && String(submission.phone).includes(term)) ||
        (submission.email && submission.email.toLowerCase().includes(term))
      );
    });
  }, [submissions, outcomes, query, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedFiltered = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const pageRangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageRangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const handleExportGrades = () => {
    if (!filtered.length) {
      toast({
        title: "لا توجد درجات للتصدير",
        description: "غيّر البحث أو الفلتر ثم حاول مرة أخرى.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const exported = downloadExamGradesExcel(filtered, {
      filename: `exam-grades-${new Date().toISOString().slice(0, 10)}.csv`,
    });

    if (exported) {
      toast({
        title: "تم تصدير الدرجات",
        description: `تم تنزيل ${filtered.length} طالب بدون تفاصيل الأسئلة الخاطئة.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleExportPdf = async () => {
    if (!filtered.length) {
      toast({
        title: "لا توجد درجات للتصدير",
        description: "غيّر البحث أو الفلتر ثم حاول مرة أخرى.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsExportingPdf(true);
    try {
      const exported = await downloadExamGradesPdf(filtered, {
        title: examTitle,
        filename: `exam-grades-${new Date().toISOString().slice(0, 10)}.pdf`,
      });

      if (exported) {
        toast({
          title: "تم تصدير PDF",
          description: `تم تنزيل ${filtered.length} طالب (كل الطلاب وليس الصفحة الحالية فقط).`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (exportError) {
      toast({
        title: "تعذر تصدير PDF",
        description: exportError?.message || "حاول مرة أخرى.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bg={pageBg}
      pt={{ base: "4.75rem", md: "5.25rem" }}
      pb={10}
      dir="rtl"
      fontFamily={FONT}
    >
      <Container maxW="6xl" px={{ base: 4, md: 6 }}>
        <VStack spacing={6} align="stretch">
          <Button
            alignSelf="flex-start"
            variant="ghost"
            size="sm"
            onClick={onBack}
            color={muted}
            _hover={{ color: heading }}
            fontFamily={FONT}
          >
            عودة للأسئلة
          </Button>

          <Box
            bg={cardBg}
            borderWidth="1px"
            borderColor={border}
            borderRadius="2xl"
            overflow="hidden"
          >
            <Box h="3px" bgGradient={`linear(to-l, ${NAVY}, ${GREEN})`} />
            <Box p={{ base: 5, md: 6 }}>
              <Text fontSize="xs" fontWeight="700" color={muted} mb={1}>
                نتائج الطلاب
              </Text>
              <Flex
                justify="space-between"
                align={{ base: "flex-start", sm: "center" }}
                direction={{ base: "column", sm: "row" }}
                gap={3}
                mb={5}
              >
                <Heading size="lg" color={heading} fontFamily={FONT} fontWeight="800">
                  درجات الطلاب في الامتحان
                </Heading>
                <HStack spacing={2} flexShrink={0} flexWrap="wrap">
                  {submissions.length > 0 && (
                    <>
                      <Button
                        size="sm"
                        colorScheme="green"
                        variant="outline"
                        leftIcon={<Icon as={FiDownload} />}
                        onClick={handleExportGrades}
                        fontFamily={FONT}
                      >
                        تصدير Excel
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        leftIcon={<Icon as={FaFilePdf} />}
                        onClick={handleExportPdf}
                        isLoading={isExportingPdf}
                        loadingText="جاري التصدير..."
                        fontFamily={FONT}
                      >
                        تصدير PDF
                      </Button>
                    </>
                  )}
                  {typeof onReport === "function" && (
                    <Button
                      size="sm"
                      colorScheme="blue"
                      leftIcon={<Icon as={FaChartBar} />}
                      rightIcon={<Icon as={FiArrowRight} />}
                      onClick={onReport}
                      fontFamily={FONT}
                    >
                      تقرير الأسئلة
                    </Button>
                  )}
                </HStack>
              </Flex>

              {submissions.length > 0 && (
                <VStack spacing={4} align="stretch">
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                    <SummaryStat label="إجمالي التسليمات" value={submissions.length} />
                    <SummaryStat
                      label="ناجح"
                      value={passedCount}
                      accent="green.500"
                      hint={`${passRate}% من الطلاب`}
                    />
                    <SummaryStat
                      label="راسب"
                      value={failedCount}
                      accent="red.500"
                    />
                    <SummaryStat
                      label="متوسط النسبة"
                      value={`${averagePercentage}%`}
                      accent={averagePercentage >= 50 ? "green.500" : "red.500"}
                    />
                  </SimpleGrid>
                  <Box>
                    <Flex justify="space-between" mb={1.5}>
                      <Text fontSize="xs" fontWeight="700" color={muted}>
                        نسبة النجاح في المجموعة
                      </Text>
                      <Text
                        fontSize="sm"
                        fontWeight="800"
                        color={passRate >= 50 ? "green.600" : "red.500"}
                        sx={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {passRate}%
                      </Text>
                    </Flex>
                    <Flex h="10px" borderRadius="full" overflow="hidden" bg="gray.100">
                      {passedCount > 0 && <Box flex={passedCount} bg={GREEN} />}
                      {failedCount > 0 && <Box flex={failedCount} bg={RED} />}
                    </Flex>
                  </Box>
                </VStack>
              )}
            </Box>
          </Box>

          {submissions.length > 0 && (
            <Flex
              gap={3}
              direction={{ base: "column", md: "row" }}
              align={{ md: "center" }}
            >
              <InputGroup size="md" maxW={{ md: "360px" }}>
                <Input
                  placeholder="ابحث باسم الطالب أو رقمه..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  bg={inputBg}
                  borderRadius="xl"
                  fontFamily={FONT}
                />
                <InputRightElement>
                  <Icon as={FiSearch} color={muted} />
                </InputRightElement>
              </InputGroup>
              <ButtonGroup size="sm" isAttached variant="outline">
                <Button
                  fontFamily={FONT}
                  colorScheme={statusFilter === "all" ? "blue" : "gray"}
                  variant={statusFilter === "all" ? "solid" : "outline"}
                  onClick={() => setStatusFilter("all")}
                >
                  الكل
                </Button>
                <Button
                  fontFamily={FONT}
                  colorScheme={statusFilter === "passed" ? "green" : "gray"}
                  variant={statusFilter === "passed" ? "solid" : "outline"}
                  onClick={() => setStatusFilter("passed")}
                >
                  ناجح
                </Button>
                <Button
                  fontFamily={FONT}
                  colorScheme={statusFilter === "failed" ? "red" : "gray"}
                  variant={statusFilter === "failed" ? "solid" : "outline"}
                  onClick={() => setStatusFilter("failed")}
                >
                  راسب
                </Button>
              </ButtonGroup>
            </Flex>
          )}

          {loading && submissions.length === 0 ? (
            <Center minH="30vh" flexDirection="column">
              <Spinner size="lg" color="blue.500" thickness="3px" />
              <Text mt={4} color={muted} fontSize="sm">
                جاري تحميل الدرجات...
              </Text>
            </Center>
          ) : error && submissions.length === 0 ? (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              <VStack align="start" spacing={2}>
                <Text>{error}</Text>
                {onRetry && (
                  <Button size="sm" colorScheme="blue" onClick={onRetry} fontFamily={FONT}>
                    إعادة المحاولة
                  </Button>
                )}
              </VStack>
            </Alert>
          ) : submissions.length > 0 ? (
            <VStack spacing={4} align="stretch">
              {filtered.length === 0 ? (
                <Box
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={border}
                  borderRadius="xl"
                  p={8}
                  textAlign="center"
                >
                  <Text color={muted}>لا توجد نتائج مطابقة للبحث أو التصفية.</Text>
                </Box>
              ) : (
                <>
                  {filtered.length > PAGE_SIZE && (
                    <Text fontSize="sm" color={muted} textAlign="center">
                      عرض {pageRangeStart}–{pageRangeEnd} من {filtered.length} طالب
                    </Text>
                  )}
                  {paginatedFiltered.map((submission, idx) => (
                    <SubmissionCard
                      key={submission.submission_id || `${currentPage}-${idx}`}
                      submission={submission}
                      index={submissions.indexOf(submission)}
                      onZoomImage={onZoomImage}
                    />
                  ))}
                  <PaginationBar
                    page={currentPage}
                    totalPages={totalPages}
                    onPrev={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  />
                </>
              )}
            </VStack>
          ) : (
            <Box
              bg={cardBg}
              borderWidth="1px"
              borderColor={border}
              borderRadius="xl"
              p={8}
              textAlign="center"
            >
              <Text color={muted}>لا يوجد نتائج بعد.</Text>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
