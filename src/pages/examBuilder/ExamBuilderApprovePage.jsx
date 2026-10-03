import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  Icon,
  Badge,
  Spinner,
  Center,
  useColorModeValue,
  useToast,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Radio,
  RadioGroup,
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowRight,
  FaCheck,
  FaClipboardList,
  FaGraduationCap,
  FaLayerGroup,
  FaPlus,
  FaRegFileAlt,
  FaBookOpen,
} from "react-icons/fa";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import UserType from "../../Hooks/auth/userType";
import ExamStudentSettingsFields, {
  inferAnswersReleaseMode,
} from "../../components/exam/ExamStudentSettingsFields";
import QuestionDisplayModeFields from "../../components/exam/QuestionDisplayModeFields";
import { QUESTION_DISPLAY_MODES } from "../../utils/examFlowUtils";
import {
  fetchExamBuilderSession,
  approveExamBuilderSession,
  addApprovedQuestionsToExam,
  mapHistoryItemToSession,
  apiErrorMessage,
} from "../../api/examBuilderChatbotApi";
import {
  fetchTeacherCourses,
  fetchCourseLectures,
} from "../../api/teacherLectureExamsApi";
import {
  fetchTeacherLectureExams,
  fetchTeacherComprehensiveExams,
} from "../../Hooks/teacher/useTeacherQuestionBankQueries";
import { resolveProposalQuestions } from "./examBuilderUtils";
import { ACCENT } from "./examBuilderTheme";

const NAV_OFFSET = { base: "72px", md: "88px" };

const DESTINATIONS = [
  {
    id: "only",
    title: "اعتماد فقط",
    desc: "احفظ الأسئلة بدون إنشاء امتحان — يمكنك إضافتها لاحقاً",
    icon: FaCheck,
    accent: "green",
  },
  {
    id: "course",
    title: "امتحان كورس",
    desc: "إنشاء امتحان شامل جديد داخل كورس وربط الأسئلة به",
    icon: FaGraduationCap,
    accent: "blue",
  },
  {
    id: "lecture_exam",
    title: "امتحان محاضرة",
    desc: "إنشاء امتحان مرتبط بمحاضرة محددة",
    icon: FaRegFileAlt,
    accent: "teal",
  },
  {
    id: "lecture_assignment",
    title: "واجب محاضرة",
    desc: "إنشاء واجب جديد على محاضرة وربط الأسئلة به",
    icon: FaClipboardList,
    accent: "orange",
  },
  {
    id: "existing",
    title: "إضافة لامتحان موجود",
    desc: "ادمج الأسئلة في امتحان أو واجب موجود بالفعل على المنصة",
    icon: FaLayerGroup,
    accent: "purple",
  },
];

function SectionCard({ icon, title, accent = "blue", children }) {
  const border = useColorModeValue("gray.200", "gray.600");
  const bg = useColorModeValue("white", "gray.800");
  const headBg = useColorModeValue(`${accent}.50`, "whiteAlpha.50");
  const titleColor = useColorModeValue("gray.800", "white");

  return (
    <Box borderWidth="1px" borderColor={border} borderRadius="xl" bg={bg} overflow="hidden">
      <HStack spacing={2.5} px={4} py={2.5} borderBottomWidth="1px" borderColor={border} bg={headBg}>
        <Center w={7} h={7} borderRadius="lg" bg={`${accent}.500`} color="white">
          <Icon as={icon} boxSize={3.5} />
        </Center>
        <Text fontWeight="700" fontSize="sm" color={titleColor}>
          {title}
        </Text>
      </HStack>
      <Box px={4} py={4}>{children}</Box>
    </Box>
  );
}

