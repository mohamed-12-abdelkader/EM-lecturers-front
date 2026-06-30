import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Badge,
  IconButton,
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
} from "react-icons/fa";
import baseUrl from "../../api/baseUrl";

const STREAM_REDIRECT_URL = import.meta.env.VITE_STREAM_REDIRECT_URL;

const statusLabel = {
  started: "مباشر",
  idle: "قيد الانتظار",
  ended: "انتهى",
};

const statusColor = {
  started: "green",
  idle: "orange",
  ended: "red",
};

const fetchCourseStreams = async (courseId) => {
  const res = await baseUrl.get(`/api/meeting/course/${courseId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  return res.data;
};

const StudentStreamsList = ({ courseId }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["studentCourseStreams", courseId],
    queryFn: () => fetchCourseStreams(courseId),
  });

  const subTextColor = useColorModeValue("gray.600", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "whiteAlpha.100");
  const headerBg = useColorModeValue("white", "gray.800");
  const topBarBg = useColorModeValue(
    "linear(to-r, blue.500, purple.500, orange.400)",
    "linear(to-r, blue.600, purple.600, orange.500)"
  );
  const streams = data?.meetings || [];

  const startedStream = streams.find((s) => s.status === "started");

  if (isLoading) {
    return (
      <Box mt={6} bg={headerBg} borderRadius="2xl" boxShadow="sm" border="1px solid" borderColor={borderColor} overflow="hidden">
        <Box h="10px" w="full" bg={topBarBg} />
        <Box p={{ base: 4, md: 5 }}>
          <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "flex-start", md: "center" }} gap={3}>
            <HStack spacing={3}>
              <Skeleton circle height="44px" width="44px" />
              <Box>
                <Skeleton height="18px" width="160px" />
                <Skeleton height="12px" width="220px" mt={2} />
              </Box>
            </HStack>
            <HStack spacing={3}>
              <Skeleton height="36px" width="150px" borderRadius="full" />
              <Skeleton height="36px" width="120px" borderRadius="full" />
            </HStack>
          </Flex>
          <VStack mt={5} spacing={4} align="stretch">
            <Skeleton height="120px" borderRadius="2xl" />
            <Skeleton height="120px" borderRadius="2xl" />
          </VStack>
        </Box>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box mt={6}>
        <Box
          textAlign="center"
          py={12}
          bg={useColorModeValue("red.50", "red.900")}
          borderRadius="2xl"
          border="1px dashed"
          borderColor={useColorModeValue("red.200", "red.700")}
        >
          <Icon as={FaTimesCircle} color={useColorModeValue("red.500", "red.300")} boxSize={12} mb={3} />
          <Text color={useColorModeValue("red.600", "red.200")} fontWeight="900">
            حدث خطأ أثناء تحميل الجلسات
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box mt={6}>
      {/* Header Card */}
      <Box
        bg={headerBg}
        borderRadius="2xl"
        border="1px solid"
        borderColor={borderColor}
        boxShadow="sm"
        overflow="hidden"
        mb={5}
      >
        <Box h="10px" w="full" bg={topBarBg} />
        <Box p={{ base: 4, md: 5 }}>
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap={3}
          >
            <HStack spacing={3}>
              <Center w="44px" h="44px" bg={useColorModeValue("blue.50", "blue.900")} borderRadius="xl">
                <Icon as={FaVideo} color={useColorModeValue("blue.500", "blue.300")} boxSize={6} />
              </Center>
              <Box>
                <Heading size="md" color={useColorModeValue("gray.800", "white")} mb={0.5}>
                  الجلسات المباشرة
                </Heading>
                <Text fontSize="sm" color={subTextColor}>
                  تابع الجلسة المتاحة الآن أو شاهد التسجيل عند انتهائها.
                </Text>
              </Box>
            </HStack>

            <HStack spacing={3} mt={{ base: 3, md: 0 }}>
              <Badge colorScheme="blue" borderRadius="full" px={4} py={2} fontWeight="900">
                {streams.length} جلسة
              </Badge>

              {startedStream ? (
                <Button
                  as="a"
                  href={`${STREAM_REDIRECT_URL}/${startedStream.id}?t=${localStorage.getItem("token")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  leftIcon={<Icon as={FaPlayCircle} />}
                  colorScheme="blue"
                  bg="blue.600"
                  color="white"
                  borderRadius="xl"
                  _hover={{ bg: "blue.700", transform: "translateY(-1px)" }}
                >
                  متابعة الآن
                </Button>
              ) : (
                <Badge
                  bg={useColorModeValue("orange.50", "orange.900")}
                  color={useColorModeValue("orange.500", "orange.300")}
                  px={4}
                  py={2}
                  borderRadius="full"
                  fontWeight="900"
                >
                  لا يوجد بث مباشر حالياً
                </Badge>
              )}
            </HStack>
          </Flex>
        </Box>
      </Box>

      {streams.length > 0 ? (
        <Flex direction="column" gap={4}>
          {streams.map((stream) => {
            const scheme = statusColor[stream.status] || "blue";
            const label = statusLabel[stream.status] || "—";

            return (
              <Flex
                key={stream.id}
                p={{ base: 4, md: 5 }}
                borderWidth="1px"
                borderColor={stream.status === "started" ? "red.200" : borderColor}
                borderRadius="2xl"
                boxShadow={stream.status === "started" ? "0 4px 20px rgba(229, 62, 62, 0.15)" : "sm"}
                bg={cardBg}
                direction={{ base: "column", md: "row" }}
                align={{ base: "stretch", md: "center" }}
                justify="space-between"
                gap={{ base: 4, md: 6 }}
                transition="all 0.3s ease"
                _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
                position="relative"
                overflow="hidden"
              >
                {stream.status === "started" && (
                  <Box position="absolute" top={0} right={0} width="4px" height="100%" bg="red.500" />
                )}

                {/* Icon + info */}
                <Flex gap={4} flex={1} align={{ base: "flex-start", md: "center" }}>
                  <Center
                    w={{ base: 12, md: 14 }}
                    h={{ base: 12, md: 14 }}
                    borderRadius="2xl"
                    bg={
                      stream.status === "started"
                        ? useColorModeValue("red.50", "red.900")
                        : useColorModeValue("blue.50", "blue.900")
                    }
                  >
                    <Icon
                      as={stream.status === "started" ? FaPlay : FaVideo}
                      boxSize={5}
                      color={
                        stream.status === "started"
                          ? useColorModeValue("red.500", "red.300")
                          : useColorModeValue("blue.500", "blue.300")
                      }
                    />
                  </Center>

                  <VStack align="start" spacing={2} flex={1}>
                    <Text fontSize="md" fontWeight="900" color={useColorModeValue("gray.800", "white")} noOfLines={1}>
                      {stream.title}
                    </Text>
                    <HStack spacing={3} flexWrap="wrap">
                      <Badge colorScheme={scheme} variant="subtle" borderRadius="full" px={3} py={1} fontSize="xs" fontWeight="900">
                        {label}
                      </Badge>
                      <HStack spacing={2}>
                        <Icon as={FaClock} color={useColorModeValue("gray.500", "gray.400")} boxSize={3} />
                        <Text fontSize="xs" color={subTextColor}>
                          {new Date(stream.created_at || Date.now()).toLocaleDateString("ar-EG")}
                        </Text>
                      </HStack>
                    </HStack>
                  </VStack>
                </Flex>

                {/* Actions */}
                <Flex align="center" gap={2} mt={{ base: 2, md: 0 }}>
                  {stream.status === "started" && (
                    <Button
                      as="a"
                      href={`${STREAM_REDIRECT_URL}/${stream.id}?t=${localStorage.getItem("token")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      leftIcon={<Icon as={FaPlay} />}
                      aria-label="دخول للمحاضرة"
                      colorScheme="red"
                      size="md"
                      borderRadius="xl"
                      boxShadow="0 4px 12px rgba(229, 62, 62, 0.4)"
                      _hover={{ transform: "translateY(-1px)" }}
                      w={{ base: "full", sm: "auto" }}
                      fontWeight="900"
                    >
                      دخول للمحاضرة
                    </Button>
                  )}

                  {stream.status === "ended" && stream.egress_url && (
                    <IconButton
                      as="a"
                      href={stream.egress_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      icon={<FaExternalLinkAlt />}
                      aria-label="مشاهدة التسجيل"
                      colorScheme="purple"
                      size="md"
                      borderRadius="xl"
                      variant="outline"
                      w={{ base: "full", sm: "auto" }}
                    />
                  )}
                </Flex>
              </Flex>
            );
          })}
        </Flex>
      ) : (
        <Flex
          direction="column"
          align="center"
          justify="center"
          py={16}
          bg={cardBg}
          borderRadius="2xl"
          border="2px dashed"
          borderColor={borderColor}
          textAlign="center"
        >
          <Box p={4} bg={useColorModeValue("blue.50", "blue.900")} borderRadius="full" mb={4}>
            <Icon as={FaVideo} color={useColorModeValue("blue.500", "blue.300")} boxSize={8} />
          </Box>
          <Text color={useColorModeValue("gray.600", "gray.400")} fontSize="lg" fontWeight="900">
            لا توجد جلسات مباشرة حالياً
          </Text>
          <Text color={useColorModeValue("gray.500", "gray.500")} fontSize="sm">
            عند بدء بث مباشر جديد سيظهر هنا تلقائياً.
          </Text>
        </Flex>
      )}
    </Box>
  );
};

export default StudentStreamsList;
