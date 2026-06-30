import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardBody,
  Badge,
  Icon,
  Button,
  Spinner,
  Center,
  useColorModeValue,
  Image,
  AspectRatio,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Container,
  IconButton,
  Tooltip,
  Divider
} from '@chakra-ui/react';
import {
  FaBookOpen,
  FaCalendarAlt,
  FaQrcode,
  FaPlay,
  FaCheckCircle,
  FaCamera,
  FaGraduationCap,
  FaChevronDown,
  FaChevronUp,
  FaLayerGroup
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import baseUrl from '../../api/baseUrl';
import { motion, AnimatePresence } from 'framer-motion';

const MotionCard = motion(Card);
const MotionBox = motion(Box);

const MyCourses = ({ embedded = false, onLoadingChange }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof onLoadingChange === "function") onLoadingChange(loading);
  }, [loading, onLoadingChange]);

  // QR Scanner States
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [qrScanner, setQrScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [activationResult, setActivationResult] = useState(null);

  const [expandedCards, setExpandedCards] = useState({});
  const [stats, setStats] = useState({
    courses_count: 0,
    general_courses_count: 0,
    packages_count: 0,
    total: 0,
  });

  const authHeader = useMemo(() => ({
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  }), []);

  const toggleDescription = (courseId) => {
    setExpandedCards(prev => ({ ...prev, [courseId]: !prev[courseId] }));
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await baseUrl.get("/api/course/my-enrollments", {
        headers: authHeader,
      });

      const root = response.data?.data ?? response.data;
      const items = Array.isArray(root?.items) ? root.items : [];

      setCourses(items);
      setStats({
        courses_count: root?.courses_count ?? 0,
        general_courses_count: root?.general_courses_count ?? 0,
        packages_count: root?.packages_count ?? 0,
        total: root?.total ?? items.length,
      });
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('حدث خطأ في تحميل الكورسات والباقات');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, [authHeader]);

  // QR Logic Preserved
  const activateCourseWithQR = async (qrData) => {
    try {
      const response = await baseUrl.post('api/course/scan-qr-activate', { qr_data: qrData }, { headers: authHeader });
      if (response.data.success) {
        setActivationResult({
          success: true,
          message: response.data.message || 'تم تفعيل الكورس بنجاح!',
          courseName: response.data.course_name || 'الكورس الجديد'
        });
        setShowSuccessModal(true);
        setIsQrScannerOpen(false);
        setTimeout(() => fetchCourses(), 2000);
      }
    } catch (error) {
      let errorMessage = error.response?.data?.message || 'حدث خطأ في تفعيل الكورس';
      let errorReason = error.response?.data?.reason || 'يرجى المحاولة مرة أخرى';
      if (errorMessage.includes('Activation code has been fully used') || errorMessage.includes('fully used')) {
        errorMessage = 'هذا الكود مستخدم من قبل';
        errorReason = 'تم استخدام كود التفعيل هذا مسبقاً.';
      }
      setActivationResult({ success: false, message: errorMessage, reason: errorReason });
      setShowErrorModal(true);
      setIsQrScannerOpen(false);
    }
  };

  const startQrScanner = async () => {
    setIsScanning(true);
    try {
      const element = document.getElementById("qr-reader");
      if (!element) return setIsScanning(false);

      const html5Qrcode = new Html5Qrcode("qr-reader");
      try {
        await html5Qrcode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            setIsScanning(false);
            html5Qrcode.stop().then(() => {
              html5Qrcode.clear();
              setQrScanner(null);
              setIsQrScannerOpen(false);
              activateCourseWithQR(decodedText);
            }).catch(() => {
              html5Qrcode.clear();
              setQrScanner(null);
              setIsQrScannerOpen(false);
              activateCourseWithQR(decodedText);
            });
          }, () => { }
        );
        setQrScanner(html5Qrcode);
      } catch (err) { setIsScanning(false); }
    } catch (error) { setIsScanning(false); }
  };

  const closeQrScanner = async () => {
    setIsScanning(false);
    if (qrScanner) {
      try { if ((await qrScanner.getState()) === 2) await qrScanner.stop(); qrScanner.clear(); setQrScanner(null); } catch (e) { }
    }
    setIsQrScannerOpen(false);
  };

  useEffect(() => { if (isQrScannerOpen && !qrScanner) { const t = setTimeout(startQrScanner, 500); return () => clearTimeout(t); } }, [isQrScannerOpen]);
  useEffect(() => { if (!isQrScannerOpen && qrScanner) closeQrScanner(); }, [isQrScannerOpen]);


  // Colors & Theme (براند: blue.500 & orange.500)
  const mainBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const headingColor = useColorModeValue("gray.800", "white");
  const subtextColor = useColorModeValue("gray.600", "gray.400");
  const sectionBg = useColorModeValue("white", "gray.800");
  const sectionBorder = useColorModeValue("gray.200", "gray.700");
  const emptyBorder = useColorModeValue("gray.300", "gray.600");
  const modalBg = useColorModeValue("white", "gray.800");
  const modalBorder = useColorModeValue("gray.200", "gray.700");
  const modalText = useColorModeValue("gray.600", "gray.400");
  const cardHoverShadow = useColorModeValue("0 16px 40px rgba(66, 153, 225, 0.15)", "0 16px 40px rgba(0,0,0,0.35)");

  if (loading) {
    return (
      <Flex minH={embedded ? "200px" : "60vh"} align="center" justify="center" bg={embedded ? "transparent" : mainBg}>
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    );
  }

  return (
    <Box w="100%">
      {/* Section Header — موحّد مع البراند (مدمج أو كامل) */}
      <Flex
        direction={{ base: "column", sm: "row" }}
        justify="space-between"
        align={{ base: "stretch", sm: "center" }}
        gap={4}
        mb={6}
        p={5}
        borderRadius="2xl"
        bg={sectionBg}
        borderWidth="1px"
        borderColor={sectionBorder}
        boxShadow="sm"
      >
        <HStack spacing={4} flexWrap="wrap">
          <Flex
            w="12"
            h="12"
            borderRadius="xl"
            bg="blue.500"
            color="white"
            align="center"
            justify="center"
            boxShadow="md"
          >
            <Icon as={FaBookOpen} boxSize={6} />
          </Flex>
          <VStack align="flex-start" spacing={0}>
            <Heading size="md" color={headingColor} fontWeight="bold">
              كورساتي التعليمية
            </Heading>
            <Text fontSize="sm" color={subtextColor}>
              لديك {stats.total} عنصر — {stats.courses_count} كورس،{" "}
              {stats.general_courses_count} كورس عام، {stats.packages_count} باقة
            </Text>
          </VStack>
        </HStack>
        <Button
          leftIcon={<Icon as={FaQrcode} />}
          bg="orange.500"
          color="white"
          size="sm"
          borderRadius="xl"
          px={5}
          _hover={{ bg: "orange.400", transform: "translateY(-2px)", boxShadow: "md" }}
          transition="all 0.2s"
          onClick={() => setIsQrScannerOpen(true)}
          fontWeight="bold"
        >
          تفعيل كورس جديد
        </Button>
      </Flex>

      {/* Content Grid */}
      {error ? (
        <Center py={10} flexDirection="column" bg={cardBg} borderRadius="2xl" borderWidth="1px" borderStyle="dashed" borderColor="red.300">
          <Icon as={FaBookOpen} boxSize={10} color="red.400" mb={3} />
          <Text color="red.500" fontWeight="bold">{error}</Text>
          <Button mt={4} size="sm" onClick={fetchCourses} bg="blue.500" color="white" _hover={{ bg: "blue.600" }} borderRadius="xl">إعادة المحاولة</Button>
        </Center>
      ) : courses.length > 0 ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: "10px", md: "10px", lg: 6 }}>
          <AnimatePresence>
            {courses.map((item, index) => {
              const t = item.type || "course";
              const isPackage = t === "package";
              const isGeneral = t === "general_course";
              let linkTo = `/CourseDetailsPage/${item.id}`;
              if (isPackage) linkTo = `/package/${item.id}`;
              else if (isGeneral) linkTo = `/general-course/${item.id}`;

              const typeLabel =
                isPackage ? "باقة" : isGeneral ? "كورس عام" : "كورس";
              const badgeColor = isPackage
                ? "orange.500"
                : isGeneral
                  ? "purple.500"
                  : "blue.500";

              return (
                <MotionBox
                  key={`${t}-${item.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  h="100%"
                  w="100%"
                >
                  <Link to={linkTo} style={{ display: "block", height: "100%", width: "100%" }}>
                    <Box
                      as="article"

                      borderRadius="2xl"
                      overflow="hidden"
                      borderWidth="1px"

                      boxShadow="md"
                      h="100%"
                      display="flex"
                      flexDirection="column"
                      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      _hover={{
                        transform: "translateY(-8px) scale(1.02)",

                        borderColor: "blue.400",
                      }}
                    >
                      <Box position="relative" h="168px" overflow="hidden">
                        <Box w="100%" h="100%">
                          <Image
                            src={item.avatar || (isPackage ? 'https://via.placeholder.com/400x225/ED8936/FFFFFF?text=Package' : 'https://via.placeholder.com/400x225/3182CE/FFFFFF?text=Course')}
                            objectFit="cover"
                            w="100%"
                            h="100%"
                          />
                        </Box>
                        <Box
                          position="absolute" top={0} left={0} w="full" h="full"
                          bgGradient="linear(to-t, blackAlpha.800, transparent)"
                        />
                        <Badge
                          position="absolute" top={3} left={3}
                          bg={badgeColor}
                          color="white"
                          variant="solid"
                          borderRadius="md"
                          px={2}
                          py={1}
                          fontSize="xs"
                        >
                          {typeLabel}
                        </Badge>
                        <Box position="absolute" bottom={3} right={3} color="white" w="90%">
                          <Text fontSize="md" fontWeight="bold" noOfLines={1} textShadow="0 2px 4px rgba(0,0,0,0.5)">
                            {item.title}
                          </Text>
                        </Box>
                      </Box>

                      <Box p={4}>
                        <VStack align="stretch" spacing={3}>
                          {item.description && (
                            <Box>
                              <Text
                                fontSize="sm"
                                color={subtextColor}
                                noOfLines={expandedCards[item.id] ? undefined : 2}
                                lineHeight="tall"
                              >
                                {item.description}
                              </Text>
                              {item.description.length > 80 && (
                                <Button
                                  size="xs"
                                  variant="link"
                                  color="blue.500"
                                  mt={1}
                                  onClick={(e) => { e.preventDefault(); toggleDescription(item.id); }}
                                >
                                  {expandedCards[item.id] ? "عرض أقل" : "عرض المزيد"}
                                </Button>
                              )}
                            </Box>
                          )}

                          <Divider borderColor={cardBorder} />

                          <HStack justify="space-between" fontSize="xs" color={subtextColor}>
                            <HStack>
                              <Icon as={FaCalendarAlt} color="blue.400" />
                              <Text>
                                {new Date(
                                  item.enrolled_at || item.created_at
                                ).toLocaleDateString("ar-EG")}
                              </Text>
                            </HStack>
                            <Badge bg="green.100" color="green.700" _dark={{ bg: "green.800", color: "green.200" }} fontSize="xs">
                              {item.price != null ? `${item.price} ج.م` : "—"}
                            </Badge>
                          </HStack>

                          <Button
                            w="full"
                            bg={
                              isPackage
                                ? "orange.500"
                                : isGeneral
                                  ? "purple.500"
                                  : "blue.500"
                            }
                            color="white"
                            size="sm"
                            borderRadius="xl"
                            rightIcon={
                              <Icon
                                as={
                                  isPackage
                                    ? FaLayerGroup
                                    : isGeneral
                                      ? FaGraduationCap
                                      : FaPlay
                                }
                                size="sm"
                              />
                            }
                            _hover={{
                              bg: isPackage
                                ? "orange.400"
                                : isGeneral
                                  ? "purple.400"
                                  : "blue.400",
                              transform: "scale(1.02)",
                            }}
                            fontWeight="bold"
                          >
                            {isPackage
                              ? "تصفح الباقة"
                              : isGeneral
                                ? "دخول الكورس العام"
                                : "دخول الكورس"}
                          </Button>
                        </VStack>
                      </Box>
                    </Box>
                  </Link>
                </MotionBox>
              );
            })}
          </AnimatePresence>
        </SimpleGrid>
      ) : (
        <Flex direction="column" align="center" justify="center" minH="280px" bg={cardBg} borderRadius="2xl" borderWidth="2px" borderStyle="dashed" borderColor={emptyBorder} textAlign="center" p={8}>
          <Box w="16" h="16" borderRadius="2xl" bg="blue.100" _dark={{ bg: "blue.900" }} display="flex" alignItems="center" justifyContent="center" mb={4}>
            <Icon as={FaBookOpen} boxSize="8" color="blue.500" />
          </Box>
          <Heading size="md" color={headingColor} mb={2}>لا توجد كورسات مفعلة</Heading>
          <Text color={subtextColor} maxW="md" mb={6} fontSize="sm">
            لم تقم بالاشتراك في أي كورسات أو باقات تعليمية حتى الآن.
          </Text>
          <Button
            bg="orange.500"
            color="white"
            size="md"
            leftIcon={<Icon as={FaQrcode} />}
            borderRadius="xl"
            _hover={{ bg: "orange.400" }}
            onClick={() => setIsQrScannerOpen(true)}
            fontWeight="bold"
          >
            تفعيل كورس الآن
          </Button>
        </Flex>
      )
      }


      {/* --- Modals (براند) --- */}
      <Modal isOpen={isQrScannerOpen} onClose={closeQrScanner} isCentered size="xl" closeOnOverlayClick={false}>
        <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.600" />
        <ModalContent borderRadius="2xl" bg={modalBg} borderWidth="1px" borderColor={modalBorder}>
          <ModalHeader textAlign="center" bg="blue.500" color="white" borderTopRadius="2xl">تفعيل الكورس</ModalHeader>
          <ModalBody py={8}>
            <VStack spacing={5}>
              <Box w="100%" h="300px" bg="black" borderRadius="xl" overflow="hidden" position="relative">
                <div id="qr-reader" style={{ width: "100%", height: "100%" }}></div>
                {isScanning && <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" zIndex={10}><Spinner color="blue.400" size="xl" /></Box>}
              </Box>
              <Text textAlign="center" color={modalText}>وجه الكاميرا نحو كود الـ QR الخاص بالكورس</Text>
            </VStack>
          </ModalBody>
          <ModalFooter justify="center" borderTopWidth="1px" borderColor={modalBorder}>
            <Button variant="outline" colorScheme="red" onClick={closeQrScanner}>إلغاء</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} isCentered>
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.500" />
        <ModalContent textAlign="center" borderRadius="2xl" p={8} bg={modalBg} borderWidth="1px" borderColor={modalBorder}>
          <Icon as={FaBookOpen} color="green.500" boxSize={16} mx="auto" mb={4} />
          <Heading size="md" color="green.600" mb={2}>تم التفعيل بنجاح!</Heading>
          <Text color={modalText}>{activationResult?.courseName}</Text>
        </ModalContent>
      </Modal>

      <Modal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} isCentered>
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.500" />
        <ModalContent textAlign="center" borderRadius="2xl" p={8} bg={modalBg} borderWidth="1px" borderColor={modalBorder}>
          <Icon as={FaCamera} color="red.500" boxSize={16} mx="auto" mb={4} />
          <Heading size="md" color="red.600" mb={2}>خطأ في التفعيل</Heading>
          <Text color={modalText}>{activationResult?.message}</Text>
          <Text fontSize="sm" mt={2} color={modalText}>{activationResult?.reason}</Text>
        </ModalContent>
      </Modal>

    </Box >
  );
};

export default MyCourses;
