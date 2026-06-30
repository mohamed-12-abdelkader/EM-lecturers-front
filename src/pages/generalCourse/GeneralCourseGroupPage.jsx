import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Flex,
  VStack,
  HStack,
  Card,
  CardBody,
  Spinner,
  Center,
  useColorModeValue,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  SimpleGrid,
  Collapse,
  IconButton,
  Badge,
} from "@chakra-ui/react";
import {
  FaArrowRight,
  FaUsers,
  FaPlay,
  FaFileAlt,
  FaVideo,
  FaPlus,
  FaTrash,
  FaUserGraduate,
  FaBroadcastTower,
  FaChevronDown,
  FaChevronUp,
  FaEdit,
  FaStopCircle,
  FaExternalLinkAlt,
  FaSave,
} from "react-icons/fa";
import baseUrl from "../../api/baseUrl";

const STREAM_REDIRECT_URL = import.meta.env.VITE_STREAM_REDIRECT_URL || "";

/** حالات جلسة البث — Doc: groups/:groupId/meetings */
const MEETING_STATUS_LABEL = {
  started: "مباشر الآن",
  idle: "قيد الانتظار",
  created: "قيد الانتظار",
  ended: "منتهي",
};
const MEETING_STATUS_COLOR = {
  started: "red",
  idle: "orange",
  created: "orange",
  ended: "gray",
};

const DAY_NAMES = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

