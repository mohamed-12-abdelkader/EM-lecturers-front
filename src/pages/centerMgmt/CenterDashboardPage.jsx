import { Link as RouterLink, useOutletContext } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FaUsers,
  FaLayerGroup,
  FaGraduationCap,
  FaUserCheck,
  FaUserTimes,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaClock,
} from "react-icons/fa";
import { useCenterDashboard } from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { formatMoney, formatDate, field } from "./centerMgmtUtils";
import { EmptyState, KpiCard, LoadingBlock, PageHeader, Surface } from "./components/UiBits";

const QUICK = [
  { to: "students", label: "الطلاب", desc: "إضافة ومتابعة الطلاب" },
  { to: "attendance", label: "الحضور", desc: "مسح QR أو تسجيل يدوي" },
  { to: "subscriptions", label: "الاشتراكات", desc: "توليد اشتراكات الشهر" },
  { to: "payments", label: "المدفوعات", desc: "تحصيل وإيصالات" },
  { to: "groups", label: "المجموعات", desc: "الجداول والطاقة الاستيعابية" },
  { to: "finance", label: "الماليات", desc: "إيرادات ومتأخرات" },
];

export default function CenterDashboardPage() {
  const { centerId, center } = useOutletContext();
  const { data, isLoading, isError, error } = useCenterDashboard(centerId);
  const muted = useColorModeValue("gray.600", "gray.400");
  const softBg = useColorModeValue("gray.50", "gray.700");
  const outlineBorder = useColorModeValue("gray.200", "gray.600");
  const currency = field(center, "currency") || "EGP";

  if (isLoading) return <LoadingBlock label="جاري تحميل لوحة التحكم..." />;
  if (isError) {
    return (
      <EmptyState
        title="تعذر تحميل اللوحة"
        description={error?.message || "حاول مرة أخرى"}
      />
    );
  }

  const activity = data?.recentActivity || [];

  return (
    <Box>
      <PageHeader
        title="لوحة التحكم"
        description={`نظرة سريعة على ${field(center, "name") || "السنتر"}`}
      />

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
        <KpiCard label="الطلاب" value={data?.studentsCount ?? 0} icon={FaUsers} color="blue" />
        <KpiCard label="المجموعات" value={data?.groupsCount ?? 0} icon={FaLayerGroup} color="teal" />
        <KpiCard label="الصفوف" value={data?.gradesCount ?? 0} icon={FaGraduationCap} color="purple" />
        <KpiCard
          label="إيراد الشهر"
          value={formatMoney(data?.monthlyRevenue, currency)}
          icon={FaMoneyBillWave}
          color="green"
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
          label="غير مدفوع"
          value={data?.unpaidCount ?? 0}
          icon={FaClock}
          color="orange"
        />
        <KpiCard
          label="اشتراكات منتهية"
          value={data?.expiredSubscriptions ?? 0}
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
                  to={`/center-mgmt/${centerId}/${item.to}`}
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
        </Box>

        <Surface>
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontWeight="bold">آخر النشاط</Text>
            <Badge colorScheme="blue">{activity.length}</Badge>
          </Flex>
          {activity.length === 0 ? (
            <Text fontSize="sm" color={muted}>
              لا يوجد نشاط حديث
            </Text>
          ) : (
            <VStack align="stretch" spacing={3} maxH="360px" overflowY="auto">
              {activity.slice(0, 10).map((item, idx) => (
                <Box
                  key={item.id || idx}
                  p={3}
                  borderRadius="lg"
                  bg={softBg}
                >
                  <Text fontSize="sm" fontWeight="medium" noOfLines={2}>
                    {field(item, "action", "message", "description") || "نشاط"}
                  </Text>
                  <HStack mt={1} spacing={2}>
                    <Text fontSize="xs" color={muted}>
                      {formatDate(field(item, "created_at", "createdAt"))}
                    </Text>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </Surface>
      </SimpleGrid>
    </Box>
  );
}
