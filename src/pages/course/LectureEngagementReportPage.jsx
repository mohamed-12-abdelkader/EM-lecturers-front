import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Progress,
  Select,
  SimpleGrid,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import {
  FaArrowRight,
  FaChartBar,
  FaCheckCircle,
  FaClock,
  FaFileExcel,
  FaFilePdf,
  FaPhone,
  FaSearch,
  FaSync,
  FaUserGraduate,
} from "react-icons/fa";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import UserType from "../../Hooks/auth/userType";
import {
  ENGAGEMENT_STATUS_META,
  fetchLectureEngagementReport,
  lectureEngagementErrorMessage,
} from "../../api/lectureEngagementReportApi";
import { fetchTeacherCourseGroups } from "../../api/courseGroupsApi";
import { fetchTeacherStudyGroups } from "../../api/teacherManagedStudentsApi";
import {
  crCard,
  crContainer,
  crEyebrow,
  crHeading,
  crPageBg,
  lcCaption,
  lcLabel,
} from "./courseTheme";
import { downloadLectureEngagementExcel } from "./utils/exportLectureEngagementExcel";
import { downloadLectureEngagementPdf } from "./utils/exportLectureEngagementPdf";

function mergeGroups(...lists) {
  const map = new Map();
  lists.flat().forEach((g) => {
    const id = Number(g?.id ?? g?.group_id ?? g?.groupId);
    if (!Number.isFinite(id) || id <= 0) return;
    const name = g?.name || g?.group_name || g?.groupName || `مجموعة #${id}`;
    if (!map.has(id)) map.set(id, { id, name });
  });
  return [...map.values()].sort((a, b) =>
    String(a.name).localeCompare(String(b.name), "ar"),
  );
}

function pct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 10000) / 100;
}

function computeStats(students) {
  const totalStudents = students.length;
  let completed = 0;
  let partiallyCompleted = 0;
  let started = 0;
  let notStarted = 0;
  for (const s of students) {
    if (s.status === "COMPLETED") completed += 1;
    else if (s.status === "PARTIALLY_COMPLETED") partiallyCompleted += 1;
    else if (s.status === "STARTED") started += 1;
    else notStarted += 1;
  }
  return {
    totalStudents,
    completed,
    partiallyCompleted,
    started,
    notStarted,
    completedPercentage: pct(completed, totalStudents),
    partiallyCompletedPercentage: pct(partiallyCompleted, totalStudents),
    startedPercentage: pct(started, totalStudents),
    notStartedPercentage: pct(notStarted, totalStudents),
  };
}

function compareStudents(a, b, sortKey, order) {
  const dir = order === "asc" ? 1 : -1;
  const av = a?.[sortKey];
  const bv = b?.[sortKey];
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;
  if (sortKey === "lastWatchedAt" || sortKey === "lectureOpenedAt") {
    return (new Date(av).getTime() - new Date(bv).getTime()) * dir;
  }
  if (typeof av === "number" || typeof bv === "number") {
    return ((Number(av) || 0) - (Number(bv) || 0)) * dir;
  }
  return String(av).localeCompare(String(bv), "ar") * dir;
}

