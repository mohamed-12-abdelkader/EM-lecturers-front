import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Text,
  Textarea,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { fetchUpgradeQuote, upgradeFinanceSubscription } from "../../../api/financeApi";
import {
  formatMoney,
  getUpgradeablePlans,
  PAYMENT_METHODS,
  teacherLabel,
} from "../financeConstants";

export default function SubscriptionUpgradeModal({
  isOpen,
  onClose,
  subscription,
  plans = [],
  onSuccess,
}) {
  const muted = useColorModeValue("gray.500", "gray.400");
  const quoteBg = useColorModeValue("blue.50", "blue.900");
  const [planId, setPlanId] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const upgradePlans = useMemo(
    () => getUpgradeablePlans(subscription?.plan_code, plans),
    [subscription?.plan_code, plans],
  );

  useEffect(() => {
    if (!isOpen || !subscription) return;
    const first = upgradePlans[0];
    setPlanId(first ? String(first.id) : "");
    setPaidAmount("");
    setPaymentMethod("cash");
    setNotes("");
    setQuote(null);
    setQuoteError("");
  }, [isOpen, subscription, upgradePlans]);

  useEffect(() => {
    if (!isOpen || !subscription?.id || !planId) {
      setQuote(null);
      setQuoteError("");
      return;
    }

    let cancelled = false;
    const run = async () => {
      setQuoteLoading(true);
      setQuoteError("");
      try {
        const data = await fetchUpgradeQuote(subscription.id, Number(planId));
        if (!cancelled) {
          setQuote(data);
          setPaidAmount(String(data.upgrade_amount ?? ""));
        }
      } catch (err) {
        if (!cancelled) {
          setQuote(null);
          setQuoteError(err.message || "تعذر حساب فرق الترقية");
        }
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [isOpen, subscription?.id, planId]);

  const handleSubmit = async () => {
    if (!subscription?.id || !planId) return;
    setSubmitting(true);
    try {
      await upgradeFinanceSubscription(subscription.id, {
        plan_id: Number(planId),
        paid_amount: paidAmount !== "" ? Number(paidAmount) : undefined,
        payment_method: paymentMethod,
        notes: notes || undefined,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setQuoteError(err.message || "فشل ترقية الباقة");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent dir="rtl">
        <ModalHeader>ترقية الباقة</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {subscription ? (
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color={muted}>
                {subscription.subscription_number} —{" "}
                {subscription.teacher_name || teacherLabel(subscription.teacher)}
              </Text>
              <Text fontSize="xs" color={muted}>
                تُرقَّى الباقة خلال نفس فترة الاشتراك — يُدفع فرق السعر فقط (من{" "}
                {subscription.plan_name_ar || subscription.plan_code} إلى باقة أعلى).
              </Text>

              {upgradePlans.length === 0 ? (
                <Alert status="info" borderRadius="lg">
                  <AlertIcon />
                  لا توجد باقة أعلى متاحة للترقية.
                </Alert>
              ) : (
                <>
                  <FormControl isRequired>
                    <FormLabel>الباقة الجديدة</FormLabel>
                    <Select
                      value={planId}
                      onChange={(e) => setPlanId(e.target.value)}
                    >
                      {upgradePlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name_ar} — {formatMoney(plan.default_price)}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  {quoteLoading ? (
                    <Box textAlign="center" py={4}>
                      <Spinner size="sm" color="blue.500" />
                      <Text fontSize="sm" color={muted} mt={2}>
                        جاري حساب فرق الترقية…
                      </Text>
                    </Box>
                  ) : null}

                  {quoteError ? (
                    <Alert status="error" borderRadius="lg">
                      <AlertIcon />
                      <Text fontSize="sm" whiteSpace="pre-wrap">
                        {quoteError}
                      </Text>
                    </Alert>
                  ) : null}

                  {quote ? (
                    <Box w="full" p={4} borderRadius="xl" bg={quoteBg}>
                      <Text fontSize="sm" fontWeight="bold" mb={2}>
                        معاينة الترقية
                      </Text>
                      <Text fontSize="sm">
                        من: {quote.from_plan?.name_ar} ({formatMoney(quote.from_plan?.actual_price)})
                      </Text>
                      <Text fontSize="sm">
                        إلى: {quote.to_plan?.name_ar} ({formatMoney(quote.to_plan?.actual_price)})
                      </Text>
                      <Text fontSize="md" fontWeight="bold" color="blue.600" mt={2}>
                        فرق السعر: {formatMoney(quote.upgrade_amount)}
                      </Text>
                      <Text fontSize="xs" color={muted} mt={2}>
                        بعد الترقية — الإجمالي: {formatMoney(quote.after_upgrade?.actual_price)} ·
                        المدفوع: {formatMoney(quote.after_upgrade?.paid_amount)} · المتبقي:{" "}
                        {formatMoney(quote.after_upgrade?.remaining_amount)}
                      </Text>
                    </Box>
                  ) : null}

                  <FormControl>
                    <FormLabel>المبلغ المدفوع الآن (اختياري)</FormLabel>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="افتراضي: فرق السعر كامل"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      isDisabled={!quote}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>طريقة الدفع</FormLabel>
                    <Select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>ملاحظات</FormLabel>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </FormControl>
                </>
              )}
            </VStack>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            إلغاء
          </Button>
          <Button
            colorScheme="purple"
            onClick={handleSubmit}
            isLoading={submitting}
            isDisabled={!quote || quoteLoading || !!quoteError || upgradePlans.length === 0}
          >
            تنفيذ الترقية
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
