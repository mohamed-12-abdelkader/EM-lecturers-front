import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
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
  Select,
  SimpleGrid,
  Spinner,
  Text,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import {
  MdAdd,
  MdDelete,
  MdEdit,
  MdRefresh,
  MdSchool,
  MdSearch,
  MdToggleOff,
  MdToggleOn,
} from "react-icons/md";
import {
  adminGradesErrorMessage,
  createAdminGrade,
  deleteAdminGrade,
  fetchAdminGrades,
  GRADE_STAGES,
  gradeStageLabel,
  unwrapAdminGradesError,
  updateAdminGrade,
  updateAdminGradeStatus,
} from "../../api/adminGradesApi";
import { AD_BLUE, AD_ORANGE } from "../home/adminDashboardTheme";

const emptyForm = {
  name: "",
  stage: "secondary",
  slug: "",
  level: "",
  status: "active",
};

function formatUsageDetails(usage) {
  if (!usage) return null;
  if (typeof usage === "string") return usage;
  if (Array.isArray(usage)) return usage.filter(Boolean).join(" · ");
  if (typeof usage === "object") {
    return Object.entries(usage)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" · ");
  }
  return String(usage);
}

function StatTile({ label, value, color = "blue" }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const title = useColorModeValue("gray.900", "white");

  return (
    <Box bg={bg} borderWidth="1px" borderColor={border} borderRadius="xl" p={4}>
      <Text fontSize="xs" fontWeight="700" color={muted} mb={1}>
        {label}
      </Text>
      <Text fontSize="2xl" fontWeight="900" color={title}>
        {Number(value || 0).toLocaleString("ar-EG")}
      </Text>
      <Box mt={2} h="3px" w="36px" borderRadius="full" bg={`${color}.400`} />
    </Box>
  );
}

