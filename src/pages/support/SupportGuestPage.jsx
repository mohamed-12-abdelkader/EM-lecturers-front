import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  useToast,
  Spinner,
  Center,
  IconButton,
  Input,
  Badge,
} from "@chakra-ui/react";
import { FaHeadset, FaPaperPlane, FaUserPlus, FaSignInAlt } from "react-icons/fa";
import baseUrl from "../../api/baseUrl";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import {
  SUPPORT_EMPTY_HINTS,
  SupportMessageBubble,
  appendAssistantSendResponse,
  clearGuestToken,
  persistGuestToken,
  readGuestToken,
} from "./supportChatUtils";

const WA_HEADER = "#075e54";
const WA_CHAT_BG = "#e5ddd5";
const WA_INPUT_BG = "#f0f2f5";

/**
 * شات دعم الضيف — حسب support-chatbot-api.md / support-assistant-api.md
 * POST /guest/start | GET /guest/chat | POST /guest/messages
 */
const SupportGuestPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const token = localStorage.getItem("token");
  const [guestToken, setGuestToken] = useState(() => readGuestToken());
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [startError, setStartError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, []);

  const canSend = chat?.status !== "closed";

  useEffect(() => {
    if (token) navigate("/support", { replace: true });
  }, [token, navigate]);

  const fetchGuestChat = useCallback(
    async (gToken) => {
      const tokenValue = gToken || readGuestToken();
      if (!tokenValue) return null;
      const { data } = await baseUrl.get("/api/support/guest/chat", {
        params: { guest_token: tokenValue },
      });
      if (data.chat) setChat(data.chat);
      if (Array.isArray(data.messages)) setMessages(data.messages);
      scrollToBottom();
      return data;
    },
    [scrollToBottom],
  );

  const startGuestChat = useCallback(async () => {
    setLoading(true);
    setStartError(null);
    try {
      const existing = readGuestToken();
      const body = existing ? { guest_token: existing } : {};
      const { data } = await baseUrl.post("/api/support/guest/start", body, {
        headers: { "Content-Type": "application/json" },
      });

      const saved = persistGuestToken(data.guest_token || existing);
      if (saved) setGuestToken(saved);
      if (data.chat) setChat(data.chat);

      // شات جديد: welcome_message — استئناف: حمّل الرسائل من GET
      if (data.welcome_message) {
        setMessages([data.welcome_message]);
        scrollToBottom();
      } else if (saved) {
        try {
          await fetchGuestChat(saved);
        } catch {
          setMessages([]);
        }
      }
      return saved;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "فشل بدء المحادثة";
      setStartError(msg);
      toast({ title: "خطأ", description: msg, status: "error", isClosable: true });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, scrollToBottom, fetchGuestChat]);

  useEffect(() => {
    if (token) return;
    startGuestChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSendMessage = async () => {
    const text = messageText?.trim();
    if (!text || sending) return;

    if (!canSend) {
      toast({
        title: "المحادثة مغلقة",
        description: "لا يمكن إرسال رسائل جديدة في محادثة مغلقة.",
        status: "warning",
        isClosable: true,
      });
      return;
    }

    let gToken = guestToken || readGuestToken();
    if (!gToken || gToken.length < 8) {
      gToken = await startGuestChat();
      if (!gToken) return;
    }

    setSending(true);
    setMessageText("");
    try {
      const { data } = await baseUrl.post(
        "/api/support/guest/messages",
        { guest_token: gToken, text },
        { headers: { "Content-Type": "application/json; charset=utf-8" } },
      );

      if (data.chat) setChat(data.chat);
      if (data.chat?.guest_token) {
        const saved = persistGuestToken(data.chat.guest_token);
        setGuestToken(saved);
      }

      setMessages((prev) => appendAssistantSendResponse(prev, data));
      scrollToBottom();
    } catch (err) {
      setMessageText(text);
      const status = err?.response?.status;
      if (status === 404) {
        clearGuestToken();
        setGuestToken("");
        toast({
          title: "انتهت الجلسة",
          description: "سيتم بدء محادثة جديدة.",
          status: "warning",
          isClosable: true,
        });
        await startGuestChat();
      } else {
        toast({
          title: "خطأ",
          description:
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "فشل الإرسال",
          status: "error",
          isClosable: true,
        });
      }
    } finally {
      setSending(false);
    }
  };

  if (token) return null;

  return (
    <Box dir="rtl" h="100vh" display="flex" flexDirection="column" bg={WA_CHAT_BG}>
      <ScrollToTop />
      <Flex
        h="60px"
        px={4}
        align="center"
        justify="space-between"
        bg={WA_HEADER}
        color="white"
        flexShrink={0}
      >
        <HStack spacing={3} flex={1} minW={0}>
          <Icon as={FaHeadset} boxSize={5} />
          <VStack align="flex-start" spacing={0} flex={1} minW={0}>
            <Text fontWeight="bold" fontSize="md" noOfLines={1}>
              مساعد الدعم الفني
            </Text>
            <HStack spacing={2}>
              <Text fontSize="xs" opacity={0.9} noOfLines={1}>
                زائر — بدون تسجيل دخول
              </Text>
              {chat?.status ? (
                <Badge
                  fontSize="9px"
                  colorScheme={chat.status === "open" ? "green" : "gray"}
                  variant="solid"
                >
                  {chat.status === "open" ? "مفتوحة" : "مغلقة"}
                </Badge>
              ) : null}
            </HStack>
          </VStack>
        </HStack>
        <HStack spacing={2}>
          <Button
            as={Link}
            to="/login?redirect=/support"
            size="xs"
            variant="ghost"
            color="white"
            leftIcon={<Icon as={FaSignInAlt} />}
          >
            دخول
          </Button>
          <Button
            as={Link}
            to="/signup?redirect=/support"
            size="xs"
            variant="outline"
            colorScheme="whiteAlpha"
            leftIcon={<Icon as={FaUserPlus} />}
          >
            حساب
          </Button>
        </HStack>
      </Flex>

      {startError ? (
        <Box px={3} py={2} bg="orange.50" borderBottomWidth="1px" borderColor="orange.200">
          <Text fontSize="xs" color="orange.700" textAlign="center">
            {startError}
          </Text>
          <Center mt={1}>
            <Button size="xs" colorScheme="orange" onClick={() => startGuestChat()}>
              إعادة المحاولة
            </Button>
          </Center>
        </Box>
      ) : null}

      <Box
        flex={1}
        overflowY="auto"
        p={3}
        bg={WA_CHAT_BG}
        backgroundImage="url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4d4c9\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
      >
        {loading && messages.length === 0 ? (
          <Center h="200px">
            <Spinner color={WA_HEADER} size="lg" />
          </Center>
        ) : messages.length === 0 ? (
          <Center h="auto" minH="180px" flexDirection="column" gap={2} px={4} py={8}>
            <Text fontSize="sm" color="gray.600" textAlign="center">
              اكتب رسالتك — المساعد يساعدك في الاشتراك، رابط منصة المدرس، ومشاكل الدخول.
            </Text>
            <VStack spacing={1} mt={2}>
              {SUPPORT_EMPTY_HINTS.map((hint) => (
                <Button
                  key={hint}
                  size="xs"
                  variant="outline"
                  borderRadius="full"
                  colorScheme="green"
                  isDisabled={!canSend}
                  onClick={() => setMessageText(hint)}
                >
                  {hint}
                </Button>
              ))}
            </VStack>
          </Center>
        ) : (
          <VStack align="stretch" spacing={2}>
            {messages.map((msg) => (
              <SupportMessageBubble key={msg.id} msg={msg} />
            ))}
            {sending ? (
              <Flex justify="flex-start" w="full">
                <HStack
                  px={3}
                  py={2}
                  borderRadius="18px"
                  bg="#e7f8e5"
                  boxShadow="0 1px 1px rgba(0,0,0,0.1)"
                  spacing={2}
                >
                  <Spinner size="xs" color={WA_HEADER} />
                  <Text fontSize="13px" color="gray.600">
                    المساعد بيكتب…
                  </Text>
                </HStack>
              </Flex>
            ) : null}
            <div ref={messagesEndRef} />
          </VStack>
        )}
      </Box>

      <VStack align="stretch" spacing={0} flexShrink={0} bg={WA_INPUT_BG} p={2}>
        {!canSend ? (
          <Box mb={2} px={3} py={2} bg="orange.50" borderRadius="lg">
            <Text fontSize="sm" color="orange.700" textAlign="center">
              المحادثة مغلقة — ابدأ جلسة جديدة من زر إعادة المحاولة.
            </Text>
          </Box>
        ) : null}
        <Flex w="full" align="center" gap={2}>
          <Input
            placeholder="اكتب رسالتك... مثال: عايز أشترك"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            flex={1}
            size="md"
            borderRadius="24px"
            bg="white"
            border="none"
            isDisabled={!canSend || sending}
            maxLength={4000}
            _focus={{ boxShadow: "none" }}
          />
          <IconButton
            aria-label="إرسال"
            icon={<FaPaperPlane />}
            bg={WA_HEADER}
            color="white"
            size="md"
            borderRadius="full"
            _hover={{ opacity: 0.9 }}
            onClick={handleSendMessage}
            isLoading={sending}
            isDisabled={!canSend || !messageText?.trim() || sending}
          />
        </Flex>
      </VStack>
    </Box>
  );
};

export default SupportGuestPage;
