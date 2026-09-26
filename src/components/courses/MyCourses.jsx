import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Heading,
  Text,
  Flex,
  VStack,
  HStack,
  SimpleGrid,
  Badge,
  Icon,
  Button,
  Spinner,
  Center,
  useColorModeValue,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";
import {
  FaQrcode,
  FaCheckCircle,
  FaCamera,
  FaChevronLeft,
  FaPlay,
  FaLayerGroup,
  FaGraduationCap,
  FaBookOpen,
  FaCalendarAlt,
} from "react-icons/fa";
import {
  HiOutlineBookOpen,
  HiOutlineAcademicCap,
  HiOutlineRectangleStack,
} from "react-icons/hi2";
import { Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import baseUrl from "../../api/baseUrl";
import { readAuthToken } from "../../utils/authStorage";
import {
  extractCourseFromActivationError,
  getActivationSuccessCopy,
  resolveActivationErrorCopy,
} from "../../utils/courseActivationMessages";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = motion(Box);

const BLUE = "#3182CE";
const ORANGE = "#DD6B20";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80";

function resolveCover(url) {
  if (!url || typeof url !== "string") return DEFAULT_COVER;
  const trimmed = url.trim();
  return trimmed || DEFAULT_COVER;
}

function handleCoverError(event) {
  const img = event?.currentTarget;
  if (!img || img.dataset.fallbackApplied === "1") return;
  img.dataset.fallbackApplied = "1";
  img.src = DEFAULT_COVER;
}

function getItemMeta(item) {
  const t = item.type || "course";
  const isPackage = t === "package";
  const isGeneral = t === "general_course";

  let linkTo = `/CourseDetailsPage/${item.id}`;
  if (isPackage) linkTo = `/package/${item.id}`;
  else if (isGeneral) linkTo = `/general-course/${item.id}`;

  return {
    t,
    isPackage,
    isGeneral,
    linkTo,
    typeLabel: isPackage ? "باقة" : isGeneral ? "كورس عام" : "كورس",
    accent: isPackage ? ORANGE : BLUE,
    ctaLabel: isPackage ? "تصفح الباقة" : isGeneral ? "دخول الكورس العام" : "دخول الكورس",
    CtaIcon: isPackage ? FaLayerGroup : isGeneral ? FaGraduationCap : FaPlay,
    TypeIcon: isPackage ? HiOutlineRectangleStack : isGeneral ? HiOutlineAcademicCap : HiOutlineBookOpen,
  };
}

function EnrollmentCard({ item, index, cardBg, subtextColor, headingColor }) {
  const meta = getItemMeta(item);
  const cover = resolveCover(item.avatar);
  const enrolledDate = new Date(item.enrolled_at || item.created_at).toLocaleDateString("ar-EG");
  const priceLabel =
    item.price == null
      ? null
      : Number(item.price) <= 0
        ? "مجاني"
        : `${Number(item.price).toLocaleString("ar-EG")} ج.م`;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.24) }}
      h="100%"
      w="100%"
    >
      <Link to={meta.linkTo} style={{ display: "block", height: "100%", width: "100%" }}>
        <Box
          as="article"
          role="group"
          bg={cardBg}
          borderRadius="1.35rem"
          overflow="hidden"
          h="100%"
          display="flex"
          flexDirection="column"
          position="relative"
          borderWidth="1px"
          borderColor="blackAlpha.100"
          boxShadow="0 12px 40px -24px rgba(15,23,42,0.45)"
          transition="all 0.28s ease"
          _hover={{
            transform: "translateY(-6px)",
            boxShadow: `0 22px 50px -22px ${meta.accent}66`,
            borderColor: meta.accent,
          }}
          _dark={{ borderColor: "whiteAlpha.200" }}
        >
          <Box
            position="absolute"
            insetY={0}
            right={0}
            w="6px"
            bg={meta.accent}
            opacity={0.9}
            aria-hidden
          />

          <Box mx={3} mt={3} overflow="hidden" borderRadius="1.1rem">
            <Box position="relative" aspectRatio={16 / 10} overflow="hidden" bg="blue.50" _dark={{ bg: "blue.950" }}>
              <Image
                src={cover}
                alt={item.title || meta.typeLabel}
                objectFit="cover"
                w="100%"
                h="100%"
                transition="transform 0.5s ease"
                _groupHover={{ transform: "scale(1.08)" }}
                onError={handleCoverError}
                loading="lazy"
              />
              <Box
                position="absolute"
                inset={0}
                bgGradient="linear(to-t, blackAlpha.800 0%, blackAlpha.200 45%, transparent 70%)"
              />

              <HStack position="absolute" insetX={3} top={3} justify="space-between" spacing={2}>
                <Badge
                  display="inline-flex"
                  alignItems="center"
                  gap={1}
                  bg="whiteAlpha.95"
                  color="slate.700"
                  borderRadius="full"
                  px={2.5}
                  py={1}
                  fontSize="10px"
                  fontWeight="bold"
                  boxShadow="sm"
                  _dark={{ bg: "blackAlpha.700", color: "white" }}
                >
                  <Icon as={meta.TypeIcon} boxSize={3} />
                  {meta.typeLabel}
                </Badge>
                <Badge
                  display="inline-flex"
                  alignItems="center"
                  gap={1}
                  bg={meta.accent}
                  color="white"
                  borderRadius="full"
                  px={2.5}
                  py={1}
                  fontSize="10px"
                  fontWeight="bold"
                  boxShadow="md"
                >
                  <Icon as={FaCheckCircle} boxSize={2.5} />
                  مشترك
                </Badge>
              </HStack>

              {priceLabel ? (
                <Box
                  position="absolute"
                  bottom={3}
                  right={3}
                  bg="whiteAlpha.95"
                  color={meta.accent}
                  borderRadius="xl"
                  px={3}
                  py={1.5}
                  fontSize="sm"
                  fontWeight="extrabold"
                  boxShadow="sm"
                  backdropFilter="blur(8px)"
                  _dark={{ bg: "blackAlpha.700" }}
                >
                  {priceLabel}
                </Box>
              ) : null}
            </Box>
          </Box>

          <Flex direction="column" flex="1" px={4} pt={3.5} pb={4} gap={3}>
            <Heading
              as="h3"
              fontSize={{ base: "md", md: "1.05rem" }}
              fontWeight="extrabold"
              lineHeight="1.35"
              color={headingColor}
              noOfLines={2}
              minH="2.7rem"
              transition="color 0.2s"
              _groupHover={{ color: BLUE }}
            >
              {item.title}
            </Heading>

            {item.description ? (
              <Text fontSize="xs" color={subtextColor} noOfLines={2} lineHeight="1.7">
                {item.description}
              </Text>
            ) : (
              <Box flex="1" />
            )}

            <HStack justify="space-between" fontSize="xs" color={subtextColor} mt="auto" pt={1}>
              <HStack spacing={1.5}>
                <Icon as={FaCalendarAlt} color="blue.400" boxSize={3} />
                <Text>{enrolledDate}</Text>
              </HStack>
            </HStack>

            <Button
              w="full"
              h="42px"
              bg={meta.accent}
              color="white"
              size="sm"
              borderRadius="xl"
              fontWeight="bold"
              rightIcon={<Icon as={FaChevronLeft} boxSize={2.5} />}
              leftIcon={<Icon as={meta.CtaIcon} boxSize={3} />}
              _hover={{ filter: "brightness(0.95)" }}
              boxShadow="sm"
            >
              {meta.ctaLabel}
            </Button>
          </Flex>
        </Box>
      </Link>
    </MotionBox>
  );
}

