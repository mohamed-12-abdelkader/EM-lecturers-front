import React, { memo, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  Badge,
  HStack,
  IconButton,
  Checkbox,
  SimpleGrid,
  useColorModeValue,
  Spinner,
  Icon,
  Circle,
} from "@chakra-ui/react";
import { FaEdit, FaTrash, FaCheck, FaSearchPlus, FaCheckCircle } from "react-icons/fa";
import { renderFormattedExamText } from "../../../utils/renderFormattedExamText";
import { ExamQuestionImage } from "../../exam/components/ExamQuestionDisplay";
import { isPassageStatementQuestion } from "../utils/teacherLibraryQuestionUtils";

const CHOICE_LETTERS = ["أ", "ب", "ج", "د", "هـ", "و"];

function FormattedText({ value, fontSize = "sm", fontWeight, color, lineHeight = "1.9", ...rest }) {
  if (!value) return null;
  return (
    <Text fontSize={fontSize} fontWeight={fontWeight} color={color} lineHeight={lineHeight} {...rest}>
      {renderFormattedExamText(value)}
    </Text>
  );
}

function difficultyMeta(level) {
  if (level === "easy") return { label: "سهل", scheme: "green", color: "green.500" };
  if (level === "hard") return { label: "صعب", scheme: "red", color: "red.500" };
  return { label: "متوسط", scheme: "orange", color: "orange.500" };
}

