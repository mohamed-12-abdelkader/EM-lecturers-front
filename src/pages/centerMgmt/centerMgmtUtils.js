import {
  FaChartPie,
  FaUsers,
  FaUserGraduate,
  FaQrcode,
  FaCalendarAlt,
  FaMoneyBillWave,
} from "react-icons/fa";

/** Brand — aligned with teacher dashboard */
export const ACCENT = "#3182CE";
export const ACCENT_HOVER = "#2B6CB0";
export const BRAND_ORANGE = "#DD6B20";

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
  cash: "نقدي",
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
  { to: "", label: "اللوحة", fullLabel: "لوحة التحكم", end: true, icon: FaChartPie },
  { to: "groups", label: "المجموعات", fullLabel: "المجموعات", icon: FaUsers },
  { to: "students", label: "الطلاب", fullLabel: "الطلاب", icon: FaUserGraduate },
  { to: "attendance", label: "الحضور", fullLabel: "الحضور", icon: FaQrcode },
  { to: "subscriptions", label: "المالي", fullLabel: "الشهر المالي", icon: FaCalendarAlt },
  { to: "payments", label: "المدفوعات", fullLabel: "المدفوعات", icon: FaMoneyBillWave },
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
    const token =
      parsed?.qr_token || parsed?.qrToken || parsed?.token || null;
    if (token || parsed?.type === "tc_student") {
      return {
        qr_token: token,
        qr_payload: typeof text === "string" ? raw : JSON.stringify(parsed),
        parsed,
      };
    }
  } catch {
    // plain token
  }
  return { qr_token: raw };
}

export function monthFirstLast(year, month) {
  const y = Number(year);
  const m = Number(month);
  const from = `${y}-${String(m).padStart(2, "0")}-01`;
  const last = new Date(y, m, 0).getDate();
  const to = `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { from, to };
}
