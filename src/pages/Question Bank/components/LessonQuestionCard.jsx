import { useState } from "react";
import {
  Alert,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Collapse,
  Flex,
  Grid,
  HStack,
  Icon,
  IconButton,
  Image,
  Spinner,
  Text,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaEdit,
  FaExpand,
  FaImage,
  FaLightbulb,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import FormattedQuestionText from "../../../components/question/FormattedQuestionText";

const CHOICE_LETTERS = ["أ", "ب", "ج", "د"];
const LONG_OPTION_CHAR_THRESHOLD = 30;

function getOptionText(opt) {
  if (!opt) return "";
  if (typeof opt === "string") return opt.trim();
  if (opt.option_type === "image") return "";
  return (opt.text_content || "").trim();
}

/** اختيارات نصها طويل → عمود واحد لعرض النص كاملاً */
export function shouldStackChoiceOptions(options) {
  const texts = (options || []).map(getOptionText).filter(Boolean);
  if (texts.length === 0) return false;
  if (texts.some((t) => t.length > LONG_OPTION_CHAR_THRESHOLD || t.includes("\n"))) {
    return true;
  }
  const avgLen = texts.reduce((sum, t) => sum + t.length, 0) / texts.length;
  return avgLen > 22;
}

function MetaChip({ label, colorScheme = "gray" }) {
  return (
    <Badge
      variant="subtle"
      colorScheme={colorScheme}
      fontSize="9px"
      px={1.5}
      py={0.5}
      borderRadius="md"
      fontWeight="600"
      textTransform="none"
    >
      {label}
    </Badge>
  );
}

function ZoomableImage({ src, alt, onZoom, maxH = "none", compact = false }) {
  const border = useColorModeValue("gray.200", "gray.600");
  const bg = useColorModeValue("gray.50", "gray.900");

  if (!src) return null;

  return (
    <Box
      position="relative"
      borderRadius="lg"
      borderWidth="1px"
      borderColor={border}
      bg={bg}
      overflow="hidden"
      cursor="pointer"
      onClick={(e) => {
        e.stopPropagation();
        onZoom?.(src);
      }}
      _hover={{ borderColor: "blue.300", "& .zoom-hint": { opacity: 1 } }}
      transition="border-color 0.15s"
    >
      <Image
        src={src}
        alt={alt}
        w="100%"
        maxW="100%"
        maxH={maxH}
        h="auto"
        objectFit="contain"
        display="block"
        mx="auto"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          if (!e.target.dataset.retried) {
            e.target.dataset.retried = "1";
            e.target.src = `${src}${src.includes("?") ? "&" : "?"}t=${Date.now()}`;
          }
        }}
        fallback={
          <Flex minH={compact ? "80px" : "120px"} align="center" justify="center">
            <Spinner size="sm" color="blue.400" />
          </Flex>
        }
      />
      <Flex
        className="zoom-hint"
        position="absolute"
        top={2}
        left={2}
        align="center"
        gap={1}
        px={2}
        py={1}
        borderRadius="md"
        bg="blackAlpha.700"
        color="white"
        fontSize="10px"
        opacity={0.85}
        transition="opacity 0.15s"
      >
        <Icon as={FaExpand} boxSize={2.5} />
        <Text>تكبير</Text>
      </Flex>
    </Box>
  );
}

