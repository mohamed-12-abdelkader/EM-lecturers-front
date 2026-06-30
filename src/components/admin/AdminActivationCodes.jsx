import React, { useState } from "react";
import {
  Box,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Badge,
  Spinner,
  useToast,
  VStack,
  HStack,
  useColorModeValue,
  Container,
  Icon,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Divider,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";
import { MdSearch, MdVpnKey, MdArrowBack } from "react-icons/md";
import baseUrl from "../../api/baseUrl";
import ScrollToTop from "../scollToTop/ScrollToTop";

const MotionBox = motion(Box);

const AdminActivationCodes = () => {
  const [codeInput, setCodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const toast = useToast();

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const headingColor = useColorModeValue("gray.800", "gray.100");
  const textColor = useColorModeValue("gray.700", "gray.300");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const inputBg = useColorModeValue("white", "gray.700");
  const headerGradient = useColorModeValue(
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #4a5568 0%, #2d3748 100%)"
  );
  const brandBar = "linear-gradient(90deg, #4299E1 0%, #DD6B20 100%)";
  const linkRowHoverBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const infoBlockBg = useColorModeValue("gray.50", "whiteAlpha.50");

  const handleSearch = async () => {
    const code = codeInput?.trim();
    if (!code) {
      toast({
        title: "كود مطلوب",
        description: "يرجى إدخال كود التفعيل",
        status: "warning",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
      setError("الكود مفقود أو فارغ");
      setData(null);
      return;
    }

    setError(null);
    setData(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await baseUrl.get(
        `/api/course/admin/activation-code/${encodeURIComponent(code)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res.data);
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message;
      if (status === 404) {
        setError("الكود غير موجود في النظام");
        toast({
          title: "غير موجود",
          description: "الكود غير موجود في النظام",
          status: "error",
          duration: 4000,
          isClosable: true,
          position: "top",
        });
      } else if (status === 400) {
        setError("الكود مفقود أو فارغ");
        toast({
          title: "طلب غير صالح",
          description: msg || "الكود مفقود أو فارغ",
          status: "warning",
          duration: 4000,
          isClosable: true,
          position: "top",
        });
      } else {
        setError(msg || "حدث خطأ أثناء جلب البيانات");
        toast({
          title: "خطأ",
          description: msg || "حدث خطأ",
          status: "error",
          duration: 4000,
          isClosable: true,
          position: "top",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Box minH="100vh" bg={pageBg} dir="rtl" pb={12} pt={6}>
      <Container maxW="900px" px={{ base: 4, md: 6 }}>
        <VStack spacing={8} align="stretch">
          {/* Header مع البراندينج */}
          <MotionBox
            bgGradient={headerGradient}
            borderRadius="2xl"
            shadow="2xl"
            p={{ base: 6, md: 8 }}
            position="relative"
            overflow="hidden"
            color="white"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              h="4px"
              bg={brandBar}
              opacity={0.9}
            />
            <Flex
              align="center"
              justify="space-between"
              flexWrap="wrap"
              gap={4}
              position="relative"
              zIndex={1}
            >
              <HStack spacing={4}>
                <Box
                  p={3}
                  bg="whiteAlpha.200"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                >
                  <Icon as={MdVpnKey} w={8} h={8} />
                </Box>
                <VStack align="flex-start" spacing={0}>
                  <Heading size="lg" textShadow="0 1px 3px rgba(0,0,0,0.2)">
                    إدارة أكواد التفعيل
                  </Heading>
                  <Text fontSize="sm" opacity={0.95}>
                    ابحث عن كود التفعيل لعرض تفاصيله واستخداماته
                  </Text>
                </VStack>
              </HStack>
              <Button
                as={RouterLink}
                to="/home"
                leftIcon={<Icon as={MdArrowBack} />}
                variant="ghost"
                color="white"
                _hover={{ bg: "whiteAlpha.200" }}
                size="sm"
              >
                العودة للوحة التحكم
              </Button>
            </Flex>
          </MotionBox>

          {/* بحث — الزر خارج الـ Input */}
          <MotionBox
            position="relative"
            bg={cardBg}
            borderRadius="2xl"
            shadow="xl"
            p={6}
            border="2px solid"
            borderColor={borderColor}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              h="4px"
              bg={brandBar}
              opacity={0.9}
              borderRadius="2xl 2xl 0 0"
            />
            <Flex gap={3} direction={{ base: "column", sm: "row" }} align="stretch">
              <InputGroup size="lg" flex={1}>
                <InputLeftElement pointerEvents="none" h="full" pl={4}>
                  <Icon as={MdSearch} color="blue.500" boxSize={5} />
                </InputLeftElement>
                <Input
                  placeholder="أدخل كود التفعيل..."
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.1)" }}
                  borderRadius="xl"
                  pl={12}
                />
              </InputGroup>
              <Button
                colorScheme="blue"
                size="lg"
                leftIcon={loading ? <Spinner size="sm" /> : <Icon as={MdSearch} />}
                onClick={handleSearch}
                isDisabled={loading}
                minW={{ base: "full", sm: "140px" }}
                borderRadius="xl"
              >
                بحث
              </Button>
            </Flex>
          </MotionBox>

          {error && (
            <Alert status="error" borderRadius="xl" shadow="md">
              <AlertIcon />
              <Box>
                <AlertTitle>خطأ</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Box>
            </Alert>
          )}

          {data && (
            <VStack align="stretch" spacing={6}>
              {/* ملخص الكود */}
              <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Card bg={cardBg} borderRadius="2xl" shadow="lg" border="2px solid" borderColor={borderColor} overflow="hidden">
                  <Box h="4px" bg={brandBar} />
                  <CardHeader pb={2}>
                    <HStack justify="space-between" flexWrap="wrap" gap={2}>
                      <Heading size="md" color={headingColor} fontFamily="inherit">
                        الكود: <Text as="span" fontWeight="bold" color="blue.500">{data.code}</Text>
                      </Heading>
                      <HStack gap={2}>
                        <Badge colorScheme={data.is_used ? "red" : "green"} fontSize="sm" px={3} py={1}>
                          {data.is_used ? "مستنفد" : "متاح"}
                        </Badge>
                        <Badge colorScheme={data.is_expired ? "orange" : "blue"} fontSize="sm" px={3} py={1}>
                          {data.is_expired ? "منتهي الصلاحية" : "ساري"}
                        </Badge>
                      </HStack>
                    </HStack>
                  </CardHeader>
                  <CardBody pt={0} pb={5}>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <InfoBlock label="عدد الاستخدامات" value={`${data.uses} / ${data.max_uses}`} color={textColor} blockBg={infoBlockBg} />
                      <InfoBlock label="تاريخ الإنشاء" value={formatDate(data.created_at)} color={textColor} blockBg={infoBlockBg} />
                      <InfoBlock label="ينتهي في" value={data.expires_at ? formatDate(data.expires_at) : "بدون انتهاء"} color={textColor} blockBg={infoBlockBg} />
                    </SimpleGrid>
                  </CardBody>
                </Card>
              </MotionBox>

              {/* الكورس والمدرس في صف واحد */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
                  <Card bg={cardBg} borderRadius="2xl" shadow="lg" border="2px solid" borderColor={borderColor} overflow="hidden" h="full">
                    <Box h="4px" bg={brandBar} opacity={0.9} />
                    <CardHeader py={4}>
                      <Heading size="sm" color={headingColor}>الكورس</Heading>
                    </CardHeader>
                    <CardBody pt={0}>
                      <SimpleInfoRow label="المعرف" value={data.course?.id} color={textColor} />
                      <Divider my={2} borderColor={borderColor} />
                      <SimpleInfoRow label="العنوان" value={data.course?.title} color={textColor} />
                    </CardBody>
                  </Card>
                </MotionBox>
                <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
                  <Card bg={cardBg} borderRadius="2xl" shadow="lg" border="2px solid" borderColor={borderColor} overflow="hidden" h="full">
                    <Box h="4px" bg={brandBar} opacity={0.9} />
                    <CardHeader py={4}>
                      <Heading size="sm" color={headingColor}>المدرس</Heading>
                    </CardHeader>
                    <CardBody pt={0}>
                      <SimpleInfoRow label="المعرف" value={data.teacher?.id} color={textColor} />
                      <SimpleInfoRow label="الاسم" value={data.teacher?.name} color={textColor} />
                      <SimpleInfoRow label="البريد" value={data.teacher?.email} color={textColor} />
                      <SimpleInfoRow label="الهاتف" value={data.teacher?.phone} color={textColor} />
                    </CardBody>
                  </Card>
                </MotionBox>
              </SimpleGrid>

              {/* من استخدموا الكود */}
              <MotionBox initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
                <Card bg={cardBg} borderRadius="2xl" shadow="lg" border="2px solid" borderColor={borderColor} overflow="hidden">
                  <Box h="4px" bg={brandBar} opacity={0.9} />
                  <CardHeader py={4}>
                    <Heading size="sm" color={headingColor}>
                      من استخدموا الكود
                      <Badge ml={2} colorScheme="blue" fontSize="xs">{data.used_by?.length || 0}</Badge>
                    </Heading>
                  </CardHeader>
                  <CardBody pt={0}>
                    {!data.used_by?.length ? (
                      <Text color={textColor} fontSize="sm" py={4}>لم يستخدم أحد هذا الكود بعد.</Text>
                    ) : (
                      <TableContainer>
                        <Table size="sm" variant="simple">
                          <Thead>
                            <Tr>
                              <Th color={headingColor}>الطالب</Th>
                              <Th color={headingColor}>البريد</Th>
                              <Th color={headingColor}>الهاتف</Th>
                              <Th color={headingColor}>تاريخ الاستخدام</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {data.used_by.map((u, i) => (
                              <Tr key={u.user_id || i} _hover={{ bg: linkRowHoverBg }}>
                                <Td fontWeight="medium">{u.name}</Td>
                                <Td>{u.email}</Td>
                                <Td>{u.phone}</Td>
                                <Td>{formatDate(u.used_at)}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardBody>
                </Card>
              </MotionBox>
            </VStack>
          )}
        </VStack>
      </Container>
      <ScrollToTop />
    </Box>
  );
};

function SimpleInfoRow({ label, value, color }) {
  return (
    <HStack justify="space-between" py={1.5}>
      <Text as="span" color={color} fontSize="sm">
        {label}
      </Text>
      <Text as="span" fontWeight="medium" color={color} noOfLines={1}>
        {value ?? "—"}
      </Text>
    </HStack>
  );
}

function InfoBlock({ label, value, color }) {
  return (
    <Box p={3} borderRadius="xl" bg={useColorModeValue("gray.50", "whiteAlpha.50")}>
      <Text fontSize="xs" color={color} opacity={0.9} mb={1}>
        {label}
      </Text>
      <Text fontWeight="semibold" color={color} fontSize="sm">
        {value ?? "—"}
      </Text>
    </Box>
  );
}

export default AdminActivationCodes;
