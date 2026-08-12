import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Image,
  useColorModeValue,
  Flex,
  Badge,
  Icon,
  Button,
  SimpleGrid,
  Divider,
  Progress,
  Collapse,
  Avatar,
  Link as ChakraLink,
  IconButton,
  Fade, // For smooth transitions
  Spinner,
  Center,
  Skeleton,
  SkeletonText,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Textarea,
  Select,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Container,
  Switch,
  Checkbox,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  FaStar,
  FaUsers,
  FaBookOpen,
  FaChalkboardTeacher,
  FaPlayCircle,
  FaCalendarAlt,
  FaLaptopCode,
  FaArrowRight,
  FaClock,
  FaAngleDown,
  FaAngleUp,
  FaVideo,
  FaCheckCircle,
  FaDownload,
  FaFilePdf,
  FaLightbulb,
  FaGraduationCap, // New: For course completion
  FaRegCalendarCheck, // New: For upcoming live sessions
  FaRegPaperPlane, // For messages
  FaEdit,
  FaTrash,
  FaPlus,
  FaUserGraduate,
  FaPhone,
  FaEnvelope,
  FaCalendar,
  FaKey,
  FaLock, // New: For locked lectures
  FaUnlock, // For unlock
  FaBan, // For block
  FaSearch,
  FaRegFileAlt,
  FaListOl,
  FaTimes,
  FaCheck,
  FaFilm, // For no data component
  FaCog, // For settings
  FaBroadcastTower,
  FaFolderOpen,
  FaTasks,
} from "react-icons/fa";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import baseUrl from "../../api/baseUrl";
import UserType from "../../Hooks/auth/userType";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import CourseHeroSection from "./components/CourseHeroSection";
import CourseContentNav, { SectionPanelHeader } from "./components/CourseContentNav";
import { crContainer } from "./courseTheme";
import LectureCard from "./components/LectureCard";
import LecturesTab from "./components/LecturesTab";
import CourseExamsTab from "./components/CourseExamsTab";
import CourseFilesTab from "./components/CourseFilesTab";
import { useCourseFiles } from "../../Hooks/course/useCourseFiles";
import { useCourseAccessSettings } from "../../Hooks/course/useCourseAccessSettings";
import { useCourseAssignments, courseAssignmentsQueryKey } from "../../Hooks/course/useCourseAssignments";
import { createCourseExam as postCourseExam } from "../../api/courseAccessApi";
import {
  useCourseGroupSettings,
  useTeacherCourseGroups,
} from "../../Hooks/course/useCourseGroups";
import CourseAssignmentsTab from "./components/CourseAssignmentsTab";
import CourseFormModal, {
  CourseModalFieldCard,
  CourseModalFieldLabel,
  useCourseModalInputProps,
} from "../../components/CourseFormModal";
import VideoPlayer from "./components/VideoPlayer";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import CoursePageTour from "../../components/onboarding/CoursePageTour";
import {
  shouldShowCoursePageTour,
  TOUR_SET_SECTION,
  buildLectureTourMeta,
  pickTourLecture,
} from "../../utils/coursePageTour";
import CourseStreams from "../../components/stream/courseStreams";
import StudentStreamsList from "../../components/stream/studentStreamsList";
import eduPlatformLogo from "../../img/2 (5).png";
import { getTenantSubdomain } from "../../utils/tenantHost";
import { fetchTenantPublic } from "../../api/tenantPublicApi";
import {
  readCachedTenantBrandLogo,
  resolveTenantBrandLogo,
} from "../../utils/tenantBrandLogo";

/** يحوّل صورة (رابط خارجي) إلى Data URL حتى لا يفشل html2canvas بسبب CORS */
async function fetchImageAsDataUrl(url) {
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) throw new Error(`فشل تحميل اللوجو: ${response.status}`);
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Modal Components
const LectureModal = ({
  isOpen,
  onClose,
  type,
  data,
  onSubmit,
  loading,
  lectureAccessMode = "always_open",
  groupsEnabled = false,
  availableGroups = [],
}) => {
  const toast = useToast();
  const inputProps = useCourseModalInputProps("blue");
  const requiresExpiry = lectureAccessMode === "time_limited";
  const [formData, setFormData] = useState({
    title: data?.title || "",
    description: data?.description || "",
    position: data?.position || 1,
    expires_at: "",
    access_type: data?.access_type || "all",
    group_ids: Array.isArray(data?.group_ids)
      ? data.group_ids.map(Number)
      : Array.isArray(data?.groups)
        ? data.groups.map((g) => Number(g.id || g.group_id)).filter(Boolean)
        : [],
  });

  useEffect(() => {
    if (data) {
      setFormData({
        title: data.title || "",
        description: data.description || "",
        position: data.position || 1,
        expires_at: data.expires_at
          ? (() => {
              const date = new Date(data.expires_at);
              if (Number.isNaN(date.getTime())) return "";
              const offset = date.getTimezoneOffset();
              const local = new Date(date.getTime() - offset * 60000);
              return local.toISOString().slice(0, 16);
            })()
          : "",
        access_type: data.access_type || "all",
        group_ids: Array.isArray(data.group_ids)
          ? data.group_ids.map(Number)
          : Array.isArray(data.groups)
            ? data.groups.map((g) => Number(g.id || g.group_id)).filter(Boolean)
            : [],
      });
    } else if (isOpen) {
      setFormData({
        title: "",
        description: "",
        position: 1,
        expires_at: "",
        access_type: "all",
        group_ids: [],
      });
    }
  }, [data, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      groupsEnabled &&
      formData.access_type === "groups" &&
      (!Array.isArray(formData.group_ids) || formData.group_ids.length === 0)
    ) {
      toast({
        title: "يجب اختيار مجموعة واحدة على الأقل",
        status: "warning",
        duration: 3500,
        isClosable: true,
      });
      return;
    }
    if (type === "edit") onSubmit(data.id, formData);
    else onSubmit(formData);
  };

  const toggleGroupId = (groupId, checked) => {
    const gid = Number(groupId);
    if (!gid) return;
    setFormData((prev) => ({
      ...prev,
      group_ids: checked
        ? [...new Set([...prev.group_ids, gid])]
        : prev.group_ids.filter((id) => id !== gid),
    }));
  };

  return (
    <CourseFormModal
      isOpen={isOpen}
      onClose={onClose}
      loading={loading}
      icon={FaChalkboardTeacher}
      accent="blue"
      title={type === "add" ? "إضافة محاضرة جديدة" : "تعديل المحاضرة"}
      subtitle={
        type === "add"
          ? "أضف محاضرة للمحتوى وحدد ترتيبها داخل الكورس"
          : "حدّث عنوان المحاضرة ووصفها وترتيبها"
      }
      onSubmit={handleSubmit}
      submitLabel={type === "add" ? "إضافة المحاضرة" : "حفظ التعديلات"}
      loadingText={type === "add" ? "جاري الإضافة..." : "جاري الحفظ..."}
    >
      <VStack spacing={3} align="stretch">
        <CourseModalFieldCard>
          <FormControl isRequired>
            <CourseModalFieldLabel icon={FaChalkboardTeacher}>
              عنوان المحاضرة
            </CourseModalFieldLabel>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="مثال: المحاضرة الأولى — مقدمة"
              isDisabled={loading}
              {...inputProps}
            />
          </FormControl>
        </CourseModalFieldCard>

        <CourseModalFieldCard>
          <FormControl>
            <CourseModalFieldLabel icon={FaRegFileAlt} color="orange">
              وصف المحاضرة (اختياري)
            </CourseModalFieldLabel>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="نبذة قصيرة تظهر للطالب تحت عنوان المحاضرة"
              rows={3}
              isDisabled={loading}
              {...inputProps}
            />
          </FormControl>
        </CourseModalFieldCard>

        <CourseModalFieldCard>
          <FormControl isRequired>
            <CourseModalFieldLabel icon={FaListOl}>
              ترتيب المحاضرة
            </CourseModalFieldLabel>
            <Input
              type="number"
              min={1}
              value={formData.position}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  position: parseInt(e.target.value, 10) || 1,
                })
              }
              placeholder="1"
              isDisabled={loading}
              {...inputProps}
              maxW="160px"
            />
          </FormControl>
        </CourseModalFieldCard>

        {requiresExpiry ? (
          <CourseModalFieldCard>
            <FormControl isRequired={type === "add"}>
              <CourseModalFieldLabel icon={FaClock} color="orange">
                موعد انتهاء الوصول
              </CourseModalFieldLabel>
              <Input
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) =>
                  setFormData({ ...formData, expires_at: e.target.value })
                }
                isDisabled={loading}
                {...inputProps}
              />
              <Text mt={2} fontSize="xs" color="gray.500">
                بعد هذا الموعد لن يتمكن الطلاب من فتح المحاضرة
              </Text>
            </FormControl>
          </CourseModalFieldCard>
        ) : null}

        {groupsEnabled && availableGroups.length > 0 ? (
          <CourseModalFieldCard>
            <FormControl>
              <CourseModalFieldLabel icon={FaUsers} color="blue">
                من يرى المحاضرة؟
              </CourseModalFieldLabel>
              <Select
                value={formData.access_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    access_type: e.target.value,
                    group_ids: e.target.value === "all" ? [] : formData.group_ids,
                  })
                }
                isDisabled={loading}
                {...inputProps}
              >
                <option value="all">كل المشتركين</option>
                <option value="groups">مجموعات محددة فقط</option>
              </Select>
            </FormControl>
            {formData.access_type === "groups" ? (
              <FormControl mt={4}>
                <FormLabel fontSize="sm">
                  اختر المجموعات <Text as="span" color="red.500">*</Text>
                </FormLabel>
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2} mt={2}>
                  {availableGroups.map((group) => {
                    const gid = Number(group.id);
                    const checked = formData.group_ids.includes(gid);
                    return (
                      <Checkbox
                        key={group.id}
                        isChecked={checked}
                        isDisabled={loading}
                        onChange={(e) => toggleGroupId(group.id, e.target.checked)}
                      >
                        {group.name}
                        {group.grade_name ? ` (${group.grade_name})` : ""}
                      </Checkbox>
                    );
                  })}
                </SimpleGrid>
                {formData.group_ids.length === 0 ? (
                  <Text mt={2} fontSize="xs" color="orange.500">
                    اختر مجموعة واحدة على الأقل
                  </Text>
                ) : null}
              </FormControl>
            ) : null}
          </CourseModalFieldCard>
        ) : null}
      </VStack>
    </CourseFormModal>
  );
};

const VideoModal = ({
  isOpen,
  onClose,
  type,
  data,
  lectureId,
  onSubmit,
  loading,
}) => {
  const inputProps = useCourseModalInputProps("orange");
  const [formData, setFormData] = useState({
    video_url: data?.video_url || "",
    title: data?.title || "",
    position: data?.position || 1,
  });

  useEffect(() => {
    if (data) {
      setFormData({
        video_url: data.video_url || "",
        title: data.title || "",
        position: data.position || 1,
      });
    } else if (isOpen) {
      setFormData({ video_url: "", title: "", position: 1 });
    }
  }, [data, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === "edit") onSubmit(data.id, formData);
    else onSubmit(lectureId, formData);
  };

  return (
    <CourseFormModal
      isOpen={isOpen}
      onClose={onClose}
      loading={loading}
      icon={FaFilm}
      accent="orange"
      title={type === "add" ? "إضافة فيديو جديد" : "تعديل الفيديو"}
      subtitle={
        type === "add"
          ? "أرفق رابط الفيديو داخل المحاضرة وحدد ترتيبه"
          : "حدّث رابط الفيديو أو عنوانه أو ترتيبه"
      }
      onSubmit={handleSubmit}
      submitLabel={type === "add" ? "إضافة الفيديو" : "حفظ التعديلات"}
      loadingText={type === "add" ? "جاري الإضافة..." : "جاري الحفظ..."}
      submitColorScheme="orange"
    >
      <VStack spacing={3} align="stretch">
        <CourseModalFieldCard>
          <FormControl>
            <CourseModalFieldLabel icon={FaRegFileAlt}>
              عنوان الفيديو (اختياري)
            </CourseModalFieldLabel>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="مثال: شرح الجزء الأول"
              isDisabled={loading}
              {...inputProps}
            />
          </FormControl>
        </CourseModalFieldCard>

        <CourseModalFieldCard>
          <FormControl isRequired>
            <CourseModalFieldLabel icon={FaVideo} color="orange">
              رابط الفيديو
            </CourseModalFieldLabel>
            <Input
              value={formData.video_url}
              onChange={(e) =>
                setFormData({ ...formData, video_url: e.target.value })
              }
              placeholder="https://..."
              dir="ltr"
              textAlign="left"
              isDisabled={loading}
              {...inputProps}
            />
            <Text mt={2} fontSize="xs" color="gray.500">
              الصق رابط الفيديو من منصة الاستضافة الخاصة بك
            </Text>
          </FormControl>
        </CourseModalFieldCard>

        <CourseModalFieldCard>
          <FormControl isRequired>
            <CourseModalFieldLabel icon={FaListOl}>
              ترتيب الفيديو
            </CourseModalFieldLabel>
            <Input
              type="number"
              min={1}
              value={formData.position}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  position: parseInt(e.target.value, 10) || 1,
                })
              }
              placeholder="1"
              isDisabled={loading}
              {...inputProps}
              maxW="160px"
            />
          </FormControl>
        </CourseModalFieldCard>
      </VStack>
    </CourseFormModal>
  );
};

