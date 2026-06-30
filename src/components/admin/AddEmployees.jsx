import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Card,
  CardBody,
  Heading,
  Text,
  Checkbox,
  CheckboxGroup,
  SimpleGrid,
  Icon,
  useColorModeValue,
  Alert,
  AlertIcon,
  Divider,
  Badge,
} from '@chakra-ui/react';
import {
  FaUserPlus,
  FaEnvelope,
  FaLock,
  FaPhone,
  FaShieldAlt,
  FaSave,
  FaUsers,
  FaBook,
  FaCalculator,
  FaGraduationCap,
  FaChartBar,
  FaUserCog,
  FaTasks,
} from 'react-icons/fa';
import baseUrl from '../../api/baseUrl';

const AddEmployees = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    permissions: [],
  });

  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // ألوان الثيم
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // قائمة الصلاحيات المتاحة
  const availablePermissions = [
    {
      key: 'can_add_teachers',
      label: 'إضافة مدرس جديد',
      description: 'إمكانية إضافة مدرسين جدد للمنصة',
      icon: FaUserPlus,
      color: 'blue',
    },
    {
      key: 'can_edit_teachers',
      label: 'تعديل بيانات المدرسين',
      description: 'إمكانية تعديل بيانات المدرسين الموجودة',
      icon: FaUserPlus,
      color: 'green',
    },
    {
      key: 'can_delete_teachers',
      label: 'حذف المدرسين',
      description: 'إمكانية حذف المدرسين من المنصة',
      icon: FaUserPlus,
      color: 'red',
    },
    {
      key: 'can_manage_students',
      label: 'إدارة الطلاب',
      description: 'إدارة بيانات الطلاب والمجموعات',
      icon: FaUsers,
      color: 'purple',
    },
    {
      key: 'can_manage_courses',
      label: 'إدارة الكورسات والمحتوى',
      description: 'إدارة الكورسات والمحتويات التعليمية',
      icon: FaBook,
      color: 'orange',
    },
    {
      key: 'can_manage_accounting',
      label: 'إدارة المحاسبة',
      description: 'إدارة الإيرادات والمصروفات والميزانية',
      icon: FaCalculator,
      color: 'teal',
    },
    {
      key: 'can_manage_study_groups',
      label: 'إدارة المجموعات الدراسية',
      description: 'إدارة المجموعات الدراسية والحضور',
      icon: FaGraduationCap,
      color: 'cyan',
    },
    {
      key: 'can_view_reports',
      label: 'عرض التقارير والإحصائيات',
      description: 'عرض التقارير والإحصائيات المختلفة',
      icon: FaChartBar,
      color: 'pink',
    },
    {
      key: 'can_manage_employees',
      label: 'إدارة الموظفين الآخرين',
      description: 'إدارة الموظفين الآخرين وصلاحياتهم',
      icon: FaUserCog,
      color: 'indigo',
    },
    {
      key: 'can_manage_tasks',
      label: 'إدارة المهام',
      description: 'إنشاء، تعديل، حذف المهام',
      icon: FaTasks,
      color: 'yellow',
    },
  ];

  // معالجة تغيير الحقول
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // معالجة تغيير الصلاحيات
  const handlePermissionsChange = (values) => {
    setFormData(prev => ({
      ...prev,
      permissions: values
    }));
  };

  // معالجة إرسال النموذج
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // التحقق من الحقول المطلوبة
    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // التحقق من صحة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال بريد إلكتروني صحيح',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // التحقق من كلمة المرور
    if (formData.password.length < 6) {
      toast({
        title: 'خطأ',
        description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // طباعة البيانات للتأكد من صحة الإرسال
      console.log('Sending employee data:', formData);
      console.log('Token:', token);
      
      // التأكد من أن البيانات بالشكل الصحيح
      const employeeData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || null,
        permissions: formData.permissions
      };
      
      // التحقق من أن البيانات غير فارغة
      if (!employeeData.name || !employeeData.email || !employeeData.password) {
        toast({
          title: 'خطأ',
          description: 'يرجى ملء جميع الحقول المطلوبة',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setLoading(false);
        return;
      }
      
      console.log('Formatted employee data:', employeeData);
      
      const response = await baseUrl.post('/api/employees', employeeData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response:', response.data);

      toast({
        title: 'نجح',
        description: 'تم إضافة الموظف بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // إعادة تعيين النموذج
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        permissions: [],
      });

    } catch (error) {
      console.error('Error adding employee:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      let errorMessage = 'فشل في إضافة الموظف';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'غير مصرح لك بإضافة موظفين';
      } else if (error.response?.status === 422) {
        errorMessage = 'بيانات غير صحيحة، يرجى التحقق من المدخلات';
      } else if (error.message === 'Network Error') {
        errorMessage = 'خطأ في الاتصال بالخادم';
      }
      
      toast({
        title: 'خطأ',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // مكون بطاقة الصلاحية
  const PermissionCard = ({ permission, isSelected }) => (
    <Box
      p={4}
      border="2px solid"
      borderColor={isSelected ? `${permission.color}.500` : borderColor}
      borderRadius="lg"
      bg={isSelected ? `${permission.color}.50` : cardBg}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{
        borderColor: `${permission.color}.300`,
        transform: 'translateY(-2px)',
        shadow: 'md',
      }}
    >
      <HStack spacing={3} mb={2}>
        <Icon as={permission.icon} color={`${permission.color}.500`} boxSize={5} />
        <Text fontWeight="bold" fontSize="sm" color={textColor}>
          {permission.label}
        </Text>
      </HStack>
      <Text fontSize="xs" color="gray.500" noOfLines={2}>
        {permission.description}
      </Text>
      {isSelected && (
        <Badge colorScheme={permission.color} variant="subtle" size="sm" mt={2}>
          مفعلة
        </Badge>
      )}
    </Box>
  );

  return (
    <Box p={6} bg={bgColor} minH="100vh">
      <VStack spacing={8} maxW="1000px" mx="auto">
        {/* العنوان */}
        <Card bg={cardBg} w="full" shadow="xl" borderRadius="2xl">
          <CardBody p={8}>
            <VStack spacing={6} align="stretch">
              <HStack spacing={4} justify="center">
                <Icon as={FaUserPlus} color="blue.500" boxSize={8} />
                <Heading size="lg" color={textColor} textAlign="center">
                  إضافة موظف جديد
                </Heading>
              </HStack>
              
              <Text color="gray.500" textAlign="center" fontSize="md">
                قم بملء البيانات التالية لإضافة موظف جديد مع تحديد الصلاحيات المطلوبة
              </Text>
            </VStack>
          </CardBody>
        </Card>

        {/* نموذج إضافة الموظف */}
        <Card bg={cardBg} w="full" shadow="xl" borderRadius="2xl">
          <CardBody p={8}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={6} align="stretch">
                {/* البيانات الأساسية */}
                <Box>
                  <Heading size="md" color={textColor} mb={4}>
                    <HStack spacing={2}>
                      <FaUserPlus color="blue.500" />
                      <Text>البيانات الأساسية</Text>
                    </HStack>
                  </Heading>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl isRequired>
                      <FormLabel fontWeight="bold" color={textColor}>
                        <HStack spacing={2}>
                          <FaUserPlus color="blue.500" />
                          <Text>اسم الموظف</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        type="text"
                        placeholder="أدخل اسم الموظف"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        size="lg"
                        borderRadius="xl"
                        borderColor={borderColor}
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontWeight="bold" color={textColor}>
                        <HStack spacing={2}>
                          <FaEnvelope color="green.500" />
                          <Text>البريد الإلكتروني</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        type="email"
                        placeholder="أدخل البريد الإلكتروني"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        size="lg"
                        borderRadius="xl"
                        borderColor={borderColor}
                        _focus={{ borderColor: 'green.500', boxShadow: '0 0 0 1px green.500' }}
                      />
                    </FormControl>
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={6}>
                    <FormControl isRequired>
                      <FormLabel fontWeight="bold" color={textColor}>
                        <HStack spacing={2}>
                          <FaLock color="red.500" />
                          <Text>كلمة المرور</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        type="password"
                        placeholder="أدخل كلمة المرور"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        size="lg"
                        borderRadius="xl"
                        borderColor={borderColor}
                        _focus={{ borderColor: 'red.500', boxShadow: '0 0 0 1px red.500' }}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="bold" color={textColor}>
                        <HStack spacing={2}>
                          <FaPhone color="purple.500" />
                          <Text>رقم الهاتف</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        type="tel"
                        placeholder="أدخل رقم الهاتف"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        size="lg"
                        borderRadius="xl"
                        borderColor={borderColor}
                        _focus={{ borderColor: 'purple.500', boxShadow: '0 0 0 1px purple.500' }}
                      />
                    </FormControl>
                  </SimpleGrid>
                </Box>

                <Divider />

                {/* الصلاحيات */}
                <Box>
                  <Heading size="md" color={textColor} mb={4}>
                    <HStack spacing={2}>
                      <FaShieldAlt color="orange.500" />
                      <Text>الصلاحيات المطلوبة</Text>
                    </HStack>
                  </Heading>
                  
                  <Alert status="info" borderRadius="lg" mb={6}>
                    <AlertIcon />
                    <Text fontSize="sm">
                      اختر الصلاحيات التي تريد منحها للموظف الجديد. يمكن تعديل هذه الصلاحيات لاحقاً.
                    </Text>
                  </Alert>

                  <CheckboxGroup
                    value={formData.permissions}
                    onChange={handlePermissionsChange}
                  >
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                      {availablePermissions.map((permission) => (
                        <Box key={permission.key}>
                          <Checkbox
                            value={permission.key}
                            colorScheme={permission.color}
                            size="lg"
                            display="none"
                          />
                          <Box
                            onClick={() => {
                              const newPermissions = formData.permissions.includes(permission.key)
                                ? formData.permissions.filter(p => p !== permission.key)
                                : [...formData.permissions, permission.key];
                              handlePermissionsChange(newPermissions);
                            }}
                          >
                            <PermissionCard
                              permission={permission}
                              isSelected={formData.permissions.includes(permission.key)}
                            />
                          </Box>
                        </Box>
                      ))}
                    </SimpleGrid>
                  </CheckboxGroup>

                  {formData.permissions.length > 0 && (
                    <Box mt={4} p={4} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.200">
                      <Text fontSize="sm" color="blue.700" fontWeight="medium">
                        تم اختيار {formData.permissions.length} صلاحية
                      </Text>
                    </Box>
                  )}
                </Box>

                {/* زر الإرسال */}
                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  borderRadius="xl"
                  height="60px"
                  fontSize="lg"
                  fontWeight="bold"
                  leftIcon={loading ? <Box as="span" className="animate-spin">⏳</Box> : <FaSave />}
                  isLoading={loading}
                  loadingText="جاري الإضافة..."
                  _hover={{ transform: 'translateY(-2px)', shadow: 'xl' }}
                  _active={{ transform: 'translateY(0)' }}
                  transition="all 0.2s"
                >
                  {loading ? 'جاري إضافة الموظف...' : 'إضافة الموظف'}
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default AddEmployees;