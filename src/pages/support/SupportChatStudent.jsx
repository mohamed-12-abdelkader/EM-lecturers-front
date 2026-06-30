import React, { useCallback, useEffect, useRef, useMemo, useState } from "react";
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
  Image,
  useColorModeValue,
  Icon,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from "@chakra-ui/react";
import {
  FaPaperPlane,
  FaImage,
  FaMicrophone,
  FaTimes,
  FaRobot,
  FaFileAlt,
  FaQuestionCircle,
  FaHeadset,
  FaBars,
} from "react-icons/fa";
import baseUrl from "../../api/baseUrl";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";

// ألوان واتساب
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

const STATUS_COLORS = {
  bot_handling: "purple",
  waiting_for_admin: "yellow",
  admin_handling: "blue",
  resolved: "green",
  open: "cyan",
  closed: "gray",
};

const SupportChatStudent = () => {
  const toast = useToast();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [faqs, setFaqs] = useState([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.800", "white");
  const secondaryColor = useColorModeValue("gray.600", "gray.400");
  const faqItemBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const botBubbleBg = useColorModeValue("green.50", "green.900");
  const botBubbleColor = useColorModeValue("green.900", "green.100");
  const otherBubbleBg = useColorModeValue("gray.200", "gray.600");
  const previewBg = useColorModeValue("gray.100", "gray.700");
  const faqDrawer = useDisclosure();

  const authHeader = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // للمدرس: إرسال هيدر حتى الباكند لا يقفل الشات عليه (يسمح بالإرسال دائماً)
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);
  const isTeacher = user?.role === "teacher";
  const supportHeaders = useMemo(
    () => ({
      ...authHeader,
      ...(isTeacher && { "X-Support-User-Role": "teacher" }),
    }),
    [authHeader, isTeacher]
  );

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

  // الحصول على الشات أو إنشاؤه
  const fetchChat = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await baseUrl.get("/api/support/chat", { headers: authHeader });
      setChat(data.chat || null);
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

  // جلب الرسائل
  const fetchMessages = useCallback(
    async (chatId) => {
      if (!chatId) return;
      try {
        setMessagesLoading(true);
        const { data } = await baseUrl.get(`/api/support/chats/${chatId}/messages`, {
          params: { limit: 50 },
          headers: supportHeaders,
        });
        setMessages(data.messages || []);
        scrollToBottom();
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
    [supportHeaders, toast, scrollToBottom]
  );

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await baseUrl.get("/api/support/unread-count", { headers: supportHeaders });
      setUnreadCount(data.unread_count || 0);
    } catch {
      // ignore
    }
  }, [supportHeaders]);

  const fetchFaqs = useCallback(async () => {
    try {
      setFaqLoading(true);
      const { data } = await baseUrl.get("/api/support/faq", { headers: authHeader });
      setFaqs(data.faqs || data || []);
    } catch {
      setFaqs([]);
    } finally {
      setFaqLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const c = await fetchChat();
      if (mounted && c?.id) {
        await fetchMessages(c.id);
        fetchUnreadCount();
      }
      fetchFaqs();
    })();
    return () => {
      mounted = false;
    };
  }, [fetchChat, fetchMessages, fetchUnreadCount, fetchFaqs]);

  // إرسال رسالة نصية
  const handleSendMessage = async () => {
    const text = messageText?.trim();
    if (!text || sending) return;

    setSending(true);
    setMessageText("");
    try {
      const { data } = await baseUrl.post(
        "/api/support/messages",
        { text },
        { headers: { ...supportHeaders, "Content-Type": "application/json" } }
      );
      setMessages((prev) => {
        const next = [...prev, data.message];
        if (data.bot_reply) next.push({ ...data.bot_reply, id: data.bot_reply.id || `bot-${Date.now()}` });
        return next;
      });
      scrollToBottom();
      if (data.bot_reply) {
        toast({ title: "رد تلقائي", status: "info", duration: 2000, isClosable: true });
      }
      fetchChat().then((c) => c && fetchMessages(c.id));
      fetchUnreadCount();
    } catch (err) {
      setMessageText(text);
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message;
      if (status === 403) {
        toast({
          title: isTeacher ? "تعذر الإرسال" : "انتظار رد الدعم",
          description: isTeacher
            ? "المفترض أن الشات لا يُقفل للمدرس. إن استمرت المشكلة تواصل مع الإدارة."
            : msg || "يرجى الانتظار حتى يرد فريق الدعم.",
          status: "warning",
          isClosable: true,
        });
      } else {
        toast({
          title: "فشل الإرسال",
          description: msg || "حدث خطأ أثناء إرسال الرسالة",
          status: "error",
          isClosable: true,
        });
      }
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
    e.target.value = "";
  };

  const handleSendMedia = async () => {
    if (!selectedFile || sending || !chat?.id) return;

    setSending(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    if (messageText?.trim()) formData.append("text", messageText.trim());

    try {
      const { data } = await baseUrl.post("/api/support/messages/media", formData, {
        headers: { ...authHeader, "Content-Type": "multipart/form-data" },
      });
      setMessages((prev) => [...prev, data.message]);
      setSelectedFile(null);
      setPreviewUrl(null);
      setMessageText("");
      scrollToBottom();
      fetchUnreadCount();
    } catch (err) {
      toast({
        title: "فشل إرسال الملف",
        description: err?.response?.data?.message || "حدث خطأ",
        status: "error",
        isClosable: true,
      });
    } finally {
      setSending(false);
    }
  };

  const handleSendAudio = async (e) => {
    const file = e.target?.files?.[0];
    if (!file || sending || !chat?.id) return;

    setSending(true);
    const formData = new FormData();
    formData.append("audio", file);

    try {
      const { data } = await baseUrl.post("/api/support/messages/audio", formData, {
        headers: { ...supportHeaders, "Content-Type": "multipart/form-data" },
      });
      setMessages((prev) => [...prev, data.message]);
      scrollToBottom();
      fetchUnreadCount();
    } catch (err) {
      toast({
        title: "فشل إرسال الرسالة الصوتية",
        description: err?.response?.data?.message || "حدث خطأ",
        status: "error",
        isClosable: true,
      });
    } finally {
      setSending(false);
    }
    e.target.value = "";
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
            <Text color={textColor} fontWeight="medium">لا يمكن تحميل المحادثة.</Text>
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
      {/* هيدر واتساب */}
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
              الدعم الفني
            </Text>
            <Text fontSize="xs" opacity={0.9} noOfLines={1}>
              {chat ? STATUS_LABELS[chat.status] || chat.status : ""}
            </Text>
          </VStack>
        </HStack>
        <HStack spacing={1}>
          {unreadCount > 0 && (
            <Badge colorScheme="red" fontSize="xs" borderRadius="full">
              {unreadCount}
            </Badge>
          )}
          <IconButton
            aria-label="الأسئلة الشائعة"
            icon={<FaBars />}
            variant="ghost"
            color="white"
            size="sm"
            onClick={faqDrawer.onOpen}
          />
        </HStack>
      </Flex>

      {/* منطقة الرسائل - خلفية واتساب */}
      <Box
        flex={1}
        overflowY="auto"
        p={3}
        bg={WA_CHAT_BG}
        backgroundImage="url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4d4c9\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
      >
        {messagesLoading ? (
          <Center h="200px">
            <Spinner color={WA_HEADER} size="lg" />
          </Center>
        ) : messages.length === 0 ? (
          <Center h="200px">
            <Text fontSize="sm" color="gray.600">
              لا توجد رسائل. ابدأ المحادثة أدناه.
            </Text>
          </Center>
        ) : (
          <VStack align="stretch" spacing={2}>
            {messages.map((msg) => {
              const isStudent = msg.sender_role === "student";
              const isBot = msg.is_auto_reply;
              const isReceived = !isStudent;
              return (
                <Flex
                  key={msg.id}
                  justify={isStudent ? "flex-end" : "flex-start"}
                  w="full"
                >
                  <Box
                    maxW="75%"
                    px={3}
                    py={2}
                    borderRadius="18px"
                    borderBottomRightRadius={isStudent ? "4px" : "18px"}
                    borderBottomLeftRadius={isReceived ? "4px" : "18px"}
                    bg={isStudent ? WA_SENT_BUBBLE : isBot ? "#e7f8e5" : WA_RECEIVED_BUBBLE}
                    color={isStudent ? "gray.800" : "gray.800"}
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
                        {msg.text && <Text whiteSpace="pre-wrap" fontSize="15px">{msg.text}</Text>}
                      </VStack>
                    )}
                    {msg.message_type === "audio" && msg.media_url && (
                      <VStack align="start" spacing={1}>
                        <audio controls src={msg.media_url} style={{ maxWidth: "100%", height: "36px" }} />
                        {msg.text && <Text whiteSpace="pre-wrap" fontSize="15px">{msg.text}</Text>}
                      </VStack>
                    )}
                    {msg.message_type === "file" && msg.media_url && (
                      <VStack align="start" spacing={2}>
                        <HStack>
                          <Icon as={FaFileAlt} />
                          <Text fontSize="sm">{msg.media_name || "ملف"}</Text>
                          <Button size="xs" as="a" href={msg.media_url} target="_blank" rel="noopener noreferrer" colorScheme="green">
                            تحميل
                          </Button>
                        </HStack>
                        {msg.text && <Text whiteSpace="pre-wrap" fontSize="15px">{msg.text}</Text>}
                      </VStack>
                    )}
                    <Text fontSize="11px" color="gray.500" mt={1} textAlign={isStudent ? "left" : "right"}>
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

      {/* شريط الإدخال - مثل واتساب */}
      <VStack align="stretch" spacing={0} flexShrink={0} bg={WA_INPUT_BG} p={2}>
        {selectedFile && (
          <Box mb={2} p={2} bg="white" borderRadius="lg" position="relative" w="full">
            {previewUrl ? (
              <Image src={previewUrl} maxH="80px" borderRadius="md" alt="" />
            ) : (
              <HStack>
                <Icon as={FaFileAlt} color={WA_HEADER} />
                <Text fontSize="sm">{selectedFile.name}</Text>
              </HStack>
            )}
            <IconButton
              icon={<FaTimes />}
              size="xs"
              position="absolute"
              top={1}
              right={1}
              aria-label="إلغاء"
              variant="ghost"
              onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
            />
          </Box>
        )}
        <Flex w="full" align="center" gap={2}>
        <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileSelect} accept="image/*,video/*,.pdf,.doc,.docx" />
        <input type="file" ref={audioInputRef} style={{ display: "none" }} accept="audio/*" onChange={handleSendAudio} />
        <IconButton
          aria-label="مرفق"
          icon={<FaImage />}
          variant="ghost"
          color="gray.600"
          size="md"
          borderRadius="full"
          onClick={() => fileInputRef.current?.click()}
        />
        <IconButton
          aria-label="صوت"
          icon={<FaMicrophone />}
          variant="ghost"
          color="gray.600"
          size="md"
          borderRadius="full"
          onClick={() => audioInputRef.current?.click()}
        />
        <Input
          placeholder="رسالة"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (selectedFile) handleSendMedia();
              else handleSendMessage();
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
          onClick={selectedFile ? handleSendMedia : handleSendMessage}
          isLoading={sending}
          isDisabled={(!messageText?.trim() && !selectedFile) || sending}
        />
        </Flex>
      </VStack>

      {/* درج الأسئلة الشائعة */}
      <Drawer placement="left" onClose={faqDrawer.onClose} isOpen={faqDrawer.isOpen}>
        <DrawerOverlay />
        <DrawerContent dir="rtl">
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">الأسئلة الشائعة</DrawerHeader>
          <DrawerBody>
            {faqLoading ? (
              <Center py={8}><Spinner color={WA_HEADER} /></Center>
            ) : faqs.length === 0 ? (
              <Text fontSize="sm" color="gray.500">لا توجد أسئلة شائعة.</Text>
            ) : (
              <VStack align="stretch" spacing={3}>
                {faqs.map((faq, i) => (
                  <Box key={faq.id || i} p={4} borderRadius="lg" bg={faqItemBg} borderWidth="1px" borderColor={borderColor}>
                    <Text fontWeight="600" fontSize="sm" color={textColor}>{faq.question}</Text>
                    <Text fontSize="sm" color={secondaryColor} mt={2}>{faq.answer}</Text>
                  </Box>
                ))}
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <ScrollToTop />
    </Box>
  );
};

export default SupportChatStudent;
