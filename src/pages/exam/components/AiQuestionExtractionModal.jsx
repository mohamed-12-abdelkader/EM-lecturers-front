import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Switch,
  Badge,
  Alert,
  AlertIcon,
  Icon,
  useToast,
  Input,
  Textarea,
  Flex,
  Heading,
  Spinner,
  useColorModeValue,
  Image,
  IconButton,
  SimpleGrid,
} from "@chakra-ui/react";
import { FaPlus, FaUpload, FaFilePdf, FaImage, FaPaste, FaTimes, FaMagic } from "react-icons/fa";
import {
  emptyDraftQuestion,
  mapOcrQuestionToDraft,
  mapOcrPassageToDraft,
  validateLectureExamDraftQuestion,
  validateCourseExamDraftQuestion,
  importDraftsToLectureExam,
  importDraftsToCourseExam,
  extractQuestions,
  validateOcrFiles,
  validatePdfPageRange,
  mapExtractionResponseMeta,
  formatOcrApiError,
  filesFromClipboardEvent,
  isPdfFile,
  MAX_OCR_IMAGE_FILES,
} from "../../../api/ocrQuestionExtractionApi";
import ExtractionDraftQuestionCard from "../../../components/question/ExtractionDraftQuestionCard";
import ExtractionMathPreview from "../../../components/question/ExtractionMathPreview";

