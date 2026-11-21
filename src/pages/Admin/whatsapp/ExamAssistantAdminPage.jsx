import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";
import {
  cancelExamAssistantSession,
  fetchExamAssistantOverview,
  fetchExamAssistantSession,
  fetchExamAssistantSessions,
  fetchWhatsAppServices,
  patchWhatsAppService,
  reopenExamAssistantSession,
} from "../../../api/whatsappAdminApi";

const STATUS_AR = {
  active: "نشطة",
  completed: "مكتملة",
  cancelled: "ملغاة",
  failed: "فشل",
};

const STATE_AR = {
  IDLE: "خاملة",
  CHECK_TEACHER_TASK: "تأكيد مهمة مجدولة",
  ASK_SOURCE: "اختيار المصدر",
  SELECT_LESSON: "اختيار الدرس",
  ASK_EXAM_SETTINGS: "إعدادات الامتحان",
  WAITING_FOR_FILES: "انتظار ملفات",
  PROCESSING_FILES: "معالجة ملفات",
  EXTRACTING_QUESTIONS: "استخراج أسئلة",
  GENERATING_EXAM: "توليد امتحان",
  EXAM_REVIEW: "مراجعة",
  MODIFYING_EXAM: "تعديل",
  SELECT_EXAM_TYPE: "نوع الامتحان",
  SELECT_TARGET: "اختيار الهدف",
  READY_TO_PUBLISH: "جاهز للنشر",
  PUBLISHED: "منشور",
  FAILED: "فشل",
  CANCELLED: "ملغي",
};

const SOURCE_AR = {
  question_bank: "بنك الأسئلة",
  files: "ملفات/صور",
};

function statusColor(status) {
  if (status === "completed" || status === "PUBLISHED") return "green";
  if (status === "failed" || status === "FAILED") return "red";
  if (status === "cancelled" || status === "CANCELLED") return "gray";
  if (status === "active") return "blue";
  return "orange";
}

function formatWhen(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(value);
  }
}

