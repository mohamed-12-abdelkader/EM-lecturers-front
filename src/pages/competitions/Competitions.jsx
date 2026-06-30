import React, { useEffect, useState } from "react";
import { 
  Box, 
  Skeleton, 
  VStack, 
  Text, 
  Center, 
  Button, 
  Flex, 
  Heading, 
  Avatar, 
  Badge,
  SimpleGrid,
  Icon,
  useColorModeValue,
  Stack,
  Divider,
  useToast,
  Image,
  HStack,
  Card,
  CardBody,
  CardFooter
} from "@chakra-ui/react";
import { 
  FiAward, 
  FiClock, 
  FiUsers,
  FiCalendar,
  FiBarChart2,
  FiChevronRight,
  FiStar,
  FiPlay,
  FiUserCheck,
  FiUserPlus
} from "react-icons/fi";
import baseUrl from "../../api/baseUrl";
import { Link } from "react-router-dom";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";

// بيانات الطالب (يمكن استبدالها ببيانات حقيقية من API)
const studentData = {
  name: "أحمد محمد",
  points: 1250,
  avatar: "https://bit.ly/dan-abramov",
  level: "الصف الثالث الثانوي"
};

const CompetitionSkeleton = () => {
  return (
    <Box
      w={{ base: "100%", md: "280px" }}
      h="400px"
      m="2"
      p="4"
      bg="white"
      borderRadius="lg"
      boxShadow="sm"
      borderWidth="1px"
      borderColor="gray.100"
    >
      <Skeleton height="160px" borderRadius="md" mb="4" />
      <VStack align="start" spacing="3">
        <Skeleton height="20px" width="70%" />
        <Skeleton height="16px" width="90%" />
        <Skeleton height="16px" width="50%" />
        <Skeleton height="40px" width="100%" mt="4" borderRadius="md" />
      </VStack>
    </Box>
  );
};

// كارد المسابقة المخصص
const CompetitionCard = ({ competition, onSubscribe, onUnsubscribe, isLoading }) => {
  const isSubscribed = competition.is_enrolled;
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  
  return (
    <Card 
      bg={cardBg} 
      shadow="lg" 
      borderRadius="xl" 
      border="1px solid" 
      borderColor={borderColor}
      _hover={{ transform: 'translateY(-4px)', shadow: 'xl' }}
      transition="all 0.3s"
      overflow="hidden"
    >
      {/* صورة المسابقة */}
      <Box position="relative">
        <Image
          src={competition.image_url || 'https://via.placeholder.com/300x200?text=صورة+المسابقة'}
          alt={competition.title}
          height="200px"
          width="100%"
          objectFit="cover"
          fallbackSrc="https://via.placeholder.com/300x200?text=صورة+المسابقة"
        />
        
        {/* Badges للحالة */}
        <HStack position="absolute" top={3} right={3} spacing={2}>
          <Badge 
            colorScheme={competition.is_active ? "green" : "red"}
            variant="solid"
            borderRadius="full"
            px={2}
            py={1}
          >
            {competition.is_active ? "نشطة" : "متوقفة"}
          </Badge>
          <Badge 
            colorScheme={competition.is_visible ? "blue" : "gray"}
            variant="solid"
            borderRadius="full"
            px={2}
            py={1}
          >
            {competition.is_visible ? "مرئية" : "مخفية"}
          </Badge>
        </HStack>
      </Box>

      <CardBody p={6}>
        {/* عنوان المسابقة */}
        <Heading size="md" mb={3} color="gray.800" noOfLines={2}>
          {competition.title}
        </Heading>
        
        {/* وصف المسابقة */}
        <Text color="gray.600" mb={4} noOfLines={3}>
          {competition.description || "لا يوجد وصف للمسابقة"}
        </Text>

        {/* تفاصيل المسابقة */}
        <VStack spacing={3} align="stretch">
          {/* الصف الدراسي */}
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.500">الصف الدراسي:</Text>
            <Badge colorScheme="purple" variant="subtle">
              {competition.grade_name}
            </Badge>
          </HStack>

          {/* مدة المسابقة */}
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.500">المدة:</Text>
            <HStack spacing={1}>
              <Icon as={FiClock} color="orange.500" />
              <Text fontWeight="semibold">{competition.duration} دقيقة</Text>
            </HStack>
          </HStack>

          {/* عدد الأسئلة */}
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.500">عدد الأسئلة:</Text>
            <Text fontWeight="semibold" color="blue.600">
              {competition.questions_count} سؤال
            </Text>
          </HStack>

          {/* تاريخ الإنشاء */}
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.500">تاريخ الإنشاء:</Text>
            <Text fontSize="sm" color="gray.600">
              {new Date(competition.created_at).toLocaleDateString('ar-EG')}
            </Text>
          </HStack>
        </VStack>
      </CardBody>

      <CardFooter p={6} pt={0}>
        <VStack spacing={3} w="full">
          {/* زر الاشتراك/إلغاء الاشتراك */}
          <Button
            w="full"
            colorScheme={isSubscribed ? "red" : "blue"}
            variant={isSubscribed ? "outline" : "solid"}
            leftIcon={isSubscribed ? <FiUserCheck /> : <FiUserPlus />}
            onClick={() => isSubscribed ? onUnsubscribe(competition.id) : onSubscribe(competition.id)}
            isLoading={isLoading}
            size="lg"
            borderRadius="xl"
          >
            {isSubscribed ? "إلغاء الاشتراك" : "اشتراك في المسابقة"}
          </Button>

          {/* زر عرض المسابقة - يظهر فقط للمشتركين */}
          {isSubscribed && (
            <Button
              w="full"
              colorScheme="green"
              variant="outline"
              leftIcon={<FiPlay />}
              as={Link}
              to={`/competition/${competition.id}`}
              size="md"
              borderRadius="xl"
              _hover={{ bg: "green.50" }}
            >
              دخول المسابقة
            </Button>
          )}
        </VStack>
      </CardFooter>
    </Card>
  );
};

