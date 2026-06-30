import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Flex,
  VStack,
  HStack,
  Card,
  CardBody,
  CardFooter,
  Image,
  Badge,
  Spinner,
  Center,
  useColorModeValue,
  Icon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  IconButton,
  Tooltip,
  SimpleGrid,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  AspectRatio
} from '@chakra-ui/react';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiEye, 
  FiPackage, 
  FiDollarSign, 
  FiUsers,
  FiBookOpen,
  FiCalendar,
  FiImage,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiLayers
} from 'react-icons/fi';
import baseUrl from '../../api/baseUrl';
import ScrollToTop from '../scollToTop/ScrollToTop';

const PackagesManagement = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    grade_id: '',
    description: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const toast = useToast({
    position: 'top-right',
    duration: 4000,
    isClosable: true,
    containerStyle: {
      marginTop: '80px',
    },
  });
  
  // Color mode values - Blue.500 as primary
  const bgGradient = useColorModeValue(
    "linear-gradient(135deg, #EBF8FF 0%, #BEE3F8 100%)",
    "linear-gradient(135deg, #1a202c 0%, #2d3748 100%)"
  );
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subTextColor = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const primaryColor = "blue.500";
  const headerBg = useColorModeValue(
    "linear-gradient(135deg, #3182CE 0%, #2C5282 100%)",
    "linear-gradient(135deg, #2C5282 0%, #1a202c 100%)"
  );
  const statCardBg = useColorModeValue(
    "linear-gradient(135deg, #3182CE 0%, #2C5282 100%)",
    "linear-gradient(135deg, #2C5282 0%, #1a202c 100%)"
  );
  const blueGradient = "linear-gradient(135deg, #3182CE 0%, #2B6CB0 100%)";
  const blueLight = useColorModeValue("blue.50", "blue.900");
  const blueMedium = useColorModeValue("blue.100", "blue.800");

  // جلب الباقات
  const fetchPackages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await baseUrl.get('/api/packages', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data?.packages) {
        setPackages(response.data.packages);
      } else {
        setPackages([]);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب الباقات',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // جلب الصفوف الدراسية
  const fetchGrades = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await baseUrl.get('/api/users/grades', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data?.grades) {
        setGrades(response.data.grades || []);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  // فتح نافذة إنشاء/تعديل باقة
  const openPackageModal = (packageData = null) => {
    if (packageData) {
      // وضع التعديل
      setIsEditMode(true);
      setSelectedPackage(packageData);
      setFormData({
        name: packageData.name || '',
        price: packageData.price || '',
        grade_id: packageData.grade_id || '',
        description: packageData.description || ''
      });
      setImagePreview(packageData.image || null);
      setSelectedImage(null);
    } else {
      // وضع الإنشاء
      setIsEditMode(false);
      setSelectedPackage(null);
      setFormData({
        name: '',
        price: '',
        grade_id: '',
        description: ''
      });
      setImagePreview(null);
      setSelectedImage(null);
    }
    onOpen();
  };

  // معالجة تغيير الصورة
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // إنشاء باقة جديدة
  const handleCreatePackage = async () => {
    if (!formData.name || !formData.price || !formData.grade_id) {
      toast({
        title: 'حقول مطلوبة! ⚠️',
        description: 'يرجى ملء جميع الحقول المطلوبة (الاسم، السعر، الصف الدراسي)',
        status: 'warning',
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('grade_id', formData.grade_id);
      if (formData.description) {
        formDataToSend.append('description', formData.description);
      }
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      const response = await baseUrl.post('/api/packages', formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data?.success) {
        const newPackage = response.data?.package || response.data?.data;
        
        // إضافة الباقة فوراً للقائمة
        if (newPackage) {
          setPackages(prev => [newPackage, ...prev]);
        } else {
          // إذا لم تأت الباقة في الرد، نجلبها
          fetchPackages();
        }
        
        toast({
          title: 'تم الإنشاء بنجاح! 🎉',
          description: `تم إنشاء الباقة "${formData.name}" بنجاح وتم إضافتها للقائمة`,
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top-right',
          icon: <Icon as={FiCheckCircle} />,
        });
        onClose();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating package:', error);
      toast({
        title: 'فشل الإنشاء! ❌',
        description: error.response?.data?.message || 'حدث خطأ أثناء إنشاء الباقة. يرجى المحاولة مرة أخرى',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
        icon: <Icon as={FiXCircle} />,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // تحديث باقة موجودة
  const handleUpdatePackage = async () => {
    if (!formData.name || !formData.price || !formData.grade_id) {
      toast({
        title: 'حقول مطلوبة! ⚠️',
        description: 'يرجى ملء جميع الحقول المطلوبة (الاسم، السعر، الصف الدراسي)',
        status: 'warning',
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('grade_id', formData.grade_id);
      if (formData.description) {
        formDataToSend.append('description', formData.description);
      }
      if (selectedImage) {
        formDataToSend.append('image', selectedImage);
      }

      const response = await baseUrl.put(`/api/packages/${selectedPackage.id}`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data?.success) {
        const updatedPackage = response.data?.package || response.data?.data;
        
        // تحديث الباقة فوراً في القائمة
        if (updatedPackage) {
          setPackages(prev => prev.map(p => 
            p.id === selectedPackage.id ? { ...p, ...updatedPackage } : p
          ));
        } else {
          // إذا لم تأت الباقة المحدثة في الرد، نجلبها
          fetchPackages();
        }
        
        toast({
          title: 'تم التحديث بنجاح! ✨',
          description: `تم تحديث الباقة "${formData.name}" بنجاح`,
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top-right',
          icon: <Icon as={FiCheckCircle} />,
        });
        onClose();
        resetForm();
      }
    } catch (error) {
      console.error('Error updating package:', error);
      toast({
        title: 'فشل التحديث! ❌',
        description: error.response?.data?.message || 'حدث خطأ أثناء تحديث الباقة. يرجى المحاولة مرة أخرى',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
        icon: <Icon as={FiXCircle} />,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // حذف باقة
  const handleDeletePackage = async () => {
    if (!selectedPackage) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await baseUrl.delete(`/api/packages/${selectedPackage.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data?.success) {
        const deletedPackageName = selectedPackage.name;
        
        // حذف الباقة فوراً من القائمة
        setPackages(prev => prev.filter(p => p.id !== selectedPackage.id));
        
        toast({
          title: 'تم الحذف بنجاح! 🗑️',
          description: `تم حذف الباقة "${deletedPackageName}" بنجاح`,
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top-right',
          icon: <Icon as={FiCheckCircle} />,
        });
        setIsDeleteDialogOpen(false);
        setSelectedPackage(null);
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      toast({
        title: 'فشل الحذف! ❌',
        description: error.response?.data?.message || 'حدث خطأ أثناء حذف الباقة. يرجى المحاولة مرة أخرى',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
        icon: <Icon as={FiXCircle} />,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      grade_id: '',
      description: ''
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  useEffect(() => {
    fetchPackages();
    fetchGrades();
  }, []);

  if (loading && packages.length === 0) {
    return (
      <Box 
        minH="100vh" 
        bg={bgGradient}
        display="flex" 
        alignItems="center" 
        justifyContent="center"
      >
        <VStack spacing={6}>
          <Spinner 
            size="xl" 
            thickness="4px"
            speed="0.65s"
            color={primaryColor}
            emptyColor="gray.200"
          />
          <VStack spacing={2}>
            <Text fontSize="xl" fontWeight="bold" color={textColor}>
              جاري تحميل الباقات...
            </Text>
            <Text fontSize="sm" color={subTextColor}>
              يرجى الانتظار قليلاً
            </Text>
          </VStack>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bgGradient} pt="80px" pb={12} px={4}>
      <Container maxW="7xl">
        {/* Header Section with Gradient */}
        <Box
          bg={headerBg}
          borderRadius="2xl"
          p={8}
          mb={8}
          boxShadow="2xl"
          position="relative"
          overflow="hidden"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <VStack spacing={4} textAlign="center" position="relative" zIndex={1}>
            <HStack spacing={3}>
              <Icon as={FiPackage} boxSize={10} color="white" />
              <Heading size="2xl" color="white" fontWeight="bold">
                إدارة الباقات التعليمية
              </Heading>
            </HStack>
            <Text fontSize="lg" color="whiteAlpha.900" maxW="2xl">
              إنشاء وإدارة باقات الدورات التعليمية بسهولة واحترافية
            </Text>
          </VStack>
        </Box>

        {/* Statistics Cards with Blue Theme */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6} mb={10}>
          <Card 
            bg={statCardBg}
            shadow="xl"
            borderRadius="xl"
            overflow="hidden"
            _hover={{ transform: 'translateY(-5px)', shadow: '2xl' }}
            transition="all 0.3s ease"
            border="none"
          >
            <CardBody p={6} textAlign="center" color="white">
              <VStack spacing={3}>
                <Box
                  bg="whiteAlpha.200"
                  borderRadius="full"
                  p={3}
                  backdropFilter="blur(10px)"
                >
                  <Icon as={FiLayers} boxSize={6} />
                </Box>
                <Stat>
                  <StatLabel fontSize="sm" color="whiteAlpha.900" fontWeight="medium">
                    إجمالي الباقات
                  </StatLabel>
                  <StatNumber fontSize="3xl" fontWeight="bold" color="white">
                    {packages.length}
                  </StatNumber>
                  <StatHelpText color="whiteAlpha.800" fontSize="xs">
                    <StatArrow type="increase" />
                    {packages.length} باقة متاحة
                  </StatHelpText>
                </Stat>
              </VStack>
            </CardBody>
          </Card>
          
          <Card 
            bg="linear-gradient(135deg, #2B6CB0 0%, #3182CE 100%)"
            shadow="xl"
            borderRadius="xl"
            overflow="hidden"
            _hover={{ transform: 'translateY(-5px)', shadow: '2xl' }}
            transition="all 0.3s ease"
            border="none"
          >
            <CardBody p={6} textAlign="center" color="white">
              <VStack spacing={3}>
                <Box
                  bg="whiteAlpha.200"
                  borderRadius="full"
                  p={3}
                  backdropFilter="blur(10px)"
                >
                  <Icon as={FiCheckCircle} boxSize={6} />
                </Box>
                <Stat>
                  <StatLabel fontSize="sm" color="whiteAlpha.900" fontWeight="medium">
                    الباقات النشطة
                  </StatLabel>
                  <StatNumber fontSize="3xl" fontWeight="bold" color="white">
                    {packages.filter(p => p.is_active !== false).length}
                  </StatNumber>
                  <StatHelpText color="whiteAlpha.800" fontSize="xs">
                    <StatArrow type="increase" />
                    نشطة ومتاحة
                  </StatHelpText>
                </Stat>
              </VStack>
            </CardBody>
          </Card>
          
          <Card 
            bg="linear-gradient(135deg, #3182CE 0%, #4299E1 100%)"
            shadow="xl"
            borderRadius="xl"
            overflow="hidden"
            _hover={{ transform: 'translateY(-5px)', shadow: '2xl' }}
            transition="all 0.3s ease"
            border="none"
          >
            <CardBody p={6} textAlign="center" color="white">
              <VStack spacing={3}>
                <Box
                  bg="whiteAlpha.200"
                  borderRadius="full"
                  p={3}
                  backdropFilter="blur(10px)"
                >
                  <Icon as={FiDollarSign} boxSize={6} />
                </Box>
                <Stat>
                  <StatLabel fontSize="sm" color="whiteAlpha.900" fontWeight="medium">
                    متوسط السعر
                  </StatLabel>
                  <StatNumber fontSize="3xl" fontWeight="bold" color="white">
                    {packages.length > 0 
                      ? (packages.reduce((sum, p) => sum + parseFloat(p.price), 0) / packages.length).toFixed(0)
                      : '0'
                    }
                  </StatNumber>
                  <StatHelpText color="whiteAlpha.800" fontSize="xs">
                    جنيه مصري
                  </StatHelpText>
                </Stat>
              </VStack>
            </CardBody>
          </Card>
          
          <Card 
            bg="linear-gradient(135deg, #2C5282 0%, #3182CE 100%)"
            shadow="xl"
            borderRadius="xl"
            overflow="hidden"
            _hover={{ transform: 'translateY(-5px)', shadow: '2xl' }}
            transition="all 0.3s ease"
            border="none"
          >
            <CardBody p={6} textAlign="center" color="white">
              <VStack spacing={3}>
                <Box
                  bg="whiteAlpha.200"
                  borderRadius="full"
                  p={3}
                  backdropFilter="blur(10px)"
                >
                  <Icon as={FiBookOpen} boxSize={6} />
                </Box>
                <Stat>
                  <StatLabel fontSize="sm" color="whiteAlpha.900" fontWeight="medium">
                    الصفوف المغطاة
                  </StatLabel>
                  <StatNumber fontSize="3xl" fontWeight="bold" color="white">
                    {new Set(packages.map(p => p.grade_id)).size}
                  </StatNumber>
                  <StatHelpText color="whiteAlpha.800" fontSize="xs">
                    <StatArrow type="increase" />
                    صف دراسي مختلف
                  </StatHelpText>
                </Stat>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Action Buttons Section */}
        <Flex 
          justify="space-between" 
          align="center" 
          mb={8}
          flexWrap="wrap"
          gap={4}
        >
          <VStack align="start" spacing={1}>
            <Heading size="xl" color={textColor} fontWeight="bold">
              الباقات المتاحة
            </Heading>
            <Text fontSize="sm" color={subTextColor}>
              إدارة وعرض جميع الباقات التعليمية
            </Text>
          </VStack>
          <Button
            leftIcon={<Icon as={FiPlus} />}
            bg={blueGradient}
            color="white"
            size="lg"
            px={8}
            py={6}
            borderRadius="xl"
            onClick={() => openPackageModal()}
            _hover={{ 
              transform: 'translateY(-3px)', 
              shadow: 'xl',
              bg: "linear-gradient(135deg, #2C5282 0%, #3182CE 100%)"
            }}
            _active={{ transform: 'translateY(0px)' }}
            transition="all 0.3s ease"
            fontWeight="bold"
            boxShadow="lg"
          >
            إنشاء باقة جديدة
          </Button>
        </Flex>

        {/* Packages Grid */}
        {packages.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {packages.map((packageItem) => (
              <Card
                key={packageItem.id}
                bg={cardBg}
                shadow="lg"
                borderRadius="xl"
                overflow="hidden"
                border="none"
                cursor="pointer"
                onClick={() => navigate(`/package/${packageItem.id}`)}
                _hover={{ 
                  transform: 'translateY(-8px)', 
                  shadow: '2xl',
                }}
                transition="all 0.3s ease"
                position="relative"
                group
              >
                {/* Package Image */}
                <Box position="relative" overflow="hidden" h="220px">
                  <Image
                    src={packageItem.image || 'https://via.placeholder.com/400x225?text=صورة+الباقة'}
                    alt={packageItem.name}
                    objectFit="cover"
                    w="100%"
                    h="100%"
                    fallbackSrc="https://via.placeholder.com/400x225?text=صورة+الباقة"
                    transition="transform 0.5s ease"
                    _groupHover={{ transform: 'scale(1.1)' }}
                  />
                  
                  {/* Overlay Gradient */}
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    bg="linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 100%)"
                  />
                  
                  {/* Price Badge */}
                  <Box
                    position="absolute"
                    top={4}
                    right={4}
                    bg="white"
                    color={primaryColor}
                    px={4}
                    py={2}
                    borderRadius="full"
                    boxShadow="lg"
                    fontWeight="bold"
                    fontSize="md"
                  >
                    <HStack spacing={1}>
                      <Icon as={FiDollarSign} />
                      <Text>{packageItem.price} جنيه</Text>
                    </HStack>
                  </Box>
                </Box>

                <CardBody p={5}>
                  {/* Package Name */}
                  <Heading 
                    size="md" 
                    mb={3} 
                    color={textColor} 
                    noOfLines={2}
                    fontWeight="bold"
                    lineHeight="1.3"
                  >
                    {packageItem.name}
                  </Heading>
                  
                  {/* Grade */}
                  <HStack spacing={2} mb={3}>
                    <Icon as={FiBookOpen} color={primaryColor} boxSize={4} />
                    <Badge 
                      bg={blueLight}
                      color={primaryColor}
                      variant="subtle"
                      px={3}
                      py={1}
                      borderRadius="md"
                      fontSize="xs"
                      fontWeight="semibold"
                    >
                      {packageItem.grade_name}
                    </Badge>
                  </HStack>

                  {/* Subjects */}
                  {packageItem.subjects && packageItem.subjects.length > 0 && (
                    <VStack spacing={2} align="start" mb={3}>
                      <Text fontSize="xs" color={subTextColor} fontWeight="medium">
                        المواد:
                      </Text>
                      <HStack spacing={1.5} flexWrap="wrap">
                        {packageItem.subjects.slice(0, 3).map((subject) => (
                          <Badge 
                            key={subject.id} 
                            bg={primaryColor}
                            color="white"
                            variant="solid" 
                            px={2.5}
                            py={0.5}
                            borderRadius="md"
                            fontSize="xs"
                            fontWeight="medium"
                          >
                            {subject.name}
                          </Badge>
                        ))}
                        {packageItem.subjects.length > 3 && (
                          <Badge 
                            bg={blueLight}
                            color={primaryColor}
                            variant="subtle" 
                            px={2.5}
                            py={0.5}
                            borderRadius="md"
                            fontSize="xs"
                            fontWeight="medium"
                          >
                            +{packageItem.subjects.length - 3}
                          </Badge>
                        )}
                      </HStack>
                    </VStack>
                  )}

                  {/* Created Date */}
                  <HStack 
                    spacing={1.5} 
                    fontSize="xs" 
                    color={subTextColor}
                    mt="auto"
                  >
                    <Icon as={FiCalendar} boxSize={3} />
                    <Text>
                      {new Date(packageItem.created_at).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                  </HStack>
                </CardBody>

                <CardFooter p={4} pt={0} borderTop="1px solid" borderColor={borderColor}>
                  <HStack spacing={2} w="full" justify="center">
                    <Button
                      leftIcon={<Icon as={FiEye} />}
                      bg={primaryColor}
                      color="white"
                      size="sm"
                      flex={1}
                      borderRadius="md"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/package/${packageItem.id}`);
                      }}
                      _hover={{ 
                        bg: "blue.600",
                        transform: 'translateY(-2px)',
                        shadow: 'md'
                      }}
                      transition="all 0.2s ease"
                      fontWeight="semibold"
                    >
                      عرض
                    </Button>
                    <Button
                      leftIcon={<Icon as={FiEdit2} />}
                      bg={primaryColor}
                      color="white"
                      size="sm"
                      flex={1}
                      borderRadius="md"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPackageModal(packageItem);
                      }}
                      _hover={{ 
                        bg: "blue.600",
                        transform: 'translateY(-2px)',
                        shadow: 'md'
                      }}
                      transition="all 0.2s ease"
                      fontWeight="semibold"
                    >
                      تعديل
                    </Button>
                    
                    <Button
                      leftIcon={<Icon as={FiTrash2} />}
                      bg="red.500"
                      color="white"
                      size="sm"
                      flex={1}
                      borderRadius="md"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPackage(packageItem);
                        setIsDeleteDialogOpen(true);
                      }}
                      _hover={{ 
                        bg: "red.600",
                        transform: 'translateY(-2px)',
                        shadow: 'md'
                      }}
                      transition="all 0.2s ease"
                      fontWeight="semibold"
                    >
                      حذف
                    </Button>
                  </HStack>
                </CardFooter>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <Center py={20}>
            <VStack spacing={6}>
              <Box
                bg={blueGradient}
                borderRadius="full"
                p={8}
                boxShadow="2xl"
              >
                <Icon as={FiPackage} boxSize={20} color="white" />
              </Box>
              <VStack spacing={2}>
                <Heading size="xl" color={textColor} fontWeight="bold">
                  لا توجد باقات متاحة
                </Heading>
                <Text color={subTextColor} fontSize="lg" textAlign="center" maxW="md">
                  ابدأ رحلتك بإنشاء أول باقة تعليمية وتقديم محتوى مميز للطلاب
                </Text>
              </VStack>
              <Button
                bg={blueGradient}
                color="white"
                size="lg"
                px={8}
                py={6}
                borderRadius="xl"
                leftIcon={<Icon as={FiPlus} />}
                onClick={() => openPackageModal()}
                _hover={{ 
                  transform: 'translateY(-3px)', 
                  shadow: 'xl',
                  bg: "linear-gradient(135deg, #2C5282 0%, #3182CE 100%)"
                }}
                transition="all 0.3s ease"
                fontWeight="bold"
                boxShadow="lg"
              >
                إنشاء أول باقة
              </Button>
            </VStack>
          </Center>
        )}

        {/* Create/Edit Package Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
          <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
          <ModalContent borderRadius="2xl" overflow="hidden" boxShadow="2xl">
            <Box
              bg={blueGradient}
              p={6}
              color="white"
            >
              <ModalHeader p={0}>
                <HStack spacing={3}>
                  <Icon as={FiPackage} boxSize={6} />
                  <Text fontSize="xl" fontWeight="bold">
                    {isEditMode ? 'تعديل الباقة' : 'إنشاء باقة جديدة'}
                  </Text>
                </HStack>
              </ModalHeader>
              <ModalCloseButton 
                color="white" 
                _hover={{ bg: 'whiteAlpha.200' }}
                size="lg"
              />
            </Box>
            <ModalBody p={6} bg={cardBg}>
              <VStack spacing={6} align="stretch">
                {/* Package Name */}
                <FormControl isRequired>
                  <FormLabel fontWeight="bold" color={textColor} fontSize="md" mb={2}>
                    اسم الباقة
                  </FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="أدخل اسم الباقة"
                    borderColor={borderColor}
                    borderRadius="lg"
                    size="lg"
                    _focus={{ 
                      borderColor: primaryColor, 
                      boxShadow: `0 0 0 3px ${primaryColor}33`,
                      borderWidth: '2px'
                    }}
                    _hover={{ borderColor: primaryColor }}
                    transition="all 0.2s"
                  />
                </FormControl>

                {/* Price and Grade */}
                <HStack spacing={4}>
                  <FormControl isRequired flex={1}>
                    <FormLabel fontWeight="bold" color={textColor} fontSize="md" mb={2}>
                      السعر (جنيه مصري)
                    </FormLabel>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                      borderColor={borderColor}
                      borderRadius="lg"
                      size="lg"
                      _focus={{ 
                        borderColor: primaryColor, 
                        boxShadow: `0 0 0 3px ${primaryColor}33`,
                        borderWidth: '2px'
                      }}
                      _hover={{ borderColor: primaryColor }}
                      transition="all 0.2s"
                    />
                  </FormControl>

                  <FormControl isRequired flex={1}>
                    <FormLabel fontWeight="bold" color={textColor} fontSize="md" mb={2}>
                      الصف الدراسي
                    </FormLabel>
                    <Select
                      value={formData.grade_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, grade_id: e.target.value }))}
                      placeholder="اختر الصف الدراسي"
                      borderColor={borderColor}
                      borderRadius="lg"
                      size="lg"
                      _focus={{ 
                        borderColor: primaryColor, 
                        boxShadow: `0 0 0 3px ${primaryColor}33`,
                        borderWidth: '2px'
                      }}
                      _hover={{ borderColor: primaryColor }}
                      transition="all 0.2s"
                    >
                      {grades.map((grade) => (
                        <option key={grade.id} value={grade.id}>
                          {grade.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </HStack>

                {/* Description */}
                <FormControl>
                  <FormLabel fontWeight="bold" color={textColor} fontSize="md" mb={2}>
                    وصف الباقة (اختياري)
                  </FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="أدخل وصفاً للباقة..."
                    rows={4}
                    borderColor={borderColor}
                    borderRadius="lg"
                    size="lg"
                    _focus={{ 
                      borderColor: primaryColor, 
                      boxShadow: `0 0 0 3px ${primaryColor}33`,
                      borderWidth: '2px'
                    }}
                    _hover={{ borderColor: primaryColor }}
                    transition="all 0.2s"
                  />
                </FormControl>

                {/* Image Upload */}
                <FormControl>
                  <FormLabel fontWeight="bold" color={textColor} fontSize="md" mb={2}>
                    صورة الباقة (اختياري)
                  </FormLabel>
                  <VStack spacing={4} align="stretch">
                    <Box
                      border="2px dashed"
                      borderColor={borderColor}
                      borderRadius="xl"
                      p={6}
                      textAlign="center"
                      bg={useColorModeValue("gray.50", "gray.700")}
                      _hover={{ 
                        borderColor: primaryColor,
                        bg: useColorModeValue("blue.50", "blue.900")
                      }}
                      transition="all 0.3s"
                      cursor="pointer"
                    >
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        border="none"
                        position="absolute"
                        opacity={0}
                        width="100%"
                        height="100%"
                        cursor="pointer"
                        zIndex={1}
                      />
                      <VStack spacing={2}>
                        <Icon as={FiImage} boxSize={8} color={primaryColor} />
                        <Text color={textColor} fontWeight="medium">
                          اضغط لاختيار صورة الباقة
                        </Text>
                        <Text fontSize="xs" color={subTextColor}>
                          PNG, JPG, GIF حتى 10MB
                        </Text>
                      </VStack>
                    </Box>
                    
                    {imagePreview && (
                      <Box
                        border="2px solid"
                        borderColor={primaryColor}
                        borderRadius="xl"
                        p={4}
                        textAlign="center"
                        bg={useColorModeValue("gray.50", "gray.700")}
                        position="relative"
                      >
                        <Image
                          src={imagePreview}
                          alt="معاينة الصورة"
                          maxH="250px"
                          mx="auto"
                          borderRadius="lg"
                          boxShadow="md"
                        />
                      </Box>
                    )}
                  </VStack>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter p={6} bg={useColorModeValue("gray.50", "gray.700")} borderTop="1px solid" borderColor={borderColor}>
              <HStack spacing={3} w="full" justify="flex-end">
                <Button 
                  onClick={onClose} 
                  variant="outline"
                  size="lg"
                  borderRadius="xl"
                  px={6}
                  _hover={{ bg: useColorModeValue("gray.100", "gray.600") }}
                >
                  إلغاء
                </Button>
                <Button
                  bg={blueGradient}
                  color="white"
                  onClick={isEditMode ? handleUpdatePackage : handleCreatePackage}
                  isLoading={actionLoading}
                  loadingText={isEditMode ? "جاري التحديث..." : "جاري الإنشاء..."}
                  leftIcon={<Icon as={isEditMode ? FiEdit2 : FiPlus} />}
                  size="lg"
                  px={8}
                  borderRadius="xl"
                  fontWeight="bold"
                  _hover={{ 
                    transform: 'translateY(-2px)',
                    shadow: 'xl',
                    bg: "linear-gradient(135deg, #2C5282 0%, #3182CE 100%)"
                  }}
                  transition="all 0.3s ease"
                >
                  {isEditMode ? 'تحديث الباقة' : 'إنشاء الباقة'}
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          isCentered
        >
          <AlertDialogOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
          <AlertDialogContent borderRadius="2xl" overflow="hidden" boxShadow="2xl">
            <Box
              bg="red.500"
              p={6}
              color="white"
            >
              <AlertDialogHeader fontSize="xl" fontWeight="bold" p={0}>
                <HStack spacing={3}>
                  <Icon as={FiTrash2} boxSize={6} />
                  <Text>حذف الباقة</Text>
                </HStack>
              </AlertDialogHeader>
            </Box>
            <AlertDialogBody p={6} bg={cardBg}>
              <VStack spacing={4} align="start">
                <Text color={textColor} fontSize="md">
                  هل أنت متأكد من حذف الباقة <strong>"{selectedPackage?.name}"</strong>؟
                </Text>
                <Box
                  p={4}
                  bg={useColorModeValue("red.50", "red.900")}
                  borderRadius="lg"
                  borderLeft="4px solid"
                  borderColor="red.500"
                  w="full"
                >
                  <Text color={useColorModeValue("red.800", "red.200")} fontSize="sm" fontWeight="medium">
                    ⚠️ تحذير: لا يمكن التراجع عن هذا الإجراء بعد التنفيذ
                  </Text>
                </Box>
              </VStack>
            </AlertDialogBody>
            <AlertDialogFooter p={6} bg={useColorModeValue("gray.50", "gray.700")} borderTop="1px solid" borderColor={borderColor}>
              <HStack spacing={3} w="full" justify="flex-end">
                <Button 
                  onClick={() => setIsDeleteDialogOpen(false)}
                  variant="outline"
                  size="lg"
                  borderRadius="xl"
                  px={6}
                  _hover={{ bg: useColorModeValue("gray.100", "gray.600") }}
                >
                  إلغاء
                </Button>
                <Button 
                  bg="red.500"
                  color="white"
                  onClick={handleDeletePackage} 
                  size="lg"
                  px={8}
                  borderRadius="xl"
                  fontWeight="bold"
                  isLoading={actionLoading}
                  _hover={{ 
                    transform: 'translateY(-2px)',
                    shadow: 'xl',
                    bg: "red.600"
                  }}
                  transition="all 0.3s ease"
                >
                  حذف الباقة
                </Button>
              </HStack>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Container>
      <ScrollToTop/>
    </Box>
  );
};

export default PackagesManagement;
