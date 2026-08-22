import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Badge,
  Flex,
  Radio,
  RadioGroup,
  IconButton,
  Spinner,
  Alert,
  AlertIcon,
  SimpleGrid,
  Grid,
  Button,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  AiFillCheckCircle,
  AiFillEdit,
  AiFillDelete,
  AiFillPicture,
} from "react-icons/ai";
import { FaSearchPlus } from "react-icons/fa";
import { renderFormattedExamText } from "../../../utils/renderFormattedExamText";

const CHOICE_LETTERS = ["أ", "ب", "ج", "د", "هـ", "و"];

export function ExamQuestionImage({
  src,
  onZoom,
  maxH = { base: "320px", sm: "420px", md: "500px" },
  compact = false,
}) {
  const frameBg = useColorModeValue("white", "gray.800");
  const frameBorder = useColorModeValue("gray.200", "gray.600");

  if (!src) return null;

  if (compact) {
    return (
      <Box w="full" py={2}>
        <Box
          borderRadius="lg"
          overflow="hidden"
          borderWidth="1px"
          borderColor={frameBorder}
          bg={frameBg}
          cursor="pointer"
          onClick={() => onZoom?.(src)}
        >
          <Image
            src={src}
            alt="صورة السؤال"
            maxW="100%"
            maxH={{ base: "240px", md: "320px" }}
            objectFit="contain"
            mx="auto"
            display="block"
            onError={(e) => {
              setTimeout(() => {
                e.target.src = `${src}?t=${Date.now()}`;
              }, 1000);
            }}
            fallback={
              <Flex w="full" h="120px" align="center" justify="center">
                <Spinner size="sm" color="blue.400" />
              </Flex>
            }
          />
        </Box>
      </Box>
    );
  }

  const accentBorder = useColorModeValue("blue.100", "blue.800");

  return (
    <Box w="full" display="flex" justifyContent="center" py={2}>
      <Box
        position="relative"
        maxW="100%"
        borderRadius="2xl"
        overflow="hidden"
        bg={frameBg}
        borderWidth="1px"
        borderColor={accentBorder}
        boxShadow="lg"
        p={{ base: 2, md: 3 }}
        cursor="pointer"
        transition="all 0.25s ease"
        _hover={{ transform: "translateY(-2px)", boxShadow: "xl", borderColor: "blue.300" }}
        onClick={() => onZoom?.(src)}
      >
        <Box
          position="absolute"
          inset={0}
          bgGradient="linear(135deg, blue.50 0%, transparent 45%, orange.50 100%)"
          opacity={0.35}
          pointerEvents="none"
        />
        <Image
          src={src}
          alt="صورة السؤال"
          borderRadius="xl"
          maxW="100%"
          maxH={maxH}
          objectFit="contain"
          position="relative"
          zIndex={1}
          onError={(e) => {
            setTimeout(() => {
              e.target.src = `${src}?t=${Date.now()}`;
            }, 1000);
          }}
          fallback={
            <Flex w="full" h="200px" align="center" justify="center">
              <VStack spacing={2}>
                <Spinner color="blue.500" />
                <Text fontSize="sm" color="gray.500">
                  جاري تحميل الصورة...
                </Text>
              </VStack>
            </Flex>
          }
        />
        <HStack
          position="absolute"
          bottom={3}
          left={3}
          zIndex={2}
          bg="blackAlpha.700"
          color="white"
          px={3}
          py={1.5}
          borderRadius="full"
          fontSize="xs"
          spacing={2}
        >
          <FaSearchPlus />
          <Text>تكبير</Text>
        </HStack>
      </Box>
    </Box>
  );
}

