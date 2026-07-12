import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Badge,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { FaPlus, FaReceipt } from "react-icons/fa";
import {
  usePaymentMutations,
  usePayments,
  useStudents,
  useSubscriptions,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage, fetchPaymentReceipt } from "../../api/centerMgmtApi";
import {
  PAYMENT_METHOD_LABELS,
  currentMonthYear,
  field,
  formatDate,
  formatMoney,
  studentName,
} from "./centerMgmtUtils";
import { EmptyState, LoadingBlock, PageHeader, Surface } from "./components/UiBits";

export default function PaymentsPage() {
  const { centerId, center } = useOutletContext();
  const toast = useToast();
  const now = currentMonthYear();
  const [month, setMonth] = useState(String(now.month));
  const [year, setYear] = useState(String(now.year));
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [form, setForm] = useState({
    studentId: "",
    subscriptionId: "",
    amount: "",
    month: String(now.month),
    year: String(now.year),
    method: "cash",
    notes: "",
  });

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo(
    () => ({
      month: month || undefined,
      year: year || undefined,
      search: debounced || undefined,
      page,
      limit: 20,
    }),
    [month, year, debounced, page]
  );

  const { data, isLoading } = usePayments(centerId, params);
  const { data: studentsData } = useStudents(centerId, { limit: 100 });
  const { data: subsData } = useSubscriptions(centerId, {
    studentId: form.studentId || undefined,
    status: "pending",
    limit: 50,
  });
  const { createPayment } = usePaymentMutations(centerId);

  const items = data?.items || [];
  const students = studentsData?.items || [];
  const pendingSubs = subsData?.items || [];
  const currency = field(center, "currency") || "EGP";

  const openCreate = () => {
    setForm({
      studentId: "",
      subscriptionId: "",
      amount: field(center, "default_fee", "defaultFee") || "",
      month: month || String(now.month),
      year: year || String(now.year),
      method: "cash",
      notes: "",
    });
    onOpen();
  };

  const handleSave = async () => {
    if (!form.studentId || !form.amount) {
      toast({ title: "الطالب والمبلغ مطلوبان", status: "warning", duration: 2000 });
      return;
    }
    try {
      await createPayment.mutateAsync({
        studentId: Number(form.studentId),
        subscriptionId: form.subscriptionId ? Number(form.subscriptionId) : undefined,
        amount: Number(form.amount),
        month: Number(form.month),
        year: Number(form.year),
        method: form.method,
        notes: form.notes || undefined,
      });
      toast({ title: "تم تسجيل الدفعة", status: "success", duration: 2500 });
      onClose();
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  const showReceipt = async (paymentId) => {
    try {
      const receipt = await fetchPaymentReceipt(centerId, paymentId);
      const invoice = field(receipt, "invoice_number", "invoiceNumber") || "—";
      toast({
        title: "إيصال الدفع",
        description: `الفاتورة: ${invoice} · المبلغ: ${formatMoney(field(receipt, "amount"), currency)}`,
        status: "info",
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  return (
    <>
      <PageHeader
        title="المدفوعات"
        description="سجّل دفعة واربطها باشتراك لتفعيلها وإنشاء فاتورة تلقائياً."
        actions={
          <Button leftIcon={<FaPlus />} colorScheme="blue" borderRadius="xl" onClick={openCreate}>
            تسجيل دفعة
          </Button>
        }
      />

      <Surface mb={5}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
          <Select value={month} onChange={(e) => { setMonth(e.target.value); setPage(1); }} borderRadius="xl">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>شهر {i + 1}</option>
            ))}
          </Select>
          <Input type="number" value={year} onChange={(e) => { setYear(e.target.value); setPage(1); }} borderRadius="xl" />
          <Input
            placeholder="بحث..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            borderRadius="xl"
          />
        </SimpleGrid>
      </Surface>

      {isLoading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState
          title="لا توجد مدفوعات"
          description="سجّل أول دفعة لطالب."
          action={
            <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={openCreate}>
              تسجيل دفعة
            </Button>
          }
        />
      ) : (
        <Surface p={0} overflow="hidden">
          <TableContainer>
            <Table>
              <Thead>
                <Tr>
                  <Th>الطالب</Th>
                  <Th>المبلغ</Th>
                  <Th>الشهر</Th>
                  <Th>الطريقة</Th>
                  <Th>التاريخ</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {items.map((p) => (
                  <Tr key={p.id}>
                    <Td fontWeight="medium">{studentName(p) || field(p, "student_id")}</Td>
                    <Td>{formatMoney(field(p, "amount"), currency)}</Td>
                    <Td>
                      {field(p, "month")}/{field(p, "year")}
                    </Td>
                    <Td>
                      <Badge>{PAYMENT_METHOD_LABELS[field(p, "method")] || field(p, "method")}</Badge>
                    </Td>
                    <Td>{formatDate(field(p, "created_at", "paid_at", "createdAt"))}</Td>
                    <Td>
                      <Button
                        size="xs"
                        leftIcon={<FaReceipt />}
                        variant="ghost"
                        colorScheme="blue"
                        onClick={() => showReceipt(p.id)}
                      >
                        إيصال
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
          <Flex justify="flex-end" gap={2} px={4} py={3}>
            <Button size="sm" isDisabled={page <= 1} onClick={() => setPage((p) => p - 1)}>السابق</Button>
            <Text fontSize="sm" alignSelf="center">{page} / {data?.totalPages || 1}</Text>
            <Button size="sm" isDisabled={page >= (data?.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>التالي</Button>
          </Flex>
        </Surface>
      )}

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="2xl" mx={3}>
          <ModalHeader>تسجيل دفعة</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>الطالب</FormLabel>
                <Select
                  value={form.studentId}
                  onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value, subscriptionId: "" }))}
                  borderRadius="xl"
                >
                  <option value="">اختر طالباً</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {studentName(s)}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>اشتراك مرتبط (اختياري)</FormLabel>
                <Select
                  value={form.subscriptionId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const sub = pendingSubs.find((x) => String(x.id) === id);
                    setForm((f) => ({
                      ...f,
                      subscriptionId: id,
                      amount: sub ? field(sub, "amount") : f.amount,
                      month: sub ? String(field(sub, "month")) : f.month,
                      year: sub ? String(field(sub, "year")) : f.year,
                    }));
                  }}
                  borderRadius="xl"
                >
                  <option value="">بدون اشتراك</option>
                  {pendingSubs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {field(s, "month")}/{field(s, "year")} · {formatMoney(field(s, "amount"), currency)}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <SimpleGrid columns={2} spacing={3} w="full">
                <FormControl isRequired>
                  <FormLabel>المبلغ</FormLabel>
                  <NumberInput min={0} value={form.amount} onChange={(_, n) => setForm((f) => ({ ...f, amount: Number.isNaN(n) ? "" : n }))}>
                    <NumberInputField borderRadius="xl" />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>طريقة الدفع</FormLabel>
                  <Select value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))} borderRadius="xl">
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>الشهر</FormLabel>
                  <Select value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))} borderRadius="xl">
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>السنة</FormLabel>
                  <Input type="number" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} borderRadius="xl" />
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>ملاحظات</FormLabel>
                <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} borderRadius="xl" />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={onClose}>إلغاء</Button>
            <Button colorScheme="blue" onClick={handleSave} isLoading={createPayment.isPending} borderRadius="xl">
              حفظ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
