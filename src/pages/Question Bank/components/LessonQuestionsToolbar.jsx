import { Badge, Box, Button, Flex, HStack, Text, useColorModeValue } from "@chakra-ui/react";

export default function LessonQuestionsToolbar({
  total,
  isSelectionMode,
  selectedCount,
  canManage,
  onSelectAll,
  allSelected,
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  return (
    <Flex
      align={{ base: "stretch", sm: "center" }}
      justify="space-between"
      direction={{ base: "column", sm: "row" }}
      gap={3}
      mb={5}
      p={4}
      bg={cardBg}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={border}
      boxShadow="sm"
    >
      <HStack spacing={3} flexWrap="wrap">
        <Badge
          colorScheme="blue"
          variant="subtle"
          px={3}
          py={1}
          borderRadius="lg"
          fontSize="sm"
          fontWeight="bold"
        >
          {total} سؤال
        </Badge>
        {isSelectionMode && (
          <Badge colorScheme="orange" variant="subtle" px={3} py={1} borderRadius="lg" fontSize="sm">
            {selectedCount} محدد
          </Badge>
        )}
        <Text fontSize="sm" color={muted} lineHeight="1.6">
          {isSelectionMode
            ? "اضغط على البطاقة لتحديد السؤال للامتحان"
            : canManage
              ? "اضغط على الخيار لتعيين الإجابة الصحيحة"
              : "اضغط على إجابة لمعاينة النتيجة"}
        </Text>
      </HStack>

      {isSelectionMode && total > 0 && (
        <Button size="sm" variant="outline" colorScheme="orange" borderRadius="lg" onClick={onSelectAll}>
          {allSelected ? "إلغاء تحديد الكل" : "تحديد الكل"}
        </Button>
      )}
    </Flex>
  );
}
