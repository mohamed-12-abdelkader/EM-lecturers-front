import React, { useState, useEffect } from 'react';
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
  NumberDecrementStepper
} from '@chakra-ui/react';
import { FaUser, FaPhone, FaMoneyBillWave } from 'react-icons/fa';

const EditStudentModal = ({ isOpen, onClose, onUpdate, student, loading = false }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [email, setEmail] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (student && isOpen) {
      setName(student.student_name || '');
      setPhone(student.phone || '');
      setParentPhone(student.parent_phone || '');
      setPaymentStatus(student.payment_status || '');
      setPaymentAmount(student.payment_amount?.toString() || '');
      setEmail(student.student_email || '');
    }
  }, [student, isOpen]);

  const handleUpdate = () => {
    if (!name.trim() || !phone.trim() || !parentPhone.trim() || !paymentStatus) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const studentData = {
      name: name.trim(),
      phone: phone.trim(),
      parent_phone: parentPhone.trim(),
      payment_status: paymentStatus,
      payment_amount: parseFloat(paymentAmount) || 0,
      email: email.trim()
    };

    onUpdate(studentData);
  };

  const handleClose = () => {
    setName('');
    setPhone('');
    setParentPhone('');
    setPaymentStatus('');
    setPaymentAmount('');
    setEmail('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>تعديل بيانات الطالب</ModalHeader>
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
                />
              </InputGroup>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>رقم الهاتف</FormLabel>
              <InputGroup>
                <InputLeftElement>
                  <FaPhone color="gray.300" />
                </InputLeftElement>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="أدخل رقم الهاتف"
                  type="tel"
                />
              </InputGroup>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>رقم هاتف الوالد</FormLabel>
              <InputGroup>
                <InputLeftElement>
                  <FaPhone color="gray.300" />
                </InputLeftElement>
                <Input
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="أدخل رقم هاتف الوالد"
                  type="tel"
                />
              </InputGroup>
            </FormControl>

            <FormControl>
              <FormLabel>البريد الإلكتروني</FormLabel>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="أدخل البريد الإلكتروني"
                type="email"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>حالة الدفع</FormLabel>
              <Select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                placeholder="اختر حالة الدفع"
              >
                <option value="paid">مدفوع</option>
                <option value="unpaid">غير مدفوع</option>
                <option value="partial">مدفوع جزئياً</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>مبلغ الدفع</FormLabel>
              <InputGroup>
                <InputLeftElement>
                  <FaMoneyBillWave color="gray.300" />
                </InputLeftElement>
                <NumberInput
                  value={paymentAmount}
                  onChange={(value) => setPaymentAmount(value)}
                  min={0}
                  precision={2}
                >
                  <NumberInputField placeholder="أدخل مبلغ الدفع" />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </InputGroup>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={handleClose}>
              إلغاء
            </Button>
            <Button
              colorScheme="teal"
              onClick={handleUpdate}
              isLoading={loading}
              loadingText="جاري التحديث..."
            >
              تحديث البيانات
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditStudentModal; 