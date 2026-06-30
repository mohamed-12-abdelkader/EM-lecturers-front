import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  SimpleGrid,
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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  MdSearch,
  MdClose,
  MdPeople,
  MdSchool,
  MdMenuBook,
  MdPublic,
  MdEmail,
  MdPhone,
  MdOpenInNew,
  MdRefresh,
  MdDomain,
  MdEdit,
} from "react-icons/md";
import { FaChalkboardTeacher, FaLayerGroup } from "react-icons/fa";
import {
  fetchAdminTenants,
  getTenantPlatformUrl,
} from "../../../api/adminTenantsApi";

const MotionBox = motion(Box);
const PAGE_SIZE = 12;

const PACKAGE_META = {
  bronze: { label: "برونزية", colorScheme: "orange" },
  silver: { label: "فضية", colorScheme: "gray" },
  gold: { label: "ذهبية", colorScheme: "yellow" },
  platinum: { label: "بلاتينية", colorScheme: "purple" },
};

function getPackageMeta(pkg) {
  const key = String(pkg || "bronze").toLowerCase();
  return PACKAGE_META[key] || { label: key, colorScheme: "blue" };
}

const cardGradients = [
  "linear-gradient(135deg, #4299E1 0%, #3182CE 100%)",
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #DD6B20 0%, #C05621 100%)",
  "linear-gradient(135deg, #38B2AC 0%, #319795 100%)",
];

function formatNumber(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("ar-EG");
}