function LibraryQuestionCard({
  question,
  index,
  isSelected = false,
  onToggleSelect,
  onEdit,
  onDelete,
  onSetCorrect,
  pendingId,
  showSelect = false,
  onZoomImage,
  inPassage = false,
}) {
  const pageSoft = useColorModeValue("#F7FAFC", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.50");
  const muted = useColorModeValue("gray.500", "gray.400");
  const choiceBg = useColorModeValue("gray.50", "gray.700");
  const choiceHover = useColorModeValue("#EBF8FF", "whiteAlpha.100");
  const correctBg = useColorModeValue("#F0FFF4", "green.900");
  const correctBorder = useColorModeValue("green.400", "green.400");
  const selectedBg = useColorModeValue("#EBF8FF", "blue.900");
  const accent = useColorModeValue("blue.500", "blue.300");
  const essayBg = useColorModeValue("purple.50", "purple.900");

  const choices = question.choices || [];
  const isStatement = isPassageStatementQuestion(question, inPassage);
  const isChoice = !isStatement && question.question_type === "choice" && choices.length > 0;
  const correctIdx =
    question.correct_answer_index != null
      ? question.correct_answer_index
      : choices.findIndex((c) => c === question.answer);
  const hasCorrect = isChoice && correctIdx >= 0;
  const imageUrl = question.image_url || question.imageUrl;
  const difficulty = difficultyMeta(question.difficulty_level);
  const canSelect = showSelect && typeof onToggleSelect === "function";

  const toggleSelect = useCallback(
    (e) => {
      e?.stopPropagation?.();
      if (!canSelect) return;
      onToggleSelect(question.id, !isSelected);
    },
    [canSelect, isSelected, onToggleSelect, question.id],
  );

  if (isStatement) {
    return (
      <Flex
        gap={3}
        align="start"
        p={4}
        borderRadius="2xl"
        borderWidth="2px"
        borderColor={isSelected ? "blue.400" : borderColor}
        bg={isSelected ? selectedBg : pageSoft}
        cursor={canSelect ? "pointer" : "default"}
        onClick={canSelect ? toggleSelect : undefined}
        transition="border-color 0.1s, background 0.1s"
      >
        {canSelect ? (
          <Checkbox
            mt={1}
            colorScheme="blue"
            size="lg"
            isChecked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect(question.id, e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : null}
        <Circle size="36px" bg="orange.400" color="white" fontWeight="bold" fontSize="sm" flexShrink={0}>
          {index + 1}
        </Circle>
        <Box flex={1} minW={0}>
          <FormattedText value={question.question_text} fontSize="md" color={textColor} />
          <Badge mt={2} colorScheme="orange" borderRadius="full">عبارة للمراجعة</Badge>
        </Box>
        <HStack spacing={1} onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <IconButton aria-label="تعديل" icon={<FaEdit />} size="sm" variant="ghost" colorScheme="blue" onClick={() => onEdit(question)} />
          )}
          {onDelete && (
            <IconButton aria-label="حذف" icon={<FaTrash />} size="sm" variant="ghost" colorScheme="red" onClick={() => onDelete(question)} />
          )}
        </HStack>
      </Flex>
    );
  }

  return (
    <Box
      position="relative"
      overflow="hidden"
      bg={isSelected ? selectedBg : cardBg}
      borderWidth="2px"
      borderColor={isSelected ? "blue.400" : borderColor}
      borderRadius="2xl"
      boxShadow={isSelected ? "0 10px 30px rgba(49,130,206,0.18)" : "0 4px 16px rgba(0,0,0,0.06)"}
      transition="border-color 0.1s, background 0.1s, box-shadow 0.1s"
      cursor={canSelect ? "pointer" : "default"}
      onClick={canSelect ? toggleSelect : undefined}
      _hover={
        canSelect
          ? {
              borderColor: isSelected ? "blue.400" : "blue.200",
              boxShadow: isSelected
                ? "0 14px 34px rgba(49,130,206,0.22)"
                : "0 10px 28px rgba(0,0,0,0.1)",
            }
          : undefined
      }
    >
      {/* accent strip */}
      <Box
        position="absolute"
        top={0}
        right={0}
        bottom={0}
        w="6px"
        bgGradient={
          isSelected
            ? "linear(to-b, blue.400, blue.600)"
            : inPassage
              ? "linear(to-b, orange.300, orange.500)"
              : "linear(to-b, blue.300, blue.500)"
        }
      />

      {isSelected ? (
        <HStack
          position="absolute"
          top={3}
          left={3}
          spacing={1}
          px={3}
          py={1}
          borderRadius="full"
          bg="blue.500"
          color="white"
          fontSize="xs"
          fontWeight="bold"
          zIndex={2}
          shadow="md"
        >
          <Icon as={FaCheckCircle} />
          <Text>محدد</Text>
        </HStack>
      ) : null}

      <Box p={{ base: 4, md: 5 }} pr={{ base: 5, md: 6 }}>
        <Flex justify="space-between" align="start" gap={3} mb={4}>
          <HStack align="start" spacing={3} flex={1} minW={0}>
            {canSelect ? (
              <Checkbox
                mt={2}
                colorScheme="blue"
                size="lg"
                isChecked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelect(question.id, e.target.checked);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : null}

            <Flex
              direction="column"
              align="center"
              justify="center"
              minW="52px"
              h="52px"
              borderRadius="2xl"
              bgGradient="linear(to-br, blue.500, blue.700)"
              color="white"
              shadow="md"
              flexShrink={0}
            >
              <Text fontSize="10px" opacity={0.85} lineHeight="1">
                سؤال
              </Text>
              <Text fontSize="lg" fontWeight="extrabold" lineHeight="1.1">
                {index + 1}
              </Text>
            </Flex>

            <Box minW={0} flex={1} pt={1}>
              <HStack spacing={2} flexWrap="wrap" mb={2}>
                <Badge
                  borderRadius="full"
                  px={3}
                  py={0.5}
                  colorScheme={question.question_type === "text" ? "orange" : "blue"}
                  fontSize="xs"
                >
                  {question.question_type === "text" ? "مقالي" : "اختيار من متعدد"}
                </Badge>
                <Badge borderRadius="full" px={3} py={0.5} colorScheme={difficulty.scheme} fontSize="xs">
                  {difficulty.label}
                </Badge>
                {question.points != null && (
                  <Badge borderRadius="full" px={3} py={0.5} variant="outline" colorScheme="gray" fontSize="xs">
                    {question.points} درجة
                  </Badge>
                )}
                {isChoice && !hasCorrect && (
                  <Badge borderRadius="full" px={3} py={0.5} colorScheme="orange" fontSize="xs">
                    بدون إجابة صحيحة
                  </Badge>
                )}
              </HStack>
            </Box>
          </HStack>

          <HStack spacing={1} flexShrink={0} onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <IconButton
                aria-label="تعديل"
                icon={<FaEdit />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
                borderRadius="xl"
                bg={pageSoft}
                onClick={() => onEdit(question)}
              />
            )}
            {onDelete && (
              <IconButton
                aria-label="حذف"
                icon={<FaTrash />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                borderRadius="xl"
                onClick={() => onDelete(question)}
              />
            )}
          </HStack>
        </Flex>

        {/* question stem */}
        <Box
          mb={4}
          p={{ base: 4, md: 5 }}
          borderRadius="2xl"
          bg={pageSoft}
          borderWidth="1px"
          borderColor={borderColor}
        >
          <FormattedText
            value={question.question_text}
            fontSize={{ base: "md", md: "lg" }}
            fontWeight="bold"
            color={textColor}
            lineHeight="2"
          />
        </Box>

        {imageUrl ? (
          <Box mb={4} position="relative" onClick={(e) => e.stopPropagation()}>
            <Box borderRadius="2xl" overflow="hidden" borderWidth="1px" borderColor={borderColor}>
              <ExamQuestionImage src={imageUrl} onZoom={onZoomImage} compact />
            </Box>
            {onZoomImage ? (
              <IconButton
                aria-label="تكبير الصورة"
                icon={<FaSearchPlus />}
                size="sm"
                position="absolute"
                top={3}
                left={3}
                colorScheme="blue"
                borderRadius="xl"
                onClick={() => onZoomImage(imageUrl)}
              />
            ) : null}
          </Box>
        ) : null}

        {isChoice ? (
          <Box onClick={(e) => e.stopPropagation()}>
            <Text fontSize="xs" fontWeight="bold" color={muted} mb={3} letterSpacing="0.04em">
              الاختيارات — اضغط على الإجابة الصحيحة
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              {choices.map((option, optIndex) => {
                const isCorrect = correctIdx === optIndex;
                const isPending = pendingId === question.id && isCorrect;
                const letter = CHOICE_LETTERS[optIndex] || String.fromCharCode(65 + optIndex);
                return (
                  <Flex
                    key={optIndex}
                    align="center"
                    gap={3}
                    p={3.5}
                    minH="56px"
                    borderRadius="2xl"
                    borderWidth="2px"
                    borderColor={isCorrect ? correctBorder : borderColor}
                    bg={isCorrect ? correctBg : choiceBg}
                    cursor={onSetCorrect ? "pointer" : "default"}
                    transition="all 0.15s"
                    _hover={
                      onSetCorrect && !isCorrect
                        ? { bg: choiceHover, borderColor: accent, transform: "translateY(-1px)" }
                        : undefined
                    }
                    onClick={() => onSetCorrect?.(question, optIndex)}
                    role={onSetCorrect ? "button" : undefined}
                  >
                    <Flex
                      w="40px"
                      h="40px"
                      flexShrink={0}
                      borderRadius="full"
                      bg={isCorrect ? "green.500" : cardBg}
                      color={isCorrect ? "white" : accent}
                      borderWidth="2px"
                      borderColor={isCorrect ? "green.500" : "blue.200"}
                      align="center"
                      justify="center"
                      fontSize="md"
                      fontWeight="extrabold"
                      shadow={isCorrect ? "md" : "sm"}
                    >
                      {isPending ? <Spinner size="sm" /> : letter}
                    </Flex>
                    <Box flex={1} minW={0}>
                      <FormattedText
                        value={option}
                        fontSize="md"
                        fontWeight={isCorrect ? "bold" : "medium"}
                        color={isCorrect ? "green.700" : textColor}
                      />
                    </Box>
                    {isCorrect && (
                      <Circle size="28px" bg="green.500" color="white" flexShrink={0}>
                        <FaCheck size={12} />
                      </Circle>
                    )}
                  </Flex>
                );
              })}
            </SimpleGrid>
          </Box>
        ) : (
          <Box
            p={4}
            borderRadius="2xl"
            borderWidth="2px"
            borderColor="purple.200"
            bg={essayBg}
            onClick={(e) => e.stopPropagation()}
          >
            <Text fontSize="xs" fontWeight="bold" color="purple.500" mb={2}>
              إجابة السؤال المقالي
            </Text>
            {question.answer ? (
              <FormattedText value={question.answer} fontSize="md" color={textColor} />
            ) : (
              <Text fontSize="sm" color={muted}>
                لم تُحدَّد إجابة نموذجية بعد
              </Text>
            )}
          </Box>
        )}

        {question.explanation ? (
          <Box
            mt={4}
            pt={4}
            borderTopWidth="1px"
            borderColor={borderColor}
            onClick={(e) => e.stopPropagation()}
          >
            <Text fontSize="xs" fontWeight="bold" color={muted} mb={1}>
              الشرح
            </Text>
            <FormattedText value={question.explanation} fontSize="sm" color={textColor} />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

function questionCardPropsAreEqual(prev, next) {
  return (
    prev.question === next.question &&
    prev.isSelected === next.isSelected &&
    prev.pendingId === next.pendingId &&
    prev.index === next.index &&
    prev.inPassage === next.inPassage &&
    prev.showSelect === next.showSelect &&
    prev.onToggleSelect === next.onToggleSelect &&
    prev.onEdit === next.onEdit &&
    prev.onDelete === next.onDelete &&
    prev.onSetCorrect === next.onSetCorrect &&
    prev.onZoomImage === next.onZoomImage
  );
}

export default memo(LibraryQuestionCard, questionCardPropsAreEqual);
