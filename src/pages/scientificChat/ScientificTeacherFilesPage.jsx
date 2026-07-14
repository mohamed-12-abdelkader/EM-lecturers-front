import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Icon,
  useColorModeValue,
  Spinner,
  Center,
  SimpleGrid,
  Badge,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  IconButton,
  Tooltip,
  Flex,
  Alert,
  AlertIcon,
  Container,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@chakra-ui/react";
import {
  FaFileAlt,
  FaUpload,
  FaTrash,
  FaSync,
  FaPlus,
  FaBrain,
  FaRobot,
  FaComments,
} from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import {
  deleteScientificFile,
  fetchTeacherFiles,
  resetTeacherEmbeddings,
  uploadTeacherFile,
} from "../../api/scientificChatbotApi";
import TeacherStudentChatsPanel from "../../components/scientificChat/TeacherStudentChatsPanel";

const ScientificTeacherFilesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "chats" ? 1 : 0;
  const initialCourseId = searchParams.get("courseId") || "";
  const [tabIndex, setTabIndex] = useState(initialTab);
  const token = localStorage.getItem("token");

  useEffect(() => {
    setTabIndex(searchParams.get("tab") === "chats" ? 1 : 0);
  }, [searchParams]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    fileId: null,
    fileName: "",
  });
  const cancelRef = useRef();
  const fileInputRef = useRef(null);
  const toast = useToast();

  const pageBg = useColorModeValue("gray.100", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const subTextColor = useColorModeValue("gray.600", "gray.400");
  const fileCardBg = useColorModeValue("gray.50", "gray.900");
  const headerGradient = useColorModeValue(
    "linear(to-l, blue.600, blue.500)",
    "linear(to-l, blue.700, blue.600)"
  );

  const fetchFiles = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const list = await fetchTeacherFiles(token);
      setFiles(list);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "فشل تحميل الملفات";
      setError(msg);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [token]);

  const handleUpload = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const ext = (file.name || "").toLowerCase();
    const ok =
      ["text/plain", "text/markdown", "application/pdf"].includes(file.type) ||
      ext.endsWith(".txt") ||
      ext.endsWith(".md") ||
      ext.endsWith(".pdf");
    if (!ok) {
      toast({
        title: "نوع ملف غير مدعوم",
        description: "المسموح: .txt أو .md أو .pdf",
        status: "warning",
        isClosable: true,
      });
      return;
    }
    try {
      setUploading(true);
      const data = await uploadTeacherFile(file, token);
      const resFile = data?.file;
      toast({
        title: data?.warning ? "تم الحفظ مع تحذير" : "تم رفع الملف",
        description:
          data?.warning ||
          (resFile
            ? `تمت معالجة "${resFile.file_name ?? resFile.fileName}"`
            : "تمت المعالجة بنجاح"),
        status: data?.warning ? "warning" : "success",
        duration: data?.warning ? 6000 : 3500,
        isClosable: true,
      });
      fetchFiles();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      toast({
        title: "خطأ في الرفع",
        description: err?.response?.data?.error || err?.message || "فشل رفع الملف",
        status: "error",
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleResetEmbeddings = async () => {
    try {
      setResetting(true);
      await resetTeacherEmbeddings(token);
      toast({
        title: "تم إعادة توليد الـ embeddings",
        status: "success",
        isClosable: true,
      });
      fetchFiles();
    } catch (err) {
      toast({
        title: "خطأ",
        description: err?.response?.data?.error || err?.message,
        status: "error",
        isClosable: true,
      });
    } finally {
      setResetting(false);
    }
  };

  const fileDisplayName = (file) => file?.file_name ?? file?.fileName ?? "بدون اسم";
  const fileSize = (file) => file?.file_size ?? file?.fileSize;
  const fileUploadedAt = (file) => file?.uploaded_at ?? file?.uploadedAt;

  const openDeleteDialog = (file) => {
    setDeleteDialog({ isOpen: true, fileId: file.id, fileName: fileDisplayName(file) });
  };

  const handleDeleteConfirm = async () => {
    const { fileId } = deleteDialog;
    if (!fileId) return;
    try {
      setDeletingId(fileId);
      const data = await deleteScientificFile(fileId, token);
      toast({
        title: "تم حذف الملف",
        description: data?.warning || undefined,
        status: data?.warning ? "warning" : "success",
        isClosable: true,
      });
      fetchFiles();
      setDeleteDialog({ isOpen: false, fileId: null, fileName: "" });
    } catch (err) {
      toast({
        title: "خطأ",
        description: err?.response?.data?.error || err?.message,
        status: "error",
        isClosable: true,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatSize = (bytes) => {
    if (bytes == null || bytes === 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(d);
    }
  };

  return (
    <Box minH="100vh" bg={pageBg} py={{ base: 4, md: 8 }} dir="rtl">
      <Container maxW="6xl">
        <VStack spacing={5} align="stretch">
          <Box
            borderRadius="2xl"
            overflow="hidden"
            bgGradient={headerGradient}
            color="white"
            p={{ base: 4, md: 6 }}
          >
            <HStack align="start" spacing={3}>
              <Flex boxSize={12} borderRadius="xl" bg="whiteAlpha.200" align="center" justify="center">
                <Icon as={FaRobot} boxSize={6} />
              </Flex>
              <Box flex={1}>
                <Heading size="md" fontWeight="black">
                  إدارة المساعد العلمي
                </Heading>
                <Text fontSize="sm" color="whiteAlpha.900" mt={1} maxW="3xl" lineHeight="1.7">
                  ارفع المواد، راجع شاتات الطلاب مع AI، وتأكد من جودة الإجابات المستخرجة من محتواك.
                </Text>
                <HStack mt={3} spacing={2} flexWrap="wrap">
                  <Badge bg="whiteAlpha.200" color="white" borderRadius="full" px={3}>
                    RAG + Milvus
                  </Badge>
                  <Badge bg="orange.400" color="white" borderRadius="full" px={3}>
                    مراجعة الطلاب
                  </Badge>
                </HStack>
              </Box>
            </HStack>
          </Box>

          <Tabs
            index={tabIndex}
            onChange={(idx) => {
              setTabIndex(idx);
              const next = new URLSearchParams(searchParams);
              if (idx === 1) next.set("tab", "chats");
              else next.delete("tab");
              setSearchParams(next, { replace: true });
            }}
            colorScheme="blue"
            variant="enclosed"
            isFitted
          >
            <TabList
              bg={cardBg}
              border="1px solid"
              borderColor={borderColor}
              borderRadius="xl"
              p={1}
              gap={1}
              mb={0}
            >
              <Tab borderRadius="lg" fontWeight="bold" _selected={{ bg: "blue.500", color: "white" }}>
                <Icon as={FaFileAlt} ml={2} />
                الملفات العامة
              </Tab>
              <Tab borderRadius="lg" fontWeight="bold" _selected={{ bg: "orange.500", color: "white" }}>
                <Icon as={FaComments} ml={2} />
                مراجعة شات الطلاب
              </Tab>
            </TabList>

            <TabPanels mt={4}>
              <TabPanel px={0}>
                <VStack spacing={4} align="stretch">
                  <Flex justify="flex-end" gap={2} flexWrap="wrap">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
                      hidden
                      onChange={handleUpload}
                    />
                    <Button
                      size="sm"
                      bg="orange.500"
                      color="white"
                      _hover={{ bg: "orange.600" }}
                      leftIcon={<Icon as={FaUpload} />}
                      onClick={() => fileInputRef.current?.click()}
                      isLoading={uploading}
                    >
                      رفع ملف عام
                    </Button>
                    <Tooltip label="إعادة توليد embeddings لكل ملفات المدرس">
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="blue"
                        leftIcon={<Icon as={FaSync} />}
                        onClick={handleResetEmbeddings}
                        isLoading={resetting}
                      >
                        إعادة الفهرسة
                      </Button>
                    </Tooltip>
                  </Flex>

                  <Alert status="info" borderRadius="xl" fontSize="sm">
                    <AlertIcon />
                    ملفات عامة لكل كورساتك. لمحتوى كورس محدد، استخدم تبويب المساعد العلمي داخل صفحة الكورس.
                  </Alert>

                  <Box
                    bg={cardBg}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="2xl"
                    p={{ base: 4, md: 5 }}
                    boxShadow="md"
                  >
            {loading ? (
              <Center py={12}>
                <Spinner size="lg" color="blue.500" />
              </Center>
            ) : error ? (
              <Box textAlign="center" py={8}>
                <Text color="red.500" mb={3}>
                  {error}
                </Text>
                <Button size="sm" colorScheme="blue" onClick={fetchFiles}>
                  إعادة المحاولة
                </Button>
              </Box>
            ) : files.length === 0 ? (
              <Box py={10} textAlign="center">
                <Icon as={FaBrain} boxSize={12} color="gray.400" mb={3} />
                <Text color={subTextColor} mb={4} lineHeight="1.7">
                  لا توجد ملفات عامة بعد. ارفع ملفاً ليستطيع الطلاب السؤال عن موادك عبر «سؤال عن كل مواد المدرس».
                </Text>
                <Button
                  colorScheme="blue"
                  leftIcon={<Icon as={FaPlus} />}
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={uploading}
                >
                  رفع أول ملف
                </Button>
              </Box>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {files.map((file) => (
                  <Box
                    key={file.id}
                    p={4}
                    bg={fileCardBg}
                    borderRadius="2xl"
                    border="1px solid"
                    borderColor={borderColor}
                    position="relative"
                    overflow="hidden"
                    _hover={{ borderColor: "blue.300", shadow: "md" }}
                  >
                    <Box
                      position="absolute"
                      top={0}
                      right={0}
                      left={0}
                      h="3px"
                      bgGradient="linear(to-l, blue.500, orange.400)"
                    />
                    <HStack justify="space-between" mb={3}>
                      <Flex boxSize={9} borderRadius="lg" bg="blue.50" align="center" justify="center">
                        <Icon as={FaFileAlt} color="blue.500" />
                      </Flex>
                      <IconButton
                        aria-label="حذف"
                        icon={<FaTrash />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => openDeleteDialog(file)}
                      />
                    </HStack>
                    <Text fontWeight="bold" noOfLines={2} fontSize="sm" mb={2}>
                      {fileDisplayName(file)}
                    </Text>
                    <HStack fontSize="xs" color={subTextColor} spacing={2} flexWrap="wrap">
                      <span>{formatSize(fileSize(file))}</span>
                      <span>•</span>
                      <span>{formatDate(fileUploadedAt(file))}</span>
                    </HStack>
                    {(file.file_type ?? file.fileType) === "application/pdf" && (
                      <Badge mt={2} colorScheme="orange" borderRadius="full" fontSize="0.65rem">
                        PDF
                      </Badge>
                    )}
                  </Box>
                ))}
              </SimpleGrid>
            )}
                  </Box>
                </VStack>
              </TabPanel>

              <TabPanel px={0}>
                <TeacherStudentChatsPanel initialCourseId={initialCourseId} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>

      <AlertDialog
        isOpen={deleteDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => !deletingId && setDeleteDialog({ isOpen: false, fileId: null, fileName: "" })}
      >
        <AlertDialogOverlay>
          <AlertDialogContent mx={{ base: 3, md: 0 }}>
            <AlertDialogHeader>تأكيد حذف الملف</AlertDialogHeader>
            <AlertDialogBody>
              حذف «{deleteDialog.fileName}»؟ سيُزال من فهرس Milvus والمساعد العلمي.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={() => setDeleteDialog({ isOpen: false, fileId: null, fileName: "" })}
                isDisabled={!!deletingId}
              >
                إلغاء
              </Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} isLoading={deletingId !== null} mr={3}>
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ScientificTeacherFilesPage;
