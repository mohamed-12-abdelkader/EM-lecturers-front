import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Spinner,
  Text,
  useColorModeValue,
  useDisclosure,
  Badge,
  Skeleton,
  Center,
  Icon,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import baseUrl from "../../api/baseUrl";
import CreateStreamModal from "./createModel";
import CourseStreamsList from "./courseStreamsList";
import {
  FaVideo,
  FaPlayCircle,
  FaExternalLinkAlt,
  FaClock,
  FaBroadcastTower,
} from "react-icons/fa";

const STREAM_REDIRECT_URL = import.meta.env.VITE_STREAM_REDIRECT_URL;

function CourseStreams({ courseId, isAdmin, isTeacher, isStudent }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const headingColor = useColorModeValue("blue.700", "blue.200");
  const subTextColor = useColorModeValue("gray.600", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "whiteAlpha.100");
  const pillBg = useColorModeValue("red.50", "red.900");
  const pillColor = useColorModeValue("red.500", "red.300");

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

  return (
    <Box>
      {/* Section Header Card */}
      <Box
        bg={cardBg}
        borderRadius="2xl"
        border="1px solid"
        borderColor={borderColor}
        boxShadow="sm"
        overflow="hidden"
        mb={4}
      >
        {/* Decorative top bar */}
        <Box
          h="10px"
          w="full"
          bgGradient="linear(to-r, blue.500, purple.500, orange.400)"
        />

        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          gap={4}
          p={{ base: 4, md: 5 }}
        >
          <Box>
            <HStack spacing={2} mb={1}>
              <Icon as={FaBroadcastTower} color="red.500" boxSize={5} />
              <Heading size="md" color={headingColor}>
                الجلسات المباشرة
              </Heading>
            </HStack>
            <Text fontSize="sm" color={subTextColor} lineHeight="1.8">
              حصص تفاعلية داخل الكورس - جاهزة للتجربة
            </Text>
          </Box>

          {/* Action area */}
          {isLoading ? (
            <HStack spacing={3}>
              <Skeleton height="40px" width="170px" borderRadius="xl" />
              <Skeleton height="40px" width="140px" borderRadius="xl" />
            </HStack>
          ) : isError ? (
            <Center w="full">
              <Text color="red.500" fontWeight="700">
                حدث خطأ أثناء تحميل الجلسات
              </Text>
            </Center>
          ) : hasActiveStream ? (
            <HStack spacing={3} align="center">
              <Badge
                bg={pillBg}
                color={pillColor}
                px={3}
                py={1}
                borderRadius="full"
                fontWeight="800"
              >
                مباشر الآن
              </Badge>

              <Button
                as="a"
                href={`${STREAM_REDIRECT_URL}/${stream.id}?t=${localStorage.getItem(
                  "token"
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                leftIcon={<Icon as={FaExternalLinkAlt} />}
                colorScheme="blue"
                borderRadius="xl"
                _hover={{ transform: "translateY(-1px)" }}
                boxShadow="sm"
              >
                دخول غرفة البث
              </Button>
            </HStack>
          ) : (
            <HStack spacing={3} align="center">
              <Badge
                bg={useColorModeValue("orange.50", "orange.900")}
                color={useColorModeValue("orange.500", "orange.300")}
                px={3}
                py={1}
                borderRadius="full"
                fontWeight="800"
              >
                قيد الانتظار
              </Badge>

              {/* Create stream (teacher/admin) - fallback to allow always if needed */}
              <Button
                leftIcon={<Icon as={FaPlayCircle} />}
                colorScheme="green"
                onClick={onOpen}
                borderRadius="xl"
                _hover={{ transform: "translateY(-1px)" }}
                boxShadow="sm"
              >
                إنشاء جلسة
              </Button>
            </HStack>
          )}
        </Flex>
      </Box>

      {/* List */}
      <CourseStreamsList courseId={courseId} />

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
