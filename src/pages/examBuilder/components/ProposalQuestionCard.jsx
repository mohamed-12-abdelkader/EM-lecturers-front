import React from "react";
import {
  Box,
  Flex,
  Text,
  Badge,
  Button,
  HStack,
  Image,
  SimpleGrid,
  useColorModeValue,
} from "@chakra-ui/react";
import FormattedQuestionText from "../../../components/question/FormattedQuestionText";
import {
  QUESTION_TYPE_LABELS,
  DIFFICULTY_LABELS,
} from "../../../api/examBuilderChatbotApi";
import {
  getQuestionBody,
  getQuestionMediaUrl,
  getQuestionOptions,
  getQuestionText,
} from "../examBuilderUtils";
import { ACCENT } from "../examBuilderTheme";

export default function ProposalQuestionCard({
  item,
  index,
  canAdjust = false,
  adjusting = false,
  onRemove,
  onReplace,
}) {
  const border = useColorModeValue("gray.200", "gray.700");
  const bg = useColorModeValue("white", "gray.800");
  const metaColor = useColorModeValue("gray.500", "gray.400");
  const optionBg = useColorModeValue("gray.50", "gray.900");
  const correctBg = useColorModeValue("green.50", "green.900");
  const correctBorder = useColorModeValue("green.400", "green.500");
  const headerBg = useColorModeValue("gray.50", "gray.900");

  const body = getQuestionBody(item);
  const options = getQuestionOptions(item);
  const mediaUrl = getQuestionMediaUrl(item);
  const text = getQuestionText(item);
  const correctIndex = body?.correct_answer_index;

  return (
    <Box
      bg={bg}
      borderWidth="1px"
      borderColor={border}
      borderRadius="xl"
      overflow="hidden"
      boxShadow="sm"
      transition="box-shadow 0.2s"
      _hover={{ boxShadow: "md" }}
    >
      <Flex
        px={4}
        py={3}
        bg={headerBg}
        borderBottomWidth="1px"
        borderColor={border}
        align="center"
        justify="space-between"
        gap={2}
        flexWrap="wrap"
      >
        <HStack spacing={3}>
          <Flex
            w={8}
            h={8}
            borderRadius="lg"
            bg={ACCENT}
            color="white"
            align="center"
            justify="center"
            fontSize="sm"
            fontWeight="bold"
            flexShrink={0}
          >
            {index + 1}
          </Flex>
          <Box minW={0}>
            <Text fontSize="xs" fontWeight="semibold" noOfLines={1}>
              {[item.chapter_name, item.lesson_name].filter(Boolean).join(" · ") || "—"}
            </Text>
            {item.preview_excerpt && (
              <Text fontSize="10px" color={metaColor} noOfLines={1} mt={0.5}>
                {item.preview_excerpt}
              </Text>
            )}
          </Box>
        </HStack>
        <HStack spacing={1.5} flexShrink={0} flexWrap="wrap" justify="flex-end">
          <Badge variant="subtle" colorScheme="blue" fontSize="10px" borderRadius="md">
            {QUESTION_TYPE_LABELS[item.question_type] || item.question_type || "—"}
          </Badge>
          {item.difficulty_level && (
            <Badge variant="outline" fontSize="10px" borderRadius="md">
              {DIFFICULTY_LABELS[item.difficulty_level] || item.difficulty_level}
            </Badge>
          )}
          {canAdjust && (
            <>
              <Button
                size="xs"
                variant="outline"
                borderRadius="md"
                onClick={() => onReplace?.(item, index)}
                isLoading={adjusting}
              >
                استبدال
              </Button>
              <Button
                size="xs"
                variant="ghost"
                colorScheme="red"
                borderRadius="md"
                onClick={() => onRemove?.(item, index)}
                isLoading={adjusting}
              >
                حذف
              </Button>
            </>
          )}
        </HStack>
      </Flex>

      <Box p={4}>
        {text && (
          <Box
            borderRightWidth="3px"
            borderColor={ACCENT}
            pr={3}
            mb={mediaUrl || options.length ? 4 : 0}
          >
            <FormattedQuestionText
              value={text}
              fontSize="sm"
              lineHeight="1.85"
              fontWeight="medium"
            />
          </Box>
        )}

        {mediaUrl && (
          <Box
            mb={options.length ? 4 : 0}
            borderWidth="1px"
            borderColor={border}
            borderRadius="lg"
            overflow="hidden"
            bg={optionBg}
          >
            <Image
              src={mediaUrl}
              alt={`سؤال ${index + 1}`}
              w="100%"
              maxH="200px"
              objectFit="contain"
              py={3}
              px={2}
            />
          </Box>
        )}

        {options.length > 0 && (
          <Box>
            <Text fontSize="xs" fontWeight="semibold" color={metaColor} mb={2.5}>
              الاختيارات
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
              {options.map((opt, optIdx) => {
                const isCorrect =
                  correctIndex != null && Number(correctIndex) === Number(opt.option_index ?? optIdx);
                return (
                  <Flex
                    key={optIdx}
                    align="center"
                    gap={2.5}
                    px={3}
                    py={2}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor={isCorrect ? correctBorder : border}
                    bg={isCorrect ? correctBg : optionBg}
                    gridColumn={options.length === 1 ? "1 / -1" : undefined}
                  >
                    <Flex
                      w={6}
                      h={6}
                      borderRadius="md"
                      bg={isCorrect ? "green.500" : useColorModeValue("white", "gray.800")}
                      color={isCorrect ? "white" : metaColor}
                      borderWidth={isCorrect ? 0 : "1px"}
                      borderColor={border}
                      align="center"
                      justify="center"
                      fontSize="10px"
                      fontWeight="bold"
                      flexShrink={0}
                    >
                      {String.fromCharCode(65 + (opt.option_index ?? optIdx))}
                    </Flex>
                    <FormattedQuestionText
                      value={opt.text_content || opt.text || ""}
                      fontSize="xs"
                      lineHeight="1.65"
                      flex="1"
                    />
                  </Flex>
                );
              })}
            </SimpleGrid>
          </Box>
        )}
      </Box>
    </Box>
  );
}
