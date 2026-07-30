import { useState, useEffect } from "react";
import baseUrl from "../../api/baseUrl";
import { readAuthToken } from "../../utils/authStorage";

const useGitMyTeacher = () => {
  const [teachers, setTeachers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeacherData = async () => {
    const token = readAuthToken();
    if (!token) {
      setTeachers({ teachers: [] });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await baseUrl.get("api/student/my-teachers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeachers(response.data || { teachers: [] });
      setError(null);
    } catch (err) {
      console.error("Error fetching teacher data:", err);
      const apiMessage = err?.response?.data?.message;

      if (
        err.sessionExpired ||
        apiMessage === "Session expired or replaced" ||
        err?.response?.status === 401 ||
        apiMessage?.includes("expired") ||
        apiMessage?.includes("انتهت") ||
        apiMessage?.includes("غير صالح")
      ) {
        setError(apiMessage || "Session expired or replaced");
        setTeachers({ teachers: [] });
      } else {
        setTeachers({ teachers: [] });
        setError(apiMessage || null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, []);

  return [loading, teachers, error];
};

export default useGitMyTeacher;
