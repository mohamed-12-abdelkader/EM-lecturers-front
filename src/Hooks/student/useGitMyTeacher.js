import { useState, useEffect } from "react";
import baseUrl from "../../api/baseUrl";

const  useGitMyTeacher = () => {
  const [teachers, setTeachers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  const fetchTeacherData = async () => {
    if (!token) {
      setTeachers({ teachers: [] });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await baseUrl.get("api/student/my-teachers", {
        headers: { Authorization:`bearer ${token}`  },
      });
      setTeachers(response.data || { teachers: [] });
      setError(null);
    } catch (error) {
      console.error("Error fetching teacher data:", error);
      const apiMessage = error?.response?.data?.message;
      
      // Check if token expired
      if (error.sessionExpired ||
          apiMessage === "Session expired or replaced" || 
          error?.response?.status === 401 ||
          apiMessage?.includes('expired') ||
          apiMessage?.includes('انتهت') ||
          apiMessage?.includes('غير صالح')) {
        setError(apiMessage || "Session expired or replaced");
        // Don't set teachers to empty array if session expired, let component handle it
      } else {
        // For other errors, set teachers to empty array so component can show "no teachers" message
        setTeachers({ teachers: [] });
        if (apiMessage) {
          setError(apiMessage);
        } else {
          setError(null); // Don't show error for unknown errors, just show empty state
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherData(); // جلب البيانات عند تحميل المكون

  }, []);

  return [loading, teachers, error];
};

export default useGitMyTeacher;
