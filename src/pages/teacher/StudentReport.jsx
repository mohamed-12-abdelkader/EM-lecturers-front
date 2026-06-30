import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Center,
  useToast,
  Badge,
  Avatar,
  Button,
  useColorModeValue,
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  Collapse,
  SimpleGrid,
  Container,
  Flex,
  Icon,
} from "@chakra-ui/react";
import { MdEmail, MdPhone, MdExpandMore, MdExpandLess } from "react-icons/md";
import { FaBookOpen } from "react-icons/fa";
import {
  FiArrowLeft,
  FiBook,
  FiBarChart2,
  FiAward,
  FiClock,
  FiUser,
  FiFileText,
  FiLayers,
} from "react-icons/fi";
import baseUrl from "../../api/baseUrl";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import { useParams, useNavigate } from "react-router-dom";
import UserType from "../../Hooks/auth/userType";

const ACCENT = "#0056b3";

function KpiCard({ label, value, sub, icon, accent = "blue" }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.800", "white");
  const accentMap = {
    blue: { bg: "blue.50", color: "blue.600" },
    green: { bg: "green.50", color: "green.600" },
    orange: { bg: "orange.50", color: "orange.600" },
    purple: { bg: "purple.50", color: "purple.600" },
  };
  const a = accentMap[accent] || accentMap.blue;

  return (
    <Box p={5} bg={bg} borderRadius="xl" borderWidth="1px" borderColor={border}>
      <Flex justify="space-between" align="flex-start" gap={3}>
        <Box minW={0}>
          <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={1.5}>
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color={titleColor} lineHeight="1.1">
            {value}
          </Text>
          {sub && (
            <Text fontSize="xs" color="gray.400" mt={2}>
              {sub}
            </Text>
          )}
        </Box>
        <Flex
          w={10}
          h={10}
          borderRadius="lg"
          bg={a.bg}
          align="center"
          justify="center"
          flexShrink={0}
        >
          <Icon as={icon} color={a.color} boxSize={4} />
        </Flex>
      </Flex>
    </Box>
  );
}

function SectionBlock({ title, icon, children, action }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.800", "white");

  return (
    <Box bg={bg} borderRadius="xl" borderWidth="1px" borderColor={border} overflow="hidden">
      <Flex
        px={{ base: 4, md: 5 }}
        py={4}
        borderBottomWidth="1px"
        borderColor={border}
        align="center"
        justify="space-between"
        gap={3}
        flexWrap="wrap"
      >
        <HStack spacing={3}>
          <Flex
            w={9}
            h={9}
            borderRadius="lg"
            bg={useColorModeValue("gray.50", "gray.700")}
            align="center"
            justify="center"
          >
            <Icon as={icon} color={ACCENT} boxSize={4} />
          </Flex>
          <Heading size="sm" color={titleColor} fontWeight="bold">
            {title}
          </Heading>
        </HStack>
        {action}
      </Flex>
      <Box px={{ base: 4, md: 5 }} py={5}>
        {children}
      </Box>
    </Box>
  );
}

function StatusBadge({ type, children }) {
  const schemes = {
    success: "green",
    danger: "red",
    warning: "orange",
    neutral: "gray",
    info: "blue",
  };
  return (
    <Badge
      colorScheme={schemes[type] || "gray"}
      variant="subtle"
      px={2.5}
      py={0.5}
      borderRadius="md"
      fontSize="xs"
      fontWeight="semibold"
    >
      {children}
    </Badge>
  );
}

function EmptyBlock({ message }) {
  return (
    <Center py={10} px={4}>
      <Text color="gray.500" fontSize="sm">
        {message}
      </Text>
    </Center>
  );
}

