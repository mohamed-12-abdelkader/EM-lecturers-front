import { useState } from "react";
import baseUrl from "../../api/baseUrl";
import { toast } from "react-toastify";

const DeleateExam = () => {
  const token = localStorage.getItem("token");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const deleteExams = async (id) => {
    try {
      setDeleteLoading(true);
      await baseUrl.delete(`api/lecture/exam/lonline/${id}`, {
        headers: {
          token: token,
        },
      });

      toast.success("تم حذف المجموعة  بنجاح ");

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast.error("فشل حذف المجموعة  ");
    } finally {
      setDeleteLoading(false);
    }
  };
  return [deleteLoading, deleteExams];
};

export default DeleateExam;