const FileModal = ({
  isOpen,
  onClose,
  type,
  data,
  lectureId,
  onSubmit,
  loading,
}) => {
  const [formData, setFormData] = useState({
    file_url: data?.file_url || "",
    filename: data?.filename || "",
  });

  useEffect(() => {
    if (data) {
      setFormData({
        file_url: data.file_url || "",
        filename: data.filename || "",
      });
    }
  }, [data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === "edit") {
      onSubmit(data.id, formData);
    } else {
      onSubmit(lectureId, formData);
    }
    // لا نغلق الموديل هنا، سيتم إغلاقه بعد نجاح العملية
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      closeOnOverlayClick={!loading}
      size={{ base: "full", md: "md" }}
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent
        borderRadius={{ base: "none", md: "xl" }}
        mx={{ base: 0, md: 4 }}
        maxH={{ base: "100vh", md: "90vh" }}
      >
        <ModalHeader p={{ base: 3, md: 4 }} fontSize={{ base: "md", md: "lg" }}>
          {type === "add" ? "إضافة ملف جديد" : "تعديل الملف"}
        </ModalHeader>
        <ModalCloseButton isDisabled={loading} />
        <form onSubmit={handleSubmit}>
          <ModalBody p={{ base: 3, md: 4 }}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>رابط الملف</FormLabel>
                <Input
                  value={formData.file_url}
                  onChange={(e) =>
                    setFormData({ ...formData, file_url: e.target.value })
                  }
                  placeholder="أدخل رابط الملف"
                  isDisabled={loading}
                  size={{ base: "sm", md: "md" }}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>اسم الملف</FormLabel>
                <Input
                  value={formData.filename}
                  onChange={(e) =>
                    setFormData({ ...formData, filename: e.target.value })
                  }
                  placeholder="أدخل اسم الملف"
                  isDisabled={loading}
                  size={{ base: "sm", md: "md" }}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter p={{ base: 3, md: 4 }} flexWrap="wrap" gap={2}>
            <Button
              variant="ghost"
              mr={{ base: 0, md: 3 }}
              onClick={onClose}
              isDisabled={loading}
              size={{ base: "sm", md: "md" }}
            >
              إلغاء
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={loading}
              loadingText={
                type === "add" ? "جاري الإضافة..." : "جاري التعديل..."
              }
              size={{ base: "sm", md: "md" }}
            >
              {type === "add" ? "إضافة" : "تعديل"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

// Static Images - الصور الثابتة
const courseHeroImage = "/lE7lWBexvOTPM2MPEKyTRRBo1TQtNGMoL1pxWCxD.jpg";
const instructorImage = "/lE7lWBexvOTPM2MPEKyTRRBo1TQtNGMoL1pxWCxD.jpg";

// Custom keyframes for shimmer effect
// const shimmer = keyframes`
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// `;

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionVStack = motion(VStack);
const MotionHStack = motion(HStack);

const CourseDetailsPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userData, isAdmin, isTeacher, student] = UserType();
  const [showFullDescription, setShowFullDescription] = React.useState(false);
  const [expandedLecture, setExpandedLecture] = React.useState(null);
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [error, setError] = useState(null);

  // Lecture management states
  const [lectureModal, setLectureModal] = useState({
    isOpen: false,
    type: "add",
    data: null,
  });
  const [videoModal, setVideoModal] = useState({
    isOpen: false,
    type: "add",
    lectureId: null,
    data: null,
  });
  const [fileModal, setFileModal] = useState({
    isOpen: false,
    type: "add",
    lectureId: null,
    data: null,
  });
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    type: "",
    id: null,
    title: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const toast = useToast();
  const cancelRef = React.useRef();

  // 1. أضف State لإدارة مودال الامتحان وحذف الامتحان
  const [examModal, setExamModal] = useState({
    isOpen: false,
    type: "add",
    lectureId: null,
    courseLevel: false,
    data: null,
  });
  const [deleteExamDialog, setDeleteExamDialog] = useState({
    isOpen: false,
    examId: null,
    title: "",
  });
  const [examActionLoading, setExamActionLoading] = useState(false);

  // State لمودال إضافة الأسئلة بالجملة
  const [bulkQuestionsModal, setBulkQuestionsModal] = useState({
    isOpen: false,
    examId: null,
    examTitle: "",
    examType: "",
  });
  const [bulkQuestionsLoading, setBulkQuestionsLoading] = useState(false);
  const [bulkQuestionsText, setBulkQuestionsText] = useState("");

  // دالة فتح مودال إضافة الأسئلة بالجملة
  const handleOpenBulkQuestionsModal = (examId, examTitle, examType) => {
    setBulkQuestionsModal({ isOpen: true, examId, examTitle, examType });
  };

  // 1. State لإدارة الامتحانات الشاملة
  const [courseExams, setCourseExams] = useState([]);
  const [courseExamsLoading, setCourseExamsLoading] = useState(false);
  const [courseExamsError, setCourseExamsError] = useState(null);
  // القسم النشط في محتوى الكورس (محاضرات / بث مباشر / امتحانات / مساعد علمي)
  const [activeSection, setActiveSection] = useState("lectures");
  const [courseTourOpen, setCourseTourOpen] = useState(false);

  useEffect(() => {
    const section = searchParams.get("section");
    if (section && ["lectures", "assignments", "live", "exams", "files"].includes(section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  // جلسات البث المباشر للكورس — لظهور أيقونة "بث شغال" على تاب المحاضرات المباشرة
  const { data: courseStreamsData } = useQuery({
    queryKey: ["courseStreamsForTab", id],
    queryFn: async () => {
      const res = await baseUrl.get(`/api/meeting/course/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    enabled: !!id && !!token,
    refetchInterval: 15000,
    staleTime: 10_000,
  });
  const hasActiveLiveStream = (courseStreamsData?.meetings || []).some(
    (m) => m.status === "started",
  );

  // لو بدأ بث مباشر، انتقل تلقائيًا لقسم البث
  useEffect(() => {
    if (hasActiveLiveStream) {
      setActiveSection("live");
    }
  }, [hasActiveLiveStream]);

  useEffect(() => {
    const onTourSection = (event) => {
      const section = event?.detail?.section;
      if (section) setActiveSection(section);
    };
    window.addEventListener(TOUR_SET_SECTION, onTourSection);
    return () => window.removeEventListener(TOUR_SET_SECTION, onTourSection);
  }, []);

  // تفاصيل الكورس مع كاش — الرجوع لنفس الكورس لا يعيد التحميل من الصفر
  const {
    data: courseData,
    isLoading: courseLoading,
    error: courseQueryError,
    refetch: refetchCourseDetails,
  } = useQuery({
    queryKey: ["courseDetails", id],
    queryFn: async () => {
      const response = await baseUrl.get(`api/course/${id}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!id && !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { data: courseFilesList = [] } = useCourseFiles(id, {
    enabled: Boolean(id) && Boolean(token) && Boolean(courseData),
  });
  const courseFilesCount = courseFilesList.length;

  const { data: accessSettings, isLoading: accessSettingsLoading } = useCourseAccessSettings(id, {
    enabled: Boolean(id) && Boolean(token) && Boolean(courseData),
  });
  const lectureAccessMode = accessSettings?.lecture_access_mode || "always_open";
  const assignmentMode = accessSettings?.assignment_mode || "lecture_based";
  const isCourseBasedAssignments = assignmentMode === "course_based";

  const canManageCourse = isTeacher || isAdmin;
  const { data: courseGroupSettings } = useCourseGroupSettings({
    enabled: canManageCourse,
  });
  const courseGroupsEnabled = Boolean(courseGroupSettings?.course_group_access_enabled);
  const { data: teacherCourseGroups = [] } = useTeacherCourseGroups(undefined, {
    enabled: canManageCourse && courseGroupsEnabled,
  });
  const activeTeacherGroups = useMemo(
    () => teacherCourseGroups.filter((g) => g.status !== "inactive"),
    [teacherCourseGroups],
  );

  const { data: courseAssignmentsData, isLoading: courseAssignmentsLoading } = useCourseAssignments(id, {
    enabled: Boolean(id) && Boolean(token) && Boolean(courseData) && isCourseBasedAssignments,
  });

  const courseAssignmentsFromDetails =
    courseData?.course_assignments ?? courseData?.assignments ?? [];

  const courseAssignments =
    courseAssignmentsFromDetails.length > 0
      ? courseAssignmentsFromDetails
      : (courseAssignmentsData?.assignments ?? []);

  const courseAssignmentsCount = courseAssignments.length;

  useEffect(() => {
    if (!isCourseBasedAssignments && activeSection === "assignments") {
      setActiveSection("lectures");
    }
  }, [isCourseBasedAssignments, activeSection]);

  useEffect(() => {
    if (courseQueryError) {
      console.log("Error fetching data:", courseQueryError);
      setError("حدث خطأ في تحميل البيانات");
    } else if (courseData) {
      setError(null);
    }
  }, [courseQueryError, courseData]);

  useEffect(() => {
    if (!student || isTeacher || isAdmin) return undefined;
    if (!courseData?.course || courseLoading) return undefined;
    if (!shouldShowCoursePageTour(id)) return undefined;
    const timer = window.setTimeout(() => setCourseTourOpen(true), 850);
    return () => window.clearTimeout(timer);
  }, [student, isTeacher, isAdmin, courseData, courseLoading, id]);

  // State لمودال إنشاء الأكواد
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [codeCount, setCodeCount] = useState(1);
  const [codeExpiresAt, setCodeExpiresAt] = useState(
    dayjs().add(30, "day").format("YYYY-MM-DDTHH:mm"),
  );
  const [codeLoading, setCodeLoading] = useState(false);

  // State لمودال عرض الأكواد
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [codesLoading, setCodesLoading] = useState(false);
  const [activationCodes, setActivationCodes] = useState([]);
  const [codesError, setCodesError] = useState(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportStartIndex, setExportStartIndex] = useState(1);
  const [exportEndIndex, setExportEndIndex] = useState(50);
  const [searchCode, setSearchCode] = useState("");
  const [filteredCodes, setFilteredCodes] = useState([]);

  // State للفيديو
  const [videoPlayer, setVideoPlayer] = useState({
    isVisible: false,
    videoUrl: "",
    videoTitle: "",
  });

  // تحديث نطاق التصدير عند تغيير عدد الأكواد
  useEffect(() => {
    if (activationCodes.length > 0) {
      setExportEndIndex(Math.min(50, activationCodes.length));
    }
  }, [activationCodes.length]);

  // فلترة الأكواد عند تغيير نص البحث
  useEffect(() => {
    if (searchCode.trim() === "") {
      setFilteredCodes(activationCodes);
    } else {
      const filtered = activationCodes.filter((code) =>
        code.code.toLowerCase().includes(searchCode.toLowerCase()),
      );
      setFilteredCodes(filtered);
    }
  }, [searchCode, activationCodes]);

  // 2. جلب الامتحانات الشاملة
  useEffect(() => {
    const fetchCourseExams = async () => {
      try {
        setCourseExamsLoading(true);
        setCourseExamsError(null);
        // استخدام endpoint مختلف للطلاب مع timestamp لمنع الـ caching
        const baseEndpoint =
          isAdmin || isTeacher
            ? `api/course/${id}/course-exams`
            : `api/exams/course/${id}/student`;
        const endpoint = `${baseEndpoint}?_t=${Date.now()}`;
        const response = await baseUrl.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        // التحقق من وجود البيانات في response.data
        const responseData = response?.data;

        // معالجة البيانات - التحقق من جميع الحالات الممكنة
        let examsData = null;

        if (responseData) {
          // الحالة 1: البيانات في responseData.exams
          if (
            responseData.exams !== undefined &&
            responseData.exams !== null &&
            Array.isArray(responseData.exams)
          ) {
            examsData = responseData.exams;
          }
          // الحالة 2: البيانات مصفوفة مباشرة
          else if (Array.isArray(responseData)) {
            examsData = responseData;
          }
        }

        // تعيين البيانات في state
        if (examsData && Array.isArray(examsData)) {
          setCourseExams(examsData);
          setCourseExamsError(null);
        } else {
          setCourseExams([]);
          setCourseExamsError(null);
        }
      } catch (error) {
        if (!(error.response?.status === 403 && !isAdmin && !isTeacher)) {
          console.error("Error fetching course exams:", error);
        }
        // التحقق من نوع الخطأ
        if (error.response) {
          const status = error.response.status;
          const errorMessage = error.response?.data?.message || error.message;

          // إذا كان الخطأ 403 (Forbidden)، قد يكون بسبب الصلاحيات
          if (status === 403) {
            // إذا كان المستخدم ليس مدرس أو admin، قد يكون هذا طبيعي
            if (!isAdmin && !isTeacher) {
              // للطلاب، إذا كان الخطأ 403، قد يعني أنه لا توجد امتحانات متاحة لهم
              setCourseExams([]);
              setCourseExamsError(null); // لا نعرض خطأ للطلاب
            } else {
              setCourseExamsError(
                errorMessage || "غير مصرح لك بالوصول إلى هذه الامتحانات",
              );
              setCourseExams([]);
            }
          } else {
            setCourseExamsError(
              errorMessage || "حدث خطأ في تحميل الامتحانات الشاملة",
            );
            setCourseExams([]);
          }
        } else {
          setCourseExamsError(
            error.message || "حدث خطأ في تحميل الامتحانات الشاملة",
          );
          setCourseExams([]);
        }
      } finally {
        setCourseExamsLoading(false);
      }
    };
    if (id && token) {
      fetchCourseExams();
    }
  }, [id, token, isAdmin, isTeacher]);

  // بعد useEffect الخاص بجلب الامتحانات الشاملة:
  const refreshExams = async () => {
    try {
      setCourseExamsLoading(true);
      setCourseExamsError(null);
      // استخدام endpoint مختلف للطلاب مع timestamp لمنع الـ caching
      const baseEndpoint =
        isAdmin || isTeacher
          ? `api/course/${id}/course-exams`
          : `api/exams/course/${id}/student`;
      const endpoint = `${baseEndpoint}?_t=${Date.now()}`;
      const response = await baseUrl.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      // التحقق من وجود البيانات في response.data
      const responseData = response?.data;

      // معالجة البيانات - التحقق من جميع الحالات الممكنة
      let examsData = null;

      if (responseData) {
        // الحالة 1: البيانات في responseData.exams
        if (
          responseData.exams !== undefined &&
          responseData.exams !== null &&
          Array.isArray(responseData.exams)
        ) {
          examsData = responseData.exams;
        }
        // الحالة 2: البيانات مصفوفة مباشرة
        else if (Array.isArray(responseData)) {
          examsData = responseData;
        }
      }

      // تعيين البيانات في state
      if (examsData && Array.isArray(examsData)) {
        setCourseExams(examsData);
        setCourseExamsError(null);
      } else {
        setCourseExams([]);
        setCourseExamsError(null);
      }
    } catch (error) {
      if (!(error.response?.status === 403 && !isAdmin && !isTeacher)) {
        console.error("Error refreshing course exams:", error);
      }
      // التحقق من نوع الخطأ
      if (error.response) {
        const status = error.response.status;
        const errorMessage = error.response?.data?.message || error.message;

        // إذا كان الخطأ 403 (Forbidden)، قد يكون بسبب الصلاحيات
        if (status === 403) {
          // إذا كان المستخدم ليس مدرس أو admin، قد يكون هذا طبيعي
          if (!isAdmin && !isTeacher) {
            // للطلاب، إذا كان الخطأ 403، قد يعني أنه لا توجد امتحانات متاحة لهم
            setCourseExams([]);
            setCourseExamsError(null); // لا نعرض خطأ للطلاب
          } else {
            setCourseExamsError(
              errorMessage || "غير مصرح لك بالوصول إلى هذه الامتحانات",
            );
            setCourseExams([]);
          }
        } else {
          setCourseExamsError(
            errorMessage || "حدث خطأ في تحميل الامتحانات الشاملة",
          );
          setCourseExams([]);
        }
      } else {
        setCourseExamsError(
          error.message || "حدث خطأ في تحميل الامتحانات الشاملة",
        );
        setCourseExams([]);
      }
    } finally {
      setCourseExamsLoading(false);
    }
  };

  // دالة جلب الأكواد
  const fetchActivationCodes = async () => {
    setCodesLoading(true);
    setCodesError(null);
    try {
      const res = await baseUrl.get(
        `api/course/my-activation-codes?course_id=${course.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setActivationCodes(res.data.activation_codes || []);
    } catch (error) {
      setCodesError("حدث خطأ في جلب الأكواد");
      setActivationCodes([]);
    } finally {
      setCodesLoading(false);
    }
  };

  // دالة جلب امتحان المحاضرة
  const fetchLectureExam = async (lectureId) => {
    try {
      const response = await baseUrl.get(
        `/api/course/lecture/${lectureId}/exam`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    } catch (error) {
      console.log("Error fetching lecture exam:", error);
      return null;
    }
  };

  // Colors for light and dark mode
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const sectionBg = useColorModeValue("white", "gray.800");
  const headingColor = useColorModeValue("blue.700", "blue.200");
  const textColor = useColorModeValue("gray.700", "gray.300");
  const subTextColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const dividerColor = useColorModeValue("gray.200", "gray.600");
  const itemBg = useColorModeValue("gray.50", "gray.700");
  const activeItemBg = useColorModeValue("blue.50", "blue.900");
  const liveNowBg = useColorModeValue("red.50", "red.900");

  const tabSelectedBg = useColorModeValue("blue.500", "blue.600");
  const tabSelectedColor = useColorModeValue("white", "white");
  const tabHoverBg = useColorModeValue("blue.100", "gray.700");

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Stagger children appearance
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const resourceIconMap = {
    pdf: FaFilePdf,
    doc: FaDownload, // يمكن استخدام FaFileWord أو FaFileAlt
    default: FaDownload,
  };

  // Lecture Management Functions
  const handleAddLecture = () => {
    setLectureModal({ isOpen: true, type: "add", data: null });
  };

  const handleEditLecture = (lecture) => {
    setLectureModal({ isOpen: true, type: "edit", data: lecture });
  };

  const handleDeleteLecture = (lectureId, title) => {
    setDeleteDialog({ isOpen: true, type: "lecture", id: lectureId, title });
  };

  const handleAddVideo = (lectureId) => {
    setVideoModal({ isOpen: true, type: "add", lectureId, data: null });
  };

  const handleEditVideo = (video, lectureId) => {
    setVideoModal({ isOpen: true, type: "edit", lectureId, data: video });
  };

  const handleDeleteVideo = (videoId, title) => {
    setDeleteDialog({ isOpen: true, type: "video", id: videoId, title });
  };

  const handleAddFile = (lectureId) => {
    setFileModal({ isOpen: true, type: "add", lectureId, data: null });
  };

  const handleEditFile = (file, lectureId) => {
    setFileModal({ isOpen: true, type: "edit", lectureId, data: file });
  };

  const handleDeleteFile = (fileId, title) => {
    setDeleteDialog({ isOpen: true, type: "file", id: fileId, title });
  };

  // API Functions
  const createLecture = async (data) => {
    try {
      setActionLoading(true);
      const authToken = localStorage.getItem("token");
      if (!authToken) {
        toast({
          title: "يجب تسجيل الدخول مرة أخرى",
          description: "انتهت الجلسة أو التوكن غير موجود",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        return;
      }
      // التوكن يُرفَق تلقائياً من interceptor في baseUrl (Bearer + X-Tenant-Subdomain)
      const payload = {
        title: data.title,
        description: data.description || "",
        position: Number(data.position) || 1,
      };
      if (data.expires_at) {
        payload.expires_at = new Date(data.expires_at).toISOString();
      }
      if (data.access_type === "groups") {
        if (!Array.isArray(data.group_ids) || data.group_ids.length === 0) {
          toast({
            title: "يجب اختيار مجموعة واحدة على الأقل",
            status: "warning",
            duration: 4000,
            isClosable: true,
          });
          return;
        }
        payload.access_type = "groups";
        payload.group_ids = data.group_ids.map(Number).filter((id) => id > 0);
      } else if (data.access_type) {
        payload.access_type = data.access_type;
      }
      await baseUrl.post(`api/course/${id}/lectures`, payload);
      toast({
        title: "تم إضافة المحاضرة بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // تحديث البيانات بدون إعادة تحميل
      await refreshCourseData();
      // إغلاق الموديل بعد النجاح
      setLectureModal({ isOpen: false, type: "add", data: null });
    } catch (error) {
      const apiMsg =
        error.response?.data?.message ||
        error.response?.data?.msg ||
        error.message;
      toast({
        title: "خطأ في إضافة المحاضرة",
        description:
          error.response?.status === 401
            ? `غير مصرح (401): ${apiMsg || "تحقق من تسجيل الدخول أو أعد الدخول"}`
            : apiMsg || "حدث خطأ غير متوقع",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const updateLecture = async (lectureId, data) => {
    try {
      setActionLoading(true);
      const payload = {
        title: data.title,
        description: data.description || "",
        position: Number(data.position) || 1,
      };
      if (data.expires_at !== undefined) {
        payload.expires_at = data.expires_at
          ? new Date(data.expires_at).toISOString()
          : null;
      }
      if (data.access_type === "groups") {
        if (!Array.isArray(data.group_ids) || data.group_ids.length === 0) {
          toast({
            title: "يجب اختيار مجموعة واحدة على الأقل",
            status: "warning",
            duration: 4000,
            isClosable: true,
          });
          return;
        }
        payload.access_type = "groups";
        payload.group_ids = data.group_ids.map(Number).filter((id) => id > 0);
      } else if (data.access_type) {
        payload.access_type = data.access_type;
        if (data.access_type === "all") {
          payload.group_ids = [];
        }
      }
      await baseUrl.patch(`/api/course/lecture/${lectureId}`, payload);
      toast({
        title: "تم تعديل المحاضرة بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // تحديث البيانات بدون إعادة تحميل
      await refreshCourseData();
      // إغلاق الموديل بعد النجاح
      setLectureModal({ isOpen: false, type: "edit", data: null });
    } catch (error) {
      toast({
        title: "خطأ في تعديل المحاضرة",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const deleteLecture = async (lectureId) => {
    try {
      setActionLoading(true);
      await baseUrl.delete(`api/course-content/lectures/${lectureId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({
        title: "تم حذف المحاضرة بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // تحديث البيانات بدون إعادة تحميل
      await refreshCourseData();
    } catch (error) {
      toast({
        title: "خطأ في حذف المحاضرة",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const createVideo = async (lectureId, data) => {
    try {
      setActionLoading(true);
      const response = await baseUrl.post(
        `api/course/lecture/${lectureId}/videos`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast({
        title: "تم إضافة الفيديو بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // تحديث البيانات بدون إعادة تحميل
      await refreshCourseData();
      // إغلاق الموديل بعد النجاح
      setVideoModal({
        isOpen: false,
        type: "add",
        data: null,
        lectureId: null,
      });
    } catch (error) {
      toast({
        title: "خطأ في إضافة الفيديو",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const updateVideo = async (videoId, data) => {
    try {
      setActionLoading(true);
      const response = await baseUrl.put(
        `api/course/lecture-video/${videoId}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast({
        title: "تم تعديل الفيديو بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // تحديث البيانات بدون إعادة تحميل
      await refreshCourseData();
      // إغلاق الموديل بعد النجاح
      setVideoModal({
        isOpen: false,
        type: "edit",
        data: null,
        lectureId: null,
      });
    } catch (error) {
      toast({
        title: "خطأ في تعديل الفيديو",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const deleteVideo = async (videoId) => {
    try {
      setActionLoading(true);
      await baseUrl.delete(`api/course/lecture-video/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({
        title: "تم حذف الفيديو بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // تحديث البيانات بدون إعادة تحميل
      await refreshCourseData();
    } catch (error) {
      toast({
        title: "خطأ في حذف الفيديو",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const createFile = async (lectureId, data) => {
    try {
      setActionLoading(true);
      const response = await baseUrl.post(
        `api/course/lecture/${lectureId}/files`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast({
        title: "تم إضافة الملف بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // تحديث البيانات بدون إعادة تحميل
      await refreshCourseData();
      // إغلاق الموديل بعد النجاح
      setFileModal({ isOpen: false, type: "add", data: null, lectureId: null });
    } catch (error) {
      toast({
        title: "خطأ في إضافة الملف",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const updateFile = async (fileId, data) => {
    try {
      setActionLoading(true);
      const response = await baseUrl.put(
        `api/course/lecture-file/${fileId}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast({
        title: "تم تعديل الملف بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // تحديث البيانات بدون إعادة تحميل
      await refreshCourseData();
      // إغلاق الموديل بعد النجاح
      setFileModal({
        isOpen: false,
        type: "edit",
        data: null,
        lectureId: null,
      });
    } catch (error) {
      toast({
        title: "خطأ في تعديل الملف",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const deleteFile = async (fileId) => {
    try {
      setActionLoading(true);
      await baseUrl.delete(`api/course/lecture-file/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({
        title: "تم حذف الملف بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // تحديث البيانات بدون إعادة تحميل
      await refreshCourseData();
    } catch (error) {
      toast({
        title: "خطأ في حذف الملف",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const { type, id } = deleteDialog;

    switch (type) {
      case "lecture":
        await deleteLecture(id);
        break;
      case "video":
        await deleteVideo(id);
        break;
      case "file":
        await deleteFile(id);
        break;
    }

    setDeleteDialog({ isOpen: false, type: "", id: null, title: "" });
  };

  // 2. دوال API للواجب / امتحان المحاضرة
  const createExam = async (lectureId, data) => {
    if (!lectureId) {
      toast({
        title: "خطأ",
        description: "لم يتم تحديد المحاضرة. أعد فتح نافذة إضافة الواجب.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    try {
      setExamActionLoading(true);

      const examData = {
        title: data.title,
        type: data.type || "assignment",
        total_grade: data.total_grade,
        duration: data.duration,
        is_visible: data.is_visible ?? true,
        // الواجبات تقفل المحاضرة التالية افتراضياً
        lock_next_lectures: data.lock_next_lectures ?? true,
        show_answers_immediately: data.show_answers_immediately,
        show_answers_after_hours: data.show_answers_after_hours,
      };

      if (data.show_at) {
        examData.show_at = new Date(data.show_at).toISOString();
      }
      if (data.hide_at) {
        examData.hide_at = new Date(data.hide_at).toISOString();
      }

      await baseUrl.post(`/api/course/lecture/${lectureId}/exam`, examData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: "تم إضافة الواجب بنجاح",
        description: `تم إنشاء "${data.title}" لهذه المحاضرة`,
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      await refreshCourseData();
      await queryClient.invalidateQueries({ queryKey: courseAssignmentsQueryKey(id) });
      setExamModal({
        isOpen: false,
        type: "add",
        lectureId: null,
        courseLevel: false,
        data: null,
      });
    } catch (error) {
      console.error("Error creating exam:", error);
      toast({
        title: "خطأ في إضافة الواجب",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setExamActionLoading(false);
    }
  };

  const createCourseExam = async (data) => {
    try {
      setExamActionLoading(true);
      await postCourseExam(id, data);

      toast({
        title: "تم إضافة واجب الكورس بنجاح",
        description: `تم إنشاء "${data.title}"`,
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      await refreshCourseData();
      await queryClient.invalidateQueries({ queryKey: courseAssignmentsQueryKey(id) });
      setExamModal({
        isOpen: false,
        type: "add",
        lectureId: null,
        courseLevel: false,
        data: null,
      });
    } catch (error) {
      console.error("Error creating course exam:", error);
      toast({
        title: "خطأ في إضافة واجب الكورس",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setExamActionLoading(false);
    }
  };

  const updateExam = async (examId, data) => {
    try {
      setExamActionLoading(true);

      const examData = {
        title: data.title,
        total_grade: data.total_grade,
        duration: data.duration,
        is_visible: data.is_visible,
        lock_next_lectures: data.lock_next_lectures,
        show_answers_immediately: data.show_answers_immediately,
        show_answers_after_hours: data.show_answers_after_hours,
      };
      if (data.type) examData.type = data.type;

      // إضافة التواريخ إذا تم تحديدها
      if (data.show_at) {
        examData.show_at = new Date(data.show_at).toISOString();
      }
      if (data.hide_at) {
        examData.hide_at = new Date(data.hide_at).toISOString();
      }

      await baseUrl.patch(`api/course/lecture/exam/${examId}`, examData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: "تم تعديل الواجب بنجاح",
        description: `تم تحديث "${data.title}" بنجاح`,
        status: "success",
        duration: 4000,
        isClosable: true,
      });

      // تحديث البيانات بدون إعادة تحميل
      await refreshCourseData();
      await queryClient.invalidateQueries({ queryKey: courseAssignmentsQueryKey(id) });
      setExamModal({
        isOpen: false,
        type: "edit",
        lectureId: null,
        courseLevel: false,
        data: null,
      });
    } catch (error) {
      console.error("Error updating exam:", error);
      toast({
        title: "خطأ في تعديل الواجب",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setExamActionLoading(false);
    }
  };
  const deleteExam = async (examId) => {
    try {
      setExamActionLoading(true);
      await baseUrl.delete(`api/course/lecture/exam/${examId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({
        title: "تم حذف الواجب بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      // تحديث البيانات بدون إعادة تحميل
      await refreshCourseData();
      await queryClient.invalidateQueries({ queryKey: courseAssignmentsQueryKey(id) });
    } catch (error) {
      toast({
        title: "خطأ في حذف الواجب",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setExamActionLoading(false);
    }
  };

  // دالة إضافة الأسئلة بالجملة
  const addBulkQuestions = async (examId, data, questionType, examType) => {
    try {
      setBulkQuestionsLoading(true);

      if (questionType === "text") {
        // Handle text questions
        const endpoint =
          examType === "comprehensive"
            ? `/api/course/course-exam/${examId}/bulk-questions`
            : `/api/questions/lecture-exam/${examId}/bulk`;
        await baseUrl.post(
          endpoint,
          {
            bulk_text: data,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      } else {
        // Handle image questions
        const formData = new FormData();
        formData.append("exam_id", examId);

        // Append each image file
        data.forEach((file, index) => {
          formData.append("images", file);
        });

        await baseUrl.post("/api/questions/lecture-exam-question", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      toast({
        title: "تم إضافة الأسئلة بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setBulkQuestionsModal({
        isOpen: false,
        examId: null,
        examTitle: "",
        examType: "",
      });
      setBulkQuestionsText("");
      // تحديث البيانات بدون إعادة تحميل
      await refreshCourseData();
    } catch (error) {
      toast({
        title: "خطأ في إضافة الأسئلة",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setBulkQuestionsLoading(false);
    }
  };

  // 3. مودال إضافة/تعديل امتحان — هوية بصرية (blue.500 / orange.500)
  const ExamModal = ({ isOpen, onClose, type, data, onSubmit, loading, courseLevel = false }) => {
    const modalBg = useColorModeValue("gray.50", "gray.800");
    const cardBg = useColorModeValue("white", "gray.800");
    const cardBorder = useColorModeValue("gray.200", "gray.600");
    const labelColor = useColorModeValue("gray.700", "gray.200");
    const footerBg = useColorModeValue("gray.50", "gray.800");
    const footerBorder = useColorModeValue("gray.200", "gray.600");
    const headerIconBg = useColorModeValue("orange.50", "orange.900");

    const [formData, setFormData] = useState({
      title: data?.title || "",
      type: data?.type || "assignment",
      total_grade: data?.total_grade ?? 20,
      duration: data?.duration || 60,
      is_visible: data?.is_visible ?? true,
      show_at: data?.show_at || "",
      hide_at: data?.hide_at || "",
      lock_next_lectures: courseLevel ? false : (data?.lock_next_lectures ?? true),
      show_answers_immediately: data?.show_answers_immediately ?? false,
      show_answers_after_hours: data?.show_answers_after_hours || 24,
    });

    useEffect(() => {
      if (data) {
        setFormData({
          title: data.title || "",
          type: data.type || "assignment",
          total_grade: data.total_grade ?? 20,
          duration: data.duration || 60,
          is_visible: data.is_visible ?? true,
          show_at: data.show_at || "",
          hide_at: data.hide_at || "",
          lock_next_lectures: courseLevel ? false : (data.lock_next_lectures ?? true),
          show_answers_immediately: data.show_answers_immediately ?? false,
          show_answers_after_hours: data.show_answers_after_hours || 24,
        });
      } else {
        setFormData({
          title: "",
          type: "assignment",
          total_grade: 20,
          duration: 60,
          is_visible: true,
          show_at: "",
          hide_at: "",
          lock_next_lectures: courseLevel ? false : true,
          show_answers_immediately: false,
          show_answers_after_hours: 24,
        });
      }
    }, [data, isOpen, courseLevel]);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (type === "edit") onSubmit(data.id, formData);
      else onSubmit(formData);
    };

    return (
      <Modal
        isOpen={isOpen}
        onClose={loading ? undefined : onClose}
        closeOnOverlayClick={!loading}
        size={{ base: "full", md: "4xl" }}
        scrollBehavior="inside"
        isCentered
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(6px)" />
        <ModalContent
          borderRadius={{ base: "none", md: "2xl" }}
          overflow="hidden"
          bg={cardBg}
          borderWidth="1px"
          borderColor={cardBorder}
          boxShadow="xl"
          mx={{ base: 0, md: 4 }}
          maxH={{ base: "100vh", md: "92vh" }}
          display="flex"
          flexDirection="column"
        >
          <Box
            h="1"
            w="100%"
            bgGradient="linear(to-r, blue.500, orange.500)"
            flexShrink={0}
          />
          <ModalHeader
            py={4}
            px={{ base: 4, md: 6 }}
            borderBottomWidth="1px"
            borderColor={cardBorder}
            bg={cardBg}
            flexShrink={0}
          >
            <HStack spacing={3} align="flex-start" pe={8}>
              <Box
                p={2.5}
                bg={headerIconBg}
                borderRadius="xl"
                lineHeight={0}
              >
                <Icon as={FaGraduationCap} boxSize={5} color="orange.500" />
              </Box>
              <VStack align="start" spacing={0.5}>
                <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" color={labelColor}>
                  {type === "add" ? "إضافة واجب جديد" : "تعديل الواجب"}
                </Text>
                <Text fontSize="sm" color="gray.500" fontWeight="normal">
                  {type === "add"
                    ? courseLevel
                      ? "واجب مستقل عن المحاضرات — نفس إعدادات واجب المحاضرة"
                      : "يمكنك إنشاء أكثر من واجب لنفس المحاضرة"
                    : "حدّث إعدادات الواجب والدرجات والظهور"}
                </Text>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton
            top={4}
            insetEnd={3}
            borderRadius="lg"
            isDisabled={loading}
          />
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <ModalBody
              py={{ base: 4, md: 6 }}
              px={{ base: 4, md: 6 }}
              bg={modalBg}
              flex="1"
              minH={0}
              overflowY="auto"
            >
              <VStack spacing={4} align="stretch">
                {/* عنوان الامتحان */}
                <Box
                  p={5}
                  bg={cardBg}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={cardBorder}
                >
                  <FormControl isRequired>
                    <FormLabel
                      display="flex"
                      alignItems="center"
                      gap={3}
                      fontWeight="600"
                      color={labelColor}
                      fontSize="md"
                      mb={3}
                    >
                      <Box
                        p={2}
                        bg="blue.50"
                        borderRadius="lg"
                        _dark={{ bg: "blue.900" }}
                      >
                        <Icon as={FaRegFileAlt} color="blue.500" boxSize={4} />
                      </Box>
                      عنوان الواجب
                    </FormLabel>
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="مثال: واجب 1"
                      isDisabled={loading}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={cardBorder}
                      _focus={{
                        borderColor: "blue.500",
                        boxShadow: "0 0 0 2px rgba(66, 153, 225, 0.3)",
                        outline: "none",
                      }}
                      size="lg"
                    />
                  </FormControl>
                </Box>

                {/* الدرجة الكلية ومدة الامتحان */}
                <Box
                  p={5}
                  bg={cardBg}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={cardBorder}
                >
                  <HStack spacing={6} align="flex-start" flexDir={{ base: "column", md: "row" }}>
                    <FormControl isRequired flex={1} w="full">
                      <FormLabel
                        display="flex"
                        alignItems="center"
                        gap={3}
                        fontWeight="600"
                        color={labelColor}
                        fontSize="md"
                        mb={3}
                      >
                        <Box
                          p={2}
                          bg="orange.50"
                          borderRadius="lg"
                          _dark={{ bg: "orange.900" }}
                        >
                          <Icon as={FaStar} color="orange.500" boxSize={4} />
                        </Box>
                        الدرجة الكلية
                      </FormLabel>
                      <Input
                        type="number"
                        value={formData.total_grade}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            total_grade: parseInt(e.target.value) || 100,
                          })
                        }
                        placeholder="100"
                        min={1}
                        max={1000}
                        isDisabled={loading}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor={cardBorder}
                        _focus={{
                          borderColor: "orange.500",
                          boxShadow: "0 0 0 2px rgba(237, 137, 54, 0.3)",
                          outline: "none",
                        }}
                        size="lg"
                      />
                    </FormControl>
                    <FormControl isRequired flex={1} w="full">
                      <FormLabel
                        display="flex"
                        alignItems="center"
                        gap={3}
                        fontWeight="600"
                        color={labelColor}
                        fontSize="md"
                        mb={3}
                      >
                        <Box
                          p={2}
                          bg="blue.50"
                          borderRadius="lg"
                          _dark={{ bg: "blue.900" }}
                        >
                          <Icon as={FaClock} color="blue.500" boxSize={4} />
                        </Box>
                        المدة (بالدقائق)
                      </FormLabel>
                      <Input
                        type="number"
                        value={formData.duration}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            duration: parseInt(e.target.value) || 60,
                          })
                        }
                        placeholder="60"
                        min={1}
                        max={300}
                        isDisabled={loading}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor={cardBorder}
                        _focus={{
                          borderColor: "blue.500",
                          boxShadow: "0 0 0 2px rgba(66, 153, 225, 0.3)",
                          outline: "none",
                        }}
                        size="lg"
                      />
                    </FormControl>
                  </HStack>
                </Box>

                {/* تواريخ الظهور والإخفاء */}
                <Box
                  p={5}
                  bg={cardBg}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={cardBorder}
                >
                  <HStack spacing={6} align="flex-start" flexDir={{ base: "column", md: "row" }}>
                    <FormControl flex={1} w="full">
                      <FormLabel
                        display="flex"
                        alignItems="center"
                        gap={3}
                        fontWeight="600"
                        color={labelColor}
                        fontSize="md"
                        mb={3}
                      >
                        <Box
                          p={2}
                          bg="blue.50"
                          borderRadius="lg"
                          _dark={{ bg: "blue.900" }}
                        >
                          <Icon
                            as={FaCalendarAlt}
                            color="blue.500"
                            boxSize={4}
                          />
                        </Box>
                        تاريخ الظهور
                      </FormLabel>
                      <Input
                        type="datetime-local"
                        value={formData.show_at}
                        onChange={(e) =>
                          setFormData({ ...formData, show_at: e.target.value })
                        }
                        isDisabled={loading}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor={cardBorder}
                        _focus={{
                          borderColor: "blue.500",
                          boxShadow: "0 0 0 2px rgba(66, 153, 225, 0.3)",
                          outline: "none",
                        }}
                        size="lg"
                      />
                    </FormControl>
                    <FormControl flex={1} w="full">
                      <FormLabel
                        display="flex"
                        alignItems="center"
                        gap={3}
                        fontWeight="600"
                        color={labelColor}
                        fontSize="md"
                        mb={3}
                      >
                        <Box
                          p={2}
                          bg="orange.50"
                          borderRadius="lg"
                          _dark={{ bg: "orange.900" }}
                        >
                          <Icon
                            as={FaCalendarAlt}
                            color="orange.500"
                            boxSize={4}
                          />
                        </Box>
                        تاريخ الإخفاء
                      </FormLabel>
                      <Input
                        type="datetime-local"
                        value={formData.hide_at}
                        onChange={(e) =>
                          setFormData({ ...formData, hide_at: e.target.value })
                        }
                        isDisabled={loading}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor={cardBorder}
                        _focus={{
                          borderColor: "orange.500",
                          boxShadow: "0 0 0 2px rgba(237, 137, 54, 0.3)",
                          outline: "none",
                        }}
                        size="lg"
                      />
                    </FormControl>
                  </HStack>
                </Box>

                {/* إعدادات الإجابات */}
                <Box
                  p={5}
                  bg={cardBg}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={cardBorder}
                >
                  <HStack spacing={3} mb={4}>
                    <Box
                      p={2}
                      bg="blue.50"
                      borderRadius="lg"
                      _dark={{ bg: "blue.900" }}
                    >
                      <Icon as={FaLightbulb} color="blue.500" boxSize={5} />
                    </Box>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="md" fontWeight="600" color={labelColor}>
                        إعدادات عرض الإجابات
                      </Text>
                      <Text
                        fontSize="sm"
                        color="gray.500"
                        _dark={{ color: "gray.400" }}
                      >
                        تحكم في كيفية ومتى يتم عرض الإجابات للطلاب
                      </Text>
                    </VStack>
                  </HStack>
                  <VStack spacing={4} align="stretch">
                    <Box
                      p={4}
                      bg={modalBg}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={cardBorder}
                    >
                      <HStack justify="space-between" align="center">
                        <VStack align="start" spacing={0}>
                          <Text
                            fontWeight="600"
                            color={labelColor}
                            fontSize="md"
                          >
                            إظهار الإجابات فوراً
                          </Text>
                          <Text
                            fontSize="sm"
                            color="gray.500"
                            _dark={{ color: "gray.400" }}
                          >
                            عرض الإجابات مباشرة بعد انتهاء الامتحان
                          </Text>
                        </VStack>
                        <Switch
                          isChecked={formData.show_answers_immediately}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              show_answers_immediately: e.target.checked,
                            })
                          }
                          colorScheme="blue"
                          size="lg"
                          isDisabled={loading}
                        />
                      </HStack>
                    </Box>
                    {!formData.show_answers_immediately && (
                      <Box
                        p={4}
                        bg={modalBg}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor={cardBorder}
                      >
                        <FormControl>
                          <FormLabel
                            display="flex"
                            alignItems="center"
                            gap={3}
                            fontWeight="600"
                            color={labelColor}
                            fontSize="md"
                            mb={2}
                          >
                            <Box
                              p={2}
                              bg="orange.50"
                              borderRadius="lg"
                              _dark={{ bg: "orange.900" }}
                            >
                              <Icon
                                as={FaClock}
                                color="orange.500"
                                boxSize={4}
                              />
                            </Box>
                            إظهار الإجابات بعد (ساعات)
                          </FormLabel>
                          <Input
                            type="number"
                            value={formData.show_answers_after_hours}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                show_answers_after_hours:
                                  parseInt(e.target.value) || 24,
                              })
                            }
                            placeholder="24"
                            min={1}
                            max={168}
                            isDisabled={loading}
                            borderRadius="lg"
                            borderWidth="1px"
                            borderColor={cardBorder}
                            _focus={{
                              borderColor: "orange.500",
                              boxShadow: "0 0 0 2px rgba(237, 137, 54, 0.3)",
                              outline: "none",
                            }}
                            size="lg"
                          />
                        </FormControl>
                      </Box>
                    )}
                  </VStack>
                </Box>

                {/* إعدادات إضافية */}
                <Box
                  p={5}
                  bg={cardBg}
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor={cardBorder}
                >
                  <HStack spacing={3} mb={4}>
                    <Box
                      p={2}
                      bg="blue.50"
                      borderRadius="lg"
                      _dark={{ bg: "blue.900" }}
                    >
                      <Icon as={FaCog} color="blue.500" boxSize={5} />
                    </Box>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="md" fontWeight="600" color={labelColor}>
                        إعدادات إضافية
                      </Text>
                      <Text
                        fontSize="sm"
                        color="gray.500"
                        _dark={{ color: "gray.400" }}
                      >
                        تحكم في رؤية الامتحان وسلوك المحاضرات
                      </Text>
                    </VStack>
                  </HStack>
                  <VStack spacing={4} align="stretch">
                    <Box
                      p={4}
                      bg={modalBg}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={cardBorder}
                    >
                      <HStack justify="space-between" align="center">
                        <VStack align="start" spacing={0}>
                          <Text
                            fontWeight="600"
                            color={labelColor}
                            fontSize="md"
                          >
                            إظهار الواجب
                          </Text>
                          <Text
                            fontSize="sm"
                            color="gray.500"
                            _dark={{ color: "gray.400" }}
                          >
                            جعل الواجب مرئياً للطلاب
                          </Text>
                        </VStack>
                        <Switch
                          isChecked={formData.is_visible}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              is_visible: e.target.checked,
                            })
                          }
                          colorScheme="blue"
                          size="lg"
                          isDisabled={loading}
                        />
                      </HStack>
                    </Box>
                    {!courseLevel ? (
                    <Box
                      p={4}
                      bg={modalBg}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={cardBorder}
                    >
                      <HStack justify="space-between" align="center">
                        <VStack align="start" spacing={0}>
                          <Text
                            fontWeight="600"
                            color={labelColor}
                            fontSize="md"
                          >
                            قفل المحاضرات التالية
                          </Text>
                          <Text
                            fontSize="sm"
                            color="gray.500"
                            _dark={{ color: "gray.400" }}
                          >
                            منع الوصول للمحاضرات التالية حتى اجتياز الواجب
                          </Text>
                        </VStack>
                        <Switch
                          isChecked={formData.lock_next_lectures}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              lock_next_lectures: e.target.checked,
                            })
                          }
                          colorScheme="orange"
                          size="lg"
                          isDisabled={loading}
                        />
                      </HStack>
                    </Box>
                    ) : null}
                  </VStack>
                </Box>
              </VStack>
            </ModalBody>

            <ModalFooter
              py={4}
              px={{ base: 4, md: 6 }}
              borderTopWidth="1px"
              borderColor={footerBorder}
              bg={footerBg}
              flexShrink={0}
            >
              <HStack spacing={3} w="full" justify="flex-end" flexWrap="wrap">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  isDisabled={loading}
                  fontWeight="600"
                  borderRadius="xl"
                >
                  إلغاء
                </Button>
                <Button
                  colorScheme="orange"
                  type="submit"
                  isLoading={loading}
                  loadingText={
                    type === "add" ? "جاري الإضافة..." : "جاري التعديل..."
                  }
                  leftIcon={!loading ? <Icon as={FaCheck} /> : undefined}
                  borderRadius="xl"
                  fontWeight="bold"
                  px={6}
                  shadow="sm"
                >
                  {type === "add" ? "إضافة الواجب" : "حفظ التعديلات"}
                </Button>
              </HStack>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    );
  };

  // مودال إضافة الأسئلة بالجملة
  const BulkQuestionsModal = ({
    isOpen,
    onClose,
    examId,
    examTitle,
    onSubmit,
    loading,
  }) => {
    const [questionType, setQuestionType] = useState("text"); // 'text' or 'images'
    const [formData, setFormData] = useState({
      bulk_text: "",
      images: [],
    });
    const [imagePreviews, setImagePreviews] = useState([]);

    useEffect(() => {
      console.log(
        "BulkQuestionsModal useEffect - isOpen:",
        isOpen,
        "examId:",
        examId,
        "examTitle:",
        examTitle,
      );
      setFormData({ bulk_text: "", images: [] });
      setImagePreviews([]);
      setQuestionType("text");
    }, [isOpen, examId, examTitle]);

    const handleImageChange = (event) => {
      const files = Array.from(event.target.files);

      // Validate file count
      if (files.length > 10) {
        toast({
          title: "خطأ في عدد الصور",
          description: "يمكن رفع حتى 10 صور فقط",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Validate file types
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      const invalidFiles = files.filter(
        (file) => !validTypes.includes(file.type),
      );

      if (invalidFiles.length > 0) {
        toast({
          title: "خطأ في نوع الملفات",
          description: "يرجى اختيار ملفات صورة صحيحة (JPG, PNG, GIF)",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Validate file sizes (max 5MB each)
      const oversizedFiles = files.filter(
        (file) => file.size > 5 * 1024 * 1024,
      );
      if (oversizedFiles.length > 0) {
        toast({
          title: "خطأ في حجم الملفات",
          description: "حجم كل صورة يجب أن يكون أقل من 5 ميجابايت",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setFormData((prev) => ({ ...prev, images: files }));

      // Create previews
      const previews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews(previews);
    };

    const removeImage = (index) => {
      const newImages = formData.images.filter((_, i) => i !== index);
      const newPreviews = imagePreviews.filter((_, i) => i !== index);

      // Revoke the URL to free memory
      URL.revokeObjectURL(imagePreviews[index]);

      setFormData((prev) => ({ ...prev, images: newImages }));
      setImagePreviews(newPreviews);
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (questionType === "text") {
        onSubmit(examId, formData.bulk_text, "text");
      } else {
        onSubmit(examId, formData.images, "images");
      }
      // لا نغلق الموديل هنا، سيتم إغلاقه بعد نجاح العملية
    };

    console.log(
      "BulkQuestionsModal render - isOpen:",
      isOpen,
      "examId:",
      examId,
      "examTitle:",
      examTitle,
    );
    return (
      <Modal
        isOpen={isOpen}
        onClose={loading ? undefined : onClose}
        size="4xl"
        closeOnOverlayClick={!loading}
        closeOnEsc={!loading}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex align="center" spacing={3}>
              <Icon as={FaPlus} color="blue.500" mr={3} />
              <Text>إضافة أسئلة بالجملة - {examTitle}</Text>
            </Flex>
            {console.log("Modal header rendered with examTitle:", examTitle)}
          </ModalHeader>
          <ModalCloseButton isDisabled={loading} />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              {console.log("Modal body content starting")}
              <VStack spacing={6} align="stretch">
                {/* Question Type Selection */}
                <Box>
                  <FormLabel fontWeight="bold" mb={3}>
                    نوع الأسئلة
                  </FormLabel>
                  <HStack spacing={4} mb={4}>
                    <Button
                      colorScheme={questionType === "text" ? "blue" : "gray"}
                      variant={questionType === "text" ? "solid" : "outline"}
                      onClick={() => setQuestionType("text")}
                      leftIcon={<Icon as={FaRegFileAlt} />}
                    >
                      أسئلة نصية
                    </Button>
                    <Button
                      colorScheme={questionType === "images" ? "blue" : "gray"}
                      variant={questionType === "images" ? "solid" : "outline"}
                      onClick={() => setQuestionType("images")}
                      leftIcon={<Icon as={FaFilePdf} />}
                    >
                      أسئلة بالصور
                    </Button>
                  </HStack>
                </Box>

                {/* Text Questions Section */}
                {questionType === "text" && (
                  <Box>
                    <FormLabel fontWeight="bold" mb={2}>
                      نص الأسئلة
                    </FormLabel>
                    <Text fontSize="sm" color="gray.600" mb={3}>
                      أدخل الأسئلة بالشكل التالي:
                    </Text>
                    <Box
                      bg="gray.50"
                      p={4}
                      borderRadius="md"
                      border="1px solid"
                      borderColor="gray.200"
                      mb={4}
                    >
                      <Text fontSize="sm" fontFamily="mono" color="gray.700">
                        {`You were __________ to escape unharmed.
A) unfortunately
B) fortunately
C) fortunate
D) unfortunate

Mai as well as her sisters __________ a promise to help their mother at home.
A) has done
B) have done
C) have made
D) has made`}
                      </Text>
                    </Box>
                    <Textarea
                      value={formData.bulk_text}
                      onChange={(e) =>
                        setFormData({ ...formData, bulk_text: e.target.value })
                      }
                      placeholder="أدخل الأسئلة هنا..."
                      rows={15}
                      fontFamily="mono"
                      fontSize="sm"
                      resize="vertical"
                      isRequired
                    />

                    <Box>
                      <Text fontSize="sm" color="blue.600" fontWeight="medium">
                        ملاحظات:
                      </Text>
                      <VStack spacing={2} align="start" mt={2}>
                        <Text fontSize="xs" color="gray.600">
                          • كل سؤال يجب أن يحتوي على 4 خيارات (A, B, C, D)
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          • اترك سطر فارغ بين كل سؤال
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          • تأكد من صحة تنسيق الأسئلة قبل الإرسال
                        </Text>
                      </VStack>
                    </Box>
                  </Box>
                )}

                {/* Image Questions Section */}
                {questionType === "images" && (
                  <Box>
                    <FormLabel fontWeight="bold" mb={2}>
                      رفع صور الأسئلة
                    </FormLabel>
                    <Text fontSize="sm" color="gray.600" mb={3}>
                      يمكنك رفع حتى 10 صور للأسئلة
                    </Text>

                    {/* File Upload Area */}
                    <Box
                      border="2px dashed"
                      borderColor="gray.300"
                      borderRadius="lg"
                      p={8}
                      textAlign="center"
                      cursor="pointer"
                      _hover={{
                        borderColor: "blue.400",
                        bg: "blue.50",
                      }}
                      transition="all 0.2s"
                      mb={4}
                    >
                      <VStack spacing={4}>
                        <Icon as={FaFilePdf} boxSize={8} color="gray.400" />
                        <VStack spacing={2}>
                          <Text fontWeight="medium" color="gray.700">
                            انقر لاختيار صور الأسئلة
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            JPG, PNG, GIF حتى 5 ميجابايت لكل صورة
                          </Text>
                        </VStack>
                      </VStack>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        position="absolute"
                        top={0}
                        left={0}
                        w="full"
                        h="full"
                        opacity={0}
                        cursor="pointer"
                      />
                    </Box>

                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" mb={3}>
                          الصور المحددة ({imagePreviews.length}/10):
                        </Text>
                        <SimpleGrid
                          columns={{ base: 2, md: 3, lg: 4 }}
                          spacing={4}
                        >
                          {imagePreviews.map((preview, index) => (
                            <Box key={index} position="relative">
                              <Image
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                w="full"
                                h="120px"
                                objectFit="cover"
                                borderRadius="md"
                                border="1px solid"
                                borderColor="gray.200"
                              />
                              <IconButton
                                icon={<Icon as={FaTimes} />}
                                aria-label="حذف الصورة"
                                position="absolute"
                                top={1}
                                right={1}
                                size="sm"
                                colorScheme="red"
                                variant="solid"
                                borderRadius="full"
                                onClick={() => removeImage(index)}
                              />
                            </Box>
                          ))}
                        </SimpleGrid>
                      </Box>
                    )}

                    <Box>
                      <Text fontSize="sm" color="blue.600" fontWeight="medium">
                        ملاحظات:
                      </Text>
                      <VStack spacing={2} align="start" mt={2}>
                        <Text fontSize="xs" color="gray.600">
                          • يمكن رفع حتى 10 صور للأسئلة
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          • حجم كل صورة يجب أن يكون أقل من 5 ميجابايت
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          • الأنواع المدعومة: JPG, PNG, GIF
                        </Text>
                      </VStack>
                    </Box>
                  </Box>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="ghost"
                mr={3}
                onClick={onClose}
                isDisabled={loading}
              >
                إلغاء
              </Button>
              <Button
                colorScheme="blue"
                type="submit"
                isLoading={loading}
                loadingText="جاري إضافة الأسئلة..."
                isDisabled={
                  loading ||
                  (questionType === "text" && !formData.bulk_text.trim()) ||
                  (questionType === "images" && formData.images.length === 0)
                }
              >
                {questionType === "text"
                  ? "إضافة الأسئلة النصية"
                  : "إضافة الأسئلة بالصور"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    );
  };

  // دالة إرسال الأكواد
  const handleCreateCodes = async (e) => {
    e.preventDefault();
    setCodeLoading(true);
    try {
      await baseUrl.post(
        "api/course/activation-code",
        {
          course_id: course.id,
          count: parseInt(codeCount),
          expires_at: new Date(codeExpiresAt).toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      toast({
        title: "تم إنشاء الأكواد بنجاح!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setCodeModalOpen(false);
      setCodeCount(1);
      setCodeExpiresAt(dayjs().add(30, "day").format("YYYY-MM-DDTHH:mm"));
      // تحديث البيانات بدون إعادة تحميل
      await fetchActivationCodes();
    } catch (error) {
      toast({
        title: "خطأ في إنشاء الأكواد",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setCodeLoading(false);
    }
  };

  // دالة تصدير الأكواد كـ PDF مع معالجة أخطاء واضحة
  const handleExportCodesPdf = async () => {
    if (!activationCodes || activationCodes.length === 0) {
      toast({
        title: "لا توجد أكواد متاحة للتصدير!",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // التحقق من صحة النطاق المحدد
    if (exportStartIndex > exportEndIndex) {
      toast({
        title: "خطأ في تحديد النطاق!",
        description: "يجب أن يكون رقم البداية أقل من أو يساوي رقم النهاية",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // تحديد الأكواد المراد تصديرها
    const startIndex = Math.max(0, exportStartIndex - 1); // تحويل إلى index
    const endIndex = Math.min(activationCodes.length, exportEndIndex);
    const codesToExport = activationCodes.slice(startIndex, endIndex);

    if (codesToExport.length === 0) {
      toast({
        title: "لا توجد أكواد في النطاق المحدد!",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsExportingPdf(true);
    try {
      const codesPerPage = 12; // 3 columns × 4 rows
      const pageWidth = 297; // mm
      const pageHeight = 210; // mm
      const defaultLogoUrl = eduPlatformLogo.startsWith("http")
        ? eduPlatformLogo
        : `${window.location.origin}${eduPlatformLogo}`;

      // لوجو المدرس صاحب المنصة — لو مش متاح نرجع للوجو الافتراضي
      let logoUrl = defaultLogoUrl;
      let usesDefaultLogo = true;
      const tenantSubdomain = getTenantSubdomain();
      if (tenantSubdomain) {
        try {
          let teacherLogo = readCachedTenantBrandLogo(tenantSubdomain);
          if (!teacherLogo) {
            const res = await fetchTenantPublic(tenantSubdomain);
            teacherLogo = resolveTenantBrandLogo(
              res?.data?.tenant,
              res?.data?.teacher,
            );
          }
          if (teacherLogo) {
            logoUrl = teacherLogo.startsWith("data:")
              ? teacherLogo
              : await fetchImageAsDataUrl(teacherLogo);
            usesDefaultLogo = false;
          }
        } catch {
          logoUrl = defaultLogoUrl;
        }
      }

      const headerFontSize = usesDefaultLogo ? "9px" : "11px";
      const courseNameFontSize = usesDefaultLogo ? "8px" : "10px";
      const teacherNameFontSize = usesDefaultLogo ? "10px" : "12px";
      const activationLabelFontSize = usesDefaultLogo ? "9px" : "11px";
      const activationCodeFontSize = usesDefaultLogo ? "13px" : "16px";
      const footerFontSize = usesDefaultLogo ? "10px" : "12px";
      const logoHeight = usesDefaultLogo ? "36px" : "48px";

      const courseName = courseData?.course?.title || "الكورس";
      const teacherName = user?.name || "المدرس";
      const pdf = new jsPDF("l", "mm", "a4");
      for (let i = 0; i < codesToExport.length; i += codesPerPage) {
        const tempDiv = document.createElement("div");
        tempDiv.style.display = "block";
        tempDiv.style.width = `${pageWidth}mm`;
        tempDiv.style.height = `${pageHeight}mm`;
        tempDiv.style.background = "#fff";
        document.body.appendChild(tempDiv);
        tempDiv.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(3,1fr); grid-template-rows:repeat(4,1fr); gap:3mm; width:100%; height:100%; align-content:start;">
${codesToExport
  .slice(i, i + codesPerPage)
  .map(
    (code, index) => `

<div style="
width:100%;
height:100%;
border-radius:14px;
overflow:hidden;
background:#ffffff;
display:flex;
flex-direction:column;
border:1px solid #dbeafe;
box-shadow:0 4px 10px rgba(0,0,0,0.08);
position:relative;
direction:rtl;
min-height:36mm;
">

<!-- Header -->
<div style="
background:linear-gradient(90deg,#1e3a8a,#3b82f6);
color:#fff;
padding:8px 10px;
display:flex;
justify-content:space-between;
align-items:center;
font-size:${headerFontSize};
font-weight:700;
">

<span>${code.grade_name || "الصف الثالث الثانوي"}</span>

<span style="
font-size:${courseNameFontSize};
background:rgba(255,255,255,0.2);
padding:3px 8px;
border-radius:6px;
">
${courseName}
</span>

<span style="
font-weight:800;
font-size:${teacherNameFontSize};
">
${teacherName}
</span>

</div>

<!-- Content -->
<div style="
flex:1;
display:flex;
align-items:center;
justify-content:space-between;
padding:10px 14px;
gap:10px;
position:relative;
flex-direction:row;
">

<!-- QR -->
<div style="
flex-shrink:0;
margin-left:14px;
">
${
  code.qr_code
    ? `<img src="${code.qr_code}" style="
width:90px;
height:90px;
background:#fff;
border-radius:10px;
border:2px solid #2563eb;
padding:3px;
object-fit:contain;
"/>`
    : `<div style="
width:90px;
height:90px;
border:2px dashed #2563eb;
border-radius:10px;
display:flex;
align-items:center;
justify-content:center;
font-size:10px;
color:#2563eb;
">QR</div>`
}
</div>

<!-- Logo -->
<div style="
flex:1;
display:flex;
align-items:center;
justify-content:center;
">
<span style="
display:inline-flex;
align-items:center;
justify-content:center;
background:#fff;
border:1px solid #dbeafe;
border-radius:10px;
padding:6px 10px;
">
<img src="${logoUrl}" alt="لوجو المنصة" style="
height:${logoHeight};
width:auto;
max-width:150px;
object-fit:contain;
opacity:1;
"/>
</span>
</div>

<!-- Activation Code -->
<div style="
flex-shrink:0;
display:flex;
flex-direction:column;
align-items:center;
justify-content:center;
text-align:center;
margin-right:10px;
">

<div style="
font-size:${activationLabelFontSize};
font-weight:700;
color:#fd7305;
margin-bottom:6px;
">
كود التفعيل
</div>

<div style="
font-size:${activationCodeFontSize};
font-weight:800;
font-family:monospace;
letter-spacing:2px;
color:#fd7305;
">
${code.code}
</div>

</div>

</div>

<!-- Footer -->
<div style="
background:linear-gradient(90deg,#1e3a8a,#2563eb);
padding:6px 8px;
text-align:center;
">

<span style="
color:#fff;
font-size:${footerFontSize};
font-weight:800;
letter-spacing:0.3px;
display:block;
">
 01111272393 & 01288781012 & 01278284806 
</span>

</div>

</div>

`,
  )
  .join("")}
</div>
        `;
        await new Promise((resolve) => setTimeout(resolve, 350));
        try {
          const pxPerMm = 3.78;
          const canvas = await html2canvas(tempDiv, {
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            logging: false,
            width: pageWidth * pxPerMm,
            height: pageHeight * pxPerMm,
          });
          pdf.addImage(
            canvas.toDataURL("image/jpeg", 0.8),
            "JPEG",
            0,
            0,
            pageWidth,
            pageHeight,
          );
        } catch (err) {
          console.error("PDF Export Error (canvas):", err);
          toast({
            title: "خطأ أثناء إنشاء صورة الصفحة!",
            status: "error",
            duration: 4000,
            isClosable: true,
          });
        }
        if (i + codesPerPage < codesToExport.length) pdf.addPage();
        document.body.removeChild(tempDiv);
      }
      pdf.save("activation-codes.pdf");
      toast({
        title: "تم التصدير بنجاح!",
        description: `تم تصدير ${codesToExport.length} كود من ${exportStartIndex} إلى ${exportEndIndex}`,
        status: "success",
        duration: 4000,
        isClosable: true,
      });
    } catch (err) {
      console.error("PDF Export Error:", err);
      toast({
        title: "حدث خطأ أثناء تصدير PDF!",
        description: err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };


  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // دالة فتح الفيديو
  const handleOpenVideo = (videoUrl, videoTitle) => {
    setVideoPlayer({
      isVisible: true,
      videoUrl,
      videoTitle,
    });
  };

  // دالة إغلاق الفيديو
  const handleCloseVideo = () => {
    setVideoPlayer({
      isVisible: false,
      videoUrl: "",
      videoTitle: "",
    });
  };

  // دالة تبديل ظهور الفيديو
  const handleToggleVideoVisibility = () => {
    setVideoPlayer((prev) => ({
      ...prev,
      isVisible: !prev.isVisible,
    }));
  };

  // دالة تحديث البيانات بدون إعادة تحميل كامل للصفحة
  const refreshCourseData = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ["courseDetails", id] });
      await refetchCourseDetails();
    } catch (error) {
      console.log("Error refreshing course data:", error);
    }
  };

  const lecturesForTour = courseData?.lectures;
  const tourLecture = useMemo(
    () => pickTourLecture(lecturesForTour, { isTeacher, isAdmin }),
    [lecturesForTour, isTeacher, isAdmin],
  );
  const lectureTourMeta = useMemo(
    () => buildLectureTourMeta(tourLecture, { isTeacher, isAdmin }),
    [tourLecture, isTeacher, isAdmin],
  );

  // شاشة التحميل فقط عند أول دخول بدون بيانات في الكاش
  if (courseLoading && !courseData) {
    return <BrandLoadingScreen />;
  }

  // Enhanced Error Component
  if (error) {
    return (
      <Box minH="100vh" bg={pageBg} dir="rtl" className="mt-[80px]">
        <Center minH="50vh">
          <VStack spacing={8}>
            {/* Error Icon with Animation */}
            <Box position="relative">
              <Icon
                as={FaLightbulb}
                boxSize={20}
                color="red.500"
                style={{
                  animation: "shake 0.5s ease-in-out infinite",
                  filter: "drop-shadow(0 2px 4px rgba(245, 101, 101, 0.3))",
                }}
              />
              <Box
                position="absolute"
                top="-5px"
                right="-5px"
                w="12px"
                h="12px"
                bg="red.400"
                borderRadius="full"
                opacity="0.8"
                animation="pulse 2s ease-in-out infinite"
              />
            </Box>

            {/* Error Container */}
            <Box
              p={{ base: 8, md: 10 }}
              borderRadius="2xl"
              boxShadow="xl"
              bgGradient="linear(to-br, red.50, white, orange.50)"
              border="2px solid"
              borderColor="red.200"
              textAlign="center"
              maxW={{ base: "90vw", md: "500px" }}
            >
              <VStack spacing={6}>
                <Text
                  fontSize={{ base: "lg", md: "xl" }}
                  color="red.600"
                  fontWeight="bold"
                >
                  حدث خطأ أثناء تحميل البيانات
                </Text>
                <Text fontSize="md" color="red.500" opacity="0.9">
                  {error}
                </Text>
                <Button
                  colorScheme="blue"
                  onClick={() => window.location.reload()}
                  size="lg"
                  px={8}
                  borderRadius="full"
                  _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                  transition="all 0.2s"
                >
                  إعادة المحاولة
                </Button>
              </VStack>
            </Box>
          </VStack>

          {/* CSS Animations */}
          <style>{`
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-5px); }
              75% { transform: translateX(5px); }
            }
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 0.8; }
              50% { transform: scale(1.1); opacity: 1; }
            }
          `}</style>
        </Center>
      </Box>
    );
  }

  // Enhanced No Data Component
  if (!courseData) {
    return (
      <Box minH="100vh" bg={pageBg} dir="rtl" className="mt-[80px]">
        <Center minH="50vh">
          <VStack spacing={8}>
            {/* No Data Icon */}
            <Box position="relative">
              <Icon
                as={FaSearch}
                boxSize={20}
                color="gray.500"
                style={{
                  animation: "float 3s ease-in-out infinite",
                  filter: "drop-shadow(0 2px 4px rgba(113, 128, 150, 0.3))",
                }}
              />
            </Box>

            {/* No Data Container */}
            <Box
              p={{ base: 8, md: 10 }}
              borderRadius="2xl"
              boxShadow="lg"
              bgGradient="linear(to-br, gray.50, white)"
              border="2px solid"
              borderColor="gray.200"
              textAlign="center"
              maxW={{ base: "90vw", md: "500px" }}
            >
              <VStack spacing={6}>
                <Text
                  fontSize={{ base: "lg", md: "xl" }}
                  color="gray.600"
                  fontWeight="bold"
                >
                  لا توجد بيانات متاحة
                </Text>
                <Text fontSize="md" color="gray.500" opacity="0.8">
                  لم يتم العثور على معلومات الكورس المطلوب
                </Text>
                <Button
                  colorScheme="blue"
                  onClick={() => window.location.reload()}
                  size="md"
                  px={6}
                  borderRadius="full"
                  _hover={{ transform: "translateY(-1px)", boxShadow: "md" }}
                  transition="all 0.2s"
                >
                  تحديث الصفحة
                </Button>
              </VStack>
            </Box>
          </VStack>

          {/* CSS Animations */}
          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
          `}</style>
        </Center>
      </Box>
    );
  }

  const { course, lectures } = courseData;
  const mockCompletionPercent = 62;

  // أقسام محتوى الكورس — قائمة التنقل الجانبية
  const courseContentSections = [
    {
      id: "lectures",
      label: "المحاضرات",
      desc: isCourseBasedAssignments
        ? "الفيديوهات والملفات"
        : "الفيديوهات والملفات والواجبات",
      icon: FaPlayCircle,
      colorKey: "blue",
      count: lectures?.length || 0,
    },
    ...(isCourseBasedAssignments
      ? [
          {
            id: "assignments",
            label: "واجبات الكورس",
            desc: "واجبات مستقلة عن المحاضرات",
            icon: FaTasks,
            colorKey: "orange",
            count: courseAssignmentsCount,
          },
        ]
      : []),
    {
      id: "live",
      label: "المحاضرات المباشرة",
      desc: hasActiveLiveStream ? "فيه بث شغال دلوقتي!" : "جلسات البث المباشر",
      icon: hasActiveLiveStream ? FaBroadcastTower : FaVideo,
      colorKey: hasActiveLiveStream ? "red" : "green",
      live: hasActiveLiveStream,
    },
    {
      id: "exams",
      label: "الامتحانات",
      desc: "الامتحانات الشاملة للكورس",
      icon: FaListOl,
      colorKey: "orange",
      count: courseExams?.length || 0,
    },
    {
      id: "files",
      label: "ملفات الكورس",
      desc: "المرفقات والملفات التعليمية",
      icon: FaFolderOpen,
      colorKey: "purple",
      count: courseFilesCount,
    },
  ];
  const activeSectionMeta = courseContentSections.find(
    (s) => s.id === activeSection,
  );

  return (
    <Box minH="100vh" bg={pageBg} dir="rtl" overflowX="hidden">
      {/* Hero Section - Full Width Image with Overlay */}
      <CourseHeroSection
        course={course}
        isTeacher={isTeacher}
        isAdmin={isAdmin}
        completionPercent={mockCompletionPercent}
        showProgress={!isTeacher && !isAdmin}
        lecturesCount={lectures?.length || 0}
      />

      {/* Video Player */}
      <VideoPlayer
        videoUrl={videoPlayer.videoUrl}
        videoTitle={videoPlayer.videoTitle}
        isVisible={videoPlayer.isVisible}
        onClose={handleCloseVideo}
        onToggleVisibility={handleToggleVideoVisibility}
        isTeacher={isTeacher}
      />
      {/* Course Insights (Mock UI) */}

      {/* زر إنشاء أكواد للمدرس فقط */}
      {isTeacher && (
        <Box className={crContainer} dir="rtl" py={3}>
          <Flex justify={{ base: "stretch", md: "flex-end" }} gap={3} flexWrap="wrap">
            <Button
              colorScheme="orange"
              leftIcon={<FaKey />}
              borderRadius="xl"
              onClick={() => setCodeModalOpen(true)}
              w={{ base: "full", sm: "auto" }}
              size="sm"
            >
              إنشاء أكواد
            </Button>
            <Button
              colorScheme="blue"
              variant="outline"
              leftIcon={<FaKey />}
              borderRadius="xl"
              onClick={() => {
                setShowCodesModal(true);
                fetchActivationCodes();
              }}
              w={{ base: "full", sm: "auto" }}
              size="sm"
            >
              عرض أكواد الكورس
            </Button>
          </Flex>
        </Box>
      )}
      {/* مودال إنشاء الأكواد */}
      <Modal
        isOpen={codeModalOpen}
        onClose={() => setCodeModalOpen(false)}
        isCentered
        size={{ base: "full", md: "md" }}
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent
          mx={{ base: 0, md: 4 }}
          borderRadius={{ base: "none", md: "xl" }}
          maxH={{ base: "100vh", md: "90vh" }}
        >
          <ModalHeader
            p={{ base: 3, md: 4 }}
            fontSize={{ base: "md", md: "lg" }}
          >
            إنشاء أكواد تفعيل للكورس
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleCreateCodes}>
            <ModalBody p={{ base: 3, md: 4 }}>
              <VStack spacing={{ base: 4, md: 5 }} align="stretch">
                <FormControl isRequired>
                  <FormLabel>عدد الأكواد</FormLabel>
                  <Input
                    type="number"
                    min={1}
                    value={codeCount}
                    onChange={(e) => setCodeCount(e.target.value)}
                    size={{ base: "sm", md: "md" }}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>تاريخ انتهاء الصلاحية</FormLabel>
                  <Input
                    type="datetime-local"
                    value={codeExpiresAt}
                    onChange={(e) => setCodeExpiresAt(e.target.value)}
                    size={{ base: "sm", md: "md" }}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter p={{ base: 3, md: 4 }} flexWrap="wrap" gap={2}>
              <Button
                variant="ghost"
                onClick={() => setCodeModalOpen(false)}
                mr={{ base: 0, md: 3 }}
                size={{ base: "sm", md: "md" }}
              >
                إلغاء
              </Button>
              <Button
                colorScheme="purple"
                type="submit"
                isLoading={codeLoading}
                size={{ base: "sm", md: "md" }}
              >
                إنشاء
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* مودال عرض الأكواد */}
      <Modal
        isOpen={showCodesModal}
        onClose={() => {
          setShowCodesModal(false);
          setSearchCode("");
        }}
        size={{ base: "full", md: "4xl", lg: "6xl" }}
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent
          borderRadius={{ base: "none", md: "2xl" }}
          overflow="hidden"
          mx={{ base: 0, md: 4 }}
          maxH={{ base: "100vh", md: "90vh" }}
        >
          <Box h="1" w="full" bg="blue.500" />
          <ModalHeader
            bg="blue.50"
            _dark={{ bg: "whiteAlpha.100", borderColor: "whiteAlpha.200" }}
            borderBottomWidth="1px"
            borderColor="blue.100"
            p={{ base: 3, md: 4 }}
            fontSize={{ base: "sm", md: "lg" }}
          >
            أكواد تفعيل الكورس
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p={{ base: 3, md: 4 }} overflowX="auto">
            {/* حقل البحث */}
            {activationCodes.length > 0 && (
              <Box
                mb={4}
                p={{ base: 3, md: 4 }}
                borderWidth={1}
                borderRadius="xl"
                bg="blue.50"
                _dark={{ bg: "whiteAlpha.50" }}
                borderColor="blue.100"
              >
                <Text
                  fontWeight="bold"
                  mb={3}
                  color="blue.700"
                  _dark={{ color: "blue.200" }}
                  fontSize={{ base: "sm", md: "md" }}
                >
                  البحث في الأكواد:
                </Text>
                <InputGroup>
                  <InputLeftElement>
                    <Icon as={FaSearch} color="blue.500" />
                  </InputLeftElement>
                  <Input
                    placeholder="ابحث بالكود..."
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    bg="white"
                    borderColor="blue.200"
                    _focus={{
                      borderColor: "blue.400",
                      boxShadow: "0 0 0 1px blue.400",
                    }}
                  />
                  {searchCode && (
                    <InputRightElement>
                      <IconButton
                        size="sm"
                        variant="ghost"
                        icon={<Icon as={FaTimes} />}
                        onClick={() => setSearchCode("")}
                        aria-label="مسح البحث"
                      />
                    </InputRightElement>
                  )}
                </InputGroup>
                {searchCode && (
                  <Text fontSize="sm" color="blue.600" mt={2}>
                    تم العثور على {filteredCodes.length} كود من أصل{" "}
                    {activationCodes.length}
                  </Text>
                )}
              </Box>
            )}

            {activationCodes.length > 0 && (
              <Box
                mb={4}
                p={4}
                borderWidth={1}
                borderRadius="xl"
                bg="blue.50"
                _dark={{ bg: "whiteAlpha.50", borderColor: "whiteAlpha.200" }}
                borderColor="blue.100"
              >
                <Text
                  fontWeight="bold"
                  mb={3}
                  color="blue.700"
                  _dark={{ color: "blue.200" }}
                >
                  تحديد نطاق التصدير:
                </Text>
                <Flex gap={4} alignItems="center" flexWrap="wrap">
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      من الكود رقم:
                    </Text>
                    <NumberInput
                      min={1}
                      max={activationCodes.length}
                      value={exportStartIndex}
                      onChange={(valueString, valueNumber) =>
                        setExportStartIndex(valueNumber)
                      }
                      size="sm"
                      w="100px"
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1}>
                      إلى الكود رقم:
                    </Text>
                    <NumberInput
                      min={1}
                      max={activationCodes.length}
                      value={exportEndIndex}
                      onChange={(valueString, valueNumber) =>
                        setExportEndIndex(valueNumber)
                      }
                      size="sm"
                      w="100px"
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </Box>
                  <Button
                    size="sm"
                    bg="blue.500"
                    color="white"
                    _hover={{ bg: "blue.600" }}
                    onClick={() => {
                      setExportStartIndex(1);
                      setExportEndIndex(activationCodes.length);
                    }}
                  >
                    تحديد الكل
                  </Button>
                  <Text
                    fontSize="sm"
                    color="blue.600"
                    _dark={{ color: "blue.300" }}
                  >
                    (إجمالي {activationCodes.length} كود)
                  </Text>
                </Flex>
                <Button
                  bg="blue.500"
                  color="white"
                  _hover={{ bg: "blue.600" }}
                  mt={3}
                  onClick={handleExportCodesPdf}
                  disabled={isExportingPdf || exportStartIndex > exportEndIndex}
                >
                  {isExportingPdf ? <Spinner size="sm" mr={2} /> : null}
                  تصدير الأكواد من {exportStartIndex} إلى {exportEndIndex}
                </Button>
              </Box>
            )}
            {codesLoading ? (
              <Center py={8}>
                <Spinner size="lg" color="blue.500" />
              </Center>
            ) : codesError ? (
              <Text color="red.500" textAlign="center">
                {codesError}
              </Text>
            ) : activationCodes.length === 0 ? (
              <Text color="gray.500" textAlign="center">
                لا توجد أكواد لهذا الكورس
              </Text>
            ) : filteredCodes.length === 0 && searchCode ? (
              <Box textAlign="center" py={8}>
                <Icon as={FaSearch} boxSize={12} color="gray.400" mb={4} />
                <Text color="gray.500" fontSize="lg" mb={2}>
                  لم يتم العثور على نتائج
                </Text>
                <Text color="gray.400" fontSize="sm">
                  لا توجد أكواد تطابق البحث: "{searchCode}"
                </Text>
                <Button
                  size="sm"
                  colorScheme="blue"
                  variant="outline"
                  mt={3}
                  onClick={() => setSearchCode("")}
                >
                  مسح البحث
                </Button>
              </Box>
            ) : (
              <>
                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  spacing={{ base: 3, md: 6 }}
                >
                  {filteredCodes.map((code) => (
                    <Box
                      key={code.id}
                      bg="white"
                      _dark={{ bg: "gray.800", borderColor: "whiteAlpha.200" }}
                      borderRadius="2xl"
                      p={5}
                      boxShadow="lg"
                      border="1px solid"
                      borderColor="blue.100"
                      _hover={{
                        transform: "translateY(-2px)",
                        boxShadow: "xl",
                        borderColor: "blue.300",
                        _dark: { borderColor: "blue.500" },
                      }}
                      transition="all 0.3s ease"
                      position="relative"
                      overflow="hidden"
                    >
                      <Box
                        h="1"
                        w="full"
                        bg="blue.500"
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                      />
                      <Flex
                        direction={{ base: "column", sm: "row" }}
                        align="center"
                        justify="space-between"
                        gap={4}
                      >
                        {/* كود التفعيل - عرض صغير وشكل واضح */}
                        <Box flex="1" minW={0} textAlign="center">
                          <Text
                            fontSize="xs"
                            color="blue.600"
                            _dark={{ color: "blue.300" }}
                            fontWeight="bold"
                            mb={1}
                          >
                            كود التفعيل
                          </Text>
                          <Text
                            fontFamily="mono"
                            fontSize="md"
                            fontWeight="800"
                            color="blue.800"
                            _dark={{ color: "blue.100", bg: "whiteAlpha.100" }}
                            letterSpacing="2px"
                            display="inline-block"
                            w="fit-content"
                            maxW="100%"
                            px={3}
                            py={2}
                            bg="blue.50"
                            borderRadius="lg"
                            borderLeft="4px solid"
                            borderColor="blue.500"
                          >
                            {code.code}
                          </Text>
                        </Box>
                        {/* QR */}
                        {code.qr_code ? (
                          <Image
                            src={code.qr_code}
                            alt={`QR ${code.code}`}
                            w="80px"
                            h="80px"
                            flexShrink={0}
                            borderRadius="xl"
                            border="2px solid"
                            borderColor="blue.200"
                            _dark={{ borderColor: "blue.600", bg: "gray.700" }}
                            bg="white"
                            p={1}
                          />
                        ) : (
                          <Box
                            w="80px"
                            h="80px"
                            flexShrink={0}
                            borderRadius="xl"
                            border="2px dashed"
                            borderColor="blue.300"
                            bg="blue.50"
                            _dark={{ bg: "whiteAlpha.100" }}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="xs"
                            color="blue.500"
                            fontWeight="bold"
                          >
                            QR
                          </Box>
                        )}
                      </Flex>
                      {/* الحالة فقط */}
                      <Box textAlign="center" mt={4}>
                        {code.is_expired ? (
                          <Badge
                            colorScheme="red"
                            fontSize="sm"
                            px={3}
                            py={1}
                            borderRadius="full"
                          >
                            منتهي الصلاحية
                          </Badge>
                        ) : code.is_fully_used ? (
                          <Badge
                            colorScheme="orange"
                            fontSize="sm"
                            px={3}
                            py={1}
                            borderRadius="full"
                          >
                            مستخدم بالكامل
                          </Badge>
                        ) : (
                          <Badge
                            colorScheme="green"
                            fontSize="sm"
                            px={3}
                            py={1}
                            borderRadius="full"
                          >
                            فعال
                          </Badge>
                        )}
                      </Box>
                    </Box>
                  ))}
                </SimpleGrid>
                {/* عنصر مخفي لتصدير الأكواد ككروت PDF */}
                <Box
                  id="codes-pdf-export"
                  style={{
                    display: "none",
                    width: "297mm",
                    height: "210mm",
                    background: "#fff",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    zIndex: -1,
                    direction: "rtl",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gridTemplateRows: "repeat(4, 1fr)",
                      gap: "5mm",
                      width: "100%",
                      height: "100%",
                      alignContent: "start",
                    }}
                  >
                    {activationCodes
                      .slice(exportStartIndex - 1, exportEndIndex)
                      .map((code, index) => (
                        <div
                          key={code.id}
                          style={{
                            margin: "3px",
                            padding: "0",
                            width: "100%",
                            height: "100%",
                            border: "1px solid rgba(49,130,206,0.25)",
                            borderRadius: "12px",
                            boxShadow: "0 2px 12px rgba(49,130,206,0.18)",
                            position: "relative",
                            overflow: "hidden",
                            background: "#f8fafc",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            minHeight: "40mm",
                            direction: "rtl",
                          }}
                        >
                          <div
                            style={{
                              background: "#3182ce",
                              padding: "6px 8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                              gap: "4px",
                            }}
                          >
                            <h2
                              style={{
                                fontSize: "13px",
                                fontWeight: "800",
                                color: "#fff",
                                margin: "0",
                                textAlign: "right",
                                flex: "1",
                                minWidth: "0",
                              }}
                            >
                              {user.name || "عمرو علي"}
                            </h2>
                            <span
                              style={{
                                fontSize: "9px",
                                color: "#fff",
                                fontWeight: "700",
                                background: "rgba(0,0,0,0.15)",
                                padding: "3px 6px",
                                borderRadius: "8px",
                              }}
                            >
                              {code.grade_name || "الصف الثاني الثانوي"}
                            </span>
                          </div>
                          <div
                            style={{
                              padding: "3px 8px",
                              background: "#bee3f8",
                              borderBottom: "1px solid rgba(49,130,206,0.25)",
                            }}
                          >
                            <p
                              style={{
                                fontSize: "10px",
                                fontWeight: "800",
                                color: "#1a365d",
                                margin: "0",
                                textAlign: "right",
                              }}
                            >
                              {course?.title || "الكورس"}
                            </p>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "6px 8px",
                              flex: "1",
                              gap: "8px",
                            }}
                          >
                            <div style={{ flex: "1", textAlign: "center" }}>
                              <div
                                style={{
                                  fontSize: "8px",
                                  color: "#2b6cb0",
                                  fontWeight: "700",
                                }}
                              >
                                كود التفعيل
                              </div>
                              <div style={{ marginTop: "8px" }}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    fontSize: "14px",
                                    color: "#1a365d",
                                    fontWeight: "800",
                                    letterSpacing: "1px",
                                    fontFamily: "monospace",
                                    padding: "4px 10px",
                                    background: "#fff",
                                    borderLeft: "4px solid #3182ce",
                                    borderRadius: "6px",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                                  }}
                                >
                                  {code.code}
                                </span>
                              </div>
                            </div>
                            <div style={{ flexShrink: "0" }}>
                              {code.qr_code ? (
                                <img
                                  src={code.qr_code}
                                  alt="QR"
                                  style={{
                                    width: "60px",
                                    height: "60px",
                                    border: "2px solid #3182ce",
                                    borderRadius: "10px",
                                    background: "#fff",
                                    padding: "2px",
                                    display: "block",
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: "60px",
                                    height: "60px",
                                    border: "2px dashed #3182ce",
                                    borderRadius: "10px",
                                    background: "#ebf8ff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "8px",
                                    color: "#3182ce",
                                    fontWeight: "bold",
                                  }}
                                >
                                  QR
                                </div>
                              )}
                            </div>
                          </div>
                          <div
                            style={{
                              padding: "6px 8px",
                              background: "#3182ce",
                            }}
                          >
                            <p
                              style={{
                                fontSize: "8px",
                                fontWeight: "700",
                                color: "#fff",
                                textAlign: "center",
                                margin: "0",
                              }}
                            >
                              01111272393 | 01288781012 | 01278284806
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </Box>
              </>
            )}
          </ModalBody>
          <ModalFooter
            borderTopWidth="1px"
            borderColor="blue.100"
            _dark={{ borderColor: "whiteAlpha.200" }}
            p={{ base: 3, md: 4 }}
          >
            <Button
              onClick={() => {
                setShowCodesModal(false);
                setSearchCode("");
              }}
              bg="blue.500"
              color="white"
              _hover={{ bg: "blue.600" }}
              borderRadius="xl"
              size={{ base: "sm", md: "md" }}
            >
              إغلاق
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Box className={crContainer} py={{ base: 4, md: 8 }} dir="rtl" w="full">
        <MotionBox
          initial="hidden"
          animate="visible"
          variants={itemVariants}
          w="100%"
          minW={0}
          overflowX="hidden"
        >
          <VStack spacing={{ base: 3, md: 5 }} align="stretch" w="full">
            {/* شريط أقسام المحتوى — أعلى الصفحة */}
            <Box data-tour-id="course-content-nav">
              <CourseContentNav
                sections={courseContentSections}
                activeId={activeSection}
                onChange={setActiveSection}
              />
            </Box>

            {/* منطقة المحتوى */}
            <Box
              data-tour-id="course-content-panel"
              w="full"
              minW={0}
              bg={sectionBg}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="0 1px 3px rgba(15,23,42,0.05)"
              p={{ base: 3.5, md: 6 }}
              minH="420px"
            >
              {activeSectionMeta && activeSection !== "live" ? (
                <SectionPanelHeader section={activeSectionMeta} />
              ) : null}

              {activeSection === "live" && (
                <>
                  {isAdmin || isTeacher ? (
                    <CourseStreams courseId={id} />
                  ) : (
                    <StudentStreamsList courseId={id} />
                  )}
                </>
              )}

              {activeSection === "lectures" && (
                <LecturesTab
                  lectures={lectures}
                  isTeacher={isTeacher}
                  isAdmin={isAdmin}
                  lectureAccessMode={lectureAccessMode}
                  isCourseBasedAssignments={isCourseBasedAssignments}
                  courseId={id}
                  accessSettings={accessSettings}
                  accessSettingsLoading={accessSettingsLoading}
                  onRefreshCourse={refreshCourseData}
                    expandedLecture={expandedLecture}
                    setExpandedLecture={setExpandedLecture}
                    handleAddLecture={handleAddLecture}
                    handleEditLecture={handleEditLecture}
                    handleDeleteLecture={handleDeleteLecture}
                    handleAddVideo={handleAddVideo}
                    handleEditVideo={handleEditVideo}
                    handleDeleteVideo={handleDeleteVideo}
                    handleAddFile={handleAddFile}
                    handleEditFile={handleEditFile}
                    handleDeleteFile={handleDeleteFile}
                    setExamModal={setExamModal}
                    setDeleteExamDialog={setDeleteExamDialog}
                    examActionLoading={actionLoading}
                    itemBg={itemBg}
                    sectionBg={sectionBg}
                    headingColor={headingColor}
                    subTextColor={subTextColor}
                    borderColor={borderColor}
                    dividerColor={dividerColor}
                    textColor={textColor}
                    formatDate={formatDate}
                    onAddBulkQuestions={handleOpenBulkQuestionsModal}
                    handleOpenVideo={handleOpenVideo}
                  tourLectureId={lectureTourMeta.lectureId}
                />
              )}

              {activeSection === "assignments" && isCourseBasedAssignments && (
                <CourseAssignmentsTab
                  assignments={courseAssignments}
                  loading={
                    courseAssignmentsLoading &&
                    !courseAssignmentsFromDetails.length
                  }
                  isTeacher={isTeacher}
                  isAdmin={isAdmin}
                  examActionLoading={examActionLoading}
                  onAddAssignment={(data) =>
                    setExamModal({
                      isOpen: true,
                      type: "add",
                      lectureId: null,
                      courseLevel: true,
                      data,
                    })
                  }
                  onEditAssignment={(exam) =>
                    setExamModal({
                      isOpen: true,
                      type: "edit",
                      lectureId: null,
                      courseLevel: true,
                      data: exam,
                    })
                  }
                  onDeleteAssignment={(examId, title) =>
                    setDeleteExamDialog({ isOpen: true, examId, title })
                  }
                />
              )}

              {activeSection === "files" && (
                <CourseFilesTab
                  courseId={id}
                  isTeacher={isTeacher}
                  isAdmin={isAdmin}
                  borderColor={borderColor}
                  sectionBg={sectionBg}
                  textColor={textColor}
                  subTextColor={subTextColor}
                />
              )}

              {activeSection === "exams" && (
                <CourseExamsTab
                  courseExams={courseExams}
                  courseExamsLoading={courseExamsLoading}
                  courseExamsError={courseExamsError}
                  headingColor={headingColor}
                  sectionBg={sectionBg}
                  dividerColor={dividerColor}
                  formatDate={formatDate}
                  isTeacher={isTeacher}
                  token={token}
                  courseId={id}
                  refreshExams={refreshExams}
                  onAddBulkQuestions={handleOpenBulkQuestionsModal}
                />
              )}

            </Box>
          </VStack>
        </MotionBox>
      </Box>

      {/* Lecture Modal */}
      <LectureModal
        isOpen={lectureModal.isOpen}
        onClose={() =>
          setLectureModal({ isOpen: false, type: "add", data: null })
        }
        type={lectureModal.type}
        data={lectureModal.data}
        lectureAccessMode={lectureAccessMode}
        groupsEnabled={courseGroupsEnabled}
        availableGroups={activeTeacherGroups}
        onSubmit={lectureModal.type === "add" ? createLecture : updateLecture}
        loading={actionLoading}
      />

      {/* Video Modal */}
      <VideoModal
        isOpen={videoModal.isOpen}
        onClose={() =>
          setVideoModal({
            isOpen: false,
            type: "add",
            lectureId: null,
            data: null,
          })
        }
        type={videoModal.type}
        data={videoModal.data}
        lectureId={videoModal.lectureId}
        onSubmit={videoModal.type === "add" ? createVideo : updateVideo}
        loading={actionLoading}
      />

      {/* File Modal */}
      <FileModal
        isOpen={fileModal.isOpen}
        onClose={() =>
          setFileModal({
            isOpen: false,
            type: "add",
            lectureId: null,
            data: null,
          })
        }
        type={fileModal.type}
        data={fileModal.data}
        lectureId={fileModal.lectureId}
        onSubmit={fileModal.type === "add" ? createFile : updateFile}
        loading={actionLoading}
      />

      {/* Exam Modal */}
      <ExamModal
        isOpen={examModal.isOpen}
        onClose={() =>
          setExamModal({
            isOpen: false,
            type: "add",
            lectureId: null,
            courseLevel: false,
            data: null,
          })
        }
        type={examModal.type}
        data={examModal.data}
        courseLevel={examModal.courseLevel}
        onSubmit={
          examModal.type === "add"
            ? examModal.courseLevel
              ? createCourseExam
              : (formData) => createExam(examModal.lectureId, formData)
            : updateExam
        }
        loading={examActionLoading}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={deleteDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={() =>
          setDeleteDialog({ isOpen: false, type: "", id: null, title: "" })
        }
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              تأكيد الحذف
            </AlertDialogHeader>

            <AlertDialogBody>
              هل أنت متأكد من حذف "{deleteDialog.title}"؟ لا يمكن التراجع عن هذا
              الإجراء.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={() =>
                  setDeleteDialog({
                    isOpen: false,
                    type: "",
                    id: null,
                    title: "",
                  })
                }
              >
                إلغاء
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteConfirm}
                ml={3}
                isLoading={actionLoading}
              >
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Delete Exam Confirmation Dialog */}
      <AlertDialog
        isOpen={deleteExamDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={() =>
          setDeleteExamDialog({ isOpen: false, examId: null, title: "" })
        }
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              تأكيد حذف الامتحان
            </AlertDialogHeader>
            <AlertDialogBody>
              هل أنت متأكد من حذف "{deleteExamDialog.title}"؟ لا يمكن التراجع عن
              هذا الإجراء.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={() =>
                  setDeleteExamDialog({
                    isOpen: false,
                    examId: null,
                    title: "",
                  })
                }
              >
                إلغاء
              </Button>
              <Button
                colorScheme="red"
                onClick={() => {
                  deleteExam(deleteExamDialog.examId);
                  setDeleteExamDialog({
                    isOpen: false,
                    examId: null,
                    title: "",
                  });
                }}
                ml={3}
                isLoading={examActionLoading}
              >
                حذف
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Bulk Questions Modal */}
      <BulkQuestionsModal
        isOpen={bulkQuestionsModal.isOpen}
        onClose={() => {
          setBulkQuestionsModal({
            isOpen: false,
            examId: null,
            examTitle: "",
            examType: "",
          });
        }}
        examId={bulkQuestionsModal.examId}
        examTitle={bulkQuestionsModal.examTitle}
        examType={bulkQuestionsModal.examType}
        onSubmit={(examId, data, questionType) =>
          addBulkQuestions(
            examId,
            data,
            questionType,
            bulkQuestionsModal.examType,
          )
        }
        loading={bulkQuestionsLoading}
      />
      {console.log("BulkQuestionsModal state:", bulkQuestionsModal)}
      {console.log("BulkQuestionsModal isOpen:", bulkQuestionsModal.isOpen)}

      <ScrollToTop />

      <CoursePageTour
        isOpen={courseTourOpen}
        courseId={id}
        lectureTourMeta={lectureTourMeta}
        onClose={() => setCourseTourOpen(false)}
      />
    </Box>
  );
};

export default CourseDetailsPage;
