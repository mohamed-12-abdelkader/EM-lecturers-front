import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Input,
  Textarea,
  Select,
  IconButton,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { MdRefresh, MdSend } from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa";
import {
  fetchWhatsAppStatus,
  fetchWhatsAppConversations,
  fetchWhatsAppConversation,
  fetchWhatsAppConversationMessages,
  fetchWhatsAppServices,
  patchWhatsAppConversation,
  sendWhatsAppConversationMessage,
} from "../../../api/whatsappAdminApi";

const STATUS_META = {
  bot: { label: "بوت", color: "blue" },
  waiting_human: { label: "بانتظار بشر", color: "orange" },
  human: { label: "بشري", color: "purple" },
  closed: { label: "مغلقة", color: "gray" },
};

const OUTBOUND_STATUS = {
  pending: { label: "قيد الانتظار", color: "orange" },
  processing: { label: "جارٍ الإرسال", color: "blue" },
  sent: { label: "أُرسلت", color: "green" },
  failed: { label: "فشل", color: "red" },
  dead: { label: "ميتة", color: "gray" },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status || "—", color: "gray" };
  return (
    <Badge colorScheme={meta.color} borderRadius="md" px={2} py={0.5} fontSize="xs">
      {meta.label}
    </Badge>
  );
}

export default function WhatsAppInboxPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("id") ? Number(searchParams.get("id")) : null;

  const [configured, setConfigured] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [total, setTotal] = useState(0);
  const [services, setServices] = useState([]);
  const [serviceFilter, setServiceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const threadEndRef = useRef(null);
  const initialListLoad = useRef(true);

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const title = useColorModeValue("gray.900", "white");
  const listHover = useColorModeValue("gray.50", "gray.700");
  const listActive = useColorModeValue("green.50", "whiteAlpha.100");
  const inboundBg = useColorModeValue("gray.100", "gray.700");
  const outboundBg = useColorModeValue("green.100", "green.900");

  const selectConversation = useCallback(
    (id) => {
      if (!id) {
        setSearchParams({});
        return;
      }
      setSearchParams({ id: String(id) });
    },
    [setSearchParams],
  );

  const loadList = useCallback(
    async ({ silent } = {}) => {
      if (!silent) setListLoading(true);
      try {
        const status = await fetchWhatsAppStatus();
        setConfigured(Boolean(status?.configured));
        const [conv, svc] = await Promise.all([
          fetchWhatsAppConversations({
            limit: 50,
            service_id: serviceFilter || undefined,
            status: statusFilter || undefined,
            search: search || undefined,
          }),
          fetchWhatsAppServices(),
        ]);
        setConversations(conv?.conversations || []);
        setTotal(conv?.total || 0);
        setServices(Array.isArray(svc) ? svc : []);
      } catch (err) {
        if (!silent) {
          toast({
            title: "تعذّر تحميل المحادثات",
            description: err?.response?.data?.message || err.message,
            status: "error",
          });
        }
      } finally {
        if (!silent) setListLoading(false);
      }
    },
    [toast, serviceFilter, statusFilter, search],
  );

  const loadThread = useCallback(
    async (id, { silent } = {}) => {
      if (!id) {
        setConversation(null);
        setMessages([]);
        return;
      }
      if (!silent) setThreadLoading(true);
      try {
        const [conv, msgData] = await Promise.all([
          fetchWhatsAppConversation(id),
          fetchWhatsAppConversationMessages(id, { limit: 100 }),
        ]);
        setConversation(conv || null);
        setMessages(msgData?.messages || []);
      } catch (err) {
        if (!silent) {
          toast({
            title: "تعذّر تحميل المحادثة",
            description: err?.response?.data?.message || err.message,
            status: "error",
          });
        }
      } finally {
        if (!silent) setThreadLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    loadList({ silent: !initialListLoad.current });
    initialListLoad.current = false;
  }, [loadList]);

  useEffect(() => {
    loadThread(selectedId);
  }, [selectedId, loadThread]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadList({ silent: true });
      if (selectedId) loadThread(selectedId, { silent: true });
    }, 5000);
    return () => clearInterval(timer);
  }, [loadList, loadThread, selectedId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedId]);

  const selectedFromList = useMemo(
    () => conversations.find((c) => c.id === selectedId) || null,
    [conversations, selectedId],
  );

  const activeConversation = conversation || selectedFromList;
  const isClosed = activeConversation?.status === "closed";

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedId || !reply.trim() || isClosed) return;
    setSending(true);
    try {
      await sendWhatsAppConversationMessage({
        conversation_id: selectedId,
        body: reply.trim(),
      });
      setReply("");
      await Promise.all([
        loadThread(selectedId, { silent: true }),
        loadList({ silent: true }),
      ]);
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

  const handleStatus = async (status) => {
    if (!selectedId) return;
    setStatusUpdating(true);
    try {
      const updated = await patchWhatsAppConversation(selectedId, { status });
      setConversation(updated);
      await loadList({ silent: true });
      toast({
        title: "تم تحديث حالة المحادثة",
        status: "success",
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: "تعذّر تحديث الحالة",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <Box minH="100vh" bg={pageBg} dir="rtl" pb={6} pt={4}>
      <Container maxW="1400px" px={{ base: 3, md: 6 }}>
        <VStack spacing={4} align="stretch">
          <Flex justify="space-between" align="center" wrap="wrap" gap={3}>
            <Box>
              <HStack spacing={2} mb={1}>
                <Box as={FaWhatsapp} color="green.500" boxSize={7} />
                <Heading size="lg" color={title}>
                  صندوق وارد واتساب
                </Heading>
              </HStack>
              <Text fontSize="sm" color={muted}>
                استعرض المحادثات، أرسل ردوداً، واستلم من البوت أو أعدها له
              </Text>
            </Box>
            <HStack wrap="wrap">
              <Button as={RouterLink} to="/admin/whatsapp/sessions" size="sm" variant="outline">
                الجلسات
              </Button>
              <Button as={RouterLink} to="/admin/whatsapp/services" size="sm" variant="outline">
                الخدمات
              </Button>
              <Button as={RouterLink} to="/admin/whatsapp/monitor" size="sm" variant="outline">
                المراقبة
              </Button>
              <IconButton
                aria-label="تحديث"
                icon={<MdRefresh />}
                size="sm"
                onClick={() => {
                  loadList();
                  if (selectedId) loadThread(selectedId);
                }}
                isLoading={listLoading || threadLoading}
              />
            </HStack>
          </Flex>

          {!configured && (
            <Alert status="warning" borderRadius="lg">
              <AlertIcon />
              بوابة واتساب غير مُعدّة — لن تُرسل الرسائل حتى يتم الإعداد.
            </Alert>
          )}

          <Flex
            gap={4}
            align="stretch"
            direction={{ base: "column", lg: "row" }}
            minH={{ lg: "70vh" }}
          >
            {/* Conversation list */}
            <Box
              bg={cardBg}
              border="1px solid"
              borderColor={border}
              borderRadius="xl"
              w={{ base: "100%", lg: "360px" }}
              flexShrink={0}
              display="flex"
              flexDirection="column"
              overflow="hidden"
            >
              <Box p={3} borderBottom="1px solid" borderColor={border}>
                <Text fontWeight="700" mb={2}>
                  المحادثات ({total})
                </Text>
                <VStack spacing={2} align="stretch">
                  <Select
                    size="sm"
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
                  <Select
                    size="sm"
                    placeholder="كل الحالات"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="bot">بوت</option>
                    <option value="waiting_human">بانتظار بشر</option>
                    <option value="human">بشري</option>
                    <option value="closed">مغلقة</option>
                  </Select>
                  <HStack>
                    <Input
                      size="sm"
                      placeholder="بحث برقم…"
                      dir="ltr"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") loadList();
                      }}
                    />
                    <Button size="sm" onClick={() => loadList()}>
                      بحث
                    </Button>
                  </HStack>
                </VStack>
              </Box>

              <Box flex="1" overflowY="auto" maxH={{ base: "40vh", lg: "none" }}>
                {listLoading && conversations.length === 0 ? (
                  <Flex justify="center" py={10}>
                    <Spinner />
                  </Flex>
                ) : conversations.length === 0 ? (
                  <Text color={muted} textAlign="center" py={10} px={3}>
                    لا توجد محادثات
                  </Text>
                ) : (
                  conversations.map((c) => {
                    const active = c.id === selectedId;
                    return (
                      <Box
                        key={c.id}
                        as="button"
                        w="100%"
                        textAlign="right"
                        px={3}
                        py={3}
                        borderBottom="1px solid"
                        borderColor={border}
                        bg={active ? listActive : "transparent"}
                        _hover={{ bg: active ? listActive : listHover }}
                        onClick={() => selectConversation(c.id)}
                      >
                        <Flex justify="space-between" align="center" gap={2} mb={1}>
                          <Text fontWeight="700" dir="ltr" fontSize="sm">
                            {c.contact_phone}
                          </Text>
                          <StatusBadge status={c.status} />
                        </Flex>
                        <Text fontSize="xs" color={muted} noOfLines={1}>
                          {c.service_name || c.service_key || "—"}
                        </Text>
                        <Text fontSize="xs" color={muted} mt={1}>
                          {c.last_message_at
                            ? new Date(c.last_message_at).toLocaleString("ar-EG")
                            : "—"}
                        </Text>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>

            {/* Thread */}
            <Box
              bg={cardBg}
              border="1px solid"
              borderColor={border}
              borderRadius="xl"
              flex="1"
              display="flex"
              flexDirection="column"
              minH={{ base: "50vh", lg: "70vh" }}
              overflow="hidden"
            >
              {!selectedId ? (
                <Flex flex="1" align="center" justify="center" p={6}>
                  <Text color={muted}>اختر محادثة من القائمة لعرض الرسائل</Text>
                </Flex>
              ) : (
                <>
                  <Flex
                    px={4}
                    py={3}
                    borderBottom="1px solid"
                    borderColor={border}
                    justify="space-between"
                    align="center"
                    wrap="wrap"
                    gap={2}
                  >
                    <Box>
                      <HStack spacing={2} mb={1}>
                        <Text fontWeight="800" dir="ltr">
                          {activeConversation?.contact_phone || "—"}
                        </Text>
                        <StatusBadge status={activeConversation?.status} />
                      </HStack>
                      <Text fontSize="xs" color={muted}>
                        {activeConversation?.service_name ||
                          activeConversation?.service_key ||
                          "—"}{" "}
                        · جلسة{" "}
                        <Box as="span" dir="ltr">
                          {activeConversation?.session_slug || "—"}
                        </Box>
                      </Text>
                    </Box>
                    <HStack wrap="wrap">
                      <Button
                        size="xs"
                        colorScheme="purple"
                        variant={activeConversation?.status === "human" ? "solid" : "outline"}
                        isLoading={statusUpdating}
                        onClick={() => handleStatus("human")}
                        isDisabled={isClosed}
                      >
                        استلام
                      </Button>
                      <Button
                        size="xs"
                        colorScheme="blue"
                        variant={activeConversation?.status === "bot" ? "solid" : "outline"}
                        isLoading={statusUpdating}
                        onClick={() => handleStatus("bot")}
                      >
                        إعادة للبوت
                      </Button>
                      <Button
                        size="xs"
                        colorScheme="gray"
                        variant={isClosed ? "solid" : "outline"}
                        isLoading={statusUpdating}
                        onClick={() => handleStatus("closed")}
                      >
                        إغلاق
                      </Button>
                    </HStack>
                  </Flex>

                  <Box flex="1" overflowY="auto" px={4} py={3}>
                    {threadLoading && messages.length === 0 ? (
                      <Flex justify="center" py={10}>
                        <Spinner />
                      </Flex>
                    ) : messages.length === 0 ? (
                      <Text color={muted} textAlign="center" py={10}>
                        لا توجد رسائل في هذه المحادثة بعد
                      </Text>
                    ) : (
                      <VStack spacing={2} align="stretch">
                        {messages.map((m) => {
                          const inbound = m.direction === "inbound";
                          const outMeta = OUTBOUND_STATUS[m.status];
                          return (
                            <Flex
                              key={m.id}
                              justify={inbound ? "flex-start" : "flex-end"}
                            >
                              <Box
                                maxW="85%"
                                bg={inbound ? inboundBg : outboundBg}
                                borderRadius="lg"
                                px={3}
                                py={2}
                              >
                                <Text whiteSpace="pre-wrap" fontSize="sm">
                                  {m.body}
                                </Text>
                                <HStack
                                  mt={1}
                                  spacing={2}
                                  justify={inbound ? "flex-start" : "flex-end"}
                                >
                                  <Text fontSize="10px" color={muted}>
                                    {m.at
                                      ? new Date(m.at).toLocaleString("ar-EG")
                                      : ""}
                                  </Text>
                                  {!inbound && outMeta && (
                                    <Badge
                                      colorScheme={outMeta.color}
                                      fontSize="9px"
                                      variant="subtle"
                                    >
                                      {outMeta.label}
                                    </Badge>
                                  )}
                                </HStack>
                              </Box>
                            </Flex>
                          );
                        })}
                        <div ref={threadEndRef} />
                      </VStack>
                    )}
                  </Box>

                  <Box
                    as="form"
                    onSubmit={handleSend}
                    p={3}
                    borderTop="1px solid"
                    borderColor={border}
                  >
                    {isClosed ? (
                      <Text fontSize="sm" color={muted} textAlign="center" py={2}>
                        المحادثة مغلقة — أعدها للبوت أو غيّر الحالة للإرسال
                      </Text>
                    ) : (
                      <HStack align="flex-end">
                        <Textarea
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          placeholder="اكتب ردّك للطالب…"
                          rows={2}
                          resize="none"
                          isDisabled={!configured}
                        />
                        <IconButton
                          type="submit"
                          aria-label="إرسال"
                          icon={<MdSend />}
                          colorScheme="green"
                          isLoading={sending}
                          isDisabled={!configured || !reply.trim()}
                        />
                      </HStack>
                    )}
                  </Box>
                </>
              )}
            </Box>
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
}
