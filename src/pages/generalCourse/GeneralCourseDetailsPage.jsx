import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Image,
  Badge,
  Spinner,
  Center,
  useColorModeValue,
  Icon,
  SimpleGrid,
  Divider,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  List,
  ListItem,
  useDisclosure,
} from '@chakra-ui/react';
import {
  FaArrowRight,
  FaBook,
  FaUsers,
  FaUserGraduate,
  FaKey,
  FaCog,
  FaPlus,
  FaTrash,
  FaUserPlus,
} from 'react-icons/fa';
import baseUrl from '../../api/baseUrl';

const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function GeneralCourseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const courseId = id ? parseInt(id, 10) : null;

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [waitlist, setWaitlist] = useState([]);
  const [codes, setCodes] = useState([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dashboardTab, setDashboardTab] = useState('groups');
  const [createGroupName, setCreateGroupName] = useState('');
  const [createGroupMax, setCreateGroupMax] = useState('');
  const [createGroupLoading, setCreateGroupLoading] = useState(false);
  const [codesCount, setCodesCount] = useState('50');
  const [creatingCodes, setCreatingCodes] = useState(false);
  const [selectedWaitlistIds, setSelectedWaitlistIds] = useState([]);
  const [assignModalGroupId, setAssignModalGroupId] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);

  const { isOpen: isDashboardOpen, onOpen: onDashboardOpen, onClose: onDashboardClose } = useDisclosure();
  const { isOpen: isCreateGroupOpen, onOpen: onCreateGroupOpen, onClose: onCreateGroupClose } = useDisclosure();
  const { isOpen: isCreateCodesOpen, onOpen: onCreateCodesOpen, onClose: onCreateCodesClose } = useDisclosure();

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subTextColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const primaryBg = useColorModeValue('blue.50', 'blue.900');

  const getToken = () => localStorage.getItem('token');

  const fetchCourse = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const res = await baseUrl.get(`/api/general-courses/${courseId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.data?.success && res.data?.course) setCourse(res.data.course);
      else setCourse(null);
    } catch (err) {
      setCourse(null);
      toast({ title: 'خطأ', description: err?.response?.data?.message || 'فشل تحميل الكورس', status: 'error', isClosable: true });
    } finally {
      setLoading(false);
    }
  }, [courseId, toast]);

  const fetchGroups = useCallback(async () => {
    if (!courseId) return;
    try {
      setGroupsLoading(true);
      const [groupsRes, waitlistRes] = await Promise.all([
        baseUrl.get(`/api/general-courses/${courseId}/groups`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        baseUrl.get(`/api/general-courses/${courseId}/waitlist`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);
      if (groupsRes.data?.success) setGroups(groupsRes.data.groups || []);
      if (waitlistRes.data?.success) setWaitlist(waitlistRes.data.students || []);
    } catch (err) {
      toast({ title: 'خطأ', description: 'فشل تحميل المجموعات', status: 'error', isClosable: true });
    } finally {
      setGroupsLoading(false);
    }
  }, [courseId, toast]);

  const fetchCodes = useCallback(async () => {
    if (!courseId) return;
    try {
      setCodesLoading(true);
      const res = await baseUrl.get(`/api/general-courses/${courseId}/codes`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.data?.success) setCodes(res.data.codes || []);
    } catch {
      setCodes([]);
    } finally {
      setCodesLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsAdmin(user?.role === 'admin');
      } catch {}
    }
  }, []);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  useEffect(() => {
    if (courseId && isAdmin) fetchGroups();
  }, [courseId, isAdmin, fetchGroups]);

  useEffect(() => {
    if (isDashboardOpen && dashboardTab === 'codes') fetchCodes();
    if (isDashboardOpen && (dashboardTab === 'students' || dashboardTab === 'groups')) fetchGroups();
  }, [isDashboardOpen, dashboardTab, fetchCodes, fetchGroups]);

  const handleCreateGroup = async () => {
    if (!createGroupName.trim()) {
      toast({ title: 'تنبيه', description: 'أدخل اسم المجموعة', status: 'warning', isClosable: true });
      return;
    }
    setCreateGroupLoading(true);
    try {
      await baseUrl.post(
        `/api/general-courses/${courseId}/groups`,
        { name: createGroupName.trim(), max_students: parseInt(createGroupMax, 10) || 0 },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast({ title: 'تم', description: 'تم إنشاء المجموعة', status: 'success', isClosable: true });
      onCreateGroupClose();
      setCreateGroupName('');
      setCreateGroupMax('');
      fetchGroups();
    } catch (err) {
      toast({ title: 'خطأ', description: err?.response?.data?.message || 'فشل إنشاء المجموعة', status: 'error', isClosable: true });
    } finally {
      setCreateGroupLoading(false);
    }
  };

  const handleCreateCodes = async () => {
    const count = Math.min(1000, Math.max(1, parseInt(codesCount, 10)));
    if (isNaN(count) || count <= 0) {
      toast({ title: 'تنبيه', description: 'عدد الأكواد بين 1 و 1000', status: 'warning', isClosable: true });
      return;
    }
    setCreatingCodes(true);
    try {
      await baseUrl.post(
        `/api/general-courses/${courseId}/codes`,
        { count },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast({ title: 'تم', description: `تم إنشاء ${count} كود`, status: 'success', isClosable: true });
      onCreateCodesClose();
      fetchCodes();
    } catch (err) {
      toast({ title: 'خطأ', description: err?.response?.data?.message || 'فشل إنشاء الأكواد', status: 'error', isClosable: true });
    } finally {
      setCreatingCodes(false);
    }
  };

  const handleAssignToGroup = async (groupId) => {
    if (selectedWaitlistIds.length === 0) return;
    setAssignLoading(true);
    try {
      await baseUrl.post(
        `/api/general-courses/groups/${groupId}/assign`,
        { studentIds: selectedWaitlistIds },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast({ title: 'تم', description: 'تم إضافة الطلاب للمجموعة', status: 'success', isClosable: true });
      setAssignModalGroupId(null);
      setSelectedWaitlistIds([]);
      onAssignClose();
      fetchGroups();
    } catch (err) {
      toast({ title: 'خطأ', description: err?.response?.data?.message || 'فشل الإضافة', status: 'error', isClosable: true });
    } finally {
      setAssignLoading(false);
    }
  };

  const toggleWaitlistSelection = (studentId) => {
    setSelectedWaitlistIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const getCategoryColor = (cat) => {
    const map = { برمجة: 'blue', لغات: 'green', 'إدارة وتسويق': 'purple', بيزنس: 'orange', 'مهارات متنوعة': 'pink' };
    return map[cat] || 'gray';
  };

  if (loading && !course) {
    return (
      <Center minH="60vh" bg={bgColor}>
        <VStack>
          <Spinner size="xl" colorScheme="blue" />
          <Text color={subTextColor}>جاري التحميل...</Text>
        </VStack>
      </Center>
    );
  }

  if (!course) {
    return (
      <Center minH="60vh" bg={bgColor} flexDirection="column" gap={4}>
        <Text color="red.500">الكورس غير موجود</Text>
        <Button colorScheme="blue" leftIcon={<FaArrowRight />} onClick={() => navigate('/general-courses')}>
          رجوع للقائمة
        </Button>
      </Center>
    );
  }

  const categoryColor = getCategoryColor(course.category);

  return (
    <Box minH="100vh" bg={bgColor} pt={{ base: 6, md: 8 }} pb={8} direction="rtl">
      <Container maxW="4xl">
        {/* Header */}
        <Card bg={cardBg} shadow="md" borderRadius="2xl" overflow="hidden" borderWidth="1px" borderColor={borderColor} mb={6}>
          <Box position="relative" h={{ base: '200px', md: '260px' }} bg="gray.100">
            {course.image ? (
              <Image src={course.image} alt={course.title} w="100%" h="100%" objectFit="cover" />
            ) : (
              <Center h="100%" bgGradient="linear(to-br, blue.100, blue.200)">
                <Icon as={FaBook} fontSize="5xl" color="blue.500" />
              </Center>
            )}
            <Box position="absolute" inset={0} bg="blackAlpha.400" />
            <Button
              position="absolute"
              top={4}
              right={4}
              leftIcon={<FaArrowRight />}
              size="sm"
              colorScheme="blackAlpha"
              onClick={() => navigate('/general-courses')}
            >
              رجوع
            </Button>
            <Badge position="absolute" bottom={4} right={4} colorScheme={categoryColor} fontSize="sm" px={3} py={1} borderRadius="full">
              {course.category}
            </Badge>
          </Box>
          <CardBody p={6}>
            <Heading size="lg" color={textColor} mb={2} textAlign="right">
              {course.title}
            </Heading>
            {course.description && (
              <Text color={subTextColor} textAlign="right" noOfLines={3} mb={4}>
                {course.description}
              </Text>
            )}
            <HStack justify="space-between" flexWrap="wrap" gap={2}>
              <Text fontWeight="bold" color="green.600">
                {course.price} ر.س
              </Text>
              {isAdmin && (
                <Button
                  leftIcon={<Icon as={FaCog} />}
                  colorScheme="blue"
                  size="sm"
                  onClick={onDashboardOpen}
                >
                  لوحة التحكم
                </Button>
              )}
            </HStack>
          </CardBody>
        </Card>

        {/* Groups Section (Admin) */}
        {isAdmin && (
          <Box mb={6}>
            <HStack justify="space-between" mb={4}>
              <Heading size="md" color={textColor} display="flex" alignItems="center" gap={2}>
                <Icon as={FaUsers} color="blue.500" />
                مجموعات الكورس
              </Heading>
              <Button leftIcon={<FaPlus />} colorScheme="blue" size="sm" onClick={onCreateGroupOpen}>
                مجموعة جديدة
              </Button>
            </HStack>
            {groupsLoading ? (
              <Center py={12}>
                <Spinner size="lg" colorScheme="blue" />
              </Center>
            ) : groups.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {groups.map((group) => (
                  <Card
                    key={group.id}
                    bg={cardBg}
                    shadow="sm"
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={borderColor}
                    _hover={{ shadow: 'md', borderColor: 'blue.300' }}
                    cursor="pointer"
                    onClick={() => navigate(`/general-course/${courseId}/group/${group.id}`)}
                    transition="all 0.2s"
                  >
                    <CardBody>
                      <HStack justify="space-between" align="flex-start">
                        <VStack align="stretch" spacing={1} flex={1}>
                          <Text fontWeight="bold" color={textColor} fontSize="lg">
                            {group.name}
                          </Text>
                          <HStack fontSize="sm" color={subTextColor}>
                            <span>
                              {group.student_count} / {group.max_students || '∞'} طالب
                            </span>
                            {group.teacher && (
                              <>
                                <span>·</span>
                                <span>{group.teacher.name}</span>
                              </>
                            )}
                          </HStack>
                          <Text fontSize="sm" color="blue.500" fontWeight="medium" mt={2}>
                            ادخل للمجموعة ←
                          </Text>
                        </VStack>
                        <Box
                          w="48px"
                          h="48px"
                          borderRadius="xl"
                          bg={primaryBg}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon as={FaUsers} color="blue.500" boxSize={6} />
                        </Box>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            ) : (
              <Center py={12} bg={cardBg} borderRadius="xl" borderWidth="1px" borderStyle="dashed" borderColor={borderColor}>
                <VStack>
                  <Icon as={FaUsers} boxSize={12} color={subTextColor} />
                  <Text color={subTextColor}>لا توجد مجموعات. أنشئ مجموعة من الزر أعلاه.</Text>
                </VStack>
              </Center>
            )}
          </Box>
        )}
      </Container>

      {/* Dashboard Drawer */}
      <Drawer isOpen={isDashboardOpen} onClose={onDashboardClose} placement="left" size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">لوحة تحكم الكورس</DrawerHeader>
          <DrawerBody p={0}>
            <Tabs index={dashboardTab === 'codes' ? 0 : dashboardTab === 'students' ? 1 : 2} onChange={(i) => setDashboardTab(['codes', 'students', 'groups'][i])}>
              <TabList>
                <Tab>الأكواد</Tab>
                <Tab>قائمة الانتظار</Tab>
                <Tab>المجموعات</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <Button size="sm" colorScheme="blue" mb={4} w="full" onClick={onCreateCodesOpen}>
                    إنشاء أكواد جديدة
                  </Button>
                  {codesLoading ? (
                    <Center py={6}><Spinner /></Center>
                  ) : (
                    <List spacing={2}>
                      {codes.slice(0, 30).map((c) => (
                        <ListItem key={c.id} p={2} bg={primaryBg} borderRadius="md" fontSize="sm" display="flex" justifyContent="space-between">
                          <span>{c.code}</span>
                          <Badge colorScheme={c.is_used ? 'green' : 'orange'}>{c.is_used ? 'مستخدم' : 'غير مستخدم'}</Badge>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </TabPanel>
                <TabPanel>
                  <Text fontSize="sm" color={subTextColor} mb={3}>الطلاب غير المنضمين لمجموعات ({waitlist.length})</Text>
                  {selectedWaitlistIds.length > 0 && (
                    <HStack mb={3} flexWrap="wrap">
                      {groups.map((g) => (
                        <Button key={g.id} size="xs" colorScheme="blue" onClick={() => setAssignModalGroupId(g.id)}>إضافة لـ {g.name}</Button>
                      ))}
                    </HStack>
                  )}
                  <VStack align="stretch" spacing={2}>
                    {waitlist.map((s) => (
                      <Flex key={s.id} p={3} bg={cardBg} borderRadius="md" borderWidth="1px" align="center" justify="space-between">
                        <VStack align="stretch" spacing={0}>
                          <Text fontWeight="medium">{s.name}</Text>
                          <Text fontSize="xs" color={subTextColor}>{s.phone}</Text>
                        </VStack>
                        <Button size="xs" colorScheme={selectedWaitlistIds.includes(s.id) ? 'blue' : 'gray'} variant={selectedWaitlistIds.includes(s.id) ? 'solid' : 'outline'} onClick={() => toggleWaitlistSelection(s.id)}>
                          {selectedWaitlistIds.includes(s.id) ? 'محدد' : 'اختر'}
                        </Button>
                      </Flex>
                    ))}
                  </VStack>
                </TabPanel>
                <TabPanel>
                  <Button size="sm" colorScheme="blue" mb={4} w="full" onClick={onCreateGroupOpen}>إنشاء مجموعة جديدة</Button>
                  <VStack align="stretch" spacing={2}>
                    {groups.map((g) => (
                      <Flex key={g.id} p={3} bg={cardBg} borderRadius="md" borderWidth="1px" justify="space-between" align="center">
                        <Text fontWeight="medium">{g.name}</Text>
                        <Button size="xs" colorScheme="blue" onClick={() => { onDashboardClose(); navigate(`/general-course/${courseId}/group/${g.id}`); }}>
                          فتح
                        </Button>
                      </Flex>
                    ))}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Create Group Modal */}
      <Modal isOpen={isCreateGroupOpen} onClose={onCreateGroupClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>إنشاء مجموعة جديدة</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>اسم المجموعة</FormLabel>
              <Input value={createGroupName} onChange={(e) => setCreateGroupName(e.target.value)} placeholder="مثال: المجموعة A" />
            </FormControl>
            <FormControl>
              <FormLabel>الحد الأقصى للطلاب (0 = غير محدود)</FormLabel>
              <NumberInput value={createGroupMax} onChange={(_, v) => setCreateGroupMax(v)} min={0}>
                <NumberInputField placeholder="0" />
              </NumberInput>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateGroupClose}>إلغاء</Button>
            <Button colorScheme="blue" onClick={handleCreateGroup} isLoading={createGroupLoading}>إنشاء</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Codes Modal */}
      <Modal isOpen={isCreateCodesOpen} onClose={onCreateCodesClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>إنشاء أكواد جديدة</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>عدد الأكواد (1 - 1000)</FormLabel>
              <NumberInput value={codesCount} onChange={(_, v) => setCodesCount(v)} min={1} max={1000}>
                <NumberInputField />
              </NumberInput>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateCodesClose}>إلغاء</Button>
            <Button colorScheme="blue" onClick={handleCreateCodes} isLoading={creatingCodes}>إنشاء</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Assign to Group Modal */}
      <Modal isOpen={!!assignModalGroupId} onClose={() => setAssignModalGroupId(null)} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>إضافة الطلاب للمجموعة</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>سيتم إضافة {selectedWaitlistIds.length} طالب للمجموعة المختارة.</Text>
            <Button colorScheme="blue" w="full" isLoading={assignLoading} onClick={() => handleAssignToGroup(assignModalGroupId)}>
              تأكيد الإضافة
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
