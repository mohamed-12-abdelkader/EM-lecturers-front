import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Center,
  Collapse,
  Flex,
  HStack,
  Icon,
  IconButton,
  Image,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  SimpleGrid,
  Spacer,
  Spinner,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
  useToast,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
} from "@chakra-ui/react";
import {
  FaCopy,
  FaDownload,
  FaFacebookF,
  FaImage,
  FaInstagram,
  FaPenNib,
  FaPlus,
  FaTimes,
  FaWhatsapp,
} from "react-icons/fa";
import { FiChevronDown, FiClock, FiMenu, FiMessageSquare, FiPlus, FiRefreshCw, FiSend, FiSettings } from "react-icons/fi";
import { SiTiktok } from "react-icons/si";
import { motion } from "framer-motion";
import baseUrl from "../../api/baseUrl";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";

const MotionBox = motion(Box);

const FALLBACK_OPTIONS = {
  platforms: [
    {
      value: "facebook",
      label_ar: "فيسبوك",
      description_ar: "منشور واضح مناسب للنسخ والنشر على صفحة المدرس أو جروب الطلاب.",
    },
    {
      value: "instagram",
      label_ar: "إنستجرام",
      description_ar: "نص قصير وجذاب مناسب للكابشن مع هاشتاجات قليلة.",
    },
    {
      value: "whatsapp",
      label_ar: "واتساب",
      description_ar: "رسالة مختصرة ومباشرة تصلح للإرسال في الجروبات.",
    },
    {
      value: "tiktok",
      label_ar: "تيك توك",
      description_ar: "نص سريع وحماسي يصلح كفكرة فيديو أو وصف قصير.",
    },
    {
      value: "general",
      label_ar: "عام",
      description_ar: "صياغة عامة يمكن تعديلها لأي منصة.",
    },
  ],
  tones: [
    { value: "friendly", label_ar: "ودود وبسيط" },
    { value: "professional", label_ar: "احترافي" },
    { value: "motivational", label_ar: "تحفيزي" },
    { value: "promotional", label_ar: "تسويقي" },
  ],
  aspect_ratios: [
    { value: "1:1", label_ar: "مربع", description_ar: "مناسب لفيسبوك وإنستجرام." },
    { value: "4:5", label_ar: "بوست رأسي", description_ar: "مناسب لمنشورات إنستجرام وفيسبوك." },
    { value: "9:16", label_ar: "ستوري/ريلز", description_ar: "مناسب للقصص والفيديوهات القصيرة." },
    { value: "16:9", label_ar: "أفقي", description_ar: "مناسب للغلاف أو العرض." },
  ],
  languages: [
    { value: "arabic", label_ar: "عربي", description_ar: "اكتب النصوص داخل التصميم بالعربية." },
    { value: "english", label_ar: "إنجليزي", description_ar: "اكتب النصوص داخل التصميم بالإنجليزية." },
    { value: "mixed", label_ar: "مختلط", description_ar: "استخدم العربية والإنجليزية عند الحاجة." },
  ],
  default_language: "arabic",
  uploads: {
    field_name: "references",
    max_files: 4,
    max_file_size_mb: 8,
    allowed_types: ["image/*"],
  },
};

const PLATFORM_ICONS = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  whatsapp: FaWhatsapp,
  tiktok: SiTiktok,
  general: FiMessageSquare,
};

const EXAMPLE_PROMPTS = [
  {
    label: "أفكار تسويقية",
    text: "اقترح عليّ أفكار تسويقية لكورس فيزياء ثالثة ثانوي على فيسبوك، ونناقش أفضل فكرة قبل التنفيذ.",
  },
  {
    label: "مسودة بوست",
    text: "عايز أفكار بوستات عن مراجعة نهائية في الرياضيات، ورّيني مسودات ونعدّلها سوا قبل ما ننفّذ.",
  },
  {
    label: "فكرة تصميم",
    text: "ناقش معايا فكرة تصميم إعلان لحصة مباشرة، وبعد ما نتفق على الشكل ننفّذ الصورة.",
  },
];

const getItemLabel = (items, value) =>
  items?.find((item) => item.value === value)?.label_ar || value || "غير محدد";

const getErrorMessage = (error) => {
  const data = error?.response?.data;
  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (error?.message) return error.message;
  return "حدث خطأ غير متوقع";
};