function TenantCard({ tenant, index }) {
  const navigate = useNavigate();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const surface = useColorModeValue("gray.50", "whiteAlpha.50");
  const gradient = cardGradients[index % cardGradients.length];
  const owner = tenant.owner || null;
  const stats = tenant.stats || {};
  const platformUrl = getTenantPlatformUrl(tenant.subdomain);
  const avatarSrc = tenant.avatar_url || owner?.avatar || undefined;
  const packageMeta = getPackageMeta(owner?.subscription_package);
  const specialty = tenant.specialty || owner?.subject;

  const handleEdit = () => {
    navigate(`/admin/addteacher?mode=edit&tenantId=${tenant.id}`, {
      state: { tenant },
    });
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % PAGE_SIZE) * 0.04, duration: 0.35 }}
      h="full"
    >
      <Box
        h="full"
        bg={cardBg}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor={borderColor}
        overflow="hidden"
        boxShadow="lg"
        position="relative"
        display="flex"
        flexDirection="column"
        _hover={{
          transform: "translateY(-4px)",
          boxShadow: "xl",
          borderColor: "blue.200",
        }}
        transition="all 0.25s ease"
      >
        <Box h="5px" bgGradient={gradient} />
        <Box p={{ base: 4, md: 5 }} flex="1" display="flex" flexDirection="column">
          <Flex justify="space-between" align="start" gap={3} mb={3}>
            <HStack align="start" spacing={3} minW={0} flex={1}>
              <Avatar
                name={tenant.display_name || tenant.subdomain}
                src={avatarSrc}
                size={{ base: "md", md: "lg" }}
                bgGradient={!avatarSrc ? gradient : undefined}
                color="white"
                fontWeight="bold"
                flexShrink={0}
              />
              <VStack align="start" spacing={1.5} minW={0} flex={1}>
                <Heading size={{ base: "sm", md: "md" }} noOfLines={2} lineHeight="1.4">
                  {tenant.display_name || tenant.subdomain}
                </Heading>
                <HStack spacing={2} flexWrap="wrap">
                  <Badge
                    colorScheme="blue"
                    variant="subtle"
                    borderRadius="md"
                    fontFamily="mono"
                    fontSize="xs"
                    maxW="full"
                    noOfLines={1}
                  >
                    {tenant.subdomain}
                  </Badge>
                  {specialty ? (
                    <Badge colorScheme="purple" variant="subtle" fontSize="xs">
                      {specialty}
                    </Badge>
                  ) : null}
                </HStack>
                <HStack spacing={2} flexWrap="wrap">
                  <Badge
                    colorScheme={tenant.is_active ? "green" : "red"}
                    borderRadius="full"
                    px={2}
                    fontSize="xs"
                  >
                    {tenant.is_active ? "نشطة" : "موقوفة"}
                  </Badge>
                  {owner?.subscription_package ? (
                    <Badge
                      colorScheme={packageMeta.colorScheme}
                      variant="solid"
                      borderRadius="full"
                      px={2}
                      fontSize="xs"
                    >
                      باقة {packageMeta.label}
                    </Badge>
                  ) : null}
                </HStack>
              </VStack>
            </HStack>
            <HStack spacing={1} flexShrink={0}>
              <Tooltip label="تعديل المنصة" hasArrow>
                <IconButton
                  aria-label="تعديل المنصة"
                  icon={<MdEdit />}
                  size="sm"
                  colorScheme="orange"
                  variant="outline"
                  borderRadius="lg"
                  onClick={handleEdit}
                />
              </Tooltip>
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
                  colorScheme="blue"
                  borderRadius="lg"
                />
              </Tooltip>
            </HStack>
          </Flex>

          {tenant.bio ? (
            <Text fontSize="xs" color={muted} noOfLines={2} mb={3} lineHeight="1.7">
              {tenant.bio.replace(/\r\n/g, " ")}
            </Text>
          ) : null}

          <Box
            mb={4}
            p={3}
            borderRadius="xl"
            bg={surface}
            borderWidth="1px"
            borderColor={borderColor}
            flex="1"
          >
            <Text fontSize="xs" color={muted} mb={2} fontWeight="semibold">
              مالك المنصة
            </Text>
            {owner?.name ? (
              <HStack spacing={3} align="start">
                <Avatar name={owner.name} src={owner.avatar} size="sm" />
                <VStack align="start" spacing={1} minW={0} flex={1}>
                  <Text fontWeight="700" fontSize="sm" noOfLines={1}>
                    {owner.name}
                  </Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {owner.subject ? (
                      <Badge colorScheme="purple" variant="outline" fontSize="xs">
                        {owner.subject}
                      </Badge>
                    ) : null}
                    {owner.account_status ? (
                      <Badge
                        fontSize="xs"
                        colorScheme={owner.account_status === "active" ? "green" : "orange"}
                        variant="subtle"
                      >
                        {owner.account_status === "active" ? "حساب نشط" : owner.account_status}
                      </Badge>
                    ) : null}
                  </HStack>
                  {owner.email ? (
                    <HStack spacing={1} color={muted} fontSize="xs" minW={0}>
                      <Icon as={MdEmail} flexShrink={0} />
                      <Text noOfLines={1} wordBreak="break-all">
                        {owner.email}
                      </Text>
                    </HStack>
                  ) : null}
                  {owner.phone ? (
                    <HStack spacing={1} color={muted} fontSize="xs" dir="ltr">
                      <Icon as={MdPhone} flexShrink={0} />
                      <Text>{owner.phone}</Text>
                    </HStack>
                  ) : null}
                </VStack>
              </HStack>
            ) : (
              <Text fontSize="sm" color={muted}>
                لا يوجد مالك مسجّل لهذه المنصة
              </Text>
            )}
          </Box>

          <SimpleGrid columns={3} spacing={{ base: 1.5, md: 2 }}>
            <Box textAlign="center" p={{ base: 2, md: 2.5 }} borderRadius="lg" bg={surface}>
              <Icon as={FaChalkboardTeacher} color="blue.500" boxSize={4} mb={1} />
              <Text fontWeight="800" fontSize={{ base: "md", md: "lg" }} lineHeight="1">
                {formatNumber(stats.teachers_count)}
              </Text>
              <Text fontSize="xs" color={muted}>
                مدرس
              </Text>
            </Box>
            <Box textAlign="center" p={{ base: 2, md: 2.5 }} borderRadius="lg" bg={surface}>
              <Icon as={MdMenuBook} color="orange.500" boxSize={4} mb={1} />
              <Text fontWeight="800" fontSize={{ base: "md", md: "lg" }} lineHeight="1">
                {formatNumber(stats.courses_count)}
              </Text>
              <Text fontSize="xs" color={muted}>
                كورس
              </Text>
            </Box>
            <Box textAlign="center" p={{ base: 2, md: 2.5 }} borderRadius="lg" bg={surface}>
              <Icon as={MdPeople} color="teal.500" boxSize={4} mb={1} />
              <Text fontWeight="800" fontSize={{ base: "md", md: "lg" }} lineHeight="1">
                {formatNumber(stats.students_count)}
              </Text>
              <Text fontSize="xs" color={muted}>
                طالب
              </Text>
            </Box>
          </SimpleGrid>

          <Button
            mt={4}
            w="full"
            size="sm"
            colorScheme="orange"
            variant="outline"
            borderRadius="xl"
            leftIcon={<MdEdit />}
            onClick={handleEdit}
          >
            تعديل المنصة
          </Button>
        </Box>
      </Box>
    </MotionBox>
  );
}

