import {

  Badge,

  Box,

  Flex,

  HStack,

  Icon,

  Image,

  Radio,

  RadioGroup,

  SimpleGrid,

  Spinner,

  Text,

  Tooltip,

  useColorModeValue,

  VStack,

} from "@chakra-ui/react";

import { AiFillCheckCircle } from "react-icons/ai";

import { MdCheck, MdZoomIn } from "react-icons/md";

import { renderFormattedExamText } from "../../../utils/renderFormattedExamText";



const ARABIC_LETTERS = ["أ", "ب", "ج", "د"];

const LETTER_KEYS = ["A", "B", "C", "D"];



function ExamMediaFrame({ src, alt, onZoom, maxH = "280px", label }) {

  const frameBg = useColorModeValue("gray.50", "gray.900");

  const frameBorder = useColorModeValue("gray.200", "gray.600");



  if (!src) return null;



  return (

    <Box

      position="relative"

      borderRadius="lg"

      borderWidth="1px"

      borderColor={frameBorder}

      bg={frameBg}

      overflow="hidden"

      w="full"

    >

      {label && (

        <Text

          position="absolute"

          top={2}

          right={2}

          zIndex={2}

          fontSize="10px"

          fontWeight="semibold"

          px={2}

          py={0.5}

          borderRadius="md"

          bg="blackAlpha.600"

          color="white"

        >

          {label}

        </Text>

      )}

      <Image

        src={src}

        alt={alt}

        w="100%"

        h="auto"

        maxH={maxH}

        minH="80px"

        objectFit="contain"

        display="block"

        mx="auto"

        py={2}

        px={2}

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

      {onZoom && (

        <Flex

          as="button"

          type="button"

          position="absolute"

          bottom={2}

          left={2}

          align="center"

          gap={1}

          px={2}

          py={1}

          borderRadius="md"

          bg="blackAlpha.700"

          color="white"

          fontSize="10px"

          fontWeight="semibold"

          cursor="pointer"

          onClick={(e) => {

            e.stopPropagation();

            onZoom(src);

          }}

        >

          <Icon as={MdZoomIn} boxSize={3.5} />

          تكبير

        </Flex>

      )}

    </Box>

  );

}



function TextChoiceRow({

  label,

  text,

  isSelected,

  isCorrect,

  isPending,

  mode,

  onClick,

  disabled,

}) {

  const border = useColorModeValue("gray.200", "gray.600");

  const idleBg = useColorModeValue("white", "gray.800");

  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");

  const selectedBg = useColorModeValue("blue.50", "blue.900");

  const selectedBorder = useColorModeValue("blue.400", "blue.300");

  const correctBg = useColorModeValue("green.50", "green.900");

  const correctBorder = useColorModeValue("green.400", "green.400");

  const textColor = useColorModeValue("gray.800", "gray.100");

  const badgeIdleBg = useColorModeValue("gray.100", "gray.700");

  const badgeIdleColor = useColorModeValue("gray.600", "gray.200");



  let bg = idleBg;

  let borderColor = border;

  let badgeBg = badgeIdleBg;

  let badgeColor = badgeIdleColor;



  if (mode === "teacher" && isCorrect) {

    bg = correctBg;

    borderColor = correctBorder;

    badgeBg = "green.500";

    badgeColor = "white";

  } else if (isSelected) {

    bg = selectedBg;

    borderColor = selectedBorder;

    badgeBg = "blue.500";

    badgeColor = "white";

  }



  return (

    <Flex

      align="center"

      gap={3}

      w="full"

      px={3}

      py={2.5}

      minH="44px"

      borderRadius="lg"

      borderWidth="1px"

      borderColor={borderColor}

      bg={bg}

      cursor={disabled ? "default" : "pointer"}

      transition="background 0.15s, border-color 0.15s"

      _hover={

        !disabled && mode === "student" && !isSelected

          ? { bg: hoverBg, borderColor: "blue.200" }

          : !disabled && mode === "teacher" && !isCorrect

            ? { bg: hoverBg, borderColor: "blue.200" }

            : undefined

      }

      onClick={!disabled ? onClick : undefined}

    >

      <Flex

        w={7}

        h={7}

        borderRadius="md"

        bg={badgeBg}

        color={badgeColor}

        align="center"

        justify="center"

        fontWeight="bold"

        fontSize="xs"

        flexShrink={0}

      >

        {isPending ? <Spinner size="xs" color="white" /> : label}

      </Flex>



      <Box flex={1} minW={0}>

        <Text

          fontSize="sm"

          fontWeight={isSelected || isCorrect ? "semibold" : "normal"}

          color={mode === "teacher" && isCorrect ? "green.800" : textColor}

          lineHeight="1.6"

        >

          {renderFormattedExamText(text)}

        </Text>

      </Box>



      {isSelected && mode === "student" && (

        <Icon as={MdCheck} color="blue.500" boxSize={4} flexShrink={0} />

      )}

      {mode === "teacher" && isCorrect && (

        <Icon as={AiFillCheckCircle} color="green.500" boxSize={4} flexShrink={0} />

      )}

    </Flex>

  );

}



