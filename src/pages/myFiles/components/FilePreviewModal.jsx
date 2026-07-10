import React, { useEffect, useState } from "react";
import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Text,
  Button,
  HStack,
  Icon,
  Flex,
  Spinner,
  Center,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaDownload, FaExternalLinkAlt, FaFile, FaGoogleDrive } from "react-icons/fa";
import { formatFileSize, isDriveFile } from "../../../api/teacherMyFilesApi";

export default function FilePreviewModal({
  isOpen,
  onClose,
  file,
  previewData,
  previewUrl,
  previewMode = "blob",
  textContent,
  loading,
  onDownload,
  downloading,
  onOpenExternal,
}) {
  const muted = useColorModeValue("gray.500", "gray.400");
  const panelBg = useColorModeValue("gray.50", "gray.900");
  const textBg = useColorModeValue("white", "gray.800");
  const frameBg = useColorModeValue("gray.100", "gray.900");
  const [activeTab, setActiveTab] = useState(0);

  const display = previewData?.display ?? {};
  const preview = previewData?.preview ?? {};
  const viewerComponent =
    preview.viewerComponent || file?.viewerComponent || inferViewer(file?.previewType);
  const previewType = preview.type || file?.previewType || "none";
  const isDrive =
    previewMode === "drive" ||
    viewerComponent === "drive-embed" ||
    isDriveFile(file);
  const canInline =
    Boolean(previewUrl) &&
    (isDrive ||
      preview.canPreviewInline ||
      file?.canPreviewInline ||
      viewerComponent === "pdf-viewer" ||
      viewerComponent === "image-viewer" ||
      previewType === "pdf" ||
      previewType === "image");

  const paragraphs = textContent?.paragraphs?.length
    ? textContent.paragraphs
    : textContent?.text
      ? textContent.text.split(/\n{2,}/).filter(Boolean)
      : [];
  const hasTextTab =
    (preview.canExtractText || previewType === "pdf") &&
    (paragraphs.length > 0 || textContent?.text);

  useEffect(() => {
    if (isOpen) setActiveTab(0);
  }, [isOpen, file?.id]);

  if (!file && !loading) return null;

  const sizeLabel =
    display.fileSizeLabel || formatFileSize(file?.fileSize);
  const extLabel =
    display.extensionLabel || (file?.fileExtension || "").toUpperCase() || "ملف";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
      <ModalContent borderRadius="2xl" maxH="92vh" mx={4}>
        <ModalHeader pb={2} pr={12}>
          <Text fontWeight="bold" noOfLines={1}>
            {file?.name || "معاينة الملف"}
          </Text>
          {file && (
            <HStack spacing={2} mt={1} flexWrap="wrap">
              <Badge colorScheme={display.badgeColor || "blue"} fontSize="xs">
                {extLabel}
              </Badge>
              <Text fontSize="xs" color={muted}>
                {sizeLabel}
              </Text>
              {file.categoryName && (
                <Text fontSize="xs" color={muted}>
                  · {file.categoryName}
                </Text>
              )}
              {isDrive ? (
                <Badge colorScheme="green" fontSize="10px">
                  Google Drive
                </Badge>
              ) : null}
              {file.downloadsCount != null && (
                <Text fontSize="xs" color={muted}>
                  · {file.downloadsCount} تحميل
                </Text>
              )}
              {textContent?.pageCount ? (
                <Text fontSize="xs" color={muted}>
                  · {textContent.pageCount} صفحة
                </Text>
              ) : null}
            </HStack>
          )}
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody p={0} bg={panelBg}>
          {loading ? (
            <Center minH="60vh">
              <VStack spacing={3}>
                <Spinner size="lg" color="blue.400" thickness="3px" />
                <Text fontSize="sm" color={muted}>
                  جاري تحميل المعاينة...
                </Text>
              </VStack>
            </Center>
          ) : canInline && hasTextTab ? (
            <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" colorScheme="blue">
              <TabList px={4} pt={3} bg={panelBg}>
                <Tab fontSize="sm">عرض الملف</Tab>
                <Tab fontSize="sm">النص المستخرج</Tab>
              </TabList>
              <TabPanels>
                <TabPanel p={0}>
                  <InlinePreview
                    viewerComponent={viewerComponent}
                    previewType={previewType}
                    previewUrl={previewUrl}
                    previewMode={previewMode}
                    file={file}
                    frameBg={frameBg}
                    isDrive={isDrive}
                  />
                </TabPanel>
                <TabPanel px={4} py={4}>
                  <ExtractedTextPanel
                    paragraphs={paragraphs}
                    textContent={textContent}
                    textBg={textBg}
                    muted={muted}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          ) : canInline ? (
            <InlinePreview
              viewerComponent={viewerComponent}
              previewType={previewType}
              previewUrl={previewUrl}
              previewMode={previewMode}
              file={file}
              frameBg={frameBg}
              isDrive={isDrive}
            />
          ) : (
            <Center flexDirection="column" gap={4} minH="50vh" p={8}>
              <Flex w={16} h={16} borderRadius="2xl" bg="blue.50" align="center" justify="center">
                <Icon as={FaFile} boxSize={8} color="blue.400" />
              </Flex>
              <Text color={muted} textAlign="center" maxW="md">
                {textContent?.message ||
                  "لا يمكن عرض هذا النوع داخل الموقع (Word، PowerPoint، ZIP…). استخدم زر التحميل."}
              </Text>
              {file?.description && (
                <Text fontSize="sm" color={muted} textAlign="center" maxW="lg">
                  {file.description}
                </Text>
              )}
            </Center>
          )}
        </ModalBody>

        <ModalFooter borderTopWidth="1px">
          <Button variant="ghost" onClick={onClose}>
            إغلاق
          </Button>
          {isDrive && onOpenExternal ? (
            <Button
              leftIcon={<FaExternalLinkAlt />}
              variant="outline"
              borderRadius="lg"
              onClick={() => onOpenExternal(file)}
            >
              فتح في Google Drive
            </Button>
          ) : null}
          {file && onDownload && (
            <Button
              leftIcon={isDrive ? <FaGoogleDrive /> : <FaDownload />}
              colorScheme="blue"
              borderRadius="lg"
              onClick={() => onDownload(file)}
              isLoading={downloading}
            >
              {isDrive ? "فتح / تحميل" : "تحميل"}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function inferViewer(previewType) {
  if (previewType === "pdf") return "pdf-viewer";
  if (previewType === "image") return "image-viewer";
  return "download-only";
}

function InlinePreview({ viewerComponent, previewType, previewUrl, previewMode, file, frameBg, isDrive }) {
  if ((isDrive || viewerComponent === "drive-embed") && previewUrl) {
    return (
      <Box w="full" h={{ base: "65vh", md: "78vh" }} bg={frameBg} position="relative">
        <Box
          as="iframe"
          title={file?.name || "Google Drive"}
          src={previewUrl}
          w="full"
          h="full"
          border="none"
          display="block"
          allow="autoplay"
        />
      </Box>
    );
  }

  const isPdf = viewerComponent === "pdf-viewer" || previewType === "pdf";
  const isImage = viewerComponent === "image-viewer" || previewType === "image";

  if (isPdf && previewUrl) {
    return (
      <Box w="full" h={{ base: "65vh", md: "78vh" }} bg={frameBg} position="relative">
        <Box
          as="iframe"
          title={file?.name || "PDF"}
          src={previewMode === "url" ? `${previewUrl}#view=FitH` : previewUrl}
          w="full"
          h="full"
          border="none"
          display="block"
        />
      </Box>
    );
  }

  if (isImage && previewUrl) {
    return (
      <Center p={6} minH={{ base: "50vh", md: "65vh" }} bg={frameBg}>
        <Box
          as="img"
          src={previewUrl}
          alt={file?.name}
          maxH="75vh"
          maxW="100%"
          objectFit="contain"
          borderRadius="lg"
          boxShadow="lg"
        />
      </Center>
    );
  }

  return (
    <Center minH="50vh">
      <Text fontSize="sm" color="gray.500">
        تعذّر تحميل المعاينة
      </Text>
    </Center>
  );
}

function ExtractedTextPanel({ paragraphs, textContent, textBg, muted }) {
  return (
    <>
      <Box
        bg={textBg}
        borderRadius="lg"
        p={4}
        maxH="65vh"
        overflowY="auto"
        fontSize="sm"
        lineHeight="1.9"
        dir="auto"
      >
        {paragraphs.length > 0 ? (
          <VStack align="stretch" spacing={4}>
            {paragraphs.map((paragraph, index) => (
              <Text key={index} whiteSpace="pre-wrap">
                {paragraph}
              </Text>
            ))}
          </VStack>
        ) : (
          <Text whiteSpace="pre-wrap">{textContent?.text}</Text>
        )}
      </Box>
      {textContent?.truncated && (
        <Text fontSize="xs" color={muted} mt={2}>
          تم اقتطاع النص — حمّل الملف لرؤية المحتوى كاملاً.
        </Text>
      )}
      {textContent?.characterCount ? (
        <Text fontSize="xs" color={muted} mt={1}>
          {textContent.characterCount.toLocaleString("ar-EG")} حرف
        </Text>
      ) : null}
    </>
  );
}
