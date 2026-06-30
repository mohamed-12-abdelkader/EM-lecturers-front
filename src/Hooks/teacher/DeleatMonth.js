import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";
import { useState } from "react";

const DeleatMonth = () => {
  const token = localStorage.getItem("token");
  const [deleteMonthLoading, setDeleteOnlineLoading] = useState(false);
  //const [deleteCenterLoading, setDeleteCenterLoading] = useState(false);
  const deleteMonth = async (id) => {
    try {
      setDeleteOnlineLoading(true);
      await baseUrl.delete(`api/month/${id}`, {
        headers: {
          token: token,
        },
      });

      toast.success("تم حذف  الكورس  بنجاح   ");

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast.error("فشل حذف المحاضرة  ");
    } finally {
      setDeleteOnlineLoading(false);
    }
  };

  return [deleteMonthLoading, deleteMonth];
};

export default DeleatMonth;
