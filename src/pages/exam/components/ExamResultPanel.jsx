import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Flex,
  Progress,
  Divider,
  useColorModeValue,
} from "@chakra-ui/react";
import { AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { ExamQuestionImage } from "./ExamQuestionDisplay";
import { renderFormattedExamText } from "../../../utils/renderFormattedExamText";

export default function ExamResultPanel({
  submitResult,
  feedback,
  attemptHistory,
  examData,
  onZoomImage,
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.600");
  const muted = useColorModeValue("gray.500", "gray.400");
  const heading = useColorModeValue("gray.800", "gray.100");
  const softBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const progressTrack = useColorModeValue("gray.100", "gray.700");

  const totalGrade = submitResult?.totalGrade ?? attemptHistory?.[0]?.totalGrade ?? 0;
  const maxGrade = submitResult?.maxGrade ?? examData?.totalGrade ?? 100;
  const percentage = maxGrade > 0 ? Math.round((totalGrade / maxGrade) * 100) : 0;
  const passed = submitResult?.passed ?? percentage >= 50;
  const wrongQuestions =
    submitResult?.wrongQuestions ?? feedback?.wrongQuestions ?? [];
  const wrongCount = wrongQuestions.length;
  const isPerfect = maxGrade > 0 && Number(totalGrade) >= Number(maxGrade) && wrongCount === 0;
  const accent = passed ? "green" : "orange";

  const releaseLabel =
    feedback?.releaseReason === "immediate"
      ? "تم إظهار الإجابات فوراً"
      : feedback?.releaseReason === "scheduled_release"
        ? "تم إظهار الإجابات في الموعد المحدد"
        : feedback?.releaseReason
          ? "تم إظهار الإجابات بعد المدة المحددة"
          : null;

  return (
    <VStack spacing={6} align="stretch" w="full">
      <Box
        borderRadius="xl"
        borderWidth="1px"
        borderColor={cardBorder}
        bg={cardBg}
        overflow="hidden"
      >
        <Box h="3px" bg={`${accent}.400`} />

        <Box p={{ base: 5, md: 6 }}>
          <Flex
            direction={{ base: "column", sm: "row" }}
            align={{ base: "stretch", sm: "center" }}
            justify="space-between"
            gap={6}
          >
            <HStack spacing={5} align="center">
              <ScoreRing percentage={percentage} passed={passed} />
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" color={muted}>
                  نتيجة الامتحان
                </Text>
                <HStack spacing={2} align="baseline">
                  <Text fontSize="4xl" fontWeight="bold" lineHeight="1" color={heading}>
                    {totalGrade}
                  </Text>
                  <Text fontSize="lg" color={muted} fontWeight="medium">
                    / {maxGrade}
                  </Text>
                </HStack>
                <HStack spacing={2} mt={1}>
                  <StatusDot passed={passed} />
                  <Text fontSize="sm" fontWeight="medium" color={`${accent}.600`}>
                    {passed ? "ناجح" : "يحتاج مراجعة"}
                  </Text>
                  <Text fontSize="sm" color={muted}>
                    · {percentage}%
                  </Text>
                </HStack>
              </VStack>
            </HStack>

            <VStack
              align={{ base: "stretch", sm: "end" }}
              spacing={2}
              minW={{ sm: "140px" }}
            >
              <StatPill label="أخطاء" value={wrongCount} tone="red" />
              {releaseLabel && (
                <Text fontSize="xs" color={muted} textAlign={{ base: "start", sm: "end" }}>
                  {releaseLabel}
                </Text>
              )}
            </VStack>
          </Flex>

          <Box mt={5}>
            <Flex justify="space-between" mb={1.5}>
              <Text fontSize="xs" color={muted}>
                مستوى الأداء
              </Text>
              <Text fontSize="xs" fontWeight="semibold" color={heading}>
                {percentage}%
              </Text>
            </Flex>
            <Progress
              value={percentage}
              size="sm"
              colorScheme={accent}
              borderRadius="full"
              bg={progressTrack}
            />
          </Box>
        </Box>
      </Box>

      {wrongCount > 0 && (
        <Box>
          <Text fontSize="sm" fontWeight="semibold" color={heading} mb={3}>
            مراجعة الأخطاء ({wrongCount})
          </Text>
          <VStack spacing={3} align="stretch">
            {wrongQuestions.map((wq, idx) => (
              <WrongAnswerCard
                key={wq.questionId ?? idx}
                index={idx}
                question={wq}
                onZoomImage={onZoomImage}
                cardBg={cardBg}
                cardBorder={cardBorder}
                softBg={softBg}
                heading={heading}
                muted={muted}
              />
            ))}
          </VStack>
        </Box>
      )}

      {wrongCount === 0 && isPerfect && (
        <Box
          p={5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={cardBorder}
          bg={softBg}
          textAlign="center"
        >
          <HStack justify="center" spacing={2} color="green.600">
            <AiOutlineCheckCircle size={20} />
            <Text fontSize="sm" fontWeight="medium">
              لا توجد أخطاء — أحسنت!
            </Text>
          </HStack>
        </Box>
      )}
      {wrongCount === 0 && !isPerfect && (
        <Box
          p={5}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={cardBorder}
          bg={softBg}
          textAlign="center"
        >
          <HStack justify="center" spacing={2} color="orange.600">
            <AiOutlineCloseCircle size={20} />
            <Text fontSize="sm" fontWeight="medium">
              توجد أسئلة خاطئة أو متروكة — السؤال المتروك لا يُحتسب
            </Text>
          </HStack>
        </Box>
      )}
    </VStack>
  );
}

function ScoreRing({ percentage, passed }) {
  const ringColor = passed ? "#22c55e" : "#f97316";
  const trackColor = useColorModeValue("#e5e7eb", "#374151");

  const size = 72;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <Box position="relative" w={`${size}px`} h={`${size}px`} flexShrink={0}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <Flex
        position="absolute"
        inset={0}
        align="center"
        justify="center"
        fontSize="sm"
        fontWeight="bold"
        color={passed ? "green.600" : "orange.600"}
      >
        {percentage}%
      </Flex>
    </Box>
  );
}

function StatusDot({ passed }) {
  return (
    <Box
      w={2}
      h={2}
      borderRadius="full"
      bg={passed ? "green.400" : "orange.400"}
      boxShadow={passed ? "0 0 0 3px rgba(34,197,94,0.2)" : "0 0 0 3px rgba(249,115,22,0.2)"}
    />
  );
}

function StatPill({ label, value, tone }) {
  const bg = useColorModeValue(`${tone}.50`, "whiteAlpha.100");
  const color = `${tone}.600`;

  return (
    <HStack
      px={3}
      py={2}
      borderRadius="lg"
      bg={bg}
      spacing={2}
      justify="space-between"
      w={{ base: "full", sm: "auto" }}
      minW="120px"
    >
      <Text fontSize="xs" color="gray.500">
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="bold" color={color}>
        {value}
      </Text>
    </HStack>
  );
}

function WrongAnswerCard({
  index,
  question: wq,
  onZoomImage,
  cardBg,
  cardBorder,
  softBg,
  heading,
  muted,
}) {
  return (
    <Box
      borderRadius="xl"
      borderWidth="1px"
      borderColor={cardBorder}
      bg={cardBg}
      overflow="hidden"
    >
      <Box px={4} py={3} bg={softBg} borderBottomWidth="1px" borderColor={cardBorder}>
        <Text fontSize="xs" fontWeight="semibold" color={muted}>
          سؤال {index + 1}
        </Text>
      </Box>

      <Box p={4}>
        {wq.questionText && (
          <Text fontSize="sm" fontWeight="medium" color={heading} lineHeight="1.9" mb={3}>
            {renderFormattedExamText(wq.questionText)}
          </Text>
        )}

        {wq.questionImage && (
          <Box mb={3}>
            <ExamQuestionImage src={wq.questionImage} onZoom={onZoomImage} compact />
          </Box>
        )}

        <Divider mb={3} borderColor={cardBorder} />

        <VStack spacing={2} align="stretch">
          <AnswerRow
            type="wrong"
            label="إجابتك"
            text={
              wq.yourChoice?.text
                ? renderFormattedExamText(wq.yourChoice.text)
                : "لم تجب"
            }
          />
          <AnswerRow
            type="correct"
            label="الصحيحة"
            text={renderFormattedExamText(wq.correctChoice?.text)}
          />
        </VStack>
      </Box>
    </Box>
  );
}

function AnswerRow({ type, label, text }) {
  const isWrong = type === "wrong";
  const borderColor = isWrong ? "red.400" : "green.400";
  const labelColor = isWrong ? "red.500" : "green.600";
  const bg = useColorModeValue("gray.50", "whiteAlpha.50");
  const IconComp = isWrong ? AiOutlineCloseCircle : AiOutlineCheckCircle;

  return (
    <Flex
      gap={3}
      p={3}
      borderRadius="lg"
      bg={bg}
      borderRightWidth="3px"
      borderRightColor={borderColor}
      align="start"
    >
      <HStack spacing={1.5} minW="72px" flexShrink={0}>
        <IconComp size={14} color={isWrong ? "#ef4444" : "#16a34a"} />
        <Text fontSize="xs" fontWeight="bold" color={labelColor}>
          {label}
        </Text>
      </HStack>
      <Text fontSize="sm" lineHeight="1.8" color={useColorModeValue("gray.700", "gray.200")}>
        {text}
      </Text>
    </Flex>
  );
}
