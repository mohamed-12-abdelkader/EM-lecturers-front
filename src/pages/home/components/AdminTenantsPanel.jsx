import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
  Input,
  InputGroup,
  InputLeftElement,
  Flex,
  Avatar,
  Badge,
  Button,
  Select,
  Switch,
  FormControl,
  FormLabel,
  Spinner,
  IconButton,
  Tooltip,
  useToast,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  FormHelperText,
  useDisclosure,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  MdSearch,
  MdClose,
  MdPeople,
  MdMenuBook,
  MdOpenInNew,
  MdRefresh,
  MdDomain,
  MdEdit,
  MdDelete,
  MdEmail,
  MdPerson,
  MdContentCopy,
  MdLink,
  MdCheck,
} from "react-icons/md";
import { FaChalkboardTeacher } from "react-icons/fa";
import {
  fetchAdminTenants,
  deleteAdminTenant,
  getTenantPlatformUrl,
  isDefaultTenant,
  isDeletedTenant,
} from "../../../api/adminTenantsApi";
import { AD_BLUE, AD_ORANGE, AD_PACKAGE_META } from "../adminDashboardTheme";

const PAGE_SIZE = 12;

function getPackageMeta(pkg) {
  const key = String(pkg || "bronze").toLowerCase();
  return AD_PACKAGE_META[key] || { label: key, colorScheme: "blue" };
}

function formatNumber(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("ar-EG");
}

