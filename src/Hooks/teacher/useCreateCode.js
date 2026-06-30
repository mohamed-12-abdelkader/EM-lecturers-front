import { useState } from "react";
import baseUrl from "../../api/baseUrl";
import { toast } from "react-toastify";

const useCreateCode = () => {
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(false);
  const [number, setnumber] = useState("");
  const [m_id, setm_id] = useState("");

  const handleAddcode = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const data = {
        m_id,
        number,
      };

      // Conditionally add lo_id and lg_id to the request body

      // Pass the token and data in the request
      const response = await baseUrl.post(`api/teachercode/create`, data, {
        headers: {
          token: token,
        },
      });

      localStorage.setItem("code", JSON.stringify(response.data));
      toast.success("تم  انشاء الاكواد  بنجاح");
      setTimeout(() => {
        window.location.href = "/teacher_code";
      }, 500);
    } catch (error) {
      toast.error("An error occurred. Please try again later.");
      console.log(error);
    } finally {
      setLoading(false);
      setnumber("");
    }
  };

  return [loading, handleAddcode, setm_id, number, setnumber];
};

export default useCreateCode;
