import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Input,
  Select,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import {
  FaUsers,
  FaMoneyBillWave,
  FaUserCheck,
  FaUserClock,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useFinanceDashboard } from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { currentMonthYear, field, formatMoney } from "./centerMgmtUtils";
import { EmptyState, KpiCard, LoadingBlock, PageHeader, Surface } from "./components/UiBits";

export default function FinancePage() {
  const { centerId, center } = useOutletContext();
  const now = currentMonthYear();
  const [month, setMonth] = useState(String(now.month));
  const [year, setYear] = useState(String(now.year));
  const [search, setSearch] = useState("");
  const params = useMemo(
    () => ({
      month: Number(month) || undefined,
      year: Number(year) || undefined,
      search: search || undefined,
    }),
    [month, year, search]
  );
  const { data, isLoading, isError, error } = useFinanceDashboard(centerId, params);
  const currency = field(center, "currency") || "EGP";

  if (isLoading) return <LoadingBlock />;
  if (isError) {
    return <EmptyState title="تعذر تحميل الماليات" description={error?.message} />;
  }

  return (
    <>
      <PageHeader
        title="الماليات"
        description="إيرادات الشهر، المدفوعون، والمتأخرات في نظرة واحدةحدة."
      />

      <Surface mb={5}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
          <Select value={month} onChange={(e) => setMonth(e.target.value)} borderRadius="xl">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>شهر {i + 1}</option>
            ))}
          </Select>
          <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} borderRadius="xl" />
          <Input
            placeholder="بحث باسم الطالب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            borderRadius="xl"
          />
        </SimpleGrid>
      </Surface>

      <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4} mb={6}>
        <KpiCard
          label="عدد الطلاب"
          value={field(data, "studentsCount", "students_count") ?? 0}
          icon={FaUsers}
          color="blue"
        />
        <KpiCard
          label="الإيرادات"
          value={formatMoney(field(data, "revenue", "totalRevenue", "monthlyRevenue"), currency)}
          icon={FaMoneyBillWave}
          color="green"
        />
        <KpiCard
          label="مدفوعون"
          value={field(data, "paidCount", "paid_count") ?? 0}
          icon={FaUserCheck}
          color="teal"
        />
        <KpiCard
          label="غير مدفوعين"
          value={field(data, "unpaidCount", "unpaid_count") ?? 0}
          icon={FaUserClock}
          color="orange"
        />
        <KpiCard
          label="متأخرون"
          value={field(data, "arrearsCount", "lateCount", "arrears_count") ?? 0}
          icon={FaExclamationTriangle}
          color="red"
        />
        <KpiCard
          label="إجمالي المتأخرات"
          value={formatMoney(field(data, "arrearsTotal", "totalArrears", "arrears_total"), currency)}
          icon={FaMoneyBillWave}
          color="red"
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Breakdown title="حسب الصف" items={field(data, "byGrade", "revenueByGrade") || []} currency={currency} />
        <Breakdown title="حسب المجموعة" items={field(data, "byGroup", "revenueByGroup") || []} currency={currency} />
        <Breakdown title="حسب الشهر" items={field(data, "byMonth", "revenueByMonth") || []} currency={currency} />
      </SimpleGrid>
    </>
  );
}

function Breakdown({ title, items, currency }) {
  const list = Array.isArray(items) ? items : [];
  return (
    <Surface>
      <Text fontWeight="bold" mb={3}>
        {title}
      </Text>
      {list.length === 0 ? (
        <Text fontSize="sm" color="gray.500">
          لا توجد بيانات
        </Text>
      ) : (
        list.slice(0, 8).map((item, idx) => (
          <SimpleGrid key={idx} columns={2} py={2} borderBottomWidth={idx < list.length - 1 ? "1px" : 0} borderColor="gray.100">
            <Text fontSize="sm" noOfLines={1}>
              {field(item, "name", "label", "month", "grade_name", "group_name") || `#${idx + 1}`}
            </Text>
            <Text fontSize="sm" fontWeight="bold" textAlign="left">
              {formatMoney(field(item, "amount", "revenue", "total"), currency)}
            </Text>
          </SimpleGrid>
        ))
      )}
    </Surface>
  );
}