export function ExamPassageBlock({ content, variant = "student" }) {
  const passageBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const passageBorder = useColorModeValue("gray.200", "gray.600");
  const passageTextColor = useColorModeValue("gray.700", "gray.200");

  if (!content) return null;

  if (variant === "student") {
    return (
      <Box
        w="full"
        p={4}
        borderRadius="lg"
        bg={passageBg}
        borderWidth="1px"
        borderColor={passageBorder}
        mb={4}
      >
        <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={2}>
          قطعة القراءة
        </Text>
        <Text fontSize="sm" lineHeight="1.9" color={passageTextColor} whiteSpace="pre-wrap">
          {renderFormattedExamText(content)}
        </Text>
      </Box>
    );
  }

  const passageBgTeacher = useColorModeValue("gray.50", "whiteAlpha.50");
  const passageBorderTeacher = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      w="full"
      p={{ base: 4, md: 5 }}
      borderRadius="xl"
      bg={passageBgTeacher}
      borderWidth="1px"
      borderColor={passageBorderTeacher}
    >
      <Text fontSize="xs" fontWeight="700" color="gray.500" mb={2}>
        قطعة القراءة
      </Text>
      <Text
        fontSize={{ base: "sm", md: "md" }}
        lineHeight="2"
        color={passageTextColor}
        whiteSpace="pre-wrap"
      >
        {renderFormattedExamText(content)}
      </Text>
    </Box>
  );
}

const mapChoice = (choice) => {
  const image = choice?.image || choice?.image_url || null;
  const text = (choice?.text || "").trim();
  return {
    id: choice.id,
    text,
    image,
    is_correct: Boolean(choice.is_correct),
    isImageOnly: Boolean(image && !text),
    hasImage: Boolean(image),
  };
};

function ChoiceImageFrame({ src, alt, onZoom, maxH = "160px" }) {
  const border = useColorModeValue("gray.200", "gray.600");
  const bg = useColorModeValue("gray.50", "gray.900");

  if (!src) return null;

  return (
    <Box
      borderRadius="lg"
      borderWidth="1px"
      borderColor={border}
      bg={bg}
      overflow="hidden"
      cursor={onZoom ? "pointer" : "default"}
      onClick={(e) => {
        if (onZoom) {
          e.stopPropagation();
          onZoom(src);
        }
      }}
      _hover={onZoom ? { borderColor: "blue.300" } : undefined}
    >
      <Image
        src={src}
        alt={alt}
        w="100%"
        h="auto"
        maxH={maxH}
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
          <Flex minH="80px" align="center" justify="center">
            <Spinner size="sm" color="blue.400" />
          </Flex>
        }
      />
    </Box>
  );
}