function ChoiceOption({
  letter,
  content,
  isImg,
  isCorrect,
  isWrong,
  isUpdating,
  canSelectCorrect,
  isSelectionMode,
  onClick,
  onZoomImage,
  stacked = false,
}) {
  const border = useColorModeValue("gray.200", "gray.600");
  const idleBg = useColorModeValue("white", "gray.700");
  const hoverBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const correctBg = useColorModeValue("green.50", "green.900");
  const correctBorder = useColorModeValue("green.400", "green.500");
  const wrongBg = useColorModeValue("red.50", "red.900");
  const wrongBorder = useColorModeValue("red.300", "red.500");
  const letterBg = useColorModeValue("gray.100", "gray.600");
  const letterColor = useColorModeValue("gray.700", "white");
  const textColor = useColorModeValue("gray.800", "gray.100");

  let bg = idleBg;
  let borderColor = border;
  let borderW = "1px";

  if (isCorrect) {
    bg = correctBg;
    borderColor = correctBorder;
    borderW = "2px";
  } else if (isWrong) {
    bg = wrongBg;
    borderColor = wrongBorder;
    borderW = "2px";
  }

  return (
    <Tooltip
      label={canSelectCorrect ? "تعيين كإجابة صحيحة" : isCorrect ? "الإجابة الصحيحة" : ""}
      hasArrow
      openDelay={400}
    >
      <Flex
        direction="column"
        gap={1.5}
        p={2}
        minH={isImg ? "auto" : "44px"}
        bg={bg}
        borderRadius="lg"
        borderWidth={borderW}
        borderColor={borderColor}
        cursor={canSelectCorrect || !isSelectionMode ? "pointer" : "default"}
        transition="all 0.12s"
        _hover={canSelectCorrect ? { bg: hoverBg, borderColor: "blue.300" } : undefined}
        onClick={onClick}
        h="full"
      >
        <HStack spacing={1.5} align="start">
          <Flex
            w={6}
            h={6}
            flexShrink={0}
            borderRadius="md"
            bg={isCorrect ? "green.500" : isWrong ? "red.500" : letterBg}
            color={isCorrect || isWrong ? "white" : letterColor}
            align="center"
            justify="center"
            fontSize="xs"
            fontWeight="bold"
          >
            {isCorrect && isUpdating ? <Spinner size="xs" color="white" /> : letter}
          </Flex>
          {!isImg && (
            <Box flex={1} minW={0}>
              <FormattedQuestionText
                value={content}
                fontSize={stacked ? "sm" : "xs"}
                color={isCorrect ? "green.800" : textColor}
                lineHeight="1.65"
                noOfLines={stacked ? undefined : 3}
              />
            </Box>
          )}
          {isCorrect && !isUpdating && (
            <Icon as={FaCheck} color="green.500" boxSize={3} flexShrink={0} mt={0.5} />
          )}
          {isWrong && <Icon as={FaTimes} color="red.500" boxSize={3} flexShrink={0} mt={0.5} />}
        </HStack>

        {isImg && (
          <ZoomableImage
            src={content}
            alt={`الخيار ${letter}`}
            onZoom={onZoomImage}
            maxH="140px"
            compact
          />
        )}
      </Flex>
    </Tooltip>
  );
}

