import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Icon,
  Input,
  Select,
  Badge,
  Flex,
  SimpleGrid,
  useColorModeValue,
  useToast,
  Spinner,
  Center,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  Progress,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Image,
  useDisclosure,
} from "@chakra-ui/react";
import {
  FaFolderOpen,
  FaUpload,
  FaDownload,
  FaTrash,
  FaEdit,
  FaSync,
  FaTags,
  FaEllipsisV,
  FaFile,
  FaFilePdf,
  FaFileImage,
  FaFileArchive,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFolderPlus,
  FaThLarge,
  FaList,
  FaPlay,
  FaGoogleDrive,
} from "react-icons/fa";
import { MdInsertDriveFile } from "react-icons/md";
import UploadFileModal from "./components/UploadFileModal";
import FilePreviewModal from "./components/FilePreviewModal";
import {
  fetchFileCategories,
  createFileCategory,
  updateFileCategory,
  deleteFileCategory,
  fetchFiles,
  fetchFileStatistics,
  fetchFilePreview,
  fetchFileEmbed,
  buildFileViewSrc,
  buildFileOpenSrc,
  createFileViewObjectUrl,
  addDriveFile,
  bulkAddDriveLinks,
  getDrivePreviewSrc,
  getDriveOpenUrl,
  isDriveFile,
  uploadFile,
  updateFile,
  deleteFile,
  downloadFile,
  formatFileSize,
  apiErrorMessage,
} from "../../api/teacherMyFilesApi";

const CATEGORY_SCHEMES = [
  { bg: "red.50", color: "red.600", border: "red.200" },
  { bg: "orange.50", color: "orange.600", border: "orange.200" },
  { bg: "blue.50", color: "blue.600", border: "blue.200" },
  { bg: "purple.50", color: "purple.600", border: "purple.200" },
  { bg: "green.50", color: "green.600", border: "green.200" },
  { bg: "teal.50", color: "teal.600", border: "teal.200" },
];

function categoryScheme(id) {
  return CATEGORY_SCHEMES[(id || 0) % CATEGORY_SCHEMES.length];
}

function fileTypeMeta(file) {
  if (isDriveFile(file)) {
    return { Icon: FaGoogleDrive, color: "green.500", bg: "green.50", label: "Drive" };
  }
  const ext = (file?.fileExtension || file || "").toString().toLowerCase();
  const e = typeof file === "string" ? file : ext;
  if (e === "pdf") return { Icon: FaFilePdf, color: "red.500", bg: "red.50" };
  if (["ppt", "pptx"].includes(e)) return { Icon: FaPlay, color: "orange.500", bg: "orange.50" };
  if (["doc", "docx"].includes(e)) return { Icon: FaFileWord, color: "blue.500", bg: "blue.50" };
  if (["xls", "xlsx"].includes(e)) return { Icon: FaFileExcel, color: "green.600", bg: "green.50" };
  if (["jpg", "jpeg", "png", "webp"].includes(e)) return { Icon: FaFileImage, color: "cyan.500", bg: "cyan.50" };
  if (e === "zip") return { Icon: FaFileArchive, color: "purple.500", bg: "purple.50" };
  return { Icon: MdInsertDriveFile, color: "blue.500", bg: "blue.50" };
}

function isImageExt(ext) {
  return ["jpg", "jpeg", "png", "webp"].includes((ext || "").toLowerCase());
}

const STORAGE_CAP_BYTES = 15 * 1024 * 1024 * 1024;

