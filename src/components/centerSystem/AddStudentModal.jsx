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
  HStack,
  Text,
  Select,
  useToast,
  FormControl,
  FormLabel,
  InputGroup,
  InputLeftElement,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Box
} from '@chakra-ui/react';
import { FaUser, FaPhone, FaMoneyBillWave } from 'react-icons/fa';
import baseUrl from '../../api/baseUrl';

const AddStudentModal = ({ isOpen, onClose, onAddStudent, groupId, loading = false }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [paymentAmount, setPaymentAmount] = useState('');
  const toast = useToast();

  const handleSubmit = async () => {
    // التحقق من صحة البيانات
    if (!name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم الطالب",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!phone.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم هاتف الطالب",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!parentPhone.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم هاتف ولي الأمر",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!paymentAmount || isNaN(paymentAmount) || parseFloat(paymentAmount) < 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مبلغ الدفع بشكل صحيح",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // التحقق من تنسيق أرقام الهواتف المصرية
    const phoneRegex = /^(\+20)?(01|02|05|010|011|012|015)\d{8}$/;
    if (!phoneRegex.test(phone)) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم هاتف مصري صحيح",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!phoneRegex.test(parentPhone)) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم هاتف ولي الأمر مصري صحيح",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // إضافة +20 إذا لم تكن موجودة
    const formattedPhone = phone.startsWith('+20') ? phone : `+20${phone}`;
    const formattedParentPhone = parentPhone.startsWith('+20') ? parentPhone : `+20${parentPhone}`;

    const studentData = {
      name: name.trim(),
      phone: formattedPhone,
      parent_phone: formattedParentPhone,
      payment_status: paymentStatus,
      payment_amount: parseFloat(paymentAmount)
    };

    try {
      const token = localStorage.getItem('token');
      const response = await baseUrl.post(
        `/api/study-groups/${groupId}/students`,
        studentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Student added successfully:', response.data);
      
      toast({
        title: "نجح",
        description: "تم إضافة الطالب بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // استدعاء دالة التحديث من المكون الأب
      if (onAddStudent) {
        onAddStudent(response.data);
      }

      // إعادة تعيين الحقول
      resetForm();
      onClose();
      
    } catch (error) {
      console.error('Error adding student:', error);
      toast({
        title: "خطأ",
        description: error.response?.data?.message || "حدث خطأ في إضافة الطالب",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setParentPhone('');
    setPaymentStatus('paid');
    setPaymentAmount('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>إضافة طالب جديد</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>اسم الطالب</FormLabel>
              <InputGroup>
                <InputLeftElement>
                  <FaUser color="gray.300" />
                </InputLeftElement>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسم الطالب"
                  size="lg"
                  borderRadius="xl"
                  borderColor="gray.300"
                  _focus={{ 
                    borderColor: "blue.500", 
                    boxShadow: "0 0 0 1px #3B82F6"
                  }}
                />
              </InputGroup>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>رقم هاتف الطالب</FormLabel>
              <InputGroup>
                <InputLeftElement>
                  <FaPhone color="gray.300" />
                </InputLeftElement>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="مثال: 01234567890"
                  size="lg"
                  type="tel"
                  borderRadius="xl"
                  borderColor="gray.300"
                  _focus={{ 
                    borderColor: "blue.500", 
                    boxShadow: "0 0 0 1px #3B82F6"
                  }}
                />
              </InputGroup>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>رقم هاتف ولي الأمر</FormLabel>
              <InputGroup>
                <InputLeftElement>
                  <FaPhone color="gray.300" />
                </InputLeftElement>
                <Input
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="مثال: 09876543210"
                  size="lg"
                  type="tel"
                  borderRadius="xl"
                  borderColor="gray.300"
                  _focus={{ 
                    borderColor: "blue.500", 
                    boxShadow: "0 0 0 1px #3B82F6"
                  }}
                />
              </InputGroup>
            </FormControl>

            <HStack width="100%" spacing={4}>
              <FormControl isRequired>
                <FormLabel>حالة الدفع</FormLabel>
                <Select 
                  value={paymentStatus} 
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  size="lg"
                  borderRadius="xl"
                  borderColor="gray.300"
                  _focus={{ 
                    borderColor: "blue.500", 
                    boxShadow: "0 0 0 1px #3B82F6"
                  }}
                >
                  <option value="paid">مدفوع</option>
                  <option value="unpaid">غير مدفوع</option>
                  <option value="partial">مدفوع جزئياً</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>المبلغ المدفوع</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <FaMoneyBillWave color="gray.300" />
                  </InputLeftElement>
                  <NumberInput
                    value={paymentAmount}
                    onChange={(value) => setPaymentAmount(value)}
                    min={0}
                    precision={2}
                    size="lg"
                    borderRadius="xl"
                    borderColor="gray.300"
                    _focus={{ 
                      borderColor: "blue.500", 
                      boxShadow: "0 0 0 1px #3B82F6"
                    }}
                  >
                    <NumberInputField 
                      placeholder="0.00"
                      borderRadius="xl"
                      borderColor="gray.300"
                      _focus={{ 
                        borderColor: "blue.500", 
                        boxShadow: "0 0 0 1px #3B82F6"
                      }}
                    />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </InputGroup>
              </FormControl>
            </HStack>

            {/* معلومات إضافية */}
            <Box 
              bg="blue.50" 
              p={4} 
              borderRadius="xl" 
              border="1px" 
              borderColor="blue.200"
              w="100%"
            >
              <Text fontSize="sm" color="blue.700" fontWeight="medium">
                💡 ملاحظات:
              </Text>
              <VStack align="start" spacing={1} mt={2}>
                <Text fontSize="xs" color="blue.600">
                  • يمكن إدخال أرقام الهواتف مع أو بدون +20
                </Text>
                <Text fontSize="xs" color="blue.600">
                  • المبلغ يجب أن يكون رقم موجب
                </Text>
                <Text fontSize="xs" color="blue.600">
                  • سيتم إضافة الطالب للمجموعة الحالية
                </Text>
              </VStack>
            </Box>
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
              bgGradient: "linear(135deg, blue.600 0%, purple.600 100%)",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)"
            }}
            _active={{ transform: "translateY(0)" }}
            transition="all 0.2s"
          >
            إضافة الطالب
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddStudentModal; 