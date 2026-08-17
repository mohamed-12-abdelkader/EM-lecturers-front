import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Badge,
  Button,
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
import { FiArrowRight, FiCheckCircle, FiChevronDown, FiXCircle, FiAlertCircle } from "react-icons/fi";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
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

function formatAnswerLabel(letter, text) {
  if (!letter && !text) return "لم يُجِب";
  if (letter && text) return `${letter} — ${text}`;
  return letter || text || "—";
}

function StatCard({ label, value, accent }) {
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
    </Box>
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

function QuestionReportCard({ question, index, onZoomImage }) {
  const cardBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const textColor = useColorModeValue("gray.800", "white");
  const correctBg = useColorModeValue("green.50", "whiteAlpha.100");
  const correctBorder = useColorModeValue("green.200", "green.700");

  const correctStudents = question.correctStudents || [];
  const wrongStudents = question.wrongStudents || [];
  const unansweredStudents = question.unansweredStudents || [];
  const totalStudents =
    question.statistics?.totalStudents ??
    (question.correctCount ?? 0) + (question.wrongCount ?? 0);
  const correctRate =
    totalStudents > 0
      ? Math.round(((question.correctCount ?? 0) / totalStudents) * 100)
      : 0;

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
            سؤال {index + 1}
          </Badge>
          {question.wrongCount > 0 && (
            <Badge colorScheme="orange" variant="subtle">
              {question.wrongCount} خطأ
            </Badge>
          )}
        </HStack>
        <HStack spacing={3} fontSize="sm" flexWrap="wrap">
          <Text color={muted}>طلاب: {totalStudents}</Text>
          <Text color="green.500">صحيح: {question.correctCount ?? 0}</Text>
          <Text color="red.500">خطأ: {question.wrongCount ?? 0}</Text>
          {(question.unansweredCount ?? unansweredStudents.length) > 0 && (
            <Text color="orange.500">
              بدون إجابة: {question.unansweredCount ?? unansweredStudents.length}
            </Text>
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
        <Box fontSize="sm" lineHeight="1.9" color={textColor} mb={question.questionImage ? 3 : 0}>
          {renderFormattedExamText(question.questionText || "")}
        </Box>

        {question.questionImage && (
          <Box mb={4} cursor="pointer" onClick={() => onZoomImage(question.questionImage)}>
            <Image
              src={question.questionImage}
              alt={`صورة السؤال ${index + 1}`}
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
  const sortedQuestions = useMemo(
    () => (Array.isArray(report?.sortedQuestions) ? report.sortedQuestions : []),
    [report],
  );
  const problematic = useMemo(
    () =>
      Array.isArray(report?.mostProblematicQuestions)
        ? report.mostProblematicQuestions
        : [],
    [report],
  );

  if (!isStaff) {
    return <Navigate to={examBasePath} replace />;
  }

  if (loading) {
    return <BrandLoadingScreen />;
  }

  if (error) {
    return (
      <Box minH="100vh" bg={pageBg} pt="100px" pb={12} dir="rtl">
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
    <Box minH="100vh" bg={pageBg} pt="100px" pb={14} dir="rtl">
      <Container maxW="5xl" px={{ base: 4, md: 6 }}>
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
            <Box h="3px" bgGradient="linear(to-l, blue.500, orange.400)" />
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

          {sortedQuestions.length > 0 && (
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
              <StatCard label="عدد الطلاب" value={overall.totalStudents ?? 0} />
              <StatCard label="عدد الأسئلة" value={overall.totalQuestions ?? sortedQuestions.length} />
              <StatCard
                label="إجابات صحيحة"
                value={overall.totalCorrect ?? 0}
                accent="green.500"
              />
              <StatCard
                label="إجابات خاطئة"
                value={overall.totalWrong ?? 0}
                accent="red.500"
              />
            </SimpleGrid>
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

          {sortedQuestions.length === 0 ? (
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
              <Heading size="sm" color={titleColor}>
                تفاصيل الأسئلة (الأصعب أولًا)
              </Heading>
              {sortedQuestions.map((question, index) => (
                <QuestionReportCard
                  key={question.questionId || index}
                  question={question}
                  index={index}
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
