import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  SimpleGrid,
  Text,
  HStack,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaChalkboardTeacher, FaBookOpen, FaUserGraduate, FaLink, FaChevronLeft } from "react-icons/fa";
import { fetchAcademyOverview } from "../../api/academyApi";
import { ACCENT } from "./academyUtils";
import { EmptyState, KpiCard, LoadingBlock, PageHeader, Surface } from "./components/AcademyUiBits";

const QUICK = [
  { to: "/academy/teachers", label: "المدرسون", desc: "إضافة وإدارة مدرسي الأكاديمية", color: "blue" },
  { to: "/academy/courses", label: "الكورسات", desc: "إسناد المدرسين للكورسات", color: "teal" },
  { to: "/teacher_courses", label: "إنشاء كورس", desc: "أنشئ كورساً جديداً للأكاديمية", color: "purple" },
];

export default function AcademyOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const muted = useColorModeValue("gray.500", "gray.400");
  const tileBg = useColorModeValue("slate.50", "whiteAlpha.50");
  const tileBorder = useColorModeValue("slate.200", "gray.700");
  const hoverBg = useColorModeValue("blue.50", "whiteAlpha.100");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchAcademyOverview()
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch((err) => {
        if (mounted) {
          setError(err?.response?.data?.message || err?.message || "تعذر تحميل البيانات");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <LoadingBlock label="جاري تحميل لوحة الأكاديمية..." />;
  if (error) return <EmptyState title="تعذر تحميل اللوحة" description={error} />;

  const stats = data?.stats || data || {};
  const students = stats.students_count ?? stats.studentsCount ?? stats.students ?? 0;
  const teachers = stats.teachers_count ?? stats.teachersCount ?? stats.teachers ?? 0;
  const courses = stats.courses_count ?? stats.coursesCount ?? stats.courses ?? 0;
  const assignments = stats.assignments_count ?? stats.assignmentsCount ?? stats.assignments ?? 0;

  return (
    <Box>
      <PageHeader
        title="لوحة الأكاديمية"
        description="نظرة عامة على مدرسيك وكورساتك وإسنادات الإدارة"
      />

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={{ base: 3, md: 4 }} mb={6}>
        <KpiCard label="الطلاب" value={students} icon={FaUserGraduate} color="green" />
        <KpiCard label="المدرسون" value={teachers} icon={FaChalkboardTeacher} color="blue" />
        <KpiCard label="الكورسات" value={courses} icon={FaBookOpen} color="teal" />
        <KpiCard label="الإسنادات" value={assignments} icon={FaLink} color="purple" sub="مدرس ↔ كورس" />
      </SimpleGrid>

      <Surface p={{ base: 4, md: 5 }}>
        <Text fontSize="sm" fontWeight="bold" mb={4}>
          إجراءات سريعة
        </Text>
        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
          {QUICK.map((item) => (
            <Button
              key={item.to}
              as={RouterLink}
              to={item.to}
              variant="outline"
              h="auto"
              py={4}
              px={4}
              borderRadius="xl"
              borderColor={tileBorder}
              bg={tileBg}
              justifyContent="flex-start"
              whiteSpace="normal"
              textAlign="right"
              _hover={{ bg: hoverBg, borderColor: ACCENT }}
            >
              <HStack align="flex-start" spacing={3} w="full">
                <Box flex={1}>
                  <Text fontWeight="bold" fontSize="sm" mb={1}>
                    {item.label}
                  </Text>
                  <Text fontSize="xs" color={muted} lineHeight="tall">
                    {item.desc}
                  </Text>
                </Box>
                <Icon as={FaChevronLeft} boxSize={3} color={muted} mt={1} />
              </HStack>
            </Button>
          ))}
        </SimpleGrid>
      </Surface>
    </Box>
  );
}
