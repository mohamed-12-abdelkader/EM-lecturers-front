import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Alert,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertIcon,
  Box,
  Button,
  Center,
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
  Progress,
  Select,
  SimpleGrid,
  Skeleton,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  FaArrowRight,
  FaChartBar,
  FaDownload,
  FaEdit,
  FaFire,
  FaPlus,
  FaQuestion,
  FaRocket,
  FaSave,
  FaTrash,
} from "react-icons/fa";
import {
  addDailyQuizQuestion,
  apiErrorMessage,
  deleteDailyQuiz,
  deleteDailyQuizQuestion,
  downloadDailyQuizCsv,
  emptyQuestionForm,
  fetchDailyQuizStats,
  fetchTeacherDailyQuiz,
  fetchTeacherGrades,
  formatDateTime,
  formatDuration,
  publishDailyQuiz,
  questionToForm,
  QUIZ_STATUS_LABELS,
  quizToForm,
  updateDailyQuiz,
  updateDailyQuizQuestion,
  validateQuestionForm,
  validateQuizForm,
} from "../../api/dailyQuizApi";
import DailyQuizFormFields from "./DailyQuizFormFields";
import {
  DailyQuizHero,
  DailyQuizMetaChip,
  DailyQuizPageShell,
  DailyQuizStatusBadge,
  DailyQuizSurface,
  useDailyQuizTheme,
} from "./DailyQuizChrome";

const OPTION_KEYS = [
  { key: "A", text: "option_a", label: "أ" },
  { key: "B", text: "option_b", label: "ب" },
  { key: "C", text: "option_c", label: "ج" },
  { key: "D", text: "option_d", label: "د" },
];

function QuestionFormFields({ form, setForm }) {
  const theme = useDailyQuizTheme();
  const patch = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const inputProps = {
    borderRadius: "xl",
    borderColor: theme.cardBorder,
    bg: theme.filterBg,
    _focus: { borderColor: "orange.400", boxShadow: "0 0 0 1px var(--chakra-colors-orange-400)" },
  };

  return (
    <VStack spacing={4} align="stretch">
      <FormControl isRequired>
        <FormLabel fontSize="sm" fontWeight="700" color={theme.heading}>
          نص السؤال
        </FormLabel>
        <Textarea
          {...inputProps}
          value={form.question_text}
          onChange={(e) => patch("question_text", e.target.value)}
          rows={3}
          placeholder="اكتب نص السؤال…"
        />
      </FormControl>
      <FormControl>
        <FormLabel fontSize="sm" fontWeight="700" color={theme.heading}>
          رابط صورة السؤال (اختياري)
        </FormLabel>
        <Input
          {...inputProps}
          dir="ltr"
          value={form.question_image_url}
          onChange={(e) => patch("question_image_url", e.target.value)}
          placeholder="https://..."
        />
      </FormControl>

      <Box>
        <Text fontSize="sm" fontWeight="700" color={theme.heading} mb={2}>
          الاختيارات
        </Text>
        <VStack spacing={2} align="stretch">
          {OPTION_KEYS.map(({ key, text, label }) => {
            const isCorrect = form.correct_answer === key;
            return (
              <Box
                key={key}
                borderWidth="1px"
                borderColor={isCorrect ? "green.300" : theme.cardBorder}
                bg={isCorrect ? "green.50" : theme.softBg}
                borderRadius="xl"
                p={3}
                _dark={{ bg: isCorrect ? "green.900" : theme.softBg }}
              >
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs" mb={1}>
                      الخيار {label}
                    </FormLabel>
                    <Input
                      {...inputProps}
                      bg="white"
                      _dark={{ bg: "gray.800" }}
                      value={form[text]}
                      onChange={(e) => patch(text, e.target.value)}
                      placeholder={`نص الخيار ${label}`}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" mb={1}>
                      صورة الخيار {label}
                    </FormLabel>
                    <Input
                      {...inputProps}
                      bg="white"
                      _dark={{ bg: "gray.800" }}
                      dir="ltr"
                      value={form[`option_${key.toLowerCase()}_image_url`]}
                      onChange={(e) =>
                        patch(`option_${key.toLowerCase()}_image_url`, e.target.value)
                      }
                      placeholder="اختياري"
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>
            );
          })}
        </VStack>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
        <FormControl isRequired>
          <FormLabel fontSize="sm" fontWeight="700" color={theme.heading}>
            الإجابة الصحيحة
          </FormLabel>
          <Select
            {...inputProps}
            value={form.correct_answer}
            onChange={(e) => patch("correct_answer", e.target.value)}
          >
            <option value="A">أ</option>
            <option value="B">ب</option>
            <option value="C">ج</option>
            <option value="D">د</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="700" color={theme.heading}>
            نقاط السؤال
          </FormLabel>
          <Input
            {...inputProps}
            type="number"
            min={0}
            value={form.points}
            onChange={(e) => patch("points", e.target.value)}
          />
        </FormControl>
      </SimpleGrid>
    </VStack>
  );
}

