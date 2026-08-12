import { lazy } from "react";
import { isChunkLoadError, recoverFromChunkError } from "./chunkLoadRecovery";

const DEFAULT_RETRIES = 2;
const RETRY_DELAY_MS = 400;

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * lazy() مع إعادة محاولة — يقلّل شاشة «تعذّر فتح الصفحة» بعد نشر تحديث أو SW قديم.
 */
export function lazyWithRetry(importer, retries = DEFAULT_RETRIES) {
  return lazy(async () => {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await importer();
      } catch (error) {
        lastError = error;
        const message = String(error?.message || error || "");
        const looksLikeStaleModule =
          /Unexpected token '<'/i.test(message) ||
          /Failed to fetch dynamically imported module/i.test(message);
        if (!isChunkLoadError(error) || attempt === retries) break;
        if (looksLikeStaleModule && attempt === 0) {
          await wait(RETRY_DELAY_MS);
          continue;
        }
        await wait(RETRY_DELAY_MS * (attempt + 1));
      }
    }

    if (recoverFromChunkError(lastError)) {
      return new Promise(() => {});
    }

    throw lastError;
  });
}