function ImageChoiceCell({

  label,

  text,

  image,

  isImageOnly,

  isSelected,

  isCorrect,

  isPending,

  mode,

  onClick,

  onZoomImage,

  disabled,

}) {

  const border = useColorModeValue("gray.200", "gray.600");

  const idleBg = useColorModeValue("white", "gray.800");

  const selectedBorder = useColorModeValue("blue.400", "blue.300");

  const correctBorder = useColorModeValue("green.400", "green.400");

  const badgeIdleBg = useColorModeValue("gray.100", "gray.700");



  let borderColor = border;

  if (mode === "teacher" && isCorrect) borderColor = correctBorder;

  else if (isSelected) borderColor = selectedBorder;



  return (

    <Box

      position="relative"

      p={2}

      borderRadius="lg"

      borderWidth={isSelected || isCorrect ? "2px" : "1px"}

      borderColor={borderColor}

      bg={idleBg}

      cursor={disabled ? "default" : "pointer"}

      onClick={!disabled ? onClick : undefined}

    >

      <Flex

        position="absolute"

        top={2}

        right={2}

        zIndex={2}

        w={6}

        h={6}

        borderRadius="md"

        bg={isSelected ? "blue.500" : isCorrect ? "green.500" : badgeIdleBg}

        color={isSelected || isCorrect ? "white" : undefined}

        align="center"

        justify="center"

        fontWeight="bold"

        fontSize="10px"

      >

        {isPending ? <Spinner size="xs" /> : label}

      </Flex>



      {text && !isImageOnly && (

        <Text fontSize="xs" mb={1.5} pr={8} lineHeight="1.5" noOfLines={2}>

          {renderFormattedExamText(text)}

        </Text>

      )}



      {image && (

        <Box

          borderRadius="md"

          overflow="hidden"

          onClick={(e) => {

            if (onZoomImage) {

              e.stopPropagation();

              onZoomImage(image);

            }

          }}

          cursor={onZoomImage ? "zoom-in" : "default"}

        >

          <Image

            src={image}

            alt={`الخيار ${label}`}

            w="100%"

            h="auto"

            maxH={isImageOnly ? "120px" : "72px"}

            objectFit="contain"

            mx="auto"

            loading="lazy"

          />

        </Box>

      )}

    </Box>

  );

}



