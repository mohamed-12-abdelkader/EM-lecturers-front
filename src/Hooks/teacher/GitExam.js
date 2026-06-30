import { useEffect, useState } from "react";
import baseUrl from "../../api/baseUrl";

const GitExam = ({ id }) => {
  const token = localStorage.getItem("token");
  const [exams, setExams] = useState("");
  const [examsLoading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await baseUrl.get(`api/lecture/exams/${id}`, {
          headers: { token: token },
        });
        setExams(response.data);
      } catch (error) {
        console.log("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);
  return [exams, examsLoading];
};

export default GitExam;
