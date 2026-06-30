import baseUrl from "./baseUrl";

export const SCIENTIFIC_CHAT_API = "/api/scientific-chatbot";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function resolveUploadUrl(path) {
  if (!path) return "";
  if (String(path).startsWith("http")) return path;
  const base = (baseUrl.defaults.baseURL || "/").replace(/\/?$/, "/");
  const clean = String(path).replace(/^\//, "");
  return `${base}${clean}`;
}

/** @param {File[]} images */
export function buildAskFormData(question, images = []) {
  const formData = new FormData();
  formData.append("question", question);
  images.forEach((file) => formData.append("images", file));
  return formData;
}

export async function fetchCourseHistory(courseId, { limit = 50, beforeId } = {}, token) {
  const params = { limit };
  if (beforeId != null) params.beforeId = beforeId;
  const { data } = await baseUrl.get(`${SCIENTIFIC_CHAT_API}/courses/${courseId}/history`, {
    params,
    headers: authHeaders(token),
  });
  return Array.isArray(data?.history) ? data.history : [];
}

export async function askCourse(courseId, { question, images = [] }, token) {
  const formData = buildAskFormData(question, images);
  const { data } = await baseUrl.post(
    `${SCIENTIFIC_CHAT_API}/courses/${courseId}/ask`,
    formData,
    { headers: authHeaders(token) }
  );
  return data;
}

export async function fetchTeacherHistory(teacherId, { limit = 50, beforeId } = {}, token) {
  const params = { limit };
  if (beforeId != null) params.beforeId = beforeId;
  const { data } = await baseUrl.get(`${SCIENTIFIC_CHAT_API}/teachers/${teacherId}/history`, {
    params,
    headers: authHeaders(token),
  });
  return Array.isArray(data?.history) ? data.history : [];
}

export async function askTeacher(teacherId, { question, images = [] }, token) {
  const formData = buildAskFormData(question, images);
  const { data } = await baseUrl.post(
    `${SCIENTIFIC_CHAT_API}/teachers/${teacherId}/ask`,
    formData,
    { headers: authHeaders(token) }
  );
  return data;
}

export async function fetchCourseFiles(courseId, token) {
  const { data } = await baseUrl.get(`${SCIENTIFIC_CHAT_API}/courses/${courseId}/files`, {
    headers: authHeaders(token),
  });
  return Array.isArray(data?.files) ? data.files : [];
}

export async function uploadCourseFile(courseId, file, token) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await baseUrl.post(
    `${SCIENTIFIC_CHAT_API}/courses/${courseId}/files`,
    formData,
    { headers: authHeaders(token) }
  );
  return data;
}

export async function deleteScientificFile(fileId, token) {
  const { data } = await baseUrl.delete(`${SCIENTIFIC_CHAT_API}/files/${fileId}`, {
    headers: authHeaders(token),
  });
  return data;
}

export async function resetCourseEmbeddings(courseId, token) {
  const { data } = await baseUrl.post(
    `${SCIENTIFIC_CHAT_API}/courses/${courseId}/reset-embeddings`,
    {},
    { headers: authHeaders(token) }
  );
  return data;
}

export async function fetchTeacherFiles(token, teacherId) {
  const params = teacherId ? { teacher_id: teacherId } : undefined;
  const { data } = await baseUrl.get(`${SCIENTIFIC_CHAT_API}/files`, {
    params,
    headers: authHeaders(token),
  });
  return Array.isArray(data?.files) ? data.files : [];
}

export async function uploadTeacherFile(file, token, teacherId) {
  const formData = new FormData();
  formData.append("file", file);
  const params = teacherId ? { teacher_id: teacherId } : undefined;
  const { data } = await baseUrl.post(`${SCIENTIFIC_CHAT_API}/files`, formData, {
    params,
    headers: authHeaders(token),
  });
  return data;
}

export async function resetTeacherEmbeddings(token, teacherId) {
  const params = teacherId ? { teacher_id: teacherId } : undefined;
  const { data } = await baseUrl.post(
    `${SCIENTIFIC_CHAT_API}/reset-embeddings`,
    {},
    { params, headers: authHeaders(token) }
  );
  return data;
}

/**
 * @param {{ courseId?: number|string, scope?: 'teacher', studentId?: number|string, limit?: number, offset?: number, teacherId?: number|string }} options
 */
export async function fetchTeacherStudentChats(options = {}, token) {
  const params = {};
  if (options.courseId != null && options.courseId !== "") params.courseId = options.courseId;
  if (options.scope === "teacher") params.scope = "teacher";
  if (options.studentId != null) params.studentId = options.studentId;
  if (options.limit != null) params.limit = options.limit;
  if (options.offset != null) params.offset = options.offset;
  if (options.teacherId != null) params.teacher_id = options.teacherId;

  const { data } = await baseUrl.get(`${SCIENTIFIC_CHAT_API}/teacher/student-chats`, {
    params,
    headers: authHeaders(token),
  });
  return Array.isArray(data?.chats) ? data.chats : [];
}

/**
 * @param {number|string} studentId
 * @param {{ courseId?: number|string, scope?: 'teacher', limit?: number, beforeId?: number|string, teacherId?: number|string }} options
 */
export async function fetchTeacherStudentChatMessages(studentId, options = {}, token) {
  const params = {};
  if (options.courseId != null && options.courseId !== "") params.courseId = options.courseId;
  if (options.scope === "teacher") params.scope = "teacher";
  if (options.limit != null) params.limit = options.limit;
  if (options.beforeId != null) params.beforeId = options.beforeId;
  if (options.teacherId != null) params.teacher_id = options.teacherId;

  const { data } = await baseUrl.get(
    `${SCIENTIFIC_CHAT_API}/teacher/student-chats/${studentId}/messages`,
    { params, headers: authHeaders(token) }
  );
  return Array.isArray(data?.messages) ? data.messages : [];
}
