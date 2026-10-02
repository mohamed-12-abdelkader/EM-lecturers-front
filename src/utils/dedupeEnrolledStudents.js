function firstDefined(...values) {
  for (const value of values) {
    if (value != null && value !== "") return value;
  }
  return undefined;
}

function normalizeStudentName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** مفتاح تمييز الطالب لتفادي تكرار نفس المشترك في قائمة المسجلين */
export function getEnrolledStudentDedupeKey(student) {
  if (!student || typeof student !== "object") return null;

  const studentId = firstDefined(
    student.student_id,
    student.studentId,
    student.user_id,
    student.userId,
  );
  if (studentId != null) return `sid:${studentId}`;

  const phone = String(student.phone || student.studentPhone || "").replace(/\D/g, "");
  if (phone.length >= 8) return `phone:${phone}`;

  const email = String(student.email || student.studentEmail || "")
    .trim()
    .toLowerCase();
  if (email) return `email:${email}`;

  const name = normalizeStudentName(student.name || student.studentName);
  if (name) return `name:${name}`;

  if (student.id != null) return `id:${student.id}`;
  return null;
}

function pickPreferredEnrollment(current, incoming) {
  if (!current) return incoming;
  const currentBlocked = !!current.is_blocked_by_teacher;
  const incomingBlocked = !!incoming.is_blocked_by_teacher;
  if (currentBlocked && !incomingBlocked) return incoming;
  if (!currentBlocked && incomingBlocked) return current;

  const currentDate = current.enrolled_at ? new Date(current.enrolled_at).getTime() : 0;
  const incomingDate = incoming.enrolled_at ? new Date(incoming.enrolled_at).getTime() : 0;
  if (Number.isFinite(incomingDate) && incomingDate > (Number.isFinite(currentDate) ? currentDate : 0)) {
    return incoming;
  }
  return current;
}

/**
 * يلغي تكرار الطلاب المسجلين (نفس الطالب / نفس الاسم الظاهر أكثر من مرة)
 * ويعيد قائمة فريدة مناسبة لعدد المشتركين.
 */
export function dedupeEnrolledStudents(list = []) {
  if (!Array.isArray(list) || list.length === 0) return [];

  const byIdentity = new Map();
  list.forEach((student, index) => {
    const key = getEnrolledStudentDedupeKey(student) || `row:${index}`;
    byIdentity.set(key, pickPreferredEnrollment(byIdentity.get(key), student));
  });

  // تمريرة إضافية بالاسم الظاهر لضمان عدم تكرار الاسم في العرض
  const byName = new Map();
  Array.from(byIdentity.values()).forEach((student, index) => {
    const nameKey = normalizeStudentName(student?.name || student?.studentName);
    const key = nameKey ? `name:${nameKey}` : getEnrolledStudentDedupeKey(student) || `row:${index}`;
    byName.set(key, pickPreferredEnrollment(byName.get(key), student));
  });

  return Array.from(byName.values());
}
