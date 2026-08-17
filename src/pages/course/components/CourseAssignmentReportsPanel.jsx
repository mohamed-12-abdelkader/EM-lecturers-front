import { Link } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Icon,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FaChartBar, FaTasks } from "react-icons/fa";
import { useMemo, useState } from "react";
import { useCourseAssignmentReports } from "../../../Hooks/course/useCourseAssignmentReports";
import { buildExamReportPath } from "../../exam/utils/examReportUtils";
import { crEyebrowOrange, crSubheading, lcCaption, lcLabel, lcRoot, lcTitleSm } from "../courseTheme";

const TYPE_LABELS = {
  exam: "امتحان محاضرة",
  assignment: "واجب",
};

const SCOPE_LABELS = {
  lecture: "محاضرة",
  course: "كورس منفصل",
};

function ReportRow({ item }) {
  const typeLabel = TYPE_LABELS[item.type] || item.type || "—";
  const scopeLabel = SCOPE_LABELS[item.scope] || item.scope || "—";

  return (
    <Flex
      direction={{ base: "column", sm: "row" }}
      align={{ base: "stretch", sm: "center" }}
      justify="space-between"
      gap={3}
      p={4}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      bg="white"
      _dark={{ bg: "gray.900", borderColor: "gray.700" }}
    >
      <Box flex={1} minW={0} textAlign="right">
        <HStack spacing={2} flexWrap="wrap" mb={1} justify="flex-start">
          <Text fontWeight="bold" fontSize="sm" noOfLines={2}>
            {item.title}
          </Text>
          <Badge colorScheme="blue" variant="subtle">
            {typeLabel}
          </Badge>
          <Badge colorScheme="purple" variant="subtle">
            {scopeLabel}
          </Badge>
        </HStack>
        {item.lectureTitle ? (
          <Text fontSize="xs" color="gray.500" mb={1}>
            المحاضرة: {item.lectureTitle}
          </Text>
        ) : null}
        <Text fontSize="xs" color="gray.500">
          {item.questionsCount ?? 0} سؤال • {item.submissionsCount ?? 0} تسليم •
          {" "}
          {item.passedCount ?? 0} ناجح
          {item.averageGrade != null ? ` • متوسط ${item.averageGrade}` : ""}
        </Text>
      </Box>

      <Button
        as={Link}
        to={buildExamReportPath(item.id, { from: "lecture" })}
        size="sm"
        colorScheme="blue"
        leftIcon={<Icon as={FaChartBar} />}
        flexShrink={0}
        alignSelf={{ base: "stretch", sm: "center" }}
      >
        عرض التقرير
      </Button>
    </Flex>
  );
}

export default function CourseAssignmentReportsPanel({ courseId, enabled = true }) {
  const [typeFilter, setTypeFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");

  const filters = useMemo(() => {
    const f = {};
    if (typeFilter) f.type = typeFilter;
    if (scopeFilter) f.scope = scopeFilter;
    return f;
  }, [typeFilter, scopeFilter]);

  const { data, isLoading, isError, refetch, isFetching } = useCourseAssignmentReports(
    courseId,
    filters,
    { enabled },
  );

  const reports = data?.reports ?? [];

  return (
    <VStack spacing={{ base: 4, md: 5 }} align="stretch" dir="rtl" className={lcRoot}>
      <Flex
        justify="space-between"
        align={{ base: "stretch", sm: "center" }}
        gap={4}
        direction={{ base: "column", sm: "row" }}
        className="border-b border-slate-100 pb-5 text-right dark:border-slate-800"
      >
        <div className="relative min-w-0 pr-4">
          <span
            className="absolute right-0 top-1 hidden h-[calc(100%-6px)] w-1 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500 sm:block"
            aria-hidden
          />
          <span className={crEyebrowOrange}>تحليل الأداء</span>
          <h2 className={`${crSubheading} mt-2.5 text-xl tracking-tight md:text-2xl`}>
            تقارير الواجبات والامتحانات
          </h2>
          <p className={`mt-2 max-w-lg ${lcLabel}`}>
            امتحانات المحاضرة والواجبات المنفصلة — إحصائيات آخر محاولة لكل طالب
          </p>
        </div>

        <HStack spacing={2} flexWrap="wrap" justify={{ base: "flex-start", sm: "flex-end" }}>
          <Select
            size="sm"
            maxW="160px"
            borderRadius="lg"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            bg="white"
            _dark={{ bg: "gray.800" }}
          >
            <option value="">كل الأنواع</option>
            <option value="exam">امتحانات المحاضرة</option>
            <option value="assignment">الواجبات</option>
          </Select>
          <Select
            size="sm"
            maxW="160px"
            borderRadius="lg"
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            bg="white"
            _dark={{ bg: "gray.800" }}
          >
            <option value="">كل النطاقات</option>
            <option value="lecture">محاضرة</option>
            <option value="course">واجب كورس</option>
          </Select>
          <Button size="sm" variant="outline" onClick={() => refetch()} isLoading={isFetching}>
            تحديث
          </Button>
        </HStack>
      </Flex>

      {isLoading ? (
        <Center py={12}>
          <Spinner size="lg" color="blue.500" thickness="3px" />
        </Center>
      ) : isError ? (
        <Center py={10} flexDir="column" gap={3}>
          <Text color="red.500" fontSize="sm">
            تعذّر تحميل التقارير
          </Text>
          <Button size="sm" onClick={() => refetch()}>
            إعادة المحاولة
          </Button>
        </Center>
      ) : reports.length === 0 ? (
        <Center py={10} flexDir="column" gap={3} textAlign="center">
          <Box
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-500 dark:bg-blue-950/40"
          >
            <FaTasks className="text-2xl" />
          </Box>
          <Text color="gray.500" fontSize="sm">
            لا توجد تقارير بعد — يحتاج الطلاب لتسليم محاولات أولاً
          </Text>
        </Center>
      ) : (
        <VStack align="stretch" spacing={3}>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={2}>
            <Box textAlign="center" p={3} borderRadius="xl" bg="blue.50" _dark={{ bg: "whiteAlpha.100" }}>
              <Text fontSize="xs" color="gray.500">
                إجمالي
              </Text>
              <Text fontWeight="bold" fontSize="xl">
                {reports.length}
              </Text>
            </Box>
            <Box textAlign="center" p={3} borderRadius="xl" bg="purple.50" _dark={{ bg: "whiteAlpha.100" }}>
              <Text fontSize="xs" color="gray.500">
                محاضرة
              </Text>
              <Text fontWeight="bold" fontSize="xl">
                {reports.filter((r) => r.scope === "lecture").length}
              </Text>
            </Box>
            <Box textAlign="center" p={3} borderRadius="xl" bg="orange.50" _dark={{ bg: "whiteAlpha.100" }}>
              <Text fontSize="xs" color="gray.500">
                كورس
              </Text>
              <Text fontWeight="bold" fontSize="xl">
                {reports.filter((r) => r.scope === "course").length}
              </Text>
            </Box>
            <Box textAlign="center" p={3} borderRadius="xl" bg="green.50" _dark={{ bg: "whiteAlpha.100" }}>
              <Text fontSize="xs" color="gray.500">
                تسليمات
              </Text>
              <Text fontWeight="bold" fontSize="xl">
                {reports.reduce((s, r) => s + (r.submissionsCount || 0), 0)}
              </Text>
            </Box>
          </SimpleGrid>

          {reports.map((item) => (
            <ReportRow key={item.id} item={item} />
          ))}
        </VStack>
      )}
    </VStack>
  );
}
