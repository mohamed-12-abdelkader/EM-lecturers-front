import { useState } from "react";
import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";

const useAddVideo = () => {
  const token = localStorage.getItem("token");

  const [videoloading, setLoading] = useState(false);
  const [video, setVideo] = useState("");
  const [lo_id, setLo_id] = useState("");
  const [lg_id, setLg_id] = useState("");
  const [name, setName] = useState("");

  const handleAddVideo = async (e) => {
    e.preventDefault();
    if (!video || !name) {
      toast.warn("يجب   ادخال كل البيانات  "); // "Please fill in the code fields"
      return; // Prevent unnecessary processing if required fields are empty
    }

    try {
      setLoading(true);

      const data = {
        video,
        name,
      };

      // Conditionally add lo_id and lg_id to the request body
      if (lo_id) {
        data.lo_id = lo_id;
      }
      if (lg_id) {
        data.lg_id = lg_id;
      }

      // Pass the token and data in the request
      const response = await baseUrl.post(`api/lecture/video`, data, {
        headers: {
          token: token,
        },
      });

      toast.success("تم   اضافة الفيديو  بنجاح    "); // "Video uploaded successfully"
      console.log(response);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast.error("An error occurred. Please try again later.");
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
    video,
    name,
    setLg_id,
    setLo_id,
    setName,
    setVideo,
  ];
};

export default useAddVideo;
