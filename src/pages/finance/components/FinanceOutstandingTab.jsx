import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { MdMoreVert, MdPayments } from "react-icons/md";
import { fetchOutstandingBalances, recordSubscriptionPayment } from "../../../api/financeApi";
import {
  formatDate,
  formatMoney,
  paymentStatusMeta,
  PLAN_CODES,
  SUBSCRIPTION_STATUS,
  teacherLabel,
} from "../financeConstants";
import RecordPaymentModal from "./RecordPaymentModal";

const PAGE_SIZE = 15;

export default function FinanceOutstandingTab({ refreshKey, onChanged }) {
  const [balances, setBalances] = useState([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [count, setCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const paymentModal = useDisclosure();
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchOutstandingBalances({ limit: PAGE_SIZE, offset });
      setBalances(result.balances);
      setTotalOutstanding(result.total_outstanding);
      setCount(result.count);
    } catch (err) {
      toast({ title: err.message, status: "error", duration: 4000, isClosable: true });
      setBalances([]);
      setTotalOutstanding(0);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [offset, toast]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const handleRecordPayment = async (payload) => {
    if (!selectedSub) return;
    setActionLoading(true);
    try {
      await recordSubscriptionPayment(selectedSub.id, payload);
      toast({ title: "تم تسجيل الدفعة", status: "success", duration: 3000, isClosable: true });
      paymentModal.onClose();
      onChanged?.();
      load();
    } catch (err) {
      toast({ title: err.message, status: "error", duration: 4000, isClosable: true });
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const page = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <VStack align="stretch" spacing={4}>
      <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={3}>
        <Box>
          <Heading size="md">المستحقات على المدرسين</Heading>
          <Text fontSize="sm" color={muted} mt={1}>
            اشتراكات عليها مبالغ متبقية — تسجيل دفعات لاحقة
          </Text>
        </Box>
        <Card bg="orange.50" _dark={{ bg: "orange.900" }} borderRadius="xl" px={5} py={3}>
          <Text fontSize="xs" color={muted}>
            إجمالي المتبقي
          </Text>
          <Text fontSize="2xl" fontWeight="black" color="orange.600" _dark={{ color: "orange.200" }}>
            {formatMoney(totalOutstanding)}
          </Text>
          <Text fontSize="xs" color={muted}>
            {count} اشتراك
          </Text>
        </Card>
      </Flex>

      <Card bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="2xl" overflow="hidden">
        <CardBody p={0}>
          {loading ? (
            <Flex justify="center" py={14}>
              <Spinner color="blue.500" />
            </Flex>
          ) : (
            <Box overflowX="auto">
              <Table size="sm" variant="simple" minW="960px">
                <Thead>
                  <Tr>
                    <Th>المدرس</Th>
                    <Th>رقم الاشتراك</Th>
                    <Th>الباقة</Th>
                    <Th isNumeric>الإجمالي</Th>
                    <Th isNumeric>المدفوع</Th>
                    <Th isNumeric>المتبقي</Th>
                    <Th>حالة الدفع</Th>
                    <Th>الانتهاء</Th>
                    <Th />
                  </Tr>
                </Thead>
                <Tbody>
                  {balances.length === 0 ? (
                    <Tr>
                      <Td colSpan={9} textAlign="center" py={8} color={muted}>
                        لا توجد مستحقات حالياً
                      </Td>
                    </Tr>
                  ) : (
                    balances.map((sub) => {
                      const pay = paymentStatusMeta(sub.payment_status);
                      const st = SUBSCRIPTION_STATUS[sub.status] || { label: sub.status, colorScheme: "gray" };
                      const planMeta = PLAN_CODES[sub.plan_code] || {};
                      return (
                        <Tr key={sub.id}>
                          <Td>{sub.teacher_name || teacherLabel(sub.teacher)}</Td>
                          <Td fontFamily="mono" fontSize="xs">
                            {sub.subscription_number || `#${sub.id}`}
                          </Td>
                          <Td>
                            <Badge colorScheme={planMeta.colorScheme || "blue"}>
                              {sub.plan_name_ar || planMeta.label || sub.plan_code}
                            </Badge>
                          </Td>
                          <Td isNumeric>{formatMoney(sub.actual_price)}</Td>
                          <Td isNumeric color="green.500">{formatMoney(sub.paid_amount)}</Td>
                          <Td isNumeric fontWeight="bold" color="orange.500">
                            {formatMoney(sub.remaining_amount)}
                          </Td>
                          <Td>
                            <Badge colorScheme={pay.colorScheme}>{pay.label}</Badge>
                          </Td>
                          <Td>
                            <Text fontSize="xs">{formatDate(sub.ends_at)}</Text>
                            <Badge mt={1} size="sm" colorScheme={st.colorScheme}>
                              {st.label}
                            </Badge>
                          </Td>
                          <Td>
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<MdMoreVert />}
                                variant="ghost"
                                size="sm"
                                aria-label="إجراءات"
                              />
                              <MenuList>
                                <MenuItem
                                  icon={<MdPayments />}
                                  onClick={() => {
                                    setSelectedSub(sub);
                                    paymentModal.onOpen();
                                  }}
                                >
                                  تسجيل دفعة
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          </Td>
                        </Tr>
                      );
                    })
                  )}
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>

      {totalPages > 1 ? (
        <HStack justify="space-between">
          <Text fontSize="sm" color={muted}>
            صفحة {page} من {totalPages}
          </Text>
          <HStack>
            <Button
              size="sm"
              variant="outline"
              borderRadius="xl"
              isDisabled={offset === 0}
              onClick={() => setOffset((p) => Math.max(0, p - PAGE_SIZE))}
            >
              السابق
            </Button>
            <Button
              size="sm"
              colorScheme="blue"
              borderRadius="xl"
              isDisabled={offset + PAGE_SIZE >= count}
              onClick={() => setOffset((p) => p + PAGE_SIZE)}
            >
              التالي
            </Button>
          </HStack>
        </HStack>
      ) : null}

      <RecordPaymentModal
        isOpen={paymentModal.isOpen}
        onClose={paymentModal.onClose}
        subscription={selectedSub}
        onSubmit={handleRecordPayment}
        isLoading={actionLoading}
      />
    </VStack>
  );
}
