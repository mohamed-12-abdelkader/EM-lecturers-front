import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaCloudUploadAlt, FaLink } from "react-icons/fa";
import { validateCourseFileUpload } from "../../../api/courseFilesApi";

export default function CourseFileUploadModal({ isOpen, onClose, onSubmit, loading }) {
  const [name, setName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const dropBg = useColorModeValue("purple.50", "whiteAlpha.100");
  const dropBorder = useColorModeValue("purple.200", "purple.700");

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setFileUrl("");
      setSelectedFile(null);
      setError("");
      setTabIndex(0);
    }
  }, [isOpen]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    if (file && !name.trim()) {
      const base = file.name.replace(/\.[^.]+$/, "");
      setName(base);
    }
    setError("");
  };

  const handleSubmit = async () => {
    const mode = tabIndex === 1 ? "url" : "file";
    const payload =
      mode === "url"
        ? { name: name.trim(), file_url: fileUrl.trim() }
        : { name: name.trim(), file: selectedFile };

    const validationError = validateCourseFileUpload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    await onSubmit?.(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      closeOnOverlayClick={!loading}
      size={{ base: "full", md: "lg" }}
      scrollBehavior="inside"
    >
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent borderRadius={{ base: "none", md: "2xl" }} mx={{ base: 0, md: 4 }}>
        <ModalHeader fontSize={{ base: "md", md: "lg" }}>إضافة ملف للكورس</ModalHeader>
        <ModalCloseButton isDisabled={loading} />
        <ModalBody>
          <VStack spacing={5} align="stretch">
            <FormControl isRequired>
              <FormLabel>اسم الملف للطلاب</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: ملزمة الباب الأول"
                isDisabled={loading}
              />
            </FormControl>

            <Tabs isFitted variant="soft-rounded" colorScheme="purple" index={tabIndex} onChange={setTabIndex}>
              <TabList>
                <Tab gap={2}>
                  <FaCloudUploadAlt />
                  رفع ملف
                </Tab>
                <Tab gap={2}>
                  <FaLink />
                  رابط
                </Tab>
              </TabList>
              <TabPanels mt={4}>
                <TabPanel px={0}>
                  <FormControl>
                    <Box
                      border="2px dashed"
                      borderColor={selectedFile ? "purple.400" : dropBorder}
                      borderRadius="2xl"
                      bg={dropBg}
                      p={6}
                      textAlign="center"
                      cursor={loading ? "not-allowed" : "pointer"}
                      onClick={() => !loading && fileInputRef.current?.click()}
                    >
                      <Text fontWeight="bold" mb={1}>
                        {selectedFile ? selectedFile.name : "اضغط لاختيار ملف"}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        PDF، Word، Excel، PowerPoint، ZIP، صور — حتى 50MB
                      </Text>
                      <Input
                        ref={fileInputRef}
                        type="file"
                        display="none"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png,.webp"
                        onChange={handleFileChange}
                        isDisabled={loading}
                      />
                    </Box>
                    <FormHelperText>يُرفع الملف إلى Bunny CDN تلقائياً (أو التخزين المحلي كبديل)</FormHelperText>
                  </FormControl>
                </TabPanel>
                <TabPanel px={0}>
                  <FormControl>
                    <FormLabel>رابط الملف</FormLabel>
                    <Input
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="https://..."
                      dir="ltr"
                      textAlign="left"
                      isDisabled={loading}
                    />
                    <FormHelperText>استخدم هذا الخيار إذا كان الملف مستضافاً خارج المنصة</FormHelperText>
                  </FormControl>
                </TabPanel>
              </TabPanels>
            </Tabs>

            {error ? (
              <Text color="red.500" fontSize="sm">
                {error}
              </Text>
            ) : null}
          </VStack>
        </ModalBody>
        <ModalFooter gap={2} flexWrap="wrap">
          <Button variant="ghost" onClick={onClose} isDisabled={loading}>
            إلغاء
          </Button>
          <Button
            colorScheme="purple"
            isLoading={loading}
            loadingText="جاري الرفع..."
            onClick={handleSubmit}
          >
            إضافة الملف
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
