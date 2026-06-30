import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";
import { useEffect, useState } from "react";

const Mange = () => {
  const token = localStorage.getItem("token");
  const [mange, setMange] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await baseUrl.get("api/code/mange", {
          headers: { token: token },
        });
        setMange(response.data);
      } catch (error) {
        toast.error("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  return [loading, mange];
};

export default Mange;
