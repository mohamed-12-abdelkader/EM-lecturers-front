import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  useColorModeValue,
  useDisclosure,
  Badge,
  Skeleton,
  Icon,
  VStack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import {
  FaPlayCircle,
  FaExternalLinkAlt,
  FaBroadcastTower,
  FaPlus,
} from "react-icons/fa";
import baseUrl from "../../api/baseUrl";
import CreateStreamModal from "./createModel";
import CourseStreamsList from "./courseStreamsList";

const STREAM_REDIRECT_URL = import.meta.env.VITE_STREAM_REDIRECT_URL;

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

function CourseStreams({ courseId }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.900", "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const iconBg = useColorModeValue("blue.50", "blue.900");
  const softPanel = useColorModeValue("gray.50", "whiteAlpha.50");
  const waitingBg = useColorModeValue("orange.50", "orange.900");
  const waitingColor = useColorModeValue("orange.600", "orange.300");

  const {
    data: stream,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["currStream"],
    queryFn: async () => {
      try {
        const res = await baseUrl.get("/api/meeting/me/current", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        return res.data.meeting;
      } catch (err) {
        if (err?.response?.status === 404) return null;
        throw err;
      }
    },
    refetchInterval: 10000,
  });

  const hasActiveStream = stream && stream.status !== "ended";
  const isLive = stream?.status === "started";

  return (
    <Box dir="rtl">
      <Box
        bg={cardBg}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor={isLive ? "red.200" : border}
        boxShadow={
          isLive
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
            <Flex
              align="center"
              justify="center"
              w={{ base: 12, md: 14 }}
              h={{ base: 12, md: 14 }}
              borderRadius="xl"
              bg={isLive ? "red.500" : iconBg}
              color={isLive ? "white" : "blue.500"}
              flexShrink={0}
              boxShadow={isLive ? "0 8px 18px rgba(229,62,62,0.35)" : "none"}
            >
              <Icon as={FaBroadcastTower} boxSize={{ base: 5, md: 6 }} />
            </Flex>

            <VStack align="start" spacing={1} minW={0}>
              <Heading
                as="h2"
                size="md"
                fontWeight="800"
                color={titleColor}
                lineHeight="short"
              >
                الجلسات المباشرة
              </Heading>
              <Text fontSize="sm" color={muted} lineHeight="1.7">
                أنشئ بثاً مباشراً أو انضم للجلسة الجارية داخل الكورس
              </Text>
              {hasActiveStream && stream?.title ? (
                <Text
                  fontSize="sm"
                  fontWeight="700"
                  color={isLive ? "red.500" : "blue.500"}
                  noOfLines={1}
                  mt={0.5}
                >
                  الجلسة الحالية: {stream.title}
                </Text>
              ) : null}
            </VStack>
          </HStack>

          <Box
            bg={softPanel}
            borderRadius="xl"
            px={{ base: 3, md: 4 }}
            py={3}
            borderWidth="1px"
            borderColor={border}
          >
            {isLoading ? (
              <HStack spacing={3}>
                <Skeleton height="36px" width="110px" borderRadius="xl" />
                <Skeleton height="36px" width="140px" borderRadius="xl" />
              </HStack>
            ) : isError ? (
              <Text color="red.500" fontWeight="700" fontSize="sm">
                تعذر تحميل حالة البث
              </Text>
            ) : hasActiveStream ? (
              <HStack spacing={3} flexWrap="wrap">
                <HStack
                  spacing={2}
                  bg={isLive ? "red.50" : waitingBg}
                  color={isLive ? "red.500" : waitingColor}
                  _dark={{
                    bg: isLive ? "rgba(229,62,62,0.15)" : waitingBg,
                  }}
                  px={3}
                  py={1.5}
                  borderRadius="full"
                >
                  {isLive && <LivePulseDot />}
                  <Text fontSize="xs" fontWeight="800">
                    {isLive ? "مباشر الآن" : "قيد الانتظار"}
                  </Text>
                </HStack>

                <Button
                  as="a"
                  href={`${STREAM_REDIRECT_URL}/${stream.id}?t=${localStorage.getItem("token")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  leftIcon={<Icon as={FaExternalLinkAlt} boxSize={3.5} />}
                  colorScheme={isLive ? "red" : "blue"}
                  borderRadius="xl"
                  fontWeight="700"
                  size="md"
                  boxShadow={
                    isLive ? "0 4px 14px rgba(229,62,62,0.3)" : "sm"
                  }
                >
                  دخول غرفة البث
                </Button>
              </HStack>
            ) : (
              <HStack spacing={3} flexWrap="wrap">
                <Badge
                  bg={waitingBg}
                  color={waitingColor}
                  px={3}
                  py={1.5}
                  borderRadius="full"
                  fontWeight="800"
                  textTransform="none"
                >
                  لا يوجد بث نشط
                </Badge>
                <Button
                  leftIcon={<Icon as={FaPlus} boxSize={3.5} />}
                  colorScheme="orange"
                  onClick={onOpen}
                  borderRadius="xl"
                  fontWeight="700"
                  size="md"
                  shadow="sm"
                >
                  إنشاء جلسة
                </Button>
              </HStack>
            )}
          </Box>
        </Flex>
      </Box>

      <CourseStreamsList courseId={courseId} onCreateClick={onOpen} />

      <CreateStreamModal
        courseId={courseId}
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={() => {
          onClose();
          refetch();
        }}
      />
    </Box>
  );
}

export default CourseStreams;
