import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { FaClock, FaPlay, FaRedo, FaSync } from "react-icons/fa";
import { MdPublic, MdSchool } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import {
  fetchStudentPublicExams,
  publicExamsApiError,
  startPublicExamAttempt,
} from "../../api/publicExamsApi";
import { translateCourseExamStudentError } from "../../api/courseExamsApi";
import { persistAttemptId } from "../../utils/examAttemptProgress";
import {
  formatAttemptLimitLabel,
  formatCourseExamDurationLabel,
  getCourseExamAvailabilityStatus,
  getStudentExamCta,
} from "../../utils/courseLevelExamUtils";
import {
  DailyQuizHero,
  DailyQuizPageShell,
  DailyQuizSurface,
  useDailyQuizTheme,
} from "../dailyQuiz/DailyQuizChrome";

export default function StudentPublicExamsPage() {
  const token = localStorage.getItem("token");
  const toast = useToast();
  const navigate = useNavigate();
  const theme = useDailyQuizTheme();

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [startingId, setStartingId] = useState(null);

  const loadExams = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const list = await fetchStudentPublicExams(token);
      setExams(list);
    } catch (err) {
      toast({
        title: publicExamsApiError(err, "فشل تحميل الامتحانات العامة"),
        status: "error",
        isClosable: true,
      });
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const handleStart = async (exam) => {
    const cta = getStudentExamCta(exam);
    if (cta.kind === "report") {
      navigate(`/exam/${exam.id}/report`, {
        state: { fromPublic: true },
      });
      return;
    }
    if (cta.disabled || cta.kind !== "start") return;

    setStartingId(exam.id);
    try {
      const session = await startPublicExamAttempt(exam.id, token);
      const attemptId = session?.attemptId ?? session?.attempt_id ?? session?.id;
      if (attemptId) persistAttemptId(exam.id, attemptId);
      navigate(`/exam/${exam.id}/take`, {
        state: {
          session,
          fromPublic: true,
        },
      });
    } catch (err) {
      const previous = err?.response?.data?.previousAttempt;
      if (previous) {
        navigate(`/exam/${exam.id}/report`, {
          state: { fromPublic: true, previousAttempt: previous },
        });
        return;
      }
      toast({
        title: translateCourseExamStudentError(err) || publicExamsApiError(err, "تعذر بدء الامتحان"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setStartingId(null);
    }
  };

  if (!token) {
    return (
      <DailyQuizPageShell>
        <Text textAlign="center" py={16}>
          يجب تسجيل الدخول أولاً
        </Text>
      </DailyQuizPageShell>
    );
  }

  return (
    <DailyQuizPageShell maxW="4xl">
      <DailyQuizHero
        icon={MdPublic}
        eyebrow="Your grade exams"
        title="الامتحانات العامة"
        subtitle="امتحانات صفك الدراسي المنشورة — ابدأ المحاولة أو استكملها أو راجع تقريرك."
        actions={
          <Button
            leftIcon={<FaSync />}
            variant="outline"
            borderColor="whiteAlpha.400"
            color="white"
            borderRadius="xl"
            _hover={{ bg: "whiteAlpha.200" }}
            onClick={loadExams}
            isLoading={loading}
          >
            تحديث
          </Button>
        }
      />

      {loading ? (
        <VStack align="stretch" spacing={4}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} h="140px" borderRadius="2xl" />
          ))}
        </VStack>
      ) : exams.length === 0 ? (
        <DailyQuizSurface p={{ base: 8, md: 12 }} textAlign="center">
          <Flex
            mx="auto"
            mb={4}
            w={16}
            h={16}
            borderRadius="2xl"
            bg="blue.50"
            color="blue.500"
            align="center"
            justify="center"
          >
            <Icon as={MdPublic} boxSize={8} />
          </Flex>
          <Text fontWeight="900" fontSize="lg" color={theme.heading}>
            لا توجد امتحانات متاحة الآن
          </Text>
          <Text fontSize="sm" color={theme.muted} mt={2} maxW="md" mx="auto" lineHeight="1.8">
            تظهر هنا الامتحانات العامة المنشورة لصفوفك الدراسية فقط.
          </Text>
        </DailyQuizSurface>
      ) : (
        <VStack align="stretch" spacing={4}>
          {exams.map((exam) => {
            const availability = getCourseExamAvailabilityStatus(exam);
            const cta = getStudentExamCta(exam);
            const isResume = cta.label?.includes("استكمل");
            const canAct = !cta.disabled;
            return (
              <Box
                key={exam.id}
                borderRadius="2xl"
                overflow="hidden"
                borderWidth="1px"
                borderColor={theme.cardBorder}
                bg={theme.cardBg}
                boxShadow={theme.shadow}
                transition="box-shadow 0.2s, transform 0.2s"
                _hover={{ boxShadow: theme.hoverShadow, transform: "translateY(-1px)" }}
              >
                <Box
                  h="4px"
                  bg={
                    cta.kind === "report"
                      ? "blue.400"
                      : canAct
                        ? "orange.400"
                        : "gray.300"
                  }
                />
                <Box p={{ base: 4, md: 5 }}>
                  <Flex
                    direction={{ base: "column", sm: "row" }}
                    gap={4}
                    align={{ base: "stretch", sm: "center" }}
                  >
                    <Box flex="1" minW={0}>
                      <HStack spacing={2} mb={2} flexWrap="wrap">
                        <Badge colorScheme="cyan" variant="subtle" borderRadius="full" px={2.5}>
                          <HStack spacing={1}>
                            <Icon as={MdSchool} boxSize={3} />
                            <Text>
                              {exam.gradeName || exam.grade_name || `صف ${exam.gradeId}`}
                            </Text>
                          </HStack>
                        </Badge>
                        <Badge colorScheme={availability.colorScheme} borderRadius="full" px={2.5}>
                          {availability.label}
                        </Badge>
                      </HStack>
                      <Text fontWeight="900" fontSize={{ base: "md", md: "lg" }} color={theme.heading} mb={1}>
                        {exam.title}
                      </Text>
                      {exam.description ? (
                        <Text fontSize="sm" color={theme.muted} noOfLines={2} mb={3} lineHeight="1.7">
                          {exam.description}
                        </Text>
                      ) : null}
                      <SimpleGrid columns={3} spacing={3} maxW="sm">
                        <Box>
                          <Text fontSize="10px" color={theme.muted} fontWeight="700">
                            المدة
                          </Text>
                          <HStack spacing={1} mt={0.5}>
                            <Icon as={FaClock} boxSize={3} color="orange.400" />
                            <Text fontSize="sm" fontWeight="800">
                              {formatCourseExamDurationLabel(exam)}
                            </Text>
                          </HStack>
                        </Box>
                        <Box>
                          <Text fontSize="10px" color={theme.muted} fontWeight="700">
                            الأسئلة
                          </Text>
                          <Text fontSize="sm" fontWeight="800" mt={0.5}>
                            {exam.questions_count || "—"}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="10px" color={theme.muted} fontWeight="700">
                            المحاولات
                          </Text>
                          <Text fontSize="sm" fontWeight="800" mt={0.5}>
                            {formatAttemptLimitLabel(exam)}
                          </Text>
                        </Box>
                      </SimpleGrid>
                    </Box>
                    <Button
                      colorScheme={cta.kind === "report" ? "blue" : "orange"}
                      borderRadius="xl"
                      leftIcon={isResume ? <FaRedo /> : <FaPlay />}
                      isDisabled={cta.disabled}
                      isLoading={startingId === exam.id}
                      onClick={() => handleStart(exam)}
                      alignSelf={{ base: "stretch", sm: "center" }}
                      minW={{ sm: "160px" }}
                      size="md"
                      fontWeight="800"
                    >
                      {cta.label}
                    </Button>
                  </Flex>
                </Box>
              </Box>
            );
          })}
        </VStack>
      )}
    </DailyQuizPageShell>
  );
}