function StatCard({ label, value, hint, icon: IconComp, accent = "orange" }) {
  const theme = useDailyQuizTheme();
  return (
    <Box
      bg={theme.cardBg}
      borderWidth="1px"
      borderColor={theme.cardBorder}
      borderRadius="2xl"
      p={4}
      boxShadow={theme.shadow}
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top={0}
        insetInlineStart={0}
        w="3px"
        h="full"
        bg={`${accent}.400`}
      />
      <HStack justify="space-between" mb={2}>
        <Text fontSize="xs" color={theme.muted} fontWeight="600">
          {label}
        </Text>
        {IconComp ? (
          <Flex
            w={8}
            h={8}
            borderRadius="lg"
            bg={`${accent}.50`}
            align="center"
            justify="center"
            _dark={{ bg: "whiteAlpha.100" }}
          >
            <Icon as={IconComp} color={`${accent}.500`} boxSize={3.5} />
          </Flex>
        ) : null}
      </HStack>
      <Text fontSize="2xl" fontWeight="800" color={theme.heading} letterSpacing="-0.02em">
        {value}
      </Text>
      {hint ? (
        <Text fontSize="xs" color={theme.muted} mt={1}>
          {hint}
        </Text>
      ) : null}
    </Box>
  );
}

export default function TeacherDailyQuizDetailPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const cancelRef = useRef();
  const theme = useDailyQuizTheme();

  const settingsModal = useDisclosure();
  const questionModal = useDisclosure();
  const deleteQuizDialog = useDisclosure();
  const deleteQuestionDialog = useDisclosure();

  const tabFromQuery = searchParams.get("tab") === "stats" ? 1 : 0;
  const [tabIndex, setTabIndex] = useState(tabFromQuery);

  const [quiz, setQuiz] = useState(null);
  const [grades, setGrades] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [settingsForm, setSettingsForm] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [questionForm, setQuestionForm] = useState(() => emptyQuestionForm());
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionToDelete, setQuestionToDelete] = useState(null);

  const questions = useMemo(
    () => (Array.isArray(quiz?.questions) ? quiz.questions : []),
    [quiz],
  );

  const loadQuiz = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTeacherDailyQuiz(id);
      setQuiz(data);
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل تحميل المسابقة"),
        status: "error",
        isClosable: true,
      });
      navigate("/teacher-daily-quizzes");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await fetchDailyQuizStats(id);
      setStats(data);
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل تحميل الإحصائيات"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setStatsLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    loadQuiz();
    fetchTeacherGrades()
      .then((list) => setGrades(Array.isArray(list) ? list : []))
      .catch(() => setGrades([]));
  }, [loadQuiz]);

  useEffect(() => {
    setTabIndex(tabFromQuery);
  }, [tabFromQuery]);

  useEffect(() => {
    if (tabIndex === 1) loadStats();
  }, [tabIndex, loadStats]);

  const openSettings = () => {
    setSettingsForm(quizToForm(quiz));
    setShowAdvanced(false);
    settingsModal.onOpen();
  };

  const saveSettings = async () => {
    const error = validateQuizForm(settingsForm);
    if (error) {
      toast({ title: error, status: "warning", isClosable: true });
      return;
    }
    setBusy(true);
    try {
      const updated = await updateDailyQuiz(id, settingsForm);
      setQuiz((prev) => ({ ...prev, ...updated, questions: prev?.questions || [] }));
      toast({ title: "تم حفظ الإعدادات", status: "success", isClosable: true });
      settingsModal.onClose();
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل حفظ الإعدادات"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async () => {
    setBusy(true);
    try {
      const updated = await publishDailyQuiz(id);
      setQuiz((prev) => ({ ...prev, ...updated }));
      toast({ title: "تم نشر المسابقة", status: "success", isClosable: true });
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل النشر"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setBusy(false);
    }
  };

  const openAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm(emptyQuestionForm());
    questionModal.onOpen();
  };

  const openEditQuestion = (q) => {
    setEditingQuestion(q);
    setQuestionForm(questionToForm(q));
    questionModal.onOpen();
  };

  const saveQuestion = async () => {
    const error = validateQuestionForm(questionForm);
    if (error) {
      toast({ title: error, status: "warning", isClosable: true });
      return;
    }
    setBusy(true);
    try {
      if (editingQuestion) {
        await updateDailyQuizQuestion(id, editingQuestion.id, questionForm);
        toast({ title: "تم تحديث السؤال", status: "success", isClosable: true });
      } else {
        await addDailyQuizQuestion(id, questionForm);
        toast({ title: "تمت إضافة السؤال", status: "success", isClosable: true });
      }
      questionModal.onClose();
      await loadQuiz();
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل حفظ السؤال"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setBusy(false);
    }
  };

  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return;
    setBusy(true);
    try {
      await deleteDailyQuizQuestion(id, questionToDelete.id);
      toast({ title: "تم حذف السؤال", status: "success", isClosable: true });
      deleteQuestionDialog.onClose();
      setQuestionToDelete(null);
      await loadQuiz();
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل حذف السؤال"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setBusy(false);
    }
  };

  const confirmDeleteQuiz = async () => {
    setBusy(true);
    try {
      await deleteDailyQuiz(id);
      toast({ title: "تم حذف المسابقة", status: "success", isClosable: true });
      navigate("/teacher-daily-quizzes");
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

  const handleCsv = async () => {
    try {
      await downloadDailyQuizCsv(id);
      toast({ title: "تم تنزيل ملف CSV", status: "success", isClosable: true });
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل التصدير"),
        status: "error",
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <DailyQuizPageShell maxW="5xl">
        <Skeleton h="140px" borderRadius="3xl" mb={4} />
        <Skeleton h="360px" borderRadius="2xl" />
      </DailyQuizPageShell>
    );
  }

  if (!quiz) return null;

  return (
    <DailyQuizPageShell maxW="5xl">
      <Button
        as={RouterLink}
        to="/teacher-daily-quizzes"
        variant="ghost"
        size="sm"
        leftIcon={<FaArrowRight />}
        mb={3}
        color={theme.muted}
        borderRadius="xl"
        _hover={{ bg: theme.softBg, color: theme.heading }}
      >
        رجوع للمسابقات
      </Button>

      <DailyQuizHero
        icon={FaFire}
        eyebrow="إدارة المسابقة"
        title={quiz.title}
        subtitle={
          quiz.description ||
          `${formatDateTime(quiz.starts_at)} → ${formatDateTime(quiz.ends_at)} · ${formatDuration(quiz.duration_seconds)}`
        }
        badges={
          <>
            <DailyQuizStatusBadge
              status={quiz.status}
              label={QUIZ_STATUS_LABELS[quiz.status] || quiz.status}
            />
            <DailyQuizMetaChip colorScheme="blue">
              {quiz.grade_name || `صف #${quiz.grade_id}`}
            </DailyQuizMetaChip>
            <DailyQuizMetaChip colorScheme="orange">{questions.length} سؤال</DailyQuizMetaChip>
            <DailyQuizMetaChip colorScheme="purple">
              {formatDuration(quiz.duration_seconds)}
            </DailyQuizMetaChip>
          </>
        }
        actions={
          <>
            <Button
              size="sm"
              leftIcon={<FaSave />}
              borderRadius="xl"
              variant="outline"
              borderColor="whiteAlpha.400"
              color="white"
              _hover={{ bg: "whiteAlpha.200" }}
              onClick={openSettings}
            >
              الإعدادات
            </Button>
            {quiz.status === "draft" ? (
              <Button
                size="sm"
                leftIcon={<FaRocket />}
                borderRadius="xl"
                bg="green.400"
                color="white"
                _hover={{ bg: "green.300" }}
                onClick={handlePublish}
                isLoading={busy}
              >
                نشر
              </Button>
            ) : null}
            <IconButton
              aria-label="حذف"
              icon={<FaTrash />}
              size="sm"
              borderRadius="xl"
              variant="ghost"
              color="whiteAlpha.800"
              _hover={{ bg: "whiteAlpha.200", color: "red.200" }}
              onClick={deleteQuizDialog.onOpen}
            />
          </>
        }
      />

      {quiz.status === "draft" && questions.length === 0 ? (
        <Alert
          status="info"
          borderRadius="2xl"
          mb={4}
          bg="blue.50"
          borderWidth="1px"
          borderColor="blue.100"
          _dark={{ bg: "blue.900", borderColor: "blue.700" }}
        >
          <AlertIcon />
          أضف سؤالًا واحدًا على الأقل ثم انشر المسابقة لتظهر للطلاب.
        </Alert>
      ) : null}

      <DailyQuizSurface overflow="hidden">
        <Tabs
          index={tabIndex}
          onChange={(i) => {
            setTabIndex(i);
            setSearchParams(i === 1 ? { tab: "stats" } : {});
          }}
          variant="unstyled"
          colorScheme="orange"
        >
          <TabList
            px={3}
            pt={3}
            gap={2}
            borderBottomWidth="1px"
            borderColor={theme.cardBorder}
            bg={theme.softBg}
          >
            {[
              { icon: FaQuestion, label: "الأسئلة" },
              { icon: FaChartBar, label: "الإحصائيات" },
            ].map((t) => (
              <Tab
                key={t.label}
                fontWeight="700"
                fontSize="sm"
                borderRadius="xl"
                px={4}
                py={2.5}
                mb="-1px"
                color={theme.muted}
                _selected={{
                  color: theme.heading,
                  bg: theme.cardBg,
                  boxShadow: theme.shadow,
                  borderWidth: "1px",
                  borderColor: theme.cardBorder,
                  borderBottomColor: theme.cardBg,
                }}
              >
                <HStack spacing={2}>
                  <Icon as={t.icon} />
                  <Text>{t.label}</Text>
                </HStack>
              </Tab>
            ))}
          </TabList>

          <TabPanels>
            <TabPanel px={{ base: 3, md: 5 }} py={5}>
              <Flex justify="space-between" align="center" mb={4} gap={2} flexWrap="wrap">
                <Box>
                  <Heading size="sm" color={theme.heading} mb={0.5}>
                    بنك الأسئلة
                  </Heading>
                  <Text fontSize="sm" color={theme.muted}>
                    {questions.length} سؤال في هذه المسابقة
                  </Text>
                </Box>
                <Button
                  size="sm"
                  colorScheme="orange"
                  borderRadius="xl"
                  leftIcon={<FaPlus />}
                  onClick={openAddQuestion}
                >
                  إضافة سؤال
                </Button>
              </Flex>

              {questions.length === 0 ? (
                <Center
                  py={14}
                  borderWidth="1px"
                  borderStyle="dashed"
                  borderColor={theme.cardBorder}
                  borderRadius="2xl"
                  bg={theme.softBg}
                >
                  <VStack spacing={3}>
                    <Flex
                      w={14}
                      h={14}
                      borderRadius="2xl"
                      bg={theme.accentSoft}
                      align="center"
                      justify="center"
                    >
                      <Icon as={FaQuestion} boxSize={6} color="orange.500" />
                    </Flex>
                    <Text color={theme.muted} fontWeight="600">
                      لا توجد أسئلة بعد
                    </Text>
                    <Button
                      colorScheme="orange"
                      borderRadius="xl"
                      leftIcon={<FaPlus />}
                      onClick={openAddQuestion}
                    >
                      أضف أول سؤال
                    </Button>
                  </VStack>
                </Center>
              ) : (
                <VStack align="stretch" spacing={3}>
                  {questions.map((q, idx) => (
                    <Box
                      key={q.id}
                      borderWidth="1px"
                      borderColor={theme.cardBorder}
                      borderRadius="2xl"
                      p={4}
                      bg={theme.cardBg}
                      transition="border-color 0.15s ease, box-shadow 0.15s ease"
                      _hover={{
                        borderColor: "orange.200",
                        boxShadow: theme.shadow,
                      }}
                    >
                      <Flex justify="space-between" gap={3} align="start">
                        <Box minW={0} flex={1}>
                          <HStack mb={2} spacing={2} flexWrap="wrap">
                            <Flex
                              w={7}
                              h={7}
                              borderRadius="lg"
                              bg="#0F172A"
                              color="white"
                              align="center"
                              justify="center"
                              fontSize="xs"
                              fontWeight="800"
                              _dark={{ bg: "orange.500" }}
                            >
                              {idx + 1}
                            </Flex>
                            <DailyQuizMetaChip colorScheme="orange">{q.points} نقطة</DailyQuizMetaChip>
                            <DailyQuizMetaChip colorScheme="green">
                              صح: {q.correct_answer}
                            </DailyQuizMetaChip>
                          </HStack>
                          <Text
                            fontSize="sm"
                            fontWeight="700"
                            color={theme.heading}
                            noOfLines={3}
                            mb={3}
                            lineHeight="1.7"
                          >
                            {q.question_text}
                          </Text>
                          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
                            {OPTION_KEYS.map(({ key, text, label }) => {
                              const correct = q.correct_answer === key;
                              return (
                                <Flex
                                  key={key}
                                  align="center"
                                  gap={2}
                                  bg={correct ? "green.50" : theme.softBg}
                                  borderRadius="xl"
                                  px={2.5}
                                  py={2}
                                  borderWidth="1px"
                                  borderColor={correct ? "green.200" : "transparent"}
                                  _dark={{
                                    bg: correct ? "green.900" : theme.softBg,
                                    borderColor: correct ? "green.600" : "transparent",
                                  }}
                                >
                                  <Flex
                                    w={5}
                                    h={5}
                                    borderRadius="md"
                                    bg={correct ? "green.500" : "blackAlpha.200"}
                                    color={correct ? "white" : theme.muted}
                                    align="center"
                                    justify="center"
                                    fontSize="10px"
                                    fontWeight="800"
                                    flexShrink={0}
                                    _dark={{ bg: correct ? "green.500" : "whiteAlpha.200" }}
                                  >
                                    {label}
                                  </Flex>
                                  <Text
                                    fontSize="xs"
                                    color={correct ? "green.700" : theme.muted}
                                    fontWeight={correct ? "700" : "500"}
                                    noOfLines={1}
                                    _dark={{ color: correct ? "green.200" : theme.muted }}
                                  >
                                    {q[text]}
                                  </Text>
                                </Flex>
                              );
                            })}
                          </SimpleGrid>
                        </Box>
                        <HStack spacing={1} flexShrink={0}>
                          <IconButton
                            aria-label="تعديل"
                            icon={<FaEdit />}
                            size="sm"
                            borderRadius="xl"
                            variant="ghost"
                            colorScheme="blue"
                            onClick={() => openEditQuestion(q)}
                          />
                          <IconButton
                            aria-label="حذف"
                            icon={<FaTrash />}
                            size="sm"
                            borderRadius="xl"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => {
                              setQuestionToDelete(q);
                              deleteQuestionDialog.onOpen();
                            }}
                          />
                        </HStack>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              )}
            </TabPanel>

            <TabPanel px={{ base: 3, md: 5 }} py={5}>
              <Flex justify="space-between" mb={5} gap={2} flexWrap="wrap" align="center">
                <Box>
                  <Heading size="sm" color={theme.heading} mb={0.5}>
                    أداء المشاركين
                  </Heading>
                  <Text fontSize="sm" color={theme.muted}>
                    نتائج وترتيب وتوزيع الإجابات
                  </Text>
                </Box>
                <Button
                  size="sm"
                  leftIcon={<FaDownload />}
                  variant="outline"
                  borderRadius="xl"
                  borderColor={theme.cardBorder}
                  onClick={handleCsv}
                >
                  تصدير CSV
                </Button>
              </Flex>

              {statsLoading ? (
                <Center py={14}>
                  <Spinner color="orange.400" thickness="3px" />
                </Center>
              ) : !stats ? (
                <Text color={theme.muted}>لا توجد بيانات بعد</Text>
              ) : (
                <VStack align="stretch" spacing={5}>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                    <StatCard
                      label="المشاركون"
                      value={stats.summary?.participants ?? 0}
                      icon={FaFire}
                      accent="orange"
                    />
                    <StatCard
                      label="متوسط النقاط"
                      value={stats.summary?.avg_points ?? 0}
                      icon={FaChartBar}
                      accent="blue"
                    />
                    <StatCard
                      label="متوسط النسبة"
                      value={`${stats.summary?.avg_score_percent ?? 0}%`}
                      accent="teal"
                    />
                    <StatCard
                      label="نسبة النجاح"
                      value={`${stats.summary?.success_rate ?? 0}%`}
                      hint="≥ 50%"
                      accent="green"
                    />
                  </SimpleGrid>

                  {stats.leaderboard?.length ? (
                    <Box
                      borderWidth="1px"
                      borderColor={theme.cardBorder}
                      borderRadius="2xl"
                      overflow="hidden"
                    >
                      <Box
                        px={4}
                        py={3}
                        borderBottomWidth="1px"
                        borderColor={theme.cardBorder}
                        bg={theme.softBg}
                      >
                        <Heading size="sm" color={theme.heading}>
                          ترتيب اليوم
                        </Heading>
                      </Box>
                      <VStack align="stretch" spacing={0}>
                        {stats.leaderboard.slice(0, 20).map((row, i) => (
                          <Flex
                            key={`${row.student_id}-${row.rank}`}
                            px={4}
                            py={3}
                            justify="space-between"
                            gap={3}
                            borderBottomWidth={i < Math.min(stats.leaderboard.length, 20) - 1 ? "1px" : 0}
                            borderColor={theme.cardBorder}
                            bg={row.rank <= 3 ? theme.accentSoft : "transparent"}
                          >
                            <HStack minW={0} spacing={3}>
                              <Flex
                                w={7}
                                h={7}
                                borderRadius="lg"
                                bg={row.rank <= 3 ? "orange.500" : theme.softBg}
                                color={row.rank <= 3 ? "white" : theme.muted}
                                align="center"
                                justify="center"
                                fontSize="xs"
                                fontWeight="800"
                              >
                                {row.rank}
                              </Flex>
                              <Text fontSize="sm" fontWeight="700" color={theme.heading} noOfLines={1}>
                                {row.student_name || `طالب #${row.student_id}`}
                              </Text>
                            </HStack>
                            <Text fontSize="sm" fontWeight="800" color="orange.500">
                              {row.total_points} نقطة
                            </Text>
                          </Flex>
                        ))}
                      </VStack>
                    </Box>
                  ) : (
                    <Alert status="warning" borderRadius="2xl">
                      <AlertIcon />
                      لم يشارك أحد بعد في هذه المسابقة.
                    </Alert>
                  )}

                  {stats.questions?.length ? (
                    <Box>
                      <Heading size="sm" mb={3} color={theme.heading}>
                        توزيع الإجابات لكل سؤال
                      </Heading>
                      <VStack align="stretch" spacing={3}>
                        {stats.questions.map((q, idx) => (
                          <Box
                            key={q.id}
                            borderWidth="1px"
                            borderColor={theme.cardBorder}
                            borderRadius="2xl"
                            p={4}
                          >
                            <Text
                              fontSize="sm"
                              fontWeight="700"
                              mb={2}
                              noOfLines={2}
                              color={theme.heading}
                            >
                              {idx + 1}. {q.question_text}
                            </Text>
                            <Text fontSize="xs" color={theme.muted} mb={2}>
                              نسبة الصحة: {q.correct_rate}% · إجابات: {q.answers_count}
                            </Text>
                            <Progress
                              value={Number(q.correct_rate) || 0}
                              size="sm"
                              colorScheme="green"
                              borderRadius="full"
                              mb={3}
                            />
                            <SimpleGrid columns={4} spacing={2}>
                              {["A", "B", "C", "D"].map((letter) => (
                                <Box
                                  key={letter}
                                  textAlign="center"
                                  bg={theme.softBg}
                                  borderRadius="xl"
                                  py={2}
                                >
                                  <Text fontSize="xs" color={theme.muted} fontWeight="700">
                                    {letter}
                                  </Text>
                                  <Text fontSize="md" fontWeight="800" color={theme.heading}>
                                    {q[`choose_${letter.toLowerCase()}`] || 0}
                                  </Text>
                                </Box>
                              ))}
                            </SimpleGrid>
                          </Box>
                        ))}
                      </VStack>
                    </Box>
                  ) : null}
                </VStack>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </DailyQuizSurface>

      <Modal isOpen={settingsModal.isOpen} onClose={settingsModal.onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(4px)" />
        <ModalContent dir="rtl" borderRadius="2xl" mx={3}>
          <ModalHeader borderBottomWidth="1px" borderColor={theme.cardBorder}>
            إعدادات المسابقة
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={5}>
            {settingsForm ? (
              <>
                <DailyQuizFormFields
                  form={settingsForm}
                  setForm={setSettingsForm}
                  grades={grades}
                  showAdvanced={showAdvanced}
                />
                <Button
                  mt={3}
                  size="sm"
                  variant="link"
                  colorScheme="orange"
                  onClick={() => setShowAdvanced((v) => !v)}
                >
                  {showAdvanced ? "إخفاء المتقدمة" : "إظهار المتقدمة"}
                </Button>
              </>
            ) : null}
          </ModalBody>
          <ModalFooter gap={2} borderTopWidth="1px" borderColor={theme.cardBorder}>
            <Button variant="ghost" borderRadius="xl" onClick={settingsModal.onClose}>
              إلغاء
            </Button>
            <Button colorScheme="orange" borderRadius="xl" onClick={saveSettings} isLoading={busy}>
              حفظ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={questionModal.isOpen} onClose={questionModal.onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(4px)" />
        <ModalContent dir="rtl" borderRadius="2xl" mx={3}>
          <ModalHeader borderBottomWidth="1px" borderColor={theme.cardBorder}>
            {editingQuestion ? "تعديل السؤال" : "إضافة سؤال"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={5}>
            <QuestionFormFields form={questionForm} setForm={setQuestionForm} />
          </ModalBody>
          <ModalFooter gap={2} borderTopWidth="1px" borderColor={theme.cardBorder}>
            <Button variant="ghost" borderRadius="xl" onClick={questionModal.onClose}>
              إلغاء
            </Button>
            <Button colorScheme="orange" borderRadius="xl" onClick={saveQuestion} isLoading={busy}>
              حفظ السؤال
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={deleteQuestionDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={deleteQuestionDialog.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent dir="rtl" borderRadius="2xl" mx={3}>
            <AlertDialogHeader>حذف السؤال؟</AlertDialogHeader>
            <AlertDialogBody>لا يمكن التراجع بعد الحذف.</AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelRef} borderRadius="xl" onClick={deleteQuestionDialog.onClose}>
                إلغاء
              </Button>
              <Button colorScheme="red" borderRadius="xl" onClick={confirmDeleteQuestion} isLoading={busy}>
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <AlertDialog
        isOpen={deleteQuizDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={deleteQuizDialog.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent dir="rtl" borderRadius="2xl" mx={3}>
            <AlertDialogHeader>حذف المسابقة بالكامل؟</AlertDialogHeader>
            <AlertDialogBody>
              سيتم حذف المسابقة وكل أسئلتها ونتائجها.
            </AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelRef} borderRadius="xl" onClick={deleteQuizDialog.onClose}>
                إلغاء
              </Button>
              <Button colorScheme="red" borderRadius="xl" onClick={confirmDeleteQuiz} isLoading={busy}>
                حذف نهائي
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </DailyQuizPageShell>
  );
}
