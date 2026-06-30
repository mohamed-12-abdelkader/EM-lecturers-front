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
  Container,
  Divider,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import {
  FaPaperPlane,
  FaChartLine,
  FaArrowUp,
  FaSync,
  FaUser,
  FaBook,
  FaListUl,
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
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const avatarBg = useColorModeValue("gray.100", "gray.700");

  return (
    <Box py={4}>
      <Flex gap={3} align="start">
        <Flex boxSize={9} borderRadius="full" bg={avatarBg} align="center" justify="center" flexShrink={0}>
          <Icon as={FaUser} boxSize={3.5} color="gray.500" />
        </Flex>
        <Box flex={1} minW={0}>
          <HStack spacing={2} mb={1.5}>
            <Text fontSize="xs" fontWeight="semibold" color={textColor}>
              أنت
            </Text>
            {message.created_at && (
              <Text fontSize="xs" color={labelColor}>
                {formatTime(message.created_at)}
              </Text>
            )}
          </HStack>
          <Text fontSize="sm" lineHeight="1.8" color={textColor} whiteSpace="pre-wrap">
            {message.message}
          </Text>
        </Box>
      </Flex>
      <Divider mt={4} borderColor={borderColor} />
    </Box>
  );
}

function ReportBlock({ message }) {
  const shellBorder = useColorModeValue("gray.200", "gray.600");
  const headerBg = useColorModeValue("gray.50", "gray.900");
  const bodyBg = useColorModeValue("white", "gray.800");
  const titleColor = useColorModeValue("gray.800", "gray.100");
  const muted = useColorModeValue("gray.500", "gray.400");
  const iconShellBg = useColorModeValue("white", "gray.700");

  return (
    <Box mb={6}>
      <Box
        borderWidth="1px"
        borderColor={shellBorder}
        borderRadius="lg"
        overflow="hidden"
        bg={bodyBg}
      >
        <Flex
          px={4}
          py={3}
          bg={headerBg}
          borderBottomWidth="1px"
          borderColor={shellBorder}
          align="center"
          justify="space-between"
          gap={3}
          flexWrap="wrap"
        >
          <HStack spacing={2} minW={0}>
            <Flex boxSize={8} borderRadius="md" bg={iconShellBg} borderWidth="1px" borderColor={shellBorder} align="center" justify="center">
              <Icon as={FaChartLine} boxSize={3.5} color="blue.500" />
            </Flex>
            <Box minW={0}>
              <Text fontSize="sm" fontWeight="semibold" color={titleColor}>
                نتيجة التحليل
              </Text>
              <HStack spacing={2} mt={0.5}>
                <ReportTypeBadge reportType={message.report_type} />
              </HStack>
            </Box>
          </HStack>
          {message.created_at && (
            <Text fontSize="xs" color={muted} flexShrink={0}>
              {formatTime(message.created_at)}
            </Text>
          )}
        </Flex>
        <Box px={{ base: 4, md: 5 }} py={4}>
          <ReportMarkdownContent content={message.message} />
        </Box>
      </Box>
    </Box>
  );
}

