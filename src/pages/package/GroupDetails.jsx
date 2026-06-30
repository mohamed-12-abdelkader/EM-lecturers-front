import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Alert,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDescription,
  AlertIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Stack,
  Switch,
  Tag,
  TagLabel,
  Text,
  Textarea,
  Wrap,
  WrapItem,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import {
  FiArrowRight,
  FiBookOpen,
  FiCheckSquare,
  FiClipboard,
  FiEdit2,
  FiFileText,
  FiFilm,
  FiInfo,
  FiLink,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUsers,
} from 'react-icons/fi';
import baseUrl from '../../api/baseUrl';
import UserType from '../../Hooks/auth/userType';

const WEEKDAY_LABELS = {
  sat: 'السبت',
  sun: 'الأحد',
  mon: 'الاثنين',
  tue: 'الثلاثاء',
  wed: 'الأربعاء',
  thu: 'الخميس',
  fri: 'الجمعة',
};

const formatDays = (days) => {
  if (!Array.isArray(days) || days.length === 0) return null;
  return days.map((d) => WEEKDAY_LABELS[d] || d).join(' - ');
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

const safeArray = (v) => (Array.isArray(v) ? v : []);

const safeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const GroupDetails = () => {
  const { subjectId, groupId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [userData, isAdmin, isTeacher] = UserType();

  const role = useMemo(() => {
    if (isAdmin) return 'admin';
    if (isTeacher) return 'teacher';
    return userData?.role || 'unknown';
  }, [isAdmin, isTeacher, userData?.role]);

  const pageBg = useColorModeValue('#F6F8FF', 'gray.950');
  const cardBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('blackAlpha.200', 'whiteAlpha.200');
  const muted = useColorModeValue('gray.600', 'gray.400');
  const heroBorder = useColorModeValue('blackAlpha.200', 'whiteAlpha.200');
  const primary = useColorModeValue('blue.600', 'blue.300');
  const softBlue = useColorModeValue('blue.50', 'whiteAlpha.50');
  const elevatedShadow = useColorModeValue('0 18px 40px rgba(15, 23, 42, 0.12)', '0 18px 40px rgba(0,0,0,0.45)');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const [group, setGroup] = useState(null);
  const [stats, setStats] = useState(null);

  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState(null);
  const [contentGroup, setContentGroup] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [totalLessons, setTotalLessons] = useState(0);
  const [lessonQuery, setLessonQuery] = useState('');

  // General group content (not linked to lessons)
  const [generalLoading, setGeneralLoading] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [groupFiles, setGroupFiles] = useState([]);
  const [groupExams, setGroupExams] = useState([]);

  const { isOpen: isCreateLessonOpen, onOpen: onOpenCreateLesson, onClose: onCloseCreateLesson } = useDisclosure();
  const [lessonSaving, setLessonSaving] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: '', description: '' });

  // Manage lesson content (videos/files/exams/assignments)
  const {
    isOpen: isContentModalOpen,
    onOpen: onOpenContentModal,
    onClose: onCloseContentModal,
  } = useDisclosure();
  const [contentSaving, setContentSaving] = useState(false);
  const [contentMode, setContentMode] = useState('create'); // create | edit
  const [contentType, setContentType] = useState('video'); // video | file | assignment | exam
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [contentForm, setContentForm] = useState({});

  // General content modal (files/exams)
  const {
    isOpen: isGeneralOpen,
    onOpen: onOpenGeneral,
    onClose: onCloseGeneral,
  } = useDisclosure();
  const [generalSaving, setGeneralSaving] = useState(false);
  const [generalMode, setGeneralMode] = useState('create'); // create | edit
  const [generalType, setGeneralType] = useState('file'); // file | exam
  const [generalItem, setGeneralItem] = useState(null);
  const [generalForm, setGeneralForm] = useState({});

  const {
    isOpen: isDeleteOpen,
    onOpen: onOpenDelete,
    onClose: onCloseDelete,
  } = useDisclosure();
  const [deleteTarget, setDeleteTarget] = useState(null); // {type, id, title}
  const [deleteSaving, setDeleteSaving] = useState(false);
  const deleteCancelRef = useRef();

  const fetchDetails = async () => {
    if (!subjectId || !groupId) return;
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const res = await baseUrl.get(`/api/subjects/${subjectId}/groups/${groupId}`, {
        headers: getAuthHeaders(),
      });
      setGroup(res.data?.group || null);
      setStats(res.data?.stats || null);
    } catch (e) {
      if (e?.response?.status === 403) {
        setForbidden(true);
        return;
      }
      setError(e?.response?.data?.message || e?.response?.data?.error || 'حدث خطأ أثناء تحميل تفاصيل المجموعة');
    } finally {
      setLoading(false);
    }
  };

  const fetchContent = async () => {
    if (!subjectId || !groupId) return;
    setContentLoading(true);
    setContentError(null);
    setForbidden(false);
    try {
      const res = await baseUrl.get(`/api/subjects/${subjectId}/groups/${groupId}/content`, {
        headers: getAuthHeaders(),
      });
      setContentGroup(res.data?.group || null);
      const list = safeArray(res.data?.lessons);
      setLessons(list);
      setTotalLessons(Number.isFinite(Number(res.data?.total)) ? Number(res.data?.total) : list.length);
    } catch (e) {
      if (e?.response?.status === 403) {
        setForbidden(true);
        return;
      }
      setContentError(e?.response?.data?.message || e?.response?.data?.error || 'حدث خطأ أثناء تحميل محتوى المجموعة');
      setLessons([]);
      setTotalLessons(0);
    } finally {
      setContentLoading(false);
    }
  };

  const fetchGeneralContent = async () => {
    if (!subjectId || !groupId) return;
    // Admin + Teacher only (backend will enforce ownership)
    if (role !== 'admin' && role !== 'teacher') return;

    setGeneralLoading(true);
    setGeneralError(null);

    try {
      const headers = { headers: getAuthHeaders() };

      const [filesRes, examsRes] = await Promise.allSettled([
        baseUrl.get(`/api/subjects/${subjectId}/groups/${groupId}/group-files`, headers),
        baseUrl.get(`/api/subjects/${subjectId}/groups/${groupId}/package-group-exams`, headers),
      ]);

      if (filesRes.status === 'fulfilled') {
        const files = safeArray(filesRes.value?.data?.files || filesRes.value?.data?.group_files || filesRes.value?.data?.data?.files);
        setGroupFiles(files);
      } else {
        setGroupFiles([]);
      }

      if (examsRes.status === 'fulfilled') {
        const exams = safeArray(examsRes.value?.data?.exams || examsRes.value?.data?.group_exams || examsRes.value?.data?.data?.exams);
        setGroupExams(exams);
      } else {
        setGroupExams([]);
      }

      if (filesRes.status === 'rejected' || examsRes.status === 'rejected') {
        const msg =
          filesRes.status === 'rejected'
            ? filesRes.reason?.response?.data?.message || filesRes.reason?.response?.data?.error
            : examsRes.reason?.response?.data?.message || examsRes.reason?.response?.data?.error;
        setGeneralError(msg || 'حدث خطأ أثناء تحميل المحتوى العام للمجموعة');
      }
    } catch (e) {
      setGeneralError(e?.response?.data?.message || e?.response?.data?.error || 'حدث خطأ أثناء تحميل المحتوى العام للمجموعة');
      setGroupFiles([]);
      setGroupExams([]);
    } finally {
      setGeneralLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.allSettled([fetchDetails(), fetchContent(), fetchGeneralContent()]);
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, groupId]);

  const openGeneralModal = ({ type, mode, item }) => {
    setGeneralType(type);
    setGeneralMode(mode);
    setGeneralItem(item || null);

    if (type === 'file') {
      setGeneralForm({
        title: item?.title || '',
        file_url: item?.file_url || item?.url || '',
        order_index: item?.order_index ?? 0,
      });
    } else if (type === 'exam') {
      setGeneralForm({
        title: item?.title || '',
        duration: item?.duration ?? '',
        total_marks: item?.total_marks ?? '',
      });
    }

    onOpenGeneral();
  };

  const handleSaveGeneral = async () => {
    if (!subjectId || !groupId) return;
    if (role !== 'admin' && role !== 'teacher') return;

    try {
      setGeneralSaving(true);
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };

      if (generalType === 'file') {
        const payload = {
          title: String(generalForm.title || '').trim(),
          file_url: String(generalForm.file_url || '').trim(),
          order_index: safeNumber(generalForm.order_index) ?? 0,
        };
        if (!payload.title || !payload.file_url) {
          toast({
            title: 'بيانات ناقصة',
            description: 'عنوان الملف ورابط الملف مطلوبان',
            status: 'warning',
            duration: 3000,
            isClosable: true,
            position: 'top-right',
          });
          return;
        }

        if (generalMode === 'create') {
          await baseUrl.post(`/api/subjects/${subjectId}/groups/${groupId}/group-files`, payload, { headers });
        } else {
          await baseUrl.put(`/api/group-files/${generalItem?.id}`, payload, { headers });
        }
      }

      if (generalType === 'exam') {
        const payload = {
          title: String(generalForm.title || '').trim(),
          duration: safeNumber(generalForm.duration) ?? 0,
          total_marks: safeNumber(generalForm.total_marks) ?? 0,
        };
        if (!payload.title) {
          toast({
            title: 'بيانات ناقصة',
            description: 'عنوان الامتحان مطلوب',
            status: 'warning',
            duration: 3000,
            isClosable: true,
            position: 'top-right',
          });
          return;
        }

        if (generalMode === 'create') {
          await baseUrl.post(`/api/subjects/${subjectId}/groups/${groupId}/package-group-exams`, payload, { headers });
        } else {
          await baseUrl.put(`/api/package-group-exams/${generalItem?.id}`, payload, { headers });
        }
      }

      toast({
        title: 'تم الحفظ',
        description: 'تم تنفيذ العملية بنجاح',
        status: 'success',
        duration: 3500,
        isClosable: true,
        position: 'top-right',
      });

      onCloseGeneral();
      setGeneralItem(null);
      await fetchGeneralContent();
    } catch (e) {
      toast({
        title: 'فشل الحفظ',
        description: e?.response?.data?.message || e?.response?.data?.error || 'حدث خطأ أثناء الحفظ',
        status: 'error',
        duration: 4500,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setGeneralSaving(false);
    }
  };

  const toggleGeneralExamVisibility = async ({ item, isVisible }) => {
    if (!item?.id) return;
    if (role !== 'admin' && role !== 'teacher') return;
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await baseUrl.patch(`/api/package-group-exams/${item.id}/visibility`, { is_visible: isVisible }, { headers });
      toast({
        title: 'تم التحديث',
        description: isVisible ? 'تم إظهار الامتحان' : 'تم إخفاء الامتحان',
        status: 'success',
        duration: 2500,
        isClosable: true,
        position: 'top-right',
      });
      await fetchGeneralContent();
    } catch (e) {
      toast({
        title: 'فشل تحديث الظهور',
        description: e?.response?.data?.message || e?.response?.data?.error || 'حدث خطأ',
        status: 'error',
        duration: 4500,
        isClosable: true,
        position: 'top-right',
      });
    }
  };

  const handleCreateLesson = async () => {
    if (!subjectId || !groupId) return;
    if (!String(lessonForm.title || '').trim()) {
      toast({
        title: 'بيانات ناقصة',
        description: 'عنوان الدرس مطلوب',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }

    try {
      setLessonSaving(true);
      const payload = {
        title: String(lessonForm.title).trim(),
        description: String(lessonForm.description || '').trim(),
      };
      const res = await baseUrl.post(`/api/subjects/${subjectId}/groups/${groupId}/lessons`, payload, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      toast({
        title: 'تم إنشاء الدرس',
        description: 'تم الحفظ بنجاح',
        status: 'success',
        duration: 3500,
        isClosable: true,
        position: 'top-right',
      });

      onCloseCreateLesson();
      setLessonForm({ title: '', description: '' });
      await refreshAll();
    } catch (e) {
      toast({
        title: 'فشل إنشاء الدرس',
        description: e?.response?.data?.message || e?.response?.data?.error || 'حدث خطأ أثناء الحفظ',
        status: 'error',
        duration: 4500,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setLessonSaving(false);
    }
  };

  const effectiveGroup = contentGroup || group;
  const daysText = formatDays(effectiveGroup?.schedule_days);
  const timeText = effectiveGroup?.schedule_time ? String(effectiveGroup.schedule_time) : null;

  const filteredLessons = useMemo(() => {
    const q = String(lessonQuery || '').trim().toLowerCase();
    if (!q) return lessons;
    return lessons.filter((l) => String(l?.title || '').toLowerCase().includes(q));
  }, [lessons, lessonQuery]);

  const openContentModal = ({ type, mode, lesson, item }) => {
    setContentType(type);
    setContentMode(mode);
    setActiveLesson(lesson);
    setActiveItem(item || null);

    if (type === 'video') {
      setContentForm({
        title: item?.title || '',
        video_url: item?.video_url || item?.url || '',
        duration_minutes: item?.duration_minutes ?? '',
        order_index: item?.order_index ?? 0,
      });
    } else if (type === 'file') {
      setContentForm({
        title: item?.title || '',
        file_url: item?.file_url || item?.url || '',
      });
    } else if (type === 'assignment') {
      setContentForm({
        name: item?.name || '',
        duration_minutes: item?.duration_minutes ?? '',
        questions_count: item?.questions_count ?? '',
      });
    } else if (type === 'exam') {
      setContentForm({
        title: item?.title || '',
        duration: item?.duration ?? '',
        total_marks: item?.total_marks ?? '',
      });
    }

    onOpenContentModal();
  };

  const confirmDelete = ({ type, item }) => {
    const title =
      item?.title ||
      item?.name ||
      (type === 'video' ? 'فيديو' : type === 'file' ? 'ملف' : type === 'assignment' ? 'واجب' : 'امتحان');
    setDeleteTarget({ type, id: item?.id, title });
    onOpenDelete();
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      setDeleteSaving(true);
      const id = deleteTarget.id;
      if (deleteTarget.type === 'video') {
        await baseUrl.delete(`/api/videos/${id}`, { headers: getAuthHeaders() });
      } else if (deleteTarget.type === 'file') {
        await baseUrl.delete(`/api/files/${id}`, { headers: getAuthHeaders() });
      } else if (deleteTarget.type === 'assignment') {
        await baseUrl.delete(`/api/assignments/${id}`, { headers: getAuthHeaders() });
      } else if (deleteTarget.type === 'exam') {
        await baseUrl.delete(`/api/exams/${id}`, { headers: getAuthHeaders() });
      } else if (deleteTarget.type === 'groupFile') {
        await baseUrl.delete(`/api/group-files/${id}`, { headers: getAuthHeaders() });
      } else if (deleteTarget.type === 'groupExam') {
        await baseUrl.delete(`/api/package-group-exams/${id}`, { headers: getAuthHeaders() });
      }

      toast({
        title: 'تم الحذف',
        description: 'تم الحذف بنجاح',
        status: 'success',
        duration: 3500,
        isClosable: true,
        position: 'top-right',
      });

      onCloseDelete();
      setDeleteTarget(null);
      if (deleteTarget.type === 'groupFile' || deleteTarget.type === 'groupExam') {
        await fetchGeneralContent();
      } else {
        await refreshAll();
      }
    } catch (e) {
      toast({
        title: 'فشل الحذف',
        description: e?.response?.data?.message || e?.response?.data?.error || 'حدث خطأ أثناء الحذف',
        status: 'error',
        duration: 4500,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setDeleteSaving(false);
    }
  };

  const handleSaveContent = async () => {
    if (!activeLesson?.id && contentType !== 'video' && contentType !== 'file' && contentType !== 'assignment' && contentType !== 'exam') return;

    try {
      setContentSaving(true);
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };

      if (contentType === 'video') {
        const payload = {
          title: String(contentForm.title || '').trim(),
          video_url: String(contentForm.video_url || '').trim(),
          duration_minutes: safeNumber(contentForm.duration_minutes) ?? 0,
          order_index: safeNumber(contentForm.order_index) ?? 0,
        };

        if (!payload.title || !payload.video_url) {
          toast({
            title: 'بيانات ناقصة',
            description: 'عنوان الفيديو ورابط الفيديو مطلوبان',
            status: 'warning',
            duration: 3000,
            isClosable: true,
            position: 'top-right',
          });
          return;
        }

        if (contentMode === 'create') {
          await baseUrl.post(`/api/lessons/${activeLesson.id}/videos`, payload, { headers });
        } else {
          await baseUrl.put(`/api/videos/${activeItem.id}`, payload, { headers });
        }
      }

      if (contentType === 'file') {
        const payload = {
          title: String(contentForm.title || '').trim(),
          file_url: String(contentForm.file_url || '').trim(),
        };
        if (!payload.title || !payload.file_url) {
          toast({
            title: 'بيانات ناقصة',
            description: 'عنوان الملف ورابط الملف مطلوبان',
            status: 'warning',
            duration: 3000,
            isClosable: true,
            position: 'top-right',
          });
          return;
        }

        if (contentMode === 'create') {
          await baseUrl.post(`/api/lessons/${activeLesson.id}/files`, payload, { headers });
        } else {
          await baseUrl.put(`/api/files/${activeItem.id}`, payload, { headers });
        }
      }

      if (contentType === 'assignment') {
        const payload = {
          name: String(contentForm.name || '').trim(),
          duration_minutes: safeNumber(contentForm.duration_minutes) ?? 0,
          questions_count: safeNumber(contentForm.questions_count) ?? 0,
        };
        if (!payload.name) {
          toast({
            title: 'بيانات ناقصة',
            description: 'اسم الواجب مطلوب',
            status: 'warning',
            duration: 3000,
            isClosable: true,
            position: 'top-right',
          });
          return;
        }

        if (contentMode === 'create') {
          await baseUrl.post(`/api/lessons/${activeLesson.id}/assignments`, payload, { headers });
        } else {
          await baseUrl.put(`/api/assignments/${activeItem.id}`, payload, { headers });
        }
      }

      if (contentType === 'exam') {
        const payload = {
          title: String(contentForm.title || '').trim(),
          duration: safeNumber(contentForm.duration) ?? 0,
          total_marks: safeNumber(contentForm.total_marks) ?? 0,
        };
        if (!payload.title) {
          toast({
            title: 'بيانات ناقصة',
            description: 'عنوان الامتحان مطلوب',
            status: 'warning',
            duration: 3000,
            isClosable: true,
            position: 'top-right',
          });
          return;
        }

        if (contentMode === 'create') {
          await baseUrl.post(`/api/lessons/${activeLesson.id}/exams`, payload, { headers });
        } else {
          await baseUrl.put(`/api/exams/${activeItem.id}`, payload, { headers });
        }
      }

      toast({
        title: 'تم الحفظ',
        description: 'تم تنفيذ العملية بنجاح',
        status: 'success',
        duration: 3500,
        isClosable: true,
        position: 'top-right',
      });

      onCloseContentModal();
      setActiveItem(null);
      await refreshAll();
    } catch (e) {
      toast({
        title: 'فشل الحفظ',
        description: e?.response?.data?.message || e?.response?.data?.error || 'حدث خطأ أثناء الحفظ',
        status: 'error',
        duration: 4500,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setContentSaving(false);
    }
  };

  const toggleVisibility = async ({ type, item, isVisible }) => {
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      if (type === 'assignment') {
        await baseUrl.patch(`/api/assignments/${item.id}/visibility`, { is_visible: isVisible }, { headers });
      } else if (type === 'exam') {
        await baseUrl.patch(`/api/exams/${item.id}/visibility`, { is_visible: isVisible }, { headers });
      }

      toast({
        title: 'تم التحديث',
        description: isVisible ? 'تم تفعيل الظهور' : 'تم إخفاء الظهور',
        status: 'success',
        duration: 2500,
        isClosable: true,
        position: 'top-right',
      });
      await refreshAll();
    } catch (e) {
      toast({
        title: 'فشل تحديث الظهور',
        description: e?.response?.data?.message || e?.response?.data?.error || 'حدث خطأ',
        status: 'error',
        duration: 4500,
        isClosable: true,
        position: 'top-right',
      });
    }
  };

  const toggleLessonVisibility = async ({ lesson, isVisible }) => {
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await baseUrl.patch(`/api/lessons/${lesson.id}/visibility`, { is_visible: isVisible }, { headers });

      toast({
        title: 'تم تحديث الدرس',
        description: isVisible ? 'تم إظهار الدرس للطلاب' : 'تم إخفاء الدرس عن الطلاب',
        status: 'success',
        duration: 2500,
        isClosable: true,
        position: 'top-right',
      });

      await refreshAll();
    } catch (e) {
      toast({
        title: 'فشل تحديث الدرس',
        description: e?.response?.data?.message || e?.response?.data?.error || 'حدث خطأ',
        status: 'error',
        duration: 4500,
        isClosable: true,
        position: 'top-right',
      });
    }
  };

  return (
    <Box minH="100vh" py={10} bg={pageBg} dir="rtl">
      <Container maxW="6xl">
        {/* Hero */}
        <Card
          bg={cardBg}
          borderRadius="3xl"
          border="1px solid"
          borderColor={heroBorder}
          overflow="hidden"
          mb={6}
        >
          <Box
            px={{ base: 5, md: 7 }}
            py={{ base: 5, md: 7 }}
            bgGradient={useColorModeValue(
              'linear(to-r, blue.500, blue.700)',
              'linear(to-r, blue.700, blue.900)'
            )}
            color="white"
          >
            <HStack justify="space-between" align="start" spacing={4} flexWrap="wrap">
              <HStack spacing={4} align="center">
                <IconButton
                  aria-label="Back"
                  icon={<FiArrowRight />}
                  variant="ghost"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  _active={{ bg: 'whiteAlpha.300' }}
                  onClick={() => navigate(-1)}
                />
                <Avatar name={effectiveGroup?.name || 'Group'} bg="whiteAlpha.300" />
                <Box>
                  <Heading size="lg" noOfLines={1}>
                    {effectiveGroup?.name || 'صفحة المجموعة'}
                  </Heading>
                  <Text mt={1} fontSize="sm" opacity={0.9}>
                    المادة #{subjectId} • المجموعة #{groupId}
                  </Text>
                </Box>
              </HStack>

              <Wrap justify="flex-end" spacing={2}>
                <WrapItem>
                  <Tag bg="whiteAlpha.300" borderRadius="full" px={3} py={1}>
                    <TagLabel>{role}</TagLabel>
                  </Tag>
                </WrapItem>
                {daysText && (
                  <WrapItem>
                    <Tag bg="whiteAlpha.300" borderRadius="full" px={3} py={1}>
                      <TagLabel>{daysText}</TagLabel>
                    </Tag>
                  </WrapItem>
                )}
                {timeText && (
                  <WrapItem>
                    <Tag bg="whiteAlpha.300" borderRadius="full" px={3} py={1}>
                      <TagLabel>{timeText}</TagLabel>
                    </Tag>
                  </WrapItem>
                )}
              </Wrap>
            </HStack>
          </Box>

          <CardBody>
            <HStack justify="space-between" flexWrap="wrap" spacing={3}>
              <HStack spacing={2} flexWrap="wrap">
                <Button
                  leftIcon={<FiRefreshCw />}
                  variant="outline"
                  onClick={refreshAll}
                  isLoading={loading || contentLoading}
                >
                  تحديث
                </Button>
                <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onOpenCreateLesson} isDisabled={forbidden}>
                  إنشاء درس
                </Button>
              </HStack>

              <Button as={RouterLink} to={`/subject/${subjectId}`} variant="ghost">
                العودة للمادة
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {(loading || contentLoading) && (
          <Stack spacing={4}>
            <Card bg={cardBg} borderRadius="3xl" border="1px solid" borderColor={borderColor}>
              <CardBody>
                <Skeleton height="18px" width="40%" />
                <SkeletonText mt="4" noOfLines={4} spacing="3" />
              </CardBody>
            </Card>
            <Card bg={cardBg} borderRadius="3xl" border="1px solid" borderColor={borderColor}>
              <CardBody>
                <Skeleton height="18px" width="30%" />
                <SkeletonText mt="4" noOfLines={3} spacing="3" />
              </CardBody>
            </Card>
          </Stack>
        )}

        {!loading && !contentLoading && forbidden && (
          <Alert status="error" borderRadius="2xl">
            <AlertIcon />
            <AlertDescription>
              غير مسموح. هذه المجموعة ليست ضمن صلاحياتك (403).
            </AlertDescription>
          </Alert>
        )}

        {!loading && !contentLoading && !forbidden && (error || contentError) && (
          <Alert status="error" borderRadius="2xl">
            <AlertIcon />
            <AlertDescription>{error || contentError}</AlertDescription>
          </Alert>
        )}

        {!loading && !contentLoading && !forbidden && !error && !contentError && (
          <Stack spacing={5}>
            {/* Stats */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Card
                bg={cardBg}
                borderRadius="3xl"
                border="1px solid"
                borderColor={borderColor}
                boxShadow={useColorModeValue('none', 'none')}
              >
                <CardBody>
                  <HStack spacing={3}>
                    <Box p={3} borderRadius="2xl" bg={softBlue} color={primary}>
                      <Icon as={FiInfo} boxSize={5} />
                    </Box>
                    <Box>
                      <Text fontSize="xs" color={muted}>
                        اسم المجموعة
                      </Text>
                      <Heading size="md" mt={1} color={primary} noOfLines={1}>
                        {effectiveGroup?.name || '—'}
                      </Heading>
                    </Box>
                  </HStack>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderRadius="3xl" border="1px solid" borderColor={borderColor}>
                <CardBody>
                  <HStack spacing={3}>
                    <Box p={3} borderRadius="2xl" bg={softBlue} color={primary}>
                      <Icon as={FiUsers} boxSize={5} />
                    </Box>
                    <Box>
                      <Text fontSize="xs" color={muted}>
                        الطلاب
                      </Text>
                      <Heading size="md" mt={1} color={primary}>
                        {stats?.students ?? '—'}
                      </Heading>
                    </Box>
                  </HStack>
                </CardBody>
              </Card>

              <Card bg={cardBg} borderRadius="3xl" border="1px solid" borderColor={borderColor}>
                <CardBody>
                  <HStack spacing={3}>
                    <Box p={3} borderRadius="2xl" bg={softBlue} color={primary}>
                      <Icon as={FiBookOpen} boxSize={5} />
                    </Box>
                    <Box>
                      <Text fontSize="xs" color={muted}>
                        الدروس
                      </Text>
                      <Heading size="md" mt={1} color={primary}>
                        {stats?.lessons ?? totalLessons ?? '—'}
                      </Heading>
                    </Box>
                  </HStack>
                </CardBody>
              </Card>
            </SimpleGrid>

            <Card bg={cardBg} borderRadius="3xl" border="1px solid" borderColor={borderColor}>
              <CardBody>
                <HStack justify="space-between" flexWrap="wrap" spacing={3}>
                  <Box>
                    <Heading size="md">تفاصيل المجموعة</Heading>
                    <Text fontSize="sm" color={muted} mt={1}>
                      المدرس: {effectiveGroup?.teacher_id ? `#${effectiveGroup.teacher_id}` : '—'}
                    </Text>
                  </Box>
                  <HStack spacing={2} flexWrap="wrap">
                    {daysText && (
                      <Tag borderRadius="full" colorScheme="blue">
                        <TagLabel>{daysText}</TagLabel>
                      </Tag>
                    )}
                    {timeText && (
                      <Tag borderRadius="full" variant="subtle" colorScheme="blue">
                        <TagLabel>{timeText}</TagLabel>
                      </Tag>
                    )}
                    {!daysText && !timeText && (
                      <Tag borderRadius="full" variant="subtle">
                        <TagLabel>بدون جدول</TagLabel>
                      </Tag>
                    )}
                  </HStack>
                </HStack>
              </CardBody>
            </Card>

            {/* General group content */}
            {(role === 'admin' || role === 'teacher') && (
              <Card bg={cardBg} borderRadius="3xl" border="1px solid" borderColor={borderColor}>
                <CardBody>
                  <HStack justify="space-between" flexWrap="wrap" spacing={3} mb={4}>
                    <Box>
                      <Heading size="md">محتوى عام للمجموعة</Heading>
                      <Text fontSize="sm" color={muted} mt={1}>
                        ملفات PDF وامتحانات عامة (غير مرتبطة بدروس).
                      </Text>
                    </Box>
                    <Button
                      leftIcon={<FiRefreshCw />}
                      variant="outline"
                      onClick={fetchGeneralContent}
                      isLoading={generalLoading}
                    >
                      تحديث
                    </Button>
                  </HStack>

                  {generalError && (
                    <Alert status="error" borderRadius="2xl" mb={4}>
                      <AlertIcon />
                      <AlertDescription>{generalError}</AlertDescription>
                    </Alert>
                  )}

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    {/* Group Files */}
                    <Card borderRadius="2xl" border="1px solid" borderColor={borderColor} bg={useColorModeValue('white', 'blackAlpha.200')}>
                      <CardBody>
                        <HStack justify="space-between" mb={3} flexWrap="wrap" spacing={2}>
                          <HStack>
                            <Icon as={FiFileText} color={primary} />
                            <Text fontWeight="bold">ملفات PDF عامة</Text>
                          </HStack>
                          <Button
                            size="sm"
                            leftIcon={<FiPlus />}
                            colorScheme="blue"
                            onClick={() => openGeneralModal({ type: 'file', mode: 'create' })}
                            isDisabled={forbidden}
                          >
                            إضافة
                          </Button>
                        </HStack>

                        <Stack spacing={2}>
                          {safeArray(groupFiles).length === 0 ? (
                            <Text fontSize="sm" color={muted}>
                              لا يوجد ملفات عامة.
                            </Text>
                          ) : (
                            safeArray(groupFiles).map((f) => (
                              <Card key={f.id} borderRadius="xl" border="1px solid" borderColor={borderColor}>
                                <CardBody>
                                  <HStack justify="space-between" align="start" spacing={3} flexWrap="wrap">
                                    <Box>
                                      <Text fontWeight="bold" noOfLines={1}>
                                        {f.title || '—'}
                                      </Text>
                                      <Text fontSize="xs" color={muted} mt={1} noOfLines={1}>
                                        {f.file_url || f.url || '—'}
                                      </Text>
                                      <Text fontSize="xs" color={muted} mt={1}>
                                        order: {Number.isFinite(Number(f.order_index)) ? Number(f.order_index) : 0}
                                      </Text>
                                    </Box>
                                    <HStack spacing={2}>
                                      {(f.file_url || f.url) && (
                                        <IconButton
                                          as="a"
                                          href={f.file_url || f.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          aria-label="Open link"
                                          icon={<FiLink />}
                                          size="sm"
                                          variant="ghost"
                                        />
                                      )}
                                      <IconButton
                                        aria-label="Edit"
                                        icon={<FiEdit2 />}
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => openGeneralModal({ type: 'file', mode: 'edit', item: f })}
                                      />
                                      <IconButton
                                        aria-label="Delete"
                                        icon={<FiTrash2 />}
                                        size="sm"
                                        colorScheme="red"
                                        variant="ghost"
                                        onClick={() => confirmDelete({ type: 'groupFile', item: f })}
                                      />
                                    </HStack>
                                  </HStack>
                                </CardBody>
                              </Card>
                            ))
                          )}
                        </Stack>
                      </CardBody>
                    </Card>

                    {/* Group Exams */}
                    <Card borderRadius="2xl" border="1px solid" borderColor={borderColor} bg={useColorModeValue('white', 'blackAlpha.200')}>
                      <CardBody>
                        <HStack justify="space-between" mb={3} flexWrap="wrap" spacing={2}>
                          <HStack>
                            <Icon as={FiClipboard} color={primary} />
                            <Text fontWeight="bold">امتحانات عامة</Text>
                          </HStack>
                          <Button
                            size="sm"
                            leftIcon={<FiPlus />}
                            colorScheme="blue"
                            onClick={() => openGeneralModal({ type: 'exam', mode: 'create' })}
                            isDisabled={forbidden}
                          >
                            إنشاء
                          </Button>
                        </HStack>

                        <Stack spacing={2}>
                          {safeArray(groupExams).length === 0 ? (
                            <Text fontSize="sm" color={muted}>
                              لا يوجد امتحانات عامة.
                            </Text>
                          ) : (
                            safeArray(groupExams).map((ex) => (
                              <Card key={ex.id} borderRadius="xl" border="1px solid" borderColor={borderColor}>
                                <CardBody>
                                  <HStack justify="space-between" align="start" spacing={3} flexWrap="wrap" mb={2}>
                                    <Box>
                                      <Text fontWeight="bold" noOfLines={1}>
                                        {ex.title || '—'}
                                      </Text>
                                      <Text fontSize="xs" color={muted} mt={1}>
                                        {`المدة: ${ex.duration ?? '—'} دقيقة • الدرجة: ${ex.total_marks ?? '—'}`}
                                      </Text>
                                    </Box>
                                    <HStack spacing={2} align="center">
                                      <HStack spacing={2} align="center">
                                        <Text fontSize="xs" color={muted}>
                                          مرئي
                                        </Text>
                                        <Switch
                                          colorScheme="blue"
                                          isChecked={Boolean(ex.is_visible)}
                                          onChange={(e) =>
                                            toggleGeneralExamVisibility({ item: ex, isVisible: e.target.checked })
                                          }
                                        />
                                      </HStack>
                                      <IconButton
                                        aria-label="Edit"
                                        icon={<FiEdit2 />}
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => openGeneralModal({ type: 'exam', mode: 'edit', item: ex })}
                                      />
                                      <IconButton
                                        aria-label="Delete"
                                        icon={<FiTrash2 />}
                                        size="sm"
                                        colorScheme="red"
                                        variant="ghost"
                                        onClick={() => confirmDelete({ type: 'groupExam', item: ex })}
                                      />
                                    </HStack>
                                  </HStack>
                                </CardBody>
                              </Card>
                            ))
                          )}
                        </Stack>
                      </CardBody>
                    </Card>
                  </SimpleGrid>
                </CardBody>
              </Card>
            )}

            <Card
              bg={cardBg}
              borderRadius="3xl"
              border="1px solid"
              borderColor={borderColor}
              overflow="hidden"
              boxShadow={useColorModeValue('none', 'none')}
            >
              <Box
                px={6}
                py={5}
                bgGradient={useColorModeValue(
                  'linear(to-r, blue.500, blue.700)',
                  'linear(to-r, blue.700, blue.900)'
                )}
                color="white"
              >
                <HStack justify="space-between" flexWrap="wrap" spacing={3}>
                  <Box>
                    <Heading size="md">محتوى المجموعة</Heading>
                    <Text fontSize="sm" opacity={0.9} mt={1}>
                      الدروس ومحتوياتها (فيديوهات/ملفات/امتحانات/واجبات).
                    </Text>
                  </Box>
                  <Button
                    leftIcon={<FiPlus />}
                    colorScheme="blue"
                    variant="solid"
                    onClick={onOpenCreateLesson}
                    isDisabled={forbidden}
                    bg="whiteAlpha.300"
                    _hover={{ bg: 'whiteAlpha.400' }}
                    _active={{ bg: 'whiteAlpha.500' }}
                  >
                    إنشاء درس
                  </Button>
                </HStack>
              </Box>
              <CardBody>
                <HStack justify="space-between" flexWrap="wrap" spacing={3} mb={4}>
                  <InputGroup w={{ base: 'full', md: '360px' }}>
                    <Input
                      value={lessonQuery}
                      onChange={(e) => setLessonQuery(e.target.value)}
                      placeholder="بحث في الدروس بالعنوان..."
                    />
                    <InputRightElement pointerEvents="none">
                      <Box color={useColorModeValue('gray.500', 'gray.400')}>
                        <FiSearch />
                      </Box>
                    </InputRightElement>
                  </InputGroup>
                  <Tag borderRadius="full" colorScheme="blue" variant="subtle">
                    <TagLabel>الإجمالي: {totalLessons}</TagLabel>
                  </Tag>
                </HStack>

                {filteredLessons.length === 0 ? (
                  <Text fontSize="sm" color={muted}>
                    {lessons.length === 0 ? 'لا يوجد محتوى داخل هذه المجموعة حتى الآن.' : 'لا توجد نتائج للبحث.'}
                  </Text>
                ) : (
                  <Accordion allowMultiple>
                    {filteredLessons.map((l) => {
                      const vCount = safeArray(l.videos).length;
                      const fCount = safeArray(l.files).length;
                      const eCount = safeArray(l.exams).length;
                      const aCount = safeArray(l.assignments).length;
                      const isLessonVisible = Boolean(l.is_visible);

                      return (
                        <AccordionItem
                          key={l.id}
                          border="1px solid"
                          borderColor={borderColor}
                          borderRadius="2xl"
                          overflow="hidden"
                          mb={3}
                          bg={useColorModeValue('white', 'blackAlpha.200')}
                          _hover={{ boxShadow: elevatedShadow }}
                        >
                          <h2>
                            <AccordionButton
                              px={4}
                              py={4}
                              _hover={{ bg: useColorModeValue('blue.50', 'whiteAlpha.100') }}
                            >
                              <Box flex="1" textAlign="right">
                                <HStack justify="space-between" align="start" spacing={3} flexWrap="wrap">
                                  <Box>
                                    <Text fontWeight="bold" noOfLines={1}>
                                      {l.title || '—'}
                                    </Text>
                                    <Text fontSize="sm" color={muted} mt={1} noOfLines={2}>
                                      {l.description || '—'}
                                    </Text>
                                  </Box>
                                  <HStack spacing={2} flexWrap="wrap">
                                    <Badge borderRadius="full" px={3} py={1} bg="blue.500" color="white">
                                      درس #{l.id}
                                    </Badge>
                                    <HStack
                                      spacing={2}
                                      align="center"
                                      px={3}
                                      py={1}
                                      borderRadius="full"
                                      bg={useColorModeValue('blue.50', 'whiteAlpha.100')}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Text fontSize="xs" color={muted}>
                                        ظاهر
                                      </Text>
                                      <Switch
                                        colorScheme="blue"
                                        isChecked={isLessonVisible}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          toggleLessonVisibility({ lesson: l, isVisible: e.target.checked });
                                        }}
                                      />
                                    </HStack>
                                    <Tag size="sm" borderRadius="full" variant="subtle" colorScheme="blue">
                                      <TagLabel>V {vCount}</TagLabel>
                                    </Tag>
                                    <Tag size="sm" borderRadius="full" variant="subtle" colorScheme="blue">
                                      <TagLabel>F {fCount}</TagLabel>
                                    </Tag>
                                    <Tag size="sm" borderRadius="full" variant="subtle" colorScheme="blue">
                                      <TagLabel>E {eCount}</TagLabel>
                                    </Tag>
                                    <Tag size="sm" borderRadius="full" variant="subtle" colorScheme="blue">
                                      <TagLabel>A {aCount}</TagLabel>
                                    </Tag>
                                  </HStack>
                                </HStack>
                              </Box>
                              <AccordionIcon />
                            </AccordionButton>
                          </h2>
                          <AccordionPanel px={4} pb={4}>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                              <Card borderRadius="2xl" border="1px solid" borderColor={borderColor} bg={softBlue}>
                                <CardBody>
                                  <HStack spacing={3}>
                                    <Box p={2} borderRadius="xl" bg="white" color={primary}>
                                      <Icon as={FiFilm} />
                                    </Box>
                                    <Box>
                                      <Text fontSize="xs" color={muted}>
                                        الفيديوهات
                                      </Text>
                                      <Text fontWeight="bold">{vCount}</Text>
                                    </Box>
                                  </HStack>
                                </CardBody>
                              </Card>

                              <Card borderRadius="2xl" border="1px solid" borderColor={borderColor} bg={softBlue}>
                                <CardBody>
                                  <HStack spacing={3}>
                                    <Box p={2} borderRadius="xl" bg="white" color={primary}>
                                      <Icon as={FiFileText} />
                                    </Box>
                                    <Box>
                                      <Text fontSize="xs" color={muted}>
                                        الملفات
                                      </Text>
                                      <Text fontWeight="bold">{fCount}</Text>
                                    </Box>
                                  </HStack>
                                </CardBody>
                              </Card>

                              <Card borderRadius="2xl" border="1px solid" borderColor={borderColor} bg={softBlue}>
                                <CardBody>
                                  <HStack spacing={3}>
                                    <Box p={2} borderRadius="xl" bg="white" color={primary}>
                                      <Icon as={FiClipboard} />
                                    </Box>
                                    <Box>
                                      <Text fontSize="xs" color={muted}>
                                        الامتحانات
                                      </Text>
                                      <Text fontWeight="bold">{eCount}</Text>
                                    </Box>
                                  </HStack>
                                </CardBody>
                              </Card>

                              <Card borderRadius="2xl" border="1px solid" borderColor={borderColor} bg={softBlue}>
                                <CardBody>
                                  <HStack spacing={3}>
                                    <Box p={2} borderRadius="xl" bg="white" color={primary}>
                                      <Icon as={FiCheckSquare} />
                                    </Box>
                                    <Box>
                                      <Text fontSize="xs" color={muted}>
                                        الواجبات
                                      </Text>
                                      <Text fontWeight="bold">{aCount}</Text>
                                    </Box>
                                  </HStack>
                                </CardBody>
                              </Card>
                            </SimpleGrid>

                            <Divider my={4} />

                            {/* Manage content UI */}
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                              {/* Videos */}
                              <Card borderRadius="2xl" border="1px solid" borderColor={borderColor} bg={useColorModeValue('white', 'blackAlpha.200')}>
                                <CardBody>
                                  <HStack justify="space-between" mb={3} flexWrap="wrap" spacing={2}>
                                    <HStack>
                                      <Icon as={FiFilm} color={primary} />
                                      <Text fontWeight="bold">الفيديوهات</Text>
                                    </HStack>
                                    <Button size="sm" leftIcon={<FiPlus />} colorScheme="blue" onClick={() => openContentModal({ type: 'video', mode: 'create', lesson: l })}>
                                      إضافة
                                    </Button>
                                  </HStack>
                                  <Stack spacing={2}>
                                    {safeArray(l.videos).length === 0 && (
                                      <Text fontSize="sm" color={muted}>
                                        لا يوجد فيديوهات.
                                      </Text>
                                    )}
                                    {safeArray(l.videos).map((v) => (
                                      <Card key={v.id} borderRadius="xl" border="1px solid" borderColor={borderColor}>
                                        <CardBody>
                                          <HStack justify="space-between" align="start" spacing={3} flexWrap="wrap">
                                            <Box>
                                              <Text fontWeight="bold" noOfLines={1}>{v.title || '—'}</Text>
                                              <Text fontSize="xs" color={muted} mt={1} noOfLines={1}>
                                                {v.video_url || v.url || '—'}
                                              </Text>
                                            </Box>
                                            <HStack spacing={2}>
                                              {(v.video_url || v.url) && (
                                                <IconButton
                                                  as="a"
                                                  href={v.video_url || v.url}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  aria-label="Open link"
                                                  icon={<FiLink />}
                                                  size="sm"
                                                  variant="ghost"
                                                />
                                              )}
                                              <IconButton
                                                aria-label="Edit"
                                                icon={<FiEdit2 />}
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => openContentModal({ type: 'video', mode: 'edit', lesson: l, item: v })}
                                              />
                                              <IconButton
                                                aria-label="Delete"
                                                icon={<FiTrash2 />}
                                                size="sm"
                                                colorScheme="red"
                                                variant="ghost"
                                                onClick={() => confirmDelete({ type: 'video', item: v })}
                                              />
                                            </HStack>
                                          </HStack>
                                        </CardBody>
                                      </Card>
                                    ))}
                                  </Stack>
                                </CardBody>
                              </Card>

                              {/* Files */}
                              <Card borderRadius="2xl" border="1px solid" borderColor={borderColor} bg={useColorModeValue('white', 'blackAlpha.200')}>
                                <CardBody>
                                  <HStack justify="space-between" mb={3} flexWrap="wrap" spacing={2}>
                                    <HStack>
                                      <Icon as={FiFileText} color={primary} />
                                      <Text fontWeight="bold">ملفات PDF</Text>
                                    </HStack>
                                    <Button size="sm" leftIcon={<FiPlus />} colorScheme="blue" onClick={() => openContentModal({ type: 'file', mode: 'create', lesson: l })}>
                                      إضافة
                                    </Button>
                                  </HStack>
                                  <Stack spacing={2}>
                                    {safeArray(l.files).length === 0 && (
                                      <Text fontSize="sm" color={muted}>
                                        لا يوجد ملفات.
                                      </Text>
                                    )}
                                    {safeArray(l.files).map((f) => (
                                      <Card key={f.id} borderRadius="xl" border="1px solid" borderColor={borderColor}>
                                        <CardBody>
                                          <HStack justify="space-between" align="start" spacing={3} flexWrap="wrap">
                                            <Box>
                                              <Text fontWeight="bold" noOfLines={1}>{f.title || '—'}</Text>
                                              <Text fontSize="xs" color={muted} mt={1} noOfLines={1}>
                                                {f.file_url || f.url || '—'}
                                              </Text>
                                            </Box>
                                            <HStack spacing={2}>
                                              {(f.file_url || f.url) && (
                                                <IconButton
                                                  as="a"
                                                  href={f.file_url || f.url}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  aria-label="Open link"
                                                  icon={<FiLink />}
                                                  size="sm"
                                                  variant="ghost"
                                                />
                                              )}
                                              <IconButton
                                                aria-label="Edit"
                                                icon={<FiEdit2 />}
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => openContentModal({ type: 'file', mode: 'edit', lesson: l, item: f })}
                                              />
                                              <IconButton
                                                aria-label="Delete"
                                                icon={<FiTrash2 />}
                                                size="sm"
                                                colorScheme="red"
                                                variant="ghost"
                                                onClick={() => confirmDelete({ type: 'file', item: f })}
                                              />
                                            </HStack>
                                          </HStack>
                                        </CardBody>
                                      </Card>
                                    ))}
                                  </Stack>
                                </CardBody>
                              </Card>

                              {/* Assignments */}
                              <Card borderRadius="2xl" border="1px solid" borderColor={borderColor} bg={useColorModeValue('white', 'blackAlpha.200')}>
                                <CardBody>
                                  <HStack justify="space-between" mb={3} flexWrap="wrap" spacing={2}>
                                    <HStack>
                                      <Icon as={FiCheckSquare} color={primary} />
                                      <Text fontWeight="bold">الواجبات</Text>
                                    </HStack>
                                    <Button size="sm" leftIcon={<FiPlus />} colorScheme="blue" onClick={() => openContentModal({ type: 'assignment', mode: 'create', lesson: l })}>
                                      إنشاء
                                    </Button>
                                  </HStack>
                                  <Stack spacing={2}>
                                    {safeArray(l.assignments).length === 0 && (
                                      <Text fontSize="sm" color={muted}>
                                        لا يوجد واجبات.
                                      </Text>
                                    )}
                                    {safeArray(l.assignments).map((a) => (
                                      <Card key={a.id} borderRadius="xl" border="1px solid" borderColor={borderColor}>
                                        <CardBody>
                                          <HStack justify="space-between" align="start" spacing={3} flexWrap="wrap" mb={2}>
                                            <Box>
                                              <Text fontWeight="bold" noOfLines={1}>{a.name || '—'}</Text>
                                              <Text fontSize="xs" color={muted} mt={1}>
                                                {`المدة: ${a.duration_minutes ?? '—'} دقيقة • الأسئلة: ${a.questions_count ?? '—'}`}
                                              </Text>
                                            </Box>
                                            <HStack spacing={2} align="center">
                                              <HStack spacing={2} align="center">
                                                <Text fontSize="xs" color={muted}>مرئي</Text>
                                                <Switch
                                                  colorScheme="blue"
                                                  isChecked={Boolean(a.is_visible)}
                                                  onChange={(e) => toggleVisibility({ type: 'assignment', item: a, isVisible: e.target.checked })}
                                                />
                                              </HStack>
                                              <IconButton
                                                aria-label="Edit"
                                                icon={<FiEdit2 />}
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => openContentModal({ type: 'assignment', mode: 'edit', lesson: l, item: a })}
                                              />
                                              <IconButton
                                                aria-label="Delete"
                                                icon={<FiTrash2 />}
                                                size="sm"
                                                colorScheme="red"
                                                variant="ghost"
                                                onClick={() => confirmDelete({ type: 'assignment', item: a })}
                                              />
                                            </HStack>
                                          </HStack>
                                        </CardBody>
                                      </Card>
                                    ))}
                                  </Stack>
                                </CardBody>
                              </Card>

                              {/* Exams */}
                              <Card borderRadius="2xl" border="1px solid" borderColor={borderColor} bg={useColorModeValue('white', 'blackAlpha.200')}>
                                <CardBody>
                                  <HStack justify="space-between" mb={3} flexWrap="wrap" spacing={2}>
                                    <HStack>
                                      <Icon as={FiClipboard} color={primary} />
                                      <Text fontWeight="bold">الامتحانات</Text>
                                    </HStack>
                                    <Button size="sm" leftIcon={<FiPlus />} colorScheme="blue" onClick={() => openContentModal({ type: 'exam', mode: 'create', lesson: l })}>
                                      إنشاء
                                    </Button>
                                  </HStack>
                                  <Stack spacing={2}>
                                    {safeArray(l.exams).length === 0 && (
                                      <Text fontSize="sm" color={muted}>
                                        لا يوجد امتحانات.
                                      </Text>
                                    )}
                                    {safeArray(l.exams).map((ex) => (
                                      <Card key={ex.id} borderRadius="xl" border="1px solid" borderColor={borderColor}>
                                        <CardBody>
                                          <HStack justify="space-between" align="start" spacing={3} flexWrap="wrap" mb={2}>
                                            <Box>
                                              <Text fontWeight="bold" noOfLines={1}>{ex.title || '—'}</Text>
                                              <Text fontSize="xs" color={muted} mt={1}>
                                                {`المدة: ${ex.duration ?? '—'} دقيقة • الدرجة: ${ex.total_marks ?? '—'}`}
                                              </Text>
                                            </Box>
                                            <HStack spacing={2} align="center">
                                              <HStack spacing={2} align="center">
                                                <Text fontSize="xs" color={muted}>مرئي</Text>
                                                <Switch
                                                  colorScheme="blue"
                                                  isChecked={Boolean(ex.is_visible)}
                                                  onChange={(e) => toggleVisibility({ type: 'exam', item: ex, isVisible: e.target.checked })}
                                                />
                                              </HStack>
                                              <IconButton
                                                aria-label="Edit"
                                                icon={<FiEdit2 />}
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => openContentModal({ type: 'exam', mode: 'edit', lesson: l, item: ex })}
                                              />
                                              <IconButton
                                                aria-label="Delete"
                                                icon={<FiTrash2 />}
                                                size="sm"
                                                colorScheme="red"
                                                variant="ghost"
                                                onClick={() => confirmDelete({ type: 'exam', item: ex })}
                                              />
                                            </HStack>
                                          </HStack>
                                        </CardBody>
                                      </Card>
                                    ))}
                                  </Stack>
                                </CardBody>
                              </Card>
                            </SimpleGrid>
                          </AccordionPanel>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </CardBody>
            </Card>
          </Stack>
        )}

        {/* Create lesson modal */}
        <Modal isOpen={isCreateLessonOpen} onClose={onCloseCreateLesson} size="lg">
          <ModalOverlay />
          <ModalContent borderRadius="2xl">
            <ModalHeader>
              <HStack spacing={3}>
                <Badge bg="blue.500" color="white" borderRadius="full" px={3} py={1}>
                  جديد
                </Badge>
                <Text>إنشاء درس</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>عنوان الدرس</FormLabel>
                  <Input
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="الدرس الأول – النحو"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>الوصف</FormLabel>
                  <Textarea
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="شرح أدوات الاستفهام"
                    rows={4}
                  />
                </FormControl>
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onCloseCreateLesson}>
                إلغاء
              </Button>
              <Button colorScheme="blue" onClick={handleCreateLesson} isLoading={lessonSaving}>
                حفظ
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Content create/edit modal */}
        <Modal isOpen={isContentModalOpen} onClose={onCloseContentModal} size="lg">
          <ModalOverlay />
          <ModalContent borderRadius="2xl">
            <ModalHeader>
              <HStack spacing={3} flexWrap="wrap">
                <Badge bg="blue.500" color="white" borderRadius="full" px={3} py={1}>
                  {contentMode === 'create' ? 'إضافة' : 'تعديل'}
                </Badge>
                <Text>
                  {contentType === 'video'
                    ? 'فيديو'
                    : contentType === 'file'
                      ? 'ملف'
                      : contentType === 'assignment'
                        ? 'واجب'
                        : 'امتحان'}
                </Text>
                {activeLesson?.title && (
                  <Tag size="sm" borderRadius="full" variant="subtle" colorScheme="blue">
                    <TagLabel>{activeLesson.title}</TagLabel>
                  </Tag>
                )}
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={4}>
                {contentType === 'video' && (
                  <>
                    <FormControl isRequired>
                      <FormLabel>عنوان الفيديو</FormLabel>
                      <Input value={contentForm.title || ''} onChange={(e) => setContentForm((p) => ({ ...p, title: e.target.value }))} />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>رابط الفيديو</FormLabel>
                      <Input value={contentForm.video_url || ''} onChange={(e) => setContentForm((p) => ({ ...p, video_url: e.target.value }))} placeholder="https://..." />
                    </FormControl>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl>
                        <FormLabel>المدة (دقيقة)</FormLabel>
                        <NumberInput value={contentForm.duration_minutes ?? ''} onChange={(v) => setContentForm((p) => ({ ...p, duration_minutes: v }))} min={0}>
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                      <FormControl>
                        <FormLabel>الترتيب</FormLabel>
                        <NumberInput value={contentForm.order_index ?? 0} onChange={(v) => setContentForm((p) => ({ ...p, order_index: v }))} min={0}>
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                    </SimpleGrid>
                  </>
                )}

                {contentType === 'file' && (
                  <>
                    <FormControl isRequired>
                      <FormLabel>عنوان الملف</FormLabel>
                      <Input value={contentForm.title || ''} onChange={(e) => setContentForm((p) => ({ ...p, title: e.target.value }))} />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>رابط الملف (PDF)</FormLabel>
                      <Input value={contentForm.file_url || ''} onChange={(e) => setContentForm((p) => ({ ...p, file_url: e.target.value }))} placeholder="https://..." />
                      <FormHelperText>يفضل رابط مباشر للـ PDF.</FormHelperText>
                    </FormControl>
                  </>
                )}

                {contentType === 'assignment' && (
                  <>
                    <FormControl isRequired>
                      <FormLabel>اسم الواجب</FormLabel>
                      <Input value={contentForm.name || ''} onChange={(e) => setContentForm((p) => ({ ...p, name: e.target.value }))} />
                    </FormControl>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl>
                        <FormLabel>المدة (دقيقة)</FormLabel>
                        <NumberInput value={contentForm.duration_minutes ?? ''} onChange={(v) => setContentForm((p) => ({ ...p, duration_minutes: v }))} min={0}>
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                      <FormControl>
                        <FormLabel>عدد الأسئلة</FormLabel>
                        <NumberInput value={contentForm.questions_count ?? ''} onChange={(v) => setContentForm((p) => ({ ...p, questions_count: v }))} min={0}>
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                    </SimpleGrid>
                    <Alert status="info" borderRadius="xl">
                      <AlertIcon />
                      <AlertDescription>
                        الواجب يتم إنشاؤه مخفيًا عن الطالب تلقائياً.
                      </AlertDescription>
                    </Alert>
                  </>
                )}

                {contentType === 'exam' && (
                  <>
                    <FormControl isRequired>
                      <FormLabel>عنوان الامتحان</FormLabel>
                      <Input value={contentForm.title || ''} onChange={(e) => setContentForm((p) => ({ ...p, title: e.target.value }))} />
                    </FormControl>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl>
                        <FormLabel>المدة (دقيقة)</FormLabel>
                        <NumberInput value={contentForm.duration ?? ''} onChange={(v) => setContentForm((p) => ({ ...p, duration: v }))} min={0}>
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                      <FormControl>
                        <FormLabel>الدرجة الكلية</FormLabel>
                        <NumberInput value={contentForm.total_marks ?? ''} onChange={(v) => setContentForm((p) => ({ ...p, total_marks: v }))} min={0}>
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                    </SimpleGrid>
                  </>
                )}
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onCloseContentModal}>
                إلغاء
              </Button>
              <Button colorScheme="blue" onClick={handleSaveContent} isLoading={contentSaving}>
                حفظ
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* General content (group files / group exams) modal */}
        <Modal isOpen={isGeneralOpen} onClose={onCloseGeneral} size="lg">
          <ModalOverlay />
          <ModalContent borderRadius="2xl">
            <ModalHeader>
              <HStack spacing={3} flexWrap="wrap">
                <Badge bg="blue.500" color="white" borderRadius="full" px={3} py={1}>
                  {generalMode === 'create' ? 'إضافة' : 'تعديل'}
                </Badge>
                <Text>{generalType === 'file' ? 'ملف PDF عام' : 'امتحان عام'}</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={4}>
                {generalType === 'file' && (
                  <>
                    <FormControl isRequired>
                      <FormLabel>عنوان الملف</FormLabel>
                      <Input
                        value={generalForm.title || ''}
                        onChange={(e) => setGeneralForm((p) => ({ ...p, title: e.target.value }))}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>رابط الملف (PDF)</FormLabel>
                      <Input
                        value={generalForm.file_url || ''}
                        onChange={(e) => setGeneralForm((p) => ({ ...p, file_url: e.target.value }))}
                        placeholder="https://..."
                      />
                      <FormHelperText>يفضل رابط مباشر للـ PDF.</FormHelperText>
                    </FormControl>
                    <FormControl>
                      <FormLabel>الترتيب</FormLabel>
                      <NumberInput
                        value={generalForm.order_index ?? 0}
                        onChange={(v) => setGeneralForm((p) => ({ ...p, order_index: v }))}
                        min={0}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                  </>
                )}

                {generalType === 'exam' && (
                  <>
                    <FormControl isRequired>
                      <FormLabel>عنوان الامتحان</FormLabel>
                      <Input
                        value={generalForm.title || ''}
                        onChange={(e) => setGeneralForm((p) => ({ ...p, title: e.target.value }))}
                      />
                    </FormControl>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl>
                        <FormLabel>المدة (دقيقة)</FormLabel>
                        <NumberInput
                          value={generalForm.duration ?? ''}
                          onChange={(v) => setGeneralForm((p) => ({ ...p, duration: v }))}
                          min={0}
                        >
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                      <FormControl>
                        <FormLabel>الدرجة الكلية</FormLabel>
                        <NumberInput
                          value={generalForm.total_marks ?? ''}
                          onChange={(v) => setGeneralForm((p) => ({ ...p, total_marks: v }))}
                          min={0}
                        >
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                    </SimpleGrid>
                  </>
                )}
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onCloseGeneral}>
                إلغاء
              </Button>
              <Button colorScheme="blue" onClick={handleSaveGeneral} isLoading={generalSaving}>
                حفظ
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete confirm */}
        <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={deleteCancelRef} onClose={onCloseDelete} isCentered>
          <AlertDialogOverlay />
          <AlertDialogContent borderRadius="2xl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              تأكيد الحذف
            </AlertDialogHeader>
            <AlertDialogBody>
              هل أنت متأكد من حذف{' '}
              <Text as="span" fontWeight="bold">
                {deleteTarget?.title || 'العنصر'}
              </Text>
              ؟
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={deleteCancelRef} onClick={onCloseDelete} variant="ghost">
                إلغاء
              </Button>
              <Button colorScheme="red" onClick={handleDelete} isLoading={deleteSaving} ml={3}>
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Container>
    </Box>
  );
};

export default GroupDetails;


