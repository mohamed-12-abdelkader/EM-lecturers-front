import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";
import { useState } from "react";

const JoinStudent = () => {
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [id, setMail] = useState("");
  const [grad_id, setGrad] = useState("");
  const [group_id, setGroup] = useState("");
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!grad_id || !id || !group_id) {
      toast.warn("يجب ادخال جميع البيانات ");
    } else {
      try {
        setLoading(true);

        // Pass the token in the headers
        const response = await baseUrl.post(
          `api/groups/joinbyid`,
          { group_id, id },
          {
            headers: {
              token: token,
              // Add any additional headers if needed
            },
          }
        );

        localStorage.setItem("code", JSON.stringify(response.data));
        toast.success("تم   اضافة الطالب    بنجاح");
      } catch (error) {
        if (
          error.response.data.msg === "This student is already in this group."
        ) {
          toast.error("   هذا الطالب موجود بالفعل فى هذة المجموعة   ");
        } else if (
          error.response.data.msg == "This student is not registered."
        ) {
          toast.error("هذا الحساب ليس موجود على المنصة ");
        }
        console.log(error);
      } finally {
        setLoading(false);

        setMail("");
      }
    }
  };
  return [loading, id, setMail, grad_id, setGrad, setGroup, handleAddStudent];
};

export default JoinStudent;
