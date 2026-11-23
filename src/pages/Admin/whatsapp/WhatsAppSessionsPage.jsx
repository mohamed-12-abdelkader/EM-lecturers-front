import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Input,
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
  Spinner,
} from "@chakra-ui/react";
import { MdRefresh, MdAdd, MdQrCode, MdDelete, MdSync } from "react-icons/md";
import {
  fetchWhatsAppStatus,
  fetchWhatsAppSessions,
  createWhatsAppSession,
  getWhatsAppSession,
  reconnectWhatsAppSession,
  deleteWhatsAppSession,
  patchWhatsAppSession,
} from "../../../api/whatsappAdminApi";
import {
  WaPageShell,
  WaCard,
  WaLoading,
  WaEmptyState,
  WaStatusBadge,
  WaStatRow,
} from "../../../components/whatsapp/ui";

export default function WhatsAppSessionsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [newId, setNewId] = useState("");
  const [creating, setCreating] = useState(false);
  const [qrModal, setQrModal] = useState({ open: false, session: null, loading: false });

  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

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

  const readyCount = sessions.filter((s) => s.status === "ready").length;
  const platformCount = sessions.filter((s) => !s.teacher_id).length;

  return (
    <WaPageShell
      title="جلسات واتساب"
      description="ربط أرقام واتساب عبر QR وإدارة حالتها للمنصة"
      showAdminNav
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
            بوابة واتساب غير مُعدّة — أضف WHATSAPP_API_KEY في السيرفر ثم أعد التشغيل.
          </Alert>
        ) : null
      }
    >
      {!loading && sessions.length > 0 && (
        <WaStatRow
          items={[
            { label: "إجمالي الجلسات", value: sessions.length },
            { label: "متصلة", value: readyCount, accent: "green.500" },
            { label: "جلسات منصة", value: platformCount },
            {
              label: "جلسات مدرسين",
              value: sessions.length - platformCount,
            },
          ]}
        />
      )}

      <WaCard
        title="ربط رقم جديد"
        description="اسم تقني بالإنجليزية (حروف وأرقام و _ و -)، مثل: support-01"
      >
        <form onSubmit={handleCreate}>
          <Flex gap={3} direction={{ base: "column", sm: "row" }} align={{ sm: "center" }}>
            <Input
              placeholder="support-01"
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              dir="ltr"
              maxW={{ sm: "280px" }}
              isDisabled={!configured || creating}
            />
            <Button
              type="submit"
              colorScheme="green"
              leftIcon={<MdAdd />}
              isLoading={creating}
              isDisabled={!configured}
              w={{ base: "100%", sm: "auto" }}
            >
              إنشاء وربط
            </Button>
          </Flex>
        </form>
        <Text fontSize="xs" color={muted} mt={3}>
          من الجوال: واتساب ← الإعدادات ← الأجهزة المرتبطة ← ربط جهاز ← امسح الرمز
        </Text>
      </WaCard>

      <WaCard
        title="الأرقام المرتبطة"
        actions={<Badge borderRadius="full">{sessions.length} جلسة</Badge>}
      >
        {loading ? (
          <WaLoading />
        ) : sessions.length === 0 ? (
          <WaEmptyState
            title="لا توجد جلسات بعد"
            description="أنشئ جلسة جديدة من الأعلى وامسح رمز QR من الجوال."
          />
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
                <Flex justify="space-between" align="start" mb={3} gap={2}>
                  <Box minW={0}>
                    <Text fontWeight="700" dir="ltr" noOfLines={1}>
                      {s.id}
                    </Text>
                    <Text fontSize="sm" color={muted} dir="ltr">
                      {s.phone_number || "—"}
                    </Text>
                    {s.teacher_id ? (
                      <Badge colorScheme="purple" mt={1} fontSize="xs" borderRadius="full">
                        مدرس: {s.teacher_name || `#${s.teacher_id}`}
                      </Badge>
                    ) : (
                      <Badge colorScheme="blue" mt={1} fontSize="xs" borderRadius="full">
                        منصة
                      </Badge>
                    )}
                  </Box>
                  <WaStatusBadge status={s.status} />
                </Flex>
                <FormControl display="flex" alignItems="center" mb={3}>
                  <FormLabel htmlFor={`en-${s.id}`} mb={0} fontSize="sm" me={2}>
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

      <Modal
        isOpen={qrModal.open}
        onClose={() => setQrModal({ open: false, session: null, loading: false })}
        isCentered
        size="md"
      >
        <ModalOverlay />
        <ModalContent dir="rtl" borderRadius="xl">
          <ModalHeader>ربط الجلسة {qrModal.session?.id}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {qrModal.loading ? (
              <Flex justify="center" py={10}>
                <Spinner color="green.400" />
              </Flex>
            ) : qrModal.session?.status === "ready" ? (
              <Alert status="success" borderRadius="lg">
                <AlertIcon />
                الجلسة متصلة وجاهزة للإرسال
                {qrModal.session.phone_number ? ` — ${qrModal.session.phone_number}` : ""}
              </Alert>
            ) : qrModal.session?.qr ? (
              <VStack>
                <Image src={qrModal.session.qr} alt="QR" maxW="260px" borderRadius="md" />
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
                <WaStatusBadge status={qrModal.session?.status} />
                <Button size="sm" onClick={refreshQr} leftIcon={<MdRefresh />}>
                  تحديث
                </Button>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </WaPageShell>
  );
}
