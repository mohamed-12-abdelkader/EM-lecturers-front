import { useState } from "react";import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
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
  Wrap,
  WrapItem,
  Badge,
} from "@chakra-ui/react";
import { FaArrowRight, FaFilePdf, FaPlus } from "react-icons/fa";
import {
  useGroup,
  useGroupStudents,
  useStudentMutations,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage } from "../../api/centerMgmtApi";
import {
  SUBSCRIPTION_LABELS,
  field,
  formatMoney,
  studentCode,
  studentName,
} from "./centerMgmtUtils";
import {
  DesktopOnly,
  EmptyState,
  ListCard,
  LoadingBlock,
  MobileOnly,
  PageHeader,
  PrimaryButton,
  StatusBadge,
  Surface,
} from "./components/UiBits";
import {
  fetchCenterCardBranding,
  generateGroupStudentCardsPdf,
} from "./utils/generateGroupStudentCardsPdf";

const emptyStudent = {
  full_name: "",
  phone: "",
  parent_phone: "",
  payment_status: "unpaid",
  amount_paid: "",
  exemption_reason: "",
};

export default function GroupDetailsPage() {
  const { groupId } = useParams();
  const toast = useToast();
  const { data: group, isLoading: loadingGroup } = useGroup(groupId);
  const { data: students = [], isLoading: loadingStudents } = useGroupStudents(groupId);
  const { addStudentToGroup } = useStudentMutations();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [form, setForm] = useState(emptyStudent);
  const [exportingCards, setExportingCards] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });

  const handleExportCardsPdf = async () => {
    if (!students.length) {
      toast({ title: "لا يوجد طلاب لتصدير الكروت", status: "warning", duration: 2500 });
      return;
    }
    setExportingCards(true);
    setExportProgress({ current: 0, total: students.length });
    try {
      const branding = await fetchCenterCardBranding();
      const gradeName =
        field(group, "grade_name", "gradeName") ||
        field(group?.grade, "name") ||
        "";
      await generateGroupStudentCardsPdf({
        students,
        groupName: field(group, "name"),
        gradeName,
        branding,
        onProgress: (current, total) => setExportProgress({ current, total }),
      });
      toast({
        title: "تم تنزيل PDF الكروت",
        description: `${students.length} كارت للطلاب`,
        status: "success",
        duration: 3000,
      });
    } catch (err) {
      toast({
        title: "تعذر إنشاء PDF",
        description: err?.message || "حاول مرة أخرى",
        status: "error",
        duration: 3500,
      });
    } finally {
      setExportingCards(false);
      setExportProgress({ current: 0, total: 0 });
    }
  };

  if (loadingGroup) return <LoadingBlock />;
  if (!group) {
    return (
      <EmptyState
        title="المجموعة غير موجودة"
        action={
          <PrimaryButton as={RouterLink} to="/center-mgmt/groups">
            العودة للمجموعات
          </PrimaryButton>
        }
      />
    );
  }

  const days = field(group, "days") || [];
  const paused = field(group, "status") === "paused";

  const handleAdd = async () => {
    if (!form.full_name.trim() || !form.phone.trim()) {
      toast({ title: "الاسم ورقم الهاتف مطلوبان", status: "warning", duration: 2500 });
      return;
    }
    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      parent_phone: form.parent_phone || null,
      payment_status: form.payment_status,
    };
    if (form.payment_status === "partial") {
      payload.amount_paid = Number(form.amount_paid) || 0;
    }
    if (form.payment_status === "exempt") {
      payload.exemption_reason = form.exemption_reason || null;
    }
    try {
      await addStudentToGroup.mutateAsync({ groupId, payload });
      toast({ title: "تم إضافة الطالب مع QR", status: "success", duration: 2000 });
      setForm(emptyStudent);
      onClose();
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  return (
    <Box>
      <PageHeader
        title={field(group, "name")}
        description="تفاصيل المجموعة وإضافة طلاب مع حالة الدفع الابتدائية"
        actions={
          <>
            {students.length > 0 ? (
              <Button
                leftIcon={<FaFilePdf />}
                variant="outline"
                colorScheme="orange"
                borderRadius="xl"
                size={{ base: "sm", md: "md" }}
                onClick={handleExportCardsPdf}
                isLoading={exportingCards}
                loadingText={
                  exportProgress.total
                    ? `جاري التصدير ${exportProgress.current}/${exportProgress.total}`
                    : "جاري التصدير..."
                }
              >
                تنزيل كروت PDF
              </Button>
            ) : null}
            <PrimaryButton
              leftIcon={<FaPlus />}
              onClick={onOpen}
              size={{ base: "sm", md: "md" }}
            >
              إضافة طالب
            </PrimaryButton>
            <Button
              as={RouterLink}
              to="/center-mgmt/groups"
              leftIcon={<FaArrowRight />}
              variant="ghost"
              size="sm"
              borderRadius="xl"
            >
              المجموعات
            </Button>
          </>
        }
      />

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={5}>
        <Surface p={{ base: 3, md: 4 }}>
          <Text fontSize="xs" color="gray.500">الوقت</Text>
          <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>
            {field(group, "start_time", "startTime") || "—"} –{" "}
            {field(group, "end_time", "endTime") || "—"}
          </Text>
        </Surface>
        <Surface p={{ base: 3, md: 4 }}>
          <Text fontSize="xs" color="gray.500">الاشتراك الشهري</Text>
          <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }}>
            {formatMoney(field(group, "monthly_fee", "monthlyFee"))}
          </Text>
        </Surface>
        <Surface p={{ base: 3, md: 4 }}>
          <Text fontSize="xs" color="gray.500">عدد الطلاب</Text>
          <Text fontWeight="bold">{students.length}</Text>
        </Surface>
        <Surface p={{ base: 3, md: 4 }}>
          <Text fontSize="xs" color="gray.500">الحالة</Text>
          <StatusBadge scheme={paused ? "orange" : "green"} mt={1}>
            {paused ? "متوقفة" : "نشطة"}
          </StatusBadge>
        </Surface>
      </SimpleGrid>

      <Surface mb={5}>
        <Text fontWeight="bold" mb={3}>أيام الحضور</Text>
        <Wrap>
          {days.map((d) => (
            <WrapItem key={d}>
              <Badge colorScheme="blue" px={3} py={1} borderRadius="md">{d}</Badge>
            </WrapItem>
          ))}
        </Wrap>
      </Surface>

      <Surface>
        <Flex justify="space-between" align="center" gap={3} mb={4} flexWrap="wrap">
          <Text fontWeight="bold">طلاب المجموعة</Text>
          {students.length > 0 ? (
            <Button
              leftIcon={<FaFilePdf />}
              size="sm"
              variant="outline"
              colorScheme="orange"
              borderRadius="lg"
              onClick={handleExportCardsPdf}
              isLoading={exportingCards}
              loadingText="جاري..."
            >
              كروت PDF
            </Button>
          ) : null}
        </Flex>
        {loadingStudents ? (
          <LoadingBlock />
        ) : students.length === 0 ? (
          <EmptyState
            title="لا يوجد طلاب"
            description="أضف طلاباً لهذه المجموعة ليُنشأ لهم QR تلقائياً."
            action={
              <PrimaryButton onClick={onOpen}>إضافة طالب</PrimaryButton>
            }
          />
        ) : (
          <>
            <MobileOnly>
              <VStack spacing={3} align="stretch">
                {students.map((s) => (
                  <ListCard key={s.id}>
                    <Flex justify="space-between" align="flex-start" gap={3} mb={2}>
                      <VStack align="flex-start" spacing={0.5} minW={0}>
                        <Text fontWeight="black" noOfLines={1}>
                          {studentName(s)}
                        </Text>
                        <Text fontSize="xs" fontFamily="mono" color="gray.500">
                          {studentCode(s)}
                        </Text>
                      </VStack>
                    </Flex>
                    <HStack spacing={4} fontSize="sm" color="gray.600" mb={3} flexWrap="wrap">
                      <Text>{field(s, "phone") || "—"}</Text>
                      <Text color="gray.400">·</Text>
                      <Text>ولي الأمر: {field(s, "parent_phone", "parentPhone") || "—"}</Text>
                    </HStack>
                    <Button
                      as={RouterLink}
                      to={`/center-mgmt/students/${s.id}`}
                      size="sm"
                      variant="outline"
                      colorScheme="blue"
                      borderRadius="lg"
                      w="full"
                    >
                      QR والتفاصيل
                    </Button>
                  </ListCard>
                ))}
              </VStack>
            </MobileOnly>

            <DesktopOnly>
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>الكود</Th>
                      <Th>الاسم</Th>
                      <Th>الهاتف</Th>
                      <Th>ولي الأمر</Th>
                      <Th></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {students.map((s) => (
                      <Tr key={s.id}>
                        <Td fontFamily="mono">{studentCode(s)}</Td>
                        <Td fontWeight="medium">{studentName(s)}</Td>
                        <Td>{field(s, "phone") || "—"}</Td>
                        <Td>{field(s, "parent_phone", "parentPhone") || "—"}</Td>
                        <Td>
                          <Button
                            as={RouterLink}
                            to={`/center-mgmt/students/${s.id}`}
                            size="xs"
                            variant="ghost"
                            colorScheme="blue"
                          >
                            QR والتفاصيل
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </DesktopOnly>
          </>
        )}
      </Surface>

      <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "lg" }} isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent dir="rtl" borderRadius={{ base: "none", md: "2xl" }} m={0}>
          <ModalHeader>إضافة طالب للمجموعة</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>الاسم الكامل</FormLabel>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  borderRadius="xl"
                />
              </FormControl>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                <FormControl isRequired>
                  <FormLabel>هاتف الطالب</FormLabel>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    borderRadius="xl"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>هاتف ولي الأمر</FormLabel>
                  <Input
                    value={form.parent_phone}
                    onChange={(e) => setForm((f) => ({ ...f, parent_phone: e.target.value }))}
                    borderRadius="xl"
                  />
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>حالة دفع الشهر الحالي</FormLabel>
                <Select
                  value={form.payment_status}
                  onChange={(e) => setForm((f) => ({ ...f, payment_status: e.target.value }))}
                  borderRadius="xl"
                >
                  {Object.entries(SUBSCRIPTION_LABELS).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </Select>
              </FormControl>
              {form.payment_status === "partial" && (
                <FormControl>
                  <FormLabel>المبلغ المدفوع</FormLabel>
                  <NumberInput
                    min={0}
                    value={form.amount_paid}
                    onChange={(_, n) =>
                      setForm((f) => ({ ...f, amount_paid: Number.isNaN(n) ? "" : n }))
                    }
                  >
                    <NumberInputField borderRadius="xl" />
                  </NumberInput>
                </FormControl>
              )}
              {form.payment_status === "exempt" && (
                <FormControl>
                  <FormLabel>سبب الإعفاء</FormLabel>
                  <Input
                    value={form.exemption_reason}
                    onChange={(e) => setForm((f) => ({ ...f, exemption_reason: e.target.value }))}
                    borderRadius="xl"
                  />
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter gap={2} flexDir={{ base: "column-reverse", md: "row" }}>
            <Button
              variant="ghost"
              onClick={onClose}
              borderRadius="xl"
              w={{ base: "full", md: "auto" }}
            >
              إلغاء
            </Button>
            <PrimaryButton
              onClick={handleAdd}
              isLoading={addStudentToGroup.isPending}
              w={{ base: "full", md: "auto" }}
            >
              إضافة
            </PrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
