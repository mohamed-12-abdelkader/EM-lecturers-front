import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spinner,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
  Flex,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { MdEdit } from "react-icons/md";
import { fetchFinancePlans, updateFinancePlan } from "../../../api/financeApi";
import { formatMoney, formatPlanLimits, PLAN_CODES } from "../financeConstants";

export default function FinancePlansTab({ refreshKey }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [form, setForm] = useState({
    name_ar: "",
    default_price: "",
    duration_days: "",
    featuresText: "",
    is_active: true,
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPlans(await fetchFinancePlans());
    } catch (err) {
      toast({ title: err.message, status: "error", duration: 4000, isClosable: true });
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const openEdit = (plan) => {
    setEditPlan(plan);
    const features = Array.isArray(plan.features)
      ? plan.features
      : typeof plan.features === "string"
        ? JSON.parse(plan.features || "[]")
        : [];
    setForm({
      name_ar: plan.name_ar || "",
      default_price: plan.default_price ?? "",
      duration_days: plan.duration_days ?? "",
      featuresText: features.join("\n"),
      is_active: plan.is_active !== false,
    });
    onOpen();
  };

  const handleSave = async () => {
    if (!editPlan) return;
    setSaving(true);
    try {
      const features = form.featuresText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      await updateFinancePlan(editPlan.id, {
        name_ar: form.name_ar,
        default_price: Number(form.default_price),
        duration_days: Number(form.duration_days),
        features,
        is_active: form.is_active,
      });
      toast({ title: "تم تحديث الباقة", status: "success", duration: 3000, isClosable: true });
      onClose();
      load();
    } catch (err) {
      toast({ title: err.message, status: "error", duration: 4000, isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" py={16}>
        <Spinner color="blue.500" size="lg" />
      </Flex>
    );
  }

  return (
    <VStack align="stretch" spacing={4}>
      <Box>
        <Heading size="md">باقات اشتراك المدرسين</Heading>
        <Text fontSize="sm" color={muted} mt={1}>
          الأسعار الافتراضية والمميزات لكل باقة
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
        {plans.map((plan) => {
          const meta = PLAN_CODES[plan.code] || { label: plan.code, colorScheme: "blue" };
          const features = Array.isArray(plan.features) ? plan.features : [];
          const limitLines = formatPlanLimits(plan.code);
          const displayFeatures = features.length > 0 ? features : limitLines;
          return (
            <Card
              key={plan.id}
              bg={cardBg}
              borderWidth="1px"
              borderColor={border}
              borderRadius="2xl"
              shadow="md"
            >
              <CardBody>
                <HStack justify="space-between" mb={3}>
                  <Badge colorScheme={meta.colorScheme} borderRadius="full" px={3}>
                    {meta.label}
                  </Badge>
                  <IconButton
                    aria-label="تعديل"
                    icon={<MdEdit />}
                    size="sm"
                    variant="ghost"
                    colorScheme="blue"
                    onClick={() => openEdit(plan)}
                  />
                </HStack>
                <Text fontWeight="bold" fontSize="lg" mb={1}>
                  {plan.name_ar || meta.label}
                </Text>
                <Text fontSize="2xl" fontWeight="extrabold" color="blue.500" mb={2}>
                  {formatMoney(plan.default_price)}
                </Text>
                <Text fontSize="sm" color={muted} mb={3}>
                  {plan.duration_days} يوم
                </Text>
                <VStack align="stretch" spacing={1}>
                  {displayFeatures.slice(0, 5).map((f, i) => (
                    <Text key={i} fontSize="xs" color={muted}>
                      • {f}
                    </Text>
                  ))}
                </VStack>
                <Badge mt={3} colorScheme={plan.is_active !== false ? "green" : "red"}>
                  {plan.is_active !== false ? "نشطة" : "موقوفة"}
                </Badge>
              </CardBody>
            </Card>
          );
        })}
      </SimpleGrid>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent dir="rtl">
          <ModalHeader>تعديل الباقة</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>الاسم بالعربية</FormLabel>
                <Input
                  value={form.name_ar}
                  onChange={(e) => setForm((p) => ({ ...p, name_ar: e.target.value }))}
                />
              </FormControl>
              <SimpleGrid columns={2} spacing={3} w="full">
                <FormControl>
                  <FormLabel>السعر الافتراضي</FormLabel>
                  <Input
                    type="number"
                    value={form.default_price}
                    onChange={(e) => setForm((p) => ({ ...p, default_price: e.target.value }))}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>المدة (يوم)</FormLabel>
                  <Input
                    type="number"
                    value={form.duration_days}
                    onChange={(e) => setForm((p) => ({ ...p, duration_days: e.target.value }))}
                  />
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>المميزات (سطر لكل ميزة)</FormLabel>
                <Textarea
                  rows={4}
                  value={form.featuresText}
                  onChange={(e) => setForm((p) => ({ ...p, featuresText: e.target.value }))}
                />
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>الباقة نشطة</FormLabel>
                <Switch
                  colorScheme="green"
                  isChecked={form.is_active}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              إلغاء
            </Button>
            <Button colorScheme="blue" onClick={handleSave} isLoading={saving}>
              حفظ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
