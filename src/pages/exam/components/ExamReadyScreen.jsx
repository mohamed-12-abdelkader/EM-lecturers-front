import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
  Icon,
  SimpleGrid,
  Flex,
  useColorModeValue,
  Container,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  AiFillCheckCircle,
  AiOutlineClockCircle,
  AiOutlineFileText,
  AiOutlineBulb,
} from "react-icons/ai";
import { FaGraduationCap, FaShieldAlt } from "react-icons/fa";

const MotionBox = motion(Box);

const TIPS = [
  "اقرأ كل سؤال بعناية قبل اختيار الإجابة",
  "يمكنك التنقل بين الأسئلة قبل التسليم",
  "تأكد من تسليم الامتحان قبل انتهاء الوقت",
];

export default function ExamReadyScreen({
  examData,
  startingAttempt,
  onStart,
  pageBg,
  cardBg,
  cardBorder,
  headingColor,
  subtextColor,
}) {
  const accentGlow = useColorModeValue(
    "radial(circle at 30% 20%, blue.100 0%, transparent 55%)",
    "radial(circle at 30% 20%, blue.900 0%, transparent 55%)"
  );
  const statBg = useColorModeValue("white", "gray.700");
  const statBorder = useColorModeValue("gray.100", "gray.600");
  const tipBg = useColorModeValue("blue.50", "whiteAlpha.100");

  const durationMinutes =
    examData?.timeLimitEnabled && examData?.timeLimitMinutes
      ? examData.timeLimitMinutes
      : examData?.duration > 0
        ? examData.duration
        : null;

  const questionCount =
    examData?.questionsCount ??
    examData?.totalQuestions ??
    examData?.questionCount ??
    null;

  return (
    <Box minH="100vh" bg={pageBg} pt="100px" pb={12} dir="rtl">
      <Container maxW="container.md">
        <MotionBox
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Box
            position="relative"
            overflow="hidden"
            borderRadius="3xl"
            bg={cardBg}
            borderWidth="1px"
            borderColor={cardBorder}
            boxShadow="2xl"
          >
            <Box
              position="absolute"
              inset={0}
              bgGradient={accentGlow}
              pointerEvents="none"
            />
            <Box
              h="1.5"
              bgGradient="linear(to-l, blue.500, blue.400, orange.400)"
            />

            <VStack spacing={8} p={{ base: 6, md: 10 }} position="relative" zIndex={1}>
              <Flex
                w={20}
                h={20}
                borderRadius="2xl"
                bgGradient="linear(135deg, blue.500, blue.600)"
                color="white"
                align="center"
                justify="center"
                boxShadow="0 12px 32px rgba(59,130,246,0.35)"
              >
                <Icon as={FaGraduationCap} boxSize={10} />
              </Flex>

              <VStack spacing={2} textAlign="center">
                <BadgePill>جاهز للبدء</BadgePill>
                <Heading size="lg" color={headingColor} fontWeight="extrabold">
                  {examData?.title || "امتحان المحاضرة"}
                </Heading>
                <Text color={subtextColor} fontSize="md" maxW="md" lineHeight="1.9">
                  أنت على وشك بدء المحاولة. راجع التفاصيل أدناه ثم اضغط بدء الامتحان عندما تكون مستعدًا.
                </Text>
              </VStack>

              <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} w="full">
                <StatCard
                  icon={AiOutlineClockCircle}
                  label="المدة"
                  value={durationMinutes ? `${durationMinutes} دقيقة` : "بدون حد زمني"}
                  color="blue"
                  bg={statBg}
                  border={statBorder}
                />
                <StatCard
                  icon={AiOutlineFileText}
                  label="الأسئلة"
                  value={questionCount ? `${questionCount} سؤال` : "يُحدد عند البدء"}
                  color="purple"
                  bg={statBg}
                  border={statBorder}
                />
                <StatCard
                  icon={FaShieldAlt}
                  label="الحالة"
                  value="في انتظار البدء"
                  color="green"
                  bg={statBg}
                  border={statBorder}
                />
              </SimpleGrid>

              <Box
                w="full"
                p={5}
                borderRadius="2xl"
                bg={tipBg}
                borderWidth="1px"
                borderColor={cardBorder}
              >
                <HStack spacing={2} mb={4}>
                  <Icon as={AiOutlineBulb} color="orange.500" boxSize={5} />
                  <Text fontWeight="bold" color={headingColor}>
                    نصائح قبل البدء
                  </Text>
                </HStack>
                <VStack align="stretch" spacing={3}>
                  {TIPS.map((tip, i) => (
                    <HStack key={i} align="start" spacing={3}>
                      <Flex
                        w={6}
                        h={6}
                        borderRadius="full"
                        bg="orange.100"
                        color="orange.600"
                        align="center"
                        justify="center"
                        fontSize="xs"
                        fontWeight="bold"
                        flexShrink={0}
                      >
                        {i + 1}
                      </Flex>
                      <Text fontSize="sm" color={subtextColor} lineHeight="1.8">
                        {tip}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>

              <Button
                size="lg"
                w={{ base: "full", sm: "auto" }}
                minW="240px"
                h="60px"
                fontSize="xl"
                fontWeight="bold"
                borderRadius="2xl"
                bgGradient="linear(to-l, orange.400, orange.500)"
                color="white"
                leftIcon={<Icon as={AiFillCheckCircle} boxSize={6} />}
                onClick={onStart}
                isLoading={startingAttempt}
                loadingText="جاري البدء..."
                boxShadow="0 12px 28px rgba(249,115,22,0.35)"
                _hover={{
                  bgGradient: "linear(to-l, orange.300, orange.400)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 16px 36px rgba(249,115,22,0.4)",
                }}
                _active={{ transform: "translateY(0)" }}
                transition="all 0.25s ease"
              >
                بدء الامتحان
              </Button>
            </VStack>
          </Box>
        </MotionBox>
      </Container>
    </Box>
  );
}

function BadgePill({ children }) {
  return (
    <Box
      px={4}
      py={1.5}
      borderRadius="full"
      bg="green.50"
      color="green.600"
      fontSize="sm"
      fontWeight="bold"
      borderWidth="1px"
      borderColor="green.200"
    >
      {children}
    </Box>
  );
}

function StatCard({ icon, label, value, color, bg, border }) {
  const scheme = {
    blue: { iconBg: "blue.500", text: "blue.600" },
    purple: { iconBg: "purple.500", text: "purple.600" },
    green: { iconBg: "green.500", text: "green.600" },
  }[color];

  return (
    <Box
      p={4}
      borderRadius="2xl"
      bg={bg}
      borderWidth="1px"
      borderColor={border}
      textAlign="center"
      transition="all 0.2s"
      _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
    >
      <Flex
        w={10}
        h={10}
        mx="auto"
        mb={3}
        borderRadius="xl"
        bg={scheme.iconBg}
        color="white"
        align="center"
        justify="center"
      >
        <Icon as={icon} boxSize={5} />
      </Flex>
      <Text fontSize="xs" color="gray.500" mb={1}>
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="bold" color={scheme.text}>
        {value}
      </Text>
    </Box>
  );
}
