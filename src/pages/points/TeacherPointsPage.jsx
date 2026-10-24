import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Code,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Skeleton,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  FaArchive,
  FaEye,
  FaGift,
  FaHistory,
  FaSync,
  FaTrash,
  FaTrophy,
  FaUndo,
  FaUsers,
} from "react-icons/fa";
import {
  awardManualPoints,
  DEFAULT_POINTS_SETTINGS,
  deleteManualPointsTransaction,
  fetchSeasonStudentTransactions,
  fetchStudentPointTransactions,
  fetchTeacherPointsLeaderboard,
  fetchTeacherPointsSeason,
  fetchTeacherPointsSeasons,
  fetchTeacherPointsSettings,
  pointsApiError,
  RESET_POINTS_CONFIRM,
  RESTORE_POINTS_SEASON_CONFIRM,
  resetTeacherPoints,
  restoreTeacherPointsSeason,
  settingsToPayload,
  updateTeacherPointsSettings,
} from "../../api/teacherPointsApi";
import {
  fetchTeacherGrades,
  fetchTeacherStudyGroups,
} from "../../api/teacherManagedStudentsApi";
import UserType from "../../Hooks/auth/userType";
import {
  DailyQuizHero,
  DailyQuizPageShell,
  DailyQuizSurface,
  useDailyQuizTheme,
} from "../dailyQuiz/DailyQuizChrome";
import PointsSettingsPanel from "./PointsSettingsPanel";
import GradeAnchorsPanel from "./GradeAnchorsPanel";
import {
  eventTypeLabel,
  eventTypeTone,
  formatPointsDate,
  optionId,
  optionLabel,
  rankMedal,
  transactionDetail,
} from "./pointsUtils";

const TABS = [
  { id: "ranking", label: "ترتيب الطلاب" },
  { id: "anchors", label: "امتحان البداية" },
  { id: "seasons", label: "المواسم المؤرشفة" },
  { id: "settings", label: "إعدادات النقاط" },
];

function seasonSourceLabel(source) {
  if (source === "pre_restore_backup") return "نسخة قبل الاسترجاع";
  if (source === "reset") return "تصفير";
  return source || "موسم";
}

function RankBadge({ rank }) {
  const medal = rankMedal(rank);
  const isTop = rank > 0 && rank <= 3;
  return (
    <Flex
      w={9}
      h={9}
      align="center"
      justify="center"
      borderRadius="lg"
      bg={isTop ? medal.bg : "blue.50"}
      color={isTop ? "white" : "blue.600"}
      fontWeight="800"
      fontSize="sm"
      _dark={{ bg: isTop ? medal.bg : "whiteAlpha.100", color: isTop ? "white" : "blue.200" }}
    >
      {rank || "—"}
    </Flex>
  );
}

