export const ACCENT = "#0056b3";

export const WEEK_DAYS = [
  "السبت",
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

export const ROLE_LABELS = {
  owner: "مالك",
  admin: "أدمن",
  teacher: "مدرس",
  accountant: "محاسب",
  assistant: "مساعد",
};

export const ATTENDANCE_LABELS = {
  present: { label: "حاضر", scheme: "green" },
  absent: { label: "غائب", scheme: "red" },
  late: { label: "متأخر", scheme: "orange" },
  excused: { label: "بعذر", scheme: "purple" },
};

export const SUBSCRIPTION_LABELS = {
  pending: { label: "غير مدفوع", scheme: "orange" },
  active: { label: "نشط", scheme: "green" },
  expired: { label: "منتهي", scheme: "red" },
};

export const PAYMENT_METHOD_LABELS = {
  cash: "نقدي",
  card: "بطاقة",
  transfer: "تحويل",
  wallet: "محفظة",
  other: "أخرى",
};

export const REPORT_TYPES = [
  { value: "attendance", label: "كشف حضور" },
  { value: "absences", label: "كشف غياب" },
  { value: "subscriptions", label: "اشتراكات" },
  { value: "arrears", label: "متأخرات" },
  { value: "revenue", label: "إيرادات" },
  { value: "student", label: "تقرير طالب" },
  { value: "group", label: "تقرير مجموعة" },
  { value: "grade", label: "تقرير صف" },
];

export const CENTER_NAV = [
  { to: "", label: "لوحة التحكم", end: true },
  { to: "grades", label: "الصفوف" },
  { to: "groups", label: "المجموعات" },
  { to: "students", label: "الطلاب" },
  { to: "attendance", label: "الحضور" },
  { to: "subscriptions", label: "الاشتراكات" },
  { to: "payments", label: "المدفوعات" },
  { to: "finance", label: "الماليات" },
  { to: "staff", label: "الموظفون" },
  { to: "reports", label: "التقارير" },
];

export function formatMoney(value, currency = "EGP") {
  const num = Number(value);
  if (Number.isNaN(num)) return `— ${currency}`;
  return `${num.toLocaleString("ar-EG")} ${currency}`;
}

export function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("ar-EG");
  } catch {
    return String(value);
  }
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function currentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function field(row, ...keys) {
  for (const key of keys) {
    if (row?.[key] != null && row[key] !== "") return row[key];
  }
  return undefined;
}

export function studentName(row) {
  return field(row, "full_name", "fullName", "name") || "طالب";
}

export function studentCode(row) {
  return field(row, "student_code", "studentCode") || "—";
}
