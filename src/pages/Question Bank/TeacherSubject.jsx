import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Tab,
  TabList,
  Tabs,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import {
  MdBook,
  MdChevronLeft,
  MdFolderOpen,
  MdLibraryBooks,
  MdMenuBook,
  MdRefresh,
  MdSchool,
  MdSearch,
} from "react-icons/md";
import ScrollToTop from "../../components/scollToTop/ScrollToTop";
import { useTeacherQbSubjects } from "../../Hooks/teacher/useTeacherQuestionBankQueries";
import {
  countSubjectBooks,
  countSubjectChapters,
  countSubjectLessons,
  getSubjectBooks,
  sortByOrder,
  subjectMatchesSearch,
} from "../../utils/questionBankTree";

function StatPill({ label, value, icon }) {
  const bg = useColorModeValue("whiteAlpha.250", "whiteAlpha.150");
  return (
    <HStack spacing={2} px={3} py={2} borderRadius="lg" bg={bg} minW={0}>
      <Icon as={icon} boxSize={4} opacity={0.9} flexShrink={0} />
      <Box minW={0}>
        <Text fontSize="lg" fontWeight="bold" lineHeight="1">
          {value}
        </Text>
        <Text fontSize="xs" opacity={0.85} noOfLines={1}>
          {label}
        </Text>
      </Box>
    </HStack>
  );
}

function SubjectListItem({ subject, isActive, onSelect, muted, activeBg, activeBorder }) {
  const idleBg = useColorModeValue("transparent", "transparent");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const textColor = useColorModeValue("gray.800", "white");
  const lessons = countSubjectLessons(subject);
  const chapters = countSubjectChapters(subject);
  const books = countSubjectBooks(subject);

  return (
    <Box
      as="button"
      type="button"
      w="full"
      textAlign="right"
      p={3}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={isActive ? activeBorder : "transparent"}
      bg={isActive ? activeBg : idleBg}
      transition="all 0.15s"
      _hover={{ bg: isActive ? activeBg : hoverBg }}
      onClick={() => onSelect(subject.id)}
    >
      <HStack align="start" spacing={3}>
        <Flex
          w={10}
          h={10}
          borderRadius="lg"
          bg={isActive ? "blue.500" : useColorModeValue("blue.50", "blue.900")}
          color={isActive ? "white" : "blue.500"}
          align="center"
          justify="center"
          fontWeight="bold"
          fontSize="sm"
          flexShrink={0}
        >
          {subject.name?.charAt(0) || "؟"}
        </Flex>
        <Box flex={1} minW={0}>
          <Text
            fontWeight="semibold"
            fontSize="sm"
            color={isActive ? "blue.600" : textColor}
            noOfLines={1}
            _dark={{ color: isActive ? "blue.300" : "white" }}
          >
            {subject.name}
          </Text>
          <Text fontSize="xs" color={muted} noOfLines={1} mt={0.5}>
            {subject.grade_name || "—"}
          </Text>
          <HStack spacing={2} mt={2} flexWrap="wrap">
            <Badge variant="subtle" colorScheme="blue" fontSize="10px">
              {books} كتاب
            </Badge>
            <Badge variant="subtle" colorScheme="orange" fontSize="10px">
              {chapters} فصل
            </Badge>
            <Badge variant="subtle" colorScheme="green" fontSize="10px">
              {lessons} درس
            </Badge>
          </HStack>
        </Box>
      </HStack>
    </Box>
  );
}

function ChapterListItem({ chapter, isActive, onSelect, muted, activeBg }) {
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const textColor = useColorModeValue("gray.800", "white");
  const lessonCount = chapter.lessons?.length || 0;

  return (
    <Box
      as="button"
      type="button"
      w="full"
      textAlign="right"
      px={3}
      py={2.5}
      borderRadius="lg"
      bg={isActive ? activeBg : "transparent"}
      borderRightWidth={isActive ? "3px" : "3px"}
      borderRightColor={isActive ? "blue.500" : "transparent"}
      transition="all 0.15s"
      _hover={{ bg: isActive ? activeBg : hoverBg }}
      onClick={() => onSelect(chapter.id)}
    >
      <Flex justify="space-between" align="center" gap={2}>
        <Box minW={0} flex={1}>
          <Text fontSize="sm" fontWeight={isActive ? "semibold" : "medium"} color={textColor} noOfLines={2}>
            {chapter.name}
          </Text>
          {chapter.description ? (
            <Text fontSize="xs" color={muted} noOfLines={1} mt={0.5}>
              {chapter.description}
            </Text>
          ) : null}
        </Box>
        <Badge
          colorScheme={lessonCount > 0 ? "green" : "gray"}
          variant="subtle"
          borderRadius="full"
          fontSize="10px"
          flexShrink={0}
        >
          {lessonCount}
        </Badge>
      </Flex>
    </Box>
  );
}

