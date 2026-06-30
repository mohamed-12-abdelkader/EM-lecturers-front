import { useState, useEffect } from 'react'; // أضف useEffect
import { useParams } from 'react-router-dom'; // لجلب ID الطالب
import {
  Box,
  Text,
  Avatar,
  HStack,
  VStack,
  SimpleGrid,
  Badge,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Button,
  useDisclosure,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Center,
  Progress,
  Flex,
  Heading,
  useColorModeValue, // لاستخدام الثيم
  Divider,
  Tag, // بديل للـ Badge في بعض الأماكن
  Radio, // لـ submitted / not submitted
  RadioGroup,
  Stack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea, // لأي ملاحظات مستقبلية
  Spinner, // لـ loading state
} from '@chakra-ui/react';
import { FaCheckCircle, FaTimesCircle, FaRegCircle, FaAward, FaBookOpen, FaClipboardList, FaGraduationCap, FaUserGraduate, FaBell, FaChartBar } from 'react-icons/fa'; // أيقونات إضافية
import { MdEdit, MdDelete, MdAdd } from 'react-icons/md'; // أيقونات إضافية
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'; // ResponsiveContainer للرسوم البيانية
import { motion } from 'framer-motion';

// Motion components for animations
const MotionBox = motion(Box);
const MotionButton = motion(Button);

