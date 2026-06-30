import React, { useState } from "react";
import { toast } from "react-toastify";
import baseUrl from "../../../api/baseUrl";

const useCreateExam = () => {
  const token = localStorage.getItem("token");

  const [selectedImages, setSelectedImages] = useState([]);
  const [name, setName] = useState("");
  const [grad_id, setGrad_id] = useState("");
  const [price, setPrice] = useState("");
  const [start_at, setStart_at] = useState("");
  const [end_at, setEnd_at] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImagesChange = (images) => {
    setSelectedImages(images);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("start_at", start_at);
    formData.append("end_at", end_at);
    formData.append("grad_id", grad_id);

    if (selectedImages.length > 0) {
      selectedImages.forEach((image) => {
        formData.append("cover", image);
      });
    }

    const headers = {
      "Content-Type": "multipart/form-data",
      token: token,
    };

    try {
      const response = await baseUrl.post(
        `api/exams-manage/collections`,
        formData,
        { headers }
      );

      if (response.status === 201) {
        toast.success("تم إضافة الامتحان بنجاح");
        // إعادة تعيين الحقول بعد الإضافة الناجحة
        setName("");
        setPrice("");
        setStart_at("");
        setEnd_at("");
        setGrad_id("");
        setSelectedImages([]);
      } else {
        toast.error("فشل في إضافة الامتحان.");
      }
    } catch (error) {
      console.error("Error adding exam:", error);
      toast.error(
        error.response?.data?.message || "حدث خطأ أثناء إضافة الامتحان."
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    handleImagesChange,
    handleSubmit,
    loading,
    name,
    setName,
    grad_id,
    setGrad_id,
    price,
    setPrice,
    start_at,
    setStart_at,
    end_at,
    setEnd_at,
    selectedImages,
  };
};

export default useCreateExam;
