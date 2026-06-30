import { Button, Input, Spinner } from "@chakra-ui/react";
import baseUrl from "../../api/baseUrl";
import { useState } from "react";
import { toast } from "react-toastify";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
const VerifyCode = () => {
  const [mail, setMail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!mail) {
      toast.warn("يجب ادخال جميع البيانات ");
    }

    try {
      setLoading(true);

      // Pass the token in the headers
      const response = await baseUrl.post(`api/user/verifycode`, { mail });

      toast.success("تم   ارسال الايميل   بنجاح");
      setTimeout(() => {
        window.location.href = "/rest_pass";
      }, 500);
    } catch (error) {
      console.error("Error logging in:", error);
      if (error.response.data.msg == '"mail" must be a valid email') {
        toast.error("هذا الايميل غير صحيح ");
      } else if (error.response.data.msg == "No account for this user") {
        toast.error("هذا الايميل غير موجود على المنصة ");
      }
    } finally {
      setMail("");
      setLoading(false);
    }
  };
  return (
    <div
      style={{ minHeight: "80vh" }}
      className="flex justify-center items-center mt-[100px]"
    >
      <div className="w-[70%] h-[300px] border shadow flex justify-center items-center">
        <div className="w-[90%] m-auto">
          <div className="flex justify-center items-center my-5">
            <h1 className="font-bold">ادخل الايميل الخاص بك </h1>
          </div>
          <Input
            placeholder="ادخل ايميلك  "
            size="lg"
            value={mail}
            onChange={(e) => {
              setMail(e.target.value);
            }}
          />

          <div className="text-center my-3">
            <Button
              colorScheme="blue"
              isDisabled={!mail || loading}
              onClick={handleVerifyCode}
            >
              {" "}
              {loading ? <Spinner /> : "ارسال الايميل "}{" "}
            </Button>
          </div>
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
};

export default VerifyCode;
