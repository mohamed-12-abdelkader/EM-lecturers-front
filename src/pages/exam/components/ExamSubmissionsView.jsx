import { useState } from "react";
import {
  Box,
  Badge,
  Button,
  Collapse,
  Center,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  Alert,
  AlertIcon,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
} from "react-icons/ai";
import { FiChevronDown, FiArrowRight } from "react-icons/fi";
import { FaChartBar } from "react-icons/fa";
import { ExamQuestionImage } from "./ExamQuestionDisplay";
import { renderFormattedExamText } from "../../../utils/renderFormattedExamText";
import {
  getWrongQuestions,
  getWrongQuestionsCount,
} from "../utils/examSubmissionUtils";

function SubmissionStat({ label, value, accent }) {
  const muted = useColorModeValue("gray.500", "gray.400");
  return (
    <Box textAlign="center">
      <Text fontSize="xs" color={muted} mb={1}>
        {label}
      </Text>
      <Text fontSize="lg" fontWeight="bold" color={accent || "inherit"}>
        {value}
      </Text>
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
  const accentBar = submission.passed ? "green.400" : "red.400";
  const perfectBg = useColorModeValue("green.50", "whiteAlpha.100");
  const perfectBorder = useColorModeValue("green.200", "green.700");
  const perfectText = useColorModeValue("green.700", "green.200");

  const wrongQuestions = getWrongQuestions(submission);
  const wrongCount = getWrongQuestionsCount(submission);
  const obtainedGrade = submission.obtained_grade ?? submission.obtainedGrade;
  const totalGrade = submission.total_grade ?? submission.totalGrade;

  const statusLabel =
    submission.status === "submitted"
      ? "مُسلَّم"
      : submission.status || "—";

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={border}
      borderRadius="xl"
      overflow="hidden"
    >
      <Box h="3px" bg={accentBar} />
      <Box p={{ base: 4, md: 5 }}>
        <Flex
          justify="space-between"
          align="start"
          gap={3}
          flexWrap="wrap"
          mb={4}
        >
          <Box minW={0}>
            <HStack spacing={2} mb={1} flexWrap="wrap">
              <Badge colorScheme="blue" borderRadius="md">
                #{index + 1}
              </Badge>
              <Badge colorScheme="gray" variant="subtle">
                محاولة {submission.attempt_number ?? 1}
              </Badge>
              <Badge colorScheme={submission.passed ? "green" : "red"}>
                {submission.passed ? "ناجح" : "راسب"}
              </Badge>
            </HStack>
            <Heading size="md" color={heading} mb={1}>
              {submission.name || "طالب"}
            </Heading>
            <HStack spacing={3} flexWrap="wrap" fontSize="sm" color={muted}>
              {submission.phone && <Text>{submission.phone}</Text>}
              {submission.email && <Text>{submission.email}</Text>}
              <Text>ID: {submission.student_id}</Text>
            </HStack>
          </Box>

          <VStack align={{ base: "start", sm: "end" }} spacing={1}>
            <Text fontSize="2xl" fontWeight="bold" color={heading}>
              {obtainedGrade != null ? obtainedGrade : "—"}
              <Text as="span" fontSize="lg" color={muted} fontWeight="normal">
                {" "}
                / {totalGrade != null ? totalGrade : "—"}
              </Text>
            </Text>
            <Text fontSize="xs" color={muted}>
              الدرجة
            </Text>
          </VStack>
        </Flex>

        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={4}>
          <SubmissionStat label="الحالة" value={statusLabel} />
          <SubmissionStat
            label="أخطاء"
            value={wrongCount}
            accent={wrongCount > 0 ? "red.500" : "green.500"}
          />
          <SubmissionStat
            label="رقم التسليم"
            value={submission.submission_id ?? "—"}
          />
          <SubmissionStat
            label="تاريخ التسليم"
            value={
              submission.submitted_at
                ? new Date(submission.submitted_at).toLocaleString("ar-EG", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })
                : "—"
            }
          />
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
            <Collapse in={wrongOpen} animateOpacity>
              <Box px={4} pb={4} pt={1}>
                <VStack spacing={3} align="stretch">
                  {wrongQuestions.map((q, qIdx) => (
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
            <Icon as={AiOutlineCheckCircle} color="green.500" />
            <Text fontSize="sm" color={perfectText}>
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
}) {
  const pageBg = useColorModeValue("#F4F7FB", "gray.950");
  const cardBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const heading = useColorModeValue("gray.900", "white");
  const muted = useColorModeValue("gray.500", "gray.400");

  const passedCount = submissions.filter((s) => s.passed).length;
  const failedCount = submissions.length - passedCount;

  return (
    <Box minH="100vh" bg={pageBg} pt="100px" pb={10} dir="rtl">
      <Container maxW="5xl" px={{ base: 4, md: 6 }}>
        <VStack spacing={6} align="stretch">
          <Button
            alignSelf="flex-start"
            variant="ghost"
            size="sm"
            onClick={onBack}
            color={muted}
            _hover={{ color: heading }}
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
            <Box h="3px" bgGradient="linear(to-l, blue.500, orange.400)" />
            <Box p={{ base: 5, md: 6 }}>
              <Text fontSize="xs" fontWeight="semibold" color={muted} mb={1}>
                نتائج الطلاب
              </Text>
              <Flex
                justify="space-between"
                align={{ base: "flex-start", sm: "center" }}
                direction={{ base: "column", sm: "row" }}
                gap={3}
                mb={4}
              >
                <Heading size="lg" color={heading}>
                  درجات الطلاب في الامتحان
                </Heading>
                {typeof onReport === "function" && (
                  <Button
                    size="sm"
                    colorScheme="blue"
                    leftIcon={<Icon as={FaChartBar} />}
                    rightIcon={<Icon as={FiArrowRight} />}
                    onClick={onReport}
                    flexShrink={0}
                  >
                    تقرير الأسئلة
                  </Button>
                )}
              </Flex>

              {submissions.length > 0 && (
                <SimpleGrid columns={{ base: 3, md: 3 }} spacing={4} maxW="md">
                  <SubmissionStat label="إجمالي التسليمات" value={submissions.length} />
                  <SubmissionStat
                    label="ناجح"
                    value={passedCount}
                    accent="green.500"
                  />
                  <SubmissionStat
                    label="راسب"
                    value={failedCount}
                    accent="red.500"
                  />
                </SimpleGrid>
              )}
            </Box>
          </Box>

          {loading ? (
            <Center minH="40vh" flexDirection="column">
              <Spinner size="xl" color="blue.500" />
              <Text mt={4} color={muted}>
                جاري تحميل الدرجات...
              </Text>
            </Center>
          ) : error ? (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              <VStack align="start" spacing={2}>
                <Text>{error}</Text>
                {onRetry && (
                  <Button size="sm" colorScheme="blue" onClick={onRetry}>
                    إعادة المحاولة
                  </Button>
                )}
              </VStack>
            </Alert>
          ) : submissions.length > 0 ? (
            <VStack spacing={4} align="stretch">
              {submissions.map((submission, idx) => (
                <SubmissionCard
                  key={submission.submission_id || idx}
                  submission={submission}
                  index={idx}
                  onZoomImage={onZoomImage}
                />
              ))}
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
