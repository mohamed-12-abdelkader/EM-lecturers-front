import React, { useEffect, useState } from "react";
import baseUrl from "../../api/baseUrl";

const GitTeacherQuistions = ({ id }) => {
  const token = localStorage.getItem("token");
  const [quistions, setQuistions] = useState("");
  const [quistionsLoading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await baseUrl.get(`api/lecture/exam/${id}`, {
          headers: { token: token },
        });
        setQuistions(response.data);
      } catch (error) {
        console.log("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  return [quistionsLoading, quistions];
};

export default GitTeacherQuistions;
