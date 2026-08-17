import { Link } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Icon,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FaCheckCircle, FaCog, FaEdit, FaPen, FaPlus, FaTasks, FaTrash, FaChartBar } from "react-icons/fa";
import { buildExamReportPath } from "../../exam/utils/examReportUtils";
import { crEyebrowOrange, crSubheading, lcBadge, lcBtn, lcCaption, lcLabel, lcRoot, lcTitleSm } from "../courseTheme";

function getExamStatus(exam) {
  if (!exam) return null;
  if (exam.is_solved) {
    return { label: "تم الحل", tone: "done", cta: "عرض النتيجة", icon: FaCheckCircle };
  }
  if (exam.in_progress || exam.is_started) {
    return { label: "قيد التنفيذ", tone: "active", cta: "متابعة الواجب", icon: FaPen };
  }
  return { label: "لم يُبدأ", tone: "idle", cta: "ابدأ الواجب", icon: FaPen };
}

function CourseAssignmentRow({
  exam,
  canManage,
  examActionLoading,
  onEdit,
  onDelete,
  label = "واجب الكورس",
}) {
  if (!exam) return null;

  const examStatus = getExamStatus(exam);
  const StatusIcon = examStatus?.icon || FaPen;
  const solved = exam.is_solved;
  const inProgress = exam.in_progress || exam.is_started;

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-orange-300 sm:flex-row sm:items-center sm:gap-3 sm:px-3.5 sm:py-2.5 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-orange-700"
      dir="rtl"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white sm:h-8 sm:w-8 ${
            solved ? "bg-emerald-500" : "bg-orange-500"
          }`}
        >
          <StatusIcon className="text-xs" />
        </span>

        <div className="min-w-0 flex-1 text-right">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
            <h5 className={`break-words ${lcTitleSm} !text-sm sm:truncate`}>
              {exam.title || label}
            </h5>
            {!canManage && examStatus ? (
              <span
                className={`w-fit shrink-0 rounded-full px-2 py-0.5 ${lcBadge} ${
                  solved
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : inProgress
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {examStatus.label}
              </span>
            ) : null}
          </div>
          <p className={`mt-0.5 break-words ${lcCaption}`}>
            {canManage
              ? `الدرجة: ${exam.total_grade ?? "—"} • المدة: ${exam.duration ?? "—"} دقيقة${exam.is_visible === false ? " • مخفي" : ""}`
              : exam.student_submission?.score != null
                ? `درجتك: ${exam.student_submission.score}`
                : null}
          </p>
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end sm:gap-1.5">
        {!canManage ? (
          <Link
            to={`/ComprehensiveExam/${exam.id}`}
            className={`inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 sm:w-auto sm:py-1.5 ${lcBtn} text-white transition-colors ${
              inProgress && !solved
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            <StatusIcon className="text-[10px]" />
            {examStatus.cta}
          </Link>
        ) : (
          <>
            <Link
              to={`/ComprehensiveExam/${exam.id}`}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-blue-500 px-3 py-2.5 text-xs font-bold text-blue-500 transition-colors hover:bg-blue-50 sm:w-auto sm:py-1.5 dark:hover:bg-blue-950/40"
            >
              <FaCog className="text-[10px]" />
              إدارة الأسئلة
            </Link>
            <Link
              to={buildExamReportPath(exam.id, { from: "lecture" })}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-indigo-500 px-3 py-2.5 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-50 sm:w-auto sm:py-1.5 dark:hover:bg-indigo-950/40"
            >
              <FaChartBar className="text-[10px]" />
              التقرير
            </Link>
            <button
              type="button"
              className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-blue-500 px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-600 sm:w-auto sm:py-1.5"
              onClick={() => onEdit?.(exam)}
            >
              <FaEdit className="text-[10px]" />
              تعديل
            </button>
            <button
              type="button"
              aria-label="حذف الواجب"
              className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50 sm:h-auto sm:w-auto dark:hover:bg-red-950/40"
              disabled={examActionLoading}
              onClick={() => onDelete?.(exam)}
            >
              {examActionLoading ? <Spinner size="sm" /> : <FaTrash className="text-xs" />}
              <span className="ms-1.5 text-xs font-bold sm:hidden">حذف</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function CourseAssignmentsTab({
  assignments = [],
  loading = false,
  isTeacher,
  isAdmin,
  examActionLoading = false,
  onAddAssignment,
  onEditAssignment,
  onDeleteAssignment,
}) {
  const canManage = isTeacher || isAdmin;
  const count = assignments.length;

  const openAdd = () => {
    onAddAssignment?.({
      title: `واجب ${count + 1}`,
      type: "assignment",
      total_grade: 20,
      duration: 60,
      is_visible: true,
      show_answers_immediately: true,
      show_answers_after_hours: 0,
    });
  };

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
            className="absolute right-0 top-1 hidden h-[calc(100%-6px)] w-1 rounded-full bg-gradient-to-b from-orange-500 to-amber-500 sm:block"
            aria-hidden
          />
          <span className={crEyebrowOrange}>محتوى الكورس</span>
          <h2 className={`${crSubheading} mt-2.5 text-xl tracking-tight md:text-2xl`}>
            واجبات الكورس
          </h2>
          <p className={`mt-2 max-w-md ${lcLabel}`}>
            واجبات مستقلة عن المحاضرات — نفس إعدادات واجب المحاضرة
          </p>
        </div>

        <HStack spacing={2} flexShrink={0} alignSelf={{ base: "flex-start", sm: "center" }}>
          <Badge colorScheme="orange" borderRadius="full" px={3} py={1} fontSize="xs" fontWeight="semibold">
            {count.toLocaleString("ar-EG")} واجب
          </Badge>
          {canManage ? (
            <Button
              size="sm"
              colorScheme="orange"
              borderRadius="xl"
              leftIcon={<Icon as={FaPlus} />}
              onClick={openAdd}
            >
              إضافة واجب
            </Button>
          ) : null}
        </HStack>
      </Flex>

      {loading ? (
        <Center py={12}>
          <Spinner size="lg" color="orange.500" thickness="3px" />
        </Center>
      ) : count === 0 ? (
        <Center py={10} flexDir="column" gap={3} textAlign="center">
          <Box className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-500 dark:bg-orange-950/40">
            <FaTasks className="text-2xl" />
          </Box>
          <Text color="gray.500" fontSize="sm">
            {canManage
              ? "لم تُضف واجبات كورس بعد — ابدأ بإضافة أول واجب"
              : "لا توجد واجبات متاحة حالياً"}
          </Text>
          {canManage ? (
            <Button colorScheme="orange" borderRadius="xl" leftIcon={<Icon as={FaPlus} />} onClick={openAdd}>
              إضافة واجب
            </Button>
          ) : null}
        </Center>
      ) : (
        <VStack align="stretch" spacing={3}>
          {assignments.map((assignment) => (
            <CourseAssignmentRow
              key={assignment.id}
              exam={assignment}
              canManage={canManage}
              examActionLoading={examActionLoading}
              onEdit={onEditAssignment}
              onDelete={(exam) =>
                onDeleteAssignment?.(exam.id, exam.title || "واجب الكورس")
              }
            />
          ))}
        </VStack>
      )}
    </VStack>
  );
}
