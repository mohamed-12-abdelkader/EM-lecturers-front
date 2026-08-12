import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Switch,
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
  useColorModeValue,
} from "@chakra-ui/react";
import { FaLink, FaUnlink, FaExternalLinkAlt } from "react-icons/fa";
import {
  assignCourseTeacher,
  fetchAcademyCourses,
  fetchAcademyTeachers,
  unassignCourseTeacher,
} from "../../api/academyApi";
import { ACCENT, courseTitle, field, teacherDisplayName } from "./academyUtils";
import { EmptyState, LoadingBlock, PageHeader, Surface } from "./components/AcademyUiBits";

export default function AcademyCoursesPage() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [teacherUserId, setTeacherUserId] = useState("");
  const [isPrimary, setIsPrimary] = useState(true);
  const muted = useColorModeValue("gray.500", "gray.400");
  const thBg = useColorModeValue("slate.50", "gray.800");
  const tdBorder = useColorModeValue("slate.100", "gray.700");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [courseList, teacherList] = await Promise.all([
        fetchAcademyCourses(),
        fetchAcademyTeachers(),
      ]);
      setCourses(courseList);
      setTeachers(teacherList);
    } catch (err) {
      toast({
        title: "تعذر تحميل الكورسات",
        description: err?.response?.data?.message || "حاول مرة أخرى",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const courseManagers = (course) => {
    const list = course.managers || course.assigned_teachers || course.teachers || [];
    return Array.isArray(list) ? list : [];
  };

  const openAssign = (course) => {
    setSelectedCourse(course);
    setTeacherUserId("");
    setIsPrimary(true);
    onOpen();
  };

  const handleAssign = async () => {
    const courseId = field(selectedCourse, "id", "course_id", "courseId");
    if (!courseId || !teacherUserId) {
      toast({ title: "اختر المدرس", status: "warning" });
      return;
    }
    setSaving(true);
    try {
      await assignCourseTeacher(courseId, {
        teacher_user_id: Number(teacherUserId),
        is_primary: isPrimary,
      });
      toast({ title: "تم الإسناد", status: "success" });
      onClose();
      loadData();
    } catch (err) {
      toast({
        title: "فشل الإسناد",
        description: err?.response?.data?.message,
        status: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async (course, manager) => {
    const courseId = field(course, "id", "course_id", "courseId");
    const teacherId = field(manager, "user_id", "teacher_user_id", "id", "userId");
    if (!courseId || !teacherId) return;
    const ok = window.confirm("إلغاء إسناد هذا المدرس من الكورس؟");
    if (!ok) return;
    try {
      await unassignCourseTeacher(courseId, teacherId);
      toast({ title: "تم إلغاء الإسناد", status: "success" });
      loadData();
    } catch (err) {
      toast({
        title: "تعذر الإلغاء",
        description: err?.response?.data?.message,
        status: "error",
      });
    }
  };

  return (
    <Box>
      <PageHeader
        title="كورسات الأكاديمية"
        description="عرض الكورسات وإسناد المدرسين لإدارة المحتوى"
        action={
          <Button as={RouterLink} to="/teacher_courses" variant="outline" borderRadius="xl" leftIcon={<FaExternalLinkAlt />}>
            إنشاء كورس جديد
          </Button>
        }
      />

      {loading ? (
        <LoadingBlock />
      ) : courses.length === 0 ? (
        <EmptyState
          title="لا توجد كورسات"
          description="أنشئ كورساً جديداً من حساب الأكاديمية ثم اسند مدرساً لإدارته."
          action={
            <Button as={RouterLink} to="/teacher_courses" bg={ACCENT} color="white" borderRadius="xl">
              إنشاء كورس
            </Button>
          }
        />
      ) : (
        <Surface overflowX="auto">
          <Table>
            <Thead bg={thBg}>
              <Tr>
                <Th border="none">الكورس</Th>
                <Th border="none">المادة</Th>
                <Th border="none">المدرسون المسندون</Th>
                <Th border="none" textAlign="left">
                  إجراءات
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {courses.map((course) => {
                const courseId = field(course, "id", "course_id", "courseId");
                const managers = courseManagers(course);
                return (
                  <Tr key={courseId}>
                    <Td borderColor={tdBorder}>
                      <VStack align="flex-start" spacing={0}>
                        <Text fontWeight="bold" fontSize="sm">
                          {courseTitle(course)}
                        </Text>
                        <Button
                          as={RouterLink}
                          to={`/CourseDetailsPage/${courseId}`}
                          variant="link"
                          size="xs"
                          color={ACCENT}
                          leftIcon={<FaExternalLinkAlt />}
                        >
                          فتح الكورس
                        </Button>
                      </VStack>
                    </Td>
                    <Td borderColor={tdBorder} fontSize="sm">
                      {field(course, "subject", "specialty") || "—"}
                    </Td>
                    <Td borderColor={tdBorder}>
                      {managers.length ? (
                        <VStack align="stretch" spacing={2}>
                          {managers.map((m) => {
                            const tid = field(m, "user_id", "teacher_user_id", "id", "userId");
                            return (
                              <HStack key={tid} justify="space-between">
                                <HStack spacing={2}>
                                  <Text fontSize="sm">{teacherDisplayName(m)}</Text>
                                  {m.is_primary ? (
                                    <Badge colorScheme="purple" borderRadius="full" fontSize="10px">
                                      رئيسي
                                    </Badge>
                                  ) : null}
                                </HStack>
                                <IconButton
                                  aria-label="إلغاء الإسناد"
                                  icon={<FaUnlink />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => handleUnassign(course, m)}
                                />
                              </HStack>
                            );
                          })}
                        </VStack>
                      ) : (
                        <Text fontSize="xs" color={muted}>
                          لم يُسند مدرس
                        </Text>
                      )}
                    </Td>
                    <Td borderColor={tdBorder}>
                      <Button size="sm" leftIcon={<FaLink />} borderRadius="xl" variant="outline" onClick={() => openAssign(course)}>
                        إسناد مدرس
                      </Button>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Surface>
      )}

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl" mx={4}>
          <ModalHeader>إسناد مدرس — {courseTitle(selectedCourse || {})}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="sm">المدرس</FormLabel>
                <Select
                  placeholder="اختر مدرساً"
                  borderRadius="xl"
                  value={teacherUserId}
                  onChange={(e) => setTeacherUserId(e.target.value)}
                >
                  {teachers.map((t) => {
                    const id = field(t, "id", "user_id", "userId");
                    return (
                      <option key={id} value={String(id)}>
                        {teacherDisplayName(t)}
                      </option>
                    );
                  })}
                </Select>
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel fontSize="sm" mb={0}>
                  مدرس رئيسي للكورس
                </FormLabel>
                <Switch colorScheme="blue" isChecked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} mr={3} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" borderRadius="xl" onClick={onClose}>
              إلغاء
            </Button>
            <Button bg={ACCENT} color="white" borderRadius="xl" isLoading={saving} onClick={handleAssign}>
              تأكيد الإسناد
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