function studentMatchesSearch(student, q) {
  if (!q) return true;
  const hay = [
    student.name,
    student.studentCode,
    student.phone,
    student.parentPhone,
    student.email,
    student.group?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

const NAV_OFFSET = { base: "72px", md: "88px" };

const STATUS_FILTERS = [
  { value: "", label: "كل الحالات" },
  { value: "COMPLETED", label: "مكتمل" },
  { value: "PARTIALLY_COMPLETED", label: "جزئي" },
  { value: "STARTED", label: "بدأ" },
  { value: "NOT_STARTED", label: "لم يبدأ" },
];

const SORT_OPTIONS = [
  { value: "watchPercentage", label: "نسبة المشاهدة" },
  { value: "lastWatchedAt", label: "آخر مشاهدة" },
  { value: "name", label: "الاسم" },
  { value: "studentCode", label: "كود الطالب" },
  { value: "watchedVideos", label: "عدد الفيديوهات" },
];

/** نطاقات نسبة المشاهدة — تُترجم إلى min/max في الـ API */
const WATCH_RANGE_OPTIONS = [
  { value: "", label: "كل نسب المشاهدة", min: undefined, max: undefined },
  { value: "0", label: "0% (بدون مشاهدة)", min: 0, max: 0 },
  { value: "1-25", label: "1% – 25%", min: 1, max: 25 },
  { value: "26-50", label: "26% – 50%", min: 26, max: 50 },
  { value: "51-75", label: "51% – 75%", min: 51, max: 75 },
  { value: "76-99", label: "76% – 99%", min: 76, max: 99 },
  { value: "100", label: "100% (مكتمل)", min: 100, max: 100 },
  { value: "lt50", label: "أقل من 50%", min: 0, max: 49.99 },
  { value: "gte50", label: "50% فأكثر", min: 50, max: 100 },
];

function watchRangeFromParams(minRaw, maxRaw) {
  const min = minRaw === "" || minRaw == null ? undefined : Number(minRaw);
  const max = maxRaw === "" || maxRaw == null ? undefined : Number(maxRaw);
  const match = WATCH_RANGE_OPTIONS.find((opt) => {
    if (opt.value === "") return min == null && max == null;
    const minOk =
      (opt.min == null && min == null) ||
      (opt.min != null && min != null && Number(opt.min) === Number(min));
    const maxOk =
      (opt.max == null && max == null) ||
      (opt.max != null && max != null && Number(opt.max) === Number(max));
    return minOk && maxOk;
  });
  return match?.value || (min != null || max != null ? "custom" : "");
}

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

function formatDuration(seconds) {
  const total = Number(seconds) || 0;
  if (total <= 0) return "—";
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}س ${m}د`;
  return `${m} دقيقة`;
}

function StatCard({ label, count, percent, colorScheme, active, onClick }) {
  const bg = useColorModeValue(`${colorScheme}.50`, "whiteAlpha.100");
  const trackBg = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const activeBorder = `${colorScheme}.400`;

  return (
    <Box
      as={onClick ? "button" : "div"}
      type={onClick ? "button" : undefined}
      textAlign="right"
      className={crCard}
      p={4}
      bg={bg}
      borderWidth="2px"
      borderColor={active ? activeBorder : "transparent"}
      cursor={onClick ? "pointer" : "default"}
      transition="all 0.15s"
      _hover={onClick ? { borderColor: activeBorder, transform: "translateY(-1px)" } : undefined}
      onClick={onClick}
      w="full"
    >
      <Text fontSize="xs" fontWeight="600" color="gray.500" mb={1}>
        {label}
      </Text>
      <HStack justify="space-between" align="baseline" mb={2}>
        <Text fontSize="2xl" fontWeight="800" lineHeight="1">
          {count ?? 0}
        </Text>
        <Badge colorScheme={colorScheme} borderRadius="md">
          {percent ?? 0}%
        </Badge>
      </HStack>
      <Progress
        value={Number(percent) || 0}
        size="sm"
        borderRadius="full"
        colorScheme={colorScheme}
        bg={trackBg}
      />
    </Box>
  );
}

function StatusBadge({ status }) {
  const meta = ENGAGEMENT_STATUS_META[status] || {
    label: status || "—",
    colorScheme: "gray",
  };
  return (
    <Badge colorScheme={meta.colorScheme} borderRadius="md" px={2} py={0.5}>
      {meta.label}
    </Badge>
  );
}

function StudentMobileCard({ student }) {
  const border = useColorModeValue("gray.200", "gray.700");
  const bg = useColorModeValue("white", "gray.800");

  return (
    <Box borderWidth="1px" borderColor={border} borderRadius="xl" bg={bg} p={4}>
      <Flex justify="space-between" gap={3} mb={3}>
        <Box minW={0}>
          <Text fontWeight="800" noOfLines={1}>
            {student.name}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {student.studentCode || "بدون كود"}
            {student.group?.name ? ` · ${student.group.name}` : ""}
          </Text>
        </Box>
        <StatusBadge status={student.status} />
      </Flex>

      <HStack justify="space-between" mb={1}>
        <Text fontSize="xs" color="gray.500">
          المشاهدة
        </Text>
        <Text fontSize="sm" fontWeight="700">
          {student.watchPercentage ?? 0}% · {student.watchedVideos ?? 0}/
          {student.totalVideos ?? 0}
        </Text>
      </HStack>
      <Progress
        value={Number(student.watchPercentage) || 0}
        size="sm"
        borderRadius="full"
        colorScheme={
          student.status === "COMPLETED"
            ? "green"
            : student.status === "PARTIALLY_COMPLETED"
              ? "orange"
              : student.status === "STARTED"
                ? "blue"
                : "gray"
        }
        mb={3}
      />

      <SimpleGrid columns={2} spacing={2} fontSize="xs" color="gray.500">
        <Text>آخر مشاهدة: {formatDateTime(student.lastWatchedAt)}</Text>
        <Text>مدة المشاهدة: {formatDuration(student.totalWatchDurationSeconds)}</Text>
        <Text>اكتمال فيديوهات: {student.completedVideos ?? 0}</Text>
        <Text>
          فتح المحاضرة: {student.hasOpenedLecture ? formatDateTime(student.lectureOpenedAt) : "لا"}
        </Text>
        {student.phone ? (
          <HStack spacing={1}>
            <Icon as={FaPhone} boxSize={2.5} />
            <Text dir="ltr">{student.phone}</Text>
          </HStack>
        ) : null}
        {student.parentPhone ? (
          <Text dir="ltr">ولي الأمر: {student.parentPhone}</Text>
        ) : null}
      </SimpleGrid>
    </Box>
  );
}

export default function LectureEngagementReportPage() {
  const { lectureId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [, isAdmin, isTeacher, , , isAcademyTeacher] = UserType();
  const canView = isTeacher || isAcademyTeacher || isAdmin;

  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") || "";
  const sort = searchParams.get("sort") || "watchPercentage";
  const order = searchParams.get("order") || "desc";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Number(searchParams.get("limit")) || 50;
  const searchFromUrl = searchParams.get("search") || "";
  const groupId = searchParams.get("groupId") || "";
  const minWatchRaw = searchParams.get("minWatchPercentage");
  const maxWatchRaw = searchParams.get("maxWatchPercentage");
  const watchRange = watchRangeFromParams(minWatchRaw, maxWatchRaw);

  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lecture, setLecture] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [exportingKind, setExportingKind] = useState(null);
  const abortRef = useRef(null);
  const groupsLoadedRef = useRef(false);

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const tableHeadBg = useColorModeValue("gray.50", "gray.750");
  const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const inputBg = useColorModeValue("gray.50", "gray.900");

  const minWatch =
    minWatchRaw === null || minWatchRaw === "" ? undefined : Number(minWatchRaw);
  const maxWatch =
    maxWatchRaw === null || maxWatchRaw === "" ? undefined : Number(maxWatchRaw);

  const patchParams = useCallback(
    (partial) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(partial).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") next.delete(key);
        else next.set(key, String(value));
      });
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  // بحث محلي فوري (بدون انتظار السيرفر)
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== searchFromUrl) {
        patchParams({ search: searchInput.trim() || undefined, page: 1 });
      }
    }, 150);
    return () => clearTimeout(t);
  }, [searchInput, searchFromUrl, patchParams]);

  const loadAllStudents = useCallback(
    async ({ soft = false } = {}) => {
      if (!lectureId) return;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        if (soft) setRefreshing(true);
        else setLoading(true);

        // تحميل كل الطلاب مرة واحدة بدون فلاتر — الفلترة تتم محلياً فوراً
        const first = await fetchLectureEngagementReport(lectureId, {
          page: 1,
          limit: 200,
          sort: "watchPercentage",
          order: "desc",
          includeGroups: !groupsLoadedRef.current,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setLecture(first?.lecture || null);
        let merged = Array.isArray(first?.students) ? [...first.students] : [];
        const total = Number(first?.pagination?.total) || merged.length;
        const totalPages = Math.max(
          1,
          Number(first?.pagination?.totalPages) || Math.ceil(total / 200) || 1,
        );

        // صفحات إضافية في الخلفية إن وُجدت
        if (totalPages > 1) {
          for (let p = 2; p <= totalPages; p += 1) {
            if (controller.signal.aborted) return;
            const chunk = await fetchLectureEngagementReport(lectureId, {
              page: p,
              limit: 200,
              sort: "watchPercentage",
              order: "desc",
              includeGroups: false,
              signal: controller.signal,
            });
            if (controller.signal.aborted) return;
            merged = merged.concat(chunk?.students || []);
          }
        }

        // إزالة تكرار إن وُجد
        const byId = new Map();
        merged.forEach((s) => {
          if (s?.studentId != null) byId.set(s.studentId, s);
        });
        const unique = [...byId.values()];
        setAllStudents(unique);

        const fromApi = Array.isArray(first?.filters?.groups) ? first.filters.groups : [];
        const fromStudents = unique.map((s) => s?.group).filter((g) => g?.id != null);
        const studentFacing = mergeGroups(fromApi, fromStudents);
        if (studentFacing.length > 0) {
          setGroups(studentFacing);
          groupsLoadedRef.current = true;
        } else if (!groupsLoadedRef.current) {
          const [courseGroups, studyGroups] = await Promise.all([
            fetchTeacherCourseGroups().catch(() => []),
            fetchTeacherStudyGroups().catch(() => []),
          ]);
          if (!controller.signal.aborted) {
            setGroups(mergeGroups(courseGroups, studyGroups));
            groupsLoadedRef.current = true;
          }
        }
      } catch (err) {
        if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError" || err?.name === "AbortError") {
          return;
        }
        setAllStudents([]);
        setLecture(null);
        toast({
          title: "فشل تحميل التقرير",
          description: lectureEngagementErrorMessage(err),
          status: "error",
          duration: 4500,
          isClosable: true,
        });
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [lectureId, toast],
  );

  useEffect(() => {
    if (!canView) return undefined;
    groupsLoadedRef.current = false;
    loadAllStudents();
    return () => abortRef.current?.abort();
  }, [canView, lectureId, loadAllStudents]);

  // فلترة + ترتيب محلي فوري (بدون طلب شبكة)
  const filteredStudents = useMemo(() => {
    const q = (searchFromUrl || "").trim().toLowerCase();
    let list = allStudents;

    if (groupId) {
      list = list.filter((s) => String(s.group?.id) === String(groupId));
    }
    if (status) {
      list = list.filter((s) => s.status === status);
    }
    if (Number.isFinite(minWatch)) {
      list = list.filter((s) => Number(s.watchPercentage) >= minWatch);
    }
    if (Number.isFinite(maxWatch)) {
      list = list.filter((s) => Number(s.watchPercentage) <= maxWatch);
    }
    if (q) {
      list = list.filter((s) => studentMatchesSearch(s, q));
    }

    const sortKey =
      sort === "name"
        ? "name"
        : sort === "studentCode"
          ? "studentCode"
          : sort === "lastWatchedAt"
            ? "lastWatchedAt"
            : sort === "watchedVideos"
              ? "watchedVideos"
              : "watchPercentage";

    return [...list].sort((a, b) => {
      const primary = compareStudents(a, b, sortKey, order);
      if (primary !== 0) return primary;
      return String(a.name || "").localeCompare(String(b.name || ""), "ar");
    });
  }, [
    allStudents,
    groupId,
    status,
    minWatch,
    maxWatch,
    searchFromUrl,
    sort,
    order,
  ]);

  // الإحصائيات تتأثر بالمجموعة/البحث فقط (مثل الـ API)
  const stats = useMemo(() => {
    const q = (searchFromUrl || "").trim().toLowerCase();
    let base = allStudents;
    if (groupId) {
      base = base.filter((s) => String(s.group?.id) === String(groupId));
    }
    if (q) {
      base = base.filter((s) => studentMatchesSearch(s, q));
    }
    return computeStats(base);
  }, [allStudents, groupId, searchFromUrl]);

  const totalFiltered = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / limit) || 1);
  const safePage = Math.min(page, totalPages);
  const students = useMemo(() => {
    const start = (safePage - 1) * limit;
    return filteredStudents.slice(start, start + limit);
  }, [filteredStudents, safePage, limit]);

  const pagination = {
    page: safePage,
    limit,
    total: totalFiltered,
    totalPages,
  };

  // لو الصفحة الحالية أكبر من المتاح بعد الفلترة، رجّع للأولى
  useEffect(() => {
    if (page > totalPages) {
      patchParams({ page: 1 });
    }
  }, [page, totalPages, patchParams]);

  const filterSummary = useMemo(() => {
    const parts = [];
    if (groupId) {
      const g = groups.find((item) => String(item.id) === String(groupId));
      parts.push(`مجموعة: ${g?.name || groupId}`);
    }
    if (status) {
      parts.push(`حالة: ${ENGAGEMENT_STATUS_META[status]?.label || status}`);
    }
    if (watchRange) {
      const label =
        WATCH_RANGE_OPTIONS.find((o) => o.value === watchRange)?.label ||
        `مشاهدة ${minWatchRaw ?? "?"}–${maxWatchRaw ?? "?"}%`;
      parts.push(label);
    }
    if (searchFromUrl) parts.push(`بحث: ${searchFromUrl}`);
    return parts.join(" · ") || "بدون فلاتر";
  }, [
    groupId,
    groups,
    status,
    watchRange,
    minWatchRaw,
    maxWatchRaw,
    searchFromUrl,
  ]);

  const handleExport = async (kind) => {
    if (!filteredStudents.length) {
      toast({
        title: "لا يوجد طلاب للتنزيل",
        description: "عدّل الفلاتر أو تأكد أن التقرير يحتوي على بيانات.",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    setExportingKind(kind);
    try {
      const payload = {
        students: filteredStudents,
        lectureTitle: lecture?.title || "تقرير تفاعل المحاضرة",
        courseTitle: lecture?.courseTitle || "",
        filterSummary,
        filename: `تقرير-تفاعل-${lecture?.title || lectureId}`,
      };
      const ok =
        kind === "pdf"
          ? await downloadLectureEngagementPdf(payload)
          : downloadLectureEngagementExcel(payload);
      if (ok) {
        toast({
          title: kind === "pdf" ? "تم تنزيل ملف PDF" : "تم تنزيل ملف Excel",
          description: `${filteredStudents.length} طالب · ${filterSummary}`,
          status: "success",
          duration: 3500,
        });
      }
    } catch (err) {
      toast({
        title: "تعذر التنزيل",
        description: err?.message || "حدث خطأ أثناء إنشاء الملف",
        status: "error",
        duration: 4000,
      });
    } finally {
      setExportingKind(null);
    }
  };

  const courseBackPath = useMemo(() => {
    const courseId = lecture?.courseId;
    return courseId ? `/CourseDetailsPage/${courseId}` : -1;
  }, [lecture?.courseId]);

  if (!canView) return null;
  if (loading && allStudents.length === 0) return <BrandLoadingScreen />;

  return (
    <Box className={crPageBg} minH="100dvh" pt={NAV_OFFSET} pb={10} dir="rtl" bg={pageBg}>
      <Box className={crContainer} maxW="7xl" mx="auto" px={{ base: 3, md: 6 }} py={{ base: 4, md: 6 }}>
        <HStack mb={5} spacing={3} align="start">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon as={FaArrowRight} />}
            onClick={() =>
              typeof courseBackPath === "string"
                ? navigate(courseBackPath)
                : navigate(-1)
            }
          >
            رجوع
          </Button>
          <Box flex={1} minW={0}>
            <span className={crEyebrow}>
              <Icon as={FaChartBar} />
              تقرير تفاعل المحاضرة
            </span>
            <Text className={crHeading} mt={2} fontSize={{ base: "xl", md: "2xl" }} fontWeight="800">
              {lecture?.title || "تقرير المحاضرة"}
            </Text>
            <HStack mt={1} spacing={2} flexWrap="wrap" className={lcLabel}>
              {lecture?.courseTitle ? <Text>{lecture.courseTitle}</Text> : null}
              {lecture?.totalVideos != null ? (
                <Badge colorScheme="blue" variant="subtle">
                  {lecture.totalVideos} فيديو
                </Badge>
              ) : null}
              {stats?.totalStudents != null ? (
                <Badge colorScheme="purple" variant="subtle">
                  {stats.totalStudents} طالب
                </Badge>
              ) : null}
            </HStack>
          </Box>
          <HStack spacing={2} flexShrink={0}>
            <Button
              size="sm"
              colorScheme="green"
              leftIcon={<Icon as={FaFileExcel} />}
              borderRadius="lg"
              onClick={() => handleExport("excel")}
              isLoading={exportingKind === "excel"}
              isDisabled={!filteredStudents.length || loading || Boolean(exportingKind)}
              fontWeight="700"
            >
              Excel
            </Button>
            <Button
              size="sm"
              colorScheme="red"
              leftIcon={<Icon as={FaFilePdf} />}
              borderRadius="lg"
              onClick={() => handleExport("pdf")}
              isLoading={exportingKind === "pdf"}
              isDisabled={!filteredStudents.length || loading || Boolean(exportingKind)}
              fontWeight="700"
            >
              PDF
            </Button>
            <IconButton
              aria-label="تحديث"
              icon={<Icon as={FaSync} />}
              variant="outline"
              borderRadius="lg"
              onClick={() => loadAllStudents({ soft: true })}
              isLoading={refreshing}
              isDisabled={Boolean(exportingKind)}
            />
          </HStack>
        </HStack>

        {stats ? (
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={5}>
            <StatCard
              label="مكتمل"
              count={stats.completed}
              percent={stats.completedPercentage}
              colorScheme="green"
              active={status === "COMPLETED"}
              onClick={() =>
                patchParams({
                  status: status === "COMPLETED" ? undefined : "COMPLETED",
                  page: 1,
                })
              }
            />
            <StatCard
              label="جزئي"
              count={stats.partiallyCompleted}
              percent={stats.partiallyCompletedPercentage}
              colorScheme="orange"
              active={status === "PARTIALLY_COMPLETED"}
              onClick={() =>
                patchParams({
                  status: status === "PARTIALLY_COMPLETED" ? undefined : "PARTIALLY_COMPLETED",
                  page: 1,
                })
              }
            />
            <StatCard
              label="بدأ"
              count={stats.started}
              percent={stats.startedPercentage}
              colorScheme="blue"
              active={status === "STARTED"}
              onClick={() =>
                patchParams({
                  status: status === "STARTED" ? undefined : "STARTED",
                  page: 1,
                })
              }
            />
            <StatCard
              label="لم يبدأ"
              count={stats.notStarted}
              percent={stats.notStartedPercentage}
              colorScheme="gray"
              active={status === "NOT_STARTED"}
              onClick={() =>
                patchParams({
                  status: status === "NOT_STARTED" ? undefined : "NOT_STARTED",
                  page: 1,
                })
              }
            />
          </SimpleGrid>
        ) : null}

        <Box
          bg={cardBg}
          borderWidth="1px"
          borderColor={border}
          borderRadius="2xl"
          p={{ base: 3, md: 4 }}
          mb={4}
        >
          <Flex
            gap={3}
            direction={{ base: "column", md: "row" }}
            align={{ base: "stretch", md: "center" }}
            flexWrap="wrap"
          >
            <InputGroup maxW={{ md: "260px" }} flex={1}>
              <InputRightElement pointerEvents="none">
                <Icon as={FaSearch} color="gray.400" />
              </InputRightElement>
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="بحث بالاسم أو الكود أو الهاتف"
                borderRadius="lg"
                bg={inputBg}
                pe={10}
              />
            </InputGroup>

            <Select
              value={groupId}
              onChange={(e) =>
                patchParams({ groupId: e.target.value || undefined, page: 1 })
              }
              maxW={{ md: "200px" }}
              borderRadius="lg"
            >
              <option value="">كل المجموعات</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>

            <Select
              value={status}
              onChange={(e) => patchParams({ status: e.target.value || undefined, page: 1 })}
              maxW={{ md: "180px" }}
              borderRadius="lg"
            >
              {STATUS_FILTERS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>

            <Select
              value={watchRange === "custom" ? "" : watchRange}
              onChange={(e) => {
                const opt = WATCH_RANGE_OPTIONS.find((o) => o.value === e.target.value);
                patchParams({
                  minWatchPercentage: opt?.min != null ? opt.min : undefined,
                  maxWatchPercentage: opt?.max != null ? opt.max : undefined,
                  page: 1,
                });
              }}
              maxW={{ md: "200px" }}
              borderRadius="lg"
            >
              {WATCH_RANGE_OPTIONS.map((opt) => (
                <option key={opt.value || "all-watch"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>

            <Select
              value={sort}
              onChange={(e) => patchParams({ sort: e.target.value, page: 1 })}
              maxW={{ md: "180px" }}
              borderRadius="lg"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>

            <Select
              value={order}
              onChange={(e) => patchParams({ order: e.target.value, page: 1 })}
              maxW={{ md: "140px" }}
              borderRadius="lg"
            >
              <option value="desc">تنازلي</option>
              <option value="asc">تصاعدي</option>
            </Select>
          </Flex>

          {(groupId || status || watchRange) && (
            <HStack mt={3} spacing={2} flexWrap="wrap">
              {groupId ? (
                <Badge colorScheme="purple" borderRadius="md" px={2} py={1}>
                  مجموعة: {groups.find((g) => String(g.id) === String(groupId))?.name || groupId}
                </Badge>
              ) : null}
              {status ? (
                <Badge colorScheme="blue" borderRadius="md" px={2} py={1}>
                  {ENGAGEMENT_STATUS_META[status]?.label || status}
                </Badge>
              ) : null}
              {watchRange ? (
                <Badge colorScheme="orange" borderRadius="md" px={2} py={1}>
                  {WATCH_RANGE_OPTIONS.find((o) => o.value === watchRange)?.label ||
                    `مشاهدة ${minWatchRaw ?? "?"}–${maxWatchRaw ?? "?"}%`}
                </Badge>
              ) : null}
              <Button
                size="xs"
                variant="ghost"
                onClick={() =>
                  patchParams({
                    groupId: undefined,
                    status: undefined,
                    minWatchPercentage: undefined,
                    maxWatchPercentage: undefined,
                    page: 1,
                  })
                }
              >
                مسح الفلاتر
              </Button>
            </HStack>
          )}
        </Box>

        {!loading && allStudents.length === 0 ? (
          <Center py={16} flexDir="column" gap={3}>
            <Icon as={FaUserGraduate} boxSize={10} color="gray.400" />
            <Text color={muted}>لا توجد بيانات للعرض</Text>
            <Button onClick={() => loadAllStudents()}>إعادة المحاولة</Button>
          </Center>
        ) : students.length === 0 ? (
          <Center py={16} flexDir="column" gap={3} className={crCard} bg={cardBg}>
            <Icon as={FaCheckCircle} boxSize={10} color="gray.400" />
            <Text color={muted} fontSize="sm">
              لا يوجد طلاب مطابقون للفلاتر الحالية
            </Text>
          </Center>
        ) : (
          <>
            {/* Mobile cards */}
            <VStack display={{ base: "flex", lg: "none" }} align="stretch" spacing={3}>
              {students.map((student) => (
                <StudentMobileCard key={student.studentId} student={student} />
              ))}
            </VStack>

            {/* Desktop table */}
            <Box
              display={{ base: "none", lg: "block" }}
              bg={cardBg}
              borderWidth="1px"
              borderColor={border}
              borderRadius="2xl"
              overflow="hidden"
            >
              <Box overflowX="auto">
                <Table size="sm" variant="simple">
                  <Thead bg={tableHeadBg}>
                    <Tr>
                      <Th textAlign="right">الطالب</Th>
                      <Th textAlign="right">المجموعة</Th>
                      <Th textAlign="right">الحالة</Th>
                      <Th textAlign="right">المشاهدة</Th>
                      <Th textAlign="right">الفيديوهات</Th>
                      <Th textAlign="right">المدة</Th>
                      <Th textAlign="right">آخر مشاهدة</Th>
                      <Th textAlign="right">الهاتف</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {students.map((student) => (
                      <Tr key={student.studentId} _hover={{ bg: rowHoverBg }}>
                        <Td>
                          <Text fontWeight="700">{student.name}</Text>
                          <Text fontSize="xs" color={muted}>
                            {student.studentCode || "—"}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">{student.group?.name || "—"}</Text>
                        </Td>
                        <Td>
                          <StatusBadge status={student.status} />
                        </Td>
                        <Td minW="140px">
                          <Text fontWeight="700" mb={1}>
                            {student.watchPercentage ?? 0}%
                          </Text>
                          <Progress
                            value={Number(student.watchPercentage) || 0}
                            size="xs"
                            borderRadius="full"
                            colorScheme="blue"
                          />
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {student.watchedVideos ?? 0}/{student.totalVideos ?? 0}
                          </Text>
                          <Text fontSize="xs" color={muted}>
                            مكتمل: {student.completedVideos ?? 0}
                          </Text>
                        </Td>
                        <Td>
                          <HStack spacing={1} fontSize="sm">
                            <Icon as={FaClock} color="gray.400" boxSize={3} />
                            <Text>{formatDuration(student.totalWatchDurationSeconds)}</Text>
                          </HStack>
                        </Td>
                        <Td>
                          <Text fontSize="xs">{formatDateTime(student.lastWatchedAt)}</Text>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={0.5} fontSize="xs">
                            {student.phone ? (
                              <Text dir="ltr">{student.phone}</Text>
                            ) : (
                              <Text color={muted}>—</Text>
                            )}
                            {student.parentPhone ? (
                              <Text dir="ltr" color={muted}>
                                ولي: {student.parentPhone}
                              </Text>
                            ) : null}
                          </VStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </Box>

            {pagination && pagination.totalPages > 1 ? (
              <Flex mt={4} justify="space-between" align="center" flexWrap="wrap" gap={3}>
                <Text fontSize="sm" color={muted} className={lcCaption}>
                  صفحة {pagination.page} من {pagination.totalPages} · {pagination.total} طالب
                </Text>
                <HStack>
                  <Button
                    size="sm"
                    variant="outline"
                    isDisabled={page <= 1}
                    onClick={() => patchParams({ page: page - 1 })}
                  >
                    السابق
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    isDisabled={page >= pagination.totalPages}
                    onClick={() => patchParams({ page: page + 1 })}
                  >
                    التالي
                  </Button>
                </HStack>
              </Flex>
            ) : pagination ? (
              <Text mt={4} fontSize="sm" color={muted} textAlign="center">
                {pagination.total} طالب
              </Text>
            ) : null}
          </>
        )}

        {lecture?.courseId ? (
          <Center mt={8}>
            <Button
              as={Link}
              to={`/CourseDetailsPage/${lecture.courseId}`}
              variant="ghost"
              size="sm"
              color={muted}
            >
              العودة إلى صفحة الكورس
            </Button>
          </Center>
        ) : null}
      </Box>
    </Box>
  );
}