export default function GeneralCourseGroupPage() {
  const { id: courseIdParam, groupId: groupIdParam } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const courseId = courseIdParam ? parseInt(courseIdParam, 10) : null;
  const groupId = groupIdParam ? parseInt(groupIdParam, 10) : null;

  const [group, setGroup] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedLectureId, setExpandedLectureId] = useState(null);
  const [isTeacherOrAdmin, setIsTeacherOrAdmin] = useState(false);
  const [meetingsLoading, setMeetingsLoading] = useState(false);

  const [addLectureOpen, setAddLectureOpen] = useState(false);
  const [lectureForm, setLectureForm] = useState({
    title: "",
    description: "",
  });
  const [lectureSaving, setLectureSaving] = useState(false);

  const [addVideoOpen, setAddVideoOpen] = useState(false);
  const [selectedLectureId, setSelectedLectureId] = useState(null);
  const [videoForm, setVideoForm] = useState({ name: "", url: "" });
  const [videoSaving, setVideoSaving] = useState(false);

  const [addExamOpen, setAddExamOpen] = useState(false);
  const [examForm, setExamForm] = useState({
    title: "",
    total_grade: "100",
    duration_minutes: "60",
  });
  const [examSaving, setExamSaving] = useState(false);

  const [addMeetingOpen, setAddMeetingOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingSaving, setMeetingSaving] = useState(false);
  const [editMeetingId, setEditMeetingId] = useState(null);
  const [editMeetingTitle, setEditMeetingTitle] = useState("");
  const [editMeetingSaving, setEditMeetingSaving] = useState(false);
  const [closingMeetingId, setClosingMeetingId] = useState(null);
  const [savingMeetingId, setSavingMeetingId] = useState(null);
  const [deletingMeetingId, setDeletingMeetingId] = useState(null);
  const [deleteMeetingTarget, setDeleteMeetingTarget] = useState(null);

  const getToken = () => localStorage.getItem("token");

  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await baseUrl.get(`/api/general-courses/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.data?.success && res.data?.group) setGroup(res.data.group);
    } catch {
      setGroup(null);
    }
  }, [groupId]);

  const fetchLectures = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await baseUrl.get(
        `/api/general-course-lectures/by-group/${groupId}`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );
      setLectures(
        res.data?.success && Array.isArray(res.data.lectures)
          ? res.data.lectures
          : [],
      );
    } catch {
      setLectures([]);
    }
  }, [groupId]);

  const fetchExams = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await baseUrl.get(
        `/api/general-courses/groups/${groupId}/exams`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );
      setExams(
        res.data?.success && Array.isArray(res.data.exams)
          ? res.data.exams
          : [],
      );
    } catch {
      setExams([]);
    }
  }, [groupId]);

  const fetchStudents = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await baseUrl.get(
        `/api/general-courses/groups/${groupId}/students`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        },
      );
      setStudents(
        res.data?.success && Array.isArray(res.data.students)
          ? res.data.students
          : [],
      );
    } catch {
      setStudents([]);
    }
  }, [groupId]);

  const fetchMeetings = useCallback(
    async (asTeacherOrAdmin) => {
      if (!groupId) return;
      setMeetingsLoading(true);
      try {
        const path = asTeacherOrAdmin
          ? `/api/general-courses/groups/${groupId}/meetings`
          : `/api/general-courses/groups/${groupId}/meetings/student`;
        const res = await baseUrl.get(path, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setMeetings(
          res.data?.success && Array.isArray(res.data.meetings)
            ? res.data.meetings
            : [],
        );
      } catch {
        setMeetings([]);
      } finally {
        setMeetingsLoading(false);
      }
    },
    [groupId],
  );

  const loadAll = useCallback(async () => {
    if (!groupId || !courseId) return;
    setLoading(true);
    let teacherOrAdmin = false;
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          teacherOrAdmin = user?.role === "teacher" || user?.role === "admin";
          setIsTeacherOrAdmin(teacherOrAdmin);
        } catch {}
      }
      await Promise.all([
        fetchGroup(),
        fetchLectures(),
        fetchExams(),
        fetchStudents(),
      ]);
      await fetchMeetings(teacherOrAdmin);
    } finally {
      setLoading(false);
    }
  }, [
    groupId,
    courseId,
    fetchGroup,
    fetchLectures,
    fetchExams,
    fetchStudents,
    fetchMeetings,
  ]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleAddLecture = async () => {
    if (!lectureForm.title.trim()) {
      toast({
        title: "تنبيه",
        description: "أدخل عنوان المحاضرة",
        status: "warning",
        isClosable: true,
      });
      return;
    }
    setLectureSaving(true);
    try {
      await baseUrl.post(
        "/api/general-course-lectures",
        {
          group_id: groupId,
          title: lectureForm.title.trim(),
          description: lectureForm.description || "",
        },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      toast({
        title: "تم",
        description: "تمت إضافة المحاضرة",
        status: "success",
        isClosable: true,
      });
      setAddLectureOpen(false);
      setLectureForm({ title: "", description: "" });
      fetchLectures();
    } catch (err) {
      toast({
        title: "خطأ",
        description: err?.response?.data?.message || "فشل الإضافة",
        status: "error",
        isClosable: true,
      });
    } finally {
      setLectureSaving(false);
    }
  };

  const handleAddVideo = async () => {
    if (!selectedLectureId || !videoForm.name.trim() || !videoForm.url.trim()) {
      toast({
        title: "تنبيه",
        description: "أدخل اسم الفيديو والرابط",
        status: "warning",
        isClosable: true,
      });
      return;
    }
    setVideoSaving(true);
    try {
      await baseUrl.post(
        "/api/general-course-lectures/video",
        {
          lecture_id: selectedLectureId,
          name: videoForm.name.trim(),
          url: videoForm.url.trim(),
        },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      toast({
        title: "تم",
        description: "تمت إضافة الفيديو",
        status: "success",
        isClosable: true,
      });
      setAddVideoOpen(false);
      setSelectedLectureId(null);
      setVideoForm({ name: "", url: "" });
      fetchLectures();
    } catch (err) {
      toast({
        title: "خطأ",
        description: err?.response?.data?.message || "فشل الإضافة",
        status: "error",
        isClosable: true,
      });
    } finally {
      setVideoSaving(false);
    }
  };

  const handleAddExam = async () => {
    if (!examForm.title.trim()) {
      toast({
        title: "تنبيه",
        description: "أدخل عنوان الامتحان",
        status: "warning",
        isClosable: true,
      });
      return;
    }
    const total = parseInt(examForm.total_grade, 10);
    const duration = parseInt(examForm.duration_minutes, 10);
    if (isNaN(total) || total <= 0 || isNaN(duration) || duration <= 0) {
      toast({
        title: "تنبيه",
        description: "الدرجة والمدة يجب أن تكونا رقماً موجباً",
        status: "warning",
        isClosable: true,
      });
      return;
    }
    setExamSaving(true);
    try {
      await baseUrl.post(
        `/api/general-courses/groups/${groupId}/exams`,
        {
          title: examForm.title.trim(),
          total_grade: total,
          duration_minutes: duration,
        },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      toast({
        title: "تم",
        description: "تم إنشاء الامتحان",
        status: "success",
        isClosable: true,
      });
      setAddExamOpen(false);
      setExamForm({ title: "", total_grade: "100", duration_minutes: "60" });
      fetchExams();
    } catch (err) {
      toast({
        title: "خطأ",
        description: err?.response?.data?.message || "فشل الإنشاء",
        status: "error",
        isClosable: true,
      });
    } finally {
      setExamSaving(false);
    }
  };

  // إنشاء جلسة — POST /groups/:groupId/meeting (Doc)
  const handleCreateMeeting = async () => {
    if (meetingTitle.trim().length < 3) {
      toast({
        title: "تنبيه",
        description: "عنوان الجلسة 3 أحرف على الأقل",
        status: "warning",
        isClosable: true,
      });
      return;
    }
    setMeetingSaving(true);
    try {
      const res = await baseUrl.post(
        `/api/general-courses/groups/${groupId}/meeting`,
        { title: meetingTitle.trim() },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      const msg = res.data?.message || "تم إنشاء جلسة البث بنجاح";
      toast({ title: "تم", description: msg, status: "success", isClosable: true });
      setAddMeetingOpen(false);
      setMeetingTitle("");
      fetchMeetings(true);
    } catch (err) {
      toast({
        title: "خطأ",
        description: err?.response?.data?.message || "فشل الإنشاء",
        status: "error",
        isClosable: true,
      });
    } finally {
      setMeetingSaving(false);
    }
  };

  // تحديث عنوان الجلسة — PUT /meeting/:id (Doc)
  const handleUpdateMeeting = async () => {
    if (editMeetingId == null || editMeetingTitle.trim().length < 3) {
      toast({
        title: "تنبيه",
        description: "عنوان الجلسة 3 أحرف على الأقل",
        status: "warning",
        isClosable: true,
      });
      return;
    }
    setEditMeetingSaving(true);
    try {
      await baseUrl.put(
        `/api/general-courses/meeting/${editMeetingId}`,
        { title: editMeetingTitle.trim() },
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      toast({ title: "تم", description: "تم تحديث عنوان الجلسة", status: "success", isClosable: true });
      setEditMeetingId(null);
      setEditMeetingTitle("");
      fetchMeetings(isTeacherOrAdmin);
    } catch (err) {
      toast({
        title: "خطأ",
        description: err?.response?.data?.message || "فشل التحديث",
        status: "error",
        isClosable: true,
      });
    } finally {
      setEditMeetingSaving(false);
    }
  };

  // إنهاء غرفة البث — POST /meeting/:id/close (Doc)
  const handleCloseMeeting = async (m) => {
    if (!window.confirm("هل تريد إنهاء غرفة البث الآن؟")) return;
    setClosingMeetingId(m.id);
    try {
      await baseUrl.post(
        `/api/general-courses/meeting/${m.id}/close`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      toast({ title: "تم", description: "تم إنهاء غرفة البث", status: "success", isClosable: true });
      fetchMeetings(isTeacherOrAdmin);
    } catch (err) {
      toast({
        title: "خطأ",
        description: err?.response?.data?.message || "فشل إنهاء الغرفة",
        status: "error",
        isClosable: true,
      });
    } finally {
      setClosingMeetingId(null);
    }
  };

  // حفظ البث — POST /api/meeting/:meetingId/close
  const handleSaveMeeting = async (m) => {
    setSavingMeetingId(m.id);
    try {
      await baseUrl.post(
        `/api/meeting/${m.id}/close`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      toast({ title: "تم", description: "تم حفظ البث", status: "success", isClosable: true });
      fetchMeetings(isTeacherOrAdmin);
    } catch (err) {
      toast({
        title: "خطأ",
        description: err?.response?.data?.message || "فشل حفظ البث",
        status: "error",
        isClosable: true,
      });
    } finally {
      setSavingMeetingId(null);
    }
  };

  // فتح مودال تأكيد حذف جلسة البث
  const handleDeleteMeetingClick = (m) => setDeleteMeetingTarget(m);

  // تنفيذ حذف جلسة بث بعد التأكيد — DELETE /meeting/:id (Doc)
  const confirmDeleteMeeting = () => {
    if (!deleteMeetingTarget) return;
    const m = deleteMeetingTarget;
    setDeletingMeetingId(m.id);
    baseUrl
      .delete(`/api/general-courses/meeting/${m.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      .then(() => {
        toast({ title: "تم", description: "تم حذف الجلسة", status: "success", isClosable: true });
        setDeleteMeetingTarget(null);
        fetchMeetings(isTeacherOrAdmin);
      })
      .catch((err) => {
        toast({
          title: "خطأ",
          description: err?.response?.data?.message || "فشل الحذف",
          status: "error",
          isClosable: true,
        });
      })
      .finally(() => setDeletingMeetingId(null));
  };

  const handleDeleteLecture = (lectureId) => {
    if (!window.confirm("حذف هذه المحاضرة؟")) return;
    baseUrl
      .delete(`/api/general-course-lectures/${lectureId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      .then(() => {
        toast({
          title: "تم",
          description: "تم حذف المحاضرة",
          status: "success",
          isClosable: true,
        });
        fetchLectures();
      })
      .catch((err) =>
        toast({
          title: "خطأ",
          description: err?.response?.data?.message || "فشل الحذف",
          status: "error",
          isClosable: true,
        }),
      );
  };

  const handleDeleteExam = (examId) => {
    if (!window.confirm("حذف هذا الامتحان؟")) return;
    baseUrl
      .delete(`/api/general-courses/exams/${examId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      .then(() => {
        toast({
          title: "تم",
          description: "تم حذف الامتحان",
          status: "success",
          isClosable: true,
        });
        fetchExams();
      })
      .catch((err) =>
        toast({
          title: "خطأ",
          description: err?.response?.data?.message || "فشل الحذف",
          status: "error",
          isClosable: true,
        }),
      );
  };

  const formatSchedules = (schedules) => {
    if (!schedules?.length) return "—";
    return schedules
      .map(
        (s) =>
          `${DAY_NAMES[s.day_of_week] ?? s.day_of_week} ${s.start_time} (${s.duration_minutes} د)`,
      )
      .join(" · ");
  };

  // براندينج: blue.500 + orange.500
  const brandBlue = "#3182ce";
  const brandOrange = "#ed8936";
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subTextColor = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const primaryBg = useColorModeValue("blue.50", "blue.900");
  const orangeBg = useColorModeValue("orange.50", "orange.900");
  const headerBg = useColorModeValue(
    "linear-gradient(135deg, #3182ce 0%, #2c5282 100%)",
    "linear-gradient(135deg, #2c5282 0%, #1a365d 100%)",
  );

  if (!groupId || !courseId) {
    return (
      <Center minH="60vh" bg={bgColor} flexDirection="column" gap={4}>
        <Text color="red.500">معرف غير صحيح</Text>
        <Button bg={brandBlue} color="white" _hover={{ bg: "#2c5282" }} onClick={() => navigate(-1)}>
          رجوع
        </Button>
      </Center>
    );
  }

  if (loading && !group) {
    return (
      <Center minH="60vh" bg={bgColor}>
        <VStack spacing={4}>
          <Spinner size="xl" color={brandBlue} />
          <Text color={subTextColor}>جاري التحميل...</Text>
        </VStack>
      </Center>
    );
  }

  if (!group) {
    return (
      <Center minH="60vh" bg={bgColor} flexDirection="column" gap={4}>
        <Text color="red.500">المجموعة غير موجودة</Text>
        <Button
          bg={brandBlue}
          color="white"
          _hover={{ bg: "#2c5282" }}
          leftIcon={<FaArrowRight />}
          onClick={() => navigate(`/general-course/${courseId}`)}
        >
          رجوع للكورس
        </Button>
      </Center>
    );
  }

  const tabLabels = ["المحاضرات", "الامتحانات", "الطلاب", "جلسات البث"];

  return (
    <Box minH="100vh" bg={bgColor} direction="rtl" pb={12}>
      {/* هيدر براندينج: أزرق + لمسة برتقالية */}
      <Box
        bg={headerBg}
        color="white"
        pt={{ base: 6, md: 8 }}
        pb={{ base: 8, md: 10 }}
        px={{ base: 4, md: 6 }}
        borderBottomLeftRadius={{ base: "2xl", md: "3xl" }}
        borderBottomRightRadius={{ base: "2xl", md: "3xl" }}
        boxShadow="lg"
      >
        <Container maxW="4xl">
          <Flex justify="space-between" align="flex-start" flexWrap="wrap" gap={4}>
            <Button
              size="sm"
              variant="ghost"
              color="white"
              _hover={{ bg: "whiteAlpha.200" }}
              leftIcon={<FaArrowRight />}
              onClick={() => navigate(`/general-course/${courseId}`)}
            >
              رجوع للكورس
            </Button>
            <VStack align="flex-end" spacing={1}>
              <Heading size="lg" fontWeight="800">
                {group.name}
              </Heading>
              <HStack spacing={4} fontSize="sm" opacity={0.95} flexWrap="wrap">
                <HStack spacing={1}>
                  <Icon as={FaUsers} />
                  <span>{group.student_count} / {group.max_students || "∞"} طالب</span>
                </HStack>
                {group.teacher && (
                  <Badge bg={brandOrange} color="white" px={2} py={0.5} borderRadius="full" fontSize="xs">
                    {group.teacher.name}
                  </Badge>
                )}
                <Text fontSize="xs">{formatSchedules(group.schedules)}</Text>
              </HStack>
            </VStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="4xl" mt={-6} px={{ base: 3, md: 4 }}>
        <Tabs index={activeTab} onChange={setActiveTab} variant="unstyled">
          <TabList
            bg={cardBg}
            borderRadius="2xl"
            p={1}
            boxShadow="md"
            borderWidth="1px"
            borderColor={borderColor}
            flexWrap="wrap"
            gap={1}
          >
            {tabLabels.map((label, i) => (
              <Tab
                key={i}
                borderRadius="xl"
                fontWeight="600"
                fontSize="sm"
                _selected={{
                  bg: activeTab === i ? brandBlue : "transparent",
                  color: "white",
                }}
                color={subTextColor}
                _hover={{ bg: activeTab === i ? brandBlue : "gray.100" }}
              >
                {label}
              </Tab>
            ))}
          </TabList>
          <Box mt={6} bg={cardBg} borderRadius="2xl" boxShadow="sm" borderWidth="1px" borderColor={borderColor} overflow="hidden">
          <TabPanels p={{ base: 4, md: 6 }}>
            <TabPanel>
              <Flex justify="space-between" align="center" mb={5}>
                <Heading size="md" color={textColor} borderBottom="3px solid" borderColor={brandOrange} pb={1}>
                  المحاضرات
                </Heading>
                {isTeacherOrAdmin && (
                  <Button
                    leftIcon={<FaPlus />}
                    bg={brandOrange}
                    color="white"
                    size="sm"
                    _hover={{ bg: "#dd6b20" }}
                    onClick={() => setAddLectureOpen(true)}
                  >
                    إضافة محاضرة
                  </Button>
                )}
              </Flex>
              {lectures.length === 0 ? (
                <Center py={12}>
                  <VStack spacing={3}>
                    <Box p={4} borderRadius="full" bg={primaryBg}>
                      <Icon as={FaPlay} boxSize={10} color={brandBlue} />
                    </Box>
                    <Text color={subTextColor}>لا توجد محاضرات</Text>
                  </VStack>
                </Center>
              ) : (
                <VStack align="stretch" spacing={4}>
                  {lectures.map((lec) => (
                    <Card
                      key={lec.id}
                      bg={cardBg}
                      borderWidth="1px"
                      borderColor={borderColor}
                      borderRadius="xl"
                      borderRight="4px solid"
                      borderRightColor={brandBlue}
                      _hover={{ shadow: "md", borderRightColor: brandOrange }}
                      transition="all 0.2s"
                    >
                      <CardBody>
                        <Flex
                          justify="space-between"
                          align="center"
                          cursor="pointer"
                          onClick={() =>
                            setExpandedLectureId((p) =>
                              p === lec.id ? null : lec.id,
                            )
                          }
                        >
                          <HStack>
                            <Box p={2} borderRadius="lg" bg={primaryBg}>
                              <Icon as={FaPlay} color={brandBlue} boxSize={4} />
                            </Box>
                            <Text fontWeight="bold" color={textColor}>
                              {lec.title}
                            </Text>
                          </HStack>
                          <HStack>
                            {isTeacherOrAdmin && (
                              <IconButton
                                aria-label="حذف"
                                icon={<FaTrash />}
                                size="xs"
                                colorScheme="red"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLecture(lec.id);
                                }}
                              />
                            )}
                            <Icon
                              as={
                                expandedLectureId === lec.id
                                  ? FaChevronUp
                                  : FaChevronDown
                              }
                            />
                          </HStack>
                        </Flex>
                        <Collapse in={expandedLectureId === lec.id}>
                          <Box
                            pt={4}
                            mt={4}
                            borderTopWidth="1px"
                            borderColor={borderColor}
                          >
                            {lec.videos?.length ? (
                              <VStack align="stretch" spacing={2}>
                                {lec.videos.map((v) => (
                                  <HStack
                                    key={v.id}
                                    p={3}
                                    bg={primaryBg}
                                    borderRadius="lg"
                                    borderLeft="3px solid"
                                    borderLeftColor={brandOrange}
                                  >
                                    <Icon as={FaVideo} color={brandBlue} />
                                    <Text color={textColor} flex={1}>{v.name}</Text>
                                    <Button
                                      size="xs"
                                      bg={brandBlue}
                                      color="white"
                                      _hover={{ bg: "#2c5282" }}
                                      as="a"
                                      href={v.url}
                                      target="_blank"
                                      rel="noopener"
                                    >
                                      تشغيل
                                    </Button>
                                  </HStack>
                                ))}
                              </VStack>
                            ) : (
                              <Text fontSize="sm" color={subTextColor}>
                                لا فيديوهات
                              </Text>
                            )}
                            {isTeacherOrAdmin && (
                              <Button
                                size="sm"
                                variant="outline"
                                borderColor={brandOrange}
                                color={brandOrange}
                                _hover={{ bg: orangeBg }}
                                leftIcon={<FaPlus />}
                                mt={3}
                                onClick={() => {
                                  setSelectedLectureId(lec.id);
                                  setVideoForm({ name: "", url: "" });
                                  setAddVideoOpen(true);
                                }}
                              >
                                إضافة فيديو
                              </Button>
                            )}
                          </Box>
                        </Collapse>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}
            </TabPanel>
            <TabPanel>
              <Flex justify="space-between" align="center" mb={5}>
                <Heading size="md" color={textColor} borderBottom="3px solid" borderColor={brandBlue} pb={1}>
                  الامتحانات
                </Heading>
                {isTeacherOrAdmin && (
                  <Button
                    leftIcon={<FaPlus />}
                    bg={brandBlue}
                    color="white"
                    size="sm"
                    _hover={{ bg: "#2c5282" }}
                    onClick={() => setAddExamOpen(true)}
                  >
                    إنشاء امتحان
                  </Button>
                )}
              </Flex>
              {exams.length === 0 ? (
                <Center py={12}>
                  <VStack spacing={3}>
                    <Box p={4} borderRadius="full" bg={orangeBg}>
                      <Icon as={FaFileAlt} boxSize={10} color={brandOrange} />
                    </Box>
                    <Text color={subTextColor}>لا توجد امتحانات</Text>
                  </VStack>
                </Center>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {exams.map((exam) => (
                    <Card
                      key={exam.id}
                      bg={cardBg}
                      borderWidth="1px"
                      borderColor={borderColor}
                      borderRadius="xl"
                      borderTop="4px solid"
                      borderTopColor={brandOrange}
                      _hover={{ shadow: "md" }}
                    >
                      <CardBody>
                        <Flex justify="space-between" align="flex-start">
                          <VStack align="stretch" spacing={1}>
                            <Text fontWeight="bold" color={textColor}>
                              {exam.title}
                            </Text>
                            <HStack fontSize="sm" color={subTextColor}>
                              <Badge colorScheme="blue" fontSize="xs">الدرجة: {exam.total_grade}</Badge>
                              <Badge colorScheme="orange" fontSize="xs">المدة: {exam.duration_minutes} د</Badge>
                            </HStack>
                          </VStack>
                          {isTeacherOrAdmin && (
                            <IconButton
                              aria-label="حذف"
                              icon={<FaTrash />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => handleDeleteExam(exam.id)}
                            />
                          )}
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>
            <TabPanel>
              <Heading size="md" color={textColor} mb={5} borderBottom="3px solid" borderColor={brandOrange} pb={1}>
                طلاب المجموعة
              </Heading>
              {students.length === 0 ? (
                <Center py={12}>
                  <VStack spacing={3}>
                    <Box p={4} borderRadius="full" bg={primaryBg}>
                      <Icon as={FaUserGraduate} boxSize={10} color={brandBlue} />
                    </Box>
                    <Text color={subTextColor}>لا يوجد طلاب</Text>
                  </VStack>
                </Center>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {students.map((s) => (
                    <Card
                      key={s.id}
                      bg={cardBg}
                      borderWidth="1px"
                      borderColor={borderColor}
                      borderRadius="xl"
                      borderRight="4px solid"
                      borderRightColor={brandBlue}
                      _hover={{ shadow: "md" }}
                    >
                      <CardBody>
                        <HStack spacing={4}>
                          <Box
                            w="48px"
                            h="48px"
                            borderRadius="full"
                            bg={`linear-gradient(135deg, ${brandBlue}, ${brandOrange})`}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text fontWeight="bold" color="white" fontSize="lg">
                              {(s.name || "؟").charAt(0)}
                            </Text>
                          </Box>
                          <VStack align="stretch" spacing={0} flex={1}>
                            <Text fontWeight="bold" color={textColor}>
                              {s.name}
                            </Text>
                            {(s.phone || s.email) && (
                              <Text fontSize="sm" color={subTextColor}>
                                {[s.phone, s.email].filter(Boolean).join(" · ")}
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>
            <TabPanel>
              <Flex justify="space-between" align="center" mb={5}>
                <Heading size="md" color={textColor} borderBottom="3px solid" borderColor={brandBlue} pb={1}>
                  جلسات البث المباشر
                </Heading>
                {isTeacherOrAdmin && (
                  <Button
                    leftIcon={<FaPlus />}
                    bg={brandOrange}
                    color="white"
                    size="sm"
                    _hover={{ bg: "#dd6b20" }}
                    onClick={() => {
                      setMeetingTitle("");
                      setAddMeetingOpen(true);
                    }}
                  >
                    إنشاء جلسة
                  </Button>
                )}
              </Flex>
              {meetingsLoading ? (
                <Center py={12}>
                  <Spinner color={brandBlue} size="lg" />
                </Center>
              ) : meetings.length === 0 ? (
                <Center py={12}>
                  <VStack spacing={3}>
                    <Box p={4} borderRadius="full" bg={primaryBg}>
                      <Icon as={FaBroadcastTower} boxSize={10} color={brandBlue} />
                    </Box>
                    <Text color={subTextColor}>
                      {isTeacherOrAdmin
                        ? "لا توجد جلسات. أنشئ جلسة جديدة."
                        : "لا توجد جلسات متاحة."}
                    </Text>
                  </VStack>
                </Center>
              ) : (
                <VStack align="stretch" spacing={4}>
                  {meetings.map((m) => {
                    const status = m.status || "idle";
                    const canJoin = status === "started" || status === "idle" || status === "created";
                    const canClose = isTeacherOrAdmin && (status === "started" || status === "created");
                    return (
                      <Card
                        key={m.id}
                        bg={cardBg}
                        borderWidth="1px"
                        borderColor={status === "started" ? brandOrange : borderColor}
                        borderRight="4px solid"
                        borderRightColor={status === "started" ? brandOrange : brandBlue}
                        borderRadius="xl"
                        boxShadow={status === "started" ? "0 4px 20px rgba(237, 137, 54, 0.2)" : "sm"}
                        _hover={{ shadow: "md" }}
                      >
                        <CardBody>
                          <Flex
                            justify="space-between"
                            align="center"
                            flexWrap="wrap"
                            gap={2}
                          >
                            <VStack align="stretch" spacing={1}>
                              <Text fontWeight="bold" color={textColor}>
                                {m.title}
                              </Text>
                              <HStack>
                                <Badge
                                  bg={status === "started" ? brandOrange : status === "ended" ? "gray.400" : brandBlue}
                                  color="white"
                                  fontSize="xs"
                                  px={2}
                                  py={0.5}
                                  borderRadius="full"
                                >
                                  {MEETING_STATUS_LABEL[status] || status}
                                </Badge>
                                {m.created_at && (
                                  <Text fontSize="xs" color={subTextColor}>
                                    {new Date(m.created_at).toLocaleDateString("ar-EG")}
                                  </Text>
                                )}
                              </HStack>
                            </VStack>
                            <HStack flexWrap="wrap" gap={2}>
                              {canJoin && (
                                <Button
                                  as="a"
                                  href={`${STREAM_REDIRECT_URL}/${m.id}?t=${getToken() || ""}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="sm"
                                  bg={status === "started" ? brandOrange : brandBlue}
                                  color="white"
                                  _hover={{ bg: status === "started" ? "#dd6b20" : "#2c5282" }}
                                  leftIcon={<Icon as={FaPlay} />}
                                >
                                  {status === "started" ? "انضم الآن" : "دخول البث"}
                                </Button>
                              )}
                              {m.status === "ended" && m.egress_url && (
                                <Button
                                  as="a"
                                  href={m.egress_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="sm"
                                  variant="outline"
                                  borderColor={brandBlue}
                                  color={brandBlue}
                                  _hover={{ bg: primaryBg }}
                                  leftIcon={<Icon as={FaExternalLinkAlt} />}
                                >
                                  مشاهدة التسجيل
                                </Button>
                              )}
                              {isTeacherOrAdmin && (
                                <>
                                  <IconButton
                                    aria-label="تعديل العنوان"
                                    icon={<FaEdit />}
                                    size="sm"
                                    variant="ghost"
                                    color={brandBlue}
                                    _hover={{ bg: primaryBg }}
                                    onClick={() => {
                                      setEditMeetingId(m.id);
                                      setEditMeetingTitle(m.title || "");
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    borderColor={brandBlue}
                                    color={brandBlue}
                                    _hover={{ bg: primaryBg }}
                                    leftIcon={<Icon as={FaSave} />}
                                    isLoading={savingMeetingId === m.id}
                                    onClick={() => handleSaveMeeting(m)}
                                  >
                                    حفظ البث
                                  </Button>
                                  {canClose && (
                                    <IconButton
                                      aria-label="إنهاء البث"
                                      icon={<FaStopCircle />}
                                      size="sm"
                                      variant="ghost"
                                      color="red.500"
                                      _hover={{ bg: "red.50" }}
                                      isLoading={closingMeetingId === m.id}
                                      onClick={() => handleCloseMeeting(m)}
                                    />
                                  )}
                                  <IconButton
                                    aria-label="حذف الجلسة"
                                    icon={<FaTrash />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="red"
                                    isLoading={deletingMeetingId === m.id}
                                    onClick={() => handleDeleteMeetingClick(m)}
                                  />
                                </>
                              )}
                            </HStack>
                          </Flex>
                        </CardBody>
                      </Card>
                    );
                  })}
                </VStack>
              )}
            </TabPanel>
          </TabPanels>
          </Box>
        </Tabs>
      </Container>

      <Modal
        isOpen={addLectureOpen}
        onClose={() => setAddLectureOpen(false)}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>إضافة محاضرة</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>عنوان المحاضرة</FormLabel>
              <Input
                value={lectureForm.title}
                onChange={(e) =>
                  setLectureForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="عنوان المحاضرة"
              />
            </FormControl>
            <FormControl>
              <FormLabel>الوصف (اختياري)</FormLabel>
              <Input
                value={lectureForm.description}
                onChange={(e) =>
                  setLectureForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="الوصف"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => setAddLectureOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              bg={brandBlue}
              color="white"
              _hover={{ bg: "#2c5282" }}
              onClick={handleAddLecture}
              isLoading={lectureSaving}
            >
              إضافة
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={addVideoOpen}
        onClose={() => {
          setAddVideoOpen(false);
          setSelectedLectureId(null);
          setVideoForm({ name: "", url: "" });
        }}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>إضافة فيديو</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>اسم الفيديو</FormLabel>
              <Input
                value={videoForm.name}
                onChange={(e) =>
                  setVideoForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="اسم الفيديو"
              />
            </FormControl>
            <FormControl>
              <FormLabel>رابط الفيديو</FormLabel>
              <Input
                value={videoForm.url}
                onChange={(e) =>
                  setVideoForm((p) => ({ ...p, url: e.target.value }))
                }
                placeholder="https://..."
                type="url"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => setAddVideoOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              bg={brandBlue}
              color="white"
              _hover={{ bg: "#2c5282" }}
              onClick={handleAddVideo}
              isLoading={videoSaving}
            >
              إضافة
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={addExamOpen}
        onClose={() => setAddExamOpen(false)}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>إنشاء امتحان</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>عنوان الامتحان</FormLabel>
              <Input
                value={examForm.title}
                onChange={(e) =>
                  setExamForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="عنوان الامتحان"
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>الدرجة الكلية</FormLabel>
              <NumberInput
                value={examForm.total_grade}
                onChange={(_, v) =>
                  setExamForm((p) => ({ ...p, total_grade: v }))
                }
                min={1}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
            <FormControl>
              <FormLabel>المدة (دقيقة)</FormLabel>
              <NumberInput
                value={examForm.duration_minutes}
                onChange={(_, v) =>
                  setExamForm((p) => ({ ...p, duration_minutes: v }))
                }
                min={1}
              >
                <NumberInputField />
              </NumberInput>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => setAddExamOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              bg={brandOrange}
              color="white"
              _hover={{ bg: "#dd6b20" }}
              onClick={handleAddExam}
              isLoading={examSaving}
            >
              إنشاء
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={addMeetingOpen}
        onClose={() => setAddMeetingOpen(false)}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>إنشاء جلسة بث مباشر</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>عنوان الجلسة (3 أحرف على الأقل)</FormLabel>
              <Input
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="عنوان الجلسة"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => setAddMeetingOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              bg={brandOrange}
              color="white"
              _hover={{ bg: "#dd6b20" }}
              onClick={handleCreateMeeting}
              isLoading={meetingSaving}
            >
              إنشاء
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* تعديل عنوان الجلسة — PUT /meeting/:id (Doc) */}
      <Modal
        isOpen={editMeetingId != null}
        onClose={() => {
          setEditMeetingId(null);
          setEditMeetingTitle("");
        }}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>تعديل عنوان الجلسة</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>عنوان الجلسة (3 أحرف على الأقل)</FormLabel>
              <Input
                value={editMeetingTitle}
                onChange={(e) => setEditMeetingTitle(e.target.value)}
                placeholder="عنوان الجلسة"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => {
                setEditMeetingId(null);
                setEditMeetingTitle("");
              }}
            >
              إلغاء
            </Button>
            <Button
              bg={brandBlue}
              color="white"
              _hover={{ bg: "#2c5282" }}
              onClick={handleUpdateMeeting}
              isLoading={editMeetingSaving}
            >
              حفظ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* تأكيد حذف جلسة البث */}
      <Modal
        isOpen={deleteMeetingTarget != null}
        onClose={() => setDeleteMeetingTarget(null)}
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>تأكيد حذف البث</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              هل أنت متأكد من حذف جلسة البث{" "}
              {deleteMeetingTarget && (
                <Text as="span" fontWeight="bold">
                  "{deleteMeetingTarget.title}"
                </Text>
              )}
              ؟ لا يمكن التراجع عن هذا الإجراء.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setDeleteMeetingTarget(null)}>
              إلغاء
            </Button>
            <Button
              colorScheme="red"
              onClick={confirmDeleteMeeting}
              isLoading={deletingMeetingId === deleteMeetingTarget?.id}
            >
              حذف
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
