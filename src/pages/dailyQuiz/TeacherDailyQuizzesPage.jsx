import { useCallback, useEffect, useRef, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Center,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Skeleton,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  FaCalendarAlt,
  FaChartBar,
  FaClock,
  FaEdit,
  FaFire,
  FaPlus,
  FaQuestionCircle,
  FaRocket,
  FaSync,
  FaTrash,
} from "react-icons/fa";
import {
  apiErrorMessage,
  createDailyQuiz,
  defaultQuizForm,
  deleteDailyQuiz,
  fetchTeacherDailyQuizzes,
  fetchTeacherGrades,
  formatDateTime,
  formatDuration,
  publishDailyQuiz,
  QUIZ_STATUS_LABELS,
  validateQuizForm,
} from "../../api/dailyQuizApi";
import DailyQuizFormFields from "./DailyQuizFormFields";
import {
  DailyQuizHero,
  DailyQuizMetaChip,
  DailyQuizPageShell,
  DailyQuizSurface,
  useDailyQuizTheme,
} from "./DailyQuizChrome";

function QuizCard({ quiz, busy, onPublish, onDelete }) {
  const theme = useDailyQuizTheme();
  const metaBg = theme.softBg;

  return (
    <Box
      bg={theme.cardBg}
      borderWidth="1px"
      borderColor={theme.cardBorder}
      borderRadius="2xl"
      overflow="hidden"
      h="full"
      display="flex"
      flexDirection="column"
      transition="transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease"
      boxShadow={theme.shadow}
      _hover={{
        transform: "translateY(-4px)",
        boxShadow: theme.hoverShadow,
        borderColor: "blue.200",
      }}
    >
      <Box
        h="4px"
        bgGradient={
          quiz.status === "published"
            ? "linear(to-l, blue.500, orange.500)"
            : quiz.status === "draft"
              ? "linear(to-l, gray.300, gray.400)"
              : "linear(to-l, orange.400, orange.500)"
        }
      />

      <Box px={4} pt={4} pb={3} flex="1" display="flex" flexDirection="column">
        <HStack justify="space-between" align="start" mb={3}>
          <DailyQuizMetaChip
            colorScheme={
              quiz.status === "published" ? "blue" : quiz.status === "archived" ? "orange" : "gray"
            }
          >
            {QUIZ_STATUS_LABELS[quiz.status] || quiz.status}
          </DailyQuizMetaChip>
          <DailyQuizMetaChip colorScheme="orange">
            {quiz.grade_name || `صف #${quiz.grade_id}`}
          </DailyQuizMetaChip>
        </HStack>

        <Heading size="sm" color={theme.heading} noOfLines={2} mb={3} lineHeight="1.5" letterSpacing="-0.01em">
          {quiz.title}
        </Heading>

        <SimpleGrid columns={2} spacing={2} mb={3}>
          <Flex align="center" gap={2} bg={metaBg} borderRadius="xl" px={2.5} py={2}>
            <Icon as={FaQuestionCircle} color="orange.500" boxSize={3} />
            <Text fontSize="xs" color={theme.muted} fontWeight="600">
              {quiz.questions_count || 0} سؤال
            </Text>
          </Flex>
          <Flex align="center" gap={2} bg={metaBg} borderRadius="xl" px={2.5} py={2}>
            <Icon as={FaClock} color="blue.500" boxSize={3} />
            <Text fontSize="xs" color={theme.muted} fontWeight="600">
              {formatDuration(quiz.duration_seconds)}
            </Text>
          </Flex>
        </SimpleGrid>

        <VStack align="stretch" spacing={1.5} mb={4} mt="auto">
          <HStack spacing={2} color={theme.muted} fontSize="xs">
            <Icon as={FaCalendarAlt} boxSize={3} />
            <Text>تبدأ: {formatDateTime(quiz.starts_at)}</Text>
          </HStack>
          <HStack spacing={2} color={theme.muted} fontSize="xs">
            <Icon as={FaCalendarAlt} boxSize={3} />
            <Text>تنتهي: {formatDateTime(quiz.ends_at)}</Text>
          </HStack>
        </VStack>

        <HStack spacing={2}>
          <Button
            as={RouterLink}
            to={`/teacher-daily-quizzes/${quiz.id}`}
            size="sm"
            flex={1}
            bg="blue.500"
            color="white"
            borderRadius="xl"
            fontWeight="700"
            leftIcon={<FaEdit />}
            _hover={{ bg: "blue.600" }}
          >
            إدارة
          </Button>
          {quiz.status === "draft" ? (
            <IconButton
              aria-label="نشر"
              icon={<FaRocket />}
              size="sm"
              borderRadius="xl"
              colorScheme="orange"
              variant="outline"
              isDisabled={busy}
              onClick={() => onPublish(quiz)}
            />
          ) : (
            <IconButton
              as={RouterLink}
              to={`/teacher-daily-quizzes/${quiz.id}?tab=stats`}
              aria-label="إحصائيات"
              icon={<FaChartBar />}
              size="sm"
              borderRadius="xl"
              colorScheme="blue"
              variant="outline"
            />
          )}
          <IconButton
            aria-label="حذف"
            icon={<FaTrash />}
            size="sm"
            borderRadius="xl"
            colorScheme="red"
            variant="ghost"
            onClick={() => onDelete(quiz)}
          />
        </HStack>
      </Box>
    </Box>
  );
}

export default function TeacherDailyQuizzesPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const cancelRef = useRef();
  const createModal = useDisclosure();
  const deleteDialog = useDisclosure();
  const theme = useDailyQuizTheme();

  const [grades, setGrades] = useState([]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [form, setForm] = useState(() => defaultQuizForm());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const loadGrades = useCallback(async () => {
    try {
      const list = await fetchTeacherGrades();
      setGrades(Array.isArray(list) ? list : []);
    } catch {
      setGrades([]);
    }
  }, []);

  const loadQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTeacherDailyQuizzes({
        page,
        limit: 12,
        status: statusFilter || undefined,
        grade_id: gradeFilter || undefined,
      });
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل تحميل المسابقات"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, gradeFilter, toast]);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const openCreate = () => {
    setForm(defaultQuizForm(gradeFilter || grades[0]?.id || ""));
    setShowAdvanced(false);
    createModal.onOpen();
  };

  const handleCreate = async () => {
    const error = validateQuizForm(form);
    if (error) {
      toast({ title: error, status: "warning", isClosable: true });
      return;
    }
    setBusy(true);
    try {
      const quiz = await createDailyQuiz(form);
      toast({ title: "تم إنشاء المسابقة كمسودة", status: "success", isClosable: true });
      createModal.onClose();
      navigate(`/teacher-daily-quizzes/${quiz.id}`);
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل إنشاء المسابقة"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async (quiz) => {
    setBusy(true);
    try {
      await publishDailyQuiz(quiz.id);
      toast({ title: "تم نشر المسابقة", status: "success", isClosable: true });
      loadQuizzes();
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل النشر — تأكد من وجود أسئلة"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      await deleteDailyQuiz(toDelete.id);
      toast({ title: "تم حذف المسابقة", status: "success", isClosable: true });
      deleteDialog.onClose();
      setToDelete(null);
      loadQuizzes();
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل الحذف"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setBusy(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / 12));

  return (
    <DailyQuizPageShell>
      <DailyQuizHero
        icon={FaFire}
        eyebrow="Daily Quiz"
        title="المسابقات اليومية"
        subtitle="أنشئ مسابقة بوقت محدد وأسئلة وترتيب ومكافآت سرعة، ثم انشرها لطلاب صفك في ثوانٍ."
        actions={
          <>
            <Button
              leftIcon={<FaSync />}
              variant="outline"
              borderColor="whiteAlpha.400"
              color="white"
              borderRadius="xl"
              _hover={{ bg: "whiteAlpha.200" }}
              onClick={loadQuizzes}
              isLoading={loading}
            >
              تحديث
            </Button>
            <Button
              leftIcon={<FaPlus />}
              bg="white"
              color="orange.500"
              borderRadius="xl"
              fontWeight="800"
              _hover={{ bg: "whiteAlpha.900", color: "orange.600" }}
              onClick={openCreate}
            >
              مسابقة جديدة
            </Button>
          </>
        }
      />

      <DailyQuizSurface mb={5} p={3}>
        <Flex gap={3} flexWrap="wrap" align="center">
          <Select
            maxW="200px"
            bg={theme.filterBg}
            borderRadius="xl"
            borderColor={theme.cardBorder}
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
          >
            <option value="">كل الحالات</option>
            <option value="draft">مسودة</option>
            <option value="published">منشورة</option>
            <option value="archived">مؤرشفة</option>
          </Select>
          <Select
            maxW="220px"
            bg={theme.filterBg}
            borderRadius="xl"
            borderColor={theme.cardBorder}
            value={gradeFilter}
            onChange={(e) => {
              setPage(1);
              setGradeFilter(e.target.value);
            }}
          >
            <option value="">كل الصفوف</option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
          <Box
            ms="auto"
            px={3}
            py={1.5}
            borderRadius="full"
            bg={theme.softBg}
            fontSize="sm"
            fontWeight="700"
            color={theme.muted}
          >
            {total} مسابقة
          </Box>
        </Flex>
      </DailyQuizSurface>

      {loading ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} h="250px" borderRadius="2xl" />
          ))}
        </SimpleGrid>
      ) : items.length === 0 ? (
        <DailyQuizSurface py={16}>
          <Center>
            <VStack spacing={4}>
              <Flex
                w={16}
                h={16}
                borderRadius="2xl"
                bg={theme.accentSoft}
                align="center"
                justify="center"
              >
                <Icon as={FaFire} boxSize={7} color="orange.500" />
              </Flex>
              <Heading size="sm" color={theme.heading}>
                لا توجد مسابقات بعد
              </Heading>
              <Text fontSize="sm" color={theme.muted} textAlign="center" maxW="sm">
                ابدأ بإنشاء أول مسابقة يومية لطلابك — مسودة أولاً، ثم أضف الأسئلة وانشر.
              </Text>
              <Button
                colorScheme="orange"
                borderRadius="xl"
                leftIcon={<FaPlus />}
                onClick={openCreate}
              >
                إنشاء مسابقة
              </Button>
            </VStack>
          </Center>
        </DailyQuizSurface>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {items.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              busy={busy}
              onPublish={handlePublish}
              onDelete={(q) => {
                setToDelete(q);
                deleteDialog.onOpen();
              }}
            />
          ))}
        </SimpleGrid>
      )}

      {totalPages > 1 ? (
        <HStack justify="center" mt={8} spacing={3}>
          <Button
            size="sm"
            borderRadius="xl"
            variant="outline"
            isDisabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            السابق
          </Button>
          <Text fontSize="sm" color={theme.muted} fontWeight="600">
            صفحة {page} من {totalPages}
          </Text>
          <Button
            size="sm"
            borderRadius="xl"
            variant="outline"
            isDisabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            التالي
          </Button>
        </HStack>
      ) : null}

      <Modal isOpen={createModal.isOpen} onClose={createModal.onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(4px)" />
        <ModalContent dir="rtl" borderRadius="2xl" mx={3}>
          <ModalHeader borderBottomWidth="1px" borderColor={theme.cardBorder}>
            <HStack spacing={3}>
              <Flex w={9} h={9} borderRadius="lg" bg="blue.50" align="center" justify="center">
                <Icon as={FaPlus} color="blue.500" />
              </Flex>
              <Text>إنشاء مسابقة يومية</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={5}>
            <DailyQuizFormFields
              form={form}
              setForm={setForm}
              grades={grades}
              showAdvanced={showAdvanced}
            />
            <Button
              mt={4}
              size="sm"
              variant="link"
              colorScheme="orange"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? "إخفاء الإعدادات المتقدمة" : "إظهار الإعدادات المتقدمة"}
            </Button>
          </ModalBody>
          <ModalFooter gap={2} borderTopWidth="1px" borderColor={theme.cardBorder}>
            <Button variant="ghost" borderRadius="xl" onClick={createModal.onClose}>
              إلغاء
            </Button>
            <Button
              colorScheme="orange"
              borderRadius="xl"
              onClick={handleCreate}
              isLoading={busy}
            >
              إنشاء ومتابعة للأسئلة
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={deleteDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={deleteDialog.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent dir="rtl" borderRadius="2xl" mx={3}>
            <AlertDialogHeader>حذف المسابقة؟</AlertDialogHeader>
            <AlertDialogBody>
              سيتم حذف «{toDelete?.title}» نهائيًا مع أسئلتها ونتائجها إن وجدت.
            </AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelRef} borderRadius="xl" onClick={deleteDialog.onClose}>
                إلغاء
              </Button>
              <Button colorScheme="red" borderRadius="xl" onClick={confirmDelete} isLoading={busy}>
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </DailyQuizPageShell>
  );
}
