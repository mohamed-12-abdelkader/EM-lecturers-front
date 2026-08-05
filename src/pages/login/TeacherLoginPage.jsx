import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Spinner,
  VStack,
  Text,
  Icon,
  useColorModeValue,
  Checkbox,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { FiLock } from "react-icons/fi";
import { PiChalkboardTeacherBold } from "react-icons/pi";
import baseUrl from "../../api/baseUrl";
import { persistLoginSession } from "../../utils/authStorage";
import "react-toastify/dist/ReactToastify.css";

const TeacherLoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const pageBg = useColorModeValue("linear(to-br, blue.50, white)", "linear(to-br, gray.900, gray.800)");
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("gray.800", "white");
  const subtextColor = useColorModeValue("gray.600", "gray.400");
  const labelColor = useColorModeValue("gray.700", "gray.300");
  const inputBorder = useColorModeValue("gray.200", "gray.600");
  const inputBg = useColorModeValue("white", "gray.700");
  const bottomTextColor = useColorModeValue("gray.500", "gray.500");
  const cardShadow = useColorModeValue(
    "0 0 0 1px rgba(0,0,0,0.04), 0 12px 24px -8px rgba(0,0,0,0.12), 0 24px 48px -16px rgba(0,0,0,0.08)",
    "0 0 0 1px rgba(255,255,255,0.08), 0 0 40px rgba(255,255,255,0.2), 0 24px 48px -16px rgba(0,0,0,0.45)",
  );

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.warn("يجب إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    if (!email.includes("@")) {
      toast.warn("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }

    try {
      setLoading(true);

      const requestData = {
        email: email.trim(),
        password,
      };

      const response = await baseUrl.post("api/login", requestData);
      persistLoginSession(response.data);

      toast.success("تم تسجيل الدخول بنجاح");

      const params = new URLSearchParams(window.location.search);
      const redirectTarget = params.get("redirect");
      const destination =
        redirectTarget && redirectTarget.startsWith("/") ? redirectTarget : "/home";

      // تنقّل SPA مرة واحدة — بدون reload
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 800);
    } catch (error) {
      console.error("Teacher login error:", error);
      if (error.response) {
        toast.error(error.response.data.msg || error.response.data.message || "بيانات الدخول غير صحيحة");
      } else {
        toast.error("حدث خطأ في الاتصال بالخادم");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bgGradient={pageBg}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
      dir="rtl"
      style={{ fontFamily: "'Changa', sans-serif" }}
    >
      <Box position="relative" zIndex="1" w="full" maxW="440px">
        <Box
          bg={cardBg}
          borderRadius="2xl"
          p={8}
          boxShadow={cardShadow}
          borderWidth="1px"
          borderColor={cardBorder}
        >
          <VStack spacing={8} align="stretch">
            <Box textAlign="center">
              <Box
                w="16"
                h="16"
                bg="blue.500"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                mx="auto"
                mb={4}
                boxShadow="0 10px 25px rgba(66, 153, 225, 0.35)"
              >
                <Icon as={PiChalkboardTeacherBold} w="8" h="8" color="white" />
              </Box>
              <Text fontSize="2xl" fontWeight="bold" color={headingColor} mb={2}>
                تسجيل دخول المدرس
              </Text>
              <Text color={subtextColor} fontSize="md">
                أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى لوحة التحكم
              </Text>
            </Box>

            <Box as="form" onSubmit={handleLogin}>
              <VStack spacing={5}>
                <FormControl isRequired>
                  <FormLabel fontWeight="semibold" color={labelColor} mb={2}>
                    البريد الإلكتروني
                  </FormLabel>
                  <Input
                    type="email"
                    placeholder="example@email.com"
                    size="lg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    borderRadius="xl"
                    borderColor={inputBorder}
                    bg={inputBg}
                    _hover={{ borderColor: "blue.300" }}
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 2px rgba(66, 153, 225, 0.25)" }}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="semibold" color={labelColor} mb={2}>
                    كلمة المرور
                  </FormLabel>
                  <Input
                    type="password"
                    placeholder="أدخل كلمة المرور"
                    size="lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    borderRadius="xl"
                    borderColor={inputBorder}
                    bg={inputBg}
                    _hover={{ borderColor: "blue.300" }}
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 2px rgba(66, 153, 225, 0.25)" }}
                  />
                </FormControl>

                <Button
                  type="submit"
                  size="lg"
                  w="full"
                  bg="orange.500"
                  color="white"
                  _hover={{ bg: "orange.400" }}
                  _active={{ bg: "orange.600" }}
                  borderRadius="xl"
                  fontSize="lg"
                  fontWeight="bold"
                  rightIcon={loading ? <Spinner size="sm" color="white" /> : undefined}
                  isDisabled={loading}
                >
                  {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                </Button>
              </VStack>
            </Box>

            <Checkbox
              isChecked
              onChange={() => navigate("/login")}
              colorScheme="blue"
              size="lg"
              alignSelf="flex-start"
              color={labelColor}
            >
              تسجيل دخول كطالب
            </Checkbox>

            <Box textAlign="center">
              <Link
                to="/verify_code"
                style={{ color: "#3182ce", fontSize: "14px" }}
              >
                هل نسيت كلمة المرور؟
              </Link>
            </Box>
          </VStack>
        </Box>

        <Box mt={6} textAlign="center">
          <Text fontSize="sm" color={bottomTextColor}>
            <Icon as={FiLock} display="inline" mr={1} />
            اتصال آمن عبر المنصة الرئيسية
          </Text>
        </Box>
      </Box>

      <ScrollToTop />
      <ToastContainer position="top-center" />
    </Box>
  );
};

export default TeacherLoginPage;
