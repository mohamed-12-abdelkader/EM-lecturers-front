import baseUrl from "./baseUrl";
import { readAuthToken } from "../utils/authStorage";

function authConfig(contentType) {
  const token = readAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  if (contentType) headers["Content-Type"] = contentType;
  return { headers };
}

function unwrap(data, fallback) {
  if (data?.success === false) {
    const err = new Error(data?.message || fallback);
    err.response = { data };
    throw err;
  }
  return data?.data ?? data;
}

export async function fetchPublicDeviceRestrictionSettings(subdomain) {
  const { data } = await baseUrl.get(
    `/api/tenants/public/${encodeURIComponent(subdomain)}/device-restriction-settings`,
  );
  const payload = unwrap(data, "فشل تحميل إعدادات الجهاز");
  return {
    student_device_limit: payload?.student_device_limit ?? "multiple_devices",
    single_device: payload?.single_device ?? payload?.student_device_limit === "single_device",
    multiple_devices: payload?.multiple_devices ?? payload?.student_device_limit === "multiple_devices",
  };
}

export async function fetchTeacherDeviceRestrictionSettings() {
  const { data } = await baseUrl.get("/api/teacher/device-restriction-settings", authConfig());
  return {
    settings: unwrap(data, "فشل تحميل إعدادات تقييد الأجهزة"),
    options: Array.isArray(data?.options) ? data.options : [],
  };
}

export async function updateTeacherDeviceRestrictionSettings(studentDeviceLimit) {
  const { data } = await baseUrl.put(
    "/api/teacher/device-restriction-settings",
    { student_device_limit: studentDeviceLimit },
    authConfig("application/json"),
  );
  return {
    message: data?.message,
    settings: unwrap(data, "فشل تحديث إعدادات تقييد الأجهزة"),
  };
}

export async function resetStudentDevice(studentId) {
  const { data } = await baseUrl.post(
    `/api/teacher/students/${studentId}/reset-device`,
    null,
    authConfig(),
  );
  return {
    message: data?.message,
    data: unwrap(data, "فشل إعادة تعيين جهاز الطالب"),
  };
}

export async function fetchStudentDeviceLogs(studentId) {
  const { data } = await baseUrl.get(
    `/api/teacher/students/${studentId}/device-logs`,
    authConfig(),
  );
  const payload = unwrap(data, "فشل تحميل سجل الجهاز");
  return Array.isArray(payload) ? payload : payload?.logs ?? [];
}
