import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";
import { useEffect, useState } from "react";

const GitVediot = ({ id }) => {
  const token = localStorage.getItem("token");
  const [vdiourlt, setVedio] = useState("");
  const [vedioLoadingt, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await baseUrl.get(`api/lecture/videot/${id}`, {
          headers: { token: token },
        });
        setVedio(response.data);
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
  }, [id]);
  return [vedioLoadingt, vdiourlt];
};

export default GitVediot;
