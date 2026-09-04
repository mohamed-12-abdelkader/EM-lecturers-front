import {
  Box,
  Button,
  Flex,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaCheckCircle, FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function ExamTakingActionBar({
  currentIndex,
  totalQuestions,
  answeredCount,
  allAnswered,
  submitLoading,
  onPrev,
  onNext,
  onSubmit,
}) {
  const barBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const hintBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= totalQuestions - 1;

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={40}
      bg={barBg}
      borderTopWidth="1px"
      borderColor={border}
      boxShadow="0 -8px 28px rgba(15, 23, 42, 0.08)"
      px={{ base: 3, md: 4 }}
      pt={3}
      pb="max(12px, env(safe-area-inset-bottom))"
    >
      <Box maxW="3xl" mx="auto">
      {!allAnswered && (
        <Flex
          mb={2.5}
          px={3}
          py={2}
          borderRadius="xl"
          bg={hintBg}
          justify="space-between"
          align="center"
          gap={3}
        >
          <Text fontSize="xs" fontWeight="700" color={muted}>
            أكمل كل الأسئلة للتسليم
          </Text>
          <Text fontSize="sm" fontWeight="800" color="blue.500">
            {answeredCount}/{totalQuestions}
          </Text>
        </Flex>
      )}

      {allAnswered && (
        <Button
          w="full"
          h={{ base: "52px", md: "48px" }}
          mb={2.5}
          colorScheme="green"
          borderRadius="2xl"
          fontSize={{ base: "md", md: "sm" }}
          fontWeight="800"
          leftIcon={<FaCheckCircle />}
          isLoading={submitLoading}
          onClick={onSubmit}
        >
          تسليم الامتحان
        </Button>
      )}

      <Flex gap={2.5} dir="rtl">
        <Button
          flex={1}
          h={{ base: "52px", md: "48px" }}
          variant="outline"
          borderRadius="2xl"
          fontWeight="800"
          fontSize={{ base: "md", md: "sm" }}
          leftIcon={<FaChevronRight />}
          onClick={onPrev}
          isDisabled={isFirst || submitLoading}
        >
          السابق
        </Button>
        <Button
          flex={1.35}
          h={{ base: "52px", md: "48px" }}
          colorScheme="blue"
          borderRadius="2xl"
          fontWeight="800"
          fontSize={{ base: "md", md: "sm" }}
          rightIcon={<FaChevronLeft />}
          onClick={onNext}
          isDisabled={isLast || submitLoading}
        >
          {isLast ? "آخر سؤال" : "التالي"}
        </Button>
      </Flex>
      </Box>
    </Box>
  );
}
