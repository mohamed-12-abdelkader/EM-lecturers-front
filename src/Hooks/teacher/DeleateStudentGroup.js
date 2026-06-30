import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";
import { useState } from "react";

const DeleateStudentGroup = ({ group_id }) => {
  const token = localStorage.getItem("token");
  const [deleteStudentLoading, setDeleteStudentLoading] = useState(false);
  const deleteStudent = async (std_id) => {
    try {
      setDeleteStudentLoading(true);
      await baseUrl.delete(`api/groups/remove`, {
        headers: {
          token: token,
        },
        data: {
          group_id: group_id,
          std_id: std_id,
        },
      });
      toast.success("تم حذف الطالب بنجاح");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast.error("فشل حذف الطالب");
    } finally {
      setDeleteStudentLoading(false);
    }
    console.log(std_id);
  };
  return [deleteStudentLoading, deleteStudent];
};

export default DeleateStudentGroup;
