import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";
import { useState } from "react";

const DeleateLecture = ({ m_id }) => {
  const token = localStorage.getItem("token");
  const [deleteOnlineLoading, setDeleteOnlineLoading] = useState(false);
  // const [deleteCenterLoading, setDeleteCenterLoading] = useState(false);
  const deleteLecture = async (l_id) => {
    try {
      setDeleteOnlineLoading(true);
      await baseUrl.delete(
        `api/month/lecture/lecturefrommonth`,

        {
          headers: {
            token: token,
          },
          data: {
            m_id: m_id,
            l_id: l_id.l_id,
          },
        }
      );

      toast.success("تم حذف محاضرة الاونلاين بنجاح   ");

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
  // const deleteCenterLecture = async (id) => {
  //   try {
  //     setDeleteCenterLoading(true);
  //     await baseUrl.delete(`api/lecture/group/${id}`, {
  //       headers: {
  //         token: token,
  //       },
  //     });
  //
  //     toast.success("تم حذف محاضرة سنتر  بنجاح   ");
  //
  //     setTimeout(() => {
  //       window.location.reload();
  //     }, 500);
  //   } catch (error) {
  //     toast.error("فشل حذف المحاضرة  ");
  //   } finally {
  //     setDeleteCenterLoading(false);
  //   }
  // };
  return [deleteOnlineLoading, deleteLecture];
};

export default DeleateLecture;
