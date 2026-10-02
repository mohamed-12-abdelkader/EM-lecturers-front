import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Spinner,
  Text,
  useColorModeValue,
  VStack,
  Wrap,
  WrapItem,
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
        boxShadow="sm"
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

function StatPill({ label, value, tone = "blue" }) {
  const bg = useColorModeValue(`${tone}.50`, "whiteAlpha.100");
  const color = useColorModeValue(`${tone}.700`, `${tone}.200`);
  return (
    <HStack spacing={2} px={3} py={1.5} bg={bg} borderRadius="full" minW="fit-content">
      <Text
        fontSize="sm"
        fontWeight="800"
        color={color}
        sx={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </Text>
      <Text fontSize="xs" fontWeight="600" color={useColorModeValue("gray.600", "gray.300")}>
        {label}
      </Text>
    </HStack>
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
  onClearSelection,
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue(
    isSelectionMode ? "orange.200" : "gray.200",
    isSelectionMode ? "orange.700" : "gray.700",
  );
  const muted = useColorModeValue("gray.500", "gray.400");
  const heading = useColorModeValue("gray.900", "white");
  const accentBar = useColorModeValue(
    isSelectionMode ? "orange.400" : "blue.500",
    isSelectionMode ? "orange.300" : "blue.300",
  );
  const iconBg = useColorModeValue(
    isSelectionMode ? "orange.50" : "blue.50",
    "whiteAlpha.100",
  );

  return (
    <Box
      bg={cardBg}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={border}
      overflow="hidden"
      mb={4}
      boxShadow="sm"
    >
      <Box h="3px" bg={accentBar} />
      <Box px={{ base: 4, md: 5 }} py={{ base: 4, md: 5 }}>
        <Flex
          direction={{ base: "column", md: "row" }}
          align={{ base: "stretch", md: "center" }}
          justify="space-between"
          gap={4}
        >
          <HStack spacing={3} align="center" minW={0}>
            <Button
              as={Link}
              to="/Teacher_subjects"
              size="sm"
              variant="ghost"
              colorScheme={isSelectionMode ? "orange" : "blue"}
              leftIcon={<MdArrowForward />}
              flexShrink={0}
              borderRadius="lg"
            >
              رجوع
            </Button>
            <Flex
              w={11}
              h={11}
              borderRadius="xl"
              bg={iconBg}
              color={isSelectionMode ? "orange.500" : "blue.500"}
              align="center"
              justify="center"
              flexShrink={0}
            >
              <Icon as={isSelectionMode ? MdChecklist : MdMenuBook} boxSize={5} />
            </Flex>
            <Box minW={0}>
              <HStack spacing={2} mb={0.5} flexWrap="wrap">
                <Heading size="md" fontWeight="800" color={heading} noOfLines={1}>
                  {isSelectionMode ? "أسئلة محددةة للامتحان" : "أسئلة الدرس"}
                </Heading>
                <Badge
                  colorScheme="gray"
                  variant="subtle"
                  fontFamily="mono"
                  fontSize="xs"
                  borderRadius="md"
                >
                  #{lessonId}
                </Badge>
              </HStack>
              <Text fontSize="sm" color={muted} lineHeight="1.7" noOfLines={2}>
                {isSelectionMode
                  ? `${selectedCount} سؤال محدد — أضِفهم من الشريط السفلي أو اضغط مرتين لإلغاء التحديد`
                  : (isAdmin || isTeacher)
                    ? "اضغط مرتين على أي سؤال لتحديده وإضافته للامتحان"
                    : "إدارة الأسئلة والقطع، والبحث أو الانتقال لسؤال برقم معيّن"}
              </Text>
            </Box>
          </HStack>

          <Wrap spacing={2} justify={{ base: "flex-start", md: "flex-end" }}>
            <WrapItem>
              <StatPill label="سؤال" value={questionsCount} tone="blue" />
            </WrapItem>
            <WrapItem>
              <StatPill label="قطعة" value={passagesCount} tone="teal" />
            </WrapItem>
            {isSelectionMode ? (
              <WrapItem>
                <StatPill label="محدد" value={selectedCount} tone="orange" />
              </WrapItem>
            ) : null}
          </Wrap>
        </Flex>

        <Flex
          mt={4}
          pt={4}
          borderTopWidth="1px"
          borderColor={border}
          gap={2}
          flexWrap="wrap"
          align="center"
        >
          {isAdmin && (
            <>
              <Button
                size="sm"
                leftIcon={<MdQuiz />}
                colorScheme="blue"
                borderRadius="xl"
                onClick={onAddQuestions}
              >
                إضافة أسئلة
              </Button>
              <Button
                size="sm"
                leftIcon={<MdImage />}
                variant="outline"
                colorScheme="blue"
                borderRadius="xl"
                onClick={onAddImageQuestion}
              >
                سؤال صور
              </Button>
              <Button
                size="sm"
                leftIcon={<MdDocumentScanner />}
                variant="outline"
                colorScheme="blue"
                borderRadius="xl"
                onClick={onExtract}
              >
                استخراج من صورة
              </Button>
            </>
          )}
          {isSelectionMode && typeof onClearSelection === "function" ? (
            <Button
              size="sm"
              leftIcon={<MdClose />}
              variant="solid"
              colorScheme="orange"
              borderRadius="xl"
              onClick={onClearSelection}
              fontWeight="800"
              mr={isAdmin ? "auto" : undefined}
            >
              مسح التحديد ({selectedCount})
            </Button>
          ) : null}
        </Flex>
      </Box>
    </Box>
  );
}

export function LessonEmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
  icon: IconComp = MdQuiz,
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const iconBg = useColorModeValue("blue.50", "whiteAlpha.100");

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      minH="320px"
      bg={cardBg}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={border}
      textAlign="center"
      p={10}
      boxShadow="sm"
    >
      <Flex w={14} h={14} borderRadius="2xl" bg={iconBg} align="center" justify="center" mb={4}>
        <Icon as={IconComp} boxSize={6} color="blue.400" />
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
  const iconBg = useColorModeValue("blue.50", "blue.900");
  return (
    <Box px={6} py={4} borderBottomWidth="1px" borderColor={border}>
      <HStack spacing={3}>
        <Flex
          w={9}
          h={9}
          borderRadius="lg"
          bg={iconBg}
          align="center"
          justify="center"
        >
          <Icon as={IconComp} color="blue.500" _dark={{ color: "blue.300" }} />
        </Flex>
        <Heading size="sm" color={textColor}>
          {title}
        </Heading>
      </HStack>
    </Box>
  );
}
