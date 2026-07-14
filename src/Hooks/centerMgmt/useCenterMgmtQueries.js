import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../../api/centerMgmtApi";

export const centerMgmtKeys = {
  all: ["teacher-center"],
  dashboard: (params) => [...centerMgmtKeys.all, "dashboard", params],
  grades: () => [...centerMgmtKeys.all, "grades"],
  groups: (params) => [...centerMgmtKeys.all, "groups", params],
  group: (groupId) => [...centerMgmtKeys.all, "group", String(groupId)],
  groupStudents: (groupId) => [...centerMgmtKeys.all, "group-students", String(groupId)],
  students: (params) => [...centerMgmtKeys.all, "students", params],
  student: (studentId) => [...centerMgmtKeys.all, "student", String(studentId)],
  studentQr: (studentId) => [...centerMgmtKeys.all, "student-qr", String(studentId)],
  studentAttendance: (studentId, params) => [
    ...centerMgmtKeys.all,
    "student-attendance",
    String(studentId),
    params,
  ],
  studentAttendanceReport: (studentId, params) => [
    ...centerMgmtKeys.all,
    "student-attendance-report",
    String(studentId),
    params,
  ],
  groupAttendanceReport: (groupId, params) => [
    ...centerMgmtKeys.all,
    "group-attendance-report",
    String(groupId),
    params,
  ],
  attendance: (params) => [...centerMgmtKeys.all, "attendance", params],
  months: () => [...centerMgmtKeys.all, "months"],
  billingMonth: (year, month, params) => [
    ...centerMgmtKeys.all,
    "billing-month",
    String(year),
    String(month),
    params,
  ],
  payments: (params) => [...centerMgmtKeys.all, "payments", params],
};

function invalidateCore(qc) {
  qc.invalidateQueries({ queryKey: centerMgmtKeys.all });
}

export function usePlatformGrades() {
  return useQuery({
    queryKey: centerMgmtKeys.grades(),
    queryFn: api.fetchPlatformGrades,
  });
}

export function useDashboard(params = {}) {
  return useQuery({
    queryKey: centerMgmtKeys.dashboard(params),
    queryFn: () => api.fetchDashboard(params),
  });
}

export function useGroups(params = {}) {
  return useQuery({
    queryKey: centerMgmtKeys.groups(params),
    queryFn: () => api.fetchGroups(params),
  });
}

export function useGroup(groupId) {
  return useQuery({
    queryKey: centerMgmtKeys.group(groupId),
    queryFn: () => api.fetchGroup(groupId),
    enabled: Boolean(groupId),
  });
}

export function useGroupStudents(groupId) {
  return useQuery({
    queryKey: centerMgmtKeys.groupStudents(groupId),
    queryFn: () => api.fetchGroupStudents(groupId),
    enabled: Boolean(groupId),
  });
}

export function useStudents(params = {}) {
  return useQuery({
    queryKey: centerMgmtKeys.students(params),
    queryFn: () => api.fetchStudents(params),
  });
}

export function useStudent(studentId) {
  return useQuery({
    queryKey: centerMgmtKeys.student(studentId),
    queryFn: () => api.fetchStudent(studentId),
    enabled: Boolean(studentId),
  });
}

export function useStudentQr(studentId) {
  return useQuery({
    queryKey: centerMgmtKeys.studentQr(studentId),
    queryFn: () => api.fetchStudentQr(studentId),
    enabled: Boolean(studentId),
  });
}

export function useStudentAttendanceReport(studentId, params = {}) {
  return useQuery({
    queryKey: centerMgmtKeys.studentAttendanceReport(studentId, params),
    queryFn: () => api.fetchStudentAttendanceReport(studentId, params),
    enabled: Boolean(studentId),
  });
}

export function useGroupAttendanceReport(groupId, params = {}) {
  return useQuery({
    queryKey: centerMgmtKeys.groupAttendanceReport(groupId, params),
    queryFn: () => api.fetchGroupAttendanceReport(groupId, params),
    enabled: Boolean(groupId),
  });
}

