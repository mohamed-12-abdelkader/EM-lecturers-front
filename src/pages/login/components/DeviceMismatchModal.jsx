import {
  Box,
  Button,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FiSmartphone } from "react-icons/fi";

export default function DeviceMismatchModal({ isOpen, onClose, message }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
      <ModalContent mx={4} borderRadius="2xl" overflow="hidden" dir="rtl">
        <ModalHeader textAlign="center" bg="orange.50" py={6} px={4}>
          <VStack spacing={3}>
            <Box
              w="64px"
              h="64px"
              bgGradient="linear(135deg, #f97316 0%, #ea580c 100%)"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="0 8px 24px rgba(234, 88, 12, 0.35)"
            >
              <Icon as={FiSmartphone} w="32px" h="32px" color="white" />
            </Box>
            <Text fontSize="xl" fontWeight="bold" color="orange.900">
              الحساب مسجّل على جهاز آخر
            </Text>
          </VStack>
        </ModalHeader>

        <ModalBody py={6} px={5}>
          <VStack spacing={4} textAlign="center">
            <Text fontSize="md" color="gray.700" lineHeight="tall" fontWeight="medium">
              {message ||
                "هذا الحساب مسبقاً مربوط بمتصفح أو جهاز آخر. لا يمكن تسجيل الدخول من هنا إلا بعد موافقة المدرس."}
            </Text>

            <Box
              w="full"
              p={4}
              borderRadius="xl"
              bg="blue.50"
              border="1px solid"
              borderColor="blue.200"
              textAlign="right"
            >
              <Text fontSize="sm" fontWeight="bold" color="blue.800" mb={2}>
                ماذا تفعل؟
              </Text>
              <VStack align="stretch" spacing={2}>
                <Text fontSize="sm" color="blue.700" lineHeight="tall">
                  1. تواصل مع مدرسك واطلب «إعادة تعيين الجهاز» لحسابك.
                </Text>
                <Text fontSize="sm" color="blue.700" lineHeight="tall">
                  2. بعد موافقة المدرس، سجّل الدخول مرة أخرى من هذا المتصفح.
                </Text>
              </VStack>
            </Box>

            <Text fontSize="xs" color="gray.500" lineHeight="tall">
              هذه المنصة تسمح بتسجيل الدخول من متصفح واحد فقط لكل حساب طالب.
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter justifyContent="center" pb={6} pt={0} px={5}>
          <Button
            w="full"
            colorScheme="orange"
            borderRadius="xl"
            size="lg"
            onClick={onClose}
            boxShadow="0 8px 20px rgba(237, 137, 54, 0.3)"
          >
            حسناً، فهمت
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
