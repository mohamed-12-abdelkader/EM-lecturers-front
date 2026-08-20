const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
  "www.youtu.be",
]);

function safeUrl(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed);
  } catch {
    try {
      return new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }
}

export function isYouTubeUrl(value) {
  const parsed = safeUrl(value);
  if (!parsed) return false;
  return YOUTUBE_HOSTS.has(parsed.hostname.toLowerCase());
}

/**
 * يستخرج VIDEO_ID من صيغ YouTube الشائعة أو من المعرف نفسه.
 * يعيد null إذا كان الرابط فارغًا أو غير صالح.
 */
export function getYouTubeVideoId(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (YOUTUBE_ID_RE.test(trimmed)) return trimmed;

  const parsed = safeUrl(trimmed);
  if (!parsed) return null;

  const host = parsed.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) return null;

  if (host === "youtu.be" || host === "www.youtu.be") {
    const id = parsed.pathname.split("/").filter(Boolean)[0] || "";
    return YOUTUBE_ID_RE.test(id) ? id : null;
  }

  const fromQuery = parsed.searchParams.get("v");
  if (fromQuery && YOUTUBE_ID_RE.test(fromQuery)) return fromQuery;

  const parts = parsed.pathname.split("/").filter(Boolean);
  const marker = parts.findIndex((part) =>
    ["embed", "shorts", "live", "v"].includes(part.toLowerCase()),
  );
  if (marker >= 0 && parts[marker + 1]) {
    const id = parts[marker + 1];
    return YOUTUBE_ID_RE.test(id) ? id : null;
  }

  return null;
}

/**
 * ينشئ رابط embed موحّد بدون تكرار parameters.
 * @param {string|null|undefined} url
 * @param {Record<string, string|number|boolean>} extraParams
 * @returns {string|null}
 */
export function getYouTubeEmbedUrl(url, extraParams = {}) {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;

  const params = new URLSearchParams();
  params.set("cc_load_policy", "0");
  params.set("rel", "0");

  if (extraParams && typeof extraParams === "object") {
    Object.entries(extraParams).forEach(([key, value]) => {
      if (value == null || value === "") return;
      if (params.has(key)) return;
      params.set(key, String(value));
    });
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/** خيارات YouTube لـ Plyr / IFrame API — بدون تكرار parameters */
export const YOUTUBE_PLYR_OPTIONS = {
  rel: 0,
  cc_load_policy: 0,
};
