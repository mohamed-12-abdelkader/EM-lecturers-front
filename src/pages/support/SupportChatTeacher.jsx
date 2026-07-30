import React, { useCallback, useEffect, useRef, useMemo, useState } from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  Avatar,
  useToast,
  Spinner,
  Center,
  IconButton,
  Image,
  useColorModeValue,
  Icon,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import {
  FaPaperPlane,
  FaRobot,
  FaFileAlt,
  FaHeadset,
} from "react-icons/fa";
import baseUrl from "../../api/baseUrl";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";

const WA_HEADER = "#075e54";
const WA_SENT_BUBBLE = "#dcf8c6";
const WA_RECEIVED_BUBBLE = "#ffffff";
const WA_CHAT_BG = "#e5ddd5";
const WA_INPUT_BG = "#f0f2f5";

const STATUS_LABELS = {
  bot_handling: "البوت يتعامل",
  waiting_for_admin: "في انتظار الأدمن",
  admin_handling: "الأدمن يتعامل",
  resolved: "تم الحل",
  open: "مفتوح",
  closed: "مغلق",
};

const SupportChatTeacher = () => {
  const toast = useToast();
  const [chat, setChat] = useState(null);
  const [quickButtons, setQuickButtons] = useState([]);
  const [canTeacherSend, setCanTeacherSend] = useState(true);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  const authHeader = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

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

  // GET /api/support/teacher/chat
  const fetchChat = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await baseUrl.get("/api/support/teacher/chat", { headers: authHeader });
      setChat(data.chat || null);
      setQuickButtons(Array.isArray(data.quick_buttons) ? data.quick_buttons : []);
      setCanTeacherSend(data.can_teacher_send !== false);
      return data.chat;
    } catch (err) {
      toast({
        title: "خطأ",
        description: err?.response?.data?.message || "فشل تحميل المحادثة",
        status: "error",
        isClosable: true,
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [authHeader, toast]);

  // GET /api/support/teacher/messages?limit=50&before=...
  const fetchMessages = useCallback(
    async (before = null) => {
      try {
        setMessagesLoading(true);
        const params = { limit: 50 };
        if (before) params.before = before;
        const { data } = await baseUrl.get("/api/support/teacher/messages", {
          params,
          headers: authHeader,
        });
        const list = data.messages || [];
        if (before) {
          setMessages((prev) => [...list, ...prev]);
        } else {
          setMessages(list);
          scrollToBottom();
        }
      } catch (err) {
        toast({
          title: "خطأ",
          description: "فشل تحميل الرسائل",
          status: "error",
          isClosable: true,
        });
      } finally {
        setMessagesLoading(false);
      }
    },
    [authHeader, toast, scrollToBottom]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      const c = await fetchChat();
      if (mounted && c?.id) {
        await fetchMessages();
      }
    })();
    return () => {
      mounted = false;
    };
  }, [fetchChat, fetchMessages]);

  // إرسال رسالة: POST /api/support/teacher/messages { text }
  const sendMessage = useCallback(
    async (textToSend) => {
      const trimmed = typeof textToSend === "string" ? textToSend.trim() : "";
      if (!trimmed || sending) return;

      setSending(true);
      if (messageText === trimmed) setMessageText("");
      try {
        const { data } = await baseUrl.post(
          "/api/support/teacher/messages",
          { text: trimmed },
          { headers: { ...authHeader, "Content-Type": "application/json" } }
        );
        const next = [...messages, data.message];
        if (data.bot_reply) {
          next.push({ ...data.bot_reply, id: data.bot_reply.id || `bot-${Date.now()}` });
          toast({ title: "رد تلقائي", status: "info", duration: 2000, isClosable: true });
        }
        setMessages(next);
        if (data.can_teacher_send !== undefined) setCanTeacherSend(data.can_teacher_send !== false);
        scrollToBottom();
        fetchChat();
      } catch (err) {
        toast({
          title: "فشل الإرسال",
          description: err?.response?.data?.message || "حدث خطأ أثناء إرسال الرسالة",
          status: "error",
          isClosable: true,
        });
      } finally {
        setSending(false);
      }
    },
    [authHeader, messageText, messages, sending, toast, scrollToBottom, fetchChat]
  );

  const handleSendMessage = () => {
    const text = messageText?.trim();
    if (!text) return;
    sendMessage(text);
  };

  const handleQuickButton = (btn) => {
    const payload = btn.payload || btn.label || "";
    if (payload) sendMessage(payload);
  };

  if (loading && !chat) {
    return <BrandLoadingScreen />;
  }

  if (!chat) {
    return (
      <Box minH="100vh" bg={WA_CHAT_BG} dir="rtl" pt="120px" pb={8}>
        <Center>
          <VStack spacing={4} p={8} bg="white" borderRadius="2xl" shadow="lg">
            <Icon as={FaHeadset} boxSize={12} color={WA_HEADER} />
            <Text color="gray.800" fontWeight="medium">
              لا يمكن تحميل المحادثة.
            </Text>
            <Button bg={WA_HEADER} color="white" _hover={{ opacity: 0.9 }} onClick={() => fetchChat()}>
              إعادة المحاولة
            </Button>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box dir="rtl" h="100vh" display="flex" flexDirection="column" bg={WA_CHAT_BG}>
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
          <Avatar size="sm" name="الدعم الفني" bg="whiteAlpha.400" />
          <VStack align="flex-start" spacing={0} flex={1} minW={0}>
            <Text fontWeight="bold" fontSize="md" noOfLines={1}>
              الدعم الفني للمدرس
            </Text>
            <Text fontSize="xs" opacity={0.9} noOfLines={1}>
              {STATUS_LABELS[chat.status] || chat.status}
            </Text>
          </VStack>
        </HStack>
      </Flex>

      <Box
        flex={1}
        overflowY="auto"
        p={3}
        bg={WA_CHAT_BG}
        backgroundImage="url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4d4c9\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
      >
        {messagesLoading && messages.length === 0 ? (
          <Center h="200px">
            <Spinner color={WA_HEADER} size="lg" />
          </Center>
        ) : messages.length === 0 ? (
          <Center h="120px">
            <Text fontSize="sm" color="gray.600">
              لا توجد رسائل. اختر زراً سريعاً أو اكتب رسالتك أدناه.
            </Text>
          </Center>
        ) : (
          <VStack align="stretch" spacing={2}>
            {messages.map((msg) => {
              const isTeacher = msg.sender_role === "teacher";
              const isBot = msg.is_auto_reply;
              return (
                <Flex key={msg.id} justify={isTeacher ? "flex-end" : "flex-start"} w="full">
                  <Box
                    maxW="75%"
                    px={3}
                    py={2}
                    borderRadius="18px"
                    borderBottomRightRadius={isTeacher ? "4px" : "18px"}
                    borderBottomLeftRadius={!isTeacher ? "4px" : "18px"}
                    bg={isTeacher ? WA_SENT_BUBBLE : isBot ? "#e7f8e5" : WA_RECEIVED_BUBBLE}
                    color="gray.800"
                    boxShadow="0 1px 1px rgba(0,0,0,0.1)"
                  >
                    {(msg.message_type === "text" || msg.message_type === "auto_reply") && msg.text && (
                      <Text whiteSpace="pre-wrap" fontSize="15px">
                        {msg.text}
                      </Text>
                    )}
                    {msg.message_type === "image" && msg.media_url && (
                      <VStack align="start" spacing={2}>
                        <Image src={msg.media_url} maxH="240px" borderRadius="md" alt="" />
                        {msg.text && (
                          <Text whiteSpace="pre-wrap" fontSize="15px">
                            {msg.text}
                          </Text>
                        )}
                      </VStack>
                    )}
                    {msg.message_type === "audio" && msg.media_url && (
                      <VStack align="start" spacing={1}>
                        <audio controls src={msg.media_url} style={{ maxWidth: "100%", height: "36px" }} />
                        {msg.text && (
                          <Text whiteSpace="pre-wrap" fontSize="15px">
                            {msg.text}
                          </Text>
                        )}
                      </VStack>
                    )}
                    {msg.message_type === "file" && msg.media_url && (
                      <VStack align="start" spacing={2}>
                        <HStack>
                          <Icon as={FaFileAlt} />
                          <Text fontSize="sm">{msg.media_name || "ملف"}</Text>
                          <Button
                            size="xs"
                            as="a"
                            href={msg.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            colorScheme="green"
                          >
                            تحميل
                          </Button>
                        </HStack>
                        {msg.text && (
                          <Text whiteSpace="pre-wrap" fontSize="15px">
                            {msg.text}
                          </Text>
                        )}
                      </VStack>
                    )}
                    <Text
                      fontSize="11px"
                      color="gray.500"
                      mt={1}
                      textAlign={isTeacher ? "left" : "right"}
                    >
                      {formatDate(msg.created_at)}
                    </Text>
                  </Box>
                </Flex>
              );
            })}
            <div ref={messagesEndRef} />
          </VStack>
        )}

        {quickButtons.length > 0 && (
          <Box mt={4} mb={2}>
            <Text fontSize="xs" color="gray.600" mb={2}>
              أزرار سريعة
            </Text>
            <Wrap spacing={2}>
              {quickButtons.map((btn, idx) => (
                <WrapItem key={idx}>
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="green"
                    leftIcon={<Icon as={FaRobot} />}
                    onClick={() => handleQuickButton(btn)}
                    isDisabled={sending || !canTeacherSend}
                  >
                    {btn.label || btn.payload}
                  </Button>
                </WrapItem>
              ))}
            </Wrap>
          </Box>
        )}
      </Box>

      <VStack align="stretch" spacing={0} flexShrink={0} bg={WA_INPUT_BG} p={2}>
        <Flex w="full" align="center" gap={2}>
          <Input
            placeholder={canTeacherSend ? "اكتب رسالتك..." : "في انتظار رد الدعم"}
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
            isDisabled={!canTeacherSend}
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
            isDisabled={!messageText?.trim() || sending || !canTeacherSend}
          />
        </Flex>
      </VStack>

      <ScrollToTop />
    </Box>
  );
};

export default SupportChatTeacher;
