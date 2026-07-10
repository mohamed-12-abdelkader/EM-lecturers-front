import React from "react";
import {
  VStack,
  Flex,
  Button,
  Icon,
  Text,
  Center,
  Badge,
  Skeleton,
  HStack,
} from "@chakra-ui/react";
import { FaPlus, FaPlayCircle } from "react-icons/fa";
import LectureCard from "./LectureCard";
import { crEyebrowOrange, crSubheading, lcLabel, lcRoot } from "../courseTheme";

const LecturesTab = ({
  lectures,
  isTeacher,
  isAdmin,
  handleAddLecture,
  handleEditLecture,
  handleDeleteLecture,
  handleAddVideo,
  handleEditVideo,
  handleDeleteVideo,
  handleAddFile,
  handleEditFile,
  handleDeleteFile,
  setExamModal,
  setDeleteExamDialog,
  examActionLoading,
  itemBg,
  sectionBg,
  headingColor,
  subTextColor,
  borderColor,
  dividerColor,
  textColor,
  formatDate,
  onAddBulkQuestions,
  handleOpenVideo,
}) => (
  <VStack spacing={{ base: 4, md: 5 }} align="stretch" dir="rtl" className={lcRoot}>
    <Flex
      justify="space-between"
      align={{ base: "stretch", sm: "center" }}
      gap={4}
      direction={{ base: "column", sm: "row" }}
      className="border-b border-slate-100 pb-5 text-right dark:border-slate-800"
    >
      <div className="relative min-w-0 pr-4">
        <span
          className="absolute right-0 top-1 hidden h-[calc(100%-6px)] w-1 rounded-full bg-gradient-to-b from-blue-500 to-orange-500 sm:block"
          aria-hidden
        />
        <span className={crEyebrowOrange}>محتوى الكورس</span>
        <h2 className={`${crSubheading} mt-2.5 text-xl tracking-tight md:text-2xl`}>
          محاضرات الكورس
        </h2>
        <p className={`mt-2 max-w-md ${lcLabel}`}>
          تابع الفيديوهات والملفات والواجبات لكل محاضرة
        </p>
      </div>
      <HStackWrap count={lectures?.length || 0} isTeacher={isTeacher} isAdmin={isAdmin} handleAddLecture={handleAddLecture} />
    </Flex>

    {!lectures ? (
      <VStack spacing={4} align="stretch">
        <Skeleton height="100px" borderRadius="2xl" />
        <Skeleton height="100px" borderRadius="2xl" />
        <Skeleton height="100px" borderRadius="2xl" />
      </VStack>
    ) : lectures.length === 0 ? (
      <Center
        py={14}
        flexDir="column"
        textAlign="center"
        borderRadius="2xl"
        border="2px dashed"
        borderColor={borderColor}
        bg={sectionBg}
      >
        <Center w={14} h={14} borderRadius="2xl" bg="blue.50" mb={4}>
          <Icon as={FaPlayCircle} color="blue.500" boxSize={6} />
        </Center>
        <Text fontWeight="bold" color={textColor} mb={2}>
          لا توجد محاضرات بعد
        </Text>
        <Text fontSize="sm" color={subTextColor} mb={5} maxW="320px">
          ابدأ بإضافة أول محاضرة ليظهر المحتوى للطلاب.
        </Text>
        {(isTeacher || isAdmin) && (
          <Button colorScheme="orange" leftIcon={<Icon as={FaPlus} />} borderRadius="xl" onClick={handleAddLecture}>
            إضافة محاضرة
          </Button>
        )}
      </Center>
    ) : (
      <VStack spacing={{ base: 4, md: 5 }} align="stretch">
        {lectures.map((lecture, index) => (
          <LectureCard
            key={lecture.id}
            lecture={lecture}
            lectureIndex={index}
            isTeacher={isTeacher}
            isAdmin={isAdmin}
            handleEditLecture={handleEditLecture}
            handleDeleteLecture={handleDeleteLecture}
            handleAddVideo={handleAddVideo}
            handleEditVideo={handleEditVideo}
            handleDeleteVideo={handleDeleteVideo}
            handleAddFile={handleAddFile}
            handleEditFile={handleEditFile}
            handleDeleteFile={handleDeleteFile}
            setExamModal={setExamModal}
            setDeleteExamDialog={setDeleteExamDialog}
            examActionLoading={examActionLoading}
            itemBg={itemBg}
            sectionBg={sectionBg}
            headingColor={headingColor}
            subTextColor={subTextColor}
            borderColor={borderColor}
            dividerColor={dividerColor}
            textColor={textColor}
            formatDate={formatDate}
            onAddBulkQuestions={onAddBulkQuestions}
            handleOpenVideo={handleOpenVideo}
          />
        ))}
      </VStack>
    )}
  </VStack>
);

export default LecturesTab;

const HStackWrap = ({ count, isTeacher, isAdmin, handleAddLecture }) => (
  <HStack spacing={2} flexShrink={0} alignSelf={{ base: "flex-start", sm: "center" }}>
    <Badge
      colorScheme="blue"
      borderRadius="full"
      px={3}
      py={1}
      fontSize="xs"
      fontWeight="semibold"
      className="font-sans"
    >
      {count} محاضرة
    </Badge>
    {(isTeacher || isAdmin) && (
      <Button
        size="sm"
        colorScheme="orange"
        leftIcon={<Icon as={FaPlus} />}
        borderRadius="xl"
        onClick={handleAddLecture}
      >
        إضافة محاضرة
      </Button>
    )}
  </HStack>
);
