import { useQuery } from "@tanstack/react-query";
import { fetchCourseAssignmentReports } from "../../api/courseAssignmentReportsApi";

export function courseAssignmentReportsQueryKey(courseId, filters = {}) {
  return ["course-assignment-reports", courseId, filters];
}

export function useCourseAssignmentReports(courseId, filters = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: courseAssignmentReportsQueryKey(courseId, filters),
    queryFn: () => fetchCourseAssignmentReports(courseId, filters),
    enabled: Boolean(courseId) && enabled,
    staleTime: 60_000,
  });
}
