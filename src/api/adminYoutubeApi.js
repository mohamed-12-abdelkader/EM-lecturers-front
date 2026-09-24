import baseUrl from "./baseUrl";

const API = "/api/admin/youtube";

function adminHeaders(token, contentType) {
  const headers = {
    Authorization: token ? `Bearer ${token}` : undefined,
    "X-Tenant-Subdomain": "default",
  };
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}

function getToken() {
  return localStorage.getItem("token") || "";
}

export async function fetchYoutubeStatus() {
  const { data } = await baseUrl.get(`${API}/status`, {
    headers: adminHeaders(getToken()),
  });
  if (!data?.success) throw new Error(data?.message || "فشل تحميل حالة YouTube");
  return data.data;
}

export async function fetchYoutubeConnectUrl() {
  const { data } = await baseUrl.get(`${API}/connect`, {
    headers: adminHeaders(getToken()),
  });
  if (!data?.success) throw new Error(data?.message || "فشل إنشاء رابط الربط");
  return data.data;
}

export async function disconnectYoutube() {
  const { data } = await baseUrl.post(
    `${API}/disconnect`,
    {},
    { headers: adminHeaders(getToken()) },
  );
  if (!data?.success) throw new Error(data?.message || "فشل قطع الاتصال");
  return data;
}

/**
 * @param {{
 *   tenant_id?: number|string,
 *   course_id?: number|string,
 *   search?: string,
 *   from?: string,
 *   to?: string,
 *   has_file?: boolean,
 *   not_on_youtube?: boolean,
 *   limit?: number,
 *   offset?: number,
 * }} params
 */
export async function fetchYoutubeSessions(params = {}) {
  const query = new URLSearchParams();
  if (params.tenant_id) query.set("tenant_id", String(params.tenant_id));
  if (params.course_id) query.set("course_id", String(params.course_id));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.has_file === true || params.has_file === false) {
    query.set("has_file", String(params.has_file));
  }
  if (params.not_on_youtube === true || params.not_on_youtube === false) {
    query.set("not_on_youtube", String(params.not_on_youtube));
  }
  query.set("limit", String(params.limit || 50));
  query.set("offset", String(params.offset || 0));

  const { data } = await baseUrl.get(`${API}/sessions?${query}`, {
    headers: adminHeaders(getToken()),
  });
  if (!data?.success) throw new Error(data?.message || "فشل تحميل الجلسات");
  return data.data;
}

export async function enqueueYoutubeUploads(meetingIds, replace = false) {
  const { data } = await baseUrl.post(
    `${API}/uploads`,
    { meeting_ids: meetingIds, replace },
    { headers: adminHeaders(getToken(), "application/json") },
  );
  if (!data?.success) {
    const err = new Error(data?.message || "فشل بدء الرفع");
    err.response = { data };
    throw err;
  }
  return data.data;
}

export async function fetchYoutubeUploadJobs(ids = []) {
  const query = ids.length ? `?ids=${ids.join(",")}` : "";
  const { data } = await baseUrl.get(`${API}/uploads${query}`, {
    headers: adminHeaders(getToken()),
  });
  if (!data?.success) throw new Error(data?.message || "فشل تحميل حالة الرفع");
  return data.data?.jobs || [];
}

export async function retryYoutubeUploadJob(jobId) {
  const { data } = await baseUrl.post(
    `${API}/uploads/${jobId}/retry`,
    {},
    { headers: adminHeaders(getToken()) },
  );
  if (!data?.success) throw new Error(data?.message || "فشل إعادة المحاولة");
  return data.data?.job;
}

export function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}
