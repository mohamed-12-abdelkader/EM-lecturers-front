import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addCourseGroupStudent,
  createTeacherCourseGroup,
  deleteTeacherCourseGroup,
  fetchCourseGroupSettings,
  fetchCourseGroupStudents,
  fetchMyCourseGroupMembership,
  fetchPublicCourseGroups,
  fetchPublicRegistrationSettings,
  fetchTeacherCourseGroups,
  removeCourseGroupStudent,
  setMyCourseGroupMembership,
  updateCourseGroupSettings,
  updateTeacherCourseGroup,
} from "../../api/courseGroupsApi";

export const courseGroupSettingsKey = ["courseGroupSettings"];
export const teacherCourseGroupsKey = (gradeId) => [
  "teacherCourseGroups",
  gradeId != null ? String(gradeId) : "all",
];
export const courseGroupStudentsKey = (groupId) => ["courseGroupStudents", String(groupId)];
export const myCourseGroupMembershipKey = ["myCourseGroupMembership"];
export const publicRegistrationSettingsKey = (subdomain) => [
  "publicRegistrationSettings",
  subdomain,
];
export const publicCourseGroupsKey = (subdomain, gradeId) => [
  "publicCourseGroups",
  subdomain,
  String(gradeId),
];

export function useCourseGroupSettings({ enabled = true } = {}) {
  return useQuery({
    queryKey: courseGroupSettingsKey,
    queryFn: fetchCourseGroupSettings,
    enabled,
    staleTime: 30_000,
  });
}

export function useUpdateCourseGroupSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCourseGroupSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseGroupSettingsKey });
    },
  });
}

export function useTeacherCourseGroups(gradeId, { enabled = true } = {}) {
  return useQuery({
    queryKey: teacherCourseGroupsKey(gradeId),
    queryFn: () =>
      fetchTeacherCourseGroups(
        gradeId != null && gradeId !== "" ? { grade_id: gradeId } : {},
      ),
    enabled,
    staleTime: 20_000,
  });
}

export function useCourseGroupMutations() {
  const queryClient = useQueryClient();

  const invalidateGroups = () => {
    queryClient.invalidateQueries({ queryKey: ["teacherCourseGroups"] });
  };

  const createGroup = useMutation({
    mutationFn: createTeacherCourseGroup,
    onSuccess: invalidateGroups,
  });

  const updateGroup = useMutation({
    mutationFn: ({ groupId, payload }) => updateTeacherCourseGroup(groupId, payload),
    onSuccess: invalidateGroups,
  });

  const deleteGroup = useMutation({
    mutationFn: deleteTeacherCourseGroup,
    onSuccess: invalidateGroups,
  });

  return { createGroup, updateGroup, deleteGroup };
}

export function useCourseGroupStudents(groupId, { enabled = true } = {}) {
  return useQuery({
    queryKey: courseGroupStudentsKey(groupId),
    queryFn: () => fetchCourseGroupStudents(groupId),
    enabled: Boolean(groupId) && enabled,
    staleTime: 15_000,
  });
}

export function useCourseGroupStudentMutations(groupId) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: courseGroupStudentsKey(groupId) });
    queryClient.invalidateQueries({ queryKey: ["teacherCourseGroups"] });
  };

  const addStudent = useMutation({
    mutationFn: (studentId) => addCourseGroupStudent(groupId, studentId),
    onSuccess: invalidate,
  });

  const removeStudent = useMutation({
    mutationFn: (studentId) => removeCourseGroupStudent(groupId, studentId),
    onSuccess: invalidate,
  });

  return { addStudent, removeStudent };
}

export function useMyCourseGroupMembership({ enabled = true } = {}) {
  return useQuery({
    queryKey: myCourseGroupMembershipKey,
    queryFn: fetchMyCourseGroupMembership,
    enabled,
    staleTime: 30_000,
    retry: false,
  });
}

export function useSetMyCourseGroupMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setMyCourseGroupMembership,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myCourseGroupMembershipKey });
    },
  });
}

export function usePublicRegistrationSettings(subdomain, { enabled = true } = {}) {
  return useQuery({
    queryKey: publicRegistrationSettingsKey(subdomain),
    queryFn: () => fetchPublicRegistrationSettings(subdomain),
    enabled: Boolean(subdomain) && enabled,
    staleTime: 60_000,
  });
}

export function usePublicCourseGroups(subdomain, gradeId, { enabled = true } = {}) {
  return useQuery({
    queryKey: publicCourseGroupsKey(subdomain, gradeId),
    queryFn: () => fetchPublicCourseGroups(subdomain, gradeId),
    enabled: Boolean(subdomain) && Boolean(gradeId) && enabled,
    staleTime: 30_000,
  });
}
