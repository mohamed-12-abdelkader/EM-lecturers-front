import React, { useEffect, useState } from "react";
import baseUrl from "../../api/baseUrl";

const useGitStuSubs = ({ id }) => {
  const token = localStorage.getItem("token");
  const [users, setusers] = useState("");
  const [usersLoading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await baseUrl.get(`api/month/subscribe_users/${id}`, {
          headers: { token: token },
        });
        setusers(response.data);
      } catch (error) {
        console.log("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  return [usersLoading, users];
};

export default useGitStuSubs;
