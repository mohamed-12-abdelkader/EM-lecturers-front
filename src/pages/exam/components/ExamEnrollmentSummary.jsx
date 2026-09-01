import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Progress,
  SimpleGrid,
  Text,
  Tooltip,
  VStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import {
  FiCheckCircle,
  FiClock,
  FiSearch,
  FiUserCheck,
  FiUserX,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import {
  downloadNotExaminedExcel,
  downloadNotExaminedPdf,
  notExaminedStatusLabel,
} from "../utils/exportNotExaminedStudents";

const NAVY = "#0E4C92";
const GREEN = "#059669";
const RED = "#DC2626";
const AMBER = "#D97706";
const SLATE = "#64748B";
const PASS_PRESETS = [50, 60, 70];

function formatPct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n * 10) / 10}%`;
}

function statusMeta(status) {
  if (status === "in_progress") {
    return { label: notExaminedStatusLabel(status), color: "orange", icon: FiClock };
  }
  return { label: notExaminedStatusLabel(status), color: "gray", icon: FiUserX };
}

function KpiCard({ label, value, hint, accent, icon: StatIcon, children }) {
  const cardBg = useColorModeValue("white", "gray.900");
  const muted = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const soft = useColorModeValue(`${accent}14`, "whiteAlpha.100");

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="2xl"
      p={{ base: 4, md: 5 }}
      h="full"
      boxShadow="sm"
    >
      <Flex align="flex-start" justify="space-between" gap={3} mb={children ? 4 : 0}>
        <Box minW={0}>
          <Text fontSize="sm" fontWeight="semibold" color={muted} mb={2}>
            {label}
          </Text>
          <Text
            fontSize={{ base: "3xl", md: "4xl" }}
            fontWeight="black"
            color={accent}
            lineHeight="1"
            letterSpacing="-0.04em"
          >
            {value}
          </Text>
          {hint ? (
            <Text fontSize="sm" color={muted} mt={2} fontWeight="medium">
              {hint}
            </Text>
          ) : null}
        </Box>
        {StatIcon ? (
          <Flex
            w="48px"
            h="48px"
            borderRadius="2xl"
            align="center"
            justify="center"
            bg={soft}
            color={accent}
            flexShrink={0}
          >
            <Icon as={StatIcon} boxSize={6} />
          </Flex>
        ) : null}
      </Flex>
      {children}
    </Box>
  );
}

function SplitBar({ left, right, leftColor, rightColor, track }) {
  const leftPct = Math.max(0, Number(left) || 0);
  const rightPct = Math.max(0, Number(right) || 0);
  const total = leftPct + rightPct;
  const leftW = total > 0 ? (leftPct / total) * 100 : 50;
  const rightW = total > 0 ? (rightPct / total) * 100 : 50;

  return (
    <Flex h="14px" borderRadius="full" overflow="hidden" bg={track}>
      <Box w={`${leftW}%`} bg={leftColor} minW={leftPct > 0 ? "6px" : 0} />
      <Box w={`${rightW}%`} bg={rightColor} minW={rightPct > 0 ? "6px" : 0} />
    </Flex>
  );
}

export default function ExamEnrollmentSummary({
  summary,
  students = [],
  passPercentage,
  onPassPercentageChange,
  isRefreshing = false,
  examTitle = "",
  courseTitle = "",
}) {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [draftPass, setDraftPass] = useState(String(passPercentage ?? 50));
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    setDraftPass(String(passPercentage ?? 50));
  }, [passPercentage]);

  const cardBg = useColorModeValue("white", "gray.900");
  const border = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.900", "white");
  const panelSoft = useColorModeValue("#F8FAFC", "whiteAlpha.50");
  const rowBorder = useColorModeValue("gray.100", "gray.700");
  const progressTrack = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const headerBg = useColorModeValue("#F1F5F9", "whiteAlpha.100");

  const enrolledTotal = summary?.enrolledTotal ?? 0;
  const examined = summary?.examined || { count: 0, percentage: 0 };
  const notExamined = summary?.notExamined || { count: 0, percentage: 0 };
  const startedNotSubmitted = summary?.startedNotSubmitted || { count: 0, percentage: 0 };
  const passed = summary?.passed || { count: 0, percentage: 0 };
  const failed = summary?.failed || { count: 0, percentage: 0 };
  const neverStartedCount = Math.max(
    0,
    (notExamined.count || 0) - (startedNotSubmitted.count || 0),
  );

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((student) => {
      if (statusFilter === "in_progress" && student.examStatus !== "in_progress") return false;
      if (statusFilter === "never_started" && student.examStatus === "in_progress") return false;
      if (!q) return true;
      const name = String(student.studentName || "").toLowerCase();
      const email = String(student.studentEmail || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [students, statusFilter, query]);

  const applyPassPercentage = (value) => {
    const n = Math.min(100, Math.max(0, Number(value)));
    if (!Number.isFinite(n)) return;
    setDraftPass(String(n));
    onPassPercentageChange?.(n);
  };

  const exportFileName = examTitle ? `لم-يسلموا-${examTitle}` : "لم-يسلموا-الامتحان";

  const handleExport = async (kind) => {
    if (!filteredStudents.length) {
      toast({
        title: "لا يوجد طلاب للتنزيل",
        description: "غيّر الفلتر أو تأكد أن هناك طلاباً لم يسلّموا.",
        status: "warning",
      });
      return;
    }
    setExporting(kind);
    try {
      const options = {
        title: examTitle || "الطلاب الذين لم يسلّموا",
        courseTitle,
        filename: exportFileName,
      };
      const ok =
        kind === "excel"
          ? downloadNotExaminedExcel(filteredStudents, options)
          : await downloadNotExaminedPdf(filteredStudents, options);
      if (ok) {
        toast({
          title: kind === "excel" ? "تم تنزيل ملف Excel" : "تم تنزيل ملف PDF",
          description: `${filteredStudents.length} طالب حسب الفلتر الحالي`,
          status: "success",
        });
      }
    } catch (err) {
      toast({
        title: "تعذر التنزيل",
        description: err?.message || "حدث خطأ أثناء إنشاء الملف",
        status: "error",
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <VStack spacing={5} align="stretch" opacity={isRefreshing ? 0.72 : 1} transition="opacity 0.2s ease">
      <Box
        bg={cardBg}
        borderWidth="1px"
        borderColor={border}
        borderRadius="2xl"
        overflow="hidden"
        boxShadow="sm"
      >
        <Flex
          px={{ base: 4, md: 5 }}
          py={4}
          borderBottomWidth="1px"
          borderColor={border}
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          gap={4}
          direction={{ base: "column", lg: "row" }}
          bg={panelSoft}
        >
          <Box>
            <Heading size="sm" color={titleColor}>
              حضور الامتحان ونتائجه
            </Heading>
            <Text fontSize="sm" color={muted} mt={1}>
              {enrolledTotal} طالب مشترك في الكورس · النجاح من {passPercentage}%
            </Text>
          </Box>
          <HStack spacing={2} flexWrap="wrap">
            <Text fontSize="xs" color={muted} fontWeight="bold">
              حد النجاح
            </Text>
            <ButtonGroup size="sm" isAttached variant="outline">
              {PASS_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  colorScheme={Number(passPercentage) === preset ? "blue" : "gray"}
                  variant={Number(passPercentage) === preset ? "solid" : "outline"}
                  onClick={() => applyPassPercentage(preset)}
                  isDisabled={isRefreshing}
                >
                  {preset}%
                </Button>
              ))}
            </ButtonGroup>
            <Input
              size="sm"
              w="70px"
              dir="ltr"
              type="number"
              min={0}
              max={100}
              value={draftPass}
              onChange={(e) => setDraftPass(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyPassPercentage(draftPass);
              }}
              borderRadius="lg"
            />
            <Button
              size="sm"
              colorScheme="blue"
              onClick={() => applyPassPercentage(draftPass)}
              isLoading={isRefreshing}
            >
              تطبيق
            </Button>
          </HStack>
        </Flex>

        <Box p={{ base: 4, md: 5 }}>
          <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4} mb={5}>
            <KpiCard
              label="مشتركو الكورس"
              value={enrolledTotal}
              hint="الإجمالي الذي تُحسب منه النسب"
              accent={NAVY}
              icon={FiUsers}
            />
            <KpiCard
              label="سلّموا الامتحان"
              value={examined.count}
              hint={`${formatPct(examined.percentage)} من المشتركين`}
              accent="#1D4ED8"
              icon={FiUserCheck}
            >
              <Progress
                value={Math.min(100, examined.percentage || 0)}
                size="sm"
                borderRadius="full"
                bg={progressTrack}
                sx={{ "& > div": { bg: "#1D4ED8" } }}
              />
            </KpiCard>
            <KpiCard
              label="لم يسلّموا"
              value={notExamined.count}
              hint={`${formatPct(notExamined.percentage)} من المشتركين · لم يبدأ ${neverStartedCount}`}
              accent={SLATE}
              icon={FiUserX}
            />
            <KpiCard
              label="بدأ ولم يسلّم"
              value={startedNotSubmitted.count || 0}
              hint={`${formatPct(startedNotSubmitted.percentage)} من المشتركين`}
              accent={AMBER}
              icon={FiClock}
            >
              <Progress
                value={Math.min(100, startedNotSubmitted.percentage || 0)}
                size="sm"
                borderRadius="full"
                bg={progressTrack}
                sx={{ "& > div": { bg: AMBER } }}
              />
            </KpiCard>
          </SimpleGrid>

          <Box bg={panelSoft} borderRadius="2xl" p={{ base: 4, md: 5 }}>
            <Flex justify="space-between" align="center" mb={4} gap={3} flexWrap="wrap">
              <Box>
                <Heading size="xs" color={titleColor}>
                  نتيجة الذين سلّموا
                </Heading>
                <Text fontSize="xs" color={muted} mt={1}>
                  {examined.count || 0} طالب سلّموا · حد النجاح {passPercentage}%
                </Text>
              </Box>
              <Badge colorScheme="blue" variant="subtle" borderRadius="full" px={3}>
                من المسلّمين ومن إجمالي المشتركين
              </Badge>
            </Flex>

            <SplitBar
              left={passed.count}
              right={failed.count}
              leftColor={GREEN}
              rightColor={RED}
              track={progressTrack}
            />

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
              <Box bg={cardBg} borderRadius="xl" p={4} borderWidth="1px" borderColor={border}>
                <HStack justify="space-between" mb={1}>
                  <HStack>
                    <Icon as={FiCheckCircle} color={GREEN} />
                    <Text fontWeight="bold">ناجحون</Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="black" color={GREEN} lineHeight="1">
                    {passed.count || 0}
                  </Text>
                </HStack>
                <Text fontSize="sm" color={muted}>
                  {formatPct(passed.percentageOfExamined ?? 0)} من الذين سلّموا
                  {" · "}
                  {formatPct(passed.percentage)} من المشتركين
                </Text>
              </Box>
              <Box bg={cardBg} borderRadius="xl" p={4} borderWidth="1px" borderColor={border}>
                <HStack justify="space-between" mb={1}>
                  <HStack>
                    <Icon as={FiXCircle} color={RED} />
                    <Text fontWeight="bold">راسبون</Text>
                  </HStack>
                  <Text fontSize="2xl" fontWeight="black" color={RED} lineHeight="1">
                    {failed.count || 0}
                  </Text>
                </HStack>
                <Text fontSize="sm" color={muted}>
                  {formatPct(failed.percentageOfExamined ?? 0)} من الذين سلّموا
                  {" · "}
                  {formatPct(failed.percentage)} من المشتركين
                </Text>
              </Box>
            </SimpleGrid>
          </Box>
        </Box>
      </Box>

      <Box
        bg={cardBg}
        borderWidth="1px"
        borderColor={border}
        borderRadius="2xl"
        overflow="hidden"
        boxShadow="sm"
      >
        <Flex
          px={{ base: 4, md: 5 }}
          py={4}
          borderBottomWidth="1px"
          borderColor={border}
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          gap={3}
          direction={{ base: "column", md: "row" }}
        >
          <Box>
            <Heading size="sm" color={titleColor}>
              الطلاب الذين لم يسلّموا
            </Heading>
            <Text fontSize="sm" color={muted} mt={1}>
              {students.length} طالب · التنزيل حسب الفلتر الظاهر الآن
            </Text>
          </Box>
          <HStack spacing={2} flexWrap="wrap">
            <Tooltip label="ملف Excel يفتح في Microsoft Excel" hasArrow>
              <Button
                size="sm"
                colorScheme="green"
                variant="outline"
                leftIcon={<Icon as={FaFileExcel} />}
                onClick={() => handleExport("excel")}
                isLoading={exporting === "excel"}
                isDisabled={!filteredStudents.length || Boolean(exporting)}
              >
                Excel
              </Button>
            </Tooltip>
            <Tooltip label="كشف PDF للطباعة" hasArrow>
              <Button
                size="sm"
                colorScheme="red"
                variant="outline"
                leftIcon={<Icon as={FaFilePdf} />}
                onClick={() => handleExport("pdf")}
                isLoading={exporting === "pdf"}
                isDisabled={!filteredStudents.length || Boolean(exporting)}
              >
                PDF
              </Button>
            </Tooltip>
          </HStack>
        </Flex>

        <Box px={{ base: 4, md: 5 }} py={4}>
          <Flex gap={3} mb={3} direction={{ base: "column", md: "row" }} align={{ md: "center" }}>
            <ButtonGroup size="sm" variant="outline" flexWrap="wrap">
              <Button
                colorScheme={statusFilter === "all" ? "blue" : "gray"}
                variant={statusFilter === "all" ? "solid" : "outline"}
                onClick={() => setStatusFilter("all")}
              >
                الكل ({students.length})
              </Button>
              <Button
                colorScheme={statusFilter === "never_started" ? "gray" : "gray"}
                variant={statusFilter === "never_started" ? "solid" : "outline"}
                onClick={() => setStatusFilter("never_started")}
              >
                لم يبدأ ({neverStartedCount})
              </Button>
              <Button
                colorScheme={statusFilter === "in_progress" ? "orange" : "gray"}
                variant={statusFilter === "in_progress" ? "solid" : "outline"}
                onClick={() => setStatusFilter("in_progress")}
              >
                بدأ ولم يسلّم ({startedNotSubmitted.count || 0})
              </Button>
            </ButtonGroup>
            <InputGroup size="sm" maxW={{ md: "260px" }} ms={{ md: "auto" }}>
              <InputRightElement pointerEvents="none">
                <Icon as={FiSearch} color={muted} />
              </InputRightElement>
              <Input
                placeholder="بحث بالاسم أو الإيميل"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                borderRadius="lg"
                pe={9}
              />
            </InputGroup>
          </Flex>

          {filteredStudents.length === 0 ? (
            <Flex minH="88px" align="center" justify="center" bg={panelSoft} borderRadius="xl">
              <Text fontSize="sm" color={muted}>
                لا يوجد طلاب في هذا التصنيف
              </Text>
            </Flex>
          ) : (
            <Box
              borderWidth="1px"
              borderColor={border}
              borderRadius="xl"
              overflow="hidden"
              maxH="420px"
              overflowY="auto"
            >
              <Flex
                px={3.5}
                py={2.5}
                bg={headerBg}
                fontSize="xs"
                fontWeight="bold"
                color={muted}
                position="sticky"
                top={0}
                zIndex={1}
              >
                <Text w="44px">م</Text>
                <Text flex={1}>اسم الطالب</Text>
                <Text flex={1} display={{ base: "none", md: "block" }}>
                  البريد
                </Text>
                <Text w="130px" textAlign="end">
                  الحالة
                </Text>
              </Flex>
              <VStack align="stretch" spacing={0}>
                {filteredStudents.map((student, index) => {
                  const meta = statusMeta(student.examStatus);
                  return (
                    <Flex
                      key={student.studentId ?? `${student.studentEmail}-${index}`}
                      px={3.5}
                      py={3}
                      align="center"
                      gap={3}
                      borderBottomWidth={index === filteredStudents.length - 1 ? 0 : "1px"}
                      borderColor={rowBorder}
                      _hover={{ bg: panelSoft }}
                    >
                      <Text w="44px" fontSize="sm" color={muted} fontWeight="bold">
                        {index + 1}
                      </Text>
                      <Box flex={1} minW={0}>
                        <Text fontWeight="semibold" noOfLines={1}>
                          {student.studentName}
                        </Text>
                        <Text
                          fontSize="xs"
                          color={muted}
                          dir="ltr"
                          textAlign="left"
                          display={{ base: "block", md: "none" }}
                        >
                          {student.studentEmail || "—"}
                        </Text>
                      </Box>
                      <Text
                        flex={1}
                        fontSize="sm"
                        color={muted}
                        dir="ltr"
                        textAlign="left"
                        noOfLines={1}
                        display={{ base: "none", md: "block" }}
                      >
                        {student.studentEmail || "—"}
                      </Text>
                      <Badge
                        colorScheme={meta.color}
                        variant="subtle"
                        borderRadius="full"
                        px={2.5}
                        w="130px"
                        textAlign="center"
                        display="inline-flex"
                        justifyContent="center"
                        alignItems="center"
                        gap={1}
                      >
                        <Icon as={meta.icon} boxSize={3} />
                        {meta.label}
                      </Badge>
                    </Flex>
                  );
                })}
              </VStack>
            </Box>
          )}
        </Box>
      </Box>
    </VStack>
  );
}
