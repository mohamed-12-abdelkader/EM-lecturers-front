/**
 * دليل آيفون مختصر — خطوتان فقط.
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
import { FaShareAlt, FaPlusSquare } from "react-icons/fa";

const STEPS = [
  {
    icon: FaShareAlt,
    title: "اضغط مشاركة",
    desc: "من شريط Safari بالأسفل.",
  },
  {
    icon: FaPlusSquare,
    title: "أضف للشاشة الرئيسية",
    desc: "ثم اضغط إضافة.",
  },
];

export default function IOSInstallGuideModal({ isOpen, onClose, appName = "المنصة" }) {
  const cardBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const border = useColorModeValue("blue.100", "whiteAlpha.200");

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
