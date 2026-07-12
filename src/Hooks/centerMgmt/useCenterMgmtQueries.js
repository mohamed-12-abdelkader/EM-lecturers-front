import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../../api/centerMgmtApi";

export const centerMgmtKeys = {
  all: ["center-mgmt"],
  centers: () => [...centerMgmtKeys.all, "centers"],
  center: (id) => [...centerMgmtKeys.all, "center", String(id)],
  dashboard: (id) => [...centerMgmtKeys.all, "dashboard", String(id)],
  finance: (id, params) => [...centerMgmtKeys.all, "finance", String(id), params],
  grades: (id) => [...centerMgmtKeys.all, "grades", String(id)],
  groups: (id, params) => [...centerMgmtKeys.all, "groups", String(id), params],
  group: (centerId, groupId) => [
    ...centerMgmtKeys.all,
    "group",
    String(centerId),
    String(groupId),
  ],
  groupStudents: (centerId, groupId) => [
    ...centerMgmtKeys.all,
    "group-students",
    String(centerId),
    String(groupId),
  ],
  students: (id, params) => [...centerMgmtKeys.all, "students", String(id), params],
  student: (centerId, studentId) => [
    ...centerMgmtKeys.all,
    "student",
    String(centerId),
    String(studentId),
  ],
  studentQr: (centerId, studentId) => [
    ...centerMgmtKeys.all,
    "student-qr",
    String(centerId),
    String(studentId),
  ],
  attendanceToday: (id) => [...centerMgmtKeys.all, "attendance-today", String(id)],
  attendanceSessions: (id, params) => [
    ...centerMgmtKeys.all,
    "attendance-sessions",
    String(id),
    params,
  ],
  sessionAttendance: (centerId, sessionId) => [
    ...centerMgmtKeys.all,
    "session-attendance",
    String(centerId),
    String(sessionId),
  ],
  studentAttendanceStats: (centerId, studentId) => [
    ...centerMgmtKeys.all,
    "student-attendance-stats",
    String(centerId),
    String(studentId),
  ],
  subscriptions: (id, params) => [
    ...centerMgmtKeys.all,
    "subscriptions",
    String(id),
    params,
  ],
  payments: (id, params) => [...centerMgmtKeys.all, "payments", String(id), params],
  staff: (id) => [...centerMgmtKeys.all, "staff", String(id)],
  activity: (id, params) => [...centerMgmtKeys.all, "activity", String(id), params],
  notifications: (id) => [...centerMgmtKeys.all, "notifications", String(id)],
};

function invalidateCenter(qc, centerId) {
  qc.invalidateQueries({ queryKey: centerMgmtKeys.center(centerId) });
  qc.invalidateQueries({ queryKey: centerMgmtKeys.dashboard(centerId) });
}

export function useCenters() {
  return useQuery({
    queryKey: centerMgmtKeys.centers(),
    queryFn: api.fetchCenters,
  });
}

export function useCenter(centerId) {
  return useQuery({
    queryKey: centerMgmtKeys.center(centerId),
    queryFn: () => api.fetchCenter(centerId),
    enabled: Boolean(centerId),
  });
}

export function useCenterDashboard(centerId) {
  return useQuery({
    queryKey: centerMgmtKeys.dashboard(centerId),
    queryFn: () => api.fetchCenterDashboard(centerId),
    enabled: Boolean(centerId),
  });
}

export function useFinanceDashboard(centerId, params = {}) {
  return useQuery({
    queryKey: centerMgmtKeys.finance(centerId, params),
    queryFn: () => api.fetchFinanceDashboard(centerId, params),
    enabled: Boolean(centerId),
  });
}

export function useGrades(centerId) {
  return useQuery({
    queryKey: centerMgmtKeys.grades(centerId),
    queryFn: () => api.fetchGrades(centerId),
    enabled: Boolean(centerId),
  });
}

export function useGroups(centerId, params = {}) {
  return useQuery({
    queryKey: centerMgmtKeys.groups(centerId, params),
    queryFn: () => api.fetchGroups(centerId, params),
    enabled: Boolean(centerId),
  });
}

export function useGroup(centerId, groupId) {
  return useQuery({
    queryKey: centerMgmtKeys.group(centerId, groupId),
    queryFn: () => api.fetchGroup(centerId, groupId),
    enabled: Boolean(centerId && groupId),
  });
}

