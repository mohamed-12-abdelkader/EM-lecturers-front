import React, { useCallback, useEffect, useState } from "react";
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
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { MdRefresh, MdSend } from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa";
import {
  fetchWhatsAppStatus,
  fetchWhatsAppQueueStats,
  fetchWhatsAppConversations,
  fetchWhatsAppServices,
  sendWhatsAppTestMessage,
} from "../../../api/whatsappAdminApi";

function StatCard({ label, value, color }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  return (
    <Box bg={bg} border="1px solid" borderColor={border} borderRadius="xl" p={4}>
      <Text fontSize="xs" color={muted} mb={1}>
        {label}
      </Text>
      <Text fontSize="2xl" fontWeight="800" color={`${color}.500`}>
        {value ?? 0}
      </Text>
    </Box>
  );
}

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
      const [qStats, conv, svc] = await Promise.all([
        fetchWhatsAppQueueStats(),
        fetchWhatsAppConversations({
          limit: 30,
          service_id: serviceFilter || undefined,
          search: search || undefined,
        }),
        fetchWhatsAppServices(),
      ]);
      setStats(qStats || {});
      setConversations(conv?.conversations || []);
      setTotal(conv?.total || 0);
      setServices(Array.isArray(svc) ? svc : []);
      if (!sendForm.service_key && svc?.[0]?.key) {
        setSendForm((f) => ({ ...f, service_key: svc[0].key }));
      }
    } catch (err) {
      toast({
        title: "تعذّر تحميل المراقبة",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, serviceFilter, search, sendForm.service_key]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceFilter]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!sendForm.to.trim() || !sendForm.body.trim()) {
      toast({ title: "أدخل الرقم ونص الرسالة", status: "warning" });
      return;
    }
    setSending(true);
    try {
      const res = await sendWhatsAppTestMessage(sendForm);
      toast({
        title: "تم إدراج الرسالة في الطابور",
        description: `جلسة: ${res?.data?.session_slug || "—"}`,
        status: "success",
      });
      setSendForm((f) => ({ ...f, body: "" }));
      load();
    } catch (err) {
      toast({
        title: "فشل الإرسال",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Box minH="100vh" bg={pageBg} dir="rtl" pb={10} pt={4}>
      <Container maxW="1200px" px={{ base: 3, md: 6 }}>
        <VStack spacing={5} align="stretch">
          <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
            <Box>
              <HStack spacing={2} mb={1}>
                <Box as={FaWhatsapp} color="green.500" boxSize={7} />
                <Heading size="lg" color={title}>
                  مراقبة واتساب
                </Heading>
              </HStack>
              <Text fontSize="sm" color={muted}>
                طابور الإرسال، المحادثات، وإرسال تجريبي
              </Text>
            </Box>
            <HStack>
              <Button as={RouterLink} to="/admin/whatsapp/inbox" size="sm" variant="outline" colorScheme="green">
                صندوق الوارد
              </Button>
              <Button as={RouterLink} to="/admin/whatsapp/sessions" size="sm" variant="outline">
                الجلسات
              </Button>
              <Button as={RouterLink} to="/admin/whatsapp/services" size="sm" variant="outline">
                الخدمات
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
              بوابة واتساب غير مُعدّة.
            </Alert>
          )}

          <SimpleGrid columns={{ base: 2, md: 5 }} spacing={3}>
            <StatCard label="قيد الانتظار" value={stats.pending} color="orange" />
            <StatCard label="قيد الإرسال" value={stats.processing} color="blue" />
            <StatCard label="فشل (إعادة)" value={stats.failed} color="red" />
            <StatCard label="ميتة" value={stats.dead} color="gray" />
            <StatCard label="أُرسلت اليوم" value={stats.sent_today} color="green" />
          </SimpleGrid>

          <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="xl" p={5}>
            <Heading size="sm" mb={4}>
              إرسال تجريبي
            </Heading>
            <form onSubmit={handleSend}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                <FormControl>
                  <FormLabel fontSize="sm">الخدمة</FormLabel>
                  <Select
                    value={sendForm.service_key}
                    onChange={(e) =>
                      setSendForm((f) => ({ ...f, service_key: e.target.value }))
                    }
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
              >
                إرسال عبر الطابور
              </Button>
            </form>
          </Box>

          <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="xl" p={5}>
            <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={3}>
              <Heading size="sm">المحادثات الأخيرة ({total})</Heading>
              <HStack>
                <Select
                  size="sm"
                  maxW="200px"
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
                  maxW="180px"
                  placeholder="بحث برقم…"
                  dir="ltr"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") load();
                  }}
                />
                <Button size="sm" onClick={load}>
                  بحث
                </Button>
              </HStack>
            </Flex>

            {loading ? (
              <Flex justify="center" py={8}>
                <Spinner />
              </Flex>
            ) : conversations.length === 0 ? (
              <Text color={muted} textAlign="center" py={8}>
                لا توجد محادثات بعد
              </Text>
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
                        _hover={{ bg: "blackAlpha.50" }}
                        onClick={() => navigate(`/admin/whatsapp/inbox?id=${c.id}`)}
                      >
                        <Td dir="ltr">{c.contact_phone}</Td>
                        <Td>{c.service_name || c.service_key || "—"}</Td>
                        <Td dir="ltr">{c.session_slug}</Td>
                        <Td>
                          <Badge>{c.status}</Badge>
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
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
