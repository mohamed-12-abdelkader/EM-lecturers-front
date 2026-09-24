import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Flex,
  Heading,
  SimpleGrid,
  Skeleton,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { FaMedal, FaTrophy, FaUsers } from "react-icons/fa";
import {
  fetchStudentPointsLeaderboard,
  fetchStudentPointsSummary,
  pointsApiError,
} from "../../api/teacherPointsApi";
import { readStoredUser } from "../../utils/authStorage";
import {
  DailyQuizHero,
  DailyQuizPageShell,
  DailyQuizSurface,
  useDailyQuizTheme,
} from "../dailyQuiz/DailyQuizChrome";
import { rankMedal } from "./pointsUtils";

function StatCard({ label, value, hint, icon: IconComp, accent = "blue" }) {
  const theme = useDailyQuizTheme();
  const color = accent === "orange" ? "orange.500" : "blue.500";
  return (
    <DailyQuizSurface p={5} h="full">
      <Flex align="center" gap={3} mb={3}>
        <Flex
          w={10}
          h={10}
          align="center"
          justify="center"
          borderRadius="xl"
          bg={accent === "orange" ? "orange.50" : "blue.50"}
          color={color}
          _dark={{ bg: "whiteAlpha.100" }}
        >
          <IconComp />
        </Flex>
        <Text fontSize="sm" fontWeight="700" color={theme.muted}>
          {label}
        </Text>
      </Flex>
      <Heading size="lg" color={theme.heading} letterSpacing="-0.03em">
        {value}
      </Heading>
      {hint ? (
        <Text mt={2} fontSize="sm" color={theme.muted} lineHeight="1.8">
          {hint}
        </Text>
      ) : null}
    </DailyQuizSurface>
  );
}

function isCurrentStudent(row, meId) {
  return meId != null && row?.studentId != null && String(row.studentId) === String(meId);
}

function getTopTenStatus(myPoints, topStudents, meId) {
  const list = Array.isArray(topStudents) ? topStudents : [];
  const myRow = list.find((row) => isCurrentStudent(row, meId));
  if (myRow) {
    return { inTop: true, rank: myRow.rank, pointsNeeded: 0, tiedOut: false };
  }
  if (!list.length) {
    return { inTop: false, rank: null, pointsNeeded: null, tiedOut: false };
  }
  const lowestTop = Math.min(...list.map((row) => Number(row.points) || 0));
  const mine = Number(myPoints) || 0;
  if (mine >= lowestTop) {
    return { inTop: false, rank: null, pointsNeeded: 0, tiedOut: true };
  }
  return {
    inTop: false,
    rank: null,
    pointsNeeded: lowestTop - mine,
    tiedOut: false,
  };
}

function RankRow({ row, highlight }) {
  const theme = useDailyQuizTheme();
  const medal = rankMedal(row.rank);
  const top = row.rank > 0 && row.rank <= 3;
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
        bg={top ? medal.bg : theme.softBg}
        color={top ? "white" : theme.muted}
      >
        {row.rank}
      </Flex>
      <Avatar size="sm" name={row.name} src={row.avatar || undefined} />
      <Box flex="1" minW={0}>
        <Text fontWeight="800" fontSize="sm" color={theme.heading} noOfLines={1}>
          {row.name}
          {highlight ? " (أنت)" : ""}
        </Text>
      </Box>
      <Text fontWeight="800" color="orange.500" fontSize="sm">
        {row.points} نقطة
      </Text>
    </Flex>
  );
}