export function useGroupStudents(centerId, groupId) {
  return useQuery({
    queryKey: centerMgmtKeys.groupStudents(centerId, groupId),
    queryFn: () => api.fetchGroupStudents(centerId, groupId),
    enabled: Boolean(centerId && groupId),
  });
}

export function useStudents(centerId, params = {}) {
  return useQuery({
    queryKey: centerMgmtKeys.students(centerId, params),
    queryFn: () => api.fetchStudents(centerId, params),
    enabled: Boolean(centerId),
  });
}

export function useStudent(centerId, studentId) {
  return useQuery({
    queryKey: centerMgmtKeys.student(centerId, studentId),
    queryFn: () => api.fetchStudent(centerId, studentId),
    enabled: Boolean(centerId && studentId),
  });
}

export function useStudentQr(centerId, studentId) {
  return useQuery({
    queryKey: centerMgmtKeys.studentQr(centerId, studentId),
    queryFn: () => api.fetchStudentQr(centerId, studentId),
    enabled: Boolean(centerId && studentId),
  });
}

export function useTodayAttendance(centerId) {
  return useQuery({
    queryKey: centerMgmtKeys.attendanceToday(centerId),
    queryFn: () => api.fetchTodayAttendance(centerId),
    enabled: Boolean(centerId),
  });
}

export function useAttendanceSessions(centerId, params = {}) {
  return useQuery({
    queryKey: centerMgmtKeys.attendanceSessions(centerId, params),
    queryFn: () => api.fetchAttendanceSessions(centerId, params),
    enabled: Boolean(centerId),
  });
}

export function useSessionAttendance(centerId, sessionId) {
  return useQuery({
    queryKey: centerMgmtKeys.sessionAttendance(centerId, sessionId),
    queryFn: () => api.fetchSessionAttendance(centerId, sessionId),
    enabled: Boolean(centerId && sessionId),
  });
}

export function useStudentAttendanceStats(centerId, studentId) {
  return useQuery({
    queryKey: centerMgmtKeys.studentAttendanceStats(centerId, studentId),
    queryFn: () => api.fetchStudentAttendanceStats(centerId, studentId),
    enabled: Boolean(centerId && studentId),
  });
}

export function useSubscriptions(centerId, params = {}) {
  return useQuery({
    queryKey: centerMgmtKeys.subscriptions(centerId, params),
    queryFn: () => api.fetchSubscriptions(centerId, params),
    enabled: Boolean(centerId),
  });
}

export function usePayments(centerId, params = {}) {
  return useQuery({
    queryKey: centerMgmtKeys.payments(centerId, params),
    queryFn: () => api.fetchPayments(centerId, params),
    enabled: Boolean(centerId),
  });
}

export function useStaff(centerId) {
  return useQuery({
    queryKey: centerMgmtKeys.staff(centerId),
    queryFn: () => api.fetchStaff(centerId),
    enabled: Boolean(centerId),
  });
}

export function useActivityLogs(centerId, params = {}) {
  return useQuery({
    queryKey: centerMgmtKeys.activity(centerId, params),
    queryFn: () => api.fetchActivityLogs(centerId, params),
    enabled: Boolean(centerId),
  });
}

export function useNotifications(centerId) {
  return useQuery({
    queryKey: centerMgmtKeys.notifications(centerId),
    queryFn: () => api.fetchNotifications(centerId),
    enabled: Boolean(centerId),
  });
}

export function useCenterMutations(centerId) {
  const qc = useQueryClient();

  const createCenter = useMutation({
    mutationFn: api.createCenter,
    onSuccess: () => qc.invalidateQueries({ queryKey: centerMgmtKeys.centers() }),
  });

  const updateCenter = useMutation({
    mutationFn: (payload) => api.updateCenter(centerId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: centerMgmtKeys.centers() });
      invalidateCenter(qc, centerId);
    },
  });

  const removeCenter = useMutation({
    mutationFn: () => api.deleteCenter(centerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: centerMgmtKeys.centers() }),
  });

  return { createCenter, updateCenter, removeCenter };
}

