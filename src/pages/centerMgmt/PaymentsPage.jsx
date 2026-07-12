import { useEffect, useMemo, useState } from "react";
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
import { FaPlus } from "react-icons/fa";
import {
  useGroups,
  useMonthSubscriptions,
  usePaymentMutations,
  usePayments,
  useStudents,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage } from "../../api/centerMgmtApi";
import {
  MONTH_NAMES,
  PAYMENT_METHOD_LABELS,
  currentMonthYear,
  field,
  formatDate,
  formatMoney,
  studentName,
} from "./centerMgmtUtils";
import { EmptyState, LoadingBlock, PageHeader, Surface } from "./components/UiBits";

export default function PaymentsPage() {
  const toast = useToast();
  const now = currentMonthYear();
  const [month, setMonth] = useState(String(now.month));
  const [year, setYear] = useState(String(now.year));
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [groupId, setGroupId] = useState("");
  const [page, setPage] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [form, setForm] = useState({
    studentId: "",
    groupId: "",
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
      groupId: groupId || undefined,
      search: debounced || undefined,
      page,
      limit: 20,
    }),
    [month, year, groupId, debounced, page]
  );

  const { data, isLoading } = usePayments(params);
  const items = data?.items || [];
  const { data: studentsData } = useStudents({ limit: 100, search: debounced || undefined });
  const students = studentsData?.items || [];
  const { data: groupsData } = useGroups({ limit: 100 });
  const groups = groupsData?.items || [];
  const { data: subsData } = useMonthSubscriptions(form.year, form.month, {
    groupId: form.groupId || undefined,
    limit: 100,
  });
  const subscriptions = (subsData?.items || []).filter(
    (s) => !form.studentId || String(field(s, "student_id", "studentId")) === form.studentId
  );
  const { createPayment } = usePaymentMutations();

  const openCreate = () => {
    setForm({
      studentId: "",
      groupId: groupId || "",
      subscriptionId: "",
      amount: "",
      month,
      year,
      method: "cash",
      notes: "",
    });
    onOpen();
  };

  const handleSave = async () => {
    if (!form.studentId || !form.amount) {
      toast({ title: "الطالب والمبلغ مطلوبان", status: "warning", duration: 2500 });
      return;
    }
    try {
      await createPayment.mutateAsync({
        studentId: Number(form.studentId),
        groupId: form.groupId ? Number(form.groupId) : undefined,
        subscriptionId: form.subscriptionId ? Number(form.subscriptionId) : undefined,
        year: Number(form.year),
        month: Number(form.month),
        amount: Number(form.amount),
        method: form.method,
        notes: form.notes || undefined,
      });
      toast({ title: "تم تسجيل الدفعة", status: "success", duration: 2000 });
      onClose();
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  return (
    <>
      <PageHeader
        title="المدفوعات"
        description="سجّل الدفعات واربطها بالاشتراك الشهري تلقائياً."
        actions={
          <Button leftIcon={<FaPlus />} colorScheme="blue" borderRadius="xl" onClick={openCreate}>
            دفعة جديدة
          </Button>
        }
      />

      <Surface mb={5}>
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3}>
          <Select value={month} onChange={(e) => setMonth(e.target.value)} borderRadius="xl">
            {MONTH_NAMES.slice(1).map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </Select>
          <Select value={year} onChange={(e) => setYear(e.target.value)} borderRadius="xl">
            {[now.year - 1, now.year, now.year + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          <Select
            placeholder="كل المجموعات"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            borderRadius="xl"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {field(g, "name")}
              </option>
            ))}
          </Select>
          <Input
            placeholder="بحث..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            borderRadius="xl"
          />
        </SimpleGrid>
      </Surface>

      {isLoading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState
          title="لا توجد مدفوعات"
          description="سجّل أول دفعة لهذا الشهر."
          action={
            <Button colorScheme="blue" borderRadius="xl" onClick={openCreate}>
              تسجيل دفعة
            </Button>
          }
        />
      ) : (
        <Surface p={0} overflow="hidden">
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>التاريخ</Th>
                  <Th>الطالب</Th>
                  <Th>المبلغ</Th>
                  <Th>الطريقة</Th>
                  <Th>الشهر</Th>
                  <Th>ملاحظات</Th>
                </Tr>
              </Thead>
              <Tbody>
                {items.map((p) => (
                  <Tr key={p.id}>
                    <Td>{formatDate(field(p, "created_at", "createdAt", "paid_at"))}</Td>
                    <Td fontWeight="medium">
                      {studentName(p) || field(p, "student_name")}
                    </Td>
                    <Td>{formatMoney(field(p, "amount"))}</Td>
                    <Td>
                      <Badge>
                        {PAYMENT_METHOD_LABELS[field(p, "method")] || field(p, "method") || "—"}
                      </Badge>
                    </Td>
                    <Td>
                      {field(p, "month")}/{field(p, "year")}
                    </Td>
                    <Td>{field(p, "notes") || "—"}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Surface>
      )}

      {(data?.totalPages || 1) > 1 && (
        <Flex justify="center" gap={2} mt={5}>
          <Button size="sm" isDisabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            السابق
          </Button>
          <Text fontSize="sm" alignSelf="center">
            {page} / {data.totalPages}
          </Text>
          <Button
            size="sm"
            isDisabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            التالي
          </Button>
        </Flex>
      )}

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
        <ModalOverlay />
        <ModalContent dir="rtl" borderRadius="2xl">
          <ModalHeader>تسجيل دفعة</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>الطالب</FormLabel>
                <Select
                  placeholder="اختر الطالب"
                  value={form.studentId}
                  onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
                  borderRadius="xl"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {studentName(s)}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <SimpleGrid columns={2} spacing={3}>
                <FormControl>
                  <FormLabel>المجموعة</FormLabel>
                  <Select
                    placeholder="اختياري"
                    value={form.groupId}
                    onChange={(e) => setForm((f) => ({ ...f, groupId: e.target.value }))}
                    borderRadius="xl"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {field(g, "name")}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>الاشتراك</FormLabel>
                  <Select
                    placeholder="اختياري"
                    value={form.subscriptionId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, subscriptionId: e.target.value }))
                    }
                    borderRadius="xl"
                  >
                    {subscriptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        #{s.id} · متبقي {formatMoney(field(s, "remaining"))}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </SimpleGrid>
              <SimpleGrid columns={3} spacing={3}>
                <FormControl isRequired>
                  <FormLabel>المبلغ</FormLabel>
                  <NumberInput
                    min={0}
                    value={form.amount}
                    onChange={(_, n) =>
                      setForm((f) => ({ ...f, amount: Number.isNaN(n) ? "" : n }))
                    }
                  >
                    <NumberInputField borderRadius="xl" />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>الشهر</FormLabel>
                  <Select
                    value={form.month}
                    onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}
                    borderRadius="xl"
                  >
                    {MONTH_NAMES.slice(1).map((name, idx) => (
                      <option key={name} value={idx + 1}>
                        {name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>السنة</FormLabel>
                  <Select
                    value={form.year}
                    onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                    borderRadius="xl"
                  >
                    {[now.year - 1, now.year, now.year + 1].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>طريقة الدفع</FormLabel>
                <Select
                  value={form.method}
                  onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
                  borderRadius="xl"
                >
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>ملاحظات</FormLabel>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  borderRadius="xl"
                  rows={2}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={onClose} borderRadius="xl">
              إلغاء
            </Button>
            <Button
              colorScheme="blue"
              borderRadius="xl"
              onClick={handleSave}
              isLoading={createPayment.isPending}
            >
              حفظ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
