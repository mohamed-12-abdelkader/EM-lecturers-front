import React from "react";
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
} from "@chakra-ui/react";
import { FaEdit, FaTrash, FaCheck, FaSearchPlus } from "react-icons/fa";
import { renderFormattedExamText } from "../../../utils/renderFormattedExamText";
import { ExamQuestionImage } from "../../exam/components/ExamQuestionDisplay";
import { isPassageStatementQuestion } from "../utils/teacherLibraryQuestionUtils";

const CHOICE_LETTERS = ["أ", "ب", "ج", "د"];

function FormattedText({ value, fontSize = "sm", fontWeight, color, lineHeight = "1.85", ...rest }) {
  if (!value) return null;
  return (
    <Text fontSize={fontSize} fontWeight={fontWeight} color={color} lineHeight={lineHeight} {...rest}>
      {renderFormattedExamText(value)}
    </Text>
  );
}

function difficultyLabel(level) {
  if (level === "easy") return "سهل";
  if (level === "hard") return "صعب";
  return "متوسط";
}

export default function LibraryQuestionCard({
  question,
  index,
  selectedIds = [],
  onToggleSelect,
  onEdit,
  onDelete,
  onSetCorrect,
  pendingId,
  showSelect = false,
  onZoomImage,
  inPassage = false,
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const muted = useColorModeValue("gray.500", "gray.400");
  const choiceBg = useColorModeValue("gray.50", "gray.700");
  const choiceHover = useColorModeValue("blue.50", "whiteAlpha.100");
  const correctBg = useColorModeValue("green.50", "green.900");
  const correctBorder = useColorModeValue("green.300", "green.500");
  const questionBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const questionBorder = useColorModeValue("blue.100", "blue.700");

  const choices = question.choices || [];
  const isStatement = isPassageStatementQuestion(question, inPassage);
  const isChoice = !isStatement && question.question_type === "choice" && choices.length > 0;
  const correctIdx =
    question.correct_answer_index != null
      ? question.correct_answer_index
      : choices.findIndex((c) => c === question.answer);
  const hasCorrect = isChoice && correctIdx >= 0;
  const imageUrl = question.image_url || question.imageUrl;

  if (isStatement) {
    return (
      <Flex
        gap={3}
        align="start"
        p={3}
        borderRadius="lg"
        borderWidth="1px"
        borderColor={borderColor}
        bg={choiceBg}
      >
        {showSelect && onToggleSelect ? (
          <Checkbox
            mt={1}
            colorScheme="blue"
            isChecked={selectedIds.includes(question.id)}
            onChange={(e) => onToggleSelect(question.id, e.target.checked)}
          />
        ) : null}
        <Flex
          w={7}
          h={7}
          borderRadius="md"
          bg="orange.400"
          color="white"
          align="center"
          justify="center"
          fontSize="xs"
          fontWeight="bold"
          flexShrink={0}
        >
          {index + 1}
        </Flex>
        <Box flex={1} minW={0}>
          <FormattedText value={question.question_text} fontSize="sm" color={textColor} />
          <Badge mt={2} variant="subtle" colorScheme="gray" fontSize="xs">
            عبارة للمراجعة
          </Badge>
        </Box>
        <HStack spacing={0} flexShrink={0}>
          {onEdit && (
            <IconButton
              aria-label="تعديل"
              icon={<FaEdit />}
              size="xs"
              variant="ghost"
              colorScheme="blue"
              onClick={() => onEdit(question)}
            />
          )}
          {onDelete && (
            <IconButton
              aria-label="حذف"
              icon={<FaTrash />}
              size="xs"
              variant="ghost"
              colorScheme="red"
              onClick={() => onDelete(question)}
            />
          )}
        </HStack>
      </Flex>
    );
  }

  return (
    <Box
      p={{ base: 3, md: 4 }}
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      boxShadow="sm"
    >
      <Flex justify="space-between" align="start" gap={3} mb={3}>
        <HStack align="start" spacing={2} flex={1} minW={0}>
          {showSelect && onToggleSelect && (
            <Checkbox
              mt={1}
              colorScheme="blue"
              isChecked={selectedIds.includes(question.id)}
              onChange={(e) => onToggleSelect(question.id, e.target.checked)}
            />
          )}
          <Flex
            w={7}
            h={7}
            borderRadius="md"
            bg="blue.500"
            color="white"
            align="center"
            justify="center"
            fontSize="xs"
            fontWeight="bold"
            flexShrink={0}
          >
            {index + 1}
          </Flex>
          <Box minW={0} flex={1}>
            <HStack spacing={2} mb={2} flexWrap="wrap">
              <Badge variant="outline" colorScheme="blue" fontSize="xs" borderRadius="md">
                {question.question_type === "text" ? "مقالي" : "اختياري"}
              </Badge>
              <Badge variant="subtle" colorScheme="orange" fontSize="xs" borderRadius="md">
                {difficultyLabel(question.difficulty_level)}
              </Badge>
              {question.points != null && (
                <Text fontSize="xs" color={muted}>
                  {question.points} درجة
                </Text>
              )}
              {isChoice && !hasCorrect && (
                <Badge colorScheme="orange" variant="outline" fontSize="xs">
                  بدون إجابة محددة
                </Badge>
              )}
            </HStack>
          </Box>
        </HStack>
        <HStack spacing={0} flexShrink={0}>
          {onEdit && (
            <IconButton
              aria-label="تعديل"
              icon={<FaEdit />}
              size="xs"
              variant="ghost"
              colorScheme="blue"
              onClick={() => onEdit(question)}
            />
          )}
          {onDelete && (
            <IconButton
              aria-label="حذف"
              icon={<FaTrash />}
              size="xs"
              variant="ghost"
              colorScheme="red"
              onClick={() => onDelete(question)}
            />
          )}
        </HStack>
      </Flex>

      <Box
        p={3}
        mb={3}
        borderRadius="lg"
        bg={questionBg}
        borderWidth="1px"
        borderColor={questionBorder}
      >
        <FormattedText
          value={question.question_text}
          fontSize={{ base: "sm", md: "md" }}
          fontWeight="semibold"
          color={textColor}
        />
      </Box>

      {imageUrl ? (
        <Box mb={3} position="relative">
          <ExamQuestionImage src={imageUrl} onZoom={onZoomImage} compact />
          {onZoomImage ? (
            <IconButton
              aria-label="تكبير الصورة"
              icon={<FaSearchPlus />}
              size="sm"
              position="absolute"
              top={3}
              left={3}
              colorScheme="blue"
              variant="solid"
              onClick={() => onZoomImage(imageUrl)}
            />
          ) : null}
        </Box>
      ) : null}

      {isChoice ? (
        <Box>
          <Text fontSize="xs" fontWeight="semibold" color={muted} mb={2} letterSpacing="wide">
            الاختيارات — اضغط لتعيين الإجابة الصحيحة
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
            {choices.map((option, optIndex) => {
              const isCorrect = correctIdx === optIndex;
              const isPending = pendingId === question.id && isCorrect;
              const letter = CHOICE_LETTERS[optIndex] || String.fromCharCode(65 + optIndex);
              return (
                <Flex
                  key={optIndex}
                  align="center"
                  gap={2}
                  p={2.5}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={isCorrect ? correctBorder : borderColor}
                  bg={isCorrect ? correctBg : choiceBg}
                  cursor={onSetCorrect ? "pointer" : "default"}
                  transition="background 0.15s, border-color 0.15s"
                  _hover={onSetCorrect && !isCorrect ? { bg: choiceHover, borderColor: "blue.200" } : undefined}
                  onClick={() => onSetCorrect?.(question, optIndex)}
                  role={onSetCorrect ? "button" : undefined}
                >
                  <Flex
                    w={8}
                    h={8}
                    flexShrink={0}
                    borderRadius="md"
                    bg={isCorrect ? "green.500" : "white"}
                    color={isCorrect ? "white" : "blue.600"}
                    borderWidth="1px"
                    borderColor={isCorrect ? "green.500" : "blue.200"}
                    align="center"
                    justify="center"
                    fontSize="sm"
                    fontWeight="bold"
                  >
                    {isPending ? <Spinner size="xs" color={isCorrect ? "white" : "blue.500"} /> : letter}
                  </Flex>
                  <Box flex={1} minW={0}>
                    <FormattedText value={option} fontSize="sm" color={isCorrect ? "green.800" : textColor} />
                  </Box>
                  {isCorrect && (
                    <Flex color="green.500" flexShrink={0}>
                      <FaCheck size={14} />
                    </Flex>
                  )}
                </Flex>
              );
            })}
          </SimpleGrid>
        </Box>
      ) : (
        <Box
          p={3}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
          bg={choiceBg}
        >
          <Text fontSize="xs" color={muted} mb={1}>
            سؤال مقالي
          </Text>
          {question.answer ? (
            <Box>
              <Text fontSize="xs" color={muted} mb={1}>
                الإجابة النموذجية:
              </Text>
              <FormattedText value={question.answer} fontSize="sm" color={textColor} />
            </Box>
          ) : (
            <Text fontSize="sm" color={muted}>
              لم تُحدَّد إجابة نموذجية بعد
            </Text>
          )}
        </Box>
      )}

      {question.explanation && (
        <Box mt={3} pt={3} borderTopWidth="1px" borderColor={borderColor}>
          <Text fontSize="xs" color={muted} mb={1}>
            الشرح
          </Text>
          <FormattedText value={question.explanation} fontSize="sm" color={textColor} />
        </Box>
      )}
    </Box>
  );
}
