import { useState } from "react";
import { useNavigate } from "react-router-dom";
import baseUrl from "../../api/baseUrl";
import { toast } from "react-toastify";
import { persistLoginSession } from "../../utils/authStorage";
const StudentSignUp = () => {
  const navigate = useNavigate();
  const [name, setname] = useState("");

  
  const [pass, setPass] = useState("");
  const [passCon, setPassCon] = useState("");
  const [phone, setPhone] = useState("");
  const [grad, setGrad] = useState("");
  const [loading, setLoading] = useState("");

 
  const handlenameChange = (e) => {
    setname(e.target.value);
  };


  const handlePassConChange = (e) => {
    setPassCon(e.target.value);
  };
  const handlePassChange = (e) => {
    setPass(e.target.value);
  };
  const handlePhoneChange = (e) => {
    setPhone(e.target.value);
  };
  const handleGradeChange = (e) => {
    setGrad(e.target.value);
  };

  const handleLSignUp = async (e) => {
    if (pass !== passCon) {
      toast.warn("كلمة السر غير متطابقة ");
    } else if (
     !name||
     
      !pass ||
      !passCon ||
      !phone ||
      !grad
    ) {
      toast.warn(" يجب اكمال البيانات ");
    }
    e.preventDefault();
    

   
    try {
      setLoading(true);

      const response = await baseUrl.post(`api/user/register`, {
       
      name,
      password:pass,
        student_level_id:grad,
        phone,
     
      });

      console.log(response);
      persistLoginSession(response.data);

      // يمكنك إظهار رسالة نجاح باستخدام toast
      toast.success("تم  انشاء الحساب بنجاح  بنجاح");
      setTimeout(() => {
        navigate("/home", { replace: true });
      }, 500);
    } catch (error) {
      // يمكنك إظهار رسالة خطأ باستخدام toast
console.log(error)
      if (
        error.response.data.msg ===
        'duplicate key value violates unique constraint "usersip_pkey"'
      ) {
        toast.error("لقد تجاوزت الحد المسموح لك من الاجهزة ");
      } else if (error.response.data.msg === " Invalid username or password") {
        toast.error("بيانات المستخدم غير صحيحة ");
      } else if (error.response.data.msg === "This user already registered") {
        toast.error("هذا الايميل موجود بالفعل على المنصة ");
      }
      console.log(error);
      toast.error("حدث خطاء حاول مجددا ");
    } finally {
      setLoading(false);
     
    
      setPhone("");
      setPass("");
      setPassCon("");
      setGrad("");
    }
  };
  return [
    loading,
    handleLSignUp,
    handlenameChange,
    name,
    pass,
    handlePassChange,
    passCon,
    handlePassConChange,
 
    phone,
    handlePhoneChange,
    grad,
    handleGradeChange,
  ];
};

export default StudentSignUp;
