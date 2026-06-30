import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Textarea,
  Text,
  useToast
} from '@chakra-ui/react';
import { FaUsers } from 'react-icons/fa';

const AddStudentDualModal = ({ isOpen, onClose, onAddBulk, loading = false }) => {
  const [namesText, setNamesText] = useState('');
  const toast = useToast();

  const reset = () => {
    setNamesText('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submitBulk = async () => {
    const names = namesText
      .split(/\r?\n|,/)
      .map((n) => n.trim())
      .filter(Boolean);

    if (!names.length) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال اسم طالب واحد على الأقل',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
      return;
    }
    try {
      await onAddBulk?.(names);
      handleClose();
    } catch (e) {
      // Parent shows toast on error
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>إضافة مجموعة طلاب</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <HStack spacing={2} color="blue.500">
              <FaUsers />
              <Text fontWeight="bold">إضافة عدة طلاب دفعة واحدة</Text>
            </HStack>
            <FormControl isRequired>
              <FormLabel>أسماء الطلاب</FormLabel>
              <Textarea
                value={namesText}
                onChange={(e) => setNamesText(e.target.value)}
                placeholder={`اكتب اسم كل طالب في سطر\nAhmed Ali\nMona Samir\nYoussef Adel`}
                rows={8}
                resize="vertical"
                borderRadius="xl"
              />
              <Text mt={2} fontSize="xs" color="gray.500">
                يمكنك أيضًا الفصل بفاصلة (,)
              </Text>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleClose}>إلغاء</Button>
            <Button colorScheme="blue" onClick={submitBulk} isLoading={loading}>إضافة المجموعة</Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddStudentDualModal;