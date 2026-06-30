import { useState } from "react";

import baseUrl from "../../api/baseUrl";
import { toast } from "react-toastify";
import { persistLoginSession } from "../../utils/authStorage";

const useLogin = () => {
  const [mail, setMail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState("user"); // افتراضياً نوع المستخدم عادي

  function generateString() {
    var chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var string = "";
    for (var i = 0; i < 30; i++) {
      var randomIndex = Math.floor(Math.random() * chars.length);
      string += chars[randomIndex];
    }
    return string;
  }

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
      let loginApi;

      if (userType === "admin") {
        loginApi = "api/admin/login";
      } else if (userType === "teacher") {
        loginApi = "api/teacher/login";
      } else {
        if (!localStorage.getItem("ip")) {
          var generatedString = generateString(); // تأكد من تعريف الدالة generateString()
          localStorage.setItem("ip", generatedString); // استخدم generatedString بدلاً من generateString
        }
        loginApi = "api/user/login";
      }

      // إذا كان المستخدم نوع "user"، قم بإرسال الـ IP
      const requestData =
        userType === "user"
          ? { mail, pass, ip: localStorage.getItem("ip") }
          : { mail, pass };

      const response = await baseUrl.post(`${loginApi}`, requestData);

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

export default useLogin;
