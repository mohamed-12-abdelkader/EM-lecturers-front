import { Container, Box } from "@chakra-ui/react";
import MyCourses from "../../components/courses/MyCourses";

/** صفحة مستقلة لعرض اشتراكات الطالب من GET /api/course/my-enrollments */
const MyEnrollmentsPage = () => (
  <Box w="100%" py={{ base: 4, md: 6 }} px={{ base: 2, md: 0 }}>
    <Container maxW="container.xl">
      <MyCourses embedded={false} />
    </Container>
  </Box>
);

export default MyEnrollmentsPage;
