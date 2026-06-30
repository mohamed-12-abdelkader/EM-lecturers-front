import React, { useState } from "react";
import { toast } from "react-toastify";
import baseUrl from "../../../api/baseUrl";
import useGitAllExams from "./useGitAllExams";

const useActiveExam = ({ api }) => {
  const token = localStorage.getItem("token");
  const [is_ready, setis_ready] = useState(true);
  const [activloading, setactivComp] = useState(false);
  const [examsLoading, exams, refetchExam] = useGitAllExams();
  const activExam = async (id, status) => {
    try {
      setactivComp(true);
      const response = await baseUrl.put(
        `api/exams-manage/${api}/${id}`,
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
      } else {
        toast.error("فشل العملية");
      }
      refetchExam();
      console.log(response);
    } catch (error) {
      console.error(error);
    } finally {
      refetchExam();
      setactivComp();
    }
  };

  return [activExam, activloading];
};

export default useActiveExam;
