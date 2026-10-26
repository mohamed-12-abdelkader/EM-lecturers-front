import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  NumberInput,
  NumberInputField,
  Spinner,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Checkbox,
  Badge,
  Input,
  Select,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { FaWhatsapp } from "react-icons/fa";
import { MdRefresh, MdSave } from "react-icons/md";
import {
  controlParentsExamQueue,
  fetchParentsExamMonitor,
  fetchParentsExamSettings,
  saveParentsExamSettings,
} from "../../../api/whatsappAdminApi";

const PAGE_SIZE = 50;

const STATUS_AR = {
  scheduled: "متجدول",
  sent: "اتبعت",
  skipped: "اتقفّز",
  cancelled: "اتلغى",
  pending: "في الطابور",
  processing: "بيتبعّت",
  failed: "فشل وهيعيد",
  dead: "وقف",
};

const COHORT_AR = { passed: "ناجح", failed: "راسب", absent: "لم يدخل" };

const SESSION_AR = {
  ready: "جاهز",
  qr: "بانتظار المسح",
  pending: "قيد الاتصال",
  authenticated: "تم التحقق",
  disconnected: "غير متصل",
  failed: "فشل",
};

function formatWhen(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    timeZone: "Africa/Cairo",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function sessionColor(status) {
  if (status === "ready") return "green";
  if (status === "qr" || status === "pending" || status === "authenticated") return "orange";
  return "red";
}

function statusColor(status) {
  if (status === "sent") return "green";
  if (status === "failed" || status === "dead" || status === "skipped") return "red";
  if (status === "scheduled" || status === "pending" || status === "processing") return "blue";
  return "gray";
}

export default function ParentsExamNotifyPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState(null);
  const [monitor, setMonitor] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [cohort, setCohort] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [acting, setActing] = useState(false);
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  const load = useCallback(async (filters) => {
    const q = filters?.q ?? "";
    const st = filters?.status ?? "";
    const co = filters?.cohort ?? "";
    const nextPage = Math.max(1, Number(filters?.page) || 1);
    setLoading(true);
    try {
      const [next, activity] = await Promise.all([
        fetchParentsExamSettings(),
        fetchParentsExamMonitor({
          q: q || undefined,
          status: st || undefined,
          cohort: co || undefined,
          page: nextPage,
          limit: PAGE_SIZE,
        }),
      ]);
      setSettings(next);
      setDraft(next?.config || null);
      setMonitor(activity);
      setPage(activity?.page || nextPage);
      setSelected([]);
    } catch (err) {
      toast({
        title: "تعذّر تحميل الإعدادات",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const next = await saveParentsExamSettings({
        interval_seconds: Number(draft.interval_seconds),
        jitter_seconds: Number(draft.jitter_seconds),
        daily_cap: Number(draft.daily_cap),
        quiet_hours: draft.quiet_hours,
      });
      setSettings(next);
      setDraft(next.config);
      toast({ title: "تم حفظ حدود الإرسال", status: "success" });
    } catch (err) {
      toast({
        title: "تعذّر الحفظ",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const filters = { q: query, status, cohort };
  const visibleIds = (monitor?.rows || []).map((row) => row.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  const runAction = async (action, scope, ids) => {
    const chosen = ids || selected;
    const allMatching = scope === "filter";
    const label = action === "cancel" ? "إلغاء" : "إرسال الآن";
    const ok = window.confirm(
      allMatching
        ? `${label} لكل الرسائل المتجدولة التي تطابق البحث الحالي، وليس الصفحة الظاهرة فقط.`
        : `${label} للرسائل المحددة (${chosen.length}).`,
    );
    if (!ok) return;
    if (!allMatching && !chosen.length) return;
    setActing(true);
    try {
      const result = await controlParentsExamQueue({
        action,
        ids: allMatching ? undefined : chosen,
        allMatching,
        q: query || null,
        status: status || null,
        cohort: cohort || null,
      });
      toast({
        title: action === "cancel" ? `اتلغى ${result?.affected || 0}` : `اتقدم ${result?.affected || 0} للإرسال الآن`,
        status: "success",
      });
      await load({ ...filters, page });
    } catch (err) {
      toast({
        title: "تعذّر تنفيذ الأمر",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setActing(false);
    }
  };

  if (!draft) {
    return (
      <Flex minH="40vh" align="center" justify="center">
        <Spinner />
      </Flex>
    );
  }

  return (
    <Box bg={pageBg} minH="40vh" py={4}>
      <Container maxW="7xl">
        <Flex justify="space-between" align="center" mb={4}>
          <HStack>
            <FaWhatsapp color="#25D366" />
            <Heading size="md">حدود إرسال أولياء الأمور</Heading>
          </HStack>
          <Button leftIcon={<MdRefresh />} size="sm" isLoading={loading} onClick={() => void load(filters)}>
            تحديث
          </Button>
        </Flex>
        <Alert status="info" borderRadius="lg" mb={4}>
          <AlertIcon />
          المدرس يربط رقمه من إشعارات الطلاب ويختار الامتحانات. هنا تضبط سرعة الإرسال لكل المدرسين.
        </Alert>
        <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="xl" p={4} mb={4}>
          <VStack align="stretch" spacing={3}>
            <HStack>
              <FormControl>
                <FormLabel fontSize="sm">ثواني بين كل رسالة</FormLabel>
                <NumberInput
                  min={15}
                  max={300}
                  value={draft.interval_seconds}
                  onChange={(_t, n) => setDraft({ ...draft, interval_seconds: n })}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">عشوائية بالثواني</FormLabel>
                <NumberInput
                  min={0}
                  max={120}
                  value={draft.jitter_seconds}
                  onChange={(_t, n) => setDraft({ ...draft, jitter_seconds: n })}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">حد يومي لكل مدرس</FormLabel>
                <NumberInput
                  min={1}
                  max={5000}
                  value={draft.daily_cap || ""}
                  isDisabled={!draft.daily_cap}
                  onChange={(_t, n) => setDraft({ ...draft, daily_cap: Number.isFinite(n) ? n : draft.daily_cap })}
                >
                  <NumberInputField placeholder="غير محدود" />
                </NumberInput>
                <FormControl display="flex" alignItems="center" mt={2}>
                  <FormLabel mb={0} fontSize="sm">بدون حد</FormLabel>
                  <Switch
                    isChecked={!draft.daily_cap}
                    onChange={(e) =>
                      setDraft({ ...draft, daily_cap: e.target.checked ? 0 : 800 })
                    }
                  />
                </FormControl>
              </FormControl>
            </HStack>
            <FormControl display="flex" alignItems="center">
              <FormLabel mb={0}>
                ساعات الهدوء ({draft.quiet_hours?.start}–{draft.quiet_hours?.end})
              </FormLabel>
              <Switch
                isChecked={Boolean(draft.quiet_hours?.enabled)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    quiet_hours: { ...draft.quiet_hours, enabled: e.target.checked },
                  })
                }
              />
            </FormControl>
            <Button leftIcon={<MdSave />} colorScheme="green" alignSelf="start" isLoading={saving} onClick={() => void save()}>
              حفظ
            </Button>
          </VStack>
        </Box>
        <Text color={muted} mb={2}>
          اتبعتت النهاردة على كل المدرسين: {settings?.sentToday ?? 0}. الحد اليومي لكل مدرس: {draft.daily_cap ? draft.daily_cap : "غير محدود"}.
          أقرب رسالة في الطابور: {monitor?.nextAt ? formatWhen(monitor.nextAt) : "مفيش"}.
        </Text>
        <HStack mb={3} wrap="wrap">
          {(monitor?.summary || []).map((item) => (
            <Badge key={`n-${item.status}`} colorScheme={statusColor(item.status)}>
              إشعار {STATUS_AR[item.status] || item.status}: {item.count}
            </Badge>
          ))}
          {(monitor?.jobs || []).map((item) => (
            <Badge key={`j-${item.status}`} variant="outline" colorScheme={statusColor(item.status)}>
              طابور {STATUS_AR[item.status] || item.status}: {item.count}
            </Badge>
          ))}
        </HStack>
        <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="xl" p={4} mb={4}>
          <Heading size="sm" mb={3}>أرقام المدرسين</Heading>
          {(monitor?.teachers?.missing || []).length ? (
            <Alert status="warning" borderRadius="lg" mb={3}>
              <AlertIcon />
              بدون رقم جاهز على إشعارات الطلاب: {(monitor.teachers.missing || []).map((t) => t.teacherName).join("، ")}
            </Alert>
          ) : null}
          <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>المدرس</Th>
                  <Th>الرقم</Th>
                  <Th>الحالة</Th>
                  <Th>الخدمة</Th>
                  <Th>آخر اتصال</Th>
                </Tr>
              </Thead>
              <Tbody>
                {(monitor?.teachers?.numbers || [])
                  .filter((row) => {
                    const needle = query.trim();
                    if (!needle) return true;
                    return `${row.teacherName} ${row.phone} ${row.serviceName}`.includes(needle);
                  })
                  .map((row) => (
                    <Tr key={`${row.slug}-${row.serviceKey || "none"}`}>
                      <Td>{row.teacherName}</Td>
                      <Td dir="ltr" textAlign="right">{row.phone || "—"}</Td>
                      <Td>
                        <Badge colorScheme={sessionColor(row.status)}>
                          {SESSION_AR[row.status] || row.status}
                        </Badge>
                        {!row.enabled || (row.serviceKey && !row.linkEnabled) ? (
                          <Badge ml={1} colorScheme="gray">موقوف</Badge>
                        ) : null}
                      </Td>
                      <Td>{row.serviceName || "غير مربوط بخدمة"}</Td>
                      <Td>{formatWhen(row.lastReadyAt)}</Td>
                    </Tr>
                  ))}
              </Tbody>
            </Table>
          </Box>
        </Box>
        <HStack mb={3} wrap="wrap">
          <Input
            placeholder="اسم المدرس أو الامتحان أو الطالب"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            bg={cardBg}
          />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} bg={cardBg} maxW="180px">
            <option value="">كل الحالات</option>
            <option value="scheduled">متجدول</option>
            <option value="sent">اتبعت</option>
            <option value="failed">فشل</option>
            <option value="dead">وقف</option>
            <option value="skipped">اتقفّز</option>
            <option value="cancelled">اتلغى</option>
          </Select>
          <Select value={cohort} onChange={(e) => setCohort(e.target.value)} bg={cardBg} maxW="160px">
            <option value="">كل الأنواع</option>
            <option value="passed">ناجح</option>
            <option value="failed">راسب</option>
            <option value="absent">لم يدخل</option>
          </Select>
          <Button size="sm" onClick={() => void load({ ...filters, page: 1 })}>
            بحث
          </Button>
        </HStack>
        <HStack mb={3} wrap="wrap">
          <Button size="sm" colorScheme="blue" isDisabled={!selected.length} isLoading={acting} onClick={() => void runAction("send_now", "selected")}>
            إرسال المحدد الآن
          </Button>
          <Button size="sm" colorScheme="red" variant="outline" isDisabled={!selected.length} isLoading={acting} onClick={() => void runAction("cancel", "selected")}>
            إلغاء المحدد
          </Button>
          <Button size="sm" variant="outline" isLoading={acting} onClick={() => void runAction("send_now", "filter")}>
            إرسال نتائج البحث الآن
          </Button>
          <Button size="sm" colorScheme="red" variant="ghost" isLoading={acting} onClick={() => void runAction("cancel", "filter")}>
            إلغاء نتائج البحث المتجدولة
          </Button>
        </HStack>
        <Box overflowX="auto" border="1px solid" borderColor={border} borderRadius="xl">
          <Table size="sm" bg={cardBg}>
            <Thead>
              <Tr>
                <Th>
                  <Checkbox
                    isChecked={allVisibleSelected}
                    onChange={(e) => setSelected(e.target.checked ? visibleIds : [])}
                  />
                </Th>
                <Th>المدرس</Th>
                <Th>الامتحان</Th>
                <Th>الطالب</Th>
                <Th>الحالة</Th>
                <Th>الطابور</Th>
                <Th>الموعد</Th>
                <Th>الخطأ</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {(monitor?.rows || []).map((row) => (
                <Tr key={row.id}>
                  <Td>
                    <Checkbox
                      isChecked={selected.includes(row.id)}
                      onChange={(e) =>
                        setSelected((current) =>
                          e.target.checked ? [...current, row.id] : current.filter((id) => id !== row.id),
                        )
                      }
                    />
                  </Td>
                  <Td>{row.teacherName || "—"}</Td>
                  <Td>{row.examTitle}</Td>
                  <Td>
                    {row.studentName}
                    <Text fontSize="xs" color={muted}>
                      {COHORT_AR[row.cohort] || row.cohort}
                      {row.phoneTail ? ` · …${row.phoneTail}` : ""}
                    </Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={statusColor(row.status)}>{STATUS_AR[row.status] || row.status}</Badge>
                  </Td>
                  <Td>
                    {row.jobStatus ? (
                      <Badge variant="outline" colorScheme={statusColor(row.jobStatus)}>
                        {STATUS_AR[row.jobStatus] || row.jobStatus}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>{formatWhen(row.scheduledAt)}</Td>
                  <Td maxW="240px">
                    <Text fontSize="xs" noOfLines={3}>
                      {row.error || row.skipReason || "—"}
                    </Text>
                  </Td>
                  <Td>
                    {row.status === "scheduled" ? (
                      <HStack>
                        <Button size="xs" colorScheme="blue" isLoading={acting} onClick={() => void runAction("send_now", "selected", [row.id])}>
                          الآن
                        </Button>
                        <Button size="xs" colorScheme="red" variant="outline" isLoading={acting} onClick={() => void runAction("cancel", "selected", [row.id])}>
                          إلغاء
                        </Button>
                      </HStack>
                    ) : null}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Flex
            justify="space-between"
            align="center"
            px={3}
            py={2}
            borderTop="1px solid"
            borderColor={border}
            bg={cardBg}
            wrap="wrap"
            gap={2}
          >
            <Text fontSize="sm" color={muted}>
              {monitor?.total
                ? `${(page - 1) * (monitor.pageSize || PAGE_SIZE) + 1}–${Math.min(
                    page * (monitor.pageSize || PAGE_SIZE),
                    monitor.total,
                  )} من ${monitor.total}`
                : "لا توجد رسائل"}
            </Text>
            <HStack>
              <Button
                size="sm"
                variant="outline"
                isDisabled={page <= 1 || loading}
                onClick={() => void load({ ...filters, page: page - 1 })}
              >
                السابق
              </Button>
              <Text fontSize="sm">
                {page} / {monitor?.totalPages || 1}
              </Text>
              <Button
                size="sm"
                variant="outline"
                isDisabled={page >= (monitor?.totalPages || 1) || loading}
                onClick={() => void load({ ...filters, page: page + 1 })}
              >
                التالي
              </Button>
            </HStack>
          </Flex>
        </Box>
      </Container>
    </Box>
  );
}
