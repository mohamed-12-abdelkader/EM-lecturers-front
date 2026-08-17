import { useState } from "react";

import { useNavigate } from "react-router-dom";

import baseUrl from "../../api/baseUrl";

import { toast } from "react-toastify";

import { persistLoginSession } from "../../utils/authStorage";

import { resolveLoginTenantSubdomain } from "../../utils/tenantHost";

import {

  appendDeviceIp,

  getAuthDeviceErrorMessage,

  handleAuthIpRegistered,

  isAccountIpMismatchError,

} from "../../utils/deviceRestriction";



const studentLogin = () => {

  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");

  const [pass, setPass] = useState("");

  const [loading, setLoading] = useState(false);



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



      const isEmail = identifier.includes("@");

      const requestData = isEmail

        ? { email: identifier, password: pass, remember_me: true }

        : { phone: identifier.replace(/[^0-9]/g, ""), password: pass, remember_me: true };



      const subdomain = resolveLoginTenantSubdomain();

      const payload = appendDeviceIp(subdomain ? { subdomain, ...requestData } : requestData);



      const response = await baseUrl.post("/api/login", payload);



      persistLoginSession(response.data);

      handleAuthIpRegistered(response.data);



      if (response.data?.ip_registered) {

        toast.info("تم ربط حسابك بهذا المتصفح");

      }



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

      const apiMsg = getAuthDeviceErrorMessage(error, "حدث خطأ أثناء تسجيل الدخول");

      if (isAccountIpMismatchError(error)) {

        toast.error(apiMsg, { autoClose: 8000 });

      } else if (

        apiMsg === "Invalid username or password" ||

        apiMsg === "Invalid credentials"

      ) {

        toast.error("بيانات المستخدم غير صحيحة");

      } else if (apiMsg === "You must login from the same device") {

        toast.error("لقد تجاوزت الحد المسموح لك من الاجهزة");

      } else {

        toast.error(apiMsg);

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

    identifierChange,

    identifier,

    pass,

    loading,

  ];

};



export default studentLogin;

