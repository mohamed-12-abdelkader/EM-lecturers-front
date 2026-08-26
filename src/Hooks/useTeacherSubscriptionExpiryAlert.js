import { useQuery } from "@tanstack/react-query";
import { fetchTeacherSubscriptionExpiryAlert } from "../api/financeApi";

/**
 * @param {{ days?: number, grace_days?: number }} options
 */
export function useTeacherSubscriptionExpiryAlert(options = {}) {
  const { days = 3, grace_days = 3 } = options;

  const query = useQuery({
    queryKey: ["teacherSubscriptionExpiryAlert", days, grace_days],
    queryFn: async () => {
      const data = await fetchTeacherSubscriptionExpiryAlert({ days, grace_days });
      if (data?.show_alert && data?.alert) return data.alert;
      return null;
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: 60 * 60 * 1000,
    retry: 1,
  });

  return {
    alert: query.data ?? null,
    loading: query.isLoading && query.data === undefined,
    refresh: query.refetch,
  };
}
