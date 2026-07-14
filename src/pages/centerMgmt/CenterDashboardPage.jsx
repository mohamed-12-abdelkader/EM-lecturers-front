import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  SimpleGrid,
  Text,
  Badge,
  Icon,
  useColorModeValue,
  VStack,
  HStack,
} from "@chakra-ui/react";
import {
  FaUsers,
  FaLayerGroup,
  FaUserCheck,
  FaUserTimes,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaUserClock,
  FaChevronLeft,
} from "react-icons/fa";
import { useDashboard } from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { ACCENT, BRAND_ORANGE, field, formatMoney, MONTH_NAMES } from "./centerMgmtUtils";
import { EmptyState, KpiCard, LoadingBlock, PageHeader, Surface, StatusBadge } from "./components/UiBits";

const QUICK = [
  { to: "groups", label: "المجموعات", desc: "إنشاء مجموعة بأيام ورسوم", color: "teal" },
  { to: "students", label: "الطلاب", desc: "عرض كل طلاب السنتر", color: "blue" },
  { to: "attendance", label: "الحضور", desc: "مسح QR أو تسجيل يدوي", color: "orange" },
  { to: "subscriptions", label: "الشهر المالي", desc: "فتح شهر وتحديد المجددين", color: "purple" },
  { to: "payments", label: "المدفوعات", desc: "تسجيل دفعات جزئية/كاملة", color: "green" },
];

export default function CenterDashboardPage() {
  const { data, isLoading, isError, error } = useDashboard();
  const muted = useColorModeValue("gray.500", "gray.400");
  const outlineBorder = useColorModeValue("gray.200", "gray.600");
  const hoverBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const statusTileBg = useColorModeValue("gray.50", "whiteAlpha.50");

  if (isLoading) return <LoadingBlock label="جاري تحميل لوحة التحكم..." />;
  if (isError) {
    return (
      <EmptyState title="تعذر تحميل اللوحة" description={error?.message || "حاول مرة أخرى"} />
    );
  }

  const finances = data?.finances || {};
  const today = data?.today_attendance || data?.todayAttendance || {};
  const current = data?.current_month || data?.currentMonth || {};
  const monthLabel = current.month
    ? `${MONTH_NAMES[Number(current.month)] || current.month} ${current.year || ""}`
    : "الشهر الحالي";

  const statusItems = [
    { label: "مدفوع", value: finances.paid_count ?? finances.paidCount ?? 0, scheme: "green" },
    { label: "غير مدفوع", value: finances.unpaid_count ?? finances.unpaidCount ?? 0, scheme: "orange" },
    { label: "جزئي", value: finances.partial_count ?? finances.partialCount ?? 0, scheme: "yellow" },
    { label: "معفى", value: finances.exempt_count ?? finances.exemptCount ?? 0, scheme: "purple" },
  ];

  return (
    <Box>
      <PageHeader
        title="لوحة التحكم"
        description={`ملخص سنتر المدرس · ${monthLabel}`}
      />

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 2.5, md: 4 }} mb={{ base: 4, md: 6 }}>
        <KpiCard
          label="المجموعات"
          value={field(data, "groups_count", "groupsCount") ?? 0}
          icon={FaLayerGroup}
          color="teal"
        />
        <KpiCard
          label="الطلاب"
          value={field(data, "students_count", "studentsCount") ?? 0}
          icon={FaUsers}
          color="blue"
          sub={`نشط: ${field(data, "active_students_count", "activeStudentsCount") ?? 0}`}
        />
        <KpiCard
          label="المتوقّع"
          value={formatMoney(finances.expected)}
          icon={FaMoneyBillWave}
          color="purple"
        />
        <KpiCard
          label="المحصّل"
          value={formatMoney(finances.collected)}
          icon={FaUserCheck}
          color="green"
        />
        <KpiCard
          label="المتبقي"
          value={formatMoney(finances.remaining)}
          icon={FaExclamationTriangle}
          color="orange"
        />
        <KpiCard label="حضور اليوم" value={today.present ?? 0} icon={FaUserCheck} color="green" />
        <KpiCard label="غياب اليوم" value={today.absent ?? 0} icon={FaUserTimes} color="red" />
        <KpiCard label="متأخر اليوم" value={today.late ?? 0} icon={FaUserClock} color="orange" />
      </SimpleGrid>

      <Surface mb={{ base: 4, md: 6 }} p={{ base: 3, md: 4 }}>
        <Text fontSize="sm" fontWeight="bold" mb={3}>
          حالة الاشتراكات
        </Text>
        <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={2.5}>
          {statusItems.map((item) => (
            <Flex
              key={item.label}
              direction="column"
              align="flex-start"
              gap={1}
              p={3}
              borderRadius="xl"
              bg={statusTileBg}
              borderWidth="1px"
              borderColor={outlineBorder}
            >
              <StatusBadge scheme={item.scheme}>{item.label}</StatusBadge>
              <Text fontWeight="black" fontSize="xl" lineHeight="1.2">
                {item.value}
              </Text>
            </Flex>
          ))}
        </SimpleGrid>
      </Surface>

      <Surface>
        <Flex justify="space-between" align="center" mb={4} gap={2}>
          <Text fontWeight="black">اختصارات سريعة</Text>
          <Badge
            borderRadius="full"
            px={2.5}
            bg="blue.50"
            color={ACCENT}
            _dark={{ bg: "whiteAlpha.100" }}
          >
            سنتر المدرس
          </Badge>
        </Flex>
        <VStack spacing={2.5} align="stretch" display={{ base: "flex", sm: "none" }}>
          {QUICK.map((item) => (
            <Button
              key={item.to}
              as={RouterLink}
              to={`/center-mgmt/${item.to}`}
              variant="outline"
              justifyContent="space-between"
              h="auto"
              py={3.5}
              px={4}
              borderRadius="xl"
              borderColor={outlineBorder}
              _hover={{ bg: hoverBg, borderColor: "blue.200" }}
              rightIcon={<Icon as={FaChevronLeft} boxSize={3} color="gray.400" />}
            >
              <Box textAlign="right">
                <Text fontWeight="bold" fontSize="sm">{item.label}</Text>
                <Text fontSize="xs" color={muted} fontWeight="normal" mt={0.5}>
                  {item.desc}
                </Text>
              </Box>
            </Button>
          ))}
        </VStack>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3} display={{ base: "none", sm: "grid" }}>
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
              _hover={{ bg: hoverBg, borderColor: "blue.200" }}
            >
              <HStack spacing={3} align="flex-start" w="full">
                <Box
                  w={1}
                  alignSelf="stretch"
                  borderRadius="full"
                  bg={item.color === "orange" ? BRAND_ORANGE : ACCENT}
                  opacity={0.85}
                />
                <Box textAlign="right">
                  <Text fontWeight="bold">{item.label}</Text>
                  <Text fontSize="xs" color={muted} fontWeight="normal" mt={0.5}>
                    {item.desc}
                  </Text>
                </Box>
              </HStack>
            </Button>
          ))}
        </SimpleGrid>
      </Surface>
    </Box>
  );
}
