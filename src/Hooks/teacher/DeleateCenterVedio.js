import { useState } from "react";
import baseUrl from "../../api/baseUrl";
import { toast } from "react-toastify";

const DeleateCenterVedio = () => {
  const token = localStorage.getItem("token");
  const [deleteVedioCenterLoading, setDeleteLoading] = useState(false);
  const deletVedioCenter = async (id) => {
    try {
      setDeleteLoading(true);
      await baseUrl.delete(`api/lecture/video/group/${id}`, {
        headers: {
          token: token,
        },
      });

      toast.success("تم حذف الفيديو السنتر   بنجاح ");

      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (error) {
      toast.error("فشل حذف الفيديو   ");
    } finally {
      setDeleteLoading(false);
    }
  };
  return [deleteVedioCenterLoading, deletVedioCenter];
};

export default DeleateCenterVedio;
