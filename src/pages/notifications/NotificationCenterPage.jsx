import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Select,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
  useToast,
  Badge,
  Card,
  CardBody,
} from "@chakra-ui/react";
import { useInView } from "react-intersection-observer";
import { useNavigate } from "react-router-dom";
import {
  FaBell,
  FaCheckDouble,
  FaTrash,
  FaSync,
} from "react-icons/fa";
import { fetchNotifications } from "../../api/notificationsApi";
import { useNotifications } from "../../context/NotificationProvider";
import NotificationItem from "../../components/notifications/NotificationItem";
import {
  getNotificationPath,
  NOTIFICATION_FILTER_TYPES,
} from "../../utils/notificationHelpers";
import { hasOptedInToPush } from "../../utils/pushNotifications";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";

const PAGE_SIZE = 20;

function countUnread(items = []) {
  return items.filter((item) => !item?.is_read).length;
}

export default function NotificationCenterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const {
    markAsRead,
    markAllAsRead,
    removeNotification,
    pushSupported,
    pushPermission,
    enablePushNotifications,
    pushLoading,
  } = useNotifications();

  const [allItems, setAllItems] = useState([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all");
  const loadingRef = useRef(false);

  const unreadCount = useMemo(() => countUnread(allItems), [allItems]);

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("gray.800", "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const heroGradient = useColorModeValue(
    "linear(to-l, blue.600, blue.500)",
    "linear(to-l, blue.700, blue.600)",
  );
  const emptyIconBg = useColorModeValue("gray.100", "gray.700");

  const { ref: loadMoreRef, inView } = useInView({ threshold: 0, rootMargin: "120px" });

  const loadNotifications = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      setLoading(true);
      setError("");
      const res = await fetchNotifications();
      const batch = res?.notifications || [];
      setAllItems(batch);
      setVisibleCount(PAGE_SIZE);
    } catch (err) {
      setError(err?.response?.data?.message || "تعذّر تحميل الإشعارات");
      setAllItems([]);
    } finally {
      loadingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const filteredItems = useMemo(() => {
    if (filterType === "all") return allItems;
    return allItems.filter((item) => item.type === filterType);
  }, [allItems, filterType]);

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount],
  );

  const hasMore = visibleCount < filteredItems.length;

  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore) {
      setLoadingMore(true);
      setVisibleCount((prev) => prev + PAGE_SIZE);
      setLoadingMore(false);
    }
  }, [inView, hasMore, loading, loadingMore]);

  const handleRefresh = () => {
    loadNotifications();
  };

  const handleMarkAll = async () => {
    await markAllAsRead();
    setAllItems((prev) => prev.map((item) => ({ ...item, is_read: true })));
    toast({ title: "تم تعليم الكل كمقروء", status: "success", duration: 2500 });
  };

  const handleItemClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
      setAllItems((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item,
        ),
      );
    }
    navigate(getNotificationPath(notification));
  };

  const handleDelete = async (event, notificationId) => {
    event.stopPropagation();
    await removeNotification(notificationId);
    setAllItems((prev) => prev.filter((item) => item.id !== notificationId));
    toast({ title: "تم حذف الإشعار", status: "info", duration: 2000 });
  };

  return (
    <Box minH="100vh" bg={pageBg} dir="rtl" pb={16}>
      <ScrollToTop />

      <Box bgGradient={heroGradient} color="white" pt={{ base: 24, md: 28 }} pb={{ base: 8, md: 10 }}>
        <Container maxW="4xl">
          <HStack spacing={3} mb={2}>
            <Box p={3} bg="whiteAlpha.200" borderRadius="xl">
              <Icon as={FaBell} boxSize={6} />
            </Box>
            <Box>
              <Heading size="lg" fontWeight="black">
                مركز الإشعارات
              </Heading>
              <Text fontSize="sm" opacity={0.9} mt={1}>
                {unreadCount > 0
                  ? `${unreadCount} إشعار غير مقروء`
                  : "جميع إشعاراتك في مكان واحد"}
              </Text>
            </Box>
          </HStack>
        </Container>
      </Box>

      <Container maxW="4xl" mt={-6}>
        <Card bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="2xl" shadow="lg" overflow="hidden">
          <CardBody p={{ base: 4, md: 6 }}>
            <Flex
              direction={{ base: "column", md: "row" }}
              gap={3}
              mb={5}
              align={{ base: "stretch", md: "center" }}
              justify="space-between"
            >
              <Select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                maxW={{ base: "full", md: "220px" }}
                borderRadius="lg"
                size="sm"
              >
                {NOTIFICATION_FILTER_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              <HStack spacing={2} flexWrap="wrap" justify={{ base: "stretch", md: "flex-end" }}>
                {pushSupported && pushPermission !== "granted" && !hasOptedInToPush() ? (
                  <Button
                    size="sm"
                    colorScheme="green"
                    borderRadius="lg"
                    isLoading={pushLoading}
                    onClick={enablePushNotifications}
                  >
                    تفعيل إشعارات المتصفح
                  </Button>
                ) : null}
                {unreadCount > 0 ? (
                  <Button
                    size="sm"
                    leftIcon={<FaCheckDouble />}
                    colorScheme="blue"
                    variant="outline"
                    borderRadius="lg"
                    onClick={handleMarkAll}
                  >
                    قراءة الكل
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  leftIcon={<FaSync />}
                  variant="ghost"
                  borderRadius="lg"
                  onClick={handleRefresh}
                  isLoading={loading}
                >
                  تحديث
                </Button>
              </HStack>
            </Flex>

            {loading && allItems.length === 0 ? (
              <VStack py={16} spacing={4}>
                <Spinner size="lg" color="blue.500" thickness="3px" />
                <Text color={muted}>جاري تحميل الإشعارات...</Text>
              </VStack>
            ) : error ? (
              <VStack py={16} spacing={4}>
                <Text color="red.500">{error}</Text>
                <Button colorScheme="blue" onClick={handleRefresh}>
                  إعادة المحاولة
                </Button>
              </VStack>
            ) : filteredItems.length === 0 ? (
              <VStack py={16} spacing={4}>
                <Box p={6} borderRadius="full" bg={emptyIconBg}>
                  <Icon as={FaBell} boxSize={12} color={muted} />
                </Box>
                <Text fontWeight="bold" color={headingColor}>
                  لا توجد إشعارات
                </Text>
                <Text fontSize="sm" color={muted} textAlign="center">
                  {filterType === "all"
                    ? "ستظهر الإشعارات الجديدة هنا عند وصولها"
                    : "لا توجد إشعارات من هذا النوع"}
                </Text>
              </VStack>
            ) : (
              <VStack spacing={3} align="stretch">
                {visibleItems.map((notification) => (
                  <Box key={notification.id} position="relative">
                    <NotificationItem
                      notification={notification}
                      onClick={() => handleItemClick(notification)}
                    />
                    <IconButton
                      aria-label="حذف الإشعار"
                      icon={<FaTrash />}
                      size="xs"
                      colorScheme="red"
                      variant="ghost"
                      position="absolute"
                      top={3}
                      left={3}
                      onClick={(e) => handleDelete(e, notification.id)}
                    />
                  </Box>
                ))}

                {hasMore ? (
                  <Box ref={loadMoreRef} py={6} textAlign="center">
                    {loadingMore ? (
                      <HStack justify="center" spacing={2}>
                        <Spinner size="sm" color="blue.500" />
                        <Text fontSize="sm" color={muted}>
                          تحميل المزيد...
                        </Text>
                      </HStack>
                    ) : (
                      <Badge colorScheme="blue" variant="subtle" px={3} py={1} borderRadius="full">
                        مرّر للأسفل للمزيد
                      </Badge>
                    )}
                  </Box>
                ) : null}
              </VStack>
            )}
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
}
