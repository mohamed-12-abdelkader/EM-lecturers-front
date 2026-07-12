import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../../api/centerMgmtApi";

export const centerMgmtKeys = {
  all: ["center-mgmt"],
  dashboard: (params) => [...centerMgmtKeys.all, "dashboard", params],
  finance: (params) => [...centerMgmtKeys.all, "finance", params],
  activity: (params) => [...centerMgmtKeys.all, "activity", params],
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
  attendanceToday: (params) => [...centerMgmtKeys.all, "attendance-today", params],
  months: () => [...centerMgmtKeys.all, "months"],
  subscriptions: (year, month, params) => [
    ...centerMgmtKeys.all,
    "subscriptions",
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

export function useFinanceReport(params = {}) {
  return useQuery({
    queryKey: centerMgmtKeys.finance(params),
    queryFn: () => api.fetchFinanceReport(params),
  });
}

export function useActivityLogs(params = { limit: 20 }) {
  return useQuery({
    queryKey: centerMgmtKeys.activity(params),
    queryFn: () => api.fetchActivityLogs(params),
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
    queryKey: centerMgmtKeys.studentAttendance(studentId, params),
    queryFn: () => api.fetchStudentAttendanceReport(studentId, params),
    enabled: Boolean(studentId),
  });
}

export function useTodayAttendance(params = {}) {
  return useQuery({
    queryKey: centerMgmtKeys.attendanceToday(params),
    queryFn: () => api.fetchTodayAttendance(params),
  });
}

export function useBillingMonths() {
  return useQuery({
    queryKey: centerMgmtKeys.months(),
    queryFn: api.fetchBillingMonths,
  });
}

export function useMonthSubscriptions(year, month, params = {}) {
  return useQuery({
    queryKey: centerMgmtKeys.subscriptions(year, month, params),
    queryFn: () => api.fetchMonthSubscriptions(year, month, params),
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
    createStudent: useMutation({
      mutationFn: api.createStudent,
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
      mutationFn: ({ studentId, payload }) => api.enrollStudent(studentId, payload),
      onSuccess: () => invalidateCore(qc),
    }),
    unenrollStudent: useMutation({
      mutationFn: ({ studentId, payload }) => api.unenrollStudent(studentId, payload),
      onSuccess: () => invalidateCore(qc),
    }),
  };
}

export function useAttendanceMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "attendance-today"] });
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "dashboard"] });
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "student-attendance"] });
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "activity"] });
  };

  return {
    scan: useMutation({
      mutationFn: api.scanAttendance,
      onSuccess: invalidate,
    }),
    record: useMutation({
      mutationFn: api.recordAttendance,
      onSuccess: invalidate,
    }),
    bulk: useMutation({
      mutationFn: api.bulkRecordAttendance,
      onSuccess: invalidate,
    }),
  };
}

export function useSubscriptionMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "subscriptions"] });
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "months"] });
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "dashboard"] });
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "finance"] });
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
  };
}

export function usePaymentMutations() {
  const qc = useQueryClient();
  return {
    createPayment: useMutation({
      mutationFn: api.createPayment,
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "payments"] });
        qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "subscriptions"] });
        qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "finance"] });
        qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "dashboard"] });
      },
    }),
  };
}
