import { useState } from "react";
import baseUrl from "../../api/baseUrl";
import { toast } from "react-toastify";

const DeleateTeacher = () => {
  const token = localStorage.getItem("token");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const deleteTeacher = async (id) => {
    try {
      setDeleteLoading(true);
      await baseUrl.delete(`api/teacher/${id}`, {
        headers: {
          token: token,
        },
      });

      toast.success("تم حذف المدرس بنجاح ");

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast.error("فشل حذف المدرس ");
    } finally {
      setDeleteLoading(false);
    }
  };
  return [deleteLoading, deleteTeacher];
};

export default DeleateTeacher;
