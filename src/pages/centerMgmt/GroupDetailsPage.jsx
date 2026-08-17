import { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
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
  FaArrowRight,
  FaCalendarAlt,
  FaChevronLeft,
  FaClipboardList,
  FaClock,
  FaFilePdf,
  FaLayerGroup,
  FaMoneyBillWave,
  FaPlus,
  FaUserGraduate,
  FaUsers,
} from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import {
  useGroup,
  useGroupExamMutations,
  useGroupExams,
  useGroupStudents,
  useStudentMutations,
} from "../../Hooks/centerMgmt/useCenterMgmtQueries";
import { apiErrorMessage } from "../../api/centerMgmtApi";
import {
  ACCENT,
  SUBSCRIPTION_LABELS,
  field,
  formatDate,
  formatMoney,
  studentCode,
  studentName,
  todayISO,
} from "./centerMgmtUtils";
import {
  DesktopOnly,
  EmptyState,
  KpiCard,
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

const emptyExam = {
  title: "",
  total_grade: 50,
  exam_date: todayISO(),
};

function SectionHead({ icon, title, count, action }) {
  const titleColor = useColorModeValue("gray.900", "white");
  const line = useColorModeValue("gray.200", "gray.700");

  return (
    <Flex justify="space-between" align="center" gap={3} mb={4} flexWrap="wrap">
      <HStack spacing={2.5} minW={0}>
        <Flex
          w={9}
          h={9}
          borderRadius="lg"
          bg="blue.50"
          _dark={{ bg: "whiteAlpha.100" }}
          align="center"
          justify="center"
          flexShrink={0}
        >
          <Icon as={icon} color={ACCENT} boxSize={4} />
        </Flex>
        <Text fontWeight="black" fontSize="md" color={titleColor}>
          {title}
        </Text>
        {count != null ? (
          <Badge colorScheme="blue" borderRadius="full" px={2.5} fontSize="xs">
            {count}
          </Badge>
        ) : null}
        <Box flex={1} h="1px" bg={line} display={{ base: "none", md: "block" }} minW={8} />
      </HStack>
      {action}
    </Flex>
  );
}

function ExamListItem({ exam, studentsCount, onOpen }) {
  const total = field(exam, "total_grade", "totalGrade");
  const recorded = field(exam, "recorded_count", "recordedCount");
  const studentsTotal = field(exam, "students_count", "studentsCount") ?? studentsCount;
  const muted = useColorModeValue("gray.500", "gray.400");
  const dayBg = useColorModeValue("purple.50", "whiteAlpha.100");
  const dayColor = useColorModeValue("purple.700", "purple.200");

  return (
    <ListCard onClick={() => onOpen(exam)} cursor="pointer" title="اضغط لرصد الدرجات" p={4}>
      <Box h="3px" bg="purple.400" borderTopRadius="2xl" mx={-4} mt={-4} mb={3} />
      <Flex justify="space-between" align="flex-start" gap={3}>
        <HStack spacing={3} align="flex-start" minW={0} flex={1}>
          <Flex
            w={10}
            h={10}
            borderRadius="xl"
            bg={dayBg}
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Icon as={FaClipboardList} color="purple.500" boxSize={4} />
          </Flex>
          <Box minW={0}>
            <Text fontWeight="black" fontSize="md" color={ACCENT} noOfLines={2} lineHeight="1.4">
              {field(exam, "title")}
            </Text>
            <HStack spacing={2} mt={1.5} fontSize="xs" color={muted} flexWrap="wrap">
              <HStack spacing={1}>
                <Icon as={FaCalendarAlt} boxSize={3} />
                <Text>{formatDate(field(exam, "exam_date", "examDate"))}</Text>
              </HStack>
              <Text>·</Text>
              <Text>من {total ?? "—"}</Text>
              {recorded != null ? (
                <>
                  <Text>·</Text>
                  <Badge bg={dayBg} color={dayColor} borderRadius="full" fontSize="10px">
                    مُرصد {recorded}/{studentsTotal}
                  </Badge>
                </>
              ) : null}
            </HStack>
          </Box>
        </HStack>
        <Icon as={FaChevronLeft} color={muted} boxSize={3} mt={2} flexShrink={0} />
      </Flex>
    </ListCard>
  );
}

function StudentListItem({ student, onOpen }) {
  const muted = useColorModeValue("gray.500", "gray.400");
  const phoneBg = useColorModeValue("gray.50", "whiteAlpha.50");

  return (
    <ListCard onClick={() => onOpen(student.id)} cursor="pointer" title="اضغط لفتح ملف الطالب" p={4}>
      <Flex justify="space-between" align="flex-start" gap={3} mb={2}>
        <HStack spacing={3} align="flex-start" minW={0}>
          <Flex
            w={10}
            h={10}
            borderRadius="xl"
            bg="blue.50"
            _dark={{ bg: "whiteAlpha.100" }}
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Icon as={FaUserGraduate} color="blue.500" boxSize={4} />
          </Flex>
          <Box minW={0}>
            <Text fontWeight="black" noOfLines={1} fontSize="md">
              {studentName(student)}
            </Text>
            <Text fontSize="xs" fontFamily="mono" color={muted} mt={0.5}>
              {studentCode(student)}
            </Text>
          </Box>
        </HStack>
        <Icon as={FaChevronLeft} color={muted} boxSize={3} mt={2} flexShrink={0} />
      </Flex>
      <SimpleGrid columns={2} spacing={2}>
        <Box p={2} borderRadius="lg" bg={phoneBg} fontSize="xs">
          <Text color={muted}>الهاتف</Text>
          <Text fontWeight="semibold" noOfLines={1}>
            {field(student, "phone") || "—"}
          </Text>
        </Box>
        <Box p={2} borderRadius="lg" bg={phoneBg} fontSize="xs">
          <Text color={muted}>ولي الأمر</Text>
          <Text fontWeight="semibold" noOfLines={1}>
            {field(student, "parent_phone", "parentPhone") || "—"}
          </Text>
        </Box>
      </SimpleGrid>
    </ListCard>
  );
}

export default function GroupDetailsPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: group, isLoading: loadingGroup } = useGroup(groupId);
  const { data: students = [], isLoading: loadingStudents } = useGroupStudents(groupId);
  const { data: exams = [], isLoading: loadingExams } = useGroupExams(groupId);
  const { addStudentToGroup } = useStudentMutations();
  const { createExam } = useGroupExamMutations();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isExamOpen, onOpen: onExamOpen, onClose: onExamClose } = useDisclosure();
  const [form, setForm] = useState(emptyStudent);
  const [examForm, setExamForm] = useState(emptyExam);
  const [studentSearch, setStudentSearch] = useState("");
  const [exportingCards, setExportingCards] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });

  const heroBorder = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.900", "white");
  const dayBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const dayColor = useColorModeValue("blue.700", "blue.200");
  const tableHeadBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const tableRowHover = useColorModeValue("blue.50", "whiteAlpha.50");
  const searchInputBg = useColorModeValue("gray.50", "whiteAlpha.50");

  const filteredStudents = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) return students;
    return students.filter((s) => {
      const name = studentName(s).toLowerCase();
      const code = studentCode(s).toLowerCase();
      const phone = String(field(s, "phone") || "").toLowerCase();
      const parent = String(field(s, "parent_phone", "parentPhone") || "").toLowerCase();
      return name.includes(term) || code.includes(term) || phone.includes(term) || parent.includes(term);
    });
  }, [students, studentSearch]);

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
        field(group, "grade_name", "gradeName") || field(group?.grade, "name") || "";
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

  if (loadingGroup) return <LoadingBlock label="جاري تحميل المجموعة..." />;
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
  const gradeName =
    field(group, "grade_name", "gradeName") || field(group?.grade, "name") || null;

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

  const handleCreateExam = async () => {
    if (!examForm.title.trim()) {
      toast({ title: "عنوان الامتحان مطلوب", status: "warning", duration: 2500 });
      return;
    }
    if (!examForm.total_grade && examForm.total_grade !== 0) {
      toast({ title: "الدرجة الكلية مطلوبة", status: "warning", duration: 2500 });
      return;
    }
    try {
      const result = await createExam.mutateAsync({
        groupId,
        payload: {
          title: examForm.title.trim(),
          total_grade: Number(examForm.total_grade) || 0,
          exam_date: examForm.exam_date || todayISO(),
        },
      });
      toast({ title: "تم إنشاء الامتحان", status: "success", duration: 2000 });
      setExamForm(emptyExam);
      onExamClose();
      const newExamId = field(result, "id") ?? field(result, "exam_id", "examId");
      if (newExamId) navigate(`/center-mgmt/groups/${groupId}/exams/${newExamId}`);
    } catch (err) {
      toast({ title: apiErrorMessage(err), status: "error", duration: 3000 });
    }
  };

  const openStudent = (id) => navigate(`/center-mgmt/students/${id}`);
  const openExamGrades = (exam) => navigate(`/center-mgmt/groups/${groupId}/exams/${exam.id}`);

  return (
    <Box>
      <PageHeader
        title={field(group, "name")}
        description="إدارة الطلاب، الامتحانات، ورصد الدرجات في مكان واحد"
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
                    ? `${exportProgress.current}/${exportProgress.total}`
                    : "جاري..."
                }
              >
                كروت PDF
              </Button>
            ) : null}
            <PrimaryButton leftIcon={<FaPlus />} onClick={onOpen} size={{ base: "sm", md: "md" }}>
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

      {/* Hero */}
      <Surface p={0} overflow="hidden" mb={5} borderColor={heroBorder}>
        <Box h="4px" bgGradient="linear(to-l, blue.500, orange.500)" />
        <Box p={{ base: 4, md: 5 }}>
          <Flex justify="space-between" align="flex-start" gap={4} flexWrap="wrap" mb={4}>
            <HStack spacing={4} align="flex-start" minW={0}>
              <Flex
                w={{ base: 12, md: 14 }}
                h={{ base: 12, md: 14 }}
                borderRadius="2xl"
                bgGradient="linear(135deg, blue.500, orange.500)"
                align="center"
                justify="center"
                flexShrink={0}
                boxShadow="md"
              >
                <Icon as={FaLayerGroup} color="white" boxSize={{ base: 5, md: 6 }} />
              </Flex>
              <Box minW={0}>
                <HStack spacing={2} mb={1.5} flexWrap="wrap">
                  <StatusBadge scheme={paused ? "orange" : "green"}>
                    {paused ? "متوقفة" : "نشطة"}
                  </StatusBadge>
                  {gradeName ? (
                    <Badge colorScheme="gray" borderRadius="full" px={2.5} fontSize="xs">
                      {gradeName}
                    </Badge>
                  ) : null}
                </HStack>
                <Text fontWeight="black" fontSize={{ base: "lg", md: "xl" }} color={titleColor} noOfLines={2}>
                  {field(group, "name")}
                </Text>
                {field(group, "notes") ? (
                  <Text fontSize="sm" color={muted} mt={1} noOfLines={2}>
                    {field(group, "notes")}
                  </Text>
                ) : null}
              </Box>
            </HStack>
            <HStack spacing={2} fontSize="sm" color={muted} flexWrap="wrap">
              <Icon as={FaClock} />
              <Text fontWeight="semibold" color={titleColor}>
                {field(group, "start_time", "startTime") || "—"} –{" "}
                {field(group, "end_time", "endTime") || "—"}
              </Text>
            </HStack>
          </Flex>

          {days.length > 0 ? (
            <Wrap spacing={2}>
              {days.map((d) => (
                <WrapItem key={d}>
                  <Badge
                    bg={dayBg}
                    color={dayColor}
                    borderRadius="full"
                    px={3}
                    py={1}
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    {d}
                  </Badge>
                </WrapItem>
              ))}
            </Wrap>
          ) : (
            <Text fontSize="sm" color={muted}>
              لم تُحدَّد أيام الحضور
            </Text>
          )}
        </Box>
      </Surface>

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 2.5, md: 4 }} mb={5}>
        <KpiCard label="الطلاب" value={students.length} icon={FaUsers} color="blue" />
        <KpiCard
          label="الامتحانات"
          value={exams.length}
          icon={FaClipboardList}
          color="purple"
        />
        <KpiCard
          label="الاشتراك الشهري"
          value={formatMoney(field(group, "monthly_fee", "monthlyFee"))}
          icon={FaMoneyBillWave}
          color="orange"
        />
        <KpiCard
          label="موعد المجموعة"
          value={`${field(group, "start_time", "startTime") || "—"} – ${field(group, "end_time", "endTime") || "—"}`}
          icon={FaClock}
          color="teal"
        />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={{ base: 4, md: 5 }} alignItems="start">
        {/* Exams */}
        <Surface>
          <SectionHead
            icon={FaClipboardList}
            title="امتحانات المجموعة"
            count={exams.length}
            action={
              <PrimaryButton
                size="sm"
                leftIcon={<FaPlus />}
                onClick={() => {
                  setExamForm({ ...emptyExam, exam_date: todayISO() });
                  onExamOpen();
                }}
              >
                امتحان جديد
              </PrimaryButton>
            }
          />

          {loadingExams ? (
            <LoadingBlock label="جاري تحميل الامتحانات..." />
          ) : exams.length === 0 ? (
            <Box py={6} textAlign="center">
              <Icon as={FaClipboardList} boxSize={8} color="purple.300" mb={3} />
              <Text fontWeight="bold" mb={1}>
                لا توجد امتحانات
              </Text>
              <Text fontSize="sm" color={muted} mb={4}>
                أنشئ امتحاناً وارصد درجات الطلاب
              </Text>
              <PrimaryButton size="sm" leftIcon={<FaPlus />} onClick={onExamOpen}>
                إضافة امتحان
              </PrimaryButton>
            </Box>
          ) : (
            <VStack spacing={3} align="stretch">
              {exams.map((exam) => (
                <ExamListItem
                  key={exam.id}
                  exam={exam}
                  studentsCount={students.length}
                  onOpen={openExamGrades}
                />
              ))}
            </VStack>
          )}
        </Surface>

        {/* Students */}
        <Surface>
          <SectionHead
            icon={FaUserGraduate}
            title="طلاب المجموعة"
            count={students.length}
            action={
              students.length > 0 ? (
                <Button
                  leftIcon={<FaFilePdf />}
                  size="sm"
                  variant="outline"
                  colorScheme="orange"
                  borderRadius="xl"
                  onClick={handleExportCardsPdf}
                  isLoading={exportingCards}
                >
                  PDF
                </Button>
              ) : null
            }
          />

          {loadingStudents ? (
            <LoadingBlock />
          ) : students.length === 0 ? (
            <Box py={6} textAlign="center">
              <Icon as={FaUserGraduate} boxSize={8} color="blue.300" mb={3} />
              <Text fontWeight="bold" mb={1}>
                لا يوجد طلاب
              </Text>
              <Text fontSize="sm" color={muted} mb={4}>
                أضف طلاباً ليُنشأ لهم QR تلقائياً
              </Text>
              <PrimaryButton onClick={onOpen}>إضافة طالب</PrimaryButton>
            </Box>
          ) : (
            <>
              <Box mb={4}>
                <Flex direction={{ base: "column", sm: "row" }} gap={3} align="center">
                  <InputGroup flex={1}>
                    <InputLeftElement pointerEvents="none">
                      <FiSearch color="gray" />
                    </InputLeftElement>
                    <Input
                      placeholder="بحث بالاسم أو الكود أو الهاتف..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      borderRadius="xl"
                      bg={searchInputBg}
                      borderColor={heroBorder}
                    />
                  </InputGroup>
                  <Text fontSize="sm" color={muted} flexShrink={0}>
                    {studentSearch.trim()
                      ? `${filteredStudents.length} من ${students.length}`
                      : `${students.length} طالب`}
                  </Text>
                </Flex>
              </Box>

              {filteredStudents.length === 0 ? (
                <EmptyState
                  title="لا توجد نتائج"
                  description="جرّب كلمة بحث مختلفة"
                  action={
                    <Button variant="ghost" borderRadius="xl" onClick={() => setStudentSearch("")}>
                      مسح البحث
                    </Button>
                  }
                />
              ) : (
                <>
                  <MobileOnly>
                    <VStack spacing={3} align="stretch">
                      {filteredStudents.map((s) => (
                        <StudentListItem key={s.id} student={s} onOpen={openStudent} />
                      ))}
                    </VStack>
                  </MobileOnly>

                  <DesktopOnly>
                    <TableContainer borderRadius="xl" borderWidth="1px" borderColor={heroBorder}>
                      <Table size="sm">
                        <Thead bg={tableHeadBg}>
                          <Tr>
                            <Th>الطالب</Th>
                            <Th>الهاتف</Th>
                            <Th>ولي الأمر</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {filteredStudents.map((s) => (
                            <Tr
                              key={s.id}
                              cursor="pointer"
                              _hover={{ bg: tableRowHover }}
                              onClick={() => openStudent(s.id)}
                              title="اضغط لفتح ملف الطالب"
                            >
                              <Td>
                                <Text fontWeight="bold">{studentName(s)}</Text>
                                <Text fontSize="xs" fontFamily="mono" color={muted}>
                                  {studentCode(s)}
                                </Text>
                              </Td>
                              <Td>{field(s, "phone") || "—"}</Td>
                              <Td>{field(s, "parent_phone", "parentPhone") || "—"}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </DesktopOnly>
                </>
              )}
            </>
          )}
        </Surface>
      </SimpleGrid>

      {/* Add student modal */}
      <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "lg" }} isCentered scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent dir="rtl" borderRadius={{ base: "none", md: "2xl" }} m={0}>
          <Box h="3px" bgGradient="linear(to-l, blue.500, orange.500)" borderTopRadius="2xl" />
          <ModalHeader>إضافة طالب للمجموعة</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color={muted}>
                سيُنشأ للطالب QR تلقائياً بعد الإضافة.
              </Text>
              <FormControl isRequired>
                <FormLabel fontWeight="semibold">الاسم الكامل</FormLabel>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  borderRadius="xl"
                />
              </FormControl>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontWeight="semibold">هاتف الطالب</FormLabel>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    borderRadius="xl"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontWeight="semibold">هاتف ولي الأمر</FormLabel>
                  <Input
                    value={form.parent_phone}
                    onChange={(e) => setForm((f) => ({ ...f, parent_phone: e.target.value }))}
                    borderRadius="xl"
                  />
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel fontWeight="semibold">حالة دفع الشهر الحالي</FormLabel>
                <Select
                  value={form.payment_status}
                  onChange={(e) => setForm((f) => ({ ...f, payment_status: e.target.value }))}
                  borderRadius="xl"
                >
                  {Object.entries(SUBSCRIPTION_LABELS).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
              {form.payment_status === "partial" && (
                <FormControl>
                  <FormLabel fontWeight="semibold">المبلغ المدفوع</FormLabel>
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
                  <FormLabel fontWeight="semibold">سبب الإعفاء</FormLabel>
                  <Input
                    value={form.exemption_reason}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, exemption_reason: e.target.value }))
                    }
                    borderRadius="xl"
                  />
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter gap={2} flexDir={{ base: "column-reverse", md: "row" }}>
            <Button variant="ghost" onClick={onClose} borderRadius="xl" w={{ base: "full", md: "auto" }}>
              إلغاء
            </Button>
            <PrimaryButton
              onClick={handleAdd}
              isLoading={addStudentToGroup.isPending}
              w={{ base: "full", md: "auto" }}
            >
              إضافة الطالب
            </PrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* New exam modal */}
      <Modal isOpen={isExamOpen} onClose={onExamClose} size={{ base: "full", md: "md" }} isCentered>
        <ModalOverlay backdropFilter="blur(6px)" />
        <ModalContent dir="rtl" borderRadius={{ base: "none", md: "2xl" }} m={0}>
          <Box h="3px" bgGradient="linear(to-l, blue.500, orange.500)" borderTopRadius="2xl" />
          <ModalHeader>امتحان جديد</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color={muted}>
                يمكنك إنشاء الامتحان الآن ورصد الدرجات لاحقاً.
              </Text>
              <FormControl isRequired>
                <FormLabel fontWeight="semibold">عنوان الامتحان</FormLabel>
                <Input
                  value={examForm.title}
                  onChange={(e) => setExamForm((f) => ({ ...f, title: e.target.value }))}
                  borderRadius="xl"
                  placeholder="امتحان الدرس الأول"
                />
              </FormControl>
              <SimpleGrid columns={2} spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontWeight="semibold">الدرجة الكلية</FormLabel>
                  <NumberInput
                    min={1}
                    value={examForm.total_grade}
                    onChange={(_, n) =>
                      setExamForm((f) => ({
                        ...f,
                        total_grade: Number.isNaN(n) ? "" : n,
                      }))
                    }
                  >
                    <NumberInputField borderRadius="xl" />
                  </NumberInput>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontWeight="semibold">تاريخ الامتحان</FormLabel>
                  <Input
                    type="date"
                    value={examForm.exam_date}
                    onChange={(e) =>
                      setExamForm((f) => ({ ...f, exam_date: e.target.value }))
                    }
                    borderRadius="xl"
                  />
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2} flexDir={{ base: "column-reverse", md: "row" }}>
            <Button variant="ghost" onClick={onExamClose} borderRadius="xl">
              إلغاء
            </Button>
            <PrimaryButton onClick={handleCreateExam} isLoading={createExam.isPending}>
              إنشاء والانتقال للرصد
            </PrimaryButton>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
