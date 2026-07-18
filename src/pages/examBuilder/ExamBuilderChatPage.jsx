import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  useColorModeValue,
  Icon,
  Badge,
  useToast,
  useDisclosure,
  Collapse,
  Button,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  IconButton,
  useBreakpointValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
} from "@chakra-ui/react";
import { MdQuiz, MdExpandMore, MdExpandLess } from "react-icons/md";
import { FiBookOpen, FiClock, FiMenu } from "react-icons/fi";
import { FaFilePdf } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import UserType from "../../Hooks/auth/userType";
  import {
  fetchExamBuilderInfo,
  fetchExamBuilderCatalog,
  fetchExamBuilderHistory,
  fetchExamBuilderSession,
  sendExamBuilderChat,
  regenerateExamBuilderSession,
  adjustExamBuilderSession,
  approveExamBuilderSession,
  normalizeChatResponse,
  mapHistoryItemToSession,
  apiErrorMessage,
} from "../../api/examBuilderChatbotApi";
import {
  resolveProposalQuestions,
  countCatalogQuestions,
  historyItemToProposalState,
} from "./examBuilderUtils";
import { ACCENT } from "./examBuilderTheme";
import ExamBuilderChatWorkspace from "./components/ExamBuilderChatWorkspace";
import ExamProposalPanel from "./components/ExamProposalPanel";
import ExamBuilderHistoryPanel from "./components/ExamBuilderHistoryPanel";
import ApproveExamModal from "./components/ApproveExamModal";
import { exportExamBuilderQuestionsPdf } from "./exportExamBuilderPdf";

const HISTORY_PAGE_SIZE = 20;
const NAV_OFFSET = { base: "72px", md: "88px" };

