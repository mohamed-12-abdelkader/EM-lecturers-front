import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
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
  Select,
  SimpleGrid,
  Spinner,
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
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";
import { MdAdd } from "react-icons/md";
import {
  createCustomPrice,
  deleteCustomPrice,
  fetchFinancePlans,
  fetchFinanceTeachers,
  fetchTeacherCustomPrices,
  resolveCustomPrice,
} from "../../../api/financeApi";
import { formatDate, formatMoney, PLAN_CODES, teacherLabel } from "../financeConstants";

export default function FinanceCustomPricesTab({ refreshKey, onChanged }) {
  const [teachers, setTeachers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [form, setForm] = useState({
    teacher_id: "",
    plan_id: "",
    custom_price: "",
    discount_reason: "",
    valid_from: "",
    valid_until: "",
  });

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  const loadMeta = useCallback(async () => {
    try {
      const [t, p] = await Promise.all([fetchFinanceTeachers(), fetchFinancePlans()]);
      setTeachers(t);
      setPlans(p);
    } catch (err) {
      toast({ title: err.message, status: "error", duration: 4000, isClosable: true });
    }
  }, [toast]);

  const loadPrices = useCallback(async () => {
    if (!selectedTeacher) {
      setPrices([]);
      return;
    }
    setLoading(true);
    try {
      setPrices(await fetchTeacherCustomPrices(selectedTeacher, true));
    } catch (err) {
      toast({ title: err.message, status: "error", duration: 4000, isClosable: true });
      setPrices([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTeacher, toast]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta, refreshKey]);

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  useEffect(() => {
    const run = async () => {
      if (!form.teacher_id || !form.plan_id) {
        setPreview(null);
        return;
      }
      try {
        setPreview(await resolveCustomPrice(form.teacher_id, form.plan_id));
      } catch {
        setPreview(null);
      }
    };
    run();
  }, [form.teacher_id, form.plan_id]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createCustomPrice({
        teacher_id: Number(form.teacher_id),
        plan_id: Number(form.plan_id),
        custom_price: Number(form.custom_price),
        discount_reason: form.discount_reason,
        valid_from: form.valid_from || undefined,
        valid_until: form.valid_until || undefined,
      });
      toast({ title: "تم تعيين السعر المخصص", status: "success", duration: 3000, isClosable: true });
      onClose();
      onChanged?.();
      if (String(form.teacher_id) === selectedTeacher) loadPrices();
    } catch (err) {
      toast({ title: err.message, status: "error", duration: 4000, isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("حذف السعر المخصص؟")) return;
    try {
      await deleteCustomPrice(id);
      toast({ title: "تم الحذف", status: "success", duration: 3000, isClosable: true });
      onChanged?.();
      loadPrices();
    } catch (err) {
      toast({ title: err.message, status: "error", duration: 4000, isClosable: true });
    }
  };

  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between" flexWrap="wrap" gap={3}>
        <Box>
          <Heading size="md">التسعير المخصص</Heading>
          <Text fontSize="sm" color={muted} mt={1}>
            أسعار وخصومات خاصة لكل مدرس
          </Text>
        </Box>
        <Button
          leftIcon={<MdAdd />}
          colorScheme="purple"
          borderRadius="xl"
          onClick={() => {
            setForm({
              teacher_id: selectedTeacher || "",
              plan_id: "",
              custom_price: "",
              discount_reason: "",
              valid_from: "",
              valid_until: "",
            });
            onOpen();
          }}
        >
          سعر مخصص
        </Button>
      </HStack>

      <Select
        placeholder="اختر مدرساً لعرض أسعاره"
        value={selectedTeacher}
        onChange={(e) => setSelectedTeacher(e.target.value)}
        maxW={{ base: "full", md: "360px" }}
        borderRadius="xl"
      >
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {teacherLabel(t)}
          </option>
        ))}
      </Select>

      <Card bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="2xl" overflow="hidden">
        <CardBody p={0}>
          {!selectedTeacher ? (
            <Text p={8} textAlign="center" color={muted}>
              اختر مدرساً لعرض سجل الأسعار المخصصة
            </Text>
          ) : loading ? (
            <Flex justify="center" py={14}>
              <Spinner color="purple.500" />
            </Flex>
          ) : (
            <Box overflowX="auto">
              <Table size="sm" variant="simple" minW="720px">
                <Thead>
                  <Tr>
                    <Th>الباقة</Th>
                    <Th isNumeric>السعر المخصص</Th>
                    <Th>السبب</Th>
                    <Th>من</Th>
                    <Th>إلى</Th>
                    <Th>الحالة</Th>
                    <Th />
                  </Tr>
                </Thead>
                <Tbody>
                  {prices.length === 0 ? (
                    <Tr>
                      <Td colSpan={7} textAlign="center" py={8} color={muted}>
                        لا توجد أسعار مخصصة
                      </Td>
                    </Tr>
                  ) : (
                    prices.map((row) => {
                      const meta = PLAN_CODES[row.plan_code] || {};
                      return (
                        <Tr key={row.id}>
                          <Td>
                            <Badge colorScheme={meta.colorScheme || "blue"}>
                              {row.plan_name_ar || meta.label || row.plan_code}
                            </Badge>
                          </Td>
                          <Td isNumeric fontWeight="bold">
                            {formatMoney(row.custom_price)}
                          </Td>
                          <Td maxW="200px" noOfLines={2}>
                            {row.discount_reason || "—"}
                          </Td>
                          <Td>{formatDate(row.valid_from)}</Td>
                          <Td>{formatDate(row.valid_until)}</Td>
                          <Td>
                            <Badge colorScheme={row.is_active !== false ? "green" : "gray"}>
                              {row.is_active !== false ? "نشط" : "منتهي"}
                            </Badge>
                          </Td>
                          <Td>
                            <IconButton
                              aria-label="حذف"
                              icon={<FaTrash />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDelete(row.id)}
                            />
                          </Td>
                        </Tr>
                      );
                    })
                  )}
                </Tbody>
              </Table>
            </Box>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent dir="rtl">
          <ModalHeader>تعيين سعر مخصص</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>المدرس</FormLabel>
                <Select
                  placeholder="اختر المدرس"
                  value={form.teacher_id}
                  onChange={(e) => setForm((p) => ({ ...p, teacher_id: e.target.value }))}
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {teacherLabel(t)}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>الباقة</FormLabel>
                <Select
                  placeholder="اختر الباقة"
                  value={form.plan_id}
                  onChange={(e) => setForm((p) => ({ ...p, plan_id: e.target.value }))}
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name_ar} — {formatMoney(p.default_price)}
                    </option>
                  ))}
                </Select>
              </FormControl>
              {preview ? (
                <Box w="full" p={3} borderRadius="lg" bg="purple.50" _dark={{ bg: "purple.900" }}>
                  <Text fontSize="sm">
                    السعر الافتراضي: {formatMoney(preview.default_price)}
                  </Text>
                  <Text fontSize="sm" fontWeight="bold">
                    السعر الحالي المحسوب:{" "}
                    {formatMoney(preview.resolved_price ?? preview.price)}
                  </Text>
                </Box>
              ) : null}
              <SimpleGrid columns={2} spacing={3} w="full">
                <FormControl isRequired>
                  <FormLabel>السعر المخصص</FormLabel>
                  <Input
                    type="number"
                    value={form.custom_price}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, custom_price: e.target.value }))
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>سبب الخصم</FormLabel>
                  <Input
                    value={form.discount_reason}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, discount_reason: e.target.value }))
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>صالح من</FormLabel>
                  <Input
                    type="date"
                    value={form.valid_from}
                    onChange={(e) => setForm((p) => ({ ...p, valid_from: e.target.value }))}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>صالح حتى</FormLabel>
                  <Input
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => setForm((p) => ({ ...p, valid_until: e.target.value }))}
                  />
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>ملاحظات إضافية</FormLabel>
                <Textarea placeholder="اختياري — تفاصيل إضافية عن الخصم" rows={2} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              إلغاء
            </Button>
            <Button colorScheme="purple" onClick={handleCreate} isLoading={saving}>
              حفظ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
