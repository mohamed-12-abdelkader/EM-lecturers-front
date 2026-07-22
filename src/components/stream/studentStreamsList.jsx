import {
  Box,
  Button,
  Flex,
  Heading,
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
  started: {
    label: "مباشر الآن",
    scheme: "red",
    icon: FaBroadcastTower,
  },
  idle: {
    label: "قيد الانتظار",
    scheme: "orange",
    icon: FaHourglassHalf,
  },
  ended: {
    label: "منتهي",
    scheme: "gray",
    icon: FaCheckCircle,
  },
};

function LivePulseDot() {
  return (
    <Box position="relative" w={2.5} h={2.5} flexShrink={0}>
      <Box
        position="absolute"
        inset={0}
        borderRadius="full"
        bg="red.500"
        sx={{
          animation: "streamPing 1.2s cubic-bezier(0,0,0.2,1) infinite",
          "@keyframes streamPing": {
            "75%, 100%": { transform: "scale(2.4)", opacity: 0 },
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

function StudentStreamCard({ stream }) {
  const meta = STATUS_META[stream.status] || STATUS_META.ended;
  const isLive = stream.status === "started";
  const isIdle = stream.status === "idle";
  const isEnded = stream.status === "ended";

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.900", "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const iconSoftBg = useColorModeValue(
    isLive ? "red.50" : isIdle ? "orange.50" : "gray.100",
    "whiteAlpha.100",
  );
  const barColor = useColorModeValue(
    isLive ? "red.500" : isIdle ? "orange.400" : "gray.200",
    isLive ? "red.500" : isIdle ? "orange.400" : "gray.600",
  );
  const actionsBg = useColorModeValue("gray.50", "whiteAlpha.50");

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={isLive ? "red.200" : border}
      borderRadius="2xl"
      overflow="hidden"
      boxShadow={
        isLive
          ? "0 8px 24px rgba(229,62,62,0.14)"
          : "0 1px 2px rgba(15,23,42,0.04)"
      }
      transition="all 0.2s ease"
      _hover={{
        transform: "translateY(-2px)",
        boxShadow: isLive
          ? "0 12px 28px rgba(229,62,62,0.18)"
          : "0 8px 18px rgba(15,23,42,0.07)",
      }}
    >
      <Box h="3px" bg={barColor} />
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "center" }}
        gap={4}
        p={{ base: 4, md: 5 }}
      >
        <HStack spacing={3.5} flex={1} minW={0} align="flex-start">
          <Center
            w={{ base: 12, md: 14 }}
            h={{ base: 12, md: 14 }}
            borderRadius="xl"
            bg={isLive ? "red.500" : iconSoftBg}
            color={isLive ? "white" : isIdle ? "orange.500" : "gray.500"}
            flexShrink={0}
            boxShadow={isLive ? "0 6px 16px rgba(229,62,62,0.35)" : "none"}
          >
            <Icon as={meta.icon} boxSize={{ base: 5, md: 6 }} />
          </Center>

          <VStack align="start" spacing={1.5} minW={0} flex={1}>
            <Text
              fontSize={{ base: "md", md: "lg" }}
              fontWeight="800"
              color={titleColor}
              noOfLines={2}
            >
              {stream.title}
            </Text>
            <HStack spacing={2} flexWrap="wrap">
              <HStack
                spacing={1.5}
                bg={isLive ? "red.50" : "transparent"}
                _dark={{ bg: isLive ? "rgba(229,62,62,0.15)" : "transparent" }}
                px={isLive ? 2.5 : 0}
                py={isLive ? 1 : 0}
                borderRadius="full"
              >
                {isLive && <LivePulseDot />}
                <Badge
                  colorScheme={meta.scheme}
                  variant={isLive ? "solid" : "subtle"}
                  borderRadius="full"
                  px={2.5}
                  fontSize="xs"
                  fontWeight="700"
                  textTransform="none"
                >
                  {meta.label}
                </Badge>
              </HStack>
              <HStack spacing={1.5} color={muted}>
                <Icon as={FaClock} boxSize={3} />
                <Text fontSize="xs">
                  {new Date(stream.created_at || Date.now()).toLocaleDateString(
                    "ar-EG",
                    { year: "numeric", month: "short", day: "numeric" },
                  )}
                </Text>
              </HStack>
            </HStack>
          </VStack>
        </HStack>

        <Flex
          align="center"
          gap={2}
          bg={{ base: actionsBg, md: "transparent" }}
          borderRadius={{ base: "xl", md: "none" }}
          p={{ base: 2.5, md: 0 }}
        >
          {isLive && (
            <Button
              as="a"
              href={`${STREAM_REDIRECT_URL}/${stream.id}?t=${localStorage.getItem("token")}`}
              target="_blank"
              rel="noopener noreferrer"
              leftIcon={<Icon as={FaPlay} boxSize={3} />}
              colorScheme="red"
              size="sm"
              borderRadius="xl"
              fontWeight="700"
              w={{ base: "full", md: "auto" }}
              boxShadow="0 4px 14px rgba(229,62,62,0.3)"
            >
              دخول المحاضرة
            </Button>
          )}

          {isEnded && stream.egress_url && (
            <Button
              as="a"
              href={stream.egress_url}
              target="_blank"
              rel="noopener noreferrer"
              leftIcon={<Icon as={FaExternalLinkAlt} boxSize={3} />}
              colorScheme="blue"
              variant="outline"
              size="sm"
              borderRadius="xl"
              fontWeight="700"
              w={{ base: "full", md: "auto" }}
            >
              مشاهدة التسجيل
            </Button>
          )}
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
  const titleColor = useColorModeValue("gray.900", "white");
  const iconBg = useColorModeValue("blue.50", "blue.900");
  const softPanel = useColorModeValue("gray.50", "whiteAlpha.50");
  const waitingBg = useColorModeValue("orange.50", "orange.900");
  const waitingColor = useColorModeValue("orange.600", "orange.300");
  const errorBg = useColorModeValue("red.50", "red.900");
  const errorBorder = useColorModeValue("red.200", "red.700");
  const errorIcon = useColorModeValue("red.500", "red.300");
  const errorText = useColorModeValue("red.600", "red.200");
  const emptyIconBg = useColorModeValue("blue.50", "blue.900");

  const streams = data?.meetings || [];
  const startedStream = streams.find((s) => s.status === "started");

  if (isLoading) {
    return (
      <Box
        mt={2}
        bg={cardBg}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor={borderColor}
        overflow="hidden"
      >
        <Box h="1" w="full" bgGradient="linear(to-r, blue.500, orange.500)" />
        <Box p={{ base: 4, md: 5 }}>
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            gap={3}
          >
            <HStack spacing={3}>
              <Skeleton borderRadius="xl" height="48px" width="48px" />
              <Box>
                <Skeleton height="18px" width="160px" />
                <Skeleton height="12px" width="220px" mt={2} />
              </Box>
            </HStack>
            <Skeleton height="36px" width="140px" borderRadius="xl" />
          </Flex>
          <VStack mt={5} spacing={3} align="stretch">
            <Skeleton height="110px" borderRadius="2xl" />
            <Skeleton height="110px" borderRadius="2xl" />
          </VStack>
        </Box>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box
        mt={2}
        textAlign="center"
        py={12}
        bg={errorBg}
        borderRadius="2xl"
        borderWidth="1px"
        borderStyle="dashed"
        borderColor={errorBorder}
      >
        <Icon as={FaTimesCircle} color={errorIcon} boxSize={10} mb={3} />
        <Text color={errorText} fontWeight="700">
          حدث خطأ أثناء تحميل الجلسات
        </Text>
      </Box>
    );
  }

  return (
    <Box mt={2} dir="rtl">
      <Box
        bg={cardBg}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor={startedStream ? "red.200" : borderColor}
        boxShadow={
          startedStream
            ? "0 10px 28px rgba(229,62,62,0.12)"
            : "0 1px 3px rgba(15,23,42,0.04)"
        }
        overflow="hidden"
        mb={5}
      >
        <Box h="1" w="full" bgGradient="linear(to-r, blue.500, orange.500)" />
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          gap={4}
          p={{ base: 4, md: 5 }}
        >
          <HStack spacing={3.5} align="flex-start" minW={0}>
            <Center
              w={{ base: 12, md: 14 }}
              h={{ base: 12, md: 14 }}
              borderRadius="xl"
              bg={startedStream ? "red.500" : iconBg}
              color={startedStream ? "white" : "blue.500"}
              flexShrink={0}
              boxShadow={
                startedStream ? "0 8px 18px rgba(229,62,62,0.35)" : "none"
              }
            >
              <Icon as={FaVideo} boxSize={{ base: 5, md: 6 }} />
            </Center>
            <VStack align="start" spacing={1} minW={0}>
              <Heading as="h2" size="md" fontWeight="800" color={titleColor}>
                الجلسات المباشرة
              </Heading>
              <Text fontSize="sm" color={subTextColor} lineHeight="1.7">
                انضم للبث الجاري أو شاهد تسجيل الجلسات السابقة
              </Text>
            </VStack>
          </HStack>

          <Box
            bg={softPanel}
            borderRadius="xl"
            px={{ base: 3, md: 4 }}
            py={3}
            borderWidth="1px"
            borderColor={borderColor}
          >
            <HStack spacing={3} flexWrap="wrap">
              <Badge
                colorScheme="blue"
                borderRadius="full"
                px={3}
                py={1.5}
                fontWeight="800"
                textTransform="none"
              >
                {streams.length} جلسة
              </Badge>

              {startedStream ? (
                <Button
                  as="a"
                  href={`${STREAM_REDIRECT_URL}/${startedStream.id}?t=${localStorage.getItem("token")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  leftIcon={<Icon as={FaPlayCircle} boxSize={3.5} />}
                  colorScheme="red"
                  borderRadius="xl"
                  fontWeight="700"
                  size="md"
                  boxShadow="0 4px 14px rgba(229,62,62,0.3)"
                >
                  متابعة الآن
                </Button>
              ) : (
                <Badge
                  bg={waitingBg}
                  color={waitingColor}
                  px={3}
                  py={1.5}
                  borderRadius="full"
                  fontWeight="800"
                  textTransform="none"
                >
                  لا يوجد بث مباشر
                </Badge>
              )}
            </HStack>
          </Box>
        </Flex>
      </Box>

      {streams.length > 0 ? (
        <VStack spacing={3} align="stretch">
          {streams.map((stream) => (
            <StudentStreamCard key={stream.id} stream={stream} />
          ))}
        </VStack>
      ) : (
        <Flex
          direction="column"
          align="center"
          justify="center"
          py={14}
          px={4}
          bg={cardBg}
          borderRadius="2xl"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor={borderColor}
          textAlign="center"
        >
          <Center p={4} bg={emptyIconBg} borderRadius="2xl" mb={4}>
            <Icon as={FaVideo} color="blue.500" boxSize={8} />
          </Center>
          <Text color={titleColor} fontSize="lg" fontWeight="800">
            لا توجد جلسات مباشرة حالياً
          </Text>
          <Text color={subTextColor} fontSize="sm" mt={1}>
            عند بدء المدرس بثاً جديداً سيظهر هنا
          </Text>
        </Flex>
      )}
    </Box>
  );
};

export default StudentStreamsList;
