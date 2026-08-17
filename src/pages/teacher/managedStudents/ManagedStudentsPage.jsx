import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  useColorModeValue,
  Icon,
  Badge,
  VStack,
  HStack,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useDisclosure,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Spinner,
  Code,
} from "@chakra-ui/react";
import {
  FaUsers,
  FaPlus,
  FaFileImport,
  FaEllipsisV,
  FaKey,
  FaTrash,
  FaEdit,
  FaSync,
  FaShareAlt,
  FaCopy,
  FaMobileAlt,
} from "react-icons/fa";
import { FiSearch, FiUserCheck } from "react-icons/fi";
import BrandLoadingScreen from "../../../components/loading/BrandLoadingScreen";
import UserType from "../../../Hooks/auth/userType";
import {
  fetchManagedStudents,
  createManagedStudent,
  updateManagedStudent,
  deleteManagedStudent,
  resetManagedStudentPassword,
  updateManagedStudentStatus,
  importManagedStudentsCsv,
  fetchTeacherGrades,
  fetchTeacherStudyGroups,
  apiErrorMessage,
} from "../../../api/teacherManagedStudentsApi";
import { resetStudentDevice } from "../../../api/deviceRestrictionApi";
import RegistrationSettingsCard from "./components/RegistrationSettingsCard";
import DeviceRestrictionSettingsCard from "./components/DeviceRestrictionSettingsCard";
import StudentFormModal from "./components/StudentFormModal";
import CredentialsModal from "./components/CredentialsModal";
import ImportCsvModal from "./components/ImportCsvModal";
import { formatStudentCode, isTeacherRegistrationMode } from "./managedStudentsUtils";

const ACCENT = "#0056b3";

function KpiCard({ label, value, sub, icon }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.800", "white");

  return (
    <Box p={5} bg={bg} borderRadius="xl" borderWidth="1px" borderColor={border}>
      <Flex justify="space-between" align="flex-start" gap={3}>
        <Box>
          <Text fontSize="xs" color="gray.500" mb={1}>
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color={titleColor}>
            {value}
          </Text>
          {sub && (
            <Text fontSize="xs" color="gray.400" mt={1}>
              {sub}
            </Text>
          )}
        </Box>
        <Flex w={10} h={10} borderRadius="lg" bg="blue.50" align="center" justify="center" flexShrink={0}>
          <Icon as={icon} color="blue.600" boxSize={4} />
        </Flex>
      </Flex>
    </Box>
  );
}

const statusMeta = {
  active: { label: "نشط", scheme: "green" },
  inactive: { label: "غير نشط", scheme: "gray" },
  suspended: { label: "موقوف", scheme: "red" },
};

