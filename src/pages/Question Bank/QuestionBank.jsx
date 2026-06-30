import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  useColorModeValue,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Icon,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  Image,
  IconButton,
  Spinner,
  HStack,
  VStack,
  Badge,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  FiBook,
  FiSearch,
  FiGrid,
  FiPlus,
  FiEdit,
  FiTrash,
  FiUpload,
  FiX,
  FiFolder,
  FiFileText
} from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import baseUrl from '../../api/baseUrl';
import {
  countSubjectBooks,
  countSubjectChapters,
  countSubjectLessons,
  getSubjectBooks,
} from '../../utils/questionBankTree';

const MotionBox = motion(Box);
const MotionButton = motion(Button);

const QuestionBank = () => {
  const { id } = useParams();
  const toast = useToast();

  // States
  const [questionBank, setQuestionBank] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Edit states
  const [editingSubject, setEditingSubject] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: ''
  });

  // Loading states
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [deletingSubject, setDeletingSubject] = useState(null);

  // Chapter states (إضافة / تعديل / حذف فصل)
  const [subjectForNewChapter, setSubjectForNewChapter] = useState(null);
  const [chapterFormData, setChapterFormData] = useState({ name: '', description: '' });
  const [chapterSelectedImage, setChapterSelectedImage] = useState(null);
  const [chapterImagePreview, setChapterImagePreview] = useState(null);
  const [editingChapter, setEditingChapter] = useState(null);
  const [editChapterFormData, setEditChapterFormData] = useState({ name: '', description: '' });
  const [editChapterImagePreview, setEditChapterImagePreview] = useState(null);
  const [editChapterSelectedImage, setEditChapterSelectedImage] = useState(null);
  const [deletingChapter, setDeletingChapter] = useState(null);
  const { isOpen: isChapterAddOpen, onOpen: onChapterAddOpen, onClose: onChapterAddClose } = useDisclosure();
  const { isOpen: isChapterEditOpen, onOpen: onChapterEditOpen, onClose: onChapterEditClose } = useDisclosure();
  const { isOpen: isChapterDeleteOpen, onOpen: onChapterDeleteOpen, onClose: onChapterDeleteClose } = useDisclosure();
  const [chapterSubmitLoading, setChapterSubmitLoading] = useState(false);
  const [chapterEditLoading, setChapterEditLoading] = useState(false);
  const [chapterDeleteLoading, setChapterDeleteLoading] = useState(false);

  // Lesson states (إضافة / تعديل / حذف درس)
  const [chapterForNewLesson, setChapterForNewLesson] = useState(null);
  const [lessonFormData, setLessonFormData] = useState({ name: '', description: '' });
  const [lessonSelectedImage, setLessonSelectedImage] = useState(null);
  const [lessonImagePreview, setLessonImagePreview] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editLessonFormData, setEditLessonFormData] = useState({ name: '', description: '' });
  const [editLessonImagePreview, setEditLessonImagePreview] = useState(null);
  const [editLessonSelectedImage, setEditLessonSelectedImage] = useState(null);
  const [deletingLesson, setDeletingLesson] = useState(null);
  const { isOpen: isLessonAddOpen, onOpen: onLessonAddOpen, onClose: onLessonAddClose } = useDisclosure();
  const { isOpen: isLessonEditOpen, onOpen: onLessonEditOpen, onClose: onLessonEditClose } = useDisclosure();
  const { isOpen: isLessonDeleteOpen, onOpen: onLessonDeleteOpen, onClose: onLessonDeleteClose } = useDisclosure();
  const [lessonSubmitLoading, setLessonSubmitLoading] = useState(false);
  const [lessonEditLoading, setLessonEditLoading] = useState(false);
  const [lessonDeleteLoading, setLessonDeleteLoading] = useState(false);

  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [activeChapterId, setActiveChapterId] = useState(null);

  useEffect(() => {
    if (subjects.length > 0 && !activeSubjectId) {
      const firstSubject = subjects[0];
      setActiveSubjectId(firstSubject.id);
      if (firstSubject.chapters?.length > 0) {
        setActiveChapterId(firstSubject.chapters[0].id);
      }
    }
  }, [subjects, activeSubjectId]);

  // ألوان بسيطة تتناسب مع البراند
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const cardBackground = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const textPrimary = useColorModeValue("gray.800", "gray.200");
  const textSecondary = useColorModeValue("gray.600", "gray.400");
  const buttonPrimary = useColorModeValue("blue.500", "blue.400");
  const buttonPrimaryHover = useColorModeValue("blue.600", "blue.500");
  const buttonSecondary = useColorModeValue("orange.500", "orange.400");
  const buttonSecondaryHover = useColorModeValue("orange.600", "orange.500");
  const iconBg = useColorModeValue("blue.50", "blue.900");
  const iconBorder = useColorModeValue("blue.200", "blue.800");
  const iconShadow = "sm";
  const buttonHoverShadow = useColorModeValue(
    "0 14px 32px rgba(49, 130, 206, 0.28)",
    "0 14px 32px rgba(99, 179, 237, 0.22)"
  );
  const inputBg = useColorModeValue("white", "gray.700");
  const inputBorder = useColorModeValue("gray.300", "gray.600");
  const searchIconColor = useColorModeValue("#4299e1", "#63b3ed");
  const accordionHoverBg = useColorModeValue("gray.50", "gray.700");
  const lessonCardBg = useColorModeValue("gray.50", "gray.700");
  const lessonCardHoverBg = useColorModeValue("blue.50", "gray.600");
  const badgeActiveBg = useColorModeValue("green.100", "green.900");
  const badgeActiveColor = useColorModeValue("green.700", "green.300");
  const cardShadow = "sm";
  const inputHoverBorder = useColorModeValue("blue.300", "blue.700");
  const inputFocusBorder = useColorModeValue("blue.500", "blue.400");
  const inputFocusBg = useColorModeValue("white", "gray.600");
  const focusRingShadow = useColorModeValue("0 0 0 3px rgba(66, 153, 225, 0.2)", "0 0 0 3px rgba(66, 153, 225, 0.3)");
  const modalBg = useColorModeValue("white", "gray.800");
  const modalBorder = useColorModeValue("gray.200", "gray.700");
  const modalHeaderBg = useColorModeValue("blue.500", "blue.600");
  const modalFooterBg = useColorModeValue("gray.50", "gray.700");

  // Fetch question bank data
  const fetchQuestionBankData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "خطأ",
          description: "يجب تسجيل الدخول أولاً",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const response = await baseUrl.get(`/api/question-banks/${id}/with-subjects`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      console.log("Question Bank API Response:", response.data);

      if (response.data.success) {
        setQuestionBank(response.data.data.question_bank);
        setSubjects(response.data.data.subjects);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "حدث خطأ في جلب بيانات بنك الأسئلة";
      setError(errorMsg);
      console.error("Error fetching question bank:", err);
    } finally {
      setLoading(false);
    }
  };

  // Create new subject
  const createSubject = async (formData) => {
    try {
      setSubmitLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "خطأ",
          description: "يجب تسجيل الدخول أولاً",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return { success: false };
      }

      const submitFormData = new FormData();
      submitFormData.append("name", formData.name);
      submitFormData.append("description", formData.description);

      if (selectedImage) {
        submitFormData.append("image", selectedImage);
      }

      console.log("Creating subject with data:", formData);

      const response = await baseUrl.post(`/api/question-banks/${id}/subjects`, submitFormData, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      console.log("Create Subject API Response:", response.data);

      toast({
        title: "نجح",
        description: "تم إنشاء المادة بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error creating subject:", error);

      const errorMessage = error.response?.data?.message || "حدث خطأ في إنشاء المادة";
      toast({
        title: "خطأ",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return { success: false, error: errorMessage };
    } finally {
      setSubmitLoading(false);
    }
  };

  // Update subject
  const updateSubject = async (formData) => {
    try {
      setEditLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "خطأ",
          description: "يجب تسجيل الدخول أولاً",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return { success: false };
      }

      const submitFormData = new FormData();
      submitFormData.append("name", formData.name);
      submitFormData.append("description", formData.description);

      if (selectedImage) {
        submitFormData.append("image", selectedImage);
      }

      console.log("Updating subject:", editingSubject.id);

      const response = await baseUrl.put(`/api/subjects/${editingSubject.id}`, submitFormData, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      console.log("Update Subject API Response:", response.data);

      toast({
        title: "نجح",
        description: "تم تحديث المادة بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error updating subject:", error);

      const errorMessage = error.response?.data?.message || "حدث خطأ في تحديث المادة";
      toast({
        title: "خطأ",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return { success: false, error: errorMessage };
    } finally {
      setEditLoading(false);
    }
  };

  // Delete subject
  const deleteSubject = async () => {
    try {
      setDeleteLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "خطأ",
          description: "يجب تسجيل الدخول أولاً",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return { success: false };
      }

      console.log("Deleting subject:", deletingSubject.id);

      const response = await baseUrl.delete(`/api/subjects/${deletingSubject.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      console.log("Delete Subject API Response:", response.data);

      toast({
        title: "نجح",
        description: "تم حذف المادة بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error deleting subject:", error);

      const errorMessage = error.response?.data?.message || "حدث خطأ في حذف المادة";
      toast({
        title: "خطأ",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return { success: false, error: errorMessage };
    } finally {
      setDeleteLoading(false);
    }
  };

  // Create new chapter (داخل كتاب — الطريقة المفضلة)
  const createChapter = async (data) => {
    const bookId = subjectForNewChapter?.activeBookId;
    const subjectId = subjectForNewChapter?.id;
    if (!bookId && !subjectId) return { success: false };

    try {
      setChapterSubmitLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast({ title: "خطأ", description: "يجب تسجيل الدخول أولاً", status: "error", duration: 3000, isClosable: true });
        return { success: false };
      }
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("description", data.description || "");
      if (chapterSelectedImage) fd.append("image", chapterSelectedImage);

      const url = bookId
        ? `/api/books/${bookId}/chapters`
        : `/api/subjects/${subjectId}/chapters`;

      const response = await baseUrl.post(url, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      if (response.status === 202) {
        toast({
          title: "بانتظار موافقة الأدمن",
          description: response.data?.message,
          status: "info",
          duration: 5000,
          isClosable: true,
        });
        return { success: true, pending: true };
      }
      if (response.data) {
        toast({ title: "نجح", description: "تم إنشاء الفصل بنجاح", status: "success", duration: 3000, isClosable: true });
        return { success: true, data: response.data };
      }
    } catch (error) {
      const msg = error.response?.data?.message || "حدث خطأ في إنشاء الفصل";
      toast({ title: "خطأ", description: msg, status: "error", duration: 3000, isClosable: true });
      return { success: false };
    } finally {
      setChapterSubmitLoading(false);
    }
    return { success: false };
  };

  // Update chapter
  const updateChapter = async (data) => {
    if (!editingChapter?.id) return { success: false };
    try {
      setChapterEditLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast({ title: "خطأ", description: "يجب تسجيل الدخول أولاً", status: "error", duration: 3000, isClosable: true });
        return { success: false };
      }
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("description", data.description || "");
      if (editChapterSelectedImage) fd.append("image", editChapterSelectedImage);
      const response = await baseUrl.put(`/api/chapters/${editingChapter.id}`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      if (response.data) {
        toast({ title: "نجح", description: "تم تحديث الفصل بنجاح", status: "success", duration: 3000, isClosable: true });
        return { success: true, data: response.data };
      }
    } catch (error) {
      const msg = error.response?.data?.message || "حدث خطأ في تحديث الفصل";
      toast({ title: "خطأ", description: msg, status: "error", duration: 3000, isClosable: true });
      return { success: false };
    } finally {
      setChapterEditLoading(false);
    }
    return { success: false };
  };

  // Delete chapter
  const deleteChapter = async () => {
    if (!deletingChapter?.id) return { success: false };
    try {
      setChapterDeleteLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast({ title: "خطأ", description: "يجب تسجيل الدخول أولاً", status: "error", duration: 3000, isClosable: true });
        return { success: false };
      }
      await baseUrl.delete(`/api/chapters/${deletingChapter.id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: "نجح", description: "تم حذف الفصل بنجاح", status: "success", duration: 3000, isClosable: true });
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || "حدث خطأ في حذف الفصل";
      toast({ title: "خطأ", description: msg, status: "error", duration: 3000, isClosable: true });
      return { success: false };
    } finally {
      setChapterDeleteLoading(false);
    }
    return { success: false };
  };

  // Load data on component mount
  useEffect(() => {
    fetchQuestionBankData();
  }, [id]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle edit form input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب ملء اسم المادة",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const result = await createSubject(formData);

    if (result.success) {
      onClose();
      resetForm();
      fetchQuestionBankData(); // Refresh data
    }
  };

  // Handle edit submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editFormData.name) {
      toast({
        title: "خطأ في البيانات",
        description: "يجب ملء اسم المادة",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const result = await updateSubject(editFormData);

    if (result.success) {
      onEditClose();
      resetEditForm();
      fetchQuestionBankData(); // Refresh data
    }
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    const result = await deleteSubject();

    if (result.success) {
      onDeleteClose();
      setDeletingSubject(null);
      fetchQuestionBankData(); // Refresh data
    }
  };

  // Reset forms
  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setSelectedImage(null);
    setImagePreview(null);
  };

  const resetEditForm = () => {
    setEditFormData({ name: '', description: '' });
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Handle edit button click
  const handleEditClick = (subject) => {
    setEditingSubject(subject);
    setEditFormData({
      name: subject.name,
      description: subject.description || ''
    });
    setImagePreview(subject.image_url);
    onEditOpen();
  };

  // Handle delete button click
  const handleDeleteClick = (subject) => {
    setDeletingSubject(subject);
    onDeleteOpen();
  };

  // Chapter form handlers
  const handleChapterInputChange = (e) => {
    const { name, value } = e.target;
    setChapterFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleChapterEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditChapterFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleChapterImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setChapterSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setChapterImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const removeChapterImage = () => {
    setChapterSelectedImage(null);
    setChapterImagePreview(null);
  };
  const handleChapterEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditChapterSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditChapterImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const removeChapterEditImage = () => {
    setEditChapterSelectedImage(null);
    setEditChapterImagePreview(editingChapter?.image_url || null);
  };
  const openAddChapter = (subject) => {
    setSubjectForNewChapter(subject);
    setChapterFormData({ name: '', description: '' });
    setChapterSelectedImage(null);
    setChapterImagePreview(null);
    onChapterAddOpen();
  };
  const handleChapterEditClick = (chapter) => {
    setEditingChapter(chapter);
    setEditChapterFormData({ name: chapter.name, description: chapter.description || '' });
    setEditChapterImagePreview(chapter.image_url || null);
    setEditChapterSelectedImage(null);
    onChapterEditOpen();
  };
  const handleChapterDeleteClick = (chapter) => {
    setDeletingChapter(chapter);
    onChapterDeleteOpen();
  };
  const resetChapterForm = () => {
    setChapterFormData({ name: '', description: '' });
    setChapterSelectedImage(null);
    setChapterImagePreview(null);
  };
  const resetChapterEditForm = () => {
    setEditChapterFormData({ name: '', description: '' });
    setEditChapterSelectedImage(null);
    setEditChapterImagePreview(editingChapter?.image_url || null);
  };
  const handleChapterSubmit = async (e) => {
    e.preventDefault();
    if (!chapterFormData.name) {
      toast({ title: "خطأ", description: "يجب ملء اسم الفصل", status: "error", duration: 3000, isClosable: true });
      return;
    }
    const result = await createChapter(chapterFormData);
    if (result.success) {
      onChapterAddClose();
      setSubjectForNewChapter(null);
      resetChapterForm();
      fetchQuestionBankData();
    }
  };
  const handleChapterEditSubmit = async (e) => {
    e.preventDefault();
    if (!editChapterFormData.name) {
      toast({ title: "خطأ", description: "يجب ملء اسم الفصل", status: "error", duration: 3000, isClosable: true });
      return;
    }
    const result = await updateChapter(editChapterFormData);
    if (result.success) {
      onChapterEditClose();
      setEditingChapter(null);
      resetChapterEditForm();
      fetchQuestionBankData();
    }
  };
  const handleChapterDeleteConfirm = async () => {
    const result = await deleteChapter();
    if (result.success) {
      onChapterDeleteClose();
      setDeletingChapter(null);
      fetchQuestionBankData();
    }
  };

  // Create new lesson (للفصل المحدد)
  const createLesson = async (data) => {
    if (!chapterForNewLesson?.id) return { success: false };
    try {
      setLessonSubmitLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast({ title: "خطأ", description: "يجب تسجيل الدخول أولاً", status: "error", duration: 3000, isClosable: true });
        return { success: false };
      }
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("description", data.description || "");
      if (lessonSelectedImage) fd.append("image", lessonSelectedImage);
      const response = await baseUrl.post(`/api/chapters/${chapterForNewLesson.id}/lessons`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      if (response.data) {
        toast({ title: "نجح", description: "تم إنشاء الدرس بنجاح", status: "success", duration: 3000, isClosable: true });
        return { success: true, data: response.data };
      }
    } catch (error) {
      const msg = error.response?.data?.message || "حدث خطأ في إنشاء الدرس";
      toast({ title: "خطأ", description: msg, status: "error", duration: 3000, isClosable: true });
      return { success: false };
    } finally {
      setLessonSubmitLoading(false);
    }
    return { success: false };
  };

  // Update lesson
  const updateLesson = async (data) => {
    if (!editingLesson?.id) return { success: false };
    try {
      setLessonEditLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast({ title: "خطأ", description: "يجب تسجيل الدخول أولاً", status: "error", duration: 3000, isClosable: true });
        return { success: false };
      }
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("description", data.description || "");
      if (editLessonSelectedImage) fd.append("image", editLessonSelectedImage);
      const response = await baseUrl.put(`/api/lessons/${editingLesson.id}`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      if (response.data) {
        toast({ title: "نجح", description: "تم تحديث الدرس بنجاح", status: "success", duration: 3000, isClosable: true });
        return { success: true, data: response.data };
      }
    } catch (error) {
      const msg = error.response?.data?.message || "حدث خطأ في تحديث الدرس";
      toast({ title: "خطأ", description: msg, status: "error", duration: 3000, isClosable: true });
      return { success: false };
    } finally {
      setLessonEditLoading(false);
    }
    return { success: false };
  };

  // Delete lesson
  const deleteLesson = async () => {
    if (!deletingLesson?.id) return { success: false };
    try {
      setLessonDeleteLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast({ title: "خطأ", description: "يجب تسجيل الدخول أولاً", status: "error", duration: 3000, isClosable: true });
        return { success: false };
      }
      await baseUrl.delete(`/api/lessons/${deletingLesson.id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: "نجح", description: "تم حذف الدرس بنجاح", status: "success", duration: 3000, isClosable: true });
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || "حدث خطأ في حذف الدرس";
      toast({ title: "خطأ", description: msg, status: "error", duration: 3000, isClosable: true });
      return { success: false };
    } finally {
      setLessonDeleteLoading(false);
    }
    return { success: false };
  };

  // Lesson form handlers
  const handleLessonInputChange = (e) => {
    const { name, value } = e.target;
    setLessonFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleLessonEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditLessonFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleLessonImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLessonSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setLessonImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const removeLessonImage = () => {
    setLessonSelectedImage(null);
    setLessonImagePreview(null);
  };
  const handleLessonEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditLessonSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditLessonImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };
  const removeLessonEditImage = () => {
    setEditLessonSelectedImage(null);
    setEditLessonImagePreview(editingLesson?.image_url || null);
  };
  const openAddLesson = (chapter) => {
    setChapterForNewLesson(chapter);
    setLessonFormData({ name: '', description: '' });
    setLessonSelectedImage(null);
    setLessonImagePreview(null);
    onLessonAddOpen();
  };
  const handleLessonEditClick = (lesson) => {
    setEditingLesson(lesson);
    setEditLessonFormData({ name: lesson.name, description: lesson.description || '' });
    setEditLessonImagePreview(lesson.image_url || null);
    setEditLessonSelectedImage(null);
    onLessonEditOpen();
  };
  const handleLessonDeleteClick = (lesson) => {
    setDeletingLesson(lesson);
    onLessonDeleteOpen();
  };
  const resetLessonForm = () => {
    setLessonFormData({ name: '', description: '' });
    setLessonSelectedImage(null);
    setLessonImagePreview(null);
  };
  const resetLessonEditForm = () => {
    setEditLessonFormData({ name: '', description: '' });
    setEditLessonSelectedImage(null);
    setEditLessonImagePreview(editingLesson?.image_url || null);
  };
  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    if (!lessonFormData.name) {
      toast({ title: "خطأ", description: "يجب ملء اسم الدرس", status: "error", duration: 3000, isClosable: true });
      return;
    }
    const result = await createLesson(lessonFormData);
    if (result.success) {
      onLessonAddClose();
      setChapterForNewLesson(null);
      resetLessonForm();
      fetchQuestionBankData();
    }
  };
  const handleLessonEditSubmit = async (e) => {
    e.preventDefault();
    if (!editLessonFormData.name) {
      toast({ title: "خطأ", description: "يجب ملء اسم الدرس", status: "error", duration: 3000, isClosable: true });
      return;
    }
    const result = await updateLesson(editLessonFormData);
    if (result.success) {
      onLessonEditClose();
      setEditingLesson(null);
      resetLessonEditForm();
      fetchQuestionBankData();
    }
  };
  const handleLessonDeleteConfirm = async () => {
    const result = await deleteLesson();
    if (result.success) {
      onLessonDeleteClose();
      setDeletingLesson(null);
      fetchQuestionBankData();
    }
  };

  // Filter subjects based on search
  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (subject.description && subject.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getSubjectStats = (subject) => {
    const booksCount = countSubjectBooks(subject);
    const chaptersCount = countSubjectChapters(subject);
    const lessonsCount = countSubjectLessons(subject);
    const books = getSubjectBooks(subject);
    const questionsCount = books.reduce((total, book) => {
      return (
        total +
        (book.chapters || []).reduce((chTotal, chapter) => {
          const chapterQuestions =
            chapter.questions_count || chapter.question_count || chapter.questions?.length || 0;
          const lessonQuestions = (chapter.lessons || []).reduce(
            (sum, lesson) =>
              sum + (lesson.questions_count || lesson.question_count || lesson.questions?.length || 0),
            0,
          );
          return chTotal + chapterQuestions + lessonQuestions;
        }, 0)
      );
    }, 0);
    const explicitProgress = Number(subject.progress || subject.completion_percentage);
    const calculatedProgress = Math.min(
      100,
      Math.max(25, Math.round(booksCount * 8 + chaptersCount * 12 + lessonsCount * 7 + questionsCount * 1.5)),
    );

    return {
      booksCount,
      chaptersCount,
      lessonsCount,
      questionsCount,
      progress: Number.isFinite(explicitProgress) && explicitProgress > 0 ? explicitProgress : calculatedProgress,
    };
  };

  const bankStats = filteredSubjects.reduce(
    (totals, subject) => {
      const stats = getSubjectStats(subject);
      return {
        books: totals.books + stats.booksCount,
        chapters: totals.chapters + stats.chaptersCount,
        lessons: totals.lessons + stats.lessonsCount,
        questions: totals.questions + stats.questionsCount,
        progress: totals.progress + stats.progress,
      };
    },
    { books: 0, chapters: 0, lessons: 0, questions: 0, progress: 0 },
  );
  const averageProgress = filteredSubjects.length
    ? Math.round(bankStats.progress / filteredSubjects.length)
    : 0;

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const activeSubject = filteredSubjects.find(s => s.id === activeSubjectId) || filteredSubjects[0];
  const activeChapter = activeSubject?.chapters?.find(c => c.id === activeChapterId) || activeSubject?.chapters?.[0];

  if (loading) {
    return (
      <Flex minH="100vh" bg={bgColor} justify="center" align="center">
        <VStack spacing={4} p={8} bg={cardBg} borderRadius="xl" shadow="sm">
          <Spinner size="xl" color="blue.500" thickness="3px" />
          <Text color="gray.700" fontWeight="600">جاري تحميل بنك الأسئلة...</Text>
        </VStack>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex minH="100vh" bg={bgColor} justify="center" align="center" p={4}>
        <Box textAlign="center" p={8} bg={cardBg} borderRadius="xl" shadow="sm" maxW="md">
          <Icon as={FiX} color="red.500" boxSize={16} mb={4} />
          <Heading size="md" color="gray.700" mb={2}>فشل تحميل البيانات</Heading>
          <Text color="gray.600">{error}</Text>
        </Box>
      </Flex>
    );
  }

  if (!questionBank) {
    return (
      <Flex minH="100vh" bg={pageBg} justify="center" align="center" p={4}>
        <Box textAlign="center" p={8} bg={cardBackground} borderRadius="2xl" boxShadow={cardShadow} borderWidth="2px" borderColor={cardBorder} maxW="md">
          <Box w="16" h="16" mx="auto" mb={4} borderRadius="full" bg={iconBg} display="flex" alignItems="center" justifyContent="center">
            <Icon as={FiBook} color={buttonPrimary} boxSize={8} />
          </Box>
          <Heading size="md" color={textPrimary} mb={2} fontFamily="'Cairo', 'Tajawal', sans-serif">بنك الأسئلة غير موجود</Heading>
          <Text color={textSecondary}>لم يتم العثور على بنك الأسئلة المطلوب.</Text>
        </Box>
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg="#f5f7fb" w="full" overflowX="hidden" dir="rtl" pb={{ base: 24, md: 16 }}>
      <MotionBox
        p={{ base: 4, md: 6, lg: 8 }}
        maxW="1180px"
        mx="auto"
        w="full"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Flex justify="flex-end" align="center" mb={4} color="gray.500" fontSize="xs" gap={2}>
          <Text>الرئيسية</Text>
          <Text>/</Text>
          <Text>بنوك الأسئلة</Text>
          <Text>/</Text>
          <Text color="blue.500" fontWeight="bold">{questionBank.name}</Text>
        </Flex>

        <MotionBox
          variants={itemVariants}
          bg="#dcecff"
          p={{ base: 5, md: 7 }}
          borderRadius="2xl"
          mb={5}
          position="relative"
          overflow="hidden"
        >
          <Box position="absolute" inset={0} bg="linear-gradient(135deg, rgba(49,130,206,0.16), rgba(237,137,54,0.08))" />
          <Flex position="relative" zIndex={1} justify="space-between" align="center" gap={6} direction={{ base: "column", md: "row" }}>
            <Box textAlign={{ base: "center", md: "right" }} flex={1}>
              <Heading size={{ base: "md", md: "lg" }} color="gray.900" fontWeight="black" mb={2}>
                {questionBank.name}
              </Heading>
              <Text color="gray.600" fontSize="sm" lineHeight="1.9" maxW="760px">
                {questionBank.description || "نظرة عامة على محتوى بنك الأسئلة والمواد المرتبطة به داخل المنصة."}
              </Text>
            </Box>

            <Box bg="whiteAlpha.900" borderRadius="xl" px={6} py={4} minW="150px" boxShadow="0 14px 35px rgba(37,99,235,0.12)">
              <Text color="gray.500" fontSize="xs" mb={1}>نسبة الإنجاز</Text>
              <HStack justify="center" spacing={2}>
                <Text color="blue.600" fontWeight="black" fontSize="2xl">{averageProgress}%</Text>
                <Flex w={8} h={8} borderRadius="lg" bg="blue.50" color="blue.500" align="center" justify="center">
                  <Icon as={FiBook} />
                </Flex>
              </HStack>
            </Box>
          </Flex>
        </MotionBox>

        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4} mb={5}>
          {[
            { label: "مواد دراسية", value: filteredSubjects.length, icon: FiBook, color: "blue" },
            { label: "كتب", value: bankStats.books, icon: FiBook, color: "purple" },
            { label: "فصول", value: bankStats.chapters, icon: FiFolder, color: "orange" },
            { label: "دروس", value: bankStats.lessons, icon: FiFileText, color: "blue" },
            { label: "أسئلة", value: bankStats.questions, icon: FiGrid, color: "orange" },
          ].map((item) => (
            <Box key={item.label} bg="white" borderRadius="xl" p={4} border="1px solid" borderColor="gray.100" boxShadow="0 12px 32px rgba(15,23,42,0.04)">
              <Flex justify="space-between" align="center">
                <Box>
                  <Text color="gray.500" fontSize="xs" mb={1}>{item.label}</Text>
                  <Text color="gray.900" fontWeight="black" fontSize="xl">{item.value}</Text>
                </Box>
                <Flex w={10} h={10} borderRadius="lg" bg={`${item.color}.50`} color={`${item.color}.500`} align="center" justify="center">
                  <Icon as={item.icon} />
                </Flex>
              </Flex>
            </Box>
          ))}
        </SimpleGrid>

        <Flex direction={{ base: "column", md: "row" }} gap={3} justify="space-between" align={{ base: "stretch", md: "center" }} mb={5}>
          <InputGroup maxW={{ base: "full", md: "360px" }}>
            <InputLeftElement pointerEvents="none" height="full">
              <Icon as={FiSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="ابحث عن مادة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg="white"
              borderColor="gray.200"
              borderRadius="xl"
              h="44px"
              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 3px rgba(49,130,206,0.12)" }}
            />
          </InputGroup>
          <Button
            leftIcon={<FiPlus />}
            bg="blue.500"
            color="white"
            borderRadius="xl"
            onClick={onOpen}
            _hover={{ bg: "blue.600", transform: "translateY(-2px)", boxShadow: buttonHoverShadow }}
          >
            إضافة مادة جديدة
          </Button>
        </Flex>

        {filteredSubjects.length === 0 ? (
          <MotionBox
            variants={itemVariants}
            textAlign="center"
            py={14}
            px={6}
            bg="white"
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="gray.100"
            boxShadow="0 16px 42px rgba(15,23,42,0.05)"
          >
            <Flex w="80px" h="80px" bg="blue.50" borderRadius="full" align="center" justify="center" mx="auto" mb={5}>
              <Icon as={FiBook} color="blue.500" boxSize={9} />
            </Flex>
            <Heading size="md" color="gray.800" mb={2}>
              {searchTerm ? "لا توجد نتائج للبحث" : "لا توجد مواد دراسية بعد"}
            </Heading>
            <Text color="gray.500" fontSize="sm" mb={6}>
              {searchTerm ? "جرب كلمات بحث أخرى" : "ابدأ بإضافة أول مادة داخل بنك الأسئلة."}
            </Text>
            {!searchTerm && (
              <Button bg="blue.500" color="white" leftIcon={<FiPlus />} onClick={onOpen} _hover={{ bg: "blue.600" }}>
                إضافة أول مادة
              </Button>
            )}
          </MotionBox>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={5}>
            {filteredSubjects.map((subject) => {
              const stats = getSubjectStats(subject);
              const isHighProgress = stats.progress >= 75;
              const accent = isHighProgress ? "blue" : "orange";

              return (
                <MotionBox
                  key={subject.id}
                  variants={itemVariants}
                  bg="white"
                  borderRadius="2xl"
                  border="1px solid"
                  borderColor={`${accent}.300`}
                  borderRightWidth="3px"
                  p={5}
                  minH="235px"
                  boxShadow="0 16px 42px rgba(15,23,42,0.05)"
                  transition="all 0.24s ease"
                  _hover={{
                    transform: "translateY(-5px)",
                    boxShadow: `0 22px 54px ${isHighProgress ? "rgba(37,99,235,0.14)" : "rgba(234,88,12,0.14)"}`,
                  }}
                >
                  <Flex justify="space-between" align="start" mb={4}>
                    <Box
                      w="42px"
                      h="42px"
                      borderRadius="full"
                      display="grid"
                      placeItems="center"
                      bg={`conic-gradient(var(--chakra-colors-${accent}-500) ${stats.progress * 3.6}deg, #eef2f7 0deg)`}
                    >
                      <Flex w="32px" h="32px" borderRadius="full" bg="white" align="center" justify="center">
                        <Text color={`${accent}.500`} fontWeight="black" fontSize="9px">{stats.progress}%</Text>
                      </Flex>
                    </Box>
                    <Flex w={10} h={10} borderRadius="lg" bg={`${accent}.50`} color={`${accent}.500`} align="center" justify="center">
                      <Icon as={FiBook} />
                    </Flex>
                  </Flex>

                  <Heading size="sm" color="gray.900" fontWeight="black" mb={3} noOfLines={1}>
                    {subject.name}
                  </Heading>

                  <VStack align="stretch" spacing={1.5} color="gray.500" fontSize="xs" mb={4}>
                    <HStack spacing={2}>
                      <Icon as={FiBook} color={`${accent}.500`} />
                      <Text>{stats.booksCount} كتاب</Text>
                    </HStack>
                    <HStack spacing={2}>
                      <Icon as={FiFolder} color={`${accent}.500`} />
                      <Text>{stats.chaptersCount} فصل</Text>
                    </HStack>
                    <HStack spacing={2}>
                      <Icon as={FiFileText} color={`${accent}.500`} />
                      <Text>{stats.lessonsCount} درس</Text>
                    </HStack>
                    <HStack spacing={2}>
                      <Icon as={FiGrid} color={`${accent}.500`} />
                      <Text>{stats.questionsCount} سؤال</Text>
                    </HStack>
                  </VStack>

                  <Box h="8px" bg="gray.100" borderRadius="full" overflow="hidden" mb={4}>
                    <Box h="full" w={`${stats.progress}%`} bg={`${accent}.500`} borderRadius="full" />
                  </Box>

                  <Flex gap={2}>
                    <Link to={`/question-bank/subject/${subject.id}`} style={{ flex: 1, textDecoration: "none" }}>
                      <Button
                        w="full"
                        h="34px"
                        size="sm"
                        bg="blue.100"
                        color="blue.700"
                        borderRadius="lg"
                        _hover={{ bg: "blue.500", color: "white" }}
                      >
                        إدارة المحتوى
                      </Button>
                    </Link>
                    <IconButton aria-label="تعديل" icon={<FiEdit />} size="sm" variant="ghost" color="orange.500" onClick={() => handleEditClick(subject)} />
                    <IconButton aria-label="حذف" icon={<FiTrash />} size="sm" variant="ghost" color="red.400" onClick={() => handleDeleteClick(subject)} />
                  </Flex>
                </MotionBox>
              );
            })}
          </SimpleGrid>
        )}
      </MotionBox>

      <Button
        position="fixed"
        left={{ base: 4, md: 8 }}
        bottom={{ base: 4, md: 8 }}
        zIndex={20}
        bg="blue.500"
        color="white"
        h="46px"
        px={5}
        borderRadius="full"
        leftIcon={<FiPlus />}
        boxShadow="0 18px 38px rgba(37,99,235,0.28)"
        onClick={onOpen}
        _hover={{ bg: "blue.600", transform: "translateY(-2px)" }}
      >
        إضافة مادة جديدة
      </Button>
      {/* Add Subject Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(6px)" />
        <ModalContent bg={modalBg} borderRadius="2xl" borderWidth="1px" borderColor={modalBorder} boxShadow={cardShadow}>
          <ModalHeader bg={modalHeaderBg} color="white" borderRadius="2xl 2xl 0 0" py={5}>
            <HStack spacing={3}>
              <Box w="10" h="10" bg="whiteAlpha.300" borderRadius="xl" display="flex" alignItems="center" justifyContent="center">
                <FiPlus color="white" size={20} />
              </Box>
              <Text fontSize="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">إضافة مادة جديدة</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: "whiteAlpha.200" }} />

          <ModalBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel color={textPrimary} fontWeight="bold">اسم المادة</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="أدخل اسم المادة"
                    size="lg"
                    border="2px solid"
                    borderColor={inputBorder}
                    _hover={{ borderColor: inputHoverBorder }}
                    _focus={{ borderColor: inputFocusBorder, boxShadow: `0 0 0 1px ${useColorModeValue("#4299e1", "#63b3ed")}` }}
                    borderRadius="10px"
                    bg={useColorModeValue("white", "gray.700")}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="bold">وصف المادة (اختياري)</FormLabel>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="أدخل وصف المادة"
                    rows={4}
                    size="lg"
                    border="2px solid"
                    borderColor={inputBorder}
                    _hover={{ borderColor: inputHoverBorder }}
                    _focus={{ borderColor: inputFocusBorder, boxShadow: `0 0 0 1px ${useColorModeValue("#4299e1", "#63b3ed")}` }}
                    borderRadius="10px"
                    bg={useColorModeValue("white", "gray.700")}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="bold">صورة المادة (اختياري)</FormLabel>
                  <VStack spacing={4} align="stretch">
                    {!imagePreview ? (
                      <Button
                        as="label"
                        htmlFor="image-upload"
                        leftIcon={<FiUpload />}
                        variant="outline"
                        size="lg"
                        cursor="pointer"
                        border="2px solid"
                        borderColor={inputHoverBorder}
                        color={useColorModeValue("blue.500", "blue.400")}
                        _hover={{ bg: iconBg, borderColor: inputFocusBorder }}
                        borderRadius="10px"
                        fontWeight="bold"
                      >
                        اختر صورة
                      </Button>
                    ) : (
                      <Box position="relative" display="inline-block">
                        <Image
                          src={imagePreview}
                          alt="معاينة الصورة"
                          maxH="200px"
                          borderRadius="md"
                        />
                        <IconButton
                          icon={<FiX />}
                          position="absolute"
                          top={2}
                          right={2}
                          colorScheme="red"
                          size="sm"
                          onClick={removeImage}
                          aria-label="إزالة الصورة"
                        />
                      </Box>
                    )}
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      display="none"
                    />
                  </VStack>
                </FormControl>
              </VStack>
            </form>
          </ModalBody>

          <ModalFooter bg={modalFooterBg} borderRadius="0 0 2xl 2xl" py={5}>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={resetForm} color={textPrimary} _hover={{ bg: iconBg }} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">
                إعادة تعيين
              </Button>
              <Button variant="ghost" onClick={onClose} color={textPrimary} _hover={{ bg: iconBg }} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">
                إلغاء
              </Button>
              <Button bg={buttonPrimary} color="white" onClick={handleSubmit} isLoading={submitLoading} loadingText="جاري الإنشاء..." leftIcon={<FiPlus />} _hover={{ bg: buttonPrimaryHover }} boxShadow={iconShadow} borderRadius="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">
                إضافة المادة
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Subject Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl" isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(6px)" />
        <ModalContent bg={modalBg} borderRadius="2xl" borderWidth="1px" borderColor={modalBorder} boxShadow={cardShadow}>
          <ModalHeader bg={buttonSecondary} color="white" borderRadius="2xl 2xl 0 0" py={5}>
            <HStack spacing={3}>
              <Box w="10" h="10" bg="whiteAlpha.300" borderRadius="xl" display="flex" alignItems="center" justifyContent="center">
                <FiEdit color="white" size={20} />
              </Box>
              <Text fontSize="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">تعديل المادة</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: "whiteAlpha.200" }} />

          <ModalBody>
            <form onSubmit={handleEditSubmit}>
              <VStack spacing={6}>
                <FormControl isRequired>
                  <FormLabel color={textPrimary} fontWeight="bold">اسم المادة</FormLabel>
                  <Input
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    placeholder="أدخل اسم المادة"
                    size="lg"
                    border="2px solid"
                    borderColor={inputBorder}
                    _hover={{ borderColor: inputHoverBorder }}
                    _focus={{ borderColor: inputFocusBorder, boxShadow: `0 0 0 1px ${useColorModeValue("#4299e1", "#63b3ed")}` }}
                    borderRadius="10px"
                    bg={useColorModeValue("white", "gray.700")}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="bold">وصف المادة (اختياري)</FormLabel>
                  <Textarea
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditInputChange}
                    placeholder="أدخل وصف المادة"
                    rows={4}
                    size="lg"
                    border="2px solid"
                    borderColor={inputBorder}
                    _hover={{ borderColor: inputHoverBorder }}
                    _focus={{ borderColor: inputFocusBorder, boxShadow: `0 0 0 1px ${useColorModeValue("#4299e1", "#63b3ed")}` }}
                    borderRadius="10px"
                    bg={useColorModeValue("white", "gray.700")}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="bold">صورة المادة (اختياري)</FormLabel>
                  <VStack spacing={4} align="stretch">
                    {!imagePreview ? (
                      <Button
                        as="label"
                        htmlFor="edit-image-upload"
                        leftIcon={<FiUpload />}
                        variant="outline"
                        size="lg"
                        cursor="pointer"
                        border="2px solid"
                        borderColor={inputHoverBorder}
                        color={useColorModeValue("blue.500", "blue.400")}
                        _hover={{ bg: iconBg, borderColor: inputFocusBorder }}
                        borderRadius="10px"
                        fontWeight="bold"
                      >
                        اختر صورة
                      </Button>
                    ) : (
                      <Box position="relative" display="inline-block">
                        <Image
                          src={imagePreview}
                          alt="معاينة الصورة"
                          maxH="200px"
                          borderRadius="md"
                        />
                        <IconButton
                          icon={<FiX />}
                          position="absolute"
                          top={2}
                          right={2}
                          colorScheme="red"
                          size="sm"
                          onClick={removeImage}
                          aria-label="إزالة الصورة"
                        />
                      </Box>
                    )}
                    <Input
                      id="edit-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      display="none"
                    />
                  </VStack>
                </FormControl>
              </VStack>
            </form>
          </ModalBody>

          <ModalFooter bg={modalFooterBg} borderRadius="0 0 2xl 2xl" py={5}>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={resetEditForm} color={textPrimary} _hover={{ bg: iconBg }} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">
                إعادة تعيين
              </Button>
              <Button variant="ghost" onClick={onEditClose} color={textPrimary} _hover={{ bg: iconBg }} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">
                إلغاء
              </Button>
              <Button bg={buttonSecondary} color="white" onClick={handleEditSubmit} isLoading={editLoading} loadingText="جاري التحديث..." leftIcon={<FiEdit />} _hover={{ bg: buttonSecondaryHover }} boxShadow={iconShadow} borderRadius="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">
                تحديث المادة
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="md" isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent bg={cardBackground} borderRadius="2xl" borderWidth="1px" borderColor={cardBorder} boxShadow={cardShadow}>
          <ModalHeader borderBottomWidth="1px" borderColor={borderColor} py={5}>
            <HStack spacing={3}>
              <Box w="10" h="10" bg={useColorModeValue("red.50", "red.900")} borderRadius="xl" display="flex" alignItems="center" justifyContent="center">
                <Icon as={FiTrash} color="red.500" boxSize={5} />
              </Box>
              <Text fontFamily="'Cairo', 'Tajawal', sans-serif" fontWeight="bold" color={textPrimary}>تأكيد الحذف</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <VStack spacing={4} align="stretch" textAlign="center">
              <Box w="16" h="16" mx="auto" borderRadius="full" bg={useColorModeValue("red.50", "red.900")} display="flex" alignItems="center" justifyContent="center">
                <Icon as={FiBook} color="red.500" boxSize={8} />
              </Box>
              <Text fontSize="md" fontWeight="600" color={textPrimary} fontFamily="'Cairo', 'Tajawal', sans-serif">
                هل أنت متأكد من حذف المادة؟
              </Text>
              <Text fontSize="sm" color={textSecondary} fontFamily="'Cairo', 'Tajawal', sans-serif">
                "{deletingSubject?.name}"
              </Text>
              <Text fontSize="xs" color={textSecondary}>
                هذا الإجراء لا يمكن التراجع عنه
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor={borderColor} py={4}>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onDeleteClose} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">
                إلغاء
              </Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} isLoading={deleteLoading} loadingText="جاري الحذف..." leftIcon={<FiTrash />} borderRadius="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">
                حذف المادة
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Chapter Modal */}
      <Modal isOpen={isChapterAddOpen} onClose={onChapterAddClose} size="xl" isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(6px)" />
        <ModalContent bg={modalBg} borderRadius="2xl" borderWidth="1px" borderColor={modalBorder} boxShadow={cardShadow}>
          <ModalHeader bg={modalHeaderBg} color="white" borderRadius="2xl 2xl 0 0" py={5}>
            <HStack spacing={3}>
              <Box w="10" h="10" bg="whiteAlpha.300" borderRadius="xl" display="flex" alignItems="center" justifyContent="center">
                <Icon as={FiFolder} color="white" boxSize={5} />
              </Box>
              <Text fontSize="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">
                إضافة فصل جديد {subjectForNewChapter && `(${subjectForNewChapter.name})`}
              </Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: "whiteAlpha.200" }} />
          <ModalBody py={6}>
            <form onSubmit={handleChapterSubmit} id="chapter-add-form">
              <VStack spacing={5}>
                <FormControl isRequired>
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">اسم الفصل</FormLabel>
                  <Input name="name" value={chapterFormData.name} onChange={handleChapterInputChange} placeholder="أدخل اسم الفصل" size="lg" borderWidth="2px" borderColor={inputBorder} _hover={{ borderColor: inputHoverBorder }} _focus={{ borderColor: inputFocusBorder, boxShadow: focusRingShadow }} borderRadius="lg" bg={useColorModeValue("white", "gray.700")} fontFamily="'Cairo', 'Tajawal', sans-serif" />
                </FormControl>
                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">وصف الفصل (اختياري)</FormLabel>
                  <Textarea name="description" value={chapterFormData.description} onChange={handleChapterInputChange} placeholder="أدخل وصف الفصل" rows={3} size="lg" borderWidth="2px" borderColor={inputBorder} _hover={{ borderColor: inputHoverBorder }} _focus={{ borderColor: inputFocusBorder, boxShadow: focusRingShadow }} borderRadius="lg" bg={useColorModeValue("white", "gray.700")} fontFamily="'Cairo', 'Tajawal', sans-serif" />
                </FormControl>
                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">صورة الفصل (اختياري)</FormLabel>
                  <VStack align="stretch" spacing={3}>
                    {!chapterImagePreview ? (
                      <Button as="label" htmlFor="chapter-image-upload" leftIcon={<FiUpload />} variant="outline" size="md" cursor="pointer" borderWidth="2px" borderColor={inputHoverBorder} color={searchIconColor} _hover={{ bg: iconBg, borderColor: inputFocusBorder }} borderRadius="lg" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">
                        اختر صورة
                      </Button>
                    ) : (
                      <Box position="relative" display="inline-block">
                        <Image src={chapterImagePreview} alt="معاينة" maxH="160px" borderRadius="md" />
                        <IconButton icon={<FiX />} position="absolute" top={2} right={2} colorScheme="red" size="sm" onClick={removeChapterImage} aria-label="إزالة الصورة" />
                      </Box>
                    )}
                    <Input id="chapter-image-upload" type="file" accept="image/*" onChange={handleChapterImageChange} display="none" />
                  </VStack>
                </FormControl>
              </VStack>
            </form>
          </ModalBody>
          <ModalFooter bg={modalFooterBg} borderRadius="0 0 2xl 2xl" py={5}>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={resetChapterForm} color={textPrimary} _hover={{ bg: iconBg }} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">إعادة تعيين</Button>
              <Button variant="ghost" onClick={onChapterAddClose} color={textPrimary} _hover={{ bg: iconBg }} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">إلغاء</Button>
              <Button type="submit" form="chapter-add-form" bg={buttonPrimary} color="white" onClick={handleChapterSubmit} isLoading={chapterSubmitLoading} loadingText="جاري الإنشاء..." leftIcon={<FiPlus />} _hover={{ bg: buttonPrimaryHover }} boxShadow={iconShadow} borderRadius="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">
                إضافة الفصل
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Chapter Modal */}
      <Modal isOpen={isChapterEditOpen} onClose={onChapterEditClose} size="xl" isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(6px)" />
        <ModalContent bg={modalBg} borderRadius="2xl" borderWidth="1px" borderColor={modalBorder} boxShadow={cardShadow}>
          <ModalHeader bg={buttonSecondary} color="white" borderRadius="2xl 2xl 0 0" py={5}>
            <HStack spacing={3}>
              <Box w="10" h="10" bg="whiteAlpha.300" borderRadius="xl" display="flex" alignItems="center" justifyContent="center">
                <Icon as={FiEdit} color="white" boxSize={5} />
              </Box>
              <Text fontSize="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">تعديل الفصل</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: "whiteAlpha.200" }} />
          <ModalBody py={6}>
            <form onSubmit={handleChapterEditSubmit} id="chapter-edit-form">
              <VStack spacing={5}>
                <FormControl isRequired>
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">اسم الفصل</FormLabel>
                  <Input name="name" value={editChapterFormData.name} onChange={handleChapterEditInputChange} placeholder="أدخل اسم الفصل" size="lg" borderWidth="2px" borderColor={inputBorder} _hover={{ borderColor: inputHoverBorder }} _focus={{ borderColor: inputFocusBorder, boxShadow: focusRingShadow }} borderRadius="lg" bg={useColorModeValue("white", "gray.700")} fontFamily="'Cairo', 'Tajawal', sans-serif" />
                </FormControl>
                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">وصف الفصل (اختياري)</FormLabel>
                  <Textarea name="description" value={editChapterFormData.description} onChange={handleChapterEditInputChange} placeholder="أدخل وصف الفصل" rows={3} size="lg" borderWidth="2px" borderColor={inputBorder} _hover={{ borderColor: inputHoverBorder }} _focus={{ borderColor: inputFocusBorder, boxShadow: focusRingShadow }} borderRadius="lg" bg={useColorModeValue("white", "gray.700")} fontFamily="'Cairo', 'Tajawal', sans-serif" />
                </FormControl>
                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">صورة الفصل (اختياري)</FormLabel>
                  <VStack align="stretch" spacing={3}>
                    {!editChapterImagePreview ? (
                      <Button as="label" htmlFor="chapter-edit-image-upload" leftIcon={<FiUpload />} variant="outline" size="md" cursor="pointer" borderWidth="2px" borderColor={inputHoverBorder} color={searchIconColor} _hover={{ bg: iconBg, borderColor: inputFocusBorder }} borderRadius="lg" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">
                        اختر صورة
                      </Button>
                    ) : (
                      <Box position="relative" display="inline-block">
                        <Image src={editChapterImagePreview} alt="معاينة" maxH="160px" borderRadius="md" />
                        <IconButton icon={<FiX />} position="absolute" top={2} right={2} colorScheme="red" size="sm" onClick={removeChapterEditImage} aria-label="إزالة الصورة" />
                      </Box>
                    )}
                    <Input id="chapter-edit-image-upload" type="file" accept="image/*" onChange={handleChapterEditImageChange} display="none" />
                  </VStack>
                </FormControl>
              </VStack>
            </form>
          </ModalBody>
          <ModalFooter bg={modalFooterBg} borderRadius="0 0 2xl 2xl" py={5}>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={resetChapterEditForm} color={textPrimary} _hover={{ bg: iconBg }} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">إعادة تعيين</Button>
              <Button variant="ghost" onClick={onChapterEditClose} color={textPrimary} _hover={{ bg: iconBg }} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">إلغاء</Button>
              <Button type="submit" form="chapter-edit-form" bg={buttonSecondary} color="white" onClick={handleChapterEditSubmit} isLoading={chapterEditLoading} loadingText="جاري التحديث..." leftIcon={<FiEdit />} _hover={{ bg: buttonSecondaryHover }} boxShadow={iconShadow} borderRadius="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">
                تحديث الفصل
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Chapter Modal */}
      <Modal isOpen={isChapterDeleteOpen} onClose={onChapterDeleteClose} size="md" isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent bg={cardBackground} borderRadius="2xl" borderWidth="1px" borderColor={cardBorder} boxShadow={cardShadow}>
          <ModalHeader borderBottomWidth="1px" borderColor={borderColor} py={5}>
            <HStack spacing={3}>
              <Box w="10" h="10" bg={useColorModeValue("red.50", "red.900")} borderRadius="xl" display="flex" alignItems="center" justifyContent="center">
                <Icon as={FiTrash} color="red.500" boxSize={5} />
              </Box>
              <Text fontFamily="'Cairo', 'Tajawal', sans-serif" fontWeight="bold" color={textPrimary}>تأكيد حذف الفصل</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <VStack spacing={4} align="stretch" textAlign="center">
              <Box w="16" h="16" mx="auto" borderRadius="full" bg={useColorModeValue("red.50", "red.900")} display="flex" alignItems="center" justifyContent="center">
                <Icon as={FiFolder} color="red.500" boxSize={8} />
              </Box>
              <Text fontSize="md" fontWeight="600" color={textPrimary} fontFamily="'Cairo', 'Tajawal', sans-serif">
                هل أنت متأكد من حذف الفصل؟
              </Text>
              <Text fontSize="sm" color={textSecondary} fontFamily="'Cairo', 'Tajawal', sans-serif">"{deletingChapter?.name}"</Text>
              <Text fontSize="xs" color={textSecondary}>هذا الإجراء لا يمكن التراجع عنه</Text>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor={borderColor} py={4}>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onChapterDeleteClose} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">إلغاء</Button>
              <Button colorScheme="red" onClick={handleChapterDeleteConfirm} isLoading={chapterDeleteLoading} loadingText="جاري الحذف..." leftIcon={<FiTrash />} borderRadius="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">
                حذف الفصل
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Lesson Modal */}
      <Modal isOpen={isLessonAddOpen} onClose={onLessonAddClose} size="xl" isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(6px)" />
        <ModalContent bg={modalBg} borderRadius="2xl" borderWidth="1px" borderColor={modalBorder} boxShadow={cardShadow}>
          <ModalHeader bg={modalHeaderBg} color="white" borderRadius="2xl 2xl 0 0" py={5}>
            <HStack spacing={3}>
              <Box w="10" h="10" bg="whiteAlpha.300" borderRadius="xl" display="flex" alignItems="center" justifyContent="center">
                <Icon as={FiFileText} color="white" boxSize={5} />
              </Box>
              <Text fontSize="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">
                إضافة درس جديد {chapterForNewLesson && `(${chapterForNewLesson.name})`}
              </Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: "whiteAlpha.200" }} />
          <ModalBody py={6}>
            <form onSubmit={handleLessonSubmit} id="lesson-add-form">
              <VStack spacing={5}>
                <FormControl isRequired>
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">اسم الدرس</FormLabel>
                  <Input name="name" value={lessonFormData.name} onChange={handleLessonInputChange} placeholder="أدخل اسم الدرس" size="lg" borderWidth="2px" borderColor={inputBorder} _hover={{ borderColor: inputHoverBorder }} _focus={{ borderColor: inputFocusBorder, boxShadow: focusRingShadow }} borderRadius="lg" bg={useColorModeValue("white", "gray.700")} fontFamily="'Cairo', 'Tajawal', sans-serif" />
                </FormControl>
                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">وصف الدرس (اختياري)</FormLabel>
                  <Textarea name="description" value={lessonFormData.description} onChange={handleLessonInputChange} placeholder="أدخل وصف الدرس" rows={3} size="lg" borderWidth="2px" borderColor={inputBorder} _hover={{ borderColor: inputHoverBorder }} _focus={{ borderColor: inputFocusBorder, boxShadow: focusRingShadow }} borderRadius="lg" bg={useColorModeValue("white", "gray.700")} fontFamily="'Cairo', 'Tajawal', sans-serif" />
                </FormControl>
                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">صورة الدرس (اختياري)</FormLabel>
                  <VStack align="stretch" spacing={3}>
                    {!lessonImagePreview ? (
                      <Button as="label" htmlFor="lesson-image-upload" leftIcon={<FiUpload />} variant="outline" size="md" cursor="pointer" borderWidth="2px" borderColor={inputHoverBorder} color={searchIconColor} _hover={{ bg: iconBg, borderColor: inputFocusBorder }} borderRadius="lg" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">
                        اختر صورة
                      </Button>
                    ) : (
                      <Box position="relative" display="inline-block">
                        <Image src={lessonImagePreview} alt="معاينة" maxH="160px" borderRadius="md" />
                        <IconButton icon={<FiX />} position="absolute" top={2} right={2} colorScheme="red" size="sm" onClick={removeLessonImage} aria-label="إزالة الصورة" />
                      </Box>
                    )}
                    <Input id="lesson-image-upload" type="file" accept="image/*" onChange={handleLessonImageChange} display="none" />
                  </VStack>
                </FormControl>
              </VStack>
            </form>
          </ModalBody>
          <ModalFooter bg={modalFooterBg} borderRadius="0 0 2xl 2xl" py={5}>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={resetLessonForm} color={textPrimary} _hover={{ bg: iconBg }} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">إعادة تعيين</Button>
              <Button variant="ghost" onClick={onLessonAddClose} color={textPrimary} _hover={{ bg: iconBg }} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">إلغاء</Button>
              <Button type="submit" form="lesson-add-form" bg={buttonPrimary} color="white" onClick={handleLessonSubmit} isLoading={lessonSubmitLoading} loadingText="جاري الإنشاء..." leftIcon={<FiPlus />} _hover={{ bg: buttonPrimaryHover }} boxShadow={iconShadow} borderRadius="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">
                إضافة الدرس
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Lesson Modal */}
      <Modal isOpen={isLessonEditOpen} onClose={onLessonEditClose} size="xl" isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(6px)" />
        <ModalContent bg={modalBg} borderRadius="2xl" borderWidth="1px" borderColor={modalBorder} boxShadow={cardShadow}>
          <ModalHeader bg={buttonSecondary} color="white" borderRadius="2xl 2xl 0 0" py={5}>
            <HStack spacing={3}>
              <Box w="10" h="10" bg="whiteAlpha.300" borderRadius="xl" display="flex" alignItems="center" justifyContent="center">
                <Icon as={FiEdit} color="white" boxSize={5} />
              </Box>
              <Text fontSize="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">تعديل الدرس</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: "whiteAlpha.200" }} />
          <ModalBody py={6}>
            <form onSubmit={handleLessonEditSubmit} id="lesson-edit-form">
              <VStack spacing={5}>
                <FormControl isRequired>
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">اسم الدرس</FormLabel>
                  <Input name="name" value={editLessonFormData.name} onChange={handleLessonEditInputChange} placeholder="أدخل اسم الدرس" size="lg" borderWidth="2px" borderColor={inputBorder} _hover={{ borderColor: inputHoverBorder }} _focus={{ borderColor: inputFocusBorder, boxShadow: focusRingShadow }} borderRadius="lg" bg={useColorModeValue("white", "gray.700")} fontFamily="'Cairo', 'Tajawal', sans-serif" />
                </FormControl>
                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">وصف الدرس (اختياري)</FormLabel>
                  <Textarea name="description" value={editLessonFormData.description} onChange={handleLessonEditInputChange} placeholder="أدخل وصف الدرس" rows={3} size="lg" borderWidth="2px" borderColor={inputBorder} _hover={{ borderColor: inputHoverBorder }} _focus={{ borderColor: inputFocusBorder, boxShadow: focusRingShadow }} borderRadius="lg" bg={useColorModeValue("white", "gray.700")} fontFamily="'Cairo', 'Tajawal', sans-serif" />
                </FormControl>
                <FormControl>
                  <FormLabel color={textPrimary} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">صورة الدرس (اختياري)</FormLabel>
                  <VStack align="stretch" spacing={3}>
                    {!editLessonImagePreview ? (
                      <Button as="label" htmlFor="lesson-edit-image-upload" leftIcon={<FiUpload />} variant="outline" size="md" cursor="pointer" borderWidth="2px" borderColor={inputHoverBorder} color={searchIconColor} _hover={{ bg: iconBg, borderColor: inputFocusBorder }} borderRadius="lg" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">
                        اختر صورة
                      </Button>
                    ) : (
                      <Box position="relative" display="inline-block">
                        <Image src={editLessonImagePreview} alt="معاينة" maxH="160px" borderRadius="md" />
                        <IconButton icon={<FiX />} position="absolute" top={2} right={2} colorScheme="red" size="sm" onClick={removeLessonEditImage} aria-label="إزالة الصورة" />
                      </Box>
                    )}
                    <Input id="lesson-edit-image-upload" type="file" accept="image/*" onChange={handleLessonEditImageChange} display="none" />
                  </VStack>
                </FormControl>
              </VStack>
            </form>
          </ModalBody>
          <ModalFooter bg={modalFooterBg} borderRadius="0 0 2xl 2xl" py={5}>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={resetLessonEditForm} color={textPrimary} _hover={{ bg: iconBg }} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">إعادة تعيين</Button>
              <Button variant="ghost" onClick={onLessonEditClose} color={textPrimary} _hover={{ bg: iconBg }} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">إلغاء</Button>
              <Button type="submit" form="lesson-edit-form" bg={buttonSecondary} color="white" onClick={handleLessonEditSubmit} isLoading={lessonEditLoading} loadingText="جاري التحديث..." leftIcon={<FiEdit />} _hover={{ bg: buttonSecondaryHover }} boxShadow={iconShadow} borderRadius="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">
                تحديث الدرس
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Lesson Modal */}
      <Modal isOpen={isLessonDeleteOpen} onClose={onLessonDeleteClose} size="md" isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <ModalContent bg={cardBackground} borderRadius="2xl" borderWidth="1px" borderColor={cardBorder} boxShadow={cardShadow}>
          <ModalHeader borderBottomWidth="1px" borderColor={borderColor} py={5}>
            <HStack spacing={3}>
              <Box w="10" h="10" bg={useColorModeValue("red.50", "red.900")} borderRadius="xl" display="flex" alignItems="center" justifyContent="center">
                <Icon as={FiTrash} color="red.500" boxSize={5} />
              </Box>
              <Text fontFamily="'Cairo', 'Tajawal', sans-serif" fontWeight="bold" color={textPrimary}>تأكيد حذف الدرس</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody py={6}>
            <VStack spacing={4} align="stretch" textAlign="center">
              <Box w="16" h="16" mx="auto" borderRadius="full" bg={useColorModeValue("red.50", "red.900")} display="flex" alignItems="center" justifyContent="center">
                <Icon as={FiFileText} color="red.500" boxSize={8} />
              </Box>
              <Text fontSize="md" fontWeight="600" color={textPrimary} fontFamily="'Cairo', 'Tajawal', sans-serif">
                هل أنت متأكد من حذف الدرس؟
              </Text>
              <Text fontSize="sm" color={textSecondary} fontFamily="'Cairo', 'Tajawal', sans-serif">"{deletingLesson?.name}"</Text>
              <Text fontSize="xs" color={textSecondary}>هذا الإجراء لا يمكن التراجع عنه</Text>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor={borderColor} py={4}>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onLessonDeleteClose} fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">إلغاء</Button>
              <Button colorScheme="red" onClick={handleLessonDeleteConfirm} isLoading={lessonDeleteLoading} loadingText="جاري الحذف..." leftIcon={<FiTrash />} borderRadius="xl" fontWeight="bold" fontFamily="'Cairo', 'Tajawal', sans-serif">
                حذف الدرس
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default QuestionBank;