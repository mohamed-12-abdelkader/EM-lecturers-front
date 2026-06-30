import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  IconButton,
  Avatar,
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Spinner,
  Center,
  SimpleGrid,
  Flex,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Input,
  InputGroup,
  InputLeftElement,
  FormControl,
  FormLabel,
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Image,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FaUserPlus,
  FaTrash,
  FaSearch,
  FaUsers,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaStar,
  FaEnvelope,
  FaPhone,
  FaPlus,
  FaEdit,
  FaEye,
} from 'react-icons/fa';
import baseUrl from '../../api/baseUrl';
import UserType from '../../Hooks/auth/userType';

const SuggestedTeachers = () => {
  const [userData, isAdmin, isTeacher, student] = UserType();
  const toast = useToast();
  const token = localStorage.getItem('token');
  
  // States
  const [mySuggestedTeachers, setMySuggestedTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherIdInput, setTeacherIdInput] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    teacherId: null,
    teacherName: '',
  });

  // Modals
  const { isOpen: isAddModalOpen, onOpen: onAddModalOpen, onClose: onAddModalClose } = useDisclosure();
  const { isOpen: isViewModalOpen, onOpen: onViewModalOpen, onClose: onViewModalClose } = useDisclosure();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

  // Fetch my suggested teachers
  const fetchMySuggestedTeachers = async () => {
    try {
      setLoading(true);
      const response = await baseUrl.get('/api/suggested-teachers/my-suggested', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMySuggestedTeachers(response.data.suggested_teachers || []);
    } catch (error) {
      console.error('Error fetching my suggested teachers:', error);
      toast({
        title: 'خطأ في جلب المدرسين المقترحين',
        description: error.response?.data?.message || 'حدث خطأ غير متوقع',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };



  // Add suggested teacher
  const handleAddSuggestedTeacher = async () => {
    if (!teacherIdInput.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال رقم المدرس',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      await baseUrl.post('/api/suggested-teachers', {
        suggested_teacher_id: parseInt(teacherIdInput),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: 'تم الإضافة بنجاح',
        description: `تم إضافة المدرس برقم ${teacherIdInput} كمدرس مقترح`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onAddModalClose();
      setTeacherIdInput('');
      fetchMySuggestedTeachers();
    } catch (error) {
      toast({
        title: 'خطأ في الإضافة',
        description: error.response?.data?.message || 'حدث خطأ غير متوقع',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete suggested teacher
  const handleDeleteSuggestedTeacher = async () => {
    const { teacherId, teacherName } = deleteDialog;
    
    try {
      setLoading(true);
      await baseUrl.delete(`/api/suggested-teachers/${teacherId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: 'تم الحذف بنجاح',
        description: `تم حذف ${teacherName} من المدرسين المقترحين`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setDeleteDialog({ isOpen: false, teacherId: null, teacherName: '' });
      fetchMySuggestedTeachers();
    } catch (error) {
      toast({
        title: 'خطأ في الحذف',
        description: error.response?.data?.message || 'حدث خطأ غير متوقع',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };



  // Load data on component mount
  useEffect(() => {
    if (isTeacher || isAdmin) {
      fetchMySuggestedTeachers();
    }
  }, [isTeacher, isAdmin]);

  // Check if user is authorized
  if (!isTeacher && !isAdmin) {
    return (
      <Container maxW="container.xl" py={8}>
        <Center minH="50vh">
          <Alert status="warning" borderRadius="lg">
            <AlertIcon />
            <AlertTitle>غير مصرح!</AlertTitle>
            <AlertDescription>
              هذه الصفحة متاحة للمدرسين والمشرفين فقط.
            </AlertDescription>
          </Alert>
        </Center>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="xl" color={textColor} mb={4}>
            إدارة المدرسين المقترحين
          </Heading>
          <Text fontSize="lg" color="gray.600">
            أضف مدرسين آخرين كمقترحين في صفحتك الشخصية لمساعدة الطلاب في اكتشاف مدرسين جيدين
          </Text>
        </Box>

        {/* Main Content */}
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>
              <HStack spacing={2}>
                <Icon as={FaUsers} />
                <Text>مدرسيني المقترحون</Text>
                <Badge colorScheme="blue" borderRadius="full">
                  {mySuggestedTeachers.length}
                </Badge>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* My Suggested Teachers Panel */}
            <TabPanel>
              {/* Add Teacher Button */}
              <Box mb={6} textAlign="center">
                <Button
                  colorScheme="green"
                  size="lg"
                  leftIcon={<Icon as={FaUserPlus} />}
                  onClick={onAddModalOpen}
                  borderRadius="full"
                  px={8}
                  _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                  transition="all 0.2s"
                >
                  إضافة مدرس مقترح
                </Button>
              </Box>

              {loading ? (
                <Center py={10}>
                  <VStack spacing={4}>
                    <Spinner size="xl" color="blue.500" />
                    <Text>جاري التحميل...</Text>
                  </VStack>
                </Center>
              ) : mySuggestedTeachers.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {mySuggestedTeachers.map((suggestion) => (
                    <Card key={suggestion.id} bg={cardBg} border="1px solid" borderColor={borderColor}>
                      <CardHeader>
                        <HStack spacing={4}>
                          <Avatar
                            size="lg"
                            name={suggestion.suggested_teacher.name}
                            src={suggestion.suggested_teacher.avatar}
                            bg="blue.500"
                          />
                          <VStack align="start" spacing={1}>
                            <Heading size="md" color={textColor}>
                              {suggestion.suggested_teacher.name}
                            </Heading>
                            {suggestion.suggested_teacher.subject && (
                              <Badge colorScheme="green" variant="subtle">
                                {suggestion.suggested_teacher.subject}
                              </Badge>
                            )}
                          </VStack>
                        </HStack>
                      </CardHeader>

                      <CardBody>
                        {suggestion.suggested_teacher.description && (
                          <Text color="gray.600" noOfLines={3}>
                            {suggestion.suggested_teacher.description}
                          </Text>
                        )}
                        <HStack spacing={4} mt={4}>
                          {suggestion.suggested_teacher.email && (
                            <HStack spacing={2}>
                              <Icon as={FaEnvelope} color="blue.500" />
                              <Text fontSize="sm" color="gray.500">
                                {suggestion.suggested_teacher.email}
                              </Text>
                            </HStack>
                          )}
                        </HStack>
                      </CardBody>

                      <CardFooter>
                        <HStack spacing={2} w="full">
                          <Button
                            size="sm"
                            colorScheme="blue"
                            variant="outline"
                            leftIcon={<Icon as={FaEye} />}
                            onClick={() => {
                              setSelectedTeacher(suggestion.suggested_teacher);
                              onViewModalOpen();
                            }}
                            flex={1}
                          >
                            عرض التفاصيل
                          </Button>
                          <Tooltip label="حذف من المقترحين" hasArrow>
                            <IconButton
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              icon={<Icon as={FaTrash} />}
                              onClick={() => setDeleteDialog({
                                isOpen: true,
                                teacherId: suggestion.id,
                                teacherName: suggestion.suggested_teacher.name,
                              })}
                            />
                          </Tooltip>
                        </HStack>
                      </CardFooter>
                    </Card>
                  ))}
                </SimpleGrid>
              ) : (
                <Center py={10}>
                  <VStack spacing={4}>
                    <Icon as={FaUsers} boxSize={12} color="gray.400" />
                    <Text color="gray.500" fontSize="lg">
                      لا يوجد مدرسين مقترحين حالياً
                    </Text>
                    <Text color="gray.400" fontSize="md">
                      اضغط على زر "إضافة مدرس مقترح" لإضافة مدرسين
                    </Text>
                  </VStack>
                </Center>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Add Teacher Modal */}
      <Modal isOpen={isAddModalOpen} onClose={onAddModalClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={3}>
              <Icon as={FaUserPlus} color="green.500" />
              <Text>إضافة مدرس مقترح</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              <Text fontSize="md" color="gray.600" textAlign="center">
                أدخل رقم المدرس المراد إضافته كمقترح في صفحتك الشخصية
              </Text>
              
              <FormControl isRequired>
                <FormLabel>رقم المدرس</FormLabel>
                <Input
                  type="number"
                  value={teacherIdInput}
                  onChange={(e) => setTeacherIdInput(e.target.value)}
                  placeholder="أدخل رقم المدرس"
                  size="lg"
                  borderRadius="lg"
                  border="2px solid"
                  borderColor="blue.200"
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                />
              </FormControl>

              <Alert status="info" borderRadius="lg">
                <AlertIcon />
                <Box>
                  <AlertTitle>معلومات مهمة</AlertTitle>
                  <AlertDescription>
                    سيتم إضافة المدرس برقم {teacherIdInput || '...'} كمقترح في صفحتك الشخصية لمساعدة الطلاب في اكتشاف مدرسين جيدين.
                  </AlertDescription>
                </Box>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddModalClose} isDisabled={loading}>
              إلغاء
            </Button>
            <Button
              colorScheme="green"
              onClick={handleAddSuggestedTeacher}
              isLoading={loading}
              loadingText="جاري الإضافة..."
              leftIcon={<Icon as={FaUserPlus} />}
              isDisabled={!teacherIdInput.trim()}
            >
              إضافة المدرس
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Teacher Details Modal */}
      <Modal isOpen={isViewModalOpen} onClose={onViewModalClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={3}>
              <Icon as={FaChalkboardTeacher} color="blue.500" />
              <Text>تفاصيل المدرس</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTeacher && (
              <VStack spacing={6} align="stretch">
                <Center>
                  <Avatar
                    size="2xl"
                    name={selectedTeacher.name}
                    src={selectedTeacher.avatar}
                    bg="blue.500"
                  />
                </Center>
                
                <VStack spacing={4} align="stretch">
                  <Box textAlign="center">
                    <Heading size="lg" mb={2}>{selectedTeacher.name}</Heading>
                    {selectedTeacher.subject && (
                      <Badge colorScheme="green" size="lg" mb={4}>
                        {selectedTeacher.subject}
                      </Badge>
                    )}
                  </Box>

                  {selectedTeacher.description && (
                    <Box>
                      <Text fontWeight="bold" mb={2}>الوصف:</Text>
                      <Text color="gray.600">{selectedTeacher.description}</Text>
                    </Box>
                  )}

                  <Divider />

                  <VStack spacing={3} align="stretch">
                    {selectedTeacher.email && (
                      <HStack spacing={3}>
                        <Icon as={FaEnvelope} color="blue.500" />
                        <Text>{selectedTeacher.email}</Text>
                      </HStack>
                    )}
                    {selectedTeacher.phone && (
                      <HStack spacing={3}>
                        <Icon as={FaPhone} color="green.500" />
                        <Text>{selectedTeacher.phone}</Text>
                      </HStack>
                    )}
                  </VStack>
                </VStack>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onViewModalClose}>
              إغلاق
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, teacherId: null, teacherName: '' })}
        isCentered
      >
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            تأكيد الحذف
          </AlertDialogHeader>

          <AlertDialogBody>
            هل أنت متأكد من حذف{" "}
            <Text as="span" fontWeight="bold" color="red.500">
              {deleteDialog.teacherName}
            </Text>{" "}
            من المدرسين المقترحين؟
            <Text fontSize="sm" color="gray.600" mt={2}>
              هذا الإجراء لا يمكن التراجع عنه.
            </Text>
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button
              onClick={() => setDeleteDialog({ isOpen: false, teacherId: null, teacherName: '' })}
              isDisabled={loading}
            >
              إلغاء
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDeleteSuggestedTeacher}
              isLoading={loading}
              loadingText="جاري الحذف..."
              mr={3}
            >
              حذف
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
};

export default SuggestedTeachers;