const StudentDetails = () => {
  const { id } = useParams(); // افتراض أن ID الطالب يأتي من الـ URL (مثال: /student/1)
  const toast = useToast();

  // ألوان الثيم
  const cardBg = useColorModeValue('white', 'gray.700');
  const sectionHeaderColor = useColorModeValue('teal.600', 'teal.300');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const highlightColor = useColorModeValue('teal.50', 'teal.800');

  // بيانات الطالب (يمكن جلبها من API بناءً على الـ ID)
  const [student, setStudent] = useState(null); // سيبدأ بـ null للإشارة إلى التحميل

  // حالة مستقلة للمحاضرات للحفاظ على حالتها
  const [lectures, setLectures] = useState([
    { id: 1, name: 'محاضرة 1', attended: true },
    { id: 2, name: 'محاضرة 2', attended: false },
    { id: 3, name: 'محاضرة 3', attended: true },
    { id: 4, name: 'محاضرة 4', attended: true },
    { id: 5, name: 'محاضرة 5', attended: false },
    { id: 6, name: 'محاضرة 6', attended: true },
    { id: 7, name: 'محاضرة 7', attended: false },
    { id: 8, name: 'محاضرة 8', attended: true },
  ]);

  // Simulate fetching student data based on ID
  useEffect(() => {
    // هنا يمكنك جلب البيانات من API أو قاعدة بيانات
    // حاليا نستخدم بيانات وهمية
    const dummyStudentData = {
      name: 'أحمد محمد',
      code: 'ST123',
      avatar: 'https://bit.ly/dan-abramov', // يمكن أن يكون رابط صورة حقيقي
      onlineLectures: 3,
      // 'attended' و 'missed' سيتم حسابهما من 'lectures'
      submittedAssignments: 2,
      totalAssignments: 4,
      exams: [
        { name: 'امتحان 1', score: 18, total: 20 },
        { name: 'امتحان 2', score: 15, total: 20 },
      ],
      assignments: [
        { id: 1, name: 'واجب 1', score: 8, total: 10, submitted: true, date: '2025-04-10' },
        { id: 2, name: 'واجب 2', score: 0, total: 10, submitted: false, date: '' }, // تاريخ فارغ لغير المسلم
        { id: 3, name: 'واجب 3', score: 9, total: 10, submitted: true, date: '2025-04-12' },
        { id: 4, name: 'واجب 4', score: 0, total: 10, submitted: false, date: '' },
      ],
      // Add any other student specific data here
    };
    setStudent(dummyStudentData);
  }, [id]); // أعد تشغيل عند تغيير ID الطالب

  // حالات الـ Modals
  const { isOpen: isExamOpen, onOpen: onExamOpen, onClose: onExamClose } = useDisclosure();
  const { isOpen: isEditExamOpen, onOpen: onEditExamOpen, onClose: onEditExamClose } = useDisclosure();
  const { isOpen: isAssignmentOpen, onOpen: onAssignmentOpen, onClose: onAssignmentClose } = useDisclosure();

  // حالات لإضافة/تعديل البيانات
  const [newExam, setNewExam] = useState({ name: '', score: 0, total: 20 });
  const [editExam, setEditExam] = useState(null); // الامتحان الذي يتم تعديله
  const [newAssignment, setNewAssignment] = useState({ name: '', score: 0, total: 10, submitted: false, date: '' });

  // حساب المحاضرات الحاضرة والغائبة ديناميكياً
  const attendedLecturesCount = lectures.filter(lec => lec.attended).length;
  const missedLecturesCount = lectures.filter(lec => !lec.attended).length;

  // Toggle lecture attendance
  const toggleLectureAttendance = (lectureId) => {
    setLectures((prevLectures) =>
      prevLectures.map((lec) =>
        lec.id === lectureId ? { ...lec, attended: !lec.attended } : lec
      )
    );
    toast({
      title: 'تم تحديث الحضور',
      status: 'success',
      duration: 1500,
      isClosable: true,
      position: 'top-right',
    });
  };

  // Add new exam
  const addExam = () => {
    if (!newExam.name || newExam.score < 0 || newExam.total <= 0 || newExam.score > newExam.total) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال بيانات امتحان صحيحة.',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }
    setStudent((prev) => ({
      ...prev,
      exams: [...prev.exams, newExam],
    }));
    setNewExam({ name: '', score: 0, total: 20 });
    onExamClose();
    toast({
      title: 'تم إضافة الامتحان',
      status: 'success',
      duration: 1500,
      isClosable: true,
      position: 'top-right',
    });
  };

  // Handle edit exam click
  const handleEditExam = (exam) => {
    setEditExam({ ...exam }); // إنشاء نسخة لتجنب التعديل المباشر
    onEditExamOpen();
  };

  // Update exam
  const updateExam = () => {
    if (!editExam.name || editExam.score < 0 || editExam.total <= 0 || editExam.score > editExam.total) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال بيانات امتحان صحيحة.',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }
    setStudent((prev) => ({
      ...prev,
      exams: prev.exams.map((ex) => (ex.name === editExam.name ? editExam : ex)), // يجب أن يكون الاسم فريدًا
    }));
    setEditExam(null);
    onEditExamClose();
    toast({
      title: 'تم تعديل الامتحان',
      status: 'success',
      duration: 1500,
      isClosable: true,
      position: 'top-right',
    });
  };

  // Delete exam
  const deleteExam = (name) => {
    setStudent((prev) => ({
      ...prev,
      exams: prev.exams.filter((ex) => ex.name !== name),
    }));
    toast({
      title: 'تم حذف الامتحان',
      status: 'success',
      duration: 1500,
      isClosable: true,
      position: 'top-right',
    });
  };

  // Add new assignment
  const addAssignment = () => {
    if (!newAssignment.name || newAssignment.total <= 0 || newAssignment.score > newAssignment.total) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال بيانات واجب صحيحة.',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }
    setStudent((prev) => ({
      ...prev,
      assignments: [
        ...prev.assignments,
        {
          id: prev.assignments.length > 0 ? Math.max(...prev.assignments.map(a => a.id)) + 1 : 1, // Generate unique ID
          ...newAssignment,
          date: newAssignment.submitted ? new Date().toISOString().split('T')[0] : '-',
        },
      ],
      // تحديث هذه القيم بشكل ديناميكي من خلال computed properties أو useEffect
      // submittedAssignments: newAssignment.submitted ? prev.submittedAssignments + 1 : prev.submittedAssignments,
      // totalAssignments: prev.totalAssignments + 1,
    }));
    setNewAssignment({ name: '', score: 0, total: 10, submitted: false, date: '' });
    onAssignmentClose();
    toast({
      title: 'تم إضافة الواجب',
      status: 'success',
      duration: 1500,
      isClosable: true,
      position: 'top-right',
    });
  };

  // Delete assignment
  const deleteAssignment = (idToDelete) => {
    setStudent((prev) => ({
      ...prev,
      assignments: prev.assignments.filter((ass) => ass.id !== idToDelete),
      // تحديث هذه القيم بشكل ديناميكي من خلال computed properties أو useEffect
      // submittedAssignments: assignment.submitted ? prev.submittedAssignments - 1 : prev.submittedAssignments,
      // totalAssignments: prev.totalAssignments - 1,
    }));
    toast({
      title: 'تم حذف الواجب',
      status: 'success',
      duration: 1500,
      isClosable: true,
      position: 'top-right',
    });
  };

  // Send report to guardian
  const sendReport = () => {
    toast({
      title: 'تم إرسال التقرير',
      description: 'تم إرسال تقرير الطالب إلى ولي الأمر بنجاح.',
      status: 'success',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
    });
  };

  // Chart data
  const attendanceData = [
    { name: 'حاضر', value: attendedLecturesCount },
    { name: 'غائب', value: missedLecturesCount },
  ];

  // يجب حساب submittedAssignments و totalAssignments ديناميكيًا من بيانات الواجبات
  const currentSubmittedAssignments = student?.assignments.filter(a => a.submitted).length || 0;
  const currentTotalAssignments = student?.assignments.length || 0;

  const assignmentData = [
    { name: 'تم التسليم', value: currentSubmittedAssignments },
    { name: 'متبقي', value: currentTotalAssignments - currentSubmittedAssignments },
  ];

  // ألوان للرسوم البيانية
  const PIE_COLORS = ['#16a8f0', '#FF6B6B']; // حضور/غياب
  const BAR_COLOR = '#00C4B4'; // واجبات

  if (!student) {
    return (
      <Center height="calc(100vh - 80px)" flexDirection="column">
        <Spinner size="xl" color="teal.500" thickness="4px" speed="0.65s" emptyColor="gray.200" />
        <Text mt={4} fontSize="xl" color="gray.600">جاري تحميل بيانات الطالب...</Text>
      </Center>
    );
  }

  return (
    <Center>
      <Box p={{ base: 4, md: 8 }} maxW="1400px" w="100%" my={{ base: '80px', md: '100px' }} bg={useColorModeValue('gray.50', 'gray.800')} borderRadius="2xl" boxShadow="2xl">
        <VStack spacing={8} align="stretch">
          {/* Student Info Section */}
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            p={6}
            bg={cardBg}
            borderRadius="xl"
            boxShadow="lg"
          >
            <HStack spacing={{ base: 4, md: 8 }} align="center" wrap={{ base: 'wrap', md: 'nowrap' }}>
              <Avatar name={student.name} src={student.avatar} size={{ base: 'xl', md: '2xl' }} border="4px solid" borderColor="teal.500" />
              <VStack align={{ base: 'center', md: 'start' }} spacing={2} flex={1}>
                <Heading as="h1" size={{ base: 'xl', md: '2xl' }} color={sectionHeaderColor} textAlign={{ base: 'center', md: 'start' }} fontWeight="extrabold">
                  {student.name}
                </Heading>
                <Text fontSize={{ base: 'md', md: 'lg' }} color={textColor} fontWeight="medium">
                  كود الطالب: <Badge colorScheme="blue" fontSize={{ base: 'md', md: 'lg' }} px={3} py={1} borderRadius="full">{student.code}</Badge>
                </Text>
                <HStack spacing={4} wrap="wrap" justifyContent={{ base: 'center', md: 'start' }}>
                  <Tag size="lg" colorScheme="green" variant="solid" px={4} py={2} borderRadius="full">
                    <Icon as={FaCheckCircle} mr={2} /> حضر: {attendedLecturesCount} محاضرة
                  </Tag>
                  <Tag size="lg" colorScheme="red" variant="solid" px={4} py={2} borderRadius="full">
                    <Icon as={FaTimesCircle} mr={2} /> غاب: {missedLecturesCount} محاضرة
                  </Tag>
                  <Tag size="lg" colorScheme="purple" variant="solid" px={4} py={2} borderRadius="full">
                    <Icon as={FaBookOpen} mr={2} /> أونلاين: {student.onlineLectures} محاضرة
                  </Tag>
                </HStack>
              </VStack>
            </HStack>
          </MotionBox>

          {/* Charts Section */}
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            p={6}
            bg={cardBg}
            borderRadius="xl"
            boxShadow="lg"
          >
            <Heading as="h2" size="lg" mb={6} color={sectionHeaderColor} textAlign="center" borderBottom="2px solid" borderColor={borderColor} pb={3}>
              <Icon as={FaChartBar} mr={2} color="orange.400" /> إحصائيات الأداء
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
              <VStack align="center" p={4} bg={highlightColor} borderRadius="lg">
                <Text fontSize="xl" fontWeight="bold" mb={4} color={textColor}>الحضور والغياب</Text>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </VStack>
              <VStack align="center" p={4} bg={highlightColor} borderRadius="lg">
                <Text fontSize="xl" fontWeight="bold" mb={4} color={textColor}>الواجبات المسلمة</Text>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={assignmentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                    <XAxis dataKey="name" stroke={textColor} />
                    <YAxis stroke={textColor} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                    <Legend iconType="rect" />
                    <Bar dataKey="value" fill={BAR_COLOR} radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </VStack>
            </SimpleGrid>
          </MotionBox>

          {/* Lectures Section */}
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            p={6}
            bg={cardBg}
            borderRadius="xl"
            boxShadow="lg"
          >
            <Heading as="h2" size="lg" mb={6} color={sectionHeaderColor} textAlign="center" borderBottom="2px solid" borderColor={borderColor} pb={3}>
              <Icon as={FaBookOpen} mr={2} color="teal.400" /> جدول المحاضرات
            </Heading>
            <SimpleGrid columns={{ base: 2, md: 4, lg: 5 }} spacing={6}>
              {lectures.map((lec) => (
                <MotionBox
                  key={lec.id}
                  p={4}
                  borderWidth="1px"
                  borderRadius="lg"
                  bg={lec.attended ? 'green.50' : 'red.50'}
                  borderColor={lec.attended ? 'green.200' : 'red.200'}
                  textAlign="center"
                  cursor="pointer"
                  onClick={() => toggleLectureAttendance(lec.id)}
                  whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Text fontWeight="bold" fontSize="lg" color={lec.attended ? 'green.700' : 'red.700'} mb={1}>{lec.name}</Text>
                  <Text fontSize="sm" color="gray.500" mb={2}>{lec.attended ? 'حاضر' : 'غائب'}</Text>
                  <Icon
                    as={lec.attended ? FaCheckCircle : FaTimesCircle}
                    color={lec.attended ? 'green.500' : 'red.500'}
                    boxSize={8}
                  />
                </MotionBox>
              ))}
            </SimpleGrid>
          </MotionBox>

          {/* Assignments Section */}
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            p={6}
            bg={cardBg}
            borderRadius="xl"
            boxShadow="lg"
          >
            <Flex justify="space-between" align="center" mb={6} borderBottom="2px solid" borderColor={borderColor} pb={3}>
              <Heading as="h2" size="lg" color={sectionHeaderColor}>
                <Icon as={FaClipboardList} mr={2} color="orange.400" /> الواجبات
              </Heading>
              <MotionButton
                leftIcon={<MdAdd />}
                colorScheme="teal"
                onClick={onAssignmentOpen}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                size="md"
                borderRadius="full"
              >
                إضافة واجب
              </MotionButton>
            </Flex>
            <VStack spacing={2} align="stretch" mb={6}>
                <HStack justifyContent="space-between">
                    <Text fontWeight="semibold" color={textColor}>
                        إجمالي الواجبات: <Text as="span" color={sectionHeaderColor}>{currentTotalAssignments}</Text>
                    </Text>
                    <Text fontWeight="semibold" color={textColor}>
                        تم التسليم: <Text as="span" color="green.500">{currentSubmittedAssignments}</Text>
                    </Text>
                    <Text fontWeight="semibold" color={textColor}>
                        متبقي: <Text as="span" color="red.500">{currentTotalAssignments - currentSubmittedAssignments}</Text>
                    </Text>
                </HStack>
                <Progress
                    value={currentTotalAssignments > 0 ? (currentSubmittedAssignments / currentTotalAssignments) * 100 : 0}
                    size="lg"
                    colorScheme="blue"
                    borderRadius="full"
                    hasStripe
                    isAnimated
                />
            </VStack>
            <Table variant="simple" size="md">
              <Thead bg={highlightColor}>
                <Tr>
                  <Th color={sectionHeaderColor}>الواجب</Th>
                  <Th color={sectionHeaderColor}>الدرجة</Th>
                  <Th color={sectionHeaderColor}>من</Th>
                  <Th color={sectionHeaderColor}>الحالة</Th>
                  <Th color={sectionHeaderColor}>تاريخ التسليم</Th>
                  <Th color={sectionHeaderColor} textAlign="center">إجراءات</Th>
                </Tr>
              </Thead>
              <Tbody>
                {currentTotalAssignments === 0 ? (
                    <Tr>
                        <Td colSpan={6} textAlign="center" py={4}>
                            <Text color="gray.500">لا توجد واجبات مسجلة بعد.</Text>
                        </Td>
                    </Tr>
                ) : (
                    student.assignments.map((assignment) => (
                        <Tr key={assignment.id} _hover={{ bg: highlightColor }}>
                            <Td>{assignment.name}</Td>
                            <Td>{assignment.score}</Td>
                            <Td>{assignment.total}</Td>
                            <Td>
                                <Badge colorScheme={assignment.submitted ? 'green' : 'red'} px={3} py={1} borderRadius="full">
                                    {assignment.submitted ? 'تم التسليم' : 'لم يتم التسليم'}
                                </Badge>
                            </Td>
                            <Td color={textColor}>{assignment.date === '-' ? 'غير محدد' : assignment.date}</Td>
                            <Td textAlign="center">
                                <MotionButton
                                    size="sm"
                                    leftIcon={<MdDelete />}
                                    colorScheme="red"
                                    onClick={() => deleteAssignment(assignment.id)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    borderRadius="md"
                                >
                                    حذف
                                </MotionButton>
                            </Td>
                        </Tr>
                    ))
                )}
              </Tbody>
            </Table>
          </MotionBox>

          {/* Exams Section */}
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            p={6}
            bg={cardBg}
            borderRadius="xl"
            boxShadow="lg"
          >
            <Flex justify="space-between" align="center" mb={6} borderBottom="2px solid" borderColor={borderColor} pb={3}>
              <Heading as="h2" size="lg" color={sectionHeaderColor}>
                <Icon as={FaGraduationCap} mr={2} color="blue.400" /> نتائج الامتحانات
              </Heading>
              <MotionButton
                leftIcon={<MdAdd />}
                colorScheme="teal"
                onClick={onExamOpen}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                size="md"
                borderRadius="full"
              >
                إضافة امتحان
              </MotionButton>
            </Flex>
            <Table variant="simple" size="md">
              <Thead bg={highlightColor}>
                <Tr>
                  <Th color={sectionHeaderColor}>الامتحان</Th>
                  <Th color={sectionHeaderColor}>الدرجة</Th>
                  <Th color={sectionHeaderColor}>من</Th>
                  <Th color={sectionHeaderColor} textAlign="center">تعديل</Th>
                  <Th color={sectionHeaderColor} textAlign="center">حذف</Th>
                </Tr>
              </Thead>
              <Tbody>
                {student.exams.length === 0 ? (
                    <Tr>
                        <Td colSpan={5} textAlign="center" py={4}>
                            <Text color="gray.500">لا توجد امتحانات مسجلة بعد.</Text>
                        </Td>
                    </Tr>
                ) : (
                    student.exams.map((exam, idx) => (
                        <Tr key={idx} _hover={{ bg: highlightColor }}>
                            <Td>{exam.name}</Td>
                            <Td>{exam.score}</Td>
                            <Td>{exam.total}</Td>
                            <Td textAlign="center">
                                <MotionButton
                                    size="sm"
                                    leftIcon={<MdEdit />}
                                    colorScheme="blue"
                                    onClick={() => handleEditExam(exam)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    borderRadius="md"
                                >
                                    تعديل
                                </MotionButton>
                            </Td>
                            <Td textAlign="center">
                                <MotionButton
                                    size="sm"
                                    leftIcon={<MdDelete />}
                                    colorScheme="red"
                                    onClick={() => deleteExam(exam.name)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    borderRadius="md"
                                >
                                    حذف
                                </MotionButton>
                            </Td>
                        </Tr>
                    ))
                )}
              </Tbody>
            </Table>
          </MotionBox>

          {/* Send Report Button */}
          <MotionButton
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            colorScheme="purple"
            onClick={sendReport}
            w="full"
            py={7}
            fontSize="lg"
            leftIcon={<FaBell />}
            whileHover={{ scale: 1.02, boxShadow: "0 8px 16px rgba(0,0,0,0.1)" }}
            whileTap={{ scale: 0.98 }}
            borderRadius="full"
          >
            إرسال تقرير مفصل إلى ولي الأمر
          </MotionButton>
        </VStack>

        {/* Add Exam Modal */}
        <Modal isOpen={isExamOpen} onClose={onExamClose} isCentered>
          <ModalOverlay bg="blackAlpha.600" />
          <ModalContent bg={cardBg} borderRadius="xl" boxShadow="2xl">
            <ModalHeader borderBottom="1px solid" borderColor={borderColor} pb={4} fontSize="2xl" color={sectionHeaderColor}>
              إضافة امتحان جديد
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody p={6}>
              <FormControl mb={4} isRequired>
                <FormLabel color={textColor}>اسم الامتحان</FormLabel>
                <Input
                  value={newExam.name}
                  onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                  placeholder="مثال: امتحان منتصف الفصل"
                  bg={useColorModeValue('gray.100', 'gray.600')}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'teal.400' }}
                />
              </FormControl>
              <FormControl mb={4} isRequired>
                <FormLabel color={textColor}>الدرجة</FormLabel>
                <NumberInput
                  min={0}
                  max={newExam.total || 100} // أقصى قيمة هي الدرجة الكلية
                  value={newExam.score}
                  onChange={(valueAsString, valueAsNumber) => setNewExam({ ...newExam, score: valueAsNumber })}
                >
                  <NumberInputField bg={useColorModeValue('gray.100', 'gray.600')} borderColor={borderColor} _focus={{ borderColor: 'teal.400' }} />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <FormControl isRequired>
                <FormLabel color={textColor}>الدرجة الكلية</FormLabel>
                <NumberInput
                  min={1} // لا يمكن أن تكون الدرجة الكلية صفر أو أقل
                  value={newExam.total}
                  onChange={(valueAsString, valueAsNumber) => setNewExam({ ...newExam, total: valueAsNumber })}
                >
                  <NumberInputField bg={useColorModeValue('gray.100', 'gray.600')} borderColor={borderColor} _focus={{ borderColor: 'teal.400' }} />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </ModalBody>
            <ModalFooter borderTop="1px solid" borderColor={borderColor} pt={4}>
              <Button colorScheme="blue" mr={3} onClick={addExam} px={6} borderRadius="lg">
                إضافة
              </Button>
              <Button variant="ghost" onClick={onExamClose} px={6} borderRadius="lg">
                إلغاء
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Edit Exam Modal */}
        <Modal isOpen={isEditExamOpen} onClose={onEditExamClose} isCentered>
          <ModalOverlay bg="blackAlpha.600" />
          <ModalContent bg={cardBg} borderRadius="xl" boxShadow="2xl">
            <ModalHeader borderBottom="1px solid" borderColor={borderColor} pb={4} fontSize="2xl" color={sectionHeaderColor}>
              تعديل الامتحان
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody p={6}>
              {editExam && (
                <>
                  <FormControl mb={4} isRequired>
                    <FormLabel color={textColor}>اسم الامتحان</FormLabel>
                    <Input
                      value={editExam.name}
                      onChange={(e) => setEditExam({ ...editExam, name: e.target.value })}
                      bg={useColorModeValue('gray.100', 'gray.600')}
                      borderColor={borderColor}
                      _focus={{ borderColor: 'teal.400' }}
                    />
                  </FormControl>
                  <FormControl mb={4} isRequired>
                    <FormLabel color={textColor}>الدرجة</FormLabel>
                    <NumberInput
                      min={0}
                      max={editExam.total || 100}
                      value={editExam.score}
                      onChange={(valueAsString, valueAsNumber) => setEditExam({ ...editExam, score: valueAsNumber })}
                    >
                      <NumberInputField bg={useColorModeValue('gray.100', 'gray.600')} borderColor={borderColor} _focus={{ borderColor: 'teal.400' }} />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel color={textColor}>الدرجة الكلية</FormLabel>
                    <NumberInput
                      min={1}
                      value={editExam.total}
                      onChange={(valueAsString, valueAsNumber) => setEditExam({ ...editExam, total: valueAsNumber })}
                    >
                      <NumberInputField bg={useColorModeValue('gray.100', 'gray.600')} borderColor={borderColor} _focus={{ borderColor: 'teal.400' }} />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </>
              )}
            </ModalBody>
            <ModalFooter borderTop="1px solid" borderColor={borderColor} pt={4}>
              <Button colorScheme="blue" mr={3} onClick={updateExam} px={6} borderRadius="lg">
                حفظ
              </Button>
              <Button variant="ghost" onClick={onEditExamClose} px={6} borderRadius="lg">
                إلغاء
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Add Assignment Modal */}
        <Modal isOpen={isAssignmentOpen} onClose={onAssignmentClose} isCentered>
          <ModalOverlay bg="blackAlpha.600" />
          <ModalContent bg={cardBg} borderRadius="xl" boxShadow="2xl">
            <ModalHeader borderBottom="1px solid" borderColor={borderColor} pb={4} fontSize="2xl" color={sectionHeaderColor}>
              إضافة واجب جديد
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody p={6}>
              <FormControl mb={4} isRequired>
                <FormLabel color={textColor}>اسم الواجب</FormLabel>
                <Input
                  value={newAssignment.name}
                  onChange={(e) => setNewAssignment({ ...newAssignment, name: e.target.value })}
                  placeholder="مثال: واجب الفصل الأول"
                  bg={useColorModeValue('gray.100', 'gray.600')}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'teal.400' }}
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel color={textColor}>الدرجة</FormLabel>
                <NumberInput
                  min={0}
                  max={newAssignment.total || 100}
                  value={newAssignment.score}
                  onChange={(valueAsString, valueAsNumber) => setNewAssignment({ ...newAssignment, score: valueAsNumber })}
                >
                  <NumberInputField bg={useColorModeValue('gray.100', 'gray.600')} borderColor={borderColor} _focus={{ borderColor: 'teal.400' }} />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <FormControl mb={4} isRequired>
                <FormLabel color={textColor}>الدرجة الكلية</FormLabel>
                <NumberInput
                  min={1}
                  value={newAssignment.total}
                  onChange={(valueAsString, valueAsNumber) => setNewAssignment({ ...newAssignment, total: valueAsNumber })}
                >
                  <NumberInputField bg={useColorModeValue('gray.100', 'gray.600')} borderColor={borderColor} _focus={{ borderColor: 'teal.400' }} />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
              <FormControl as="fieldset">
                <FormLabel as="legend" color={textColor}>الحالة</FormLabel>
                <RadioGroup onChange={(val) => setNewAssignment({ ...newAssignment, submitted: val === 'true' })} value={newAssignment.submitted.toString()}>
                  <Stack direction="row" spacing={5}>
                    <Radio value="true" colorScheme="green">تم التسليم</Radio>
                    <Radio value="false" colorScheme="red">لم يتم التسليم</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>
            </ModalBody>
            <ModalFooter borderTop="1px solid" borderColor={borderColor} pt={4}>
              <Button colorScheme="blue" mr={3} onClick={addAssignment} px={6} borderRadius="lg">
                إضافة
              </Button>
              <Button variant="ghost" onClick={onAssignmentClose} px={6} borderRadius="lg">
                إلغاء
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Center>
  );
};

export default StudentDetails;