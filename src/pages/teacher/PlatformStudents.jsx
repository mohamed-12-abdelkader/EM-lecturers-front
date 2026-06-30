import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Text,
  VStack,
  HStack,
  Badge,
  SimpleGrid,
  Spinner,
  Center,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Divider,
  Icon,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaUserGraduate, FaPhone, FaUserFriends, FaSearch, FaUsers } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import baseUrl from "../../api/baseUrl";

const PlatformStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [allowingStudentId, setAllowingStudentId] = useState(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const titleColor = useColorModeValue("gray.800", "white");
  const softBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const headerBg = useColorModeValue("linear(to-l, blue.600, blue.500)", "linear(to-l, blue.700, blue.500)");
  const toast = useToast();
  const total = useMemo(() => students.length, [students]);
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((student) => {
      const name = (student.name || "").toLowerCase();
      const phone = (student.phone || "").toLowerCase();
      const parentPhone = (student.parent_phone || "").toLowerCase();
      const grades = (student.grades || []).map((g) => g.name).join(" ").toLowerCase();
      return (
        name.includes(q) ||
        phone.includes(q) ||
        parentPhone.includes(q) ||
        grades.includes(q)
      );
    });
  }, [students, search]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        const res = await baseUrl.get("/api/teacher/platform-students", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = res?.data?.data?.students || [];
        setStudents(Array.isArray(list) ? list : []);
      } catch (e) {
        setError(e?.response?.data?.message || "فشل تحميل طلاب المنصة");
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleAllowDevice = async (student) => {
    try {
      if (!student?.phone) {
        toast({
          title: "لا يوجد رقم هاتف",
          description: "يجب توفر رقم هاتف للطالب للسماح بجهاز آخر.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      setAllowingStudentId(student.id);
      const token = localStorage.getItem("token");
      const response = await baseUrl.post(
        "/api/users/students/allow-device",
        { phone: student.phone },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast({
        title: "تم بنجاح",
        description: response?.data?.message || "تم السماح للطالب باستخدام جهاز آخر",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (e) {
      toast({
        title: "فشل العملية",
        description: e?.response?.data?.message || "تعذر السماح بجهاز آخر لهذا الطالب",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setAllowingStudentId(null);
    }
  };

  if (loading) {
    return (
      <Center py={16} className="mt-[300px]">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Center>
    );
  }

  return (
    <Box p={{ base: 3, md: 5 }} dir="rtl" className="mt-[100px]">
      <Card
        mb={5}
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="2xl"
        overflow="hidden"
        boxShadow="sm"
      >
        <Box bgGradient={headerBg} px={{ base: 4, md: 5 }} py={{ base: 4, md: 5 }}>
          <HStack justify="space-between" align="center" color="white">
            <VStack align="start" spacing={1}>
              <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="black">
                كل الطلاب
              </Text>
              <Text fontSize="sm" color="whiteAlpha.900">
                طلاب المنصة الحاليين
              </Text>
            </VStack>
            <Center w="46px" h="46px" borderRadius="xl" bg="whiteAlpha.250">
              <Icon as={FaUsers} boxSize={5} />
            </Center>
          </HStack>
        </Box>
        <CardBody pt={4}>
          <HStack justify="space-between" mb={4} flexWrap="wrap" spacing={3}>
            <Badge colorScheme="blue" borderRadius="full" px={3.5} py={1.5} fontSize="sm">
              إجمالي الطلاب: {total}
            </Badge>
            <Badge colorScheme="green" borderRadius="full" px={3.5} py={1.5} fontSize="sm">
              بعد الفلترة: {filteredStudents.length}
            </Badge>
          </HStack>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FaSearch} color={muted} />
            </InputLeftElement>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو الهاتف أو الصف..."
              borderRadius="xl"
              borderColor={borderColor}
              _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #60a5fa" }}
            />
          </InputGroup>
        </CardBody>
      </Card>

      {error ? (
        <Card bg={cardBg} borderWidth="1px" borderColor="red.200">
          <CardBody>
            <Text color="red.500" fontWeight="bold">
              {error}
            </Text>
          </CardBody>
        </Card>
      ) : filteredStudents.length === 0 ? (
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <Text color={muted}>
              {students.length === 0
                ? "لا يوجد طلاب مسجلين في المنصة حاليًا."
                : "لا توجد نتائج مطابقة لبحثك."}
            </Text>
          </CardBody>
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
          {filteredStudents.map((student) => (
            <Card
              key={student.id}
              bg={cardBg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="xl"
              boxShadow="sm"
              transition="all 0.2s ease"
              _hover={{ transform: "translateY(-2px)", boxShadow: "md", borderColor: "blue.200" }}
            >
              <CardHeader pb={2}>
                <HStack spacing={3}>
                  <Avatar size="md" name={student.name} src={student.avatar || undefined} />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="black" color={titleColor}>
                      {student.name || "بدون اسم"}
                    </Text>
                    <Text fontSize="xs" color={muted}>
                      ID: {student.id}
                    </Text>
                  </VStack>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <Divider mb={3} />
                <VStack align="stretch" spacing={3}>
                  <HStack spacing={2.5} color={muted}>
                    <Icon as={FaPhone} />
                    <Text fontSize="sm">{student.phone || "غير متوفر"}</Text>
                  </HStack>
                  <HStack spacing={2.5} color={muted}>
                    <Icon as={MdEmail} />
                    <Text fontSize="sm">{student.email || "غير متوفر"}</Text>
                  </HStack>
                  <HStack spacing={2.5} color={muted}>
                    <Icon as={FaUserFriends} />
                    <Text fontSize="sm">{student.parent_phone || "غير متوفر"}</Text>
                  </HStack>
                  <Box borderRadius="lg" bg={softBg} p={3} borderWidth="1px" borderColor={borderColor}>
                    <HStack spacing={2.5} color={muted} align="start" mb={2}>
                      <Icon as={FaUserGraduate} mt={0.5} />
                      <Text fontSize="sm" fontWeight="bold">الصفوف</Text>
                    </HStack>
                    <HStack spacing={2} flexWrap="wrap">
                      {(student.grades || []).length > 0 ? (
                        (student.grades || []).map((grade) => (
                          <Badge key={grade.id} colorScheme="blue" borderRadius="full" px={2.5} py={1}>
                            {grade.name}
                          </Badge>
                        ))
                      ) : (
                        <Text fontSize="sm" color={muted}>غير محدد</Text>
                      )}
                    </HStack>
                  </Box>

                  <Button
                    size="sm"
                    w="full"
                    colorScheme="blue"
                    variant="outline"
                    borderRadius="lg"
                    onClick={() => handleAllowDevice(student)}
                    isLoading={allowingStudentId === student.id}
                    loadingText="جاري التنفيذ..."
                  >
                    السماح للطالب باستخدام جهاز آخر
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default PlatformStudents;
