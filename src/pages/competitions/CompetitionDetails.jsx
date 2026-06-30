import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Flex,
  Heading,
  useColorModeValue,
  Input,
  Select,
  Textarea,
  Grid,
  GridItem,
  Card,
  useToast,
  IconButton,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Center,
  Divider,
  Badge,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  SimpleGrid,
} from "@chakra-ui/react";
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiChevronRight } from "react-icons/fi";
import baseUrl from "../../api/baseUrl";
import UserType from "../../Hooks/auth/userType";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";

const CompetitionDetails = () => {
  const { id } = useParams();
  const [userData, isAdmin, isTeacher, student] = UserType();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  
  // للطلاب
  const [studentCompetition, setStudentCompetition] = useState(null);
  const [studentQuestions, setStudentQuestions] = useState([]);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentLoading, setStudentLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [competitionResults, setCompetitionResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasSolved, setHasSolved] = useState(false);
  const [previousAnswers, setPreviousAnswers] = useState([]);
  
  // للإداريين
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [updatingAnswers, setUpdatingAnswers] = useState({});
  
  // للقائمة المدرسية
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  
  // Single question form
  const [questionForm, setQuestionForm] = useState({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "",
    points: 1,
    question_order: 0,
    is_active: true
  });

  // Text questions form
  const [textQuestions, setTextQuestions] = useState({
    questions_text: ""
  });

  // جلب أسئلة المسابقة للطلاب
  const fetchStudentCompetitionDetails = async () => {
    try {
      setStudentLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('لم يتم العثور على توكين المصادقة');
      }

      const response = await baseUrl.get(`api/competitions/${id}/student-details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setStudentCompetition(response.data.data.competition);
        setStudentQuestions(response.data.data.questions || []);
        setHasSolved(response.data.data.has_solved || false);
        
        if (response.data.data.has_solved) {
          // إذا كان الطالب قد امتحن المسابقة من قبل
          setCompetitionResults(response.data.data.result);
          setPreviousAnswers(response.data.data.answers || []);
          setShowResults(true);
        } else {
          // تهيئة الإجابات للأسئلة الجديدة
          const initialAnswers = {};
          response.data.data.questions.forEach(q => {
            initialAnswers[q.id] = null;
          });
          setStudentAnswers(initialAnswers);
        }
      } else {
        throw new Error('فشل في جلب تفاصيل المسابقة');
      }
    } catch (error) {
      console.error('Error fetching student competition details:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب تفاصيل المسابقة",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setStudentLoading(false);
    }
  };

  // جلب أسئلة المسابقة للإداريين
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('لم يتم العثور على توكين المصادقة');
      }

      const response = await baseUrl.get(`api/competition-questions/competition/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setQuestions(response.data.data || []);
      } else {
        throw new Error('فشل في جلب الأسئلة');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب أسئلة المسابقة",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // إضافة سؤال واحد
  const handleAddQuestion = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const questionData = {
        ...questionForm,
        competition_id: parseInt(id),
        question_order: questions.length
      };

      const response = await baseUrl.post('api/competition-questions', questionData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast({
          title: "تم الإضافة",
          description: "تم إضافة السؤال بنجاح",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        // إعادة تعيين النموذج وإغلاق النافذة
        setQuestionForm({
          question_text: "",
          option_a: "",
          option_b: "",
          option_c: "",
          option_d: "",
          correct_answer: "",
          points: 1,
          question_order: 0,
          is_active: true
        });
        onClose();
        
        // إعادة جلب الأسئلة
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error adding question:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة السؤال",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // إضافة أسئلة نصية
  const handleTextQuestionsAdd = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const textData = {
        competition_id: parseInt(id),
        questions_text: textQuestions.questions_text
      };

      const response = await baseUrl.post('api/competition-questions/text', textData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast({
          title: "تم الإضافة",
          description: "تم إضافة الأسئلة النصية بنجاح",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        // إعادة تعيين النموذج وإغلاق النافذة
        setTextQuestions({ questions_text: "" });
        setIsBulkModalOpen(false);
        
        // إعادة جلب الأسئلة
        fetchQuestions();
      }
    } catch (error) {
      console.error('Error adding text questions:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة الأسئلة النصية",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // حذف سؤال
  const handleDeleteQuestion = async () => {
    if (!selectedQuestion) return;
    
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      await baseUrl.delete(`api/competition-questions/${selectedQuestion.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      toast({
        title: "تم الحذف",
        description: "تم حذف السؤال بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // إزالة السؤال من القائمة
      setQuestions(prev => prev.filter(q => q.id !== selectedQuestion.id));
      setIsDeleteDialogOpen(false);
      setSelectedQuestion(null);
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف السؤال",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // تغيير حالة السؤال
  const handleToggleQuestionStatus = async (questionId, newStatus) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      await baseUrl.patch(`api/competition-questions/${questionId}`, {
        is_active: newStatus
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // تحديث الحالة في القائمة
      setQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, is_active: newStatus } : q
      ));

      toast({
        title: "تم التحديث",
        description: `تم ${newStatus ? 'تفعيل' : 'إيقاف'} السؤال بنجاح`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating question status:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة السؤال",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // تغيير الإجابة الصحيحة
  const handleCorrectAnswerChange = async (questionId, newCorrectAnswer) => {
    try {
      // تعيين حالة التحميل لهذا السؤال
      setUpdatingAnswers(prev => ({ ...prev, [questionId]: true }));
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      await baseUrl.patch(`api/competition-questions/${questionId}/correct-answer`, {
        correct_answer: newCorrectAnswer
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // تحديث الإجابة الصحيحة في القائمة
      setQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, correct_answer: newCorrectAnswer } : q
      ));

      toast({
        title: "تم التحديث",
        description: "تم تحديث الإجابة الصحيحة بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating correct answer:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الإجابة الصحيحة",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      // إزالة حالة التحميل لهذا السؤال
      setUpdatingAnswers(prev => ({ ...prev, [questionId]: false }));
    }
  };

  // إنهاء المسابقة وإرسال الإجابات
  const handleSubmitCompetition = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // تحويل الإجابات إلى الشكل المطلوب
      const answers = Object.entries(studentAnswers).map(([questionId, selectedAnswer]) => ({
        question_id: parseInt(questionId),
        selected_answer: selectedAnswer
      }));

      const response = await baseUrl.post(`api/competitions/${id}/solve`, {
        answers: answers
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data?.success) {
        setCompetitionResults(response.data.data);
        setShowResults(true);
        toast({
          title: 'تم إنهاء المسابقة',
          description: 'تم إرسال إجاباتك بنجاح',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error submitting competition:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إرسال الإجابات',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // جلب القائمة المدرسية
  const fetchLeaderboard = async () => {
    try {
      setLeaderboardLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('لم يتم العثور على توكين المصادقة');
      }

      const response = await baseUrl.get(`api/competitions/${id}/leaderboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setLeaderboardData(response.data.data);
      } else {
        throw new Error('فشل في جلب القائمة المدرسية');
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب القائمة المدرسية",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLeaderboardLoading(false);
    }
  };



  useEffect(() => {
    if (id) {
      if (student) {
        fetchStudentCompetitionDetails();
      } else if (isAdmin) {
        fetchQuestions();
      }
    }
  }, [id, student, isAdmin]);

  // التحقق من أن المستخدم أدمن أو طالب
  if (!isAdmin && !student) {
    return (
      <Center minH="100vh">
        <Text fontSize="xl" color="red.500">
          لا يمكنك الوصول لهذه الصفحة
        </Text>
      </Center>
    );
  }

  // عرض حالة التحميل للطلاب
  if (student && studentLoading) {
    return (
      <Center minH="100vh">
        <VStack spacing={6}>
          <Spinner size="xl" color="blue.500" />
          <Text fontSize="lg" color="gray.600">
            جاري تحميل المسابقة...
          </Text>
        </VStack>
      </Center>
    );
  }

  // عرض حالة التحميل للإداريين
  if (isAdmin && loading) {
    return (
      <Center minH="100vh">
        <VStack spacing={6}>
          <Spinner size="xl" color="blue.500" />
          <Text fontSize="lg" color="gray.600">
            جاري تحميل أسئلة المسابقة...
          </Text>
        </VStack>
      </Center>
    );
  }

  // واجهة الطالب
  if (student) {
    return (
      <Box minH="100vh" p={6} bg="gray.50">
        {/* Header */}
        <Box mb={8} textAlign="center">
          <Heading size="lg" color="blue.600" mb={2}>
            {studentCompetition?.title || "المسابقة"}
          </Heading>
          <Text color="gray.600" fontSize="lg">
            مدة المسابقة: {studentCompetition?.duration} دقيقة
          </Text>
          <Divider mt={4} />
        </Box>

        {/* Progress Bar */}
        <Box mb={8} p={6} bg="white" borderRadius="lg" boxShadow="md">
          <VStack spacing={4}>
            <HStack justify="space-between" w="full">
              <Text fontWeight="bold" color="gray.700">
                التقدم: {currentQuestionIndex + 1} من {studentQuestions.length}
              </Text>
              <Text fontWeight="bold" color="blue.600">
                {Math.round(((currentQuestionIndex + 1) / studentQuestions.length) * 100)}%
              </Text>
            </HStack>
            <Box w="full" bg="gray.200" borderRadius="full" h="8px">
              <Box
                bg="blue.500"
                h="8px"
                borderRadius="full"
                transition="width 0.3s ease"
                width={`${((currentQuestionIndex + 1) / studentQuestions.length) * 100}%`}
              />
            </Box>
            <HStack justify="space-between" w="full" fontSize="sm" color="gray.600">
              <Text>الأسئلة المنجزة: {Object.values(studentAnswers).filter(ans => ans !== null).length}</Text>
              <Text>الأسئلة المتبقية: {studentQuestions.length - Object.values(studentAnswers).filter(ans => ans !== null).length}</Text>
            </HStack>
          </VStack>
        </Box>

        {/* Question Display */}
        {!showResults && studentQuestions.length > 0 && (
          <Box bg="white" borderRadius="lg" boxShadow="lg" p={8}>
            <VStack spacing={6} align="stretch">
              {/* Question Header */}
              <Box textAlign="center" pb={4} borderBottom="2px solid" borderColor="gray.200">
                <Text fontSize="2xl" fontWeight="bold" color="gray.800" mb={2}>
                  السؤال {currentQuestionIndex + 1}
                </Text>
                <Text fontSize="lg" color="gray.600">
                  {studentQuestions[currentQuestionIndex].question_text}
                </Text>
              </Box>

              {/* Options */}
              <VStack spacing={4} align="stretch">
                {['A', 'B', 'C', 'D'].map((option) => {
                  const question = studentQuestions[currentQuestionIndex];
                  const optionText = question[`option_${option.toLowerCase()}`];
                  const isSelected = studentAnswers[question.id] === option;
                  
                  return (
                    <Box
                      key={option}
                      p={4}
                      bg={isSelected ? "blue.100" : "gray.50"}
                      border="2px solid"
                      borderColor={isSelected ? "blue.400" : "gray.200"}
                      borderRadius="lg"
                      cursor="pointer"
                      _hover={{
                        bg: isSelected ? "blue.200" : "gray.100",
                        transform: "scale(1.02)"
                      }}
                      transition="all 0.2s"
                      onClick={() => setStudentAnswers(prev => ({
                        ...prev,
                        [question.id]: option
                      }))}
                    >
                      <HStack spacing={4}>
                        <Box
                          w="40px"
                          h="40px"
                          bg={isSelected ? "blue.500" : "gray.300"}
                          color="white"
                          borderRadius="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontWeight="bold"
                          fontSize="lg"
                        >
                          {option}
                        </Box>
                        <Text fontSize="lg" color="gray.800" fontWeight="medium">
                          {optionText}
                        </Text>
                      </HStack>
                    </Box>
                  );
                })}
              </VStack>

              {/* Navigation */}
              <HStack justify="space-between" pt={6} borderTop="2px solid" borderColor="gray.200">
                <Button
                  colorScheme="gray"
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  leftIcon={<FiChevronRight transform="rotate(180deg)" />}
                >
                  السؤال السابق
                </Button>
                
                <HStack spacing={2}>
                  {studentQuestions.map((_, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant={index === currentQuestionIndex ? "solid" : "outline"}
                      colorScheme={studentAnswers[studentQuestions[index].id] ? "green" : "gray"}
                      onClick={() => setCurrentQuestionIndex(index)}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </HStack>

                <Button
                  colorScheme="blue"
                  size="lg"
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(studentQuestions.length - 1, prev + 1))}
                  disabled={currentQuestionIndex === studentQuestions.length - 1}
                  rightIcon={<FiChevronRight />}
                >
                  السؤال التالي
                </Button>
              </HStack>

              {/* Submit Button */}
              {Object.values(studentAnswers).filter(ans => ans !== null).length === studentQuestions.length && (
                <Box textAlign="center" pt={4}>
                  <Button
                    colorScheme="green"
                    size="lg"
                    px={8}
                    py={4}
                    fontSize="lg"
                    _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                    transition="all 0.2s"
                    onClick={handleSubmitCompetition}
                    isLoading={submitting}
                    loadingText="جاري الإرسال..."
                  >
                    إنهاء المسابقة
                  </Button>
                </Box>
              )}
            </VStack>
          </Box>
        )}

        {/* Results Display */}
        {showResults && competitionResults && (
          <Box bg="white" borderRadius="lg" boxShadow="lg" p={8}>
            <VStack spacing={8} align="stretch">
              {/* Header */}
              <Box textAlign="center" pb={6} borderBottom="2px solid" borderColor="gray.200">
                <Heading size="xl" color={hasSolved ? "blue.600" : "green.600"} mb={2}>
                  {hasSolved ? "📊 نتائج المسابقة السابقة" : "🎉 تم إنهاء المسابقة بنجاح!"}
                </Heading>
                <Text fontSize="lg" color="gray.600">
                  {new Date(competitionResults.submitted_at).toLocaleDateString('ar-EG')} - {new Date(competitionResults.submitted_at).toLocaleTimeString('ar-EG')}
                </Text>
              </Box>

              {/* Main Results */}
              <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6}>
                <GridItem>
                  <Card p={6} textAlign="center" bg="blue.50" border="1px solid" borderColor="blue.200">
                    <Text fontSize="3xl" fontWeight="bold" color="blue.600">
                      {competitionResults.percentage || competitionResults.score}%
                    </Text>
                    <Text color="blue.700" fontSize="lg">النسبة المئوية</Text>
                  </Card>
                </GridItem>
                
                <GridItem>
                  <Card p={6} textAlign="center" bg="green.50" border="1px solid" borderColor="green.200">
                    <Text fontSize="3xl" fontWeight="bold" color="green.600">
                      {competitionResults.earned_points}/{competitionResults.total_points}
                    </Text>
                    <Text color="green.700" fontSize="lg">النقاط المكتسبة</Text>
                  </Card>
                </GridItem>
                
                <GridItem>
                  <Card p={6} textAlign="center" bg="purple.50" border="1px solid" borderColor="purple.200">
                    <Text fontSize="3xl" fontWeight="bold" color="purple.600">
                      {competitionResults.correct_answers}/{competitionResults.total_questions}
                    </Text>
                    <Text color="purple.700" fontSize="lg">الإجابات الصحيحة</Text>
                  </Card>
                </GridItem>
                
                <GridItem>
                  <Card p={6} textAlign="center" bg="orange.50" border="1px solid" borderColor="orange.200">
                    <Text fontSize="3xl" fontWeight="bold" color="orange.600">
                      {competitionResults.wrong_answers}
                    </Text>
                    <Text color="orange.700" fontSize="lg">الإجابات الخاطئة</Text>
                  </Card>
                </GridItem>
              </Grid>

              {/* Detailed Results */}
              <Box p={6} bg="gray.50" borderRadius="lg">
                <VStack spacing={4} align="stretch">
                  <Heading size="md" color="gray.800" textAlign="center">
                    تفاصيل النتائج
                  </Heading>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <HStack justify="space-between" p={3} bg="white" borderRadius="md">
                      <Text fontWeight="semibold" color="gray.700">إجمالي الأسئلة:</Text>
                      <Text fontWeight="bold" color="blue.600">{competitionResults.total_questions}</Text>
                    </HStack>
                    
                    <HStack justify="space-between" p={3} bg="white" borderRadius="md">
                      <Text fontWeight="semibold" color="gray.700">الإجابات الصحيحة:</Text>
                      <Text fontWeight="bold" color="green.600">{competitionResults.correct_answers}</Text>
                    </HStack>
                    
                    <HStack justify="space-between" p={3} bg="white" borderRadius="md">
                      <Text fontWeight="semibold" color="gray.700">الإجابات الخاطئة:</Text>
                      <Text fontWeight="bold" color="red.600">{competitionResults.wrong_answers}</Text>
                    </HStack>
                    
                    <HStack justify="space-between" p={3} bg="white" borderRadius="md">
                      <Text fontWeight="semibold" color="gray.700">إجمالي النقاط:</Text>
                      <Text fontWeight="bold" color="purple.600">{competitionResults.total_points}</Text>
                    </HStack>
                  </SimpleGrid>
                </VStack>
              </Box>

              {/* Previous Answers Review */}
              {hasSolved && previousAnswers.length > 0 && (
                <Box p={6} bg="gray.50" borderRadius="lg">
                  <VStack spacing={4} align="stretch">
                    <Heading size="md" color="gray.800" textAlign="center">
                      مراجعة الإجابات
                    </Heading>
                    
                    <VStack spacing={4} align="stretch">
                      {previousAnswers.map((answer, index) => (
                        <Card key={answer.question_id} p={4} bg="white" borderRadius="md">
                          <VStack spacing={3} align="stretch">
                            {/* Question */}
                            <Box>
                              <Text fontWeight="bold" color="gray.800" mb={2}>
                                السؤال {index + 1}:
                              </Text>
                              <Text color="gray.700" fontSize="md">
                                {answer.question_text}
                              </Text>
                            </Box>
                            
                            {/* Answers Comparison */}
                            <HStack spacing={4} justify="space-between">
                              <Box>
                                <Text fontSize="sm" color="gray.500" mb={1}>إجابتك:</Text>
                                <Badge 
                                  colorScheme={answer.is_correct ? "green" : "red"}
                                  variant="solid"
                                  fontSize="md"
                                  px={3}
                                  py={1}
                                >
                                  {answer.student_answer}
                                </Badge>
                              </Box>
                              
                              <Box>
                                <Text fontSize="sm" color="gray.500" mb={1}>الإجابة الصحيحة:</Text>
                                <Badge 
                                  colorScheme="green"
                                  variant="solid"
                                  fontSize="md"
                                  px={3}
                                  py={1}
                                >
                                  {answer.correct_answer}
                                </Badge>
                              </Box>
                              
                              <Box>
                                <Text fontSize="sm" color="gray.500" mb={1}>النقاط:</Text>
                                <Badge 
                                  colorScheme={answer.is_correct ? "green" : "gray"}
                                  variant="outline"
                                  fontSize="md"
                                  px={3}
                                  py={1}
                                >
                                  {answer.earned_points}/{answer.points}
                                </Badge>
                              </Box>
                            </HStack>
                            
                            {/* Explanation for wrong answers */}
                            {!answer.is_correct && answer.explanation && (
                              <Box p={3} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
                                <Text fontSize="sm" color="red.700" fontWeight="medium">
                                  💡 {answer.explanation}
                                </Text>
                              </Box>
                            )}
                          </VStack>
                        </Card>
                      ))}
                    </VStack>
                  </VStack>
                </Box>
              )}

              {/* Actions */}
              <Box textAlign="center" pt={4}>
                {!hasSolved ? (
                  <Button
                    colorScheme="blue"
                    size="lg"
                    px={8}
                    py={4}
                    fontSize="lg"
                    onClick={() => {
                      setShowResults(false);
                      setCurrentQuestionIndex(0);
                      setStudentAnswers({});
                    }}
                    _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                    transition="all 0.2s"
                  >
                    إعادة المحاولة
                  </Button>
                ) : (
                  <Text color="gray.600" fontSize="lg">
                    لا يمكن إعادة المحاولة في هذه المسابقة
                  </Text>
                )}
              </Box>
            </VStack>
          </Box>
        )}
      </Box>
    );
  }

  // واجهة الإداري
  return (
    <Box minH="100vh" p={6} bg="gray.50">
      {/* Header */}
      <Box mb={8} textAlign="center">
        <Heading size="lg" color="blue.600" mb={2}>
          إدارة أسئلة المسابقة
        </Heading>
        <Text color="gray.600" fontSize="lg">
          {questions.length > 0 && questions[0].competition_title 
            ? questions[0].competition_title 
            : `المسابقة رقم ${id}`
          }
        </Text>
        <Divider mt={4} />
      </Box>

      {/* Statistics */}
      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6} mb={8}>
        <GridItem>
          <Card p={6} textAlign="center" bg="blue.50" border="1px solid" borderColor="blue.200">
            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
              {questions.length}
            </Text>
            <Text color="blue.700">إجمالي الأسئلة</Text>
          </Card>
        </GridItem>
        <GridItem>
          <Card p={6} textAlign="center" bg="green.50" border="1px solid" borderColor="green.200">
            <Text fontSize="2xl" fontWeight="bold" color="green.600">
              {questions.filter(q => q.is_active).length}
            </Text>
            <Text color="green.700">الأسئلة النشطة</Text>
          </Card>
        </GridItem>
        <GridItem>
          <Card p={6} textAlign="center" bg="purple.50" border="1px solid" borderColor="purple.200">
            <Text fontSize="2xl" fontWeight="bold" color="purple.600">
              {questions.reduce((sum, q) => sum + q.points, 0)}
            </Text>
            <Text color="purple.700">إجمالي النقاط</Text>
          </Card>
        </GridItem>
        {questions.length > 0 && (
          <GridItem>
            <Card p={6} textAlign="center" bg="orange.50" border="1px solid" borderColor="orange.200">
              <Text fontSize="lg" fontWeight="bold" color="orange.700" noOfLines={2}>
                {questions[0].competition_title}
              </Text>
              <Text color="orange.600" fontSize="sm">عنوان المسابقة</Text>
            </Card>
          </GridItem>
        )}
      </Grid>

      {/* Action Buttons */}
      <HStack spacing={4} mb={8} justify="center">
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          size="lg"
          onClick={onOpen}
        >
          إضافة سؤال واحد
        </Button>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="green"
          size="lg"
          onClick={() => setIsBulkModalOpen(true)}
        >
          إضافة أسئلة نصية
        </Button>
        <Button
          leftIcon={<FiEye />}
          colorScheme="purple"
          size="lg"
          onClick={() => {
            setIsLeaderboardOpen(true);
            fetchLeaderboard();
          }}
        >
          القائمة المدرسية
        </Button>
      </HStack>

      {/* Questions List */}
      {questions.length === 0 ? (
        <Center py={12}>
          <VStack spacing={4}>
            <Text fontSize="lg" color="gray.500">
              لا توجد أسئلة حالياً
            </Text>
            <Text fontSize="sm" color="gray.400">
              قم بإضافة أسئلة للمسابقة للبدء
        </Text>
          </VStack>
        </Center>
      ) : (
        <VStack spacing={4} align="stretch">
          {questions.map((question, index) => (
            <Card key={question.id} p={6} shadow="md">
              <VStack align="stretch" spacing={4}>
                                {/* Question Header */}
                <HStack justify="space-between" align="start">
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Badge colorScheme="blue" variant="solid">
                        السؤال {index + 1}
                      </Badge>
                      <Badge 
                        colorScheme={question.is_active ? "green" : "red"}
                        variant="solid"
                      >
                        {question.is_active ? "نشط" : "متوقف"}
                      </Badge>
                      <Badge colorScheme="purple" variant="outline">
                        {question.points} نقطة
                      </Badge>
                    </HStack>
                    <Text fontSize="lg" fontWeight="bold" color="gray.800">
                      {question.question_text}
              </Text>
                    <HStack spacing={4} fontSize="sm" color="gray.600">
                      <Text>أنشئت بواسطة: {question.creator_name}</Text>
                      <Text>التاريخ: {new Date(question.created_at).toLocaleDateString('ar-EG')}</Text>
                    </HStack>
                  </VStack>
                  
                  <HStack spacing={2}>
                    <Tooltip label={question.is_active ? "إيقاف السؤال" : "تفعيل السؤال"}>
                      <IconButton
                        icon={question.is_active ? <FiEyeOff /> : <FiEye />}
                        colorScheme={question.is_active ? "orange" : "blue"}
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleQuestionStatus(question.id, !question.is_active)}
                        isLoading={actionLoading}
                      />
                    </Tooltip>

                    <Tooltip label="حذف السؤال">
                      <IconButton
                        icon={<FiTrash2 />}
                        colorScheme="red"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedQuestion(question);
                          setIsDeleteDialogOpen(true);
                        }}
                      />
                    </Tooltip>
                  </HStack>
                </HStack>

                {/* Options */}
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box 
                    p={3} 
                    bg={
                      updatingAnswers[question.id] && question.correct_answer === "A" 
                        ? "yellow.100" 
                        : question.correct_answer === "A" 
                        ? "green.100" 
                        : "gray.100"
                    }
                    border="2px solid"
                    borderColor={
                      updatingAnswers[question.id] && question.correct_answer === "A" 
                        ? "yellow.400" 
                        : question.correct_answer === "A" 
                        ? "green.400" 
                        : "gray.200"
                    }
                    borderRadius="md"
                    cursor={updatingAnswers[question.id] ? "not-allowed" : "pointer"}
                    _hover={{
                      bg: updatingAnswers[question.id] 
                        ? (question.correct_answer === "A" ? "yellow.100" : "gray.100")
                        : question.correct_answer === "A" 
                        ? "green.200" 
                        : "gray.200",
                      transform: updatingAnswers[question.id] ? "none" : "scale(1.02)"
                    }}
                    transition="all 0.2s"
                    onClick={() => !updatingAnswers[question.id] && handleCorrectAnswerChange(question.id, "A")}
                    position="relative"
                    opacity={updatingAnswers[question.id] ? 0.8 : 1}
                  >
                    <Text fontWeight="bold" color={
                      updatingAnswers[question.id] && question.correct_answer === "A" 
                        ? "yellow.700" 
                        : question.correct_answer === "A" 
                        ? "green.700" 
                        : "gray.700"
                    }>
                      أ: {question.option_a}
              </Text>
                    {question.correct_answer === "A" && (
                      <Box
                        position="absolute"
                        top={-2}
                        right={-2}
                        bg={updatingAnswers[question.id] ? "yellow.500" : "green.500"}
                        color="white"
                        borderRadius="full"
                        width="24px"
                        height="24px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="12px"
                        fontWeight="bold"
                      >
                        {updatingAnswers[question.id] ? "⏳" : "✓"}
                      </Box>
                    )}
                  </Box>
                  
                  <Box 
                    p={3} 
                    bg={
                      updatingAnswers[question.id] && question.correct_answer === "B" 
                        ? "yellow.100" 
                        : question.correct_answer === "B" 
                        ? "green.100" 
                        : "gray.100"
                    }
                    border="2px solid"
                    borderColor={
                      updatingAnswers[question.id] && question.correct_answer === "B" 
                        ? "yellow.400" 
                        : question.correct_answer === "B" 
                        ? "green.400" 
                        : "gray.200"
                    }
                    borderRadius="md"
                    cursor={updatingAnswers[question.id] ? "not-allowed" : "pointer"}
                    _hover={{
                      bg: updatingAnswers[question.id] 
                        ? (question.correct_answer === "B" ? "yellow.100" : "gray.100")
                        : question.correct_answer === "B" 
                        ? "green.200" 
                        : "gray.200",
                      transform: updatingAnswers[question.id] ? "none" : "scale(1.02)"
                    }}
                    transition="all 0.2s"
                    onClick={() => !updatingAnswers[question.id] && handleCorrectAnswerChange(question.id, "B")}
                    position="relative"
                    opacity={updatingAnswers[question.id] ? 0.8 : 1}
                  >
                    <Text fontWeight="bold" color={
                      updatingAnswers[question.id] && question.correct_answer === "B" 
                        ? "yellow.700" 
                        : question.correct_answer === "B" 
                        ? "green.700" 
                        : "gray.700"
                    }>
                      ب: {question.option_b}
                    </Text>
                    {question.correct_answer === "B" && (
                      <Box
                        position="absolute"
                        top={-2}
                        right={-2}
                        bg={updatingAnswers[question.id] ? "yellow.500" : "green.500"}
                        color="white"
                        borderRadius="full"
                        width="24px"
                        height="24px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="12px"
                        fontWeight="bold"
                      >
                        {updatingAnswers[question.id] ? "⏳" : "✓"}
                      </Box>
                    )}
                  </Box>
                  
                  <Box 
                    p={3} 
                    bg={question.correct_answer === "C" ? "green.100" : "gray.100"}
                    border="2px solid"
                    borderColor={question.correct_answer === "C" ? "green.400" : "gray.200"}
                    borderRadius="md"
                    cursor="pointer"
                    _hover={{
                      bg: question.correct_answer === "C" ? "green.200" : "gray.200",
                      transform: "scale(1.02)"
                    }}
                    transition="all 0.2s"
                    onClick={() => handleCorrectAnswerChange(question.id, "C")}
                    position="relative"
                  >
                    <Text fontWeight="bold" color={question.correct_answer === "C" ? "green.700" : "gray.700"}>
                      ج: {question.option_c}
                    </Text>
                    {question.correct_answer === "C" && (
                      <Box
                        position="absolute"
                        top={-2}
                        right={-2}
                        bg="green.500"
                        color="white"
                        borderRadius="full"
                        width="24px"
                        height="24px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="12px"
                        fontWeight="bold"
                      >
                        ✓
                      </Box>
                    )}
                  </Box>
                  
                  <Box 
                    p={3} 
                    bg={question.correct_answer === "D" ? "green.100" : "gray.100"}
                    border="2px solid"
                    borderColor={question.correct_answer === "D" ? "green.400" : "gray.200"}
                    borderRadius="md"
                    cursor="pointer"
                    _hover={{
                      bg: question.correct_answer === "D" ? "green.200" : "gray.200",
                      transform: "scale(1.02)"
                    }}
                    transition="all 0.2s"
                    onClick={() => handleCorrectAnswerChange(question.id, "D")}
                    position="relative"
                  >
                    <Text fontWeight="bold" color={question.correct_answer === "D" ? "green.700" : "gray.700"}>
                      د: {question.option_d}
                    </Text>
                    {question.correct_answer === "D" && (
                      <Box
                        position="absolute"
                        top={-2}
                        right={-2}
                        bg="green.500"
                        color="white"
                        borderRadius="full"
                        width="24px"
                        height="24px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="12px"
                        fontWeight="bold"
                      >
                        ✓
                      </Box>
                    )}
                  </Box>
                </Grid>

                {/* Correct Answer */}
                <Box p={3} bg="green.100" borderRadius="md" border="1px solid" borderColor="green.200">
                  <Text fontWeight="bold" color="green.700">
                    الإجابة الصحيحة: {question.correct_answer}
                  </Text>
                  </Box>

                {/* Additional Info */}
                <HStack justify="space-between" fontSize="sm" color="gray.500" pt={2}>
                  <Text>ترتيب السؤال: {question.question_order + 1}</Text>
                  <Text>آخر تحديث: {new Date(question.updated_at).toLocaleDateString('ar-EG')}</Text>
                </HStack>
              </VStack>
            </Card>
                ))}
              </VStack>
      )}

      {/* Single Question Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>إضافة سؤال جديد</ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {/* Question Text */}
              <Box>
                <Text fontWeight="bold" mb={2}>
                  نص السؤال <span style={{ color: "red" }}>*</span>
                </Text>
                <Textarea
                  placeholder="أدخل نص السؤال"
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, question_text: e.target.value }))}
                  required
                />
              </Box>

              {/* Options */}
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box>
                  <Text fontWeight="bold" mb={2}>الخيار أ <span style={{ color: "red" }}>*</span></Text>
                  <Input
                    placeholder="الخيار أ"
                    value={questionForm.option_a}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, option_a: e.target.value }))}
                    required
                  />
                </Box>
                <Box>
                  <Text fontWeight="bold" mb={2}>الخيار ب <span style={{ color: "red" }}>*</span></Text>
                  <Input
                    placeholder="الخيار ب"
                    value={questionForm.option_b}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, option_b: e.target.value }))}
                    required
                  />
                </Box>
                <Box>
                  <Text fontWeight="bold" mb={2}>الخيار ج <span style={{ color: "red" }}>*</span></Text>
                  <Input
                    placeholder="الخيار ج"
                    value={questionForm.option_c}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, option_c: e.target.value }))}
                    required
                  />
                </Box>
                <Box>
                  <Text fontWeight="bold" mb={2}>الخيار د <span style={{ color: "red" }}>*</span></Text>
                  <Input
                    placeholder="الخيار د"
                    value={questionForm.option_d}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, option_d: e.target.value }))}
                    required
                  />
                </Box>
              </Grid>

              {/* Correct Answer & Points */}
              <HStack spacing={6}>
                <Box flex={1}>
                  <Text fontWeight="bold" mb={2}>
                    الإجابة الصحيحة <span style={{ color: "red" }}>*</span>
                  </Text>
                  <Select
                    value={questionForm.correct_answer}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, correct_answer: e.target.value }))}
                    required
                  >
                    <option value="">اختر الإجابة الصحيحة</option>
                    <option value="A">أ</option>
                    <option value="B">ب</option>
                    <option value="C">ج</option>
                    <option value="D">د</option>
                  </Select>
                </Box>
                <Box flex={1}>
                  <Text fontWeight="bold" mb={2}>
                    النقاط <span style={{ color: "red" }}>*</span>
                  </Text>
                  <Input
                    type="number"
                    min="1"
                    value={questionForm.points}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                    required
                  />
            </Box>
              </HStack>

              {/* Active Status */}
              <Box>
                <Text fontWeight="bold" mb={2}>حالة السؤال</Text>
                <Select
                  value={questionForm.is_active.toString()}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                >
                  <option value="true">نشط</option>
                  <option value="false">متوقف</option>
                </Select>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} mr={3}>
              إلغاء
            </Button>
            <Button
              colorScheme="blue" 
              onClick={handleAddQuestion}
              isLoading={actionLoading}
            >
              إضافة السؤال
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

            {/* Text Questions Modal */}
      <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>إضافة أسئلة نصية</ModalHeader>
          <ModalBody>
            <VStack spacing={6} align="stretch">
              <Box>
                <Text fontWeight="bold" mb={2}>
                  نص الأسئلة <span style={{ color: "red" }}>*</span>
                </Text>
                <Textarea
                  placeholder="أدخل الأسئلة بالشكل التالي:
                  
