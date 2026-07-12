import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { FaQrcode, FaPlay } from "react-icons/fa";
import { Html5Qrcode } from "html5-qrcode";
import {
  useAttendanceMutations,
  useAttendanceSessions,
  useGroups,
  useSessionAttendance,
  useTodayAttendance,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage } from "../../api/centerMgmtApi";
import {
  ATTENDANCE_LABELS,
  field,
  formatDate,
  studentName,
  todayISO,
} from "./centerMgmtUtils";
import { EmptyState, KpiCard, LoadingBlock, PageHeader, Surface } from "./components/UiBits";

export default function AttendancePage() {
  const { centerId } = useOutletContext();
  const toast = useToast();
  const { data: groups = [] } = useGroups(centerId);
  const { data: today } = useTodayAttendance(centerId);
  const { openSession, scan } = useAttendanceMutations(centerId);

  const [groupId, setGroupId] = useState("");
  const [sessionDate, setSessionDate] = useState(todayISO());
  const [sessionId, setSessionId] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const lastScanRef = useRef("");

  const { data: sessionsData, isLoading: loadingSessions } = useAttendanceSessions(centerId, {
    groupId: groupId || undefined,
    limit: 10,
  });
  const { data: sessionRecords = [], isLoading: loadingRecords } = useSessionAttendance(
    centerId,
    sessionId
  );

  const sessions = sessionsData?.items || [];

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  const handleOpenSession = async () => {
    if (!groupId) {
      toast({ title: "اختر مجموعة أولاً", status: "warning", duration: 2000 });
      return;
    }
    try {
      const session = await openSession.mutateAsync({
        groupId: Number(groupId),
        sessionDate,
        title: `حضور ${sessionDate}`,
      });
      setSessionId(String(session.id));
      toast({ title: "تم فتح جلسة الحضور", status: "success", duration: 2000 });
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  const processScan = async (decodedText) => {
    if (!decodedText || decodedText === lastScanRef.current) return;
    lastScanRef.current = decodedText;
    setTimeout(() => {
      lastScanRef.current = "";
    }, 2500);

    let payload = { groupId: groupId ? Number(groupId) : undefined };
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed?.token || parsed?.qrToken) {
        payload.qrToken = parsed.token || parsed.qrToken;
      } else {
        payload.qrPayload = decodedText;
      }
    } catch {
      if (/^[0-9a-f-]{36}$/i.test(decodedText.trim())) {
        payload.qrToken = decodedText.trim();
      } else {
        payload.qrPayload = decodedText;
      }
    }

    try {
      await scan.mutateAsync(payload);
      toast({ title: "تم تسجيل الحضور", status: "success", duration: 1800 });
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل المسح"),
        status: err?.response?.status === 409 ? "warning" : "error",
        duration: 3000,
      });
    }
  };

  const startScanner = async () => {
    if (!groupId) {
      toast({ title: "اختر مجموعة قبل المسح", status: "warning", duration: 2000 });
      return;
    }
    try {
      const scanner = new Html5Qrcode("cm-qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (text) => processScan(text),
        () => {}
      );
      setScanning(true);
    } catch (err) {
      toast({
        title: "تعذر فتح الكاميرا",
        description: err?.message || "تحقق من صلاحيات الكاميرا",
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

  const handleManualScan = async () => {
    if (!manualToken.trim()) return;
    await processScan(manualToken.trim());
    setManualToken("");
  };

  return (
    <Box>
      <PageHeader
        title="الحضور"
        description="افتح جلسة، امسح QR، أو سجّل يدوياً. التكرار لنفس اليوم يُرفض."
      />

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={5}>
        <KpiCard label="حاضر اليوم" value={today?.present ?? 0} color="green" />
        <KpiCard label="غائب اليوم" value={today?.absent ?? 0} color="red" />
        <KpiCard label="متأخر" value={today?.late ?? 0} color="orange" />
        <KpiCard label="بعذر" value={today?.excused ?? 0} color="purple" />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
        <Surface>
          <Text fontWeight="bold" mb={4}>
            إعداد الجلسة والمسح
          </Text>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>المجموعة</FormLabel>
              <Select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                borderRadius="xl"
                placeholder="اختر مجموعة"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {field(g, "name")}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>تاريخ الجلسة</FormLabel>
              <Input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                borderRadius="xl"
              />
            </FormControl>
            <Button
              leftIcon={<FaPlay />}
              colorScheme="blue"
              borderRadius="xl"
              onClick={handleOpenSession}
              isLoading={openSession.isPending}
            >
              فتح جلسة حضور
            </Button>

            <Box
              id="cm-qr-reader"
              borderRadius="xl"
              overflow="hidden"
              bg="black"
              minH={scanning ? "260px" : "0"}
              display={scanning ? "block" : "none"}
            />

            <Flex gap={2}>
              {!scanning ? (
                <Button
                  leftIcon={<FaQrcode />}
                  colorScheme="teal"
                  borderRadius="xl"
                  flex={1}
                  onClick={startScanner}
                >
                  تشغيل الكاميرا
                </Button>
              ) : (
                <Button colorScheme="red" borderRadius="xl" flex={1} onClick={stopScanner}>
                  إيقاف المسح
                </Button>
              )}
            </Flex>

            <FormControl>
              <FormLabel>أو أدخل رمز QR يدوياً</FormLabel>
              <Flex gap={2}>
                <Input
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="qrToken أو payload"
                  borderRadius="xl"
                />
                <Button
                  colorScheme="blue"
                  borderRadius="xl"
                  onClick={handleManualScan}
                  isLoading={scan.isPending}
                >
                  تسجيل
                </Button>
              </Flex>
            </FormControl>
          </VStack>
        </Surface>

        <Surface p={0} overflow="hidden">
          <Box px={5} py={4}>
            <Text fontWeight="bold">جلسات الحضور</Text>
          </Box>
          {loadingSessions ? (
            <LoadingBlock />
          ) : sessions.length === 0 ? (
            <Box p={5}>
              <EmptyState title="لا توجد جلسات بعد" description="افتح جلسة جديدة للبدء." />
            </Box>
          ) : (
            <TableContainer>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>التاريخ</Th>
                    <Th>العنوان</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {sessions.map((s) => (
                    <Tr
                      key={s.id}
                      bg={String(s.id) === String(sessionId) ? "blue.50" : undefined}
                      cursor="pointer"
                      onClick={() => setSessionId(String(s.id))}
                    >
                      <Td>{formatDate(field(s, "session_date", "sessionDate"))}</Td>
                      <Td>{field(s, "title") || "جلسة"}</Td>
                      <Td>
                        <Button size="xs" variant="ghost" colorScheme="blue">
                          عرض
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}

          {sessionId ? (
            <Box borderTopWidth="1px" borderColor="gray.100">
              <Box px={5} py={3}>
                <Text fontWeight="bold" fontSize="sm">
                  سجلات الجلسة
                </Text>
              </Box>
              {loadingRecords ? (
                <LoadingBlock label="تحميل السجلات..." />
              ) : sessionRecords.length === 0 ? (
                <Text px={5} pb={4} fontSize="sm" color="gray.500">
                  لا توجد سجلات بعد — ابدأ بالمسح
                </Text>
              ) : (
                <TableContainer>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>الطالب</Th>
                        <Th>الحالة</Th>
                        <Th>الطريقة</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {sessionRecords.map((r) => {
                        const status = field(r, "status") || "present";
                        const meta = ATTENDANCE_LABELS[status] || ATTENDANCE_LABELS.present;
                        return (
                          <Tr key={r.id}>
                            <Td>{studentName(r) || field(r, "student_id", "studentId")}</Td>
                            <Td>
                              <Badge colorScheme={meta.scheme}>{meta.label}</Badge>
                            </Td>
                            <Td>{field(r, "method") || "—"}</Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          ) : null}
        </Surface>
      </SimpleGrid>
    </Box>
  );
}
