import React, { useEffect, useRef } from "react";
import {
  Box,
  Button,
  Flex,
  Progress,
  Text,
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
  compact = false,
}) {
  const muted = useColorModeValue("gray.500", "gray.400");
  const heading = useColorModeValue("gray.700", "gray.200");
  const pillBg = useColorModeValue("gray.100", "gray.700");
  const trackBg = useColorModeValue("gray.100", "gray.700");
  const pillActive = useColorModeValue("blue.500", "blue.400");
  const pillAnswered = useColorModeValue("green.500", "green.400");
  const scrollerRef = useRef(null);

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

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const active = scroller.querySelector(`[data-q-index="${currentQuestionIndex}"]`);
    if (active?.scrollIntoView) {
      active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [currentQuestionIndex]);

  return (
    <Box mb={compact ? 0 : 5}>
      {!compact && (
        <Flex justify="space-between" align="center" mb={2} gap={3} flexWrap="wrap">
          <Text fontSize="sm" fontWeight="semibold" color={heading}>
            سؤال {currentQuestionIndex + 1} من {totalQuestions}
          </Text>
          <Flex gap={3} align="center">
            <Text fontSize="xs" color={muted}>
              {answeredCount} مجاب
            </Text>
            {hasActiveAttempt && remainingSeconds != null && remainingSeconds >= 0 && (
              <Text
                fontSize="sm"
                fontWeight="bold"
                fontFamily="mono"
                color={isUrgent ? "red.500" : muted}
              >
                {formatTime(remainingSeconds)}
              </Text>
            )}
          </Flex>
        </Flex>
      )}

      <Progress
        value={progressPct}
        size={compact ? "sm" : "xs"}
        colorScheme={progressPct === 100 ? "green" : "blue"}
        borderRadius="full"
        bg={trackBg}
      />

      {showPagination && totalQuestions > 1 && (
        <Flex
          ref={scrollerRef}
          mt={3}
          gap={2}
          overflowX="auto"
          overflowY="hidden"
          py={1}
          px={0.5}
          css={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
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
                data-q-index={index}
                flexShrink={0}
                minW={{ base: "44px", md: "36px" }}
                h={{ base: "44px", md: "36px" }}
                p={0}
                borderRadius="xl"
                fontWeight="800"
                fontSize="sm"
                variant="unstyled"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg={isCurrent ? pillActive : isAnswered ? pillAnswered : pillBg}
                color={isCurrent || isAnswered ? "white" : muted}
                boxShadow={isCurrent ? "0 6px 16px rgba(49,130,206,0.35)" : "none"}
                transform={isCurrent ? "scale(1.04)" : "none"}
                onClick={() => onGoToQuestion(index)}
                aria-label={`السؤال ${index + 1}${isAnswered ? " — تمت الإجابة" : ""}`}
                aria-current={isCurrent ? "step" : undefined}
                _hover={{ opacity: 1 }}
                _active={{ transform: "scale(0.96)" }}
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