function ChoicesSection({

  choices,

  mode,

  selectedLetter,

  onSelectLetter,

  questionId,

  onSetCorrect,

  pendingCorrect,

  onZoomImage,

}) {

  const muted = useColorModeValue("gray.500", "gray.400");



  const normalized = (choices || []).map((c, i) => ({

    ...c,

    letter: c.letter || LETTER_KEYS[i],

    label: ARABIC_LETTERS[i] || c.letter,

  }));



  const textChoices = normalized.filter((c) => !c.isImageOnly && !c.image);

  const imageChoices = normalized.filter((c) => c.isImageOnly || c.image);



  if (!normalized.length) return null;



  const buildTextRow = (choice, cidx) => {

    const rowProps = {

      label: choice.label,

      text: choice.text,

      isSelected: selectedLetter === choice.letter,

      isCorrect: choice.is_correct,

      isPending: pendingCorrect?.[questionId] === choice.id,

      mode,

      disabled: mode === "teacher" && choice.is_correct,

      onClick: () => {

        if (mode === "student") onSelectLetter?.(choice.letter);

        else if (!choice.is_correct) onSetCorrect?.(questionId, choice.id);

      },

    };



    const row = <TextChoiceRow {...rowProps} />;



    if (mode === "teacher") {

      return (

        <Tooltip

          key={choice.id ?? cidx}

          label={choice.is_correct ? "الإجابة الصحيحة" : "اضغط لتعيين كإجابة صحيحة"}

          hasArrow

          openDelay={400}

        >

          <Box>{row}</Box>

        </Tooltip>

      );

    }



    return (

      <Radio

        key={choice.id ?? cidx}

        value={choice.letter}

        w="full"

        sx={{

          "& .chakra-radio__control": { display: "none" },

          "& .chakra-radio__label": { w: "full", m: 0 },

        }}

      >

        <TextChoiceRow {...rowProps} onClick={undefined} />

      </Radio>

    );

  };



  return (

    <Box mt={4}>

      <Text fontSize="xs" fontWeight="semibold" color={muted} mb={2}>

        {mode === "student" ? "اختر الإجابة الصحيحة" : "الاختيارات"}

      </Text>



      {textChoices.length > 0 && (

        <VStack spacing={2} align="stretch" mb={imageChoices.length ? 3 : 0}>

          {mode === "student" ? (

            <RadioGroup value={selectedLetter || ""} onChange={onSelectLetter}>

              {textChoices.map(buildTextRow)}

            </RadioGroup>

          ) : (

            textChoices.map(buildTextRow)

          )}

        </VStack>

      )}



      {imageChoices.length > 0 && (

        <SimpleGrid columns={{ base: 2, md: imageChoices.length >= 4 ? 4 : 2 }} spacing={2}>

          {imageChoices.map((choice, cidx) => (

            <ImageChoiceCell

              key={choice.id ?? cidx}

              label={choice.label}

              text={choice.text}

              image={choice.image}

              isImageOnly={choice.isImageOnly}

              isSelected={selectedLetter === choice.letter}

              isCorrect={choice.is_correct}

              isPending={pendingCorrect?.[questionId] === choice.id}

              mode={mode}

              disabled={mode === "teacher" && choice.is_correct}

              onClick={() => {

                if (mode === "student") onSelectLetter?.(choice.letter);

                else if (!choice.is_correct) onSetCorrect?.(questionId, choice.id);

              }}

              onZoomImage={onZoomImage}

            />

          ))}

        </SimpleGrid>

      )}

    </Box>

  );

}



export function PlatformExamStudentCard({

  question,

  questionIndex,

  totalQuestions,

  selectedLetter,

  onSelectLetter,

  onZoomImage,

}) {

  const cardBg = useColorModeValue("white", "gray.800");

  const border = useColorModeValue("gray.200", "gray.700");

  const textColor = useColorModeValue("gray.800", "white");

  const muted = useColorModeValue("gray.500", "gray.400");

  const headerBg = useColorModeValue("gray.50", "gray.700");



  const hasText = Boolean(question.text?.trim());

  const hasImage = Boolean(question.image);

  const isImageQuestion = question.type === "IMAGE" || (!hasText && hasImage);



  return (

    <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={border} overflow="hidden" boxShadow="sm">

      <Box h="2px" bg="blue.500" />



      <Flex

        align="center"

        justify="space-between"

        px={4}

        py={2}

        bg={headerBg}

        borderBottomWidth="1px"

        borderColor={border}

      >

        <HStack spacing={2}>

          <Flex

            w={7}

            h={7}

            borderRadius="md"

            bg="blue.500"

            color="white"

            align="center"

            justify="center"

            fontWeight="bold"

            fontSize="xs"

          >

            {questionIndex + 1}

          </Flex>

          <Text fontSize="xs" color={muted}>

            {questionIndex + 1} / {totalQuestions}

          </Text>

        </HStack>

        <Badge

          px={2}

          py={0.5}

          borderRadius="md"

          colorScheme={selectedLetter ? "green" : "gray"}

          variant="subtle"

          fontSize="10px"

        >

          {selectedLetter ? "تمت الإجابة" : "لم تُجب بعد"}

        </Badge>

      </Flex>



      <Box px={4} py={4}>

        {isImageQuestion && hasImage && (

          <Box mb={hasText ? 3 : 0}>

            <ExamMediaFrame

              src={question.image}

              alt="صورة السؤال"

              onZoom={onZoomImage}

              maxH={{ base: "220px", md: "280px" }}

            />

          </Box>

        )}



        {hasText && (

          <Box mb={hasImage && !isImageQuestion ? 3 : 0} borderRightWidth="3px" borderColor="blue.400" pr={3}>

            <Text fontSize={{ base: "sm", md: "md" }} fontWeight="semibold" color={textColor} lineHeight="1.75">

              {renderFormattedExamText(question.text)}

            </Text>

          </Box>

        )}



        {hasImage && hasText && (

          <Box mb={3}>

            <ExamMediaFrame src={question.image} alt="شكل السؤال" onZoom={onZoomImage} maxH="200px" />

          </Box>

        )}



        {!hasText && !hasImage && (

          <Text fontSize="sm" color={muted} mb={3}>

            سؤال {questionIndex + 1}

          </Text>

        )}



        <ChoicesSection

          choices={question.choices}

          mode="student"

          selectedLetter={selectedLetter}

          onSelectLetter={(letter) => onSelectLetter(question.id, letter)}

          onZoomImage={onZoomImage}

        />

      </Box>

    </Box>

  );

}



