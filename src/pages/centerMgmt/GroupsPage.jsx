import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Badge,
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
} from "@chakra-ui/react";
import { FaEdit, FaPlus, FaTrash, FaUsers } from "react-icons/fa";
import {
  useGroupMutations,
  useGroups,
  usePlatformGrades,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage } from "../../api/centerMgmtApi";
import { WEEK_DAYS, field, formatMoney, todayISO } from "./centerMgmtUtils";
import { EmptyState, LoadingBlock, PageHeader, Surface } from "./components/UiBits";

const emptyForm = {
  name: "",
  gradeId: "",
  subjectId: "",
  days: [],
  startTime: "16:00",
  endTime: "18:00",
  monthlyFee: 300,
  studyStartDate: todayISO(),
  status: "active",
  notes: "",
};

export default function GroupsPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      search: search || undefined,
      gradeId: gradeFilter || undefined,
      status: statusFilter || undefined,
      page,
      limit: 20,
    }),
    [search, gradeFilter, statusFilter, page]
  );

  const { data: grades = [] } = usePlatformGrades();
  const { data, isLoading } = useGroups(params);
  const groups = data?.items || [];
  const { createGroup, updateGroup, deleteGroup } = useGroupMutations();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const gradeMap = useMemo(() => {
    const map = {};
    grades.forEach((g) => {
      map[g.id] = field(g, "name");
    });
    return map;
  }, [grades]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      gradeId: grades[0]?.id ? String(grades[0].id) : "",
    });
    onOpen();
  };

  const openEdit = (group) => {
    setEditing(group);
    setForm({
      name: field(group, "name") || "",
      gradeId: String(field(group, "grade_id", "gradeId") || ""),
      subjectId: String(field(group, "subject_id", "subjectId") || ""),
      days: field(group, "days") || [],
      startTime: field(group, "start_time", "startTime") || "16:00",
      endTime: field(group, "end_time", "endTime") || "18:00",
      monthlyFee: field(group, "monthly_fee", "monthlyFee") ?? 300,
      studyStartDate: String(field(group, "study_start_date", "studyStartDate") || "").slice(0, 10),
      status: field(group, "status") || "active",
      notes: field(group, "notes") || "",
    });
    onOpen();
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.gradeId || !form.days.length) {
      toast({ title: "الاسم والصف والأيام مطلوبة", status: "warning", duration: 2500 });
      return;
    }
    const payload = {
      name: form.name.trim(),
      gradeId: Number(form.gradeId),
      subjectId: form.subjectId ? Number(form.subjectId) : undefined,
      days: form.days,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      monthlyFee: Number(form.monthlyFee) || 0,
      studyStartDate: form.studyStartDate || undefined,
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
        description="أنشئ مجموعات الدراسة وحدد الأيام والرسوم الشهرية."
        actions={
          <Button leftIcon={<FaPlus />} colorScheme="blue" borderRadius="xl" onClick={openCreate}>
            مجموعة جديدة
          </Button>
        }
      />

      <Surface mb={5}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
          <Input
            placeholder="بحث بالاسم..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            borderRadius="xl"
          />
          <Select
            placeholder="كل الصفوف"
            value={gradeFilter}
            onChange={(e) => {
              setGradeFilter(e.target.value);
              setPage(1);
            }}
            borderRadius="xl"
          >
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {field(g, "name")}
              </option>
            ))}
          </Select>
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
      </Surface>

      {isLoading ? (
        <LoadingBlock />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={FaUsers}
          title="لا توجد مجموعات"
          description="ابدأ بإنشاء أول مجموعة دراسية."
          action={
            <Button colorScheme="blue" borderRadius="xl" onClick={openCreate}>
              إنشاء مجموعة
            </Button>
          }
        />
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {groups.map((group) => {
            const days = field(group, "days") || [];
            const gradeId = field(group, "grade_id", "gradeId");
            return (
              <Surface key={group.id}>
                <Flex justify="space-between" align="flex-start" gap={3} mb={3}>
                  <Box>
                    <Text
                      as={RouterLink}
                      to={`/center-mgmt/groups/${group.id}`}
                      fontWeight="bold"
                      fontSize="lg"
                      color="blue.600"
                      _hover={{ textDecoration: "underline" }}
                    >
                      {field(group, "name")}
                    </Text>
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      {gradeMap[gradeId] || `صف #${gradeId || "—"}`}
                    </Text>
                  </Box>
                  <Badge colorScheme={field(group, "status") === "paused" ? "orange" : "green"}>
                    {field(group, "status") === "paused" ? "متوقفة" : "نشطة"}
                  </Badge>
                </Flex>

                <Wrap spacing={2} mb={3}>
                  {days.map((d) => (
                    <WrapItem key={d}>
                      <Badge variant="subtle">{d}</Badge>
                    </WrapItem>
                  ))}
                </Wrap>

                <SimpleGrid columns={2} spacing={2} mb={4} fontSize="sm">
                  <Text color="gray.500">
                    الوقت:{" "}
                    <Text as="span" color="gray.800" fontWeight="medium">
                      {field(group, "start_time", "startTime") || "—"} –{" "}
                      {field(group, "end_time", "endTime") || "—"}
                    </Text>
                  </Text>
                  <Text color="gray.500">
                    الرسوم:{" "}
                    <Text as="span" color="gray.800" fontWeight="medium">
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
                    التفاصيل
                  </Button>
                  <IconButton
                    aria-label="تعديل"
                    icon={<FaEdit />}
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(group)}
                  />
                  <IconButton
                    aria-label="حذف"
                    icon={<FaTrash />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => handleDelete(group)}
                  />
                </Flex>
              </Surface>
            );
          })}
        </SimpleGrid>
      )}

      {(data?.totalPages || 1) > 1 && (
        <Flex justify="center" gap={2} mt={5}>
          <Button
            size="sm"
            isDisabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            borderRadius="lg"
          >
            السابق
          </Button>
          <Text fontSize="sm" alignSelf="center">
            {page} / {data.totalPages}
          </Text>
          <Button
            size="sm"
            isDisabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            borderRadius="lg"
          >
            التالي
          </Button>
        </Flex>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent dir="rtl" borderRadius="2xl">
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
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl isRequired>
                  <FormLabel>الصف</FormLabel>
                  <Select
                    value={form.gradeId}
                    onChange={(e) => setForm((f) => ({ ...f, gradeId: e.target.value }))}
                    borderRadius="xl"
                  >
                    <option value="">اختر الصف</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {field(g, "name")}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>المادة (اختياري — رقم ID)</FormLabel>
                  <Input
                    value={form.subjectId}
                    onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
                    borderRadius="xl"
                    placeholder="subjectId"
                  />
                </FormControl>
              </SimpleGrid>
              <FormControl isRequired>
                <FormLabel>أيام المجموعة</FormLabel>
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
                <FormControl>
                  <FormLabel>من</FormLabel>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    borderRadius="xl"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>إلى</FormLabel>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    borderRadius="xl"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>الرسوم الشهرية</FormLabel>
                  <NumberInput
                    value={form.monthlyFee}
                    min={0}
                    onChange={(_, n) =>
                      setForm((f) => ({ ...f, monthlyFee: Number.isNaN(n) ? 0 : n }))
                    }
                  >
                    <NumberInputField borderRadius="xl" />
                  </NumberInput>
                </FormControl>
              </SimpleGrid>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel>بداية الدراسة</FormLabel>
                  <Input
                    type="date"
                    value={form.studyStartDate}
                    onChange={(e) => setForm((f) => ({ ...f, studyStartDate: e.target.value }))}
                    borderRadius="xl"
                  />
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
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={onClose} borderRadius="xl">
              إلغاء
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSave}
              isLoading={createGroup.isPending || updateGroup.isPending}
              borderRadius="xl"
            >
              حفظ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
