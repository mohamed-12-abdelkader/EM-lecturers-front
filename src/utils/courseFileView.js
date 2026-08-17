import {
  getGoogleDriveFileId,
  getGoogleDriveInAppEmbedUrl,
  getGoogleDrivePreviewUrl,
  getGoogleDriveViewUrl,
  isGoogleDriveUrl,
} from "./googleDriveEmbed";
import { resolveCourseFileAbsoluteUrl } from "../api/courseFilesApi";

/** ملفات PDF محلية مرتبطة بمعرف Drive — ضع الملف في public/course-files/ */
export const LOCAL_DRIVE_PDF_MAP = {
  "1Re14IJ46PX4JDvtDU7rqiqAsDTgVIA6E": "/course-files/first-lecture.pdf",
};

export function buildCourseFileViewPath(courseId, file) {
  const url = file?.file_url || file?.url || file?.link;
  if (!courseId || !url) return null;

  const name = file.name || file.filename || file.title || "ملف";
  const title = encodeURIComponent(name);
  const encodedUrl = encodeURIComponent(url);
  const fileId = file?.id;

  if (fileId != null && fileId !== "") {
    return `/CourseDetailsPage/${courseId}/file/${fileId}?title=${title}&url=${encodedUrl}`;
  }

  const driveId = getGoogleDriveFileId(url);
  if (driveId) {
    return `/CourseDetailsPage/${courseId}/file/${driveId}?title=${title}&url=${encodedUrl}`;
  }

  return `/CourseDetailsPage/${courseId}/file/view?title=${title}&url=${encodedUrl}`;
}

export function getCourseFileViewBackPath(courseId, section = "files") {
  return `/CourseDetailsPage/${courseId}?section=${section}`;
}

export function isDirectPdfUrl(url) {
  if (!url || typeof url !== "string") return false;
  return /\.pdf(\?|$)/i.test(url);
}

export function isDriveFileView({ fileId, url }) {
  if (getGoogleDriveFileId(url)) return true;
  if (fileId && fileId !== "view" && !/^\d+$/.test(String(fileId))) return true;
  return false;
}

export function resolveCourseFileOpenUrl({ fileId, url }) {
  if (url) return resolveCourseFileAbsoluteUrl(url) || url;
  if (fileId && fileId !== "view" && !/^\d+$/.test(String(fileId))) {
    return getGoogleDriveViewUrl(fileId);
  }
  return getGoogleDriveViewUrl(url) || url || null;
}

/** مسارات PDF محلية (same-origin) لعرض pdf.js */
export function getLocalPdfCandidates({ fileId, url }) {
  const candidates = [];

  if (fileId && fileId !== "view") {
    if (LOCAL_DRIVE_PDF_MAP[fileId]) candidates.push(LOCAL_DRIVE_PDF_MAP[fileId]);
    candidates.push(`/course-files/${fileId}.pdf`);
  }

  if (url && !isGoogleDriveUrl(url)) {
    const resolved = resolveCourseFileAbsoluteUrl(url) || url;
    if (resolved.startsWith("/")) {
      candidates.push(resolved);
    } else if (typeof window !== "undefined" && resolved.startsWith(window.location.origin)) {
      try {
        candidates.push(new URL(resolved).pathname);
      } catch {
        candidates.push(resolved);
      }
    } else if (/^https?:\/\//i.test(resolved)) {
      candidates.push(resolved);
    }
  }

  return [...new Set(candidates)];
}

export async function resolveLocalPdfUrl({ fileId, url }) {
  const candidates = getLocalPdfCandidates({ fileId, url });
  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, {
        method: "GET",
        headers: { Range: "bytes=0-4" },
      });

      // 204 / 404 / HTML fallback — ليس PDF حقيقي
      if (res.status === 204 || res.status === 404) continue;
      if (!res.ok && res.status !== 206) continue;

      const buffer = await res.arrayBuffer();
      if (buffer.byteLength < 4) continue;

      const magic = new TextDecoder().decode(new Uint8Array(buffer.slice(0, 4)));
      if (magic === "%PDF") return candidate;
    } catch {
      // try next
    }
  }
  return null;
}

export function getDrivePdfProxyUrl(fileIdOrUrl) {
  const id =
    getGoogleDriveFileId(fileIdOrUrl) ||
    (typeof fileIdOrUrl === "string" && /^[a-zA-Z0-9_-]+$/.test(fileIdOrUrl) ? fileIdOrUrl : null);
  return id ? `/drive-pdf/${id}` : null;
}

export function resolveCourseFileEmbedSrc({ fileId, url }) {
  if (fileId && fileId !== "view") {
    return getGoogleDriveInAppEmbedUrl(fileId);
  }
  return getGoogleDriveInAppEmbedUrl(url) || getGoogleDrivePreviewUrl(url) || url || null;
}

/** @deprecated use resolveCourseFileEmbedSrc */
export function resolveCourseFilePreviewSrc(args) {
  return resolveCourseFileEmbedSrc(args);
}
