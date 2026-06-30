import { getTenantSubdomain } from "../../../utils/tenantHost";

export function formatStudentCode(code) {
  return String(code || "").replace(/\D/g, "") || String(code || "");
}

export function getPlatformSubdomain() {
  return getTenantSubdomain() || "";
}

export function isTeacherRegistrationMode(mode) {
  return mode === "teacher_registration";
}

export function buildCodeOnlyLoginMessage(studentName, studentCode, subdomain) {
  const code = formatStudentCode(studentCode);
  const lines = [
    "السلام عليكم،",
    "",
    `بيانات دخول الطالب: ${studentName || "—"}`,
    "",
    `رقم الطالب: ${code}`,
  ];

  if (subdomain) {
    lines.push(`منصة المدرس (subdomain): ${subdomain}`);
    lines.push("");
    lines.push("طريقة الدخول: صفحة تسجيل الدخول ← رقم الطالب فقط (بدون كلمة مرور).");
  } else {
    lines.push("");
    lines.push(
      "طريقة الدخول: رقم الطالب + اسم منصة المدرس (subdomain) في صفحة تسجيل الدخول — بدون كلمة مرور."
    );
  }

  lines.push("", "مع تحيات فريق المتابعة.");
  return lines.join("\n");
}

export function buildPasswordLoginMessage(studentName, credentials) {
  const lines = [
    "السلام عليكم،",
    "",
    `بيانات دخول الطالب: ${studentName || "—"}`,
    "",
    `رقم الطالب: ${formatStudentCode(credentials.student_code)}`,
    `كلمة المرور: ${credentials.temporary_password}`,
  ];

  if (credentials.must_change_password) {
    lines.push("", "يُرجى تغيير كلمة المرور عند أول تسجيل دخول.");
  }

  lines.push("", "مع تحيات فريق المتابعة.");
  return lines.join("\n");
}

export function formatPhoneForWhatsApp(phone) {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = `20${digits.slice(1)}`;
  else if (!digits.startsWith("20")) digits = `20${digits}`;
  return digits;
}
