import {
  Box,
  Card,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Heading,
  Text,
  HStack,
  Icon,
  Select,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useColorModeValue,
  Spinner,
  Flex,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { FaArrowDown, FaArrowUp, FaChartLine, FaExclamationTriangle, FaSync, FaUsers } from "react-icons/fa";
import { MdAutorenew } from "react-icons/md";
import { fetchFinanceDashboard, financeErrorMessage } from "../../../api/financeApi";
import ExpiringSubscriptionsTable, {
  ExpiringSoonSummary,
} from "./ExpiringSubscriptionsTable";
import {
  DASHBOARD_PERIODS,
  PLAN_CODES,
  formatDate,
  formatMoney,
  paymentStatusMeta,
  teacherLabel,
} from "../financeConstants";

function KpiCard({ label, value, help, icon, color, bg }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  return (
    <Card bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="2xl" shadow="md" overflow="hidden">
      <Box h="3px" bg={color} />
      <CardBody>
        <Stat>
          <HStack justify="space-between" mb={1}>
            <StatLabel fontSize="xs" color="gray.500">
              {label}
            </StatLabel>
            <Flex w={9} h={9} borderRadius="lg" bg={bg} align="center" justify="center">
              <Icon as={icon} color={color} boxSize={4} />
            </Flex>
          </HStack>
          <StatNumber fontSize={{ base: "xl", md: "2xl" }}>{value}</StatNumber>
          {help ? <StatHelpText mb={0}>{help}</StatHelpText> : null}
        </Stat>
      </CardBody>
    </Card>
  );
}

export default function FinanceDashboardTab({ refreshKey }) {
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tableBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFinanceDashboard(period);
      setData(result);
    } catch (err) {
      setError(financeErrorMessage(err, "فشل تحميل اللوحة"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <VStack align="stretch" spacing={5}>
      <HStack justify="space-between" flexWrap="wrap" gap={3}>
        <Box>
          <Heading size="md">لوحة المالية</Heading>
          <Text fontSize="sm" color={muted} mt={1}>
            ملخص الإيرادات والمصروفات والاشتراكات
          </Text>
        </Box>
        <Select
          w={{ base: "full", sm: "200px" }}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          borderRadius="xl"
        >
          {DASHBOARD_PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </HStack>

      {loading ? (
        <Flex justify="center" py={16}>
          <Spinner size="lg" color="blue.500" />
        </Flex>
      ) : error ? (
        <Card bg={tableBg} borderRadius="xl" p={6}>
          <Text color="red.500" fontWeight="semibold" whiteSpace="pre-wrap">
            {error}
          </Text>
        </Card>
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4}>
            <KpiCard
              label="إجمالي الإيرادات"
              value={formatMoney(data?.total_income)}
              help="كل مصادر الدخل"
              icon={FaArrowUp}
              color="green.500"
              bg="green.50"
            />
            <KpiCard
              label="إجمالي المصروفات"
              value={formatMoney(data?.total_expenses)}
              help="كل المصروفات المسجّلة"
              icon={FaArrowDown}
              color="red.500"
              bg="red.50"
            />
            <KpiCard
              label="صافي الربح"
              value={formatMoney(data?.net_profit)}
              help="الإيرادات − المصروفات"
              icon={FaChartLine}
              color="blue.500"
              bg="blue.50"
            />
            <KpiCard
              label="المستحقات المتبقية"
              value={formatMoney(data?.outstanding_balances_total)}
              help={`${data?.outstanding_balances_count ?? 0} اشتراك عليه متبقي`}
              icon={FaExclamationTriangle}
              color="orange.500"
              bg="orange.50"
            />
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4}>
            <KpiCard
              label="إيرادات التجديد"
              value={formatMoney(data?.renewal_revenue)}
              help="تجديدات الاشتراكات"
              icon={MdAutorenew}
              color="purple.500"
              bg="purple.50"
            />
            <KpiCard
              label="اشتراكات نشطة"
              value={String(data?.active_subscriptions ?? 0)}
              icon={FaUsers}
              color="teal.500"
              bg="teal.50"
            />
            <KpiCard
              label="اشتراكات منتهية"
              value={String(data?.expired_subscriptions ?? 0)}
              icon={FaSync}
              color="gray.500"
              bg="gray.100"
            />
          </SimpleGrid>

          {(data?.outstanding_balances_count ?? 0) > 0 ||
          (data?.outstanding_balances ?? []).length > 0 ? (
            <Card
              bg={tableBg}
              borderWidth="1px"
              borderColor="orange.200"
              borderRadius="2xl"
              overflow="hidden"
            >
              <Box h="3px" bg="orange.400" />
              <CardBody>
                <HStack justify="space-between" flexWrap="wrap" gap={2} mb={3}>
                  <Heading size="sm" color="orange.600" _dark={{ color: "orange.300" }}>
                    مستحقات على المدرسين
                  </Heading>
                  <Badge colorScheme="orange" borderRadius="full" px={3}>
                    {formatMoney(data?.outstanding_balances_total)}
                  </Badge>
                </HStack>
                <Box overflowX="auto">
                  <Table size="sm" variant="simple" minW="720px">
                    <Thead>
                      <Tr>
                        <Th>المدرس</Th>
                        <Th>الباقة</Th>
                        <Th isNumeric>الإجمالي</Th>
                        <Th isNumeric>المتبقي</Th>
                        <Th>حالة الدفع</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {(data?.outstanding_balances ?? []).slice(0, 8).map((sub) => {
                        const pay = paymentStatusMeta(sub.payment_status);
                        return (
                          <Tr key={sub.id}>
                            <Td>{sub.teacher_name || teacherLabel(sub.teacher)}</Td>
                            <Td>{sub.plan_name_ar || sub.plan_name}</Td>
                            <Td isNumeric>{formatMoney(sub.actual_price)}</Td>
                            <Td isNumeric fontWeight="bold" color="orange.500">
                              {formatMoney(sub.remaining_amount)}
                            </Td>
                            <Td>
                              <Badge colorScheme={pay.colorScheme}>{pay.label}</Badge>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              </CardBody>
            </Card>
          ) : null}

          {(data?.expiring_soon_total ?? 0) > 0 ||
          (data?.expiring_soon_subscriptions ?? []).length > 0 ? (
            <Card
              bg={tableBg}
              borderWidth="1px"
              borderColor="orange.200"
              borderRadius="2xl"
              overflow="hidden"
            >
              <Box h="3px" bg="orange.400" />
              <CardBody>
                <HStack justify="space-between" flexWrap="wrap" gap={2} mb={3}>
                  <Heading size="sm" color="orange.600" _dark={{ color: "orange.300" }}>
                    اشتراكات على وشك الانتهاء
                  </Heading>
                  <Badge colorScheme="orange" borderRadius="full" px={3}>
                    {data?.expiring_soon_total ?? data?.expiring_soon_subscriptions?.length ?? 0}
                  </Badge>
                </HStack>
                <ExpiringSoonSummary
                  total={data?.expiring_soon_total}
                  days={data?.expiring_soon_days}
                  asOf={data?.expiring_soon_as_of}
                />
                <Box mt={4}>
                  <ExpiringSubscriptionsTable
                    subscriptions={data?.expiring_soon_subscriptions ?? []}
                    compact
                  />
                </Box>
              </CardBody>
            </Card>
          ) : null}

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
            <Card bg={tableBg} borderWidth="1px" borderColor={border} borderRadius="2xl">
              <CardBody>
                <Heading size="sm" mb={4}>
                  أعلى الباقات إيراداً
                </Heading>
                {(data?.top_plans_by_revenue ?? []).length === 0 ? (
                  <Text fontSize="sm" color={muted}>
                    لا توجد بيانات بعد
                  </Text>
                ) : (
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>الباقة</Th>
                        <Th isNumeric>الإيراد</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data.top_plans_by_revenue.map((row, i) => {
                        const meta = PLAN_CODES[row.code || row.plan_code] || {};
                        return (
                          <Tr key={i}>
                            <Td>
                              <Badge colorScheme={meta.colorScheme || "blue"}>
                                {row.name_ar || meta.label || row.code}
                              </Badge>
                            </Td>
                            <Td isNumeric fontWeight="bold">
                              {formatMoney(row.revenue ?? row.total)}
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                )}
              </CardBody>
            </Card>

            <Card bg={tableBg} borderWidth="1px" borderColor={border} borderRadius="2xl">
              <CardBody>
                <Heading size="sm" mb={4}>
                  أعلى المدرسين إيراداً
                </Heading>
                {(data?.top_teachers_by_revenue ?? []).length === 0 ? (
                  <Text fontSize="sm" color={muted}>
                    لا توجد بيانات بعد
                  </Text>
                ) : (
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>المدرس</Th>
                        <Th isNumeric>الإيراد</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data.top_teachers_by_revenue.map((row, i) => (
                        <Tr key={i}>
                          <Td>{row.teacher_name || teacherLabel(row)}</Td>
                          <Td isNumeric fontWeight="bold">
                            {formatMoney(row.revenue ?? row.total)}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </SimpleGrid>

          <Card bg={tableBg} borderWidth="1px" borderColor={border} borderRadius="2xl">
            <CardBody>
              <Heading size="sm" mb={4}>
                آخر التجديدات
              </Heading>
              {(data?.recent_renewals ?? []).length === 0 ? (
                <Text fontSize="sm" color={muted}>
                  لا توجد تجديدات حديثة
                </Text>
              ) : (
                <Box overflowX="auto">
                  <Table size="sm" variant="simple" minW="640px">
                    <Thead>
                      <Tr>
                        <Th>المدرس</Th>
                        <Th>الباقة</Th>
                        <Th isNumeric>المبلغ</Th>
                        <Th>التاريخ</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data.recent_renewals.map((row) => (
                        <Tr key={row.id}>
                          <Td>{row.teacher_name || teacherLabel(row.teacher)}</Td>
                          <Td>{row.plan_name || row.plan_code}</Td>
                          <Td isNumeric>{formatMoney(row.amount ?? row.actual_price)}</Td>
                          <Td>{formatDate(row.created_at || row.renewed_at)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </VStack>
  );
}
