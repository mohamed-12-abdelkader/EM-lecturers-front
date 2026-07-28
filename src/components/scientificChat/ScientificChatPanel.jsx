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
  IconButton,
  Textarea,
  Collapse,
  Image,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaRobot,
  FaPaperPlane,
  FaUserGraduate,
  FaArrowUp,
  FaImage,
  FaTimes,
  FaBookOpen,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import {
  askCourse,
  askTeacher,
  fetchCourseHistory,
  fetchTeacherHistory,
  resolveUploadUrl,
} from "../../api/scientificChatbotApi";

const MotionFlex = motion(Flex);
const HISTORY_PAGE = 30;
const MAX_IMAGES = 5;
const MAX_IMAGE_MB = 5;

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(0.9); }
`;

function formatTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

function BotAvatar({ size = "md" }) {
  const dim = size === "sm" ? 8 : 9;
  const ring = useColorModeValue("white", "gray.800");
  return (
    <Flex
      align="center"
      justify="center"
      boxSize={dim}
      borderRadius="xl"
      bgGradient="linear(to-br, blue.500, blue.600)"
      color="white"
      flexShrink={0}
      boxShadow="0 4px 14px rgba(59,130,246,0.35)"
      position="relative"
    >
      <Icon as={FaRobot} boxSize={size === "sm" ? 3.5 : 4} />
      <Box
        position="absolute"
        bottom="-1px"
        right="-1px"
        boxSize={2.5}
        borderRadius="full"
        bg="green.400"
        border="2px solid"
        borderColor={ring}
      />
    </Flex>
  );
}

function TypingIndicator() {
  const bubbleBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  return (
    <Flex justify="flex-start" w="full" align="end" gap={3}>
      <BotAvatar size="sm" />
      <HStack
        px={5}
        py={3.5}
        borderRadius="2xl"
        borderBottomLeftRadius="6px"
        bg={bubbleBg}
        border="1px solid"
        borderColor={borderColor}
        spacing={1.5}
      >
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            w="7px"
            h="7px"
            borderRadius="full"
            bg="orange.400"
            animation={`${pulse} 1.2s ease-in-out infinite`}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </HStack>
    </Flex>
  );
}

function RetrievedChunks({ chunks, itemId, expanded, onToggle }) {
  const cardBg = useColorModeValue("gray.50", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  if (!chunks?.length) return null;

  return (
    <Box mt={3}>
      <Button
        size="xs"
        variant="ghost"
        colorScheme="blue"
        rightIcon={<Icon as={expanded ? FaChevronUp : FaChevronDown} />}
        onClick={onToggle}
        borderRadius="full"
        fontWeight="bold"
      >
        المصادر المسترجعة ({chunks.length})
      </Button>
      <Collapse in={expanded}>
        <VStack align="stretch" spacing={2} mt={2}>
          {chunks.map((chunk, idx) => (
            <Box
              key={`${chunk.file_id}-${chunk.chunk_index}-${idx}`}
              p={3}
              borderRadius="xl"
              bg={cardBg}
              border="1px solid"
              borderColor={borderColor}
            >
              <HStack spacing={2} mb={1.5}>
                {chunk.file_id != null && (
                  <Badge colorScheme="blue" fontSize="0.6rem" borderRadius="full">
                    ملف #{chunk.file_id}
                  </Badge>
                )}
                {chunk.chunk_index != null && (
                  <Badge colorScheme="gray" fontSize="0.6rem" borderRadius="full">
                    جزء {(chunk.chunk_index ?? 0) + 1}
                  </Badge>
                )}
              </HStack>
              <Text fontSize="xs" lineHeight="1.75" whiteSpace="pre-wrap" noOfLines={8}>
                {chunk.chunk_text ?? chunk.content ?? "—"}
              </Text>
            </Box>
          ))}
        </VStack>
      </Collapse>
    </Box>
  );
}

function HistoryTurn({ item, expandedChunks, onToggleChunks }) {
  const studentBubble = useColorModeValue("blue.500", "blue.600");
  const botBg = useColorModeValue("white", "gray.800");
  const botBorder = useColorModeValue("gray.200", "gray.600");
  const muted = useColorModeValue("gray.500", "gray.400");
  const images = Array.isArray(item.images) ? item.images : [];

  return (
    <MotionFlex
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      direction="column"
      gap={3}
      w="full"
    >
      <Flex justify="flex-end" align="end" gap={3} w="full">
        <Box maxW={{ base: "88%", md: "75%" }}>
          <Text fontSize="xs" color={muted} mb={1.5} textAlign="left">
            أنت · {formatTime(item.created_at)}
          </Text>
          <Box
            px={4}
            py={3}
            borderRadius="2xl"
            borderBottomRightRadius="6px"
            bgGradient={`linear(to-l, ${studentBubble}, blue.600)`}
            color="white"
            boxShadow="0 6px 20px -6px rgba(59,130,246,0.45)"
          >
            <Text fontSize="sm" whiteSpace="pre-wrap" lineHeight="1.75">
              {item.question}
            </Text>
            {images.length > 0 && (
              <Wrap spacing={2} mt={3}>
                {images.map((src, i) => (
                  <WrapItem key={`${src}-${i}`}>
                    <Image
                      src={resolveUploadUrl(src)}
                      alt=""
                      borderRadius="lg"
                      maxH="120px"
                      objectFit="cover"
                    />
                  </WrapItem>
                ))}
              </Wrap>
            )}
          </Box>
        </Box>
        <Flex
          boxSize={8}
          borderRadius="xl"
          bgGradient="linear(to-br, orange.400, orange.500)"
          align="center"
          justify="center"
          color="white"
          flexShrink={0}
        >
          <Icon as={FaUserGraduate} boxSize={3.5} />
        </Flex>
      </Flex>

      <Flex justify="flex-start" align="end" gap={3} w="full">
        <BotAvatar size="sm" />
        <Box maxW={{ base: "88%", md: "78%" }}>
          <HStack spacing={2} mb={1.5}>
            <Text fontSize="xs" fontWeight="semibold" color={muted}>
              المساعد العلمي
            </Text>
            <Badge colorScheme="green" fontSize="0.6rem" borderRadius="full">
              RAG
            </Badge>
          </HStack>
          <Box
            px={4}
            py={3.5}
            borderRadius="2xl"
            borderBottomLeftRadius="6px"
            bg={botBg}
            border="1px solid"
            borderColor={botBorder}
            boxShadow="sm"
            position="relative"
            overflow="hidden"
          >
            <Box position="absolute" top={0} right={0} bottom={0} w="3px" bg="orange.400" />
            <Text fontSize="sm" whiteSpace="pre-wrap" lineHeight="1.8" pr={1}>
              {item.answer || "—"}
            </Text>
            <RetrievedChunks
              chunks={item.retrieved_chunks}
              itemId={item.id}
              expanded={!!expandedChunks[item.id]}
              onToggle={() => onToggleChunks(item.id)}
            />
          </Box>
        </Box>
      </Flex>
    </MotionFlex>
  );
}

/**
 * @param {{ mode: 'course'|'teacher', courseId?: string|number, teacherId?: string|number, token: string, compact?: boolean, subtitle?: string }} props
 */
export default function ScientificChatPanel({
  mode = "course",
  courseId,
  teacherId,
  token,
  compact = false,
  subtitle,
}) {
  const toast = useToast();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [question, setQuestion] = useState("");
  const [pendingImages, setPendingImages] = useState([]);
  const [expandedChunks, setExpandedChunks] = useState({});
  const [error, setError] = useState(null);

  const chatBg = useColorModeValue("gray.50", "gray.900");
  const pattern = useColorModeValue(
    "radial-gradient(circle at 1px 1px, rgba(59,130,246,0.07) 1px, transparent 0)",
    "radial-gradient(circle at 1px 1px, rgba(59,130,246,0.1) 1px, transparent 0)"
  );
  const composerBg = useColorModeValue("white", "gray.800");
  const inputShellBg = useColorModeValue("gray.50", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.300");
  const emptyTitleColor = useColorModeValue("gray.800", "gray.100");

  const scopeReady = mode === "course" ? !!courseId : !!teacherId;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  }, []);

  const loadHistory = useCallback(
    async (beforeId = null, prepend = false) => {
      if (!token || !scopeReady) return [];
      const fetcher =
        mode === "course"
          ? () => fetchCourseHistory(courseId, { limit: HISTORY_PAGE, beforeId }, token)
          : () => fetchTeacherHistory(teacherId, { limit: HISTORY_PAGE, beforeId }, token);

      const list = await fetcher();
      if (prepend) {
        setHistory((prev) => [...list, ...prev]);
        setHasMore(list.length >= HISTORY_PAGE);
      } else {
        setHistory(list);
        setHasMore(list.length >= HISTORY_PAGE);
        scrollToBottom();
      }
      return list;
    },
    [courseId, teacherId, mode, token, scopeReady, scrollToBottom]
  );

  useEffect(() => {
    if (!scopeReady || !token) {
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await loadHistory();
      } catch (err) {
        if (!mounted) return;
        const msg = err?.response?.data?.error || err?.message || "فشل تحميل المحادثة";
        setError(msg);
        setHistory([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [scopeReady, token, courseId, teacherId, mode, loadHistory]);

  const loadOlder = async () => {
    if (loadingOlder || !hasMore || history.length === 0) return;
    const oldestId = history[0]?.id;
    if (!oldestId) return;
    setLoadingOlder(true);
    try {
      await loadHistory(oldestId, true);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingOlder(false);
    }
  };

  const clearPendingImages = () => {
    pendingImages.forEach((item) => {
      if (item.preview) URL.revokeObjectURL(item.preview);
    });
    setPendingImages([]);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleImagePick = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const valid = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "صور فقط", status: "warning", duration: 2500, isClosable: true });
        continue;
      }
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        toast({
          title: "حجم الصورة كبير",
          description: `الحد ${MAX_IMAGE_MB}MB لكل صورة`,
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        continue;
      }
      valid.push({ file, preview: URL.createObjectURL(file) });
    }

    setPendingImages((prev) => {
      const merged = [...prev, ...valid].slice(0, MAX_IMAGES);
      if (prev.length + valid.length > MAX_IMAGES) {
        toast({
          title: `حد أقصى ${MAX_IMAGES} صور`,
          status: "info",
          duration: 2500,
          isClosable: true,
        });
      }
      return merged;
    });
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const removePendingImage = (index) => {
    setPendingImages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return next;
    });
  };

  const handleAsk = async (e) => {
    e?.preventDefault();
    const text = question.trim();
    if (!text || sending || !scopeReady) return;

    setSending(true);
    setError(null);
    const images = pendingImages.map((p) => p.file);
    const optimisticId = `tmp-${Date.now()}`;

    setHistory((prev) => [
      ...prev,
      {
        id: optimisticId,
        question: text,
        answer: "",
        retrieved_chunks: [],
        images: images.map((f) => URL.createObjectURL(f)),
        created_at: new Date().toISOString(),
        _pending: true,
      },
    ]);
    setQuestion("");
    clearPendingImages();
    scrollToBottom();

    try {
      const data =
        mode === "course"
          ? await askCourse(courseId, { question: text, images }, token)
          : await askTeacher(teacherId, { question: text, images }, token);

      setHistory((prev) => {
        const without = prev.filter((h) => h.id !== optimisticId);
        return [
          ...without,
          {
            id: `local-${Date.now()}`,
            question: text,
            answer: data?.answer || "",
            retrieved_chunks: data?.retrieved_chunks || [],
            images: [],
            created_at: new Date().toISOString(),
          },
        ];
      });
      scrollToBottom();
    } catch (err) {
      setHistory((prev) => prev.filter((h) => h.id !== optimisticId));
      const status = err?.response?.status;
      const msg = err?.response?.data?.error || err?.message || "فشل الحصول على الإجابة";
      setError(msg);
      toast({
        title: status === 403 ? "غير مشترك" : status === 404 ? "لا يوجد محتوى" : "خطأ",
        description: msg,
        status: status === 403 || status === 404 ? "warning" : "error",
        duration: 4500,
        isClosable: true,
      });
    } finally {
      setSending(false);
    }
  };

  const toggleChunks = (id) => {
    setExpandedChunks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const defaultSubtitle = useMemo(
    () =>
      mode === "course"
        ? "اسأل عن محتوى هذا الكورس — الإجابة من المواد المرفوعة فقط (RAG)"
        : "اسأل عن كل مواد المدرس — كورسات + ملفات عامة",
    [mode]
  );

  if (!scopeReady) {
    return (
      <Center py={12} flexDirection="column" gap={3}>
        <Icon as={FaBookOpen} boxSize={10} color="gray.400" />
        <Text color={muted} fontSize="sm">
          اختر كورساً أو مدرساً لبدء المحادثة
        </Text>
      </Center>
    );
  }

  return (
    <Flex direction="column" h={compact ? "100%" : "auto"} minH={compact ? 0 : "520px"}>
      {!compact && (
        <Box
          px={4}
          py={3}
          borderBottom="1px solid"
          borderColor={borderColor}
          bgGradient="linear(to-l, blue.600, blue.500)"
          color="white"
          borderTopRadius="2xl"
        >
          <HStack spacing={3}>
            <BotAvatar />
            <Box>
              <Text fontWeight="black" fontSize="md">
                المساعد العلمي
              </Text>
              <Text fontSize="xs" color="whiteAlpha.900">
                {subtitle || defaultSubtitle}
              </Text>
            </Box>
          </HStack>
        </Box>
      )}

      <Box
        flex={1}
        overflowY="auto"
        px={{ base: 3, md: 4 }}
        py={4}
        bg={chatBg}
        backgroundImage={pattern}
        backgroundSize="22px 22px"
        minH={compact ? "280px" : "360px"}
      >
        {hasMore && (
          <Center mb={4}>
            <Button
              size="sm"
              variant="outline"
              colorScheme="blue"
              borderRadius="full"
              leftIcon={<FaArrowUp />}
              onClick={loadOlder}
              isLoading={loadingOlder}
              bg={composerBg}
            >
              رسائل أقدم
            </Button>
          </Center>
        )}

        {loading ? (
          <Center minH="200px">
            <VStack spacing={3}>
              <Spinner color="blue.500" />
              <Text fontSize="sm" color={muted}>
                جاري تحميل المحادثة...
              </Text>
            </VStack>
          </Center>
        ) : error && history.length === 0 ? (
          <Center minH="200px" flexDirection="column" gap={3}>
            <Text color="red.500" textAlign="center" fontSize="sm" px={4}>
              {error}
            </Text>
            <Button size="sm" colorScheme="blue" onClick={() => loadHistory()}>
              إعادة المحاولة
            </Button>
          </Center>
        ) : history.length === 0 ? (
          <Center minH="200px" flexDirection="column" gap={3} px={4}>
            <Flex
              boxSize={14}
              borderRadius="2xl"
              bgGradient="linear(to-br, blue.500, blue.600)"
              align="center"
              justify="center"
              color="white"
              boxShadow="lg"
            >
              <Icon as={FaRobot} boxSize={7} />
            </Flex>
            <Text fontWeight="bold" color={emptyTitleColor}>
              ابدأ سؤالك العلمي
            </Text>
            <Text fontSize="sm" color={muted} textAlign="center" maxW="md" lineHeight="1.8">
              اكتب سؤالك عن الدرس أو أرفق صورة للسؤال. الإجابة تُستخرج من المواد التي رفعها المدرس فقط.
            </Text>
            <Wrap justify="center" spacing={2}>
              {["اشرح الدرس الأول", "ما قانون نيوتن؟", "لخص الوحدة"].map((ex) => (
                <WrapItem key={ex}>
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme="blue"
                    borderRadius="full"
                    onClick={() => setQuestion(ex)}
                  >
                    {ex}
                  </Button>
                </WrapItem>
              ))}
            </Wrap>
          </Center>
        ) : (
          <VStack spacing={6} align="stretch" pb={2}>
            <AnimatePresence>
              {history.map((item) => (
                <HistoryTurn
                  key={item.id}
                  item={item}
                  expandedChunks={expandedChunks}
                  onToggleChunks={toggleChunks}
                />
              ))}
            </AnimatePresence>
            {sending && <TypingIndicator />}
            <Box ref={messagesEndRef} h={1} />
          </VStack>
        )}
      </Box>

      <Box
        as="form"
        onSubmit={handleAsk}
        px={{ base: 3, md: 4 }}
        py={3}
        bg={composerBg}
        borderTop="1px solid"
        borderTopColor={borderColor}
        borderBottomRadius={compact ? 0 : "2xl"}
      >
        {pendingImages.length > 0 && (
          <Wrap spacing={2} mb={3}>
            {pendingImages.map((item, index) => (
              <WrapItem key={item.preview}>
                <Box position="relative">
                  <Image
                    src={item.preview}
                    alt=""
                    boxSize="64px"
                    objectFit="cover"
                    borderRadius="lg"
                    border="2px solid"
                    borderColor="blue.300"
                  />
                  <IconButton
                    aria-label="حذف الصورة"
                    icon={<FaTimes />}
                    size="xs"
                    position="absolute"
                    top="-6px"
                    left="-6px"
                    borderRadius="full"
                    colorScheme="red"
                    onClick={() => removePendingImage(index)}
                  />
                </Box>
              </WrapItem>
            ))}
          </Wrap>
        )}

        <Box
          p={2}
          borderRadius="2xl"
          border="2px solid"
          borderColor={question.trim() ? "blue.300" : borderColor}
          bg={inputShellBg}
          transition="all 0.2s"
          boxShadow={question.trim() ? "0 0 0 3px rgba(59,130,246,0.1)" : "none"}
        >
          <Textarea
            ref={inputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="اكتب سؤالك عن المحتوى العلمي..."
            rows={compact ? 2 : 2}
            resize="none"
            border="none"
            bg="transparent"
            _focus={{ boxShadow: "none" }}
            isDisabled={sending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAsk(e);
              }
            }}
          />
          <Flex justify="space-between" align="center" pt={2} px={1}>
            <HStack spacing={1}>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleImagePick}
              />
              <IconButton
                aria-label="إرفاق صورة"
                icon={<FaImage />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
                borderRadius="full"
                onClick={() => imageInputRef.current?.click()}
                isDisabled={sending || pendingImages.length >= MAX_IMAGES}
              />
              <Text fontSize="xs" color={muted} display={{ base: "none", sm: "block" }}>
                حتى {MAX_IMAGES} صور
              </Text>
            </HStack>
            <IconButton
              type="submit"
              aria-label="إرسال"
              icon={<FaPaperPlane />}
              color="white"
              borderRadius="xl"
              bgGradient={
                question.trim() ? "linear(to-l, orange.500, orange.400)" : undefined
              }
              bg={!question.trim() ? "gray.300" : undefined}
              isLoading={sending}
              isDisabled={!question.trim() || sending}
              boxShadow={question.trim() ? "0 4px 14px rgba(249,115,22,0.35)" : "none"}
            />
          </Flex>
        </Box>
      </Box>
    </Flex>
  );
}
