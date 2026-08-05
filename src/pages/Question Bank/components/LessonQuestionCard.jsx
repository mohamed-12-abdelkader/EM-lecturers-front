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
  VStack,
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

/** يستخرج رابط صورة السؤال من أشكال الـ API المختلفة */
export function resolveQuestionMediaUrl(question) {
  if (!question || typeof question !== "object") return "";
  const media = question.media;
  if (typeof media === "string" && media.trim()) return media.trim();
  if (Array.isArray(media)) {
    for (const item of media) {
      const url =
        item?.media_url || item?.url || item?.image_url || item?.path || "";
      if (url) return String(url).trim();
    }
  } else if (media && typeof media === "object") {
    const url =
      media.media_url || media.url || media.image_url || media.path || "";
    if (url) return String(url).trim();
  }
  const direct =
    question.media_url || question.image_url || question.image || "";
  return direct ? String(direct).trim() : "";
}

function getOptionText(opt) {
  if (!opt) return "";
  if (typeof opt === "string") return opt.trim();
  if (opt.option_type === "image" || opt.image_url) return "";
  return (opt.text_content || "").trim();
}

function isImageOption(opt) {
  if (!opt || typeof opt === "string") return false;
  return opt.option_type === "image" || Boolean(opt.image_url);
}

function getOptionContent(opt) {
  if (typeof opt === "string") return opt;
  if (isImageOption(opt)) return opt.image_url || "";
  return opt.text_content || opt.image_url || "";
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
      fontSize="10px"
      px={2}
      py={0.5}
      borderRadius="full"
      fontWeight="700"
      textTransform="none"
      letterSpacing="0.01em"
    >
      {label}
    </Badge>
  );
}

