import React from "react";
import {
  Box,
  Container,
  Flex,
  HStack,
  VStack,
  Text,
  Button,
  Spinner,
  Icon,
  SimpleGrid,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FaChartBar,
  FaUsers,
  FaImage,
  FaAlignLeft,
  FaBookOpen,
  FaMagic,
  FaClipboardList,
  FaSync,
  FaSearch,
  FaClock,
  FaGraduationCap,
} from "react-icons/fa";

const BRAND_BLUE = "blue.500";
const BRAND_ORANGE = "orange.500";

const CREATE_ACTIONS = [
  {
    id: "ai",
    label: "استخراج ذكي",
    hint: "PDF أو صورة",
    icon: FaMagic,
    accent: "blue",
    featured: true,
  },
  { id: "bulk", label: "أسئلة كنص", hint: "لصق دفعة", icon: FaAlignLeft, accent: "orange" },
  { id: "passage", label: "من قطعة", hint: "قراءة + MCQ", icon: FaBookOpen, accent: "blue" },
  { id: "images", label: "أسئلة كصور", hint: "حتى 10 صور", icon: FaImage, accent: "orange" },
];

const REVIEW_ACTIONS = [
  { id: "grades", label: "درجات الطلاب", hint: "التسليمات", icon: FaUsers, accent: "blue" },
  { id: "report", label: "تقرير الأسئلة", hint: "تحليل", icon: FaChartBar, accent: "orange" },
];

function ActionCard({ item, onClick, isLoading, compact = false }) {
  const IconComp = item.icon;
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.800", "white");
  const accent = item.accent === "orange" ? BRAND_ORANGE : BRAND_BLUE;
  const tint = useColorModeValue(
    item.accent === "orange" ? "orange.50" : "blue.50",
    item.accent === "orange" ? "whiteAlpha.100" : "whiteAlpha.100",
  );

  return (
    <Box
      as="button"
      type="button"
      w="full"
      textAlign="right"
      cursor={isLoading ? "wait" : "pointer"}
      onClick={isLoading ? undefined : onClick}
      disabled={isLoading}
      _hover={{ transform: "translateY(-2px)" }}
      transition="transform 0.15s ease"
    >
      <Flex
        align="center"
        gap={3}
        p={compact ? 3 : 3.5}
        borderRadius="xl"
        bg={item.featured ? tint : cardBg}
        borderWidth="1px"
        borderColor={item.featured ? accent : border}
        boxShadow={item.featured ? "sm" : "none"}
        w="full"
        minH={compact ? "56px" : "64px"}
      >
        <Flex
          w={10}
          h={10}
          borderRadius="lg"
          bg={item.featured ? accent : tint}
          color={item.featured ? "white" : accent}
          align="center"
          justify="center"
          flexShrink={0}
        >
          {isLoading ? <Spinner size="sm" /> : <Icon as={IconComp} boxSize={4} />}
        </Flex>
        <Box flex={1} minW={0} textAlign="right">
          <Text fontSize="sm" fontWeight="bold" color={titleColor} noOfLines={1}>
            {item.label}
          </Text>
          {!compact && item.hint ? (
            <Text fontSize="xs" color={muted} mt={0.5}>
              {item.hint}
            </Text>
          ) : null}
        </Box>
      </Flex>
    </Box>
  );
}

function StatPill({ icon, label, value, accent = "blue" }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const valueColor = useColorModeValue("gray.900", "white");
  const color = accent === "orange" ? BRAND_ORANGE : BRAND_BLUE;

  return (
    <Flex
      align="center"
      gap={2.5}
      px={3.5}
      py={2.5}
      borderRadius="xl"
      bg={bg}
      borderWidth="1px"
      borderColor={border}
      minW={0}
    >
      <Flex w={8} h={8} borderRadius="lg" bg={accent === "orange" ? "orange.50" : "blue.50"} align="center" justify="center" flexShrink={0}>
        <Icon as={icon} color={color} boxSize={3.5} />
      </Flex>
      <Box minW={0}>
        <Text fontSize="10px" color={muted} fontWeight="semibold">
          {label}
        </Text>
        <Text fontSize="sm" fontWeight="bold" color={valueColor} noOfLines={1}>
          {value}
        </Text>
      </Box>
    </Flex>
  );
}

/**
 * صفحة امتحان المدرّس — هيدر + أدوات + قائمة أسئلة
 */