function ExamChoicesSection({
  choices,
  mode = "student",
  questionId,
  studentAnswers,
  submitResult,
  onChoice,
  pendingCorrect,
  displayId,
  onSetCorrect,
  onZoomImage,
  headingColor,
  tourTargetId,
}) {
  const border = useColorModeValue("gray.200", "gray.600");
  const cardBg = useColorModeValue("white", "gray.800");
  const selectedBorder = useColorModeValue("blue.500", "blue.300");
  const selectedBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const letterBg = useColorModeValue("gray.100", "gray.700");
  const letterColor = useColorModeValue("gray.700", "gray.200");
  const correctBg = useColorModeValue("green.50", "green.900");
  const correctBorder = useColorModeValue("green.400", "green.500");
  const muted = useColorModeValue("gray.500", "gray.400");
  const teacherChoicesBg = useColorModeValue("gray.50", "whiteAlpha.50");

  const normalized = (choices || []).map(mapChoice);
  const imageGrid = normalized.some((c) => c.isImageOnly || c.hasImage);

  const renderTeacherChoice = (choice, cidx) => {
    const letter = CHOICE_LETTERS[cidx] ?? String.fromCharCode(65 + cidx);
    const isCorrect = choice.is_correct;
    const isPending = pendingCorrect?.[displayId] === choice.id;

    return (
      <Flex
        key={choice.id}
        as="button"
        type="button"
        w="full"
        align="flex-start"
        gap={3}
        px={3.5}
        py={3}
        borderRadius="lg"
        borderWidth="1px"
        borderColor={isCorrect ? correctBorder : border}
        bg={isCorrect ? correctBg : cardBg}
        textAlign="right"
        transition="0.12s ease"
        _hover={{
          borderColor: isCorrect ? correctBorder : "blue.300",
          bg: isCorrect ? correctBg : hoverBg,
        }}
        cursor={isCorrect || isPending ? "default" : "pointer"}
        onClick={() => {
          if (!isPending && !isCorrect) onSetCorrect?.(displayId, choice.id);
        }}
        disabled={isPending}
      >
        <Text
          minW="28px"
          fontSize="sm"
          fontWeight="black"
          color={isCorrect ? "green.600" : "blue.500"}
          lineHeight="1.7"
          flexShrink={0}
        >
          {letter})
        </Text>
        <Box flex={1} minW={0}>
          {choice.text ? (
            <Text
              fontSize="sm"
              fontWeight={isCorrect ? "semibold" : "normal"}
              color={headingColor}
              lineHeight="1.75"
              dir="auto"
            >
              {renderFormattedExamText(choice.text)}
            </Text>
          ) : null}
          {choice.image ? (
            <Box mt={choice.text ? 2 : 0}>
              <ChoiceImageFrame
                src={choice.image}
                alt={`الخيار ${letter}`}
                onZoom={onZoomImage}
                maxH={choice.isImageOnly ? "140px" : "90px"}
              />
            </Box>
          ) : null}
        </Box>
        {isCorrect ? (
          <Badge colorScheme="green" fontSize="10px" borderRadius="md" mt={0.5} flexShrink={0}>
            صحيحة
          </Badge>
        ) : isPending ? (
          <Spinner size="xs" mt={1} flexShrink={0} />
        ) : null}
      </Flex>
    );
  };

  const renderStudentChoice = (choice, cidx) => {
    const letter = CHOICE_LETTERS[cidx] ?? String(cidx + 1);
    const isSelected = studentAnswers?.[questionId] === choice.id;

    return (
      <Radio
        key={choice.id}
        value={String(choice.id)}
        isDisabled={!!submitResult}
        w="full"
        sx={{
          "& .chakra-radio__control": { display: "none" },
          "& .chakra-radio__label": { w: "full", m: 0 },
        }}
      >
        <Flex
          w="full"
          direction="column"
          gap={2}
          p={2.5}
          borderRadius="xl"
          borderWidth={isSelected ? "2px" : "1px"}
          borderColor={isSelected ? selectedBorder : border}
          bg={isSelected ? selectedBg : cardBg}
          cursor="pointer"
          transition="all 0.15s"
          _hover={{
            borderColor: isSelected ? selectedBorder : "blue.300",
            bg: isSelected ? selectedBg : hoverBg,
          }}
          h="full"
          textAlign="right"
        >
          <Flex align="center" gap={2}>
            <Flex
              w={7}
              h={7}
              flexShrink={0}
              borderRadius="md"
              bg={isSelected ? "blue.500" : letterBg}
              color={isSelected ? "white" : letterColor}
              align="center"
              justify="center"
              fontSize="xs"
              fontWeight="bold"
            >
              {letter}
            </Flex>
            {choice.text && (
              <Text flex={1} fontSize="sm" fontWeight={isSelected ? "semibold" : "normal"} color={headingColor} lineHeight="1.65">
                {renderFormattedExamText(choice.text)}
              </Text>
            )}
          </Flex>
          {choice.image && (
            <ChoiceImageFrame
              src={choice.image}
              alt={`الخيار ${letter}`}
              onZoom={onZoomImage}
              maxH={choice.isImageOnly ? "200px" : "130px"}
            />
          )}
        </Flex>
      </Radio>
    );
  };

  if (!normalized.length) {
    return (
      <Alert status="info" borderRadius="lg" mt={2}>
        <AlertIcon />
        <Text fontSize="sm">لا توجد اختيارات متاحة.</Text>
      </Alert>
    );
  }

  return (
    <Box mt={mode === "student" ? 4 : 0}>
      <Text fontSize="xs" fontWeight="bold" color={muted} mb={2.5}>
        {mode === "student" ? "اختر الإجابة الصحيحة" : "الاختيارات — اضغط لتعيين الصحيحة"}
      </Text>

      {mode === "student" ? (
        <RadioGroup
          value={studentAnswers?.[questionId] ? String(studentAnswers[questionId]) : ""}
          onChange={(val) => onChoice?.(questionId, Number(val))}
        >
          <SimpleGrid columns={imageGrid ? { base: 2, lg: 4 } : { base: 1, md: 2 }} spacing={2.5}>
            {normalized.map((choice, cidx) => renderStudentChoice(choice, cidx))}
          </SimpleGrid>
        </RadioGroup>
      ) : (
        <Box
          data-tour-id={tourTargetId}
          p={3}
          borderRadius="xl"
          bg={teacherChoicesBg}
          borderWidth="1px"
          borderColor={border}
        >
          <SimpleGrid columns={imageGrid ? 1 : { base: 1, md: 2 }} spacing={2}>
            {normalized.map((choice, cidx) => renderTeacherChoice(choice, cidx))}
          </SimpleGrid>
        </Box>
      )}
    </Box>
  );
}

