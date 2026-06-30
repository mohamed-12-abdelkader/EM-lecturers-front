import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Avatar,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Collapse,
  Image,
  Wrap,
  WrapItem,
  IconButton,
} from "@chakra-ui/react";
import {
  FaRobot,
  FaUserGraduate,
  FaSearch,
  FaBook,
  FaChalkboardTeacher,
  FaArrowUp,
  FaChevronDown,
  FaChevronUp,
  FaArrowRight,
} from "react-icons/fa";
import {
  fetchTeacherStudentChats,
  fetchTeacherStudentChatMessages,
  resolveUploadUrl,
} from "../../api/scientificChatbotApi";
import baseUrl from "../../api/baseUrl";

const CHATS_PAGE = 30;
const MESSAGES_PAGE = 40;

function formatDateTime(value) {
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

function chatKey(chat) {
  return `${chat.student_id}-${chat.course_id ?? "teacher"}`;
}

function RetrievedChunks({ chunks, expanded, onToggle }) {
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

function MessageTurn({ item, expandedChunks, onToggleChunks }) {
  const studentBubble = useColorModeValue("orange.500", "orange.600");
  const botBg = useColorModeValue("white", "gray.800");
  const botBorder = useColorModeValue("gray.200", "gray.600");
  const muted = useColorModeValue("gray.500", "gray.400");
  const images = Array.isArray(item.images) ? item.images : [];

  return (
    <VStack align="stretch" spacing={3} w="full">
      <Flex justify="flex-end" align="end" gap={3} w="full">
        <Box maxW={{ base: "90%", md: "78%" }}>
          <Text fontSize="xs" color={muted} mb={1.5} textAlign="left">
            {item.student_name || "الطالب"} · {formatDateTime(item.created_at)}
          </Text>
          <Box
            px={4}
            py={3}
            borderRadius="2xl"
            borderBottomRightRadius="6px"
            bgGradient={`linear(to-l, ${studentBubble}, orange.600)`}
            color="white"
            boxShadow="0 6px 20px -6px rgba(249,115,22,0.4)"
          >
            <Text fontSize="sm" whiteSpace="pre-wrap" lineHeight="1.75">
              {item.question}
            </Text>
            {item.rewritten_question && item.rewritten_question !== item.question && (
              <Text fontSize="xs" mt={2} opacity={0.9} fontStyle="italic">
                أُعيد صياغته: {item.rewritten_question}
              </Text>
            )}
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
        <Avatar
          size="sm"
          name={item.student_name}
          src={resolveUploadUrl(item.student_avatar)}
          bg="orange.400"
        />
      </Flex>

      <Flex justify="flex-start" align="end" gap={3} w="full">
        <Flex
          boxSize={8}
          borderRadius="xl"
          bgGradient="linear(to-br, blue.500, blue.600)"
          align="center"
          justify="center"
          color="white"
          flexShrink={0}
        >
          <Icon as={FaRobot} boxSize={3.5} />
        </Flex>
        <Box maxW={{ base: "90%", md: "80%" }}>
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
            <Box position="absolute" top={0} right={0} bottom={0} w="3px" bg="blue.400" />
            <Text fontSize="sm" whiteSpace="pre-wrap" lineHeight="1.8" pr={1}>
              {item.answer || "—"}
            </Text>
            <RetrievedChunks
              chunks={item.retrieved_chunks}
              expanded={!!expandedChunks[item.id]}
              onToggle={() => onToggleChunks(item.id)}
            />
          </Box>
        </Box>
      </Flex>
    </VStack>
  );
}

export default function TeacherStudentChatsPanel({ initialCourseId = "" }) {
  const token = localStorage.getItem("token");
  const toast = useToast();

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [scopeFilter, setScopeFilter] = useState(
    initialCourseId ? String(initialCourseId) : "all"
  );

  useEffect(() => {
    if (initialCourseId) setScopeFilter(String(initialCourseId));
  }, [initialCourseId]);
  const [search, setSearch] = useState("");

  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [chatsOffset, setChatsOffset] = useState(0);
  const [hasMoreChats, setHasMoreChats] = useState(false);
  const [loadingMoreChats, setLoadingMoreChats] = useState(false);

  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [expandedChunks, setExpandedChunks] = useState({});

  const [mobileShowThread, setMobileShowThread] = useState(false);

  const panelBg = useColorModeValue("white", "gray.800");
  const sidebarBg = useColorModeValue("gray.50", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.300");
  const headingColor = useColorModeValue("gray.800", "white");
  const chatItemHover = useColorModeValue("blue.50", "whiteAlpha.100");
  const chatItemActive = useColorModeValue("blue.100", "blue.900");
  const pattern = useColorModeValue(
    "radial-gradient(circle at 1px 1px, rgba(59,130,246,0.06) 1px, transparent 0)",
    "radial-gradient(circle at 1px 1px, rgba(59,130,246,0.1) 1px, transparent 0)"
  );

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setCoursesLoading(true);
        const { data } = await baseUrl.get("api/course/my-courses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(Array.isArray(data?.courses) ? data.courses : []);
      } catch {
        setCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    })();
  }, [token]);

  const chatQueryParams = useMemo(() => {
    if (scopeFilter === "teacher") return { scope: "teacher" };
    if (scopeFilter === "all") return {};
    return { courseId: scopeFilter };
  }, [scopeFilter]);

  const loadChats = useCallback(
    async (offset = 0, append = false) => {
      if (!token) return;
      try {
        if (append) setLoadingMoreChats(true);
        else setChatsLoading(true);

        const list = await fetchTeacherStudentChats(
          { ...chatQueryParams, limit: CHATS_PAGE, offset },
          token
        );

        if (append) {
          setChats((prev) => [...prev, ...list]);
        } else {
          setChats(list);
        }
        setChatsOffset(offset + list.length);
        setHasMoreChats(list.length >= CHATS_PAGE);
      } catch (err) {
        const msg = err?.response?.data?.error || err?.message || "فشل تحميل المحادثات";
        if (!append) setChats([]);
        toast({ title: "خطأ", description: msg, status: "error", isClosable: true });
      } finally {
        setChatsLoading(false);
        setLoadingMoreChats(false);
      }
    },
    [token, chatQueryParams, toast]
  );

  useEffect(() => {
    setSelectedChat(null);
    setMessages([]);
    setMobileShowThread(false);
    loadChats(0, false);
  }, [loadChats]);

  const messageQueryParams = useMemo(() => {
    if (!selectedChat) return null;
    if (selectedChat.course_id == null) return { scope: "teacher" };
    return { courseId: selectedChat.course_id };
  }, [selectedChat]);

  const loadMessages = useCallback(
    async (beforeId = null, prepend = false) => {
      if (!token || !selectedChat || !messageQueryParams) return;
      try {
        if (prepend) setLoadingOlderMessages(true);
        else setMessagesLoading(true);

        const list = await fetchTeacherStudentChatMessages(
          selectedChat.student_id,
          { ...messageQueryParams, limit: MESSAGES_PAGE, beforeId },
          token
        );

        if (prepend) {
          setMessages((prev) => [...list, ...prev]);
        } else {
          setMessages(list);
        }
        setHasMoreMessages(list.length >= MESSAGES_PAGE);
      } catch (err) {
        const msg = err?.response?.data?.error || err?.message || "فشل تحميل الرسائل";
        if (!prepend) setMessages([]);
        toast({ title: "خطأ", description: msg, status: "error", isClosable: true });
      } finally {
        setMessagesLoading(false);
        setLoadingOlderMessages(false);
      }
    },
    [token, selectedChat, messageQueryParams, toast]
  );

  useEffect(() => {
    if (!selectedChat) return;
    setExpandedChunks({});
    loadMessages();
  }, [selectedChat, loadMessages]);

  const filteredChats = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(
      (c) =>
        (c.student_name || "").toLowerCase().includes(q) ||
        (c.course_name || "").toLowerCase().includes(q) ||
        (c.last_question || "").toLowerCase().includes(q)
    );
  }, [chats, search]);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setMobileShowThread(true);
  };

  const toggleChunks = (id) => {
    setExpandedChunks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sidebar = (
    <Flex
      direction="column"
      h="full"
      minH={{ base: "auto", md: "520px" }}
      bg={sidebarBg}
      borderLeft={{ md: "1px solid" }}
      borderColor={borderColor}
      display={{ base: mobileShowThread ? "none" : "flex", md: "flex" }}
      w={{ base: "full", md: "320px", lg: "360px" }}
      flexShrink={0}
    >
      <Box p={4} borderBottom="1px solid" borderColor={borderColor}>
        <Text fontWeight="black" fontSize="sm" color={headingColor} mb={3}>
          محادثات الطلاب مع AI
        </Text>
        <InputGroup size="sm" mb={3}>
          <InputLeftElement pointerEvents="none">
            <Icon as={FaSearch} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="بحث بالطالب أو الكورس..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            borderRadius="xl"
            bg={panelBg}
          />
        </InputGroup>
        <Select
          size="sm"
          borderRadius="xl"
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value)}
          bg={panelBg}
          isDisabled={coursesLoading}
        >
          <option value="all">كل المحادثات</option>
          <option value="teacher">نطاق المدرس العام</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title || c.name}
            </option>
          ))}
        </Select>
      </Box>

      <Box flex={1} overflowY="auto" p={2}>
        {chatsLoading ? (
          <Center py={12}>
            <Spinner color="blue.500" />
          </Center>
        ) : filteredChats.length === 0 ? (
          <Center py={12} px={4} flexDirection="column" gap={2}>
            <Icon as={FaUserGraduate} boxSize={8} color="gray.400" />
            <Text fontSize="sm" color={muted} textAlign="center" lineHeight="1.7">
              لا توجد محادثات مسجّلة بعد. تظهر هنا أسئلة الطلاب التي أجاب عليها المساعد العلمي.
            </Text>
          </Center>
        ) : (
          <VStack spacing={1.5} align="stretch">
            {filteredChats.map((chat) => {
              const active = selectedChat && chatKey(selectedChat) === chatKey(chat);
              return (
                <Box
                  key={chatKey(chat)}
                  as="button"
                  type="button"
                  textAlign="right"
                  w="full"
                  p={3}
                  borderRadius="xl"
                  bg={active ? chatItemActive : "transparent"}
                  border="1px solid"
                  borderColor={active ? "blue.300" : "transparent"}
                  _hover={{ bg: chatItemHover }}
                  transition="all 0.15s"
                  onClick={() => handleSelectChat(chat)}
                >
                  <HStack spacing={3} align="start">
                    <Avatar
                      size="sm"
                      name={chat.student_name}
                      src={resolveUploadUrl(chat.student_avatar)}
                      bg="orange.400"
                    />
                    <Box flex={1} minW={0}>
                      <HStack justify="space-between" mb={0.5}>
                        <Text fontSize="sm" fontWeight="bold" noOfLines={1} color={headingColor}>
                          {chat.student_name || `طالب #${chat.student_id}`}
                        </Text>
                        <Text fontSize="0.65rem" color={muted} flexShrink={0}>
                          {formatDateTime(chat.last_at)}
                        </Text>
                      </HStack>
                      <HStack spacing={1.5} mb={1.5} flexWrap="wrap">
                        {chat.course_id == null ? (
                          <Badge colorScheme="purple" fontSize="0.55rem" borderRadius="full">
                            <Icon as={FaChalkboardTeacher} boxSize={2} ml={1} />
                            نطاق المدرس
                          </Badge>
                        ) : (
                          <Badge colorScheme="blue" fontSize="0.55rem" borderRadius="full">
                            <Icon as={FaBook} boxSize={2} ml={1} />
                            {chat.course_name || `كورس #${chat.course_id}`}
                          </Badge>
                        )}
                        <Badge colorScheme="gray" fontSize="0.55rem" borderRadius="full">
                          {chat.message_count} رسالة
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color={muted} noOfLines={2} lineHeight="1.55">
                        {chat.last_question || "—"}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              );
            })}
            {hasMoreChats && !search.trim() && (
              <Button
                size="sm"
                variant="ghost"
                colorScheme="blue"
                onClick={() => loadChats(chatsOffset, true)}
                isLoading={loadingMoreChats}
                borderRadius="xl"
              >
                تحميل المزيد
              </Button>
            )}
          </VStack>
        )}
      </Box>
    </Flex>
  );

  const thread = (
    <Flex
      direction="column"
      flex={1}
      minW={0}
      minH={{ base: "420px", md: "520px" }}
      display={{ base: mobileShowThread ? "flex" : "none", md: "flex" }}
    >
      {!selectedChat ? (
        <Center flex={1} flexDirection="column" gap={3} px={6} bg={panelBg}>
          <Flex
            boxSize={14}
            borderRadius="2xl"
            bgGradient="linear(to-br, blue.500, blue.600)"
            align="center"
            justify="center"
            color="white"
          >
            <Icon as={FaRobot} boxSize={7} />
          </Flex>
          <Text fontWeight="bold" color={headingColor}>
            اختر محادثة للمراجعة
          </Text>
          <Text fontSize="sm" color={muted} textAlign="center" maxW="md" lineHeight="1.8">
            راجع أسئلة الطلاب وردود المساعد العلمي والمصادر المسترجعة من موادك.
          </Text>
        </Center>
      ) : (
        <>
          <Box
            px={4}
            py={3}
            borderBottom="1px solid"
            borderColor={borderColor}
            bg={panelBg}
            flexShrink={0}
          >
            <HStack spacing={3}>
              <IconButton
                aria-label="رجوع"
                icon={<FaArrowRight />}
                size="sm"
                variant="ghost"
                display={{ base: "flex", md: "none" }}
                onClick={() => setMobileShowThread(false)}
              />
              <Avatar
                size="sm"
                name={selectedChat.student_name}
                src={resolveUploadUrl(selectedChat.student_avatar)}
              />
              <Box minW={0} flex={1}>
                <Text fontWeight="bold" fontSize="sm" noOfLines={1}>
                  {selectedChat.student_name}
                </Text>
                <Text fontSize="xs" color={muted} noOfLines={1}>
                  {selectedChat.course_id == null
                    ? "أسئلة على كل مواد المدرس"
                    : selectedChat.course_name}
                </Text>
              </Box>
            </HStack>
          </Box>

          <Box
            flex={1}
            overflowY="auto"
            px={{ base: 3, md: 5 }}
            py={4}
            bg={useColorModeValue("gray.50", "gray.900")}
            backgroundImage={pattern}
            backgroundSize="22px 22px"
          >
            {hasMoreMessages && (
              <Center mb={4}>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="blue"
                  borderRadius="full"
                  leftIcon={<FaArrowUp />}
                  onClick={() => loadMessages(messages[0]?.id, true)}
                  isLoading={loadingOlderMessages}
                  bg={panelBg}
                >
                  رسائل أقدم
                </Button>
              </Center>
            )}

            {messagesLoading ? (
              <Center py={16}>
                <Spinner color="blue.500" />
              </Center>
            ) : messages.length === 0 ? (
              <Center py={16}>
                <Text color={muted} fontSize="sm">
                  لا توجد رسائل في هذه المحادثة
                </Text>
              </Center>
            ) : (
              <VStack spacing={6} align="stretch" pb={4}>
                {messages.map((item) => (
                  <MessageTurn
                    key={item.id}
                    item={item}
                    expandedChunks={expandedChunks}
                    onToggleChunks={toggleChunks}
                  />
                ))}
              </VStack>
            )}
          </Box>
        </>
      )}
    </Flex>
  );

  return (
    <Flex
      direction={{ base: "column", md: "row" }}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="2xl"
      overflow="hidden"
      bg={panelBg}
      minH={{ base: "560px", md: "520px" }}
      boxShadow="md"
    >
      {sidebar}
      {thread}
    </Flex>
  );
}
