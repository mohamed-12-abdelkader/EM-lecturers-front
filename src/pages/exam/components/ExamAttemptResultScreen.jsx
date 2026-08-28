import React from "react";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Image,
  SimpleGrid,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaCheckCircle, FaLock, FaTimesCircle } from "react-icons/fa";
import { MdArrowBack } from "react-icons/md";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";
import FormattedQuestionText from "../../../components/question/FormattedQuestionText";
import { isImageUrl } from "./PlatformExamQuestionCard";
import {
  formatExamDate,
  getAnswerLetterLabel,
  getAnswerTextFromQuestion,
  getAnswersVisibilityInfo,
} from "../../../utils/examAttemptResultUtils";

function StatCard({ icon, label, value, colorScheme = "blue" }) {
  const bg = useColorModeValue(`${colorScheme}.50`, `${colorScheme}.900`);
  const border = useColorModeValue(`${colorScheme}.200`, `${colorScheme}.700`);

  return (
    <Box
      flex={1}
      p={4}
      borderRadius="2xl"
      bg={bg}
      borderWidth="1px"
      borderColor={border}
      textAlign="center"
    >
      <Icon as={icon} boxSize={6} color={`${colorScheme}.500`} mb={2} />
      <Text fontSize="2xl" fontWeight="bold" color="gray.800" _dark={{ color: "white" }}>
        {value}
      </Text>
      <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }}>
        {label}
      </Text>
    </Box>
  );
}

function WrongQuestionCard({ question, index, onZoomImage }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const yourAnswer = question.yourAnswer;
  const correctAnswer = question.correctAnswer;
  const yourText = getAnswerTextFromQuestion(question, yourAnswer);
  const correctText = getAnswerTextFromQuestion(question, correctAnswer);
  const yourImg = yourText && isImageUrl(yourText) ? yourText : null;
  const correctImg = correctText && isImageUrl(correctText) ? correctText : null;

  return (
    <Box
      p={{ base: 4, md: 5 }}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={border}
      bg={cardBg}
      boxShadow="sm"
    >
      <HStack justify="space-between" mb={3}>
        <Badge colorScheme="red" borderRadius="full" px={3}>
          سؤال خاطئ {index + 1}
        </Badge>
      </HStack>

      {question.questionText && (
        <FormattedQuestionText
          value={question.questionText}
          fontSize="md"
          color="gray.800"
          mb={3}
          lineHeight="1.9"
        />
      )}

      {question.questionImage && (
        <Box
          mb={4}
          cursor="pointer"
          onClick={() => onZoomImage?.(question.questionImage)}
        >
          <Image
            src={question.questionImage}
            alt="صورة السؤال"
            maxH="220px"
            borderRadius="xl"
            objectFit="contain"
          />
        </Box>
      )}

      <VStack align="stretch" spacing={3}>
        <Box
          p={3}
          borderRadius="xl"
          bg="red.50"
          borderWidth="1px"
          borderColor="red.200"
          _dark={{ bg: "red.900", borderColor: "red.700" }}
        >
          <HStack align="start" spacing={2}>
            <AiOutlineCloseCircle color="#DC2626" size={18} style={{ marginTop: 4, flexShrink: 0 }} />
            <Box flex={1}>
              <Text fontSize="sm" fontWeight="bold" color="red.600" mb={1}>
                إجابتك {yourAnswer ? `(${getAnswerLetterLabel(yourAnswer)})` : ""}
              </Text>
              <FormattedQuestionText value={yourImg ? "صورة" : yourText} fontSize="sm" color="red.600" />
              {yourImg && (
                <Image
                  src={yourImg}
                  mt={2}
                  maxH="120px"
                  objectFit="contain"
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => onZoomImage?.(yourImg)}
                />
              )}
            </Box>
          </HStack>
        </Box>

        <Box
          p={3}
          borderRadius="xl"
          bg="green.50"
          borderWidth="1px"
          borderColor="green.200"
          _dark={{ bg: "green.900", borderColor: "green.700" }}
        >
          <HStack align="start" spacing={2}>
            <AiOutlineCheckCircle color="#16A34A" size={18} style={{ marginTop: 4, flexShrink: 0 }} />
            <Box flex={1}>
              <Text fontSize="sm" fontWeight="bold" color="green.600" mb={1}>
                الإجابة الصحيحة {correctAnswer ? `(${getAnswerLetterLabel(correctAnswer)})` : ""}
              </Text>
              <FormattedQuestionText value={correctImg ? "صورة" : correctText} fontSize="sm" color="green.600" />
              {correctImg && (
                <Image
                  src={correctImg}
                  mt={2}
                  maxH="120px"
                  objectFit="contain"
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => onZoomImage?.(correctImg)}
                />
              )}
            </Box>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
}

