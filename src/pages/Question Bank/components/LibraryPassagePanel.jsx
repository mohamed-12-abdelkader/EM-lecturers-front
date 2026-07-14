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
  Icon,
} from "@chakra-ui/react";
import { FaBookOpen, FaChevronDown, FaChevronUp } from "react-icons/fa";
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
  const headerBg = useColorModeValue(
    "linear-gradient(135deg, #FFFAF0 0%, #FEEBC8 100%)",
    "whiteAlpha.100",
  );
  const passageBg = useColorModeValue("orange.50", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const muted = useColorModeValue("gray.600", "gray.400");
  const questions = passage.questions || [];
  const selectedCount = questions.filter((q) => selectedQuestionIds?.includes(q.id)).length;

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="2xl"
      overflow="hidden"
      boxShadow="sm"
      transition="box-shadow 0.15s"
      _hover={{ boxShadow: "md" }}
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
              size="lg"
            />
          ) : null}
          <Flex
            w={10}
            h={10}
            borderRadius="xl"
            bgGradient="linear(to-br, orange.400, orange.600)"
            color="white"
            align="center"
            justify="center"
            flexShrink={0}
            shadow="sm"
          >
            <FaBookOpen size={15} />
          </Flex>
          <Box minW={0}>
            <Text fontWeight="bold" fontSize="sm" color={textColor} noOfLines={2}>
              {passage.title || `قطعة ${passageIndex + 1}`}
            </Text>
            <HStack spacing={2} mt={1} flexWrap="wrap">
              <Text fontSize="xs" color={muted}>
                {questions.length} {questions.length === 1 ? "سؤال" : "أسئلة"}
              </Text>
              {showSelect && selectedCount > 0 ? (
                <Badge colorScheme="blue" borderRadius="full" fontSize="xs">
                  {selectedCount} محدد
                </Badge>
              ) : null}
            </HStack>
          </Box>
        </HStack>
        <HStack spacing={2} flexShrink={0}>
          <Badge colorScheme="orange" borderRadius="full" px={2}>
            {isExpanded ? "إخفاء" : "عرض"}
          </Badge>
          <Icon as={isExpanded ? FaChevronUp : FaChevronDown} color="orange.500" boxSize={3} />
        </HStack>
      </Flex>

      <Collapse in={isExpanded} animateOpacity>
        <Box p={{ base: 3, md: 4 }}>
          <Box
            p={4}
            mb={4}
            borderRadius="xl"
            bg={passageBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRightWidth="4px"
            borderRightColor="orange.400"
          >
            <Text fontSize="xs" fontWeight="bold" color={muted} mb={2} letterSpacing="wide">
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
