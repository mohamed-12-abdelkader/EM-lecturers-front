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
  Divider,
  Flex,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import {
  FaFileAlt,
  FaUpload,
  FaTrash,
  FaSync,
  FaRobot,
  FaPlus,
  FaBrain,
  FaComments,
} from "react-icons/fa";
import { Link as RouterLink } from "react-router-dom";
import {
  deleteScientificFile,
  fetchCourseFiles,
  resetCourseEmbeddings,
  uploadCourseFile,
} from "../../../api/scientificChatbotApi";

const MAX_FILE_SIZE_MB = 10;

const ScientificChatTab = ({ courseId, token }) => {
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

  const headingColor = useColorModeValue("blue.700", "blue.200");
  const sectionBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const subTextColor = useColorModeValue("gray.600", "gray.400");
  const headerGradient = useColorModeValue(
    "linear(to-l, blue.600, blue.500)",
    "linear(to-l, blue.700, blue.600)"
  );

  const fetchFiles = async () => {
    if (!courseId || !token) return;
    try {
      setLoading(true);
      setError(null);
      const list = await fetchCourseFiles(courseId, token);
      setFiles(list);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "فشل تحميل الملفات";
      setError(msg);
      setFiles([]);
      toast({ title: "خطأ", description: msg, status: "error", isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [courseId, token]);

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
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast({
        title: "حجم الملف كبير",
        description: `الحد الأقصى ${MAX_FILE_SIZE_MB} ميجابايت`,
        status: "warning",
        isClosable: true,
      });
      return;
    }
    try {
      setUploading(true);
      const data = await uploadCourseFile(courseId, file, token);
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
      await resetCourseEmbeddings(courseId, token);
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
    <VStack spacing={{ base: 4, md: 5 }} align="stretch">
      <Box
        borderRadius="2xl"
        overflow="hidden"
        bgGradient={headerGradient}
        color="white"
        p={{ base: 4, md: 5 }}
      >
        <Flex justify="space-between" align="start" gap={4} wrap="wrap">
          <HStack align="start" spacing={3}>
            <Flex boxSize={11} borderRadius="xl" bg="whiteAlpha.200" align="center" justify="center">
              <Icon as={FaBrain} boxSize={5} />
            </Flex>
            <Box>
              <Heading size="sm" fontWeight="black">
                إدارة المساعد العلمي (RAG)
              </Heading>
              <Text fontSize="sm" color="whiteAlpha.900" mt={1} maxW="xl" lineHeight="1.7">
                ارفع مواد .txt / .md / .pdf — تُفهرَس في Milvus ليجيب الطلاب منها فقط.
              </Text>
            </Box>
          </HStack>
          <HStack spacing={2} flexWrap="wrap">
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
              رفع ملف
            </Button>
            <Tooltip label="إعادة توليد embeddings لكل ملفات الكورس">
              <Button
                size="sm"
                variant="outline"
                borderColor="whiteAlpha.500"
                color="white"
                _hover={{ bg: "whiteAlpha.200" }}
                leftIcon={<Icon as={FaSync} />}
                onClick={handleResetEmbeddings}
                isLoading={resetting}
              >
                إعادة الفهرسة
              </Button>
            </Tooltip>
            <Button
              as={RouterLink}
              to={`/teacher-scientific-files?tab=chats&courseId=${courseId}`}
              size="sm"
              variant="outline"
              borderColor="whiteAlpha.500"
              color="white"
              _hover={{ bg: "whiteAlpha.200" }}
              leftIcon={<Icon as={FaComments} />}
            >
              مراجعة شات الطلاب
            </Button>
          </HStack>
        </Flex>
      </Box>

      <Alert status="info" borderRadius="xl" fontSize="sm">
        <AlertIcon />
        PDF يُستخرج نصه عبر Mistral OCR. إن فشلت الفهرسة يُحفظ الملف — استخدم «إعادة الفهرسة» لاحقاً.
      </Alert>

      <Divider borderColor={borderColor} />

      {loading ? (
        <Center py={12}>
          <Spinner size="lg" color="blue.500" />
        </Center>
      ) : error ? (
        <Box p={6} bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} textAlign="center">
          <Text color="red.500" mb={3}>
            {error}
          </Text>
          <Button size="sm" colorScheme="blue" onClick={fetchFiles}>
            إعادة المحاولة
          </Button>
        </Box>
      ) : files.length === 0 ? (
        <Box
          p={10}
          bg={sectionBg}
          borderRadius="2xl"
          border="2px dashed"
          borderColor={borderColor}
          textAlign="center"
        >
          <Icon as={FaFileAlt} boxSize={12} color="gray.400" mb={3} />
          <Text color={subTextColor} mb={4} lineHeight="1.7">
            لا توجد ملفات بعد. ارفع أول ملف علمي لتفعيل المساعد للطلاب.
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
              bg={cardBg}
              borderRadius="2xl"
              border="1px solid"
              borderColor={borderColor}
              position="relative"
              overflow="hidden"
              _hover={{ borderColor: "blue.300", shadow: "md" }}
              transition="all 0.2s"
            >
              <Box position="absolute" top={0} right={0} left={0} h="3px" bgGradient="linear(to-l, blue.500, orange.400)" />
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
              <Button ref={cancelRef} onClick={() => setDeleteDialog({ isOpen: false, fileId: null, fileName: "" })} isDisabled={!!deletingId}>
                إلغاء
              </Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} isLoading={deletingId !== null} mr={3}>
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
};

export default ScientificChatTab;