export default function TeacherMyFilesPage() {
  const token = localStorage.getItem("token");
  const toast = useToast();
  const cancelRef = useRef();
  const previewObjectUrlRef = useRef("");

  const revokePreviewUrl = useCallback(() => {
    if (previewObjectUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
    }
    previewObjectUrlRef.current = "";
  }, []);

  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [viewMode, setViewMode] = useState("grid");

  const [categoryId, setCategoryId] = useState("");
  const [fileType, setFileType] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const uploadModal = useDisclosure();
  const editModal = useDisclosure();
  const categoriesModal = useDisclosure();
  const previewModal = useDisclosure();

  const [previewFile, setPreviewFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewMode, setPreviewMode] = useState("blob");
  const [previewTextContent, setPreviewTextContent] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const [editForm, setEditForm] = useState({
    id: null,
    name: "",
    description: "",
    categoryId: "",
    driveUrl: "",
    sourceType: "upload",
  });
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [openingFileId, setOpeningFileId] = useState(null);

  const pageBg = useColorModeValue("#f0f4f8", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.600");
  const muted = useColorModeValue("gray.500", "gray.400");
  const heading = useColorModeValue("gray.800", "gray.100");
  const filterBg = useColorModeValue("white", "gray.800");
  const inputBg = useColorModeValue("#f8fafc", "gray.700");

  const loadCategories = useCallback(async () => {
    if (!token) return;
    try {
      setCategories(await fetchFileCategories(token));
    } catch {
      setCategories([]);
    }
  }, [token]);

  const loadStats = useCallback(async () => {
    if (!token) return;
    try {
      setStats(await fetchFileStatistics(token));
    } catch {
      setStats(null);
    }
  }, [token]);

  const loadFiles = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await fetchFiles(
        {
          page,
          limit: 20,
          search: search || undefined,
          categoryId: categoryId || undefined,
          fileType: fileType || undefined,
          sortBy,
          sortOrder,
        },
        token
      );
      setFiles(result.items);
      setPagination(result.pagination);
    } catch (err) {
      toast({ title: apiErrorMessage(err, "فشل تحميل الملفات"), status: "error", isClosable: true });
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [token, page, search, categoryId, fileType, sortBy, sortOrder, toast]);

  useEffect(() => {
    loadCategories();
    loadStats();
  }, [loadCategories, loadStats]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const refreshAll = () => {
    loadFiles();
    loadStats();
    loadCategories();
  };

  const handleOpenFile = async (file) => {
    if (openingFileId === file.id) return;
    setOpeningFileId(file.id);
    revokePreviewUrl();
    setPreviewFile(file);
    setPreviewData(null);
    setPreviewUrl("");
    setPreviewMode("blob");
    setPreviewTextContent(null);
    setPreviewLoading(true);
    previewModal.onOpen();
    try {
      const preview = await fetchFilePreview(file.id, token, { includeText: true });
      const normalizedFile = preview?.file || file;
      setPreviewFile(normalizedFile);
      setPreviewData(preview);

      if (preview?.content?.supported || preview?.content?.text || preview?.content?.paragraphs?.length) {
        setPreviewTextContent(preview.content);
      }

      const driveFile = isDriveFile(normalizedFile) || isDriveFile(file);

      if (driveFile) {
        let embedData = null;
        try {
          embedData = await fetchFileEmbed(file.id, token);
        } catch {
          embedData = null;
        }
        const iframeSrc = getDrivePreviewSrc(normalizedFile, embedData);
        if (iframeSrc) {
          setPreviewUrl(iframeSrc);
          setPreviewMode("drive");
          setPreviewData((prev) => ({
            ...prev,
            embed: embedData,
            openUrl: getDriveOpenUrl(normalizedFile, embedData),
          }));
        }
        return;
      }

      const canPreview =
        preview?.preview?.canPreviewInline ||
        normalizedFile.canPreviewInline ||
        preview?.preview?.viewerComponent === "pdf-viewer" ||
        preview?.preview?.viewerComponent === "image-viewer";

      if (canPreview) {
        try {
          const objectUrl = await createFileViewObjectUrl(file.id, token, {
            mimeType: normalizedFile.mimeType,
          });
          previewObjectUrlRef.current = objectUrl;
          setPreviewUrl(objectUrl);
          setPreviewMode("blob");
        } catch {
          const directUrl = buildFileViewSrc(
            file.id,
            token,
            preview?.urls?.view || normalizedFile.absoluteViewUrl || normalizedFile.viewUrl,
          );
          setPreviewUrl(directUrl);
          setPreviewMode("url");
        }
      }
    } catch (err) {
      previewModal.onClose();
      toast({ title: apiErrorMessage(err, "تعذّر فتح الملف"), status: "error", isClosable: true });
    } finally {
      setPreviewLoading(false);
      setOpeningFileId(null);
    }
  };

  const handleDownloadFile = async (file) => {
    if (downloadingId === file.id) return;

    if (isDriveFile(file)) {
      const openUrl = getDriveOpenUrl(file) || buildFileOpenSrc(file.id, token);
      window.open(openUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setDownloadingId(file.id);
    try {
      const data = await downloadFile(file.id, token);
      const url = data?.downloadUrl;
      if (!url) {
        toast({ title: "رابط التحميل غير متاح", status: "warning", isClosable: true });
        return;
      }
      const link = document.createElement("a");
      link.href = url;
      link.download = data?.fileName || file.name || "file";
      link.target = "_blank";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      loadStats();
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? { ...f, downloadsCount: data.downloadsCount ?? (f.downloadsCount || 0) + 1 }
            : f
        )
      );
    } catch (err) {
      toast({ title: apiErrorMessage(err, "فشل التحميل"), status: "error", isClosable: true });
    } finally {
      setDownloadingId(null);
    }
  };

  const closePreview = () => {
    previewModal.onClose();
    revokePreviewUrl();
    setPreviewFile(null);
    setPreviewData(null);
    setPreviewUrl("");
    setPreviewMode("blob");
    setPreviewTextContent(null);
    setPreviewLoading(false);
  };

  useEffect(() => () => revokePreviewUrl(), [revokePreviewUrl]);

  const handleAddDrive = async (payload) => {
    setBusy(true);
    try {
      await addDriveFile(payload, token);
      toast({ title: "تمت إضافة رابط Google Drive", status: "success", isClosable: true });
      refreshAll();
    } catch (e) {
      toast({ title: apiErrorMessage(e), status: "error", isClosable: true });
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const handleBulkDriveLinks = async (payload) => {
    setBusy(true);
    try {
      const result = await bulkAddDriveLinks(payload, token);
      const added = result?.added?.length ?? result?.links?.length ?? payload.links.length;
      const errors = result?.errors?.length ?? 0;
      toast({
        title: errors > 0 ? `تمت إضافة ${added} روابط مع ${errors} أخطاء` : `تمت إضافة ${added} روابط`,
        status: errors > 0 ? "warning" : "success",
        isClosable: true,
      });
      refreshAll();
    } catch (e) {
      toast({ title: apiErrorMessage(e), status: "error", isClosable: true });
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const handleUploadWithProgress = async (payload, onProgress) => {
    setBusy(true);
    try {
      await uploadFile(payload, token, undefined, onProgress);
      toast({ title: "تم رفع الملف بنجاح", status: "success", isClosable: true });
      refreshAll();
    } catch (e) {
      toast({ title: apiErrorMessage(e), status: "error", isClosable: true });
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm.name?.trim()) return;
    setBusy(true);
    try {
      await updateFile(
        editForm.id,
        {
          name: editForm.name.trim(),
          description: editForm.description?.trim() || null,
          categoryId: editForm.categoryId ? Number(editForm.categoryId) : null,
          ...(editForm.sourceType === "drive"
            ? { driveUrl: editForm.driveUrl?.trim() || undefined }
            : {}),
        },
        token
      );
      toast({ title: "تم التحديث", status: "success", isClosable: true });
      editModal.onClose();
      refreshAll();
    } catch (e) {
      toast({ title: apiErrorMessage(e), status: "error", isClosable: true });
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      if (deleteTarget.type === "file") await deleteFile(deleteTarget.id, token);
      else if (deleteTarget.type === "category") {
        await deleteFileCategory(deleteTarget.id, token);
        loadCategories();
      }
      toast({ title: "تم الحذف", status: "success", isClosable: true });
      setDeleteTarget(null);
      refreshAll();
    } catch (e) {
      toast({ title: apiErrorMessage(e), status: "error", isClosable: true });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveCategory = async () => {
    const name = categoryName.trim();
    if (!name) return;
    setBusy(true);
    try {
      if (editingCategory) await updateFileCategory(editingCategory.id, name, token);
      else await createFileCategory(name, token);
      toast({ title: "تم الحفظ", status: "success", isClosable: true });
      setCategoryName("");
      setEditingCategory(null);
      loadCategories();
      loadStats();
    } catch (e) {
      toast({ title: apiErrorMessage(e), status: "error", isClosable: true });
    } finally {
      setBusy(false);
    }
  };

  const storagePct = stats?.totalStorageUsedBytes
    ? Math.min(100, Math.round((stats.totalStorageUsedBytes / STORAGE_CAP_BYTES) * 100))
    : 0;

  if (!token) {
    return (
      <Center minH="60vh">
        <Text>يجب تسجيل الدخول أولاً</Text>
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg={pageBg} pt="90px" pb={12} dir="rtl">
      <Container maxW="container.xl">
        {/* Header */}
        <Flex justify="space-between" align="start" mb={8} gap={4} flexWrap="wrap">
          <VStack align="start" spacing={2} maxW="lg">
            <Heading size="xl" fontWeight="extrabold" color={heading}>
              ملفاتي
            </Heading>
            <Text fontSize="md" color={muted} lineHeight="1.8">
              قم بإدارة وتنظيم جميع ملفاتك التعليمية في مكان واحد بفعالية وسهولة.
            </Text>
          </VStack>
          <HStack spacing={3} flexWrap="wrap">
            <Button
              leftIcon={<Icon as={FaUpload} />}
              colorScheme="blue"
              size="md"
              borderRadius="xl"
              px={6}
              boxShadow="0 8px 24px rgba(59,130,246,0.35)"
              onClick={uploadModal.onOpen}
            >
              إضافة ملف
            </Button>
            <Button
              leftIcon={<Icon as={FaFolderPlus} />}
              variant="outline"
              size="md"
              borderRadius="xl"
              borderColor="blue.200"
              color="blue.600"
              bg="white"
              onClick={categoriesModal.onOpen}
            >
              إنشاء تصنيف جديد
            </Button>
            <IconButton
              aria-label="تحديث"
              icon={<FaSync />}
              variant="outline"
              borderRadius="xl"
              bg="white"
              onClick={refreshAll}
              isLoading={loading}
            />
          </HStack>
        </Flex>

        {/* KPI Cards */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4} mb={6}>
          <KpiCard
            label="إجمالي الملفات"
            value={stats?.totalFiles ?? "—"}
            icon={FaFile}
            iconBg="blue.50"
            iconColor="blue.500"
          />
          <KpiCard
            label="مساحة التخزين"
            value={stats?.totalStorageUsed ?? "—"}
            sub={`من ${formatFileSize(STORAGE_CAP_BYTES)}`}
            icon={FaFolderOpen}
            iconBg="blue.50"
            iconColor="blue.500"
            progress={storagePct}
          />
          <KpiCard
            label="التحميلات"
            value={stats?.totalDownloads ?? "—"}
            icon={FaDownload}
            iconBg="green.50"
            iconColor="green.500"
          />
          <KpiCard
            label="التصنيفات"
            value={categories.length}
            sub="تصنيفاتك النشطة"
            icon={FaTags}
            iconBg="orange.50"
            iconColor="orange.500"
          />
        </SimpleGrid>

        {/* Filter bar */}
        <Flex
          bg={filterBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={border}
          p={4}
          mb={6}
          gap={4}
          flexWrap="wrap"
          align="center"
          justify="space-between"
          boxShadow="sm"
        >
          <HStack spacing={3} flexWrap="wrap" flex={1}>
            <Input
              size="sm"
              placeholder="بحث في الاسم أو الوصف..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearch(searchInput.trim());
                  setPage(1);
                }
              }}
              borderRadius="lg"
              bg={inputBg}
              maxW={{ base: "full", md: "220px" }}
            />
            <Button
              size="sm"
              colorScheme="blue"
              variant="outline"
              borderRadius="lg"
              onClick={() => {
                setSearch(searchInput.trim());
                setPage(1);
              }}
            >
              بحث
            </Button>
            <Text fontSize="sm" fontWeight="semibold" color={muted} whiteSpace="nowrap">
              تصفية:
            </Text>
            <Select
              size="sm"
              w="150px"
              value={fileType}
              onChange={(e) => {
                setFileType(e.target.value);
                setPage(1);
              }}
              borderRadius="lg"
              bg={inputBg}
            >
              <option value="">جميع الأنواع</option>
              <option value="pdf">PDF</option>
              <option value="ppt">عروض تقديمية</option>
              <option value="images">صور</option>
              <option value="docx">مستندات Word</option>
            </Select>
            <Select
              size="sm"
              w="160px"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              borderRadius="lg"
              bg={inputBg}
            >
              <option value="">جميع التصنيفات</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <HStack spacing={2}>
              <Text fontSize="sm" fontWeight="semibold" color={muted}>
                ترتيب:
              </Text>
              <Select
                size="sm"
                w="120px"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split("-");
                  setSortBy(by);
                  setSortOrder(order);
                  setPage(1);
                }}
                borderRadius="lg"
                bg={inputBg}
              >
                <option value="created_at-desc">الأحدث</option>
                <option value="created_at-asc">الأقدم</option>
                <option value="name-asc">الاسم أ-ي</option>
                <option value="file_size-desc">الأكبر حجماً</option>
                <option value="downloads_count-desc">الأكثر تحميلاً</option>
              </Select>
            </HStack>
          </HStack>

          <HStack spacing={1} bg={inputBg} p={1} borderRadius="lg">
            <IconButton
              aria-label="عرض شبكة"
              icon={<FaThLarge />}
              size="sm"
              variant={viewMode === "grid" ? "solid" : "ghost"}
              colorScheme={viewMode === "grid" ? "blue" : "gray"}
              borderRadius="md"
              onClick={() => setViewMode("grid")}
            />
            <IconButton
              aria-label="عرض قائمة"
              icon={<FaList />}
              size="sm"
              variant={viewMode === "list" ? "solid" : "ghost"}
              colorScheme={viewMode === "list" ? "blue" : "gray"}
              borderRadius="md"
              onClick={() => setViewMode("list")}
            />
          </HStack>
        </Flex>

        {/* Files */}
        {loading ? (
          <Center py={20}>
            <Spinner size="lg" color="blue.400" thickness="3px" />
          </Center>
        ) : files.length === 0 ? (
          <Center
            py={20}
            flexDirection="column"
            gap={4}
            bg={cardBg}
            borderRadius="2xl"
            borderWidth="1px"
            borderColor={border}
          >
            <Icon as={FaFolderOpen} boxSize={12} color="gray.300" />
            <Text color={muted} fontSize="md">
              لا توجد ملفات بعد — ابدأ برفع أول ملف
            </Text>
            <Button colorScheme="blue" borderRadius="xl" onClick={uploadModal.onOpen}>
              رفع ملف جديد
            </Button>
          </Center>
        ) : viewMode === "grid" ? (
          <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing={4}>
            {files.map((file) => (
              <FileGridCard
                key={file.id}
                file={file}
                isOpening={openingFileId === file.id}
                onOpen={handleOpenFile}
                onDownload={handleDownloadFile}
                downloadingId={downloadingId}
                onEdit={(f) => {
                  setEditForm({
                    id: f.id,
                    name: f.name,
                    description: f.description || "",
                    categoryId: f.categoryId ? String(f.categoryId) : "",
                    driveUrl: f.driveUrl || "",
                    sourceType: f.sourceType || "upload",
                  });
                  editModal.onOpen();
                }}
                onDelete={(f) => setDeleteTarget({ type: "file", id: f.id, name: f.name })}
              />
            ))}
          </SimpleGrid>
        ) : (
          <VStack spacing={3} align="stretch">
            {files.map((file) => (
              <FileListRow
                key={file.id}
                file={file}
                isOpening={openingFileId === file.id}
                onOpen={handleOpenFile}
                onDownload={handleDownloadFile}
                downloadingId={downloadingId}
                onEdit={(f) => {
                  setEditForm({
                    id: f.id,
                    name: f.name,
                    description: f.description || "",
                    categoryId: f.categoryId ? String(f.categoryId) : "",
                    driveUrl: f.driveUrl || "",
                    sourceType: f.sourceType || "upload",
                  });
                  editModal.onOpen();
                }}
                onDelete={(f) => setDeleteTarget({ type: "file", id: f.id, name: f.name })}
              />
            ))}
          </VStack>
        )}

        {pagination.totalPages > 1 && (
          <HStack justify="center" mt={8} spacing={3}>
            <Button
              size="sm"
              borderRadius="lg"
              isDisabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              السابق
            </Button>
            <Text fontSize="sm" color={muted}>
              صفحة {page} من {pagination.totalPages} ({pagination.total} ملف)
            </Text>
            <Button
              size="sm"
              borderRadius="lg"
              isDisabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              التالي
            </Button>
          </HStack>
        )}
      </Container>

      <UploadFileModal
        isOpen={uploadModal.isOpen}
        onClose={uploadModal.onClose}
        categories={categories}
        busy={busy}
        onAddDrive={handleAddDrive}
        onBulkDriveLinks={handleBulkDriveLinks}
        onUpload={handleUploadWithProgress}
      />

      <FilePreviewModal
        isOpen={previewModal.isOpen}
        onClose={closePreview}
        file={previewFile}
        previewData={previewData}
        previewUrl={previewUrl}
        previewMode={previewMode}
        textContent={previewTextContent}
        loading={previewLoading}
        onDownload={handleDownloadFile}
        downloading={previewFile && downloadingId === previewFile.id}
        onOpenExternal={(f) => {
          const url = getDriveOpenUrl(f, previewData?.embed) || buildFileOpenSrc(f.id, token);
          window.open(url, "_blank", "noopener,noreferrer");
        }}
      />

      {/* Edit modal */}
      <Modal isOpen={editModal.isOpen} onClose={editModal.onClose} size="md" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader>تعديل الملف</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>الاسم</FormLabel>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  borderRadius="lg"
                  bg={inputBg}
                />
              </FormControl>
              <FormControl>
                <FormLabel>الوصف</FormLabel>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  borderRadius="lg"
                  bg={inputBg}
                />
              </FormControl>
              <FormControl>
                <FormLabel>التصنيف</FormLabel>
                <Select
                  value={editForm.categoryId}
                  onChange={(e) => setEditForm((f) => ({ ...f, categoryId: e.target.value }))}
                  borderRadius="lg"
                  bg={inputBg}
                >
                  <option value="">بدون تصنيف</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              {editForm.sourceType === "drive" ? (
                <FormControl>
                  <FormLabel>رابط Google Drive</FormLabel>
                  <Input
                    value={editForm.driveUrl}
                    onChange={(e) => setEditForm((f) => ({ ...f, driveUrl: e.target.value }))}
                    borderRadius="lg"
                    bg={inputBg}
                    dir="ltr"
                    placeholder="https://drive.google.com/file/d/.../view"
                  />
                </FormControl>
              ) : null}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={editModal.onClose}>
              إلغاء
            </Button>
            <Button colorScheme="blue" borderRadius="lg" onClick={handleSaveEdit} isLoading={busy}>
              حفظ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Categories modal */}
      <Modal isOpen={categoriesModal.isOpen} onClose={categoriesModal.onClose} size="md" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader>إدارة التصنيفات</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <HStack mb={4}>
              <Input
                placeholder="اسم التصنيف الجديد"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                borderRadius="lg"
                bg={inputBg}
              />
              <Button colorScheme="blue" borderRadius="lg" onClick={handleSaveCategory} isLoading={busy}>
                {editingCategory ? "تحديث" : "إضافة"}
              </Button>
            </HStack>
            <VStack align="stretch" spacing={2}>
              {categories.map((c) => {
                const scheme = categoryScheme(c.id);
                return (
                  <Flex
                    key={c.id}
                    p={3}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor={border}
                    align="center"
                    justify="space-between"
                  >
                    <Badge
                      px={3}
                      py={1}
                      borderRadius="full"
                      bg={scheme.bg}
                      color={scheme.color}
                      borderWidth="1px"
                      borderColor={scheme.border}
                    >
                      {c.name}
                    </Badge>
                    <HStack>
                      <IconButton
                        aria-label="تعديل"
                        icon={<FaEdit />}
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          setEditingCategory(c);
                          setCategoryName(c.name);
                        }}
                      />
                      <IconButton
                        aria-label="حذف"
                        icon={<FaTrash />}
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() =>
                          setDeleteTarget({ type: "category", id: c.id, name: c.name })
                        }
                      />
                    </HStack>
                  </Flex>
                );
              })}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={!!deleteTarget}
        leastDestructiveRef={cancelRef}
        onClose={() => setDeleteTarget(null)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="xl">
            <AlertDialogHeader>تأكيد الحذف</AlertDialogHeader>
            <AlertDialogBody>حذف &quot;{deleteTarget?.name}&quot;؟</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setDeleteTarget(null)}>
                إلغاء
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} isLoading={busy} ml={3}>
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}

