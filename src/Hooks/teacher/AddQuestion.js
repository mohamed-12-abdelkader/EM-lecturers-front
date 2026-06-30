import { useState } from "react";
import baseUrl from "../../api/baseUrl";
import avatar from "../../img/th.jpeg";

import { toast } from "react-toastify";
const useAddQuestion = () => {
  const token = localStorage.getItem("token");
  const [image, setImage] = useState(avatar);
  const [exam_id, setExam] = useState("");
  const [question, setQuestion] = useState("");
  const [answer1, setAnswer1] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [answer3, setAnswer3] = useState("");
  const [answer4, setAnswer4] = useState("");
  const [correctAnswer, setCorrect] = useState("");
  const [degree, setDegree] = useState("");
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

    try {
      const formData = new FormData();

      formData.append("exam_id", exam_id);
      formData.append("question", question);
      formData.append("answer1", answer1);
      formData.append("answer2", answer2);
      formData.append("answer3", answer3);
      formData.append("answer4", answer4);
      formData.append("correctAnswer", correctAnswer);
      formData.append("degree", 1);

      // Check if the user selected an image
      if (image !== avatar) {
        formData.append("image", image);
      }

      const headers = {
        token: token,
      };

      const response = await baseUrl.post("api/lecture/question", formData, {
        headers,
      });

      if (response.status === 200) {
        // Success
        setLoading(false);
        toast.success("تم إضافة السؤال بنجاح");
        console.log(response);
      } else {
        // Error handling
        setLoading(false);
        toast.error("حدث خطأ أثناء إضافة السؤال");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء إضافة السؤال");
    } finally {
      setLoading(false);

      setDegree("");
      setAnswer1("");
      setAnswer2("");
      setAnswer3("");
      setAnswer4("");
      setCorrect("");
      setQuestion("");
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
  return [
    onImageChange,
    image,
    setExam,
    question,
    setQuestion,
    answer1,
    setAnswer1,
    answer2,
    setAnswer2,
    answer3,
    setAnswer3,
    answer4,
    setAnswer4,
    degree,
    setDegree,
    correctAnswer,
    setCorrect,
    loading,
    img,
    handleSubmit,
  ];
};

export default useAddQuestion;
