import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input,
  InputGroup,
  InputLeftElement,
  Spinner, 
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  VStack,
  HStack,
  Text,
  Icon,
  Flex,
  Image,
  useColorModeValue,
  useColorMode,
  Checkbox
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { FiLock, FiPhone, FiCheckCircle, FiUser } from "react-icons/fi";
import { FaMoon, FaSun, FaBars, FaTimes } from "react-icons/fa";
import baseUrl from "../../api/baseUrl";
import {
  ensureTenantAuthContext,
  resolveLoginTenantSubdomain,
  resolveTenantSubdomain,
  withTenantQuery,
} from "../../utils/tenantHost";
import { persistLoginSession } from "../../utils/authStorage";
import { getPostLoginPath } from "../../utils/authRoles";
import {
  appendDeviceIp,
  getAuthDeviceErrorMessage,
  handleAuthIpRegistered,
  isAccountIpMismatchError,
  isSingleDeviceLimit,
  SINGLE_DEVICE_NOTICE,
} from "../../utils/deviceRestriction";
import { fetchPublicDeviceRestrictionSettings } from "../../api/deviceRestrictionApi";
import { fetchPublicRegistrationSettings } from "../../api/courseGroupsApi";
import { TenantPublicNavbarShell } from "../tenantPublic/components/TenantPublicNavbar";
import DeviceMismatchModal from "./components/DeviceMismatchModal";
import "react-toastify/dist/ReactToastify.css";

const BLUE = "#3182CE";
const ORANGE = "#DD6B20";
const LOGIN_HERO = "/images/login-hero.png";

