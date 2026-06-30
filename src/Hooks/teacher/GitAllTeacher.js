import { useState, useEffect } from "react";
import baseUrl from "../../api/baseUrl";
import { toast } from "react-toastify";
const GitAllTeacher = () => {
  const [teachers, setTeachers] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await baseUrl.get("api/teacher");
        setTeachers(response.data);
      } catch (error) {
        toast.error("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  return [loading, teachers];
};

export default GitAllTeacher;
