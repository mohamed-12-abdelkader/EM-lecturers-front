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
  useColorModeValue,
  Container,
  Flex,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  AiFillCheckCircle,
  AiOutlineClockCircle,
  AiOutlineFileText,
} from "react-icons/ai";
import { FaPlay } from "react-icons/fa";

const MotionBox = motion(Box);
const BLUE = "#3182CE";
const NAVY = "#0B1F3A";

export default function ExamReadyScreen({
  examData,
  startingAttempt,
  onStart,
  pageBg,
  cardBg,
  cardBorder,
  headingColor,
  subtextColor,
  isResume = false,
}) {
  const tipBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const tipBorder = useColorModeValue("blue.100", "whiteAlpha.200");

  const durationMinutes =
    examData?.timeLimitEnabled && examData?.timeLimitMinutes
      ? examData.timeLimitMinutes
      : examData?.duration > 0
        ? examData.duration
        : null;

  const questionCount =
    examData?.questionsCount ??
    examData?.configuredQuestionsCount ??
    examData?.totalQuestions ??
    examData?.questionCount ??
    null;

  return (
    <Box
      minH="100vh"
      bg={pageBg}
      dir="rtl"
      position="relative"
      overflow="hidden"
      pt={8}
      pb={12}
    >
      <Box
        position="absolute"
        inset={0}
        pointerEvents="none"
        opacity={0.55}
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% -10%, ${BLUE}33, transparent 60%), radial-gradient(ellipse 40% 30% at 100% 100%, ${BLUE}18, transparent)`,
        }}
      />

      <Container maxW="container.sm" position="relative" zIndex={1}>
        <MotionBox
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Box
            borderRadius="3xl"
            overflow="hidden"
            bg={cardBg}
            borderWidth="1px"
            borderColor={cardBorder}
            boxShadow="0 24px 60px rgba(11, 31, 58, 0.12)"
          >
            <Box
              px={{ base: 5, md: 7 }}
              pt={{ base: 6, md: 7 }}
              pb={5}
              bg={`linear-gradient(135deg, ${NAVY} 0%, ${BLUE} 70%, #2B6CB0 100%)`}
              color="white"
              position="relative"
            >
              <Box
                position="absolute"
                inset={0}
                opacity={0.18}
                pointerEvents="none"
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(255,255,255,0.45) 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                }}
              />
              <VStack spacing={3} position="relative" align="stretch">
                <Text
                  fontSize="xs"
                  fontWeight="800"
                  letterSpacing="0.08em"
                  color="whiteAlpha.800"
                  textAlign="center"
                >
                  {isResume ? "استكمال المحاولة" : "جاهز للبدء"}
                </Text>
                <Heading
                  size="lg"
                  textAlign="center"
                  fontWeight="900"
                  lineHeight="1.4"
                >
                  {examData?.title || "امتحان المحاضرة"}
                </Heading>
                <Text textAlign="center" color="whiteAlpha.800" fontSize="sm" lineHeight="1.9">
                  {isResume
                    ? "لديك محاولة لم تُسلَّم بعد. اضغط للاستكمال من حيث توقفت — الوقت مستمر."
                    : "راجع البيانات ثم ابدأ. المحاولة لا تُحتسب إلا بعد التسليم أو انتهاء الوقت."}
                </Text>
              </VStack>
            </Box>

            <Box px={{ base: 5, md: 7 }} py={{ base: 5, md: 6 }}>
              <VStack spacing={5} align="stretch">
                <SimpleGrid columns={2} spacing={3}>
                  <MiniStat
                    icon={AiOutlineClockCircle}
                    label="المدة"
                    value={durationMinutes ? `${durationMinutes} دقيقة` : "بدون حد زمني"}
                  />
                  <MiniStat
                    icon={AiOutlineFileText}
                    label="الأسئلة"
                    value={questionCount ? `${questionCount} سؤال` : "يُحدد عند البدء"}
                  />
                </SimpleGrid>

                <Box
                  p={3.5}
                  borderRadius="2xl"
                  bg={tipBg}
                  borderWidth="1px"
                  borderColor={tipBorder}
                >
                  <HStack align="flex-start" spacing={3}>
                    <Icon as={AiFillCheckCircle} color="blue.500" boxSize={5} mt={0.5} />
                    <Text fontSize="sm" color={subtextColor} lineHeight="1.9" fontWeight="600">
                      يمكنك التنقّل بين الأسئلة بحرية، والإجابة تُحفظ تلقائياً أثناء الجلسة.
                    </Text>
                  </HStack>
                </Box>

                <Button
                  size="lg"
                  w="full"
                  h="56px"
                  fontSize="md"
                  fontWeight="900"
                  borderRadius="2xl"
                  color="white"
                  leftIcon={<Icon as={isResume ? AiFillCheckCircle : FaPlay} boxSize={4} />}
                  onClick={onStart}
                  isLoading={startingAttempt}
                  loadingText={isResume ? "جاري الاستكمال..." : "جاري البدء..."}
                  bg={`linear-gradient(135deg, ${BLUE} 0%, #2B6CB0 100%)`}
                  boxShadow={`0 16px 36px ${BLUE}55`}
                  _hover={{ filter: "brightness(1.06)" }}
                  _active={{ transform: "scale(0.98)" }}
                >
                  {isResume ? "استكمل المحاولة" : "بدء الامتحان"}
                </Button>
              </VStack>
            </Box>
          </Box>
        </MotionBox>
      </Container>
    </Box>
  );
}

function MiniStat({ icon, label, value }) {
  const bg = useColorModeValue("gray.50", "whiteAlpha.50");
  const border = useColorModeValue("gray.200", "whiteAlpha.200");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const valueColor = useColorModeValue("blue.700", "blue.200");

  return (
    <Flex
      direction="column"
      gap={2}
      borderWidth="1px"
      borderColor={border}
      borderRadius="2xl"
      bg={bg}
      p={4}
      minH="96px"
    >
      <HStack spacing={2}>
        <Flex
          w={8}
          h={8}
          borderRadius="lg"
          bg="blue.500"
          color="white"
          align="center"
          justify="center"
        >
          <Icon as={icon} boxSize={4} />
        </Flex>
        <Text fontSize="xs" color={labelColor} fontWeight="800">
          {label}
        </Text>
      </HStack>
      <Text fontSize="md" fontWeight="900" color={valueColor} lineHeight="1.4">
        {value}
      </Text>
    </Flex>
  );
}