function DestinationCard({ item, selected, onSelect }) {
  const border = useColorModeValue("gray.200", "gray.600");
  const bg = useColorModeValue("white", "gray.800");
  const hoverBg = useColorModeValue(`${item.accent}.50`, "whiteAlpha.100");
  const selectedBg = useColorModeValue(`${item.accent}.50`, `${item.accent}.900`);
  const selectedBorder = `${item.accent}.400`;
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.800", "white");

  return (
    <Box
      as="button"
      type="button"
      textAlign="right"
      w="full"
      p={4}
      bg={selected ? selectedBg : bg}
      borderWidth="2px"
      borderColor={selected ? selectedBorder : border}
      borderRadius="xl"
      transition="all 0.15s"
      _hover={{ bg: hoverBg, borderColor: selected ? selectedBorder : `${item.accent}.300` }}
      onClick={() => onSelect(item.id)}
      position="relative"
    >
      {selected && (
        <Center
          position="absolute"
          top={2}
          left={2}
          w={5}
          h={5}
          borderRadius="full"
          bg={`${item.accent}.500`}
          color="white"
        >
          <Icon as={FaCheck} boxSize={2.5} />
        </Center>
      )}
      <HStack align="start" spacing={3}>
        <Center
          w={11}
          h={11}
          borderRadius="xl"
          bg={`${item.accent}.500`}
          color="white"
          flexShrink={0}
        >
          <Icon as={item.icon} boxSize={5} />
        </Center>
        <Box minW={0}>
          <Text fontWeight="800" fontSize="md" color={titleColor} mb={1}>
            {item.title}
          </Text>
          <Text fontSize="sm" color={muted} lineHeight="tall">
            {item.desc}
          </Text>
        </Box>
      </HStack>
    </Box>
  );
}

function ExamPickCard({ exam, selected, onSelect, subtitle }) {
  const border = useColorModeValue("gray.200", "gray.600");
  const bg = useColorModeValue("white", "gray.800");
  const selectedBg = useColorModeValue("blue.50", "blue.900");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const muted = useColorModeValue("gray.500", "gray.400");

  return (
    <Box
      p={4}
      bg={selected ? selectedBg : bg}
      borderWidth="2px"
      borderColor={selected ? "blue.400" : border}
      borderRadius="xl"
      cursor="pointer"
      onClick={onSelect}
      _hover={{ bg: selected ? selectedBg : hoverBg }}
    >
      <Radio value={String(exam.id)} colorScheme="blue" mb={1}>
        <Text fontWeight="700" fontSize="md">
          {exam.title || `امتحان #${exam.id}`}
        </Text>
      </Radio>
      {subtitle ? (
        <Text fontSize="sm" color={muted} ps={6}>
          {subtitle}
        </Text>
      ) : null}
    </Box>
  );
}

function defaultSettings() {
  return {
    show_at: "",
    hide_at: "",
    available_from: "",
    visibility_end_date: "",
    answers_release_mode: "immediate",
    show_answers_immediately: true,
    show_answers_after_hours: 24,
    answers_visible_at: "",
    question_display_mode: QUESTION_DISPLAY_MODES.ORDERED,
  };
}

