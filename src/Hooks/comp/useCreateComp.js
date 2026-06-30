import React, { useState } from "react";
import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";

const useCreateComp = () => {
  const token = localStorage.getItem("token");

  const [selectedImages, setSelectedImages] = useState([]);
  const [grad_id, setgrad_id] = useState("");
  const [type, settype] = useState("");
  const [name, setname] = useState("");
  const [description, setdescription] = useState("");
  const [start_at, setstart_at] = useState("");
  const [end_at, setend_at] = useState("");
  const [is_ready, setis_ready] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleImagesChange = (images) => {
    setSelectedImages(images);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("type", type);
    formData.append("grad_id", grad_id);
    formData.append("name", name);
    formData.append("description", description);
    formData.append("start_at", start_at);
    formData.append("end_at", end_at);
    formData.append("is_ready", is_ready);

    if (selectedImages.length > 0) {
      selectedImages.forEach((image) => {
        formData.append("assets", image);
      });
    }

    const headers = {
      "Content-Type": "multipart/form-data",
      token: token,
    };

    try {
      const response = await baseUrl.post(`api/manage-comps`, formData, {
        headers,
      });

      if (response.status === 201) {
        toast.success("تم إضافة المسابقة  بنجاح");
      } else {
        toast.error("فشل في إضافة المسابقة.");
      }
      console.log(response.status);
    } catch (error) {
      console.error("Error adding post:", error);
      toast.error("حدث خطأ أثناء إضافة المسابقة.");
    } finally {
      setSelectedImages("");
      setLoading(false);
    }
  };

  return [
    handleImagesChange,
    handleSubmit,
    loading,
    grad_id,
    setgrad_id,
    type,
    settype,
    name,
    setname,
    description,
    setdescription,
    start_at,
    setstart_at,
    end_at,
    setend_at,
  ];
};

export default useCreateComp;
