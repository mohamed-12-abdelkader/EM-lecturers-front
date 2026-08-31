import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertIcon,
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  SimpleGrid,
  Spinner,
  Text,
  useColorModeValue,
  useToast,
  VStack,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import {
  FaHistory,
  FaRedo,
  FaSearch,
  FaTrashRestore,
  FaUndo,
} from "react-icons/fa";
import {
  MdDeleteSweep,
  MdGroups,
  MdPerson,
  MdQuiz,
  MdRestore,
  MdSchool,
  MdInsertDriveFile,
  MdPayments,
  MdMenuBook,
  MdVisibility,
} from "react-icons/md";
import { PaginationBar } from "../centerMgmt/components/UiBits";
import {
  fetchTeacherTrash,
  fetchTeacherTrashSummary,
  restoreTeacherTrashItem,
  trashApiError,
  trashRestoreKind,
  trashTypeMeta,
  TRASH_RESTORE,
  TRASH_TYPE_META,
} from "../../api/teacherTrashApi";

const PAGE_SIZE = 20;

const TYPE_ICONS = {
  center_group: MdGroups,
  center_student: MdPerson,
  platform_student: MdPerson,
  center_subscription: MdPayments,
  monthly_subscription: MdPayments,
  center_payment: MdPayments,
  payment: MdPayments,
  center_exam: MdQuiz,
  course: MdSchool,
  lecture: MdMenuBook,
  course_file: MdInsertDriveFile,
  teacher_file: MdInsertDriveFile,
  my_file: MdInsertDriveFile,
  file: MdInsertDriveFile,
  question: MdQuiz,
  lesson: MdMenuBook,
};

