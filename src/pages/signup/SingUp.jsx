import {
  Select,
  Input,
  Button,
  Spinner,
  Box,
  FormControl,
  FormLabel,
  Text,
  VStack,
  HStack,
  Progress,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  useColorModeValue,
  useColorMode,
} from "@chakra-ui/react";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import { useState, useEffect } from "react";

/** الاسم ثلاثي عربي: ثلاث كلمات بحروف عربية فقط */
function validateArabicTripleName(value) {
  const normalized = String(value || "").trim().replace(/\s+/g, " ");
  const parts = normalized.split(" ").filter(Boolean);
  if (parts.length !== 3) {
    return {
      valid: false,
      message: "الاسم يجب أن يكون ثلاثياً (الاسم الأول + اسم الأب + اسم العائلة)",
    };
  }
  const arabicWord = /^[\u0621-\u064A]+$/;
  if (!parts.every((part) => arabicWord.test(part))) {
    return { valid: false, message: "الاسم يجب أن يكون بالحروف العربية فقط" };
  }
  return { valid: true, normalized };
}

function isValidArabicTripleName(value) {
  return validateArabicTripleName(value).valid;
}
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import {
  FiUser,
  FiPhone,
  FiLock,
  FiBookOpen,
  FiCheck,
  FiLogIn,
} from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { FaMoon, FaSun, FaBars, FaTimes } from "react-icons/fa";

import "react-toastify/dist/ReactToastify.css";
import baseUrl from "../../api/baseUrl";
import {
  fetchPublicCourseGroups,
  fetchPublicRegistrationSettings,
} from "../../api/courseGroupsApi";
import { saveAuthSession } from "../../utils/authStorage";
import { markStudentHomeTourPending } from "../../utils/studentHomeTour";
import {
  appendDeviceIp,
  getAuthDeviceErrorMessage,
  handleAuthIpRegistered,
  isSingleDeviceLimit,
  SINGLE_DEVICE_NOTICE,
} from "../../utils/deviceRestriction";
import {
  ensureTenantAuthContext,
  resolveTenantSubdomain,
  withTenantQuery,
} from "../../utils/tenantHost";
import { TenantPublicNavbarShell } from "../tenantPublic/components/TenantPublicNavbar";

