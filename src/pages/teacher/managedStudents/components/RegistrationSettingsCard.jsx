import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Switch,
  Select,
  Button,
  useColorModeValue,
  useToast,
  Icon,
  VStack,
  Badge,
} from "@chakra-ui/react";
import { FiSettings } from "react-icons/fi";
import {
  fetchRegistrationSettings,
  updateRegistrationSettings,
  apiErrorMessage,
} from "../../../../api/teacherManagedStudentsApi";
import { getPlatformSubdomain } from "../managedStudentsUtils";

const RegistrationSettingsCard = ({ onSettingsChange }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("self_registration");
  const [defaultPasswordFromPhone, setDefaultPasswordFromPhone] = useState(true);

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const subColor = useColorModeValue("gray.500", "gray.400");
  const infoBg = useColorModeValue("gray.50", "gray.900");

  const isTeacherMode = mode === "teacher_registration";
  const subdomain = getPlatformSubdomain();

  const notifyParent = (nextMode, nextPwdFromPhone) => {
    onSettingsChange?.({
      registration_mode: nextMode,
      default_password_from_phone: nextPwdFromPhone,
    });
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchRegistrationSettings();
        const nextMode = data.registration_mode || "self_registration";
        const nextPwd = data.default_password_from_phone !== false;
        setMode(nextMode);
        setDefaultPasswordFromPhone(nextPwd);
        notifyParent(nextMode, nextPwd);
      } catch (err) {
        toast({
          title: "تعذر تحميل الإعدادات",
          description: apiErrorMessage(err),
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateRegistrationSettings({
        registration_mode: mode,
        default_password_from_phone: defaultPasswordFromPhone,
      });
      notifyParent(mode, defaultPasswordFromPhone);
      toast({ title: "تم حفظ الإعدادات", status: "success", duration: 3000, isClosable: true });
    } catch (err) {
      toast({
        title: "فشل الحفظ",
        description: apiErrorMessage(err),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={border} overflow="hidden">
      <Flex px={5} py={4} borderBottomWidth="1px" borderColor={border} align="center" justify="space-between" gap={3}>
        <HStackTitle textColor={textColor} subColor={subColor} />
        <Badge colorScheme={isTeacherMode ? "blue" : "gray"} variant="subtle">
          {isTeacherMode ? "إدارة المدرس" : "تسجيل ذاتي"}
        </Badge>
      </Flex>

      <Box p={5}>
        <VStack align="stretch" spacing={4}>
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={2}>
              وضع التسجيل
            </Text>
            <Select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              isDisabled={loading}
              borderRadius="lg"
            >
              <option value="self_registration">تسجيل ذاتي — الطالب ينشئ حسابه</option>
              <option value="teacher_registration">إدارة المدرس — أنت تنشئ الحسابات</option>
            </Select>
          </Box>

          <Box p={4} bg={infoBg} borderRadius="lg" borderWidth="1px" borderColor={border}>
            {isTeacherMode ? (
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" color={textColor} fontWeight="medium">
                  الدخول برقم الطالب فقط — بدون كلمة مرور
                </Text>
                <Text fontSize="xs" color={subColor} lineHeight="tall">
                  يُخفى زر «إنشاء حساب» من صفحة التسجيل. الطالب يدخل برقم مكوّن من أرقام فقط
                  {subdomain ? ` على منصة ${subdomain}` : " مع اسم المنصة (subdomain) من صفحة الدخول"}.
                </Text>
              </VStack>
            ) : (
              <Text fontSize="xs" color={subColor} lineHeight="tall">
                الطلاب يسجّلون أنفسهم بالهاتف أو البريد وكلمة المرور كالمعتاد.
              </Text>
            )}
          </Box>

          {!isTeacherMode && (
            <Flex justify="space-between" align="center" gap={3}>
              <Box flex="1">
                <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                  كلمة المرور الافتراضية = رقم الهاتف
                </Text>
                <Text fontSize="xs" color={subColor} mt={0.5}>
                  عند إنشاء حساب أو إعادة تعيين كلمة المرور
                </Text>
              </Box>
              <Switch
                colorScheme="blue"
                isChecked={defaultPasswordFromPhone}
                onChange={(e) => setDefaultPasswordFromPhone(e.target.checked)}
                isDisabled={loading}
              />
            </Flex>
          )}

          <Flex justify="flex-end">
            <Button colorScheme="blue" size="sm" onClick={handleSave} isLoading={saving} isDisabled={loading}>
              حفظ الإعدادات
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
};

function HStackTitle({ textColor, subColor }) {
  return (
    <Flex align="center" gap={3}>
      <Icon as={FiSettings} color="#0056b3" />
      <Box>
        <Heading size="sm" color={textColor}>
          إعدادات التسجيل
        </Heading>
        <Text fontSize="xs" color={subColor} mt={0.5}>
          طريقة إنشاء الحسابات وتسجيل الدخول
        </Text>
      </Box>
    </Flex>
  );
}

export default RegistrationSettingsCard;
