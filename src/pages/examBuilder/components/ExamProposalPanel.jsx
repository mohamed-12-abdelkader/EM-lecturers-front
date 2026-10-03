import React from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Badge,
  VStack,
  HStack,
  useColorModeValue,
  Icon,
  Divider,
} from "@chakra-ui/react";
import { FaCheck, FaSync, FaExternalLinkAlt, FaFilePdf } from "react-icons/fa";
import { FiLayers, FiTarget, FiDatabase } from "react-icons/fi";
import ProposalQuestionCard from "./ProposalQuestionCard";
import { renderMarkdownInline, SESSION_STATUS_LABELS } from "../examBuilderUtils";
import { ACCENT, ACCENT_HOVER } from "../examBuilderTheme";

function ReplyText({ text }) {
  const color = useColorModeValue("gray.700", "gray.200");
  if (!text) return null;
  return (
    <Text fontSize="sm" color={color} lineHeight="tall">
      {renderMarkdownInline(text).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <Text as="span" key={i} fontWeight="semibold">
            {part.slice(2, -2)}
          </Text>
        ) : (
          <Text as="span" key={i} whiteSpace="pre-wrap">
            {part}
          </Text>
        ),
      )}
    </Text>
  );
}

function MetricChip({ icon, label, value, accent }) {
  const bg = useColorModeValue("gray.50", "whiteAlpha.50");
  const border = useColorModeValue("gray.200", "gray.700");
  const text = useColorModeValue("gray.800", "white");
  const muted = useColorModeValue("gray.500", "gray.400");

  return (
    <Flex
      align="center"
      gap={2}
      px={3}
      py={2}
      bg={bg}
      borderWidth="1px"
      borderColor={border}
      borderRadius="xl"
      minW={0}
      flex={1}
    >
      <Icon as={icon} color={accent || muted} boxSize={3.5} flexShrink={0} />
      <Box minW={0}>
        <Text fontSize="sm" fontWeight="800" color={text} lineHeight="1" sx={{ fontVariantNumeric: "tabular-nums" }}>
          {value}
        </Text>
        <Text fontSize="9px" color={muted} mt={0.5} noOfLines={1}>
          {label}
        </Text>
      </Box>
    </Flex>
  );
}

