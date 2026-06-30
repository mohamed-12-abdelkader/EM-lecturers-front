import { useState } from "react";
import baseUrl from "../../api/baseUrl";
import { toast } from "react-toastify";
const DeleatPdf = () => {
  const token = localStorage.getItem("token");
  const [deletePdfLoading, setDeleteLoading] = useState(false);
  const deletPdf = async (id) => {
    try {
      setDeleteLoading(true);
      await baseUrl.delete(`api/lecture/pdf/group/${id}`, {
        headers: {
          token: token,
        },
      });

      toast.success("تم حذف  الملف    بنجاح ");

      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (error) {
      toast.error("فشل حذف الملف    ");
    } finally {
      setDeleteLoading(false);
    }
  };
  return [deletePdfLoading, deletPdf];
};

export default DeleatPdf;
