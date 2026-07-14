import React, { useMemo, useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  useColorModeValue,
  Icon,
  Button,
  VStack,
  HStack,
  IconButton,
  Badge,
  useBreakpointValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  FormControl,
  FormLabel,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
  Spinner,
  Center,
} from "@chakra-ui/react";
import {
  FaBookOpen,
  FaGraduationCap,
  FaQuestionCircle,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSync,
  FaFileAlt,
} from "react-icons/fa";
import baseUrl from "../../api/baseUrl";
import {
  useInvalidateTeacherQuestionBank,
  useTeacherLibraryLessons,
} from "../../Hooks/teacher/useTeacherQuestionBankQueries";

const API = "/api/teacher/questions";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function KpiCard({ label, value, sub, icon, accent = "blue" }) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const accentMap = {
    blue: { bg: "blue.50", color: "blue.500" },
    orange: { bg: "orange.50", color: "orange.500" },
    green: { bg: "green.50", color: "green.500" },
  };
  const a = accentMap[accent] || accentMap.blue;

  return (
    <Box p={4} bg={bg} borderRadius="xl" borderWidth="1px" borderColor={border}>
      <Flex justify="space-between" align="center" gap={3}>
        <Box minW={0}>
          <Text fontSize="xs" color="gray.500" mb={1} noOfLines={1}>
            {label}
          </Text>
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color={useColorModeValue("gray.800", "white")}
            lineHeight="1"
          >
            {value}
          </Text>
          {sub && (
            <Text fontSize="xs" color="gray.400" mt={1} noOfLines={1}>
              {sub}
            </Text>
          )}
        </Box>
        <Flex w={10} h={10} borderRadius="lg" bg={a.bg} align="center" justify="center" flexShrink={0}>
          <Icon as={icon} color={a.color} boxSize={4} />
        </Flex>
      </Flex>
    </Box>
  );
}

