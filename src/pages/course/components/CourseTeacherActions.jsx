import React, { useEffect, useMemo, useState } from "react";
import { resolvePublicImageUrl } from "../../../utils/highQualityImageUrl";
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
  Flex,
  SimpleGrid,
} from "@chakra-ui/react";
import {
  FaUserGraduate,
  FaUserPlus,
  FaChartBar,
  FaUsers,
  FaSearch,
  FaPhone,
  FaEnvelope,
  FaExternalLinkAlt,
  FaKey,
  FaCompass,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import baseUrl from "../../../api/baseUrl";
import {
  TOUR_CLOSE_ACTIVATE_STUDENT,
  TOUR_CLOSE_ENROLLMENTS,
  TOUR_OPEN_ACTIVATE_STUDENT,
  TOUR_OPEN_ENROLLMENTS,
} from "../../../utils/teacherCoursePageTour";

const BLUE = "#3182CE";
const ORANGE = "#DD6B20";

function ActionTile({
  "data-tour-id": tourId,
  icon: IconComp,
  label,
  onClick,
  to,
  tone = "blue",
  primary = false,
}) {
  const accent = tone === "orange" ? ORANGE : BLUE;
  const softBg = tone === "orange" ? "orange.50" : "blue.50";

  const inner = (
    <Flex
      direction="column"
      align="center"
      justify="center"
      gap={1.5}
      w="full"
      minH={{ base: "72px", md: "80px" }}
      px={2}
      py={2.5}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={primary ? "transparent" : "gray.200"}
      bg={primary ? accent : "white"}
      color={primary ? "white" : "gray.700"}
      boxShadow={primary ? `0 8px 18px ${accent}33` : "sm"}
      transition="all 0.15s ease"
      _groupHover={{
        transform: "translateY(-1px)",
        borderColor: primary ? "transparent" : accent,
        bg: primary ? accent : softBg,
        filter: primary ? "brightness(0.96)" : undefined,
      }}
      _dark={{
        bg: primary ? accent : "gray.800",
        borderColor: primary ? "transparent" : "whiteAlpha.200",
        color: primary ? "white" : "gray.100",
      }}
    >
      <Flex
        w="32px"
        h="32px"
        align="center"
        justify="center"
        borderRadius="lg"
        bg={primary ? "whiteAlpha.25" : softBg}
        color={primary ? "white" : accent}
        _dark={{ bg: primary ? "whiteAlpha.25" : "whiteAlpha.100" }}
      >
        <Icon as={IconComp} boxSize={3.5} />
      </Flex>
      <Text
        fontSize={{ base: "10px", sm: "11px", md: "12px" }}
        fontWeight="800"
        textAlign="center"
        lineHeight="1.3"
        noOfLines={2}
      >
        {label}
      </Text>
    </Flex>
  );

  if (to) {
    return (
      <Box
        as={Link}
        to={to}
        data-tour-id={tourId}
        role="group"
        display="block"
        h="full"
        _hover={{ textDecoration: "none" }}
      >
        {inner}
      </Box>
    );
  }

  return (
    <Box
      as="button"
      type="button"
      onClick={onClick}
      data-tour-id={tourId}
      role="group"
      w="full"
      h="full"
      textAlign="start"
    >
      {inner}
    </Box>
  );
}

/** أدوات إدارة الكورس للمدرس/الأدمن */
export default function CourseTeacherActions({
  course,
  isTeacher,
  isAdmin,
  onCreateCodes,
  onViewCodes,
  onStartTour,
}) {
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
  const panelBg = useColorModeValue("white", "gray.900");
  const panelBorder = useColorModeValue("gray.200", "whiteAlpha.200");
  const courseTitle = course?.title || "الكورس";

  const studentsCountRaw =
    course?.students_count ?? course?.enrolled_students ?? course?.total_students ?? course?.participants;
  const studentsCountNum = studentsCountRaw != null ? Number(studentsCountRaw) : null;

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

  useEffect(() => {
    const openActivate = () => onOpen();
    const closeActivate = () => onClose();
    const openEnroll = () => handleOpenEnrollmentsModal();
    const closeEnroll = () => onEnrollmentsClose();

    window.addEventListener(TOUR_OPEN_ACTIVATE_STUDENT, openActivate);
    window.addEventListener(TOUR_CLOSE_ACTIVATE_STUDENT, closeActivate);
    window.addEventListener(TOUR_OPEN_ENROLLMENTS, openEnroll);
    window.addEventListener(TOUR_CLOSE_ENROLLMENTS, closeEnroll);

    return () => {
      window.removeEventListener(TOUR_OPEN_ACTIVATE_STUDENT, openActivate);
      window.removeEventListener(TOUR_CLOSE_ACTIVATE_STUDENT, closeActivate);
      window.removeEventListener(TOUR_OPEN_ENROLLMENTS, openEnroll);
      window.removeEventListener(TOUR_CLOSE_ENROLLMENTS, closeEnroll);
    };
  }, [onOpen, onClose, onEnrollmentsClose]);

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

  if (!canManageStudents && !isTeacher) return null;

  const actions = [
    (isTeacher || isAdmin) && {
      key: "activate",
      tourId: "course-hero-activate",
      icon: FaUserPlus,
      label: "تفعيل طالب",
      onClick: onOpen,
      tone: "orange",
      primary: true,
    },
    isTeacher && {
      key: "stats",
      tourId: "course-hero-stats",
      icon: FaChartBar,
      label: "الإحصائيات",
      to: `/CourseStatisticsPage/${course.id}`,
      tone: "blue",
    },
    canManageStudents && {
      key: "enrollments",
      tourId: "course-hero-enrollments",
      icon: FaUserGraduate,
      label: `المشتركين (${studentsCountNum ?? enrollments.length ?? 0})`,
      onClick: handleOpenEnrollmentsModal,
      tone: "blue",
    },
    isTeacher && onCreateCodes && {
      key: "create-codes",
      tourId: "course-create-codes-btn",
      icon: FaKey,
      label: "إنشاء أكواد",
      onClick: onCreateCodes,
      tone: "orange",
      primary: true,
    },
    isTeacher && onViewCodes && {
      key: "view-codes",
      tourId: "course-view-codes-btn",
      icon: FaKey,
      label: "عرض الأكواد",
      onClick: onViewCodes,
      tone: "blue",
    },
    onStartTour && {
      key: "tour",
      tourId: "course-tour-restart",
      icon: FaCompass,
      label: "جولة الإدارة",
      onClick: onStartTour,
      tone: "orange",
    },
  ].filter(Boolean);

  return (
    <>
      <Box
        w="full"
        bg={panelBg}
        borderWidth="1px"
        borderColor={panelBorder}
        borderRadius="2xl"
        p={{ base: 2.5, md: 3 }}
        boxShadow="sm"
      >
        <Flex align="center" justify="space-between" mb={2.5} gap={2}>
          <Text fontSize="sm" fontWeight="800" color="gray.800" _dark={{ color: "white" }}>
            أدوات الإدارة
          </Text>
          <Text fontSize="10px" fontWeight="600" color="gray.400">
            {actions.length} أوامر
          </Text>
        </Flex>

        <SimpleGrid columns={{ base: 3, sm: 3, md: 6 }} spacing={{ base: 2, md: 2.5 }}>
          {actions.map((item) => (
            <ActionTile
              key={item.key}
              data-tour-id={item.tourId}
              icon={item.icon}
              label={item.label}
              onClick={item.onClick}
              to={item.to}
              tone={item.tone}
              primary={item.primary}
            />
          ))}
        </SimpleGrid>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "sm", md: "md" }} scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
        <ModalContent
          data-tour-id="course-activate-student-modal"
          bg={useColorModeValue("white", "gray.800")}
          borderRadius="2xl"
          mx={4}
          my={4}
          maxH="85vh"
        >
          <ModalHeader borderBottomWidth="1px" borderColor="gray.100" py={3.5} px={4}>
            <HStack spacing={3}>
              <Center w={9} h={9} bg="blue.50" borderRadius="lg">
                <Icon as={FaUserPlus} color="blue.500" boxSize={4} />
              </Center>
              <Text fontWeight="bold" fontSize="md">تفعيل طالب للكورس</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton left={4} right="auto" />
          <ModalBody py={5} px={4}>
            <VStack spacing={4}>
              <Text fontSize="sm" color={mutedTextColor} textAlign="center">
                أدخل رقم الطالب (ID) لتفعيله في هذا الكورس.
              </Text>
              <FormControl isRequired>
                <FormLabel fontWeight="bold" fontSize="sm">رقم الطالب</FormLabel>
                <Input
                  type="number"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="مثال: 12345"
                  borderRadius="lg"
                  size="md"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2} px={4} pb={4}>
            <Button variant="ghost" onClick={onClose} isDisabled={isLoading} borderRadius="lg" size="sm">
              إلغاء
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleActivateStudent}
              isLoading={isLoading}
              loadingText="جاري التفعيل..."
              leftIcon={<Icon as={FaUserPlus} />}
              borderRadius="lg"
              size="sm"
            >
              تفعيل
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isEnrollmentsOpen}
        onClose={onEnrollmentsClose}
        isCentered
        size={{ base: "md", md: "4xl" }}
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
        <ModalContent
          data-tour-id="course-enrollments-modal"
          bg={modalBg}
          borderRadius="2xl"
          maxH="85vh"
          mx={4}
          my={4}
        >
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
}
