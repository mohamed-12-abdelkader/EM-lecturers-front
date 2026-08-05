import {
  Box,
  Text,
  Badge,
  Button,
  HStack,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaChevronLeft, FaUserGraduate, FaLock, FaCheckCircle } from "react-icons/fa";
import { HP_BLUE, HP_BLUE_DARK, HP_ORANGE, HP_ORANGE_DARK } from "../homeTheme";

/**
 * كارت كورس المنصة — براند أزرق / برتقالي موحّد
 */
export default function HomePlatformCourseCard({
  course,
  teacherName,
  isFree,
  isEnrolled,
  onEnter,
  onSubscribe,
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "whiteAlpha.150");
  const muted = useColorModeValue("gray.500", "gray.400");
  const imageBg = useColorModeValue("gray.100", "gray.700");
  const footerBg = useColorModeValue("gray.50", "whiteAlpha.50");

  const cover =
    course.avatar ||
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80";

  const statusLabel = isEnrolled ? "مشترك" : isFree ? "مجاني" : "مدفوع";
  const statusBg = isEnrolled ? "#38A169" : isFree ? HP_BLUE : HP_ORANGE;

  return (
    <Box
      as="article"
      bg={cardBg}
      borderWidth="1px"
      borderColor={border}
      borderRadius="2xl"
      overflow="hidden"
      h="full"
      display="flex"
      flexDirection="column"
      transition="transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease"
      boxShadow="0 8px 28px -14px rgba(26, 32, 44, 0.2)"
      _hover={{
        transform: "translateY(-4px)",
        boxShadow: "0 18px 40px -16px rgba(49, 130, 206, 0.35)",
        borderColor: "blue.200",
      }}
    >
      <Box position="relative" bg={imageBg} flexShrink={0}>
        <Box
          as="img"
          src={cover}
          alt={course.title || "كورس"}
          w="full"
          h="auto"
          display="block"
        />

        <HStack position="absolute" top={3} insetInline={3} justify="space-between" zIndex={1}>
          <Badge
            bg="white"
            color="blue.700"
            borderRadius="full"
            px={3}
            py={1}
            fontSize="11px"
            fontWeight="800"
            boxShadow="sm"
          >
            {course?.grade?.name || "عام"}
          </Badge>
          <Badge
            bg={statusBg}
            color="white"
            borderRadius="full"
            px={3}
            py={1}
            fontSize="11px"
            fontWeight="800"
            display="inline-flex"
            alignItems="center"
            gap={1}
          >
            {isEnrolled ? <Icon as={FaCheckCircle} boxSize={2.5} /> : null}
            {!isEnrolled && !isFree ? <Icon as={FaLock} boxSize={2.5} /> : null}
            {statusLabel}
          </Badge>
        </HStack>
      </Box>

      <Box p={{ base: 4, md: 4 }} flex="1" display="flex" flexDirection="column" gap={3}>
        <Text
          fontSize={{ base: "md", md: "lg" }}
          fontWeight="800"
          noOfLines={2}
          lineHeight="1.4"
          letterSpacing="-0.01em"
        >
          {course.title}
        </Text>

        <HStack justify="space-between" align="center" spacing={3}>
          <HStack spacing={2} minW={0} color={muted}>
            <Icon as={FaUserGraduate} boxSize={3.5} color="blue.500" flexShrink={0} />
            <Text fontSize="sm" fontWeight="600" noOfLines={1}>
              {teacherName || "مستر"}
            </Text>
          </HStack>
          <Text
            fontSize="md"
            fontWeight="800"
            color={isFree || isEnrolled ? "green.500" : "orange.500"}
            whiteSpace="nowrap"
          >
            {isFree ? "مجاني" : `${course.price} ج.م`}
          </Text>
        </HStack>

        {course.description ? (
          <Text fontSize="sm" color={muted} noOfLines={2} lineHeight="1.7">
            {course.description}
          </Text>
        ) : (
          <Box flex="1" minH="4px" />
        )}

        <Box
          mt="auto"
          pt={3}
          borderTopWidth="1px"
          borderColor={border}
          bg={footerBg}
          mx={{ base: -4, md: -4 }}
          mb={{ base: -4, md: -4 }}
          px={{ base: 4, md: 4 }}
          pb={{ base: 4, md: 4 }}
        >
          {isEnrolled || isFree ? (
            <Button
              w="full"
              h="42px"
              bg={HP_BLUE}
              color="white"
              _hover={{ bg: HP_BLUE_DARK }}
              borderRadius="xl"
              fontSize="sm"
              fontWeight="800"
              rightIcon={<Icon as={FaChevronLeft} boxSize={3} />}
              onClick={onEnter}
            >
              دخول للكورس
            </Button>
          ) : (
            <Button
              w="full"
              h="42px"
              bg={HP_ORANGE}
              color="white"
              _hover={{ bg: HP_ORANGE_DARK }}
              borderRadius="xl"
              fontSize="sm"
              fontWeight="800"
              onClick={onSubscribe}
            >
              اشترك الآن
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
