import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Badge,
  Button,
  Collapse,
  HStack,
  Icon,
  Image,
  SimpleGrid,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { FaCheck, FaChevronDown, FaChevronUp, FaExchangeAlt, FaTrash } from "react-icons/fa";
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

const LETTERS = ["أ", "ب", "ج", "د", "هـ", "و"];

export default function ProposalQuestionCard({
  item,
  index,
  canAdjust = false,
  adjusting = false,
  onRemove,
  onReplace,
  defaultExpanded = false,
  forceExpanded = false,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded || forceExpanded);
  const border = useColorModeValue("gray.200", "gray.700");
  const bg = useColorModeValue("white", "gray.800");
  const metaColor = useColorModeValue("gray.500", "gray.400");
  const optionBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const correctBg = useColorModeValue("green.50", "green.900");
  const correctBorder = useColorModeValue("green.400", "green.500");
  const headerBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const headerHover = useColorModeValue("gray.100", "whiteAlpha.100");
  const letterIdleBg = useColorModeValue("white", "gray.700");
  const accentSoft = useColorModeValue("blue.50", "blue.900");
  const titleColor = useColorModeValue("gray.800", "gray.100");
  const replacedGlow = useColorModeValue("blue.100", "blue.800");

  const body = getQuestionBody(item);
  const options = getQuestionOptions(item);
  const mediaUrl = getQuestionMediaUrl(item);
  const text = getQuestionText(item);
  const correctIndex = body?.correct_answer_index;
  const scopeLabel =
    [item.chapter_name, item.lesson_name].filter(Boolean).join(" · ") || "بدون فصل";
  const preview =
    item.preview_excerpt ||
    (text ? String(text).replace(/\s+/g, " ").trim().slice(0, 90) : "") ||
    "سؤال بصورة";

  useEffect(() => {
    if (!forceExpanded) return undefined;
    setExpanded(true);
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`proposal-q-${index}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [forceExpanded, item?.id, index]);

  return (
    <Box
      id={`proposal-q-${index}`}
      bg={bg}
      borderWidth="1px"
      borderColor={forceExpanded || expanded ? "blue.300" : border}
      borderRadius="xl"
      overflow="hidden"
      transition="border-color 0.15s ease, box-shadow 0.15s ease"
      boxShadow={forceExpanded || expanded ? "sm" : "none"}
      outline={forceExpanded ? "2px solid" : "none"}
      outlineColor={forceExpanded ? replacedGlow : "transparent"}
    >
      <Flex
        as="button"
        type="button"
        w="full"
        textAlign="right"
        px={{ base: 3, md: 3.5 }}
        py={3}
        bg={headerBg}
        align="center"
        gap={2.5}
        onClick={() => setExpanded((v) => !v)}
        _hover={{ bg: headerHover }}
      >
        <Flex
          w={8}
          h={8}
          borderRadius="lg"
          bg={ACCENT}
          color="white"
          align="center"
          justify="center"
          fontSize="sm"
          fontWeight="800"
          flexShrink={0}
          sx={{ fontVariantNumeric: "tabular-nums" }}
        >
          {index + 1}
        </Flex>

        <Box flex={1} minW={0}>
          <HStack spacing={1.5} mb={0.5} flexWrap="wrap">
            <Badge variant="subtle" colorScheme="blue" fontSize="9px" borderRadius="md">
              {QUESTION_TYPE_LABELS[item.question_type] || item.question_type || "سؤال"}
            </Badge>
            {item.difficulty_level ? (
              <Badge variant="outline" fontSize="9px" borderRadius="md">
                {DIFFICULTY_LABELS[item.difficulty_level] || item.difficulty_level}
              </Badge>
            ) : null}
            {forceExpanded ? (
              <Badge colorScheme="green" fontSize="9px" borderRadius="md">
                تم الاستبدال
              </Badge>
            ) : null}
          </HStack>
          <Text fontSize="xs" fontWeight="700" color={titleColor} noOfLines={1}>
            {scopeLabel}
          </Text>
          {!expanded ? (
            <Text fontSize="11px" color={metaColor} noOfLines={2} mt={0.5} lineHeight="1.5">
              {preview}
              {text && String(text).length > 90 ? "…" : ""}
            </Text>
          ) : null}
        </Box>

        <Icon
          as={expanded ? FaChevronUp : FaChevronDown}
          color={metaColor}
          boxSize={3}
          flexShrink={0}
        />
      </Flex>

      <Collapse in={expanded} animateOpacity>
        <Box px={{ base: 3, md: 3.5 }} pb={3} pt={1}>
          {text ? (
            <Box
              borderRightWidth="3px"
              borderColor={ACCENT}
              pr={3}
              mb={mediaUrl || options.length ? 3 : 0}
              bg={accentSoft}
              borderRadius="md"
              py={2}
              ps={2}
            >
              <FormattedQuestionText
                value={text}
                fontSize={{ base: "sm", md: "sm" }}
                lineHeight="1.85"
                fontWeight="medium"
              />
            </Box>
          ) : null}

          {mediaUrl ? (
            <Box
              mb={options.length ? 3 : 0}
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
                maxH={{ base: "180px", md: "220px" }}
                objectFit="contain"
                py={2}
                px={2}
                loading="lazy"
              />
            </Box>
          ) : null}

          {options.length > 0 ? (
            <VStack align="stretch" spacing={1.5}>
              <Text fontSize="10px" fontWeight="700" color={metaColor}>
                الاختيارات
              </Text>
              <SimpleGrid columns={1} spacing={1.5}>
                {options.map((opt, optIdx) => {
                  const optIndex = opt.option_index ?? optIdx;
                  const isCorrect =
                    correctIndex != null && Number(correctIndex) === Number(optIndex);
                  return (
                    <Flex
                      key={optIdx}
                      align="center"
                      gap={2.5}
                      px={3}
                      py={2.5}
                      minH="44px"
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={isCorrect ? correctBorder : border}
                      bg={isCorrect ? correctBg : optionBg}
                    >
                      <Flex
                        w={7}
                        h={7}
                        borderRadius="md"
                        bg={isCorrect ? "green.500" : letterIdleBg}
                        color={isCorrect ? "white" : metaColor}
                        borderWidth={isCorrect ? 0 : "1px"}
                        borderColor={border}
                        align="center"
                        justify="center"
                        fontSize="xs"
                        fontWeight="800"
                        flexShrink={0}
                      >
                        {isCorrect ? (
                          <Icon as={FaCheck} boxSize={2.5} />
                        ) : (
                          LETTERS[optIndex] || String.fromCharCode(65 + optIndex)
                        )}
                      </Flex>
                      <Box flex={1} minW={0}>
                        <FormattedQuestionText
                          value={opt.text_content || opt.text || "—"}
                          fontSize="sm"
                          lineHeight="1.65"
                        />
                      </Box>
                      {isCorrect ? (
                        <Badge colorScheme="green" fontSize="9px" borderRadius="md" flexShrink={0}>
                          صحيحة
                        </Badge>
                      ) : null}
                    </Flex>
                  );
                })}
              </SimpleGrid>
            </VStack>
          ) : null}

          {canAdjust ? (
            <HStack spacing={2} mt={3} pt={3} borderTopWidth="1px" borderColor={border}>
              <Button
                flex={1}
                size="sm"
                h="40px"
                variant="outline"
                borderRadius="lg"
                leftIcon={<FaExchangeAlt />}
                onClick={(e) => {
                  e.stopPropagation();
                  onReplace?.(item, index);
                }}
                isLoading={adjusting}
              >
                استبدال
              </Button>
              <Button
                flex={1}
                size="sm"
                h="40px"
                variant="outline"
                colorScheme="red"
                borderRadius="lg"
                leftIcon={<FaTrash />}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove?.(item, index);
                }}
                isLoading={adjusting}
              >
                حذف
              </Button>
            </HStack>
          ) : null}
        </Box>
      </Collapse>
    </Box>
  );
}
