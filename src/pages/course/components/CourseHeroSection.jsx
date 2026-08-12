import React, { useMemo, useState } from "react";
import { getHeroImageUrl, resolvePublicImageUrl } from "../../../utils/highQualityImageUrl";
import {
  Icon,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  useToast,
  VStack,
  HStack,
  Text,
  useColorModeValue,
  useDisclosure,
  Box,
  Center,
  Avatar,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
} from "@chakra-ui/react";
import {
  FaUserGraduate,
  FaUserPlus,
  FaChartBar,
  FaClock,
  FaUsers,
  FaStar,
  FaSearch,
  FaPhone,
  FaEnvelope,
  FaExternalLinkAlt,
  FaArrowRight,
  FaBookOpen,
  FaChevronLeft,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import baseUrl from "../../../api/baseUrl";
import { crBtnOutline, crBtnSecondary, crContainer } from "../courseTheme";

function RatingStars({ value }) {
  const num = Math.min(5, Math.max(0, Number(value) || 0));
  return (
    <span className="inline-flex items-center gap-1" aria-label={`تقييم ${num} من 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <FaStar
          key={i}
          className={`text-[11px] ${i < Math.round(num) ? "text-orange-400" : "text-slate-300"}`}
        />
      ))}
    </span>
  );
}

function MetaDivider() {
  return <span className="hidden h-4 w-px bg-slate-200 sm:inline-block" aria-hidden />;
}

function InlineMeta({ icon: IconComp, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
      <IconComp className="shrink-0 text-xs text-blue-500" />
      <span>{children}</span>
    </span>
  );
}

const CourseHeroSection = ({
  course,
  isTeacher,
  isAdmin,
  completionPercent,
  showProgress = false,
  lecturesCount = 0,
}) => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEnrollmentsOpen,
    onOpen: onEnrollmentsOpen,
    onClose: onEnrollmentsClose,
  } = useDisclosure();
  const [studentId, setStudentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [enrollmentSearch, setEnrollmentSearch] = useState("");
  const toast = useToast();
  const token = localStorage.getItem("token");
  const canManageStudents = isTeacher || isAdmin;
  const modalBg = useColorModeValue("white", "gray.800");
  const tableHeadBg = useColorModeValue("gray.50", "gray.700");
  const mutedTextColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const fetchEnrollments = async () => {
    if (!course?.id) return;
    try {
      setLoadingEnrollments(true);
      const response = await baseUrl.get(`api/course/${course.id}/enrollments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEnrollments(response.data.students || []);
    } catch (error) {
      toast({
        title: "خطأ",
        description: error.response?.data?.message || "فشل في جلب قائمة الطلاب",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const handleOpenEnrollmentsModal = () => {
    onEnrollmentsOpen();
    fetchEnrollments();
  };

  const filteredEnrollments = useMemo(() => {
    const query = enrollmentSearch.trim().toLowerCase();
    if (!query) return enrollments;
    return enrollments.filter((student) => {
      const haystack = [student.name, student.email, student.phone, student.activation_code]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [enrollments, enrollmentSearch]);

  const ratingRaw =
    course?.rating ?? course?.average_rating ?? course?.avg_rating ?? course?.course_rating ?? course?.rate;
  const ratingNum = ratingRaw != null ? Number(ratingRaw) : null;
  const ratingDisplay = Number.isFinite(ratingNum) ? ratingNum.toFixed(1) : "4.8";

  const durationText =
    course?.duration_text ??
    (course?.duration_hours != null
      ? `${course.duration_hours} ساعة`
      : course?.duration_minutes != null
        ? `${course.duration_minutes} دقيقة`
        : "12 ساعة");

  const studentsCountRaw =
    course?.students_count ?? course?.enrolled_students ?? course?.total_students ?? course?.participants;
  const studentsCountNum = studentsCountRaw != null ? Number(studentsCountRaw) : null;
  const studentsDisplay = (() => {
    if (!Number.isFinite(studentsCountNum)) return "500+";
    if (studentsCountNum >= 1000) return `${Math.floor(studentsCountNum / 100) / 10}k+`;
    return `${studentsCountNum}+`;
  })();

  const heroSubtitle =
    course?.subtitle ?? course?.headline ?? course?.category_name ?? course?.grade_name ?? "كورس تعليمي";

  const gradeName = course?.grade_name || null;
  const courseTitle = course?.title || "الكورس";
  const courseCoverUrl =
    getHeroImageUrl(course?.avatar) ||
    "https://via.placeholder.com/760x428/2B6CB0/FFFFFF?text=Course";

  const handleActivateStudent = async () => {
    if (!studentId.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الطالب",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(true);
      await baseUrl.post(
        `api/course/${course.id}/open-for-student/${studentId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast({
        title: "تم التفعيل بنجاح",
        description: `تم تفعيل الطالب برقم ${studentId} للكورس`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
      setStudentId("");
      if (isEnrollmentsOpen) fetchEnrollments();
    } catch (error) {
      toast({
        title: "خطأ في التفعيل",
        description: error.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <section className="relative bg-white dark:bg-slate-950" dir="rtl" data-tour-id="course-hero">
        {/* شريط علوي */}
        <div className="bg-blue-500 pb-20 pt-5 md:pb-28 md:pt-6">
          <div className={crContainer}>
            <nav className="flex flex-wrap items-center gap-2 text-sm text-blue-100">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex cursor-pointer items-center gap-1.5 font-medium text-white/90 transition-colors hover:text-white"
              >
                <FaArrowRight className="text-[10px]" />
                الكورسات
              </button>
              <FaChevronLeft className="text-[9px] text-blue-200" aria-hidden />
              <span className="max-w-[200px] truncate font-medium text-white sm:max-w-md">{courseTitle}</span>
            </nav>
          </div>
        </div>

        {/* المحتوى الرئيسي */}
        <div className={`${crContainer} relative z-10 -mt-16 pb-8 md:-mt-20`}>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
            {/* غلاف الكورس */}
            <div className="mx-auto w-full max-w-[400px] shrink-0 md:mx-0 md:w-[min(100%,380px)]">
              <div className="overflow-hidden rounded-xl border-[3px] border-white bg-slate-200 shadow-[0_12px_40px_rgba(15,23,42,0.18)] dark:border-slate-800">
                <img
                  src={courseCoverUrl}
                  alt={courseTitle}
                  className="aspect-video w-full object-cover"
                  loading="eager"
                />
              </div>
            </div>

            {/* بطاقة التفاصيل */}
            <div className="min-w-0 flex-1 rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-7">
              <div className="flex flex-wrap items-center justify-start gap-2">
                {gradeName && (
                  <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                    {gradeName}
                  </span>
                )}
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {heroSubtitle}
                </span>
              </div>

              <h1 className="mt-3 font-heading text-2xl font-bold leading-snug text-slate-900 dark:text-white md:text-[1.65rem] lg:text-3xl">
                {courseTitle}
              </h1>

              <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600 dark:text-slate-400 md:text-[15px]">
                {course?.description || "محتوى تعليمي منظم يأخذك خطوة بخطوة من الأساسيات حتى الإتقان."}
              </p>

              {/* بيانات سريعة */}
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-slate-100 py-4 dark:border-slate-800">
                <InlineMeta icon={FaClock}>{durationText}</InlineMeta>
                <MetaDivider />
                <InlineMeta icon={FaUsers}>{studentsDisplay} طالب</InlineMeta>
                <MetaDivider />
                <span className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <RatingStars value={ratingDisplay} />
                  <span className="font-bold text-slate-800 dark:text-white">{ratingDisplay}</span>
                </span>
                {lecturesCount > 0 && (
                  <>
                    <MetaDivider />
                    <InlineMeta icon={FaBookOpen}>{lecturesCount} محاضرة</InlineMeta>
                  </>
                )}
              </div>

              {showProgress && completionPercent != null && (
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">تقدمك في الكورس</span>
                    <span className="font-bold text-blue-500">{completionPercent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-700"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {(canManageStudents || isTeacher) && (
                <div className="mt-6 flex flex-wrap gap-2.5 border-t border-slate-100 pt-5 dark:border-slate-800">
                  {(isTeacher || isAdmin) && (
                    <button type="button" className={crBtnSecondary} onClick={onOpen}>
                      <FaUserPlus />
                      تفعيل طالب
                    </button>
                  )}
                  {isTeacher && (
                    <Link to={`/CourseStatisticsPage/${course.id}`} className={crBtnOutline}>
                      <FaChartBar />
                      الإحصائيات
                    </Link>
                  )}
                  {canManageStudents && (
                    <button type="button" className={crBtnOutline} onClick={handleOpenEnrollmentsModal}>
                      <FaUserGraduate />
                      المشتركين ({studentsCountNum ?? enrollments.length ?? 0})
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Activate Student Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", md: "md" }} scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
        <ModalContent
          bg={useColorModeValue("white", "gray.800")}
          borderRadius={{ base: "none", md: "2xl" }}
          mx={{ base: 0, md: 4 }}
          maxH={{ base: "100vh", md: "90vh" }}
        >
          <ModalHeader borderBottomWidth="1px" borderColor="gray.100">
            <HStack spacing={3}>
              <Center w={10} h={10} bg="blue.50" borderRadius="lg">
                <Icon as={FaUserPlus} color="blue.500" boxSize={5} />
              </Center>
              <Text fontWeight="bold">تفعيل طالب للكورس</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton left={4} right="auto" />
          <ModalBody py={6}>
            <VStack spacing={4}>
              <Text fontSize="sm" color={mutedTextColor} textAlign="center">
                أدخل رقم الطالب (ID) لتفعيله في هذا الكورس.
              </Text>
              <FormControl isRequired>
                <FormLabel fontWeight="bold">رقم الطالب</FormLabel>
                <Input
                  type="number"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="مثال: 12345"
                  borderRadius="lg"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={onClose} isDisabled={isLoading} borderRadius="lg">
              إلغاء
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleActivateStudent}
              isLoading={isLoading}
              loadingText="جاري التفعيل..."
              leftIcon={<Icon as={FaUserPlus} />}
              borderRadius="lg"
            >
              تفعيل
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Enrolled Students Modal */}
      <Modal
        isOpen={isEnrollmentsOpen}
        onClose={onEnrollmentsClose}
        isCentered
        size={{ base: "full", md: "4xl" }}
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
        <ModalContent bg={modalBg} borderRadius={{ base: "none", md: "2xl" }} maxH={{ base: "100vh", md: "90vh" }} mx={{ base: 0, md: 4 }}>
          <ModalHeader borderBottomWidth="1px" borderColor={borderColor}>
            <HStack spacing={3}>
              <Center w={10} h={10} bg="blue.50" borderRadius="lg">
                <Icon as={FaUsers} color="blue.500" />
              </Center>
              <Box>
                <Text fontWeight="bold">الطلاب المسجلين</Text>
                <Text fontSize="sm" color={mutedTextColor}>
                  {courseTitle}
                </Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton left={4} right="auto" />

          <ModalBody py={4}>
            <InputGroup mb={4}>
              <InputLeftElement pointerEvents="none">
                <Icon as={FaSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                value={enrollmentSearch}
                onChange={(e) => setEnrollmentSearch(e.target.value)}
                placeholder="ابحث بالاسم أو البريد أو الهاتف..."
                borderRadius="lg"
              />
            </InputGroup>

            {loadingEnrollments ? (
              <Center py={12}>
                <Text color={mutedTextColor}>جاري التحميل...</Text>
              </Center>
            ) : filteredEnrollments.length > 0 ? (
              <TableContainer borderWidth="1px" borderColor={borderColor} borderRadius="lg">
                <Table size="sm" variant="simple">
                  <Thead bg={tableHeadBg}>
                    <Tr>
                      <Th>الطالب</Th>
                      <Th>التواصل</Th>
                      <Th>تاريخ الاشتراك</Th>
                      <Th>الحالة</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredEnrollments.map((student) => (
                      <Tr key={student.id}>
                        <Td>
                          <HStack spacing={3}>
                            <Avatar size="sm" name={student.name} src={resolvePublicImageUrl(student.avatar)} />
                            <Text fontWeight="semibold" fontSize="sm">
                              {student.name || "—"}
                            </Text>
                          </HStack>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={1}>
                            {student.phone && (
                              <HStack spacing={1} fontSize="xs" color={mutedTextColor}>
                                <Icon as={FaPhone} boxSize={3} />
                                <Text>{student.phone}</Text>
                              </HStack>
                            )}
                            {student.email && (
                              <HStack spacing={1} fontSize="xs" color={mutedTextColor}>
                                <Icon as={FaEnvelope} boxSize={3} />
                                <Text noOfLines={1}>{student.email}</Text>
                              </HStack>
                            )}
                          </VStack>
                        </Td>
                        <Td fontSize="xs" whiteSpace="nowrap">
                          {student.enrolled_at ? dayjs(student.enrolled_at).format("YYYY/MM/DD") : "—"}
                        </Td>
                        <Td>
                          <Badge colorScheme={student.is_blocked_by_teacher ? "red" : "green"} variant="subtle" fontSize="xs">
                            {student.is_blocked_by_teacher ? "محظور" : "نشط"}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            ) : (
              <Center py={12}>
                <Text color={mutedTextColor}>
                  {enrollmentSearch.trim() ? "لا توجد نتائج" : "لا يوجد طلاب مسجلين بعد"}
                </Text>
              </Center>
            )}
          </ModalBody>

          <ModalFooter borderTopWidth="1px" borderColor={borderColor} gap={2}>
            <Button variant="ghost" onClick={onEnrollmentsClose} borderRadius="lg">
              إغلاق
            </Button>
            <Link to={`/CourseStudentsPage/${course.id}`}>
              <Button
                as="span"
                colorScheme="blue"
                variant="outline"
                borderRadius="lg"
                leftIcon={<Icon as={FaExternalLinkAlt} />}
                onClick={onEnrollmentsClose}
              >
                إدارة الطلاب
              </Button>
            </Link>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CourseHeroSection;
