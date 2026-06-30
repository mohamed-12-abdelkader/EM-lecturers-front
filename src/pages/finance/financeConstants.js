export const EXPENSE_CATEGORIES = {
  salaries: "رواتب",
  marketing: "تسويق وإعلانات",
  hosting: "استضافة وسيرفرات",
  development: "تطوير وبرمجة",
  support: "دعم فني",
  operational: "مصروفات تشغيلية",
  maintenance: "صيانة",
  other: "أخرى",
};

export const PAYMENT_METHODS = {
  cash: "نقداً",
  bank_transfer: "تحويل بنكي",
  online_payment: "دفع إلكتروني",
  check: "شيك",
};

export const EXPENSE_TYPES = {
  monthly: "شهري",
  one_time: "مرة واحدة",
  recurring: "متكرر",
};

export const PAYMENT_STATUS = {
  paid: { label: "مدفوع بالكامل", colorScheme: "green" },
  partial: { label: "مدفوع جزئياً", colorScheme: "orange" },
  unpaid: { label: "غير مدفوع", colorScheme: "red" },
};

export function paymentStatusLabel(sub) {
  if (!sub) return "—";
  return sub.payment_status_label || PAYMENT_STATUS[sub.payment_status]?.label || sub.payment_status || "—";
}

export function paymentStatusMeta(status) {
  return PAYMENT_STATUS[status] || { label: status || "—", colorScheme: "gray" };
}

export const SUBSCRIPTION_STATUS = {
  active: { label: "نشط", colorScheme: "green" },
  expired: { label: "منتهي", colorScheme: "gray" },
  suspended: { label: "معلق", colorScheme: "orange" },
  cancelled: { label: "ملغي", colorScheme: "red" },
};

export const PLAN_CODES = {
  bronze: { label: "الانطلاقة", colorScheme: "orange" },
  silver: { label: "التوسع", colorScheme: "gray" },
  gold: { label: "الاحتراف", colorScheme: "yellow" },
  diamond: { label: "التميز", colorScheme: "purple" },
};

/** حدود الباقة الافتراضية (للعرض في لوحة المالية) */
export const PLAN_LIMITS = {
  bronze: { livePerMonth: 6, maxStudents: 80 },
  silver: { livePerMonth: 10, maxStudents: 150 },
  gold: { livePerMonth: 16, maxStudents: 300, examBuilderAi: true, scientificSupport: true },
  diamond: {
    livePerMonth: null,
    maxStudents: null,
    examBuilderAi: true,
    scientificSupport: true,
    dataAnalyst: true,
    creativeSocial: true,
  },
};

export const PACKAGE_ORDER = ["bronze", "silver", "gold", "diamond"];

export function getUpgradeablePlans(currentPlanCode, plans = []) {
  const currentIdx = PACKAGE_ORDER.indexOf(currentPlanCode);
  if (currentIdx < 0) return plans;
  return plans.filter((plan) => PACKAGE_ORDER.indexOf(plan.code) > currentIdx);
}

export function formatPlanLimits(code) {
  const limits = PLAN_LIMITS[code];
  if (!limits) return [];
  const lines = [];
  if (limits.livePerMonth != null) {
    lines.push(`${limits.livePerMonth} لايف/شهر`);
  } else if (limits.livePerMonth === null && code === "diamond") {
    lines.push("لايفات غير محدودة");
  }
  if (limits.maxStudents != null) {
    lines.push(`حتى ${limits.maxStudents} طالب`);
  } else if (limits.maxStudents === null && code === "diamond") {
    lines.push("طلاب غير محدود");
  }
  if (limits.examBuilderAi) lines.push("AI امتحانات");
  if (limits.scientificSupport) lines.push("دعم علمي");
  if (limits.dataAnalyst) lines.push("محلل بيانات");
  if (limits.creativeSocial) lines.push("سوشيال ميديا");
  return lines;
}

export const DASHBOARD_PERIODS = [
  { value: "today", label: "اليوم" },
  { value: "week", label: "الأسبوع" },
  { value: "month", label: "الشهر" },
  { value: "year", label: "السنة" },
  { value: "all", label: "الكل" },
];

export const AUDIT_ENTITY_LABELS = {
  teacher_subscription_plan: "باقة مدرس",
  teacher_custom_price: "سعر مخصص",
  teacher_platform_subscription: "اشتراك",
  teacher_subscription_renewal: "تجديد",
  teacher_subscription_upgrade: "ترقية باقة",
  teacher_subscription_payment: "دفعة اشتراك",
  platform_expense: "مصروف",
};

export const INVOICE_TYPES = {
  subscription: "اشتراك جديد",
  renewal: "تجديد اشتراك",
  upgrade: "ترقية باقة",
  downgrade: "تخفيض باقة",
  adjustment: "تعديل",
};

export const INVOICE_STATUS = {
  paid: { label: "مدفوعة", colorScheme: "green" },
  partial: { label: "جزئية", colorScheme: "orange" },
  unpaid: { label: "غير مدفوعة", colorScheme: "red" },
  pending: { label: "معلقة", colorScheme: "yellow" },
  cancelled: { label: "ملغاة", colorScheme: "red" },
  refunded: { label: "مستردة", colorScheme: "purple" },
};

export function invoiceTypeLabel(invoice) {
  if (!invoice) return "—";
  return invoice.invoice_type_label || INVOICE_TYPES[invoice.invoice_type] || invoice.invoice_type || "—";
}

export function paymentMethodLabel(invoice) {
  if (!invoice) return "—";
  return invoice.payment_method_label || PAYMENT_METHODS[invoice.payment_method] || invoice.payment_method || "—";
}

export function formatMoney(value, currency = "ج.م") {
  const n = Number(value);
  if (!Number.isFinite(n)) return `0 ${currency}`;
  return `${n.toLocaleString("ar-EG")} ${currency}`;
}

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

export function teacherLabel(teacher) {
  if (!teacher) return "—";
  return teacher.name || teacher.fname
    ? `${teacher.fname || ""} ${teacher.lname || ""}`.trim() || teacher.name
    : `#${teacher.id}`;
}
