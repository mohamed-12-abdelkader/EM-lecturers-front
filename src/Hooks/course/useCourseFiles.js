import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteCourseFile,
  getCourseFile,
  getCourseFiles,
  getLectureFiles,
  getCourseFileView,
  updateCourseFile,
  uploadCourseFile,
  uploadLectureFile,
} from "../../api/courseFilesApi";

export function courseFilesQueryKey(courseId) {
  return ["courseFiles", String(courseId)];
}

export function courseFileQueryKey(fileId) {
  return ["courseFile", String(fileId)];
}

function retryUnlessAuthError(failureCount, error) {
  const status = error?.response?.status;
  if (status === 401 || status === 403 || status === 404 || status === 413 || status === 422) {
    return false;
  }
  return failureCount < 1;
}

export function useCourseFiles(courseId, { enabled = true } = {}) {
  return useQuery({
    queryKey: courseFilesQueryKey(courseId),
    queryFn: () => getCourseFiles(courseId),
    enabled: Boolean(courseId) && enabled,
    staleTime: 30_000,
    retry: retryUnlessAuthError,
  });
}

export function useCourseFile(fileId, { enabled = true } = {}) {
  return useQuery({
    queryKey: courseFileQueryKey(fileId),
    queryFn: () => getCourseFile(fileId),
    enabled: Boolean(fileId) && enabled,
    staleTime: 30_000,
    retry: retryUnlessAuthError,
  });
}

export function useLectureFileMutations(lectureId, courseId) {
  const queryClient = useQueryClient();

  const invalidate = (fileId) => {
    queryClient.invalidateQueries({ queryKey: lectureFilesQueryKey(lectureId) });
    if (courseId) {
      queryClient.invalidateQueries({ queryKey: courseFilesQueryKey(courseId) });
    }
    if (fileId != null) {
      queryClient.invalidateQueries({ queryKey: courseFileQueryKey(fileId) });
    }
  };

  const uploadMutation = useMutation({
    mutationFn: ({ onUploadProgress, ...payload }) =>
      uploadLectureFile(lectureId, payload, onUploadProgress),
    onSuccess: () => invalidate(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ fileId, ...payload }) => updateCourseFile(fileId, payload),
    onSuccess: (_data, variables) => invalidate(variables?.fileId),
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId) => deleteCourseFile(fileId),
    onSuccess: (_data, fileId) => invalidate(fileId),
  });

  return { uploadMutation, updateMutation, deleteMutation };
}

export function lectureFilesQueryKey(lectureId) {
  return ["lectureFiles", String(lectureId)];
}

export function useLectureFiles(lectureId, { enabled = true, initialData, placeholderData } = {}) {
  return useQuery({
    queryKey: lectureFilesQueryKey(lectureId),
    queryFn: () => getLectureFiles(lectureId),
    enabled: Boolean(lectureId) && enabled,
    initialData,
    placeholderData,
    staleTime: 30_000,
    retry: retryUnlessAuthError,
  });
}

export function useCourseFileMutations(courseId) {
  const queryClient = useQueryClient();

  const invalidate = (fileId) => {
    queryClient.invalidateQueries({ queryKey: courseFilesQueryKey(courseId) });
    if (fileId != null) {
      queryClient.invalidateQueries({ queryKey: courseFileQueryKey(fileId) });
    }
  };

  const uploadMutation = useMutation({
    mutationFn: ({ onUploadProgress, ...payload }) =>
      uploadCourseFile(courseId, payload, onUploadProgress),
    onSuccess: () => invalidate(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ fileId, ...payload }) => updateCourseFile(fileId, payload),
    onSuccess: (_data, variables) => invalidate(variables?.fileId),
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId) => deleteCourseFile(fileId),
    onSuccess: (_data, fileId) => invalidate(fileId),
  });

  return { uploadMutation, updateMutation, deleteMutation };
}

/**
 * يجلب PDF كـ Blob لجلسة العرض فقط.
 * لا يُحفظ في persist ولا يُعاد استخدامه بعد مغادرة العارض.
 */
export function useCourseFileView(fileId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ["courseFileView", String(fileId)],
    queryFn: () => getCourseFileView(fileId),
    enabled: Boolean(fileId) && enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: retryUnlessAuthError,
  });
}
