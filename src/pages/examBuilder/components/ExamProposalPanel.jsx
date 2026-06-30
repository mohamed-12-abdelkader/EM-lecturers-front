import React from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Badge,
  VStack,
  HStack,
  SimpleGrid,
  useColorModeValue,
  Icon,
  Divider,
} from "@chakra-ui/react";
import { FaCheck, FaSync, FaExternalLinkAlt, FaFilePdf } from "react-icons/fa";
import { FiLayers, FiTarget, FiDatabase } from "react-icons/fi";
import ProposalQuestionCard from "./ProposalQuestionCard";
import { renderMarkdownInline, SESSION_STATUS_LABELS } from "../examBuilderUtils";
import { ACCENT } from "../examBuilderTheme";

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
        )
      )}
    </Text>
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
  exportingPdf = false,
  regenerating,
  approving,
  readOnly = false,
  hideReply = false,
  embedded = false,
}) {
  const panelBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const footerBg = useColorModeValue("gray.50", "gray.900");

  const iconHeaderBg = useColorModeValue("blue.50", "blue.900");

  if (!questions?.length) return null;

  const filters = session?.parsed_filters || {};
  const requested = session?.requested_count || questions.length;
  const available = session?.available_count;
  const statusLabel = SESSION_STATUS_LABELS[session?.status] || session?.status;
  const showActions = !readOnly && (actions?.can_approve || actions?.can_regenerate);
  const hasExam = session?.exam_id && session?.exam_type;

  return (
    <Box
      bg={panelBg}
      borderWidth={embedded ? 0 : "1px"}
      borderColor={border}
      borderRadius={embedded ? "lg" : "xl"}
      overflow="hidden"
      boxShadow={embedded ? "none" : "sm"}
    >
      {!embedded && <Box h="3px" bg={ACCENT} />}

      <Flex
        px={{ base: 3, md: 4, lg: 6 }}
        py={{ base: 3, md: 4 }}
        borderBottomWidth="1px"
        borderColor={border}
        align={{ base: "start", sm: "center" }}
        justify="space-between"
        gap={3}
        flexWrap="wrap"
      >
        <HStack spacing={3}>
          <Flex
            w={9}
            h={9}
            borderRadius="lg"
            bg={iconHeaderBg}
            align="center"
            justify="center"
          >
            <Icon as={FiLayers} color={ACCENT} boxSize={4} />
          </Flex>
          <Box>
            <Text fontSize="md" fontWeight="bold">
              مقترح الامتحان
            </Text>
            <Text fontSize="xs" color={muted}>
              {questions.length} سؤال مختار من بنك أسئلتك
            </Text>
          </Box>
        </HStack>
        <HStack spacing={2} flexWrap="wrap">
          {onExportPdf && (
            <Button
              size="sm"
              variant="outline"
              borderRadius="lg"
              leftIcon={<Icon as={FaFilePdf} />}
              onClick={onExportPdf}
              isLoading={exportingPdf}
              loadingText="جاري التصدير"
              display={{ base: "none", sm: "inline-flex" }}
            >
              تنزيل PDF
            </Button>
          )}
          <Badge
            colorScheme={session?.status === "approved" ? "green" : "blue"}
            variant="subtle"
            px={3}
            py={1}
            borderRadius="full"
            fontSize="xs"
          >
            {statusLabel}
          </Badge>
        </HStack>
      </Flex>

      {!hideReply && reply && (
        <Box px={{ base: 4, md: 6 }} py={3} borderBottomWidth="1px" borderColor={border}>
          <ReplyText text={reply} />
        </Box>
      )}

      <SimpleGrid
        columns={{ base: 1, sm: 3 }}
        gap={3}
        px={{ base: 4, md: 6 }}
        py={4}
        borderBottomWidth="1px"
        borderColor={border}
      >
        <MetricCard icon={FiTarget} label="مختار" value={questions.length} accent={ACCENT} />
        <MetricCard icon={FiLayers} label="مطلوب" value={requested} />
        <MetricCard icon={FiDatabase} label="متاح في البنك" value={available ?? "—"} />
      </SimpleGrid>

      {(filters.matched_chapters?.length > 0 || filters.matched_lessons?.length > 0) && (
        <Box px={{ base: 4, md: 6 }} py={3} borderBottomWidth="1px" borderColor={border}>
          <Text fontSize="xs" fontWeight="semibold" color={muted} mb={2}>
            نطاق الاختيار
          </Text>
          <HStack spacing={2} flexWrap="wrap">
            {filters.matched_chapters?.map((ch) => (
              <Badge key={ch.id} variant="outline" fontSize="xs" borderRadius="md" px={2}>
                {ch.name}
              </Badge>
            ))}
            {filters.matched_lessons?.slice(0, 4).map((ls) => (
              <Badge key={ls.id} colorScheme="gray" variant="subtle" fontSize="xs" borderRadius="md" px={2}>
                {ls.name}
              </Badge>
            ))}
          </HStack>
        </Box>
      )}

      <Box px={{ base: 3, md: 4, lg: 6 }} py={{ base: 3, md: 4 }}>
        <VStack spacing={3} align="stretch">
          {questions.map((q, idx) => (
            <ProposalQuestionCard key={`${q.source}-${q.id}`} item={q} index={idx} />
          ))}
        </VStack>
      </Box>

      {filters.unresolved_notes?.length > 0 && (
        <Box px={{ base: 4, md: 6 }} pb={3}>
          <Text fontSize="xs" color="orange.600" bg={useColorModeValue("orange.50", "orange.900")} px={3} py={2} borderRadius="md">
            {filters.unresolved_notes.join(" — ")}
          </Text>
        </Box>
      )}

      <Divider borderColor={border} />

      <Box px={{ base: 3, md: 4, lg: 6 }} py={{ base: 3, md: 4 }} bg={footerBg}>
        {onExportPdf && (
          <Button
            size="md"
            w="full"
            mb={hasExam || showActions ? 3 : 0}
            variant="outline"
            colorScheme="red"
            borderRadius="lg"
            leftIcon={<Icon as={FaFilePdf} />}
            onClick={onExportPdf}
            isLoading={exportingPdf}
            loadingText="جاري إنشاء PDF..."
            display={{ base: "flex", sm: "none" }}
          >
            تنزيل PDF ({questions.length} سؤال)
          </Button>
        )}
        {hasExam && (
          <Button
            size="md"
            w="full"
            mb={showActions ? 3 : 0}
            variant="outline"
            colorScheme="blue"
            borderRadius="lg"
            leftIcon={<Icon as={FaExternalLinkAlt} />}
            onClick={onOpenExam}
          >
            فتح الامتحان #{session.exam_id}
          </Button>
        )}
        {showActions && (
          <Flex direction={{ base: "column", sm: "row" }} gap={2}>
            {actions?.can_approve && (
              <Button
                flex={1}
                size={{ base: "md", md: "md" }}
                w={{ base: "full", sm: "auto" }}
                bg={ACCENT}
                color="white"
                borderRadius="lg"
                leftIcon={<Icon as={FaCheck} />}
                _hover={{ bg: "#004494" }}
                onClick={onApprove}
                isLoading={approving}
              >
                اعتماد الأسئلة
              </Button>
            )}
            {actions?.can_regenerate && (
              <Button
                flex={1}
                size={{ base: "md", md: "md" }}
                w={{ base: "full", sm: "auto" }}
                variant="outline"
                borderRadius="lg"
                leftIcon={<Icon as={FaSync} />}
                onClick={onRegenerate}
                isLoading={regenerating}
              >
                إعادة اختيار
              </Button>
            )}
          </Flex>
        )}
        {!showActions && !hasExam && readOnly && (
          <Text fontSize="sm" color={muted} textAlign="center" py={1}>
            طلب معتمد — للعرض فقط
          </Text>
        )}
      </Box>
    </Box>
  );
}

function MetricCard({ icon, label, value, accent }) {
  const bg = useColorModeValue("gray.50", "gray.900");
  const border = useColorModeValue("gray.100", "gray.700");
  const text = useColorModeValue("gray.800", "white");
  const muted = useColorModeValue("gray.500", "gray.400");
  const iconBg = useColorModeValue("white", "gray.800");
  const defaultIconColor = useColorModeValue("gray.600", "gray.300");

  return (
    <Flex
      align="center"
      gap={3}
      px={4}
      py={3}
      bg={bg}
      borderWidth="1px"
      borderColor={border}
      borderRadius="xl"
    >
      <Flex
        w={10}
        h={10}
        borderRadius="lg"
        bg={iconBg}
        align="center"
        justify="center"
        boxShadow="sm"
      >
        <Icon as={icon} color={accent || defaultIconColor} boxSize={4} />
      </Flex>
      <Box>
        <Text fontSize="xl" fontWeight="bold" color={text} lineHeight="1">
          {value}
        </Text>
        <Text fontSize="xs" color={muted} mt={0.5}>
          {label}
        </Text>
      </Box>
    </Flex>
  );
}
