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
  onDarkSurface = false,
}) {
  const mutedLight = useColorModeValue("gray.500", "gray.400");
  const headingLight = useColorModeValue("gray.700", "gray.200");
  const pillBgLight = useColorModeValue("gray.100", "gray.700");
  const trackBgLight = useColorModeValue("gray.100", "gray.700");
  const pillAnsweredLight = useColorModeValue("green.500", "green.400");

  const muted = onDarkSurface ? "whiteAlpha.700" : mutedLight;
  const heading = onDarkSurface ? "white" : headingLight;
  const pillBg = onDarkSurface ? "whiteAlpha.200" : pillBgLight;
  const trackBg = onDarkSurface ? "whiteAlpha.250" : trackBgLight;
  const pillAnswered = onDarkSurface ? "green.300" : pillAnsweredLight;
  const scrollerRef = useRef(null);

  const progressPct =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

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
          <Text fontSize="xs" color={muted}>
            {answeredCount} مجاب
            {hasActiveAttempt && remainingSeconds != null && remainingSeconds >= 0
              ? ` · وقت متبقٍ`
              : ""}
          </Text>
        </Flex>
      )}

      <Progress
        value={progressPct}
        size={compact ? "sm" : "xs"}
        colorScheme={progressPct === 100 ? "green" : "blue"}
        borderRadius="full"
        bg={trackBg}
        sx={
          onDarkSurface
            ? { "& > div": { bg: progressPct === 100 ? "#68D391" : "#90CDF4" } }
            : undefined
        }
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
                minW={{ base: "40px", md: "36px" }}
                h={{ base: "40px", md: "36px" }}
                p={0}
                borderRadius="full"
                fontWeight="800"
                fontSize="sm"
                variant="unstyled"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg={isCurrent ? "white" : isAnswered ? pillAnswered : pillBg}
                color={
                  isCurrent
                    ? "blue.700"
                    : isAnswered
                      ? onDarkSurface
                        ? "#0B1F3A"
                        : "white"
                      : onDarkSurface
                        ? "whiteAlpha.900"
                        : muted
                }
                borderWidth={isCurrent ? "0" : onDarkSurface ? "1px" : "0"}
                borderColor="whiteAlpha.350"
                boxShadow={isCurrent ? "0 8px 18px rgba(0,0,0,0.2)" : "none"}
                transform={isCurrent ? "scale(1.06)" : "none"}
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
