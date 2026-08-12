import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  SimpleGrid,
  Text,
  Badge,
  HStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaExternalLinkAlt } from "react-icons/fa";
import { fetchAcademyTeacherCourses } from "../../api/academyApi";
import { ACCENT, courseTitle, field } from "./academyUtils";
import { EmptyState, LoadingBlock, PageHeader, Surface } from "./components/AcademyUiBits";

export default function AcademyTeacherCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const tileBorder = useColorModeValue("slate.200", "gray.700");
  const tileBg = useColorModeValue("white", "gray.900");
  const muted = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    let mounted = true;
    fetchAcademyTeacherCourses()
      .then((list) => {
        if (mounted) setCourses(list);
      })
      .catch((err) => {
        if (mounted) setError(err?.response?.data?.message || "تعذر تحميل الكورسات");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <EmptyState title="خطأ" description={error} />;

  return (
    <Box>
      <PageHeader title="كورساتي المسندة" description="يمكنك إدارة محتوى هذه الكورسات فقط" />

      {courses.length === 0 ? (
        <EmptyState title="لا كورسات" description="لم تُسند إليك أي كورسات بعد." />
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {courses.map((course) => {
            const id = field(course, "id", "course_id", "courseId");
            return (
              <Surface key={id} p={5}>
                <Text fontWeight="black" fontSize="md" mb={2} noOfLines={2}>
                  {courseTitle(course)}
                </Text>
                {field(course, "subject") ? (
                  <Badge colorScheme="blue" borderRadius="full" mb={3}>
                    {field(course, "subject")}
                  </Badge>
                ) : null}
                <Text fontSize="xs" color={muted} mb={4} lineHeight="tall">
                  أدوات المحتوى والامتحانات متاحة داخل صفحة الكورس
                </Text>
                <Button
                  as={RouterLink}
                  to={`/CourseDetailsPage/${id}`}
                  w="full"
                  bg={ACCENT}
                  color="white"
                  borderRadius="xl"
                  size="sm"
                  leftIcon={<FaExternalLinkAlt />}
                  _hover={{ bg: "#2B6CB0" }}
                >
                  فتح الكورس
                </Button>
              </Surface>
            );
          })}
        </SimpleGrid>
      )}
    </Box>
  );
}
