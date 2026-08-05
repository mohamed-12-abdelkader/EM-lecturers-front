import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  FaArrowRight,
  FaCheckCircle,
  FaClock,
  FaMedal,
  FaTimesCircle,
  FaTrophy,
} from "react-icons/fa";
import {
  apiErrorMessage,
  fetchStudentDailyQuizResult,
  formatDurationMs,
} from "../../api/dailyQuizApi";
import {
  DailyQuizHero,
  DailyQuizMetaChip,
  DailyQuizPageShell,
  DailyQuizSurface,
  useDailyQuizTheme,
} from "./DailyQuizChrome";

function StatTile({ label, value, color = "blue.500" }) {
  const theme = useDailyQuizTheme();
  return (
    <Box
      bg={theme.cardBg}
      borderWidth="1px"
      borderColor={theme.cardBorder}
      borderRadius="2xl"
      p={4}
      textAlign="center"
      boxShadow={theme.shadow}
    >
      <Text fontSize="2xl" fontWeight="800" color={color}>
        {value}
      </Text>
      <Text fontSize="xs" color={theme.muted} fontWeight="600" mt={1}>
        {label}
      </Text>
    </Box>
  );
}

export default function StudentDailyQuizResultPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const theme = useDailyQuizTheme();

  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(location.state?.submitPayload || null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchStudentDailyQuizResult(id);
      setPayload(data);
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل تحميل النتيجة"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (location.state?.submitPayload?.result) {
      setPayload(location.state.submitPayload);
      setLoading(false);
      // refresh full result (may include review)
      fetchStudentDailyQuizResult(id)
        .then(setPayload)
        .catch(() => null);
      return;
    }
    load();
  }, [id, load, location.state]);

  if (loading && !payload) {
    return (
      <DailyQuizPageShell maxW="3xl">
        <Skeleton h="140px" borderRadius="3xl" mb={4} />
        <Skeleton h="280px" borderRadius="2xl" />
      </DailyQuizPageShell>
    );
  }

  const result = payload?.result || {};
  const review = Array.isArray(payload?.review) ? payload.review : [];
  const reveal = Boolean(payload?.reveal_answers);
  const lb = payload?.leaderboard || payload?.leaderboard_preview;

  return (
    <DailyQuizPageShell maxW="3xl">
      <Button
        as={RouterLink}
        to="/student-daily-quizzes"
        variant="ghost"
        size="sm"
        leftIcon={<FaArrowRight />}
        mb={3}
        color={theme.muted}
        borderRadius="xl"
      >
        المسابقات
      </Button>

      <DailyQuizHero
        icon={FaTrophy}
        eyebrow="نتيجتك"
        title={`${result.total_points ?? 0} نقطة`}
        subtitle={
          result.finish_rank
            ? `ترتيبك #${result.finish_rank} · ${result.score_percent ?? 0}%`
            : "أحسنت — تم احتساب نتيجتك"
        }
        badges={
          <>
            <DailyQuizMetaChip colorScheme="blue">
              صح {result.correct_count ?? 0}
            </DailyQuizMetaChip>
            <DailyQuizMetaChip colorScheme="orange">
              خطأ {result.wrong_count ?? 0}
            </DailyQuizMetaChip>
            {(result.unanswered_count ?? 0) > 0 ? (
              <DailyQuizMetaChip colorScheme="gray">
                فارغ {result.unanswered_count}
              </DailyQuizMetaChip>
            ) : null}
          </>
        }
        actions={
          <>
            <Button
              as={RouterLink}
              to={`/student-daily-quizzes/${id}/leaderboard`}
              leftIcon={<FaMedal />}
              bg="white"
              color="orange.500"
              borderRadius="xl"
              fontWeight="800"
            >
              ترتيب اليوم
            </Button>
            <Button
              as={RouterLink}
              to="/student-daily-quizzes/hub"
              variant="outline"
              borderColor="whiteAlpha.400"
              color="white"
              borderRadius="xl"
              _hover={{ bg: "whiteAlpha.200" }}
            >
              الإنجازات
            </Button>
          </>
        }
      />

      <HStack spacing={3} mb={4} align="center">
        <Avatar size="sm" name={result.student_name} src={result.student_avatar} />
        <Text fontWeight="700" color={theme.heading}>
          {result.student_name || "أنت"}
        </Text>
      </HStack>

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={5}>
        <StatTile label="النقاط الأساسية" value={result.base_points ?? 0} color="blue.500" />
        <StatTile label="مكافأة السرعة" value={result.speed_bonus ?? 0} color="orange.500" />
        <StatTile label="الإجمالي" value={result.total_points ?? 0} color="blue.600" />
        <StatTile
          label="المدة"
          value={formatDurationMs(result.duration_ms)}
          color="orange.500"
        />
      </SimpleGrid>

      {lb?.me ? (
        <DailyQuizSurface p={4} mb={5}>
          <Flex justify="space-between" align="center" gap={3}>
            <Box>
              <Text fontSize="sm" fontWeight="800" color={theme.heading}>
                ترتيبك الآن #{lb.me.rank}
              </Text>
              <Text fontSize="xs" color={theme.muted}>
                من أصل {lb.total_participants || 0} مشارك
              </Text>
            </Box>
            <Button
              as={RouterLink}
              to={`/student-daily-quizzes/${id}/leaderboard`}
              size="sm"
              colorScheme="blue"
              borderRadius="xl"
            >
              عرض اللوحة
            </Button>
          </Flex>
        </DailyQuizSurface>
      ) : null}

      {reveal && review.length > 0 ? (
        <Box>
          <Heading size="sm" color={theme.heading} mb={3}>
            مراجعة الإجابات
          </Heading>
          <VStack align="stretch" spacing={3}>
            {review.map((item, idx) => (
              <DailyQuizSurface key={item.question_id || idx} p={4}>
                <HStack mb={2} spacing={2}>
                  <Icon
                    as={item.is_correct ? FaCheckCircle : FaTimesCircle}
                    color={item.is_correct ? "green.500" : "red.400"}
                  />
                  <Text fontSize="xs" fontWeight="700" color={theme.muted}>
                    سؤال {idx + 1} · {item.points_awarded ?? 0}/{item.points ?? 0} نقطة
                  </Text>
                </HStack>
                <Text fontSize="sm" fontWeight="700" color={theme.heading} mb={2} lineHeight="1.7">
                  {item.question_text}
                </Text>
                <Text fontSize="xs" color={theme.muted}>
                  إجابتك: {item.selected_answer || "—"}
                  {item.correct_answer ? ` · الصحيحة: ${item.correct_answer}` : ""}
                </Text>
              </DailyQuizSurface>
            ))}
          </VStack>
        </Box>
      ) : (
        <DailyQuizSurface p={5}>
          <HStack spacing={2} color={theme.muted}>
            <Icon as={FaClock} />
            <Text fontSize="sm">
              {reveal
                ? "لا توجد مراجعة متاحة."
                : "مراجعة الإجابات غير مفعّلة بعد لهذه المسابقة."}
            </Text>
          </HStack>
        </DailyQuizSurface>
      )}

      <Button
        mt={6}
        w="full"
        colorScheme="blue"
        borderRadius="xl"
        onClick={() => navigate("/student-daily-quizzes")}
      >
        العودة للمسابقات
      </Button>
    </DailyQuizPageShell>
  );
}
