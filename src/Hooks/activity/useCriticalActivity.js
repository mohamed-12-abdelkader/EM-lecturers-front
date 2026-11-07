import { useEffect, useId } from "react";
import applicationActivityManager from "../../utils/applicationActivityManager";

/**
 * يسجّل نشاطًا حرجًا طوال عمر المكوّن (أو طالما enabled=true).
 * @param {string} type — من ACTIVITY_TYPES
 * @param {{ enabled?: boolean, id?: string }} options
 */
export default function useCriticalActivity(type, { enabled = true, id } = {}) {
  const reactId = useId();
  const activityId = id != null ? String(id) : reactId;

  useEffect(() => {
    if (!enabled || !type) return undefined;
    return applicationActivityManager.startActivity(type, activityId);
  }, [type, activityId, enabled]);
}
