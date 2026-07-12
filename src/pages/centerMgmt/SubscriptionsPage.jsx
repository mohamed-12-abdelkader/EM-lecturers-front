import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Badge,
  Button,
  Flex,
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
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { FaSync } from "react-icons/fa";
import {
  useSubscriptionMutations,
  useSubscriptions,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage } from "../../api/centerMgmtApi";
import {
  SUBSCRIPTION_LABELS,
  currentMonthYear,
  field,
  formatMoney,
  studentName,
} from "./centerMgmtUtils";
import { EmptyState, LoadingBlock, PageHeader, Surface } from "./components/UiBits";

export default function SubscriptionsPage() {
  const { centerId, center } = useOutletContext();
  const toast = useToast();
  const now = currentMonthYear();
  const [month, setMonth] = useState(String(now.month));
  const [year, setYear] = useState(String(now.year));
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [genAmount, setGenAmount] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  const params = useMemo(
    () => ({
      month: month || undefined,
      year: year || undefined,
      status: status || undefined,
      search: search || undefined,
      page,
      limit: 20,
    }),
    [month, year, status, search, page]
  );

  const { data, isLoading } = useSubscriptions(centerId, params);
  const { generate, updateStatus } = useSubscriptionMutations(centerId);
  const items = data?.items || [];
  const currency = field(center, "currency") || "EGP";

  const handleGenerate = async () => {
    try {
      const result = await generate.mutateAsync({
        month: Number(month) || now.month,
        year: Number(year) || now.year,
        amount: genAmount === "" ? undefined : Number(genAmount),
      });
      toast({
        title: "تم توليد الاشتراكات",
        description: result?.created != null ? `تم إنشاء ${result.created}` : undefined,
        status: "success",
        duration: 3000,
      });
      onClose();
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  const handleStatus = async (sub, next) => {
    try {
      await updateStatus.mutateAsync({ subscriptionId: sub.id, status: next });
      toast({ title: "تم تحديث الحالة", status: "success", duration: 2000 });
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  return (
    <>
      <PageHeader
        title="الاشتراكات الشهرية"
        description="ولّد اشتراكات الشهر للطلاب المسجلين، ثم تابع المدفوع وغير المدفوع."
        actions={
          <Button leftIcon={<FaSync />} colorScheme="blue" borderRadius="xl" onClick={onOpen}>
            توليد اشتراكات الشهر
          </Button>
        }
      />

      <Surface mb={5}>
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3}>
          <Select value={month} onChange={(e) => { setMonth(e.target.value); setPage(1); }} borderRadius="xl">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                شهر {i + 1}
              </option>
            ))}
          </Select>
          <Input
            type="number"
            value={year}
            onChange={(e) => { setYear(e.target.value); setPage(1); }}
            borderRadius="xl"
          />
          <Select
            placeholder="كل الحالات"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            borderRadius="xl"
          >
            <option value="pending">غير مدفوع</option>
            <option value="active">نشط</option>
            <option value="expired">منتهي</option>
          </Select>
          <Input
            placeholder="بحث بالطالب..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            borderRadius="xl"
          />
        </SimpleGrid>
      </Surface>

      {isLoading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState
          title="لا توجد اشتراكات"
          description="ولّد اشتراكات الشهر الحالي للطلاب المسجلين في مجموعات."
          action={
            <Button colorScheme="blue" onClick={onOpen}>
              توليد الآن
            </Button>
          }
        />
      ) : (
        <Surface p={0} overflow="hidden">
          <TableContainer>
            <Table>
              <Thead>
                <Tr>
                  <Th>الطالب</Th>
                  <Th>الشهر</Th>
                  <Th>المبلغ</Th>
                  <Th>الحالة</Th>
                  <Th>إجراء</Th>
                </Tr>
              </Thead>
              <Tbody>
                {items.map((sub) => {
                  const st = field(sub, "status") || "pending";
                  const meta = SUBSCRIPTION_LABELS[st] || SUBSCRIPTION_LABELS.pending;
                  return (
                    <Tr key={sub.id}>
                      <Td fontWeight="medium">
                        {studentName(sub) || field(sub, "student_id", "studentId")}
                      </Td>
                      <Td>
                        {field(sub, "month")}/{field(sub, "year")}
                      </Td>
                      <Td>{formatMoney(field(sub, "amount"), currency)}</Td>
                      <Td>
                        <Badge colorScheme={meta.scheme}>{meta.label}</Badge>
                      </Td>
                      <Td>
                        {st === "pending" ? (
                          <Button size="xs" colorScheme="green" onClick={() => handleStatus(sub, "active")}>
                            تفعيل
                          </Button>
                        ) : st === "active" ? (
                          <Button size="xs" variant="outline" onClick={() => handleStatus(sub, "expired")}>
                            إنهاء
                          </Button>
                        ) : (
                          <Text fontSize="xs" color="gray.400">
                            —
                          </Text>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
          <Flex justify="flex-end" gap={2} px={4} py={3}>
            <Button size="sm" isDisabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              السابق
            </Button>
            <Text fontSize="sm" alignSelf="center">
              {page} / {data?.totalPages || 1}
            </Text>
            <Button
              size="sm"
              isDisabled={page >= (data?.totalPages || 1)}
              onClick={() => setPage((p) => p + 1)}
            >
              التالي
            </Button>
          </Flex>
        </Surface>
      )}

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="2xl" mx={3}>
          <ModalHeader>توليد اشتراكات شهرية</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>الشهر</FormLabel>
                <Select value={month} onChange={(e) => setMonth(e.target.value)} borderRadius="xl">
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>السنة</FormLabel>
                <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} borderRadius="xl" />
              </FormControl>
              <FormControl>
                <FormLabel>المبلغ (اختياري — يستخدم رسوم المجموعة/السنتر إن تُرك فارغاً)</FormLabel>
                <NumberInput min={0} value={genAmount} onChange={(_, n) => setGenAmount(Number.isNaN(n) ? "" : n)}>
                  <NumberInputField borderRadius="xl" />
                </NumberInput>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={onClose}>
              إلغاء
            </Button>
            <Button colorScheme="blue" onClick={handleGenerate} isLoading={generate.isPending} borderRadius="xl">
              توليد
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
