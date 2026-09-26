/**
 * هيدر جلسة امتحان الطالب — ثابت أعلى الشاشة مع مؤقت وتقدّم الأسئلة
 */
import {
  Badge,
  Box,
  Flex,
  IconButton,
  Text,
} from "@chakra-ui/react";
import { MdArrowBack } from "react-icons/md";
import ExamStudentProgress from "./ExamStudentProgress";

const BLUE = "#3182CE";

function formatRemainingTime(value) {
  if (value == null) return "--:--";
  const s = Math.max(0, value);
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function ExamStudentSessionHeader({
  examTitle,
  currentIndex,
  totalQuestions,
  answeredCount = 0,
  remainingSeconds,
  questions,
  studentAnswers,
  onBack,
  onGoToQuestion,
  backDisabled = false,
  hasActiveAttempt = true,
}) {
  const isUrgent = remainingSeconds != null && remainingSeconds < 300;

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={30}
      overflow="hidden"
      bg={`linear-gradient(125deg, #0B1F3A 0%, ${BLUE} 58%, #2B6CB0 100%)`}
      boxShadow="0 12px 32px rgba(11, 31, 58, 0.28)"
      pt="max(10px, env(safe-area-inset-top))"
      px={{ base: 3, md: 4 }}
      pb={3}
    >
      <Box
        position="absolute"
        inset={0}
        opacity={0.2}
        pointerEvents="none"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
          maskImage: "radial-gradient(ellipse 80% 70% at 80% 0%, black, transparent)",
        }}
      />

      <Box position="relative" zIndex={1} maxW="3xl" mx="auto">
        <Flex align="center" gap={2.5} mb={3}>
          <IconButton
            aria-label="العودة"
            icon={<MdArrowBack />}
            variant="ghost"
            minW="44px"
            h="44px"
            borderRadius="xl"
            color="white"
            bg="whiteAlpha.150"
            _hover={{ bg: "whiteAlpha.250" }}
            onClick={onBack}
            isDisabled={backDisabled}
          />
          <Box flex={1} minW={0}>
            <Text fontWeight="800" fontSize={{ base: "sm", md: "md" }} color="white" noOfLines={1}>
              {examTitle || "الامتحان"}
            </Text>
            <Text fontSize="xs" color="whiteAlpha.800" fontWeight="600">
              سؤال {currentIndex + 1} من {totalQuestions}
              {answeredCount > 0 ? ` · ${answeredCount} مجاب` : ""}
            </Text>
          </Box>
          {remainingSeconds != null ? (
            <Badge
              px={3}
              py={2}
              minW="78px"
              textAlign="center"
              borderRadius="xl"
              fontSize={{ base: "md", md: "sm" }}
              fontFamily="mono"
              fontWeight="800"
              bg={isUrgent ? "red.500" : "white"}
              color={isUrgent ? "white" : "blue.700"}
              boxShadow={isUrgent ? "0 0 0 3px rgba(229,62,62,0.25)" : "sm"}
            >
              {formatRemainingTime(remainingSeconds)}
            </Badge>
          ) : (
            <Badge
              px={3}
              py={2}
              borderRadius="xl"
              fontSize="xs"
              bg="whiteAlpha.200"
              color="white"
            >
              بدون حد زمني
            </Badge>
          )}
        </Flex>

        <ExamStudentProgress
          remainingSeconds={remainingSeconds}
          answeredCount={answeredCount}
          totalQuestions={totalQuestions}
          questions={questions}
          currentQuestionIndex={currentIndex}
          studentAnswers={studentAnswers}
          showPagination
          hasActiveAttempt={hasActiveAttempt}
          compact
          onGoToQuestion={onGoToQuestion}
          onDarkSurface
        />
      </Box>
    </Box>
  );
}
