import { useState } from "react";
import baseUrl from "../../api/baseUrl";
import { toast } from "react-toastify";

const DeleateVedio = () => {
  const token = localStorage.getItem("token");
  const [deleteVedioLoading, setDeleteLoading] = useState(false);
  const deletVedio = async (id) => {
    try {
      setDeleteLoading(true);
      await baseUrl.delete(`api/lecture/video/lonline/${id}`, {
        headers: {
          token: token,
        },
      });

      toast.success("تم حذف الفيديو اونلاين   بنجاح ");

      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (error) {
      toast.error("فشل حذف الفيديو   ");
    } finally {
      setDeleteLoading(false);
    }
  };
  return [deleteVedioLoading, deletVedio];
};

export default DeleateVedio;
