import { useState } from "react";
import avatar from "../../img/th.jpeg";
import baseUrl from "../../api/baseUrl";
import { toast } from "react-toastify";

const useAddTeacher = () => {
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState("");

             const [name, setName] = useState("");
  const [mail, setMail] = useState("");
  const [pass, setPass] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tele, setTele] = useState("");
  const [img, setImg] = useState(avatar);
  const [classes, setSelectedGrades] = useState([]);
  const handleCheckboxChange = (value) => {
    if (classes.includes(value)) {
      setSelectedGrades(classes.filter((grade) => grade !== value));
    } else {
      setSelectedGrades([...classes, value]);
    }
  };

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
    formData.append("name", name);
    formData.append("mail", mail);
    formData.append("pass", pass);
    formData.append("subject", subject);
    formData.append("facebook", facebook);
    formData.append("tele", tele);
    classes.map((classe) => formData.append("classes", classe));
    // Check if price exists before appending it to formData

    const headers = {
      "Content-Type": "multipart/form-data",
      token: token,
    };

    try {
      const response = await baseUrl.post("api/teacher/add", formData, {
        headers,
      });

      if (response.status === 200) {
        // Success
        setLoading(false);
        toast.success("تم اضافة المدرس  بنجاح ");
        setTimeout(() => {
          window.location.reload("");
        }, 500);
      } else {
        setLoading(false);
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء إضافة المدرس  ");
      console.log(error)
    } finally {
      setLoading(false);
      setDescription("");
      setName("");
      setPass("");
      setFacebook("");
      setMail("");
      setImage("");
      setSelectedGrades("");
      setSubject(null);
      setTele("");
      setSelectedGrades("");
      console.log(classes);
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
    name,
    setName,
    onImageChange,

    img,
    mail,
    setMail,
    pass,
    setPass,

    setSubject,
    description,
    setDescription,

    facebook,
    setFacebook,
    tele,
    setTele,
    handleCheckboxChange,
    handleSubmit,
    loading,
  ];
};

export default useAddTeacher;
