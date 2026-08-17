import { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import {
  FaCalendarAlt,
  FaCheck,
  FaCheckDouble,
  FaClock,
  FaLayerGroup,
  FaQrcode,
  FaSave,
  FaTimes,
  FaUserCheck,
  FaUserInjured,
} from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import { Html5Qrcode } from "html5-qrcode";
import {
  useAttendance,
  useAttendanceMutations,
  useGroupStudents,
  useGroups,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage } from "../../api/centerMgmtApi";
import {
  ACCENT,
  ATTENDANCE_LABELS,
  BRAND_ORANGE,
  field,
  formatDate,
  parseQrScan,
  studentCode,
  studentName,
  todayISO,
} from "./centerMgmtUtils";
import {
  DesktopOnly,
  EmptyState,
  KpiCard,
  ListCard,
  LoadingBlock,
  MobileOnly,
  PageHeader,
  PrimaryButton,
  StatusBadge,
  Surface,
} from "./components/UiBits";

const STATUS_KEYS = ["present", "absent", "late", "excused"];
const EMPTY_STUDENTS = [];

function buildRosterMap(students, todayData) {
  const existing = Array.isArray(todayData)
    ? todayData
    : todayData?.items || todayData?.records || todayData?.attendance || [];
  const byStudent = {};
  existing.forEach((r) => {
    const sid = field(r, "student_id", "studentId");
    if (sid != null) byStudent[String(sid)] = field(r, "status") || "absent";
  });
  const map = {};
  students.forEach((s) => {
    map[String(s.id)] = byStudent[String(s.id)] || "absent";
  });
  return map;
}

const STATUS_BTNS = {
  present: { icon: FaCheck, label: "ح", title: "حاضر", active: "green.500", soft: "green.50" },
  absent: { icon: FaTimes, label: "غ", title: "غائب", active: "red.500", soft: "red.50" },
  late: { icon: FaClock, label: "ت", title: "متأخر", active: "orange.500", soft: "orange.50" },
  excused: { icon: FaUserInjured, label: "ع", title: "بعذر", active: "purple.500", soft: "purple.50" },
};

function StatusPicker({ value, onChange, size = "md" }) {
  const idleBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const idleColor = useColorModeValue("gray.600", "gray.300");
  const btnSize = size === "sm" ? "32px" : "36px";

  return (
    <HStack spacing={1.5} flexShrink={0}>
      {STATUS_KEYS.map((key) => {
        const cfg = STATUS_BTNS[key];
        const active = value === key;
        return (
          <Button
            key={key}
            type="button"
            title={cfg.title}
            aria-label={cfg.title}
            minW={btnSize}
            h={btnSize}
            px={0}
            borderRadius="lg"
            fontWeight="black"
            fontSize="xs"
            borderWidth="1.5px"
            borderColor={active ? cfg.active : "transparent"}
            bg={active ? cfg.active : idleBg}
            color={active ? "white" : idleColor}
            _hover={{ bg: active ? cfg.active : cfg.soft, transform: "scale(1.05)" }}
            onClick={() => onChange(key)}
          >
            {cfg.label}
          </Button>
        );
      })}
    </HStack>
  );
}

function StudentRow({ student, index, status, isDirty, onChange }) {
  const meta = ATTENDANCE_LABELS[status] || ATTENDANCE_LABELS.absent;
  const muted = useColorModeValue("gray.500", "gray.400");
  const accent = `${meta.scheme}.400`;

  return (
    <ListCard p={3}>
      <Box h="2px" bg={accent} borderTopRadius="2xl" mx={-3} mt={-3} mb={2.5} />
      <Flex align="center" gap={3}>
        <Flex
          w={8}
          h={8}
          borderRadius="lg"
          bg={`${meta.scheme}.50`}
          color={`${meta.scheme}.600`}
          align="center"
          justify="center"
          fontWeight="black"
          fontSize="xs"
          flexShrink={0}
        >
          {index + 1}
        </Flex>
        <Box flex={1} minW={0}>
          <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
            {studentName(student)}
          </Text>
          <Text fontSize="10px" fontFamily="mono" color={muted}>
            {studentCode(student)}
          </Text>
        </Box>
        {isDirty ? (
          <Badge colorScheme="orange" borderRadius="full" fontSize="9px" flexShrink={0}>
            جديد
          </Badge>
        ) : (
          <StatusBadge scheme={meta.scheme}>{meta.label}</StatusBadge>
        )}
        <StatusPicker value={status} onChange={(v) => onChange(student.id, v)} size="sm" />
      </Flex>
    </ListCard>
  );
}

export default function AttendancePage() {
  const toast = useToast();
  const { data: groupsData } = useGroups({ limit: 100, status: "active" });
  const groups = groupsData?.items || [];

  const { isOpen: isQrOpen, onOpen: onQrOpen, onClose: onQrClose } = useDisclosure();

  const [groupId, setGroupId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [manualToken, setManualToken] = useState("");
  const [scanStatus, setScanStatus] = useState("present");
  const [scanning, setScanning] = useState(false);
  const [bulkMap, setBulkMap] = useState({});
  const [baselineMap, setBaselineMap] = useState({});
  const scannerRef = useRef(null);
  const lastScanRef = useRef("");

  const stickyBg = useColorModeValue("white", "gray.900");
  const stickyBorder = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.900", "white");
  const tableHeadBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const searchBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const chipIdle = useColorModeValue("gray.100", "whiteAlpha.100");

  const selectedGroup = groups.find((g) => String(g.id) === String(groupId));

  const attendanceParams = useMemo(
    () => ({ group_id: groupId || undefined, date: date || undefined }),
    [groupId, date],
  );

  const { data: todayData, isLoading: loadingToday, refetch } = useAttendance(attendanceParams);
  const { data: studentsData, isLoading: loadingStudents } = useGroupStudents(groupId);
  const groupStudents = studentsData ?? EMPTY_STUDENTS;
  const { scan, bulk } = useAttendanceMutations();

  const serverMap = useMemo(
    () => buildRosterMap(groupStudents, todayData),
    [groupStudents, todayData],
  );

  const rosterSyncKey = useMemo(
    () => `${groupId}|${date}|${JSON.stringify(serverMap)}`,
    [groupId, date, serverMap],
  );

  const lastRosterSyncRef = useRef("");

  useEffect(() => {
    if (lastRosterSyncRef.current === rosterSyncKey) return;
    lastRosterSyncRef.current = rosterSyncKey;
    setBulkMap(serverMap);
    setBaselineMap(serverMap);
  }, [rosterSyncKey, serverMap]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  const draftCounts = useMemo(() => {
    const acc = { present: 0, absent: 0, late: 0, excused: 0 };
    Object.values(bulkMap).forEach((st) => {
      if (acc[st] != null) acc[st] += 1;
    });
    return acc;
  }, [bulkMap]);

  const isDirty = useMemo(() => {
    const ids = new Set([...Object.keys(bulkMap), ...Object.keys(baselineMap)]);
    for (const id of ids) {
      if ((bulkMap[id] || "absent") !== (baselineMap[id] || "absent")) return true;
    }
    return false;
  }, [bulkMap, baselineMap]);

  const filteredStudents = useMemo(() => {
    let list = groupStudents;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const name = String(studentName(s)).toLowerCase();
        const code = String(studentCode(s)).toLowerCase();
        const phone = String(field(s, "phone") || "").toLowerCase();
        return name.includes(q) || code.includes(q) || phone.includes(q);
      });
    }
    if (statusFilter === "dirty") {
      list = list.filter(
        (s) =>
          (bulkMap[String(s.id)] || "absent") !== (baselineMap[String(s.id)] || "absent"),
      );
    } else if (statusFilter !== "all") {
      list = list.filter((s) => (bulkMap[String(s.id)] || "absent") === statusFilter);
    }
    return list;
  }, [groupStudents, search, statusFilter, bulkMap, baselineMap]);

  const setStatus = (studentId, status) => {
    setBulkMap((m) => ({ ...m, [String(studentId)]: status }));
  };

  const markAll = (status) => {
    const next = {};
    groupStudents.forEach((s) => {
      next[String(s.id)] = status;
    });
    setBulkMap(next);
  };

  const submitScan = async (raw) => {
    if (!groupId) {
      toast({ title: "اختر المجموعة أولاً", status: "warning", duration: 2500 });
      return;
    }
    const parsed = parseQrScan(raw);
    if (!parsed?.qr_token && !parsed?.qr_payload) {
      toast({ title: "رمز QR غير صالح", status: "warning", duration: 2500 });
      return;
    }
    try {
      const payload = {
        group_id: Number(groupId),
        attendance_date: date,
        status: scanStatus,
      };
      if (parsed.qr_payload) payload.qr_payload = parsed.qr_payload;
      else payload.qr_token = parsed.qr_token;

      const result = await scan.mutateAsync(payload);
      const name = studentName(result?.student) || "طالب";
      const sid = field(result?.student, "id") ?? field(result, "student_id", "studentId");
      if (sid != null) setBulkMap((m) => ({ ...m, [String(sid)]: scanStatus }));
      toast({
        title: `تم: ${name}`,
        description: ATTENDANCE_LABELS[scanStatus]?.label,
        status: "success",
        duration: 1800,
      });
      setManualToken("");
      refetch();
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  const startScanner = async () => {
    if (!groupId || scannerRef.current) return;
    try {
      const scanner = new Html5Qrcode("teacher-center-qr-reader");
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        async (decoded) => {
          if (!decoded || decoded === lastScanRef.current) return;
          lastScanRef.current = decoded;
          await submitScan(decoded);
          setTimeout(() => {
            lastScanRef.current = "";
          }, 2500);
        },
        () => {},
      );
    } catch (err) {
      setScanning(false);
      toast({
        title: "تعذر فتح الكاميرا",
        description: err?.message,
        status: "error",
        duration: 3500,
      });
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleQrClose = () => {
    stopScanner();
    onQrClose();
  };

  const openQrModal = () => {
    if (!groupId) {
      toast({ title: "اختر المجموعة أولاً", status: "warning", duration: 2500 });
      return;
    }
    onQrOpen();
  };

  useEffect(() => {
    if (!isQrOpen || !groupId) return undefined;
    const timer = window.setTimeout(() => {
      startScanner();
    }, 350);
    return () => {
      window.clearTimeout(timer);
      stopScanner();
    };
  }, [isQrOpen, groupId]);

  const handleBulkSave = async () => {
    if (!groupId) return;
    const records = Object.entries(bulkMap).map(([student_id, status]) => ({
      student_id: Number(student_id),
      status,
    }));
    if (!records.length) return;
    try {
      await bulk.mutateAsync({
        group_id: Number(groupId),
        attendance_date: date,
        records,
      });
      toast({
        title: "تم حفظ الحضور",
        description: `حاضر ${draftCounts.present} · غائب ${draftCounts.absent}`,
        status: "success",
        duration: 2500,
      });
      setBaselineMap({ ...bulkMap });
      refetch();
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  const filterChips = [
    { key: "all", label: "الكل" },
    { key: "dirty", label: "غير محفوظ" },
    ...STATUS_KEYS.map((k) => ({ key: k, label: ATTENDANCE_LABELS[k].label })),
  ];

  return (
    <Box pb={{ base: groupId ? "100px" : 4, md: groupId && isDirty ? "88px" : 4 }}>
      <PageHeader
        title="تسجيل الحضور"
        description="اختر المجموعة والتاريخ، ثم علّم حالة كل طالب أو امسح QR"
      />

      {/* Setup panel */}
      <Surface p={0} overflow="hidden" mb={5}>
        <Box h="3px" bgGradient="linear(to-l, blue.500, orange.500)" />
        <Box p={{ base: 4, md: 5 }}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="semibold">
                المجموعة
              </FormLabel>
              <Select
                placeholder="اختر المجموعة"
                value={groupId}
                onChange={(e) => {
                  setGroupId(e.target.value);
                  setSearch("");
                  setStatusFilter("all");
                  if (isQrOpen) handleQrClose();
                }}
                borderRadius="xl"
                size="md"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {field(g, "name")}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="semibold">
                تاريخ الحصة
              </FormLabel>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                borderRadius="xl"
                size="md"
              />
            </FormControl>
          </SimpleGrid>

          {selectedGroup ? (
            <HStack spacing={2} mb={4} flexWrap="wrap">
              <Icon as={FaLayerGroup} color={ACCENT} />
              <Text fontWeight="bold" color={titleColor}>
                {field(selectedGroup, "name")}
              </Text>
              <Text fontSize="sm" color={muted}>
                · {formatDate(date)}
              </Text>
            </HStack>
          ) : null}

          <PrimaryButton
            leftIcon={<FaQrcode />}
            onClick={openQrModal}
            isDisabled={!groupId}
            w="full"
            h="48px"
            bg={BRAND_ORANGE}
            _hover={{ bg: "#C05621" }}
            fontWeight="bold"
          >
            مسح QR — فتح الكاميرا
          </PrimaryButton>
        </Box>
      </Surface>

      {groupId ? (
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 2, md: 3 }} mb={5}>
          <KpiCard label="حاضر" value={draftCounts.present} icon={FaUserCheck} color="green" />
          <KpiCard label="غائب" value={draftCounts.absent} icon={FaTimes} color="red" />
          <KpiCard label="متأخر" value={draftCounts.late} icon={FaClock} color="orange" />
          <KpiCard label="بعذر" value={draftCounts.excused} icon={FaUserInjured} color="purple" />
        </SimpleGrid>
      ) : null}

      <Surface>
        {!groupId ? (
          <EmptyState
            icon={FaUserCheck}
            title="اختر مجموعة للبدء"
            description="حدّد المجموعة والتاريخ من الأعلى"
          />
        ) : loadingStudents ? (
          <LoadingBlock label="جاري تحميل الطلاب..." />
        ) : groupStudents.length === 0 ? (
          <EmptyState title="لا يوجد طلاب في هذه المجموعة" />
        ) : (
          <VStack align="stretch" spacing={4}>
            {/* Toolbar */}
            <Flex
              direction={{ base: "column", lg: "row" }}
              gap={3}
              align={{ base: "stretch", lg: "center" }}
              justify="space-between"
            >
              <InputGroup maxW={{ lg: "320px" }}>
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray" />
                </InputLeftElement>
                <Input
                  placeholder="بحث بالاسم أو الكود..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  borderRadius="xl"
                  bg={searchBg}
                  size="sm"
                />
              </InputGroup>
              <HStack spacing={2} flexWrap="wrap">
                <Button
                  size="sm"
                  leftIcon={<FaQrcode />}
                  colorScheme="orange"
                  borderRadius="xl"
                  onClick={openQrModal}
                >
                  مسح QR
                </Button>
                <Button
                  size="sm"
                  leftIcon={<FaCheckDouble />}
                  colorScheme="green"
                  variant="outline"
                  borderRadius="xl"
                  onClick={() => markAll("present")}
                >
                  الكل حاضر
                </Button>
                <Button
                  size="sm"
                  leftIcon={<FaTimes />}
                  colorScheme="red"
                  variant="outline"
                  borderRadius="xl"
                  onClick={() => markAll("absent")}
                >
                  الكل غائب
                </Button>
              </HStack>
            </Flex>

              {/* Filter chips */}
              <Wrap spacing={2}>
                {filterChips.map((chip) => {
                  const active = statusFilter === chip.key;
                  return (
                    <WrapItem key={chip.key}>
                      <Button
                        size="xs"
                        borderRadius="full"
                        px={3}
                        h="28px"
                        fontWeight="semibold"
                        bg={active ? ACCENT : chipIdle}
                        color={active ? "white" : muted}
                        onClick={() => setStatusFilter(chip.key)}
                      >
                        {chip.label}
                      </Button>
                    </WrapItem>
                  );
                })}
              </Wrap>

              <Text fontSize="xs" color={muted}>
                اضغط ح · غ · ت · ع لتغيير الحالة — ثم احفظ من الأسفل
                {isDirty ? (
                  <Text as="span" color="orange.500" fontWeight="bold">
                    {" "}
                    · لديك تعديلات غير محفوظة
                  </Text>
                ) : null}
              </Text>

              {filteredStudents.length === 0 ? (
                <EmptyState title="لا نتائج" description="جرّب بحثاً أو فلتراً مختلفاً" />
              ) : (
                <>
                  <MobileOnly>
                    <VStack spacing={2} align="stretch">
                      {filteredStudents.map((s, i) => {
                        const st = bulkMap[String(s.id)] || "absent";
                        const dirty =
                          (bulkMap[String(s.id)] || "absent") !==
                          (baselineMap[String(s.id)] || "absent");
                        return (
                          <StudentRow
                            key={s.id}
                            student={s}
                            index={i}
                            status={st}
                            isDirty={dirty}
                            onChange={setStatus}
                          />
                        );
                      })}
                    </VStack>
                  </MobileOnly>

                  <DesktopOnly>
                    <TableContainer borderRadius="xl" borderWidth="1px" borderColor={stickyBorder}>
                      <Table size="sm">
                        <Thead bg={tableHeadBg}>
                          <Tr>
                            <Th w="48px">#</Th>
                            <Th>الطالب</Th>
                            <Th w="100px">الحالة</Th>
                            <Th w="200px" textAlign="center">
                              تسجيل سريع
                            </Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {filteredStudents.map((s, i) => {
                            const st = bulkMap[String(s.id)] || "absent";
                            const meta = ATTENDANCE_LABELS[st] || ATTENDANCE_LABELS.absent;
                            const dirty =
                              (bulkMap[String(s.id)] || "absent") !==
                              (baselineMap[String(s.id)] || "absent");
                            return (
                              <Tr key={s.id}>
                                <Td color={muted} fontWeight="bold">
                                  {i + 1}
                                </Td>
                                <Td>
                                  <Text fontWeight="semibold">{studentName(s)}</Text>
                                  <Text fontSize="xs" fontFamily="mono" color={muted}>
                                    {studentCode(s)}
                                  </Text>
                                </Td>
                                <Td>
                                  {dirty ? (
                                    <Badge colorScheme="orange" borderRadius="full" fontSize="10px">
                                      جديد
                                    </Badge>
                                  ) : (
                                    <StatusBadge scheme={meta.scheme}>{meta.label}</StatusBadge>
                                  )}
                                </Td>
                                <Td>
                                  <Flex justify="center">
                                    <StatusPicker
                                      value={st}
                                      onChange={(v) => setStatus(s.id, v)}
                                    />
                                  </Flex>
                                </Td>
                              </Tr>
                            );
                          })}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </DesktopOnly>
                </>
              )}
            </VStack>
          )}
      </Surface>

      <Modal
        isOpen={isQrOpen}
        onClose={handleQrClose}
        size={{ base: "full", md: "md" }}
        isCentered
        closeOnOverlayClick
      >
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent dir="rtl" borderRadius={{ base: "none", md: "2xl" }} m={0}>
          <ModalHeader pb={2}>
            <HStack spacing={2}>
              <Icon as={FaQrcode} color={BRAND_ORANGE} />
              <Text>مسح بطاقة الطالب</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack align="stretch" spacing={4}>
              <Text fontSize="sm" color={muted} textAlign="center">
                وجّه الكاميرا لـ QR — يُسجَّل تلقائياً
              </Text>

              <FormControl>
                <FormLabel fontSize="xs">حالة المسح</FormLabel>
                <Select
                  value={scanStatus}
                  onChange={(e) => setScanStatus(e.target.value)}
                  borderRadius="xl"
                  size="sm"
                >
                  {Object.entries(ATTENDANCE_LABELS).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <Box
                id="teacher-center-qr-reader"
                borderRadius="2xl"
                overflow="hidden"
                minH="280px"
                w="full"
                bg="black"
              />

              {!scanning ? (
                <Text fontSize="xs" color={muted} textAlign="center">
                  جاري تشغيل الكاميرا...
                </Text>
              ) : null}

              <Box pt={2} borderTopWidth="1px" borderColor={stickyBorder}>
                <FormLabel fontSize="sm" fontWeight="semibold">
                  أو الصق رمز QR يدوياً
                </FormLabel>
                <Textarea
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  borderRadius="xl"
                  rows={2}
                  placeholder="qr_token أو JSON"
                  mb={3}
                />
                <PrimaryButton
                  onClick={() => submitScan(manualToken)}
                  isLoading={scan.isPending}
                  isDisabled={!manualToken.trim()}
                  w="full"
                  bg="teal.500"
                  _hover={{ bg: "teal.600" }}
                >
                  تسجيل
                </PrimaryButton>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Sticky save */}
      {groupId && groupStudents.length > 0 ? (
        <Box
          position="fixed"
          bottom={{ base: "72px", md: 0 }}
          left={0}
          right={0}
          zIndex={25}
          bg={stickyBg}
          borderTopWidth="1px"
          borderColor={stickyBorder}
          boxShadow="0 -8px 24px rgba(15,23,42,0.08)"
          px={4}
          py={3}
        >
          <Flex
            maxW="7xl"
            mx="auto"
            gap={3}
            align="center"
            justify="space-between"
            direction={{ base: "column", sm: "row" }}
          >
            <HStack spacing={2} fontSize="sm" flexWrap="wrap" justify="center">
              <Badge colorScheme="green" borderRadius="full">
                {draftCounts.present} حاضر
              </Badge>
              <Badge colorScheme="red" borderRadius="full">
                {draftCounts.absent} غائب
              </Badge>
              {loadingToday ? null : (
                <HStack spacing={1} color={muted} fontSize="xs">
                  <Icon as={FaCalendarAlt} boxSize={3} />
                  <Text>{formatDate(date)}</Text>
                </HStack>
              )}
            </HStack>
            <PrimaryButton
              leftIcon={<FaSave />}
              onClick={handleBulkSave}
              isLoading={bulk.isPending}
              isDisabled={!isDirty}
              w={{ base: "full", sm: "auto" }}
              h="46px"
              px={8}
            >
              حفظ الحضور
            </PrimaryButton>
          </Flex>
        </Box>
      ) : null}
    </Box>
  );
}
