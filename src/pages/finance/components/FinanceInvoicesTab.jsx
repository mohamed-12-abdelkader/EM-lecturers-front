import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
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
import { MdVisibility } from "react-icons/md";
import {
  fetchFinanceInvoiceById,
  fetchFinanceInvoices,
  fetchFinanceTeachers,
} from "../../../api/financeApi";
import {
  formatDate,
  formatMoney,
  INVOICE_STATUS,
  INVOICE_TYPES,
  invoiceTypeLabel,
  paymentMethodLabel,
  teacherLabel,
} from "../financeConstants";
import InvoiceDetailView from "./InvoiceDetailView";

const PAGE_SIZE = 20;

export default function FinanceInvoicesTab({ refreshKey }) {
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filters, setFilters] = useState({
    teacher_id: "",
    subscription_id: "",
    invoice_type: "",
    search: "",
    start_date: "",
    end_date: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const detailModal = useDisclosure();
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");

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
      const result = await fetchFinanceInvoices({
        limit: PAGE_SIZE,
        offset,
        teacher_id: appliedFilters.teacher_id || undefined,
        subscription_id: appliedFilters.subscription_id || undefined,
        invoice_type: appliedFilters.invoice_type || undefined,
        search: appliedFilters.search.trim() || undefined,
        start_date: appliedFilters.start_date || undefined,
        end_date: appliedFilters.end_date || undefined,
      });
      setInvoices(result.invoices);
      setTotal(result.total);
    } catch (err) {
      toast({ title: err.message, status: "error", duration: 4000, isClosable: true });
      setInvoices([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [offset, appliedFilters, toast]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const openDetail = async (invoice) => {
    detailModal.onOpen();
    setDetailLoading(true);
    setSelectedInvoice(invoice);
    try {
      const full = await fetchFinanceInvoiceById(invoice.id);
      setSelectedInvoice(full);
    } catch (err) {
      toast({ title: err.message, status: "error", duration: 4000, isClosable: true });
    } finally {
      setDetailLoading(false);
    }
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
    setOffset(0);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <VStack align="stretch" spacing={4}>
      <Box>
        <Heading size="md">فواتير الاشتراكات</Heading>
        <Text fontSize="sm" color={muted} mt={1}>
          عرض وفلترة فواتير اشتراكات المدرسين
        </Text>
      </Box>

      <Card bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="2xl">
        <CardBody>
          <SimpleGridWrap>
            <FormControl>
              <FormLabel fontSize="sm">المدرس</FormLabel>
              <Select
                placeholder="كل المدرسين"
                value={filters.teacher_id}
                borderRadius="xl"
                onChange={(e) => setFilters((p) => ({ ...p, teacher_id: e.target.value }))}
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {teacherLabel(t)}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">رقم الاشتراك</FormLabel>
              <Input
                placeholder="SUB-2026-..."
                value={filters.subscription_id}
                borderRadius="xl"
                onChange={(e) => setFilters((p) => ({ ...p, subscription_id: e.target.value }))}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">نوع الفاتورة</FormLabel>
              <Select
                placeholder="الكل"
                value={filters.invoice_type}
                borderRadius="xl"
                onChange={(e) => setFilters((p) => ({ ...p, invoice_type: e.target.value }))}
              >
                {Object.entries(INVOICE_TYPES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">بحث</FormLabel>
              <Input
                placeholder="رقم الفاتورة أو المدرس..."
                value={filters.search}
                borderRadius="xl"
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">من تاريخ</FormLabel>
              <Input
                type="date"
                value={filters.start_date}
                borderRadius="xl"
                onChange={(e) => setFilters((p) => ({ ...p, start_date: e.target.value }))}
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">إلى تاريخ</FormLabel>
              <Input
                type="date"
                value={filters.end_date}
                borderRadius="xl"
                onChange={(e) => setFilters((p) => ({ ...p, end_date: e.target.value }))}
              />
            </FormControl>
          </SimpleGridWrap>
          <HStack mt={4} flexWrap="wrap" gap={2}>
            <Button colorScheme="blue" borderRadius="xl" onClick={applyFilters}>
              تطبيق الفلاتر
            </Button>
            <Button
              variant="outline"
              borderRadius="xl"
              onClick={() => {
                const cleared = {
                  teacher_id: "",
                  subscription_id: "",
                  invoice_type: "",
                  search: "",
                  start_date: "",
                  end_date: "",
                };
                setFilters(cleared);
                setAppliedFilters(cleared);
                setOffset(0);
              }}
            >
              مسح
            </Button>
          </HStack>
        </CardBody>
      </Card>

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
                    <Th>رقم الفاتورة</Th>
                    <Th>المدرس</Th>
                    <Th>النوع</Th>
                    <Th>الباقة</Th>
                    <Th isNumeric>الإجمالي</Th>
                    <Th isNumeric>المدفوع</Th>
                    <Th isNumeric>المتبقي</Th>
                    <Th>الدفع</Th>
                    <Th>الإصدار</Th>
                    <Th>الحالة</Th>
                    <Th />
                  </Tr>
                </Thead>
                <Tbody>
                  {invoices.length === 0 ? (
                    <Tr>
                      <Td colSpan={11} textAlign="center" py={8} color={muted}>
                        لا توجد فواتير
                      </Td>
                    </Tr>
                  ) : (
                    invoices.map((inv) => {
                      const st = INVOICE_STATUS[inv.status] || {
                        label: inv.status,
                        colorScheme: "gray",
                      };
                      return (
                        <Tr key={inv.id} _hover={{ bg: rowHoverBg }}>
                          <Td fontFamily="mono" fontSize="xs" fontWeight="semibold">
                            {inv.invoice_number || `#${inv.id}`}
                          </Td>
                          <Td>{inv.teacher_name || teacherLabel(inv.teacher)}</Td>
                          <Td>
                            <Badge colorScheme="blue" variant="subtle">
                              {invoiceTypeLabel(inv)}
                            </Badge>
                          </Td>
                          <Td>{inv.plan_name_ar || inv.plan_name || "—"}</Td>
                          <Td isNumeric fontWeight="bold">
                            {formatMoney(inv.amount)}
                          </Td>
                          <Td isNumeric color="green.500">
                            {formatMoney(inv.paid_amount ?? (inv.status === "paid" ? inv.amount : 0))}
                          </Td>
                          <Td isNumeric color={(inv.remaining_amount ?? 0) > 0 ? "orange.500" : muted}>
                            {formatMoney(inv.remaining_amount ?? 0)}
                          </Td>
                          <Td fontSize="xs">{paymentMethodLabel(inv)}</Td>
                          <Td whiteSpace="nowrap">{formatDate(inv.issued_at)}</Td>
                          <Td>
                            <Badge colorScheme={st.colorScheme}>{st.label}</Badge>
                          </Td>
                          <Td>
                            <IconButton
                              aria-label="عرض التفاصيل"
                              icon={<MdVisibility />}
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              onClick={() => openDetail(inv)}
                            />
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
            صفحة {page} من {totalPages} — {total} فاتورة
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
              isDisabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset((p) => p + PAGE_SIZE)}
            >
              التالي
            </Button>
          </HStack>
        </HStack>
      ) : null}

      <Modal isOpen={detailModal.isOpen} onClose={detailModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent dir="rtl">
          <ModalHeader>تفاصيل الفاتورة</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {detailLoading ? (
              <Flex justify="center" py={10}>
                <Spinner color="blue.500" />
              </Flex>
            ) : (
              <InvoiceDetailView invoice={selectedInvoice} showTeacher />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
}

function SimpleGridWrap({ children }) {
  return (
    <Box
      display="grid"
      gridTemplateColumns={{ base: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" }}
      gap={4}
    >
      {children}
    </Box>
  );
}
