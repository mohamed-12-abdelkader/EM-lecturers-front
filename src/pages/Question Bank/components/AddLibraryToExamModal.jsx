import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Box,
  Flex,
  Spinner,
  Tabs,
  TabList,
  Tab,
  Checkbox,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaSearch } from "react-icons/fa";

function examCourseId(exam) {
  return String(exam.courseId ?? exam.course_id ?? "");
}

function examCourseTitle(exam) {
  return (
    exam.courseTitle ||
    exam.course_title ||
    exam.courseName ||
    exam.course_name ||
    ""
  );
}

function examLectureTitle(exam) {
  return exam.lectureTitle || exam.lecture_title || exam.lectureName || exam.lecture_name || "";
}

function matchesExamSearch(exam, query) {
  if (!query) return true;
  const haystack = [
    exam.title,
    examCourseTitle(exam),
    examLectureTitle(exam),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

/**
 * اختيار واجب أو امتحان شامل لإضافة أسئلة من مكتبة المدرس (اختيار متعدد).
 */
export default function AddLibraryToExamModal({
  isOpen,
  onClose,
  title = "إضافة للامتحان",
  confirmLabel,
  lectureExams = [],
  courseExams = [],
  examTab,
  onExamTabChange,
  selectedExamIds = [],
  onToggleExamId,
  onConfirm,
  isLoading = false,
  examsLoading = false,
  showCourseTab = true,
}) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const panelShadow = useColorModeValue("sm", "dark-lg");
  const filterBg = useColorModeValue("gray.50", "gray.900");

  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("");

  const selectedSet = useMemo(
    () => new Set(Array.isArray(selectedExamIds) ? selectedExamIds.map(String) : []),
    [selectedExamIds],
  );

  const activeList = examTab === "lecture" ? lectureExams : courseExams;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const courseOptions = useMemo(() => {
    const map = new Map();
    for (const exam of activeList) {
      const id = examCourseId(exam);
      const label = examCourseTitle(exam);
      if (id && label && !map.has(id)) map.set(id, label);
      else if (!id && label && !map.has(label)) map.set(label, label);
    }
    return [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "ar"));
  }, [activeList]);

  const filteredList = useMemo(() => {
    return activeList.filter((exam) => {
      if (courseFilter) {
        const id = examCourseId(exam);
        const title = examCourseTitle(exam);
        if (id && id !== courseFilter && title !== courseFilter) return false;
        if (!id && title !== courseFilter) return false;
      }
      return matchesExamSearch(exam, normalizedQuery);
    });
  }, [activeList, courseFilter, normalizedQuery]);

  useEffect(() => {
    if (!isOpen) return;
    setSearchQuery("");
    setCourseFilter("");
  }, [isOpen, examTab]);

  const emptyMessage =
    examTab === "lecture"
      ? activeList.length === 0
        ? "لا توجد واجبات."
        : "لا توجد واجبات تطابق البحث أو الفلتر."
      : activeList.length === 0
        ? "لا توجد امتحانات شاملة."
        : "لا توجد امتحانات شاملة تطابق البحث أو الفلتر.";

  const selectedCount = selectedSet.size;
  const footerLabel =
    confirmLabel ||
    (selectedCount > 1 ? `إضافة إلى ${selectedCount} امتحانات` : "إضافة");

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(6px)" bg="blackAlpha.600" />
      <ModalContent borderRadius="2xl" boxShadow={panelShadow} borderWidth="1px" borderColor={borderColor}>
        <ModalHeader fontSize="md" fontWeight="bold">
          {title}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py={4}>
          {showCourseTab ? (
            <Tabs
              index={examTab === "lecture" ? 0 : 1}
              onChange={(i) => onExamTabChange(i === 0 ? "lecture" : "course")}
              variant="soft-rounded"
              colorScheme="blue"
              mb={4}
            >
              <TabList bg="gray.100" p={1} borderRadius="xl">
                <Tab fontSize="sm" fontWeight="600">
                  واجب
                </Tab>
                <Tab fontSize="sm" fontWeight="600">
                  امتحان شامل
                </Tab>
              </TabList>
            </Tabs>
          ) : null}

          {!examsLoading && activeList.length > 0 ? (
            <VStack align="stretch" spacing={3} mb={4} p={3} bg={filterBg} borderRadius="xl">
              <InputGroup size="sm">
                <InputLeftElement pointerEvents="none" color="gray.400">
                  <FaSearch />
                </InputLeftElement>
                <Input
                  placeholder={examTab === "lecture" ? "ابحث عن واجب..." : "ابحث عن امتحان..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  borderRadius="lg"
                  bg="white"
                />
              </InputGroup>
              {courseOptions.length > 1 ? (
                <Select
                  size="sm"
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  borderRadius="lg"
                  bg="white"
                >
                  <option value="">كل الكورسات</option>
                  {courseOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              ) : null}
              <Flex align="center" justify="space-between" flexWrap="wrap" gap={2}>
                <Text fontSize="xs" color="gray.500">
                  {filteredList.length} من {activeList.length}{" "}
                  {examTab === "lecture" ? "واجب" : "امتحان"}
                </Text>
                {selectedCount > 0 ? (
                  <Badge colorScheme="blue" borderRadius="full" px={2}>
                    {selectedCount} محدد
                  </Badge>
                ) : null}
              </Flex>
            </VStack>
          ) : null}

          {examsLoading ? (
            <Flex justify="center" p={8}>
              <Spinner color="blue.500" />
            </Flex>
          ) : filteredList.length === 0 ? (
            <Text textAlign="center" color="gray.500" py={8}>
              {emptyMessage}
            </Text>
          ) : (
            <VStack align="stretch" spacing={3} maxH="360px" overflowY="auto" pr={1}>
              {filteredList.map((exam) => {
                const examId = String(exam.id);
                const isSelected = selectedSet.has(examId);
                return (
                  <Box
                    key={exam.id}
                    p={4}
                    bg={isSelected ? "blue.50" : "gray.50"}
                    borderRadius="xl"
                    borderWidth="2px"
                    borderColor={isSelected ? "blue.500" : "transparent"}
                    cursor="pointer"
                    onClick={() => onToggleExamId(examId)}
                    _hover={{ bg: "blue.50" }}
                  >
                    <Checkbox
                      isChecked={isSelected}
                      onChange={() => onToggleExamId(examId)}
                      onClick={(e) => e.stopPropagation()}
                      colorScheme="blue"
                      mb={2}
                    >
                      <Text fontWeight="bold" fontSize="md">
                        {exam.title}
                      </Text>
                    </Checkbox>
                    <HStack fontSize="sm" color="gray.500" spacing={4} pl={6} flexWrap="wrap">
                      {examCourseTitle(exam) ? <Text>{examCourseTitle(exam)}</Text> : null}
                      {examLectureTitle(exam) ? (
                        <>
                          <Text>•</Text>
                          <Text>{examLectureTitle(exam)}</Text>
                        </>
                      ) : null}
                      {exam.duration_minutes != null ? (
                        <>
                          <Text>•</Text>
                          <Text>{exam.duration_minutes} د</Text>
                        </>
                      ) : null}
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
          )}
        </ModalBody>
        <ModalFooter borderTopWidth="1px" borderColor={borderColor}>
          <Button variant="ghost" mr={3} onClick={onClose}>
            إلغاء
          </Button>
          <Button
            colorScheme="blue"
            onClick={onConfirm}
            isLoading={isLoading}
            isDisabled={selectedCount === 0 || examsLoading}
            fontWeight="bold"
          >
            {footerLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
