/**
 * حفظ نتيجة تسجيل الدخول في localStorage بشكل موحّد.
 * يدعم الشكل المسطّح { token, user, employee_data, employee_permissions }
 * أو الغلاف الشائع { data: { token, user, ... } }.
 */
export function persistLoginSession(payload) {
  if (!payload || typeof payload !== "object") return;

  const inner =
    payload.data != null &&
    typeof payload.data === "object" &&
    ("token" in payload.data || "user" in payload.data)
      ? payload.data
      : payload;

  const token = inner.token;
  const user = inner.user ?? inner.Data ?? inner.data;

  if (token != null && String(token).trim() !== "") {
    localStorage.setItem("token", String(token));
  }

  if (user != null && typeof user === "object") {
    localStorage.setItem("user", JSON.stringify(user));
  }

  if ("employee_data" in inner) {
    localStorage.setItem("employee_data", JSON.stringify(inner.employee_data));
  } else {
    localStorage.removeItem("employee_data");
  }

  if ("employee_permissions" in inner) {
    localStorage.setItem("employee_permissions", JSON.stringify(inner.employee_permissions));
  } else {
    localStorage.removeItem("employee_permissions");
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-storage-update"));
  }
}

export function clearAuthSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("employee_data");
  localStorage.removeItem("employee_permissions");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-storage-update"));
  }
}
