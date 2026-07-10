import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Stat,
  StatHelpText,
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
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import {
  fetchFinanceIncomeDetails,
  fetchFinanceTeachers,
  financeErrorMessage,
} from "../../../api/financeApi";
import {
  formatDate,
  formatMoney,
  incomePaymentTypeLabel,
  incomePaymentTypeMeta,
  PLAN_CODES,
  SUBSCRIPTION_STATUS,
  teacherLabel,
} from "../financeConstants";

const PAGE_SIZE = 15;

const PAYMENT_TYPE_FILTERS = [
  { value: "", label: "كل أنواع العمليات" },
  { value: "subscription", label: "اشتراك جديد" },
  { value: "renewal", label: "تجديد" },
  { value: "upgrade", label: "ترقية" },
  { value: "additional_payment", label: "دفعة إضافية" },
  { value: "reversal", label: "استرداد عند الإلغاء" },
];

function SummaryCard({ label, value, help, colorScheme }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  return (
    <Card bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="xl">
      <CardBody py={4}>
        <Stat>
          <StatLabel fontSize="xs" color="gray.500">
            {label}
          </StatLabel>
          <StatNumber fontSize="lg" color={`${colorScheme}.500`}>
            {value}
          </StatNumber>
          {help ? <StatHelpText mb={0}>{help}</StatHelpText> : null}
        </Stat>
      </CardBody>
    </Card>
  );
}

function rowTeacherName(row) {
  return (
    row?.teacher_name ||
    row?.teacher?.name ||
    teacherLabel(row?.teacher) ||
    "—"
  );
}

function rowTeacherEmail(row) {
  return row?.teacher_email || row?.teacher?.email || "";
}

function rowAmount(row) {
  const value =
    row?.amount ??
    row?.paid_amount ??
    row?.payment_amount ??
    row?.collected_amount;
  return formatMoney(value);
}

function rowIsReversal(row) {
  const type = String(row?.payment_type || "").toLowerCase();
  return (
    row?.is_reversal === true ||
    type === "reversal" ||
    type === "refund" ||
    type === "cancellation_refund"
  );
}