export default function ExamProposalPanel({
  session,
  questions,
  reply,
  actions,
  onRegenerate,
  onApprove,
  onOpenExam,
  onExportPdf,
  onRemoveQuestion,
  onReplaceQuestion,
  exportingPdf = false,
  regenerating,
  approving,
  adjusting = false,
  readOnly = false,
  hideReply = false,
  embedded = false,
  focusQuestionIndex = null,
}) {
  const panelBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const footerBg = useColorModeValue("gray.50", "gray.900");
  const iconHeaderBg = useColorModeValue("blue.50", "blue.900");
  const stickyShadow = useColorModeValue(
    "0 -8px 24px rgba(15,23,42,0.08)",
    "0 -8px 24px rgba(0,0,0,0.35)",
  );
  const noteBg = useColorModeValue("orange.50", "orange.900");
  const barBg = useColorModeValue("white", "gray.800");
  const barBorder = useColorModeValue("gray.200", "whiteAlpha.300");
  const toolBg = useColorModeValue("gray.50", "blackAlpha.400");
  const toolHover = useColorModeValue("gray.100", "whiteAlpha.200");
  const toolColor = useColorModeValue("gray.700", "gray.100");
  const toolDivider = useColorModeValue("blackAlpha.200", "whiteAlpha.200");
  const hintColor = useColorModeValue("gray.500", "gray.400");

  if (!questions?.length) return null;

  const filters = session?.parsed_filters || {};
  const requested = session?.requested_count || questions.length;
  const available = session?.available_count;
  const statusLabel = SESSION_STATUS_LABELS[session?.status] || session?.status;
  const showActions = !readOnly && (actions?.can_approve || actions?.can_regenerate);
  const canAdjust = !readOnly && (actions?.can_adjust || actions?.can_regenerate);
  const hasExam = session?.exam_id && session?.exam_type;
  const hasSecondary =
    (showActions && actions?.can_regenerate) || !!onExportPdf || hasExam;

  const ToolBtn = ({ icon, label, onClick, isLoading, loadingText }) => (
    <Button
      flex={1}
      h="44px"
      variant="ghost"
      borderRadius="0"
      fontWeight="600"
      fontSize="sm"
      color={toolColor}
      bg="transparent"
      leftIcon={<Icon as={icon} boxSize={3.5} opacity={0.9} />}
      _hover={{ bg: toolHover }}
      _active={{ bg: toolHover }}
      onClick={onClick}
      isLoading={isLoading}
      loadingText={loadingText}
    >
      {label}
    </Button>
  );

  const ActionsBlock = (
    <Box
      borderWidth="1px"
      borderColor={barBorder}
      borderRadius="16px"
      bg={barBg}
      overflow="hidden"
    >
      {showActions && actions?.can_approve && (
        <Box px={3} pt={3} pb={hasSecondary ? 2 : 3}>
          <Button
            w="full"
            h="52px"
            borderRadius="12px"
            bg={ACCENT}
            color="white"
            fontWeight="700"
            fontSize="md"
            leftIcon={
              <Flex
                w="26px"
                h="26px"
                borderRadius="full"
                bg="whiteAlpha.200"
                align="center"
                justify="center"
              >
                <Icon as={FaCheck} boxSize={3} />
              </Flex>
            }
            boxShadow="none"
            _hover={{ bg: ACCENT_HOVER }}
            _active={{ bg: ACCENT_HOVER, transform: "translateY(1px)" }}
            onClick={onApprove}
            isLoading={approving}
            loadingText="جاري الاعتماد..."
          >
            اعتماد الأسئلة
          </Button>
          <Text mt={2} fontSize="11px" color={hintColor} textAlign="center">
            راجع الأسئلة ثم اعتمد النسخة النهائية
          </Text>
        </Box>
      )}

      {hasSecondary && (
        <Box
          borderTopWidth={showActions && actions?.can_approve ? "1px" : 0}
          borderColor={barBorder}
          bg={toolBg}
        >
          <Flex
            align="stretch"
            divideX={undefined}
            sx={{
              "& > *:not(:last-child)": {
                borderInlineEnd: "1px solid",
                borderColor: toolDivider,
              },
            }}
          >
            {showActions && actions?.can_regenerate && (
              <ToolBtn
                icon={FaSync}
                label="إعادة اختيار"
                onClick={onRegenerate}
                isLoading={regenerating}
                loadingText="جاري..."
              />
            )}
            {onExportPdf && (
              <ToolBtn
                icon={FaFilePdf}
                label={`PDF (${questions.length})`}
                onClick={onExportPdf}
                isLoading={exportingPdf}
                loadingText="جاري..."
              />
            )}
            {hasExam && (
              <ToolBtn
                icon={FaExternalLinkAlt}
                label={`الامتحان #${session.exam_id}`}
                onClick={onOpenExam}
              />
            )}
          </Flex>
        </Box>
      )}

      {!showActions && !hasExam && readOnly && (
        <Text fontSize="sm" color={muted} textAlign="center" py={3}>
          طلب معتمد — للعرض فقط
        </Text>
      )}
    </Box>
  );

  return (
    <Box
      bg={panelBg}
      borderWidth={embedded ? 0 : "1px"}
      borderColor={border}
      borderRadius={embedded ? "xl" : "2xl"}
      overflow="hidden"
      boxShadow={embedded ? "none" : "sm"}
    >
      {!embedded && <Box h="3px" bg={ACCENT} />}

      <Flex
        px={{ base: 3, md: 4 }}
        py={{ base: 3, md: 3.5 }}
        borderBottomWidth="1px"
        borderColor={border}
        align="center"
        justify="space-between"
        gap={2}
      >
        <HStack spacing={2.5} minW={0}>
          <Flex w={9} h={9} borderRadius="xl" bg={iconHeaderBg} align="center" justify="center" flexShrink={0}>
            <Icon as={FiLayers} color={ACCENT} boxSize={4} />
          </Flex>
          <Box minW={0}>
            <Text fontSize={{ base: "sm", md: "md" }} fontWeight="800" noOfLines={1}>
              مقترح الامتحان
            </Text>
            <Text fontSize="xs" color={muted} noOfLines={1}>
              اضغط السؤال لعرضه · {questions.length} سؤال
            </Text>
          </Box>
        </HStack>
        <Badge
          colorScheme={session?.status === "approved" ? "green" : "blue"}
          variant="subtle"
          px={2.5}
          py={1}
          borderRadius="full"
          fontSize="10px"
          flexShrink={0}
        >
          {statusLabel}
        </Badge>
      </Flex>

      {!hideReply && reply && (
        <Box px={{ base: 3, md: 4 }} py={3} borderBottomWidth="1px" borderColor={border}>
          <ReplyText text={reply} />
        </Box>
      )}

      <HStack
        spacing={2}
        px={{ base: 3, md: 4 }}
        py={3}
        borderBottomWidth="1px"
        borderColor={border}
        overflowX="auto"
        align="stretch"
        sx={{ WebkitOverflowScrolling: "touch" }}
      >
        <MetricChip icon={FiTarget} label="مختار" value={questions.length} accent={ACCENT} />
        <MetricChip icon={FiLayers} label="مطلوب" value={requested} />
        <MetricChip icon={FiDatabase} label="متاح" value={available ?? "—"} />
      </HStack>

      {(filters.matched_chapters?.length > 0 || filters.matched_lessons?.length > 0) && (
        <Box px={{ base: 3, md: 4 }} py={2.5} borderBottomWidth="1px" borderColor={border}>
          <Text fontSize="10px" fontWeight="700" color={muted} mb={1.5}>
            نطاق الاختيار
          </Text>
          <HStack spacing={1.5} flexWrap="wrap">
            {filters.matched_chapters?.map((ch) => (
              <Badge key={ch.id} variant="outline" fontSize="10px" borderRadius="md" px={2}>
                {ch.name}
              </Badge>
            ))}
            {filters.matched_lessons?.slice(0, 4).map((ls) => (
              <Badge key={ls.id} colorScheme="gray" variant="subtle" fontSize="10px" borderRadius="md" px={2}>
                {ls.name}
              </Badge>
            ))}
          </HStack>
        </Box>
      )}

      <Box px={{ base: 2.5, md: 3.5 }} py={{ base: 2.5, md: 3.5 }}>
        <VStack spacing={2} align="stretch">
          {questions.map((q, idx) => (
            <ProposalQuestionCard
              key={`${idx}-${q.source}-${q.id}`}
              item={q}
              index={idx}
              defaultExpanded={idx === 0 && focusQuestionIndex == null}
              forceExpanded={focusQuestionIndex === idx}
              canAdjust={canAdjust}
              adjusting={adjusting}
              onRemove={onRemoveQuestion}
              onReplace={onReplaceQuestion}
            />
          ))}
        </VStack>
      </Box>

      {filters.unresolved_notes?.length > 0 && (
        <Box px={{ base: 3, md: 4 }} pb={3}>
          <Text fontSize="xs" color="orange.600" bg={noteBg} px={3} py={2} borderRadius="lg" _dark={{ color: "orange.200" }}>
            {filters.unresolved_notes.join(" — ")}
          </Text>
        </Box>
      )}

      <Divider borderColor={border} />

      {/* Desktop / normal footer */}
      <Box
        display={{ base: embedded ? "none" : "block", md: "block" }}
        px={{ base: 3, md: 4 }}
        py={{ base: 3, md: 3.5 }}
        bg={footerBg}
      >
        {ActionsBlock}
      </Box>

      {/* Mobile sticky actions when embedded in chat */}
      {embedded && (showActions || hasExam || onExportPdf) ? (
        <Box
          display={{ base: "block", md: "none" }}
          position="sticky"
          bottom={0}
          zIndex={4}
          px={3}
          py={2.5}
          bg={footerBg}
          borderTopWidth="1px"
          borderColor={border}
          boxShadow={stickyShadow}
          sx={{ pb: "max(10px, env(safe-area-inset-bottom))" }}
        >
          {ActionsBlock}
        </Box>
      ) : null}
    </Box>
  );
}
