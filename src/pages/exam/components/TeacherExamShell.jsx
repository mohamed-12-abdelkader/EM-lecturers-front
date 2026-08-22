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
  FaSync,
  FaSearch,
  FaCompass,
} from "react-icons/fa";

function HeaderBtn({ icon, label, onClick, isLoading, solid = false, tourId }) {
  return (
    <Button
      data-tour-id={tourId}
      size="sm"
      leftIcon={<Icon as={icon} />}
      bg={solid ? "#DD6B20" : "whiteAlpha.150"}
      color="white"
      borderWidth="1px"
      borderColor={solid ? "transparent" : "whiteAlpha.250"}
      _hover={{ bg: solid ? "#C05621" : "whiteAlpha.250" }}
      borderRadius="lg"
      fontWeight="700"
      fontSize="sm"
      h="36px"
      px={3}
      cursor={isLoading ? "wait" : "pointer"}
      onClick={isLoading ? undefined : onClick}
      isLoading={isLoading}
      isDisabled={isLoading}
    >
      {label}
    </Button>
  );
}

/**
 * صفحة امتحان المدرّس — الهيدر يملأ أعلى الصفحة والنافبار يطفو فوقه
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
  onStartTour,
}) {
  const pageBg = useColorModeValue("#F4F6F9", "gray.950");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.900", "white");
  const searchBg = useColorModeValue("white", "gray.800");

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
  const totalGrade =
    examData?.totalGrade ?? examData?.total_grade ?? examData?.maxGrade ?? null;
  const displayCount = filteredCount ?? questionsCount;

  const meta = [
    courseName,
    `${questionsCount} سؤال`,
    duration ? `${duration} دقيقة` : null,
    totalGrade != null && totalGrade !== "" ? `الدرجة ${totalGrade}` : null,
  ].filter(Boolean);

  return (
    <Box
      minH="100vh"
      bg={pageBg}
      dir="rtl"
      pb={{ base: 10, md: 14 }}
      fontFamily="'Noto Sans Arabic', system-ui, sans-serif"
    >
      <Box
        data-tour-id="exam-teacher-hero"
        bg="linear-gradient(125deg, #082B57 0%, #0E4C92 55%, #1A6BB8 100%)"
        pt={{ base: "4.75rem", md: "5.25rem" }}
        pb={5}
      >
        <Container maxW="6xl" px={{ base: 4, md: 6 }}>
          <Flex justify="space-between" align="flex-start" gap={3} mb={4}>
            <Box minW={0} flex={1}>
              <HStack spacing={2} mb={2}>
                <Badge
                  bg="whiteAlpha.200"
                  color="white"
                  borderRadius="full"
                  px={2.5}
                  py={0.5}
                  fontSize="11px"
                  fontWeight="800"
                >
                  {typeLabel}
                </Badge>
                {examData?.isVisible === false ? (
                  <Badge bg="whiteAlpha.200" color="whiteAlpha.800" borderRadius="full" px={2.5} fontSize="11px">
                    مخفي
                  </Badge>
                ) : null}
              </HStack>
              <Text
                fontWeight="800"
                fontSize={{ base: "xl", md: "2xl" }}
                lineHeight="1.3"
                color="white"
                letterSpacing="-0.02em"
                noOfLines={2}
              >
                {examTitle || "الامتحان"}
              </Text>
              {meta.length > 0 ? (
                <Text mt={2} fontSize="sm" color="whiteAlpha.800" noOfLines={1}>
                  {meta.join("  ·  ")}
                </Text>
              ) : null}
            </Box>

            <HStack spacing={2} flexShrink={0} flexWrap="wrap" justify="flex-end">
              {typeof onStartTour === "function" && (
                <Button
                  data-tour-id="exam-teacher-tour-btn"
                  size="sm"
                  variant="ghost"
                  color="white"
                  borderRadius="lg"
                  leftIcon={<FaCompass />}
                  onClick={onStartTour}
                  cursor="pointer"
                  _hover={{ bg: "whiteAlpha.200" }}
                >
                  جولة الإدارة
                </Button>
              )}
              {typeof onReload === "function" && (
                <Button
                  data-tour-id="exam-teacher-reload"
                  size="sm"
                  variant="ghost"
                  color="white"
                  borderRadius="lg"
                  leftIcon={loading ? <Spinner size="xs" /> : <FaSync />}
                  onClick={onReload}
                  isDisabled={loading}
                  cursor="pointer"
                  _hover={{ bg: "whiteAlpha.200" }}
                >
                  تحديث
                </Button>
              )}
            </HStack>
          </Flex>

          <Flex gap={2} wrap="wrap" align="center" justify="space-between">
            <HStack spacing={2} flexWrap="wrap">
              <HeaderBtn tourId="exam-teacher-ai" icon={FaMagic} label="استخراج ذكي" solid onClick={onAiExtract} />
              <HeaderBtn tourId="exam-teacher-bulk" icon={FaAlignLeft} label="أسئلة كنص" onClick={onBulkText} />
              <HeaderBtn tourId="exam-teacher-passage" icon={FaBookOpen} label="من قطعة" onClick={onPassage} />
              <HeaderBtn tourId="exam-teacher-images" icon={FaImage} label="أسئلة كصور" onClick={onAddImages} />
            </HStack>
            <HStack spacing={2} flexWrap="wrap">
              <HeaderBtn tourId="exam-teacher-grades" icon={FaUsers} label="درجات الطلاب" onClick={onGrades} />
              <HeaderBtn
                tourId="exam-teacher-report"
                icon={FaChartBar}
                label="تقرير الأسئلة"
                onClick={onReport}
                isLoading={reportLoading}
              />
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="6xl" pt={{ base: 5, md: 6 }} px={{ base: 4, md: 6 }}>
        <Flex
          direction={{ base: "column", md: "row" }}
          align={{ base: "stretch", md: "center" }}
          justify="space-between"
          gap={3}
          mb={4}
        >
          <Text fontSize="sm" color={muted}>
            {displayCount === questionsCount
              ? `${questionsCount} سؤال`
              : `${displayCount} من ${questionsCount}`}
            {" · حدّد الإجابة الصحيحة بالضغط على الاختيار"}
          </Text>

          {typeof onSearchChange === "function" && questionsCount > 0 ? (
            <InputGroup maxW={{ base: "full", md: "280px" }} size="sm" data-tour-id="exam-teacher-search">
              <InputLeftElement pointerEvents="none" color={muted} h="full">
                <FaSearch size={12} />
              </InputLeftElement>
              <Input
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                borderRadius="lg"
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
  const titleColor = useColorModeValue("gray.800", "gray.100");
  const muted = useColorModeValue("gray.500", "gray.400");

  return (
    <Flex
      data-tour-id="exam-teacher-empty"
      direction="column"
      align="center"
      justify="center"
      py={{ base: 12, md: 16 }}
      px={6}
      borderWidth="1px"
      borderStyle="dashed"
      borderColor={border}
      borderRadius="xl"
      textAlign="center"
      gap={4}
    >
      <VStack spacing={1.5}>
        <Text fontWeight="800" fontSize="lg" color={titleColor}>
          لا توجد أسئلة بعد
        </Text>
        <Text fontSize="sm" color={muted} maxW="340px" lineHeight="1.8">
          استخرج الأسئلة من ملف، أو ألصق النص دفعة واحدة.
        </Text>
      </VStack>
      <HStack spacing={2} flexWrap="wrap" justify="center">
        <Button
          bg="#DD6B20"
          color="white"
          borderRadius="lg"
          h="40px"
          px={4}
          leftIcon={<FaMagic />}
          onClick={onAiExtract}
          fontWeight="700"
          cursor="pointer"
          _hover={{ bg: "#C05621" }}
        >
          استخراج ذكي
        </Button>
        <Button
          variant="outline"
          borderRadius="lg"
          h="40px"
          px={4}
          leftIcon={<FaAlignLeft />}
          onClick={onBulkText}
          fontWeight="600"
          cursor="pointer"
        >
          إضافة كنص
        </Button>
      </HStack>
      {onReload && (
        <Button variant="ghost" size="sm" color={muted} onClick={onReload} isLoading={loading} cursor="pointer">
          إعادة تحميل
        </Button>
      )}
    </Flex>
  );
}
