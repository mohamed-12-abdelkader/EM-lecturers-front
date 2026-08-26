import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiEye, FiEyeOff, FiKey, FiLock } from "react-icons/fi";

export default function ChangePasswordModal({
  isOpen,
  onClose,
  student,
  onSubmit,
  submitting = false,
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const noteBg = useColorModeValue("blue.50", "blue.900");
  const border = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    if (!isOpen) return;
    setPassword("");
    setConfirm("");
    setShow(false);
    setError("");
  }, [isOpen, student?.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = password.trim();
    if (value.length < 6) {
      setError("كلمة المرور يجب ألا تقل عن 6 أحرف");
      return;
    }
    if (value !== confirm.trim()) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    setError("");
    onSubmit(value);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent
        as="form"
        onSubmit={handleSubmit}
        borderRadius="2xl"
        dir="rtl"
      >
        <ModalHeader fontSize="md" fontWeight="800">
          تغيير كلمة المرور
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Box p={3} bg={noteBg} borderRadius="xl" borderWidth="1px" borderColor={border}>
              <Text fontSize="sm" lineHeight="tall">
                اكتب كلمة مرور جديدة للطالب{" "}
                <Text as="span" fontWeight="800">
                  {student?.name || ""}
                </Text>
                . لن يتم توليد كلمة مرور تلقائياً.
              </Text>
            </Box>

            <FormControl isRequired isInvalid={Boolean(error)}>
              <FormLabel fontSize="sm">كلمة المرور الجديدة</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiLock} color="gray.400" />
                </InputLeftElement>
                <Input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل"
                  borderRadius="xl"
                  autoComplete="new-password"
                />
                <InputRightElement>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setShow((v) => !v)}
                    aria-label={show ? "إخفاء" : "إظهار"}
                  >
                    <Icon as={show ? FiEyeOff : FiEye} />
                  </Button>
                </InputRightElement>
              </InputGroup>
              <FormHelperText>6 أحرف على الأقل — يكتبها المدرس بنفسه</FormHelperText>
            </FormControl>

            <FormControl isRequired isInvalid={Boolean(error)}>
              <FormLabel fontSize="sm">تأكيد كلمة المرور</FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiKey} color="gray.400" />
                </InputLeftElement>
                <Input
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور"
                  borderRadius="xl"
                  autoComplete="new-password"
                />
              </InputGroup>
              {error ? (
                <Text mt={2} fontSize="xs" color="red.500">
                  {error}
                </Text>
              ) : null}
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={onClose} isDisabled={submitting} borderRadius="lg">
            إلغاء
          </Button>
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={submitting}
            borderRadius="lg"
            leftIcon={<Icon as={FiKey} />}
          >
            حفظ كلمة المرور
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
