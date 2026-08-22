import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  useColorModeValue,
  useDisclosure,
  Skeleton,
  Icon,
  VStack,
} from "@chakra-ui/react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FaExternalLinkAlt,
  FaBroadcastTower,
  FaPlus,
} from "react-icons/fa";
import baseUrl from "../../api/baseUrl";
import CreateStreamModal from "./createModel";
import CourseStreamsList from "./courseStreamsList";
import {
  TOUR_CLOSE_CREATE_STREAM,
  TOUR_OPEN_CREATE_STREAM,
} from "../../utils/teacherCoursePageTour";

const STREAM_REDIRECT_URL = import.meta.env.VITE_STREAM_REDIRECT_URL;

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

function CourseStreams({ courseId }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    const openStream = () => onOpen();
    const closeStream = () => onClose();
    window.addEventListener(TOUR_OPEN_CREATE_STREAM, openStream);
    window.addEventListener(TOUR_CLOSE_CREATE_STREAM, closeStream);
    return () => {
      window.removeEventListener(TOUR_OPEN_CREATE_STREAM, openStream);
      window.removeEventListener(TOUR_CLOSE_CREATE_STREAM, closeStream);
    };
  }, [onOpen, onClose]);

  const border = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.900", "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const barBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const liveBg = useColorModeValue("red.50", "rgba(229,62,62,0.12)");
  const idleBg = useColorModeValue("orange.50", "orange.900");

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
      {/* عنوان القسم مرة واحدة فقط */}
      <Flex
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "stretch", md: "center" }}
        gap={4}
        mb={5}
        pb={4}
        borderBottomWidth="1px"
        borderColor={border}
      >
        <HStack spacing={3} align="flex-start" minW={0}>
          <Flex
            align="center"
            justify="center"
            w={11}
            h={11}
            borderRadius="xl"
            bg={isLive ? "red.500" : "blue.500"}
            color="white"
            flexShrink={0}
          >
            <Icon as={FaBroadcastTower} boxSize={5} />
          </Flex>
          <VStack align="start" spacing={0.5} minW={0}>
            <Heading as="h2" size="md" fontWeight="800" color={titleColor}>
              المحاضرات المباشرة
            </Heading>
            <Text fontSize="sm" color={muted}>
              أنشئ جلسة بث أو انضم للجلسة الجارية
            </Text>
          </VStack>
        </HStack>

        <Box
          bg={barBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={border}
          px={3}
          py={2.5}
        >
          {isLoading ? (
            <HStack spacing={2}>
              <Skeleton height="36px" width="100px" borderRadius="lg" />
              <Skeleton height="36px" width="120px" borderRadius="lg" />
            </HStack>
          ) : isError ? (
            <Text color="red.500" fontWeight="600" fontSize="sm">
              تعذر تحميل حالة البث
            </Text>
          ) : hasActiveStream ? (
            <HStack spacing={2} flexWrap="wrap">
              <HStack
                spacing={1.5}
                bg={isLive ? liveBg : idleBg}
                color={isLive ? "red.600" : "orange.600"}
                px={2.5}
                py={1}
                borderRadius="full"
              >
                {isLive ? <LivePulseDot /> : null}
                <Text fontSize="xs" fontWeight="700">
                  {isLive ? "مباشر" : "انتظار"}
                  {stream?.title ? ` · ${stream.title}` : ""}
                </Text>
              </HStack>
              <Button
                as="a"
                href={`${STREAM_REDIRECT_URL}/${stream.id}?t=${localStorage.getItem("token")}`}
                target="_blank"
                rel="noopener noreferrer"
                leftIcon={<Icon as={FaExternalLinkAlt} boxSize={3} />}
                colorScheme={isLive ? "red" : "blue"}
                borderRadius="xl"
                fontWeight="700"
                size="sm"
              >
                دخول الغرفة
              </Button>
            </HStack>
          ) : (
            <Button
              data-tour-id="course-create-stream-btn"
              leftIcon={<Icon as={FaPlus} boxSize={3} />}
              colorScheme="orange"
              onClick={onOpen}
              borderRadius="xl"
              fontWeight="700"
              size="sm"
            >
              إنشاء جلسة
            </Button>
          )}
        </Box>
      </Flex>

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
