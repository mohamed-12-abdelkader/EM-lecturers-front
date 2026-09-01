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
  Progress,
  Skeleton,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import {
  FaSync,
  FaBookOpen,
  FaQuestionCircle,
  FaUsers,
  FaClock,
  FaCog,
  FaEye,
  FaFilter,
  FaThLarge,
  FaList,
  FaCheckCircle,
  FaArrowLeft,
} from "react-icons/fa";
import { MdQuiz } from "react-icons/md";
import { Link } from "react-router-dom";
import {
  fetchTeacherCourseExams,
  fetchTeacherCourses,
  apiErrorMessage,
} from "../../api/teacherCourseExamsApi";

const EXAM_KIND_LABELS = {
  course_level: "امتحان كورس",
  comprehensive: "امتحان شامل",
};

export default function TeacherCourseExamsPage() {
  const token = localStorage.getItem("token");
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState("grid");

  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");

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
    const active = exams.filter((e) => e.isActive).length;
    const visible = exams.filter((e) => e.isVisibleToStudents).length;
    const submissions = exams.reduce((s, e) => s + (e.submissionsCount || 0), 0);
    const configured = exams.reduce((s, e) => s + (e.configuredQuestionsCount || 0), 0);
    return { active, visible, submissions, configured };
  }, [exams]);

  const loadCourses = useCallback(async () => {
    if (!token) return;
    try {
      setCourses(await fetchTeacherCourses(token));
    } catch {
      setCourses([]);
    }
  }, [token]);

  const loadExams = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await fetchTeacherCourseExams(
        { course_id: courseId || undefined },
        token
      );
      setExams(result.exams);
      setTotal(result.total);
    } catch (err) {
      toast({
        title: apiErrorMessage(err, "فشل تحميل الامتحانات"),
        status: "error",
        isClosable: true,
      });
      setExams([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [token, courseId, toast]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const selectedCourseName =
    courses.find((c) => String(c.id) === String(courseId))?.title ||
    courses.find((c) => String(c.id) === String(courseId))?.name;

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
                <Icon as={MdQuiz} boxSize={{ base: 5, md: 6 }} />
              </Flex>
              <Box minW={0}>
                <Heading size={{ base: "md", md: "lg" }} fontWeight="bold" lineHeight="1.3">
                  الامتحانات
                </Heading>
                <Text color="whiteAlpha.900" fontSize="sm" mt={1} maxW="2xl" lineHeight="1.7">
                  عرض وإدارة امتحانات الكورسات ومتابعة الأسئلة والتسليمات.
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
              onClick={loadExams}
              isLoading={loading}
            >
              تحديث
            </Button>
          </Flex>
        </Box>

        <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={3} mb={5}>
          <KpiCard label="إجمالي الامتحانات" value={total} sub="امتحان مسجّل" icon={MdQuiz} accent="blue" />
          <KpiCard label="الامتحانات النشطة" value={stats.active} sub={`من ${total} امتحان`} icon={FaCheckCircle} accent="green" />
          <KpiCard label="ظاهر للطلاب" value={stats.visible} sub="امتحان مفعّل للعرض" icon={FaEye} accent="blue" />
          <KpiCard label="التسليمات" value={stats.submissions} sub={`${stats.configured} سؤال مُعدّ`} icon={FaUsers} accent="orange" />
        </SimpleGrid>

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
                  اختر كورساً لعرض امتحاناته فقط
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
                  onChange={(e) => setCourseId(e.target.value)}
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
          </SimpleGrid>

          {courseId && selectedCourseName && (
            <HStack mt={4} spacing={2} flexWrap="wrap">
              <Badge colorScheme="blue" borderRadius="md" px={3} py={1}>
                {selectedCourseName}
              </Badge>
              <Button size="xs" variant="ghost" colorScheme="red" onClick={() => setCourseId("")}>
                مسح الفلتر
              </Button>
            </HStack>
          )}
        </Box>

        <Flex justify="space-between" align="center" mb={4} px={1}>
          <Text fontWeight="semibold" color={heading} fontSize="sm">
            {loading ? "جاري التحميل..." : `عرض ${exams.length} من ${total} امتحان`}
          </Text>
        </Flex>

        {loading ? (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} height="300px" borderRadius="2xl" />
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
              <Icon as={MdQuiz} boxSize={8} color="blue.400" />
            </Flex>
            <VStack spacing={1}>
              <Text fontWeight="bold" color={heading} fontSize="lg">
                لا توجد امتحانات
              </Text>
              <Text color={muted} fontSize="sm" textAlign="center" maxW="sm">
                {courseId
                  ? "لا توجد امتحانات لهذا الكورس. أنشئ امتحاناً من صفحة تفاصيل الكورس."
                  : "لم يتم إنشاء امتحانات كورس بعد."}
              </Text>
            </VStack>
          </Center>
        ) : viewMode === "grid" ? (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={5}>
            {exams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </SimpleGrid>
        ) : (
          <VStack spacing={3} align="stretch">
            {exams.map((exam) => (
              <ExamListRow key={exam.id} exam={exam} />
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

function ExamCard({ exam }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const titleColor = useColorModeValue("gray.800", "white");
  const statBg = useColorModeValue("gray.50", "whiteAlpha.50");

  const questionsPct =
    exam.configuredQuestionsCount > 0
      ? Math.min(100, Math.round((exam.questionsCount / exam.configuredQuestionsCount) * 100))
      : 0;

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
        <Flex justify="space-between" align="start" mb={3} gap={2} flexWrap="wrap">
          <HStack spacing={2} flexWrap="wrap">
            <Badge colorScheme="blue" variant="subtle" borderRadius="md" fontSize="10px">
              {EXAM_KIND_LABELS[exam.examKind] || "امتحان"}
            </Badge>
            <Badge colorScheme="gray" variant="subtle" borderRadius="md" fontSize="10px">
              #{exam.id}
            </Badge>
          </HStack>
          <HStack spacing={1}>
            <Badge
              colorScheme={exam.isActive ? "green" : "gray"}
              borderRadius="md"
              fontSize="10px"
            >
              {exam.isActive ? "نشط" : "غير نشط"}
            </Badge>
            <Badge
              colorScheme={exam.isVisibleToStudents ? "blue" : "gray"}
              borderRadius="md"
              fontSize="10px"
            >
              {exam.isVisibleToStudents ? "ظاهر" : "مخفي"}
            </Badge>
          </HStack>
        </Flex>

        <Text fontWeight="bold" fontSize="md" color={titleColor} mb={3} noOfLines={2} lineHeight="1.5">
          {exam.title || "امتحان بدون عنوان"}
        </Text>

        {exam.courseTitle && (
          <HStack fontSize="xs" color={muted} bg={statBg} px={3} py={2} borderRadius="lg" spacing={2} mb={4}>
            <Icon as={FaBookOpen} color="blue.500" flexShrink={0} />
            <Text noOfLines={1}>{exam.courseTitle}</Text>
          </HStack>
        )}

        <SimpleGrid columns={3} spacing={2} mb={4}>
          <StatPill icon={FaQuestionCircle} label="أسئلة" value={exam.questionsCount} color="blue" />
          <StatPill icon={FaCog} label="مُعدّ" value={exam.configuredQuestionsCount} color="orange" />
          <StatPill icon={FaClock} label="المدة" value={exam.durationUnlimited ? "بدون حد" : (exam.durationMinutes ?? "—")} color="gray" />
        </SimpleGrid>

        {exam.configuredQuestionsCount > 0 && (
          <Box mb={4}>
            <Flex justify="space-between" mb={1}>
              <Text fontSize="xs" color={muted}>
                اكتمال الأسئلة
              </Text>
              <Text fontSize="xs" fontWeight="semibold" color="blue.600">
                {exam.questionsCount} / {exam.configuredQuestionsCount}
              </Text>
            </Flex>
            <Progress value={questionsPct} size="xs" borderRadius="full" colorScheme="blue" />
          </Box>
        )}

        <Flex justify="space-between" align="center" pt={1}>
          <HStack spacing={1} fontSize="xs" color={muted}>
            <Icon as={FaUsers} boxSize={3} />
            <Text>{exam.submissionsCount} تسليم</Text>
          </HStack>
          <Button
            as={Link}
            to={`/exam/${exam.id}`}
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

function ExamListRow({ exam }) {
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
        <Flex w={11} h={11} borderRadius="lg" bg="blue.50" align="center" justify="center" flexShrink={0}>
          <Icon as={MdQuiz} color="blue.500" boxSize={5} />
        </Flex>
        <Box flex={1} minW={0}>
          <HStack spacing={2} mb={1} flexWrap="wrap">
            <Text fontWeight="semibold" noOfLines={1}>
              {exam.title}
            </Text>
            <Badge colorScheme={exam.isActive ? "green" : "gray"} borderRadius="md" fontSize="10px">
              {exam.isActive ? "نشط" : "غير نشط"}
            </Badge>
            <Badge colorScheme={exam.isVisibleToStudents ? "blue" : "gray"} borderRadius="md" fontSize="10px">
              {exam.isVisibleToStudents ? "ظاهر" : "مخفي"}
            </Badge>
          </HStack>
          <Text fontSize="xs" color={muted} noOfLines={1}>
            {exam.courseTitle || "—"}
          </Text>
        </Box>
        <HStack spacing={4} flexShrink={0} display={{ base: "none", md: "flex" }}>
          <MiniMeta icon={FaQuestionCircle} value={exam.questionsCount} label="سؤال" />
          <MiniMeta icon={FaUsers} value={exam.submissionsCount} label="تسليم" />
          <MiniMeta icon={FaClock} value={exam.durationUnlimited ? "بدون حد" : (exam.durationMinutes ?? "—")} label={exam.durationUnlimited ? "زمني" : "دقيقة"} />
        </HStack>
        <Button
          as={Link}
          to={`/exam/${exam.id}`}
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
