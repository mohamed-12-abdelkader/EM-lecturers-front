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
  FaInfoCircle,
} from "react-icons/fa";
import baseUrl from "../../api/baseUrl";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import ReportMarkdownContent from "../../components/analytics/ReportMarkdownContent";

const API_BASE = "/api/teacher/data-analyst";
const MESSAGE_LIMIT = 4000;
const PAGE_SIZE = 30;

const REPORT_TYPE_META = {
  student: { label: "طالب", color: "blue" },
  course: { label: "كورس", color: "orange" },
  general: { label: "عام", color: "gray" },
  other: { label: "رد", color: "gray" },
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
    <Badge
      colorScheme={meta.color}
      variant="subtle"
      fontSize="10px"
      fontWeight="700"
      borderRadius="full"
      px={2}
      py={0.5}
    >
      {meta.label}
    </Badge>
  );
}

function UserRequestBlock({ message }) {
  const bubbleBg = useColorModeValue("#0E4C92", "blue.500");
  const muted = useColorModeValue("gray.400", "gray.500");

  return (
    <Flex justify="flex-end" py={4} w="full">
      <Box maxW={{ base: "92%", md: "72%" }}>
        {message.created_at && (
          <Text fontSize="10px" color={muted} textAlign="left" mb={1.5} letterSpacing="0.02em">
            {formatTime(message.created_at)}
          </Text>
        )}
        <Box bg={bubbleBg} color="white" borderRadius="2xl" borderBottomLeftRadius="md" px={4} py={3}>
          <Text fontSize="sm" lineHeight="1.8" whiteSpace="pre-wrap" wordBreak="break-word">
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
  const markBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const markColor = useColorModeValue("#0E4C92", "blue.200");
  const rule = useColorModeValue("gray.100", "whiteAlpha.100");

  return (
    <Box py={{ base: 5, md: 6 }} w="full" borderTopWidth="1px" borderColor={rule}>
      <HStack spacing={3} align="center" mb={4}>
        <Flex boxSize={8} borderRadius="lg" bg={markBg} align="center" justify="center" flexShrink={0}>
          <Icon as={FaChartLine} boxSize={3.5} color={markColor} />
        </Flex>
        <Box flex={1} minW={0}>
          <HStack spacing={2} flexWrap="wrap">
            <Text fontSize="sm" fontWeight="700" color={titleColor}>
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
      <Box overflowX="auto">
        <ReportMarkdownContent content={message.message} />
      </Box>
    </Box>
  );
}

function GeneratingBlock() {
  const muted = useColorModeValue("gray.500", "gray.400");
  const markBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const markColor = useColorModeValue("#0E4C92", "blue.200");
  const bar = useColorModeValue("blue.100", "whiteAlpha.200");

  return (
    <Box py={6} w="full">
      <HStack spacing={3} mb={4}>
        <Flex boxSize={8} borderRadius="lg" bg={markBg} align="center" justify="center">
          <Spinner size="sm" color={markColor} thickness="2px" />
        </Flex>
        <Text fontSize="sm" color={muted}>
          جاري قراءة بيانات منصتك...
        </Text>
      </HStack>
      <VStack spacing={2} align="stretch" maxW="sm">
        <Box w="full" h="6px" bg={bar} borderRadius="full" />
        <Box w="78%" h="6px" bg={bar} borderRadius="full" opacity={0.7} />
        <Box w="54%" h="6px" bg={bar} borderRadius="full" opacity={0.45} />
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
}) {
  const inputShellBg = useColorModeValue("white", "gray.800");
  const chipBg = useColorModeValue("white", "gray.800");
  const chipHover = useColorModeValue("blue.50", "whiteAlpha.100");

  return (
    <Box
      flexShrink={0}
      px={{ base: 3, md: 5 }}
      pt={3}
      bg="transparent"
      sx={{ pb: "max(12px, env(safe-area-inset-bottom, 12px))" }}
    >
      <Box maxW="46rem" mx="auto" w="full">
        {quickCommands.length > 0 && (
          <Flex
            gap={2}
            mb={3}
            overflowX="auto"
            sx={{
              "&::-webkit-scrollbar": { display: "none" },
              WebkitOverflowScrolling: "touch",
            }}
          >
            {quickCommands.map((cmd, index) => (
              <Button
                key={`${cmd.label}-${index}`}
                size="sm"
                variant="outline"
                borderColor={borderColor}
                bg={chipBg}
                color={muted}
                borderRadius="full"
                fontWeight="600"
                fontSize="12px"
                flexShrink={0}
                whiteSpace="nowrap"
                h="30px"
                minH="30px"
                px={3}
                cursor="pointer"
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
          borderRadius="2xl"
          borderWidth="1px"
          borderColor={borderColor}
          bg={inputShellBg}
          overflow="hidden"
          _focusWithin={{
            borderColor: "blue.400",
            boxShadow: "0 0 0 3px rgba(49, 130, 206, 0.12)",
          }}
        >
          <Flex align="flex-end" gap={2} py={2} px={2} pe={2}>
            <Textarea
              ref={inputRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="اطلب تقريراً عن طالب، كورس، أو أداء المنصة..."
              rows={1}
              minH="44px"
              maxH="140px"
              resize="none"
              maxLength={MESSAGE_LIMIT}
              isDisabled={sending}
              border="none"
              bg="transparent"
              _focus={{ boxShadow: "none" }}
              fontSize="sm"
              lineHeight="1.7"
              flex={1}
              py={2.5}
              px={3}
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
              icon={<Icon as={FaPaperPlane} boxSize={3.5} />}
              bg="#0E4C92"
              color="white"
              borderRadius="xl"
              size="md"
              mb={0.5}
              flexShrink={0}
              cursor="pointer"
              isLoading={sending}
              isDisabled={!messageText.trim() || sending}
              _hover={{ bg: "#0A3A70" }}
            />
          </Flex>
        </Box>

        <Flex justify="space-between" align="center" mt={2} px={1} fontSize="10px" color={muted}>
          <Text display={{ base: "none", md: "block" }}>Enter للإرسال · Shift+Enter لسطر جديد</Text>
          <Text ms="auto">
            {messageText.length}/{MESSAGE_LIMIT}
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}

function GuidePanel({ botInfo, onExampleClick, sending }) {
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.800", "gray.100");
  const rowHover = useColorModeValue("blue.50", "whiteAlpha.100");
  const dot = useColorModeValue("#3182CE", "blue.300");

  return (
    <VStack align="stretch" spacing={8}>
      {(botInfo?.capabilities || []).length > 0 && (
        <Box>
          <Text
            fontSize="11px"
            fontWeight="800"
            color={muted}
            mb={4}
            letterSpacing="0.08em"
          >
            ماذا يمكنه أن يفعل
          </Text>
          <VStack align="stretch" spacing={3.5}>
            {(botInfo?.capabilities || []).map((cap) => (
              <HStack key={cap} align="flex-start" spacing={3}>
                <Box mt="7px" boxSize="6px" borderRadius="full" bg={dot} flexShrink={0} />
                <Text fontSize="sm" lineHeight="1.8" color={titleColor}>
                  {cap}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}

      {Array.isArray(botInfo?.examples) && botInfo.examples.length > 0 && (
        <Box>
          <Text
            fontSize="11px"
            fontWeight="800"
            color={muted}
            mb={3}
            letterSpacing="0.08em"
          >
            ابدأ من هنا
          </Text>
          <VStack align="stretch" spacing={1}>
            {botInfo.examples.map((example) => (
              <Button
                key={example}
                size="sm"
                variant="ghost"
                justifyContent="flex-start"
                h="auto"
                py={2.5}
                px={2}
                borderRadius="lg"
                fontWeight="500"
                fontSize="sm"
                whiteSpace="normal"
                textAlign="right"
                color={titleColor}
                onClick={() => onExampleClick(example)}
                isDisabled={sending}
                cursor="pointer"
                _hover={{ bg: rowHover, color: "blue.600" }}
              >
                {example}
              </Button>
            ))}
          </VStack>
        </Box>
      )}

      <Text fontSize="xs" lineHeight="1.9" color={muted}>
        التحليل يعتمد على بيانات منصتك فقط. إذا ظهرت قائمة طلاب، أرسل كود الطالب في رسالة جديدة.
      </Text>
    </VStack>
  );
}

function EmptyState({ welcomeMessage, onExampleClick, examples, sending }) {
  const muted = useColorModeValue("gray.500", "gray.400");
  const titleColor = useColorModeValue("gray.900", "white");
  const iconBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const iconColor = useColorModeValue("#0E4C92", "blue.200");
  const rowBg = useColorModeValue("white", "gray.800");
  const rowBorder = useColorModeValue("gray.200", "gray.700");
  const rowHover = useColorModeValue("blue.50", "whiteAlpha.100");

  return (
    <Flex flex={1} align="center" justify="center" minH="full" px={4} py={10}>
      <VStack spacing={7} maxW="440px" textAlign="center" w="full">
        <Flex boxSize={14} borderRadius="2xl" bg={iconBg} align="center" justify="center">
          <Icon as={FaChartLine} boxSize={6} color={iconColor} />
        </Flex>
        <Box>
          <Heading
            as="h1"
            fontSize={{ base: "xl", md: "2xl" }}
            color={titleColor}
            mb={3}
            fontWeight="800"
            letterSpacing="-0.02em"
            lineHeight="1.35"
          >
            نظرة أوضح على منصتك
          </Heading>
          <Text fontSize="sm" color={muted} lineHeight="1.9">
            {welcomeMessage || "اطلب تقريراً هادئاً ومباشراً عن طالب، كورس، أو أداء المنصة ككل."}
          </Text>
        </Box>
        {examples?.length > 0 && (
          <VStack w="full" spacing={2} align="stretch">
            {examples.slice(0, 3).map((example) => (
              <Button
                key={example}
                variant="outline"
                borderColor={rowBorder}
                bg={rowBg}
                borderRadius="xl"
                fontWeight="500"
                fontSize="sm"
                h="auto"
                py={3.5}
                px={4}
                whiteSpace="normal"
                color={titleColor}
                cursor="pointer"
                onClick={() => onExampleClick(example)}
                isDisabled={sending}
                _hover={{ borderColor: "blue.300", bg: rowHover }}
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

  const pageBg = useColorModeValue("#F7F8FA", "gray.900");
  const chatBg = useColorModeValue("#F7F8FA", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const toolbarBg = useColorModeValue("rgba(247,248,250,0.92)", "rgba(26,32,44,0.92)");
  const headerIconBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const headerIconColor = useColorModeValue("#0E4C92", "blue.200");
  const asideBg = useColorModeValue("white", "gray.800");

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
        px={{ base: 4, md: 6 }}
        py={3}
        minH="60px"
        align="center"
        justify="space-between"
        gap={3}
        borderBottomWidth="1px"
        borderColor={borderColor}
        flexShrink={0}
        bg={toolbarBg}
        style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
      >
        <HStack spacing={3} minW={0} flex={1}>
          <Flex
            boxSize={10}
            borderRadius="xl"
            bg={headerIconBg}
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Icon as={FaChartLine} color={headerIconColor} boxSize={4} />
          </Flex>
          <Box minW={0}>
            <Text fontSize="11px" fontWeight="700" color={muted} mb={0.5}>
              تحليلات المنصة
            </Text>
            <Heading size="sm" fontWeight="800" noOfLines={1} letterSpacing="-0.02em">
              {botInfo?.name || "محلل البيانات"}
            </Heading>
          </Box>
        </HStack>
        <HStack spacing={1} flexShrink={0}>
          <IconButton
            aria-label="دليل الاستخدام"
            icon={<FaInfoCircle />}
            size="sm"
            variant="ghost"
            borderRadius="lg"
            cursor="pointer"
            display={{ base: "inline-flex", lg: "none" }}
            onClick={openGuide}
          />
          <IconButton
            aria-label="تحديث المحادثة"
            icon={<FaSync />}
            size="sm"
            variant="ghost"
            borderRadius="lg"
            cursor="pointer"
            onClick={refreshChat}
            isLoading={messagesLoading}
          />
        </HStack>
      </Flex>

      <Flex flex={1} minH={0} overflow="hidden">
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
              <Center py={4} flexShrink={0}>
                <Button
                  size="sm"
                  variant="ghost"
                  color={muted}
                  fontWeight="600"
                  leftIcon={<FaArrowUp />}
                  onClick={loadOlderMessages}
                  isLoading={loadingOlder}
                  cursor="pointer"
                >
                  رسائل أقدم
                </Button>
              </Center>
            )}

            {messagesLoading ? (
              <Flex flex={1} align="center" justify="center" minH="240px">
                <VStack spacing={3}>
                  <Spinner color="blue.500" size="md" thickness="2px" />
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
                <Box maxW="46rem" mx="auto" w="full" px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
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
          />
        </Flex>

        <Box
          w="300px"
          flexShrink={0}
          borderRightWidth="1px"
          borderColor={borderColor}
          bg={asideBg}
          px={6}
          py={7}
          overflowY="auto"
          display={{ base: "none", lg: "block" }}
          sx={{ overscrollBehavior: "contain" }}
        >
          <GuidePanel botInfo={botInfo} onExampleClick={sendMessage} sending={sending} />
        </Box>
      </Flex>

      <Drawer isOpen={guideOpen} placement="right" onClose={closeGuide} size="sm">
        <DrawerOverlay bg="blackAlpha.500" />
        <DrawerContent maxH="100dvh">
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" fontSize="md" fontWeight="800">
            دليل الاستخدام
          </DrawerHeader>
          <DrawerBody py={6} overflowY="auto">
            <GuidePanel
              botInfo={botInfo}
              onExampleClick={(ex) => {
                sendMessage(ex);
                closeGuide();
              }}
              sending={sending}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default TeacherAnalyticsIntelligence;
