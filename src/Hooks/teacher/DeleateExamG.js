import React, { useState } from "react";
import baseUrl from "../../api/baseUrl";
import { toast } from "react-toastify";

const DeleateExamG = () => {
  const token = localStorage.getItem("token");
  const [deleteGLoading, setDeleteLoading] = useState(false);
  const deleteExamsG = async (id) => {
    try {
      setDeleteLoading(true);
      await baseUrl.delete(`api/lecture/exam/group/${id}`, {
        headers: {
          token: token,
        },
      });

      toast.success("تم حذف الامتحان   بنجاح ");

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast.error("فشل حذف الامتحان   ");
    } finally {
      setDeleteLoading(false);
    }
  };
  return [deleteGLoading, deleteExamsG];
};

export default DeleateExamG;
