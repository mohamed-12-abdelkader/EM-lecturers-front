import {
  FaChartPie,
  FaChalkboardTeacher,
  FaBookOpen,
  FaHome,
} from "react-icons/fa";

export const ACCENT = "#3182CE";
export const BRAND_ORANGE = "#DD6B20";

export const ACADEMY_NAV = [
  { to: "", label: "اللوحة", fullLabel: "لوحة التحكم", end: true, icon: FaChartPie },
  { to: "teachers", label: "المدرسون", fullLabel: "مدرسو الأكاديمية", icon: FaChalkboardTeacher },
  { to: "courses", label: "الكورسات", fullLabel: "كورسات الأكاديمية", icon: FaBookOpen },
];

export const ACADEMY_TEACHER_NAV = [
  { to: "", label: "لوحتي", fullLabel: "لوحة المدرس", end: true, icon: FaHome },
  { to: "courses", label: "كورساتي", fullLabel: "الكورسات المسندة", icon: FaBookOpen },
];

export function field(row, ...keys) {
  for (const key of keys) {
    if (row?.[key] != null && row[key] !== "") return row[key];
  }
  return undefined;
}

export function teacherDisplayName(row) {
  return field(row, "name", "full_name", "display_name") || "مدرس";
}

export function courseTitle(row) {
  return field(row, "title", "name", "course_name", "courseName") || "كورس";
}
