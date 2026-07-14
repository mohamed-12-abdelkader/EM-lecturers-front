import { useEffect, useMemo, useState } from "react";
import {
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
  HStack,
} from "@chakra-ui/react";
import { FaPlus } from "react-icons/fa";
import {
  useBillingMonth,
  useGroups,
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
import {
  DesktopOnly,
  EmptyState,
  FilterBar,
  ListCard,
  LoadingBlock,
  MobileOnly,
  PageHeader,
  PaginationBar,
  PrimaryButton,
  StatusBadge,
  Surface,
} from "./components/UiBits";

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
    student_id: "",
    group_id: "",
    subscription_id: "",
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
      group_id: groupId || undefined,
      page,
      limit: 20,
    }),
    [month, year, groupId, page]
  );

  const { data, isLoading } = usePayments(params);
  const items = (data?.items || []).filter((p) => {
    if (!debounced) return true;
    const q = debounced.toLowerCase();
    return String(studentName(p) || field(p, "student_name") || "")
      .toLowerCase()
      .includes(q);
  });
  const { data: studentsData } = useStudents({ limit: 100 });
  const students = studentsData?.items || [];
  const { data: groupsData } = useGroups({ limit: 100 });
  const groups = groupsData?.items || [];
  const { data: billingData } = useBillingMonth(form.year, form.month, {
    group_id: form.group_id || undefined,
  });
  const subscriptions = (billingData?.subscriptions || []).filter(
    (s) => !form.student_id || String(field(s, "student_id", "studentId")) === form.student_id
  );
  const { createPayment } = usePaymentMutations();

  const openCreate = () => {
    setForm({
      student_id: "",
      group_id: groupId || "",
      subscription_id: "",
      amount: "",
      month,
      year,
      method: "cash",
      notes: "",
    });
    onOpen();
  };

  const handleSave = async () => {
    if (!form.student_id || !form.amount) {
      toast({ title: "الطالب والمبلغ مطلوبان", status: "warning", duration: 2500 });
      return;
    }
    try {
      await createPayment.mutateAsync({
        student_id: Number(form.student_id),
        group_id: form.group_id ? Number(form.group_id) : undefined,
        subscription_id: form.subscription_id ? Number(form.subscription_id) : undefined,
        year: Number(form.year),
        month: Number(form.month),
        amount: Number(form.amount),
        method: form.method,
        notes: form.notes || null,
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
        description="سجّل الدفعات واربطها بالاشتراك ليُحدَّث المتبقي تلقائياً."
        actions={
          <PrimaryButton
            leftIcon={<FaPlus />}
            onClick={openCreate}
            size={{ base: "sm", md: "md" }}
          >
            دفعة جديدة
          </PrimaryButton>
        }
      />

      <FilterBar>
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3}>
          <Select
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setPage(1);
            }}
            borderRadius="xl"
          >
            {MONTH_NAMES.slice(1).map((name, idx) => (
              <option key={name} value={idx + 1}>{name}</option>
            ))}
          </Select>
          <Select
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setPage(1);
            }}
            borderRadius="xl"
          >
            {[now.year - 1, now.year, now.year + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
          <Select
            placeholder="كل المجموعات"
            value={groupId}
            onChange={(e) => {
              setGroupId(e.target.value);
              setPage(1);
            }}
            borderRadius="xl"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{field(g, "name")}</option>
            ))}
          </Select>
          <Input
            placeholder="بحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            borderRadius="xl"
          />
        </SimpleGrid>
      </FilterBar>

      {isLoading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState
          title="لا توجد مدفوعات"
          action={
            <PrimaryButton onClick={openCreate}>تسجيل دفعة</PrimaryButton>
          }
        />
      ) : (
        <>
          <MobileOnly>
            <VStack spacing={3} align="stretch">
              {items.map((p) => (
                <ListCard key={p.id}>
                  <Flex justify="space-between" align="flex-start" gap={2} mb={2}>
                    <VStack align="flex-start" spacing={0.5} minW={0}>
                      <Text fontWeight="black" noOfLines={1}>
                        {studentName(p) || field(p, "student_name")}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {formatDate(field(p, "created_at", "createdAt", "paid_at"))}
                      </Text>
                    </VStack>
                    <Text fontWeight="black" color="blue.600" flexShrink={0}>
                      {formatMoney(field(p, "amount"))}
                    </Text>
                  </Flex>
                  <HStack spacing={3} fontSize="sm" color="gray.600" flexWrap="wrap">
                    <StatusBadge>
                      {PAYMENT_METHOD_LABELS[field(p, "method")] || field(p, "method") || "—"}
                    </StatusBadge>
                    <Text>
                      {field(p, "month")}/{field(p, "year")}
                    </Text>
                    {field(p, "notes") ? (
                      <Text noOfLines={1} color="gray.500">
                        {field(p, "notes")}
                      </Text>
                    ) : null}
                  </HStack>
                </ListCard>
              ))}
            </VStack>
          </MobileOnly>

          <DesktopOnly>
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
                        <Td fontWeight="medium">{studentName(p) || field(p, "student_name")}</Td>
                        <Td>{formatMoney(field(p, "amount"))}</Td>
                        <Td>
                          <StatusBadge>
                            {PAYMENT_METHOD_LABELS[field(p, "method")] || field(p, "method") || "—"}
                          </StatusBadge>
                        </Td>
                        <Td>{field(p, "month")}/{field(p, "year")}</Td>
                        <Td>{field(p, "notes") || "—"}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Surface>
          </DesktopOnly>
        </>
      )}

      <PaginationBar
        page={page}
        totalPages={data?.totalPages || 1}
        onPrev={() => setPage((p) => p - 1)}
        onNext={() => setPage((p) => p + 1)}
      />

      <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", md: "lg" }}>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent dir="rtl" borderRadius={{ base: "none", md: "2xl" }} m={0}>
          <ModalHeader>تسجيل دفعة</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>الطالب</FormLabel>
                <Select
                  placeholder="اختر الطالب"
                  value={form.student_id}
                  onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
                  borderRadius="xl"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{studentName(s)}</option>
                  ))}
                </Select>
              </FormControl>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel>المجموعة</FormLabel>
                  <Select
                    placeholder="اختياري"
                    value={form.group_id}
                    onChange={(e) => setForm((f) => ({ ...f, group_id: e.target.value }))}
                    borderRadius="xl"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{field(g, "name")}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>الاشتراك</FormLabel>
                  <Select
                    placeholder="اختياري"
                    value={form.subscription_id}
                    onChange={(e) => setForm((f) => ({ ...f, subscription_id: e.target.value }))}
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
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
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
                      <option key={name} value={idx + 1}>{name}</option>
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
                      <option key={y} value={y}>{y}</option>
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
                    <option key={key} value={key}>{label}</option>
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
          <ModalFooter gap={2} flexDir={{ base: "column-reverse", md: "row" }}>
            <Button
              variant="ghost"
              onClick={onClose}
              borderRadius="xl"
              w={{ base: "full", md: "auto" }}
            >
              إلغاء
            </Button>
            <PrimaryButton
              onClick={handleSave}
              isLoading={createPayment.isPending}
              w={{ base: "full", md: "auto" }}
            >
              حفظ
            </PrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
