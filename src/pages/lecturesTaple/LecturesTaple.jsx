import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  Image,
  Avatar,
  Badge,
  Progress,
  Icon,
  Center,
  useColorModeValue,
  Flex,
  Divider,
  Collapse,
  Button,
  SimpleGrid,
  Container,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import {
  FaPlay,
  FaCheckCircle,
  FaClock,
  FaVideo,
  FaBook,
  FaChevronDown,
  FaChevronUp,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaTrophy,
  FaRocket,
  FaStar,
  FaThumbsUp,
} from "react-icons/fa";
import { MdSchedule } from "react-icons/md";
import { Link } from "react-router-dom";
import baseUrl from "../../api/baseUrl";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";

const LecturesTaple = () => {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedLectures, setExpandedLectures] = useState({});
  const [totalLectures, setTotalLectures] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subTextColor = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  useEffect(() => {
    fetchLectures();
  }, []);

  const fetchLectures = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      const response = await baseUrl.get("/api/student/my-lectures", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success) {
        setLectures(response.data.lectures || []);
        setTotalLectures(response.data.total_lectures || 0);
        setTotalCourses(response.data.total_courses || 0);
      } else {
        setLectures([]);
      }
    } catch (error) {
      console.error("Error fetching lectures:", error);
      setError("حدث خطأ في تحميل المحاضرات");
      setLectures([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleLecture = (lectureId) => {
    setExpandedLectures((prev) => ({
      ...prev,
      [lectureId]: !prev[lectureId],
    }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getYouTubeThumbnail = (url) => {
    if (!url) return "";
    const videoId = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    )?.[1];
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
  };

  // فصل المحاضرات إلى مكتملة ومتراكمة
  // المحاضرة مكتملة فقط إذا تمت مشاهدة جميع فيديوهاتها (remaining_videos === 0)
  const completedLectures = lectures.filter((lecture) => {
    const remaining = lecture.statistics?.remaining_videos || 0;
    const watchPercentage = lecture.statistics?.watch_percentage || 0;
    // تعتبر مكتملة إذا لم يتبق أي فيديو أو نسبة المشاهدة 100%
    return remaining === 0 && watchPercentage === 100;
  });
  const pendingLectures = lectures.filter((lecture) => {
    const remaining = lecture.statistics?.remaining_videos || 0;
    const watchPercentage = lecture.statistics?.watch_percentage || 0;
    // تعتبر متراكمة إذا كان هناك فيديوهات متبقية أو نسبة المشاهدة أقل من 100%
    return remaining > 0 || watchPercentage < 100;
  });

  // ترتيب المحاضرات المتراكمة حسب عدد الفيديوهات المتبقية (الأكثر أولاً)
  const sortedPendingLectures = [...pendingLectures].sort((a, b) => {
    const remainingA = a.statistics?.remaining_videos || 0;
    const remainingB = b.statistics?.remaining_videos || 0;
    return remainingB - remainingA;
  });

  // حساب الإحصائيات
  const totalPendingVideos = pendingLectures.reduce(
    (sum, lecture) => sum + (lecture.statistics?.remaining_videos || 0),
    0
  );
  const totalWatchedVideos = lectures.reduce(
    (sum, lecture) => sum + (lecture.statistics?.watched_videos || 0),
    0
  );

  if (loading) {
    return <BrandLoadingScreen />;
  }

  if (error) {
    return (
      <Box minH="100vh" bg={bgColor} pt="100px" pb={12} dir="rtl">
        <Container maxW="container.md">
          <Center minH="60vh">
            <VStack
              spacing={5}
              p={8}
              bg={cardBg}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="lg"
            >
              <Icon as={MdSchedule} boxSize={14} color="red.500" />
              <Text
                color="red.500"
                fontSize="xl"
                fontWeight="bold"
                textAlign="center"
              >
                {error}
              </Text>
              <Button
                onClick={fetchLectures}
                bg="blue.500"
                color="white"
                _hover={{ bg: "blue.600" }}
                borderRadius="xl"
                px={6}
              >
                إعادة المحاولة
              </Button>
            </VStack>
          </Center>
        </Container>
      </Box>
    );
  }

  const sectionBg = useColorModeValue("white", "gray.800");
  const sectionBorder = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      minH="100vh"
      bg={bgColor}
      pb={12}
      px={{ base: 4, md: 6 }}
      dir="rtl"
      className="mb-[100px]"
    >
      <Container maxW="container.xl">
        {/* Header - براند */}
        <Flex
          direction={{ base: "column", sm: "row" }}
          justify="space-between"
          align={{ base: "stretch", sm: "center" }}
          gap={4}
          mb={8}
          p={6}
          borderRadius="2xl"
          bg={sectionBg}
          borderWidth="1px"
          borderColor={sectionBorder}
          boxShadow="sm"
          position="relative"
          overflow="hidden"
        >
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            h="1"
            bgGradient="linear(to-r, blue.500, orange.500)"
          />
          <HStack spacing={4} flexWrap="wrap">
            <Flex
              w="14"
              h="14"
              borderRadius="xl"
              bgGradient="linear(to-r, blue.500, blue.600)"
              color="white"
              align="center"
              justify="center"
              boxShadow="md"
            >
              <Icon as={MdSchedule} boxSize={7} />
            </Flex>
            <VStack align="flex-start" spacing={0}>
              <Heading size="lg" color={textColor} fontWeight="bold">
                جدول المحاضرات
              </Heading>
              <Text fontSize="sm" color={subTextColor}>
                تابع تقدمك في المحاضرات والكورسات
              </Text>
            </VStack>
          </HStack>
        </Flex>

        {/* Stats Cards - براند */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
          <Card
            bg={cardBg}
            borderRadius="2xl"
            boxShadow="md"
            borderWidth="1px"
            borderColor={borderColor}
            overflow="hidden"
          >
            <Box h="1" w="full" bgGradient="linear(to-r, blue.500, blue.600)" />
            <CardBody p={4}>
              <VStack spacing={2}>
                <Flex
                  w="10"
                  h="10"
                  borderRadius="lg"
                  bg="blue.100"
                  _dark={{ bg: "blue.900" }}
                  align="center"
                  justify="center"
                >
                  <Icon as={FaBook} boxSize={5} color="blue.500" />
                </Flex>
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                  {totalCourses}
                </Text>
                <Text fontSize="xs" color={subTextColor}>
                  كورس
                </Text>
              </VStack>
            </CardBody>
          </Card>
          <Card
            bg={cardBg}
            borderRadius="2xl"
            boxShadow="md"
            borderWidth="1px"
            borderColor={borderColor}
            overflow="hidden"
          >
            <Box
              h="1"
              w="full"
              bgGradient="linear(to-r, blue.500, orange.500)"
            />
            <CardBody p={4}>
              <VStack spacing={2}>
                <Flex
                  w="10"
                  h="10"
                  borderRadius="lg"
                  bg="orange.100"
                  _dark={{ bg: "orange.900" }}
                  align="center"
                  justify="center"
                >
                  <Icon as={MdSchedule} boxSize={5} color="orange.500" />
                </Flex>
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                  {totalLectures}
                </Text>
                <Text fontSize="xs" color={subTextColor}>
                  محاضرة
                </Text>
              </VStack>
            </CardBody>
          </Card>
          <Card
            bg={cardBg}
            borderRadius="2xl"
            boxShadow="md"
            borderWidth="1px"
            borderColor={borderColor}
            overflow="hidden"
          >
            <Box h="1" w="full" bg="green.500" />
            <CardBody p={4}>
              <VStack spacing={2}>
                <Flex
                  w="10"
                  h="10"
                  borderRadius="lg"
                  bg="green.100"
                  _dark={{ bg: "green.900" }}
                  align="center"
                  justify="center"
                >
                  <Icon as={FaCheckCircle} boxSize={5} color="green.600" />
                </Flex>
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                  {totalWatchedVideos}
                </Text>
                <Text fontSize="xs" color={subTextColor}>
                  تمت مشاهدتها
                </Text>
              </VStack>
            </CardBody>
          </Card>
          {totalPendingVideos > 0 ? (
            <Card
              bg={cardBg}
              borderRadius="2xl"
              boxShadow="md"
              borderWidth="1px"
              borderColor="orange.200"
              _dark={{ borderColor: "orange.700" }}
              overflow="hidden"
            >
              <Box h="1" w="full" bg="orange.500" />
              <CardBody p={4}>
                <VStack spacing={2}>
                  <Flex
                    w="10"
                    h="10"
                    borderRadius="lg"
                    bg="orange.100"
                    _dark={{ bg: "orange.900" }}
                    align="center"
                    justify="center"
                  >
                    <Icon
                      as={FaExclamationTriangle}
                      boxSize={5}
                      color="orange.600"
                    />
                  </Flex>
                  <Text
                    fontSize="2xl"
                    fontWeight="bold"
                    color="orange.600"
                    _dark={{ color: "orange.400" }}
                  >
                    {totalPendingVideos}
                  </Text>
                  <Text fontSize="xs" color={subTextColor} fontWeight="medium">
                    متراكمة
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          ) : (
            <Card
              bg={cardBg}
              borderRadius="2xl"
              boxShadow="md"
              borderWidth="1px"
              borderColor={borderColor}
              overflow="hidden"
            >
              <Box h="1" w="full" bg="green.500" />
              <CardBody p={4}>
                <VStack spacing={2}>
                  <Flex
                    w="10"
                    h="10"
                    borderRadius="lg"
                    bg="green.100"
                    _dark={{ bg: "green.900" }}
                    align="center"
                    justify="center"
                  >
                    <Icon as={FaTrophy} boxSize={5} color="green.600" />
                  </Flex>
                  <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                    0
                  </Text>
                  <Text fontSize="xs" color={subTextColor} fontWeight="medium">
                    لا توجد متراكمة
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          )}
        </SimpleGrid>

        {/* Tabs */}
        {lectures.length === 0 ? (
          <Center
            py={20}
            bg={cardBg}
            borderRadius="2xl"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <VStack spacing={6}>
              <Flex
                p={6}
                borderRadius="full"
                bgGradient="linear(to-r, blue.100, orange.100)"
                _dark={{ bgGradient: "linear(to-r, blue.900, orange.900)" }}
                boxShadow="md"
              >
                <Icon as={MdSchedule} boxSize={20} color="blue.500" />
              </Flex>
              <VStack spacing={2}>
                <Heading size="lg" color={textColor}>
                  لا توجد محاضرات متاحة
                </Heading>
                <Text
                  color={subTextColor}
                  textAlign="center"
                  maxW="400px"
                  fontSize="md"
                >
                  لم يتم العثور على أي محاضرات في جدولك. تأكد من الاشتراك في
                  الكورسات أولاً.
                </Text>
              </VStack>
            </VStack>
          </Center>
        ) : (
          <Box
            bg={sectionBg}
            borderRadius="2xl"
            borderWidth="1px"
            borderColor={sectionBorder}
            p={{ base: 3, md: 4 }}
            boxShadow="sm"
          >
            <Tabs colorScheme="blue" variant="line">
              <TabList
                mb={4}
                borderBottom="2px solid"
                borderColor={borderColor}
                gap={1}
              >
                <Tab
                  fontWeight="semibold"
                  _selected={{ color: "orange.500", borderColor: "orange.500" }}
                >
                  <HStack spacing={2}>
                    <Icon as={FaExclamationTriangle} color="orange.500" />
                    <Text>المتراكمة</Text>
                    {pendingLectures.length > 0 && (
                      <Badge
                        bg="orange.500"
                        color="white"
                        borderRadius="full"
                        px={2}
                      >
                        {pendingLectures.length}
                      </Badge>
                    )}
                  </HStack>
                </Tab>
                <Tab
                  fontWeight="semibold"
                  _selected={{ color: "green.500", borderColor: "green.500" }}
                >
                  <HStack spacing={2}>
                    <Icon as={FaCheckCircle} color="green.500" />
                    <Text>المكتملة</Text>
                    {completedLectures.length > 0 && (
                      <Badge
                        bg="green.500"
                        color="white"
                        borderRadius="full"
                        px={2}
                      >
                        {completedLectures.length}
                      </Badge>
                    )}
                  </HStack>
                </Tab>
                <Tab
                  fontWeight="semibold"
                  _selected={{ color: "blue.500", borderColor: "blue.500" }}
                >
                  <Text>الكل</Text>
                  <Badge
                    bg="blue.500"
                    color="white"
                    borderRadius="full"
                    px={2}
                    ml={2}
                  >
                    {lectures.length}
                  </Badge>
                </Tab>
              </TabList>

              <TabPanels>
                {/* Pending Lectures */}
                <TabPanel px={0}>
                  {sortedPendingLectures.length === 0 ? (
                    <Center py={16}>
                      <VStack
                        spacing={6}
                        p={6}
                        bg={cardBg}
                        borderRadius="2xl"
                        borderWidth="1px"
                        borderColor={borderColor}
                      >
                        <Flex
                          p={6}
                          borderRadius="full"
                          bg="green.100"
                          _dark={{ bg: "green.900" }}
                          boxShadow="md"
                        >
                          <Icon as={FaTrophy} boxSize={16} color="green.600" />
                        </Flex>
                        <VStack spacing={3}>
                          <Heading
                            size="md"
                            color={textColor}
                            fontWeight="bold"
                          >
                            🎉 ممتاز! لا توجد محاضرات متراكمة
                          </Heading>
                          <Text
                            fontSize="md"
                            color={subTextColor}
                            textAlign="center"
                            maxW="500px"
                          >
                            رائع! لقد أكملت جميع محاضراتك بنجاح. استمر في التقدم
                            وواصل التعلم! 🚀
                          </Text>
                          <HStack spacing={2} mt={2}>
                            <Icon as={FaStar} color="yellow.400" />
                            <Icon as={FaStar} color="yellow.400" />
                            <Icon as={FaStar} color="yellow.400" />
                          </HStack>
                        </VStack>
                      </VStack>
                    </Center>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {sortedPendingLectures.map((lecture) => (
                        <LectureCard
                          key={lecture.id}
                          lecture={lecture}
                          isPending={true}
                          expandedLectures={expandedLectures}
                          toggleLecture={toggleLecture}
                          getYouTubeThumbnail={getYouTubeThumbnail}
                          formatDate={formatDate}
                          cardBg={cardBg}
                          textColor={textColor}
                          subTextColor={subTextColor}
                          borderColor={borderColor}
                        />
                      ))}
                    </VStack>
                  )}
                </TabPanel>

                {/* Completed Lectures */}
                <TabPanel px={0}>
                  {completedLectures.length === 0 ? (
                    <Center py={16}>
                      <VStack
                        spacing={6}
                        p={6}
                        bg={cardBg}
                        borderRadius="2xl"
                        borderWidth="1px"
                        borderColor={borderColor}
                      >
                        <Flex
                          p={6}
                          borderRadius="full"
                          bgGradient="linear(to-r, blue.100, orange.100)"
                          _dark={{
                            bgGradient: "linear(to-r, blue.900, orange.900)",
                          }}
                          boxShadow="md"
                        >
                          <Icon as={FaRocket} boxSize={16} color="blue.500" />
                        </Flex>
                        <VStack spacing={3}>
                          <Heading
                            size="md"
                            color={textColor}
                            fontWeight="bold"
                          >
                            ابدأ رحلتك التعليمية الآن! 🚀
                          </Heading>
                          <Text
                            fontSize="md"
                            color={subTextColor}
                            textAlign="center"
                            maxW="500px"
                          >
                            لم تكمل أي محاضرة بعد. ابدأ بمشاهدة المحاضرات
                            المتراكمة لتحقيق تقدم رائع في مسيرتك التعليمية!
                          </Text>
                          <HStack spacing={2} mt={2}>
                            <Icon
                              as={FaThumbsUp}
                              color="blue.500"
                              boxSize={5}
                            />
                            <Text
                              fontSize="sm"
                              color={subTextColor}
                              fontWeight="medium"
                            >
                              كل خطوة تبدأ بخطوة واحدة
                            </Text>
                          </HStack>
                        </VStack>
                      </VStack>
                    </Center>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {completedLectures.map((lecture) => (
                        <LectureCard
                          key={lecture.id}
                          lecture={lecture}
                          isPending={false}
                          expandedLectures={expandedLectures}
                          toggleLecture={toggleLecture}
                          getYouTubeThumbnail={getYouTubeThumbnail}
                          formatDate={formatDate}
                          cardBg={cardBg}
                          textColor={textColor}
                          subTextColor={subTextColor}
                          borderColor={borderColor}
                        />
                      ))}
                    </VStack>
                  )}
                </TabPanel>

                {/* All Lectures */}
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {lectures.map((lecture) => {
                      const remaining =
                        lecture.statistics?.remaining_videos || 0;
                      const watchPercentage =
                        lecture.statistics?.watch_percentage || 0;
                      const isPending = remaining > 0 || watchPercentage < 100;
                      return (
                        <LectureCard
                          key={lecture.id}
                          lecture={lecture}
                          isPending={isPending}
                          expandedLectures={expandedLectures}
                          toggleLecture={toggleLecture}
                          getYouTubeThumbnail={getYouTubeThumbnail}
                          formatDate={formatDate}
                          cardBg={cardBg}
                          textColor={textColor}
                          subTextColor={subTextColor}
                          borderColor={borderColor}
                        />
                      );
                    })}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        )}
      </Container>
    </Box>
  );
};

// Simplified Lecture Card Component
const LectureCard = ({
  lecture,
  isPending,
  expandedLectures,
  toggleLecture,
  getYouTubeThumbnail,
  formatDate,
  cardBg,
  textColor,
  subTextColor,
  borderColor,
}) => {
  const videoCardBg = useColorModeValue("gray.50", "gray.700");

  return (
    <Card
      bg={cardBg}
      borderRadius="lg"
      borderLeft={`4px solid ${isPending ? "#ed8936" : "#48bb78"}`}
      boxShadow="sm"
      _hover={{ boxShadow: "md" }}
      transition="all 0.2s"
    >
      <CardBody p={4}>
        <VStack spacing={3} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="flex-start" gap={4}>
            <VStack align="flex-start" spacing={2} flex={1}>
              <HStack spacing={2} flexWrap="wrap">
                <Badge colorScheme="blue" fontSize="xs">
                  #{lecture.position}
                </Badge>
                {isPending ? (
                  <Badge colorScheme="orange" fontSize="xs">
                    <HStack spacing={1}>
                      <Icon as={FaExclamationTriangle} boxSize={2.5} />
                      <Text>متراكمة</Text>
                    </HStack>
                  </Badge>
                ) : (
                  <Badge
                    bg="green.500"
                    color="white"
                    fontSize="xs"
                    borderRadius="full"
                    px={2}
                  >
                    <HStack spacing={1}>
                      <Icon as={FaCheckCircle} boxSize={2.5} />
                      <Text>مكتملة</Text>
                    </HStack>
                  </Badge>
                )}
                {isPending && lecture.statistics?.remaining_videos > 0 && (
                  <Badge
                    bg="red.500"
                    color="white"
                    fontSize="xs"
                    borderRadius="full"
                    px={2}
                  >
                    {lecture.statistics.remaining_videos} متبقي
                  </Badge>
                )}
              </HStack>
              <Heading size="md" color={textColor} fontWeight="bold">
                {lecture.title}
              </Heading>
            </VStack>
            <Button
              onClick={() => toggleLecture(lecture.id)}
              size="sm"
              variant="ghost"
              colorScheme="blue"
              leftIcon={
                expandedLectures[lecture.id] ? (
                  <FaChevronUp />
                ) : (
                  <FaChevronDown />
                )
              }
              borderRadius="xl"
            >
              {expandedLectures[lecture.id] ? "إخفاء" : "تفاصيل"}
            </Button>
          </Flex>

          {/* Course & Teacher - Simple */}
          <HStack spacing={4} fontSize="sm">
            <HStack spacing={2}>
              <Image
                src={lecture.course?.avatar || "https://via.placeholder.com/40"}
                alt={lecture.course?.title}
                w="40px"
                h="40px"
                borderRadius="md"
                objectFit="cover"
              />
              <VStack align="flex-start" spacing={0}>
                <Text fontSize="xs" color={subTextColor}>
                  الكورس
                </Text>
                <Text fontWeight="medium" color={textColor} noOfLines={1}>
                  {lecture.course?.title}
                </Text>
              </VStack>
            </HStack>
            <HStack spacing={2}>
              <Avatar
                src={lecture.teacher?.avatar}
                name={lecture.teacher?.name}
                size="sm"
                bg="green.500"
              />
              <VStack align="flex-start" spacing={0}>
                <Text fontSize="xs" color={subTextColor}>
                  المحاضر
                </Text>
                <Text fontWeight="medium" color={textColor} noOfLines={1}>
                  {lecture.teacher?.name}
                </Text>
              </VStack>
            </HStack>
          </HStack>

          {/* Simple Progress */}
          <Box>
            <HStack justify="space-between" mb={2} fontSize="xs">
              <Text color={subTextColor}>التقدم</Text>
              <HStack spacing={3}>
                <Text color="green.600" fontWeight="medium">
                  {lecture.statistics?.watched_videos || 0} تمت
                </Text>
                <Text
                  color={isPending ? "orange.600" : "gray.500"}
                  fontWeight="medium"
                >
                  {lecture.statistics?.remaining_videos || 0} متبقي
                </Text>
              </HStack>
            </HStack>
            <Progress
              value={lecture.statistics?.watch_percentage || 0}
              colorScheme={isPending ? "orange" : "green"}
              size="sm"
              borderRadius="full"
            />
          </Box>

          {/* Videos - Collapsible */}
          <Collapse in={expandedLectures[lecture.id]} animateOpacity>
            <Box mt={3} pt={3} borderTop="1px solid" borderColor={borderColor}>
              <Text fontSize="sm" fontWeight="bold" color={textColor} mb={3}>
                الفيديوهات ({lecture.videos?.length || 0})
              </Text>
              {lecture.videos && lecture.videos.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  {lecture.videos.map((video) => (
                    <Link
                      key={video.id}
                      to={`/video/${video.id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <Card
                        bg={useColorModeValue("gray.50", "gray.700")}
                        borderRadius="xl"
                        borderWidth="1px"
                        borderColor={
                          video.is_watched ? "green.300" : "orange.300"
                        }
                        _dark={{
                          borderColor: video.is_watched
                            ? "green.600"
                            : "orange.600",
                        }}
                        overflow="hidden"
                        cursor="pointer"
                        _hover={{
                          transform: "translateY(-2px)",
                          boxShadow: "md",
                          borderColor: video.is_watched
                            ? "green.400"
                            : "orange.400",
                        }}
                        transition="all 0.2s"
                      >
                        <HStack spacing={3} p={3}>
                          <Box position="relative" flexShrink={0}>
                            <Image
                              src={getYouTubeThumbnail(video.video_url)}
                              alt={video.title}
                              w="120px"
                              h="70px"
                              objectFit="cover"
                              borderRadius="md"
                              fallbackSrc="https://via.placeholder.com/120x70/4A90E2/FFFFFF?text=Video"
                              opacity={video.is_watched ? 0.6 : 1}
                            />
                            <Box
                              position="absolute"
                              top="50%"
                              left="50%"
                              transform="translate(-50%, -50%)"
                              bg="blackAlpha.700"
                              borderRadius="full"
                              p={1.5}
                            >
                              <Icon as={FaPlay} boxSize={3} color="white" />
                            </Box>
                            {video.is_watched && (
                              <Badge
                                position="absolute"
                                top={1}
                                right={1}
                                colorScheme="green"
                                borderRadius="full"
                                fontSize="2xs"
                                px={1.5}
                              >
                                <Icon as={FaCheckCircle} boxSize={2} />
                              </Badge>
                            )}
                          </Box>
                          <VStack align="flex-start" spacing={1} flex={1}>
                            <Text
                              fontSize="sm"
                              fontWeight="medium"
                              color={textColor}
                              noOfLines={2}
                            >
                              {video.title}
                            </Text>
                            {!video.is_watched && (
                              <Badge colorScheme="orange" fontSize="2xs">
                                لم يتم المشاهدة
                              </Badge>
                            )}
                          </VStack>
                        </HStack>
                      </Card>
                    </Link>
                  ))}
                </SimpleGrid>
              ) : (
                <Text
                  fontSize="sm"
                  color={subTextColor}
                  textAlign="center"
                  py={4}
                >
                  لا توجد فيديوهات متاحة
                </Text>
              )}
            </Box>
          </Collapse>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default LecturesTaple;
