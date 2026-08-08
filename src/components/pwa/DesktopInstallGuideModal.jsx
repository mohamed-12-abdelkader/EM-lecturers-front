/**
 * دليل سطح المكتب مختصر — خطوتان فقط عند غياب نافذة التثبيت الأصلية.
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
import { FaEllipsisV, FaDownload } from "react-icons/fa";

const STEPS = [
  {
    icon: FaEllipsisV,
    title: "افتح قائمة المتصفح ⋮",
    desc: "من أعلى يمين Chrome أو Edge.",
  },
  {
    icon: FaDownload,
    title: "اختر «تثبيت التطبيق»",
    desc: "ثم أكّد التثبيت.",
  },
];

export default function DesktopInstallGuideModal({ isOpen, onClose, appName = "المنصة" }) {
  const cardBg = useColorModeValue("orange.50", "whiteAlpha.100");
  const border = useColorModeValue("orange.100", "whiteAlpha.200");

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm" motionPreset="slideInBottom">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(3px)" />
      <ModalContent dir="rtl" mx={4} borderRadius="2xl" overflow="hidden">
        <Box h="3px" bgGradient="linear(to-l, blue.500, orange.500)" />
        <ModalHeader pb={1} fontSize="md" fontWeight="800">
          تنزيل منصة {appName}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={2}>
          <VStack align="stretch" spacing={2.5}>
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <HStack
                  key={step.title}
                  align="center"
                  spacing={3}
                  p={3}
                  bg={cardBg}
                  border="1px solid"
                  borderColor={border}
                  borderRadius="xl"
                >
                  <Box
                    flexShrink={0}
                    w="32px"
                    h="32px"
                    borderRadius="lg"
                    bg={index === 0 ? "blue.500" : "orange.500"}
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
                    <HStack spacing={2}>
                      <Icon className="text-blue-500 text-sm" />
                      <Text fontWeight="700" fontSize="sm">
                        {step.title}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.500" mt={0.5}>
                      {step.desc}
                    </Text>
                  </Box>
                </HStack>
              );
            })}
          </VStack>
        </ModalBody>
        <ModalFooter pt={2}>
          <Button colorScheme="blue" borderRadius="xl" w="full" onClick={onClose} fontWeight="700">
            تم
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
