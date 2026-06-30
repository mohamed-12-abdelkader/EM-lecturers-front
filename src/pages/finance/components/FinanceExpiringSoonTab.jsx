import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  Spinner,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { fetchExpiringSoonSubscriptions } from "../../../api/financeApi";
import ExpiringSubscriptionsTable, {
  ExpiringSoonSummary,
} from "./ExpiringSubscriptionsTable";

const PAGE_SIZE = 50;

export default function FinanceExpiringSoonTab({ refreshKey, onRenewRequest }) {
  const [days, setDays] = useState(3);
  const [offset, setOffset] = useState(0);
  const [subscriptions, setSubscriptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [asOf, setAsOf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const alertBg = useColorModeValue("orange.50", "whiteAlpha.100");
  const alertBorder = useColorModeValue("orange.200", "orange.700");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchExpiringSoonSubscriptions({
        days,
        limit: PAGE_SIZE,
        offset,
      });
      setSubscriptions(result.subscriptions);
      setTotal(result.total);
      setAsOf(result.as_of ?? null);
    } catch (err) {
      setError(err.message || "فشل التحميل");
      setSubscriptions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [days, offset]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <VStack align="stretch" spacing={4}>
      <Box
        p={4}
        borderRadius="2xl"
        bg={alertBg}
        borderWidth="1px"
        borderColor={alertBorder}
      >
        <Heading size="md" color="orange.600" _dark={{ color: "orange.300" }}>
          اشتراكات على وشك الانتهاء
        </Heading>
        <Text fontSize="sm" color={muted} mt={1} lineHeight="1.8">
          الاشتراكات النشطة التي تنتهي خلال الفترة المحددة، مرتبة بأقرب تاريخ انتهاء.
          القائمة تتحدث تلقائياً يومياً حسب تاريخ السيرفر.
        </Text>
      </Box>

      <HStack flexWrap="wrap" gap={3}>
        <FormControl w={{ base: "full", sm: "160px" }}>
          <FormLabel fontSize="sm">خلال (أيام)</FormLabel>
          <Select
            value={days}
            borderRadius="xl"
            onChange={(e) => {
              setDays(Number(e.target.value));
              setOffset(0);
            }}
          >
            {[1, 2, 3, 5, 7, 14, 30].map((d) => (
              <option key={d} value={d}>
                {d} أيام
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl w={{ base: "full", sm: "160px" }}>
          <FormLabel fontSize="sm">أيام مخصصة</FormLabel>
          <Input
            type="number"
            min={1}
            max={90}
            value={days}
            borderRadius="xl"
            onChange={(e) => {
              const v = Number(e.target.value);
              if (v >= 1) {
                setDays(v);
                setOffset(0);
              }
            }}
          />
        </FormControl>
      </HStack>

      <ExpiringSoonSummary total={total} days={days} asOf={asOf} />

      <Card bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="2xl" overflow="hidden">
        <CardBody p={0}>
          {loading ? (
            <Flex justify="center" py={14}>
              <Spinner color="orange.500" />
            </Flex>
          ) : error ? (
            <Text p={6} color="red.500" fontWeight="semibold">
              {error}
            </Text>
          ) : (
            <Box p={{ base: 2, md: 4 }}>
              <ExpiringSubscriptionsTable
                subscriptions={subscriptions}
                onRenew={onRenewRequest}
              />
            </Box>
          )}
        </CardBody>
      </Card>

      {totalPages > 1 ? (
        <HStack justify="space-between">
          <Text fontSize="sm" color={muted}>
            صفحة {page} من {totalPages}
          </Text>
          <HStack>
            <Button
              size="sm"
              variant="outline"
              borderRadius="xl"
              isDisabled={offset === 0}
              onClick={() => setOffset((p) => Math.max(0, p - PAGE_SIZE))}
            >
              السابق
            </Button>
            <Button
              size="sm"
              colorScheme="orange"
              borderRadius="xl"
              isDisabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset((p) => p + PAGE_SIZE)}
            >
              التالي
            </Button>
          </HStack>
        </HStack>
      ) : null}
    </VStack>
  );
}
