import React, { useCallback, useRef, useState } from "react";
import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaCloudUploadAlt, FaFileAlt, FaGoogleDrive, FaLink, FaPlus, FaTrash } from "react-icons/fa";
import {
  formatFileSize,
  inferExtensionFromDriveUrl,
  validateDriveUrl,
  validateTeacherFile,
} from "../../../api/teacherMyFilesApi";

const TYPE_BADGES = ["PDF", "DOCX", "PPTX", "XLSX"];

const EMPTY_LINK = { name: "", driveUrl: "" };

export default function UploadFileModal({
  isOpen,
  onClose,
  categories,
  onAddDrive,
  onBulkDriveLinks,
  onUpload,
  busy,
}) {
  const [tabIndex, setTabIndex] = useState(0);
  const [form, setForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    driveUrl: "",
    fileExtension: "",
    file: null,
  });
  const [bulkForm, setBulkForm] = useState({
    categoryId: "",
    description: "",
    links: [{ ...EMPTY_LINK }, { ...EMPTY_LINK }],
  });
  const [dragOver, setDragOver] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  const dropBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const dropBorder = useColorModeValue("blue.300", "blue.500");
  const inputBg = useColorModeValue("#f8fafc", "gray.700");
  const progressCardBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const muted = useColorModeValue("gray.500", "gray.400");
  const hintBg = useColorModeValue("green.50", "green.900");

  const reset = () => {
    setTabIndex(0);
    setForm({
      name: "",
      description: "",
      categoryId: "",
      driveUrl: "",
      fileExtension: "",
      file: null,
    });
    setBulkForm({
      categoryId: "",
      description: "",
      links: [{ ...EMPTY_LINK }, { ...EMPTY_LINK }],
    });
    setUploadPct(0);
    setUploading(false);
    setDragOver(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (uploading) return;
    reset();
    onClose();
  };

  const pickFile = (file) => {
    if (!file) return;
    const base = file.name?.replace(/\.[^.]+$/, "") || "ملف جديد";
    setForm((f) => ({ ...f, file, name: f.name || base.slice(0, 120) }));
    setUploadPct(0);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0]);
  }, []);

  const handleAddDrive = async () => {
    if (!form.name?.trim()) return { error: "اسم الملف مطلوب" };
    const urlErr = validateDriveUrl(form.driveUrl);
    if (urlErr) return { error: urlErr };

    setUploading(true);
    try {
      await onAddDrive({
        name: form.name.trim(),
        driveUrl: form.driveUrl.trim(),
        description: form.description?.trim(),
        categoryId: form.categoryId || undefined,
        fileExtension:
          form.fileExtension?.trim() ||
          inferExtensionFromDriveUrl(form.driveUrl, form.name),
      });
      reset();
      onClose();
    } catch {
      setUploading(false);
    }
  };

  const handleBulkLinks = async () => {
    const links = bulkForm.links
      .map((item) => ({
        name: item.name.trim(),
        driveUrl: item.driveUrl.trim(),
        fileExtension: inferExtensionFromDriveUrl(item.driveUrl, item.name),
      }))
      .filter((item) => item.name && item.driveUrl);

    if (links.length === 0) return { error: "أضف رابطاً واحداً على الأقل مع الاسم" };

    for (const item of links) {
      const urlErr = validateDriveUrl(item.driveUrl);
      if (urlErr) return { error: `${item.name}: ${urlErr}` };
    }

    setUploading(true);
    try {
      await onBulkDriveLinks({
        links,
        categoryId: bulkForm.categoryId || undefined,
        description: bulkForm.description?.trim(),
      });
      reset();
      onClose();
    } catch {
      setUploading(false);
    }
  };

  const handleUploadFile = async () => {
    const err = validateTeacherFile(form.file);
    if (err) return { error: err };
    if (!form.name?.trim()) return { error: "اسم الملف مطلوب" };

    setUploading(true);
    setUploadPct(0);
    try {
      await onUpload(
        {
          file: form.file,
          name: form.name.trim(),
          description: form.description?.trim(),
          categoryId: form.categoryId || undefined,
        },
        (pct) => setUploadPct(pct),
      );
      reset();
      onClose();
    } catch {
      setUploading(false);
    }
  };

  const updateBulkLink = (index, field, value) => {
    setBulkForm((prev) => ({
      ...prev,
      links: prev.links.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const addBulkRow = () => {
    setBulkForm((prev) => ({
      ...prev,
      links: [...prev.links, { ...EMPTY_LINK }],
    }));
  };

  const removeBulkRow = (index) => {
    setBulkForm((prev) => ({
      ...prev,
      links: prev.links.length <= 1 ? prev.links : prev.links.filter((_, i) => i !== index),
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl" isCentered scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(4px)" />
      <ModalContent borderRadius="2xl" mx={4} overflow="hidden">
        <ModalCloseButton left={3} right="auto" isDisabled={uploading} />

        <ModalBody p={{ base: 5, md: 7 }}>
          <HStack spacing={3} mb={5} justify="flex-start">
            <Flex
              w={10}
              h={10}
              borderRadius="xl"
              bg="blue.500"
              color="white"
              align="center"
              justify="center"
              boxShadow="0 4px 14px rgba(59,130,246,0.4)"
            >
              <Icon as={FaGoogleDrive} boxSize={5} />
            </Flex>
            <Box>
              <Text fontSize="xl" fontWeight="bold">
                إضافة ملفات
              </Text>
              <Text fontSize="sm" color={muted}>
                أضف روابط Google Drive أو ارفع ملفاً من جهازك
              </Text>
            </Box>
          </HStack>

          <Tabs
            index={tabIndex}
            onChange={setTabIndex}
            variant="soft-rounded"
            colorScheme="blue"
            isLazy
          >
            <TabList mb={5} flexWrap="wrap" gap={2}>
              <Tab fontSize="sm">رابط Drive</Tab>
              <Tab fontSize="sm">عدة روابط</Tab>
              <Tab fontSize="sm">رفع من الجهاز</Tab>
            </TabList>

            <TabPanels>
              <TabPanel px={0}>
                <VStack spacing={4} align="stretch">
                  <Box p={3} borderRadius="lg" bg={hintBg}>
                    <Text fontSize="xs" color={muted} lineHeight="1.8">
                      الصق رابط مشاركة Google Drive. تأكد أن الملف «أي شخص لديه الرابط» يمكنه
                      العرض حتى يظهر داخل الموقع.
                    </Text>
                  </Box>

                  <FormControl isRequired>
                    <FormLabel fontSize="sm">اسم الملف</FormLabel>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      bg={inputBg}
                      borderRadius="lg"
                      placeholder="ملخص الكيمياء"
                      isDisabled={uploading}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="sm">رابط Google Drive</FormLabel>
                    <Input
                      value={form.driveUrl}
                      onChange={(e) => setForm((f) => ({ ...f, driveUrl: e.target.value }))}
                      bg={inputBg}
                      borderRadius="lg"
                      placeholder="https://drive.google.com/file/d/.../view"
                      dir="ltr"
                      isDisabled={uploading}
                    />
                  </FormControl>

                  <HStack align="start" spacing={4} flexDir={{ base: "column", sm: "row" }}>
                    <FormControl flex={1}>
                      <FormLabel fontSize="sm">التصنيف</FormLabel>
                      <Select
                        value={form.categoryId}
                        onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                        bg={inputBg}
                        borderRadius="lg"
                        isDisabled={uploading}
                      >
                        <option value="">بدون تصنيف</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl flex={1}>
                      <FormLabel fontSize="sm">الامتداد (اختياري)</FormLabel>
                      <Select
                        value={form.fileExtension}
                        onChange={(e) => setForm((f) => ({ ...f, fileExtension: e.target.value }))}
                        bg={inputBg}
                        borderRadius="lg"
                        isDisabled={uploading}
                      >
                        <option value="">تلقائي من الرابط</option>
                        <option value="pdf">PDF</option>
                        <option value="docx">DOCX</option>
                        <option value="pptx">PPTX</option>
                        <option value="xlsx">XLSX</option>
                      </Select>
                    </FormControl>
                  </HStack>

                  <FormControl>
                    <FormLabel fontSize="sm">الوصف</FormLabel>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      bg={inputBg}
                      borderRadius="lg"
                      rows={2}
                      isDisabled={uploading}
                    />
                  </FormControl>

                  <Button
                    colorScheme="blue"
                    size="lg"
                    borderRadius="xl"
                    leftIcon={<FaLink />}
                    onClick={handleAddDrive}
                    isLoading={busy || uploading}
                    loadingText="جاري الإضافة..."
                  >
                    إضافة الرابط
                  </Button>
                </VStack>
              </TabPanel>

              <TabPanel px={0}>
                <VStack spacing={4} align="stretch">
                  <HStack spacing={4} flexDir={{ base: "column", sm: "row" }}>
                    <FormControl flex={1}>
                      <FormLabel fontSize="sm">تصنيف مشترك</FormLabel>
                      <Select
                        value={bulkForm.categoryId}
                        onChange={(e) =>
                          setBulkForm((f) => ({ ...f, categoryId: e.target.value }))
                        }
                        bg={inputBg}
                        borderRadius="lg"
                        isDisabled={uploading}
                      >
                        <option value="">بدون تصنيف</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </HStack>

                  {bulkForm.links.map((item, index) => (
                    <Box
                      key={index}
                      p={4}
                      borderWidth="1px"
                      borderRadius="xl"
                      borderColor="gray.200"
                    >
                      <HStack justify="space-between" mb={3}>
                        <Text fontSize="sm" fontWeight="semibold">
                          رابط {index + 1}
                        </Text>
                        <IconButton
                          aria-label="حذف"
                          icon={<FaTrash />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => removeBulkRow(index)}
                          isDisabled={bulkForm.links.length <= 1 || uploading}
                        />
                      </HStack>
                      <VStack spacing={3}>
                        <FormControl isRequired>
                          <FormLabel fontSize="sm">الاسم</FormLabel>
                          <Input
                            value={item.name}
                            onChange={(e) => updateBulkLink(index, "name", e.target.value)}
                            bg={inputBg}
                            borderRadius="lg"
                            isDisabled={uploading}
                          />
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel fontSize="sm">رابط Drive</FormLabel>
                          <Input
                            value={item.driveUrl}
                            onChange={(e) => updateBulkLink(index, "driveUrl", e.target.value)}
                            bg={inputBg}
                            borderRadius="lg"
                            dir="ltr"
                            isDisabled={uploading}
                          />
                        </FormControl>
                      </VStack>
                    </Box>
                  ))}

                  <Button
                    variant="outline"
                    leftIcon={<FaPlus />}
                    borderRadius="xl"
                    onClick={addBulkRow}
                    isDisabled={uploading || bulkForm.links.length >= 20}
                  >
                    إضافة رابط آخر
                  </Button>

                  <Button
                    colorScheme="blue"
                    size="lg"
                    borderRadius="xl"
                    onClick={handleBulkLinks}
                    isLoading={busy || uploading}
                    loadingText="جاري الإضافة..."
                  >
                    إضافة كل الروابط
                  </Button>
                </VStack>
              </TabPanel>

              <TabPanel px={0}>
                <VStack spacing={5} align="stretch">
                  <Box
                    borderWidth="2px"
                    borderStyle="dashed"
                    borderColor={dragOver ? "blue.400" : dropBorder}
                    borderRadius="xl"
                    bg={dropBg}
                    py={8}
                    px={4}
                    textAlign="center"
                    cursor={uploading ? "not-allowed" : "pointer"}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (!uploading) setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={uploading ? undefined : onDrop}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                  >
                    <Icon as={FaCloudUploadAlt} boxSize={10} color="blue.400" mb={3} />
                    <Text fontWeight="bold" color="blue.600" fontSize="md" mb={1}>
                      سحب ملف من الجهاز
                    </Text>
                    <HStack justify="center" spacing={2} flexWrap="wrap" mt={3}>
                      {TYPE_BADGES.map((t) => (
                        <Box
                          key={t}
                          px={3}
                          py={1}
                          borderRadius="md"
                          bg="white"
                          fontSize="xs"
                          fontWeight="bold"
                          color="blue.600"
                        >
                          {t}
                        </Box>
                      ))}
                    </HStack>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      display="none"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => pickFile(e.target.files?.[0])}
                    />
                  </Box>

                  <FormControl isRequired>
                    <FormLabel fontSize="sm">اسم الملف</FormLabel>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      bg={inputBg}
                      borderRadius="lg"
                      isDisabled={uploading}
                    />
                  </FormControl>

                  {form.file && (
                    <Box p={4} borderRadius="xl" bg={progressCardBg} borderWidth="1px">
                      <HStack spacing={3}>
                        <Icon as={FaFileAlt} color="blue.500" />
                        <Box flex={1}>
                          <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                            {form.file.name}
                          </Text>
                          <Text fontSize="xs" color={muted}>
                            {uploading
                              ? `جاري الرفع... ${uploadPct}%`
                              : formatFileSize(form.file.size)}
                          </Text>
                        </Box>
                      </HStack>
                      {uploading && (
                        <Progress value={uploadPct} size="sm" colorScheme="green" mt={3} />
                      )}
                    </Box>
                  )}

                  <Button
                    colorScheme="blue"
                    size="lg"
                    borderRadius="xl"
                    onClick={handleUploadFile}
                    isLoading={busy || uploading}
                    isDisabled={!form.file}
                    loadingText="جاري الرفع..."
                  >
                    رفع الملف
                  </Button>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>

          <Button mt={4} w="full" variant="ghost" onClick={handleClose} isDisabled={uploading}>
            إلغاء
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
