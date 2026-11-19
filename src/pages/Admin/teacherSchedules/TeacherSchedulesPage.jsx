import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  Spinner,
  Text,
  useColorModeValue,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { MdCalendarMonth, MdRefresh } from "react-icons/md";
import { fetchScheduleTeachers } from "../../../api/teacherScheduleApi";

export default function TeacherSchedulesPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [q, setQ] = useState("");
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchScheduleTeachers();
      setTeachers(Array.isArray(rows) ? rows : []);
    } catch (err) {
      toast({
        title: "تعذّر تحميل المدرسين",
        description: err?.response?.data?.message || err.message,
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return teachers;
    return teachers.filter((t) =>
      [t.name, t.email, t.phone, t.whatsapp_number, t.subject]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [teachers, q]);

  return (
    <Box dir="rtl" bg={pageBg} minH="100vh" py={8}>
      <Container maxW="6xl">
        <Flex justify="space-between" align={{ base: "stretch", md: "center" }} gap={4} mb={6} wrap="wrap">
          <Box>
            <Heading size="lg">جداول المدرسين</Heading>
            <Text color={muted} mt={1}>
              اختر مدرسًا لعرض وإدارة جدول مهامه اليومي والأسبوعي والشهري.
            </Text>
          </Box>
          <HStack>
            <Button
              as={RouterLink}
              to="/admin/whatsapp/teachers-management"
              leftIcon={<MdCalendarMonth />}
              variant="outline"
            >
              خدمة واتساب
            </Button>
            <Button leftIcon={<MdRefresh />} onClick={load} isLoading={loading}>
              تحديث
            </Button>
          </HStack>
        </Flex>

        <Input
          placeholder="بحث بالاسم أو الهاتف أو المادة..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          bg={cardBg}
          mb={4}
          maxW="md"
        />

        {loading ? (
          <Flex justify="center" py={16}>
            <Spinner size="lg" />
          </Flex>
        ) : (
          <VStack align="stretch" spacing={3}>
            {filtered.map((teacher) => (
              <Flex
                key={teacher.id}
                as={RouterLink}
                to={`/admin/teacher-schedules/${teacher.id}`}
                bg={cardBg}
                borderWidth="1px"
                borderColor={border}
                borderRadius="xl"
                p={4}
                align="center"
                gap={4}
                _hover={{ borderColor: "blue.400", textDecoration: "none" }}
              >
                <Avatar name={teacher.name} src={teacher.avatar || undefined} />
                <Box flex="1" minW={0}>
                  <Text fontWeight="bold" noOfLines={1}>
                    {teacher.name || `مدرس #${teacher.id}`}
                  </Text>
                  <Text fontSize="sm" color={muted} noOfLines={1}>
                    {[teacher.subject, teacher.whatsapp_number || teacher.phone]
                      .filter(Boolean)
                      .join(" • ") || teacher.email}
                  </Text>
                </Box>
                <HStack spacing={2}>
                  <Badge colorScheme="blue">اليوم {teacher.todayTasksCount || 0}</Badge>
                  <Badge colorScheme="purple">قادم {teacher.upcomingTasksCount || 0}</Badge>
                </HStack>
              </Flex>
            ))}
            {!filtered.length && (
              <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="xl" p={8} textAlign="center">
                <Text color={muted}>لا يوجد مدرسون مطابقون للبحث.</Text>
              </Box>
            )}
          </VStack>
        )}
      </Container>
    </Box>
  );
}
