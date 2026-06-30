import React from "react";
import {
  VStack,
  Flex,
  Heading,
  Button,
  Icon,
  Box,
  Text,
  Center,
  Badge,
  Skeleton,
} from "@chakra-ui/react";
import { FaPlus } from "react-icons/fa";
import LectureCard from "./LectureCard";

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
  handleOpenVideo
}) => (
  <VStack spacing={{ base: 3, md: 4 }} align="stretch" className="">
    <Box
      bg={sectionBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="2xl"
      boxShadow="sm"
      overflow="hidden"
    >
      <Box p={{ base: 4, md: 5 }} borderBottom="1px solid" borderColor={dividerColor}>
        <Flex
          justify="space-between"
          align="center"
          gap={3}
          direction={{ base: "column", sm: "row" }}
        >
          <Heading size={{ base: "sm", md: "md" }} color={headingColor}>
            محاضرات الكورس
          </Heading>
          <HStackWrap
            count={lectures?.length || 0}
            isTeacher={isTeacher}
            handleAddLecture={handleAddLecture}
          />
        </Flex>
      </Box>

      <Box p={{ base: 3, md: 5 }}>
        {!lectures ? (
          <VStack spacing={4} align="stretch">
            <Skeleton height="90px" borderRadius="xl" />
            <Skeleton height="90px" borderRadius="xl" />
            <Skeleton height="90px" borderRadius="xl" />
          </VStack>
        ) : lectures.length === 0 ? (
          <Center py={10} flexDir="column" textAlign="center">
            <Text fontWeight="bold" color={textColor} mb={2}>
              لا توجد محاضرات
            </Text>
            <Text fontSize="sm" color={subTextColor} mb={4} maxW="320px">
              ابدأ بإضافة محاضرة لتظهر هنا.
            </Text>
            {(isTeacher || isAdmin) && (
              <Button
                colorScheme="blue"
                leftIcon={<Icon as={FaPlus} />}
                borderRadius="full"
                onClick={handleAddLecture}
              >
                إضافة محاضرة
              </Button>
            )}
          </Center>
        ) : (
          <VStack spacing={{ base: 3, md: 4 }} align="stretch">
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
      </Box>
    </Box>
  </VStack>
);

export default LecturesTab; 

// Small helper component to keep header layout tidy
const HStackWrap = ({ count, isTeacher, handleAddLecture }) => {
  return (
    <>
      <Badge colorScheme="blue" borderRadius="full">
        {count} محاضرة
      </Badge>
      {isTeacher && (
        <Button
          size={{ base: "sm", md: "md" }}
          colorScheme="blue"
          leftIcon={<Icon as={FaPlus} />}
          borderRadius="full"
          onClick={handleAddLecture}
        >
          إضافة محاضرة
        </Button>
      )}
    </>
  );
};