export function useGradeMutations(centerId) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: centerMgmtKeys.grades(centerId) });
    invalidateCenter(qc, centerId);
  };

  return {
    createGrade: useMutation({
      mutationFn: (payload) => api.createGrade(centerId, payload),
      onSuccess: invalidate,
    }),
    updateGrade: useMutation({
      mutationFn: ({ gradeId, payload }) => api.updateGrade(centerId, gradeId, payload),
      onSuccess: invalidate,
    }),
    deleteGrade: useMutation({
      mutationFn: (gradeId) => api.deleteGrade(centerId, gradeId),
      onSuccess: invalidate,
    }),
  };
}

export function useGroupMutations(centerId) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "groups", String(centerId)] });
    invalidateCenter(qc, centerId);
  };

  return {
    createGroup: useMutation({
      mutationFn: (payload) => api.createGroup(centerId, payload),
      onSuccess: invalidate,
    }),
    updateGroup: useMutation({
      mutationFn: ({ groupId, payload }) => api.updateGroup(centerId, groupId, payload),
      onSuccess: invalidate,
    }),
    deleteGroup: useMutation({
      mutationFn: (groupId) => api.deleteGroup(centerId, groupId),
      onSuccess: invalidate,
    }),
  };
}

export function useStudentMutations(centerId) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "students", String(centerId)] });
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "group-students"] });
    invalidateCenter(qc, centerId);
  };

  return {
    createStudent: useMutation({
      mutationFn: (payload) => api.createStudent(centerId, payload),
      onSuccess: invalidate,
    }),
    updateStudent: useMutation({
      mutationFn: ({ studentId, payload }) => api.updateStudent(centerId, studentId, payload),
      onSuccess: invalidate,
    }),
    deleteStudent: useMutation({
      mutationFn: (studentId) => api.deleteStudent(centerId, studentId),
      onSuccess: invalidate,
    }),
    enrollStudent: useMutation({
      mutationFn: ({ studentId, payload }) => api.enrollStudent(centerId, studentId, payload),
      onSuccess: invalidate,
    }),
    unenrollStudent: useMutation({
      mutationFn: ({ studentId, payload }) => api.unenrollStudent(centerId, studentId, payload),
      onSuccess: invalidate,
    }),
  };
}

export function useAttendanceMutations(centerId) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: centerMgmtKeys.attendanceToday(centerId) });
    qc.invalidateQueries({
      queryKey: [...centerMgmtKeys.all, "attendance-sessions", String(centerId)],
    });
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "session-attendance"] });
    invalidateCenter(qc, centerId);
  };

  return {
    openSession: useMutation({
      mutationFn: (payload) => api.createAttendanceSession(centerId, payload),
      onSuccess: invalidate,
    }),
    scan: useMutation({
      mutationFn: (payload) => api.scanAttendance(centerId, payload),
      onSuccess: invalidate,
    }),
    record: useMutation({
      mutationFn: (payload) => api.recordAttendance(centerId, payload),
      onSuccess: invalidate,
    }),
    bulk: useMutation({
      mutationFn: (payload) => api.bulkRecordAttendance(centerId, payload),
      onSuccess: invalidate,
    }),
  };
}

export function useSubscriptionMutations(centerId) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({
      queryKey: [...centerMgmtKeys.all, "subscriptions", String(centerId)],
    });
    invalidateCenter(qc, centerId);
  };

  return {
    generate: useMutation({
      mutationFn: (payload) => api.generateMonthlySubscriptions(centerId, payload),
      onSuccess: invalidate,
    }),
    updateStatus: useMutation({
      mutationFn: ({ subscriptionId, status }) =>
        api.updateSubscriptionStatus(centerId, subscriptionId, status),
      onSuccess: invalidate,
    }),
  };
}

export function usePaymentMutations(centerId) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "payments", String(centerId)] });
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "subscriptions", String(centerId)] });
    qc.invalidateQueries({ queryKey: [...centerMgmtKeys.all, "finance", String(centerId)] });
    invalidateCenter(qc, centerId);
  };

  return {
    createPayment: useMutation({
      mutationFn: (payload) => api.createPayment(centerId, payload),
      onSuccess: invalidate,
    }),
  };
}

export function useStaffMutations(centerId) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: centerMgmtKeys.staff(centerId) });

  return {
    invite: useMutation({
      mutationFn: (payload) => api.inviteStaff(centerId, payload),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ staffId, payload }) => api.updateStaff(centerId, staffId, payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (staffId) => api.removeStaff(centerId, staffId),
      onSuccess: invalidate,
    }),
  };
}
