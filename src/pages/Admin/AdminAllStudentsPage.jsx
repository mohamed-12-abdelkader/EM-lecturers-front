import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Collapse,
  Container,
  Divider,
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
  InputRightElement,
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
  Switch,
  Text,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";
import {
  MdEmail,
  MdExpandLess,
  MdExpandMore,
  MdPeople,
  MdPhone,
  MdRefresh,
  MdSearch,
  MdClose,
  MdSchool,
  MdVpnKey,
  MdLockReset,
  MdVisibility,
  MdVisibilityOff,
  MdContentCopy,
} from "react-icons/md";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import {
  fetchAdminTenants,
  fetchAdminTenantStudents,
  isDeletedTenant,
  patchAdminStudentPassword,
} from "../../api/adminTenantsApi";
import { AD_BLUE, AD_ORANGE } from "../home/adminDashboardTheme";

const PAGE_SIZE = 20;

const CODE_TYPE_LABEL = {
  course_invite: "دعوة كورس",
  package: "باقة",
  general_course: "كورس عام",
};

const STATUS_LABEL = {
  active: "نشط",
  inactive: "غير نشط",
  suspended: "موقوف",
};

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(value);
  }
}

function formatNumber(value) {
  return (Number(value) || 0).toLocaleString("ar-EG");
}

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function SummaryCard({ label, value, color, icon }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const title = useColorModeValue("gray.900", "white");
  const iconBg = useColorModeValue(`${color}.50`, `${color}.900`);
  const iconColor = useColorModeValue(`${color}.500`, `${color}.200`);

  return (
    <Flex
      bg={bg}
      border="1px solid"
      borderColor={border}
      borderRadius="xl"
      p={4}
      align="center"
      gap={3}
    >
      <Flex
        w={10}
        h={10}
        borderRadius="lg"
        bg={iconBg}
        align="center"
        justify="center"
        flexShrink={0}
      >
        <Icon as={icon} color={iconColor} boxSize={5} />
      </Flex>
      <Box minW={0}>
        <Text fontSize="xs" color={muted}>
          {label}
        </Text>
        <Text fontSize="xl" fontWeight="800" color={title} lineHeight="1.1">
          {formatNumber(value)}
        </Text>
      </Box>
    </Flex>
  );
}

