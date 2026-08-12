import {
  Box,
  Button,
  Flex,
  Text,
  Badge,
  useColorModeValue,
  Skeleton,
  Center,
  HStack,
  Icon,
  VStack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import {
  FaPlay,
  FaPlayCircle,
  FaExternalLinkAlt,
  FaVideo,
  FaTimesCircle,
  FaClock,
  FaBroadcastTower,
  FaHourglassHalf,
  FaCheckCircle,
} from "react-icons/fa";
import baseUrl from "../../api/baseUrl";

const STREAM_REDIRECT_URL = import.meta.env.VITE_STREAM_REDIRECT_URL;

const STATUS_META = {
  started: { label: "مباشر", scheme: "red", icon: FaBroadcastTower },
  idle: { label: "انتظار", scheme: "orange", icon: FaHourglassHalf },
  ended: { label: "منتهي", scheme: "gray", icon: FaCheckCircle },
};

function LivePulseDot() {
  return (
    <Box position="relative" w={2} h={2} flexShrink={0}>
      <Box
        position="absolute"
        inset={0}
        borderRadius="full"
        bg="red.500"
        sx={{
          animation: "streamPing 1.4s cubic-bezier(0,0,0.2,1) infinite",
          "@keyframes streamPing": {
            "75%, 100%": { transform: "scale(2.2)", opacity: 0 },
          },
        }}
      />
      <Box position="absolute" inset={0} borderRadius="full" bg="red.500" />
    </Box>
  );
}

const fetchCourseStreams = async (courseId) => {
  const res = await baseUrl.get(`/api/meeting/course/${courseId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return res.data;
};

function StudentStreamRow({ stream }) {
  const meta = STATUS_META[stream.status] || STATUS_META.ended;
  const isLive = stream.status === "started";
  const isIdle = stream.status === "idle";
  const isEnded = stream.status === "ended";

  const rowBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.800", "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");

  return (
    <Box
      bg={rowBg}
      borderWidth="1px"
      borderColor={isLive ? "red.200" : border}
      borderRadius="xl"
      px={{ base: 3, md: 4 }}
      py={{ base: 3, md: 3.5 }}
      _hover={{ bg: hoverBg }}
      dir="rtl"
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "center" }}
        gap={3}
      >
        <HStack spacing={3} flex={1} minW={0}>
          <Center
            w={9}
            h={9}
            borderRadius="lg"
            bg={isLive ? "red.500" : isIdle ? "orange.100" : "gray.100"}
            color={isLive ? "white" : isIdle ? "orange.600" : "gray.500"}
            _dark={{
              bg: isLive ? "red.500" : isIdle ? "orange.900" : "whiteAlpha.200",
              color: isLive ? "white" : isIdle ? "orange.300" : "gray.400",
            }}
            flexShrink={0}
          >
            <Icon as={meta.icon} boxSize={3.5} />
          </Center>

          <Box minW={0} flex={1}>
            <HStack spacing={2} flexWrap="wrap" mb={0.5}>
              <Text fontWeight="700" fontSize="sm" color={titleColor} noOfLines={1}>
                {stream.title}
              </Text>
              <HStack spacing={1}>
                {isLive ? <LivePulseDot /> : null}
                <Badge
                  colorScheme={meta.scheme}
                  variant={isLive ? "solid" : "subtle"}
                  borderRadius="full"
                  px={2}
                  fontSize="10px"
                  fontWeight="700"
                  textTransform="none"
                >
                  {meta.label}
                </Badge>
              </HStack>
            </HStack>
            <HStack color={muted} spacing={1.5} fontSize="xs">
              <Icon as={FaClock} boxSize={2.5} />
              <Text>
                {new Date(stream.created_at || Date.now()).toLocaleDateString(
                  "ar-EG",
                  { year: "numeric", month: "short", day: "numeric" },
                )}
              </Text>
            </HStack>
          </Box>
        </HStack>

        <Flex gap={2}>
          {isLive ? (
            <Button
              as="a"
              href={`${STREAM_REDIRECT_URL}/${stream.id}?t=${localStorage.getItem("token")}`}
              target="_blank"
              rel="noopener noreferrer"
              leftIcon={<Icon as={FaPlay} boxSize={3} />}
              colorScheme="red"
              size="sm"
              borderRadius="lg"
              fontWeight="700"
              w={{ base: "full", md: "auto" }}
            >
              دخول المحاضرة
            </Button>
          ) : null}

          {isEnded && stream.egress_url ? (
            <Button
              as="a"
              href={stream.egress_url}
              target="_blank"
              rel="noopener noreferrer"
              leftIcon={<Icon as={FaExternalLinkAlt} boxSize={3} />}
              colorScheme="blue"
              variant="outline"
              size="sm"
              borderRadius="lg"
              fontWeight="700"
              w={{ base: "full", md: "auto" }}
            >
              مشاهدة التسجيل
            </Button>
          ) : null}
        </Flex>
      </Flex>
    </Box>
  );
}

const StudentStreamsList = ({ courseId }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["studentCourseStreams", courseId],
    queryFn: () => fetchCourseStreams(courseId),
  });

  const subTextColor = useColorModeValue("gray.500", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.800", "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const emptyIconBg = useColorModeValue("blue.50", "blue.900");
  const liveBg = useColorModeValue("red.50", "rgba(229,62,62,0.12)");

  const streams = data?.meetings || [];
  const startedStream = streams.find((s) => s.status === "started");

  if (isLoading) {
    return (
      <VStack spacing={2} align="stretch" dir="rtl">
        <Skeleton height="40px" borderRadius="lg" />
        <Skeleton height="72px" borderRadius="xl" />
        <Skeleton height="72px" borderRadius="xl" />
      </VStack>
    );
  }

  if (isError) {
    return (
      <Box textAlign="center" py={10} dir="rtl">
        <Icon as={FaTimesCircle} color="red.400" boxSize={8} mb={2} />
        <Text color="red.500" fontWeight="700" fontSize="sm">
          حدث خطأ أثناء تحميل الجلسات
        </Text>
      </Box>
    );
  }

  return (
    <Box dir="rtl">
      <Flex
        direction={{ base: "column", sm: "row" }}
        justify="space-between"
        align={{ base: "stretch", sm: "center" }}
        gap={3}
        mb={5}
        pb={4}
        borderBottomWidth="1px"
        borderColor={borderColor}
      >
        <HStack spacing={3} align="flex-start">
          <Center
            w={11}
            h={11}
            borderRadius="xl"
            bg={startedStream ? "red.500" : "blue.500"}
            color="white"
            flexShrink={0}
          >
            <Icon as={FaVideo} boxSize={5} />
          </Center>
          <Box>
            <Text fontWeight="800" fontSize="lg" color={titleColor}>
              المحاضرات المباشرة
            </Text>
            <Text fontSize="sm" color={muted}>
              انضم للبث أو شاهد التسجيلات السابقة
            </Text>
          </Box>
        </HStack>

        {startedStream ? (
          <HStack
            spacing={2}
            bg={liveBg}
            borderRadius="xl"
            px={3}
            py={2}
            flexWrap="wrap"
          >
            <HStack spacing={1.5}>
              <LivePulseDot />
              <Text fontSize="xs" fontWeight="700" color="red.600">
                مباشر الآن
              </Text>
            </HStack>
            <Button
              as="a"
              href={`${STREAM_REDIRECT_URL}/${startedStream.id}?t=${localStorage.getItem("token")}`}
              target="_blank"
              rel="noopener noreferrer"
              leftIcon={<Icon as={FaPlayCircle} boxSize={3} />}
              colorScheme="red"
              size="sm"
              borderRadius="lg"
              fontWeight="700"
            >
              متابعة
            </Button>
          </HStack>
        ) : (
          <Badge
            colorScheme="gray"
            variant="subtle"
            borderRadius="full"
            px={3}
            py={1.5}
            textTransform="none"
            fontWeight="700"
            alignSelf={{ base: "flex-start", sm: "center" }}
          >
            لا يوجد بث مباشر حالياً
          </Badge>
        )}
      </Flex>

      {streams.length > 0 ? (
        <VStack spacing={2} align="stretch">
          {streams.map((stream) => (
            <StudentStreamRow key={stream.id} stream={stream} />
          ))}
        </VStack>
      ) : (
        <Center py={8} flexDir="column" textAlign="center">
          <div className="mx-auto flex aspect-square w-64 items-center justify-center overflow-hidden rounded-full bg-black sm:w-80">
            <img
              src="/images/course-live-empty.jpg"
              alt="لا يوجد محاضرات مباشرة — سيتم إضافتها قريباً"
              className="h-full w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
        </Center>
      )}
    </Box>
  );
};

export default StudentStreamsList;
