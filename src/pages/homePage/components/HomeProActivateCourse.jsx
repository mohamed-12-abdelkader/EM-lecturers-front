import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaExclamationTriangle, FaKey, FaQrcode } from "react-icons/fa";
import { Html5Qrcode } from "html5-qrcode";
import {
  Box,
  Button,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import baseUrl from "../../../api/baseUrl";
import { readAuthToken } from "../../../utils/authStorage";
import { HP_BLUE, HP_ORANGE } from "../homeTheme";

const QR_READER_ID = "hero-qr-reader";

export default function HomeProActivateCourse({ onActivated, renderTrigger }) {
  const navigate = useNavigate();
  const toast = useToast();
  const mainModal = useDisclosure();
  const resultModal = useDisclosure();

  const [step, setStep] = useState("choice");
  const [activationCode, setActivationCode] = useState("");
  const [isActivatingCode, setIsActivatingCode] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrScanner, setQrScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activationResult, setActivationResult] = useState(null);

  const authHeader = useMemo(() => {
    const token = readAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const modalBg = useColorModeValue("white", "gray.800");
  const modalBorder = useColorModeValue("gray.200", "gray.700");
  const modalTextMuted = useColorModeValue("gray.500", "gray.400");

  const resetFlow = () => {
    setStep("choice");
    setActivationCode("");
    setActivationResult(null);
  };

  const closeMainModal = () => {
    mainModal.onClose();
    resetFlow();
  };

  const openChoiceModal = () => {
    resetFlow();
    mainModal.onOpen();
  };

  const showSuccess = (message, course) => {
    setActivationResult({
      success: true,
      message: message || "تم تفعيل الكورس بنجاح",
      course,
    });
    resultModal.onOpen();
    onActivated?.(course);
  };

  const showError = (message, reason) => {
    setActivationResult({
      success: false,
      message: message || "حدث خطأ في تفعيل الكورس",
      reason: reason || "يرجى المحاولة مرة أخرى",
    });
    resultModal.onOpen();
  };

  const activateByCode = async () => {
    const code = activationCode.trim();
    if (!code) {
      toast({
        title: "أدخل كود التفعيل أولاً",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsActivatingCode(true);
      const res = await baseUrl.post(
        "/api/course/activate-by-code",
        { code },
        {
          headers: {
            ...authHeader,
            "Content-Type": "application/json",
          },
        },
      );

      const course = res?.data?.course;
      closeMainModal();
      showSuccess(res?.data?.message, course);
    } catch (error) {
      toast({
        title: error?.response?.data?.message || "فشل تفعيل الكورس بالكود",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsActivatingCode(false);
    }
  };

  const activateByQr = async (qrData) => {
    try {
      const response = await baseUrl.post(
        "api/course/scan-qr-activate",
        { qr_data: qrData },
        { headers: authHeader },
      );

      if (response.data.success) {
        const course = response.data.course || {
          id: response.data.course_id,
          title: response.data.course_name || response.data.course?.title,
        };
        showSuccess(response.data.message || "تم تفعيل الكورس بنجاح!", course);
      }
    } catch (error) {
      let errorMessage =
        error.response?.data?.message || "حدث خطأ في تفعيل الكورس";
      let errorReason =
        error.response?.data?.reason || "يرجى المحاولة مرة أخرى";
      if (
        errorMessage.includes("Activation code has been fully used") ||
        errorMessage.includes("fully used")
      ) {
        errorMessage = "هذا الكود مستخدم من قبل";
        errorReason = "تم استخدام كود التفعيل هذا مسبقاً.";
      }
      showError(errorMessage, errorReason);
    }
  };

  const closeQrScanner = async () => {
    setIsScanning(false);
    if (qrScanner) {
      try {
        if ((await qrScanner.getState()) === 2) await qrScanner.stop();
        qrScanner.clear();
        setQrScanner(null);
      } catch {
        // ignore cleanup errors
      }
    }
    setIsQrOpen(false);
  };

  const startQrScanner = async () => {
    setIsScanning(true);
    try {
      const element = document.getElementById(QR_READER_ID);
      if (!element) {
        setIsScanning(false);
        return;
      }

      const html5Qrcode = new Html5Qrcode(QR_READER_ID);
      try {
        await html5Qrcode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            setIsScanning(false);
            html5Qrcode
              .stop()
              .then(() => {
                html5Qrcode.clear();
                setQrScanner(null);
                setIsQrOpen(false);
                closeMainModal();
                activateByQr(decodedText);
              })
              .catch(() => {
                html5Qrcode.clear();
                setQrScanner(null);
                setIsQrOpen(false);
                closeMainModal();
                activateByQr(decodedText);
              });
          },
          () => {},
        );
        setQrScanner(html5Qrcode);
      } catch {
        setIsScanning(false);
        toast({
          title: "تعذّر فتح الكاميرا",
          description: "تأكد من السماح بالوصول للكاميرا ثم حاول مجدداً.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      }
    } catch {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isQrOpen && !qrScanner) {
      const timer = setTimeout(startQrScanner, 400);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isQrOpen]);

  useEffect(() => {
    if (!isQrOpen && qrScanner) closeQrScanner();
  }, [isQrOpen]);

  const handleResultClose = () => {
    const courseId = activationResult?.course?.id;
    const wasSuccess = activationResult?.success;
    resultModal.onClose();
    setActivationResult(null);
    if (wasSuccess && courseId) {
      navigate(`/CourseDetailsPage/${courseId}`);
    }
  };

  const openQrStep = () => {
    closeMainModal();
    setIsQrOpen(true);
  };

  return (
    <>
      {renderTrigger ? (
        renderTrigger(openChoiceModal)
      ) : (
        <button
          type="button"
          onClick={openChoiceModal}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          style={{ background: HP_ORANGE }}
        >
          <FaKey className="text-[14px] opacity-90" />
          تفعيل كورس
        </button>
      )}

      <Modal
        isOpen={mainModal.isOpen}
        onClose={closeMainModal}
        isCentered
        size={{ base: "full", md: "md" }}
      >
        <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(6px)" />
        <ModalContent
          mx={{ base: 0, md: 4 }}
          my={{ base: 0, md: 6 }}
          borderRadius={{ base: 0, md: "2xl" }}
          bg={modalBg}
          borderWidth="1px"
          borderColor={modalBorder}
          dir="rtl"
        >
          <ModalHeader
            bg={useColorModeValue("blue.50", "blue.900")}
            borderBottomWidth="1px"
            borderColor={modalBorder}
          >
            <Text fontWeight="black" color={useColorModeValue("blue.700", "blue.200")}>
              {step === "code" ? "تفعيل بالكود" : "تفعيل كورس"}
            </Text>
            <Text fontSize="xs" color={modalTextMuted} mt={1}>
              {step === "choice"
                ? "اختر طريقة التفعيل المناسبة"
                : "أدخل كود التفعيل المرفق مع الكورس"}
            </Text>
          </ModalHeader>
          <ModalCloseButton left={3} right="auto" />

          <ModalBody py={5}>
            {step === "choice" ? (
              <VStack spacing={3} align="stretch">
                <Button
                  w="full"
                  h="auto"
                  py={4}
                  bg="orange.500"
                  color="white"
                  _hover={{ bg: "orange.600" }}
                  borderRadius="xl"
                  fontWeight="black"
                  leftIcon={<Icon as={FaKey} />}
                  onClick={() => setStep("code")}
                >
                  تفعيل بالكود
                </Button>

                <Button
                  w="full"
                  h="auto"
                  py={4}
                  variant="outline"
                  borderColor={useColorModeValue("blue.300", "blue.500")}
                  color={useColorModeValue("blue.700", "blue.200")}
                  _hover={{ bg: useColorModeValue("blue.50", "blue.900") }}
                  borderRadius="xl"
                  fontWeight="bold"
                  leftIcon={<Icon as={FaQrcode} />}
                  onClick={openQrStep}
                >
                  تفعيل بالـ QR Code
                </Button>
              </VStack>
            ) : (
              <VStack spacing={4} align="stretch">
                <Input
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  placeholder="أدخل كود التفعيل"
                  size="lg"
                  borderRadius="xl"
                  borderColor={useColorModeValue("orange.300", "orange.400")}
                  bg={useColorModeValue("white", "gray.700")}
                  _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px #dd6b20" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") activateByCode();
                  }}
                />
                <Button
                  w="full"
                  bg="orange.500"
                  color="white"
                  _hover={{ bg: "orange.600" }}
                  onClick={activateByCode}
                  isLoading={isActivatingCode}
                  borderRadius="xl"
                  fontWeight="black"
                  size="lg"
                >
                  تأكيد التفعيل
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  color={modalTextMuted}
                  onClick={() => setStep("choice")}
                >
                  رجوع
                </Button>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter borderTopWidth="1px" borderColor={modalBorder}>
            <Button variant="ghost" onClick={closeMainModal}>
              إلغاء
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isQrOpen} onClose={closeQrScanner} isCentered size={{ base: "full", md: "lg" }}>
        <ModalOverlay bg="blackAlpha.650" />
        <ModalContent
          mx={{ base: 0, md: 4 }}
          my={{ base: 0, md: 6 }}
          borderRadius={{ base: 0, md: "2xl" }}
          bg={modalBg}
          borderWidth="1px"
          borderColor={modalBorder}
          dir="rtl"
        >
          <ModalHeader borderBottomWidth="1px" borderColor={modalBorder}>
            <Text fontWeight="black">تفعيل الكورس عبر QR</Text>
          </ModalHeader>
          <ModalBody py={4}>
            <VStack spacing={3}>
              <Box
                id={QR_READER_ID}
                w="full"
                maxW="420px"
                minH={{ base: "340px", md: "320px" }}
                borderRadius="xl"
                overflow="hidden"
                borderWidth="1px"
                borderColor={useColorModeValue("gray.200", "gray.700")}
                bg={useColorModeValue("gray.50", "gray.800")}
              />
              <Text fontSize="xs" color={modalTextMuted}>
                {isScanning
                  ? "وجّه الكاميرا إلى كود QR الخاص بالتفعيل"
                  : "جاري تشغيل الكاميرا…"}
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor={modalBorder}>
            <Button variant="ghost" onClick={closeQrScanner}>
              إغلاق
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={resultModal.isOpen} onClose={handleResultClose} isCentered size="sm">
        <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl" bg={modalBg} dir="rtl">
          <ModalBody py={8} px={6}>
            <VStack spacing={4} textAlign="center">
              <Icon
                as={activationResult?.success ? FaCheckCircle : FaExclamationTriangle}
                boxSize={12}
                color={activationResult?.success ? "green.400" : "red.400"}
              />
              <Text fontWeight="black" fontSize="lg">
                {activationResult?.success ? "تم التفعيل!" : "فشل التفعيل"}
              </Text>
              <Text fontSize="sm" color={modalTextMuted}>
                {activationResult?.message}
              </Text>
              {activationResult?.success && activationResult?.course?.title ? (
                <Box
                  w="full"
                  borderRadius="xl"
                  px={4}
                  py={3}
                  bg={useColorModeValue("blue.50", "blue.900")}
                  borderWidth="1px"
                  borderColor={useColorModeValue("blue.100", "blue.700")}
                >
                  <Text fontSize="xs" color={modalTextMuted} mb={1}>
                    الكورس
                  </Text>
                  <Text fontWeight="bold" color={useColorModeValue(HP_BLUE, "blue.200")}>
                    {activationResult.course.title}
                  </Text>
                </Box>
              ) : null}
              {!activationResult?.success && activationResult?.reason ? (
                <Text fontSize="xs" color={modalTextMuted}>
                  {activationResult.reason}
                </Text>
              ) : null}
              <Button
                w="full"
                colorScheme={activationResult?.success ? "blue" : "gray"}
                borderRadius="xl"
                fontWeight="bold"
                onClick={handleResultClose}
              >
                {activationResult?.success ? "الذهاب للكورس" : "حسناً"}
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
