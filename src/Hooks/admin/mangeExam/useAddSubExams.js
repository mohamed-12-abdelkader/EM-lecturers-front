import React, { useState } from "react";
import { toast } from "react-toastify";
import baseUrl from "../../../api/baseUrl";

const useAddSubExams = () => {
  const token = localStorage.getItem("token");

  const [selectedImages, setSelectedImages] = useState([]);
  const [title, settitle] = useState("");
  const [time_minutes, settime_minutes] = useState("");
  const [questions_num, setquestions_num] = useState("");
  const [collection_id, setCollection_id] = useState("");

  const [is_ready, setis_ready] = useState("");

  const [loading, setLoading] = useState(false);

  const handleImagesChange = (images) => {
    setSelectedImages(images);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("time_minutes", time_minutes);
    formData.append("questions_num", questions_num);

    formData.append("collection_id", collection_id);
    formData.append("is_ready", false);

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
      const response = await baseUrl.post(`api/exams-manage/exams`, formData, {
        headers,
      });

      if (response.status === 201) {
        toast.success("تم إضافة الامتحان بنجاح");
        // إعادة تعيين الحقول بعد الإضافة الناجحة

        setSelectedImages([]);
      } else {
        toast.error("فشل في إضافة الامتحان.");
      }
      console.log(response);
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
    settitle,
    title,
    questions_num,
    setquestions_num,
    time_minutes,
    settime_minutes,
    setCollection_id,
    selectedImages,
  };
};

export default useAddSubExams;
