import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  Box,
  useColorModeValue,
  useToast,
  Icon,
  Code,
  Divider,
} from "@chakra-ui/react";
import { FaWhatsapp, FaCopy } from "react-icons/fa";
import {
  buildCodeOnlyLoginMessage,
  buildPasswordLoginMessage,
  formatPhoneForWhatsApp,
  formatStudentCode,
  getPlatformSubdomain,
} from "../managedStudentsUtils";

const CredentialsModal = ({
  isOpen,
  onClose,
  studentName,
  credentials,
  parentPhone,
  codeOnlyLogin = true,
}) => {
  const toast = useToast();
  const noteBg = useColorModeValue("blue.50", "blue.900");
  const rowBg = useColorModeValue("gray.50", "gray.900");
  const border = useColorModeValue("gray.200", "gray.700");
  const subdomain = getPlatformSubdomain();

  if (!credentials) return null;

  const studentCode = formatStudentCode(credentials.student_code);
  const showCodeOnly = codeOnlyLogin || credentials.login_with_code_only || !credentials.temporary_password;

  const copyText = showCodeOnly
    ? [studentCode, subdomain].filter(Boolean).join("\n")
    : `رقم الطالب: ${studentCode}\nكلمة المرور: ${credentials.temporary_password}`;

  const whatsappMessage = showCodeOnly
    ? buildCodeOnlyLoginMessage(studentName, studentCode, subdomain)
    : buildPasswordLoginMessage(studentName, credentials, subdomain);

  const copyValue = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `تم نسخ ${label}`, status: "success", duration: 2000 });
    } catch {
      toast({ title: "تعذر النسخ", status: "error", duration: 2000 });
    }
  };

  const sendWhatsApp = () => {
    const phone = formatPhoneForWhatsApp(parentPhone);
    if (!phone) {
      toast({
        title: "رقم ولي الأمر غير متوفر",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="xl" dir="rtl">
        <ModalHeader fontSize="md" fontWeight="bold">
          بيانات دخول الطالب
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box p={3} bg={noteBg} borderRadius="lg" borderWidth="1px" borderColor={border}>
              <Text fontSize="sm" lineHeight="tall">
                {showCodeOnly
                  ? "شارك رقم الطالب مع ولي الأمر. في وضع إدارة المدرس، الدخول يتم برقم الطالب فقط دون كلمة مرور."
                  : "احفظ كلمة المرور الآن — لن تُعرض مرة أخرى بعد إغلاق هذه النافذة."}
              </Text>
            </Box>

            <Box p={4} bg={rowBg} borderRadius="lg" borderWidth="1px" borderColor={border}>
              <Text fontSize="xs" color="gray.500" mb={1}>
                رقم الطالب
              </Text>
              <HStackCode
                value={studentCode}
                onCopy={() => copyValue(studentCode, "رقم الطالب")}
              />
            </Box>

            {showCodeOnly && subdomain && (
              <Box p={4} bg={rowBg} borderRadius="lg" borderWidth="1px" borderColor={border}>
                <Text fontSize="xs" color="gray.500" mb={1}>
                  منصة المدرس (subdomain)
                </Text>
                <HStackCode value={subdomain} onCopy={() => copyValue(subdomain, "اسم المنصة")} />
              </Box>
            )}

            {!showCodeOnly && credentials.temporary_password && (
              <Box p={4} bg={rowBg} borderRadius="lg" borderWidth="1px" borderColor={border}>
                <Text fontSize="xs" color="gray.500" mb={1}>
                  كلمة المرور المؤقتة
                </Text>
                <HStackCode
                  value={credentials.temporary_password}
                  onCopy={() => copyValue(credentials.temporary_password, "كلمة المرور")}
                />
              </Box>
            )}

            {showCodeOnly && (
              <>
                <Divider />
                <Text fontSize="xs" color="gray.500" lineHeight="tall">
                  من نطاق المنصة مباشرة يكفي رقم الطالب. من localhost أو النطاق الافتراضي
                  يُدخل الطالب رقم الطالب مع subdomain المنصة في صفحة الدخول.
                </Text>
              </>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter gap={2} flexWrap="wrap">
          <Button variant="ghost" onClick={onClose}>
            إغلاق
          </Button>
          <Button leftIcon={<Icon as={FaCopy} />} variant="outline" onClick={() => copyValue(copyText, "البيانات")}>
            نسخ الكل
          </Button>
          <Button
            leftIcon={<Icon as={FaWhatsapp} />}
            colorScheme="green"
            onClick={sendWhatsApp}
            isDisabled={!parentPhone}
          >
            واتساب لولي الأمر
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

function HStackCode({ value, onCopy }) {
  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
      <Code fontSize="lg" px={3} py={2} borderRadius="md" dir="ltr">
        {value}
      </Code>
      <Button size="xs" variant="ghost" onClick={onCopy}>
        نسخ
      </Button>
    </Box>
  );
}

export default CredentialsModal;
