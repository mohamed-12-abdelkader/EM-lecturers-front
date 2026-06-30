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
  Input,
  VStack,
  FormControl,
  FormLabel,
  InputGroup,
  InputLeftElement,
  useToast
} from '@chakra-ui/react';
import { FaIdBadge } from 'react-icons/fa';

const AddStudentByIdModal = ({ isOpen, onClose, onAddStudent, loading = false }) => {
  const [studentId, setStudentId] = useState('');
  const toast = useToast();

  const handleSubmit = async () => {
    const trimmed = String(studentId).trim();
    const numericId = Number(trimmed);

    if (!trimmed || Number.isNaN(numericId) || numericId <= 0) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال رقم طالب صحيح',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      if (onAddStudent) {
        await onAddStudent(numericId);
      }
      setStudentId('');
      onClose();
    } catch (err) {
      // سيتم عرض رسائل الخطأ من المكون الأب عند الحاجة
    }
  };

  const handleClose = () => {
    setStudentId('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>إضافة طالب إلى المجموعة عبر رقم الطالب</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>رقم الطالب</FormLabel>
              <InputGroup>
                <InputLeftElement>
                  <FaIdBadge color="gray.300" />
                </InputLeftElement>
                <Input
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="أدخل رقم الطالب (ID)"
                  size="lg"
                  type="number"
                  borderRadius="xl"
                  borderColor="gray.300"
                  _focus={{ 
                    borderColor: 'blue.500',
                    boxShadow: '0 0 0 1px #3B82F6'
                  }}
                />
              </InputGroup>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            colorScheme="blue"
            isLoading={loading}
            loadingText="جاري الإضافة..."
            size="lg"
            borderRadius="xl"
            px={8}
            bgGradient="linear(135deg, blue.500 0%, purple.500 100%)"
            _hover={{ 
              bgGradient: 'linear(135deg, blue.600 0%, purple.600 100%)',
              transform: 'translateY(-1px)'
            }}
            _active={{ transform: 'translateY(0)' }}
            transition="all 0.2s"
          >
            إضافة الطالب
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddStudentByIdModal;





