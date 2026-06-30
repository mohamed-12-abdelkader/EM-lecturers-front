import { useState, useEffect } from "react";
import baseUrl from "../../api/baseUrl";
import { toast } from "react-toastify";

const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  // جلب جميع المهام (للادمن)
  const fetchAllTasks = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(filters);
      const response = await baseUrl.get(`/api/tasks?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data.tasks || []);
      return response.data.tasks || [];
    } catch (err) {
      setError(err.response?.data?.message || "فشل في جلب المهام");
      toast.error("فشل في جلب المهام");
      console.error("Error fetching tasks:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // جلب مهام الموظف الحالي
  const fetchMyTasks = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(filters);
      const response = await baseUrl.get(`/api/tasks/my-tasks?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data.tasks || []);
      return response.data.tasks || [];
    } catch (err) {
      setError(err.response?.data?.message || "فشل في جلب مهامك");
      toast.error("فشل في جلب مهامك");
      console.error("Error fetching my tasks:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // إنشاء مهمة جديدة
  const createTask = async (taskData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await baseUrl.post("/api/tasks", taskData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("تم إنشاء المهمة بنجاح");
      await fetchAllTasks(); // إعادة جلب المهام
      return response.data.task;
    } catch (err) {
      setError(err.response?.data?.message || "فشل في إنشاء المهمة");
      toast.error(err.response?.data?.message || "فشل في إنشاء المهمة");
      console.error("Error creating task:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // تحديث مهمة
  const updateTask = async (taskId, taskData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await baseUrl.put(`/api/tasks/${taskId}`, taskData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("تم تحديث المهمة بنجاح");
      await fetchAllTasks(); // إعادة جلب المهام
      return response.data.task;
    } catch (err) {
      setError(err.response?.data?.message || "فشل في تحديث المهمة");
      toast.error(err.response?.data?.message || "فشل في تحديث المهمة");
      console.error("Error updating task:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // إكمال مهمة
  const completeTask = async (taskId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await baseUrl.post(`/api/tasks/${taskId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("تم إكمال المهمة بنجاح");
      await fetchAllTasks(); // إعادة جلب المهام
      return response.data.task;
    } catch (err) {
      setError(err.response?.data?.message || "فشل في إكمال المهمة");
      toast.error(err.response?.data?.message || "فشل في إكمال المهمة");
      console.error("Error completing task:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // حذف مهمة
  const deleteTask = async (taskId) => {
    setLoading(true);
    setError(null);
    try {
      await baseUrl.delete(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("تم حذف المهمة بنجاح");
      await fetchAllTasks(); // إعادة جلب المهام
    } catch (err) {
      setError(err.response?.data?.message || "فشل في حذف المهمة");
      toast.error(err.response?.data?.message || "فشل في حذف المهمة");
      console.error("Error deleting task:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // إضافة تعليق على مهمة
  const addTaskComment = async (taskId, comment) => {
    setLoading(true);
    setError(null);
    try {
      const response = await baseUrl.post(`/api/tasks/${taskId}/comments`, { comment }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("تم إضافة التعليق بنجاح");
      return response.data.comment;
    } catch (err) {
      setError(err.response?.data?.message || "فشل في إضافة التعليق");
      toast.error(err.response?.data?.message || "فشل في إضافة التعليق");
      console.error("Error adding comment:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // جلب تعليقات مهمة
  const getTaskComments = async (taskId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await baseUrl.get(`/api/tasks/${taskId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.comments || [];
    } catch (err) {
      setError(err.response?.data?.message || "فشل في جلب التعليقات");
      toast.error(err.response?.data?.message || "فشل في جلب التعليقات");
      console.error("Error fetching comments:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // رفع ملف لمهمة
  const uploadTaskFile = async (taskId, file) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await baseUrl.post(`/api/tasks/${taskId}/attachments`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success("تم رفع الملف بنجاح");
      return response.data.attachment;
    } catch (err) {
      setError(err.response?.data?.message || "فشل في رفع الملف");
      toast.error(err.response?.data?.message || "فشل في رفع الملف");
      console.error("Error uploading file:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // جلب ملفات مهمة
  const getTaskFiles = async (taskId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await baseUrl.get(`/api/tasks/${taskId}/attachments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.attachments || [];
    } catch (err) {
      setError(err.response?.data?.message || "فشل في جلب الملفات");
      toast.error(err.response?.data?.message || "فشل في جلب الملفات");
      console.error("Error fetching files:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // جلب إحصائيات المهام
  const getTaskStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await baseUrl.get("/api/tasks/stats/overview", {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.stats || {};
    } catch (err) {
      setError(err.response?.data?.message || "فشل في جلب الإحصائيات");
      toast.error(err.response?.data?.message || "فشل في جلب الإحصائيات");
      console.error("Error fetching stats:", err);
      return {};
    } finally {
      setLoading(false);
    }
  };

  return {
    tasks,
    loading,
    error,
    fetchAllTasks,
    fetchMyTasks,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    addTaskComment,
    getTaskComments,
    uploadTaskFile,
    getTaskFiles,
    getTaskStats
  };
};

export default useTasks; 