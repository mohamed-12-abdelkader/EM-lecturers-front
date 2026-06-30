import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Icon,
  Select,
  Badge,
  Flex,
  SimpleGrid,
  useColorModeValue,
  useToast,
  Center,
  IconButton,
  FormControl,
  FormLabel,
  Skeleton,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import {
  FaSync,
  FaClipboardList,
  FaBookOpen,
  FaChalkboardTeacher,
  FaQuestionCircle,
  FaUsers,
  FaClock,
  FaEye,
  FaFilter,
  FaThLarge,
  FaList,
  FaStar,
  FaArrowLeft,
} from "react-icons/fa";
import { MdAssignment } from "react-icons/md";
import { Link } from "react-router-dom";
import {
  fetchTeacherLectureExams,
  fetchTeacherCourses,
  fetchCourseLectures,
  apiErrorMessage,
} from "../../api/teacherLectureExamsApi";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function TeacherAssignmentsPage() {
  const token = localStorage.getItem("token");
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState("grid");

  const [courses, setCourses] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [lecturesLoading, setLecturesLoading] = useState(false);

  const [courseId, setCourseId] = useState("");
  const [lectureId, setLectureId] = useState("");

  const pageBg = useColorModeValue("gray.100", "gray.900");
  const heroBg = useColorModeValue(
    "linear(to-l, blue.600, blue.500)",
    "linear(to-l, blue.700, blue.600)",
  );
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const heading = useColorModeValue("gray.800", "gray.100");
  const panelBg = useColorModeValue("white", "gray.800");
  const inputBg = useColorModeValue("white", "gray.700");
  const chipBg = useColorModeValue("blue.50", "whiteAlpha.100");

  const stats = useMemo(() => {
    const questions = exams.reduce((s, e) => s + (e.questionsCount || 0), 0);
    const submissions = exams.reduce((s, e) => s + (e.submissionsCount || 0), 0);
    const visible = exams.filter((e) => e.isVisible).length;
    return { questions, submissions, visible };
  }, [exams]);

  const loadCourses = useCallback(async () => {
    if (!token) return;
    try {
      setCourses(await fetchTeacherCourses(token));
    } catch {
      setCourses([]);
    }
  }, [token]);

  const loadAssignments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await fetchTeacherLectureExams(
        {
          course_id: courseId || undefined,
          lecture_id: lectureId || undefined,
          type: "assignment",
        },
        token
      );
      setExams(result.exams);
      setTotal(result.total);
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل تحميل الواجبات"),
        status: "error",
        isClosable: true,
      });
      setExams([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [token, courseId, lectureId, toast]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    if (!courseId || !token) {
      setLectures([]);
      setLectureId("");
      return;
    }
    let cancelled = false;
    setLecturesLoading(true);
    fetchCourseLectures(courseId, token)
      .then((list) => {
        if (!cancelled) setLectures(list);
      })
      .catch(() => {
        if (!cancelled) setLectures([]);
      })
      .finally(() => {
        if (!cancelled) setLecturesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, token]);

  const handleCourseChange = (value) => {
    setCourseId(value);
    setLectureId("");
  };

  const selectedCourseName = courses.find((c) => String(c.id) === String(courseId))?.title
    || courses.find((c) => String(c.id) === String(courseId))?.name;
  const selectedLectureName = lectures.find((l) => String(l.id) === String(lectureId))?.title
    || lectures.find((l) => String(l.id) === String(lectureId))?.name;

  if (!token) {
    return (
      <Center minH="60vh">
        <Text>يجب تسجيل الدخول أولاً</Text>
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg={pageBg} pt={{ base: "72px", md: "88px" }} pb={10} dir="rtl">
      <Container maxW="container.xl">
        <Box
          mb={6}
          borderRadius="2xl"
          overflow="hidden"
          bgGradient={heroBg}
          color="white"
          boxShadow="lg"
        >
          <Flex
            p={{ base: 5, md: 6 }}
            align={{ base: "start", md: "center" }}
            justify="space-between"
            gap={4}
            flexWrap="wrap"
          >
            <HStack align="start" spacing={4} flex={1} minW={0}>
              <Flex
                boxSize={{ base: 11, md: 12 }}
                borderRadius="xl"
                bg="whiteAlpha.200"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Icon as={MdAssignment} boxSize={{ base: 5, md: 6 }} />
              </Flex>
              <Box minW={0}>
                <Heading size={{ base: "md", md: "lg" }} fontWeight="bold" lineHeight="1.3">
                  الواجبات
                </Heading>
                <Text color="whiteAlpha.900" fontSize="sm" mt={1} maxW="2xl" lineHeight="1.7">
                  تتبّع واجبات المحاضرات وراقب التسليمات وانتقل لإدارة الأسئلة والدرجات.
                </Text>
              </Box>
            </HStack>
            <Button
              leftIcon={<FaSync />}
              size="sm"
              bg="whiteAlpha.200"
              color="white"
              borderRadius="xl"
              _hover={{ bg: "whiteAlpha.300" }}
              onClick={loadAssignments}
              isLoading={loading}
            >
              تحديث
            </Button>
          </Flex>
        </Box>

        <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={3} mb={5}>
          <KpiCard
            label="إجمالي الواجبات"
            value={total}
            sub="واجب مسجّل"
            icon={FaClipboardList}
            accent="blue"
          />
          <KpiCard
            label="الواجبات الظاهرة"
            value={stats.visible}
            sub={`من ${total} واجب`}
            icon={FaEye}
            accent="green"
          />
          <KpiCard
            label="إجمالي الأسئلة"
            value={stats.questions}
            sub="سؤال عبر كل الواجبات"
            icon={FaQuestionCircle}
            accent="orange"
          />
          <KpiCard
            label="التسليمات"
            value={stats.submissions}
            sub="إجمالي تسليم الطلاب"
            icon={FaUsers}
            accent="blue"
          />
        </SimpleGrid>

        {/* Filters */}
        <Box
          bg={panelBg}
          borderRadius="2xl"
          borderWidth="1px"
          borderColor={border}
          p={{ base: 4, md: 5 }}
          mb={6}
          boxShadow="sm"
        >
          <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={3}>
            <HStack spacing={2}>
              <Flex w={9} h={9} borderRadius="lg" bg={chipBg} align="center" justify="center">
                <Icon as={FaFilter} color="blue.500" boxSize={4} />
              </Flex>
              <Box>
                <Text fontWeight="bold" color={heading} fontSize="sm">
                  تصفية النتائج
                </Text>
                <Text fontSize="xs" color={muted}>
                  اختر الكورس أو المحاضرة لعرض واجبات محددة
                </Text>
              </Box>
            </HStack>
            <HStack spacing={1} bg={chipBg} p={1} borderRadius="lg" borderWidth="1px" borderColor={border}>
              <IconButton
                aria-label="عرض شبكة"
                icon={<FaThLarge />}
                size="sm"
                variant={viewMode === "grid" ? "solid" : "ghost"}
                colorScheme={viewMode === "grid" ? "blue" : "gray"}
                borderRadius="md"
                onClick={() => setViewMode("grid")}
              />
              <IconButton
                aria-label="عرض قائمة"
                icon={<FaList />}
                size="sm"
                variant={viewMode === "list" ? "solid" : "ghost"}
                colorScheme={viewMode === "list" ? "blue" : "gray"}
                borderRadius="md"
                onClick={() => setViewMode("list")}
              />
            </HStack>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel fontSize="xs" color={muted} mb={1}>
                الكورس
              </FormLabel>
              <InputGroup size="md">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaBookOpen} color="blue.400" />
                </InputLeftElement>
                <Select
                  pl={10}
                  value={courseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  borderRadius="xl"
                  bg={inputBg}
                  borderColor={border}
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)" }}
                >
                  <option value="">جميع الكورسات</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title || c.name}
                    </option>
                  ))}
                </Select>
              </InputGroup>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="xs" color={muted} mb={1}>
                المحاضرة
              </FormLabel>
              <InputGroup size="md">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaChalkboardTeacher} color="orange.400" />
                </InputLeftElement>
                <Select
                  pl={10}
                  value={lectureId}
                  onChange={(e) => setLectureId(e.target.value)}
                  borderRadius="xl"
                  bg={inputBg}
                  borderColor={border}
                  isDisabled={!courseId || lecturesLoading}
                  _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)" }}
                >
                  <option value="">
                    {lecturesLoading ? "جاري التحميل..." : "جميع المحاضرات"}
                  </option>
                  {lectures.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title || l.name}
                    </option>
                  ))}
                </Select>
              </InputGroup>
            </FormControl>
          </SimpleGrid>

          {(courseId || lectureId) && (
            <HStack mt={4} spacing={2} flexWrap="wrap">
              {selectedCourseName && (
                <Badge colorScheme="blue" borderRadius="full" px={3} py={1}>
                  {selectedCourseName}
                </Badge>
              )}
              {selectedLectureName && (
                <Badge colorScheme="orange" borderRadius="md" px={3} py={1}>
                  {selectedLectureName}
                </Badge>
              )}
              <Button
                size="xs"
                variant="ghost"
                colorScheme="red"
                onClick={() => {
                  setCourseId("");
                  setLectureId("");
                }}
              >
                مسح الفلاتر
              </Button>
            </HStack>
          )}
        </Box>

        {/* Results header */}
        <Flex justify="space-between" align="center" mb={4} px={1}>
          <Text fontWeight="semibold" color={heading} fontSize="sm">
            {loading ? "جاري التحميل..." : `عرض ${exams.length} من ${total} واجب`}
          </Text>
        </Flex>

        {/* Content */}
        {loading ? (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} height="280px" borderRadius="2xl" />
            ))}
          </SimpleGrid>
        ) : exams.length === 0 ? (
          <Center
            py={16}
            flexDirection="column"
            gap={5}
            bg={cardBg}
            borderRadius="2xl"
            borderWidth="1px"
            borderColor={border}
            boxShadow="sm"
          >
            <Flex w={16} h={16} borderRadius="xl" bg={chipBg} align="center" justify="center">
              <Icon as={FaClipboardList} boxSize={8} color="blue.400" />
            </Flex>
            <VStack spacing={1}>
              <Text fontWeight="bold" color={heading} fontSize="lg">
                لا توجد واجبات
              </Text>
              <Text color={muted} fontSize="sm" textAlign="center" maxW="sm">
                {courseId || lectureId
                  ? "جرّب تغيير الفلاتر أو مسحها لعرض المزيد من الواجبات."
                  : "لم يتم إنشاء واجبات بعد. أضف واجباً من صفحة المحاضرة في الكورس."}
              </Text>
            </VStack>
          </Center>
        ) : viewMode === "grid" ? (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={5}>
            {exams.map((exam) => (
              <AssignmentCard key={exam.id} exam={exam} />
            ))}
          </SimpleGrid>
        ) : (
          <VStack spacing={3} align="stretch">
            {exams.map((exam) => (
              <AssignmentListRow key={exam.id} exam={exam} />
            ))}
          </VStack>
        )}
      </Container>
    </Box>
  );
}