export default function ExamAssistantAdminPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [service, setService] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    state: "",
    search: "",
  });

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const title = useColorModeValue("gray.900", "white");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, list, services] = await Promise.all([
        fetchExamAssistantOverview(),
        fetchExamAssistantSessions({
          limit: 50,
          status: filters.status || undefined,
          state: filters.state || undefined,
          search: filters.search || undefined,
        }),
        fetchWhatsAppServices(),
      ]);
      setOverview(ov || null);
      setSessions(list?.sessions || []);
      setTotal(list?.total || 0);
      const examSvc = (Array.isArray(services) ? services : []).find(
        (s) => s.key === "teacher_exam_builder_bot",
      );
      setService(examSvc || null);
      if (!selectedId && list?.sessions?.length) {
        setSelectedId(list.sessions[0].id);
      }
    } catch (err) {
      toast({
        title: "تعذر تحميل مساعد الامتحانات",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, selectedId, toast]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      try {
        const data = await fetchExamAssistantSession(selectedId);
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (!cancelled) {
          toast({
            title: "تعذر تحميل تفاصيل الجلسة",
            description: err?.response?.data?.message || err.message,
            status: "error",
          });
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, toast]);

  const stats = useMemo(
    () => [
      { label: "جلسات", value: overview?.total_sessions || 0 },
      { label: "نشطة", value: overview?.active_sessions || 0 },
      { label: "منشورة", value: overview?.published_exams || 0 },
      { label: "فاشلة", value: overview?.failed_sessions || 0 },
      { label: "مدرسون", value: overview?.teachers_count || 0 },
      { label: "مسودات", value: overview?.drafts_created || 0 },
    ],
    [overview],
  );

  const toggleService = async () => {
    if (!service?.id) return;
    setToggling(true);
    try {
      await patchWhatsAppService(service.id, { is_enabled: !service.is_enabled });
      toast({
        title: service.is_enabled ? "تم تعطيل الخدمة" : "تم تفعيل الخدمة",
        status: "success",
        duration: 2500,
      });
      await load();
    } catch (err) {
      toast({
        title: "تعذر تحديث الخدمة",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setToggling(false);
    }
  };

  const onCancel = async () => {
    if (!selectedId) return;
    setActing(true);
    try {
      await cancelExamAssistantSession(selectedId);
      toast({ title: "تم إلغاء الجلسة", status: "success" });
      await load();
      const data = await fetchExamAssistantSession(selectedId);
      setDetail(data);
    } catch (err) {
      toast({
        title: "تعذر الإلغاء",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setActing(false);
    }
  };

  const onReopen = async () => {
    if (!selectedId) return;
    setActing(true);
    try {
      await reopenExamAssistantSession(selectedId);
      toast({ title: "تم إعادة فتح الجلسة", status: "success" });
      await load();
      const data = await fetchExamAssistantSession(selectedId);
      setDetail(data);
    } catch (err) {
      toast({
        title: "تعذر إعادة الفتح",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setActing(false);
    }
  };

  const session = detail?.session;
  const files = detail?.files || [];

  return (
    <Box minH="100vh" bg={pageBg} dir="rtl" py={6}>
      <Container maxW="7xl">
        <Flex justify="space-between" align="start" gap={4} mb={6} wrap="wrap">
          <Box>
            <HStack spacing={2} mb={1}>
              <Box as={FaWhatsapp} color="green.500" />
              <Heading size="md" color={title}>
                مساعد الامتحانات — واتساب
              </Heading>
            </HStack>
            <Text fontSize="sm" color={muted}>
              متابعة جلسات إنشاء الامتحانات من بنك الأسئلة أو الملفات، وحالات الفشل والنشر.
            </Text>
          </Box>
          <HStack spacing={2}>
            <Button
              as={RouterLink}
              to="/admin/whatsapp/services"
              size="sm"
              variant="outline"
            >
              الخدمات
            </Button>
            <Button
              leftIcon={<MdRefresh />}
              size="sm"
              onClick={load}
              isLoading={loading}
            >
              تحديث
            </Button>
          </HStack>
        </Flex>

        {service && (
          <Alert
            status={service.is_enabled ? "success" : "warning"}
            borderRadius="lg"
            mb={4}
            bg={cardBg}
            borderWidth="1px"
            borderColor={border}
          >
            <AlertIcon />
            <Flex flex={1} justify="space-between" align="center" gap={3} wrap="wrap">
              <Text fontSize="sm">
                خدمة <b>مساعد الامتحانات</b> حالياً{" "}
                {service.is_enabled ? "مفعّلة" : "معطّلة"}.
              </Text>
              <Button size="sm" onClick={toggleService} isLoading={toggling}>
                {service.is_enabled ? "تعطيل" : "تفعيل"}
              </Button>
            </Flex>
          </Alert>
        )}

        <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={3} mb={5}>
          {stats.map((s) => (
            <Box
              key={s.label}
              bg={cardBg}
              borderWidth="1px"
              borderColor={border}
              borderRadius="xl"
              p={4}
            >
              <Text fontSize="xs" color={muted}>
                {s.label}
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color={title}>
                {s.value}
              </Text>
            </Box>
          ))}
        </SimpleGrid>

        <Flex gap={4} direction={{ base: "column", lg: "row" }} align="start">
          <Box
            flex={1}
            w="full"
            bg={cardBg}
            borderWidth="1px"
            borderColor={border}
            borderRadius="xl"
            p={4}
          >
            <HStack spacing={2} mb={3} wrap="wrap">
              <Input
                placeholder="بحث: مدرس / رقم / معرف"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                maxW="220px"
                size="sm"
              />
              <Select
                size="sm"
                maxW="160px"
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              >
                <option value="">كل الحالات</option>
                {Object.entries(STATUS_AR).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
              <Select
                size="sm"
                maxW="200px"
                value={filters.state}
                onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))}
              >
                <option value="">كل المراحل</option>
                {Object.entries(STATE_AR).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
              <Button size="sm" colorScheme="blue" onClick={load} isLoading={loading}>
                تطبيق
              </Button>
            </HStack>

            {loading ? (
              <Flex justify="center" py={10}>
                <Spinner />
              </Flex>
            ) : !sessions.length ? (
              <Text color={muted} textAlign="center" py={10}>
                لا توجد جلسات بعد.
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>المعرف</Th>
                      <Th>المدرس</Th>
                      <Th>المرحلة</Th>
                      <Th>الحالة</Th>
                      <Th>المصدر</Th>
                      <Th>آخر تفاعل</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {sessions.map((row) => (
                      <Tr
                        key={row.id}
                        cursor="pointer"
                        bg={selectedId === row.id ? "blackAlpha.50" : undefined}
                        onClick={() => setSelectedId(row.id)}
                        _hover={{ bg: "blackAlpha.50" }}
                      >
                        <Td>#{row.id}</Td>
                        <Td>
                          <Text noOfLines={1}>{row.teacher_name || row.teacher_id}</Text>
                          <Text fontSize="xs" color={muted}>
                            {row.contact_phone}
                          </Text>
                        </Td>
                        <Td>
                          <Badge colorScheme={statusColor(row.state)}>
                            {STATE_AR[row.state] || row.state}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={statusColor(row.status)}>
                            {STATUS_AR[row.status] || row.status}
                          </Badge>
                        </Td>
                        <Td>{SOURCE_AR[row.source_type] || "—"}</Td>
                        <Td fontSize="xs">{formatWhen(row.last_interaction_at)}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
                <Text fontSize="xs" color={muted} mt={2}>
                  عرض {sessions.length} من {total}
                </Text>
              </Box>
            )}
          </Box>

          <Box
            w={{ base: "full", lg: "380px" }}
            bg={cardBg}
            borderWidth="1px"
            borderColor={border}
            borderRadius="xl"
            p={4}
            position={{ lg: "sticky" }}
            top={4}
          >
            <Heading size="sm" mb={3}>
              تفاصيل الجلسة
            </Heading>
            {detailLoading ? (
              <Flex justify="center" py={8}>
                <Spinner size="sm" />
              </Flex>
            ) : !session ? (
              <Text color={muted} fontSize="sm">
                اختر جلسة من القائمة.
              </Text>
            ) : (
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <Text fontWeight="semibold">#{session.id}</Text>
                  <Badge colorScheme={statusColor(session.status)}>
                    {STATUS_AR[session.status] || session.status}
                  </Badge>
                </HStack>
                <Text fontSize="sm">
                  المدرس: <b>{session.teacher_name || session.teacher_id}</b>
                </Text>
                <Text fontSize="sm" color={muted}>
                  واتساب: {session.contact_phone}
                </Text>
                <Text fontSize="sm">
                  المرحلة: {STATE_AR[session.state] || session.state}
                </Text>
                <Text fontSize="sm">
                  المصدر: {SOURCE_AR[session.source_type] || "—"}
                </Text>
                {session.draft_exam_id && (
                  <Text fontSize="sm">
                    مسودة امتحان: #{session.draft_exam_id} ({session.draft_exam_kind || "—"})
                  </Text>
                )}
                {session.exam_builder_session_id && (
                  <Text fontSize="xs" color={muted} wordBreak="break-all">
                    builder session: {session.exam_builder_session_id}
                  </Text>
                )}
                {session.context?.review_url && (
                  <Button
                    as="a"
                    href={session.context.review_url}
                    target="_blank"
                    rel="noreferrer"
                    size="sm"
                    variant="outline"
                  >
                    فتح رابط المراجعة
                  </Button>
                )}
                {session.last_error && (
                  <Alert status="error" borderRadius="md" fontSize="sm">
                    <AlertIcon />
                    {session.last_error}
                  </Alert>
                )}

                <Divider />
                <Text fontSize="sm" fontWeight="semibold">
                  الملفات ({files.length})
                </Text>
                {!files.length ? (
                  <Text fontSize="xs" color={muted}>
                    لا توجد ملفات مرفوعة.
                  </Text>
                ) : (
                  files.map((f) => (
                    <Box key={f.id} fontSize="xs" borderWidth="1px" borderColor={border} borderRadius="md" p={2}>
                      <Text noOfLines={1}>{f.original_name || `ملف #${f.id}`}</Text>
                      <Text color={muted}>
                        {f.mime_type || "—"} · {f.file_size ? `${Math.round(f.file_size / 1024)} KB` : "—"}
                      </Text>
                    </Box>
                  ))
                )}

                <Divider />
                <Text fontSize="sm" fontWeight="semibold">
                  السياق
                </Text>
                <Box
                  as="pre"
                  fontSize="10px"
                  whiteSpace="pre-wrap"
                  wordBreak="break-word"
                  bg="blackAlpha.50"
                  p={2}
                  borderRadius="md"
                  maxH="180px"
                  overflowY="auto"
                >
                  {JSON.stringify(session.context || {}, null, 2)}
                </Box>

                <HStack spacing={2} pt={1}>
                  {session.status === "active" && (
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      onClick={onCancel}
                      isLoading={acting}
                    >
                      إلغاء الجلسة
                    </Button>
                  )}
                  {(session.status === "failed" || session.status === "cancelled") && (
                    <Button
                      size="sm"
                      colorScheme="orange"
                      onClick={onReopen}
                      isLoading={acting}
                    >
                      إعادة فتح
                    </Button>
                  )}
                </HStack>
              </VStack>
            )}
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}
