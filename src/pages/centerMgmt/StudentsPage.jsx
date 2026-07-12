import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useOutletContext } from "react-router-dom";
import {
  Badge,
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
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import {
  useGrades,
  useGroups,
  useStudents,
  useStudentMutations,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage } from "../../api/centerMgmtApi";
import { field, studentCode, studentName, todayISO } from "./centerMgmtUtils";
import { EmptyState, LoadingBlock, PageHeader, Surface } from "./components/UiBits";

const emptyForm = {
  fullName: "",
  phone: "",
  parentPhone: "",
  gradeId: "",
  groupId: "",
  joinedAt: todayISO(),
  notes: "",
};

export default function StudentsPage() {
  const { centerId } = useOutletContext();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo(
    () => ({
      search: debounced || undefined,
      gradeId: gradeFilter || undefined,
      page,
      limit: 20,
    }),
    [debounced, gradeFilter, page]
  );

  const { data: grades = [] } = useGrades(centerId);
  const { data: groups = [] } = useGroups(centerId);
  const { data, isLoading } = useStudents(centerId, params);
  const { createStudent, updateStudent, deleteStudent } = useStudentMutations(centerId);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const students = data?.items || [];
  const totalPages = data?.totalPages || 1;

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
      joinedAt: todayISO(),
    });
    onOpen();
  };

  const openEdit = (student) => {
    setEditing(student);
    setForm({
      fullName: studentName(student),
      phone: field(student, "phone") || "",
      parentPhone: field(student, "parent_phone", "parentPhone") || "",
      gradeId: String(field(student, "grade_id", "gradeId") || ""),
      groupId: "",
      joinedAt: String(field(student, "joined_at", "joinedAt") || todayISO()).slice(0, 10),
      notes: field(student, "notes") || "",
    });
    onOpen();
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) {
      toast({ title: "اسم الطالب مطلوب", status: "warning", duration: 2000 });
      return;
    }
    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone || undefined,
      parentPhone: form.parentPhone || undefined,
      gradeId: form.gradeId ? Number(form.gradeId) : undefined,
      groupId: !editing && form.groupId ? Number(form.groupId) : undefined,
      joinedAt: form.joinedAt || undefined,
      notes: form.notes || undefined,
    };
    try {
      if (editing) {
        await updateStudent.mutateAsync({ studentId: editing.id, payload });
        toast({ title: "تم تحديث الطالب", status: "success", duration: 2000 });
      } else {
        await createStudent.mutateAsync(payload);
        toast({ title: "تم إضافة الطالب مع QR", status: "success", duration: 2500 });
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
        description="كل طالب يحصل تلقائياً على كود وQR للحضور."
        actions={
          <Button leftIcon={<FaPlus />} colorScheme="blue" borderRadius="xl" onClick={openCreate}>
            إضافة طالب
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
              placeholder="بحث بالاسم أو الهاتف..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              borderRadius="xl"
              pr={10}
            />
          </InputGroup>
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
        </SimpleGrid>
      </Surface>

      {isLoading ? (
        <LoadingBlock />
      ) : students.length === 0 ? (
        <EmptyState
          title="لا يوجد طلاب"
          description="أضف أول طالب وحدد الصف والمجموعة."
          action={
            <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={openCreate}>
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
                  <Th>الصف</Th>
                  <Th>الهاتف</Th>
                  <Th>ولي الأمر</Th>
                  <Th>الحالة</Th>
                  <Th>إجراءات</Th>
                </Tr>
              </Thead>
              <Tbody>
                {students.map((student) => (
                  <Tr key={student.id}>
                    <Td>
                      <Text fontFamily="mono" fontSize="sm">
                        {studentCode(student)}
                      </Text>
                    </Td>
                    <Td fontWeight="medium">{studentName(student)}</Td>
                    <Td>{gradeMap[field(student, "grade_id", "gradeId")] || "—"}</Td>
                    <Td>{field(student, "phone") || "—"}</Td>
                    <Td>{field(student, "parent_phone", "parentPhone") || "—"}</Td>
                    <Td>
                      <Badge colorScheme={student.is_active === false ? "gray" : "green"}>
                        {student.is_active === false ? "غير نشط" : "نشط"}
                      </Badge>
                    </Td>
                    <Td>
                      <Flex gap={1}>
                        <Button
                          as={RouterLink}
                          to={`/center-mgmt/${centerId}/students/${student.id}`}
                          size="xs"
                          colorScheme="blue"
                          variant="outline"
                        >
                          الملف
                        </Button>
                        <IconButton
                          aria-label="تعديل"
                          icon={<FaEdit />}
                          size="xs"
                          variant="ghost"
                          onClick={() => openEdit(student)}
                        />
                        <IconButton
                          aria-label="حذف"
                          icon={<FaTrash />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDelete(student)}
                        />
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
          <Flex justify="space-between" align="center" px={4} py={3}>
            <Text fontSize="sm" color="gray.500">
              الإجمالي: {data?.total ?? students.length}
            </Text>
            <Flex gap={2}>
              <Button size="sm" isDisabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                السابق
              </Button>
              <Text fontSize="sm" alignSelf="center">
                {page} / {totalPages}
              </Text>
              <Button
                size="sm"
                isDisabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                التالي
              </Button>
            </Flex>
          </Flex>
        </Surface>
      )}

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="2xl" mx={3} maxH="90vh" overflowY="auto">
          <ModalHeader>{editing ? "تعديل طالب" : "إضافة طالب"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>الاسم الكامل</FormLabel>
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  borderRadius="xl"
                />
              </FormControl>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} w="full">
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
                <FormControl>
                  <FormLabel>الصف</FormLabel>
                  <Select
                    value={form.gradeId}
                    onChange={(e) => setForm((f) => ({ ...f, gradeId: e.target.value }))}
                    borderRadius="xl"
                  >
                    <option value="">بدون صف</option>
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {field(g, "name")}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                {!editing ? (
                  <FormControl>
                    <FormLabel>المجموعة (اختياري)</FormLabel>
                    <Select
                      value={form.groupId}
                      onChange={(e) => setForm((f) => ({ ...f, groupId: e.target.value }))}
                      borderRadius="xl"
                    >
                      <option value="">بدون مجموعة</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {field(g, "name")}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                ) : null}
                <FormControl>
                  <FormLabel>تاريخ الانضمام</FormLabel>
                  <Input
                    type="date"
                    value={form.joinedAt}
                    onChange={(e) => setForm((f) => ({ ...f, joinedAt: e.target.value }))}
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
