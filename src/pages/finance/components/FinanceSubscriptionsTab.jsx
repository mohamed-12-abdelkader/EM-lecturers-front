import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Popover,
  PopoverAnchor,
  PopoverBody,
  PopoverContent,
  Select,
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
  IconButton,
} from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MdAdd,
  MdAutorenew,
  MdCancel,
  MdDelete,
  MdMoreVert,
  MdPayments,
  MdTrendingUp,
} from "react-icons/md";
import {
  cancelFinanceSubscription,
  createFinanceSubscription,
  deleteFinanceSubscription,
  fetchFinancePlans,
  fetchFinanceSubscriptions,
  fetchFinanceTeachers,
  financeErrorMessage,
  recordSubscriptionPayment,
  renewFinanceSubscription,
  resolveCustomPrice,
  updateFinanceSubscriptionStatus,
} from "../../../api/financeApi";
import {
  formatDate,
  formatMoney,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  paymentStatusMeta,
  PLAN_CODES,
  SUBSCRIPTION_STATUS,
  teacherLabel,
} from "../financeConstants";
import RecordPaymentModal from "./RecordPaymentModal";
import SubscriptionUpgradeModal from "./SubscriptionUpgradeModal";

const PAGE_SIZE = 15;
const DELETABLE_STATUSES = new Set(["cancelled", "expired", "suspended"]);

function deferAction(fn) {
  window.setTimeout(fn, 0);
}

