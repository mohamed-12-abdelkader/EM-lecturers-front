import React, { useState } from "react";
import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";
import useGitCompByAdmin from "./useGitCompByAdmin";

const useActivComp = () => {
  const token = localStorage.getItem("token");
  const [is_ready, setis_ready] = useState(true);
  const [activComploading, setactivComp] = useState(false);
  const [compsLoading, comps, refetchComps] = useGitCompByAdmin(); 

  const activComp = async (id, status) => {
    try {
      setactivComp(true);
      const response = await baseUrl.put(
        `api/manage-comps/${id}`,
        { is_ready: status },
        {
          headers: {
            token: token,
          },
        }
      );

      if (response.status === 201) {
        if (status) {
          toast.success("تم التفعيل بنجاح");
        } else {
          toast.success("تم التعطيل بنجاح");
        }
        refetchComps(); // إعادة تحميل البيانات
      } else {
        toast.error("فشل العملية");
      }

      console.log(response);
    } catch (error) {
      console.error(error);
    } finally {
      setactivComp(false);
    }
  };

  return [activComp, activComploading];
};

export default useActivComp;
