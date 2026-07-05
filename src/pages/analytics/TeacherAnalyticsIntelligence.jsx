import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Button,
  useColorModeValue,
  Spinner,
  Center,
  Badge,
  useToast,
  Icon,
  Textarea,
  Heading,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  IconButton,
} from "@chakra-ui/react";
import {
  FaPaperPlane,
  FaChartLine,
  FaArrowUp,
  FaSync,
  FaBook,
  FaListUl,
  FaInfoCircle,
} from "react-icons/fa";
import baseUrl from "../../api/baseUrl";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import ReportMarkdownContent from "../../components/analytics/ReportMarkdownContent";

const API_BASE = "/api/teacher/data-analyst";
const MESSAGE_LIMIT = 4000;
const PAGE_SIZE = 30;

const REPORT_TYPE_META = {
  student: { label: "تقرير طالب", colorScheme: "blue" },
  course: { label: "تقرير كورس", colorScheme: "orange" },
  general: { label: "تقرير عام", colorScheme: "gray" },
  other: { label: "رد", colorScheme: "gray" },
};

function formatTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("ar-EG", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function ReportTypeBadge({ reportType }) {
  if (!reportType || reportType === "other") return null;
  const meta = REPORT_TYPE_META[reportType] || REPORT_TYPE_META.other;
  return (
    <Badge colorScheme={meta.colorScheme} variant="subtle" fontSize="10px" borderRadius="md" px={2}>
      {meta.label}
    </Badge>
  );
}

function UserRequestBlock({ message }) {
  const bubbleBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const muted = useColorModeValue("gray.500", "gray.400");

  return (
    <Flex justify="flex-end" py={3} w="full">
      <Box maxW={{ base: "100%", md: "82%" }} w="full">
        {message.created_at && (
          <Text fontSize="10px" color={muted} textAlign="left" mb={1.5} px={1}>
            {formatTime(message.created_at)}
          </Text>
        )}
        <Box bg={bubbleBg} borderRadius="2xl" px={4} py={3}>
          <Text
            fontSize="sm"
            lineHeight="1.75"
            color={textColor}
            whiteSpace="pre-wrap"
            wordBreak="break-word"
          >
            {message.message}
          </Text>
        </Box>
      </Box>
    </Flex>
  );
}

function ReportBlock({ message }) {
  const titleColor = useColorModeValue("gray.800", "gray.100");
  const muted = useColorModeValue("gray.500", "gray.400");
  const assistantIconBg = useColorModeValue("blue.500", "blue.400");

  return (
    <Box py={{ base: 4, md: 5 }} w="full">
      <HStack spacing={3} align="start" mb={3}>
        <Flex
          boxSize={8}
          borderRadius="full"
          bg={assistantIconBg}
          align="center"
          justify="center"
          flexShrink={0}
        >
          <Icon as={FaChartLine} boxSize={3.5} color="white" />
        </Flex>
        <Box flex={1} minW={0}>
          <HStack spacing={2} flexWrap="wrap">
            <Text fontSize="sm" fontWeight="semibold" color={titleColor}>
              محلل البيانات
            </Text>
            <ReportTypeBadge reportType={message.report_type} />
          </HStack>
          {message.created_at && (
            <Text fontSize="10px" color={muted} mt={0.5}>
              {formatTime(message.created_at)}
            </Text>
          )}
        </Box>
      </HStack>
      <Box pr={{ base: 0, md: 2 }} overflowX="auto">
        <ReportMarkdownContent content={message.message} />
      </Box>
    </Box>
  );
}

function GeneratingBlock() {
  const muted = useColorModeValue("gray.600", "gray.400");
  const skeletonBg = useColorModeValue("gray.100", "gray.700");
  const assistantIconBg = useColorModeValue("blue.500", "blue.400");

  return (
    <Box py={5} w="full">
      <HStack spacing={3} mb={4}>
        <Flex boxSize={8} borderRadius="full" bg={assistantIconBg} align="center" justify="center">
          <Spinner size="sm" color="white" thickness="2px" />
        </Flex>
        <Text fontSize="sm" color={muted}>
          جاري تحليل البيانات وإعداد التقرير...
        </Text>
      </HStack>
      <VStack spacing={2} align="stretch" maxW="md">
        <Box w="full" h="2" bg={skeletonBg} borderRadius="full" />
        <Box w="85%" h="2" bg={skeletonBg} borderRadius="full" alignSelf="flex-start" />
        <Box w="65%" h="2" bg={skeletonBg} borderRadius="full" alignSelf="flex-start" />
      </VStack>
    </Box>
  );
}

function ChatComposer({
  messageText,
  setMessageText,
  onSubmit,
  sending,
  inputRef,
  quickCommands,
  onQuickCommand,
  muted,
  borderColor,
  shellBg,
}) {
  const inputShellBg = useColorModeValue("white", "gray.800");
  const composerShadow = useColorModeValue(
    "0 2px 12px rgba(15, 23, 42, 0.06)",
    "0 2px 12px rgba(0, 0, 0, 0.25)",
  );
  const chipBg = useColorModeValue("white", "gray.800");
  const chipHover = useColorModeValue("gray.50", "gray.700");

  return (
    <Box
      flexShrink={0}
      px={{ base: 2, md: 3 }}
      pt={2}
      pb={2}
      bg={shellBg}
      borderTopWidth="1px"
      borderColor={borderColor}
      sx={{ pb: "max(8px, env(safe-area-inset-bottom, 8px))" }}
    >
      <Box maxW="48rem" mx="auto" w="full">
        {quickCommands.length > 0 && (
          <Flex
            gap={1.5}
            mb={2}
            overflowX="auto"
            pb={0.5}
            sx={{
              "&::-webkit-scrollbar": { height: "3px" },
              WebkitOverflowScrolling: "touch",
            }}
          >
            {quickCommands.map((cmd, index) => (
              <Button
                key={`${cmd.label}-${index}`}
                size="xs"
                variant="outline"
                borderColor={borderColor}
                bg={chipBg}
                borderRadius="full"
                fontWeight="normal"
                fontSize="11px"
                flexShrink={0}
                whiteSpace="nowrap"
                h="26px"
                minH="26px"
                px={2.5}
                onClick={() => onQuickCommand(cmd)}
                isDisabled={sending}
                _hover={{ bg: chipHover, borderColor: "blue.300", color: "blue.600" }}
              >
                {cmd.label}
              </Button>
            ))}
          </Flex>
        )}

        <Box
          as="form"
          onSubmit={onSubmit}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={borderColor}
          bg={inputShellBg}
          boxShadow={composerShadow}
          overflow="hidden"
          _focusWithin={{
            borderColor: "blue.400",
            boxShadow: "0 0 0 1px rgba(49, 130, 206, 0.12)",
          }}
        >
          <Flex align="center" gap={1.5} py={1} px={1.5} pl={2}>
            <Textarea
              ref={inputRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="اكتب طلب التقرير..."
              rows={1}
              minH="36px"
              maxH="120px"
              resize="none"
              maxLength={MESSAGE_LIMIT}
              isDisabled={sending}
              border="none"
              bg="transparent"
              _focus={{ boxShadow: "none" }}
              fontSize="sm"
              lineHeight="1.5"
              flex={1}
              py={1.5}
              px={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
            />
            <IconButton
              type="submit"
              aria-label="إرسال"
              icon={<FaPaperPlane boxSize={3} />}
              colorScheme="blue"
              borderRadius="full"
              size="sm"
              flexShrink={0}
              isLoading={sending}
              isDisabled={!messageText.trim() || sending}
            />
          </Flex>
        </Box>

        <Flex justify="flex-end" align="center" mt={1} fontSize="10px" color={muted} gap={2}>
          <Text display={{ base: "none", md: "block" }}>Enter إرسال · Shift+Enter سطر</Text>
          <Text>{messageText.length}/{MESSAGE_LIMIT}</Text>
        </Flex>
      </Box>
    </Box>
  );
}

function GuidePanel({ botInfo, onExampleClick, sending, compact }) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const sectionBg = useColorModeValue("gray.50", "gray.900");
  const titleColor = useColorModeValue("gray.800", "gray.100");
  const exampleHoverBg = useColorModeValue("blue.50", "gray.800");

  return (
    <VStack align="stretch" spacing={5} h={compact ? "auto" : "full"}>
      {(botInfo?.capabilities || []).length > 0 && (
        <Box>
          <HStack spacing={2} mb={3}>
            <Icon as={FaListUl} boxSize={3.5} color="gray.500" />
            <Text fontSize="sm" fontWeight="semibold" color={titleColor}>
              أنواع التقارير
            </Text>
          </HStack>
          <VStack align="stretch" spacing={2}>
            {(botInfo?.capabilities || []).map((cap) => (
              <Text
                key={cap}
                fontSize="xs"
                lineHeight="1.7"
                color={muted}
                px={3}
                py={2.5}
                bg={sectionBg}
                borderRadius="md"
                borderWidth="1px"
                borderColor={borderColor}
              >
                {cap}
              </Text>
            ))}
          </VStack>
        </Box>
      )}

      {Array.isArray(botInfo?.examples) && botInfo.examples.length > 0 && (
        <Box>
          <HStack spacing={2} mb={3}>
            <Icon as={FaBook} boxSize={3.5} color="gray.500" />
            <Text fontSize="sm" fontWeight="semibold" color={titleColor}>
              أمثلة للطلب
            </Text>
          </HStack>
          <VStack align="stretch" spacing={2}>
            {botInfo.examples.map((example) => (
              <Button
                key={example}
                size="sm"
                variant="ghost"
                justifyContent="flex-start"
                h="auto"
                py={2.5}
                px={3}
                borderRadius="md"
                fontWeight="normal"
                fontSize="xs"
                whiteSpace="normal"
                textAlign="right"
                color={muted}
                bg={sectionBg}
                borderWidth="1px"
                borderColor={borderColor}
                onClick={() => onExampleClick(example)}
                isDisabled={sending}
                _hover={{ bg: exampleHoverBg, color: "blue.600", borderColor: "blue.200" }}
              >
                {example}
              </Button>
            ))}
          </VStack>
        </Box>
      )}

      <Box
        p={3}
        borderRadius="md"
        bg={sectionBg}
        borderWidth="1px"
        borderColor={borderColor}
      >
        <Text fontSize="xs" lineHeight="1.75" color={muted}>
          البيانات من منصتك فقط. عند ظهور قائمة طلاب، أرسل كود الطالب في رسالة جديدة للحصول على التفاصيل.
        </Text>
      </Box>
    </VStack>
  );
}

function EmptyState({ welcomeMessage, onExampleClick, examples, sending }) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const titleColor = useColorModeValue("gray.800", "white");
  const iconBg = useColorModeValue("blue.50", "blue.900");

  return (
    <Flex flex={1} align="center" justify="center" minH="full" px={2} py={8}>
      <VStack spacing={5} maxW="520px" textAlign="center" w="full">
        <Flex boxSize={16} borderRadius="2xl" bg={iconBg} align="center" justify="center">
          <Icon as={FaChartLine} boxSize={7} color="blue.500" />
        </Flex>
        <Box>
          <Heading size="md" color={titleColor} mb={2} fontWeight="semibold">
            كيف يمكنني مساعدتك؟
          </Heading>
          <Text fontSize="sm" color={muted} lineHeight="1.85">
            {welcomeMessage || "اطلب تقريراً عن طالب أو كورس أو نظرة عامة على منصتك."}
          </Text>
        </Box>
        {examples?.length > 0 && (
          <VStack w="full" spacing={2} align="stretch">
            {examples.slice(0, 4).map((example) => (
              <Button
                key={example}
                size="sm"
                variant="outline"
                borderColor={borderColor}
                borderRadius="xl"
                fontWeight="normal"
                fontSize="sm"
                h="auto"
                py={3}
                whiteSpace="normal"
                onClick={() => onExampleClick(example)}
                isDisabled={sending}
                _hover={{ borderColor: "blue.300", bg: "blue.50" }}
              >
                {example}
              </Button>
            ))}
          </VStack>
        )}
      </VStack>
    </Flex>
  );
}

const TeacherAnalyticsIntelligence = () => {
  const toast = useToast();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { isOpen: guideOpen, onOpen: openGuide, onClose: closeGuide } = useDisclosure();

  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);

  const [botInfo, setBotInfo] = useState(null);
  const [quickCommands, setQuickCommands] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageOffset, setMessageOffset] = useState(0);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [messageText, setMessageText] = useState("");

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const shellBg = useColorModeValue("white", "gray.800");
  const chatBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const toolbarBg = useColorModeValue("white", "gray.900");
  const headerAccent = useColorModeValue("blue.500", "blue.300");
  const headerIconBg = useColorModeValue("blue.50", "blue.900");
  const guidePanelBg = useColorModeValue("gray.50", "gray.900");

  const shellHeight = "calc(100dvh - 72px)";

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, []);

  const fetchBotInfo = useCallback(async () => {
    const { data } = await baseUrl.get(`${API_BASE}/info`, { headers: authHeaders });
    if (data?.success === false) throw new Error(data?.message || "فشل تحميل معلومات البوت");
    setBotInfo(data.bot || null);
    setQuickCommands(Array.isArray(data.quick_commands) ? data.quick_commands : []);
    return data;
  }, [authHeaders]);

  const fetchMessagesPage = useCallback(
    async (offset) => {
      const { data } = await baseUrl.get(`${API_BASE}/messages`, {
        headers: authHeaders,
        params: { limit: PAGE_SIZE, offset },
      });
      if (data?.success === false) throw new Error(data?.message || "فشل تحميل الرسائل");
      return {
        messages: Array.isArray(data.messages) ? data.messages : [],
        pagination: data.pagination || {},
      };
    },
    [authHeaders],
  );

  const fetchLatestMessages = useCallback(async () => {
    setMessagesLoading(true);
    try {
      const probe = await fetchMessagesPage(0);
      const total = Number(probe.pagination.total) || probe.messages.length;
      const offset = Math.max(0, total - PAGE_SIZE);
      const page = offset === 0 && total <= PAGE_SIZE ? probe : await fetchMessagesPage(offset);
      setMessages(page.messages);
      setMessageOffset(offset);
      setHasOlderMessages(offset > 0);
      scrollToBottom();
    } finally {
      setMessagesLoading(false);
    }
  }, [fetchMessagesPage, scrollToBottom]);

  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasOlderMessages) return;
    const newOffset = Math.max(0, messageOffset - PAGE_SIZE);
    setLoadingOlder(true);
    try {
      const page = await fetchMessagesPage(newOffset);
      setMessages((prev) => [...page.messages, ...prev]);
      setMessageOffset(newOffset);
      setHasOlderMessages(newOffset > 0);
    } catch (error) {
      toast({
        title: "تعذر تحميل الرسائل الأقدم",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    } finally {
      setLoadingOlder(false);
    }
  }, [fetchMessagesPage, hasOlderMessages, loadingOlder, messageOffset, toast]);

  const sendMessage = useCallback(
    async (rawText) => {
      const trimmed = String(rawText || "").trim();
      if (!trimmed || sending) return;

      if (trimmed.length > MESSAGE_LIMIT) {
        toast({
          title: "الرسالة طويلة جداً",
          description: `الحد الأقصى ${MESSAGE_LIMIT} حرف`,
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setSending(true);
      if (messageText === trimmed) setMessageText("");

      const optimisticId = `pending-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: optimisticId,
          role: "teacher",
          message: trimmed,
          report_type: null,
          created_at: new Date().toISOString(),
        },
      ]);
      scrollToBottom();

      try {
        const { data } = await baseUrl.post(
          `${API_BASE}/messages`,
          { message: trimmed },
          { headers: authHeaders },
        );
        if (data?.success === false) throw new Error(data?.message || "فشل إرسال الرسالة");

        setMessages((prev) => {
          const next = prev.filter((m) => m.id !== optimisticId);
          if (data.user_message) next.push(data.user_message);
          if (data.assistant_message) next.push(data.assistant_message);
          else if (data.reply) {
            next.push({
              id: `assistant-${Date.now()}`,
              role: "assistant",
              message: data.reply,
              report_type: data.report_type || null,
              created_at: new Date().toISOString(),
            });
          }
          return next;
        });
        scrollToBottom();
      } catch (error) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        toast({
          title: "فشل الإرسال",
          description: error.response?.data?.message || error.message || "تأكد من صلاحية الجلسة",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      } finally {
        setSending(false);
      }
    },
    [authHeaders, messageText, scrollToBottom, sending, toast],
  );

  const handleQuickCommand = (cmd) => {
    const payload = cmd?.payload || cmd?.label || "";
    if (!payload) return;
    const needsInput =
      payload.endsWith(" ") && (payload.includes("الطالب") || payload.includes("الكورس"));
    if (needsInput) {
      setMessageText(payload);
      inputRef.current?.focus();
      return;
    }
    sendMessage(payload);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    sendMessage(messageText);
  };

  const refreshChat = async () => {
    try {
      await fetchBotInfo();
      await fetchLatestMessages();
    } catch (error) {
      toast({
        title: "تعذر التحديث",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        await fetchBotInfo();
        if (mounted) await fetchLatestMessages();
      } catch (error) {
        if (mounted) {
          toast({
            title: "تعذر تحميل محلل البيانات",
            description: error.response?.data?.message || error.message,
            status: "error",
            duration: 4000,
            isClosable: true,
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [fetchBotInfo, fetchLatestMessages, toast]);

  const showEmpty = messages.length === 0 && !messagesLoading && !sending;

  if (loading) return <BrandLoadingScreen />;

  return (
    <Box
      dir="rtl"
      mx={{ base: -3, sm: -4, md: -6 }}
      my={{ base: -2.5, sm: -3, md: -4 }}
      h={shellHeight}
      minH={shellHeight}
      display="flex"
      flexDirection="column"
      bg={pageBg}
    >
      <Flex
        direction="column"
        flex={1}
        minH={0}
        w="full"
        mx="auto"
        bg={shellBg}
        borderWidth={{ base: 0, md: "1px" }}
        borderColor={borderColor}
        borderRadius={{ base: 0, md: "xl" }}
        overflow="hidden"
        boxShadow={{ base: "none", md: "sm" }}
      >
        {/* شريط علوي مضغوط */}
        <Flex
          px={{ base: 3, md: 5 }}
          py={2}
          minH="52px"
          align="center"
          justify="space-between"
          gap={2}
          borderBottomWidth="1px"
          borderColor={borderColor}
          flexShrink={0}
          bg={toolbarBg}
        >
          <HStack spacing={2} minW={0} flex={1}>
            <Flex
              boxSize={9}
              borderRadius="full"
              bg={headerIconBg}
              align="center"
              justify="center"
              flexShrink={0}
            >
              <Icon as={FaChartLine} color={headerAccent} boxSize={4} />
            </Flex>
            <Box minW={0}>
              <Heading size="sm" fontWeight="semibold" noOfLines={1}>
                {botInfo?.name || "محلل البيانات"}
              </Heading>
            </Box>
          </HStack>
          <HStack spacing={1.5} flexShrink={0}>
            <IconButton
              aria-label="دليل الاستخدام"
              icon={<FaInfoCircle />}
              size="sm"
              variant="ghost"
              display={{ base: "inline-flex", lg: "none" }}
              onClick={openGuide}
            />
            <IconButton
              aria-label="تحديث المحادثة"
              icon={<FaSync />}
              size="sm"
              variant="ghost"
              display={{ base: "inline-flex", sm: "none" }}
              onClick={refreshChat}
              isLoading={messagesLoading}
            />
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<FaInfoCircle />}
              display={{ base: "none", lg: "inline-flex" }}
              onClick={openGuide}
            >
              الدليل
            </Button>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<FaSync />}
              display={{ base: "none", sm: "inline-flex" }}
              onClick={refreshChat}
              isLoading={messagesLoading}
            >
              تحديث
            </Button>
          </HStack>
        </Flex>

        <Flex flex={1} minH={0} overflow="hidden">
          {/* منطقة الشات — ChatGPT style */}
          <Flex direction="column" flex={1} minW={0} minH={0} bg={chatBg}>
            <Box
              flex={1}
              minH={0}
              overflowY="auto"
              overflowX="hidden"
              display="flex"
              flexDirection="column"
              sx={{
                WebkitOverflowScrolling: "touch",
                overscrollBehavior: "contain",
              }}
            >
              {hasOlderMessages && (
                <Center py={3} flexShrink={0}>
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="blue"
                    leftIcon={<FaArrowUp />}
                    onClick={loadOlderMessages}
                    isLoading={loadingOlder}
                  >
                    تحميل رسائل أقدم
                  </Button>
                </Center>
              )}

              {messagesLoading ? (
                <Flex flex={1} align="center" justify="center" minH="240px">
                  <VStack spacing={3}>
                    <Spinner color="blue.500" size="lg" />
                    <Text fontSize="sm" color={muted}>
                      جاري تحميل السجل...
                    </Text>
                  </VStack>
                </Flex>
              ) : showEmpty ? (
                <EmptyState
                  welcomeMessage={botInfo?.welcome_message}
                  examples={botInfo?.examples}
                  onExampleClick={sendMessage}
                  sending={sending}
                />
              ) : (
                <Box flex={1} w="full">
                  <Box maxW="48rem" mx="auto" w="full" px={{ base: 3, md: 4 }} py={{ base: 4, md: 6 }}>
                    {messages.map((msg) =>
                      msg.role === "teacher" ? (
                        <UserRequestBlock key={msg.id} message={msg} />
                      ) : (
                        <ReportBlock key={msg.id} message={msg} />
                      ),
                    )}
                    {sending && <GeneratingBlock />}
                    <Box ref={messagesEndRef} h={4} />
                  </Box>
                </Box>
              )}
            </Box>

            <ChatComposer
              messageText={messageText}
              setMessageText={setMessageText}
              onSubmit={handleSubmit}
              sending={sending}
              inputRef={inputRef}
              quickCommands={quickCommands}
              onQuickCommand={handleQuickCommand}
              muted={muted}
              borderColor={borderColor}
              shellBg={chatBg}
            />
          </Flex>

          {/* دليل جانبي — desktop */}
          <Box
            w={{ lg: "280px", xl: "300px" }}
            flexShrink={0}
            borderRightWidth="1px"
            borderColor={borderColor}
            bg={guidePanelBg}
            p={4}
            overflowY="auto"
            display={{ base: "none", lg: "block" }}
            sx={{ overscrollBehavior: "contain" }}
          >
            <GuidePanel botInfo={botInfo} onExampleClick={sendMessage} sending={sending} />
          </Box>
        </Flex>
      </Flex>

      <Drawer isOpen={guideOpen} placement="right" onClose={closeGuide} size="sm">
        <DrawerOverlay />
        <DrawerContent maxH="100dvh">
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" fontSize="md">
            دليل الاستخدام
          </DrawerHeader>
          <DrawerBody py={5} overflowY="auto">
            <GuidePanel
              botInfo={botInfo}
              onExampleClick={(ex) => {
                sendMessage(ex);
                closeGuide();
              }}
              sending={sending}
              compact
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default TeacherAnalyticsIntelligence;
