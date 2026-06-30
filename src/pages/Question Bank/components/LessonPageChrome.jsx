import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Spinner,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import {
  MdArrowForward,
  MdChecklist,
  MdClose,
  MdDocumentScanner,
  MdImage,
  MdMenuBook,
  MdQuiz,
  MdTextSnippet,
} from "react-icons/md";
import { Link } from "react-router-dom";

export function LessonLoadingScreen() {
  const pageBg = useColorModeValue("gray.50", "gray.900");
  return (
    <Flex minH="60vh" align="center" justify="center" bg={pageBg} dir="rtl">
      <VStack spacing={3}>
        <Spinner size="lg" color="blue.500" thickness="3px" />
        <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")}>
          جاري تحميل أسئلة الدرس...
        </Text>
      </VStack>
    </Flex>
  );
}

export function LessonErrorScreen({ error, onRetry }) {
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  return (
    <Flex minH="60vh" align="center" justify="center" bg={pageBg} px={4} dir="rtl">
      <Box
        maxW="md"
        w="full"
        p={8}
        bg={cardBg}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor={border}
        textAlign="center"
      >
        <Text color="red.500" fontWeight="semibold" mb={2}>
          {error}
        </Text>
        <Button colorScheme="blue" borderRadius="xl" onClick={onRetry}>
          إعادة المحاولة
        </Button>
      </Box>
    </Flex>
  );
}

function StatChip({ label, value, accent }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  return (
    <Box px={3} py={2} bg={bg} borderRadius="lg" borderWidth="1px" borderColor={border} minW={0}>
      <Text fontSize="lg" fontWeight="bold" color={accent} lineHeight="1">
        {value}
      </Text>
      <Text fontSize="xs" color={useColorModeValue("gray.500", "gray.400")} noOfLines={1}>
        {label}
      </Text>
    </Box>
  );
}

export function LessonPageHeader({
  lessonId,
  questionsCount,
  passagesCount,
  isSelectionMode,
  selectedCount,
  isAdmin,
  isTeacher,
  onAddQuestions,
  onAddImageQuestion,
  onExtract,
  onToggleSelection,
}) {
  const heroGradient = useColorModeValue(
    "linear(to-br, blue.600, blue.500)",
    "linear(to-br, blue.700, blue.600)",
  );

  return (
    <Box bgGradient={heroGradient} color="white" borderRadius="2xl" overflow="hidden" mb={4}>
      <Box px={{ base: 4, md: 6 }} py={{ base: 4, md: 5 }}>
        <Flex
          direction={{ base: "column", lg: "row" }}
          align={{ base: "stretch", lg: "center" }}
          justify="space-between"
          gap={4}
        >
          <HStack spacing={3} align="start" minW={0}>
            <Button
              as={Link}
              to="/Teacher_subjects"
              size="sm"
              variant="outline"
              borderColor="whiteAlpha.400"
              color="white"
              leftIcon={<MdArrowForward />}
              _hover={{ bg: "whiteAlpha.200" }}
              flexShrink={0}
            >
              رجوع
            </Button>
            <Box minW={0}>
              <HStack spacing={2} mb={1} flexWrap="wrap">
                <Icon as={MdMenuBook} boxSize={5} opacity={0.9} />
                <Heading size={{ base: "sm", md: "md" }} fontWeight="bold" noOfLines={1}>
                  أسئلة الدرس
                </Heading>
                <Badge bg="whiteAlpha.250" color="white" fontFamily="mono" fontSize="xs">
                  #{lessonId}
                </Badge>
              </HStack>
              <Text fontSize="sm" opacity={0.9} lineHeight="1.7">
                إدارة أسئلة الاختيار من متعدد، القطع، والإضافة للامتحان
              </Text>
            </Box>
          </HStack>

          <Grid
            templateColumns={{ base: "repeat(2, 1fr)", sm: "repeat(4, auto)" }}
            gap={2}
            w={{ base: "full", lg: "auto" }}
          >
            <StatChip label="أسئلة" value={questionsCount} accent="white" />
            <StatChip label="قطع" value={passagesCount} accent="white" />
            {isSelectionMode ? (
              <StatChip label="محدد" value={selectedCount} accent="orange.200" />
            ) : null}
          </Grid>
        </Flex>

        <Flex mt={4} gap={2} flexWrap="wrap">
          {isAdmin && (
            <>
              <Button
                size="sm"
                leftIcon={<MdQuiz />}
                bg="white"
                color="blue.600"
                _hover={{ bg: "whiteAlpha.900" }}
                borderRadius="xl"
                onClick={onAddQuestions}
              >
                إضافة أسئلة
              </Button>
              <Button
                size="sm"
                leftIcon={<MdImage />}
                variant="outline"
                borderColor="whiteAlpha.500"
                color="white"
                borderRadius="xl"
                onClick={onAddImageQuestion}
              >
                سؤال صور
              </Button>
              <Button
                size="sm"
                leftIcon={<MdDocumentScanner />}
                variant="outline"
                borderColor="whiteAlpha.500"
                color="white"
                borderRadius="xl"
                onClick={onExtract}
              >
                استخراج من صورة
              </Button>
            </>
          )}
          {(isAdmin || isTeacher) && questionsCount > 0 && (
            <Button
              size="sm"
              leftIcon={isSelectionMode ? <MdClose /> : <MdChecklist />}
              variant={isSelectionMode ? "solid" : "outline"}
              colorScheme={isSelectionMode ? "orange" : undefined}
              borderColor={isSelectionMode ? undefined : "whiteAlpha.500"}
              color={isSelectionMode ? undefined : "white"}
              borderRadius="xl"
              onClick={onToggleSelection}
            >
              {isSelectionMode ? "إلغاء التحديد" : "تحديد للامتحان"}
            </Button>
          )}
        </Flex>
      </Box>
    </Box>
  );
}

export function LessonEmptyState({ title, subtitle, actionLabel, onAction, icon: IconComp = MdQuiz }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const iconBg = useColorModeValue("gray.100", "gray.700");

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      minH="360px"
      bg={cardBg}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={border}
      textAlign="center"
      p={10}
    >
      <Flex w={14} h={14} borderRadius="xl" bg={iconBg} align="center" justify="center" mb={4}>
        <Icon as={IconComp} boxSize={6} color={muted} />
      </Flex>
      <Heading size="sm" mb={2}>
        {title}
      </Heading>
      <Text fontSize="sm" color={muted} mb={6} maxW="sm" lineHeight="1.8">
        {subtitle}
      </Text>
      {actionLabel && onAction ? (
        <Button colorScheme="blue" borderRadius="xl" leftIcon={<MdQuiz />} onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Flex>
  );
}

export function LessonModalHeader({ title, icon: IconComp = MdTextSnippet }) {
  const border = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  return (
    <Box px={6} py={4} borderBottomWidth="1px" borderColor={border}>
      <HStack spacing={3}>
        <Flex w={9} h={9} borderRadius="lg" bg="blue.50" _dark={{ bg: "blue.900" }} align="center" justify="center">
          <Icon as={IconComp} color="blue.500" />
        </Flex>
        <Heading size="sm" color={textColor}>
          {title}
        </Heading>
      </HStack>
    </Box>
  );
}
