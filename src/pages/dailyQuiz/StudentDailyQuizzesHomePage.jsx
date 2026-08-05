import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  HStack,
  Icon,
  Progress,
  SimpleGrid,
  Skeleton,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  FaClock,
  FaFire,
  FaMedal,
  FaPlay,
  FaQuestionCircle,
  FaRedo,
  FaTrophy,
} from "react-icons/fa";
import {
  apiErrorMessage,
  AVAILABILITY_COLORS,
  AVAILABILITY_LABELS,
  fetchStudentDailyQuizHome,
  formatDuration,
  formatDateTime,
  startStudentDailyQuiz,
} from "../../api/dailyQuizApi";
import {
  DailyQuizHero,
  DailyQuizMetaChip,
  DailyQuizPageShell,
  DailyQuizSurface,
  useDailyQuizTheme,
} from "./DailyQuizChrome";

function useCountdown(seconds) {
  const [left, setLeft] = useState(Math.max(0, Number(seconds) || 0));
  useEffect(() => {
    setLeft(Math.max(0, Number(seconds) || 0));
  }, [seconds]);
  useEffect(() => {
    if (left <= 0) return undefined;
    const t = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [left > 0]); // eslint-disable-line react-hooks/exhaustive-deps
  const m = Math.floor(left / 60);
  const s = left % 60;
  return {
    left,
    label: `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
  };
}

function QuizHomeCard({ quiz, onEnter, busyId }) {
  const theme = useDailyQuizTheme();
  const countdown = useCountdown(
    quiz.show_countdown ? quiz.seconds_to_start : quiz.availability === "live" ? quiz.seconds_to_end : 0,
  );
  const busy = busyId === quiz.id;
  const color = AVAILABILITY_COLORS[quiz.availability] || "gray";

  let ctaLabel = "غير متاحة";
  let ctaDisabled = true;
  let ctaAction = null;

  if (quiz.active_attempt_id) {
    ctaLabel = "متابعة الحل";
    ctaDisabled = false;
    ctaAction = () => onEnter(quiz, "resume");
  } else if (quiz.already_submitted) {
    ctaLabel = "عرض النتيجة";
    ctaDisabled = false;
    ctaAction = () => onEnter(quiz, "result");
  } else if (quiz.can_start) {
    ctaLabel = "ابدأ الآن";
    ctaDisabled = false;
    ctaAction = () => onEnter(quiz, "start");
  } else if (quiz.availability === "ended") {
    ctaLabel = "انتهت";
  } else if (quiz.availability === "upcoming") {
    ctaLabel = "قريبًا";
  }

  return (
    <Box
      bg={theme.cardBg}
      borderWidth="1px"
      borderColor={theme.cardBorder}
      borderRadius="2xl"
      overflow="hidden"
      boxShadow={theme.shadow}
      h="full"
      display="flex"
      flexDirection="column"
      transition="transform 0.2s ease, box-shadow 0.2s ease"
      _hover={{ transform: "translateY(-3px)", boxShadow: theme.hoverShadow }}
    >
      <Box
        h="4px"
        bgGradient={
          quiz.availability === "live"
            ? "linear(to-l, blue.500, orange.500)"
            : quiz.availability === "upcoming"
              ? "linear(to-l, blue.300, blue.500)"
              : "linear(to-l, gray.300, gray.400)"
        }
      />
      <Box p={4} flex="1" display="flex" flexDirection="column">
        <HStack justify="space-between" mb={3} flexWrap="wrap" gap={2}>
          <DailyQuizMetaChip colorScheme={color}>
            {AVAILABILITY_LABELS[quiz.availability] || quiz.availability}
          </DailyQuizMetaChip>
          <DailyQuizMetaChip colorScheme="blue">
            {quiz.grade_name || "—"}
          </DailyQuizMetaChip>
        </HStack>

        <Heading size="sm" color={theme.heading} mb={2} noOfLines={2} lineHeight="1.5">
          {quiz.title}
        </Heading>

        <HStack spacing={2} mb={3}>
          <Avatar size="xs" name={quiz.teacher_name} src={quiz.teacher_avatar} />
          <Text fontSize="xs" color={theme.muted} fontWeight="600">
            {quiz.teacher_name || "المدرس"}
          </Text>
        </HStack>

        <SimpleGrid columns={2} spacing={2} mb={3}>
          <Flex align="center" gap={2} bg={theme.softBg} borderRadius="xl" px={2.5} py={2}>
            <Icon as={FaQuestionCircle} color="orange.500" boxSize={3} />
            <Text fontSize="xs" fontWeight="600" color={theme.muted}>
              {quiz.questions_count || 0} سؤال
            </Text>
          </Flex>
          <Flex align="center" gap={2} bg={theme.softBg} borderRadius="xl" px={2.5} py={2}>
            <Icon as={FaClock} color="blue.500" boxSize={3} />
            <Text fontSize="xs" fontWeight="600" color={theme.muted}>
              {formatDuration(quiz.duration_seconds)}
            </Text>
          </Flex>
        </SimpleGrid>

        <Text fontSize="xs" color={theme.muted} mb={1}>
          من {formatDateTime(quiz.starts_at)}
        </Text>
        <Text fontSize="xs" color={theme.muted} mb={3}>
          إلى {formatDateTime(quiz.ends_at)}
        </Text>

        {(quiz.show_countdown || quiz.availability === "live") && countdown.left > 0 ? (
          <Box mb={3}>
            <Text fontSize="xs" color={theme.muted} mb={1} fontWeight="600">
              {quiz.show_countdown ? "تبدأ خلال" : "تنتهي خلال"}
            </Text>
            <Text fontSize="lg" fontWeight="800" color={quiz.show_countdown ? "blue.500" : "orange.500"}>
              {countdown.label}
            </Text>
            {!quiz.show_countdown && quiz.seconds_to_end ? (
              <Progress
                mt={2}
                size="xs"
                borderRadius="full"
                colorScheme="orange"
                value={Math.min(100, (countdown.left / Math.max(1, quiz.seconds_to_end)) * 100)}
              />
            ) : null}
          </Box>
        ) : null}

        <HStack mt="auto" spacing={2}>
          <Button
            flex={1}
            size="sm"
            borderRadius="xl"
            bg={quiz.already_submitted ? "blue.500" : "orange.500"}
            color="white"
            leftIcon={quiz.active_attempt_id ? <FaRedo /> : quiz.already_submitted ? <FaTrophy /> : <FaPlay />}
            isDisabled={ctaDisabled}
            isLoading={busy}
            _hover={{ bg: quiz.already_submitted ? "blue.600" : "orange.600" }}
            onClick={ctaAction || undefined}
          >
            {ctaLabel}
          </Button>
          {quiz.already_submitted ? (
            <Button
              as={RouterLink}
              to={`/student-daily-quizzes/${quiz.id}/leaderboard`}
              size="sm"
              borderRadius="xl"
              variant="outline"
              colorScheme="blue"
              aria-label="الترتيب"
            >
              <FaMedal />
            </Button>
          ) : null}
        </HStack>
      </Box>
    </Box>
  );
}

export default function StudentDailyQuizzesHomePage() {
  const toast = useToast();
  const navigate = useNavigate();
  const theme = useDailyQuizTheme();
  const [loading, setLoading] = useState(true);
  const [sectionTitle, setSectionTitle] = useState("المسابقة اليومية");
  const [quizzes, setQuizzes] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchStudentDailyQuizHome();
      setSectionTitle(data.section_title);
      setQuizzes(data.quizzes);
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل تحميل المسابقات"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleEnter = async (quiz, mode) => {
    if (mode === "result") {
      navigate(`/student-daily-quizzes/${quiz.id}/result`);
      return;
    }
    if (mode === "resume" && quiz.active_attempt_id) {
      navigate(`/student-daily-quizzes/attempt/${quiz.active_attempt_id}`);
      return;
    }
    setBusyId(quiz.id);
    try {
      const data = await startStudentDailyQuiz(quiz.id, {
        platform: "web",
        app_version: "web",
      });
      const attemptId = data?.attempt?.id;
      if (!attemptId) throw new Error("لم يتم إنشاء محاولة");
      navigate(`/student-daily-quizzes/attempt/${attemptId}`, { state: { session: data } });
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "تعذر بدء المسابقة"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DailyQuizPageShell>
      <DailyQuizHero
        icon={FaFire}
        eyebrow="Daily Quiz"
        title={sectionTitle.replace(/^🔥\s*/, "") || "المسابقة اليومية"}
        subtitle="نافس زملاءك، حل بسرعة، واصعد على لوحة المتصدرين اليومية والشهرية."
        actions={
          <>
            <Button
              as={RouterLink}
              to="/student-daily-quizzes/hub"
              leftIcon={<FaTrophy />}
              bg="white"
              color="orange.500"
              borderRadius="xl"
              fontWeight="800"
              _hover={{ bg: "whiteAlpha.900" }}
            >
              الترتيب والإنجازات
            </Button>
            <Button
              leftIcon={<FaRedo />}
              variant="outline"
              borderColor="whiteAlpha.400"
              color="white"
              borderRadius="xl"
              _hover={{ bg: "whiteAlpha.200" }}
              onClick={load}
              isLoading={loading}
            >
              تحديث
            </Button>
          </>
        }
      />

      {loading ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} h="280px" borderRadius="2xl" />
          ))}
        </SimpleGrid>
      ) : quizzes.length === 0 ? (
        <DailyQuizSurface py={16}>
          <Center>
            <VStack spacing={3}>
              <Flex w={16} h={16} borderRadius="2xl" bg={theme.accentSoft} align="center" justify="center">
                <Icon as={FaFire} boxSize={7} color="orange.500" />
              </Flex>
              <Heading size="sm" color={theme.heading}>
                لا توجد مسابقات متاحة الآن
              </Heading>
              <Text fontSize="sm" color={theme.muted} textAlign="center" maxW="sm">
                عندما ينشر مدرسك مسابقة يومية ستظهر هنا مباشرة.
              </Text>
            </VStack>
          </Center>
        </DailyQuizSurface>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {quizzes.map((quiz) => (
            <QuizHomeCard key={quiz.id} quiz={quiz} onEnter={handleEnter} busyId={busyId} />
          ))}
        </SimpleGrid>
      )}
    </DailyQuizPageShell>
  );
}
