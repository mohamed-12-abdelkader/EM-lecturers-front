import { useState } from "react";
import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";

const useAddPdf = () => {
  const token = localStorage.getItem("token");

  const [videoloading, setLoading] = useState(false);
  const [pdfPath, setVideo] = useState("");
  const [lo_id, setLo_id] = useState("");
  const [lg_id, setLg_id] = useState("");
  const [pdfname, setName] = useState("");

  const handleAddVideo = async (e) => {
    e.preventDefault();
    if (!pdfPath || !pdfname) {
      toast.warn("يجب   ادخال كل البيانات  "); // "Please fill in the code fields"
      return; // Prevent unnecessary processing if required fields are empty
    }

    try {
      setLoading(true);

      const data = {
        pdfPath,
        pdfname,
      };

      // Conditionally add lo_id and lg_id to the request body
      if (lo_id) {
        data.lo_id = lo_id;
      }
      if (lg_id) {
        data.lg_id = lg_id;
      }

      // Pass the token and data in the request
      const response = await baseUrl.post(`api/lecture/pdf`, data, {
        headers: {
          token: token,
        },
      });

      toast.success("تم   اضافة الملف   بنجاح    "); // "Video uploaded successfully"
      console.log(response);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast.error("An error occurred. Please try again later.");
      console.log(error);
    } finally {
      setLoading(false);
      setLg_id("");
      setLo_id("");
      setName("");
      setVideo("");
    }
  };

  return [
    videoloading,
    handleAddVideo,
    pdfPath,
    pdfname,
    setLg_id,
    setLo_id,
    setName,
    setVideo,
  ];
};

export default useAddPdf;