function LessonRow({ lesson, borderColor, cardBg, muted, textColor }) {
  const inactive = lesson.is_active === false;

  return (
    <Flex
      as={Link}
      to={`/lesson/${lesson.id}`}
      align="center"
      gap={3}
      p={3}
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      _hover={{
        borderColor: "blue.300",
        shadow: "sm",
        textDecoration: "none",
        transform: "translateY(-1px)",
      }}
      transition="all 0.15s"
      opacity={inactive ? 0.65 : 1}
    >
      <Flex
        w={9}
        h={9}
        borderRadius="md"
        bg={useColorModeValue("orange.50", "orange.900")}
        color="orange.500"
        align="center"
        justify="center"
        flexShrink={0}
      >
        <Icon as={MdMenuBook} boxSize={4} />
      </Flex>
      <Box flex={1} minW={0}>
        <Text fontWeight="semibold" fontSize="sm" color={textColor} noOfLines={1}>
          {lesson.name}
        </Text>
        <Text fontSize="xs" color={muted} noOfLines={1} mt={0.5}>
          {lesson.description || "اضغط لفتح الدرس وإدارة الأسئلة"}
        </Text>
      </Box>
      <Icon as={MdChevronLeft} color={muted} boxSize={5} flexShrink={0} />
    </Flex>
  );
}

function EmptyBlock({ icon, title, subtitle }) {
  const muted = useColorModeValue("gray.500", "gray.400");
  const iconBg = useColorModeValue("gray.100", "gray.700");
  return (
    <VStack py={12} px={4} spacing={3} textAlign="center">
      <Flex w={14} h={14} borderRadius="full" bg={iconBg} align="center" justify="center">
        <Icon as={icon} boxSize={6} color={muted} />
      </Flex>
      <Text fontWeight="semibold" color={useColorModeValue("gray.700", "white")}>
        {title}
      </Text>
      {subtitle ? (
        <Text fontSize="sm" color={muted} maxW="sm">
          {subtitle}
        </Text>
      ) : null}
    </VStack>
  );
}

