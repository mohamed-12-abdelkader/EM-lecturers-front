import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
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
  Progress,
  Select,
  SimpleGrid,
  Skeleton,
  Switch,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import {
  FaChartBar,
  FaEdit,
  FaEye,
  FaEyeSlash,
  FaPlus,
  FaQuestionCircle,
  FaSync,
  FaTrash,
} from "react-icons/fa";
import { MdPublic, MdSchool } from "react-icons/md";
import { Link as RouterLink } from "react-router-dom";
import ExamStudentSettingsFields, {
  inferAnswersReleaseMode,
} from "../../components/exam/ExamStudentSettingsFields";
import QuestionDisplayModeFields from "../../components/exam/QuestionDisplayModeFields";
import {
  buildPublicExamPayload,
  createPublicExam,
  deletePublicExam,
  fetchTeacherPublicExams,
  publishPublicExam,
  publicExamsApiError,
  unpublishPublicExam,
  updatePublicExam,
} from "../../api/publicExamsApi";
import { fetchTeacherGrades } from "../../api/teacherManagedStudentsApi";
import {
  DailyQuizHero,
  DailyQuizPageShell,
  DailyQuizSurface,
  useDailyQuizTheme,
} from "../dailyQuiz/DailyQuizChrome";
import { QUESTION_DISPLAY_MODES } from "../../utils/examFlowUtils";
import {
  formatAttemptLimitLabel,
  formatCourseExamDurationLabel,
  fromDateTimeLocalValue,
  getCourseExamAvailabilityStatus,
  toDateTimeLocalValue,
} from "../../utils/courseLevelExamUtils";

const emptyForm = () => ({
  title: "",
  description: "",
  gradeId: "",
  questions_count: "20",
  question_display_mode: QUESTION_DISPLAY_MODES.ORDERED,
  duration_minutes: "45",
  duration_unlimited: false,
  is_visible_to_students: false,
  available_from: "",
  visibility_end_date: "",
  answers_release_mode: "immediate",
  show_answers_immediately: true,
  show_answers_after_hours: 24,
  answers_visible_at: "",
  is_active: true,
  attempt_limit: "1",
});

function examToForm(exam) {
  if (!exam) return emptyForm();
  return {
    title: exam.title || "",
    description: exam.description || "",
    gradeId: String(exam.gradeId ?? exam.grade_id ?? ""),
    questions_count: String(exam.questions_count ?? exam.questionsCount ?? ""),
    question_display_mode:
      exam.question_display_mode || exam.questionDisplayMode || QUESTION_DISPLAY_MODES.ORDERED,
    duration_minutes: String(exam.duration_minutes ?? exam.durationMinutes ?? ""),
    duration_unlimited: Boolean(
      exam.duration_unlimited ||
        exam.duration_minutes == null ||
        Number(exam.duration_minutes) <= 0,
    ),
    is_visible_to_students: Boolean(exam.is_visible_to_students),
    available_from: toDateTimeLocalValue(exam.available_from),
    visibility_end_date: toDateTimeLocalValue(exam.visibility_end_date),
    answers_release_mode: inferAnswersReleaseMode(exam),
    show_answers_immediately: exam.show_answers_immediately ?? true,
    show_answers_after_hours: exam.show_answers_after_hours || 24,
    answers_visible_at: toDateTimeLocalValue(exam.answers_visible_at),
    is_active: exam.is_active ?? true,
    attempt_limit: exam.attempt_limit != null ? String(exam.attempt_limit) : "",
  };
}

function validateForm(form) {
  if (!String(form.title || "").trim()) return "أدخل عنوان الامتحان";
  if (!form.gradeId) return "اختر الصف الدراسي";
  if (!form.questions_count || Number(form.questions_count) <= 0) {
    return "عدد الأسئلة يجب أن يكون أكبر من صفر";
  }
  if (!form.duration_unlimited && (!form.duration_minutes || Number(form.duration_minutes) <= 0)) {
    return "حدد مدة الامتحان أو فعّل بدون حد زمني";
  }
  if (form.answers_release_mode === "scheduled" && !form.answers_visible_at) {
    return "حدد موعد إظهار الإجابات";
  }
  if (form.answers_release_mode === "after_end" && !form.visibility_end_date) {
    return "حدد تاريخ انتهاء الامتحان لإظهار الإجابات بعده";
  }
  return null;
}

