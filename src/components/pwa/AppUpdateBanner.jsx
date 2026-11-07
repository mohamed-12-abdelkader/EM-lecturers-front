import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  HStack,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import {
  PWA_UPDATE_DISMISSED_EVENT,
  PWA_UPDATE_EVENT,
  applyPWAUpdate,
  dismissUpdatePrompt,
  shouldShowUpdatePrompt,
} from "../../pwa/registerPWA";
import applicationActivityManager from "../../utils/applicationActivityManager";

/**
 * إشعار غير مزعج عند توفر نسخة جديدة — لا يظهر أثناء نشاط حرج.
 */
export default function AppUpdateBanner() {
  const toast = useToast();
  const [visible, setVisible] = useState(false);
  const [applying, setApplying] = useState(false);
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("blue.100", "blue.700");
  const textColor = useColorModeValue("gray.700", "gray.100");

  const refreshVisibility = useCallback(() => {
    setVisible(shouldShowUpdatePrompt());
  }, []);

  useEffect(() => {
    refreshVisibility();
    const onUpdate = () => refreshVisibility();
    const onDismiss = () => setVisible(false);
    const onActivity = () => refreshVisibility();

    window.addEventListener(PWA_UPDATE_EVENT, onUpdate);
    window.addEventListener(PWA_UPDATE_DISMISSED_EVENT, onDismiss);
    window.addEventListener("em:critical-activity-changed", onActivity);
    const unsubscribe = applicationActivityManager.subscribe(onActivity);

    return () => {
      window.removeEventListener(PWA_UPDATE_EVENT, onUpdate);
      window.removeEventListener(PWA_UPDATE_DISMISSED_EVENT, onDismiss);
      window.removeEventListener("em:critical-activity-changed", onActivity);
      unsubscribe();
    };
  }, [refreshVisibility]);

  const handleLater = () => {
    setVisible(false);
    dismissUpdatePrompt();
  };

  const handleUpdateNow = async () => {
    if (applicationActivityManager.isCriticalActivityActive()) {
      toast({
        title: "لا يمكن التحديث الآن",
        description: "أكمل الامتحان أو المحاضرة أولًا، ثم طبّق التحديث.",
        status: "info",
        duration: 4000,
        isClosable: true,
      });
      setVisible(false);
      return;
    }

    setApplying(true);
    const result = await applyPWAUpdate();
    if (!result?.ok) {
      setApplying(false);
      if (result?.reason === "critical_activity") {
        toast({
          title: "تم تأجيل التحديث",
          description: "يوجد نشاط مهم قيد التنفيذ.",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        setVisible(false);
      }
    }
  };

  if (!visible) return null;

  return (
    <Box
      position="fixed"
      zIndex={1400}
      bottom={{ base: "88px", md: "24px" }}
      left="50%"
      transform="translateX(-50%)"
      w={{ base: "calc(100% - 24px)", md: "auto" }}
      maxW="560px"
      bg={bg}
      borderWidth="1px"
      borderColor={border}
      borderRadius="2xl"
      boxShadow="lg"
      px={4}
      py={3}
      dir="rtl"
      role="status"
      aria-live="polite"
    >
      <Text fontSize="sm" color={textColor} mb={3} lineHeight="1.7">
        يتوفر تحديث جديد للمنصة. يمكنك تطبيقه الآن أو الاستمرار باستخدام النسخة الحالية.
      </Text>
      <HStack spacing={2} justify="flex-end">
        <Button size="sm" variant="ghost" onClick={handleLater} isDisabled={applying}>
          لاحقًا
        </Button>
        <Button size="sm" colorScheme="blue" onClick={handleUpdateNow} isLoading={applying}>
          تحديث الآن
        </Button>
      </HStack>
    </Box>
  );
}
