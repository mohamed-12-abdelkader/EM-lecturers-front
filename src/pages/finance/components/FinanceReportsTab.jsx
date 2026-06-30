import {
  Box,
  Badge,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import {
  fetchFinanceReportsExpenses,
  fetchFinanceReportsProfit,
  fetchFinanceReportsRevenue,
  fetchFinanceReportsSubscriptions,
} from "../../../api/financeApi";
import {
  DASHBOARD_PERIODS,
  EXPENSE_CATEGORIES,
  formatDate,
  formatMoney,
  paymentStatusMeta,
  SUBSCRIPTION_STATUS,
} from "../financeConstants";

export default function FinanceReportsTab({ refreshKey }) {
  const [revenueParams, setRevenueParams] = useState({
    start_date: "",
    end_date: "",
    group_by: "plan",
  });
  const [expenseParams, setExpenseParams] = useState({
    start_date: "",
    end_date: "",
    category: "",
  });
  const [profitPeriod, setProfitPeriod] = useState("month");
  const [subscriptionParams, setSubscriptionParams] = useState({
    status: "active",
    expiring_within_days: "",
  });
  const [revenueData, setRevenueData] = useState(null);
  const [expenseData, setExpenseData] = useState(null);
  const [profitData, setProfitData] = useState(null);
  const [subscriptionsData, setSubscriptionsData] = useState(null);
  const [loading, setLoading] = useState({
    revenue: false,
    expenses: false,
    profit: false,
    subscriptions: false,
  });

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  const loadProfit = useCallback(async () => {
    setLoading((p) => ({ ...p, profit: true }));
    try {
      const data = await fetchFinanceReportsProfit(profitPeriod);
      setProfitData(data);
    } catch {
      setProfitData(null);
    } finally {
      setLoading((p) => ({ ...p, profit: false }));
    }
  }, [profitPeriod]);

  useEffect(() => {
    loadProfit();
  }, [loadProfit, refreshKey]);

  const loadRevenue = async () => {
    setLoading((p) => ({ ...p, revenue: true }));
    try {
      const data = await fetchFinanceReportsRevenue({
        start_date: revenueParams.start_date || undefined,
        end_date: revenueParams.end_date || undefined,
        group_by: revenueParams.group_by,
      });
      setRevenueData(data);
    } catch {
      setRevenueData(null);
    } finally {
      setLoading((p) => ({ ...p, revenue: false }));
    }
  };

  const loadExpenses = async () => {
    setLoading((p) => ({ ...p, expenses: true }));
    try {
      const data = await fetchFinanceReportsExpenses({
        start_date: expenseParams.start_date || undefined,
        end_date: expenseParams.end_date || undefined,
        category: expenseParams.category || undefined,
      });
      setExpenseData(data);
    } catch {
      setExpenseData(null);
    } finally {
      setLoading((p) => ({ ...p, expenses: false }));
    }
  };

  const loadSubscriptions = async () => {
    setLoading((p) => ({ ...p, subscriptions: true }));
    try {
      const data = await fetchFinanceReportsSubscriptions({
        status: subscriptionParams.status || undefined,
        expiring_within_days: subscriptionParams.expiring_within_days
          ? Number(subscriptionParams.expiring_within_days)
          : undefined,
      });
      setSubscriptionsData(data);
    } catch {
      setSubscriptionsData(null);
    } finally {
      setLoading((p) => ({ ...p, subscriptions: false }));
    }
  };

  const profitPeriods = profitData?.all_periods || {};

  return (
    <VStack align="stretch" spacing={5}>
      <Box>
        <Heading size="md">التقارير المالية</Heading>
        <Text fontSize="sm" color={muted} mt={1}>
          إيرادات، مصروفات، وأرباح حسب الفترة
        </Text>
      </Box>

      <Card bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="2xl">
        <CardBody>
          <Heading size="sm" mb={4}>
            تقرير الأرباح
          </Heading>
          <Select
            w={{ base: "full", sm: "220px" }}
            mb={4}
            borderRadius="xl"
            value={profitPeriod}
            onChange={(e) => setProfitPeriod(e.target.value)}
          >
            {DASHBOARD_PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
          {loading.profit ? (
            <Spinner color="blue.500" />
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
              <Stat>
                <StatLabel>الإيرادات</StatLabel>
                <StatNumber fontSize="lg">{formatMoney(profitData?.total_income ?? profitPeriods[profitPeriod === "today" ? "day" : profitPeriod]?.income)}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>المصروفات</StatLabel>
                <StatNumber fontSize="lg">{formatMoney(profitData?.total_expenses ?? profitPeriods[profitPeriod === "today" ? "day" : profitPeriod]?.expenses)}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>صافي الربح</StatLabel>
                <StatNumber fontSize="lg" color="blue.500">
                  {formatMoney(profitData?.net_profit ?? profitPeriods[profitPeriod === "today" ? "day" : profitPeriod]?.profit)}
                </StatNumber>
              </Stat>
            </SimpleGrid>
          )}
        </CardBody>
      </Card>

      <Card bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="2xl">
        <CardBody>
          <Heading size="sm" mb={4}>
            تقرير الإيرادات
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={4}>
            <FormControl>
              <FormLabel fontSize="sm">من</FormLabel>
              <Input
                type="date"
                borderRadius="xl"
                value={revenueParams.start_date}
                onChange={(e) => setRevenueParams((p) => ({ ...p, start_date: e.target.value }))}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">إلى</FormLabel>
              <Input
                type="date"
                borderRadius="xl"
                value={revenueParams.end_date}
                onChange={(e) => setRevenueParams((p) => ({ ...p, end_date: e.target.value }))}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">تجميع حسب</FormLabel>
              <Select
                borderRadius="xl"
                value={revenueParams.group_by}
                onChange={(e) => setRevenueParams((p) => ({ ...p, group_by: e.target.value }))}
              >
                <option value="plan">الباقة</option>
                <option value="teacher">المدرس</option>
                <option value="day">اليوم</option>
              </Select>
            </FormControl>
          </SimpleGrid>
          <Button colorScheme="blue" borderRadius="xl" mb={4} onClick={loadRevenue} isLoading={loading.revenue}>
            عرض تقرير الإيرادات
          </Button>
          {revenueData?.rows?.length ? (
            <Box overflowX="auto">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>المجموعة</Th>
                    <Th isNumeric>عدد العمليات</Th>
                    <Th isNumeric>الإجمالي</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {revenueData.rows.map((row, i) => (
                    <Tr key={i}>
                      <Td>{row.group_label || row.group_key}</Td>
                      <Td isNumeric>{row.transactions_count}</Td>
                      <Td isNumeric fontWeight="bold">{formatMoney(row.total_amount)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          ) : revenueData ? (
            <Text fontSize="sm" color={muted}>
              لا توجد بيانات للفترة المحددة
            </Text>
          ) : null}
        </CardBody>
      </Card>

      <Card bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="2xl">
        <CardBody>
          <Heading size="sm" mb={4}>
            تقرير المصروفات
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} mb={4}>
            <FormControl>
              <FormLabel fontSize="sm">من</FormLabel>
              <Input
                type="date"
                borderRadius="xl"
                value={expenseParams.start_date}
                onChange={(e) => setExpenseParams((p) => ({ ...p, start_date: e.target.value }))}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">إلى</FormLabel>
              <Input
                type="date"
                borderRadius="xl"
                value={expenseParams.end_date}
                onChange={(e) => setExpenseParams((p) => ({ ...p, end_date: e.target.value }))}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">التصنيف</FormLabel>
              <Select
                borderRadius="xl"
                placeholder="الكل"
                value={expenseParams.category}
                onChange={(e) => setExpenseParams((p) => ({ ...p, category: e.target.value }))}
              >
                {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </FormControl>
          </SimpleGrid>
          <Button colorScheme="blue" borderRadius="xl" mb={4} onClick={loadExpenses} isLoading={loading.expenses}>
            عرض تقرير المصروفات
          </Button>
          {expenseData?.by_category?.length ? (
            <Box overflowX="auto">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>التصنيف</Th>
                    <Th isNumeric>عدد</Th>
                    <Th isNumeric>الإجمالي</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {expenseData.by_category.map((row) => (
                    <Tr key={row.category}>
                      <Td>{EXPENSE_CATEGORIES[row.category] || row.category}</Td>
                      <Td isNumeric>{row.count}</Td>
                      <Td isNumeric fontWeight="bold">{formatMoney(row.total)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          ) : expenseData ? (
            <Text fontSize="sm" color={muted}>
              لا توجد مصروفات للفترة المحددة
            </Text>
          ) : null}
        </CardBody>
      </Card>

      <Card bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="2xl">
        <CardBody>
          <Heading size="sm" mb={4}>
            تقرير الاشتراكات
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mb={4}>
            <FormControl>
              <FormLabel fontSize="sm">حالة الاشتراك</FormLabel>
              <Select
                borderRadius="xl"
                value={subscriptionParams.status}
                onChange={(e) =>
                  setSubscriptionParams((p) => ({ ...p, status: e.target.value }))
                }
              >
                <option value="">الكل</option>
                {Object.entries(SUBSCRIPTION_STATUS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">ينتهي خلال (أيام)</FormLabel>
              <Input
                type="number"
                min={1}
                placeholder="مثال: 7"
                borderRadius="xl"
                value={subscriptionParams.expiring_within_days}
                onChange={(e) =>
                  setSubscriptionParams((p) => ({
                    ...p,
                    expiring_within_days: e.target.value,
                  }))
                }
              />
            </FormControl>
          </SimpleGrid>
          <Button
            colorScheme="blue"
            borderRadius="xl"
            mb={4}
            onClick={loadSubscriptions}
            isLoading={loading.subscriptions}
          >
            عرض تقرير الاشتراكات
          </Button>
          {subscriptionsData?.subscriptions?.length ? (
            <Box overflowX="auto">
              <Table size="sm" minW="720px">
                <Thead>
                  <Tr>
                    <Th>المدرس</Th>
                    <Th>الباقة</Th>
                    <Th>الحالة</Th>
                    <Th>الدفع</Th>
                    <Th isNumeric>المتبقي</Th>
                    <Th>النهاية</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {subscriptionsData.subscriptions.map((sub) => {
                    const st = SUBSCRIPTION_STATUS[sub.status] || {
                      label: sub.status,
                      colorScheme: "gray",
                    };
                    const pay = paymentStatusMeta(sub.payment_status);
                    return (
                      <Tr key={sub.id}>
                        <Td>{sub.teacher_name}</Td>
                        <Td>{sub.plan_name_ar || sub.plan_code}</Td>
                        <Td>
                          <Badge colorScheme={st.colorScheme}>{st.label}</Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={pay.colorScheme}>{pay.label}</Badge>
                        </Td>
                        <Td isNumeric>{formatMoney(sub.remaining_amount)}</Td>
                        <Td>{formatDate(sub.ends_at)}</Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>
          ) : subscriptionsData ? (
            <Text fontSize="sm" color={muted}>
              لا توجد اشتراكات مطابقة
            </Text>
          ) : null}
        </CardBody>
      </Card>
    </VStack>
  );
}
