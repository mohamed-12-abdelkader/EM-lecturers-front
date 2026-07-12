import { useMemo, useState } from "react";
import { Link as RouterLink, useOutletContext } from "react-router-dom";
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
  useGrades,
  useGroups,
  useGroupMutations,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage } from "../../api/centerMgmtApi";
import { WEEK_DAYS, field, formatMoney } from "./centerMgmtUtils";
import { EmptyState, LoadingBlock, PageHeader, Surface } from "./components/UiBits";

const emptyForm = {
  name: "",
  gradeId: "",
  days: [],
  sessionTime: "16:00",
  durationMinutes: 120,
  maxCapacity: 25,
  status: "active",
  defaultFee: "",
  notes: "",
};

export default function GroupsPage() {
  const { centerId, center } = useOutletContext();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const params = useMemo(
    () => ({
      search: search || undefined,
      gradeId: gradeFilter || undefined,
      status: statusFilter || undefined,
    }),
    [search, gradeFilter, statusFilter]
  );

  const { data: grades = [] } = useGrades(centerId);
  const { data: groups = [], isLoading } = useGroups(centerId, params);
  const { createGroup, updateGroup, deleteGroup } = useGroupMutations(centerId);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const currency = field(center, "currency") || "EGP";

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
      defaultFee: field(center, "default_fee", "defaultFee") || "",
    });
    onOpen();
  };

  const openEdit = (group) => {
    setEditing(group);
    setForm({
      name: field(group, "name") || "",
      gradeId: String(field(group, "grade_id", "gradeId") || ""),
      days: field(group, "days") || [],
      sessionTime: field(group, "session_time", "sessionTime") || "16:00",
      durationMinutes: field(group, "duration_minutes", "durationMinutes") || 120,
      maxCapacity: field(group, "max_capacity", "maxCapacity") || 25,
      status: field(group, "status") || "active",
      defaultFee: field(group, "default_fee", "defaultFee") || "",
      notes: field(group, "notes") || "",
    });
    onOpen();
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.gradeId) {
      toast({ title: "الاسم والصف مطلوبان", status: "warning", duration: 2500 });
      return;
    }
    const payload = {
      name: form.name.trim(),
      gradeId: Number(form.gradeId),
      days: form.days,
      sessionTime: form.sessionTime || undefined,
      durationMinutes: Number(form.durationMinutes) || undefined,
      maxCapacity: Number(form.maxCapacity) || undefined,
      status: form.status,
      defaultFee: form.defaultFee === "" ? undefined : Number(form.defaultFee),
      notes: form.notes || undefined,
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
        description="نظّم مواعيد الحصص والطاقة الاستيعابية لكل مجموعة."
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
            onChange={(e) => setSearch(e.target.value)}
            borderRadius="xl"
          />
          <Select
            placeholder="كل الصفوف"
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
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
            onChange={(e) => setStatusFilter(e.target.value)}
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
          description="أنشئ مجموعة وحدد الصف وأيام الحضور."
          action={
            <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={openCreate}>
              إنشاء مجموعة
            </Button>
          }
        />
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {groups.map((group) => {
            const days = field(group, "days") || [];
            return (
              <Surface key={group.id} _hover={{ borderColor: "blue.300" }} transition="all 0.2s">
                <Flex justify="space-between" align="flex-start" mb={3}>
                  <Box>
                    <Text fontWeight="bold" fontSize="lg" mb={1}>
                      {field(group, "name")}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {gradeMap[field(group, "grade_id", "gradeId")] || "بدون صف"}
                    </Text>
                  </Box>
                  <Badge colorScheme={field(group, "status") === "paused" ? "orange" : "green"}>
                    {field(group, "status") === "paused" ? "متوقفة" : "نشطة"}
                  </Badge>
                </Flex>
                <VStack align="stretch" spacing={1} fontSize="sm" color="gray.600" mb={4}>
                  <Text>
                    الوقت: {field(group, "session_time", "sessionTime") || "—"} ·{" "}
                    {field(group, "duration_minutes", "durationMinutes") || "—"} دقيقة
                  </Text>
                  <Text>
                    السعة: {field(group, "max_capacity", "maxCapacity") || "—"} · الرسوم:{" "}
                    {formatMoney(field(group, "default_fee", "defaultFee"), currency)}
                  </Text>
                  <Wrap mt={1}>
                    {days.map((d) => (
                      <WrapItem key={d}>
                        <Badge variant="subtle" colorScheme="blue">
                          {d}
                        </Badge>
                      </WrapItem>
                    ))}
                  </Wrap>
                </VStack>
                <Flex gap={2}>
                  <Button
                    as={RouterLink}
                    to={`/center-mgmt/${centerId}/groups/${group.id}`}
                    flex={1}
                    colorScheme="blue"
                    variant="solid"
                    size="sm"
                    borderRadius="lg"
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

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="2xl" mx={3} maxH="90vh" overflowY="auto">
          <ModalHeader>{editing ? "تعديل المجموعة" : "مجموعة جديدة"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>اسم المجموعة</FormLabel>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  borderRadius="xl"
                  placeholder="مجموعة السبت"
                />
              </FormControl>
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
              <SimpleGrid columns={2} spacing={3} w="full">
                <FormControl>
                  <FormLabel>وقت الحصة</FormLabel>
                  <Input
                    type="time"
                    value={form.sessionTime}
                    onChange={(e) => setForm((f) => ({ ...f, sessionTime: e.target.value }))}
                    borderRadius="xl"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>المدة (دقيقة)</FormLabel>
                  <NumberInput
                    min={1}
                    value={form.durationMinutes}
                    onChange={(_, n) =>
                      setForm((f) => ({ ...f, durationMinutes: Number.isNaN(n) ? "" : n }))
                    }
                  >
                    <NumberInputField borderRadius="xl" />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>السعة القصوى</FormLabel>
                  <NumberInput
                    min={1}
                    value={form.maxCapacity}
                    onChange={(_, n) =>
                      setForm((f) => ({ ...f, maxCapacity: Number.isNaN(n) ? "" : n }))
                    }
                  >
                    <NumberInputField borderRadius="xl" />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel>الرسوم</FormLabel>
                  <NumberInput
                    min={0}
                    value={form.defaultFee}
                    onChange={(_, n) =>
                      setForm((f) => ({ ...f, defaultFee: Number.isNaN(n) ? "" : n }))
                    }
                  >
                    <NumberInputField borderRadius="xl" />
                  </NumberInput>
                </FormControl>
              </SimpleGrid>
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
              <FormControl>
                <FormLabel>ملاحظات</FormLabel>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  borderRadius="xl"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={onClose}>
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