export default function TeacherExamShell({
  examTitle,
  examData,
  examType = "comprehensive",
  questionsCount = 0,
  children,
  onGrades,
  onReport,
  onAddImages,
  onBulkText,
  onPassage,
  onAiExtract,
  reportLoading = false,
  onReload,
  loading = false,
  searchQuery = "",
  onSearchChange,
  filteredCount,
}) {
  const pageBg = useColorModeValue("#EEF2F8", "gray.950");
  const heroBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.900", "white");
  const panelBg = useColorModeValue("white", "gray.900");
  const searchBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const mesh = useColorModeValue(
    "radial-gradient(ellipse 70% 60% at 100% 0%, rgba(49,130,206,0.12), transparent 55%), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(221,107,32,0.1), transparent 50%)",
    "radial-gradient(ellipse 70% 60% at 100% 0%, rgba(49,130,206,0.15), transparent 55%), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(221,107,32,0.12), transparent 50%)",
  );

  const handlers = {
    grades: onGrades,
    report: onReport,
    ai: onAiExtract,
    images: onAddImages,
    bulk: onBulkText,
    passage: onPassage,
  };

  const duration =
    examData?.duration ??
    examData?.durationMinutes ??
    examData?.timeLimitMinutes ??
    null;
  const courseName =
    examData?.courseTitle ??
    examData?.course_title ??
    examData?.courseName ??
    examData?.course_name ??
    null;
  const typeLabel = examType === "comprehensive" ? "امتحان شامل" : "واجب / محاضرة";
  const displayCount = filteredCount ?? questionsCount;

  return (
    <Box
      minH="100vh"
      bg={pageBg}
      dir="rtl"
      className="mt-[80px]"
      pb={{ base: 10, md: 14 }}
      fontFamily="'Noto Sans Arabic', system-ui, sans-serif"
      position="relative"
    >
      <Box position="absolute" inset={0} bg={mesh} pointerEvents="none" />

      {/* Hero */}
      <Box position="relative" bg={heroBg} borderBottomWidth="1px" borderColor={border}>
        <Box h="4px" bgGradient={`linear(to-l, ${BRAND_BLUE}, ${BRAND_ORANGE})`} />
        <Container maxW="6xl" py={{ base: 5, md: 7 }} px={{ base: 4, md: 6 }}>
          <Flex justify="space-between" align="flex-start" gap={4} mb={5} flexWrap="wrap">
            <HStack spacing={4} align="flex-start" minW={0} flex={1}>
              <Flex
                w={{ base: 12, md: 14 }}
                h={{ base: 12, md: 14 }}
                borderRadius="2xl"
                bgGradient={`linear(135deg, ${BRAND_BLUE}, ${BRAND_ORANGE})`}
                align="center"
                justify="center"
                flexShrink={0}
                boxShadow="md"
              >
                <Icon as={FaClipboardList} color="white" boxSize={{ base: 5, md: 6 }} />
              </Flex>
              <Box minW={0}>
                <HStack spacing={2} mb={1.5} flexWrap="wrap">
                  <Badge colorScheme="blue" borderRadius="full" px={2.5} fontSize="xs">
                    {typeLabel}
                  </Badge>
                  {examData?.isVisible === false ? (
                    <Badge colorScheme="gray" borderRadius="full" px={2.5} fontSize="xs">
                      مخفي
                    </Badge>
                  ) : null}
                </HStack>
                <Text
                  fontWeight="black"
                  fontSize={{ base: "xl", md: "2xl" }}
                  lineHeight="1.35"
                  color={titleColor}
                  noOfLines={2}
                >
                  {examTitle || "الامتحان"}
                </Text>
                {courseName ? (
                  <HStack spacing={1.5} mt={2} color={muted} fontSize="sm">
                    <Icon as={FaGraduationCap} boxSize={3.5} />
                    <Text noOfLines={1}>{courseName}</Text>
                  </HStack>
                ) : null}
              </Box>
            </HStack>

            {typeof onReload === "function" && (
              <Button
                size="sm"
                variant="outline"
                borderRadius="xl"
                leftIcon={loading ? <Spinner size="xs" /> : <FaSync />}
                onClick={onReload}
                isDisabled={loading}
                borderColor={border}
                flexShrink={0}
              >
                تحديث
              </Button>
            )}
          </Flex>

          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={6}>
            <StatPill icon={FaClipboardList} label="الأسئلة" value={`${questionsCount}`} accent="blue" />
            <StatPill
              icon={FaClock}
              label="المدة"
              value={duration ? `${duration} دقيقة` : "غير محددة"}
              accent="orange"
            />
            <StatPill
              icon={FaUsers}
              label="التسليمات"
              value={
                examData?.submissionsCount != null
                  ? String(examData.submissionsCount)
                  : "—"
              }
              accent="blue"
            />
            <StatPill
              icon={FaChartBar}
              label="الدرجة الكلية"
              value={
                examData?.totalGrade ?? examData?.total_grade ?? examData?.maxGrade ?? "—"
              }
              accent="orange"
            />
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
            <Box p={4} borderRadius="2xl" bg={panelBg} borderWidth="1px" borderColor={border} boxShadow="sm">
              <Text fontSize="xs" fontWeight="bold" color={muted} mb={3} letterSpacing="wide">
                إضافة أسئلة
              </Text>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2.5}>
                {CREATE_ACTIONS.map((item) => (
                  <ActionCard
                    key={item.id}
                    item={item}
                    onClick={() => handlers[item.id]?.()}
                  />
                ))}
              </SimpleGrid>
            </Box>

            <Box p={4} borderRadius="2xl" bg={panelBg} borderWidth="1px" borderColor={border} boxShadow="sm">
              <Text fontSize="xs" fontWeight="bold" color={muted} mb={3} letterSpacing="wide">
                متابعة ومراجعة
              </Text>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2.5}>
                {REVIEW_ACTIONS.map((item) => (
                  <ActionCard
                    key={item.id}
                    item={item}
                    compact
                    isLoading={item.id === "report" && reportLoading}
                    onClick={() => handlers[item.id]?.()}
                  />
                ))}
              </SimpleGrid>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Questions */}
      <Container maxW="6xl" pt={{ base: 5, md: 7 }} px={{ base: 4, md: 6 }} position="relative">
        <Flex
          direction={{ base: "column", md: "row" }}
          align={{ base: "stretch", md: "center" }}
          justify="space-between"
          gap={3}
          mb={4}
        >
          <Box>
            <Text fontWeight="black" fontSize="lg" color={titleColor}>
              قائمة الأسئلة
            </Text>
            <Text fontSize="sm" color={muted} mt={0.5}>
              {displayCount === questionsCount
                ? `${questionsCount} سؤال`
                : `${displayCount} من ${questionsCount} سؤال`}
              {" · "}
              اضغط على اختيار لتعيين الإجابة الصحيحة
            </Text>
          </Box>

          {typeof onSearchChange === "function" && questionsCount > 0 ? (
            <InputGroup maxW={{ base: "full", md: "320px" }} size="sm">
              <InputLeftElement pointerEvents="none" color={muted}>
                <FaSearch />
              </InputLeftElement>
              <Input
                placeholder="ابحث في الأسئلة..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                borderRadius="xl"
                bg={searchBg}
                borderColor={border}
              />
            </InputGroup>
          ) : null}
        </Flex>

        {children}
      </Container>
    </Box>
  );
}

