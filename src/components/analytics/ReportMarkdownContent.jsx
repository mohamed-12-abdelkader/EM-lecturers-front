import React from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Heading,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useColorModeValue,
} from "@chakra-ui/react";

function renderInlineMarkdown(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text as="span" key={index} fontWeight="semibold" color="inherit">
          {part.slice(2, -2)}
        </Text>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function parseTableRow(line) {
  const trimmed = String(line).trim();
  if (!trimmed.startsWith("|")) return null;
  const cells = trimmed
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
  return cells.length ? cells : null;
}

function isTableSeparator(line) {
  return /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(String(line).trim());
}

function parseMarkdownBlocks(content) {
  const lines = String(content || "").split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (trimmed.startsWith("|")) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i += 1;
      }
      const rows = tableLines
        .filter((line) => !isTableSeparator(line))
        .map(parseTableRow)
        .filter(Boolean);
      if (rows.length > 0) {
        blocks.push({
          type: "table",
          headers: rows[0],
          rows: rows.slice(1),
        });
      }
      continue;
    }

    if (trimmed.startsWith("> ")) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quoteLines.push(lines[i].trim().slice(2));
        i += 1;
      }
      blocks.push({ type: "blockquote", text: quoteLines.join("\n") });
      continue;
    }

    if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: `h${headingMatch[1].length}`,
        text: headingMatch[2],
      });
      i += 1;
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      blocks.push({ type: "ul", text: trimmed.slice(2) });
      i += 1;
      continue;
    }

    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (orderedMatch) {
      blocks.push({ type: "ol", number: orderedMatch[1], text: orderedMatch[2] });
      i += 1;
      continue;
    }

    const paraLines = [];
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t) break;
      if (
        t.startsWith("|") ||
        t.startsWith("> ") ||
        /^-{3,}$/.test(t) ||
        /^#{1,4}\s/.test(t) ||
        t.startsWith("- ") ||
        t.startsWith("* ") ||
        /^\d+\.\s/.test(t)
      ) {
        break;
      }
      paraLines.push(lines[i]);
      i += 1;
    }
    if (paraLines.length) {
      blocks.push({ type: "p", text: paraLines.join("\n") });
    }
  }

  return blocks;
}

function ReportTable({ headers, rows }) {
  const headerBg = useColorModeValue("gray.100", "gray.700");
  const headerColor = useColorModeValue("gray.700", "gray.100");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const rowEven = useColorModeValue("white", "gray.800");
  const rowOdd = useColorModeValue("gray.50", "gray.900");
  const cellColor = useColorModeValue("gray.700", "gray.200");

  const colCount = Math.max(headers?.length || 0, ...rows.map((r) => r.length));

  const normalizeRow = (row) => {
    const cells = [...(row || [])];
    while (cells.length < colCount) cells.push("");
    return cells.slice(0, colCount);
  };

  const normalizedHeaders = normalizeRow(headers);
  const normalizedRows = rows.map(normalizeRow);

  return (
    <TableContainer
      w="full"
      maxW="100%"
      overflowX="auto"
      borderRadius="md"
      borderWidth="1px"
      borderColor={borderColor}
      my={1}
    >
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            {normalizedHeaders.map((cell, idx) => (
              <Th
                key={idx}
                bg={headerBg}
                color={headerColor}
                fontSize="xs"
                fontWeight="semibold"
                py={2.5}
                px={3}
                whiteSpace="nowrap"
                borderColor={borderColor}
                textTransform="none"
                letterSpacing="normal"
              >
                {renderInlineMarkdown(cell)}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {normalizedRows.map((row, rowIdx) => (
            <Tr key={rowIdx} bg={rowIdx % 2 === 0 ? rowEven : rowOdd}>
              {row.map((cell, cellIdx) => (
                <Td
                  key={cellIdx}
                  fontSize="xs"
                  py={2.5}
                  px={3}
                  color={cellColor}
                  fontWeight={cellIdx === 0 ? "medium" : "normal"}
                  borderColor={borderColor}
                  whiteSpace={cellIdx === 0 ? "normal" : "nowrap"}
                  maxW={{ base: "180px", md: "260px" }}
                >
                  {renderInlineMarkdown(cell)}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}

export default function ReportMarkdownContent({ content }) {
  const headingColor = useColorModeValue("gray.800", "gray.100");
  const bodyColor = useColorModeValue("gray.700", "gray.200");
  const muted = useColorModeValue("gray.600", "gray.400");
  const quoteBg = useColorModeValue("gray.50", "gray.900");
  const quoteBorder = useColorModeValue("gray.300", "gray.600");
  const dividerColor = useColorModeValue("gray.200", "gray.600");

  const blocks = parseMarkdownBlocks(content);

  return (
    <VStack align="stretch" spacing={3} w="full">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "table":
            return (
              <ReportTable
                key={index}
                headers={block.headers}
                rows={block.rows}
              />
            );
          case "blockquote":
            return (
              <Box
                key={index}
                px={3}
                py={2.5}
                borderRadius="md"
                bg={quoteBg}
                borderRightWidth="3px"
                borderRightColor={quoteBorder}
              >
                <Text fontSize="sm" lineHeight="1.75" color={muted}>
                  {renderInlineMarkdown(block.text)}
                </Text>
              </Box>
            );
          case "hr":
            return <Divider key={index} borderColor={dividerColor} />;
          case "h1":
            return (
              <Heading key={index} size="sm" color={headingColor} pt={1}>
                {renderInlineMarkdown(block.text)}
              </Heading>
            );
          case "h2":
            return (
              <Text key={index} fontSize="md" fontWeight="semibold" color={headingColor} pt={1}>
                {renderInlineMarkdown(block.text)}
              </Text>
            );
          case "h3":
          case "h4":
            return (
              <Text key={index} fontSize="sm" fontWeight="semibold" color={headingColor} pt={1}>
                {renderInlineMarkdown(block.text)}
              </Text>
            );
          case "ul":
            return (
              <HStack key={index} align="start" spacing={2.5}>
                <Text fontSize="sm" color={muted} flexShrink={0} mt="2px">
                  •
                </Text>
                <Text fontSize="sm" lineHeight="1.75" flex={1} color={bodyColor}>
                  {renderInlineMarkdown(block.text)}
                </Text>
              </HStack>
            );
          case "ol":
            return (
              <HStack key={index} align="start" spacing={2.5}>
                <Text fontSize="sm" fontWeight="medium" color={muted} flexShrink={0} minW="1.25rem">
                  {block.number}.
                </Text>
                <Text fontSize="sm" lineHeight="1.75" flex={1} color={bodyColor}>
                  {renderInlineMarkdown(block.text)}
                </Text>
              </HStack>
            );
          default:
            return (
              <Text
                key={index}
                fontSize="sm"
                lineHeight="1.75"
                whiteSpace="pre-wrap"
                color={bodyColor}
              >
                {renderInlineMarkdown(block.text)}
              </Text>
            );
        }
      })}
    </VStack>
  );
}