function toIsoOrUndefined(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export default function ExamBuilderApprovePage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [, , isTeacher] = UserType();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [mode, setMode] = useState("course");
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [lectureId, setLectureId] = useState("");
  const [duration, setDuration] = useState("60");
  const [durationUnlimited, setDurationUnlimited] = useState(false);
  const [totalGrade, setTotalGrade] = useState("100");
  const [questionsCount, setQuestionsCount] = useState("");
  const [settings, setSettings] = useState(defaultSettings);

  const [courses, setCourses] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [loadingLectures, setLoadingLectures] = useState(false);

  const [existingTab, setExistingTab] = useState(0);
  const [existingCourseFilter, setExistingCourseFilter] = useState("");
  const [lectureExams, setLectureExams] = useState([]);
  const [courseExams, setCourseExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState("");

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const footerBg = useColorModeValue("white", "gray.800");
  const tabListBg = useColorModeValue("gray.100", "gray.700");
  const onlyNoteBg = useColorModeValue("green.50", "green.900");
  const onlyNoteBorder = useColorModeValue("green.100", "green.700");
  const token = localStorage.getItem("token");

  const questionCount = questions.length;
  const defaultTitle =
    session?.parsed_filters?.exam_title ||
    (session?.user_message ? session.user_message.slice(0, 60) : "امتحان من بنك الأسئلة");

  useEffect(() => {
    if (!isTeacher || !sessionId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const data = await fetchExamBuilderSession(sessionId);
        const mapped =
          mapHistoryItemToSession(data?.item) ||
          mapHistoryItemToSession(data?.session) ||
          data?.item ||
          data?.session;
        if (cancelled) return;

        if (!mapped?.id) throw new Error("الجلسة غير موجودة");
        if (mapped.status !== "proposed") {
          toast({
            title: "هذه الجلسة معتمدة مسبقاً",
            status: "info",
            duration: 3500,
          });
          navigate("/exam-builder-chat", { replace: true });
          return;
        }

        const qs =
          resolveProposalQuestions(data) ||
          data?.questions ||
          mapped.selected_questions ||
          [];
        setSession(mapped);
        setQuestions(Array.isArray(qs) ? qs : []);
        setTitle(
          mapped?.parsed_filters?.exam_title ||
            (mapped?.user_message ? mapped.user_message.slice(0, 60) : "امتحان من بنك الأسئلة")
        );
        setQuestionsCount(String((Array.isArray(qs) ? qs : []).length || ""));
      } catch (err) {
        if (!cancelled) {
          toast({
            title: "تعذر فتح صفحة الاعتماد",
            description: apiErrorMessage(err),
            status: "error",
            duration: 5000,
          });
          navigate("/exam-builder-chat", { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isTeacher, sessionId, navigate, toast]);

  useEffect(() => {
    if (!token) return;
    fetchTeacherCourses(token)
      .then(setCourses)
      .catch(() => setCourses([]));
  }, [token]);

  useEffect(() => {
    if (!courseId || !token || (mode !== "lecture_exam" && mode !== "lecture_assignment")) {
      if (mode !== "lecture_exam" && mode !== "lecture_assignment") return;
      setLectures([]);
      setLectureId("");
      return;
    }
    setLoadingLectures(true);
    fetchCourseLectures(courseId, token)
      .then(setLectures)
      .catch(() => setLectures([]))
      .finally(() => setLoadingLectures(false));
  }, [courseId, token, mode]);

  useEffect(() => {
    if (mode !== "existing") return;
    let cancelled = false;
    setLoadingExams(true);
    Promise.all([
      fetchTeacherLectureExams().catch(() => []),
      fetchTeacherComprehensiveExams().catch(() => []),
    ])
      .then(([lectureList, courseList]) => {
        if (cancelled) return;
        setLectureExams(Array.isArray(lectureList) ? lectureList : []);
        setCourseExams(Array.isArray(courseList) ? courseList : []);
      })
      .finally(() => {
        if (!cancelled) setLoadingExams(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const filteredLectureExams = useMemo(() => {
    if (!existingCourseFilter) return lectureExams;
    return lectureExams.filter(
      (e) => String(e.courseId ?? e.course_id) === String(existingCourseFilter)
    );
  }, [lectureExams, existingCourseFilter]);

  const filteredCourseExams = useMemo(() => {
    if (!existingCourseFilter) return courseExams;
    return courseExams.filter(
      (e) => String(e.course_id ?? e.courseId) === String(existingCourseFilter)
    );
  }, [courseExams, existingCourseFilter]);

  const buildCreatePayload = () => {
    const shared = {
      title: title.trim() || defaultTitle,
      questions_count: Number(questionsCount) || questionCount || undefined,
      question_display_mode: settings.question_display_mode,
      answers_release_mode: settings.answers_release_mode || inferAnswersReleaseMode(settings),
      show_answers_after_hours: Number(settings.show_answers_after_hours) || undefined,
      answers_visible_at: toIsoOrUndefined(settings.answers_visible_at),
    };

    if (mode === "course") {
      return {
        ...shared,
        course_id: Number(courseId),
        duration_minutes: durationUnlimited ? null : Number(duration) || 60,
        available_from: toIsoOrUndefined(settings.available_from),
        visibility_end_date: toIsoOrUndefined(settings.visibility_end_date),
      };
    }

    return {
      ...shared,
      lecture_id: Number(lectureId),
      type: mode === "lecture_assignment" ? "assignment" : "exam",
      duration: durationUnlimited ? null : Number(duration) || 60,
      total_grade: Number(totalGrade) || 100,
      show_at: toIsoOrUndefined(settings.show_at),
      hide_at: toIsoOrUndefined(settings.hide_at),
    };
  };

  const canSubmit = () => {
    if (mode === "only") return true;
    if (mode === "course") return !!courseId && !!title.trim();
    if (mode === "lecture_exam" || mode === "lecture_assignment") {
      return !!courseId && !!lectureId && !!title.trim();
    }
    if (mode === "existing") return !!selectedExamId;
    return false;
  };

  const navigateToExam = (examId, examType) => {
    if (examId && examType === "lecture-exam") {
      navigate(`/ComprehensiveExam/${examId}`);
    } else if (examId && examType === "course-exam") {
      navigate(`/exam/${examId}`);
    } else {
      navigate("/exam-builder-chat");
    }
  };

  const handleSubmit = async () => {
    if (!session?.id || !canSubmit()) return;
    setSubmitting(true);
    try {
      if (mode === "existing") {
        const questionIds = questions.map((q) => q.id).filter(Boolean);
        const isCourseExam = existingTab === 1;
        // أضف أولاً ثم اعتمد — لو فشلت الإضافة تبقى الجلسة قابلة للاعتماد
        const addData = await addApprovedQuestionsToExam(selectedExamId, questionIds, {
          isCourseExam,
        });
        await approveExamBuilderSession(session.id, { create_exam: false });
        toast({
          title: "تم الاعتماد والإضافة",
          description:
            addData?.message ||
            `تمت إضافة ${questionIds.length} سؤال إلى الامتحان #${selectedExamId}`,
          status: "success",
          duration: 4000,
        });
        navigateToExam(selectedExamId, isCourseExam ? "course-exam" : "lecture-exam");
        return;
      }

      const payload = mode === "only" ? { create_exam: false } : buildCreatePayload();
      const data = await approveExamBuilderSession(session.id, payload);

      toast({
        title: data.message || "تم اعتماد الأسئلة",
        description:
          !data.exam_id && data.question_ids?.length
            ? `تم اعتماد ${data.question_ids.length} سؤالاً`
            : undefined,
        status: "success",
        duration: 4000,
      });

      const redirect = data.redirect || {};
      const examId = data.exam_id || redirect.exam_id;
      const examType = data.exam_type || redirect.exam_type;
      if (examId && examType) {
        navigateToExam(examId, examType);
      } else {
        navigate("/exam-builder-chat");
      }
    } catch (err) {
      toast({
        title: "فشل الاعتماد",
        description: apiErrorMessage(err),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isTeacher) return null;
  if (loading) return <BrandLoadingScreen />;

  const selectedDest = DESTINATIONS.find((d) => d.id === mode);
  const submitLabel =
    mode === "only"
      ? "اعتماد الأسئلة"
      : mode === "existing"
        ? "اعتماد وإضافة للامتحان"
        : mode === "lecture_assignment"
          ? "اعتماد وإنشاء الواجب"
          : "اعتماد وإنشاء الامتحان";

  return (
    <Box minH="100dvh" bg={pageBg} pt={NAV_OFFSET} pb={{ base: "96px", md: "110px" }} dir="rtl">
      <Box maxW="4xl" mx="auto" px={{ base: 3, md: 6 }} py={{ base: 4, md: 6 }}>
        <HStack mb={5} spacing={3} align="start">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon as={FaArrowRight} />}
            onClick={() => navigate("/exam-builder-chat")}
          >
            رجوع
          </Button>
          <Box flex={1} minW={0}>
            <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="800" color={ACCENT}>
              اعتماد الأسئلة
            </Text>
            <HStack mt={1} spacing={2} flexWrap="wrap">
              <Badge colorScheme="blue" borderRadius="md" px={2} py={0.5}>
                {questionCount} سؤال
              </Badge>
              {session?.parsed_filters?.grade_name && (
                <Badge variant="subtle" colorScheme="gray" borderRadius="md">
                  {session.parsed_filters.grade_name}
                </Badge>
              )}
              <Text fontSize="sm" color={muted} noOfLines={1}>
                {session?.user_message}
              </Text>
            </HStack>
          </Box>
        </HStack>

        <VStack align="stretch" spacing={5}>
          <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="2xl" p={{ base: 3, md: 5 }}>
            <Text fontWeight="800" mb={3} fontSize="md">
              اختر وجهة الأسئلة
            </Text>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
              {DESTINATIONS.map((item) => (
                <DestinationCard
                  key={item.id}
                  item={item}
                  selected={mode === item.id}
                  onSelect={(id) => {
                    setMode(id);
                    setSelectedExamId("");
                    if (id === "lecture_assignment" && !title.trim()) {
                      setTitle(`واجب — ${defaultTitle}`);
                    }
                  }}
                />
              ))}
            </SimpleGrid>
          </Box>

          {mode !== "only" && mode !== "existing" && (
            <VStack align="stretch" spacing={4}>
              <SectionCard
                icon={selectedDest?.icon || FaBookOpen}
                title={
                  mode === "course"
                    ? "بيانات امتحان الكورس"
                    : mode === "lecture_assignment"
                      ? "بيانات الواجب"
                      : "بيانات امتحان المحاضرة"
                }
                accent={selectedDest?.accent || "blue"}
              >
                <VStack align="stretch" spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="600">
                      {mode === "lecture_assignment" ? "عنوان الواجب" : "عنوان الامتحان"}
                    </FormLabel>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      borderRadius="lg"
                      size="lg"
                      placeholder={
                        mode === "lecture_assignment"
                          ? "مثال: واجب المتجهات"
                          : "مثال: امتحان الفصل الأول"
                      }
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="600">
                      الكورس
                    </FormLabel>
                    <Select
                      placeholder="اختر الكورس"
                      value={courseId}
                      onChange={(e) => {
                        setCourseId(e.target.value);
                        setLectureId("");
                      }}
                      borderRadius="lg"
                      size="lg"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title || c.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  {(mode === "lecture_exam" || mode === "lecture_assignment") && (
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" fontWeight="600">
                        المحاضرة
                      </FormLabel>
                      <Select
                        placeholder={loadingLectures ? "جاري التحميل..." : "اختر المحاضرة"}
                        value={lectureId}
                        onChange={(e) => setLectureId(e.target.value)}
                        borderRadius="lg"
                        size="lg"
                        isDisabled={!courseId || loadingLectures}
                      >
                        {lectures.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.title || l.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="600">
                        المدة
                      </FormLabel>
                      <HStack mb={2} spacing={3}>
                        <Switch
                          colorScheme="blue"
                          isChecked={durationUnlimited}
                          onChange={(e) => setDurationUnlimited(e.target.checked)}
                        />
                        <Text fontSize="sm">بدون حد زمني</Text>
                      </HStack>
                      {!durationUnlimited && (
                        <Input
                          type="number"
                          min={1}
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          borderRadius="lg"
                          placeholder="60"
                        />
                      )}
                    </FormControl>

                    {(mode === "lecture_exam" || mode === "lecture_assignment") && (
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="600">
                          الدرجة الكلية
                        </FormLabel>
                        <Input
                          type="number"
                          value={totalGrade}
                          onChange={(e) => setTotalGrade(e.target.value)}
                          borderRadius="lg"
                        />
                      </FormControl>
                    )}

                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="600">
                        عدد الأسئلة المعروضة للطالب
                      </FormLabel>
                      <Input
                        type="number"
                        min={1}
                        value={questionsCount}
                        onChange={(e) => setQuestionsCount(e.target.value)}
                        borderRadius="lg"
                      />
                    </FormControl>
                  </SimpleGrid>

                  <QuestionDisplayModeFields
                    value={settings.question_display_mode}
                    onChange={(value) =>
                      setSettings((prev) => ({ ...prev, question_display_mode: value }))
                    }
                    questionsCount={questionsCount}
                  />
                </VStack>
              </SectionCard>

              <SectionCard icon={FaBookOpen} title="الظهور وإظهار الإجابات" accent="green">
                <ExamStudentSettingsFields
                  formData={settings}
                  showField={mode === "course" ? "available_from" : "show_at"}
                  expireField={mode === "course" ? "visibility_end_date" : "hide_at"}
                  scheduledField="answers_visible_at"
                  onPatch={(partial) => setSettings((prev) => ({ ...prev, ...partial }))}
                />
              </SectionCard>
            </VStack>
          )}

          {mode === "existing" && (
            <SectionCard icon={FaLayerGroup} title="اختر الامتحان الموجود" accent="purple">
              <VStack align="stretch" spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="600">
                    تصفية حسب الكورس (اختياري)
                  </FormLabel>
                  <Select
                    placeholder="كل الكورسات"
                    value={existingCourseFilter}
                    onChange={(e) => {
                      setExistingCourseFilter(e.target.value);
                      setSelectedExamId("");
                    }}
                    borderRadius="lg"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title || c.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <Tabs
                  index={existingTab}
                  onChange={(i) => {
                    setExistingTab(i);
                    setSelectedExamId("");
                  }}
                  variant="soft-rounded"
                  colorScheme="blue"
                >
                  <TabList bg={tabListBg} p={1} borderRadius="xl">
                    <Tab fontSize="sm" fontWeight="600">
                      امتحانات / واجبات محاضرة
                    </Tab>
                    <Tab fontSize="sm" fontWeight="600">
                      امتحانات كورس
                    </Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel px={0} pt={4}>
                      {loadingExams ? (
                        <Center py={10}>
                          <Spinner color="blue.500" />
                        </Center>
                      ) : filteredLectureExams.length === 0 ? (
                        <Text textAlign="center" color={muted} py={8}>
                          لا توجد امتحانات محاضرة متاحة
                        </Text>
                      ) : (
                        <RadioGroup value={selectedExamId} onChange={setSelectedExamId}>
                          <VStack align="stretch" spacing={3} maxH="420px" overflowY="auto">
                            {filteredLectureExams.map((exam) => (
                              <ExamPickCard
                                key={exam.id}
                                exam={exam}
                                selected={selectedExamId === String(exam.id)}
                                onSelect={() => setSelectedExamId(String(exam.id))}
                                subtitle={[
                                  exam.courseTitle || exam.course_title,
                                  exam.lectureTitle || exam.lecture_title,
                                  exam.type === "assignment" ? "واجب" : "امتحان",
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              />
                            ))}
                          </VStack>
                        </RadioGroup>
                      )}
                    </TabPanel>
                    <TabPanel px={0} pt={4}>
                      {loadingExams ? (
                        <Center py={10}>
                          <Spinner color="blue.500" />
                        </Center>
                      ) : filteredCourseExams.length === 0 ? (
                        <Text textAlign="center" color={muted} py={8}>
                          لا توجد امتحانات كورس متاحة
                        </Text>
                      ) : (
                        <RadioGroup value={selectedExamId} onChange={setSelectedExamId}>
                          <VStack align="stretch" spacing={3} maxH="420px" overflowY="auto">
                            {filteredCourseExams.map((exam) => (
                              <ExamPickCard
                                key={exam.id}
                                exam={exam}
                                selected={selectedExamId === String(exam.id)}
                                onSelect={() => setSelectedExamId(String(exam.id))}
                                subtitle={[
                                  exam.course_title || exam.courseTitle,
                                  exam.duration_minutes != null
                                    ? `${exam.duration_minutes} د`
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              />
                            ))}
                          </VStack>
                        </RadioGroup>
                      )}
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </VStack>
            </SectionCard>
          )}

          {mode === "only" && (
            <Box
              bg={onlyNoteBg}
              borderRadius="xl"
              p={4}
              borderWidth="1px"
              borderColor={onlyNoteBorder}
            >
              <Text fontSize="sm" lineHeight="tall">
                سيتم اعتماد {questionCount} سؤال فقط دون إنشاء امتحان. يمكنك لاحقاً إضافتها لأي امتحان
                من بنك الأسئلة أو من هذه الصفحة باختيار «إضافة لامتحان موجود».
              </Text>
            </Box>
          )}
        </VStack>
      </Box>

      <Box
        position="fixed"
        bottom={0}
        insetInline={0}
        bg={footerBg}
        borderTopWidth="1px"
        borderColor={border}
        px={4}
        py={3}
        pb="max(12px, env(safe-area-inset-bottom))"
        zIndex={20}
        boxShadow="0 -4px 20px rgba(0,0,0,0.06)"
      >
        <Flex maxW="4xl" mx="auto" gap={3} align="center" justify="space-between" flexWrap="wrap">
          <Text fontSize="sm" color={muted}>
            {selectedDest?.title} · {questionCount} سؤال
          </Text>
          <HStack spacing={2}>
            <Button variant="ghost" onClick={() => navigate("/exam-builder-chat")} isDisabled={submitting}>
              إلغاء
            </Button>
            <Button
              colorScheme={mode === "lecture_assignment" ? "orange" : "green"}
              leftIcon={<Icon as={mode === "existing" ? FaPlus : FaCheck} />}
              onClick={handleSubmit}
              isLoading={submitting}
              isDisabled={!canSubmit()}
              px={6}
              fontWeight="800"
            >
              {submitLabel}
            </Button>
          </HStack>
        </Flex>
      </Box>
    </Box>
  );
}
