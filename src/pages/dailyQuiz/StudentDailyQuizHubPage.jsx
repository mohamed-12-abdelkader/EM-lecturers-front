import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  Progress,
  SimpleGrid,
  Skeleton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  FaArrowRight,
  FaFire,
  FaMedal,
  FaStar,
  FaTrophy,
} from "react-icons/fa";
import UserType from "../../Hooks/auth/userType";
import {
  apiErrorMessage,
  currentYearMonth,
  fetchMonthlyLeaderboard,
  fetchMonthlyLeaderboardArchive,
  fetchStudentAchievements,
  fetchStudentDailyQuizHome,
} from "../../api/dailyQuizApi";
import {
  DailyQuizHero,
  DailyQuizMetaChip,
  DailyQuizPageShell,
  DailyQuizSurface,
  useDailyQuizTheme,
} from "./DailyQuizChrome";

function StatCard({ label, value, icon: IconComp, color = "blue.500" }) {
  const theme = useDailyQuizTheme();
  return (
    <Box
      borderWidth="1px"
      borderColor={theme.cardBorder}
      borderRadius="2xl"
      p={4}
      bg={theme.cardBg}
      boxShadow={theme.shadow}
    >
      <HStack justify="space-between" mb={2}>
        <Text fontSize="xs" color={theme.muted} fontWeight="600">
          {label}
        </Text>
        {IconComp ? <Icon as={IconComp} color={color} boxSize={3.5} /> : null}
      </HStack>
      <Text fontSize="xl" fontWeight="800" color={theme.heading}>
        {value}
      </Text>
    </Box>
  );
}

function MonthlyRow({ row, highlight }) {
  const theme = useDailyQuizTheme();
  return (
    <Flex
      px={4}
      py={3}
      align="center"
      gap={3}
      borderBottomWidth="1px"
      borderColor={theme.cardBorder}
      bg={highlight ? "orange.50" : "transparent"}
      _dark={{ bg: highlight ? "orange.900" : "transparent" }}
    >
      <Flex
        w={8}
        h={8}
        borderRadius="lg"
        bg={row.rank <= 3 ? "orange.500" : theme.softBg}
        color={row.rank <= 3 ? "white" : theme.muted}
        align="center"
        justify="center"
        fontWeight="800"
        fontSize="sm"
      >
        {row.rank}
      </Flex>
      <Avatar size="sm" name={row.student_name} src={row.student_avatar} />
      <Box flex="1" minW={0}>
        <Text fontSize="sm" fontWeight="700" color={theme.heading} noOfLines={1}>
          {row.student_name || `طالب #${row.student_id}`}
          {highlight ? " (أنت)" : ""}
        </Text>
        <Text fontSize="xs" color={theme.muted}>
          {row.quizzes_participated ?? 0} مسابقة · 🥇 {row.first_place_count ?? 0}
        </Text>
      </Box>
      <Text fontWeight="800" color="blue.500" fontSize="sm">
        {row.total_points}
      </Text>
    </Flex>
  );
}

