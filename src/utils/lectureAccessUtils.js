export const ACCESS_STATUS_META = {
  open: {
    label: "مفتوح",
    badgeClass: "bg-blue-50 text-blue-600",
    tone: "open",
  },
  locked: {
    label: "مغلق",
    badgeClass: "bg-slate-100 text-slate-600",
    tone: "locked",
  },
  expired: {
    label: "انتهت المدة",
    badgeClass: "bg-red-50 text-red-600",
    tone: "expired",
  },
  requires_activation_code: {
    label: "يحتاج كود",
    badgeClass: "bg-purple-50 text-purple-600",
    tone: "activation",
  },
  activated: {
    label: "مفعّل",
    badgeClass: "bg-emerald-50 text-emerald-600",
    tone: "activated",
  },
  activation_expired: {
    label: "انتهى التفعيل",
    badgeClass: "bg-orange-50 text-orange-600",
    tone: "activation_expired",
  },
  not_enrolled: {
    label: "غير مشترك",
    badgeClass: "bg-slate-100 text-slate-500",
    tone: "locked",
  },
  group_restricted: {
    label: "خارج مجموعتك",
    badgeClass: "bg-amber-50 text-amber-700",
    tone: "locked",
  },
};

export function getAccessStatusMeta(status) {
  return ACCESS_STATUS_META[status] || ACCESS_STATUS_META.locked;
}

export function isLectureBlockedForViewer(lecture, canManage) {
  if (canManage) return false;
  return Boolean(lecture?.locked);
}

export function getLectureLockMessage(lecture) {
  const status = lecture?.access_status;
  if (status === "expired") {
    return "انتهت مدة هذه المحاضرة ولم يعد بإمكانك الوصول إليها.";
  }
  if (status === "requires_activation_code") {
    return "أدخل كود التفعيل لفتح محتوى هذه المحاضرة.";
  }
  if (status === "activation_expired") {
    return "انتهت مدة تفعيلك لهذه المحاضرة. اطلب كوداً جديداً من المدرس.";
  }
  if (status === "not_enrolled") {
    return "يجب الاشتراك في الكورس للوصول إلى هذه المحاضرة.";
  }
  if (status === "group_restricted") {
    return "هذه المحاضرة مخصصة لمجموعات أخرى ولا تظهر ضمن مجموعتك الحالية.";
  }
  return "أكمل كل واجبات المحاضرات السابقة بنجاح لفتح هذا المحتوى.";
}

export function formatRemainingSeconds(seconds) {
  if (seconds == null || Number.isNaN(Number(seconds))) return null;
  const total = Math.max(0, Math.floor(Number(seconds)));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h} س ${m} د`;
  if (m > 0) return `${m} دقيقة`;
  return `${total} ثانية`;
}

export function toDateTimeLocalValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function fromDateTimeLocalValue(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export const LECTURE_ACCESS_MODE_LABELS = {
  always_open: "مفتوح دائماً",
  time_limited: "محدد بموعد",
  activation_code: "كود تفعيل",
};

export const ASSIGNMENT_MODE_LABELS = {
  lecture_based: "واجبات على مستوى المحاضرة",
  course_based: "واجبات على مستوى الكورس",
};