const MyCourses = ({ embedded = false, onLoadingChange }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof onLoadingChange === "function") onLoadingChange(loading);
  }, [loading, onLoadingChange]);

  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [qrScanner, setQrScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [activationResult, setActivationResult] = useState(null);

  const [stats, setStats] = useState({
    courses_count: 0,
    general_courses_count: 0,
    packages_count: 0,
    total: 0,
  });

  const authHeader = useMemo(() => {
    const token = readAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

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
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("حدث خطأ في تحميل الكورسات والباقات");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [authHeader]);

  const activateCourseWithQR = async (qrData) => {
    try {
      const response = await baseUrl.post(
        "api/course/scan-qr-activate",
        { qr_data: qrData },
        { headers: authHeader },
      );
      if (response.data.success) {
        const course = response.data.course || {
          id: response.data.course_id,
          title: response.data.course_name || response.data.course?.title,
        };
        const successCopy = getActivationSuccessCopy(course);
        setActivationResult({
          success: true,
          title: successCopy.title,
          message: successCopy.message,
          courseName: course.title || "الكورس",
        });
        setShowSuccessModal(true);
        setIsQrScannerOpen(false);
        setTimeout(() => fetchCourses(), 2000);
      }
    } catch (err) {
      const errorData = err?.response?.data || {};
      const course = extractCourseFromActivationError(err);
      const enrolledCourseIds = courses
        .map((c) => c?.id ?? c?.course_id ?? c?.course?.id)
        .filter((id) => id != null);
      const errCopy = resolveActivationErrorCopy({
        apiMessage: errorData.message,
        apiReason: errorData.reason,
        errorData,
        course,
        enrolledCourseIds,
      });
      if (errCopy.kind === "already_enrolled") {
        setActivationResult({
          success: false,
          alreadyEnrolled: true,
          title: "أنت مشترك بالفعل",
          message: "أنت مشترك في هذا الكورس بالفعل.",
          reason: "يمكنك الدخول للكورس مباشرة من قائمتك.",
          course,
        });
      } else {
        setActivationResult({
          success: false,
          title: errCopy.kind === "code_exhausted" ? "كود التفعيل مستنفذ" : "فشل تفعيل الكورس",
          message: errCopy.message,
          reason: errCopy.reason,
        });
      }
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
        await html5Qrcode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            setIsScanning(false);
            html5Qrcode
              .stop()
              .then(() => {
                html5Qrcode.clear();
                setQrScanner(null);
                setIsQrScannerOpen(false);
                activateCourseWithQR(decodedText);
              })
              .catch(() => {
                html5Qrcode.clear();
                setQrScanner(null);
                setIsQrScannerOpen(false);
                activateCourseWithQR(decodedText);
              });
          },
          () => {},
        );
        setQrScanner(html5Qrcode);
      } catch {
        setIsScanning(false);
      }
    } catch {
      setIsScanning(false);
    }
  };

  const closeQrScanner = async () => {
    setIsScanning(false);
    if (qrScanner) {
      try {
        if ((await qrScanner.getState()) === 2) await qrScanner.stop();
        qrScanner.clear();
        setQrScanner(null);
      } catch {
        /* ignore */
      }
    }
    setIsQrScannerOpen(false);
  };

  useEffect(() => {
    if (isQrScannerOpen && !qrScanner) {
      const t = setTimeout(startQrScanner, 500);
      return () => clearTimeout(t);
    }
  }, [isQrScannerOpen]);

  useEffect(() => {
    if (!isQrScannerOpen && qrScanner) closeQrScanner();
  }, [isQrScannerOpen]);

  const mainBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const headingColor = useColorModeValue("slate.800", "white");
  const subtextColor = useColorModeValue("slate.500", "gray.400");
  const sectionBg = useColorModeValue("white", "gray.800");
  const sectionBorder = useColorModeValue("blackAlpha.100", "whiteAlpha.150");
  const modalBg = useColorModeValue("white", "gray.800");
  const modalBorder = useColorModeValue("gray.200", "gray.700");
  const modalText = useColorModeValue("gray.600", "gray.400");
  const chipBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const chipOrangeBg = useColorModeValue("orange.50", "whiteAlpha.100");

  if (loading) {
    return (
      <Flex
        minH={embedded ? "160px" : "60vh"}
        align="center"
        justify="center"
        bg={embedded ? "transparent" : mainBg}
      >
        <VStack spacing={3}>
          <Spinner size="lg" color="blue.500" thickness="3px" />
          <Text fontSize="sm" color={subtextColor}>
            جاري تحميل كورساتك…
          </Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box w="100%">
      {!embedded ? (
        <Box
          mb={6}
          borderRadius="2xl"
          overflow="hidden"
          bg={sectionBg}
          borderWidth="1px"
          borderColor={sectionBorder}
          boxShadow="0 10px 30px -18px rgba(15,23,42,0.25)"
        >
          <Box h="3px" bgGradient={`linear(to-l, ${BLUE}, ${ORANGE})`} aria-hidden />
          <Flex
            direction={{ base: "column", sm: "row" }}
            justify="space-between"
            align={{ base: "stretch", sm: "center" }}
            gap={4}
            p={{ base: 4, md: 5 }}
          >
            <HStack spacing={3.5} align="flex-start" flex={1} minW={0}>
              <Flex
                w="48px"
                h="48px"
                shrink={0}
                borderRadius="xl"
                bg={BLUE}
                color="white"
                align="center"
                justify="center"
                boxShadow={`0 10px 22px -8px ${BLUE}`}
              >
                <Icon as={HiOutlineBookOpen} boxSize={6} />
              </Flex>
              <VStack align="flex-start" spacing={2} minW={0}>
                <Box>
                  <Heading size="md" color={headingColor} fontWeight="extrabold" letterSpacing="-0.02em">
                    كورساتي التعليمية
                  </Heading>
                  <Text fontSize="sm" color={subtextColor} mt={0.5}>
                    {stats.total > 0
                      ? `${stats.total} اشتراك نشط — تابع دراستك من هنا`
                      : "فعّل كورساً أو باقة لبدء التعلم"}
                  </Text>
                </Box>
                {stats.total > 0 ? (
                  <HStack spacing={2} flexWrap="wrap">
                    <Badge
                      display="inline-flex"
                      alignItems="center"
                      gap={1.5}
                      bg={chipBg}
                      color={BLUE}
                      borderRadius="full"
                      px={2.5}
                      py={1}
                      fontSize="11px"
                      fontWeight="bold"
                    >
                      <Icon as={HiOutlineBookOpen} boxSize={3} />
                      {stats.courses_count} كورس
                    </Badge>
                    <Badge
                      display="inline-flex"
                      alignItems="center"
                      gap={1.5}
                      bg={chipBg}
                      color="cyan.700"
                      borderRadius="full"
                      px={2.5}
                      py={1}
                      fontSize="11px"
                      fontWeight="bold"
                      _dark={{ color: "cyan.200" }}
                    >
                      <Icon as={HiOutlineAcademicCap} boxSize={3} />
                      {stats.general_courses_count} عام
                    </Badge>
                    <Badge
                      display="inline-flex"
                      alignItems="center"
                      gap={1.5}
                      bg={chipOrangeBg}
                      color={ORANGE}
                      borderRadius="full"
                      px={2.5}
                      py={1}
                      fontSize="11px"
                      fontWeight="bold"
                    >
                      <Icon as={HiOutlineRectangleStack} boxSize={3} />
                      {stats.packages_count} باقة
                    </Badge>
                  </HStack>
                ) : null}
              </VStack>
            </HStack>

            <Button
              leftIcon={<Icon as={FaQrcode} />}
              bg={ORANGE}
              color="white"
              size="md"
              h="44px"
              borderRadius="xl"
              px={5}
              fontWeight="bold"
              boxShadow={`0 10px 22px -10px ${ORANGE}`}
              _hover={{ bg: "orange.400", transform: "translateY(-2px)" }}
              transition="all 0.2s"
              onClick={() => setIsQrScannerOpen(true)}
              alignSelf={{ base: "stretch", sm: "center" }}
            >
              تفعيل كورس جديد
            </Button>
          </Flex>
        </Box>
      ) : (
        <Flex justify="flex-end" mb={3} px={1}>
          <Button
            leftIcon={<Icon as={FaQrcode} />}
            size="sm"
            variant="outline"
            colorScheme="orange"
            borderRadius="lg"
            onClick={() => setIsQrScannerOpen(true)}
          >
            تفعيل كورس
          </Button>
        </Flex>
      )}

      {error ? (
        <Center
          py={10}
          flexDirection="column"
          bg={cardBg}
          borderRadius="2xl"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="red.300"
        >
          <Icon as={FaBookOpen} boxSize={10} color="red.400" mb={3} />
          <Text color="red.500" fontWeight="bold">
            {error}
          </Text>
          <Button
            mt={4}
            size="sm"
            onClick={fetchCourses}
            bg={BLUE}
            color="white"
            _hover={{ bg: "blue.600" }}
            borderRadius="xl"
          >
            إعادة المحاولة
          </Button>
        </Center>
      ) : courses.length > 0 ? (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={{ base: 3.5, md: 5 }}>
          <AnimatePresence>
            {courses.map((item, index) => (
              <EnrollmentCard
                key={`${item.type || "course"}-${item.id}`}
                item={item}
                index={index}
                cardBg={cardBg}
                subtextColor={subtextColor}
                headingColor={headingColor}
              />
            ))}
          </AnimatePresence>
        </SimpleGrid>
      ) : (
        <Flex
          direction="column"
          align="center"
          justify="center"
          minH={embedded ? "220px" : "280px"}
          textAlign="center"
          py={embedded ? 6 : 8}
          px={4}
          borderRadius="2xl"
          bg={cardBg}
          borderWidth="1px"
          borderColor={sectionBorder}
        >
          <Box
            mx="auto"
            display="flex"
            aspectRatio={1}
            w={{ base: "14rem", sm: "18rem" }}
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
            borderRadius="full"
            bg="slate.100"
            _dark={{ bg: "slate.800" }}
          >
            <Box
              as="img"
              src="/images/my-courses-empty-v2.jpg"
              alt="لا توجد كورسات مسجلة بعد"
              w="full"
              h="full"
              objectFit="contain"
              loading="lazy"
              decoding="async"
            />
          </Box>
          <Heading size="md" color={headingColor} mt={4} mb={2}>
            لست مشترك
          </Heading>
          <Text color={subtextColor} maxW="md" mb={6} fontSize="sm" lineHeight="1.7">
            لم تشترك في أي كورس بعد. فعّل كورساً من قسم «ابدأ من هنا» أو تصفّح كورسات المنصة.
          </Text>
          <Button
            bg={ORANGE}
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
      )}

      <Modal
        isOpen={isQrScannerOpen}
        onClose={closeQrScanner}
        isCentered
        size="xl"
        closeOnOverlayClick={false}
      >
        <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.600" />
        <ModalContent borderRadius="2xl" bg={modalBg} borderWidth="1px" borderColor={modalBorder}>
          <ModalHeader textAlign="center" bg={BLUE} color="white" borderTopRadius="2xl">
            تفعيل الكورس
          </ModalHeader>
          <ModalBody py={8}>
            <VStack spacing={5}>
              <Box
                w="100%"
                h="300px"
                bg="black"
                borderRadius="xl"
                overflow="hidden"
                position="relative"
              >
                <div id="qr-reader" style={{ width: "100%", height: "100%" }} />
                {isScanning && (
                  <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    zIndex={10}
                  >
                    <Spinner color="blue.400" size="xl" />
                  </Box>
                )}
              </Box>
              <Text textAlign="center" color={modalText}>
                وجه الكاميرا نحو كود الـ QR الخاص بالكورس
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter justify="center" borderTopWidth="1px" borderColor={modalBorder}>
            <Button variant="outline" colorScheme="red" onClick={closeQrScanner}>
              إلغاء
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} isCentered>
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.500" />
        <ModalContent
          textAlign="center"
          borderRadius="2xl"
          p={8}
          bg={modalBg}
          borderWidth="1px"
          borderColor={modalBorder}
        >
          <Icon as={FaCheckCircle} color="green.500" boxSize={16} mx="auto" mb={4} />
          <Heading size="md" color="green.600" mb={2}>
            {activationResult?.title || "تم تفعيل الكورس بنجاح"}
          </Heading>
          <Text color={modalText} lineHeight="1.8">
            {activationResult?.message}
          </Text>
          {activationResult?.courseName ? (
            <Text mt={3} fontWeight="bold" color="blue.600">
              {activationResult.courseName}
            </Text>
          ) : null}
        </ModalContent>
      </Modal>

      <Modal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} isCentered>
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.500" />
        <ModalContent
          textAlign="center"
          borderRadius="2xl"
          p={8}
          bg={modalBg}
          borderWidth="1px"
          borderColor={modalBorder}
        >
          <Icon as={FaCamera} color="red.500" boxSize={16} mx="auto" mb={4} />
          <Heading size="md" color="red.600" mb={2}>
            {activationResult?.title || "فشل تفعيل الكورس"}
          </Heading>
          <Text color={modalText}>{activationResult?.message}</Text>
          <Text fontSize="sm" mt={2} color={modalText}>
            {activationResult?.reason}
          </Text>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MyCourses;
