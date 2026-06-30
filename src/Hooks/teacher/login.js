import { useState } from "react";

import baseUrl from "../../api/baseUrl";
import { toast } from "react-toastify";
import { persistLoginSession } from "../../utils/authStorage";

const LoginTeacher = () => {
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

      // إذا كان المستخدم نوع "user"، قم بإرسال الـ IP

      const response = await baseUrl.post(`api/teacher/login`, { mail, pass });

      persistLoginSession(response.data);

      // يمكنك إظهار رسالة نجاح باستخدام toast
      console.log(response);
      toast.success("تم تسجيل الدخول بنجاح");
      setTimeout(() => {
        window.location.href = "/home";
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

export default LoginTeacher;
