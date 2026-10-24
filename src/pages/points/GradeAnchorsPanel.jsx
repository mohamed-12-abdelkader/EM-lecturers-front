import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Code,
  Flex,
  FormControl,
  FormLabel,
  HStack,
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
import { FaFlagCheckered, FaRedo, FaSave, FaSync } from "react-icons/fa";
import {
  consolidateLegacyExamPoints,
  CONSOLIDATE_EXAM_POINTS_CONFIRM,
  fetchTeacherGradePointsAnchor,
  fetchTeacherGradePointsAnchors,
  pointsApiError,
  RESET_AND_REBUILD_LAST_EXAM_CONFIRM,
  RESET_AND_START_FROM_EXAM_CONFIRM,
  resetAndRebuildLastExam,
  resetAndStartFromExam,
  setTeacherGradePointsAnchor,
} from "../../api/teacherPointsApi";
import { formatPointsDate, optionId, optionLabel } from "./pointsUtils";
import { useDailyQuizTheme } from "../dailyQuiz/DailyQuizChrome";

export default function GradeAnchorsPanel({
  grades = [],
  teacherId,
  onChanged,
}) {
  const toast = useToast();
  const theme = useDailyQuizTheme();
  const startModal = useDisclosure();
  const rebuildModal = useDisclosure();
  const consolidateModal = useDisclosure();

  const [listLoading, setListLoading] = useState(true);
  const [anchors, setAnchors] = useState([]);
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [savingAnchor, setSavingAnchor] = useState(false);

  const [startLabel, setStartLabel] = useState("");
  const [startReason, setStartReason] = useState("");
  const [startConfirm, setStartConfirm] = useState("");
  const [starting, setStarting] = useState(false);

  const [rebuildGradeId, setRebuildGradeId] = useState("");
  const [rebuildLabel, setRebuildLabel] = useState("");
  const [rebuildReason, setRebuildReason] = useState("");
  const [rebuildConfirm, setRebuildConfirm] = useState("");
  const [rebuilding, setRebuilding] = useState(false);

  const [consolidateConfirm, setConsolidateConfirm] = useState("");
  const [consolidating, setConsolidating] = useState(false);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const rows = await fetchTeacherGradePointsAnchors(teacherId || undefined);
      setAnchors(rows);
      if (!selectedGradeId && rows[0]?.gradeId != null) {
        setSelectedGradeId(String(rows[0].gradeId));
      }
    } catch (err) {
      setAnchors([]);
      toast({
        title: pointsApiError(err, "فشل تحميل امتحانات البداية"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setListLoading(false);
    }
  }, [teacherId, toast, selectedGradeId]);

  const loadDetail = useCallback(
    async (gradeId) => {
      if (!gradeId) {
        setDetail(null);
        setSelectedExamId("");
        return;
      }
      setDetailLoading(true);
      try {
        const data = await fetchTeacherGradePointsAnchor(
          gradeId,
          teacherId || undefined,
        );
        setDetail(data);
        setSelectedExamId(
          data.anchor?.startExamId != null
            ? String(data.anchor.startExamId)
            : "",
        );
      } catch (err) {
        setDetail(null);
        toast({
          title: pointsApiError(err, "فشل تحميل تفاصيل الصف"),
          status: "error",
          isClosable: true,
        });
      } finally {
        setDetailLoading(false);
      }
    },
    [teacherId, toast],
  );

  useEffect(() => {
    loadList();
  }, [teacherId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedGradeId) loadDetail(selectedGradeId);
  }, [selectedGradeId, loadDetail]);

  const saveAnchorOnly = async () => {
    if (!selectedGradeId || !selectedExamId) {
      toast({
        title: "اختر صفًا وامتحان بداية",
        status: "warning",
        isClosable: true,
      });
      return;
    }
    setSavingAnchor(true);
    try {
      const result = await setTeacherGradePointsAnchor(
        selectedGradeId,
        selectedExamId,
        teacherId || undefined,
      );
      toast({
        title: result.message,
        description: result.startExamTitle || undefined,
        status: "success",
        isClosable: true,
      });
      await loadList();
      await loadDetail(selectedGradeId);
      onChanged?.();
    } catch (err) {
      toast({
        title: pointsApiError(err, "فشل تعيين امتحان البداية"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setSavingAnchor(false);
    }
  };

  const submitResetAndStart = async () => {
    if (startConfirm.trim() !== RESET_AND_START_FROM_EXAM_CONFIRM) {
      toast({
        title: `اكتب ${RESET_AND_START_FROM_EXAM_CONFIRM} للتأكيد`,
        status: "warning",
        isClosable: true,
      });
      return;
    }
    if (!selectedGradeId || !selectedExamId) return;
    setStarting(true);
    try {
      const result = await resetAndStartFromExam({
        gradeId: selectedGradeId,
        startExamId: selectedExamId,
        label: startLabel,
        reason: startReason,
        teacherId: teacherId || undefined,
      });
      toast({
        title: result.message,
        description: result.seasonId
          ? `تم أرشفة الموسم #${result.seasonId}`
          : undefined,
        status: "success",
        isClosable: true,
      });
      startModal.onClose();
      setStartConfirm("");
      setStartLabel("");
      setStartReason("");
      await loadList();
      await loadDetail(selectedGradeId);
      onChanged?.();
    } catch (err) {
      toast({
        title: pointsApiError(err, "فشل العملية"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setStarting(false);
    }
  };

  const submitRebuildLast = async () => {
    if (rebuildConfirm.trim() !== RESET_AND_REBUILD_LAST_EXAM_CONFIRM) {
      toast({
        title: `اكتب ${RESET_AND_REBUILD_LAST_EXAM_CONFIRM} للتأكيد`,
        status: "warning",
        isClosable: true,
      });
      return;
    }
    setRebuilding(true);
    try {
      const result = await resetAndRebuildLastExam({
        gradeId: rebuildGradeId || undefined,
        label: rebuildLabel,
        reason: rebuildReason,
        teacherId: teacherId || undefined,
      });
      toast({
        title: result.message,
        status: "success",
        isClosable: true,
      });
      rebuildModal.onClose();
      setRebuildConfirm("");
      setRebuildLabel("");
      setRebuildReason("");
      setRebuildGradeId("");
      await loadList();
      if (selectedGradeId) await loadDetail(selectedGradeId);
      onChanged?.();
    } catch (err) {
      toast({
        title: pointsApiError(err, "فشل إعادة البناء"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setRebuilding(false);
    }
  };

  const submitConsolidate = async () => {
    if (consolidateConfirm.trim() !== CONSOLIDATE_EXAM_POINTS_CONFIRM) {
      toast({
        title: `اكتب ${CONSOLIDATE_EXAM_POINTS_CONFIRM} للتأكيد`,
        status: "warning",
        isClosable: true,
      });
      return;
    }
    setConsolidating(true);
    try {
      const result = await consolidateLegacyExamPoints(teacherId || undefined);
      toast({
        title: result.message,
        description: `حُذف ${result.transactionsDeleted} تكرار — خُصم ${result.pointsRemovedFromBalances} نقطة`,
        status: "success",
        isClosable: true,
      });
      consolidateModal.onClose();
      setConsolidateConfirm("");
      onChanged?.();
    } catch (err) {
      toast({
        title: pointsApiError(err, "فشل التوحيد"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setConsolidating(false);
    }
  };

  const gradeOptions =
    anchors.length > 0
      ? anchors
      : grades.map((g) => ({
          gradeId: optionId(g),
          gradeName: optionLabel(g, "صف"),
          mode: "last_exam_only",
          anchor: null,
        }));

  return (
    <VStack align="stretch" spacing={4} dir="rtl">
      <Alert status="info" borderRadius="xl">
        <AlertIcon />
        <Text fontSize="sm" lineHeight="1.8">
          لكل صف اختر امتحانًا شاملاً يبدأ منه حساب النقاط — يُحسب هو وكل امتحان
          شامل بعده. بدون مرساة = آخر امتحان فقط. امتحانات المحاضرات لا تدخل
          الترتيب.
        </Text>
      </Alert>

      <Flex gap={3} wrap="wrap" align="center">
        <FormControl maxW="260px">
          <FormLabel fontSize="sm" fontWeight="700">
            الصف
          </FormLabel>
          <Select
            borderRadius="xl"
            value={selectedGradeId}
            onChange={(e) => setSelectedGradeId(e.target.value)}
          >
            <option value="">اختر صفًا</option>
            {gradeOptions.map((row) => (
              <option key={row.gradeId} value={row.gradeId}>
                {row.gradeName}
              </option>
            ))}
          </Select>
        </FormControl>
        <Button
          mt={{ base: 0, md: 8 }}
          leftIcon={<FaSync />}
          variant="outline"
          borderRadius="xl"
          onClick={() => {
            loadList();
            if (selectedGradeId) loadDetail(selectedGradeId);
          }}
          isLoading={listLoading || detailLoading}
        >
          تحديث
        </Button>
      </Flex>

      {listLoading ? (
        <Skeleton h="120px" borderRadius="2xl" />
      ) : (
        <VStack align="stretch" spacing={2}>
          {gradeOptions.map((row) => {
            const active = String(row.gradeId) === String(selectedGradeId);
            return (
              <Flex
                key={row.gradeId}
                as="button"
                type="button"
                textAlign="start"
                w="full"
                p={3}
                borderWidth="1px"
                borderColor={active ? "blue.400" : theme.cardBorder}
                borderRadius="xl"
                bg={active ? "blue.50" : "transparent"}
                _dark={{ bg: active ? "whiteAlpha.100" : "transparent" }}
                justify="space-between"
                align="center"
                gap={3}
                onClick={() => setSelectedGradeId(String(row.gradeId))}
              >
                <Box minW={0}>
                  <Text fontWeight="800" noOfLines={1}>
                    {row.gradeName}
                  </Text>
                  <Text fontSize="xs" color={theme.muted} mt={0.5}>
                    {row.anchor?.startExamTitle
                      ? `من: ${row.anchor.startExamTitle}`
                      : "بدون مرساة — آخر امتحان فقط"}
                  </Text>
                </Box>
                <Badge
                  colorScheme={row.mode === "from_exam_onward" ? "blue" : "gray"}
                  borderRadius="md"
                >
                  {row.mode === "from_exam_onward"
                    ? "من امتحان فصاعدًا"
                    : "آخر امتحان"}
                </Badge>
              </Flex>
            );
          })}
        </VStack>
      )}

      {selectedGradeId ? (
        <Box
          p={4}
          borderWidth="1px"
          borderColor={theme.cardBorder}
          borderRadius="2xl"
        >
          {detailLoading ? (
            <Skeleton h="160px" borderRadius="xl" />
          ) : (
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between" flexWrap="wrap" gap={2}>
                <Text fontWeight="800" color={theme.heading}>
                  امتحان بداية النقاط
                </Text>
                {detail?.mode === "from_exam_onward" ? (
                  <Badge colorScheme="blue" borderRadius="md">
                    نافذة من الامتحان فصاعدًا
                  </Badge>
                ) : (
                  <Badge colorScheme="gray" borderRadius="md">
                    آخر امتحان فقط
                  </Badge>
                )}
              </HStack>

              {detail?.anchor ? (
                <Text fontSize="sm" color={theme.muted}>
                  الحالي: {detail.anchor.startExamTitle || `#${detail.anchor.startExamId}`}
                  {detail.anchor.startExamCreatedAt
                    ? ` — ${formatPointsDate(detail.anchor.startExamCreatedAt)}`
                    : ""}
                </Text>
              ) : null}

              <FormControl>
                <FormLabel fontSize="sm">اختر امتحانًا شاملاً</FormLabel>
                <Select
                  borderRadius="xl"
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  placeholder={
                    (detail?.exams || []).length
                      ? "اختر امتحان البداية"
                      : "لا توجد امتحانات شاملة لهذا الصف"
                  }
                >
                  {(detail?.exams || []).map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title}
                      {exam.submittedAttempts
                        ? ` (${exam.submittedAttempts} تسليم)`
                        : ""}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {detail?.eligibleExamIds?.length ? (
                <Text fontSize="xs" color={theme.muted}>
                  امتحانات تدخل الترتيب حاليًا:{" "}
                  {detail.eligibleExamIds.join("، ")}
                </Text>
              ) : null}

              <Flex gap={2} flexWrap="wrap">
                <Button
                  colorScheme="blue"
                  borderRadius="xl"
                  leftIcon={<FaSave />}
                  onClick={saveAnchorOnly}
                  isLoading={savingAnchor}
                  isDisabled={!selectedExamId}
                >
                  تعيين بدون تصفير
                </Button>
                <Button
                  colorScheme="orange"
                  borderRadius="xl"
                  leftIcon={<FaFlagCheckered />}
                  onClick={() => {
                    setStartConfirm("");
                    startModal.onOpen();
                  }}
                  isDisabled={!selectedExamId}
                >
                  تصفير وبدء من هذا الامتحان
                </Button>
              </Flex>
            </VStack>
          )}
        </Box>
      ) : null}

      <Box
        p={4}
        borderWidth="1px"
        borderColor={theme.cardBorder}
        borderRadius="2xl"
      >
        <Text fontWeight="800" mb={2} color={theme.heading}>
          أدوات صيانة النقاط
        </Text>
        <Text fontSize="sm" color={theme.muted} mb={3} lineHeight="1.8">
          للتوافق مع نظام «مرة واحدة لكل امتحان» أو إعادة البناء من آخر امتحان فقط.
        </Text>
        <Flex gap={2} flexWrap="wrap">
          <Button
            variant="outline"
            colorScheme="purple"
            borderRadius="xl"
            leftIcon={<FaRedo />}
            onClick={() => {
              setRebuildConfirm("");
              rebuildModal.onOpen();
            }}
          >
            إعادة بناء من آخر امتحان
          </Button>
          <Button
            variant="outline"
            colorScheme="teal"
            borderRadius="xl"
            onClick={() => {
              setConsolidateConfirm("");
              consolidateModal.onOpen();
            }}
          >
            توحيد نقاط قديمة (أول محاولة)
          </Button>
        </Flex>
      </Box>

      {/* Reset + start from exam */}
      <Modal
        isOpen={startModal.isOpen}
        onClose={() => !starting && startModal.onClose()}
        isCentered
      >
        <ModalOverlay />
        <ModalContent borderRadius="2xl" mx={3} dir="rtl">
          <ModalHeader>تصفير وبدء من امتحان</ModalHeader>
          <ModalCloseButton isDisabled={starting} />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Alert status="warning" borderRadius="xl">
                <AlertIcon />
                <Text fontSize="sm" lineHeight="1.8">
                  سيُصفَّر صف #{selectedGradeId} ويُؤرشف كموسم، ثم تُعاد بناء
                  نقاط البدء+الدرجة من الامتحان المختار وكل ما بعده.
                </Text>
              </Alert>
              <FormControl>
                <FormLabel>اسم الموسم (اختياري)</FormLabel>
                <Input
                  value={startLabel}
                  onChange={(e) => setStartLabel(e.target.value)}
                  borderRadius="xl"
                  isDisabled={starting}
                />
              </FormControl>
              <FormControl>
                <FormLabel>السبب (اختياري)</FormLabel>
                <Textarea
                  value={startReason}
                  onChange={(e) => setStartReason(e.target.value)}
                  borderRadius="xl"
                  rows={2}
                  isDisabled={starting}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>
                  للتأكيد اكتب{" "}
                  <Code dir="ltr" fontSize="xs">
                    {RESET_AND_START_FROM_EXAM_CONFIRM}
                  </Code>
                </FormLabel>
                <Input
                  value={startConfirm}
                  onChange={(e) => setStartConfirm(e.target.value)}
                  borderRadius="xl"
                  dir="ltr"
                  fontFamily="mono"
                  isDisabled={starting}
                  autoComplete="off"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={2}
              onClick={startModal.onClose}
              isDisabled={starting}
            >
              إلغاء
            </Button>
            <Button
              colorScheme="orange"
              borderRadius="xl"
              isLoading={starting}
              isDisabled={
                startConfirm.trim() !== RESET_AND_START_FROM_EXAM_CONFIRM
              }
              onClick={submitResetAndStart}
            >
              تنفيذ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Rebuild last exam */}
      <Modal
        isOpen={rebuildModal.isOpen}
        onClose={() => !rebuilding && rebuildModal.onClose()}
        isCentered
      >
        <ModalOverlay />
        <ModalContent borderRadius="2xl" mx={3} dir="rtl">
          <ModalHeader>إعادة بناء من آخر امتحان</ModalHeader>
          <ModalCloseButton isDisabled={rebuilding} />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Alert status="warning" borderRadius="xl">
                <AlertIcon />
                <Text fontSize="sm" lineHeight="1.8">
                  يحذف النقاط الحالية ثم يمنح بدء+درجة آخر امتحان شامل فقط لكل
                  صف (أو صف محدد).
                </Text>
              </Alert>
              <FormControl>
                <FormLabel>النطاق</FormLabel>
                <Select
                  value={rebuildGradeId}
                  onChange={(e) => setRebuildGradeId(e.target.value)}
                  borderRadius="xl"
                  isDisabled={rebuilding}
                >
                  <option value="">كل الصفوف</option>
                  {gradeOptions.map((row) => (
                    <option key={row.gradeId} value={row.gradeId}>
                      {row.gradeName}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>اسم الموسم (اختياري)</FormLabel>
                <Input
                  value={rebuildLabel}
                  onChange={(e) => setRebuildLabel(e.target.value)}
                  borderRadius="xl"
                  isDisabled={rebuilding}
                />
              </FormControl>
              <FormControl>
                <FormLabel>السبب (اختياري)</FormLabel>
                <Textarea
                  value={rebuildReason}
                  onChange={(e) => setRebuildReason(e.target.value)}
                  borderRadius="xl"
                  rows={2}
                  isDisabled={rebuilding}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>
                  للتأكيد اكتب{" "}
                  <Code dir="ltr" fontSize="xs">
                    {RESET_AND_REBUILD_LAST_EXAM_CONFIRM}
                  </Code>
                </FormLabel>
                <Input
                  value={rebuildConfirm}
                  onChange={(e) => setRebuildConfirm(e.target.value)}
                  borderRadius="xl"
                  dir="ltr"
                  fontFamily="mono"
                  isDisabled={rebuilding}
                  autoComplete="off"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={2}
              onClick={rebuildModal.onClose}
              isDisabled={rebuilding}
            >
              إلغاء
            </Button>
            <Button
              colorScheme="purple"
              borderRadius="xl"
              isLoading={rebuilding}
              isDisabled={
                rebuildConfirm.trim() !== RESET_AND_REBUILD_LAST_EXAM_CONFIRM
              }
              onClick={submitRebuildLast}
            >
              تنفيذ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Consolidate legacy */}
      <Modal
        isOpen={consolidateModal.isOpen}
        onClose={() => !consolidating && consolidateModal.onClose()}
        isCentered
      >
        <ModalOverlay />
        <ModalContent borderRadius="2xl" mx={3} dir="rtl">
          <ModalHeader>توحيد نقاط الامتحانات القديمة</ModalHeader>
          <ModalCloseButton isDisabled={consolidating} />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Alert status="info" borderRadius="xl">
                <AlertIcon />
                <Text fontSize="sm" lineHeight="1.8">
                  يبقي نقاط أول محاولة لكل امتحان ويحذف تكرار المحاولات التالية
                  مع خصمها من الرصيد.
                </Text>
              </Alert>
              <FormControl isRequired>
                <FormLabel>
                  للتأكيد اكتب{" "}
                  <Code dir="ltr" fontSize="xs">
                    {CONSOLIDATE_EXAM_POINTS_CONFIRM}
                  </Code>
                </FormLabel>
                <Input
                  value={consolidateConfirm}
                  onChange={(e) => setConsolidateConfirm(e.target.value)}
                  borderRadius="xl"
                  dir="ltr"
                  fontFamily="mono"
                  isDisabled={consolidating}
                  autoComplete="off"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={2}
              onClick={consolidateModal.onClose}
              isDisabled={consolidating}
            >
              إلغاء
            </Button>
            <Button
              colorScheme="teal"
              borderRadius="xl"
              isLoading={consolidating}
              isDisabled={
                consolidateConfirm.trim() !== CONSOLIDATE_EXAM_POINTS_CONFIRM
              }
              onClick={submitConsolidate}
            >
              توحيد
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