export default function AiQuestionExtractionModal({
  isOpen,
  onClose,
  examId,
  examTitle,
  examKind = "lecture",
  onImported,
}) {
  const isCourseExam = examKind === "course";
  const validateDraftQuestion = isCourseExam
    ? validateCourseExamDraftQuestion
    : validateLectureExamDraftQuestion;
  const toast = useToast();
  const [draftPassages, setDraftPassages] = useState([]);
  const [draftQuestions, setDraftQuestions] = useState([]);
  const [isExtractingOcr, setIsExtractingOcr] = useState(false);
  const [inferCorrectAnswer, setInferCorrectAnswer] = useState(false);
  const [includeQuestionImages, setIncludeQuestionImages] = useState(true);
  const [pdfStartPage, setPdfStartPage] = useState("");
  const [pdfEndPage, setPdfEndPage] = useState("");
  const [ocrNotes, setOcrNotes] = useState("");
  const [imageUploadWarnings, setImageUploadWarnings] = useState([]);
  const [extractionMeta, setExtractionMeta] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);
  const addFilesToQueueRef = useRef(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("blue.700", "blue.200");
  const subTextColor = useColorModeValue("gray.500", "gray.400");
  const ocrUploadBg = useColorModeValue("purple.50", "gray.700");

  const imagePreviewUrls = React.useMemo(
    () =>
      selectedFiles.map((file) =>
        file.type?.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif|bmp|tiff?)$/i.test(file.name)
          ? URL.createObjectURL(file)
          : null,
      ),
    [selectedFiles],
  );

  React.useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [imagePreviewUrls]);

  const resetState = () => {
    setDraftPassages([]);
    setDraftQuestions([]);
    setOcrNotes("");
    setImageUploadWarnings([]);
    setExtractionMeta(null);
    setSelectedFiles([]);
    setPdfStartPage("");
    setPdfEndPage("");
    setInferCorrectAnswer(false);
    setIncludeQuestionImages(true);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const updateDraftPassage = (passageId, patch) => {
    setDraftPassages((prev) =>
      prev.map((passage) =>
        passage.passage_id === passageId ? { ...passage, ...patch } : passage
      )
    );
  };

  const updateDraftQuestion = (id, patch) => {
    setDraftQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...patch } : q))
    );
  };

  const removeDraftQuestion = (id) => {
    setDraftQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const addManualDraftQuestion = () => {
    setDraftQuestions((prev) => [...prev, emptyDraftQuestion()]);
  };

  const openFilePicker = () => {
    if (isExtractingOcr || isImporting) return;
    fileInputRef.current?.click();
  };

  /** يجمع الملفات في قائمة انتظار بدون تشغيل الاستخراج */
  const addFilesToQueue = (incoming) => {
    if (!incoming?.length || isExtractingOcr || isImporting) return;

    const incomingHasPdf = incoming.some(isPdfFile);
    let next;
    if (incomingHasPdf) {
      next = incoming;
    } else if (selectedFiles.some(isPdfFile)) {
      // استبدال PDF بصور
      next = incoming;
    } else {
      next = [...selectedFiles, ...incoming];
    }

    if (next.length > MAX_OCR_IMAGE_FILES) {
      toast({
        title: "خطأ",
        description: `الحد الأقصى ${MAX_OCR_IMAGE_FILES} صورة`,
        status: "error",
        duration: 3500,
        isClosable: true,
      });
      return;
    }

    const fileError = validateOcrFiles(next);
    if (fileError) {
      toast({
        title: "خطأ",
        description: fileError,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setSelectedFiles(next);
    toast({
      title: "تمت الإضافة",
      description: `الآن لديك ${next.length} ملف — الصق المزيد أو اضغط «بدء الاستخراج»`,
      status: "success",
      duration: 2500,
      isClosable: true,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeQueuedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearQueuedFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runExtraction = async () => {
    const files = selectedFiles;
    if (!files?.length || isExtractingOcr || isImporting) return;

    const fileError = validateOcrFiles(files);
    if (fileError) {
      toast({
        title: "خطأ",
        description: fileError,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    const rangeError = validatePdfPageRange(pdfStartPage, pdfEndPage);
    if (rangeError) {
      toast({
        title: "خطأ",
        description: rangeError,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setIsExtractingOcr(true);
    try {
      const token = localStorage.getItem("token");
      const data = await extractQuestions(
        files.length === 1 ? files[0] : files,
        {
          inferCorrectAnswer,
          includeQuestionImages,
          startPage: pdfStartPage || undefined,
          endPage: pdfEndPage || undefined,
        },
        token,
      );

      const extracted = data?.questions;
      if (!Array.isArray(extracted) || extracted.length === 0) {
        toast({
          title: "تنبيه",
          description: data?.notes || "لم يتم استخراج أسئلة من الملف",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      const mappedPassages = Array.isArray(data?.passages)
        ? data.passages.map(mapOcrPassageToDraft)
        : [];
      const mapped = extracted.map(mapOcrQuestionToDraft);
      setDraftPassages((prev) => [...prev, ...mappedPassages]);
      setDraftQuestions((prev) => [...prev, ...mapped]);
      setOcrNotes(data.notes || "");
      setImageUploadWarnings(
        Array.isArray(data.image_upload_warnings) ? data.image_upload_warnings : [],
      );
      setExtractionMeta(mapExtractionResponseMeta(data));
      toast({
        title: "تم الاستخراج",
        description: `تم استخراج ${mapped.length} سؤال${
          mappedPassages.length ? ` و${mappedPassages.length} قطعة` : ""
        } — راجعها ثم احفظ`,
        status: "success",
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: formatOcrApiError(error),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsExtractingOcr(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleOcrFileUpload = (event) => {
    const fileList = event.target.files;
    if (!fileList?.length) return;
    addFilesToQueue(Array.from(fileList));
  };

  const handlePasteImages = (event) => {
    if (!isOpen || isExtractingOcr || isImporting) return;
    const pasted = filesFromClipboardEvent(event);
    if (!pasted.length) return;
    event.preventDefault();
    event.stopPropagation();
    addFilesToQueue(pasted);
  };

  addFilesToQueueRef.current = addFilesToQueue;

  useEffect(() => {
    if (!isOpen) return undefined;
    const onPaste = (event) => {
      if (isExtractingOcr || isImporting) return;
      const pasted = filesFromClipboardEvent(event);
      if (!pasted.length) return;
      event.preventDefault();
      event.stopPropagation();
      addFilesToQueueRef.current?.(pasted);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [isOpen, isExtractingOcr, isImporting]);

  const handleImport = async () => {
    if (draftQuestions.length === 0) {
      toast({
        title: "خطأ",
        description: "أضف سؤالاً واحداً على الأقل",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const passageIds = new Set(draftPassages.map((p) => p.passage_id));
    const passageGroups = draftPassages
      .map((passage) => ({
        passage,
        questions: draftQuestions.filter((q) => q.passage_id === passage.passage_id),
      }))
      .filter((group) => group.questions.length > 0);
    const standaloneQuestions = draftQuestions.filter(
      (q) => !q.passage_id || !passageIds.has(q.passage_id)
    );

    for (const group of passageGroups) {
      if (!group.passage.content?.trim()) {
        toast({
          title: "خطأ في التحقق",
          description: "نص القطعة مطلوب قبل الحفظ",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      for (let i = 0; i < group.questions.length; i++) {
        const err = validateDraftQuestion(group.questions[i], i);
        if (err) {
          toast({ title: "خطأ في التحقق", description: err, status: "error", duration: 5000, isClosable: true });
          return;
        }
      }
    }

    for (let i = 0; i < standaloneQuestions.length; i++) {
      const err = validateDraftQuestion(standaloneQuestions[i], i);
      if (err) {
        toast({ title: "خطأ في التحقق", description: err, status: "error", duration: 5000, isClosable: true });
        return;
      }
    }

    setIsImporting(true);
    try {
      const token = localStorage.getItem("token");
      const result = isCourseExam
        ? await importDraftsToCourseExam(examId, draftPassages, draftQuestions, token)
        : await importDraftsToLectureExam(examId, draftPassages, draftQuestions, token);

      if (result.totalAdded === 0) {
        toast({
          title: "لم تُضف أسئلة",
          description: "تحقق من صحة الأسئلة والاختيارات",
          status: "warning",
          isClosable: true,
        });
        return;
      }

      let description = `تمت إضافة ${result.totalAdded} سؤال إلى الامتحان`;
      if (result.imagesAttached > 0) {
        description += ` — ${result.imagesAttached} صورة`;
      }

      toast({
        title: "تم الاستيراد",
        description,
        status: result.errors.length ? "warning" : "success",
        duration: 5000,
        isClosable: true,
      });

      if (result.warnings?.length) {
        toast({
          title: "ملاحظات",
          description: result.warnings.join(" — "),
          status: "info",
          duration: 6000,
          isClosable: true,
        });
      }

      if (result.errors.length) {
        toast({
          title: "تحذيرات",
          description: result.errors.join(" — "),
          status: "warning",
          isClosable: true,
        });
      }

      handleClose();
      onImported?.();
    } catch (error) {
      toast({
        title: "خطأ",
        description: formatOcrApiError(error),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const draftQuestionsByPassage = draftQuestions.reduce((map, question) => {
    const key = question.passage_id ?? "__standalone__";
    map[key] ??= [];
    map[key].push(question);
    return map;
  }, {});
  const standaloneDraftQuestions = draftQuestionsByPassage.__standalone__ || [];

  const renderDraftQuestionCard = (draft, index) => (
    <ExtractionDraftQuestionCard
      key={draft.id}
      draft={draft}
      index={index}
      accentScheme="purple"
      onUpdate={updateDraftQuestion}
      onRemove={removeDraftQuestion}
    />
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="4xl"
      isCentered
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent borderRadius="2xl" boxShadow="2xl" maxH="90vh" dir="rtl">
        <ModalHeader fontWeight="bold" fontSize="xl" color="purple.700" textAlign="center">
          استخراج أسئلة بالذكاء الاصطناعي
          {examTitle ? ` — ${examTitle}` : ""}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={5}>
            <Box
              p={5}
              borderRadius="xl"
              borderWidth="2px"
              borderStyle="dashed"
              borderColor="purple.200"
              bg={ocrUploadBg}
            >
              <Text fontWeight="bold" mb={3}>
                استخراج من PDF أو صورة (ذكاء اصطناعي)
              </Text>
              <FormControl display="flex" alignItems="center" mb={4}>
                <FormLabel htmlFor="infer-answer-exam" mb={0} flex="1">
                  تخمين الإجابة الصحيحة إن لم تكن مذكورة في الملف
                </FormLabel>
                <Switch
                  id="infer-answer-exam"
                  colorScheme="purple"
                  isChecked={inferCorrectAnswer}
                  onChange={(e) => setInferCorrectAnswer(e.target.checked)}
                  isDisabled={isExtractingOcr || isImporting}
                />
              </FormControl>
              <FormControl display="flex" alignItems="center" mb={4}>
                <FormLabel htmlFor="include-images-exam" mb={0} flex="1">
                  استخراج صور الأسئلة ورفعها إلى Cloudinary
                </FormLabel>
                <Switch
                  id="include-images-exam"
                  colorScheme="purple"
                  isChecked={includeQuestionImages}
                  onChange={(e) => setIncludeQuestionImages(e.target.checked)}
                  isDisabled={isExtractingOcr || isImporting}
                />
              </FormControl>
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
                    isDisabled={isExtractingOcr || isImporting}
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
                    isDisabled={isExtractingOcr || isImporting}
                  />
                </FormControl>
              </HStack>
              <Text fontSize="xs" color={subTextColor} mb={4}>
                نطاق الصفحات اختياري ويُطبَّق على ملف PDF واحد فقط — بدون حد أقصى لعدد الصفحات
              </Text>
              <Input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/*,.pdf"
                multiple
                display="none"
                onChange={handleOcrFileUpload}
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
                cursor={isExtractingOcr || isImporting ? "not-allowed" : "pointer"}
                opacity={isExtractingOcr || isImporting ? 0.7 : 1}
                _hover={
                  isExtractingOcr || isImporting
                    ? undefined
                    : { borderColor: "purple.400", bg: ocrUploadBg }
                }
                _focusVisible={{ outline: "2px solid", outlineColor: "purple.400" }}
                mb={3}
              >
                <VStack spacing={2}>
                  {isExtractingOcr ? (
                    <HStack>
                      <Spinner size="sm" color="purple.500" />
                      <Text fontWeight="700" fontSize="sm" color="purple.600">
                        جاري الاستخراج…
                      </Text>
                    </HStack>
                  ) : (
                    <>
                      <Icon as={FaPaste} boxSize={6} color="purple.400" />
                      <Text fontWeight="700" fontSize="sm">
                        الصق صوراً متعددة (Ctrl+V) ثم ابدأ الاستخراج
                      </Text>
                      <Text fontSize="xs" color={subTextColor}>
                        الصق صورة… صورة… صورة — كلها تتجمع هنا قبل التنفيذ
                      </Text>
                    </>
                  )}
                </VStack>
              </Box>
              <HStack spacing={2} mb={3}>
                <Button
                  onClick={openFilePicker}
                  leftIcon={<FaUpload />}
                  colorScheme="purple"
                  variant="outline"
                  flex={1}
                  isDisabled={isExtractingOcr || isImporting}
                  borderRadius="xl"
                >
                  إضافة من الجهاز
                </Button>
                <Button
                  onClick={runExtraction}
                  leftIcon={isExtractingOcr ? <Spinner size="sm" /> : <FaMagic />}
                  colorScheme="purple"
                  flex={1}
                  isDisabled={
                    isExtractingOcr || isImporting || selectedFiles.length === 0
                  }
                  borderRadius="xl"
                >
                  {isExtractingOcr
                    ? "جاري الاستخراج…"
                    : `بدء الاستخراج${selectedFiles.length ? ` (${selectedFiles.length})` : ""}`}
                </Button>
              </HStack>
              {selectedFiles.length > 0 && (
                <Box
                  p={3}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="purple.200"
                  bg={cardBg}
                >
                  <Flex justify="space-between" align="center" mb={2} gap={2}>
                    <Text fontSize="sm" fontWeight="semibold">
                      الملفات الجاهزة ({selectedFiles.length})
                    </Text>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={clearQueuedFiles}
                      isDisabled={isExtractingOcr || isImporting}
                    >
                      مسح الكل
                    </Button>
                  </Flex>
                  <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={3}>
                    {selectedFiles.map((file, index) => {
                      const preview = imagePreviewUrls[index];
                      const pdf = isPdfFile(file);
                      return (
                        <Box
                          key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                          position="relative"
                          borderWidth="1px"
                          borderColor="purple.100"
                          borderRadius="lg"
                          overflow="hidden"
                          bg="gray.50"
                          _dark={{ bg: "gray.700", borderColor: "purple.800" }}
                        >
                          {preview ? (
                            <Image
                              src={preview}
                              alt={file.name}
                              w="full"
                              h="90px"
                              objectFit="cover"
                            />
                          ) : (
                            <Flex
                              h="90px"
                              align="center"
                              justify="center"
                              direction="column"
                              gap={1}
                              px={2}
                            >
                              <Icon as={pdf ? FaFilePdf : FaImage} color="purple.500" />
                              <Text fontSize="xs" noOfLines={2} textAlign="center">
                                {file.name}
                              </Text>
                            </Flex>
                          )}
                          <IconButton
                            icon={<FaTimes />}
                            aria-label="حذف الملف"
                            size="xs"
                            colorScheme="red"
                            variant="solid"
                            borderRadius="full"
                            position="absolute"
                            top={1}
                            insetStart={1}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeQueuedFile(index);
                            }}
                            isDisabled={isExtractingOcr || isImporting}
                          />
                          <Text
                            fontSize="10px"
                            px={1.5}
                            py={1}
                            noOfLines={1}
                            color={subTextColor}
                          >
                            {file.name}
                          </Text>
                        </Box>
                      );
                    })}
                  </SimpleGrid>
                </Box>
              )}
              <HStack mt={2} spacing={4} justify="center" color={subTextColor} fontSize="sm">
                <HStack>
                  <Icon as={FaFilePdf} />
                  <Text>PDF</Text>
                </HStack>
                <HStack>
                  <Icon as={FaImage} />
                  <Text>PNG, JPG, WebP…</Text>
                </HStack>
              </HStack>
            </Box>

            {extractionMeta && (
              <HStack flexWrap="wrap" spacing={2}>
                {extractionMeta.filename && (
                  <Badge colorScheme="purple">{extractionMeta.filename}</Badge>
                )}
                {extractionMeta.source_files?.length > 1 && (
                  <Badge colorScheme="purple" variant="subtle">
                    {extractionMeta.source_files.length} ملفات
                  </Badge>
                )}
                {extractionMeta.page_range && (
                  <Badge colorScheme="cyan" variant="subtle">
                    صفحات {extractionMeta.page_range.start_page}–
                    {extractionMeta.page_range.end_page}
                  </Badge>
                )}
                <Badge>{extractionMeta.question_count} سؤال</Badge>
                {extractionMeta.extracted_images_count > 0 && (
                  <Badge colorScheme="cyan">
                    {extractionMeta.extracted_images_count} صورة مستخرجة
                  </Badge>
                )}
                {extractionMeta.ocr_model && (
                  <Badge variant="subtle">OCR: {extractionMeta.ocr_model}</Badge>
                )}
                {extractionMeta.chat_model && (
                  <Badge variant="subtle">Chat: {extractionMeta.chat_model}</Badge>
                )}
              </HStack>
            )}

            {imageUploadWarnings.length > 0 && (
              <Alert status="warning" borderRadius="lg">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  {imageUploadWarnings.map((warning, i) => (
                    <Text key={i} fontSize="sm">
                      {warning}
                    </Text>
                  ))}
                </VStack>
              </Alert>
            )}

            <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
              <Text fontWeight="bold" color={headingColor}>
                مراجعة الأسئلة ({draftQuestions.length})
              </Text>
              <Button
                size="sm"
                leftIcon={<FaPlus />}
                colorScheme="blue"
                variant="outline"
                onClick={addManualDraftQuestion}
                isDisabled={isExtractingOcr || isImporting}
                borderRadius="full"
              >
                إضافة سؤال يدوياً
              </Button>
            </Flex>

            {ocrNotes && (
              <Alert status="info" borderRadius="lg">
                <AlertIcon />
                <Text fontSize="sm">{ocrNotes}</Text>
              </Alert>
            )}

            {draftQuestions.length === 0 ? (
              <Text textAlign="center" color={subTextColor} py={6}>
                ارفع ملفاً لاستخراج الأسئلة، أو أضف سؤالاً يدوياً
              </Text>
            ) : (
              <VStack align="stretch" spacing={5} maxH="50vh" overflowY="auto" pr={1}>
                {draftPassages.map((passage, passageIndex) => {
                  const passageQuestions =
                    draftQuestionsByPassage[passage.passage_id] || [];
                  return (
                    <Box
                      key={passage.id}
                      p={4}
                      borderRadius="2xl"
                      borderWidth="2px"
                      borderColor="blue.200"
                      bg={cardBg}
                      boxShadow="md"
                    >
                      <HStack justify="space-between" mb={4}>
                        <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
                          قطعة {passageIndex + 1}
                        </Badge>
                        <Badge colorScheme="teal" variant="subtle">
                          {passageQuestions.length} سؤال
                        </Badge>
                      </HStack>

                      <FormControl mb={3}>
                        <FormLabel fontSize="sm">عنوان القطعة (اختياري)</FormLabel>
                        <Input
                          value={passage.title}
                          onChange={(e) =>
                            updateDraftPassage(passage.passage_id, {
                              title: e.target.value,
                            })
                          }
                          placeholder="عنوان القطعة"
                          dir="rtl"
                        />
                      </FormControl>

                      <FormControl mb={4}>
                        <FormLabel fontSize="sm">نص القطعة</FormLabel>
                        <Textarea
                          value={passage.content}
                          onChange={(e) =>
                            updateDraftPassage(passage.passage_id, {
                              content: e.target.value,
                            })
                          }
                          rows={5}
                          dir="rtl"
                          fontFamily="mono"
                          fontSize="sm"
                          placeholder="نص القطعة — يدعم المعادلات والكسور والرموز"
                        />
                        <ExtractionMathPreview
                          value={passage.content}
                          whiteSpace="pre-wrap"
                        />
                      </FormControl>

                      <VStack align="stretch" spacing={4}>
                        {passageQuestions.map((draft, qIndex) =>
                          renderDraftQuestionCard(draft, qIndex)
                        )}
                      </VStack>
                    </Box>
                  );
                })}

                {standaloneDraftQuestions.length > 0 && (
                  <Box>
                    {draftPassages.length > 0 && (
                      <Heading size="sm" color={headingColor} mb={3}>
                        أسئلة مستقلة
                      </Heading>
                    )}
                    <VStack align="stretch" spacing={4}>
                      {standaloneDraftQuestions.map((draft, index) =>
                        renderDraftQuestionCard(draft, index)
                      )}
                    </VStack>
                  </Box>
                )}
              </VStack>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter borderTopWidth="1px">
          <Button
            colorScheme="purple"
            px={8}
            fontWeight="bold"
            borderRadius="full"
            onClick={handleImport}
            isLoading={isImporting}
            isDisabled={
              draftQuestions.length === 0 || isExtractingOcr || isImporting
            }
          >
            {isCourseExam ? "استيراد لامتحان الكورس" : "استيراد للامتحان"}{" "}
            {draftQuestions.length > 0 ? `(${draftQuestions.length})` : ""}
          </Button>
          <Button
            variant="ghost"
            ml={3}
            onClick={handleClose}
            isDisabled={isImporting}
          >
            إلغاء
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
