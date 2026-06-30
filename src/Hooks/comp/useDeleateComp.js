import React, { useState } from "react";
import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";
import useGitCompByAdmin from "./useGitCompByAdmin";

const useDeleateComp = () => {
  const token = localStorage.getItem("token");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [compsLoading, comps, refetchComps] = useGitCompByAdmin();
  const deleteComp = async (id) => {
    try {
      setDeleteLoading(true);
      // تنفيذ طلب الحذف
      const response = await baseUrl.delete(`api/manage-comps/${id}`, {
        headers: {
          token: token,
        },
      });

      // إذا كانت الاستجابة ناجحة، يتم تحديث القائمة
      if (response.status === 204) {
        toast.success("تم حذف المسابقة  بنجاح");
        refetchComps();
      } else {
        toast.error("فشل حذف المسابقة");
      }
      console.log(response);
    } catch (error) {
      toast.error("فشل حذف المسابقة");
      console.log(error);
    } finally {
      setDeleteLoading(false);
    }
  };

  return [deleteLoading, deleteComp];
};

export default useDeleateComp;
