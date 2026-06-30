import { useState } from "react";
import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";

const useCreateGroup = () => {
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [group_name, setGroupName] = useState("");
  const [grad_id, setGrad] = useState("");
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!grad_id || !group_name) {
      toast.warn("يجب ادخال جميع البيانات ");
    } else {
      try {
        setLoading(true);

        // Pass the token in the headers
        const response = await baseUrl.post(
          `api/groups`,
          { grad_id, group_name },
          {
            headers: {
              token: token,
              // Add any additional headers if needed
            },
          }
        );

        localStorage.setItem("code", JSON.stringify(response.data));
        toast.success("تم  انشاء المجموعة   بنجاح");
      } catch (error) {
        toast.error("فشل  انشاء المجموعة  ");
      } finally {
        setLoading(false);
        setGrad("");
        setGroupName("");
      }
    }
  };
  return [
    loading,
    grad_id,
    setGrad,
    group_name,
    setGroupName,
    handleCreateGroup,
  ];
};

export default useCreateGroup;
