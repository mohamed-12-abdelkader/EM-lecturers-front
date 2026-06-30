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
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Spinner,
  Badge,
  Divider,
  useDisclosure,
} from "@chakra-ui/react";
import {
  MdAssignment,
  MdCheckCircle,
  MdCancel,
  MdSchedule,
  MdReceiptLong,
  MdVisibility,
} from "react-icons/md";
import { FaPlay } from "react-icons/fa";
import { Link } from "react-router-dom";
import baseUrl from "../../api/baseUrl";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";

const ExamGrades = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const { isOpen: isReportOpen, onOpen: onReportOpen, onClose: onReportClose } = useDisclosure();

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const secondaryColor = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const submittedExams = useMemo(
    () => exams.filter((exam) => exam.status === "submitted"),
    [exams]
  );
  const pendingExams = useMemo(
    () => exams.filter((exam) => exam.status !== "submitted"),
    [exams]
  );
  const passedCount = useMemo(
    () => submittedExams.filter((exam) => exam.passed).length,
    [submittedExams]
  );
  const failedCount = useMemo(
    () => submittedExams.filter((exam) => !exam.passed).length,
    [submittedExams]
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

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        const res = await baseUrl.get(
          "/api/course/my-exam-grades",
          token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        );
        setExams(res.data.exams || []);
      } catch (err) {
        setError("حدث خطأ أثناء تحميل الدرجات");
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, []);

  const openReport = useCallback(async (examId) => {
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
  }, [onReportOpen]);

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

  if (loading) {
    return <BrandLoadingScreen />;
  }

  if (error) {
    return (
      <Box minH="100vh" bg={bgColor} pt="100px" pb={12} dir="rtl">
        <Container maxW="container.lg">
          <Center minH="60vh">
            <VStack
              spacing={4}
              p={8}
              bg={cardBg}
              borderRadius="2xl"
              borderWidth="1px"
              boxShadow="lg"
            >
              <Text color="red.500" fontWeight="bold" fontSize="lg">
                {error}
              </Text>
              <Box
                as="button"
                onClick={() => window.location.reload()}
                color="blue.500"
                fontWeight="600"
              >
                إعادة المحاولة
              </Box>
            </VStack>
          </Center>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor} pb={12} dir="rtl" className="mb-[100px]">
      {/* 1. Hero - لوحة الإنجازات */}
      <Box
        h="100px"
        mb={5}
        overflow="hidden"
        borderBottomLeftRadius="30px"
        borderBottomRightRadius="30px"
        boxShadow="0 4px 15px rgba(79, 70, 229, 0.3)"
        bgGradient="linear(to-br, #4F46E5, #6a97faff)"
      >
        <Flex h="full" px={6} align="center" justify="space-between">
          <VStack align="flex-end" spacing={0}>
            <Text fontSize="24px" fontWeight="bold" color="white">
              لوحة الإنجازات 🏆
            </Text>
            <Text fontSize="14px" color="rgba(255,255,255,0.85)">
              مستواك العام ممتاز، استمر!
            </Text>
          </VStack>
          <Flex
            w="90px"
            h="90px"
            borderRadius="full"
            bg="rgba(255,255,255,0.2)"
            borderWidth="1px"
            borderColor="rgba(255,255,255,0.4)"
            align="center"
            justify="center"
          >
            <VStack spacing={0}>
              <Text color="white" fontSize="26px" fontWeight="bold">
                {averageGrade}%
              </Text>
              <Text color="rgba(255,255,255,0.9)" fontSize="12px">
                المعدل
              </Text>
            </VStack>
          </Flex>
        </Flex>
      </Box>

      <Container maxW="container.xl" px={{ base: 4, md: 5 }}>
        {/* 2. Stat Cards - Horizontal */}
        <Flex
          gap={3}
          mb={6}
          overflowX="auto"
          pb={2}
          sx={{
            "&::-webkit-scrollbar": { height: "6px" },
            "&::-webkit-scrollbar-thumb": { bg: "gray.300", borderRadius: 3 },
          }}
        >
          <StatCard
            label="إجمالي الامتحانات"
            value={exams.length}
            icon={MdAssignment}
            gradient={["#3B82F6", "#2563EB"]}
            bg={cardBg}
            textColor={textColor}
            secondaryColor={secondaryColor}
          />
          <StatCard
            label="الامتحانات المجتازة"
            value={passedCount}
            icon={MdCheckCircle}
            gradient={["#10B981", "#059669"]}
            bg={cardBg}
            textColor={textColor}
            secondaryColor={secondaryColor}
          />
          <StatCard
            label="لم تنجح"
            value={failedCount}
            icon={MdCancel}
            gradient={["#EF4444", "#DC2626"]}
            bg={cardBg}
            textColor={textColor}
            secondaryColor={secondaryColor}
          />
          <StatCard
            label="قيد الانتظار"
            value={pendingExams.length}
            icon={MdSchedule}
            gradient={["#F59E0B", "#D97706"]}
            bg={cardBg}
            textColor={textColor}
            secondaryColor={secondaryColor}
          />
        </Flex>

        {/* 3. Section Title */}
        <Text
          fontSize="18px"
          fontWeight="bold"
          color={textColor}
          mb={4}
          textAlign="right"
        >
          سجل النتائج
        </Text>

        {/* 4. Exam Tickets */}
        <VStack spacing={4} align="stretch">
          {exams.length === 0 ? (
            <Center py={16}>
              <VStack spacing={3}>
                <Icon
                  as={MdReceiptLong}
                  boxSize={16}
                  color={secondaryColor}
                  opacity={0.5}
                />
                <Text color={secondaryColor} fontSize="md">
                  لا توجد امتحانات حتى الآن
                </Text>
              </VStack>
            </Center>
          ) : (
            exams.map((exam) => (
              <ExamTicket
                key={exam.exam_id}
                exam={exam}
                cardBg={cardBg}
                textColor={textColor}
                secondaryColor={secondaryColor}
                bgColor={bgColor}
                formatDate={formatDate}
                getExamTypeLabel={getExamTypeLabel}
                onViewReport={openReport}
              />
            ))
          )}
        </VStack>

        {/* مودال تقرير الامتحان */}
        <Modal isOpen={isReportOpen} onClose={closeReport} size="2xl" scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent bg={cardBg} maxH="90vh" dir="rtl">
            <ModalHeader>
              تقرير الامتحان
              {reportData?.exam?.title && (
                <Text as="span" fontWeight="normal" fontSize="md" color={secondaryColor} mr={2}>
                  — {reportData.exam.title}
                </Text>
              )}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {reportLoading && (
                <Center py={12}>
                  <Spinner size="lg" color="blue.500" />
                </Center>
              )}
              {reportError && !reportLoading && (
                <VStack py={8} spacing={3}>
                  <Icon as={MdCancel} boxSize={12} color="red.500" />
                  <Text color={textColor}>{reportError}</Text>
                </VStack>
              )}
              {reportData && !reportLoading && (
                <ExamReportBody
                  report={reportData}
                  formatDateTime={formatDateTime}
                  cardBg={cardBg}
                  textColor={textColor}
                  secondaryColor={secondaryColor}
                  borderColor={borderColor}
                />
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
};

function StatCard({
  label,
  value,
  icon: IconComp,
  gradient,
  bg,
  textColor,
  secondaryColor,
}) {
  return (
    <Flex
      minW="140px"
      flexShrink={0}
      direction="column"
      align="center"
      p={4}
      borderRadius="20px"
      bg={bg}
      boxShadow="md"
    >
      <Flex
        w="44px"
        h="44px"
        borderRadius="14px"
        bgGradient={`linear(to-br, ${gradient[0]}, ${gradient[1]})`}
        align="center"
        justify="center"
        mb={2}
      >
        <Icon as={IconComp} color="white" boxSize={5} />
      </Flex>
      <Text fontSize="20px" fontWeight="bold" color={textColor} mb={0}>
        {value}
      </Text>
      <Text fontSize="12px" color={secondaryColor}>
        {label}
      </Text>
    </Flex>
  );
}

function ExamReportBody({ report, formatDateTime, cardBg, textColor, secondaryColor, borderColor }) {
  const { examType, exam, attempt, questions = [] } = report;
  const isLecture = examType === "lecture";

  return (
    <VStack align="stretch" spacing={5}>
      <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
        <Text fontSize="lg" fontWeight="bold" color={textColor}>
          {exam?.title}
        </Text>
        <Badge colorScheme={attempt?.passed ? "green" : "red"} fontSize="sm">
          {attempt?.passed ? "ناجح" : "راسب"}
        </Badge>
      </Flex>
      <HStack spacing={4} flexWrap="wrap">
        <Text fontSize="sm" color={secondaryColor}>
          الدرجة: <Text as="span" fontWeight="700" color={textColor}>{attempt?.obtainedGrade} / {attempt?.totalGrade}</Text>
        </Text>
        <Text fontSize="sm" color={secondaryColor}>
          تاريخ التسليم: {formatDateTime(attempt?.submittedAt)}
        </Text>
      </HStack>
      <Divider borderColor={borderColor} />
      <Text fontWeight="bold" color={textColor} fontSize="md">
        الأسئلة والإجابات
      </Text>
      <VStack align="stretch" spacing={4}>
        {questions.map((q, i) => (
          <Box
            key={q.questionId || i}
            p={4}
            borderRadius="lg"
            bg={cardBg}
            borderWidth="1px"
            borderColor={q.isCorrect ? "green.200" : "red.200"}
            borderLeftWidth="4px"
            borderLeftColor={q.isCorrect ? "green.500" : "red.500"}
          >
            <Text fontWeight="600" color={textColor} mb={2}>
              {i + 1}. {q.questionText}
            </Text>
            {q.questionImage && (
              <Box as="img" src={q.questionImage} alt="" maxW="200px" borderRadius="md" mb={2} />
            )}
            <VStack align="stretch" spacing={1} fontSize="sm">
              <HStack justify="space-between">
                <Text color={secondaryColor}>إجابتك:</Text>
                <Text fontWeight="medium" color={textColor}>
                  {isLecture
                    ? (q.yourAnswer?.text ?? q.yourAnswer?.letter ?? "—")
                    : (q.yourAnswer ?? "—")}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text color={secondaryColor}>الإجابة الصحيحة:</Text>
                <Text fontWeight="medium" color="green.600">
                  {isLecture
                    ? (q.correctAnswer?.text ?? q.correctAnswer?.letter ?? "—")
                    : (q.correctAnswer ?? "—")}
                </Text>
              </HStack>
              {!isLecture && (q.optionA ?? q.optionB ?? q.optionC ?? q.optionD) && (
                <Text fontSize="xs" color={secondaryColor} mt={1}>
                  الخيارات: أ: {q.optionA ?? "—"} | ب: {q.optionB ?? "—"} | ج: {q.optionC ?? "—"} | د: {q.optionD ?? "—"}
                </Text>
              )}
            </VStack>
          </Box>
        ))}
      </VStack>
    </VStack>
  );
}

function ExamTicket({
  exam,
  cardBg,
  textColor,
  secondaryColor,
  bgColor,
  formatDate,
  getExamTypeLabel,
  onViewReport,
}) {
  const isSubmitted = exam.status === "submitted";
  const isPassed = !!exam.passed;
  const studentGrade = exam.student_grade ?? 0;
  const totalGrade = exam.total_grade ?? 100;
  const percentage =
    isSubmitted && totalGrade
      ? Math.round((studentGrade / totalGrade) * 100)
      : 0;

  const ticketGradient = isSubmitted
    ? isPassed
      ? ["#10B981", "#34D399"]
      : ["#EF4444", "#F87171"]
    : ["#3B82F6", "#60A5FA"];

  const examUrl =
    exam.exam_type === "course"
      ? `/exam/${exam.exam_id}`
      : `/ComprehensiveExam/${exam.exam_id}`;

  const content = (
    <Flex
      direction="row-reverse"
      h="110px"
      borderRadius="16px"
      overflow="hidden"
      bg={cardBg}
      boxShadow="md"
      _hover={!isSubmitted ? { boxShadow: "lg" } : {}}
      cursor={!isSubmitted ? "pointer" : "default"}
    >
      {/* Stub - نسبة أو أيقونة تشغيل */}
      <Flex
        w="90px"
        flexShrink={0}
        bgGradient={`linear(to-br, ${ticketGradient[0]}, ${ticketGradient[1]})`}
        align="center"
        justify="center"
        position="relative"
      >
        {isSubmitted ? (
          <VStack spacing={0}>
            <Text color="white" fontSize="22px" fontWeight="bold">
              {percentage}%
            </Text>
            <Text
              color="rgba(255,255,255,0.9)"
              fontSize="12px"
              fontWeight="600"
            >
              {isPassed ? "ناجح" : "راسب"}
            </Text>
          </VStack>
        ) : (
          <Icon as={FaPlay} color="white" boxSize={8} />
        )}
        <Box
          position="absolute"
          left="-10px"
          top="-10px"
          w="20px"
          h="20px"
          borderRadius="full"
          bg={bgColor}
          zIndex={2}
        />
        <Box
          position="absolute"
          left="-10px"
          bottom="-10px"
          w="20px"
          h="20px"
          borderRadius="full"
          bg={bgColor}
          zIndex={2}
        />
      </Flex>

      {/* Dotted line */}
      <Flex
        w="1px"
        align="center"
        justify="space-between"
        py="10%"
        px="2px"
        flexDirection="column"
        alignSelf="center"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <Box
            key={i}
            w="2px"
            h="4px"
            borderRadius="1px"
            bg={secondaryColor}
            opacity={0.4}
          />
        ))}
      </Flex>

      {/* Content */}
      <Flex flex={1} p={4} direction="column" justify="space-between" minW={0}>
        <Flex justify="space-between" align="center">
          <Text
            fontSize="16px"
            fontWeight="bold"
            color={textColor}
            noOfLines={1}
            textAlign="right"
            ml={2}
          >
            {exam.exam_title}
          </Text>
          <Box color={ticketGradient[0]}>
            {isSubmitted ? (
              isPassed ? (
                <Icon as={MdCheckCircle} boxSize={5} />
              ) : (
                <Icon as={MdCancel} boxSize={5} />
              )
            ) : (
              <Icon as={MdSchedule} boxSize={5} />
            )}
          </Box>
        </Flex>
        <Text
          fontSize="13px"
          color={secondaryColor}
          noOfLines={1}
          textAlign="right"
        >
          {exam.course_title || "عام"} • {getExamTypeLabel(exam.exam_type)}
        </Text>
        <Flex justify="space-between" align="center" direction="row-reverse" flexWrap="wrap" gap={2}>
          {isSubmitted ? (
            <>
              <HStack spacing={2} flexWrap="wrap">
                <Text fontSize="12px" color={secondaryColor}>
                  {formatDate(exam.submitted_at)}
                </Text>
                {onViewReport && (
                  <Button
                    size="xs"
                    leftIcon={<Icon as={MdVisibility} />}
                    colorScheme="blue"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onViewReport(exam.exam_id);
                    }}
                  >
                    عرض التقرير
                  </Button>
                )}
              </HStack>
              <Text fontSize="14px" fontWeight="700" color={textColor}>
                {studentGrade} / {totalGrade}
              </Text>
            </>
          ) : (
            <Text fontSize="13px" fontWeight="600" color="#3B82F6">
              جاهز للبدء
            </Text>
          )}
        </Flex>
      </Flex>
    </Flex>
  );

  if (isSubmitted) return content;
  return (
    <Link to={examUrl} style={{ textDecoration: "none" }}>
      {content}
    </Link>
  );
}

export default ExamGrades;
