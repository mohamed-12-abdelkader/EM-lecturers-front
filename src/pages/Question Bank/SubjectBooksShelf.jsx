import React from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Badge,
  Button,
  Icon,
  IconButton,
  VStack,
  HStack,
} from "@chakra-ui/react";
import {
  FaBookOpen,
  FaChevronDown,
  FaChevronUp,
  FaEdit,
  FaGraduationCap,
  FaPlus,
  FaQuestionCircle,
  FaTrash,
  FaArrowLeft,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const BOOK_THEMES = [
  { scheme: "blue", gradient: "linear(to-br, blue.400, blue.600)" },
  { scheme: "orange", gradient: "linear(to-br, orange.400, orange.600)" },
];

function LevelTag({ label, colorScheme = "blue" }) {
  return (
    <Badge
      colorScheme={colorScheme}
      variant="solid"
      fontSize="9px"
      px={2}
      py={0.5}
      borderRadius="md"
      textTransform="none"
      flexShrink={0}
    >
      {label}
    </Badge>
  );
}

export default function SubjectBooksShelf({
  filteredBooks,
  searchTerm,
  expandedBookId,
  toggleBook,
  getBookStats,
  getChapterStats,
  onAddBook,
  onBookEdit,
  onBookDelete,
  onChapterCreate,
  onChapterEdit,
  onChapterDelete,
}) {
  if (filteredBooks.length === 0) {
    return (
      <Box
        textAlign="center"
        py={{ base: 16, md: 20 }}
        px={6}
        bg="white"
        borderRadius="2xl"
        border="1px solid"
        borderColor="gray.100"
        boxShadow="0 16px 40px rgba(15,23,42,0.06)"
      >
        <Flex w="64px" h="64px" mx="auto" mb={4} borderRadius="xl" bg="blue.50" color="blue.500" align="center" justify="center">
          <FaBookOpen size={28} />
        </Flex>
        <Heading size="md" color="gray.900" mb={2} fontWeight="black">
          {searchTerm ? "لا توجد نتائج" : "لا توجد كتب بعد"}
        </Heading>
        <Text color="gray.500" fontSize="sm" mb={6} maxW="360px" mx="auto">
          {searchTerm ? "جرّب كلمة بحث مختلفة." : "أضف كتاباً للمادة ثم أنشئ فصوله ودروسه."}
        </Text>
        {!searchTerm && (
          <Button bg="blue.500" color="white" leftIcon={<FaPlus />} onClick={onAddBook} borderRadius="xl" h="42px" px={6} _hover={{ bg: "blue.600" }}>
            إضافة كتاب
          </Button>
        )}
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {filteredBooks.map((book, bookIndex) => {
        const bookStats = getBookStats(book);
        const isExpanded = expandedBookId === book.id;
        const chaptersList = book.chapters || [];
        const theme = BOOK_THEMES[bookIndex % BOOK_THEMES.length];

        return (
          <Box
            key={book.id}
            bg="white"
            borderRadius="2xl"
            overflow="hidden"
            border="2px solid"
            borderColor={isExpanded ? "blue.200" : "gray.100"}
            boxShadow={isExpanded ? "0 22px 55px rgba(37,99,235,0.10)" : "0 12px 32px rgba(15,23,42,0.05)"}
          >
            {/* ── مستوى الكتاب ── */}
            <Flex
              align="center"
              justify="space-between"
              gap={4}
              px={{ base: 4, md: 6 }}
              py={5}
              bg={isExpanded ? `${theme.scheme}.50` : "white"}
              borderBottom={isExpanded ? "2px solid" : "0"}
              borderColor={`${theme.scheme}.100`}
              cursor="pointer"
              onClick={() => toggleBook(book.id)}
            >
              <HStack spacing={4} minW={0} align="center" flex="1">
                <Flex
                  w={12}
                  h={12}
                  flexShrink={0}
                  borderRadius="xl"
                  bgGradient={theme.gradient}
                  align="center"
                  justify="center"
                  color="white"
                  fontWeight="black"
                  fontSize="lg"
                >
                  {bookIndex + 1}
                </Flex>
                <Box minW={0} flex="1">
                  <HStack spacing={2} mb={2} flexWrap="wrap" align="center">
                    <LevelTag label="كتاب" colorScheme={theme.scheme} />
                    <Heading size="sm" color="gray.900" fontWeight="black" noOfLines={2}>
                      {book.name}
                    </Heading>
                  </HStack>
                  <Text color="gray.500" fontSize="sm" mb={2} noOfLines={2}>
                    {book.description?.trim() || "بدون وصف"}
                  </Text>
                  <HStack spacing={2} flexWrap="wrap">
                    <Badge colorScheme="blue" variant="subtle" borderRadius="full" fontSize="xs">
                      {bookStats.chapters} فصل
                    </Badge>
                    <Badge colorScheme="orange" variant="subtle" borderRadius="full" fontSize="xs">
                      {bookStats.lessons} درس
                    </Badge>
                    <Text fontSize="xs" color="gray.400">ترتيب {book.order_num ?? 1}</Text>
                  </HStack>
                </Box>
              </HStack>

              <VStack spacing={1} flexShrink={0} onClick={(e) => e.stopPropagation()}>
                <IconButton
                  aria-label={isExpanded ? "طي الكتاب" : "عرض الفصول"}
                  icon={<Icon as={isExpanded ? FaChevronUp : FaChevronDown} />}
                  size="sm"
                  variant="outline"
                  borderColor="gray.200"
                  onClick={() => toggleBook(book.id)}
                />
                <HStack spacing={0}>
                  <IconButton aria-label="تعديل الكتاب" icon={<FaEdit />} size="sm" variant="ghost" color="orange.500" onClick={() => onBookEdit(book)} />
                  <IconButton aria-label="حذف الكتاب" icon={<FaTrash />} size="sm" variant="ghost" color="red.400" onClick={() => onBookDelete(book)} />
                </HStack>
              </VStack>
            </Flex>

            {isExpanded && (
              <Box px={{ base: 3, md: 5 }} py={5} bg="gray.50">
                <Flex justify="space-between" align="center" mb={5} gap={3} flexWrap="wrap">
                  <HStack spacing={2}>
                    <LevelTag label="فصول" colorScheme="blue" />
                    <Text fontSize="sm" fontWeight="bold" color="gray.700">
                      فصول «{book.name}» ({chaptersList.length})
                    </Text>
                  </HStack>
                  <Button size="sm" leftIcon={<FaPlus />} bg="blue.500" color="white" borderRadius="lg" onClick={() => onChapterCreate(book.id)} _hover={{ bg: "blue.600" }}>
                    إضافة فصل
                  </Button>
                </Flex>

                {chaptersList.length === 0 ? (
                  <Box py={10} textAlign="center" bg="white" borderRadius="xl" border="2px dashed" borderColor="gray.200">
                    <Text color="gray.500" fontSize="sm" mb={3}>لا توجد فصول في هذا الكتاب</Text>
                    <Button size="sm" variant="outline" colorScheme="blue" leftIcon={<FaPlus />} onClick={() => onChapterCreate(book.id)}>
                      إضافة أول فصل
                    </Button>
                  </Box>
                ) : (
                  <VStack spacing={5} align="stretch">
                    {chaptersList.map((chapter, chapterIndex) => {
                      const stats = getChapterStats(chapter);
                      const lessons = chapter.lessons || [];

                      return (
                        <Box
                          key={chapter.id}
                          bg="white"
                          borderRadius="xl"
                          border="1px solid"
                          borderColor="blue.100"
                          overflow="hidden"
                          boxShadow="0 4px 16px rgba(15,23,42,0.04)"
                        >
                          {/* ── رأس الفصل ── */}
                          <Box px={{ base: 4, md: 5 }} py={4} bg="blue.50" borderBottom="1px solid" borderColor="blue.100">
                            <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "stretch", sm: "start" }} gap={4}>
                              <HStack align="start" spacing={3} minW={0} flex="1">
                                <Flex
                                  w={9}
                                  h={9}
                                  flexShrink={0}
                                  borderRadius="lg"
                                  bg="blue.500"
                                  color="white"
                                  align="center"
                                  justify="center"
                                  fontWeight="black"
                                  fontSize="sm"
                                >
                                  {chapter.order_num ?? chapterIndex + 1}
                                </Flex>
                                <Box minW={0}>
                                  <HStack spacing={2} mb={1} flexWrap="wrap">
                                    <LevelTag label="فصل" colorScheme="blue" />
                                  </HStack>
                                  <Text color="gray.900" fontWeight="black" fontSize="md" mb={1}>
                                    {chapter.name}
                                  </Text>
                                  {chapter.description?.trim() && (
                                    <Text color="gray.600" fontSize="sm" mb={2}>
                                      {chapter.description}
                                    </Text>
                                  )}
                                  <HStack spacing={4} fontSize="xs" color="gray.500">
                                    <HStack spacing={1}>
                                      <Icon as={FaGraduationCap} color="orange.500" />
                                      <Text>{stats.lessonsCount} درس</Text>
                                    </HStack>
                                    {stats.questionsCount > 0 && (
                                      <HStack spacing={1}>
                                        <Icon as={FaQuestionCircle} color="blue.500" />
                                        <Text>{stats.questionsCount} سؤال</Text>
                                      </HStack>
                                    )}
                                  </HStack>
                                </Box>
                              </HStack>

                              <HStack spacing={2} flexShrink={0} justify={{ base: "flex-end", sm: "flex-start" }}>
                                <IconButton aria-label="تعديل الفصل" icon={<FaEdit />} size="sm" variant="outline" borderColor="orange.200" color="orange.500" onClick={() => onChapterEdit(chapter)} />
                                <IconButton aria-label="حذف الفصل" icon={<FaTrash />} size="sm" variant="outline" borderColor="red.100" color="red.400" onClick={() => onChapterDelete(chapter)} />
                                <Link to={`/chapter/${chapter.id}`} style={{ textDecoration: "none" }}>
                                  <Button size="sm" bg="blue.500" color="white" borderRadius="lg" leftIcon={<FaArrowLeft />} _hover={{ bg: "blue.600" }}>
                                    إدارة الدروس
                                  </Button>
                                </Link>
                              </HStack>
                            </Flex>
                          </Box>

                          {/* ── الدروس ── */}
                          {lessons.length > 0 ? (
                            <Box px={{ base: 4, md: 5 }} py={4} bg="white">
                              <HStack spacing={2} mb={3}>
                                <LevelTag label="دروس" colorScheme="orange" />
                                <Text fontSize="xs" fontWeight="bold" color="gray.500">
                                  {lessons.length} درس في هذا الفصل
                                </Text>
                              </HStack>
                              <VStack spacing={2} align="stretch">
                                {lessons.map((lesson, lessonIndex) => (
                                  <Link key={lesson.id} to={`/lesson/${lesson.id}`} style={{ textDecoration: "none", width: "100%" }}>
                                    <Flex
                                      align="center"
                                      justify="space-between"
                                      gap={3}
                                      px={4}
                                      py={3}
                                      bg="orange.50"
                                      borderRadius="lg"
                                      border="1px solid"
                                      borderColor="orange.100"
                                      _hover={{ bg: "orange.100", borderColor: "orange.300" }}
                                      transition="all 0.15s"
                                    >
                                      <HStack spacing={3} minW={0}>
                                        <Flex
                                          w={7}
                                          h={7}
                                          flexShrink={0}
                                          borderRadius="md"
                                          bg="white"
                                          border="1px solid"
                                          borderColor="orange.200"
                                          align="center"
                                          justify="center"
                                          fontSize="xs"
                                          fontWeight="black"
                                          color="orange.600"
                                        >
                                          {lesson.order_num ?? lessonIndex + 1}
                                        </Flex>
                                        <Box minW={0}>
                                          <Text fontSize="sm" fontWeight="bold" color="gray.800" noOfLines={1}>
                                            {lesson.name}
                                          </Text>
                                          {lesson.description?.trim() && (
                                            <Text fontSize="xs" color="gray.500" noOfLines={1} mt={0.5}>
                                              {lesson.description}
                                            </Text>
                                          )}
                                        </Box>
                                      </HStack>
                                      <Icon as={FaArrowLeft} color="orange.500" boxSize={3} flexShrink={0} />
                                    </Flex>
                                  </Link>
                                ))}
                              </VStack>
                            </Box>
                          ) : (
                            <Box px={{ base: 4, md: 5 }} py={3} bg="white">
                              <Text fontSize="xs" color="gray.400" textAlign="center">
                                لا توجد دروس في هذا الفصل — افتح «إدارة الدروس» لإضافتها
                              </Text>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </VStack>
                )}
              </Box>
            )}
          </Box>
        );
      })}
    </VStack>
  );
}
