import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Textarea,
  Spinner,
  useColorModeValue,
  Icon,
  IconButton,
  Alert,
  AlertIcon,
  AlertTitle,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { FiSend, FiMessageSquare } from "react-icons/fi";
import { MdQuiz } from "react-icons/md";
import { renderMarkdownInline } from "../examBuilderUtils";
import { ACCENT, ACCENT_LIGHT } from "../examBuilderTheme";

function MarkdownText({ text, fontSize = "sm" }) {
  const textColor = useColorModeValue("gray.700", "gray.100");
  const boldColor = useColorModeValue("gray.900", "white");
  return (
    <Text fontSize={fontSize} color={textColor} lineHeight="1.85" wordBreak="break-word">
      {renderMarkdownInline(text).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <Text as="span" key={i} fontWeight="semibold" color={boldColor}>
            {part.slice(2, -2)}
          </Text>
        ) : (
          <Text as="span" key={i} whiteSpace="pre-wrap">
            {part}
          </Text>
        ),
      )}
    </Text>
  );
}

function UserBubble({ children }) {
  const bubbleBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const bubbleBorder = useColorModeValue("blue.100", "whiteAlpha.200");

  return (
    <Flex justify="flex-end" px={{ base: 2.5, md: 4 }} py={2} w="full">
      <Box
        maxW={{ base: "92%", md: "82%" }}
        w="auto"
        bg={bubbleBg}
        borderWidth="1px"
        borderColor={bubbleBorder}
        borderRadius="2xl"
        borderBottomRightRadius="md"
        px={3.5}
        py={2.5}
      >
        {children}
      </Box>
    </Flex>
  );
}

function AssistantBlock({ children }) {
  const assistantIconBg = useColorModeValue(ACCENT, "blue.400");
  const titleColor = useColorModeValue("gray.800", "gray.100");
  const thinkingBg = useColorModeValue("gray.50", "whiteAlpha.50");

  return (
    <Box px={{ base: 2.5, md: 4 }} py={3} w="full">
      <HStack spacing={2.5} align="center" mb={2.5}>
        <Flex boxSize={7} borderRadius="full" bg={assistantIconBg} align="center" justify="center" flexShrink={0}>
          <Icon as={FiMessageSquare} boxSize={3} color="white" />
        </Flex>
        <Text fontSize="xs" fontWeight="700" color={titleColor}>
          المساعد
        </Text>
      </HStack>
      <Box data-thinking-bg={thinkingBg}>{children}</Box>
    </Box>
  );
}

function ThinkingRow() {
  const muted = useColorModeValue("gray.500", "gray.400");
  const bg = useColorModeValue("gray.50", "whiteAlpha.50");
  return (
    <HStack spacing={3} px={3} py={2.5} borderRadius="xl" bg={bg}>
      <Spinner size="sm" color={ACCENT} thickness="2px" />
      <Text fontSize="sm" color={muted}>
        جاري تحليل الطلب واختيار الأسئلة…
      </Text>
    </HStack>
  );
}

