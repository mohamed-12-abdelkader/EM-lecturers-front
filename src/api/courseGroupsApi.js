import baseUrl from "./baseUrl";

const TEACHER_API = "/api/teacher/course-groups";

export function courseGroupsApiError(err, fallback = "حدث خطأ غير متوقع") {
  return err?.response?.data?.message || err?.message || fallback;
}

function unwrapTeacher(data) {
  return data?.data ?? data;
}

function unwrapPublic(data) {
  return data?.data ?? data;
}

// —— Teacher settings ——

export async function fetchCourseGroupSettings() {
  const { data } = await baseUrl.get(`${TEACHER_API}/settings`);
  return {
    teacher_id: data?.teacher_id,
    course_group_access_enabled: Boolean(data?.course_group_access_enabled),
  };
}

export async function updateCourseGroupSettings(payload) {
  const { data } = await baseUrl.patch(`${TEACHER_API}/settings`, payload);
  return {
    teacher_id: data?.teacher_id,
    course_group_access_enabled: Boolean(data?.course_group_access_enabled),
  };
}

// —— Teacher groups CRUD ——

export async function fetchTeacherCourseGroups(params = {}) {
  const { data } = await baseUrl.get(TEACHER_API, { params });
  const groups = data?.groups ?? unwrapTeacher(data)?.groups ?? [];
  return Array.isArray(groups) ? groups : [];
}

export async function createTeacherCourseGroup(payload) {
  const { data } = await baseUrl.post(TEACHER_API, payload);
  return data?.group ?? data;
}

export async function updateTeacherCourseGroup(groupId, payload) {
  const { data } = await baseUrl.patch(`${TEACHER_API}/${groupId}`, payload);
  return data?.group ?? data;
}

export async function deleteTeacherCourseGroup(groupId) {
  const { data } = await baseUrl.delete(`${TEACHER_API}/${groupId}`);
  return data;
}

// —— Group students ——

export async function fetchCourseGroupStudents(groupId) {
  const { data } = await baseUrl.get(`${TEACHER_API}/${groupId}/students`);
  const students = data?.students ?? [];
  return Array.isArray(students) ? students : [];
}

export async function addCourseGroupStudent(groupId, studentId) {
  const { data } = await baseUrl.post(`${TEACHER_API}/${groupId}/students`, {
    student_id: studentId,
  });
  return data?.student ?? data;
}

export async function removeCourseGroupStudent(groupId, studentId) {
  const { data } = await baseUrl.delete(
    `${TEACHER_API}/${groupId}/students/${studentId}`,
  );
  return data;
}

// —— Lecture group targeting ——

export async function updateLectureCourseGroups(lectureId, payload) {
  const { data } = await baseUrl.put(`${TEACHER_API}/lectures/${lectureId}/groups`, payload);
  return data;
}

// —— Student membership ——

export async function fetchMyCourseGroupMembership() {
  const { data } = await baseUrl.get(`${TEACHER_API}/me/membership`);
  return data?.membership ?? data ?? null;
}

export async function setMyCourseGroupMembership(payload) {
  const { data } = await baseUrl.post(`${TEACHER_API}/me/membership`, payload);
  return data?.membership ?? data;
}

// —— Public (registration) ——

export async function fetchPublicRegistrationSettings(subdomain) {
  const { data } = await baseUrl.get(
    `/api/tenants/public/${encodeURIComponent(subdomain)}/registration-settings`,
  );
  const payload = unwrapPublic(data);
  return {
    course_group_access_enabled: Boolean(payload?.course_group_access_enabled),
    requires_course_group_selection: Boolean(payload?.requires_course_group_selection),
    student_device_limit: payload?.student_device_limit ?? "multiple_devices",
    single_device: payload?.single_device ?? payload?.student_device_limit === "single_device",
    multiple_devices: payload?.multiple_devices ?? payload?.student_device_limit === "multiple_devices",
  };
}

export async function fetchPublicCourseGroups(subdomain, gradeId) {
  const { data } = await baseUrl.get(
    `/api/tenants/public/${encodeURIComponent(subdomain)}/course-groups`,
    { params: { grade_id: gradeId } },
  );
  const payload = unwrapPublic(data);
  const groups = payload?.groups ?? [];
  return {
    course_group_access_enabled: Boolean(payload?.course_group_access_enabled),
    grade_id: payload?.grade_id ?? gradeId,
    groups: Array.isArray(groups) ? groups : [],
  };
}
