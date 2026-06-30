import { useEffect, useState } from "react";
import baseUrl from "../../api/baseUrl";

const GitLecturTdetails = ({ id }) => {
  const token = localStorage.getItem("token");
  const [lecturesT, setLecture] = useState("");
  const [lectureTLoading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await baseUrl.get(`api/lecture/lecturegroupt/${id}`, {
          headers: { token: token },
        });
        setLecture(response.data);
      } catch (error) {
        console.log("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  return [lectureTLoading, lecturesT];
};

export default GitLecturTdetails;
