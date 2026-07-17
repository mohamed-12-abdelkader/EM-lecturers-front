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
} from "react-icons/fa";

const ACCENT = "#3182CE";

const CREATE_ACTIONS = [
  { id: "ai", label: "استخراج ذكي", icon: FaMagic, primary: true },
  { id: "images", label: "أسئلة كصور", icon: FaImage },
  { id: "bulk", label: "أسئلة كنص", icon: FaAlignLeft },
  { id: "passage", label: "من قطعة", icon: FaBookOpen },
];

const REVIEW_ACTIONS = [
  { id: "grades", label: "الدرجات", icon: FaUsers },
  { id: "report", label: "التقرير", icon: FaChartBar },
];

function ToolButton({ item, onClick, isLoading, outlineBg }) {
  const IconComp = item.icon;
  return (
    <Button
      size="sm"
      h="40px"
      px={4}
      borderRadius="lg"
      fontSize="13px"
      fontWeight={item.primary ? "bold" : "semibold"}
      leftIcon={isLoading ? <Spinner size="xs" /> : <Icon as={IconComp} boxSize={3.5} />}
      onClick={onClick}
      isDisabled={isLoading}
      colorScheme={item.primary ? "blue" : undefined}
      bg={item.primary ? ACCENT : outlineBg}
      color={item.primary ? "white" : "gray.700"}
      borderWidth="1px"
      borderColor={item.primary ? ACCENT : "gray.200"}
      _dark={{
        color: item.primary ? "white" : "gray.200",
        borderColor: item.primary ? ACCENT : "gray.600",
        bg: item.primary ? ACCENT : "gray.800",
      }}
      _hover={{
        bg: item.primary ? "blue.600" : "blue.50",
        borderColor: item.primary ? "blue.600" : "blue.200",
        color: item.primary ? "white" : ACCENT,
      }}
      justifyContent="flex-start"
      w={{ base: "100%", sm: "auto" }}
    >
      {item.label}
    </Button>
  );
}

/**
 * صفحة امتحان المدرّس — تنسيق واضح للعناصر
 */