export function TeacherQuestionCard({
  index,
  displayId,
  displayText,
  displayImage,
  displayChoices,
  passageContent,
  questionRef,
  pendingCorrect,
  onZoomImage,
  onAddImage,
  onEdit,
  onDelete,
  onSetCorrect,
  isTourTarget = false,
}) {
  const cardBg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const indexBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const indexColor = useColorModeValue("#0E4C92", "blue.200");
  const hasCorrect = (displayChoices || []).some((c) => c.is_correct);

  return (
    <Box
      data-tour-id={isTourTarget ? "exam-question-card" : undefined}
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="2xl"
      overflow="hidden"
    >
      <Flex
        align={{ base: "stretch", sm: "center" }}
        justify="space-between"
        gap={3}
        px={{ base: 4, md: 5 }}
        py={3}
        borderBottomWidth="1px"
        borderColor={borderColor}
        direction={{ base: "column", sm: "row" }}
      >
        <HStack spacing={3} minW={0}>
          <Flex
            minW="34px"
            h="34px"
            borderRadius="lg"
            bg={indexBg}
            color={indexColor}
            align="center"
            justify="center"
            fontSize="sm"
            fontWeight="800"
          >
            {index + 1}
          </Flex>
          <HStack spacing={2} flexWrap="wrap">
            {passageContent ? (
              <Badge colorScheme="blue" variant="subtle" borderRadius="full" fontSize="10px">
                قطعة
              </Badge>
            ) : null}
            {displayImage && !displayText ? (
              <Badge colorScheme="purple" variant="subtle" borderRadius="full" fontSize="10px">
                صورة
              </Badge>
            ) : null}
            {!hasCorrect ? (
              <Badge colorScheme="orange" variant="subtle" borderRadius="full" fontSize="10px">
                بدون إجابة صحيحة
              </Badge>
            ) : null}
          </HStack>
        </HStack>

        <HStack spacing={1} flexShrink={0} justify={{ base: "flex-end", sm: "flex-end" }}>
          <Tooltip label="إضافة صورة" hasArrow>
            <IconButton
              aria-label="إضافة صورة"
              size="sm"
              variant="ghost"
              borderRadius="lg"
              icon={<AiFillPicture />}
              onClick={() => onAddImage(displayId)}
              cursor="pointer"
              data-tour-id={isTourTarget ? "exam-question-add-image" : undefined}
            />
          </Tooltip>
          <Tooltip label="تعديل السؤال" hasArrow>
            <IconButton
              aria-label="تعديل"
              size="sm"
              variant="ghost"
              colorScheme="blue"
              borderRadius="lg"
              icon={<AiFillEdit />}
              onClick={() => onEdit(questionRef)}
              cursor="pointer"
              data-tour-id={isTourTarget ? "exam-question-edit" : undefined}
            />
          </Tooltip>
          <Tooltip label="حذف السؤال" hasArrow>
            <IconButton
              aria-label="حذف"
              size="sm"
              variant="ghost"
              colorScheme="red"
              borderRadius="lg"
              icon={<AiFillDelete />}
              onClick={() => onDelete(displayId)}
              cursor="pointer"
              data-tour-id={isTourTarget ? "exam-question-delete" : undefined}
            />
          </Tooltip>
        </HStack>
      </Flex>

      <Box p={{ base: 4, md: 5 }}>
        {passageContent ? (
          <Box mb={4}>
            <ExamPassageBlock content={passageContent} variant="teacher" />
          </Box>
        ) : null}

        {displayText ? (
          <Text
            fontSize={{ base: "sm", md: "md" }}
            fontWeight="600"
            color={textColor}
            lineHeight="1.95"
            dir="auto"
            mb={displayImage || displayChoices?.length ? 4 : 0}
            whiteSpace="pre-wrap"
          >
            {renderFormattedExamText(displayText)}
          </Text>
        ) : null}

        {displayImage ? (
          <Box mb={displayChoices?.length ? 4 : 0}>
            <ExamQuestionImage
              src={displayImage}
              onZoom={onZoomImage}
              maxH={{ base: "260px", md: "360px" }}
              compact={!!displayText}
            />
          </Box>
        ) : null}

        {!displayText && !displayImage ? (
          <Text fontSize="sm" color={muted} mb={4}>
            سؤال بدون نص — أضف صورة أو عدّل السؤال
          </Text>
        ) : null}

        <ExamChoicesSection
          choices={displayChoices}
          mode="teacher"
          displayId={displayId}
          pendingCorrect={pendingCorrect}
          onSetCorrect={onSetCorrect}
          onZoomImage={onZoomImage}
          headingColor={textColor}
          tourTargetId={isTourTarget ? "exam-question-choices" : undefined}
        />
      </Box>
    </Box>
  );
}

