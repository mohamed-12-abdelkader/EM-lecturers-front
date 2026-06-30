import React from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Badge,
  VStack,
  HStack,
} from "@chakra-ui/react";
import {
  FaCheckCircle,
  FaHourglassHalf,
  FaExclamationTriangle,
} from "react-icons/fa";

const CourseStatistics = () => {
  const studentsData = [
    {
      name: "أحمد علي",
      lecturesWatched: ["محاضرة 1", "محاضرة 2", "محاضرة 3"],
      pendingLectures: ["محاضرة 4", "محاضرة 5"],
      exams: [
        { name: "اختبار 1", score: 85 },
        { name: "اختبار 2", score: 90 },
      ],
      pendingExams: ["اختبار 3"],
      interactionLevel: "عالي",
    },
    {
      name: "منى حسن",
      lecturesWatched: ["محاضرة 1", "محاضرة 2"],
      pendingLectures: ["محاضرة 3"],
      exams: [{ name: "اختبار 1", score: 78 }],
      pendingExams: ["اختبار 2", "اختبار 3"],
      interactionLevel: "متوسط",
    },
    {
      name: "منى حسن",
      lecturesWatched: ["محاضرة 1", "محاضرة 2"],
      pendingLectures: ["محاضرة 3"],
      exams: [{ name: "اختبار 1", score: 78 }],
      pendingExams: ["اختبار 2", "اختبار 3"],
      interactionLevel: "متوسط",
    },
    {
      name: "منى حسن",
      lecturesWatched: ["محاضرة 1", "محاضرة 2"],
      pendingLectures: ["محاضرة 3"],
      exams: [{ name: "اختبار 1", score: 78 }],
      pendingExams: ["اختبار 2", "اختبار 3"],
      interactionLevel: "متوسط",
    },
    {
      name: "منى حسن",
      lecturesWatched: ["محاضرة 1", "محاضرة 2"],
      pendingLectures: ["محاضرة 3"],
      exams: [{ name: "اختبار 1", score: 78 }],
      pendingExams: ["اختبار 2", "اختبار 3"],
      interactionLevel: "متوسط",
    },
    {
      name: "منى حسن",
      lecturesWatched: ["محاضرة 1", "محاضرة 2"],
      pendingLectures: ["محاضرة 3"],
      exams: [{ name: "اختبار 1", score: 78 }],
      pendingExams: ["اختبار 2", "اختبار 3"],
      interactionLevel: "متوسط",
    },
    {
      name: "منى حسن",
      lecturesWatched: ["محاضرة 1", "محاضرة 2"],
      pendingLectures: ["محاضرة 3"],
      exams: [{ name: "اختبار 1", score: 78 }],
      pendingExams: ["اختبار 2", "اختبار 3"],
      interactionLevel: "متوسط",
    },
    {
      name: "منى حسن",
      lecturesWatched: ["محاضرة 1", "محاضرة 2"],
      pendingLectures: ["محاضرة 3"],
      exams: [{ name: "اختبار 1", score: 78 }],
      pendingExams: ["اختبار 2", "اختبار 3"],
      interactionLevel: "متوسط",
    },
  ];

  return (
    <Box
      p={5}
      bg='gray.50'
      borderRadius='lg'
      shadow='xl'
      className='mt-[100px]'
    >
      <Text fontSize='3xl' fontWeight='bold' mb={5} textAlign='center'>
        📊 إحصائيات الكورس
      </Text>
      <Table variant='striped' colorScheme='teal'>
        <Thead>
          <Tr bg='teal.600'>
            <Th color='white'>اسم الطالب</Th>
            <Th color='white'>المحاضرات المستمعة</Th>
            <Th color='white'>المحاضرات المتراكمة</Th>
            <Th color='white'>الامتحانات المحلولة</Th>
            <Th color='white'>الامتحانات المتراكمة</Th>
            <Th color='white'>مستوى التفاعل</Th>
          </Tr>
        </Thead>
        <Tbody>
          {studentsData.map((student, index) => (
            <Tr key={index} _hover={{ bg: "teal.100" }}>
              <Td fontWeight='bold'>{student.name}</Td>
              <Td>
                {student.lecturesWatched.map((lecture, i) => (
                  <HStack key={i}>
                    <FaCheckCircle color='green' />
                    <Text>{lecture}</Text>
                  </HStack>
                ))}
              </Td>
              <Td>
                {student.pendingLectures.length > 0 ? (
                  student.pendingLectures.map((lecture, i) => (
                    <HStack key={i}>
                      <FaHourglassHalf color='orange' />
                      <Text>{lecture}</Text>
                    </HStack>
                  ))
                ) : (
                  <Badge colorScheme='green'>لا يوجد</Badge>
                )}
              </Td>
              <Td>
                {student.exams.map((exam, i) => (
                  <Text key={i}>
                    {exam.name}: {exam.score}%
                  </Text>
                ))}
              </Td>
              <Td>
                {student.pendingExams.length > 0 ? (
                  student.pendingExams.map((exam, i) => (
                    <HStack key={i}>
                      <FaExclamationTriangle color='red' />
                      <Text>{exam}</Text>
                    </HStack>
                  ))
                ) : (
                  <Badge colorScheme='green'>لا يوجد</Badge>
                )}
              </Td>
              <Td>
                <Badge
                  colorScheme={
                    student.interactionLevel === "عالي"
                      ? "green"
                      : student.interactionLevel === "متوسط"
                      ? "yellow"
                      : "red"
                  }
                  fontSize='md'
                  px={3}
                  py={1}
                  borderRadius='md'
                >
                  {student.interactionLevel}
                </Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default CourseStatistics;
