/**
 * جسر خفيف لتجنب دورة اعتماد بين chunkLoadRecovery و registerPWA.
 * يضع علامة تحديث معلّق ويُطلق حدث الواجهة إن أمكن.
 */

import { PWA_UPDATE_EVENT } from "./pwaEvents";

const PENDING_UPDATE_KEY = "em-app-update-pending";

export function notifyChunkMismatchUpdate() {
  try {
    localStorage.setItem(
      PENDING_UPDATE_KEY,
      JSON.stringify({
        at: Date.now(),
        source: "chunk-mismatch",
      }),
    );
  } catch {
    /* ignore */
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(PWA_UPDATE_EVENT, {
        detail: { source: "chunk-mismatch" },
      }),
    );
  }
}