export default function FinanceIncomeDetailsSection({ refreshKey }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);

  const [search, setSearch] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [planCode, setPlanCode] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [countedOnly, setCountedOnly] = useState(false);
  const [includeReversals, setIncludeReversals] = useState(true);

  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const rowHover = useColorModeValue("gray.50", "whiteAlpha.50");

  const loadTeachers = useCallback(async () => {
    try {
      const list = await fetchFinanceTeachers();
      setTeachers(list);
    } catch {
      setTeachers([]);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchFinanceIncomeDetails({
        limit: PAGE_SIZE,
        offset,
        search: search.trim() || undefined,
        teacher_id: teacherId || undefined,
        plan_code: planCode || undefined,
        payment_type: paymentType || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        counted_only: countedOnly ? true : undefined,
        include_reversals: includeReversals ? undefined : false,
      });
      setItems(result.items);
      setTotal(result.total);
      setSummary(result.summary || {});
    } catch (err) {
      toast({
        title: "خطأ",
        description: financeErrorMessage(err),
        status: "error",
        duration: 6000,
        isClosable: true,
      });
      setItems([]);
      setTotal(0);
      setSummary({});
    } finally {
      setLoading(false);
    }
  }, [
    offset,
    search,
    teacherId,
    planCode,
    paymentType,
    startDate,
    endDate,
    countedOnly,
    includeReversals,
    toast,
  ]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const resetFilters = () => {
    setSearch("");
    setTeacherId("");
    setPlanCode("");
    setPaymentType("");
    setStartDate("");
    setEndDate("");
    setCountedOnly(false);
    setIncludeReversals(true);
    setOffset(0);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <Card bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="2xl" overflow="visible">
      <Box h="3px" bgGradient="linear(to-l, green.400, blue.500)" />
      <CardBody>
        <VStack align="stretch" spacing={5}>
          <Box>
            <Heading size="sm">تفاصيل الدخل</Heading>
            <Text fontSize="sm" color={muted} mt={1}>
              سجل عمليات الإيراد: اشتراكات جديدة، تجديدات، ترقيات، دفعات إضافية، واستردادات
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
            <SummaryCard
              label="إجمالي المحصّل"
              value={formatMoney(summary.gross_collected)}
              help="كل المبالغ المحصّلة"
              colorScheme="green"
            />
            <SummaryCard
              label="الإيراد الفعّال"
              value={formatMoney(summary.active_revenue)}
              help="لم يُلغَ"
              colorScheme="blue"
            />
            <SummaryCard
              label="المبالغ المستردة"
              value={formatMoney(summary.reversed_amount)}
              help="بعد إلغاء الاشتراكات"
              colorScheme="red"
            />
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={3}>
            <FormControl>
              <FormLabel fontSize="xs" mb={1}>
                بحث
              </FormLabel>
              <Input
                size="sm"
                placeholder="اسم المدرس أو رقم الاشتراك..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setOffset(0);
                }}
                borderRadius="xl"
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="xs" mb={1}>
                المدرس
              </FormLabel>
              <Select
                size="sm"
                value={teacherId}
                onChange={(e) => {
                  setTeacherId(e.target.value);
                  setOffset(0);
                }}
                borderRadius="xl"
              >
                <option value="">كل المدرسين</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {teacherLabel(t)}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="xs" mb={1}>
                الباقة
              </FormLabel>
              <Select
                size="sm"
                value={planCode}
                onChange={(e) => {
                  setPlanCode(e.target.value);
                  setOffset(0);
                }}
                borderRadius="xl"
              >
                <option value="">كل الباقات</option>
                {Object.entries(PLAN_CODES).map(([code, meta]) => (
                  <option key={code} value={code}>
                    {meta.label}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="xs" mb={1}>
                نوع العملية
              </FormLabel>
              <Select
                size="sm"
                value={paymentType}
                onChange={(e) => {
                  setPaymentType(e.target.value);
                  setOffset(0);
                }}
                borderRadius="xl"
              >
                {PAYMENT_TYPE_FILTERS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="xs" mb={1}>
                من تاريخ
              </FormLabel>
              <Input
                size="sm"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setOffset(0);
                }}
                borderRadius="xl"
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="xs" mb={1}>
                إلى تاريخ
              </FormLabel>
              <Input
                size="sm"
                type="date"
                min={startDate || undefined}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setOffset(0);
                }}
                borderRadius="xl"
              />
            </FormControl>
            <FormControl display="flex" alignItems="flex-end">
              <Checkbox
                isChecked={countedOnly}
                onChange={(e) => {
                  setCountedOnly(e.target.checked);
                  setOffset(0);
                }}
                colorScheme="blue"
              >
                الإيرادات الفعّالة فقط
              </Checkbox>
            </FormControl>
            <FormControl display="flex" alignItems="flex-end">
              <Checkbox
                isChecked={includeReversals}
                onChange={(e) => {
                  setIncludeReversals(e.target.checked);
                  setOffset(0);
                }}
                colorScheme="red"
              >
                إظهار عمليات الاسترداد
              </Checkbox>
            </FormControl>
          </SimpleGrid>

          <HStack justify="flex-end">
            <Button size="sm" variant="ghost" borderRadius="xl" onClick={resetFilters}>
              مسح الفلاتر
            </Button>
          </HStack>

          {loading ? (
            <Flex justify="center" py={12}>
              <Spinner color="green.500" />
            </Flex>
          ) : (
            <Box overflowX="auto">
              <Table size="sm" variant="simple" minW="980px">
                <Thead>
                  <Tr>
                    <Th>الوصف</Th>
                    <Th>المدرس</Th>
                    <Th isNumeric>المبلغ</Th>
                    <Th>الباقة</Th>
                    <Th>نوع العملية</Th>
                    <Th>الاشتراك</Th>
                    <Th>التاريخ</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {items.length === 0 ? (
                    <Tr>
                      <Td colSpan={7} textAlign="center" py={8} color={muted}>
                        لا توجد عمليات دخل مطابقة
                      </Td>
                    </Tr>
                  ) : (
                    items.map((row, index) => {
                      const typeKey = row.payment_type;
                      const typeMeta = incomePaymentTypeMeta(typeKey);
                      const planMeta = PLAN_CODES[row.plan_code] || {};
                      const subStatus =
                        SUBSCRIPTION_STATUS[row.subscription_status] ||
                        SUBSCRIPTION_STATUS[row.status];
                      const reversal = rowIsReversal(row);

                      return (
                        <Tr key={row.id ?? `${row.subscription_id}-${index}`} _hover={{ bg: rowHover }}>
                          <Td maxW="320px">
                            <Text fontSize="sm" noOfLines={2}>
                              {row.description || row.summary || "—"}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm" fontWeight="semibold">
                              {rowTeacherName(row)}
                            </Text>
                            {rowTeacherEmail(row) ? (
                              <Text fontSize="xs" color={muted} noOfLines={1}>
                                {rowTeacherEmail(row)}
                              </Text>
                            ) : null}
                          </Td>
                          <Td
                            isNumeric
                            fontWeight="bold"
                            color={reversal ? "red.500" : "green.500"}
                          >
                            {reversal ? "−" : ""}
                            {rowAmount(row)}
                          </Td>
                          <Td>
                            <Badge colorScheme={planMeta.colorScheme || "blue"}>
                              {row.plan_name_ar || planMeta.label || row.plan_code || "—"}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge colorScheme={typeMeta.colorScheme} fontSize="10px">
                              {incomePaymentTypeLabel(row)}
                            </Badge>
                          </Td>
                          <Td>
                            <Text fontFamily="mono" fontSize="xs">
                              {row.subscription_number || (row.subscription_id ? `#${row.subscription_id}` : "—")}
                            </Text>
                            {subStatus ? (
                              <Badge mt={1} colorScheme={subStatus.colorScheme} fontSize="10px">
                                {subStatus.label}
                              </Badge>
                            ) : null}
                          </Td>
                          <Td whiteSpace="nowrap">
                            {formatDate(
                              row.paid_at || row.payment_date || row.created_at || row.date,
                            )}
                          </Td>
                        </Tr>
                      );
                    })
                  )}
                </Tbody>
              </Table>
            </Box>
          )}

          {totalPages > 1 ? (
            <HStack justify="space-between" flexWrap="wrap" gap={2}>
              <Text fontSize="sm" color={muted}>
                {total} عملية — صفحة {page} من {totalPages}
              </Text>
              <HStack>
                <Button
                  size="sm"
                  variant="outline"
                  borderRadius="xl"
                  isDisabled={offset === 0 || loading}
                  onClick={() => setOffset((p) => Math.max(0, p - PAGE_SIZE))}
                >
                  السابق
                </Button>
                <Button
                  size="sm"
                  colorScheme="green"
                  borderRadius="xl"
                  isDisabled={offset + PAGE_SIZE >= total || loading}
                  onClick={() => setOffset((p) => p + PAGE_SIZE)}
                >
                  التالي
                </Button>
              </HStack>
            </HStack>
          ) : null}
        </VStack>
      </CardBody>
    </Card>
  );
}
