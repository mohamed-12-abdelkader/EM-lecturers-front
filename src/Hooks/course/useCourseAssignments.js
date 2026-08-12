import { useQuery } from "@tanstack/react-query";
import { fetchCourseAssignments } from "../../api/courseAccessApi";

export function courseAssignmentsQueryKey(courseId) {
  return ["courseAssignments", String(courseId)];
}

export function useCourseAssignments(courseId, { enabled = true } = {}) {
  return useQuery({
    queryKey: courseAssignmentsQueryKey(courseId),
    queryFn: () => fetchCourseAssignments(courseId),
    enabled: Boolean(courseId) && enabled,
    staleTime: 30_000,
  });
}
