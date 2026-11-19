import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  Spinner,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
  VStack,
  Checkbox,
  CheckboxGroup,
  Stack,
  Divider,
  Image,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { FaWhatsapp } from "react-icons/fa";
import { MdRefresh, MdSave, MdSend } from "react-icons/md";
import {
  createWhatsAppSession,
  fetchTeachersManagementBroadcasts,
  fetchTeachersManagementLogs,
  fetchTeachersManagementSettings,
  fetchTeachersManagementSubscriptionLogs,
  fetchWhatsAppService,
  fetchWhatsAppSessions,
  fetchWhatsAppStatus,
  getWhatsAppSession,
  patchWhatsAppService,
  putWhatsAppServiceSessions,
  reconnectWhatsAppSession,
  retryTeachersManagementLogs,
  saveTeachersManagementSettings,
  sendTeachersManagementBroadcast,
  testTeachersManagementSend,
  uploadTeachersManagementMedia,
} from "../../../api/whatsappAdminApi";
import { fetchScheduleTeachers } from "../../../api/teacherScheduleApi";

const STATUS_AR = {
  pending: "قيد الإرسال",
  sent: "تم الإرسال",
  failed: "فشل",
  skipped: "تم التخطي",
};

const SESSION_AR = {
  ready: "جاهز",
  qr: "بانتظار المسح",
  pending: "قيد الاتصال",
  authenticated: "تم التحقق",
  disconnected: "غير متصل",
  failed: "فشل",
};

function statusColor(status) {
  if (status === "sent") return "green";
  if (status === "failed") return "red";
  if (status === "pending") return "blue";
  return "gray";
}

function sessionColor(status) {
  if (status === "ready") return "green";
  if (status === "qr" || status === "pending" || status === "authenticated") return "orange";
  return "red";
}

function SimpleMediaRow({ label, url, setUrl, accept, uploading, onUpload, muted }) {
  return (
    <FormControl mb={3}>
      <FormLabel>{label}</FormLabel>
      <HStack align="center" wrap="wrap">
        <Input
          placeholder={`رابط ${label} أو ارفعه من الجهاز`}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button as="label" size="sm" isLoading={Boolean(uploading)} cursor="pointer">
          رفع
          <input
            type="file"
            accept={accept}
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onUpload(file);
            }}
          />
        </Button>
        {url ? (
          <Button size="sm" variant="ghost" onClick={() => setUrl("")}>
            مسح
          </Button>
        ) : null}
      </HStack>
      <Text fontSize="xs" color={muted} mt={1}>
        يمكن لصق رابط عام أو رفع ملف من الجهاز.
      </Text>
    </FormControl>
  );
}

