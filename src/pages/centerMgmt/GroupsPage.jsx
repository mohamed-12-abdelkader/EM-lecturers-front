import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
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
  Textarea,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  VStack,
  Wrap,
  WrapItem,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FaEdit,
  FaPlus,
  FaTrash,
  FaUsers,
  FaClock,
  FaMoneyBillWave,
  FaLayerGroup,
  FaChevronLeft,
  FaGraduationCap,
} from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import {
  useGroupMutations,
  useGroups,
  usePlatformGrades,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage } from "../../api/centerMgmtApi";
import { ACCENT, WEEK_DAYS, field, formatMoney } from "./centerMgmtUtils";
import {
  DesktopOnly,
  EmptyState,
  FilterBar,
  KpiCard,
  LoadingBlock,
  ListCard,
  MobileOnly,
  PageHeader,
  PaginationBar,
  PrimaryButton,
  StatusBadge,
  Surface,
} from "./components/UiBits";

const emptyForm = {
  name: "",
  grade_id: "",
  subject_id: "",
  days: [],
  start_time: "16:00",
  end_time: "18:00",
  monthly_fee: 300,
  status: "active",
  notes: "",
};

function DayPill({ day, selected, onToggle }) {
  const idleBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const idleColor = useColorModeValue("gray.600", "gray.300");
  return (
    <Button
      size="sm"
      borderRadius="full"
      px={3}
      h="32px"
      fontSize="xs"
      fontWeight="semibold"
      variant="unstyled"
      display="inline-flex"
      bg={selected ? "blue.500" : idleBg}
      color={selected ? "white" : idleColor}
      borderWidth="1px"
      borderColor={selected ? "blue.500" : "transparent"}
      _hover={{ bg: selected ? "blue.600" : "blue.50", color: selected ? "white" : ACCENT }}
      onClick={() => onToggle(day)}
    >
      {day}
    </Button>
  );
}

function GroupMeta({ icon, label, value, accent = "blue" }) {
  const bg = useColorModeValue(`${accent}.50`, "whiteAlpha.100");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const valueColor = useColorModeValue("gray.800", "gray.100");

  return (
    <Flex
      align="center"
      gap={2.5}
      p={2.5}
      borderRadius="xl"
      bg={bg}
      minW={0}
    >
      <Flex
        w={8}
        h={8}
        borderRadius="lg"
        bg="white"
        _dark={{ bg: "gray.800" }}
        align="center"
        justify="center"
        flexShrink={0}
        boxShadow="sm"
      >
        <Icon as={icon} color={`${accent}.500`} boxSize={3.5} />
      </Flex>
      <Box minW={0}>
        <Text fontSize="10px" color={labelColor} fontWeight="semibold">
          {label}
        </Text>
        <Text fontSize="sm" fontWeight="bold" color={valueColor} noOfLines={1}>
          {value}
        </Text>
      </Box>
    </Flex>
  );
}

function GroupCardContent({ group, gradeName, onEdit, onDelete }) {
  const days = field(group, "days") || [];
  const paused = field(group, "status") === "paused";
  const accentBar = paused ? "orange.400" : "blue.500";
  const muted = useColorModeValue("gray.500", "gray.400");
  const dayBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const dayColor = useColorModeValue("blue.700", "blue.200");

  return (
    <>
      <Box
        h="3px"
        bg={accentBar}
        borderTopRadius="2xl"
        mx={{ base: -4, md: -5 }}
        mt={{ base: -4, md: -5 }}
        mb={3}
      />

      <Flex justify="space-between" align="flex-start" gap={3} mb={3}>
        <HStack spacing={3} align="flex-start" minW={0} flex={1}>
          <Flex
            w={10}
            h={10}
            borderRadius="xl"
            bg={paused ? "orange.50" : "blue.50"}
            _dark={{ bg: "whiteAlpha.100" }}
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Icon as={FaLayerGroup} color={paused ? "orange.500" : "blue.500"} boxSize={4} />
          </Flex>
          <Box minW={0}>
            <Text
              fontWeight="black"
              fontSize="md"
              color={ACCENT}
              noOfLines={2}
              lineHeight="1.4"
            >
              {field(group, "name")}
            </Text>
            {gradeName ? (
              <HStack spacing={1} mt={1} color={muted} fontSize="xs">
                <Icon as={FaGraduationCap} boxSize={3} />
                <Text noOfLines={1}>{gradeName}</Text>
              </HStack>
            ) : null}
          </Box>
        </HStack>
        <HStack spacing={2} flexShrink={0}>
          <StatusBadge scheme={paused ? "orange" : "green"}>
            {paused ? "متوقفة" : "نشطة"}
          </StatusBadge>
          <Icon as={FaChevronLeft} color={muted} boxSize={3} />
        </HStack>
      </Flex>

      {days.length > 0 ? (
        <Wrap spacing={1.5} mb={3}>
          {days.map((d) => (
            <WrapItem key={d}>
              <Badge
                bg={dayBg}
                color={dayColor}
                borderRadius="full"
                px={2.5}
                py={0.5}
                fontSize="10px"
                fontWeight="bold"
              >
                {d}
              </Badge>
            </WrapItem>
          ))}
        </Wrap>
      ) : (
        <Text fontSize="xs" color={muted} mb={3}>
          لم تُحدَّد أيام الحضور
        </Text>
      )}

      <SimpleGrid columns={3} spacing={2} mb={4}>
        <GroupMeta
          icon={FaUsers}
          label="الطلاب"
          value={field(group, "students_count", "studentsCount") ?? "0"}
          accent="teal"
        />
        <GroupMeta
          icon={FaClock}
          label="الوقت"
          value={`${field(group, "start_time", "startTime") || "—"} – ${field(group, "end_time", "endTime") || "—"}`}
          accent="blue"
        />
        <GroupMeta
          icon={FaMoneyBillWave}
          label="الاشتراك"
          value={formatMoney(field(group, "monthly_fee", "monthlyFee"))}
          accent="orange"
        />
      </SimpleGrid>

      <Flex gap={2} onClick={(e) => e.stopPropagation()}>
        <IconButton
          aria-label="تعديل"
          icon={<FaEdit />}
          size="sm"
          variant="outline"
          borderRadius="xl"
          onClick={() => onEdit(group)}
        />
        <IconButton
          aria-label="حذف"
          icon={<FaTrash />}
          size="sm"
          variant="outline"
          colorScheme="red"
          borderRadius="xl"
          onClick={() => onDelete(group)}
        />
      </Flex>
    </>
  );
}

