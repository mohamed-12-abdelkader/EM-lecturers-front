import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Textarea,
  Spinner,
  useColorModeValue,
  Wrap,
  WrapItem,
  Icon,
  Center,
  IconButton,
  Alert,
  AlertIcon,
  AlertTitle,
} from "@chakra-ui/react";
import { FiSend, FiMessageSquare, FiUser } from "react-icons/fi";
import { MdQuiz } from "react-icons/md";
import { renderMarkdownInline } from "../examBuilderUtils";
import { ACCENT, ACCENT_LIGHT } from "../examBuilderTheme";

function MarkdownText({ text, fontSize = "sm" }) {
  const textColor = useColorModeValue("gray.700", "gray.100");
  const boldColor = useColorModeValue("gray.900", "white");
  return (
    <Text fontSize={fontSize} color={textColor} lineHeight="1.85">
      {renderMarkdownInline(text).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <Text as="span" key={i} fontWeight="semibold" color={boldColor}>
            {part.slice(2, -2)}
          </Text>
        ) : (
          <Text as="span" key={i} whiteSpace="pre-wrap">
            {part}
          </Text>
        )
      )}
    </Text>
  );
}

function MessageRow({ role, children }) {
  const isUser = role === "user";
  const avatarBg = useColorModeValue(isUser ? "blue.100" : "gray.100", isUser ? "blue.900" : "gray.700");
  const avatarColor = useColorModeValue(isUser ? "blue.700" : "gray.600", isUser ? "blue.200" : "gray.300");
  const rowBg = useColorModeValue(isUser ? "transparent" : "gray.50", isUser ? "transparent" : "gray.900");
  const rowBorder = useColorModeValue("gray.100", "gray.800");

  return (
    <Flex
      gap={{ base: 3, md: 4 }}
      px={{ base: 3, sm: 4, md: 6 }}
      py={{ base: 4, md: 5 }}
      bg={rowBg}
      borderBottomWidth="1px"
      borderColor={rowBorder}
      justify="center"
    >
      <Flex w="full" maxW="3xl" gap={{ base: 3, md: 4 }} align="start">
        <Flex
          w={{ base: 7, md: 8 }}
          h={{ base: 7, md: 8 }}
          borderRadius="md"
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
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}

export default function ExamBuilderChatWorkspace({
  botInfo,
  currentRequest,
  reply,
  error,
  thinking,
  onSend,
  children,
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  const pageBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const composerBg = useColorModeValue("white", "gray.800");
  const composerBorder = useColorModeValue("gray.200", "gray.600");
  const composerShadow = useColorModeValue("0 0 0 1px rgba(0,0,0,.05), 0 4px 24px rgba(0,0,0,.08)", "0 0 0 1px rgba(255,255,255,.08), 0 4px 24px rgba(0,0,0,.4)");
  const chipBg = useColorModeValue("white", "gray.700");
  const accentBg = useColorModeValue(ACCENT_LIGHT, "blue.900");
  const inputWrapBg = useColorModeValue("white", "gray.800");
  const sendInactiveBg = useColorModeValue("gray.100", "gray.700");
  const sendInactiveHoverBg = useColorModeValue("gray.200", "gray.600");

  const isEmpty = !currentRequest && !reply && !error && !thinking && !children;
  const showWelcome = isEmpty && botInfo?.welcome_message;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentRequest, reply, error, thinking, children]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");
    onSend(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Flex
      direction="column"
      flex={1}
      minH={0}
      h="100%"
      bg={pageBg}
      borderWidth="1px"
      borderColor={border}
      borderRadius={{ base: "lg", md: "xl" }}
      overflow="hidden"
      boxShadow={{ base: "none", md: "sm" }}
    >
      {/* Scrollable content — رد فوق */}
      <Box flex={1} overflowY="auto" ref={scrollRef}>
        {showWelcome && (
          <Center flexDirection="column" px={{ base: 4, sm: 6 }} py={{ base: 6, md: 16 }} textAlign="center">
            <Flex
              w={{ base: 12, md: 14 }}
              h={{ base: 12, md: 14 }}
              borderRadius="2xl"
              bg={accentBg}
              align="center"
              justify="center"
              mb={4}
            >
              <Icon as={MdQuiz} color={ACCENT} boxSize={7} />
            </Flex>
            <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" mb={2}>
              {botInfo?.name || "مساعد إنشاء الامتحانات"}
            </Text>
            <Text fontSize="sm" color={muted} maxW="md" lineHeight="1.8" mb={6}>
              {botInfo?.description ||
                "صف الامتحان بالعربية وسيتم اختيار أسئلة عشوائية من بنك أسئلتك"}
            </Text>
            {botInfo?.quick_examples?.length > 0 && (
              <Wrap spacing={2} justify="center" maxW="lg">
                {botInfo.quick_examples.map((ex) => (
                  <WrapItem key={ex.label}>
                    <Button
                      size="sm"
                      variant="outline"
                      borderRadius="full"
                      borderColor={border}
                      bg={chipBg}
                      fontWeight="normal"
                      fontSize="xs"
                      px={4}
                      h={9}
                      _hover={{ borderColor: ACCENT, color: ACCENT }}
                      onClick={() => onSend(ex.message)}
                      isDisabled={thinking}
                    >
                      {ex.label}
                    </Button>
                  </WrapItem>
                ))}
              </Wrap>
            )}
          </Center>
        )}

        {currentRequest && (
          <MessageRow role="user">
            <Text fontSize="xs" fontWeight="semibold" color={muted} mb={1.5}>
              أنت
            </Text>
            <MarkdownText text={currentRequest} />
          </MessageRow>
        )}

        {thinking && (
          <MessageRow role="assistant">
            <Flex align="center" gap={3}>
              <Spinner size="sm" color={ACCENT} thickness="3px" />
              <Text fontSize="sm" color={muted}>
                جاري تحليل الطلب واختيار الأسئلة…
              </Text>
            </Flex>
          </MessageRow>
        )}

        {!thinking && error && (
          <MessageRow role="assistant">
            <Alert status="error" borderRadius="lg" variant="left-accent" alignItems="start">
              <AlertIcon mt={0.5} />
              <Box flex={1} minW={0}>
                <AlertTitle fontSize="sm" mb={1}>
                  تعذّر إتمام الطلب
                </AlertTitle>
                <Text fontSize="sm" whiteSpace="pre-wrap" lineHeight="1.75">
                  {error}
                </Text>
              </Box>
            </Alert>
          </MessageRow>
        )}

        {!thinking && !error && reply && (
          <MessageRow role="assistant">
            <Text fontSize="xs" fontWeight="semibold" color={muted} mb={1.5}>
              المساعد
            </Text>
            <MarkdownText text={reply} />
          </MessageRow>
        )}

        {children && (
          <Box px={{ base: 2, sm: 3, md: 6 }} py={{ base: 3, md: 4 }} borderTopWidth="1px" borderColor={border}>
            <Box maxW="3xl" mx="auto" w="full">
              {children}
            </Box>
          </Box>
        )}

        <Box ref={bottomRef} h={4} />
      </Box>

      {/* Input ثابت في الأسفل — مثل ChatGPT */}
      <Box
        px={{ base: 2, sm: 3, md: 6 }}
        py={{ base: 3, md: 4 }}
        pb={{ base: "max(12px, env(safe-area-inset-bottom))", md: 4 }}
        borderTopWidth="1px"
        borderColor={border}
        bg={composerBg}
        flexShrink={0}
      >
        <Box maxW="3xl" mx="auto">
          {!isEmpty && botInfo?.quick_examples?.length > 0 && (
            <Wrap spacing={2} mb={3} justify="center">
              {botInfo.quick_examples.slice(0, 3).map((ex) => (
                <WrapItem key={ex.label}>
                  <Button
                    size="xs"
                    variant="outline"
                    borderRadius="full"
                    borderColor={border}
                    bg={chipBg}
                    fontWeight="normal"
                    fontSize="10px"
                    px={3}
                    h={7}
                    _hover={{ borderColor: ACCENT, color: ACCENT }}
                    onClick={() => onSend(ex.message)}
                    isDisabled={thinking}
                  >
                    {ex.label}
                  </Button>
                </WrapItem>
              ))}
            </Wrap>
          )}

          <Flex
            align="flex-end"
            gap={2}
            px={{ base: 2, md: 3 }}
            py={2}
            borderWidth="1px"
            borderColor={composerBorder}
            borderRadius={{ base: "xl", md: "2xl" }}
            boxShadow={composerShadow}
            bg={inputWrapBg}
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="صف الامتحان: عدد الأسئلة، الفصل، الدرس…"
              rows={1}
              minH="44px"
              maxH="160px"
              resize="none"
              border="none"
              px={1}
              py={2}
              fontSize={{ base: "sm", md: "sm" }}
              lineHeight="1.5"
              isDisabled={thinking}
              _focus={{ boxShadow: "none" }}
              _placeholder={{ color: "gray.400" }}
            />
            <IconButton
              aria-label="إرسال"
              icon={<Icon as={FiSend} />}
              size={{ base: "md", md: "sm" }}
              borderRadius="xl"
              bg={input.trim() && !thinking ? ACCENT : sendInactiveBg}
              color={input.trim() && !thinking ? "white" : muted}
              _hover={{
                bg: input.trim() && !thinking ? "#004494" : sendInactiveHoverBg,
              }}
              onClick={handleSend}
              isLoading={thinking}
              isDisabled={!input.trim()}
              flexShrink={0}
              mb={0.5}
            />
          </Flex>
          <Text fontSize="10px" color={muted} textAlign="center" mt={2} display={{ base: "none", sm: "block" }}>
            Enter للإرسال · Shift+Enter سطر جديد · حتى {botInfo?.max_questions || 100} سؤال
          </Text>
        </Box>
      </Box>
    </Flex>
  );
}
