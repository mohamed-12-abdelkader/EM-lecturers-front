import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  useToast,
  useColorModeValue,
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
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import { MdRefresh, MdAdd, MdQrCode, MdDelete, MdSync, MdSend } from "react-icons/md";
import TeacherParentExamPanel from "./TeacherParentExamPanel";
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
import {
  WaPageShell,
  WaCard,
  WaLoading,
  WaEmptyState,
  WaStatusBadge,
  WaStatRow,
} from "../../components/whatsapp/ui";

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

  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");

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
  const readyCount = sessions.filter((s) => s.status === "ready").length;

  return (
    <WaPageShell
      title="واتساب المدرس"
      description="اربط أرقامك، فعّل الدعم العلمي، وأرسل الإشعارات وتقارير أولياء الأمور"
      maxW="1100px"
      actions={
        <IconButton
          aria-label="تحديث"
          icon={<MdRefresh />}
          size="sm"
          variant="outline"
          onClick={load}
          isLoading={loading}
        />
      }
      alert={
        !configured ? (
          <Alert status="warning" borderRadius="xl">
            <AlertIcon />
            بوابة واتساب غير مُعدّة حالياً. تواصل مع إدارة المنصة.
          </Alert>
        ) : null
      }
    >
      {!loading && (
        <WaStatRow
          columns={{ base: 2, md: 3 }}
          items={[
            { label: "أرقامي", value: `${sessions.length}/${status?.max_sessions || 2}` },
            { label: "متصلة", value: readyCount, accent: "green.500" },
            { label: "الخدمات", value: services.length },
          ]}
        />
      )}

      {loading ? (
        <WaLoading />
      ) : (
        <Tabs colorScheme="green" variant="soft-rounded" size="sm" isLazy>
          <Box overflowX="auto" pb={1}>
            <TabList minW="max-content" gap={1}>
              <Tab fontWeight="700">أرقامي</Tab>
              <Tab fontWeight="700">الخدمات</Tab>
              <Tab fontWeight="700">إشعار الطلاب</Tab>
              <Tab fontWeight="700">تقارير أولياء</Tab>
              <Tab fontWeight="700">امتحانات أولياء</Tab>
            </TabList>
          </Box>

          <TabPanels>
            <TabPanel px={0} pt={4}>
              <WaCard
                title="أرقامي"
                description="حد أقصى رقمين. الإرسال يتم فقط عبر أرقامك المتصلة المعيّنة للخدمات."
                actions={
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
                }
              >
                {sessions.length === 0 ? (
                  <WaEmptyState
                    title="لا توجد أرقام بعد"
                    description="ابدأ بربط رقم واتساب عبر زر «ربط رقم»."
                  />
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    {sessions.map((s) => (
                      <Box key={s.id} border="1px solid" borderColor={border} borderRadius="lg" p={4}>
                        <Flex justify="space-between" mb={3} gap={2}>
                          <Box minW={0}>
                            <Text fontWeight="700" dir="ltr" noOfLines={1}>
                              {s.id}
                            </Text>
                            <Text fontSize="sm" color={muted} dir="ltr">
                              {s.phone_number || "—"}
                            </Text>
                          </Box>
                          <WaStatusBadge status={s.status} />
                        </Flex>
                        <HStack spacing={2}>
                          <Tooltip label="عرض QR">
                            <IconButton
                              aria-label="QR"
                              icon={<MdQrCode />}
                              size="sm"
                              variant="outline"
                              onClick={() => openQr(s.id)}
                            />
                          </Tooltip>
                          <Tooltip label="إعادة ربط">
                            <IconButton
                              aria-label="reconnect"
                              icon={<MdSync />}
                              size="sm"
                              variant="outline"
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
              </WaCard>
            </TabPanel>

            <TabPanel px={0} pt={4}>
              <WaCard
                title="ربط الخدمات"
                description="عيّن أرقامك الجاهزة لكل خدمة. «الدعم العلمي» يرد تلقائيًا على أسئلة طلابك من موادك فقط."
              >
                <VStack align="stretch" spacing={3}>
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
                          <Badge colorScheme={svc.is_enabled ? "green" : "gray"} borderRadius="full">
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
                              <FormControl key={`${svc.key}-${s.id}`} display="flex" alignItems="center">
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
                                    <WaStatusBadge status={s.status} />
                                  </HStack>
                                </FormLabel>
                              </FormControl>
                            ))}
                          </VStack>
                        )}
                      </Box>
                    );
                  })}
                  {services.length === 0 && (
                    <WaEmptyState title="لا توجد خدمات متاحة" />
                  )}
                </VStack>
              </WaCard>
            </TabPanel>

            <TabPanel px={0} pt={4}>
              <WaCard
                title="إرسال إشعار"
                description="رسالة نصية لطلاب كورساتك (حد 50 طالباً)"
              >
                <Textarea
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value.slice(0, 1000))}
                  placeholder="اكتب رسالة الإشعار..."
                  mb={2}
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
                  maxW={{ md: "360px" }}
                />
                <Box
                  maxH="220px"
                  overflowY="auto"
                  border="1px solid"
                  borderColor={border}
                  borderRadius="lg"
                  p={3}
                  mb={3}
                >
                  <CheckboxGroup
                    value={notifyIds.map(String)}
                    onChange={(vals) => setNotifyIds(vals.slice(0, 50))}
                  >
                    <VStack align="stretch" spacing={2}>
                      {filteredStudents.map((s) => (
                        <Checkbox key={`n-${s.id}`} value={String(s.id)} colorScheme="green">
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
                  w={{ base: "100%", sm: "auto" }}
                >
                  إرسال الإشعار ({notifyIds.length})
                </Button>
              </WaCard>
            </TabPanel>

            <TabPanel px={0} pt={4}>
              <WaCard
                title="تقرير ولي الأمر"
                description="يُرسل ملخص التقدم لرقم ولي الأمر (أو رقم الطالب إن لم يتوفر)"
              >
                <Box
                  maxH="260px"
                  overflowY="auto"
                  border="1px solid"
                  borderColor={border}
                  borderRadius="lg"
                  p={3}
                  mb={3}
                >
                  <CheckboxGroup
                    value={reportIds.map(String)}
                    onChange={(vals) => setReportIds(vals.slice(0, 50))}
                  >
                    <VStack align="stretch" spacing={2}>
                      {students.map((s) => (
                        <Checkbox key={`r-${s.id}`} value={String(s.id)} colorScheme="teal">
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
                  w={{ base: "100%", sm: "auto" }}
                >
                  إرسال التقارير ({reportIds.length})
                </Button>
              </WaCard>
            </TabPanel>

            <TabPanel px={0} pt={4}>
              <TeacherParentExamPanel cardBg={cardBg} border={border} muted={muted} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}

      <Modal
        isOpen={qrModal.open}
        onClose={() => setQrModal({ open: false, session: null, loading: false })}
        isCentered
        size="md"
      >
        <ModalOverlay />
        <ModalContent dir="rtl" borderRadius="xl">
          <ModalHeader>مسح رمز QR</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {qrModal.loading ? (
              <Flex justify="center" py={10}>
                <Spinner color="green.400" />
              </Flex>
            ) : qrModal.session?.qr ? (
              <VStack>
                <Image src={qrModal.session.qr} alt="QR" maxW="260px" borderRadius="md" />
                <Text fontSize="sm" color={muted} textAlign="center">
                  واتساب ← الأجهزة المرتبطة ← ربط جهاز
                </Text>
                <Button size="sm" onClick={() => openQr(qrModal.session.id)}>
                  تحديث الرمز
                </Button>
              </VStack>
            ) : (
              <Alert status="info" borderRadius="lg">
                <AlertIcon />
                {qrModal.session?.status === "ready"
                  ? "الجلسة متصلة بالفعل"
                  : "لا يوجد رمز QR حالياً — جرّب إعادة الربط"}
              </Alert>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </WaPageShell>
  );
}
