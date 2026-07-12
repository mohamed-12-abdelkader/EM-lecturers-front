import { Link as RouterLink, useOutletContext, useParams } from "react-router-dom";
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
import {
  useGroup,
  useGroupStudents,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { field, formatMoney, studentCode, studentName } from "./centerMgmtUtils";
import { EmptyState, LoadingBlock, PageHeader, Surface } from "./components/UiBits";

export default function GroupDetailsPage() {
  const { centerId, center } = useOutletContext();
  const { groupId } = useParams();
  const { data: group, isLoading: loadingGroup } = useGroup(centerId, groupId);
  const { data: students = [], isLoading: loadingStudents } = useGroupStudents(centerId, groupId);
  const currency = field(center, "currency") || "EGP";

  if (loadingGroup) return <LoadingBlock />;
  if (!group) {
    return (
      <EmptyState
        title="المجموعة غير موجودة"
        action={
          <Button as={RouterLink} to={`/center-mgmt/${centerId}/groups`} colorScheme="blue">
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
            to={`/center-mgmt/${centerId}/groups`}
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
          <Text fontWeight="bold">{field(group, "session_time", "sessionTime") || "—"}</Text>
        </Surface>
        <Surface>
          <Text fontSize="xs" color="gray.500">
            المدة
          </Text>
          <Text fontWeight="bold">
            {field(group, "duration_minutes", "durationMinutes") || "—"} دقيقة
          </Text>
        </Surface>
        <Surface>
          <Text fontSize="xs" color="gray.500">
            السعة
          </Text>
          <Text fontWeight="bold">{field(group, "max_capacity", "maxCapacity") || "—"}</Text>
        </Surface>
        <Surface>
          <Text fontSize="xs" color="gray.500">
            الرسوم
          </Text>
          <Text fontWeight="bold">
            {formatMoney(field(group, "default_fee", "defaultFee"), currency)}
          </Text>
        </Surface>
      </SimpleGrid>

      <Surface mb={5}>
        <Flex justify="space-between" align="center" mb={3} flexWrap="wrap" gap={2}>
          <Text fontWeight="bold">أيام الحضور</Text>
          <Badge colorScheme={field(group, "status") === "paused" ? "orange" : "green"}>
            {field(group, "status") === "paused" ? "متوقفة" : "نشطة"}
          </Badge>
        </Flex>
        <Wrap>
          {days.length === 0 ? (
            <Text fontSize="sm" color="gray.500">
              لم تُحدد أيام
            </Text>
          ) : (
            days.map((d) => (
              <WrapItem key={d}>
                <Badge colorScheme="blue" borderRadius="md" px={3} py={1}>
                  {d}
                </Badge>
              </WrapItem>
            ))
          )}
        </Wrap>
        {field(group, "notes") ? (
          <Text mt={3} fontSize="sm" color="gray.600">
            {field(group, "notes")}
          </Text>
        ) : null}
      </Surface>

      <Surface p={0} overflow="hidden">
        <Flex px={5} py={4} justify="space-between" align="center">
          <Text fontWeight="bold">طلاب المجموعة ({students.length})</Text>
          <Button
            as={RouterLink}
            to={`/center-mgmt/${centerId}/students`}
            size="sm"
            colorScheme="blue"
            variant="outline"
            borderRadius="lg"
          >
            إدارة الطلاب
          </Button>
        </Flex>
        {loadingStudents ? (
          <LoadingBlock />
        ) : students.length === 0 ? (
          <Box p={5}>
            <EmptyState
              title="لا يوجد طلاب في هذه المجموعة"
              description="أضف طالباً واختر هذه المجموعة عند التسجيل."
            />
          </Box>
        ) : (
          <TableContainer>
            <Table>
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
                        to={`/center-mgmt/${centerId}/students/${s.id}`}
                        size="xs"
                        variant="ghost"
                        colorScheme="blue"
                      >
                        الملف
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
