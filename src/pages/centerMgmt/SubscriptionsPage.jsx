import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Checkbox,
  CheckboxGroup,
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
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { FaCalendarPlus } from "react-icons/fa";
import {
  useBillingMonths,
  useGroups,
  useMonthSubscriptions,
  useSubscriptionMutations,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage } from "../../api/centerMgmtApi";
import {
  MONTH_NAMES,
  SUBSCRIPTION_LABELS,
  currentMonthYear,
  field,
  formatMoney,
  studentName,
} from "./centerMgmtUtils";
import { EmptyState, LoadingBlock, PageHeader, Surface } from "./components/UiBits";

export default function SubscriptionsPage() {
  const toast = useToast();
  const now = currentMonthYear();
  const [month, setMonth] = useState(String(now.month));
  const [year, setYear] = useState(String(now.year));
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [groupId, setGroupId] = useState("");
  const [page, setPage] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [openForm, setOpenForm] = useState({
    year: String(now.year),
    month: String(now.month),
    groupIds: [],
    notes: "",
  });
  const [editSub, setEditSub] = useState(null);
  const [editForm, setEditForm] = useState({
    status: "paid",
    amountPaid: "",
    amountDue: "",
    exemptionReason: "",
  });
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  const params = useMemo(
    () => ({
      groupId: groupId || undefined,
      status: status || undefined,
      search: search || undefined,
      page,
      limit: 20,
    }),
    [groupId, status, search, page]
  );

  const { data: groupsData } = useGroups({ limit: 100 });
  const groups = groupsData?.items || [];
  const { data: months = [] } = useBillingMonths();
  const { data, isLoading } = useMonthSubscriptions(year, month, params);
  const items = data?.items || [];
  const { openMonth, updateSubscription } = useSubscriptionMutations();

  const handleOpenMonth = async () => {
    try {
      await openMonth.mutateAsync({
        year: Number(openForm.year),
        month: Number(openForm.month),
        groupIds: openForm.groupIds.length
          ? openForm.groupIds.map(Number)
          : undefined,
        notes: openForm.notes || undefined,
      });
      toast({ title: "تم فتح الشهر وإنشاء الاشتراكات", status: "success", duration: 2500 });
      setMonth(openForm.month);
      setYear(openForm.year);
      onClose();
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  const openEdit = (sub) => {
    setEditSub(sub);
    setEditForm({
      status: field(sub, "status") || "unpaid",
      amountPaid: field(sub, "amount_paid", "amountPaid") ?? "",
      amountDue: field(sub, "amount_due", "amountDue") ?? "",
      exemptionReason: field(sub, "exemption_reason", "exemptionReason") || "",
    });
    onEditOpen();
  };

  const handleUpdate = async () => {
    if (!editSub) return;
    const payload = { status: editForm.status };
    if (editForm.status === "partial") {
      payload.amountPaid = Number(editForm.amountPaid) || 0;
    }
    if (editForm.amountDue !== "") {
      payload.amountDue = Number(editForm.amountDue);
    }
    if (editForm.status === "exempt") {
      payload.exemptionReason = editForm.exemptionReason || null;
    }
    try {
      await updateSubscription.mutateAsync({
        subscriptionId: editSub.id,
        payload,
      });
      toast({ title: "تم تحديث الاشتراك", status: "success", duration: 2000 });
      onEditClose();
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  return (
    <>
      <PageHeader
        title="الاشتراكات الشهرية"
        description="افتح شهراً جديداً، راجع حالات الدفع، وحدّث حالة كل طالب."
        actions={
          <Button
            leftIcon={<FaCalendarPlus />}
            colorScheme="blue"
            borderRadius="xl"
            onClick={onOpen}
          >
            فتح شهر
          </Button>
        }
      />

      <Surface mb={5}>
        <SimpleGrid columns={{ base: 1, md: 5 }} spacing={3}>
          <Select
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setPage(1);
            }}
            borderRadius="xl"
          >
            {MONTH_NAMES.slice(1).map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
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
              <option key={y} value={y}>
                {y}
              </option>
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
              <option key={g.id} value={g.id}>
                {field(g, "name")}
              </option>
            ))}
          </Select>
          <Select
            placeholder="كل الحالات"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            borderRadius="xl"
          >
            {Object.entries(SUBSCRIPTION_LABELS).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </Select>
          <Input
            placeholder="بحث باسم الطالب..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            borderRadius="xl"
          />
        </SimpleGrid>
        {months.length > 0 && (
          <Text fontSize="xs" color="gray.500" mt={3}>
            أشهر مفتوحة:{" "}
            {months
              .slice(0, 8)
              .map(
                (m) =>
                  `${MONTH_NAMES[field(m, "month")] || field(m, "month")}/${field(m, "year")}`
              )
              .join(" · ")}
          </Text>
        )}
      </Surface>

      {isLoading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState
          title="لا توجد اشتراكات لهذا الشهر"
          description="افتح الشهر لإنشاء اشتراكات الطلاب المسجلين."
          action={
            <Button colorScheme="blue" borderRadius="xl" onClick={onOpen}>
              فتح شهر
            </Button>
          }
        />
      ) : (
        <Surface p={0} overflow="hidden">
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>الطالب</Th>
                  <Th>المجموعة</Th>
                  <Th>المطلوب</Th>
                  <Th>المدفوع</Th>
                  <Th>المتبقي</Th>
                  <Th>الحالة</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {items.map((sub) => {
                  const st = field(sub, "status");
                  const meta = SUBSCRIPTION_LABELS[st] || {
                    label: st || "—",
                    scheme: "gray",
                  };
                  return (
                    <Tr key={sub.id}>
                      <Td fontWeight="medium">
                        {studentName(sub) || field(sub, "student_name")}
                      </Td>
                      <Td>{field(sub, "group_name", "groupName") || "—"}</Td>
                      <Td>{formatMoney(field(sub, "amount_due", "amountDue"))}</Td>
                      <Td>{formatMoney(field(sub, "amount_paid", "amountPaid"))}</Td>
                      <Td>{formatMoney(field(sub, "remaining"))}</Td>
                      <Td>
                        <Badge colorScheme={meta.scheme}>{meta.label}</Badge>
                      </Td>
                      <Td>
                        <Button size="xs" variant="ghost" onClick={() => openEdit(sub)}>
                          تحديث
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
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
          <ModalHeader>فتح شهر اشتراكات</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <SimpleGrid columns={2} spacing={3}>
                <FormControl>
                  <FormLabel>الشهر</FormLabel>
                  <Select
                    value={openForm.month}
                    onChange={(e) => setOpenForm((f) => ({ ...f, month: e.target.value }))}
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
                    value={openForm.year}
                    onChange={(e) => setOpenForm((f) => ({ ...f, year: e.target.value }))}
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
                <FormLabel>مجموعات محددة (اختياري — فارغ = كل النشطة)</FormLabel>
                <CheckboxGroup
                  value={openForm.groupIds}
                  onChange={(groupIds) => setOpenForm((f) => ({ ...f, groupIds }))}
                >
                  <Wrap>
                    {groups.map((g) => (
                      <WrapItem key={g.id}>
                        <Checkbox value={String(g.id)}>{field(g, "name")}</Checkbox>
                      </WrapItem>
                    ))}
                  </Wrap>
                </CheckboxGroup>
              </FormControl>
              <FormControl>
                <FormLabel>ملاحظات</FormLabel>
                <Textarea
                  value={openForm.notes}
                  onChange={(e) => setOpenForm((f) => ({ ...f, notes: e.target.value }))}
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
              onClick={handleOpenMonth}
              isLoading={openMonth.isPending}
            >
              فتح الشهر
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={onEditClose} isCentered>
        <ModalOverlay />
        <ModalContent dir="rtl" borderRadius="2xl">
          <ModalHeader>تحديث حالة الاشتراك</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>الحالة</FormLabel>
                <Select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                  borderRadius="xl"
                >
                  {Object.entries(SUBSCRIPTION_LABELS).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
              {editForm.status === "partial" && (
                <FormControl>
                  <FormLabel>المبلغ المدفوع</FormLabel>
                  <NumberInput
                    value={editForm.amountPaid}
                    min={0}
                    onChange={(_, n) =>
                      setEditForm((f) => ({
                        ...f,
                        amountPaid: Number.isNaN(n) ? "" : n,
                      }))
                    }
                  >
                    <NumberInputField borderRadius="xl" />
                  </NumberInput>
                </FormControl>
              )}
              <FormControl>
                <FormLabel>المبلغ المطلوب (اختياري)</FormLabel>
                <NumberInput
                  value={editForm.amountDue}
                  min={0}
                  onChange={(_, n) =>
                    setEditForm((f) => ({
                      ...f,
                      amountDue: Number.isNaN(n) ? "" : n,
                    }))
                  }
                >
                  <NumberInputField borderRadius="xl" />
                </NumberInput>
              </FormControl>
              {editForm.status === "exempt" && (
                <FormControl>
                  <FormLabel>سبب الإعفاء</FormLabel>
                  <Input
                    value={editForm.exemptionReason}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, exemptionReason: e.target.value }))
                    }
                    borderRadius="xl"
                  />
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={onEditClose} borderRadius="xl">
              إلغاء
            </Button>
            <Button
              colorScheme="blue"
              borderRadius="xl"
              onClick={handleUpdate}
              isLoading={updateSubscription.isPending}
            >
              حفظ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
