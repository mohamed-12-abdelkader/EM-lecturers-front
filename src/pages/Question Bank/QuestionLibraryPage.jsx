import React, { useMemo, useCallback, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  SimpleGrid,
  useBreakpointValue,
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
} from "@chakra-ui/react";
import {
  FaBookOpen,
  FaGraduationCap,
  FaQuestionCircle,
  FaPlus,
  FaLayerGroup,
} from "react-icons/fa";
import {
  createTeacherLibraryGrade,
  deleteTeacherLibraryGrade,
  teacherLibraryApiError,
  updateTeacherLibraryGrade,
} from "../../api/teacherQuestionLibraryApi";
import { fetchTeacherGrades } from "../../api/teacherManagedStudentsApi";
import {
  useInvalidateTeacherQuestionBank,
  useTeacherLibraryGrades,
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
  libraryModalProps,
  libraryModalContentProps,
  libraryCardAccent,
} from "./components/QuestionLibraryShell";

const QuestionLibraryPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const cancelRef = useRef(null);
  const invalidateQb = useInvalidateTeacherQuestionBank();
  const gradeCols = useBreakpointValue({ base: 1, md: 2, lg: 3 });

  const {
    data: grades = [],
    isLoading: loading,
    isFetching,
    refetch: refetchGrades,
  } = useTeacherLibraryGrades();

  const [platformGrades, setPlatformGrades] = useState([]);
  const [gradeTitle, setGradeTitle] = useState("");
  const [platformGradeId, setPlatformGradeId] = useState("");
  const [editingGrade, setEditingGrade] = useState(null);
  const [deletingGrade, setDeletingGrade] = useState(null);
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [isDeletingGrade, setIsDeletingGrade] = useState(false);

  const { isOpen: isGradeModalOpen, onOpen: onGradeModalOpen, onClose: onGradeModalClose } =
    useDisclosure();
  const { isOpen: isDeleteGradeOpen, onOpen: onDeleteGradeOpen, onClose: onDeleteGradeClose } =
    useDisclosure();

  useEffect(() => {
    fetchTeacherGrades()
      .then(setPlatformGrades)
      .catch(() => setPlatformGrades([]));
  }, []);

  const fetchGrades = useCallback(async () => {
    await invalidateQb.invalidateLibraryGrades();
    return refetchGrades();
  }, [invalidateQb, refetchGrades]);

  const totalLessons = useMemo(
    () => grades.reduce((sum, g) => sum + (g.lessons_count || 0), 0),
    [grades],
  );

  const totalQuestions = useMemo(
    () => grades.reduce((sum, g) => sum + (g.questions_count || 0), 0),
    [grades],
  );

  const openGrade = (grade) => {
    navigate(`/QuestionLibraryPage/grade/${grade.id}`);
  };

  const openCreateGrade = () => {
    setEditingGrade(null);
    setGradeTitle("");
    setPlatformGradeId("");
    onGradeModalOpen();
  };

  const openEditGrade = (grade) => {
    setEditingGrade(grade);
    setGradeTitle(grade.title);
    setPlatformGradeId(grade.platform_grade_id ? String(grade.platform_grade_id) : "");
    onGradeModalOpen();
  };

  const saveGrade = async () => {
    if (!gradeTitle.trim()) return;
    setIsSavingGrade(true);
    const payload = {
      title: gradeTitle.trim(),
      platform_grade_id: platformGradeId ? Number(platformGradeId) : null,
    };

    try {
      if (editingGrade) {
        await updateTeacherLibraryGrade(editingGrade.id, payload);
        toast({ title: "تم التحديث", description: "تم تعديل الصف الدراسي", status: "success", duration: 2000, isClosable: true });
      } else {
        await createTeacherLibraryGrade(payload);
        toast({ title: "تم الإنشاء", description: "تم إنشاء الصف الدراسي", status: "success", duration: 2000, isClosable: true });
      }
      onGradeModalClose();
      fetchGrades();
    } catch (err) {
      toast({
        title: "خطأ",
        description: teacherLibraryApiError(err, "فشل في حفظ الصف"),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSavingGrade(false);
    }
  };

  const confirmDeleteGrade = (grade) => {
    setDeletingGrade(grade);
    onDeleteGradeOpen();
  };

  const deleteGrade = async () => {
    if (!deletingGrade) return;
    setIsDeletingGrade(true);
    try {
      await deleteTeacherLibraryGrade(deletingGrade.id);
      toast({ title: "تم الحذف", description: "تم حذف الصف وجميع دروسه وأسئلته", status: "success", duration: 2000, isClosable: true });
      onDeleteGradeClose();
      fetchGrades();
    } catch (err) {
      toast({
        title: "خطأ",
        description: teacherLibraryApiError(err, "فشل في حذف الصف"),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeletingGrade(false);
    }
  };

  return (
    <LibraryPageShell>
      <LibraryHero
        title="مكتبة الأسئلة"
        subtitle="نظّم أسئلتك في صفوف دراسية ودروس — أضف أسئلة مستقلة أو قطع قراءة واستخدمها في الامتحانات"
        icon={FaBookOpen}
        accent="blue"
        onRefresh={fetchGrades}
        isRefreshing={isFetching}
        breadcrumbs={[{ label: "مكتبة الأسئلة" }]}
      />

      <LibraryStatGrid>
        <LibraryStatCard label="الصفوف الدراسية" value={grades.length} icon={FaGraduationCap} accent="blue" />
        <LibraryStatCard label="إجمالي الدروس" value={totalLessons} icon={FaLayerGroup} accent="orange" />
        <LibraryStatCard label="إجمالي الأسئلة" value={totalQuestions} icon={FaQuestionCircle} accent="blue" />
      </LibraryStatGrid>

      <LibrarySectionHeader
        title="الصفوف الدراسية"
        description="اختر صفاً لإدارة دروسه وأسئلته"
        actionLabel="صف جديد"
        actionIcon={FaPlus}
        onAction={openCreateGrade}
      />

      {loading ? (
        <LibraryLoadingState />
      ) : grades.length === 0 ? (
        <LibraryEmptyState
          icon={FaGraduationCap}
          title="ابدأ بإنشاء صف دراسي"
          description="أنشئ صفاً (مثل: الأول الثانوي) ثم أضف الدروس والأسئلة بداخله. يمكنك ربط الصف بصف المنصة اختيارياً."
          actionLabel="إنشاء أول صف"
          onAction={openCreateGrade}
        />
      ) : (
        <SimpleGrid columns={gradeCols} spacing={{ base: 4, md: 5 }}>
          {grades.map((grade, index) => (
            <LibraryEntityCard
              key={grade.id}
              title={grade.title}
              subtitle={grade.platform_grade_name ? `مرتبط: ${grade.platform_grade_name}` : undefined}
              icon={FaGraduationCap}
              accentColor={libraryCardAccent(index)}
              badges={[
                { label: `${grade.lessons_count || 0} درس`, scheme: "orange" },
                { label: `${grade.questions_count || 0} سؤال`, scheme: "blue" },
              ]}
              openLabel="فتح الدروس"
              onOpen={() => openGrade(grade)}
              onEdit={() => openEditGrade(grade)}
              onDelete={() => confirmDeleteGrade(grade)}
            />
          ))}
        </SimpleGrid>
      )}

      <Modal isOpen={isGradeModalOpen} onClose={onGradeModalClose} {...libraryModalProps}>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent {...libraryModalContentProps()}>
          <ModalHeader fontSize="lg" fontWeight="bold" pb={2}>
            {editingGrade ? "تعديل الصف" : "صف دراسي جديد"}
          </ModalHeader>
          <ModalCloseButton borderRadius="full" />
          <ModalBody pt={2}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="semibold">اسم الصف</FormLabel>
                <Input
                  value={gradeTitle}
                  onChange={(e) => setGradeTitle(e.target.value)}
                  placeholder="مثال: الصف الأول الثانوي"
                  borderRadius="xl"
                  size="lg"
                  dir="rtl"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">ربط بصف المنصة (اختياري)</FormLabel>
                <Select
                  value={platformGradeId}
                  onChange={(e) => setPlatformGradeId(e.target.value)}
                  placeholder="بدون ربط"
                  borderRadius="xl"
                  size="lg"
                >
                  {platformGrades.map((pg) => (
                    <option key={pg.id} value={pg.id}>
                      {pg.name || pg.title || `صف ${pg.id}`}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" borderRadius="xl" onClick={onGradeModalClose}>إلغاء</Button>
            <Button colorScheme="blue" borderRadius="xl" onClick={saveGrade} isLoading={isSavingGrade} isDisabled={!gradeTitle.trim()}>
              حفظ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog isOpen={isDeleteGradeOpen} onClose={onDeleteGradeClose} leastDestructiveRef={cancelRef}>
        <AlertDialogOverlay backdropFilter="blur(4px)" />
        <AlertDialogContent borderRadius="2xl" mx={4}>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">حذف الصف</AlertDialogHeader>
          <AlertDialogBody fontSize="sm" lineHeight="1.7">
            حذف «{deletingGrade?.title}» سيحذف كل الدروس والأسئلة وقطع القراءة التابعة له. لا يمكن التراجع.
          </AlertDialogBody>
          <AlertDialogFooter gap={2}>
            <Button ref={cancelRef} borderRadius="xl" onClick={onDeleteGradeClose}>إلغاء</Button>
            <Button colorScheme="red" borderRadius="xl" onClick={deleteGrade} isLoading={isDeletingGrade}>حذف</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LibraryPageShell>
  );
};

export default QuestionLibraryPage;
