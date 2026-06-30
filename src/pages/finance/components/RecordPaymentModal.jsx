import {
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
  Text,
  Textarea,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { formatMoney, PAYMENT_METHODS, paymentStatusLabel, teacherLabel } from "../financeConstants";

export default function RecordPaymentModal({
  isOpen,
  onClose,
  subscription,
  onSubmit,
  isLoading,
}) {
  const muted = useColorModeValue("gray.500", "gray.400");
  const [form, setForm] = useState({
    amount: "",
    payment_method: "cash",
    payment_date: "",
    notes: "",
  });

  useEffect(() => {
    if (!isOpen || !subscription) return;
    setForm({
      amount: subscription.remaining_amount ? String(subscription.remaining_amount) : "",
      payment_method: "cash",
      payment_date: new Date().toISOString().slice(0, 10),
      notes: "",
    });
  }, [isOpen, subscription]);

  const handleSubmit = () => {
    onSubmit?.({
      amount: Number(form.amount),
      payment_method: form.payment_method,
      payment_date: form.payment_date || undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent dir="rtl">
        <ModalHeader>تسجيل دفعة</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {subscription ? (
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color={muted}>
                {subscription.subscription_number} — {subscription.teacher_name || teacherLabel(subscription.teacher)}
              </Text>
              <Text fontSize="sm">
                الإجمالي: {formatMoney(subscription.actual_price)} · المدفوع:{" "}
                {formatMoney(subscription.paid_amount)} · المتبقي:{" "}
                <Text as="span" fontWeight="bold" color="orange.500">
                  {formatMoney(subscription.remaining_amount)}
                </Text>
              </Text>
              <Text fontSize="xs" color={muted}>
                حالة الدفع: {paymentStatusLabel(subscription)}
              </Text>
              <FormControl isRequired>
                <FormLabel>المبلغ</FormLabel>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>طريقة الدفع</FormLabel>
                <Select
                  value={form.payment_method}
                  onChange={(e) => setForm((p) => ({ ...p, payment_method: e.target.value }))}
                >
                  {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>تاريخ الدفع</FormLabel>
                <Input
                  type="date"
                  value={form.payment_date}
                  onChange={(e) => setForm((p) => ({ ...p, payment_date: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>ملاحظات</FormLabel>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </FormControl>
            </VStack>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            إلغاء
          </Button>
          <Button
            colorScheme="green"
            onClick={handleSubmit}
            isLoading={isLoading}
            isDisabled={!form.amount || Number(form.amount) <= 0}
          >
            تسجيل الدفعة
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