export default function TeacherPointsPage() {
  const toast = useToast();
  const theme = useDailyQuizTheme();
  const [, isAdmin] = UserType();
  const rewardModal = useDisclosure();
  const historyDrawer = useDisclosure();

  const [tab, setTab] = useState("ranking");
  const [teacherIdInput, setTeacherIdInput] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [grades, setGrades] = useState([]);
  const [groups, setGroups] = useState([]);
  const [gradeId, setGradeId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState({ students: [], total: 0, page: 1, limit: 50 });
  const [settings, setSettings] = useState(DEFAULT_POINTS_SETTINGS);
  const [settingsForm, setSettingsForm] = useState(DEFAULT_POINTS_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [rewardForm, setRewardForm] = useState({ points: 10, reason: "", gradeId: "" });
  const [rewarding, setRewarding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const deleteCancelRef = useRef();
  const resetModal = useDisclosure();
  const seasonDrawer = useDisclosure();
  const restoreModal = useDisclosure();
  const [resetGradeId, setResetGradeId] = useState("");
  const [resetLabel, setResetLabel] = useState("");
  const [resetReason, setResetReason] = useState("");
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [seasons, setSeasons] = useState([]);
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const [seasonDetail, setSeasonDetail] = useState(null);
  const [seasonDetailLoading, setSeasonDetailLoading] = useState(false);
  const [seasonStudentId, setSeasonStudentId] = useState(null);
  const [seasonStudentTx, setSeasonStudentTx] = useState([]);
  const [seasonStudentTxLoading, setSeasonStudentTxLoading] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState("");
  const [restoring, setRestoring] = useState(false);

  const scopedTeacherId = isAdmin ? teacherId : "";
  const resetConfirmReady = resetConfirmText.trim() === RESET_POINTS_CONFIRM;
  const restoreConfirmReady =
    restoreConfirmText.trim() === RESTORE_POINTS_SEASON_CONFIRM;
  const dirtySettings = useMemo(
    () => JSON.stringify(settingsToPayload(settingsForm)) !== JSON.stringify(settingsToPayload(settings)),
    [settings, settingsForm],
  );

  const loadFilters = useCallback(async () => {
    try {
      const [gradeList, groupList] = await Promise.all([
        fetchTeacherGrades().catch(() => []),
        fetchTeacherStudyGroups().catch(() => []),
      ]);
      setGrades(Array.isArray(gradeList) ? gradeList : []);
      setGroups(Array.isArray(groupList) ? groupList : []);
    } catch {
      setGrades([]);
      setGroups([]);
    }
  }, []);

  const loadBoard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTeacherPointsLeaderboard({
        gradeId: gradeId || undefined,
        groupId: groupId || undefined,
        search: search || undefined,
        page,
        limit: 50,
        teacherId: scopedTeacherId || undefined,
      });
      setBoard(data);
    } catch (err) {
      toast({
        title: pointsApiError(err, "فشل تحميل الترتيب"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [gradeId, groupId, search, page, scopedTeacherId, toast]);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const data = await fetchTeacherPointsSettings(scopedTeacherId || undefined);
      setSettings(data);
      setSettingsForm(data);
    } catch (err) {
      toast({
        title: pointsApiError(err, "فشل تحميل الإعدادات"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setSettingsLoading(false);
    }
  }, [scopedTeacherId, toast]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    if (tab === "ranking") loadBoard();
  }, [tab, loadBoard]);

  useEffect(() => {
    if (tab === "settings") loadSettings();
  }, [tab, loadSettings]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const saved = await updateTeacherPointsSettings(
        settingsToPayload(settingsForm),
        scopedTeacherId || undefined,
      );
      setSettings(saved);
      setSettingsForm(saved);
      toast({ title: "تم حفظ إعدادات النقاط", status: "success", isClosable: true });
    } catch (err) {
      toast({
        title: pointsApiError(err, "فشل حفظ الإعدادات"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const openHistory = async (student) => {
    setSelectedStudent(student);
    historyDrawer.onOpen();
    setTxLoading(true);
    try {
      const data = await fetchStudentPointTransactions(student.studentId, {
        gradeId: gradeId || student.gradeId || undefined,
        teacherId: scopedTeacherId || undefined,
      });
      setTransactions(data.transactions);
    } catch (err) {
      setTransactions([]);
      toast({
        title: pointsApiError(err, "فشل تحميل السجل"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setTxLoading(false);
    }
  };

  const openReward = (student) => {
    setSelectedStudent(student);
    setRewardForm({
      points: 10,
      reason: "",
      gradeId: String(gradeId || student?.gradeId || ""),
    });
    rewardModal.onOpen();
  };

  const submitReward = async () => {
    const points = Number(rewardForm.points);
    const reason = rewardForm.reason.trim();
    if (!selectedStudent?.studentId) return;
    if (!Number.isInteger(points) || points <= 0) {
      toast({ title: "النقاط يجب أن تكون رقمًا صحيحًا أكبر من صفر", status: "warning", isClosable: true });
      return;
    }
    if (!reason || reason.length > 500) {
      toast({ title: "سبب المنح مطلوب (1–500 حرف)", status: "warning", isClosable: true });
      return;
    }
    setRewarding(true);
    try {
      const result = await awardManualPoints(
        {
          studentId: selectedStudent.studentId,
          points,
          reason,
          gradeId: rewardForm.gradeId ? Number(rewardForm.gradeId) : undefined,
        },
        scopedTeacherId || undefined,
      );
      toast({
        title: `تم منح ${result.points} نقطة`,
        description: `إجمالي نقاط الطالب الآن ${result.totalPoints}`,
        status: "success",
        isClosable: true,
      });
      rewardModal.onClose();
      loadBoard();
      if (historyDrawer.isOpen) openHistory(selectedStudent);
    } catch (err) {
      toast({
        title: pointsApiError(err, "فشل منح النقاط"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setRewarding(false);
    }
  };

  const confirmDeleteManual = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      const result = await deleteManualPointsTransaction(
        deleteTarget.id,
        scopedTeacherId || undefined,
      );
      toast({
        title: "تم حذف النقاط الممنوحة",
        description: `تم خصم ${result.pointsRemoved} نقطة — رصيد الطالب الآن ${result.totalPoints}`,
        status: "success",
        isClosable: true,
      });
      setDeleteTarget(null);
      setTransactions((prev) => prev.filter((tx) => tx.id !== deleteTarget.id));
      loadBoard();
    } catch (err) {
      toast({
        title: pointsApiError(err, "فشل حذف النقاط الممنوحة"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setDeleting(false);
    }
  };

  const loadSeasons = useCallback(async () => {
    setSeasonsLoading(true);
    try {
      const list = await fetchTeacherPointsSeasons({
        gradeId: gradeId || undefined,
        teacherId: scopedTeacherId || undefined,
        limit: 50,
      });
      setSeasons(list);
    } catch (err) {
      setSeasons([]);
      toast({
        title: pointsApiError(err, "فشل تحميل المواسم"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setSeasonsLoading(false);
    }
  }, [gradeId, scopedTeacherId, toast]);

  useEffect(() => {
    if (tab === "seasons") loadSeasons();
  }, [tab, loadSeasons]);

  const openResetModal = () => {
    setResetGradeId(gradeId || "");
    setResetLabel("");
    setResetReason("");
    setResetConfirmText("");
    resetModal.onOpen();
  };

  const submitResetPoints = async () => {
    if (!resetConfirmReady) {
      toast({
        title: `اكتب ${RESET_POINTS_CONFIRM} للتأكيد`,
        status: "warning",
        isClosable: true,
      });
      return;
    }
    setResetting(true);
    try {
      const result = await resetTeacherPoints({
        gradeId: resetGradeId || undefined,
        teacherId: scopedTeacherId || undefined,
        label: resetLabel || undefined,
        reason: resetReason || undefined,
      });
      toast({
        title: result.message,
        description: result.seasonId
          ? `تم حفظ الموسم #${result.seasonId} — ${result.balancesCleared} رصيد و${result.transactionsDeleted} معاملة`
          : `تم مسح ${result.balancesCleared} رصيد و${result.transactionsDeleted} معاملة`,
        status: "success",
        isClosable: true,
      });
      resetModal.onClose();
      setResetConfirmText("");
      setResetLabel("");
      setResetReason("");
      setTransactions([]);
      historyDrawer.onClose();
      setPage(1);
      loadBoard();
      if (tab === "seasons") loadSeasons();
    } catch (err) {
      toast({
        title: pointsApiError(err, "فشل تصفير النقاط"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setResetting(false);
    }
  };

  const openSeasonDetail = async (season) => {
    if (!season?.id) return;
    seasonDrawer.onOpen();
    setSeasonDetailLoading(true);
    setSeasonDetail(null);
    setSeasonStudentId(null);
    setSeasonStudentTx([]);
    try {
      const detail = await fetchTeacherPointsSeason(season.id, {
        includeBalances: true,
        teacherId: scopedTeacherId || undefined,
      });
      setSeasonDetail(detail);
    } catch (err) {
      toast({
        title: pointsApiError(err, "فشل تحميل تفاصيل الموسم"),
        status: "error",
        isClosable: true,
      });
      seasonDrawer.onClose();
    } finally {
      setSeasonDetailLoading(false);
    }
  };

  const toggleSeasonStudentHistory = async (row) => {
    const studentId = row?.studentId;
    const seasonId = seasonDetail?.season?.id;
    if (!studentId || !seasonId) return;

    if (seasonStudentId === studentId) {
      setSeasonStudentId(null);
      setSeasonStudentTx([]);
      return;
    }

    setSeasonStudentId(studentId);
    setSeasonStudentTx([]);
    setSeasonStudentTxLoading(true);
    try {
      const data = await fetchSeasonStudentTransactions(seasonId, studentId, {
        teacherId: scopedTeacherId || undefined,
        limit: 200,
      });
      setSeasonStudentTx(data.transactions);
    } catch (err) {
      setSeasonStudentTx([]);
      toast({
        title: pointsApiError(err, "فشل تحميل سجل الطالب"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setSeasonStudentTxLoading(false);
    }
  };

  const openRestoreModal = (season) => {
    setRestoreTarget(season);
    setRestoreConfirmText("");
    restoreModal.onOpen();
  };

  const submitRestoreSeason = async () => {
    if (!restoreTarget?.id || !restoreConfirmReady) {
      toast({
        title: `اكتب ${RESTORE_POINTS_SEASON_CONFIRM} للتأكيد`,
        status: "warning",
        isClosable: true,
      });
      return;
    }
    setRestoring(true);
    try {
      const result = await restoreTeacherPointsSeason(
        restoreTarget.id,
        scopedTeacherId || undefined,
      );
      toast({
        title: result.message,
        description: result.backupSeasonId
          ? `نُسخت النقاط الحالية كموسم #${result.backupSeasonId}`
          : `تمت استعادة ${result.balancesRestored} رصيد`,
        status: "success",
        isClosable: true,
      });
      restoreModal.onClose();
      setRestoreTarget(null);
      setRestoreConfirmText("");
      seasonDrawer.onClose();
      setPage(1);
      loadBoard();
      loadSeasons();
      setTab("ranking");
    } catch (err) {
      toast({
        title: pointsApiError(err, "فشل استرجاع الموسم"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setRestoring(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil((board.total || 0) / (board.limit || 50)));
  const resetGradeLabel = resetGradeId
    ? optionLabel(
        grades.find((g) => String(optionId(g)) === String(resetGradeId)),
        `صف ${resetGradeId}`,
      )
    : "كل الصفوف";

  return (
    <DailyQuizPageShell>
      <DailyQuizHero
        icon={FaTrophy}
        eyebrow="Points & Ranking"
        title="النقاط والترتيب"
        subtitle="رصيد كل طالب داخل صفك. عيّن امتحان بداية لكل صف، والتصفير يحفظ موسمًا قابلًا للاسترجاع."
        actions={
          <Button
            leftIcon={<FaSync />}
            variant="outline"
            borderColor="whiteAlpha.400"
            color="white"
            borderRadius="xl"
            _hover={{ bg: "whiteAlpha.200" }}
            onClick={() =>
              tab === "settings"
                ? loadSettings()
                : tab === "seasons"
                  ? loadSeasons()
                  : tab === "anchors"
                    ? undefined
                    : loadBoard()
            }
            isLoading={
              tab === "settings"
                ? settingsLoading
                : tab === "seasons"
                  ? seasonsLoading
                  : tab === "anchors"
                    ? false
                    : loading
            }
            isDisabled={tab === "anchors"}
          >
            تحديث
          </Button>
        }
      />

      {isAdmin ? (
        <DailyQuizSurface mb={4} p={4}>
          <FormControl maxW="280px">
            <FormLabel fontSize="sm" fontWeight="700">
              معرف المدرس (للأدمن)
            </FormLabel>
            <Input
              value={teacherIdInput}
              onChange={(e) => setTeacherIdInput(e.target.value)}
              onBlur={() => setTeacherId(teacherIdInput.trim())}
              onKeyDown={(e) => {
                if (e.key === "Enter") setTeacherId(teacherIdInput.trim());
              }}
              placeholder="teacherId"
              borderRadius="xl"
              dir="ltr"
            />
          </FormControl>
        </DailyQuizSurface>
      ) : null}

      <HStack spacing={2} mb={4}>
        {TABS.map((item) => (
          <Button
            key={item.id}
            onClick={() => setTab(item.id)}
            borderRadius="xl"
            fontWeight="800"
            bg={tab === item.id ? "blue.500" : "white"}
            color={tab === item.id ? "white" : "slate.600"}
            borderWidth="1px"
            borderColor={tab === item.id ? "blue.500" : "blackAlpha.100"}
            _hover={{ bg: tab === item.id ? "blue.600" : "blue.50" }}
            _dark={{
              bg: tab === item.id ? "blue.500" : "gray.800",
              color: tab === item.id ? "white" : "gray.200",
            }}
          >
            {item.label}
          </Button>
        ))}
      </HStack>

      {tab === "settings" ? (
        <DailyQuizSurface p={{ base: 4, md: 5 }}>
          {settingsLoading ? (
            <VStack align="stretch" spacing={3}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} h="88px" borderRadius="2xl" />
              ))}
            </VStack>
          ) : (
            <PointsSettingsPanel
              form={settingsForm}
              onChange={setSettingsForm}
              onSave={saveSettings}
              saving={saving}
              dirty={dirtySettings}
            />
          )}
        </DailyQuizSurface>
      ) : tab === "anchors" ? (
        <DailyQuizSurface p={{ base: 4, md: 5 }}>
          <GradeAnchorsPanel
            grades={grades}
            teacherId={scopedTeacherId || undefined}
            onChanged={() => {
              loadBoard();
              loadSeasons();
            }}
          />
        </DailyQuizSurface>
      ) : tab === "seasons" ? (
        <>
          <DailyQuizSurface mb={4} p={3}>
            <Flex gap={3} wrap="wrap" align="center">
              <Select
                maxW="220px"
                borderRadius="xl"
                value={gradeId}
                onChange={(e) => setGradeId(e.target.value)}
              >
                <option value="">كل الصفوف</option>
                {grades.map((grade) => (
                  <option key={optionId(grade)} value={optionId(grade)}>
                    {optionLabel(grade, "صف")}
                  </option>
                ))}
              </Select>
              <Text fontSize="sm" color={theme.muted} flex="1">
                كل تصفير يحفظ موسمًا يمكنك استرجاعه لاحقًا.
              </Text>
              <Button
                colorScheme="red"
                variant="outline"
                borderRadius="xl"
                leftIcon={<FaUndo />}
                onClick={openResetModal}
              >
                تصفير + أرشفة
              </Button>
            </Flex>
          </DailyQuizSurface>

          <DailyQuizSurface overflow="hidden">
            <Flex
              px={4}
              py={3}
              justify="space-between"
              align="center"
              borderBottomWidth="1px"
              borderColor={theme.cardBorder}
            >
              <HStack>
                <Icon as={FaArchive} color="blue.500" />
                <Text fontWeight="800" color={theme.heading}>
                  {seasons.length} موسم مؤرشف
                </Text>
              </HStack>
            </Flex>

            {seasonsLoading ? (
              <VStack p={4} spacing={3} align="stretch">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} h="72px" borderRadius="xl" />
                ))}
              </VStack>
            ) : seasons.length === 0 ? (
              <Box p={10} textAlign="center">
                <Text color={theme.muted}>
                  لا توجد مواسم بعد. عند تصفير النقاط يُحفظ السجل هنا تلقائيًا.
                </Text>
              </Box>
            ) : (
              seasons.map((season) => {
                const gradeLabel = season.gradeId
                  ? optionLabel(
                      grades.find((g) => String(optionId(g)) === String(season.gradeId)),
                      `صف ${season.gradeId}`,
                    )
                  : "كل الصفوف";
                return (
                  <Box
                    key={season.id}
                    px={{ base: 3, md: 4 }}
                    py={3}
                    borderBottomWidth="1px"
                    borderColor={theme.cardBorder}
                  >
                    <Flex
                      direction={{ base: "column", md: "row" }}
                      align={{ base: "stretch", md: "center" }}
                      gap={3}
                      justify="space-between"
                    >
                      <Box minW={0}>
                        <HStack spacing={2} mb={1} flexWrap="wrap">
                          <Text fontWeight="800" color={theme.heading}>
                            {season.label || `موسم #${season.id}`}
                          </Text>
                          <Badge colorScheme="purple" borderRadius="md">
                            {seasonSourceLabel(season.source)}
                          </Badge>
                          <Badge colorScheme="blue" variant="subtle" borderRadius="md">
                            {gradeLabel}
                          </Badge>
                        </HStack>
                        <Text fontSize="sm" color={theme.muted}>
                          {formatPointsDate(season.archivedAt)} — {season.studentsCount} طالب —{" "}
                          {season.totalPointsSum} نقطة — {season.transactionsCount} معاملة
                        </Text>
                        {season.reason ? (
                          <Text fontSize="xs" color={theme.muted} mt={1}>
                            السبب: {season.reason}
                          </Text>
                        ) : null}
                      </Box>
                      <HStack spacing={2} flexShrink={0}>
                        <Button
                          size="sm"
                          borderRadius="xl"
                          leftIcon={<FaEye />}
                          variant="outline"
                          onClick={() => openSeasonDetail(season)}
                        >
                          التفاصيل
                        </Button>
                        <Button
                          size="sm"
                          borderRadius="xl"
                          colorScheme="orange"
                          leftIcon={<FaUndo />}
                          onClick={() => openRestoreModal(season)}
                        >
                          استرجاع
                        </Button>
                      </HStack>
                    </Flex>
                  </Box>
                );
              })
            )}
          </DailyQuizSurface>
        </>
      ) : (
        <>
          <DailyQuizSurface mb={4} p={3}>
            <Flex gap={3} wrap="wrap" align="center">
              <Select
                maxW="220px"
                borderRadius="xl"
                value={gradeId}
                onChange={(e) => {
                  setPage(1);
                  setGradeId(e.target.value);
                }}
              >
                <option value="">كل الصفوف</option>
                {grades.map((grade) => (
                  <option key={optionId(grade)} value={optionId(grade)}>
                    {optionLabel(grade, "صف")}
                  </option>
                ))}
              </Select>
              <Select
                maxW="220px"
                borderRadius="xl"
                value={groupId}
                onChange={(e) => {
                  setPage(1);
                  setGroupId(e.target.value);
                }}
              >
                <option value="">كل المجموعات</option>
                {groups.map((group) => (
                  <option key={optionId(group)} value={optionId(group)}>
                    {optionLabel(group, "مجموعة")}
                  </option>
                ))}
              </Select>
              <Input
                maxW="280px"
                borderRadius="xl"
                placeholder="بحث بالاسم أو الإيميل أو الهاتف"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <Button
                colorScheme="red"
                variant="outline"
                borderRadius="xl"
                leftIcon={<FaUndo />}
                onClick={openResetModal}
                ml="auto"
              >
                تصفير + أرشفة
              </Button>
            </Flex>
          </DailyQuizSurface>

          <DailyQuizSurface overflow="hidden">
            <Flex
              px={4}
              py={3}
              justify="space-between"
              align="center"
              borderBottomWidth="1px"
              borderColor={theme.cardBorder}
            >
              <HStack>
                <Icon as={FaUsers} color="blue.500" />
                <Text fontWeight="800" color={theme.heading}>
                  {board.total} طالب حصلوا على نقاط
                </Text>
              </HStack>
              <Text fontSize="sm" color={theme.muted}>
                الصفحة {board.page} من {totalPages}
              </Text>
            </Flex>

            {loading ? (
              <VStack p={4} spacing={3} align="stretch">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} h="64px" borderRadius="xl" />
                ))}
              </VStack>
            ) : board.students.length === 0 ? (
              <Box p={10} textAlign="center">
                <Text color={theme.muted}>
                  لا يوجد طلاب في الترتيب بعد. يظهر هنا من حصل على نقاط مرة واحدة على الأقل.
                </Text>
              </Box>
            ) : (
              board.students.map((student) => {
                const groupLabel = student.groupName || student.courseGroup?.name || "";
                const gradeLabel =
                  student.gradeName || (student.gradeId ? `صف ${student.gradeId}` : "");
                return (
                  <Box
                    key={`${student.studentId}-${student.rank}`}
                    px={{ base: 3, md: 4 }}
                    py={3}
                    borderBottomWidth="1px"
                    borderColor={theme.cardBorder}
                    _hover={{ bg: "blue.50" }}
                    _dark={{ _hover: { bg: "whiteAlpha.50" } }}
                  >
                    <Flex
                      direction={{ base: "column", md: "row" }}
                      align={{ base: "stretch", md: "center" }}
                      gap={{ base: 3, md: 3 }}
                    >
                      <Flex align="start" gap={3} minW={0} flex="1">
                        <RankBadge rank={student.rank} />
                        <Avatar
                          size="sm"
                          name={student.name}
                          src={student.avatar || undefined}
                          flexShrink={0}
                        />
                        <Box flex="1" minW={0}>
                          <Text
                            fontWeight="800"
                            fontSize="sm"
                            color={theme.heading}
                            whiteSpace="normal"
                            wordBreak="break-word"
                          >
                            {student.name}
                          </Text>
                          <VStack align="start" spacing={1} mt={1}>
                            {gradeLabel ? (
                              <Text fontSize="xs" color={theme.muted} whiteSpace="normal">
                                {gradeLabel}
                              </Text>
                            ) : null}
                            {groupLabel ? (
                              <Badge
                                colorScheme="cyan"
                                variant="subtle"
                                borderRadius="md"
                                fontSize="10px"
                                whiteSpace="normal"
                                wordBreak="break-word"
                                lineHeight="1.5"
                                px={2}
                                py={0.5}
                                maxW="100%"
                              >
                                {groupLabel}
                              </Badge>
                            ) : null}
                            {student.email ? (
                              <Text
                                fontSize="xs"
                                color={theme.muted}
                                whiteSpace="normal"
                                wordBreak="break-word"
                              >
                                {student.email}
                              </Text>
                            ) : null}
                          </VStack>
                        </Box>
                        <Text
                          fontWeight="900"
                          color="orange.500"
                          fontSize={{ base: "md", md: "md" }}
                          flexShrink={0}
                          display={{ base: "block", md: "none" }}
                        >
                          {student.points}
                        </Text>
                      </Flex>

                      <Flex
                        align="center"
                        justify={{ base: "space-between", md: "flex-end" }}
                        gap={2}
                        wrap="wrap"
                        ps={{ base: 0, md: 0 }}
                      >
                        <Text
                          fontWeight="900"
                          color="orange.500"
                          minW={{ md: "72px" }}
                          textAlign="left"
                          display={{ base: "none", md: "block" }}
                        >
                          {student.points}
                        </Text>
                        <HStack spacing={1} w={{ base: "full", md: "auto" }}>
                          <Button
                            size="sm"
                            variant="ghost"
                            borderRadius="lg"
                            flex={{ base: 1, md: "initial" }}
                            onClick={() => openHistory(student)}
                            leftIcon={<FaHistory />}
                          >
                            السجل
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="orange"
                            variant="outline"
                            borderRadius="lg"
                            flex={{ base: 1, md: "initial" }}
                            onClick={() => openReward(student)}
                            leftIcon={<FaGift />}
                          >
                            منح
                          </Button>
                        </HStack>
                      </Flex>
                    </Flex>
                  </Box>
                );
              })
            )}

            {totalPages > 1 ? (
              <Flex justify="center" gap={2} p={4}>
                <Button
                  size="sm"
                  borderRadius="lg"
                  isDisabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  السابق
                </Button>
                <Button
                  size="sm"
                  borderRadius="lg"
                  isDisabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  التالي
                </Button>
              </Flex>
            ) : null}
          </DailyQuizSurface>
        </>
      )}

      <Drawer isOpen={historyDrawer.isOpen} placement="left" size="md" onClose={historyDrawer.onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            سجل نقاط {selectedStudent?.name || ""}
          </DrawerHeader>
          <DrawerBody py={4}>
            <Button
              mb={4}
              w="full"
              colorScheme="orange"
              borderRadius="xl"
              leftIcon={<FaGift />}
              onClick={() => selectedStudent && openReward(selectedStudent)}
            >
              منح نقاط يدوية
            </Button>
            {txLoading ? (
              <VStack align="stretch" spacing={3}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} h="72px" borderRadius="xl" />
                ))}
              </VStack>
            ) : transactions.length === 0 ? (
              <Text color={theme.muted} textAlign="center" py={8}>
                لا توجد معاملات بعد.
              </Text>
            ) : (
              <VStack align="stretch" spacing={3}>
                {transactions.map((tx) => {
                  const isManual = tx.eventType === "MANUAL_REWARD";
                  return (
                    <Box
                      key={tx.id}
                      p={3}
                      borderWidth="1px"
                      borderRadius="xl"
                      borderColor={theme.cardBorder}
                    >
                      <Flex justify="space-between" align="start" gap={3}>
                        <Box minW={0} flex="1">
                          <HStack spacing={2} flexWrap="wrap">
                            <Badge colorScheme={eventTypeTone(tx.eventType)} borderRadius="full">
                              {eventTypeLabel(tx.eventType)}
                            </Badge>
                            {isManual ? (
                              <Badge colorScheme="red" variant="subtle" borderRadius="full">
                                قابل للحذف
                              </Badge>
                            ) : null}
                          </HStack>
                          {transactionDetail(tx) ? (
                            <Text mt={1} fontSize="sm" fontWeight="700" noOfLines={2}>
                              {transactionDetail(tx)}
                            </Text>
                          ) : null}
                          <Text mt={1} fontSize="xs" color={theme.muted}>
                            {formatPointsDate(tx.createdAt)}
                          </Text>
                        </Box>
                        <VStack spacing={2} align="end" flexShrink={0}>
                          <Text fontWeight="900" color="orange.500">
                            +{tx.points}
                          </Text>
                          {isManual ? (
                            <IconButton
                              aria-label="حذف المنح اليدوي"
                              icon={<FaTrash />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              borderRadius="lg"
                              onClick={() => setDeleteTarget(tx)}
                            />
                          ) : null}
                        </VStack>
                      </Flex>
                    </Box>
                  );
                })}
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Modal isOpen={rewardModal.isOpen} onClose={rewardModal.onClose} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="2xl" mx={3}>
          <ModalHeader>منح نقاط لـ {selectedStudent?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <FormControl isRequired>
                <FormLabel>عدد النقاط</FormLabel>
                <Input
                  type="number"
                  min={1}
                  value={rewardForm.points}
                  onChange={(e) => setRewardForm((f) => ({ ...f, points: e.target.value }))}
                  borderRadius="xl"
                />
              </FormControl>
              <FormControl>
                <FormLabel>الصف (اختياري)</FormLabel>
                <Select
                  value={rewardForm.gradeId}
                  onChange={(e) => setRewardForm((f) => ({ ...f, gradeId: e.target.value }))}
                  borderRadius="xl"
                >
                  <option value="">استنتاج تلقائي</option>
                  {grades.map((grade) => (
                    <option key={optionId(grade)} value={optionId(grade)}>
                      {optionLabel(grade, "صف")}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>سبب المنح</FormLabel>
                <Textarea
                  value={rewardForm.reason}
                  maxLength={500}
                  onChange={(e) => setRewardForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="مثال: مشاركة ممتازة في الحصة"
                  borderRadius="xl"
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={2} onClick={rewardModal.onClose}>
              إلغاء
            </Button>
            <Button colorScheme="orange" onClick={submitReward} isLoading={rewarding} borderRadius="xl">
              منح النقاط
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={Boolean(deleteTarget)}
        leastDestructiveRef={deleteCancelRef}
        onClose={() => !deleting && setDeleteTarget(null)}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="2xl" mx={3} dir="rtl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              حذف النقاط الممنوحة
            </AlertDialogHeader>
            <AlertDialogBody lineHeight="1.9">
              سيتم حذف منح «{transactionDetail(deleteTarget) || "مكافأة يدوية"}» وخصم{" "}
              {deleteTarget?.points || 0} نقطة من رصيد {selectedStudent?.name || "الطالب"}. هذا
              الإجراء يعمل على المنح اليدوي فقط.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={deleteCancelRef}
                onClick={() => setDeleteTarget(null)}
                borderRadius="xl"
                isDisabled={deleting}
              >
                إلغاء
              </Button>
              <Button
                colorScheme="red"
                mr={3}
                onClick={confirmDeleteManual}
                isLoading={deleting}
                borderRadius="xl"
                leftIcon={<FaTrash />}
              >
                حذف النقاط
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <Modal
        isOpen={resetModal.isOpen}
        onClose={() => !resetting && resetModal.onClose()}
        isCentered
      >
        <ModalOverlay />
        <ModalContent borderRadius="2xl" mx={3} dir="rtl">
          <ModalHeader>تصفير النقاط مع حفظ الموسم</ModalHeader>
          <ModalCloseButton isDisabled={resetting} />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Alert status="info" borderRadius="xl">
                <AlertIcon />
                <Text fontSize="sm" lineHeight="1.8">
                  سيتم حفظ أرصدة ومعاملات «{resetGradeLabel}» كموسم أرشيفي، ثم تصفير
                  النقاط الحية. الطلاب يبدأون من صفر ويمكنك استرجاع الموسم لاحقًا من
                  تبويب المواسم.
                </Text>
              </Alert>
              <FormControl>
                <FormLabel>النطاق</FormLabel>
                <Select
                  value={resetGradeId}
                  onChange={(e) => setResetGradeId(e.target.value)}
                  borderRadius="xl"
                  isDisabled={resetting}
                >
                  <option value="">كل الصفوف</option>
                  {grades.map((grade) => (
                    <option key={optionId(grade)} value={optionId(grade)}>
                      {optionLabel(grade, "صف")}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>اسم الموسم (اختياري)</FormLabel>
                <Input
                  value={resetLabel}
                  onChange={(e) => setResetLabel(e.target.value)}
                  placeholder="مثال: ترم أول 2026"
                  borderRadius="xl"
                  isDisabled={resetting}
                />
              </FormControl>
              <FormControl>
                <FormLabel>السبب (اختياري)</FormLabel>
                <Textarea
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  placeholder="بداية ترم جديد"
                  borderRadius="xl"
                  rows={2}
                  isDisabled={resetting}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>
                  للتأكيد اكتب{" "}
                  <Code dir="ltr" fontSize="sm">
                    {RESET_POINTS_CONFIRM}
                  </Code>
                </FormLabel>
                <Input
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder={RESET_POINTS_CONFIRM}
                  borderRadius="xl"
                  dir="ltr"
                  fontFamily="mono"
                  isDisabled={resetting}
                  autoComplete="off"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={2}
              onClick={resetModal.onClose}
              isDisabled={resetting}
              borderRadius="xl"
            >
              إلغاء
            </Button>
            <Button
              colorScheme="red"
              onClick={submitResetPoints}
              isLoading={resetting}
              isDisabled={!resetConfirmReady}
              borderRadius="xl"
              leftIcon={<FaArchive />}
            >
              تصفير وأرشفة
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={restoreModal.isOpen}
        onClose={() => !restoring && restoreModal.onClose()}
        isCentered
      >
        <ModalOverlay />
        <ModalContent borderRadius="2xl" mx={3} dir="rtl">
          <ModalHeader>استرجاع موسم النقاط</ModalHeader>
          <ModalCloseButton isDisabled={restoring} />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Alert status="warning" borderRadius="xl">
                <AlertIcon />
                <Text fontSize="sm" lineHeight="1.8">
                  سيتم استبدال النقاط الحالية بموسم «
                  {restoreTarget?.label || `#${restoreTarget?.id || ""}`}». النقاط
                  الحالية تُحفظ تلقائيًا كنسخة احتياطية قبل الاستبدال.
                </Text>
              </Alert>
              <FormControl isRequired>
                <FormLabel>
                  للتأكيد اكتب{" "}
                  <Code dir="ltr" fontSize="sm">
                    {RESTORE_POINTS_SEASON_CONFIRM}
                  </Code>
                </FormLabel>
                <Input
                  value={restoreConfirmText}
                  onChange={(e) => setRestoreConfirmText(e.target.value)}
                  placeholder={RESTORE_POINTS_SEASON_CONFIRM}
                  borderRadius="xl"
                  dir="ltr"
                  fontFamily="mono"
                  isDisabled={restoring}
                  autoComplete="off"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={2}
              onClick={restoreModal.onClose}
              isDisabled={restoring}
              borderRadius="xl"
            >
              إلغاء
            </Button>
            <Button
              colorScheme="orange"
              onClick={submitRestoreSeason}
              isLoading={restoring}
              isDisabled={!restoreConfirmReady}
              borderRadius="xl"
              leftIcon={<FaUndo />}
            >
              استرجاع الموسم
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Drawer
        isOpen={seasonDrawer.isOpen}
        onClose={seasonDrawer.onClose}
        placement="left"
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent dir="rtl">
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            {seasonDetail?.season?.label ||
              (seasonDetail?.season?.id
                ? `موسم #${seasonDetail.season.id}`
                : "تفاصيل الموسم")}
          </DrawerHeader>
          <DrawerBody>
            {seasonDetailLoading ? (
              <VStack spacing={3} align="stretch" pt={2}>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} h="56px" borderRadius="xl" />
                ))}
              </VStack>
            ) : seasonDetail?.season ? (
              <VStack align="stretch" spacing={4} pt={2}>
                <DailyQuizSurface p={3}>
                  <Text fontSize="sm" color={theme.muted} mb={1}>
                    {formatPointsDate(seasonDetail.season.archivedAt)}
                  </Text>
                  <Text fontWeight="800" mb={1}>
                    {seasonDetail.season.studentsCount} طالب —{" "}
                    {seasonDetail.season.totalPointsSum} نقطة
                  </Text>
                  <HStack spacing={2} flexWrap="wrap">
                    <Badge colorScheme="purple" borderRadius="md">
                      {seasonSourceLabel(seasonDetail.season.source)}
                    </Badge>
                    {seasonDetail.season.reason ? (
                      <Text fontSize="xs" color={theme.muted}>
                        {seasonDetail.season.reason}
                      </Text>
                    ) : null}
                  </HStack>
                </DailyQuizSurface>
                <Button
                  colorScheme="orange"
                  borderRadius="xl"
                  leftIcon={<FaUndo />}
                  onClick={() => openRestoreModal(seasonDetail.season)}
                >
                  استرجاع هذا الموسم
                </Button>
                <Text fontWeight="800" color={theme.heading}>
                  أرصدة الطلاب
                </Text>
                <Text fontSize="xs" color={theme.muted} mt={-2}>
                  اضغط على طالب لعرض سجل نقاطه في هذا الموسم
                </Text>
                {(seasonDetail.balances || []).length === 0 ? (
                  <Text fontSize="sm" color={theme.muted}>
                    لا توجد أرصدة محفوظة في هذا الموسم.
                  </Text>
                ) : (
                  seasonDetail.balances.map((row) => {
                    const isOpen = seasonStudentId === row.studentId;
                    return (
                      <Box
                        key={`${row.studentId}-${row.gradeId}`}
                        borderWidth="1px"
                        borderColor={
                          isOpen ? "orange.300" : theme.cardBorder
                        }
                        borderRadius="xl"
                        overflow="hidden"
                      >
                        <Flex
                          as="button"
                          type="button"
                          w="full"
                          justify="space-between"
                          align="center"
                          p={3}
                          textAlign="start"
                          cursor="pointer"
                          bg={isOpen ? "orange.50" : "transparent"}
                          _dark={{
                            bg: isOpen ? "whiteAlpha.100" : "transparent",
                          }}
                          onClick={() => toggleSeasonStudentHistory(row)}
                        >
                          <HStack spacing={3} minW={0} flex="1">
                            <Icon
                              as={FaHistory}
                              color={isOpen ? "orange.500" : theme.muted}
                              flexShrink={0}
                            />
                            <Box minW={0}>
                              <Text fontWeight="700" noOfLines={1}>
                                {row.studentName}
                              </Text>
                              {row.studentPhone ? (
                                <Text
                                  fontSize="xs"
                                  color={theme.muted}
                                  dir="ltr"
                                >
                                  {row.studentPhone}
                                </Text>
                              ) : null}
                            </Box>
                          </HStack>
                          <Text fontWeight="900" color="orange.500" flexShrink={0}>
                            {row.totalPoints}
                          </Text>
                        </Flex>
                        {isOpen ? (
                          <Box
                            px={3}
                            pb={3}
                            borderTopWidth="1px"
                            borderColor={theme.cardBorder}
                          >
                            {seasonStudentTxLoading ? (
                              <VStack align="stretch" spacing={2} pt={3}>
                                {[1, 2, 3].map((i) => (
                                  <Skeleton
                                    key={i}
                                    h="56px"
                                    borderRadius="lg"
                                  />
                                ))}
                              </VStack>
                            ) : seasonStudentTx.length === 0 ? (
                              <Text
                                fontSize="sm"
                                color={theme.muted}
                                textAlign="center"
                                py={4}
                              >
                                لا يوجد سجل معاملات لهذا الطالب في الموسم.
                              </Text>
                            ) : (
                              <VStack align="stretch" spacing={2} pt={3}>
                                {seasonStudentTx.map((tx) => (
                                  <Box
                                    key={tx.id}
                                    p={2.5}
                                    borderWidth="1px"
                                    borderRadius="lg"
                                    borderColor={theme.cardBorder}
                                    bg={theme.pageBg}
                                  >
                                    <Flex
                                      justify="space-between"
                                      align="start"
                                      gap={2}
                                    >
                                      <Box minW={0} flex="1">
                                        <Badge
                                          colorScheme={eventTypeTone(
                                            tx.eventType,
                                          )}
                                          borderRadius="full"
                                          fontSize="0.65rem"
                                        >
                                          {eventTypeLabel(tx.eventType)}
                                        </Badge>
                                        {transactionDetail(tx) ? (
                                          <Text
                                            mt={1}
                                            fontSize="xs"
                                            fontWeight="700"
                                            noOfLines={2}
                                          >
                                            {transactionDetail(tx)}
                                          </Text>
                                        ) : null}
                                        <Text
                                          mt={0.5}
                                          fontSize="xs"
                                          color={theme.muted}
                                        >
                                          {formatPointsDate(tx.createdAt)}
                                        </Text>
                                      </Box>
                                      <Text
                                        fontWeight="900"
                                        color="orange.500"
                                        fontSize="sm"
                                        flexShrink={0}
                                      >
                                        +{tx.points}
                                      </Text>
                                    </Flex>
                                  </Box>
                                ))}
                              </VStack>
                            )}
                          </Box>
                        ) : null}
                      </Box>
                    );
                  })
                )}
              </VStack>
            ) : null}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </DailyQuizPageShell>
  );
}
