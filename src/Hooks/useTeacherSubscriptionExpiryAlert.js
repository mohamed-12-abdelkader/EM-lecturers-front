import { useState, useEffect, useCallback } from "react";
import { fetchTeacherSubscriptionExpiryAlert } from "../api/financeApi";

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * @param {{ days?: number, grace_days?: number }} options
 */
export function useTeacherSubscriptionExpiryAlert(options = {}) {
  const { days = 3, grace_days = 3 } = options;
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchTeacherSubscriptionExpiryAlert({ days, grace_days });
      if (data?.show_alert && data?.alert) {
        setAlert(data.alert);
      } else {
        setAlert(null);
      }
    } catch {
      setAlert(null);
    } finally {
      setLoading(false);
    }
  }, [days, grace_days]);

  useEffect(() => {
    refresh();
    const intervalId = setInterval(refresh, ONE_HOUR_MS);
    return () => clearInterval(intervalId);
  }, [refresh]);

  return { alert, loading, refresh };
}
