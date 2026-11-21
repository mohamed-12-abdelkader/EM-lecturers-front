/** Format meeting datetime for Arabic (Cairo) display. */
export function formatMeetingDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("ar-EG", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Convert ISO/date string to datetime-local input value (browser local). */
export function toDatetimeLocalValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Convert datetime-local value to ISO string for API, or null if empty. */
export function fromDatetimeLocalValue(localValue) {
  if (!localValue || !String(localValue).trim()) return null;
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function isScheduledInFuture(scheduledStartAt, status) {
  if (!scheduledStartAt || status === "started" || status === "ended") return false;
  const t = new Date(scheduledStartAt).getTime();
  return !Number.isNaN(t) && t > Date.now();
}
