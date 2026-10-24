import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spinner,
  Text,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import {
  FaFilePdf,
  FaImage,
  FaPaste,
  FaTimes,
  FaUpload,
} from "react-icons/fa";
import {
  cropQuestions,
  filesFromClipboardEvent,
  formatOcrApiError,
  isPdfFile,
  MAX_OCR_IMAGE_FILES,
  normalizeCroppedQuestions,
  validateOcrFiles,
  validatePdfPageRange,
} from "../../../api/ocrQuestionExtractionApi";

/**
 * أداة قص الأسئلة كصور كاملة لتطبيقها على إطار PDF.
 * منفصلة عن extract-questions.
 */
export default function CropQuestionsFrameModal({
  isOpen,
  onClose,
  frameName,
  confirmLabel = "تطبيق على الإطار",
  onConfirmCropped,
}) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const addFilesToQueueRef = useRef(null);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pdfStartPage, setPdfStartPage] = useState("");
  const [pdfEndPage, setPdfEndPage] = useState("");
  const [isCropping, setIsCropping] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [croppedQuestions, setCroppedQuestions] = useState([]);
  const [cropMeta, setCropMeta] = useState(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const ocrUploadBg = useColorModeValue("purple.50", "gray.700");
  const subTextColor = useColorModeValue("gray.500", "gray.400");

  const imagePreviewUrls = React.useMemo(
    () =>
      selectedFiles.map((file) =>
        file.type?.startsWith("image/") ||
        /\.(png|jpe?g|webp|gif|avif|bmp|tiff?)$/i.test(file.name)
          ? URL.createObjectURL(file)
          : null,
      ),
    [selectedFiles],
  );

  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [imagePreviewUrls]);

  const resetState = () => {
    setSelectedFiles([]);
    setPdfStartPage("");
    setPdfEndPage("");
    setCroppedQuestions([]);
    setCropMeta(null);
    setIsCropping(false);
    setIsApplying(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (isCropping || isApplying) return;
    resetState();
    onClose();
  };

  const addFilesToQueue = (incoming) => {
    const next = [...selectedFiles, ...incoming].slice(0, MAX_OCR_IMAGE_FILES);
    const err = validateOcrFiles(next);
    if (err) {
      toast({
        title: "خطأ",
        description: err,
        status: "error",
        isClosable: true,
      });
      return;
    }
    setSelectedFiles(next);
    setCroppedQuestions([]);
    setCropMeta(null);
  };

  addFilesToQueueRef.current = addFilesToQueue;

  const removeFileAt = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setCroppedQuestions([]);
    setCropMeta(null);
  };

  const openFilePicker = () => {
    if (isCropping || isApplying) return;
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event) => {
    const fileList = event.target.files;
    if (!fileList?.length) return;
    addFilesToQueue(Array.from(fileList));
  };

  const handlePasteImages = (event) => {
    if (!isOpen || isCropping || isApplying) return;
    const pasted = filesFromClipboardEvent(event);
    if (!pasted.length) return;
    event.preventDefault();
    event.stopPropagation();
    addFilesToQueue(pasted);
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const onPaste = (event) => {
      if (isCropping || isApplying) return;
      const pasted = filesFromClipboardEvent(event);
      if (!pasted.length) return;
      event.preventDefault();
      event.stopPropagation();
      addFilesToQueueRef.current?.(pasted);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [isOpen, isCropping, isApplying]);

  const runCrop = async () => {
    const files = selectedFiles;
    if (!files.length) {
      toast({
        title: "اختر ملفًا",
        description: "ارفع PDF أو صورًا ثم ابدأ القص",
        status: "warning",
        isClosable: true,
      });
      return;
    }

    const fileError = validateOcrFiles(files);
    if (fileError) {
      toast({ title: "خطأ", description: fileError, status: "error", isClosable: true });
      return;
    }

    const rangeError = validatePdfPageRange(pdfStartPage, pdfEndPage);
    if (rangeError) {
      toast({ title: "خطأ", description: rangeError, status: "error", isClosable: true });
      return;
    }

    setIsCropping(true);
    try {
      const token = localStorage.getItem("token");
      const data = await cropQuestions(
        files.length === 1 ? files[0] : files,
        {
          startPage: pdfStartPage || undefined,
          endPage: pdfEndPage || undefined,
        },
        token,
      );

      const mapped = normalizeCroppedQuestions(data);
      if (!mapped.length) {
        toast({
          title: "تنبيه",
          description: "لم يتم قص أي سؤال من الملف",
          status: "warning",
          isClosable: true,
        });
        setCroppedQuestions([]);
        setCropMeta(null);
        return;
      }

      setCroppedQuestions(mapped);
      setCropMeta({
        question_count: data?.question_count ?? mapped.length,
        filename: data?.filename ?? null,
        page_count: data?.page_count ?? null,
      });
      toast({
        title: "تم القص",
        description: `تم قص ${mapped.length} سؤال كصور جاهزة للإطار`,
        status: "success",
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "فشل القص",
        description: formatOcrApiError(error),
        status: "error",
        isClosable: true,
      });
    } finally {
      setIsCropping(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeCroppedAt = (index) => {
    setCroppedQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApply = async () => {
    if (!croppedQuestions.length) {
      toast({
        title: "لا توجد أسئلة",
        description: "قص الأسئلة أولًا ثم طبّقها على الإطار",
        status: "warning",
        isClosable: true,
      });
      return;
    }
    if (typeof onConfirmCropped !== "function") return;

    setIsApplying(true);
    try {
      await onConfirmCropped(croppedQuestions);
      toast({
        title: "تم",
        description: `تم تجهيز ${croppedQuestions.length} سؤال على الإطار`,
        status: "success",
        isClosable: true,
      });
      resetState();
      onClose();
    } catch (error) {
      toast({
        title: "خطأ",
        description: formatOcrApiError(error) || error?.message || "فشل التطبيق",
        status: "error",
        isClosable: true,
      });
    } finally {
      setIsApplying(false);
    }
  };

  const busy = isCropping || isApplying;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="4xl"
      isCentered
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent
        borderRadius="2xl"
        boxShadow="2xl"
        maxH="90vh"
        dir="rtl"
        data-tour-id="crop-questions-frame-modal"
      >
        <ModalHeader
          fontWeight="bold"
          fontSize="xl"
          color="purple.700"
          textAlign="center"
        >
          قص الأسئلة كصور للإطار
          {frameName ? ` — ${frameName}` : ""}
        </ModalHeader>
        <ModalCloseButton isDisabled={busy} />
        <ModalBody>
          <VStack align="stretch" spacing={5}>
            <Alert status="info" borderRadius="xl" variant="left-accent">
              <AlertIcon />
              <Box fontSize="sm">
                يقص كل سؤال كاملًا (نص + اختيارات + رسوم + جداول) كصورة واحدة، ثم
                يضعها داخل الإطار المختار. استخراج النص المنظم يبقى عبر أداة
                extract-questions منفصلة.
              </Box>
            </Alert>

            <Box
              p={5}
              borderRadius="xl"
              borderWidth="2px"
              borderStyle="dashed"
              borderColor="purple.200"
              bg={ocrUploadBg}
            >
              <Text fontWeight="bold" mb={3}>
                رفع PDF أو صور
              </Text>
              <HStack spacing={3} mb={3} align="flex-end">
                <FormControl>
                  <FormLabel fontSize="sm" mb={1}>
                    من صفحة (PDF)
                  </FormLabel>
                  <Input
                    type="number"
                    min={1}
                    placeholder="1"
                    value={pdfStartPage}
                    onChange={(e) => setPdfStartPage(e.target.value)}
                    isDisabled={busy}
                    bg={cardBg}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" mb={1}>
                    إلى صفحة (PDF)
                  </FormLabel>
                  <Input
                    type="number"
                    min={1}
                    placeholder="7"
                    value={pdfEndPage}
                    onChange={(e) => setPdfEndPage(e.target.value)}
                    isDisabled={busy}
                    bg={cardBg}
                  />
                </FormControl>
              </HStack>
              <Text fontSize="xs" color={subTextColor} mb={4}>
                نطاق الصفحات اختياري لملف PDF واحد فقط
              </Text>

              <Input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/*,.pdf"
                multiple
                display="none"
                onChange={handleFileUpload}
              />

              <Box
                tabIndex={0}
                role="button"
                aria-label="منطقة لصق صور"
                onPaste={handlePasteImages}
                onClick={openFilePicker}
                borderWidth="2px"
                borderStyle="dashed"
                borderColor="purple.300"
                borderRadius="xl"
                bg={cardBg}
                px={4}
                py={5}
                textAlign="center"
                cursor={busy ? "not-allowed" : "pointer"}
                opacity={busy ? 0.7 : 1}
                _hover={
                  busy ? undefined : { borderColor: "purple.400", bg: ocrUploadBg }
                }
                mb={3}
              >
                <VStack spacing={2}>
                  {isCropping ? (
                    <HStack>
                      <Spinner size="sm" color="purple.500" />
                      <Text fontWeight="700" fontSize="sm" color="purple.600">
                        جاري قص الأسئلة…
                      </Text>
                    </HStack>
                  ) : (
                    <>
                      <Icon as={FaPaste} boxSize={6} color="purple.400" />
                      <Text fontWeight="700" fontSize="sm">
                        الصق صورًا (Ctrl+V) أو اضغط للاختيار
                      </Text>
                      <Text fontSize="xs" color={subTextColor}>
                        PDF واحد أو حتى {MAX_OCR_IMAGE_FILES} صورة
                      </Text>
                    </>
                  )}
                </VStack>
              </Box>

              <HStack spacing={2} mb={3} flexWrap="wrap">
                <Button
                  leftIcon={<FaUpload />}
                  colorScheme="purple"
                  variant="outline"
                  size="sm"
                  borderRadius="lg"
                  onClick={openFilePicker}
                  isDisabled={busy}
                >
                  اختيار ملفات
                </Button>
                <Button
                  colorScheme="purple"
                  size="sm"
                  borderRadius="lg"
                  onClick={runCrop}
                  isLoading={isCropping}
                  loadingText="جاري القص…"
                  isDisabled={!selectedFiles.length || busy}
                >
                  قص الأسئلة
                </Button>
                {selectedFiles.length > 0 ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    borderRadius="lg"
                    onClick={() => {
                      setSelectedFiles([]);
                      setCroppedQuestions([]);
                      setCropMeta(null);
                    }}
                    isDisabled={busy}
                  >
                    مسح الملفات
                  </Button>
                ) : null}
              </HStack>

              {selectedFiles.length > 0 ? (
                <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={3}>
                  {selectedFiles.map((file, index) => (
                    <Box
                      key={`${file.name}-${file.lastModified}-${index}`}
                      position="relative"
                      borderWidth="1px"
                      borderColor={borderColor}
                      borderRadius="lg"
                      overflow="hidden"
                      bg={cardBg}
                      p={2}
                    >
                      <IconButton
                        aria-label="إزالة"
                        icon={<FaTimes />}
                        size="xs"
                        colorScheme="red"
                        position="absolute"
                        top={1}
                        insetInlineEnd={1}
                        zIndex={1}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFileAt(index);
                        }}
                        isDisabled={busy}
                      />
                      {imagePreviewUrls[index] ? (
                        <Image
                          src={imagePreviewUrls[index]}
                          alt={file.name}
                          h="72px"
                          w="100%"
                          objectFit="cover"
                          borderRadius="md"
                        />
                      ) : (
                        <Flex
                          h="72px"
                          align="center"
                          justify="center"
                          direction="column"
                          gap={1}
                        >
                          <Icon
                            as={isPdfFile(file) ? FaFilePdf : FaImage}
                            color="purple.400"
                          />
                          <Text fontSize="xs" noOfLines={1} px={1}>
                            {file.name}
                          </Text>
                        </Flex>
                      )}
                    </Box>
                  ))}
                </SimpleGrid>
              ) : null}
            </Box>

            {cropMeta ? (
              <HStack spacing={2} flexWrap="wrap">
                <Badge colorScheme="purple" borderRadius="full" px={3} py={1}>
                  {croppedQuestions.length} سؤال مقصوص
                </Badge>
                {cropMeta.filename ? (
                  <Badge variant="subtle" borderRadius="full">
                    {cropMeta.filename}
                  </Badge>
                ) : null}
              </HStack>
            ) : null}

            {croppedQuestions.length > 0 ? (
              <Box>
                <Heading as="h3" size="sm" mb={3}>
                  معاينة الأسئلة المقصوصة
                </Heading>
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                  {croppedQuestions.map((q, index) => (
                    <Box
                      key={`${q.image_url}-${index}`}
                      borderWidth="1px"
                      borderColor={borderColor}
                      borderRadius="xl"
                      overflow="hidden"
                      bg={cardBg}
                      position="relative"
                    >
                      <Flex
                        justify="space-between"
                        align="center"
                        px={3}
                        py={2}
                        borderBottomWidth="1px"
                        borderColor={borderColor}
                      >
                        <HStack spacing={2}>
                          <Badge colorScheme="purple" borderRadius="full">
                            #{index + 1}
                          </Badge>
                          <Text fontSize="sm" fontWeight="700">
                            المصدر: {q.source_number}
                          </Text>
                        </HStack>
                        <IconButton
                          aria-label="حذف"
                          icon={<FaTimes />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => removeCroppedAt(index)}
                          isDisabled={busy}
                        />
                      </Flex>
                      <Image
                        src={q.image_url}
                        alt={`سؤال ${q.source_number}`}
                        w="100%"
                        maxH="280px"
                        objectFit="contain"
                        bg="gray.50"
                        crossOrigin="anonymous"
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            ) : null}
          </VStack>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={handleClose} isDisabled={busy} borderRadius="xl">
            إلغاء
          </Button>
          <Button
            colorScheme="purple"
            onClick={handleApply}
            isLoading={isApplying}
            isDisabled={!croppedQuestions.length || busy}
            borderRadius="xl"
          >
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
