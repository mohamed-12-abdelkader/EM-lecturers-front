import React, { useMemo, useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Select,
  Badge,
  useColorModeValue,
  Icon,
  Flex,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@chakra-ui/react";
import { FaRobot, FaBook, FaChalkboardTeacher } from "react-icons/fa";
import ScientificChatPanel from "../../components/scientificChat/ScientificChatPanel";
import useGitMyTeacher from "../../Hooks/student/useGitMyTeacher";

const ScientificChatPage = () => {
  const token = localStorage.getItem("token");
  const [, myTeachers] = useGitMyTeacher();

  const [tab, setTab] = useState(0);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");

  const pageBg = useColorModeValue("gray.100", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.300");

  const enrolledCourses = useMemo(() => {
    const list = [];
    const teachersRaw = myTeachers?.teachers ?? myTeachers;
    const teachersList = Array.isArray(teachersRaw) ? teachersRaw : [];
    teachersList.forEach((t) => {
      const teacherId = t?.teacher_id ?? t?.id;
      (Array.isArray(t?.courses) ? t.courses : []).forEach((c) => {
        if (c?.is_enrolled || c?.enrolled) {
          list.push({
            courseId: c.id,
            courseTitle: c.title || c.name,
            teacherId,
            teacherName: t?.name || t?.teacher_name || "المدرس",
          });
        }
      });
    });
    return list;
  }, [myTeachers]);

  const teachersList = useMemo(() => {
    const map = new Map();
    enrolledCourses.forEach((c) => {
      if (c.teacherId && !map.has(String(c.teacherId))) {
        map.set(String(c.teacherId), c.teacherName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [enrolledCourses]);

  const activeCourseId = selectedCourseId || enrolledCourses[0]?.courseId || "";
  const activeTeacherId = selectedTeacherId || teachersList[0]?.id || "";

  return (
    <Box minH="100vh" bg={pageBg} py={{ base: 4, md: 8 }} dir="rtl">
      <Box
        position="absolute"
        top="-80px"
        right="-60px"
        w="300px"
        h="300px"
        borderRadius="full"
        bg="blue.400"
        opacity={0.1}
        filter="blur(70px)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-60px"
        left="-40px"
        w="260px"
        h="260px"
        borderRadius="full"
        bg="orange.400"
        opacity={0.08}
        filter="blur(70px)"
        pointerEvents="none"
      />

      <Container maxW="5xl" position="relative">
        <VStack spacing={5} align="stretch">
          <Box
            p={{ base: 4, md: 6 }}
            borderRadius="2xl"
            bgGradient="linear(to-l, blue.600, blue.500)"
            color="white"
            boxShadow="xl"
          >
            <HStack spacing={4} align="start">
              <Flex
                boxSize={12}
                borderRadius="xl"
                bg="whiteAlpha.200"
                align="center"
                justify="center"
              >
                <Icon as={FaRobot} boxSize={6} />
              </Flex>
              <Box>
                <Heading size="md" fontWeight="black">
                  المساعد العلمي
                </Heading>
                <Text fontSize="sm" color="whiteAlpha.900" mt={1} maxW="2xl" lineHeight="1.7">
                  اسأل عن المحتوى الدراسي — الإجابات من المواد المرفوعة عبر RAG (نص + صور).
                </Text>
                <HStack mt={3} spacing={2} flexWrap="wrap">
                  <Badge bg="whiteAlpha.200" color="white" borderRadius="full" px={3}>
                    DeepSeek + Milvus
                  </Badge>
                  <Badge bg="orange.400" color="white" borderRadius="full" px={3}>
                    دعم الصور
                  </Badge>
                </HStack>
              </Box>
            </HStack>
          </Box>

          <Box
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="2xl"
            overflow="hidden"
            boxShadow="lg"
            minH="560px"
          >
            <Tabs
              index={tab}
              onChange={setTab}
              colorScheme="blue"
              variant="enclosed"
              isFitted
            >
              <TabList px={3} pt={3} borderBottom="none" gap={2}>
                <Tab borderRadius="xl" fontWeight="bold" _selected={{ bg: "blue.500", color: "white" }}>
                  <Icon as={FaBook} ml={2} />
                  سؤال عن كورس
                </Tab>
                <Tab borderRadius="xl" fontWeight="bold" _selected={{ bg: "orange.500", color: "white" }}>
                  <Icon as={FaChalkboardTeacher} ml={2} />
                  سؤال عن كل مواد المدرس
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel px={{ base: 2, md: 4 }} pb={4}>
                  {enrolledCourses.length > 1 && (
                    <Box mb={3}>
                      <Text fontSize="xs" fontWeight="bold" color={muted} mb={1.5}>
                        اختر الكورس
                      </Text>
                      <Select
                        value={String(activeCourseId)}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        borderRadius="xl"
                        size="sm"
                      >
                        {enrolledCourses.map((c) => (
                          <option key={c.courseId} value={c.courseId}>
                            {c.courseTitle} — {c.teacherName}
                          </option>
                        ))}
                      </Select>
                    </Box>
                  )}
                  {enrolledCourses.length === 0 ? (
                    <Box py={16} textAlign="center" px={4}>
                      <Text color={muted}>
                        لا توجد كورسات مشترك بها. اشترك في كورس أولاً لاستخدام المساعد العلمي.
                      </Text>
                    </Box>
                  ) : (
                    <ScientificChatPanel
                      mode="course"
                      courseId={activeCourseId}
                      token={token}
                      compact
                    />
                  )}
                </TabPanel>

                <TabPanel px={{ base: 2, md: 4 }} pb={4}>
                  {teachersList.length > 1 && (
                    <Box mb={3}>
                      <Text fontSize="xs" fontWeight="bold" color={muted} mb={1.5}>
                        اختر المدرس
                      </Text>
                      <Select
                        value={String(activeTeacherId)}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                        borderRadius="xl"
                        size="sm"
                      >
                        {teachersList.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </Select>
                    </Box>
                  )}
                  {teachersList.length === 0 ? (
                    <Box py={16} textAlign="center" px={4}>
                      <Text color={muted}>
                        يجب الاشتراك في كورس واحد على الأقل لسؤال المدرس.
                      </Text>
                    </Box>
                  ) : (
                    <ScientificChatPanel
                      mode="teacher"
                      teacherId={activeTeacherId}
                      token={token}
                      compact
                    />
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default ScientificChatPage;
