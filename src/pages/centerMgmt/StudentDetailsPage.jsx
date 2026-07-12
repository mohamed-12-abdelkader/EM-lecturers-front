import { useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Image,
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
import { FaArrowRight } from "react-icons/fa";
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
  studentCode,
  studentName,
} from "./centerMgmtUtils";
import { EmptyState, KpiCard, LoadingBlock, PageHeader, Surface } from "./components/UiBits";

export default function StudentDetailsPage() {
  const { studentId } = useParams();
  const toast = useToast();
  const now = currentMonthYear();
  const [month, setMonth] = useState(String(now.month));
  const [year, setYear] = useState(String(now.year));
  const [groupId, setGroupId] = useState("");

  const reportParams = useMemo(
    () => ({
      year: Number(year),
      month: Number(month),
      groupId: groupId || undefined,
    }),
    [year, month, groupId]
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
          <Button as={RouterLink} to="/center-mgmt/students" colorScheme="blue">
            العودة للطلاب
          </Button>
        }
      />
    );
  }

  const qrImage =
    field(qr, "qr_image_base64", "qrImageBase64") ||
    field(student, "qr_image_base64", "qrImageBase64");

  const enrolledGroups =
    field(student, "groups") ||
    field(student, "enrollments") ||
    [];

  const handleEnroll = async () => {
    if (!groupId) {
      toast({ title: "اختر مجموعة", status: "warning", duration: 2000 });
      return;
    }
    try {
      await enrollStudent.mutateAsync({
        studentId: Number(studentId),
        payload: { groupId: Number(groupId) },
      });
      toast({ title: "تم تسجيل الطالب في المجموعة", status: "success", duration: 2000 });
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  const handleUnenroll = async () => {
    if (!groupId) {
      toast({ title: "اختر المجموعة لإلغاء التسجيل", status: "warning", duration: 2000 });
      return;
    }
    try {
      await unenrollStudent.mutateAsync({
        studentId: Number(studentId),
        payload: { groupId: Number(groupId) },
      });
      toast({ title: "تم إلغاء التسجيل", status: "success", duration: 2000 });
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  const days = report?.days || report?.records || report?.items || [];

  return (
    <Box>
      <PageHeader
        title={studentName(student)}
        description={`${studentCode(student)} · انضم ${formatDate(field(student, "joined_at", "joinedAt"))}`}
        actions={
          <Button
            as={RouterLink}
            to="/center-mgmt/students"
            leftIcon={<FaArrowRight />}
            variant="ghost"
            size="sm"
          >
            الطلاب
          </Button>
        }
      />

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={5} mb={5}>
        <Surface>
          <Text fontWeight="bold" mb={3}>
            بيانات الاتصال
          </Text>
          <VStack align="stretch" spacing={2} fontSize="sm">
            <Flex justify="space-between">
              <Text color="gray.500">الهاتف</Text>
              <Text>{field(student, "phone") || "—"}</Text>
            </Flex>
            <Flex justify="space-between">
              <Text color="gray.500">ولي الأمر</Text>
              <Text>{field(student, "parent_phone", "parentPhone") || "—"}</Text>
            </Flex>
            <Flex justify="space-between">
              <Text color="gray.500">ملاحظات</Text>
              <Text textAlign="left" maxW="60%">
                {field(student, "notes") || "—"}
              </Text>
            </Flex>
          </VStack>
        </Surface>

        <Surface>
          <Text fontWeight="bold" mb={3}>
            المجموعات
          </Text>
          {Array.isArray(enrolledGroups) && enrolledGroups.length > 0 ? (
            <Flex gap={2} flexWrap="wrap" mb={3}>
              {enrolledGroups.map((g) => (
                <Badge key={g.id || g.groupId} colorScheme="blue">
                  {field(g, "name", "group_name", "groupName") || `#${g.id || g.groupId}`}
                </Badge>
              ))}
            </Flex>
          ) : (
            <Text fontSize="sm" color="gray.500" mb={3}>
              غير مسجّل في مجموعات (أو غير مُرجع من الـ API)
            </Text>
          )}
          <FormControl mb={2}>
            <FormLabel fontSize="sm">اختر مجموعة</FormLabel>
            <Select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              borderRadius="xl"
              size="sm"
            >
              <option value="">—</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {field(g, "name")}
                </option>
              ))}
            </Select>
          </FormControl>
          <Flex gap={2}>
            <Button
              size="sm"
              colorScheme="blue"
              borderRadius="lg"
              onClick={handleEnroll}
              isLoading={enrollStudent.isPending}
              flex={1}
            >
              تسجيل
            </Button>
            <Button
              size="sm"
              variant="outline"
              borderRadius="lg"
              onClick={handleUnenroll}
              isLoading={unenrollStudent.isPending}
              flex={1}
            >
              إزالة
            </Button>
          </Flex>
        </Surface>

        <Surface textAlign="center">
          <Text fontWeight="bold" mb={3}>
            بطاقة QR
          </Text>
          {qrImage ? (
            <Image
              src={qrImage.startsWith("data:") ? qrImage : `data:image/png;base64,${qrImage}`}
              alt="QR"
              mx="auto"
              maxW="200px"
              borderRadius="lg"
            />
          ) : (
            <Text fontSize="sm" color="gray.500">
              لا توجد صورة QR
            </Text>
          )}
          <Text fontSize="xs" color="gray.500" mt={2} wordBreak="break-all">
            {field(qr, "qr_token", "qrToken") || field(student, "qr_token", "qrToken") || ""}
          </Text>
        </Surface>
      </SimpleGrid>

      <Surface mb={5}>
        <Flex
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          gap={3}
          mb={4}
          direction={{ base: "column", md: "row" }}
        >
          <Text fontWeight="bold">تقرير الحضور الشهري</Text>
          <Flex gap={2}>
            <Select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              size="sm"
              borderRadius="lg"
              w="120px"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </Select>
            <Select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              size="sm"
              borderRadius="lg"
              w="100px"
            >
              {[now.year - 1, now.year, now.year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </Flex>
        </Flex>

        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={3} mb={4}>
          <KpiCard label="حاضر" value={report?.presentCount ?? report?.present ?? 0} color="green" />
          <KpiCard label="غائب" value={report?.absentCount ?? report?.absent ?? 0} color="red" />
          <KpiCard label="متأخر" value={report?.lateCount ?? report?.late ?? 0} color="orange" />
          <KpiCard label="بعذر" value={report?.excusedCount ?? report?.excused ?? 0} color="purple" />
          <KpiCard
            label="نسبة الالتزام"
            value={`${report?.attendanceRate ?? report?.commitmentRate ?? "—"}%`}
            color="blue"
          />
        </SimpleGrid>

        {Array.isArray(days) && days.length > 0 ? (
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>التاريخ</Th>
                  <Th>الحالة</Th>
                  <Th>ملاحظات</Th>
                </Tr>
              </Thead>
              <Tbody>
                {days.map((d, idx) => {
                  const status = field(d, "status");
                  const meta = ATTENDANCE_LABELS[status] || { label: status || "—", scheme: "gray" };
                  return (
                    <Tr key={d.id || idx}>
                      <Td>{formatDate(field(d, "date", "attendance_date"))}</Td>
                      <Td>
                        <Badge colorScheme={meta.scheme}>{meta.label}</Badge>
                      </Td>
                      <Td>{field(d, "notes") || "—"}</Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
        ) : (
          <Text fontSize="sm" color="gray.500">
            لا توجد سجلات حضور لهذا الشهر
          </Text>
        )}
      </Surface>
    </Box>
  );
}
