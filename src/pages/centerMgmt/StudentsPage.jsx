import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Textarea,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { FaEdit, FaPlus, FaTrash, FaUserGraduate } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import {
  useGroups,
  useStudentMutations,
  useStudents,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage } from "../../api/centerMgmtApi";
import { field, studentCode, studentName, todayISO } from "./centerMgmtUtils";
import { EmptyState, LoadingBlock, PageHeader, Surface } from "./components/UiBits";

const emptyForm = {
  fullName: "",
  phone: "",
  parentPhone: "",
  groupId: "",
  joinedAt: todayISO(),
  barcode: "",
  notes: "",
};

export default function StudentsPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo(
    () => ({
      search: debounced || undefined,
      groupId: groupFilter || undefined,
      page,
      limit: 20,
    }),
    [debounced, groupFilter, page]
  );

  const { data: groupsData } = useGroups({ limit: 100 });
  const groups = groupsData?.items || [];
  const { data, isLoading } = useStudents(params);
  const items = data?.items || [];
  const { createStudent, updateStudent, deleteStudent } = useStudentMutations();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    onOpen();
  };

  const openEdit = (student) => {
    setEditing(student);
    setForm({
      fullName: studentName(student),
      phone: field(student, "phone") || "",
      parentPhone: field(student, "parent_phone", "parentPhone") || "",
      groupId: String(field(student, "group_id", "groupId") || ""),
      joinedAt: String(field(student, "joined_at", "joinedAt") || todayISO()).slice(0, 10),
      barcode: field(student, "barcode") || "",
      notes: field(student, "notes") || "",
    });
    onOpen();
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) {
      toast({ title: "اسم الطالب مطلوب", status: "warning", duration: 2500 });
      return;
    }
    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone || undefined,
      parentPhone: form.parentPhone || undefined,
      joinedAt: form.joinedAt || undefined,
      barcode: form.barcode || null,
      notes: form.notes || null,
    };
    if (!editing && form.groupId) {
      payload.groupId = Number(form.groupId);
    }
    try {
      if (editing) {
        await updateStudent.mutateAsync({ studentId: editing.id, payload });
        toast({ title: "تم تحديث الطالب", status: "success", duration: 2000 });
      } else {
        await createStudent.mutateAsync(payload);
        toast({ title: "تم إضافة الطالب مع QR", status: "success", duration: 2000 });
      }
      onClose();
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`حذف الطالب "${studentName(student)}"؟`)) return;
    try {
      await deleteStudent.mutateAsync(student.id);
      toast({ title: "تم حذف الطالب", status: "success", duration: 2000 });
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  return (
    <>
      <PageHeader
        title="الطلاب"
        description="أضف طلاب السنتر، ابحث بالكود أو الهاتف، وافتح صفحة QR."
        actions={
          <Button leftIcon={<FaPlus />} colorScheme="blue" borderRadius="xl" onClick={openCreate}>
            طالب جديد
          </Button>
        }
      />

      <Surface mb={5}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray" />
            </InputLeftElement>
            <Input
              placeholder="بحث بالاسم / الهاتف / الكود..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              borderRadius="xl"
            />
          </InputGroup>
          <Select
            placeholder="كل المجموعات"
            value={groupFilter}
            onChange={(e) => {
              setGroupFilter(e.target.value);
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
        </SimpleGrid>
      </Surface>

      {isLoading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FaUserGraduate}
          title="لا يوجد طلاب"
          description="أضف أول طالب وسيُنشأ له كود و QR تلقائياً."
          action={
            <Button colorScheme="blue" borderRadius="xl" onClick={openCreate}>
              إضافة طالب
            </Button>
          }
        />
      ) : (
        <Surface p={0} overflow="hidden">
          <TableContainer>
            <Table>
              <Thead>
                <Tr>
                  <Th>الكود</Th>
                  <Th>الاسم</Th>
                  <Th>الهاتف</Th>
                  <Th>ولي الأمر</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {items.map((s) => (
                  <Tr key={s.id}>
                    <Td fontFamily="mono">{studentCode(s)}</Td>
                    <Td fontWeight="medium">{studentName(s)}</Td>
                    <Td>{field(s, "phone") || "—"}</Td>
                    <Td>{field(s, "parent_phone", "parentPhone") || "—"}</Td>
                    <Td>
                      <Flex gap={1} justify="flex-end">
                        <Button
                          as={RouterLink}
                          to={`/center-mgmt/students/${s.id}`}
                          size="xs"
                          colorScheme="blue"
                          variant="outline"
                          borderRadius="md"
                        >
                          التفاصيل
                        </Button>
                        <IconButton
                          aria-label="تعديل"
                          icon={<FaEdit />}
                          size="xs"
                          variant="ghost"
                          onClick={() => openEdit(s)}
                        />
                        <IconButton
                          aria-label="حذف"
                          icon={<FaTrash />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDelete(s)}
                        />
                      </Flex>
                    </Td>
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
            {page} / {data.totalPages} · {data.total} طالب
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

      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent dir="rtl" borderRadius="2xl">
          <ModalHeader>{editing ? "تعديل طالب" : "طالب جديد"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>الاسم الكامل</FormLabel>
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  borderRadius="xl"
                />
              </FormControl>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel>هاتف الطالب</FormLabel>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    borderRadius="xl"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>هاتف ولي الأمر</FormLabel>
                  <Input
                    value={form.parentPhone}
                    onChange={(e) => setForm((f) => ({ ...f, parentPhone: e.target.value }))}
                    borderRadius="xl"
                  />
                </FormControl>
              </SimpleGrid>
              {!editing && (
                <FormControl>
                  <FormLabel>تسجيل في مجموعة (اختياري)</FormLabel>
                  <Select
                    placeholder="بدون مجموعة"
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
              )}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel>تاريخ الانضمام</FormLabel>
                  <Input
                    type="date"
                    value={form.joinedAt}
                    onChange={(e) => setForm((f) => ({ ...f, joinedAt: e.target.value }))}
                    borderRadius="xl"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>باركود اختياري</FormLabel>
                  <Input
                    value={form.barcode}
                    onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                    borderRadius="xl"
                  />
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
              isLoading={createStudent.isPending || updateStudent.isPending}
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
