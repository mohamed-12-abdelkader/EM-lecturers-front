import React, { useState, useEffect } from "react";
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
  useColorModeValue,
} from "@chakra-ui/react";
import { FaDownload, FaFile } from "react-icons/fa";
import { formatFileSize } from "../../../api/teacherMyFilesApi";

export default function FilePreviewModal({
  isOpen,
  onClose,
  file,
  previewUrl,
  textContent,
  loading,
  onDownload,
  downloading,
}) {
  const muted = useColorModeValue("gray.500", "gray.400");
  const panelBg = useColorModeValue("gray.50", "gray.900");
  const textBg = useColorModeValue("white", "gray.800");
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (isOpen) setActiveTab(0);
  }, [isOpen, file?.id]);

  if (!file && !loading) return null;

  const previewType = file?.previewType || "none";
  const canInline =
    previewUrl &&
    (file?.canPreviewInline || previewType === "pdf" || previewType === "image");
  const hasTextTab = previewType === "pdf" && textContent?.text;

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
              <Badge colorScheme="blue" fontSize="xs">
                {(file.fileExtension || "").toUpperCase()}
              </Badge>
              <Text fontSize="xs" color={muted}>
                {formatFileSize(file.fileSize)}
              </Text>
              {file.categoryName && (
                <Text fontSize="xs" color={muted}>
                  · {file.categoryName}
                </Text>
              )}
              {file.downloadsCount != null && (
                <Text fontSize="xs" color={muted}>
                  · {file.downloadsCount} تحميل
                </Text>
              )}
            </HStack>
          )}
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody p={0} bg={panelBg}>
          {loading ? (
            <Center minH="60vh">
              <Spinner size="lg" color="blue.400" thickness="3px" />
            </Center>
          ) : canInline && hasTextTab ? (
            <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" colorScheme="blue">
              <TabList px={4} pt={3} bg={panelBg}>
                <Tab fontSize="sm">عرض الملف</Tab>
                <Tab fontSize="sm">النص المستخرج</Tab>
              </TabList>
              <TabPanels>
                <TabPanel p={0}>
                  <InlinePreview previewType={previewType} previewUrl={previewUrl} file={file} />
                </TabPanel>
                <TabPanel px={4} py={4}>
                  <Box
                    bg={textBg}
                    borderRadius="lg"
                    p={4}
                    maxH="65vh"
                    overflowY="auto"
                    fontSize="sm"
                    lineHeight="1.9"
                    whiteSpace="pre-wrap"
                    dir="auto"
                  >
                    {textContent.text}
                  </Box>
                  {textContent.truncated && (
                    <Text fontSize="xs" color={muted} mt={2}>
                      تم اقتطاع النص — حمّل الملف لرؤية المحتوى كاملاً.
                    </Text>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          ) : canInline ? (
            <InlinePreview previewType={previewType} previewUrl={previewUrl} file={file} />
          ) : (
            <Center flexDirection="column" gap={4} minH="50vh" p={8}>
              <Flex w={16} h={16} borderRadius="2xl" bg="blue.50" align="center" justify="center">
                <Icon as={FaFile} boxSize={8} color="blue.400" />
              </Flex>
              <Text color={muted} textAlign="center" maxW="md">
                {previewType === "image"
                  ? "تعذّر تحميل معاينة الصورة. يمكنك تحميل الملف مباشرة."
                  : "لا يمكن عرض هذا النوع داخل الموقع (Word، PowerPoint، ZIP…). استخدم زر التحميل."}
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
          {file && onDownload && (
            <Button
              leftIcon={<FaDownload />}
              colorScheme="blue"
              borderRadius="lg"
              onClick={() => onDownload(file)}
              isLoading={downloading}
            >
              تحميل
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function InlinePreview({ previewType, previewUrl, file }) {
  if (previewType === "pdf") {
    return (
      <Box w="full" h={{ base: "65vh", md: "75vh" }} bg="gray.100">
        <Box
          as="iframe"
          title={file?.name || "PDF"}
          src={`${previewUrl}#view=FitH`}
          w="full"
          h="full"
          border="none"
          display="block"
        />
      </Box>
    );
  }

  if (previewType === "image") {
    return (
      <Center p={6} minH="50vh">
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

  return null;
}
