import React, { useMemo, useCallback, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  SimpleGrid,
  useBreakpointValue,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  FormControl,
  FormLabel,
  Button,
  VStack,
  Select,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Icon,
  Text,
  Center,
} from "@chakra-ui/react";
import {
  FaBookOpen,
  FaGraduationCap,
  FaQuestionCircle,
  FaPlus,
  FaFileAlt,
  FaBook,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import {
  createTeacherLibraryLesson,
  deleteTeacherLibraryLesson,
  teacherLibraryApiError,
  updateTeacherLibraryLesson,
} from "../../api/teacherQuestionLibraryApi";
import {
  useInvalidateTeacherQuestionBank,
  useTeacherLibraryGrades,
  useTeacherLibraryLessons,
} from "../../Hooks/teacher/useTeacherQuestionBankQueries";
import {
  LibraryPageShell,
  LibraryHero,
  LibraryStatGrid,
  LibraryStatCard,
  LibrarySectionHeader,
  LibraryEntityCard,
  LibraryEmptyState,
  LibraryLoadingState,
  LibraryFilterPanel,
  libraryModalProps,
  libraryModalContentProps,
  libraryCardAccent,
} from "./components/QuestionLibraryShell";

const QuestionLibraryGradePage = () => {
  const { gradeId } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const cancelRef = useRef(null);
  const invalidateQb = useInvalidateTeacherQuestionBank();
  const lessonCols = useBreakpointValue({ base: 1, md: 2, lg: 3 });
  const filterInputBg = useColorModeValue("gray.50", "gray.800");
  const muted = useColorModeValue("gray.500", "gray.400");

  const { data: grades = [] } = useTeacherLibraryGrades();
  const currentGrade = useMemo(
    () => grades.find((g) => String(g.id) === String(gradeId)) || null,
    [grades, gradeId],
  );

  const {
    data: lessons = [],
    isLoading: loading,
    isFetching,
    refetch: refetchLessons,
  } = useTeacherLibraryLessons(gradeId, { enabled: !!gradeId });

  const [lessonTitle, setLessonTitle] = useState("");
  const [moveGradeId, setMoveGradeId] = useState("");
  const [editingLesson, setEditingLesson] = useState(null);
  const [deletingLesson, setDeletingLesson] = useState(null);
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [isDeletingLesson, setIsDeletingLesson] = useState(false);
  const [lessonSearch, setLessonSearch] = useState("");

  const { isOpen: isLessonModalOpen, onOpen: onLessonModalOpen, onClose: onLessonModalClose } =
    useDisclosure();
  const { isOpen: isDeleteLessonOpen, onOpen: onDeleteLessonOpen, onClose: onDeleteLessonClose } =
    useDisclosure();

  const fetchLessons = useCallback(async () => {
    await Promise.all([
      invalidateQb.invalidateLibraryLessons(gradeId),
      invalidateQb.invalidateLibraryGrades(),
      invalidateQb.invalidateAllLibraryLessons(),
    ]);
    return refetchLessons();
  }, [gradeId, invalidateQb, refetchLessons]);

  const totalQuestions = useMemo(
    () => lessons.reduce((sum, l) => sum + (l.questions_count || 0), 0),
    [lessons],
  );

  const gradeTitle = currentGrade?.title || lessons[0]?.grade_title || "الصف";

  const filteredLessons = useMemo(() => {
    const term = lessonSearch.trim().toLowerCase();
    if (!term) return lessons;
    return lessons.filter((lesson) => {
      const title = String(lesson.title || "").toLowerCase();
      const questions = String(lesson.questions_count ?? "");
      return title.includes(term) || questions.includes(term);
    });
  }, [lessons, lessonSearch]);

  const openLesson = (lesson) => {
    navigate(`/QuestionLibraryPage/grade/${gradeId}/lesson/${lesson.id}`);
  };

  const backToGrades = () => {
    navigate("/QuestionLibraryPage");
  };

  const openCreateLesson = () => {
    setEditingLesson(null);
    setLessonTitle("");
    setMoveGradeId(gradeId || "");
    onLessonModalOpen();
  };

  const openEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setLessonTitle(lesson.title);
    setMoveGradeId(String(lesson.grade_id || gradeId || ""));
    onLessonModalOpen();
  };

  const saveLesson = async () => {
    if (!lessonTitle.trim()) return;
    setIsSavingLesson(true);
    try {
      if (editingLesson) {
        const payload = { title: lessonTitle.trim() };
        if (moveGradeId && String(moveGradeId) !== String(editingLesson.grade_id)) {
          payload.grade_id = Number(moveGradeId);
        }
        await updateTeacherLibraryLesson(editingLesson.id, payload);
        toast({ title: "تم التحديث", description: "تم تعديل الدرس", status: "success", duration: 2000, isClosable: true });
      } else {
        await createTeacherLibraryLesson({ grade_id: Number(gradeId), title: lessonTitle.trim() });
        toast({ title: "تم الإنشاء", description: "تم إنشاء الدرس", status: "success", duration: 2000, isClosable: true });
      }
      onLessonModalClose();
      fetchLessons();
    } catch (err) {
      toast({
        title: "خطأ",
        description: teacherLibraryApiError(err, "فشل في حفظ الدرس"),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSavingLesson(false);
    }
  };

  const confirmDeleteLesson = (lesson) => {
    setDeletingLesson(lesson);
    onDeleteLessonOpen();
  };

  const deleteLesson = async () => {
    if (!deletingLesson) return;
    setIsDeletingLesson(true);
    try {
      await deleteTeacherLibraryLesson(deletingLesson.id);
      toast({ title: "تم الحذف", description: "تم حذف الدرس وجميع محتوياته", status: "success", duration: 2000, isClosable: true });
      onDeleteLessonClose();
      fetchLessons();
    } catch (err) {
      toast({
        title: "خطأ",
        description: teacherLibraryApiError(err, "فشل في حذف الدرس"),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeletingLesson(false);
    }
  };

  return (
    <LibraryPageShell>
      <LibraryHero
        title={gradeTitle}
        subtitle="أنشئ دروساً داخل هذا الصف وأضف الأسئلة وقطع القراءة لكل درس"
        icon={FaBookOpen}
        accent="blend"
        onBack={backToGrades}
        onRefresh={fetchLessons}
        isRefreshing={isFetching}
        breadcrumbs={[
          { label: "مكتبة الأسئلة", onClick: backToGrades },
          { label: gradeTitle },
        ]}
      />

      <LibraryStatGrid>
        <LibraryStatCard label="الدروس" value={lessons.length} icon={FaGraduationCap} accent="blue" />
        <LibraryStatCard label="إجمالي الأسئلة" value={totalQuestions} icon={FaQuestionCircle} accent="orange" />
        <LibraryStatCard
          label="متوسط الأسئلة"
          value={lessons.length ? Math.round(totalQuestions / lessons.length) : 0}
          sub="لكل درس"
          icon={FaFileAlt}
          accent="blue"
        />
      </LibraryStatGrid>

      <LibrarySectionHeader
        title="دروس الصف"
        description={
          lessonSearch.trim()
            ? `${filteredLessons.length} من ${lessons.length} درس`
            : "كل درس يحتوي أسئلة مستقلة وقطع قراءة"
        }
        actionLabel="درس جديد"
        actionIcon={FaPlus}
        onAction={openCreateLesson}
      />

      {loading ? (
        <LibraryLoadingState />
      ) : lessons.length === 0 ? (
        <LibraryEmptyState
          icon={FaBook}
          title="لا توجد دروس بعد"
          description="أنشئ أول درس في هذا الصف ثم أضف الأسئلة يدوياً أو عبر استخراج OCR من ملف PDF أو صورة."
          actionLabel="إنشاء أول درس"
          onAction={openCreateLesson}
        />
      ) : (
        <>
          <LibraryFilterPanel hint="ابحث باسم الدرس أو بعدد الأسئلة">
            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none">
                <Icon as={FaSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                value={lessonSearch}
                onChange={(e) => setLessonSearch(e.target.value)}
                placeholder="ابحث عن درس..."
                borderRadius="xl"
                bg={filterInputBg}
                border="none"
                dir="rtl"
              />
              {lessonSearch ? (
                <InputRightElement>
                  <IconButton
                    aria-label="مسح البحث"
                    icon={<FaTimes />}
                    size="sm"
                    variant="ghost"
                    onClick={() => setLessonSearch("")}
                  />
                </InputRightElement>
              ) : null}
            </InputGroup>
          </LibraryFilterPanel>

          {filteredLessons.length === 0 ? (
            <Center py={12} px={4}>
              <VStack spacing={2}>
                <Text color={muted} fontSize="sm">
                  لا توجد دروس مطابقة لـ «{lessonSearch.trim()}»
                </Text>
                <Button size="sm" variant="link" colorScheme="blue" onClick={() => setLessonSearch("")}>
                  مسح البحث
                </Button>
              </VStack>
            </Center>
          ) : (
            <SimpleGrid columns={lessonCols} spacing={{ base: 4, md: 5 }}>
              {filteredLessons.map((lesson, index) => (
                <LibraryEntityCard
                  key={lesson.id}
                  title={lesson.title}
                  icon={FaBook}
                  accentColor={libraryCardAccent(index)}
                  badges={[{ label: `${lesson.questions_count || 0} سؤال`, scheme: "blue" }]}
                  meta={lesson.created_at ? `أُنشئ ${new Date(lesson.created_at).toLocaleDateString("ar-EG")}` : undefined}
                  openLabel="فتح الدرس"
                  onOpen={() => openLesson(lesson)}
                  onEdit={() => openEditLesson(lesson)}
                  onDelete={() => confirmDeleteLesson(lesson)}
                />
              ))}
            </SimpleGrid>
          )}
        </>
      )}

      <Modal isOpen={isLessonModalOpen} onClose={onLessonModalClose} {...libraryModalProps}>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent {...libraryModalContentProps()}>
          <ModalHeader fontSize="lg" fontWeight="bold" pb={2}>
            {editingLesson ? "تعديل الدرس" : "درس جديد"}
          </ModalHeader>
          <ModalCloseButton borderRadius="full" />
          <ModalBody pt={2}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="semibold">عنوان الدرس</FormLabel>
                <Input
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="مثال: الدرس الأول — الكهرباء"
                  borderRadius="xl"
                  size="lg"
                  dir="rtl"
                />
              </FormControl>
              {editingLesson && grades.length > 1 ? (
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">نقل إلى صف آخر</FormLabel>
                  <Select value={moveGradeId} onChange={(e) => setMoveGradeId(e.target.value)} borderRadius="xl" size="lg">
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </Select>
                </FormControl>
              ) : null}
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" borderRadius="xl" onClick={onLessonModalClose}>إلغاء</Button>
            <Button colorScheme="blue" borderRadius="xl" onClick={saveLesson} isLoading={isSavingLesson} isDisabled={!lessonTitle.trim()}>
              حفظ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog isOpen={isDeleteLessonOpen} onClose={onDeleteLessonClose} leastDestructiveRef={cancelRef}>
        <AlertDialogOverlay backdropFilter="blur(4px)" />
        <AlertDialogContent borderRadius="2xl" mx={4}>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">حذف الدرس</AlertDialogHeader>
          <AlertDialogBody fontSize="sm" lineHeight="1.7">
            حذف «{deletingLesson?.title}» سيحذف كل الأسئلة وقطع القراءة التابعة له. لا يمكن التراجع.
          </AlertDialogBody>
          <AlertDialogFooter gap={2}>
            <Button ref={cancelRef} borderRadius="xl" onClick={onDeleteLessonClose}>إلغاء</Button>
            <Button colorScheme="red" borderRadius="xl" onClick={deleteLesson} isLoading={isDeletingLesson}>حذف</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LibraryPageShell>
  );
};

export default QuestionLibraryGradePage;
