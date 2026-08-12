/** استخراج معرف ملف Google Drive من رابط المشاركة */
export function getGoogleDriveFileId(url) {
  if (!url) return null;
  const match = String(url).match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  return match?.[1] || null;
}

export function isGoogleDriveUrl(url) {
  return /drive\.google\.com/i.test(String(url || ""));
}

/** رابط embed الرسمي — يعمل داخل iframe */
export function getGoogleDrivePreviewUrl(urlOrId) {
  const id =
    getGoogleDriveFileId(urlOrId) ||
    (typeof urlOrId === "string" && /^[a-zA-Z0-9_-]+$/.test(urlOrId) ? urlOrId : null);
  return id ? `https://drive.google.com/file/d/${id}/preview` : null;
}

/** Google Docs Viewer — يحتاج صلاحية «تحميل» على الملف (لا يُستخدم افتراضياً) */
export function getGoogleDriveGviewEmbedUrl(urlOrId) {
  const id =
    getGoogleDriveFileId(urlOrId) ||
    (typeof urlOrId === "string" && /^[a-zA-Z0-9_-]+$/.test(urlOrId) ? urlOrId : null);
  if (!id) return null;
  const drivePdfUrl = `https://drive.google.com/uc?export=view&id=${id}`;
  return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(drivePdfUrl)}`;
}

/** رابط الفتح الكامل في Google Drive */
export function getGoogleDriveViewUrl(urlOrId) {
  const id =
    getGoogleDriveFileId(urlOrId) ||
    (typeof urlOrId === "string" && /^[a-zA-Z0-9_-]+$/.test(urlOrId) ? urlOrId : null);
  return id ? `https://drive.google.com/file/d/${id}/view` : null;
}

/** embed داخل الموقع — /preview يعمل بصلاحية «عرض» فقط */
export function getGoogleDriveInAppEmbedUrl(urlOrId) {
  return getGoogleDrivePreviewUrl(urlOrId);
}