export default function StudentDailyQuizHubPage() {
  const toast = useToast();
  const theme = useDailyQuizTheme();
  const [userData] = UserType();

  const [gradeId, setGradeId] = useState(
    () => userData?.grade_id || userData?.grade?.id || "",
  );
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [useArchive, setUseArchive] = useState(false);
  const [monthly, setMonthly] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingAch, setLoadingAch] = useState(true);

  useEffect(() => {
    const fromUser = userData?.grade_id || userData?.grade?.id;
    if (fromUser) {
      setGradeId(fromUser);
      return;
    }
    fetchStudentDailyQuizHome()
      .then((home) => {
        const g = home.quizzes?.[0]?.grade_id;
        if (g) setGradeId(g);
      })
      .catch(() => null);
  }, [userData]);

  const loadMonthly = useCallback(async () => {
    if (!gradeId) return;
    setLoadingMonthly(true);
    try {
      const data = useArchive
        ? await fetchMonthlyLeaderboardArchive({
            grade_id: gradeId,
            year_month: yearMonth,
          })
        : await fetchMonthlyLeaderboard({
            grade_id: gradeId,
            year_month: yearMonth,
            limit: 100,
          });
      setMonthly(data);
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل تحميل ترتيب الشهر"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setLoadingMonthly(false);
    }
  }, [gradeId, yearMonth, useArchive, toast]);

  const loadAchievements = useCallback(async () => {
    setLoadingAch(true);
    try {
      const data = await fetchStudentAchievements();
      setAchievements(data);
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل تحميل الإنجازات"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setLoadingAch(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  useEffect(() => {
    loadMonthly();
  }, [loadMonthly]);

  const progress = achievements?.level_progress?.progress ?? 0;
  const badges = useMemo(
    () => (Array.isArray(achievements?.badges) ? achievements.badges : []),
    [achievements],
  );

  return (
    <DailyQuizPageShell maxW="4xl">
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
        eyebrow="Hub"
        title="الترتيب والإنجازات"
        subtitle="تابع ترتيب الشهر، مستواك، الميداليات، وشاراتك."
      />

      <DailyQuizSurface overflow="hidden">
        <Tabs variant="unstyled" colorScheme="orange">
          <TabList
            px={3}
            pt={3}
            gap={2}
            borderBottomWidth="1px"
            borderColor={theme.cardBorder}
            bg={theme.softBg}
          >
            {[
              { label: "ترتيب الشهر", icon: FaMedal },
              { label: "إنجازاتي", icon: FaStar },
            ].map((t) => (
              <Tab
                key={t.label}
                fontWeight="700"
                fontSize="sm"
                borderRadius="xl"
                px={4}
                py={2.5}
                color={theme.muted}
                _selected={{
                  color: theme.heading,
                  bg: theme.cardBg,
                  boxShadow: theme.shadow,
                  borderWidth: "1px",
                  borderColor: theme.cardBorder,
                }}
              >
                <HStack spacing={2}>
                  <Icon as={t.icon} />
                  <Text>{t.label}</Text>
                </HStack>
              </Tab>
            ))}
          </TabList>

          <TabPanels>
            <TabPanel px={{ base: 3, md: 5 }} py={5}>
              <Flex gap={3} mb={4} flexWrap="wrap" align="center">
                <Input
                  type="month"
                  maxW="200px"
                  borderRadius="xl"
                  value={yearMonth}
                  onChange={(e) => setYearMonth(e.target.value)}
                />
                <Button
                  size="sm"
                  borderRadius="xl"
                  variant={useArchive ? "solid" : "outline"}
                  colorScheme="orange"
                  onClick={() => setUseArchive((v) => !v)}
                >
                  {useArchive ? "أرشيف مفعّل" : "عرض الأرشيف"}
                </Button>
                <Button
                  size="sm"
                  borderRadius="xl"
                  colorScheme="blue"
                  onClick={loadMonthly}
                  isLoading={loadingMonthly}
                >
                  تحديث
                </Button>
                {!gradeId ? (
                  <Text fontSize="xs" color="orange.500">
                    لا يوجد صف مرتبط — افتح مسابقة أولاً أو تأكد من بيانات حسابك.
                  </Text>
                ) : null}
              </Flex>

              {monthly?.me ? (
                <DailyQuizSurface p={4} mb={4} borderWidth="1px">
                  <Flex justify="space-between">
                    <Text fontWeight="800" color={theme.heading}>
                      ترتيبك #{monthly.me.rank}
                    </Text>
                    <Text color="blue.500" fontWeight="800">
                      {monthly.me.total_points} نقطة
                    </Text>
                  </Flex>
                </DailyQuizSurface>
              ) : null}

              <DailyQuizSurface overflow="hidden" borderWidth="1px">
                {loadingMonthly ? (
                  <VStack p={4} spacing={3} align="stretch">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} h="52px" borderRadius="xl" />
                    ))}
                  </VStack>
                ) : !monthly?.items?.length ? (
                  <Box p={8} textAlign="center">
                    <Text color={theme.muted}>لا توجد بيانات لهذا الشهر.</Text>
                  </Box>
                ) : (
                  <VStack align="stretch" spacing={0}>
                    {monthly.items.map((row) => (
                      <MonthlyRow
                        key={`${row.student_id}-${row.rank}`}
                        row={row}
                        highlight={
                          Boolean(row.is_current_user) ||
                          row.student_id === monthly.me?.student_id
                        }
                      />
                    ))}
                  </VStack>
                )}
              </DailyQuizSurface>
            </TabPanel>

            <TabPanel px={{ base: 3, md: 5 }} py={5}>
              {loadingAch ? (
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} h="90px" borderRadius="2xl" />
                  ))}
                </SimpleGrid>
              ) : !achievements ? (
                <Text color={theme.muted}>لا توجد إنجازات بعد.</Text>
              ) : (
                <VStack align="stretch" spacing={5}>
                  <DailyQuizSurface p={5} borderWidth="1px">
                    <Flex justify="space-between" mb={2} align="end">
                      <Box>
                        <Text fontSize="xs" color={theme.muted} fontWeight="600">
                          المستوى
                        </Text>
                        <Heading size="lg" color="blue.500">
                          Lv. {achievements.level ?? achievements.level_progress?.level ?? 1}
                        </Heading>
                      </Box>
                      <Text fontSize="sm" color={theme.muted} fontWeight="700">
                        XP {achievements.xp ?? 0}
                      </Text>
                    </Flex>
                    <Progress
                      value={Math.round((progress || 0) * 100)}
                      colorScheme="orange"
                      borderRadius="full"
                      size="sm"
                    />
                    <Text fontSize="xs" color={theme.muted} mt={2}>
                      {achievements.level_progress?.xp_into_level ?? 0} /{" "}
                      {achievements.level_progress?.xp_for_next ?? 0} للمستوى التالي
                    </Text>
                  </DailyQuizSurface>

                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                    <StatCard label="النقاط" value={achievements.total_points ?? 0} icon={FaTrophy} color="orange.500" />
                    <StatCard label="العملات" value={achievements.coins ?? 0} icon={FaStar} color="blue.500" />
                    <StatCard label="سلسلة حالية" value={achievements.current_streak ?? 0} icon={FaFire} color="orange.500" />
                    <StatCard label="أطول سلسلة" value={achievements.longest_streak ?? 0} icon={FaFire} color="blue.500" />
                    <StatCard label="مسابقات" value={achievements.total_quizzes ?? 0} />
                    <StatCard label="أفضل ترتيب" value={achievements.best_daily_rank ?? "—"} />
                    <StatCard label="مراكز أولى" value={achievements.total_first_places ?? 0} color="orange.500" />
                    <StatCard label="كامل العلامة" value={achievements.perfect_quizzes ?? 0} color="blue.500" />
                  </SimpleGrid>

                  <Box>
                    <Heading size="sm" color={theme.heading} mb={3}>
                      الميداليات
                    </Heading>
                    <HStack spacing={3}>
                      <DailyQuizMetaChip colorScheme="orange">
                        🥇 ذهب {achievements.medals?.gold ?? 0}
                      </DailyQuizMetaChip>
                      <DailyQuizMetaChip colorScheme="blue">
                        🏆 كؤوس {achievements.medals?.cups ?? 0}
                      </DailyQuizMetaChip>
                    </HStack>
                  </Box>

                  <Box>
                    <Heading size="sm" color={theme.heading} mb={3}>
                      الشارات
                    </Heading>
                    {badges.length === 0 ? (
                      <Text fontSize="sm" color={theme.muted}>
                        لم تحصل على شارات بعد — استمر في المشاركة!
                      </Text>
                    ) : (
                      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                        {badges.map((b) => (
                          <Flex
                            key={b.code}
                            align="center"
                            gap={3}
                            p={3}
                            borderRadius="xl"
                            borderWidth="1px"
                            borderColor={theme.cardBorder}
                            bg={theme.softBg}
                          >
                            <Text fontSize="2xl">{b.icon || "🏅"}</Text>
                            <Box>
                              <Text fontWeight="700" fontSize="sm" color={theme.heading}>
                                {b.title_ar || b.code}
                              </Text>
                              {b.earned_at ? (
                                <Text fontSize="xs" color={theme.muted}>
                                  {new Date(b.earned_at).toLocaleDateString("ar-EG")}
                                </Text>
                              ) : null}
                            </Box>
                          </Flex>
                        ))}
                      </SimpleGrid>
                    )}
                  </Box>
                </VStack>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </DailyQuizSurface>
    </DailyQuizPageShell>
  );
}
