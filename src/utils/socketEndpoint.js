import { getResolvedApiTarget } from "../api/apiConfig";

/**
 * نقطة اتصال Socket.IO — دائماً عنوان الـ API الفعلي (ليس دومين الواجهة).
 */
export function getSocketEndpoint() {
  return getResolvedApiTarget();
}
