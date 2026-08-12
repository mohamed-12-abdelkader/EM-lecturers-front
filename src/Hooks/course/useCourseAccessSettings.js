import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCourseAccessSettings,
  updateCourseAccessSettings,
} from "../../api/courseAccessApi";

export function courseAccessSettingsQueryKey(courseId) {
  return ["courseAccessSettings", String(courseId)];
}

export function useCourseAccessSettings(courseId, { enabled = true } = {}) {
  return useQuery({
    queryKey: courseAccessSettingsQueryKey(courseId),
    queryFn: () => fetchCourseAccessSettings(courseId),
    enabled: Boolean(courseId) && enabled,
    staleTime: 60_000,
  });
}

export function useUpdateCourseAccessSettings(courseId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => updateCourseAccessSettings(courseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseAccessSettingsQueryKey(courseId) });
      queryClient.invalidateQueries({ queryKey: ["courseDetails", String(courseId)] });
      queryClient.invalidateQueries({ queryKey: ["courseAssignments", String(courseId)] });
    },
  });
}
