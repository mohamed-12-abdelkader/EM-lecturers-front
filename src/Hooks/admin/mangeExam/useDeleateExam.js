import React, { useState } from "react";
import baseUrl from "../../../api/baseUrl";
import { toast } from "react-toastify";
import useGitAllExams from "./useGitAllExams";

const useDeleateExam = ({ status }) => {
  const token = localStorage.getItem("token");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [examsLoading, exams, refetchExam] = useGitAllExams();
  const deleteExam = async (id) => {
    try {
      setDeleteLoading(true);
      await baseUrl.delete(`api/exams-manage/${status}/${id}`, {
        headers: {
          token: token,
        },
      });

      toast.success("تم حذف الامتحان  بنجاح ");
    } catch (error) {
      toast.error("فشل حذف الامتحان  ");
    } finally {
      setDeleteLoading(false);
      refetchExam();
    }
  };
  return [deleteLoading, deleteExam];
};

export default useDeleateExam;
