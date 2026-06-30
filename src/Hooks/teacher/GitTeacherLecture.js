import { useEffect, useState } from "react";
import baseUrl from "../../api/baseUrl";

const GitTeacherLecture = ({ id }) => {
  const token = localStorage.getItem("token");
  const [lecturesOnline, setLecturesOnline] = useState([]);
  const [lecturesCenter, setLecturesCenter] = useState([]);
  const [lectureLoading, setLoading] = useState(false);
  const [lectureCenterLoading, setCenterLoading] = useState(false);

  const fetchOnlineLecture = async () => {
    try {
      setLoading(true);
      const response = await baseUrl.get(`api/lecture/online/${id}`, {
        headers: { token: token },
      });
      setLecturesOnline(response.data);
    } catch (error) {
      console.log("Error fetching online lectures");
    } finally {
      setLoading(false);
    }
  };

  const fetchCenterLecture = async () => {
    try {
      setCenterLoading(true);
      const response = await baseUrl.get(`api/lecture/group/${id}`, {
        headers: { token: token },
      });
      setLecturesCenter(response.data);
    } catch (error) {
      console.log("Error fetching center lectures");
    } finally {
      setCenterLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOnlineLecture();
      fetchCenterLecture();
    }
  }, [id]);

  const mergedLectures = [...lecturesOnline, ...lecturesCenter];

  return [
    mergedLectures,
    lecturesCenter,
    lecturesOnline,
    lectureLoading,
    lectureCenterLoading,
  ];
};

export default GitTeacherLecture;
