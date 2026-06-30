import { Button, Input, Spinner } from "@chakra-ui/react";
import { useState } from "react";
import { toast } from "react-toastify";
import baseUrl from "../../api/baseUrl";

const OpenPhone = () => {
  const token = localStorage.getItem("token");
  const [mail, setMail] = useState("");
  const [loading, setLoading] = useState("");
  const handleOpenPhone = async (e) => {
    e.preventDefault();
    if (!mail) {
      toast.warn("يجب ادخال جميع البيانات ");
    }

    try {
      setLoading(true);

      // Pass the token in the headers
      const response = await baseUrl.put(
        `api/code/changeuserdevice`,
        { mail },
        {
          headers: {
            token: token,
          },
        }
      );
      console.log(response);
      toast.success("تم     فتح جهاز اخر بنجاح ");
    } catch (error) {
      if (error.response.data.msg == "User not found") {
        toast.error("هذا الحساب غير موجود على المنصة ");
      } else {
        toast.error("فشل   فتح جهاز اخر  ");
      }
    } finally {
      setMail("");
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-center">
        <div className="ribbon2">
          <h1 className="font-bold m-2 mx-4 text-white">
            {" "}
            فتح جهاز اخر للطالب{" "}
          </h1>
        </div>
      </div>

      <div className="my-5">
        <h1 className="font-bold my-2"> ادخل ايميل الطالب </h1>
        <Input
          placeholder=" ادخل ايميل الطالب  "
          size="lg"
          value={mail}
          onChange={(e) => {
            setMail(e.target.value);
          }}
        />
      </div>
      <div className="text-center my-5">
        <Button colorScheme="blue" onClick={handleOpenPhone}>
          {" "}
          {loading ? <Spinner /> : "فتح الجهاز "}{" "}
        </Button>
      </div>
    </div>
  );
};

export default OpenPhone;
