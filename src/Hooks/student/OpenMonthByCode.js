import { useState } from "react";
import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";

const useOpenMonthByCode = () => {
  const token = localStorage.getItem("token");
  const [buycodeLoading, setBuyLoading] = useState(false);
  const [code, setcode] = useState("");

  const buyMonthbyCode = async (id) => {
    try {
      setBuyLoading(true);
      await baseUrl.put(
        `api/user/buymonthbycode`,
        { m_id: id, code },
        {
          headers: {
            token: token,
          },
        }
      );

      toast.success("تم  شراء المحاضرة  بنجاح ");

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error deleting teacher:", error);
      if (error.response.data.msg == "Code has already been used.") {
        toast.error("هذا الكود مستخدم من قبل  ");
      } else if (error.response.data.msg == "Code is not correct.") {
        toast.error("هذا الكود غير صحيح ");
      }
    } finally {
      setBuyLoading(false);
    }
  };

  return [buycodeLoading, buyMonthbyCode, setcode, code];
};

export default useOpenMonthByCode;
