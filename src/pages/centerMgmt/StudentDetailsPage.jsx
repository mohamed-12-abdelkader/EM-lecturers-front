import { useState } from "react";
import { Link as RouterLink, useOutletContext, useParams } from "react-router-dom";
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
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { FaArrowRight, FaUserPlus } from "react-icons/fa";
import {
  useGroups,
  useStudent,
  useStudentQr,
  useStudentAttendanceStats,
  useStudentMutations,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage } from "../../api/centerMgmtApi";
import {
  field,
  formatDate,
  studentCode,
  studentName,
} from "./centerMgmtUtils";
import { EmptyState, KpiCard, LoadingBlock, PageHeader, Surface } from "./components/UiBits";

export default function StudentDetailsPage() {
  const { centerId } = useOutletContext();
  const { studentId } = useParams();
  const toast = useToast();
  const { data: student, isLoading } = useStudent(centerId, studentId);
  const { data: qr } = useStudentQr(centerId, studentId);
  const { data: stats } = useStudentAttendanceStats(centerId, studentId);
  const { data: groups = [] } = useGroups(centerId);
  const { enrollStudent, unenrollStudent } = useStudentMutations(centerId);
  const [groupId, setGroupId] = useState("");

  if (isLoading) return <LoadingBlock />;
  if (!student) {
    return (
      <EmptyState
        title="الطالب غير موجود"
        action={
          <Button as={RouterLink} to={`/center-mgmt/${centerId}/students`} colorScheme="blue">
            العودة للطلاب
          </Button>
        }
      />
    );
  }

  const qrImage =
    field(qr, "qr_image_base64", "qrImageBase64") ||
    field(student, "qr_image_base64", "qrImageBase64");

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
      setGroupId("");
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

  return (
    <Box>
      <PageHeader
        title={studentName(student)}
        description={`${studentCode(student)} · انضم ${formatDate(field(student, "joined_at", "joinedAt"))}`}
        actions={
          <Button
            as={RouterLink}
            to={`/center-mgmt/${centerId}/students`}
            leftIcon={<FaArrowRight />}
            variant="ghost"
            size="sm"
          >
            الطلاب
          </Button>
        }
      />

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={5}>
        <Box gridColumn={{ lg: "span 2" }}>
          <Surface mb={5}>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              <Box>
                <Text fontSize="xs" color="gray.500">
                  هاتف الطالب
                </Text>
                <Text fontWeight="medium">{field(student, "phone") || "—"}</Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500">
                  هاتف ولي الأمر
                </Text>
                <Text fontWeight="medium">
                  {field(student, "parent_phone", "parentPhone") || "—"}
                </Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500">
                  الحالة
                </Text>
                <Badge mt={1} colorScheme={student.is_active === false ? "gray" : "green"}>
                  {student.is_active === false ? "غير نشط" : "نشط"}
                </Badge>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.500">
                  ملاحظات
                </Text>
                <Text fontWeight="medium">{field(student, "notes") || "—"}</Text>
              </Box>
            </SimpleGrid>
          </Surface>

          <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3} mb={5}>
            <KpiCard
              label="حضور"
              value={stats?.present ?? 0}
              color="green"
            />
            <KpiCard label="غياب" value={stats?.absent ?? 0} color="red" />
            <KpiCard label="تأخر" value={stats?.late ?? 0} color="orange" />
            <KpiCard label="بعذر" value={stats?.excused ?? 0} color="purple" />
            <KpiCard
              label="نسبة الالتزام"
              value={
                stats?.commitmentRate != null
                  ? `${Math.round(Number(stats.commitmentRate))}%`
                  : "—"
              }
              color="blue"
            />
          </SimpleGrid>

          <Surface>
            <Text fontWeight="bold" mb={3}>
              التسجيل في مجموعة
            </Text>
            <Flex gap={3} direction={{ base: "column", sm: "row" }}>
              <FormControl>
                <FormLabel fontSize="sm">المجموعة</FormLabel>
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
              <Flex gap={2} align="flex-end">
                <Button
                  leftIcon={<FaUserPlus />}
                  colorScheme="blue"
                  borderRadius="xl"
                  onClick={handleEnroll}
                  isLoading={enrollStudent.isPending}
                >
                  تسجيل
                </Button>
                <Button
                  variant="outline"
                  borderRadius="xl"
                  onClick={handleUnenroll}
                  isLoading={unenrollStudent.isPending}
                >
                  إلغاء
                </Button>
              </Flex>
            </Flex>
          </Surface>
        </Box>

        <Surface textAlign="center">
          <Text fontWeight="bold" mb={3}>
            بطاقة QR للحضور
          </Text>
          {qrImage ? (
            <Image
              src={qrImage.startsWith("data:") ? qrImage : `data:image/png;base64,${qrImage}`}
              alt="QR"
              mx="auto"
              maxW="220px"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="gray.200"
            />
          ) : (
            <VStack py={8} color="gray.500">
              <Text fontSize="sm">لا توجد صورة QR حالياً</Text>
            </VStack>
          )}
          <Text fontSize="xs" color="gray.500" mt={3}>
            الرمز: {field(qr, "qr_token", "qrToken") || "—"}
          </Text>
          <Text fontSize="xs" color="gray.400" mt={1}>
            اطبع البطاقة أو اعرضها عند المسح
          </Text>
        </Surface>
      </SimpleGrid>
    </Box>
  );
}
