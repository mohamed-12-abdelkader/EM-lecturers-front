import { useCallback, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiArrowRight } from "react-icons/fi";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { courseFilesApiError, getCourseFileDisplayName } from "../../api/courseFilesApi";
import { useCourseFile } from "../../Hooks/course/useCourseFiles";
import { getCourseFileViewBackPath } from "../../utils/courseFileView";
import PdfViewer from "./components/PdfViewer";
import useFileScrollIsolation from "./hooks/useFileScrollIsolation";
import useLockPageScroll from "./hooks/useLockPageScroll";

function isNumericFileId(fileId) {
  return fileId && fileId !== "view" && /^\d+$/.test(String(fileId));
}

export default function CourseFileViewPage() {
  const { courseId, fileId } = useParams();
  const navigate = useNavigate();
  const viewerRef = useRef(null);

  const validFileId = isNumericFileId(fileId) ? fileId : null;
  const { data: file, isLoading, isError, error, refetch } = useCourseFile(validFileId, {
    enabled: Boolean(validFileId),
  });

  const fileName = file ? getCourseFileDisplayName(file) : "معاينة الملف";

  const goBack = useCallback(() => {
    navigate(getCourseFileViewBackPath(courseId, "files"));
  }, [courseId, navigate]);

  useLockPageScroll(true);
  useFileScrollIsolation(viewerRef, true);

  useEffect(() => {
    document.title = `${fileName} — ملف الكورس`;
    return () => {
      document.title = "E-M Lecture";
    };
  }, [fileName]);

  const headerBg = useColorModeValue("white", "gray.900");
  const headerBorder = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const viewerBg = useColorModeValue("gray.100", "gray.950");

  if (!courseId || !fileId) {
    return <Navigate to="/home" replace />;
  }

  return (
    <Box
      dir="rtl"
      position="fixed"
      inset={0}
      zIndex={1400}
      bg={viewerBg}
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      <Flex
        as="header"
        align="center"
        gap={3}
        px={{ base: 3, md: 5 }}
        py={2.5}
        bg={headerBg}
        borderBottom="1px solid"
        borderColor={headerBorder}
        flexShrink={0}
        boxShadow="sm"
        minH="52px"
      >
        <IconButton
          aria-label="العودة لملفات الكورس"
          icon={<Icon as={FiArrowRight} boxSize={5} />}
          variant="ghost"
          borderRadius="xl"
          onClick={goBack}
          flexShrink={0}
        />

        <Box flex={1} minW={0} textAlign="right">
          <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }} noOfLines={1}>
            {isLoading ? "جاري فتح الملف..." : fileName}
          </Text>
          <Text fontSize="xs" color={muted} mt={0.5}>
            عرض داخل المنصة — لا يُفتح رابط خارجي
          </Text>
        </Box>

        <Button size="sm" variant="outline" borderRadius="xl" onClick={goBack}>
          إغلاق
        </Button>
      </Flex>

      <Box
        ref={viewerRef}
        flex={1}
        minH={0}
        overflow="hidden"
        display="flex"
        flexDirection="column"
      >
        {!validFileId ? (
          <Flex flex={1} align="center" justify="center" px={6}>
            <Text color="red.500" textAlign="center" role="alert">
              رابط الملف غير صالح. ارجع إلى ملفات الكورس وافتح الملف من هناك.
            </Text>
          </Flex>
        ) : isError && !file ? (
          <Flex flex={1} align="center" justify="center" direction="column" gap={3} px={6}>
            <Text color="red.500" textAlign="center" role="alert">
              {courseFilesApiError(error, "تعذّر فتح الملف")}
            </Text>
            <Button size="sm" variant="outline" borderRadius="xl" onClick={() => refetch()}>
              إعادة المحاولة
            </Button>
            <Button size="sm" variant="ghost" onClick={goBack}>
              العودة للكورس
            </Button>
          </Flex>
        ) : (
          <PdfViewer fileId={validFileId} fileName={fileName} onRetry={refetch} />
        )}
      </Box>
    </Box>
  );
}