export default function AdminTenantsPanel({ onSummaryChange }) {
  const [tenants, setTenants] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [packageFilter, setPackageFilter] = useState("");
  const [includeDefault, setIncludeDefault] = useState(true);
  const searchTimeoutRef = useRef(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const muted = useColorModeValue("gray.500", "gray.400");
  const inputBg = useColorModeValue("white", "gray.700");
  const kpiBg = useColorModeValue("white", "gray.800");
  const emptyBg = useColorModeValue("blue.50", "whiteAlpha.50");

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
  }, [offset, debouncedSearch, activeFilter, includeDefault]);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

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
    <VStack align="stretch" spacing={6}>
      <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={{ base: 3, md: 4 }}>
        {[
          {
            label: "إجمالي المنصات",
            value: formatNumber(total),
            help: "في النظام",
            icon: MdDomain,
            color: "blue.500",
            iconBg: "blue.50",
          },
          {
            label: "نشطة (الصفحة)",
            value: formatNumber(aggregateStats.active),
            help: "من المعروض",
            icon: MdPublic,
            color: "green.500",
            iconBg: "green.50",
          },
          {
            label: "طلاب (الصفحة)",
            value: formatNumber(aggregateStats.students),
            help: "مجموع الصفحة الحالية",
            icon: MdPeople,
            color: "teal.500",
            iconBg: "teal.50",
          },
          {
            label: "كورسات (الصفحة)",
            value: formatNumber(aggregateStats.courses),
            help: "مجموع الصفحة الحالية",
            icon: MdSchool,
            color: "orange.500",
            iconBg: "orange.50",
          },
        ].map((item) => (
          <Box
            key={item.label}
            bg={kpiBg}
            borderRadius="2xl"
            p={4}
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="md"
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              h="3px"
              bgGradient="linear(to-r, #4299E1, #DD6B20)"
            />
            <HStack justify="space-between" align="start">
              <Stat size="sm">
                <StatLabel color={muted} fontSize="xs">
                  {item.label}
                </StatLabel>
                <StatNumber fontSize="2xl">{item.value}</StatNumber>
                <StatHelpText mb={0} fontSize="xs">
                  {item.help}
                </StatHelpText>
              </Stat>
              <Flex
                w={10}
                h={10}
                borderRadius="xl"
                bg={item.iconBg}
                align="center"
                justify="center"
              >
                <Icon as={item.icon} color={item.color} boxSize={5} />
              </Flex>
            </HStack>
          </Box>
        ))}
      </SimpleGrid>

      <Box
        bg={cardBg}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor={borderColor}
        boxShadow="lg"
        overflow="hidden"
      >
        <Box h="4px" bgGradient="linear(to-r, #4299E1, #DD6B20)" />
        <Box p={{ base: 4, md: 6 }}>
          <Flex
            direction={{ base: "column", lg: "row" }}
            gap={4}
            align={{ lg: "center" }}
            justify="space-between"
            mb={5}
          >
            <VStack align="start" spacing={1}>
              <HStack>
                <Icon as={FaLayerGroup} color="blue.500" boxSize={5} />
                <Heading size="md">منصات المدرسين</Heading>
              </HStack>
              <Text fontSize="sm" color={muted}>
                إدارة ومراقبة جميع المنصات التعليمية المستقلة
              </Text>
            </VStack>

            <HStack spacing={2}>
              <Tooltip label="تحديث" hasArrow>
                <IconButton
                  aria-label="تحديث"
                  icon={<MdRefresh />}
                  variant="outline"
                  colorScheme="blue"
                  borderRadius="xl"
                  onClick={loadTenants}
                  isLoading={loading}
                />
              </Tooltip>
            </HStack>
          </Flex>

          <SimpleGrid
            columns={{ base: 1, sm: 2, lg: 3, xl: 5 }}
            spacing={3}
            mb={5}
          >
            <InputGroup size="md">
              <InputLeftElement pointerEvents="none">
                <Icon as={MdSearch} color="blue.400" />
              </InputLeftElement>
              <Input
                placeholder="بحث: subdomain، اسم المنصة، المالك..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                bg={inputBg}
                borderRadius="xl"
                pr={searchInput ? 10 : 4}
              />
              {searchInput && (
                <Button
                  position="absolute"
                  left={1}
                  top="50%"
                  transform="translateY(-50%)"
                  size="xs"
                  variant="ghost"
                  onClick={() => setSearchInput("")}
                  zIndex={2}
                >
                  <Icon as={MdClose} />
                </Button>
              )}
            </InputGroup>

            <Select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setOffset(0);
              }}
              bg={inputBg}
              borderRadius="xl"
            >
              <option value="">كل الحالات</option>
              <option value="true">نشطة فقط</option>
              <option value="false">موقوفة فقط</option>
            </Select>

            <Select
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
              bg={inputBg}
              borderRadius="xl"
            >
              <option value="">كل الباقات</option>
              <option value="bronze">برونزية</option>
              <option value="silver">فضية</option>
              <option value="gold">ذهبية</option>
              <option value="platinum">بلاتينية</option>
            </Select>

            <FormControl
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              px={3}
              py={2}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="xl"
              bg={inputBg}
            >
              <FormLabel htmlFor="include-default" mb={0} fontSize="sm">
                إظهار المنصة الرئيسية
              </FormLabel>
              <Switch
                id="include-default"
                colorScheme="blue"
                isChecked={includeDefault}
                onChange={(e) => {
                  setIncludeDefault(e.target.checked);
                  setOffset(0);
                }}
              />
            </FormControl>

            <HStack
              justify="center"
              px={3}
              py={2}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="xl"
              bg={inputBg}
            >
              <Badge colorScheme="blue" borderRadius="full" px={3}>
                {formatNumber(total)}
              </Badge>
              <Text fontSize="sm" color={muted}>
                منصة
              </Text>
            </HStack>
          </SimpleGrid>

          {Object.keys(packageBreakdown).length > 0 ? (
            <HStack spacing={2} mb={4} flexWrap="wrap">
              {Object.entries(packageBreakdown).map(([pkg, count]) => {
                const meta = getPackageMeta(pkg);
                return (
                  <Badge
                    key={pkg}
                    colorScheme={meta.colorScheme}
                    variant="subtle"
                    borderRadius="full"
                    px={3}
                    py={1}
                    fontSize="xs"
                  >
                    {meta.label}: {formatNumber(count)}
                  </Badge>
                );
              })}
            </HStack>
          ) : null}

          {loading ? (
            <Flex justify="center" align="center" minH="280px" direction="column" gap={4}>
              <Spinner size="xl" color="blue.500" thickness="3px" />
              <Text color={muted}>جاري تحميل المنصات...</Text>
            </Flex>
          ) : error ? (
            <Box textAlign="center" py={12} px={4}>
              <Text color="red.500" fontWeight="semibold" mb={4}>
                {error}
              </Text>
              <Button colorScheme="blue" onClick={loadTenants} borderRadius="xl">
                إعادة المحاولة
              </Button>
            </Box>
          ) : filteredTenants.length === 0 ? (
            <Box
              textAlign="center"
              py={14}
              px={6}
              borderRadius="2xl"
              bg={emptyBg}
              borderWidth="2px"
              borderStyle="dashed"
              borderColor={borderColor}
            >
              <Icon as={MdDomain} boxSize={12} color={muted} mb={4} opacity={0.6} />
              <Heading size="sm" mb={2}>
                لا توجد منصات
              </Heading>
              <Text fontSize="sm" color={muted}>
                {debouncedSearch || packageFilter
                  ? "لم يُعثر على نتائج — جرّب تغيير البحث أو الفلاتر"
                  : "لم تُسجَّل منصات بعد في النظام"}
              </Text>
            </Box>
          ) : (
            <>
              <SimpleGrid
                columns={{ base: 1, md: 2, xl: 3, "2xl": 3 }}
                spacing={{ base: 4, md: 5 }}
              >
                {filteredTenants.map((tenant, index) => (
                  <TenantCard key={tenant.id} tenant={tenant} index={index} />
                ))}
              </SimpleGrid>

              {totalPages > 1 && (
                <Flex
                  mt={8}
                  justify="space-between"
                  align="center"
                  flexWrap="wrap"
                  gap={3}
                >
                  <Text fontSize="sm" color={muted}>
                    صفحة {page} من {totalPages}
                  </Text>
                  <HStack>
                    <Button
                      size="sm"
                      variant="outline"
                      borderRadius="xl"
                      onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
                      isDisabled={offset === 0}
                    >
                      السابق
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      borderRadius="xl"
                      onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
                      isDisabled={offset + PAGE_SIZE >= total}
                    >
                      التالي
                    </Button>
                  </HStack>
                </Flex>
              )}
            </>
          )}
        </Box>
      </Box>
    </VStack>
  );
}
