import { useEffect, useState } from "react";
import baseUrl from "../../api/baseUrl";

const GitTeacherMonth = ({ id }) => {
  const token = localStorage.getItem("token");
  const [monthes, setLecturesOnline] = useState([]);
  const [monthesCenter, setLecturesCenter] = useState([]);
  const [monthesLoading, setLoading] = useState(false);
  const [lectureCenterLoading, setCenterLoading] = useState(false);

  const fetchOnlineMonth = async () => {
    try {
      setLoading(true);
      const response = await baseUrl.get(`api/month/mymonth/online/${id}`, {
        headers: { token: token },
      });
      setLecturesOnline(response.data);
    } catch (error) {
      console.log("Error fetching online lectures");
    } finally {
      setLoading(false);
    }
  };
  const fetchCenterMonth = async () => {
    try {
      setCenterLoading(true);
      const response = await baseUrl.get(`api/month/mymonth/group/${id}`, {
        headers: { token: token },
      });
      setLecturesCenter(response.data);
    } catch (error) {
      console.log("Error fetching online lectures");
    } finally {
      setCenterLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOnlineMonth();
      fetchCenterMonth();
    }
  }, [id]);

  const mergedLectures = [...monthes, ...monthesCenter];

  return [
    monthes,
    monthesLoading,
    lectureCenterLoading,
    mergedLectures,
    monthesCenter,
  ];
};

export default GitTeacherMonth;
