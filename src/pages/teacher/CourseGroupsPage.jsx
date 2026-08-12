import { useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Switch,
  Text,
  Textarea,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  FaEdit,
  FaPlus,
  FaTrash,
  FaUsers,
  FaUserPlus,
  FaUserMinus,
} from "react-icons/fa";
import { MdGroups } from "react-icons/md";
import baseUrl from "../../api/baseUrl";
import { courseGroupsApiError } from "../../api/courseGroupsApi";
import { fetchTeacherGrades } from "../../api/teacherManagedStudentsApi";
import {
  useCourseGroupMutations,
  useCourseGroupSettings,
  useCourseGroupStudentMutations,
  useCourseGroupStudents,
  useTeacherCourseGroups,
  useUpdateCourseGroupSettings,
} from "../../Hooks/course/useCourseGroups";
import { useQuery } from "@tanstack/react-query";

const emptyGroupForm = { name: "", description: "", grade_id: "" };

function GroupStudentsModal({ group, isOpen, onClose }) {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const { data: students = [], isLoading } = useCourseGroupStudents(group?.id, {
    enabled: isOpen && Boolean(group?.id),
  });
  const { addStudent, removeStudent } = useCourseGroupStudentMutations(group?.id);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const resultRowBg = useColorModeValue("gray.50", "whiteAlpha.50");

  const handleSearch = async () => {
    const q = search.trim();
    if (q.length < 2) return;
    setSearching(true);
    try {
      const { data } = await baseUrl.get("/api/teacher/platform-students", {
        params: { search: q, limit: 10 },
      });
      const list = data?.students ?? data?.data?.students ?? [];
      setSearchResults(Array.isArray(list) ? list : []);
    } catch {
      setSearchResults([]);
      toast({ title: "تعذّر البحث عن الطلاب", status: "error", duration: 3000 });
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (studentId) => {
    try {
      await addStudent.mutateAsync(studentId);
      toast({ title: "تمت إضافة الطالب للمجموعة", status: "success", duration: 2500 });
      setSearchResults([]);
      setSearch("");
    } catch (err) {
      toast({
        title: "تعذّر الإضافة",
        description: courseGroupsApiError(err),
        status: "error",
        duration: 4000,
      });
    }
  };

  const handleRemove = async (studentId) => {
    try {
      await removeStudent.mutateAsync(studentId);
      toast({ title: "تمت إزالة الطالب", status: "success", duration: 2500 });
    } catch (err) {
      toast({
        title: "تعذّر الإزالة",
        description: courseGroupsApiError(err),
        status: "error",
        duration: 4000,
      });
    }
  };

  if (!group) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside" isCentered>
      <ModalOverlay />
      <ModalContent dir="rtl">
        <ModalHeader>
          طلاب مجموعة «{group.name}»
          <Text fontSize="sm" fontWeight="normal" color="gray.500" mt={1}>
            {group.grade_name || "—"} • {students.length} طالب
          </Text>
        </ModalHeader>
        <ModalCloseButton left={3} right="auto" />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Box p={3} borderWidth="1px" borderColor={borderColor} borderRadius="xl" bg={cardBg}>
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                إضافة طالب
              </Text>
              <HStack>
                <Input
                  placeholder="ابحث بالاسم أو الهاتف..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button
                  colorScheme="blue"
                  onClick={handleSearch}
                  isLoading={searching}
                  leftIcon={<FaUserPlus />}
                >
                  بحث
                </Button>
              </HStack>
              {searchResults.length > 0 ? (
                <VStack align="stretch" mt={3} spacing={2}>
                  {searchResults.map((s) => (
                    <Flex
                      key={s.id}
                      justify="space-between"
                      align="center"
                      p={2}
                      borderRadius="lg"
                      bg={resultRowBg}
                    >
                      <Box>
                        <Text fontWeight="semibold" fontSize="sm">
                          {s.name || s.fname || "طالب"}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {s.phone || "—"}
                        </Text>
                      </Box>
                      <Button size="sm" colorScheme="blue" onClick={() => handleAdd(s.id)}>
                        إضافة
                      </Button>
                    </Flex>
                  ))}
                </VStack>
              ) : null}
            </Box>

            {isLoading ? (
              <Flex justify="center" py={8}>
                <Spinner color="blue.500" />
              </Flex>
            ) : students.length === 0 ? (
              <Text textAlign="center" color="gray.500" py={6}>
                لا يوجد طلاب في هذه المجموعة بعد
              </Text>
            ) : (
              <VStack align="stretch" spacing={2}>
                {students.map((student) => (
                  <Flex
                    key={student.id || student.student_id}
                    justify="space-between"
                    align="center"
                    p={3}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="xl"
                  >
                    <Box>
                      <Text fontWeight="semibold">
                        {student.name || student.student_name || "طالب"}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {student.phone || student.student_phone || ""}
                      </Text>
                    </Box>
                    <IconButton
                      aria-label="إزالة"
                      icon={<FaUserMinus />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      isLoading={removeStudent.isPending}
                      onClick={() => handleRemove(student.id || student.student_id)}
                    />
                  </Flex>
                ))}
              </VStack>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>إغلاق</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default function CourseGroupsPage() {
  const toast = useToast();
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const subText = useColorModeValue("gray.600", "gray.400");

  const [gradeFilter, setGradeFilter] = useState("");
  const [form, setForm] = useState(emptyGroupForm);
  const [editingGroup, setEditingGroup] = useState(null);
  const [studentsGroup, setStudentsGroup] = useState(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const studentsModal = useDisclosure();

  const { data: settings, isLoading: settingsLoading } = useCourseGroupSettings();
  const updateSettings = useUpdateCourseGroupSettings();
  const enabled = Boolean(settings?.course_group_access_enabled);

  const { data: grades = [] } = useQuery({
    queryKey: ["teacherGrades"],
    queryFn: fetchTeacherGrades,
    staleTime: 120_000,
  });

  const { data: groups = [], isLoading: groupsLoading } = useTeacherCourseGroups(
    gradeFilter || undefined,
    { enabled },
  );
  const { createGroup, updateGroup, deleteGroup } = useCourseGroupMutations();

  const activeGroups = useMemo(
    () => groups.filter((g) => g.status !== "inactive"),
    [groups],
  );

  const openCreate = () => {
    setEditingGroup(null);
    setForm({ ...emptyGroupForm, grade_id: gradeFilter || "" });
    onOpen();
  };

  const openEdit = (group) => {
    setEditingGroup(group);
    setForm({
      name: group.name || "",
      description: group.description || "",
      grade_id: String(group.grade_id || ""),
    });
    onOpen();
  };

  const handleToggle = async (checked) => {
    try {
      await updateSettings.mutateAsync({ course_group_access_enabled: checked });
      toast({
        title: checked ? "تم تفعيل مجموعات الكورس" : "تم تعطيل مجموعات الكورس",
        status: "success",
        duration: 3000,
      });
    } catch (err) {
      toast({
        title: "تعذّر حفظ الإعداد",
        description: courseGroupsApiError(err),
        status: "error",
        duration: 4000,
      });
    }
  };

  const handleSaveGroup = async () => {
    if (!form.name.trim() || !form.grade_id) {
      toast({ title: "الاسم والصف مطلوبان", status: "warning", duration: 3000 });
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      grade_id: Number(form.grade_id),
    };
    try {
      if (editingGroup) {
        await updateGroup.mutateAsync({ groupId: editingGroup.id, payload });
        toast({ title: "تم تحديث المجموعة", status: "success", duration: 2500 });
      } else {
        await createGroup.mutateAsync(payload);
        toast({ title: "تم إنشاء المجموعة", status: "success", duration: 2500 });
      }
      onClose();
    } catch (err) {
      toast({
        title: "تعذّر الحفظ",
        description: courseGroupsApiError(err),
        status: "error",
        duration: 4000,
      });
    }
  };

  const handleDelete = async (group) => {
    if (!window.confirm(`تعطيل مجموعة «${group.name}»؟`)) return;
    try {
      await deleteGroup.mutateAsync(group.id);
      toast({ title: "تم تعطيل المجموعة", status: "success", duration: 2500 });
    } catch (err) {
      toast({
        title: "تعذّر الحذف",
        description: courseGroupsApiError(err),
        status: "error",
        duration: 4000,
      });
    }
  };

  const openStudents = (group) => {
    setStudentsGroup(group);
    studentsModal.onOpen();
  };

  return (
    <Box minH="100vh" bg={pageBg} py={{ base: 6, md: 10 }} dir="rtl">
      <Container maxW="6xl">
        <VStack align="stretch" spacing={6}>
          <Flex
            justify="space-between"
            align={{ base: "stretch", md: "center" }}
            direction={{ base: "column", md: "row" }}
            gap={4}
          >
            <Box>
              <HStack spacing={2} mb={2}>
                <Icon as={MdGroups} boxSize={6} color="blue.500" />
                <Heading size="lg">مجموعات الكورس</Heading>
              </HStack>
              <Text color={subText} fontSize="sm" maxW="2xl">
                نظام مستقل عن السنتر — يحدد أي طلاب يرون محاضرات مُستهدفة بمجموعات
                محددة. عند التعطيل يبقى النظام كما هو بدون أي تغيير.
              </Text>
            </Box>
          </Flex>

          <Box
            p={5}
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="2xl"
            boxShadow="sm"
          >
            <Flex justify="space-between" align="center" gap={4} flexWrap="wrap">
              <Box>
                <Text fontWeight="bold">تفعيل مجموعات الكورس</Text>
                <Text fontSize="sm" color={subText} mt={1}>
                  عند التفعيل يمكنك إنشاء مجموعات وربط المحاضرات بها
                </Text>
              </Box>
              {settingsLoading ? (
                <Spinner size="sm" />
              ) : (
                <Switch
                  size="lg"
                  colorScheme="blue"
                  isChecked={enabled}
                  isDisabled={updateSettings.isPending}
                  onChange={(e) => handleToggle(e.target.checked)}
                />
              )}
            </Flex>
          </Box>

          {enabled ? (
            <>
              <Flex
                justify="space-between"
                align={{ base: "stretch", sm: "center" }}
                gap={3}
                flexWrap="wrap"
              >
                <HStack spacing={3} flexWrap="wrap">
                  <FormControl maxW="220px">
                    <FormLabel fontSize="sm" mb={1}>
                      تصفية بالصف
                    </FormLabel>
                    <Select
                      value={gradeFilter}
                      onChange={(e) => setGradeFilter(e.target.value)}
                      placeholder="كل الصفوف"
                      size="sm"
                      borderRadius="xl"
                    >
                      {grades.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <Badge colorScheme="blue" alignSelf="flex-end" py={1} px={3} borderRadius="full">
                    {activeGroups.length} مجموعة
                  </Badge>
                </HStack>
                <Button
                  colorScheme="blue"
                  leftIcon={<FaPlus />}
                  borderRadius="xl"
                  onClick={openCreate}
                >
                  مجموعة جديدة
                </Button>
              </Flex>

              {groupsLoading ? (
                <Flex justify="center" py={16}>
                  <Spinner size="lg" color="blue.500" thickness="3px" />
                </Flex>
              ) : activeGroups.length === 0 ? (
                <Box
                  p={10}
                  textAlign="center"
                  bg={cardBg}
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <Icon as={MdGroups} boxSize={10} color="gray.400" mb={3} />
                  <Text color={subText}>لا توجد مجموعات — أنشئ أول مجموعة للصف</Text>
                  <Button mt={4} colorScheme="blue" onClick={openCreate}>
                    إضافة مجموعة
                  </Button>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {activeGroups.map((group) => (
                    <Box
                      key={group.id}
                      p={5}
                      bg={cardBg}
                      borderWidth="1px"
                      borderColor={borderColor}
                      borderRadius="2xl"
                      boxShadow="sm"
                    >
                      <Flex justify="space-between" align="start" gap={2}>
                        <Box flex={1} minW={0}>
                          <Text fontWeight="bold" fontSize="lg" noOfLines={1}>
                            {group.name}
                          </Text>
                          <Text fontSize="sm" color={subText} mt={1}>
                            {group.grade_name || "—"}
                          </Text>
                          {group.description ? (
                            <Text fontSize="xs" color={subText} mt={2} noOfLines={2}>
                              {group.description}
                            </Text>
                          ) : null}
                          <HStack mt={3} spacing={2}>
                            <Badge colorScheme="green">نشطة</Badge>
                            <Badge variant="outline">
                              <Icon as={FaUsers} mr={1} />
                              {group.students_count ?? 0} طالب
                            </Badge>
                          </HStack>
                        </Box>
                        <HStack spacing={1}>
                          <IconButton
                            aria-label="طلاب"
                            icon={<FaUsers />}
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            onClick={() => openStudents(group)}
                          />
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
                        </HStack>
                      </Flex>
                      <Button
                        mt={4}
                        size="sm"
                        width="full"
                        variant="outline"
                        colorScheme="blue"
                        leftIcon={<FaUsers />}
                        onClick={() => openStudents(group)}
                      >
                        إدارة الطلاب
                      </Button>
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </>
          ) : null}
        </VStack>
      </Container>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent dir="rtl">
          <ModalHeader>{editingGroup ? "تعديل المجموعة" : "مجموعة جديدة"}</ModalHeader>
          <ModalCloseButton left={3} right="auto" />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>اسم المجموعة</FormLabel>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: مجموعة السبت"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>الصف الدراسي</FormLabel>
                <Select
                  value={form.grade_id}
                  onChange={(e) => setForm({ ...form, grade_id: e.target.value })}
                  placeholder="اختر الصف"
                >
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>وصف (اختياري)</FormLabel>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
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
              onClick={handleSaveGroup}
              isLoading={createGroup.isPending || updateGroup.isPending}
            >
              حفظ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <GroupStudentsModal
        group={studentsGroup}
        isOpen={studentsModal.isOpen}
        onClose={studentsModal.onClose}
      />
    </Box>
  );
}
