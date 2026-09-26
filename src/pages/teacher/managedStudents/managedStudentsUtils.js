import { getTenantSubdomain, buildTenantAuthUrl } from "../../../utils/tenantHost";

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
  const loginUrl = subdomain ? buildTenantAuthUrl(subdomain, "/login") : "";
  const lines = [
    "السلام عليكم،",
    "",
    `بيانات دخول الطالب: ${studentName || "—"}`,
    "",
    `رقم الطالب: ${code}`,
  ];

  if (subdomain) {
    lines.push(`منصة المدرس: ${subdomain}`);
    if (loginUrl) {
      lines.push(`رابط تسجيل الدخول: ${loginUrl}`);
    }
    lines.push("");
    lines.push("ادخل من الرابط أعلاه ثم استخدم رقم الطالب فقط (بدون كلمة مرور).");
  } else {
    lines.push("");
    lines.push(
      "طريقة الدخول: رقم الطالب + اسم منصة المدرس (subdomain) في صفحة تسجيل الدخول — بدون كلمة مرور."
    );
  }

  lines.push("", "مع تحيات فريق المتابعة.");
  return lines.join("\n");
}

export function buildPasswordLoginMessage(studentName, credentials, subdomain) {
  const lines = [
    "السلام عليكم،",
    "",
    `بيانات دخول الطالب: ${studentName || "—"}`,
    "",
    `رقم الطالب: ${formatStudentCode(credentials.student_code)}`,
    `كلمة المرور: ${credentials.temporary_password}`,
  ];

  const loginUrl = subdomain ? buildTenantAuthUrl(subdomain, "/login") : "";
  if (loginUrl) {
    lines.push(`رابط تسجيل الدخول: ${loginUrl}`);
  }

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

/** يستخرج معرف مجموعة الكورس للطالب من أشكال الريسبونس المختلفة */
export function getManagedStudentCourseGroupId(student) {
  if (!student) return null;
  const raw =
    student.course_group?.id ??
    student.course_group_id ??
    student.courseGroupId ??
    student.courseGroup?.id ??
    student.group?.id ??
    student.group_id ??
    student.groupId ??
    null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** @deprecated استخدم getManagedStudentCourseGroupId */
export function getManagedStudentGroupId(student) {
  return getManagedStudentCourseGroupId(student);
}

export function formatStudyGroupOptionLabel(group) {
  if (!group) return "مجموعة";
  const parts = [group.name || "مجموعة"];
  if (group.grade_name) parts.push(group.grade_name);
  if (group.description) parts.push(String(group.description).slice(0, 40));
  if (group.days) parts.push(group.days);
  const time =
    group.start_time && group.end_time
      ? `${group.start_time} – ${group.end_time}`
      : group.start_time || group.end_time || null;
  if (time) parts.push(time);
  return parts.join(" · ");
}
