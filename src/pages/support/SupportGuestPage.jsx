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
  useColorModeValue,
  useToast,
  Spinner,
  Center,
  IconButton,
  Input,
} from "@chakra-ui/react";
import { FaHeadset, FaPaperPlane, FaUserPlus, FaSignInAlt } from "react-icons/fa";
import baseUrl from "../../api/baseUrl";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";

const GUEST_TOKEN_KEY = "support_guest_token";

const WA_HEADER = "#075e54";
const WA_SENT_BUBBLE = "#dcf8c6";
const WA_RECEIVED_BUBBLE = "#ffffff";
const WA_CHAT_BG = "#e5ddd5";
const WA_INPUT_BG = "#f0f2f5";

/**
 * صفحة الدعم الفني للزائر (غير المسجل) — تتناسب مع توثيق شات بوت الدعم الفني (قسم 8).
 * APIs الزائر (بدون Authorization):
 * - POST /api/support/guest/start     → { chat_id, guest_token, chat }
 * - GET  /api/support/guest/chat?guest_token=xxx → { chat, messages }
 * - POST /api/support/guest/messages → Body: { guest_token, text } → { message, bot_reply }
 */
const SupportGuestPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const token = localStorage.getItem("token");
  const [guestToken, setGuestToken] = useState(() => localStorage.getItem(GUEST_TOKEN_KEY) || "");
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [startError, setStartError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  const formatDate = (value) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleDateString("ar-EG", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return value;
    }
  };

  // تسجيل الدخول → توجيه لشات الطالب
  useEffect(() => {
    if (token) {
      navigate("/support", { replace: true });
    }
  }, [token, navigate]);

  // بدء شات زائر: POST /api/support/guest/start — Body (اختياري): { guest_token? }
  const startGuestChat = useCallback(async () => {
    try {
      setLoading(true);
      setStartError(null);
      const existing = localStorage.getItem(GUEST_TOKEN_KEY);
      const body = existing ? { guest_token: existing } : {};
      const { data } = await baseUrl.post("/api/support/guest/start", body);
      const newToken = data.guest_token;
      if (newToken) {
        localStorage.setItem(GUEST_TOKEN_KEY, newToken);
        setGuestToken(newToken);
      }
      if (data.chat) setChat(data.chat);
      return newToken || existing;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "فشل بدء المحادثة";
      setStartError(msg);
      toast({ title: "خطأ", description: msg, status: "error", isClosable: true });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // جلب الشات والرسائل: GET /api/support/guest/chat?guest_token=xxx
  const fetchGuestChat = useCallback(async (overrideToken) => {
    const gToken = overrideToken || guestToken || localStorage.getItem(GUEST_TOKEN_KEY);
    if (!gToken) return;
    try {
      const { data } = await baseUrl.get("/api/support/guest/chat", {
        params: { guest_token: gToken },
      });
      if (data.chat) setChat(data.chat);
      if (Array.isArray(data.messages)) setMessages(data.messages);
      scrollToBottom();
    } catch (err) {
      if (err?.response?.status === 404) {
        localStorage.removeItem(GUEST_TOKEN_KEY);
        setGuestToken("");
        setChat(null);
        setMessages([]);
      } else {
        toast({
          title: "خطأ",
          description: err?.response?.data?.error || "فشل تحميل المحادثة",
          status: "error",
          isClosable: true,
        });
      }
    }
  }, [guestToken, toast, scrollToBottom]);

  useEffect(() => {
    if (token) return;
    let mounted = true;
    (async () => {
      const gToken = localStorage.getItem(GUEST_TOKEN_KEY);
      if (gToken) {
        await fetchGuestChat(gToken);
      } else {
        const newToken = await startGuestChat();
        if (mounted && newToken) {
          await fetchGuestChat(newToken);
        }
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  // إرسال رسالة: POST /api/support/guest/messages { guest_token, text }
  const handleSendMessage = async () => {
    const text = messageText?.trim();
    if (!text || sending) return;
    const gToken = guestToken || localStorage.getItem(GUEST_TOKEN_KEY);
    if (!gToken) {
      toast({ title: "جلسة منتهية", description: "ابدأ المحادثة من جديد.", status: "warning", isClosable: true });
      return;
    }
    setSending(true);
    setMessageText("");
    try {
      const { data } = await baseUrl.post("/api/support/guest/messages", {
        guest_token: gToken,
        text,
      }, { headers: { "Content-Type": "application/json" } });
      const next = [...messages];
      if (data.message) next.push({ ...data.message, id: data.message.id || `msg-${Date.now()}` });
      if (data.bot_reply) next.push({ ...data.bot_reply, id: data.bot_reply.id || `bot-${Date.now()}` });
      setMessages(next);
      scrollToBottom();
      if (data.bot_reply) {
        toast({ title: "رد البوت", status: "info", duration: 2000, isClosable: true });
      }
    } catch (err) {
      setMessageText(text);
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || "فشل الإرسال";
      toast({ title: "خطأ", description: msg, status: "error", isClosable: true });
    } finally {
      setSending(false);
    }
  };

  const handleRetryStart = () => {
    setStartError(null);
    localStorage.removeItem(GUEST_TOKEN_KEY);
    setGuestToken("");
    startGuestChat().then((newToken) => {
      if (newToken) fetchGuestChat();
    });
  };

  if (token) return null;

  // فشل البدء بدون guest_token
  if (startError && !guestToken && messages.length === 0) {
    return (
      <Box minH="100vh" pt="100px" pb={12} px={4} dir="rtl">
        <ScrollToTop />
        <Center flexDirection="column" gap={4} py={12}>
          <Icon as={FaHeadset} boxSize={12} color="green.500" />
          <Text color="red.500" textAlign="center">{startError}</Text>
          <Button colorScheme="green" onClick={handleRetryStart}>إعادة المحاولة</Button>
          <HStack spacing={4} mt={4}>
            <Button as={Link} to="/login?redirect=/support" size="sm" leftIcon={<Icon as={FaSignInAlt} />}>
              تسجيل الدخول
            </Button>
            <Button as={Link} to="/signup?redirect=/support" size="sm" variant="outline" leftIcon={<Icon as={FaUserPlus} />}>
              إنشاء حساب
            </Button>
          </HStack>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>العودة للرئيسية</Button>
        </Center>
      </Box>
    );
  }

  // واجهة الشات (زائر)
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
              الدعم الفني — مساعدة التسجيل والدخول
            </Text>
            <Text fontSize="xs" opacity={0.9} noOfLines={1}>
              زائر — اكتب رسالتك وسيرد البوت
            </Text>
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
            تسجيل الدخول
          </Button>
          <Button
            as={Link}
            to="/signup?redirect=/support"
            size="xs"
            variant="outline"
            colorScheme="whiteAlpha"
            leftIcon={<Icon as={FaUserPlus} />}
          >
            إنشاء حساب
          </Button>
        </HStack>
      </Flex>

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
          <Center h="160px" flexDirection="column" gap={2}>
            <Text fontSize="sm" color="gray.600" textAlign="center">
              ابدأ بكتابة رسالتك. البوت يساعدك في إنشاء الحساب، تسجيل الدخول، ونسيت كلمة المرور.
            </Text>
            <Text fontSize="xs" color="gray.500">
              مثال: "مش قادر أسجل حساب" أو "نسيت كلمة السر"
            </Text>
          </Center>
        ) : (
          <VStack align="stretch" spacing={2}>
            {messages.map((msg) => {
              const isGuest = msg.sender_role === "guest" || msg.sender_role === "student";
              const isBot = msg.is_auto_reply || msg.sender_role === "admin" || msg.sender_role === "bot";
              return (
                <Flex key={msg.id} justify={isGuest ? "flex-end" : "flex-start"} w="full">
                  <Box
                    maxW="75%"
                    px={3}
                    py={2}
                    borderRadius="18px"
                    borderBottomRightRadius={isGuest ? "4px" : "18px"}
                    borderBottomLeftRadius={!isGuest ? "4px" : "18px"}
                    bg={isGuest ? WA_SENT_BUBBLE : isBot ? "#e7f8e5" : WA_RECEIVED_BUBBLE}
                    color="gray.800"
                    boxShadow="0 1px 1px rgba(0,0,0,0.1)"
                  >
                    {(msg.message_type === "text" || msg.message_type === "auto_reply" || !msg.message_type) && msg.text && (
                      <Text whiteSpace="pre-wrap" fontSize="15px">
                        {msg.text}
                      </Text>
                    )}
                    <Text fontSize="11px" color="gray.500" mt={1} textAlign={isGuest ? "left" : "right"}>
                      {formatDate(msg.created_at)}
                    </Text>
                  </Box>
                </Flex>
              );
            })}
            <div ref={messagesEndRef} />
          </VStack>
        )}
      </Box>

      <VStack align="stretch" spacing={0} flexShrink={0} bg={WA_INPUT_BG} p={2}>
        <Flex w="full" align="center" gap={2}>
          <Input
            placeholder="اكتب رسالتك... (مشكلة التسجيل، الدخول، نسيت كلمة المرور)"
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
            isDisabled={!messageText?.trim() || sending}
          />
        </Flex>
      </VStack>
    </Box>
  );
};

export default SupportGuestPage;
