import React, { useMemo, useState } from "react";
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
  Heading,
  Flex,
  Badge,
  AspectRatio,
  Center,
  Image,
  SimpleGrid,
  Container,
  Spinner,
  Avatar,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
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
} from "react-icons/fa";
import { Link } from "react-router-dom";
import baseUrl from "../../../api/baseUrl";
import { motion } from "framer-motion";
import dayjs from "dayjs";

const MotionBox = motion(Box);

const CourseHeroSection = ({
  course,
  isTeacher,
  isAdmin,
}) => {
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
  const mutedText = useColorModeValue("gray.600", "gray.300");
  const shellBg = useColorModeValue(
    "linear-gradient(180deg, #eff6ff 0%, #f8fafc 50%, #ffffff 100%)",
    "linear-gradient(180deg, #0f172a 0%, #0b1220 50%, #090f1a 100%)",
  );

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

  // =========================
  // HERO DATA (من API مع fallback)
  // =========================
  const ratingRaw =
    course?.rating ??
    course?.average_rating ??
    course?.avg_rating ??
    course?.course_rating ??
    course?.rate;

  const ratingNum = ratingRaw != null ? Number(ratingRaw) : null;
  const ratingDisplay = Number.isFinite(ratingNum)
    ? ratingNum.toFixed(1)
    : "4.8";

  const durationText =
    course?.duration_text ??
    (course?.duration_hours != null
      ? `${course.duration_hours} ساعة`
      : course?.duration_minutes != null
        ? `${course.duration_minutes} دقيقة`
        : "12 ساعة");

  const studentsCountRaw =
    course?.students_count ??
    course?.enrolled_students ??
    course?.total_students ??
    course?.participants;

  const studentsCountNum =
    studentsCountRaw != null ? Number(studentsCountRaw) : null;

  const studentsDisplay = (() => {
    if (!Number.isFinite(studentsCountNum)) return "500+";
    if (studentsCountNum >= 1000)
      return `${Math.floor(studentsCountNum / 100) / 10}k+`;
    return `${studentsCountNum}+`;
  })();

  const heroSubtitle =
    course?.subtitle ??
    course?.headline ??
    course?.category_name ??
    course?.grade_name ??
    "كورس تعليمي احترافي";

  const heroTitleRaw = course?.title_en ?? course?.title ?? "Course";

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
      <Box dir="rtl" position="relative" bg={shellBg}>
        <Container maxW="8xl" px={{ base: 0, md: 6 }}>
          <MotionBox
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            position="relative"
            borderRadius={{ base: 0, md: "2xl" }}
            overflow="hidden"
            boxShadow={useColorModeValue("0 20px 45px rgba(37,99,235,0.14)", "0 20px 45px rgba(0,0,0,0.35)")}
          >
            <Box
              minH={{ base: "230px", md: "300px" }}
              bg="blue.500"
              color="white"
              px={{ base: 4, md: 8 }}
              py={{ base: 5, md: 8 }}
            >
              <Flex justify="flex-end" align="start" direction="row" gap={4}>
                <VStack align="end" spacing={2} w={{ base: "100%", md: "70%" }} mr={0} ml="auto">
                  <Text fontSize="sm" color="whiteAlpha.800">
                    العودة
                  </Text>
                  <Heading w="full" fontSize={{ base: "xl", md: "3xl" }} textAlign="right">
                    {course?.title || heroTitleRaw}
                  </Heading>
                  <Text w="full" textAlign="right" color="whiteAlpha.900" fontSize={{ base: "sm", md: "md" }}>
                    {heroSubtitle}
                  </Text>
                </VStack>
              </Flex>
            </Box>

            <Box bg={useColorModeValue("gray.50", "gray.800")} pt={{ base: 4, md: 6 }} pb={{ base: 5, md: 6 }} px={{ base: 4, md: 8 }}>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                <Badge bg="blue.50" color="blue.700" borderRadius="md" px={3} py={2} fontSize="sm">
                  <HStack><Icon as={FaClock} /><Text>{durationText}</Text></HStack>
                </Badge>
                <Badge bg="blue.50" color="blue.700" borderRadius="md" px={3} py={2} fontSize="sm">
                  <HStack><Icon as={FaUsers} /><Text>{studentsDisplay} طالب</Text></HStack>
                </Badge>
                <Badge bg="blue.50" color="blue.700" borderRadius="md" px={3} py={2} fontSize="sm">
                  <HStack><Icon as={FaStar} /><Text>{ratingDisplay} / 5</Text></HStack>
                </Badge>
              </SimpleGrid>

              <Text mt={4} color={mutedText} noOfLines={2}>
                {course.description || "محتوى احترافي منظم يساعدك على الفهم والتطبيق خطوة بخطوة."}
              </Text>

              <HStack spacing={3} flexWrap="wrap" mt={4}>
                {(isTeacher || isAdmin) && (
                  <Button colorScheme="blue" borderRadius="lg" leftIcon={<Icon as={FaUserPlus} />} onClick={onOpen}>
                    تفعيل طالب
                  </Button>
                )}
                {isTeacher && (
                  <Link to={`/CourseStatisticsPage/${course.id}`}>
                    <Button variant="outline" colorScheme="blue" borderRadius="lg" leftIcon={<Icon as={FaChartBar} />}>
                      الإحصائيات
                    </Button>
                  </Link>
                )}
                {canManageStudents && (
                  <Button
                    variant="outline"
                    colorScheme="blue"
                    borderRadius="lg"
                    leftIcon={<Icon as={FaUserGraduate} />}
                    onClick={handleOpenEnrollmentsModal}
                  >
                    المشتركين ({studentsCountNum ?? enrollments.length ?? 0})
                  </Button>
                )}
              </HStack>
            </Box>

            <Box
              position={{ base: "relative", md: "absolute" }}
              left={{ base: "auto", md: 6 }}
              bottom={{ base: "auto", md: 6 }}
              mt={{ base: -24, md: 0 }}
              mx={{ base: 4, md: 0 }}
              w={{ base: "calc(100% - 32px)", md: "420px" }}
              borderRadius="lg"
              overflow="hidden"
              border="6px solid"
              borderColor="white"
              boxShadow="2xl"
              zIndex={2}
            >
              <AspectRatio ratio={16 / 9}>
                <Image
                  src={course.avatar || "https://via.placeholder.com/1200x700/3b82f6/ffffff?text=Course"}
                  alt={course.title}
                  objectFit="cover"
                />
              </AspectRatio>
            </Box>
          </MotionBox>
        </Container>
      </Box>

      {/* Activate Student Modal - متجاوب */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isCentered
        size={{ base: "full", md: "md" }}
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
        <ModalContent
          bg={useColorModeValue("white", "gray.800")}
          borderRadius={{ base: "none", md: "2xl" }}
          boxShadow="2xl"
          mx={{ base: 0, md: 4 }}
          maxH={{ base: "100vh", md: "90vh" }}
        >
          <ModalHeader
            pt={{ base: 4, md: 6 }}
            pb={{ base: 3, md: 4 }}
            borderBottomWidth="1px"
            borderColor="gray.100"
          >
            <HStack spacing={3}>
              <Center w={10} h={10} bg="blue.100" borderRadius="full">
                <Icon as={FaUserPlus} color="blue.500" boxSize={5} />
              </Center>
              <Text
                fontWeight="bold"
                fontSize={{ base: "md", md: "xl" }}
                color={useColorModeValue("gray.800", "gray.100")}
              >
                تفعيل طالب للكورس
              </Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton left={4} right="auto" mt={2} />
          <ModalBody py={{ base: 4, md: 8 }}>
            <VStack spacing={{ base: 4, md: 6 }}>
              <Text
                fontSize={{ base: "sm", md: "md" }}
                color={useColorModeValue("gray.500", "gray.300")}
                textAlign="center"
              >
                قم بإدخال رقم الطالب (ID) لتفعيله في هذا الكورس مباشرة.
              </Text>
              <FormControl isRequired>
                <FormLabel
                  fontWeight="bold"
                  color={useColorModeValue("gray.700", "gray.200")}
                >
                  رقم الطالب
                </FormLabel>
                <Input
                  type="number"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="مثال: 12345"
                  size={{ base: "md", md: "lg" }}
                  borderRadius="xl"
                  bg={useColorModeValue("gray.50", "gray.700")}
                  border="2px solid"
                  borderColor={useColorModeValue("gray.200", "gray.600")}
                  _focus={{
                    borderColor: "blue.500",
                    bg: useColorModeValue("white", "gray.900"),
                    boxShadow: "0 0 0 1px #3182ce",
                  }}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter pb={{ base: 4, md: 6 }} flexWrap="wrap" gap={2}>
            <Button
              variant="ghost"
              mr={{ base: 0, md: 3 }}
              onClick={onClose}
              isDisabled={isLoading}
              borderRadius="xl"
              size={{ base: "md", md: "lg" }}
              color={useColorModeValue("gray.500", "gray.300")}
            >
              إلغاء
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleActivateStudent}
              isLoading={isLoading}
              loadingText="جاري التفعيل..."
              leftIcon={<Icon as={FaUserPlus} />}
              borderRadius="xl"
              size={{ base: "md", md: "lg" }}
              shadow="lg"
            >
              تفعيل الطالب
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
        <ModalContent
          bg={modalBg}
          borderRadius={{ base: "none", md: "2xl" }}
          maxH={{ base: "100vh", md: "90vh" }}
          mx={{ base: 0, md: 4 }}
        >
          <ModalHeader borderBottomWidth="1px" borderColor={borderColor} py={4}>
            <HStack spacing={3}>
              <Center w={10} h={10} bg="blue.100" borderRadius="full">
                <Icon as={FaUsers} color="blue.500" />
              </Center>
              <Box>
                <Text fontWeight="bold" fontSize={{ base: "md", md: "lg" }}>
                  الطلاب المسجلين في الكورس
                </Text>
                <Text fontSize="sm" color={mutedTextColor}>
                  {course?.title || "—"}
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
                borderRadius="xl"
              />
            </InputGroup>

            {loadingEnrollments ? (
              <Center py={12}>
                <VStack spacing={3}>
                  <Spinner size="lg" color="blue.500" />
                  <Text color={mutedTextColor}>جاري تحميل الطلاب...</Text>
                </VStack>
              </Center>
            ) : filteredEnrollments.length > 0 ? (
              <TableContainer borderWidth="1px" borderColor={borderColor} borderRadius="xl">
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
                            <Avatar size="sm" name={student.name} src={student.avatar} />
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
                          {student.enrolled_at
                            ? dayjs(student.enrolled_at).format("YYYY/MM/DD")
                            : "—"}
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={student.is_blocked_by_teacher ? "red" : "green"}
                            variant="subtle"
                            fontSize="xs"
                          >
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
                <VStack spacing={3}>
                  <Icon as={FaUsers} boxSize={10} color="gray.300" />
                  <Text color={mutedTextColor}>
                    {enrollmentSearch.trim()
                      ? "لا توجد نتائج مطابقة للبحث"
                      : "لا يوجد طلاب مسجلين في هذا الكورس بعد"}
                  </Text>
                </VStack>
              </Center>
            )}
          </ModalBody>

          <ModalFooter borderTopWidth="1px" borderColor={borderColor} gap={2} flexWrap="wrap">
            <Button variant="ghost" onClick={onEnrollmentsClose} borderRadius="xl">
              إغلاق
            </Button>
            <Link to={`/CourseStudentsPage/${course.id}`}>
              <Button
                as="span"
                colorScheme="blue"
                variant="outline"
                borderRadius="xl"
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
