import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  Badge,
  Avatar,
  useToast,
  Spinner,
  Center,
  IconButton,
} from "@chakra-ui/react";
import { FaPaperPlane, FaHeadset } from "react-icons/fa";
import baseUrl from "../../api/baseUrl";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import {
  SUPPORT_EMPTY_HINTS,
  SupportMessageBubble,
  appendAssistantSendResponse,
} from "./supportChatUtils";

const WA_HEADER = "#075e54";
const WA_CHAT_BG = "#e5ddd5";
const WA_INPUT_BG = "#f0f2f5";

/**
 * شات دعم الطالب — حسب support-chatbot-api.md
 * POST /student/start | GET /student/chat | POST /student/messages
 */
const SupportChatStudent = () => {
  const toast = useToast();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const authHeader = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const canSend = chat?.status !== "closed";

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, []);

  const fetchStudentChat = useCallback(async () => {
    const { data } = await baseUrl.get("/api/support/student/chat", {
      headers: authHeader,
    });
    if (data.chat) setChat(data.chat);
    if (Array.isArray(data.messages)) setMessages(data.messages);
    scrollToBottom();
    return data;
  }, [authHeader, scrollToBottom]);

  const startStudentChat = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await baseUrl.post(
        "/api/support/student/start",
        {},
        { headers: { ...authHeader, "Content-Type": "application/json" } },
      );

      if (data.chat) setChat(data.chat);

      if (data.welcome_message) {
        setMessages([data.welcome_message]);
        scrollToBottom();
      } else {
        try {
          await fetchStudentChat();
        } catch {
          setMessages([]);
        }
      }
      return data.chat;
    } catch (err) {
      toast({
        title: "خطأ",
        description:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "فشل تحميل المحادثة",
        status: "error",
        isClosable: true,
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [authHeader, fetchStudentChat, scrollToBottom, toast]);

  useEffect(() => {
    startStudentChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = async () => {
    const text = messageText?.trim();
    if (!text || sending) return;

    if (!canSend) {
      toast({
        title: "المحادثة مغلقة",
        description: "لا يمكن إرسال رسائل جديدة.",
        status: "warning",
        isClosable: true,
      });
      return;
    }

    setSending(true);
    setMessageText("");
    try {
      const { data } = await baseUrl.post(
        "/api/support/student/messages",
        { text },
        {
          headers: {
            ...authHeader,
            "Content-Type": "application/json; charset=utf-8",
          },
        },
      );

      if (data.chat) setChat(data.chat);
      setMessages((prev) => appendAssistantSendResponse(prev, data));
      scrollToBottom();
    } catch (err) {
      setMessageText(text);
      const status = err?.response?.status;
      toast({
        title: status === 401 ? "يجب تسجيل الدخول" : "فشل الإرسال",
        description:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "حدث خطأ",
        status: "error",
        isClosable: true,
      });
    } finally {
      setSending(false);
    }
  };

  if (loading && !chat && messages.length === 0) {
    return <BrandLoadingScreen />;
  }

  if (!chat && !loading) {
    return (
      <Box minH="100vh" bg={WA_CHAT_BG} dir="rtl" pt="120px" pb={8}>
        <Center>
          <VStack spacing={4} p={8} bg="white" borderRadius="2xl" shadow="lg">
            <FaHeadset size={48} color={WA_HEADER} />
            <Text fontWeight="medium">لا يمكن تحميل المحادثة.</Text>
            <Button
              bg={WA_HEADER}
              color="white"
              _hover={{ opacity: 0.9 }}
              onClick={() => startStudentChat()}
            >
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
              مساعد الدعم الفني
            </Text>
            <HStack spacing={2}>
              <Text fontSize="xs" opacity={0.9}>
                طالب
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
      </Flex>

      <Box
        flex={1}
        overflowY="auto"
        p={3}
        bg={WA_CHAT_BG}
        backgroundImage="url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4d4c9\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
      >
        {messages.length === 0 ? (
          <Center h="auto" minH="180px" flexDirection="column" gap={2} px={4} py={8}>
            <Text fontSize="sm" color="gray.600" textAlign="center">
              اكتب رسالتك — المساعد يساعدك في الاشتراك ورابط منصة المدرس ومشاكل الدخول.
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
              المحادثة مغلقة.
            </Text>
          </Box>
        ) : null}
        <Flex w="full" align="center" gap={2}>
          <Input
            placeholder={canSend ? "رسالة" : "المحادثة مغلقة"}
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

      <ScrollToTop />
    </Box>
  );
};

export default SupportChatStudent;
