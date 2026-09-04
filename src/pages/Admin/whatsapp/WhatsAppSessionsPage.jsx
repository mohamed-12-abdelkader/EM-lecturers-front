import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Input,
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
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import {
  MdRefresh,
  MdAdd,
  MdQrCode,
  MdDelete,
  MdSync,
} from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa";
import {
  fetchWhatsAppStatus,
  fetchWhatsAppSessions,
  createWhatsAppSession,
  getWhatsAppSession,
  reconnectWhatsAppSession,
  deleteWhatsAppSession,
  patchWhatsAppSession,
} from "../../../api/whatsappAdminApi";

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

export default function WhatsAppSessionsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [newId, setNewId] = useState("");
  const [creating, setCreating] = useState(false);
  const [qrModal, setQrModal] = useState({ open: false, session: null, loading: false });

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const title = useColorModeValue("gray.900", "white");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const status = await fetchWhatsAppStatus();
      setConfigured(Boolean(status?.configured));
      if (!status?.configured) {
        setSessions([]);
        return;
      }
      const list = await fetchWhatsAppSessions();
      setSessions(Array.isArray(list) ? list : []);
    } catch (err) {
      toast({
        title: "تعذّر تحميل جلسات واتساب",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const openQr = async (id) => {
    setQrModal({ open: true, session: { id, status: "pending" }, loading: true });
    try {
      const session = await getWhatsAppSession(id);
      setQrModal({ open: true, session, loading: false });
    } catch {
      toast({ title: "تعذّر جلب رمز الربط", status: "error" });
      setQrModal({ open: false, session: null, loading: false });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const id = newId.trim();
    if (!id) {
      toast({ title: "أدخل اسم الجلسة", status: "warning" });
      return;
    }
    setCreating(true);
    try {
      await createWhatsAppSession(id);
      toast({ title: "تم إنشاء الجلسة — امسح رمز QR", status: "success" });
      setNewId("");
      await load();
      openQr(id);
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

  const handleReconnect = async (id) => {
    setQrModal({ open: true, session: { id, status: "pending" }, loading: true });
    try {
      await reconnectWhatsAppSession(id);
      toast({ title: "جارٍ إعادة التشغيل — انتظر QR أو «متصلة»", status: "info" });
      for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        const poll = await getWhatsAppSession(id);
        setQrModal({ open: true, session: poll, loading: false });
        if (poll?.status === "ready" || poll?.qr) break;
      }
      await load();
    } catch {
      toast({ title: "تعذّرت إعادة الربط", status: "error" });
      setQrModal({ open: false, session: null, loading: false });
    }
  };

  const refreshQr = async () => {
    if (!qrModal.session?.id) return;
    setQrModal((m) => ({ ...m, loading: true }));
    try {
      const session = await getWhatsAppSession(qrModal.session.id);
      setQrModal({ open: true, session, loading: false });
      if (session?.status === "ready") {
        toast({ title: "تم الربط بنجاح", status: "success" });
        load();
      }
    } catch {
      setQrModal((m) => ({ ...m, loading: false }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`هل تريد حذف جلسة «${id}»؟`)) return;
    try {
      await deleteWhatsAppSession(id);
      toast({ title: "تم حذف الجلسة", status: "success" });
      load();
    } catch {
      toast({ title: "تعذّر حذف الجلسة", status: "error" });
    }
  };

  const toggleEnabled = async (session) => {
    try {
      await patchWhatsAppSession(session.id, { is_enabled: !session.is_enabled });
      load();
    } catch {
      toast({ title: "تعذّر تحديث الجلسة", status: "error" });
    }
  };

  return (
    <Box minH="100vh" bg={pageBg} dir="rtl" pb={10} pt={4}>
      <Container maxW="1100px" px={{ base: 3, md: 6 }}>
        <VStack spacing={5} align="stretch">
          <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
            <Box>
              <HStack spacing={2} mb={1}>
                <Box as={FaWhatsapp} color="green.500" boxSize={7} />
                <Heading size="lg" color={title}>
                  جلسات واتساب
                </Heading>
              </HStack>
              <Text fontSize="sm" color={muted}>
                ربط أرقام واتساب عبر QR وإدارة حالتها للمنصة
              </Text>
            </Box>
            <HStack>
              <Button
                as={RouterLink}
                to="/admin/whatsapp/policy"
                size="sm"
                variant="outline"
              >
                تخصيص الدعم
              </Button>
              <Button
                as={RouterLink}
                to="/admin/whatsapp/inbox"
                size="sm"
                variant="outline"
              >
                صندوق الوارد
              </Button>
              <Button
                as={RouterLink}
                to="/admin/whatsapp/services"
                size="sm"
                variant="outline"
              >
                الخدمات
              </Button>
              <Button
                as={RouterLink}
                to="/admin/whatsapp/monitor"
                size="sm"
                variant="outline"
              >
                المراقبة
              </Button>
              <IconButton
                aria-label="تحديث"
                icon={<MdRefresh />}
                size="sm"
                onClick={load}
                isLoading={loading}
              />
            </HStack>
          </Flex>

          {!configured && (
            <Alert status="warning" borderRadius="lg">
              <AlertIcon />
              بوابة واتساب غير مُعدّة — أضف WHATSAPP_API_KEY في السيرفر ثم أعد التشغيل.
            </Alert>
          )}

          <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="xl" p={5}>
            <Heading size="sm" mb={2}>
              ربط رقم جديد
            </Heading>
            <Text fontSize="sm" color={muted} mb={4}>
              اسم تقني بالإنجليزية (حروف وأرقام و _ و -)، مثل: support-01
            </Text>
            <form onSubmit={handleCreate}>
              <HStack>
                <Input
                  placeholder="support-01"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  dir="ltr"
                  maxW="280px"
                  isDisabled={!configured || creating}
                />
                <Button
                  type="submit"
                  colorScheme="green"
                  leftIcon={<MdAdd />}
                  isLoading={creating}
                  isDisabled={!configured}
                >
                  إنشاء وربط
                </Button>
              </HStack>
            </form>
            <Text fontSize="xs" color={muted} mt={3}>
              من الجوال: واتساب ← الإعدادات ← الأجهزة المرتبطة ← ربط جهاز ← امسح الرمز
            </Text>
          </Box>

          <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="xl" p={5}>
            <Flex justify="space-between" mb={4}>
              <Heading size="sm">الأرقام المرتبطة</Heading>
              <Badge>{sessions.length} جلسة</Badge>
            </Flex>

            {loading ? (
              <Flex justify="center" py={10}>
                <Spinner />
              </Flex>
            ) : sessions.length === 0 ? (
              <Text color={muted} textAlign="center" py={8}>
                لا توجد جلسات بعد
              </Text>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                {sessions.map((s) => (
                  <Box
                    key={s.id}
                    border="1px solid"
                    borderColor={border}
                    borderRadius="lg"
                    p={4}
                  >
                    <Flex justify="space-between" align="start" mb={2}>
                      <Box>
                        <Text fontWeight="700" dir="ltr" textAlign="right">
                          {s.id}
                        </Text>
                        <Text fontSize="sm" color={muted} dir="ltr">
                          {s.phone_number || "—"}
                        </Text>
                        {s.teacher_id ? (
                          <Badge colorScheme="purple" mt={1} fontSize="xs">
                            مدرس: {s.teacher_name || `#${s.teacher_id}`}
                          </Badge>
                        ) : (
                          <Badge colorScheme="blue" mt={1} fontSize="xs">
                            منصة
                          </Badge>
                        )}
                      </Box>
                      <StatusBadge status={s.status} />
                    </Flex>
                    <FormControl display="flex" alignItems="center" mb={3}>
                      <FormLabel htmlFor={`en-${s.id}`} mb={0} fontSize="sm">
                        مفعّلة
                      </FormLabel>
                      <Switch
                        id={`en-${s.id}`}
                        isChecked={s.is_enabled !== false}
                        onChange={() => toggleEnabled(s)}
                        colorScheme="green"
                      />
                    </FormControl>
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
          <ModalHeader>
            ربط الجلسة {qrModal.session?.id}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {qrModal.loading ? (
              <Flex justify="center" py={10}>
                <Spinner />
              </Flex>
            ) : qrModal.session?.status === "ready" ? (
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                الجلسة متصلة وجاهزة للإرسال
                {qrModal.session.phone_number
                  ? ` — ${qrModal.session.phone_number}`
                  : ""}
              </Alert>
            ) : qrModal.session?.qr ? (
              <VStack>
                <Image src={qrModal.session.qr} alt="QR" maxW="260px" />
                <Text fontSize="sm" color={muted}>
                  امسح الرمز من واتساب على الجوال
                </Text>
                <Button size="sm" onClick={refreshQr} leftIcon={<MdRefresh />}>
                  تحديث الحالة
                </Button>
              </VStack>
            ) : (
              <VStack>
                <Text color={muted}>بانتظار رمز QR…</Text>
                <StatusBadge status={qrModal.session?.status} />
                <Button size="sm" onClick={refreshQr} leftIcon={<MdRefresh />}>
                  تحديث
                </Button>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
