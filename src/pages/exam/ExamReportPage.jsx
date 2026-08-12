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
import { FiArrowRight, FiCheckCircle, FiChevronDown, FiXCircle } from "react-icons/fi";
import { Link, Navigate, useParams } from "react-router-dom";
import baseUrl from "../../api/baseUrl";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import UserType from "../../Hooks/auth/userType";
import { renderFormattedExamText } from "../../utils/renderFormattedExamText";

function computeReportSummary(questions = []) {
  const respondedStudentIds = new Set();
  let totalCorrect = 0;
  let totalIncorrect = 0;

  questions.forEach((q) => {
    totalCorrect += q.correctCount || 0;
    totalIncorrect += q.incorrectCount || 0;
    (q.correctStudents || []).forEach((s) => respondedStudentIds.add(s.studentId));
    (q.incorrectStudents || []).forEach((s) => respondedStudentIds.add(s.studentId));
  });

  return {
    questionCount: questions.length,
    studentCount: respondedStudentIds.size,
    totalCorrect,
    totalIncorrect,
  };
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

function StudentList({ title, students, variant }) {
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
              {students.map((student) => (
                <Flex
                  key={`${student.studentId}-${student.submissionId}`}
                  justify="space-between"
                  align="center"
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
                    {student.studentName}
                  </Text>
                  <Badge colorScheme={isCorrect ? "green" : "red"} variant="subtle">
                    محاولة {student.attemptNumber}
                  </Badge>
                </Flex>
              ))}
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

  const correctStudents = question.correctStudents || [];
  const incorrectStudents = question.incorrectStudents || [];
  const responses = question.totalResponses || 0;
  const correctRate =
    responses > 0
      ? Math.round(((question.correctCount || 0) / responses) * 100)
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
          <Text fontSize="sm" color={muted}>
            {question.grade ?? 1} درجة
          </Text>
        </HStack>
        <HStack spacing={3} fontSize="sm">
          <Text color={muted}>إجابات: {responses}</Text>
          <Text color="green.500">صحيح: {question.correctCount ?? 0}</Text>
          <Text color="red.500">خاطئ: {question.incorrectCount ?? 0}</Text>
          {responses > 0 && (
            <Badge
              colorScheme={
                correctRate >= 70 ? "green" : correctRate >= 40 ? "yellow" : "red"
              }
            >
              {correctRate}%
            </Badge>
          )}
        </HStack>
      </Flex>

      <Box px={4} py={4}>
        <Box fontSize="sm" lineHeight="1.9" color={textColor} mb={question.questionImage ? 3 : 0}>
          {renderFormattedExamText(question.questionText || "")}
        </Box>

        {question.questionImage && (
          <Box
            mb={4}
            cursor="pointer"
            onClick={() => onZoomImage(question.questionImage)}
          >
            <Image
              src={question.questionImage}
              alt={`صورة السؤال ${index + 1}`}
              maxH="240px"
              borderRadius="lg"
              objectFit="contain"
            />
          </Box>
        )}

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          <StudentList
            title="إجابات صحيحة"
            students={correctStudents}
            variant="correct"
          />
          <StudentList
            title="إجابات خاطئة"
            students={incorrectStudents}
            variant="incorrect"
          />
        </SimpleGrid>
        {(correctStudents.length > 0 || incorrectStudents.length > 0) && (
          <Text fontSize="xs" color={muted} mt={2} textAlign="center">
            اضغط على القسم لعرض أو إخفاء أسماء الطلاب
          </Text>
        )}
      </Box>
    </Box>
  );
}

export default function ExamReportPage() {
  const { id } = useParams();
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

  const fetchReport = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await baseUrl.get(
        `/api/exams/${id}/report`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : {},
      );
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "حدث خطأ أثناء تحميل التقرير");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isStaff) fetchReport();
  }, [fetchReport, isStaff]);

  const reportExam = report?.exam || {};
  const reportQuestions = useMemo(
    () => (Array.isArray(report?.questions) ? report.questions : []),
    [report],
  );
  const summary = useMemo(
    () => computeReportSummary(reportQuestions),
    [reportQuestions],
  );

  if (!isStaff) {
    return <Navigate to={`/ComprehensiveExam/${id}`} replace />;
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
              <Button as={Link} to={`/ComprehensiveExam/${id}`} variant="outline">
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
            to={`/ComprehensiveExam/${id}`}
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
                تقرير الامتحان
              </Text>
              <Heading size="lg" color={titleColor} mb={2}>
                {reportExam.title || "امتحان"}
              </Heading>
              <HStack spacing={4} flexWrap="wrap" fontSize="sm" color={muted}>
                <Text>الدرجة الكلية: {reportExam.totalGrade ?? 0}</Text>
                {reportExam.duration != null && (
                  <Text>المدة: {reportExam.duration} دقيقة</Text>
                )}
                {reportExam.createdAt && (
                  <Text>
                    تاريخ الإنشاء:{" "}
                    {new Date(reportExam.createdAt).toLocaleDateString("ar-EG")}
                  </Text>
                )}
              </HStack>
            </Box>
          </Box>

          {reportQuestions.length > 0 && (
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
              <StatCard label="عدد الأسئلة" value={summary.questionCount} />
              <StatCard label="طلاب أجابوا" value={summary.studentCount} />
              <StatCard
                label="إجابات صحيحة"
                value={summary.totalCorrect}
                accent="green.500"
              />
              <StatCard
                label="إجابات خاطئة"
                value={summary.totalIncorrect}
                accent="red.500"
              />
            </SimpleGrid>
          )}

          {reportQuestions.length === 0 ? (
            <Box
              bg={cardBg}
              borderWidth="1px"
              borderColor={border}
              borderRadius="xl"
              p={8}
              textAlign="center"
            >
              <Text color={muted}>لا توجد بيانات في التقرير بعد.</Text>
            </Box>
          ) : (
            <VStack spacing={4} align="stretch">
              <Heading size="sm" color={titleColor}>
                تفاصيل الأسئلة
              </Heading>
              {reportQuestions.map((question, index) => (
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
