import baseUrl from "./baseUrl";
import { readAuthToken } from "../utils/authStorage";

function authConfig(params = {}, signal) {
  const token = readAuthToken();
  const config = {};
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  if (signal) config.signal = signal;
  const clean = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    clean[key] = value;
  });
  if (Object.keys(clean).length) config.params = clean;
  return config;
}

/**
 * GET /api/course/lectures/:lectureId/engagement-report
 * @param {number|string} lectureId
 * @param {object} [filters]
 * @param {string} [filters.status] COMPLETED | PARTIALLY_COMPLETED | STARTED | NOT_STARTED
 * @param {string} [filters.sort] watchPercentage | lastWatchedAt | name | studentCode | watchedVideos
 * @param {'asc'|'desc'} [filters.order]
 * @param {number} [filters.page]
 * @param {number} [filters.limit]
 * @param {string} [filters.search]
 * @param {number} [filters.groupId]
 * @param {number} [filters.minWatchPercentage]
 * @param {number} [filters.maxWatchPercentage]
 * @param {boolean} [filters.includeGroups]
 * @param {AbortSignal} [filters.signal]
 */
export async function fetchLectureEngagementReport(lectureId, filters = {}) {
  const { data } = await baseUrl.get(
    `/api/course/lectures/${lectureId}/engagement-report`,
    authConfig(
      {
        status: filters.status,
        sort: filters.sort,
        order: filters.order,
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        groupId: filters.groupId,
        minWatchPercentage: filters.minWatchPercentage,
        maxWatchPercentage: filters.maxWatchPercentage,
        includeGroups: filters.includeGroups === false ? false : undefined,
      },
      filters.signal,
    ),
  );

  if (data?.success === false) {
    const err = new Error(data?.message || "تعذر تحميل تقرير المحاضرة");
    err.response = { data };
    throw err;
  }

  return data?.data ?? data;
}

export function lectureEngagementErrorMessage(err, fallback = "تعذر تحميل تقرير المحاضرة") {
  return err?.response?.data?.message || err?.message || fallback;
}

export const ENGAGEMENT_STATUS_META = {
  COMPLETED: { label: "مكتمل", colorScheme: "green" },
  PARTIALLY_COMPLETED: { label: "جزئي", colorScheme: "orange" },
  STARTED: { label: "بدأ", colorScheme: "blue" },
  NOT_STARTED: { label: "لم يبدأ", colorScheme: "gray" },
};
