import React from "react";
import {
  Badge,
  Box,
  Flex,
  HStack,
  Icon,
  Image,
  SimpleGrid,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { MdCheck, MdZoomIn } from "react-icons/md";
import { examQuestionTextSx } from "../../../components/question/FormattedQuestionText";
import { renderFormattedExamText } from "../../../utils/renderFormattedExamText";
import { isImageUrl } from "./PlatformExamQuestionCard";

const ARABIC_LETTERS = ["أ", "ب", "ج", "د"];
const LETTER_KEYS = ["A", "B", "C", "D"];

function QuestionMedia({ src, alt, onZoom, maxH = "280px" }) {
  const frameBg = useColorModeValue("gray.50", "gray.900");
  const frameBorder = useColorModeValue("gray.200", "gray.600");

  if (!src) return null;

  return (
    <Box
      position="relative"
      borderRadius="xl"
      borderWidth="1px"
      borderColor={frameBorder}
      bg={frameBg}
      overflow="hidden"
    >
      <Image
        src={src}
        alt={alt}
        w="100%"
        maxH={maxH}
        objectFit="contain"
        py={3}
        px={3}
        loading="lazy"
      />
      {onZoom && (
        <Flex
          as="button"
          type="button"
          position="absolute"
          bottom={3}
          left={3}
          align="center"
          gap={1}
          px={2.5}
          py={1.5}
          borderRadius="lg"
          bg="blackAlpha.700"
          color="white"
          fontSize="xs"
          fontWeight="semibold"
          onClick={(e) => {
            e.stopPropagation();
            onZoom(src);
          }}
        >
          <Icon as={MdZoomIn} boxSize={4} />
          تكبير
        </Flex>
      )}
    </Box>
  );
}

function ChoiceRadioIndicator({ isSelected }) {
  const idleBorder = useColorModeValue("gray.300", "gray.500");
  const idleBg = useColorModeValue("white", "gray.800");

  return (
    <Flex
      w={6}
      h={6}
      borderRadius="full"
      borderWidth="2px"
      borderColor={isSelected ? "blue.500" : idleBorder}
      bg={isSelected ? "blue.500" : idleBg}
      align="center"
      justify="center"
      flexShrink={0}
      transition="all 0.18s ease"
    >
      {isSelected && <Icon as={MdCheck} color="white" boxSize={3.5} />}
    </Flex>
  );
}

function TextChoiceCard({ label, text, isSelected, onSelect }) {
  const border = useColorModeValue("gray.200", "gray.600");
  const idleBg = useColorModeValue("white", "gray.800");
  const hoverBg = useColorModeValue("blue.50", "whiteAlpha.50");
  const selectedBg = useColorModeValue("blue.50", "rgba(49,130,206,0.18)");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const muted = useColorModeValue("gray.500", "gray.400");
  const letterBg = useColorModeValue("gray.100", "gray.700");
  const letterColor = useColorModeValue("gray.700", "gray.100");

  return (
    <Box
      as="button"
      type="button"
      w="full"
      textAlign="right"
      dir="rtl"
      minH={{ base: "56px", md: "auto" }}
      p={{ base: 4, md: 4 }}
      borderRadius="2xl"
      borderWidth={isSelected ? "2px" : "1px"}
      borderColor={isSelected ? "blue.400" : border}
      bg={isSelected ? selectedBg : idleBg}
      boxShadow={isSelected ? "0 10px 28px rgba(49,130,206,0.14)" : "sm"}
      transition="all 0.18s ease"
      onClick={onSelect}
      sx={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
      _hover={{
        bg: isSelected ? selectedBg : hoverBg,
        borderColor: isSelected ? "blue.400" : "blue.300",
        transform: "translateY(-1px)",
      }}
      _active={{ transform: "translateY(0)" }}
      position="relative"
      overflow="hidden"
    >
      {isSelected && (
        <Box
          position="absolute"
          top={0}
          right={0}
          bottom={0}
          w="4px"
          bg="blue.500"
          borderTopRightRadius="2xl"
          borderBottomRightRadius="2xl"
        />
      )}

      <Flex align="flex-start" gap={3}>
        <Flex
          w={{ base: 12, md: 10 }}
          h={{ base: 12, md: 10 }}
          borderRadius="xl"
          bg={isSelected ? "blue.500" : letterBg}
          color={isSelected ? "white" : letterColor}
          align="center"
          justify="center"
          fontWeight="bold"
          fontSize={{ base: "lg", md: "md" }}
          flexShrink={0}
          boxShadow={isSelected ? "0 4px 12px rgba(49,130,206,0.35)" : "none"}
        >
          {label}
        </Flex>

        <Box flex={1} minW={0} pt={0.5}>
          <Text
            fontSize={{ base: "md", md: "md" }}
            fontWeight={isSelected ? "700" : "500"}
            color={textColor}
            lineHeight="1.9"
            whiteSpace="pre-wrap"
            wordBreak="break-word"
            sx={examQuestionTextSx}
          >
            {renderFormattedExamText(text)}
          </Text>
          <Text mt={2} fontSize="xs" color={muted} display={{ base: "none", md: "block" }}>
            {isSelected ? "إجابتك المختارة" : "اضغط للاختيار"}
          </Text>
        </Box>

        <ChoiceRadioIndicator isSelected={isSelected} />
      </Flex>
    </Box>
  );
}

function ImageChoiceCard({
  label,
  text,
  image,
  isImageOnly,
  isSelected,
  onSelect,
  onZoomImage,
}) {
  const border = useColorModeValue("gray.200", "gray.600");
  const idleBg = useColorModeValue("white", "gray.800");
  const hoverBg = useColorModeValue("blue.50", "whiteAlpha.50");
  const selectedBg = useColorModeValue("blue.50", "rgba(49,130,206,0.18)");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const letterBg = useColorModeValue("gray.100", "gray.700");

  return (
    <Box
      as="button"
      type="button"
      w="full"
      textAlign="right"
      dir="rtl"
      p={{ base: 4, md: 4 }}
      minH={{ base: "56px", md: "auto" }}
      borderRadius="2xl"
      borderWidth={isSelected ? "2px" : "1px"}
      borderColor={isSelected ? "blue.400" : border}
      bg={isSelected ? selectedBg : idleBg}
      boxShadow={isSelected ? "0 10px 28px rgba(49,130,206,0.14)" : "sm"}
      transition="all 0.18s ease"
      onClick={onSelect}
      sx={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
      _hover={{ bg: isSelected ? selectedBg : hoverBg, borderColor: "blue.300" }}
      position="relative"
      overflow="hidden"
    >
      {isSelected && (
        <Box
          position="absolute"
          top={0}
          right={0}
          bottom={0}
          w="4px"
          bg="blue.500"
        />
      )}

      <Flex align="center" justify="space-between" mb={3} gap={3}>
        <HStack spacing={2}>
          <Flex
          w={{ base: 11, md: 9 }}
          h={{ base: 11, md: 9 }}
            borderRadius="lg"
            bg={isSelected ? "blue.500" : letterBg}
            color={isSelected ? "white" : "gray.700"}
            align="center"
            justify="center"
            fontWeight="bold"
          >
            {label}
          </Flex>
          {!isImageOnly && text && (
            <Text fontSize="sm" fontWeight="semibold" color={textColor} noOfLines={2} sx={examQuestionTextSx}>
              {renderFormattedExamText(text)}
            </Text>
          )}
        </HStack>
        <ChoiceRadioIndicator isSelected={isSelected} />
      </Flex>

      {image && (
        <Box
          borderRadius="xl"
          overflow="hidden"
          borderWidth="1px"
          borderColor={isSelected ? "blue.200" : border}
          bg="white"
          p={2}
        >
          <Image
            src={image}
            alt={`الخيار ${label}`}
            w="100%"
            maxH={isImageOnly ? "180px" : "120px"}
            objectFit="contain"
            cursor={onZoomImage ? "zoom-in" : "default"}
            onClick={(e) => {
              if (onZoomImage) {
                e.stopPropagation();
                onZoomImage(image);
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
}

export default function LectureExamStudentQuestionCard({
  question,
  questionIndex,
  totalQuestions,
  selectedLetter,
  onSelectLetter,
  onZoomImage,
  compactHeader = false,
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const headerBg = useColorModeValue("gray.50", "gray.700");
  const questionBg = useColorModeValue("blue.50", "whiteAlpha.50");
  const choicesPanelBg = useColorModeValue("gray.50", "gray.900");
  const choicesPanelBorder = useColorModeValue("gray.200", "gray.700");

  const hasText = Boolean(question.text?.trim());
  const hasImage = Boolean(question.image);
  const isImageQuestion = question.type === "IMAGE" || (!hasText && hasImage);

  const normalizedChoices = (question.choices || [])
    .map((choice, index) => {
      const letter = choice.letter || LETTER_KEYS[index] || String.fromCharCode(65 + index);
      const rawText = choice.text != null ? String(choice.text).trim() : "";
      const image = choice.image || (isImageUrl(rawText) ? rawText : null);
      return {
        ...choice,
        letter,
        label: ARABIC_LETTERS[index] || letter,
        text: image && isImageUrl(rawText) ? "" : rawText,
        image,
        isImageOnly: Boolean(choice.isImageOnly || (image && !rawText)),
      };
    })
    .filter((choice) => choice.text || choice.image);

  const textChoices = normalizedChoices.filter((choice) => !choice.isImageOnly && !choice.image);
  const imageChoices = normalizedChoices.filter((choice) => choice.isImageOnly || choice.image);
  const hasLongChoices = textChoices.some((choice) => (choice.text || "").length > 70);
  const textChoiceColumns = hasLongChoices ? 1 : { base: 1, md: 2 };

  return (
    <Box
      bg={cardBg}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={border}
      overflow="hidden"
      boxShadow="lg"
    >
      <Box h="3px" bgGradient="linear(to-r, blue.500, orange.500)" />

      <Flex
        align="center"
        justify="space-between"
        px={{ base: 4, md: 5 }}
        py={compactHeader ? 2.5 : 3}
        bg={headerBg}
        borderBottomWidth="1px"
        borderColor={border}
        display={compactHeader ? { base: "none", md: "flex" } : "flex"}
      >
        <HStack spacing={3}>
          <Flex
            w={10}
            h={10}
            borderRadius="xl"
            bgGradient="linear(135deg, blue.500, blue.600)"
            color="white"
            align="center"
            justify="center"
            fontWeight="bold"
            fontSize="md"
            boxShadow="0 4px 14px rgba(49,130,206,0.35)"
          >
            {questionIndex + 1}
          </Flex>
          <VStack align="start" spacing={0}>
            <Text fontSize="xs" color={muted}>
              سؤال {questionIndex + 1} من {totalQuestions}
            </Text>
            <Text fontSize="xs" color="blue.500" fontWeight="semibold">
              اختر إجابة واحدة فقط
            </Text>
          </VStack>
        </HStack>
        <Badge
          px={3}
          py={1}
          borderRadius="full"
          colorScheme={selectedLetter ? "green" : "gray"}
          variant={selectedLetter ? "solid" : "subtle"}
          fontSize="xs"
        >
          {selectedLetter ? "تمت الإجابة" : "بانتظار الإجابة"}
        </Badge>
      </Flex>

      <Box px={{ base: 4, md: 5 }} py={{ base: 4, md: 5 }}>
        {isImageQuestion && hasImage && (
          <Box mb={hasText ? 4 : 0}>
            <QuestionMedia
              src={question.image}
              alt="صورة السؤال"
              onZoom={onZoomImage}
              maxH={{ base: "240px", md: "320px" }}
            />
          </Box>
        )}

        {hasText && (
          <Box
            mb={hasImage && !isImageQuestion ? 4 : 0}
            p={4}
            borderRadius="xl"
            bg={questionBg}
            borderRightWidth="4px"
            borderColor="blue.400"
          >
            <Text
            fontSize={{ base: "lg", md: "lg" }}
              fontWeight="semibold"
              color={textColor}
              lineHeight="2"
              whiteSpace="pre-wrap"
              wordBreak="break-word"
              sx={examQuestionTextSx}
            >
              {renderFormattedExamText(question.text)}
            </Text>
          </Box>
        )}

        {hasImage && hasText && (
          <Box mb={4}>
            <QuestionMedia src={question.image} alt="شكل السؤال" onZoom={onZoomImage} maxH="220px" />
          </Box>
        )}

        <Box
          mt={5}
          p={{ base: 3, md: 4 }}
          borderRadius="2xl"
          bg={choicesPanelBg}
          borderWidth="1px"
          borderColor={choicesPanelBorder}
        >
          <Flex justify="space-between" align="center" mb={4} gap={3} flexWrap="wrap">
            <Text fontSize="sm" fontWeight="bold" color={textColor}>
              الاختيارات
            </Text>
            <Text fontSize="xs" color={muted}>
              {normalizedChoices.length} خيارات متاحة
            </Text>
          </Flex>

          {textChoices.length > 0 && (
            <SimpleGrid
              columns={textChoiceColumns}
              spacing={3}
              mb={imageChoices.length ? 4 : 0}
            >
              {textChoices.map((choice) => (
                <TextChoiceCard
                  key={choice.id ?? choice.letter}
                  label={choice.label}
                  text={choice.text}
                  isSelected={selectedLetter === choice.letter}
                  onSelect={() => onSelectLetter(question.id, choice.letter)}
                />
              ))}
            </SimpleGrid>
          )}

          {imageChoices.length > 0 && (
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
              {imageChoices.map((choice) => (
                <ImageChoiceCard
                  key={choice.id ?? choice.letter}
                  label={choice.label}
                  text={choice.text}
                  image={choice.image}
                  isImageOnly={choice.isImageOnly}
                  isSelected={selectedLetter === choice.letter}
                  onSelect={() => onSelectLetter(question.id, choice.letter)}
                  onZoomImage={onZoomImage}
                />
              ))}
            </SimpleGrid>
          )}
        </Box>
      </Box>
    </Box>
  );
}
