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
  Box,
  Badge
} from '@chakra-ui/react';
import { FaFileAlt, FaCalendarAlt, FaStar } from 'react-icons/fa';
import baseUrl from '../../api/baseUrl';

const AddExamModal = ({ isOpen, onClose, groupId, groupName, onExamAdded, loading = false }) => {
  const [name, setName] = useState('');
  const [totalGrade, setTotalGrade] = useState('');
  const [examDate, setExamDate] = useState('');
  const toast = useToast();

  const handleSubmit = async () => {
    // التحقق من صحة البيانات
    if (!name.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم الامتحان",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!totalGrade || isNaN(totalGrade) || parseFloat(totalGrade) <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال الدرجة الكلية بشكل صحيح",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!examDate) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار تاريخ الامتحان",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // التحقق من أن تاريخ الامتحان ليس في الماضي
    const selectedDate = new Date(examDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast({
        title: "خطأ",
        description: "لا يمكن تحديد تاريخ امتحان في الماضي",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const examData = {
      group_id: parseInt(groupId),
      name: name.trim(),
      total_grade: parseFloat(totalGrade),
      exam_date: examDate
    };

    try {
      const token = localStorage.getItem('token');
      const response = await baseUrl.post(
        '/api/group-exams',
        examData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Exam created successfully:', response.data);
      
      toast({
        title: "نجح",
        description: "تم إنشاء الامتحان بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // استدعاء دالة التحديث من المكون الأب
      if (onExamAdded) {
        onExamAdded(response.data);
      }

      // إعادة تعيين الحقول
      resetForm();
      onClose();
      
    } catch (error) {
      console.error('Error creating exam:', error);
      toast({
        title: "خطأ",
        description: error.response?.data?.message || "حدث خطأ في إنشاء الامتحان",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const resetForm = () => {
    setName('');
    setTotalGrade('');
    setExamDate('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // الحصول على الحد الأدنى للتاريخ (اليوم)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={3}>
            <Box p={2} bg="blue.100" borderRadius="lg">
              <FaFileAlt color="#3182CE" size={20} />
            </Box>
            <VStack align="start" spacing={0}>
              <Text>إنشاء امتحان جديد</Text>
              <Text fontSize="sm" color="gray.500" fontWeight="normal">
                {groupName}
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6}>
            {/* معلومات المجموعة */}
            <Box 
              bg="blue.50" 
              p={4} 
              borderRadius="xl" 
              border="1px" 
              borderColor="blue.200"
              w="100%"
            >
              <HStack spacing={3}>
                <Badge colorScheme="blue" variant="solid" px={3} py={1} borderRadius="full">
                  المجموعة
                </Badge>
                <Text fontWeight="semibold" color="blue.700">
                  {groupName}
                </Text>
              </HStack>
            </Box>

            <FormControl isRequired>
              <FormLabel>اسم الامتحان</FormLabel>
              <InputGroup>
                <InputLeftElement>
                  <FaFileAlt color="gray.300" />
                </InputLeftElement>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: امتحان الوحدة الأولى - الرياضيات"
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

            <HStack width="100%" spacing={4}>
              <FormControl isRequired>
                <FormLabel>الدرجة الكلية</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <FaStar color="gray.300" />
                  </InputLeftElement>
                  <NumberInput
                    value={totalGrade}
                    onChange={(value) => setTotalGrade(value)}
                    min={1}
                    max={1000}
                    precision={0}
                    size="lg"
                    borderRadius="xl"
                    borderColor="gray.300"
                    _focus={{ 
                      borderColor: "blue.500", 
                      boxShadow: "0 0 0 1px #3B82F6"
                    }}
                  >
                    <NumberInputField 
                      placeholder="100"
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

              <FormControl isRequired>
                <FormLabel>تاريخ الامتحان</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <FaCalendarAlt color="gray.300" />
                  </InputLeftElement>
                  <Input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    min={getMinDate()}
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
            </HStack>

            {/* معلومات إضافية */}
            <Box 
              bg="green.50" 
              p={4} 
              borderRadius="xl" 
              border="1px" 
              borderColor="green.200"
              w="100%"
            >
              <Text fontSize="sm" color="green.700" fontWeight="medium">
                📝 معلومات الامتحان:
              </Text>
              <VStack align="start" spacing={1} mt={2}>
                <Text fontSize="xs" color="green.600">
                  • سيتم إنشاء الامتحان للمجموعة المحددة
                </Text>
                <Text fontSize="xs" color="green.600">
                  • يمكن للطلاب الوصول للامتحان في التاريخ المحدد
                </Text>
                <Text fontSize="xs" color="green.600">
                  • يمكنك إضافة الأسئلة لاحقاً من صفحة إدارة الامتحان
                </Text>
              </VStack>
            </Box>

            {/* معاينة البيانات */}
            {name && totalGrade && examDate && (
              <Box 
                bg="purple.50" 
                p={4} 
                borderRadius="xl" 
                border="1px" 
                borderColor="purple.200"
                w="100%"
              >
                <Text fontSize="sm" color="purple.700" fontWeight="medium" mb={2}>
                  👀 معاينة الامتحان:
                </Text>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="purple.600">
                    <strong>الاسم:</strong> {name}
                  </Text>
                  <Text fontSize="xs" color="purple.600">
                    <strong>الدرجة الكلية:</strong> {totalGrade} درجة
                  </Text>
                  <Text fontSize="xs" color="purple.600">
                    <strong>التاريخ:</strong> {new Date(examDate).toLocaleDateString('ar-EG')}
                  </Text>
                </VStack>
              </Box>
            )}
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
            loadingText="جاري الإنشاء..."
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
            isDisabled={!name || !totalGrade || !examDate}
          >
            إنشاء الامتحان
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddExamModal; 