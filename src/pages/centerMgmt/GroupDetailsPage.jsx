import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Flex,
  SimpleGrid,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { FaArrowRight } from "react-icons/fa";
import { useGroup, useGroupStudents } from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { field, formatDate, formatMoney, studentCode, studentName } from "./centerMgmtUtils";
import { EmptyState, LoadingBlock, PageHeader, Surface } from "./components/UiBits";

export default function GroupDetailsPage() {
  const { groupId } = useParams();
  const { data: group, isLoading: loadingGroup } = useGroup(groupId);
  const { data: students = [], isLoading: loadingStudents } = useGroupStudents(groupId);

  if (loadingGroup) return <LoadingBlock />;
  if (!group) {
    return (
      <EmptyState
        title="المجموعة غير موجودة"
        action={
          <Button as={RouterLink} to="/center-mgmt/groups" colorScheme="blue">
            العودة للمجموعات
          </Button>
        }
      />
    );
  }

  const days = field(group, "days") || [];

  return (
    <Box>
      <PageHeader
        title={field(group, "name")}
        description="تفاصيل المجموعة وقائمة الطلاب المسجلين"
        actions={
          <Button
            as={RouterLink}
            to="/center-mgmt/groups"
            leftIcon={<FaArrowRight />}
            variant="ghost"
            size="sm"
          >
            المجموعات
          </Button>
        }
      />

      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3} mb={5}>
        <Surface>
          <Text fontSize="xs" color="gray.500">
            الوقت
          </Text>
          <Text fontWeight="bold">
            {field(group, "start_time", "startTime") || "—"} –{" "}
            {field(group, "end_time", "endTime") || "—"}
          </Text>
        </Surface>
        <Surface>
          <Text fontSize="xs" color="gray.500">
            الرسوم الشهرية
          </Text>
          <Text fontWeight="bold">
            {formatMoney(field(group, "monthly_fee", "monthlyFee"))}
          </Text>
        </Surface>
        <Surface>
          <Text fontSize="xs" color="gray.500">
            بداية الدراسة
          </Text>
          <Text fontWeight="bold">
            {formatDate(field(group, "study_start_date", "studyStartDate"))}
          </Text>
        </Surface>
        <Surface>
          <Text fontSize="xs" color="gray.500">
            الحالة
          </Text>
          <Badge colorScheme={field(group, "status") === "paused" ? "orange" : "green"} mt={1}>
            {field(group, "status") === "paused" ? "متوقفة" : "نشطة"}
          </Badge>
        </Surface>
      </SimpleGrid>

      <Surface mb={5}>
        <Text fontWeight="bold" mb={3}>
          أيام المجموعة
        </Text>
        <Wrap>
          {days.length === 0 ? (
            <Text fontSize="sm" color="gray.500">
              لا توجد أيام محددة
            </Text>
          ) : (
            days.map((d) => (
              <WrapItem key={d}>
                <Badge colorScheme="blue" px={3} py={1} borderRadius="md">
                  {d}
                </Badge>
              </WrapItem>
            ))
          )}
        </Wrap>
        {field(group, "notes") ? (
          <Text fontSize="sm" color="gray.600" mt={4}>
            {field(group, "notes")}
          </Text>
        ) : null}
      </Surface>

      <Surface>
        <Flex justify="space-between" align="center" mb={4}>
          <Text fontWeight="bold">الطلاب ({students.length})</Text>
          <Button
            as={RouterLink}
            to="/center-mgmt/students"
            size="sm"
            colorScheme="blue"
            variant="outline"
            borderRadius="lg"
          >
            إدارة الطلاب
          </Button>
        </Flex>

        {loadingStudents ? (
          <LoadingBlock label="جاري تحميل الطلاب..." />
        ) : students.length === 0 ? (
          <EmptyState title="لا يوجد طلاب في هذه المجموعة" />
        ) : (
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>الكود</Th>
                  <Th>الاسم</Th>
                  <Th>الهاتف</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {students.map((s) => (
                  <Tr key={s.id}>
                    <Td>{studentCode(s)}</Td>
                    <Td fontWeight="medium">{studentName(s)}</Td>
                    <Td>{field(s, "phone") || "—"}</Td>
                    <Td>
                      <Button
                        as={RouterLink}
                        to={`/center-mgmt/students/${s.id}`}
                        size="xs"
                        variant="ghost"
                        colorScheme="blue"
                      >
                        عرض
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Surface>
    </Box>
  );
}
