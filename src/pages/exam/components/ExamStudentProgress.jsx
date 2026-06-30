import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Flex,
  Progress,
  useColorModeValue,
} from "@chakra-ui/react";

export default function ExamStudentProgress({
  remainingSeconds,
  answeredCount,
  totalQuestions,
  questions,
  currentQuestionIndex,
  studentAnswers,
  showPagination,
  onGoToQuestion,
  hasActiveAttempt,
}) {
  const muted = useColorModeValue("gray.500", "gray.400");
  const heading = useColorModeValue("gray.700", "gray.200");
  const pillBg = useColorModeValue("gray.100", "gray.700");
  const trackBg = useColorModeValue("gray.100", "gray.700");
  const pillActive = useColorModeValue("blue.500", "blue.400");
  const pillAnswered = useColorModeValue("green.500", "green.400");

  const progressPct =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const isUrgent = remainingSeconds != null && remainingSeconds < 300;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <Box mb={5}>
      <Flex justify="space-between" align="center" mb={2} gap={3} flexWrap="wrap">
        <Text fontSize="sm" fontWeight="semibold" color={heading}>
          سؤال {currentQuestionIndex + 1} من {totalQuestions}
        </Text>
        <HStack spacing={3}>
          <Text fontSize="xs" color={muted}>
            {answeredCount} مجاب
          </Text>
          {hasActiveAttempt && remainingSeconds != null && remainingSeconds > 0 && (
            <Text
              fontSize="sm"
              fontWeight="bold"
              fontFamily="mono"
              color={isUrgent ? "red.500" : muted}
            >
              {formatTime(remainingSeconds)}
            </Text>
          )}
        </HStack>
      </Flex>

      <Progress
        value={progressPct}
        size="xs"
        colorScheme="blue"
        borderRadius="full"
        bg={trackBg}
      />

      {showPagination && totalQuestions > 1 && (
        <Flex flexWrap="wrap" gap={1.5} mt={3} justify="center">
          {questions.map((question, index) => {
            const qId =
              question.type === "passage_sub"
                ? question.sub_question?.id
                : question.id;
            const isAnswered = !!studentAnswers[qId];
            const isCurrent = currentQuestionIndex === index;

            return (
              <Button
                key={index}
                size="xs"
                minW="32px"
                h="32px"
                p={0}
                borderRadius="md"
                fontWeight="semibold"
                fontSize="xs"
                variant="unstyled"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg={isCurrent ? pillActive : isAnswered ? pillAnswered : pillBg}
                color={isCurrent || isAnswered ? "white" : muted}
                opacity={isCurrent ? 1 : isAnswered ? 0.9 : 0.7}
                onClick={() => onGoToQuestion(index)}
                _hover={{ opacity: 1 }}
              >
                {index + 1}
              </Button>
            );
          })}
        </Flex>
      )}
    </Box>
  );
}
