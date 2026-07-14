import { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Collapse,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import {
  FaCamera,
  FaCheck,
  FaCheckDouble,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaQrcode,
  FaSave,
  FaTimes,
  FaUserCheck,
  FaUserClock,
  FaUserInjured,
  FaUserTimes,
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
  field,
  parseQrScan,
  studentCode,
  studentName,
  todayISO,
} from "./centerMgmtUtils";
import {
  EmptyState,
  FilterBar,
  KpiCard,
  ListCard,
  LoadingBlock,
  PageHeader,
  PrimaryButton,
  StatusBadge,
  Surface,
} from "./components/UiBits";

const STATUS_ACTIONS = [
  {
    key: "present",
    label: "حاضر",
    short: "حاضر",
    icon: FaCheck,
    activeBg: "green.500",
    softBg: "green.50",
    softBorder: "green.200",
    color: "green.600",
  },
  {
    key: "absent",
    label: "غائب",
    short: "غائب",
    icon: FaTimes,
    activeBg: "red.500",
    softBg: "red.50",
    softBorder: "red.200",
    color: "red.600",
  },
  {
    key: "late",
    label: "متأخر",
    short: "متأخر",
    icon: FaClock,
    activeBg: "orange.500",
    softBg: "orange.50",
    softBorder: "orange.200",
    color: "orange.600",
  },
  {
    key: "excused",
    label: "بعذر",
    short: "بعذر",
    icon: FaUserInjured,
    activeBg: "purple.500",
    softBg: "purple.50",
    softBorder: "purple.200",
    color: "purple.600",
  },
];

function StatusToggle({ value, onChange, compact = false }) {
  const inactiveBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const inactiveBorder = useColorModeValue("gray.200", "gray.600");
  const inactiveColor = useColorModeValue("gray.600", "gray.300");

  return (
    <SimpleGrid columns={4} spacing={1.5} w="full">
      {STATUS_ACTIONS.map((action) => {
        const active = value === action.key;
        return (
          <Button
            key={action.key}
            type="button"
            onClick={() => onChange(action.key)}
            h={compact ? "40px" : { base: "52px", md: "44px" }}
            px={1}
            borderRadius="xl"
            borderWidth="1.5px"
            borderColor={active ? action.activeBg : inactiveBorder}
            bg={active ? action.activeBg : inactiveBg}
            color={active ? "white" : inactiveColor}
            _hover={{
              bg: active ? action.activeBg : action.softBg,
              borderColor: active ? action.activeBg : action.softBorder,
              color: active ? "white" : action.color,
            }}
            _active={{ transform: "scale(0.97)" }}
            transition="all 0.15s"
            boxShadow={active ? "sm" : "none"}
            fontWeight={active ? "black" : "semibold"}
          >
            <VStack spacing={0.5}>
              <Icon as={action.icon} boxSize={compact ? 3 : 3.5} />
              <Text fontSize={{ base: "9px", sm: "10px" }} lineHeight="1.1">
                {action.short}
              </Text>
            </VStack>
          </Button>
        );
      })}
    </SimpleGrid>
  );
}

export default function AttendancePage() {
  const toast = useToast();
  const { data: groupsData } = useGroups({ limit: 100, status: "active" });
  const groups = groupsData?.items || [];

  const [groupId, setGroupId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [mode, setMode] = useState("roster"); // roster | qr
  const [search, setSearch] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [scanStatus, setScanStatus] = useState("present");
  const [scanning, setScanning] = useState(false);
  const [bulkMap, setBulkMap] = useState({});
  const [baselineMap, setBaselineMap] = useState({});
  const [showTips, setShowTips] = useState(false);
  const scannerRef = useRef(null);
  const lastScanRef = useRef("");

  const pageBg = useColorModeValue("#F4F7FB", "gray.950");
  const stickyBg = useColorModeValue("white", "gray.900");
  const stickyBorder = useColorModeValue("gray.200", "gray.700");
  const modeInactive = useColorModeValue("gray.100", "whiteAlpha.100");
  const tipBg = useColorModeValue("blue.50", "whiteAlpha.100");

  const attendanceParams = useMemo(
    () => ({
      group_id: groupId || undefined,
      date: date || undefined,
    }),
    [groupId, date]
  );

  const { data: todayData, isLoading: loadingToday, refetch } = useAttendance(attendanceParams);
  const { data: groupStudents = [], isLoading: loadingStudents } = useGroupStudents(groupId);
  const { scan, record, bulk } = useAttendanceMutations();

  useEffect(() => {
    const existing = Array.isArray(todayData)
      ? todayData
      : todayData?.items || todayData?.records || todayData?.attendance || [];
    const byStudent = {};
    existing.forEach((r) => {
      const sid = field(r, "student_id", "studentId");
      if (sid != null) byStudent[String(sid)] = field(r, "status") || "absent";
    });

    const map = {};
    groupStudents.forEach((s) => {
      const id = String(s.id);
      // موجود مسبقاً → حالته، غير مسجّل → غائب (أسهل: علّم الحاضرين فقط)
      map[id] = byStudent[id] || "absent";
    });
    setBulkMap(map);
    setBaselineMap(map);
  }, [groupStudents, todayData]);

  const todayList = Array.isArray(todayData)
    ? todayData
    : todayData?.items || todayData?.records || todayData?.attendance || [];

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

  const savedCounts = useMemo(() => {
    return todayList.reduce(
      (acc, row) => {
        const st = field(row, "status");
        if (st && acc[st] != null) acc[st] += 1;
        return acc;
      },
      { present: 0, absent: 0, late: 0, excused: 0 }
    );
  }, [todayList]);

  const isDirty = useMemo(() => {
    const ids = new Set([...Object.keys(bulkMap), ...Object.keys(baselineMap)]);
    for (const id of ids) {
      if ((bulkMap[id] || "absent") !== (baselineMap[id] || "absent")) return true;
    }
    return false;
  }, [bulkMap, baselineMap]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groupStudents;
    return groupStudents.filter((s) => {
      const name = String(studentName(s)).toLowerCase();
      const code = String(studentCode(s)).toLowerCase();
      const phone = String(field(s, "phone") || "").toLowerCase();
      return name.includes(q) || code.includes(q) || phone.includes(q);
    });
  }, [groupStudents, search]);

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
      if (sid != null) {
        setBulkMap((m) => ({ ...m, [String(sid)]: scanStatus }));
      }
      toast({
        title: `تم تسجيل: ${name}`,
        description: ATTENDANCE_LABELS[scanStatus]?.label || scanStatus,
        status: "success",
        duration: 2000,
      });
      setManualToken("");
      refetch();
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  const startScanner = async () => {
    if (!groupId) {
      toast({ title: "اختر المجموعة أولاً", status: "warning", duration: 2500 });
      return;
    }
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
        () => {}
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

  const handleBulkSave = async () => {
    if (!groupId) {
      toast({ title: "اختر المجموعة", status: "warning", duration: 2500 });
      return;
    }
    const records = Object.entries(bulkMap).map(([student_id, status]) => ({
      student_id: Number(student_id),
      status,
    }));
    if (!records.length) {
      toast({ title: "لا يوجد طلاب", status: "warning", duration: 2000 });
      return;
    }
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

  const quickRecord = async (student, status) => {
    if (!groupId) return;
    setStatus(student.id, status);
    try {
      await record.mutateAsync({
        group_id: Number(groupId),
        student_id: Number(student.id),
        attendance_date: date,
        status,
        notes: null,
      });
      setBaselineMap((m) => ({ ...m, [String(student.id)]: status }));
      toast({
        title: `${studentName(student)} — ${ATTENDANCE_LABELS[status]?.label || status}`,
        status: "success",
        duration: 1400,
        isClosable: true,
      });
      refetch();
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  return (
    <Box pb={{ base: isDirty || mode === "roster" ? "96px" : 4, md: 4 }}>
      <PageHeader
        title="تسجيل الحضور"
        description="اضغط على حالة كل طالب، أو استخدم مسح QR."
      />

      <FilterBar>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          <FormControl isRequired>
            <FormLabel fontSize="sm" fontWeight="semibold">
              المجموعة
            </FormLabel>
            <Select
              placeholder="اختر المجموعة أولاً"
              value={groupId}
              onChange={(e) => {
                setGroupId(e.target.value);
                setSearch("");
              }}
              borderRadius="xl"
              size="md"
              fontWeight="bold"
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
      </FilterBar>

      {/* Mode switcher */}
      <SimpleGrid columns={2} spacing={2} mb={4}>
        <Button
          h="48px"
          borderRadius="xl"
          leftIcon={<FaUserCheck />}
          bg={mode === "roster" ? ACCENT : modeInactive}
          color={mode === "roster" ? "white" : "gray.700"}
          _dark={{ color: mode === "roster" ? "white" : "gray.200" }}
          _hover={{ bg: mode === "roster" ? "#2B6CB0" : modeInactive }}
          onClick={() => {
            if (scanning) stopScanner();
            setMode("roster");
          }}
          fontWeight="bold"
        >
          كشف الطلاب
        </Button>
        <Button
          h="48px"
          borderRadius="xl"
          leftIcon={<FaQrcode />}
          bg={mode === "qr" ? "#DD6B20" : modeInactive}
          color={mode === "qr" ? "white" : "gray.700"}
          _dark={{ color: mode === "qr" ? "white" : "gray.200" }}
          _hover={{ bg: mode === "qr" ? "#C05621" : modeInactive }}
          onClick={() => setMode("qr")}
          fontWeight="bold"
          isDisabled={!groupId}
        >
          مسح QR
        </Button>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 2, md: 3 }} mb={4}>
        <KpiCard
          label="حاضر (المسودة)"
          value={draftCounts.present}
          icon={FaUserCheck}
          color="green"
          sub={groupId ? `محفوظ: ${savedCounts.present}` : undefined}
        />
        <KpiCard
          label="غائب"
          value={draftCounts.absent}
          icon={FaUserTimes}
          color="red"
          sub={groupId ? `محفوظ: ${savedCounts.absent}` : undefined}
        />
        <KpiCard
          label="متأخر"
          value={draftCounts.late}
          icon={FaUserClock}
          color="orange"
        />
        <KpiCard
          label="بعذر"
          value={draftCounts.excused}
          icon={FaUserInjured}
          color="purple"
        />
      </SimpleGrid>

      {mode === "roster" ? (
        <Surface p={{ base: 3, md: 4 }}>
          {!groupId ? (
            <EmptyState
              icon={FaUserCheck}
              title="ابدأ باختيار المجموعة"
              description="بعد الاختيار سيظهر كشف الطلاب لتسجيل الحضور بنقرة واحدة."
            />
          ) : loadingStudents ? (
            <LoadingBlock label="جاري تحميل الطلاب..." />
          ) : groupStudents.length === 0 ? (
            <EmptyState title="لا يوجد طلاب في هذه المجموعة" />
          ) : (
            <VStack align="stretch" spacing={4}>
              <Flex
                direction={{ base: "column", md: "row" }}
                gap={3}
                justify="space-between"
                align={{ base: "stretch", md: "center" }}
              >
                <Box>
                  <HStack spacing={2} mb={1}>
                    <Text fontWeight="black" fontSize="md">
                      كشف الحضور
                    </Text>
                    <Badge colorScheme="blue" borderRadius="full">
                      {filteredStudents.length} طالب
                    </Badge>
                    {isDirty ? (
                      <Badge colorScheme="orange" borderRadius="full">
                        غير محفوظ
                      </Badge>
                    ) : null}
                  </HStack>
                  <Text fontSize="xs" color="gray.500">
                    اضغط الحالة المطلوبة لكل طالب ثم احفظ
                  </Text>
                </Box>

                <Wrap spacing={2}>
                  <WrapItem>
                    <Button
                      size="sm"
                      leftIcon={<FaCheckDouble />}
                      colorScheme="green"
                      variant="outline"
                      borderRadius="lg"
                      onClick={() => markAll("present")}
                    >
                      الكل حاضر
                    </Button>
                  </WrapItem>
                  <WrapItem>
                    <Button
                      size="sm"
                      leftIcon={<FaTimes />}
                      colorScheme="red"
                      variant="outline"
                      borderRadius="lg"
                      onClick={() => markAll("absent")}
                    >
                      الكل غائب
                    </Button>
                  </WrapItem>
                </Wrap>
              </Flex>

              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray" />
                </InputLeftElement>
                <Input
                  placeholder="ابحث باسم الطالب أو الكود..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  borderRadius="xl"
                  bg={pageBg}
                />
              </InputGroup>

              <Button
                variant="ghost"
                size="sm"
                alignSelf="flex-start"
                rightIcon={<Icon as={showTips ? FaChevronUp : FaChevronDown} />}
                onClick={() => setShowTips((v) => !v)}
              >
                طريقة سريعة
              </Button>
              <Collapse in={showTips}>
                <Box p={3} borderRadius="xl" bg={tipBg} fontSize="sm" color="gray.600" mb={1}>
                  اجعل الجميع غائبين ثم اضغط «حاضر» لمن حضر فقط — أو استخدم «الكل حاضر» وعدّل الغياب.
                  الضغط المطوّل غير مطلوب: نقرة واحدة تكفي، ثم «حفظ الحضور».
                </Box>
              </Collapse>

              <VStack spacing={3} align="stretch">
                {filteredStudents.map((s, index) => {
                  const st = bulkMap[String(s.id)] || "absent";
                  const meta = ATTENDANCE_LABELS[st] || ATTENDANCE_LABELS.absent;
                  const dirty =
                    (bulkMap[String(s.id)] || "absent") !==
                    (baselineMap[String(s.id)] || "absent");

                  return (
                    <ListCard key={s.id} p={{ base: 3, md: 3.5 }}>
                      <Flex
                        justify="space-between"
                        align="flex-start"
                        gap={3}
                        mb={3}
                      >
                        <HStack spacing={3} minW={0} align="center">
                          <Flex
                            w={9}
                            h={9}
                            borderRadius="lg"
                            bg={`${meta.scheme}.50`}
                            color={`${meta.scheme}.600`}
                            align="center"
                            justify="center"
                            fontWeight="black"
                            fontSize="sm"
                            flexShrink={0}
                          >
                            {index + 1}
                          </Flex>
                          <Box minW={0}>
                            <Text fontWeight="black" noOfLines={1} fontSize={{ base: "sm", md: "md" }}>
                              {studentName(s)}
                            </Text>
                            <Text fontSize="xs" color="gray.500" fontFamily="mono">
                              {studentCode(s)}
                            </Text>
                          </Box>
                        </HStack>
                        <HStack spacing={1} flexShrink={0}>
                          {dirty ? (
                            <Badge colorScheme="orange" borderRadius="full" fontSize="9px">
                              تعدّل
                            </Badge>
                          ) : null}
                          <StatusBadge scheme={meta.scheme}>{meta.label}</StatusBadge>
                        </HStack>
                      </Flex>

                      <StatusToggle
                        value={st}
                        onChange={(next) => setStatus(s.id, next)}
                      />

                      {/* Instant save one student — secondary on desktop */}
                      <Flex
                        display={{ base: "none", md: "flex" }}
                        justify="flex-end"
                        mt={2}
                      >
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="blue"
                          onClick={() => quickRecord(s, st)}
                          isLoading={record.isPending}
                        >
                          حفظ هذا الطالب فوراً
                        </Button>
                      </Flex>
                    </ListCard>
                  );
                })}
              </VStack>

              {filteredStudents.length === 0 ? (
                <EmptyState title="لا نتائج للبحث" description="جرّب اسماً أو كوداً آخر." />
              ) : null}
            </VStack>
          )}
        </Surface>
      ) : (
        <Surface>
          <Flex
            justify="space-between"
            align={{ base: "stretch", sm: "center" }}
            direction={{ base: "column", sm: "row" }}
            gap={3}
            mb={4}
          >
            <Box>
              <Text fontWeight="black" mb={1}>
                مسح QR للطالب
              </Text>
              <Text fontSize="sm" color="gray.500">
                وجّه الكاميرا لبطاقة الطالب — يُسجَّل فوراً
              </Text>
            </Box>
            <FormControl maxW={{ sm: "180px" }}>
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
          </Flex>

          <Box
            id="teacher-center-qr-reader"
            borderRadius="2xl"
            overflow="hidden"
            mb={4}
            minH={scanning ? { base: "300px", md: "280px" } : "0"}
            w="full"
            bg="black"
            display={scanning ? "block" : "none"}
          />

          <Flex gap={2} mb={5} flexWrap="wrap">
            {!scanning ? (
              <PrimaryButton
                leftIcon={<FaCamera />}
                onClick={startScanner}
                isDisabled={!groupId}
                w={{ base: "full", sm: "auto" }}
                h="48px"
              >
                تشغيل الكاميرا
              </PrimaryButton>
            ) : (
              <Button
                colorScheme="red"
                borderRadius="xl"
                onClick={stopScanner}
                w={{ base: "full", sm: "auto" }}
                h="48px"
              >
                إيقاف المسح
              </Button>
            )}
          </Flex>

          <FormControl mb={3}>
            <FormLabel fontSize="sm">أو الصق رمز QR</FormLabel>
            <Textarea
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              borderRadius="xl"
              rows={2}
              placeholder="qr_token أو JSON"
            />
          </FormControl>
          <PrimaryButton
            onClick={() => submitScan(manualToken)}
            isLoading={scan.isPending}
            isDisabled={!groupId || !manualToken.trim()}
            w={{ base: "full", sm: "auto" }}
            bg="teal.500"
            _hover={{ bg: "teal.600" }}
          >
            تسجيل بالمسح النصي
          </PrimaryButton>
        </Surface>
      )}

      {/* Today's saved log — compact */}
      {groupId ? (
        <Surface mt={4}>
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontWeight="black">السجل المحفوظ لليوم</Text>
            <Badge borderRadius="full">{todayList.length}</Badge>
          </Flex>
          {loadingToday ? (
            <LoadingBlock label="جاري التحميل..." />
          ) : todayList.length === 0 ? (
            <Text fontSize="sm" color="gray.500">
              لم يُحفظ أي حضور بعد لهذا التاريخ.
            </Text>
          ) : (
            <VStack spacing={2} align="stretch" maxH="280px" overflowY="auto">
              {todayList.map((row, idx) => {
                const status = field(row, "status");
                const meta = ATTENDANCE_LABELS[status] || {
                  label: status || "—",
                  scheme: "gray",
                };
                return (
                  <Flex
                    key={row.id || idx}
                    justify="space-between"
                    align="center"
                    gap={2}
                    p={2.5}
                    borderRadius="xl"
                    bg={pageBg}
                  >
                    <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                      {studentName(row) || field(row, "student_name", "full_name")}
                    </Text>
                    <HStack spacing={2}>
                      <Text fontSize="xs" color="gray.400" display={{ base: "none", sm: "block" }}>
                        {field(row, "method") || "—"}
                      </Text>
                      <StatusBadge scheme={meta.scheme}>{meta.label}</StatusBadge>
                    </HStack>
                  </Flex>
                );
              })}
            </VStack>
          )}
        </Surface>
      ) : null}

      {/* Sticky save bar */}
      {groupId && mode === "roster" && groupStudents.length > 0 ? (
        <Box
          position="fixed"
          bottom={{ base: "72px", md: 0 }}
          left={0}
          right={0}
          zIndex={25}
          bg={stickyBg}
          borderTopWidth="1px"
          borderColor={stickyBorder}
          boxShadow="0 -10px 30px rgba(15,23,42,0.1)"
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
            <HStack spacing={3} fontSize="sm" flexWrap="wrap" justify="center">
              <Badge colorScheme="green" borderRadius="full" px={2}>
                حاضر {draftCounts.present}
              </Badge>
              <Badge colorScheme="red" borderRadius="full" px={2}>
                غائب {draftCounts.absent}
              </Badge>
              <Badge colorScheme="orange" borderRadius="full" px={2}>
                متأخر {draftCounts.late}
              </Badge>
              {isDirty ? (
                <Text fontSize="xs" color="orange.500" fontWeight="bold">
                  لديك تعديلات غير محفوظة
                </Text>
              ) : (
                <Text fontSize="xs" color="gray.500">
                  كل شيء محفوظ
                </Text>
              )}
            </HStack>
            <PrimaryButton
              leftIcon={<FaSave />}
              onClick={handleBulkSave}
              isLoading={bulk.isPending}
              isDisabled={!isDirty}
              w={{ base: "full", sm: "auto" }}
              h="48px"
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
