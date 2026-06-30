import { useState } from "react";
import { Button, Input, Spinner } from "@chakra-ui/react";
import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";

const ResetPassword = () => {
  const [code, setCode] = useState("");
  const [pass, setPass] = useState("");
  const [mail, setMail] = useState("");

  const [loading, setLoading] = useState(false);

  const handleResetPass = async (e) => {
    e.preventDefault();
    if (!mail || !code || !pass) {
      toast.warn("يجب ادخال جميع البيانات ");
    } else {
      try {
        setLoading(true);

        // Pass the token in the headers
        const response = await baseUrl.post(`api/user/resetpass`, {
          mail,
          pass,
          code,
        });

        toast.success("تم  تغير كلمة السر بنجاح     ");
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
      } catch (error) {
        console.error("Error logging in:", error);
        if (error.response.data.msg == "verify code is not correct") {
          toast.error("كود التاكيد غير صحيح  ");
        } else if (
          error.response.data.msg == 'mail" must be a valid email' ||
          error.message == "Network Error"
        ) {
          toast.error("الايميل غير صحيح ");
        }
        console.log(error.data.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      style={{ minHeight: "60vh", direction: "rtl" }}
      className="flex justify-center items-center mt-[100px]"
    >
      <div className="w-[90%] border shadow  p-5 md:w-[70%]">
        <div className="text-center my-2">
          <h1 className="font-bold"> ادخل الرمز </h1>
          <h1>
            أرسلنا إليك رمز مكون من 4 أرقام في رسالة إلى بريدك الإلكتروني، أدخل
            الرمز هنا
          </h1>
        </div>

        <div className="my-3">
          <Input
            placeholder="ادخل الكود   "
            size="lg"
            className="my-2"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
            }}
          />

          <Input
            placeholder="ادخل الايميل  "
            size="lg"
            className="my-2"
            value={mail}
            onChange={(e) => {
              setMail(e.target.value);
            }}
          />

          <Input
            placeholder=" ادخل كلمة السر الجديدة "
            size="lg"
            className="my-2"
            value={pass}
            onChange={(e) => {
              setPass(e.target.value);
            }}
          />
        </div>
        <div className="text-center">
          <Button colorScheme="blue" onClick={handleResetPass}>
            {loading ? <Spinner /> : "تعديل كلمة السر"}
          </Button>
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
};

export default ResetPassword;
