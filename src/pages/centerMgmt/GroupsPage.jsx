import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
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
  Text,
  Textarea,
  useDisclosure,
  useToast,
  VStack,
  Wrap,
  WrapItem,
  Badge,
} from "@chakra-ui/react";
import { FaEdit, FaPlus, FaTrash, FaUsers } from "react-icons/fa";
import {
  useGroupMutations,
  useGroups,
  usePlatformGrades,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage } from "../../api/centerMgmtApi";
import { WEEK_DAYS, field, formatMoney } from "./centerMgmtUtils";
import {
  EmptyState,
  FilterBar,
  LoadingBlock,
  PageHeader,
  PaginationBar,
  PrimaryButton,
  StatusBadge,
  Surface,
} from "./components/UiBits";

const emptyForm = {
  name: "",
  grade_id: "",
  subject_id: "",
  days: [],
  start_time: "16:00",
  end_time: "18:00",
  monthly_fee: 300,
  status: "active",
  notes: "",
};

export default function GroupsPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      search: search || undefined,
      status: statusFilter || undefined,
      page,
      limit: 20,
    }),
    [search, statusFilter, page]
  );

  const { data: grades = [] } = usePlatformGrades();
  const { data, isLoading } = useGroups(params);
  const groups = data?.items || [];
  const { createGroup, updateGroup, deleteGroup } = useGroupMutations();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    onOpen();
  };

  const openEdit = (group) => {
    setEditing(group);
    setForm({
      name: field(group, "name") || "",
      grade_id: String(field(group, "grade_id", "gradeId") || ""),
      subject_id: String(field(group, "subject_id", "subjectId") || ""),
      days: field(group, "days") || [],
      start_time: field(group, "start_time", "startTime") || "16:00",
      end_time: field(group, "end_time", "endTime") || "18:00",
      monthly_fee: Number(field(group, "monthly_fee", "monthlyFee") ?? 300),
      status: field(group, "status") || "active",
      notes: field(group, "notes") || "",
    });
    onOpen();
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.days.length || form.monthly_fee === "" || form.monthly_fee == null) {
      toast({ title: "الاسم والأيام وقيمة الاشتراك مطلوبة", status: "warning", duration: 2500 });
      return;
    }
    const payload = {
      name: form.name.trim(),
      days: form.days,
      monthly_fee: Number(form.monthly_fee) || 0,
      grade_id: form.grade_id ? Number(form.grade_id) : null,
      subject_id: form.subject_id ? Number(form.subject_id) : null,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      status: form.status,
      notes: form.notes || null,
    };
    try {
      if (editing) {
        await updateGroup.mutateAsync({ groupId: editing.id, payload });
        toast({ title: "تم تحديث المجموعة", status: "success", duration: 2000 });
      } else {
        await createGroup.mutateAsync(payload);
        toast({ title: "تم إنشاء المجموعة", status: "success", duration: 2000 });
      }
      onClose();
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  const handleDelete = async (group) => {
    if (!window.confirm(`حذف المجموعة "${field(group, "name")}"؟`)) return;
    try {
      await deleteGroup.mutateAsync(group.id);
      toast({ title: "تم حذف المجموعة", status: "success", duration: 2000 });
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  return (
    <>
      <PageHeader
        title="المجموعات"
        description="أنشئ مجموعات دراسية بأيام الحضور وقيمة الاشتراك الشهري."
        actions={
          <PrimaryButton
            leftIcon={<FaPlus />}
            onClick={openCreate}
            size={{ base: "sm", md: "md" }}
          >
            مجموعة جديدة
          </PrimaryButton>
        }
      />

      <FilterBar>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          <Input
            placeholder="بحث بالاسم..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            borderRadius="xl"
            bg="white"
            _dark={{ bg: "gray.800" }}
          />
          <Select
            placeholder="كل الحالات"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            borderRadius="xl"
          >
            <option value="active">نشطة</option>
            <option value="paused">متوقفة</option>
          </Select>
        </SimpleGrid>
      </FilterBar>

      {isLoading ? (
        <LoadingBlock />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={FaUsers}
          title="لا توجد مجموعات"
          description="ابدأ بإنشاء أول مجموعة دراسية."
          action={
            <PrimaryButton onClick={openCreate}>إنشاء مجموعة</PrimaryButton>
          }
        />
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 3, md: 4 }}>
          {groups.map((group) => {
            const days = field(group, "days") || [];
            const paused = field(group, "status") === "paused";
            return (
              <Surface key={group.id} p={{ base: 3.5, md: 5 }}>
                <Flex justify="space-between" align="flex-start" gap={3} mb={3}>
                  <Box minW={0}>
                    <Text
                      as={RouterLink}
                      to={`/center-mgmt/groups/${group.id}`}
                      fontWeight="black"
                      fontSize={{ base: "md", md: "lg" }}
                      color="blue.600"
                      _hover={{ textDecoration: "underline" }}
                      noOfLines={2}
                    >
                      {field(group, "name")}
                    </Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      طلاب: {field(group, "students_count", "studentsCount") ?? "—"}
                    </Text>
                  </Box>
                  <StatusBadge scheme={paused ? "orange" : "green"}>
                    {paused ? "متوقفة" : "نشطة"}
                  </StatusBadge>
                </Flex>

                <Wrap spacing={1.5} mb={3}>
                  {days.map((d) => (
                    <WrapItem key={d}>
                      <Badge variant="subtle" borderRadius="md" fontSize="xs">
                        {d}
                      </Badge>
                    </WrapItem>
                  ))}
                </Wrap>

                <SimpleGrid columns={2} spacing={2} mb={4} fontSize="sm">
                  <Text color="gray.500">
                    الوقت:{" "}
                    <Text as="span" color="gray.800" fontWeight="semibold" _dark={{ color: "gray.100" }}>
                      {field(group, "start_time", "startTime") || "—"} –{" "}
                      {field(group, "end_time", "endTime") || "—"}
                    </Text>
                  </Text>
                  <Text color="gray.500">
                    الاشتراك:{" "}
                    <Text as="span" color="gray.800" fontWeight="semibold" _dark={{ color: "gray.100" }}>
                      {formatMoney(field(group, "monthly_fee", "monthlyFee"))}
                    </Text>
                  </Text>
                </SimpleGrid>

                <Flex gap={2}>
                  <Button
                    as={RouterLink}
                    to={`/center-mgmt/groups/${group.id}`}
                    size="sm"
                    variant="outline"
                    borderRadius="lg"
                    flex={1}
                  >
                    الطلاب والتفاصيل
                  </Button>
                  <IconButton
                    aria-label="تعديل"
                    icon={<FaEdit />}
                    size="sm"
                    variant="ghost"
                    borderRadius="lg"
                    onClick={() => openEdit(group)}
                  />
                  <IconButton
                    aria-label="حذف"
                    icon={<FaTrash />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    borderRadius="lg"
                    onClick={() => handleDelete(group)}
                  />
                </Flex>
              </Surface>
            );
          })}
        </SimpleGrid>
      )}

      <PaginationBar
        page={page}
        totalPages={data?.totalPages || 1}
        onPrev={() => setPage((p) => p - 1)}
        onNext={() => setPage((p) => p + 1)}
      />

      <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "xl" }} isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent dir="rtl" borderRadius={{ base: "none", md: "2xl" }} m={0}>
          <ModalHeader>{editing ? "تعديل المجموعة" : "مجموعة جديدة"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>اسم المجموعة</FormLabel>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  borderRadius="xl"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>أيام الحضور</FormLabel>
                <CheckboxGroup
                  value={form.days}
                  onChange={(days) => setForm((f) => ({ ...f, days }))}
                >
                  <Wrap>
                    {WEEK_DAYS.map((day) => (
                      <WrapItem key={day}>
                        <Checkbox value={day}>{day}</Checkbox>
                      </WrapItem>
                    ))}
                  </Wrap>
                </CheckboxGroup>
              </FormControl>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                <FormControl isRequired>
                  <FormLabel>قيمة الاشتراك</FormLabel>
                  <NumberInput
                    value={form.monthly_fee}
                    min={0}
                    onChange={(_, n) =>
                      setForm((f) => ({ ...f, monthly_fee: Number.isNaN(n) ? 0 : n }))
                    }
                  >
                    <NumberInputField borderRadius="xl" />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>من</FormLabel>
                  <Input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                    borderRadius="xl"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>إلى</FormLabel>
                  <Input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                    borderRadius="xl"
                  />
                </FormControl>
              </SimpleGrid>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel>الصف (اختياري)</FormLabel>
                  <Select
                    placeholder="بدون صف"
                    value={form.grade_id}
                    onChange={(e) => setForm((f) => ({ ...f, grade_id: e.target.value }))}
                    borderRadius="xl"
                  >
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {field(g, "name")}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>الحالة</FormLabel>
                  <Select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    borderRadius="xl"
                  >
                    <option value="active">نشطة</option>
                    <option value="paused">متوقفة</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>ملاحظات</FormLabel>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  borderRadius="xl"
                  rows={3}
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
              isLoading={createGroup.isPending || updateGroup.isPending}
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