const formatDate = (value) => {
  if (!value) return "--";
  try {
    return new Date(value).toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
};

const downloadImage = (url) => {
  if (!url) return;
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.download = `social-design-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const Social = () => {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const referencesRef = useRef([]);
  const token = localStorage.getItem("Authorization") || localStorage.getItem("token");

  const authHeaders = useMemo(() => {
    if (!token) return {};
    return {
      Authorization: /^Bearer\s+/i.test(token) ? token : `Bearer ${token}`,
    };
  }, [token]);

  const [options, setOptions] = useState(FALLBACK_OPTIONS);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [mode, setMode] = useState("post");
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState("facebook");
  const [tone, setTone] = useState("professional");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [languageMode, setLanguageMode] = useState("arabic");
  const [editLastDesign, setEditLastDesign] = useState(false);
  const [references, setReferences] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [actions, setActions] = useState({
    can_execute: false,
    can_generate_post: false,
    can_generate_image: false,
  });
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);

  const pageBg = useColorModeValue("#f7f7f8", "gray.900");
  const panelBg = useColorModeValue("gray.50", "gray.750");
  const sidebarBg = useColorModeValue("#f0f0f0", "gray.900");
  const sidebarBorder = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const subtle = useColorModeValue("gray.500", "gray.500");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const ink = useColorModeValue("gray.900", "gray.100");
  const inputBg = useColorModeValue("white", "gray.800");
  const chipBg = useColorModeValue("gray.100", "gray.700");
  const composerShellBg = useColorModeValue("white", "gray.800");
  const composerBorder = useColorModeValue("gray.300", "gray.600");
  const showWelcome = messages.length === 0 && !submitting && !executing;

  const uploadLimit = options.uploads || FALLBACK_OPTIONS.uploads;
  const promptLength = prompt.trim().length;
  const canSubmit = promptLength > 0 && promptLength <= 4000 && !submitting && !executing;
  const welcomeText =
    options?.chat_mode?.welcome_message ||
    "نتناقش في أفكار تسويقية ومسودات بوستات قبل التنفيذ. لما توافق قول نفّذ أو اضغط زر التنفيذ.";

  const loadOptions = async () => {
    try {
      setOptionsLoading(true);
      const { data } = await baseUrl.get("/api/teacher/creative-chatbot/options", {
        headers: authHeaders,
      });
      setOptions({ ...FALLBACK_OPTIONS, ...data });
      if (data?.default_language) {
        setLanguageMode(data.default_language);
      }
    } catch {
      setOptions(FALLBACK_OPTIONS);
    } finally {
      setOptionsLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const { data } = await baseUrl.get(
        "/api/teacher/creative-chatbot/history?limit=14&offset=0",
        { headers: authHeaders },
      );
      setHistory(data?.generations || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
    loadHistory();
  }, [authHeaders]);

  useEffect(() => {
    referencesRef.current = references;
  }, [references]);

  useEffect(() => {
    return () => {
      referencesRef.current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, submitting, executing]);

  const appendAssistantFromResponse = (data) => {
    if (data?.session_id) setSessionId(data.session_id);
    if (data?.actions) setActions(data.actions);
    setMessages((prev) => [
      ...prev,
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        message: data?.reply || "",
        ideas: data?.ideas || [],
        draft_post: data?.draft_post || null,
        image_concept: data?.image_concept || null,
        ready_to_execute: Boolean(data?.ready_to_execute),
        executed: Boolean(data?.executed),
        generation: data?.generation || null,
        post_text: data?.post_text || data?.generation?.generated_text || null,
        image_url: data?.image_url || data?.generation?.generated_image_url || null,
        suggested_action: data?.suggested_action || "none",
      },
    ]);
    if (data?.generation?.id) {
      setActiveHistoryId(data.generation.id);
      loadHistory();
    }
  };

  const handlePickReferences = () => {
    fileInputRef.current?.click();
  };

  const handleReferenceChange = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    const maxFiles = uploadLimit.max_files || 4;
    const maxFileSize = (uploadLimit.max_file_size_mb || 8) * 1024 * 1024;
    const availableSlots = Math.max(0, maxFiles - references.length);

    if (files.length > availableSlots) {
      toast({
        title: `يمكن رفع ${maxFiles} صور كحد أقصى`,
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
    }

    const accepted = [];
    for (const file of files.slice(0, availableSlots)) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "نوع ملف غير مدعوم",
          description: "ارفع صور فقط كمرجع للتصميم.",
          status: "error",
          duration: 2500,
          isClosable: true,
        });
        continue;
      }

      if (file.size > maxFileSize) {
        toast({
          title: "حجم الصورة كبير",
          description: `الحد الأقصى ${uploadLimit.max_file_size_mb || 8} ميجابايت لكل صورة.`,
          status: "error",
          duration: 2500,
          isClosable: true,
        });
        continue;
      }

      accepted.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setReferences((prev) => [...prev, ...accepted].slice(0, maxFiles));
  };

  const removeReference = (index) => {
    setReferences((prev) => {
      const target = prev[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const clearReferences = () => {
    setReferences((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      return [];
    });
  };

  const handleCopy = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "تم نسخ النص",
        status: "success",
        duration: 1800,
        isClosable: true,
      });
    } catch {
      toast({
        title: "تعذر النسخ تلقائياً",
        status: "error",
        duration: 2200,
        isClosable: true,
      });
    }
  };

  const handleSend = async () => {
    const cleanPrompt = prompt.trim();

    if (!cleanPrompt) {
      toast({
        title: "اكتب رسالتك أولاً",
        status: "warning",
        duration: 2200,
        isClosable: true,
      });
      return;
    }

    if (promptLength > 4000) {
      toast({
        title: "الطلب أطول من المسموح",
        description: "الحد الأقصى 4000 حرف.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      message: cleanPrompt,
      mode,
      platform,
      tone,
      aspectRatio,
      languageMode,
      referencePreviews: references.map((item) => item.previewUrl),
    };

    try {
      setSubmitting(true);
      setMessages((prev) => [...prev, userMessage]);
      setPrompt("");

      const form = new FormData();
      form.append("message", cleanPrompt);
      if (sessionId) form.append("session_id", String(sessionId));
      form.append("preferred_output", mode);
      form.append("platform", platform);
      form.append("tone", tone);
      form.append("aspect_ratio", aspectRatio);
      form.append("language_mode", languageMode);
      if (editLastDesign) form.append("edit_last_design", "true");
      references.forEach((item) => form.append("references", item.file));

      const { data } = await baseUrl.post("/api/teacher/creative-chatbot/chat", form, {
        headers: authHeaders,
      });
      appendAssistantFromResponse(data);
      clearReferences();
    } catch (error) {
      toast({
        title: "تعذر إرسال الرسالة",
        description: getErrorMessage(error),
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecute = async (requestType) => {
    if (!sessionId) {
      toast({
        title: "ابدأ المحادثة أولاً",
        status: "warning",
        duration: 2200,
        isClosable: true,
      });
      return;
    }

    try {
      setExecuting(true);
      const form = new FormData();
      form.append("session_id", String(sessionId));
      form.append("request_type", requestType || mode);
      if (editLastDesign) form.append("edit_last_design", "true");
      references.forEach((item) => form.append("references", item.file));

      const { data } = await baseUrl.post("/api/teacher/creative-chatbot/chat/execute", form, {
        headers: authHeaders,
      });
      appendAssistantFromResponse(data);
      clearReferences();
      toast({
        title: "تم التنفيذ بنجاح",
        status: "success",
        duration: 2200,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "تعذر التنفيذ",
        description: getErrorMessage(error),
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setExecuting(false);
    }
  };

  const applyHistoryItem = (item) => {
    setIsMobileHistoryOpen(false);
    setActiveHistoryId(item.id);
    setMessages([
      {
        id: `user-history-${item.id}`,
        role: "user",
        message: item.prompt,
        mode: item.request_type,
        platform: item.platform || "general",
        tone: item.tone || "professional",
        aspectRatio: item.aspect_ratio || "1:1",
        languageMode: item.language_mode || options.default_language || "arabic",
      },
      {
        id: `assistant-history-${item.id}`,
        role: "assistant",
        message:
          item.request_type === "image"
            ? "هذا تصميم سابق من المحفوظات."
            : "هذا منشور سابق من المحفوظات.",
        executed: true,
        generation: item,
        post_text: item.generated_text,
        image_url: item.generated_image_url,
        ideas: [],
      },
    ]);
  };

  const startNewSession = async () => {
    setPrompt("");
    setMessages([]);
    setActions({
      can_execute: false,
      can_generate_post: false,
      can_generate_image: false,
    });
    setActiveHistoryId(null);
    setSubmitting(false);
    setExecuting(false);
    clearReferences();
    setEditLastDesign(false);
    setIsMobileHistoryOpen(false);
    try {
      const { data } = await baseUrl.post(
        "/api/teacher/creative-chatbot/chat/new",
        {
          preferred_output: mode,
          platform,
          tone,
          aspect_ratio: aspectRatio,
          language_mode: languageMode,
        },
        { headers: authHeaders },
      );
      setSessionId(data?.session_id || null);
    } catch {
      setSessionId(null);
    }
  };

  const sidebarProps = {
    history,
    loading: historyLoading,
    onRefresh: loadHistory,
    onSelect: applyHistoryItem,
    onNewSession: startNewSession,
    platformOptions: options.platforms,
    activeId: activeHistoryId,
    sidebarBg,
    sidebarBorder,
    muted,
    ink,
    panelBg,
    borderColor,
  };

  return (
    <Box
      h={{ base: "calc(100dvh - 60px)", md: "calc(100dvh - 72px)" }}
      maxH={{ base: "calc(100dvh - 60px)", md: "calc(100dvh - 72px)" }}
      display="flex"
      flexDirection="column"
      bg={pageBg}
      dir="rtl"
      overflow="hidden"
    >
      <Flex flex={1} minH={0} overflow="hidden">
        {/* Sidebar — يمين في RTL */}
        <Box
          display={{ base: "none", lg: "flex" }}
          w="280px"
          flexShrink={0}
          h="full"
          minH={0}
          borderLeftWidth="1px"
          borderColor={sidebarBorder}
        >
          <ChatSidebar {...sidebarProps} fullHeight />
        </Box>

        {/* Main chat */}
        <Flex flex={1} direction="column" minW={0} minH={0} bg={composerShellBg}>
          <Flex
            align="center"
            justify="space-between"
            px={{ base: 3, md: 4 }}
            py={2}
            minH="52px"
            borderBottomWidth="1px"
            borderColor={borderColor}
            bg={composerShellBg}
            flexShrink={0}
          >
            <HStack spacing={2} minW={0}>
              <IconButton
                aria-label="فتح المحفوظات"
                icon={<FiMenu />}
                variant="ghost"
                size="sm"
                display={{ base: "inline-flex", lg: "none" }}
                onClick={() => setIsMobileHistoryOpen(true)}
              />
              <Box minW={0}>
                <Text fontWeight="semibold" fontSize="sm" color={ink} noOfLines={1}>
                  مساعد السوشيال ميديا
                </Text>
                <Text fontSize="xs" color={muted} noOfLines={1}>
                  نقاش أولاً · {getItemLabel(options.platforms, platform)} ·{" "}
                  {mode === "post" ? "منشور نصي" : "تصميم صورة"}
                </Text>
              </Box>
            </HStack>
            <HStack spacing={2} flexShrink={0}>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<FiPlus />}
                borderRadius="lg"
                display={{ base: "none", sm: "inline-flex" }}
                onClick={startNewSession}
              >
                محادثة جديدة
              </Button>
              <IconButton
                aria-label="محادثة جديدة"
                icon={<FiPlus />}
                size="sm"
                variant="outline"
                borderRadius="lg"
                display={{ base: "inline-flex", sm: "none" }}
                onClick={startNewSession}
              />
            </HStack>
          </Flex>

          <Box
            flex={1}
            minH={0}
            overflowY="auto"
            overflowX="hidden"
            display="flex"
            flexDirection="column"
            sx={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
          >
            <Box flex={1} w="full" maxW="48rem" mx="auto">
              {showWelcome && (
                <AssistantWelcome muted={muted} ink={ink} welcomeText={welcomeText} />
              )}

              {messages.map((item) =>
                item.role === "user" ? (
                  <UserMessage
                    key={item.id}
                    request={{
                      prompt: item.message,
                      mode: item.mode || mode,
                      platform: item.platform || platform,
                      tone: item.tone || tone,
                      aspectRatio: item.aspectRatio || aspectRatio,
                      languageMode: item.languageMode || languageMode,
                      referencePreviews: item.referencePreviews || [],
                    }}
                    platformLabel={getItemLabel(options.platforms, item.platform || platform)}
                    toneLabel={getItemLabel(options.tones, item.tone || tone)}
                    aspectLabel={getItemLabel(options.aspect_ratios, item.aspectRatio || aspectRatio)}
                    languageLabel={getItemLabel(
                      options.languages,
                      item.languageMode || languageMode,
                    )}
                  />
                ) : (
                  <AssistantChatMessage
                    key={item.id}
                    item={item}
                    muted={muted}
                    ink={ink}
                    borderColor={borderColor}
                    panelBg={panelBg}
                    onCopy={handleCopy}
                    onDownload={downloadImage}
                    onExecute={handleExecute}
                    actions={actions}
                    executing={executing}
                    platformLabel={getItemLabel(
                      options.platforms,
                      item.generation?.platform || platform,
                    )}
                    toneLabel={getItemLabel(options.tones, item.generation?.tone || tone)}
                    aspectLabel={getItemLabel(
                      options.aspect_ratios,
                      item.generation?.aspect_ratio || aspectRatio,
                    )}
                    languageLabel={getItemLabel(
                      options.languages,
                      item.generation?.language_mode || languageMode,
                    )}
                  />
                ),
              )}

              {(submitting || executing) && (
                <AssistantLoading
                  mode={executing ? mode : "chat"}
                  muted={muted}
                  borderColor={borderColor}
                  panelBg={panelBg}
                />
              )}

              <Box ref={chatEndRef} h={4} />
            </Box>
          </Box>

          <ChatComposer
            mode={mode}
            setMode={setMode}
            prompt={prompt}
            setPrompt={setPrompt}
            promptLength={promptLength}
            platform={platform}
            setPlatform={setPlatform}
            tone={tone}
            setTone={setTone}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            languageMode={languageMode}
            setLanguageMode={setLanguageMode}
            editLastDesign={editLastDesign}
            setEditLastDesign={setEditLastDesign}
            options={options}
            references={references}
            removeReference={removeReference}
            clearReferences={clearReferences}
            handlePickReferences={handlePickReferences}
            fileInputRef={fileInputRef}
            handleReferenceChange={handleReferenceChange}
            canSubmit={canSubmit}
            submitting={submitting || executing}
            handleGenerate={handleSend}
            canExecute={actions.can_execute}
            onExecute={() =>
              handleExecute(
                actions.can_generate_image && !actions.can_generate_post
                  ? "image"
                  : actions.can_generate_post && !actions.can_generate_image
                    ? "post"
                    : mode,
              )
            }
            muted={muted}
            subtle={subtle}
            borderColor={borderColor}
            inputBg={inputBg}
            chipBg={chipBg}
            panelBg={panelBg}
            uploadLimit={uploadLimit}
            composerShellBg={composerShellBg}
            composerBorder={composerBorder}
            showWelcome={showWelcome}
            examples={EXAMPLE_PROMPTS}
            onUsePrompt={setPrompt}
            getItemLabel={getItemLabel}
          />
        </Flex>
      </Flex>

      <Drawer
        isOpen={isMobileHistoryOpen}
        placement="right"
        onClose={() => setIsMobileHistoryOpen(false)}
        size="xs"
      >
        <DrawerOverlay />
        <DrawerContent maxW="min(100vw, 320px)" bg={sidebarBg}>
          <DrawerCloseButton />
          <DrawerHeader fontSize="md" borderBottomWidth="1px" borderColor={sidebarBorder}>
            المحفوظات
          </DrawerHeader>
          <DrawerBody p={0} display="flex" flexDirection="column" overflow="hidden">
            <ChatSidebar {...sidebarProps} embedded />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <ScrollToTop />
    </Box>
  );
};

const ChatSidebar = ({
  history,
  loading,
  onRefresh,
  onSelect,
  onNewSession,
  platformOptions,
  activeId,
  sidebarBg,
  sidebarBorder,
  muted,
  ink,
  panelBg,
  borderColor,
  fullHeight,
  embedded,
}) => (
  <Flex
    direction="column"
    w="full"
    h={fullHeight ? "full" : "auto"}
    bg={sidebarBg}
    overflow="hidden"
  >
    {!embedded ? (
      <Flex
        align="center"
        justify="space-between"
        px={3}
        py={3}
        borderBottomWidth="1px"
        borderColor={sidebarBorder}
        flexShrink={0}
      >
        <HStack spacing={2}>
          <Icon as={FiClock} boxSize={4} color={muted} />
          <Text fontSize="sm" fontWeight="semibold" color={ink}>
            المحفوظات
          </Text>
        </HStack>
        <IconButton
          aria-label="تحديث"
          icon={<FiRefreshCw />}
          size="sm"
          variant="ghost"
          borderRadius="md"
          onClick={onRefresh}
          isLoading={loading}
        />
      </Flex>
    ) : (
      <Flex justify="flex-end" px={3} pt={2} pb={1} flexShrink={0}>
        <IconButton
          aria-label="تحديث"
          icon={<FiRefreshCw />}
          size="sm"
          variant="ghost"
          borderRadius="md"
          onClick={onRefresh}
          isLoading={loading}
        />
      </Flex>
    )}

    <Box px={3} py={3} flexShrink={0}>
      <Button
        leftIcon={<FiPlus />}
        size="sm"
        w="full"
        variant="outline"
        borderColor={borderColor}
        bg={useColorModeValue("white", "gray.800")}
        borderRadius="lg"
        fontWeight="medium"
        _hover={{ bg: useColorModeValue("gray.50", "gray.700") }}
        onClick={onNewSession}
      >
        محادثة جديدة
      </Button>
    </Box>

    <Box flex={1} minH={0} px={2} pb={3} overflow="hidden">
      <HistoryList
        history={history}
        loading={loading}
        onSelect={onSelect}
        platformOptions={platformOptions}
        muted={muted}
        activeId={activeId}
        sidebarBorder={sidebarBorder}
      />
    </Box>
  </Flex>
);

const HistoryList = ({
  history,
  loading,
  onSelect,
  platformOptions,
  muted,
  activeId,
  sidebarBorder,
}) => {
  if (loading) {
    return (
      <Center py={10} flexDirection="column" gap={3}>
        <Spinner color="gray.400" size="sm" />
        <Text color={muted} fontSize="sm">
          جاري التحميل...
        </Text>
      </Center>
    );
  }

  if (!history.length) {
    return (
      <Center py={10} px={4} textAlign="center">
        <Text color={muted} fontSize="sm" lineHeight="1.7">
          لا توجد توليدات محفوظة بعد.
          <br />
          ابدأ محادثة جديدة لتوليد محتوى.
        </Text>
      </Center>
    );
  }

  return (
    <VStack spacing={0.5} align="stretch" h="full" overflowY="auto" pr={1}>
      {history.map((item) => (
        <HistoryItem
          key={item.id}
          item={item}
          isActive={activeId === item.id}
          platformLabel={getItemLabel(platformOptions, item.platform)}
          onClick={() => onSelect(item)}
          muted={muted}
          sidebarBorder={sidebarBorder}
        />
      ))}
    </VStack>
  );
};

const AssistantWelcome = ({ muted, ink, welcomeText }) => {
  const iconBg = useColorModeValue("green.50", "green.900");

  return (
    <Flex flex={1} align="center" justify="center" minH="full" px={3} py={8} textAlign="center" w="full">
      <VStack spacing={4} maxW="480px">
        <Flex w={14} h={14} borderRadius="2xl" bg={iconBg} color="green.500" align="center" justify="center">
          <Icon as={FiMessageSquare} boxSize={6} />
        </Flex>
        <Box>
          <Text fontSize="lg" fontWeight="semibold" color={ink} lineHeight="1.4" mb={1.5}>
            نتناقش قبل التنفيذ
          </Text>
          <Text color={muted} fontSize="sm" lineHeight="1.75" whiteSpace="pre-wrap">
            {welcomeText ||
              "اقترح أفكار تسويقية ومسودات بوستات، وبعد ما توافق ننفّذ المنشور أو التصميم."}
          </Text>
        </Box>
      </VStack>
    </Flex>
  );
};

const UserMessage = ({ request, platformLabel, toneLabel, aspectLabel, languageLabel }) => {
  const bubbleBg = useColorModeValue("gray.100", "whiteAlpha.100");
  const textColor = useColorModeValue("gray.800", "gray.100");

  return (
    <Flex justify="flex-end" px={{ base: 3, md: 4 }} py={3} w="full">
      <Box maxW={{ base: "100%", md: "82%" }} w="full">
        <Box bg={bubbleBg} borderRadius="2xl" px={4} py={3}>
          <Text whiteSpace="pre-wrap" lineHeight="1.75" fontSize="sm" color={textColor} wordBreak="break-word">
            {request.prompt}
          </Text>
          <HStack mt={2.5} spacing={1.5} wrap="wrap">
            <Badge size="sm" variant="subtle" colorScheme="gray" borderRadius="md" fontSize="10px">
              {request.mode === "post" ? "نص" : "صورة"}
            </Badge>
            <Badge size="sm" variant="subtle" colorScheme="gray" borderRadius="md" fontSize="10px">
              {platformLabel}
            </Badge>
            <Badge size="sm" variant="subtle" colorScheme="gray" borderRadius="md" fontSize="10px">
              {request.mode === "post" ? toneLabel : aspectLabel}
            </Badge>
            {request.mode === "image" && (
              <Badge size="sm" variant="subtle" colorScheme="gray" borderRadius="md" fontSize="10px">
                {languageLabel}
              </Badge>
            )}
          </HStack>
          {request.referencePreviews?.length > 0 && (
            <SimpleGrid columns={{ base: 3, sm: 4 }} spacing={2} mt={3}>
              {request.referencePreviews.map((src, index) => (
                <Image
                  key={`${src}-${index}`}
                  src={src}
                  alt={`ref-${index + 1}`}
                  h="52px"
                  borderRadius="md"
                  objectFit="cover"
                />
              ))}
            </SimpleGrid>
          )}
        </Box>
      </Box>
    </Flex>
  );
};

const AssistantLoading = ({ mode, muted, borderColor, panelBg }) => {
  const assistantIconBg = useColorModeValue("green.500", "green.400");

  return (
    <Box px={{ base: 3, md: 4 }} py={4} w="full">
      <HStack spacing={3} align="start" mb={mode === "image" ? 3 : 0}>
        <Flex boxSize={8} borderRadius="full" bg={assistantIconBg} align="center" justify="center" flexShrink={0}>
          <Spinner size="sm" color="white" thickness="2px" />
        </Flex>
        <Text fontSize="sm" color={muted} pt={1.5}>
          {mode === "image"
            ? "يتم إنشاء التصميم..."
            : mode === "chat"
              ? "بيفكر ويقترح أفكار..."
              : "يتم صياغة المنشور..."}
        </Text>
      </HStack>
      {mode === "image" && <ImageGenerationPreview borderColor={borderColor} panelBg={panelBg} />}
    </Box>
  );
};

const ImageGenerationPreview = ({ borderColor, panelBg }) => (
  <Box
    borderWidth="1px"
    borderColor={borderColor}
    borderRadius="xl"
    overflow="hidden"
    bg={panelBg}
    minH={{ base: "180px", md: "240px" }}
    position="relative"
  >
    <MotionBox
      position="absolute"
      inset={0}
      bg={useColorModeValue("gray.200", "gray.700")}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
    />
  </Box>
);

const AssistantChatMessage = ({
  item,
  muted,
  ink,
  borderColor,
  panelBg,
  onCopy,
  onDownload,
  onExecute,
  actions,
  executing,
  platformLabel,
  toneLabel,
  aspectLabel,
  languageLabel,
}) => {
  const assistantIconBg = useColorModeValue("green.500", "green.400");
  const softBg = useColorModeValue("green.50", "whiteAlpha.100");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const draftText = item.post_text || item.draft_post || "";
  const imageUrl = item.image_url || null;
  const showExecute =
    Boolean(item.ready_to_execute) && Boolean(actions?.can_execute) && !item.executed;

  return (
    <Box px={{ base: 3, md: 4 }} py={4} w="full">
      <HStack spacing={3} align="start" mb={3}>
        <Flex
          boxSize={8}
          borderRadius="full"
          bg={assistantIconBg}
          align="center"
          justify="center"
          flexShrink={0}
        >
          <Icon as={FiMessageSquare} boxSize={3.5} color="white" />
        </Flex>
        <Box flex={1} minW={0}>
          <Text fontSize="sm" fontWeight="semibold" color={ink} mb={1}>
            المساعد
          </Text>
          <Text whiteSpace="pre-wrap" lineHeight="1.85" fontSize="sm" color={textColor}>
            {item.message}
          </Text>
        </Box>
      </HStack>

      {item.ideas?.length > 0 && (
        <Box
          mr={{ base: 0, md: 11 }}
          mb={3}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="xl"
          bg={softBg}
          p={3}
        >
          <Text fontSize="xs" fontWeight="bold" color={muted} mb={2}>
            أفكار مقترحة
          </Text>
          <VStack align="stretch" spacing={2}>
            {item.ideas.map((idea, index) => (
              <Text key={`${item.id}-idea-${index}`} fontSize="sm" color={textColor}>
                {index + 1}. {idea}
              </Text>
            ))}
          </VStack>
        </Box>
      )}

      {item.image_concept && !imageUrl && (
        <Box
          mr={{ base: 0, md: 11 }}
          mb={3}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="xl"
          bg={panelBg}
          p={3}
        >
          <Text fontSize="xs" fontWeight="bold" color={muted} mb={1}>
            فكرة التصميم
          </Text>
          <Text whiteSpace="pre-wrap" fontSize="sm" color={textColor}>
            {item.image_concept}
          </Text>
        </Box>
      )}

      {draftText && !item.executed && (
        <Box
          mr={{ base: 0, md: 11 }}
          mb={3}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="xl"
          bg={panelBg}
          p={3}
        >
          <Flex justify="space-between" align="center" mb={2} gap={2}>
            <Text fontSize="xs" fontWeight="bold" color={muted}>
              مسودة للنقاش
            </Text>
            <Button size="xs" variant="ghost" leftIcon={<FaCopy />} onClick={() => onCopy(draftText)}>
              نسخ
            </Button>
          </Flex>
          <Text whiteSpace="pre-wrap" fontSize="sm" color={textColor} lineHeight="1.8">
            {draftText}
          </Text>
        </Box>
      )}

      {item.executed && (
        <Box mr={{ base: 0, md: 11 }}>
          <AssistantResult
            result={{
              type: imageUrl ? "image" : "post",
              generation: item.generation,
            }}
            text={draftText}
            imageUrl={imageUrl}
            muted={muted}
            borderColor={borderColor}
            panelBg={panelBg}
            onCopy={onCopy}
            onDownload={onDownload}
            platformLabel={platformLabel}
            toneLabel={toneLabel}
            aspectLabel={aspectLabel}
            languageLabel={languageLabel}
          />
        </Box>
      )}

      {showExecute && (
        <HStack mr={{ base: 0, md: 11 }} mt={2} spacing={2} flexWrap="wrap">
          {actions.can_generate_post && (
            <Button
              size="sm"
              colorScheme="green"
              borderRadius="lg"
              isLoading={executing}
              onClick={() => onExecute("post")}
            >
              نفّذ المنشور
            </Button>
          )}
          {actions.can_generate_image && (
            <Button
              size="sm"
              colorScheme="teal"
              borderRadius="lg"
              isLoading={executing}
              onClick={() => onExecute("image")}
            >
              نفّذ التصميم
            </Button>
          )}
        </HStack>
      )}
    </Box>
  );
};

const AssistantResult = ({
  result,
  text,
  imageUrl,
  muted,
  borderColor,
  panelBg,
  onCopy,
  onDownload,
  platformLabel,
  toneLabel,
  aspectLabel,
  languageLabel,
}) => {
  const assistantIconBg = useColorModeValue("green.500", "green.400");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const titleColor = useColorModeValue("gray.800", "gray.100");

  return (
    <Box px={{ base: 3, md: 4 }} py={4} w="full">
      <HStack spacing={3} align="start" mb={3}>
        <Flex boxSize={8} borderRadius="full" bg={assistantIconBg} align="center" justify="center" flexShrink={0}>
          <Icon as={FiMessageSquare} boxSize={3.5} color="white" />
        </Flex>
        <Box flex={1} minW={0}>
          <Text fontSize="sm" fontWeight="semibold" color={titleColor}>
            المساعد
          </Text>
          <HStack spacing={2} wrap="wrap" mt={1}>
            <Badge variant="subtle" colorScheme="gray" borderRadius="md" fontSize="10px">
              {platformLabel}
            </Badge>
            <Badge variant="subtle" colorScheme="gray" borderRadius="md" fontSize="10px">
              {result.type === "post" ? toneLabel : `${aspectLabel} · ${languageLabel}`}
            </Badge>
          </HStack>
        </Box>
      </HStack>

      <Box pr={{ base: 0, md: 2 }}>
        {imageUrl && (
          <Box borderRadius="lg" borderWidth="1px" borderColor={borderColor} overflow="hidden" bg={panelBg} mb={4}>
            <Image
              src={imageUrl}
              alt="تصميم"
              w="full"
              maxH={{ base: "280px", md: "420px" }}
              objectFit="contain"
            />
          </Box>
        )}

        {text && (
          <Text whiteSpace="pre-wrap" lineHeight="1.85" fontSize="sm" color={textColor} mb={4}>
            {text}
          </Text>
        )}

        <Flex
          align={{ base: "stretch", sm: "center" }}
          justify="space-between"
          direction={{ base: "column", sm: "row" }}
          gap={2}
        >
          <Text color={muted} fontSize="xs">
            #{result?.generation?.id || "—"}
          </Text>
          <HStack spacing={2}>
            {text && (
              <Button size="sm" leftIcon={<FaCopy />} variant="outline" borderRadius="lg" onClick={() => onCopy(text)} flex={{ base: 1, sm: "initial" }}>
                نسخ
              </Button>
            )}
            {imageUrl && (
              <Button size="sm" leftIcon={<FaDownload />} colorScheme="green" borderRadius="lg" onClick={() => onDownload(imageUrl)} flex={{ base: 1, sm: "initial" }}>
                تحميل
              </Button>
            )}
          </HStack>
        </Flex>
      </Box>
    </Box>
  );
};

const ChatComposer = ({
  mode,
  setMode,
  prompt,
  setPrompt,
  promptLength,
  platform,
  setPlatform,
  tone,
  setTone,
  aspectRatio,
  setAspectRatio,
  languageMode,
  setLanguageMode,
  editLastDesign,
  setEditLastDesign,
  options,
  references,
  removeReference,
  clearReferences,
  handlePickReferences,
  fileInputRef,
  handleReferenceChange,
  canSubmit,
  submitting,
  handleGenerate,
  canExecute,
  onExecute,
  muted,
  subtle,
  borderColor,
  inputBg,
  chipBg,
  panelBg,
  uploadLimit,
  composerShellBg,
  composerBorder,
  showWelcome,
  examples,
  onUsePrompt,
  getItemLabel,
}) => {
  const composerShadow = useColorModeValue(
    "0 2px 12px rgba(15, 23, 42, 0.06)",
    "0 2px 12px rgba(0, 0, 0, 0.25)",
  );
  const chipHover = useColorModeValue("gray.50", "gray.700");
  const ink = useColorModeValue("gray.800", "gray.100");
  const chipActiveBg = useColorModeValue("white", "gray.600");

  const platformLabel = getItemLabel(options.platforms, platform);
  const toneLabel = getItemLabel(options.tones, tone);
  const aspectLabel = getItemLabel(options.aspect_ratios, aspectRatio);
  const languageLabel = getItemLabel(options.languages || FALLBACK_OPTIONS.languages, languageMode);

  return (
    <Box
      px={{ base: 2, md: 3 }}
      pt={2}
      pb={2}
      borderTopWidth="1px"
      borderColor={borderColor}
      bg={composerShellBg}
      flexShrink={0}
      sx={{ pb: "max(8px, env(safe-area-inset-bottom, 8px))" }}
    >
      <Box maxW="48rem" mx="auto" w="full">
        {showWelcome && (
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
            {examples.map((item) => (
              <Button
                key={item.label}
                size="xs"
                variant="outline"
                borderRadius="full"
                borderColor={borderColor}
                bg={inputBg}
                fontWeight="normal"
                fontSize="11px"
                px={2.5}
                h="26px"
                minH="26px"
                flexShrink={0}
                whiteSpace="nowrap"
                onClick={() => onUsePrompt(item.text)}
                _hover={{ borderColor: "green.400", color: "green.500" }}
              >
                {item.label}
              </Button>
            ))}
          </Flex>
        )}

        <Collapse in={mode === "image" && references.length > 0} animateOpacity>
          <HStack spacing={2} mb={2} overflowX="auto" pb={0.5}>
            {references.map((item, index) => (
              <Box key={`${item.file.name}-${index}`} position="relative" flexShrink={0}>
                <Image
                  src={item.previewUrl}
                  alt={item.file.name}
                  boxSize="36px"
                  objectFit="cover"
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={borderColor}
                />
                <IconButton
                  aria-label="حذف"
                  icon={<FaTimes />}
                  size="xs"
                  colorScheme="red"
                  position="absolute"
                  top={-1}
                  left={-1}
                  minW={4}
                  h={4}
                  borderRadius="full"
                  onClick={() => removeReference(index)}
                />
              </Box>
            ))}
            <Button size="xs" variant="ghost" colorScheme="red" onClick={clearReferences} flexShrink={0}>
              مسح
            </Button>
          </HStack>
        </Collapse>

        <Input ref={fileInputRef} type="file" accept="image/*" multiple display="none" onChange={handleReferenceChange} />

        <Box
          borderRadius="xl"
          borderWidth="1px"
          borderColor={promptLength > 3000 ? "red.300" : composerBorder}
          bg={inputBg}
          boxShadow={composerShadow}
          overflow="hidden"
          _focusWithin={{
            borderColor: "green.400",
            boxShadow: "0 0 0 1px rgba(34, 197, 94, 0.12)",
          }}
        >
          <Flex align="center" gap={1.5} py={1} px={1.5} pl={2}>
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={
                mode === "post"
                  ? "اكتب طلب المنشور..."
                  : "صف التصميم المطلوب..."
              }
              border="0"
              _focus={{ boxShadow: "none" }}
              resize="none"
              minH="36px"
              maxH="120px"
              rows={1}
              bg="transparent"
              fontSize="sm"
              lineHeight="1.5"
              flex={1}
              py={1.5}
              px={1}
              color={ink}
              _placeholder={{ color: muted }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (canSubmit) handleGenerate();
                }
              }}
            />
            <IconButton
              aria-label="إرسال"
              icon={<FiSend />}
              size="sm"
              borderRadius="full"
              colorScheme="green"
              onClick={handleGenerate}
              isLoading={submitting}
              isDisabled={!canSubmit}
              flexShrink={0}
            />
          </Flex>
        </Box>

        {canExecute ? (
          <Button
            mt={2}
            size="sm"
            w="full"
            colorScheme="teal"
            borderRadius="lg"
            onClick={onExecute}
            isLoading={submitting}
          >
            نفّذ المسودة المتفق عليها
          </Button>
        ) : null}

        <Flex mt={1.5} align="center" gap={1.5} flexWrap="wrap">
          <HStack spacing={0} bg={chipBg} borderRadius="full" p={0.5} flexShrink={0}>
            <Button
              size="xs"
              h="26px"
              px={2.5}
              borderRadius="full"
              fontSize="11px"
              fontWeight="medium"
              variant={mode === "post" ? "solid" : "ghost"}
              bg={mode === "post" ? chipActiveBg : "transparent"}
              color={mode === "post" ? ink : muted}
              boxShadow={mode === "post" ? "sm" : "none"}
              leftIcon={<Icon as={FaPenNib} boxSize={2.5} />}
              onClick={() => setMode("post")}
            >
              نص
            </Button>
            <Button
              size="xs"
              h="26px"
              px={2.5}
              borderRadius="full"
              fontSize="11px"
              fontWeight="medium"
              variant={mode === "image" ? "solid" : "ghost"}
              bg={mode === "image" ? chipActiveBg : "transparent"}
              color={mode === "image" ? ink : muted}
              boxShadow={mode === "image" ? "sm" : "none"}
              leftIcon={<Icon as={FaImage} boxSize={2.5} />}
              onClick={() => setMode("image")}
            >
              صورة
            </Button>
          </HStack>

          <ComposerMenuChip label={platformLabel} borderColor={borderColor} chipHover={chipHover}>
            {options.platforms.map((item) => (
              <MenuItem
                key={item.value}
                fontSize="sm"
                fontWeight={platform === item.value ? "semibold" : "normal"}
                onClick={() => setPlatform(item.value)}
              >
                {item.label_ar}
              </MenuItem>
            ))}
          </ComposerMenuChip>

          {mode === "post" ? (
            <ComposerMenuChip label={toneLabel} borderColor={borderColor} chipHover={chipHover}>
              {options.tones.map((item) => (
                <MenuItem
                  key={item.value}
                  fontSize="sm"
                  fontWeight={tone === item.value ? "semibold" : "normal"}
                  onClick={() => setTone(item.value)}
                >
                  {item.label_ar}
                </MenuItem>
              ))}
            </ComposerMenuChip>
          ) : (
            <>
              <ComposerMenuChip label={aspectLabel} borderColor={borderColor} chipHover={chipHover}>
                {options.aspect_ratios.map((item) => (
                  <MenuItem
                    key={item.value}
                    fontSize="sm"
                    fontWeight={aspectRatio === item.value ? "semibold" : "normal"}
                    onClick={() => setAspectRatio(item.value)}
                  >
                    {item.label_ar} ({item.value})
                  </MenuItem>
                ))}
              </ComposerMenuChip>
              <ComposerMenuChip label={languageLabel} borderColor={borderColor} chipHover={chipHover}>
                {(options.languages || FALLBACK_OPTIONS.languages).map((item) => (
                  <MenuItem
                    key={item.value}
                    fontSize="sm"
                    fontWeight={languageMode === item.value ? "semibold" : "normal"}
                    onClick={() => setLanguageMode(item.value)}
                  >
                    {item.label_ar}
                  </MenuItem>
                ))}
              </ComposerMenuChip>

              <Popover placement="top-start">
                <PopoverTrigger>
                  <IconButton
                    aria-label="خيارات الصورة"
                    icon={<FiSettings />}
                    size="xs"
                    variant="outline"
                    borderRadius="full"
                    borderColor={borderColor}
                    h="26px"
                    w="26px"
                    minW="26px"
                  />
                </PopoverTrigger>
                <PopoverContent w="220px" borderColor={borderColor} shadow="lg">
                  <PopoverBody p={3}>
                    <VStack align="stretch" spacing={2}>
                      <Button
                        size="sm"
                        variant={editLastDesign ? "solid" : "outline"}
                        colorScheme={editLastDesign ? "green" : "gray"}
                        borderRadius="lg"
                        justifyContent="flex-start"
                        onClick={() => setEditLastDesign((prev) => !prev)}
                      >
                        {editLastDesign ? "✓ تعديل آخر تصميم" : "تصميم جديد"}
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<FaPlus />}
                        variant="outline"
                        borderRadius="lg"
                        justifyContent="flex-start"
                        onClick={handlePickReferences}
                        isDisabled={references.length >= (uploadLimit.max_files || 4)}
                      >
                        صور مرجعية ({references.length}/{uploadLimit.max_files || 4})
                      </Button>
                    </VStack>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
            </>
          )}

          <Spacer display={{ base: "none", sm: "block" }} />
          <Text fontSize="10px" color={promptLength > 3000 ? "red.400" : subtle} flexShrink={0}>
            {promptLength}/3000
          </Text>
        </Flex>

        <Text fontSize="10px" color={muted} mt={1} display={{ base: "none", md: "block" }}>
          Enter إرسال · Shift+Enter سطر
        </Text>
      </Box>
    </Box>
  );
};

const ComposerMenuChip = ({ label, borderColor, chipHover, children }) => (
  <Menu>
    <MenuButton
      as={Button}
      size="xs"
      variant="outline"
      borderRadius="full"
      h="26px"
      px={2.5}
      fontSize="11px"
      fontWeight="medium"
      borderColor={borderColor}
      rightIcon={<FiChevronDown size={12} />}
      _hover={{ bg: chipHover }}
      maxW={{ base: "100px", sm: "130px" }}
    >
      <Text noOfLines={1}>{label}</Text>
    </MenuButton>
    <MenuList minW="160px" maxH="240px" overflowY="auto" fontSize="sm" zIndex={20}>
      {children}
    </MenuList>
  </Menu>
);

const HistoryItem = ({ item, isActive, platformLabel, onClick, muted, sidebarBorder }) => {
  const isImage = item.request_type === "image";
  const hoverBg = useColorModeValue("gray.200", "gray.700");
  const activeBg = useColorModeValue("gray.200", "gray.700");
  const ink = useColorModeValue("gray.800", "gray.100");

  return (
    <Button
      variant="ghost"
      justifyContent="start"
      h="auto"
      py={2.5}
      px={3}
      borderRadius="lg"
      bg={isActive ? activeBg : "transparent"}
      _hover={{ bg: isActive ? activeBg : hoverBg }}
      whiteSpace="normal"
      textAlign="right"
      onClick={onClick}
      w="full"
      fontWeight="normal"
    >
      <HStack align="start" spacing={2.5} w="full">
        <Icon
          as={isImage ? FaImage : FaPenNib}
          boxSize={3.5}
          color={muted}
          mt={0.5}
          flexShrink={0}
        />
        <Box minW={0} flex={1}>
          <Text fontSize="sm" fontWeight={isActive ? "semibold" : "medium"} color={ink} noOfLines={1} lineHeight="1.4">
            {item.prompt || item.generated_text || "توليد محتوى"}
          </Text>
          <HStack spacing={2} mt={0.5}>
            <Text fontSize="10px" color={muted}>
              {isImage ? "صورة" : "نص"} · {platformLabel}
            </Text>
          </HStack>
        </Box>
      </HStack>
    </Button>
  );
};

export default Social;
