import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import baseUrl from '../../api/baseUrl';
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
  Card,
  CardBody,
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
  useToast,
  Image,
  Badge,
  Divider,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaImage,
  FaBook,
  FaDollarSign,
  FaTag,
  FaFileAlt,
  FaUser,
  FaCalendar,
  FaExternalLinkAlt,
} from 'react-icons/fa';

const GeneralCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  // Modal states
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    category: '',
    image: null,
  });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [deleteCourseId, setDeleteCourseId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Color mode values
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subTextColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const primaryColor = useColorModeValue('blue.600', 'blue.300');
  const sectionBg = useColorModeValue('gray.50', 'whiteAlpha.50');
  const inputBg = useColorModeValue('white', 'gray.700');
  const modalFooterBg = useColorModeValue('white', 'gray.800');

  // Categories
  const categories = [
    { value: 'برمجة', label: 'برمجة' },
    { value: 'لغات', label: 'لغات' },
    { value: 'إدارة وتسويق', label: 'إدارة وتسويق' },
    { value: 'بيزنس', label: 'بيزنس' },
    { value: 'مهارات متنوعة', label: 'مهارات متنوعة' },
  ];

  // Fetch all courses
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await baseUrl.get('/api/general-courses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.success) {
        setCourses(response.data.courses || []);
      } else {
        throw new Error('فشل في جلب الكورسات');
      }
    } catch (err) {
      setError('حدث خطأ في تحميل الكورسات');
      console.error('Error fetching courses:', err);
      toast({
        title: 'خطأ',
        description: err.response?.data?.message || 'فشل في جلب الكورسات',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (course.title || '').toLowerCase().includes(searchLower) ||
      (course.description || '').toLowerCase().includes(searchLower) ||
      (course.category || '').toLowerCase().includes(searchLower)
    );
  });

  // Open add modal
  const handleAddOpen = () => {
    setFormData({
      title: '',
      description: '',
      price: 0,
      category: '',
      image: null,
    });
    setImagePreview(null);
    setSelectedCourse(null);
    onAddOpen();
  };

  // Open edit modal
  const handleEditOpen = (course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title || '',
      description: course.description || '',
      price: course.price || 0,
      category: course.category || '',
      image: null,
    });
    setImagePreview(course.image || null);
    onEditOpen();
  };

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submit (Add)
  const handleAddSubmit = async () => {
    if (!formData.title || !formData.price || !formData.category) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('price', formData.price);
      formDataToSend.append('category', formData.category);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const response = await baseUrl.post('/api/general-courses', formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        toast({
          title: 'تم بنجاح',
          description: 'تم إنشاء الكورس بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onAddClose();
        fetchCourses();
      }
    } catch (err) {
      toast({
        title: 'خطأ',
        description: err.response?.data?.message || 'فشل في إنشاء الكورس',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form submit (Edit)
  const handleEditSubmit = async () => {
    if (!formData.title || !formData.price || !formData.category) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('price', formData.price);
      formDataToSend.append('category', formData.category);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const response = await baseUrl.put(
        `/api/general-courses/${selectedCourse.id}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data?.success) {
        toast({
          title: 'تم بنجاح',
          description: 'تم تحديث الكورس بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onEditClose();
        fetchCourses();
      }
    } catch (err) {
      toast({
        title: 'خطأ',
        description: err.response?.data?.message || 'فشل في تحديث الكورس',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteCourseId) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await baseUrl.delete(`/api/general-courses/${deleteCourseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.success) {
        toast({
          title: 'تم بنجاح',
          description: 'تم حذف الكورس بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onDeleteClose();
        setDeleteCourseId(null);
        fetchCourses();
      }
    } catch (err) {
      toast({
        title: 'خطأ',
        description: err.response?.data?.message || 'فشل في حذف الكورس',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      برمجة: 'blue',
      لغات: 'green',
      'إدارة وتسويق': 'purple',
      بيزنس: 'orange',
      'مهارات متنوعة': 'pink',
    };
    return colors[category] || 'gray';
  };

  if (loading && courses.length === 0) {
    return (
      <Box minH="100vh" bg={bgColor} display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color={primaryColor} />
          <Text fontSize="lg" color={subTextColor}>
            جاري تحميل الكورسات...
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor} pt="80px" pb={8} px={4}>
      <Container maxW="7xl">
        {/* Header */}
        <Flex
          justify="space-between"
          align="center"
          flexWrap="wrap"
          gap={4}
          mb={6}
        >
          <VStack align="start" spacing={1}>
            <Heading size={{ base: 'xl', md: '2xl' }} color={textColor}>
              إدارة الكورسات العامة
            </Heading>
            <Text fontSize={{ base: 'sm', md: 'md' }} color={subTextColor}>
              إدارة وعرض الكورسات العامة المتاحة
            </Text>
          </VStack>
          <Button
            leftIcon={<Icon as={FaPlus} />}
            colorScheme="blue"
            onClick={handleAddOpen}
            size={{ base: 'sm', md: 'md' }}
            borderRadius="lg"
          >
            إضافة كورس جديد
          </Button>
        </Flex>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
          <Card bg={cardBg} shadow="sm" borderRadius="lg">
            <CardBody p={4}>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="xs" color={subTextColor} fontWeight="medium">
                  إجمالي الكورسات
                </Text>
                <Icon as={FaBook} color="blue.500" fontSize="sm" />
              </HStack>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                {courses.length}
              </Text>
            </CardBody>
          </Card>
          <Card bg={cardBg} shadow="sm" borderRadius="lg">
            <CardBody p={4}>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="xs" color={subTextColor} fontWeight="medium">
                  النتائج
                </Text>
                <Icon as={FaSearch} color="green.500" fontSize="sm" />
              </HStack>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                {filteredCourses.length}
              </Text>
            </CardBody>
          </Card>
          <Card bg={cardBg} shadow="sm" borderRadius="lg">
            <CardBody p={4}>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="xs" color={subTextColor} fontWeight="medium">
                  متوسط السعر
                </Text>
                <Icon as={FaDollarSign} color="orange.500" fontSize="sm" />
              </HStack>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                {courses.length > 0
                  ? Math.round(
                      courses.reduce((sum, c) => sum + (parseFloat(c.price) || 0), 0) /
                        courses.length
                    )
                  : 0}{' '}
                ر.س
              </Text>
            </CardBody>
          </Card>
          <Card bg={cardBg} shadow="sm" borderRadius="lg">
            <CardBody p={4}>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="xs" color={subTextColor} fontWeight="medium">
                  الفئات
                </Text>
                <Icon as={FaTag} color="purple.500" fontSize="sm" />
              </HStack>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                {new Set(courses.map((c) => c.category)).size}
              </Text>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Search Section */}
        <Box mb={6}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FaSearch} color={subTextColor} />
            </InputLeftElement>
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث في الكورسات..."
              size="md"
              bg="white"
              _focus={{ borderColor: primaryColor }}
            />
          </InputGroup>
        </Box>

        {/* Error Message */}
        {error && (
          <Alert status="error" mb={6} borderRadius="lg">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing={4} mb={6}>
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                bg={cardBg}
                shadow="md"
                _hover={{ shadow: 'lg', transform: 'translateY(-4px)' }}
                transition="all 0.2s"
                borderRadius="lg"
                overflow="hidden"
                border="1px solid"
                borderColor={borderColor}
                position="relative"
              >
                {/* Category Badge */}
                <Box position="absolute" top={2} right={2} zIndex={2}>
                  <Badge
                    colorScheme={getCategoryColor(course.category)}
                    fontSize="xs"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {course.category}
                  </Badge>
                </Box>

                {/* Action Buttons */}
                <Box position="absolute" top={2} left={2} zIndex={2}>
                  <HStack spacing={1}>
                    <IconButton
                      icon={<FaEdit />}
                      size="xs"
                      colorScheme="blue"
                      bg="white"
                      onClick={() => handleEditOpen(course)}
                      aria-label="تعديل"
                      _hover={{ bg: 'blue.50' }}
                    />
                    <IconButton
                      icon={<FaTrash />}
                      size="xs"
                      colorScheme="red"
                      bg="white"
                      onClick={() => {
                        setDeleteCourseId(course.id);
                        onDeleteOpen();
                      }}
                      aria-label="حذف"
                      _hover={{ bg: 'red.50' }}
                    />
                  </HStack>
                </Box>

                {/* Course Image */}
                {course.image ? (
                  <Box h="180px" overflow="hidden" bg="gray.100">
                    <Image
                      src={course.image}
                      alt={course.title}
                      w="100%"
                      h="100%"
                      objectFit="cover"
                    />
                  </Box>
                ) : (
                  <Box
                    h="180px"
                    bgGradient="linear(to-br, blue.100, purple.100)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={FaBook} fontSize="3xl" color={subTextColor} />
                  </Box>
                )}

                <CardBody p={4}>
                  <VStack align="start" spacing={2} mb={3}>
                    <Heading size="sm" color={textColor} noOfLines={2}>
                      {course.title}
                    </Heading>
                    {course.description && (
                      <Text fontSize="xs" color={subTextColor} noOfLines={2}>
                        {course.description}
                      </Text>
                    )}
                  </VStack>

                  <Divider mb={3} />

                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <HStack spacing={1}>
                        <Icon as={FaDollarSign} color="green.500" fontSize="xs" />
                        <Text fontSize="xs" color={subTextColor}>
                          السعر:
                        </Text>
                      </HStack>
                      <Text fontSize="sm" fontWeight="bold" color="green.600">
                        {course.price} ر.س
                      </Text>
                    </HStack>

                    {course.created_by_name && (
                      <HStack justify="space-between">
                        <HStack spacing={1}>
                          <Icon as={FaUser} color="blue.500" fontSize="xs" />
                          <Text fontSize="xs" color={subTextColor}>
                            أنشأه:
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color={textColor} noOfLines={1}>
                          {course.created_by_name}
                        </Text>
                      </HStack>
                    )}

                    {course.created_at && (
                      <HStack justify="space-between">
                        <HStack spacing={1}>
                          <Icon as={FaCalendar} color="gray.500" fontSize="xs" />
                          <Text fontSize="xs" color={subTextColor}>
                            التاريخ:
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color={textColor}>
                          {new Date(course.created_at).toLocaleDateString('ar-EG')}
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                  <Button
                    mt={4}
                    w="full"
                    size="sm"
                    colorScheme="blue"
                    leftIcon={<Icon as={FaExternalLinkAlt} />}
                    onClick={() => navigate(`/general-course/${course.id}`)}
                  >
                    عرض الكورس
                  </Button>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <Center py={12}>
            <VStack spacing={4}>
              <Icon as={FaBook} fontSize="6xl" color={subTextColor} />
              <Heading size="lg" color={textColor}>
                {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد كورسات'}
              </Heading>
              <Text color={subTextColor}>
                {searchTerm
                  ? 'جرب البحث بكلمات مختلفة'
                  : 'ابدأ بإضافة كورس جديد'}
              </Text>
            </VStack>
          </Center>
        )}
      </Container>

      {/* Add Course Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={onAddClose}
        size={{ base: 'full', md: 'xl' }}
        scrollBehavior="inside"
        motionPreset="slideInBottom"
        isCentered
      >
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(8px)" />
        <ModalContent
          m={{ base: 0, md: 4 }}
          maxH={{ base: '100dvh', md: '92vh' }}
          h={{ base: '100dvh', md: 'auto' }}
          borderRadius={{ base: 0, md: '2xl' }}
          overflow="hidden"
          display="flex"
          flexDirection="column"
          boxShadow="2xl"
          dir="rtl"
        >
          <Box
            flexShrink={0}
            bgGradient="linear(135deg, blue.600 0%, blue.500 50%, cyan.500 100%)"
            px={{ base: 4, md: 6 }}
            pt={{ base: 5, md: 6 }}
            pb={{ base: 4, md: 5 }}
            position="relative"
          >
            <ModalCloseButton
              color="white"
              bg="whiteAlpha.200"
              borderRadius="full"
              top={{ base: 3, md: 4 }}
              right={{ base: 3, md: 4 }}
              _hover={{ bg: 'whiteAlpha.300' }}
            />
            <HStack spacing={3} align="start" pr={10}>
              <Flex
                w={{ base: 11, md: 12 }}
                h={{ base: 11, md: 12 }}
                borderRadius="xl"
                bg="whiteAlpha.200"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Icon as={FaPlus} color="white" boxSize={5} />
              </Flex>
              <Box>
                <Text color="white" fontWeight="extrabold" fontSize={{ base: 'lg', md: 'xl' }} lineHeight="1.3">
                  إضافة كورس جديد
                </Text>
                <Text color="whiteAlpha.900" fontSize={{ base: 'xs', md: 'sm' }} mt={1} lineHeight="1.6">
                  أدخل بيانات الكورس — الحقول بعلامة * مطلوبة
                </Text>
              </Box>
            </HStack>
          </Box>

          <ModalBody
            flex="1"
            overflowY="auto"
            px={{ base: 4, md: 6 }}
            py={{ base: 4, md: 6 }}
            bg={cardBg}
          >
            <VStack spacing={5} align="stretch">
              <Box
                p={{ base: 4, md: 5 }}
                bg={sectionBg}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor={borderColor}
              >
                <HStack spacing={2} mb={4}>
                  <Icon as={FaBook} color="blue.500" />
                  <Text fontWeight="bold" fontSize="sm" color={textColor}>
                    المعلومات الأساسية
                  </Text>
                </HStack>

                <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="semibold" color={textColor} mb={2}>
                      عنوان الكورس
                    </FormLabel>
                    <InputGroup size={{ base: 'lg', md: 'md' }}>
                      <InputLeftElement pointerEvents="none" h="full">
                        <Icon as={FaFileAlt} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="مثال: أساسيات البرمجة"
                        pl={10}
                        borderRadius="xl"
                        bg={inputBg}
                        borderColor={borderColor}
                        _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
                      />
                    </InputGroup>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold" color={textColor} mb={2}>
                      وصف الكورس
                      <Text as="span" fontWeight="normal" color={subTextColor} mr={1}>
                        (اختياري)
                      </Text>
                    </FormLabel>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="اكتب وصفاً مختصراً يوضح محتوى الكورس..."
                      size={{ base: 'lg', md: 'md' }}
                      rows={4}
                      borderRadius="xl"
                      bg={inputBg}
                      borderColor={borderColor}
                      resize="none"
                      _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
                    />
                  </FormControl>
                </VStack>
              </Box>

              <Box
                p={{ base: 4, md: 5 }}
                bg={sectionBg}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor={borderColor}
              >
                <HStack spacing={2} mb={4}>
                  <Icon as={FaTag} color="blue.500" />
                  <Text fontWeight="bold" fontSize="sm" color={textColor}>
                    التسعير والتصنيف
                  </Text>
                </HStack>

                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="semibold" color={textColor} mb={2}>
                      السعر (ر.س)
                    </FormLabel>
                    <InputGroup size={{ base: 'lg', md: 'md' }}>
                      <InputLeftElement pointerEvents="none" h="full">
                        <Icon as={FaDollarSign} color="gray.400" />
                      </InputLeftElement>
                      <NumberInput
                        value={formData.price}
                        onChange={(value) => setFormData({ ...formData, price: parseFloat(value) || 0 })}
                        min={0}
                        precision={2}
                        w="full"
                      >
                        <NumberInputField
                          pl={10}
                          borderRadius="xl"
                          bg={inputBg}
                          borderColor={borderColor}
                          _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
                        />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="semibold" color={textColor} mb={2}>
                      نوع الكورس
                    </FormLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="اختر التصنيف"
                      size={{ base: 'lg', md: 'md' }}
                      borderRadius="xl"
                      bg={inputBg}
                      borderColor={borderColor}
                      _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </SimpleGrid>
              </Box>

              <Box
                p={{ base: 4, md: 5 }}
                bg={sectionBg}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor={borderColor}
              >
                <HStack spacing={2} mb={4}>
                  <Icon as={FaImage} color="blue.500" />
                  <Text fontWeight="bold" fontSize="sm" color={textColor}>
                    صورة الغلاف
                    <Text as="span" fontWeight="normal" color={subTextColor} mr={1}>
                      (اختياري)
                    </Text>
                  </Text>
                </HStack>

                <Box
                  position="relative"
                  border="2px dashed"
                  borderColor={imagePreview ? 'blue.300' : borderColor}
                  borderRadius="2xl"
                  overflow="hidden"
                  bg={imagePreview ? 'blackAlpha.50' : inputBg}
                  minH={{ base: '180px', md: '160px' }}
                  transition="all 0.2s"
                  _hover={{ borderColor: 'blue.400' }}
                >
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    position="absolute"
                    inset={0}
                    w="100%"
                    h="100%"
                    opacity={0}
                    cursor="pointer"
                    zIndex={2}
                  />
                  {imagePreview ? (
                    <>
                      <Image
                        src={imagePreview}
                        alt="معاينة صورة الكورس"
                        w="100%"
                        h={{ base: '200px', md: '180px' }}
                        objectFit="cover"
                      />
                      <Flex
                        position="absolute"
                        inset={0}
                        bg="blackAlpha.500"
                        align="center"
                        justify="center"
                        opacity={0}
                        _hover={{ opacity: 1 }}
                        transition="opacity 0.2s"
                        zIndex={1}
                      >
                        <Badge colorScheme="blue" px={4} py={2} borderRadius="full" fontSize="sm">
                          اضغط لتغيير الصورة
                        </Badge>
                      </Flex>
                    </>
                  ) : (
                    <Center flexDirection="column" minH={{ base: '180px', md: '160px' }} px={4} py={6}>
                      <Flex
                        w={14}
                        h={14}
                        borderRadius="2xl"
                        bg="blue.50"
                        _dark={{ bg: 'blue.900' }}
                        align="center"
                        justify="center"
                        mb={3}
                      >
                        <Icon as={FaImage} fontSize="2xl" color="blue.400" />
                      </Flex>
                      <Text fontSize="sm" fontWeight="semibold" color={textColor} textAlign="center">
                        اضغط لرفع صورة الغلاف
                      </Text>
                      <Text fontSize="xs" color={subTextColor} mt={1} textAlign="center" lineHeight="1.6">
                        JPG · PNG · GIF · WebP
                      </Text>
                    </Center>
                  )}
                </Box>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter
            flexShrink={0}
            bg={modalFooterBg}
            borderTopWidth="1px"
            borderColor={borderColor}
            px={{ base: 4, md: 6 }}
            py={{ base: 4, md: 4 }}
            pb={{ base: 'max(16px, env(safe-area-inset-bottom))', md: 4 }}
            borderRadius={{ base: 0, md: '0 0 2xl 2xl' }}
          >
            <Flex
              direction={{ base: 'column-reverse', sm: 'row' }}
              w="full"
              gap={3}
            >
              <Button
                onClick={onAddClose}
                variant="outline"
                size={{ base: 'lg', md: 'md' }}
                borderRadius="xl"
                flex={{ base: 1, sm: 'none' }}
                w={{ sm: 'auto' }}
                minH={{ base: '48px', md: 'auto' }}
              >
                إلغاء
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleAddSubmit}
                isLoading={submitting}
                loadingText="جاري الإضافة..."
                leftIcon={<Icon as={FaPlus} />}
                size={{ base: 'lg', md: 'md' }}
                borderRadius="xl"
                fontWeight="bold"
                flex={1}
                minH={{ base: '48px', md: 'auto' }}
                boxShadow="0 4px 14px rgba(49, 130, 206, 0.35)"
              >
                إضافة الكورس
              </Button>
            </Flex>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Course Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size={{ base: 'full', sm: 'lg' }} isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent m={{ base: 0, sm: 4 }} borderRadius="xl" boxShadow="2xl">
          <ModalHeader
            bgGradient="linear(to-r, green.500, green.600)"
            color="white"
            borderRadius="xl xl 0 0"
            py={4}
            fontSize={{ base: 'md', sm: 'lg' }}
          >
            <HStack spacing={2}>
              <Icon as={FaEdit} />
              <Text fontWeight="bold">تعديل الكورس</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody py={6}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                  عنوان الكورس
                </FormLabel>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="أدخل عنوان الكورس"
                  size="md"
                  borderRadius="md"
                  _focus={{ borderColor: primaryColor, boxShadow: `0 0 0 1px ${primaryColor}` }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                  وصف الكورس
                </FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="أدخل وصف الكورس (اختياري)"
                  size="md"
                  rows={4}
                  borderRadius="md"
                  _focus={{ borderColor: primaryColor, boxShadow: `0 0 0 1px ${primaryColor}` }}
                />
              </FormControl>

              <HStack spacing={4}>
                <FormControl isRequired flex={1}>
                  <FormLabel fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                    السعر (ر.س)
                  </FormLabel>
                  <NumberInput
                    value={formData.price}
                    onChange={(value) => setFormData({ ...formData, price: parseFloat(value) || 0 })}
                    min={0}
                    precision={2}
                    size="md"
                  >
                    <NumberInputField
                      borderRadius="md"
                      _focus={{ borderColor: primaryColor, boxShadow: `0 0 0 1px ${primaryColor}` }}
                    />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl isRequired flex={1}>
                  <FormLabel fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                    نوع الكورس
                  </FormLabel>
                  <Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="اختر نوع الكورس"
                    size="md"
                    borderRadius="md"
                    _focus={{ borderColor: primaryColor, boxShadow: `0 0 0 1px ${primaryColor}` }}
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                  صورة الكورس (اختياري)
                </FormLabel>
                <Box
                  p={4}
                  border="2px dashed"
                  borderColor={borderColor}
                  borderRadius="md"
                  textAlign="center"
                  _hover={{ borderColor: primaryColor, bg: 'blue.50' }}
                  transition="all 0.2s"
                  cursor="pointer"
                  position="relative"
                >
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    position="absolute"
                    top={0}
                    left={0}
                    w="100%"
                    h="100%"
                    opacity={0}
                    cursor="pointer"
                  />
                  <VStack spacing={2}>
                    <Icon as={FaImage} fontSize="2xl" color={subTextColor} />
                    <Text fontSize="xs" color={subTextColor}>
                      اضغط لاختيار صورة جديدة أو اسحبها هنا
                    </Text>
                    <Text fontSize="xs" color={subTextColor} fontWeight="medium">
                      الصيغ المقبولة: JPG, PNG, GIF, WebP
                    </Text>
                  </VStack>
                </Box>
                {imagePreview && (
                  <Box mt={3} borderRadius="md" overflow="hidden" border="1px solid" borderColor={borderColor}>
                    <Image src={imagePreview} alt="Preview" maxH="200px" w="100%" objectFit="cover" />
                  </Box>
                )}
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter bg="gray.50" borderRadius="0 0 xl xl" py={4}>
            <HStack spacing={3} w="full" justify="flex-end">
              <Button onClick={onEditClose} variant="outline" size="md" borderRadius="md">
                إلغاء
              </Button>
              <Button
                colorScheme="green"
                onClick={handleEditSubmit}
                isLoading={submitting}
                loadingText="جاري..."
                leftIcon={<Icon as={FaEdit} />}
                size="md"
                borderRadius="md"
                fontWeight="bold"
              >
                تحديث
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <AlertDialogOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <AlertDialogContent borderRadius="xl" boxShadow="2xl">
          <AlertDialogHeader
            fontSize="lg"
            fontWeight="bold"
            bgGradient="linear(to-r, red.500, red.600)"
            color="white"
            borderRadius="xl xl 0 0"
            py={4}
          >
            <HStack spacing={2}>
              <Icon as={FaTrash} />
              <Text>تأكيد الحذف</Text>
            </HStack>
          </AlertDialogHeader>
          <AlertDialogBody py={6}>
            <VStack spacing={3} align="start">
              <Alert status="warning" borderRadius="md" w="full">
                <AlertIcon />
                <Text fontSize="sm">
                  هل أنت متأكد من حذف هذا الكورس؟ لا يمكن التراجع عن هذه العملية.
                </Text>
              </Alert>
            </VStack>
          </AlertDialogBody>
          <AlertDialogFooter bg="gray.50" borderRadius="0 0 xl xl" py={4}>
            <HStack spacing={3} w="full" justify="flex-end">
              <Button onClick={onDeleteClose} variant="outline" size="md" borderRadius="md">
                إلغاء
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                isLoading={submitting}
                loadingText="جاري..."
                leftIcon={<Icon as={FaTrash} />}
                size="md"
                borderRadius="md"
                fontWeight="bold"
              >
                حذف
              </Button>
            </HStack>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  );
};

export default GeneralCourses;

