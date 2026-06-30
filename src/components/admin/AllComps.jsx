import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  VStack,
  HStack,
  Text,
  Image,
  Badge,
  Flex,
  Grid,
  GridItem,
  useToast,
  IconButton,
  Tooltip,
  Center,
  Heading,
  Divider,
  Input,
  Select,
} from "@chakra-ui/react";
import { FiEdit2, FiTrash2, FiEye, FiEyeOff, FiPlay, FiPause } from "react-icons/fi";
import baseUrl from "../../api/baseUrl";
import { Link } from "react-router-dom";

const AllComps = () => {
  const [competitions, setCompetitions] = useState([]);
  const [filteredCompetitions, setFilteredCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedComp, setSelectedComp] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [grades, setGrades] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    duration: "",
    grade_id: "",
    is_visible: true,
    is_active: true
  });
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();
  const toast = useToast();

  // جلب الصفوف الدراسية
  const fetchGrades = async () => {
    try {
      const response = await baseUrl.get("/api/users/grades");
      setGrades(response.data.grades || []);
    } catch (error) {
      console.error("Error fetching grades:", error);
      toast({
        title: "خطأ",
        description: "فشل في جلب الصفوف الدراسية",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // جلب المسابقات
  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('لم يتم العثور على توكين المصادقة');
      }

      const response = await baseUrl.get('api/competitions/admin', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setCompetitions(response.data.data);
        setFilteredCompetitions(response.data.data);
      } else {
        throw new Error('فشل في جلب البيانات');
      }
    } catch (error) {
      console.error('Error fetching competitions:', error);
      setError(error.message);
      toast({
        title: "خطأ",
        description: "فشل في جلب المسابقات",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // حذف مسابقة
  const handleDelete = async () => {
    if (!selectedComp) return;
    
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      await baseUrl.delete(`api/competitions/${selectedComp.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      toast({
        title: "تم الحذف",
        description: "تم حذف المسابقة بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // إزالة المسابقة من القائمة
      setCompetitions(prev => prev.filter(comp => comp.id !== selectedComp.id));
      setFilteredCompetitions(prev => prev.filter(comp => comp.id !== selectedComp.id));
      setIsDeleteDialogOpen(false);
      setSelectedComp(null);
    } catch (error) {
      console.error('Error deleting competition:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف المسابقة",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // تغيير حالة المسابقة
  const handleStatusChange = async (compId, newStatus) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      await baseUrl.patch(`api/competitions/${compId}/toggle-visibility`, {
        is_active: newStatus
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // تحديث الحالة في القائمة
      setCompetitions(prev => prev.map(comp => 
        comp.id === compId ? { ...comp, is_active: newStatus } : comp
      ));
      setFilteredCompetitions(prev => prev.map(comp => 
        comp.id === compId ? { ...comp, is_active: newStatus } : comp
      ));

      toast({
        title: "تم التحديث",
        description: `تم ${newStatus ? 'تفعيل' : 'إيقاف'} المسابقة بنجاح`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating competition status:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة المسابقة",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // فتح نافذة التعديل
  const handleEditOpen = (competition) => {
    setSelectedComp(competition);
    setEditFormData({
      title: competition.title,
      description: competition.description || "",
      duration: competition.duration.toString(),
      grade_id: competition.grade_id.toString(),
      is_visible: competition.is_visible,
      is_active: competition.is_active
    });
    setIsEditModalOpen(true);
  };

  // تحديث بيانات المسابقة
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await baseUrl.put(`api/competitions/${selectedComp.id}`, editFormData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // تحديث المسابقة في القائمة
        const updatedComp = response.data.data;
        setCompetitions(prev => prev.map(comp => 
          comp.id === selectedComp.id ? updatedComp : comp
        ));
        setFilteredCompetitions(prev => prev.map(comp => 
          comp.id === selectedComp.id ? updatedComp : comp
        ));

        toast({
          title: "تم التحديث",
          description: "تم تحديث المسابقة بنجاح",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        setIsEditModalOpen(false);
        setSelectedComp(null);
      }
    } catch (error) {
      console.error('Error updating competition:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث المسابقة",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // فلترة المسابقات حسب الصف
  const handleGradeFilter = (gradeId) => {
    setSelectedGrade(gradeId);
    if (gradeId === "all") {
      setFilteredCompetitions(competitions);
    } else {
      const filtered = competitions.filter(comp => comp.grade_id.toString() === gradeId);
      setFilteredCompetitions(filtered);
    }
  };

  // تغيير حالة الرؤية
  const handleVisibilityChange = async (compId, newVisibility) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      await baseUrl.patch(`api/competitions/${compId}/toggle-visibility`, {
        is_visible: newVisibility
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // تحديث الحالة في القائمة
      setCompetitions(prev => prev.map(comp => 
        comp.id === compId ? { ...comp, is_visible: newVisibility } : comp
      ));
      setFilteredCompetitions(prev => prev.map(comp => 
        comp.id === compId ? { ...comp, is_visible: newVisibility } : comp
      ));

      toast({
        title: "تم التحديث",
        description: `تم ${newVisibility ? 'إظهار' : 'إخفاء'} المسابقة بنجاح`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating competition visibility:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الرؤية",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
    fetchCompetitions();
  }, []);

  // عرض حالة التحميل
  if (loading) {
    return (
      <Box className='w-[90%] m-auto mt-[50px] p-8'>
        <Center>
          <VStack spacing={6}>
            <Spinner 
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="blue.500"
              size="xl"
            />
            <Text fontSize="lg" color="gray.600">
              جاري تحميل المسابقات...
            </Text>
            <Text fontSize="sm" color="gray.500">
              يرجى الانتظار قليلاً
            </Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  // عرض رسالة الخطأ
  if (error) {
    return (
      <Box className='w-[90%] m-auto mt-[50px] p-8'>
        <Center>
          <VStack spacing={4}>
            <Text fontSize="xl" color="red.500" fontWeight="bold">
              حدث خطأ
            </Text>
            <Text color="gray.600">{error}</Text>
            <Button 
              colorScheme="blue" 
              onClick={fetchCompetitions}
              leftIcon={<FiPlay />}
            >
              إعادة المحاولة
            </Button>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box className='w-[90%] m-auto mt-[50px] p-6'>
      {/* Header */}
      <Box mb={8} textAlign="center">
        <Heading size="lg" color="blue.600" mb={2}>
          إدارة المسابقات
        </Heading>
        <Text color="gray.600">
          عرض وإدارة جميع المسابقات في النظام
        </Text>
        <Divider mt={4} />
      </Box>

      {/* Statistics */}
      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6} mb={8}>
        <GridItem>
          <Card p={6} textAlign="center" bg="blue.50" border="1px solid" borderColor="blue.200">
            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
              {competitions.length}
            </Text>
            <Text color="blue.700">إجمالي المسابقات</Text>
          </Card>
        </GridItem>
        <GridItem>
          <Card p={6} textAlign="center" bg="green.50" border="1px solid" borderColor="green.200">
            <Text fontSize="2xl" fontWeight="bold" color="green.600">
              {filteredCompetitions.filter(c => c.is_active).length}
            </Text>
            <Text color="green.700">المسابقات النشطة</Text>
          </Card>
        </GridItem>
        <GridItem>
          <Card p={6} textAlign="center" bg="purple.50" border="1px solid" borderColor="purple.200">
            <Text fontSize="2xl" fontWeight="bold" color="purple.600">
              {filteredCompetitions.filter(c => c.is_visible).length}
            </Text>
            <Text color="purple.700">المسابقات المرئية</Text>
          </Card>
        </GridItem>
      </Grid>

      {/* Grade Filter */}
      <Box mb={6} p={4} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.200">
        <HStack justify="space-between" align="center" mb={4}>
          <Text fontWeight="bold" color="gray.700">
            فلترة حسب الصف الدراسي
          </Text>
          <Text fontSize="sm" color="gray.500">
            {filteredCompetitions.length} من {competitions.length} مسابقة
          </Text>
        </HStack>
        <HStack spacing={4} flexWrap="wrap">
          <Button
            size="md"
            variant={selectedGrade === "all" ? "solid" : "outline"}
            colorScheme={selectedGrade === "all" ? "blue" : "gray"}
            onClick={() => handleGradeFilter("all")}
            _hover={{ transform: 'translateY(-1px)' }}
            transition="all 0.2s"
          >
            جميع الصفوف
          </Button>
          {grades.map((grade) => (
            <Button
              key={grade.id}
              size="md"
              variant={selectedGrade === grade.id.toString() ? "solid" : "outline"}
              colorScheme={selectedGrade === grade.id.toString() ? "blue" : "gray"}
              onClick={() => handleGradeFilter(grade.id.toString())}
              _hover={{ transform: 'translateY(-1px)' }}
              transition="all 0.2s"
            >
              {grade.name}
            </Button>
          ))}
        </HStack>
      </Box>

      {/* Competitions Grid */}
      {filteredCompetitions.length === 0 ? (
        <Center py={12}>
          <VStack spacing={4}>
            <Text fontSize="lg" color="gray.500">
              {competitions.length === 0 ? "لا توجد مسابقات حالياً" : "لا توجد مسابقات في الصف المحدد"}
            </Text>
            <Text fontSize="sm" color="gray.400">
              {competitions.length === 0 ? "قم بإنشاء مسابقة جديدة للبدء" : "جرب اختيار صف آخر أو إنشاء مسابقة جديدة"}
            </Text>
          </VStack>
        </Center>
      ) : (
        <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={6}>
          {filteredCompetitions.map((competition) => (
            <GridItem key={competition.id} >
              <Card 
                p={6} 
                shadow="lg" 
                _hover={{ transform: 'translateY(-4px)', shadow: 'xl' }}
                transition="all 0.3s"
                border="1px solid"
                borderColor={competition.is_active ? "green.200" : "gray.200"}
              >
                {/* Image */}
              <Link  to={`/competition/${competition.id}`}>
                <Box mb={4} position="relative">
                  <Image
                    src={competition.image_url || 'https://via.placeholder.com/300x200?text=صورة+المسابقة'}
                    alt={competition.title}
                    borderRadius="lg"
                    width="100%"
                    height="200px"
                    objectFit="cover"
                    fallbackSrc="https://via.placeholder.com/300x200?text=صورة+المسابقة"
                    />
                  <HStack position="absolute" top={2} right={2} spacing={2}>
                    <Badge 
                      colorScheme={competition.is_active ? "green" : "red"}
                      variant="solid"
                      borderRadius="full"
                      px={2}
                    >
                      {competition.is_active ? "نشطة" : "متوقفة"}
                    </Badge>
                    <Badge 
                      colorScheme={competition.is_visible ? "blue" : "gray"}
                      variant="solid"
                      borderRadius="full"
                      px={2}
                    >
                      {competition.is_visible ? "مرئية" : "مخفية"}
                    </Badge>
                  </HStack>
                </Box>
</Link>
                {/* Content */}
                <VStack align="stretch" spacing={4}>
                  <Box>
                    <Heading size="md" mb={2} color="gray.800">
                      {competition.title}
                    </Heading>
                    <Text color="gray.600" noOfLines={2}>
                      {competition.description || "لا يوجد وصف"}
                    </Text>
                  </Box>

                  {/* Details */}
                  <HStack justify="space-between" fontSize="sm" color="gray.500">
                    <Text>الصف: {competition.grade_name}</Text>
                    <Text>المدة: {competition.duration} دقيقة</Text>
                  </HStack>

                  <HStack justify="space-between" fontSize="sm" color="gray.500">
                    <Text>أنشئت بواسطة: {competition.creator_name}</Text>
                    <Text>التاريخ: {new Date(competition.created_at).toLocaleDateString('ar-EG')}</Text>
                  </HStack>

                  {/* Actions */}
                  <HStack justify="space-between" pt={2}>
                    <HStack spacing={2}>
                      <Tooltip label={competition.is_active ? "إيقاف المسابقة" : "تفعيل المسابقة"}>
                        <IconButton
                          icon={competition.is_active ? <FiPause /> : <FiPlay />}
                          colorScheme={competition.is_active ? "red" : "green"}
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(competition.id, !competition.is_active)}
                          isLoading={actionLoading}
                        />
                      </Tooltip>
                      <Tooltip label={competition.is_visible ? "إخفاء المسابقة" : "إظهار المسابقة"}>
                        <IconButton
                          icon={competition.is_visible ? <FiEyeOff /> : <FiEye />}
                          colorScheme={competition.is_visible ? "orange" : "blue"}
                          variant="outline"
                          size="sm"
                          onClick={() => handleVisibilityChange(competition.id, !competition.is_visible)}
                          isLoading={actionLoading}
                        />
                      </Tooltip>
                    </HStack>
                    
                    <HStack spacing={2}>
                                             <Tooltip label="تعديل المسابقة">
                         <IconButton
                           icon={<FiEdit2 />}
                           colorScheme="blue"
                           variant="outline"
                           size="sm"
                           onClick={() => handleEditOpen(competition)}
                           />
                       </Tooltip>
                      <Tooltip label="حذف المسابقة">
                        <IconButton
                          icon={<FiTrash2 />}
                          colorScheme="red"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedComp(competition);
                            setIsDeleteDialogOpen(true);
                          }}
                        />
                      </Tooltip>
                    </HStack>
                  </HStack>
                </VStack>
              </Card>
            </GridItem>
                          
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              حذف المسابقة
            </AlertDialogHeader>
            <AlertDialogBody>
              هل أنت متأكد من حذف المسابقة "{selectedComp?.title}"؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteDialogOpen(false)}>
                إلغاء
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleDelete} 
                ml={3}
                isLoading={actionLoading}
              >
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>تعديل المسابقة</ModalHeader>
          <ModalBody>
            <form onSubmit={handleEditSubmit}>
              <VStack spacing={4} align="stretch">
                {/* عنوان المسابقة */}
                <Box>
                  <Text fontWeight="bold" mb={2}>
                    عنوان المسابقة <span style={{ color: "red" }}>*</span>
                  </Text>
                  <Input
                    placeholder='أدخل عنوان المسابقة'
                    size='lg'
                    value={editFormData.title}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </Box>

                {/* وصف المسابقة */}
                <Box>
                  <Text fontWeight="bold" mb={2}>
                    وصف المسابقة
                  </Text>
                  <Input
                    placeholder='أدخل وصف المسابقة'
                    size='lg'
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </Box>

                {/* اختيار الصف */}
                <Box>
                  <Text fontWeight="bold" mb={2}>
                    الصف الدراسي <span style={{ color: "red" }}>*</span>
                  </Text>
                  <Select
                    placeholder='اختر الصف'
                    size='lg'
                    value={editFormData.grade_id}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, grade_id: e.target.value }))}
                    required
                  >
                    {grades.map((grade) => (
                      <option key={grade.id} value={grade.id}>
                        {grade.name}
                      </option>
                    ))}
                  </Select>
                </Box>

                {/* مدة المسابقة */}
                <Box>
                  <Text fontWeight="bold" mb={2}>
                    مدة المسابقة (بالدقائق) <span style={{ color: "red" }}>*</span>
                  </Text>
                  <Input
                    type="number"
                    placeholder='أدخل مدة المسابقة بالدقائق'
                    size='lg'
                    value={editFormData.duration}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, duration: e.target.value }))}
                    min="1"
                    required
                  />
                </Box>

                {/* خيارات إضافية */}
                <HStack spacing={6}>
                  <Box flex={1}>
                    <Text fontWeight="bold" mb={2}>
                      حالة الرؤية
                    </Text>
                    <Select
                      size='lg'
                      value={editFormData.is_visible.toString()}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, is_visible: e.target.value === 'true' }))}
                    >
                      <option value='true'>مرئية</option>
                      <option value='false'>مخفية</option>
                    </Select>
                  </Box>
                  
                  <Box flex={1}>
                    <Text fontWeight="bold" mb={2}>
                      حالة النشاط
                    </Text>
                    <Select
                      size='lg'
                      value={editFormData.is_active.toString()}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                    >
                      <option value='true'>نشطة</option>
                      <option value='false'>غير نشطة</option>
                    </Select>
                  </Box>
                </HStack>
              </VStack>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setIsEditModalOpen(false)} mr={3}>
              إلغاء
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleEditSubmit}
              isLoading={actionLoading}
            >
              حفظ التغييرات
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AllComps;