export function TeacherExamEmptyState({ onAiExtract, onBulkText, onReload, loading }) {
  const border = useColorModeValue("gray.200", "gray.700");
  const cardBg = useColorModeValue("white", "gray.900");
  const titleColor = useColorModeValue("gray.800", "gray.100");
  const muted = useColorModeValue("gray.500", "gray.400");

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      py={{ base: 14, md: 18 }}
      px={6}
      borderWidth="1px"
      borderStyle="dashed"
      borderColor={border}
      borderRadius="2xl"
      bg={cardBg}
      textAlign="center"
      gap={4}
      boxShadow="sm"
    >
      <Flex
        w={16}
        h={16}
        borderRadius="2xl"
        bgGradient={`linear(135deg, ${BRAND_BLUE}, ${BRAND_ORANGE})`}
        align="center"
        justify="center"
        boxShadow="lg"
      >
        <Icon as={FaClipboardList} color="white" boxSize={7} />
      </Flex>
      <VStack spacing={1}>
        <Text fontWeight="black" fontSize="xl" color={titleColor}>
          لا توجد أسئلة بعد
        </Text>
        <Text fontSize="sm" color={muted} maxW="360px" lineHeight="1.9">
          ابدأ باستخراج الأسئلة من ملف، أو ألصق نصاً دفعة واحدة، أو أضف قطعة قراءة.
        </Text>
      </VStack>
      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3} w="full" maxW="400px" mt={2}>
        <Button
          colorScheme="blue"
          borderRadius="xl"
          h="44px"
          leftIcon={<FaMagic />}
          onClick={onAiExtract}
          fontWeight="bold"
        >
          استخراج ذكي
        </Button>
        <Button
          variant="outline"
          colorScheme="orange"
          borderRadius="xl"
          h="44px"
          leftIcon={<FaAlignLeft />}
          onClick={onBulkText}
          fontWeight="bold"
        >
          إضافة كنص
        </Button>
      </SimpleGrid>
      {onReload && (
        <Button variant="ghost" size="sm" color={muted} onClick={onReload} isLoading={loading}>
          إعادة تحميل
        </Button>
      )}
    </Flex>
  );
}