const SignUp = () => {
  const navigate = useNavigate();
  const [tenantSubdomain, setTenantSubdomain] = useState(() => resolveTenantSubdomain());
  const hasTenantNavbar = Boolean(tenantSubdomain);
  const { colorMode, toggleColorMode } = useColorMode();
  const location = useLocation();
  const redirectTo = new URLSearchParams(location.search).get("redirect");
  const loginPath = withTenantQuery(
    redirectTo
      ? `/login?redirect=${encodeURIComponent(redirectTo)}`
      : "/login",
    tenantSubdomain,
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentStep, setCurrentStep] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const resolved = ensureTenantAuthContext();
    if (resolved) setTenantSubdomain(resolved);
  }, []);

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("gray.800", "white");
  const subtextColor = useColorModeValue("gray.600", "gray.400");
  const labelColor = useColorModeValue("gray.700", "gray.300");
  const inputBorder = useColorModeValue("gray.200", "gray.600");
  const inputBg = useColorModeValue("white", "gray.700");
  const stepInactiveBg = useColorModeValue("gray.200", "gray.600");
  const stepInactiveColor = useColorModeValue("gray.500", "gray.400");
  const stepIconBg = useColorModeValue("blue.50", "blue.900");
  const inputHoverBorder = useColorModeValue("gray.300", "gray.500");
  const pageOverlayOpacity = useColorModeValue(0.4, 0.08);
  const nameHintBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const nameHintBorder = useColorModeValue("blue.100", "blue.800");
  const nameHintText = useColorModeValue("blue.700", "blue.200");
  const cardShadow = useColorModeValue(
    "0 0 0 1px rgba(0,0,0,0.04), 0 12px 24px -8px rgba(0,0,0,0.12), 0 24px 48px -16px rgba(0,0,0,0.08)",
    "0 0 0 1px rgba(255,255,255,0.08), 0 0 40px rgba(255,255,255,0.2), 0 0 80px rgba(255,255,255,0.1), 0 24px 48px -16px rgba(0,0,0,0.45), 0 12px 24px -8px rgba(0,0,0,0.35)"
  );

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

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [courseGroupId, setCourseGroupId] = useState("");
  const [requiresGroupSelection, setRequiresGroupSelection] = useState(false);
  const [selfRegistrationEnabled, setSelfRegistrationEnabled] = useState(true);
  const [registrationBlockedMessage, setRegistrationBlockedMessage] = useState("");
  const [registrationSettingsLoaded, setRegistrationSettingsLoaded] = useState(false);
  const [singleDeviceMode, setSingleDeviceMode] = useState(false);
  const [registrationGroups, setRegistrationGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [grades, setGrades] = useState([]); // الصفوف من API

  // تنسيق موحد للحقول (وايت/دارك)
  const inputStyles = {
    size: "lg",
    borderRadius: "xl",
    px: 6,
    py: 4,
    borderColor: inputBorder,
    bg: inputBg,
    focusBorderColor: "blue.500",
    _placeholder: { color: subtextColor },
    _hover: { borderColor: inputHoverBorder },
    _focus: { borderColor: "blue.500", boxShadow: "0 0 0 2px rgba(66, 153, 225, 0.25)" },
  };

  // Steps configuration
  const steps = [
    {
      title: "المعلومات الشخصية",
      icon: FiUser,
      description: "الاسم ثلاثي بالعربية",
    },
    {
      title: "معلومات الاتصال",
      icon: FiPhone,
      description: "أدخل أرقام الهواتف",
    },
    {
      title: "كلمة المرور",
      icon: FiLock,
      description: "أنشئ كلمة مرور قوية",
    },
    {
      title: "الصف الدراسي",
      icon: FiBookOpen,
      description: "اختر صفك الدراسي",
    },
  ];

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const subdomain = resolveTenantSubdomain();
        if (!subdomain) {
          const fallbackRes = await baseUrl.get("/api/users/grades");
          setGrades(Array.isArray(fallbackRes?.data?.grades) ? fallbackRes.data.grades : []);
          return;
        }
        try {
          const res = await baseUrl.get(
            `/api/tenants/public/${encodeURIComponent(subdomain)}/grades`,
          );
          const list = res?.data?.data?.grades;
          setGrades(Array.isArray(list) ? list : []);
        } catch (publicErr) {
          // fallback when public grades endpoint is not available for tenant yet
          const fallbackRes = await baseUrl.get("/api/users/grades");
          setGrades(Array.isArray(fallbackRes?.data?.grades) ? fallbackRes.data.grades : []);
        }
      } catch (err) {
        setGrades([]);
      }
    };
    fetchGrades();
  }, []);

  useEffect(() => {
    const subdomain = resolveTenantSubdomain();
    if (!subdomain) {
      setRegistrationSettingsLoaded(true);
      return;
    }
    fetchPublicRegistrationSettings(subdomain)
      .then((settings) => {
        setRequiresGroupSelection(
          Boolean(settings.course_group_access_enabled) &&
            Boolean(settings.requires_course_group_selection),
        );
        setSingleDeviceMode(isSingleDeviceLimit(settings));
        setSelfRegistrationEnabled(settings.self_registration_enabled !== false);
        setRegistrationBlockedMessage(
          settings.message ||
            "يتم إنشاء الحسابات بواسطة المدرس. سجّل الدخول برقم الطالب.",
        );
      })
      .catch(() => {
        setRequiresGroupSelection(false);
        setSingleDeviceMode(false);
        setSelfRegistrationEnabled(true);
        setRegistrationBlockedMessage("");
      })
      .finally(() => setRegistrationSettingsLoaded(true));
  }, []);

  useEffect(() => {
    setCourseGroupId("");
    if (!requiresGroupSelection || !gradeId) {
      setRegistrationGroups([]);
      return;
    }
    const subdomain = resolveTenantSubdomain();
    if (!subdomain) return;
    setGroupsLoading(true);
    fetchPublicCourseGroups(subdomain, gradeId)
      .then((res) => setRegistrationGroups(res.groups || []))
      .catch(() => setRegistrationGroups([]))
      .finally(() => setGroupsLoading(false));
  }, [gradeId, requiresGroupSelection]);

  // تصفية الصفوف حسب هل هو جامعي أم لا - تم إزالتها لأننا نستخدم الفئات الجديدة
  // let filteredGrades = grades;
  // if (grades.length > 0) {
  //   if (isUniversityStudent === "yes") {
  //     filteredGrades = grades.slice(-4); // آخر 4 صفوف فقط
  //   } else {
  //     filteredGrades = grades.slice(0, grades.length - 4); // الكل ما عدا آخر 4
  //   }
  // }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return isValidArabicTripleName(name);
      case 1:
        // Allow any phone number format for navigation, validation will be done on final submit
        return phone.trim().length > 0 && parentPhone.trim().length > 0;
      case 2:
        return password.length >= 6 && password === passwordConfirm;
      case 3:
        if (requiresGroupSelection) {
          return gradeId !== "" && courseGroupId !== "";
        }
        return gradeId !== "";
      default:
        return false;
    }
  };

  const handleLSignUp = async () => {
    // Final validation
    if (
      !name ||
      !phone ||
      !parentPhone ||
      !password ||
      !passwordConfirm ||
      !gradeId ||
      (requiresGroupSelection && !courseGroupId)
    ) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    const nameCheck = validateArabicTripleName(name);
    if (!nameCheck.valid) {
      toast.error(nameCheck.message);
      return;
    }

    if (password !== passwordConfirm) {
      toast.error("كلمتا السر غير متطابقتين");
      return;
    }

    // Basic phone number validation
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const cleanParentPhone = parentPhone.replace(/[^0-9]/g, "");

    if (cleanPhone.length < 8) {
      toast.error("رقم هاتفك قصير جداً، يرجى إدخال رقم صحيح");
      return;
    }

    if (cleanParentPhone.length < 8) {
      toast.error("رقم هاتف الوالد قصير جداً، يرجى إدخال رقم صحيح");
      return;
    }

    if (cleanPhone === cleanParentPhone) {
      toast.error("رقم هاتفك ورقم هاتف الوالد يجب أن يكونا مختلفين");
      return;
    }

    // إرسال الأرقام كما أدخلها المستخدم دون إضافة +20
    setLoading(true);
    try {
      const subdomain = resolveTenantSubdomain();
      if (!subdomain) {
        toast.error(
          "افتح رابط منصة المدرس أولاً (مثل اسم-المدرس.em-online.online) ثم أنشئ الحساب من هناك.",
        );
        setLoading(false);
        return;
      }
      const registerPayload = appendDeviceIp({
        subdomain,
        phone: cleanPhone,
        password: password,
        name: nameCheck.normalized,
        parent_phone: cleanParentPhone,
        grade_id: parseInt(gradeId, 10),
        remember_me: true,
      });
      if (requiresGroupSelection && courseGroupId) {
        registerPayload.course_group_id = parseInt(courseGroupId, 10);
      }
      const res = await baseUrl.post("/api/users/register", registerPayload);

      saveAuthSession(res.data);
      handleAuthIpRegistered(res.data);
      markStudentHomeTourPending();

      toast.success(
        res.data?.ip_registered
          ? "تم إنشاء الحساب وربطه بهذا المتصفح بنجاح!"
          : "تم إنشاء الحساب بنجاح!",
      );
      void playAuthSuccessSound();
      setShowSuccessModal(true);
      // تنقّل SPA مرة واحدة — بدون full reload
      setTimeout(() => {
        navigate("/home", { replace: true });
      }, 1900);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.code === "SELF_REGISTRATION_DISABLED") {
        toast.error(
          err.response?.data?.message ||
            "يتم إنشاء الحسابات بواسطة المدرس. تواصل مع مدرسك للحصول على رقم الطالب.",
        );
        navigate(loginPath, { replace: true });
      } else if (err.response?.data?.message === "Phone number already registered") {
        onOpen(); // فتح المودال
      } else {
        toast.error(
          getAuthDeviceErrorMessage(err, err.response?.data?.message || "حدث خطأ أثناء إنشاء الحساب"),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <VStack spacing={6} align="stretch">
            <Box textAlign="center" mb={2}>
              <Box
                w="16"
                h="16"
                mx="auto"
                mb={4}
                borderRadius="2xl"
                bg="blue.500"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 8px 24px rgba(66, 153, 225, 0.35)"
              >
                <Icon as={FiUser} w="8" h="8" color="white" />
              </Box>
              <Text fontSize="xl" fontWeight="bold" color={headingColor} mb={1}>
                أدخل اسمك الكامل
              </Text>
              <Text fontSize="sm" color={subtextColor}>
                أدخل اسمك ثلاثياً بالحروف العربية فقط
              </Text>
            </Box>

            <FormControl isRequired>
              <FormLabel fontWeight="semibold" color={labelColor} mb={2} fontSize="md">
                الاسم بالكامل
              </FormLabel>
              <Box
                mb={3}
                p={3}
                borderRadius="lg"
                bg={nameHintBg}
                borderWidth="1px"
                borderColor={nameHintBorder}
              >
                <Text fontSize="sm" color={nameHintText} lineHeight="1.8">
                  يجب أن يكون الاسم <strong>ثلاثياً</strong> وبالحروف <strong>العربية</strong> فقط:
                  الاسم الأول + اسم الأب + اسم العائلة
                </Text>
                <Text fontSize="xs" color={subtextColor} mt={1}>
                  مثال: أحمد محمد علي
                </Text>
              </Box>
              <Input
                placeholder="أحمد محمد علي"
                value={name}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\u0621-\u064A\s]/g, "");
                  setName(v.replace(/\s+/g, " "));
                }}
                {...inputStyles}
              />
              {name.trim() && !isValidArabicTripleName(name) && (
                <Text fontSize="xs" color="red.500" mt={2}>
                  {validateArabicTripleName(name).message}
                </Text>
              )}
            </FormControl>
          </VStack>
        );

      case 1:
        return (
          <VStack spacing={6} align="stretch">
            <Box textAlign="center" mb={2}>
              <Box
                w="16"
                h="16"
                mx="auto"
                mb={4}
                borderRadius="2xl"
                bg="green.500"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 8px 24px rgba(34, 197, 94, 0.35)"
              >
                <Icon as={FiPhone} w="8" h="8" color="white" />
              </Box>
              <Text fontSize="xl" fontWeight="bold" color={headingColor} mb={1}>
                معلومات الاتصال
              </Text>
              <Text fontSize="sm" color={subtextColor}>
                أدخل رقم هاتفك ورقم هاتف ولي الأمر
              </Text>
            </Box>

            <FormControl>
              <FormLabel fontWeight="semibold" color={labelColor} mb={2} fontSize="md">
                رقم الهاتف
              </FormLabel>
              <Input
                type="tel"
                placeholder="01227145090"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                {...inputStyles}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontWeight="semibold" color={labelColor} mb={2} fontSize="md">
                رقم هاتف الوالد
              </FormLabel>
              <Input
                type="tel"
                placeholder="01227145091"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                {...inputStyles}
              />
            </FormControl>
          </VStack>
        );

      case 2:
        return (
          <VStack spacing={6} align="stretch">
            <Box textAlign="center" mb={2}>
              <Box
                w="16"
                h="16"
                mx="auto"
                mb={4}
                borderRadius="2xl"
                bg="orange.500"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 8px 24px rgba(237, 137, 54, 0.35)"
              >
                <Icon as={FiLock} w="8" h="8" color="white" />
              </Box>
              <Text fontSize="xl" fontWeight="bold" color={headingColor} mb={1}>
                كلمة المرور
              </Text>
              <Text fontSize="sm" color={subtextColor}>أنشئ كلمة مرور قوية لحماية حسابك</Text>
            </Box>

            <FormControl>
              <FormLabel fontWeight="semibold" color={labelColor} mb={2} fontSize="md">
                كلمة المرور
              </FormLabel>
              <Input
                type="password"
                placeholder="أدخل كلمة مرور قوية (6 أحرف على الأقل)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                {...inputStyles}
              />
              {password.length > 0 && (
                <Text fontSize="sm" color={password.length >= 6 ? "green.500" : "orange.500"} mt={2}>
                  {password.length >= 6 ? "✓ كلمة المرور قوية" : "كلمة المرور يجب أن تكون 6 أحرف على الأقل"}
                </Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel fontWeight="semibold" color={labelColor} mb={2} fontSize="md">
                تأكيد كلمة المرور
              </FormLabel>
              <Input
                type="password"
                placeholder="أعد إدخال كلمة المرور"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                {...inputStyles}
              />
              {passwordConfirm.length > 0 && (
                <Text fontSize="sm" color={password === passwordConfirm ? "green.500" : "red.500"} mt={2}>
                  {password === passwordConfirm ? "✓ كلمات المرور متطابقة" : "كلمات المرور غير متطابقة"}
                </Text>
              )}
            </FormControl>
          </VStack>
        );

      case 3:
        return (
          <VStack spacing={6} align="stretch">
            <Box textAlign="center" mb={2}>
              <Box
                w="16"
                h="16"
                mx="auto"
                mb={4}
                borderRadius="2xl"
                bg="blue.600"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 8px 24px rgba(37, 99, 235, 0.35)"
              >
                <Icon as={FiBookOpen} w="8" h="8" color="white" />
              </Box>
              <Text fontSize="xl" fontWeight="bold" color={headingColor} mb={1}>
                اختر صفك الدراسي
              </Text>
              <Text fontSize="sm" color={subtextColor}>حدد الصف الدراسي المحدد</Text>
            </Box>

            <FormControl>
              <FormLabel fontWeight="semibold" color={labelColor} mb={2} fontSize="md">
                الصف الدراسي
              </FormLabel>
              <Select
                dir="ltr"
                placeholder="اختر الصف الدراسي"
                value={gradeId}
                onChange={(e) => setGradeId(e.target.value)}
                {...inputStyles}
              >
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            {requiresGroupSelection ? (
              <FormControl isRequired mt={4}>
                <FormLabel fontWeight="semibold" color={labelColor} mb={2} fontSize="md">
                  مجموعة الكورس
                </FormLabel>
                {groupsLoading ? (
                  <Spinner size="sm" color="blue.500" />
                ) : (
                  <Select
                    dir="ltr"
                    placeholder={
                      gradeId
                        ? registrationGroups.length
                          ? "اختر مجموعتك"
                          : "لا توجد مجموعات لهذا الصف"
                        : "اختر الصف أولاً"
                    }
                    value={courseGroupId}
                    onChange={(e) => setCourseGroupId(e.target.value)}
                    isDisabled={!gradeId || registrationGroups.length === 0}
                    {...inputStyles}
                  >
                    {registrationGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </Select>
                )}
                <Text fontSize="xs" color={subtextColor} mt={2}>
                  المدرس يحدد المجموعة التي تتابع من خلالها المحاضرات
                </Text>
              </FormControl>
            ) : null}
          </VStack>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      minH="100vh"
      bg={pageBg}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={{ base: 4, md: 6 }}
      dir="rtl"
      style={{ fontFamily: "'Changa', sans-serif" }}
      position="relative"
      overflow="hidden"
    >
      {hasTenantNavbar ? (
        <TenantPublicNavbarShell
          variant="auth"
          loginHref={loginPath}
          showSignup={selfRegistrationEnabled}
        />
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
              to={loginPath}
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
                to={loginPath}
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

      {/* خلفية خفيفة */}
      <Box
        position="absolute"
        inset="0"
        opacity={pageOverlayOpacity}
        bgGradient="linear(to-br, blue.400, transparent)"
        pointerEvents="none"
      />
      <Box
        w="full"
        maxW="2xl"
        mt="84px"
        bg={cardBg}
        borderRadius="2xl"
        boxShadow={cardShadow}
        borderWidth="1px"
        borderColor={cardBorder}
        overflow="hidden"
        position="relative"
        zIndex="1"
      >
        <Box w="full" p={{ base: 6, sm: 8, lg: 10 }}>
          {registrationSettingsLoaded && !selfRegistrationEnabled ? (
            <VStack spacing={5} align="stretch" textAlign="center" py={6}>
              <Text fontSize="xl" fontWeight="bold" color={headingColor}>
                التسجيل الذاتي غير متاح
              </Text>
              <Text fontSize="sm" color={subtextColor} lineHeight="tall">
                {registrationBlockedMessage}
              </Text>
              <Button
                colorScheme="blue"
                size="lg"
                borderRadius="xl"
                onClick={() => navigate(loginPath)}
              >
                الانتقال لتسجيل الدخول برقم الطالب
              </Button>
            </VStack>
          ) : (
            <>
          {/* التابات — مؤشر الخطوات المحسّن */}
          <Box
            mb={8}
            p={4}
            borderRadius="xl"
            bg={stepIconBg}
            borderWidth="1px"
            borderColor={cardBorder}
          >
            <HStack justify="space-between" mb={4}>
              <Text fontSize="md" fontWeight="bold" color={headingColor}>
                إنشاء حساب جديد
              </Text>
              <Box
                px={3}
                py={1}
                borderRadius="full"
                bg="blue.500"
                color="white"
                fontSize="sm"
                fontWeight="semibold"
              >
                {currentStep + 1} من {steps.length}
              </Box>
            </HStack>
            {singleDeviceMode ? (
              <Box
                mb={4}
                p={3}
                borderRadius="lg"
                bg="orange.50"
                borderWidth="1px"
                borderColor="orange.200"
                _dark={{ bg: "whiteAlpha.100", borderColor: "orange.700" }}
              >
                <Text fontSize="xs" color="orange.800" _dark={{ color: "orange.200" }} lineHeight="tall">
                  {SINGLE_DEVICE_NOTICE}
                </Text>
              </Box>
            ) : null}
            <Progress
              value={(currentStep / (steps.length - 1)) * 100}
              colorScheme="blue"
              borderRadius="full"
              height="2"
              bg={stepInactiveBg}
              transition="all 0.4s ease"
              mb={5}
            />
            <Box display="flex" justifyContent="space-between" position="relative" gap={0}>
              {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isActive = index === currentStep;
                return (
                  <Box
                    key={index}
                    flex="1"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    position="relative"
                    zIndex={1}
                  >
                    <Box
                      w={{ base: "10", sm: "12" }}
                      h={{ base: "10", sm: "12" }}
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bg={isCompleted ? "green.500" : isActive ? "blue.500" : stepInactiveBg}
                      color={isCompleted || isActive ? "white" : stepInactiveColor}
                      borderWidth="2px"
                      borderColor={isActive ? "blue.400" : "transparent"}
                      boxShadow={isActive ? "0 0 0 3px rgba(66, 153, 225, 0.3)" : "none"}
                      transition="all 0.3s"
                      flexShrink={0}
                    >
                      {isCompleted ? (
                        <Icon as={FiCheck} w={{ base: "5", sm: "6" }} h={{ base: "5", sm: "6" }} />
                      ) : (
                        <Icon as={step.icon} w={{ base: "4", sm: "5" }} h={{ base: "4", sm: "5" }} />
                      )}
                    </Box>
                    <Text
                      fontSize={{ base: "xs", sm: "sm" }}
                      color={isActive ? "blue.600" : isCompleted ? headingColor : subtextColor}
                      _dark={{ color: isActive ? "blue.300" : isCompleted ? "white" : "gray.400" }}
                      fontWeight={isActive ? "bold" : "normal"}
                      mt={2}
                      textAlign="center"
                      noOfLines={2}
                      lineHeight="tight"
                    >
                      {step.title}
                    </Text>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Step Content */}
          <Box className="transition-all duration-500 ease-in-out">
            {renderStepContent()}
          </Box>

          {/* Navigation Buttons */}
          <HStack spacing={4} mt={8} w="full">
            {currentStep > 0 && (
              <Button
                onClick={prevStep}
                variant="outline"
                size="lg"
                flex={1}
                borderRadius="xl"
                borderColor={inputBorder}
                color={headingColor}
                _hover={{ borderColor: inputHoverBorder, bg: stepIconBg }}
                transition="all 0.2s"
              >
                السابق
              </Button>
            )}

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={nextStep}
                size="lg"
                flex={1}
                borderRadius="xl"
                isDisabled={!validateCurrentStep()}
                bg="blue.500"
                color="white"
                _hover={{
                  bg: "blue.400",
                  boxShadow: "0 8px 24px rgba(66, 153, 225, 0.4)",
                }}
                _disabled={{
                  bg: "gray.300",
                  color: "gray.500",
                  cursor: "not-allowed",
                  _hover: {},
                }}
                transition="all 0.2s"
              >
                التالي
              </Button>
            ) : (
              <Button
                onClick={handleLSignUp}
                size="lg"
                flex={1}
                borderRadius="xl"
                isDisabled={!validateCurrentStep() || loading}
                bg="orange.500"
                color="white"
                _hover={{
                  bg: "orange.400",
                  boxShadow: "0 8px 24px rgba(237, 137, 54, 0.4)",
                }}
                _disabled={{
                  bg: "gray.300",
                  color: "gray.500",
                  cursor: "not-allowed",
                  _hover: {},
                }}
                leftIcon={loading ? <Spinner size="sm" color="white" /> : undefined}
                transition="all 0.2s"
              >
                إنشاء الحساب
              </Button>
            )}
          </HStack>

          <Box mt={6} textAlign="center" pt={4} borderTopWidth="1px" borderColor={cardBorder}>
            <Text color={subtextColor} fontSize="md">
              هل لديك حساب بالفعل؟{" "}
              <Box
                as="span"
                color="blue.500"
                fontWeight="semibold"
                cursor="pointer"
                _hover={{ textDecoration: "underline" }}
                onClick={() => navigate(loginPath)}
              >
                تسجيل الدخول
              </Box>
            </Text>
          </Box>
            </>
          )}
        </Box>
      </Box>

      <ScrollToTop />
      <ToastContainer position="top-center" />

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        isCentered
      >
        <ModalOverlay bg="blackAlpha.650" backdropFilter="blur(12px)" />
        <ModalContent mx={4} borderRadius="2xl" overflow="hidden">
          <ModalHeader
            textAlign="center"
            py={6}
            bgGradient="linear(to-r, green.500, blue.500)"
          >
            <VStack spacing={3}>
              <Box
                w="64px"
                h="64px"
                borderRadius="full"
                bg="whiteAlpha.300"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 10px 26px rgba(0, 0, 0, 0.2)"
              >
                <Icon as={FiCheck} w="34px" h="34px" color="white" />
              </Box>
              <Text fontSize="xl" fontWeight="bold" color="white">
                تم التسجيل بنجاح
              </Text>
            </VStack>
          </ModalHeader>

          <ModalBody py={8}>
            <VStack spacing={4} textAlign="center">
              <Text fontSize="lg" color={headingColor} fontWeight="semibold">
                أهلاً بك في المنصة التعليمية
              </Text>
              <Text fontSize="md" color={subtextColor}>
                تم إنشاء حسابك بنجاح وسيتم تحويلك للصفحة الرئيسية خلال لحظات.
              </Text>
              <Box
                w="full"
                bg="green.50"
                _dark={{ bg: "green.900", borderColor: "green.700" }}
                borderRadius="xl"
                p={4}
                border="1px solid"
                borderColor="green.200"
              >
                <Text fontSize="sm" color="green.700" _dark={{ color: "green.200" }}>
                  يمكنك الآن البدء واستكشاف الكورسات والمحتوى الخاص بك.
                </Text>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter justifyContent="center" py={6}>
            <Button
              bg="orange.500"
              color="white"
              _hover={{
                bg: "orange.400",
                boxShadow: "0 10px 25px rgba(237, 137, 54, 0.35)",
              }}
              borderRadius="xl"
              px={10}
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/home", { replace: true });
              }}
            >
              متابعة
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal for existing account */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
        <ModalContent mx={4} borderRadius="2xl" overflow="hidden">
          <ModalHeader
            textAlign="center"
            bg="blue.50"
            _dark={{ bg: "blue.900" }}
            py={6}
          >
            <VStack spacing={3}>
              <Box
                w="60px"
                h="60px"
                bg="blue.500"
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={FiLogIn} w="30px" h="30px" color="white" />
              </Box>
              <Text fontSize="xl" fontWeight="bold" color={headingColor}>
                لديك حساب بالفعل!
              </Text>
            </VStack>
          </ModalHeader>

          <ModalBody py={8}>
            <VStack spacing={4} textAlign="center">
              <Text fontSize="lg" color="gray.600">
                رقم الهاتف <strong>{phone}</strong> مسجل مسبقاً في منصتنا
              </Text>
              <Text fontSize="md" color="gray.500">
                يبدو أنك قمت بإنشاء حساب من قبل. قم بتسجيل الدخول باستخدام رقم
                الهاتف وكلمة المرور
              </Text>

              <Box
                bg="blue.50"
                borderRadius="lg"
                p={4}
                border="1px solid"
                borderColor="blue.200"
                w="full"
              >
                <Text fontSize="sm" color="blue.700" fontWeight="medium">
                  💡 تذكر كلمة المرور الخاصة بك؟ اضغط على "تسجيل الدخول"
                  للمتابعة
                </Text>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter justifyContent="center" py={6}>
            <HStack spacing={4} w="full" maxW="300px">
              <Button
                variant="outline"
                onClick={onClose}
                flex={1}
                borderRadius="xl"
                borderColor="gray.300"
                _hover={{ borderColor: "gray.400", bg: "gray.50" }}
              >
                إلغاء
              </Button>
              <Button
                bg="orange.500"
                color="white"
                _hover={{
                  bg: "orange.400",
                  boxShadow: "0 10px 25px rgba(237, 137, 54, 0.35)",
                }}
                flex={1}
                borderRadius="xl"
                leftIcon={<Icon as={FiLogIn} />}
                onClick={() => {
                  onClose();
                  navigate(loginPath);
                }}
                boxShadow="0 8px 20px rgba(237, 137, 54, 0.3)"
              >
                تسجيل الدخول
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SignUp;
