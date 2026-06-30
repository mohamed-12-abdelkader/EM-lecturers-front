import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Spinner,
  Center,
  useToast,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
  Avatar,
  Button,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Select,
  FormControl,
  FormLabel,
  Container,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Icon,
  SimpleGrid,
  useDisclosure,
} from "@chakra-ui/react";
import { MdEmail, MdPhone, MdSchool } from "react-icons/md";
import { BiSearch } from "react-icons/bi";
import { FiCheckCircle, FiBook } from "react-icons/fi";
import { FaUserGraduate, FaUsers, FaSync } from "react-icons/fa";
import baseUrl from "../../api/baseUrl";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import { useNavigate } from "react-router-dom";
import UserType from "../../Hooks/auth/userType";

function KpiCard({ label, value, sub, icon, accent = "blue" }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const accentMap = {
    blue: { bg: "blue.50", color: "blue.500" },
    green: { bg: "green.50", color: "green.500" },
    orange: { bg: "orange.50", color: "orange.500" },
  };
  const a = accentMap[accent] || accentMap.blue;

  return (
    <Box p={4} bg={bg} borderRadius="xl" borderWidth="1px" borderColor={border}>
      <Flex justify="space-between" align="center" gap={3}>
        <Box minW={0}>
          <Text fontSize="xs" color="gray.500" mb={1}>
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color={useColorModeValue("gray.800", "white")} lineHeight="1">
            {value}
          </Text>
          {sub && (
            <Text fontSize="xs" color="gray.400" mt={1} noOfLines={1}>
              {sub}
            </Text>
          )}
        </Box>
        <Flex w={10} h={10} borderRadius="lg" bg={a.bg} align="center" justify="center" flexShrink={0}>
          <Icon as={icon} color={a.color} boxSize={4} />
        </Flex>
      </Flex>
    </Box>
  );
}

const TeacherStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [activating, setActivating] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();
  const [, , isTeacher] = UserType();

  const pageBg = useColorModeValue("gray.100", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const subTextColor = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const tableHeadBg = useColorModeValue("gray.50", "gray.700");
  const rowHoverBg = useColorModeValue("gray.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.800");
  const chipBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const heroBg = useColorModeValue(
    "linear(to-l, blue.600, blue.500)",
    "linear(to-l, blue.700, blue.600)",
  );

  useEffect(() => {
    if (isTeacher) {
      fetchStudents();
    }
  }, [isTeacher]);

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const token = localStorage.getItem("token");
      const response = await baseUrl.get("api/course/my-courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(response.data.courses || []);
    } catch (err) {
      console.error("Error fetching courses:", err);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل الكورسات",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleOpenActivateModal = async (student) => {
    setSelectedStudent(student);
    setSelectedCourseId("");
    await fetchCourses();
    onOpen();
  };

  const handleActivateCourse = async () => {
    if (!selectedCourseId) {
      toast({
        title: "حقل مطلوب",
        description: "يرجى اختيار كورس",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setActivating(true);
      const token = localStorage.getItem("token");
      const response = await baseUrl.post(
        "/api/course/activate-student",
        {
          student_id: selectedStudent.id,
          course_id: parseInt(selectedCourseId, 10),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      toast({
        title: "تم بنجاح",
        description: response.data?.message || "تم تفعيل الكورس للطالب بنجاح",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      await fetchStudents();
      onClose();
      setSelectedStudent(null);
      setSelectedCourseId("");
    } catch (err) {
      console.error("Error activating course:", err);
      toast({
        title: "خطأ",
        description: err.response?.data?.message || "حدث خطأ في تفعيل الكورس",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActivating(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const response = await baseUrl.get("/api/course/teacher/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(response.data.students || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "حدث خطأ في تحميل قائمة الطلاب";
      setError(errorMessage);
      toast({
        title: "خطأ",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const term = searchTerm.toLowerCase();
    return (
      student.name?.toLowerCase().includes(term) ||
      student.email?.toLowerCase().includes(term) ||
      student.phone?.includes(term)
    );
  });

  const totalCourses = students.reduce((sum, s) => sum + (s.courses_count || 0), 0);

  if (loading) {
    return <BrandLoadingScreen />;
  }

  if (error) {
    return (
      <Box minH="100vh" bg={pageBg} pt={{ base: "72px", md: "88px" }} pb={10}>
        <Container maxW="container.xl">
          <Center minH="50vh">
            <VStack spacing={4}>
              <Text color="red.500" fontWeight="semibold">
                {error}
              </Text>
              <Button colorScheme="blue" variant="outline" onClick={fetchStudents}>
                إعادة المحاولة
              </Button>
            </VStack>
          </Center>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={pageBg} pt={{ base: "72px", md: "88px" }} pb={10} dir="rtl">
      <Container maxW="container.xl">
        <VStack spacing={5} align="stretch">
          <Box borderRadius="2xl" overflow="hidden" bgGradient={heroBg} color="white" boxShadow="lg">
            <Flex
              p={{ base: 5, md: 6 }}
              align={{ base: "start", md: "center" }}
              justify="space-between"
              gap={4}
              flexWrap="wrap"
            >
              <HStack spacing={4} align="start" flex={1} minW={0}>
                <Flex
                  boxSize={{ base: 11, md: 12 }}
                  borderRadius="xl"
                  bg="whiteAlpha.200"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Icon as={FaUserGraduate} boxSize={{ base: 5, md: 6 }} />
                </Flex>
                <Box minW={0}>
                  <Heading size={{ base: "md", md: "lg" }} fontWeight="bold" lineHeight="1.3">
                    طلابي
                  </Heading>
                  <Text color="whiteAlpha.900" fontSize="sm" mt={1} lineHeight="1.7">
                    إدارة طلابك، تفعيل الكورسات، ومتابعة التقارير.
                  </Text>
                </Box>
              </HStack>
              <Button
                leftIcon={<FaSync />}
                size="sm"
                bg="whiteAlpha.200"
                color="white"
                borderRadius="xl"
                _hover={{ bg: "whiteAlpha.300" }}
                onClick={fetchStudents}
              >
                تحديث
              </Button>
            </Flex>
          </Box>

          <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
            <KpiCard
              label="إجمالي الطلاب"
              value={students.length}
              sub="طالب مسجّل"
              icon={FaUsers}
              accent="blue"
            />
            <KpiCard
              label="اشتراكات الكورسات"
              value={totalCourses}
              sub="إجمالي عبر كل الطلاب"
              icon={FiBook}
              accent="orange"
            />
            {searchTerm ? (
              <KpiCard
                label="نتائج البحث"
                value={filteredStudents.length}
                sub={`من ${students.length} طالب`}
                icon={BiSearch}
                accent="green"
              />
            ) : (
              <KpiCard
                label="متوسط الكورسات"
                value={students.length ? (totalCourses / students.length).toFixed(1) : "0"}
                sub="لكل طالب"
                icon={FiBook}
                accent="green"
              />
            )}
          </SimpleGrid>

          <Box
            bg={cardBg}
            borderRadius="2xl"
            borderWidth="1px"
            borderColor={borderColor}
            p={{ base: 4, md: 5 }}
            boxShadow="sm"
          >
            <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={3}>
              البحث
            </Text>
            <InputGroup size="md">
              <InputLeftElement pointerEvents="none">
                <BiSearch color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="ابحث بالاسم، البريد، أو الهاتف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg={inputBg}
                borderColor={borderColor}
                borderRadius="xl"
                _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)" }}
              />
            </InputGroup>
          </Box>

          {filteredStudents.length === 0 ? (
            <Box
              bg={cardBg}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor={borderColor}
              py={14}
              boxShadow="sm"
            >
              <Center>
                <VStack spacing={3}>
                  <Flex w={16} h={16} borderRadius="xl" bg={chipBg} align="center" justify="center">
                    <Icon as={FaUserGraduate} boxSize={8} color="blue.400" />
                  </Flex>
                  <Text fontWeight="semibold" color={textColor}>
                    {searchTerm ? "لا توجد نتائج مطابقة" : "لا يوجد طلاب مسجّلون"}
                  </Text>
                  <Text fontSize="sm" color={subTextColor}>
                    {searchTerm ? "جرّب كلمات بحث مختلفة" : "سيظهر الطلاب هنا عند تسجيلهم"}
                  </Text>
                </VStack>
              </Center>
            </Box>
          ) : (
            <Box
              bg={cardBg}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor={borderColor}
              overflow="hidden"
              boxShadow="sm"
            >
              <Flex px={5} py={3} borderBottomWidth="1px" borderColor={borderColor} justify="space-between" align="center">
                <Text fontSize="sm" fontWeight="semibold" color={textColor}>
                  قائمة الطلاب
                </Text>
                <Text fontSize="xs" color={subTextColor}>
                  {filteredStudents.length} طالب
                </Text>
              </Flex>
              <TableContainer overflowX="auto">
                <Table size="sm">
                  <Thead bg={tableHeadBg}>
                    <Tr>
                      <Th color={subTextColor} fontWeight="semibold" fontSize="xs" py={3}>
                        الطالب
                      </Th>
                      <Th color={subTextColor} fontWeight="semibold" fontSize="xs" py={3} display={{ base: "none", md: "table-cell" }}>
                        البريد
                      </Th>
                      <Th color={subTextColor} fontWeight="semibold" fontSize="xs" py={3} display={{ base: "none", lg: "table-cell" }}>
                        الهاتف
                      </Th>
                      <Th color={subTextColor} fontWeight="semibold" fontSize="xs" py={3} textAlign="center">
                        الكورسات
                      </Th>
                      <Th color={subTextColor} fontWeight="semibold" fontSize="xs" py={3} textAlign="center">
                        إجراءات
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredStudents.map((student) => (
                      <Tr key={student.id} _hover={{ bg: rowHoverBg }}>
                        <Td py={3}>
                          <HStack spacing={3}>
                            <Avatar size="sm" name={student.name} bg="blue.500" color="white" />
                            <Box minW={0}>
                              <Text fontWeight="semibold" fontSize="sm" color={textColor} noOfLines={1}>
                                {student.name}
                              </Text>
                              <Text fontSize="xs" color={subTextColor} display={{ base: "block", md: "none" }} noOfLines={1}>
                                {student.email || student.phone || "—"}
                              </Text>
                            </Box>
                          </HStack>
                        </Td>
                        <Td py={3} display={{ base: "none", md: "table-cell" }}>
                          {student.email ? (
                            <HStack spacing={2} minW={0}>
                              <Icon as={MdEmail} boxSize={4} color="gray.400" flexShrink={0} />
                              <Text fontSize="sm" color={textColor} noOfLines={1}>
                                {student.email}
                              </Text>
                            </HStack>
                          ) : (
                            <Text fontSize="sm" color={subTextColor}>
                              —
                            </Text>
                          )}
                        </Td>
                        <Td py={3} display={{ base: "none", lg: "table-cell" }}>
                          {student.phone ? (
                            <HStack spacing={2}>
                              <Icon as={MdPhone} boxSize={4} color="gray.400" />
                              <Text fontSize="sm" color={textColor}>
                                {student.phone}
                              </Text>
                            </HStack>
                          ) : (
                            <Text fontSize="sm" color={subTextColor}>
                              —
                            </Text>
                          )}
                        </Td>
                        <Td py={3} textAlign="center">
                          <Badge colorScheme="blue" variant="subtle" borderRadius="md" fontSize="xs">
                            {student.courses_count || 0}
                          </Badge>
                        </Td>
                        <Td py={3}>
                          <HStack spacing={2} justify="center" flexWrap="wrap">
                            <Button
                              size="xs"
                              variant="outline"
                              colorScheme="blue"
                              borderRadius="lg"
                              leftIcon={<FiCheckCircle />}
                              onClick={() => handleOpenActivateModal(student)}
                            >
                              تفعيل
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              borderRadius="lg"
                              onClick={() => navigate(`/teacher-students/${student.id}`)}
                            >
                              التقرير
                            </Button>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </VStack>

        <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", sm: "md" }} isCentered>
          <ModalOverlay />
          <ModalContent borderRadius={{ base: "none", sm: "xl" }} m={{ base: 0, sm: 4 }}>
            <ModalHeader borderBottomWidth="1px" borderColor={borderColor} py={4}>
              <HStack spacing={2}>
                <Icon as={FiCheckCircle} color="blue.500" />
                <Text fontSize="md" fontWeight="semibold">
                  تفعيل كورس للطالب
                </Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />

            <ModalBody py={5}>
              <VStack spacing={5} align="stretch">
                {selectedStudent && (
                  <HStack
                    spacing={3}
                    p={3}
                    bg={chipBg}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <Avatar size="sm" name={selectedStudent.name} bg="blue.500" />
                    <Box minW={0}>
                      <Text fontWeight="semibold" fontSize="sm" color={textColor} noOfLines={1}>
                        {selectedStudent.name}
                      </Text>
                      <Text fontSize="xs" color={subTextColor} noOfLines={1}>
                        {selectedStudent.email || "—"}
                      </Text>
                    </Box>
                  </HStack>
                )}

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="medium" color={textColor}>
                    الكورس
                  </FormLabel>
                  {coursesLoading ? (
                    <Center py={6}>
                      <VStack spacing={2}>
                        <Spinner size="sm" color="blue.500" />
                        <Text fontSize="sm" color={subTextColor}>
                          جاري تحميل الكورسات...
                        </Text>
                      </VStack>
                    </Center>
                  ) : courses.length > 0 ? (
                    <Select
                      placeholder="اختر كورساً"
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      borderRadius="lg"
                      borderColor={borderColor}
                      bg={inputBg}
                      _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)" }}
                    >
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Center py={8} borderWidth="1px" borderColor={borderColor} borderRadius="lg" bg={tableHeadBg}>
                      <VStack spacing={2}>
                        <Icon as={MdSchool} boxSize={8} color="gray.400" />
                        <Text fontSize="sm" color={subTextColor}>
                          لا توجد كورسات متاحة
                        </Text>
                      </VStack>
                    </Center>
                  )}
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
              <HStack spacing={2}>
                <Button variant="ghost" onClick={onClose}>
                  إلغاء
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleActivateCourse}
                  isLoading={activating}
                  loadingText="جاري التفعيل..."
                  isDisabled={!selectedCourseId || courses.length === 0}
                >
                  تفعيل الكورس
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
};

export default TeacherStudents;
