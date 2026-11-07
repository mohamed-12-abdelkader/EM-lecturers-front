/** معرّف البناء المضمّن أثناء Vite build */
export function getRunningBuildId() {
  try {
    if (typeof __APP_BUILD_ID__ !== "undefined" && __APP_BUILD_ID__) {
      return String(__APP_BUILD_ID__);
    }
  } catch {
    /* ignore */
  }
  return "";
}

/**
 * يجلب version.json من السيرفر بدون كاش.
 * @returns {Promise<{ buildId: string, builtAt?: string } | null>}
 */
export async function fetchDeployedVersion() {
  if (typeof window === "undefined") return null;
  try {
    const response = await fetch(`/version.json?_=${Date.now()}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const data = await response.json();
    const buildId = String(data?.buildId || data?.version || "").trim();
    if (!buildId) return null;
    return {
      buildId,
      builtAt: data?.builtAt || data?.built_at || null,
    };
  } catch {
    return null;
  }
}

export function isNewerBuild(remoteBuildId, localBuildId = getRunningBuildId()) {
  if (!remoteBuildId || !localBuildId) return false;
  return String(remoteBuildId) !== String(localBuildId);
}