export default function AdminGradesPage() {
  const toast = useToast();
  const formModal = useDisclosure();
  const deleteDialog = useDisclosure();
  const cancelRef = useRef();

  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [conflictInfo, setConflictInfo] = useState(null);

  const pageBg = useColorModeValue("#F4F7FB", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const titleColor = useColorModeValue("gray.900", "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const inputBg = useColorModeValue("white", "gray.800");
  const rowHover = useColorModeValue("blue.50", "whiteAlpha.50");

  const loadGrades = useCallback(async () => {
    try {
      setLoading(true);
      setConflictInfo(null);
      const list = await fetchAdminGrades({
        search: search.trim() || undefined,
        stage: stageFilter || undefined,
        status: statusFilter || undefined,
      });
      setGrades(list);
    } catch (err) {
      toast({
        title: "تعذر تحميل الصفوف",
        description: adminGradesErrorMessage(err),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      setGrades([]);
    } finally {
      setLoading(false);
    }
  }, [search, stageFilter, statusFilter, toast]);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  const stats = useMemo(() => {
    const active = grades.filter((g) => g.status === "active").length;
    const inactive = grades.filter((g) => g.status !== "active").length;
    return {
      total: grades.length,
      active,
      inactive,
      secondary: grades.filter((g) => g.stage === "secondary").length,
    };
  }, [grades]);

  const filteredGrades = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...grades]
      .filter((g) => {
        if (stageFilter && g.stage !== stageFilter) return false;
        if (statusFilter && g.status !== statusFilter) return false;
        if (!term) return true;
        return (
          String(g.name || "").toLowerCase().includes(term) ||
          String(g.slug || "").toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        const la = Number(a.level);
        const lb = Number(b.level);
        if (Number.isFinite(la) && Number.isFinite(lb) && la !== lb) return la - lb;
        return String(a.name || "").localeCompare(String(b.name || ""), "ar");
      });
  }, [grades, search, stageFilter, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setConflictInfo(null);
    formModal.onOpen();
  };

  const openEdit = (grade) => {
    setEditing(grade);
    setForm({
      name: grade.name || "",
      stage: grade.stage || "secondary",
      slug: grade.slug || "",
      level: grade.level != null ? String(grade.level) : "",
      status: grade.status || "active",
    });
    setConflictInfo(null);
    formModal.onOpen();
  };

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.stage) {
      toast({ title: "الاسم والمرحلة مطلوبان", status: "warning", duration: 3000 });
      return;
    }

    const payload = {
      name: form.name.trim(),
      stage: form.stage,
      status: form.status || "active",
    };
    if (form.slug.trim()) payload.slug = form.slug.trim();
    if (form.level !== "" && form.level != null) {
      payload.level = Number(form.level);
    }

    try {
      setSubmitting(true);
      if (editing?.id) {
        const nextPayload = { ...payload };
        if (!form.slug.trim()) delete nextPayload.slug;
        await updateAdminGrade(editing.id, nextPayload);
        toast({ title: "تم تحديث الصف", status: "success", duration: 2500 });
      } else {
        await createAdminGrade(payload);
        toast({ title: "تم إضافة الصف", status: "success", duration: 2500 });
      }
      formModal.onClose();
      await loadGrades();
    } catch (err) {
      toast({
        title: editing ? "فشل التعديل" : "فشل الإضافة",
        description: adminGradesErrorMessage(err),
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (grade) => {
    const next = grade.status === "active" ? "inactive" : "active";
    try {
      await updateAdminGradeStatus(grade.id, next);
      toast({
        title: next === "active" ? "تم تفعيل الصف" : "تم تعطيل الصف",
        status: "success",
        duration: 2500,
      });
      await loadGrades();
    } catch (err) {
      toast({
        title: "تعذر تغيير الحالة",
        description: adminGradesErrorMessage(err),
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const openDelete = (grade) => {
    setDeleteTarget(grade);
    setConflictInfo(null);
    deleteDialog.onOpen();
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      setSubmitting(true);
      setConflictInfo(null);
      await deleteAdminGrade(deleteTarget.id);
      toast({ title: "تم حذف الصف", status: "success", duration: 2500 });
      deleteDialog.onClose();
      setDeleteTarget(null);
      await loadGrades();
    } catch (err) {
      const info = unwrapAdminGradesError(err);
      if (info.status === 409) {
        setConflictInfo(info);
        toast({
          title: "لا يمكن الحذف",
          description: "الصف مستخدم — عطّله بدل الحذف",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "فشل الحذف",
          description: info.message,
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box minH="100vh" bg={pageBg} dir="rtl" pb={12} pt={{ base: 4, md: 6 }}>
      <Container maxW="1200px" px={{ base: 3, sm: 4, md: 6 }}>
        <VStack spacing={5} align="stretch">
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "stretch", md: "center" }}
            gap={4}
          >
            <Box>
              <HStack spacing={2} mb={1}>
                <Icon as={MdSchool} color={AD_BLUE} boxSize={6} />
                <Heading
                  as="h1"
                  fontSize={{ base: "xl", md: "2xl" }}
                  fontWeight="800"
                  color={titleColor}
                >
                  إدارة الصفوف الدراسية
                </Heading>
              </HStack>
              <Text fontSize="sm" color={muted}>
                إضافة وتعديل وتفعيل/تعطيل الصفوف (إعدادي · ثانوي · جامعي · عام)
              </Text>
            </Box>

            <HStack spacing={2} flexWrap="wrap">
              <Button
                leftIcon={<MdRefresh />}
                variant="outline"
                borderRadius="lg"
                onClick={loadGrades}
                isLoading={loading}
              >
                تحديث
              </Button>
              <Button
                leftIcon={<MdAdd />}
                bg={AD_ORANGE}
                color="white"
                borderRadius="lg"
                fontWeight="800"
                _hover={{ bg: "#C05621" }}
                onClick={openCreate}
              >
                إضافة صف
              </Button>
            </HStack>
          </Flex>

          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
            <StatTile label="إجمالي الصفوف" value={stats.total} color="blue" />
            <StatTile label="نشط" value={stats.active} color="green" />
            <StatTile label="معطّل" value={stats.inactive} color="orange" />
            <StatTile label="ثانوي" value={stats.secondary} color="purple" />
          </SimpleGrid>

          <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="2xl" p={4}>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={MdSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="بحث بالاسم أو الـ slug"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  bg={inputBg}
                  borderRadius="xl"
                  pr={10}
                />
              </InputGroup>
              <Select
                placeholder="كل المراحل"
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                bg={inputBg}
                borderRadius="xl"
              >
                {GRADE_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
              <Select
                placeholder="كل الحالات"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                bg={inputBg}
                borderRadius="xl"
              >
                <option value="active">نشط</option>
                <option value="inactive">معطّل</option>
              </Select>
            </SimpleGrid>
          </Box>

          <Box
            bg={cardBg}
            borderWidth="1px"
            borderColor={border}
            borderRadius="2xl"
            overflow="hidden"
            minH="240px"
            position="relative"
          >
            {loading ? (
              <Flex py={16} align="center" justify="center">
                <Spinner color={AD_BLUE} thickness="3px" size="lg" />
              </Flex>
            ) : filteredGrades.length === 0 ? (
              <Box py={16} textAlign="center" px={4}>
                <Icon as={MdSchool} boxSize={10} color="gray.300" mb={3} />
                <Text fontWeight="700" color={titleColor}>
                  لا توجد صفوف
                </Text>
                <Text fontSize="sm" color={muted} mt={1}>
                  ابدأ بإضافة صف دراسي جديد
                </Text>
                <Button mt={4} colorScheme="blue" borderRadius="lg" leftIcon={<MdAdd />} onClick={openCreate}>
                  إضافة صف
                </Button>
              </Box>
            ) : (
              <VStack spacing={0} align="stretch" divider={<Box borderBottomWidth="1px" borderColor={border} />}>
                {filteredGrades.map((grade) => {
                  const isActive = grade.status === "active";
                  return (
                    <Flex
                      key={grade.id}
                      px={{ base: 3, md: 5 }}
                      py={4}
                      gap={3}
                      align={{ base: "stretch", md: "center" }}
                      direction={{ base: "column", md: "row" }}
                      _hover={{ bg: rowHover }}
                    >
                      <Box flex="1" minW={0}>
                        <HStack spacing={2} flexWrap="wrap" mb={1}>
                          <Text fontWeight="800" color={titleColor} noOfLines={1}>
                            {grade.name}
                          </Text>
                          <Badge colorScheme={isActive ? "green" : "gray"} borderRadius="full">
                            {isActive ? "نشط" : "معطّل"}
                          </Badge>
                          <Badge colorScheme="blue" variant="subtle" borderRadius="full">
                            {gradeStageLabel(grade.stage)}
                          </Badge>
                          {grade.level != null && grade.level !== "" ? (
                            <Badge variant="outline" borderRadius="full">
                              ترتيب {grade.level}
                            </Badge>
                          ) : null}
                        </HStack>
                        <Text fontSize="xs" color={muted} dir="ltr" textAlign="right">
                          #{grade.id}
                          {grade.slug ? ` · ${grade.slug}` : ""}
                        </Text>
                      </Box>

                      <HStack spacing={1} justify={{ base: "flex-end", md: "flex-start" }}>
                        <Tooltip label="تعديل" hasArrow>
                          <IconButton
                            aria-label="تعديل"
                            icon={<MdEdit />}
                            size="sm"
                            variant="ghost"
                            colorScheme="yellow"
                            onClick={() => openEdit(grade)}
                          />
                        </Tooltip>
                        <Tooltip label={isActive ? "تعطيل" : "تفعيل"} hasArrow>
                          <IconButton
                            aria-label="تبديل الحالة"
                            icon={isActive ? <MdToggleOn /> : <MdToggleOff />}
                            size="sm"
                            variant="ghost"
                            colorScheme={isActive ? "green" : "gray"}
                            onClick={() => handleToggleStatus(grade)}
                          />
                        </Tooltip>
                        <Tooltip label="حذف نهائي" hasArrow>
                          <IconButton
                            aria-label="حذف"
                            icon={<MdDelete />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => openDelete(grade)}
                          />
                        </Tooltip>
                      </HStack>
                    </Flex>
                  );
                })}
              </VStack>
            )}
          </Box>
        </VStack>
      </Container>

      <Modal isOpen={formModal.isOpen} onClose={formModal.onClose} size={{ base: "full", sm: "lg" }} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius={{ base: "none", sm: "2xl" }} dir="rtl">
          <ModalHeader>{editing ? "تعديل الصف" : "إضافة صف جديد"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="sm">اسم الصف</FormLabel>
                <Input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="الصف الرابع الثانوي"
                  borderRadius="lg"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm">المرحلة</FormLabel>
                <Select
                  value={form.stage}
                  onChange={(e) => setField("stage", e.target.value)}
                  borderRadius="lg"
                >
                  {GRADE_STAGES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Slug</FormLabel>
                <Input
                  value={form.slug}
                  onChange={(e) => setField("slug", e.target.value)}
                  placeholder="secondary-4"
                  dir="ltr"
                  textAlign="left"
                  borderRadius="lg"
                />
                <FormHelperText fontSize="xs">
                  اختياري — إن تُرك فارغاً عند الإضافة يُولَّد من الاسم تلقائياً
                </FormHelperText>
              </FormControl>

              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                <FormControl>
                  <FormLabel fontSize="sm">الترتيب (level)</FormLabel>
                  <Input
                    type="number"
                    value={form.level}
                    onChange={(e) => setField("level", e.target.value)}
                    placeholder="7"
                    borderRadius="lg"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">الحالة</FormLabel>
                  <Select
                    value={form.status}
                    onChange={(e) => setField("status", e.target.value)}
                    borderRadius="lg"
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">معطّل</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={formModal.onClose}>
              إلغاء
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSave}
              isLoading={submitting}
              borderRadius="lg"
            >
              {editing ? "حفظ التعديلات" : "إضافة الصف"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={deleteDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={deleteDialog.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent dir="rtl" borderRadius="2xl" mx={3}>
            <AlertDialogHeader fontSize="md">حذف الصف نهائياً</AlertDialogHeader>
            <AlertDialogBody>
              <Text fontSize="sm" mb={3}>
                هل تريد حذف <strong>{deleteTarget?.name}</strong>؟ الحذف النهائي متاح فقط إذا لم يكن
                مرتبطاً بمدرسين / طلاب / كورسات / مجموعات.
              </Text>
              {conflictInfo ? (
                <Alert status="warning" borderRadius="lg" alignItems="flex-start">
                  <AlertIcon />
                  <Box>
                    <AlertTitle fontSize="sm">الصف مستخدم حالياً</AlertTitle>
                    <AlertDescription fontSize="xs" display="block" mt={1}>
                      {conflictInfo.message}
                      {formatUsageDetails(conflictInfo.usage)
                        ? ` — ${formatUsageDetails(conflictInfo.usage)}`
                        : ""}
                      . استخدم التعطيل بدل الحذف.
                    </AlertDescription>
                    <Button
                      mt={3}
                      size="sm"
                      colorScheme="orange"
                      borderRadius="lg"
                      onClick={async () => {
                        if (!deleteTarget) return;
                        await handleToggleStatus({ ...deleteTarget, status: "active" });
                        deleteDialog.onClose();
                      }}
                    >
                      تعطيل الصف بدلاً من الحذف
                    </Button>
                  </Box>
                </Alert>
              ) : null}
            </AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelRef} onClick={deleteDialog.onClose} borderRadius="lg">
                إلغاء
              </Button>
              <Button
                colorScheme="red"
                onClick={confirmDelete}
                isLoading={submitting}
                borderRadius="lg"
                isDisabled={Boolean(conflictInfo)}
              >
                تأكيد الحذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