const Competitions = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState({});
  const [studentSubscriptions, setStudentSubscriptions] = useState(new Set());
  const toast = useToast();
  
  const bgColor = useColorModeValue("gray.50", "gray.800");
  const cardBg = useColorModeValue("white", "gray.700");

  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await baseUrl.get('api/competitions/student', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.data?.success) {
        setCompetitions(response.data.data || []);
        
        // تحديث حالة الاشتراكات أيضاً
        const enrolledCompetitions = response.data.data.filter(comp => comp.is_enrolled);
        const enrolledIds = new Set(enrolledCompetitions.map(comp => comp.id));
        setStudentSubscriptions(enrolledIds);
      } else {
        throw new Error('فشل في جلب المسابقات');
      }
    } catch (err) {
      setError(err?.message || 'حدث خطأ غير متوقع');
      toast({
        title: 'خطأ',
        description: 'فشل في جلب المسابقات',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // جلب اشتراكات الطالب
  const fetchStudentSubscriptions = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await baseUrl.get('api/competitions/student', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data?.success) {
        // تحديث قائمة المسابقات مع حالة الاشتراك
        setCompetitions(response.data.data || []);
        
        // نستخدم حقل is_enrolled من API لتحديد المسابقات المشترك فيها
        const enrolledCompetitions = response.data.data.filter(comp => comp.is_enrolled);
        const enrolledIds = new Set(enrolledCompetitions.map(comp => comp.id));
        setStudentSubscriptions(enrolledIds);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  // الاشتراك في مسابقة
  const handleSubscribe = async (competitionId) => {
    try {
      setSubscriptionLoading(prev => ({ ...prev, [competitionId]: true }));
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await baseUrl.post(`api/competitions/${competitionId}/join`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data?.success) {
        // تحديث حالة الاشتراك في القائمة
        updateCompetitionEnrollment(competitionId, true);
        
        toast({
          title: 'تم الاشتراك',
          description: 'تم الاشتراك في المسابقة بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في الاشتراك في المسابقة',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubscriptionLoading(prev => ({ ...prev, [competitionId]: false }));
    }
  };

  // دالة مساعدة لتحديث حالة مسابقة واحدة
  const updateCompetitionEnrollment = (competitionId, isEnrolled) => {
    setCompetitions(prev => prev.map(comp => 
      comp.id === competitionId 
        ? { ...comp, is_enrolled: isEnrolled }
        : comp
    ));
    
    setStudentSubscriptions(prev => {
      const newSet = new Set(prev);
      if (isEnrolled) {
        newSet.add(competitionId);
      } else {
        newSet.delete(competitionId);
      }
      return newSet;
    });
  };

  // إلغاء الاشتراك من مسابقة
  const handleUnsubscribe = async (competitionId) => {
    try {
      setSubscriptionLoading(prev => ({ ...prev, [competitionId]: true }));
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await baseUrl.delete(`api/competitions/${competitionId}/leave`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data?.success) {
        // تحديث حالة الاشتراك في القائمة
        updateCompetitionEnrollment(competitionId, false);
        
        toast({
          title: 'تم إلغاء الاشتراك',
          description: 'تم إلغاء الاشتراك من المسابقة بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إلغاء الاشتراك من المسابقة',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubscriptionLoading(prev => ({ ...prev, [competitionId]: false }));
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  return (
    <Box bg={bgColor} minH="100vh" pb="120px">
      {/* Header Section */}
      <Box 
        bgGradient="linear(to-r, blue.500, orange.300)" 
        color="white" 
        py="8"
        px={{ base: 4, md: 8 }}
      >
        <Flex 
          justify="space-between" 
          align="center" 
          maxW="1200px" 
          mx="auto"
          direction={{ base: "column", md: "row" }}
        >
          <Box mb={{ base: 4, md: 0 }}>
            <Heading size="xl" mb="2">المسابقات التعليمية</Heading>
            <Text fontSize="lg">شارك واربح النقاط وطور من مهاراتك</Text>
          </Box>
          
          <Flex 
            align="center" 
            bg="rgba(255,255,255,0.2)" 
            p="3" 
            borderRadius="lg"
            backdropFilter="blur(10px)"
          >
            <Avatar 
              name={studentData.name} 
              src={studentData.avatar} 
              size="md" 
              mr="3"
            />
            <Box>
              <Text fontWeight="bold">{studentData.name}</Text>
              <Flex align="center">
                <Badge colorScheme="yellow" mr="2">
                  <Flex align="center">
                    <Icon as={FiStar} mr="1" />
                    {studentData.points} نقطة
                  </Flex>
                </Badge>
                <Text fontSize="sm">{studentData.level}</Text>
              </Flex>
            </Box>
          </Flex>
        </Flex>
      </Box>

      {/* Stats Section */}
      <Box 
        maxW="1200px" 
        mx="auto" 
        mt="-6" 
        mb="8" 
        px={{ base: 4, md: 8 }}
      >
        <SimpleGrid 
          columns={{ base: 2, md: 4 }} 
          spacing="4"
        >
          <Box 
            bg={cardBg} 
            p="4" 
            borderRadius="lg" 
            boxShadow="md"
            borderLeftWidth="4px"
            borderLeftColor="blue.400"
          >
            <Flex align="center">
              <Box 
                p="2" 
                bg="blue.100" 
                borderRadius="full" 
                mr="3"
                color="blue.500"
              >
                <Icon as={FiAward} />
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500">المسابقات النشطة</Text>
                <Text fontWeight="bold" fontSize="xl">{competitions.filter(c => c.is_active).length}</Text>
              </Box>
            </Flex>
          </Box>
          
          <Box 
            bg={cardBg} 
            p="4" 
            borderRadius="lg" 
            boxShadow="md"
            borderLeftWidth="4px"
            borderLeftColor="green.400"
          >
            <Flex align="center">
              <Box 
                p="2" 
                bg="green.100" 
                borderRadius="full" 
                mr="3"
                color="green.500"
              >
                <Icon as={FiUsers} />
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500">إجمالي المسابقات</Text>
                <Text fontWeight="bold" fontSize="xl">{competitions.length}</Text>
              </Box>
            </Flex>
          </Box>
          
          <Box 
            bg={cardBg} 
            p="4" 
            borderRadius="lg" 
            boxShadow="md"
            borderLeftWidth="4px"
            borderLeftColor="purple.400"
          >
            <Flex align="center">
              <Box 
                p="2" 
                bg="purple.100" 
                borderRadius="full" 
                mr="3"
                color="purple.500"
              >
                <Icon as={FiClock} />
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500">متوسط المدة</Text>
                <Text fontWeight="bold" fontSize="xl">{competitions.length ? Math.round(competitions.reduce((s,c)=>s+c.duration,0)/competitions.length) : 0} دقيقة</Text>
              </Box>
            </Flex>
          </Box>
          
          <Box 
            bg={cardBg} 
            p="4" 
            borderRadius="lg" 
            boxShadow="md"
            borderLeftWidth="4px"
            borderLeftColor="orange.400"
          >
            <Flex align="center">
              <Box 
                p="2" 
                bg="orange.100" 
                borderRadius="full" 
                mr="3"
                color="orange.500"
              >
                <Icon as={FiBarChart2} />
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.500">المرئية</Text>
                <Text fontWeight="bold" fontSize="xl">{competitions.filter(c => c.is_visible).length}</Text>
              </Box>
            </Flex>
          </Box>
        </SimpleGrid>
      </Box>

      {/* Main Content */}
      <Box maxW="1200px" mx="auto" px={{ base: 4, md: 8 }}>
        <Flex 
          justify="space-between" 
          align="center" 
          mb="6"
          direction={{ base: "column", md: "row" }}
        >
          <Heading size="lg" mb={{ base: 4, md: 0 }}>
            المسابقات المتاحة
          </Heading>
          
          <Flex>
            <Button 
              colorScheme="blue" 
              variant="outline" 
              mr="2"
              leftIcon={<Icon as={FiCalendar} />}
            >
              ترتيب حسب التاريخ
            </Button>
            <Button 
              colorScheme="purple"
              rightIcon={<Icon as={FiChevronRight} />}
            >
              مسابقاتي السابقة
            </Button>
          </Flex>
        </Flex>

        <Divider mb="6" />

        {/* Competitions Grid */}
        <Box>
          {loading ? (
            <SimpleGrid 
              columns={{ base: 1, sm: 2, md: 3 }} 
              spacing="4"
            >
              {Array.from({ length: 6 }).map((_, index) => (
                <CompetitionSkeleton key={index} />
              ))}
            </SimpleGrid>
          ) : competitions?.length > 0 ? (
            <SimpleGrid 
              columns={{ base: 1, sm: 2, md: 3 }} 
              spacing="4"
            >
              {competitions.map((comp, idx) => (
                                 <CompetitionCard
                   key={comp.id || idx}
                   competition={comp}
                   onSubscribe={handleSubscribe}
                   onUnsubscribe={handleUnsubscribe}
                   isLoading={subscriptionLoading[comp.id]}
                 />
              ))}
            </SimpleGrid>
          ) : (
            <Center 
              bg={cardBg} 
              p="10" 
              borderRadius="lg" 
              boxShadow="sm"
              flexDirection="column"
            >
              <Text fontSize="xl" mb="4">لا توجد مسابقات متاحة حالياً</Text>
              <Button 
                colorScheme="blue"
                onClick={fetchCompetitions}
                leftIcon={<Icon as={FiAward} />}
              >
                تحديث القائمة
              </Button>
              {error && (
                <Text mt="3" color="red.500" fontSize="sm">{error}</Text>
              )}
            </Center>
          )}
        </Box>
      </Box>
      <ScrollToTop/>
    </Box>
  );
};

export default Competitions;