/** أدوار المنصة والتوجيه بعد تسجيل الدخول */

import { getJwtPayload } from "./jwt";
import { readAuthToken } from "./authStorage";

const STUDENT_ONLY_PATH_PREFIXES = [
  "/my-courses",
  "/student-daily-quizzes",
  "/exam_grades",
  "/lectures_taple",
];

export function normalizeAuthUser(user, { fallbackUser = null, token = null } = {}) {
  if (user == null || typeof user !== "object") return null;

  let role =
    user.role ??
    user.user_role ??
    user.user_type ??
    user.type ??
    null;

  if (role != null) role = String(role).trim().toLowerCase();

  if (!role && fallbackUser?.role) {
    role = String(fallbackUser.role).trim().toLowerCase();
  }

  if (!role) {
    const jwt = getJwtPayload(token ?? readAuthToken());
    const fromJwt = jwt?.role ?? jwt?.user_role ?? null;
    if (fromJwt) role = String(fromJwt).trim().toLowerCase();
  }

  if (!role) return user;
  return user.role === role ? user : { ...user, role };
}

export function getUserRole(user) {
  const normalized = normalizeAuthUser(user);
  if (!normalized) return null;
  return normalized.role || null;
}

export function resolveAuthRoles(user) {
  const normalized = normalizeAuthUser(user);
  if (normalized == null || typeof normalized !== "object") {
    return {
      isAdmin: false,
      isTeacher: false,
      isAcademy: false,
      isAcademyTeacher: false,
      student: false,
    };
  }

  const role = getUserRole(normalized);

  if (role === "admin") {
    return { isAdmin: true, isTeacher: false, isAcademy: false, isAcademyTeacher: false, student: false };
  }
  if (role === "teacher") {
    return { isAdmin: false, isTeacher: true, isAcademy: false, isAcademyTeacher: false, student: false };
  }
  if (role === "academy") {
    return { isAdmin: false, isTeacher: false, isAcademy: true, isAcademyTeacher: false, student: false };
  }
  if (role === "academy_teacher") {
    return { isAdmin: false, isTeacher: true, isAcademy: false, isAcademyTeacher: true, student: false };
  }

  return { isAdmin: false, isTeacher: false, isAcademy: false, isAcademyTeacher: false, student: true };
}

function isStudentOnlyRedirect(path) {
  const target = String(path || "").toLowerCase();
  return STUDENT_ONLY_PATH_PREFIXES.some(
    (prefix) => target === prefix || target.startsWith(`${prefix}/`),
  );
}

export function getPostLoginPath(user, redirectTarget) {
  const role = getUserRole(user);

  if (
    redirectTarget &&
    redirectTarget.startsWith("/") &&
    !redirectTarget.startsWith("//")
  ) {
    if (
      (role === "teacher" || role === "admin" || role === "academy" || role === "academy_teacher") &&
      isStudentOnlyRedirect(redirectTarget)
    ) {
      if (role === "academy") return "/academy";
      if (role === "academy_teacher") return "/academy/me";
      return "/home";
    }
    return redirectTarget;
  }

  if (role === "academy") return "/academy";
  if (role === "academy_teacher") return "/academy/me";
  if (role === "admin" || role === "teacher") return "/home";
  return "/home";
}

export function getRoleLabel(role) {
  switch (role) {
    case "admin":
      return "مشرف النظام";
    case "teacher":
      return "مدرس";
    case "academy":
      return "مالك أكاديمية";
    case "academy_teacher":
      return "مدرس أكاديمية";
    case "student":
      return "طالب";
    default:
      return "عضو";
  }
}
