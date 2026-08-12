import baseUrl from "./baseUrl";

function unwrap(data) {
  if (data?.data != null && typeof data.data === "object") return data.data;
  return data;
}

export async function fetchAcademyOverview() {
  const res = await baseUrl.get("/api/academy/overview");
  return unwrap(res.data);
}

export async function fetchAcademyTeachers() {
  const res = await baseUrl.get("/api/academy/teachers");
  const body = unwrap(res.data);
  return Array.isArray(body) ? body : body?.teachers || body?.items || [];
}

export async function createAcademyTeacher(payload, avatarFile) {
  if (avatarFile) {
    const fd = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value == null || value === "") return;
      if (key === "grade_ids" && Array.isArray(value)) {
        fd.append("grade_ids", value.join(","));
        return;
      }
      fd.append(key, String(value));
    });
    fd.append("avatar", avatarFile);
    const res = await baseUrl.post("/api/academy/teachers", fd);
    return unwrap(res.data);
  }
  const res = await baseUrl.post("/api/academy/teachers", payload);
  return unwrap(res.data);
}

export async function updateAcademyTeacher(userId, payload) {
  const res = await baseUrl.patch(`/api/academy/teachers/${userId}`, payload);
  return unwrap(res.data);
}

export async function deleteAcademyTeacher(userId) {
  const res = await baseUrl.delete(`/api/academy/teachers/${userId}`);
  return unwrap(res.data);
}

export async function fetchAcademyCourses() {
  const res = await baseUrl.get("/api/academy/courses");
  const body = unwrap(res.data);
  return Array.isArray(body) ? body : body?.courses || body?.items || [];
}

export async function assignCourseTeacher(courseId, { teacher_user_id, is_primary = true }) {
  const res = await baseUrl.post(`/api/academy/courses/${courseId}/assign`, {
    teacher_user_id,
    is_primary,
  });
  return unwrap(res.data);
}

export async function unassignCourseTeacher(courseId, teacherUserId) {
  const res = await baseUrl.delete(
    `/api/academy/courses/${courseId}/assign/${teacherUserId}`,
  );
  return unwrap(res.data);
}

export async function fetchAcademyTeacherDashboard() {
  const res = await baseUrl.get("/api/academy/me/dashboard");
  return unwrap(res.data);
}

export async function fetchAcademyTeacherCourses() {
  const res = await baseUrl.get("/api/academy/me/courses");
  const body = unwrap(res.data);
  return Array.isArray(body) ? body : body?.courses || body?.items || [];
}
