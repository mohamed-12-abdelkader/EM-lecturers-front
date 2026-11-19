import baseUrl from "./baseUrl";

const API = "/api/admin/teacher-schedules";

function authHeaders(contentType) {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    "X-Tenant-Subdomain": "default",
  };
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}

export async function fetchScheduleTeachers() {
  const { data } = await baseUrl.get(`${API}/teachers`, {
    headers: authHeaders(),
  });
  return data?.teachers || [];
}

export async function fetchScheduleTasks(params = {}) {
  const { data } = await baseUrl.get(`${API}/tasks`, {
    headers: authHeaders(),
    params,
  });
  return data?.tasks || [];
}

export async function fetchTodayScheduleTasks(teacherId) {
  const { data } = await baseUrl.get(`${API}/tasks/today`, {
    headers: authHeaders(),
    params: teacherId ? { teacherId } : undefined,
  });
  return data?.tasks || [];
}

export async function fetchScheduleTask(id) {
  const { data } = await baseUrl.get(`${API}/tasks/${id}`, {
    headers: authHeaders(),
  });
  return data?.task;
}

export async function createScheduleTask(payload) {
  const { data } = await baseUrl.post(`${API}/tasks`, payload, {
    headers: authHeaders("application/json"),
  });
  return data?.task;
}

export async function updateScheduleTask(id, payload) {
  const { data } = await baseUrl.patch(`${API}/tasks/${id}`, payload, {
    headers: authHeaders("application/json"),
  });
  return data?.task;
}

export async function deleteScheduleTask(id) {
  const { data } = await baseUrl.delete(`${API}/tasks/${id}`, {
    headers: authHeaders(),
  });
  return data;
}
