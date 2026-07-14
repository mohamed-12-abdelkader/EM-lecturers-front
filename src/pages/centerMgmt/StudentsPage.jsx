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
  Switch,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  VStack,
  HStack,
  Badge,
} from "@chakra-ui/react";
import { FaEdit, FaTrash, FaUserGraduate, FaQrcode } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import {
  useGroups,
  useStudentMutations,
  useStudents,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage } from "../../api/centerMgmtApi";
import { field, studentCode, studentName } from "./centerMgmtUtils";
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
  Surface,
} from "./components/UiBits";

export default function StudentsPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo(
    () => ({
      search: debounced || undefined,
      group_id: groupFilter || undefined,
      is_active: activeOnly ? "true" : undefined,
      page,
      limit: 20,
    }),
    [debounced, groupFilter, activeOnly, page]
  );

  const { data: groupsData } = useGroups({ limit: 100 });
  const groups = groupsData?.items || [];
  const { data, isLoading } = useStudents(params);
  const items = data?.items || [];
  const { updateStudent, deleteStudent } = useStudentMutations();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    parent_phone: "",
    is_active: true,
  });

  const openEdit = (student) => {
    setEditing(student);
    setForm({
      full_name: studentName(student),
      phone: field(student, "phone") || "",
      parent_phone: field(student, "parent_phone", "parentPhone") || "",
      is_active: field(student, "is_active", "isActive") !== false,
    });
    onOpen();
  };

  const handleSave = async () => {
    if (!form.full_name.trim() || !form.phone.trim()) {
      toast({ title: "الاسم والهاتف مطلوبان", status: "warning", duration: 2500 });
      return;
    }
    try {
      await updateStudent.mutateAsync({
        studentId: editing.id,
        payload: {
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          parent_phone: form.parent_phone || null,
          is_active: form.is_active,
        },
      });
      toast({ title: "تم تحديث الطالب", status: "success", duration: 2000 });
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

  const actions = (s) => (
    <Flex gap={1} justify="flex-end" flexShrink={0}>
      <Button
        as={RouterLink}
        to={`/center-mgmt/students/${s.id}`}
        size="sm"
        colorScheme="blue"
        variant="outline"
        borderRadius="lg"
        leftIcon={<FaQrcode />}
      >
        QR
      </Button>
      <IconButton
        aria-label="تعديل"
        icon={<FaEdit />}
        size="sm"
        variant="ghost"
        borderRadius="lg"
        onClick={() => openEdit(s)}
      />
      <IconButton
        aria-label="حذف"
        icon={<FaTrash />}
        size="sm"
        variant="ghost"
        colorScheme="red"
        borderRadius="lg"
        onClick={() => handleDelete(s)}
      />
    </Flex>
  );

  return (
    <>
      <PageHeader
        title="الطلاب"
        description="كل طلاب السنتر. لإضافة طالب جديد افتح مجموعة وأضفه من داخلها."
        actions={
          <PrimaryButton as={RouterLink} to="/center-mgmt/groups" size={{ base: "sm", md: "md" }}>
            الذهاب للمجموعات
          </PrimaryButton>
        }
      />

      <FilterBar>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} alignItems="center">
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
              bg="white"
              _dark={{ bg: "gray.800" }}
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
          <Flex align="center" gap={3} px={{ base: 1, md: 2 }} minH="40px">
            <Switch
              isChecked={activeOnly}
              onChange={(e) => {
                setActiveOnly(e.target.checked);
                setPage(1);
              }}
              colorScheme="blue"
            />
            <Text fontSize="sm" fontWeight="medium">
              النشطون فقط
            </Text>
          </Flex>
        </SimpleGrid>
      </FilterBar>

      {isLoading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FaUserGraduate}
          title="لا يوجد طلاب"
          description="أضف طلاباً من صفحة تفاصيل المجموعة."
        />
      ) : (
        <>
          <MobileOnly>
            <VStack spacing={3} align="stretch">
              {items.map((s) => {
                const active = field(s, "is_active", "isActive") !== false;
                return (
                  <ListCard key={s.id}>
                    <Flex justify="space-between" align="flex-start" gap={3} mb={2}>
                      <VStack align="flex-start" spacing={0.5} minW={0}>
                        <Text fontWeight="black" noOfLines={1}>
                          {studentName(s)}
                        </Text>
                        <Text fontSize="xs" fontFamily="mono" color="gray.500">
                          {studentCode(s)}
                        </Text>
                      </VStack>
                      <Badge
                        colorScheme={active ? "green" : "gray"}
                        borderRadius="full"
                        fontSize="xs"
                      >
                        {active ? "نشط" : "موقوف"}
                      </Badge>
                    </Flex>
                    <HStack spacing={4} fontSize="sm" color="gray.600" mb={3} flexWrap="wrap">
                      <Text>{field(s, "phone") || "—"}</Text>
                      <Text color="gray.400">·</Text>
                      <Text>ولي الأمر: {field(s, "parent_phone", "parentPhone") || "—"}</Text>
                    </HStack>
                    {actions(s)}
                  </ListCard>
                );
              })}
            </VStack>
          </MobileOnly>

          <DesktopOnly>
            <Surface p={0} overflow="hidden">
              <TableContainer>
                <Table size="md">
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
                        <Td fontWeight="semibold">{studentName(s)}</Td>
                        <Td>{field(s, "phone") || "—"}</Td>
                        <Td>{field(s, "parent_phone", "parentPhone") || "—"}</Td>
                        <Td>{actions(s)}</Td>
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

      <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", sm: "lg" }} isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent dir="rtl" borderRadius={{ base: "none", sm: "2xl" }} m={0}>
          <ModalHeader>تعديل طالب</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>الاسم</FormLabel>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  borderRadius="xl"
                />
              </FormControl>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                <FormControl isRequired>
                  <FormLabel>الهاتف</FormLabel>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    borderRadius="xl"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>ولي الأمر</FormLabel>
                  <Input
                    value={form.parent_phone}
                    onChange={(e) => setForm((f) => ({ ...f, parent_phone: e.target.value }))}
                    borderRadius="xl"
                  />
                </FormControl>
              </SimpleGrid>
              <Flex align="center" gap={3}>
                <Switch
                  isChecked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  colorScheme="green"
                />
                <Text fontSize="sm">طالب نشط</Text>
              </Flex>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2} flexDir={{ base: "column-reverse", sm: "row" }}>
            <Button variant="ghost" onClick={onClose} borderRadius="xl" w={{ base: "full", sm: "auto" }}>
              إلغاء
            </Button>
            <PrimaryButton
              onClick={handleSave}
              isLoading={updateStudent.isPending}
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
