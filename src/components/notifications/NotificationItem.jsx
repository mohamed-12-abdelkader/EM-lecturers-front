import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  getNotificationBody,
  getNotificationColor,
  getNotificationIcon,
  getNotificationTypeLabel,
} from "../../utils/notificationHelpers";

export default function NotificationItem({
  notification,
  compact = false,
  onClick,
}) {
  const headingColor = useColorModeValue("gray.800", "gray.100");
  const subtextColor = useColorModeValue("gray.600", "gray.300");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const color = getNotificationColor(notification);
  const unreadBg = useColorModeValue(`${color}.50`, `${color}.900`);
  const hoverBg = useColorModeValue(`${color}.100`, `${color}.800`);

  return (
    <Box
      p={compact ? 3 : 4}
      cursor="pointer"
      borderRadius="lg"
      mx={compact ? 1 : 2}
      my={1}
      bg={!notification.is_read ? unreadBg : "transparent"}
      borderLeft={!notification.is_read ? "4px solid" : "4px solid transparent"}
      borderLeftColor={!notification.is_read ? `${color}.500` : "transparent"}
      _hover={{
        bg: hoverBg,
        transform: "translateX(4px)",
      }}
      transition="all 0.2s"
      onClick={onClick}
    >
      <HStack spacing={3} align="flex-start">
        <Box
          p={compact ? 2 : 3}
          borderRadius="xl"
          bg={`${color}.500`}
          color="white"
          flexShrink={0}
        >
          <Icon as={getNotificationIcon(notification)} boxSize={compact ? 4 : 5} />
        </Box>

        <VStack align="flex-start" spacing={2} flex={1} minW={0}>
          <Text
            fontWeight="bold"
            fontSize={compact ? "sm" : "md"}
            color={headingColor}
            noOfLines={2}
            lineHeight="1.4"
          >
            {notification.title}
          </Text>

          {getNotificationBody(notification) ? (
            <Text
              fontSize="sm"
              color={subtextColor}
              noOfLines={compact ? 2 : 3}
              lineHeight="1.5"
            >
              {getNotificationBody(notification)}
            </Text>
          ) : null}

          <HStack spacing={2} flexWrap="wrap">
            {notification.course_title ? (
              <Badge colorScheme={color} borderRadius="full" fontSize="xs">
                {notification.course_title}
              </Badge>
            ) : null}
            <Badge colorScheme={color} variant="subtle" borderRadius="full" fontSize="xs">
              {getNotificationTypeLabel(notification.type)}
            </Badge>
            {!notification.is_read ? (
              <Badge colorScheme="red" borderRadius="full" fontSize="xs">
                جديد
              </Badge>
            ) : null}
          </HStack>

          <Text fontSize="xs" color={mutedColor}>
            {notification.created_at
              ? new Date(notification.created_at).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
}
