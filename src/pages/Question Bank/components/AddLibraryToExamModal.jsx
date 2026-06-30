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
  RadioGroup,
  Radio,
  useColorModeValue,
} from "@chakra-ui/react";

/**
 * اختيار امتحان محاضرة أو امتحان كورس لإضافة أسئلة من مكتبة المدرس.
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
  selectedExamId,
  onSelectExamId,
  onConfirm,
  isLoading = false,
  examsLoading = false,
  showCourseTab = true,
}) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const panelShadow = useColorModeValue("sm", "dark-lg");

  const lectureList = lectureExams;
  const courseList = courseExams;
  const activeList = examTab === "lecture" ? lectureList : courseList;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
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
                  امتحان محاضرة
                </Tab>
                <Tab fontSize="sm" fontWeight="600">
                  امتحان كورس
                </Tab>
              </TabList>
            </Tabs>
          ) : null}

          {examsLoading ? (
            <Flex justify="center" p={8}>
              <Spinner color="blue.500" />
            </Flex>
          ) : activeList.length === 0 ? (
            <Text textAlign="center" color="gray.500" py={8}>
              {examTab === "lecture" ? "لا توجد امتحانات محاضرة." : "لا توجد امتحانات كورس."}
            </Text>
          ) : (
            <RadioGroup value={selectedExamId} onChange={onSelectExamId}>
              <VStack align="stretch" spacing={3} maxH="360px" overflowY="auto" pr={1}>
                {activeList.map((exam) => (
                  <Box
                    key={exam.id}
                    p={4}
                    bg={selectedExamId === String(exam.id) ? "blue.50" : "gray.50"}
                    borderRadius="xl"
                    borderWidth="2px"
                    borderColor={selectedExamId === String(exam.id) ? "blue.500" : "transparent"}
                    cursor="pointer"
                    onClick={() => onSelectExamId(String(exam.id))}
                    _hover={{ bg: "blue.50" }}
                  >
                    <Radio value={String(exam.id)} mb={2}>
                      <Text fontWeight="bold" fontSize="md">
                        {exam.title}
                      </Text>
                    </Radio>
                    <HStack fontSize="sm" color="gray.500" spacing={4} pl={6}>
                      {(exam.courseTitle || exam.course_title) && (
                        <Text>{exam.courseTitle || exam.course_title}</Text>
                      )}
                      {(exam.lectureTitle || exam.lecture_title) && (
                        <>
                          <Text>•</Text>
                          <Text>{exam.lectureTitle || exam.lecture_title}</Text>
                        </>
                      )}
                      {exam.duration_minutes != null && (
                        <>
                          <Text>•</Text>
                          <Text>{exam.duration_minutes} د</Text>
                        </>
                      )}
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </RadioGroup>
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
            isDisabled={!selectedExamId || examsLoading}
            fontWeight="bold"
          >
            {confirmLabel || "إضافة"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