function KpiCard({ label, value, sub, icon, iconBg, iconColor, progress }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.600");

  return (
    <Box
      p={5}
      bg={bg}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={border}
      boxShadow="sm"
    >
      <Flex justify="space-between" align="start" mb={progress != null ? 3 : 0}>
        <Box>
          <Text fontSize="xs" color="gray.500" mb={1}>
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="extrabold" color="gray.800">
            {value}
          </Text>
          {sub && (
            <Text fontSize="xs" color="gray.400" mt={0.5}>
              {sub}
            </Text>
          )}
        </Box>
        <Flex w={11} h={11} borderRadius="xl" bg={iconBg} align="center" justify="center">
          <Icon as={icon} color={iconColor} boxSize={5} />
        </Flex>
      </Flex>
      {progress != null && (
        <Progress value={progress} size="xs" colorScheme="blue" borderRadius="full" />
      )}
    </Box>
  );
}

function FileGridCard({ file, onOpen, onDownload, onEdit, onDelete, isOpening, downloadingId }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.600");
  const meta = fileTypeMeta(file);
  const scheme = categoryScheme(file.categoryId || 0);
  const showThumb = !isDriveFile(file) && isImageExt(file.fileExtension) && file.fileUrl;

  return (
    <Box
      bg={bg}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={border}
      overflow="hidden"
      boxShadow="sm"
      transition="all 0.2s"
      _hover={{ boxShadow: "md", transform: "translateY(-2px)", borderColor: "blue.200" }}
      position="relative"
      cursor={isOpening ? "wait" : "pointer"}
      onClick={() => !isOpening && onOpen(file)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !isOpening) {
          e.preventDefault();
          onOpen(file);
        }
      }}
      aria-label={`فتح ${file.name}`}
    >
      {isOpening && (
        <Flex
          position="absolute"
          inset={0}
          bg="blackAlpha.300"
          zIndex={3}
          align="center"
          justify="center"
        >
          <Spinner color="white" />
        </Flex>
      )}

      <Box onClick={(e) => e.stopPropagation()} position="absolute" top={2} left={2} zIndex={2}>
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<FaEllipsisV />}
            size="xs"
            variant="ghost"
            opacity={0.7}
            bg="whiteAlpha.800"
            borderRadius="full"
            aria-label="خيارات الملف"
          />
          <MenuList>
            <MenuItem icon={<FaFolderOpen />} onClick={() => onOpen(file)}>
              معاينة
            </MenuItem>
            <MenuItem
              icon={<FaDownload />}
              onClick={() => downloadingId !== file.id && onDownload(file)}
            >
              تحميل
            </MenuItem>
            <MenuItem icon={<FaEdit />} onClick={() => onEdit(file)}>
              تعديل
            </MenuItem>
            <MenuItem icon={<FaTrash />} color="red.500" onClick={() => onDelete(file)}>
              حذف
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>

      <Flex
        h="120px"
        align="center"
        justify="center"
        bg={showThumb ? "gray.50" : meta.bg}
        p={3}
        pointerEvents="none"
      >
        {showThumb ? (
          <Image
            src={file.fileUrl}
            alt={file.name}
            maxH="100px"
            maxW="100%"
            objectFit="contain"
            borderRadius="md"
          />
        ) : (
          <Icon as={meta.Icon} boxSize={12} color={meta.color} />
        )}
      </Flex>

      <Box p={3} pointerEvents="none">
        <Text fontWeight="bold" fontSize="sm" noOfLines={2} mb={3} minH="40px">
          {file.name}
        </Text>
        <Flex justify="space-between" align="center" gap={2}>
          {file.categoryName ? (
            <Badge
              fontSize="10px"
              px={2}
              py={0.5}
              borderRadius="full"
              bg={scheme.bg}
              color={scheme.color}
              borderWidth="1px"
              borderColor={scheme.border}
              noOfLines={1}
              maxW="60%"
            >
              {file.categoryName}
            </Badge>
          ) : (
            <Box />
          )}
          {isDriveFile(file) ? (
            <Badge fontSize="10px" colorScheme="green" borderRadius="full">
              Drive
            </Badge>
          ) : null}
          <Text fontSize="xs" color="gray.400" flexShrink={0}>
            {formatFileSize(file.fileSize)}
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}

