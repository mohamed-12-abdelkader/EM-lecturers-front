import { useEffect, useState } from "react";
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { getCourseFileDisplayName, validateCourseFileUpdate } from "../../../api/courseFilesApi";

export default function EditCourseFileModal({ isOpen, onClose, file, onSubmit, loading }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !file) return;
    setTitle(getCourseFileDisplayName(file));
    setDescription(file.description || "");
    setError("");
  }, [isOpen, file]);

  const handleSubmit = async () => {
    if (loading) return;
    const payload = { title: title.trim(), description: description.trim() };
    const validationError = validateCourseFileUpdate(payload);
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
      closeOnEsc={!loading}
      size={{ base: "full", md: "lg" }}
    >
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent borderRadius={{ base: "none", md: "2xl" }} mx={{ base: 0, md: 4 }}>
        <ModalHeader>تعديل ملف PDF</ModalHeader>
        <ModalCloseButton isDisabled={loading} />
        <ModalBody>
          <VStack spacing={5} align="stretch">
            <FormControl isRequired isInvalid={Boolean(error)}>
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
              {error ? <FormErrorMessage role="alert">{error}</FormErrorMessage> : null}
            </FormControl>
            <FormControl>
              <FormLabel>الوصف (اختياري)</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف يظهر للطلاب"
                rows={3}
                isDisabled={loading}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={onClose} isDisabled={loading}>
            إلغاء
          </Button>
          <Button
            colorScheme="orange"
            onClick={handleSubmit}
            isLoading={loading}
            loadingText="جاري الحفظ..."
            isDisabled={loading}
          >
            حفظ التعديلات
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
