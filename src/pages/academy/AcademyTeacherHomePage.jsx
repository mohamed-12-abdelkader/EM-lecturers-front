import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  SimpleGrid,
  Text,
  Badge,
  HStack,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaBookOpen, FaChevronLeft } from "react-icons/fa";
import { fetchAcademyTeacherDashboard } from "../../api/academyApi";
import { ACCENT, courseTitle, field } from "./academyUtils";
import { EmptyState, KpiCard, LoadingBlock, PageHeader, Surface } from "./components/AcademyUiBits";

export default function AcademyTeacherHomePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const tileBorder = useColorModeValue("slate.200", "gray.700");
  const tileBg = useColorModeValue("slate.50", "whiteAlpha.50");
  const muted = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    let mounted = true;
    fetchAcademyTeacherDashboard()
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch((err) => {
        if (mounted) setError(err?.response?.data?.message || "تعذر تحميل اللوحة");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <LoadingBlock label="جاري تحميل لوحتك..." />;
  if (error) return <EmptyState title="تعذر تحميل اللوحة" description={error} />;

  const courses = data?.courses || data?.assigned_courses || [];
  const courseList = Array.isArray(courses) ? courses : [];
  const summary = data?.summary || data?.stats || data || {};

  return (
    <Box>
      <PageHeader
        title="لوحة مدرس الأكاديمية"
        description={data?.academy_name || data?.tenant_name || "الكورسات المسندة إليك فقط"}
      />

      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} mb={6}>
        <KpiCard
          label="كورساتي المسندة"
          value={summary.courses_count ?? summary.coursesCount ?? courseList.length}
          icon={FaBookOpen}
          color="blue"
        />
      </SimpleGrid>

      <Surface p={{ base: 4, md: 5 }}>
        <Text fontWeight="bold" mb={4}>
          الكورسات المسندة
        </Text>
        {courseList.length === 0 ? (
          <EmptyState
            title="لا توجد كورسات مسندة"
            description="تواصل مع إدارة الأكاديمية لإسناد كورسات إليك."
          />
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            {courseList.map((course) => {
              const id = field(course, "id", "course_id", "courseId");
              return (
                <Button
                  key={id}
                  as={RouterLink}
                  to={`/CourseDetailsPage/${id}`}
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
                  _hover={{ borderColor: ACCENT, bg: "blue.50" }}
                >
                  <HStack align="flex-start" w="full" spacing={3}>
                    <Box flex={1}>
                      <Text fontWeight="bold" fontSize="sm" mb={1}>
                        {courseTitle(course)}
                      </Text>
                      <HStack spacing={2}>
                        {field(course, "subject") ? (
                          <Badge colorScheme="blue" borderRadius="full" fontSize="10px">
                            {field(course, "subject")}
                          </Badge>
                        ) : null}
                        {course.is_primary ? (
                          <Badge colorScheme="purple" borderRadius="full" fontSize="10px">
                            رئيسي
                          </Badge>
                        ) : null}
                      </HStack>
                      <Text fontSize="xs" color={muted} mt={2}>
                        إدارة المحتوى والامتحانات
                      </Text>
                    </Box>
                    <FaChevronLeft color={muted} />
                  </HStack>
                </Button>
              );
            })}
          </SimpleGrid>
        )}

        <Box mt={6} pt={4} borderTopWidth="1px" borderColor={tileBorder}>
          <Button as={RouterLink} to="/academy/me/courses" variant="ghost" color={ACCENT} size="sm">
            عرض كل الكورسات ←
          </Button>
        </Box>
      </Surface>
    </Box>
  );
}