export default function TeacherSubject() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [activeBookId, setActiveBookId] = useState(null);
  const [activeChapterId, setActiveChapterId] = useState(null);

  const {
    data: subjects = [],
    isLoading: loading,
    isFetching: _isFetching,
    error: subjectsError,
    refetch: fetchTeacherSubjects,
  } = useTeacherQbSubjects();

  const error =
    subjectsError?.response?.data?.message ||
    subjectsError?.message ||
    null;

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const textColor = useColorModeValue("gray.800", "white");
  const activeBg = useColorModeValue("blue.50", "whiteAlpha.100");
  const activeBorder = useColorModeValue("blue.200", "blue.600");
  const heroGradient = useColorModeValue(
    "linear(to-br, blue.600, blue.500)",
    "linear(to-br, blue.700, blue.600)",
  );
  const panelShadow = useColorModeValue("sm", "dark-lg");

  const filteredSubjects = useMemo(
    () => subjects.filter((s) => subjectMatchesSearch(s, searchTerm.trim())),
    [subjects, searchTerm],
  );

  const totals = useMemo(
    () => ({
      subjects: subjects.length,
      books: subjects.reduce((n, s) => n + countSubjectBooks(s), 0),
      chapters: subjects.reduce((n, s) => n + countSubjectChapters(s), 0),
      lessons: subjects.reduce((n, s) => n + countSubjectLessons(s), 0),
    }),
    [subjects],
  );

  const activeSubject = useMemo(
    () => filteredSubjects.find((s) => s.id === activeSubjectId) || filteredSubjects[0] || null,
    [filteredSubjects, activeSubjectId],
  );

  const activeBooks = useMemo(
    () => (activeSubject ? getSubjectBooks(activeSubject) : []),
    [activeSubject],
  );

  const activeBook = useMemo(
    () => activeBooks.find((b) => b.id === activeBookId) || activeBooks[0] || null,
    [activeBooks, activeBookId],
  );

  const activeChapter = useMemo(() => {
    const chapters = activeBook?.chapters || [];
    return chapters.find((c) => c.id === activeChapterId) || chapters[0] || null;
  }, [activeBook, activeChapterId]);

  const activeLessons = useMemo(
    () => sortByOrder(activeChapter?.lessons || []),
    [activeChapter],
  );

  useEffect(() => {
    if (!filteredSubjects.length) {
      setActiveSubjectId(null);
      setActiveBookId(null);
      setActiveChapterId(null);
      return;
    }
    const exists = filteredSubjects.some((s) => s.id === activeSubjectId);
    if (!exists) {
      const first = filteredSubjects[0];
      setActiveSubjectId(first.id);
      const books = getSubjectBooks(first);
      setActiveBookId(books[0]?.id ?? null);
      setActiveChapterId(books[0]?.chapters?.[0]?.id ?? null);
    }
  }, [filteredSubjects, activeSubjectId]);

  useEffect(() => {
    if (!activeSubject) return;
    const books = getSubjectBooks(activeSubject);
    const bookExists = books.some((b) => b.id === activeBookId);
    if (!bookExists) {
      setActiveBookId(books[0]?.id ?? null);
      setActiveChapterId(books[0]?.chapters?.[0]?.id ?? null);
    }
  }, [activeSubject, activeBookId]);

  useEffect(() => {
    if (!activeBook) return;
    const chapters = activeBook.chapters || [];
    const chapterExists = chapters.some((c) => c.id === activeChapterId);
    if (!chapterExists) {
      setActiveChapterId(chapters[0]?.id ?? null);
    }
  }, [activeBook, activeChapterId]);

  const selectSubject = (id) => {
    const subject = filteredSubjects.find((s) => s.id === id);
    if (!subject) return;
    const books = getSubjectBooks(subject);
    setActiveSubjectId(id);
    setActiveBookId(books[0]?.id ?? null);
    setActiveChapterId(books[0]?.chapters?.[0]?.id ?? null);
  };

  const selectBook = (bookId) => {
    const book = activeBooks.find((b) => b.id === bookId);
    setActiveBookId(bookId);
    setActiveChapterId(book?.chapters?.[0]?.id ?? null);
  };

  if (loading) {
    return (
      <Flex minH="60vh" align="center" justify="center" bg={pageBg}>
        <Spinner size="lg" color="blue.500" thickness="3px" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex minH="60vh" align="center" justify="center" bg={pageBg} px={4}>
        <VStack spacing={4} bg={cardBg} p={8} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} maxW="md">
          <Text color="red.500" fontWeight="semibold">
            {error}
          </Text>
          <Button leftIcon={<MdRefresh />} colorScheme="blue" onClick={fetchTeacherSubjects} borderRadius="xl">
            إعادة المحاولة
          </Button>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg={pageBg} dir="rtl" pb={8}>
      {/* Hero */}
      <Box bgGradient={heroGradient} color="white" px={{ base: 4, md: 6 }} py={{ base: 5, md: 6 }}>
        <Box maxW="1400px" mx="auto">
          <Flex
            direction={{ base: "column", lg: "row" }}
            align={{ base: "stretch", lg: "center" }}
            justify="space-between"
            gap={4}
          >
            <HStack spacing={3} align="start">
              <Flex
                w={11}
                h={11}
                borderRadius="xl"
                bg="whiteAlpha.200"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <Icon as={MdLibraryBooks} boxSize={5} />
              </Flex>
              <Box>
                <Heading size={{ base: "sm", md: "md" }} fontWeight="bold">
                  بنك الأسئلة — موادي
                </Heading>
                <Text fontSize="sm" opacity={0.9} mt={0.5}>
                  تصفّح الكتب والفصول والدروس لكل مادة دراسية
                </Text>
              </Box>
            </HStack>

            <Grid
              templateColumns={{ base: "repeat(2, 1fr)", sm: "repeat(4, auto)" }}
              gap={2}
              w={{ base: "full", lg: "auto" }}
            >
              <StatPill label="مواد" value={totals.subjects} icon={MdSchool} />
              <StatPill label="كتب" value={totals.books} icon={MdBook} />
              <StatPill label="فصول" value={totals.chapters} icon={MdFolderOpen} />
              <StatPill label="دروس" value={totals.lessons} icon={MdMenuBook} />
            </Grid>
          </Flex>

          <InputGroup mt={5} size="md" maxW={{ base: "full", lg: "420px" }}>
            <InputLeftElement pointerEvents="none" h="full">
              <Icon as={MdSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              bg="white"
              color="gray.800"
              border="none"
              borderRadius="xl"
              placeholder="بحث في المواد، الكتب، الفصول، الدروس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              _placeholder={{ color: "gray.400" }}
            />
          </InputGroup>
        </Box>
      </Box>

      <Box maxW="1400px" mx="auto" px={{ base: 3, md: 5 }} mt={5}>
        {filteredSubjects.length === 0 ? (
          <Box bg={cardBg} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} shadow={panelShadow}>
            <EmptyBlock
              icon={MdLibraryBooks}
              title={searchTerm ? "لا توجد نتائج" : "لا توجد مواد مُسنَدة"}
              subtitle={
                searchTerm
                  ? `لم نجد مطابقة لـ "${searchTerm}"`
                  : "تواصل مع الإدارة لإسناد مواد دراسية لحسابك"
              }
            />
            {searchTerm ? (
              <Flex justify="center" pb={6}>
                <Button variant="outline" borderRadius="xl" onClick={() => setSearchTerm("")}>
                  مسح البحث
                </Button>
              </Flex>
            ) : null}
          </Box>
        ) : (
          <Grid templateColumns={{ base: "1fr", xl: "300px 1fr" }} gap={4} alignItems="start">
            {/* قائمة المواد */}
            <Box
              bg={cardBg}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor={borderColor}
              shadow={panelShadow}
              overflow="hidden"
              position={{ xl: "sticky" }}
              top={{ xl: "88px" }}
            >
              <Flex px={4} py={3} borderBottomWidth="1px" borderColor={borderColor} align="center" justify="space-between">
                <Text fontWeight="semibold" fontSize="sm">
                  المواد ({filteredSubjects.length})
                </Text>
                <Button
                  size="xs"
                  variant="ghost"
                  leftIcon={<MdRefresh />}
                  onClick={fetchTeacherSubjects}
                  borderRadius="lg"
                >
                  تحديث
                </Button>
              </Flex>
              <VStack align="stretch" spacing={1} p={2} maxH={{ base: "280px", xl: "calc(100vh - 220px)" }} overflowY="auto">
                {filteredSubjects.map((subject) => (
                  <SubjectListItem
                    key={subject.id}
                    subject={subject}
                    isActive={activeSubject?.id === subject.id}
                    onSelect={selectSubject}
                    muted={muted}
                    activeBg={activeBg}
                    activeBorder={activeBorder}
                  />
                ))}
              </VStack>
            </Box>

            {/* محتوى المادة */}
            {activeSubject ? (
              <Box
                bg={cardBg}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor={borderColor}
                shadow={panelShadow}
                overflow="hidden"
                minH={{ base: "auto", xl: "calc(100vh - 180px)" }}
                display="flex"
                flexDirection="column"
              >
                {/* ترويسة المادة */}
                <Box px={{ base: 4, md: 5 }} py={4} borderBottomWidth="1px" borderColor={borderColor}>
                  <Flex
                    direction={{ base: "column", sm: "row" }}
                    justify="space-between"
                    align={{ base: "stretch", sm: "center" }}
                    gap={3}
                  >
                    <Box minW={0}>
                      <HStack spacing={2} flexWrap="wrap" mb={1}>
                        <Heading size="sm" noOfLines={1}>
                          {activeSubject.name}
                        </Heading>
                        {activeSubject.is_active === false ? (
                          <Badge colorScheme="red" variant="subtle">
                            غير نشطة
                          </Badge>
                        ) : (
                          <Badge colorScheme="green" variant="subtle">
                            نشطة
                          </Badge>
                        )}
                      </HStack>
                      <HStack spacing={2} flexWrap="wrap" fontSize="xs" color={muted}>
                        {activeSubject.grade_name ? (
                          <HStack spacing={1}>
                            <Icon as={MdSchool} boxSize={3.5} />
                            <Text>{activeSubject.grade_name}</Text>
                          </HStack>
                        ) : null}
                        {activeSubject.question_bank_name ? (
                          <>
                            <Text>•</Text>
                            <HStack spacing={1}>
                              <Icon as={MdLibraryBooks} boxSize={3.5} />
                              <Text>{activeSubject.question_bank_name}</Text>
                            </HStack>
                          </>
                        ) : null}
                      </HStack>
                      {activeSubject.description ? (
                        <Text fontSize="sm" color={muted} mt={2} lineHeight="1.7">
                          {activeSubject.description}
                        </Text>
                      ) : null}
                    </Box>
                    <Button
                      as={Link}
                      to={`/question-bank/subject/${activeSubject.id}`}
                      size="sm"
                      colorScheme="blue"
                      borderRadius="xl"
                      flexShrink={0}
                      rightIcon={<MdChevronLeft />}
                    >
                      إدارة المادة
                    </Button>
                  </Flex>
                </Box>

                {activeBooks.length === 0 ? (
                  <EmptyBlock
                    icon={MdBook}
                    title="لا يوجد محتوى"
                    subtitle="لم تُضف كتب أو فصول لهذه المادة بعد"
                  />
                ) : (
                  <>
                    {/* الكتب */}
                    {activeBooks.length > 1 ? (
                      <Box px={{ base: 3, md: 5 }} pt={4} borderBottomWidth="1px" borderColor={borderColor}>
                        <Tabs
                          index={Math.max(
                            0,
                            activeBooks.findIndex((b) => b.id === activeBook?.id),
                          )}
                          onChange={(i) => selectBook(activeBooks[i]?.id)}
                          variant="soft-rounded"
                          colorScheme="blue"
                          size="sm"
                        >
                          <TabList flexWrap="wrap" gap={1} pb={3}>
                            {activeBooks.map((book) => (
                              <Tab key={book.id} borderRadius="lg" fontSize="sm" px={4}>
                                {book.name}
                              </Tab>
                            ))}
                          </TabList>
                        </Tabs>
                      </Box>
                    ) : (
                      <Box px={{ base: 4, md: 5 }} pt={4} pb={2}>
                        <HStack spacing={2} color={muted} fontSize="sm">
                          <Icon as={MdBook} />
                          <Text fontWeight="medium" color={textColor}>
                            {activeBooks[0]?.name}
                          </Text>
                          {activeBooks[0]?.description ? (
                            <Text fontSize="xs" color={muted} noOfLines={1}>
                              — {activeBooks[0].description}
                            </Text>
                          ) : null}
                        </HStack>
                      </Box>
                    )}

                    <Grid
                      templateColumns={{ base: "1fr", lg: "240px 1fr" }}
                      flex={1}
                      minH={0}
                    >
                      {/* الفصول */}
                      <Box
                        borderLeftWidth={{ lg: "1px" }}
                        borderColor={borderColor}
                        p={3}
                        maxH={{ base: "none", lg: "100%" }}
                        overflowY={{ lg: "auto" }}
                      >
                        <Text fontSize="xs" fontWeight="semibold" color={muted} mb={2} px={1}>
                          الفصول
                        </Text>
                        {(activeBook?.chapters || []).length === 0 ? (
                          <Text fontSize="sm" color={muted} px={2} py={4}>
                            لا توجد فصول في هذا الكتاب
                          </Text>
                        ) : (
                          <VStack align="stretch" spacing={0.5}>
                            {(activeBook?.chapters || []).map((chapter) => (
                              <ChapterListItem
                                key={chapter.id}
                                chapter={chapter}
                                isActive={activeChapter?.id === chapter.id}
                                onSelect={setActiveChapterId}
                                muted={muted}
                                activeBg={activeBg}
                              />
                            ))}
                          </VStack>
                        )}
                      </Box>

                      {/* الدروس */}
                      <Box p={{ base: 3, md: 4 }} display="flex" flexDirection="column" minH={{ base: "280px", lg: "auto" }}>
                        {activeChapter ? (
                          <>
                            <Flex justify="space-between" align="center" mb={4} gap={2} flexWrap="wrap">
                              <Box minW={0}>
                                <Text fontWeight="semibold" fontSize="md" color={textColor}>
                                  {activeChapter.name}
                                </Text>
                                <Text fontSize="xs" color={muted} mt={0.5}>
                                  {activeLessons.length} درس في هذا الفصل
                                </Text>
                              </Box>
                            </Flex>

                            {activeLessons.length > 0 ? (
                              <VStack align="stretch" spacing={2} flex={1}>
                                {activeLessons.map((lesson) => (
                                  <LessonRow
                                    key={lesson.id}
                                    lesson={lesson}
                                    borderColor={borderColor}
                                    cardBg={pageBg}
                                    muted={muted}
                                    textColor={textColor}
                                  />
                                ))}
                              </VStack>
                            ) : (
                              <EmptyBlock
                                icon={MdMenuBook}
                                title="لا توجد دروس"
                                subtitle="أضف دروساً لهذا الفصل من صفحة إدارة المادة"
                              />
                            )}
                          </>
                        ) : (
                          <EmptyBlock
                            icon={MdFolderOpen}
                            title="اختر فصلاً"
                            subtitle="اختر فصلاً من القائمة لعرض دروسه"
                          />
                        )}
                      </Box>
                    </Grid>
                  </>
                )}
              </Box>
            ) : null}
          </Grid>
        )}
      </Box>

      <ScrollToTop />
    </Box>
  );
}
