import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaExclamationTriangle } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import { getTenantSubdomain } from "../../utils/tenantHost";
import {
  SESSION_EXPIRED_EVENT,
  clearExpiredAuthQuietly,
  clearSessionExpiredFlag,
  forceLogoutToLogin,
  isAuthTokenExpired,
  isSessionExpiredFlagSet,
  markSessionExpired,
  readAuthToken,
} from "../../utils/authStorage";

/** صفحات عامة — لا نعرض مودال الجلسة عليها */
function isPublicSurface(pathname = "") {
  const path = String(pathname).toLowerCase();
  const tenant = Boolean(getTenantSubdomain());

  if (
    path === "/login" ||
    path === "/signup" ||
    path === "/teacher-login" ||
    path === "/landing" ||
    path.startsWith("/forgot") ||
    path.startsWith("/reset")
  ) {
    return true;
  }

  // لاندنج المستأجر العام ومساراته العامة
  if (tenant) {
    if (
      path === "/" ||
      path === "/teacher" ||
      path === "/courses" ||
      path.startsWith("/course/") ||
      path.startsWith("/free-lesson") ||
      path === "/search" ||
      path.startsWith("/subjects")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * يظهر عند انتهاء التوكن / الجلسة ويفرض تسجيل الخروج.
 * على الصفحات العامة يُمسح التوكن المنتهي بهدوء بدون مودال.
 */
export default function SessionExpiredModal() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const overlayBg = useColorModeValue("blackAlpha.600", "blackAlpha.800");
  const iconBg = useColorModeValue("orange.50", "whiteAlpha.100");
  const iconColor = useColorModeValue("orange.500", "orange.300");

  const evaluate = useCallback(() => {
    try {
      if (isPublicSurface(location.pathname)) {
        clearExpiredAuthQuietly();
        clearSessionExpiredFlag();
        setIsOpen(false);
        return;
      }

      if (isSessionExpiredFlagSet()) {
        setIsOpen(true);
        return;
      }

      const token = readAuthToken();
      if (token && isAuthTokenExpired(token)) {
        markSessionExpired();
        setIsOpen(true);
      }
    } catch (err) {
      console.error("SessionExpiredModal evaluate failed", err);
      setIsOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    evaluate();

    const onExpired = () => {
      if (isPublicSurface(window.location.pathname)) {
        clearExpiredAuthQuietly();
        clearSessionExpiredFlag();
        setIsOpen(false);
        return;
      }
      setIsOpen(true);
    };
    const onFocus = () => evaluate();
    const onVisibility = () => {
      if (document.visibilityState === "visible") evaluate();
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const intervalId = window.setInterval(evaluate, 30_000);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(intervalId);
    };
  }, [evaluate]);

  if (isPublicSurface(location.pathname) || !isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      closeOnOverlayClick={false}
      closeOnEsc={false}
      isCentered
      size="md"
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg={overlayBg} backdropFilter="blur(4px)" />
      <ModalContent dir="rtl" mx={4} borderRadius="2xl" overflow="hidden">
        <ModalHeader pb={2}>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            textAlign="center"
            gap={3}
            pt={2}
          >
            <Box
              display="flex"
              h={14}
              w={14}
              alignItems="center"
              justifyContent="center"
              borderRadius="full"
              bg={iconBg}
              color={iconColor}
              fontSize="xl"
            >
              <FaExclamationTriangle />
            </Box>
            <Text as="span" fontSize="lg" fontWeight="bold">
              انتهت الجلسة
            </Text>
          </Box>
        </ModalHeader>
        <ModalBody textAlign="center" pb={2}>
          <Text color="gray.600" _dark={{ color: "gray.300" }} lineHeight="1.9">
            انتهت صلاحية تسجيل الدخول الخاص بك. سجّل الخروج ثم سجّل الدخول من جديد
            للمتابعة بأمان.
          </Text>
        </ModalBody>
        <ModalFooter justifyContent="center" pb={6}>
          <Button
            colorScheme="orange"
            size="lg"
            borderRadius="xl"
            px={10}
            onClick={() => forceLogoutToLogin()}
          >
            تسجيل الخروج
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
