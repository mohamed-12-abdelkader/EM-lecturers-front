import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Portal,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaBell, FaTimes } from "react-icons/fa";
import { useNotifications } from "../../context/NotificationProvider";

export default function PushPermissionPrompt() {
  const {
    showPushPrompt,
    pushLoading,
    pushSupported,
    enablePushNotifications,
    dismissPushPrompt,
  } = useNotifications();

  const bg = useColorModeValue("blue.50", "blue.900");
  const border = useColorModeValue("blue.200", "blue.700");
  const text = useColorModeValue("blue.900", "blue.100");

  const visible = showPushPrompt && pushSupported;

  return (
    <Portal>
      <Box
        position="fixed"
        top={{ base: "76px", md: "80px" }}
        left="50%"
        transform="translateX(-50%)"
        zIndex={999}
        w={{ base: "calc(100% - 24px)", md: "auto" }}
        maxW="640px"
        px={4}
        py={3}
        bg={bg}
        borderWidth="1px"
        borderColor={border}
        borderRadius="xl"
        shadow="lg"
        dir="rtl"
        display={visible ? "block" : "none"}
        pointerEvents={visible ? "auto" : "none"}
        aria-hidden={!visible}
      >
        <Flex align="center" gap={3} flexWrap="wrap">
          <HStack spacing={3} flex={1} minW="200px">
            <Box p={2} bg="blue.500" color="white" borderRadius="lg">
              <Icon as={FaBell} />
            </Box>
            <Box>
              <Text fontWeight="bold" fontSize="sm" color={text}>
                فعّل الإشعارات
              </Text>
              <Text fontSize="xs" color={text} opacity={0.85}>
                استلم تنبيهات المحاضرات والكورسات حتى عند إغلاق الموقع
              </Text>
            </Box>
          </HStack>

          <HStack spacing={2}>
            <Button
              size="sm"
              colorScheme="blue"
              borderRadius="lg"
              isLoading={pushLoading}
              loadingText="جاري التفعيل..."
              onClick={enablePushNotifications}
            >
              تفعيل
            </Button>
            <Button
              size="sm"
              variant="ghost"
              borderRadius="lg"
              onClick={dismissPushPrompt}
              aria-label="إغلاق"
            >
              <Icon as={FaTimes} />
            </Button>
          </HStack>
        </Flex>
      </Box>
    </Portal>
  );
}
