import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteCourseFile,
  fetchCourseFiles,
  uploadCourseFile,
} from "../../api/courseFilesApi";

export function courseFilesQueryKey(courseId) {
  return ["courseFiles", String(courseId)];
}

export function useCourseFiles(courseId, { enabled = true } = {}) {
  return useQuery({
    queryKey: courseFilesQueryKey(courseId),
    queryFn: () => fetchCourseFiles(courseId),
    enabled: Boolean(courseId) && enabled,
    staleTime: 30_000,
  });
}

export function useCourseFileMutations(courseId) {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: courseFilesQueryKey(courseId) });

  const uploadMutation = useMutation({
    mutationFn: (payload) => uploadCourseFile(courseId, payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId) => deleteCourseFile(courseId, fileId),
    onSuccess: invalidate,
  });

  return { uploadMutation, deleteMutation };
}
