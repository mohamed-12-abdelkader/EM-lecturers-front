import { useEffect, useState } from "react";
import baseUrl from "../../api/baseUrl";

const GitTeacherWallet = () => {
  const token = localStorage.getItem("token");
  const [wallet, setWallet] = useState("");
  const [walletLoading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await baseUrl.get(`api/teacherwallet`, {
          headers: { token: token },
        });
        setWallet(response.data);
      } catch (error) {
        console.log("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  return [walletLoading, wallet];
};

export default GitTeacherWallet;
