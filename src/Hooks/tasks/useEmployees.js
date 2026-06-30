import { useState, useEffect } from "react";
import baseUrl from "../../api/baseUrl";
import { toast } from "react-toastify";

const useEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  // جلب قائمة الموظفين
  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await baseUrl.get("/api/employees", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data.employees || []);
      return response.data.employees || [];
    } catch (err) {
      setError(err.response?.data?.message || "فشل في جلب الموظفين");
      toast.error("فشل في جلب الموظفين");
      console.error("Error fetching employees:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return {
    employees,
    loading,
    error,
    fetchEmployees
  };
};

export default useEmployees; 