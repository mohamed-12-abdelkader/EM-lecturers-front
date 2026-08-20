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
  Progress,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaCloudUploadAlt, FaFilePdf } from "react-icons/fa";
import {
  COURSE_PDF_MAX_FILE_SIZE_MB,
  formatCourseFileSize,
  isPdfFile,
  validateCourseFileUpload,
} from "../../../api/courseFilesApi";

export default function UploadCourseFileModal({ isOpen, onClose, onSubmit, loading }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const dropBg = useColorModeValue("orange.50", "whiteAlpha.100");
  const dropBorder = useColorModeValue("orange.200", "orange.700");
  const progressBg = useColorModeValue("orange.50", "whiteAlpha.100");

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
      setSelectedFile(null);
      setError("");
      setDragOver(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [isOpen]);

  const pickFile = (file) => {
    if (!file) return;
    if (!isPdfFile(file)) {
      setSelectedFile(null);
      setError("يُسمح بملفات PDF فقط");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSelectedFile(file);
    setError("");
    if (!title.trim()) {
      setTitle(file.name.replace(/\.pdf$/i, ""));
    }
  };

  const handleSubmit = async () => {
    if (loading) return;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      file: selectedFile,
    };
    const validationError = validateCourseFileUpload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setProgress(0);
    await onSubmit?.({
      ...payload,
      onUploadProgress: (pct) => setProgress(pct),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      closeOnOverlayClick={!loading}
      closeOnEsc={!loading}
      size={{ base: "full", md: "lg" }}
      scrollBehavior="inside"
    >
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent borderRadius={{ base: "none", md: "2xl" }} mx={{ base: 0, md: 4 }}>
        <ModalHeader fontSize={{ base: "md", md: "lg" }}>إضافة ملف PDF</ModalHeader>
        <ModalCloseButton isDisabled={loading} />
        <ModalBody>
          <VStack spacing={5} align="stretch">
            <FormControl isRequired isInvalid={Boolean(error) && !title.trim()}>
              <FormLabel>عنوان الملف</FormLabel>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError("");
                }}
                placeholder="مثال: مراجعة الوحدة الأولى"
                isDisabled={loading}
              />
            </FormControl>

            <FormControl>
              <FormLabel>الوصف (اختياري)</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مراجعة شاملة للوحدة الأولى"
                rows={3}
                isDisabled={loading}
              />
            </FormControl>

            <FormControl isRequired isInvalid={Boolean(error) && !selectedFile}>
              <FormLabel>ملف PDF</FormLabel>
              <Box
                border="2px dashed"
                borderColor={selectedFile ? "orange.400" : dragOver ? "orange.400" : dropBorder}
                borderRadius="2xl"
                bg={dropBg}
                p={6}
                textAlign="center"
                cursor={loading ? "not-allowed" : "pointer"}
                onClick={() => !loading && fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!loading) setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (!loading) pickFile(e.dataTransfer.files?.[0]);
                }}
              >
                <Box
                  as={selectedFile ? FaFilePdf : FaCloudUploadAlt}
                  mx="auto"
                  mb={2}
                  color={selectedFile ? "red.500" : "orange.500"}
                  boxSize={8}
                />
                <Text fontWeight="bold" mb={1}>
                  {selectedFile ? selectedFile.name : "اضغط أو اسحب ملف PDF هنا"}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {selectedFile
                    ? formatCourseFileSize(selectedFile.size)
                    : `PDF فقط — حتى ${COURSE_PDF_MAX_FILE_SIZE_MB} ميجابايت`}
                </Text>
                <Input
                  ref={fileInputRef}
                  type="file"
                  display="none"
                  accept="application/pdf,.pdf"
                  onChange={(e) => pickFile(e.target.files?.[0] || null)}
                  isDisabled={loading}
                />
              </Box>
              <FormHelperText>التحقق النهائي من النوع والحجم يتم في الخادم.</FormHelperText>
            </FormControl>

            {error ? (
              <Text color="red.500" fontSize="sm" role="alert">
                {error}
              </Text>
            ) : null}

            {loading ? (
              <Box bg={progressBg} borderRadius="xl" p={3} role="status" aria-live="polite">
                <Text fontSize="sm" fontWeight="semibold" mb={2}>
                  جاري رفع الملف... {progress}%
                </Text>
                <Progress
                  value={progress}
                  size="sm"
                  colorScheme="orange"
                  borderRadius="full"
                  hasStripe
                  isAnimated
                />
              </Box>
            ) : null}
          </VStack>
        </ModalBody>
        <ModalFooter gap={2} flexWrap="wrap">
          <Button variant="ghost" onClick={onClose} isDisabled={loading}>
            إلغاء
          </Button>
          <Button
            colorScheme="orange"
            isLoading={loading}
            loadingText="جاري الرفع..."
            onClick={handleSubmit}
            isDisabled={loading}
          >
            رفع الملف
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
