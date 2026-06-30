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
  Wrap,
  WrapItem,
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
import { FiChevronDown, FiClock, FiMenu, FiMessageSquare, FiPlus, FiRefreshCw, FiSend, FiSettings, FiUser } from "react-icons/fi";
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
    label: "إعلان كورس جديد",
    text: "اكتب منشور إعلان عن بداية كورس فيزياء للصف الثالث الثانوي مع دعوة واضحة للحجز.",
  },
  {
    label: "تصميم مراجعة نهائية",
    text: "صمم بوست جذاب عن حصة مراجعة نهائية في الرياضيات، النص داخل الصورة يكون قصير وواضح.",
  },
  {
    label: "رسالة واتساب",
    text: "اكتب رسالة واتساب مختصرة لتذكير الطلاب بموعد امتحان شامل يوم الجمعة.",
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
  const [result, setResult] = useState(null);
  const [lastRequest, setLastRequest] = useState(null);
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
  const showWelcome = !lastRequest && !result && !submitting;

  const uploadLimit = options.uploads || FALLBACK_OPTIONS.uploads;
  const promptLength = prompt.trim().length;
  const canSubmit = promptLength > 0 && promptLength <= 3000 && !submitting;

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
  }, [result, submitting, lastRequest]);

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

  const handleGenerate = async () => {
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

    if (promptLength > 3000) {
      toast({
        title: "الطلب أطول من المسموح",
        description: "الحد الأقصى 3000 حرف.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    const requestSnapshot = {
      prompt: cleanPrompt,
      mode,
      platform,
      tone,
      aspectRatio,
      languageMode,
      editLastDesign,
      referencePreviews: references.map((item) => item.previewUrl),
    };

    try {
      setSubmitting(true);
      setResult(null);
      setLastRequest(requestSnapshot);

      if (mode === "post") {
        const { data } = await baseUrl.post(
          "/api/teacher/creative-chatbot/posts",
          { prompt: cleanPrompt, platform, tone },
          { headers: authHeaders },
        );
        setResult({ type: "post", ...data });
        if (data?.generation?.id) setActiveHistoryId(data.generation.id);
      } else {
        const form = new FormData();
        form.append("prompt", cleanPrompt);
        form.append("platform", platform);
        form.append("aspect_ratio", aspectRatio);
        form.append("language_mode", languageMode);
        if (editLastDesign) {
          form.append("edit_last_design", "true");
        }
        references.forEach((item) => form.append("references", item.file));

        const { data } = await baseUrl.post("/api/teacher/creative-chatbot/images", form, {
          headers: authHeaders,
        });
        setResult({ type: "image", ...data });
        if (data?.generation?.id) setActiveHistoryId(data.generation.id);
      }

      toast({
        title: mode === "post" ? "تم توليد المنشور بنجاح" : "تم توليد التصميم بنجاح",
        status: "success",
        duration: 2200,
        isClosable: true,
      });
      setPrompt("");
      loadHistory();
    } catch (error) {
      toast({
        title: "تعذر توليد المحتوى",
        description: getErrorMessage(error),
        status: "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const applyHistoryItem = (item) => {
    setIsMobileHistoryOpen(false);
    setActiveHistoryId(item.id);
    setLastRequest({
      prompt: item.prompt,
      mode: item.request_type,
      platform: item.platform || "general",
      tone: item.tone || "professional",
      aspectRatio: item.aspect_ratio || "1:1",
      languageMode: item.language_mode || options.default_language || "arabic",
      editLastDesign: Boolean(item.edited_generation_id),
      referencePreviews: [],
    });
    setResult({
      type: item.request_type,
      post_text: item.generated_text,
      image_url: item.generated_image_url,
      generation: item,
    });
  };

  const resultText = result?.post_text || result?.generation?.generated_text || "";
  const resultImage = result?.image_url || result?.generation?.generated_image_url;

  const startNewSession = () => {
    setPrompt("");
    setResult(null);
    setLastRequest(null);
    setActiveHistoryId(null);
    setSubmitting(false);
    clearReferences();
    setEditLastDesign(false);
    setIsMobileHistoryOpen(false);
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
        <Flex flex={1} direction="column" minW={0} minH={0} bg={pageBg}>
          <Flex
            align="center"
            justify="space-between"
            px={{ base: 3, md: 4 }}
            py={3}
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
                  {getItemLabel(options.platforms, platform)} · {mode === "post" ? "منشور نصي" : "تصميم صورة"}
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

          <Box flex={1} minH={0} overflowY="auto" overflowX="hidden">
            <VStack align="stretch" spacing={0} maxW="768px" mx="auto" w="full">
              {showWelcome && (
                <AssistantWelcome muted={muted} ink={ink} />
              )}

              {lastRequest && (
                <UserMessage
                  request={lastRequest}
                  platformLabel={getItemLabel(options.platforms, lastRequest.platform)}
                  toneLabel={getItemLabel(options.tones, lastRequest.tone)}
                  aspectLabel={getItemLabel(options.aspect_ratios, lastRequest.aspectRatio)}
                  languageLabel={getItemLabel(options.languages, lastRequest.languageMode)}
                />
              )}

              {submitting && (
                <AssistantLoading mode={mode} muted={muted} borderColor={borderColor} panelBg={panelBg} />
              )}

              {result && (
                <AssistantResult
                  result={result}
                  text={resultText}
                  imageUrl={resultImage}
                  muted={muted}
                  borderColor={borderColor}
                  panelBg={panelBg}
                  onCopy={handleCopy}
                  onDownload={downloadImage}
                  platformLabel={getItemLabel(options.platforms, result?.generation?.platform || platform)}
                  toneLabel={getItemLabel(options.tones, result?.generation?.tone || tone)}
                  aspectLabel={getItemLabel(options.aspect_ratios, result?.generation?.aspect_ratio || aspectRatio)}
                  languageLabel={getItemLabel(options.languages, result?.generation?.language_mode || languageMode)}
                />
              )}

              <Box ref={chatEndRef} h={1} />
            </VStack>
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
            submitting={submitting}
            handleGenerate={handleGenerate}
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

const MessageRow = ({ role, children }) => {
  const isUser = role === "user";
  const avatarBg = useColorModeValue(isUser ? "gray.200" : "green.100", isUser ? "gray.600" : "green.900");
  const avatarColor = useColorModeValue(isUser ? "gray.700" : "green.700", isUser ? "gray.200" : "green.200");
  const rowBg = useColorModeValue(isUser ? "transparent" : "white", isUser ? "transparent" : "gray.800");
  const rowBorder = useColorModeValue("gray.100", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  return (
    <Flex
      gap={{ base: 3, md: 4 }}
      px={{ base: 4, md: 6 }}
      py={{ base: 4, md: 5 }}
      bg={rowBg}
      borderBottomWidth="1px"
      borderColor={rowBorder}
      w="full"
    >
      <Flex
        w={{ base: 7, md: 8 }}
        h={{ base: 7, md: 8 }}
        borderRadius="sm"
        bg={avatarBg}
        color={avatarColor}
        align="center"
        justify="center"
        flexShrink={0}
        mt={0.5}
      >
        <Icon as={isUser ? FiUser : FiMessageSquare} boxSize={4} />
      </Flex>
      <Box flex={1} minW={0} pt={0.5}>
        <Text fontSize="xs" fontWeight="semibold" color={muted} mb={1.5}>
          {isUser ? "أنت" : "المساعد"}
        </Text>
        {children}
      </Box>
    </Flex>
  );
};

const AssistantWelcome = ({ muted, ink }) => (
  <Center flexDirection="column" px={4} py={{ base: 6, md: 10 }} textAlign="center" w="full">
    <Flex
      w={10}
      h={10}
      borderRadius="lg"
      bg={useColorModeValue("green.100", "green.900")}
      color={useColorModeValue("green.700", "green.200")}
      align="center"
      justify="center"
      mb={3}
    >
      <Icon as={FiMessageSquare} boxSize={5} />
    </Flex>
    <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="semibold" color={ink} lineHeight="1.4" mb={1}>
      ماذا تريد أن تنشر اليوم؟
    </Text>
    <Text color={muted} fontSize="sm" lineHeight="1.7" maxW="380px">
      اكتب طلبك في الأسفل واختر المنصة — نص جاهز أو تصميم صورة.
    </Text>
  </Center>
);

const UserMessage = ({ request, platformLabel, toneLabel, aspectLabel, languageLabel }) => (
  <MessageRow role="user">
    <Text whiteSpace="pre-wrap" lineHeight="1.85" fontSize={{ base: "sm", md: "md" }} color={useColorModeValue("gray.800", "gray.100")}>
      {request.prompt}
    </Text>
    <HStack mt={3} spacing={1.5} wrap="wrap">
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
            h="60px"
            borderRadius="md"
            objectFit="cover"
          />
        ))}
      </SimpleGrid>
    )}
  </MessageRow>
);

const AssistantLoading = ({ mode, muted, borderColor, panelBg }) => (
  <MessageRow role="assistant">
    {mode === "image" ? (
      <VStack align="stretch" spacing={3} w="full">
        <HStack spacing={2}>
          <Spinner size="sm" color="green.500" />
          <Text fontSize="sm" color={muted}>
            يتم إنشاء التصميم...
          </Text>
        </HStack>
        <ImageGenerationPreview borderColor={borderColor} panelBg={panelBg} />
      </VStack>
    ) : (
      <HStack spacing={2}>
        <Spinner size="sm" color="green.500" />
        <Text fontSize="sm" color={muted}>
          يتم صياغة المنشور...
        </Text>
      </HStack>
    )}
  </MessageRow>
);

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
}) => (
  <MessageRow role="assistant">
    <VStack align="stretch" spacing={4} w="full">
      <HStack spacing={2} wrap="wrap">
        <Badge variant="subtle" colorScheme="gray" borderRadius="md" fontSize="10px">
          {platformLabel}
        </Badge>
        <Badge variant="subtle" colorScheme="gray" borderRadius="md" fontSize="10px">
          {result.type === "post" ? toneLabel : `${aspectLabel} · ${languageLabel}`}
        </Badge>
      </HStack>

      {imageUrl && (
        <Box borderRadius="lg" borderWidth="1px" borderColor={borderColor} overflow="hidden" bg={panelBg}>
          <Image
            src={imageUrl}
            alt="تصميم"
            w="full"
            maxH={{ base: "320px", md: "480px" }}
            objectFit="contain"
          />
        </Box>
      )}

      {text && (
        <Text whiteSpace="pre-wrap" lineHeight="1.9" fontSize={{ base: "sm", md: "md" }} color={useColorModeValue("gray.800", "gray.100")}>
          {text}
        </Text>
      )}

      <Flex
        align={{ base: "stretch", sm: "center" }}
        justify="space-between"
        direction={{ base: "column", sm: "row" }}
        gap={3}
        pt={1}
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
    </VStack>
  </MessageRow>
);

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
    "0 0 0 1px rgba(0,0,0,.05), 0 4px 24px rgba(0,0,0,.08)",
    "0 0 0 1px rgba(255,255,255,.08), 0 4px 24px rgba(0,0,0,.4)",
  );
  const sendActiveBg = useColorModeValue("gray.900", "white");
  const sendActiveColor = useColorModeValue("white", "gray.900");
  const sendInactiveBg = useColorModeValue("gray.100", "gray.700");
  const chipActiveBg = useColorModeValue("white", "gray.600");
  const chipHover = useColorModeValue("gray.50", "gray.700");
  const ink = useColorModeValue("gray.800", "gray.100");

  const platformLabel = getItemLabel(options.platforms, platform);
  const toneLabel = getItemLabel(options.tones, tone);
  const aspectLabel = getItemLabel(options.aspect_ratios, aspectRatio);
  const languageLabel = getItemLabel(options.languages || FALLBACK_OPTIONS.languages, languageMode);

  return (
    <Box
      px={{ base: 3, md: 4 }}
      py={3}
      pb={{ base: "max(10px, env(safe-area-inset-bottom))", md: 3 }}
      borderTopWidth="1px"
      borderColor={borderColor}
      bg={composerShellBg}
      flexShrink={0}
    >
      <Box maxW="768px" mx="auto" w="full">
        {showWelcome && (
          <Wrap spacing={2} mb={3} justify="center">
            {examples.map((item) => (
              <WrapItem key={item.label}>
                <Button
                  size="xs"
                  variant="outline"
                  borderRadius="full"
                  borderColor={borderColor}
                  bg={inputBg}
                  fontWeight="normal"
                  fontSize="11px"
                  px={3}
                  h={7}
                  onClick={() => onUsePrompt(item.text)}
                  _hover={{ borderColor: "green.400", color: "green.500" }}
                >
                  {item.label}
                </Button>
              </WrapItem>
            ))}
          </Wrap>
        )}

        <Collapse in={mode === "image" && references.length > 0} animateOpacity>
          <HStack spacing={2} mb={2} overflowX="auto" pb={1}>
            {references.map((item, index) => (
              <Box key={`${item.file.name}-${index}`} position="relative" flexShrink={0}>
                <Image
                  src={item.previewUrl}
                  alt={item.file.name}
                  boxSize="40px"
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

        <Flex
          align="flex-end"
          gap={2}
          px={3}
          py={2}
          borderRadius="2xl"
          borderWidth="1px"
          borderColor={promptLength > 3000 ? "red.300" : composerBorder}
          bg={inputBg}
          boxShadow={composerShadow}
        >
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={
              mode === "post"
                ? "اكتب طلب المنشور... مثال: إعلان عن بداية كورس فيزياء"
                : "صف التصميم المطلوب... النص داخل الصورة يكون قصيراً"
            }
            border="0"
            _focus={{ boxShadow: "none" }}
            resize="none"
            minH="48px"
            maxH="120px"
            rows={1}
            bg="transparent"
            fontSize="sm"
            lineHeight="1.6"
            flex={1}
            py={1.5}
            px={0}
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
            size="md"
            borderRadius="xl"
            bg={canSubmit ? sendActiveBg : sendInactiveBg}
            color={canSubmit ? sendActiveColor : muted}
            onClick={handleGenerate}
            isLoading={submitting}
            isDisabled={!canSubmit}
            flexShrink={0}
            mb={0.5}
            _hover={canSubmit ? { opacity: 0.85 } : undefined}
          />
        </Flex>

        <Flex mt={2} align="center" gap={1.5} flexWrap="wrap">
          <HStack spacing={0} bg={chipBg} borderRadius="full" p={0.5} flexShrink={0}>
            <Button
              size="xs"
              h={7}
              px={3}
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
              h={7}
              px={3}
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
                    h={7}
                    w={7}
                    minW={7}
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

        <Text fontSize="10px" color={muted} mt={1.5} px={1} display={{ base: "block", sm: "none" }}>
          Enter للإرسال · Shift+Enter سطر جديد
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
      h={7}
      px={2.5}
      fontSize="11px"
      fontWeight="medium"
      borderColor={borderColor}
      rightIcon={<FiChevronDown size={12} />}
      _hover={{ bg: chipHover }}
      maxW={{ base: "110px", sm: "140px" }}
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
