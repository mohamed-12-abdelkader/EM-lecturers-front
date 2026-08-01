import { useState } from "react";
import baseUrl from "../../api/baseUrl";
import { toast } from "react-toastify";
import { persistLoginSession } from "../../utils/authStorage";

const studentLogin = () => {
  const [identifier, setIdentifier] = useState(""); // تغيير من mail إلى identifier
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  
  function generateString() {
    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var string = "";
    for (var i = 0; i < 30; i++) {
      var randomIndex = Math.floor(Math.random() * chars.length);
      string += chars[randomIndex];
    }
    return string;
  }

  const identifierChange = (e) => {
    setIdentifier(e.target.value);
  };

  const passChange = (e) => {
    setPass(e.target.value);
  };

  const handleLogin = async (e) => {
    if (!identifier || !pass) {
      toast.warn("يجب ادخال جميع البيانات");
      return;
    }
    e.preventDefault();

    try {
      setLoading(true);

      if (!localStorage.getItem("ip")) {
        var generatedString = generateString();
        localStorage.setItem("ip", generatedString);
      }

      // تحديد ما إذا كان المدخل بريدًا إلكترونيًا أو رقم هاتف
      // remember_me: جلسة طويلة عبر كوكي HttpOnly — تجربة تطبيق حقيقي
      const isEmail = identifier.includes('@');
      const requestData = isEmail
        ? { email: identifier, password: pass, remember_me: true }
        : { phone: identifier.replace(/[^0-9]/g, ''), password: pass, remember_me: true };

      const response = await baseUrl.post(`api/login`, requestData);

      persistLoginSession(response.data);

      toast.success("تم تسجيل الدخول بنجاح");
      // Redirect back if redirect param exists
      const params = new URLSearchParams(window.location.search);
      const redirectTarget = params.get("redirect");
      const destination = redirectTarget && redirectTarget.startsWith("/") ? redirectTarget : "/";
      setTimeout(() => {
        window.location.href = destination;
      }, 500);
    } catch (error) {
      if (error.response) {
        if (error.response.data.msg == "You must login from the same device") {
          toast.error("لقد تجاوزت الحد المسموح لك من الاجهزة");
        } else if (error.response.data.msg == "Invalid username or password") {
          toast.error("بيانات المستخدم غير صحيحة");
        } else {
          toast.error("حدث خطأ أثناء تسجيل الدخول");
        }
      } else {
        toast.error("حدث خطأ في الاتصال بالخادم");
      }
    } finally {
      setLoading(false);
      setIdentifier("");
      setPass("");
    }
  };

  return [
    handleLogin,
    passChange,
    identifierChange, // تغيير من mailChange إلى identifierChange
    identifier,     // تغيير من mail إلى identifier
    pass,
    loading,
  ];
};

export default studentLogin;