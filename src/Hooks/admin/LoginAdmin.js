import { useState } from "react";
import { useNavigate } from "react-router-dom";

import baseUrl from "../../api/baseUrl";
import { toast } from "react-toastify";
import { persistLoginSession } from "../../utils/authStorage";

const LoginAdmin = () => {
  const navigate = useNavigate();
  const [mail, setMail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState("user"); // افتراضياً نوع المستخدم عادي

  const mailChange = (e) => {
    setMail(e.target.value);
  };

  const passChange = (e) => {
    setPass(e.target.value);
  };

  const handleLogin = async (e) => {
    if (!mail || !pass) {
      toast.warn("يجب ادخال جميع البيانات ");
    }
    e.preventDefault();

    try {
      setLoading(true);

      const response = await baseUrl.post(`api/admin/login`, {
        mail,
        pass,
        remember_me: true,
      });

      persistLoginSession(response.data);

      // يمكنك إظهار رسالة نجاح باستخدام toast
      console.log(response);
      toast.success("تم تسجيل الدخول بنجاح");
      setTimeout(() => {
        navigate("/home", { replace: true });
      }, 500);
    } catch (error) {
      // يمكنك إظهار رسالة خطأ باستخدام toast
      toast.error("بيانات المستخدم غير صحيحة ");

      if (error.response.data.msg == "You must login from the same device") {
        toast.error("لقد تجاوزت الحد المسموح لك من الاجهزة ");
        return;
      } else if (error.response.data.msg == " Invalid username or password") {
        toast.error("بيانات المستخدم غير صحيحة ");
        return;
      }
    } finally {
      setLoading(false);
      setMail("");
      setPass("");
    }
  };

  return [
    handleLogin,
    passChange,
    mailChange,
    mail,
    pass,
    userType,
    setUserType,
    loading,
  ];
};

export default LoginAdmin;
