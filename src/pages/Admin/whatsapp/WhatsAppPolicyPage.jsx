import React, { useCallback, useEffect, useRef, useState } from "react";
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
  Flex,
  Textarea,
  IconButton,
} from "@chakra-ui/react";
import { MdRefresh, MdSend } from "react-icons/md";
import {
  fetchSupportPolicyPack,
  fetchSupportPolicyMessages,
  sendSupportPolicyChat,
} from "../../../api/whatsappAdminApi";
import { WaPageShell } from "../../../components/whatsapp/ui";

const STYLE_AR = {
  normal: "عادي",
  summary: "خلاصة",
  shorter: "أقصر",
};

export default function WhatsAppPolicyPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [pack, setPack] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const threadEndRef = useRef(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const inboundBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const outboundBg = useColorModeValue("green.50", "green.900");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [packData, msgs] = await Promise.all([
        fetchSupportPolicyPack(),
        fetchSupportPolicyMessages(),
      ]);
      setPack(packData);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (err) {
      toast({
        title: "تعذّر تحميل تخصيص الدعم",
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

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    setDraft("");
    const optimistic = {
      id: `tmp-${Date.now()}`,
      role: "user",
      body: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const result = await sendSupportPolicyChat(text);
      setPack(result?.pack || pack);
      const history = await fetchSupportPolicyMessages();
      setMessages(Array.isArray(history) ? history : []);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(text);
      toast({
        title: "تعذّر إرسال الرسالة",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setSending(false);
    }
  };

  const promptPreview = pack?.rewrite_prompt
    ? pack.rewrite_prompt.length > 280
      ? `${pack.rewrite_prompt.slice(0, 280)}…`
      : pack.rewrite_prompt
    : "لا توجد تعليمات بعد — اكتب في الشات لتحديث سياسة الرد.";

  return (
    <WaPageShell
      title="تخصيص الدعم"
      description="شات مع المساعد لتحديث تعليمات إعادة صياغة ردود الدعم الفني للطلاب"
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
    >
          <Flex gap={4} align="stretch" direction={{ base: "column", lg: "row" }} minH={{ lg: "70vh" }}>
            <Box
              bg={cardBg}
              border="1px solid"
              borderColor={border}
              borderRadius="xl"
              w={{ base: "100%", lg: "320px" }}
              p={4}
            >
              <Heading size="sm" mb={3}>
                الحالة الحالية
              </Heading>
              {loading && !pack ? (
                <Spinner />
              ) : (
                <VStack align="stretch" spacing={3}>
                  <HStack>
                    <Text fontSize="sm" color={muted}>
                      الطبقة
                    </Text>
                    <Badge colorScheme={pack?.enabled ? "green" : "gray"}>
                      {pack?.enabled ? "مفعّلة" : "متوقفة"}
                    </Badge>
                  </HStack>
                  <HStack>
                    <Text fontSize="sm" color={muted}>
                      الأسلوب
                    </Text>
                    <Badge>{STYLE_AR[pack?.style?.mode] || pack?.style?.mode || "عادي"}</Badge>
                  </HStack>
                  {pack?.style?.tone_notes && (
                    <Text fontSize="sm">{pack.style.tone_notes}</Text>
                  )}
                  <Box>
                    <Text fontSize="xs" color={muted} mb={1}>
                      تعليمات إعادة الصياغة
                    </Text>
                    <Text fontSize="sm" whiteSpace="pre-wrap">
                      {promptPreview}
                    </Text>
                  </Box>
                  <Alert status="info" borderRadius="md" fontSize="sm">
                    <AlertIcon />
                    الدعم الفني يرد أولاً، ثم تُعاد صياغة الرد حسب هذه التعليمات. مفيش رد ثابت جاهز.
                  </Alert>
                </VStack>
              )}
            </Box>

            <Box
              bg={cardBg}
              border="1px solid"
              borderColor={border}
              borderRadius="xl"
              flex={1}
              display="flex"
              flexDirection="column"
              overflow="hidden"
              minH="520px"
            >
              <Box flex="1" overflowY="auto" px={4} py={3}>
                {loading && messages.length === 0 ? (
                  <Flex justify="center" py={10}>
                    <Spinner />
                  </Flex>
                ) : messages.length === 0 ? (
                  <Text color={muted} textAlign="center" py={10}>
                    ابدأ الشات: مثلاً «لو الطالب يطلب كود من إسلام سعيد قوله ياخده من السكرتارية»
                  </Text>
                ) : (
                  <VStack spacing={2} align="stretch">
                    {messages.map((m) => {
                      const fromAdmin = m.role === "user";
                      return (
                        <Flex key={m.id} justify={fromAdmin ? "flex-end" : "flex-start"}>
                          <Box
                            maxW="85%"
                            bg={fromAdmin ? outboundBg : inboundBg}
                            borderRadius="lg"
                            px={3}
                            py={2}
                          >
                            <Text fontSize="xs" color={muted} mb={1}>
                              {fromAdmin ? "أنت" : "المساعد"}
                            </Text>
                            <Text fontSize="sm" whiteSpace="pre-wrap">
                              {m.body}
                            </Text>
                          </Box>
                        </Flex>
                      );
                    })}
                    <div ref={threadEndRef} />
                  </VStack>
                )}
              </Box>
              <Box p={3} borderTop="1px solid" borderColor={border}>
                <HStack align="end">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value.slice(0, 4000))}
                    placeholder="اكتب تعليماتك للمساعد..."
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button
                    colorScheme="green"
                    leftIcon={<MdSend />}
                    onClick={handleSend}
                    isLoading={sending}
                    isDisabled={!draft.trim()}
                  >
                    إرسال
                  </Button>
                </HStack>
              </Box>
            </Box>
          </Flex>
    </WaPageShell>
  );
}