function ZoomableImage({ src, alt, onZoom, maxH = "none", maxW = "100%", compact = false }) {
  const border = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const bg = useColorModeValue("gray.50", "gray.900");

  if (!src) return null;

  return (
    <Box
      position="relative"
      borderRadius={compact ? "lg" : "xl"}
      borderWidth="1px"
      borderColor={border}
      bg={bg}
      overflow="hidden"
      cursor="pointer"
      maxW={maxW}
      w="full"
      mx="auto"
      onClick={(e) => {
        e.stopPropagation();
        onZoom?.(src);
      }}
      transition="border-color 0.15s ease"
      _hover={{
        borderColor: "blue.300",
        "& .zoom-hint": { opacity: 1 },
      }}
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
          <Flex minH={compact ? "56px" : "80px"} align="center" justify="center">
            <Spinner size="xs" color="blue.400" />
          </Flex>
        }
      />
      <Flex
        className="zoom-hint"
        position="absolute"
        top={1.5}
        left={1.5}
        align="center"
        gap={1}
        px={1.5}
        py={0.5}
        borderRadius="md"
        bg="blackAlpha.700"
        color="white"
        fontSize="9px"
        fontWeight="700"
        opacity={0.7}
        transition="opacity 0.15s"
      >
        <Icon as={FaExpand} boxSize={2} />
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
  const border = useColorModeValue("gray.200", "whiteAlpha.200");
  const idleBg = useColorModeValue("white", "gray.700");
  const hoverBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const correctBg = useColorModeValue("green.50", "green.900");
  const correctBorder = useColorModeValue("green.400", "green.400");
  const wrongBg = useColorModeValue("red.50", "red.900");
  const wrongBorder = useColorModeValue("red.300", "red.400");
  const letterBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const letterColor = useColorModeValue("blue.700", "blue.200");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const correctText = useColorModeValue("green.800", "green.100");

  let bg = idleBg;
  let borderColor = border;
  let borderW = "1px";
  let shadow = "none";

  if (isCorrect) {
    bg = correctBg;
    borderColor = correctBorder;
    borderW = "2px";
    shadow = "0 8px 20px -14px rgba(56, 161, 105, 0.7)";
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
        p={isImg ? 1.5 : 2}
        minH={isImg ? "auto" : "40px"}
        bg={bg}
        borderRadius="xl"
        borderWidth={borderW}
        borderColor={borderColor}
        boxShadow={shadow}
        cursor={canSelectCorrect || !isSelectionMode ? "pointer" : "default"}
        transition="all 0.15s ease"
        _hover={
          canSelectCorrect
            ? {
                bg: hoverBg,
                borderColor: "blue.300",
              }
            : undefined
        }
        onClick={onClick}
        h="full"
        position="relative"
      >
        <HStack spacing={1.5} align="start">
          <Flex
            w={6}
            h={6}
            flexShrink={0}
            borderRadius="full"
            bg={isCorrect ? "green.500" : isWrong ? "red.500" : letterBg}
            color={isCorrect || isWrong ? "white" : letterColor}
            align="center"
            justify="center"
            fontSize="xs"
            fontWeight="800"
          >
            {isCorrect && isUpdating ? <Spinner size="xs" color="white" /> : letter}
          </Flex>
          {!isImg && (
            <Box flex={1} minW={0} pt={0.5}>
              <FormattedQuestionText
                value={content}
                fontSize="xs"
                color={isCorrect ? correctText : textColor}
                lineHeight="1.6"
                fontWeight={isCorrect ? "700" : "500"}
                noOfLines={stacked ? undefined : 3}
              />
            </Box>
          )}
          {isCorrect && !isUpdating && (
            <Icon as={FaCheck} color="green.500" boxSize={3} flexShrink={0} mt={0.5} />
          )}
          {isWrong && (
            <Icon as={FaTimes} color="red.500" boxSize={3} flexShrink={0} mt={0.5} />
          )}
        </HStack>

        {isImg && (
          <ZoomableImage
            src={content}
            alt={`الخيار ${letter}`}
            onZoom={onZoomImage}
            maxH="88px"
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
  const cardBorder = useColorModeValue("blackAlpha.100", "whiteAlpha.150");
  const muted = useColorModeValue("gray.500", "gray.400");
  const textPrimary = useColorModeValue("gray.900", "white");
  const headerBg = useColorModeValue(
    "linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 55%, #FFFFFF 100%)",
    "linear-gradient(135deg, rgba(49,130,206,0.18) 0%, rgba(26,32,44,0.9) 60%)",
  );
  const optionsShellBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const accent = useColorModeValue("#3182CE", "#63B3ED");
  const hoverShadow = useColorModeValue(
    "0 18px 40px -24px rgba(26, 32, 44, 0.35)",
    "0 18px 40px -24px rgba(0, 0, 0, 0.75)",
  );

  const isUpdating = correctAnswerUpdatingId === question.id;
  const mediaUrl = resolveQuestionMediaUrl(question);
  const hasMedia = Boolean(mediaUrl);
  const mediaCaption =
    (question.media && typeof question.media === "object" && !Array.isArray(question.media)
      ? question.media.media_name
      : null) || "";
  const questionText = question.question_text || question.text;
  const hasText = Boolean(questionText?.trim());
  const stackOptions = shouldStackChoiceOptions(question.options);
  const isImageChoices =
    question.question_type === "image_choices" ||
    (question.options || []).some(isImageOption);

  const statusScheme =
    question.status === "approved" ? "green" : question.status === "rejected" ? "red" : "orange";
  const difficultyScheme =
    question.difficulty_level === "easy"
      ? "green"
      : question.difficulty_level === "hard"
        ? "red"
        : "blue";

  const handleCardClick = () => {
    if (isSelectionMode && onToggleSelect) onToggleSelect(question.id);
  };

  return (
    <Box
      position="relative"
      bg={cardBg}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={isSelected ? "orange.300" : cardBorder}
      boxShadow={
        isSelected
          ? "0 10px 24px -16px rgba(237, 137, 54, 0.5)"
          : "0 6px 18px -14px rgba(26, 32, 44, 0.28)"
      }
      overflow="hidden"
      transition="border-color 0.15s ease, box-shadow 0.15s ease"
      cursor={isSelectionMode ? "pointer" : "default"}
      onClick={handleCardClick}
      _hover={{
        borderColor: isSelected ? "orange.400" : "blue.200",
        boxShadow: hoverShadow,
      }}
    >
      <Box
        position="absolute"
        top={0}
        bottom={0}
        insetInlineStart={0}
        w="3px"
        bg={isSelected ? "orange.400" : accent}
      />

      <Flex
        align="center"
        justify="space-between"
        gap={2}
        ps={4}
        pe={2}
        py={2}
        bg={headerBg}
        borderBottomWidth="1px"
        borderColor={cardBorder}
      >
        <HStack spacing={2} minW={0} flex={1}>
          {isSelectionMode && (
            <Flex
              w={4}
              h={4}
              borderRadius="sm"
              borderWidth="2px"
              borderColor={isSelected ? "orange.400" : "gray.300"}
              bg={isSelected ? "orange.400" : "transparent"}
              align="center"
              justify="center"
              flexShrink={0}
            >
              {isSelected && <Icon as={FaCheck} color="white" boxSize={2} />}
            </Flex>
          )}

          <Flex
            w={7}
            h={7}
            borderRadius="lg"
            bg={accent}
            color="white"
            align="center"
            justify="center"
            fontSize="xs"
            fontWeight="900"
            flexShrink={0}
          >
            {index + 1}
          </Flex>

          <HStack spacing={1} flexWrap="wrap" minW={0}>
            {question.status ? (
              <MetaChip label={getStatusText(question.status)} colorScheme={statusScheme} />
            ) : null}
            <MetaChip
              label={getDifficultyText(question.difficulty_level)}
              colorScheme={difficultyScheme}
            />
            <MetaChip label={`${Number(question.points) || 1}ن`} colorScheme="yellow" />
            {question.question_type === "text_with_image" ? (
              <MetaChip label="صورة" colorScheme="cyan" />
            ) : null}
            {question.question_type === "image_choices" ? (
              <MetaChip label="اختيارات صور" colorScheme="cyan" />
            ) : null}
          </HStack>
        </HStack>

        {canManage && (
          <HStack spacing={0} flexShrink={0} onClick={(e) => e.stopPropagation()}>
            <IconButton
              aria-label="تعديل"
              icon={<FaEdit />}
              size="xs"
              variant="ghost"
              colorScheme="blue"
              onClick={onEdit}
            />
            <IconButton
              aria-label="صورة"
              icon={<FaImage />}
              size="xs"
              variant="ghost"
              colorScheme="cyan"
              onClick={onImage}
            />
            <IconButton
              aria-label="حذف"
              icon={<FaTrash />}
              size="xs"
              variant="ghost"
              colorScheme="red"
              onClick={onDelete}
            />
          </HStack>
        )}
      </Flex>

      <Box ps={4} pe={3} py={3} onClick={(e) => e.stopPropagation()}>
        {question.status === "rejected" && question.rejection_reason ? (
          <Alert status="error" borderRadius="lg" mb={2} py={1.5} fontSize="xs">
            <AlertIcon boxSize={3} />
            <Box>
              <AlertTitle fontSize="xs">مرفوض</AlertTitle>
              <Text fontSize="xs">{question.rejection_reason}</Text>
            </Box>
          </Alert>
        ) : null}

        <VStack align="stretch" spacing={2.5} mb={2.5}>
          {hasText ? (
            <Box minW={0}>
              <FormattedQuestionText
                value={questionText}
                fontSize="sm"
                fontWeight="600"
                color={textPrimary}
                lineHeight="1.65"
              />
            </Box>
          ) : null}

          {hasMedia ? (
            <Box>
              <ZoomableImage
                src={mediaUrl}
                alt={mediaCaption || "صورة السؤال"}
                onZoom={onZoomImage}
                maxH={{ base: "130px", md: "150px" }}
                maxW={{ base: "220px", md: "260px" }}
              />
            </Box>
          ) : null}
        </VStack>

        <Box
          bg={optionsShellBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={cardBorder}
          p={2}
        >
          {canManage ? (
            <Text fontSize="9px" color={muted} mb={1.5} fontWeight="600">
              اضغط على الخيار لتعيين الإجابة الصحيحة
            </Text>
          ) : null}

          <Grid
            templateColumns={
              stackOptions
                ? "1fr"
                : isImageChoices
                  ? { base: "1fr 1fr", md: "repeat(4, 1fr)" }
                  : { base: "1fr", sm: "1fr 1fr" }
            }
            gap={1.5}
          >
            {question.options?.map((opt, i) => {
              const isCorrect = question.correct_answer_index === i;
              const isImg = isImageOption(opt);
              const content = getOptionContent(opt);
              const canSelectCorrect = canManage && !isCorrect && !isUpdating;
              const isStudentSelected = selectedAnswerIndex === i;
              const letter = CHOICE_LETTERS[i] || String.fromCharCode(65 + i);

              return (
                <ChoiceOption
                  key={opt?.id ?? i}
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

          {isUpdating ? (
            <HStack mt={2} spacing={1.5} fontSize="10px" color={muted}>
              <Spinner size="xs" />
              <Text>جاري التحديث...</Text>
            </HStack>
          ) : null}
        </Box>

        {question.explanation ? (
          <Box mt={2.5}>
            <Flex
              as="button"
              type="button"
              w="full"
              align="center"
              justify="space-between"
              px={2.5}
              py={1.5}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={cardBorder}
              bg={useColorModeValue("blue.50", "whiteAlpha.50")}
              onClick={() => setExplanationOpen((v) => !v)}
              _hover={{ borderColor: "blue.300" }}
            >
              <HStack spacing={1.5}>
                <Icon as={FaLightbulb} color="blue.500" boxSize={3} />
                <Text fontSize="xs" fontWeight="700" color={textPrimary}>
                  الشرح
                </Text>
              </HStack>
              <Icon
                as={explanationOpen ? FaChevronUp : FaChevronDown}
                color={muted}
                boxSize={2.5}
              />
            </Flex>
            <Collapse in={explanationOpen} animateOpacity>
              <Box
                mt={1.5}
                px={2.5}
                py={2}
                borderRadius="lg"
                borderWidth="1px"
                borderColor={cardBorder}
                bg={useColorModeValue("white", "gray.700")}
              >
                <FormattedQuestionText
                  value={question.explanation}
                  fontSize="xs"
                  color={textPrimary}
                  lineHeight="1.65"
                />
              </Box>
            </Collapse>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
