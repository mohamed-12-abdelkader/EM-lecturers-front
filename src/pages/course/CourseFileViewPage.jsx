import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Flex,
  HStack,
  Icon,
  IconButton,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiArrowRight, FiExternalLink } from "react-icons/fi";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import CourseInAppPdfViewer from "./components/CourseInAppPdfViewer";
import useFileScrollIsolation from "./hooks/useFileScrollIsolation";
import useLockPageScroll from "./hooks/useLockPageScroll";
import {
  getCourseFileViewBackPath,
  isDriveFileView,
  resolveCourseFileOpenUrl,
} from "../../utils/courseFileView";

export default function CourseFileViewPage() {
  const { courseId, fileId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const viewerRef = useRef(null);

  const titleParam = searchParams.get("title");
  const urlParam = searchParams.get("url");

  const fileName = useMemo(() => {
    if (!titleParam) return "معاينة الملف";
    try {
      return decodeURIComponent(titleParam);
    } catch {
      return titleParam;
    }
  }, [titleParam]);

  const fileUrl = useMemo(() => {
    if (!urlParam) return null;
    try {
      return decodeURIComponent(urlParam);
    } catch {
      return urlParam;
    }
  }, [urlParam]);

  const openUrl = useMemo(
    () => resolveCourseFileOpenUrl({ fileId, url: fileUrl }),
    [fileId, fileUrl],
  );

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
            {fileName}
          </Text>
          <Text fontSize="xs" color={muted} mt={0.5}>
            مرّر داخل منطقة الملف — scrollbar أزرق على اليمين
          </Text>
        </Box>

        {openUrl ? (
          <HStack spacing={2} flexShrink={0}>
            <Box
              as="a"
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={!isDriveFileView({ fileId, url: fileUrl }) || undefined}
              display={{ base: "none", sm: "inline-flex" }}
              alignItems="center"
              gap={2}
              px={3}
              py={1.5}
              fontSize="sm"
              border="1px solid"
              borderColor={headerBorder}
              borderRadius="xl"
            >
              <Icon as={FiExternalLink} />
              {isDriveFileView({ fileId, url: fileUrl }) ? "Drive" : "تحميل"}
            </Box>
          </HStack>
        ) : null}
      </Flex>

      <Box
        ref={viewerRef}
        flex={1}
        minH={0}
        overflow="hidden"
        display="flex"
        flexDirection="column"
      >
        <CourseInAppPdfViewer fileId={fileId} fileUrl={fileUrl} fileName={fileName} />
      </Box>
    </Box>
  );
}
