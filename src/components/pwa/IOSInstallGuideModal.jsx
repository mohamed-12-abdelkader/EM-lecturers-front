/**
 * IOSInstallGuideModal — elegant steps for Safari Add to Home Screen.
 * beforeinstallprompt is not available on iOS; we guide the user instead.
 */

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Button,
  Text,
  VStack,
  HStack,
  Box,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaShareAlt, FaPlusSquare, FaCheckCircle } from "react-icons/fa";

const STEPS = [
  {
    icon: FaShareAlt,
    title: "اضغط على زر المشاركة",
    desc: "من شريط Safari بالأسفل، اضغط أيقونة Share (المربع مع السهم).",
  },
  {
    icon: FaPlusSquare,
    title: "اختر Add to Home Screen",
    desc: "مرّر قائمة المشاركة واختر «إضافة إلى الشاشة الرئيسية».",
  },
  {
    icon: FaCheckCircle,
    title: "اضغط Add",
    desc: "أكّد الاسم ثم اضغط Add — وسيظهر التطبيق على شاشتك.",
  },
];

export default function IOSInstallGuideModal({ isOpen, onClose, appName = "التطبيق" }) {
  const cardBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const border = useColorModeValue("blue.100", "whiteAlpha.200");

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md" motionPreset="slideInBottom">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent dir="rtl" mx={4} borderRadius="2xl" overflow="hidden">
        <Box h="4px" bgGradient="linear(to-l, blue.500, orange.500)" />
        <ModalHeader pb={1} fontSize="lg" fontWeight="800">
          تثبيت «{appName}» على الآيفون
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={2}>
          <Text fontSize="sm" color="gray.500" mb={4} lineHeight="1.8">
            على Safari لا تظهر نافذة التثبيت تلقائياً. اتبع الخطوات التالية لإضافة
            «{appName}» إلى الشاشة الرئيسية باسم ولوجو المنصة:
          </Text>
          <VStack align="stretch" spacing={3}>
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <HStack
                  key={step.title}
                  align="flex-start"
                  spacing={3}
                  p={3}
                  bg={cardBg}
                  border="1px solid"
                  borderColor={border}
                  borderRadius="xl"
                >
                  <Box
                    flexShrink={0}
                    w="36px"
                    h="36px"
                    borderRadius="lg"
                    bg={index === 2 ? "orange.500" : "blue.500"}
                    color="white"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontWeight="800"
                    fontSize="sm"
                  >
                    {index + 1}
                  </Box>
                  <Box flex="1" minW={0}>
                    <HStack spacing={2} mb={1}>
                      <Icon className="text-blue-500" />
                      <Text fontWeight="700" fontSize="sm">
                        {step.title}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.500" lineHeight="1.7">
                      {step.desc}
                    </Text>
                  </Box>
                </HStack>
              );
            })}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="blue"
            borderRadius="xl"
            w="full"
            onClick={onClose}
            fontWeight="700"
          >
            فهمت
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
