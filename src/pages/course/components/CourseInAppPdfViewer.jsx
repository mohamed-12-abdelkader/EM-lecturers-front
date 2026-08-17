import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Center, Flex, Image, Spinner, Text, useColorModeValue } from "@chakra-ui/react";
import PdfJsScrollViewer from "./PdfJsScrollViewer";
import {
  isCourseFileImage,
  isCourseFilePdf,
  resolveCourseFileAbsoluteUrl,
} from "../../../api/courseFilesApi";
import {
  getDrivePdfProxyUrl,
  isDirectPdfUrl,
  resolveCourseFileEmbedSrc,
  resolveLocalPdfUrl,
} from "../../../utils/courseFileView";
import { isGoogleDriveUrl } from "../../../utils/googleDriveEmbed";

function DriveIframeViewer({ src, fileName }) {
  const iframeRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const bg = useColorModeValue("gray.100", "gray.950");
  const border = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    const timer = window.setTimeout(() => iframeRef.current?.focus?.(), 400);
    return () => window.clearTimeout(timer);
  }, [src]);

  return (
    <Box
      data-file-scroll="true"
      flex={1}
      minH={0}
      h="100%"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      bg={bg}
    >
      <Flex
        px={3}
        py={2}
        borderBottom="1px solid"
        borderColor={border}
        align="center"
        justify="center"
        flexShrink={0}
        bg="white"
        _dark={{ bg: "gray.900" }}
      >
        <Text fontSize="xs" color="gray.500">
          اضغط داخل العارض ثم مرّر لقراءة الملف
        </Text>
      </Flex>

      <Box flex={1} minH={0} position="relative">
        {!loaded ? (
          <Center position="absolute" inset={0} zIndex={2} bg={bg}>
            <Spinner size="lg" color="blue.500" thickness="3px" />
          </Center>
        ) : null}

        <Box
          ref={iframeRef}
          as="iframe"
          title={fileName || "معاينة الملف"}
          src={src}
          w="full"
          h="full"
          border="none"
          display="block"
          allow="autoplay; fullscreen"
          scrolling="yes"
          tabIndex={0}
          onLoad={() => {
            setLoaded(true);
            iframeRef.current?.focus?.();
          }}
        />
      </Box>
    </Box>
  );
}

function DrivePdfProxyViewer({ fileId, fileName, onFallback }) {
  const proxyUrl = getDrivePdfProxyUrl(fileId);

  if (!proxyUrl) {
    onFallback();
    return null;
  }

  return (
    <PdfJsScrollViewer
      src={proxyUrl}
      fileName={fileName}
      onLoadError={onFallback}
    />
  );
}

function ImageViewer({ src, fileName }) {
  const bg = useColorModeValue("gray.100", "gray.950");
  return (
    <Box
      data-file-scroll="true"
      flex={1}
      minH={0}
      h="100%"
      overflow="auto"
      bg={bg}
      p={{ base: 4, md: 8 }}
    >
      <Image
        src={src}
        alt={fileName || "صورة"}
        maxW="100%"
        mx="auto"
        borderRadius="xl"
        boxShadow="lg"
      />
    </Box>
  );
}

export default function CourseInAppPdfViewer({ fileId, fileUrl, fileName }) {
  const [mode, setMode] = useState("checking");
  const [localPdfUrl, setLocalPdfUrl] = useState(null);
  const [embedSrc, setEmbedSrc] = useState(null);

  const bg = useColorModeValue("gray.100", "gray.950");
  const muted = useColorModeValue("gray.500", "gray.400");

  const resolvedFileUrl = useMemo(() => {
    if (!fileUrl) return null;
    return resolveCourseFileAbsoluteUrl(fileUrl) || fileUrl;
  }, [fileUrl]);

  const fallbackEmbedSrc = resolveCourseFileEmbedSrc({ fileId, url: resolvedFileUrl });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setMode("checking");
      setLocalPdfUrl(null);
      setEmbedSrc(null);

      const url = resolvedFileUrl;

      if (url && isCourseFileImage({ file_url: url })) {
        setMode("image");
        return;
      }

      if (url && (isCourseFilePdf({ file_url: url }) || isDirectPdfUrl(url))) {
        if (isGoogleDriveUrl(url)) {
          const local = await resolveLocalPdfUrl({ fileId, url });
          if (cancelled) return;

          if (local) {
            setLocalPdfUrl(local);
            setMode("local");
            return;
          }

          if (fileId && fileId !== "view" && !/^\d+$/.test(String(fileId))) {
            setMode("proxy");
            return;
          }

          setEmbedSrc(fallbackEmbedSrc);
          setMode("iframe");
          return;
        }

        // Bunny CDN أو /uploads/ على الـ API — iframe عبر file_url
        setEmbedSrc(url);
        setMode("iframe");
        return;
      }

      const local = await resolveLocalPdfUrl({ fileId, url });
      if (cancelled) return;

      if (local) {
        setLocalPdfUrl(local);
        setMode("local");
        return;
      }

      if (fileId && fileId !== "view" && !/^\d+$/.test(String(fileId))) {
        setMode("proxy");
        return;
      }

      setEmbedSrc(fallbackEmbedSrc);
      setMode("iframe");
    })();

    return () => {
      cancelled = true;
    };
  }, [fileId, resolvedFileUrl, fallbackEmbedSrc]);

  const handleProxyFallback = useCallback(() => {
    setEmbedSrc(fallbackEmbedSrc);
    setMode("iframe");
  }, [fallbackEmbedSrc]);

  const handleLocalError = useCallback(() => {
    if (fileId && fileId !== "view") {
      setMode("proxy");
      return;
    }
    setEmbedSrc(fallbackEmbedSrc);
    setMode("iframe");
  }, [fileId, fallbackEmbedSrc]);

  if (mode === "checking") {
    return (
      <Center flex={1} minH={0} bg={bg}>
        <Spinner size="lg" color="blue.500" thickness="3px" />
      </Center>
    );
  }

  if (mode === "image" && resolvedFileUrl) {
    return <ImageViewer src={resolvedFileUrl} fileName={fileName} />;
  }

  if ((mode === "local" || mode === "remote") && localPdfUrl) {
    return (
      <PdfJsScrollViewer
        src={localPdfUrl}
        fileName={fileName}
        onLoadError={handleLocalError}
      />
    );
  }

  if (mode === "proxy" && fileId && fileId !== "view") {
    return (
      <DrivePdfProxyViewer
        fileId={fileId}
        fileName={fileName}
        onFallback={handleProxyFallback}
      />
    );
  }

  if (mode === "iframe" && embedSrc) {
    return <DriveIframeViewer src={embedSrc} fileName={fileName} />;
  }

  return (
    <Center flex={1} minH={0} bg={bg} px={6}>
      <Text color={muted} textAlign="center">
        لا يتوفر رابط عرض لهذا الملف.
      </Text>
    </Center>
  );
}
