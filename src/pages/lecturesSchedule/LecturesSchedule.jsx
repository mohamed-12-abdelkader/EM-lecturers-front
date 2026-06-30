import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  useColorModeValue,
  Icon,
  Button,
  VStack,
  HStack,
  Switch,
  FormControl,
  FormLabel,
  useToast, // لإظهار الإشعارات (Toasts)
  Tag,
  TagLabel,
  TagLeftIcon,
  Input,
  Select,
  // استيراد مكونات الجدول من Chakra UI
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@chakra-ui/react";
// استيراد الـ hooks الصحيحة من @tanstack/react-table
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  FaCalendarAlt,
  FaBell,
  FaCheckCircle,
  FaTimesCircle,
  FaPlayCircle,
  FaUserTie,
  FaBookOpen,
  FaClock,
  FaSearch,
  FaFilter,
} from "react-icons/fa";
import { MdOutlineDateRange } from "react-icons/md";
import { motion } from "framer-motion";

// Mock Data - بيانات المحاضرات (يمكن استبدالها ببيانات حقيقية من API)
const initialLectures = [
  {
    id: "lec-001",
    teacherName: "أ. محمود السيد",
    courseName: "اللغة العربية - المستوى الأول",
    date: "2025-06-15", // بعد 4 أيام
    time: "10:00 AM",
    isRecorded: false,
    reminded: false,
  },
  {
    id: "lec-002",
    teacherName: "د. ليلى أحمد",
    courseName: "الرياضيات المتقدمة",
    date: "2025-06-12", // غدًا
    time: "02:00 PM",
    isRecorded: false,
    reminded: false,
  },
  {
    id: "lec-003",
    teacherName: "أ. محمود السيد",
    courseName: "النحو والصرف",
    date: "2025-06-08", // تم تمريرها، مسجلة
    time: "09:00 AM",
    isRecorded: true,
    reminded: true,
  },
  {
    id: "lec-004",
    teacherName: "م. خالد علي",
    courseName: "مقدمة في البرمجة",
    date: "2025-06-20", // بعيدة
    time: "04:00 PM",
    isRecorded: false,
    reminded: false,
  },
  {
    id: "lec-005",
    teacherName: "د. سارة عادل",
    courseName: "الكيمياء العضوية",
    date: "2025-06-10", // اليوم، غير مسجلة
    time: "01:00 PM",
    isRecorded: false,
    reminded: false,
  },
  {
    id: "lec-006",
    teacherName: "د. ليلى أحمد",
    courseName: "الفيزياء الحديثة",
    date: "2025-06-10", // اليوم، مسجلة
    time: "11:00 AM",
    isRecorded: true,
    reminded: false,
  },
];

const MotionBox = motion(Box);