const QuestionLibraryPage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const cancelRef = useRef(null);
  const invalidateQb = useInvalidateTeacherQuestionBank();
  const pageBg = useColorModeValue("gray.100", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const muted = useColorModeValue("gray.600", "gray.400");
  const heroBg = useColorModeValue(
    "linear(to-l, blue.600, blue.500)",
    "linear(to-l, blue.700, blue.600)",
  );
  const lessonCols = useBreakpointValue({ base: 1, md: 2, lg: 3 });

  const {
    data: lessons = [],
    isLoading: loading,
    refetch: refetchLessons,
  } = useTeacherLibraryLessons();

  const fetchLessons = useCallback(async () => {
    await invalidateQb.invalidateLibraryLessons();
    return refetchLessons();
  }, [invalidateQb, refetchLessons]);

  const [lessonTitle, setLessonTitle] = useState("");
  const [editingLesson, setEditingLesson] = useState(null);
  const [deletingLesson, setDeletingLesson] = useState(null);
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [isDeletingLesson, setIsDeletingLesson] = useState(false);

  const { isOpen: isLessonModalOpen, onOpen: onLessonModalOpen, onClose: onLessonModalClose } =
    useDisclosure();
  const { isOpen: isDeleteLessonOpen, onOpen: onDeleteLessonOpen, onClose: onDeleteLessonClose } =
    useDisclosure();

  const totalQuestions = useMemo(
    () => lessons.reduce((sum, l) => sum + (l.questions_count || 0), 0),
    [lessons],
  );

  const openLesson = (lesson) => {
    navigate(`/QuestionLibraryPage/lesson/${lesson.id}`);
  };

  const openCreateLesson = () => {
    setEditingLesson(null);
    setLessonTitle("");
    onLessonModalOpen();
  };

  const openEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setLessonTitle(lesson.title);
    onLessonModalOpen();
  };

  const saveLesson = async () => {
    if (!lessonTitle.trim()) return;
    setIsSavingLesson(true);
    try {
      if (editingLesson) {
        await baseUrl.put(
          `${API}/lesson/${editingLesson.id}`,
          { title: lessonTitle.trim() },
          { headers: authHeaders() },
        );
        toast({
          title: "تم التحديث",
          description: "تم تعديل الدرس",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } else {
        await baseUrl.post(
          `${API}/lesson`,
          { title: lessonTitle.trim() },
          { headers: authHeaders() },
        );
        toast({
          title: "تم الإنشاء",
          description: "تم إنشاء الدرس",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
      onLessonModalClose();
      fetchLessons();
    } catch (err) {
      toast({
        title: "خطأ",
        description: err.response?.data?.message || "فشل في حفظ الدرس",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSavingLesson(false);
    }
  };

  const confirmDeleteLesson = (lesson) => {
    setDeletingLesson(lesson);
    onDeleteLessonOpen();
  };

  const deleteLesson = async () => {
    if (!deletingLesson) return;
    setIsDeletingLesson(true);
    try {
      await baseUrl.delete(`${API}/lesson/${deletingLesson.id}`, {
        headers: authHeaders(),
      });
      toast({
        title: "تم الحذف",
        description: "تم حذف الدرس وجميع محتوياته",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      onDeleteLessonClose();
      fetchLessons();
    } catch {
      toast({
        title: "خطأ",
        description: "فشل في حذف الدرس",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeletingLesson(false);
    }
  };

  return (
    <Box minH="100vh" bg={pageBg} pt={{ base: "72px", md: "88px" }} pb={10} dir="rtl">
      <Container maxW="container.xl">
        <VStack spacing={5} align="stretch">
          <Box borderRadius="xl" overflow="hidden" bgGradient={heroBg} color="white" boxShadow="sm">
            <Flex
              p={{ base: 4, md: 6 }}
              align={{ base: "start", md: "center" }}
              justify="space-between"
              gap={4}
              flexWrap="wrap"
            >
              <HStack spacing={3} align="start" flex={1} minW={0}>
                <Flex
                  boxSize={11}
                  borderRadius="lg"
                  bg="whiteAlpha.200"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Icon as={FaBookOpen} boxSize={5} />
                </Flex>
                <Box minW={0}>
                  <Heading size={{ base: "md", md: "lg" }} fontWeight="semibold" lineHeight="1.3">
                    مكتبة الأسئلة
                  </Heading>
                  <Text color="whiteAlpha.900" fontSize="sm" mt={1} lineHeight="1.6">
                    مكتبتك الخاصة — دروس وأسئلة وقطع قراءة
                  </Text>
                </Box>
              </HStack>
              <Button
                leftIcon={<FaSync />}
                size="sm"
                bg="whiteAlpha.200"
                color="white"
                borderRadius="lg"
                _hover={{ bg: "whiteAlpha.300" }}
                onClick={() => fetchLessons()}
              >
                تحديث
              </Button>
            </Flex>
          </Box>

          <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
            <KpiCard label="الدروس" value={lessons.length} icon={FaGraduationCap} accent="blue" />
            <KpiCard
              label="إجمالي الأسئلة"
              value={totalQuestions}
              icon={FaQuestionCircle}
              accent="orange"
            />
            <KpiCard
              label="متوسط الأسئلة"
              value={lessons.length ? Math.round(totalQuestions / lessons.length) : 0}
              sub="لكل درس"
              icon={FaFileAlt}
              accent="green"
            />
          </SimpleGrid>

          <Flex justify="space-between" align="center" gap={3} flexWrap="wrap">
            <Heading size="sm" color={textColor} fontWeight="semibold">
              دروس المكتبة
            </Heading>
            <Button
              leftIcon={<FaPlus />}
              size="sm"
              colorScheme="blue"
              borderRadius="lg"
              onClick={openCreateLesson}
            >
              درس جديد
            </Button>
          </Flex>

          {loading ? (
            <Center py={16}>
              <Spinner size="lg" color="blue.500" thickness="3px" />
            </Center>
          ) : lessons.length === 0 ? (
            <Center py={16} bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
              <VStack spacing={3}>
                <Text color={muted}>لا توجد دروس بعد</Text>
                <Button size="sm" colorScheme="blue" leftIcon={<FaPlus />} onClick={openCreateLesson}>
                  إنشاء أول درس
                </Button>
              </VStack>
            </Center>
          ) : (
            <SimpleGrid columns={lessonCols} spacing={4}>
              {lessons.map((lesson) => (
                <Box
                  key={lesson.id}
                  p={4}
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="xl"
                  boxShadow="sm"
                  _hover={{ borderColor: "blue.200" }}
                  transition="border-color 0.15s"
                >
                  <Flex justify="space-between" align="start" gap={2} mb={3}>
                    <Box minW={0} flex={1}>
                      <Text fontWeight="semibold" color={textColor} noOfLines={2} fontSize="sm">
                        {lesson.title}
                      </Text>
                      <HStack spacing={2} mt={2}>
                        <Badge colorScheme="blue" borderRadius="md" fontSize="xs">
                          {lesson.questions_count || 0} سؤال
                        </Badge>
                        <Text fontSize="xs" color={muted}>
                          {new Date(lesson.created_at).toLocaleDateString("ar-EG")}
                        </Text>
                      </HStack>
                    </Box>
                    <HStack spacing={0}>
                      <IconButton
                        aria-label="تعديل"
                        icon={<FaEdit />}
                        size="xs"
                        variant="ghost"
                        colorScheme="blue"
                        onClick={() => openEditLesson(lesson)}
                      />
                      <IconButton
                        aria-label="حذف"
                        icon={<FaTrash />}
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => confirmDeleteLesson(lesson)}
                      />
                    </HStack>
                  </Flex>
                  <Button
                    w="full"
                    size="sm"
                    variant="outline"
                    colorScheme="blue"
                    borderRadius="lg"
                    onClick={() => openLesson(lesson)}
                  >
                    فتح الدرس
                  </Button>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </Container>

      <Modal isOpen={isLessonModalOpen} onClose={onLessonModalClose} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader fontSize="md">{editingLesson ? "تعديل الدرس" : "درس جديد"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isRequired>
              <FormLabel fontSize="sm">عنوان الدرس</FormLabel>
              <Input
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="مثال: الدرس الأول — الكهرباء"
                dir="rtl"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={2} onClick={onLessonModalClose}>
              إلغاء
            </Button>
            <Button
              colorScheme="blue"
              onClick={saveLesson}
              isLoading={isSavingLesson}
              isDisabled={!lessonTitle.trim()}
            >
              حفظ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isDeleteLessonOpen}
        onClose={onDeleteLessonClose}
        leastDestructiveRef={cancelRef}
      >
        <AlertDialogOverlay />
        <AlertDialogContent borderRadius="xl">
          <AlertDialogHeader fontSize="md">حذف الدرس</AlertDialogHeader>
          <AlertDialogBody fontSize="sm">
            حذف «{deletingLesson?.title}» سيحذف كل الأسئلة وقطع القراءة التابعة له. لا يمكن التراجع.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onDeleteLessonClose}>
              إلغاء
            </Button>
            <Button
              colorScheme="red"
              ml={3}
              onClick={deleteLesson}
              isLoading={isDeletingLesson}
            >
              حذف
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  );
};

export default QuestionLibraryPage;
