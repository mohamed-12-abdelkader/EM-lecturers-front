import { useState } from "react";
import baseUrl from "../../api/baseUrl";
import { toast } from "react-toastify";

const DeleateGroup = () => {
  const token = localStorage.getItem("token");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const deleteGroup = async (id) => {
    try {
      setDeleteLoading(true);
      await baseUrl.delete(`api/groups/${id}`, {
        headers: {
          token: token,
        },
      });

      toast.success("تم حذف المجموعة  بنجاح ");

      setTimeout(() => {
        window.location.href = "/my_groups";
      }, 500);
    } catch (error) {
      toast.error("فشل حذف المجموعة  ");
    } finally {
      setDeleteLoading(false);
    }
  };
  return [deleteLoading, deleteGroup];
};

export default DeleateGroup;
