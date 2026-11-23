import React, { useCallback, useEffect, useState } from "react";
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
  SimpleGrid,
  Input,
  Textarea,
  Select,
  FormControl,
  FormLabel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { MdRefresh, MdSend } from "react-icons/md";
import {
  fetchWhatsAppStatus,
  fetchWhatsAppQueueStats,
  fetchWhatsAppConversations,
  fetchWhatsAppServices,
  sendWhatsAppTestMessage,
} from "../../../api/whatsappAdminApi";
import {
  WaPageShell,
  WaCard,
  WaLoading,
  WaEmptyState,
  WaStatRow,
  WaStatusBadge,
} from "../../../components/whatsapp/ui";

export default function WhatsAppMonitorPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [stats, setStats] = useState({});
  const [conversations, setConversations] = useState([]);
  const [total, setTotal] = useState(0);
  const [services, setServices] = useState([]);
  const [serviceFilter, setServiceFilter] = useState("");
  const [search, setSearch] = useState("");

  const [sendForm, setSendForm] = useState({
    service_key: "technical_support_bot",
    to: "",
    body: "",
  });
  const [sending, setSending] = useState(false);

  const muted = useColorModeValue("gray.500", "gray.400");
  const hoverBg = useColorModeValue("blackAlpha.50", "whiteAlpha.50");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const status = await fetchWhatsAppStatus();
      setConfigured(Boolean(status?.configured));
      const [q, conv, svc] = await Promise.all([
        status?.configured ? fetchWhatsAppQueueStats() : Promise.resolve({}),
        status?.configured
          ? fetchWhatsAppConversations({
              service_id: serviceFilter || undefined,
              search: search || undefined,
              limit: 40,
            })
          : Promise.resolve({ items: [], total: 0 }),
        fetchWhatsAppServices().catch(() => []),
      ]);
      setStats(q || {});
      setConversations(Array.isArray(conv?.items) ? conv.items : Array.isArray(conv) ? conv : []);
      setTotal(conv?.total ?? (Array.isArray(conv?.items) ? conv.items.length : 0));
      setServices(Array.isArray(svc) ? svc : []);
    } catch (err) {
      toast({
        title: "تعذّر تحميل المراقبة",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, serviceFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!sendForm.to.trim() || !sendForm.body.trim()) {
      toast({ title: "أدخل الرقم ونص الرسالة", status: "warning" });
      return;
    }
    setSending(true);
    try {
      await sendWhatsAppTestMessage(sendForm);
      toast({ title: "تم إرسال الرسالة عبر الطابور", status: "success" });
      setSendForm((f) => ({ ...f, body: "" }));
      load();
    } catch (err) {
      toast({
        title: "تعذّر الإرسال",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <WaPageShell
      title="مراقبة واتساب"
      description="طابور الإرسال، المحادثات، وإرسال تجريبي"
      showAdminNav
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
            بوابة واتساب غير مُعدّة.
          </Alert>
        ) : null
      }
    >
      <WaStatRow
        columns={{ base: 2, md: 5 }}
        items={[
          { label: "قيد الانتظار", value: stats.pending ?? 0, accent: "orange.400" },
          { label: "قيد الإرسال", value: stats.processing ?? 0, accent: "blue.400" },
          { label: "فشل (إعادة)", value: stats.failed ?? 0, accent: "red.400" },
          { label: "ميتة", value: stats.dead ?? 0 },
          { label: "أُرسلت اليوم", value: stats.sent_today ?? 0, accent: "green.500" },
        ]}
      />

      <WaCard title="إرسال تجريبي" description="أرسل رسالة عبر الطابور للتحقق من الربط">
        <form onSubmit={handleSend}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
            <FormControl>
              <FormLabel fontSize="sm">الخدمة</FormLabel>
              <Select
                value={sendForm.service_key}
                onChange={(e) => setSendForm((f) => ({ ...f, service_key: e.target.value }))}
              >
                {services.map((s) => (
                  <option key={s.id} value={s.key}>
                    {s.name} ({s.key})
                    {!s.is_enabled ? " — معطّل" : ""}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">رقم المستلم</FormLabel>
              <Input
                dir="ltr"
                placeholder="2010xxxxxxxx"
                value={sendForm.to}
                onChange={(e) => setSendForm((f) => ({ ...f, to: e.target.value }))}
              />
            </FormControl>
          </SimpleGrid>
          <FormControl mb={4}>
            <FormLabel fontSize="sm">نص الرسالة</FormLabel>
            <Textarea
              rows={3}
              value={sendForm.body}
              onChange={(e) => setSendForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="مرحباً، هذه رسالة تجريبية من لوحة التحكم"
            />
          </FormControl>
          <Button
            type="submit"
            colorScheme="green"
            leftIcon={<MdSend />}
            isLoading={sending}
            isDisabled={!configured}
            w={{ base: "100%", sm: "auto" }}
          >
            إرسال عبر الطابور
          </Button>
        </form>
      </WaCard>

      <WaCard
        title={`المحادثات الأخيرة (${total})`}
        actions={
          <HStack flexWrap="wrap" spacing={2}>
            <Select
              size="sm"
              maxW="180px"
              placeholder="كل الخدمات"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
            >
              {services.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Input
              size="sm"
              maxW="160px"
              placeholder="بحث برقم…"
              dir="ltr"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
            />
            <Button size="sm" variant="outline" onClick={load}>
              بحث
            </Button>
          </HStack>
        }
      >
        {loading ? (
          <WaLoading />
        ) : conversations.length === 0 ? (
          <WaEmptyState title="لا توجد محادثات بعد" />
        ) : (
          <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>الهاتف</Th>
                  <Th>الخدمة</Th>
                  <Th>الجلسة</Th>
                  <Th>الحالة</Th>
                  <Th>آخر رسالة</Th>
                </Tr>
              </Thead>
              <Tbody>
                {conversations.map((c) => (
                  <Tr
                    key={c.id}
                    cursor="pointer"
                    _hover={{ bg: hoverBg }}
                    onClick={() => navigate(`/admin/whatsapp/inbox?id=${c.id}`)}
                  >
                    <Td dir="ltr">{c.contact_phone}</Td>
                    <Td>{c.service_name || c.service_key || "—"}</Td>
                    <Td dir="ltr">{c.session_slug}</Td>
                    <Td>
                      <WaStatusBadge status={c.status} kind="convo" />
                    </Td>
                    <Td fontSize="xs" color={muted}>
                      {c.last_message_at
                        ? new Date(c.last_message_at).toLocaleString("ar-EG")
                        : "—"}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </WaCard>
    </WaPageShell>
  );
}
