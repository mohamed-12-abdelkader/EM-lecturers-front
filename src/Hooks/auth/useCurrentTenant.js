import { useMemo } from "react";
import { getCurrentTenant } from "../utils/tenantHost";
import { getAuthScopeSubdomain } from "../utils/tenantAuthStorage";

/**
 * Tenant الحالي للـ UI — hostname أولاً، ثم scope التخزين (dev/query).
 */
export function useCurrentTenant() {
  return useMemo(
    () => getCurrentTenant() || getAuthScopeSubdomain(),
    [],
  );
}

export default useCurrentTenant;
