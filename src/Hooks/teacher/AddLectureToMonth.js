import { useState } from "react";
import baseUrl from "../../api/baseUrl";
import avatar from "../../img/th.jpeg";

import { toast } from "react-toastify";

const useAddLectureToMonth = () => {
  const token = localStorage.getItem("token");
  const [image, setImage] = useState(avatar);
  const [description, setDescription] = useState("");
  const [grad_id, setGrade] = useState("");

  const [m_id, setM_id] = useState("");
  const [loading, setLoading] = useState(false);

  const [img, setImg] = useState(avatar);
  const onImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.readAsDataURL(e.target.files[0]);
      reader.onload = () => {
        const base64String = reader.result;
        const imageFile = b64toFile(base64String, "image.png");
        setImage(imageFile);
        setImg(URL.createObjectURL(imageFile));
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    const formData = new FormData();
    formData.append("image", image);
    formData.append("description", description);
    formData.append("grad_id", grad_id);
    formData.append("m_id", m_id);

    // Check if price exists before appending it to formData

    const headers = {
      "Content-Type": "multipart/form-data",
      token: token,
    };

    try {
      const response = await baseUrl.post(
        "api/lecture/addlecturemonth",
        formData,
        {
          headers,
        }
      );

      if (response.status === 200) {
        // Success
        setLoading(false);
        toast.success("تم اضافة المحاضرة بنجاح ");
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        // Error handling
        setLoading(false);
      }
    } catch (error) {
      if (
        error.response.data.msg ==
        "Maximum limit of 8 lectures reached for this month."
      ) {
        toast.error(" لقد تعديت الحد الاقصى من المحاضرات لهذا الشهر ");
      }
      console.log(error);
    } finally {
      setLoading(false);
      setImage("");
      setGrade("");
      setDescription("");
    }
  };

  const b64toFile = (base64String, filename) => {
    const arr = base64String.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    const blob = new Blob([u8arr], { type: mime });
    return new File([blob], filename, { type: mime });
  };

  return {
    image,

    description,
    setDescription,
    grad_id,
    setGrade,
    m_id,
    setM_id,
    loading,

    handleSubmit,
    onImageChange,
    img,
  };
};

export default useAddLectureToMonth;