export function PlatformExamTeacherCard({

  question,

  index,

  pendingCorrect,

  onSetCorrect,

  onZoomImage,

  actions,

}) {

  const cardBg = useColorModeValue("white", "gray.800");

  const border = useColorModeValue("gray.200", "gray.700");

  const textColor = useColorModeValue("gray.800", "white");

  const muted = useColorModeValue("gray.500", "gray.400");

  const headerBg = useColorModeValue("gray.50", "gray.700");

  const accentBar = useColorModeValue("blue.500", "blue.400");



  const hasText = Boolean(question.text?.trim());

  const hasImage = Boolean(question.image);

  const isImageQuestion = question.type === "IMAGE" || (!hasText && hasImage);



  return (

    <Box bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={border} overflow="hidden" boxShadow="sm" h="full">

      <Box h="2px" bg={accentBar} />



      <Flex

        align="center"

        justify="space-between"

        px={3}

        py={2}

        bg={headerBg}

        borderBottomWidth="1px"

        borderColor={border}

      >

        <HStack spacing={2}>

          <Text fontSize="xs" fontWeight="bold" color="blue.500">

            {index + 1}

          </Text>

          <Badge variant="subtle" colorScheme={isImageQuestion ? "purple" : "blue"} fontSize="9px">

            {isImageQuestion ? "صورة" : "نص"}

          </Badge>

          <Text fontSize="10px" color={muted}>

            {question.grade ?? 1} درجة

          </Text>

        </HStack>

        {actions}

      </Flex>



      <Box px={3} py={3}>

        {isImageQuestion && hasImage && (

          <Box mb={hasText ? 2 : 0}>

            <ExamMediaFrame src={question.image} alt="صورة السؤال" onZoom={onZoomImage} maxH="200px" />

          </Box>

        )}



        {hasText && (

          <Box mb={hasImage && !isImageQuestion ? 2 : 0} borderRightWidth="3px" borderColor="blue.400" pr={2}>

            <Text fontSize="sm" fontWeight="medium" color={textColor} lineHeight="1.7">

              {renderFormattedExamText(question.text)}

            </Text>

          </Box>

        )}



        {hasImage && hasText && (

          <Box mb={2}>

            <ExamMediaFrame src={question.image} alt="صورة السؤال" onZoom={onZoomImage} maxH="160px" />

          </Box>

        )}



        {!hasText && !hasImage && (

          <Text fontSize="xs" color={muted} mb={2}>

            سؤال {index + 1}

          </Text>

        )}



        <ChoicesSection

          choices={question.choices}

          mode="teacher"

          questionId={question.id}

          pendingCorrect={pendingCorrect}

          onSetCorrect={onSetCorrect}

          onZoomImage={onZoomImage}

        />

      </Box>

    </Box>

  );

}



export function isImageUrl(value) {

  if (!value || typeof value !== "string") return false;

  const t = value.trim();

  return /^https?:\/\//i.test(t) || t.startsWith("/") || /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(t);

}



export function formatAnswerLabel(value) {

  if (!value) return "—";

  if (isImageUrl(value)) return "صورة";

  const s = String(value).trim();

  if (s.length > 80) return s.slice(0, 80);

  return s;

}


