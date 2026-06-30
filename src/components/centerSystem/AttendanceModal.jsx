import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  IconButton,
  Badge,
  useToast,
  Divider,
  useColorModeValue,
  Icon,
  Heading,
  Box,
} from '@chakra-ui/react';
import { FaCheckCircle, FaTimesCircle, FaRegCircle, FaCalendarDay } from 'react-icons/fa';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css'; // استيراد css الخاص بالـ DayPicker
import { format, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale'; // لاستخدام التاريخ باللغة العربية
import { Tooltip } from 'recharts';

const AttendanceModal = ({ isOpen, onClose, students, onUpdateAttendance }) => {
  const [selectedDate, setSelectedDate] = useState(new Date()); // التاريخ الافتراضي هو اليوم
  // حالة مؤقتة لتخزين تغييرات الحضور قبل الحفظ
  const [currentAttendanceStatus, setCurrentAttendanceStatus] = useState(() => {
    const todayFormatted = format(selectedDate, 'yyyy-MM-dd');
    const status = {};
    students.forEach(student => {
      status[student.id] = student.attendanceRecords[todayFormatted] || 'unknown'; // 'unknown' إذا لم يتم تسجيله بعد
    });
    return status;
  });

  const toast = useToast();
  const modalBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const dividerColor = useColorModeValue('gray.200', 'gray.600');

  // تحديث حالة الحضور المؤقتة عند تغيير التاريخ
  React.useEffect(() => {
    const dateFormatted = format(selectedDate, 'yyyy-MM-dd');
    const status = {};
    students.forEach(student => {
      status[student.id] = student.attendanceRecords[dateFormatted] || 'unknown';
    });
    setCurrentAttendanceStatus(status);
  }, [selectedDate, students]);

  const handleDayClick = (day) => {
    setSelectedDate(day);
  };

  const handleStatusChange = (studentId, status) => {
    setCurrentAttendanceStatus((prevStatus) => ({
      ...prevStatus,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = () => {
    const dateFormatted = format(selectedDate, 'yyyy-MM-dd');
    const updatedStudents = students.map((student) => {
      return {
        ...student,
        attendanceRecords: {
          ...student.attendanceRecords,
          [dateFormatted]: currentAttendanceStatus[student.id] || 'unknown',
        },
      };
    });
    onUpdateAttendance(updatedStudents); // تمرير الطلاب المحدثين إلى المكون الأب
    toast({
      title: 'تم حفظ الحضور/الغياب',
      description: `تم تحديث سجلات الحضور لتاريخ ${format(selectedDate, 'PPP', { locale: ar })}.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={modalBg} borderRadius="xl" shadow="2xl">
        <ModalHeader borderBottomWidth="1px" borderColor={dividerColor} pb={4} textAlign="center">
          <HStack justifyContent="center" alignItems="center">
            <Icon as={FaCalendarDay} color="blue.500" boxSize={6} />
            <Heading size="lg" color={useColorModeValue('gray.800', 'gray.100')}>
              تسجيل الحضور والغياب
            </Heading>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={6}>
          <HStack align="flex-start" spacing={8} direction={{ base: 'column', md: 'row' }}>
            {/* قسم اختيار التاريخ */}
            <VStack flex={1} minW="280px" p={4} bg={useColorModeValue('gray.50', 'gray.800')} borderRadius="lg" shadow="sm">
              <Heading size="md" mb={4} color="blue.500">
                اختر التاريخ
              </Heading>
              <Box className="day-picker-container" sx={{
                '.rdp': { '--rdp-cell-size': '40px', '--rdp-background-color': '#F7FAFC' },
                '.rdp-day_selected': { bg: 'blue.500', color: 'white' },
                '.rdp-day_today': { borderColor: 'blue.500', borderWidth: '1px' },
                '.rdp-nav_button': { _hover: { bg: 'blue.100' } },
              }}>
                 <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDayClick}
                  footer={<Text mt={2} fontSize="sm" color={textColor}>التاريخ المحدد: <Text as="span" fontWeight="bold" color="blue.500">{format(selectedDate, 'PPP', { locale: ar })}</Text></Text>}
                  showWeekNumber={false}
                  // يمكنك إضافة props أخرى هنا لتخصيص DayPicker
                />
              </Box>
            </VStack>

            <Divider orientation="vertical" h="auto" display={{ base: 'none', md: 'block' }} borderColor={dividerColor} />
            <Divider orientation="horizontal" w="full" display={{ base: 'block', md: 'none' }} borderColor={dividerColor} />

            {/* قسم تسجيل الحضور للطلاب */}
            <VStack flex={2} align="stretch" spacing={4} maxH="400px" overflowY="auto" pr={2}>
              <HStack justifyContent="space-between" alignItems="center" mb={2}>
                <Heading size="md" color={useColorModeValue('gray.800', 'gray.100')}>
                  تسجيل الحضور/الغياب
                </Heading>
                <Badge colorScheme="blue" fontSize="md" py={1} px={3} borderRadius="full">
                  {format(selectedDate, 'PPP', { locale: ar })}
                </Badge>
              </HStack>
              <Divider borderColor={dividerColor} />

              {students.map((student) => (
                <HStack key={student.id} justifyContent="space-between" p={3} bg={useColorModeValue('whiteAlpha.800', 'gray.600')} borderRadius="lg" shadow="sm" _hover={{ bg: useColorModeValue('gray.50', 'gray.650') }}>
                  <VStack align="flex-start" spacing={0}>
                    <Text fontWeight="bold" color={textColor} fontSize="lg">
                      {student.name}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      الكود: {student.code} | المستوى: {student.level}
                    </Text>
                  </VStack>
                  <HStack spacing={2}>
                    <Tooltip label="حاضر" hasArrow>
                      <IconButton
                        aria-label="Mark Present"
                        icon={<FaCheckCircle />}
                        colorScheme={currentAttendanceStatus[student.id] === 'present' ? 'green' : 'gray'}
                        variant={currentAttendanceStatus[student.id] === 'present' ? 'solid' : 'outline'}
                        onClick={() => handleStatusChange(student.id, 'present')}
                        borderRadius="full"
                        size="lg"
                        _hover={{ transform: 'scale(1.1)' }}
                      />
                    </Tooltip>
                    <Tooltip label="غائب" hasArrow>
                      <IconButton
                        aria-label="Mark Absent"
                        icon={<FaTimesCircle />}
                        colorScheme={currentAttendanceStatus[student.id] === 'absent' ? 'red' : 'gray'}
                        variant={currentAttendanceStatus[student.id] === 'absent' ? 'solid' : 'outline'}
                        onClick={() => handleStatusChange(student.id, 'absent')}
                        borderRadius="full"
                        size="lg"
                        _hover={{ transform: 'scale(1.1)' }}
                      />
                    </Tooltip>
                    <Tooltip label="غير محدد" hasArrow>
                      <IconButton
                        aria-label="Mark Unknown"
                        icon={<FaRegCircle />} // أيقونة لدائرة فارغة
                        colorScheme={currentAttendanceStatus[student.id] === 'unknown' ? 'yellow' : 'gray'}
                        variant={currentAttendanceStatus[student.id] === 'unknown' ? 'solid' : 'outline'}
                        onClick={() => handleStatusChange(student.id, 'unknown')}
                        borderRadius="full"
                        size="lg"
                        _hover={{ transform: 'scale(1.1)' }}
                      />
                    </Tooltip>
                  </HStack>
                </HStack>
              ))}
              {students.length === 0 && (
                <Text textAlign="center" color="gray.500" py={4}>
                  لا توجد طلاب لإدارة حضورهم.
                </Text>
              )}
            </VStack>
          </HStack>
        </ModalBody>

        <ModalFooter borderTopWidth="1px" borderColor={dividerColor} pt={4}>
          <Button variant="ghost" onClick={onClose} mr={3}>
            إلغاء
          </Button>
          <Button colorScheme="blue" onClick={handleSaveAttendance}>
            حفظ التغييرات
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AttendanceModal;