const LOGIN_STATS = [
  { value: "20K+", label: "طالب نشط" },
  { value: "200+", label: "محاضر" },
  { value: "500+", label: "مؤسسة" },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const [tenantSubdomain, setTenantSubdomain] = useState(() => resolveTenantSubdomain());
  const hasTenantNavbar = Boolean(tenantSubdomain);
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeviceMismatchOpen,
    onOpen: onDeviceMismatchOpen,
    onClose: onDeviceMismatchClose,
  } = useDisclosure();
  const { 
    isOpen: isSupportOpen, 
    onOpen: onSupportOpen, 
    onClose: onSupportClose 
  } = useDisclosure();
  const [identifier, setIdentifier] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [singleDeviceMode, setSingleDeviceMode] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState("");
  const [deviceMismatchMessage, setDeviceMismatchMessage] = useState("");

  useEffect(() => {
    const resolved = ensureTenantAuthContext();
    if (resolved) setTenantSubdomain(resolved);
  }, []);

  useEffect(() => {
    if (!tenantSubdomain) {
      setSingleDeviceMode(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [deviceSettings, registrationSettings] = await Promise.all([
          fetchPublicDeviceRestrictionSettings(tenantSubdomain).catch(() => null),
          fetchPublicRegistrationSettings(tenantSubdomain).catch(() => null),
        ]);
        if (cancelled) return;
        const settings = deviceSettings || registrationSettings;
        setSingleDeviceMode(isSingleDeviceLimit(settings));
      } catch {
        if (!cancelled) setSingleDeviceMode(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tenantSubdomain]);

  const pageBg = useColorModeValue("#f8fafc", "gray.950");
  const illustrationBg = useColorModeValue("#f0f6ff", "gray.900");
  const formPanelBg = useColorModeValue("white", "gray.950");
  const headingColor = useColorModeValue("slate.900", "white");
  const subtextColor = useColorModeValue("slate.500", "gray.400");
  const labelColor = useColorModeValue("slate.700", "gray.300");
  const inputBorder = useColorModeValue("slate.200", "gray.600");
  const inputBg = useColorModeValue("white", "gray.900");
  const bottomTextColor = useColorModeValue("slate.400", "gray.500");
  const statBg = useColorModeValue("white", "whiteAlpha.50");
  const statBorder = useColorModeValue("slate.200", "whiteAlpha.100");
  const imageBlendMode = useColorModeValue("lighten", "normal");
  const panelDivider = useColorModeValue("slate.200", "gray.800");
  const blobColor = useColorModeValue("rgba(49,130,206,0.12)", "rgba(49,130,206,0.08)");
  const outlineHoverBg = useColorModeValue("slate.50", "whiteAlpha.50");

  const playAuthSuccessSound = async () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      const master = audioCtx.createGain();
      master.gain.setValueAtTime(0.36, audioCtx.currentTime);
      master.connect(audioCtx.destination);

      const note = (start, from, to, dur, wave = "triangle", volume = 1.0) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(from, audioCtx.currentTime + start);
        osc.frequency.exponentialRampToValueAtTime(
          to,
          audioCtx.currentTime + start + dur,
        );
        gain.gain.setValueAtTime(0.0001, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(
          volume,
          audioCtx.currentTime + start + 0.03,
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          audioCtx.currentTime + start + dur + 0.05,
        );
        osc.connect(gain);
        gain.connect(master);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + dur + 0.06);
      };

      note(0, 330, 520, 0.32, "sine", 0.95);
      note(0.26, 520, 780, 0.34, "triangle", 1.0);
      note(0.56, 780, 1160, 0.36, "square", 1.05);
      note(0.88, 980, 1460, 0.38, "sawtooth", 1.08);

      setTimeout(() => {
        audioCtx.close();
      }, 1500);
    } catch {
      // ignore sound issues
    }
  };

  const identifierChange = (e) => {
    setIdentifier(e.target.value);
  };

  const passChange = (e) => {
    setPass(e.target.value);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!identifier || !pass) {
      toast.warn("يجب ادخال جميع البيانات");
      return;
    }

    try {
      setLoading(true);
      setLoginErrorMessage("");
      setDeviceMismatchMessage("");

      const isEmail = identifier.includes("@");
      const subdomain = resolveLoginTenantSubdomain();
      const basePayload = isEmail
        ? {
            email: identifier.trim(),
            password: pass,
          }
        : {
            phone: identifier.replace(/[^0-9]/g, ""),
            password: pass,
          };
      const requestData = appendDeviceIp(
        subdomain ? { subdomain, ...basePayload } : basePayload,
      );

      const response = await baseUrl.post("/api/login", requestData);

      persistLoginSession(response.data);
      handleAuthIpRegistered(response.data);

      setShowSuccessModal(true);
      void playAuthSuccessSound();

      if (response.data?.ip_registered) {
        toast.info("تم ربط حسابك بهذا المتصفح");
      }

      const params = new URLSearchParams(window.location.search);
      const redirectTarget = params.get("redirect");
      const user = response.data?.user ?? response.data?.data?.user;
      const destination = getPostLoginPath(user, redirectTarget);
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 1400);
    } catch (error) {
      console.error("Login error:", error);
      const apiMsg = getAuthDeviceErrorMessage(error);
      const legacyDeviceMsg =
        error.response?.data?.msg === "You must login from the same device";
      const mismatch = isAccountIpMismatchError(error) || legacyDeviceMsg;

      if (mismatch) {
        setDeviceMismatchMessage(
          apiMsg ||
            "هذا الحساب مسجّل على جهاز أو متصفح آخر من قبل. تواصل مع المدرس للسماح لك باستخدام جهاز آخر.",
        );
        onDeviceMismatchOpen();
      } else {
        setLoginErrorMessage(apiMsg);
        onOpen();
        toast.error(apiMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      bg={pageBg}
      position="relative"
      overflow="hidden"
      dir="rtl"
      style={{ fontFamily: "'Changa', sans-serif" }}
    >
      {hasTenantNavbar ? (
        <TenantPublicNavbarShell variant="auth" />
      ) : (
      <header className="fixed top-0 right-0 left-0 z-50 border-b border-slate-200/70 bg-white/70 shadow-[0_12px_32px_rgb(15,23,42,0.06)] backdrop-blur-2xl backdrop-saturate-150 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="mx-auto flex h-[4.65rem] max-w-[1200px] items-center justify-between gap-3 px-4 md:px-6 lg:px-8">
          <Link to="/" className="group relative flex items-center gap-3 rounded-2xl py-1 transition">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-lg font-black text-white shadow-lg shadow-blue-500/30">
              N
            </span>
            <span className="flex flex-col">
              <span className="text-base font-black text-slate-900 dark:text-white">Next Edu</span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">منصة تعليمية</span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={toggleColorMode}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label={colorMode === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
            >
              {colorMode === "dark" ? <FaSun className="text-sm" /> : <FaMoon className="text-sm" />}
            </button>
            <Link
              to={withTenantQuery("/signup", tenantSubdomain)}
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              إنشاء حساب
            </Link>
            <Link
              to={withTenantQuery("/login", tenantSubdomain)}
              className="rounded-xl bg-gradient-to-l from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:brightness-110"
            >
              تسجيل الدخول
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <button
              type="button"
              onClick={toggleColorMode}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label={colorMode === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
            >
              {colorMode === "dark" ? <FaSun className="text-sm" /> : <FaMoon className="text-sm" />}
            </button>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              aria-expanded={isMobileMenuOpen}
              aria-label="فتح القائمة"
            >
              {isMobileMenuOpen ? <FaTimes className="text-base" /> : <FaBars className="text-base" />}
            </button>
          </div>
        </div>
        {isMobileMenuOpen ? (
          <div className="border-t border-slate-200 bg-white/95 px-4 pb-4 pt-3 shadow-sm backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/95 sm:hidden">
            <div className="grid grid-cols-2 gap-2">
              <Link
                to={withTenantQuery("/signup", tenantSubdomain)}
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                إنشاء حساب
              </Link>
              <Link
                to={withTenantQuery("/login", tenantSubdomain)}
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-l from-blue-600 to-blue-500 px-4 text-sm font-bold text-white shadow-md shadow-blue-600/25 transition hover:brightness-110"
              >
                تسجيل الدخول
              </Link>
            </div>
          </div>
        ) : null}
      </header>
      )}

      <Flex
        minH="100vh"
        direction={{ base: "column", lg: "row" }}
        bg={pageBg}
        pt={{ base: hasTenantNavbar ? "4.5rem" : "4.65rem", lg: 0 }}
      >
        {/* Illustration panel */}
        <Flex
          flex={1}
          display={{ base: "none", lg: "flex" }}
          position="relative"
          align="center"
          justify="center"
          bg={illustrationBg}
          px={{ lg: 12, xl: 16 }}
          py={16}
          overflow="hidden"
        >
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -48%)"
            w="480px"
            h="480px"
            borderRadius="full"
            bg={blobColor}
            filter="blur(90px)"
            pointerEvents="none"
          />

          <Flex
            position="relative"
            zIndex={1}
            direction="column"
            align="flex-start"
            maxW="520px"
            w="full"
            gap={0}
          >
            <Box
              display="inline-flex"
              alignItems="center"
              gap={2}
              px={3}
              py={1.5}
              mb={6}
              borderRadius="full"
              bg={statBg}
              border="1px solid"
              borderColor={statBorder}
              boxShadow="0 1px 2px rgba(15,23,42,0.04)"
            >
              <Box w={2} h={2} borderRadius="full" bg={BLUE} />
              <Text fontSize="xs" fontWeight="bold" color={subtextColor} letterSpacing="0.02em">
                منصة Next Edu التعليمية
              </Text>
            </Box>

            <Text
              as="h1"
              fontSize={{ lg: "4xl", xl: "4.5xl" }}
              fontWeight="900"
              color={headingColor}
              lineHeight="1.2"
              letterSpacing="-0.02em"
              mb={4}
            >
              مرحباً
              <Box as="span" display="block" color={BLUE}>
                بعودتك مجدداً
              </Box>
            </Text>

            <Text
              fontSize="lg"
              color={subtextColor}
              lineHeight="1.85"
              maxW="420px"
              mb={2}
            >
              سجّل دخولك وتابع دروسك وامتحاناتك — تعلّم في أي وقت ومن أي مكان.
            </Text>

            <Box
              position="relative"
              w="full"
              my={6}
              display="flex"
              alignItems="center"
              justifyContent="center"
              minH="380px"
            >
              <Image
                src={LOGIN_HERO}
                alt="طالب يتعلّم"
                maxH="400px"
                w="auto"
                maxW="100%"
                objectFit="contain"
                mixBlendMode={imageBlendMode}
                loading="eager"
                draggable={false}
                sx={{ background: "transparent" }}
              />
            </Box>

            <HStack spacing={3} w="full" flexWrap="wrap">
              {LOGIN_STATS.map(({ value, label }) => (
                <Box
                  key={label}
                  flex="1"
                  minW="120px"
                  px={4}
                  py={3}
                  borderRadius="xl"
                  bg={statBg}
                  border="1px solid"
                  borderColor={statBorder}
                  boxShadow="0 1px 2px rgba(15,23,42,0.04)"
                >
                  <Text fontSize="xl" fontWeight="900" color={BLUE} lineHeight="1.2">
                    {value}
                  </Text>
                  <Text fontSize="xs" fontWeight="semibold" color={subtextColor} mt={0.5}>
                    {label}
                  </Text>
                </Box>
              ))}
            </HStack>
          </Flex>
        </Flex>

        {/* Form panel */}
        <Flex
          flex={1}
          bg={formPanelBg}
          align="center"
          justify="center"
          px={{ base: 5, sm: 8, lg: 12, xl: 16 }}
          py={{ base: 10, lg: 16 }}
          borderRight={{ lg: "1px solid" }}
          borderColor={panelDivider}
        >
          <Box w="full" maxW="400px">
            <Box display={{ base: "flex", lg: "none" }} justifyContent="center" mb={8}>
              <Image
                src={LOGIN_HERO}
                alt="طالب يتعلّم"
                maxH="200px"
                w="auto"
                objectFit="contain"
                mixBlendMode={imageBlendMode}
                draggable={false}
                sx={{ background: "transparent" }}
              />
            </Box>

            <Box mb={8}>
              <Text
                fontSize={{ base: "2xl", sm: "3xl" }}
                fontWeight="900"
                color={headingColor}
                letterSpacing="-0.02em"
                mb={2}
              >
                تسجيل الدخول
              </Text>
              <Text fontSize="md" color={subtextColor} lineHeight="1.7">
                أدخل بيانات حسابك للمتابعة إلى لوحة التعلم
              </Text>
              {singleDeviceMode ? (
                <Box
                  mt={4}
                  p={3}
                  borderRadius="xl"
                  bg="orange.50"
                  border="1px solid"
                  borderColor="orange.200"
                  _dark={{ bg: "whiteAlpha.100", borderColor: "orange.700" }}
                >
                  <Text fontSize="xs" color="orange.800" _dark={{ color: "orange.200" }} lineHeight="tall">
                    {SINGLE_DEVICE_NOTICE}
                  </Text>
                </Box>
              ) : null}
            </Box>

            <Box as="form" onSubmit={handleLogin}>
              <VStack spacing={5} align="stretch">
                <FormControl>
                  <FormLabel fontWeight="semibold" color={labelColor} mb={2} fontSize="sm">
                    رقم الهاتف أو البريد الإلكتروني
                  </FormLabel>
                  <InputGroup size="lg">
                    <InputLeftElement pointerEvents="none" h="full">
                      <Icon as={FiUser} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="01xxxxxxxxx أو name@email.com"
                      value={identifier}
                      onChange={identifierChange}
                      pl={12}
                      h="52px"
                      borderRadius="xl"
                      borderColor={inputBorder}
                      bg={inputBg}
                      fontSize="sm"
                      _placeholder={{ color: "gray.400" }}
                      _hover={{ borderColor: "blue.300" }}
                      _focus={{
                        borderColor: BLUE,
                        boxShadow: `0 0 0 3px rgba(49,130,206,0.15)`,
                      }}
                      transition="all 0.15s"
                    />
                  </InputGroup>
                </FormControl>

                <FormControl>
                  <Flex justify="space-between" align="center" mb={2}>
                    <FormLabel fontWeight="semibold" color={labelColor} mb={0} fontSize="sm">
                      كلمة المرور
                    </FormLabel>
                    <Link
                      to="/verify_code"
                      style={{ fontSize: "0.8125rem", color: BLUE, fontWeight: 600 }}
                    >
                      نسيت كلمة المرور؟
                    </Link>
                  </Flex>
                  <InputGroup size="lg">
                    <InputLeftElement pointerEvents="none" h="full">
                      <Icon as={FiLock} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={pass}
                      onChange={passChange}
                      pl={12}
                      h="52px"
                      borderRadius="xl"
                      borderColor={inputBorder}
                      bg={inputBg}
                      fontSize="sm"
                      _placeholder={{ color: "gray.400" }}
                      _hover={{ borderColor: "blue.300" }}
                      _focus={{
                        borderColor: BLUE,
                        boxShadow: `0 0 0 3px rgba(49,130,206,0.15)`,
                      }}
                      transition="all 0.15s"
                    />
                  </InputGroup>
                </FormControl>

                <Checkbox
                  isChecked={false}
                  onChange={(e) => {
                    if (e.target.checked) navigate("/teacher-login");
                  }}
                  colorScheme="blue"
                  size="md"
                  color={labelColor}
                  mt={1}
                >
                  تسجيل دخول كمدرس
                </Checkbox>

                <Button
                  type="submit"
                  size="lg"
                  w="full"
                  h="52px"
                  mt={2}
                  bg={BLUE}
                  color="white"
                  _hover={{
                    bg: "#2b6cb0",
                    transform: "translateY(-1px)",
                    boxShadow: "0 8px 24px rgba(49,130,206,0.35)",
                  }}
                  _active={{ bg: "#2c5282", transform: "translateY(0)" }}
                  borderRadius="xl"
                  fontSize="md"
                  fontWeight="bold"
                  boxShadow="0 4px 14px rgba(49,130,206,0.25)"
                  transition="all 0.2s"
                  rightIcon={loading ? <Spinner size="sm" color="white" /> : undefined}
                  isDisabled={loading}
                >
                  {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                </Button>
              </VStack>
            </Box>

            <Box mt={8} pt={8} borderTop="1px solid" borderColor={panelDivider} textAlign="center">
              <Text fontSize="sm" color={subtextColor} mb={4}>
                ليس لديك حساب بعد؟
              </Text>
              <Button
                variant="outline"
                borderColor={inputBorder}
                color={headingColor}
                _hover={{ bg: outlineHoverBg, borderColor: BLUE }}
                size="lg"
                w="full"
                h="48px"
                borderRadius="xl"
                fontSize="sm"
                fontWeight="semibold"
                transition="all 0.2s"
                onClick={() => navigate(withTenantQuery("/signup", tenantSubdomain))}
              >
                إنشاء حساب جديد
              </Button>
            </Box>

            <Text mt={8} textAlign="center" fontSize="xs" color={bottomTextColor}>
              محمي بتشفير آمن · Next Edu © {new Date().getFullYear()}
            </Text>
          </Box>
        </Flex>
      </Flex>
      <ScrollToTop />
      <ToastContainer position="top-center" />

      <DeviceMismatchModal
        isOpen={isDeviceMismatchOpen}
        onClose={onDeviceMismatchClose}
        message={deviceMismatchMessage}
      />

      {/* Modal for login error */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
        <ModalContent mx={4} borderRadius="2xl" overflow="hidden">
          <ModalHeader textAlign="center" bg="red.50" py={6}>
            <VStack spacing={3}>
              <Box
                w="60px"
                h="60px"
                bgGradient="linear(135deg, #ef4444 0%, #dc2626 100%)"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={FiLock} w="30px" h="30px" color="white" />
              </Box>
              <Text fontSize="xl" fontWeight="bold" color="red.800">
                خطأ في تسجيل الدخول
              </Text>
            </VStack>
          </ModalHeader>
          
          <ModalBody py={8}>
            <VStack spacing={4} textAlign="center">
              <Text fontSize="lg" color="gray.600">
                رقم الهاتف أو البريد الإلكتروني أو كلمة المرور غير صحيحة
              </Text>
              <Text fontSize="md" color="gray.500">
                {loginErrorMessage || "يبدو أن البيانات المدخلة غير صحيحة. تأكد من صحة البيانات المدخلة"}
              </Text>

              <Box
                bg="blue.50"
                borderRadius="lg"
                p={4}
                border="1px solid"
                borderColor="blue.200"
                w="full"
              >
                <Text fontSize="sm" color="blue.700" fontWeight="medium" mb={2}>
                  💡 لا تتذكر كلمة المرور أو رقم الهاتف؟
                </Text>
                <Text fontSize="sm" color="blue.600">
                  تواصل مع الدعم الفني وسنساعدك في استعادة حسابك
                </Text>
              </Box>

              <Box
                bg="green.50"
                borderRadius="lg"
                p={4}
                border="1px solid"
                borderColor="green.200"
                w="full"
              >
                <Text fontSize="sm" color="green.700" fontWeight="medium" mb={3}>
                  📞 تواصل مع الدعم الفني:
                </Text>
                <VStack spacing={3}>
                  <Button
                    as="a"
                    href="https://wa.me/201111272393"
                    target="_blank"
                    rel="noopener noreferrer"
                    bg="green.500"
                    color="white"
                    _hover={{
                      bg: "green.600",
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 12px rgba(34, 197, 94, 0.4)"
                    }}
                    _active={{
                      bg: "green.700"
                    }}
                    leftIcon={<Icon as={FiPhone} />}
                    size="sm"
                    w="full"
                    borderRadius="lg"
                    transition="all 0.3s ease"
                  >
                    واتساب: 01111272393
                  </Button>
                  <Button
                    as="a"
                    href="https://wa.me/201288781012"
                    target="_blank"
                    rel="noopener noreferrer"
                    bg="green.500"
                    color="white"
                    _hover={{
                      bg: "green.600",
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 12px rgba(34, 197, 94, 0.4)"
                    }}
                    _active={{
                      bg: "green.700"
                    }}
                    leftIcon={<Icon as={FiPhone} />}
                    size="sm"
                    w="full"
                    borderRadius="lg"
                    transition="all 0.3s ease"
                  >
                    واتساب: 01288781012
                  </Button>
                  <Button
                    as="a"
                    href="https://wa.me/201210726096"
                    target="_blank"
                    rel="noopener noreferrer"
                    bg="green.500"
                    color="white"
                    _hover={{
                      bg: "green.600",
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 12px rgba(34, 197, 94, 0.4)"
                    }}
                    _active={{
                      bg: "green.700"
                    }}
                    leftIcon={<Icon as={FiPhone} />}
                    size="sm"
                    w="full"
                    borderRadius="lg"
                    transition="all 0.3s ease"
                  >
                    واتساب: 01210726096
                  </Button>
                  
               
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          
          <ModalFooter justifyContent="center" py={6}>
            <VStack spacing={3} w="full">
              <HStack spacing={4} w="full" maxW="300px">
                <Button
                  variant="outline"
                  onClick={onClose}
                  flex={1}
                  borderRadius="xl"
                  borderColor="gray.300"
                  _hover={{ borderColor: "gray.400", bg: "gray.50" }}
                >
                  إعادة المحاولة
                </Button>
                <Button
                  bg="orange.500"
                  color="white"
                  _hover={{ bg: "orange.400", boxShadow: "0 10px 25px rgba(237, 137, 54, 0.35)" }}
                  flex={1}
                  borderRadius="xl"
                  onClick={() => {
                    onClose();
                    navigate("/signup");
                  }}
                  boxShadow="0 8px 20px rgba(237, 137, 54, 0.3)"
                >
                  إنشاء حساب جديد
                </Button>
              </HStack>
            </VStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Support Modal */}
      <Modal isOpen={isSupportOpen} onClose={onSupportClose} isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
        <ModalContent mx={4} borderRadius="2xl" overflow="hidden">
          <ModalHeader textAlign="center" bg="red.50" py={6}>
            <VStack spacing={3}>
              <Box
                w="60px"
                h="60px"
                bgGradient="linear(135deg, #ef4444 0%, #dc2626 100%)"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={FiPhone} w="30px" h="30px" color="white" />
              </Box>
              <Text fontSize="xl" fontWeight="bold" color="red.800">
                تواصل مع الدعم الفني
              </Text>
            </VStack>
          </ModalHeader>
          
          <ModalBody py={8}>
            <VStack spacing={4} textAlign="center">
              <Text fontSize="lg" color="gray.600">
                لم نتمكن من تغيير كلمة المرور تلقائياً
              </Text>
              <Text fontSize="md" color="gray.500">
                يرجى التواصل مع الدعم الفني لمساعدتك في استعادة حسابك
              </Text>
              
              <Box
                bg="green.50"
                borderRadius="lg"
                p={4}
                border="1px solid"
                borderColor="green.200"
                w="full"
              >
                <Text fontSize="sm" color="green.700" fontWeight="medium" mb={3}>
                  📞 تواصل مع الدعم الفني:
                </Text>
                <VStack spacing={3}>
                  <Button
                    as="a"
                    href="https://wa.me/201111272393"
                    target="_blank"
                    rel="noopener noreferrer"
                    bg="green.500"
                    color="white"
                    _hover={{
                      bg: "green.600",
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 12px rgba(34, 197, 94, 0.4)"
                    }}
                    _active={{
                      bg: "green.700"
                    }}
                    leftIcon={<Icon as={FiPhone} />}
                    size="md"
                    w="full"
                    borderRadius="lg"
                    transition="all 0.3s ease"
                  >
                    واتساب: 01111272393
                  </Button>
                  <Button
                    as="a"
                    href="https://wa.me/201288781012"
                    target="_blank"
                    rel="noopener noreferrer"
                    bg="green.500"
                    color="white"
                    _hover={{
                      bg: "green.600",
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 12px rgba(34, 197, 94, 0.4)"
                    }}
                    _active={{
                      bg: "green.700"
                    }}
                    leftIcon={<Icon as={FiPhone} />}
                    size="md"
                    w="full"
                    borderRadius="lg"
                    transition="all 0.3s ease"
                  >
                    واتساب: 01288781012
                  </Button>
                  <Button
                    as="a"
                    href="https://wa.me/201210726096"
                    target="_blank"
                    rel="noopener noreferrer"
                    bg="green.500"
                    color="white"
                    _hover={{
                      bg: "green.600",
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 12px rgba(34, 197, 94, 0.4)"
                    }}
                    _active={{
                      bg: "green.700"
                    }}
                    leftIcon={<Icon as={FiPhone} />}
                    size="md"
                    w="full"
                    borderRadius="lg"
                    transition="all 0.3s ease"
                  >
                    واتساب: 01210726096
                  </Button>
                </VStack>
              </Box>

              <Box
                bg="blue.50"
                borderRadius="lg"
                p={4}
                border="1px solid"
                borderColor="blue.200"
                w="full"
              >
                <Text fontSize="sm" color="blue.700" fontWeight="medium" mb={2}>
                  💡 معلومات مهمة:
                </Text>
                <Text fontSize="sm" color="blue.600" textAlign="right">
                  عند التواصل مع الدعم الفني، يرجى إخبارهم برقم هاتفك المسجل في المنصة
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          
          <ModalFooter justifyContent="center" py={6}>
            <Button
              variant="outline"
              onClick={onSupportClose}
              borderRadius="xl"
              borderColor="gray.300"
              _hover={{ borderColor: "gray.400", bg: "gray.50" }}
              px={8}
            >
              إغلاق
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
        <ModalContent mx={4} borderRadius="2xl" overflow="hidden">
          <ModalHeader textAlign="center" bg="green.50" py={6}>
            <VStack spacing={3}>
              <Box
                w="60px"
                h="60px"
                bgGradient="linear(135deg, #10b981 0%, #059669 100%)"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={FiCheckCircle} w="30px" h="30px" color="white" />
              </Box>
              <Text fontSize="xl" fontWeight="bold" color="green.800">
                تم تسجيل الدخول بنجاح!
              </Text>
            </VStack>
          </ModalHeader>
          
          <ModalBody py={8}>
            <VStack spacing={4} textAlign="center">
              <Text fontSize="lg" color="gray.600">
                مرحباً بك في منصتنا التعليمية
              </Text>
              <Text fontSize="md" color="gray.500">
                سيتم تحويلك إلى الصفحة الرئيسية خلال ثوانٍ قليلة...
              </Text>
              
              <Box
                bg="blue.50"
                borderRadius="lg"
                p={4}
                border="1px solid"
                borderColor="blue.200"
                w="full"
              >
                <Text fontSize="sm" color="blue.700" fontWeight="medium" mb={2}>
                  🎉 أهلاً وسهلاً بك!
                </Text>
                <Text fontSize="sm" color="blue.600">
                  يمكنك الآن الاستمتاع بجميع المميزات التعليمية المتاحة
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          
          <ModalFooter justifyContent="center" py={6}>
            <Button
              bg="orange.500"
              color="white"
              _hover={{ bg: "orange.400", boxShadow: "0 10px 25px rgba(237, 137, 54, 0.35)" }}
              borderRadius="xl"
              onClick={() => setShowSuccessModal(false)}
              boxShadow="0 8px 20px rgba(237, 137, 54, 0.3)"
              px={8}
            >
              متابعة
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default LoginPage;
