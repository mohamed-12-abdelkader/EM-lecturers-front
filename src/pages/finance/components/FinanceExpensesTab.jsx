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
import { MdAdd, MdEdit } from "react-icons/md";
import {
  createFinanceExpense,
  deleteFinanceExpense,
  fetchFinanceExpenses,
  updateFinanceExpense,
} from "../../../api/financeApi";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_TYPES,
  formatDate,
  formatMoney,
  PAYMENT_METHODS,
} from "../financeConstants";

export default function FinanceExpensesTab({ refreshKey, onChanged }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const emptyForm = {
    title: "",
    description: "",
    amount: "",
    category: "hosting",
    expense_type: "monthly",
    payment_method: "bank_transfer",
    transaction_date: new Date().toISOString().slice(0, 10),
  };
  const [form, setForm] = useState(emptyForm);

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchFinanceExpenses({
        category: categoryFilter || undefined,
      });
      setExpenses(result.expenses);
    } catch (err) {
      toast({ title: err.message, status: "error", duration: 4000, isClosable: true });
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, toast]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    onOpen();
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      title: item.title || "",
      description: item.description || "",
      amount: item.amount ?? "",
      category: item.category || "other",
      expense_type: item.expense_type || "one_time",
      payment_method: item.payment_method || "cash",
      transaction_date: (item.transaction_date || "").slice(0, 10),
    });
    onOpen();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
      };
      if (editItem) {
        await updateFinanceExpense(editItem.id, payload);
        toast({ title: "تم تحديث المصروف", status: "success", duration: 3000, isClosable: true });
      } else {
        await createFinanceExpense(payload);
        toast({ title: "تم إضافة المصروف", status: "success", duration: 3000, isClosable: true });
      }
      onClose();
      onChanged?.();
      load();
    } catch (err) {
      toast({ title: err.message, status: "error", duration: 4000, isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("حذف هذا المصروف؟")) return;
    try {
      await deleteFinanceExpense(id);
      toast({ title: "تم الحذف", status: "success", duration: 3000, isClosable: true });
      onChanged?.();
      load();
    } catch (err) {
      toast({ title: err.message, status: "error", duration: 4000, isClosable: true });
    }
  };

  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between" flexWrap="wrap" gap={3}>
        <Box>
          <Heading size="md">المصروفات</Heading>
          <Text fontSize="sm" color={muted} mt={1}>
            تسجيل ومتابعة مصروفات المنصة
          </Text>
        </Box>
        <Button leftIcon={<MdAdd />} colorScheme="orange" borderRadius="xl" onClick={openCreate}>
          مصروف جديد
        </Button>
      </HStack>

      <Select
        w={{ base: "full", sm: "220px" }}
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        borderRadius="xl"
      >
        <option value="">كل التصنيفات</option>
        {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </Select>

      <Card bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="2xl" overflow="hidden">
        <CardBody p={0}>
          {loading ? (
            <Flex justify="center" py={14}>
              <Spinner color="orange.500" />
            </Flex>
          ) : (
            <Box overflowX="auto">
              <Table size="sm" variant="simple" minW="760px">
                <Thead>
                  <Tr>
                    <Th>العنوان</Th>
                    <Th>التصنيف</Th>
                    <Th isNumeric>المبلغ</Th>
                    <Th>التاريخ</Th>
                    <Th>الدفع</Th>
                    <Th />
                  </Tr>
                </Thead>
                <Tbody>
                  {expenses.length === 0 ? (
                    <Tr>
                      <Td colSpan={6} textAlign="center" py={8} color={muted}>
                        لا توجد مصروفات
                      </Td>
                    </Tr>
                  ) : (
                    expenses.map((item) => (
                      <Tr key={item.id}>
                        <Td>
                          <Text fontWeight="semibold">{item.title}</Text>
                          {item.description ? (
                            <Text fontSize="xs" color={muted} noOfLines={1}>
                              {item.description}
                            </Text>
                          ) : null}
                        </Td>
                        <Td>
                          <Badge colorScheme="red" variant="subtle">
                            {EXPENSE_CATEGORIES[item.category] || item.category}
                          </Badge>
                        </Td>
                        <Td isNumeric fontWeight="bold" color="red.500">
                          {formatMoney(item.amount)}
                        </Td>
                        <Td>{formatDate(item.transaction_date)}</Td>
                        <Td fontSize="xs">
                          {PAYMENT_METHODS[item.payment_method] || item.payment_method}
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            <IconButton
                              aria-label="تعديل"
                              icon={<MdEdit />}
                              size="sm"
                              variant="ghost"
                              onClick={() => openEdit(item)}
                            />
                            <IconButton
                              aria-label="حذف"
                              icon={<FaTrash />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDelete(item.id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))
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
          <ModalHeader>{editItem ? "تعديل مصروف" : "مصروف جديد"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>العنوان</FormLabel>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>الوصف</FormLabel>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </FormControl>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} w="full">
                <FormControl isRequired>
                  <FormLabel>المبلغ</FormLabel>
                  <Input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>التصنيف</FormLabel>
                  <Select
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  >
                    {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>نوع المصروف</FormLabel>
                  <Select
                    value={form.expense_type}
                    onChange={(e) => setForm((p) => ({ ...p, expense_type: e.target.value }))}
                  >
                    {Object.entries(EXPENSE_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>طريقة الدفع</FormLabel>
                  <Select
                    value={form.payment_method}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, payment_method: e.target.value }))
                    }
                  >
                    {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>تاريخ المعاملة</FormLabel>
                <Input
                  type="date"
                  value={form.transaction_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, transaction_date: e.target.value }))
                  }
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              إلغاء
            </Button>
            <Button colorScheme="orange" onClick={handleSave} isLoading={saving}>
              حفظ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
