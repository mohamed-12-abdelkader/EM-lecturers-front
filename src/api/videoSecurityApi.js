import baseUrl from "./baseUrl";

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

function normalizePlaybackPayload(data, legacyUrl) {
  const root = data?.data ?? data ?? {};
  const sessionId =
    root.session_id || root.playback_session_id || `local-${Date.now()}`;

  if (root.manifest_url || root.hls_url) {
    return {
      sessionId,
      streamType: root.stream_type || "hls",
      manifestUrl: root.manifest_url || root.hls_url,
      dashUrl: root.dash_url || null,
      segmentToken: root.segment_token || root.playback_token || null,
      expiresAt: root.expires_at || null,
      drm: root.drm || null,
      watermark: root.watermark || {},
      resumePosition: Number(root.resume_position) || 0,
      viewId: root.view_id || root.forensic_id || sessionId,
    };
  }

  const url = legacyUrl || root.video_url || root.url || "";
  if (!url) return null;

  if (/\.m3u8(\?|$)/i.test(url)) {
    return {
      sessionId,
      streamType: "hls",
      manifestUrl: url,
      segmentToken: root.segment_token || null,
      expiresAt: root.expires_at || null,
      drm: root.drm || null,
      watermark: root.watermark || {},
      resumePosition: 0,
      viewId: sessionId,
    };
  }

  if (/\.mpd(\?|$)/i.test(url)) {
    return {
      sessionId,
      streamType: "dash",
      dashUrl: url,
      segmentToken: root.segment_token || null,
      expiresAt: root.expires_at || null,
      drm: root.drm || null,
      watermark: root.watermark || {},
      resumePosition: 0,
      viewId: sessionId,
    };
  }

  if (/youtube\.com|youtu\.be/i.test(url)) {
    return {
      sessionId,
      streamType: "youtube",
      youtubeUrl: url,
      watermark: root.watermark || {},
      resumePosition: 0,
      viewId: sessionId,
    };
  }

  if (/mediadelivery\.net|bunny\.net/i.test(url)) {
    return {
      sessionId,
      streamType: "bunny",
      embedUrl: url,
      watermark: root.watermark || {},
      resumePosition: 0,
      viewId: sessionId,
    };
  }

  return {
    sessionId,
    streamType: "progressive",
    progressiveUrl: url,
    watermark: root.watermark || {},
    resumePosition: 0,
    viewId: sessionId,
  };
}

/**
 * يحاول endpoint الأمان أولاً ثم يرجع للـ API الحالي.
 */
export async function fetchSecurePlayback(videoId, token) {
  const headers = authHeaders(token);

  try {
    const { data } = await baseUrl.get(
      `/api/course/video/${videoId}/secure-playback`,
      { headers },
    );
    const normalized = normalizePlaybackPayload(data);
    if (normalized) return normalized;
  } catch (err) {
    if (err?.response?.status && err.response.status !== 404) {
      throw err;
    }
  }

  const { data } = await baseUrl.get(`/api/course/video/${videoId}`, { headers });
  const normalized = normalizePlaybackPayload(data, data?.video_url);
  if (!normalized) {
    throw new Error("تعذر تحميل بيانات التشغيل الآمن");
  }
  return normalized;
}

export async function sendPlaybackHeartbeat(videoId, sessionId, token, payload = {}) {
  try {
    await baseUrl.post(
      `/api/course/video/${videoId}/heartbeat`,
      { session_id: sessionId, ...payload },
      { headers: authHeaders(token) },
    );
  } catch {
    /* لا نوقف المشاهدة عند فشل النبض */
  }
}

export async function logVideoSecurityEvent(videoId, sessionId, token, event) {
  const body = {
    session_id: sessionId,
    event: event.type,
    message: event.message || "",
    metadata: event.metadata || {},
    occurred_at: new Date().toISOString(),
  };

  try {
    await baseUrl.post(
      `/api/course/video/${videoId}/security-events`,
      body,
      { headers: authHeaders(token) },
    );
  } catch {
    try {
      const key = `video-security-queue:${videoId}`;
      const queue = JSON.parse(localStorage.getItem(key) || "[]");
      queue.push(body);
      localStorage.setItem(key, JSON.stringify(queue.slice(-50)));
    } catch {
      /* ignore */
    }
  }
}
