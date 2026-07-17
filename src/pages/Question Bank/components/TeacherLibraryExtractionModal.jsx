import React, { useRef, useState } from "react";
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
} from "@chakra-ui/react";
import { FaPlus, FaUpload, FaFilePdf, FaImage } from "react-icons/fa";
import {
  emptyDraftQuestion,
  mapOcrQuestionToDraft,
  mapOcrPassageToDraft,
  validateTeacherLibraryDraftQuestion,
  importDraftsToTeacherLibrary,
  importDraftsToQuestionBankV2,
  extractQuestions,
  validateOcrFiles,
  validatePdfPageRange,
  mapExtractionResponseMeta,
  formatOcrApiError,
} from "../../../api/ocrQuestionExtractionApi";
import ExtractionDraftQuestionCard from "../../../components/question/ExtractionDraftQuestionCard";
import ExtractionMathPreview from "../../../components/question/ExtractionMathPreview";

export default function TeacherLibraryExtractionModal({
  isOpen,
  onClose,
  lessonId,
  lessonTitle,
  onImported,
  importTarget = "teacher-library",
}) {
  const isQuestionBankImport = importTarget === "question-bank-v2";
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

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("blue.700", "blue.200");
  const subTextColor = useColorModeValue("gray.500", "gray.400");
  const ocrUploadBg = useColorModeValue("blue.50", "gray.700");

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

  const handleOcrFileUpload = async (event) => {
    const fileList = event.target.files;
    if (!fileList?.length) return;

    const files = Array.from(fileList);
    setSelectedFiles(files);

    const fileError = validateOcrFiles(files);
    if (fileError) {
      toast({
        title: "خطأ",
        description: fileError,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
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

  const handleImport = async () => {
    if (!lessonId) {
      toast({ title: "خطأ", description: "لم يُحدَّد الدرس", status: "error", duration: 3000, isClosable: true });
      return;
    }
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
        const err = validateTeacherLibraryDraftQuestion(group.questions[i], i);
        if (err) {
          toast({ title: "خطأ في التحقق", description: err, status: "error", duration: 5000, isClosable: true });
          return;
        }
      }
    }

    for (let i = 0; i < standaloneQuestions.length; i++) {
      const err = validateTeacherLibraryDraftQuestion(standaloneQuestions[i], i);
      if (err) {
        toast({ title: "خطأ في التحقق", description: err, status: "error", duration: 5000, isClosable: true });
        return;
      }
    }

    setIsImporting(true);
    try {
      const token = localStorage.getItem("token");
      const result = isQuestionBankImport
        ? await importDraftsToQuestionBankV2(
            lessonId,
            draftPassages,
            draftQuestions,
            token,
          )
        : await importDraftsToTeacherLibrary(
            lessonId,
            draftPassages,
            draftQuestions,
            token,
          );

      if (result.totalAdded === 0) {
        toast({
          title: "لم تُضف أسئلة",
          description:
            result.errors[0] ||
            result.message ||
            "تحقق من صحة الأسئلة والقطع",
          status: "warning",
          isClosable: true,
        });
        return;
      }

      let description =
        result.message ||
        (isQuestionBankImport
          ? `تمت إضافة ${result.totalAdded} سؤال إلى بنك الأسئلة`
          : `تمت إضافة ${result.totalAdded} سؤال إلى المكتبة`);

      toast({
        title: "تم الحفظ",
        description,
        status: result.errors.length ? "warning" : "success",
        duration: 5000,
        isClosable: true,
      });

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
      accentScheme="blue"
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
      <ModalContent borderRadius="xl" boxShadow="lg" maxH="90vh" dir="rtl">
        <ModalHeader fontWeight="semibold" fontSize="md" color="blue.600">
          {isQuestionBankImport
            ? "استخراج أسئلة بالذكاء الاصطناعي"
            : "استخراج أسئلة من ملف"}
          {lessonTitle ? ` — ${lessonTitle}` : ""}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={5}>
            <Box
              p={4}
              borderRadius="xl"
              borderWidth="1px"
              borderColor="blue.200"
              bg={ocrUploadBg}
            >
              <Text fontWeight="semibold" fontSize="sm" mb={3}>
                رفع PDF أو صورة لاستخراج الأسئلة
              </Text>
              <FormControl display="flex" alignItems="center" mb={3}>
                <FormLabel htmlFor="infer-answer-library" mb={0} flex="1" fontSize="sm">
                  تخمين الإجابة الصحيحة إن لم تكن مذكورة
                </FormLabel>
                <Switch
                  id="infer-answer-library"
                  colorScheme="blue"
                  isChecked={inferCorrectAnswer}
                  onChange={(e) => setInferCorrectAnswer(e.target.checked)}
                  isDisabled={isExtractingOcr || isImporting}
                />
              </FormControl>
              <FormControl display="flex" alignItems="center" mb={3}>
                <FormLabel htmlFor="include-images-library" mb={0} flex="1" fontSize="sm">
                  استخراج صور الأسئلة من الملف
                </FormLabel>
                <Switch
                  id="include-images-library"
                  colorScheme="orange"
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
              <Text fontSize="xs" color={subTextColor} mb={3}>
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
              <Button
                onClick={openFilePicker}
                leftIcon={isExtractingOcr ? <Spinner size="sm" /> : <FaUpload />}
                colorScheme="blue"
                variant="outline"
                w="full"
                cursor={isExtractingOcr || isImporting ? "not-allowed" : "pointer"}
                isDisabled={isExtractingOcr || isImporting}
                borderRadius="lg"
              >
                {isExtractingOcr
                  ? "جاري الاستخراج…"
                  : selectedFiles.length > 0
                    ? `تم اختيار ${selectedFiles.length === 1 ? "ملف" : `${selectedFiles.length} ملفات`}`
                    : "اختر PDF أو صورة (أو صور متعددة)"}
              </Button>
              {selectedFiles.length > 0 && (
                <Box
                  mt={3}
                  p={3}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="blue.200"
                  bg={cardBg}
                >
                  <Text fontSize="sm" fontWeight="semibold" mb={2}>
                    الملفات المختارة:
                  </Text>
                  <VStack align="stretch" spacing={1}>
                    {selectedFiles.map((file) => (
                      <HStack key={`${file.name}-${file.size}-${file.lastModified}`} spacing={2}>
                        <Icon
                          as={file.type === "application/pdf" || /\.pdf$/i.test(file.name) ? FaFilePdf : FaImage}
                          color="blue.500"
                        />
                        <Text fontSize="sm" noOfLines={1} flex={1}>
                          {file.name}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}
              <HStack mt={2} spacing={4} justify="center" color={subTextColor} fontSize="sm">
                <HStack>
                  <Icon as={FaFilePdf} />
                  <Text>PDF</Text>
                </HStack>
                <HStack>
                  <Icon as={FaImage} />
                  <Text>PNG, JPG, WebP, AVIF, TIFF…</Text>
                </HStack>
              </HStack>
            </Box>

            {extractionMeta && (
              <HStack flexWrap="wrap" spacing={2}>
                {extractionMeta.filename && (
                  <Badge colorScheme="blue">{extractionMeta.filename}</Badge>
                )}
                {extractionMeta.source_files?.length > 1 && (
                  <Badge colorScheme="blue" variant="subtle">
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
                  <Badge colorScheme="orange">
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
                        <Badge colorScheme="orange" variant="subtle">
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
                          placeholder="نص القطعة — يدعم المعادلات والكسور"
                        />
                        <ExtractionMathPreview value={passage.content} whiteSpace="pre-wrap" />
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
            colorScheme="blue"
            borderRadius="lg"
            onClick={handleImport}
            isLoading={isImporting}
            isDisabled={
              draftQuestions.length === 0 || isExtractingOcr || isImporting
            }
          >
            {isQuestionBankImport ? "حفظ في بنك الأسئلة" : "حفظ في المكتبة"}{" "}
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