Due to strong winds, the boat kept __________ in circles.
A) swimming
B) spinning
C) surrounding
D) span

Publishers suffer significant losses as a result of book __________.
A) literacy
B) punishment
C) piracy
D) privacy

It is cruel to __________ children by making them go hungry.
A) publication
B) publish
C) punish
D) compensate

The show's success made her an overnight __________.
A) celebrate
B) celebrity
C) celebration
D) deliberate"
                  value={textQuestions.questions_text}
                  onChange={(e) => setTextQuestions({ questions_text: e.target.value })}
                  rows={15}
                  required
                />
                <Text fontSize="sm" color="gray.600" mt={2}>
                  <strong>ملاحظة:</strong> تأكد من تنسيق الأسئلة بالشكل الصحيح مع الخيارات A, B, C, D
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setIsBulkModalOpen(false)} mr={3}>
              إلغاء
            </Button>
            <Button
              colorScheme="green" 
              onClick={handleTextQuestionsAdd}
              isLoading={actionLoading}
            >
              إضافة الأسئلة النصية
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              حذف السؤال
            </AlertDialogHeader>
            <AlertDialogBody>
              هل أنت متأكد من حذف هذا السؤال؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={() => setIsDeleteDialogOpen(false)}>
                إلغاء
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleDeleteQuestion} 
                ml={3}
                isLoading={actionLoading}
              >
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Leaderboard Modal */}
      <Modal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <VStack spacing={2} align="stretch">
              <Text fontSize="xl" fontWeight="bold" color="purple.600">
                🏆 القائمة المدرسية
              </Text>
              {leaderboardData && (
                <HStack justify="space-between" fontSize="sm" color="gray.600">
                  <Text>المسابقة: {leaderboardData.competition.title}</Text>
                  <Text>إجمالي الطلاب: {leaderboardData.competition.total_students}</Text>
                  <Text>الصف: {leaderboardData.filters.grade_name}</Text>
                </HStack>
              )}
            </VStack>
          </ModalHeader>
          <ModalBody>
            {leaderboardLoading ? (
              <Center py={12}>
                <VStack spacing={4}>
                  <Spinner size="xl" color="purple.500" />
                  <Text fontSize="lg" color="gray.600">
                    جاري تحميل القائمة المدرسية...
                  </Text>
                </VStack>
              </Center>
            ) : leaderboardData && leaderboardData.leaderboard.length > 0 ? (
              <VStack spacing={6} align="stretch">
                {/* Top 3 Podium */}
                <Box p={6} bg="gradient-to-r from-yellow-100 via-gray-100 to-orange-100" borderRadius="lg" border="2px solid" borderColor="yellow.300">
                  <VStack spacing={4}>
                    <Text fontSize="lg" fontWeight="bold" color="yellow.700">
                      🏅 المراكز الأولى
                    </Text>
                    <HStack spacing={8} justify="center" align="end">
                      {/* Second Place */}
                      {leaderboardData.leaderboard[1] && (
                        <VStack spacing={2}>
                          <Box
                            w="80px"
                            h="80px"
                            bg="gray.300"
                            borderRadius="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="2xl"
                            fontWeight="bold"
                            color="white"
                            position="relative"
                          >
                            2
                            <Box
                              position="absolute"
                              top="-10px"
                              right="-10px"
                              bg="gray.400"
                              color="white"
                              borderRadius="full"
                              width="30px"
                              height="30px"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontSize="sm"
                            >
                              🥈
                            </Box>
                          </Box>
                          <Text fontSize="sm" fontWeight="bold" color="gray.700" textAlign="center">
                            {leaderboardData.leaderboard[1].student_name}
                          </Text>
                          <Text fontSize="xs" color="gray.600" textAlign="center">
                            {leaderboardData.leaderboard[1].percentage}%
                          </Text>
                        </VStack>
                      )}
                      
                      {/* First Place */}
                      {leaderboardData.leaderboard[0] && (
                        <VStack spacing={2}>
                          <Box
                            w="100px"
                            h="100px"
                            bg="yellow.400"
                            borderRadius="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="3xl"
                            fontWeight="bold"
                            color="white"
                            position="relative"
                          >
                            1
                            <Box
                              position="absolute"
                              top="-15px"
                              right="-15px"
                              bg="yellow.500"
                              color="white"
                              borderRadius="full"
                              width="35px"
                              height="35px"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontSize="sm"
                            >
                              👑
                            </Box>
                          </Box>
                          <Text fontSize="md" fontWeight="bold" color="yellow.700" textAlign="center">
                            {leaderboardData.leaderboard[0].student_name}
                          </Text>
                          <Text fontSize="sm" color="yellow.600" textAlign="center">
                            {leaderboardData.leaderboard[0].percentage}%
                          </Text>
                        </VStack>
                      )}
                      
                      {/* Third Place */}
                      {leaderboardData.leaderboard[2] && (
                        <VStack spacing={2}>
                          <Box
                            w="80px"
                            h="80px"
                            bg="orange.400"
                            borderRadius="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="2xl"
                            fontWeight="bold"
                            color="white"
                            position="relative"
                          >
                            3
                            <Box
                              position="absolute"
                              top="-10px"
                              right="-10px"
                              bg="orange.500"
                              color="white"
                              borderRadius="full"
                              width="30px"
                              height="30px"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontSize="sm"
                            >
                              🥉
                            </Box>
                          </Box>
                          <Text fontSize="sm" fontWeight="bold" color="orange.700" textAlign="center">
                            {leaderboardData.leaderboard[2].student_name}
                          </Text>
                          <Text fontSize="xs" color="orange.600" textAlign="center">
                            {leaderboardData.leaderboard[2].percentage}%
                          </Text>
                        </VStack>
                      )}
                    </HStack>
                  </VStack>
                </Box>

                {/* Full Leaderboard Table */}
                <Box p={6} bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200">
                  <VStack spacing={4} align="stretch">
                    <Text fontSize="lg" fontWeight="bold" color="gray.800" textAlign="center">
                      📊 القائمة الكاملة
                    </Text>
                    
                    <Box overflowX="auto">
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#2d3748' }}>الترتيب</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#2d3748' }}>اسم الطالب</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#2d3748' }}>الصف</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#2d3748' }}>النقاط</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#2d3748' }}>النسبة المئوية</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#2d3748' }}>الإجابات الصحيحة</th>
                            <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#2d3748' }}>تاريخ التقديم</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaderboardData.leaderboard.map((student, index) => (
                            <tr 
                              key={student.student_id} 
                              style={{ 
                                borderBottom: '1px solid #e2e8f0',
                                backgroundColor: index < 3 ? '#fef5e7' : 'white'
                              }}
                            >
                              <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                                <Box
                                  w="30px"
                                  h="30px"
                                  bg={index === 0 ? "yellow.400" : index === 1 ? "gray.400" : index === 2 ? "orange.400" : "blue.400"}
                                  color="white"
                                  borderRadius="full"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  fontSize="sm"
                                  fontWeight="bold"
                                  mx="auto"
                                >
                                  {student.rank}
                                </Box>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'medium' }}>
                                {student.student_name}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', fontSize: 'sm', color: 'gray.600' }}>
                                {student.grade_name}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: 'blue.600' }}>
                                {student.score}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <Badge 
                                  colorScheme={parseFloat(student.percentage) >= 80 ? "green" : parseFloat(student.percentage) >= 60 ? "yellow" : "red"}
                                  variant="solid"
                                  fontSize="sm"
                                  px={3}
                                  py={1}
                                >
                                  {student.percentage}%
                                </Badge>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', fontSize: 'sm' }}>
                                <Text color="green.600" fontWeight="bold">
                                  {student.correct_answers}
                                </Text>
                                <Text color="gray.500" fontSize="xs">
                                  من {student.total_questions}
                                </Text>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', fontSize: 'sm', color: 'gray.600' }}>
                                {new Date(student.submitted_at).toLocaleDateString('ar-EG')}
                                <br />
                                <Text fontSize="xs" color="gray.500">
                                  {new Date(student.submitted_at).toLocaleTimeString('ar-EG')}
                                </Text>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </Box>
                  </VStack>
                </Box>
              </VStack>
            ) : (
              <Center py={12}>
                <VStack spacing={4}>
                  <Text fontSize="lg" color="gray.500">
                    لا توجد نتائج متاحة حالياً
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    لم يقم أي طالب بحل المسابقة بعد
                  </Text>
                </VStack>
              </Center>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              colorScheme="purple" 
              onClick={() => {
                setIsLeaderboardOpen(false);
                setLeaderboardData(null);
              }}
            >
              إغلاق
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ScrollToTop/>
    </Box>
  );
};

export default CompetitionDetails;


 





