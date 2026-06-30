import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Spinner,
  Center,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  SimpleGrid,
  Avatar,
  Badge,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Container,
  Icon,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  FormControl,
  FormLabel,
  useDisclosure,
  Stack
} from '@chakra-ui/react';
import { FaArrowLeft, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaUser, FaPhone, FaChartLine, FaCalendarCheck, FaCalendarTimes, FaStar, FaFileAlt } from 'react-icons/fa';
import { MdAttachMoney, MdLocationOn, MdSchool, MdAdd } from 'react-icons/md';
import baseUrl from '../../api/baseUrl';

const StudentDetailsPage = () => {
  const { groupId, studentId } = useParams();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const toast = useToast();
  
  // موديل إضافة درجة
  const { isOpen: isAddGradeModalOpen, onOpen: onAddGradeModalOpen, onClose: onAddGradeModalClose } = useDisclosure();
  const [examName, setExamName] = useState('');
  const [grade, setGrade] = useState('');
  const [notes, setNotes] = useState('');
  const [isAddingGrade, setIsAddingGrade] = useState(false);

  // بيانات درجات الطالب
  const [studentGrades, setStudentGrades] = useState(null);
  const [loadingGrades, setLoadingGrades] = useState(false);

  // ألوان الثيم
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const primaryColor = useColorModeValue('blue.500', 'blue.300');
  const secondaryColor = useColorModeValue('purple.500', 'purple.300');
  const accentColor = useColorModeValue('teal.500', 'teal.300');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // جلب بيانات الطالب (نفس التطبيق: GET center-groups/:groupId/students/:studentId)
  const fetchStudentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await baseUrl.get(
        `/api/center-groups/${groupId}/students/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response.data;
      const attendance = data.attendance || [];
      const presentDates = attendance.filter((a) => a.status === 'present').map((a) => ({
        date: a.date,
        day_name: new Date(a.date).toLocaleDateString('ar-EG', { weekday: 'long' }),
      }));
      const absentDates = attendance.filter((a) => a.status === 'absent').map((a) => ({
        date: a.date,
        day_name: new Date(a.date).toLocaleDateString('ar-EG', { weekday: 'long' }),
      }));
      setStudentData({
        student_info: data.student
          ? { name: data.student.name, phone: data.student.phone, parent_phone: data.student.parent_phone }
          : {},
        student: data.student,
        group: data.group,
        membership: data.membership,
        statistics: data.statistics || {},
        attendance: data.attendance || [],
        attendance_details: {
          present_dates: presentDates,
          absent_dates: absentDates,
        },
      });
    } catch (err) {
      console.error('Error fetching student data:', err);
      setError('فشل في جلب بيانات الطالب');
      toast({
        title: 'خطأ',
        description: err.response?.data?.message || 'فشل في جلب بيانات الطالب',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // جلب درجات الطالب
  const fetchStudentGrades = async () => {
    setLoadingGrades(true);
    try {
      const token = localStorage.getItem('token');
      const response = await baseUrl.get(
        `//student/${studentId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setStudentGrades(response.data);
    } catch (err) {
      console.error('Error fetching student grades:', err);
      // لا نعرض خطأ هنا لأن درجات الطالب ليست أساسية
    } finally {
      setLoadingGrades(false);
    }
  };

  useEffect(() => {
    if (groupId && studentId) {
      fetchStudentData();
      fetchStudentGrades();
    }
  }, [groupId, studentId, selectedMonth, selectedYear]);

  // تغيير الشهر/السنة
  const handleMonthChange = (e) => {
    setSelectedMonth(parseInt(e.target.value));
  };

  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };

  // إضافة درجة امتحان
  const handleAddGrade = async () => {
    if (!examName.trim() || !grade) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (isNaN(grade) || parseFloat(grade) < 0 || parseFloat(grade) > 100) {
      toast({
        title: "خطأ",
        description: "الدرجة يجب أن تكون بين 0 و 100",
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
        exam_name: examName.trim(),
        student_id: parseInt(studentId),
        grade: Number(grade),
        notes: notes.trim()
      };

      console.log('=== إضافة درجة امتحان ===');
      console.log('Data:', gradeData);
      console.log('URL:', '/api/student-grades/');

      const response = await baseUrl.post('/api/student-grades/', gradeData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Grade added successfully:', response.data);
      
      toast({
        title: "نجح",
        description: "تم إضافة الدرجة بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // إعادة تعيين الحقول
      setExamName('');
      setGrade('');
      setNotes('');
      onAddGradeModalClose();
      
      // إعادة جلب درجات الطالب
      fetchStudentGrades();
      
    } catch (error) {
      console.error('Error adding grade:', error);
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

  // إعادة تعيين نموذج إضافة الدرجة
  const resetGradeForm = () => {
    setExamName('');
    setGrade('');
    setNotes('');
  };

  const handleCloseGradeModal = () => {
    resetGradeForm();
    onAddGradeModalClose();
  };

  // تنسيق التاريخ
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // تنسيق التاريخ والوقت
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // الحصول على لون نسبة الحضور
  const getAttendanceRateColor = (rate) => {
    if (rate >= 90) return 'green';
    if (rate >= 75) return 'orange';
    return 'red';
  };

  if (loading) {
    return (
      <Box p={6} className="mt-[80px]" bg={bgColor} minH="100vh">
        <Container maxW="container.xl">
          <Center py={20}>
            <VStack spacing={6}>
              <Spinner size="xl" color={primaryColor} thickness="4px" />
              <Text fontSize="lg" color={textColor} fontWeight="medium">
                جاري تحميل بيانات الطالب...
              </Text>
            </VStack>
          </Center>
        </Container>
      </Box>
    );
  }

  if (error || !studentData) {
    return (
      <Box p={6} className="mt-[80px]" bg={bgColor} minH="100vh">
        <Container maxW="container.xl">
          <Alert status="error" borderRadius="2xl" shadow="lg">
            <AlertIcon />
            <Text fontWeight="semibold">{error || 'حدث خطأ في تحميل بيانات الطالب'}</Text>
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box p={6} className="mt-[80px]" bg={bgColor} minH="100vh">
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          {/* Header Section */}
          <Card 
            bg={cardBg} 
            shadow="xl" 
            borderRadius="2xl" 
            p={6}
            border="1px"
            borderColor={borderColor}
          >
            <VStack spacing={6}>
              {/* Back Button */}
              <Stack direction={{ base: 'column', md: 'row' }} w="full" justify="space-between" align="center" spacing={4}>
                <Button
                  as={Link}
                  to={`/group_details/${groupId}`}
                  leftIcon={<FaArrowLeft />}
                  variant="ghost"
                  colorScheme="blue"
                  size={{ base: 'md', md: 'lg' }}
                  borderRadius="xl"
                >
                  العودة للمجموعة
                </Button>
                
                {/* Month/Year Selector */}
                <HStack spacing={3} flexWrap="wrap" justify="center">
                  <Select
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    size={{ base: 'sm', md: 'md' }}
                    borderRadius="xl"
                    w={{ base: '120px', md: '120px' }}
                  >
                    <option value={1}>يناير</option>
                    <option value={2}>فبراير</option>
                    <option value={3}>مارس</option>
                    <option value={4}>أبريل</option>
                    <option value={5}>مايو</option>
                    <option value={6}>يونيو</option>
                    <option value={7}>يوليو</option>
                    <option value={8}>أغسطس</option>
                    <option value={9}>سبتمبر</option>
                    <option value={10}>أكتوبر</option>
                    <option value={11}>نوفمبر</option>
                    <option value={12}>ديسمبر</option>
                  </Select>
                  
                  <Select
                    value={selectedYear}
                    onChange={handleYearChange}
                    size={{ base: 'sm', md: 'md' }}
                    borderRadius="xl"
                    w={{ base: '100px', md: '100px' }}
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </Select>

                  {/* زر إضافة درجة */}
                  <Button
                    leftIcon={<MdAdd />}
                    colorScheme="purple"
                    size={{ base: 'sm', md: 'md' }}
                    onClick={onAddGradeModalOpen}
                    borderRadius="xl"
                    bgGradient="linear(135deg, purple.500 0%, pink.500 100%)"
                    _hover={{ 
                      bgGradient: "linear(135deg, purple.600 0%, pink.600 100%)",
                      transform: "translateY(-1px)"
                    }}
                    _active={{ transform: 'translateY(0)' }}
                    transition="all 0.2s"
                    fontWeight="bold"
                  >
                    إضافة درجة
                  </Button>
                </HStack>
              </Stack>

              {/* Student Info */}
              <Stack direction={{ base: 'column', md: 'row' }} spacing={6} w="full" justify="center" align="center">
                <Avatar
                  size={{ base: 'xl', md: '2xl' }}
                  name={studentData.student_info.name}
                  bgGradient="linear(135deg, blue.400 0%, purple.400 100%)"
                  color="white"
                  fontWeight="bold"
                  shadow="xl"
                  border="4px"
                  borderColor="white"
                />
                
                <VStack align={{ base: 'center', md: 'start' }} spacing={3} maxW={{ base: 'full', md: 'auto' }}>
                  <Heading size="xl" color={textColor}>
                    {studentData.student_info.name}
                  </Heading>
                  
                  <HStack spacing={6} flexWrap="wrap" justify="center">
                    <HStack bg="blue.50" px={4} py={2} borderRadius="full">
                      <FaPhone color={primaryColor} size={16} />
                      <Text fontWeight="medium" color={textColor}>
                        {studentData.student_info.phone}
                      </Text>
                    </HStack>
                    
                    <Badge colorScheme="blue" variant="solid" px={3} py={1} borderRadius="full">
                      ID: {studentId}
                    </Badge>
                  </HStack>
                </VStack>
              </Stack>
            </VStack>
          </Card>

          {/* Statistics Cards */}
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
            <Card 
              bg={cardBg} 
              shadow="xl" 
              borderRadius="2xl" 
              p={6}
              border="1px"
              borderColor={borderColor}
              _hover={{ transform: 'translateY(-4px)', shadow: '2xl' }}
              transition="all 0.3s ease"
            >
              <Stat>
                <StatLabel color={textColor} fontSize="sm" fontWeight="semibold" mb={2}>
                  <HStack>
                    <Box p={2} bg="blue.100" borderRadius="lg">
                      <FaCalendarAlt color={primaryColor} size={16} />
                    </Box>
                    <Text>إجمالي الأيام</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color={primaryColor} fontSize="2xl" fontWeight="bold">
                  {studentData.statistics.total_days}
                </StatNumber>
                <StatHelpText color="gray.500" fontSize="sm">
                  يوم دراسي
                </StatHelpText>
              </Stat>
            </Card>

            <Card 
              bg={cardBg} 
              shadow="xl" 
              borderRadius="2xl" 
              p={6}
              border="1px"
              borderColor={borderColor}
              _hover={{ transform: 'translateY(-4px)', shadow: '2xl' }}
              transition="all 0.3s ease"
            >
              <Stat>
                <StatLabel color={textColor} fontSize="sm" fontWeight="semibold" mb={2}>
                  <HStack>
                    <Box p={2} bg="green.100" borderRadius="lg">
                      <FaCheckCircle color="green.500" size={16} />
                    </Box>
                    <Text>أيام الحضور</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="green.500" fontSize="2xl" fontWeight="bold">
                  {studentData.statistics.present_days}
                </StatNumber>
                <StatHelpText color="gray.500" fontSize="sm">
                  <StatArrow type="increase" />
                  حاضر
                </StatHelpText>
              </Stat>
            </Card>

            <Card 
              bg={cardBg} 
              shadow="xl" 
              borderRadius="2xl" 
              p={6}
              border="1px"
              borderColor={borderColor}
              _hover={{ transform: 'translateY(-4px)', shadow: '2xl' }}
              transition="all 0.3s ease"
            >
              <Stat>
                <StatLabel color={textColor} fontSize="sm" fontWeight="semibold" mb={2}>
                  <HStack>
                    <Box p={2} bg="red.100" borderRadius="lg">
                      <FaTimesCircle color="red.500" size={16} />
                    </Box>
                    <Text>أيام الغياب</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="red.500" fontSize="2xl" fontWeight="bold">
                  {studentData.statistics.absent_days}
                </StatNumber>
                <StatHelpText color="gray.500" fontSize="sm">
                  <StatArrow type="decrease" />
                  غائب
                </StatHelpText>
              </Stat>
            </Card>

            <Card 
              bg={cardBg} 
              shadow="xl" 
              borderRadius="2xl" 
              p={6}
              border="1px"
              borderColor={borderColor}
              _hover={{ transform: 'translateY(-4px)', shadow: '2xl' }}
              transition="all 0.3s ease"
            >
              <Stat>
                <StatLabel color={textColor} fontSize="sm" fontWeight="semibold" mb={2}>
                  <HStack>
                    <Box p={2} bg="purple.100" borderRadius="lg">
                      <FaChartLine color={secondaryColor} size={16} />
                    </Box>
                    <Text>نسبة الحضور</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color={getAttendanceRateColor(studentData.statistics.attendance_rate)} fontSize="2xl" fontWeight="bold">
                  {studentData.statistics.attendance_rate}%
                </StatNumber>
                <StatHelpText color="gray.500" fontSize="sm">
                  <Progress 
                    value={studentData.statistics.attendance_rate} 
                    colorScheme={getAttendanceRateColor(studentData.statistics.attendance_rate)}
                    size="sm"
                    borderRadius="full"
                    mt={2}
                  />
                </StatHelpText>
              </Stat>
            </Card>
          </SimpleGrid>

          {/* Attendance Details */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {/* Present Dates */}
            <Card 
              bg={cardBg} 
              shadow="xl" 
              borderRadius="2xl" 
              overflow="hidden"
              border="1px"
              borderColor={borderColor}
            >
              <Box p={6} borderBottom="1px" borderColor={borderColor}>
                <HStack spacing={3}>
                  <Box p={2} bg="green.100" borderRadius="lg">
                    <FaCalendarCheck color="green.500" size={20} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold" fontSize="lg" color={textColor}>
                      أيام الحضور
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {studentData.attendance_details.present_dates.length} يوم
                    </Text>
                  </VStack>
                </HStack>
              </Box>
              
              <CardBody p={0}>
                {studentData.attendance_details.present_dates.length === 0 ? (
                  <Center py={8}>
                    <VStack spacing={3}>
                      <FaCalendarCheck color="gray.400" size={40} />
                      <Text color="gray.500" fontSize="sm">لا توجد أيام حضور</Text>
                    </VStack>
                  </Center>
                ) : (
                  <Box maxH="300px" overflowY="auto" overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead bg={useColorModeValue('green.50', 'green.900')}>
                        <Tr>
                          <Th color="green.700" fontSize="sm">التاريخ</Th>
                          <Th color="green.700" fontSize="sm">اليوم</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {studentData.attendance_details.present_dates.map((date, index) => (
                          <Tr key={index} _hover={{ bg: useColorModeValue('green.50', 'green.900') }}>
                            <Td>
                              <Badge colorScheme="green" variant="solid" borderRadius="full">
                                {formatDate(date.date)}
                              </Badge>
                            </Td>
                            <Td>
                              <Text fontSize="sm" color={textColor}>
                                {date.day_name}
                              </Text>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </CardBody>
            </Card>

            {/* Absent Dates */}
            <Card 
              bg={cardBg} 
              shadow="xl" 
              borderRadius="2xl" 
              overflow="hidden"
              border="1px"
              borderColor={borderColor}
            >
              <Box p={6} borderBottom="1px" borderColor={borderColor}>
                <HStack spacing={3}>
                  <Box p={2} bg="red.100" borderRadius="lg">
                    <FaCalendarTimes color="red.500" size={20} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold" fontSize="lg" color={textColor}>
                      أيام الغياب
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {studentData.attendance_details.absent_dates.length} يوم
                    </Text>
                  </VStack>
                </HStack>
              </Box>
              
              <CardBody p={0}>
                {studentData.attendance_details.absent_dates.length === 0 ? (
                  <Center py={8}>
                    <VStack spacing={3}>
                      <FaCalendarTimes color="gray.400" size={40} />
                      <Text color="gray.500" fontSize="sm">لا توجد أيام غياب</Text>
                    </VStack>
                  </Center>
                ) : (
                  <Box maxH="300px" overflowY="auto" overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead bg={useColorModeValue('red.50', 'red.900')}>
                        <Tr>
                          <Th color="red.700" fontSize="sm">التاريخ</Th>
                          <Th color="red.700" fontSize="sm">اليوم</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {studentData.attendance_details.absent_dates.map((date, index) => (
                          <Tr key={index} _hover={{ bg: useColorModeValue('red.50', 'red.900') }}>
                            <Td>
                              <Badge colorScheme="red" variant="solid" borderRadius="full">
                                {formatDate(date.date)}
                              </Badge>
                            </Td>
                            <Td>
                              <Text fontSize="sm" color={textColor}>
                                {date.day_name}
                              </Text>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </CardBody>
                         </Card>
           </SimpleGrid>

           {/* قسم درجات الطالب */}
           <Card 
             bg={cardBg} 
             shadow="xl" 
             borderRadius="2xl" 
             overflow="hidden"
             border="1px"
             borderColor={borderColor}
           >
             <Box p={6} borderBottom="1px" borderColor={borderColor}>
               <HStack justify="space-between" align="center">
                 <HStack spacing={3}>
                   <Box p={2} bg="purple.100" borderRadius="lg">
                     <FaStar color={secondaryColor} size={20} />
                   </Box>
                   <VStack align="start" spacing={0}>
                     <Text fontWeight="bold" fontSize="lg" color={textColor}>
                       درجات الطالب
                     </Text>
                     <Text fontSize="sm" color="gray.500">
                       {studentGrades?.total_exams || 0} امتحان
                     </Text>
                   </VStack>
                 </HStack>
                 
                 {studentGrades && (
                   <HStack spacing={4}>
                     <Badge colorScheme="purple" variant="solid" px={3} py={1} borderRadius="full">
                       المتوسط: {studentGrades.average_grade?.toFixed(1) || 0}%
                     </Badge>
                     <Button
                       leftIcon={<MdAdd />}
                       colorScheme="purple"
                       size="sm"
                       onClick={onAddGradeModalOpen}
                       borderRadius="xl"
                       bgGradient="linear(135deg, purple.500 0%, pink.500 100%)"
                       _hover={{ 
                         bgGradient: "linear(135deg, purple.600 0%, pink.600 100%)",
                         transform: "translateY(-1px)"
                       }}
                       _active={{ transform: 'translateY(0)' }}
                       transition="all 0.2s"
                       fontWeight="bold"
                     >
                       إضافة درجة
                     </Button>
                   </HStack>
                 )}
               </HStack>
             </Box>
             
             <CardBody p={0}>
               {loadingGrades ? (
                 <Center py={12}>
                   <VStack spacing={4}>
                     <Spinner size="lg" color={secondaryColor} thickness="4px" />
                     <Text color="gray.500" fontSize="sm">جاري تحميل الدرجات...</Text>
                   </VStack>
                 </Center>
               ) : !studentGrades ? (
                 <Center py={12}>
                   <VStack spacing={4}>
                     <FaStar color="gray.400" size={40} />
                     <Text color="gray.500" fontSize="sm">لا يمكن تحميل الدرجات</Text>
                   </VStack>
                 </Center>
               ) : studentGrades.grades?.length === 0 ? (
                 <Center py={12}>
                   <VStack spacing={6}>
                     <Box
                       w="80px"
                       h="80px"
                       borderRadius="full"
                       bg="gray.100"
                       display="flex"
                       alignItems="center"
                       justifyContent="center"
                       border="3px"
                       borderColor="gray.200"
                     >
                       <FaStar size={40} color="gray.400" />
                     </Box>
                     <VStack spacing={2}>
                       <Text fontSize="lg" fontWeight="bold" color={textColor} textAlign="center">
                         لا توجد درجات مسجلة
                       </Text>
                       <Text color="gray.500" textAlign="center" fontSize="sm">
                         ابدأ بإضافة أول درجة للطالب
                       </Text>
                     </VStack>
                     <Button
                       leftIcon={<MdAdd />}
                       colorScheme="purple"
                       onClick={onAddGradeModalOpen}
                       borderRadius="xl"
                       bgGradient="linear(135deg, purple.500 0%, pink.500 100%)"
                       _hover={{ 
                         bgGradient: "linear(135deg, purple.600 0%, pink.600 100%)",
                         transform: "translateY(-1px)"
                       }}
                       _active={{ transform: 'translateY(0)' }}
                       transition="all 0.2s"
                       fontWeight="bold"
                     >
                       إضافة أول درجة
                     </Button>
                   </VStack>
                 </Center>
               ) : (
                <Box maxH="400px" overflowY="auto" overflowX="auto">
                  <Table variant="simple" size="sm">
                     <Thead bg={useColorModeValue('purple.50', 'purple.900')}>
                       <Tr>
                         <Th color="purple.700" fontSize="sm">الامتحان</Th>
                         <Th color="purple.700" fontSize="sm">المجموعة</Th>
                         <Th color="purple.700" fontSize="sm" textAlign="center">الدرجة</Th>
                         <Th color="purple.700" fontSize="sm">التاريخ</Th>
                         <Th color="purple.700" fontSize="sm">الملاحظات</Th>
                       </Tr>
                     </Thead>
                     <Tbody>
                       {studentGrades.grades?.map((gradeItem) => (
                         <Tr key={gradeItem.id} _hover={{ bg: useColorModeValue('purple.50', 'purple.900') }}>
                           <Td>
                             <VStack align="start" spacing={1}>
                               <Text fontWeight="semibold" color={textColor} fontSize="sm">
                                 {gradeItem.exam_name}
                               </Text>
                               <Badge colorScheme="blue" variant="subtle" px={2} py={0.5} borderRadius="full" fontSize="2xs">
                                 {gradeItem.total_grade} درجة كاملة
                               </Badge>
                             </VStack>
                           </Td>
                           <Td>
                             <Text fontSize="sm" color={textColor}>
                               {gradeItem.group_name}
                             </Text>
                           </Td>
                           <Td textAlign="center">
                             <VStack spacing={1}>
                               <Badge 
                                 colorScheme={gradeItem.grade >= 90 ? 'green' : gradeItem.grade >= 75 ? 'orange' : 'red'} 
                                 variant="solid" 
                                 px={3} 
                                 py={1} 
                                 borderRadius="full"
                                 fontSize="sm"
                                 fontWeight="bold"
                               >
                                 {gradeItem.grade}%
                               </Badge>
                               <Progress 
                                 value={(gradeItem.grade / gradeItem.total_grade) * 100} 
                                 colorScheme={gradeItem.grade >= 90 ? 'green' : gradeItem.grade >= 75 ? 'orange' : 'red'}
                                 size="xs"
                                 borderRadius="full"
                                 w="60px"
                               />
                             </VStack>
                           </Td>
                           <Td>
                             <VStack align="start" spacing={1}>
                               <Text fontSize="sm" color={textColor}>
                                 {formatDate(gradeItem.exam_date)}
                               </Text>
                               <Text fontSize="xs" color="gray.500">
                                 {formatDateTime(gradeItem.created_at)}
                               </Text>
                             </VStack>
                           </Td>
                           <Td>
                             <Text fontSize="sm" color="gray.600" maxW="200px" noOfLines={2}>
                               {gradeItem.notes || '-'}
                             </Text>
                           </Td>
                         </Tr>
                       ))}
                     </Tbody>
                   </Table>
                 </Box>
               )}
             </CardBody>
           </Card>
         </VStack>
       </Container>

      {/* موديل إضافة درجة امتحان */}
      <Modal isOpen={isAddGradeModalOpen} onClose={handleCloseGradeModal} size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="2xl">
          <ModalHeader>
            <HStack spacing={3}>
              <Box p={2} bg="purple.100" borderRadius="lg">
                <FaStar color="#805AD5" size={20} />
              </Box>
              <VStack align="start" spacing={0}>
                <Text>إضافة درجة امتحان</Text>
                <Text fontSize="sm" color="gray.500" fontWeight="normal">
                  {studentData?.student_info?.name}
                </Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              <FormControl isRequired>
                <FormLabel fontWeight="semibold" color={textColor}>
                  اسم الامتحان
                </FormLabel>
                <Input
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="مثال: امتحان الوحدة الأولى"
                  size="lg"
                  borderRadius="xl"
                  border="2px"
                  borderColor="gray.200"
                  _focus={{ 
                    borderColor: primaryColor, 
                    boxShadow: `0 0 0 1px ${primaryColor}`,
                  }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="semibold" color={textColor}>
                  الدرجة
                </FormLabel>
                <NumberInput
                  value={grade}
                  onChange={(value) => setGrade(value)}
                  min={0}
                  max={100}
                  precision={1}
                  size="lg"
                  borderRadius="xl"
                >
                  <NumberInputField 
                    placeholder="0 - 100"
                    borderRadius="xl"
                    border="2px"
                    borderColor="gray.200"
                    _focus={{ 
                      borderColor: primaryColor, 
                      boxShadow: `0 0 0 1px ${primaryColor}`,
                    }}
                  />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="semibold" color={textColor}>
                  ملاحظات
                </FormLabel>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات إضافية عن أداء الطالب..."
                  size="lg"
                  borderRadius="xl"
                  rows={3}
                  border="2px"
                  borderColor="gray.200"
                  _focus={{ 
                    borderColor: primaryColor, 
                    boxShadow: `0 0 0 1px ${primaryColor}`,
                  }}
                />
              </FormControl>

              {/* معاينة البيانات */}
              {(examName || grade || notes) && (
                <Card bg="blue.50" border="1px" borderColor="blue.200" borderRadius="xl">
                  <CardBody>
                    <VStack align="start" spacing={3}>
                      <Text fontWeight="bold" color="blue.700" fontSize="sm">
                        معاينة البيانات:
                      </Text>
                      {examName && (
                        <HStack>
                          <FaFileAlt color="blue.500" size={14} />
                          <Text fontSize="sm" color="blue.600">
                            الامتحان: {examName}
                          </Text>
                        </HStack>
                      )}
                      {grade && (
                        <HStack>
                          <FaStar color="orange.500" size={14} />
                          <Text fontSize="sm" color="blue.600">
                            الدرجة: {grade}/100
                          </Text>
                        </HStack>
                      )}
                      {notes && (
                        <HStack align="start">
                          <Box mt={1}>
                            <FaUser color="green.500" size={14} />
                          </Box>
                          <Text fontSize="sm" color="blue.600">
                            الملاحظات: {notes}
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={handleCloseGradeModal}>
                إلغاء
              </Button>
              <Button
                colorScheme="purple"
                onClick={handleAddGrade}
                isLoading={isAddingGrade}
                loadingText="جاري الإضافة..."
                leftIcon={<MdAdd />}
                borderRadius="xl"
                bgGradient="linear(135deg, purple.500 0%, pink.500 100%)"
                _hover={{ 
                  bgGradient: "linear(135deg, purple.600 0%, pink.600 100%)",
                  transform: "translateY(-1px)"
                }}
                _active={{ transform: 'translateY(0)' }}
                transition="all 0.2s"
                fontWeight="bold"
                isDisabled={!examName.trim() || !grade}
              >
                إضافة الدرجة
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default StudentDetailsPage; 