function GeneratingBlock() {
  const shellBorder = useColorModeValue("gray.200", "gray.600");
  const headerBg = useColorModeValue("gray.50", "gray.900");
  const muted = useColorModeValue("gray.600", "gray.400");
  const skeletonBg = useColorModeValue("gray.100", "gray.700");

  return (
    <Box mb={6}>
      <Box borderWidth="1px" borderColor={shellBorder} borderRadius="lg" overflow="hidden">
        <Flex px={4} py={3} bg={headerBg} borderBottomWidth="1px" borderColor={shellBorder} align="center" gap={2}>
          <Spinner size="sm" color="blue.500" />
          <Text fontSize="sm" color={muted}>
            جاري تحليل البيانات وإعداد التقرير...
          </Text>
        </Flex>
        <Box px={4} py={8}>
          <VStack spacing={2}>
            <Box w="full" h="2" bg={skeletonBg} borderRadius="full" />
            <Box w="80%" h="2" bg={skeletonBg} borderRadius="full" alignSelf="flex-start" />
            <Box w="60%" h="2" bg={skeletonBg} borderRadius="full" alignSelf="flex-start" />
          </VStack>
        </Box>
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
  const iconBg = useColorModeValue("gray.100", "gray.700");

  return (
    <Center py={{ base: 8, md: 12 }} px={4}>
      <VStack spacing={5} maxW="480px" textAlign="center">
        <Flex boxSize={14} borderRadius="xl" bg={iconBg} align="center" justify="center">
          <Icon as={FaChartLine} boxSize={6} color="blue.500" />
        </Flex>
        <Box>
          <Heading size="sm" color={titleColor} mb={2}>
            ابدأ بطلب تقرير
          </Heading>
          <Text fontSize="sm" color={muted} lineHeight="1.8">
            {welcomeMessage || "اطلب تقريراً عن طالب أو كورس أو نظرة عامة على منصتك."}
          </Text>
        </Box>
        {examples?.length > 0 && (
          <VStack w="full" spacing={2} align="stretch">
            {examples.slice(0, 3).map((example) => (
              <Button
                key={example}
                size="sm"
                variant="outline"
                borderColor={borderColor}
                borderRadius="md"
                fontWeight="normal"
                fontSize="xs"
                h="auto"
                py={2.5}
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
    </Center>
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

  const pageBg = useColorModeValue("gray.100", "gray.900");
  const shellBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const toolbarBg = useColorModeValue("gray.50", "gray.900");
  const inputBg = useColorModeValue("white", "gray.800");

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
    <Box minH="100vh" bg={pageBg} pt={{ base: "72px", md: "88px" }} pb={6} dir="rtl">
      <Container maxW="container.xl" h={{ base: "auto", lg: "calc(100vh - 120px)" }}>
        <Flex
          direction="column"
          bg={shellBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="xl"
          overflow="hidden"
          h={{ base: "calc(100dvh - 100px)", lg: "full" }}
          boxShadow="sm"
        >
          {/* شريط علوي */}
          <Flex
            px={{ base: 4, md: 6 }}
            py={4}
            align="center"
            justify="space-between"
            gap={3}
            borderBottomWidth="1px"
            borderColor={borderColor}
            flexShrink={0}
          >
            <HStack spacing={3} minW={0}>
              <Flex boxSize={10} borderRadius="lg" bg={toolbarBg} borderWidth="1px" borderColor={borderColor} align="center" justify="center" flexShrink={0}>
                <Icon as={FaChartLine} color="blue.500" boxSize={4} />
              </Flex>
              <Box minW={0}>
                <Heading size="sm" fontWeight="semibold" noOfLines={1}>
                  {botInfo?.name || "محلل البيانات"}
                </Heading>
                <Text fontSize="xs" color={muted} noOfLines={1}>
                  تقارير وإحصائيات من بيانات المنصة
                </Text>
              </Box>
            </HStack>
            <HStack spacing={2} flexShrink={0}>
              <Button
                size="sm"
                variant="outline"
                borderColor={borderColor}
                display={{ base: "inline-flex", lg: "none" }}
                onClick={openGuide}
              >
                الدليل
              </Button>
              <Button
                size="sm"
                variant="outline"
                borderColor={borderColor}
                leftIcon={<FaSync />}
                onClick={refreshChat}
                isLoading={messagesLoading}
              >
                تحديث
              </Button>
            </HStack>
          </Flex>

          <Flex flex={1} minH={0}>
            {/* المحتوى الرئيسي */}
            <Flex direction="column" flex={1} minW={0}>
              {quickCommands.length > 0 && (
                <Box px={{ base: 4, md: 6 }} py={3} bg={toolbarBg} borderBottomWidth="1px" borderColor={borderColor} flexShrink={0}>
                  <Text fontSize="xs" color={muted} mb={2} fontWeight="medium">
                    طلبات سريعة
                  </Text>
                  <Flex gap={2} overflowX="auto" pb={1} sx={{ "&::-webkit-scrollbar": { height: "4px" } }}>
                    {quickCommands.map((cmd, index) => (
                      <Button
                        key={`${cmd.label}-${index}`}
                        size="xs"
                        variant="outline"
                        borderColor={borderColor}
                        bg={shellBg}
                        borderRadius="md"
                        fontWeight="normal"
                        flexShrink={0}
                        onClick={() => handleQuickCommand(cmd)}
                        isDisabled={sending}
                        _hover={{ borderColor: "blue.300", color: "blue.600" }}
                      >
                        {cmd.label}
                      </Button>
                    ))}
                  </Flex>
                </Box>
              )}

              <Box flex={1} overflowY="auto" px={{ base: 4, md: 6 }}>
                {hasOlderMessages && (
                  <Center py={4}>
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
                  <Center minH="280px">
                    <VStack spacing={3}>
                      <Spinner color="blue.500" />
                      <Text fontSize="sm" color={muted}>
                        جاري تحميل السجل...
                      </Text>
                    </VStack>
                  </Center>
                ) : showEmpty ? (
                  <EmptyState
                    welcomeMessage={botInfo?.welcome_message}
                    examples={botInfo?.examples}
                    onExampleClick={sendMessage}
                    sending={sending}
                  />
                ) : (
                  <Box maxW="820px" mx="auto" w="full" py={2}>
                    {messages.map((msg) =>
                      msg.role === "teacher" ? (
                        <UserRequestBlock key={msg.id} message={msg} />
                      ) : (
                        <ReportBlock key={msg.id} message={msg} />
                      ),
                    )}
                    {sending && <GeneratingBlock />}
                    <Box ref={messagesEndRef} h={1} />
                  </Box>
                )}
              </Box>

              <Box
                as="form"
                onSubmit={handleSubmit}
                px={{ base: 4, md: 6 }}
                py={4}
                borderTopWidth="1px"
                borderColor={borderColor}
                bg={toolbarBg}
                flexShrink={0}
              >
                <Box maxW="820px" mx="auto" w="full">
                  <Flex
                    bg={inputBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="lg"
                    overflow="hidden"
                    align="stretch"
                    _focusWithin={{ borderColor: "blue.400", boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)" }}
                  >
                    <Textarea
                      ref={inputRef}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="اكتب طلب التقرير..."
                      rows={2}
                      resize="none"
                      maxLength={MESSAGE_LIMIT}
                      isDisabled={sending}
                      border="none"
                      bg="transparent"
                      _focus={{ boxShadow: "none" }}
                      fontSize="sm"
                      lineHeight="1.75"
                      flex={1}
                      px={4}
                      py={3}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      colorScheme="blue"
                      borderRadius="0"
                      px={6}
                      leftIcon={<FaPaperPlane />}
                      isLoading={sending}
                      isDisabled={!messageText.trim() || sending}
                      alignSelf="stretch"
                    >
                      إرسال
                    </Button>
                  </Flex>
                  <Flex justify="space-between" mt={2} fontSize="xs" color={muted}>
                    <Text>Enter للإرسال</Text>
                    <Text>{messageText.length}/{MESSAGE_LIMIT}</Text>
                  </Flex>
                </Box>
              </Box>
            </Flex>

            {/* دليل جانبي — desktop */}
            <Box
              w="300px"
              flexShrink={0}
              borderRightWidth="1px"
              borderColor={borderColor}
              bg={toolbarBg}
              p={5}
              overflowY="auto"
              display={{ base: "none", lg: "block" }}
            >
              <GuidePanel botInfo={botInfo} onExampleClick={sendMessage} sending={sending} />
            </Box>
          </Flex>
        </Flex>
      </Container>

      <Drawer isOpen={guideOpen} placement="right" onClose={closeGuide} size="sm">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">دليل الاستخدام</DrawerHeader>
          <DrawerBody py={5}>
            <GuidePanel botInfo={botInfo} onExampleClick={(ex) => { sendMessage(ex); closeGuide(); }} sending={sending} compact />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default TeacherAnalyticsIntelligence;