export default function ExamAttemptResultScreen({
  result,
  examTitle,
  onBack,
  onZoomImage,
  pageBg,
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.300");
  const headingColor = useColorModeValue("gray.800", "white");
  const visibilityInfo = getAnswersVisibilityInfo(result);
  const isBlocked = result?.mode === "blocked";
  const scorePercent =
    result?.maxGrade > 0
      ? Math.round((result.totalGrade / result.maxGrade) * 100)
      : 0;

  return (
    <Box minH="100vh" bg={pageBg} pt="96px" pb={10} dir="rtl">
      <Container maxW="3xl">
        <Box
          borderRadius="3xl"
          borderWidth="1px"
          borderColor={cardBorder}
          bg={cardBg}
          overflow="hidden"
          boxShadow="xl"
        >
          <Box h="4px" bgGradient="linear(to-r, blue.500, orange.500)" />

          <VStack spacing={6} align="stretch" p={{ base: 5, md: 8 }}>
            <VStack spacing={3} textAlign="center">
              <Flex
                w={16}
                h={16}
                borderRadius="2xl"
                bg={isBlocked ? "orange.100" : "green.100"}
                color={isBlocked ? "orange.500" : "green.500"}
                align="center"
                justify="center"
              >
                <Icon as={isBlocked ? FaLock : FaCheckCircle} boxSize={8} />
              </Flex>
              <Heading size="lg" color={headingColor}>
                {result?.title || "نتيجة الامتحان"}
              </Heading>
              {examTitle && (
                <Text fontSize="md" color={muted}>
                  {examTitle}
                </Text>
              )}
              {result?.message && (
                <Text fontSize="sm" color="orange.600" lineHeight="1.8" maxW="lg">
                  {result.message}
                </Text>
              )}
            </VStack>

            <Box textAlign="center" py={2}>
              <Text fontSize="5xl" fontWeight="bold" color="blue.600" lineHeight="1">
                {result?.totalGrade ?? 0}
              </Text>
              <Text fontSize="lg" color={muted}>
                من {result?.maxGrade ?? 0}
              </Text>
              <Badge mt={3} colorScheme={scorePercent >= 50 ? "green" : "orange"} borderRadius="full" px={3} py={1}>
                {scorePercent}%
              </Badge>
            </Box>

            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              <StatCard
                icon={FaCheckCircle}
                label="إجابات صحيحة"
                value={result?.correctCount ?? 0}
                colorScheme="green"
              />
              <StatCard
                icon={FaTimesCircle}
                label="إجابات خاطئة"
                value={result?.wrongCount ?? result?.wrongQuestions?.length ?? 0}
                colorScheme="red"
              />
            </SimpleGrid>

            <HStack justify="space-between" flexWrap="wrap" gap={2}>
              <Text fontSize="sm" color={muted}>
                تاريخ التسليم: {formatExamDate(result?.submittedAt)}
              </Text>
              {result?.attemptId && (
                <Badge colorScheme="gray" borderRadius="full">
                  محاولة #{result.attemptId}
                </Badge>
              )}
            </HStack>

            {visibilityInfo && (
              <Box
                p={4}
                borderRadius="xl"
                bg={`${visibilityInfo.colorScheme}.50`}
                borderWidth="1px"
                borderColor={`${visibilityInfo.colorScheme}.200`}
              >
                <Text fontSize="sm" color={`${visibilityInfo.colorScheme}.700`} lineHeight="1.8">
                  {visibilityInfo.text}
                </Text>
              </Box>
            )}

            {result?.showAnswers !== false && result?.wrongQuestions?.length > 0 && (
              <VStack align="stretch" spacing={4}>
                <Heading size="sm" color={headingColor}>
                  مراجعة الأسئلة الخاطئة ({result.wrongQuestions.length})
                </Heading>
                {result.wrongQuestions.map((question, index) => (
                  <WrongQuestionCard
                    key={question.id ?? index}
                    question={question}
                    index={index}
                    onZoomImage={onZoomImage}
                  />
                ))}
              </VStack>
            )}

            {result?.showAnswers === false && (
              <Box
                p={4}
                borderRadius="xl"
                bg="gray.50"
                borderWidth="1px"
                borderColor="gray.200"
                textAlign="center"
              >
                <Text fontSize="sm" color={muted} lineHeight="1.8">
                  الإجابات التفصيلية غير متاحة بعد. ستظهر حسب إعدادات المدرس.
                </Text>
              </Box>
            )}

            <Button
              colorScheme="blue"
              size="lg"
              w="full"
              borderRadius="xl"
              leftIcon={<MdArrowBack />}
              onClick={onBack}
            >
              العودة
            </Button>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
}
