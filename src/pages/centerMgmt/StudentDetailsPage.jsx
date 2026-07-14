import { useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Image,
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
import { FaArrowRight, FaPrint } from "react-icons/fa";
import {
  useGroups,
  useStudent,
  useStudentAttendanceReport,
  useStudentMutations,
  useStudentQr,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage } from "../../api/centerMgmtApi";
import {
  ATTENDANCE_LABELS,
  currentMonthYear,
  field,
  formatDate,
  monthFirstLast,
  studentCode,
  studentName,
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

export default function StudentDetailsPage() {
  const { studentId } = useParams();
  const toast = useToast();
  const now = currentMonthYear();
  const [from, setFrom] = useState(monthFirstLast(now.year, now.month).from);
  const [to, setTo] = useState(monthFirstLast(now.year, now.month).to);
  const [groupId, setGroupId] = useState("");
  const [enrollGroupId, setEnrollGroupId] = useState("");

  const reportParams = useMemo(
    () => ({
      from,
      to,
      group_id: groupId || undefined,
    }),
    [from, to, groupId]
  );

  const { data: student, isLoading } = useStudent(studentId);
  const { data: qr } = useStudentQr(studentId);
  const { data: report } = useStudentAttendanceReport(studentId, reportParams);
  const { data: groupsData } = useGroups({ limit: 100 });
  const groups = groupsData?.items || [];
  const { enrollStudent, unenrollStudent } = useStudentMutations();

  if (isLoading) return <LoadingBlock />;
  if (!student) {
    return (
      <EmptyState
        title="الطالب غير موجود"
        action={
          <PrimaryButton as={RouterLink} to="/center-mgmt/students">
            العودة للطلاب
          </PrimaryButton>
        }
      />
    );
  }

  const qrImage =
    field(qr, "qr_image_base64", "qrImageBase64") ||
    field(student, "qr_image_base64", "qrImageBase64");
  const enrolledGroups = field(student, "groups") || [];
  const totals = report?.totals || {};
  const records = report?.records || [];

  const handlePrintQr = () => {
    const w = window.open("", "_blank");
    if (!w || !qrImage) return;
    const src = qrImage.startsWith("data:") ? qrImage : `data:image/png;base64,${qrImage}`;
    w.document.write(`
      <html><head><title>${studentCode(student)}</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:24px">
        <h2>${studentName(student)}</h2>
        <p>${studentCode(student)}</p>
        <img src="${src}" style="width:280px;height:280px" />
      </body></html>
    `);
    w.document.close();
    w.focus();
    w.print();
  };

  const handleEnroll = async () => {
    if (!enrollGroupId) {
      toast({ title: "اختر مجموعة", status: "warning", duration: 2000 });
      return;
    }
    try {
      await enrollStudent.mutateAsync({
        studentId: Number(studentId),
        groupId: Number(enrollGroupId),
      });
      toast({ title: "تم تسجيل الطالب في المجموعة", status: "success", duration: 2000 });
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  const handleUnenroll = async (gid) => {
    try {
      await unenrollStudent.mutateAsync({
        studentId: Number(studentId),
        groupId: Number(gid),
      });
      toast({ title: "تم إزالة الطالب من المجموعة", status: "success", duration: 2000 });
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  return (
    <Box>
      <PageHeader
        title={studentName(student)}
        description={`${studentCode(student)} · ${field(student, "phone") || ""}`}
        actions={
          <Button
            as={RouterLink}
            to="/center-mgmt/students"
            leftIcon={<FaArrowRight />}
            variant="ghost"
            size="sm"
            borderRadius="xl"
          >
            الطلاب
          </Button>
        }
      />

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={{ base: 3, md: 5 }} mb={5}>
        <Surface>
          <Text fontWeight="bold" mb={3}>بيانات الاتصال</Text>
          <VStack align="stretch" spacing={2} fontSize="sm">
            <Flex justify="space-between" gap={2}>
              <Text color="gray.500">الهاتف</Text>
              <Text fontWeight="medium">{field(student, "phone") || "—"}</Text>
            </Flex>
            <Flex justify="space-between" gap={2}>
              <Text color="gray.500">ولي الأمر</Text>
              <Text fontWeight="medium">{field(student, "parent_phone", "parentPhone") || "—"}</Text>
            </Flex>
          </VStack>
        </Surface>

        <Surface>
          <Text fontWeight="bold" mb={3}>المجموعات</Text>
          <VStack align="stretch" spacing={2} mb={3}>
            {Array.isArray(enrolledGroups) && enrolledGroups.length > 0 ? (
              enrolledGroups.map((g) => (
                <Flex key={g.id} justify="space-between" align="center" gap={2}>
                  <StatusBadge scheme="blue">{field(g, "name")}</StatusBadge>
                  <Button size="xs" variant="ghost" colorScheme="red" onClick={() => handleUnenroll(g.id)}>
                    إزالة
                  </Button>
                </Flex>
              ))
            ) : (
              <Text fontSize="sm" color="gray.500">غير مسجّل في مجموعات</Text>
            )}
          </VStack>
          <FormControl mb={2}>
            <FormLabel fontSize="sm">تسجيل في مجموعة إضافية</FormLabel>
            <Select
              value={enrollGroupId}
              onChange={(e) => setEnrollGroupId(e.target.value)}
              borderRadius="xl"
              size="sm"
            >
              <option value="">—</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{field(g, "name")}</option>
              ))}
            </Select>
          </FormControl>
          <PrimaryButton
            size="sm"
            onClick={handleEnroll}
            isLoading={enrollStudent.isPending}
            w="full"
          >
            تسجيل
          </PrimaryButton>
        </Surface>

        <Surface textAlign="center">
          <Text fontWeight="bold" mb={3}>بطاقة QR</Text>
          {qrImage ? (
            <Image
              src={qrImage.startsWith("data:") ? qrImage : `data:image/png;base64,${qrImage}`}
              alt="QR"
              mx="auto"
              w={{ base: "160px", md: "200px" }}
              maxW="100%"
              borderRadius="xl"
            />
          ) : (
            <Text fontSize="sm" color="gray.500">لا توجد صورة QR</Text>
          )}
          <Text fontSize="xs" color="gray.500" mt={2} wordBreak="break-all" px={1}>
            {field(qr, "qr_token", "qrToken") || field(student, "qr_token", "qrToken") || ""}
          </Text>
          <Button
            leftIcon={<FaPrint />}
            size="sm"
            mt={3}
            borderRadius="lg"
            onClick={handlePrintQr}
            isDisabled={!qrImage}
            w={{ base: "full", sm: "auto" }}
          >
            طباعة
          </Button>
        </Surface>
      </SimpleGrid>

      <Surface>
        <Text fontWeight="bold" mb={3}>تقرير الحضور</Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={4}>
          <FormControl>
            <FormLabel fontSize="xs" mb={1}>من</FormLabel>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              size="sm"
              borderRadius="lg"
              w="full"
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="xs" mb={1}>إلى</FormLabel>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              size="sm"
              borderRadius="lg"
              w="full"
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="xs" mb={1}>المجموعة</FormLabel>
            <Select
              placeholder="كل المجموعات"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              size="sm"
              borderRadius="lg"
              w="full"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{field(g, "name")}</option>
              ))}
            </Select>
          </FormControl>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={{ base: 2, md: 3 }} mb={4}>
          <KpiCard label="حاضر" value={totals.present ?? 0} color="green" />
          <KpiCard label="غائب" value={totals.absent ?? 0} color="red" />
          <KpiCard label="متأخر" value={totals.late ?? 0} color="orange" />
          <KpiCard label="بعذر" value={totals.excused ?? 0} color="purple" />
          <KpiCard label="إجمالي الأيام" value={totals.total_days ?? totals.totalDays ?? 0} color="blue" />
        </SimpleGrid>

        {Array.isArray(records) && records.length > 0 ? (
          <>
            <MobileOnly>
              <VStack spacing={3} align="stretch">
                {records.map((d, idx) => {
                  const status = field(d, "status");
                  const meta = ATTENDANCE_LABELS[status] || { label: status || "—", scheme: "gray" };
                  return (
                    <ListCard key={d.id || idx}>
                      <Flex justify="space-between" align="center" gap={2} mb={2}>
                        <Text fontWeight="bold" fontSize="sm">
                          {formatDate(field(d, "attendance_date", "date"))}
                        </Text>
                        <StatusBadge scheme={meta.scheme}>{meta.label}</StatusBadge>
                      </Flex>
                      <HStack spacing={3} fontSize="sm" color="gray.600" flexWrap="wrap">
                        <Text>الطريقة: {field(d, "method") || "—"}</Text>
                        {field(d, "notes") ? (
                          <>
                            <Text color="gray.400">·</Text>
                            <Text noOfLines={2}>{field(d, "notes")}</Text>
                          </>
                        ) : null}
                      </HStack>
                    </ListCard>
                  );
                })}
              </VStack>
            </MobileOnly>

            <DesktopOnly>
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>التاريخ</Th>
                      <Th>الحالة</Th>
                      <Th>الطريقة</Th>
                      <Th>ملاحظات</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {records.map((d, idx) => {
                      const status = field(d, "status");
                      const meta = ATTENDANCE_LABELS[status] || { label: status || "—", scheme: "gray" };
                      return (
                        <Tr key={d.id || idx}>
                          <Td>{formatDate(field(d, "attendance_date", "date"))}</Td>
                          <Td><StatusBadge scheme={meta.scheme}>{meta.label}</StatusBadge></Td>
                          <Td>{field(d, "method") || "—"}</Td>
                          <Td>{field(d, "notes") || "—"}</Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </DesktopOnly>
          </>
        ) : (
          <Text fontSize="sm" color="gray.500">لا توجد سجلات في هذه الفترة</Text>
        )}
      </Surface>
    </Box>
  );
}
