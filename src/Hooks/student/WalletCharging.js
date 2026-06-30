import { useState } from "react";
import baseUrl from "../../api/baseUrl";
import { toast } from "react-toastify";
const WalletCharging = () => {
  const token = localStorage.getItem("token");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  const handleWalletCharging = async (e) => {
    e.preventDefault();
    if (!code) {
      toast.warn("يجب ادخال  الكود ");
    }

    try {
      setLoading(true);

      // Pass the token in the headers
      const response = await baseUrl.put(
        `api/user/code`,
        { code },
        {
          headers: {
            token: token,
            // Add any additional headers if needed
          },
        }
      );

      toast.success("تم  شحن المحفظة بنجاح    ");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      if (error.response.data.msg == "Code is not correct") {
        toast.error("   الكود الذى ادخلتة غير صحيح  ");
      }
    } finally {
      setLoading(false);
      setCode("");
    }
  };
  return [handleCodeChange, handleWalletCharging, code, loading];
};

export default WalletCharging;
