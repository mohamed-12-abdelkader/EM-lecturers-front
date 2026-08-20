import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Image,
  Avatar,
  Badge,
  Progress,
  Icon,
  Center,
  useColorModeValue,
  Flex,
  Collapse,
  Button,
  SimpleGrid,
  Container,
  Circle,
} from "@chakra-ui/react";
import {
  FaPlay,
  FaCheckCircle,
  FaBook,
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
  FaTrophy,
  FaVideo,
} from "react-icons/fa";
import { getYouTubeVideoId } from "../../utils/youtubeEmbed";
import { MdSchedule, MdReplay } from "react-icons/md";
import { Link } from "react-router-dom";
import baseUrl from "../../api/baseUrl";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";

const FILTERS = [
  { id: "pending", label: "المتراكمة", colorScheme: "orange" },
  { id: "completed", label: "المكتملة", colorScheme: "green" },
  { id: "all", label: "الكل", colorScheme: "blue" },
];

const LecturesTaple = () => {
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedLectures, setExpandedLectures] = useState({});
  const [totalLectures, setTotalLectures] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [filter, setFilter] = useState("pending");

  const pageBg = useColorModeValue("#F4F7FB", "gray.950");
  const cardBg = useColorModeValue("white", "gray.900");
  const textColor = useColorModeValue("slate.800", "white");
  const muted = useColorModeValue("slate.500", "gray.400");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
  const softBlue = useColorModeValue("blue.50", "blue.950");
  const softOrange = useColorModeValue("orange.50", "orange.950");
  const softGreen = useColorModeValue("green.50", "green.950");
  const chipIdleBg = useColorModeValue("white", "gray.800");
  const chipIdleBorder = useColorModeValue("gray.200", "gray.700");

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
    } catch (err) {
      console.error("Error fetching lectures:", err);
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
      return new Date(dateStr).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getYouTubeThumbnail = (url) => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
  };

  const isLectureComplete = (lecture) => {
    const remaining = lecture.statistics?.remaining_videos || 0;
    const watchPercentage = lecture.statistics?.watch_percentage || 0;
    return remaining === 0 && watchPercentage === 100;
  };

  const completedLectures = useMemo(
    () => lectures.filter(isLectureComplete),
    [lectures],
  );

  const pendingLectures = useMemo(
    () => lectures.filter((l) => !isLectureComplete(l)),
    [lectures],
  );

  const sortedPendingLectures = useMemo(
    () =>
      [...pendingLectures].sort(
        (a, b) =>
          (b.statistics?.remaining_videos || 0) - (a.statistics?.remaining_videos || 0),
      ),
    [pendingLectures],
  );

  const totalPendingVideos = useMemo(
    () => pendingLectures.reduce((sum, l) => sum + (l.statistics?.remaining_videos || 0), 0),
    [pendingLectures],
  );

  const totalWatchedVideos = useMemo(
    () => lectures.reduce((sum, l) => sum + (l.statistics?.watched_videos || 0), 0),
    [lectures],
  );

  const overallProgress = useMemo(() => {
    if (!lectures.length) return 0;
    const sum = lectures.reduce((acc, l) => acc + (l.statistics?.watch_percentage || 0), 0);
    return Math.round(sum / lectures.length);
  }, [lectures]);

  const filteredList = useMemo(() => {
    if (filter === "completed") return completedLectures;
    if (filter === "pending") return sortedPendingLectures;
    return lectures;
  }, [filter, completedLectures, sortedPendingLectures, lectures]);

  const heroMessage = useMemo(() => {
    if (!lectures.length) return "اشترك في كورس لتظهر محاضراتك هنا وتبدأ رحلة التعلم.";
    if (totalPendingVideos === 0) return "أحسنت! أنهيت كل المحاضرات الحالية — استمر في التقدم.";
    if (overallProgress >= 70) return "قربت تخلّص — كمّل الفيديوهات المتبقية وارتفع مستواك.";
    return "نظّم وقتك وشاهد المتراكم أولاً لتعود على المسار بسرعة.";
  }, [lectures.length, totalPendingVideos, overallProgress]);

  if (loading) return <BrandLoadingScreen />;

  if (error) {
    return (
      <Box minH="100vh" bg={pageBg} pt="100px" pb={12} dir="rtl">
        <Container maxW="container.md">
          <Center minH="50vh">
            <VStack
              spacing={5}
              p={10}
              bg={cardBg}
              borderRadius="3xl"
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="xl"
              maxW="420px"
              w="full"
            >
              <Circle size="64px" bg="red.50" color="red.500">
                <Icon as={MdSchedule} boxSize={8} />
              </Circle>
              <Text color={textColor} fontWeight="bold" fontSize="lg" textAlign="center">
                {error}
              </Text>
              <Button
                leftIcon={<Icon as={MdReplay} />}
                colorScheme="blue"
                borderRadius="xl"
                onClick={fetchLectures}
              >
                إعادة المحاولة
              </Button>
            </VStack>
          </Center>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={pageBg} pb={{ base: 28, lg: 12 }} dir="rtl">
      {/* Hero */}
      <Box position="relative" overflow="hidden" mb={6}>
        <Box
          position="absolute"
          inset={0}
          bgGradient="linear(135deg, #1D4ED8 0%, #2563EB 45%, #0EA5E9 100%)"
        />
        <Box
          position="absolute"
          top="-48px"
          left="-24px"
          w="240px"
          h="240px"
          borderRadius="full"
          bg="whiteAlpha.200"
          pointerEvents="none"
        />
        <Box
          position="absolute"
          bottom="-70px"
          right="-30px"
          w="280px"
          h="280px"
          borderRadius="full"
          bg="orange.400"
          opacity={0.2}
          pointerEvents="none"
        />

        <Container maxW="container.xl" position="relative" py={{ base: 8, md: 10 }} px={{ base: 4, md: 6 }}>
          <Flex
            direction={{ base: "column", md: "row" }}
            align={{ base: "stretch", md: "center" }}
            justify="space-between"
            gap={6}
          >
            <VStack align="flex-start" spacing={3} flex={1}>
              <HStack spacing={2} bg="whiteAlpha.200" px={3} py={1} borderRadius="full">
                <Icon as={MdSchedule} color="white" boxSize={4} />
                <Text fontSize="xs" fontWeight="bold" color="white">
                  جدول المحاضرات
                </Text>
              </HStack>
              <Text
                fontSize={{ base: "2xl", md: "3xl" }}
                fontWeight="black"
                color="white"
                letterSpacing="-0.02em"
                lineHeight="1.25"
              >
                خطّة مشاهدتك الدراسية
              </Text>
              <Text fontSize={{ base: "sm", md: "md" }} color="whiteAlpha.850" maxW="540px" lineHeight="1.8">
                {heroMessage}
              </Text>
            </VStack>

            <Flex
              align="center"
              gap={4}
              bg="whiteAlpha.15"
              borderWidth="1px"
              borderColor="whiteAlpha.300"
              borderRadius="2xl"
              px={{ base: 4, md: 5 }}
              py={4}
              backdropFilter="blur(12px)"
              minW={{ md: "230px" }}
            >
              <Box position="relative" boxSize="84px">
                <svg viewBox="0 0 36 36" width="84" height="84" style={{ transform: "rotate(-90deg)" }}>
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#FDBA74"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${overallProgress}, 100`}
                  />
                </svg>
                <VStack position="absolute" inset={0} spacing={0} align="center" justify="center">
                  <Text color="white" fontSize="xl" fontWeight="black" lineHeight="1">
                    {overallProgress}%
                  </Text>
                  <Text color="whiteAlpha.800" fontSize="10px" fontWeight="semibold">
                    الإنجاز
                  </Text>
                </VStack>
              </Box>
              <VStack align="flex-start" spacing={1}>
                <Text color="white" fontSize="sm" fontWeight="bold">
                  متوسط تقدّمك
                </Text>
                <Text color="whiteAlpha.800" fontSize="xs" lineHeight="1.6">
                  {completedLectures.length} مكتملة من {lectures.length}
                </Text>
              </VStack>
            </Flex>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.xl" px={{ base: 4, md: 6 }}>
        {/* Stats */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 3, md: 4 }} mb={6}>
          <StatCard
            label="الكورسات"
            value={totalCourses}
            icon={FaBook}
            accent="blue"
            cardBg={cardBg}
            borderColor={borderColor}
            textColor={textColor}
            muted={muted}
          />
          <StatCard
            label="المحاضرات"
            value={totalLectures}
            icon={MdSchedule}
            accent="orange"
            cardBg={cardBg}
            borderColor={borderColor}
            textColor={textColor}
            muted={muted}
          />
          <StatCard
            label="تمت مشاهدتها"
            value={totalWatchedVideos}
            icon={FaCheckCircle}
            accent="green"
            cardBg={cardBg}
            borderColor={borderColor}
            textColor={textColor}
            muted={muted}
          />
          <StatCard
            label={totalPendingVideos > 0 ? "فيديوهات متراكمة" : "لا متراكم"}
            value={totalPendingVideos}
            icon={totalPendingVideos > 0 ? FaExclamationTriangle : FaTrophy}
            accent={totalPendingVideos > 0 ? "orange" : "green"}
            cardBg={cardBg}
            borderColor={borderColor}
            textColor={textColor}
            muted={muted}
          />
        </SimpleGrid>

        {lectures.length === 0 ? (
          <Center
            py={16}
            bg={cardBg}
            borderRadius="2xl"
            borderWidth="1px"
            borderColor={borderColor}
            borderStyle="dashed"
          >
            <VStack spacing={4} px={4}>
              <Circle size="80px" bg={softBlue} color="blue.500">
                <Icon as={MdSchedule} boxSize={9} />
              </Circle>
              <Text fontSize="lg" fontWeight="black" color={textColor}>
                لا توجد محاضرات متاحة
              </Text>
              <Text color={muted} textAlign="center" maxW="420px" fontSize="sm" lineHeight="1.8">
                لم يتم العثور على محاضرات في جدولك. اشترك في كورس أولاً لتظهر هنا.
              </Text>
              <Button as={Link} to="/my-courses" colorScheme="blue" borderRadius="xl">
                الذهاب لكورساتي
              </Button>
            </VStack>
          </Center>
        ) : (
          <>
            <Flex
              align={{ base: "stretch", sm: "center" }}
              justify="space-between"
              direction={{ base: "column", sm: "row" }}
              gap={3}
              mb={4}
            >
              <VStack align="flex-start" spacing={0}>
                <Text fontSize="lg" fontWeight="black" color={textColor}>
                  محاضراتك
                </Text>
                <Text fontSize="sm" color={muted}>
                  {filteredList.length} محاضرة معروضة
                </Text>
              </VStack>

              <HStack
                spacing={2}
                overflowX="auto"
                pb={1}
                sx={{ "&::-webkit-scrollbar": { display: "none" } }}
              >
                {FILTERS.map((item) => {
                  const active = filter === item.id;
                  const count =
                    item.id === "pending"
                      ? pendingLectures.length
                      : item.id === "completed"
                        ? completedLectures.length
                        : lectures.length;
                  return (
                    <Button
                      key={item.id}
                      size="sm"
                      borderRadius="full"
                      fontWeight="bold"
                      px={4}
                      flexShrink={0}
                      variant={active ? "solid" : "outline"}
                      colorScheme={active ? item.colorScheme : "gray"}
                      bg={active ? undefined : chipIdleBg}
                      borderColor={active ? undefined : chipIdleBorder}
                      onClick={() => setFilter(item.id)}
                      rightIcon={
                        <Badge
                          ml={1}
                          borderRadius="full"
                          colorScheme={active ? "blackAlpha" : item.colorScheme}
                          variant={active ? "solid" : "subtle"}
                        >
                          {count}
                        </Badge>
                      }
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </HStack>
            </Flex>

            <VStack spacing={3.5} align="stretch">
              {filteredList.length === 0 ? (
                <EmptyFilterState
                  filter={filter}
                  cardBg={cardBg}
                  borderColor={borderColor}
                  textColor={textColor}
                  muted={muted}
                  softGreen={softGreen}
                  softBlue={softBlue}
                />
              ) : (
                filteredList.map((lecture) => (
                  <LectureCard
                    key={lecture.id}
                    lecture={lecture}
                    isPending={!isLectureComplete(lecture)}
                    expanded={!!expandedLectures[lecture.id]}
                    onToggle={() => toggleLecture(lecture.id)}
                    getYouTubeThumbnail={getYouTubeThumbnail}
                    formatDate={formatDate}
                    cardBg={cardBg}
                    textColor={textColor}
                    muted={muted}
                    borderColor={borderColor}
                    softBlue={softBlue}
                    softOrange={softOrange}
                    softGreen={softGreen}
                  />
                ))
              )}
            </VStack>
          </>
        )}
      </Container>
    </Box>
  );
};

function StatCard({ label, value, icon: IconComp, accent, cardBg, borderColor, textColor, muted }) {
  const tones = {
    blue: { bg: "blue.50", color: "blue.500", darkBg: "blue.900" },
    green: { bg: "green.50", color: "green.500", darkBg: "green.900" },
    orange: { bg: "orange.50", color: "orange.500", darkBg: "orange.900" },
  };
  const tone = tones[accent] || tones.blue;
  const iconBg = useColorModeValue(tone.bg, tone.darkBg);
  const shadow = useColorModeValue("sm", "none");

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="2xl"
      p={{ base: 3.5, md: 4 }}
      boxShadow={shadow}
      transition="all 0.2s"
      _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
    >
      <HStack spacing={3} align="center">
        <Flex
          w="42px"
          h="42px"
          borderRadius="xl"
          bg={iconBg}
          color={tone.color}
          align="center"
          justify="center"
          flexShrink={0}
        >
          <Icon as={IconComp} boxSize={5} />
        </Flex>
        <VStack align="flex-start" spacing={0} minW={0}>
          <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="black" color={textColor} lineHeight="1.1">
            {value}
          </Text>
          <Text fontSize="xs" color={muted} fontWeight="medium" noOfLines={1}>
            {label}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
}

function EmptyFilterState({ filter, cardBg, borderColor, textColor, muted, softGreen, softBlue }) {
  const isPending = filter === "pending";
  return (
    <Center
      py={14}
      bg={cardBg}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={borderColor}
      borderStyle="dashed"
    >
      <VStack spacing={3} px={4}>
        <Circle size="72px" bg={isPending ? softGreen : softBlue} color={isPending ? "green.500" : "blue.500"}>
          <Icon as={isPending ? FaTrophy : FaVideo} boxSize={8} />
        </Circle>
        <Text fontWeight="black" color={textColor} textAlign="center">
          {isPending ? "لا توجد محاضرات متراكمة" : "لا توجد محاضرات مكتملة بعد"}
        </Text>
        <Text color={muted} fontSize="sm" textAlign="center" maxW="420px" lineHeight="1.7">
          {isPending
            ? "أحسنت — أنهيت كل المحاضرات الحالية. استمر بنفس الإيقاع."
            : "ابدأ بمشاهدة المتراكم لترى تقدّمك هنا."}
        </Text>
      </VStack>
    </Center>
  );
}

function LectureCard({
  lecture,
  isPending,
  expanded,
  onToggle,
  getYouTubeThumbnail,
  formatDate,
  cardBg,
  textColor,
  muted,
  borderColor,
  softBlue,
  softOrange,
  softGreen,
}) {
  const cardShadow = useColorModeValue("0 8px 24px rgba(15,23,42,0.04)", "none");
  const hoverBorder = useColorModeValue(isPending ? "orange.200" : "green.200", isPending ? "orange.700" : "green.700");
  const hoverShadow = useColorModeValue("0 14px 32px rgba(37,99,235,0.08)", "lg");
  const progressTrack = useColorModeValue("gray.100", "gray.800");
  const videoCardBg = useColorModeValue("gray.50", "gray.800");
  const videoBorderWatched = useColorModeValue("green.200", "green.700");
  const videoBorderPending = useColorModeValue("orange.200", "orange.700");

  const watchPct = lecture.statistics?.watch_percentage || 0;
  const watched = lecture.statistics?.watched_videos || 0;
  const remaining = lecture.statistics?.remaining_videos || 0;
  const statusColor = isPending ? "orange" : "green";

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="2xl"
      overflow="hidden"
      boxShadow={cardShadow}
      transition="all 0.2s ease"
      _hover={{ borderColor: hoverBorder, transform: "translateY(-2px)", boxShadow: hoverShadow }}
    >
      <Box h="3px" bg={`${statusColor}.400`} />

      <Box p={{ base: 4, md: 5 }}>
        <Flex
          direction={{ base: "column", md: "row" }}
          align={{ base: "stretch", md: "flex-start" }}
          gap={4}
        >
          <Flex
            w={{ base: "full", md: "92px" }}
            minH={{ base: "70px", md: "92px" }}
            borderRadius="2xl"
            bg={isPending ? softOrange : softGreen}
            color={`${statusColor}.500`}
            align="center"
            justify="center"
            direction="column"
            flexShrink={0}
            gap={0.5}
          >
            <Text fontSize="2xl" fontWeight="black" color={textColor} lineHeight="1">
              {watchPct}%
            </Text>
            <Text fontSize="10px" fontWeight="bold">
              {isPending ? "متراكمة" : "مكتملة"}
            </Text>
          </Flex>

          <VStack align="stretch" spacing={3} flex={1} minW={0}>
            <Flex justify="space-between" align="flex-start" gap={3}>
              <VStack align="flex-start" spacing={2} minW={0} flex={1}>
                <HStack spacing={2} flexWrap="wrap">
                  <Badge borderRadius="full" colorScheme="blue" variant="subtle" fontSize="10px" px={2.5}>
                    #{lecture.position}
                  </Badge>
                  <Badge borderRadius="full" colorScheme={statusColor} fontSize="10px" px={2.5}>
                    {isPending ? "متراكمة" : "مكتملة"}
                  </Badge>
                  {isPending && remaining > 0 ? (
                    <Badge borderRadius="full" colorScheme="red" fontSize="10px" px={2.5}>
                      {remaining} فيديو متبقي
                    </Badge>
                  ) : null}
                </HStack>
                <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color={textColor} noOfLines={2}>
                  {lecture.title}
                </Text>
              </VStack>

              <Button
                onClick={onToggle}
                size="sm"
                variant="ghost"
                colorScheme="blue"
                borderRadius="lg"
                leftIcon={expanded ? <FaChevronUp /> : <FaChevronDown />}
                flexShrink={0}
              >
                {expanded ? "إخفاء" : "الفيديوهات"}
              </Button>
            </Flex>

            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
              <HStack
                spacing={3}
                p={2.5}
                borderRadius="xl"
                bg={softBlue}
                borderWidth="1px"
                borderColor={borderColor}
              >
                <Image
                  src={lecture.course?.avatar || "https://via.placeholder.com/40"}
                  alt={lecture.course?.title || "كورس"}
                  w="40px"
                  h="40px"
                  borderRadius="lg"
                  objectFit="cover"
                  flexShrink={0}
                />
                <VStack align="flex-start" spacing={0} minW={0}>
                  <Text fontSize="10px" color={muted} fontWeight="semibold">
                    الكورس
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" color={textColor} noOfLines={1}>
                    {lecture.course?.title || "—"}
                  </Text>
                </VStack>
              </HStack>

              <HStack
                spacing={3}
                p={2.5}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={borderColor}
              >
                <Avatar
                  src={lecture.teacher?.avatar}
                  name={lecture.teacher?.name}
                  size="sm"
                  bg="blue.500"
                />
                <VStack align="flex-start" spacing={0} minW={0}>
                  <Text fontSize="10px" color={muted} fontWeight="semibold">
                    المحاضر
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" color={textColor} noOfLines={1}>
                    {lecture.teacher?.name || "—"}
                  </Text>
                </VStack>
              </HStack>
            </SimpleGrid>

            <Box>
              <Flex justify="space-between" mb={1.5} fontSize="xs">
                <Text color={muted}>التقدّم</Text>
                <HStack spacing={3}>
                  <Text color="green.500" fontWeight="bold">
                    {watched} تمت
                  </Text>
                  <Text color={isPending ? "orange.500" : muted} fontWeight="bold">
                    {remaining} متبقي
                  </Text>
                </HStack>
              </Flex>
              <Progress
                value={watchPct}
                size="sm"
                borderRadius="full"
                colorScheme={isPending ? "orange" : "green"}
                bg={progressTrack}
              />
            </Box>
          </VStack>
        </Flex>

        <Collapse in={expanded} animateOpacity>
          <Box mt={4} pt={4} borderTopWidth="1px" borderColor={borderColor}>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontSize="sm" fontWeight="black" color={textColor}>
                فيديوهات المحاضرة ({lecture.videos?.length || 0})
              </Text>
              {lecture.created_at || lecture.release_date ? (
                <Text fontSize="xs" color={muted}>
                  {formatDate(lecture.release_date || lecture.created_at)}
                </Text>
              ) : null}
            </Flex>

            {lecture.videos?.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                {lecture.videos.map((video) => (
                  <Link key={video.id} to={`/video/${video.id}`} style={{ textDecoration: "none" }}>
                    <HStack
                      spacing={3}
                      p={2.5}
                      bg={videoCardBg}
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor={video.is_watched ? videoBorderWatched : videoBorderPending}
                      transition="all 0.2s"
                      _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
                    >
                      <Box position="relative" flexShrink={0}>
                        <Image
                          src={getYouTubeThumbnail(video.video_url)}
                          alt={video.title}
                          w="112px"
                          h="64px"
                          objectFit="cover"
                          borderRadius="lg"
                          fallbackSrc="https://via.placeholder.com/112x64/2563EB/FFFFFF?text=Video"
                          opacity={video.is_watched ? 0.72 : 1}
                        />
                        <Circle
                          size="28px"
                          bg="blackAlpha.700"
                          color="white"
                          position="absolute"
                          top="50%"
                          left="50%"
                          transform="translate(-50%, -50%)"
                        >
                          <Icon as={FaPlay} boxSize={2.5} />
                        </Circle>
                        {video.is_watched ? (
                          <Badge
                            position="absolute"
                            top={1}
                            right={1}
                            colorScheme="green"
                            borderRadius="full"
                            fontSize="2xs"
                            px={1.5}
                          >
                            <Icon as={FaCheckCircle} boxSize={2.5} />
                          </Badge>
                        ) : null}
                      </Box>
                      <VStack align="flex-start" spacing={1} flex={1} minW={0}>
                        <Text fontSize="sm" fontWeight="bold" color={textColor} noOfLines={2}>
                          {video.title}
                        </Text>
                        <Badge
                          colorScheme={video.is_watched ? "green" : "orange"}
                          borderRadius="full"
                          fontSize="2xs"
                        >
                          {video.is_watched ? "تمت المشاهدة" : "لم تُشاهد"}
                        </Badge>
                      </VStack>
                    </HStack>
                  </Link>
                ))}
              </SimpleGrid>
            ) : (
              <Text fontSize="sm" color={muted} textAlign="center" py={4}>
                لا توجد فيديوهات متاحة لهذه المحاضرة
              </Text>
            )}
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
}

export default LecturesTaple;
