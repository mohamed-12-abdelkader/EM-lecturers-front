import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Icon,
  IconButton,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaEye, FaFilePdf, FaTrash } from "react-icons/fa";
import {
  buildCourseFileViewPath,
  formatCourseFileSize,
  getCourseFileDisplayName,
} from "../../../api/courseFilesApi";

function formatFileDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

export default function CourseFileCard({
  file,
  courseId,
  canManage,
  onEdit,
  onDelete,
  sectionBg,
  borderColor,
  textColor,
  subTextColor,
}) {
  const name = getCourseFileDisplayName(file);
  const sizeLabel = formatCourseFileSize(file.fileSize);
  const dateLabel = formatFileDate(file.createdAt || file.updatedAt);
  const viewPath = buildCourseFileViewPath(courseId, file);
  const navigate = useNavigate();

  return (
    <Box
      role="group"
      bg={sectionBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="2xl"
      overflow="hidden"
      transition="all 0.25s ease"
      _hover={{
        transform: "translateY(-4px)",
        boxShadow: "xl",
        borderColor: "orange.300",
      }}
    >
      <Box h="3px" bgGradient="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" />

      <VStack align="stretch" p={{ base: 4, md: 5 }} spacing={4}>
        <Flex align="start" gap={3}>
          <Center
            w={12}
            h={12}
            borderRadius="xl"
            bgGradient="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
            color="white"
            flexShrink={0}
            boxShadow="md"
            aria-hidden
          >
            <Icon as={FaFilePdf} boxSize={5} />
          </Center>

          <Box flex={1} minW={0} textAlign="right">
            <Text fontWeight="bold" fontSize="md" color={textColor} noOfLines={2} lineHeight="short">
              {name}
            </Text>
            {file.description ? (
              <Text mt={1} fontSize="sm" color={subTextColor} noOfLines={2}>
                {file.description}
              </Text>
            ) : null}
            <HStack mt={2} spacing={2} flexWrap="wrap" justify="flex-start">
              {sizeLabel ? (
                <Text fontSize="xs" color={subTextColor}>
                  {sizeLabel}
                </Text>
              ) : null}
              {dateLabel ? (
                <Text fontSize="xs" color={subTextColor}>
                  {dateLabel}
                </Text>
              ) : null}
              {file.originalName ? (
                <Text fontSize="xs" color={subTextColor} noOfLines={1} dir="ltr">
                  {file.originalName}
                </Text>
              ) : null}
            </HStack>
          </Box>
        </Flex>

        <HStack spacing={2} justify="stretch">
          {viewPath ? (
            <Button
              size="sm"
              colorScheme="orange"
              borderRadius="xl"
              leftIcon={<Icon as={FaEye} />}
              flex={1}
              onClick={() => navigate(viewPath)}
            >
              عرض
            </Button>
          ) : null}

          {canManage ? (
            <Tooltip label="تعديل">
              <IconButton
                aria-label={`تعديل ${name}`}
                icon={<FaEdit />}
                size="sm"
                variant="outline"
                borderRadius="xl"
                onClick={() => onEdit?.(file)}
              />
            </Tooltip>
          ) : null}

          {canManage ? (
            <Tooltip label="حذف">
              <IconButton
                aria-label={`حذف ${name}`}
                icon={<FaTrash />}
                size="sm"
                colorScheme="red"
                variant="outline"
                borderRadius="xl"
                onClick={() => onDelete?.(file)}
              />
            </Tooltip>
          ) : null}
        </HStack>
      </VStack>
    </Box>
  );
}
