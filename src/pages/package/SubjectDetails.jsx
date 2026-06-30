import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Alert,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDescription,
  AlertIcon,
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Checkbox,
  CheckboxGroup,
  Container,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Tag,
  TagLabel,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  Wrap,
  WrapItem,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiRefreshCw,
  FiUsers,
  FiList,
  FiMoreVertical,
  FiSearch,
  FiTrash2,
  FiUserX,
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

const ROLE_META = {
  admin: {
    label: 'مسؤول',
    colorScheme: 'purple',
    hint: 'إدارة مجموعات المادة وإنشاء مجموعات وإضافة طلاب.',
  },
  teacher: {
    label: 'مدرس',
    colorScheme: 'blue',
    hint: 'عرض مجموعاتك فقط داخل هذه المادة وعرض طلاب كل مجموعة.',
  },
  student: {
    label: 'طالب',
    colorScheme: 'green',
    hint: 'عرض مجموعتك فقط والجدول الخاص بك.',
  },
  unknown: {
    label: 'مستخدم',
    colorScheme: 'gray',
    hint: '',
  },
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`,
  };
};

const safeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const parseStudentIds = (text) => {
  // supports: "1,2 3\n4"
  const parts = String(text || '')
    .split(/[\s,]+/g)
    .map((p) => p.trim())
    .filter(Boolean);

  const ids = parts
    .map((p) => safeNumber(p))
    .filter((n) => n !== null)
    .map((n) => Math.trunc(n))
    .filter((n) => n > 0);

  // de-dup
  return Array.from(new Set(ids));
};

const normalizeGroup = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const teacher = raw.teacher || raw.teacher_data || raw.teacherInfo || null;
  const teacherName = teacher?.name || raw.teacher_name || raw.teacherName || null;
  return {
    id: raw.id ?? raw.group_id ?? raw.groupId,
    name: raw.name ?? raw.group_name ?? '—',
    createdAt: raw.created_at ?? raw.createdAt ?? raw.created_at_human ?? null,
    teacher: teacher,
    teacherName: teacherName,
    raw,
  };
};

const normalizeStudent = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: raw.id ?? raw.student_id ?? raw.studentId,
    name: raw.name ?? raw.student_name ?? '—',
    phone: raw.phone ?? raw.student_phone ?? '—',
    addedAt: raw.added_at ?? raw.created_at ?? raw.joined_at ?? null,
    raw,
  };
};

const normalizeWaitingStudent = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: raw.id ?? raw.student_id ?? raw.studentId,
    name: raw.name ?? raw.student_name ?? '—',
    email: raw.email ?? raw.student_email ?? '—',
    phone: raw.phone ?? raw.student_phone ?? '—',
    avatar: raw.avatar ?? null,
    activatedAt: raw.activated_at ?? raw.activatedAt ?? null,
    raw,
  };
};

const get403StudentMessage = (apiMessage) => {
  const msg = String(apiMessage || '').toLowerCase();
  const arabic = String(apiMessage || '');

  // best-effort classification based on typical backend messages
  const looksNotActive =
    msg.includes('active') ||
    msg.includes('activate') ||
    msg.includes('not active') ||
    arabic.includes('غير مفع') ||
    arabic.includes('غير مفعل') ||
    arabic.includes('غير مُفع') ||
    arabic.includes('غير مُفعل') ||
    arabic.includes('تفعيل');

  if (looksNotActive) {
    return 'الباقة غير مفعّلة لهذه المادة. لو معاك كود تفعيل فعّل الباقة ثم أعد المحاولة.';
  }

  return 'لم يتم إضافتك لأي مجموعة داخل هذه المادة حتى الآن. تواصل مع الإدارة/المدرس.';
};

const formatScheduleDays = (days) => {
  if (!Array.isArray(days) || days.length === 0) return null;
  return days.map((d) => WEEKDAY_LABELS[d] || d).join(' - ');
};

const formatScheduleTime = (time) => {
  const t = String(time || '').trim();
  return t || null;
};

const EmptyState = ({ title, description, onRetry, retryLabel = 'إعادة المحاولة' }) => (
  <Card borderRadius="2xl">
    <CardBody>
      <Stack spacing={2} align="center" textAlign="center" py={6}>
        <Heading size="sm">{title}</Heading>
        {description && (
          <Text fontSize="sm" color="gray.500">
            {description}
          </Text>
        )}
        {onRetry && (
          <Button mt={2} size="sm" leftIcon={<FiRefreshCw />} variant="outline" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </Stack>
    </CardBody>
  </Card>
);

const SectionHeader = ({ title, description, right }) => (
  <HStack justify="space-between" align="start" spacing={3} flexWrap="wrap">
    <Box>
      <Heading size="md">{title}</Heading>
      {description && (
        <Text mt={1} fontSize="sm" color="gray.500">
          {description}
        </Text>
      )}
    </Box>
    {right}
  </HStack>
);

const SubjectDetails = () => {
  const { id: subjectIdParam } = useParams();
  const subjectId = useMemo(() => String(subjectIdParam || ''), [subjectIdParam]);
  const navigate = useNavigate();
  const toast = useToast();
  const [userData, isAdmin, isTeacher, isStudent] = UserType();

  const role = useMemo(() => {
    if (isAdmin) return 'admin';
    if (isTeacher) return 'teacher';
    if (isStudent) return 'student';
    return userData?.role || 'unknown';
  }, [isAdmin, isTeacher, isStudent, userData?.role]);

  // Theme
  const pageBg = useColorModeValue('#F6F8FF', 'gray.950');
  const cardBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('blackAlpha.200', 'whiteAlpha.200');
  const muted = useColorModeValue('gray.600', 'gray.400');
  const heroBg = useColorModeValue('white', 'gray.900');
  const heroBorder = useColorModeValue('blackAlpha.200', 'whiteAlpha.200');
  const primary = useColorModeValue('blue.600', 'blue.300');
  const primarySoftBg = useColorModeValue('blue.50', 'whiteAlpha.50');
  const headerText = useColorModeValue('white', 'white');
  const elevatedShadow = useColorModeValue('0 12px 30px rgba(15, 23, 42, 0.10)', '0 12px 30px rgba(0,0,0,0.40)');

  // Data states
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState(null);
  const [groupQuery, setGroupQuery] = useState('');

  // Waiting students (Admin)
  const [waitingStudents, setWaitingStudents] = useState([]);
  const [waitingTotal, setWaitingTotal] = useState(0);
  const [waitingLoading, setWaitingLoading] = useState(false);
  const [waitingError, setWaitingError] = useState(null);
  const [waitingQuery, setWaitingQuery] = useState('');

  // Add waiting-student to group (Admin)
  const {
    isOpen: isAddWaitingOpen,
    onOpen: onAddWaitingOpen,
    onClose: onAddWaitingClose,
  } = useDisclosure();
  const [addWaitingStudent, setAddWaitingStudent] = useState(null);
  const [addWaitingGroupId, setAddWaitingGroupId] = useState('');
  const [addWaitingSaving, setAddWaitingSaving] = useState(false);

  const [studentGroup, setStudentGroup] = useState(null);
  const [studentSchedule, setStudentSchedule] = useState([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState(null);
  const [studentEmptyMessage, setStudentEmptyMessage] = useState(null);

  // Teachers (Admin create group)
  const [teachers, setTeachers] = useState([]);
  const [teachersLoading, setTeachersLoading] = useState(false);

  // Create group modal
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();
  const [createSaving, setCreateSaving] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    teacher_id: '',
    schedule_days: [],
    schedule_time: '',
  });

  // Edit group modal (Admin)
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const [editSaving, setEditSaving] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    teacher_id: '',
    schedule_days: [],
    schedule_time: '',
  });

  // Delete group confirm (Admin)
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [deleteGroup, setDeleteGroup] = useState(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  // Unassign teacher confirm (Admin)
  const {
    isOpen: isUnassignTeacherOpen,
    onOpen: onUnassignTeacherOpen,
    onClose: onUnassignTeacherClose,
  } = useDisclosure();
  const [unassignTeacherGroup, setUnassignTeacherGroup] = useState(null);
  const [unassignTeacherSaving, setUnassignTeacherSaving] = useState(false);

  // Manage students modal (Admin)
  const {
    isOpen: isManageStudentsOpen,
    onOpen: onManageStudentsOpen,
    onClose: onManageStudentsClose,
  } = useDisclosure();
  const [manageGroup, setManageGroup] = useState(null);
  const [studentIdsText, setStudentIdsText] = useState('');
  const [addStudentsSaving, setAddStudentsSaving] = useState(false);

  // View students modal (Admin + Teacher)
  const {
    isOpen: isViewStudentsOpen,
    onOpen: onViewStudentsOpen,
    onClose: onViewStudentsClose,
  } = useDisclosure();
  const [viewGroup, setViewGroup] = useState(null);
  const [groupStudents, setGroupStudents] = useState([]);
  const [groupStudentsLoading, setGroupStudentsLoading] = useState(false);
  const [groupStudentsError, setGroupStudentsError] = useState(null);

  // Remove student confirm (Admin)
  const {
    isOpen: isRemoveStudentOpen,
    onOpen: onRemoveStudentOpen,
    onClose: onRemoveStudentClose,
  } = useDisclosure();
  const [removeStudentSaving, setRemoveStudentSaving] = useState(false);
  const [removeStudentTarget, setRemoveStudentTarget] = useState(null); // { id, name }

  const cancelRef = useRef();
  const deleteCancelRef = useRef();
  const unassignTeacherCancelRef = useRef();
  const removeStudentCancelRef = useRef();

  const fetchTeachers = async () => {
    try {
      setTeachersLoading(true);
      const res = await baseUrl.get(`/api/users/teachers`, {
        headers: getAuthHeaders(),
      });
      setTeachers(res.data?.teachers || []);
    } catch (e) {
      toast({
        title: 'تعذر جلب المدرسين',
        description: e?.response?.data?.message || 'حدث خطأ أثناء تحميل قائمة المدرسين',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setTeachersLoading(false);
    }
  };

  const fetchGroupsForRole = async () => {
    if (!subjectId) return;
    setGroupsError(null);
    setGroupsLoading(true);
    try {
      const url =
        role === 'admin'
          ? `/api/subjects/${subjectId}/groups`
          : role === 'teacher'
            ? `/api/subjects/${subjectId}/groups/mine`
            : null;

      if (!url) return;

      const res = await baseUrl.get(url, { headers: getAuthHeaders() });
      const rawGroups = res.data?.groups || res.data?.data?.groups || [];
      const normalized = rawGroups.map(normalizeGroup).filter(Boolean);
      setGroups(normalized);
    } catch (e) {
      setGroupsError(e?.response?.data?.message || 'حدث خطأ أثناء تحميل المجموعات');
      setGroups([]);
    } finally {
      setGroupsLoading(false);
    }
  };

  const fetchWaitingStudents = async () => {
    if (!subjectId) return;
    if (role !== 'admin') return;
    setWaitingError(null);
    setWaitingLoading(true);
    try {
      const res = await baseUrl.get(`/api/subjects/${subjectId}/waiting-students`, {
        headers: getAuthHeaders(),
      });
      const raw = res.data?.students || [];
      const normalized = raw.map(normalizeWaitingStudent).filter(Boolean);
      setWaitingStudents(normalized);
      setWaitingTotal(Number(res.data?.total) || normalized.length || 0);
    } catch (e) {
      setWaitingError(e?.response?.data?.message || e?.response?.data?.error || 'حدث خطأ أثناء تحميل قائمة الانتظار');
      setWaitingStudents([]);
      setWaitingTotal(0);
    } finally {
      setWaitingLoading(false);
    }
  };

  const fetchMyStudentGroup = async () => {
    if (!subjectId) return;
    setStudentError(null);
    setStudentEmptyMessage(null);
    setStudentLoading(true);
    try {
      const res = await baseUrl.get(`/api/subjects/${subjectId}/my-group`, {
        headers: getAuthHeaders(),
      });

      const g = normalizeGroup(res.data?.group);
      const schedule = Array.isArray(res.data?.schedule) ? res.data.schedule : [];
      setStudentGroup(g);
      setStudentSchedule(schedule);

      if (!g) {
        setStudentEmptyMessage('لم يتم العثور على مجموعة مرتبطة بحسابك في هذه المادة.');
      }
    } catch (e) {
      const status = e?.response?.status;
      const apiMessage = e?.response?.data?.message;
      if (status === 403) {
        setStudentEmptyMessage(get403StudentMessage(apiMessage));
      } else {
        setStudentError(apiMessage || 'حدث خطأ أثناء تحميل مجموعة الطالب');
      }
      setStudentGroup(null);
      setStudentSchedule([]);
    } finally {
      setStudentLoading(false);
    }
  };

  const refresh = async () => {
    if (role === 'student') return fetchMyStudentGroup();
    if (role === 'admin') {
      await Promise.all([fetchGroupsForRole(), fetchWaitingStudents()]);
      return;
    }
    return fetchGroupsForRole();
  };

  useEffect(() => {
    if (!subjectId) return;
    if (role === 'student') {
      fetchMyStudentGroup();
    } else if (role === 'admin' || role === 'teacher') {
      fetchGroupsForRole();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, role]);

  useEffect(() => {
    if (!subjectId) return;
    if (role === 'admin') fetchWaitingStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, role]);

  useEffect(() => {
    if (isCreateOpen && role === 'admin' && teachers.length === 0) {
      fetchTeachers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateOpen, role]);

  useEffect(() => {
    if (isEditOpen && role === 'admin' && teachers.length === 0) {
      fetchTeachers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditOpen, role]);

  const openManageStudents = (group) => {
    setManageGroup(group);
    setStudentIdsText('');
    onManageStudentsOpen();
  };

  const openEditGroup = (group) => {
    setEditGroup(group);
    setEditForm({
      name: String(group?.name || ''),
      teacher_id: group?.raw?.teacher_id ? String(group.raw.teacher_id) : '',
      schedule_days: Array.isArray(group?.raw?.schedule_days) ? group.raw.schedule_days : [],
      schedule_time: group?.raw?.schedule_time ? String(group.raw.schedule_time) : '',
    });
    onEditOpen();
  };

  const openDeleteGroup = (group) => {
    setDeleteGroup(group);
    onDeleteOpen();
  };

  const openUnassignTeacher = (group) => {
    setUnassignTeacherGroup(group);
    onUnassignTeacherOpen();
  };

  const openViewStudents = async (group) => {
    setViewGroup(group);
    setGroupStudents([]);
    setGroupStudentsError(null);
    onViewStudentsOpen();

    setGroupStudentsLoading(true);
    try {
      const res = await baseUrl.get(
        `/api/subjects/${subjectId}/groups/${group.id}/students`,
        { headers: getAuthHeaders() }
      );
      const rawStudents = res.data?.students || res.data?.data?.students || [];
      const normalized = rawStudents.map(normalizeStudent).filter(Boolean);
      setGroupStudents(normalized);
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || 'تعذر تحميل طلاب المجموعة';
      setGroupStudentsError(msg);
      if (status === 403) {
        toast({
          title: 'غير مسموح',
          description: msg || 'ليس لديك صلاحية لعرض طلاب هذه المجموعة',
          status: 'error',
          duration: 4000,
          isClosable: true,
          position: 'top-right',
        });
      }
    } finally {
      setGroupStudentsLoading(false);
    }
  };

  const handleUnassignTeacher = async () => {
    if (role !== 'admin') return;
    const groupId = unassignTeacherGroup?.id;
    if (!subjectId || !groupId) return;

    try {
      setUnassignTeacherSaving(true);
      const res = await baseUrl.delete(`/api/subjects/${subjectId}/groups/${groupId}/teacher`, {
        headers: getAuthHeaders(),
      });

      toast({
        title: 'تم بنجاح',
        description: res.data?.message || 'تم إلغاء تعيين المدرس من المجموعة بنجاح',
        status: 'success',
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      });

      onUnassignTeacherClose();
      setUnassignTeacherGroup(null);
      await fetchGroupsForRole();
    } catch (e) {
      toast({
        title: 'فشل إلغاء تعيين المدرس',
        description: e?.response?.data?.message || e?.response?.data?.error || 'حدث خطأ أثناء تنفيذ العملية',
        status: 'error',
        duration: 4500,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setUnassignTeacherSaving(false);
    }
  };

  const openRemoveStudent = (student) => {
    setRemoveStudentTarget({
      id: student?.id,
      name: student?.name,
    });
    onRemoveStudentOpen();
  };

  const handleRemoveStudent = async () => {
    if (role !== 'admin') return;
    const groupId = viewGroup?.id;
    const studentId = removeStudentTarget?.id;
    if (!subjectId || !groupId || !studentId) return;

    try {
      setRemoveStudentSaving(true);
      const res = await baseUrl.delete(
        `/api/subjects/${subjectId}/groups/${groupId}/students/${studentId}`,
        { headers: getAuthHeaders() }
      );

      toast({
        title: 'تم الحذف',
        description: res.data?.message || 'تم حذف الطالب من المجموعة بنجاح',
        status: 'success',
        duration: 3500,
        isClosable: true,
        position: 'top-right',
      });

      // Update current modal list immediately
      setGroupStudents((prev) => prev.filter((s) => String(s?.id) !== String(studentId)));
      onRemoveStudentClose();
      setRemoveStudentTarget(null);
    } catch (e) {
      const apiError = e?.response?.data?.error;
      const apiMessage = e?.response?.data?.message;
      toast({
        title: 'فشل حذف الطالب',
        description: apiError || apiMessage || 'حدث خطأ أثناء حذف الطالب',
        status: 'error',
        duration: 4500,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setRemoveStudentSaving(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!createForm.name.trim()) {
      toast({
        title: 'بيانات ناقصة',
        description: 'اسم المجموعة مطلوب',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }

    const payload = {
      name: createForm.name.trim(),
    };

    const teacherId = safeNumber(createForm.teacher_id);
    if (teacherId) payload.teacher_id = teacherId;

    if (Array.isArray(createForm.schedule_days) && createForm.schedule_days.length > 0) {
      payload.schedule_days = createForm.schedule_days;
    }

    if (String(createForm.schedule_time || '').trim()) {
      payload.schedule_time = String(createForm.schedule_time).trim();
    }

    try {
      setCreateSaving(true);
      await baseUrl.post(`/api/subjects/${subjectId}/groups`, payload, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });
      toast({
        title: 'تم إنشاء المجموعة',
        description: 'تم الحفظ بنجاح',
        status: 'success',
        duration: 3500,
        isClosable: true,
        position: 'top-right',
      });
      onCreateClose();
      setCreateForm({
        name: '',
        teacher_id: '',
        schedule_days: [],
        schedule_time: '',
      });
      await fetchGroupsForRole();
    } catch (e) {
      toast({
        title: 'فشل إنشاء المجموعة',
        description: e?.response?.data?.message || 'حدث خطأ أثناء الحفظ',
        status: 'error',
        duration: 4500,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setCreateSaving(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!editGroup?.id) return;

    const payload = {};
    if (String(editForm.name || '').trim()) payload.name = String(editForm.name).trim();

    const teacherId = safeNumber(editForm.teacher_id);
    if (teacherId) payload.teacher_id = teacherId;
    if (editForm.teacher_id === '') {
      // If you want to clear teacher, backend may or may not accept null.
      // We won't send teacher_id in that case to avoid accidental clearing.
    }

    if (Array.isArray(editForm.schedule_days) && editForm.schedule_days.length > 0) {
      payload.schedule_days = editForm.schedule_days;
    }

    if (String(editForm.schedule_time || '').trim()) {
      payload.schedule_time = String(editForm.schedule_time).trim();
    }

    if (Object.keys(payload).length === 0) {
      toast({
        title: 'لا توجد تغييرات',
        description: 'قم بتعديل حقل واحد على الأقل ثم احفظ.',
        status: 'info',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }

    try {
      setEditSaving(true);
      await baseUrl.put(`/api/subjects/${subjectId}/groups/${editGroup.id}`, payload, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      toast({
        title: 'تم تحديث المجموعة',
        description: 'تم الحفظ بنجاح',
        status: 'success',
        duration: 3500,
        isClosable: true,
        position: 'top-right',
      });
      onEditClose();
      setEditGroup(null);
      await fetchGroupsForRole();
    } catch (e) {
      toast({
        title: 'فشل تحديث المجموعة',
        description: e?.response?.data?.message || 'حدث خطأ أثناء الحفظ',
        status: 'error',
        duration: 4500,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroup?.id) return;
    try {
      setDeleteSaving(true);
      await baseUrl.delete(`/api/subjects/${subjectId}/groups/${deleteGroup.id}`, {
        headers: getAuthHeaders(),
      });
      toast({
        title: 'تم حذف المجموعة',
        description: 'تم الحذف بنجاح',
        status: 'success',
        duration: 3500,
        isClosable: true,
        position: 'top-right',
      });
      onDeleteClose();
      setDeleteGroup(null);
      await fetchGroupsForRole();
    } catch (e) {
      toast({
        title: 'فشل حذف المجموعة',
        description: e?.response?.data?.message || 'حدث خطأ أثناء الحذف',
        status: 'error',
        duration: 4500,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setDeleteSaving(false);
    }
  };

  const handleAddStudents = async () => {
    if (!manageGroup?.id) return;
    const ids = parseStudentIds(studentIdsText);
    if (ids.length === 0) {
      toast({
        title: 'بيانات ناقصة',
        description: 'أدخل Student IDs (مثال: 108, 109)',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      return;
    }

    try {
      setAddStudentsSaving(true);
      const res = await baseUrl.post(
        `/api/subjects/${subjectId}/groups/${manageGroup.id}/students`,
        { student_ids: ids },
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        }
      );

      const added = Number.isFinite(Number(res.data?.added)) ? Number(res.data?.added) : null;
      const notSubscribed = Array.isArray(res.data?.not_subscribed_student_ids)
        ? res.data.not_subscribed_student_ids
        : [];

      const addedCount = added !== null ? added : Math.max(0, ids.length - notSubscribed.length);
      const notSubscribedCount = notSubscribed.length;

      const notSubscribedPreview =
        notSubscribedCount > 0
          ? ` (${notSubscribed.slice(0, 10).join(', ')}${notSubscribedCount > 10 ? '...' : ''})`
          : '';

      const lines = [];
      if (addedCount > 0) lines.push(`تمت إضافة ${addedCount} طالب/طلاب بنجاح.`);
      if (notSubscribedCount > 0) lines.push(`تم تخطي ${notSubscribedCount} طالب/طلاب غير مشتركين في الباقة${notSubscribedPreview}.`);
      if (lines.length === 0) lines.push(res.data?.message || 'تم تنفيذ العملية.');

      const status = notSubscribedCount > 0 ? (addedCount > 0 ? 'warning' : 'info') : 'success';

      toast({
        title: notSubscribedCount > 0 ? 'تمت العملية مع تنبيه' : 'تمت إضافة الطلاب',
        description: lines.join(' '),
        status,
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });

      onManageStudentsClose();
    } catch (e) {
      toast({
        title: 'فشل إضافة الطلاب',
        description: e?.response?.data?.message || 'حدث خطأ أثناء الإضافة',
        status: 'error',
        duration: 4500,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setAddStudentsSaving(false);
    }
  };

  const openAddWaitingToGroup = (student) => {
    setAddWaitingStudent(student);
    setAddWaitingGroupId('');
    onAddWaitingOpen();
  };

  const handleAddWaitingToGroup = async () => {
    if (role !== 'admin') return;
    const studentId = addWaitingStudent?.id;
    const groupId = String(addWaitingGroupId || '').trim();
    if (!subjectId || !studentId || !groupId) return;

    try {
      setAddWaitingSaving(true);
      const res = await baseUrl.post(
        `/api/subjects/${subjectId}/groups/${groupId}/students`,
        { student_ids: [studentId] },
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        }
      );

      const added = Number.isFinite(Number(res.data?.added)) ? Number(res.data?.added) : null;
      const notSubscribed = Array.isArray(res.data?.not_subscribed_student_ids)
        ? res.data.not_subscribed_student_ids
        : [];

      if (notSubscribed.length > 0) {
        toast({
          title: 'تمت العملية مع تنبيه',
          description: `تم تخطي الطالب #${studentId} لأنه غير مشترك في الباقة.`,
          status: 'warning',
          duration: 5000,
          isClosable: true,
          position: 'top-right',
        });
        return;
      }

      toast({
        title: 'تمت الإضافة',
        description: added !== null ? `تمت إضافة الطالب بنجاح (added: ${added}).` : 'تمت إضافة الطالب بنجاح.',
        status: 'success',
        duration: 3500,
        isClosable: true,
        position: 'top-right',
      });

      // Remove from waiting list
      setWaitingStudents((prev) => prev.filter((s) => String(s?.id) !== String(studentId)));
      setWaitingTotal((prev) => Math.max(0, Number(prev || 0) - 1));

      onAddWaitingClose();
      setAddWaitingStudent(null);
      setAddWaitingGroupId('');
    } catch (e) {
      toast({
        title: 'فشل إضافة الطالب',
        description: e?.response?.data?.message || e?.response?.data?.error || 'حدث خطأ أثناء الإضافة',
        status: 'error',
        duration: 4500,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setAddWaitingSaving(false);
    }
  };

  const roleMeta = ROLE_META[role] || ROLE_META.unknown;
  const filteredGroups = useMemo(() => {
    const q = String(groupQuery || '').trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => {
      const name = String(g?.name || '').toLowerCase();
      const teacher = String(g?.teacherName || '').toLowerCase();
      return name.includes(q) || teacher.includes(q) || String(g?.id || '').includes(q);
    });
  }, [groups, groupQuery]);

  const filteredWaitingStudents = useMemo(() => {
    const q = String(waitingQuery || '').trim().toLowerCase();
    if (!q) return waitingStudents;
    return waitingStudents.filter((s) => {
      const name = String(s?.name || '').toLowerCase();
      const email = String(s?.email || '').toLowerCase();
      const phone = String(s?.phone || '').toLowerCase();
      const id = String(s?.id || '');
      return name.includes(q) || email.includes(q) || phone.includes(q) || id.includes(q);
    });
  }, [waitingQuery, waitingStudents]);

  const stats = useMemo(() => {
    if (role === 'student') {
      const hasGroup = Boolean(studentGroup);
      return [
        { label: 'الحالة', value: hasGroup ? 'داخل مجموعة' : 'بدون مجموعة' },
        { label: 'عدد المحاضرات', value: String(studentSchedule?.length || 0) },
      ];
    }

    const total = groups.length;
    const withTeachers = groups.filter((g) => Boolean(g.teacherName)).length;
    const withoutTeachers = total - withTeachers;
    return [
      { label: 'إجمالي المجموعات', value: String(total) },
      { label: 'مع مدرس', value: String(withTeachers) },
      { label: 'بدون مدرس', value: String(withoutTeachers) },
    ];
  }, [groups, role, studentGroup, studentSchedule]);

  return (
    <Box minH="100vh" py={10} bg={pageBg} dir="rtl" className='mt-[80px]'>
      <Container maxW="6xl">
        {/* Hero */}
        <Card
          bg={heroBg}
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
              'linear(to-r, blue.600, blue.800)'
            )}
            color={headerText}
          >
            <HStack justify="space-between" align="start" spacing={4} flexWrap="wrap">
              <HStack spacing={4} align="center">
                <Avatar name={roleMeta.label} size="md" bg="whiteAlpha.300" />
                <Box>
                  <Heading size="lg">مجموعات المادة داخل الباقة</Heading>
                  <Text mt={1} fontSize="sm" opacity={0.9}>
                    {roleMeta.hint}
                  </Text>
                </Box>
              </HStack>

              <Wrap justify="flex-end" spacing={2}>
                <WrapItem>
                  <Tag bg="whiteAlpha.300" borderRadius="full" px={3} py={1}>
                    <TagLabel>
                      المادة #{subjectId || '—'}
                    </TagLabel>
                  </Tag>
                </WrapItem>
                <WrapItem>
                  <Tag bg="whiteAlpha.300" borderRadius="full" px={3} py={1}>
                    <TagLabel>{roleMeta.label}</TagLabel>
                  </Tag>
                </WrapItem>
              </Wrap>
            </HStack>
          </Box>

          <CardBody>
            <SimpleGrid columns={{ base: 2, md: role === 'student' ? 2 : 3 }} spacing={3}>
              {stats.map((s) => (
                <Card
                  key={s.label}
                  bg={useColorModeValue('gray.50', 'whiteAlpha.50')}
                  borderRadius="2xl"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <CardBody>
                    <Text fontSize="xs" color={muted}>
                      {s.label}
                    </Text>
                    <Heading mt={1} size="md" color={primary}>
                      {s.value}
                    </Heading>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>

            <HStack mt={5} spacing={2} flexWrap="wrap">
              <Button
                leftIcon={<FiRefreshCw />}
                variant="outline"
                onClick={refresh}
                isLoading={role === 'student' ? studentLoading : groupsLoading}
              >
                تحديث
              </Button>

              {role === 'admin' && (
                <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onCreateOpen}>
                  إنشاء مجموعة
                </Button>
              )}
            </HStack>
          </CardBody>
        </Card>

        {(role === 'admin' || role === 'teacher') && (
          <Accordion allowMultiple defaultIndex={role === 'admin' ? [0, 1] : [0]} reduceMotion>
            {/* Admin: Waiting students (first) */}
            {role === 'admin' && (
              <AccordionItem border="0" mb={5}>
                <h2>
                  <AccordionButton
                    bg={cardBg}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="3xl"
                    px={6}
                    py={5}
                    _hover={{ bg: useColorModeValue('blackAlpha.50', 'whiteAlpha.50') }}
                  >
                    <HStack justify="space-between" w="full" spacing={3} flexWrap="wrap">
                      <HStack spacing={3} flexWrap="wrap">
                        <Heading size="md">قائمة الانتظار</Heading>
                        <Badge colorScheme="orange" borderRadius="full" px={3} py={1}>
                          الإجمالي: {waitingTotal}
                        </Badge>
                      </HStack>
                      <AccordionIcon />
                    </HStack>
                  </AccordionButton>
                </h2>
                <AccordionPanel px={0} pt={4} pb={0}>
                  <Card bg={cardBg} borderRadius="3xl" border="1px solid" borderColor={borderColor}>
                    <CardBody>
                      <Stack spacing={5}>
                        <SectionHeader
                          title="قائمة الانتظار"
                          description="طلاب مفعّلين لكن لم يتم إضافتهم لأي مجموعة داخل هذه المادة."
                          right={
                            <HStack spacing={2} flexWrap="wrap">
                              <Badge colorScheme="orange" borderRadius="full" px={3} py={1}>
                                الإجمالي: {waitingTotal}
                              </Badge>
                              <InputGroup size="sm" w={{ base: 'full', md: '280px' }}>
                                <Input
                                  value={waitingQuery}
                                  onChange={(e) => setWaitingQuery(e.target.value)}
                                  placeholder="بحث بالاسم / الهاتف / الإيميل / ID"
                                  bg={useColorModeValue('white', 'blackAlpha.300')}
                                  borderColor={borderColor}
                                />
                                <InputRightElement pointerEvents="none">
                                  <Box color={useColorModeValue('gray.500', 'gray.400')}>
                                    <FiSearch />
                                  </Box>
                                </InputRightElement>
                              </InputGroup>
                              <Button
                                size="sm"
                                leftIcon={<FiRefreshCw />}
                                variant="outline"
                                onClick={fetchWaitingStudents}
                                isLoading={waitingLoading}
                              >
                                تحديث
                              </Button>
                            </HStack>
                          }
                        />

                        {waitingLoading && (
                          <Flex justify="center" py={6}>
                            <Spinner />
                          </Flex>
                        )}

                        {!waitingLoading && waitingError && (
                          <Alert status="error" borderRadius="2xl">
                            <AlertIcon />
                            <Flex justify="space-between" align="center" w="full" gap={3} flexWrap="wrap">
                              <AlertDescription>{waitingError}</AlertDescription>
                              <Button size="sm" variant="outline" leftIcon={<FiRefreshCw />} onClick={fetchWaitingStudents}>
                                إعادة المحاولة
                              </Button>
                            </Flex>
                          </Alert>
                        )}

                        {!waitingLoading && !waitingError && waitingStudents.length === 0 && (
                          <EmptyState
                            title="لا توجد قائمة انتظار"
                            description="لا يوجد طلاب في قائمة الانتظار لهذه المادة."
                            onRetry={fetchWaitingStudents}
                          />
                        )}

                        {!waitingLoading && !waitingError && filteredWaitingStudents.length === 0 && waitingStudents.length > 0 && (
                          <EmptyState
                            title="لا توجد نتائج"
                            description="جرّب تعديل كلمة البحث أو مسحها لعرض كل الطلاب."
                            onRetry={() => setWaitingQuery('')}
                            retryLabel="مسح البحث"
                          />
                        )}

                        {!waitingLoading && !waitingError && filteredWaitingStudents.length > 0 && (
                          <Box border="1px solid" borderColor={borderColor} borderRadius="2xl" overflow="hidden">
                            <Table size="sm" variant="simple">
                              <Thead bg={useColorModeValue('gray.50', 'whiteAlpha.50')}>
                                <Tr>
                                  <Th>الطالب</Th>
                                  <Th>الهاتف</Th>
                                  <Th>الإيميل</Th>
                                  <Th>تاريخ التفعيل</Th>
                                  <Th>إجراءات</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {filteredWaitingStudents.map((s) => (
                                  <Tr key={s.id || `${s.name}-${s.phone}`}>
                                    <Td>
                                      <HStack spacing={3}>
                                        <Avatar size="sm" name={s.name} src={s.avatar || undefined} />
                                        <Box>
                                          <Text fontWeight="bold" fontSize="sm">
                                            {s.name}
                                          </Text>
                                          <Text fontSize="xs" color={muted}>
                                            #{s.id}
                                          </Text>
                                        </Box>
                                      </HStack>
                                    </Td>
                                    <Td>{s.phone || '—'}</Td>
                                    <Td>{s.email || '—'}</Td>
                                    <Td>{s.activatedAt ? dayjs(s.activatedAt).format('YYYY-MM-DD HH:mm') : '—'}</Td>
                                    <Td>
                                      <Button
                                        size="xs"
                                        colorScheme="blue"
                                        variant="solid"
                                        onClick={() => openAddWaitingToGroup(s)}
                                        isDisabled={!s?.id}
                                      >
                                        إضافة للجروب
                                      </Button>
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </Box>
                        )}
                      </Stack>
                    </CardBody>
                  </Card>
                </AccordionPanel>
              </AccordionItem>
            )}

            {/* Groups */}
            <AccordionItem border="0" mb={5}>
              <h2>
                <AccordionButton
                  bg={cardBg}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="3xl"
                  px={6}
                  py={5}
                  _hover={{ bg: useColorModeValue('blackAlpha.50', 'whiteAlpha.50') }}
                >
                  <HStack justify="space-between" w="full" spacing={3} flexWrap="wrap">
                    <HStack spacing={3} flexWrap="wrap">
                      <Heading size="md">المجموعات</Heading>
                      <Badge colorScheme="blue" borderRadius="full" px={3} py={1}>
                        {groups.length}
                      </Badge>
                    </HStack>
                    <AccordionIcon />
                  </HStack>
                </AccordionButton>
              </h2>
              <AccordionPanel px={0} pt={4} pb={0}>
                <Card bg={cardBg} borderRadius="3xl" border="1px solid" borderColor={borderColor}>
                  <CardBody>
                    <Stack spacing={5}>
                      <SectionHeader
                        title="المجموعات"
                        description={role === 'admin' ? 'عرض وإدارة كل المجموعات داخل المادة.' : 'هذه هي مجموعاتك داخل المادة.'}
                        right={
                          <HStack spacing={2} flexWrap="wrap">
                            <InputGroup size="sm" w={{ base: 'full', md: '280px' }}>
                              <Input
                                value={groupQuery}
                                onChange={(e) => setGroupQuery(e.target.value)}
                                placeholder="بحث باسم المجموعة / المدرس / ID"
                                bg={useColorModeValue('white', 'blackAlpha.300')}
                                borderColor={borderColor}
                              />
                              <InputRightElement pointerEvents="none">
                                <Box color={useColorModeValue('gray.500', 'gray.400')}>
                                  <FiSearch />
                                </Box>
                              </InputRightElement>
                            </InputGroup>
                            <Button
                              size="sm"
                              leftIcon={<FiRefreshCw />}
                              variant="outline"
                              onClick={refresh}
                              isLoading={groupsLoading}
                            >
                              تحديث
                            </Button>
                            {role === 'admin' && (
                              <Button size="sm" leftIcon={<FiPlus />} colorScheme="blue" onClick={onCreateOpen}>
                                إنشاء
                              </Button>
                            )}
                          </HStack>
                        }
                      />

                      {groupsLoading && (
                        <Stack spacing={4}>
                          <Card borderRadius="2xl">
                            <CardBody>
                              <Skeleton height="16px" width="30%" />
                              <SkeletonText mt="4" noOfLines={3} spacing="3" />
                            </CardBody>
                          </Card>
                          <Card borderRadius="2xl">
                            <CardBody>
                              <Skeleton height="16px" width="35%" />
                              <SkeletonText mt="4" noOfLines={3} spacing="3" />
                            </CardBody>
                          </Card>
                        </Stack>
                      )}

                      {!groupsLoading && groupsError && (
                        <Alert status="error" borderRadius="2xl">
                          <AlertIcon />
                          <Flex justify="space-between" align="center" w="full" gap={3} flexWrap="wrap">
                            <AlertDescription>{groupsError}</AlertDescription>
                            <Button size="sm" variant="outline" leftIcon={<FiRefreshCw />} onClick={refresh}>
                              إعادة المحاولة
                            </Button>
                          </Flex>
                        </Alert>
                      )}

                      {!groupsLoading && !groupsError && groups.length === 0 && (
                        <EmptyState
                          title="لا توجد مجموعات بعد"
                          description="ابدأ بإنشاء أول مجموعة ثم اربطها بمدرس (اختياري) وأضف الطلاب."
                          onRetry={refresh}
                        />
                      )}

                      {!groupsLoading && !groupsError && filteredGroups.length === 0 && groups.length > 0 && (
                        <EmptyState
                          title="لا توجد نتائج"
                          description="جرّب تعديل كلمة البحث أو مسحها لعرض كل المجموعات."
                          onRetry={() => setGroupQuery('')}
                          retryLabel="مسح البحث"
                        />
                      )}

                      {!groupsLoading && !groupsError && filteredGroups.length > 0 && (
                        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
                          {filteredGroups.map((g) => {
                            const days = formatScheduleDays(g.raw?.schedule_days);
                            const time = formatScheduleTime(g.raw?.schedule_time);
                            const scheduleSummary = days || time ? `${days || ''}${days && time ? ' • ' : ''}${time || ''}` : null;
                            const groupDetailsPath = `/subject/${subjectId}/groups/${g.id}`;

                            return (
                              <Card
                                key={g.id}
                                borderRadius="3xl"
                                border="1px solid"
                                borderColor={borderColor}
                                bg={cardBg}
                                overflow="hidden"
                                transition="all 160ms ease"
                                cursor="pointer"
                                _hover={{
                                  transform: 'translateY(-2px)',
                                  boxShadow: elevatedShadow,
                                  borderColor: useColorModeValue('blue.200', 'blue.600'),
                                }}
                                onClick={() => navigate(groupDetailsPath)}
                              >
                                {/* Premium header strip */}
                                <Box
                                  px={4}
                                  py={3}
                                  bgGradient={useColorModeValue(
                                    'linear(to-r, blue.500, blue.700)',
                                    'linear(to-r, blue.700, blue.900)'
                                  )}
                                  color="white"
                                >
                                  <HStack justify="space-between" align="center">
                                    <HStack spacing={3}>
                                      <Avatar size="sm" name={g.name} bg="whiteAlpha.300" />
                                      <Box>
                                        <Text fontWeight="bold" noOfLines={1}>
                                          {g.name}
                                        </Text>
                                        <Text fontSize="xs" opacity={0.9}>
                                          المجموعة #{g.id}
                                        </Text>
                                      </Box>
                                    </HStack>

                                    <Menu placement="bottom-end">
                                      <MenuButton
                                        as={IconButton}
                                        aria-label="Actions"
                                        icon={<FiMoreVertical />}
                                        size="sm"
                                        variant="ghost"
                                        color="white"
                                        _hover={{ bg: 'whiteAlpha.200' }}
                                        _active={{ bg: 'whiteAlpha.300' }}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <MenuList onClick={(e) => e.stopPropagation()}>
                                        <MenuItem as={RouterLink} to={groupDetailsPath}>
                                          صفحة المجموعة
                                        </MenuItem>
                                        {role === 'admin' && (
                                          <MenuItem onClick={() => openEditGroup(g)}>
                                            تعديل المجموعة
                                          </MenuItem>
                                        )}
                                        {role === 'admin' && Boolean(g?.raw?.teacher_id || g?.teacherName) && (
                                          <MenuItem
                                            icon={<FiUserX />}
                                            onClick={() => openUnassignTeacher(g)}
                                          >
                                            إلغاء تعيين المدرس
                                          </MenuItem>
                                        )}
                                        {role === 'admin' && (
                                          <MenuItem icon={<FiUsers />} onClick={() => openManageStudents(g)}>
                                            إدارة الطلاب
                                          </MenuItem>
                                        )}
                                        <MenuItem icon={<FiList />} onClick={() => openViewStudents(g)}>
                                          عرض الطلاب
                                        </MenuItem>
                                        {role === 'admin' && (
                                          <MenuItem color="red.500" onClick={() => openDeleteGroup(g)}>
                                            حذف المجموعة
                                          </MenuItem>
                                        )}
                                      </MenuList>
                                    </Menu>
                                  </HStack>
                                </Box>

                                <CardBody>
                                  <Stack spacing={4}>
                                    <Box>
                                      <Text fontSize="xs" color={muted}>
                                        المدرس
                                      </Text>
                                      <Text fontWeight="semibold">
                                        {g.teacherName || '—'}
                                      </Text>
                                    </Box>

                                    <Box>
                                      <Text fontSize="xs" color={muted} mb={2}>
                                        الجدول
                                      </Text>
                                      <HStack spacing={2} flexWrap="wrap">
                                        {g.raw?.schedule_days?.length > 0 && (
                                          <Tag size="sm" borderRadius="full" colorScheme="blue">
                                            <TagLabel>{formatScheduleDays(g.raw?.schedule_days)}</TagLabel>
                                          </Tag>
                                        )}
                                        {g.raw?.schedule_time && (
                                          <Tag size="sm" borderRadius="full" variant="subtle" colorScheme="blue">
                                            <TagLabel>{formatScheduleTime(g.raw?.schedule_time)}</TagLabel>
                                          </Tag>
                                        )}
                                        {!scheduleSummary && (
                                          <Tag size="sm" borderRadius="full" variant="subtle">
                                            <TagLabel>بدون جدول</TagLabel>
                                          </Tag>
                                        )}
                                      </HStack>
                                    </Box>

                                    <Divider />

                                    <HStack justify="space-between" flexWrap="wrap">
                                      <Text fontSize="xs" color={muted}>
                                        تاريخ الإنشاء: {g.createdAt ? dayjs(g.createdAt).format('YYYY-MM-DD HH:mm') : '—'}
                                      </Text>
                                      <HStack spacing={2}>
                                        {role === 'admin' && (
                                          <Button
                                            size="sm"
                                            colorScheme="blue"
                                            variant="solid"
                                            leftIcon={<FiUsers />}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openManageStudents(g);
                                            }}
                                          >
                                            الطلاب
                                          </Button>
                                        )}
                                        <Button
                                          size="sm"
                                          colorScheme="blue"
                                          variant="outline"
                                          leftIcon={<FiList />}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openViewStudents(g);
                                          }}
                                        >
                                          عرض
                                        </Button>
                                      </HStack>
                                    </HStack>
                                  </Stack>
                                </CardBody>
                              </Card>
                            );
                          })}
                        </SimpleGrid>
                      )}
                    </Stack>
                  </CardBody>
                </Card>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        )}

        {role === 'student' && (
          <Accordion allowToggle defaultIndex={[0]} reduceMotion>
            <AccordionItem border="0" mb={5}>
              <h2>
                <AccordionButton
                  bg={cardBg}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="3xl"
                  px={6}
                  py={5}
                  _hover={{ bg: useColorModeValue('blackAlpha.50', 'whiteAlpha.50') }}
                >
                  <HStack justify="space-between" w="full" spacing={3}>
                    <Heading size="md">مجموعتي</Heading>
                    <AccordionIcon />
                  </HStack>
                </AccordionButton>
              </h2>
              <AccordionPanel px={0} pt={4} pb={0}>
                <Card bg={cardBg} borderRadius="3xl" border="1px solid" borderColor={borderColor}>
                  <CardBody>
                    <Stack spacing={5}>
                      <SectionHeader
                        title="مجموعتي"
                        description="هنا ستجد تفاصيل مجموعتك والجدول الخاص بك."
                        right={
                          <Button
                            size="sm"
                            leftIcon={<FiRefreshCw />}
                            variant="outline"
                            onClick={refresh}
                            isLoading={studentLoading}
                          >
                            تحديث
                          </Button>
                        }
                      />

                  {studentLoading && (
                    <Stack spacing={4}>
                      <Card borderRadius="2xl">
                        <CardBody>
                          <Skeleton height="16px" width="40%" />
                          <SkeletonText mt="4" noOfLines={3} spacing="3" />
                        </CardBody>
                      </Card>
                    </Stack>
                  )}

                  {!studentLoading && studentError && (
                    <Alert status="error" borderRadius="2xl">
                      <AlertIcon />
                      <Flex justify="space-between" align="center" w="full" gap={3} flexWrap="wrap">
                        <AlertDescription>{studentError}</AlertDescription>
                        <Button size="sm" variant="outline" leftIcon={<FiRefreshCw />} onClick={refresh}>
                          إعادة المحاولة
                        </Button>
                      </Flex>
                    </Alert>
                  )}

                  {!studentLoading && !studentError && studentEmptyMessage && (
                    <EmptyState title="لا يمكن عرض المجموعة" description={studentEmptyMessage} onRetry={refresh} />
                  )}

                  {!studentLoading && !studentError && studentGroup && (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Card borderRadius="2xl" border="1px solid" borderColor={borderColor}>
                        <CardBody>
                          <Stack spacing={3}>
                            <HStack justify="space-between" align="start">
                              <Box>
                                <Heading size="sm">{studentGroup.name}</Heading>
                                <Text fontSize="sm" color={muted} mt={1}>
                                  المدرس: <Text as="span" fontWeight="bold">{studentGroup.teacherName || '—'}</Text>
                                </Text>
                              </Box>
                              <Badge colorScheme="green" borderRadius="full" px={3} py={1}>
                                مجموعتك
                              </Badge>
                            </HStack>

                            {(studentGroup.raw?.schedule_days || studentGroup.raw?.schedule_time) && (
                              <Box>
                                <Text fontSize="xs" color={muted}>
                                  الأيام: {formatScheduleDays(studentGroup.raw?.schedule_days) || '—'}
                                </Text>
                                <Text fontSize="xs" color={muted} mt={1}>
                                  الوقت: {formatScheduleTime(studentGroup.raw?.schedule_time) || '—'}
                                </Text>
                              </Box>
                            )}

                            <Divider />
                            <Text fontSize="xs" color={muted}>
                              Group #{studentGroup.id || '—'}
                            </Text>
                          </Stack>
                        </CardBody>
                      </Card>

                      <Card borderRadius="2xl" border="1px solid" borderColor={borderColor}>
                        <CardBody>
                          <Stack spacing={3}>
                            <Heading size="sm">جدول المحاضرات</Heading>

                            {(!studentSchedule || studentSchedule.length === 0) && (
                              <Text fontSize="sm" color={muted}>
                                لا يوجد جدول محاضرات مسجل لهذه المجموعة.
                              </Text>
                            )}

                            {studentSchedule && studentSchedule.length > 0 && (
                              <Box border="1px solid" borderColor={borderColor} borderRadius="2xl" overflow="hidden">
                                <Table size="sm" variant="simple">
                                  <Thead bg={useColorModeValue('gray.50', 'whiteAlpha.50')}>
                                    <Tr>
                                      <Th>العنوان</Th>
                                      <Th>اليوم</Th>
                                      <Th>الوقت</Th>
                                    </Tr>
                                  </Thead>
                                  <Tbody>
                                    {studentSchedule.map((s, idx) => {
                                      const starts = s.starts_at ? dayjs(s.starts_at) : null;
                                      const ends = s.ends_at ? dayjs(s.ends_at) : null;
                                      const day = starts ? starts.format('YYYY-MM-DD') : '—';
                                      const time =
                                        starts && ends
                                          ? `${starts.format('HH:mm')} → ${ends.format('HH:mm')}`
                                          : starts
                                            ? starts.format('HH:mm')
                                            : '—';

                                      return (
                                        <Tr key={`${idx}-${s.title || 'schedule'}`}>
                                          <Td>{s.title || '—'}</Td>
                                          <Td>{day}</Td>
                                          <Td>{time}</Td>
                                        </Tr>
                                      );
                                    })}
                                  </Tbody>
                                </Table>
                              </Box>
                            )}
                          </Stack>
                        </CardBody>
                      </Card>
                    </SimpleGrid>
                  )}
                    </Stack>
                  </CardBody>
                </Card>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        )}

        {/* Admin: Create group modal */}
        <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack spacing={3}>
                <Badge bg="blue.500" color="white" borderRadius="full" px={3} py={1}>
                  جديد
                </Badge>
                <Text>إنشاء مجموعة</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={4}>
                <Card borderRadius="2xl" border="1px solid" borderColor={borderColor}>
                  <CardBody>
                    <Stack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>اسم المجموعة</FormLabel>
                        <Input
                          value={createForm.name}
                          onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                          placeholder="مثال: Group A"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>المدرس (اختياري)</FormLabel>
                        <Select
                          value={createForm.teacher_id}
                          onChange={(e) => setCreateForm((p) => ({ ...p, teacher_id: e.target.value }))}
                          placeholder={teachersLoading ? 'جاري تحميل المدرسين...' : 'بدون مدرس'}
                          isDisabled={teachersLoading}
                        >
                          {(teachers || []).map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} (#{t.id})
                            </option>
                          ))}
                        </Select>
                        <FormHelperText>يمكن تركه فارغًا ثم إضافة المدرس لاحقًا.</FormHelperText>
                      </FormControl>
                    </Stack>
                  </CardBody>
                </Card>

                <Card borderRadius="2xl" border="1px solid" borderColor={borderColor} bg={primarySoftBg}>
                  <CardBody>
                    <Stack spacing={4}>
                      <HStack justify="space-between" align="center" flexWrap="wrap">
                        <Heading size="sm">الجدول (اختياري)</Heading>
                        <Tag size="sm" borderRadius="full">
                          <TagLabel>
                            {createForm.schedule_days?.length ? `${createForm.schedule_days.length} أيام` : 'بدون أيام'}
                            {createForm.schedule_time ? ` • ${createForm.schedule_time}` : ''}
                          </TagLabel>
                        </Tag>
                      </HStack>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                          <FormLabel>أيام الجدول</FormLabel>
                          <CheckboxGroup
                            value={createForm.schedule_days}
                            onChange={(values) =>
                              setCreateForm((p) => ({
                                ...p,
                                schedule_days: values,
                              }))
                            }
                          >
                            <SimpleGrid columns={{ base: 3, md: 4 }} spacing={2}>
                              <Checkbox value="sat">sat</Checkbox>
                              <Checkbox value="sun">sun</Checkbox>
                              <Checkbox value="mon">mon</Checkbox>
                              <Checkbox value="tue">tue</Checkbox>
                              <Checkbox value="wed">wed</Checkbox>
                              <Checkbox value="thu">thu</Checkbox>
                              <Checkbox value="fri">fri</Checkbox>
                            </SimpleGrid>
                          </CheckboxGroup>
                          <FormHelperText>مثال: sat, tue</FormHelperText>
                        </FormControl>

                        <FormControl>
                          <FormLabel>وقت الجدول</FormLabel>
                          <Input
                            type="time"
                            value={createForm.schedule_time}
                            onChange={(e) => setCreateForm((p) => ({ ...p, schedule_time: e.target.value }))}
                          />
                          <FormHelperText>مثال: 20:00</FormHelperText>
                        </FormControl>
                      </SimpleGrid>
                    </Stack>
                  </CardBody>
                </Card>
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onCreateClose}>
                إلغاء
              </Button>
              <Button colorScheme="blue" onClick={handleCreateGroup} isLoading={createSaving}>
                حفظ
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Admin: Edit group modal */}
        <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack spacing={3}>
                <Badge bg="blue.500" color="white" borderRadius="full" px={3} py={1}>
                  تعديل
                </Badge>
                <Text>تعديل المجموعة</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={4}>
                <Text fontSize="sm" color={muted}>
                  المجموعة: <Text as="span" fontWeight="bold">{editGroup?.name || '—'}</Text>
                </Text>

                <Card borderRadius="2xl" border="1px solid" borderColor={borderColor}>
                  <CardBody>
                    <Stack spacing={4}>
                      <FormControl>
                        <FormLabel>اسم المجموعة</FormLabel>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                          placeholder="مثال: Group A - Updated"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>المدرس (اختياري)</FormLabel>
                        <Select
                          value={editForm.teacher_id}
                          onChange={(e) => setEditForm((p) => ({ ...p, teacher_id: e.target.value }))}
                          placeholder={teachersLoading ? 'جاري تحميل المدرسين...' : 'بدون مدرس'}
                          isDisabled={teachersLoading}
                        >
                          {(teachers || []).map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} (#{t.id})
                            </option>
                          ))}
                        </Select>
                        <FormHelperText>يمكنك تغيير المدرس أو تركه بدون تعديل.</FormHelperText>
                      </FormControl>
                    </Stack>
                  </CardBody>
                </Card>

                <Card borderRadius="2xl" border="1px solid" borderColor={borderColor} bg={primarySoftBg}>
                  <CardBody>
                    <Stack spacing={4}>
                      <Heading size="sm">الجدول (اختياري)</Heading>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                          <FormLabel>أيام الجدول</FormLabel>
                          <CheckboxGroup
                            value={editForm.schedule_days}
                            onChange={(values) => setEditForm((p) => ({ ...p, schedule_days: values }))}
                          >
                            <SimpleGrid columns={{ base: 3, md: 4 }} spacing={2}>
                              <Checkbox value="sat">sat</Checkbox>
                              <Checkbox value="sun">sun</Checkbox>
                              <Checkbox value="mon">mon</Checkbox>
                              <Checkbox value="tue">tue</Checkbox>
                              <Checkbox value="wed">wed</Checkbox>
                              <Checkbox value="thu">thu</Checkbox>
                              <Checkbox value="fri">fri</Checkbox>
                            </SimpleGrid>
                          </CheckboxGroup>
                        </FormControl>

                        <FormControl>
                          <FormLabel>وقت الجدول</FormLabel>
                          <Input
                            type="time"
                            value={editForm.schedule_time}
                            onChange={(e) => setEditForm((p) => ({ ...p, schedule_time: e.target.value }))}
                          />
                        </FormControl>
                      </SimpleGrid>
                    </Stack>
                  </CardBody>
                </Card>
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onEditClose}>
                إلغاء
              </Button>
              <Button colorScheme="blue" onClick={handleUpdateGroup} isLoading={editSaving}>
                حفظ التعديل
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Admin: Delete group confirm */}
        <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={deleteCancelRef} onClose={onDeleteClose} isCentered>
          <AlertDialogOverlay />
          <AlertDialogContent borderRadius="2xl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              حذف المجموعة
            </AlertDialogHeader>
            <AlertDialogBody>
              هل أنت متأكد من حذف مجموعة{' '}
              <Text as="span" fontWeight="bold">
                {deleteGroup?.name || '—'}
              </Text>
              ؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={deleteCancelRef} onClick={onDeleteClose} variant="ghost">
                إلغاء
              </Button>
              <Button colorScheme="red" onClick={handleDeleteGroup} isLoading={deleteSaving} ml={3}>
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Admin: Unassign teacher confirm */}
        <AlertDialog
          isOpen={isUnassignTeacherOpen}
          leastDestructiveRef={unassignTeacherCancelRef}
          onClose={onUnassignTeacherClose}
          isCentered
        >
          <AlertDialogOverlay />
          <AlertDialogContent borderRadius="2xl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              إلغاء تعيين المدرس
            </AlertDialogHeader>
            <AlertDialogBody>
              هل أنت متأكد من إلغاء تعيين المدرس من مجموعة{' '}
              <Text as="span" fontWeight="bold">
                {unassignTeacherGroup?.name || '—'}
              </Text>
              ؟
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={unassignTeacherCancelRef} onClick={onUnassignTeacherClose} variant="ghost">
                إلغاء
              </Button>
              <Button
                colorScheme="orange"
                onClick={handleUnassignTeacher}
                isLoading={unassignTeacherSaving}
                ml={3}
              >
                إلغاء التعيين
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Admin: Manage students modal */}
        <Modal isOpen={isManageStudentsOpen} onClose={onManageStudentsClose} size="lg" initialFocusRef={cancelRef}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack spacing={3} flexWrap="wrap">
                <Badge bg="blue.500" color="white" borderRadius="full" px={3} py={1}>
                  Students
                </Badge>
                <Text>إدارة طلاب المجموعة</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={3}>
                <Text fontSize="sm" color={muted}>
                  المجموعة: <Text as="span" fontWeight="bold">{manageGroup?.name || '—'}</Text>
                </Text>
                <FormControl>
                  <FormLabel>Student IDs</FormLabel>
                  <Textarea
                    ref={cancelRef}
                    value={studentIdsText}
                    onChange={(e) => setStudentIdsText(e.target.value)}
                    placeholder="مثال: 108, 109"
                    rows={4}
                  />
                  <FormHelperText>يمكنك إدخال IDs مفصولة بـ comma أو مسافات أو أسطر.</FormHelperText>
                </FormControl>
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onManageStudentsClose}>
                إغلاق
              </Button>
              <Button colorScheme="blue" onClick={handleAddStudents} isLoading={addStudentsSaving}>
                إضافة
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* View students modal */}
        <Modal isOpen={isViewStudentsOpen} onClose={onViewStudentsClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack spacing={3} flexWrap="wrap">
                <Badge bg="blue.500" color="white" borderRadius="full" px={3} py={1}>
                  List
                </Badge>
                <Text>طلاب المجموعة</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={3}>
                <Text fontSize="sm" color={muted}>
                  المجموعة: <Text as="span" fontWeight="bold">{viewGroup?.name || '—'}</Text>
                </Text>

                {groupStudentsLoading && (
                  <Flex justify="center" py={6}>
                    <Spinner />
                  </Flex>
                )}

                {!groupStudentsLoading && groupStudentsError && (
                  <Alert status="error" borderRadius="xl">
                    <AlertIcon />
                    <AlertDescription>{groupStudentsError}</AlertDescription>
                  </Alert>
                )}

                {!groupStudentsLoading && !groupStudentsError && groupStudents.length === 0 && (
                  <Alert status="info" borderRadius="xl">
                    <AlertIcon />
                    <AlertDescription>لا يوجد طلاب داخل هذه المجموعة.</AlertDescription>
                  </Alert>
                )}

                {!groupStudentsLoading && !groupStudentsError && groupStudents.length > 0 && (
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>الاسم</Th>
                        <Th>الهاتف</Th>
                        <Th>تاريخ الإضافة</Th>
                        {role === 'admin' && <Th>إجراءات</Th>}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {groupStudents.map((s) => (
                        <Tr key={s.id || `${s.name}-${s.phone}`}>
                          <Td>{s.name}</Td>
                          <Td>{s.phone}</Td>
                          <Td>{s.addedAt ? dayjs(s.addedAt).format('YYYY-MM-DD HH:mm') : '—'}</Td>
                          {role === 'admin' && (
                            <Td>
                              <IconButton
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                aria-label="حذف الطالب من الجروب"
                                icon={<FiTrash2 />}
                                onClick={() => openRemoveStudent(s)}
                                isDisabled={!s?.id}
                              />
                            </Td>
                          )}
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onViewStudentsClose}>إغلاق</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Admin: Remove student confirm */}
        <AlertDialog
          isOpen={isRemoveStudentOpen}
          leastDestructiveRef={removeStudentCancelRef}
          onClose={onRemoveStudentClose}
          isCentered
        >
          <AlertDialogOverlay />
          <AlertDialogContent borderRadius="2xl">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              حذف طالب من الجروب
            </AlertDialogHeader>
            <AlertDialogBody>
              هل أنت متأكد من حذف الطالب{' '}
              <Text as="span" fontWeight="bold">
                {removeStudentTarget?.name || `#${removeStudentTarget?.id || '—'}`}
              </Text>{' '}
              من الجروب؟
              <Text mt={2} fontSize="sm" color="red.500">
                لا يمكن التراجع عن هذا الإجراء.
              </Text>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={removeStudentCancelRef} onClick={onRemoveStudentClose} variant="ghost">
                إلغاء
              </Button>
              <Button
                colorScheme="red"
                onClick={handleRemoveStudent}
                isLoading={removeStudentSaving}
                ml={3}
              >
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Admin: Add waiting student to group */}
        <Modal isOpen={isAddWaitingOpen} onClose={onAddWaitingClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>إضافة طالب إلى جروب</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={4}>
                <Card borderRadius="2xl" border="1px solid" borderColor={borderColor}>
                  <CardBody>
                    <HStack spacing={3}>
                      <Avatar name={addWaitingStudent?.name || '—'} src={addWaitingStudent?.avatar || undefined} />
                      <Box>
                        <Text fontWeight="bold">{addWaitingStudent?.name || '—'}</Text>
                        <Text fontSize="sm" color={muted}>
                          #{addWaitingStudent?.id || '—'} • {addWaitingStudent?.phone || '—'}
                        </Text>
                      </Box>
                    </HStack>
                  </CardBody>
                </Card>

                <FormControl isRequired>
                  <FormLabel>اختر الجروب</FormLabel>
                  <Select
                    value={addWaitingGroupId}
                    onChange={(e) => setAddWaitingGroupId(e.target.value)}
                    placeholder={groupsLoading ? 'جاري تحميل الجروبات...' : groups.length ? 'اختر جروب' : 'لا توجد جروبات'}
                    isDisabled={groupsLoading || groups.length === 0}
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} (#{g.id})
                      </option>
                    ))}
                  </Select>
                  {groups.length === 0 && (
                    <FormHelperText>أنشئ جروب أولاً أو اضغط تحديث في سيكشن المجموعات.</FormHelperText>
                  )}
                </FormControl>
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onAddWaitingClose}>
                إلغاء
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleAddWaitingToGroup}
                isLoading={addWaitingSaving}
                isDisabled={!addWaitingStudent?.id || !String(addWaitingGroupId || '').trim()}
              >
                إضافة
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
};

export default SubjectDetails;

