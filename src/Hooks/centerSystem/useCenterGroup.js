import { useState, useCallback } from 'react';
import baseUrl from '../../api/baseUrl';

/**
 * Normalize API student item to GroupStudentDetail shape (same as em-student-app center-group).
 * Handles both { student, group, membership } and flat { student_id, name, ... } responses.
 */
function normalizeStudentItem(item, groupId, groupName) {
  if (item?.student && item?.group) {
    return {
      group: item.group,
      student: item.student,
      membership: item.membership || { id: item.id ?? 0, joined_at: item.joined_at ?? '' },
      attendance: item.attendance,
      statistics: item.statistics,
      date_range: item.date_range,
    };
  }
  return {
    group: { id: item?.group_id ?? groupId, name: item?.group_name ?? groupName ?? '' },
    student: {
      id: item?.student_id ?? item?.id,
      name: item?.student_name ?? item?.name ?? '—',
      phone: item?.phone,
      parent_phone: item?.parent_phone,
      email: item?.student_email ?? item?.email,
      avatar: item?.avatar ?? null,
      qrCodeDataUrl: item?.qrCodeDataUrl ?? null,
      qrPayload: item?.qrPayload,
    },
    membership: { id: item?.id ?? 0, joined_at: item?.joined_at ?? '' },
    attendance: item?.attendance,
    statistics: item?.statistics,
  };
}

/**
 * Hook for center-groups API (same logic as em-student-app center-group [id].tsx).
 * - GET /api/center-groups/:id/students → group + students
 * - GET /api/center-groups/:id/attendance?date= → attendance list + summary
 * - POST /api/center-groups/:id/attendance/bulk → save attendance
 * - POST /api/center-groups/:id/students → add student (name, phone?, parent_phone?)
 * - DELETE /api/center-groups/:id/students/:studentId → remove student
 */
export function useCenterGroup(groupId) {
  const [group, setGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [attendanceList, setAttendanceList] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  const getToken = () => localStorage.getItem('token');

  const fetchGroupAndStudents = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    setRefreshing(true);
    setError(null);
    try {
      const token = getToken();
      const response = await baseUrl.get(`/api/center-groups/${groupId}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      const groupData = data.group || { id: Number(groupId), name: '' };
      setGroup(groupData);
      const raw = data.students ?? data;
      const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
      const normalized = list.map((item) =>
        normalizeStudentItem(item, groupData.id, groupData.name)
      );
      setStudents(normalized);
    } catch (err) {
      console.error('Fetch center group error:', err);
      if (err.response?.data?.access === false) {
        setGroup(err.response.data);
        setError(null);
        setStudents([]);
      } else {
        setError(err.response?.data?.message || 'فشل في تحميل بيانات المجموعة');
        setStudents([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  const fetchAttendance = useCallback(
    async (date) => {
      if (!groupId || !date) return;
      setAttendanceLoading(true);
      try {
        const token = getToken();
        const response = await baseUrl.get(`/api/center-groups/${groupId}/attendance`, {
          params: { date },
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;
        const marked = (data.attendance || []).map((a) => ({
          ...a,
          is_marked: true,
          status: a.status || 'present',
        }));
        const unmarked = (data.unmarked_students || []).map((u) => ({
          ...u,
          is_marked: false,
          status: 'unmarked',
          student_id: u.student_id ?? u.id,
        }));
        const merged = [...marked, ...unmarked].sort((a, b) =>
          (a.name || '').localeCompare(b.name || '')
        );
        setAttendanceList(merged);
        setAttendanceSummary(data.summary || null);
      } catch (err) {
        console.error('Fetch attendance error:', err);
        setAttendanceList([]);
        setAttendanceSummary(null);
      } finally {
        setAttendanceLoading(false);
      }
    },
    [groupId]
  );

  const saveBulkAttendance = useCallback(
    async (date, attendanceArray) => {
      if (!groupId || !date) return { success: false };
      setSavingAttendance(true);
      try {
        const token = getToken();
        const payload = {
          date,
          attendance: attendanceArray.map((s) => ({
            student_id: s.student_id,
            status: s.status === 'present' || s.status === 'absent' ? s.status : 'absent',
          })),
        };
        await baseUrl.post(`/api/center-groups/${groupId}/attendance/bulk`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchAttendance(date);
        return { success: true };
      } catch (err) {
        console.error('Save bulk attendance error:', err);
        return { success: false, error: err.response?.data?.message };
      } finally {
        setSavingAttendance(false);
      }
    },
    [groupId, fetchAttendance]
  );

  const addStudent = useCallback(
    async (payload) => {
      if (!groupId) return { success: false };
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        await baseUrl.post(`/api/center-groups/${groupId}/students`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchGroupAndStudents();
        return { success: true };
      } catch (err) {
        const msg = err.response?.data?.message || 'فشل في إضافة الطالب';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [groupId, fetchGroupAndStudents]
  );

  const removeStudent = useCallback(
    async (studentId) => {
      if (!groupId) return { success: false };
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        await baseUrl.delete(`/api/center-groups/${groupId}/students/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchGroupAndStudents();
        return { success: true };
      } catch (err) {
        const msg = err.response?.data?.message || 'فشل في إزالة الطالب';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [groupId, fetchGroupAndStudents]
  );

  const updateStudent = useCallback(
    async (studentId, studentData) => {
      if (!groupId) return { success: false };
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        await baseUrl.put(
          `/api/center-groups/${groupId}/students/${studentId}`,
          studentData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await fetchGroupAndStudents();
        return { success: true };
      } catch (err) {
        const msg = err.response?.data?.message || 'فشل في تحديث الطالب';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [groupId, fetchGroupAndStudents]
  );

  return {
    group,
    students,
    loading,
    refreshing,
    error,
    fetchGroupAndStudents,
    attendanceList,
    attendanceSummary,
    attendanceLoading,
    savingAttendance,
    fetchAttendance,
    saveBulkAttendance,
    addStudent,
    removeStudent,
    updateStudent,
  };
}
