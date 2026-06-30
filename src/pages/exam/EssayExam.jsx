import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Flex, VStack, HStack, Text, Button, Icon, IconButton, Badge, Divider, 
  useColorModeValue, Spinner, Alert, AlertIcon, AlertTitle, AlertDescription,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  FormControl, FormLabel, Textarea, Input, useToast, Tooltip, Card, CardBody,
  Tabs, TabList, TabPanels, Tab, TabPanel, Table, Thead, Tbody, Tr, Th, Td,
  Progress, ProgressLabel, Breadcrumb, BreadcrumbItem, BreadcrumbLink
} from '@chakra-ui/react';
import {
  FaEdit, FaTrash, FaPlus, FaSave, FaEye, FaUsers, FaGraduationCap, FaClock,
  FaCheck, FaTimes, FaArrowLeft, FaRegPaperPlane, FaStar, FaUser, FaCalendar, FaRedo, FaFileAlt
} from 'react-icons/fa';
import baseUrl from '../../api/baseUrl';
import UserType from '../../Hooks/auth/userType';

const EssayExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  // States
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [students, setStudents] = useState([]);
  const [grade, setGrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questionsStatus, setQuestionsStatus] = useState('loading'); // 'loading', 'pending', 'ready', 'error'
  const [questionsMessage, setQuestionsMessage] = useState('');
  
  // Use the UserType hook
  const [userData, isAdmin, isTeacher, isStudent] = UserType();
  
  // Modal states
  const [questionModal, setQuestionModal] = useState({ isOpen: false, type: 'add', data: null });
  const [gradeModal, setGradeModal] = useState({ isOpen: false, studentId: null, studentName: '' });
  const [studentAnswersModal, setStudentAnswersModal] = useState({ isOpen: false, studentId: null, studentName: '' });
  const [editExamModal, setEditExamModal] = useState({ isOpen: false });
  const [deleteExamModal, setDeleteExamModal] = useState({ isOpen: false });
  const [deleteQuestionModal, setDeleteQuestionModal] = useState({ isOpen: false, questionId: null, questionText: '' });
  const [studentAnswers, setStudentAnswers] = useState([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [questionGradeModal, setQuestionGradeModal] = useState({ isOpen: false, questionId: null, questionText: '', studentId: null, studentName: '' });
  const [questionGradeForm, setQuestionGradeForm] = useState({ is_correct: true, feedback: '' });
  const [studentReport, setStudentReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const reportFetchedRef = useRef(false);
  
  // Form states
  const [questionForm, setQuestionForm] = useState({ question_text: '', order_index: 0 });
  const [gradeForm, setGradeForm] = useState({ total_grade: 0, max_grade: 100, feedback: '' });
  const [answerForm, setAnswerForm] = useState({});
  const [editExamForm, setEditExamForm] = useState({ title: '', description: '', is_visible: true });
  
  // Colors
  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const subTextColor = useColorModeValue('gray.600', 'gray.300');

  // Fetch exam details
  const fetchExam = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await baseUrl.get(`/api/essay-exams/exams/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExam(response.data.exam);
    } catch (error) {
      console.error('Error fetching exam:', error);
      
      // Handle specific error cases
      if (error.response?.status === 500) {
        toast({
          title: 'خطأ في الخادم',
          description: 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (error.response?.status === 403) {
        toast({
          title: 'غير مصرح لك',
          description: 'ليس لديك صلاحية للوصول إلى هذا الامتحان.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (error.response?.status === 404) {
        toast({
          title: 'الامتحان غير موجود',
          description: 'الامتحان المطلوب غير موجود أو تم حذفه.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      throw error;
    }
  };

  // Fetch questions
  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await baseUrl.get(`/api/essay-exams/exams/${id}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Handle different response statuses
      if (response.data.status === 'pending') {
        setQuestionsStatus('pending');
        setQuestionsMessage(response.data.message || 'جار تصحيح الأسئلة');
        setQuestions([]);
      } else if (response.data.status === 'graded') {
        setQuestionsStatus('graded');
        setQuestionsMessage(response.data.message || 'تم تصحيح إجابتك');
        setQuestions([]);
      } else if (response.data.questions && response.data.questions.length > 0) {
        setQuestionsStatus('ready');
        setQuestionsMessage('');
        setQuestions(response.data.questions);
      } else {
        setQuestionsStatus('ready');
        setQuestionsMessage('');
        setQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      
      // Handle specific error cases
      if (error.response?.status === 500) {
        setQuestionsStatus('error');
        setQuestionsMessage('خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.');
        toast({
          title: 'خطأ في الخادم',
          description: 'حدث خطأ في الخادم أثناء تحميل الأسئلة.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (error.response?.status === 403) {
        setQuestionsStatus('error');
        setQuestionsMessage('ليس لديك صلاحية للوصول إلى هذا الامتحان.');
        toast({
          title: 'غير مصرح لك',
          description: 'ليس لديك صلاحية للوصول إلى أسئلة هذا الامتحان.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (error.response?.status === 404) {
        setQuestionsStatus('error');
        setQuestionsMessage('الامتحان غير موجود أو تم حذفه.');
        toast({
          title: 'الامتحان غير موجود',
          description: 'الامتحان المطلوب غير موجود أو تم حذفه.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        setQuestionsStatus('error');
        setQuestionsMessage('حدث خطأ في تحميل الأسئلة');
        toast({
          title: 'خطأ في تحميل الأسئلة',
          description: 'حدث خطأ أثناء تحميل الأسئلة. يرجى المحاولة مرة أخرى.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      throw error;
    }
  };

  // Fetch student answers (for students)
  const fetchMyAnswers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await baseUrl.get(`/api/essay-exams/exams/${id}/my-answers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnswers(response.data.answers || []);
    } catch (error) {
      console.error('Error fetching answers:', error);
    }
  };

  // Fetch students (for teachers)
  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await baseUrl.get(`/api/essay-exams/exams/${id}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  // Fetch my grade (for students)
  const fetchMyGrade = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await baseUrl.get(`/api/essay-exams/exams/${id}/my-grade`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGrade(response.data.grade);
    } catch (error) {
      console.error('Error fetching grade:', error);
    }
  };

  // Fetch student report (for students)
  const fetchStudentReport = async () => {
    try {
      setLoadingReport(true);
      const token = localStorage.getItem('token');
      const response = await baseUrl.get(`/api/essay-exams/exams/${id}/my-report`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Transform the response data to match our expected format
      const data = response.data;
      const transformedReport = {
        exam: data.exam,
        questions: data.questions.map(q => ({
          question_id: q.question_id,
          question_text: q.question_text,
          order_index: q.order_index,
          answer_text: q.answer_text,
          submitted_at: q.submitted_at,
          is_correct: q.is_correct || false,
          grade: q.grade || "0.00",
          correction_feedback: q.correction_feedback || null,
          graded_at: q.graded_at || null,
          graded_by_name: q.graded_by_name || null
        })),
        summary: {
          total_grade: data.grade?.total_grade || "0.00",
          max_grade: data.grade?.max_grade || "100.00",
          correct_answers: data.questions.filter(q => q.is_correct).length,
          wrong_answers: data.questions.filter(q => q.is_correct === false).length,
          pending_answers: data.questions.filter(q => q.is_correct === undefined).length,
          percentage: data.grade ? Math.round((parseFloat(data.grade.total_grade) / parseFloat(data.grade.max_grade)) * 100) : 0
        }
      };
      
      setStudentReport(transformedReport);
    } catch (error) {
      console.error('Error fetching student report:', error);
      setStudentReport(null);
      
      // Handle specific error cases
      if (error.response?.status === 500) {
        toast({
          title: 'خطأ في الخادم',
          description: 'حدث خطأ في الخادم أثناء تحميل التقرير المفصل.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (error.response?.status === 403) {
        toast({
          title: 'غير مصرح لك',
          description: 'ليس لديك صلاحية للوصول إلى التقرير المفصل.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else if (error.response?.status === 404) {
        // Don't show error for 404 as it might mean no report yet
        console.log('No report available yet');
      }
    } finally {
      setLoadingReport(false);
    }
  };

  // Submit answer
  const submitAnswer = async (questionId, answerText) => {
    try {
      const token = localStorage.getItem('token');
      await baseUrl.post(`/api/essay-exams/exams/${id}/answers`, {
        question_id: questionId,
        answer_text: answerText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchMyAnswers();
      toast({
        title: 'تم حفظ الإجابة بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: 'خطأ في حفظ الإجابة',
        description: 'حدث خطأ أثناء حفظ الإجابة',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Reload questions function
  const reloadQuestions = async () => {
    try {
      await fetchQuestions();
    } catch (error) {
      console.error('Error reloading questions:', error);
    }
  };

  // Grade student (legacy function for backward compatibility)
  const gradeStudent = async () => {
    try {
      const token = localStorage.getItem('token');
      await baseUrl.post(`/api/essay-exams/exams/${id}/students/${gradeModal.studentId}/grade`, gradeForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchStudents();
      setGradeModal({ isOpen: false, studentId: null, studentName: '' });
      setGradeForm({ total_grade: 0, max_grade: 100, feedback: '' });
      toast({
        title: 'تم تصحيح الامتحان بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error grading student:', error);
      toast({
        title: 'خطأ في تصحيح الامتحان',
        description: 'حدث خطأ أثناء تصحيح الامتحان',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Grade individual question
  const gradeQuestion = async () => {
    try {
      const token = localStorage.getItem('token');
      await baseUrl.post(`/api/essay-exams/exams/${id}/students/${questionGradeModal.studentId}/questions/${questionGradeModal.questionId}/grade`, {
        is_correct: questionGradeForm.is_correct,
        feedback: questionGradeForm.feedback
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchStudents();
      setQuestionGradeModal({ isOpen: false, questionId: null, questionText: '', studentId: null, studentName: '' });
      setQuestionGradeForm({ is_correct: true, feedback: '' });
      toast({
        title: 'تم تصحيح السؤال بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error grading question:', error);
      toast({
        title: 'خطأ في تصحيح السؤال',
        description: 'حدث خطأ أثناء تصحيح السؤال',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Open question grade modal
  const openQuestionGradeModal = (questionId, questionText, studentId, studentName) => {
    setQuestionGradeModal({ 
      isOpen: true, 
      questionId: questionId, 
      questionText: questionText,
      studentId: studentId,
      studentName: studentName
    });
    setQuestionGradeForm({ is_correct: true, feedback: '' });
  };

  // Fetch student answers for grading
  const fetchStudentAnswers = async (studentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await baseUrl.get(`/api/essay-exams/exams/${id}/students/${studentId}/answers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.answers;
    } catch (error) {
      console.error('Error fetching student answers:', error);
      return [];
    }
  };

  // Fetch student answers for display in modal
  const fetchStudentAnswersForModal = async (studentId) => {
    setLoadingAnswers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await baseUrl.get(`/api/essay-exams/exams/${id}/students/${studentId}/answers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudentAnswers(response.data.answers || []);
    } catch (error) {
      console.error('Error fetching student answers for modal:', error);
      setStudentAnswers([]);
      toast({
        title: 'خطأ في تحميل الإجابات',
        description: 'حدث خطأ أثناء تحميل إجابات الطالب',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingAnswers(false);
    }
  };

  // Add question
  const addQuestion = async () => {
    // Validate form data
    if (!questionForm.question_text || questionForm.question_text.trim().length < 10) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يجب أن يكون نص السؤال على الأقل 10 أحرف',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (questionForm.order_index < 0) {
      toast({
        title: 'خطأ في البيانات',
        description: 'ترتيب السؤال يجب أن يكون رقم موجب أو صفر',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await baseUrl.post(`/api/essay-exams/exams/${id}/questions`, {
        question_text: questionForm.question_text.trim(),
        order_index: questionForm.order_index
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchQuestions();
      setQuestionModal({ isOpen: false, type: 'add', data: null });
      setQuestionForm({ question_text: '', order_index: 0 });
      toast({
        title: 'تم إضافة السؤال بنجاح',
        description: `تم إضافة السؤال برقم ${response.data.question?.id || ''}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error adding question:', error);
      const errorMessage = error.response?.data?.message || 'حدث خطأ أثناء إضافة السؤال';
      toast({
        title: 'خطأ في إضافة السؤال',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Update question
  const updateQuestion = async () => {
    try {
      const token = localStorage.getItem('token');
      await baseUrl.put(`/api/essay-exams/questions/${questionModal.data.id}`, questionForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchQuestions();
      setQuestionModal({ isOpen: false, type: 'add', data: null });
      setQuestionForm({ question_text: '', order_index: 0 });
      toast({
        title: 'تم تحديث السؤال بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        title: 'خطأ في تحديث السؤال',
        description: 'حدث خطأ أثناء تحديث السؤال',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Open delete question modal
  const openDeleteQuestionModal = (questionId, questionText) => {
    setDeleteQuestionModal({ 
      isOpen: true, 
      questionId: questionId, 
      questionText: questionText 
    });
  };

  // Delete question
  const deleteQuestion = async () => {
    try {
      const token = localStorage.getItem('token');
      await baseUrl.delete(`/api/essay-exams/questions/${deleteQuestionModal.questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchQuestions();
      setDeleteQuestionModal({ isOpen: false, questionId: null, questionText: '' });
      toast({
        title: 'تم حذف السؤال بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: 'خطأ في حذف السؤال',
        description: 'حدث خطأ أثناء حذف السؤال',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Update exam
  const updateExam = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await baseUrl.put(`/api/essay-exams/exams/${id}`, editExamForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExam(response.data.exam);
      setEditExamModal({ isOpen: false });
      setEditExamForm({ title: '', description: '', is_visible: true });
      toast({
        title: 'تم تحديث الامتحان بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating exam:', error);
      toast({
        title: 'خطأ في تحديث الامتحان',
        description: 'حدث خطأ أثناء تحديث الامتحان',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Delete exam
  const deleteExam = async () => {
    try {
      const token = localStorage.getItem('token');
      await baseUrl.delete(`/api/essay-exams/exams/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteExamModal({ isOpen: false });
      toast({
        title: 'تم حذف الامتحان بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Navigate back after successful deletion
      setTimeout(() => {
        navigate(-1);
      }, 1000);
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast({
        title: 'خطأ في حذف الامتحان',
        description: 'حدث خطأ أثناء حذف الامتحان',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [examResult, questionsResult] = await Promise.allSettled([
          fetchExam(),
          fetchQuestions()
        ]);
        
        if (examResult.status === 'rejected' && questionsResult.status === 'fulfilled') {
          console.warn('Exam data failed to load, but questions loaded successfully');
        }
        
        if (examResult.status === 'rejected' && questionsResult.status === 'rejected') {
          console.error('Both exam and questions failed to load');
          // Show error message to user
          toast({
            title: 'خطأ في تحميل البيانات',
            description: 'حدث خطأ في تحميل بيانات الامتحان. يرجى المحاولة مرة أخرى.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
        
        if (isStudent) {
          try {
            await fetchMyAnswers();
            await fetchMyGrade();
            await fetchStudentReport();
          } catch (error) {
            console.error('Error loading student data:', error);
            // Don't show error toast for student data as it's not critical
          }
        } else if (isTeacher || isAdmin) {
          try {
            await fetchStudents();
          } catch (error) {
            console.error('Error loading students data:', error);
            // Don't show error toast for students data as it's not critical
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, isStudent, isTeacher, isAdmin]);

  // Handle question modal data
  useEffect(() => {
    if (questionModal.isOpen && questionModal.type === 'edit' && questionModal.data) {
      setQuestionForm({
        question_text: questionModal.data.question_text,
        order_index: questionModal.data.order_index
      });
    } else if (questionModal.isOpen && questionModal.type === 'add') {
      setQuestionForm({ question_text: '', order_index: 0 });
    }
  }, [questionModal]);

  // Handle edit exam modal data
  useEffect(() => {
    if (editExamModal.isOpen && exam) {
      setEditExamForm({
        title: exam.title || '',
        description: exam.description || '',
        is_visible: exam.is_visible || false
      });
    }
  }, [editExamModal, exam]);

  // Reset report fetched flag when exam changes
  useEffect(() => {
    reportFetchedRef.current = false;
  }, [id]);

  // Fetch student report when status is graded
  useEffect(() => {
    if (questionsStatus === 'graded' && isStudent && !reportFetchedRef.current && !loadingReport) {
      reportFetchedRef.current = true;
      fetchStudentReport();
    }
  }, [questionsStatus, isStudent]);

  // Debug modal states
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Modal states:', {
        questionModal: questionModal.isOpen,
        gradeModal: gradeModal.isOpen,
        editExamModal: editExamModal.isOpen,
        deleteExamModal: deleteExamModal.isOpen,
        studentAnswersModal: studentAnswersModal.isOpen
      });
    }
  }, [questionModal.isOpen, gradeModal.isOpen, editExamModal.isOpen, deleteExamModal.isOpen, studentAnswersModal.isOpen]);

  // Test modal opening function
  const testModalOpening = () => {
    console.log('Testing modal opening...');
    setQuestionModal({ isOpen: true, type: 'add', data: null });
  };

  // Enhanced modal opening function
  const openAddQuestionModal = () => {
    console.log('Opening add question modal...');
    setQuestionForm({ question_text: '', order_index: 0 });
    setQuestionModal({ isOpen: true, type: 'add', data: null });
  };

  // Enhanced modal opening function for edit
  const openEditQuestionModal = (question) => {
    console.log('Opening edit question modal for:', question.id);
    setQuestionModal({ 
      isOpen: true, 
      type: 'edit', 
      data: question 
    });
  };

  // Handle modal opening with better state management
  useEffect(() => {
    if (questionModal.isOpen && questionModal.type === 'add') {
      // Reset form when opening add modal
      setQuestionForm({ question_text: '', order_index: 0 });
    }
  }, [questionModal.isOpen, questionModal.type]);

  // Debug question modal state
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Question Modal State:', {
        isOpen: questionModal.isOpen,
        type: questionModal.type,
        data: questionModal.data,
        formData: questionForm
      });
    }
  }, [questionModal, questionForm]);

  // Enhanced error handling for modal operations
  const handleModalError = (error, operation) => {
    console.error(`Error in ${operation}:`, error);
    toast({
      title: `خطأ في ${operation}`,
      description: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  };

  // Enhanced modal opening with error handling
  const openAddQuestionModalSafe = () => {
    try {
      console.log('Opening add question modal safely...');
      setQuestionForm({ question_text: '', order_index: 0 });
      setQuestionModal({ isOpen: true, type: 'add', data: null });
    } catch (error) {
      handleModalError(error, 'فتح موديل إضافة السؤال');
    }
  };

  // Open student answers modal
  const openStudentAnswersModal = async (studentId, studentName) => {
    try {
      console.log('Opening student answers modal for:', studentName);
      setStudentAnswersModal({ 
        isOpen: true, 
        studentId: studentId, 
        studentName: studentName 
      });
      await fetchStudentAnswersForModal(studentId);
    } catch (error) {
      handleModalError(error, 'فتح موديل عرض الإجابات');
    }
  };

  // Enhanced add question function with better error handling
  const addQuestionEnhanced = async () => {
    console.log('Adding question with data:', questionForm);
    
    // Validate form data
    if (!questionForm.question_text || questionForm.question_text.trim().length < 10) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يجب أن يكون نص السؤال على الأقل 10 أحرف',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (questionForm.order_index < 0) {
      toast({
        title: 'خطأ في البيانات',
        description: 'ترتيب السؤال يجب أن يكون رقم موجب أو صفر',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('Sending request to:', `/api/essay-exams/exams/${id}/questions`);
      console.log('Request data:', {
        question_text: questionForm.question_text.trim(),
        order_index: questionForm.order_index
      });
      
      const response = await baseUrl.post(`/api/essay-exams/exams/${id}/questions`, {
        question_text: questionForm.question_text.trim(),
        order_index: questionForm.order_index
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Response received:', response.data);
      
      await fetchQuestions();
      setQuestionModal({ isOpen: false, type: 'add', data: null });
      setQuestionForm({ question_text: '', order_index: 0 });
      toast({
        title: 'تم إضافة السؤال بنجاح',
        description: `تم إضافة السؤال برقم ${response.data.question?.id || ''}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error adding question:', error);
      const errorMessage = error.response?.data?.message || 'حدث خطأ أثناء إضافة السؤال';
      toast({
        title: 'خطأ في إضافة السؤال',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>جاري تحميل الامتحان...</Text>
        </VStack>
      </Box>
    );
  }

  if (isStudent === undefined && isTeacher === undefined && isAdmin === undefined) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>جاري تحديد نوع المستخدم...</Text>
        </VStack>
      </Box>
    );
  }

  if (!exam && !loading && questions.length === 0) {
    return (
      <Box p={8}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>خطأ!</AlertTitle>
          <AlertDescription>لم يتم العثور على الامتحان أو ليس لديك صلاحية للوصول إليه.</AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box bg={bg} minH="100vh" p={{ base: 2, md: 4 }}>
      <Box maxW="1400px" mx="auto" px={{ base: 2, md: 4 }}>
        {/* Header */}
        <Card mb={6} bg={cardBg} borderColor={borderColor} boxShadow="lg">
          <CardBody p={{ base: 4, md: 6 }}>
            <Flex 
              justify="space-between" 
              align={{ base: "start", md: "center" }} 
              direction={{ base: "column", md: "row" }}
              gap={4}
            >
              <HStack spacing={4} align="start">
                <IconButton
                  icon={<Icon as={FaArrowLeft} />}
                  onClick={() => navigate(-1)}
                  variant="ghost"
                  colorScheme="blue"
                  size={{ base: "sm", md: "md" }}
                />
                <VStack align="start" spacing={1}>
                  <Text 
                    fontSize={{ base: "xl", md: "2xl" }} 
                    fontWeight="bold" 
                    color={textColor}
                    lineHeight="1.2"
                  >
                    {exam?.title || 'امتحان مقالي'}
                  </Text>
                  {exam?.description && (
                    <Text 
                      color={subTextColor} 
                      fontSize={{ base: "sm", md: "md" }}
                      lineHeight="1.4"
                    >
                      {exam.description}
                    </Text>
                  )}
                </VStack>
              </HStack>
              <HStack spacing={2} wrap="wrap" justify={{ base: "start", md: "end" }}>
                {exam && (
                  <Badge 
                    colorScheme={exam.is_visible ? "green" : "yellow"} 
                    fontSize={{ base: "xs", md: "sm" }} 
                    px={{ base: 2, md: 3 }} 
                    py={1}
                  >
                    {exam.is_visible ? "ظاهر" : "مخفي"}
                  </Badge>
                )}
                <Badge 
                  colorScheme="blue" 
                  fontSize={{ base: "xs", md: "sm" }} 
                  px={{ base: 2, md: 3 }} 
                  py={1}
                >
                  {questions.length} سؤال
                </Badge>
                {/* Teacher/Admin Actions */}
                {(isTeacher || isAdmin) && exam && (
                  <HStack spacing={2}>
                    <Tooltip label="تعديل الامتحان">
                      <IconButton
                        icon={<Icon as={FaEdit} />}
                        colorScheme="blue"
                        variant="outline"
                        size={{ base: "sm", md: "md" }}
                        onClick={() => setEditExamModal({ isOpen: true })}
                      />
                    </Tooltip>
                    <Tooltip label="حذف الامتحان">
                      <IconButton
                        icon={<Icon as={FaTrash} />}
                        colorScheme="red"
                        variant="outline"
                        size={{ base: "sm", md: "md" }}
                        onClick={() => setDeleteExamModal({ isOpen: true })}
                      />
                    </Tooltip>
                    {/* Test Button - Remove in production */}
                    {process.env.NODE_ENV === 'development' && (
                      <Button
                        size="sm"
                        colorScheme="purple"
                        onClick={testModalOpening}
                      >
                        Test Modal
                      </Button>
                    )}
                  </HStack>
                )}
              </HStack>
            </Flex>
          </CardBody>
        </Card>

        {/* Questions Status Display */}
        {questionsStatus === 'pending' && (
          <Card bg={cardBg} borderColor={borderColor} boxShadow="lg" mb={6}>
            <CardBody>
              <VStack spacing={4} py={8}>
                <Spinner size="xl" color="blue.500" />
                <VStack spacing={2}>
                  <Text fontSize="lg" fontWeight="bold" color={textColor}>
                    {questionsMessage}
                  </Text>
                  <Text fontSize="sm" color={subTextColor} textAlign="center">
                    يرجى الانتظار حتى يتم تحضير الأسئلة
                  </Text>
                </VStack>
                <Button
                  colorScheme="blue"
                  variant="outline"
                  onClick={reloadQuestions}
                  leftIcon={<Icon as={FaClock} />}
                >
                  إعادة التحقق
                </Button>
              </VStack>
            </CardBody>
          </Card>
        )}

        {questionsStatus === 'error' && (
          <Card bg={cardBg} borderColor={borderColor} boxShadow="lg" mb={6}>
            <CardBody>
              <VStack spacing={4} py={8}>
                <Icon as={FaTimes} color="red.500" boxSize={12} />
                <VStack spacing={2}>
                  <Text fontSize="lg" fontWeight="bold" color="textColor">
                    {questionsMessage}
                  </Text>
                  <Text fontSize="sm" color={subTextColor} textAlign="center">
                    حدث خطأ في تحميل الأسئلة
                  </Text>
                </VStack>
                <Button
                  colorScheme="red"
                  onClick={reloadQuestions}
                  leftIcon={<Icon as={FaClock} />}
                >
                  إعادة المحاولة
                </Button>
              </VStack>
            </CardBody>
          </Card>
        )}

        {questionsStatus === 'graded' && (
          <Card bg="green.50" borderColor="green.200" boxShadow="lg" mb={6}>
            <CardBody>
              <VStack spacing={4} py={8}>
                <Icon as={FaCheck} color="green.500" boxSize={12} />
                <VStack spacing={2}>
                  <Text fontSize="lg" fontWeight="bold" color="green.700">
                    {questionsMessage}
                  </Text>
                  <Text fontSize="sm" color="green.600" textAlign="center">
                    تم تصحيح إجابتك بنجاح. يمكنك مراجعة النتيجة في قسم النتائج.
                  </Text>
                </VStack>
                <HStack spacing={3}>
                  <Button
                    colorScheme="green"
                    variant="outline"
                    onClick={reloadQuestions}
                    leftIcon={<Icon as={FaClock} />}
                  >
                    إعادة التحقق
                  </Button>
                  {isStudent && (
                    <Button
                      colorScheme="blue"
                      variant="solid"
                      onClick={fetchStudentReport}
                      isLoading={loadingReport}
                      leftIcon={<Icon as={FaFileAlt} />}
                    >
                      عرض التقرير المفصل
                    </Button>
                  )}
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Content based on user type */}
        {(questionsStatus === 'ready' || questionsStatus === 'graded') && (
          <>
            {isStudent === true ? (
              <StudentView 
                exam={exam}
                questions={questions}
                answers={answers}
                grade={grade}
                submitAnswer={submitAnswer}
                submitting={submitting}
                textColor={textColor}
                subTextColor={subTextColor}
                cardBg={cardBg}
                borderColor={borderColor}
                studentReport={studentReport}
                loadingReport={loadingReport}
                fetchStudentReport={fetchStudentReport}
              />
            ) : (isTeacher === true || isAdmin === true) ? (
              <TeacherView
                exam={exam}
                questions={questions}
                students={students}
                textColor={textColor}
                subTextColor={subTextColor}
                cardBg={cardBg}
                borderColor={borderColor}
                openAddQuestionModal={openAddQuestionModalSafe}
                openEditQuestionModal={openEditQuestionModal}
                setQuestionModal={setQuestionModal}
                openDeleteQuestionModal={openDeleteQuestionModal}
                deleteQuestion={deleteQuestion}
                setGradeModal={setGradeModal}
                openStudentAnswersModal={openStudentAnswersModal}
                setStudentAnswersModal={setStudentAnswersModal}
                openQuestionGradeModal={openQuestionGradeModal}
              />
            ) : (
              <Box p={8}>
                <Alert status="warning">
                  <AlertIcon />
                  <AlertTitle>خطأ!</AlertTitle>
                  <AlertDescription>لا يمكن تحديد نوع المستخدم. يرجى تسجيل الدخول مرة أخرى.</AlertDescription>
                </Alert>
              </Box>
            )}
          </>
        )}

        {!exam && questions.length > 0 && (
          <Alert status="warning" mb={4}>
            <AlertIcon />
            <AlertTitle>تحذير!</AlertTitle>
            <AlertDescription>لا يمكن تحميل بيانات الامتحان، ولكن الأسئلة متوفرة.</AlertDescription>
          </Alert>
        )}

        {/* Grade Modal */}
        <Modal isOpen={gradeModal.isOpen} onClose={() => setGradeModal({ isOpen: false, studentId: null, studentName: '' })} size="md" isCentered closeOnOverlayClick={false}>
          <ModalOverlay bg="blackAlpha.600" />
          <ModalContent>
            <ModalHeader>
              <HStack spacing={3}>
                <Icon as={FaGraduationCap} color="green.500" />
                <Text>تصحيح امتحان {gradeModal.studentName}</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={6}>
                <FormControl>
                  <FormLabel fontWeight="semibold">الدرجة المحققة</FormLabel>
                  <Input
                    type="number"
                    value={gradeForm.total_grade}
                    onChange={(e) => setGradeForm({ ...gradeForm, total_grade: parseInt(e.target.value) || 0 })}
                    min={0}
                    placeholder="0"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontWeight="semibold">الدرجة العظمى</FormLabel>
                  <Input
                    type="number"
                    value={gradeForm.max_grade}
                    onChange={(e) => setGradeForm({ ...gradeForm, max_grade: parseInt(e.target.value) || 100 })}
                    min={1}
                    placeholder="100"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontWeight="semibold">التعليق</FormLabel>
                  <Textarea
                    value={gradeForm.feedback}
                    onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                    placeholder="اكتب تعليقك على الإجابة... (اختياري)"
                    rows={4}
                    resize="vertical"
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setGradeModal({ isOpen: false, studentId: null, studentName: '' })}>
                إلغاء
              </Button>
              <Button colorScheme="green" onClick={gradeStudent}>
                حفظ التصحيح
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Question Modal */}
        <Modal isOpen={questionModal.isOpen} onClose={() => setQuestionModal({ isOpen: false, type: 'add', data: null })} size="md" isCentered closeOnOverlayClick={false} motionPreset="slideInBottom">
          <ModalOverlay bg="blackAlpha.600" />
          <ModalContent>
            <ModalHeader>
              <HStack spacing={3}>
                <Icon as={questionModal.type === 'add' ? FaPlus : FaEdit} color="blue.500" />
                <Text>{questionModal.type === 'add' ? 'إضافة سؤال جديد' : 'تعديل السؤال'}</Text>
              </HStack>
            </ModalHeader>
         
            <ModalBody>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel fontWeight="semibold">نص السؤال</FormLabel>
                  <Textarea
                    value={questionForm.question_text}
                    onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                    placeholder="اكتب نص السؤال هنا... (يجب أن يكون على الأقل 10 أحرف)"
                    rows={4}
                    resize="vertical"
                    autoFocus
                    isInvalid={questionForm.question_text && questionForm.question_text.trim().length < 10}
                    borderColor={questionForm.question_text && questionForm.question_text.trim().length < 10 ? "red.300" : "gray.300"}
                    _hover={{ 
                      borderColor: questionForm.question_text && questionForm.question_text.trim().length < 10 ? "red.400" : "gray.400" 
                    }}
                    _focus={{ 
                      borderColor: questionForm.question_text && questionForm.question_text.trim().length < 10 ? "red.500" : "blue.500",
                      boxShadow: questionForm.question_text && questionForm.question_text.trim().length < 10 ? "0 0 0 1px red.500" : "0 0 0 1px blue.500"
                    }}
                  />
                  <HStack justify="space-between" mt={1}>
                    <Text fontSize="xs" color={questionForm.question_text && questionForm.question_text.trim().length < 10 ? "red.500" : "gray.500"}>
                    {questionForm.question_text?.length || 0} حرف
                  </Text>
                    {questionForm.question_text && questionForm.question_text.trim().length < 10 && (
                      <Text fontSize="xs" color="red.500">
                        الحد الأدنى: 10 أحرف
                      </Text>
                    )}
                  </HStack>
                </FormControl>
                <FormControl>
                  <FormLabel fontWeight="semibold">ترتيب السؤال</FormLabel>
                  <Input
                    type="number"
                    value={questionForm.order_index}
                    onChange={(e) => setQuestionForm({ ...questionForm, order_index: parseInt(e.target.value) || 0 })}
                    min={0}
                    placeholder="0"
                    isInvalid={questionForm.order_index < 0}
                    borderColor={questionForm.order_index < 0 ? "red.300" : "gray.300"}
                    _hover={{ 
                      borderColor: questionForm.order_index < 0 ? "red.400" : "gray.400" 
                    }}
                    _focus={{ 
                      borderColor: questionForm.order_index < 0 ? "red.500" : "blue.500",
                      boxShadow: questionForm.order_index < 0 ? "0 0 0 1px red.500" : "0 0 0 1px blue.500"
                    }}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    ترتيب السؤال في الامتحان (0 = الأول)
                  </Text>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setQuestionModal({ isOpen: false, type: 'add', data: null })}>
                إلغاء
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={questionModal.type === 'add' ? addQuestionEnhanced : updateQuestion}
                isDisabled={
                  questionModal.type === 'add' ? 
                  (!questionForm.question_text || questionForm.question_text.trim().length < 10 || questionForm.order_index < 0) :
                  false
                }
              >
                {questionModal.type === 'add' ? 'إضافة' : 'تحديث'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Student Answers Modal */}
        <Modal isOpen={studentAnswersModal.isOpen} onClose={() => setStudentAnswersModal({ isOpen: false, studentId: null, studentName: '' })} size="4xl" isCentered>
          <ModalOverlay bg="blackAlpha.600" />
          <ModalContent>
            <ModalHeader>
              <HStack spacing={3}>
                <Icon as={FaEye} color="blue.500" />
                <Text>إجابات {studentAnswersModal.studentName}</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={6} align="stretch">
                {loadingAnswers ? (
                  <VStack spacing={4} py={8}>
                    <Spinner size="xl" color="blue.500" />
                    <Text textAlign="center" color="gray.600">
                      جاري تحميل الإجابات...
                    </Text>
                  </VStack>
                ) : studentAnswers.length > 0 ? (
                  studentAnswers.map((answer, index) => (
                    <Card key={answer.id || index} bg={cardBg} borderColor={borderColor} boxShadow="md">
                      <CardBody>
                        <VStack align="start" spacing={4}>
                          <HStack spacing={3} w="full" justify="space-between">
                            <HStack spacing={3}>
                              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                                السؤال {index + 1}
                              </Text>
                              <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                                ترتيب: {answer.order_index + 1}
                              </Badge>
                            </HStack>
                            <Badge 
                              colorScheme={answer.answer_text ? "green" : "yellow"} 
                              fontSize="sm" 
                              px={3} 
                              py={1}
                            >
                              {answer.answer_text ? "مُجاب" : "غير مُجاب"}
                            </Badge>
                          </HStack>
                          
                          <Box w="full">
                            <Text fontSize="sm" fontWeight="semibold" color={subTextColor} mb={2}>
                              نص السؤال:
                            </Text>
                            <Box 
                              p={3} 
                              bg="blue.50" 
                              borderRadius="md" 
                              border="1px solid" 
                              borderColor="blue.200"
                            >
                              <Text fontSize="md" color="gray.800" lineHeight="1.6">
                                {answer.question_text}
                              </Text>
                            </Box>
                          </Box>

                          <Box w="full">
                            <Text fontSize="sm" fontWeight="semibold" color={subTextColor} mb={2}>
                              إجابة الطالب:
                            </Text>
                            {answer.answer_text ? (
                              <Box 
                                p={3} 
                                bg="green.50" 
                                borderRadius="md" 
                                border="1px solid" 
                                borderColor="green.200"
                                minH="100px"
                              >
                                <Text fontSize="md" color="gray.800" lineHeight="1.6" whiteSpace="pre-wrap">
                                  {answer.answer_text}
                                </Text>
                              </Box>
                            ) : (
                              <Box 
                                p={3} 
                                bg="yellow.50" 
                                borderRadius="md" 
                                border="1px solid" 
                                borderColor="yellow.200"
                                minH="100px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <Text fontSize="md" color="yellow.700" fontStyle="italic">
                                  لم يقم الطالب بالإجابة على هذا السؤال
                                </Text>
                              </Box>
                            )}
                          </Box>

                          {answer.answer_text && (
                            <VStack spacing={3} w="full">
                              <HStack spacing={4} w="full" justify="space-between" fontSize="xs" color={subTextColor}>
                                <Text>
                                  عدد الأحرف: {answer.answer_text.length}
                                </Text>
                                <Text>
                                  تاريخ الإجابة: {new Date(answer.created_at).toLocaleDateString('ar-SA')}
                                </Text>
                              </HStack>
                              
                              {/* Grade Status and Actions */}
                              <HStack spacing={3} w="full" justify="space-between">
                                <HStack spacing={2}>
                                  {answer.is_correct !== undefined ? (
                                    <Badge 
                                      colorScheme={answer.is_correct ? "green" : "red"} 
                                      fontSize="sm" 
                                      px={3} 
                                      py={1}
                                    >
                                      {answer.is_correct ? "صحيح" : "خطأ"}
                                    </Badge>
                                  ) : (
                                    <Badge 
                                      colorScheme="yellow" 
                                      fontSize="sm" 
                                      px={3} 
                                      py={1}
                                    >
                                      لم يتم التصحيح
                                    </Badge>
                                  )}
                                  {answer.grade !== undefined && (
                                    <Badge 
                                      colorScheme="blue" 
                                      fontSize="sm" 
                                      px={3} 
                                      py={1}
                                    >
                                      الدرجة: {answer.grade}
                                    </Badge>
                                  )}
                                </HStack>
                                
                                <Button
                                  size="sm"
                                  colorScheme="green"
                                  variant="outline"
                                  leftIcon={<Icon as={FaGraduationCap} />}
                                  onClick={() => openQuestionGradeModal(
                                    answer.question_id, 
                                    answer.question_text, 
                                    studentAnswersModal.studentId, 
                                    studentAnswersModal.studentName
                                  )}
                                >
                                  تصحيح
                                </Button>
                              </HStack>
                              
                              {/* Feedback */}
                              {answer.correction_feedback && (
                                <Box w="full" p={3} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                                  <Text fontSize="sm" color="blue.700" fontWeight="medium" mb={1}>
                                    تعليق المدرس:
                                  </Text>
                                  <Text fontSize="sm" color="blue.600" lineHeight="1.5">
                                    {answer.correction_feedback}
                                  </Text>
                                </Box>
                              )}
                            </VStack>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  ))
                ) : (
                  <VStack spacing={4} py={8}>
                    <Icon as={FaEye} color={subTextColor} boxSize={12} />
                    <Text textAlign="center" color={subTextColor} fontSize="lg">
                      لا توجد إجابات متاحة
                    </Text>
                    <Text textAlign="center" color={subTextColor} fontSize="sm">
                      لم يقم الطالب بالإجابة على أي سؤال بعد
                    </Text>
                  </VStack>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" onClick={() => setStudentAnswersModal({ isOpen: false, studentId: null, studentName: '' })}>
                إغلاق
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Edit Exam Modal */}
        <Modal isOpen={editExamModal.isOpen} onClose={() => setEditExamModal({ isOpen: false })} size="md" isCentered closeOnOverlayClick={false}>
          <ModalOverlay bg="blackAlpha.600" />
          <ModalContent>
            <ModalHeader>
              <HStack spacing={3}>
                <Icon as={FaEdit} color="blue.500" />
                <Text>تعديل الامتحان</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={6}>
                <FormControl>
                  <FormLabel fontWeight="semibold">عنوان الامتحان</FormLabel>
                  <Input
                    value={editExamForm.title}
                    onChange={(e) => setEditExamForm({ ...editExamForm, title: e.target.value })}
                    placeholder="أدخل عنوان الامتحان"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontWeight="semibold">وصف الامتحان</FormLabel>
                  <Textarea
                    value={editExamForm.description}
                    onChange={(e) => setEditExamForm({ ...editExamForm, description: e.target.value })}
                    placeholder="أدخل وصف الامتحان (اختياري)"
                    rows={3}
                    resize="vertical"
                  />
                </FormControl>
                <FormControl>
                  <HStack spacing={4}>
                    <FormLabel fontWeight="semibold" mb={0}>ظاهر للطلاب</FormLabel>
                    <Button
                      size="sm"
                      colorScheme={editExamForm.is_visible ? "green" : "gray"}
                      variant={editExamForm.is_visible ? "solid" : "outline"}
                      onClick={() => setEditExamForm({ ...editExamForm, is_visible: !editExamForm.is_visible })}
                    >
                      {editExamForm.is_visible ? "ظاهر" : "مخفي"}
                    </Button>
                  </HStack>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setEditExamModal({ isOpen: false })}>
                إلغاء
              </Button>
              <Button colorScheme="blue" onClick={updateExam}>
                حفظ التغييرات
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Exam Modal */}
        <Modal isOpen={deleteExamModal.isOpen} onClose={() => setDeleteExamModal({ isOpen: false })} size="md" isCentered closeOnOverlayClick={false}>
          <ModalOverlay bg="blackAlpha.600" />
          <ModalContent>
            <ModalHeader>
              <HStack spacing={3}>
                <Icon as={FaTrash} color="red.500" />
                <Text>حذف الامتحان</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Icon as={FaTimes} color="red.500" boxSize={12} />
                <VStack spacing={2}>
                  <Text fontSize="lg" fontWeight="bold" color={textColor} textAlign="center">
                    هل أنت متأكد من حذف هذا الامتحان؟
                  </Text>
                  <Text fontSize="sm" color={subTextColor} textAlign="center">
                    هذا الإجراء لا يمكن التراجع عنه. سيتم حذف الامتحان وجميع الأسئلة والإجابات المرتبطة به نهائياً.
                  </Text>
                </VStack>
                {exam && (
                  <Box p={4} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200" w="full">
                    <Text fontSize="sm" color="red.700" fontWeight="medium">
                      <strong>عنوان الامتحان:</strong> {exam.title}
                    </Text>
                    {exam.description && (
                      <Text fontSize="sm" color="red.600" mt={1}>
                        <strong>الوصف:</strong> {exam.description}
                      </Text>
                    )}
                  </Box>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setDeleteExamModal({ isOpen: false })}>
                إلغاء
              </Button>
              <Button colorScheme="red" onClick={deleteExam}>
                حذف نهائياً
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Question Modal */}
        <Modal isOpen={deleteQuestionModal.isOpen} onClose={() => setDeleteQuestionModal({ isOpen: false, questionId: null, questionText: '' })} size="md" isCentered closeOnOverlayClick={false}>
         
          <ModalContent>
            <ModalHeader>
              <HStack spacing={3}>
                <Icon as={FaTrash} color="red.500" />
                <Text>حذف السؤال</Text>
              </HStack>
            </ModalHeader>
           
            <ModalBody>
              <VStack spacing={4}>
                <Icon as={FaTimes} color="red.500" boxSize={12} />
                <VStack spacing={2}>
                  <Text fontSize="lg" fontWeight="bold" color={textColor} textAlign="center">
                    هل أنت متأكد من حذف هذا السؤال؟
                  </Text>
                  <Text fontSize="sm" color={subTextColor} textAlign="center">
                    هذا الإجراء لا يمكن التراجع عنه. سيتم حذف السؤال نهائياً.
                  </Text>
                </VStack>
                {deleteQuestionModal.questionText && (
                  <Box p={4} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200" w="full">
                    <Text fontSize="sm" color="red.700" fontWeight="medium" mb={2}>
                      <strong>نص السؤال:</strong>
                    </Text>
                    <Text fontSize="sm" color="red.600" lineHeight="1.5">
                      {deleteQuestionModal.questionText}
                    </Text>
                  </Box>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setDeleteQuestionModal({ isOpen: false, questionId: null, questionText: '' })}>
                إلغاء
              </Button>
              <Button colorScheme="red" onClick={deleteQuestion}>
                حذف نهائياً
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Question Grade Modal */}
        <Modal isOpen={questionGradeModal.isOpen} onClose={() => setQuestionGradeModal({ isOpen: false, questionId: null, questionText: '', studentId: null, studentName: '' })} size="md" isCentered closeOnOverlayClick={false}>
          <ModalOverlay bg="blackAlpha.600" />
          <ModalContent>
            <ModalHeader>
              <HStack spacing={3}>
                <Icon as={FaGraduationCap} color="green.500" />
                <Text>تصحيح سؤال - {questionGradeModal.studentName}</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={6}>
                {/* Question Text */}
                <Box w="full">
                  <Text fontSize="sm" fontWeight="semibold" color={subTextColor} mb={2}>
                    نص السؤال:
                  </Text>
                  <Box 
                    p={3} 
                    bg="blue.50" 
                    borderRadius="md" 
                    border="1px solid" 
                    borderColor="blue.200"
                  >
                    <Text fontSize="md" color="gray.800" lineHeight="1.6">
                      {questionGradeModal.questionText}
                    </Text>
                  </Box>
                </Box>

                {/* Grade Form */}
                <VStack spacing={4} w="full">
                  <FormControl>
                    <HStack spacing={4}>
                      <FormLabel fontWeight="semibold" mb={0}>التقييم</FormLabel>
                      <Button
                        size="sm"
                        colorScheme={questionGradeForm.is_correct ? "green" : "gray"}
                        variant={questionGradeForm.is_correct ? "solid" : "outline"}
                        onClick={() => setQuestionGradeForm({ ...questionGradeForm, is_correct: true })}
                      >
                        صحيح
                      </Button>
                      <Button
                        size="sm"
                        colorScheme={!questionGradeForm.is_correct ? "red" : "gray"}
                        variant={!questionGradeForm.is_correct ? "solid" : "outline"}
                        onClick={() => setQuestionGradeForm({ ...questionGradeForm, is_correct: false })}
                      >
                        خطأ
                      </Button>
                    </HStack>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel fontWeight="semibold">التعليق</FormLabel>
                    <Textarea
                      value={questionGradeForm.feedback}
                      onChange={(e) => setQuestionGradeForm({ ...questionGradeForm, feedback: e.target.value })}
                      placeholder="اكتب تعليقك على الإجابة... (اختياري)"
                      rows={4}
                      resize="vertical"
                    />
                  </FormControl>
                </VStack>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setQuestionGradeModal({ isOpen: false, questionId: null, questionText: '', studentId: null, studentName: '' })}>
                إلغاء
              </Button>
              <Button colorScheme="green" onClick={gradeQuestion}>
                حفظ التصحيح
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Box>
  );
};

// Student View Component
const StudentView = ({ 
  exam, questions, answers, grade, submitAnswer, submitting, textColor, subTextColor, cardBg, borderColor,
  studentReport, loadingReport, fetchStudentReport
}) => {
  const [localAnswers, setLocalAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [submitAllLoading, setSubmitAllLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());

  useEffect(() => {
    const answersMap = {};
    const answeredSet = new Set();
    answers.forEach(answer => {
      answersMap[answer.question_id] = answer.answer_text;
      answeredSet.add(answer.question_id);
    });
    setLocalAnswers(answersMap);
    setAnsweredQuestions(answeredSet);
  }, [answers]);

  const handleAnswerChange = (questionId, value) => {
    setLocalAnswers(prev => ({ ...prev, [questionId]: value }));
    if (errors[questionId]) {
      setErrors(prev => ({ ...prev, [questionId]: '' }));
    }
    
    // Update answered questions set
    if (value && value.trim().length >= 10) {
      setAnsweredQuestions(prev => new Set([...prev, questionId]));
    } else {
      setAnsweredQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    }
  };

  const validateAnswers = () => {
    const newErrors = {};
    let isValid = true;

    questions.forEach(question => {
      const answer = localAnswers[question.id];
      if (!answer || answer.trim().length < 10) {
        newErrors[question.id] = 'يجب أن تكون الإجابة على الأقل 10 أحرف';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmitAllAnswers = async () => {
    if (!validateAnswers()) {
      return;
    }

    setSubmitAllLoading(true);
    try {
      const promises = questions.map(question => 
        submitAnswer(question.id, localAnswers[question.id] || '')
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error submitting answers:', error);
    } finally {
      setSubmitAllLoading(false);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = ((answeredQuestions.size / questions.length) * 100) || 0;
  const allQuestionsAnswered = answeredQuestions.size === questions.length;

  return (
    <VStack spacing={6} align="stretch">
      {/* Detailed Report Display */}
      {studentReport && (
        <Card bg={cardBg} borderColor={borderColor} boxShadow="lg">
          <CardBody>
            <VStack spacing={6}>
              {/* Report Header */}
              <HStack spacing={4} w="full" justify="space-between">
                <HStack spacing={4}>
                  <Icon as={FaStar} color="yellow.500" boxSize={6} />
                  <VStack align="start" spacing={1}>
                    <Text fontSize="lg" fontWeight="bold" color={textColor}>
                      تقرير مفصل للامتحان
                    </Text>
                    <Text color={subTextColor}>
                      {studentReport.exam.title}
                    </Text>
                  </VStack>
                </HStack>
                <Button
                  size="sm"
                  colorScheme="blue"
                  variant="outline"
                  onClick={fetchStudentReport}
                  isLoading={loadingReport}
                  leftIcon={<Icon as={FaRedo} />}
                >
                  تحديث
                </Button>
              </HStack>

              {/* Summary */}
              <Box w="full" p={4} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                <VStack spacing={3}>
                  <Text fontSize="md" fontWeight="bold" color="blue.700" textAlign="center">
                    ملخص النتائج
                  </Text>
                  <HStack spacing={6} wrap="wrap" justify="center">
                    <VStack spacing={1}>
                      <Text fontSize="2xl" fontWeight="bold" color="green.600">
                        {studentReport.summary.total_grade}
                      </Text>
                      <Text fontSize="sm" color="blue.600">
                        من {studentReport.summary.max_grade}
                      </Text>
                      <Text fontSize="xs" color="blue.500">
                        ({studentReport.summary.percentage}%)
                      </Text>
                    </VStack>
                    <VStack spacing={1}>
                      <Text fontSize="lg" fontWeight="bold" color="green.600">
                        {studentReport.summary.correct_answers}
                      </Text>
                      <Text fontSize="sm" color="blue.600">
                        إجابة صحيحة
                      </Text>
                    </VStack>
                    <VStack spacing={1}>
                      <Text fontSize="lg" fontWeight="bold" color="red.600">
                        {studentReport.summary.wrong_answers}
                      </Text>
                      <Text fontSize="sm" color="blue.600">
                        إجابة خاطئة
                      </Text>
                    </VStack>
                    <VStack spacing={1}>
                      <Text fontSize="lg" fontWeight="bold" color="yellow.600">
                        {studentReport.summary.pending_answers}
                      </Text>
                      <Text fontSize="sm" color="blue.600">
                        في الانتظار
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
              </Box>

              {/* General Grade and Feedback */}
              {studentReport.summary.total_grade && studentReport.summary.max_grade && (
                <Box w="full" p={4} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
                  <VStack spacing={3}>
                    <Text fontSize="md" fontWeight="bold" color="green.700" textAlign="center">
                      التقييم العام
                    </Text>
                    <HStack spacing={4} justify="center">
                      <VStack spacing={1}>
                        <Text fontSize="lg" fontWeight="bold" color="green.600">
                          {studentReport.summary.total_grade} / {studentReport.summary.max_grade}
                        </Text>
                        <Text fontSize="sm" color="green.600">
                          الدرجة الإجمالية
                        </Text>
                      </VStack>
                      <VStack spacing={1}>
                        <Text fontSize="lg" fontWeight="bold" color="green.600">
                          {studentReport.summary.percentage}%
                        </Text>
                        <Text fontSize="sm" color="green.600">
                          النسبة المئوية
                        </Text>
                      </VStack>
                    </HStack>
                  </VStack>
                </Box>
              )}

              {/* Questions with Results */}
              <VStack spacing={4} w="full">
                <Text fontSize="md" fontWeight="bold" color={textColor} w="full">
                  تفاصيل الأسئلة:
                </Text>
                {studentReport.questions.map((question, index) => (
                  <Card key={question.question_id} w="full" bg={question.is_correct ? "green.50" : question.is_correct === false ? "red.50" : "gray.50"} borderColor={question.is_correct ? "green.200" : question.is_correct === false ? "red.200" : "gray.200"}>
                    <CardBody>
                      <VStack spacing={3} align="start">
                        <HStack spacing={3} w="full" justify="space-between">
                          <HStack spacing={3}>
                            <Text fontSize="lg" fontWeight="bold" color={textColor}>
                              السؤال {index + 1}
                            </Text>
                            <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                              ترتيب: {question.order_index + 1}
                            </Badge>
                          </HStack>
                          <Badge 
                            colorScheme={question.is_correct === true ? "green" : question.is_correct === false ? "red" : "yellow"} 
                            fontSize="sm" 
                            px={3} 
                            py={1}
                          >
                            {question.is_correct === true ? "صحيح" : question.is_correct === false ? "خطأ" : "لم يتم التصحيح"}
                          </Badge>
                        </HStack>

                        <Box w="full">
                          <Text fontSize="sm" fontWeight="semibold" color={subTextColor} mb={2}>
                            نص السؤال:
                          </Text>
                          <Box 
                            p={3} 
                            bg="blue.50" 
                            borderRadius="md" 
                            border="1px solid" 
                            borderColor="blue.200"
                          >
                            <Text fontSize="md" color="gray.800" lineHeight="1.6">
                              {question.question_text}
                            </Text>
                          </Box>
                        </Box>

                        <Box w="full">
                          <Text fontSize="sm" fontWeight="semibold" color={subTextColor} mb={2}>
                            إجابتك:
                          </Text>
                          <Box 
                            p={3} 
                            bg={question.is_correct === true ? "green.50" : question.is_correct === false ? "red.50" : "gray.50"} 
                            borderRadius="md" 
                            border="1px solid" 
                            borderColor={question.is_correct === true ? "green.200" : question.is_correct === false ? "red.200" : "gray.200"}
                          >
                            <Text fontSize="md" color="gray.800" lineHeight="1.6" whiteSpace="pre-wrap">
                              {question.answer_text}
                            </Text>
                          </Box>
                        </Box>

                        <HStack spacing={4} w="full" justify="space-between">
                          <HStack spacing={2}>
                            <Text fontSize="sm" color={subTextColor}>
                              الدرجة:
                            </Text>
                            <Text fontSize="sm" fontWeight="bold" color={question.is_correct === true ? "green.600" : question.is_correct === false ? "red.600" : "gray.600"}>
                              {question.grade || "لم يتم التصحيح"}
                            </Text>
                          </HStack>
                          <HStack spacing={2}>
                            <Text fontSize="sm" color={subTextColor}>
                              تاريخ التصحيح:
                            </Text>
                            <Text fontSize="sm" color={subTextColor}>
                              {question.graded_at ? new Date(question.graded_at).toLocaleDateString('ar-SA') : "لم يتم التصحيح"}
                            </Text>
                          </HStack>
                        </HStack>

                        {question.correction_feedback && (
                          <Box w="full" p={3} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                            <Text fontSize="sm" color="blue.700" fontWeight="medium" mb={1}>
                              تعليق المدرس ({question.graded_by_name}):
                            </Text>
                            <Text fontSize="sm" color="blue.600" lineHeight="1.5">
                              {question.correction_feedback}
                            </Text>
                          </Box>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Loading Report */}
      {loadingReport && (
        <Card bg={cardBg} borderColor={borderColor} boxShadow="lg">
          <CardBody>
            <VStack spacing={4} py={8}>
              <Spinner size="xl" color="blue.500" />
              <Text textAlign="center" color="gray.600">
                جاري تحميل التقرير المفصل...
              </Text>
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* No Report Available */}
      {!studentReport && !loadingReport && (
        <Card bg={cardBg} borderColor={borderColor} boxShadow="lg">
          <CardBody>
            <VStack spacing={4} py={8}>
              <Icon as={FaFileAlt} color={subTextColor} boxSize={12} />
              <Text textAlign="center" color={subTextColor} fontSize="lg">
                لم يتم تصحيح الامتحان بعد
              </Text>
              <Text textAlign="center" color={subTextColor} fontSize="sm">
                سيظهر التقرير المفصل هنا بعد تصحيح المدرس
              </Text>
              <Button
                size="sm"
                colorScheme="blue"
                variant="outline"
                onClick={fetchStudentReport}
                leftIcon={<Icon as={FaRedo} />}
              >
                تحديث
              </Button>
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Progress and Navigation */}
      {questions.length > 0 && (
        <Card bg={cardBg} borderColor={borderColor} boxShadow="md">
          <CardBody p={{ base: 4, md: 6 }}>
            <VStack spacing={4}>
              {/* Progress Bar */}
              <Box w="full">
                <HStack justify="space-between" mb={2} wrap="wrap" gap={2}>
                  <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="semibold" color={textColor}>
                    تقدم الإجابة
                  </Text>
                  <Text fontSize={{ base: "xs", md: "sm" }} color={subTextColor}>
                    {answeredQuestions.size} من {questions.length} سؤال
                  </Text>
                </HStack>
                <Progress 
                  value={progressPercentage} 
                  colorScheme="blue" 
                  size={{ base: "md", md: "lg" }}
                  borderRadius="md"
                  bg="gray.100"
                >
                  <ProgressLabel fontSize={{ base: "xs", md: "xs" }} color="white">
                    {Math.round(progressPercentage)}%
                  </ProgressLabel>
                </Progress>
              </Box>

              {/* Question Navigation */}
              <Box w="full" overflowX="auto">
                <HStack spacing={2} justify="center" minW="max-content" py={2}>
                  {questions.map((_, index) => (
                    <Button
                      key={index}
                      size={{ base: "xs", md: "sm" }}
                      variant={index === currentQuestionIndex ? "solid" : "outline"}
                      colorScheme={index === currentQuestionIndex ? "blue" : "gray"}
                      onClick={() => goToQuestion(index)}
                      minW={{ base: "32px", md: "40px" }}
                      position="relative"
                      fontSize={{ base: "xs", md: "sm" }}
                    >
                      {index + 1}
                      {answeredQuestions.has(questions[index].id) && (
                        <Icon as={FaCheck} position="absolute" top="-1" right="-1" color="green.500" fontSize="xs" />
                      )}
                    </Button>
                  ))}
                </HStack>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Current Question */}
      {currentQuestion && (
        <Card bg={cardBg} borderColor={borderColor} boxShadow="lg">
          <CardBody p={{ base: 4, md: 6 }}>
            <VStack spacing={6} align="stretch">
              {/* Question Header */}
              <Flex 
                justify="space-between" 
                align="start" 
                direction={{ base: "column", md: "row" }}
                gap={4}
              >
                <VStack align="start" spacing={2}>
                  <Text 
                    fontSize={{ base: "lg", md: "xl" }} 
                    fontWeight="bold" 
                    color={textColor}
                    lineHeight="1.2"
                  >
                    السؤال {currentQuestionIndex + 1} من {questions.length}
                  </Text>
                  <Badge 
                    colorScheme="blue" 
                    fontSize={{ base: "xs", md: "sm" }} 
                    px={{ base: 2, md: 3 }} 
                    py={1}
                  >
                    ترتيب: {currentQuestion.order_index + 1}
                  </Badge>
                </VStack>
                {answeredQuestions.has(currentQuestion.id) && (
                  <Badge 
                    colorScheme="green" 
                    fontSize={{ base: "xs", md: "sm" }} 
                    px={{ base: 2, md: 3 }} 
                    py={1}
                  >
                    <Icon as={FaCheck} mr={1} />
                    تم الإجابة
                  </Badge>
                )}
              </Flex>
              
              {/* Question Text */}
              <Box 
                p={{ base: 3, md: 4 }} 
                bg="blue.50" 
                borderRadius="md" 
                border="1px solid" 
                borderColor="blue.200"
              >
                <Text 
                  fontSize={{ base: "md", md: "lg" }} 
                  color="gray.800" 
                  lineHeight="1.6" 
                  fontWeight="medium"
                >
                  {currentQuestion.question_text}
                </Text>
              </Box>

              {/* Answer Input */}
              <FormControl isInvalid={!!errors[currentQuestion.id]}>
                <FormLabel 
                  fontSize={{ base: "sm", md: "md" }} 
                  fontWeight="semibold" 
                  color={textColor}
                >
                  إجابتك:
                </FormLabel>
                <Textarea
                  value={localAnswers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="اكتب إجابتك هنا... (يجب أن تكون على الأقل 10 أحرف)"
                  rows={{ base: 6, md: 8 }}
                  resize="vertical"
                  borderColor={errors[currentQuestion.id] ? "red.300" : "gray.300"}
                  _hover={{ borderColor: errors[currentQuestion.id] ? "red.400" : "gray.400" }}
                  _focus={{ 
                    borderColor: errors[currentQuestion.id] ? "red.500" : "blue.500",
                    boxShadow: errors[currentQuestion.id] ? "0 0 0 1px red.500" : "0 0 0 1px blue.500"
                  }}
                  fontSize={{ base: "sm", md: "md" }}
                />
                {errors[currentQuestion.id] && (
                  <Text color="red.500" fontSize={{ base: "xs", md: "sm" }} mt={1}>
                    {errors[currentQuestion.id]}
                  </Text>
                )}
                <Flex 
                  justify="space-between" 
                  mt={2} 
                  direction={{ base: "column", sm: "row" }}
                  gap={1}
                >
                  <Text fontSize="xs" color={subTextColor}>
                    {localAnswers[currentQuestion.id]?.length || 0} حرف
                  </Text>
                  <Text fontSize="xs" color={subTextColor}>
                    الحد الأدنى: 10 أحرف
                  </Text>
                </Flex>
              </FormControl>

              {/* Navigation Buttons */}
              <Flex 
                justify="space-between" 
                align="center"
                direction={{ base: "column", md: "row" }}
                gap={4}
                pt={4}
              >
                <Button
                  leftIcon={<Icon as={FaArrowLeft} />}
                  onClick={goToPreviousQuestion}
                  isDisabled={currentQuestionIndex === 0}
                  variant="outline"
                  colorScheme="blue"
                  size={{ base: "sm", md: "md" }}
                  w={{ base: "full", md: "auto" }}
                >
                  السؤال السابق
                </Button>

                <Text 
                  fontSize={{ base: "xs", md: "sm" }} 
                  color={subTextColor}
                  textAlign="center"
                >
                  {currentQuestionIndex + 1} من {questions.length}
                </Text>

                <Button
                  rightIcon={<Icon as={FaArrowLeft} transform="rotate(180deg)" />}
                  onClick={goToNextQuestion}
                  isDisabled={currentQuestionIndex === questions.length - 1}
                  variant="outline"
                  colorScheme="blue"
                  size={{ base: "sm", md: "md" }}
                  w={{ base: "full", md: "auto" }}
                >
                  السؤال التالي
                </Button>
              </Flex>
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Submit All Button - Only show when all questions are answered */}
      {questions.length > 0 && allQuestionsAnswered && (
        <Card bg="green.50" borderColor="green.200" boxShadow="lg">
          <CardBody p={{ base: 4, md: 6 }}>
            <VStack spacing={4}>
              <Flex 
                direction={{ base: "column", sm: "row" }}
                align="center"
                gap={3}
                w="full"
              >
                <Icon as={FaCheck} color="green.500" boxSize={{ base: 5, md: 6 }} />
                <VStack align={{ base: "center", sm: "start" }} spacing={1}>
                  <Text 
                    fontSize={{ base: "md", md: "lg" }} 
                    fontWeight="bold" 
                    color="green.700"
                    textAlign={{ base: "center", sm: "left" }}
                  >
                    تم الإجابة على جميع الأسئلة!
                  </Text>
                  <Text 
                    fontSize={{ base: "xs", md: "sm" }} 
                    color="green.600"
                    textAlign={{ base: "center", sm: "left" }}
                  >
                    يمكنك الآن إرسال جميع الإجابات
                  </Text>
                </VStack>
              </Flex>
              
              <Button
                colorScheme="green"
                size={{ base: "md", md: "lg" }}
                leftIcon={<Icon as={FaRegPaperPlane} />}
                onClick={handleSubmitAllAnswers}
                isLoading={submitAllLoading}
                loadingText="جاري الإرسال..."
                isDisabled={submitting}
                w="full"
                maxW={{ base: "full", sm: "300px" }}
              >
                إرسال جميع الإجابات
              </Button>
            </VStack>
          </CardBody>
        </Card>
      )}

      {questions.length === 0 && (
        <Card bg={cardBg} borderColor={borderColor} boxShadow="md">
          <CardBody>
            <VStack spacing={4} py={8}>
              <Icon as={FaClock} color={subTextColor} boxSize={12} />
              <Text textAlign="center" color={subTextColor} fontSize="lg">
                لا توجد أسئلة في هذا الامتحان بعد.
              </Text>
              <Text textAlign="center" color={subTextColor} fontSize="sm">
                يرجى مراجعة المدرس لإضافة الأسئلة
              </Text>
            </VStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
};

// Teacher View Component
const TeacherView = ({ 
  exam, questions, students, textColor, subTextColor, cardBg, borderColor,
  openAddQuestionModal, openEditQuestionModal, setQuestionModal, openDeleteQuestionModal, deleteQuestion, setGradeModal, openStudentAnswersModal, setStudentAnswersModal, openQuestionGradeModal 
}) => {
  return (
    <Tabs>
      <TabList>
        <Tab>الأسئلة</Tab>
        <Tab>الطلاب</Tab>
      </TabList>

      <TabPanels>
        <TabPanel p={0} pt={6}>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Text fontSize="xl" fontWeight="bold" color={textColor}>
                  أسئلة الامتحان
                </Text>
                <Text fontSize="sm" color={subTextColor}>
                  إدارة أسئلة الامتحان المقالي
                </Text>
              </VStack>
              <Button
                leftIcon={<Icon as={FaPlus} />}
                colorScheme="blue"
                size={{ base: "sm", md: "md" }}
                onClick={openAddQuestionModal}
                _hover={{
                  transform: 'translateY(-1px)',
                  boxShadow: 'lg'
                }}
                transition="all 0.2s"
              >
                إضافة سؤال جديد
              </Button>
            </HStack>

            {questions.map((question, index) => (
              <Card key={question.id} bg={cardBg} borderColor={borderColor} boxShadow="md">
                <CardBody>
                  <VStack align="start" spacing={3}>
                    <Flex justify="space-between" align="start" w="full">
                      <HStack spacing={3}>
                        <Text fontSize="lg" fontWeight="bold" color={textColor}>
                          السؤال {index + 1}
                        </Text>
                        <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                          {question.order_index + 1}
                        </Badge>
                      </HStack>
                      <HStack spacing={2}>
                        <Tooltip label="تعديل السؤال">
                          <IconButton
                            icon={<Icon as={FaEdit} />}
                            colorScheme="blue"
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditQuestionModal(question)}
                          />
                        </Tooltip>
                        <Tooltip label="حذف السؤال">
                          <IconButton
                            icon={<Icon as={FaTrash} />}
                            colorScheme="red"
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteQuestionModal(question.id, question.question_text)}
                          />
                        </Tooltip>
                      </HStack>
                    </Flex>
                    <Text color={textColor} lineHeight="1.6" fontSize="md">
                      {question.question_text}
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            ))}

            {questions.length === 0 && (
              <Card bg={cardBg} borderColor={borderColor} boxShadow="md">
                <CardBody>
                  <VStack spacing={4} py={8}>
                    <Icon as={FaPlus} color={subTextColor} boxSize={12} />
                    <Text textAlign="center" color={subTextColor} fontSize="lg">
                      لا توجد أسئلة في هذا الامتحان بعد.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>
        </TabPanel>

        <TabPanel p={0} pt={6}>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Text fontSize="xl" fontWeight="bold" color={textColor}>
                  الطلاب المشاركون
                </Text>
                <Text fontSize="sm" color={subTextColor}>
                  {students.length} طالب مشارك في الامتحان
                </Text>
              </VStack>
              <Badge colorScheme="blue" fontSize="lg" px={4} py={2}>
                {students.length}
              </Badge>
            </HStack>

            {students.length > 0 ? (
              <Card bg={cardBg} borderColor={borderColor} boxShadow="md">
                <CardBody p={0}>
                  <Table variant="simple" size="md">
                    <Thead bg="gray.50">
                      <Tr>
                        <Th fontSize="sm" fontWeight="bold" color="gray.700">اسم الطالب</Th>
                        <Th fontSize="sm" fontWeight="bold" color="gray.700">البريد الإلكتروني</Th>
                        <Th fontSize="sm" fontWeight="bold" color="gray.700">الأسئلة المجابة</Th>
                        <Th fontSize="sm" fontWeight="bold" color="gray.700">الدرجة</Th>
                        <Th fontSize="sm" fontWeight="bold" color="gray.700">الحالة</Th>
                        <Th fontSize="sm" fontWeight="bold" color="gray.700">الإجراءات</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {students.map((student) => (
                        <Tr key={student.student_id} _hover={{ bg: "gray.50" }}>
                          <Td>
                            <HStack spacing={3}>
                              <Icon as={FaUser} color="blue.500" />
                              <Text fontWeight="medium" color={textColor}>
                                {student.student_name}
                              </Text>
                            </HStack>
                          </Td>
                          <Td>
                            <Text fontSize="sm" color={subTextColor}>
                              {student.student_email}
                            </Text>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <Text fontWeight="bold" color={textColor}>
                                {student.answered_questions}/{student.total_questions}
                              </Text>
                              <Badge 
                                colorScheme={student.answered_questions === student.total_questions ? "green" : "yellow"}
                                fontSize="xs"
                              >
                                {student.answered_questions === student.total_questions ? "مكتمل" : "غير مكتمل"}
                              </Badge>
                            </HStack>
                          </Td>
                          <Td>
                            {student.graded_at ? (
                              <HStack spacing={2}>
                                <Text color="green.500" fontWeight="bold" fontSize="lg">
                                  {student.total_grade}/{student.max_grade}
                                </Text>
                                <Text color="green.500" fontSize="sm">
                                  ({Math.round((student.total_grade / student.max_grade) * 100)}%)
                                </Text>
                              </HStack>
                            ) : (
                              <Text color="gray.500" fontSize="sm">لم يتم التصحيح</Text>
                            )}
                          </Td>
                          <Td>
                            <Badge 
                              colorScheme={student.graded_at ? "green" : "yellow"}
                              fontSize="sm"
                              px={3}
                              py={1}
                            >
                              {student.graded_at ? "مقيم" : "في الانتظار"}
                            </Badge>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <Tooltip label="عرض الإجابات">
                                <IconButton
                                  icon={<Icon as={FaEye} />}
                                  colorScheme="blue"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openStudentAnswersModal(student.student_id, student.student_name)}
                                />
                              </Tooltip>
                              <Tooltip label="تصحيح الامتحان">
                                <IconButton
                                  icon={<Icon as={FaGraduationCap} />}
                                  colorScheme="green"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setGradeModal({ 
                                      isOpen: true, 
                                      studentId: student.student_id, 
                                      studentName: student.student_name 
                                    });
                                  }}
                                />
                              </Tooltip>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            ) : (
              <Card bg={cardBg} borderColor={borderColor} boxShadow="md">
                <CardBody>
                  <VStack spacing={4} py={8}>
                    <Icon as={FaUsers} color={subTextColor} boxSize={12} />
                    <Text textAlign="center" color={subTextColor} fontSize="lg">
                      لا يوجد طلاب مشاركون في هذا الامتحان بعد.
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

export default EssayExam;