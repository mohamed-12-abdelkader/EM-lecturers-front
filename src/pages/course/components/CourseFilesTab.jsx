import { useMemo, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  Grid,
  HStack,
  Icon,
  IconButton,
  Spinner,
  Text,
  Tooltip,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  FaDownload,
  FaEye,
  FaExternalLinkAlt,
  FaFileAlt,
  FaFileArchive,
  FaFileExcel,
  FaFileImage,
  FaFilePdf,
  FaFilePowerpoint,
  FaFileWord,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import {
  courseFilesApiError,
  formatCourseFileSize,
  getCourseFileDisplayName,
  getCourseFileKind,
  getCourseFileUrl,
  isCourseFileImage,
  isCourseFilePdf,
} from "../../../api/courseFilesApi";
import { useCourseFileMutations, useCourseFiles } from "../../../Hooks/course/useCourseFiles";
import { buildCourseFileViewPath } from "../../../utils/courseFileView";
import { isGoogleDriveUrl } from "../../../utils/googleDriveEmbed";
import { crEyebrowOrange, crSubheading, lcLabel } from "../courseTheme";
import CourseFileUploadModal from "./CourseFileUploadModal";

const KIND_META = {
  pdf: {
    icon: FaFilePdf,
    gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    chip: "PDF",
    chipScheme: "red",
  },
  image: {
    icon: FaFileImage,
    gradient: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    chip: "صورة",
    chipScheme: "green",
  },
  doc: {
    icon: FaFileWord,
    gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    chip: "مستند",
    chipScheme: "blue",
  },
  sheet: {
    icon: FaFileExcel,
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    chip: "جدول",
    chipScheme: "teal",
  },
  slides: {
    icon: FaFilePowerpoint,
    gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    chip: "عرض",
    chipScheme: "orange",
  },
  archive: {
    icon: FaFileArchive,
    gradient: "linear-gradient(135deg, #a855f7 0%, #9333ea 100%)",
    chip: "مضغوط",
    chipScheme: "purple",
  },
  other: {
    icon: FaFileAlt,
    gradient: "linear-gradient(135deg, #64748b 0%, #475569 100%)",
    chip: "ملف",
    chipScheme: "gray",
  },
};

function formatFileDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

function CourseFileCard({
  file,
  courseId,
  canManage,
  onDelete,
  sectionBg,
  borderColor,
  textColor,
  subTextColor,
}) {
  const href = getCourseFileUrl(file);
  const name = getCourseFileDisplayName(file);
  const kind = getCourseFileKind(file);
  const meta = KIND_META[kind] || KIND_META.other;
  const sizeLabel = formatCourseFileSize(file.file_size);
  const dateLabel = formatFileDate(file.created_at || file.updated_at);
  const viewPath = buildCourseFileViewPath(courseId, file);
  const canInAppView =
    viewPath &&
    (isCourseFilePdf(file) || isGoogleDriveUrl(href) || isCourseFileImage(file));

  return (
    <Box
      role="group"
      bg={sectionBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="2xl"
      overflow="hidden"
      transition="all 0.25s ease"
      _hover={{
        transform: "translateY(-4px)",
        boxShadow: "xl",
        borderColor: "purple.300",
      }}
    >
      <Box h="3px" bgGradient={meta.gradient} />

      <VStack align="stretch" p={{ base: 4, md: 5 }} spacing={4}>
        <Flex align="start" gap={3}>
          <Center
            w={12}
            h={12}
            borderRadius="xl"
            bgGradient={meta.gradient}
            color="white"
            flexShrink={0}
            boxShadow="md"
          >
            <Icon as={meta.icon} boxSize={5} />
          </Center>

          <Box flex={1} minW={0} textAlign="right">
            <Text fontWeight="bold" fontSize="md" color={textColor} noOfLines={2} lineHeight="short">
              {name}
            </Text>
            <HStack mt={2} spacing={2} flexWrap="wrap" justify="flex-start">
              <Badge colorScheme={meta.chipScheme} borderRadius="full" px={2}>
                {meta.chip}
              </Badge>
              {sizeLabel ? (
                <Badge variant="subtle" colorScheme="gray" borderRadius="full" px={2}>
                  {sizeLabel}
                </Badge>
              ) : null}
              {dateLabel ? (
                <Text fontSize="xs" color={subTextColor}>
                  {dateLabel}
                </Text>
              ) : null}
            </HStack>
          </Box>
        </Flex>

        <HStack spacing={2} justify="stretch">
          {href ? (
            canInAppView ? (
              <Button
                as={RouterLink}
                to={viewPath}
                size="sm"
                colorScheme="purple"
                borderRadius="xl"
                leftIcon={<Icon as={FaEye} />}
                flex={1}
              >
                عرض
              </Button>
            ) : (
              <Button
                as="a"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
                colorScheme="blue"
                borderRadius="xl"
                leftIcon={<Icon as={FaExternalLinkAlt} />}
                flex={1}
              >
                فتح
              </Button>
            )
          ) : null}

          {href ? (
            <Tooltip label="تحميل">
              <IconButton
                as="a"
                href={href}
                download
                target="_blank"
                rel="noopener noreferrer"
                aria-label="تحميل الملف"
                icon={<FaDownload />}
                size="sm"
                variant="outline"
                borderRadius="xl"
              />
            </Tooltip>
          ) : null}

          {canManage ? (
            <Tooltip label="حذف">
              <IconButton
                aria-label="حذف الملف"
                icon={<FaTrash />}
                size="sm"
                colorScheme="red"
                variant="outline"
                borderRadius="xl"
                onClick={() => onDelete(file)}
              />
            </Tooltip>
          ) : null}
        </HStack>
      </VStack>
    </Box>
  );
}

export default function CourseFilesTab({
  courseId,
  isTeacher,
  isAdmin,
  borderColor,
  sectionBg,
  textColor,
  subTextColor,
}) {
  const toast = useToast();
  const canManage = isTeacher || isAdmin;
  const uploadModal = useDisclosure();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const cancelRef = useRef(null);

  const { data: files = [], isLoading, isError, error, refetch } = useCourseFiles(courseId, {
    enabled: Boolean(courseId),
  });
  const { uploadMutation, deleteMutation } = useCourseFileMutations(courseId);

  const stats = useMemo(() => {
    const pdfCount = files.filter((f) => getCourseFileKind(f) === "pdf").length;
    return { total: files.length, pdfCount };
  }, [files]);

  const handleUpload = async (payload) => {
    try {
      await uploadMutation.mutateAsync(payload);
      toast({
        title: "تم إضافة الملف بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      uploadModal.onClose();
    } catch (err) {
      toast({
        title: "تعذّر رفع الملف",
        description: courseFilesApiError(err),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast({
        title: "تم حذف الملف",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setDeleteTarget(null);
    } catch (err) {
      toast({
        title: "تعذّر حذف الملف",
        description: courseFilesApiError(err),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <VStack spacing={{ base: 5, md: 6 }} align="stretch" dir="rtl">
      <Box
        className="relative overflow-hidden rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-blue-50 p-5 dark:border-purple-900/40 dark:from-purple-950/40 dark:via-slate-900 dark:to-blue-950/30 md:p-6"
        textAlign="right"
      >
        <Box
          aria-hidden
          className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-purple-200/40 blur-2xl dark:bg-purple-700/20"
        />
        <Box
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -right-6 h-36 w-36 rounded-full bg-blue-200/40 blur-2xl dark:bg-blue-700/20"
        />

        <Flex
          justify="space-between"
          align={{ base: "stretch", sm: "center" }}
          gap={4}
          direction={{ base: "column", sm: "row" }}
          position="relative"
        >
          <div className="min-w-0">
            <span className={crEyebrowOrange}>محتوى الكورس</span>
            <h2 className={`${crSubheading} mt-2 text-xl tracking-tight md:text-2xl`}>
              ملفات الكورس
            </h2>
            <p className={`mt-2 max-w-xl ${lcLabel}`}>
              المرفقات والملزمات على مستوى الكورس — اعرضها داخل المنصة أو حمّلها مباشرة
            </p>
            {!isLoading && files.length > 0 ? (
              <HStack mt={3} spacing={2} flexWrap="wrap">
                <Badge colorScheme="purple" borderRadius="full" px={3} py={1}>
                  {stats.total.toLocaleString("ar-EG")} ملف
                </Badge>
                {stats.pdfCount > 0 ? (
                  <Badge colorScheme="red" variant="subtle" borderRadius="full" px={3} py={1}>
                    {stats.pdfCount.toLocaleString("ar-EG")} PDF
                  </Badge>
                ) : null}
              </HStack>
            ) : null}
          </div>

          {canManage ? (
            <Button
              colorScheme="purple"
              size="md"
              borderRadius="xl"
              leftIcon={<Icon as={FaPlus} />}
              alignSelf={{ base: "stretch", sm: "center" }}
              onClick={uploadModal.onOpen}
            >
              إضافة ملف
            </Button>
          ) : null}
        </Flex>
      </Box>

      {isLoading ? (
        <Center py={16}>
          <Spinner size="lg" color="purple.500" thickness="3px" />
        </Center>
      ) : isError ? (
        <Center py={12} flexDir="column" gap={3} textAlign="center">
          <Text color="red.500">{courseFilesApiError(error, "تعذّر تحميل الملفات")}</Text>
          <Button size="sm" variant="outline" borderRadius="xl" onClick={() => refetch()}>
            إعادة المحاولة
          </Button>
        </Center>
      ) : files.length === 0 ? (
        <Center py={8} flexDir="column" textAlign="center">
          <Box
            mx="auto"
            display="flex"
            aspectRatio={1}
            w={{ base: "16rem", sm: "20rem" }}
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
            borderRadius="full"
            bg="black"
          >
            <Box
              as="img"
              src="/images/course-files-empty.jpg"
              alt="لا يوجد ملفات — سيتم إضافتها قريباً"
              w="full"
              h="full"
              objectFit="contain"
              loading="lazy"
              decoding="async"
            />
          </Box>
          {canManage ? (
            <Button
              mt={6}
              colorScheme="purple"
              borderRadius="xl"
              leftIcon={<Icon as={FaPlus} />}
              onClick={uploadModal.onOpen}
            >
              أضف أول ملف
            </Button>
          ) : null}
        </Center>
      ) : (
        <Grid
          templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" }}
          gap={{ base: 4, md: 5 }}
        >
          {files.map((file) => (
            <CourseFileCard
              key={file.id}
              file={file}
              courseId={courseId}
              canManage={canManage}
              onDelete={setDeleteTarget}
              sectionBg={sectionBg}
              borderColor={borderColor}
              textColor={textColor}
              subTextColor={subTextColor}
            />
          ))}
        </Grid>
      )}

      <CourseFileUploadModal
        isOpen={uploadModal.isOpen}
        onClose={uploadModal.onClose}
        onSubmit={handleUpload}
        loading={uploadMutation.isPending}
      />

      <AlertDialog
        isOpen={Boolean(deleteTarget)}
        leastDestructiveRef={cancelRef}
        onClose={() => !deleteMutation.isPending && setDeleteTarget(null)}
      >
        <AlertDialogOverlay backdropFilter="blur(4px)">
          <AlertDialogContent borderRadius="2xl" mx={4}>
            <AlertDialogHeader fontSize="lg">حذف الملف</AlertDialogHeader>
            <AlertDialogBody>
              هل أنت متأكد من حذف &quot;{getCourseFileDisplayName(deleteTarget)}&quot;؟ لا يمكن
              التراجع عن هذا الإجراء.
            </AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button
                ref={cancelRef}
                onClick={() => setDeleteTarget(null)}
                isDisabled={deleteMutation.isPending}
              >
                إلغاء
              </Button>
              <Button
                colorScheme="red"
                onClick={handleConfirmDelete}
                isLoading={deleteMutation.isPending}
                loadingText="جاري الحذف..."
              >
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
}