export default function FinanceSubscriptionsTab({
  refreshKey,
  onChanged,
  renewRequestSub,
  onRenewRequestHandled,
}) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [hasRemainingOnly, setHasRemainingOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [resolvedPrice, setResolvedPrice] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);

  const createModal = useDisclosure();
  const renewModal = useDisclosure();
  const paymentModal = useDisclosure();
  const upgradeModal = useDisclosure();
  const cancelModal = useDisclosure();
  const deleteModal = useDisclosure();
  const deleteDialogRef = useRef();
  const toast = useToast();

  const [createForm, setCreateForm] = useState({
    teacher_id: "",
    plan_id: "",
    starts_at: "",
    ends_at: "",
    payment_method: "cash",
    paid_amount: "",
    notes: "",
  });
  const [renewForm, setRenewForm] = useState({
    payment_method: "cash",
    paid_amount: "",
    notes: "",
    plan_id: "",
  });
  const [cancelForm, setCancelForm] = useState({ reason: "", notes: "" });
  const [deleteForce, setDeleteForce] = useState(false);
  const [actionsSubId, setActionsSubId] = useState(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchFinanceSubscriptions({
        limit: PAGE_SIZE,
        offset,
        status: statusFilter,
        payment_status: paymentStatusFilter || undefined,
        has_remaining: hasRemainingOnly ? true : undefined,
        search: search.trim(),
      });
      setSubscriptions(result.subscriptions);
      setTotal(result.total);
    } catch (err) {
      toast({
        title: "خطأ",
        description: financeErrorMessage(err),
        status: "error",
        duration: 6000,
        isClosable: true,
      });
      setSubscriptions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [offset, statusFilter, paymentStatusFilter, hasRemainingOnly, search, toast]);

  const loadMeta = useCallback(async () => {
    try {
      const [t, p] = await Promise.all([fetchFinanceTeachers(), fetchFinancePlans()]);
      setTeachers(t);
      setPlans(p);
    } catch {
      // optional
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    if (!renewRequestSub) return;
    setSelectedSub(renewRequestSub);
    setRenewForm({
      payment_method: "cash",
      paid_amount: "",
      notes: "",
      plan_id: String(renewRequestSub.plan_id || ""),
    });
    renewModal.onOpen();
    onRenewRequestHandled?.();
  }, [renewRequestSub]);

  useEffect(() => {
    const run = async () => {
      if (!createForm.teacher_id || !createForm.plan_id) {
        setResolvedPrice(null);
        return;
      }
      try {
        const price = await resolveCustomPrice(createForm.teacher_id, createForm.plan_id);
        setResolvedPrice(price);
      } catch {
        setResolvedPrice(null);
      }
    };
    run();
  }, [createForm.teacher_id, createForm.plan_id]);

  const handleCreate = async () => {
    if (
      createForm.ends_at &&
      createForm.starts_at &&
      createForm.ends_at < createForm.starts_at
    ) {
      toast({
        title: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية أو مساوياً له",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    setActionLoading(true);
    try {
      await createFinanceSubscription({
        teacher_id: Number(createForm.teacher_id),
        plan_id: Number(createForm.plan_id),
        starts_at: createForm.starts_at || undefined,
        ends_at: createForm.ends_at || undefined,
        payment_method: createForm.payment_method,
        paid_amount:
          createForm.paid_amount !== "" ? Number(createForm.paid_amount) : undefined,
        notes: createForm.notes || undefined,
      });
      toast({ title: "تم إنشاء الاشتراك", status: "success", duration: 3000, isClosable: true });
      createModal.onClose();
      onChanged?.();
      load();
    } catch (err) {
      toast({
        title: "خطأ",
        description: financeErrorMessage(err),
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgradeSuccess = () => {
    toast({ title: "تمت ترقية الباقة", status: "success", duration: 3000, isClosable: true });
    onChanged?.();
    load();
  };

  const handleRenew = async () => {
    if (!selectedSub) return;
    setActionLoading(true);
    try {
      await renewFinanceSubscription(selectedSub.id, {
        payment_method: renewForm.payment_method,
        paid_amount:
          renewForm.paid_amount !== "" ? Number(renewForm.paid_amount) : undefined,
        notes: renewForm.notes || undefined,
        plan_id: renewForm.plan_id ? Number(renewForm.plan_id) : undefined,
      });
      toast({ title: "تم التجديد", status: "success", duration: 3000, isClosable: true });
      renewModal.onClose();
      onChanged?.();
      load();
    } catch (err) {
      toast({
        title: "خطأ",
        description: financeErrorMessage(err),
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async (payload) => {
    if (!selectedSub) return;
    setActionLoading(true);
    try {
      await recordSubscriptionPayment(selectedSub.id, payload);
      toast({ title: "تم تسجيل الدفعة", status: "success", duration: 3000, isClosable: true });
      paymentModal.onClose();
      onChanged?.();
      load();
    } catch (err) {
      toast({
        title: "خطأ",
        description: financeErrorMessage(err),
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatus = async (sub, status) => {
    try {
      await updateFinanceSubscriptionStatus(sub.id, { status });
      toast({ title: "تم تحديث الحالة", status: "success", duration: 3000, isClosable: true });
      onChanged?.();
      load();
    } catch (err) {
      toast({
        title: "خطأ",
        description: financeErrorMessage(err),
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    }
  };

  const openCancel = (sub) => {
    setSelectedSub(sub);
    setCancelForm({ reason: "", notes: "" });
    setActionsSubId(null);
    deferAction(() => cancelModal.onOpen());
  };

  const openDelete = (sub) => {
    setSelectedSub(sub);
    setDeleteForce(false);
    setActionsSubId(null);
    deferAction(() => deleteModal.onOpen());
  };

  const openPayment = (sub) => {
    setSelectedSub(sub);
    setActionsSubId(null);
    deferAction(() => paymentModal.onOpen());
  };

  const openRenew = (sub) => {
    setSelectedSub(sub);
    setRenewForm({
      payment_method: "cash",
      paid_amount: "",
      notes: "",
      plan_id: String(sub.plan_id || ""),
    });
    setActionsSubId(null);
    deferAction(() => renewModal.onOpen());
  };

  const openUpgrade = (sub) => {
    setSelectedSub(sub);
    setActionsSubId(null);
    deferAction(() => upgradeModal.onOpen());
  };

  const runStatusAction = async (sub, status) => {
    setActionsSubId(null);
    await handleStatus(sub, status);
  };

  const handleCancel = async () => {
    if (!selectedSub) return;
    setActionLoading(true);
    try {
      await cancelFinanceSubscription(selectedSub.id, {
        reason: cancelForm.reason.trim() || undefined,
        notes: cancelForm.notes.trim() || undefined,
      });
      toast({
        title: "تم إلغاء الاشتراك",
        description: "تم تصفير المبلغ المتبقي وإلغاء الفواتير المفتوحة",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      cancelModal.onClose();
      onChanged?.();
      load();
    } catch (err) {
      toast({
        title: "خطأ",
        description: financeErrorMessage(err),
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSub) return;
    const hasRemaining = Number(selectedSub.remaining_amount) > 0;
    if (hasRemaining && !deleteForce) {
      toast({
        title: "لا يمكن الحذف",
        description: "يوجد مبلغ متبقي — فعّل «حذف قسري» أو ألغِ الاشتراك أولاً",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setActionLoading(true);
    try {
      await deleteFinanceSubscription(selectedSub.id, { force: hasRemaining && deleteForce });
      toast({ title: "تم حذف الاشتراك من القائمة", status: "success", duration: 3000, isClosable: true });
      deleteModal.onClose();
      onChanged?.();
      load();
    } catch (err) {
      toast({
        title: "خطأ",
        description: financeErrorMessage(err),
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between" flexWrap="wrap" gap={3}>
        <Box>
          <Heading size="md">اشتراكات المدرسين</Heading>
          <Text fontSize="sm" color={muted} mt={1}>
            إنشاء وتجديد ومتابعة اشتراكات المنصة
          </Text>
        </Box>
        <Button
          leftIcon={<MdAdd />}
          colorScheme="blue"
          borderRadius="xl"
          onClick={createModal.onOpen}
        >
          اشتراك جديد
        </Button>
      </HStack>

      <HStack flexWrap="wrap" gap={3}>
        <Input
          placeholder="بحث برقم الاشتراك أو اسم المدرس..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOffset(0);
          }}
          maxW={{ base: "full", md: "280px" }}
          borderRadius="xl"
        />
        <Select
          w={{ base: "full", sm: "180px" }}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setOffset(0);
          }}
          borderRadius="xl"
        >
          <option value="">كل الحالات</option>
          {Object.entries(SUBSCRIPTION_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </Select>
        <Select
          w={{ base: "full", sm: "180px" }}
          value={paymentStatusFilter}
          onChange={(e) => {
            setPaymentStatusFilter(e.target.value);
            setOffset(0);
          }}
          borderRadius="xl"
        >
          <option value="">كل حالات الدفع</option>
          {Object.entries(PAYMENT_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </Select>
        <Button
          size="sm"
          variant={hasRemainingOnly ? "solid" : "outline"}
          colorScheme={hasRemainingOnly ? "orange" : "gray"}
          borderRadius="xl"
          onClick={() => {
            setHasRemainingOnly((v) => !v);
            setOffset(0);
          }}
        >
          مستحقات فقط
        </Button>
      </HStack>

      <Card bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="2xl" overflow="visible">
        <CardBody p={0}>
          {loading ? (
            <Flex justify="center" py={14}>
              <Spinner color="blue.500" />
            </Flex>
          ) : (
            <Box overflowX="auto">
              <Table size="sm" variant="simple" minW="1100px">
                <Thead>
                  <Tr>
                    <Th>رقم الاشتراك</Th>
                    <Th>المدرس</Th>
                    <Th>الباقة</Th>
                    <Th isNumeric>الإجمالي</Th>
                    <Th isNumeric>المدفوع</Th>
                    <Th isNumeric>المتبقي</Th>
                    <Th>الدفع</Th>
                    <Th>البداية</Th>
                    <Th>النهاية</Th>
                    <Th>الحالة</Th>
                    <Th />
                  </Tr>
                </Thead>
                <Tbody>
                  {subscriptions.length === 0 ? (
                    <Tr>
                      <Td colSpan={11} textAlign="center" py={8} color={muted}>
                        لا توجد اشتراكات
                      </Td>
                    </Tr>
                  ) : (
                    subscriptions.map((sub) => {
                      const st = SUBSCRIPTION_STATUS[sub.status] || {
                        label: sub.status,
                        colorScheme: "gray",
                      };
                      const pay = paymentStatusMeta(sub.payment_status);
                      const planMeta = PLAN_CODES[sub.plan_code] || {};
                      return (
                        <Tr key={sub.id}>
                          <Td fontFamily="mono" fontSize="xs">
                            {sub.subscription_number || `#${sub.id}`}
                          </Td>
                          <Td>{sub.teacher_name || teacherLabel(sub.teacher)}</Td>
                          <Td>
                            <Badge colorScheme={planMeta.colorScheme || "blue"}>
                              {sub.plan_name_ar || planMeta.label || sub.plan_code}
                            </Badge>
                          </Td>
                          <Td isNumeric>{formatMoney(sub.actual_price)}</Td>
                          <Td isNumeric color="green.500">
                            {formatMoney(sub.paid_amount)}
                          </Td>
                          <Td isNumeric fontWeight={sub.remaining_amount > 0 ? "bold" : "normal"} color={sub.remaining_amount > 0 ? "orange.500" : muted}>
                            {formatMoney(sub.remaining_amount)}
                          </Td>
                          <Td>
                            <Badge colorScheme={pay.colorScheme} fontSize="10px">
                              {pay.label}
                            </Badge>
                          </Td>
                          <Td>{formatDate(sub.starts_at)}</Td>
                          <Td>{formatDate(sub.ends_at)}</Td>
                          <Td>
                            <Badge colorScheme={st.colorScheme}>{st.label}</Badge>
                          </Td>
                          <Td position="relative" zIndex={actionsSubId === sub.id ? 2 : 1}>
                            <Popover
                              isOpen={actionsSubId === sub.id}
                              onClose={() => setActionsSubId(null)}
                              placement="bottom-end"
                              strategy="fixed"
                              closeOnBlur
                              isLazy
                            >
                              <PopoverAnchor>
                                <IconButton
                                  aria-label="إجراءات"
                                  icon={<MdMoreVert />}
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActionsSubId((current) =>
                                      current === sub.id ? null : sub.id,
                                    );
                                  }}
                                />
                              </PopoverAnchor>
                              <PopoverContent
                                w="220px"
                                zIndex={2000}
                                shadow="lg"
                                borderRadius="xl"
                                _focus={{ outline: "none" }}
                              >
                                <PopoverBody p={1}>
                                  <VStack align="stretch" spacing={0}>
                                    {sub.remaining_amount > 0 ? (
                                      <Button
                                        variant="ghost"
                                        justifyContent="flex-start"
                                        size="sm"
                                        leftIcon={<Icon as={MdPayments} />}
                                        onClick={() => openPayment(sub)}
                                      >
                                        تسجيل دفعة
                                      </Button>
                                    ) : null}
                                    <Button
                                      variant="ghost"
                                      justifyContent="flex-start"
                                      size="sm"
                                      leftIcon={<Icon as={MdAutorenew} />}
                                      onClick={() => openRenew(sub)}
                                    >
                                      تجديد
                                    </Button>
                                    {sub.status === "active" ? (
                                      <Button
                                        variant="ghost"
                                        justifyContent="flex-start"
                                        size="sm"
                                        leftIcon={<Icon as={MdTrendingUp} />}
                                        onClick={() => openUpgrade(sub)}
                                      >
                                        ترقية الباقة
                                      </Button>
                                    ) : null}
                                    {sub.status !== "suspended" ? (
                                      <Button
                                        variant="ghost"
                                        justifyContent="flex-start"
                                        size="sm"
                                        onClick={() => runStatusAction(sub, "suspended")}
                                      >
                                        تعليق
                                      </Button>
                                    ) : null}
                                    {sub.status !== "active" ? (
                                      <Button
                                        variant="ghost"
                                        justifyContent="flex-start"
                                        size="sm"
                                        onClick={() => runStatusAction(sub, "active")}
                                      >
                                        تفعيل
                                      </Button>
                                    ) : null}
                                    {sub.status !== "cancelled" ? (
                                      <Button
                                        variant="ghost"
                                        justifyContent="flex-start"
                                        size="sm"
                                        color="orange.600"
                                        leftIcon={<Icon as={MdCancel} />}
                                        onClick={() => openCancel(sub)}
                                      >
                                        إلغاء الاشتراك
                                      </Button>
                                    ) : null}
                                    {DELETABLE_STATUSES.has(sub.status) ? (
                                      <Button
                                        variant="ghost"
                                        justifyContent="flex-start"
                                        size="sm"
                                        color="red.500"
                                        leftIcon={<Icon as={MdDelete} />}
                                        onClick={() => openDelete(sub)}
                                      >
                                        حذف من القائمة
                                      </Button>
                                    ) : null}
                                  </VStack>
                                </PopoverBody>
                              </PopoverContent>
                            </Popover>
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
              colorScheme="blue"
              borderRadius="xl"
              isDisabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset((p) => p + PAGE_SIZE)}
            >
              التالي
            </Button>
          </HStack>
        </HStack>
      ) : null}

      <Modal isOpen={createModal.isOpen} onClose={createModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent dir="rtl">
          <ModalHeader>اشتراك جديد</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>المدرس</FormLabel>
                <Select
                  placeholder="اختر المدرس"
                  value={createForm.teacher_id}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, teacher_id: e.target.value }))
                  }
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {teacherLabel(t)} {t.email ? `(${t.email})` : ""}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>الباقة</FormLabel>
                <Select
                  placeholder="اختر الباقة"
                  value={createForm.plan_id}
                  onChange={(e) => setCreateForm((p) => ({ ...p, plan_id: e.target.value }))}
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name_ar} — {formatMoney(p.default_price)}
                    </option>
                  ))}
                </Select>
              </FormControl>
              {resolvedPrice ? (
                <Box w="full" p={3} borderRadius="lg" bg="blue.50" _dark={{ bg: "blue.900" }}>
                  <Text fontSize="sm" fontWeight="bold">
                    السعر المحسوب: {formatMoney(resolvedPrice.resolved_price ?? resolvedPrice.price ?? resolvedPrice.actual_price)}
                  </Text>
                  {resolvedPrice.is_custom ? (
                    <Text fontSize="xs" color={muted}>
                      سعر مخصص — {resolvedPrice.discount_reason}
                    </Text>
                  ) : null}
                  <Text fontSize="xs" color={muted} mt={1}>
                    اترك «المبلغ المدفوع» فارغاً لتسجيل دفع كامل، أو أدخل مبلغاً جزئياً (0 = بدون دفع)
                  </Text>
                </Box>
              ) : null}
              <FormControl>
                <FormLabel>تاريخ البداية</FormLabel>
                <Input
                  type="date"
                  value={createForm.starts_at}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, starts_at: e.target.value }))
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>تاريخ النهاية (اختياري)</FormLabel>
                <Input
                  type="date"
                  min={createForm.starts_at || undefined}
                  value={createForm.ends_at}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, ends_at: e.target.value }))
                  }
                />
                <Text fontSize="xs" color={muted} mt={1}>
                  إن تُرك فارغاً يُحسب تلقائياً من مدة الباقة (duration_days)
                </Text>
              </FormControl>
              <FormControl>
                <FormLabel>المبلغ المدفوع (اختياري)</FormLabel>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="افتراضي: الدفع كامل"
                  value={createForm.paid_amount}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, paid_amount: e.target.value }))
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>طريقة الدفع</FormLabel>
                <Select
                  value={createForm.payment_method}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, payment_method: e.target.value }))
                  }
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
                <Textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={createModal.onClose}>
              إلغاء
            </Button>
            <Button colorScheme="blue" onClick={handleCreate} isLoading={actionLoading}>
              إنشاء
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={renewModal.isOpen} onClose={renewModal.onClose}>
        <ModalOverlay />
        <ModalContent dir="rtl">
          <ModalHeader>تجديد اشتراك</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text fontSize="sm" color={muted}>
                {selectedSub?.subscription_number} — {selectedSub?.teacher_name}
              </Text>
              <FormControl>
                <FormLabel>تغيير الباقة (اختياري)</FormLabel>
                <Select
                  placeholder="نفس الباقة"
                  value={renewForm.plan_id}
                  onChange={(e) => setRenewForm((p) => ({ ...p, plan_id: e.target.value }))}
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name_ar}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>المبلغ المدفوع (اختياري)</FormLabel>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="افتراضي: الدفع كامل"
                  value={renewForm.paid_amount}
                  onChange={(e) =>
                    setRenewForm((p) => ({ ...p, paid_amount: e.target.value }))
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>طريقة الدفع</FormLabel>
                <Select
                  value={renewForm.payment_method}
                  onChange={(e) =>
                    setRenewForm((p) => ({ ...p, payment_method: e.target.value }))
                  }
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
                <Textarea
                  value={renewForm.notes}
                  onChange={(e) => setRenewForm((p) => ({ ...p, notes: e.target.value }))}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={renewModal.onClose}>
              إلغاء
            </Button>
            <Button colorScheme="orange" onClick={handleRenew} isLoading={actionLoading}>
              تجديد
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <RecordPaymentModal
        isOpen={paymentModal.isOpen}
        onClose={paymentModal.onClose}
        subscription={selectedSub}
        onSubmit={handleRecordPayment}
        isLoading={actionLoading}
      />

      <SubscriptionUpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={upgradeModal.onClose}
        subscription={selectedSub}
        plans={plans}
        onSuccess={handleUpgradeSuccess}
      />

      <Modal isOpen={cancelModal.isOpen} onClose={cancelModal.onClose} size="md">
        <ModalOverlay />
        <ModalContent dir="rtl">
          <ModalHeader>إلغاء الاشتراك</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color={muted}>
                {selectedSub?.subscription_number || `#${selectedSub?.id}`} —{" "}
                {selectedSub?.teacher_name}
              </Text>
              <Box
                p={3}
                borderRadius="lg"
                bg="orange.50"
                borderWidth="1px"
                borderColor="orange.100"
                _dark={{ bg: "orange.900", borderColor: "orange.800" }}
              >
                <Text fontSize="xs" color={muted}>
                  عند الإلغاء: تصبح الحالة «ملغي» ويُصفَّر المبلغ المتبقي، وتُلغى الفواتير
                  المفتوحة (غير مدفوعة / جزئية). إن لم يبقَ اشتراك نشط آخر تُعطَّل منصة المدرس
                  وقد تُحدَّث باقته إلى bronze.
                </Text>
              </Box>
              <FormControl>
                <FormLabel>سبب الإلغاء</FormLabel>
                <Input
                  placeholder="مثال: طلب المدرس"
                  value={cancelForm.reason}
                  onChange={(e) => setCancelForm((p) => ({ ...p, reason: e.target.value }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>ملاحظات (اختياري)</FormLabel>
                <Textarea
                  placeholder="ملاحظة إضافية..."
                  value={cancelForm.notes}
                  onChange={(e) => setCancelForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={cancelModal.onClose}>
              تراجع
            </Button>
            <Button colorScheme="orange" onClick={handleCancel} isLoading={actionLoading}>
              تأكيد الإلغاء
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={deleteModal.isOpen}
        leastDestructiveRef={deleteDialogRef}
        onClose={deleteModal.onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              حذف الاشتراك من القائمة
            </AlertDialogHeader>
            <AlertDialogBody>
              <VStack align="stretch" spacing={3}>
                <Text>
                  هل تريد حذف اشتراك{" "}
                  <strong>
                    {selectedSub?.subscription_number || `#${selectedSub?.id}`}
                  </strong>{" "}
                  للمدرس <strong>{selectedSub?.teacher_name}</strong>؟
                </Text>
                <Text fontSize="sm" color={muted}>
                  يُزال السجل من القائمة. الدفعات المرتبطة تُحذف تلقائياً، والفواتير تبقى بدون
                  ربط بالاشتراك.
                </Text>
                {Number(selectedSub?.remaining_amount) > 0 ? (
                  <Box
                    p={3}
                    borderRadius="lg"
                    bg="red.50"
                    borderWidth="1px"
                    borderColor="red.100"
                    _dark={{ bg: "red.900", borderColor: "red.800" }}
                  >
                    <Text fontSize="sm" fontWeight="semibold" mb={2}>
                      يوجد مبلغ متبقي: {formatMoney(selectedSub.remaining_amount)}
                    </Text>
                    <Checkbox
                      isChecked={deleteForce}
                      onChange={(e) => setDeleteForce(e.target.checked)}
                      colorScheme="red"
                    >
                      حذف قسري (force=true)
                    </Checkbox>
                  </Box>
                ) : null}
              </VStack>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={deleteDialogRef} onClick={deleteModal.onClose}>
                تراجع
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                ml={3}
                isLoading={actionLoading}
                isDisabled={
                  Number(selectedSub?.remaining_amount) > 0 && !deleteForce
                }
              >
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
}