function KpiCard({ label, value, sub, icon, accent }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const accentMap = {
    blue: { bg: "blue.50", color: "blue.500" },
    green: { bg: "green.50", color: "green.500" },
    orange: { bg: "orange.50", color: "orange.500" },
  };
  const a = accentMap[accent] || accentMap.blue;

  return (
    <Box
      p={4}
      bg={bg}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={border}
    >
      <Flex justify="space-between" align="center" gap={3}>
        <Box minW={0}>
          <Text fontSize="xs" color="gray.500" mb={1}>
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color={useColorModeValue("gray.800", "white")} lineHeight="1">
            {value}
          </Text>
          {sub && (
            <Text fontSize="xs" color="gray.400" mt={1} noOfLines={1}>
              {sub}
            </Text>
          )}
        </Box>
        <Flex w={10} h={10} borderRadius="lg" bg={a.bg} align="center" justify="center" flexShrink={0}>
          <Icon as={icon} color={a.color} boxSize={4} />
        </Flex>
      </Flex>
    </Box>
  );
}

function AssignmentCard({ exam }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const titleColor = useColorModeValue("gray.800", "white");
  const statBg = useColorModeValue("gray.50", "whiteAlpha.50");

  return (
    <Box
      bg={bg}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={border}
      overflow="hidden"
      boxShadow="sm"
      _hover={{ borderColor: "blue.200" }}
    >
      <Box p={5}>
        <Flex justify="space-between" align="start" mb={3} gap={2}>
          <HStack spacing={2} flexWrap="wrap">
            <Badge colorScheme="orange" variant="subtle" borderRadius="md" fontSize="10px">
              واجب
            </Badge>
            <Badge colorScheme="gray" variant="subtle" borderRadius="md" fontSize="10px">
              #{exam.id}
            </Badge>
          </HStack>
          <Badge
            colorScheme={exam.isVisible ? "green" : "gray"}
            borderRadius="md"
            fontSize="10px"
          >
            {exam.isVisible ? "ظاهر" : "مخفي"}
          </Badge>
        </Flex>

        <Text fontWeight="bold" fontSize="md" color={titleColor} mb={3} noOfLines={2} lineHeight="1.5">
          {exam.title || "واجب بدون عنوان"}
        </Text>

        <VStack align="stretch" spacing={2} mb={4}>
          {exam.courseTitle && (
            <HStack fontSize="xs" color={muted} bg={statBg} px={3} py={2} borderRadius="lg" spacing={2}>
              <Icon as={FaBookOpen} color="blue.500" flexShrink={0} />
              <Text noOfLines={1}>{exam.courseTitle}</Text>
            </HStack>
          )}
          {exam.lectureTitle && (
            <HStack fontSize="xs" color={muted} bg={statBg} px={3} py={2} borderRadius="lg" spacing={2}>
              <Icon as={FaChalkboardTeacher} color="orange.500" flexShrink={0} />
              <Text noOfLines={1}>{exam.lectureTitle}</Text>
            </HStack>
          )}
        </VStack>

        <SimpleGrid columns={3} spacing={2} mb={4}>
          <StatPill icon={FaQuestionCircle} label="أسئلة" value={exam.questionsCount} color="blue" />
          <StatPill icon={FaUsers} label="تسليم" value={exam.submissionsCount} color="green" />
          <StatPill icon={FaClock} label="دقيقة" value={exam.duration ?? "—"} color="gray" />
        </SimpleGrid>

        <Flex justify="space-between" align="center" gap={3} flexWrap="wrap">
          <HStack spacing={2} color={muted} fontSize="xs">
            <Icon as={FaStar} color="orange.400" />
            <Text>{exam.totalGrade ?? "—"} درجة</Text>
            <Text>·</Text>
            <Text>{formatDate(exam.createdAt)}</Text>
          </HStack>
          <Button
            as={Link}
            to={`/ComprehensiveExam/${exam.id}`}
            size="sm"
            colorScheme="blue"
            variant="outline"
            borderRadius="lg"
            rightIcon={<FaArrowLeft />}
          >
            إدارة
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}

function AssignmentListRow({ exam }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");

  return (
    <Box
      bg={bg}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={border}
      p={4}
      boxShadow="sm"
      _hover={{ borderColor: "blue.200" }}
    >
      <Flex align="center" gap={4} flexWrap={{ base: "wrap", lg: "nowrap" }}>
        <Flex w={11} h={11} borderRadius="lg" bg="orange.50" align="center" justify="center" flexShrink={0}>
          <Icon as={MdAssignment} color="orange.500" boxSize={5} />
        </Flex>
        <Box flex={1} minW={0}>
          <HStack spacing={2} mb={1} flexWrap="wrap">
            <Text fontWeight="semibold" noOfLines={1}>
              {exam.title}
            </Text>
            <Badge colorScheme={exam.isVisible ? "green" : "gray"} borderRadius="md" fontSize="10px">
              {exam.isVisible ? "ظاهر" : "مخفي"}
            </Badge>
          </HStack>
          <Text fontSize="xs" color={muted} noOfLines={1}>
            {[exam.courseTitle, exam.lectureTitle].filter(Boolean).join(" · ")}
          </Text>
        </Box>
        <HStack spacing={4} flexShrink={0} display={{ base: "none", md: "flex" }}>
          <MiniMeta icon={FaQuestionCircle} value={exam.questionsCount} label="سؤال" />
          <MiniMeta icon={FaUsers} value={exam.submissionsCount} label="تسليم" />
          <MiniMeta icon={FaStar} value={exam.totalGrade ?? "—"} label="درجة" />
        </HStack>
        <Button
          as={Link}
          to={`/ComprehensiveExam/${exam.id}`}
          size="sm"
          colorScheme="blue"
          variant="outline"
          borderRadius="lg"
          flexShrink={0}
        >
          إدارة
        </Button>
      </Flex>
    </Box>
  );
}

function StatPill({ icon, label, value, color }) {
  const bg = useColorModeValue(`${color}.50`, "whiteAlpha.100");
  const iconColor = color === "gray" ? "gray.500" : `${color}.500`;
  const textColor = color === "gray" ? "gray.700" : `${color}.600`;
  return (
    <Box bg={bg} borderRadius="lg" p={2.5} textAlign="center">
      <Icon as={icon} color={iconColor} boxSize={3.5} mb={1} />
      <Text fontSize="10px" color="gray.500">
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="bold" color={textColor}>
        {value}
      </Text>
    </Box>
  );
}

function MiniMeta({ icon, value, label }) {
  return (
    <VStack spacing={0}>
      <HStack spacing={1}>
        <Icon as={icon} color="blue.500" boxSize={3} />
        <Text fontSize="sm" fontWeight="semibold">
          {value}
        </Text>
      </HStack>
      <Text fontSize="10px" color="gray.400">
        {label}
      </Text>
    </VStack>
  );
}
