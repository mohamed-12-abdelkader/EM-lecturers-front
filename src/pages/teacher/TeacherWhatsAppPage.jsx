import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Spinner,
  useToast,
  useColorModeValue,
  Container,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Image,
  Switch,
  FormControl,
  FormLabel,
  SimpleGrid,
  Alert,
  AlertIcon,
  IconButton,
  Tooltip,
  Textarea,
  Checkbox,
  CheckboxGroup,
  Input,
  Divider,
} from "@chakra-ui/react";
import { MdRefresh, MdAdd, MdQrCode, MdDelete, MdSync, MdSend } from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa";
import {
  fetchTeacherWaStatus,
  fetchTeacherWaServices,
  fetchTeacherWaSessions,
  createTeacherWaSession,
  getTeacherWaSession,
  reconnectTeacherWaSession,
  deleteTeacherWaSession,
  putTeacherWaServiceSessions,
  notifyTeacherWaStudents,
  sendTeacherWaParentReports,
  fetchTeacherCourseStudents,
} from "../../api/whatsappTeacherApi";

const STATUS_META = {
  ready: { label: "متصلة", color: "green" },
  qr: { label: "بانتظار المسح", color: "orange" },
  pending: { label: "قيد التحضير", color: "gray" },
  authenticated: { label: "جارٍ الربط", color: "blue" },
  disconnected: { label: "غير متصلة", color: "red" },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status || "غير معروف", color: "gray" };
  return (
    <Badge colorScheme={meta.color} borderRadius="md" px={2} py={0.5}>
      {meta.label}
    </Badge>
  );
}

function summarizeResult(result) {
  const sent = result?.sent?.length || 0;
  const skipped = result?.skipped?.length || 0;
  const failed = result?.failed?.length || 0;
  return `أُرسل: ${sent} | تخطّي: ${skipped} | فشل: ${failed}`;
}