export default function GroupsPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      page,
      limit: 20,
    }),
    [debouncedSearch, statusFilter, page],
  );

  const { data: grades = [] } = usePlatformGrades();
  const { data, isLoading } = useGroups(params);
  const groups = data?.items || [];
  const { createGroup, updateGroup, deleteGroup } = useGroupMutations();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const gradeMap = useMemo(() => {
    const map = new Map();
    grades.forEach((g) => map.set(String(g.id), field(g, "name")));
    return map;
  }, [grades]);

  const stats = useMemo(() => {
    const active = groups.filter((g) => field(g, "status") !== "paused").length;
    const paused = groups.length - active;
    const students = groups.reduce(
      (sum, g) => sum + (Number(field(g, "students_count", "studentsCount")) || 0),
      0,
    );
    return {
      total: data?.total ?? groups.length,
      active,
      paused,
      students,
    };
  }, [groups, data?.total]);

  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    onOpen();
  };

  const openEdit = (group) => {
    setEditing(group);
    setForm({
      name: field(group, "name") || "",
      grade_id: String(field(group, "grade_id", "gradeId") || ""),
      subject_id: String(field(group, "subject_id", "subjectId") || ""),
      days: field(group, "days") || [],
      start_time: field(group, "start_time", "startTime") || "16:00",
      end_time: field(group, "end_time", "endTime") || "18:00",
      monthly_fee: Number(field(group, "monthly_fee", "monthlyFee") ?? 300),
      status: field(group, "status") || "active",
      notes: field(group, "notes") || "",
    });
    onOpen();
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.days.length || form.monthly_fee === "" || form.monthly_fee == null) {
      toast({ title: "الاسم والأيام وقيمة الاشتراك مطلوبة", status: "warning", duration: 2500 });
      return;
    }
    const payload = {
      name: form.name.trim(),
      days: form.days,
      monthly_fee: Number(form.monthly_fee) || 0,
      grade_id: form.grade_id ? Number(form.grade_id) : null,
      subject_id: form.subject_id ? Number(form.subject_id) : null,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      status: form.status,
      notes: form.notes || null,
    };
    try {
      if (editing) {
        await updateGroup.mutateAsync({ groupId: editing.id, payload });
        toast({ title: "تم تحديث المجموعة", status: "success", duration: 2000 });
      } else {
        await createGroup.mutateAsync(payload);
        toast({ title: "تم إنشاء المجموعة", status: "success", duration: 2000 });
      }
      onClose();
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  const handleDelete = async (group) => {
    if (!window.confirm(`حذف المجموعة "${field(group, "name")}"؟`)) return;
    try {
      await deleteGroup.mutateAsync(group.id);
      toast({ title: "تم حذف المجموعة", status: "success", duration: 2000 });
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  const openGroup = (groupId) => {
    navigate(`/center-mgmt/groups/${groupId}`);
  };

  const rowActions = (group) => (
    <Flex gap={1} justify="flex-end" onClick={(e) => e.stopPropagation()}>
      <IconButton
        aria-label="تعديل"
        icon={<FaEdit />}
        size="sm"
        variant="ghost"
        borderRadius="lg"
        onClick={() => openEdit(group)}
      />
      <IconButton
        aria-label="حذف"
        icon={<FaTrash />}
        size="sm"
        variant="ghost"
        colorScheme="red"
        borderRadius="lg"
        onClick={() => handleDelete(group)}
      />
    </Flex>
  );

  const modalHintBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const modalHintBorder = useColorModeValue("blue.100", "blue.800");
  const tableHeadBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const tableRowHoverBg = useColorModeValue("blue.50", "whiteAlpha.50");

  return (
    <>
      <PageHeader
        title="المجموعات"
        description="أنشئ مجموعات دراسية بأيام الحضور، المواعيد، وقيمة الاشتراك الشهري."
        actions={
          <PrimaryButton leftIcon={<FaPlus />} onClick={openCreate} size={{ base: "sm", md: "md" }}>
            مجموعة جديدة
          </PrimaryButton>
        }
      />

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 2.5, md: 4 }} mb={{ base: 4, md: 5 }}>
        <KpiCard label="إجمالي المجموعات" value={stats.total} icon={FaLayerGroup} color="teal" />
        <KpiCard label="نشطة (الصفحة)" value={stats.active} icon={FaUsers} color="blue" />
        <KpiCard label="متوقفة (الصفحة)" value={stats.paused} icon={FaClock} color="orange" />
        <KpiCard
          label="طلاب (الصفحة)"
          value={stats.students}
          icon={FaGraduationCap}
          color="purple"
        />
      </SimpleGrid>

      <FilterBar>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray" />
            </InputLeftElement>
            <Input
              placeholder="بحث باسم المجموعة..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              borderRadius="xl"
              bg="white"
              _dark={{ bg: "gray.800" }}
            />
          </InputGroup>
          <Select
            placeholder="كل الحالات"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            borderRadius="xl"
          >
            <option value="active">نشطة</option>
            <option value="paused">متوقفة</option>
          </Select>
        </SimpleGrid>
      </FilterBar>

      {isLoading ? (
        <LoadingBlock label="جاري تحميل المجموعات..." />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={FaUsers}
          title="لا توجد مجموعات"
          description={
            debouncedSearch || statusFilter
              ? "جرّب تغيير معايير البحث أو الفلتر."
              : "ابدأ بإنشاء أول مجموعة دراسية وتسجيل الطلاب فيها."
          }
          action={
            !debouncedSearch && !statusFilter ? (
              <PrimaryButton leftIcon={<FaPlus />} onClick={openCreate}>
                إنشاء مجموعة
              </PrimaryButton>
            ) : null
          }
        />
      ) : (
        <>
          <MobileOnly>
            <VStack spacing={3} align="stretch">
              {groups.map((group) => (
                <ListCard
                  key={group.id}
                  p={{ base: 4, md: 5 }}
                  onClick={() => openGroup(group.id)}
                  cursor="pointer"
                  title="اضغط لفتح المجموعة"
                >
                  <GroupCardContent
                    group={group}
                    gradeName={gradeMap.get(String(field(group, "grade_id", "gradeId") || ""))}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                </ListCard>
              ))}
            </VStack>
          </MobileOnly>

          <DesktopOnly>
            <Surface p={0} overflow="hidden">
              <TableContainer>
                <Table size="md">
                  <Thead bg={tableHeadBg}>
                    <Tr>
                      <Th>المجموعة</Th>
                      <Th>الأيام</Th>
                      <Th>الوقت</Th>
                      <Th>الاشتراك</Th>
                      <Th isNumeric>الطلاب</Th>
                      <Th>الحالة</Th>
                      <Th w="88px"></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {groups.map((group) => {
                      const days = field(group, "days") || [];
                      const paused = field(group, "status") === "paused";
                      const gradeName = gradeMap.get(String(field(group, "grade_id", "gradeId") || ""));
                      return (
                        <Tr
                          key={group.id}
                          _hover={{ bg: tableRowHoverBg }}
                          cursor="pointer"
                          onClick={() => openGroup(group.id)}
                          title="اضغط لفتح المجموعة"
                        >
                          <Td>
                            <VStack align="flex-start" spacing={0.5}>
                              <Text fontWeight="bold" color={ACCENT}>
                                {field(group, "name")}
                              </Text>
                              {gradeName ? (
                                <Text fontSize="xs" color="gray.500">
                                  {gradeName}
                                </Text>
                              ) : null}
                            </VStack>
                          </Td>
                          <Td maxW="220px">
                            <Wrap spacing={1}>
                              {days.slice(0, 4).map((d) => (
                                <WrapItem key={d}>
                                  <Badge variant="subtle" colorScheme="blue" borderRadius="md" fontSize="10px">
                                    {d}
                                  </Badge>
                                </WrapItem>
                              ))}
                              {days.length > 4 ? (
                                <WrapItem>
                                  <Badge variant="subtle" borderRadius="md" fontSize="10px">
                                    +{days.length - 4}
                                  </Badge>
                                </WrapItem>
                              ) : null}
                            </Wrap>
                          </Td>
                          <Td whiteSpace="nowrap" fontSize="sm">
                            {field(group, "start_time", "startTime") || "—"} –{" "}
                            {field(group, "end_time", "endTime") || "—"}
                          </Td>
                          <Td fontWeight="semibold" whiteSpace="nowrap">
                            {formatMoney(field(group, "monthly_fee", "monthlyFee"))}
                          </Td>
                          <Td isNumeric fontWeight="bold">
                            {field(group, "students_count", "studentsCount") ?? 0}
                          </Td>
                          <Td>
                            <StatusBadge scheme={paused ? "orange" : "green"}>
                              {paused ? "متوقفة" : "نشطة"}
                            </StatusBadge>
                          </Td>
                          <Td onClick={(e) => e.stopPropagation()}>
                            {rowActions(group)}
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </Surface>
          </DesktopOnly>
        </>
      )}

      <PaginationBar
        page={page}
        totalPages={data?.totalPages || 1}
        onPrev={() => setPage((p) => p - 1)}
        onNext={() => setPage((p) => p + 1)}
      />

      <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "xl" }} isCentered scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent dir="rtl" borderRadius={{ base: "none", md: "2xl" }} m={0}>
          <Box h="3px" bgGradient="linear(to-l, blue.500, orange.500)" borderTopRadius="2xl" />
          <ModalHeader pb={2}>
            {editing ? "تعديل المجموعة" : "مجموعة جديدة"}
            <Text fontSize="sm" fontWeight="normal" color="gray.500" mt={1}>
              حدّد أيام الحضور والمواعيد وقيمة الاشتراك الشهري.
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pt={2}>
            <VStack spacing={5} align="stretch">
              <FormControl isRequired>
                <FormLabel fontWeight="semibold">اسم المجموعة</FormLabel>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  borderRadius="xl"
                  placeholder="مثال: مجموعة الصف الثالث — مساء"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="semibold">أيام الحضور</FormLabel>
                <Box
                  p={3}
                  borderRadius="xl"
                  bg={modalHintBg}
                  borderWidth="1px"
                  borderColor={modalHintBorder}
                >
                  <Wrap spacing={2}>
                    {WEEK_DAYS.map((day) => (
                      <WrapItem key={day}>
                        <DayPill
                          day={day}
                          selected={form.days.includes(day)}
                          onToggle={toggleDay}
                        />
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>
                {form.days.length > 0 ? (
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    {form.days.length} يوم محدد
                  </Text>
                ) : null}
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontWeight="semibold">قيمة الاشتراك</FormLabel>
                  <NumberInput
                    value={form.monthly_fee}
                    min={0}
                    onChange={(_, n) =>
                      setForm((f) => ({ ...f, monthly_fee: Number.isNaN(n) ? 0 : n }))
                    }
                  >
                    <NumberInputField borderRadius="xl" />
                  </NumberInput>
                </FormControl>
                <FormControl>
                  <FormLabel fontWeight="semibold">من</FormLabel>
                  <Input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                    borderRadius="xl"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontWeight="semibold">إلى</FormLabel>
                  <Input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                    borderRadius="xl"
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel fontWeight="semibold">الصف (اختياري)</FormLabel>
                  <Select
                    placeholder="بدون صف"
                    value={form.grade_id}
                    onChange={(e) => setForm((f) => ({ ...f, grade_id: e.target.value }))}
                    borderRadius="xl"
                  >
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {field(g, "name")}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontWeight="semibold">الحالة</FormLabel>
                  <Select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    borderRadius="xl"
                  >
                    <option value="active">نشطة</option>
                    <option value="paused">متوقفة</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel fontWeight="semibold">ملاحظات</FormLabel>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  borderRadius="xl"
                  rows={3}
                  placeholder="ملاحظات داخلية عن المجموعة..."
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2} flexDir={{ base: "column-reverse", md: "row" }}>
            <Button variant="ghost" onClick={onClose} borderRadius="xl" w={{ base: "full", md: "auto" }}>
              إلغاء
            </Button>
            <PrimaryButton
              onClick={handleSave}
              isLoading={createGroup.isPending || updateGroup.isPending}
              w={{ base: "full", md: "auto" }}
            >
              {editing ? "حفظ التعديلات" : "إنشاء المجموعة"}
            </PrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
