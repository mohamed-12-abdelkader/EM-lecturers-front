import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  useColorModeValue,
  useToast,
  Icon,
  VStack,
  Badge,
  Radio,
  RadioGroup,
  Stack,
} from "@chakra-ui/react";
import { FiSmartphone } from "react-icons/fi";
import {
  fetchTeacherDeviceRestrictionSettings,
  updateTeacherDeviceRestrictionSettings,
} from "../../../../api/deviceRestrictionApi";
import { apiErrorMessage } from "../../../../api/teacherManagedStudentsApi";

const DeviceRestrictionSettingsCard = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("multiple_devices");
  const [options, setOptions] = useState([]);

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const subColor = useColorModeValue("gray.500", "gray.400");
  const infoBg = useColorModeValue("gray.50", "gray.900");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { settings, options: apiOptions } = await fetchTeacherDeviceRestrictionSettings();
        setMode(settings?.student_device_limit || "multiple_devices");
        setOptions(apiOptions);
      } catch (err) {
        toast({
          title: "تعذر تحميل إعدادات الأجهزة",
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
      const result = await updateTeacherDeviceRestrictionSettings(mode);
      toast({
        title: result.message || "تم حفظ إعدادات الأجهزة",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
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

  const fallbackOptions = [
    {
      value: "multiple_devices",
      label_ar: "السماح للطالب باستخدام الحساب من أكثر من جهاز",
      description_ar: "لا يتم ربط الحساب بعنوان IP. تسجيل الدخول مسموح من أي جهاز.",
    },
    {
      value: "single_device",
      label_ar: "السماح للطالب باستخدام الحساب من جهاز واحد فقط",
      description_ar:
        "يُربط الحساب بمعرّف المتصفح (محفوظ في الجهاز). يُرفض الدخول من متصفح آخر حتى تعيد تعيين الجهاز.",
    },
  ];

  const displayOptions = options.length ? options : fallbackOptions;
  const isSingle = mode === "single_device";

  return (
    <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={border} overflow="hidden">
      <Flex px={5} py={4} borderBottomWidth="1px" borderColor={border} align="center" justify="space-between" gap={3}>
        <Flex align="center" gap={3}>
          <Icon as={FiSmartphone} color="#0056b3" />
          <Box>
            <Heading size="sm" color={textColor}>
              تقييد أجهزة الطلاب
            </Heading>
            <Text fontSize="xs" color={subColor} mt={0.5}>
              التحكم في عدد الأجهزة المسموح للطالب بالدخول منها
            </Text>
          </Box>
        </Flex>
        <Badge colorScheme={isSingle ? "orange" : "green"} variant="subtle">
          {isSingle ? "جهاز واحد" : "أجهزة متعددة"}
        </Badge>
      </Flex>

      <Box p={5}>
        <VStack align="stretch" spacing={4}>
          <RadioGroup value={mode} onChange={setMode} isDisabled={loading}>
            <Stack spacing={3}>
              {displayOptions.map((option) => (
                <Box
                  key={option.value}
                  p={4}
                  bg={infoBg}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={mode === option.value ? "blue.300" : border}
                >
                  <Radio value={option.value} colorScheme="blue">
                    <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                      {option.label_ar}
                    </Text>
                  </Radio>
                  {option.description_ar ? (
                    <Text fontSize="xs" color={subColor} mt={2} mr={6} lineHeight="tall">
                      {option.description_ar}
                    </Text>
                  ) : null}
                </Box>
              ))}
            </Stack>
          </RadioGroup>

          <Text fontSize="xs" color={subColor} lineHeight="tall">
            تغيير الإعداد لا يمسح عناوين IP الحالية للطلاب — يؤثر فقط على التحقق من الآن فصاعداً.
            يمكنك إعادة تعيين جهاز طالب معيّن من قائمة الطلاب.
          </Text>

          <Flex justify="flex-end">
            <Button colorScheme="blue" size="sm" onClick={handleSave} isLoading={saving} isDisabled={loading}>
              حفظ إعدادات الأجهزة
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
};

export default DeviceRestrictionSettingsCard;
