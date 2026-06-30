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
  VStack,
  HStack,
  Text,
  useToast,
  Box,
  Badge,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  SimpleGrid,
  Divider,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { FaFileAlt, FaStar, FaCalendarAlt, FaUsers, FaCheck, FaTimes } from 'react-icons/fa';
import { MdAdd, MdEdit } from 'react-icons/md';
import baseUrl from '../../api/baseUrl';

const ExamGradesModal = ({ isOpen, onClose, groupId, groupName, students = [] }) => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [loadingExams, setLoadingExams] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [studentGrades, setStudentGrades] = useState({});
  const [selectedStudent, setSelectedStudent] = useState('');
  const [grade, setGrade] = useState('');
  const [notes, setNotes] = useState('');
  const [isAddingGrade, setIsAddingGrade] = useState(false);
  const toast = useToast();

  // جلب الامتحانات عند فتح الموديل
  useEffect(() => {
    if (isOpen && groupId) {
      fetchExams();
      console.log('=== معلومات الطلاب المتاحة ===');
      console.log('Students:', students);
      console.log('Students count:', students.length);
      students.forEach((student, index) => {
        console.log(`Student ${index + 1}:`, {
          id: student.id,
          name: student.student_name,
          id_type: typeof student.id
        });
      });
      console.log('=== نهاية معلومات الطلاب ===');
    }
  }, [isOpen, groupId, students]);

  // جلب الامتحانات
  const fetchExams = async () => {
    setLoadingExams(true);
    try {
      const token = localStorage.getItem('token');
      const response = await baseUrl.get(`/api/group-exams/group/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // البيانات تأتي في شكل { exams: [...] }
      setExams(response.data?.exams || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب الامتحانات",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingExams(false);
    }
  };

  // إضافة درجة للطالب
  const handleAddGrade = async () => {
    if (!selectedStudent || !grade || !selectedExam) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (isNaN(grade) || parseFloat(grade) < 0 || parseFloat(grade) > selectedExam.total_grade) {
      toast({
        title: "خطأ",
        description: `الدرجة يجب أن تكون بين 0 و ${selectedExam.total_grade}`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsAddingGrade(true);
    try {
      const token = localStorage.getItem('token');
      const gradeData = {
        student_id: 2,
        grade: Number(grade),
        notes: notes.trim()
      };

      // طباعة البيانات قبل الإرسال
      console.log('🔍 === البيانات قبل الإرسال ===');
      console.log('📋 البيانات الخام:');
      console.log('- selectedStudent:', selectedStudent);
      console.log('- grade:', grade);
      console.log('- notes:', notes);
      console.log('- selectedExam.id:', selectedExam.id);
      console.log('');
      console.log('📤 البيانات المحولة:');
      console.log('- student_id:', Number(selectedStudent));
      console.log('- grade:', Number(grade));
      console.log('- notes:', notes.trim());
      console.log('');
      console.log('📦 البيانات النهائية:');
      console.log(JSON.stringify(gradeData, null, 2));
      console.log('🔍 === نهاية البيانات قبل الإرسال ===');
      console.log('');
      console.log('🌐 === معلومات الطلب ===');
      console.log('URL:', `/api/group-exams/${selectedExam.id}/grades`);
      console.log('Method: POST');
      console.log('Headers:', {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      console.log('🌐 === نهاية معلومات الطلب ===');
      console.log('');

      const response = await baseUrl.post(
        `/api/group-exams/${selectedExam.id}/grades`,
        gradeData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Grade added successfully:', response.data);
      console.log('=== البيانات المرسلة للـ API ===');
      console.log('URL:', `/api/group-exams/${selectedExam.id}/grades`);
      console.log('Selected Student ID (raw):', selectedStudent);
      console.log('Selected Student ID (type):', typeof selectedStudent);
      console.log('Grade (raw):', grade);
      console.log('Grade (type):', typeof grade);
      console.log('Final Data:', gradeData);
      console.log('Data JSON:', JSON.stringify(gradeData, null, 2));
      console.log('Headers:', {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      console.log('=== نهاية البيانات ===');
      toast({
        title: "نجح",
        description: "تم إضافة الدرجة بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // تحديث حالة الدرجات المحلية
      setStudentGrades(prev => ({
        ...prev,
        [selectedStudent]: {
          grade: parseFloat(grade),
          notes: notes.trim(),
          examId: selectedExam.id
        }
      }));

      // إعادة تعيين الحقول
      setSelectedStudent('');
      setGrade('');
      setNotes('');
      
    } catch (error) {
      console.error('Error adding grade:', error);
      console.log('=== البيانات التي تم إرسالها (في حالة الخطأ) ===');
      console.log('URL:', `/api/group-exams/${selectedExam.id}/grades`);
      console.log('Data:', gradeData);
      console.log('Error Response:', error.response?.data);
      console.log('Error Status:', error.response?.status);
      console.log('=== نهاية البيانات ===');
      toast({
        title: "خطأ",
        description: error.response?.data?.message || "حدث خطأ في إضافة الدرجة",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAddingGrade(false);
    }
  };

  const resetForm = () => {
    setSelectedExam(null);
    setStudentGrades({});
    setSelectedStudent('');
    setGrade('');
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === parseInt(studentId));
    return student ? student.student_name : 'غير معروف';
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="6xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={3}>
            <Box p={2} bg="purple.100" borderRadius="lg">
              <FaStar color="#805AD5" size={20} />
            </Box>
            <VStack align="start" spacing={0}>
              <Text>إدارة درجات الامتحانات</Text>
              <Text fontSize="sm" color="gray.500" fontWeight="normal">
                {groupName}
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* قسم الامتحانات */}
            <Card>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <HStack justify="space-between">
                    <Text fontWeight="bold" fontSize="lg" color="purple.600">
                      امتحانات المجموعة
                    </Text>
                    {loadingExams && <Spinner size="sm" color="purple.500" />}
                  </HStack>

                  {loadingExams ? (
                    <Center py={8}>
                      <VStack spacing={3}>
                        <Spinner size="lg" color="purple.500" />
                        <Text>جاري تحميل الامتحانات...</Text>
                      </VStack>
                    </Center>
                  ) : exams.length === 0 ? (
                    <Alert status="info" borderRadius="xl">
                      <AlertIcon />
                      <Text>لا توجد امتحانات لهذه المجموعة</Text>
                    </Alert>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                      {exams.map((exam) => (
                        <Card
                          key={exam.id}
                          cursor="pointer"
                          border="2px"
                          borderColor={selectedExam?.id === exam.id ? "purple.500" : "gray.200"}
                          _hover={{ borderColor: "purple.300", transform: "translateY(-2px)" }}
                          transition="all 0.2s"
                          onClick={() => setSelectedExam(exam)}
                        >
                          <CardBody>
                            <VStack align="start" spacing={3}>
                              <HStack justify="space-between" w="full">
                                <Badge colorScheme="purple" variant="solid">
                                  امتحان
                                </Badge>
                                {selectedExam?.id === exam.id && (
                                  <FaCheck color="green" size={16} />
                                )}
                              </HStack>
                              
                              <Text fontWeight="bold" fontSize="md">
                                {exam.name}
                              </Text>
                              
                                                             <HStack spacing={4} fontSize="sm" color="gray.600">
                                 <HStack>
                                   <FaStar color="orange" size={14} />
                                   <Text>{exam.total_grade} درجة</Text>
                                 </HStack>
                                 <HStack>
                                   <FaCalendarAlt color="blue" size={14} />
                                   <Text>{formatDate(exam.exam_date)}</Text>
                                 </HStack>
                               </HStack>
                               
                               {/* معلومات إضافية إذا كانت متوفرة */}
                               {(exam.students_count !== undefined || exam.average_grade !== undefined) && (
                                 <HStack spacing={4} fontSize="xs" color="gray.500">
                                   {exam.students_count !== undefined && (
                                     <HStack>
                                       <FaUsers color="green" size={12} />
                                       <Text>{exam.students_count} طالب</Text>
                                     </HStack>
                                   )}
                                   {exam.average_grade !== undefined && (
                                     <HStack>
                                       <FaStar color="purple" size={12} />
                                       <Text>متوسط: {exam.average_grade}</Text>
                                     </HStack>
                                   )}
                                 </HStack>
                               )}
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </SimpleGrid>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* قسم إضافة الدرجات */}
            {selectedExam && (
              <Card>
                <CardBody>
                  <VStack align="stretch" spacing={6}>
                    <Box>
                      <Text fontWeight="bold" fontSize="lg" color="purple.600" mb={2}>
                        إضافة درجات - {selectedExam.name}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        الدرجة الكلية: {selectedExam.total_grade} درجة
                      </Text>
                    </Box>

                    <Divider />

                    {/* نموذج إضافة الدرجة */}
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <Box>
                        <Text fontWeight="semibold" mb={2}>اختر الطالب</Text>
                        <Select
                          value={selectedStudent}
                          onChange={(e) => {
                            console.log('=== اختيار الطالب ===');
                            console.log('Selected value:', e.target.value);
                            console.log('Selected value type:', typeof e.target.value);
                            setSelectedStudent(e.target.value);
                          }}
                          placeholder="اختر الطالب"
                          size="lg"
                          borderRadius="xl"
                        >
                          {students.map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.student_name}
                            </option>
                          ))}
                        </Select>
                      </Box>

                      <Box>
                        <Text fontWeight="semibold" mb={2}>الدرجة</Text>
                        <NumberInput
                          value={grade}
                          onChange={(value) => setGrade(value)}
                          min={0}
                          max={selectedExam.total_grade}
                          precision={1}
                          size="lg"
                          borderRadius="xl"
                        >
                          <NumberInputField 
                            placeholder={`0 - ${selectedExam.total_grade}`}
                            borderRadius="xl"
                          />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </Box>

                      <Box>
                        <Text fontWeight="semibold" mb={2}>ملاحظات</Text>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="ملاحظات إضافية..."
                          size="lg"
                          borderRadius="xl"
                          rows={1}
                        />
                      </Box>
                    </SimpleGrid>

                    <Button
                      leftIcon={<MdAdd />}
                      colorScheme="purple"
                      size="lg"
                      onClick={handleAddGrade}
                      isLoading={isAddingGrade}
                      loadingText="جاري الإضافة..."
                      borderRadius="xl"
                      bgGradient="linear(135deg, purple.500 0%, pink.500 100%)"
                      _hover={{ 
                        bgGradient: "linear(135deg, purple.600 0%, pink.600 100%)",
                        transform: "translateY(-1px)"
                      }}
                      isDisabled={!selectedStudent || !grade}
                    >
                      إضافة الدرجة
                    </Button>

                    {/* عرض الدرجات المضافة */}
                    {Object.keys(studentGrades).length > 0 && (
                      <Box>
                        <Text fontWeight="bold" fontSize="md" mb={3}>
                          الدرجات المضافة:
                        </Text>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>الطالب</Th>
                              <Th>الدرجة</Th>
                              <Th>ملاحظات</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {Object.entries(studentGrades).map(([studentId, gradeData]) => (
                              <Tr key={studentId}>
                                <Td>{getStudentName(studentId)}</Td>
                                <Td>
                                  <Badge colorScheme="green" variant="solid">
                                    {gradeData.grade}
                                  </Badge>
                                </Td>
                                <Td>
                                  <Text fontSize="sm" color="gray.600">
                                    {gradeData.notes || '-'}
                                  </Text>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* معلومات إضافية */}
            <Box 
              bg="blue.50" 
              p={4} 
              borderRadius="xl" 
              border="1px" 
              borderColor="blue.200"
            >
              <Text fontSize="sm" color="blue.700" fontWeight="medium">
                💡 تعليمات:
              </Text>
              <VStack align="start" spacing={1} mt={2}>
                <Text fontSize="xs" color="blue.600">
                  • اختر الامتحان أولاً من القائمة أعلاه
                </Text>
                <Text fontSize="xs" color="blue.600">
                  • اختر الطالب وأدخل درجته وملاحظاتك
                </Text>
                <Text fontSize="xs" color="blue.600">
                  • يمكنك إضافة درجات لعدة طلاب في نفس الامتحان
                </Text>
                <Text fontSize="xs" color="blue.600">
                  • الدرجة يجب أن تكون بين 0 والدرجة الكلية للامتحان
                </Text>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            إغلاق
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ExamGradesModal; 