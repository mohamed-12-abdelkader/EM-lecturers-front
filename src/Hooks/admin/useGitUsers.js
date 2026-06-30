import { useEffect, useState } from "react";
import baseUrl from "../../api/baseUrl";

const useGitUser = () => {
  const token = localStorage.getItem("token");
  const [users, setUsers] = useState("");
  const [usersLoading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await baseUrl.get(`api/users`, {
          headers: { token: token },
        });
        setUsers(response.data);
      } catch (error) {
        console.log("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  return [users, usersLoading];
};

export default useGitUser;
