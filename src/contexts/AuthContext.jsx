import { createContext, useContext } from "react";

/**
 * حالة المصادقة:
 * - status: "checking" أثناء فحص الجلسة عند الإقلاع، ثم "authenticated" أو "guest".
 * - user: بيانات المستخدم أو null.
 */
export const AuthContext = createContext({
  status: "checking",
  user: null,
  isAuthenticated: false,
  refreshUser: async () => null,
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