const StudentReport = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCourses, setExpandedCourses] = useState({});
  const toast = useToast();
  const [, , isTeacher] = UserType();

  const pageBg = useColorModeValue("gray.100", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subTextColor = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const tableHeadBg = useColorModeValue("gray.50", "gray.700");
  const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const tabBg = useColorModeValue("gray.50", "gray.900");
  const progressTrack = useColorModeValue("gray.100", "gray.700");
  const backHoverBg = useColorModeValue("white", "gray.800");

  useEffect(() => {
    if (isTeacher && studentId) {
      fetchReport();
    }
  }, [isTeacher, studentId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const response = await baseUrl.get(`/api/course/teacher/students/${studentId}/report`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReport(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "حدث خطأ في تحميل التقرير";
      setError(errorMessage);
      toast({
        title: "خطأ",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCourse = (examId) => {
    setExpandedCourses((prev) => ({ ...prev, [examId]: !prev[examId] }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const lectureProgressPercent = (stats) =>
    stats.totalLectures > 0
      ? Math.round((stats.watchedLecturesCount / stats.totalLectures) * 100)
      : 0;

  if (loading) {
    return <BrandLoadingScreen />;
  }

  if (error || !report) {
    return (
      <Box minH="100vh" bg={pageBg} pt="100px" pb={12}>
        <Container maxW="6xl">
          <Center minH="50vh">
            <Box
              bg={cardBg}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              p={8}
              maxW="md"
              w="full"
              textAlign="center"
            >
              <Text fontSize="md" color="red.500" fontWeight="semibold" mb={6}>
                {error || "لا يمكن تحميل التقرير"}
              </Text>
              <HStack spacing={3} justify="center" flexWrap="wrap">
                <Button colorScheme="blue" onClick={fetchReport}>
                  إعادة المحاولة
                </Button>
                <Button variant="outline" onClick={() => navigate("/teacher-students")}>
                  العودة للقائمة
                </Button>
              </HStack>
            </Box>
          </Center>
        </Container>
      </Box>
    );
  }

  const { student, courses, overallStatistics } = report;
  const watchPercent =
    overallStatistics.totalLectures > 0
      ? Math.round(
          (overallStatistics.watchedLectures / overallStatistics.totalLectures) * 100
        )
      : 0;
  const avgGrade = overallStatistics.overallAverageGrade?.toFixed(1) || "0";

  return (
    <Box minH="100vh" bg={pageBg} pt="100px" pb={14}>
      <Container maxW="6xl" px={{ base: 4, md: 6 }}>
        <VStack spacing={6} align="stretch">
          {/* Breadcrumb */}
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon as={FiArrowLeft} />}
            color={subTextColor}
            alignSelf="flex-start"
            fontWeight="medium"
            onClick={() => navigate("/teacher-students")}
            _hover={{ color: textColor, bg: backHoverBg }}
          >
            قائمة الطلاب
          </Button>

          {/* Student profile */}
          <Box
            bg={cardBg}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={borderColor}
            overflow="hidden"
          >
            <Box
              h="3px"
              bgGradient="linear(to-l, blue.600, blue.400)"
            />
            <Flex
              direction={{ base: "column", sm: "row" }}
              align={{ base: "stretch", sm: "center" }}
              gap={5}
              p={{ base: 5, md: 6 }}
            >
              <Avatar
                size="lg"
                name={student.name}
                bg="blue.600"
                color="white"
              />
              <Box flex="1" minW={0}>
                <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={1}>
                  تقرير الطالب
                </Text>
                <Heading size="lg" color={textColor} fontWeight="bold" mb={2}>
                  {student.name}
                </Heading>
                <HStack spacing={4} flexWrap="wrap">
                  {student.email && (
                    <HStack spacing={2} color={subTextColor} fontSize="sm">
                      <Icon as={MdEmail} boxSize={4} />
                      <Text>{student.email}</Text>
                    </HStack>
                  )}
                  {student.phone && (
                    <HStack spacing={2} color={subTextColor} fontSize="sm">
                      <Icon as={MdPhone} boxSize={4} />
                      <Text dir="ltr">{student.phone}</Text>
                    </HStack>
                  )}
                </HStack>
              </Box>
              <HStack spacing={2} flexShrink={0}>
                <Badge colorScheme="blue" variant="subtle" px={3} py={1} borderRadius="md">
                  {overallStatistics.totalCourses} كورس
                </Badge>
                <Badge
                  colorScheme={Number(avgGrade) >= 50 ? "green" : "orange"}
                  variant="subtle"
                  px={3}
                  py={1}
                  borderRadius="md"
                >
                  متوسط {avgGrade}%
                </Badge>
              </HStack>
            </Flex>
          </Box>

          {/* Overall KPIs */}
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
            <KpiCard
              label="الكورسات المسجّلة"
              value={overallStatistics.totalCourses}
              sub="إجمالي الاشتراكات"
              icon={FiLayers}
              accent="blue"
            />
            <KpiCard
              label="المحاضرات المشاهدة"
              value={`${overallStatistics.watchedLectures} / ${overallStatistics.totalLectures}`}
              sub={`${watchPercent}% من المحتوى`}
              icon={FaBookOpen}
              accent="green"
            />
            <KpiCard
              label="الامتحانات المسلّمة"
              value={`${overallStatistics.submittedExams} / ${overallStatistics.totalExams}`}
              sub="واجبات وامتحانات"
              icon={FiFileText}
              accent="purple"
            />
            <KpiCard
              label="المتوسط العام"
              value={`${avgGrade}%`}
              sub={Number(avgGrade) >= 50 ? "أداء مقبول" : "يحتاج متابعة"}
              icon={FiBarChart2}
              accent={Number(avgGrade) >= 50 ? "green" : "orange"}
            />
          </SimpleGrid>

          {/* Courses */}
          <Box
            bg={cardBg}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={borderColor}
            overflow="hidden"
          >
            <Box px={{ base: 4, md: 5 }} py={4} borderBottomWidth="1px" borderColor={borderColor}>
              <HStack spacing={2}>
                <Icon as={FiBook} color={ACCENT} />
                <Heading size="sm" color={textColor} fontWeight="bold">
                  تفاصيل الكورسات
                </Heading>
              </HStack>
            </Box>

            {courses.length === 0 ? (
              <EmptyBlock message="لا توجد كورسات مسجّلة لهذا الطالب" />
            ) : (
              <Tabs variant="unstyled" isLazy>
                <TabList
                  px={{ base: 3, md: 4 }}
                  pt={3}
                  pb={0}
                  gap={2}
                  flexWrap="wrap"
                  bg={tabBg}
                  borderBottomWidth="1px"
                  borderColor={borderColor}
                >
                  {courses.map((course) => (
                    <Tab
                      key={course.courseId}
                      fontSize="sm"
                      fontWeight="semibold"
                      color={subTextColor}
                      px={4}
                      py={2.5}
                      borderRadius="lg"
                      mb={3}
                      _selected={{
                        color: "blue.700",
                        bg: cardBg,
                        boxShadow: "sm",
                        borderWidth: "1px",
                        borderColor: borderColor,
                      }}
                      _hover={{ color: textColor }}
                    >
                      {course.courseTitle}
                    </Tab>
                  ))}
                </TabList>

                <TabPanels>
                  {courses.map((course) => {
                    const pct = lectureProgressPercent(course.statistics);
                    return (
                      <TabPanel key={course.courseId} px={{ base: 4, md: 5 }} py={6}>
                        <VStack spacing={5} align="stretch">
                          {/* Course summary strip */}
                          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                            {[
                              {
                                label: "المحاضرات",
                                value: `${course.statistics.watchedLecturesCount}/${course.statistics.totalLectures}`,
                              },
                              {
                                label: "الامتحانات",
                                value: `${course.statistics.submittedExams}/${course.statistics.totalExams}`,
                              },
                              {
                                label: "المتوسط",
                                value: `${course.statistics.averageGrade?.toFixed(1) || 0}%`,
                              },
                              {
                                label: "الدرجات",
                                value: `${course.statistics.totalObtainedGrade}/${course.statistics.totalMaxGrade}`,
                              },
                            ].map((item) => (
                              <Box
                                key={item.label}
                                p={4}
                                borderRadius="lg"
                                bg={useColorModeValue("gray.50", "gray.900")}
                                borderWidth="1px"
                                borderColor={borderColor}
                              >
                                <Text fontSize="xs" color="gray.500" mb={1}>
                                  {item.label}
                                </Text>
                                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                                  {item.value}
                                </Text>
                              </Box>
                            ))}
                          </SimpleGrid>

                          {/* Lectures */}
                          <SectionBlock
                            title="تقدّم المحاضرات"
                            icon={FaBookOpen}
                            action={
                              <Text fontSize="sm" fontWeight="semibold" color={subTextColor}>
                                {course.statistics.watchedLecturesCount} من{" "}
                                {course.statistics.totalLectures} — {pct}%
                              </Text>
                            }
                          >
                            <Progress
                              value={pct}
                              size="sm"
                              borderRadius="full"
                              colorScheme="blue"
                              bg={progressTrack}
                              mb={5}
                            />
                            <TableContainer>
                              <Table size="sm" variant="simple">
                                <Thead>
                                  <Tr bg={tableHeadBg}>
                                    <Th color={subTextColor} fontSize="xs" fontWeight="semibold">
                                      المحاضرة
                                    </Th>
                                    <Th color={subTextColor} fontSize="xs" fontWeight="semibold">
                                      الحالة
                                    </Th>
                                    <Th color={subTextColor} fontSize="xs" fontWeight="semibold">
                                      تاريخ المشاهدة
                                    </Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {course.allLectures.map((lecture) => (
                                    <Tr
                                      key={lecture.lectureId}
                                      _hover={{ bg: rowHoverBg }}
                                    >
                                      <Td fontSize="sm" color={textColor} fontWeight="medium" py={3}>
                                        {lecture.lectureTitle}
                                      </Td>
                                      <Td py={3}>
                                        {lecture.isWatched ? (
                                          <StatusBadge type="success">مشاهدة</StatusBadge>
                                        ) : (
                                          <StatusBadge type="neutral">لم تُشاهد</StatusBadge>
                                        )}
                                      </Td>
                                      <Td fontSize="sm" color={subTextColor} py={3}>
                                        {formatDate(lecture.viewedAt)}
                                      </Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </TableContainer>
                          </SectionBlock>

                          {/* Lecture exams */}
                          <SectionBlock title="واجبات المحاضرات" icon={FiFileText}>
                            {course.lectureExams.length === 0 ? (
                              <EmptyBlock message="لا توجد واجبات محاضرات في هذا الكورس" />
                            ) : (
                              <VStack spacing={3} align="stretch">
                                {course.lectureExams.map((exam) => (
                                  <Box
                                    key={exam.examId}
                                    p={4}
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor={
                                      exam.hasSubmitted
                                        ? exam.passed
                                          ? useColorModeValue("green.200", "green.700")
                                          : useColorModeValue("red.200", "red.700")
                                        : borderColor
                                    }
                                    bg={
                                      exam.hasSubmitted
                                        ? exam.passed
                                          ? useColorModeValue("green.50", "green.900")
                                          : useColorModeValue("red.50", "red.900")
                                        : useColorModeValue("gray.50", "gray.900")
                                    }
                                  >
                                    <Flex
                                      justify="space-between"
                                      align="flex-start"
                                      gap={3}
                                      flexWrap="wrap"
                                    >
                                      <Box flex="1" minW={0}>
                                        <Text fontWeight="semibold" color={textColor} fontSize="sm">
                                          {exam.examTitle}
                                        </Text>
                                        <Text fontSize="xs" color={subTextColor} mt={0.5}>
                                          {exam.lectureTitle}
                                        </Text>
                                      </Box>
                                      {exam.hasSubmitted ? (
                                        <StatusBadge type={exam.passed ? "success" : "danger"}>
                                          {exam.passed ? "ناجح" : "راسب"}
                                        </StatusBadge>
                                      ) : (
                                        <StatusBadge type="neutral">لم يُسلّم</StatusBadge>
                                      )}
                                    </Flex>
                                    {exam.hasSubmitted && (
                                      <HStack
                                        spacing={4}
                                        mt={3}
                                        pt={3}
                                        borderTopWidth="1px"
                                        borderColor={borderColor}
                                        flexWrap="wrap"
                                        fontSize="sm"
                                      >
                                        <Text color={textColor}>
                                          <Text as="span" color={subTextColor}>
                                            الدرجة:{" "}
                                          </Text>
                                          {exam.obtainedGrade} / {exam.totalGrade}
                                        </Text>
                                        <HStack spacing={1} color={subTextColor}>
                                          <Icon as={FiClock} boxSize={3.5} />
                                          <Text>{formatDate(exam.submittedAt)}</Text>
                                        </HStack>
                                      </HStack>
                                    )}
                                  </Box>
                                ))}
                              </VStack>
                            )}
                          </SectionBlock>

                          {/* Course exams */}
                          <SectionBlock title="امتحانات الكورس" icon={FiAward}>
                            {course.courseExams.length === 0 ? (
                              <EmptyBlock message="لا توجد امتحانات كورس في هذا الكورس" />
                            ) : (
                              <VStack spacing={3} align="stretch">
                                {course.courseExams.map((exam) => (
                                  <Box
                                    key={exam.examId}
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor={borderColor}
                                    overflow="hidden"
                                  >
                                    <Box p={4} bg={useColorModeValue("gray.50", "gray.900")}>
                                      <Flex
                                        justify="space-between"
                                        align="flex-start"
                                        gap={3}
                                        flexWrap="wrap"
                                      >
                                        <Box flex="1" minW={0}>
                                          <Text fontWeight="semibold" color={textColor} fontSize="sm">
                                            {exam.examTitle}
                                          </Text>
                                          <HStack
                                            spacing={4}
                                            mt={2}
                                            fontSize="xs"
                                            color={subTextColor}
                                            flexWrap="wrap"
                                          >
                                            <HStack spacing={1}>
                                              <Icon as={FiBook} boxSize={3} />
                                              <Text>{exam.questionsCount} سؤال</Text>
                                            </HStack>
                                            <HStack spacing={1}>
                                              <Icon as={FiClock} boxSize={3} />
                                              <Text>{exam.durationMinutes} دقيقة</Text>
                                            </HStack>
                                            <HStack spacing={1}>
                                              <Icon as={FiUser} boxSize={3} />
                                              <Text>{exam.attemptsCount} محاولة</Text>
                                            </HStack>
                                          </HStack>
                                        </Box>
                                        <IconButton
                                          icon={
                                            expandedCourses[exam.examId] ? (
                                              <MdExpandLess />
                                            ) : (
                                              <MdExpandMore />
                                            )
                                          }
                                          onClick={() => toggleCourse(exam.examId)}
                                          aria-label="عرض المحاولات"
                                          size="sm"
                                          variant="ghost"
                                        />
                                      </Flex>

                                      {exam.lastAttempt && (
                                        <HStack
                                          spacing={4}
                                          mt={3}
                                          pt={3}
                                          borderTopWidth="1px"
                                          borderColor={borderColor}
                                          fontSize="sm"
                                          flexWrap="wrap"
                                        >
                                          <Text color={textColor}>
                                            <Text as="span" color={subTextColor}>
                                              آخر محاولة:{" "}
                                            </Text>
                                            {exam.lastAttempt.obtainedGrade} /{" "}
                                            {exam.lastAttempt.totalGrade}
                                          </Text>
                                          <StatusBadge
                                            type={
                                              exam.lastAttempt.status === "submitted"
                                                ? "success"
                                                : "warning"
                                            }
                                          >
                                            {exam.lastAttempt.status === "submitted"
                                              ? "مسلّم"
                                              : "قيد التنفيذ"}
                                          </StatusBadge>
                                        </HStack>
                                      )}
                                    </Box>

                                    <Collapse in={expandedCourses[exam.examId]} animateOpacity>
                                      <Box p={4} borderTopWidth="1px" borderColor={borderColor}>
                                        <Text
                                          fontSize="xs"
                                          fontWeight="semibold"
                                          color={subTextColor}
                                          mb={3}
                                        >
                                          سجل المحاولات ({exam.allAttempts.length})
                                        </Text>
                                        <TableContainer>
                                          <Table size="sm" variant="simple">
                                            <Thead>
                                              <Tr bg={tableHeadBg}>
                                                <Th fontSize="xs" color={subTextColor}>
                                                  #
                                                </Th>
                                                <Th fontSize="xs" color={subTextColor}>
                                                  الدرجة
                                                </Th>
                                                <Th fontSize="xs" color={subTextColor}>
                                                  الحالة
                                                </Th>
                                                <Th fontSize="xs" color={subTextColor}>
                                                  البدء
                                                </Th>
                                                <Th fontSize="xs" color={subTextColor}>
                                                  التسليم
                                                </Th>
                                              </Tr>
                                            </Thead>
                                            <Tbody>
                                              {exam.allAttempts.map((attempt) => (
                                                <Tr
                                                  key={attempt.attemptNumber}
                                                  _hover={{ bg: rowHoverBg }}
                                                >
                                                  <Td fontSize="sm" fontWeight="medium" color={textColor}>
                                                    {attempt.attemptNumber}
                                                  </Td>
                                                  <Td fontSize="sm" color={textColor}>
                                                    {attempt.obtainedGrade} / {attempt.totalGrade}
                                                  </Td>
                                                  <Td>
                                                    <StatusBadge
                                                      type={
                                                        attempt.status === "submitted"
                                                          ? "success"
                                                          : "warning"
                                                      }
                                                    >
                                                      {attempt.status === "submitted"
                                                        ? "مسلّم"
                                                        : "قيد التنفيذ"}
                                                    </StatusBadge>
                                                  </Td>
                                                  <Td fontSize="xs" color={subTextColor}>
                                                    {formatDate(attempt.startedAt)}
                                                  </Td>
                                                  <Td fontSize="xs" color={subTextColor}>
                                                    {formatDate(attempt.submittedAt)}
                                                  </Td>
                                                </Tr>
                                              ))}
                                            </Tbody>
                                          </Table>
                                        </TableContainer>
                                      </Box>
                                    </Collapse>
                                  </Box>
                                ))}
                              </VStack>
                            )}
                          </SectionBlock>
                        </VStack>
                      </TabPanel>
                    );
                  })}
                </TabPanels>
              </Tabs>
            )}
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default StudentReport;
