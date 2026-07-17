import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Image,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  IconButton,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaPlus, FaTrash } from "react-icons/fa";
import {
  getChoiceLetter,
  MCQ_CHOICE_MAX,
  MCQ_CHOICE_MIN,
} from "../../api/ocrQuestionExtractionApi";
import ExtractionMathPreview from "./ExtractionMathPreview";
import FormattedQuestionText from "./FormattedQuestionText";

/**
 * بطاقة مراجعة سؤال مستخرج — تعرض 2–6 اختيارات بوضوح
 */
export default function ExtractionDraftQuestionCard({
  draft,
  index,
  accentScheme = "purple",
  onUpdate,
  onRemove,
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const questionPanelBg = useColorModeValue("gray.50", "gray.900");
  const optionBg = useColorModeValue("white", "gray.800");
  const optionHoverBg = useColorModeValue(`${accentScheme}.50`, "whiteAlpha.100");
  const correctBg = useColorModeValue("green.50", "green.900");
  const correctBorder = useColorModeValue("green.400", "green.500");
  const selectedBorder = useColorModeValue(`${accentScheme}.400`, `${accentScheme}.300`);
  const muted = useColorModeValue("gray.500", "gray.400");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const letterBg = useColorModeValue(`${accentScheme}.500`, `${accentScheme}.400`);
  const inputBg = useColorModeValue("white", "gray.700");

  const choices = Array.isArray(draft.choices) ? draft.choices : [];
  const isChoice = draft.question_type === "choice";
  const canAddChoice = choices.length < MCQ_CHOICE_MAX;
  const canRemoveChoice = choices.length > MCQ_CHOICE_MIN;

  const patch = (data) => onUpdate(draft.id, data);

  const setChoiceAt = (cIdx, value) => {
    const next = [...choices];
    const oldVal = next[cIdx];
    next[cIdx] = value;
    const update = { choices: next };
    if (draft.answer === oldVal) update.answer = value;
    patch(update);
  };

  const addChoice = () => {
    if (!canAddChoice) return;
    patch({ choices: [...choices, ""] });
  };

  const removeChoice = (cIdx) => {
    if (!canRemoveChoice) return;
    const removed = choices[cIdx];
    const next = choices.filter((_, i) => i !== cIdx);
    const update = { choices: next };
    if (Number.isInteger(draft.correctAnswerIndex)) {
      if (draft.correctAnswerIndex === cIdx) {
        update.correctAnswerIndex = null;
        update.answer = "";
      } else if (draft.correctAnswerIndex > cIdx) {
        update.correctAnswerIndex = draft.correctAnswerIndex - 1;
      }
    }
    if (draft.answer === removed) {
      update.answer = "";
      update.correctAnswerIndex = null;
    }
    patch(update);
  };

  const selectCorrect = (cIdx) => {
    if (!choices[cIdx]?.trim()) return;
    patch({
      correctAnswerIndex: cIdx,
      answer: choices[cIdx],
      answerInferred: false,
    });
  };

  return (
    <Box
      p={{ base: 3, md: 5 }}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={borderColor}
      bg={cardBg}
      boxShadow="sm"
    >
      <Flex justify="space-between" align="center" mb={4} gap={2} flexWrap="wrap">
        <HStack spacing={2} flexWrap="wrap">
          <Badge colorScheme={accentScheme} borderRadius="full" px={3} py={1} fontSize="sm">
            سؤال {index + 1}
          </Badge>
          {draft.source_number != null && (
            <Badge variant="subtle" colorScheme="gray" borderRadius="full">
              المصدر: {draft.source_number}
            </Badge>
          )}
          {isChoice && (
            <Badge variant="subtle" colorScheme="blue" borderRadius="full">
              {choices.length} اختيارات
            </Badge>
          )}
          {draft.passage_id && (
            <Badge colorScheme="blue" variant="subtle" borderRadius="full">
              سؤال قطعة
            </Badge>
          )}
          {draft.answerInferred && (
            <Badge colorScheme="orange" fontSize="xs" borderRadius="full">
              إجابة مُستنتجة
            </Badge>
          )}
          {draft.question_type === "text_with_image" && (
            <Badge colorScheme="cyan" fontSize="xs" borderRadius="full">
              سؤال بصورة
            </Badge>
          )}
        </HStack>
        <IconButton
          icon={<FaTrash />}
          aria-label="حذف"
          size="sm"
          colorScheme="red"
          variant="ghost"
          onClick={() => onRemove(draft.id)}
        />
      </Flex>

      <FormControl mb={3}>
        <FormLabel fontSize="sm" fontWeight="semibold">
          نوع السؤال
        </FormLabel>
        <Select
          value={draft.question_type}
          onChange={(e) => {
            const type = e.target.value;
            patch({
              question_type: type,
              choices:
                type === "choice"
                  ? choices.length >= MCQ_CHOICE_MIN
                    ? choices
                    : ["", "", "", ""]
                  : ["", "", "", ""],
              answer: type === "choice" ? draft.answer : "",
              correctAnswerIndex: type === "choice" ? draft.correctAnswerIndex : null,
            });
          }}
          dir="rtl"
          borderRadius="xl"
        >
          <option value="choice">اختيار من متعدد (2–6 خيارات)</option>
          <option value="text_with_image">سؤال بصورة (بدون اختيارات)</option>
        </Select>
      </FormControl>

      {/* معاينة السؤال بوضوح */}
      <Box
        mb={4}
        p={{ base: 3, md: 4 }}
        borderRadius="xl"
        bg={questionPanelBg}
        borderWidth="1px"
        borderColor={borderColor}
      >
        <Text fontSize="xs" fontWeight="bold" color={muted} mb={2} letterSpacing="0.02em">
          نص السؤال
        </Text>
        {draft.question_text?.trim() ? (
          <Box
            dir="auto"
            fontSize={{ base: "md", md: "lg" }}
            fontWeight="semibold"
            color={textColor}
            lineHeight="1.85"
            whiteSpace="pre-wrap"
            wordBreak="break-word"
          >
            <FormattedQuestionText
              value={draft.question_text}
              fontSize="inherit"
              lineHeight="inherit"
              color="inherit"
            />
          </Box>
        ) : (
          <Text fontSize="sm" color={muted}>
            لا يوجد نص بعد — عدّل الحقل بالأسفل
          </Text>
        )}
      </Box>

      <FormControl mb={4}>
        <FormLabel fontSize="sm" fontWeight="semibold">
          تعديل نص السؤال
        </FormLabel>
        <Textarea
          value={draft.question_text}
          onChange={(e) => patch({ question_text: e.target.value })}
          rows={3}
          dir="auto"
          fontSize="md"
          lineHeight="1.8"
          borderRadius="xl"
          placeholder="اكتب أو صحّح نص السؤال هنا"
        />
        <ExtractionMathPreview value={draft.question_text} />
      </FormControl>

      <FormControl mb={4}>
        <FormLabel fontSize="sm" fontWeight="semibold">
          صور السؤال المستخرجة (اختياري)
        </FormLabel>
        {draft.questionImages?.length > 0 ? (
          <VStack align="stretch" spacing={3}>
            {draft.questionImages.map((image, imageIndex) => (
              <Box key={image.image_id || image.image_url || imageIndex}>
                <Image
                  src={image.image_url}
                  alt={image.short_description || `صورة السؤال ${index + 1}`}
                  maxH="180px"
                  objectFit="contain"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                  bg="gray.50"
                />
                {image.short_description && (
                  <Text fontSize="sm" color={muted} mt={1}>
                    {image.short_description}
                  </Text>
                )}
              </Box>
            ))}
            <Button
              size="sm"
              colorScheme="red"
              variant="ghost"
              alignSelf="flex-start"
              onClick={() =>
                patch({
                  image_url: null,
                  imageDescription: "",
                  questionImages: [],
                })
              }
            >
              إزالة الصور
            </Button>
          </VStack>
        ) : draft.image_url ? (
          <VStack align="stretch" spacing={2}>
            <Image
              src={draft.image_url}
              alt={`صورة السؤال ${index + 1}`}
              maxH="160px"
              objectFit="contain"
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              bg="gray.50"
            />
            {draft.imageDescription && (
              <Text fontSize="sm" color={muted}>
                {draft.imageDescription}
              </Text>
            )}
            <Button
              size="sm"
              colorScheme="red"
              variant="ghost"
              alignSelf="flex-start"
              onClick={() => patch({ image_url: null, imageDescription: "" })}
            >
              إزالة
            </Button>
          </VStack>
        ) : (
          <Text fontSize="sm" color={muted}>
            لا توجد صورة مستخرجة لهذا السؤال
          </Text>
        )}
      </FormControl>

      {isChoice && (
        <Box>
          <Flex justify="space-between" align="center" mb={3} gap={2} flexWrap="wrap">
            <FormLabel mb={0} fontSize="sm" fontWeight="semibold">
              الاختيارات ({choices.length}) — اضغط على اختيار لتحديد الإجابة الصحيحة
            </FormLabel>
            <Button
              size="sm"
              leftIcon={<FaPlus />}
              colorScheme={accentScheme}
              variant="outline"
              borderRadius="lg"
              isDisabled={!canAddChoice}
              onClick={addChoice}
            >
              إضافة اختيار
            </Button>
          </Flex>

          <VStack align="stretch" spacing={2.5}>
            {choices.map((choice, cIdx) => {
              const letter = getChoiceLetter(cIdx, "latin");
              const isCorrect = draft.correctAnswerIndex === cIdx;
              return (
                <Box
                  key={`${draft.id}-opt-${cIdx}`}
                  borderWidth="2px"
                  borderColor={isCorrect ? correctBorder : borderColor}
                  bg={isCorrect ? correctBg : optionBg}
                  borderRadius="xl"
                  p={3}
                  transition="0.15s ease"
                  _hover={{ borderColor: isCorrect ? correctBorder : selectedBorder, bg: isCorrect ? correctBg : optionHoverBg }}
                >
                  <HStack align="start" spacing={3}>
                    <Box
                      as="button"
                      type="button"
                      onClick={() => selectCorrect(cIdx)}
                      w="36px"
                      h="36px"
                      borderRadius="full"
                      bg={isCorrect ? "green.500" : letterBg}
                      color="white"
                      fontWeight="bold"
                      fontSize="sm"
                      flexShrink={0}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      cursor="pointer"
                      title="تحديد كإجابة صحيحة"
                    >
                      {letter}
                    </Box>
                    <Box flex={1} minW={0}>
                      <Input
                        value={choice}
                        onChange={(e) => setChoiceAt(cIdx, e.target.value)}
                        dir="auto"
                        fontSize="md"
                        borderRadius="lg"
                        bg={inputBg}
                        placeholder={`الاختيار ${letter}`}
                      />
                      {choice?.trim() && (
                        <Box mt={2} dir="auto" fontSize="sm" color={textColor} lineHeight="1.7">
                          <FormattedQuestionText
                            value={choice}
                            fontSize="sm"
                            lineHeight="1.7"
                            color="inherit"
                          />
                        </Box>
                      )}
                    </Box>
                    <IconButton
                      aria-label="حذف الاختيار"
                      icon={<FaTrash />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      isDisabled={!canRemoveChoice}
                      onClick={() => removeChoice(cIdx)}
                    />
                  </HStack>
                </Box>
              );
            })}
          </VStack>

          <FormControl mt={4}>
            <FormLabel fontSize="sm" fontWeight="semibold">
              الإجابة الصحيحة
            </FormLabel>
            <Select
              placeholder="لم تُحدد بعد"
              value={
                Number.isInteger(draft.correctAnswerIndex)
                  ? String(draft.correctAnswerIndex)
                  : ""
              }
              onChange={(e) => {
                const nextIndex = e.target.value === "" ? null : Number(e.target.value);
                patch({
                  correctAnswerIndex: nextIndex,
                  answer: nextIndex == null ? "" : choices[nextIndex] || "",
                  answerInferred: false,
                });
              }}
              dir="rtl"
              borderRadius="xl"
            >
              {choices.map((c, cIdx) => (
                <option key={`${cIdx}-${c}`} value={cIdx} disabled={!String(c).trim()}>
                  {String(c).trim()
                    ? `${getChoiceLetter(cIdx, "latin")}: ${
                        c.length > 60 ? `${c.slice(0, 60)}…` : c
                      }`
                    : `اختيار ${getChoiceLetter(cIdx, "latin")}`}
                </option>
              ))}
            </Select>
            {Number.isInteger(draft.correctAnswerIndex) &&
              choices[draft.correctAnswerIndex]?.trim() && (
                <Box
                  mt={3}
                  p={3}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="green.200"
                  bg={correctBg}
                >
                  <Text fontSize="xs" color="green.700" mb={1} fontWeight="bold">
                    الإجابة المحددة: {getChoiceLetter(draft.correctAnswerIndex, "latin")}
                  </Text>
                  <Box dir="auto">
                    <FormattedQuestionText
                      value={choices[draft.correctAnswerIndex]}
                      fontSize="md"
                      lineHeight="1.75"
                      color={textColor}
                    />
                  </Box>
                </Box>
              )}
          </FormControl>
        </Box>
      )}
    </Box>
  );
}
