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
  VStack,
  HStack,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
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
  Collapse,
} from "@chakra-ui/react";
import {
  FaUsers,
  FaPlus,
  FaFileImport,
  FaTrash,
  FaSync,
} from "react-icons/fa";
import { FiSearch, FiChevronDown, FiSettings } from "react-icons/fi";
import BrandLoadingScreen from "../../../components/loading/BrandLoadingScreen";
import UserType from "../../../Hooks/auth/userType";
import {
  fetchManagedStudents,
  createManagedStudent,
  updateManagedStudent,
  deleteManagedStudent,
  deleteAllManagedStudents,
  changeManagedStudentPassword,
  updateManagedStudentStatus,
  importManagedStudentsCsv,
  fetchTeacherGrades,
  fetchTeacherStudyGroups,
  apiErrorMessage,
} from "../../../api/teacherManagedStudentsApi";
import { resetStudentDevice } from "../../../api/deviceRestrictionApi";
import RegistrationSettingsCard from "./components/RegistrationSettingsCard";
import DeviceRestrictionSettingsCard from "./components/DeviceRestrictionSettingsCard";
import ManagedStudentCard from "./components/ManagedStudentCard";
import StudentFormModal from "./components/StudentFormModal";
import ChangePasswordModal from "./components/ChangePasswordModal";
import CredentialsModal from "./components/CredentialsModal";
import ImportCsvModal from "./components/ImportCsvModal";
import { formatStudentCode, isTeacherRegistrationMode } from "./managedStudentsUtils";