async function copyText(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback below */
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

function CopyableField({ icon, value, href, label, displayText, color = AD_BLUE }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const muted = useColorModeValue("gray.500", "gray.400");
  const copyTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  if (!value) return null;

  const handleCopy = async () => {
    const ok = await copyText(value);
    if (!ok) {
      toast({
        title: "تعذر النسخ",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    setCopied(true);
    toast({
      title: `تم نسخ ${label}`,
      status: "success",
      duration: 1600,
      isClosable: true,
    });
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <HStack spacing={1} minW={0} align="center">
      <Icon as={icon} boxSize={3.5} color={color} flexShrink={0} />
      <Text
        as={href ? "a" : "span"}
        href={href || undefined}
        target={href ? "_blank" : undefined}
        rel={href ? "noopener noreferrer" : undefined}
        fontSize="xs"
        color={href ? color : muted}
        fontWeight="600"
        dir="ltr"
        textAlign="start"
        noOfLines={1}
        flex={1}
        minW={0}
        cursor={href ? "pointer" : "default"}
        _hover={href ? { textDecoration: "underline" } : undefined}
        title={value}
      >
        {displayText || value}
      </Text>
      <Tooltip label={copied ? "تم النسخ" : `نسخ ${label}`} hasArrow>
        <IconButton
          aria-label={`نسخ ${label}`}
          icon={<Icon as={copied ? MdCheck : MdContentCopy} boxSize={3.5} />}
          size="xs"
          variant="ghost"
          color={copied ? "green.500" : muted}
          minW={6}
          h={6}
          borderRadius="md"
          flexShrink={0}
          cursor="pointer"
          onClick={handleCopy}
        />
      </Tooltip>
    </HStack>
  );
}

function TenantRow({ tenant, onDelete }) {
  const navigate = useNavigate();
  const border = useColorModeValue("gray.200", "gray.700");
  const cardBg = useColorModeValue("white", "gray.800");
  const softBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const muted = useColorModeValue("gray.500", "gray.400");
  const title = useColorModeValue("gray.900", "white");
  const owner = tenant.owner || null;
  const stats = tenant.stats || {};
  const platformUrl = getTenantPlatformUrl(tenant.subdomain);
  const avatarSrc = tenant.avatar_url || owner?.avatar || undefined;
  const packageMeta = getPackageMeta(owner?.subscription_package);
  const specialty = tenant.specialty || owner?.subject;
  const ownerEmail =
    owner?.email ||
    owner?.owner_email ||
    owner?.user?.email ||
    tenant.owner_email ||
    null;
  const isDefault = isDefaultTenant(tenant);
  const isDeleted = isDeletedTenant(tenant);
  const canOpenPlatform = !isDeleted && platformUrl !== "#";

  const handleEdit = () => {
    navigate(`/admin/addteacher?mode=edit&tenantId=${tenant.id}`, {
      state: { tenant },
    });
  };

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={border}
      borderRadius="xl"
      overflow="hidden"
      transition="box-shadow 0.15s, border-color 0.15s"
      _hover={{
        borderColor: `${AD_BLUE}55`,
        boxShadow: "0 8px 24px rgba(49,130,206,0.08)",
      }}
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "center" }}
        gap={{ base: 3, md: 4 }}
        px={{ base: 3.5, md: 4 }}
        py={{ base: 3.5, md: 4 }}
      >
        <HStack spacing={3} flex={1} minW={0} align="flex-start">
          <Avatar
            name={tenant.display_name || tenant.subdomain}
            src={avatarSrc}
            size="md"
            bg={AD_BLUE}
            color="white"
            flexShrink={0}
            mt={0.5}
          />
          <Box minW={0} flex={1}>
            <HStack spacing={2} flexWrap="wrap" align="center">
              <Text fontWeight="800" color={title} noOfLines={1} fontSize="md">
                {tenant.display_name || tenant.subdomain}
              </Text>
              <Badge
                colorScheme={isDeleted ? "red" : tenant.is_active ? "green" : "orange"}
                borderRadius="md"
                px={2}
                fontSize="xs"
                fontWeight="700"
              >
                {isDeleted ? "محذوفة" : tenant.is_active ? "نشطة" : "موقوفة"}
              </Badge>
              {owner?.subscription_package ? (
                <Badge
                  colorScheme={packageMeta.colorScheme}
                  variant="subtle"
                  borderRadius="md"
                  px={2}
                  fontSize="xs"
                >
                  {packageMeta.label}
                </Badge>
              ) : null}
            </HStack>

            <HStack spacing={2} mt={1.5} flexWrap="wrap">
              <Badge
                variant="outline"
                borderRadius="md"
                fontFamily="mono"
                fontSize="xs"
                fontWeight="600"
                color={AD_BLUE}
                borderColor={`${AD_BLUE}44`}
                px={2}
              >
                {tenant.subdomain}
              </Badge>
              {specialty ? (
                <Text fontSize="xs" color={muted} noOfLines={1}>
                  {specialty}
                </Text>
              ) : null}
            </HStack>

            <Box
              mt={2.5}
              px={2.5}
              py={2}
              borderRadius="lg"
              bg={softBg}
              borderWidth="1px"
              borderColor={border}
            >
              <VStack align="stretch" spacing={1.5}>
                {owner?.name ? (
                  <HStack spacing={1.5} minW={0}>
                    <Icon as={MdPerson} boxSize={3.5} color={AD_ORANGE} flexShrink={0} />
                    <Text fontSize="xs" color={title} fontWeight="700" noOfLines={1}>
                      {owner.name}
                    </Text>
                  </HStack>
                ) : !ownerEmail && !canOpenPlatform ? (
                  <Text fontSize="xs" color={muted}>
                    لا يوجد حساب مالك مرتبط
                  </Text>
                ) : null}

                {canOpenPlatform ? (
                  <CopyableField
                    icon={MdLink}
                    value={platformUrl}
                    href={platformUrl}
                    label="لينك المنصة"
                    color={AD_BLUE}
                  />
                ) : null}

                {ownerEmail ? (
                  <CopyableField
                    icon={MdEmail}
                    value={ownerEmail}
                    href={`mailto:${ownerEmail}`}
                    label="الإيميل"
                    color={AD_BLUE}
                  />
                ) : owner?.name || canOpenPlatform ? (
                  <Text fontSize="xs" color={muted}>
                    لا يوجد إيميل للمالك
                  </Text>
                ) : null}
              </VStack>
            </Box>
          </Box>
        </HStack>

        <HStack
          spacing={{ base: 3, md: 4 }}
          flexShrink={0}
          color={muted}
          fontSize="xs"
          px={{ md: 2 }}
          py={{ base: 2, md: 0 }}
          borderTopWidth={{ base: "1px", md: 0 }}
          borderColor={border}
          justify={{ base: "space-around", md: "center" }}
          minW={{ md: "210px" }}
        >
          <VStack spacing={0.5}>
            <HStack spacing={1}>
              <Icon as={FaChalkboardTeacher} boxSize={3.5} color={AD_BLUE} />
              <Text fontWeight="800" color={title} fontSize="sm">
                {formatNumber(stats.teachers_count)}
              </Text>
            </HStack>
            <Text>مدرس</Text>
          </VStack>
          <VStack spacing={0.5}>
            <HStack spacing={1}>
              <Icon as={MdMenuBook} boxSize={3.5} color={AD_ORANGE} />
              <Text fontWeight="800" color={title} fontSize="sm">
                {formatNumber(stats.courses_count)}
              </Text>
            </HStack>
            <Text>كورس</Text>
          </VStack>
          <VStack spacing={0.5}>
            <HStack spacing={1}>
              <Icon as={MdPeople} boxSize={3.5} color="teal.500" />
              <Text fontWeight="800" color={title} fontSize="sm">
                {formatNumber(stats.students_count)}
              </Text>
            </HStack>
            <Text>طالب</Text>
          </VStack>
        </HStack>

        <HStack
          spacing={1}
          flexShrink={0}
          justify={{ base: "flex-end", md: "flex-end" }}
          borderTopWidth={{ base: "1px", md: 0 }}
          borderColor={border}
          pt={{ base: 2, md: 0 }}
        >
          {!isDeleted ? (
            <Tooltip label="طلاب المنصة" hasArrow>
              <IconButton
                aria-label="عرض طلاب المنصة"
                icon={<MdPeople />}
                size="sm"
                variant="ghost"
                color={AD_BLUE}
                borderRadius="lg"
                cursor="pointer"
                onClick={() =>
                  navigate(`/admin/students?tenantId=${tenant.id}`)
                }
              />
            </Tooltip>
          ) : null}
          {!isDeleted ? (
            <Tooltip label="تعديل" hasArrow>
              <IconButton
                aria-label="تعديل المنصة"
                icon={<MdEdit />}
                size="sm"
                variant="ghost"
                color={AD_ORANGE}
                borderRadius="lg"
                cursor="pointer"
                onClick={handleEdit}
              />
            </Tooltip>
          ) : null}
          {canOpenPlatform ? (
            <Tooltip label="فتح المنصة" hasArrow>
              <IconButton
                as="a"
                href={platformUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="فتح المنصة"
                icon={<MdOpenInNew />}
                size="sm"
                variant="ghost"
                color={AD_BLUE}
                borderRadius="lg"
                cursor="pointer"
              />
            </Tooltip>
          ) : null}
          {!isDefault && !isDeleted && onDelete ? (
            <Tooltip label="حذف" hasArrow>
              <IconButton
                aria-label="حذف المنصة"
                icon={<MdDelete />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                borderRadius="lg"
                cursor="pointer"
                onClick={() => onDelete(tenant)}
              />
            </Tooltip>
          ) : null}
        </HStack>
      </Flex>
    </Box>
  );
}

export default function AdminTenantsPanel({ onSummaryChange }) {
  const toast = useToast();
  const cancelRef = useRef(null);
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } =
    useDisclosure();

  const [tenants, setTenants] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState(null);
  const [confirmSubdomain, setConfirmSubdomain] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [packageFilter, setPackageFilter] = useState("");
  const [includeDefault, setIncludeDefault] = useState(true);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const searchTimeoutRef = useRef(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const title = useColorModeValue("gray.900", "white");
  const inputBg = useColorModeValue("white", "gray.700");
  const emptyBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const headerBg = useColorModeValue("gray.50", "whiteAlpha.50");

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setOffset(0);
    }, 400);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchInput]);

  const loadTenants = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("يجب تسجيل الدخول أولاً");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminTenants(
        {
          limit: PAGE_SIZE,
          offset,
          search: debouncedSearch,
          is_active:
            activeFilter === "true"
              ? true
              : activeFilter === "false"
                ? false
                : "",
          include_default: includeDefault,
          include_deleted: includeDeleted,
        },
        token,
      );
      setTenants(result.tenants);
      setTotal(result.total);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "فشل تحميل المنصات");
      setTenants([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [offset, debouncedSearch, activeFilter, includeDefault, includeDeleted]);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const openDeleteDialog = (tenant) => {
    setTenantToDelete(tenant);
    setConfirmSubdomain("");
    onDeleteOpen();
  };

  const closeDeleteDialog = () => {
    if (deleting) return;
    setTenantToDelete(null);
    setConfirmSubdomain("");
    onDeleteClose();
  };

  const handleDeleteTenant = async () => {
    const token = localStorage.getItem("token");
    if (!tenantToDelete || !token) return;

    const expected = String(tenantToDelete.subdomain || "").trim().toLowerCase();
    const typed = confirmSubdomain.trim().toLowerCase();

    if (!expected || typed !== expected) {
      toast({
        title: "تأكيد غير صحيح",
        description: `اكتب subdomain المنصة بالضبط: ${tenantToDelete.subdomain}`,
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setDeleting(true);
    try {
      const result = await deleteAdminTenant(
        tenantToDelete.id,
        { confirm_subdomain: tenantToDelete.subdomain },
        token,
      );

      const archived = result?.data?.archived_subdomain;
      toast({
        title: result?.message || "تم حذف المنصة بنجاح",
        description: archived
          ? `تم أرشفة الاسم إلى: ${archived}`
          : "تم تعطيل المنصة وحساباتها",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      setTenantToDelete(null);
      setConfirmSubdomain("");
      onDeleteClose();
      await loadTenants();
    } catch (err) {
      toast({
        title: "فشل حذف المنصة",
        description: err.response?.data?.message || err.message || "حدث خطأ غير متوقع",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setDeleting(false);
    }
  };

  const filteredTenants = useMemo(() => {
    if (!packageFilter) return tenants;
    return tenants.filter(
      (tenant) =>
        String(tenant.owner?.subscription_package || "bronze").toLowerCase() ===
        packageFilter,
    );
  }, [tenants, packageFilter]);

  const packageBreakdown = useMemo(() => {
    return tenants.reduce((acc, tenant) => {
      const key = String(tenant.owner?.subscription_package || "bronze").toLowerCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [tenants]);

  const aggregateStats = useMemo(() => {
    return filteredTenants.reduce(
      (acc, tenant) => {
        const stats = tenant.stats || {};
        acc.teachers += Number(stats.teachers_count) || 0;
        acc.courses += Number(stats.courses_count) || 0;
        acc.students += Number(stats.students_count) || 0;
        if (tenant.is_active) acc.active += 1;
        return acc;
      },
      { teachers: 0, courses: 0, students: 0, active: 0 },
    );
  }, [filteredTenants]);

  useEffect(() => {
    onSummaryChange?.({
      total,
      active: aggregateStats.active,
      students: aggregateStats.students,
      courses: aggregateStats.courses,
      teachers: aggregateStats.teachers,
      packages: packageBreakdown,
    });
  }, [total, aggregateStats, packageBreakdown, onSummaryChange]);

  return (
    <VStack align="stretch" spacing={0}>
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="xl"
        overflow="hidden"
      >
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          gap={3}
          px={{ base: 4, md: 5 }}
          py={4}
          borderBottom="1px solid"
          borderColor={borderColor}
        >
          <Box>
            <HStack spacing={2}>
              <Icon as={MdDomain} color={AD_BLUE} boxSize={5} />
              <Heading size="sm" color={title} fontWeight="800">
                منصات المدرسين
              </Heading>
              <Badge
                borderRadius="md"
                bg={`${AD_BLUE}14`}
                color={AD_BLUE}
                fontWeight="800"
                px={2}
              >
                {formatNumber(total)}
              </Badge>
            </HStack>
            <Text fontSize="xs" color={muted} mt={1}>
              اسم المنصة · المالك · الإيميل · الإحصائيات
            </Text>
          </Box>

          <Tooltip label="تحديث" hasArrow>
            <IconButton
              aria-label="تحديث"
              icon={<MdRefresh />}
              size="sm"
              variant="outline"
              borderColor={borderColor}
              borderRadius="lg"
              onClick={loadTenants}
              isLoading={loading}
              cursor="pointer"
            />
          </Tooltip>
        </Flex>

        <Box px={{ base: 3, md: 4 }} py={3} bg={headerBg} borderBottom="1px solid" borderColor={borderColor}>
          <Flex direction={{ base: "column", lg: "row" }} gap={2} align={{ lg: "center" }}>
            <InputGroup size="sm" maxW={{ lg: "280px" }} flex={1}>
              <InputLeftElement pointerEvents="none">
                <Icon as={MdSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="بحث بالاسم أو subdomain أو الإيميل..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                bg={inputBg}
                borderRadius="lg"
                borderColor={borderColor}
              />
              {searchInput ? (
                <IconButton
                  aria-label="مسح البحث"
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

            <Select
              size="sm"
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setOffset(0);
              }}
              bg={inputBg}
              borderRadius="lg"
              borderColor={borderColor}
              maxW={{ lg: "140px" }}
            >
              <option value="">كل الحالات</option>
              <option value="true">نشطة</option>
              <option value="false">موقوفة</option>
            </Select>

            <Select
              size="sm"
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
              bg={inputBg}
              borderRadius="lg"
              borderColor={borderColor}
              maxW={{ lg: "140px" }}
            >
              <option value="">كل الباقات</option>
              <option value="bronze">برونزية</option>
              <option value="silver">فضية</option>
              <option value="gold">ذهبية</option>
              <option value="platinum">بلاتينية</option>
            </Select>

            <HStack spacing={4} flexWrap="wrap" ms={{ lg: "auto" }}>
              <FormControl display="flex" alignItems="center" w="auto">
                <FormLabel htmlFor="include-default" mb={0} fontSize="xs" me={2} whiteSpace="nowrap">
                  الرئيسية
                </FormLabel>
                <Switch
                  id="include-default"
                  size="sm"
                  colorScheme="blue"
                  isChecked={includeDefault}
                  onChange={(e) => {
                    setIncludeDefault(e.target.checked);
                    setOffset(0);
                  }}
                />
              </FormControl>
              <FormControl display="flex" alignItems="center" w="auto">
                <FormLabel htmlFor="include-deleted" mb={0} fontSize="xs" me={2} whiteSpace="nowrap">
                  المحذوفة
                </FormLabel>
                <Switch
                  id="include-deleted"
                  size="sm"
                  colorScheme="red"
                  isChecked={includeDeleted}
                  onChange={(e) => {
                    setIncludeDeleted(e.target.checked);
                    setOffset(0);
                  }}
                />
              </FormControl>
            </HStack>
          </Flex>
        </Box>

        {loading ? (
          <Flex justify="center" align="center" minH="240px" direction="column" gap={3}>
            <Spinner size="lg" color={AD_BLUE} thickness="3px" />
            <Text fontSize="sm" color={muted}>
              جاري تحميل المنصات...
            </Text>
          </Flex>
        ) : error ? (
          <Box textAlign="center" py={12} px={4}>
            <Text color="red.500" fontWeight="600" mb={3} fontSize="sm">
              {error}
            </Text>
            <Button size="sm" colorScheme="blue" onClick={loadTenants} borderRadius="lg">
              إعادة المحاولة
            </Button>
          </Box>
        ) : filteredTenants.length === 0 ? (
          <Box textAlign="center" py={14} px={6} bg={emptyBg}>
            <Icon as={MdDomain} boxSize={10} color={muted} mb={3} opacity={0.5} />
            <Text fontWeight="700" color={title} mb={1}>
              لا توجد منصات
            </Text>
            <Text fontSize="sm" color={muted}>
              {debouncedSearch || packageFilter
                ? "لم يُعثر على نتائج — جرّب تغيير البحث أو الفلاتر"
                : "لم تُسجَّل منصات بعد في النظام"}
            </Text>
          </Box>
        ) : (
          <>
            <VStack align="stretch" spacing={3} p={{ base: 3, md: 4 }}>
              {filteredTenants.map((tenant) => (
                <TenantRow
                  key={tenant.id}
                  tenant={tenant}
                  onDelete={openDeleteDialog}
                />
              ))}
            </VStack>

            {totalPages > 1 ? (
              <Flex
                px={4}
                py={3}
                justify="space-between"
                align="center"
                borderTop="1px solid"
                borderColor={borderColor}
                flexWrap="wrap"
                gap={2}
              >
                <Text fontSize="xs" color={muted}>
                  صفحة {page} من {totalPages}
                </Text>
                <HStack spacing={2}>
                  <Button
                    size="xs"
                    variant="outline"
                    borderRadius="md"
                    onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
                    isDisabled={offset === 0}
                  >
                    السابق
                  </Button>
                  <Button
                    size="xs"
                    bg={AD_BLUE}
                    color="white"
                    borderRadius="md"
                    _hover={{ bg: "#2B6CB0" }}
                    onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
                    isDisabled={offset + PAGE_SIZE >= total}
                  >
                    التالي
                  </Button>
                </HStack>
              </Flex>
            ) : null}
          </>
        )}
      </Box>

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={closeDeleteDialog}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent mx={4} borderRadius="xl">
            <AlertDialogHeader fontSize="md" fontWeight="800">
              حذف المنصة
            </AlertDialogHeader>
            <AlertDialogBody>
              <VStack align="stretch" spacing={4}>
                <Text fontSize="sm" lineHeight="1.8" color={muted}>
                  سيتم تعطيل المنصة{" "}
                  <Text as="span" fontWeight="700" color={title}>
                    {tenantToDelete?.display_name || tenantToDelete?.subdomain}
                  </Text>{" "}
                  وأرشفة الـ subdomain وتعطيل حسابات المالك والمعلمين والطلاب.
                </Text>
                <FormControl>
                  <FormLabel fontSize="sm" mb={1}>
                    للتأكيد، اكتب subdomain المنصة:
                  </FormLabel>
                  <Input
                    value={confirmSubdomain}
                    onChange={(e) => setConfirmSubdomain(e.target.value)}
                    placeholder={tenantToDelete?.subdomain || "subdomain"}
                    fontFamily="mono"
                    borderRadius="lg"
                    autoFocus
                  />
                  <FormHelperText fontSize="xs">
                    المطلوب: <strong>{tenantToDelete?.subdomain}</strong>
                  </FormHelperText>
                </FormControl>
              </VStack>
            </AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button
                ref={cancelRef}
                onClick={closeDeleteDialog}
                isDisabled={deleting}
                borderRadius="lg"
                size="sm"
              >
                إلغاء
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteTenant}
                isLoading={deleting}
                borderRadius="lg"
                size="sm"
                isDisabled={
                  !tenantToDelete ||
                  confirmSubdomain.trim().toLowerCase() !==
                    String(tenantToDelete?.subdomain || "").trim().toLowerCase()
                }
              >
                حذف المنصة
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
}
