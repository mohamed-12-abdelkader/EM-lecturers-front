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

export const ATTENDANCE_LABELS = {
  present: { label: "حاضر", scheme: "green" },
  absent: { label: "غائب", scheme: "red" },
  late: { label: "متأخر", scheme: "orange" },
  excused: { label: "بعذر", scheme: "purple" },
};

export const SUBSCRIPTION_LABELS = {
  paid: { label: "مدفوع", scheme: "green" },
  unpaid: { label: "غير مدفوع", scheme: "orange" },
  partial: { label: "جزئي", scheme: "yellow" },
  exempt: { label: "معفى", scheme: "purple" },
};

export const PAYMENT_METHOD_LABELS = {
  cash: "كاش",
  transfer: "تحويل بنكي",
  vodafone_cash: "فودافون كاش",
  other: "أخرى",
};

export const MONTH_NAMES = [
  "",
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export const CENTER_NAV = [
  { to: "", label: "لوحة التحكم", end: true },
  { to: "groups", label: "المجموعات" },
  { to: "students", label: "الطلاب" },
  { to: "attendance", label: "الحضور" },
  { to: "subscriptions", label: "الاشتراكات" },
  { to: "payments", label: "المدفوعات" },
  { to: "finance", label: "التقرير المالي" },
];

export function formatMoney(value, currency = "ج.م") {
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

export function groupName(row) {
  return field(row, "name", "group_name", "groupName") || "مجموعة";
}

export function parseQrScan(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.token || parsed?.qrToken) {
      return {
        qrToken: parsed.token || parsed.qrToken,
        qrPayload: parsed,
      };
    }
  } catch {
    // plain token
  }
  return { qrToken: raw };
}