export default function StudentPointsPage() {
  const toast = useToast();
  const theme = useDailyQuizTheme();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [board, setBoard] = useState({ topStudents: [] });
  const [error, setError] = useState("");
  const meId = readStoredUser()?.id ?? readStoredUser()?.user_id ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryData, boardData] = await Promise.all([
        fetchStudentPointsSummary(),
        fetchStudentPointsLeaderboard(10),
      ]);
      setSummary(summaryData);
      setBoard(boardData);
    } catch (err) {
      const message = pointsApiError(err, "تعذر تحديد المدرس أو الصف للطالب");
      setError(message);
      toast({ title: message, status: "error", isClosable: true });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const topStatus = getTopTenStatus(summary?.totalPoints, board.topStudents, meId);

  return (
    <DailyQuizPageShell maxW="4xl">
      <DailyQuizHero
        icon={FaTrophy}
        eyebrow="My Points"
        title="نقاطي"
        subtitle="النقاط تُحسب تلقائيًا من مشاهدة الفيديوهات وبدء الامتحانات والواجبات ودرجاتك. قائمة المتفوقين تعرض أعلى 10 في صفك فقط."
        actions={
          <Button
            as={RouterLink}
            to="/home"
            variant="outline"
            borderColor="whiteAlpha.400"
            color="white"
            borderRadius="xl"
            _hover={{ bg: "whiteAlpha.200" }}
          >
            الرئيسية
          </Button>
        }
      />

      {loading ? (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={5}>
          <Skeleton h="140px" borderRadius="2xl" />
          <Skeleton h="140px" borderRadius="2xl" display={{ base: "none", md: "block" }} />
        </SimpleGrid>
      ) : error ? (
        <DailyQuizSurface p={8} textAlign="center" mb={5}>
          <Text color={theme.muted}>{error}</Text>
        </DailyQuizSurface>
      ) : (
        <SimpleGrid columns={{ base: 1, md: topStatus.inTop ? 2 : 1 }} spacing={4} mb={5}>
          <StatCard
            label="نقاطي"
            value={summary?.totalPoints ?? 0}
            hint="إجمالي رصيدك الحالي"
            icon={FaTrophy}
            accent="orange"
          />
          {topStatus.inTop ? (
            <StatCard
              label="ترتيبي"
              value={topStatus.rank ? `#${topStatus.rank}` : "—"}
              hint="أنت ضمن العشرة الأوائل في صفك"
              icon={FaMedal}
            />
          ) : null}
        </SimpleGrid>
      )}

      <DailyQuizSurface overflow="hidden">
        <Flex px={4} py={3} align="center" justify="space-between" borderBottomWidth="1px" borderColor={theme.cardBorder}>
          <Flex align="center" gap={2}>
            <FaUsers color="#3182CE" />
            <Text fontWeight="800" color={theme.heading}>
              أعلى 10 في الصف
            </Text>
          </Flex>
          <Button size="sm" variant="ghost" borderRadius="lg" onClick={load} isLoading={loading}>
            تحديث
          </Button>
        </Flex>

        {loading ? (
          <VStack p={4} spacing={3} align="stretch">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} h="56px" borderRadius="xl" />
            ))}
          </VStack>
        ) : !board.topStudents?.length ? (
          <Box p={8} textAlign="center">
            <Text color={theme.muted}>لا يوجد ترتيب بعد. ابدأ بمشاهدة فيديو أو حل واجب لتجمع نقاطك.</Text>
          </Box>
        ) : (
          board.topStudents.map((row) => (
            <RankRow
              key={`${row.studentId}-${row.rank}`}
              row={row}
              highlight={isCurrentStudent(row, meId)}
            />
          ))
        )}
      </DailyQuizSurface>

      {!loading && !error && !topStatus.inTop && board.topStudents?.length ? (
        <DailyQuizSurface mt={4} p={4}>
          {topStatus.tiedOut ? (
            <>
              <Text fontWeight="800" color={theme.heading}>
                لست ضمن قائمة الـ 10 الأوائل — متبقٍ لك 0 نقطة
              </Text>
              <Text mt={2} fontSize="sm" color={theme.muted} lineHeight="1.9">
                أنت بالفعل تندرج ضمن الأوائل، لكن سبب عدم وضعك معهم هو أسبقية حل زملائك للامتحان.
                أنت قريب جدًا من الظهور ضمن المتفوقين.
              </Text>
            </>
          ) : (
            <>
              <Text fontWeight="800" color={theme.heading}>
                لست ضمن الـ 10 الأوائل
              </Text>
              <Text mt={2} fontSize="sm" color={theme.muted} lineHeight="1.9">
                يتبقى لك {topStatus.pointsNeeded} نقطة لتنضم لهم.
              </Text>
            </>
          )}
        </DailyQuizSurface>
      ) : null}
    </DailyQuizPageShell>
  );
}