export default function TeacherExamShell({
  examTitle,
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
}) {
  const pageBg = useColorModeValue("#F4F7FB", "gray.950");
  const cardBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.900", "white");
  const outlineBg = useColorModeValue("white", "gray.800");
  const toolPanelBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const stickyShadow = useColorModeValue(
    "0 4px 16px rgba(15,23,42,0.06)",
    "0 4px 16px rgba(0,0,0,0.3)",
  );

  const handlers = {
    grades: onGrades,
    report: onReport,
    ai: onAiExtract,
    images: onAddImages,
    bulk: onBulkText,
    passage: onPassage,
  };

  return (
    <Box
      minH="100vh"
      bg={pageBg}
      dir="rtl"
      className="mt-[80px]"
      pb={{ base: 10, md: 12 }}
      fontFamily="'Noto Sans Arabic', system-ui, sans-serif"
    >
      <Box
        bg={cardBg}
        borderBottomWidth="1px"
        borderColor={border}
        position="sticky"
        top={0}
        zIndex={20}
        boxShadow={stickyShadow}
      >
        <Box h="3px" bg={`linear-gradient(90deg, ${ACCENT}, #DD6B20)`} />

        <Container maxW="5xl" py={{ base: 4, md: 5 }} px={{ base: 3, md: 6 }}>
          {/* العنوان */}
          <Flex
            justify="space-between"
            align="flex-start"
            gap={3}
            mb={4}
          >
            <HStack spacing={3} align="flex-start" minW={0} flex={1}>
              <Flex
                w={11}
                h={11}
                borderRadius="xl"
                bg="blue.50"
                _dark={{ bg: "whiteAlpha.100" }}
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Icon as={FaClipboardList} color={ACCENT} boxSize={5} />
              </Flex>
              <Box minW={0} pt={0.5}>
                <Text
                  fontWeight="black"
                  fontSize={{ base: "lg", md: "xl" }}
                  lineHeight="1.3"
                  color={titleColor}
                  noOfLines={2}
                >
                  {examTitle || "الامتحان"}
                </Text>
                <Text fontSize="sm" color={muted} mt={1}>
                  {questionsCount} سؤال
                </Text>
              </Box>
            </HStack>

            {typeof onReload === "function" && (
              <Button
                size="sm"
                variant="outline"
                borderRadius="lg"
                leftIcon={loading ? <Spinner size="xs" /> : <FaSync />}
                onClick={onReload}
                isDisabled={loading}
                borderColor={border}
                color={muted}
                flexShrink={0}
              >
                تحديث
              </Button>
            )}
          </Flex>

          {/* الأدوات — مجموعتان واضحتان */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            <Box p={3} borderRadius="xl" borderWidth="1px" borderColor={border} bg={toolPanelBg}>
              <Text fontSize="11px" fontWeight="bold" color={muted} mb={2.5}>
                إضافة أسئلة
              </Text>
              <Flex gap={2} flexWrap="wrap">
                {CREATE_ACTIONS.map((item) => (
                  <ToolButton
                    key={item.id}
                    item={item}
                    outlineBg={outlineBg}
                    onClick={() => handlers[item.id]?.()}
                  />
                ))}
              </Flex>
            </Box>

            <Box p={3} borderRadius="xl" borderWidth="1px" borderColor={border} bg={toolPanelBg}>
              <Text fontSize="11px" fontWeight="bold" color={muted} mb={2.5}>
                متابعة
              </Text>
              <Flex gap={2} flexWrap="wrap">
                {REVIEW_ACTIONS.map((item) => (
                  <ToolButton
                    key={item.id}
                    item={item}
                    outlineBg={outlineBg}
                    isLoading={item.id === "report" && reportLoading}
                    onClick={() => handlers[item.id]?.()}
                  />
                ))}
              </Flex>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* قائمة الأسئلة مباشرة على الخلفية — بدون كارد مزدوج */}
      <Container maxW="5xl" pt={{ base: 5, md: 7 }} px={{ base: 3, md: 6 }}>
        <Flex justify="space-between" align="center" mb={4} px={1}>
          <Text fontWeight="bold" fontSize="md" color={titleColor}>
            قائمة الأسئلة
          </Text>
          <Text fontSize="sm" color={muted}>
            اضغط على اختيار لتعيينه كإجابة صحيحة
          </Text>
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
      py={{ base: 12, md: 16 }}
      px={5}
      borderWidth="1px"
      borderStyle="dashed"
      borderColor={border}
      borderRadius="2xl"
      bg={cardBg}
      textAlign="center"
      gap={3}
    >
      <Flex
        w={14}
        h={14}
        borderRadius="2xl"
        bg="blue.50"
        align="center"
        justify="center"
      >
        <Icon as={FaClipboardList} color={ACCENT} boxSize={6} />
      </Flex>
      <Text fontWeight="bold" fontSize="lg" color={titleColor}>
        لا توجد أسئلة بعد
      </Text>
      <Text fontSize="sm" color={muted} maxW="320px" lineHeight="1.8">
        ابدأ باستخراج الأسئلة من ملف، أو ألصق النص دفعة واحدة.
      </Text>
      <VStack spacing={2} mt={3} w="full" maxW="260px">
        <Button
          w="full"
          colorScheme="blue"
          bg={ACCENT}
          borderRadius="lg"
          h="42px"
          leftIcon={<FaMagic />}
          onClick={onAiExtract}
        >
          استخراج ذكي
        </Button>
        <Button
          w="full"
          variant="outline"
          borderRadius="lg"
          h="42px"
          leftIcon={<FaAlignLeft />}
          onClick={onBulkText}
        >
          إضافة كنص
        </Button>
        {onReload && (
          <Button variant="ghost" size="sm" color={muted} onClick={onReload} isLoading={loading}>
            إعادة تحميل
          </Button>
        )}
      </VStack>
    </Flex>
  );
}
