import { useEffect, useState } from "react";
import baseUrl from "../../api/baseUrl";

const GitClasses = () => {
  const token = localStorage.getItem("token");
  const [classes, setClasses] = useState("");
  const [classesLoading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await baseUrl.get(`api/classes`, {
          headers: { token: token },
        });
        setClasses(response.data);
      } catch (error) {
        console.log("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  return [classesLoading, classes];
};

export default GitClasses;
