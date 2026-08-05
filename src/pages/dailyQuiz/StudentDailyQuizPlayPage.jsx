import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  Progress,
  SimpleGrid,
  Skeleton,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaPaperPlane,
} from "react-icons/fa";
import {
  answersMapToPayload,
  apiErrorMessage,
  autosaveStudentAnswers,
  fetchStudentAttempt,
  formatMs,
  savedAnswersToMap,
  submitStudentAttempt,
} from "../../api/dailyQuizApi";
import {
  DailyQuizPageShell,
  DailyQuizSurface,
  useDailyQuizTheme,
} from "./DailyQuizChrome";

const OPTION_LABEL = { A: "أ", B: "ب", C: "ج", D: "د" };

export default function StudentDailyQuizPlayPage() {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const theme = useDailyQuizTheme();

  const [session, setSession] = useState(location.state?.session || null);
  const [loading, setLoading] = useState(!location.state?.session);
  const [answers, setAnswers] = useState({});
  const [qIndex, setQIndex] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  const answersRef = useRef(answers);
  const submitTokenRef = useRef(null);
  const submittedRef = useRef(false);
  const expiresAtRef = useRef(null);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const hydrate = useCallback((data) => {
    if (!data) return;
    setSession(data);
    setAnswers(savedAnswersToMap(data.saved_answers));
    submitTokenRef.current = data.attempt?.submit_token || null;
    const expires = data.attempt?.expires_at
      ? new Date(data.attempt.expires_at).getTime()
      : Date.now() + (Number(data.attempt?.remaining_ms) || 0);
    expiresAtRef.current = expires;
    setRemainingMs(Math.max(0, expires - Date.now()));
    if (data.attempt?.status && data.attempt.status !== "in_progress") {
      const quizId = data.quiz?.id || data.attempt?.quiz_id;
      if (quizId) navigate(`/student-daily-quizzes/${quizId}/result`, { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (location.state?.session) {
        hydrate(location.state.session);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await fetchStudentAttempt(attemptId);
        if (!cancelled) hydrate(data);
      } catch (err) {
        if (!cancelled) {
          toast({
            title: apiErrorMessage(err, "فشل تحميل المحاولة"),
            status: "error",
            isClosable: true,
          });
          navigate("/student-daily-quizzes", { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attemptId, hydrate, location.state, navigate, toast]);

  const questions = useMemo(
    () => (Array.isArray(session?.questions) ? session.questions : []),
    [session],
  );
  const allowNav = session?.attempt?.allow_navigation !== false;
  const current = questions[qIndex];
  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id]).length,
    [questions, answers],
  );

  const doAutosave = useCallback(async () => {
    if (submittedRef.current || !attemptId) return;
    setSaving(true);
    try {
      await autosaveStudentAnswers(attemptId, answersMapToPayload(answersRef.current));
    } catch {
      /* silent — will retry */
    } finally {
      setSaving(false);
    }
  }, [attemptId]);

  const doSubmit = useCallback(async () => {
    if (submittedRef.current || submitting) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await autosaveStudentAnswers(attemptId, answersMapToPayload(answersRef.current)).catch(
        () => null,
      );
      const data = await submitStudentAttempt(attemptId, {
        answers: answersMapToPayload(answersRef.current),
        submit_token: submitTokenRef.current,
      });
      const quizId = session?.quiz?.id || data?.result?.quiz_id;
      toast({ title: "تم إرسال إجاباتك", status: "success", isClosable: true });
      navigate(`/student-daily-quizzes/${quizId}/result`, {
        replace: true,
        state: { submitPayload: data },
      });
    } catch (err) {
      submittedRef.current = false;
      toast({
        title: apiErrorMessage(err, "فشل إرسال الحل"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, navigate, session, submitting, toast]);

  // Server-synced timer
  useEffect(() => {
    if (!expiresAtRef.current) return undefined;
    const tick = () => {
      const left = Math.max(0, expiresAtRef.current - Date.now());
      setRemainingMs(left);
      if (left <= 0 && !submittedRef.current) doSubmit();
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [session, doSubmit]);

  // Autosave interval
  useEffect(() => {
    if (!session || submittedRef.current) return undefined;
    const id = setInterval(doAutosave, 8000);
    return () => clearInterval(id);
  }, [session, doAutosave]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (!submittedRef.current && attemptId) {
        autosaveStudentAnswers(attemptId, answersMapToPayload(answersRef.current)).catch(
          () => null,
        );
      }
    };
  }, [attemptId]);

  const selectAnswer = (questionId, key) => {
    const next = { ...answersRef.current, [questionId]: key };
    answersRef.current = next;
    setAnswers(next);
    autosaveStudentAnswers(attemptId, answersMapToPayload(next)).catch(() => null);
  };

  const urgent = remainingMs > 0 && remainingMs < 60_000;

  if (loading) {
    return (
      <DailyQuizPageShell maxW="3xl">
        <Skeleton h="80px" borderRadius="2xl" mb={4} />
        <Skeleton h="360px" borderRadius="2xl" />
      </DailyQuizPageShell>
    );
  }

  if (!session || !current) {
    return (
      <DailyQuizPageShell maxW="3xl">
        <DailyQuizSurface p={8} textAlign="center">
          <Text color={theme.muted}>لا توجد أسئلة في هذه المحاولة.</Text>
          <Button mt={4} colorScheme="blue" borderRadius="xl" onClick={() => navigate("/student-daily-quizzes")}>
            العودة
          </Button>
        </DailyQuizSurface>
      </DailyQuizPageShell>
    );
  }

  return (
    <DailyQuizPageShell maxW="3xl">
      <DailyQuizSurface p={4} mb={4} position="sticky" top={3} zIndex={10}>
        <Flex justify="space-between" align="center" gap={3} flexWrap="wrap">
          <Box minW={0}>
            <Text fontSize="xs" color={theme.muted} fontWeight="600" noOfLines={1}>
              {session.quiz?.title}
            </Text>
            <Text fontSize="sm" fontWeight="800" color={theme.heading}>
              سؤال {qIndex + 1} من {questions.length}
            </Text>
          </Box>
          <HStack spacing={3}>
            <Flex
              align="center"
              gap={2}
              px={3}
              py={1.5}
              borderRadius="xl"
              bg={urgent ? "orange.50" : theme.softBg}
              color={urgent ? "orange.600" : "blue.600"}
              fontWeight="800"
              fontSize="sm"
              _dark={{ bg: urgent ? "orange.900" : "whiteAlpha.100", color: urgent ? "orange.200" : "blue.200" }}
            >
              <Icon as={FaClock} />
              {formatMs(remainingMs)}
            </Flex>
            <Text fontSize="xs" color={theme.muted}>
              {saving ? "جاري الحفظ…" : `${answeredCount}/${questions.length} مجاب`}
            </Text>
          </HStack>
        </Flex>
        <Progress
          mt={3}
          size="sm"
          borderRadius="full"
          colorScheme={urgent ? "orange" : "blue"}
          value={((qIndex + 1) / Math.max(1, questions.length)) * 100}
        />
      </DailyQuizSurface>

      <DailyQuizSurface p={{ base: 4, md: 6 }} mb={4}>
        <HStack mb={3} spacing={2}>
          <Box
            px={2.5}
            py={1}
            borderRadius="lg"
            bg="blue.500"
            color="white"
            fontSize="xs"
            fontWeight="800"
          >
            {qIndex + 1}
          </Box>
          <Text fontSize="xs" color={theme.muted} fontWeight="600">
            {current.points} نقطة
          </Text>
        </HStack>

        <Heading size="sm" color={theme.heading} mb={4} lineHeight="1.8">
          {current.question_text}
        </Heading>

        {current.question_image_url ? (
          <Image
            src={current.question_image_url}
            alt=""
            maxH="220px"
            mx="auto"
            mb={4}
            borderRadius="xl"
            objectFit="contain"
          />
        ) : null}

        <VStack align="stretch" spacing={2}>
          {(current.options || []).map((opt) => {
            const selected = answers[current.id] === opt.key;
            return (
              <Button
                key={opt.key}
                onClick={() => selectAnswer(current.id, opt.key)}
                justifyContent="flex-start"
                h="auto"
                minH="52px"
                py={3}
                px={3}
                borderRadius="xl"
                borderWidth="2px"
                borderColor={selected ? "orange.500" : theme.cardBorder}
                bg={selected ? "orange.50" : theme.cardBg}
                color={theme.heading}
                _hover={{ borderColor: "blue.400", bg: selected ? "orange.50" : theme.softBg }}
                _dark={{ bg: selected ? "orange.900" : theme.cardBg }}
                whiteSpace="normal"
                textAlign="right"
              >
                <HStack spacing={3} align="start" w="full">
                  <Flex
                    w={8}
                    h={8}
                    borderRadius="lg"
                    align="center"
                    justify="center"
                    flexShrink={0}
                    bg={selected ? "orange.500" : "blue.500"}
                    color="white"
                    fontWeight="800"
                    fontSize="sm"
                  >
                    {selected ? <FaCheck /> : OPTION_LABEL[opt.key] || opt.key}
                  </Flex>
                  <Box flex="1" textAlign="right">
                    <Text fontWeight="600">{opt.text}</Text>
                    {opt.image_url ? (
                      <Image src={opt.image_url} alt="" maxH="100px" mt={2} borderRadius="md" />
                    ) : null}
                  </Box>
                </HStack>
              </Button>
            );
          })}
        </VStack>
      </DailyQuizSurface>

      {allowNav ? (
        <SimpleGrid columns={Math.min(questions.length, 10)} spacing={1} mb={4}>
          {questions.map((q, i) => (
            <IconButton
              key={q.id}
              aria-label={`سؤال ${i + 1}`}
              size="sm"
              borderRadius="lg"
              fontSize="xs"
              fontWeight="800"
              bg={i === qIndex ? "blue.500" : answers[q.id] ? "orange.400" : theme.softBg}
              color={i === qIndex || answers[q.id] ? "white" : theme.muted}
              _hover={{ opacity: 0.9 }}
              onClick={() => setQIndex(i)}
              icon={<Text as="span">{i + 1}</Text>}
            />
          ))}
        </SimpleGrid>
      ) : null}

      <HStack spacing={2} justify="space-between">
        <Button
          leftIcon={<FaChevronRight />}
          variant="outline"
          borderRadius="xl"
          isDisabled={!allowNav || qIndex <= 0}
          onClick={() => setQIndex((i) => Math.max(0, i - 1))}
        >
          السابق
        </Button>

        {qIndex < questions.length - 1 && allowNav ? (
          <Button
            rightIcon={<FaChevronLeft />}
            colorScheme="blue"
            borderRadius="xl"
            onClick={() => setQIndex((i) => Math.min(questions.length - 1, i + 1))}
          >
            التالي
          </Button>
        ) : (
          <Button
            leftIcon={<FaPaperPlane />}
            colorScheme="orange"
            borderRadius="xl"
            isLoading={submitting}
            onClick={doSubmit}
          >
            إنهاء وإرسال
          </Button>
        )}
      </HStack>
    </DailyQuizPageShell>
  );
}
