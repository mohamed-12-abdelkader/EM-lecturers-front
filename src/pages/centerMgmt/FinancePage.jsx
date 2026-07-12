import { useMemo, useState } from "react";
import {
  Badge,
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
  VStack,
} from "@chakra-ui/react";
import {
  FaUsers,
  FaMoneyBillWave,
  FaUserCheck,
  FaUserClock,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useFinanceReport, useGroups } from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import {
  MONTH_NAMES,
  currentMonthYear,
  field,
  formatMoney,
  studentName,
} from "./centerMgmtUtils";
import { EmptyState, KpiCard, LoadingBlock, PageHeader, Surface } from "./components/UiBits";

function ListBlock({ title, items, empty }) {
  return (
    <Surface>
      <Text fontWeight="bold" mb={3}>
        {title}{" "}
        <Badge ms={1} colorScheme="blue">
          {items.length}
        </Badge>
      </Text>
      {items.length === 0 ? (
        <Text fontSize="sm" color="gray.500">
          {empty}
        </Text>
      ) : (
        <TableContainer maxH="280px" overflowY="auto">
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>الطالب</Th>
                <Th>المتبقي</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map((row, idx) => (
                <Tr key={row.id || idx}>
                  <Td>{studentName(row) || field(row, "student_name")}</Td>
                  <Td>
                    {formatMoney(
                      field(row, "remaining", "amount_due", "amountDue") ?? 0
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </Surface>
  );
}

export default function FinancePage() {
  const now = currentMonthYear();
  const [month, setMonth] = useState(String(now.month));
  const [year, setYear] = useState(String(now.year));
  const [groupId, setGroupId] = useState("");

  const params = useMemo(
    () => ({
      year: Number(year),
      month: Number(month),
      groupId: groupId || undefined,
    }),
    [year, month, groupId]
  );

  const { data: groupsData } = useGroups({ limit: 100 });
  const groups = groupsData?.items || [];
  const { data, isLoading, isError, error } = useFinanceReport(params);

  if (isLoading) return <LoadingBlock />;
  if (isError) {
    return <EmptyState title="تعذر تحميل التقرير المالي" description={error?.message} />;
  }

  const unpaid = data?.unpaid || data?.unpaidList || [];
  const partial = data?.partial || data?.partialList || [];
  const exempt = data?.exempt || data?.exemptList || [];

  return (
    <>
      <PageHeader
        title="التقرير المالي"
        description="إجمالي المطلوب والمحصّل والمتبقي، مع قوائم غير المسددين."
      />

      <Surface mb={5}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
          <Select value={month} onChange={(e) => setMonth(e.target.value)} borderRadius="xl">
            {MONTH_NAMES.slice(1).map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </Select>
          <Select value={year} onChange={(e) => setYear(e.target.value)} borderRadius="xl">
            {[now.year - 1, now.year, now.year + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          <Select
            placeholder="كل المجموعات"
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
        </SimpleGrid>
      </Surface>

      <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={4} mb={6}>
        <KpiCard
          label="الطلاب"
          value={data?.studentsCount ?? data?.totalStudents ?? 0}
          icon={FaUsers}
          color="blue"
        />
        <KpiCard
          label="مشتركون"
          value={data?.subscribersCount ?? data?.subscribedCount ?? 0}
          icon={FaUserCheck}
          color="teal"
        />
        <KpiCard
          label="إجمالي المطلوب"
          value={formatMoney(data?.totalDue ?? data?.monthTotalDue)}
          icon={FaMoneyBillWave}
          color="purple"
        />
        <KpiCard
          label="المحصّل"
          value={formatMoney(data?.totalCollected ?? data?.monthCollected)}
          icon={FaUserCheck}
          color="green"
        />
        <KpiCard
          label="المتبقي"
          value={formatMoney(data?.totalRemaining ?? data?.monthRemaining)}
          icon={FaExclamationTriangle}
          color="orange"
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
        <KpiCard
          label="غير مدفوع"
          value={data?.unpaidCount ?? unpaid.length}
          icon={FaUserClock}
          color="orange"
        />
        <KpiCard
          label="دفع جزئي"
          value={data?.partialCount ?? partial.length}
          color="yellow"
        />
        <KpiCard
          label="معفى"
          value={data?.exemptCount ?? exempt.length}
          color="purple"
        />
        <KpiCard
          label="غير مشترك"
          value={data?.nonSubscribersCount ?? data?.unsubscribedCount ?? 0}
          color="red"
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <ListBlock title="لم يدفعوا" items={unpaid} empty="لا يوجد" />
        <ListBlock title="دفع جزئي" items={partial} empty="لا يوجد" />
        <ListBlock title="معفيون" items={exempt} empty="لا يوجد" />
      </SimpleGrid>

      {!data && (
        <VStack mt={6}>
          <Text fontSize="sm" color="gray.500">
            لا توجد بيانات لهذا الفلتر
          </Text>
        </VStack>
      )}
    </>
  );
}
