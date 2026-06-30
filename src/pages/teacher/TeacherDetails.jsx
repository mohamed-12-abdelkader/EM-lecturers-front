import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  useColorModeValue,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Flex,
  Image,
  Badge,
  Spinner,
  Button,
  useToast,
  VStack,
  HStack,
  Container,
  Card,
  SimpleGrid,
} from "@chakra-ui/react";
import { MdCancelPresentation } from "react-icons/md";
import {
  FaBookOpen,
  FaBrain,
  FaChartLine,
  FaFileVideo,
  FaHeadset,
  FaSearch,
} from "react-icons/fa";
import baseUrl from "../../api/baseUrl";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import BrandLoadingScreen from "../../components/loading/BrandLoadingScreen";
import TeacherInfo from "../../components/teacher/TeacherInfo";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Input as ChakraInput } from "@chakra-ui/react";

const TeacherDetails = () => {
  const token = localStorage.getItem("token");
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activateModal, setActivateModal] = useState({ isOpen: false, courseId: null });
  const [activationCode, setActivationCode] = useState("");
  const [activateLoading, setActivateLoading] = useState(false);
  const [activatingCourseId, setActivatingCourseId] = useState(null);
  const toast = useToast();

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const headingColor = useColorModeValue("gray.800", "white");
  const subtextColor = useColorModeValue("gray.600", "gray.400");
  const sectionBg = useColorModeValue("white", "gray.800");
  const sectionBorder = useColorModeValue("gray.200", "gray.700");
  const modalBg = useColorModeValue("white", "gray.800");
  const modalBorder = useColorModeValue("gray.200", "gray.700");
  const cardHoverShadow = useColorModeValue("0 16px 40px rgba(66, 153, 225, 0.15)", "0 16px 40px rgba(0,0,0,0.35)");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await baseUrl.get(`/api/student/teacher/${id}/details`, {
          headers: { Authorization: `bearer ${token} ` },
        });
        setData(res.data);
      } catch (err) {
        setError("حدث خطأ في تحميل بيانات المحاضر");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, token]);

  if (loading) {
    return <BrandLoadingScreen />;
  }

  if (error || !data || !data.teacher) {
    return (
      <Box minH="60vh" bg={bgColor} dir="rtl" display="flex" alignItems="center" justifyContent="center" p={6}>
        <Box maxW="md" w="full" p={8} borderRadius="2xl" bg={cardBg} borderWidth="1px" borderColor={cardBorder} boxShadow="lg" textAlign="center">
          <Icon as={MdCancelPresentation} boxSize="16" color="red.500" mx="auto" mb={4} />
          <Text fontSize="xl" fontWeight="bold" color={headingColor}>
            {error || "هذا المحاضر غير موجود على الموقع"}
          </Text>
        </Box>
      </Box>
    );
  }

  const { teacher, common_grades, courses } = data;

  // فلترة الكورسات حسب البحث
  const filteredCourses = searchTerm
    ? courses?.filter((course) =>
        (course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         course.title?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : courses;
  const markCourseEnrolled = (courseId) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        courses: prev.courses.map((c) =>
          c.id === courseId ? { ...c, is_enrolled: true } : c
        ),
      };
    });
  };

  // تفعيل الكورس المجاني — نفس الطريقة في التطبيق المرجعي
  const handleActivateFreeCourse = async (courseId) => {
    try {
      setActivatingCourseId(courseId);
      await baseUrl.post(
        "/api/course/activate-free",
        { course_id: courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      markCourseEnrolled(courseId);
      toast({ title: "تم تفعيل الكورس المجاني بنجاح!", status: "success", duration: 3000, isClosable: true });
    } catch (err) {
      toast({
        title: "فشل تفعيل الكورس المجاني",
        description: err.response?.data?.message || "حاول مجدداً.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActivatingCourseId(null);
    }
  };

  // تفعيل الكورس بكود (مدفوع)
  const handleActivateCourse = async () => {
    setActivateLoading(true);
    try {
      await baseUrl.post(
        "/api/course/activate",
        { code: activationCode.trim(), course_id: activateModal.courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      markCourseEnrolled(activateModal.courseId);
      toast({ title: "تم تفعيل الكورس بنجاح!", status: "success", duration: 3000, isClosable: true });
      setActivateModal({ isOpen: false, courseId: null });
      setActivationCode("");
    } catch (err) {
      toast({
        title: "خطأ في تفعيل الكورس",
        description: err.response?.data?.message || "حدث خطأ غير متوقع",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActivateLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg={bgColor} dir="rtl" className="mb-[100px]" style={{ fontFamily: "'Changa', sans-serif" }}>
      <Box
        as="nav"
        bg={cardBg}
        borderBottom="1px solid"
        borderColor={cardBorder}
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Container maxW="6xl" px={{ base: 4, md: 6 }} py={3}>
          <Flex align="center" justify="space-between">
            <Text fontWeight="black" color="blue.500" fontSize="lg">
              {teacher.name}
            </Text>
            <HStack spacing={{ base: 3, md: 6 }} fontSize="sm" color={textColor}>
              <Text as="a" href="#home" cursor="pointer">الرئيسية</Text>
              <Text as="a" href="#services" cursor="pointer">خدماتي</Text>
              <Text as="a" href="#courses" cursor="pointer">الكورسات</Text>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <TeacherInfo teacher={teacher} number={courses.length} />

      <Box id="services" py={{ base: 8, md: 12 }} bg={sectionBg}>
        <Container maxW="6xl" px={{ base: 4, md: 6 }}>
          <VStack spacing={2} mb={8}>
            <Text color="blue.500" fontWeight="bold">لماذا أتعلم هنا؟</Text>
            <Heading size={{ base: "md", md: "lg" }} color={headingColor} textAlign="center">
              تجربة تعليمية واضحة ومريحة
            </Heading>
          </VStack>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
            <FeatureCard
              icon={FaBookOpen}
              title="شرح منظم"
              text="محاضرات مرتبة ومسار تعلم واضح يساعدك تذاكر بدون تشتت."
            />
            <FeatureCard
              icon={FaBrain}
              title="تدريب ذكي"
              text="اختبارات وتطبيقات تساعدك تعرف نقاط قوتك وضعفك باستمرار."
            />
            <FeatureCard
              icon={FaChartLine}
              title="متابعة تقدمك"
              text="تابع مستواك خطوة بخطوة وادخل الكورس المناسب لك بسهولة."
            />
          </SimpleGrid>
        </Container>
      </Box>

      <Container id="courses" maxW="6xl" px={{ base: 4, md: 6 }} py={{ base: 8, md: 12 }}>
        {/* قسم الكورسات */}
        <Flex
          direction={{ base: "column", sm: "row" }}
          justify="space-between"
          align={{ base: "center", sm: "center" }}
          gap={4}
          mb={6}
          p={0}
        >
          <HStack spacing={4} flexWrap="wrap" justify={{ base: "center", sm: "flex-start" }}>
            <VStack align={{ base: "center", sm: "flex-start" }} spacing={0}>
              <Heading size="lg" color={headingColor} fontWeight="black">
                الكورسات التعليمية
              </Heading>
              <Text fontSize="sm" color={subtextColor}>
                اختر الكورس المناسب وابدأ رحلتك الآن
              </Text>
            </VStack>
          </HStack>
          <InputGroup maxW={{ base: "100%", sm: "320px" }} size="md" w={{ base: "full", sm: "auto" }}>
            <InputLeftElement pointerEvents="none" height="100%">
              <Icon as={FaSearch} color="gray.400" boxSize={4} />
            </InputLeftElement>
            <Input
              placeholder="ابحث عن كورس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              borderRadius="full"
              pl={10}
              bg={sectionBg}
              borderColor={cardBorder}
              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
            />
          </InputGroup>
        </Flex>

        {filteredCourses && filteredCourses.length > 0 ? (
          <Flex justify={{ base: "center", md: "flex-start" }} w="full">
            <SimpleGrid
              columns={{ base: 1, md: 2, lg: 3 }}
              spacing={6}
              w="full"
              maxW={{ base: "400px", sm: "440px", md: "none" }}
              mx={{ base: "auto", md: 0 }}
              justifyItems={{ base: "center", md: "stretch" }}
            >
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                bg={cardBg}
                borderRadius="xl"
                overflow="hidden"
                borderWidth="1px"
                borderColor={cardBorder}
                boxShadow="sm"
                transition="all 0.3s"
                _hover={{
                  transform: "translateY(-6px)",
                  boxShadow: cardHoverShadow,
                  borderColor: "blue.300",
                }}
              >
                <Box position="relative" h="155px" overflow="hidden">
                  <Image
                    src={course.avatar || "https://via.placeholder.com/400x200/3182CE/ffffff?text=كورس"}
                    alt={course.title}
                    w="full"
                    h="full"
                    objectFit="cover"
                    transition="transform 0.3s"
                    _hover={{ transform: "scale(1.05)" }}
                  />
                  <Box position="absolute" inset="0" bgGradient="linear(to-t, blackAlpha.600, transparent)" />
                  <Badge
                    position="absolute"
                    top={3}
                    right={3}
                    bg="blue.500"
                    color="white"
                    borderRadius="full"
                    px={3}
                    py={1}
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    {common_grades?.[0]?.name || "مرحلة دراسية"}
                  </Badge>
                  <Badge
                    position="absolute"
                    top={3}
                    left={3}
                    bg={course.is_enrolled ? "green.500" : "orange.500"}
                    color="white"
                    borderRadius="full"
                    px={3}
                    py={1}
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    {course.is_enrolled ? "مشترك" : "غير مشترك"}
                  </Badge>
                </Box>

                <VStack p={4} align="stretch" spacing={2}>
                  <Text fontWeight="bold" fontSize="md" color={headingColor} noOfLines={2} textAlign="right">
                    {course.title}
                  </Text>
                  {course.description && (
                    <Text fontSize="xs" color={subtextColor} noOfLines={2} textAlign="right" lineHeight="tall">
                      {course.description}
                    </Text>
                  )}
                  <Flex justify="space-between" align="center" w="full" pt={1}>
                    <HStack spacing={2}>
                      <Icon as={FaFileVideo} color="blue.500" boxSize={4} />
                      <Text fontSize="xs" color={subtextColor}>كورس أونلاين</Text>
                    </HStack>
                    {course.price != null && Number(course.price) !== 0 ? (
                      <Text fontSize="lg" color="orange.500" fontWeight="bold">
                        {course.price} ج.م
                      </Text>
                    ) : (
                      <Badge colorScheme="green" borderRadius="md" px={2} py={1}>مجاني</Badge>
                    )}
                  </Flex>
                </VStack>

                <Box p={4} pt={0}>
                  {course.is_enrolled ? (
                    <Link to={`/CourseDetailsPage/${course.id}`} style={{ display: "block" }}>
                      <Button
                        w="full"
                        bg="blue.500"
                        color="white"
                        borderRadius="lg"
                        fontWeight="bold"
                        h="42px"
                        _hover={{ bg: "blue.400", transform: "translateY(-2px)", boxShadow: "md" }}
                        transition="all 0.2s"
                      >
                        دخول الكورس
                      </Button>
                    </Link>
                  ) : course.price == null || Number(course.price) === 0 ? (
                    <Button
                      w="full"
                      bg="green.500"
                      color="white"
                      borderRadius="lg"
                      fontWeight="bold"
                      h="42px"
                      isLoading={activateLoading && activatingCourseId === course.id}
                      loadingText="جاري التفعيل..."
                      onClick={() => handleActivateFreeCourse(course.id)}
                      _hover={{ bg: "green.400", transform: "translateY(-2px)", boxShadow: "md" }}
                      transition="all 0.2s"
                    >
                      تفعيل مجاني
                    </Button>
                  ) : (
                    <Button
                      w="full"
                      bg="orange.500"
                      color="white"
                      borderRadius="lg"
                      fontWeight="bold"
                      h="42px"
                      onClick={() => setActivateModal({ isOpen: true, courseId: course.id })}
                      _hover={{ bg: "orange.400", transform: "translateY(-2px)", boxShadow: "md" }}
                      transition="all 0.2s"
                    >
                      شراء الكورس
                    </Button>
                  )}
                </Box>
              </Card>
            ))}
            </SimpleGrid>
          </Flex>
        ) : (
          <Box
            p={10}
            bg={cardBg}
            borderRadius="2xl"
            borderWidth="1px"
            borderColor={cardBorder}
            textAlign="center"
          >
            <Icon as={MdCancelPresentation} boxSize="12" color="red.500" mb={4} />
            <Text fontSize="lg" fontWeight="medium" color={textColor}>
              لا يوجد كورسات الآن، سوف يتم إضافتها في أقرب وقت ممكن
            </Text>
          </Box>
        )}
      </Container>

      <Container maxW="4xl" px={{ base: 4, md: 6 }} pb={{ base: 10, md: 14 }}>
        <Box
          bg="blue.500"
          color="white"
          borderRadius="2xl"
          p={{ base: 6, md: 10 }}
          textAlign="center"
          boxShadow="0 18px 35px rgba(49,130,206,0.28)"
          position="relative"
          overflow="hidden"
        >
          <Box position="absolute" w="120px" h="120px" borderRadius="full" bg="whiteAlpha.200" bottom="-45px" right="-35px" />
          <Box position="absolute" w="90px" h="90px" borderRadius="full" bg="whiteAlpha.200" top="-35px" left="-25px" />
          <VStack spacing={4} position="relative">
            <Heading size={{ base: "md", md: "lg" }}>هل أنت مستعد لرحلة التعلم؟</Heading>
            <Text color="whiteAlpha.900" maxW="560px">
              اختر كورسك الآن وابدأ التعلم بطريقة منظمة مع متابعة مستمرة.
            </Text>
            <Button
              bg="white"
              color="blue.500"
              borderRadius="full"
              px={8}
              _hover={{ bg: "blue.50" }}
              onClick={() => document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" })}
            >
              تصفح الكورسات
            </Button>
          </VStack>
        </Box>
      </Container>

      <Box as="footer" bg={sectionBg} borderTop="1px solid" borderColor={sectionBorder} py={8}>
        <Container maxW="6xl" px={{ base: 4, md: 6 }}>
          <Flex justify="space-between" align="center" direction={{ base: "column", md: "row" }} gap={4}>
            <VStack align={{ base: "center", md: "start" }} spacing={1}>
              <Text fontWeight="black" color="blue.500">{teacher.name}</Text>
              <Text fontSize="sm" color={subtextColor}>تعلم بشكل أبسط، أسرع، وأكثر تنظيمًا.</Text>
            </VStack>
            <HStack color={subtextColor} fontSize="sm">
              <Icon as={FaHeadset} color="blue.500" />
              <Text>دعم ومتابعة طوال فترة التعلم</Text>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Modal isOpen={activateModal.isOpen} onClose={() => setActivateModal({ isOpen: false, courseId: null })} isCentered size="md">
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.500" />
        <ModalContent borderRadius="2xl" bg={modalBg} borderWidth="1px" borderColor={modalBorder}>
          <ModalHeader bg="blue.500" color="white" borderTopRadius="2xl">تفعيل الكورس</ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: "whiteAlpha.200" }} />
          <ModalBody py={6}>
            <Text mb={4} color={headingColor}>أدخل كود التفعيل الذي حصلت عليه من المدرس:</Text>
            <ChakraInput
              placeholder="كود التفعيل"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value)}
              size="lg"
              borderRadius="xl"
              borderColor={cardBorder}
              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 2px rgba(66, 153, 225, 0.3)" }}
            />
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor={modalBorder}>
            <Button variant="outline" onClick={() => setActivateModal({ isOpen: false, courseId: null })} mr={3}>إلغاء</Button>
            <Button bg="orange.500" color="white" _hover={{ bg: "orange.400" }} onClick={handleActivateCourse} isLoading={activateLoading} disabled={!activationCode} borderRadius="xl">
              تأكيد التفعيل
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <ScrollToTop />
    </Box>
  );
};

export default TeacherDetails;