function formatDeletedAt(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function restoreBadge(kind) {
  if (kind === TRASH_RESTORE.FULL) {
    return { label: "استعادة كاملة", colorScheme: "green" };
  }
  if (kind === TRASH_RESTORE.PARTIAL) {
    return { label: "استعادة جزئية", colorScheme: "orange" };
  }
  return { label: "عرض فقط", colorScheme: "gray" };
}

export default function TeacherTrashPage() {
  const token = localStorage.getItem("token");
  const toast = useToast();
  const cancelRef = useRef();

  const [summary, setSummary] = useState({ total: 0, byType: {} });
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const heading = useColorModeValue("gray.800", "white");
  const chipBg = useColorModeValue("white", "gray.800");
  const chipActiveBg = useColorModeValue("blue.500", "blue.400");
  const heroGradient = useColorModeValue(
    "linear(to-br, blue.500, orange.500)",
    "linear(to-br, blue.600, orange.600)"
  );

  const typeOptions = useMemo(() => {
    const keys = new Set([
      ...Object.keys(TRASH_TYPE_META),
      ...Object.keys(summary.byType || {}),
    ]);
    return [...keys]
      .filter((type) => (summary.byType?.[type] ?? 0) > 0 || TRASH_TYPE_META[type])
      .map((type) => ({
        type,
        count: Number(summary.byType?.[type] || 0),
        ...trashTypeMeta(type),
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ar"));
  }, [summary]);

  const loadSummary = useCallback(async () => {
    if (!token) return;
    setSummaryLoading(true);
    try {
      const data = await fetchTeacherTrashSummary(token);
      setSummary(data);
    } catch {
      setSummary({ total: 0, byType: {} });
    } finally {
      setSummaryLoading(false);
    }
  }, [token]);

  const loadList = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTeacherTrash(
        { page, limit: PAGE_SIZE, type: typeFilter || undefined, search: search || undefined },
        token
      );
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(trashApiError(err, "فشل تحميل المحذوفات"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token, page, typeFilter, search]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleTypeFilter = (type) => {
    setTypeFilter((prev) => (prev === type ? "" : type));
    setPage(1);
  };

  const handleRestore = async () => {
    if (!restoreTarget?.type || restoreTarget.id == null) return;
    setRestoring(true);
    try {
      const result = await restoreTeacherTrashItem(
        restoreTarget.type,
        restoreTarget.id,
        token
      );
      toast({
        title: "تمت الاستعادة",
        description: result?.message || `تم استعادة «${restoreTarget.title}»`,
        status: "success",
        isClosable: true,
      });
      setRestoreTarget(null);
      await Promise.all([loadList(), loadSummary()]);
    } catch (err) {
      toast({
        title: "تعذر الاستعادة",
        description: trashApiError(err, "فشل استعادة العنصر"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setRestoring(false);
    }
  };

  if (!token) {
    return (
      <Box minH="60vh" display="grid" placeItems="center">
        <Text>يجب تسجيل الدخول أولاً</Text>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={pageBg} dir="rtl" pb={10}>
      <Box bgGradient={heroGradient} color="white" py={{ base: 6, md: 8 }} px={4} shadow="md">
        <Container maxW="1100px">
          <Flex
            align={{ base: "start", md: "center" }}
            justify="space-between"
            gap={4}
            wrap="wrap"
          >
            <HStack spacing={4} align="start">
              <Flex
                w={12}
                h={12}
                borderRadius="2xl"
                bg="whiteAlpha.300"
                border="1px solid"
                borderColor="whiteAlpha.400"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Icon as={FaTrashRestore} boxSize={6} />
              </Flex>
              <VStack align="start" spacing={1}>
                <Heading size={{ base: "md", md: "lg" }} fontWeight="extrabold">
                  المحذوفات
                </Heading>
                <Text fontSize="sm" color="whiteAlpha.900" lineHeight="1.8" maxW="2xl">
                  استعد المجموعات والملفات والاشتراكات المحذوفة. العناصر القديمة بدون نسخة
                  احتياطية تظهر للعرض فقط.
                </Text>
              </VStack>
            </HStack>
            <IconButton
              aria-label="تحديث"
              icon={<FaRedo />}
              variant="solid"
              bg="whiteAlpha.300"
              _hover={{ bg: "whiteAlpha.400" }}
              borderRadius="xl"
              onClick={() => {
                loadSummary();
                loadList();
              }}
              isLoading={loading || summaryLoading}
            />
          </Flex>
        </Container>
      </Box>

      <Container maxW="1100px" px={{ base: 3, md: 5 }} mt={5}>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={5}>
          <SummaryCard
            label="إجمالي المحذوفات"
            value={summary.total}
            icon={MdDeleteSweep}
            color="blue"
          />
          <SummaryCard
            label="قابلة للاستعادة"
            value={items.filter((item) => item.canRestore).length}
            hint="في هذه الصفحة"
            icon={MdRestore}
            color="green"
          />
          <SummaryCard
            label="استعادة جزئية"
            value={
              Object.entries(summary.byType)
                .filter(([type]) => trashRestoreKind(type) === TRASH_RESTORE.PARTIAL)
                .reduce((sum, [, n]) => sum + Number(n || 0), 0)
            }
            icon={MdSchool}
            color="orange"
          />
          <SummaryCard
            label="عرض فقط"
            value={
              Object.entries(summary.byType)
                .filter(([type]) => trashRestoreKind(type) === TRASH_RESTORE.NONE)
                .reduce((sum, [, n]) => sum + Number(n || 0), 0)
            }
            icon={MdVisibility}
            color="gray"
          />
        </SimpleGrid>

        <Alert status="info" borderRadius="xl" mb={5} bg={cardBg} borderWidth="1px" borderColor={border}>
          <AlertIcon />
          <Text fontSize="sm" color={muted} lineHeight="1.8">
            الحذف النهائي القديم للكورسات والمحاضرات قبل تفعيل هذا النظام لا يُستعاد بالكامل.
            كل ما كان حذفه ناعماً (مثل مجموعات السنتر والملفات) يُستعاد من هنا.
          </Text>
        </Alert>

        <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="2xl" p={4} mb={5}>
          <form onSubmit={handleSearch}>
            <Flex gap={3} wrap="wrap">
              <InputGroup maxW={{ base: "full", md: "360px" }}>
                <InputRightElement pointerEvents="none">
                  <Icon as={FaSearch} color="gray.400" />
                </InputRightElement>
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="ابحث بالاسم أو الوصف..."
                  borderRadius="xl"
                  bg={pageBg}
                  pr={10}
                />
              </InputGroup>
              <Button type="submit" colorScheme="blue" borderRadius="xl" px={6}>
                بحث
              </Button>
              {(search || typeFilter) && (
                <Button
                  variant="ghost"
                  borderRadius="xl"
                  onClick={() => {
                    setSearch("");
                    setSearchInput("");
                    setTypeFilter("");
                    setPage(1);
                  }}
                >
                  مسح الفلاتر
                </Button>
              )}
            </Flex>
          </form>

          <Wrap spacing={2} mt={4}>
            <WrapItem>
              <FilterChip
                active={!typeFilter}
                label={`الكل (${summary.total || 0})`}
                onClick={() => {
                  setTypeFilter("");
                  setPage(1);
                }}
                chipBg={chipBg}
                chipActiveBg={chipActiveBg}
                border={border}
              />
            </WrapItem>
            {typeOptions
              .filter((opt) => opt.count > 0)
              .map((opt) => (
                <WrapItem key={opt.type}>
                  <FilterChip
                    active={typeFilter === opt.type}
                    label={`${opt.label} (${opt.count})`}
                    onClick={() => handleTypeFilter(opt.type)}
                    chipBg={chipBg}
                    chipActiveBg={chipActiveBg}
                    border={border}
                  />
                </WrapItem>
              ))}
          </Wrap>
        </Box>

        {error ? (
          <Alert status="error" borderRadius="xl">
            <AlertIcon />
            {error}
          </Alert>
        ) : loading ? (
          <Flex justify="center" py={16}>
            <Spinner color="blue.500" size="lg" thickness="3px" />
          </Flex>
        ) : items.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            py={16}
            bg={cardBg}
            borderWidth="1px"
            borderColor={border}
            borderRadius="2xl"
          >
            <Icon as={FaHistory} boxSize={10} color="gray.300" mb={3} />
            <Text fontWeight="bold" color={heading}>
              لا توجد محذوفات
            </Text>
            <Text fontSize="sm" color={muted} mt={1}>
              العناصر التي تحذفها ستظهر هنا ويمكن استعادة معظمها.
            </Text>
          </Flex>
        ) : (
          <VStack align="stretch" spacing={3}>
            {items.map((item) => {
              const meta = trashTypeMeta(item.type);
              const badge = restoreBadge(item.restoreKind);
              const TypeIcon = TYPE_ICONS[item.type] || MdDeleteSweep;
              return (
                <Flex
                  key={`${item.type}-${item.id}`}
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={border}
                  borderRadius="2xl"
                  p={{ base: 3.5, md: 4 }}
                  gap={4}
                  align={{ base: "stretch", md: "center" }}
                  direction={{ base: "column", md: "row" }}
                  _hover={{ borderColor: "blue.200", shadow: "sm" }}
                  transition="all 0.15s"
                >
                  <HStack spacing={3} flex="1" minW={0} align="start">
                    <Flex
                      w={11}
                      h={11}
                      borderRadius="xl"
                      bg={`${meta.color}.50`}
                      color={`${meta.color}.500`}
                      align="center"
                      justify="center"
                      flexShrink={0}
                    >
                      <Icon as={TypeIcon} boxSize={5} />
                    </Flex>
                    <Box minW={0}>
                      <HStack spacing={2} mb={1} flexWrap="wrap">
                        <Text fontWeight="bold" color={heading} noOfLines={1}>
                          {item.title}
                        </Text>
                        <Badge colorScheme={meta.color} borderRadius="full">
                          {meta.label}
                        </Badge>
                        <Badge colorScheme={badge.colorScheme} borderRadius="full">
                          {badge.label}
                        </Badge>
                      </HStack>
                      {item.subtitle ? (
                        <Text fontSize="sm" color={muted} noOfLines={2} lineHeight="1.7">
                          {item.subtitle}
                        </Text>
                      ) : null}
                      <Text fontSize="xs" color={muted} mt={1}>
                        حُذف في {formatDeletedAt(item.deletedAt)}
                      </Text>
                    </Box>
                  </HStack>

                  {item.canRestore ? (
                    <Button
                      leftIcon={<FaUndo />}
                      colorScheme={item.restoreKind === TRASH_RESTORE.PARTIAL ? "orange" : "green"}
                      variant="solid"
                      borderRadius="xl"
                      size="sm"
                      alignSelf={{ base: "stretch", md: "center" }}
                      onClick={() => setRestoreTarget(item)}
                    >
                      استعادة
                    </Button>
                  ) : (
                    <Badge
                      alignSelf={{ base: "start", md: "center" }}
                      colorScheme="gray"
                      borderRadius="full"
                      px={3}
                      py={1}
                    >
                      للعرض فقط
                    </Badge>
                  )}
                </Flex>
              );
            })}

            <PaginationBar
              page={pagination.page || page}
              totalPages={pagination.totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </VStack>
        )}
      </Container>

      <AlertDialog
        isOpen={Boolean(restoreTarget)}
        leastDestructiveRef={cancelRef}
        onClose={() => !restoring && setRestoreTarget(null)}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="2xl" mx={3} dir="rtl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              تأكيد الاستعادة
            </AlertDialogHeader>
            <AlertDialogBody lineHeight="1.9">
              {restoreTarget?.restoreKind === TRASH_RESTORE.PARTIAL ? (
                <>
                  سيتم استعادة سجل «{restoreTarget?.title}» بشكل جزئي فقط. المحتوى المرفق قد لا
                  يعود بالكامل إذا لم تُحفظ نسخة منه.
                </>
              ) : (
                <>هل تريد استعادة «{restoreTarget?.title}» إلى مكانه الأصلي؟</>
              )}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={() => setRestoreTarget(null)}
                borderRadius="xl"
                isDisabled={restoring}
              >
                إلغاء
              </Button>
              <Button
                colorScheme="green"
                mr={3}
                onClick={handleRestore}
                isLoading={restoring}
                borderRadius="xl"
                leftIcon={<FaUndo />}
              >
                استعادة
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}

function SummaryCard({ label, value, hint, icon, color }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  return (
    <Box bg={bg} borderWidth="1px" borderColor={border} borderRadius="2xl" p={4}>
      <HStack spacing={3}>
        <Flex
          w={10}
          h={10}
          borderRadius="xl"
          bg={`${color}.50`}
          color={`${color}.500`}
          align="center"
          justify="center"
        >
          <Icon as={icon} boxSize={5} />
        </Flex>
        <Box>
          <Text fontSize="xs" color={muted} fontWeight="semibold">
            {label}
          </Text>
          <Text fontSize="xl" fontWeight="extrabold" lineHeight="1.2">
            {value ?? 0}
          </Text>
          {hint ? (
            <Text fontSize="10px" color={muted}>
              {hint}
            </Text>
          ) : null}
        </Box>
      </HStack>
    </Box>
  );
}

function FilterChip({ active, label, onClick, chipBg, chipActiveBg, border }) {
  return (
    <Button
      size="sm"
      borderRadius="full"
      onClick={onClick}
      bg={active ? chipActiveBg : chipBg}
      color={active ? "white" : "inherit"}
      borderWidth="1px"
      borderColor={active ? "transparent" : border}
      _hover={{ bg: active ? chipActiveBg : "gray.50" }}
      fontWeight="semibold"
    >
      {label}
    </Button>
  );
}