const ACCENT = "#0056b3";
const WARM = "#c2410c";

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
  const [deleteAllConfirm, setDeleteAllConfirm] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState(null);

  const formDisclosure = useDisclosure();
  const credentialsDisclosure = useDisclosure();
  const importDisclosure = useDisclosure();
  const deleteDisclosure = useDisclosure();
  const deleteAllDisclosure = useDisclosure();
  const passwordDisclosure = useDisclosure();
  const cancelRef = React.useRef();
  const deleteAllCancelRef = React.useRef();

  const pageBg = useColorModeValue("#f4f7fb", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.900", "gray.100");
  const subTextColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const inputBg = useColorModeValue("white", "gray.800");
  const heroBg = useColorModeValue(
    "linear-gradient(135deg, #eef5ff 0%, #fff7ed 48%, #ffffff 100%)",
    "linear-gradient(135deg, rgba(0,86,179,0.22) 0%, rgba(194,65,12,0.14) 50%, rgba(26,32,44,1) 100%)",
  );

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

  const openChangePassword = (student) => {
    setPasswordTarget(student);
    passwordDisclosure.onOpen();
  };

  const handleChangePassword = async (newPassword) => {
    if (!passwordTarget?.id) return;
    try {
      setSubmitting(true);
      const data = await changeManagedStudentPassword(passwordTarget.id, newPassword);
      passwordDisclosure.onClose();
      showCredentials(passwordTarget, {
        student_code: data.student_code || passwordTarget.student_code,
        temporary_password: newPassword,
        must_change_password: data.must_change_password === true,
        login_with_code_only: false,
      });
      toast({
        title: "تم تغيير كلمة المرور",
        description: "احفظها أو أرسلها لولي الأمر الآن",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      setPasswordTarget(null);
    } catch (err) {
      toast({
        title: "فشل تغيير كلمة المرور",
        description: apiErrorMessage(err),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
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

  const confirmDeleteAll = async () => {
    if (deleteAllConfirm !== "DELETE_ALL_STUDENTS") {
      toast({
        title: "تأكيد غير صحيح",
        description: "اكتب DELETE_ALL_STUDENTS حرفياً للمتابعة",
        status: "warning",
        duration: 4000,
      });
      return;
    }
    try {
      setSubmitting(true);
      const result = await deleteAllManagedStudents();
      toast({
        title: "تم حذف كل الطلاب",
        description: result?.message || `تم حذف ${result?.deleted_count ?? ""} حساب`,
        status: "success",
        duration: 5000,
      });
      deleteAllDisclosure.onClose();
      setDeleteAllConfirm("");
      await loadStudents();
    } catch (err) {
      toast({
        title: "تعذر حذف الكل",
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
        <VStack spacing={5} align="stretch">
          {/* Hero */}
          <Box
            borderRadius="3xl"
            borderWidth="1px"
            borderColor={borderColor}
            overflow="hidden"
            bg={heroBg}
            position="relative"
          >
            <Box
              position="absolute"
              insetStart={0}
              top={0}
              bottom={0}
              w="5px"
              bgGradient={`linear(to-b, ${ACCENT}, ${WARM})`}
              aria-hidden
            />
            <Flex
              direction={{ base: "column", lg: "row" }}
              align={{ base: "stretch", lg: "center" }}
              justify="space-between"
              gap={5}
              p={{ base: 5, md: 7 }}
            >
              <Box>
                <Text fontSize="xs" fontWeight="800" color={subTextColor} letterSpacing="0.04em" mb={2}>
                  إدارة الحسابات · المنصة
                </Text>
                <Heading size="lg" color={textColor} fontWeight="900" letterSpacing="-0.02em">
                  طلابك
                </Heading>
                <Text fontSize="sm" color={subTextColor} mt={2} maxW="34rem" lineHeight="tall">
                  {isCodeOnlyLogin
                    ? "أنشئ الحساب، انسخ رقم الطالب، وشاركه مع ولي الأمر — الدخول بدون كلمة مرور."
                    : "أنشئ الحسابات، أدر الحالة، وأرسل بيانات الدخول لأولياء الأمور."}
                </Text>

                <HStack spacing={3} mt={4} flexWrap="wrap">
                  <StatChip label="الإجمالي" value={pagination.total || 0} />
                  <StatChip label="نشطون هنا" value={activeCount} tone="green" />
                  <StatChip
                    label="الصفحة"
                    value={`${pagination.page}/${pagination.total_pages || 1}`}
                    tone="orange"
                  />
                </HStack>
              </Box>

              <HStack spacing={2} flexWrap="wrap" justify={{ base: "flex-start", lg: "flex-end" }}>
                <Button
                  size="md"
                  bg={ACCENT}
                  color="white"
                  _hover={{ bg: "#004494" }}
                  leftIcon={<Icon as={FaPlus} />}
                  onClick={openAdd}
                  borderRadius="xl"
                  px={5}
                >
                  إضافة طالب
                </Button>
                <Button
                  size="md"
                  variant="outline"
                  leftIcon={<Icon as={FaFileImport} />}
                  onClick={() => {
                    setImportResult(null);
                    importDisclosure.onOpen();
                  }}
                  borderRadius="xl"
                  bg={cardBg}
                >
                  استيراد
                </Button>
                <Button
                  size="md"
                  variant="ghost"
                  leftIcon={<Icon as={FaSync} />}
                  onClick={loadStudents}
                  isLoading={loading}
                  borderRadius="xl"
                >
                  تحديث
                </Button>
              </HStack>
            </Flex>
          </Box>

          {/* Settings accordion */}
          <Box bg={cardBg} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
            <Button
              variant="ghost"
              w="full"
              h="auto"
              py={4}
              px={5}
              justifyContent="space-between"
              borderRadius="0"
              onClick={() => setSettingsOpen((v) => !v)}
              rightIcon={
                <Icon
                  as={FiChevronDown}
                  transform={settingsOpen ? "rotate(180deg)" : undefined}
                  transition="0.2s"
                />
              }
            >
              <HStack spacing={3}>
                <Flex
                  w={9}
                  h={9}
                  borderRadius="lg"
                  bg="blue.50"
                  align="center"
                  justify="center"
                  _dark={{ bg: "blue.900" }}
                >
                  <Icon as={FiSettings} color={ACCENT} />
                </Flex>
                <Box textAlign="right">
                  <Text fontSize="sm" fontWeight="800" color={textColor}>
                    إعدادات المنصة
                  </Text>
                  <Text fontSize="xs" color={subTextColor} fontWeight="500">
                    طريقة التسجيل · تقييد الأجهزة
                  </Text>
                </Box>
              </HStack>
            </Button>
            <Collapse in={settingsOpen} animateOpacity>
              <VStack align="stretch" spacing={4} px={5} pb={5}>
                <RegistrationSettingsCard
                  compact
                  onSettingsChange={(data) => setRegistrationMode(data.registration_mode)}
                />
                <DeviceRestrictionSettingsCard />
                <Button
                  alignSelf="flex-start"
                  size="sm"
                  variant="outline"
                  colorScheme="red"
                  leftIcon={<Icon as={FaTrash} />}
                  onClick={() => {
                    setDeleteAllConfirm("");
                    deleteAllDisclosure.onOpen();
                  }}
                  isDisabled={!pagination.total}
                  borderRadius="lg"
                >
                  حذف كل الطلاب
                </Button>
              </VStack>
            </Collapse>
          </Box>

          {/* Filters + list */}
          <Box bg={cardBg} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} overflow="hidden">
            <Box px={{ base: 4, md: 5 }} pt={5} pb={4} borderBottomWidth="1px" borderColor={borderColor}>
              <Flex justify="space-between" align="center" mb={3} gap={3}>
                <Text fontSize="sm" fontWeight="800" color={textColor}>
                  قائمة الطلاب
                </Text>
                <Text fontSize="xs" color={subTextColor}>
                  {pagination.total || 0} نتيجة
                </Text>
              </Flex>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={3}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiSearch} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="بحث بالاسم، الرقم، الهاتف..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    bg={inputBg}
                    borderRadius="xl"
                  />
                </InputGroup>
                <Select
                  placeholder="كل الصفوف"
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  borderRadius="xl"
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
                  borderRadius="xl"
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
                  borderRadius="xl"
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
                  borderRadius="xl"
                  bg={inputBg}
                >
                  <option value="created_at:desc">الأحدث</option>
                  <option value="created_at:asc">الأقدم</option>
                  <option value="name:asc">الاسم (أ-ي)</option>
                  <option value="student_code:asc">رقم الطالب</option>
                </Select>
              </SimpleGrid>
            </Box>

            <Box p={{ base: 4, md: 5 }} position="relative" minH="200px">
              {loading && students.length > 0 && (
                <Flex
                  position="absolute"
                  inset={0}
                  bg="blackAlpha.40"
                  zIndex={1}
                  align="center"
                  justify="center"
                  borderRadius="2xl"
                >
                  <Spinner color="blue.500" thickness="3px" />
                </Flex>
              )}

              {students.length === 0 && !loading ? (
                <Box py={14} textAlign="center" px={4}>
                  <Flex
                    mx="auto"
                    mb={4}
                    w={14}
                    h={14}
                    borderRadius="2xl"
                    bg="blue.50"
                    align="center"
                    justify="center"
                    _dark={{ bg: "blue.900" }}
                  >
                    <Icon as={FaUsers} boxSize={6} color={ACCENT} />
                  </Flex>
                  <Text color={textColor} fontSize="md" fontWeight="800" mb={1}>
                    لا يوجد طلاب هنا بعد
                  </Text>
                  <Text color={subTextColor} fontSize="sm" mb={5} maxW="22rem" mx="auto">
                    ابدأ بإضافة طالب أو استيراد ملف CSV لملء القائمة.
                  </Text>
                  <HStack justify="center" spacing={2}>
                    <Button colorScheme="blue" leftIcon={<Icon as={FaPlus} />} onClick={openAdd} borderRadius="xl">
                      إضافة طالب
                    </Button>
                    <Button
                      variant="outline"
                      leftIcon={<Icon as={FaFileImport} />}
                      borderRadius="xl"
                      onClick={() => {
                        setImportResult(null);
                        importDisclosure.onOpen();
                      }}
                    >
                      استيراد
                    </Button>
                  </HStack>
                </Box>
              ) : (
                <VStack align="stretch" spacing={3}>
                  {students.map((student) => (
                    <ManagedStudentCard
                      key={student.id}
                      student={student}
                      isCodeOnlyLogin={isCodeOnlyLogin}
                      onCopyCode={copyStudentCode}
                      onEdit={openEdit}
                      onShareLogin={handleShareLogin}
                      onResetPassword={openChangePassword}
                      onResetDevice={handleResetDevice}
                      onStatusChange={handleStatusChange}
                      onDelete={(s) => {
                        setDeleteTarget(s);
                        deleteDisclosure.onOpen();
                      }}
                    />
                  ))}
                </VStack>
              )}
            </Box>

            {pagination.total_pages > 1 && (
              <Flex
                justify="center"
                align="center"
                gap={3}
                p={4}
                borderTopWidth="1px"
                borderColor={borderColor}
              >
                <Button
                  size="sm"
                  variant="outline"
                  borderRadius="lg"
                  isDisabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  السابق
                </Button>
                <Text fontSize="sm" color={subTextColor}>
                  {page} / {pagination.total_pages}
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  borderRadius="lg"
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

      <ChangePasswordModal
        isOpen={passwordDisclosure.isOpen}
        onClose={() => {
          passwordDisclosure.onClose();
          setPasswordTarget(null);
        }}
        student={passwordTarget}
        onSubmit={handleChangePassword}
        submitting={submitting}
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
          <AlertDialogContent dir="rtl" borderRadius="2xl">
            <AlertDialogHeader fontSize="md">حذف الطالب</AlertDialogHeader>
            <AlertDialogBody fontSize="sm">
              هل أنت متأكد من حذف <strong>{deleteTarget?.name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
              إن تعذّر الحذف بسبب سجلات مرتبطة، أوقف الحساب بدلاً من ذلك.
            </AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelRef} onClick={deleteDisclosure.onClose} borderRadius="lg">
                إلغاء
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} isLoading={submitting} borderRadius="lg">
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <AlertDialog
        isOpen={deleteAllDisclosure.isOpen}
        leastDestructiveRef={deleteAllCancelRef}
        onClose={() => {
          deleteAllDisclosure.onClose();
          setDeleteAllConfirm("");
        }}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent dir="rtl" borderRadius="2xl">
            <AlertDialogHeader fontSize="md">حذف كل طلاب المنصة</AlertDialogHeader>
            <AlertDialogBody fontSize="sm">
              <Text mb={3}>
                سيتم حذف <strong>كل</strong> حسابات الطلاب على منصتك (بما فيها المسجّلون ذاتياً). لا يمكن التراجع.
              </Text>
              <Text mb={2} fontSize="xs" color="gray.500">
                للتأكيد اكتب حرفياً: <Code>DELETE_ALL_STUDENTS</Code>
              </Text>
              <Input
                value={deleteAllConfirm}
                onChange={(e) => setDeleteAllConfirm(e.target.value)}
                placeholder="DELETE_ALL_STUDENTS"
                dir="ltr"
                textAlign="left"
                borderRadius="lg"
              />
            </AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button
                ref={deleteAllCancelRef}
                borderRadius="lg"
                onClick={() => {
                  deleteAllDisclosure.onClose();
                  setDeleteAllConfirm("");
                }}
              >
                إلغاء
              </Button>
              <Button
                colorScheme="red"
                borderRadius="lg"
                onClick={confirmDeleteAll}
                isLoading={submitting}
                isDisabled={deleteAllConfirm !== "DELETE_ALL_STUDENTS"}
              >
                حذف الكل
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

function StatChip({ label, value, tone = "blue" }) {
  const tones = {
    blue: { bg: "blue.50", color: "blue.700" },
    green: { bg: "green.50", color: "green.700" },
    orange: { bg: "orange.50", color: "orange.700" },
  };
  const t = tones[tone] || tones.blue;
  return (
    <HStack
      spacing={2}
      bg={t.bg}
      px={3}
      py={1.5}
      borderRadius="full"
      _dark={{ bg: "whiteAlpha.100" }}
    >
      <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="900" color={t.color} _dark={{ color: "white" }}>
        {value}
      </Text>
    </HStack>
  );
}

export default ManagedStudentsPage;