function ChangePasswordModal({
  isOpen,
  onClose,
  student,
  tenantId,
  tenantLabel,
}) {
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [mustChange, setMustChange] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const softBg = useColorModeValue("gray.50", "whiteAlpha.50");

  useEffect(() => {
    if (!isOpen) return;
    setPassword("");
    setConfirm("");
    setMustChange(false);
    setShowPass(false);
  }, [isOpen, student?.id]);

  const handleSubmit = async () => {
    const next = password.trim();
    if (next.length < 6) {
      toast({
        title: "كلمة المرور قصيرة",
        description: "يجب أن تكون 6 أحرف على الأقل.",
        status: "warning",
        duration: 3500,
        isClosable: true,
      });
      return;
    }
    if (next !== confirm.trim()) {
      toast({
        title: "غير متطابقة",
        description: "تأكيد كلمة المرور غير مطابق.",
        status: "warning",
        duration: 3500,
        isClosable: true,
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "غير مصرّح",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSaving(true);
    try {
      const res = await patchAdminStudentPassword(
        tenantId,
        student.id,
        { new_password: next, must_change_password: mustChange },
        token,
      );
      toast({
        title: "تم التغيير",
        description: res?.message || `تم تحديث كلمة سر ${student.name || "الطالب"}.`,
        status: "success",
        duration: 4500,
        isClosable: true,
      });
      onClose();
    } catch (err) {
      toast({
        title: "فشل التغيير",
        description:
          err.response?.data?.message || err.message || "تعذر تغيير كلمة السر.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!student) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(2px)" />
      <ModalContent mx={4} borderRadius="2xl" dir="rtl">
        <ModalHeader fontWeight="800" pb={2}>
          تغيير كلمة السر
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box bg={softBg} borderWidth="1px" borderColor={border} borderRadius="xl" p={3} mb={4}>
            <HStack spacing={3}>
              <Avatar
                name={student.name || student.email}
                src={student.avatar || undefined}
                size="sm"
                bg={AD_BLUE}
                color="white"
              />
              <Box minW={0}>
                <Text fontWeight="700" noOfLines={1}>
                  {student.name || "طالب"}
                </Text>
                <Text fontSize="xs" color={muted} noOfLines={1} dir="ltr">
                  {student.email || "بدون إيميل"}
                </Text>
                {tenantLabel ? (
                  <Text fontSize="xs" color={muted} mt={0.5}>
                    المنصة: {tenantLabel}
                  </Text>
                ) : null}
              </Box>
            </HStack>
          </Box>

          <VStack align="stretch" spacing={3}>
            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="600">
                كلمة المرور الجديدة
              </FormLabel>
              <InputGroup>
                <Input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل"
                  borderRadius="lg"
                  dir="ltr"
                />
                <InputRightElement>
                  <IconButton
                    aria-label={showPass ? "إخفاء" : "إظهار"}
                    icon={showPass ? <MdVisibilityOff /> : <MdVisibility />}
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPass((v) => !v)}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="600">
                تأكيد كلمة المرور
              </FormLabel>
              <Input
                type={showPass ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="أعد الكتابة"
                borderRadius="lg"
                dir="ltr"
              />
            </FormControl>

            <HStack justify="space-between">
              <Button
                size="sm"
                variant="outline"
                borderRadius="lg"
                leftIcon={<MdVpnKey />}
                onClick={() => {
                  const generated = generateTempPassword();
                  setPassword(generated);
                  setConfirm(generated);
                  setShowPass(true);
                }}
                cursor="pointer"
              >
                توليد كلمة سر
              </Button>
              {password ? (
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<MdContentCopy />}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(password);
                      toast({
                        title: "تم النسخ",
                        status: "info",
                        duration: 2000,
                        isClosable: true,
                      });
                    } catch {
                      /* ignore */
                    }
                  }}
                  cursor="pointer"
                >
                  نسخ
                </Button>
              ) : null}
            </HStack>

            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <FormLabel mb={0} fontSize="sm" fontWeight="600">
                  إجبار تغيير كلمة السر عند الدخول
                </FormLabel>
                <FormHelperText mt={1} fontSize="xs">
                  must_change_password
                </FormHelperText>
              </Box>
              <Switch
                colorScheme="blue"
                isChecked={mustChange}
                onChange={(e) => setMustChange(e.target.checked)}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={onClose} isDisabled={saving} borderRadius="lg">
            إلغاء
          </Button>
          <Button
            bg={AD_BLUE}
            color="white"
            _hover={{ bg: "#2B6CB0" }}
            onClick={handleSubmit}
            isLoading={saving}
            borderRadius="lg"
            leftIcon={<MdLockReset />}
            cursor="pointer"
          >
            حفظ كلمة السر
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function StudentCard({ student, onChangePassword }) {
  const [openCodes, setOpenCodes] = useState(false);
  const border = useColorModeValue("gray.200", "gray.700");
  const cardBg = useColorModeValue("white", "gray.800");
  const softBg = useColorModeValue("#F7FAFC", "whiteAlpha.50");
  const muted = useColorModeValue("gray.500", "gray.400");
  const title = useColorModeValue("gray.900", "white");
  const codes = Array.isArray(student.activation_codes) ? student.activation_codes : [];
  const grades = Array.isArray(student.grades) ? student.grades : [];
  const subscribed = !!student.is_subscribed;
  const statusKey = String(student.account_status || "").toLowerCase();

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={border}
      borderRadius="2xl"
      overflow="hidden"
      transition="box-shadow 0.18s, border-color 0.18s, transform 0.18s"
      _hover={{
        borderColor: `${AD_BLUE}66`,
        boxShadow: "0 12px 28px rgba(15,23,42,0.08)",
      }}
    >
      <Box h="3px" bg={`linear-gradient(90deg, ${AD_BLUE}, ${AD_ORANGE})`} />

      <Flex
        direction={{ base: "column", lg: "row" }}
        gap={{ base: 4, lg: 5 }}
        p={{ base: 4, md: 5 }}
        align={{ lg: "center" }}
      >
        <HStack spacing={3.5} flex={1} minW={0} align="flex-start">
          <Avatar
            name={student.name || student.email || "طالب"}
            src={student.avatar || undefined}
            size="lg"
            bg={AD_BLUE}
            color="white"
            flexShrink={0}
          />
          <Box minW={0} flex={1}>
            <HStack spacing={2} flexWrap="wrap" mb={1.5}>
              <Text fontWeight="800" color={title} fontSize={{ base: "md", md: "lg" }} noOfLines={1}>
                {student.name || "بدون اسم"}
              </Text>
              <Badge
                colorScheme={subscribed ? "green" : "orange"}
                borderRadius="full"
                px={2.5}
                fontSize="xs"
                fontWeight="700"
              >
                {student.subscription_label || (subscribed ? "مشترك" : "غير مشترك")}
              </Badge>
              {statusKey ? (
                <Badge
                  colorScheme={statusKey === "active" ? "blue" : statusKey === "suspended" ? "red" : "gray"}
                  variant="subtle"
                  borderRadius="full"
                  px={2.5}
                  fontSize="xs"
                >
                  {STATUS_LABEL[statusKey] || student.account_status}
                </Badge>
              ) : null}
            </HStack>

            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={1.5} maxW="560px">
              {student.email ? (
                <HStack spacing={1.5} minW={0}>
                  <Icon as={MdEmail} boxSize={3.5} color={AD_BLUE} flexShrink={0} />
                  <Text
                    as="a"
                    href={`mailto:${student.email}`}
                    fontSize="sm"
                    color={AD_BLUE}
                    fontWeight="600"
                    dir="ltr"
                    noOfLines={1}
                    cursor="pointer"
                    _hover={{ textDecoration: "underline" }}
                  >
                    {student.email}
                  </Text>
                </HStack>
              ) : (
                <Text fontSize="sm" color={muted}>
                  بدون إيميل
                </Text>
              )}
              {student.phone ? (
                <HStack spacing={1.5}>
                  <Icon as={MdPhone} boxSize={3.5} color={AD_ORANGE} flexShrink={0} />
                  <Text fontSize="sm" color={muted} dir="ltr">
                    {student.phone}
                  </Text>
                </HStack>
              ) : null}
            </SimpleGrid>

            <HStack spacing={2} flexWrap="wrap" mt={2.5}>
              {student.student_code ? (
                <Badge
                  fontFamily="mono"
                  fontSize="xs"
                  borderRadius="md"
                  bg={`${AD_BLUE}12`}
                  color={AD_BLUE}
                  px={2}
                >
                  {student.student_code}
                </Badge>
              ) : null}
              <Text fontSize="xs" color={muted}>
                انضم {formatDate(student.created_at)}
              </Text>
              {student.parent_phone ? (
                <Text fontSize="xs" color={muted} dir="ltr">
                  ولي الأمر: {student.parent_phone}
                </Text>
              ) : null}
            </HStack>

            {grades.length > 0 ? (
              <HStack spacing={1.5} mt={2.5} flexWrap="wrap">
                <Icon as={MdSchool} boxSize={3.5} color={muted} />
                {grades.map((g) => (
                  <Badge
                    key={g.id || g.slug || g.name}
                    variant="outline"
                    borderRadius="md"
                    fontSize="xs"
                    borderColor={border}
                  >
                    {g.name}
                  </Badge>
                ))}
              </HStack>
            ) : null}
          </Box>
        </HStack>

        <HStack
          spacing={2}
          flexShrink={0}
          bg={softBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={border}
          px={3}
          py={2.5}
          minW={{ lg: "240px" }}
          justify="space-around"
        >
          {[
            { label: "تسجيل", value: student.enrollments_count },
            { label: "نشط", value: student.active_enrollments_count },
            { label: "باقات", value: student.package_activations_count },
          ].map((stat) => (
            <VStack key={stat.label} spacing={0}>
              <Text fontSize="md" fontWeight="800" color={title}>
                {formatNumber(stat.value)}
              </Text>
              <Text fontSize="xs" color={muted}>
                {stat.label}
              </Text>
            </VStack>
          ))}
        </HStack>

        <Tooltip label="تغيير كلمة السر" hasArrow>
          <Button
            size="sm"
            leftIcon={<MdLockReset />}
            bg={AD_ORANGE}
            color="white"
            borderRadius="lg"
            fontWeight="700"
            flexShrink={0}
            cursor="pointer"
            _hover={{ bg: "#C05621" }}
            onClick={() => onChangePassword?.(student)}
            alignSelf={{ base: "stretch", lg: "center" }}
          >
            كلمة السر
          </Button>
        </Tooltip>
      </Flex>

      <Divider borderColor={border} />

      <Box px={4} py={2}>
        <Button
          variant="ghost"
          size="sm"
          w="full"
          justifyContent="space-between"
          rightIcon={openCodes ? <MdExpandLess /> : <MdExpandMore />}
          leftIcon={<MdVpnKey />}
          onClick={() => setOpenCodes((v) => !v)}
          cursor="pointer"
          color={muted}
          fontWeight="600"
          borderRadius="lg"
        >
          أكواد التفعيل ({codes.length})
        </Button>
        <Collapse in={openCodes} animateOpacity>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2} pb={3} pt={1}>
            {codes.length === 0 ? (
              <Text fontSize="xs" color={muted} textAlign="center" py={2} gridColumn="1 / -1">
                لا توجد أكواد تفعيل مسجّلة
              </Text>
            ) : (
              codes.map((code, idx) => (
                <Box
                  key={`${code.code}-${idx}`}
                  bg={softBg}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={border}
                  px={3}
                  py={2.5}
                >
                  <HStack justify="space-between" flexWrap="wrap" gap={2}>
                    <Badge colorScheme="blue" variant="subtle" borderRadius="md" fontSize="xs">
                      {CODE_TYPE_LABEL[code.type] || code.type}
                    </Badge>
                    <Text fontFamily="mono" fontSize="xs" fontWeight="700" dir="ltr">
                      {code.code}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color={title} mt={1.5} noOfLines={1} fontWeight="600">
                    {code.target_title || "—"}
                  </Text>
                  <Text fontSize="xs" color={muted} mt={0.5}>
                    استُخدم {formatDate(code.used_at)}
                  </Text>
                </Box>
              ))
            )}
          </SimpleGrid>
        </Collapse>
      </Box>
    </Box>
  );
}

export default function AdminAllStudentsPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTenantId = searchParams.get("tenantId") || "";
  const {
    isOpen: isPasswordOpen,
    onOpen: onPasswordOpen,
    onClose: onPasswordClose,
  } = useDisclosure();
  const [passwordStudent, setPasswordStudent] = useState(null);

  const [tenants, setTenants] = useState([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [tenantId, setTenantId] = useState(initialTenantId);

  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({ total: 0, subscribed: 0, not_subscribed: 0 });
  const [tenantInfo, setTenantInfo] = useState(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [subscribedFilter, setSubscribedFilter] = useState("");
  const [accountStatus, setAccountStatus] = useState("");
  const searchTimeoutRef = useRef(null);

  const pageBg = useColorModeValue("#F4F7FB", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const title = useColorModeValue("gray.900", "white");
  const inputBg = useColorModeValue("white", "gray.700");

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setOffset(0);
    }, 350);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchInput]);

  useEffect(() => {
    let mounted = true;
    const loadTenants = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setTenantsLoading(false);
        return;
      }
      setTenantsLoading(true);
      try {
        const map = new Map();
        let offsetTenants = 0;
        const limit = 200;
        let safety = 0;
        while (mounted && safety < 30) {
          safety += 1;
          const result = await fetchAdminTenants(
            {
              limit,
              offset: offsetTenants,
              include_default: false,
              include_deleted: false,
            },
            token,
          );
          for (const t of result.tenants) {
            if (isDeletedTenant(t)) continue;
            map.set(String(t.id), t);
          }
          offsetTenants += result.tenants.length;
          if (!result.tenants.length || offsetTenants >= result.total) break;
        }
        if (!mounted) return;
        const list = Array.from(map.values()).sort((a, b) =>
          String(a.display_name || a.subdomain).localeCompare(
            String(b.display_name || b.subdomain),
            "ar",
          ),
        );
        setTenants(list);
        if (!tenantId && list.length) {
          setTenantId(String(list[0].id));
        }
      } catch {
        if (mounted) setTenants([]);
      } finally {
        if (mounted) setTenantsLoading(false);
      }
    };
    loadTenants();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStudents = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token || !tenantId) {
      setStudents([]);
      setSummary({ total: 0, subscribed: 0, not_subscribed: 0 });
      setTenantInfo(null);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminTenantStudents(
        tenantId,
        {
          limit: PAGE_SIZE,
          offset,
          search: debouncedSearch,
          is_subscribed:
            subscribedFilter === "true"
              ? true
              : subscribedFilter === "false"
                ? false
                : "",
          account_status: accountStatus,
        },
        token,
      );
      setStudents(result.students);
      setSummary(result.summary || { total: 0, subscribed: 0, not_subscribed: 0 });
      setTenantInfo(result.tenant);
      setTotal(Number(result.total) || 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "فشل تحميل الطلاب");
      setStudents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [tenantId, offset, debouncedSearch, subscribedFilter, accountStatus]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleTenantChange = (nextId) => {
    setTenantId(nextId);
    setOffset(0);
    const next = new URLSearchParams(searchParams);
    if (nextId) next.set("tenantId", nextId);
    else next.delete("tenantId");
    setSearchParams(next, { replace: true });
  };

  const selectedTenant = useMemo(
    () => tenants.find((t) => String(t.id) === String(tenantId)) || null,
    [tenants, tenantId],
  );

  const tenantLabel =
    tenantInfo?.display_name ||
    selectedTenant?.display_name ||
    tenantInfo?.subdomain ||
    selectedTenant?.subdomain ||
    "";

  const openPasswordModal = (student) => {
    if (!tenantId) {
      toast({
        title: "اختر منصة أولاً",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }
    setPasswordStudent(student);
    onPasswordOpen();
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <Box minH="100vh" bg={pageBg} pb={16} dir="rtl" className="mt-[80px]">
      <Container maxW="7xl" px={{ base: 3, md: 6 }} py={{ base: 5, md: 8 }}>
        <VStack align="stretch" spacing={5}>
          <Flex
            justify="space-between"
            align={{ base: "stretch", sm: "center" }}
            gap={3}
            direction={{ base: "column", sm: "row" }}
          >
            <Box>
              <HStack spacing={2} mb={1}>
                <Icon as={MdPeople} color={AD_BLUE} boxSize={6} />
                <Heading size="md" fontWeight="800" color={title}>
                  كل الطلاب
                </Heading>
              </HStack>
              <Text fontSize="sm" color={muted}>
                إدارة طلاب المنصات — بحث، فلترة، وتغيير كلمات السر
              </Text>
            </Box>
            <Tooltip label="تحديث" hasArrow>
              <IconButton
                aria-label="تحديث"
                icon={<MdRefresh />}
                onClick={loadStudents}
                isLoading={loading}
                variant="outline"
                borderColor={border}
                borderRadius="lg"
                cursor="pointer"
                alignSelf={{ base: "flex-end", sm: "center" }}
              />
            </Tooltip>
          </Flex>

          <Box
            bg={cardBg}
            border="1px solid"
            borderColor={border}
            borderRadius="2xl"
            p={{ base: 3, md: 4 }}
            boxShadow="sm"
          >
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={3}>
              <FormControl>
                <FormLabel fontSize="xs" color={muted} mb={1}>
                  المنصة
                </FormLabel>
                <Select
                  size="sm"
                  borderRadius="lg"
                  bg={inputBg}
                  value={tenantId}
                  onChange={(e) => handleTenantChange(e.target.value)}
                  isDisabled={tenantsLoading || !tenants.length}
                >
                  {!tenants.length ? <option value="">لا توجد منصات</option> : null}
                  {tenants.map((t) => (
                    <option key={t.id} value={String(t.id)}>
                      {t.display_name || t.subdomain} ({t.subdomain})
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" color={muted} mb={1}>
                  بحث
                </FormLabel>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={MdSearch} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="اسم، إيميل، هاتف، كود..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    bg={inputBg}
                    borderRadius="lg"
                  />
                  {searchInput ? (
                    <IconButton
                      aria-label="مسح"
                      icon={<MdClose />}
                      size="xs"
                      variant="ghost"
                      position="absolute"
                      left={1}
                      top="50%"
                      transform="translateY(-50%)"
                      zIndex={2}
                      onClick={() => setSearchInput("")}
                    />
                  ) : null}
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" color={muted} mb={1}>
                  الاشتراك
                </FormLabel>
                <Select
                  size="sm"
                  borderRadius="lg"
                  bg={inputBg}
                  value={subscribedFilter}
                  onChange={(e) => {
                    setSubscribedFilter(e.target.value);
                    setOffset(0);
                  }}
                >
                  <option value="">الكل</option>
                  <option value="true">مشترك</option>
                  <option value="false">غير مشترك</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" color={muted} mb={1}>
                  حالة الحساب
                </FormLabel>
                <Select
                  size="sm"
                  borderRadius="lg"
                  bg={inputBg}
                  value={accountStatus}
                  onChange={(e) => {
                    setAccountStatus(e.target.value);
                    setOffset(0);
                  }}
                >
                  <option value="">الكل</option>
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                  <option value="suspended">موقوف</option>
                </Select>
              </FormControl>
            </SimpleGrid>

            {tenantLabel ? (
              <Text fontSize="xs" color={muted} mt={3}>
                المنصة الحالية:{" "}
                <Text as="span" fontWeight="700" color={title}>
                  {tenantLabel}
                </Text>
                {tenantInfo?.subdomain || selectedTenant?.subdomain ? (
                  <Text as="span" fontFamily="mono" ms={2}>
                    ({tenantInfo?.subdomain || selectedTenant?.subdomain})
                  </Text>
                ) : null}
              </Text>
            ) : null}
          </Box>

          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
            <SummaryCard label="إجمالي الطلاب" value={summary.total} color="blue" icon={MdPeople} />
            <SummaryCard label="مشترك" value={summary.subscribed} color="green" icon={FaCheckCircle} />
            <SummaryCard
              label="غير مشترك"
              value={summary.not_subscribed}
              color="orange"
              icon={FaTimesCircle}
            />
          </SimpleGrid>

          {tenantsLoading ? (
            <Flex justify="center" py={16}>
              <Spinner color={AD_BLUE} size="lg" />
            </Flex>
          ) : !tenantId ? (
            <Box
              textAlign="center"
              py={16}
              bg={cardBg}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor={border}
            >
              <Text color={muted}>اختر منصة لعرض طلابها</Text>
            </Box>
          ) : loading ? (
            <Flex justify="center" align="center" direction="column" gap={3} py={16}>
              <Spinner color={AD_BLUE} size="lg" />
              <Text fontSize="sm" color={muted}>
                جاري تحميل الطلاب...
              </Text>
            </Flex>
          ) : error ? (
            <Box
              textAlign="center"
              py={12}
              bg={cardBg}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor={border}
            >
              <Text color="red.500" fontWeight="600" mb={3} fontSize="sm">
                {error}
              </Text>
              <Button size="sm" colorScheme="blue" onClick={loadStudents} borderRadius="lg">
                إعادة المحاولة
              </Button>
            </Box>
          ) : students.length === 0 ? (
            <Box
              textAlign="center"
              py={14}
              bg={cardBg}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor={border}
            >
              <Icon as={MdPeople} boxSize={10} color={muted} mb={3} opacity={0.45} />
              <Text fontWeight="700" color={title} mb={1}>
                لا يوجد طلاب
              </Text>
              <Text fontSize="sm" color={muted}>
                {debouncedSearch || subscribedFilter || accountStatus
                  ? "لا نتائج مطابقة للفلاتر الحالية"
                  : "لم يُسجَّل طلاب في هذه المنصة بعد"}
              </Text>
            </Box>
          ) : (
            <>
              <Text fontSize="xs" color={muted}>
                عرض {formatNumber(students.length)} من {formatNumber(total)}
              </Text>
              <VStack align="stretch" spacing={3.5}>
                {students.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onChangePassword={openPasswordModal}
                  />
                ))}
              </VStack>

              {totalPages > 1 ? (
                <Flex
                  justify="space-between"
                  align="center"
                  flexWrap="wrap"
                  gap={2}
                  bg={cardBg}
                  borderRadius="2xl"
                  borderWidth="1px"
                  borderColor={border}
                  px={4}
                  py={3}
                >
                  <Text fontSize="xs" color={muted}>
                    صفحة {page} من {totalPages}
                  </Text>
                  <HStack spacing={2}>
                    <Button
                      size="xs"
                      variant="outline"
                      borderRadius="md"
                      isDisabled={offset === 0}
                      onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
                    >
                      السابق
                    </Button>
                    <Button
                      size="xs"
                      bg={AD_BLUE}
                      color="white"
                      borderRadius="md"
                      _hover={{ bg: "#2B6CB0" }}
                      isDisabled={offset + PAGE_SIZE >= total}
                      onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
                    >
                      التالي
                    </Button>
                  </HStack>
                </Flex>
              ) : null}
            </>
          )}
        </VStack>
      </Container>

      <ChangePasswordModal
        isOpen={isPasswordOpen}
        onClose={() => {
          onPasswordClose();
          setPasswordStudent(null);
        }}
        student={passwordStudent}
        tenantId={tenantId}
        tenantLabel={tenantLabel}
      />
    </Box>
  );
}
