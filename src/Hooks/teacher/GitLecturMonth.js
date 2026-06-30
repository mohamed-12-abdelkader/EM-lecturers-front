import { useEffect, useState } from "react";
import baseUrl from "../../api/baseUrl";

const GitLecturMonth = ({ id }) => {
  const token = localStorage.getItem("token");
  const [months, setMonths] = useState([]);
  const [monthLoading, setLoading] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await baseUrl.get(`api/month/month/${id}`, {
          headers: { token: token },
        });
        setMonths(response.data);
      } catch (error) {
        console.log("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await baseUrl.get(`api/month/monthinfo/${id}`, {
          headers: { token: token },
        });
        setMonths(response.data);
      } catch (error) {
        console.log("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);
  return [months, monthLoading];
};

export default GitLecturMonth;
