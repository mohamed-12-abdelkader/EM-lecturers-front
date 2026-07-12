import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Badge,
  Select,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FaUsers,
  FaLayerGroup,
  FaUserCheck,
  FaUserTimes,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaClock,
  FaUserClock,
} from "react-icons/fa";
import { useActivityLogs, useDashboard } from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import {
  currentMonthYear,
  field,
  formatDate,
  formatMoney,
  MONTH_NAMES,
} from "./centerMgmtUtils";
import { EmptyState, KpiCard, LoadingBlock, PageHeader, Surface } from "./components/UiBits";

const QUICK = [
  { to: "students", label: "الطلاب", desc: "إضافة ومتابعة و QR" },
  { to: "attendance", label: "الحضور", desc: "مسح QR أو تسجيل يدوي" },
  { to: "subscriptions", label: "الاشتراكات", desc: "فتح شهر ومتابعة الدفع" },
  { to: "payments", label: "المدفوعات", desc: "تسجيل التحصيل" },
  { to: "groups", label: "المجموعات", desc: "الجداول والرسوم" },
  { to: "finance", label: "التقرير المالي", desc: "مطلوب / محصّل / متبقي" },
];

export default function CenterDashboardPage() {
  const now = currentMonthYear();
  const [month, setMonth] = useState(String(now.month));
  const [year, setYear] = useState(String(now.year));
  const params = useMemo(
    () => ({ year: Number(year), month: Number(month) }),
    [year, month]
  );

  const { data, isLoading, isError, error } = useDashboard(params);
  const { data: activityData } = useActivityLogs({ limit: 15 });
  const activity = activityData?.items || [];

  const muted = useColorModeValue("gray.600", "gray.400");
  const softBg = useColorModeValue("gray.50", "gray.700");
  const outlineBorder = useColorModeValue("gray.200", "gray.600");

  if (isLoading) return <LoadingBlock label="جاري تحميل لوحة التحكم..." />;
  if (isError) {
    return (
      <EmptyState title="تعذر تحميل اللوحة" description={error?.message || "حاول مرة أخرى"} />
    );
  }

  const years = [now.year - 1, now.year, now.year + 1];

  return (
    <Box>
      <PageHeader
        title="لوحة التحكم"
        description={`نظرة على ${MONTH_NAMES[Number(month)] || ""} ${year}`}
        actions={
          <HStack spacing={2}>
            <Select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              borderRadius="xl"
              w="140px"
              size="sm"
            >
              {MONTH_NAMES.slice(1).map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </Select>
            <Select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              borderRadius="xl"
              w="100px"
              size="sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </HStack>
        }
      />

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
        <KpiCard label="الطلاب" value={data?.studentsCount ?? 0} icon={FaUsers} color="blue" />
        <KpiCard
          label="المجموعات"
          value={data?.groupsCount ?? 0}
          icon={FaLayerGroup}
          color="teal"
        />
        <KpiCard
          label="حضور اليوم"
          value={data?.todayPresent ?? 0}
          icon={FaUserCheck}
          color="green"
        />
        <KpiCard
          label="غياب اليوم"
          value={data?.todayAbsent ?? 0}
          icon={FaUserTimes}
          color="red"
        />
        <KpiCard
          label="متأخر اليوم"
          value={data?.todayLate ?? 0}
          icon={FaUserClock}
          color="orange"
        />
        <KpiCard
          label="محصّل الشهر"
          value={formatMoney(data?.monthCollected ?? data?.monthTotalPaid)}
          icon={FaMoneyBillWave}
          color="green"
        />
        <KpiCard
          label="متبقي الشهر"
          value={formatMoney(data?.monthRemaining)}
          icon={FaClock}
          color="orange"
        />
        <KpiCard
          label="غير مسدّد"
          value={data?.unpaidRenewals ?? 0}
          icon={FaExclamationTriangle}
          color="red"
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={5}>
        <Box gridColumn={{ lg: "span 2" }}>
          <Surface>
            <Text fontWeight="bold" mb={4}>
              اختصارات سريعة
            </Text>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
              {QUICK.map((item) => (
                <Button
                  key={item.to}
                  as={RouterLink}
                  to={`/center-mgmt/${item.to}`}
                  variant="outline"
                  justifyContent="flex-start"
                  h="auto"
                  py={4}
                  px={4}
                  borderRadius="xl"
                  borderColor={outlineBorder}
                >
                  <Box textAlign="right">
                    <Text fontWeight="bold">{item.label}</Text>
                    <Text fontSize="xs" color={muted} fontWeight="normal">
                      {item.desc}
                    </Text>
                  </Box>
                </Button>
              ))}
            </SimpleGrid>
          </Surface>

          {(data?.recentPayments?.length > 0 || data?.recentAttendance?.length > 0) && (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={5}>
              <Surface>
                <Text fontWeight="bold" mb={3}>
                  آخر المدفوعات
                </Text>
                <VStack align="stretch" spacing={2}>
                  {(data?.recentPayments || []).slice(0, 5).map((p, idx) => (
                    <Flex
                      key={p.id || idx}
                      justify="space-between"
                      gap={2}
                      p={2}
                      borderRadius="lg"
                      bg={softBg}
                    >
                      <Text fontSize="sm" noOfLines={1}>
                        {field(p, "student_name", "studentName", "full_name") || "دفعة"}
                      </Text>
                      <Text fontSize="sm" fontWeight="bold">
                        {formatMoney(field(p, "amount"))}
                      </Text>
                    </Flex>
                  ))}
                </VStack>
              </Surface>
              <Surface>
                <Text fontWeight="bold" mb={3}>
                  آخر الحضور
                </Text>
                <VStack align="stretch" spacing={2}>
                  {(data?.recentAttendance || []).slice(0, 5).map((a, idx) => (
                    <Flex
                      key={a.id || idx}
                      justify="space-between"
                      gap={2}
                      p={2}
                      borderRadius="lg"
                      bg={softBg}
                    >
                      <Text fontSize="sm" noOfLines={1}>
                        {field(a, "student_name", "studentName", "full_name") || "حضور"}
                      </Text>
                      <Badge>{field(a, "status") || "—"}</Badge>
                    </Flex>
                  ))}
                </VStack>
              </Surface>
            </SimpleGrid>
          )}
        </Box>

        <Surface>
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontWeight="bold">سجل النشاط</Text>
            <Badge colorScheme="blue">{activity.length}</Badge>
          </Flex>
          {activity.length === 0 ? (
            <Text fontSize="sm" color={muted}>
              لا يوجد نشاط حديث
            </Text>
          ) : (
            <VStack align="stretch" spacing={3} maxH="420px" overflowY="auto">
              {activity.map((item, idx) => (
                <Box key={item.id || idx} p={3} borderRadius="lg" bg={softBg}>
                  <Text fontSize="sm" fontWeight="medium" noOfLines={2}>
                    {field(item, "action", "message", "description", "event") || "نشاط"}
                  </Text>
                  <Text fontSize="xs" color={muted} mt={1}>
                    {formatDate(field(item, "created_at", "createdAt"))}
                  </Text>
                </Box>
              ))}
            </VStack>
          )}
        </Surface>
      </SimpleGrid>
    </Box>
  );
}
