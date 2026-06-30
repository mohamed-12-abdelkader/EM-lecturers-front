import React, { useMemo } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  Link as ChakraLink,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  FaFacebook,
  FaGraduationCap,
  FaMedal,
  FaPercent,
  FaPlay,
  FaStar,
  FaTiktok,
  FaUserPlus,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";

const TeacherInfo = ({ teacher, number }) => {
  const navigate = useNavigate();

  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const cardBg = useColorModeValue("white", "gray.800");
  const textPrimary = useColorModeValue("gray.800", "white");
  const textSecondary = useColorModeValue("gray.600", "gray.300");
  const mutedBg = useColorModeValue("gray.50", "gray.900");

  const teacherName = teacher?.name || "—";
  const teacherSubject = teacher?.subject || "";
  const teacherDescription = teacher?.description || "";

  const ratingAvg =
    teacher?.rating ??
    teacher?.rating_avg ??
    teacher?.average_rating ??
    teacher?.rating_value ??
    null;
  const ratingCount =
    teacher?.rating_count ??
    teacher?.reviews_count ??
    teacher?.reviews ??
    teacher?.num_ratings ??
    null;

  const ratingPercent = useMemo(() => {
    const directPercent =
      teacher?.rating_percent ??
      teacher?.rating_percentage ??
      teacher?.satisfaction_percent ??
      null;
    if (
      directPercent !== null &&
      directPercent !== undefined &&
      !Number.isNaN(Number(directPercent))
    ) {
      return Number(directPercent);
    }
    if (
      ratingAvg !== null &&
      ratingAvg !== undefined &&
      !Number.isNaN(Number(ratingAvg))
    ) {
      const n = Number(ratingAvg);
      // If backend returns 0..5 rating, convert to percent.
      if (n >= 0 && n <= 5) return Math.round((n / 5) * 100);
      // If backend returns 0..100 percent, keep as-is.
      if (n >= 0 && n <= 100) return Math.round(n);
      return null;
    }
    return null;
  }, [ratingAvg, teacher]);

  const coursesCount = teacher?.courses_count ?? number ?? null;

  const followersCount =
    teacher?.followers_count ??
    teacher?.followers ??
    teacher?.followings ??
    teacher?.subscribers_count ??
    null;

  const yearsExperience =
    teacher?.experience_years ??
    teacher?.years_experience ??
    teacher?.teaching_years ??
    teacher?.experience ??
    null;

  const posterSrc =
    teacher?.video_thumbnail ??
    teacher?.video_poster ??
    teacher?.cover_photo ??
    teacher?.avatar ??
    "";

  const whatsappNumber = teacher?.whatsapp_number
    ? teacher.whatsapp_number.replace(/[^0-9]/g, "")
    : null;

  const handleViewAccount = () => {
    if (!teacher?.id) return;
    navigate(`/teacher/${teacher.id}`);
  };

  const StatCard = ({ icon, value, label }) => (
    <Box
      flex="1"
      minW={{ base: "120px", md: "0" }}
      bg={useColorModeValue("white", "gray.800")}
      border={useColorModeValue(
        "1px solid rgba(66,153,225,0.12)",
        "1px solid rgba(66,153,225,0.25)",
      )}
      borderRadius="xl"
      px={4}
      py={3}
      textAlign="center"
      boxShadow={useColorModeValue("sm", "none")}
    >
      <HStack justify="center" mb={2} spacing={2}>
        <Box
          w="10"
          h="10"
          borderRadius="lg"
          bg={useColorModeValue("blue.50", "blue.900")}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon
            as={icon}
            color={useColorModeValue("blue.600", "blue.300")}
            boxSize={5}
          />
        </Box>
      </HStack>
      <Text fontSize="lg" fontWeight="extrabold" color={textPrimary}>
        {value}
      </Text>
      <Text fontSize="xs" color={textSecondary} mt={1}>
        {label}
      </Text>
    </Box>
  );

  return (
    <Box as="section" id="home" position="relative" py={{ base: 10, md: 16 }} dir="rtl">
      <Container maxW="6xl" px={{ base: 4, md: 6 }}>
        <Flex
          direction={{ base: "column", md: "row" }}
          align="center"
          justify="space-between"
          gap={{ base: 8, md: 14 }}
        >
          <VStack align={{ base: "center", md: "start" }} spacing={5} flex="1">
            <Text color="blue.500" fontWeight="bold">
              منصة تعليمية متكاملة
            </Text>
            <Heading
              color={textPrimary}
              fontSize={{ base: "3xl", md: "5xl" }}
              lineHeight="1.25"
              textAlign={{ base: "center", md: "right" }}
              fontWeight="black"
            >
              احترف {teacherSubject || "التعلم"} مع
              <Text as="span" display="block" color="blue.500">
                {teacherName}
              </Text>
            </Heading>
            <Text
              color={textSecondary}
              fontSize={{ base: "sm", md: "md" }}
              lineHeight="1.9"
              maxW="520px"
              textAlign={{ base: "center", md: "right" }}
            >
              {teacherDescription ||
                "شرح مبسط، متابعة منظمة، وكورسات مصممة لمساعدتك على الفهم والتطبيق خطوة بخطوة."}
            </Text>
            <HStack spacing={3} flexWrap="wrap" justify={{ base: "center", md: "flex-start" }}>
              <Button
                colorScheme="blue"
                borderRadius="full"
                px={7}
                onClick={() => document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" })}
              >
                ابدأ التعلم
              </Button>
              <Button
                variant="ghost"
                borderRadius="full"
                color={textPrimary}
                onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
              >
                تعرف أكثر
              </Button>
            </HStack>
            <HStack spacing={2} pt={2}>
              {teacher?.facebook_url && (
                <IconButton as={ChakraLink} href={teacher.facebook_url} target="_blank" aria-label="فيسبوك" icon={<FaFacebook />} size="sm" rounded="full" colorScheme="blue" />
              )}
              {teacher?.youtube_url && (
                <IconButton as={ChakraLink} href={teacher.youtube_url} target="_blank" aria-label="يوتيوب" icon={<FaYoutube />} size="sm" rounded="full" colorScheme="red" />
              )}
              {whatsappNumber && (
                <IconButton as={ChakraLink} href={`https://wa.me/${whatsappNumber}`} target="_blank" aria-label="واتساب" icon={<FaWhatsapp />} size="sm" rounded="full" colorScheme="green" />
              )}
            </HStack>
          </VStack>

          <Box flex="1" display="flex" justifyContent="center">
            <Box
              w={{ base: "250px", sm: "310px", md: "360px" }}
              p={3}
              bg={cardBg}
              border="1px solid"
              borderColor={cardBorder}
              borderRadius="2xl"
              boxShadow="0 20px 45px rgba(37,99,235,0.18)"
              transform={{ base: "none", md: "rotate(-1deg)" }}
            >
              <Image
                src={posterSrc || "https://placehold.co/500x500/e2e8f0/475569?text=Teacher"}
                alt={teacherName}
                w="full"
                h={{ base: "250px", sm: "310px", md: "360px" }}
                objectFit="cover"
                borderRadius="xl"
                filter="grayscale(100%)"
              />
            </Box>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default TeacherInfo;
