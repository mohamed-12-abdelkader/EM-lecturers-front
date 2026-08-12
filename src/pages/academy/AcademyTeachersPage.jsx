import { useCallback, useEffect, useRef, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  VStack,
  Checkbox,
  CheckboxGroup,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import baseUrl from "../../api/baseUrl";
import {
  createAcademyTeacher,
  deleteAcademyTeacher,
  fetchAcademyTeachers,
  updateAcademyTeacher,
} from "../../api/academyApi";
import { ACCENT, field, teacherDisplayName } from "./academyUtils";
import { EmptyState, LoadingBlock, PageHeader, StatusBadge, Surface } from "./components/AcademyUiBits";

const emptyForm = () => ({
  name: "",
  email: "",
  password: "",
  phone: "",
  subject: "",
  grade_ids: [],
});

export default function AcademyTeachersPage() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [availableGrades, setAvailableGrades] = useState([]);
  const fileRef = useRef(null);
  const muted = useColorModeValue("gray.500", "gray.400");
  const thBg = useColorModeValue("slate.50", "gray.800");
  const tdBorder = useColorModeValue("slate.100", "gray.700");
  const fieldBg = useColorModeValue("white", "gray.900");

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchAcademyTeachers();
      setTeachers(list);
    } catch (err) {
      toast({
        title: "تعذر تحميل المدرسين",
        description: err?.response?.data?.message || "حاول مرة أخرى",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  useEffect(() => {
    baseUrl
      .get("/api/teacher/available-grades")
      .then((res) => setAvailableGrades(Array.isArray(res?.data?.grades) ? res.data.grades : []))
      .catch(() => setAvailableGrades([]));
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm());
    setAvatarFile(null);
    onOpen();
  };

  const openEdit = (teacher) => {
    const id = field(teacher, "id", "user_id", "userId");
    setEditId(id);
    setForm({
      name: teacherDisplayName(teacher),
      email: field(teacher, "email") || "",
      password: "",
      phone: field(teacher, "phone", "whatsapp_number") || "",
      subject: field(teacher, "subject") || "",
      grade_ids: Array.isArray(teacher.grade_ids) ? teacher.grade_ids : [],
    });
    setAvatarFile(null);
    onOpen();
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "الاسم والبريد مطلوبان", status: "warning" });
      return;
    }
    if (!editId && !form.password) {
      toast({ title: "كلمة المرور مطلوبة للمدرس الجديد", status: "warning" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        subject: form.subject.trim() || undefined,
        grade_ids: form.grade_ids,
      };
      if (form.password) payload.password = form.password;

      if (editId) {
        await updateAcademyTeacher(editId, payload);
        toast({ title: "تم تحديث المدرس", status: "success" });
      } else {
        await createAcademyTeacher(payload, avatarFile);
        toast({ title: "تم إضافة المدرس", status: "success" });
      }
      onClose();
      loadTeachers();
    } catch (err) {
      toast({
        title: "فشل الحفظ",
        description: err?.response?.data?.message || "تحقق من البيانات",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (teacher) => {
    const id = field(teacher, "id", "user_id", "userId");
    if (!id) return;
    const ok = window.confirm(`تعطيل المدرس «${teacherDisplayName(teacher)}» وإلغاء إسناداته؟`);
    if (!ok) return;
    try {
      await deleteAcademyTeacher(id);
      toast({ title: "تم تعطيل المدرس", status: "success" });
      loadTeachers();
    } catch (err) {
      toast({
        title: "تعذر الحذف",
        description: err?.response?.data?.message,
        status: "error",
      });
    }
  };

  const assignedCourses = useCallback((teacher) => {
    const courses = teacher.assigned_courses || teacher.courses || teacher.managed_courses || [];
    return Array.isArray(courses) ? courses : [];
  }, []);

  const inputProps = {
    size: "md",
    borderRadius: "xl",
    bg: fieldBg,
  };

  return (
    <Box>
      <PageHeader
        title="مدرسو الأكاديمية"
        description="أضف مدرسين تابعين (academy_teacher) وادِر بياناتهم"
        action={
          <Button leftIcon={<FaPlus />} bg={ACCENT} color="white" borderRadius="xl" onClick={openCreate} _hover={{ bg: "#2B6CB0" }}>
            إضافة مدرس
          </Button>
        }
      />

      {loading ? (
        <LoadingBlock />
      ) : teachers.length === 0 ? (
        <EmptyState
          title="لا يوجد مدرسون بعد"
          description="ابدأ بإضافة أول مدرس تابع للأكاديمية — سيستطيع إدارة الكورسات المسندة إليه فقط."
          action={
            <Button bg={ACCENT} color="white" borderRadius="xl" leftIcon={<FaPlus />} onClick={openCreate}>
              إضافة مدرس
            </Button>
          }
        />
      ) : (
        <Surface overflowX="auto">
          <Table size="md">
            <Thead bg={thBg}>
              <Tr>
                <Th border="none">المدرس</Th>
                <Th border="none">البريد</Th>
                <Th border="none">المادة</Th>
                <Th border="none">الكورسات المسندة</Th>
                <Th border="none">الحالة</Th>
                <Th border="none" textAlign="left">
                  إجراءات
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {teachers.map((teacher) => {
                const id = field(teacher, "id", "user_id", "userId");
                const courses = assignedCourses(teacher);
                return (
                  <Tr key={id}>
                    <Td borderColor={tdBorder}>
                      <HStack spacing={3}>
                        <Avatar size="sm" name={teacherDisplayName(teacher)} src={field(teacher, "avatar_url", "avatar")} />
                        <Text fontWeight="semibold" fontSize="sm">
                          {teacherDisplayName(teacher)}
                        </Text>
                      </HStack>
                    </Td>
                    <Td borderColor={tdBorder} dir="ltr" fontSize="sm">
                      {field(teacher, "email") || "—"}
                    </Td>
                    <Td borderColor={tdBorder} fontSize="sm">
                      {field(teacher, "subject") || "—"}
                    </Td>
                    <Td borderColor={tdBorder}>
                      {courses.length ? (
                        <HStack spacing={1} flexWrap="wrap">
                          {courses.slice(0, 3).map((c) => (
                            <Badge key={c.id || c.course_id} colorScheme="blue" borderRadius="full" fontSize="xs">
                              {field(c, "title", "name", "course_name") || "كورس"}
                            </Badge>
                          ))}
                          {courses.length > 3 ? (
                            <Badge borderRadius="full" fontSize="xs">
                              +{courses.length - 3}
                            </Badge>
                          ) : null}
                        </HStack>
                      ) : (
                        <Text fontSize="xs" color={muted}>
                          لا إسناد
                        </Text>
                      )}
                    </Td>
                    <Td borderColor={tdBorder}>
                      <StatusBadge active={field(teacher, "account_status") !== "inactive" && teacher.is_active !== false} />
                    </Td>
                    <Td borderColor={tdBorder}>
                      <HStack justify="flex-end">
                        <IconButton aria-label="تعديل" icon={<FaEdit />} size="sm" variant="ghost" onClick={() => openEdit(teacher)} />
                        <IconButton aria-label="حذف" icon={<FaTrash />} size="sm" variant="ghost" colorScheme="red" onClick={() => handleDelete(teacher)} />
                      </HStack>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Surface>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl" mx={4}>
          <ModalHeader>{editId ? "تعديل مدرس" : "إضافة مدرس جديد"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {!editId ? (
                <FormControl>
                  <FormLabel fontSize="sm">صورة المدرس</FormLabel>
                  <Input ref={fileRef} type="file" accept="image/*" display="none" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
                  <Button variant="outline" borderRadius="xl" onClick={() => fileRef.current?.click()}>
                    {avatarFile ? avatarFile.name : "اختيار صورة (اختياري)"}
                  </Button>
                </FormControl>
              ) : null}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">الاسم</FormLabel>
                  <Input {...inputProps} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">البريد الإلكتروني</FormLabel>
                  <Input {...inputProps} type="email" dir="ltr" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </FormControl>
                <FormControl isRequired={!editId}>
                  <FormLabel fontSize="sm">{editId ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور"}</FormLabel>
                  <Input {...inputProps} type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">الهاتف</FormLabel>
                  <Input {...inputProps} dir="ltr" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </FormControl>
                <FormControl gridColumn={{ md: "span 2" }}>
                  <FormLabel fontSize="sm">المادة / التخصص</FormLabel>
                  <Input {...inputProps} value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
                </FormControl>
              </SimpleGrid>
              {availableGrades.length ? (
                <FormControl>
                  <FormLabel fontSize="sm">الصفوف</FormLabel>
                  <Box borderWidth="1px" borderRadius="xl" p={3}>
                    <CheckboxGroup
                      value={form.grade_ids.map(String)}
                      onChange={(values) =>
                        setForm((f) => ({
                          ...f,
                          grade_ids: values.map(Number).filter((n) => Number.isFinite(n)),
                        }))
                      }
                    >
                      <SimpleGrid columns={2} spacing={2}>
                        {availableGrades.map((g) => (
                          <Checkbox key={g.id} value={String(g.id)} colorScheme="blue">
                            {g.name}
                          </Checkbox>
                        ))}
                      </SimpleGrid>
                    </CheckboxGroup>
                  </Box>
                </FormControl>
              ) : null}
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" borderRadius="xl" onClick={onClose}>
              إلغاء
            </Button>
            <Button bg={ACCENT} color="white" borderRadius="xl" isLoading={saving} onClick={handleSave} _hover={{ bg: "#2B6CB0" }}>
              {editId ? "حفظ التعديلات" : "إضافة المدرس"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
