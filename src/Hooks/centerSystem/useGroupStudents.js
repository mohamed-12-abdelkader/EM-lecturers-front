import { useState, useCallback } from 'react';
import baseUrl from '../../api/baseUrl';

export const useGroupStudents = (groupId) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // جلب الطلاب
  const fetchStudents = useCallback(async (date) => {
    if (!groupId) return;
    
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      let url = `/api/study-groups/${groupId}/students`;
      if (date) {
        url += `?date=${date}`;
      }
      const response = await baseUrl.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.students || []);
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ في جلب بيانات الطلاب');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // إضافة طالب
  const addStudent = async (studentData) => {
    if (!groupId) return;
    
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await baseUrl.post(
        `/api/study-groups/${groupId}/students`,
        studentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // إعادة جلب الطلاب بعد الإضافة
      await fetchStudents();
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ في إضافة الطالب');
      console.error('Error adding student:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // حذف طالب
  const deleteStudent = async (studentId) => {
    if (!groupId) return;
    
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      await baseUrl.delete(
        `/api/study-groups/${groupId}/students/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // إعادة جلب الطلاب بعد الحذف
      await fetchStudents();
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ في حذف الطالب');
      console.error('Error deleting student:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // تعديل بيانات طالب
  const updateStudent = async (studentId, studentData) => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await baseUrl.put(
        `/api/study-groups/${groupId}/students/${studentId}`,
        studentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchStudents();
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ في تعديل بيانات الطالب');
      console.error('Error updating student:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { students, loading, error, fetchStudents, addStudent, deleteStudent, updateStudent };
}; 