function CatalogSidebarPanel({ catalog, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const rowHover = useColorModeValue("gray.50", "gray.700");
  const itemBg = useColorModeValue("gray.50", "gray.900");
  const iconWrapBg = useColorModeValue("blue.50", "blue.900");

  if (!catalog?.length) return null;

  const total = countCatalogQuestions(catalog);

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={border}
      borderRadius={{ base: "lg", lg: "xl" }}
      overflow="hidden"
      boxShadow="sm"
      flexShrink={0}
    >
      <Button
        variant="ghost"
        w="full"
        justifyContent="space-between"
        px={4}
        py={3}
        h="auto"
        borderRadius="none"
        onClick={() => setOpen((v) => !v)}
        _hover={{ bg: rowHover }}
      >
        <HStack spacing={2} minW={0}>
          <Flex w={8} h={8} borderRadius="lg" bg={iconWrapBg} align="center" justify="center" flexShrink={0}>
            <Icon as={FiBookOpen} color={ACCENT} boxSize={3.5} />
          </Flex>
          <Box textAlign="right" minW={0}>
            <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
              فهرس البنك
            </Text>
            <Text fontSize="10px" color={muted}>
              {catalog.length} فصل · {total} سؤال
            </Text>
          </Box>
        </HStack>
        <Icon as={open ? MdExpandLess : MdExpandMore} color={muted} boxSize={4} flexShrink={0} />
      </Button>
      <Collapse in={open}>
        <Box px={3} pb={3} maxH={{ base: "180px", lg: "200px" }} overflowY="auto">
          <VStack align="stretch" spacing={2}>
            {catalog.map((chapter) => (
              <Box key={chapter.id} px={3} py={2} bg={itemBg} borderRadius="lg">
                <Flex justify="space-between" align="center" mb={1} gap={2}>
                  <Text fontSize="xs" fontWeight="semibold" noOfLines={1} flex={1}>
                    {chapter.name}
                  </Text>
                  <Badge variant="subtle" colorScheme="blue" fontSize="10px" borderRadius="md" flexShrink={0}>
                    {chapter.question_count}
                  </Badge>
                </Flex>
                {chapter.subject_name && (
                  <Text fontSize="10px" color={muted} mb={1} noOfLines={1}>
                    {chapter.subject_name}
                  </Text>
                )}
                {(chapter.lessons || []).slice(0, 5).map((lesson) => (
                  <Flex key={lesson.id} justify="space-between" py={0.5} gap={2}>
                    <Text fontSize="10px" color={muted} noOfLines={1} flex={1}>
                      {lesson.name}
                    </Text>
                    <Text fontSize="10px" color={muted} flexShrink={0}>
                      {lesson.question_count}
                    </Text>
                  </Flex>
                ))}
              </Box>
            ))}
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
}

function SidebarPanels({
  history,
  historyLoading,
  historyLoadingMore,
  historyPagination,
  activeSessionId,
  historyFilter,
  onStatusFilterChange,
  onSelectHistoryItem,
  onLoadMoreHistory,
  catalog,
  fullHeight = false,
}) {
  return (
    <VStack spacing={3} align="stretch" h={fullHeight ? "full" : "auto"} minH={fullHeight ? 0 : undefined}>
      <Box flex={fullHeight ? 1 : undefined} minH={fullHeight ? 0 : undefined} display="flex" flexDirection="column">
        <ExamBuilderHistoryPanel
          sidebar
          fullHeight={fullHeight}
          history={history}
          loading={historyLoading}
          loadingMore={historyLoadingMore}
          hasMore={historyPagination.has_more}
          activeSessionId={activeSessionId}
          statusFilter={historyFilter}
          onStatusFilterChange={onStatusFilterChange}
          onSelect={onSelectHistoryItem}
          onLoadMore={onLoadMoreHistory}
        />
      </Box>
      <CatalogSidebarPanel catalog={catalog} />
    </VStack>
  );
}

export default function ExamBuilderChatPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [, , isTeacher] = UserType();
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const sidebarDrawer = useDisclosure();

  const [loading, setLoading] = useState(true);
  const [botInfo, setBotInfo] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [currentRequest, setCurrentRequest] = useState("");
  const [session, setSession] = useState(null);
  const [proposalQuestions, setProposalQuestions] = useState([]);
  const [sessionReply, setSessionReply] = useState("");
  const [chatError, setChatError] = useState("");
  const [actions, setActions] = useState({
    can_approve: false,
    can_regenerate: false,
    can_adjust: false,
  });
  const [proposalReadOnly, setProposalReadOnly] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("");
  const [historyPagination, setHistoryPagination] = useState({
    offset: 0,
    has_more: false,
  });

  const approveDisclosure = useDisclosure();
  const exportPdfDisclosure = useDisclosure();

  const pageBg = useColorModeValue("gray.50", "gray.900");

  const hasProposal = proposalQuestions.length > 0 && session;
  const catalogTotal = countCatalogQuestions(catalog);

  const loadHistory = useCallback(
    async ({ offset = 0, append = false, status = historyFilter } = {}) => {
      try {
        if (append) setHistoryLoadingMore(true);
        else setHistoryLoading(true);

        const params = { limit: HISTORY_PAGE_SIZE, offset };
        if (status) params.status = status;

        const data = await fetchExamBuilderHistory(params);
        setHistory((prev) => (append ? [...prev, ...data.history] : data.history));
        setHistoryPagination({
          offset: offset + data.history.length,
          has_more: data.pagination?.has_more ?? false,
        });
      } catch {
        if (!append) setHistory([]);
      } finally {
        setHistoryLoading(false);
        setHistoryLoadingMore(false);
      }
    },
    [historyFilter]
  );

  const loadInitial = useCallback(async () => {
    try {
      setLoading(true);
      const [info, catalogData] = await Promise.all([
        fetchExamBuilderInfo(),
        fetchExamBuilderCatalog().catch(() => []),
      ]);
      setBotInfo(info);
      setCatalog(catalogData);
    } catch (err) {
      toast({
        title: "تعذر تحميل مساعد الامتحانات",
        description: apiErrorMessage(err),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isTeacher) loadInitial();
  }, [isTeacher, loadInitial]);

  useEffect(() => {
    if (isTeacher) loadHistory({ offset: 0 });
  }, [historyFilter, isTeacher, loadHistory]);

  const applyProposalState = ({
    session: nextSession,
    questions,
    reply,
    actions: nextActions,
    readOnly,
    requestText,
  }) => {
    setChatError("");
    setSession(nextSession);
    setProposalQuestions(questions);
    setSessionReply(reply || "");
    setActions(nextActions || { can_approve: false, can_regenerate: false, can_adjust: false });
    setProposalReadOnly(!!readOnly);
    setActiveSessionId(nextSession?.id ?? null);
    if (requestText !== undefined) setCurrentRequest(requestText);
  };

  const clearProposal = () => {
    setSession(null);
    setProposalQuestions([]);
    setSessionReply("");
    setChatError("");
    setActions({ can_approve: false, can_regenerate: false, can_adjust: false });
    setProposalReadOnly(false);
    setActiveSessionId(null);
  };

  const applyChatResponse = (data, requestText) => {
    const normalized = normalizeChatResponse(data);

    setChatError("");
    setSessionReply(normalized.reply || "");
    if (requestText) setCurrentRequest(requestText);

    if (normalized.session && normalized.questions.length) {
      applyProposalState({
        session: normalized.session,
        questions: normalized.questions,
        reply: normalized.reply,
        actions: normalized.actions,
        readOnly: normalized.session.status !== "proposed",
        requestText,
      });
    } else if (data.status === "message_only") {
      clearProposal();
    }

    loadHistory({ offset: 0 });
  };

  const handleSelectHistoryItem = async (item) => {
    const sid = item.session_id;
    setActiveSessionId(sid);
    if (isMobile) sidebarDrawer.onClose();

    try {
      const { item: fresh, questions } = await fetchExamBuilderSession(sid);
      const source = fresh || item;
      const state = historyItemToProposalState(source);
      applyProposalState({
        ...state,
        questions: questions.length ? questions : state.questions,
        readOnly: source.status !== "proposed",
        requestText: source.user_message || item.user_message,
      });
    } catch {
      const state = historyItemToProposalState(item);
      applyProposalState({
        ...state,
        readOnly: item.status !== "proposed",
        requestText: item.user_message,
      });
    }
  };

  const handleSend = async (text) => {
    const trimmed = String(text).trim();
    if (!trimmed) return;

    const isAdjustFollowUp =
      session?.status === "proposed" &&
      /(شيل|احذف|حذف|استبدل|بدّل|بدل|غير|غيّر|ازل|أزل)/i.test(trimmed) &&
      /(سؤال|أسئلة|اسئلة|question)/i.test(trimmed);

    setCurrentRequest(trimmed);
    setSessionReply("");
    setChatError("");
    if (!isAdjustFollowUp) {
      clearProposal();
    }
    setThinking(true);

    try {
      const data = await sendExamBuilderChat(
        trimmed,
        isAdjustFollowUp ? session?.id : undefined,
      );
      applyChatResponse(data, trimmed);

      if (data.status === "message_only" && !data.session) {
        toast({
          title: "لم يُنشأ مقترح",
          description: data.reply?.replace(/\*\*/g, "").slice(0, 140) || "تحقق من بنك الأسئلة",
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      const message = apiErrorMessage(err, "فشل إرسال الطلب");
      setChatError(message);
      toast({
        title: "فشل الطلب",
        description: message,
        status: "error",
        duration: 8000,
        isClosable: true,
      });
    } finally {
      setThinking(false);
    }
  };

  const handleRegenerate = async () => {
    if (!session?.id) return;
    setRegenerating(true);
    try {
      const data = await regenerateExamBuilderSession(session.id);
      applyChatResponse(data, currentRequest);
      toast({ title: "تم اختيار مجموعة جديدة", status: "success", duration: 2500 });
    } catch (err) {
      const message = apiErrorMessage(err, "فشل إعادة الاختيار");
      setChatError(message);
      toast({
        title: "فشل إعادة الاختيار",
        description: message,
        status: "error",
        duration: 8000,
        isClosable: true,
      });
    } finally {
      setRegenerating(false);
    }
  };

  const handleAdjustQuestion = async (mode, item) => {
    if (!session?.id || !item?.id) return;
    setAdjusting(true);
    try {
      const payload =
        mode === "replace"
          ? { replace_ids: [item.id] }
          : { remove_ids: [item.id] };
      const data = await adjustExamBuilderSession(session.id, payload);
      applyChatResponse(data, currentRequest);
      toast({
        title: mode === "replace" ? "تم استبدال السؤال" : "تم حذف السؤال",
        status: "success",
        duration: 2200,
      });
    } catch (err) {
      const message = apiErrorMessage(err, "فشل تعديل السؤال");
      setChatError(message);
      toast({
        title: "فشل التعديل",
        description: message,
        status: "error",
        duration: 8000,
        isClosable: true,
      });
    } finally {
      setAdjusting(false);
    }
  };

  const navigateToExam = (examId, examType) => {
    if (examId && examType === "lecture-exam") {
      navigate(`/ComprehensiveExam/${examId}`);
    } else if (examId && examType === "course-exam") {
      navigate(`/exam/${examId}`);
    }
  };

  const handleOpenExam = () => {
    if (session?.exam_id && session?.exam_type) {
      navigateToExam(session.exam_id, session.exam_type);
    }
  };

  const handleExportPdfClick = () => {
    if (!proposalQuestions.length) return;
    exportPdfDisclosure.onOpen();
  };

  const handleExportPdfConfirm = async (pdfTitle) => {
    setExportingPdf(true);
    try {
      await exportExamBuilderQuestionsPdf({
        questions: proposalQuestions,
        title: pdfTitle,
      });
      exportPdfDisclosure.onClose();
      toast({
        title: "تم تنزيل PDF",
        description: `${proposalQuestions.length} سؤال بدون إجابات`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "فشل تصدير PDF",
        description: err?.message || "حدث خطأ أثناء إنشاء الملف",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setExportingPdf(false);
    }
  };

  const handleApproveConfirm = async (payload) => {
    if (!session?.id) return;
    setApproving(true);
    try {
      const data = await approveExamBuilderSession(session.id, payload);
      approveDisclosure.onClose();

      const approvedSession = mapHistoryItemToSession(data.session) || data.session;

      toast({
        title: data.message || "تم اعتماد الأسئلة",
        description:
          !data.exam_id && data.question_ids?.length
            ? `تم اعتماد ${data.question_ids.length} سؤالاً — يمكنك إضافتها لامتحان موجود`
            : undefined,
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      applyProposalState({
        session: approvedSession,
        questions: resolveProposalQuestions(data),
        reply: sessionReply,
        actions: { can_approve: false, can_regenerate: false, can_adjust: false },
        readOnly: true,
        requestText: currentRequest,
      });

      loadHistory({ offset: 0 });

      const redirect = data.redirect || {};
      const examId = data.exam_id || redirect.exam_id;
      const examType = data.exam_type || redirect.exam_type;

      if (examId && examType) {
        navigateToExam(examId, examType);
      }
    } catch (err) {
      toast({
        title: "فشل الاعتماد",
        description: apiErrorMessage(err),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setApproving(false);
    }
  };

  if (!isTeacher) return null;
  if (loading) return <BrandLoadingScreen />;

  const defaultApproveTitle =
    session?.parsed_filters?.exam_title ||
    (session?.user_message ? session.user_message.slice(0, 60) : "امتحان من بنك الأسئلة");

  const sidebarProps = {
    history,
    historyLoading,
    historyLoadingMore,
    historyPagination,
    activeSessionId,
    historyFilter,
    onStatusFilterChange: setHistoryFilter,
    onSelectHistoryItem: handleSelectHistoryItem,
    onLoadMoreHistory: () => loadHistory({ offset: historyPagination.offset, append: true }),
    catalog,
  };

  return (
    <Box
      minH={{ base: "100dvh", lg: "100vh" }}
      h={{ base: "100dvh", lg: "auto" }}
      bg={pageBg}
      pt={NAV_OFFSET}
      dir="rtl"
      overflow={{ base: "hidden", lg: "visible" }}
    >
      <Flex
        direction={{ base: "column", lg: "row" }}
        align="stretch"
        gap={{ base: 0, lg: 4 }}
        px={{ base: 0, sm: 3, md: 6, lg: 8 }}
        maxW="8xl"
        mx="auto"
        h={{ base: `calc(100dvh - ${NAV_OFFSET.base})`, md: `calc(100dvh - ${NAV_OFFSET.md})`, lg: "calc(100vh - 120px)" }}
        minH={0}
      >
        {/* Desktop sidebar */}
        <Box
          display={{ base: "none", lg: "block" }}
          w="300px"
          flexShrink={0}
          minH={0}
        >
          <SidebarPanels {...sidebarProps} fullHeight />
        </Box>

        {/* Main chat area */}
        <Flex
          flex={1}
          minW={0}
          minH={0}
          direction="column"
          px={{ base: 2, sm: 0 }}
          pb={{ base: "max(8px, env(safe-area-inset-bottom))", lg: 0 }}
        >
          <Box mb={{ base: 2, md: 3 }} flexShrink={0} px={{ base: 1, sm: 0 }}>
            <CompactPageHeader
              botInfo={botInfo}
              catalogTotal={catalogTotal}
              historyCount={history.length}
              hasProposal={hasProposal && !proposalReadOnly}
              proposalCount={proposalQuestions.length}
              maxQuestions={botInfo?.max_questions || 100}
              onOpenSidebar={isMobile ? sidebarDrawer.onOpen : undefined}
            />
          </Box>

          <ExamBuilderChatWorkspace
            botInfo={botInfo}
            currentRequest={currentRequest}
            reply={sessionReply}
            error={chatError}
            thinking={thinking}
            onSend={handleSend}
          >
            {hasProposal && (
              <ExamProposalPanel
                embedded
                session={session}
                questions={proposalQuestions}
                reply={sessionReply}
                actions={actions}
                onRegenerate={handleRegenerate}
                onApprove={approveDisclosure.onOpen}
                onOpenExam={handleOpenExam}
                onExportPdf={handleExportPdfClick}
                onRemoveQuestion={(item) => handleAdjustQuestion("remove", item)}
                onReplaceQuestion={(item) => handleAdjustQuestion("replace", item)}
                exportingPdf={exportingPdf}
                regenerating={regenerating}
                adjusting={adjusting}
                approving={approving}
                readOnly={proposalReadOnly}
                hideReply
              />
            )}
          </ExamBuilderChatWorkspace>
        </Flex>
      </Flex>

      {/* Mobile drawer — السجل والفهرس */}
      <Drawer isOpen={sidebarDrawer.isOpen} placement="right" onClose={sidebarDrawer.onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent maxW={{ base: "100vw", sm: "360px" }}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" fontSize="md" py={4}>
            <HStack spacing={2}>
              <Icon as={FiClock} color={ACCENT} />
              <Text>الطلبات والفهرس</Text>
            </HStack>
          </DrawerHeader>
          <DrawerBody px={3} py={3} display="flex" flexDirection="column" overflow="hidden">
            <SidebarPanels {...sidebarProps} fullHeight />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <ApproveExamModal
        isOpen={approveDisclosure.isOpen}
        onClose={approveDisclosure.onClose}
        onConfirm={handleApproveConfirm}
        submitting={approving}
        defaultTitle={defaultApproveTitle}
        questionCount={proposalQuestions.length}
      />

      <ExportExamPdfModal
        isOpen={exportPdfDisclosure.isOpen}
        onClose={exportPdfDisclosure.onClose}
        onConfirm={handleExportPdfConfirm}
        submitting={exportingPdf}
        defaultTitle={
          session?.parsed_filters?.exam_title ||
          session?.user_message?.slice(0, 80) ||
          ""
        }
        questionCount={proposalQuestions.length}
      />
    </Box>
  );
}

function ExportExamPdfModal({
  isOpen,
  onClose,
  onConfirm,
  submitting = false,
  defaultTitle = "",
  questionCount = 0,
}) {
  const [title, setTitle] = useState("");
  const [touched, setTouched] = useState(false);
  const noteBg = useColorModeValue("gray.50", "gray.700");
  const noteColor = useColorModeValue("gray.700", "gray.200");

  useEffect(() => {
    if (!isOpen) return;
    setTitle(defaultTitle || "");
    setTouched(false);
  }, [isOpen, defaultTitle]);

  const trimmed = title.trim();
  const isInvalid = touched && !trimmed;

  const handleConfirm = () => {
    setTouched(true);
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent dir="rtl">
        <ModalHeader fontSize="md">تنزيل الأسئلة كـ PDF</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isRequired isInvalid={isInvalid}>
            <FormLabel fontSize="sm">عنوان الامتحان في الملف</FormLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="مثال: امتحان الفصل الأول — علوم"
              size="md"
              autoFocus
            />
            <FormErrorMessage>أدخل عنوان الامتحان قبل التنزيل</FormErrorMessage>
          </FormControl>
          <Text fontSize="xs" color="gray.500" mt={2}>
            {questionCount} سؤال · 5 أسئلة في كل صفحة · بدون إجابات
          </Text>
          <Text fontSize="xs" color={noteColor} bg={noteBg} px={3} py={2} borderRadius="md" mt={3}>
            سيُطبع الملف بتصميم ورقة امتحان بسيط (مختلف عن عرض الشاشة).
          </Text>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={onClose} isDisabled={submitting}>
            إلغاء
          </Button>
          <Button
            colorScheme="blue"
            leftIcon={<FaFilePdf />}
            onClick={handleConfirm}
            isLoading={submitting}
            loadingText="جاري التصدير..."
            isDisabled={!trimmed}
          >
            تنزيل PDF
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function CompactPageHeader({
  botInfo,
  catalogTotal,
  historyCount,
  hasProposal,
  proposalCount,
  maxQuestions,
  onOpenSidebar,
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const subColor = useColorModeValue("gray.600", "gray.400");
  const statBg = useColorModeValue("blue.50", "blue.900");

  return (
    <Box
      bg={cardBg}
      borderRadius={{ base: "lg", md: "xl" }}
      borderWidth="1px"
      borderColor={border}
      overflow="hidden"
      boxShadow="sm"
    >
      <Flex align="center" gap={2} p={{ base: 2.5, md: 3 }}>
        {onOpenSidebar && (
          <IconButton
            aria-label="فتح السجل"
            icon={<Icon as={FiMenu} />}
            variant="ghost"
            size="sm"
            borderRadius="lg"
            onClick={onOpenSidebar}
            flexShrink={0}
          />
        )}
        <Flex w={9} h={9} borderRadius="lg" bg={statBg} align="center" justify="center" flexShrink={0}>
          <Icon as={MdQuiz} color={ACCENT} boxSize={4} />
        </Flex>
        <Box flex={1} minW={0}>
          <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="bold" noOfLines={1}>
            {botInfo?.name || "مساعد إنشاء الامتحانات"}
          </Text>
          <Text fontSize="10px" color={subColor} noOfLines={{ base: 2, sm: 1 }}>
            <Box as="span" display={{ base: "block", sm: "inline" }}>
              {catalogTotal || 0} سؤال
            </Box>
            <Box as="span" display={{ base: "none", sm: "inline" }}>
              {" · "}
            </Box>
            <Box as="span" display={{ base: "block", sm: "inline" }}>
              {historyCount} طلب
              {hasProposal ? ` · ${proposalCount} جاهز` : ` · حد ${maxQuestions}`}
            </Box>
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}
