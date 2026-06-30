import { useEffect, useState } from "react";
import baseUrl from "../../api/baseUrl";

const GitLectureCeterTdetails = ({ id }) => {
  const token = localStorage.getItem("token");
  const [lecturest, setLecture] = useState("");
  const [lectureLoadingt, setLoading] = useState(false);

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
  return [lectureLoadingt, lecturest];
};

export default GitLectureCeterTdetails;