function FileListRow({ file, onOpen, onDownload, onEdit, onDelete, isOpening, downloadingId }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.100", "gray.600");
  const meta = fileTypeMeta(file);
  const scheme = categoryScheme(file.categoryId || 0);

  return (
    <Flex
      bg={bg}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={border}
      p={4}
      align="center"
      gap={4}
      boxShadow="sm"
      cursor={isOpening ? "wait" : "pointer"}
      transition="all 0.2s"
      _hover={{ borderColor: "blue.200", boxShadow: "md" }}
      onClick={() => !isOpening && onOpen(file)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !isOpening) {
          e.preventDefault();
          onOpen(file);
        }
      }}
    >
      <Flex w={12} h={12} borderRadius="lg" bg={meta.bg} align="center" justify="center" flexShrink={0}>
        {isOpening ? (
          <Spinner size="sm" color={meta.color} />
        ) : (
          <Icon as={meta.Icon} color={meta.color} boxSize={5} />
        )}
      </Flex>
      <Box flex={1} minW={0}>
        <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
          {file.name}
        </Text>
        <HStack spacing={2} mt={1}>
          <Text fontSize="xs" color="gray.400">
            {formatFileSize(file.fileSize)}
            {file.downloadsCount != null ? ` · ${file.downloadsCount} تحميل` : ""}
          </Text>
          {file.categoryName && (
            <Badge
              fontSize="10px"
              px={2}
              borderRadius="full"
              bg={scheme.bg}
              color={scheme.color}
            >
              {file.categoryName}
            </Badge>
          )}
          {isDriveFile(file) && (
            <Badge fontSize="10px" colorScheme="green" borderRadius="full">
              Drive
            </Badge>
          )}
        </HStack>
      </Box>
      <HStack spacing={1} onClick={(e) => e.stopPropagation()}>
        <IconButton
          aria-label="معاينة"
          icon={<FaFolderOpen />}
          size="sm"
          variant="ghost"
          colorScheme="blue"
          isLoading={isOpening}
          onClick={() => onOpen(file)}
        />
        <IconButton
          aria-label="تحميل"
          icon={<FaDownload />}
          size="sm"
          variant="ghost"
          colorScheme="green"
          isLoading={downloadingId === file.id}
          onClick={() => onDownload(file)}
        />
        <IconButton
          aria-label="تعديل"
          icon={<FaEdit />}
          size="sm"
          variant="ghost"
          onClick={() => onEdit(file)}
        />
        <IconButton
          aria-label="حذف"
          icon={<FaTrash />}
          size="sm"
          variant="ghost"
          colorScheme="red"
          onClick={() => onDelete(file)}
        />
      </HStack>
    </Flex>
  );
}