const LecturesSchedule = () => {
  const [lectures, setLectures] = useState(initialLectures);
  const [filterText, setFilterText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'recorded', 'not_recorded', 'upcoming', 'past'
  const toast = useToast();

  const headerBg = useColorModeValue("blue.600", "gray.800");
  const headerTextColor = useColorModeValue("white", "whiteAlpha.900");
  const cardBg = useColorModeValue("white", "gray.700");
  const cardBorderColor = useColorModeValue("gray.200", "gray.600");
  const recordedColor = useColorModeValue("green.500", "green.300");
  const notRecordedColor = useColorModeValue("red.500", "red.300");
  const pendingColor = useColorModeValue("orange.500", "orange.300");
  const tableHeaderBg = useColorModeValue("blue.50", "gray.700");
  const tableRowHoverBg = useColorModeValue("gray.50", "gray.600");
  const attentionBg = useColorModeValue("yellow.50", "yellow.900");
  const attentionBorder = useColorModeValue("yellow.200", "yellow.700");

  // Filtered and sorted data
  const data = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for comparison

    return lectures.filter((lecture) => {
      const matchText =
        lecture.teacherName.toLowerCase().includes(filterText.toLowerCase()) ||
        lecture.courseName.toLowerCase().includes(filterText.toLowerCase());

      if (!matchText) return false;

      const lectureDate = new Date(lecture.date);
      lectureDate.setHours(0, 0, 0, 0);

      switch (filterStatus) {
        case "recorded":
          return lecture.isRecorded;
        case "not_recorded":
          return !lecture.isRecorded;
        case "upcoming":
          return lectureDate > today;
        case "past":
          return lectureDate < today;
        default:
          return true; // 'all'
      }
    }).sort((a, b) => {
        // Sort by date (upcoming first)
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
            return dateA.getTime() - dateB.getTime();
        }
        // Then by time if dates are the same
        const timeA = new Date(`2000/01/01 ${a.time}`);
        const timeB = new Date(`2000/01/01 ${b.time}`);
        return timeA.getTime() - timeB.getTime();
    });
  }, [lectures, filterText, filterStatus]);

  // Define columns for react-table
  const columns = useMemo(
    () => [
      {
        header: "المدرس",
        accessorKey: "teacherName",
        cell: (info) => (
          <HStack>
            <Icon as={FaUserTie} color="blue.500" />
            <Text fontWeight="medium">{info.getValue()}</Text>
          </HStack>
        ),
      },
      {
        header: "اسم الكورس",
        accessorKey: "courseName",
        cell: (info) => (
          <HStack>
            <Icon as={FaBookOpen} color="purple.500" />
            <Text>{info.getValue()}</Text>
          </HStack>
        ),
      },
      {
        header: "التاريخ",
        accessorKey: "date",
        cell: (info) => (
          <HStack>
            <Icon as={MdOutlineDateRange} color="teal.500" />
            <Text>
              {new Date(info.getValue()).toLocaleDateString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </HStack>
        ),
      },
      {
        header: "الوقت",
        accessorKey: "time",
        cell: (info) => (
          <HStack>
            <Icon as={FaClock} color="orange.500" />
            <Text>{info.getValue()}</Text>
          </HStack>
        ),
      },
      {
        header: "حالة التسجيل",
        accessorKey: "isRecorded",
        cell: (info) => {
          const isRecorded = info.getValue();
          const lecture = info.row.original;
          const lectureDateTime = new Date(`${lecture.date}T${lecture.time}`);
          const now = new Date();
          const isPast = lectureDateTime < now;

          let statusTag;
          if (isRecorded) {
            statusTag = (
              <Tag colorScheme="green" variant="subtle" size="lg">
                <TagLeftIcon as={FaCheckCircle} />
                <TagLabel>مسجلة</TagLabel>
              </Tag>
            );
          } else if (isPast && !isRecorded) {
             statusTag = (
              <Tag colorScheme="red" variant="subtle" size="lg">
                <TagLeftIcon as={FaTimesCircle} />
                <TagLabel>لم تسجل</TagLabel>
              </Tag>
            );
          } else {
             statusTag = (
              <Tag colorScheme="orange" variant="subtle" size="lg">
                <TagLeftIcon as={FaPlayCircle} />
                <TagLabel>قيد الانتظار</TagLabel>
              </Tag>
            );
          }

          return (
            <FormControl display="flex" alignItems="center" justifyContent="center">
              <Switch
                id={`record-status-${lecture.id}`}
                isChecked={isRecorded}
                onChange={() => toggleRecordStatus(lecture.id)}
                colorScheme={isRecorded ? "green" : "red"}
                size="lg"
                mr={3}
              />
              <FormLabel htmlFor={`record-status-${lecture.id}`} mb="0">
                {statusTag}
              </FormLabel>
            </FormControl>
          );
        },
      },
      {
        header: "الإجراءات",
        accessorKey: "actions",
        cell: (info) => {
          const lecture = info.row.original;
          const lectureDateTime = new Date(`${lecture.date}T${lecture.time}`);
          const now = new Date();
          // Adjust comparison for "upcoming" to be from now onwards, not just > today's start
          const isUpcomingAndNotRecorded = lectureDateTime > now && !lecture.isRecorded;
          const isPastAndNotRecorded = lectureDateTime < now && !lecture.isRecorded;

          const handleReminder = () => {
            setLectures((prevLectures) =>
              prevLectatures.map((lec) =>
                lec.id === lecture.id ? { ...lec, reminded: true } : lec
              )
            );
            toast({
              title: "تم إرسال التذكير بنجاح.",
              description: `تم إرسال تذكير للمدرس عن محاضرة "${lecture.courseName}".`,
              status: "success",
              duration: 5000,
              isClosable: true,
              position: "top-right",
            });
          };

          return (
            <HStack spacing={2} justify="center">
              {isUpcomingAndNotRecorded && (
                <Button
                  leftIcon={<FaBell />}
                  colorScheme="orange"
                  size="sm"
                  onClick={handleReminder}
                  isDisabled={lecture.reminded}
                  title={lecture.reminded ? "تم إرسال التذكير سابقاً" : "إرسال تذكير للمدرس"}
                >
                  {lecture.reminded ? "تم التذكير" : "تذكير"}
                </Button>
              )}
              {isPastAndNotRecorded && (
                <Button
                  leftIcon={<FaTimesCircle />}
                  colorScheme="red"
                  variant="outline"
                  size="sm"
                  isDisabled
                >
                  فاتت المحاضرة
                </Button>
              )}
            </HStack>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data, // استخدم `data` بدلاً من `filteredLectures`
    columns,
    getCoreRowModel: getCoreRowModel(), // هذا ضروري لـ react-table v8
  });

  const toggleRecordStatus = (id) => {
    setLectures((prevLectures) =>
      prevLectures.map((lecture) =>
        lecture.id === id ? { ...lecture, isRecorded: !lecture.isRecorded } : lecture
      )
    );
    toast({
      title: "تم تحديث حالة التسجيل.",
      status: "info",
      duration: 3000,
      isClosable: true,
      position: "bottom-left",
    });
  };

  return (
    <Box minH="100vh" className="mt-[40px]" bg={useColorModeValue("gray.50", "gray.900")} py={10} dir="rtl">
      {/* Header Section */}
      <Flex
        as="header"
        align="center"
        justify="center"
        bg={headerBg}
        color={headerTextColor}
        py={8}
        mb={10}
        boxShadow="md"
        textAlign="center"
      >
        <VStack spacing={2}>
          <Icon as={FaCalendarAlt} w={12} h={12} />
          <Heading as="h1" size="xl" fontWeight="extrabold">
            جدول المحاضرات وتتبع التسجيل
          </Heading>
          <Text fontSize="lg" opacity={0.9}>
            إدارة مواعيد المحاضرات وحالة تسجيلها
          </Text>
        </VStack>
      </Flex>

      <Container maxW="7xl">
        {/* Filters and Search */}
        <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            bg={cardBg}
            p={6}
            borderRadius="xl"
            boxShadow="lg"
            border="1px solid"
            borderColor={cardBorderColor}
            mb={8}
        >
            <HStack spacing={4} flexWrap="wrap" justifyContent="center">
                <FormControl flex="1" minW="200px">
                    <FormLabel htmlFor="search-lectures" srOnly>بحث عن محاضرة</FormLabel>
                    <Input
                        id="search-lectures"
                        placeholder="بحث باسم المدرس أو الكورس..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        // لا يمكن استخدام leftIcon مباشرة على Input في Chakra UI
                        // يمكن استخدام InputGroup و InputLeftElement لتحقيق ذلك إذا أردت
                    />
                </FormControl>
                <FormControl flex="1" minW="180px">
                    <FormLabel htmlFor="filter-status" srOnly>تصفية حسب الحالة</FormLabel>
                    <Select
                        id="filter-status"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">كل المحاضرات</option>
                        <option value="upcoming">محاضرات قادمة</option>
                        <option value="past">محاضرات سابقة</option>
                        <option value="recorded">مسجلة</option>
                        <option value="not_recorded">غير مسجلة</option>
                    </Select>
                </FormControl>
            </HStack>
        </MotionBox>

        {/* Lectures Table */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          bg={cardBg}
          p={6}
          borderRadius="xl"
          boxShadow="xl"
          border="1px solid"
          borderColor={cardBorderColor}
          overflowX="auto" // For small screens
        >
          <Heading size="lg" mb={6} color={useColorModeValue("blue.700", "blue.300")} textAlign="center">
            قائمة المحاضرات
          </Heading>
          {data.length === 0 ? ( // استخدام `data` هنا
            <Text textAlign="center" py={10} color={useColorModeValue("gray.600", "gray.400")}>
              لا توجد محاضرات مطابقة لمعايير البحث أو التصفية.
            </Text>
          ) : (
            <Table variant="simple" size="md">
              <Thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <Tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <Th
                        key={header.id}
                        bg={tableHeaderBg}
                        p={4}
                        textAlign="center"
                        fontSize="md"
                        fontWeight="bold"
                        color={useColorModeValue("blue.800", "blue.100")}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </Th>
                    ))}
                  </Tr>
                ))}
              </Thead>
              <Tbody>
                {table.getRowModel().rows.map((row) => {
                  const lecture = row.original;
                  const lectureDateTime = new Date(`${lecture.date}T${lecture.time}`);
                  const now = new Date();
                  const isUpcomingAndNotRecorded = lectureDateTime > now && !lecture.isRecorded;
                  const timeUntilLecture = lectureDateTime.getTime() - now.getTime();
                  // Less than 48 hours (2 days) for alert
                  const isSoonAndNotRecorded = isUpcomingAndNotRecorded && timeUntilLecture <= 48 * 60 * 60 * 1000;
                  const isPastAndNotRecorded = lectureDateTime < now && !lecture.isRecorded;


                  return (
                    <Tr
                      key={row.id}
                      _hover={{ bg: tableRowHoverBg }}
                      bg={isSoonAndNotRecorded ? attentionBg : "transparent"}
                      border={isSoonAndNotRecorded ? "1px solid" : "none"}
                      borderColor={isSoonAndNotRecorded ? attentionBorder : "transparent"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <Td key={cell.id} p={4} textAlign="center">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Td>
                      ))}
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </MotionBox>
      </Container>
    </Box>
  );
};

export default LecturesSchedule;