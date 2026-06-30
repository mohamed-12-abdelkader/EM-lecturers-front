import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";
import { useState } from "react";
const CreateCode = () => {
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [n, setN] = useState("");
  const [value, setValue] = useState("");

  const handleNChange = (e) => {
    setN(e.target.value);
  };
  const handleValueChange = (e) => {
    
    
        setValue(e.target.value);
  };

  const handleCreateCode = async (e) => {
    e.preventDefault();
    if (!n || !value) {
      toast.warn("يجب ادخال جميع البيانات ");
    }

    try {
      setLoading(true);

      // Pass the token in the headers
      const response = await baseUrl.post(
        `api/code`,
        { n, value },
        {
          headers: {
            token: token,
            // Add any additional headers if needed
          },
        }
      );

      localStorage.setItem("code", JSON.stringify(response.data));
      toast.success("تم  انشاء الاكواد  بنجاح");
      setTimeout(() => {
        window.location.href = "/code";
      }, 500);
    } catch (error) {
      toast.error("فشل  انشاء الاكواد ");
    } finally {
      setLoading(false);
    }
  };
  return [
    handleCreateCode,
    handleValueChange,
    handleNChange,
    loading,
    value,
    n,
  ];
};

export default CreateCode;
