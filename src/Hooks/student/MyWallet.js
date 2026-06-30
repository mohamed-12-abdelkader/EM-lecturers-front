import baseUrl from "../../api/baseUrl";
import { useEffect, useState } from "react";

const MyWallet = () => {
  const token = localStorage.getItem("token");
  const [mytwallet, setMytwallet] = useState("");
  const [walletLoading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await baseUrl.get("api/user/mywallet", {
          headers: { token: token },
        });
        setMytwallet(response.data);
      } catch (error) {
        console.log("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  return [walletLoading, mytwallet];
};

export default MyWallet;
