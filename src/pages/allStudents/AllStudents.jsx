import React, { useState, useEffect } from 'react';
import baseUrl from '../../api/baseUrl';
import { FaSearch, FaPhone, FaUser, FaGraduationCap, FaArrowLeft, FaArrowRight, FaCalendar, FaKey, FaEdit, FaMobileAlt, FaCheckCircle } from 'react-icons/fa';
import {
  Box,
  Container,
  Heading,
  Text,
  Input,
  Button,
  Flex,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  Spinner,
  useColorModeValue,
  Icon,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Card,
  CardBody,
  Avatar,
  Divider,
  SimpleGrid,
  Center,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  useToast
} from '@chakra-ui/react';

const AllStudents = () => {
  const [allStudents, setAllStudents] = useState([]); // جميع الطلاب
  const [filteredStudents, setFilteredStudents] = useState([]); // الطلاب المفلترة
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    skip: 0,
    hasMore: false
  });
  
  // حالات نافذة تعديل كلمة المرور
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // حالات نافذة السماح بجهاز آخر
  const { isOpen: isDeviceModalOpen, onOpen: onDeviceModalOpen, onClose: onDeviceModalClose } = useDisclosure();
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [deviceResult, setDeviceResult] = useState(null);
  
  const toast = useToast();

  // Color mode values
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subTextColor = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const primaryColor = useColorModeValue("blue.600", "blue.300");
  const primaryHoverColor = useColorModeValue("blue.700", "blue.400");
  const secondaryColor = useColorModeValue("gray.500", "gray.400");
  const secondaryHoverColor = useColorModeValue("gray.600", "gray.300");
  const avatarBg = useColorModeValue("blue.500", "blue.400");
  const phoneIconColor = useColorModeValue("blue.500", "blue.300");
  const userIconColor = useColorModeValue("green.500", "green.300");
  const gradeIconColor = useColorModeValue("purple.500", "purple.300");
  const loadingBg = useColorModeValue("white", "gray.800");
  const loadingTextColor = useColorModeValue("gray.700", "gray.200");

  // Fetch all students data
  const fetchAllStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // جلب جميع الطلاب من API الجديد
      const response = await baseUrl.get(`/api/student/students-data`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data?.success) {
        const students = response.data.data.students || [];
        setAllStudents(students);
        setFilteredStudents(students);
        setPagination({
          total: response.data.data.total || students.length,
          limit: 10,
          skip: 0,
          hasMore: students.length > 10
        });
        setError(null);
      } else {
        throw new Error('فشل في جلب بيانات الطلاب');
      }
    } catch (err) {
      setError('حدث خطأ في تحميل بيانات الطلاب');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllStudents();
  }, []);

  // Filter students based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStudents(allStudents);
    } else {
      const filtered = allStudents.filter(student => {
        const searchLower = searchTerm.toLowerCase();
        const name = (student.name || '').toLowerCase();
        const phone = (student.phone || '').toLowerCase();
        const parentPhone = (student.parent_phone || '').toLowerCase();
        
        // البحث في الصفوف الدراسية (grades array)
        const grades = student.grades || [];
        const gradeNames = grades.map(grade => grade.name || '').join(' ').toLowerCase();
        
        return name.includes(searchLower) || 
               phone.includes(searchLower) || 
               parentPhone.includes(searchLower) ||
               gradeNames.includes(searchLower);
      });
      setFilteredStudents(filtered);
    }
    setCurrentPage(1); // إعادة تعيين الصفحة عند البحث
  }, [searchTerm, allStudents]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // البحث يتم تلقائياً عبر useEffect
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  // فتح نافذة تعديل كلمة المرور
  const openPasswordModal = (student) => {
    setSelectedStudent(student);
    setNewPassword('');
    setShowPassword(false);
    onOpen();
  };

  // تعديل كلمة مرور الطالب
  const handlePasswordChange = async () => {
    if (!newPassword.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال كلمة مرور جديدة',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setPasswordLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await baseUrl.patch(`/api/users/students/${selectedStudent.id}/password`, {
        new_password: newPassword
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data?.success) {
        toast({
          title: 'تم التحديث',
          description: 'تم تغيير كلمة مرور الطالب بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
        setNewPassword('');
        setSelectedStudent(null);
      } else {
        throw new Error('فشل في تغيير كلمة المرور');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'خطأ',
        description: error.response?.data?.message || 'فشل في تغيير كلمة المرور',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // السماح بجهاز آخر للطالب
  const handleAllowDevice = async (student) => {
    if (!student.phone) {
      toast({
        title: 'خطأ',
        description: 'رقم الهاتف غير متوفر للطالب',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setDeviceLoading(true);
      setDeviceResult(null);
      const token = localStorage.getItem("token");
      
      const response = await baseUrl.patch(
        `/api/users/students/allow-device`,
        {
          phone: student.phone
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.success) {
        setDeviceResult(response.data.data);
        setSelectedStudent(student);
        onDeviceModalOpen();
        toast({
          title: 'تم بنجاح',
          description: response.data.message || 'تم السماح للطالب باستخدام جهاز آخر',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('فشل في السماح بجهاز آخر');
      }
    } catch (error) {
      console.error('Error allowing device:', error);
      toast({
        title: 'خطأ',
        description: error.response?.data?.message || 'فشل في السماح بجهاز آخر',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDeviceLoading(false);
    }
  };

  // Calculate pagination for filtered students
  const totalPages = Math.ceil(filteredStudents.length / pagination.limit);
  const startIndex = (currentPage - 1) * pagination.limit;
  const endIndex = startIndex + pagination.limit;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  if (loading && allStudents.length === 0) {
    return (
      <Box minH="100vh" bg={bgColor} display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color={primaryColor} />
          <Text fontSize="lg" color={subTextColor}>جاري تحميل بيانات الطلاب...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor} pt="80px" pb={8} px={4}>
      <Container maxW="7xl">
        {/* Header */}
        <VStack spacing={3} mb={6} textAlign="center">
          <Heading size={{ base: "xl", md: "2xl" }} color={textColor}>جميع الطلاب</Heading>
          <Text fontSize={{ base: "sm", md: "md" }} color={subTextColor}>إدارة وعرض بيانات الطلاب المسجلين</Text>
        </VStack>

        {/* Search Section */}
        <Box mb={6}>
            <form onSubmit={handleSearch}>
            <Flex direction={{ base: "column", sm: "row" }} gap={3}>
              <InputGroup flex={1}>
                <InputLeftElement pointerEvents="none">
                    <Icon as={FaSearch} color={subTextColor} />
                  </InputLeftElement>
                  <Input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="البحث بالاسم أو رقم الهاتف..."
                  size="md"
                  bg="white"
                  _focus={{ borderColor: primaryColor }}
                  />
                </InputGroup>
              {searchTerm && (
                <Button
                    type="button"
                    onClick={clearSearch}
                  size="md"
                  variant="outline"
                  >
                  مسح
                  </Button>
                )}
              </Flex>
            </form>
        </Box>

        {/* Error Message */}
        {error && (
          <Alert status="error" mb={6} borderRadius="lg">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Students Grid */}
        {currentStudents.length > 0 ? (
          <SimpleGrid 
            columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} 
            spacing={4} 
            mb={6}
          >
            {currentStudents.map((student) => (
              <Card
                key={student.id}
                bg={cardBg}
                shadow="sm"
                _hover={{ shadow: "md" }}
                transition="all 0.2s"
                borderRadius="md"
              >
                <CardBody p={4}>
                  {/* Student Header */}
                  <Flex alignItems="center" mb={3} gap={2}>
                    <Avatar
                      size="md"
                      bg={avatarBg}
                      name={student.name || '?'}
                    />
                    <Box flex={1} minW={0}>
                      <Text 
                        fontWeight="bold" 
                        color={textColor} 
                        fontSize="md"
                        noOfLines={1}
                      >
                        {student.name || 'غير محدد'}
                      </Text>
                      <Text color={subTextColor} fontSize="xs">
                        ID: {student.id}
                      </Text>
                    </Box>
                  </Flex>

                  <Divider mb={3} />

                  {/* Student Details */}
                  <VStack spacing={2} align="stretch" mb={3}>
                    <HStack spacing={2} justify="space-between">
                      <HStack spacing={1}>
                        <Icon as={FaPhone} color={phoneIconColor} fontSize="xs" />
                        <Text color={subTextColor} fontSize="xs">الهاتف:</Text>
                      </HStack>
                      <Text color={textColor} fontSize="xs" noOfLines={1}>
                        {student.phone || 'غير محدد'}
                      </Text>
                    </HStack>

                    <HStack spacing={2} justify="space-between">
                      <HStack spacing={1}>
                        <Icon as={FaUser} color={userIconColor} fontSize="xs" />
                        <Text color={subTextColor} fontSize="xs">ولي الأمر:</Text>
                      </HStack>
                      <Text color={textColor} fontSize="xs" noOfLines={1}>
                        {student.parent_phone || 'غير محدد'}
                      </Text>
                    </HStack>

                    <HStack spacing={2} justify="space-between" align="start">
                      <HStack spacing={1}>
                        <Icon as={FaGraduationCap} color={gradeIconColor} fontSize="xs" />
                        <Text color={subTextColor} fontSize="xs">الصف:</Text>
                      </HStack>
                      <Text 
                        color={textColor} 
                        fontSize="xs"
                        textAlign="right"
                        noOfLines={2}
                      >
                        {student.grades && student.grades.length > 0 
                          ? student.grades.map(grade => grade.name).join(', ')
                          : 'غير محدد'
                        }
                      </Text>
                    </HStack>
                  </VStack>

                  {/* Action Buttons */}
                  <VStack spacing={2} w="full">
                    <Button
                      size="sm"
                      colorScheme="blue"
                      leftIcon={<Icon as={FaKey} />}
                      onClick={() => openPasswordModal(student)}
                      w="full"
                      fontSize="xs"
                    >
                      تعديل كلمة المرور
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="green"
                      variant="outline"
                      leftIcon={<Icon as={FaMobileAlt} />}
                      onClick={() => handleAllowDevice(student)}
                      isLoading={deviceLoading}
                      loadingText="جاري..."
                      w="full"
                      fontSize="xs"
                    >
                      السماح بجهاز آخر
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <Center py={12}>
            <VStack spacing={4}>
              <Text fontSize="6xl">👥</Text>
              <Heading size="lg" color={textColor}>
                {searchTerm ? 'لا توجد نتائج للبحث' : 'لا يوجد طلاب'}
              </Heading>
              <Text color={subTextColor}>
                {searchTerm ? 'جرب البحث بكلمات مختلفة' : 'لم يتم العثور على أي طلاب مسجلين'}
              </Text>
            </VStack>
          </Center>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box 
            bg={cardBg} 
            p={3} 
            borderRadius="md"
          >
            <Flex 
              direction={{ base: "column", sm: "row" }} 
              justify="space-between" 
              align="center" 
              gap={3}
            >
              <Text color={subTextColor} fontSize="xs" textAlign="center">
                {startIndex + 1} - {Math.min(endIndex, filteredStudents.length)} من {filteredStudents.length}
                 </Text>
                
              <HStack spacing={1} flexWrap="wrap" justify="center">
                  <IconButton
                    onClick={() => handlePageChange(currentPage - 1)}
                    isDisabled={currentPage === 1}
                    icon={<Icon as={FaArrowRight} />}
                  size="xs"
                  aria-label="السابق"
                  />

                  <HStack spacing={1}>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                        size="xs"
                        colorScheme={currentPage === pageNum ? "blue" : "gray"}
                        variant={currentPage === pageNum ? "solid" : "outline"}
                        minW="32px"
                        fontSize="xs"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </HStack>

                  <IconButton
                    onClick={() => handlePageChange(currentPage + 1)}
                    isDisabled={currentPage === totalPages}
                    icon={<Icon as={FaArrowLeft} />}
                  size="xs"
                  aria-label="التالي"
                  />
                </HStack>
              </Flex>
          </Box>
        )}

        {/* Loading Overlay */}
        {loading && allStudents.length > 0 && (
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.500"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex={9999}
          >
            <Card bg={loadingBg} p={6}>
              <HStack spacing={3}>
                <Spinner size="sm" color={primaryColor} />
                <Text color={loadingTextColor}>جاري التحميل...</Text>
              </HStack>
            </Card>
          </Box>
        )}
      </Container>

      {/* Modal تعديل كلمة المرور */}
      <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", sm: "md" }} isCentered>
        <ModalOverlay />
        <ModalContent m={{ base: 0, sm: 4 }}>
          <ModalHeader fontSize={{ base: "md", sm: "lg" }}>
            <HStack spacing={2}>
              <Icon as={FaKey} />
              <Text>تعديل كلمة مرور الطالب</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedStudent && (
              <VStack spacing={4} align="stretch">
                <Box p={3} bg="blue.50" borderRadius="md">
                  <HStack spacing={2}>
                    <Avatar size="sm" bg={avatarBg} name={selectedStudent.name || '?'} />
                    <Box>
                      <Text fontWeight="bold" fontSize="sm">
                          {selectedStudent.name || 'غير محدد'}
                        </Text>
                      <Text fontSize="xs" color={subTextColor}>
                          ID: {selectedStudent.id}
                        </Text>
                    </Box>
                    </HStack>
                </Box>

                <FormControl>
                  <FormLabel fontSize="sm">كلمة المرور الجديدة</FormLabel>
                  <InputGroup size="sm">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور الجديدة"
                    />
                    <InputRightElement width="4rem">
                      <Button
                        h="1.5rem"
                        size="xs"
                        onClick={() => setShowPassword(!showPassword)}
                        variant="ghost"
                      >
                        {showPassword ? "إخفاء" : "إظهار"}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Alert status="info" borderRadius="md" fontSize="xs">
                  <AlertIcon />
                  <Text>
                      سيتم تغيير كلمة مرور الطالب فوراً. تأكد من إبلاغ الطالب بكلمة المرور الجديدة.
                    </Text>
                </Alert>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={2} w="full" justify="flex-end">
              <Button onClick={onClose} variant="outline" size="sm">
                إلغاء
              </Button>
              <Button
                colorScheme="blue"
                onClick={handlePasswordChange}
                isLoading={passwordLoading}
                loadingText="جاري..."
                leftIcon={<Icon as={FaKey} />}
                size="sm"
              >
                تغيير
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal السماح بجهاز آخر */}
      <Modal 
        isOpen={isDeviceModalOpen} 
        onClose={() => {
          onDeviceModalClose();
          setDeviceResult(null);
          setSelectedStudent(null);
        }} 
        size={{ base: "full", sm: "md" }}
        isCentered
      >
        <ModalOverlay />
        <ModalContent m={{ base: 0, sm: 4 }}>
          <ModalHeader fontSize={{ base: "md", sm: "lg" }}>
            <HStack spacing={2}>
              <Icon as={FaMobileAlt} />
              <Text>السماح بجهاز آخر</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {deviceResult && selectedStudent && (
              <VStack spacing={4} align="stretch">
                <Alert status="success" borderRadius="md" fontSize="xs">
                  <AlertIcon />
                  <Text>تم السماح للطالب باستخدام جهاز آخر بنجاح</Text>
                </Alert>

                <Box p={3} bg="green.50" borderRadius="md">
                  <VStack spacing={3} align="stretch">
                    <HStack spacing={2}>
                      <Avatar size="sm" bg={avatarBg} name={selectedStudent.name || '?'} />
                      <Box>
                        <Text fontWeight="bold" fontSize="sm">
                          {deviceResult.student_name || selectedStudent.name || 'غير محدد'}
                        </Text>
                        <Text fontSize="xs" color={subTextColor}>
                          ID: {deviceResult.student_id || selectedStudent.id}
                        </Text>
                      </Box>
                    </HStack>
                    
                    <Divider />
                    
                    <VStack spacing={2} align="stretch">
                      <HStack justify="space-between" fontSize="xs">
                        <Text color={subTextColor}>رقم الهاتف:</Text>
                        <Text fontWeight="bold">
                          {deviceResult.student_phone || selectedStudent.phone || 'غير محدد'}
                        </Text>
                      </HStack>
                      
                      {deviceResult.old_device_ip && (
                        <HStack justify="space-between" fontSize="xs">
                          <Text color={subTextColor}>IP السابق:</Text>
                          <Text fontWeight="bold" fontFamily="mono" fontSize="xs">
                            {deviceResult.old_device_ip}
                          </Text>
                        </HStack>
                      )}
                      
                      {deviceResult.updated_at && (
                        <HStack justify="space-between" fontSize="xs">
                          <Text color={subTextColor}>التحديث:</Text>
                          <Text fontWeight="bold" fontSize="xs">
                            {new Date(deviceResult.updated_at).toLocaleString('ar-EG')}
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                  </VStack>
                </Box>

                {deviceResult.note && (
                  <Alert status="info" borderRadius="md" fontSize="xs">
                    <AlertIcon />
                    <Text>{deviceResult.note}</Text>
                  </Alert>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="green"
              onClick={() => {
                onDeviceModalClose();
                setDeviceResult(null);
                setSelectedStudent(null);
              }}
              leftIcon={<Icon as={FaCheckCircle} />}
              size="sm"
              w="full"
            >
              تم
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AllStudents;