export default function LessonQuestionCard({
  question,
  index,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
  canManage = false,
  selectedAnswerIndex,
  correctAnswerUpdatingId,
  onSelectAnswer,
  onUpdateCorrectAnswer,
  onEdit,
  onImage,
  onDelete,
  onZoomImage,
  getStatusText,
  getDifficultyText,
}) {
  const [explanationOpen, setExplanationOpen] = useState(false);

  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const textPrimary = useColorModeValue("gray.800", "white");
  const divider = useColorModeValue("gray.100", "gray.700");

  const isUpdating = correctAnswerUpdatingId === question.id;
  const hasMedia = Boolean(question.media?.media_url);
  const questionText = question.question_text || question.text;
  const hasText = Boolean(questionText?.trim());
  const stackOptions = shouldStackChoiceOptions(question.options);

  const statusScheme =
    question.status === "approved" ? "green" : question.status === "rejected" ? "red" : "orange";
  const difficultyScheme =
    question.difficulty_level === "easy" ? "green" : question.difficulty_level === "hard" ? "red" : "blue";

  const handleCardClick = () => {
    if (isSelectionMode && onToggleSelect) onToggleSelect(question.id);
  };

  return (
    <Box
      bg={cardBg}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={isSelected ? "orange.300" : cardBorder}
      boxShadow={isSelected ? "md" : "xs"}
      overflow="hidden"
      transition="border-color 0.15s, box-shadow 0.15s"
      cursor={isSelectionMode ? "pointer" : "default"}
      onClick={handleCardClick}
      _hover={isSelectionMode ? { borderColor: "orange.400" } : undefined}
    >
      {/* Header — سطر واحد مضغوط */}
      <Flex
        align="center"
        justify="space-between"
        gap={2}
        px={3}
        py={2}
        borderBottomWidth="1px"
        borderColor={divider}
        bg={useColorModeValue("gray.50", "gray.700")}
      >
        <HStack spacing={2} minW={0} flex={1}>
          {isSelectionMode && (
            <Flex
              w={5}
              h={5}
              borderRadius="sm"
              borderWidth="2px"
              borderColor={isSelected ? "orange.400" : "gray.300"}
              bg={isSelected ? "orange.400" : "transparent"}
              align="center"
              justify="center"
              flexShrink={0}
            >
              {isSelected && <Icon as={FaCheck} color="white" boxSize={2.5} />}
            </Flex>
          )}
          <Text
            fontSize="xs"
            fontWeight="black"
            color="blue.500"
            flexShrink={0}
            minW="20px"
          >
            {index + 1}
          </Text>
          <HStack spacing={1} flexWrap="wrap" minW={0}>
            {question.status && (
              <MetaChip label={getStatusText(question.status)} colorScheme={statusScheme} />
            )}
            <MetaChip label={getDifficultyText(question.difficulty_level)} colorScheme={difficultyScheme} />
            <MetaChip label={`${Number(question.points) || 1}ن`} colorScheme="yellow" />
          </HStack>
        </HStack>

        {canManage && (
          <HStack spacing={0} flexShrink={0} onClick={(e) => e.stopPropagation()}>
            <IconButton aria-label="تعديل" icon={<FaEdit />} size="xs" variant="ghost" colorScheme="blue" onClick={onEdit} />
            <IconButton aria-label="صورة" icon={<FaImage />} size="xs" variant="ghost" colorScheme="purple" onClick={onImage} />
            <IconButton aria-label="حذف" icon={<FaTrash />} size="xs" variant="ghost" colorScheme="red" onClick={onDelete} />
          </HStack>
        )}
      </Flex>

      <Box px={3} py={3} onClick={(e) => e.stopPropagation()}>
        {question.status === "rejected" && question.rejection_reason && (
          <Alert status="error" borderRadius="md" mb={2} py={2} fontSize="xs">
            <AlertIcon boxSize={3} />
            <Box>
              <AlertTitle fontSize="xs">مرفوض</AlertTitle>
              <Text fontSize="xs">{question.rejection_reason}</Text>
            </Box>
          </Alert>
        )}

        {/* نص السؤال + الصورة جنب بعض على الشاشات الكبيرة */}
        <Grid
          templateColumns={hasMedia && hasText ? { base: "1fr", md: "1fr 1fr" } : "1fr"}
          gap={3}
          mb={3}
          alignItems="start"
        >
          {hasText && (
            <Box minW={0}>
              <FormattedQuestionText
                value={questionText}
                fontSize="sm"
                fontWeight="semibold"
                color={textPrimary}
                lineHeight="1.65"
              />
            </Box>
          )}

          {hasMedia && (
            <ZoomableImage
              src={question.media.media_url}
              alt="صورة السؤال"
              onZoom={onZoomImage}
              maxH={{ base: "280px", md: hasText ? "220px" : "400px" }}
            />
          )}
        </Grid>

        {/* الاختيارات — 4 أعمدة على الشاشات الواسعة */}
        <Box>
          {canManage && (
            <Text fontSize="10px" color={muted} mb={1.5}>
              اضغط على الخيار لتعيين الإجابة الصحيحة
            </Text>
          )}

          <Grid
            templateColumns={
              stackOptions ? "1fr" : { base: "1fr 1fr", lg: "repeat(4, 1fr)" }
            }
            gap={stackOptions ? 2.5 : 2}
          >
            {question.options?.map((opt, i) => {
              const isCorrect = question.correct_answer_index === i;
              const content = typeof opt === "string" ? opt : opt.text_content || opt.image_url;
              const isImg = typeof opt !== "string" && opt.option_type === "image";
              const canSelectCorrect = canManage && !isCorrect && !isUpdating;
              const isStudentSelected = selectedAnswerIndex === i;
              const letter = CHOICE_LETTERS[i] || String.fromCharCode(65 + i);

              return (
                <ChoiceOption
                  key={i}
                  letter={letter}
                  content={content}
                  isImg={isImg}
                  isCorrect={isCorrect}
                  isWrong={isStudentSelected && !isCorrect}
                  isUpdating={isCorrect && isUpdating}
                  canSelectCorrect={canSelectCorrect}
                  isSelectionMode={isSelectionMode}
                  stacked={stackOptions}
                  onZoomImage={onZoomImage}
                  onClick={() => {
                    if (isSelectionMode) return;
                    if (canSelectCorrect) onUpdateCorrectAnswer?.(question.id, i);
                    else onSelectAnswer?.(question.id, i);
                  }}
                />
              );
            })}
          </Grid>

          {isUpdating && (
            <HStack mt={2} spacing={1.5} fontSize="10px" color={muted}>
              <Spinner size="xs" />
              <Text>جاري التحديث...</Text>
            </HStack>
          )}
        </Box>

        {question.explanation && (
          <Box mt={3}>
            <Flex
              as="button"
              type="button"
              w="full"
              align="center"
              justify="space-between"
              px={2.5}
              py={2}
              borderRadius="md"
              borderWidth="1px"
              borderColor={cardBorder}
              bg={useColorModeValue("gray.50", "gray.700")}
              onClick={() => setExplanationOpen((v) => !v)}
              _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
            >
              <HStack spacing={1.5}>
                <Icon as={FaLightbulb} color="blue.500" boxSize={3} />
                <Text fontSize="xs" fontWeight="semibold" color={textPrimary}>
                  الشرح
                </Text>
              </HStack>
              <Icon as={explanationOpen ? FaChevronUp : FaChevronDown} color={muted} boxSize={2.5} />
            </Flex>
            <Collapse in={explanationOpen} animateOpacity>
              <Box mt={1.5} px={2.5} py={2} borderRadius="md" borderWidth="1px" borderColor={cardBorder} bg={useColorModeValue("blue.50", "whiteAlpha.50")}>
                <FormattedQuestionText value={question.explanation} fontSize="xs" color={textPrimary} lineHeight="1.7" />
              </Box>
            </Collapse>
          </Box>
        )}
      </Box>
    </Box>
  );
}