export function StudentQuestionPanel({
  questionIndex,
  totalQuestions,
  questionId,
  questionText,
  questionImage,
  questionChoices,
  passageContent,
  studentAnswers,
  submitResult,
  onChoice,
  onZoomImage,
  headingColor,
  subtextColor,
  cardBg,
  cardBorder,
}) {
  const border = cardBorder || useColorModeValue("gray.200", "gray.600");
  const bg = cardBg || useColorModeValue("white", "gray.800");
  const headerBg = useColorModeValue("blue.50", "whiteAlpha.50");
  const muted = subtextColor || useColorModeValue("gray.500", "gray.400");
  const textColor = headingColor || useColorModeValue("gray.800", "white");

  return (
    <Box bg={bg} borderRadius="2xl" borderWidth="1px" borderColor={border} overflow="hidden" boxShadow="sm">
      <Flex
        align="center"
        justify="space-between"
        px={4}
        py={3}
        bg={headerBg}
        borderBottomWidth="1px"
        borderColor={border}
      >
        <HStack spacing={2}>
          <Flex w={8} h={8} borderRadius="lg" bg="blue.500" color="white" align="center" justify="center" fontWeight="bold" fontSize="sm">
            {questionIndex + 1}
          </Flex>
          <Box>
            <Text fontSize="xs" color={muted}>
              السؤال {questionIndex + 1} من {totalQuestions}
            </Text>
          </Box>
        </HStack>
        <Badge colorScheme={studentAnswers[questionId] ? "green" : "gray"} variant="subtle" fontSize="10px">
          {studentAnswers[questionId] ? "تم الإجابة" : "بانتظار الإجابة"}
        </Badge>
      </Flex>

      <Box p={{ base: 4, md: 5 }}>
        {passageContent && <ExamPassageBlock content={passageContent} variant="student" />}

        <Grid
          templateColumns={questionImage && questionText ? { base: "1fr", md: "1fr 1fr" } : "1fr"}
          gap={4}
          mb={2}
          alignItems="start"
        >
          {questionText && (
            <Text fontSize={{ base: "sm", md: "md" }} fontWeight="semibold" color={textColor} lineHeight="1.8">
              {renderFormattedExamText(questionText)}
            </Text>
          )}
          {questionImage && (
            <ExamQuestionImage src={questionImage} onZoom={onZoomImage} maxH={{ base: "280px", md: "320px" }} compact={!!questionText} />
          )}
        </Grid>

        <ExamChoicesSection
          choices={questionChoices}
          mode="student"
          questionId={questionId}
          studentAnswers={studentAnswers}
          submitResult={submitResult}
          onChoice={onChoice}
          onZoomImage={onZoomImage}
          headingColor={textColor}
        />
      </Box>
    </Box>
  );
}
