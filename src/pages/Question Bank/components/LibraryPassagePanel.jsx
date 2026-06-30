import React from "react";
import {
  Box,
  Flex,
  Text,
  Badge,
  HStack,
  Divider,
  VStack,
  Collapse,
  Checkbox,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaBookOpen } from "react-icons/fa";
import { renderFormattedExamText } from "../../../utils/renderFormattedExamText";
import LibraryQuestionCard from "./LibraryQuestionCard";

function FormattedPassageText({ content }) {
  const textColor = useColorModeValue("gray.800", "gray.100");
  if (!content) return null;
  return (
    <Text fontSize="sm" lineHeight="1.9" color={textColor} whiteSpace="pre-wrap">
      {renderFormattedExamText(content)}
    </Text>
  );
}

export default function LibraryPassagePanel({
  passage,
  passageIndex,
  isExpanded,
  onToggle,
  selectedQuestionIds,
  onToggleSelect,
  onEdit,
  onDelete,
  onSetCorrect,
  pendingId,
  showSelect,
  onZoomImage,
  selectedPassageIds,
  onTogglePassageSelect,
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerBg = useColorModeValue("orange.50", "whiteAlpha.100");
  const passageBg = useColorModeValue("gray.50", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const muted = useColorModeValue("gray.600", "gray.400");
  const questions = passage.questions || [];

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      overflow="hidden"
      boxShadow="sm"
    >
      <Flex
        p={4}
        align="center"
        justify="space-between"
        cursor="pointer"
        onClick={onToggle}
        bg={headerBg}
        borderBottomWidth={isExpanded ? "1px" : "0"}
        borderColor={borderColor}
      >
        <HStack spacing={3} minW={0} flex={1}>
          {onTogglePassageSelect ? (
            <Checkbox
              isChecked={selectedPassageIds?.includes(passage.id)}
              onChange={(e) => {
                e.stopPropagation();
                onTogglePassageSelect(passage.id, e.target.checked);
              }}
              onClick={(e) => e.stopPropagation()}
              colorScheme="orange"
            />
          ) : null}
          <Flex
            w={9}
            h={9}
            borderRadius="lg"
            bg="orange.500"
            color="white"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <FaBookOpen size={14} />
          </Flex>
          <Box minW={0}>
            <Text fontWeight="semibold" fontSize="sm" color={textColor} noOfLines={2}>
              {passage.title || `قطعة ${passageIndex + 1}`}
            </Text>
            <Text fontSize="xs" color={muted} mt={0.5}>
              {questions.length} {questions.length === 1 ? "سؤال" : "أسئلة"}
            </Text>
          </Box>
        </HStack>
        <Badge colorScheme="orange" borderRadius="md" flexShrink={0}>
          {isExpanded ? "إخفاء" : "عرض"}
        </Badge>
      </Flex>

      <Collapse in={isExpanded} animateOpacity>
        <Box p={4}>
          <Box
            p={4}
            mb={4}
            borderRadius="lg"
            bg={passageBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRightWidth="3px"
            borderRightColor="orange.400"
          >
            <Text fontSize="xs" fontWeight="semibold" color={muted} mb={2}>
              نص القطعة
            </Text>
            <FormattedPassageText content={passage.content} />
          </Box>

          <Divider mb={4} />

          {questions.length === 0 ? (
            <Text fontSize="sm" color={muted} textAlign="center" py={4}>
              لا توجد أسئلة مرتبطة بهذه القطعة
            </Text>
          ) : (
            <VStack spacing={3} align="stretch">
              {questions.map((q, i) => (
                <LibraryQuestionCard
                  key={q.id}
                  question={q}
                  index={i}
                  selectedIds={selectedQuestionIds}
                  onToggleSelect={onToggleSelect}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onSetCorrect={onSetCorrect}
                  pendingId={pendingId}
                  showSelect={showSelect}
                  onZoomImage={onZoomImage}
                  inPassage
                />
              ))}
            </VStack>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
