import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Center,
  Flex,
  Grid,
  HStack,
  Icon,
  Skeleton,
  Text,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { FaFilePdf, FaPlus } from "react-icons/fa";
import { courseFilesApiError } from "../../../api/courseFilesApi";
import { useCourseFileMutations, useCourseFiles } from "../../../Hooks/course/useCourseFiles";
import { crEyebrowOrange, crSubheading, lcLabel } from "../courseTheme";
import CourseFileCard from "./CourseFileCard";
import DeleteCourseFileModal from "./DeleteCourseFileModal";
import EditCourseFileModal from "./EditCourseFileModal";
import UploadCourseFileModal from "./UploadCourseFileModal";
import {
  TOUR_CLOSE_FILE_UPLOAD,
  TOUR_OPEN_FILE_UPLOAD,
} from "../../../utils/teacherCoursePageTour";

function CourseFilesSkeleton() {
  return (
    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" }} gap={4}>
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} height="180px" borderRadius="2xl" />
      ))}
    </Grid>
  );
}

export default function CourseFiles({
  courseId,
  canManage = false,
  borderColor,
  sectionBg,
  textColor,
  subTextColor,
}) {
  const toast = useToast();
  const uploadModal = useDisclosure();
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: files = [], isLoading, isError, error, refetch } = useCourseFiles(courseId, {
    enabled: Boolean(courseId),
  });
  const { uploadMutation, updateMutation, deleteMutation } = useCourseFileMutations(courseId);

  useEffect(() => {
    const openUpload = () => uploadModal.onOpen();
    const closeUpload = () => uploadModal.onClose();
    window.addEventListener(TOUR_OPEN_FILE_UPLOAD, openUpload);
    window.addEventListener(TOUR_CLOSE_FILE_UPLOAD, closeUpload);
    return () => {
      window.removeEventListener(TOUR_OPEN_FILE_UPLOAD, openUpload);
      window.removeEventListener(TOUR_CLOSE_FILE_UPLOAD, closeUpload);
    };
  }, [uploadModal.onOpen, uploadModal.onClose]);

  const handleUpload = async (payload) => {
    try {
      await uploadMutation.mutateAsync(payload);
      toast({
        title: "تم رفع الملف بنجاح",
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

  const handleEdit = async (payload) => {
    if (!editTarget) return;
    try {
      await updateMutation.mutateAsync({ fileId: editTarget.id, ...payload });
      toast({
        title: "تم تحديث الملف بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setEditTarget(null);
    } catch (err) {
      toast({
        title: "تعذّر تحديث الملف",
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
        title: "تم حذف الملف بنجاح",
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
        className="relative overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-red-50 p-5 dark:border-orange-900/40 dark:from-orange-950/40 dark:via-slate-900 dark:to-red-950/30 md:p-6"
        textAlign="right"
      >
        <Box
          aria-hidden
          className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-orange-200/40 blur-2xl dark:bg-orange-700/20"
        />
        <Box
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -right-6 h-36 w-36 rounded-full bg-red-200/40 blur-2xl dark:bg-red-700/20"
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
              ملفات PDF الخاصة بالكورس — تُعرض داخل المنصة بعد التحقق من صلاحيتك
            </p>
            {!isLoading && files.length > 0 ? (
              <HStack mt={3} spacing={2} flexWrap="wrap">
                <Box
                  as="span"
                  fontSize="xs"
                  fontWeight="bold"
                  color="orange.600"
                  bg="orange.50"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {files.length.toLocaleString("ar-EG")} ملف PDF
                </Box>
              </HStack>
            ) : null}
          </div>

          {canManage ? (
            <Button
              data-tour-id="course-add-file-btn"
              colorScheme="orange"
              size="md"
              borderRadius="xl"
              leftIcon={<Icon as={FaPlus} />}
              alignSelf={{ base: "stretch", sm: "center" }}
              onClick={uploadModal.onOpen}
            >
              إضافة ملف PDF
            </Button>
          ) : null}
        </Flex>
      </Box>

      {isLoading ? (
        <CourseFilesSkeleton />
      ) : isError ? (
        <Center py={12} flexDir="column" gap={3} textAlign="center" px={4}>
          <Text color={error?.response?.status === 403 ? "orange.500" : "red.500"} role="alert">
            {courseFilesApiError(error, "تعذّر تحميل الملفات")}
          </Text>
          {error?.response?.status === 403 && !canManage ? (
            <Text fontSize="sm" color={subTextColor}>
              اشترك في الكورس أو فعّله لعرض ملفات PDF
            </Text>
          ) : null}
          <Button size="sm" variant="outline" borderRadius="xl" onClick={() => refetch()}>
            إعادة المحاولة
          </Button>
        </Center>
      ) : files.length === 0 ? (
        <Center py={12} flexDir="column" textAlign="center" px={4}>
          <Center
            w={16}
            h={16}
            borderRadius="2xl"
            bg="red.50"
            color="red.500"
            mb={4}
            aria-hidden
          >
            <Icon as={FaFilePdf} boxSize={8} />
          </Center>
          <Text fontWeight="bold" fontSize="lg" color={textColor}>
            لا توجد ملفات حالياً
          </Text>
          <Text mt={2} fontSize="sm" color={subTextColor} maxW="md">
            سيتم عرض ملفات الكورس هنا عند إضافتها.
          </Text>
          {canManage ? (
            <Button
              mt={6}
              colorScheme="orange"
              borderRadius="xl"
              leftIcon={<Icon as={FaPlus} />}
              onClick={uploadModal.onOpen}
            >
              إضافة ملف PDF
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
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
              sectionBg={sectionBg}
              borderColor={borderColor}
              textColor={textColor}
              subTextColor={subTextColor}
            />
          ))}
        </Grid>
      )}

      <UploadCourseFileModal
        isOpen={uploadModal.isOpen}
        onClose={uploadModal.onClose}
        onSubmit={handleUpload}
        loading={uploadMutation.isPending}
      />

      <EditCourseFileModal
        isOpen={Boolean(editTarget)}
        onClose={() => !updateMutation.isPending && setEditTarget(null)}
        file={editTarget}
        onSubmit={handleEdit}
        loading={updateMutation.isPending}
      />

      <DeleteCourseFileModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        file={deleteTarget}
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
      />
    </VStack>
  );
}