const ManagedStudentsPage = () => {
  const toast = useToast();
  const [, , isTeacher] = UserType();

  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 1 });
  const [grades, setGrades] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registrationMode, setRegistrationMode] = useState("self_registration");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("created_at");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [credentialsStudent, setCredentialsStudent] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const formDisclosure = useDisclosure();
  const credentialsDisclosure = useDisclosure();
  const importDisclosure = useDisclosure();
  const deleteDisclosure = useDisclosure();
  const cancelRef = React.useRef();

  const pageBg = useColorModeValue("gray.100", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subTextColor = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const tableHeadBg = useColorModeValue("gray.50", "gray.700");
  const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const inputBg = useColorModeValue("white", "gray.800");
  const headerIconBg = useColorModeValue("blue.50", "blue.900");

  const isCodeOnlyLogin = isTeacherRegistrationMode(registrationMode);
  const showInitialLoader = loading && students.length === 0 && !debouncedSearch;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, gradeFilter, groupFilter, statusFilter, sort, order]);

  const loadMeta = useCallback(async () => {
    try {
      const [gradesData, groupsData] = await Promise.all([
        fetchTeacherGrades(),
        fetchTeacherStudyGroups(),
      ]);
      setGrades(gradesData);
      setGroups(groupsData);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchManagedStudents({
        search: debouncedSearch || undefined,
        grade_id: gradeFilter || undefined,
        group_id: groupFilter || undefined,
        account_status: statusFilter || undefined,
        page,
        limit: 20,
        sort,
        order,
      });
      setStudents(data.students);
      setPagination(data.pagination);
    } catch (err) {
      toast({
        title: "تعذر تحميل الطلاب",
        description: apiErrorMessage(err),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, gradeFilter, groupFilter, statusFilter, page, sort, order, toast]);

  useEffect(() => {
    if (isTeacher) {
      loadMeta();
    }
  }, [isTeacher, loadMeta]);

  useEffect(() => {
    if (isTeacher) {
      loadStudents();
    }
  }, [isTeacher, loadStudents]);

  const copyStudentCode = async (code) => {
    try {
      await navigator.clipboard.writeText(formatStudentCode(code));
      toast({ title: "تم نسخ رقم الطالب", status: "success", duration: 2000 });
    } catch {
      toast({ title: "تعذر النسخ", status: "error", duration: 2000 });
    }
  };

  const openAdd = () => {
    setSelectedStudent(null);
    formDisclosure.onOpen();
  };

  const openEdit = (student) => {
    setSelectedStudent(student);
    formDisclosure.onOpen();
  };

  const showCredentials = (student, creds) => {
    setCredentialsStudent(student);
    setCredentials(creds);
    credentialsDisclosure.onOpen();
  };

  const handleShareLogin = (student) => {
    showCredentials(student, {
      student_code: student.student_code,
      login_with_code_only: isCodeOnlyLogin,
    });
  };

  const handleFormSubmit = async (payload) => {
    try {
      setSubmitting(true);
      if (selectedStudent) {
        await updateManagedStudent(selectedStudent.id, payload);
        toast({ title: "تم تحديث بيانات الطالب", status: "success", duration: 3000 });
        formDisclosure.onClose();
      } else {
        const result = await createManagedStudent(payload);
        formDisclosure.onClose();
        toast({ title: "تم إضافة الطالب", status: "success", duration: 3000 });
        if (result.credentials) {
          showCredentials(
            result.student || { name: payload.name, parent_phone: payload.parent_phone },
            result.credentials
          );
        }
      }
      await loadStudents();
    } catch (err) {
      toast({
        title: "فشلت العملية",
        description: apiErrorMessage(err),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (student) => {
    try {
      const data = await resetManagedStudentPassword(student.id, { use_phone_as_password: true });
      showCredentials(student, {
        student_code: data.student_code,
        temporary_password: data.temporary_password,
        must_change_password: data.must_change_password,
        login_with_code_only: false,
      });
      toast({ title: "تم إعادة تعيين كلمة المرور", status: "success", duration: 3000 });
    } catch (err) {
      toast({
        title: "فشل إعادة التعيين",
        description: apiErrorMessage(err),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleResetDevice = async (student) => {
    const confirmed = window.confirm(
      `إعادة تعيين جهاز الطالب «${student.name}»؟\nسيتمكن من تسجيل الدخول من الجهاز الجديد عند المحاولة التالية.`,
    );
    if (!confirmed) return;

    try {
      const result = await resetStudentDevice(student.id);
      toast({
        title: result.message || "تم إعادة تعيين جهاز الطالب",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      await loadStudents();
    } catch (err) {
      toast({
        title: "فشل إعادة تعيين الجهاز",
        description: apiErrorMessage(err),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleStatusChange = async (student, accountStatus) => {
    try {
      await updateManagedStudentStatus(student.id, accountStatus);
      toast({ title: "تم تحديث حالة الحساب", status: "success", duration: 3000 });
      await loadStudents();
    } catch (err) {
      toast({
        title: "فشل التحديث",
        description: apiErrorMessage(err),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      await deleteManagedStudent(deleteTarget.id);
      toast({ title: "تم حذف الطالب", status: "success", duration: 3000 });
      deleteDisclosure.onClose();
      setDeleteTarget(null);
      await loadStudents();
    } catch (err) {
      toast({
        title: "تعذر الحذف",
        description: apiErrorMessage(err),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleImport = async (file) => {
    try {
      setSubmitting(true);
      const result = await importManagedStudentsCsv(file);
      setImportResult(result);
      toast({
        title: "اكتمل الاستيراد",
        description: `تم إنشاء ${result.created_count} طالب`,
        status: "success",
        duration: 4000,
      });
      await loadStudents();
    } catch (err) {
      toast({
        title: "فشل الاستيراد",
        description: apiErrorMessage(err),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isTeacher) return null;
  if (showInitialLoader) return <BrandLoadingScreen />;

  const activeCount = students.filter((s) => s.account_status === "active").length;

  return (
    <Box minH="100vh" bg={pageBg} pt="100px" pb={14} dir="rtl">
      <Container maxW="6xl" px={{ base: 4, md: 6 }}>
        <VStack spacing={6} align="stretch">
          <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
            <Box h="3px" bg={ACCENT} />
            <Flex
              direction={{ base: "column", md: "row" }}
              align={{ base: "stretch", md: "center" }}
              justify="space-between"
              gap={4}
              p={{ base: 5, md: 6 }}
            >
              <HStack spacing={4} align="start">
                <Flex
                  w={12}
                  h={12}
                  borderRadius="xl"
                  bg={headerIconBg}
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Icon as={FiUserCheck} color={ACCENT} boxSize={5} />
                </Flex>
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={1}>
                    إدارة الحسابات
                  </Text>
                  <Heading size="lg" color={textColor} fontWeight="bold">
                    طلاب المنصة
                  </Heading>
                  <Text fontSize="sm" color={subTextColor} mt={1}>
                    {isCodeOnlyLogin
                      ? "إنشاء حسابات الطلاب ومشاركة رقم الدخول مع أولياء الأمور"
                      : "إنشاء حسابات الطلاب وإدارتها وإرسال بيانات الدخول"}
                  </Text>
                </Box>
              </HStack>
              <HStack spacing={2} flexWrap="wrap">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Icon as={FaSync} />}
                  onClick={loadStudents}
                  isLoading={loading}
                >
                  تحديث
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Icon as={FaFileImport} />}
                  onClick={() => {
                    setImportResult(null);
                    importDisclosure.onOpen();
                  }}
                >
                  استيراد CSV
                </Button>
                <Button size="sm" colorScheme="blue" leftIcon={<Icon as={FaPlus} />} onClick={openAdd}>
                  إضافة طالب
                </Button>
              </HStack>
            </Flex>
          </Box>

          <RegistrationSettingsCard onSettingsChange={(data) => setRegistrationMode(data.registration_mode)} />
          <DeviceRestrictionSettingsCard />

          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
            <KpiCard label="إجمالي الطلاب" value={pagination.total || 0} sub="مسجّلون على المنصة" icon={FaUsers} />
            <KpiCard label="نشطون" value={activeCount} sub="في النتائج الحالية" icon={FiUserCheck} />
            <KpiCard
              label="الصفحة"
              value={`${pagination.page}/${pagination.total_pages || 1}`}
              sub={`${pagination.limit} طالب لكل صفحة`}
              icon={FaUsers}
            />
          </SimpleGrid>

          <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={4}>
            <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={3}>
              تصفية وبحث
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={3}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="بحث بالاسم، رقم الطالب، الهاتف..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  bg={inputBg}
                  borderRadius="lg"
                />
              </InputGroup>
              <Select
                placeholder="كل الصفوف"
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                borderRadius="lg"
                bg={inputBg}
              >
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
              <Select
                placeholder="كل المجموعات"
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                borderRadius="lg"
                bg={inputBg}
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
              <Select
                placeholder="كل الحالات"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                borderRadius="lg"
                bg={inputBg}
              >
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
                <option value="suspended">موقوف</option>
              </Select>
              <Select
                value={`${sort}:${order}`}
                onChange={(e) => {
                  const [s, o] = e.target.value.split(":");
                  setSort(s);
                  setOrder(o);
                }}
                borderRadius="lg"
                bg={inputBg}
              >
                <option value="created_at:desc">الأحدث</option>
                <option value="created_at:asc">الأقدم</option>
                <option value="name:asc">الاسم (أ-ي)</option>
                <option value="student_code:asc">رقم الطالب</option>
              </Select>
            </SimpleGrid>
          </Box>

          <Box
            bg={cardBg}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={borderColor}
            overflow="hidden"
            position="relative"
          >
            {loading && students.length > 0 && (
              <Flex
                position="absolute"
                inset={0}
                bg="blackAlpha.50"
                zIndex={1}
                align="center"
                justify="center"
              >
                <Spinner color="blue.500" />
              </Flex>
            )}

            {students.length === 0 && !loading ? (
              <Box py={16} textAlign="center" px={6}>
                <Icon as={FaUsers} boxSize={8} color="gray.300" mb={3} />
                <Text color={textColor} fontSize="sm" fontWeight="medium" mb={1}>
                  لا يوجد طلاب مطابقون
                </Text>
                <Text color={subTextColor} fontSize="xs" mb={4}>
                  غيّر معايير البحث أو أضف طالباً جديداً للبدء
                </Text>
                <Button size="sm" colorScheme="blue" leftIcon={<Icon as={FaPlus} />} onClick={openAdd}>
                  إضافة أول طالب
                </Button>
              </Box>
            ) : students.length > 0 ? (
              <TableContainer>
                <Table size="sm">
                  <Thead bg={tableHeadBg}>
                    <Tr>
                      <Th fontSize="xs">الطالب</Th>
                      <Th fontSize="xs">رقم الطالب</Th>
                      <Th fontSize="xs" display={{ base: "none", md: "table-cell" }}>
                        الصف / المجموعة
                      </Th>
                      <Th fontSize="xs" display={{ base: "none", lg: "table-cell" }}>
                        التواصل
                      </Th>
                      <Th fontSize="xs" display={{ base: "none", xl: "table-cell" }}>
                        المتصفح
                      </Th>
                      <Th fontSize="xs">الحالة</Th>
                      <Th fontSize="xs" textAlign="center">
                        إجراءات
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {students.map((student) => {
                      const st = statusMeta[student.account_status] || statusMeta.inactive;
                      const code = formatStudentCode(student.student_code);
                      return (
                        <Tr key={student.id} _hover={{ bg: rowHoverBg }}>
                          <Td py={3}>
                            <HStack spacing={3}>
                              <Avatar size="sm" name={student.name} bg="blue.600" />
                              <Box minW={0}>
                                <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                                  {student.name}
                                </Text>
                                {!isCodeOnlyLogin && student.must_change_password && (
                                  <Badge colorScheme="orange" variant="subtle" fontSize="10px" mt={0.5}>
                                    يجب تغيير كلمة المرور
                                  </Badge>
                                )}
                              </Box>
                            </HStack>
                          </Td>
                          <Td py={3}>
                            <HStack spacing={1}>
                              <Code fontSize="sm" px={2} py={0.5} borderRadius="md" dir="ltr">
                                {code}
                              </Code>
                              <IconButton
                                aria-label="نسخ رقم الطالب"
                                icon={<FaCopy />}
                                size="xs"
                                variant="ghost"
                                onClick={() => copyStudentCode(code)}
                              />
                            </HStack>
                          </Td>
                          <Td py={3} display={{ base: "none", md: "table-cell" }}>
                            <Text fontSize="xs" color={textColor} noOfLines={1}>
                              {student.grade?.name || "—"}
                            </Text>
                            <Text fontSize="xs" color={subTextColor} noOfLines={1}>
                              {student.group?.name || "بدون مجموعة"}
                            </Text>
                          </Td>
                          <Td py={3} display={{ base: "none", lg: "table-cell" }}>
                            <Text fontSize="xs" dir="ltr" textAlign="right">
                              {student.phone || "—"}
                            </Text>
                            <Text fontSize="xs" color={subTextColor} dir="ltr" textAlign="right">
                              ولي الأمر: {student.parent_phone || "—"}
                            </Text>
                          </Td>
                          <Td py={3} display={{ base: "none", xl: "table-cell" }}>
                            {student.device_bound || student.registered_ip || student.device_ip ? (
                              <VStack align="start" spacing={0.5}>
                                <Badge colorScheme="blue" variant="subtle" fontSize="10px">
                                  مربوط
                                </Badge>
                                <Text fontSize="10px" color={subTextColor} dir="ltr" noOfLines={1} maxW="140px">
                                  {(student.registered_ip || student.device_ip || "").slice(0, 18)}
                                  {(student.registered_ip || student.device_ip || "").length > 18 ? "…" : ""}
                                </Text>
                              </VStack>
                            ) : (
                              <Badge colorScheme="gray" variant="subtle" fontSize="10px">
                                غير مربوط
                              </Badge>
                            )}
                          </Td>
                          <Td py={3}>
                            <Badge colorScheme={st.scheme} variant="subtle" fontSize="xs">
                              {st.label}
                            </Badge>
                          </Td>
                          <Td py={3} textAlign="center">
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<FaEllipsisV />}
                                variant="ghost"
                                size="sm"
                                aria-label="إجراءات"
                              />
                              <MenuList fontSize="sm">
                                <MenuItem icon={<FaEdit />} onClick={() => openEdit(student)}>
                                  تعديل
                                </MenuItem>
                                {isCodeOnlyLogin ? (
                                  <MenuItem icon={<FaShareAlt />} onClick={() => handleShareLogin(student)}>
                                    مشاركة بيانات الدخول
                                  </MenuItem>
                                ) : (
                                  <MenuItem icon={<FaKey />} onClick={() => handleResetPassword(student)}>
                                    إعادة تعيين كلمة المرور
                                  </MenuItem>
                                )}
                                <MenuItem icon={<FaMobileAlt />} onClick={() => handleResetDevice(student)}>
                                  إعادة تعيين الجهاز
                                </MenuItem>
                                {student.account_status !== "active" && (
                                  <MenuItem onClick={() => handleStatusChange(student, "active")}>
                                    تفعيل الحساب
                                  </MenuItem>
                                )}
                                {student.account_status !== "suspended" && (
                                  <MenuItem onClick={() => handleStatusChange(student, "suspended")}>
                                    إيقاف الحساب
                                  </MenuItem>
                                )}
                                <MenuItem
                                  icon={<FaTrash />}
                                  color="red.500"
                                  onClick={() => {
                                    setDeleteTarget(student);
                                    deleteDisclosure.onOpen();
                                  }}
                                >
                                  حذف
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            ) : null}

            {pagination.total_pages > 1 && (
              <Flex justify="center" gap={2} p={4} borderTopWidth="1px" borderColor={borderColor}>
                <Button
                  size="sm"
                  variant="outline"
                  isDisabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  السابق
                </Button>
                <Text fontSize="sm" color={subTextColor} alignSelf="center">
                  صفحة {page} من {pagination.total_pages}
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  isDisabled={page >= pagination.total_pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  التالي
                </Button>
              </Flex>
            )}
          </Box>
        </VStack>
      </Container>

      <StudentFormModal
        isOpen={formDisclosure.isOpen}
        onClose={formDisclosure.onClose}
        mode={selectedStudent ? "edit" : "add"}
        student={selectedStudent}
        grades={grades}
        groups={groups}
        onSubmit={handleFormSubmit}
        submitting={submitting}
        teacherRegistrationMode={isCodeOnlyLogin}
      />

      <CredentialsModal
        isOpen={credentialsDisclosure.isOpen}
        onClose={credentialsDisclosure.onClose}
        studentName={credentialsStudent?.name}
        parentPhone={credentialsStudent?.parent_phone}
        credentials={credentials}
        codeOnlyLogin={isCodeOnlyLogin}
      />

      <ImportCsvModal
        isOpen={importDisclosure.isOpen}
        onClose={importDisclosure.onClose}
        onImport={handleImport}
        importing={submitting}
        result={importResult}
      />

      <AlertDialog
        isOpen={deleteDisclosure.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={deleteDisclosure.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent dir="rtl" borderRadius="xl">
            <AlertDialogHeader fontSize="md">حذف الطالب</AlertDialogHeader>
            <AlertDialogBody fontSize="sm">
              هل أنت متأكد من حذف <strong>{deleteTarget?.name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelRef} onClick={deleteDisclosure.onClose}>
                إلغاء
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} isLoading={submitting}>
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ManagedStudentsPage;