function optionId(item) {
  return item?.id ?? item?.grade_id ?? item?.gradeId;
}

function optionLabel(item) {
  return item?.name || item?.grade_name || item?.gradeName || item?.title || "صف";
}

export default function TeacherPublicExamsPage() {
  const token = localStorage.getItem("token");
  const toast = useToast();
  const theme = useDailyQuizTheme();
  const formModal = useDisclosure();
  const deleteCancelRef = useRef();

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [grades, setGrades] = useState([]);
  const [gradeFilter, setGradeFilter] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingExam, setEditingExam] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const stats = useMemo(() => {
    const published = exams.filter((e) => e.is_visible_to_students).length;
    const drafts = exams.length - published;
    const submissions = exams.reduce((s, e) => s + (e.submissionsCount || 0), 0);
    return { published, drafts, submissions };
  }, [exams]);

  const loadGrades = useCallback(async () => {
    try {
      const list = await fetchTeacherGrades();
      setGrades(Array.isArray(list) ? list : []);
    } catch {
      setGrades([]);
    }
  }, []);

  const loadExams = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const list = await fetchTeacherPublicExams(
        { gradeId: gradeFilter || undefined },
        token,
      );
      setExams(list);
    } catch (err) {
      toast({
        title: publicExamsApiError(err, "فشل تحميل الامتحانات العامة"),
        status: "error",
        isClosable: true,
      });
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, [token, gradeFilter, toast]);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const openCreate = () => {
    setEditingExam(null);
    setForm({
      ...emptyForm(),
      gradeId: gradeFilter || "",
    });
    formModal.onOpen();
  };

  const openEdit = (exam) => {
    setEditingExam(exam);
    setForm(examToForm(exam));
    formModal.onOpen();
  };

  const submitForm = async () => {
    const message = validateForm(form);
    if (message) {
      toast({ title: message, status: "warning", isClosable: true });
      return;
    }
    setSaving(true);
    try {
      const payload = buildPublicExamPayload({
        ...form,
        available_from: fromDateTimeLocalValue(form.available_from),
        visibility_end_date: fromDateTimeLocalValue(form.visibility_end_date),
        answers_visible_at: fromDateTimeLocalValue(form.answers_visible_at),
      });
      if (editingExam?.id) {
        await updatePublicExam(editingExam.id, payload, token);
        toast({ title: "تم تحديث الامتحان", status: "success", isClosable: true });
      } else {
        await createPublicExam(payload, token);
        toast({
          title: "تم إنشاء الامتحان",
          description: "أضف الأسئلة ثم انشره للطلاب",
          status: "success",
          isClosable: true,
        });
      }
      formModal.onClose();
      loadExams();
    } catch (err) {
      toast({
        title: publicExamsApiError(err, "فشل حفظ الامتحان"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (exam) => {
    setActionId(exam.id);
    try {
      if (exam.is_visible_to_students) {
        await unpublishPublicExam(exam.id, token);
        toast({ title: "تم إلغاء النشر", status: "info", isClosable: true });
      } else {
        await publishPublicExam(exam.id, token);
        toast({ title: "تم نشر الامتحان للطلاب", status: "success", isClosable: true });
      }
      loadExams();
    } catch (err) {
      toast({
        title: publicExamsApiError(err, "فشل تغيير حالة النشر"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setActionId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await deletePublicExam(deleteTarget.id, token);
      toast({ title: "تم حذف الامتحان", status: "success", isClosable: true });
      setDeleteTarget(null);
      loadExams();
    } catch (err) {
      toast({
        title: publicExamsApiError(err, "فشل حذف الامتحان"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!token) {
    return (
      <DailyQuizPageShell>
        <Text textAlign="center" py={16}>
          يجب تسجيل الدخول أولاً
        </Text>
      </DailyQuizPageShell>
    );
  }

  return (
    <DailyQuizPageShell maxW="6xl">
      <DailyQuizHero
        icon={MdPublic}
        eyebrow="Grade-scoped exams"
        title="الامتحانات العامة"
        subtitle="امتحانات مستقلة عن الكورسات ومربوطة بالصف الدراسي. أنشئ المسودة، جهّز الأسئلة، ثم انشرها لطلاب الصف."
        actions={
          <HStack spacing={2}>
            <Button
              leftIcon={<FaSync />}
              variant="outline"
              borderColor="whiteAlpha.400"
              color="white"
              borderRadius="xl"
              _hover={{ bg: "whiteAlpha.200" }}
              onClick={loadExams}
              isLoading={loading}
            >
              تحديث
            </Button>
            <Button
              leftIcon={<FaPlus />}
              colorScheme="orange"
              borderRadius="xl"
              onClick={openCreate}
            >
              امتحان جديد
            </Button>
          </HStack>
        }
      />

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={5}>
        <Kpi label="الإجمالي" value={exams.length} hint="امتحان عام" />
        <Kpi label="منشور" value={stats.published} color="green.500" hint="ظاهر للطلاب" />
        <Kpi label="مسودة" value={stats.drafts} color="orange.500" hint="غير منشور" />
        <Kpi label="تسليمات" value={stats.submissions} color="blue.500" hint="محاولات مكتملة" />
      </SimpleGrid>

      <DailyQuizSurface mb={5} p={4}>
        <Flex gap={3} wrap="wrap" align="end" justify="space-between">
          <FormControl maxW={{ base: "full", sm: "280px" }}>
            <FormLabel fontSize="xs" fontWeight="700" color={theme.muted}>
              تصفية حسب الصف
            </FormLabel>
            <Select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              borderRadius="xl"
              bg={theme.softBg}
            >
              <option value="">كل الصفوف</option>
              {grades.map((g) => (
                <option key={optionId(g)} value={optionId(g)}>
                  {optionLabel(g)}
                </option>
              ))}
            </Select>
          </FormControl>
          <Text fontSize="sm" color={theme.muted}>
            {exams.length} نتيجة
          </Text>
        </Flex>
      </DailyQuizSurface>

      {loading ? (
        <VStack align="stretch" spacing={4}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} h="160px" borderRadius="2xl" />
          ))}
        </VStack>
      ) : exams.length === 0 ? (
        <DailyQuizSurface p={{ base: 8, md: 12 }} textAlign="center">
          <Flex
            mx="auto"
            mb={4}
            w={16}
            h={16}
            borderRadius="2xl"
            bg="blue.50"
            color="blue.500"
            align="center"
            justify="center"
          >
            <Icon as={MdPublic} boxSize={8} />
          </Flex>
          <Text fontWeight="900" fontSize="lg" color={theme.heading}>
            ابدأ بأول امتحان عام
          </Text>
          <Text fontSize="sm" color={theme.muted} mt={2} mb={5} maxW="md" mx="auto" lineHeight="1.8">
            اختر الصف، حدد المدة وعدد الأسئلة، ثم أضف الأسئلة من صفحة الإدارة وانشره للطلاب.
          </Text>
          <Button leftIcon={<FaPlus />} colorScheme="blue" borderRadius="xl" size="md" onClick={openCreate}>
            إنشاء امتحان عام
          </Button>
        </DailyQuizSurface>
      ) : (
        <VStack align="stretch" spacing={4}>
          {exams.map((exam) => {
            const availability = getCourseExamAvailabilityStatus(exam);
            const published = Boolean(exam.is_visible_to_students);
            const needed = Number(exam.questions_count || 0);
            const ready = Number(exam.actual_questions_count || 0);
            const pct = needed > 0 ? Math.min(100, Math.round((ready / needed) * 100)) : 0;
            return (
              <Box
                key={exam.id}
                borderRadius="2xl"
                overflow="hidden"
                borderWidth="1px"
                borderColor={theme.cardBorder}
                bg={theme.cardBg}
                boxShadow={theme.shadow}
                transition="box-shadow 0.2s, transform 0.2s"
                _hover={{ boxShadow: theme.hoverShadow, transform: "translateY(-1px)" }}
              >
                <Box h="4px" bg={published ? "green.400" : "orange.400"} />
                <Box p={{ base: 4, md: 5 }}>
                  <Flex
                    direction={{ base: "column", lg: "row" }}
                    gap={5}
                    align={{ base: "stretch", lg: "center" }}
                  >
                    <Box flex="1" minW={0}>
                      <HStack spacing={2} mb={2} flexWrap="wrap">
                        <Badge colorScheme={published ? "green" : "orange"} borderRadius="full" px={2.5}>
                          {published ? "منشور" : "مسودة"}
                        </Badge>
                        <Badge colorScheme={availability.colorScheme} borderRadius="full" px={2.5}>
                          {availability.label}
                        </Badge>
                        <Badge colorScheme="cyan" variant="subtle" borderRadius="full" px={2.5}>
                          <HStack spacing={1}>
                            <Icon as={MdSchool} boxSize={3} />
                            <Text>{exam.gradeName || exam.grade_name || `صف ${exam.gradeId}`}</Text>
                          </HStack>
                        </Badge>
                      </HStack>
                      <Text fontWeight="900" color={theme.heading} fontSize={{ base: "md", md: "lg" }} mb={1}>
                        {exam.title}
                      </Text>
                      {exam.description ? (
                        <Text fontSize="sm" color={theme.muted} noOfLines={2} mb={3} lineHeight="1.7">
                          {exam.description}
                        </Text>
                      ) : null}
                      <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={3} mb={3} maxW="lg">
                        <MiniStat label="المدة" value={formatCourseExamDurationLabel(exam)} />
                        <MiniStat
                          label="المحاولات"
                          value={formatAttemptLimitLabel(exam, { isTeacher: true })}
                        />
                        <MiniStat label="التسليمات" value={exam.submissionsCount || 0} />
                        <MiniStat label="الأسئلة" value={`${ready}/${needed || "?"}`} />
                      </SimpleGrid>
                      <Box maxW="320px">
                        <Flex justify="space-between" mb={1}>
                          <Text fontSize="xs" color={theme.muted} fontWeight="700">
                            جاهزية الأسئلة
                          </Text>
                          <Text fontSize="xs" color={pct >= 100 ? "green.500" : "orange.500"} fontWeight="800">
                            {pct}%
                          </Text>
                        </Flex>
                        <Progress
                          value={pct}
                          size="sm"
                          borderRadius="full"
                          colorScheme={pct >= 100 ? "green" : "orange"}
                        />
                      </Box>
                    </Box>

                    <VStack align="stretch" spacing={2} minW={{ lg: "180px" }}>
                      <Button
                        as={RouterLink}
                        to={`/public-exams/${exam.id}`}
                        leftIcon={<FaQuestionCircle />}
                        borderRadius="xl"
                        colorScheme="blue"
                        size="sm"
                      >
                        إدارة الأسئلة
                      </Button>
                      <Button
                        as={RouterLink}
                        to={`/public-exams/${exam.id}/report`}
                        leftIcon={<FaChartBar />}
                        borderRadius="xl"
                        variant="outline"
                        size="sm"
                      >
                        التقرير
                      </Button>
                      <Button
                        leftIcon={published ? <FaEyeSlash /> : <FaEye />}
                        borderRadius="xl"
                        colorScheme={published ? "orange" : "green"}
                        variant="outline"
                        size="sm"
                        isLoading={actionId === exam.id}
                        onClick={() => togglePublish(exam)}
                      >
                        {published ? "إلغاء النشر" : "نشر للطلاب"}
                      </Button>
                      <HStack justify="center" spacing={1}>
                        <IconButton
                          aria-label="تعديل"
                          icon={<FaEdit />}
                          size="sm"
                          borderRadius="lg"
                          variant="ghost"
                          onClick={() => openEdit(exam)}
                        />
                        <IconButton
                          aria-label="حذف"
                          icon={<FaTrash />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          borderRadius="lg"
                          onClick={() => setDeleteTarget(exam)}
                        />
                      </HStack>
                    </VStack>
                  </Flex>
                </Box>
              </Box>
            );
          })}
        </VStack>
      )}

      <Modal
        isOpen={formModal.isOpen}
        onClose={() => !saving && formModal.onClose()}
        size="xl"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent borderRadius="2xl" mx={3} dir="rtl">
          <ModalHeader>{editingExam ? "تعديل امتحان عام" : "إنشاء امتحان عام"}</ModalHeader>
          <ModalCloseButton isDisabled={saving} />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <FormControl isRequired>
                <FormLabel>عنوان الامتحان</FormLabel>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  borderRadius="xl"
                  placeholder="مثال: امتحان مهم على الوحدة الأولى"
                />
              </FormControl>
              <FormControl>
                <FormLabel>الوصف (اختياري)</FormLabel>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  borderRadius="xl"
                  rows={2}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>الصف الدراسي</FormLabel>
                <Select
                  value={form.gradeId}
                  onChange={(e) => setForm((f) => ({ ...f, gradeId: e.target.value }))}
                  borderRadius="xl"
                >
                  <option value="">اختر الصف</option>
                  {grades.map((g) => (
                    <option key={optionId(g)} value={optionId(g)}>
                      {optionLabel(g)}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>عدد الأسئلة</FormLabel>
                <Input
                  type="number"
                  min={1}
                  value={form.questions_count}
                  onChange={(e) => setForm((f) => ({ ...f, questions_count: e.target.value }))}
                  borderRadius="xl"
                />
              </FormControl>
              <QuestionDisplayModeFields
                value={form.question_display_mode}
                onChange={(v) => setForm((f) => ({ ...f, question_display_mode: v }))}
                questionsCount={form.questions_count}
              />
              <FormControl>
                <FormLabel>مدة الامتحان</FormLabel>
                <HStack mb={2}>
                  <Switch
                    colorScheme="blue"
                    isChecked={form.duration_unlimited}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        duration_unlimited: e.target.checked,
                        duration_minutes: e.target.checked
                          ? f.duration_minutes
                          : f.duration_minutes || "45",
                      }))
                    }
                  />
                  <Text fontSize="sm">بدون حد زمني</Text>
                </HStack>
                {!form.duration_unlimited ? (
                  <Input
                    type="number"
                    min={1}
                    value={form.duration_minutes}
                    onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                    borderRadius="xl"
                    placeholder="بالدقائق"
                  />
                ) : null}
              </FormControl>
              <FormControl>
                <FormLabel>حد المحاولات (فارغ = غير محدود)</FormLabel>
                <Input
                  type="number"
                  min={1}
                  value={form.attempt_limit}
                  onChange={(e) => setForm((f) => ({ ...f, attempt_limit: e.target.value }))}
                  borderRadius="xl"
                />
              </FormControl>
              <ExamStudentSettingsFields
                formData={form}
                showField="available_from"
                expireField="visibility_end_date"
                scheduledField="answers_visible_at"
                onPatch={(partial) => setForm((f) => ({ ...f, ...partial }))}
              />
              <HStack>
                <Switch
                  colorScheme="green"
                  isChecked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                <Text fontSize="sm">امتحان نشط</Text>
              </HStack>
              {!editingExam ? (
                <Text fontSize="xs" color={theme.muted}>
                  يُنشأ كمسودة افتراضيًا. انشره بعد إضافة الأسئلة ليظهر للطلاب.
                </Text>
              ) : null}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={2} onClick={formModal.onClose} isDisabled={saving}>
              إلغاء
            </Button>
            <Button colorScheme="blue" onClick={submitForm} isLoading={saving} borderRadius="xl">
              {editingExam ? "حفظ التعديلات" : "إنشاء"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={Boolean(deleteTarget)}
        leastDestructiveRef={deleteCancelRef}
        onClose={() => !deleting && setDeleteTarget(null)}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="2xl" mx={3} dir="rtl">
            <AlertDialogHeader>حذف الامتحان</AlertDialogHeader>
            <AlertDialogBody lineHeight="1.9">
              هل تريد حذف «{deleteTarget?.title}» نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={deleteCancelRef}
                onClick={() => setDeleteTarget(null)}
                isDisabled={deleting}
                borderRadius="xl"
              >
                إلغاء
              </Button>
              <Button
                colorScheme="red"
                mr={3}
                onClick={confirmDelete}
                isLoading={deleting}
                borderRadius="xl"
              >
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </DailyQuizPageShell>
  );
}

function Kpi({ label, value, color, hint }) {
  const theme = useDailyQuizTheme();
  return (
    <DailyQuizSurface p={4}>
      <Text fontSize="xs" color={theme.muted} fontWeight="700">
        {label}
      </Text>
      <Text fontSize="2xl" fontWeight="900" color={color || theme.heading} lineHeight="1.2">
        {value ?? 0}
      </Text>
      {hint ? (
        <Text fontSize="10px" color={theme.muted} mt={0.5}>
          {hint}
        </Text>
      ) : null}
    </DailyQuizSurface>
  );
}

function MiniStat({ label, value }) {
  const theme = useDailyQuizTheme();
  return (
    <Box>
      <Text fontSize="10px" color={theme.muted} fontWeight="700" mb={0.5}>
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="800" color={theme.heading} noOfLines={1}>
        {value}
      </Text>
    </Box>
  );
}
