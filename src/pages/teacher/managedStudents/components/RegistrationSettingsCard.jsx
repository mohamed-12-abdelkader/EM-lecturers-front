import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Switch,
  Button,
  useColorModeValue,
  useToast,
  Icon,
  VStack,
  HStack,
  Code,
  Skeleton,
  Tooltip,
  Collapse,
} from "@chakra-ui/react";
import {
  FiUserPlus,
  FiShield,
  FiKey,
  FiCopy,
  FiChevronDown,
} from "react-icons/fi";
import {
  fetchRegistrationSettings,
  updateRegistrationSettings,
  apiErrorMessage,
} from "../../../../api/teacherManagedStudentsApi";
import { getPlatformSubdomain } from "../managedStudentsUtils";

const ACCENT = "#0056b3";
const WARM = "#c2410c";

const RegistrationSettingsCard = ({ onSettingsChange, compact = false }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("self_registration");
  const [defaultPasswordFromPhone, setDefaultPasswordFromPhone] = useState(true);
  const [savedSnapshot, setSavedSnapshot] = useState({
    mode: "self_registration",
    defaultPasswordFromPhone: true,
  });
  const [detailsOpen, setDetailsOpen] = useState(!compact);

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const textColor = useColorModeValue("gray.900", "white");
  const subColor = useColorModeValue("gray.500", "gray.400");
  const trackBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const panelBg = useColorModeValue("#f8fafc", "whiteAlpha.50");

  const isTeacherMode = mode === "teacher_registration";
  const subdomain = getPlatformSubdomain();
  const isDirty = useMemo(
    () =>
      mode !== savedSnapshot.mode ||
      defaultPasswordFromPhone !== savedSnapshot.defaultPasswordFromPhone,
    [mode, defaultPasswordFromPhone, savedSnapshot],
  );

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
        setSavedSnapshot({ mode: nextMode, defaultPasswordFromPhone: nextPwd });
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
      setSavedSnapshot({ mode, defaultPasswordFromPhone });
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

  const copySubdomain = async () => {
    if (!subdomain) return;
    try {
      await navigator.clipboard.writeText(subdomain);
      toast({ title: "تم نسخ اسم المنصة", status: "success", duration: 2000 });
    } catch {
      toast({ title: "تعذر النسخ", status: "error", duration: 2000 });
    }
  };

  if (loading) {
    return (
      <Box bg={cardBg} borderRadius="2xl" borderWidth="1px" borderColor={border} p={5}>
        <Skeleton h="56px" borderRadius="xl" mb={3} />
        <Skeleton h="40px" borderRadius="xl" />
      </Box>
    );
  }

  return (
    <Box
      bg={cardBg}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={border}
      overflow="hidden"
    >
      <Flex
        px={{ base: 4, md: 5 }}
        py={4}
        align="center"
        justify="space-between"
        gap={3}
        borderBottomWidth={detailsOpen ? "1px" : "0"}
        borderColor={border}
      >
        <Box minW={0}>
          <Text fontSize="sm" fontWeight="800" color={textColor}>
            طريقة تسجيل الطلاب
          </Text>
          <Text fontSize="xs" color={subColor} mt={0.5} noOfLines={1}>
            {isTeacherMode
              ? "الحسابات من عندك — الدخول برقم الطالب فقط"
              : "الطالب ينشئ حسابه ويدخل بكلمة مرور"}
          </Text>
        </Box>
        <Button
          size="sm"
          variant="ghost"
          rightIcon={
            <Icon
              as={FiChevronDown}
              transform={detailsOpen ? "rotate(180deg)" : undefined}
              transition="0.2s"
            />
          }
          onClick={() => setDetailsOpen((v) => !v)}
        >
          {detailsOpen ? "إخفاء" : "تعديل"}
        </Button>
      </Flex>

      <Box px={{ base: 4, md: 5 }} py={4}>
        <Box p="4px" bg={trackBg} borderRadius="xl">
          <SimpleToggle
            value={mode}
            onChange={setMode}
            options={[
              { value: "self_registration", label: "تسجيل ذاتي", icon: FiUserPlus },
              { value: "teacher_registration", label: "إدارة المدرس", icon: FiShield },
            ]}
            accent={isTeacherMode ? WARM : ACCENT}
          />
        </Box>

        <Collapse in={detailsOpen} animateOpacity>
          <VStack align="stretch" spacing={3} mt={4}>
            <Box bg={panelBg} borderRadius="xl" p={4} borderWidth="1px" borderColor={border}>
              {isTeacherMode ? (
                <VStack align="stretch" spacing={3}>
                  <Text fontSize="sm" color={textColor} lineHeight="tall">
                    يُخفى زر إنشاء الحساب. أنشئ الطلاب من هذه الصفحة وشارك رقم الدخول مع ولي الأمر.
                  </Text>
                  {subdomain ? (
                    <Flex align="center" justify="space-between" gap={2} flexWrap="wrap">
                      <HStack spacing={2}>
                        <Text fontSize="xs" color={subColor}>
                          المنصة
                        </Text>
                        <Code dir="ltr" borderRadius="md" px={2}>
                          {subdomain}
                        </Code>
                      </HStack>
                      <Tooltip label="نسخ">
                        <Button size="xs" variant="outline" leftIcon={<FiCopy />} onClick={copySubdomain}>
                          نسخ
                        </Button>
                      </Tooltip>
                    </Flex>
                  ) : null}
                </VStack>
              ) : (
                <Flex justify="space-between" align="center" gap={3}>
                  <HStack spacing={3} align="start">
                    <Icon as={FiKey} color={ACCENT} mt={0.5} />
                    <Box>
                      <Text fontSize="sm" fontWeight="700" color={textColor}>
                        كلمة المرور = رقم الهاتف
                      </Text>
                      <Text fontSize="xs" color={subColor}>
                        عند الإنشاء أو إعادة التعيين
                      </Text>
                    </Box>
                  </HStack>
                  <Switch
                    colorScheme="blue"
                    isChecked={defaultPasswordFromPhone}
                    onChange={(e) => setDefaultPasswordFromPhone(e.target.checked)}
                  />
                </Flex>
              )}
            </Box>

            <Flex justify="space-between" align="center" gap={3}>
              <Text fontSize="xs" color={isDirty ? WARM : subColor}>
                {isDirty ? "تغييرات غير محفوظة" : "محفوظ"}
              </Text>
              <Button
                size="sm"
                bg={isTeacherMode ? WARM : ACCENT}
                color="white"
                _hover={{ opacity: 0.92 }}
                onClick={handleSave}
                isLoading={saving}
                isDisabled={!isDirty}
                borderRadius="lg"
                px={5}
              >
                حفظ
              </Button>
            </Flex>
          </VStack>
        </Collapse>
      </Box>
    </Box>
  );
};

function SimpleToggle({ value, onChange, options, accent }) {
  const textColor = useColorModeValue("gray.700", "gray.200");
  const muted = useColorModeValue("gray.500", "gray.400");

  return (
    <Flex gap="4px">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Button
            key={opt.value}
            flex={1}
            h="44px"
            borderRadius="lg"
            bg={active ? "white" : "transparent"}
            color={active ? accent : muted}
            boxShadow={active ? "sm" : "none"}
            fontWeight={active ? "800" : "600"}
            fontSize="sm"
            leftIcon={<Icon as={opt.icon} />}
            onClick={() => onChange(opt.value)}
            _hover={{ bg: active ? "white" : "blackAlpha.50" }}
            _dark={{
              bg: active ? "gray.700" : "transparent",
              color: active ? "white" : muted,
              _hover: { bg: active ? "gray.700" : "whiteAlpha.100" },
            }}
          >
            <Text as="span" color={active ? undefined : textColor} display={{ base: "none", sm: "inline" }}>
              {opt.label}
            </Text>
            <Text as="span" display={{ base: "inline", sm: "none" }}>
              {opt.label.split(" ")[0]}
            </Text>
          </Button>
        );
      })}
    </Flex>
  );
}

export default RegistrationSettingsCard;
