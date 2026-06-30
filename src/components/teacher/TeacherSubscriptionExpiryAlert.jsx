import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Button,
  HStack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { FaSync, FaCreditCard } from "react-icons/fa";

const ALERT_META = {
  subscription_expiring: {
    status: "warning",
    title: "باقتك على وشك الانتهاء",
    accent: "orange",
  },
  subscription_grace_period: {
    status: "warning",
    title: "الوضع الاستثنائي — تجديد عاجل",
    accent: "orange",
  },
  platform_suspended: {
    status: "error",
    title: "تم إيقاف تنشيط المنصة",
    accent: "red",
  },
};

function buildFallbackMessage(alert) {
  const type = alert?.type;

  if (type === "subscription_expiring") {
    const days = alert.days_remaining;
    return days != null
      ? `باقتك على وشك الانتهاء خلال ${days} ${days === 1 ? "يوم" : "أيام"}. يرجى التجديد للاستمرار.`
      : "باقتك على وشك الانتهاء. يرجى التجديد للاستمرار في استخدام المنصة.";
  }

  if (type === "subscription_grace_period") {
    const grace = alert.grace_days_remaining;
    return grace != null
      ? `باقتك انتهت بالفعل وأنت الآن في الوضع الاستثنائي. في حالة عدم التجديد خلال ${grace} ${grace === 1 ? "يوم" : "أيام"} سيتم إيقاف منصتك بشكل نهائي.`
      : "باقتك انتهت وأنت في الوضع الاستثنائي. يرجى التجديد في أقرب وقت.";
  }

  if (type === "platform_suspended") {
    return "تم إيقاف تنشيط منصتك بشكل نهائي. يرجى تجديد الاشتراك لإعادة التفعيل.";
  }

  return null;
}

function MetaLine({ alert }) {
  const muted = useColorModeValue("gray.600", "gray.400");

  if (alert.type === "subscription_expiring" && alert.days_remaining != null) {
    return (
      <Text fontSize="xs" color={muted} mt={1.5}>
        متبقي: {alert.days_remaining} {alert.days_remaining === 1 ? "يوم" : "أيام"}
        {alert.ends_at ? ` — ينتهي في ${alert.ends_at}` : ""}
      </Text>
    );
  }

  if (alert.type === "subscription_grace_period" && alert.grace_days_remaining != null) {
    return (
      <Text fontSize="xs" color={muted} mt={1.5}>
        أيام السماح المتبقية: {alert.grace_days_remaining}
        {alert.grace_period_days != null ? ` من ${alert.grace_period_days}` : ""}
        {alert.ends_at ? ` — انتهت الباقة في ${alert.ends_at}` : ""}
      </Text>
    );
  }

  if (alert.ends_at) {
    return (
      <Text fontSize="xs" color={muted} mt={1.5}>
        تاريخ انتهاء الباقة: {alert.ends_at}
      </Text>
    );
  }

  return null;
}

export default function TeacherSubscriptionExpiryAlert({
  alert,
  onRefresh,
  refreshing = false,
}) {
  const renewBg = useColorModeValue("white", "gray.700");

  if (!alert) return null;

  const meta = ALERT_META[alert.type] || ALERT_META.subscription_expiring;
  const message = alert.message || buildFallbackMessage(alert);
  const isSuspended =
    alert.type === "platform_suspended" || alert.platform_active === false;

  return (
    <Alert
      status={meta.status}
      variant="left-accent"
      borderRadius="xl"
      flexDirection={{ base: "column", md: "row" }}
      alignItems={{ base: "stretch", md: "center" }}
      gap={{ base: 3, md: 4 }}
      py={4}
      px={4}
      borderWidth="1px"
      borderColor={isSuspended ? "red.200" : "orange.200"}
      _dark={{
        borderColor: isSuspended ? "red.700" : "orange.700",
      }}
    >
      <AlertIcon boxSize={5} alignSelf={{ base: "flex-start", md: "center" }} />
      <Box flex="1" minW={0}>
        <AlertTitle fontSize="sm" fontWeight="bold" mb={1}>
          {meta.title}
        </AlertTitle>
        <AlertDescription fontSize="sm" lineHeight="1.75">
          {message}
        </AlertDescription>
        <MetaLine alert={alert} />
        {isSuspended ? (
          <Text fontSize="xs" fontWeight="semibold" color="red.600" mt={2} _dark={{ color: "red.300" }}>
            المنصة غير نشطة حالياً — لن يتمكن الطلاب من الوصول حتى التجديد.
          </Text>
        ) : null}
      </Box>
      <HStack spacing={2} flexShrink={0} alignSelf={{ base: "stretch", md: "center" }}>
        {onRefresh ? (
          <Button
            size="sm"
            variant="outline"
            leftIcon={<FaSync />}
            isLoading={refreshing}
            onClick={onRefresh}
            bg={renewBg}
          >
            تحديث
          </Button>
        ) : null}
        <Button
          as={RouterLink}
          to="/teacher-invoices"
          size="sm"
          colorScheme={isSuspended ? "red" : "orange"}
          leftIcon={<FaCreditCard />}
          whiteSpace="nowrap"
        >
          تجديد الاشتراك
        </Button>
      </HStack>
    </Alert>
  );
}