export default function TeacherWhatsAppPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [status, setStatus] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [services, setServices] = useState([]);
  const [students, setStudents] = useState([]);
  const [creating, setCreating] = useState(false);
  const [qrModal, setQrModal] = useState({ open: false, session: null, loading: false });
  const [savingServiceKey, setSavingServiceKey] = useState(null);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyIds, setNotifyIds] = useState([]);
  const [reportIds, setReportIds] = useState([]);
  const [sendingNotify, setSendingNotify] = useState(false);
  const [sendingReports, setSendingReports] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const title = useColorModeValue("gray.900", "white");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [st, sess, svc, studs] = await Promise.all([
        fetchTeacherWaStatus(),
        fetchTeacherWaSessions().catch(() => []),
        fetchTeacherWaServices(),
        fetchTeacherCourseStudents().catch(() => []),
      ]);
      setStatus(st);
      setConfigured(Boolean(st?.configured));
      setSessions(Array.isArray(sess) ? sess : []);
      setServices(Array.isArray(svc) ? svc : []);
      setStudents(Array.isArray(studs) ? studs : []);
    } catch (err) {
      toast({
        title: "تعذّر تحميل واتساب المدرس",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredStudents = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) return students;
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term) ||
        s.phone?.includes(term),
    );
  }, [students, studentSearch]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const session = await createTeacherWaSession();
      toast({ title: "تم إنشاء الجلسة — امسح رمز QR", status: "success" });
      await load();
      if (session?.id) openQr(session.id);
    } catch (err) {
      toast({
        title: "تعذّر إنشاء الجلسة",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setCreating(false);
    }
  };

  const openQr = async (slug) => {
    setQrModal({ open: true, session: null, loading: true });
    try {
      const session = await getTeacherWaSession(slug);
      setQrModal({ open: true, session, loading: false });
    } catch (err) {
      setQrModal({ open: false, session: null, loading: false });
      toast({
        title: "تعذّر جلب رمز QR",
        description:
          err?.response?.data?.message ||
          err?.response?.data?.errors ||
          err?.message ||
          "تحقق من بوابة واتساب وسجل الجلسة",
        status: "error",
        duration: 8000,
        isClosable: true,
      });
    }
  };

  const handleReconnect = async (slug) => {
    try {
      await reconnectTeacherWaSession(slug);
      toast({ title: "تمت إعادة الربط", status: "success" });
      load();
      openQr(slug);
    } catch (err) {
      toast({
        title: "تعذّرت إعادة الربط",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    }
  };

  const handleDelete = async (slug) => {
    if (!window.confirm(`هل تريد حذف جلسة «${slug}»؟`)) return;
    try {
      await deleteTeacherWaSession(slug);
      toast({ title: "تم حذف الجلسة", status: "success" });
      load();
    } catch (err) {
      toast({
        title: "تعذّر حذف الجلسة",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    }
  };

  const toggleServiceSession = async (serviceKey, slug, checked) => {
    const svc = services.find((s) => s.key === serviceKey);
    const current = (svc?.assigned_sessions || []).map((a) => a.session_slug);
    const next = checked
      ? [...new Set([...current, slug])]
      : current.filter((s) => s !== slug);
    setSavingServiceKey(serviceKey);
    try {
      const updated = await putTeacherWaServiceSessions(serviceKey, next);
      setServices(updated);
      toast({ title: "تم تحديث الخدمة", status: "success" });
    } catch (err) {
      toast({
        title: "تعذّر تحديث الخدمة",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setSavingServiceKey(null);
    }
  };

  const handleNotify = async () => {
    if (!notifyMessage.trim() || !notifyIds.length) {
      toast({ title: "اكتب رسالة واختر طلاباً", status: "warning" });
      return;
    }
    setSendingNotify(true);
    try {
      const result = await notifyTeacherWaStudents(
        notifyMessage.trim(),
        notifyIds.map(Number),
      );
      toast({ title: "تم جدولة الإشعارات", description: summarizeResult(result), status: "success" });
    } catch (err) {
      toast({
        title: "تعذّر الإرسال",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setSendingNotify(false);
    }
  };

  const handleReports = async () => {
    if (!reportIds.length) {
      toast({ title: "اختر طلاباً لإرسال التقارير", status: "warning" });
      return;
    }
    setSendingReports(true);
    try {
      const result = await sendTeacherWaParentReports(reportIds.map(Number));
      toast({ title: "تم جدولة التقارير", description: summarizeResult(result), status: "success" });
    } catch (err) {
      toast({
        title: "تعذّر إرسال التقارير",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setSendingReports(false);
    }
  };

  const canAddMore = (status?.total || sessions.length) < (status?.max_sessions || 2);

  return (
    <Box minH="100vh" bg={pageBg} dir="rtl" pb={10} pt={4}>
      <Container maxW="1100px" px={{ base: 3, md: 6 }}>
        <VStack spacing={5} align="stretch">
          <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
            <Box>
              <HStack spacing={2} mb={1}>
                <Box as={FaWhatsapp} color="green.500" boxSize={7} />
                <Heading size="lg" color={title}>
                  واتساب المدرس
                </Heading>
              </HStack>
              <Text fontSize="sm" color={muted}>
                اربط أرقامك وأرسل إشعارات الطلاب وتقارير أولياء الأمور
              </Text>
            </Box>
            <IconButton
              aria-label="تحديث"
              icon={<MdRefresh />}
              size="sm"
              onClick={load}
              isLoading={loading}
            />
          </Flex>

          {!configured && (
            <Alert status="warning" borderRadius="lg">
              <AlertIcon />
              بوابة واتساب غير مُعدّة حالياً. تواصل مع إدارة المنصة.
            </Alert>
          )}

          {/* Numbers */}
          <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="xl" p={5}>
            <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={2}>
              <Heading size="sm">أرقامي</Heading>
              <Button
                size="sm"
                colorScheme="green"
                leftIcon={<MdAdd />}
                onClick={handleCreate}
                isLoading={creating}
                isDisabled={!configured || !canAddMore}
              >
                ربط رقم
              </Button>
            </Flex>
            <Text fontSize="sm" color={muted} mb={4}>
              حد أقصى رقمين. الإرسال يتم فقط عبر أرقامك المتصلة المعيّنة للخدمات.
            </Text>
            {loading ? (
              <Flex justify="center" py={8}>
                <Spinner />
              </Flex>
            ) : sessions.length === 0 ? (
              <Text color={muted} textAlign="center" py={6}>
                لا توجد أرقام بعد — ابدأ بربط رقمك
              </Text>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                {sessions.map((s) => (
                  <Box key={s.id} border="1px solid" borderColor={border} borderRadius="lg" p={4}>
                    <Flex justify="space-between" mb={2}>
                      <Box>
                        <Text fontWeight="700" dir="ltr" textAlign="right">
                          {s.id}
                        </Text>
                        <Text fontSize="sm" color={muted} dir="ltr">
                          {s.phone_number || "—"}
                        </Text>
                      </Box>
                      <StatusBadge status={s.status} />
                    </Flex>
                    <HStack spacing={2}>
                      <Tooltip label="عرض QR">
                        <IconButton
                          aria-label="QR"
                          icon={<MdQrCode />}
                          size="sm"
                          onClick={() => openQr(s.id)}
                        />
                      </Tooltip>
                      <Tooltip label="إعادة ربط">
                        <IconButton
                          aria-label="reconnect"
                          icon={<MdSync />}
                          size="sm"
                          onClick={() => handleReconnect(s.id)}
                        />
                      </Tooltip>
                      <Tooltip label="حذف">
                        <IconButton
                          aria-label="delete"
                          icon={<MdDelete />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleDelete(s.id)}
                        />
                      </Tooltip>
                    </HStack>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </Box>

          {/* Services */}
          <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="xl" p={5}>
            <Heading size="sm" mb={2}>
              الخدمات
            </Heading>
            <Text fontSize="sm" color={muted} mb={4}>
              عيّن أرقامك الجاهزة لكل خدمة
            </Text>
            <VStack align="stretch" spacing={4}>
              {services.map((svc) => {
                const assigned = new Set(
                  (svc.assigned_sessions || []).map((a) => a.session_slug),
                );
                return (
                  <Box key={svc.key} border="1px solid" borderColor={border} borderRadius="lg" p={4}>
                    <Flex justify="space-between" mb={3} wrap="wrap" gap={2}>
                      <Box>
                        <Text fontWeight="700">{svc.name}</Text>
                        <Text fontSize="xs" color={muted}>
                          {svc.description}
                        </Text>
                      </Box>
                      <Badge colorScheme={svc.is_enabled ? "green" : "gray"}>
                        {svc.is_enabled ? "مفعّل" : "معطّل"}
                      </Badge>
                    </Flex>
                    {sessions.length === 0 ? (
                      <Text fontSize="sm" color={muted}>
                        اربط رقماً أولاً
                      </Text>
                    ) : (
                      <VStack align="stretch" spacing={2}>
                        {sessions.map((s) => (
                          <FormControl
                            key={`${svc.key}-${s.id}`}
                            display="flex"
                            alignItems="center"
                          >
                            <Switch
                              me={3}
                              isChecked={assigned.has(s.id)}
                              isDisabled={savingServiceKey === svc.key}
                              onChange={(e) =>
                                toggleServiceSession(svc.key, s.id, e.target.checked)
                              }
                              colorScheme="green"
                            />
                            <FormLabel mb={0} fontSize="sm">
                              <HStack spacing={2}>
                                <Text dir="ltr">{s.id}</Text>
                                <StatusBadge status={s.status} />
                              </HStack>
                            </FormLabel>
                          </FormControl>
                        ))}
                      </VStack>
                    )}
                  </Box>
                );
              })}
            </VStack>
          </Box>

          {/* Notify */}
          <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="xl" p={5}>
            <Heading size="sm" mb={2}>
              إرسال إشعار
            </Heading>
            <Text fontSize="sm" color={muted} mb={3}>
              رسالة نصية لطلاب كورساتك (حد 50 طالباً)
            </Text>
            <Textarea
              value={notifyMessage}
              onChange={(e) => setNotifyMessage(e.target.value.slice(0, 1000))}
              placeholder="اكتب رسالة الإشعار..."
              mb={3}
              rows={4}
            />
            <Text fontSize="xs" color={muted} mb={3}>
              {notifyMessage.length}/1000
            </Text>
            <Input
              placeholder="بحث عن طالب..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              mb={3}
              maxW="360px"
            />
            <Box maxH="220px" overflowY="auto" border="1px solid" borderColor={border} borderRadius="md" p={3} mb={3}>
              <CheckboxGroup
                value={notifyIds.map(String)}
                onChange={(vals) => setNotifyIds(vals.slice(0, 50))}
              >
                <VStack align="stretch" spacing={2}>
                  {filteredStudents.map((s) => (
                    <Checkbox key={`n-${s.id}`} value={String(s.id)}>
                      {s.name}{" "}
                      <Text as="span" color={muted} fontSize="sm" dir="ltr">
                        {s.phone || "بدون هاتف"}
                      </Text>
                    </Checkbox>
                  ))}
                  {filteredStudents.length === 0 && (
                    <Text color={muted} fontSize="sm">
                      لا يوجد طلاب
                    </Text>
                  )}
                </VStack>
              </CheckboxGroup>
            </Box>
            <Button
              colorScheme="green"
              leftIcon={<MdSend />}
              onClick={handleNotify}
              isLoading={sendingNotify}
              isDisabled={!configured}
            >
              إرسال الإشعار ({notifyIds.length})
            </Button>
          </Box>

          {/* Parent reports */}
          <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="xl" p={5}>
            <Heading size="sm" mb={2}>
              تقرير ولي الأمر
            </Heading>
            <Text fontSize="sm" color={muted} mb={3}>
              يُرسل ملخص التقدم لرقم ولي الأمر (أو رقم الطالب إن لم يتوفر)
            </Text>
            <Divider mb={3} />
            <Box maxH="220px" overflowY="auto" border="1px solid" borderColor={border} borderRadius="md" p={3} mb={3}>
              <CheckboxGroup
                value={reportIds.map(String)}
                onChange={(vals) => setReportIds(vals.slice(0, 50))}
              >
                <VStack align="stretch" spacing={2}>
                  {students.map((s) => (
                    <Checkbox key={`r-${s.id}`} value={String(s.id)}>
                      {s.name}
                    </Checkbox>
                  ))}
                  {students.length === 0 && (
                    <Text color={muted} fontSize="sm">
                      لا يوجد طلاب
                    </Text>
                  )}
                </VStack>
              </CheckboxGroup>
            </Box>
            <Button
              colorScheme="teal"
              leftIcon={<MdSend />}
              onClick={handleReports}
              isLoading={sendingReports}
              isDisabled={!configured}
            >
              إرسال التقارير ({reportIds.length})
            </Button>
          </Box>
        </VStack>
      </Container>

      <Modal
        isOpen={qrModal.open}
        onClose={() => setQrModal({ open: false, session: null, loading: false })}
        isCentered
        size="md"
      >
        <ModalOverlay />
        <ModalContent dir="rtl">
          <ModalHeader>مسح رمز QR</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {qrModal.loading ? (
              <Flex justify="center" py={10}>
                <Spinner />
              </Flex>
            ) : qrModal.session?.qr ? (
              <VStack>
                <Image src={qrModal.session.qr} alt="QR" maxW="260px" />
                <Text fontSize="sm" color={muted} textAlign="center">
                  واتساب ← الأجهزة المرتبطة ← ربط جهاز
                </Text>
                <Button size="sm" onClick={() => openQr(qrModal.session.id)}>
                  تحديث الرمز
                </Button>
              </VStack>
            ) : (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                {qrModal.session?.status === "ready"
                  ? "الجلسة متصلة بالفعل"
                  : "لا يوجد رمز QR حالياً — جرّب إعادة الربط"}
              </Alert>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
