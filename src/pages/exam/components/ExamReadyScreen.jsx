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
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { AiFillCheckCircle, AiOutlineClockCircle, AiOutlineFileText } from "react-icons/ai";
import { FaGraduationCap } from "react-icons/fa";

const MotionBox = motion(Box);

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
  const statBg = useColorModeValue("gray.50", "gray.700");
  const statBorder = useColorModeValue("gray.200", "gray.600");

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
    <Box minH="100vh" bg={pageBg} pt="96px" pb={10} dir="rtl">
      <Container maxW="container.sm">
        <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
          <Box
            borderRadius="2xl"
            bg={cardBg}
            borderWidth="1px"
            borderColor={cardBorder}
            boxShadow="lg"
            p={{ base: 5, md: 6 }}
          >
            <VStack spacing={5} align="stretch">
              <HStack spacing={3} justify="center">
                <Icon as={FaGraduationCap} color="blue.500" boxSize={6} />
                <Heading size="md" color={headingColor} textAlign="center">
                  {examData?.title || "امتحان المحاضرة"}
                </Heading>
              </HStack>

              <Text textAlign="center" color={subtextColor} fontSize="sm" lineHeight="1.9">
                راجع البيانات التالية ثم ابدأ الامتحان.
              </Text>

              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                <MiniStat
                  icon={AiOutlineClockCircle}
                  label="المدة"
                  value={durationMinutes ? `${durationMinutes} دقيقة` : "بدون حد زمني"}
                  bg={statBg}
                  border={statBorder}
                />
                <MiniStat
                  icon={AiOutlineFileText}
                  label="الأسئلة"
                  value={questionCount ? `${questionCount} سؤال` : "يُحدد عند البدء"}
                  bg={statBg}
                  border={statBorder}
                />
              </SimpleGrid>

              <Button
                size="md"
                w="full"
                h="48px"
                fontSize="md"
                fontWeight="bold"
                borderRadius="xl"
                bg="orange.500"
                color="white"
                leftIcon={<Icon as={AiFillCheckCircle} boxSize={5} />}
                onClick={onStart}
                isLoading={startingAttempt}
                loadingText="جاري البدء..."
                _hover={{ bg: "orange.600" }}
                _active={{ bg: "orange.700" }}
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

function MiniStat({ icon, label, value, bg, border }) {
  return (
    <Box borderWidth="1px" borderColor={border} borderRadius="xl" bg={bg} p={3}>
      <HStack spacing={2} mb={1}>
        <Icon as={icon} color="blue.500" boxSize={4} />
        <Text fontSize="xs" color="gray.500" fontWeight="semibold">
          {label}
        </Text>
      </HStack>
      <Text fontSize="sm" fontWeight="bold" color="blue.600">
        {value}
      </Text>
    </Box>
  );
}
