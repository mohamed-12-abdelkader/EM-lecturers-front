import { useEffect, useState } from "react";
import baseUrl from "../../api/baseUrl";

const GitResult = ({ id }) => {
  const token = localStorage.getItem("token");
  const [results, setResults] = useState([]);
  const [resultsLoading, setLoading] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await baseUrl.get(
          `/api/teacher/allresultofexam/${id}`,
          {
            headers: { token: token },
          }
        );
        setResults(response.data);
      } catch (error) {
        console.log("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);
  return [results, resultsLoading];
};

export default GitResult;