export default function TeachersManagementPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [draft, setDraft] = useState(null);
  const [logs, setLogs] = useState({ rows: [], total: 0, page: 1 });
  const [teachers, setTeachers] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [testTeacherId, setTestTeacherId] = useState("");
  const [testing, setTesting] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [allSessions, setAllSessions] = useState([]);
  const [serviceDetail, setServiceDetail] = useState(null);
  const [poolDraft, setPoolDraft] = useState([]);
  const [qrData, setQrData] = useState(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastImageUrl, setBroadcastImageUrl] = useState("");
  const [broadcastVideoUrl, setBroadcastVideoUrl] = useState("");
  const [broadcastAll, setBroadcastAll] = useState(true);
  const [broadcastTeacherIds, setBroadcastTeacherIds] = useState([]);
  const [broadcasting, setBroadcasting] = useState(false);
  const [uploadingKind, setUploadingKind] = useState("");
  const [broadcasts, setBroadcasts] = useState({ rows: [], total: 0 });
  const [subLogs, setSubLogs] = useState({ rows: [], total: 0 });

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  const load = useCallback(
    async (filters) => {
      const q = filters?.q ?? query;
      const st = filters?.status ?? status;
      const nextPage = Math.max(1, Number(filters?.page) || page);
      setLoading(true);
      try {
        const waStatus = await fetchWhatsAppStatus();
        setConfigured(Boolean(waStatus?.configured));
        const [nextSettings, nextLogs, teacherRows, sessions, nextBroadcasts, nextSubLogs] =
          await Promise.all([
          fetchTeachersManagementSettings(),
          fetchTeachersManagementLogs({
            q: q || undefined,
            status: st || undefined,
            page: nextPage,
            limit: 50,
          }),
          fetchScheduleTeachers(),
          waStatus?.configured ? fetchWhatsAppSessions() : Promise.resolve([]),
          fetchTeachersManagementBroadcasts({ limit: 10, page: 1 }),
          fetchTeachersManagementSubscriptionLogs({ limit: 20, page: 1 }),
        ]);
        setSettings(nextSettings);
        setDraft({
          enabled: Boolean(nextSettings?.enabled),
          sendHour: Number(nextSettings?.sendHour ?? 7),
          sendMinute: Number(nextSettings?.sendMinute ?? 0),
          teacherIds: nextSettings?.teacherIds,
          allTeachers: nextSettings?.teacherIds == null,
          subscriptionAlertEnabled: Boolean(nextSettings?.subscriptionAlertEnabled),
          subscriptionAlertHour: Number(nextSettings?.subscriptionAlertHour ?? 10),
          subscriptionAlertMinute: Number(nextSettings?.subscriptionAlertMinute ?? 0),
          subscriptionAlertMessage: nextSettings?.subscriptionAlertMessage || "",
        });
        setLogs(nextLogs || { rows: [], total: 0, page: nextPage });
        setPage(nextLogs?.page || nextPage);
        setTeachers(Array.isArray(teacherRows) ? teacherRows : []);
        setAllSessions(Array.isArray(sessions) ? sessions : []);
        setBroadcasts(nextBroadcasts || { rows: [], total: 0 });
        setSubLogs(nextSubLogs || { rows: [], total: 0 });

        if (nextSettings?.serviceId) {
          const detail = await fetchWhatsAppService(nextSettings.serviceId);
          setServiceDetail(detail);
          setPoolDraft(
            (detail?.sessions || []).map((s) => ({
              session_slug: s.session_slug,
              weight: s.weight || 1,
              priority: s.priority || 0,
              role: s.role || "primary",
              is_enabled: s.is_enabled !== false,
            })),
          );
          const primary = (detail?.sessions || [])[0]?.session_slug;
          if (primary) {
            try {
              const sess = await getWhatsAppSession(primary);
              setQrData(sess?.qr || null);
            } catch {
              setQrData(null);
            }
          } else {
            setQrData(null);
          }
        }
      } catch (err) {
        toast({
          title: "تعذّر تحميل الخدمة",
          description: err?.response?.data?.message || err.message,
          status: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast, query, status, page],
  );

  useEffect(() => {
    void load({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const next = await saveTeachersManagementSettings({
        enabled: Boolean(draft.enabled),
        sendHour: Number(draft.sendHour),
        sendMinute: Number(draft.sendMinute),
        teacherIds: draft.allTeachers ? null : draft.teacherIds || [],
        subscriptionAlertEnabled: Boolean(draft.subscriptionAlertEnabled),
        subscriptionAlertHour: Number(draft.subscriptionAlertHour),
        subscriptionAlertMinute: Number(draft.subscriptionAlertMinute),
        subscriptionAlertMessage: draft.subscriptionAlertMessage || "",
      });
      if (settings?.serviceId) {
        await patchWhatsAppService(settings.serviceId, {
          is_enabled:
            Boolean(draft.enabled) || Boolean(draft.subscriptionAlertEnabled),
        });
        if (poolDraft.length) {
          await putWhatsAppServiceSessions(settings.serviceId, poolDraft);
        }
      }
      setSettings(next);
      toast({ title: "تم حفظ الإعدادات", status: "success" });
      await load();
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

  const ensureSession = async () => {
    setCreatingSession(true);
    try {
      const slug = "teachers-management";
      try {
        await createWhatsAppSession(slug, "إدارة المدرسين");
      } catch (err) {
        // Session may already exist — still bind it to the service.
        if (err?.response?.status !== 409 && err?.response?.status !== 400) {
          throw err;
        }
      }
      if (settings?.serviceId) {
        await putWhatsAppServiceSessions(settings.serviceId, [
          {
            session_slug: slug,
            weight: 1,
            priority: 0,
            role: "primary",
            is_enabled: true,
          },
        ]);
      }
      toast({ title: "تم إنشاء/ربط الجلسة", status: "success" });
      await load();
    } catch (err) {
      toast({
        title: "تعذّر إنشاء الجلسة",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setCreatingSession(false);
    }
  };

  const reconnect = async () => {
    const slug = poolDraft[0]?.session_slug || settings?.sessions?.[0]?.sessionSlug;
    if (!slug) return;
    try {
      await reconnectWhatsAppSession(slug);
      toast({ title: "جاري إعادة الربط", status: "info" });
      await load();
    } catch (err) {
      toast({
        title: "تعذّر إعادة الربط",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    }
  };

  const sendTest = async () => {
    const teacherId = Number(testTeacherId);
    if (!teacherId) {
      toast({ title: "اختر مدرسًا للاختبار", status: "warning" });
      return;
    }
    setTesting(true);
    try {
      await testTeachersManagementSend(teacherId);
      toast({ title: "تم إدراج التذكير التجريبي في الطابور", status: "success" });
      await load();
    } catch (err) {
      toast({
        title: "تعذّر الإرسال التجريبي",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setTesting(false);
    }
  };

  const retryFailed = async () => {
    setRetrying(true);
    try {
      const result = await retryTeachersManagementLogs();
      toast({
        title: `تمت إعادة المحاولة لـ ${result?.retried || 0} رسالة`,
        status: "success",
      });
      await load();
    } catch (err) {
      toast({
        title: "تعذّرت إعادة المحاولة",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setRetrying(false);
    }
  };

  const uploadMedia = async (file, kind) => {
    if (!file) return;
    setUploadingKind(kind);
    try {
      const uploaded = await uploadTeachersManagementMedia(file);
      if (kind === "image") setBroadcastImageUrl(uploaded.url);
      else setBroadcastVideoUrl(uploaded.url);
      toast({ title: "تم رفع الملف", status: "success" });
    } catch (err) {
      toast({
        title: "تعذّر رفع الملف",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setUploadingKind("");
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastBody.trim() && !broadcastImageUrl && !broadcastVideoUrl) {
      toast({ title: "اكتب رسالة أو أرفق صورة/فيديو", status: "warning" });
      return;
    }
    const ok = window.confirm(
      broadcastAll
        ? "سيتم إرسال الرسالة لجميع المدرسين. هل تريد المتابعة؟"
        : `سيتم الإرسال لـ ${broadcastTeacherIds.length} مدرس. هل تريد المتابعة؟`,
    );
    if (!ok) return;
    setBroadcasting(true);
    try {
      const result = await sendTeachersManagementBroadcast({
        body: broadcastBody.trim() || null,
        imageUrl: broadcastImageUrl || null,
        videoUrl: broadcastVideoUrl || null,
        teacherIds: broadcastAll ? null : broadcastTeacherIds.map(Number),
      });
      toast({
        title: `تم إدراج الإرسال (${result?.enqueuedCount || 0} رسالة)`,
        status: "success",
      });
      setBroadcastBody("");
      setBroadcastImageUrl("");
      setBroadcastVideoUrl("");
      await load();
    } catch (err) {
      toast({
        title: "تعذّر الإرسال الجماعي",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setBroadcasting(false);
    }
  };

  const sessionStatus = settings?.sessions?.[0]?.status || serviceDetail?.sessions?.[0]?.status;
  const selectedTeachers = useMemo(
    () => new Set((draft?.teacherIds || []).map(Number)),
    [draft?.teacherIds],
  );

  return (
    <Box dir="rtl" bg={pageBg} minH="100vh" py={8}>
      <Container maxW="6xl">
        <Flex justify="space-between" align={{ base: "stretch", md: "center" }} gap={3} mb={6} wrap="wrap">
          <Box>
            <HStack mb={1}>
              <FaWhatsapp />
              <Heading size="lg">إدارة المدرسين</Heading>
            </HStack>
            <Text color={muted}>
              تذكيرات واتساب يومية مستقلة لكل مدرس حسب جدوله.
            </Text>
          </Box>
          <HStack>
            <Button as={RouterLink} to="/admin/teacher-schedules" variant="outline">
              جداول المدرسين
            </Button>
            <Button leftIcon={<MdRefresh />} onClick={() => load()} isLoading={loading}>
              تحديث
            </Button>
          </HStack>
        </Flex>

        {!configured && (
          <Alert status="warning" mb={4} borderRadius="lg">
            <AlertIcon />
            بوابة واتساب غير مهيأة حاليًا. يمكن ضبط الإعدادات لكن الإرسال لن يعمل حتى يتم الربط.
          </Alert>
        )}

        {loading && !draft ? (
          <Flex justify="center" py={16}>
            <Spinner size="lg" />
          </Flex>
        ) : (
          <VStack align="stretch" spacing={4}>
            <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="xl" p={5}>
              <Heading size="md" mb={4}>
                جلسة واتساب الخاصة بالخدمة
              </Heading>
              <HStack mb={3} wrap="wrap">
                <Badge colorScheme={sessionColor(sessionStatus)}>
                  {SESSION_AR[sessionStatus] || sessionStatus || "غير مربوطة"}
                </Badge>
                <Text fontSize="sm" color={muted}>
                  {poolDraft[0]?.session_slug || settings?.sessions?.[0]?.sessionSlug || "لا توجد جلسة"}
                </Text>
              </HStack>
              <HStack mb={4} wrap="wrap">
                <Button
                  size="sm"
                  onClick={ensureSession}
                  isLoading={creatingSession}
                  isDisabled={!settings?.serviceId}
                >
                  إنشاء/ربط جلسة مستقلة
                </Button>
                <Button size="sm" variant="outline" onClick={reconnect}>
                  إعادة الربط
                </Button>
                <Button
                  as={RouterLink}
                  to="/admin/whatsapp/sessions"
                  size="sm"
                  variant="ghost"
                >
                  إدارة الجلسات
                </Button>
              </HStack>
              {qrData && (
                <Box>
                  <Text fontSize="sm" mb={2} color={muted}>
                    امسح رمز QR لربط الحساب:
                  </Text>
                  {String(qrData).startsWith("data:") || String(qrData).startsWith("http") ? (
                    <Box as="img" src={qrData} alt="QR" maxW="240px" borderRadius="md" />
                  ) : (
                    <Text fontSize="xs" whiteSpace="pre-wrap" wordBreak="break-all">
                      {String(qrData)}
                    </Text>
                  )}
                </Box>
              )}
              <Divider my={4} />
              <FormControl>
                <FormLabel>ربط جلسات موجودة بالخدمة</FormLabel>
                <CheckboxGroup
                  value={poolDraft.map((s) => s.session_slug)}
                  onChange={(values) => {
                    setPoolDraft(
                      values.map((slug, idx) => ({
                        session_slug: slug,
                        weight: 1,
                        priority: idx,
                        role: idx === 0 ? "primary" : "secondary",
                        is_enabled: true,
                      })),
                    );
                  }}
                >
                  <Stack spacing={2}>
                    {allSessions.map((s) => (
                      <Checkbox key={s.id || s.slug || s.session_slug} value={s.slug || s.id}>
                        {s.label || s.slug || s.id}{" "}
                        <Badge ms={2} colorScheme={sessionColor(s.status)}>
                          {SESSION_AR[s.status] || s.status}
                        </Badge>
                      </Checkbox>
                    ))}
                    {!allSessions.length && (
                      <Text fontSize="sm" color={muted}>
                        لا توجد جلسات متاحة بعد.
                      </Text>
                    )}
                  </Stack>
                </CheckboxGroup>
              </FormControl>
            </Box>

            <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="xl" p={5}>
              <Heading size="md" mb={4}>
                إعدادات التذكير اليومي
              </Heading>
              <FormControl display="flex" alignItems="center" mb={4}>
                <FormLabel mb={0}>تفعيل التذكيرات التلقائية</FormLabel>
                <Switch
                  isChecked={Boolean(draft?.enabled)}
                  onChange={(e) => setDraft((d) => ({ ...d, enabled: e.target.checked }))}
                />
              </FormControl>
              <HStack align="end" mb={4} wrap="wrap">
                <FormControl maxW="120px">
                  <FormLabel>الساعة</FormLabel>
                  <NumberInput
                    min={0}
                    max={23}
                    value={draft?.sendHour ?? 7}
                    onChange={(_, n) => setDraft((d) => ({ ...d, sendHour: Number.isNaN(n) ? 0 : n }))}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <FormControl maxW="120px">
                  <FormLabel>الدقيقة</FormLabel>
                  <NumberInput
                    min={0}
                    max={59}
                    value={draft?.sendMinute ?? 0}
                    onChange={(_, n) =>
                      setDraft((d) => ({ ...d, sendMinute: Number.isNaN(n) ? 0 : n }))
                    }
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <Text fontSize="sm" color={muted} pb={2}>
                  توقيت مصر (Africa/Cairo)
                </Text>
              </HStack>
              <FormControl display="flex" alignItems="center" mb={3}>
                <FormLabel mb={0}>إرسال لكل المدرسين</FormLabel>
                <Switch
                  isChecked={Boolean(draft?.allTeachers)}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      allTeachers: e.target.checked,
                      teacherIds: e.target.checked ? null : d.teacherIds || [],
                    }))
                  }
                />
              </FormControl>
              {!draft?.allTeachers && (
                <Box maxH="220px" overflowY="auto" borderWidth="1px" borderColor={border} borderRadius="md" p={3} mb={3}>
                  <CheckboxGroup
                    value={[...selectedTeachers].map(String)}
                    onChange={(values) =>
                      setDraft((d) => ({
                        ...d,
                        teacherIds: values.map(Number),
                      }))
                    }
                  >
                    <Stack spacing={2}>
                      {teachers.map((t) => (
                        <Checkbox key={t.id} value={String(t.id)}>
                          {t.name} {t.whatsapp_number || t.phone ? `(${t.whatsapp_number || t.phone})` : ""}
                        </Checkbox>
                      ))}
                    </Stack>
                  </CheckboxGroup>
                </Box>
              )}
              <Button leftIcon={<MdSave />} colorScheme="blue" onClick={save} isLoading={saving}>
                حفظ الإعدادات
              </Button>
            </Box>

            <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="xl" p={5}>
              <Heading size="md" mb={4}>
                تذكير تجريبي
              </Heading>
              <HStack align="end" wrap="wrap">
                <FormControl maxW="sm">
                  <FormLabel>المدرس</FormLabel>
                  <Select
                    placeholder="اختر مدرسًا"
                    value={testTeacherId}
                    onChange={(e) => setTestTeacherId(e.target.value)}
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  leftIcon={<MdSend />}
                  colorScheme="green"
                  onClick={sendTest}
                  isLoading={testing}
                >
                  إرسال تجريبي
                </Button>
              </HStack>
            </Box>

            <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="xl" p={5}>
              <Heading size="md" mb={2}>
                إرسال رسالة للجميع
              </Heading>
              <Text fontSize="sm" color={muted} mb={4}>
                اكتب الرسالة مرة واحدة وأرسل نصًا أو صورة أو فيديو أو أي دمج بينهم مثل واتساب.
              </Text>
              <FormControl mb={3}>
                <FormLabel>نص الرسالة</FormLabel>
                <Textarea
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  rows={4}
                  placeholder="مثال: يوجد تحديث جديد على المنصة..."
                />
              </FormControl>
              <SimpleMediaRow
                label="صورة"
                url={broadcastImageUrl}
                setUrl={setBroadcastImageUrl}
                accept="image/*"
                uploading={uploadingKind === "image"}
                onUpload={(file) => uploadMedia(file, "image")}
                muted={muted}
              />
              <SimpleMediaRow
                label="فيديو"
                url={broadcastVideoUrl}
                setUrl={setBroadcastVideoUrl}
                accept="video/*"
                uploading={uploadingKind === "video"}
                onUpload={(file) => uploadMedia(file, "video")}
                muted={muted}
              />
              {broadcastImageUrl ? (
                <Image src={broadcastImageUrl} alt="preview" maxH="160px" borderRadius="md" mb={3} />
              ) : null}
              <FormControl display="flex" alignItems="center" mb={3}>
                <FormLabel mb={0}>إرسال لكل المدرسين</FormLabel>
                <Switch
                  isChecked={broadcastAll}
                  onChange={(e) => setBroadcastAll(e.target.checked)}
                />
              </FormControl>
              {!broadcastAll && (
                <Box
                  maxH="180px"
                  overflowY="auto"
                  borderWidth="1px"
                  borderColor={border}
                  borderRadius="md"
                  p={3}
                  mb={3}
                >
                  <CheckboxGroup
                    value={broadcastTeacherIds.map(String)}
                    onChange={(values) => setBroadcastTeacherIds(values.map(Number))}
                  >
                    <Stack spacing={2}>
                      {teachers.map((t) => (
                        <Checkbox key={t.id} value={String(t.id)}>
                          {t.name}
                        </Checkbox>
                      ))}
                    </Stack>
                  </CheckboxGroup>
                </Box>
              )}
              <Button
                leftIcon={<MdSend />}
                colorScheme="teal"
                onClick={sendBroadcast}
                isLoading={broadcasting}
              >
                إرسال الآن
              </Button>
              {(broadcasts.rows || []).length > 0 && (
                <Box mt={4}>
                  <Text fontWeight="bold" mb={2}>
                    آخر الإرسالات الجماعية
                  </Text>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>الوقت</Th>
                        <Th>المستهدفون</Th>
                        <Th>أُدرجت</Th>
                        <Th>تم / فشل</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {broadcasts.rows.map((row) => (
                        <Tr key={row.id}>
                          <Td>{row.createdAt ? new Date(row.createdAt).toLocaleString("ar-EG") : "—"}</Td>
                          <Td>{row.targetCount}</Td>
                          <Td>{row.enqueuedCount}</Td>
                          <Td>
                            {row.sentCount} / {row.failedCount}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </Box>

            <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="xl" p={5}>
              <Heading size="md" mb={4}>
                تنبيه انتهاء الاشتراك
              </Heading>
              <FormControl display="flex" alignItems="center" mb={4}>
                <FormLabel mb={0}>تفعيل تنبيه المدرسين منتهي الاشتراك</FormLabel>
                <Switch
                  isChecked={Boolean(draft?.subscriptionAlertEnabled)}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, subscriptionAlertEnabled: e.target.checked }))
                  }
                />
              </FormControl>
              <HStack align="end" mb={3} wrap="wrap">
                <FormControl maxW="120px">
                  <FormLabel>الساعة</FormLabel>
                  <NumberInput
                    min={0}
                    max={23}
                    value={draft?.subscriptionAlertHour ?? 10}
                    onChange={(_, n) =>
                      setDraft((d) => ({
                        ...d,
                        subscriptionAlertHour: Number.isNaN(n) ? 0 : n,
                      }))
                    }
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
                <FormControl maxW="120px">
                  <FormLabel>الدقيقة</FormLabel>
                  <NumberInput
                    min={0}
                    max={59}
                    value={draft?.subscriptionAlertMinute ?? 0}
                    onChange={(_, n) =>
                      setDraft((d) => ({
                        ...d,
                        subscriptionAlertMinute: Number.isNaN(n) ? 0 : n,
                      }))
                    }
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </HStack>
              <FormControl mb={3}>
                <FormLabel>نص الرسالة (يمكن استخدام {"{{name}}"} و {"{{ends_at}}"})</FormLabel>
                <Textarea
                  value={draft?.subscriptionAlertMessage || ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, subscriptionAlertMessage: e.target.value }))
                  }
                  rows={5}
                />
              </FormControl>
              <Button leftIcon={<MdSave />} onClick={save} isLoading={saving} mb={4}>
                حفظ إعدادات التنبيه
              </Button>
              {(subLogs.rows || []).length > 0 && (
                <Box overflowX="auto">
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>المدرس</Th>
                        <Th>اليوم</Th>
                        <Th>انتهى في</Th>
                        <Th>الحالة</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {subLogs.rows.map((row) => (
                        <Tr key={row.id}>
                          <Td>{row.teacherName}</Td>
                          <Td>{String(row.scheduleDate).slice(0, 10)}</Td>
                          <Td>{row.endsAt ? String(row.endsAt).slice(0, 10) : "—"}</Td>
                          <Td>
                            <Badge colorScheme={statusColor(row.status)}>
                              {STATUS_AR[row.status] || row.status}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </Box>

            <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="xl" p={5}>
              <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={3}>
                <Heading size="md">سجل الرسائل</Heading>
                <HStack>
                  <Input
                    placeholder="بحث..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    maxW="200px"
                  />
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    maxW="160px"
                  >
                    <option value="">كل الحالات</option>
                    <option value="pending">قيد الإرسال</option>
                    <option value="sent">تم الإرسال</option>
                    <option value="failed">فشل</option>
                    <option value="skipped">تم التخطي</option>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => load({ q: query, status, page: 1 })}
                  >
                    تصفية
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="orange"
                    variant="outline"
                    onClick={retryFailed}
                    isLoading={retrying}
                  >
                    إعادة الفاشل
                  </Button>
                </HStack>
              </Flex>
              <Box overflowX="auto">
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>المدرس</Th>
                      <Th>اليوم</Th>
                      <Th>الحالة</Th>
                      <Th>الهاتف</Th>
                      <Th>المهام</Th>
                      <Th>الخطأ</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {(logs.rows || []).map((row) => (
                      <Tr key={row.id}>
                        <Td>{row.teacherName}</Td>
                        <Td>{String(row.scheduleDate).slice(0, 10)}</Td>
                        <Td>
                          <Badge colorScheme={statusColor(row.status)}>
                            {STATUS_AR[row.status] || row.status}
                          </Badge>
                        </Td>
                        <Td>{row.phone || "—"}</Td>
                        <Td>{row.taskCount}</Td>
                        <Td maxW="240px">
                          <Text noOfLines={2} fontSize="xs" color={muted}>
                            {row.error || "—"}
                          </Text>
                        </Td>
                      </Tr>
                    ))}
                    {!(logs.rows || []).length && (
                      <Tr>
                        <Td colSpan={6}>
                          <Text textAlign="center" color={muted} py={4}>
                            لا توجد رسائل بعد.
                          </Text>
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </Box>
              <HStack mt={3} justify="space-between">
                <Text fontSize="sm" color={muted}>
                  الإجمالي: {logs.total || 0}
                </Text>
                <HStack>
                  <Button
                    size="xs"
                    isDisabled={page <= 1}
                    onClick={() => load({ page: page - 1 })}
                  >
                    السابق
                  </Button>
                  <Text fontSize="sm">{page}</Text>
                  <Button
                    size="xs"
                    isDisabled={(logs.rows || []).length < 50}
                    onClick={() => load({ page: page + 1 })}
                  >
                    التالي
                  </Button>
                </HStack>
              </HStack>
            </Box>
          </VStack>
        )}
      </Container>
    </Box>
  );
}
