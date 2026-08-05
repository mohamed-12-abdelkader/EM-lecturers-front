/**
 * DesktopInstallGuideModal — when beforeinstallprompt is not available yet
 * (common on desktop / first visit), guide the user to the browser install menu.
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
import { FaChrome, FaEllipsisV, FaDownload } from "react-icons/fa";

const STEPS = [
  {
    icon: FaEllipsisV,
    title: "افتح قائمة المتصفح",
    desc: "اضغط على ⋮ أو ⋯ في أعلى المتصفح (Chrome / Edge).",
  },
  {
    icon: FaDownload,
    title: "اختر تثبيت التطبيق",
    desc: "من القائمة اختر «تثبيت التطبيق» أو Install app / Add to Home screen.",
  },
  {
    icon: FaChrome,
    title: "أكّد التثبيت",
    desc: "اضغط تثبيت — وسيظهر التطبيق كتطبيق مستقل على جهازك.",
  },
];

export default function DesktopInstallGuideModal({ isOpen, onClose, appName = "التطبيق" }) {
  const cardBg = useColorModeValue("orange.50", "whiteAlpha.100");
  const border = useColorModeValue("orange.100", "whiteAlpha.200");

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md" motionPreset="slideInBottom">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent dir="rtl" mx={4} borderRadius="2xl" overflow="hidden">
        <Box h="4px" bgGradient="linear(to-l, blue.500, orange.500)" />
        <ModalHeader pb={1} fontSize="lg" fontWeight="800">
          تثبيت «{appName}» على جهازك
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={2}>
          <Text fontSize="sm" color="gray.500" mb={4} lineHeight="1.8">
            نافذة التثبيت المباشرة غير جاهزة حالياً. يمكنك تثبيت «{appName}» من قائمة المتصفح
            وستظهر باسم ولوجو المنصة:
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
