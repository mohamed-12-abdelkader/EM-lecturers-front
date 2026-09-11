export const EVENT_TYPE_META = {
  VIDEO_WATCH: { label: "مشاهدة فيديو", tone: "blue" },
  EXAM_START: { label: "بدء امتحان", tone: "orange" },
  ASSIGNMENT_START: { label: "بدء واجب", tone: "orange" },
  EXAM_SCORE: { label: "درجة امتحان", tone: "green" },
  ASSIGNMENT_SCORE: { label: "درجة واجب", tone: "green" },
  MANUAL_REWARD: { label: "مكافأة يدوية", tone: "purple" },
  LIVE_ATTENDANCE: { label: "حضور لايف", tone: "blue" },
  COURSE_COMPLETION: { label: "إكمال كورس", tone: "green" },
  DAILY_LOGIN: { label: "تسجيل دخول يومي", tone: "gray" },
  CONTEST_WIN: { label: "فوز بمسابقة", tone: "orange" },
};

export function eventTypeLabel(type) {
  return EVENT_TYPE_META[type]?.label || type || "عملية";
}

export function eventTypeTone(type) {
  return EVENT_TYPE_META[type]?.tone || "gray";
}

export function formatPointsDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function transactionDetail(tx) {
  const meta = tx?.metadata || {};
  return (
    meta.reason ||
    meta.title ||
    meta.lectureTitle ||
    meta.lecture_title ||
    meta.examTitle ||
    meta.exam_title ||
    ""
  );
}

export function rankMedal(rank) {
  if (rank === 1) return { bg: "orange.500", label: "الأول" };
  if (rank === 2) return { bg: "gray.400", label: "الثاني" };
  if (rank === 3) return { bg: "orange.300", label: "الثالث" };
  return { bg: "blue.500", label: `#${rank}` };
}

export function optionId(item) {
  return item?.id ?? item?.grade_id ?? item?.group_id ?? item?.gradeId ?? item?.groupId;
}

export function optionLabel(item, fallback = "عنصر") {
  return (
    item?.name ||
    item?.title ||
    item?.grade_name ||
    item?.gradeName ||
    item?.group_name ||
    item?.groupName ||
    fallback
  );
}
