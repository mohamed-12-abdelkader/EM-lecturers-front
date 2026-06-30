import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";
import { useState } from "react";

const useAddExam = () => {
  const token = localStorage.getItem("token");

  const [examloading, setLoading] = useState(false);
  const [number, setNamber] = useState("");
  const [lo_id, setLo_id] = useState("");
  const [lg_id, setLg_id] = useState("");
  const [name, setName] = useState("");
  const [time, setTime] = useState("");

  const handleAddExam = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const data = {
        number,
        name,
        time,
      };

      // Conditionally add lo_id and lg_id to the request body
      if (lo_id) {
        data.lo_id = lo_id;
      }
      if (lg_id) {
        data.lg_id = lg_id;
      }

      // Pass the token and data in the request
      const response = await baseUrl.post(`api/lecture/exam`, data, {
        headers: {
          token: token,
        },
      });

      toast.success("تم   اضافة الامتحان  بنجاح    "); // "Video uploaded successfully"
      console.log(response);
    } catch (error) {
      toast.error("An error occurred. Please try again later.");
      console.log(error);
    } finally {
      setLoading(false);
      setLg_id("");
      setLo_id("");
      setName("");
      setNamber("");
    }
  };

  return [
    examloading,
    handleAddExam,
    number,
    name,
    time,
    setTime,
    setLg_id,
    setLo_id,
    setName,
    setNamber,
  ];
};

export default useAddExam;
