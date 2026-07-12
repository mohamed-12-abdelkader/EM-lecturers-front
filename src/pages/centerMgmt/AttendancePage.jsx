import { useEffect, useMemo, useRef, useState } from "react";
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
  Textarea,
  Th,
  Thead,
  Tr,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { FaQrcode, FaSave, FaUserCheck } from "react-icons/fa";
import { Html5Qrcode } from "html5-qrcode";
import {
  useAttendanceMutations,
  useGroupStudents,
  useGroups,
  useTodayAttendance,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage } from "../../api/centerMgmtApi";
import {
  ATTENDANCE_LABELS,
  field,
  parseQrScan,
  studentName,
  todayISO,
} from "./centerMgmtUtils";
import { EmptyState, KpiCard, LoadingBlock, PageHeader, Surface } from "./components/UiBits";

export default function AttendancePage() {
  const toast = useToast();
  const { data: groupsData } = useGroups({ limit: 100, status: "active" });
  const groups = groupsData?.items || [];

  const [groupId, setGroupId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [manualToken, setManualToken] = useState("");
  const [scanStatus, setScanStatus] = useState("present");
  const [scanning, setScanning] = useState(false);
  const [bulkMap, setBulkMap] = useState({});
  const scannerRef = useRef(null);
  const lastScanRef = useRef("");

  const todayParams = useMemo(
    () => ({ groupId: groupId || undefined }),
    [groupId]
  );
  const { data: today, isLoading: loadingToday, refetch: refetchToday } =
    useTodayAttendance(todayParams);
  const { data: groupStudents = [], isLoading: loadingStudents } = useGroupStudents(groupId);
  const { scan, record, bulk } = useAttendanceMutations();

  useEffect(() => {
    const map = {};
    groupStudents.forEach((s) => {
      map[s.id] = "present";
    });
    setBulkMap(map);
  }, [groupStudents]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  const submitScan = async (raw) => {
    if (!groupId) {
      toast({ title: "اختر المجموعة أولاً", status: "warning", duration: 2500 });
      return;
    }
    const parsed = parseQrScan(raw);
    if (!parsed?.qrToken && !parsed?.qrPayload) {
      toast({ title: "رمز QR غير صالح", status: "warning", duration: 2500 });
      return;
    }
    try {
      await scan.mutateAsync({
        ...(parsed.qrPayload ? { qrPayload: parsed.qrPayload } : { qrToken: parsed.qrToken }),
        groupId: Number(groupId),
        status: scanStatus,
      });
      toast({ title: "تم تسجيل الحضور", status: "success", duration: 2000 });
      setManualToken("");
      refetchToday();
    } catch (err) {
      const status = err?.response?.status;
      toast({
        title: apiErrorMessage(err, status === 409 ? "مسجّل مسبقاً لهذا اليوم" : undefined),
        status: status === 409 ? "warning" : "error",
        duration: 3000,
      });
    }
  };

  const startScanner = async () => {
    if (!groupId) {
      toast({ title: "اختر المجموعة أولاً", status: "warning", duration: 2500 });
      return;
    }
    try {
      const scanner = new Html5Qrcode("center-mgmt-qr-reader");
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 220, height: 220 } },
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
        // ignore
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleManualRecord = async () => {
    if (!groupId || !manualToken) {
      toast({ title: "المجموعة ومعرّف الطالب مطلوبان", status: "warning", duration: 2500 });
      return;
    }
    // allow either QR token text OR numeric studentId
    if (/^\d+$/.test(manualToken.trim())) {
      try {
        await record.mutateAsync({
          studentId: Number(manualToken.trim()),
          groupId: Number(groupId),
          status: scanStatus,
          date,
          notes: null,
        });
        toast({ title: "تم التسجيل اليدوي", status: "success", duration: 2000 });
        setManualToken("");
        refetchToday();
      } catch (err) {
        toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
      }
      return;
    }
    await submitScan(manualToken);
  };

  const handleBulkSave = async () => {
    if (!groupId) {
      toast({ title: "اختر المجموعة", status: "warning", duration: 2500 });
      return;
    }
    const records = Object.entries(bulkMap).map(([studentId, status]) => ({
      studentId: Number(studentId),
      status,
    }));
    if (!records.length) {
      toast({ title: "لا يوجد طلاب", status: "warning", duration: 2000 });
      return;
    }
    try {
      await bulk.mutateAsync({
        groupId: Number(groupId),
        date,
        records,
      });
      toast({ title: "تم حفظ الحضور الجماعي", status: "success", duration: 2000 });
      refetchToday();
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  const summary = today?.summary || today || {};
  const todayList = today?.items || today?.records || today?.attendance || [];

  return (
    <>
      <PageHeader
        title="الحضور"
        description="مسح QR، تسجيل يدوي، أو كشف جماعي للمجموعة."
      />

      <Surface mb={5}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
          <FormControl>
            <FormLabel>المجموعة</FormLabel>
            <Select
              placeholder="اختر المجموعة"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              borderRadius="xl"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {field(g, "name")}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>التاريخ</FormLabel>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              borderRadius="xl"
            />
          </FormControl>
          <FormControl>
            <FormLabel>حالة المسح / اليدوي</FormLabel>
            <Select
              value={scanStatus}
              onChange={(e) => setScanStatus(e.target.value)}
              borderRadius="xl"
            >
              {Object.entries(ATTENDANCE_LABELS).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </FormControl>
        </SimpleGrid>
      </Surface>

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={5}>
        <KpiCard
          label="حاضر اليوم"
          value={summary.present ?? summary.todayPresent ?? 0}
          icon={FaUserCheck}
          color="green"
        />
        <KpiCard label="غائب" value={summary.absent ?? summary.todayAbsent ?? 0} color="red" />
        <KpiCard label="متأخر" value={summary.late ?? summary.todayLate ?? 0} color="orange" />
        <KpiCard
          label="بعذر"
          value={summary.excused ?? summary.todayExcused ?? 0}
          color="purple"
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} mb={5}>
        <Surface>
          <Text fontWeight="bold" mb={3}>
            مسح QR
          </Text>
          <Box
            id="center-mgmt-qr-reader"
            borderRadius="xl"
            overflow="hidden"
            mb={3}
            minH={scanning ? "240px" : "0"}
          />
          <Flex gap={2} mb={4}>
            {!scanning ? (
              <Button
                leftIcon={<FaQrcode />}
                colorScheme="blue"
                borderRadius="xl"
                onClick={startScanner}
                isDisabled={!groupId}
              >
                تشغيل الكاميرا
              </Button>
            ) : (
              <Button colorScheme="red" variant="outline" borderRadius="xl" onClick={stopScanner}>
                إيقاف المسح
              </Button>
            )}
          </Flex>

          <FormControl mb={3}>
            <FormLabel>إدخال يدوي (QR token أو رقم الطالب)</FormLabel>
            <Textarea
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              borderRadius="xl"
              rows={2}
              placeholder="الصق الرمز أو اكتب studentId"
            />
          </FormControl>
          <Button
            colorScheme="teal"
            borderRadius="xl"
            onClick={handleManualRecord}
            isLoading={scan.isPending || record.isPending}
            isDisabled={!groupId}
          >
            تسجيل
          </Button>
        </Surface>

        <Surface>
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontWeight="bold">تسجيل جماعي</Text>
            <Button
              leftIcon={<FaSave />}
              size="sm"
              colorScheme="blue"
              borderRadius="lg"
              onClick={handleBulkSave}
              isLoading={bulk.isPending}
              isDisabled={!groupId}
            >
              حفظ الكل
            </Button>
          </Flex>

          {!groupId ? (
            <EmptyState title="اختر مجموعة لعرض الطلاب" />
          ) : loadingStudents ? (
            <LoadingBlock />
          ) : groupStudents.length === 0 ? (
            <EmptyState title="لا يوجد طلاب في المجموعة" />
          ) : (
            <TableContainer maxH="360px" overflowY="auto">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>الطالب</Th>
                    <Th>الحالة</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {groupStudents.map((s) => (
                    <Tr key={s.id}>
                      <Td>{studentName(s)}</Td>
                      <Td>
                        <Select
                          size="sm"
                          value={bulkMap[s.id] || "present"}
                          onChange={(e) =>
                            setBulkMap((m) => ({ ...m, [s.id]: e.target.value }))
                          }
                          borderRadius="md"
                        >
                          {Object.entries(ATTENDANCE_LABELS).map(([key, meta]) => (
                            <option key={key} value={key}>
                              {meta.label}
                            </option>
                          ))}
                        </Select>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </Surface>
      </SimpleGrid>

      <Surface>
        <Text fontWeight="bold" mb={3}>
          ملخص اليوم
        </Text>
        {loadingToday ? (
          <LoadingBlock />
        ) : !Array.isArray(todayList) || todayList.length === 0 ? (
          <Text fontSize="sm" color="gray.500">
            لا توجد سجلات حضور لليوم بعد
          </Text>
        ) : (
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>الطالب</Th>
                  <Th>الحالة</Th>
                  <Th>الوقت</Th>
                </Tr>
              </Thead>
              <Tbody>
                {todayList.map((row, idx) => {
                  const status = field(row, "status");
                  const meta = ATTENDANCE_LABELS[status] || {
                    label: status || "—",
                    scheme: "gray",
                  };
                  return (
                    <Tr key={row.id || idx}>
                      <Td>{studentName(row) || field(row, "student_name")}</Td>
                      <Td>
                        <Badge colorScheme={meta.scheme}>{meta.label}</Badge>
                      </Td>
                      <Td>
                        {field(row, "time", "scanned_at", "created_at", "createdAt") || "—"}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Surface>
    </>
  );
}
