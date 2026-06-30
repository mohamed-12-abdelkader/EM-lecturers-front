import { useState } from "react";
import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";

const DeleatQuestions = () => {
  const token = localStorage.getItem("token");
  const [deleteQuestionLoading, setDeleteLoading] = useState(false);
  const deletQuestion = async (id) => {
    try {
      setDeleteLoading(true);
      await baseUrl.delete(`api/lecture/question/${id}`, {
        headers: {
          token: token,
        },
      });

      toast.success("تم حذف  السؤال    بنجاح ");

      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (error) {
      toast.error("فشل حذف السؤال    ");
    } finally {
      setDeleteLoading(false);
    }
  };
  return [deleteQuestionLoading, deletQuestion];
};

export default DeleatQuestions;
