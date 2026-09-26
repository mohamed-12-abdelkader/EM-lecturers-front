import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaKey,
  FaQrcode,
  FaWhatsapp,
} from "react-icons/fa";
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
import {
  buildActivationSupportWhatsAppUrl,
  extractCourseFromActivationError,
  getActivationSuccessCopy,
  resolveActivationErrorCopy,
} from "../../../utils/courseActivationMessages";
import { HP_BLUE, HP_ORANGE } from "../homeTheme";

const QR_READER_ID = "hero-qr-reader";

export default function HomeProActivateCourse({
  onActivated,
  renderTrigger,
  enrolledCourseIds = [],
}) {
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

  const showSuccess = (course) => {
    const copy = getActivationSuccessCopy(course);
    setActivationResult({
      success: true,
      title: copy.title,
      message: copy.message,
      course,
    });
    resultModal.onOpen();
    onActivated?.(course);
  };

  const showError = (copy, course = null, usedCode = "") => {
    const alreadyEnrolled = copy.kind === "already_enrolled";
    const codeExhausted = copy.kind === "code_exhausted";
    setActivationResult({
      success: false,
      alreadyEnrolled,
      codeExhausted,
      title: alreadyEnrolled
        ? "أنت مشترك بالفعل"
        : codeExhausted
          ? "كود التفعيل مستنفذ"
          : "فشل تفعيل الكورس",
      message: alreadyEnrolled
        ? "أنت مشترك في هذا الكورس بالفعل."
        : copy.message,
      reason: alreadyEnrolled
        ? "اضغط «انتقل للكورس» للمتابعة مباشرة."
        : copy.reason,
      course: course || null,
      canGoToCourse: alreadyEnrolled,
      usedCode: String(usedCode || "").trim(),
      supportWhatsAppUrl: codeExhausted
        ? buildActivationSupportWhatsAppUrl(usedCode)
        : null,
    });
    resultModal.onOpen();
  };

  const handleActivationFailure = (error, usedCode = "") => {
    const course = extractCourseFromActivationError(error);
    const errorData = error?.response?.data || {};
    const copy = resolveActivationErrorCopy({
      apiMessage: errorData.message,
      apiReason: errorData.reason,
      errorData,
      course,
      enrolledCourseIds,
    });
    mainModal.onClose();
    setStep("choice");
    setActivationCode("");
    showError(copy, course, usedCode);
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
      showSuccess(course);
    } catch (error) {
      handleActivationFailure(error, code);
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
        showSuccess(course);
      }
    } catch (error) {
      handleActivationFailure(error, qrData);
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

  const handleResultClose = ({ goToCourse = false } = {}) => {
    const courseId = activationResult?.course?.id;
    resultModal.onClose();
    setActivationResult(null);
    if (!goToCourse) return;
    if (courseId) {
      navigate(`/CourseDetailsPage/${courseId}`);
      return;
    }
    navigate("/my-courses");
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
        size="sm"
        motionPreset="scale"
      >
        <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(4px)" />
        <ModalContent
          mx={4}
          maxW="360px"
          borderRadius="2xl"
          bg={modalBg}
          borderWidth="1px"
          borderColor={modalBorder}
          dir="rtl"
          boxShadow="xl"
        >
          <ModalHeader pb={2} pt={4} px={4}>
            <Text fontSize="md" fontWeight="bold" color={useColorModeValue("slate.800", "white")}>
              {step === "code" ? "تفعيل بالكود" : "تفعيل كورس"}
            </Text>
            <Text fontSize="xs" color={modalTextMuted} mt={0.5} fontWeight="normal">
              {step === "choice"
                ? "اختر طريقة التفعيل"
                : "أدخل كود الاشتراك"}
            </Text>
          </ModalHeader>
          <ModalCloseButton left={3} right="auto" size="sm" top={3} />

          <ModalBody px={4} py={3}>
            {step === "choice" ? (
              <VStack spacing={2.5} align="stretch">
                <Button
                  w="full"
                  h="44px"
                  bg="orange.500"
                  color="white"
                  _hover={{ bg: "orange.600" }}
                  borderRadius="xl"
                  fontWeight="bold"
                  fontSize="sm"
                  leftIcon={<Icon as={FaKey} />}
                  onClick={() => setStep("code")}
                >
                  تفعيل بالكود
                </Button>

                <Button
                  w="full"
                  h="44px"
                  variant="outline"
                  borderColor={useColorModeValue("blue.300", "blue.500")}
                  color={useColorModeValue("blue.700", "blue.200")}
                  _hover={{ bg: useColorModeValue("blue.50", "blue.900") }}
                  borderRadius="xl"
                  fontWeight="bold"
                  fontSize="sm"
                  leftIcon={<Icon as={FaQrcode} />}
                  onClick={openQrStep}
                >
                  تفعيل بالـ QR
                </Button>
              </VStack>
            ) : (
              <VStack spacing={3} align="stretch">
                <Input
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  placeholder="كود التفعيل"
                  size="md"
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
                  fontWeight="bold"
                  size="md"
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

          <ModalFooter pt={1} pb={3} px={4}>
            <Button variant="ghost" size="sm" onClick={closeMainModal}>
              إلغاء
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isQrOpen} onClose={closeQrScanner} isCentered size="sm" motionPreset="scale">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent
          mx={4}
          maxW="360px"
          borderRadius="2xl"
          bg={modalBg}
          borderWidth="1px"
          borderColor={modalBorder}
          dir="rtl"
        >
          <ModalHeader pb={2} pt={4} px={4}>
            <Text fontSize="md" fontWeight="bold">مسح QR</Text>
          </ModalHeader>
          <ModalCloseButton left={3} right="auto" size="sm" top={3} />
          <ModalBody px={4} py={3}>
            <VStack spacing={3}>
              <Box
                id={QR_READER_ID}
                w="full"
                maxW="280px"
                minH="240px"
                borderRadius="xl"
                overflow="hidden"
                borderWidth="1px"
                borderColor={useColorModeValue("gray.200", "gray.700")}
                bg={useColorModeValue("gray.50", "gray.800")}
              />
              <Text fontSize="xs" color={modalTextMuted} textAlign="center">
                {isScanning
                  ? "وجّه الكاميرا إلى كود QR"
                  : "جاري تشغيل الكاميرا…"}
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter pt={1} pb={3} px={4}>
            <Button variant="ghost" size="sm" onClick={closeQrScanner}>
              إغلاق
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={resultModal.isOpen}
        onClose={() => handleResultClose({ goToCourse: false })}
        isCentered
        size="sm"
      >
        <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(4px)" />
        <ModalContent borderRadius="2xl" bg={modalBg} dir="rtl" mx={4}>
          <ModalBody py={8} px={6}>
            <VStack spacing={4} textAlign="center">
              <Icon
                as={
                  activationResult?.success
                    ? FaCheckCircle
                    : activationResult?.alreadyEnrolled
                      ? FaInfoCircle
                      : FaExclamationTriangle
                }
                boxSize={12}
                color={
                  activationResult?.success
                    ? "green.400"
                    : activationResult?.alreadyEnrolled
                      ? "blue.400"
                      : "red.400"
                }
              />
              <Text
                fontWeight="black"
                fontSize="lg"
                color={
                  activationResult?.success
                    ? "green.600"
                    : activationResult?.alreadyEnrolled
                      ? "blue.600"
                      : undefined
                }
              >
                {activationResult?.title ||
                  (activationResult?.success ? "تم تفعيل الكورس بنجاح" : "فشل تفعيل الكورس")}
              </Text>
              <Text fontSize="sm" color={modalTextMuted} lineHeight="1.8">
                {activationResult?.message}
              </Text>
              {(activationResult?.success || activationResult?.alreadyEnrolled) &&
              activationResult?.course?.title ? (
                <Box
                  w="full"
                  borderRadius="xl"
                  px={4}
                  py={3}
                  bg={useColorModeValue(
                    activationResult?.alreadyEnrolled ? "blue.50" : "green.50",
                    activationResult?.alreadyEnrolled ? "blue.900" : "green.900",
                  )}
                  borderWidth="1px"
                  borderColor={useColorModeValue(
                    activationResult?.alreadyEnrolled ? "blue.200" : "green.200",
                    activationResult?.alreadyEnrolled ? "blue.700" : "green.700",
                  )}
                >
                  <Text fontSize="xs" color={modalTextMuted} mb={1}>
                    اسم الكورس
                  </Text>
                  <Text fontWeight="bold" color={useColorModeValue(HP_BLUE, "blue.200")}>
                    {activationResult.course.title}
                  </Text>
                </Box>
              ) : null}
              {!activationResult?.success && activationResult?.reason ? (
                <Text fontSize="xs" color={modalTextMuted} lineHeight="1.8">
                  {activationResult.reason}
                </Text>
              ) : null}

              {activationResult?.codeExhausted ? (
                <Box
                  w="full"
                  borderRadius="xl"
                  px={3.5}
                  py={3}
                  bg={useColorModeValue("orange.50", "orange.900")}
                  borderWidth="1px"
                  borderColor={useColorModeValue("orange.200", "orange.700")}
                  textAlign="right"
                >
                  <Text fontSize="sm" fontWeight="bold" color={useColorModeValue("orange.800", "orange.100")} mb={1}>
                    تنبيه مهم
                  </Text>
                  <Text fontSize="xs" color={modalTextMuted} lineHeight="1.8">
                    راسل الدعم الفني على واتساب لحل الخطأ ومتابعة حالة الكود
                    {activationResult.usedCode ? ` (${activationResult.usedCode})` : ""}.
                  </Text>
                </Box>
              ) : null}

              {activationResult?.success || activationResult?.alreadyEnrolled ? (
                <VStack w="full" spacing={2}>
                  <Button
                    w="full"
                    colorScheme="blue"
                    borderRadius="xl"
                    fontWeight="bold"
                    h="46px"
                    onClick={() => handleResultClose({ goToCourse: true })}
                  >
                    انتقل للكورس
                  </Button>
                  <Button
                    w="full"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResultClose({ goToCourse: false })}
                  >
                    إغلاق
                  </Button>
                </VStack>
              ) : activationResult?.codeExhausted && activationResult?.supportWhatsAppUrl ? (
                <VStack w="full" spacing={2}>
                  <Button
                    as="a"
                    href={activationResult.supportWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    w="full"
                    colorScheme="green"
                    borderRadius="xl"
                    fontWeight="bold"
                    h="46px"
                    leftIcon={<Icon as={FaWhatsapp} />}
                  >
                    تواصل عبر واتساب
                  </Button>
                  <Button
                    w="full"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResultClose({ goToCourse: false })}
                  >
                    إغلاق
                  </Button>
                </VStack>
              ) : (
                <Button
                  w="full"
                  colorScheme="gray"
                  borderRadius="xl"
                  fontWeight="bold"
                  onClick={() => handleResultClose({ goToCourse: false })}
                >
                  حسناً
                </Button>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
