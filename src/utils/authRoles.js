/** أدوار المنصة والتوجيه بعد تسجيل الدخول */

export function getUserRole(user) {
  if (!user || typeof user !== "object") return null;
  return user.role || null;
}

export function resolveAuthRoles(user) {
  if (user == null || typeof user !== "object") {
    return {
      isAdmin: false,
      isTeacher: false,
      isAcademy: false,
      isAcademyTeacher: false,
      student: false,
    };
  }

  const role = user.role;

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

export function getPostLoginPath(user, redirectTarget) {
  if (
    redirectTarget &&
    redirectTarget.startsWith("/") &&
    !redirectTarget.startsWith("//")
  ) {
    return redirectTarget;
  }

  const role = getUserRole(user);
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
