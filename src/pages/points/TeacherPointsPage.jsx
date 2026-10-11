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
  fetchStudentPointTransactions,
  fetchTeacherPointsLeaderboard,
  fetchTeacherPointsSettings,
  pointsApiError,
  RESET_POINTS_CONFIRM,
  resetTeacherPoints,
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
  { id: "settings", label: "إعدادات النقاط" },
];

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
  const [resetGradeId, setResetGradeId] = useState("");
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);

  const scopedTeacherId = isAdmin ? teacherId : "";
  const resetConfirmReady = resetConfirmText.trim() === RESET_POINTS_CONFIRM;
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

  const openResetModal = () => {
    setResetGradeId(gradeId || "");
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
      });
      toast({
        title: result.message,
        description: `تم مسح ${result.balancesCleared} رصيد و${result.transactionsDeleted} معاملة`,
        status: "success",
        isClosable: true,
      });
      resetModal.onClose();
      setResetConfirmText("");
      setTransactions([]);
      historyDrawer.onClose();
      setPage(1);
      loadBoard();
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
        subtitle="رصيد كل طالب داخل صفك فقط. عدّل كيف تُمنح النقاط، وتابع الترتيب، وامنح مكافأة يدوية عند الحاجة."
        actions={
          <Button
            leftIcon={<FaSync />}
            variant="outline"
            borderColor="whiteAlpha.400"
            color="white"
            borderRadius="xl"
            _hover={{ bg: "whiteAlpha.200" }}
            onClick={() => (tab === "settings" ? loadSettings() : loadBoard())}
            isLoading={tab === "settings" ? settingsLoading : loading}
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
                تصفير النقاط
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
          <ModalHeader>تصفير نقاط الطلاب</ModalHeader>
          <ModalCloseButton isDisabled={resetting} />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Alert status="warning" borderRadius="xl">
                <AlertIcon />
                <Text fontSize="sm" lineHeight="1.8">
                  سيتم تصفير أرصدة الطلاب ومسح سجل النقاط لنطاق «{resetGradeLabel}». بعدها
                  يقدروا يجمعوا من جديد (امتحان / فيديو / منح يدوي…). لا يمكن التراجع.
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
              leftIcon={<FaUndo />}
            >
              تصفير النقاط
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </DailyQuizPageShell>
  );
}
