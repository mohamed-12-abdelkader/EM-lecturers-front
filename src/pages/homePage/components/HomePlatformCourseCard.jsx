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

/**
 * كارت كورس المنصة — عرض أعرض وتصميم أوضح للطالب
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
  const border = useColorModeValue("slate.200", "whiteAlpha.150");
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.900", "white");
  const imageBg = useColorModeValue("gray.100", "gray.700");
  const footerBg = useColorModeValue("gray.50", "whiteAlpha.50");

  const cover =
    course.avatar ||
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80";

  const statusLabel = isEnrolled ? "مشترك" : isFree ? "مجاني" : "مدفوع";
  const statusScheme = isEnrolled ? "green" : isFree ? "teal" : "orange";

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
      transition="transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease"
      boxShadow="0 10px 30px -18px rgba(15, 23, 42, 0.35)"
      _hover={{
        transform: "translateY(-5px)",
        boxShadow: "0 22px 44px -20px rgba(49, 130, 206, 0.45)",
        borderColor: "blue.300",
      }}
    >
      {/* Cover — أطول على الموبايل لاستغلال العرض */}
      <Box position="relative" h={{ base: "200px", md: "168px" }} bg={imageBg} flexShrink={0}>
        <Box
          as="img"
          src={cover}
          alt={course.title || "كورس"}
          w="full"
          h="full"
          objectFit="cover"
        />
        <Box
          position="absolute"
          inset={0}
          bgGradient="linear(to-t, blackAlpha.800 0%, blackAlpha.200 45%, transparent 70%)"
        />

        <HStack position="absolute" top={3} insetInline={3} justify="space-between">
          <Badge
            bg="whiteAlpha.950"
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
            colorScheme={statusScheme}
            variant="solid"
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

        <Box position="absolute" bottom={3} insetInline={3}>
          <Text
            color="white"
            fontSize={{ base: "lg", md: "xl" }}
            fontWeight="900"
            noOfLines={2}
            lineHeight="1.35"
            letterSpacing="-0.02em"
            textShadow="0 2px 12px rgba(0,0,0,0.5)"
          >
            {course.title}
          </Text>
        </Box>
      </Box>

      {/* Body */}
      <Box p={{ base: 4, md: 5 }} flex="1" display="flex" flexDirection="column" gap={3}>
        <HStack justify="space-between" align="center" spacing={3}>
          <HStack spacing={2} minW={0} color={muted}>
            <Icon as={FaUserGraduate} boxSize={3.5} color="blue.500" flexShrink={0} />
            <Text fontSize="sm" fontWeight="600" noOfLines={1}>
              {teacherName || "مستر"}
            </Text>
          </HStack>
          <Text
            fontSize="md"
            fontWeight="900"
            color={isFree || isEnrolled ? "green.500" : "orange.500"}
            whiteSpace="nowrap"
          >
            {isFree ? "مجاني" : `${course.price} ج.م`}
          </Text>
        </HStack>

        {course.description ? (
          <Text fontSize="sm" color={muted} noOfLines={2} lineHeight="1.75">
            {course.description}
          </Text>
        ) : (
          <Box flex="1" minH="8px" />
        )}

        <Box
          mt="auto"
          pt={3}
          borderTopWidth="1px"
          borderColor={border}
          bg={footerBg}
          mx={{ base: -4, md: -5 }}
          mb={{ base: -4, md: -5 }}
          px={{ base: 4, md: 5 }}
          pb={{ base: 4, md: 5 }}
        >
          {isEnrolled || isFree ? (
            <Button
              w="full"
              h="44px"
              bg="blue.500"
              color="white"
              _hover={{ bg: "blue.600" }}
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
              h="44px"
              bg="orange.500"
              color="white"
              _hover={{ bg: "orange.600" }}
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
