import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  Icon,
  Badge,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  Divider,
  useColorModeValue,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { FaBell, FaCheckDouble } from "react-icons/fa";
import { MdNotificationsActive } from "react-icons/md";
import { useNotifications } from "../../context/NotificationProvider";
import { getNotificationPath } from "../../utils/notificationHelpers";
import NotificationItem from "./NotificationItem";

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const popoverBg = useColorModeValue("white", "gray.800");
  const headerBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const emptyColor = useColorModeValue("gray.500", "gray.400");
  const emptyIconBg = useColorModeValue("gray.100", "gray.700");

  const handleOpen = () => {
    refreshNotifications(true);
  };

  const handleItemClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    navigate(getNotificationPath(notification));
  };

  return (
    <Popover placement="bottom-end" isLazy onOpen={handleOpen}>
      <PopoverTrigger>
        <Button
          variant="ghost"
          colorScheme="blue"
          position="relative"
          size="sm"
          leftIcon={<Icon as={MdNotificationsActive} boxSize={6} />}
        >
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="-2"
              right="-2"
              colorScheme="red"
              borderRadius="full"
              fontSize="xs"
              minW="20px"
              h="20px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        width="380px"
        maxW="92vw"
        borderRadius="xl"
        shadow="2xl"
        border="none"
        bg={popoverBg}
        overflow="hidden"
      >
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverHeader
          borderBottomWidth="1px"
          borderColor={borderColor}
          bg={headerBg}
          py={4}
          px={5}
        >
          <HStack justify="space-between" pe={6}>
            <HStack spacing={3}>
              <Box p={2} borderRadius="lg" bg="blue.500" color="white">
                <Icon as={FaBell} boxSize={4} />
              </Box>
              <VStack align="flex-start" spacing={0}>
                <Text fontWeight="bold" fontSize="lg">
                  الإشعارات
                </Text>
                <Text fontSize="xs" color={emptyColor}>
                  {unreadCount > 0
                    ? `${unreadCount} غير مقروء`
                    : "لا توجد إشعارات جديدة"}
                </Text>
              </VStack>
            </HStack>
            {unreadCount > 0 ? (
              <Button
                size="xs"
                variant="ghost"
                colorScheme="blue"
                leftIcon={<FaCheckDouble />}
                onClick={markAllAsRead}
              >
                قراءة الكل
              </Button>
            ) : null}
          </HStack>
        </PopoverHeader>

        <PopoverBody maxH="420px" overflowY="auto" p={0}>
          {loading && notifications.length === 0 ? (
            <Center py={10}>
              <VStack spacing={3}>
                <Spinner color="blue.500" />
                <Text fontSize="sm" color={emptyColor}>
                  جاري التحميل...
                </Text>
              </VStack>
            </Center>
          ) : error ? (
            <Center py={10} px={4}>
              <VStack spacing={3}>
                <Text fontSize="sm" color="red.500" textAlign="center">
                  {error}
                </Text>
                <Button size="sm" colorScheme="blue" onClick={() => refreshNotifications(true)}>
                  إعادة المحاولة
                </Button>
              </VStack>
            </Center>
          ) : notifications.length > 0 ? (
            <VStack spacing={0} align="stretch" divider={<Divider />}>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  compact
                  onClick={() => handleItemClick(notification)}
                />
              ))}
            </VStack>
          ) : (
            <Center py={12} px={4}>
              <VStack spacing={3}>
                <Box p={5} borderRadius="full" bg={emptyIconBg}>
                  <Icon as={FaBell} boxSize={10} color={emptyColor} />
                </Box>
                <Text fontWeight="semibold" color={emptyColor}>
                  لا توجد إشعارات
                </Text>
                <Text fontSize="sm" color={emptyColor} textAlign="center">
                  ستظهر التنبيهات الجديدة هنا فور وصولها
                </Text>
              </VStack>
            </Center>
          )}
        </PopoverBody>

        <PopoverFooter
          borderTopWidth="1px"
          borderColor={borderColor}
          bg={headerBg}
          py={3}
          px={4}
        >
          <HStack justify="center" spacing={2}>
            <Button
              as={Link}
              to="/notifications"
              size="sm"
              colorScheme="blue"
              variant="solid"
              borderRadius="lg"
              flex={1}
            >
              مركز الإشعارات
            </Button>
            <Button
              size="sm"
              variant="outline"
              borderRadius="lg"
              onClick={() => refreshNotifications(true)}
              isLoading={loading}
            >
              تحديث
            </Button>
          </HStack>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
}