export function useAttendance(params = {}) {
  return useQuery({
    queryKey: centerMgmtKeys.attendance(params),
    queryFn: () => api.fetchAttendance(params),
    enabled: Boolean(params.group_id || params.groupId),
  });
}

export function useBillingMonths() {
  return useQuery({
    queryKey: centerMgmtKeys.months(),
    queryFn: api.fetchBillingMonths,
  });
}

export function useBillingMonth(year, month, params = {}) {
  return useQuery({
    queryKey: centerMgmtKeys.billingMonth(year, month, params),
    queryFn: () => api.fetchBillingMonth(year, month, params),
    enabled: Boolean(year && month),
  });
}

export function usePayments(params = {}) {
  return useQuery({
    queryKey: centerMgmtKeys.payments(params),
    queryFn: () => api.fetchPayments(params),
  });
}

export function useGroupMutations() {
  const qc = useQueryClient();
  return {
    createGroup: useMutation({
      mutationFn: api.createGroup,
      onSuccess: () => invalidateCore(qc),
    }),
    updateGroup: useMutation({
      mutationFn: ({ groupId, payload }) => api.updateGroup(groupId, payload),
      onSuccess: () => invalidateCore(qc),
    }),
    deleteGroup: useMutation({
      mutationFn: (groupId) => api.deleteGroup(groupId),
      onSuccess: () => invalidateCore(qc),
    }),
  };
}

export function useStudentMutations() {
  const qc = useQueryClient();
  return {
    addStudentToGroup: useMutation({
      mutationFn: ({ groupId, payload }) => api.addStudentToGroup(groupId, payload),
      onSuccess: () => invalidateCore(qc),
    }),
    updateStudent: useMutation({
      mutationFn: ({ studentId, payload }) => api.updateStudent(studentId, payload),
      onSuccess: () => invalidateCore(qc),
    }),
    deleteStudent: useMutation({
      mutationFn: (studentId) => api.deleteStudent(studentId),
      onSuccess: () => invalidateCore(qc),
    }),
    enrollStudent: useMutation({
      mutationFn: ({ studentId, groupId }) => api.enrollStudent(studentId, groupId),
      onSuccess: () => invalidateCore(qc),
    }),
    unenrollStudent: useMutation({
      mutationFn: ({ studentId, groupId }) => api.unenrollStudent(studentId, groupId),
      onSuccess: () => invalidateCore(qc),
    }),
  };
}

export function useAttendanceMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "attendance"] });
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "dashboard"] });
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "student-attendance"] });
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "student-attendance-report"] });
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "group-attendance-report"] });
  };

  return {
    scan: useMutation({
      mutationFn: api.scanAttendance,
      onSuccess: invalidate,
    }),
    record: useMutation({
      mutationFn: api.recordManualAttendance,
      onSuccess: invalidate,
    }),
    bulk: useMutation({
      mutationFn: api.bulkRecordAttendance,
      onSuccess: invalidate,
    }),
  };
}

export function useBillingMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "billing-month"] });
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "months"] });
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "dashboard"] });
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "payments"] });
  };

  return {
    openMonth: useMutation({
      mutationFn: api.openBillingMonth,
      onSuccess: invalidate,
    }),
    updateSubscription: useMutation({
      mutationFn: ({ subscriptionId, payload }) =>
        api.updateSubscription(subscriptionId, payload),
      onSuccess: invalidate,
    }),
    bulkUpdate: useMutation({
      mutationFn: api.bulkUpdateSubscriptions,
      onSuccess: invalidate,
    }),
  };
}

export function usePaymentMutations() {
  const qc = useQueryClient();
  return {
    createPayment: useMutation({
      mutationFn: api.createPayment,
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "payments"] });
        qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "billing-month"] });
        qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "dashboard"] });
      },
    }),
  };
}
