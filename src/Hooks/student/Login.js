import { useState } from "react";
import { useNavigate } from "react-router-dom";
import baseUrl from "../../api/baseUrl";
import { toast } from "react-toastify";
import { persistLoginSession } from "../../utils/authStorage";
import { resolveLoginTenantSubdomain } from "../../utils/tenantHost";

const studentLogin = () => {
  const navigate = useNavigate();
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

      const subdomain = resolveLoginTenantSubdomain();
      const payload = subdomain ? { subdomain, ...requestData } : requestData;

      const response = await baseUrl.post("/api/login", payload);

      persistLoginSession(response.data);

      toast.success("تم تسجيل الدخول بنجاح");
      const params = new URLSearchParams(window.location.search);
      const redirectTarget = params.get("redirect");
      const destination =
        redirectTarget &&
        redirectTarget.startsWith("/") &&
        !redirectTarget.startsWith("//")
          ? redirectTarget
          : "/home";
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 500);
    } catch (error) {
      if (error.response) {
        const apiMsg =
          error.response.data?.msg ||
          error.response.data?.message ||
          error.response.data?.error;
        if (apiMsg == "You must login from the same device") {
          toast.error("لقد تجاوزت الحد المسموح لك من الاجهزة");
        } else if (apiMsg == "Invalid username or password" || apiMsg == "Invalid credentials") {
          toast.error("بيانات المستخدم غير صحيحة");
        } else {
          toast.error(apiMsg || "حدث خطأ أثناء تسجيل الدخول");
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