function ChatComposer({
  input,
  setInput,
  onKeyDown,
  onSend,
  thinking,
  border,
  composerBg,
  composerBorder,
  inputWrapBg,
  muted,
  chipBg,
  quickExamples,
  showQuickExamples,
  maxQuestions = 100,
}) {
  const composerShadow = useColorModeValue(
    "0 2px 12px rgba(15, 23, 42, 0.06)",
    "0 2px 12px rgba(0, 0, 0, 0.25)",
  );
  const canSend = input.trim() && !thinking;

  return (
    <Box
      px={{ base: 2, md: 3 }}
      pt={2}
      borderTopWidth="1px"
      borderColor={border}
      bg={composerBg}
      flexShrink={0}
      sx={{ pb: "max(10px, env(safe-area-inset-bottom, 10px))" }}
    >
      <Box maxW="48rem" mx="auto" w="full">
        {showQuickExamples && quickExamples?.length > 0 && (
          <Flex
            gap={1.5}
            mb={2}
            overflowX="auto"
            pb={0.5}
            sx={{
              "&::-webkit-scrollbar": { display: "none" },
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
            }}
          >
            {quickExamples.slice(0, 4).map((ex) => (
              <Button
                key={ex.label}
                size="xs"
                variant="outline"
                borderRadius="full"
                borderColor={border}
                bg={chipBg}
                fontWeight="normal"
                fontSize="11px"
                px={3}
                h="30px"
                minH="30px"
                flexShrink={0}
                whiteSpace="nowrap"
                onClick={() => onSend(ex.message)}
                isDisabled={thinking}
                _hover={{ borderColor: ACCENT, color: ACCENT }}
              >
                {ex.label}
              </Button>
            ))}
          </Flex>
        )}

        <Box
          borderRadius="2xl"
          borderWidth="1px"
          borderColor={composerBorder}
          bg={inputWrapBg}
          boxShadow={composerShadow}
          overflow="hidden"
          _focusWithin={{
            borderColor: ACCENT,
            boxShadow: "0 0 0 1px rgba(49, 130, 206, 0.15)",
          }}
        >
          <Flex align="flex-end" gap={1.5} py={1.5} px={1.5} pl={2.5}>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="صف الامتحان: عدد الأسئلة، الفصل، الدرس…"
              rows={1}
              minH="40px"
              maxH="120px"
              resize="none"
              border="none"
              px={1}
              py={2}
              fontSize="16px"
              lineHeight="1.5"
              flex={1}
              isDisabled={thinking}
              _focus={{ boxShadow: "none" }}
              _placeholder={{ color: "gray.400", fontSize: "sm" }}
            />
            <IconButton
              aria-label="إرسال"
              icon={<FiSend />}
              size="md"
              borderRadius="full"
              colorScheme="blue"
              bg={canSend ? ACCENT : undefined}
              onClick={onSend}
              isLoading={thinking}
              isDisabled={!canSend}
              flexShrink={0}
              minW="40px"
              h="40px"
              _hover={canSend ? { bg: "#004494" } : undefined}
            />
          </Flex>
        </Box>

        <Text
          display={{ base: "none", md: "block" }}
          textAlign="center"
          mt={1}
          fontSize="10px"
          color={muted}
        >
          Enter إرسال · Shift+Enter سطر · حتى {maxQuestions} سؤال
        </Text>
      </Box>
    </Box>
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
  const bottomRef = useRef(null);

  const pageBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const composerBg = useColorModeValue("white", "gray.800");
  const composerBorder = useColorModeValue("gray.200", "gray.600");
  const chipBg = useColorModeValue("white", "gray.700");
  const accentBg = useColorModeValue(ACCENT_LIGHT, "blue.900");
  const inputWrapBg = useColorModeValue("white", "gray.800");
  const ink = useColorModeValue("gray.900", "white");
  const proposalShellBg = useColorModeValue("gray.50", "gray.900");

  const isEmpty = !currentRequest && !reply && !error && !thinking && !children;
  const showWelcome = isEmpty && botInfo?.welcome_message;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentRequest, reply, error, thinking]);

  const handleSend = (preset) => {
    const text = (typeof preset === "string" ? preset : input).trim();
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
      borderWidth={{ base: 0, md: "1px" }}
      borderColor={border}
      borderRadius={{ base: "xl", md: "2xl" }}
      overflow="hidden"
      boxShadow={{ base: "none", md: "sm" }}
    >
      <Box
        flex={1}
        minH={0}
        overflowY="auto"
        overflowX="hidden"
        display="flex"
        flexDirection="column"
        sx={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
      >
        {showWelcome && (
          <Flex flex={1} align="center" justify="center" minH="full" px={4} py={6} textAlign="center">
            <VStack spacing={4} maxW="420px" w="full">
              <Flex w={14} h={14} borderRadius="2xl" bg={accentBg} align="center" justify="center">
                <Icon as={MdQuiz} color={ACCENT} boxSize={7} />
              </Flex>
              <Box>
                <Text fontSize={{ base: "md", md: "lg" }} fontWeight="800" color={ink} mb={2}>
                  {botInfo?.name || "مساعد إنشاء الامتحانات"}
                </Text>
                <Text fontSize="sm" color={muted} lineHeight="1.8">
                  {botInfo?.description ||
                    "صف الامتحان بالعربية وسيتم اختيار أسئلة عشوائية من بنك أسئلتك"}
                </Text>
              </Box>
              {botInfo?.quick_examples?.length > 0 && (
                <VStack w="full" spacing={2} align="stretch">
                  {botInfo.quick_examples.map((ex) => (
                    <Button
                      key={ex.label}
                      size="md"
                      variant="outline"
                      borderRadius="xl"
                      borderColor={border}
                      bg={chipBg}
                      fontWeight="600"
                      fontSize="sm"
                      h="auto"
                      minH="48px"
                      py={3}
                      whiteSpace="normal"
                      onClick={() => handleSend(ex.message)}
                      isDisabled={thinking}
                      _hover={{ borderColor: ACCENT, color: ACCENT }}
                    >
                      {ex.label}
                    </Button>
                  ))}
                </VStack>
              )}
            </VStack>
          </Flex>
        )}

        {!showWelcome && (
          <Box flex={1} w="full" maxW="48rem" mx="auto" pb={2}>
            {currentRequest && (
              <UserBubble>
                <MarkdownText text={currentRequest} />
              </UserBubble>
            )}

            {thinking && (
              <AssistantBlock>
                <ThinkingRow />
              </AssistantBlock>
            )}

            {!thinking && error && (
              <AssistantBlock>
                <Alert status="error" borderRadius="xl" variant="left-accent" alignItems="start">
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
              </AssistantBlock>
            )}

            {!thinking && !error && reply && (
              <AssistantBlock>
                <MarkdownText text={reply} />
              </AssistantBlock>
            )}

            {children && (
              <Box
                mx={{ base: 2, md: 4 }}
                my={{ base: 2, md: 3 }}
                borderWidth="1px"
                borderColor={border}
                borderRadius="2xl"
                bg={proposalShellBg}
                overflow="hidden"
              >
                {children}
              </Box>
            )}
          </Box>
        )}

        <Box ref={bottomRef} h={3} />
      </Box>

      <ChatComposer
        input={input}
        setInput={setInput}
        onKeyDown={handleKeyDown}
        onSend={handleSend}
        thinking={thinking}
        border={border}
        composerBg={composerBg}
        composerBorder={composerBorder}
        inputWrapBg={inputWrapBg}
        muted={muted}
        chipBg={chipBg}
        quickExamples={botInfo?.quick_examples}
        showQuickExamples={!isEmpty}
        maxQuestions={botInfo?.max_questions || 100}
      />
    </Flex>
  );
}
