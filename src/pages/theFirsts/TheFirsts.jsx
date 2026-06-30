import React, { useState, useEffect } from "react";
import { FaMedal, FaTrophy, FaStar, FaCrown, FaAward, FaChevronLeft, FaChevronRight, FaGem, FaFire, FaRocket } from "react-icons/fa";
import { 
  Box, 
  Text, 
  VStack, 
  HStack, 
  Flex, 
  Avatar,
  Badge,
  useColorModeValue,
  Heading,
  Divider,
  SimpleGrid,
  Icon,
  Progress,
  Button,
  Select,
  Spinner,
  Alert,
  AlertIcon,
  useToast
} from "@chakra-ui/react";
import baseUrl from "../../api/baseUrl";

const TheFirsts = () => {
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [competitionData, setCompetitionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const toast = useToast();

  // جلب المسابقات المتاحة
  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await baseUrl.get('api/competitions/student', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data?.success) {
        const availableCompetitions = response.data.data.filter(comp => comp.is_enrolled);
        setCompetitions(availableCompetitions);
        
        // اختيار أحدث مسابقة تلقائياً
        if (availableCompetitions.length > 0) {
          const latestCompetition = availableCompetitions[0];
          setSelectedCompetition(latestCompetition);
          await fetchLeaderboard(latestCompetition.id);
        }
      }
    } catch (error) {
      console.error('Error fetching competitions:', error);
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

  // جلب لوحة المتصدرين
  const fetchLeaderboard = async (competitionId, page = 1) => {
    try {
      setLeaderboardLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await baseUrl.get(`api/competitions/${competitionId}/leaderboard`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data?.success) {
        console.log('Leaderboard API Response:', response.data);
        if (page === 1) {
          setLeaderboard(response.data.data.leaderboard);
          setCompetitionData(response.data.data.competition);
        } else {
          setLeaderboard(prev => [...prev, ...response.data.data.leaderboard]);
        }
        setHasMore(response.data.data.pagination.has_more);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب لوحة المتصدرين',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLeaderboardLoading(false);
    }
  };

  // تغيير المسابقة
  const handleCompetitionChange = async (competitionId) => {
    const competition = competitions.find(comp => comp.id === parseInt(competitionId));
    if (competition) {
      setSelectedCompetition(competition);
      setCurrentPage(1);
      await fetchLeaderboard(competition.id, 1);
    }
  };

  // تحميل المزيد من النتائج
  const loadMore = async () => {
    if (selectedCompetition && hasMore) {
      await fetchLeaderboard(selectedCompetition.id, currentPage + 1);
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return (
          <Box position="relative">
            <Icon as={FaCrown} color="yellow.500" boxSize="8" />
            <Box
              position="absolute"
              top={-2}
              right={-2}
              bg="yellow.400"
              color="white"
              borderRadius="full"
              w="4"
              h="4"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="xs"
              fontWeight="bold"
            >
              👑
            </Box>
          </Box>
        );
      case 2:
        return (
          <Box position="relative">
            <Icon as={FaTrophy} color="gray.500" boxSize="7" />
            <Box
              position="absolute"
              top={-1}
              right={-1}
              bg="gray.400"
              color="white"
              borderRadius="full"
              w="3"
              h="3"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="xs"
            >
              🥈
            </Box>
          </Box>
        );
      case 3:
        return (
          <Box position="relative">
            <Icon as={FaMedal} color="orange.500" boxSize="7" />
            <Box
              position="absolute"
              top={-1}
              right={-1}
              bg="orange.400"
              color="white"
              borderRadius="full"
              w="3"
              h="3"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="xs"
            >
              🥉
            </Box>
          </Box>
        );
      case 4:
        return (
          <Box position="relative">
            <Icon as={FaGem} color="blue.500" boxSize="6" />
            <Box
              position="absolute"
              top={-1}
              right={-1}
              bg="blue.400"
              color="white"
              borderRadius="full"
              w="3"
              h="3"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="xs"
            >
              💎
            </Box>
          </Box>
        );
      case 5:
        return (
          <Box position="relative">
            <Icon as={FaFire} color="green.500" boxSize="6" />
            <Box
              position="absolute"
              top={-1}
              right={-1}
              bg="green.400"
              color="white"
              borderRadius="full"
              w="3"
              h="3"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="xs"
            >
              🔥
            </Box>
          </Box>
        );
      default:
        return <Icon as={FaStar} color="purple.500" boxSize="6" />;
    }
  };

  const getRankBadge = (rank) => {
    const rankColors = {
      1: { bg: "yellow.400", color: "white", border: "yellow.500", shadow: "0 4px 12px rgba(234, 179, 8, 0.4)" },
      2: { bg: "gray.400", color: "white", border: "gray.500", shadow: "0 4px 12px rgba(156, 163, 175, 0.4)" },
      3: { bg: "orange.400", color: "white", border: "orange.500", shadow: "0 4px 12px rgba(251, 146, 60, 0.4)" },
      4: { bg: "blue.400", color: "white", border: "blue.500", shadow: "0 4px 12px rgba(59, 130, 246, 0.4)" },
      5: { bg: "green.400", color: "white", border: "green.500", shadow: "0 4px 12px rgba(34, 197, 94, 0.4)" }
    };
    
    return (
      <Badge 
        bg={rankColors[rank]?.bg || "gray.400"} 
        color={rankColors[rank]?.color || "white"}
        borderWidth="2px"
        borderColor={rankColors[rank]?.border || "gray.500"}
        borderRadius="full"
        px={4}
        py={2}
        fontSize="lg"
        fontWeight="bold"
        boxShadow={rankColors[rank]?.shadow || "0 2px 8px rgba(0,0,0,0.2)"}
        transform={rank === 1 ? "scale(1.1)" : "scale(1)"}
        transition="all 0.3s ease"
      >
        #{rank}
      </Badge>
    );
  };

  const cardBg = useColorModeValue("white", "gray.700");
  const headerBg = useColorModeValue("blue.600", "blue.800");

  if (loading) {
    return (
      <Box width="100%" maxW="800px" mx="auto" mt={8} mb={12} textAlign="center">
        <Spinner size="xl" color="blue.500" />
        <Text mt={4}>جاري تحميل المسابقات...</Text>
      </Box>
    );
  }

  if (competitions.length === 0) {
    return (
      <Box width="100%" maxW="800px" mx="auto" mt={8} mb={12} textAlign="center">
        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          لا توجد مسابقات متاحة حالياً
        </Alert>
      </Box>
    );
  }

  return (
    <Box width="100%" maxW="800px" mx="auto" mt={8} mb={12}>
      {/* Header */}
      <Box 
        bgGradient={`linear(to-r, ${headerBg}, purple.600)`}
        color="white"
        p={6}
        borderRadius="lg"
        mb={6}
        boxShadow="lg"
        textAlign="center"
      >
        <Heading size="xl" mb={2}>🏆 لوحة المتصدرين</Heading>
        <Text fontSize="lg">أفضل الطلاب في المسابقة</Text>
      </Box>

      {/* Competition Selector */}
      <Box bg={cardBg} p={4} borderRadius="lg" boxShadow="md" mb={6}>
        <VStack spacing={4}>
          <Text fontWeight="bold" color="gray.700">اختر المسابقة:</Text>
          <Select
            value={selectedCompetition?.id || ''}
            onChange={(e) => handleCompetitionChange(e.target.value)}
            placeholder="اختر المسابقة"
            size="lg"
            maxW="400px"
          >
            {competitions.map((competition) => (
              <option key={competition.id} value={competition.id}>
                {competition.title} - {competition.grade_name}
              </option>
            ))}
          </Select>
        </VStack>
      </Box>

      {selectedCompetition && (
        <>
          {/* Stats */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={8}>
            <Box bg={cardBg} p={4} borderRadius="lg" boxShadow="md" textAlign="center">
              <Text fontSize="sm" color="gray.500">إجمالي المشاركين</Text>
              <Text fontSize="2xl" fontWeight="bold">{competitionData?.total_students || leaderboard.length}</Text>
            </Box>
            <Box bg={cardBg} p={4} borderRadius="lg" boxShadow="md" textAlign="center">
              <Text fontSize="sm" color="gray.500">عدد الأسئلة</Text>
              <Text fontSize="2xl" fontWeight="bold">{selectedCompetition.questions_count}</Text>
            </Box>
            <Box bg={cardBg} p={4} borderRadius="lg" boxShadow="md" textAlign="center">
              <Text fontSize="sm" color="gray.500">مدة المسابقة</Text>
              <Text fontSize="2xl" fontWeight="bold">{selectedCompetition.duration} دقيقة</Text>
            </Box>
          </SimpleGrid>

          {/* Top Competitors */}
          {leaderboardLoading && leaderboard.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Spinner size="xl" color="blue.500" />
              <Text mt={4}>جاري تحميل لوحة المتصدرين...</Text>
            </Box>
          ) : leaderboard.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">لا يوجد متصدرين لهذه المسابقة بعد</Text>
            </Box>
          ) : (
            <VStack spacing={4}>
              {leaderboard.map((competitor) => (
                <Box
                  key={competitor.rank}
                  width="100%"
                  bg={competitor.rank === 1 ? "yellow.50" : cardBg}
                  borderRadius="xl"
                  boxShadow={competitor.rank === 1 ? "0 8px 25px rgba(234, 179, 8, 0.15)" : "md"}
                  p={6}
                  borderLeftWidth="6px"
                  borderLeftColor={
                    competitor.rank === 1 ? "yellow.500" :
                    competitor.rank === 2 ? "gray.500" :
                    competitor.rank === 3 ? "orange.500" : "blue.500"
                  }
                  borderWidth={competitor.rank === 1 ? "2px" : "1px"}
                  borderColor={competitor.rank === 1 ? "yellow.200" : "transparent"}
                  transition="all 0.3s ease"
                  _hover={{
                    transform: competitor.rank === 1 ? "translateY(-4px) scale(1.02)" : "translateY(-2px)",
                    boxShadow: competitor.rank === 1 ? "0 12px 35px rgba(234, 179, 8, 0.25)" : "lg"
                  }}
                  position="relative"
                  overflow="hidden"
                >
                  {/* خلفية متدرجة للمرتبة الأولى */}
                  {competitor.rank === 1 && (
                    <>
                      <Box
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        bottom={0}
                        bgGradient="linear(135deg, yellow.50 0%, orange.50 100%)"
                        opacity={0.3}
                      />
                      <Box
                        position="absolute"
                        top={-3}
                        right={-3}
                        bg="yellow.500"
                        color="white"
                        borderRadius="full"
                        p={3}
                        boxShadow="0 4px 12px rgba(234, 179, 8, 0.4)"
                        fontSize="sm"
                        fontWeight="bold"
                        border="2px solid"
                        borderColor="yellow.600"
                      >
                        🏆 الأول
                      </Box>
                    </>
                  )}
                  
                  {/* شارة خاصة للمرتبة الثانية */}
                  {competitor.rank === 2 && (
                    <Box
                      position="absolute"
                      top={-2}
                      right={-2}
                      bg="gray.500"
                      color="white"
                      borderRadius="full"
                      p={2}
                      boxShadow="0 4px 12px rgba(156, 163, 175, 0.4)"
                      fontSize="xs"
                      fontWeight="bold"
                      border="2px solid"
                      borderColor="gray.600"
                    >
                      🥈 الثاني
                    </Box>
                  )}
                  
                  {/* شارة خاصة للمرتبة الثالثة */}
                  {competitor.rank === 3 && (
                    <Box
                      position="absolute"
                      top={-2}
                      right={-2}
                      bg="orange.500"
                      color="white"
                      borderRadius="full"
                      p={2}
                      boxShadow="0 4px 12px rgba(251, 146, 60, 0.4)"
                      fontSize="xs"
                      fontWeight="bold"
                      border="2px solid"
                      borderColor="orange.600"
                    >
                      🥉 الثالث
                    </Box>
                  )}

                  <Flex alignItems="center">
                    <Flex alignItems="center" flex={1}>
                      <Box mr={4}>
                        {getRankBadge(competitor.rank)}
                      </Box>
                      <Avatar 
                        name={competitor.student_name} 
                        size={competitor.rank === 1 ? "lg" : "md"}
                        mr={4}
                        bg={competitor.rank === 1 ? "yellow.500" : "blue.500"}
                        color="white"
                        border={competitor.rank === 1 ? "3px solid" : "2px solid"}
                        borderColor={competitor.rank === 1 ? "yellow.600" : "blue.600"}
                        boxShadow={competitor.rank === 1 ? "0 4px 12px rgba(234, 179, 8, 0.4)" : "md"}
                      />
                      <Box>
                        <Text 
                          fontSize={competitor.rank === 1 ? "xl" : "lg"} 
                          fontWeight={competitor.rank === 1 ? "extrabold" : "bold"}
                          color={competitor.rank === 1 ? "yellow.700" : "gray.800"}
                        >
                          {competitor.student_name}
                          {competitor.rank <= 3 && (
                            <Box as="span" ml={2} display="inline-block">
                              {getRankIcon(competitor.rank)}
                            </Box>
                          )}
                        </Text>
                        <HStack spacing={2} mt={1} flexWrap="wrap">
                          <Badge colorScheme="green" variant="subtle">
                            {competitor.correct_answers}/{competitor.total_questions} إجابة صحيحة
                          </Badge>
                          <Badge colorScheme="blue" variant="subtle">
                            {competitor.percentage}%
                          </Badge>
                        </HStack>
                      </Box>
                    </Flex>
                    
                    <Box textAlign="right" minW="120px">
                      <Text 
                        fontSize={competitor.rank === 1 ? "2xl" : "xl"} 
                        fontWeight={competitor.rank === 1 ? "extrabold" : "bold"} 
                        color={competitor.rank === 1 ? "yellow.600" : "blue.500"}
                      >
                        {competitor.score} نقطة
                      </Text>
                      <Progress 
                        value={competitor.percentage} 
                        size={competitor.rank === 1 ? "md" : "sm"}
                        colorScheme={competitor.rank === 1 ? "yellow" : "blue"}
                        mt={2}
                        borderRadius="full"
                        bg={competitor.rank === 1 ? "yellow.100" : "blue.100"}
                      />
                      <Text 
                        fontSize="sm" 
                        color={competitor.rank === 1 ? "yellow.700" : "gray.500"} 
                        mt={1}
                        fontWeight={competitor.rank === 1 ? "semibold" : "normal"}
                      >
                        {competitor.percentage}% إنجاز
                      </Text>
                      <Text fontSize="xs" color="gray.400" mt={1}>
                        {new Date(competitor.submitted_at).toLocaleDateString('ar-EG')}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              ))}
            </VStack>
          )}

          {/* Load More Button */}
          {hasMore && (
            <Box textAlign="center" mt={6}>
              <Button
                colorScheme="blue"
                variant="outline"
                onClick={loadMore}
                isLoading={leaderboardLoading}
                leftIcon={<FaChevronRight />}
              >
                عرض المزيد
              </Button>
            </Box>
          )}
        </>
      )}

      {/* Footer */}
      <Box mt={8} textAlign="center">
        <Text color="gray.500">
          يتم تحديث الترتيب كل ساعة. آخر تحديث: {new Date().toLocaleTimeString()}
        </Text>
      </Box>
    </Box>
  );
};

export default TheFirsts;