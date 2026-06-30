import { useState, useEffect } from 'react';
import baseUrl from '../../api/baseUrl';

export const useStudyGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // جلب جميع المجموعات
  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await baseUrl.get('/api/study-groups/teacher/my-groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(response.data.groups || []);
    } catch (err) {
      setError('فشل في جلب المجموعات');
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  // إنشاء مجموعة جديدة
  const createGroup = async (groupData) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await baseUrl.post('/api/study-groups', groupData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchGroups(); // إعادة جلب المجموعات
      return { success: true, data: response.data };
    } catch (err) {
      setError('فشل في إنشاء المجموعة');
      console.error('Error creating group:', err);
      return { success: false, error: err.response?.data?.message || 'حدث خطأ أثناء إنشاء المجموعة' };
    } finally {
      setLoading(false);
    }
  };

  // تحديث مجموعة
  const updateGroup = async (groupId, groupData) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await baseUrl.put(`/api/study-groups/${groupId}`, groupData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchGroups(); // إعادة جلب المجموعات
      return { success: true, data: response.data };
    } catch (err) {
      setError('فشل في تحديث المجموعة');
      console.error('Error updating group:', err);
      return { success: false, error: err.response?.data?.message || 'حدث خطأ أثناء تحديث المجموعة' };
    } finally {
      setLoading(false);
    }
  };

  // حذف مجموعة
  const deleteGroup = async (groupId) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      await baseUrl.delete(`/api/study-groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchGroups(); // إعادة جلب المجموعات
      return { success: true };
    } catch (err) {
      setError('فشل في حذف المجموعة');
      console.error('Error deleting group:', err);
      return { success: false, error: err.response?.data?.message || 'حدث خطأ أثناء حذف المجموعة' };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return {
    groups,
    loading,
    error,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup
  };
}; 