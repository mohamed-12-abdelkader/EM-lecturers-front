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
  const bubbleBg = useColorModeValue("gray.100", "whiteAlpha.100");

  return (
    <Flex justify="flex-end" px={{ base: 3, md: 4 }} py={3} w="full">
      <Box maxW={{ base: "100%", md: "82%" }} w="full">
        <Box bg={bubbleBg} borderRadius="2xl" px={4} py={3}>
          {children}
        </Box>
      </Box>
    </Flex>
  );
}

function AssistantBlock({ children }) {
  const assistantIconBg = useColorModeValue(ACCENT, "blue.400");
  const titleColor = useColorModeValue("gray.800", "gray.100");

  return (
    <Box px={{ base: 3, md: 4 }} py={4} w="full">
      <HStack spacing={3} align="start" mb={3}>
        <Flex boxSize={8} borderRadius="full" bg={assistantIconBg} align="center" justify="center" flexShrink={0}>
          <Icon as={FiMessageSquare} boxSize={3.5} color="white" />
        </Flex>
        <Text fontSize="sm" fontWeight="semibold" color={titleColor} pt={1.5}>
          المساعد
        </Text>
      </HStack>
      <Box pr={{ base: 0, md: 2 }}>{children}</Box>
    </Box>
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
      pb={2}
      borderTopWidth="1px"
      borderColor={border}
      bg={composerBg}
      flexShrink={0}
      sx={{ pb: "max(8px, env(safe-area-inset-bottom, 8px))" }}
    >
      <Box maxW="48rem" mx="auto" w="full">
        {showQuickExamples && quickExamples?.length > 0 && (
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
                px={2.5}
                h="26px"
                minH="26px"
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
          borderRadius="xl"
          borderWidth="1px"
          borderColor={composerBorder}
          bg={inputWrapBg}
          boxShadow={composerShadow}
          overflow="hidden"
          _focusWithin={{
            borderColor: ACCENT,
            boxShadow: "0 0 0 1px rgba(49, 130, 206, 0.12)",
          }}
        >
          <Flex align="center" gap={1.5} py={1} px={1.5} pl={2}>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="صف الامتحان: عدد الأسئلة، الفصل، الدرس…"
              rows={1}
              minH="36px"
              maxH="120px"
              resize="none"
              border="none"
              px={1}
              py={1.5}
              fontSize="sm"
              lineHeight="1.5"
              flex={1}
              isDisabled={thinking}
              _focus={{ boxShadow: "none" }}
              _placeholder={{ color: "gray.400" }}
            />
            <IconButton
              aria-label="إرسال"
              icon={<FiSend />}
              size="sm"
              borderRadius="full"
              colorScheme="blue"
              bg={canSend ? ACCENT : undefined}
              onClick={onSend}
              isLoading={thinking}
              isDisabled={!canSend}
              flexShrink={0}
              _hover={canSend ? { bg: "#004494" } : undefined}
            />
          </Flex>
        </Box>

        <Flex justify="center" align="center" mt={1} fontSize="10px" color={muted} gap={2}>
          <Text display={{ base: "none", md: "block" }}>
            Enter إرسال · Shift+Enter سطر · حتى {maxQuestions} سؤال
          </Text>
          <Text display={{ base: "block", md: "none" }}>{input.trim().length} حرف</Text>
        </Flex>
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
          <Flex flex={1} align="center" justify="center" minH="full" px={3} py={8} textAlign="center">
            <VStack spacing={5} maxW="480px">
              <Flex w={14} h={14} borderRadius="2xl" bg={accentBg} align="center" justify="center">
                <Icon as={MdQuiz} color={ACCENT} boxSize={7} />
              </Flex>
              <Box>
                <Text fontSize="lg" fontWeight="semibold" color={ink} mb={2}>
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
                      size="sm"
                      variant="outline"
                      borderRadius="xl"
                      borderColor={border}
                      bg={chipBg}
                      fontWeight="normal"
                      fontSize="sm"
                      h="auto"
                      py={3}
                      whiteSpace="normal"
                      onClick={() => onSend(ex.message)}
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
          <Box flex={1} w="full" maxW="48rem" mx="auto">
            {currentRequest && (
              <UserBubble>
                <MarkdownText text={currentRequest} />
              </UserBubble>
            )}

            {thinking && (
              <AssistantBlock>
                <HStack spacing={3}>
                  <Spinner size="sm" color={ACCENT} thickness="2px" />
                  <Text fontSize="sm" color={muted}>
                    جاري تحليل الطلب واختيار الأسئلة…
                  </Text>
                </HStack>
              </AssistantBlock>
            )}

            {!thinking && error && (
              <AssistantBlock>
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
              </AssistantBlock>
            )}

            {!thinking && !error && reply && (
              <AssistantBlock>
                <MarkdownText text={reply} />
              </AssistantBlock>
            )}

            {children && (
              <Box px={{ base: 2, md: 4 }} py={{ base: 3, md: 4 }} borderTopWidth="1px" borderColor={border}>
                {children}
              </Box>
            )}
          </Box>
        )}

        <Box ref={bottomRef} h={4} />
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
