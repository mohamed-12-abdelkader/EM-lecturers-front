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
  useColorModeValue,
} from "@chakra-ui/react";
import { FaCloudUploadAlt, FaFileAlt } from "react-icons/fa";
import { formatFileSize, validateTeacherFile } from "../../../api/teacherMyFilesApi";

const TYPE_BADGES = ["PDF", "DOCX", "XLSX", "ZIP"];

export default function UploadFileModal({
  isOpen,
  onClose,
  categories,
  onUpload,
  busy,
}) {
  const [form, setForm] = useState({ name: "", description: "", categoryId: "", file: null });
  const [dragOver, setDragOver] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  const dropBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const dropBorder = useColorModeValue("blue.300", "blue.500");
  const inputBg = useColorModeValue("#f8fafc", "gray.700");
  const progressCardBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const muted = useColorModeValue("gray.500", "gray.400");

  const reset = () => {
    setForm({ name: "", description: "", categoryId: "", file: null });
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

  const handleConfirm = async () => {
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
        (pct) => setUploadPct(pct)
      );
      reset();
      onClose();
      return { ok: true };
    } catch {
      setUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" isCentered>
      <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(4px)" />
      <ModalContent borderRadius="2xl" mx={4} overflow="hidden">
        <ModalCloseButton left={3} right="auto" isDisabled={uploading} />

        <ModalBody p={{ base: 5, md: 7 }}>
          <HStack spacing={3} mb={6} justify="flex-start">
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
              <Icon as={FaCloudUploadAlt} boxSize={5} />
            </Flex>
            <Text fontSize="xl" fontWeight="bold">
              رفع ملف جديد
            </Text>
          </HStack>

          <VStack spacing={5} align="stretch">
            <Box
              borderWidth="2px"
              borderStyle="dashed"
              borderColor={dragOver ? "blue.400" : dropBorder}
              borderRadius="xl"
              bg={dropBg}
              py={10}
              px={4}
              textAlign="center"
              cursor={uploading ? "not-allowed" : "pointer"}
              transition="all 0.2s"
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
                قم بسحب الملف هنا
              </Text>
              <Text fontSize="sm" color={muted} mb={4}>
                أو اضغط لاختيار ملف من جهازك
              </Text>
              <HStack justify="center" spacing={2} flexWrap="wrap">
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
                    borderWidth="1px"
                    borderColor="blue.100"
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

            <HStack spacing={4} align="start" flexDir={{ base: "column", sm: "row" }}>
              <FormControl flex={1} isRequired>
                <FormLabel fontSize="sm" fontWeight="semibold">
                  اسم الملف
                </FormLabel>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  bg={inputBg}
                  borderColor="gray.200"
                  borderRadius="lg"
                  isDisabled={uploading}
                />
              </FormControl>
              <FormControl flex={1}>
                <FormLabel fontSize="sm" fontWeight="semibold">
                  التصنيف
                </FormLabel>
                <Select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  bg={inputBg}
                  borderColor="gray.200"
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

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="semibold">
                الوصف
              </FormLabel>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="أضف وصفاً موجزاً للملف..."
                bg={inputBg}
                borderColor="gray.200"
                borderRadius="lg"
                rows={3}
                isDisabled={uploading}
              />
            </FormControl>

            {form.file && (
              <Box
                p={4}
                borderRadius="xl"
                bg={progressCardBg}
                borderWidth="1px"
                borderColor="blue.100"
              >
                <Flex justify="space-between" align="start" mb={3} gap={3}>
                  <HStack spacing={3} align="start" flex={1}>
                    <Flex
                      w={10}
                      h={10}
                      borderRadius="lg"
                      bg="white"
                      align="center"
                      justify="center"
                      flexShrink={0}
                    >
                      <Icon as={FaFileAlt} color="blue.500" />
                    </Flex>
                    <Box minW={0}>
                      <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                        {form.file.name}
                      </Text>
                      <Text fontSize="xs" color={muted}>
                        {uploading
                          ? `جاري الرفع... ${uploadPct}%`
                          : formatFileSize(form.file.size)}
                      </Text>
                    </Box>
                  </HStack>
                  <Text fontWeight="bold" color="blue.600" fontSize="sm">
                    {uploading ? `${uploadPct}%` : "جاهز"}
                  </Text>
                </Flex>
                {uploading && (
                  <Progress
                    value={uploadPct}
                    size="sm"
                    colorScheme="green"
                    borderRadius="full"
                    mb={2}
                  />
                )}
                {!uploading && (
                  <Button
                    size="xs"
                    variant="link"
                    colorScheme="red"
                    onClick={() => {
                      setForm((f) => ({ ...f, file: null }));
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    إزالة الملف
                  </Button>
                )}
              </Box>
            )}

            <HStack spacing={3} pt={2}>
              <Button
                flex={1}
                size="lg"
                colorScheme="blue"
                borderRadius="xl"
                boxShadow="0 8px 20px rgba(59,130,246,0.35)"
                onClick={handleConfirm}
                isLoading={busy || uploading}
                loadingText="جاري الرفع..."
                isDisabled={!form.file}
              >
                تأكيد الرفع
              </Button>
              <Button
                flex={1}
                size="lg"
                variant="outline"
                borderRadius="xl"
                borderColor="gray.200"
                onClick={handleClose}
                isDisabled={uploading}
              >
                إلغاء
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
