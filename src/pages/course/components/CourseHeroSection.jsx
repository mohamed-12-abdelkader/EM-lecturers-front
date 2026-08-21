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
import { crBtnPrimary, crContainer } from "../courseTheme";

function RatingStars({ value }) {
  const num = Math.min(5, Math.max(0, Number(value) || 0));
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`تقييم ${num} من 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <FaStar
          key={i}
          className={`text-[11px] ${i < Math.round(num) ? "text-orange-400" : "text-white/25"}`}
        />
      ))}
    </span>
  );
}

function StatChip({ icon: IconComp, label, value, extra }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 backdrop-blur-md">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-bl from-white/20 to-white/5 text-orange-300">
        <IconComp className="text-sm" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-white/65">{label}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <p className="truncate font-heading text-sm font-bold text-white">{value}</p>
          {extra}
        </div>
      </div>
    </div>
  );
}

const heroGhostBtn =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-md transition-all duration-200 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

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
      <section
        className="relative overflow-hidden pt-[5.5rem] md:pt-[6.25rem]"
        dir="rtl"
        data-tour-id="course-hero"
      >
        <div className="absolute inset-0 bg-[linear-gradient(125deg,#082B57_0%,#0E4C92_48%,#1A6BB8_100%)]" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 70% at 100% 0%, rgba(237,137,54,0.28), transparent 42%), radial-gradient(ellipse 70% 80% at 0% 100%, rgba(255,255,255,0.14), transparent 50%), linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "auto, auto, 28px 28px, 28px 28px",
          }}
        />
        <div className="pointer-events-none absolute -top-24 end-[-4rem] h-64 w-64 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 start-[-3rem] h-56 w-56 rounded-full bg-orange-400/20 blur-2xl" />
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-l from-transparent via-orange-400 to-orange-500" />

        <div className={`${crContainer} relative z-10 pb-7 pt-4 md:pb-10 md:pt-5 lg:pb-12`}>
          <nav className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80 backdrop-blur-md">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex cursor-pointer items-center gap-1.5 font-semibold text-white transition-colors hover:text-orange-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <FaArrowRight className="text-[10px]" />
              الكورسات
            </button>
            <FaChevronLeft className="text-[9px] text-white/40" aria-hidden />
            <span className="max-w-[180px] truncate font-medium text-white/90 sm:max-w-md">{courseTitle}</span>
          </nav>

          <div className="grid items-center gap-7 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-10">
            <div className="relative mx-auto w-full max-w-[400px] lg:mx-0">
              <div className="absolute -inset-[10px] rounded-[1.75rem] bg-gradient-to-bl from-orange-400/55 via-transparent to-sky-300/25 blur-md" />
              <div className="relative overflow-hidden rounded-3xl border-2 border-white/35 bg-slate-800 shadow-[0_28px_60px_-24px_rgba(0,0,0,0.55)]">
                <img
                  src={courseCoverUrl}
                  alt={courseTitle}
                  className="aspect-video w-full object-cover"
                  loading="eager"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#082B57]/55 via-transparent to-white/10" />
                {lecturesCount > 0 && (
                  <span className="absolute bottom-3 start-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-[#082B57]/70 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                    <FaBookOpen className="text-[10px] text-orange-300" />
                    {lecturesCount} محاضرة
                  </span>
                )}
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {gradeName && (
                  <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-extrabold text-white shadow-[0_8px_18px_-10px_rgba(221,107,32,0.9)]">
                    {gradeName}
                  </span>
                )}
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-md">
                  {heroSubtitle}
                </span>
              </div>

              <h1 className="mt-3 font-heading text-[1.7rem] font-black leading-[1.35] tracking-tight text-white md:text-3xl lg:text-[2.15rem]">
                {courseTitle}
              </h1>

              <p className="mt-3 max-w-2xl line-clamp-3 text-sm leading-7 text-white/80 md:text-[15px]">
                {course?.description || "محتوى تعليمي منظم يأخذك خطوة بخطوة من الأساسيات حتى الإتقان."}
              </p>

              <div className={`mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2 ${lecturesCount > 0 ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
                <StatChip icon={FaClock} label="المدة" value={durationText} />
                <StatChip icon={FaUsers} label="الطلاب" value={`${studentsDisplay} طالب`} />
                <StatChip
                  icon={FaStar}
                  label="التقييم"
                  value={ratingDisplay}
                  extra={<RatingStars value={ratingDisplay} />}
                />
                {lecturesCount > 0 && (
                  <StatChip icon={FaBookOpen} label="المحاضرات" value={`${lecturesCount} محاضرة`} />
                )}
              </div>

              {showProgress && completionPercent != null && (
                <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-white">تقدمك في الكورس</span>
                    <span className="font-heading text-sm font-extrabold text-orange-300">{completionPercent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-orange-300 to-orange-500 transition-all duration-700"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {(canManageStudents || isTeacher) && (
                <div className="mt-6 flex flex-wrap gap-2.5">
                  {(isTeacher || isAdmin) && (
                    <button type="button" className={crBtnPrimary} onClick={onOpen}>
                      <FaUserPlus />
                      تفعيل طالب
                    </button>
                  )}
                  {isTeacher && (
                    <Link to={`/CourseStatisticsPage/${course.id}`} className={heroGhostBtn}>
                      <FaChartBar />
                      الإحصائيات
                    </Link>
                  )}
                  {canManageStudents && (
                    <button type="button" className={heroGhostBtn} onClick={handleOpenEnrollmentsModal}>
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
