import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardBody,
  Heading,
  Text,
  Avatar,
  Badge,
  Icon,
  useColorModeValue,
  useToast,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  IconButton,
  Tooltip,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Button,
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
  Select,
  Checkbox,
  CheckboxGroup,
} from '@chakra-ui/react';
import {
  FaUsers,
  FaEdit,
  FaTrash,
  FaUserTie,
  FaEnvelope,
  FaPhone,
  FaShieldAlt,
  FaCalendar,
  FaToggleOn,
  FaToggleOff,
  FaSave,
  FaUserPlus,
} from 'react-icons/fa';
import baseUrl from '../../api/baseUrl';

export const MangeEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  const cancelRef = React.useRef();
  const toast = useToast();

  // ألوان الثيم
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // قائمة الصلاحيات المتاحة
  const availablePermissions = [
    { key: 'can_add_teachers', label: 'إضافة مدرس جديد', color: 'blue' },
    { key: 'can_edit_teachers', label: 'تعديل بيانات المدرسين', color: 'green' },
    { key: 'can_delete_teachers', label: 'حذف المدرسين', color: 'red' },
    { key: 'can_manage_students', label: 'إدارة الطلاب', color: 'purple' },
    { key: 'can_manage_courses', label: 'إدارة الكورسات', color: 'orange' },
    { key: 'can_manage_accounting', label: 'إدارة المحاسبة', color: 'teal' },
    { key: 'can_manage_study_groups', label: 'إدارة المجموعات', color: 'cyan' },
    { key: 'can_view_reports', label: 'عرض التقارير', color: 'pink' },
    { key: 'can_manage_employees', label: 'إدارة الموظفين', color: 'indigo' },
    { key: 'can_manage_tasks', label: 'إدارة المهام', color: 'yellow' },
  ];

  // جلب الموظفين
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await baseUrl.get('/api/employees', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Employees data:', response.data);
      console.log('Employees array:', response.data.employees);
      if (response.data.employees && response.data.employees.length > 0) {
        console.log('First employee permissions:', response.data.employees[0].permissions);
      }
      setEmployees(response.data.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب بيانات الموظفين',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // حذف موظف
  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem('token');
      await baseUrl.delete(`/api/employees/${selectedEmployee.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: 'نجح',
        description: 'تم حذف الموظف بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setEmployees(prev => prev.filter(emp => emp.id !== selectedEmployee.id));
      onDeleteClose();
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: 'خطأ',
        description: error.response?.data?.message || 'فشل في حذف الموظف',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // فتح modal التعديل
  const openEditModal = (employee) => {
    setSelectedEmployee(employee);
    
    // تحويل الصلاحيات من array أو object إلى array
    let permissionsArray = [];
    
    if (Array.isArray(employee.permissions)) {
      // إذا كانت array
      permissionsArray = employee.permissions;
    } else if (typeof employee.permissions === 'object') {
      // إذا كانت object
      permissionsArray = Object.keys(employee.permissions || {}).filter(
        key => employee.permissions[key] === true
      );
    }
    
    console.log('Edit permissions array:', permissionsArray);
    
    setEditFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      permissions: permissionsArray,
    });
    
    onEditOpen();
  };

  // معالجة تغيير بيانات التعديل
  const handleEditInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // حفظ التعديلات
  const handleSaveEdit = async () => {
    if (!selectedEmployee) return;

    try {
      setEditLoading(true);
      const token = localStorage.getItem('token');
      
      const updateData = {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
        permissions: editFormData.permissions,
      };

      await baseUrl.put(`/api/employees/${selectedEmployee.id}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      toast({
        title: 'نجح',
        description: 'تم تحديث بيانات الموظف بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // تحديث البيانات في القائمة
      setEmployees(prev => prev.map(emp => 
        emp.id === selectedEmployee.id 
          ? { 
              ...emp, 
              ...editFormData,
              permissions: editFormData.permissions // الاحتفاظ بالشكل array
            }
          : emp
      ));

      onEditClose();
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: 'خطأ',
        description: error.response?.data?.message || 'فشل في تحديث بيانات الموظف',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setEditLoading(false);
    }
  };

  // فتح حوار الحذف
  const openDeleteDialog = (employee) => {
    setSelectedEmployee(employee);
    onDeleteOpen();
  };

  // تنسيق التاريخ
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // تحويل الصلاحيات إلى badges
  const renderPermissions = (permissions) => {
    console.log('Rendering permissions:', permissions);
    
    if (!permissions) {
      console.log('No permissions found');
      return (
        <Text fontSize="xs" color="gray.500">
          لا توجد صلاحيات محددة
        </Text>
      );
    }
    
    // التحقق من نوع البيانات - array أو object
    let permissionKeys = [];
    
    if (Array.isArray(permissions)) {
      // إذا كانت array
      permissionKeys = permissions;
      console.log('Permissions is array:', permissionKeys);
    } else if (typeof permissions === 'object') {
      // إذا كانت object
      permissionKeys = Object.entries(permissions)
        .filter(([key, value]) => value === true)
        .map(([key]) => key);
      console.log('Permissions is object, active keys:', permissionKeys);
    }
    
    if (permissionKeys.length === 0) {
  return (
        <Text fontSize="xs" color="gray.500">
          لا توجد صلاحيات مفعلة
        </Text>
      );
    }
    
    return (
      <Box>
        {permissionKeys.map((key) => {
          const permission = availablePermissions.find(p => p.key === key);
          console.log('Permission found:', permission, 'for key:', key);
          return permission ? (
            <Badge
              key={key}
              colorScheme={permission.color}
              variant="subtle"
              fontSize="xs"
              mr={1}
              mb={1}
              display="inline-block"
            >
              {permission.label}
            </Badge>
          ) : (
            <Badge
              key={key}
              colorScheme="gray"
              variant="subtle"
              fontSize="xs"
              mr={1}
              mb={1}
              display="inline-block"
            >
              {key}
            </Badge>
          );
        })}
      </Box>
    );
  };

  // مكون بطاقة الموظف
  const EmployeeCard = ({ employee }) => (
    <Card
      bg={cardBg}
      shadow="md"
      borderRadius="xl"
      border="1px solid"
      borderColor={borderColor}
      _hover={{ shadow: 'xl', transform: 'translateY(-2px)' }}
      transition="all 0.3s"
    >
      <CardBody p={6}>
        {/* رأس البطاقة */}
        <HStack justify="space-between" align="start" mb={4}>
          <Avatar
            size="lg"
            src={employee.avatar ? (employee.avatar.startsWith('http') ? employee.avatar : `http://localhost:8000${employee.avatar}`) : undefined}
            name={employee.name}
            bg="blue.500"
            border="3px solid"
            borderColor="blue.200"
          />
          <HStack spacing={2}>
            <Tooltip label="تعديل الموظف" hasArrow>
              <IconButton
                icon={<FaEdit />}
                colorScheme="blue"
                variant="ghost"
                size="sm"
                onClick={() => openEditModal(employee)}
              />
            </Tooltip>
            <Tooltip label="حذف الموظف" hasArrow>
              <IconButton
                icon={<FaTrash />}
                colorScheme="red"
                variant="ghost"
                size="sm"
                onClick={() => openDeleteDialog(employee)}
              />
            </Tooltip>
          </HStack>
        </HStack>

        {/* معلومات الموظف */}
        <VStack align="stretch" spacing={3}>
          <Box>
            <Heading size="md" color={textColor} mb={1}>
              {employee.name}
            </Heading>
            <Badge colorScheme={employee.is_active ? 'green' : 'red'} variant="subtle">
              {employee.is_active ? 'نشط' : 'غير نشط'}
            </Badge>
          </Box>

          <Divider />

          {/* معلومات الاتصال */}
          <VStack align="stretch" spacing={2}>
            <HStack spacing={2}>
              <FaEnvelope color="#3182CE" size={14} />
              <Text fontSize="sm" color="gray.600">
                {employee.email}
              </Text>
            </HStack>
            {employee.phone && (
              <HStack spacing={2}>
                <FaPhone color="#38A169" size={14} />
                <Text fontSize="sm" color="gray.600">
                  {employee.phone}
                </Text>
              </HStack>
            )}
          </VStack>

          <Divider />

          {/* الصلاحيات */}
          <Box>
            <HStack spacing={2} mb={2}>
              <FaShieldAlt color="#D69E2E" size={14} />
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                الصلاحيات
              </Text>
            </HStack>
            <Box 
              p={2} 
              bg="gray.50" 
              borderRadius="md" 
              border="1px solid" 
              borderColor="gray.200"
              minH="40px"
            >
              {renderPermissions(employee.permissions)}
            </Box>
          </Box>

          {/* تاريخ الإنشاء */}
          <HStack spacing={2} pt={2}>
            <FaCalendar color="#E53E3E" size={12} />
            <Text fontSize="xs" color="gray.500">
              انضم في {formatDate(employee.created_at)}
            </Text>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );

  if (loading) {
    return (
      <Box p={6} bg={bgColor} minH="100vh">
        <HStack justify="center" align="center" minH="60vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>جاري تحميل بيانات الموظفين...</Text>
          </VStack>
        </HStack>
      </Box>
    );
  }

  return (
    <Box p={6} bg={bgColor} minH="100vh">
      <VStack spacing={8} align="stretch">
        {/* العنوان */}
        <Box textAlign="center">
          <Heading size="lg" color={textColor} mb={2}>
            <HStack justify="center" spacing={3}>
              <FaUsers color="#3182CE" />
              <Text>إدارة الموظفين</Text>
            </HStack>
          </Heading>
          <Text color="gray.500" fontSize="lg">
            عرض وإدارة جميع الموظفين في المنصة
          </Text>
        </Box>

        {/* إحصائيات سريعة */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Card bg={cardBg} shadow="md" borderRadius="xl">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">إجمالي الموظفين</StatLabel>
                <StatNumber color="blue.500" fontSize="3xl">
                  {employees.length}
                </StatNumber>
                <StatHelpText>موظف نشط</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="md" borderRadius="xl">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">الموظفين النشطين</StatLabel>
                <StatNumber color="green.500" fontSize="3xl">
                  {employees.filter(emp => emp.is_active).length}
                </StatNumber>
                <StatHelpText>موظف نشط</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} shadow="md" borderRadius="xl">
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">الموظفين غير النشطين</StatLabel>
                <StatNumber color="red.500" fontSize="3xl">
                  {employees.filter(emp => !emp.is_active).length}
                </StatNumber>
                <StatHelpText>موظف غير نشط</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* قائمة الموظفين */}
        {employees.length === 0 ? (
          <Card bg={cardBg} shadow="md" borderRadius="xl">
            <CardBody textAlign="center" py={12}>
              <FaUsers size={64} color="#CBD5E0" />
              <Text fontSize="lg" color="gray.500" mt={4}>
                لا يوجد موظفين حالياً
              </Text>
            </CardBody>
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {employees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
          </SimpleGrid>
        )}
      </VStack>

      {/* Modal التعديل */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={2}>
              <FaEdit color="#3182CE" />
              <Text>تعديل بيانات الموظف</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel fontWeight="bold">اسم الموظف</FormLabel>
                  <Input
                    value={editFormData.name || ''}
                    onChange={(e) => handleEditInputChange('name', e.target.value)}
                    placeholder="أدخل اسم الموظف"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontWeight="bold">البريد الإلكتروني</FormLabel>
                  <Input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => handleEditInputChange('email', e.target.value)}
                    placeholder="أدخل البريد الإلكتروني"
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel fontWeight="bold">رقم الهاتف</FormLabel>
                <Input
                  value={editFormData.phone || ''}
                  onChange={(e) => handleEditInputChange('phone', e.target.value)}
                  placeholder="أدخل رقم الهاتف"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="bold">الصلاحيات</FormLabel>
                <CheckboxGroup
                  value={editFormData.permissions || []}
                  onChange={(values) => handleEditInputChange('permissions', values)}
                >
                  <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
                    {availablePermissions.map((permission) => (
                      <Checkbox
                        key={permission.key}
                        value={permission.key}
                        colorScheme={permission.color}
                      >
                        {permission.label}
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                </CheckboxGroup>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              إلغاء
            </Button>
            <Button
              colorScheme="blue"
              leftIcon={<FaSave />}
              onClick={handleSaveEdit}
              isLoading={editLoading}
              loadingText="جاري الحفظ..."
            >
              حفظ التغييرات
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* حوار تأكيد الحذف */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              حذف الموظف
            </AlertDialogHeader>

            <AlertDialogBody>
              هل أنت متأكد من حذف الموظف{' '}
              <Text as="span" fontWeight="bold" color="red.500">
                {selectedEmployee?.name}
              </Text>
              ؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                إلغاء
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteEmployee}
                ml={3}
                isLoading={deleteLoading}
                loadingText="جاري الحذف..."
              >
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};
