import {
  Badge,
  Box,
  HStack,
  IconButton,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";
import { MdAutorenew } from "react-icons/md";
import {
  formatDate,
  formatMoney,
  PLAN_CODES,
  SUBSCRIPTION_STATUS,
  teacherLabel,
} from "../financeConstants";

function daysRemainingBadge(days) {
  const n = Number(days);
  if (!Number.isFinite(n)) return { label: "—", colorScheme: "gray" };
  if (n <= 1) return { label: `${n} يوم`, colorScheme: "red" };
  if (n <= 2) return { label: `${n} يوم`, colorScheme: "orange" };
  return { label: `${n} يوم`, colorScheme: "yellow" };
}

export default function ExpiringSubscriptionsTable({
  subscriptions = [],
  onRenew,
  compact = false,
}) {
  const muted = useColorModeValue("gray.500", "gray.400");

  if (!subscriptions.length) {
    return (
      <Text fontSize="sm" color={muted} py={4} textAlign="center">
        لا توجد اشتراكات على وشك الانتهاء
      </Text>
    );
  }

  return (
    <Box overflowX="auto">
      <Table size="sm" variant="simple" minW={compact ? "640px" : "900px"}>
        <Thead>
          <Tr>
            <Th>المدرس</Th>
            <Th>الباقة</Th>
            {!compact ? <Th isNumeric>السعر</Th> : null}
            <Th>ينتهي في</Th>
            <Th>المتبقي</Th>
            {!compact ? <Th>رقم الاشتراك</Th> : null}
            {onRenew ? <Th /> : null}
          </Tr>
        </Thead>
        <Tbody>
          {subscriptions.map((sub) => {
            const planMeta = PLAN_CODES[sub.plan_code] || {};
            const daysBadge = daysRemainingBadge(sub.days_remaining);
            const st = SUBSCRIPTION_STATUS[sub.status] || { label: sub.status, colorScheme: "green" };
            return (
              <Tr key={sub.id}>
                <Td fontWeight="semibold">
                  {sub.teacher_name || teacherLabel(sub.teacher)}
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <Badge colorScheme={planMeta.colorScheme || "blue"}>
                      {sub.plan_name_ar || sub.plan_name || planMeta.label || sub.plan_code}
                    </Badge>
                    {sub.status ? (
                      <Badge colorScheme={st.colorScheme} variant="outline" fontSize="xs">
                        {st.label}
                      </Badge>
                    ) : null}
                  </HStack>
                </Td>
                {!compact ? (
                  <Td isNumeric>{formatMoney(sub.actual_price)}</Td>
                ) : null}
                <Td whiteSpace="nowrap">{formatDate(sub.ends_at)}</Td>
                <Td>
                  <Badge colorScheme={daysBadge.colorScheme} borderRadius="full" px={2}>
                    {daysBadge.label}
                  </Badge>
                </Td>
                {!compact ? (
                  <Td fontFamily="mono" fontSize="xs">
                    {sub.subscription_number || `#${sub.id}`}
                  </Td>
                ) : null}
                {onRenew ? (
                  <Td>
                    <IconButton
                      aria-label="تجديد"
                      icon={<MdAutorenew />}
                      size="sm"
                      colorScheme="orange"
                      variant="ghost"
                      onClick={() => onRenew(sub)}
                    />
                  </Td>
                ) : null}
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
}

export function ExpiringSoonSummary({ total, days, asOf }) {
  const muted = useColorModeValue("gray.500", "gray.400");
  if (total == null && !asOf) return null;
  return (
    <Text fontSize="xs" color={muted}>
      {total != null ? `${total} اشتراك نشط ينتهي خلال ${days ?? 3} أيام` : ""}
      {asOf ? ` — محدّث بتاريخ ${formatDate(asOf)}` : ""}
    </Text>
  );
}
