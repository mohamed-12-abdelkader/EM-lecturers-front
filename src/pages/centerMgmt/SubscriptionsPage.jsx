import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
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
import { FaCalendarPlus, FaSave } from "react-icons/fa";
import {
  useBillingMonth,
  useBillingMonths,
  useBillingMutations,
  useGroups,
  useStudents,
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
import {
  DesktopOnly,
  EmptyState,
  FilterBar,
  KpiCard,
  ListCard,
  LoadingBlock,
  MobileOnly,
  PageHeader,
  PrimaryButton,
  StatusBadge,
  Surface,
} from "./components/UiBits";

export default function SubscriptionsPage() {
  const toast = useToast();
  const now = currentMonthYear();
  const [month, setMonth] = useState(String(now.month));
  const [year, setYear] = useState(String(now.year));
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [groupId, setGroupId] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [openForm, setOpenForm] = useState({
    year: String(now.year),
    month: String(now.month),
    default_status: "unpaid",
    notes: "",
    renewed_student_ids: [],
  });
  const [editSub, setEditSub] = useState(null);
  const [editForm, setEditForm] = useState({
    status: "paid",
    amount_paid: "",
    exemption_reason: "",
  });
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [selectedPaid, setSelectedPaid] = useState({});

  const params = useMemo(
    () => ({
      group_id: groupId || undefined,
      status: status || undefined,
      search: search || undefined,
    }),
    [groupId, status, search]
  );

  const { data: groupsData } = useGroups({ limit: 100 });
  const groups = groupsData?.items || [];
  const { data: months = [] } = useBillingMonths();
  const { data: studentsData } = useStudents({ limit: 200, is_active: "true" });
  const allStudents = studentsData?.items || [];
  const { data, isLoading } = useBillingMonth(year, month, params);
  const items = data?.subscriptions || [];
  const summary = data?.summary || {};
  const { openMonth, updateSubscription, bulkUpdate } = useBillingMutations();

  const handleOpenMonth = async () => {
    try {
      await openMonth.mutateAsync({
        year: Number(openForm.year),
        month: Number(openForm.month),
        renewed_student_ids: openForm.renewed_student_ids.map(Number),
        default_status: openForm.default_status,
        notes: openForm.notes || undefined,
      });
      toast({ title: "تم فتح الشهر المالي وإنشاء الاشتراكات", status: "success", duration: 2500 });
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
      amount_paid: field(sub, "amount_paid", "amountPaid") ?? "",
      exemption_reason: field(sub, "exemption_reason", "exemptionReason") || "",
    });
    onEditOpen();
  };

  const handleUpdate = async () => {
    if (!editSub) return;
    const payload = { status: editForm.status };
    if (editForm.status === "partial") {
      payload.amount_paid = Number(editForm.amount_paid) || 0;
    }
    if (editForm.status === "exempt") {
      payload.exemption_reason = editForm.exemption_reason || null;
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

  const handleBulkSave = async () => {
    const updates = Object.entries(selectedPaid).map(([subscription_id, st]) => {
      const row = { subscription_id: Number(subscription_id), status: st };
      return row;
    });
    if (!updates.length) {
      toast({ title: "حدّد حالات أولاً من العمود السريع", status: "warning", duration: 2500 });
      return;
    }
    try {
      await bulkUpdate.mutateAsync({ updates });
      toast({ title: "تم التحديث الجماعي", status: "success", duration: 2000 });
      setSelectedPaid({});
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  const toggleRenewed = (id) => {
    setOpenForm((f) => {
      const set = new Set(f.renewed_student_ids.map(String));
      const sid = String(id);
      if (set.has(sid)) set.delete(sid);
      else set.add(sid);
      return { ...f, renewed_student_ids: [...set] };
    });
  };

  const quickSelect = (subId) => (
    <Select
      size="sm"
      value={selectedPaid[subId] || ""}
      placeholder="تحديث سريع"
      onChange={(e) =>
        setSelectedPaid((m) => ({ ...m, [subId]: e.target.value }))
      }
      borderRadius="lg"
      w="full"
    >
      <option value="paid">مدفوع</option>
      <option value="unpaid">غير مدفوع</option>
      <option value="partial">جزئي</option>
      <option value="exempt">معفى</option>
    </Select>
  );

  return (
    <>
      <PageHeader
        title="الشهر المالي"
        description="افتح شهراً، حدّد من جددوا، وعدّل حالات الدفع الجزئي والإعفاء."
        actions={
          <>
            <Button
              leftIcon={<FaSave />}
              variant="outline"
              borderRadius="xl"
              onClick={handleBulkSave}
              isLoading={bulkUpdate.isPending}
              size={{ base: "sm", md: "md" }}
            >
              حفظ التحديد الجماعي
            </Button>
            <PrimaryButton
              leftIcon={<FaCalendarPlus />}
              onClick={onOpen}
              size={{ base: "sm", md: "md" }}
            >
              فتح شهر
            </PrimaryButton>
          </>
        }
      />

      <FilterBar>
        <SimpleGrid columns={{ base: 1, md: 5 }} spacing={3}>
          <Select value={month} onChange={(e) => setMonth(e.target.value)} borderRadius="xl">
            {MONTH_NAMES.slice(1).map((name, idx) => (
              <option key={name} value={idx + 1}>{name}</option>
            ))}
          </Select>
          <Select value={year} onChange={(e) => setYear(e.target.value)} borderRadius="xl">
            {[now.year - 1, now.year, now.year + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
          <Select
            placeholder="كل المجموعات"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            borderRadius="xl"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{field(g, "name")}</option>
            ))}
          </Select>
          <Select
            placeholder="كل الحالات"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            borderRadius="xl"
          >
            {Object.entries(SUBSCRIPTION_LABELS).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </Select>
          <Input
            placeholder="بحث باسم الطالب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            borderRadius="xl"
          />
        </SimpleGrid>
        {months.length > 0 && (
          <Text fontSize="xs" color="gray.500" mt={3}>
            أشهر مفتوحة:{" "}
            {months
              .slice(0, 8)
              .map((m) => `${MONTH_NAMES[field(m, "month")] || field(m, "month")}/${field(m, "year")}`)
              .join(" · ")}
          </Text>
        )}
      </FilterBar>

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 2, md: 3 }} mb={5}>
        <KpiCard label="المتوقّع" value={formatMoney(summary.expected)} color="purple" />
        <KpiCard label="المحصّل" value={formatMoney(summary.collected)} color="green" />
        <KpiCard label="المتبقي" value={formatMoney(summary.remaining)} color="orange" />
        <KpiCard
          label="مدفوع / غير مدفوع"
          value={`${summary.paid_count ?? 0} / ${summary.unpaid_count ?? 0}`}
          color="blue"
        />
      </SimpleGrid>

      {isLoading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState
          title="لا توجد اشتراكات لهذا الشهر"
          description="افتح الشهر المالي لإنشاء اشتراكات الطلاب النشطين."
          action={
            <PrimaryButton onClick={onOpen}>فتح شهر</PrimaryButton>
          }
        />
      ) : (
        <>
          <MobileOnly>
            <VStack spacing={3} align="stretch">
              {items.map((sub) => {
                const st = field(sub, "status");
                const meta = SUBSCRIPTION_LABELS[st] || { label: st || "—", scheme: "gray" };
                return (
                  <ListCard key={sub.id}>
                    <Flex justify="space-between" align="flex-start" gap={2} mb={2}>
                      <VStack align="flex-start" spacing={0.5} minW={0}>
                        <Text fontWeight="black" noOfLines={1}>
                          {studentName(sub) || field(sub, "student_name", "full_name")}
                        </Text>
                        <Text fontSize="xs" color="gray.500" noOfLines={1}>
                          {field(sub, "group_name", "groupName") || "—"}
                        </Text>
                      </VStack>
                      <StatusBadge scheme={meta.scheme}>{meta.label}</StatusBadge>
                    </Flex>

                    <SimpleGrid columns={3} spacing={2} mb={3} fontSize="xs">
                      <Box>
                        <Text color="gray.500">المطلوب</Text>
                        <Text fontWeight="bold">{formatMoney(field(sub, "amount_due", "amountDue"))}</Text>
                      </Box>
                      <Box>
                        <Text color="gray.500">المدفوع</Text>
                        <Text fontWeight="bold">{formatMoney(field(sub, "amount_paid", "amountPaid"))}</Text>
                      </Box>
                      <Box>
                        <Text color="gray.500">المتبقي</Text>
                        <Text fontWeight="bold" color="orange.500">
                          {formatMoney(field(sub, "remaining"))}
                        </Text>
                      </Box>
                    </SimpleGrid>

                    <VStack spacing={2} align="stretch">
                      {quickSelect(sub.id)}
                      <Button
                        size="sm"
                        variant="outline"
                        borderRadius="lg"
                        onClick={() => openEdit(sub)}
                      >
                        تعديل تفصيلي
                      </Button>
                    </VStack>
                  </ListCard>
                );
              })}
            </VStack>
          </MobileOnly>

          <DesktopOnly>
            <Surface p={0} overflow="hidden">
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>سريع</Th>
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
                      const meta = SUBSCRIPTION_LABELS[st] || { label: st || "—", scheme: "gray" };
                      return (
                        <Tr key={sub.id}>
                          <Td>
                            <Select
                              size="xs"
                              value={selectedPaid[sub.id] || ""}
                              placeholder="—"
                              onChange={(e) =>
                                setSelectedPaid((m) => ({ ...m, [sub.id]: e.target.value }))
                              }
                              borderRadius="md"
                              w="100px"
                            >
                              <option value="paid">مدفوع</option>
                              <option value="unpaid">غير مدفوع</option>
                              <option value="partial">جزئي</option>
                              <option value="exempt">معفى</option>
                            </Select>
                          </Td>
                          <Td fontWeight="medium">
                            {studentName(sub) || field(sub, "student_name", "full_name")}
                          </Td>
                          <Td>{field(sub, "group_name", "groupName") || "—"}</Td>
                          <Td>{formatMoney(field(sub, "amount_due", "amountDue"))}</Td>
                          <Td>{formatMoney(field(sub, "amount_paid", "amountPaid"))}</Td>
                          <Td>{formatMoney(field(sub, "remaining"))}</Td>
                          <Td><StatusBadge scheme={meta.scheme}>{meta.label}</StatusBadge></Td>
                          <Td>
                            <Button size="xs" variant="ghost" onClick={() => openEdit(sub)}>
                              تعديل
                            </Button>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </Surface>
          </DesktopOnly>
        </>
      )}

      <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", md: "xl" }}>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent
          dir="rtl"
          borderRadius={{ base: "none", md: "2xl" }}
          m={0}
          maxH={{ base: "100vh", md: "90vh" }}
        >
          <ModalHeader>فتح شهر مالي</ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto">
            <VStack spacing={4} align="stretch">
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel>الشهر</FormLabel>
                  <Select
                    value={openForm.month}
                    onChange={(e) => setOpenForm((f) => ({ ...f, month: e.target.value }))}
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
                    value={openForm.year}
                    onChange={(e) => setOpenForm((f) => ({ ...f, year: e.target.value }))}
                    borderRadius="xl"
                  >
                    {[now.year - 1, now.year, now.year + 1].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </Select>
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>حالة الباقي (غير المجددين)</FormLabel>
                <Select
                  value={openForm.default_status}
                  onChange={(e) => setOpenForm((f) => ({ ...f, default_status: e.target.value }))}
                  borderRadius="xl"
                >
                  <option value="unpaid">غير مدفوع</option>
                  <option value="paid">مدفوع</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>من جددوا الاشتراك</FormLabel>
                <VStack align="stretch" maxH="220px" overflowY="auto" spacing={1} borderWidth="1px" borderRadius="xl" p={3}>
                  {allStudents.length === 0 ? (
                    <Text fontSize="sm" color="gray.500">لا يوجد طلاب نشطون</Text>
                  ) : (
                    allStudents.map((s) => (
                      <Checkbox
                        key={s.id}
                        isChecked={openForm.renewed_student_ids.map(String).includes(String(s.id))}
                        onChange={() => toggleRenewed(s.id)}
                      >
                        {studentName(s)} · {field(s, "student_code", "studentCode")}
                      </Checkbox>
                    ))
                  )}
                </VStack>
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
              onClick={handleOpenMonth}
              isLoading={openMonth.isPending}
              w={{ base: "full", md: "auto" }}
            >
              فتح الشهر
            </PrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={onEditClose} isCentered size={{ base: "full", sm: "md" }}>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent dir="rtl" borderRadius={{ base: "none", sm: "2xl" }} m={0}>
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
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </Select>
              </FormControl>
              {editForm.status === "partial" && (
                <FormControl>
                  <FormLabel>المبلغ المدفوع</FormLabel>
                  <NumberInput
                    value={editForm.amount_paid}
                    min={0}
                    onChange={(_, n) =>
                      setEditForm((f) => ({
                        ...f,
                        amount_paid: Number.isNaN(n) ? "" : n,
                      }))
                    }
                  >
                    <NumberInputField borderRadius="xl" />
                  </NumberInput>
                </FormControl>
              )}
              {editForm.status === "exempt" && (
                <FormControl>
                  <FormLabel>سبب الإعفاء</FormLabel>
                  <Input
                    value={editForm.exemption_reason}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, exemption_reason: e.target.value }))
                    }
                    borderRadius="xl"
                  />
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter gap={2} flexDir={{ base: "column-reverse", sm: "row" }}>
            <Button
              variant="ghost"
              onClick={onEditClose}
              borderRadius="xl"
              w={{ base: "full", sm: "auto" }}
            >
              إلغاء
            </Button>
            <PrimaryButton
              onClick={handleUpdate}
              isLoading={updateSubscription.isPending}
              w={{ base: "full", sm: "auto" }}
            >
              حفظ
            </PrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
