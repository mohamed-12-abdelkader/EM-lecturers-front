import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Skeleton,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { FaArrowRight, FaMedal, FaTrophy } from "react-icons/fa";
import {
  apiErrorMessage,
  fetchStudentDailyLeaderboard,
  formatDurationMs,
} from "../../api/dailyQuizApi";
import {
  DailyQuizHero,
  DailyQuizPageShell,
  DailyQuizSurface,
  useDailyQuizTheme,
} from "./DailyQuizChrome";

function RankRow({ row, highlight }) {
  const theme = useDailyQuizTheme();
  const top = row.rank <= 3;
  return (
    <Flex
      px={4}
      py={3}
      align="center"
      gap={3}
      bg={highlight ? "orange.50" : top ? theme.accentSoft : "transparent"}
      borderBottomWidth="1px"
      borderColor={theme.cardBorder}
      _dark={{ bg: highlight ? "orange.900" : top ? "whiteAlpha.100" : "transparent" }}
    >
      <Flex
        w={8}
        h={8}
        borderRadius="lg"
        align="center"
        justify="center"
        fontWeight="800"
        fontSize="sm"
        bg={top ? "orange.500" : theme.softBg}
        color={top ? "white" : theme.muted}
      >
        {row.rank}
      </Flex>
      <Avatar size="sm" name={row.student_name} src={row.student_avatar} />
      <Box flex="1" minW={0}>
        <Text fontWeight="700" fontSize="sm" color={theme.heading} noOfLines={1}>
          {row.student_name || `طالب #${row.student_id}`}
          {highlight ? " (أنت)" : ""}
        </Text>
        <Text fontSize="xs" color={theme.muted}>
          صح {row.correct_count ?? "—"} · {formatDurationMs(row.duration_ms)}
        </Text>
      </Box>
      <Text fontWeight="800" color="orange.500" fontSize="sm">
        {row.total_points} نقطة
      </Text>
    </Flex>
  );
}

export default function StudentDailyQuizLeaderboardPage() {
  const { id } = useParams();
  const toast = useToast();
  const theme = useDailyQuizTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchStudentDailyLeaderboard(id, 50);
      setData(res);
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل تحميل الترتيب"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

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
        eyebrow="Leaderboard"
        title="ترتيب اليوم"
        subtitle={
          data?.total_participants
            ? `${data.total_participants} مشارك في هذه المسابقة`
            : "لوحة متصدري المسابقة اليومية"
        }
        actions={
          <Button
            as={RouterLink}
            to={`/student-daily-quizzes/${id}/result`}
            leftIcon={<FaMedal />}
            bg="white"
            color="blue.500"
            borderRadius="xl"
            fontWeight="800"
          >
            نتيجتي
          </Button>
        }
      />

      {data?.me ? (
        <DailyQuizSurface p={4} mb={4}>
          <Flex justify="space-between" align="center">
            <Box>
              <Text fontSize="xs" color={theme.muted} fontWeight="600">
                ترتيبك
              </Text>
              <Heading size="md" color="orange.500">
                #{data.me.rank}
              </Heading>
            </Box>
            <Text fontWeight="800" color={theme.heading}>
              {data.me.total_points} نقطة
            </Text>
          </Flex>
        </DailyQuizSurface>
      ) : null}

      <DailyQuizSurface overflow="hidden">
        {loading ? (
          <VStack p={4} spacing={3} align="stretch">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} h="56px" borderRadius="xl" />
            ))}
          </VStack>
        ) : !data?.items?.length ? (
          <Box p={8} textAlign="center">
            <Text color={theme.muted}>لا يوجد مشاركون بعد.</Text>
          </Box>
        ) : (
          <VStack align="stretch" spacing={0}>
            {data.items.map((row) => (
              <RankRow
                key={`${row.student_id}-${row.rank}`}
                row={row}
                highlight={Boolean(row.is_current_user) || row.student_id === data.me?.student_id}
              />
            ))}
          </VStack>
        )}
      </DailyQuizSurface>
    </DailyQuizPageShell>
  );
}
