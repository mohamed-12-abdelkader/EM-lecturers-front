import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Avatar,
  Badge,
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
import { FaHistory, FaMedal, FaTrophy, FaUsers } from "react-icons/fa";
import {
  fetchStudentPointsLeaderboard,
  fetchStudentPointsSummary,
  fetchStudentPointsTransactions,
  pointsApiError,
} from "../../api/teacherPointsApi";
import { readStoredUser } from "../../utils/authStorage";
import {
  DailyQuizHero,
  DailyQuizPageShell,
  DailyQuizSurface,
  useDailyQuizTheme,
} from "../dailyQuiz/DailyQuizChrome";
import {
  eventTypeLabel,
  eventTypeTone,
  formatPointsDate,
  rankMedal,
  transactionCalculationHint,
  transactionDetail,
} from "./pointsUtils";

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
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const meId = readStoredUser()?.id ?? readStoredUser()?.user_id ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryData, boardData, txData] = await Promise.all([
        fetchStudentPointsSummary(),
        fetchStudentPointsLeaderboard(10),
        fetchStudentPointsTransactions(100),
      ]);
      setSummary(summaryData);
      setBoard(boardData);
      setTransactions(txData.transactions || []);
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
        subtitle="النقاط تُحسب من درجات الامتحانات ومشاهدة الفيديوهات والواجبات. قائمة المتفوقين تعرض أعلى 10 في صفك فقط."
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

      <DailyQuizSurface overflow="hidden" mt={5}>
        <Flex
          px={4}
          py={3}
          align="center"
          justify="space-between"
          borderBottomWidth="1px"
          borderColor={theme.cardBorder}
        >
          <Flex align="center" gap={2}>
            <FaHistory color="#DD6B20" />
            <Text fontWeight="800" color={theme.heading}>
              سجل احتساب نقاطي
            </Text>
          </Flex>
          <Text fontSize="xs" color={theme.muted}>
            {transactions.length} عملية
          </Text>
        </Flex>

        {loading ? (
          <VStack p={4} spacing={3} align="stretch">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} h="64px" borderRadius="xl" />
            ))}
          </VStack>
        ) : !transactions.length ? (
          <Box p={8} textAlign="center">
            <Text color={theme.muted}>
              لا يوجد سجل بعد. بعد تسليم امتحان أو مشاهدة فيديو ستظهر تفاصيل الاحتساب هنا.
            </Text>
          </Box>
        ) : (
          transactions.map((tx) => {
            const detail = transactionDetail(tx);
            const hint = transactionCalculationHint(tx);
            return (
              <Flex
                key={tx.id}
                px={4}
                py={3}
                align={{ base: "stretch", sm: "center" }}
                direction={{ base: "column", sm: "row" }}
                gap={3}
                borderBottomWidth="1px"
                borderColor={theme.cardBorder}
              >
                <Box flex="1" minW={0}>
                  <Flex align="center" gap={2} flexWrap="wrap" mb={1}>
                    <Badge colorScheme={eventTypeTone(tx.eventType)} borderRadius="full">
                      {eventTypeLabel(tx.eventType)}
                    </Badge>
                    <Text fontSize="xs" color={theme.muted}>
                      {formatPointsDate(tx.createdAt)}
                    </Text>
                  </Flex>
                  {detail ? (
                    <Text fontWeight="700" fontSize="sm" color={theme.heading} noOfLines={2}>
                      {detail}
                    </Text>
                  ) : null}
                  {hint ? (
                    <Text mt={1} fontSize="xs" color={theme.muted}>
                      {hint}
                    </Text>
                  ) : null}
                </Box>
                <Text
                  fontWeight="800"
                  color={tx.points >= 0 ? "green.500" : "red.500"}
                  fontSize="sm"
                  whiteSpace="nowrap"
                >
                  {tx.points >= 0 ? `+${tx.points}` : tx.points} نقطة
                </Text>
              </Flex>
            );
          })
        )}
      </DailyQuizSurface>
    </DailyQuizPageShell>
  );
}
