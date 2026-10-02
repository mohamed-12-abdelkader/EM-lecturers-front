import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaClipboardList, FaTimes } from "react-icons/fa";

/** شريط سفلي مضغوط لإضافة الأسئلة المحددة للامتحان */
export default function LessonSelectionDock({
  selectedCount,
  onClear,
  onAddToExam,
  disabled = false,
}) {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("orange.300", "orange.600");

  if (!selectedCount) return null;

  return (
    <Box
      position="fixed"
      bottom={{ base: 3, md: 4 }}
      left={0}
      right={0}
      zIndex={120}
      px={{ base: 3, md: 4 }}
      pointerEvents="none"
    >
      <Flex
        maxW="420px"
        mx="auto"
        pointerEvents="auto"
        align="center"
        justify="space-between"
        gap={2}
        bg={bg}
        borderWidth="1px"
        borderColor={border}
        borderRadius="xl"
        boxShadow="md"
        px={2.5}
        py={2}
      >
        <HStack spacing={2} minW={0}>
          <Text
            fontSize="sm"
            fontWeight="800"
            color="orange.500"
            noOfLines={1}
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {selectedCount} محدد
          </Text>
        </HStack>

        <HStack spacing={1} flexShrink={0}>
          <IconButton
            aria-label="مسح التحديد"
            icon={<Icon as={FaTimes} />}
            size="sm"
            variant="ghost"
            colorScheme="orange"
            borderRadius="lg"
            onClick={onClear}
          />
          <Button
            size="sm"
            colorScheme="blue"
            leftIcon={<FaClipboardList />}
            borderRadius="lg"
            fontWeight="800"
            onClick={onAddToExam}
            isDisabled={disabled}
          >
            إضافة للامتحان
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
}
