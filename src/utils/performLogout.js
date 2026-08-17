import { logoutRequest } from "../services/authService";
import { clearAuthSession, readStoredUser } from "./authStorage";
import { getTenantSubdomain, withTenantQuery } from "./tenantHost";

const EXAM_LOCAL_KEYS = ["examAnswers", "examTimeLeft"];
const LOGOUT_SERVER_TIMEOUT_MS = 2500;

function resolveLogoutLoginPath(user) {
  const role = String(user?.role || "").toLowerCase();
  if (role === "teacher") return "/teacher-login";
  return "/login";
}

function clearExamLocalState() {
  EXAM_LOCAL_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
}

function navigateToLogin(redirect) {
  try {
    window.location.replace(redirect);
  } catch {
    window.location.href = redirect || "/login";
  }
}

/**
 * تسجيل خروج فوري: يلغي الجلسة على الخادم أولاً ثم يمسحها محلياً وينقل لصفحة الدخول.
 */
export async function performLogout({ redirectTo } = {}) {
  if (typeof window === "undefined") return;

  const user = readStoredUser();
  const loginPath = redirectTo || resolveLogoutLoginPath(user);
  const redirect = withTenantQuery(loginPath, getTenantSubdomain());

  clearExamLocalState();

  try {
    await Promise.race([
      logoutRequest(),
      new Promise((resolve) => {
        window.setTimeout(resolve, LOGOUT_SERVER_TIMEOUT_MS);
      }),
    ]);
  } catch {
    // نكمل الخروج المحلي حتى لو فشل الخادم
  }

  try {
    clearAuthSession({ broadcast: true });
  } catch {
    // ignore
  }

  navigateToLogin(redirect);
}

export { resolveLogoutLoginPath };
