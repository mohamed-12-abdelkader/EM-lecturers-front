import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";

const GitQuistion = ({ id }) => {
  const token = localStorage.getItem("token");
  const [quistions, setQuistions] = useState("");
  const [quistionsLoading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await baseUrl.get(`api/user/exam/${id}`, {
          headers: { token: token },
        });
        setQuistions(response.data);
      } catch (error) {
        console.log("Error fetching data");
        if (
          error.response.data.msg ==
          "You do not have permission to access this lecture content."
        ) {
          toast.error(" انت لست مشترك فى هذة المحاضرة ");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  return [quistionsLoading, quistions];
};

export default GitQuistion;
